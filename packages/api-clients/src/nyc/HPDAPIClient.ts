/**
 * 🏠 HPD API Client
 * Mirrors: CyntientOps/Services/NYC/HPDAPIService.swift
 * Purpose: NYC Housing Preservation & Development violations and compliance data
 */

import axios, { AxiosInstance } from 'axios';
import { HPDViolation, ComplianceSeverity, ComplianceStatus } from '@cyntientops/domain-schema';

export interface HPDViolationDetails {
  violationId: string;
  buildingId: string;
  address: string;
  violationType: string;
  description: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  dateFound: Date;
  dateResolved: Date | null;
  inspectorName: string;
  violationCode: string;
  penaltyAmount: number;
  isActive: boolean;
}

export interface HPDComplianceSummary {
  buildingId: string;
  address: string;
  totalViolations: number;
  activeViolations: number;
  resolvedViolations: number;
  criticalViolations: number;
  averageResolutionTime: number;
  complianceScore: number;
  lastInspection: Date | null;
  nextInspection: Date | null;
}

export interface HPDInspectionResult {
  inspectionId: string;
  buildingId: string;
  inspectionDate: Date;
  inspectorName: string;
  inspectionType: string;
  violationsFound: number;
  violationsResolved: number;
  overallScore: number;
  recommendations: string[];
}

export class HPDAPIClient {
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
   * Get violations for a specific building
   */
  public async getViolationsForBuilding(buildingId: string, address: string): Promise<HPDViolationDetails[]> {
    try {
      const response = await this.client.get('/hpd-violations.json', {
        params: {
          buildingid: buildingId,
          $limit: 100,
          $order: 'inspectiondate DESC'
        }
      });

      return response.data.map((violation: any) => this.transformViolation(violation, address));
    } catch (error) {
      console.error('Error fetching HPD violations:', error);
      throw new Error('Failed to fetch HPD violations');
    }
  }

  /**
   * Get violations by address
   */
  public async getViolationsByAddress(address: string): Promise<HPDViolationDetails[]> {
    try {
      const response = await this.client.get('/hpd-violations.json', {
        params: {
          $where: `upper(address) like upper('%${address}%')`,
          $limit: 100,
          $order: 'inspectiondate DESC'
        }
      });

      return response.data.map((violation: any) => this.transformViolation(violation, address));
    } catch (error) {
      console.error('Error fetching HPD violations by address:', error);
      throw new Error('Failed to fetch HPD violations by address');
    }
  }

