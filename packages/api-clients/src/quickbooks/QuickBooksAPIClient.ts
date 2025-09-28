/**
 * 💼 QuickBooks API Client
 * Mirrors: CyntientOps/Services/QuickBooks/QuickBooksOAuthManager.swift
 * Purpose: Payroll integration and financial data management
 */

import { APIClient } from '../base/APIClient';

export interface QuickBooksCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  companyId?: string;
  realmId?: string;
}

export interface QuickBooksEmployee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  employeeNumber?: string;
  status: 'Active' | 'Inactive';
  hireDate?: string;
  hourlyRate?: number;
}

export interface QuickBooksTimeEntry {
  id: string;
  employeeId: string;
  customerId?: string;
  itemId?: string;
  hours: number;
  date: string;
  description?: string;
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
}

export interface QuickBooksPayrollData {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeRate: number;
  grossPay: number;
  deductions: {
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    other: number;
  };
  netPay: number;
}

export class QuickBooksAPIClient extends APIClient {
  private credentials: QuickBooksCredentials;
  private baseURL = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  private authURL = 'https://appcenter.intuit.com/connect/oauth2';

  constructor(credentials: QuickBooksCredentials) {
    super();
    this.credentials = credentials;
  }

  /**
   * Initialize QuickBooks OAuth flow
   */
  async initializeOAuth(): Promise<string> {
    const authParams = new URLSearchParams({
      client_id: this.credentials.clientId,
      scope: 'com.intuit.quickbooks.accounting com.intuit.quickbooks.payment',
      redirect_uri: 'cyntientops://quickbooks/callback',
      response_type: 'code',
      access_type: 'offline',
      state: this.generateState(),
    });

    const authURL = `${this.authURL}?${authParams.toString()}`;
    return authURL;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, realmId: string): Promise<QuickBooksCredentials> {
    try {
      const response = await this.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'cyntientops://quickbooks/callback',
      }, {
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.credentials = {
        ...this.credentials,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        realmId,
      };

      return this.credentials;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<QuickBooksCredentials> {
    if (!this.credentials.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
      }, {
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.credentials = {
        ...this.credentials,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || this.credentials.refreshToken,
      };

      return this.credentials;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Get all employees from QuickBooks
   */
  async getEmployees(): Promise<QuickBooksEmployee[]> {
    try {
      const response = await this.get(`${this.baseURL}/${this.credentials.realmId}/employees`, {
        headers: this.getAuthHeaders(),
      });

      return response.QueryResponse.Employee.map(this.mapEmployee);
    } catch (error) {
      console.error('Failed to get employees:', error);
      throw error;
    }
  }

  /**
   * Create or update employee in QuickBooks
   */
  async syncEmployee(workerData: any): Promise<QuickBooksEmployee> {
    try {
      const employeeData = {
        Name: workerData.name,
        PrimaryEmailAddr: {
          Address: workerData.email,
        },
        PrimaryPhone: {
          FreeFormNumber: workerData.phone,
        },
        EmployeeNumber: workerData.id,
        Status: 'Active',
      };

      const response = await this.post(`${this.baseURL}/${this.credentials.realmId}/employees`, employeeData, {
        headers: this.getAuthHeaders(),
      });

      return this.mapEmployee(response.Employee);
    } catch (error) {
      console.error('Failed to sync employee:', error);
      throw error;
    }
  }

  /**
   * Create time entry for employee
   */
  async createTimeEntry(timeEntry: Omit<QuickBooksTimeEntry, 'id'>): Promise<QuickBooksTimeEntry> {
    try {
      const timeEntryData = {
        EmployeeRef: {
          value: timeEntry.employeeId,
        },
        TxnDate: timeEntry.date,
        Hours: timeEntry.hours,
        Description: timeEntry.description,
        Billable: timeEntry.billable,
        HourlyRate: timeEntry.hourlyRate,
      };

      const response = await this.post(`${this.baseURL}/${this.credentials.realmId}/timeactivities`, timeEntryData, {
        headers: this.getAuthHeaders(),
      });

      return this.mapTimeEntry(response.TimeActivity);
    } catch (error) {
      console.error('Failed to create time entry:', error);
      throw error;
    }
  }

  /**
   * Get time entries for a specific period
   */
  async getTimeEntries(startDate: string, endDate: string): Promise<QuickBooksTimeEntry[]> {
    try {
      const query = `SELECT * FROM TimeActivity WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;
      const response = await this.get(`${this.baseURL}/${this.credentials.realmId}/query?query=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders(),
      });

      return response.QueryResponse.TimeActivity.map(this.mapTimeEntry);
    } catch (error) {
      console.error('Failed to get time entries:', error);
      throw error;
    }
  }

  /**
   * Calculate payroll data for a period
   */
  async calculatePayroll(employeeId: string, startDate: string, endDate: string): Promise<QuickBooksPayrollData> {
    try {
      const timeEntries = await this.getTimeEntries(startDate, endDate);
      const employeeEntries = timeEntries.filter(entry => entry.employeeId === employeeId);

      const totalHours = employeeEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(totalHours - 40, 0);

      // Get employee hourly rate (would be fetched from employee data)
      const hourlyRate = 25; // Default rate, should be fetched from employee
      const overtimeRate = hourlyRate * 1.5;

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const grossPay = regularPay + overtimePay;

      // Calculate deductions (simplified)
      const federalTax = grossPay * 0.12;
      const stateTax = grossPay * 0.05;
      const socialSecurity = grossPay * 0.062;
      const medicare = grossPay * 0.0145;

      const totalDeductions = federalTax + stateTax + socialSecurity + medicare;
      const netPay = grossPay - totalDeductions;

      return {
        employeeId,
        periodStart: startDate,
        periodEnd: endDate,
        regularHours,
        overtimeHours,
        regularRate: hourlyRate,
        overtimeRate,
        grossPay,
        deductions: {
          federalTax,
          stateTax,
          socialSecurity,
          medicare,
          other: 0,
        },
        netPay,
      };
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
      throw error;
    }
  }

  /**
   * Sync worker clock-in/out data with QuickBooks
   */
  async syncClockData(workerId: string, clockInTime: Date, clockOutTime: Date, buildingId: string): Promise<void> {
    try {
      const hours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      const date = clockInTime.toISOString().split('T')[0];

      await this.createTimeEntry({
        employeeId: workerId,
        date,
        hours,
        description: `Work at building ${buildingId}`,
        billable: true,
        hourlyRate: 25, // Should be fetched from employee data
      });

      console.log(`Clock data synced for worker ${workerId}: ${hours} hours`);
    } catch (error) {
      console.error('Failed to sync clock data:', error);
      throw error;
    }
  }

  private getBasicAuth(): string {
    return Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private mapEmployee(qbEmployee: any): QuickBooksEmployee {
    return {
      id: qbEmployee.Id,
      name: qbEmployee.Name,
      email: qbEmployee.PrimaryEmailAddr?.Address || '',
      phone: qbEmployee.PrimaryPhone?.FreeFormNumber,
      address: qbEmployee.PrimaryAddr ? {
        line1: qbEmployee.PrimaryAddr.Line1,
        city: qbEmployee.PrimaryAddr.City,
        state: qbEmployee.PrimaryAddr.CountrySubDivisionCode,
        postalCode: qbEmployee.PrimaryAddr.PostalCode,
      } : undefined,
      employeeNumber: qbEmployee.EmployeeNumber,
      status: qbEmployee.Status,
      hireDate: qbEmployee.HireDate,
      hourlyRate: qbEmployee.BillableTime ? qbEmployee.BillableTime.HourlyRate : undefined,
    };
  }

  private mapTimeEntry(qbTimeEntry: any): QuickBooksTimeEntry {
    return {
      id: qbTimeEntry.Id,
      employeeId: qbTimeEntry.EmployeeRef.value,
      customerId: qbTimeEntry.CustomerRef?.value,
      itemId: qbTimeEntry.ItemRef?.value,
      hours: qbTimeEntry.Hours,
      date: qbTimeEntry.TxnDate,
      description: qbTimeEntry.Description,
      billable: qbTimeEntry.Billable,
      hourlyRate: qbTimeEntry.HourlyRate,
      totalAmount: qbTimeEntry.Hours * (qbTimeEntry.HourlyRate || 0),
    };
  }
}

// Default QuickBooks credentials from Swift app
export const DEFAULT_QUICKBOOKS_CREDENTIALS: QuickBooksCredentials = {
  clientId: 'ABAQSi9dc27v4DHpdawcoZpHgmRHOnXMdCXTDTv5fTv3PWOiS',
  clientSecret: 'plfYbZc7hhwnATBtPqIVcB7Ak9bxAtz6IUYSQfD7',
};
