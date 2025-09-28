/**
 * 🏢 Client ViewModel
 * Mirrors: CyntientOps/ViewModels/ClientViewModel.swift
 * Purpose: Client dashboard state management and business logic
 */

import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { Client, Building, WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface ClientDashboardState {
  client: Client | null;
  buildings: Building[];
  portfolioMetrics: {
    totalBuildings: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    averageComplianceScore: number;
    monthlySpend: number;
    projectedCosts: number;
    efficiency: number;
  };
  buildingPerformance: Array<{
    buildingId: string;
    buildingName: string;
    complianceScore: number;
    taskCount: number;
    overdueCount: number;
    urgentCount: number;
    lastInspection: Date | null;
    nextInspection: Date | null;
  }>;
  assignedWorkers: Array<{
    workerId: string;
    workerName: string;
    role: string;
    status: string;
    taskCount: number;
    performance: number;
    lastActive: Date | null;
  }>;
  complianceAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    buildingId?: string;
    taskId?: string;
    date: Date;
  }>;
  costAnalysis: {
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
  };
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    priority: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface ClientAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'SET_CLIENT' | 'SET_BUILDINGS' | 'SET_PORTFOLIO_METRICS' |
        'SET_BUILDING_PERFORMANCE' | 'SET_ASSIGNED_WORKERS' | 'SET_COMPLIANCE_ALERTS' |
        'SET_COST_ANALYSIS' | 'SET_NOTIFICATIONS' | 'UPDATE_BUILDING' | 'ADD_NOTIFICATION' |
        'MARK_NOTIFICATION_READ' | 'CLEAR_ERROR';
  payload?: any;
}

export class ClientViewModel {
  private static instance: ClientViewModel;
  private databaseManager: DatabaseManager;
  private notificationManager: NotificationManager;
  private intelligenceService: IntelligenceService;
  private state: ClientDashboardState;
  private listeners: Set<(state: ClientDashboardState) => void> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor(
    databaseManager: DatabaseManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService
  ) {
    this.databaseManager = databaseManager;
    this.notificationManager = notificationManager;
    this.intelligenceService = intelligenceService;
    
    this.state = {
      client: null,
      buildings: [],
      portfolioMetrics: {
        totalBuildings: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        urgentTasks: 0,
        averageComplianceScore: 0,
        monthlySpend: 0,
        projectedCosts: 0,
        efficiency: 0
      },
      buildingPerformance: [],
      assignedWorkers: [],
      complianceAlerts: [],
      costAnalysis: {
        totalHours: 0,
        totalCost: 0,
        taskBreakdown: [],
        buildingBreakdown: []
      },
      notifications: [],
      isLoading: false,
      error: null
    };
  }

  public static getInstance(
    databaseManager: DatabaseManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService
  ): ClientViewModel {
    if (!ClientViewModel.instance) {
      ClientViewModel.instance = new ClientViewModel(
        databaseManager,
        notificationManager,
        intelligenceService
      );
    }
    return ClientViewModel.instance;
  }

