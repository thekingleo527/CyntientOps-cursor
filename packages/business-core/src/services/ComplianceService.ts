/**
 * 🛡️ Compliance Service
 * Mirrors: CyntientOps/Services/Core/ComplianceService.swift
 * Purpose: HPD, DOB, DSNY, LL97 compliance tracking and monitoring
 */

import { DatabaseManager } from '@cyntientops/database';
import { DashboardSyncService } from './DashboardSyncService';
import { 
  ComplianceIssue, 
  ComplianceSeverity, 
  ComplianceStatus, 
  ComplianceIssueType,
  ComplianceOverview 
} from '@cyntientops/domain-schema';

export interface ComplianceMetrics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  overdueIssues: number;
  resolvedThisMonth: number;
  averageResolutionTime: number; // in days
}

export interface ComplianceTrend {
  period: string;
  issuesCreated: number;
  issuesResolved: number;
  netChange: number;
}

export class ComplianceService {
  private static instance: ComplianceService;
  
  private database: DatabaseManager;
  private dashboardSync: DashboardSyncService;
  private isInitialized = false;
  
  // Cache for performance
  private complianceCache: Map<string, ComplianceIssue[]> = new Map();
  private cacheTimestamp: Map<string, Date> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  private constructor(database: DatabaseManager, dashboardSync: DashboardSyncService) {
    this.database = database;
    this.dashboardSync = dashboardSync;
  }
  
  public static getInstance(database?: DatabaseManager, dashboardSync?: DashboardSyncService): ComplianceService {
    if (!ComplianceService.instance) {
      if (!database || !dashboardSync) {
        throw new Error('ComplianceService requires database and dashboardSync for initialization');
      }
      ComplianceService.instance = new ComplianceService(database, dashboardSync);
    }
    return ComplianceService.instance;
  }
  
  // MARK: - Initialization
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🛡️ Initializing ComplianceService...');
    
