/**
 * 👷 Worker ViewModel
 * Mirrors: CyntientOps/ViewModels/WorkerViewModel.swift
 * Purpose: Worker dashboard state management and business logic
 */

import { DatabaseManager } from '@cyntientops/database';
import { ClockInManager, LocationManager, NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { WorkerProfile, OperationalDataTaskAssignment, ClockStatus } from '@cyntientops/domain-schema';

export interface WorkerDashboardState {
  worker: WorkerProfile | null;
  todaysTasks: OperationalDataTaskAssignment[];
  clockStatus: ClockStatus;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  performanceMetrics: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageTaskTime: number;
    currentStreak: number;
    lastActiveDate: Date | null;
  };
  weatherData: {
    temperature: number;
    description: string;
    outdoorWorkRisk: string;
    recommendations: string[];
  } | null;
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

export interface WorkerAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'SET_WORKER' | 'SET_TASKS' | 'SET_CLOCK_STATUS' | 
        'SET_LOCATION' | 'SET_PERFORMANCE' | 'SET_WEATHER' | 'SET_NOTIFICATIONS' | 
        'UPDATE_TASK' | 'ADD_NOTIFICATION' | 'MARK_NOTIFICATION_READ' | 'CLEAR_ERROR';
  payload?: any;
}

