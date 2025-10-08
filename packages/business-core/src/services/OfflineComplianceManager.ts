/**
 * 🏢 Offline Compliance Manager
 * Purpose: Offline access to compliance data with intelligent caching
 * Features: Violation caching, inspection data, permit tracking, offline analytics
 */

import { Logger } from './LoggingService';
import { OfflineSupportManager } from './OfflineSupportManager';

export interface OfflineViolation {
  id: string;
  buildingId: string;
  type: 'HPD' | 'DSNY' | 'FDNY' | 'DOB' | '311';
  status: 'open' | 'closed' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  issueDate: string;
  dueDate?: string;
  fineAmount?: number;
  inspectorId?: string;
  lastUpdated: string;
  cachedAt: string;
  ttl: number; // Time to live in milliseconds
}

export interface OfflineInspection {
  id: string;
  buildingId: string;
  type: 'HPD' | 'DSNY' | 'FDNY' | 'DOB';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  scheduledDate: string;
  completedDate?: string;
  inspectorId?: string;
  result?: 'pass' | 'fail' | 'conditional';
  notes?: string;
  violations?: string[];
  cachedAt: string;
  ttl: number;
}

export interface OfflinePermit {
  id: string;
  buildingId: string;
  type: 'construction' | 'electrical' | 'plumbing' | 'hvac' | 'fire_safety';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  applicationDate: string;
  approvalDate?: string;
  expirationDate?: string;
  description: string;
  applicantId?: string;
  cachedAt: string;
  ttl: number;
}

export interface ComplianceSummary {
  buildingId: string;
  totalViolations: number;
  openViolations: number;
  criticalViolations: number;
  totalFines: number;
  complianceScore: number;
  lastUpdated: string;
  cachedAt: string;
  ttl: number;
}

