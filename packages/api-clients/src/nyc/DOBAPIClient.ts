/**
 * 🏗️ DOB API Client
 * Mirrors: CyntientOps/Services/NYC/DOBAPIService.swift
 * Purpose: NYC Department of Buildings permits, inspections, and compliance data
 */

import axios, { AxiosInstance } from 'axios';
import { DOBPermit } from '@cyntientops/domain-schema';

export interface DOBPermitDetails {
  permitId: string;
  buildingId: string;
  address: string;
  permitType: string;
  description: string;
  status: string;
  issueDate: Date;
  expirationDate: Date | null;
  applicantName: string;
  contractorName: string;
  permitValue: number;
  workType: string;
  isActive: boolean;
  inspectionRequired: boolean;
  lastInspection: Date | null;
  nextInspection: Date | null;
}

export interface DOBInspectionDetails {
  inspectionId: string;
  permitId: string;
  buildingId: string;
  inspectionDate: Date;
  inspectionType: string;
  inspectorName: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'Cancelled';
  violations: string[];
  notes: string;
  nextInspectionDate: Date | null;
}

export interface DOBComplianceSummary {
  buildingId: string;
  address: string;
  activePermits: number;
  expiredPermits: number;
  pendingInspections: number;
  failedInspections: number;
  complianceScore: number;
  lastInspection: Date | null;
  nextInspection: Date | null;
  criticalIssues: number;
}

export interface DOBWorkType {
  workTypeCode: string;
  workTypeDescription: string;
  requiresPermit: boolean;
  requiresInspection: boolean;
  estimatedDuration: number;
  typicalCost: number;
}

export class DOBAPIClient {
  private apiKey: string;
  private baseURL: string = 'https://data.cityofnewyork.us/resource';
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-App-Token': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Get permits for a specific building
   */
  public async getPermitsForBuilding(buildingId: string, address: string): Promise<DOBPermitDetails[]> {
    try {
      const response = await this.client.get('/dob-permits.json', {
        params: {
          buildingid: buildingId,
          $limit: 100,
          $order: 'issuedate DESC'
        }
      });

      return response.data.map((permit: any) => this.transformPermit(permit, address));
    } catch (error) {
      console.error('Error fetching DOB permits:', error);
      throw new Error('Failed to fetch DOB permits');
    }
  }

  /**
   * Get permits by address
   */
  public async getPermitsByAddress(address: string): Promise<DOBPermitDetails[]> {
    try {
      const response = await this.client.get('/dob-permits.json', {
        params: {
          $where: `upper(address) like upper('%${address}%')`,
          $limit: 100,
          $order: 'issuedate DESC'
        }
      });

      return response.data.map((permit: any) => this.transformPermit(permit, address));
    } catch (error) {
      console.error('Error fetching DOB permits by address:', error);
      throw new Error('Failed to fetch DOB permits by address');
    }
  }

  /**
   * Get active permits for a building
   */
  public async getActivePermits(buildingId: string, address: string): Promise<DOBPermitDetails[]> {
    const permits = await this.getPermitsForBuilding(buildingId, address);
    return permits.filter(permit => permit.isActive);
  }

  /**
   * Get expired permits for a building
   */
  public async getExpiredPermits(buildingId: string, address: string): Promise<DOBPermitDetails[]> {
    const permits = await this.getPermitsForBuilding(buildingId, address);
    const now = new Date();
    
    return permits.filter(permit => 
      permit.expirationDate && permit.expirationDate < now
    );
  }

  /**
   * Get permits expiring soon
   */
  public async getPermitsExpiringSoon(buildingId: string, address: string, daysAhead: number = 30): Promise<DOBPermitDetails[]> {
    const permits = await this.getActivePermits(buildingId, address);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return permits.filter(permit => 
      permit.expirationDate && 
      permit.expirationDate <= futureDate &&
      permit.expirationDate > new Date()
    );
  }

  /**
   * Get inspections for a permit
   */
  public async getInspectionsForPermit(permitId: string): Promise<DOBInspectionDetails[]> {
    try {
      const response = await this.client.get('/dob-inspections.json', {
        params: {
          permitid: permitId,
          $limit: 50,
          $order: 'inspectiondate DESC'
        }
      });

      return response.data.map((inspection: any) => this.transformInspection(inspection));
    } catch (error) {
      console.error('Error fetching DOB inspections:', error);
      throw new Error('Failed to fetch DOB inspections');
    }
  }

