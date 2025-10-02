/**
 * 📊 Performance Monitor
 * Mirrors: CyntientOps/Services/Intelligence/PerformanceMonitor.swift
 * Purpose: Real-time performance monitoring and optimization recommendations
 */

import { DatabaseManager } from '@cyntientops/database';
import { Logger } from '@cyntientops/business-core';
import { WorkerProfile, OperationalDataTaskAssignment, Building } from '@cyntientops/domain-schema';

export interface PerformanceMetrics {
  workerId: string;
  workerName: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  tasksCompleted: number;
  tasksOverdue: number;
  totalHours: number;
  averageTaskTime: number;
  efficiencyScore: number; // 0-100
  qualityScore: number; // 0-100
  punctualityScore: number; // 0-100
  overallScore: number; // 0-100
  trends: {
    efficiency: 'improving' | 'stable' | 'declining';
    quality: 'improving' | 'stable' | 'declining';
    punctuality: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  type: 'efficiency' | 'quality' | 'punctuality' | 'safety' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  workerId: string;
  taskId?: string;
  buildingId?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface SystemPerformanceMetrics {
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  systemEfficiency: number;
  clientSatisfaction: number;
  complianceRate: number;
  safetyScore: number;
  bottlenecks: BottleneckAnalysis[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface BottleneckAnalysis {
  id: string;
  type: 'worker' | 'building' | 'task' | 'resource' | 'system';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedWorkers: string[];
  affectedBuildings: string[];
  recommendations: string[];
  estimatedImprovement: number; // percentage
}

export interface OptimizationOpportunity {
  id: string;
  category: 'scheduling' | 'resource_allocation' | 'route_optimization' | 'task_automation';
  title: string;
  description: string;
  potentialSavings: number; // hours or cost
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedAreas: string[];
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private dbManager: DatabaseManager;
  private performanceCache: Map<string, PerformanceMetrics> = new Map();
  private alertThresholds = {
    efficiency: { warning: 70, critical: 50 },
    quality: { warning: 80, critical: 60 },
    punctuality: { warning: 75, critical: 55 },
  };

  private constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  public static getInstance(dbManager: DatabaseManager): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(dbManager);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Get performance metrics for a worker
   */
  public async getWorkerPerformanceMetrics(
    workerId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PerformanceMetrics> {
    const cacheKey = `${workerId}_${period}`;
    
    // Check cache first
    if (this.performanceCache.has(cacheKey)) {
      return this.performanceCache.get(cacheKey)!;
    }

    try {
      const worker = await this.dbManager.getWorkerById(workerId);
      if (!worker) {
        throw new Error(`Worker ${workerId} not found`);
      }

      const { startDate, endDate } = this.getPeriodDates(period);
      
      // Get tasks for the period
      const tasks = await this.getTasksForPeriod(workerId, startDate, endDate);
      
      // Calculate metrics
      const metrics = await this.calculateWorkerMetrics(worker, tasks, period, startDate, endDate);
      
      // Cache the results
      this.performanceCache.set(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      Logger.error('Failed to get worker performance metrics', error, 'PerformanceMonitor');
      throw error;
    }
  }

  /**
   * Get system-wide performance metrics
   */
  public async getSystemPerformanceMetrics(): Promise<SystemPerformanceMetrics> {
    try {
      const workers = await this.dbManager.getWorkers();
      const tasks = await this.dbManager.getTasks();
      const buildings = await this.dbManager.getBuildings();

      const activeWorkers = workers.filter(w => w.status === 'Available' || w.status === 'clockedIn').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = tasks.filter(t => 
        t.status !== 'Completed' && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      ).length;

      // Calculate average completion time
      const completedTasksWithTime = tasks.filter(t => 
        t.status === 'Completed' && 
        t.completion_date && 
        t.scheduled_date
      );
      
      const averageCompletionTime = completedTasksWithTime.length > 0
        ? completedTasksWithTime.reduce((sum, task) => {
            const scheduled = new Date(task.scheduled_date!);
            const completed = new Date(task.completion_date!);
            return sum + (completed.getTime() - scheduled.getTime());
          }, 0) / completedTasksWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Calculate system efficiency
      const systemEfficiency = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      // Calculate compliance rate
      const complianceTasks = tasks.filter(t => 
        t.category === 'Inspection' || 
        t.category === 'Compliance' ||
        t.category === 'Maintenance'
      );
      const completedComplianceTasks = complianceTasks.filter(t => t.status === 'Completed').length;
      const complianceRate = complianceTasks.length > 0 
        ? (completedComplianceTasks / complianceTasks.length) * 100 
        : 100;

      // Analyze bottlenecks
      const bottlenecks = await this.analyzeBottlenecks(workers, tasks, buildings);

      // Find optimization opportunities
      const optimizationOpportunities = await this.findOptimizationOpportunities(workers, tasks, buildings);

      return {
        totalWorkers: workers.length,
        activeWorkers,
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        averageCompletionTime,
        systemEfficiency,
        clientSatisfaction: 85, // Would be calculated from client feedback
        complianceRate,
        safetyScore: 92, // Would be calculated from safety incidents
        bottlenecks,
        optimizationOpportunities,
      };
    } catch (error) {
      Logger.error('Failed to get system performance metrics', error, 'PerformanceMonitor');
      throw error;
    }
  }

  /**
   * Generate performance alerts
   */
  public async generatePerformanceAlerts(): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    
    try {
      const workers = await this.dbManager.getWorkers();
      
      for (const worker of workers) {
        const metrics = await this.getWorkerPerformanceMetrics(worker.id, 'weekly');
        
        // Check efficiency alerts
        if (metrics.efficiencyScore < this.alertThresholds.efficiency.critical) {
          alerts.push({
            id: `efficiency_critical_${worker.id}_${Date.now()}`,
            type: 'efficiency',
            severity: 'critical',
            message: `${worker.name} has critically low efficiency (${metrics.efficiencyScore.toFixed(1)}%)`,
            workerId: worker.id,
            timestamp: new Date(),
            resolved: false,
          });
        } else if (metrics.efficiencyScore < this.alertThresholds.efficiency.warning) {
          alerts.push({
            id: `efficiency_warning_${worker.id}_${Date.now()}`,
            type: 'efficiency',
            severity: 'medium',
            message: `${worker.name} has low efficiency (${metrics.efficiencyScore.toFixed(1)}%)`,
            workerId: worker.id,
            timestamp: new Date(),
            resolved: false,
          });
        }

        // Check quality alerts
        if (metrics.qualityScore < this.alertThresholds.quality.critical) {
          alerts.push({
            id: `quality_critical_${worker.id}_${Date.now()}`,
            type: 'quality',
            severity: 'critical',
            message: `${worker.name} has critically low quality score (${metrics.qualityScore.toFixed(1)}%)`,
            workerId: worker.id,
            timestamp: new Date(),
            resolved: false,
          });
        }

        // Check punctuality alerts
        if (metrics.punctualityScore < this.alertThresholds.punctuality.critical) {
          alerts.push({
            id: `punctuality_critical_${worker.id}_${Date.now()}`,
            type: 'punctuality',
            severity: 'critical',
            message: `${worker.name} has critically low punctuality (${metrics.punctualityScore.toFixed(1)}%)`,
            workerId: worker.id,
            timestamp: new Date(),
            resolved: false,
          });
        }
      }

      // Store alerts in database
      for (const alert of alerts) {
        await this.storePerformanceAlert(alert);
      }

      return alerts;
    } catch (error) {
      Logger.error('Failed to generate performance alerts', error, 'PerformanceMonitor');
      return [];
    }
  }

  /**
   * Get performance trends for a worker
   */
  public async getPerformanceTrends(
    workerId: string,
    periods: number = 12
  ): Promise<{
    efficiency: number[];
    quality: number[];
    punctuality: number[];
    dates: Date[];
  }> {
    try {
      const trends = {
        efficiency: [] as number[],
        quality: [] as number[],
        punctuality: [] as number[],
        dates: [] as Date[],
      };

      for (let i = periods - 1; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i * 7)); // Weekly periods
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        const metrics = await this.getWorkerPerformanceMetrics(workerId, 'weekly');
        
        trends.efficiency.push(metrics.efficiencyScore);
        trends.quality.push(metrics.qualityScore);
        trends.punctuality.push(metrics.punctualityScore);
        trends.dates.push(endDate);
      }

      return trends;
    } catch (error) {
      Logger.error('Failed to get performance trends', error, 'PerformanceMonitor');
      return { efficiency: [], quality: [], punctuality: [], dates: [] };
    }
  }

  /**
   * Calculate worker performance metrics
   */
  private async calculateWorkerMetrics(
    worker: WorkerProfile,
    tasks: OperationalDataTaskAssignment[],
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const overdueTasks = tasks.filter(t => 
      t.status !== 'Completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    );

    // Calculate total hours worked
    const totalHours = await this.calculateTotalHours(worker.id, startDate, endDate);

    // Calculate average task time
    const averageTaskTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          if (task.scheduled_date && task.completion_date) {
            const scheduled = new Date(task.scheduled_date);
            const completed = new Date(task.completion_date);
            return sum + (completed.getTime() - scheduled.getTime());
          }
          return sum;
        }, 0) / completedTasks.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate efficiency score (tasks completed per hour)
    const efficiencyScore = totalHours > 0 ? Math.min(100, (completedTasks.length / totalHours) * 10) : 0;

    // Calculate quality score (based on task completion without issues)
    const qualityScore = completedTasks.length > 0
      ? (completedTasks.filter(t => !t.notes?.includes('issue') && !t.notes?.includes('problem')).length / completedTasks.length) * 100
      : 100;

    // Calculate punctuality score (tasks completed on time)
    const punctualityScore = completedTasks.length > 0
      ? (completedTasks.filter(t => {
          if (t.due_date && t.completion_date) {
            return new Date(t.completion_date) <= new Date(t.due_date);
          }
          return true;
        }).length / completedTasks.length) * 100
      : 100;

    // Calculate overall score
    const overallScore = (efficiencyScore + qualityScore + punctualityScore) / 3;

    // Determine trends (simplified)
    const trends = {
      efficiency: 'stable' as const,
      quality: 'stable' as const,
      punctuality: 'stable' as const,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(efficiencyScore, qualityScore, punctualityScore);

    // Generate alerts
    const alerts = await this.generateWorkerAlerts(worker.id, efficiencyScore, qualityScore, punctualityScore);

    return {
      workerId: worker.id,
      workerName: worker.name,
      period: period as 'daily' | 'weekly' | 'monthly',
      startDate,
      endDate,
      tasksCompleted: completedTasks.length,
      tasksOverdue: overdueTasks.length,
      totalHours,
      averageTaskTime,
      efficiencyScore,
      qualityScore,
      punctualityScore,
      overallScore,
      trends,
      recommendations,
      alerts,
    };
  }

  /**
   * Calculate total hours worked for a period
   */
  private async calculateTotalHours(workerId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      // This would query clock-in/out records from the database
      // For now, we'll estimate based on completed tasks
      const tasks = await this.getTasksForPeriod(workerId, startDate, endDate);
      const completedTasks = tasks.filter(t => t.status === 'Completed');
      
      // Estimate 2 hours per completed task (this would be more sophisticated in reality)
      return completedTasks.length * 2;
    } catch (error) {
      Logger.error('Failed to calculate total hours', error, 'PerformanceMonitor');
      return 0;
    }
  }

  /**
   * Get tasks for a specific period
   */
  private async getTasksForPeriod(workerId: string, startDate: Date, endDate: Date): Promise<OperationalDataTaskAssignment[]> {
    try {
      const allTasks = await this.dbManager.getTasksForWorker(workerId);
      return allTasks.filter(task => {
        if (!task.scheduled_date) return false;
        const taskDate = new Date(task.scheduled_date);
        return taskDate >= startDate && taskDate <= endDate;
      });
    } catch (error) {
      Logger.error('Failed to get tasks for period', error, 'PerformanceMonitor');
      return [];
    }
  }

  /**
   * Get period dates
   */
  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(efficiency: number, quality: number, punctuality: number): string[] {
    const recommendations: string[] = [];

    if (efficiency < 70) {
      recommendations.push('Focus on task prioritization and time management');
      recommendations.push('Consider additional training on efficient work methods');
    }

    if (quality < 80) {
      recommendations.push('Review task completion procedures');
      recommendations.push('Implement quality checkpoints');
    }

    if (punctuality < 75) {
      recommendations.push('Improve scheduling and time estimation');
      recommendations.push('Set earlier start times to account for delays');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current performance level');
      recommendations.push('Look for opportunities to exceed expectations');
    }

    return recommendations;
  }

  /**
   * Generate worker-specific alerts
   */
  private async generateWorkerAlerts(
    workerId: string,
    efficiency: number,
    quality: number,
    punctuality: number
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    if (efficiency < 50) {
      alerts.push({
        id: `efficiency_critical_${workerId}_${Date.now()}`,
        type: 'efficiency',
        severity: 'critical',
        message: 'Critical efficiency issues detected',
        workerId,
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (quality < 60) {
      alerts.push({
        id: `quality_critical_${workerId}_${Date.now()}`,
        type: 'quality',
        severity: 'critical',
        message: 'Critical quality issues detected',
        workerId,
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (punctuality < 55) {
      alerts.push({
        id: `punctuality_critical_${workerId}_${Date.now()}`,
        type: 'punctuality',
        severity: 'critical',
        message: 'Critical punctuality issues detected',
        workerId,
        timestamp: new Date(),
        resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Analyze system bottlenecks
   */
  private async analyzeBottlenecks(
    workers: WorkerProfile[],
    tasks: OperationalDataTaskAssignment[],
    _buildings: Building[]
  ): Promise<BottleneckAnalysis[]> {
    const bottlenecks: BottleneckAnalysis[] = [];

    // Analyze worker bottlenecks
    const workerTaskCounts = new Map<string, number>();
    tasks.forEach(task => {
      if (task.assigned_worker_id) {
        workerTaskCounts.set(task.assigned_worker_id, (workerTaskCounts.get(task.assigned_worker_id) || 0) + 1);
      }
    });

    const maxTasks = Math.max(...Array.from(workerTaskCounts.values()));
    const overloadedWorkers = Array.from(workerTaskCounts.entries())
      .filter(([_, count]) => count > maxTasks * 0.8)
      .map(([workerId, _]) => workerId);

    if (overloadedWorkers.length > 0) {
      bottlenecks.push({
        id: 'worker_overload',
        type: 'worker',
        description: 'Some workers are overloaded with tasks',
        impact: 'high',
        affectedWorkers: overloadedWorkers,
        affectedBuildings: [],
        recommendations: [
          'Redistribute tasks among available workers',
          'Consider hiring additional staff',
          'Implement task prioritization system'
        ],
        estimatedImprovement: 25,
      });
    }

    // Analyze building bottlenecks
    const buildingTaskCounts = new Map<string, number>();
    tasks.forEach(task => {
      if (task.assigned_building_id) {
        buildingTaskCounts.set(task.assigned_building_id, (buildingTaskCounts.get(task.assigned_building_id) || 0) + 1);
      }
    });

    const highTaskBuildings = Array.from(buildingTaskCounts.entries())
      .filter(([_, count]) => count > 10)
      .map(([buildingId, _]) => buildingId);

    if (highTaskBuildings.length > 0) {
      bottlenecks.push({
        id: 'building_overload',
        type: 'building',
        description: 'Some buildings have excessive task loads',
        impact: 'medium',
        affectedWorkers: [],
        affectedBuildings: highTaskBuildings,
        recommendations: [
          'Increase staffing for high-demand buildings',
          'Optimize task scheduling',
          'Consider building-specific maintenance schedules'
        ],
        estimatedImprovement: 15,
      });
    }

    return bottlenecks;
  }

  /**
   * Find optimization opportunities
   */
  private async findOptimizationOpportunities(
    workers: WorkerProfile[],
    tasks: OperationalDataTaskAssignment[],
    _buildings: Building[]
  ): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Route optimization opportunity
    const workersWithMultipleBuildings = workers.filter(worker => {
      const workerBuildings = new Set(
        tasks.filter(t => t.assigned_worker_id === worker.id)
          .map(t => t.assigned_building_id)
          .filter(Boolean)
      );
      return workerBuildings.size > 3;
    });

    if (workersWithMultipleBuildings.length > 0) {
      opportunities.push({
        id: 'route_optimization',
        category: 'route_optimization',
        title: 'Route Optimization',
        description: 'Optimize worker routes to reduce travel time between buildings',
        potentialSavings: 2, // hours per day
        implementationEffort: 'medium',
        priority: 'high',
        affectedAreas: workersWithMultipleBuildings.map(w => w.id),
      });
    }

    // Task automation opportunity
    const repetitiveTasks = tasks.filter(task => {
      const taskName = task.name.toLowerCase();
      return taskName.includes('cleaning') || 
             taskName.includes('inspection') || 
             taskName.includes('maintenance');
    });

    if (repetitiveTasks.length > 10) {
      opportunities.push({
        id: 'task_automation',
        category: 'task_automation',
        title: 'Task Automation',
        description: 'Automate repetitive tasks to improve efficiency',
        potentialSavings: 5, // hours per week
        implementationEffort: 'high',
        priority: 'medium',
        affectedAreas: ['system'],
      });
    }

    return opportunities;
  }

  /**
   * Store performance alert in database
   */
  private async storePerformanceAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await this.dbManager.insert('performance_alerts', {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        worker_id: alert.workerId,
        task_id: alert.taskId,
        building_id: alert.buildingId,
        timestamp: alert.timestamp.getTime(),
        resolved: alert.resolved,
        resolution: alert.resolution,
      });
    } catch (error) {
      Logger.error('Failed to store performance alert', error, 'PerformanceMonitor');
    }
  }

  /**
   * Clear performance cache
   */
  public clearCache(): void {
    this.performanceCache.clear();
  }
}
