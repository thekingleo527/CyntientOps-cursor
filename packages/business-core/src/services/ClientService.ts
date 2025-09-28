/**
 * 👔 ClientService
 * Mirrors: CyntientOps/Services/Client/ClientService.swift
 * Purpose: Client portfolio management and relationship tracking
 */

import { OperationalDataService } from './OperationalDataService';
import { BuildingService } from './BuildingService';
import { TaskService } from './TaskService';
import { CanonicalIDs } from '@cyntientops/domain-schema';
import { PortfolioMetrics } from '@cyntientops/domain-schema';

export interface ClientPortfolio {
  clientId: string;
  clientName: string;
  totalBuildings: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  urgentTasks: number;
  averageComplianceScore: number;
  monthlySpend: number;
  projectedCosts: number;
  efficiency: number;
  buildings: Array<{
    buildingId: string;
    buildingName: string;
    complianceScore: number;
    taskCount: number;
    overdueCount: number;
    urgentCount: number;
  }>;
}

export interface ClientPerformanceMetrics {
  clientId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  metrics: {
    taskCompletionRate: number;
    averageTaskTime: number;
    complianceScore: number;
    costEfficiency: number;
    workerUtilization: number;
    customerSatisfaction: number;
  };
}

export interface ClientBillingSummary {
  clientId: string;
  period: string;
  totalHours: number;
  totalCost: number;
  taskBreakdown: Array<{
    category: string;
    hours: number;
    cost: number;
  }>;
  buildingBreakdown: Array<{
    buildingId: string;
    buildingName: string;
    hours: number;
    cost: number;
  }>;
}

export class ClientService {
  private operationalDataService: OperationalDataService;
  private buildingService: BuildingService;
  private taskService: TaskService;

  constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.buildingService = new BuildingService();
    this.taskService = new TaskService();
  }

  /**
   * Get all clients
   */
  public getClients(): any[] {
    return this.operationalDataService.getClients();
  }

  /**
   * Get client by ID
   */
  public getClientById(clientId: string): any | undefined {
    return this.operationalDataService.getClientById(clientId);
  }

  /**
   * Get active clients
   */
  public getActiveClients(): any[] {
    return this.getClients().filter(client => client.is_active);
  }

  /**
   * Get client portfolio
   */
  public getClientPortfolio(clientId: string): ClientPortfolio {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const buildings = this.buildingService.getBuildingsByClient(clientId);
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let urgentTasks = 0;
    let totalComplianceScore = 0;

    const buildingDetails = buildings.map(building => {
      const buildingTasks = this.taskService.getTasksForBuilding(building.id);
      const buildingOverdue = this.buildingService.getOverdueTasks(building.id);
      const buildingUrgent = this.buildingService.getUrgentTasks(building.id);
      const buildingCompleted = buildingTasks.filter(t => t.status === 'Completed').length;

      totalTasks += buildingTasks.length;
      completedTasks += buildingCompleted;
      overdueTasks += buildingOverdue.length;
      urgentTasks += buildingUrgent.length;
      totalComplianceScore += building.compliance_score || 0.85;

      return {
        buildingId: building.id,
        buildingName: building.name,
        complianceScore: building.compliance_score || 0.85,
        taskCount: buildingTasks.length,
        overdueCount: buildingOverdue.length,
        urgentCount: buildingUrgent.length
      };
    });

    const averageComplianceScore = buildings.length > 0 ? totalComplianceScore / buildings.length : 0;

    // Calculate estimated costs (simplified)
    const monthlySpend = this.calculateMonthlySpend(clientId);
    const projectedCosts = this.calculateProjectedCosts(clientId);
    const efficiency = this.calculateEfficiency(clientId);

    return {
      clientId,
      clientName: client.name,
      totalBuildings: buildings.length,
      totalTasks,
      completedTasks,
      overdueTasks,
      urgentTasks,
      averageComplianceScore,
      monthlySpend,
      projectedCosts,
      efficiency,
      buildings: buildingDetails
    };
  }

  /**
   * Get client performance metrics
   */
  public getClientPerformanceMetrics(
    clientId: string, 
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): ClientPerformanceMetrics {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const endDate = new Date();
    const startDate = this.getPeriodStartDate(endDate, period);

    const buildings = this.buildingService.getBuildingsByClient(clientId);
    let totalTasks = 0;
    let completedTasks = 0;
    let totalTaskTime = 0;

    buildings.forEach(building => {
      const buildingTasks = this.taskService.getTasksForBuilding(building.id);
      totalTasks += buildingTasks.length;
      completedTasks += buildingTasks.filter(t => t.status === 'Completed').length;
      totalTaskTime += buildingTasks.reduce((sum, task) => sum + (task.estimatedDuration || 60), 0);
    });

    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const averageTaskTime = completedTasks > 0 ? totalTaskTime / completedTasks : 0;
    const complianceScore = this.getClientPortfolio(clientId).averageComplianceScore;
    const costEfficiency = this.calculateEfficiency(clientId);
    const workerUtilization = this.calculateWorkerUtilization(clientId);
    const customerSatisfaction = this.calculateCustomerSatisfaction(clientId);

    return {
      clientId,
      period,
      startDate,
      endDate,
      metrics: {
        taskCompletionRate,
        averageTaskTime,
        complianceScore,
        costEfficiency,
        workerUtilization,
        customerSatisfaction
      }
    };
  }

  /**
   * Get client billing summary
   */
  public getClientBillingSummary(clientId: string, period: string = 'current-month'): ClientBillingSummary {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const buildings = this.buildingService.getBuildingsByClient(clientId);
    let totalHours = 0;
    let totalCost = 0;

    const taskBreakdown: Record<string, { hours: number; cost: number }> = {};
    const buildingBreakdown: Array<{
      buildingId: string;
      buildingName: string;
      hours: number;
      cost: number;
    }> = [];

    buildings.forEach(building => {
      const buildingTasks = this.taskService.getTasksForBuilding(building.id);
      let buildingHours = 0;
      let buildingCost = 0;

      buildingTasks.forEach(task => {
        const taskHours = (task.estimatedDuration || 60) / 60; // Convert minutes to hours
        const taskCost = taskHours * 25; // Default $25/hour rate

        buildingHours += taskHours;
        buildingCost += taskCost;

        // Add to category breakdown
        const category = task.category || 'Other';
        if (!taskBreakdown[category]) {
          taskBreakdown[category] = { hours: 0, cost: 0 };
        }
        taskBreakdown[category].hours += taskHours;
        taskBreakdown[category].cost += taskCost;
      });

      totalHours += buildingHours;
      totalCost += buildingCost;

      buildingBreakdown.push({
        buildingId: building.id,
        buildingName: building.name,
        hours: buildingHours,
        cost: buildingCost
      });
    });

    return {
      clientId,
      period,
      totalHours,
      totalCost,
      taskBreakdown: Object.entries(taskBreakdown).map(([category, data]) => ({
        category,
        hours: data.hours,
        cost: data.cost
      })),
      buildingBreakdown
    };
  }

  /**
   * Get clients by performance
   */
  public getClientsByPerformance(): Array<{
    client: any;
    portfolio: ClientPortfolio;
    performance: ClientPerformanceMetrics;
    ranking: number;
  }> {
    const clients = this.getActiveClients();
    const clientData = clients.map(client => {
      const portfolio = this.getClientPortfolio(client.id);
      const performance = this.getClientPerformanceMetrics(client.id);
      
      return {
        client,
        portfolio,
        performance,
        ranking: 0 // Will be calculated below
      };
    });

    // Sort by overall performance score
    clientData.sort((a, b) => {
      const scoreA = this.calculateOverallPerformanceScore(a.performance);
      const scoreB = this.calculateOverallPerformanceScore(b.performance);
      return scoreB - scoreA;
    });

    // Assign rankings
    clientData.forEach((data, index) => {
      data.ranking = index + 1;
    });

    return clientData;
  }

  /**
   * Get client alerts and issues
   */
  public getClientAlerts(clientId: string): Array<{
    type: 'compliance' | 'overdue' | 'urgent' | 'billing' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    buildingId?: string;
    taskId?: string;
    date: Date;
  }> {
    const alerts: Array<{
      type: 'compliance' | 'overdue' | 'urgent' | 'billing' | 'performance';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      buildingId?: string;
      taskId?: string;
      date: Date;
    }> = [];

    const portfolio = this.getClientPortfolio(clientId);

    // Compliance alerts
    if (portfolio.averageComplianceScore < 0.7) {
      alerts.push({
        type: 'compliance',
        severity: 'critical',
        message: `Low compliance score: ${(portfolio.averageComplianceScore * 100).toFixed(1)}%`,
        date: new Date()
      });
    } else if (portfolio.averageComplianceScore < 0.8) {
      alerts.push({
        type: 'compliance',
        severity: 'high',
        message: `Below target compliance score: ${(portfolio.averageComplianceScore * 100).toFixed(1)}%`,
        date: new Date()
      });
    }

    // Overdue tasks alerts
    if (portfolio.overdueTasks > 10) {
      alerts.push({
        type: 'overdue',
        severity: 'critical',
        message: `${portfolio.overdueTasks} overdue tasks require attention`,
        date: new Date()
      });
    } else if (portfolio.overdueTasks > 5) {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        message: `${portfolio.overdueTasks} overdue tasks`,
        date: new Date()
      });
    }

    // Urgent tasks alerts
    if (portfolio.urgentTasks > 0) {
      alerts.push({
        type: 'urgent',
        severity: portfolio.urgentTasks > 5 ? 'critical' : 'high',
        message: `${portfolio.urgentTasks} urgent tasks pending`,
        date: new Date()
      });
    }

    // Performance alerts
    const performance = this.getClientPerformanceMetrics(clientId);
    if (performance.metrics.taskCompletionRate < 0.8) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `Task completion rate below target: ${(performance.metrics.taskCompletionRate * 100).toFixed(1)}%`,
        date: new Date()
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get client summary statistics
   */
  public getClientSummaryStatistics(): {
    totalClients: number;
    activeClients: number;
    totalBuildings: number;
    totalTasks: number;
    averageComplianceScore: number;
    totalMonthlySpend: number;
    clientsWithIssues: number;
  } {
    const clients = this.getClients();
    const activeClients = this.getActiveClients();
    
    let totalBuildings = 0;
    let totalTasks = 0;
    let totalComplianceScore = 0;
    let totalMonthlySpend = 0;
    let clientsWithIssues = 0;

    activeClients.forEach(client => {
      const portfolio = this.getClientPortfolio(client.id);
      totalBuildings += portfolio.totalBuildings;
      totalTasks += portfolio.totalTasks;
      totalComplianceScore += portfolio.averageComplianceScore;
      totalMonthlySpend += portfolio.monthlySpend;

      if (portfolio.overdueTasks > 0 || portfolio.urgentTasks > 0 || portfolio.averageComplianceScore < 0.8) {
        clientsWithIssues++;
      }
    });

    return {
      totalClients: clients.length,
      activeClients: activeClients.length,
      totalBuildings,
      totalTasks,
      averageComplianceScore: activeClients.length > 0 ? totalComplianceScore / activeClients.length : 0,
      totalMonthlySpend,
      clientsWithIssues
    };
  }

  /**
   * Calculate monthly spend for client (simplified)
   */
  private calculateMonthlySpend(clientId: string): number {
    const buildings = this.buildingService.getBuildingsByClient(clientId);
    let totalSpend = 0;

    buildings.forEach(building => {
      const buildingTasks = this.taskService.getTasksForBuilding(building.id);
      const monthlyTasks = buildingTasks.filter(task => {
        // Simplified: assume all tasks are monthly
        return task.recurrence === 'Monthly' || task.recurrence === 'Weekly' || task.recurrence === 'Daily';
      });

      totalSpend += monthlyTasks.reduce((sum, task) => {
        const hours = (task.estimatedDuration || 60) / 60;
        return sum + (hours * 25); // $25/hour default rate
      }, 0);
    });

    return totalSpend;
  }

  /**
   * Calculate projected costs for client
   */
  private calculateProjectedCosts(clientId: string): number {
    const monthlySpend = this.calculateMonthlySpend(clientId);
    return monthlySpend * 1.1; // 10% increase projection
  }

  /**
   * Calculate efficiency score for client
   */
  private calculateEfficiency(clientId: string): number {
    const portfolio = this.getClientPortfolio(clientId);
    const completionRate = portfolio.totalTasks > 0 ? portfolio.completedTasks / portfolio.totalTasks : 0;
    const complianceScore = portfolio.averageComplianceScore;
    
    // Weighted efficiency score
    return (completionRate * 0.6) + (complianceScore * 0.4);
  }

  /**
   * Calculate worker utilization for client
   */
  private calculateWorkerUtilization(clientId: string): number {
    // Simplified calculation
    return 0.85; // Default 85% utilization
  }

  /**
   * Calculate customer satisfaction score
   */
  private calculateCustomerSatisfaction(clientId: string): number {
    const portfolio = this.getClientPortfolio(clientId);
    const performance = this.getClientPerformanceMetrics(clientId);
    
    // Simplified satisfaction calculation based on performance metrics
    const completionRate = performance.metrics.taskCompletionRate;
    const complianceScore = performance.metrics.complianceScore;
    
    return (completionRate * 0.5) + (complianceScore * 0.5);
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(performance: ClientPerformanceMetrics): number {
    const { metrics } = performance;
    return (
      metrics.taskCompletionRate * 0.3 +
      metrics.complianceScore * 0.3 +
      metrics.costEfficiency * 0.2 +
      metrics.workerUtilization * 0.1 +
      metrics.customerSatisfaction * 0.1
    );
  }

  /**
   * Get period start date based on period type
   */
  private getPeriodStartDate(endDate: Date, period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Date {
    const startDate = new Date(endDate);
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }
    
    return startDate;
  }
}
