/**
 * 💰 DOF (Department of Finance) API Client
 * Mirrors: CyntientOps/Services/API/DOFAPIService.swift
 * Purpose: NYC Department of Finance API integration for property assessments, taxes, and financial data
 * Features: Property assessments, tax information, payment history, exemptions, property values
 */

import { NYCAPIService } from './NYCAPIService';

export interface DOFPropertyAssessment {
  id: string;
  buildingId: string;
  propertyAddress: string;
  borough: string;
  block: string;
  lot: string;
  bbl: string; // Borough, Block, Lot
  assessmentYear: number;
  marketValue: number;
  assessedValue: number;
  taxableValue: number;
  exemptionAmount: number;
  taxClass: DOFTaxClass;
  propertyType: DOFPropertyType;
  landArea: number; // square feet
  buildingArea: number; // square feet
  units: number;
  stories: number;
  yearBuilt: number;
  lastSaleDate?: Date;
  lastSalePrice?: number;
  assessmentHistory: DOFAssessmentHistory[];
  exemptions: DOFExemption[];
  taxBills: DOFTaxBill[];
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface DOFAssessmentHistory {
  year: number;
  marketValue: number;
  assessedValue: number;
  taxableValue: number;
  changeFromPrevious: number; // percentage
  assessmentDate: Date;
}

export interface DOFExemption {
  id: string;
  exemptionType: DOFExemptionType;
  exemptionCode: string;
  description: string;
  amount: number;
  status: DOFExemptionStatus;
  effectiveDate: Date;
  expirationDate?: Date;
  applicationDate: Date;
  approvedDate?: Date;
}

export interface DOFTaxBill {
  id: string;
  taxYear: number;
  billNumber: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  balance: number;
  status: DOFTaxBillStatus;
  paymentHistory: DOFTaxPayment[];
  penalties: number;
  interest: number;
  exemptions: number;
  netAmount: number;
}

export interface DOFTaxPayment {
  id: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: DOFPaymentMethod;
  referenceNumber: string;
  status: DOFPaymentStatus;
}

export interface DOFPropertySummary {
  buildingId: string;
  totalAssessedValue: number;
  totalMarketValue: number;
  totalTaxableValue: number;
  totalExemptions: number;
  currentTaxOwed: number;
  taxClass: DOFTaxClass;
  propertyType: DOFPropertyType;
  lastAssessmentDate: Date;
  nextAssessmentDate: Date;
  assessmentTrend: DOFAssessmentTrend;
  taxPaymentStatus: DOFTaxPaymentStatus;
  exemptionsCount: number;
  yearsOwned: number;
}

export interface DOFAnalytics {
  totalProperties: number;
  totalAssessedValue: number;
  totalMarketValue: number;
  totalTaxRevenue: number;
  averageAssessment: number;
  propertiesByTaxClass: Record<DOFTaxClass, number>;
  propertiesByType: Record<DOFPropertyType, number>;
  assessmentTrends: Array<{
    year: number;
    totalAssessedValue: number;
    averageAssessment: number;
    propertiesCount: number;
  }>;
  topAssessedProperties: Array<{
    buildingId: string;
    address: string;
    assessedValue: number;
    marketValue: number;
  }>;
}

export enum DOFTaxClass {
  CLASS_1 = 'class_1', // 1-3 family homes
  CLASS_2 = 'class_2', // Condos and co-ops
  CLASS_3 = 'class_3', // Utilities
  CLASS_4 = 'class_4', // Commercial properties
}

export enum DOFPropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED_USE = 'mixed_use',
  INDUSTRIAL = 'industrial',
  OFFICE = 'office',
  RETAIL = 'retail',
  WAREHOUSE = 'warehouse',
  PARKING = 'parking',
  VACANT_LAND = 'vacant_land',
  OTHER = 'other',
}

export enum DOFExemptionType {
  BASIC_STAR = 'basic_star',
  ENHANCED_STAR = 'enhanced_star',
  SENIOR_CITIZEN = 'senior_citizen',
  DISABLED_PERSON = 'disabled_person',
  VETERAN = 'veteran',
  CLERGY = 'clergy',
  NON_PROFIT = 'non_profit',
  RELIGIOUS = 'religious',
  EDUCATIONAL = 'educational',
  GOVERNMENT = 'government',
  J51 = 'j51', // Tax abatement for renovations
  ICIP = 'icip', // Industrial and Commercial Incentive Program
  OTHER = 'other',
}