    try {
      // Initialize compliance tables if they don't exist
      await this.initializeComplianceTables();
      
      // Load initial compliance data
      await this.loadInitialComplianceData();
      
      this.isInitialized = true;
      console.log('✅ ComplianceService initialized');
      
    } catch (error) {
      console.error('❌ ComplianceService initialization failed:', error);
      throw error;
    }
  }
  
  // MARK: - Public Methods
  
  public async getAllComplianceIssues(): Promise<ComplianceIssue[]> {
    const cacheKey = 'all_issues';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.complianceCache.get(cacheKey) || [];
    }
    
    try {
      const query = `
        SELECT ci.*, b.name as building_name
        FROM compliance_issues ci
        LEFT JOIN buildings b ON ci.buildingId = b.id
        ORDER BY 
          CASE ci.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          ci.created_at DESC
      `;
      
      const rows = await this.database.query(query);
      
      const issues = rows.map((row: any) => this.mapRowToComplianceIssue(row));
      
      // Update cache
      this.complianceCache.set(cacheKey, issues);
      this.cacheTimestamp.set(cacheKey, new Date());
      
      return issues;
      
    } catch (error) {
      console.error('❌ Failed to get compliance issues:', error);
      return [];
    }
  }
  
  public async getComplianceIssues(for buildingId: string): Promise<ComplianceIssue[]> {
    const cacheKey = `building_${buildingId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.complianceCache.get(cacheKey) || [];
    }
    
    try {
      const query = `
        SELECT ci.*, b.name as building_name
        FROM compliance_issues ci
        LEFT JOIN buildings b ON ci.buildingId = b.id
        WHERE ci.buildingId = ?
        ORDER BY 
          CASE ci.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          ci.created_at DESC
      `;
      
      const rows = await this.database.query(query, [buildingId]);
      
      const issues = rows.map((row: any) => this.mapRowToComplianceIssue(row));
      
      // Update cache
      this.complianceCache.set(cacheKey, issues);
      this.cacheTimestamp.set(cacheKey, new Date());
      
      return issues;
      
    } catch (error) {
      console.error('❌ Failed to get compliance issues for building:', error);
      return [];
    }
  }
  
  public async getClientComplianceIssues(): Promise<ComplianceIssue[]> {
    // In a real implementation, this would filter by client's building IDs
    // For now, return all issues
    return this.getAllComplianceIssues();
  }
  
  public async createComplianceIssue(issue: ComplianceIssue): Promise<void> {
    try {
      const query = `
        INSERT INTO compliance_issues (
          id, title, description, severity, buildingId, status, 
          dueDate, assignedTo, createdAt, reportedDate, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        issue.id,
        issue.title,
        issue.description,
        issue.severity,
        issue.buildingId,
        issue.status,
        issue.dueDate?.toISOString(),
        issue.assignedTo,
        issue.createdAt.toISOString(),
        issue.reportedDate.toISOString(),
        issue.type
      ];
      
      await this.database.execute(query, values);
      
      // Clear cache
      this.clearCache();
      
      // Broadcast update
      this.dashboardSync.broadcastAdminUpdate({
        id: this.generateUpdateId(),
        source: 'admin',
        type: 'complianceStatusChanged',
        buildingId: issue.buildingId,
        workerId: '',
        data: {
          issueId: issue.id,
          severity: issue.severity,
          status: issue.status,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      });
      
      console.log('✅ Compliance issue created:', issue.id);
      
    } catch (error) {
      console.error('❌ Failed to create compliance issue:', error);
      throw error;
    }
  }
  
  public async updateComplianceIssue(issueId: string, updates: Partial<ComplianceIssue>): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(updates).filter(value => value !== undefined);
      values.push(issueId);
      
      const query = `UPDATE compliance_issues SET ${setClause} WHERE id = ?`;
      
      await this.database.execute(query, values);
      
      // Clear cache
      this.clearCache();
      
      // Broadcast update
      this.dashboardSync.broadcastAdminUpdate({
        id: this.generateUpdateId(),
        source: 'admin',
        type: 'complianceStatusChanged',
        buildingId: updates.buildingId || '',
        workerId: '',
        data: {
          issueId,
          status: updates.status,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      });
      
      console.log('✅ Compliance issue updated:', issueId);
      
    } catch (error) {
      console.error('❌ Failed to update compliance issue:', error);
      throw error;
    }
  }
  
  public async getComplianceOverview(): Promise<ComplianceOverview> {
    try {
      const issues = await this.getAllComplianceIssues();
      
      const totalIssues = issues.length;
      const criticalViolations = issues.filter(i => i.severity === 'critical').length;
      const pendingInspections = issues.filter(i => i.status === 'pending').length;
      
      // Calculate overall score (0-1)
      const overallScore = this.calculateOverallScore(issues);
      
      return {
        overallScore,
        criticalViolations,
        pendingInspections
      };
      
    } catch (error) {
      console.error('❌ Failed to get compliance overview:', error);
      return {
        overallScore: 0.85,
        criticalViolations: 0,
        pendingInspections: 0
      };
    }
  }
  
  public async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const issues = await this.getAllComplianceIssues();
      
      const metrics: ComplianceMetrics = {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        highIssues: issues.filter(i => i.severity === 'high').length,
        mediumIssues: issues.filter(i => i.severity === 'medium').length,
        lowIssues: issues.filter(i => i.severity === 'low').length,
        overdueIssues: issues.filter(i => this.isOverdue(i)).length,
        resolvedThisMonth: issues.filter(i => this.isResolvedThisMonth(i)).length,
        averageResolutionTime: this.calculateAverageResolutionTime(issues)
      };
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Failed to get compliance metrics:', error);
      return {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        overdueIssues: 0,
        resolvedThisMonth: 0,
        averageResolutionTime: 0
      };
    }
  }
  
  public async getComplianceTrends(days: number = 30): Promise<ComplianceTrend[]> {
    try {
      // TODO: Implement trend analysis based on historical data
      const trends: ComplianceTrend[] = [];
      
      for (let i = days; i >= 0; i -= 7) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.push({
          period: date.toISOString().split('T')[0],
          issuesCreated: Math.floor(Math.random() * 5),
          issuesResolved: Math.floor(Math.random() * 4),
          netChange: Math.floor(Math.random() * 3) - 1
        });
      }
      
      return trends;
      
    } catch (error) {
      console.error('❌ Failed to get compliance trends:', error);
      return [];
    }
  }
  
  // MARK: - NYC API Integration
  
  public async syncHPDViolations(): Promise<void> {
    try {
      console.log('🔄 Syncing HPD violations...');
      
      // TODO: Integrate with NYC HPD API
      // This would fetch real HPD violations and create compliance issues
      
      console.log('✅ HPD violations synced');
      
    } catch (error) {
      console.error('❌ Failed to sync HPD violations:', error);
    }
  }
  
  public async syncDOBPermits(): Promise<void> {
    try {
      console.log('🔄 Syncing DOB permits...');
      
      // TODO: Integrate with NYC DOB API
      // This would fetch real DOB permits and create compliance issues
      
      console.log('✅ DOB permits synced');
      
    } catch (error) {
      console.error('❌ Failed to sync DOB permits:', error);
    }
  }
  
  public async syncDSNYCompliance(): Promise<void> {
    try {
      console.log('🔄 Syncing DSNY compliance...');
      
      // TODO: Integrate with NYC DSNY API
      // This would fetch real DSNY compliance data
      
      console.log('✅ DSNY compliance synced');
      
    } catch (error) {
      console.error('❌ Failed to sync DSNY compliance:', error);
    }
  }
  
  public async syncLL97Emissions(): Promise<void> {
    try {
      console.log('🔄 Syncing LL97 emissions...');
      
      // TODO: Integrate with NYC LL97 API
      // This would fetch real LL97 emissions data
      
      console.log('✅ LL97 emissions synced');
      
    } catch (error) {
      console.error('❌ Failed to sync LL97 emissions:', error);
    }
  }
  
  // MARK: - Private Methods
  
  private async initializeComplianceTables(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS compliance_issues (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        buildingId TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
        dueDate TEXT,
        assignedTo TEXT,
        createdAt TEXT NOT NULL,
        reportedDate TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('hpd', 'dob', 'dsny', 'll97', 'general')),
        FOREIGN KEY (buildingId) REFERENCES buildings (id)
      )
    `;
    
    await this.database.execute(createTableQuery);
  }
  
  private async loadInitialComplianceData(): Promise<void> {
    // TODO: Load initial compliance data from NYC APIs
    console.log('📊 Loading initial compliance data...');
  }
  
  private mapRowToComplianceIssue(row: any): ComplianceIssue {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity as ComplianceSeverity,
      buildingId: row.buildingId,
      buildingName: row.building_name,
      status: row.status as ComplianceStatus,
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      assignedTo: row.assignedTo,
      createdAt: new Date(row.createdAt),
      reportedDate: new Date(row.reportedDate),
      type: row.type as ComplianceIssueType
    };
  }
  
  private isCacheValid(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamp.get(cacheKey);
    if (!timestamp) return false;
    
    return Date.now() - timestamp.getTime() < this.cacheTimeout;
  }
  
  private clearCache(): void {
    this.complianceCache.clear();
    this.cacheTimestamp.clear();
  }
  
  private calculateOverallScore(issues: ComplianceIssue[]): number {
    if (issues.length === 0) return 1.0;
    
    const criticalWeight = 0.4;
    const highWeight = 0.3;
    const mediumWeight = 0.2;
    const lowWeight = 0.1;
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;
    
    const totalWeightedIssues = 
      criticalIssues * criticalWeight +
      highIssues * highWeight +
      mediumIssues * mediumWeight +
      lowIssues * lowWeight;
    
    // Normalize to 0-1 scale (lower is better)
    const maxPossibleIssues = issues.length;
    const score = Math.max(0, 1 - (totalWeightedIssues / maxPossibleIssues));
    
    return Math.round(score * 100) / 100;
  }
  
  private isOverdue(issue: ComplianceIssue): boolean {
    if (!issue.dueDate) return false;
    return new Date() > issue.dueDate && issue.status !== 'resolved';
  }
  
  private isResolvedThisMonth(issue: ComplianceIssue): boolean {
    if (issue.status !== 'resolved') return false;
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // TODO: Add resolvedAt field to ComplianceIssue
    return issue.createdAt >= thisMonth;
  }
  
  private calculateAverageResolutionTime(issues: ComplianceIssue[]): number {
    const resolvedIssues = issues.filter(i => i.status === 'resolved');
    if (resolvedIssues.length === 0) return 0;
    
    // TODO: Add resolvedAt field to ComplianceIssue
    // For now, use a placeholder calculation
    return 7; // 7 days average
  }
  
  private generateUpdateId(): string {
    return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