  /**
   * Get active violations for a building
   */
  public async getActiveViolations(buildingId: string, address: string): Promise<HPDViolationDetails[]> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    return violations.filter(violation => violation.isActive);
  }

  /**
   * Get critical violations for a building
   */
  public async getCriticalViolations(buildingId: string, address: string): Promise<HPDViolationDetails[]> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    return violations.filter(violation => 
      violation.severity === 'critical' || violation.severity === 'high'
    );
  }

  /**
   * Get compliance summary for a building
   */
  public async getComplianceSummary(buildingId: string, address: string): Promise<HPDComplianceSummary> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    
    const totalViolations = violations.length;
    const activeViolations = violations.filter(v => v.isActive).length;
    const resolvedViolations = violations.filter(v => !v.isActive).length;
    const criticalViolations = violations.filter(v => 
      v.severity === 'critical' || v.severity === 'high'
    ).length;

    // Calculate average resolution time
    const resolvedWithDates = violations.filter(v => v.dateResolved && v.dateFound);
    const averageResolutionTime = resolvedWithDates.length > 0 
      ? resolvedWithDates.reduce((sum, v) => {
          const resolutionTime = v.dateResolved!.getTime() - v.dateFound.getTime();
          return sum + (resolutionTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / resolvedWithDates.length
      : 0;

    // Calculate compliance score (0-1, higher is better)
    const complianceScore = this.calculateComplianceScore(violations);

    // Get last inspection date
    const lastInspection = violations.length > 0 
      ? new Date(Math.max(...violations.map(v => v.dateFound.getTime())))
      : null;

    // Calculate next inspection (simplified: 1 year from last inspection)
    const nextInspection = lastInspection 
      ? new Date(lastInspection.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    return {
      buildingId,
      address,
      totalViolations,
      activeViolations,
      resolvedViolations,
      criticalViolations,
      averageResolutionTime,
      complianceScore,
      lastInspection,
      nextInspection
    };
  }

  /**
   * Get inspection results for a building
   */
  public async getInspectionResults(buildingId: string): Promise<HPDInspectionResult[]> {
    try {
      const response = await this.client.get('/hpd-inspections.json', {
        params: {
          buildingid: buildingId,
          $limit: 50,
          $order: 'inspectiondate DESC'
        }
      });

      return response.data.map((inspection: any) => this.transformInspection(inspection));
    } catch (error) {
      console.error('Error fetching HPD inspection results:', error);
      throw new Error('Failed to fetch HPD inspection results');
    }
  }

  /**
   * Get violations by severity
   */
  public async getViolationsBySeverity(
    buildingId: string, 
    address: string, 
    severity: ComplianceSeverity
  ): Promise<HPDViolationDetails[]> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    return violations.filter(violation => violation.severity === severity);
  }

  /**
   * Get violations by status
   */
  public async getViolationsByStatus(
    buildingId: string, 
    address: string, 
    status: ComplianceStatus
  ): Promise<HPDViolationDetails[]> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    return violations.filter(violation => violation.status === status);
  }

  /**
   * Get violations requiring immediate attention
   */
  public async getUrgentViolations(buildingId: string, address: string): Promise<HPDViolationDetails[]> {
    const violations = await this.getViolationsForBuilding(buildingId, address);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return violations.filter(violation => 
      violation.isActive && 
      (violation.severity === 'critical' || violation.severity === 'high') &&
      violation.dateFound < thirtyDaysAgo
    );
  }

  /**
   * Get compliance alerts for multiple buildings
   */
  public async getComplianceAlerts(buildings: Array<{ id: string; address: string }>): Promise<Array<{
    buildingId: string;
    address: string;
    alertType: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    violationCount: number;
    lastViolationDate: Date | null;
  }>> {
    const alerts: Array<{
      buildingId: string;
      address: string;
      alertType: 'critical' | 'high' | 'medium' | 'low';
      message: string;
      violationCount: number;
      lastViolationDate: Date | null;
    }> = [];

    for (const building of buildings) {
      try {
        const summary = await this.getComplianceSummary(building.id, building.address);
        const urgentViolations = await this.getUrgentViolations(building.id, building.address);

        let alertType: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let message = '';

        if (urgentViolations.length > 0) {
          alertType = 'critical';
          message = `${urgentViolations.length} urgent violations require immediate attention`;
        } else if (summary.criticalViolations > 0) {
          alertType = 'high';
          message = `${summary.criticalViolations} critical violations found`;
        } else if (summary.activeViolations > 5) {
          alertType = 'medium';
          message = `${summary.activeViolations} active violations`;
        } else if (summary.complianceScore < 0.7) {
          alertType = 'medium';
          message = `Low compliance score: ${(summary.complianceScore * 100).toFixed(1)}%`;
        }

        if (alertType !== 'low') {
          alerts.push({
            buildingId: building.id,
            address: building.address,
            alertType,
            message,
            violationCount: summary.activeViolations,
            lastViolationDate: summary.lastInspection
          });
        }
      } catch (error) {
        console.error(`Error getting compliance alert for ${building.address}:`, error);
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.alertType] - priorityOrder[a.alertType];
    });
  }

  /**
   * Transform raw API data to HPDViolationDetails
   */
  private transformViolation(data: any, address: string): HPDViolationDetails {
    return {
      violationId: data.violationid || '',
      buildingId: data.buildingid || '',
      address,
      violationType: data.violationtype || '',
      description: data.novdescription || '',
      severity: this.mapSeverity(data.violationclass || 'C'),
      status: this.mapStatus(data.currentstatus || 'Open'),
      dateFound: new Date(data.inspectiondate || new Date()),
      dateResolved: data.currentstatusdate ? new Date(data.currentstatusdate) : null,
      inspectorName: data.inspector || '',
      violationCode: data.violationcode || '',
      penaltyAmount: parseFloat(data.penaltyimposed || '0'),
      isActive: (data.currentstatus || 'Open') !== 'Closed'
    };
  }

  /**
   * Transform raw API data to HPDInspectionResult
   */
  private transformInspection(data: any): HPDInspectionResult {
    return {
      inspectionId: data.inspectionid || '',
      buildingId: data.buildingid || '',
      inspectionDate: new Date(data.inspectiondate || new Date()),
      inspectorName: data.inspector || '',
      inspectionType: data.inspectiontype || '',
      violationsFound: parseInt(data.violationsfound || '0'),
      violationsResolved: parseInt(data.violationsresolved || '0'),
      overallScore: this.calculateInspectionScore(data),
      recommendations: this.parseRecommendations(data.recommendations)
    };
  }

  /**
   * Map violation class to severity
   */
  private mapSeverity(violationClass: string): ComplianceSeverity {
    switch (violationClass.toUpperCase()) {
      case 'A':
        return 'critical';
      case 'B':
        return 'high';
      case 'C':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Map status string to ComplianceStatus
   */
  private mapStatus(status: string): ComplianceStatus {
    switch (status.toLowerCase()) {
      case 'open':
        return 'open';
      case 'in progress':
      case 'in_progress':
        return 'in_progress';
      case 'resolved':
        return 'resolved';
      case 'closed':
        return 'closed';
      case 'pending':
        return 'pending';
      default:
        return 'open';
    }
  }

  /**
   * Calculate compliance score based on violations
   */
  private calculateComplianceScore(violations: HPDViolationDetails[]): number {
    if (violations.length === 0) return 1.0;

    let score = 1.0;
    
    violations.forEach(violation => {
      if (violation.isActive) {
        switch (violation.severity) {
          case 'critical':
            score -= 0.3;
            break;
          case 'high':
            score -= 0.2;
            break;
          case 'medium':
            score -= 0.1;
            break;
          case 'low':
            score -= 0.05;
            break;
        }
      }
    });

    return Math.max(0, score);
  }

  /**
   * Calculate inspection score
   */
  private calculateInspectionScore(data: any): number {
    const violationsFound = parseInt(data.violationsfound || '0');
    const violationsResolved = parseInt(data.violationsresolved || '0');
    
    if (violationsFound === 0) return 1.0;
    
    return violationsResolved / violationsFound;
  }

  /**
   * Parse recommendations string
   */
  private parseRecommendations(recommendations: string): string[] {
    if (!recommendations) return [];
    
    return recommendations.split(';').map(rec => rec.trim()).filter(rec => rec.length > 0);
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
      await this.client.get('/hpd-violations.json', {
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