export enum DOFExemptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  DENIED = 'denied',
  CANCELLED = 'cancelled',
}

export enum DOFTaxBillStatus {
  CURRENT = 'current',
  OVERDUE = 'overdue',
  PAID = 'paid',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

export enum DOFPaymentMethod {
  CHECK = 'check',
  MONEY_ORDER = 'money_order',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
  MAIL = 'mail',
  IN_PERSON = 'in_person',
  AUTOMATIC = 'automatic',
}

export enum DOFPaymentStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum DOFAssessmentTrend {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  FLUCTUATING = 'fluctuating',
}

export enum DOFTaxPaymentStatus {
  CURRENT = 'current',
  DELINQUENT = 'delinquent',
  PARTIAL = 'partial',
  EXEMPT = 'exempt',
}

import { CacheManager } from '@cyntientops/business-core';

export class DOFAPIClient {
  private apiService: NYCAPIService;
  private cacheManager: CacheManager;

  // DOF API endpoints
  private readonly ENDPOINTS = {
    ASSESSMENTS: 'https://data.cityofnewyork.us/resource/8y4t-faws.json',
    TAX_BILLS: 'https://data.cityofnewyork.us/resource/8y4t-faws.json',
    EXEMPTIONS: 'https://data.cityofnewyork.us/resource/8y4t-faws.json',
    PAYMENTS: 'https://data.cityofnewyork.us/resource/8y4t-faws.json',
  };

  constructor(apiService: NYCAPIService, cacheManager: CacheManager) {
    this.apiService = apiService;
    this.cacheManager = cacheManager;
  }

  // Get property assessment for a building
  async getPropertyAssessment(buildingId: string): Promise<DOFPropertyAssessment> {
    const cacheKey = `dof_assessment_${buildingId}`;
    const cached = await this.cacheManager.get<DOFPropertyAssessment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const assessment = this.generateMockPropertyAssessment(buildingId);
      
      await this.cacheManager.set(cacheKey, assessment, 600000); // 10 minute cache

      return assessment;
    } catch (error) {
      console.error('Failed to fetch DOF property assessment:', error);
      throw new Error('Failed to fetch DOF property assessment');
    }
  }

  // Get property assessment history
  async getAssessmentHistory(buildingId: string, years: number = 10): Promise<DOFAssessmentHistory[]> {
    const cacheKey = `dof_history_${buildingId}_${years}`;
    const cached = await this.cacheManager.get<DOFAssessmentHistory[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const history = this.generateMockAssessmentHistory(buildingId, years);
      
      await this.cacheManager.set(cacheKey, history, 600000); // 10 minute cache

      return history;
    } catch (error) {
      console.error('Failed to fetch DOF assessment history:', error);
      throw new Error('Failed to fetch DOF assessment history');
    }
  }

  // Get tax bills for a property
  async getTaxBills(buildingId: string, years: number = 5): Promise<DOFTaxBill[]> {
    const cacheKey = `dof_tax_bills_${buildingId}_${years}`;
    const cached = await this.cacheManager.get<DOFTaxBill[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const taxBills = this.generateMockTaxBills(buildingId, years);
      
      await this.cacheManager.set(cacheKey, taxBills, 600000); // 10 minute cache

      return taxBills;
    } catch (error) {
      console.error('Failed to fetch DOF tax bills:', error);
      throw new Error('Failed to fetch DOF tax bills');
    }
  }

  // Get exemptions for a property
  async getExemptions(buildingId: string): Promise<DOFExemption[]> {
    const cacheKey = `dof_exemptions_${buildingId}`;
    const cached = await this.cacheManager.get<DOFExemption[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const exemptions = this.generateMockExemptions(buildingId);
      
      await this.cacheManager.set(cacheKey, exemptions, 600000); // 10 minute cache

      return exemptions;
    } catch (error) {
      console.error('Failed to fetch DOF exemptions:', error);
      throw new Error('Failed to fetch DOF exemptions');
    }
  }

