/**
 * 👑 Admin ViewModel
 * Mirrors: CyntientOps/ViewModels/AdminViewModel.swift
 * Purpose: Admin dashboard state management and business logic
 */

import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService, IntelligenceReport } from '@cyntientops/intelligence-services';
import { WorkerProfile, Building, Client, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface AdminDashboardState {
  systemMetrics: {
    totalWorkers: number;
    activeWorkers: number;
    totalBuildings: number;
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    systemUptime: number;
    averageResponseTime: number;
  };
  realtimeMonitoring: {
    activeWorkers: Array<{
      workerId: string;
      workerName: string;
      status: string;
      currentLocation: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: Date;
      } | null;
      currentTask: string | null;
      clockedInAt: Date | null;
    }>;
    systemAlerts: Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      timestamp: Date;
      resolved: boolean;
    }>;
    performanceMetrics: {
      tasksPerHour: number;
      averageTaskTime: number;
      systemLoad: number;
      errorRate: number;
    };
  };
  taskDistribution: {
    byStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    byCategory: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    byWorker: Array<{
      workerId: string;
      workerName: string;
      taskCount: number;
      completedCount: number;
      completionRate: number;
    }>;
    byBuilding: Array<{
      buildingId: string;
      buildingName: string;
      taskCount: number;
      completedCount: number;
      completionRate: number;
    }>;
  };
  buildingManagement: {
    buildingStats: Array<{
      buildingId: string;
      buildingName: string;
      address: string;
      clientName: string;
      taskCount: number;
      complianceScore: number;
      lastInspection: Date | null;
      nextInspection: Date | null;
      issues: number;
    }>;
    complianceOverview: {
      totalBuildings: number;
      compliantBuildings: number;
      nonCompliantBuildings: number;
      averageComplianceScore: number;
    };
  };
  performanceReports: {
    workerPerformance: Array<{
      workerId: string;
      workerName: string;
      role: string;
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
      averageTaskTime: number;
      efficiency: number;
      lastActive: Date | null;
    }>;
    clientPerformance: Array<{
      clientId: string;
      clientName: string;
      buildingCount: number;
      taskCount: number;
      completionRate: number;
      satisfactionScore: number;
      monthlySpend: number;
    }>;
    systemPerformance: {
      uptime: number;
      responseTime: number;
      errorRate: number;
      throughput: number;
    };
  };
  intelligenceInsights: {
    latestReport: IntelligenceReport | null;
    keyInsights: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      impact: string;
      confidence: number;
      recommendations: string[];
    }>;
    predictions: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      confidence: number;
      timeframe: {
        start: Date;
        end: Date;
      };
    }>;
    anomalies: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      detectedAt: Date;
      status: string;
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

export interface AdminAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'SET_SYSTEM_METRICS' | 'SET_REALTIME_MONITORING' |
        'SET_TASK_DISTRIBUTION' | 'SET_BUILDING_MANAGEMENT' | 'SET_PERFORMANCE_REPORTS' |
        'SET_INTELLIGENCE_INSIGHTS' | 'SET_NOTIFICATIONS' | 'UPDATE_WORKER_STATUS' |
        'ADD_SYSTEM_ALERT' | 'RESOLVE_ALERT' | 'ADD_NOTIFICATION' | 'MARK_NOTIFICATION_READ' |
        'CLEAR_ERROR';
  payload?: any;
}

export class AdminViewModel {
  private static instance: AdminViewModel;
  private databaseManager: DatabaseManager;
  private notificationManager: NotificationManager;
  private intelligenceService: IntelligenceService;
  private state: AdminDashboardState;
  private listeners: Set<(state: AdminDashboardState) => void> = new Set();
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
      systemMetrics: {
        totalWorkers: 0,
        activeWorkers: 0,
        totalBuildings: 0,
        totalClients: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        urgentTasks: 0,
        systemUptime: 0,
        averageResponseTime: 0
      },
      realtimeMonitoring: {
        activeWorkers: [],
        systemAlerts: [],
        performanceMetrics: {
          tasksPerHour: 0,
          averageTaskTime: 0,
          systemLoad: 0,
          errorRate: 0
        }
      },
      taskDistribution: {
        byStatus: [],
        byCategory: [],
        byWorker: [],
        byBuilding: []
      },
      buildingManagement: {
        buildingStats: [],
        complianceOverview: {
          totalBuildings: 0,
          compliantBuildings: 0,
          nonCompliantBuildings: 0,
          averageComplianceScore: 0
        }
      },
      performanceReports: {
        workerPerformance: [],
        clientPerformance: [],
        systemPerformance: {
          uptime: 0,
          responseTime: 0,
          errorRate: 0,
          throughput: 0
        }
      },
      intelligenceInsights: {
        latestReport: null,
        keyInsights: [],
        predictions: [],
        anomalies: []
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
  ): AdminViewModel {
    if (!AdminViewModel.instance) {
      AdminViewModel.instance = new AdminViewModel(
        databaseManager,
        notificationManager,
        intelligenceService
      );
    }
    return AdminViewModel.instance;
  }