export class OfflineComplianceManager {
  private static instance: OfflineComplianceManager;
  private offlineManager: OfflineSupportManager | null = null;
  private violations: Map<string, OfflineViolation> = new Map();
  private inspections: Map<string, OfflineInspection> = new Map();
  private permits: Map<string, OfflinePermit> = new Map();
  private summaries: Map<string, ComplianceSummary> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): OfflineComplianceManager {
    if (!OfflineComplianceManager.instance) {
      OfflineComplianceManager.instance = new OfflineComplianceManager();
    }
    return OfflineComplianceManager.instance;
  }

  public async initialize(offlineManager: OfflineSupportManager): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.offlineManager = offlineManager;
    await this.loadCachedData();
    this.isInitialized = true;

    Logger.info('Offline compliance manager initialized', 'OfflineComplianceManager');
  }

  private async loadCachedData(): Promise<void> {
    try {
      // Load violations
      const violationsData = await this.offlineManager!.getCachedData('offline_violations');
      if (violationsData) {
        this.violations = new Map(Object.entries(violationsData));
      }

      // Load inspections
      const inspectionsData = await this.offlineManager!.getCachedData('offline_inspections');
      if (inspectionsData) {
        this.inspections = new Map(Object.entries(inspectionsData));
      }

      // Load permits
      const permitsData = await this.offlineManager!.getCachedData('offline_permits');
      if (permitsData) {
        this.permits = new Map(Object.entries(permitsData));
      }

      // Load summaries
      const summariesData = await this.offlineManager!.getCachedData('offline_compliance_summaries');
      if (summariesData) {
        this.summaries = new Map(Object.entries(summariesData));
      }

      Logger.info(`Loaded cached compliance data: ${this.violations.size} violations, ${this.inspections.size} inspections, ${this.permits.size} permits`, 'OfflineComplianceManager');
    } catch (error) {
      Logger.error('Failed to load cached compliance data', error, 'OfflineComplianceManager');
    }
  }

  private async saveCachedData(): Promise<void> {
    try {
      await Promise.all([
        this.offlineManager!.cacheData('offline_violations', Object.fromEntries(this.violations)),
        this.offlineManager!.cacheData('offline_inspections', Object.fromEntries(this.inspections)),
        this.offlineManager!.cacheData('offline_permits', Object.fromEntries(this.permits)),
        this.offlineManager!.cacheData('offline_compliance_summaries', Object.fromEntries(this.summaries)),
      ]);
    } catch (error) {
      Logger.error('Failed to save cached compliance data', error, 'OfflineComplianceManager');
    }
  }

  public async cacheViolations(buildingId: string, violations: any[]): Promise<void> {
    const now = Date.now();
    const ttl = 30 * 60 * 1000; // 30 minutes

    for (const violation of violations) {
      const offlineViolation: OfflineViolation = {
        id: violation.id,
        buildingId,
        type: violation.type,
        status: violation.status,
        severity: violation.severity,
        description: violation.description,
        issueDate: violation.issueDate,
        dueDate: violation.dueDate,
        fineAmount: violation.fineAmount,
        inspectorId: violation.inspectorId,
        lastUpdated: violation.lastUpdated || new Date().toISOString(),
        cachedAt: new Date().toISOString(),
        ttl,
      };

      this.violations.set(violation.id, offlineViolation);
    }

    await this.saveCachedData();
    Logger.info(`Cached ${violations.length} violations for building: ${buildingId}`, 'OfflineComplianceManager');
  }

  public async cacheInspections(buildingId: string, inspections: any[]): Promise<void> {
    const now = Date.now();
    const ttl = 60 * 60 * 1000; // 1 hour

    for (const inspection of inspections) {
      const offlineInspection: OfflineInspection = {
        id: inspection.id,
        buildingId,
        type: inspection.type,
        status: inspection.status,
        scheduledDate: inspection.scheduledDate,
        completedDate: inspection.completedDate,
        inspectorId: inspection.inspectorId,
        result: inspection.result,
        notes: inspection.notes,
        violations: inspection.violations,
        cachedAt: new Date().toISOString(),
        ttl,
      };

      this.inspections.set(inspection.id, offlineInspection);
    }

    await this.saveCachedData();
    Logger.info(`Cached ${inspections.length} inspections for building: ${buildingId}`, 'OfflineComplianceManager');
  }

  public async cachePermits(buildingId: string, permits: any[]): Promise<void> {
    const now = Date.now();
    const ttl = 24 * 60 * 60 * 1000; // 24 hours

    for (const permit of permits) {
      const offlinePermit: OfflinePermit = {
        id: permit.id,
        buildingId,
        type: permit.type,
        status: permit.status,
        applicationDate: permit.applicationDate,
        approvalDate: permit.approvalDate,
        expirationDate: permit.expirationDate,
        description: permit.description,
        applicantId: permit.applicantId,
        cachedAt: new Date().toISOString(),
        ttl,
      };

      this.permits.set(permit.id, offlinePermit);
    }

    await this.saveCachedData();
    Logger.info(`Cached ${permits.length} permits for building: ${buildingId}`, 'OfflineComplianceManager');
  }

  public async getViolationsForBuilding(buildingId: string): Promise<OfflineViolation[]> {
    const violations = Array.from(this.violations.values())
      .filter(v => v.buildingId === buildingId && this.isDataValid(v.cachedAt, v.ttl))
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return violations;
  }

  public async getOpenViolationsForBuilding(buildingId: string): Promise<OfflineViolation[]> {
    const violations = await this.getViolationsForBuilding(buildingId);
    return violations.filter(v => v.status === 'open');
  }

  public async getCriticalViolationsForBuilding(buildingId: string): Promise<OfflineViolation[]> {
    const violations = await this.getViolationsForBuilding(buildingId);
    return violations.filter(v => v.severity === 'critical' && v.status === 'open');
  }

  public async getInspectionsForBuilding(buildingId: string): Promise<OfflineInspection[]> {
    const inspections = Array.from(this.inspections.values())
      .filter(i => i.buildingId === buildingId && this.isDataValid(i.cachedAt, i.ttl))
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

    return inspections;
  }

  public async getUpcomingInspections(buildingId: string): Promise<OfflineInspection[]> {
    const inspections = await this.getInspectionsForBuilding(buildingId);
    const now = new Date();
    return inspections.filter(i => 
      i.status === 'scheduled' && 
      new Date(i.scheduledDate) > now
    );
  }

  public async getPermitsForBuilding(buildingId: string): Promise<OfflinePermit[]> {
    const permits = Array.from(this.permits.values())
      .filter(p => p.buildingId === buildingId && this.isDataValid(p.cachedAt, p.ttl))
      .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());

    return permits;
  }

  public async getActivePermits(buildingId: string): Promise<OfflinePermit[]> {
    const permits = await this.getPermitsForBuilding(buildingId);
    return permits.filter(p => p.status === 'approved');
  }

  public async getComplianceSummary(buildingId: string): Promise<ComplianceSummary | null> {
    const summary = this.summaries.get(buildingId);
    
    if (!summary || !this.isDataValid(summary.cachedAt, summary.ttl)) {
      // Generate summary from cached data
      return await this.generateComplianceSummary(buildingId);
    }

    return summary;
  }

  private async generateComplianceSummary(buildingId: string): Promise<ComplianceSummary> {
    const violations = await this.getViolationsForBuilding(buildingId);
    const openViolations = violations.filter(v => v.status === 'open');
    const criticalViolations = openViolations.filter(v => v.severity === 'critical');
    const totalFines = violations.reduce((sum, v) => sum + (v.fineAmount || 0), 0);

    // Calculate compliance score (0-100)
    const complianceScore = Math.max(0, 100 - (openViolations.length * 5) - (criticalViolations.length * 15));

    const summary: ComplianceSummary = {
      buildingId,
      totalViolations: violations.length,
      openViolations: openViolations.length,
      criticalViolations: criticalViolations.length,
      totalFines,
      complianceScore,
      lastUpdated: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      ttl: 15 * 60 * 1000, // 15 minutes
    };

    this.summaries.set(buildingId, summary);
    await this.saveCachedData();

    return summary;
  }

  public async getPortfolioComplianceSummary(buildingIds: string[]): Promise<{
    totalBuildings: number;
    totalViolations: number;
    openViolations: number;
    criticalViolations: number;
    averageComplianceScore: number;
    totalFines: number;
  }> {
    let totalViolations = 0;
    let openViolations = 0;
    let criticalViolations = 0;
    let totalFines = 0;
    let totalComplianceScore = 0;
    let validBuildings = 0;

    for (const buildingId of buildingIds) {
      const summary = await this.getComplianceSummary(buildingId);
      if (summary) {
        totalViolations += summary.totalViolations;
        openViolations += summary.openViolations;
        criticalViolations += summary.criticalViolations;
        totalFines += summary.totalFines;
        totalComplianceScore += summary.complianceScore;
        validBuildings++;
      }
    }

    return {
      totalBuildings: validBuildings,
      totalViolations,
      openViolations,
      criticalViolations,
      averageComplianceScore: validBuildings > 0 ? totalComplianceScore / validBuildings : 0,
      totalFines,
    };
  }

  private isDataValid(cachedAt: string, ttl: number): boolean {
    const now = Date.now();
    const cacheTime = new Date(cachedAt).getTime();
    return (now - cacheTime) < ttl;
  }

  public async clearExpiredData(): Promise<void> {
    const now = Date.now();
    let clearedCount = 0;

    // Clear expired violations
    for (const [id, violation] of this.violations.entries()) {
      if (!this.isDataValid(violation.cachedAt, violation.ttl)) {
        this.violations.delete(id);
        clearedCount++;
      }
    }

    // Clear expired inspections
    for (const [id, inspection] of this.inspections.entries()) {
      if (!this.isDataValid(inspection.cachedAt, inspection.ttl)) {
        this.inspections.delete(id);
        clearedCount++;
      }
    }

    // Clear expired permits
    for (const [id, permit] of this.permits.entries()) {
      if (!this.isDataValid(permit.cachedAt, permit.ttl)) {
        this.permits.delete(id);
        clearedCount++;
      }
    }

    // Clear expired summaries
    for (const [id, summary] of this.summaries.entries()) {
      if (!this.isDataValid(summary.cachedAt, summary.ttl)) {
        this.summaries.delete(id);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      await this.saveCachedData();
      Logger.info(`Cleared ${clearedCount} expired compliance data entries`, 'OfflineComplianceManager');
    }
  }

  public getCacheStats() {
    return {
      violations: this.violations.size,
      inspections: this.inspections.size,
      permits: this.permits.size,
      summaries: this.summaries.size,
      totalCached: this.violations.size + this.inspections.size + this.permits.size + this.summaries.size,
    };
  }

  public destroy(): void {
    this.violations.clear();
    this.inspections.clear();
    this.permits.clear();
    this.summaries.clear();
    this.offlineManager = null;
    this.isInitialized = false;
    
    Logger.info('Offline compliance manager destroyed', 'OfflineComplianceManager');
  }

  public static destroyInstance(): void {
    if (OfflineComplianceManager.instance) {
      OfflineComplianceManager.instance.destroy();
      OfflineComplianceManager.instance = null as any;
    }
  }
}

export default OfflineComplianceManager;
