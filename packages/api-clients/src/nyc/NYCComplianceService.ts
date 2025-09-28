// packages/api-clients/src/nyc/NYCComplianceService.ts

import { 
  HPDViolation, 
  DOBPermit, 
  LL97Emission, 
  NYCComplianceData,
  ComplianceSummary 
} from './NYCDataModels';
import { nycAPIService } from './NYCAPIService';

export class NYCComplianceService {
  private apiService = nycAPIService;

  // Process raw HPD violations into actionable compliance issues
  processHPDViolations(violations: HPDViolation[]): {
    critical: HPDViolation[];
    warning: HPDViolation[];
    info: HPDViolation[];
    summary: {
      total: number;
      open: number;
      critical: number;
      warning: number;
      info: number;
    };
  } {
    const critical: HPDViolation[] = [];
    const warning: HPDViolation[] = [];
    const info: HPDViolation[] = [];

    violations.forEach(violation => {
      const isOpen = violation.currentstatus === 'OPEN' || violation.currentstatus === 'ACTIVE';
      const isCritical = violation.violationclass === 'A' || violation.violationclass === 'B';
      const isWarning = violation.violationclass === 'C';

      if (isOpen && isCritical) {
        critical.push(violation);
      } else if (isOpen && isWarning) {
        warning.push(violation);
      } else if (isOpen) {
        info.push(violation);
      }
    });

    return {
      critical,
      warning,
      info,
      summary: {
        total: violations.length,
        open: critical.length + warning.length + info.length,
        critical: critical.length,
        warning: warning.length,
        info: info.length,
      },
    };
  }