  /**
   * Initialize admin dashboard
   */
  public async initialize(): Promise<void> {
    try {
      this.dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load system metrics
      await this.loadSystemMetrics();
      
      // Load realtime monitoring
      await this.loadRealtimeMonitoring();
      
      // Load task distribution
      await this.loadTaskDistribution();
      
      // Load building management
      await this.loadBuildingManagement();
      
      // Load performance reports
      await this.loadPerformanceReports();
      
      // Load intelligence insights
      await this.loadIntelligenceInsights();
      
      // Load notifications
      await this.loadNotifications();
      
      // Start auto-refresh
      this.startAutoRefresh();
      
      this.dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Load system metrics
   */
  private async loadSystemMetrics(): Promise<void> {
    const workers = this.databaseManager.getWorkers();
    const buildings = this.databaseManager.getBuildings();
    const clients = this.databaseManager.getClients();
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    const systemMetrics = {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === 'Clocked In').length,
      totalBuildings: buildings.length,
      totalClients: clients.length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'Completed').length,
      overdueTasks: allTasks.filter(t => t.status === 'Overdue').length,
      urgentTasks: allTasks.filter(t => t.priority === 'urgent' || t.priority === 'critical').length,
      systemUptime: 99.9, // Simulated
      averageResponseTime: 150 // Simulated in ms
    };
    
    this.dispatch({ type: 'SET_SYSTEM_METRICS', payload: systemMetrics });
  }

  /**
   * Load realtime monitoring
   */
  private async loadRealtimeMonitoring(): Promise<void> {
    const workers = this.databaseManager.getWorkers();
    const activeWorkers = workers.filter(w => w.status === 'Clocked In').map(worker => ({
      workerId: worker.id,
      workerName: worker.name,
      status: worker.status,
      currentLocation: {
        latitude: 40.7589 + (Math.random() - 0.5) * 0.01,
        longitude: -73.9851 + (Math.random() - 0.5) * 0.01,
        accuracy: 5 + Math.random() * 10,
        timestamp: new Date()
      },
      currentTask: 'Cleaning Lobby', // Simulated
      clockedInAt: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000) // Random time within last 4 hours
    }));
    
    const systemAlerts = [
      {
        id: 'alert_1',
        type: 'performance',
        severity: 'medium',
        message: 'High task completion time detected',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false
      },
      {
        id: 'alert_2',
        type: 'system',
        severity: 'low',
        message: 'Database backup completed successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: true
      }
    ];
    
    const performanceMetrics = {
      tasksPerHour: 12.5,
      averageTaskTime: 2.3,
      systemLoad: 65.2,
      errorRate: 0.02
    };
    
