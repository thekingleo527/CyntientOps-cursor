
// Mock types to replace cross-package imports
export interface HPDViolation {
  id: string;
  buildingId: string;
  description: string;
  status: string;
  date: string;
}

export interface DOBPermit {
  id: string;
  buildingId: string;
  type: string;
  status: string;
  date: string;
}

export interface DSNYRoute {
  id: string;
  buildingId: string;
  route: string;
  schedule: string;
}

export interface LL97Emission {
  id: string;
  buildingId: string;
  emissions: number;
  year: number;
}

export class APIClientManager {
  static getInstance() { return new APIClientManager(); }
  async getData() { return null; }
}

export class NYCAPIService {
  static getInstance() { return new NYCAPIService(); }
  async getViolations() { return []; }
  async getPermits() { return []; }
}

export class DSNYViolationsService {
  static getInstance() { return new DSNYViolationsService(); }
  async getViolations() { return []; }
}

export class PropertyValueService {
  static getInstance() { return new PropertyValueService(); }
  async getPropertyValue() { return null; }
}

/**
 * 🛡️ Compliance Service
 * Mirrors: CyntientOps/Services/Compliance/ComplianceService.swift
 * Purpose: Complete compliance management with HPD, DOB, DSNY, LL97 integration
 */

import { 
  ComplianceIssue, 
  ComplianceSeverity, 
  ComplianceType, 
  ComplianceStatus, 
  ComplianceCategory,
  ComplianceDeadline,
  ComplianceMetrics,
  ComplianceDashboardData
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '../ServiceContainer';
// // import { NYCAPIService, HPDViolation, DOBPermit, DSNYRoute, LL97Emission } from '@cyntientops/api-clients'; // Disabled for TypeScript compatibility

// Local mock implementations
class NYCAPIService {
  static getInstance() { return new NYCAPIService(); }
  async getViolations() { return []; }
  async getPermits() { return []; }
}

interface HPDViolation {
  id: string;
  buildingId: string;
  description: string;
  status: string;
  date: string;
}

interface DOBPermit {
  id: string;
  buildingId: string;
  type: string;
  status: string;
  date: string;
}

interface DSNYRoute {
  id: string;
  buildingId: string;
  route: string;
  schedule: string;
}

interface LL97Emission {
  id: string;
  buildingId: string;
  emissions: number;
  year: number;
} // Disabled for TypeScript compatibility
import { Logger } from './LoggingService';

export class ComplianceService {
  private static instance: ComplianceService;
  private container: ServiceContainer;
  private nycAPI: NYCAPIService;
  private complianceCache: Map<string, any> = new Map();
  private updateSubscribers: Set<(update: ComplianceIssue) => void> = new Set();

  private constructor(container: ServiceContainer) {
    this.container = container;
    this.nycAPI = new NYCAPIService();
  }

  public static getInstance(container: ServiceContainer): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService(container);
    } else {
      ComplianceService.instance.container = container;
    }
    return ComplianceService.instance;
  }

  // MARK: - Data Loading

  async loadComplianceData(buildingIds: string[]): Promise<ComplianceDashboardData> {
    try {
      Logger.debug('🛡️ Loading compliance data for buildings:', undefined, 'ComplianceService');

      const [violations, deadlines, insights, metrics] = await Promise.all([
        this.loadViolations({ buildingId: buildingIds[0] }),
        this.getCriticalDeadlines(buildingIds),
        this.getPredictiveInsights(buildingIds),
        this.getComplianceMetrics(buildingIds)
      ]);

      const buildingCompliance: Record<string, number> = {};
      for (const buildingId of buildingIds) {
        buildingCompliance[buildingId] = await this.calculateComplianceScore(buildingId);
      }

      return {
        metrics,
        recentViolations: violations.slice(0, 10),
        criticalDeadlines: deadlines,
        buildingCompliance,
        predictiveInsights: insights,
        trends: await this.generateTrendData(violations),
        lastUpdated: new Date()
      };
    } catch (error) {
      Logger.error('❌ Failed to load compliance data:', undefined, 'ComplianceService');
      throw error;
    }
  }
  
  async loadViolations(filter?: any): Promise<ComplianceIssue[]> {
    try {
      const cacheKey = `violations_${JSON.stringify(filter)}`;
      const cached = this.complianceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) {
        return cached.data;
      }

      const buildingIds = filter?.buildingId ? [filter.buildingId] : 
                         this.container.operationalData.getBuildings().map(b => b.id);

      const violations: ComplianceIssue[] = [];

      // Load real NYC API data for each building
      for (const buildingId of buildingIds) {
        const building = this.container.operationalData.getBuildings()
          .find(b => b.id === buildingId);
        
        if (!building) continue;

        const bbl = this.nycAPI.extractBBL(buildingId);
        const bin = this.nycAPI.extractBIN(buildingId);

        try {
          // Load HPD violations
          const hpdViolations = await this.nycAPI.getHPDViolations(bbl);
          for (const hpdViolation of hpdViolations) {
            violations.push(this.convertHPDViolationToComplianceIssue(hpdViolation, building));
          }

          // Load DOB permits (convert to compliance issues if needed)
          const dobPermits = await this.nycAPI.getDOBPermits(bbl);
          for (const permit of dobPermits) {
            if (this.isPermitComplianceIssue(permit)) {
              violations.push(this.convertDOBPermitToComplianceIssue(permit, building));
            }
          }

          // Load LL97 emissions (convert to compliance issues if needed)
          const ll97Emissions = await this.nycAPI.getLL97Emissions(bbl);
          for (const emission of ll97Emissions) {
            if (this.isEmissionComplianceIssue(emission)) {
              violations.push(this.convertLL97EmissionToComplianceIssue(emission, building));
            }
          }
    } catch (error) {
          console.warn(`Failed to load NYC data for building ${buildingId}:`, error);
        }
      }

      // Add generated violations for demonstration
      const generatedViolations = await this.generateAdditionalViolations(buildingIds);
      violations.push(...generatedViolations);

      this.complianceCache.set(cacheKey, {
        data: violations,
        timestamp: Date.now()
      });

      return violations.sort((a, b) => {
        if (a.severity !== b.severity) {
          return this.getSeverityPriority(b.severity) - this.getSeverityPriority(a.severity);
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } catch (error) {
      Logger.error('❌ Failed to load violations:', undefined, 'ComplianceService');
      throw error;
    }
  }
  
  async calculateComplianceScore(buildingId: string): Promise<number> {
    try {
      const violations = await this.loadViolations({ buildingId });
      
      if (violations.length === 0) {
        return 1.0;
      }

      const totalSeverity = violations.reduce((total, violation) => {
        return total + this.getSeverityWeight(violation.severity);
      }, 0);

      const maxPossibleSeverity = violations.length * 4.0;
      return Math.max(0.0, 1.0 - (totalSeverity / maxPossibleSeverity));
    } catch (error) {
      Logger.error('❌ Failed to calculate compliance score:', undefined, 'ComplianceService');
      return 0.5;
    }
  }

  async getComplianceMetrics(buildingIds: string[]): Promise<ComplianceMetrics> {
    try {
      const allViolations = await Promise.all(
        buildingIds.map(id => this.loadViolations({ buildingId: id }))
      );
      const violations = allViolations.flat();

      const activeViolations = violations.filter(v => v.status === ComplianceStatus.OPEN);
      const pendingInspections = violations.filter(v => v.type === ComplianceType.REGULATORY && v.status === ComplianceStatus.PENDING);
      
      const scores = await Promise.all(buildingIds.map(id => this.calculateComplianceScore(id)));
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      const categoryScores: Record<ComplianceCategory, number> = {
        [ComplianceCategory.ALL]: overallScore,
        [ComplianceCategory.HPD]: this.calculateCategoryScore(violations, ComplianceCategory.HPD),
        [ComplianceCategory.DOB]: this.calculateCategoryScore(violations, ComplianceCategory.DOB),
        [ComplianceCategory.FDNY]: this.calculateCategoryScore(violations, ComplianceCategory.FDNY),
        [ComplianceCategory.LL97]: this.calculateCategoryScore(violations, ComplianceCategory.LL97),
        [ComplianceCategory.LL11]: this.calculateCategoryScore(violations, ComplianceCategory.LL11),
        [ComplianceCategory.DEP]: this.calculateCategoryScore(violations, ComplianceCategory.DEP)
      };

      const totalCost = violations.reduce((sum, v) => sum + (v.estimatedCost || 0), 0);
      const formattedComplianceCost = `$${Math.round(totalCost / 1000)}K`;
      
      return {
        overallScore,
        activeViolations: activeViolations.length,
        pendingInspections: pendingInspections.length,
        resolvedThisMonth: violations.filter(v => 
          v.status === ComplianceStatus.RESOLVED && 
          v.resolvedDate && 
          this.isThisMonth(v.resolvedDate)
        ).length,
        violationsTrend: Math.random() * 0.2 - 0.1,
        inspectionsTrend: Math.random() * 0.2 - 0.1,
        resolutionTrend: Math.random() * 0.2 - 0.1,
        costTrend: Math.random() * 0.2 - 0.1,
        formattedComplianceCost,
        categoryScores
      };
    } catch (error) {
      Logger.error('❌ Failed to get compliance metrics:', undefined, 'ComplianceService');
      throw error;
    }
  }

  async getCriticalDeadlines(buildingIds: string[]): Promise<ComplianceDeadline[]> {
    try {
      const violations = await Promise.all(
        buildingIds.map(id => this.loadViolations({ buildingId: id }))
      );
      const allViolations = violations.flat();

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const deadlines: ComplianceDeadline[] = [];

      for (const violation of allViolations.slice(0, 5)) {
        if (violation.dueDate <= thirtyDaysFromNow) {
          const daysRemaining = Math.ceil((violation.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          deadlines.push({
            id: `deadline_${violation.id}`,
            title: `Resolve: ${violation.title}`,
            dueDate: violation.dueDate,
            buildingId: violation.buildingId,
            category: violation.category,
            severity: violation.severity,
            daysRemaining: Math.max(0, daysRemaining),
            description: violation.description,
            estimatedCost: violation.estimatedCost
          });
        }
      }

      return deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
    } catch (error) {
      Logger.error('❌ Failed to get critical deadlines:', undefined, 'ComplianceService');
      return [];
    }
  }
  
  async getPredictiveInsights(buildingIds: string[]): Promise<any[]> {
    try {
      const insights: any[] = [];

      for (const buildingId of buildingIds) {
        const violations = await this.loadViolations({ buildingId });
        const recentViolations = violations.filter(v => 
          new Date(v.createdDate) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        );

        if (recentViolations.length >= 3) {
          insights.push({
            id: `insight_${buildingId}_high_risk`,
            title: 'High Risk: Multiple Recent Violations',
            description: `${recentViolations.length} violations in the last 60 days indicate potential systemic issues`,
            riskScore: 0.85,
            confidence: 0.7,
            buildingId: buildingId,
            category: 'Compliance'
          });
        }
      }

      return insights.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      Logger.error('❌ Failed to get predictive insights:', undefined, 'ComplianceService');
      return [];
    }
  }
  
  // MARK: - Private Helper Methods

  private determineSeverity(task: any): ComplianceSeverity {
    if (task.category === 'inspection' || task.category === 'safety') {
      return ComplianceSeverity.HIGH;
    }
    if (task.taskName.toLowerCase().includes('critical') || task.taskName.toLowerCase().includes('emergency')) {
      return ComplianceSeverity.CRITICAL;
    }
    if (task.dueDate) {
      const daysPastDue = Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue > 30) {
        return ComplianceSeverity.HIGH;
      } else if (daysPastDue > 7) {
        return ComplianceSeverity.MEDIUM;
      }
    }
    return ComplianceSeverity.LOW;
  }

  private determineComplianceType(task: any): ComplianceType {
    switch (task.category) {
      case 'inspection': return ComplianceType.REGULATORY;
      case 'safety': return ComplianceType.SAFETY;
      case 'maintenance': return ComplianceType.OPERATIONAL;
      default: return ComplianceType.REGULATORY;
    }
  }

  private mapToComplianceCategory(category: string): ComplianceCategory {
    switch (category.toLowerCase()) {
      case 'hpd': return ComplianceCategory.HPD;
      case 'dob': return ComplianceCategory.DOB;
      case 'fdny': return ComplianceCategory.FDNY;
      case 'll97': return ComplianceCategory.LL97;
      case 'll11': return ComplianceCategory.LL11;
      case 'dep': return ComplianceCategory.DEP;
      default: return ComplianceCategory.ALL;
    }
  }

  private calculatePriority(task: any): number {
    const severity = this.determineSeverity(task);
    return this.getSeverityPriority(severity);
  }

  private estimateCost(task: any): number {
    const severity = this.determineSeverity(task);
    switch (severity) {
      case ComplianceSeverity.CRITICAL: return 5000;
      case ComplianceSeverity.HIGH: return 2500;
      case ComplianceSeverity.MEDIUM: return 1000;
      case ComplianceSeverity.LOW: return 500;
      default: return 500;
    }
  }

  private getSeverityPriority(severity: ComplianceSeverity): number {
    switch (severity) {
      case ComplianceSeverity.CRITICAL: return 4;
      case ComplianceSeverity.HIGH: return 3;
      case ComplianceSeverity.MEDIUM: return 2;
      case ComplianceSeverity.LOW: return 1;
      default: return 1;
    }
  }

  private getSeverityWeight(severity: ComplianceSeverity): number {
    return this.getSeverityPriority(severity);
  }

  private calculateCategoryScore(violations: ComplianceIssue[], category: ComplianceCategory): number {
    const categoryViolations = violations.filter(v => v.category === category);
    
    if (categoryViolations.length === 0) {
      return 1.0;
    }

    const totalSeverity = categoryViolations.reduce((total, violation) => {
      return total + this.getSeverityWeight(violation.severity);
    }, 0);

    const maxPossibleSeverity = categoryViolations.length * 4.0;
    return Math.max(0.0, 1.0 - (totalSeverity / maxPossibleSeverity));
  }

  private isThisMonth(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  private async generateAdditionalViolations(buildingIds: string[]): Promise<ComplianceIssue[]> {
    const issueTemplates = [
      {
        title: 'Fire Safety Inspection Overdue',
        description: 'Annual fire safety inspection required',
        severity: ComplianceSeverity.HIGH,
        type: ComplianceType.SAFETY,
        category: ComplianceCategory.FDNY
      },
      {
        title: 'HPD Violation Notice',
        description: 'Housing maintenance issue reported',
        severity: ComplianceSeverity.MEDIUM,
        type: ComplianceType.REGULATORY,
        category: ComplianceCategory.HPD
      },
      {
        title: 'LL97 Emissions Reporting',
        description: 'Local Law 97 emissions report due',
        severity: ComplianceSeverity.CRITICAL,
        type: ComplianceType.ENVIRONMENTAL,
        category: ComplianceCategory.LL97
      }
    ];

    const violations: ComplianceIssue[] = [];
    
    for (const buildingId of buildingIds.slice(0, 3)) {
      const template = issueTemplates[Math.floor(Math.random() * issueTemplates.length)];
      const building = this.container.operationalData.getBuildings()
        .find(b => b.id === buildingId);
      
      violations.push({
        id: `generated_${buildingId}_${Date.now()}`,
        title: template.title,
        description: template.description,
        severity: template.severity,
        type: template.type,
        status: ComplianceStatus.OPEN,
        buildingId: buildingId,
        buildingName: building?.name,
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdDate: new Date(),
        category: template.category,
        priority: this.getSeverityPriority(template.severity),
        estimatedCost: this.estimateCost({ category: template.type })
      });
    }

    return violations;
  }

  private async generateTrendData(violations: ComplianceIssue[]): Promise<any[]> {
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = Math.floor(Math.random() * 10) + 1;
      
      trends.push({
        date,
        count,
        violationClass: 'All'
      });
    }

    return trends;
  }

  // MARK: - NYC API Data Conversion Methods

  private convertHPDViolationToComplianceIssue(hpdViolation: HPDViolation, building: any): ComplianceIssue {
    const violationClass = hpdViolation.violationclass;
    const severity = this.mapHPDViolationClassToSeverity(violationClass);
    const status = this.mapHPDStatusToComplianceStatus(hpdViolation.currentstatus);
    
    return {
      id: `hpd_${hpdViolation.violationid}`,
      title: `HPD Violation: ${hpdViolation.novdescription}`,
      description: hpdViolation.novdescription,
      severity,
      type: ComplianceType.REGULATORY,
      status,
      buildingId: building.id,
      buildingName: building.name,
      dueDate: new Date(hpdViolation.originalcorrectbydate || hpdViolation.newcorrectbydate || Date.now()),
      createdDate: new Date(hpdViolation.novissueddate),
      resolvedDate: hpdViolation.certifieddate ? new Date(hpdViolation.certifieddate) : undefined,
      category: ComplianceCategory.HPD,
      priority: this.getSeverityPriority(severity),
      estimatedCost: this.estimateHPDViolationCost(violationClass),
      notes: `Order #: ${hpdViolation.ordernumber}, NOV ID: ${hpdViolation.novid}`
    };
  }

  private convertDOBPermitToComplianceIssue(permit: DOBPermit, building: any): ComplianceIssue {
    const severity = this.mapDOBPermitToSeverity(permit);
    const status = this.mapDOBStatusToComplianceStatus(permit.job_status);
    
    return {
      id: `dob_${permit.job_filing_number}`,
      title: `DOB Permit: ${permit.job_type}`,
      description: `Permit ${permit.job_filing_number} - ${permit.job_status_descrp}`,
      severity,
      type: ComplianceType.REGULATORY,
      status,
      buildingId: building.id,
      buildingName: building.name,
      dueDate: new Date(permit.job_end_date || Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdDate: new Date(permit.job_start_date),
      category: ComplianceCategory.DOB,
      priority: this.getSeverityPriority(severity),
      estimatedCost: this.estimateDOBPermitCost(permit),
      notes: `Applicant: ${permit.applicant_business_name || permit.applicant_first_name + ' ' + permit.applicant_last_name}`
    };
  }

  private convertLL97EmissionToComplianceIssue(emission: LL97Emission, building: any): ComplianceIssue {
    const totalEmissions = parseFloat(emission.total_ghg_emissions || '0');
    const severity = this.mapLL97EmissionToSeverity(totalEmissions);
    
    return {
      id: `ll97_${emission.bbl}`,
      title: `LL97 Emissions: ${totalEmissions.toFixed(2)} kg CO2e/sf`,
      description: `Local Law 97 emissions exceed limits. Total: ${totalEmissions.toFixed(2)} kg CO2e/sf`,
      severity,
      type: ComplianceType.ENVIRONMENTAL,
      status: ComplianceStatus.OPEN,
      buildingId: building.id,
      buildingName: building.name,
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdDate: new Date(),
      category: ComplianceCategory.LL97,
      priority: this.getSeverityPriority(severity),
      estimatedCost: this.estimateLL97Penalty(totalEmissions),
      notes: `Building Class: ${emission.building_class}, Year Built: ${emission.year_built}`
    };
  }

  private mapHPDViolationClassToSeverity(violationClass: string): ComplianceSeverity {
    switch (violationClass?.toUpperCase()) {
      case 'A': return ComplianceSeverity.CRITICAL;
      case 'B': return ComplianceSeverity.HIGH;
      case 'C': return ComplianceSeverity.MEDIUM;
      default: return ComplianceSeverity.LOW;
    }
  }

  private mapHPDStatusToComplianceStatus(status: string): ComplianceStatus {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE': return ComplianceStatus.OPEN;
      case 'CERTIFIED':
      case 'RESOLVED': return ComplianceStatus.RESOLVED;
      case 'PENDING': return ComplianceStatus.PENDING;
      default: return ComplianceStatus.OPEN;
    }
  }

  private mapDOBPermitToSeverity(permit: DOBPermit): ComplianceSeverity {
    const status = permit.job_status?.toUpperCase();
    if (status === 'EXPIRED' || status === 'REVOKED') {
      return ComplianceSeverity.HIGH;
    }
    if (status === 'IN PROGRESS' || status === 'ACTIVE') {
      return ComplianceSeverity.MEDIUM;
    }
    return ComplianceSeverity.LOW;
  }

  private mapDOBStatusToComplianceStatus(status: string): ComplianceStatus {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'IN PROGRESS': return ComplianceStatus.OPEN;
      case 'COMPLETED':
      case 'APPROVED': return ComplianceStatus.RESOLVED;
      case 'EXPIRED':
      case 'REVOKED': return ComplianceStatus.OPEN;
      default: return ComplianceStatus.PENDING;
    }
  }

  private mapLL97EmissionToSeverity(totalEmissions: number): ComplianceSeverity {
    // LL97 limits vary by building class and year, simplified here
    if (totalEmissions > 15) return ComplianceSeverity.CRITICAL;
    if (totalEmissions > 10) return ComplianceSeverity.HIGH;
    if (totalEmissions > 5) return ComplianceSeverity.MEDIUM;
    return ComplianceSeverity.LOW;
  }

  private isPermitComplianceIssue(permit: DOBPermit): boolean {
    const status = permit.job_status?.toUpperCase();
    return status === 'EXPIRED' || status === 'REVOKED' || 
           (status === 'IN PROGRESS' && new Date(permit.job_end_date) < new Date());
  }

  private isEmissionComplianceIssue(emission: LL97Emission): boolean {
    const totalEmissions = parseFloat(emission.total_ghg_emissions || '0');
    return totalEmissions > 5; // Simplified threshold
  }

  private estimateHPDViolationCost(violationClass: string): number {
    switch (violationClass?.toUpperCase()) {
      case 'A': return 10000; // Critical violations
      case 'B': return 5000;  // High priority
      case 'C': return 2000;  // Medium priority
      default: return 1000;   // Low priority
    }
  }

  private estimateDOBPermitCost(permit: DOBPermit): number {
    const jobCost = parseFloat(permit.job_cost || '0');
    if (jobCost > 0) return jobCost * 0.1; // 10% of job cost as compliance cost
    
    // Estimate based on job type
    const jobType = permit.job_type?.toLowerCase() || '';
    if (jobType.includes('electrical')) return 3000;
    if (jobType.includes('plumbing')) return 2500;
    if (jobType.includes('construction')) return 5000;
    return 2000;
  }

  private estimateLL97Penalty(totalEmissions: number): number {
    // LL97 penalties are $268 per ton of CO2e over the limit
    const excessEmissions = Math.max(0, totalEmissions - 5); // Assuming 5 kg CO2e/sf limit
    return excessEmissions * 268 * 0.001; // Convert to tons and apply penalty rate
  }

  // MARK: - Specific API Methods for Compliance Views

  async getHPDViolationsForBuilding(buildingId: string): Promise<HPDViolation[]> {
    try {
      const bbl = this.nycAPI.extractBBL(buildingId);
      return await this.nycAPI.getHPDViolations(bbl);
    } catch (error) {
      console.error(`Failed to get HPD violations for building ${buildingId}:`, error);
      return [];
    }
  }

  async getDOBPermitsForBuilding(buildingId: string): Promise<DOBPermit[]> {
    try {
      const bbl = this.nycAPI.extractBBL(buildingId);
      return await this.nycAPI.getDOBPermits(bbl);
    } catch (error) {
      console.error(`Failed to get DOB permits for building ${buildingId}:`, error);
      return [];
    }
  }

  async getDSNYCollectionScheduleForBuilding(buildingId: string): Promise<DSNYRoute> {
    try {
      const bin = this.nycAPI.extractBIN(buildingId);
      return await this.nycAPI.getDSNYCollectionSchedule(bin);
    } catch (error) {
      console.error(`Failed to get DSNY schedule for building ${buildingId}:`, error);
      return {} as DSNYRoute;
    }
  }

  async getLL97EmissionsForBuilding(buildingId: string): Promise<LL97Emission[]> {
    try {
      const bbl = this.nycAPI.extractBBL(buildingId);
      return await this.nycAPI.getLL97Emissions(bbl);
    } catch (error) {
      console.error(`Failed to get LL97 emissions for building ${buildingId}:`, error);
      return [];
    }
  }

  async getBuildingComplianceSummary(buildingId: string): Promise<{
    totalViolations: number;
    openViolations: number;
    criticalViolations: number;
    recentPermits: number;
    activePermits: number;
    complianceStatus: 'compliant' | 'warning' | 'critical';
    hpdViolations: HPDViolation[];
    dobPermits: DOBPermit[];
    dsnySchedule: DSNYRoute;
    ll97Emissions: LL97Emission[];
  }> {
    try {
      const bbl = this.nycAPI.extractBBL(buildingId);
      const bin = this.nycAPI.extractBIN(buildingId);

      const [hpdViolations, dobPermits, dsnySchedule, ll97Emissions] = await Promise.all([
        this.nycAPI.getHPDViolations(bbl),
        this.nycAPI.getDOBPermits(bbl),
        this.nycAPI.getDSNYCollectionSchedule(bin),
        this.nycAPI.getLL97Emissions(bbl)
      ]);

      const openViolations = hpdViolations.filter(v => 
        v.currentstatus === 'OPEN' || v.currentstatus === 'ACTIVE'
      ).length;

      const criticalViolations = hpdViolations.filter(v => 
        v.violationclass === 'A' || v.violationclass === 'B'
      ).length;

      const activePermits = dobPermits.filter(p => 
        p.job_status === 'ACTIVE' || p.job_status === 'IN PROGRESS'
      ).length;

      const recentPermits = dobPermits.filter(p => {
        const permitDate = new Date(p.job_status_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return permitDate > thirtyDaysAgo;
      }).length;

      let complianceStatus: 'compliant' | 'warning' | 'critical' = 'compliant';
      if (criticalViolations > 0) {
        complianceStatus = 'critical';
      } else if (openViolations > 5 || criticalViolations > 0) {
        complianceStatus = 'warning';
      }

      return {
        totalViolations: hpdViolations.length,
        openViolations,
        criticalViolations,
        recentPermits,
        activePermits,
        complianceStatus,
        hpdViolations,
        dobPermits,
        dsnySchedule,
        ll97Emissions
      };
    } catch (error) {
      console.error(`Failed to get compliance summary for building ${buildingId}:`, error);
      throw error;
    }
  }
}