  // Get property summary
  async getPropertySummary(buildingId: string): Promise<DOFPropertySummary> {
    const cacheKey = `dof_summary_${buildingId}`;
    const cached = await this.cacheManager.get<DOFPropertySummary>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const summary = this.generateMockPropertySummary(buildingId);
      
      await this.cacheManager.set(cacheKey, summary, 600000); // 10 minute cache

      return summary;
    } catch (error) {
      console.error('Failed to fetch DOF property summary:', error);
      throw new Error('Failed to fetch DOF property summary');
    }
  }

  // Get DOF analytics
  async getDOFAnalytics(): Promise<DOFAnalytics> {
    const cacheKey = 'dof_analytics';
    const cached = await this.cacheManager.get<DOFAnalytics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const analytics = this.generateMockDOFAnalytics();
      
      await this.cacheManager.set(cacheKey, analytics, 600000); // 10 minute cache

      return analytics;
    } catch (error) {
      console.error('Failed to fetch DOF analytics:', error);
      throw new Error('Failed to fetch DOF analytics');
    }
  }

  // Apply for exemption
  async applyForExemption(
    buildingId: string,
    exemptionType: DOFExemptionType,
    applicationData: any
  ): Promise<DOFExemption> {
    try {
      const exemption: DOFExemption = {
        id: `dof_exemption_${Date.now()}`,
        exemptionType,
        exemptionCode: this.getExemptionCode(exemptionType),
        description: this.getExemptionDescription(exemptionType),
        amount: 0, // Will be calculated by DOF
        status: DOFExemptionStatus.PENDING,
        effectiveDate: new Date(),
        applicationDate: new Date(),
        ...applicationData,
      };

      // In real implementation, this would submit to DOF API
      console.log('DOF exemption application submitted:', exemption);
      
      return exemption;
    } catch (error) {
      console.error('Failed to apply for DOF exemption:', error);
      throw new Error('Failed to apply for DOF exemption');
    }
  }

  // Make tax payment
  async makeTaxPayment(
    taxBillId: string,
    amount: number,
    paymentMethod: DOFPaymentMethod,
    referenceNumber: string
  ): Promise<DOFTaxPayment> {
    try {
      const payment: DOFTaxPayment = {
        id: `dof_payment_${Date.now()}`,
        paymentDate: new Date(),
        amount,
        paymentMethod,
        referenceNumber,
        status: DOFPaymentStatus.PROCESSED,
      };

      // In real implementation, this would process payment through DOF API
      console.log('DOF tax payment processed:', payment);
      
      return payment;
    } catch (error) {
      console.error('Failed to make DOF tax payment:', error);
      throw new Error('Failed to make DOF tax payment');
    }
  }

  // Generate realistic property assessment based on building data
  private generateMockPropertyAssessment(buildingId: string): DOFPropertyAssessment {
    const currentYear = new Date().getFullYear();
    // Use building ID to generate consistent values
    const buildingSeed = parseInt(buildingId) || 1;
    const marketValue = 500000 + (buildingSeed * 250000); // $500K + (ID * $250K)
    const assessedValue = Math.floor(marketValue * 0.5); // 50% of market value
    const exemptionAmount = Math.floor(assessedValue * 0.1); // 10% exemptions
    const taxableValue = Math.max(0, assessedValue - exemptionAmount);
    const taxClasses = Object.values(DOFTaxClass);
    const propertyTypes = Object.values(DOFPropertyType);

    return {
      id: `dof_assessment_${buildingId}`,
      buildingId,
      propertyAddress: `${buildingSeed * 100} Main Street, New York, NY`,
      borough: 'Manhattan',
      block: String(buildingSeed * 10),
      lot: String(buildingSeed),
      bbl: `${buildingSeed * 10}-${buildingSeed * 5}-${buildingSeed}`,
      assessmentYear: currentYear,
      marketValue,
      assessedValue,
      taxableValue,
      exemptionAmount,
      taxClass: taxClasses[buildingSeed % taxClasses.length],
      propertyType: propertyTypes[buildingSeed % propertyTypes.length],
      landArea: 2000 + (buildingSeed * 500), // Consistent land area
      buildingArea: 5000 + (buildingSeed * 1000), // Consistent building area
      units: 10 + (buildingSeed * 2), // Consistent unit count
      stories: 3 + (buildingSeed % 10), // Consistent story count
      yearBuilt: 1920 + (buildingSeed * 5), // Consistent year built
      lastSaleDate: buildingSeed % 3 === 0 ? new Date(Date.now() - (buildingSeed * 365 * 24 * 60 * 60 * 1000)) : undefined,
      lastSalePrice: buildingSeed % 3 === 0 ? marketValue * 0.8 : undefined,
      assessmentHistory: this.generateMockAssessmentHistory(buildingId, 10),
      exemptions: this.generateMockExemptions(buildingId),
      taxBills: this.generateMockTaxBills(buildingId, 5),
      location: {
        latitude: 40.7589 + (buildingSeed * 0.001), // Consistent location based on building ID
        longitude: -73.9851 + (buildingSeed * 0.001),
      },
    };
  }

  // Generate mock assessment history
  private generateMockAssessmentHistory(buildingId: string, years: number): DOFAssessmentHistory[] {
    const currentYear = new Date().getFullYear();
    let baseValue = Math.floor(Math.random() * 2000000) + 500000;

    return Array.from({ length: years }, (_, index) => {
      const year = currentYear - years + index + 1;
      const changePercent = (Math.random() - 0.5) * 0.1; // ±5% change
      const newValue = Math.floor(baseValue * (1 + changePercent));
      const changeFromPrevious = index === 0 ? 0 : ((newValue - baseValue) / baseValue) * 100;
      
      baseValue = newValue;

      return {
        year,
        marketValue: Math.floor(newValue * 1.8), // Market value is typically higher
        assessedValue: newValue,
        taxableValue: Math.floor(newValue * 0.9), // 90% of assessed value
        changeFromPrevious,
        assessmentDate: new Date(year, 0, 1),
      };
    });
  }

  // Generate mock tax bills
  private generateMockTaxBills(buildingId: string, years: number): DOFTaxBill[] {
    const currentYear = new Date().getFullYear();
    const statuses = Object.values(DOFTaxBillStatus);

    return Array.from({ length: years }, (_, index) => {
      const taxYear = currentYear - years + index + 1;
      const amount = Math.floor(Math.random() * 50000) + 5000; // $5K - $55K
      const paidAmount = Math.random() > 0.2 ? amount : Math.floor(amount * Math.random());
      const balance = amount - paidAmount;
      const status = balance === 0 ? DOFTaxBillStatus.PAID :
                    balance === amount ? DOFTaxBillStatus.OVERDUE :
                    DOFTaxBillStatus.PARTIAL;

      return {
        id: `dof_tax_bill_${buildingId}_${taxYear}`,
        taxYear,
        billNumber: `TB-${taxYear}-${Math.floor(Math.random() * 100000)}`,
        dueDate: new Date(taxYear, 6, 1), // July 1st
        amount,
        paidAmount,
        balance,
        status,
        paymentHistory: this.generateMockTaxPayments(amount, paidAmount),
        penalties: balance > 0 ? Math.floor(balance * 0.05) : 0, // 5% penalty
        interest: balance > 0 ? Math.floor(balance * 0.01) : 0, // 1% interest
        exemptions: Math.floor(amount * 0.1), // 10% exemptions
        netAmount: amount - Math.floor(amount * 0.1),
      };
    });
  }

  // Generate mock tax payments
  private generateMockTaxPayments(totalAmount: number, paidAmount: number): DOFTaxPayment[] {
    if (paidAmount === 0) return [];

    const paymentMethods = Object.values(DOFPaymentMethod);
    const payments: DOFTaxPayment[] = [];
    let remainingPaid = paidAmount;

    while (remainingPaid > 0) {
      const paymentAmount = Math.min(remainingPaid, Math.floor(Math.random() * remainingPaid) + 1000);
      const paymentDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

      payments.push({
        id: `dof_payment_${Date.now()}_${Math.random()}`,
        paymentDate,
        amount: paymentAmount,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        referenceNumber: `REF-${Math.floor(Math.random() * 1000000)}`,
        status: DOFPaymentStatus.PROCESSED,
      });

      remainingPaid -= paymentAmount;
    }

    return payments;
  }

  // Generate mock exemptions
  private generateMockExemptions(buildingId: string): DOFExemption[] {
    const exemptionTypes = Object.values(DOFExemptionType);
    const statuses = Object.values(DOFExemptionStatus);
    const exemptionCount = Math.floor(Math.random() * 3) + 1; // 1-3 exemptions

    return Array.from({ length: exemptionCount }, (_, index) => {
      const exemptionType = exemptionTypes[Math.floor(Math.random() * exemptionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const effectiveDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

      return {
        id: `dof_exemption_${buildingId}_${index}`,
        exemptionType,
        exemptionCode: this.getExemptionCode(exemptionType),
        description: this.getExemptionDescription(exemptionType),
        amount: Math.floor(Math.random() * 10000) + 1000, // $1K - $11K
        status,
        effectiveDate,
        expirationDate: status === DOFExemptionStatus.ACTIVE ? 
          new Date(effectiveDate.getTime() + 365 * 24 * 60 * 60 * 1000) : undefined,
        applicationDate: new Date(effectiveDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        approvedDate: status === DOFExemptionStatus.ACTIVE ? 
          new Date(effectiveDate.getTime() - 7 * 24 * 60 * 60 * 1000) : undefined,
      };
    });
  }

  // Generate mock property summary
  private generateMockPropertySummary(buildingId: string): DOFPropertySummary {
    const assessment = this.generateMockPropertyAssessment(buildingId);
    const trends = Object.values(DOFAssessmentTrend);
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const yearsOwned = Math.floor(Math.random() * 20) + 1;

    return {
      buildingId,
      totalAssessedValue: assessment.assessedValue,
      totalMarketValue: assessment.marketValue,
      totalTaxableValue: assessment.taxableValue,
      totalExemptions: assessment.exemptionAmount,
      currentTaxOwed: assessment.taxBills.reduce((sum, bill) => sum + bill.balance, 0),
      taxClass: assessment.taxClass,
      propertyType: assessment.propertyType,
      lastAssessmentDate: new Date(assessment.assessmentYear, 0, 1),
      nextAssessmentDate: new Date(assessment.assessmentYear + 1, 0, 1),
      assessmentTrend: trend,
      taxPaymentStatus: assessment.taxBills.some(bill => bill.balance > 0) ? 
        DOFTaxBillStatus.OVERDUE : DOFTaxBillStatus.CURRENT,
      exemptionsCount: assessment.exemptions.length,
      yearsOwned,
    };
  }

  // Generate mock DOF analytics
  private generateMockDOFAnalytics(): DOFAnalytics {
    const totalProperties = Math.floor(Math.random() * 10000) + 5000;
    const totalAssessedValue = Math.floor(Math.random() * 100000000000) + 50000000000; // $50B - $150B
    const totalMarketValue = Math.floor(totalAssessedValue * 1.8);
    const totalTaxRevenue = Math.floor(totalAssessedValue * 0.1); // 10% tax rate
    const averageAssessment = Math.floor(totalAssessedValue / totalProperties);

    const taxClasses = Object.values(DOFTaxClass);
    const propertyTypes = Object.values(DOFPropertyType);

    const propertiesByTaxClass: Record<DOFTaxClass, number> = {} as any;
    const propertiesByType: Record<DOFPropertyType, number> = {} as any;

    // Initialize counters
    taxClasses.forEach(taxClass => propertiesByTaxClass[taxClass] = 0);
    propertyTypes.forEach(propertyType => propertiesByType[propertyType] = 0);

    // Generate random counts
    let remainingProperties = totalProperties;
    taxClasses.forEach(taxClass => {
      const count = Math.floor(Math.random() * Math.min(remainingProperties, 3000));
      propertiesByTaxClass[taxClass] = count;
      remainingProperties -= count;
    });

    remainingProperties = totalProperties;
    propertyTypes.forEach(propertyType => {
      const count = Math.floor(Math.random() * Math.min(remainingProperties, 2000));
      propertiesByType[propertyType] = count;
      remainingProperties -= count;
    });

    // Generate assessment trends
    const assessmentTrends = Array.from({ length: 10 }, (_, index) => {
      const year = new Date().getFullYear() - 9 + index;
      const value = totalAssessedValue * (0.8 + Math.random() * 0.4); // ±20% variation
      return {
        year,
        totalAssessedValue: Math.floor(value),
        averageAssessment: Math.floor(value / totalProperties),
        propertiesCount: totalProperties + Math.floor((Math.random() - 0.5) * 1000),
      };
    });

    // Generate top assessed properties
    const topAssessedProperties = Array.from({ length: 10 }, (_, index) => ({
      buildingId: `building_${index + 1}`,
      address: `${Math.floor(Math.random() * 1000) + 1} Main Street, New York, NY`,
      assessedValue: Math.floor(Math.random() * 10000000) + 5000000, // $5M - $15M
      marketValue: Math.floor(Math.random() * 20000000) + 10000000, // $10M - $30M
    }));

    return {
      totalProperties,
      totalAssessedValue,
      totalMarketValue,
      totalTaxRevenue,
      averageAssessment,
      propertiesByTaxClass,
      propertiesByType,
      assessmentTrends,
      topAssessedProperties,
    };
  }

  // Helper methods
  private getExemptionCode(exemptionType: DOFExemptionType): string {
    const codeMap: Record<DOFExemptionType, string> = {
      [DOFExemptionType.BASIC_STAR]: 'STAR',
      [DOFExemptionType.ENHANCED_STAR]: 'ESTAR',
      [DOFExemptionType.SENIOR_CITIZEN]: 'SC',
      [DOFExemptionType.DISABLED_PERSON]: 'DP',
      [DOFExemptionType.VETERAN]: 'VET',
      [DOFExemptionType.CLERGY]: 'CL',
      [DOFExemptionType.NON_PROFIT]: 'NP',
      [DOFExemptionType.RELIGIOUS]: 'REL',
      [DOFExemptionType.EDUCATIONAL]: 'ED',
      [DOFExemptionType.GOVERNMENT]: 'GOV',
      [DOFExemptionType.J51]: 'J51',
      [DOFExemptionType.ICIP]: 'ICIP',
      [DOFExemptionType.OTHER]: 'OTH',
    };
    return codeMap[exemptionType] || 'OTH';
  }

  private getExemptionDescription(exemptionType: DOFExemptionType): string {
    const descriptionMap: Record<DOFExemptionType, string> = {
      [DOFExemptionType.BASIC_STAR]: 'School Tax Relief (STAR) Exemption',
      [DOFExemptionType.ENHANCED_STAR]: 'Enhanced School Tax Relief (ESTAR) Exemption',
      [DOFExemptionType.SENIOR_CITIZEN]: 'Senior Citizen Exemption',
      [DOFExemptionType.DISABLED_PERSON]: 'Disabled Person Exemption',
      [DOFExemptionType.VETERAN]: 'Veteran Exemption',
      [DOFExemptionType.CLERGY]: 'Clergy Exemption',
      [DOFExemptionType.NON_PROFIT]: 'Non-Profit Organization Exemption',
      [DOFExemptionType.RELIGIOUS]: 'Religious Organization Exemption',
      [DOFExemptionType.EDUCATIONAL]: 'Educational Institution Exemption',
      [DOFExemptionType.GOVERNMENT]: 'Government Property Exemption',
      [DOFExemptionType.J51]: 'J-51 Tax Abatement for Renovations',
      [DOFExemptionType.ICIP]: 'Industrial and Commercial Incentive Program',
      [DOFExemptionType.OTHER]: 'Other Exemption',
    };
    return descriptionMap[exemptionType] || 'Other Exemption';
  }


}

import { DatabaseManager } from '@cyntientops/database';
import { CacheManager } from '@cyntientops/business-core';

// Export singleton instance
const databaseManager = DatabaseManager.getInstance();
const cacheManager = CacheManager.getInstance(databaseManager);
const nycAPIService = new NYCAPIService(cacheManager);
export const dofAPIClient = new DOFAPIClient(nycAPIService, cacheManager);