  /**
   * Initialize client dashboard
   */
  public async initialize(clientId: string): Promise<void> {
    try {
      this.dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load client data
      await this.loadClientData(clientId);
      
      // Load buildings
      await this.loadBuildings(clientId);
      
      // Load portfolio metrics
      await this.loadPortfolioMetrics(clientId);
      
      // Load building performance
      await this.loadBuildingPerformance(clientId);
      
      // Load assigned workers
      await this.loadAssignedWorkers(clientId);
      
      // Load compliance alerts
      await this.loadComplianceAlerts(clientId);
      
      // Load cost analysis
      await this.loadCostAnalysis(clientId);
      
      // Load notifications
      await this.loadNotifications(clientId);
      
      // Start auto-refresh
      this.startAutoRefresh(clientId);
      
      this.dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Load client data
   */
  private async loadClientData(clientId: string): Promise<void> {
    const client = this.databaseManager.getClients().find(c => c.id === clientId);
    if (client) {
      this.dispatch({ type: 'SET_CLIENT', payload: client });
    } else {
      throw new Error('Client not found');
    }
  }

  /**
   * Load buildings for client
   */
  private async loadBuildings(clientId: string): Promise<void> {
    const allBuildings = this.databaseManager.getBuildings();
    const clientBuildings = allBuildings.filter(building => building.client_id === clientId);
    this.dispatch({ type: 'SET_BUILDINGS', payload: clientBuildings });
  }

  /**
   * Load portfolio metrics
   */
  private async loadPortfolioMetrics(clientId: string): Promise<void> {
    const buildings = this.databaseManager.getBuildings().filter(b => b.client_id === clientId);
    const allTasks = this.databaseManager.getTasksForWorker(''); // Get all tasks
    
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let urgentTasks = 0;
    let totalComplianceScore = 0;
    
    buildings.forEach(building => {
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      totalTasks += buildingTasks.length;
      completedTasks += buildingTasks.filter(task => task.status === 'Completed').length;
      overdueTasks += buildingTasks.filter(task => task.status === 'Overdue').length;
      urgentTasks += buildingTasks.filter(task => task.priority === 'urgent' || task.priority === 'critical').length;
      
      // Simulate compliance score
      totalComplianceScore += 0.7 + Math.random() * 0.3;
    });
    
    const portfolioMetrics = {
      totalBuildings: buildings.length,
      totalTasks,
      completedTasks,
      overdueTasks,
      urgentTasks,
      averageComplianceScore: buildings.length > 0 ? totalComplianceScore / buildings.length : 0,
      monthlySpend: totalTasks * 45.50, // Simulate cost per task
      projectedCosts: totalTasks * 47.20, // Simulate projected cost
      efficiency: totalTasks > 0 ? completedTasks / totalTasks : 0
    };
    
    this.dispatch({ type: 'SET_PORTFOLIO_METRICS', payload: portfolioMetrics });
  }

  /**
   * Load building performance
   */
  private async loadBuildingPerformance(clientId: string): Promise<void> {
    const buildings = this.databaseManager.getBuildings().filter(b => b.client_id === clientId);
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    const buildingPerformance = buildings.map(building => {
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      const overdueTasks = buildingTasks.filter(task => task.status === 'Overdue');
      const urgentTasks = buildingTasks.filter(task => task.priority === 'urgent' || task.priority === 'critical');
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        complianceScore: 0.7 + Math.random() * 0.3,
        taskCount: buildingTasks.length,
        overdueCount: overdueTasks.length,
        urgentCount: urgentTasks.length,
        lastInspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextInspection: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      };
    });
    
    this.dispatch({ type: 'SET_BUILDING_PERFORMANCE', payload: buildingPerformance });
  }

  /**
   * Load assigned workers
   */
  private async loadAssignedWorkers(clientId: string): Promise<void> {
    const buildings = this.databaseManager.getBuildings().filter(b => b.client_id === clientId);
    const allWorkers = this.databaseManager.getWorkers();
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    const assignedWorkers = allWorkers.map(worker => {
      const workerTasks = allTasks.filter(task => 
        task.assigned_worker_id === worker.id && 
        buildings.some(building => building.id === task.building_id)
      );
      
      const completedTasks = workerTasks.filter(task => task.status === 'Completed');
      const performance = workerTasks.length > 0 ? completedTasks.length / workerTasks.length : 0;
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        role: worker.role,
        status: worker.status,
        taskCount: workerTasks.length,
        performance,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };
    }).filter(worker => worker.taskCount > 0);
    
    this.dispatch({ type: 'SET_ASSIGNED_WORKERS', payload: assignedWorkers });
  }

  /**
   * Load compliance alerts
   */
  private async loadComplianceAlerts(clientId: string): Promise<void> {
    const buildings = this.databaseManager.getBuildings().filter(b => b.client_id === clientId);
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    const complianceAlerts = [];
    
    buildings.forEach(building => {
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      const overdueTasks = buildingTasks.filter(task => task.status === 'Overdue');
      const urgentTasks = buildingTasks.filter(task => task.priority === 'urgent' || task.priority === 'critical');
      
      if (overdueTasks.length > 0) {
        complianceAlerts.push({
          id: `alert_overdue_${building.id}`,
          type: 'overdue',
          severity: 'high',
          message: `${overdueTasks.length} overdue tasks at ${building.name}`,
          buildingId: building.id,
          date: new Date()
        });
      }
      
      if (urgentTasks.length > 0) {
        complianceAlerts.push({
          id: `alert_urgent_${building.id}`,
          type: 'urgent',
          severity: 'critical',
          message: `${urgentTasks.length} urgent tasks at ${building.name}`,
          buildingId: building.id,
          date: new Date()
        });
      }
    });
    
    this.dispatch({ type: 'SET_COMPLIANCE_ALERTS', payload: complianceAlerts });
  }