    this.dispatch({ 
      type: 'SET_REALTIME_MONITORING', 
      payload: {
        activeWorkers,
        systemAlerts,
        performanceMetrics
      }
    });
  }

  /**
   * Load task distribution
   */
  private async loadTaskDistribution(): Promise<void> {
    const allTasks = this.databaseManager.getTasksForWorker('');
    const workers = this.databaseManager.getWorkers();
    const buildings = this.databaseManager.getBuildings();
    
    // Task distribution by status
    const statusCounts: { [key: string]: number } = {};
    allTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / allTasks.length) * 100
    }));
    
    // Task distribution by category
    const categoryCounts: { [key: string]: number } = {};
    allTasks.forEach(task => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });
    
    const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: (count / allTasks.length) * 100
    }));
    
    // Task distribution by worker
    const byWorker = workers.map(worker => {
      const workerTasks = allTasks.filter(task => task.assigned_worker_id === worker.id);
      const completedTasks = workerTasks.filter(task => task.status === 'Completed');
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        taskCount: workerTasks.length,
        completedCount: completedTasks.length,
        completionRate: workerTasks.length > 0 ? completedTasks.length / workerTasks.length : 0
      };
    });
    
    // Task distribution by building
    const byBuilding = buildings.map(building => {
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      const completedTasks = buildingTasks.filter(task => task.status === 'Completed');
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        taskCount: buildingTasks.length,
        completedCount: completedTasks.length,
        completionRate: buildingTasks.length > 0 ? completedTasks.length / buildingTasks.length : 0
      };
    });
    
    this.dispatch({ 
      type: 'SET_TASK_DISTRIBUTION', 
      payload: {
        byStatus,
        byCategory,
        byWorker,
        byBuilding
      }
    });
  }

  /**
   * Load building management
   */
  private async loadBuildingManagement(): Promise<void> {
    const buildings = this.databaseManager.getBuildings();
    const clients = this.databaseManager.getClients();
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    const buildingStats = buildings.map(building => {
      const client = clients.find(c => c.id === building.client_id);
      const buildingTasks = allTasks.filter(task => task.building_id === building.id);
      const issues = buildingTasks.filter(task => task.status === 'Overdue' || task.priority === 'urgent').length;
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        address: building.address,
        clientName: client?.name || 'Unknown',
        taskCount: buildingTasks.length,
        complianceScore: 0.7 + Math.random() * 0.3,
        lastInspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextInspection: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        issues
      };
    });
    
    const compliantBuildings = buildingStats.filter(b => b.complianceScore >= 0.8).length;
    const averageComplianceScore = buildingStats.reduce((sum, b) => sum + b.complianceScore, 0) / buildingStats.length;
    
    const complianceOverview = {
      totalBuildings: buildings.length,
      compliantBuildings,
      nonCompliantBuildings: buildings.length - compliantBuildings,
      averageComplianceScore
    };
    
    this.dispatch({ 
      type: 'SET_BUILDING_MANAGEMENT', 
      payload: {
        buildingStats,
        complianceOverview
      }
    });
  }

  /**
   * Load performance reports
   */
  private async loadPerformanceReports(): Promise<void> {
    const workers = this.databaseManager.getWorkers();
    const clients = this.databaseManager.getClients();
    const allTasks = this.databaseManager.getTasksForWorker('');
    
    // Worker performance
    const workerPerformance = workers.map(worker => {
      const workerTasks = allTasks.filter(task => task.assigned_worker_id === worker.id);
      const completedTasks = workerTasks.filter(task => task.status === 'Completed');
      const averageTaskTime = workerTasks.length > 0 ? 
        workerTasks.reduce((sum, task) => sum + (task.estimated_duration || 2), 0) / workerTasks.length : 0;
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        role: worker.role,
        totalTasks: workerTasks.length,
        completedTasks: completedTasks.length,
        completionRate: workerTasks.length > 0 ? completedTasks.length / workerTasks.length : 0,
        averageTaskTime,
        efficiency: workerTasks.length > 0 ? completedTasks.length / workerTasks.length : 0,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };
    });
    
    // Client performance
    const clientPerformance = clients.map(client => {
      const clientBuildings = this.databaseManager.getBuildings().filter(b => b.client_id === client.id);
      const clientTasks = allTasks.filter(task => 
        clientBuildings.some(building => building.id === task.building_id)
      );
      const completedTasks = clientTasks.filter(task => task.status === 'Completed');
      
      return {
        clientId: client.id,
        clientName: client.name,
        buildingCount: clientBuildings.length,
        taskCount: clientTasks.length,
        completionRate: clientTasks.length > 0 ? completedTasks.length / clientTasks.length : 0,
        satisfactionScore: 0.7 + Math.random() * 0.3,
        monthlySpend: clientTasks.length * 45.50
      };
    });
    
    const systemPerformance = {
      uptime: 99.9,
      responseTime: 150,
      errorRate: 0.02,
      throughput: 12.5
    };
    
    this.dispatch({ 
      type: 'SET_PERFORMANCE_REPORTS', 
      payload: {
        workerPerformance,
        clientPerformance,
        systemPerformance
      }
    });
  }

  /**
   * Load intelligence insights
   */
  private async loadIntelligenceInsights(): Promise<void> {
    try {
      // Generate latest intelligence report
      const latestReport = await this.intelligenceService.generateIntelligenceReport('weekly');
      
      // Extract key insights
      const keyInsights = latestReport.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        confidence: insight.confidence,
        recommendations: insight.recommendations
      }));
      
      // Extract predictions
      const predictions = latestReport.predictions.map(prediction => ({
        id: prediction.id,
        type: prediction.type,
        title: prediction.title,
        description: prediction.description,
        confidence: prediction.confidence,
        timeframe: prediction.timeframe
      }));
      
      // Extract anomalies
      const anomalies = latestReport.anomalies.map(anomaly => ({
        id: anomaly.id,
        type: anomaly.type,
        severity: anomaly.severity,
        title: anomaly.title,
        description: anomaly.description,
        detectedAt: anomaly.detectedAt,
        status: anomaly.status
      }));
      
      this.dispatch({ 
        type: 'SET_INTELLIGENCE_INSIGHTS', 
        payload: {
          latestReport,
          keyInsights,
          predictions,
          anomalies
        }
      });
    } catch (error) {
      console.error('Failed to load intelligence insights:', error);
    }
  }

  /**
   * Load notifications
   */
  private async loadNotifications(): Promise<void> {
    // Get notifications for admin role
    const notifications = this.notificationManager.getNotificationsForUser('admin', 20);
    this.dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }

  /**
   * Update worker status
   */
  public async updateWorkerStatus(workerId: string, status: string): Promise<boolean> {
    try {
      // This would update the worker status in the database
      // For now, we'll update the local state
      this.dispatch({ type: 'UPDATE_WORKER_STATUS', payload: { workerId, status } });
      return true;
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Worker status update failed' });
      return false;
    }
  }

  /**
   * Add system alert
   */
  public addSystemAlert(alert: {
    type: string;
    severity: string;
    message: string;
  }): void {
    const newAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alert,
      timestamp: new Date(),
      resolved: false
    };
    
    this.dispatch({ type: 'ADD_SYSTEM_ALERT', payload: newAlert });
  }

  /**
   * Resolve system alert
   */
  public resolveAlert(alertId: string): void {
    this.dispatch({ type: 'RESOLVE_ALERT', payload: alertId });
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
    try {
      await this.loadSystemMetrics();
      await this.loadRealtimeMonitoring();
      await this.loadTaskDistribution();
      await this.loadBuildingManagement();
      await this.loadPerformanceReports();
      await this.loadIntelligenceInsights();
      await this.loadNotifications();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  /**
   * Start auto-refresh
   */
  private startAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Refresh every 30 seconds for real-time data
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 30000);
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
  public getState(): AdminDashboardState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: AdminDashboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Dispatch action
   */
  private dispatch(action: AdminAction): void {
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
      case 'SET_SYSTEM_METRICS':
        this.state.systemMetrics = action.payload;
        break;
      case 'SET_REALTIME_MONITORING':
        this.state.realtimeMonitoring = action.payload;
        break;
      case 'SET_TASK_DISTRIBUTION':
        this.state.taskDistribution = action.payload;
        break;
      case 'SET_BUILDING_MANAGEMENT':
        this.state.buildingManagement = action.payload;
        break;
      case 'SET_PERFORMANCE_REPORTS':
        this.state.performanceReports = action.payload;
        break;
      case 'SET_INTELLIGENCE_INSIGHTS':
        this.state.intelligenceInsights = action.payload;
        break;
      case 'SET_NOTIFICATIONS':
        this.state.notifications = action.payload;
        break;
      case 'UPDATE_WORKER_STATUS':
        this.state.realtimeMonitoring.activeWorkers = this.state.realtimeMonitoring.activeWorkers.map(worker =>
          worker.workerId === action.payload.workerId ? { ...worker, status: action.payload.status } : worker
        );
        break;
      case 'ADD_SYSTEM_ALERT':
        this.state.realtimeMonitoring.systemAlerts.unshift(action.payload);
        break;
      case 'RESOLVE_ALERT':
        this.state.realtimeMonitoring.systemAlerts = this.state.realtimeMonitoring.systemAlerts.map(alert =>
          alert.id === action.payload ? { ...alert, resolved: true } : alert
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