  /**
   * Get inspections for a building
   */
  public async getInspectionsForBuilding(buildingId: string): Promise<DOBInspectionDetails[]> {
    try {
      const response = await this.client.get('/dob-inspections.json', {
        params: {
          buildingid: buildingId,
          $limit: 100,
          $order: 'inspectiondate DESC'
        }
      });

      return response.data.map((inspection: any) => this.transformInspection(inspection));
    } catch (error) {
      console.error('Error fetching DOB inspections for building:', error);
      throw new Error('Failed to fetch DOB inspections for building');
    }
  }

  /**
   * Get pending inspections
   */
  public async getPendingInspections(buildingId: string): Promise<DOBInspectionDetails[]> {
    const inspections = await this.getInspectionsForBuilding(buildingId);
    return inspections.filter(inspection => inspection.status === 'Pending');
  }

  /**
   * Get failed inspections
   */
  public async getFailedInspections(buildingId: string): Promise<DOBInspectionDetails[]> {
    const inspections = await this.getInspectionsForBuilding(buildingId);
    return inspections.filter(inspection => inspection.status === 'Failed');
  }

  /**
   * Get compliance summary for a building
   */
  public async getComplianceSummary(buildingId: string, address: string): Promise<DOBComplianceSummary> {
    const permits = await this.getPermitsForBuilding(buildingId, address);
    const inspections = await this.getInspectionsForBuilding(buildingId);
    
    const activePermits = permits.filter(p => p.isActive).length;
    const expiredPermits = permits.filter(p => 
      p.expirationDate && p.expirationDate < new Date()
    ).length;
    
    const pendingInspections = inspections.filter(i => i.status === 'Pending').length;
    const failedInspections = inspections.filter(i => i.status === 'Failed').length;
    
    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(permits, inspections);
    
    // Get last and next inspection dates
    const lastInspection = inspections.length > 0 
      ? new Date(Math.max(...inspections.map(i => i.inspectionDate.getTime())))
      : null;
    
    const nextInspection = inspections.find(i => i.nextInspectionDate && i.nextInspectionDate > new Date())?.nextInspectionDate || null;
    
    // Count critical issues
    const criticalIssues = failedInspections + expiredPermits;

    return {
      buildingId,
      address,
      activePermits,
      expiredPermits,
      pendingInspections,
      failedInspections,
      complianceScore,
      lastInspection,
      nextInspection,
      criticalIssues
    };
  }

  /**
   * Get work types and their requirements
   */
  public async getWorkTypes(): Promise<DOBWorkType[]> {
    try {
      const response = await this.client.get('/dob-work-types.json', {
        params: {
          $limit: 200
        }
      });

      return response.data.map((workType: any) => this.transformWorkType(workType));
    } catch (error) {
      console.error('Error fetching DOB work types:', error);
      throw new Error('Failed to fetch DOB work types');
    }
  }

  /**
   * Check if work requires a permit
   */
  public async requiresPermit(workType: string): Promise<boolean> {
    const workTypes = await this.getWorkTypes();
    const workTypeData = workTypes.find(wt => 
      wt.workTypeCode.toLowerCase() === workType.toLowerCase() ||
      wt.workTypeDescription.toLowerCase().includes(workType.toLowerCase())
    );
    
    return workTypeData?.requiresPermit || false;
  }