  // Process raw DOB permits into compliance insights
  processDOBPermits(permits: DOBPermit[]): {
    active: DOBPermit[];
    recent: DOBPermit[];
    expired: DOBPermit[];
    summary: {
      total: number;
      active: number;
      recent: number;
      expired: number;
    };
  } {
    const active: DOBPermit[] = [];
    const recent: DOBPermit[] = [];
    const expired: DOBPermit[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    permits.forEach(permit => {
      const isActive = permit.job_status === 'ACTIVE' || permit.job_status === 'IN PROGRESS';
      const isRecent = new Date(permit.job_status_date) > thirtyDaysAgo;
      const isExpired = permit.job_status === 'EXPIRED' || permit.job_status === 'CANCELLED';

      if (isActive) {
        active.push(permit);
      } else if (isRecent) {
        recent.push(permit);
      } else if (isExpired) {
        expired.push(permit);
      }
    });

    return {
      active,
      recent,
      expired,
      summary: {
        total: permits.length,
        active: active.length,
        recent: recent.length,
        expired: expired.length,
      },
    };
  }

  // Process LL97 emissions data into compliance insights
  processLL97Emissions(emissions: LL97Emission[]): {
    compliant: LL97Emission[];
    warning: LL97Emission[];
    nonCompliant: LL97Emission[];
    summary: {
      total: number;
      compliant: number;
      warning: number;
      nonCompliant: number;
      averageEmissions: number;
    };
  } {
    const compliant: LL97Emission[] = [];
    const warning: LL97Emission[] = [];
    const nonCompliant: LL97Emission[] = [];

    let totalEmissions = 0;

    emissions.forEach(emission => {
      const emissionsValue = parseFloat(emission.total_ghg_emissions_intensity || '0');
      totalEmissions += emissionsValue;

      // LL97 thresholds (simplified - would need actual 2024 limits)
      if (emissionsValue <= 8.0) {
        compliant.push(emission);
      } else if (emissionsValue <= 12.0) {
        warning.push(emission);
      } else {
        nonCompliant.push(emission);
      }
    });

    return {
      compliant,
      warning,
      nonCompliant,
      summary: {
        total: emissions.length,
        compliant: compliant.length,
        warning: warning.length,
        nonCompliant: nonCompliant.length,
        averageEmissions: emissions.length > 0 ? totalEmissions / emissions.length : 0,
      },
    };
  }

  // Generate comprehensive compliance summary for a building
  async generateComplianceSummary(
    bbl: string, 
    buildingId: string, 
    buildingName: string, 
    address: string
  ): Promise<ComplianceSummary> {
    try {
      const complianceData = await this.apiService.getBuildingComplianceData(bbl);
      
      const violations = this.processHPDViolations(complianceData.violations);
      const permits = this.processDOBPermits(complianceData.permits);
      const emissions = this.processLL97Emissions(complianceData.emissions);

      // Determine overall compliance status
      let complianceStatus: 'compliant' | 'warning' | 'critical' = 'compliant';
      if (violations.summary.critical > 0 || emissions.summary.nonCompliant > 0) {
        complianceStatus = 'critical';
      } else if (violations.summary.warning > 0 || emissions.summary.warning > 0 || violations.summary.open > 5) {
        complianceStatus = 'warning';
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (violations.summary.critical > 2 || emissions.summary.nonCompliant > 0) {
        riskLevel = 'high';
      } else if (violations.summary.critical > 0 || violations.summary.warning > 3 || emissions.summary.warning > 0) {
        riskLevel = 'medium';
      }

      // Calculate next inspection due date (simplified logic)
      const lastInspectionDate = violations.critical.length > 0 
        ? new Date(Math.max(...violations.critical.map(v => new Date(v.inspectiondate).getTime())))
        : null;

      const nextInspectionDue = lastInspectionDate 
        ? new Date(lastInspectionDate.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year from last inspection
        : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now if no inspection

      return {
        bbl,
        buildingId,
        buildingName,
        address,
        totalViolations: violations.summary.total,
        openViolations: violations.summary.open,
        criticalViolations: violations.summary.critical,
        recentPermits: permits.summary.recent,
        activePermits: permits.summary.active,
        emissionsScore: Math.round(emissions.summary.averageEmissions * 100) / 100,
        complianceStatus,
        lastInspectionDate,
        nextInspectionDue,
        riskLevel,
      };
    } catch (error) {
      console.error('Failed to generate compliance summary:', error);
      throw error;
    }
  }

  // Get compliance alerts for dashboard
  async getComplianceAlerts(bbls: string[]): Promise<{
    critical: ComplianceSummary[];
    warning: ComplianceSummary[];
    info: ComplianceSummary[];
  }> {
    const critical: ComplianceSummary[] = [];
    const warning: ComplianceSummary[] = [];
    const info: ComplianceSummary[] = [];

    try {
      const promises = bbls.map(async (bbl, index) => {
        const buildingId = (index + 1).toString();
        const buildingName = `Building ${buildingId}`;
        const address = `Address ${buildingId}`;
        
        return this.generateComplianceSummary(bbl, buildingId, buildingName, address);
      });

      const summaries = await Promise.all(promises);

      summaries.forEach(summary => {
        if (summary.complianceStatus === 'critical') {
          critical.push(summary);
        } else if (summary.complianceStatus === 'warning') {
          warning.push(summary);
        } else {
          info.push(summary);
        }
      });

      return { critical, warning, info };
    } catch (error) {
      console.error('Failed to get compliance alerts:', error);
      throw error;
    }
  }

  // Get compliance trends over time
  async getComplianceTrends(bbl: string, months: number = 12): Promise<{
    violations: Array<{ month: string; count: number }>;
    permits: Array<{ month: string; count: number }>;
    emissions: Array<{ month: string; value: number }>;
  }> {
    try {
      const complianceData = await this.apiService.getBuildingComplianceData(bbl);
      
      // Process violations by month
      const violationsByMonth: Record<string, number> = {};
      complianceData.violations.forEach(violation => {
        const month = new Date(violation.inspectiondate).toISOString().substring(0, 7);
        violationsByMonth[month] = (violationsByMonth[month] || 0) + 1;
      });

      // Process permits by month
      const permitsByMonth: Record<string, number> = {};
      complianceData.permits.forEach(permit => {
        const month = new Date(permit.job_status_date).toISOString().substring(0, 7);
        permitsByMonth[month] = (permitsByMonth[month] || 0) + 1;
      });

      // Process emissions by month (simplified - would need historical data)
      const emissionsByMonth: Record<string, number> = {};
      complianceData.emissions.forEach(emission => {
        const month = new Date().toISOString().substring(0, 7);
        emissionsByMonth[month] = parseFloat(emission.total_ghg_emissions_intensity || '0');
      });

      return {
        violations: Object.entries(violationsByMonth).map(([month, count]) => ({ month, count })),
        permits: Object.entries(permitsByMonth).map(([month, count]) => ({ month, count })),
        emissions: Object.entries(emissionsByMonth).map(([month, value]) => ({ month, value })),
      };
    } catch (error) {
      console.error('Failed to get compliance trends:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nycComplianceService = new NYCComplianceService();