export class WorkerViewModel {
  private static instance: WorkerViewModel;
  private databaseManager: DatabaseManager;
  private clockInManager: ClockInManager;
  private locationManager: LocationManager;
  private notificationManager: NotificationManager;
  private intelligenceService: IntelligenceService;
  private state: WorkerDashboardState;
  private listeners: Set<(state: WorkerDashboardState) => void> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor(
    databaseManager: DatabaseManager,
    clockInManager: ClockInManager,
    locationManager: LocationManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService
  ) {
    this.databaseManager = databaseManager;
    this.clockInManager = clockInManager;
    this.locationManager = locationManager;
    this.notificationManager = notificationManager;
    this.intelligenceService = intelligenceService;
    
    this.state = {
      worker: null,
      todaysTasks: [],
      clockStatus: 'clockedOut',
      currentLocation: null,
      performanceMetrics: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        averageTaskTime: 0,
        currentStreak: 0,
        lastActiveDate: null
      },
      weatherData: null,
      notifications: [],
      isLoading: false,
      error: null
    };
  }

  public static getInstance(
    databaseManager: DatabaseManager,
    clockInManager: ClockInManager,
    locationManager: LocationManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService
  ): WorkerViewModel {
    if (!WorkerViewModel.instance) {
      WorkerViewModel.instance = new WorkerViewModel(
        databaseManager,
        clockInManager,
        locationManager,
        notificationManager,
        intelligenceService
      );
    }
    return WorkerViewModel.instance;
  }

  /**
   * Initialize worker dashboard
   */
  public async initialize(workerId: string): Promise<void> {
    try {
      this.dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load worker data
      await this.loadWorkerData(workerId);
      
      // Load today's tasks
      await this.loadTodaysTasks(workerId);
      
      // Load clock status
      await this.loadClockStatus(workerId);
      
      // Load current location
      await this.loadCurrentLocation(workerId);
      
      // Load performance metrics
      await this.loadPerformanceMetrics(workerId);
      
      // Load weather data
      await this.loadWeatherData();
      
      // Load notifications
      await this.loadNotifications(workerId);
      
      // Start auto-refresh
      this.startAutoRefresh(workerId);
      
      this.dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Load worker data
   */
  private async loadWorkerData(workerId: string): Promise<void> {
    const worker = this.databaseManager.getWorkerById(workerId);
    if (worker) {
      this.dispatch({ type: 'SET_WORKER', payload: worker });
    } else {
      throw new Error('Worker not found');
    }
  }

  /**
   * Load today's tasks
   */
  private async loadTodaysTasks(workerId: string): Promise<void> {
    const allTasks = this.databaseManager.getTasksForWorker(workerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTasks = allTasks.filter(task => {
      if (!task.scheduled_date) return false;
      const taskDate = new Date(task.scheduled_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    this.dispatch({ type: 'SET_TASKS', payload: todaysTasks });
  }

  /**
   * Load clock status
   */
  private async loadClockStatus(workerId: string): Promise<void> {
    const clockStatus = this.clockInManager.getWorkerClockStatus(workerId);
    this.dispatch({ type: 'SET_CLOCK_STATUS', payload: clockStatus });
  }

  /**
   * Load current location
   */
  private async loadCurrentLocation(workerId: string): Promise<void> {
    const location = this.locationManager.getCurrentLocation(workerId);
    if (location) {
      this.dispatch({ 
        type: 'SET_LOCATION', 
        payload: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        }
      });
    }
  }

  /**
   * Load performance metrics
   */
  private async loadPerformanceMetrics(workerId: string): Promise<void> {
    const stats = this.clockInManager.getWorkerClockStats(workerId);
    const tasks = this.databaseManager.getTasksForWorker(workerId);
    const completedTasks = tasks.filter(task => task.status === 'Completed');
    
    const performanceMetrics = {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
      averageTaskTime: stats.averageHours,
      currentStreak: 0, // Would be calculated from historical data
      lastActiveDate: stats.lastClockOut || null
    };
    
    this.dispatch({ type: 'SET_PERFORMANCE', payload: performanceMetrics });
  }

  /**
   * Load weather data
   */
  private async loadWeatherData(): Promise<void> {
    try {
      // This would integrate with the weather API
      const weatherData = {
        temperature: 72,
        description: 'Partly cloudy',
        outdoorWorkRisk: 'low',
        recommendations: ['Good weather for outdoor work']
      };
      
      this.dispatch({ type: 'SET_WEATHER', payload: weatherData });
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  }

  /**
   * Load notifications
   */
  private async loadNotifications(workerId: string): Promise<void> {
    const notifications = this.notificationManager.getNotificationsForUser(workerId, 10);
    this.dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }

  /**
   * Clock in worker
   */
  public async clockIn(buildingId: string, location: { latitude: number; longitude: number; accuracy: number }): Promise<boolean> {
    try {
      if (!this.state.worker) return false;
      
      const result = await this.clockInManager.clockInWorker({
        workerId: this.state.worker.id,
        buildingId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        accuracy: location.accuracy
      });
      
      if (result.success) {
        await this.loadClockStatus(this.state.worker.id);
        return true;
      } else {
        this.dispatch({ type: 'SET_ERROR', payload: 'Clock in failed: ' + result.validation.errors.join(', ') });
        return false;
      }
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Clock in failed' });
      return false;
    }
  }

  /**
   * Clock out worker
   */
  public async clockOut(): Promise<boolean> {
    try {
      if (!this.state.worker) return false;
      
      const result = await this.clockInManager.clockOutWorker({
        workerId: this.state.worker.id,
        timestamp: new Date()
      });
      
      if (result.success) {
        await this.loadClockStatus(this.state.worker.id);
        return true;
      } else {
        this.dispatch({ type: 'SET_ERROR', payload: 'Clock out failed' });
        return false;
      }
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Clock out failed' });
      return false;
    }
  }

  /**
   * Update task status
   */
  public async updateTaskStatus(taskId: string, status: string): Promise<boolean> {
    try {
      const success = this.databaseManager.updateTaskStatus(taskId, status);
      if (success) {
        // Update local state
        const updatedTasks = this.state.todaysTasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        );
        this.dispatch({ type: 'UPDATE_TASK', payload: { taskId, status } });
        return true;
      }
      return false;
    } catch (error) {
      this.dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Task update failed' });
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
        // Update local state
        const updatedNotifications = this.state.notifications.map(notification =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        );
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
    if (!this.state.worker) return;
    
    try {
      await this.loadTodaysTasks(this.state.worker.id);
      await this.loadClockStatus(this.state.worker.id);
      await this.loadCurrentLocation(this.state.worker.id);
      await this.loadNotifications(this.state.worker.id);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  /**
   * Start auto-refresh
   */
  private startAutoRefresh(workerId: string): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Refresh every 30 seconds
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
  public getState(): WorkerDashboardState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: WorkerDashboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Dispatch action
   */
  private dispatch(action: WorkerAction): void {
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
      case 'SET_WORKER':
        this.state.worker = action.payload;
        break;
      case 'SET_TASKS':
        this.state.todaysTasks = action.payload;
        break;
      case 'SET_CLOCK_STATUS':
        this.state.clockStatus = action.payload;
        break;
      case 'SET_LOCATION':
        this.state.currentLocation = action.payload;
        break;
      case 'SET_PERFORMANCE':
        this.state.performanceMetrics = action.payload;
        break;
      case 'SET_WEATHER':
        this.state.weatherData = action.payload;
        break;
      case 'SET_NOTIFICATIONS':
        this.state.notifications = action.payload;
        break;
      case 'UPDATE_TASK':
        this.state.todaysTasks = this.state.todaysTasks.map(task =>
          task.id === action.payload.taskId ? { ...task, status: action.payload.status } : task
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