  /**
   * Load cost analysis
   */
  private async loadCostAnalysis(clientId: string): Promise<void> {
    const buildings = this.databaseManager.getBuildings().filter(b => b.client_id === clientId);
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    let totalHours = 0;
    let totalCost = 0;
    const taskBreakdown: { [key: string]: { hours: number; cost: number } } = {};
    const buildingBreakdown: { [key: string]: { hours: number; cost: number; name: string } } = {};
    
    buildings.forEach(building => {
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      let buildingHours = 0;
      let buildingCost = 0;
      
      buildingTasks.forEach(task => {
        const taskHours = task.estimated_duration || 2; // Default 2 hours
        const taskCost = taskHours * 22.75; // $22.75 per hour
        
        buildingHours += taskHours;
        buildingCost += taskCost;
        
        // Task category breakdown
        if (!taskBreakdown[task.category]) {
          taskBreakdown[task.category] = { hours: 0, cost: 0 };
        }
        taskBreakdown[task.category].hours += taskHours;
        taskBreakdown[task.category].cost += taskCost;
      });
      
      totalHours += buildingHours;
      totalCost += buildingCost;
      
      buildingBreakdown[building.id] = {
        hours: buildingHours,
        cost: buildingCost,
        name: building.name
      };
    });
    
    const costAnalysis = {
      totalHours,
      totalCost,
      taskBreakdown: Object.entries(taskBreakdown).map(([category, data]) => ({
        category,
        hours: data.hours,
        cost: data.cost
      })),
      buildingBreakdown: Object.entries(buildingBreakdown).map(([buildingId, data]) => ({
        buildingId,
        buildingName: data.name,
        hours: data.hours,
        cost: data.cost
      }))
    };
    
    this.dispatch({ type: 'SET_COST_ANALYSIS', payload: costAnalysis });
  }

  /**
   * Load notifications
   */
  private async loadNotifications(clientId: string): Promise<void> {
    const notifications = this.notificationManager.getNotificationsForUser(clientId, 10);
    this.dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }

  /**
   * Update building information
   */
  public async updateBuilding(buildingId: string, updates: Partial<Building>): Promise<boolean> {
    try {
      // This would update the building in the database
      // For now, we'll update the local state
      const updatedBuildings = this.state.buildings.map(building =>
        building.id === buildingId ? { ...building, ...updates } : building
      );
      this.dispatch({ type: 'UPDATE_BUILDING', payload: { buildingId, updates } });
      return true;
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Building update failed' });
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const success = this.notificationManager.markAsRead(notificationId);
      if (success) {
        this.dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
        return true;
      }
      return false;
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to mark notification as read' });
      return false;
    }
  }

  /**
   * Refresh dashboard data
   */
  public async refresh(): Promise<void> {
    if (!this.state.client) return;
    
    try {
      await this.loadPortfolioMetrics(this.state.client.id);
      await this.loadBuildingPerformance(this.state.client.id);
      await this.loadAssignedWorkers(this.state.client.id);
      await this.loadComplianceAlerts(this.state.client.id);
      await this.loadCostAnalysis(this.state.client.id);
      await this.loadNotifications(this.state.client.id);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  /**
   * Start auto-refresh
   */
  private startAutoRefresh(clientId: string): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Refresh every 60 seconds
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 60000);
  }

  /**
   * Stop auto-refresh
   */
  public stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get current state
   */
  public getState(): ClientDashboardState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: ClientDashboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Dispatch action
   */
  private dispatch(action: ClientAction): void {
    switch (action.type) {
      case 'SET_LOADING':
        this.state.isLoading = action.payload;
        break;
      case 'SET_ERROR':
        this.state.error = action.payload;
        this.state.isLoading = false;
        break;
      case 'CLEAR_ERROR':
        this.state.error = null;
        break;
      case 'SET_CLIENT':
        this.state.client = action.payload;
        break;
      case 'SET_BUILDINGS':
        this.state.buildings = action.payload;
        break;
      case 'SET_PORTFOLIO_METRICS':
        this.state.portfolioMetrics = action.payload;
        break;
      case 'SET_BUILDING_PERFORMANCE':
        this.state.buildingPerformance = action.payload;
        break;
      case 'SET_ASSIGNED_WORKERS':
        this.state.assignedWorkers = action.payload;
        break;
      case 'SET_COMPLIANCE_ALERTS':
        this.state.complianceAlerts = action.payload;
        break;
      case 'SET_COST_ANALYSIS':
        this.state.costAnalysis = action.payload;
        break;
      case 'SET_NOTIFICATIONS':
        this.state.notifications = action.payload;
        break;
      case 'UPDATE_BUILDING':
        this.state.buildings = this.state.buildings.map(building =>
          building.id === action.payload.buildingId ? { ...building, ...action.payload.updates } : building
        );
        break;
      case 'ADD_NOTIFICATION':
        this.state.notifications.unshift(action.payload);
        break;
      case 'MARK_NOTIFICATION_READ':
        this.state.notifications = this.state.notifications.map(notification =>
          notification.id === action.payload ? { ...notification, isRead: true } : notification
        );
        break;
    }
    
    this.notifyListeners();
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAutoRefresh();
    this.listeners.clear();
  }
}