  /**
   * Get permit alerts for multiple buildings
   */
  public async getPermitAlerts(buildings: Array<{ id: string; address: string }>): Promise<Array<{
    buildingId: string;
    address: string;
    alertType: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    permitCount: number;
    expiredPermits: number;
    pendingInspections: number;
  }>> {
    const alerts: Array<{
      buildingId: string;
      address: string;
      alertType: 'critical' | 'high' | 'medium' | 'low';
      message: string;
      permitCount: number;
      expiredPermits: number;
      pendingInspections: number;
    }> = [];

    for (const building of buildings) {
      try {
        const summary = await this.getComplianceSummary(building.id, building.address);
        const expiringSoon = await this.getPermitsExpiringSoon(building.id, building.address, 30);

        let alertType: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let message = '';

        if (summary.criticalIssues > 0) {
          alertType = 'critical';
          message = `${summary.criticalIssues} critical DOB issues require immediate attention`;
        } else if (summary.expiredPermits > 0) {
          alertType = 'high';
          message = `${summary.expiredPermits} expired permits need renewal`;
        } else if (expiringSoon.length > 0) {
          alertType = 'medium';
          message = `${expiringSoon.length} permits expiring within 30 days`;
        } else if (summary.pendingInspections > 0) {
          alertType = 'medium';
          message = `${summary.pendingInspections} inspections pending`;
        } else if (summary.complianceScore < 0.8) {
          alertType = 'low';
          message = `DOB compliance score: ${(summary.complianceScore * 100).toFixed(1)}%`;
        }

        if (alertType !== 'low') {
          alerts.push({
            buildingId: building.id,
            address: building.address,
            alertType,
            message,
            permitCount: summary.activePermits,
            expiredPermits: summary.expiredPermits,
            pendingInspections: summary.pendingInspections
          });
        }
      } catch (error) {
        console.error(`Error getting permit alert for ${building.address}:`, error);
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.alertType] - priorityOrder[a.alertType];
    });
  }

  /**
   * Transform raw API data to DOBPermitDetails
   */
  private transformPermit(data: any, address: string): DOBPermitDetails {
    return {
      permitId: data.permitid || '',
      buildingId: data.buildingid || '',
      address,
      permitType: data.permittype || '',
      description: data.jobdescription || '',
      status: data.status || '',
      issueDate: new Date(data.issuedate || new Date()),
      expirationDate: data.expirationdate ? new Date(data.expirationdate) : null,
      applicantName: data.applicantname || '',
      contractorName: data.contractorname || '',
      permitValue: parseFloat(data.permitvalue || '0'),
      workType: data.worktype || '',
      isActive: (data.status || '').toLowerCase() === 'active',
      inspectionRequired: data.inspectionrequired === 'Yes',
      lastInspection: data.lastinspection ? new Date(data.lastinspection) : null,
      nextInspection: data.nextinspection ? new Date(data.nextinspection) : null
    };
  }

  /**
   * Transform raw API data to DOBInspectionDetails
   */
  private transformInspection(data: any): DOBInspectionDetails {
    return {
      inspectionId: data.inspectionid || '',
      permitId: data.permitid || '',
      buildingId: data.buildingid || '',
      inspectionDate: new Date(data.inspectiondate || new Date()),
      inspectionType: data.inspectiontype || '',
      inspectorName: data.inspector || '',
      status: this.mapInspectionStatus(data.status),
      violations: this.parseViolations(data.violations),
      notes: data.notes || '',
      nextInspectionDate: data.nextinspectiondate ? new Date(data.nextinspectiondate) : null
    };
  }

  /**
   * Transform raw API data to DOBWorkType
   */
  private transformWorkType(data: any): DOBWorkType {
    return {
      workTypeCode: data.worktypecode || '',
      workTypeDescription: data.worktypedescription || '',
      requiresPermit: data.requirespermit === 'Yes',
      requiresInspection: data.requiresinspection === 'Yes',
      estimatedDuration: parseInt(data.estimatedduration || '0'),
      typicalCost: parseFloat(data.typicalcost || '0')
    };
  }

  /**
   * Map inspection status string to enum
   */
  private mapInspectionStatus(status: string): 'Passed' | 'Failed' | 'Pending' | 'Cancelled' {
    switch (status.toLowerCase()) {
      case 'passed':
      case 'approved':
        return 'Passed';
      case 'failed':
      case 'rejected':
        return 'Failed';
      case 'pending':
      case 'scheduled':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  }

  /**
   * Parse violations string to array
   */
  private parseViolations(violations: string): string[] {
    if (!violations) return [];
    
    return violations.split(';').map(v => v.trim()).filter(v => v.length > 0);
  }

  /**
   * Calculate compliance score based on permits and inspections
   */
  private calculateComplianceScore(permits: DOBPermitDetails[], inspections: DOBInspectionDetails[]): number {
    let score = 1.0;
    
    // Deduct for expired permits
    const expiredPermits = permits.filter(p => 
      p.expirationDate && p.expirationDate < new Date()
    ).length;
    score -= (expiredPermits * 0.2);
    
    // Deduct for failed inspections
    const failedInspections = inspections.filter(i => i.status === 'Failed').length;
    score -= (failedInspections * 0.15);
    
    // Deduct for pending inspections (minor)
    const pendingInspections = inspections.filter(i => i.status === 'Pending').length;
    score -= (pendingInspections * 0.05);
    
    return Math.max(0, score);
  }

  /**
   * Get API health status
   */
  public async getHealthStatus(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    lastChecked: Date;
  }> {
    const startTime = Date.now();
    
    try {
      await this.client.get('/dob-permits.json', {
        params: { $limit: 1 }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }
}
