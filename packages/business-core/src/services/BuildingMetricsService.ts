/**
 * 📊 Building Metrics Service
 * Provides comprehensive building performance metrics and analytics
 */

import { OperationalDataService } from './OperationalDataService';
import { BuildingService } from './BuildingService';
import { TaskService } from './TaskService';
import { NYCAPIService } from '@cyntientops/api-clients';

export interface BuildingMetrics {
  buildingId: string;
  overallScore: number;
  hpdViolations: number;
  dobPermits: number;
  dsnyCompliance: boolean;
  taskCompletionRate: number;
  lastInspection: Date | null;
  nextInspection: Date | null;
  efficiencyScore: number;
  complianceTrend: 'improving' | 'stable' | 'declining';
  criticalIssues: string[];
  performanceBreakdown: {
    compliance: number;
    maintenance: number;
    safety: number;
    efficiency: number;
  };
  lastUpdated: Date;
}

export class BuildingMetricsService {
  private static instance: BuildingMetricsService;
  private operationalDataService: OperationalDataService;
  private buildingService: BuildingService;
  private taskService: TaskService;
  private nycAPIService: NYCAPIService;

  private constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.buildingService = new BuildingService();
    this.taskService = new TaskService();
    this.nycAPIService = new NYCAPIService();
  }

  public static getInstance(): BuildingMetricsService {
    if (!BuildingMetricsService.instance) {
      BuildingMetricsService.instance = new BuildingMetricsService();
    }
    return BuildingMetricsService.instance;
  }

  /**
   * Get comprehensive building metrics
   */
  public async getBuildingMetrics(buildingId: string): Promise<BuildingMetrics> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }

    const tasks = this.taskService.getAllTasks().filter(t => t.assigned_building_id === buildingId);
    
    // Get real NYC API data
    let complianceData;
    try {
      complianceData = await this.nycAPIService.getBuildingComplianceData(
        building.bbl, 
        building.bin, 
        building.address
      );
    } catch (error) {
      console.warn(`Failed to fetch compliance data for building ${buildingId}:`, error);
      // Fallback to building data
      complianceData = {
        violations: [],
        permits: [],
        dsnyViolations: { isEmpty: true, summons: [] },
        emissions: []
      };
    }
    
    const overallScore = this.calculateOverallScore(building, complianceData, tasks);
    const taskCompletionRate = this.calculateTaskCompletionRate(tasks);
    const efficiencyScore = this.calculateEfficiencyScore(tasks, building);
    const complianceTrend = this.calculateComplianceTrend(building, complianceData);
    const criticalIssues = this.identifyCriticalIssues(complianceData, tasks);
    
    return {
      buildingId,
      overallScore,
      hpdViolations: complianceData.violations.length,
      dobPermits: complianceData.permits.length,
      dsnyCompliance: complianceData.dsnyViolations?.isEmpty || true,
      taskCompletionRate,
      lastInspection: building.lastInspection ? new Date(building.lastInspection) : null,
      nextInspection: this.calculateNextInspection(building),
      efficiencyScore,
      complianceTrend,
      criticalIssues,
      performanceBreakdown: {
        compliance: this.calculateComplianceScore(complianceData),
        maintenance: this.calculateMaintenanceScore(tasks),
        safety: this.calculateSafetyScore(complianceData),
        efficiency: efficiencyScore
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get metrics for multiple buildings
   */
  public async getPortfolioMetrics(buildingIds: string[]): Promise<BuildingMetrics[]> {
    const metrics = await Promise.all(
      buildingIds.map(id => this.getBuildingMetrics(id))
    );
    return metrics;
  }

  /**
   * Get portfolio summary metrics
   */
  public async getPortfolioSummary(): Promise<{
    totalBuildings: number;
    averageScore: number;
    totalViolations: number;
    totalOutstandingFines: number;
    criticalBuildings: number;
    topPerformers: Array<{ buildingId: string; score: number; name: string }>;
    bottomPerformers: Array<{ buildingId: string; score: number; name: string }>;
  }> {
    const buildings = this.buildingService.getAllBuildings();
    const metrics = await this.getPortfolioMetrics(buildings.map(b => b.id));
    
    const totalViolations = metrics.reduce((sum, m) => sum + m.hpdViolations, 0);
    const averageScore = metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length;
    const criticalBuildings = metrics.filter(m => m.overallScore < 70).length;
    
    // Calculate outstanding fines from real violation data
    let totalOutstandingFines = 0;
    for (const building of buildings) {
      try {
        const complianceData = await this.nycAPIService.getBuildingComplianceData(
          building.bbl, 
          building.bin, 
          building.address
        );
        if (complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty) {
          totalOutstandingFines += complianceData.dsnyViolations.summons.reduce((sum, s) => {
            return sum + (parseFloat(s.balance_due) || 0);
          }, 0);
        }
      } catch (error) {
        // Skip buildings with API errors
      }
    }
    
    const topPerformers = metrics
      .map(m => ({
        buildingId: m.buildingId,
        score: m.overallScore,
        name: buildings.find(b => b.id === m.buildingId)?.name || 'Unknown'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    const bottomPerformers = metrics
      .map(m => ({
        buildingId: m.buildingId,
        score: m.overallScore,
        name: buildings.find(b => b.id === m.buildingId)?.name || 'Unknown'
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
    
    return {
      totalBuildings: buildings.length,
      averageScore,
      totalViolations,
      totalOutstandingFines,
      criticalBuildings,
      topPerformers,
      bottomPerformers
    };
  }

  /**
   * Calculate overall building score
   */
  private calculateOverallScore(building: any, complianceData: any, tasks: any[]): number {
    const baseScore = building.compliance_score * 100 || 95;
    
    // Penalties for violations
    const violationPenalty = complianceData.violations.length * 5;
    const dsnyPenalty = complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty ? 
      complianceData.dsnyViolations.summons.reduce((sum: number, s: any) => {
        const fine = parseFloat(s.balance_due) || 0;
        return sum + (fine > 1000 ? 10 : fine > 500 ? 5 : 2);
      }, 0) : 0;
    
    // Task completion bonus/penalty
    const taskCompletionRate = this.calculateTaskCompletionRate(tasks);
    const taskBonus = taskCompletionRate > 90 ? 5 : taskCompletionRate < 70 ? -10 : 0;
    
    return Math.max(0, Math.min(100, baseScore - violationPenalty - dsnyPenalty + taskBonus));
  }

  /**
   * Calculate task completion rate
   */
  private calculateTaskCompletionRate(tasks: any[]): number {
    if (tasks.length === 0) return 100;
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    return (completedTasks / tasks.length) * 100;
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiencyScore(tasks: any[], building: any): number {
    if (tasks.length === 0) return 100;
    
    const completedTasks = tasks.filter(task => task.isCompleted);
    const overdueTasks = tasks.filter(task => {
      if (task.isCompleted) return false;
      if (!task.due_date) return false;
      return new Date(task.due_date) < new Date();
    });
    
    const completionRate = (completedTasks.length / tasks.length) * 100;
    const overdueRate = (overdueTasks.length / tasks.length) * 100;
    
    return Math.max(0, completionRate - (overdueRate * 2));
  }

  /**
   * Calculate compliance trend
   */
  private calculateComplianceTrend(building: any, complianceData: any): 'improving' | 'stable' | 'declining' {
    // This would ideally use historical data, but for now we'll use current indicators
    const currentScore = building.compliance_score * 100 || 95;
    const violationCount = complianceData.violations.length;
    const dsnyIssues = complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty;
    
    if (currentScore >= 90 && violationCount === 0 && !dsnyIssues) {
      return 'improving';
    } else if (currentScore < 70 || violationCount > 2 || dsnyIssues) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Identify critical issues
   */
  private identifyCriticalIssues(complianceData: any, tasks: any[]): string[] {
    const issues: string[] = [];
    
    // HPD violations
    if (complianceData.violations.length > 0) {
      issues.push(`${complianceData.violations.length} HPD violations`);
    }
    
    // DSNY violations
    if (complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty) {
      const outstandingFines = complianceData.dsnyViolations.summons.reduce((sum: number, s: any) => {
        return sum + (parseFloat(s.balance_due) || 0);
      }, 0);
      
      if (outstandingFines > 1000) {
        issues.push(`$${outstandingFines.toLocaleString()} in outstanding DSNY fines`);
      }
      
      const defaultedViolations = complianceData.dsnyViolations.summons.filter((s: any) => 
        s.hearing_status && s.hearing_status.includes('DEFAULTED')
      ).length;
      
      if (defaultedViolations > 0) {
        issues.push(`${defaultedViolations} defaulted DSNY violations`);
      }
    }
    
    // Overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (task.isCompleted) return false;
      if (!task.due_date) return false;
      return new Date(task.due_date) < new Date();
    });
    
    if (overdueTasks.length > 0) {
      issues.push(`${overdueTasks.length} overdue tasks`);
    }
    
    return issues;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(complianceData: any): number {
    let score = 100;
    
    // Penalty for HPD violations
    score -= complianceData.violations.length * 10;
    
    // Penalty for DSNY violations
    if (complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty) {
      const violationCount = complianceData.dsnyViolations.summons.length;
      score -= violationCount * 5;
      
      // Additional penalty for outstanding fines
      const outstandingFines = complianceData.dsnyViolations.summons.reduce((sum: number, s: any) => {
        return sum + (parseFloat(s.balance_due) || 0);
      }, 0);
      
      if (outstandingFines > 1000) {
        score -= 15;
      }
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculate maintenance score
   */
  private calculateMaintenanceScore(tasks: any[]): number {
    if (tasks.length === 0) return 100;
    
    const maintenanceTasks = tasks.filter(task => 
      task.category && task.category.toLowerCase().includes('maintenance')
    );
    
    if (maintenanceTasks.length === 0) return 100;
    
    const completedMaintenance = maintenanceTasks.filter(task => task.isCompleted).length;
    return (completedMaintenance / maintenanceTasks.length) * 100;
  }

  /**
   * Calculate safety score
   */
  private calculateSafetyScore(complianceData: any): number {
    let score = 100;
    
    // Safety-related violations
    const safetyViolations = complianceData.violations.filter((v: any) => 
      v.type && (v.type.toLowerCase().includes('safety') || v.type.toLowerCase().includes('fire'))
    );
    
    score -= safetyViolations.length * 20;
    
    // DSNY safety violations
    if (complianceData.dsnyViolations && !complianceData.dsnyViolations.isEmpty) {
      const safetyDSNYViolations = complianceData.dsnyViolations.summons.filter((s: any) => 
        s.violation_type && s.violation_type.toLowerCase().includes('safety')
      );
      
      score -= safetyDSNYViolations.length * 15;
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculate next inspection date
   */
  private calculateNextInspection(building: any): Date | null {
    if (!building.lastInspection) return null;
    
    const lastInspection = new Date(building.lastInspection);
    const nextInspection = new Date(lastInspection);
    nextInspection.setFullYear(nextInspection.getFullYear() + 1); // Annual inspection
    
    return nextInspection;
  }
}
