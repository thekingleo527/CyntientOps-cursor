/**
 * 🔗 Service Integration Layer
 * Purpose: Connect Phase 1 services with state management for seamless UI integration
 * Mirrors: SwiftUI ViewModel patterns with reactive state updates
 * Features: Real-time sync, error handling, and optimized performance
 */

import { ServiceContainer } from '../ServiceContainer';
import { useAppStore, useActions, useUser, useWorker, useTasks, useBuildings, useNovaAI, useRealTime } from './AppStateManager';
import { UserRole, WorkerProfile, NamedCoordinate, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface ServiceIntegrationConfig {
  enableRealTimeSync: boolean;
  syncInterval: number;
  enableOfflineMode: boolean;
  enableErrorRecovery: boolean;
}

export class ServiceIntegrationLayer {
  private static instance: ServiceIntegrationLayer;
  private serviceContainer: ServiceContainer;
  private config: ServiceIntegrationConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor(serviceContainer: ServiceContainer, config: ServiceIntegrationConfig) {
    this.serviceContainer = serviceContainer;
    this.config = config;
  }

  public static getInstance(
    serviceContainer: ServiceContainer,
    config?: Partial<ServiceIntegrationConfig>
  ): ServiceIntegrationLayer {
    if (!ServiceIntegrationLayer.instance) {
      const defaultConfig: ServiceIntegrationConfig = {
        enableRealTimeSync: true,
        syncInterval: 30000, // 30 seconds
        enableOfflineMode: true,
        enableErrorRecovery: true
      };

      ServiceIntegrationLayer.instance = new ServiceIntegrationLayer(
        serviceContainer,
        { ...defaultConfig, ...config }
      );
    }
    return ServiceIntegrationLayer.instance;
  }

  // MARK: - Initialization

  /**
   * Initialize service integration layer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔗 Initializing Service Integration Layer...');

      // Set up real-time event listeners
      await this.setupRealTimeListeners();

      // Set up Nova AI integration
      await this.setupNovaAIIntegration();

      // Start periodic sync if enabled
      if (this.config.enableRealTimeSync) {
        this.startPeriodicSync();
      }

      this.isInitialized = true;
      console.log('✅ Service Integration Layer initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Service Integration Layer:', error);
      throw error;
    }
  }

  // MARK: - Authentication Integration

  /**
   * Login user and sync state
   */
  async loginUser(email: string, password: string, deviceId: string): Promise<boolean> {
    try {
      const actions = useAppStore.getState().actions;
      actions.setLoading(true);
      actions.setError(null);

      // Authenticate with session manager
      const loginResult = await this.serviceContainer.sessionManager.login(
        email,
        password,
        deviceId,
        '127.0.0.1', // IP address
        'CyntientOps Mobile' // User agent
      );

      if (!loginResult.success || !loginResult.user || !loginResult.session) {
        actions.setError(loginResult.error || 'Login failed');
        return false;
      }

      // Update user state
      actions.setUser(loginResult.user);
      actions.setSession(loginResult.session);
      actions.setPermissions(loginResult.session.permissions);

      // Load user-specific data
      await this.loadUserData(loginResult.user);

      // Initialize real-time communication
      await this.serviceContainer.realTimeCommunication.initialize(loginResult.session.sessionToken);

      actions.setLoading(false);
      return true;

    } catch (error) {
      console.error('Login failed:', error);
      useAppStore.getState().actions.setError('Login failed due to system error');
      useAppStore.getState().actions.setLoading(false);
      return false;
    }
  }

  /**
   * Logout user and cleanup
   */
  async logoutUser(): Promise<void> {
    try {
      const actions = useAppStore.getState().actions;
      const session = useAppStore.getState().user.session;

      if (session) {
        await this.serviceContainer.sessionManager.logout(session.sessionToken);
        await this.serviceContainer.realTimeCommunication.disconnect();
      }

      actions.logout();
      actions.setLoading(false);
      actions.setError(null);

    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // MARK: - Worker Data Integration

  /**
   * Load user-specific data after login
   */
  private async loadUserData(user: any): Promise<void> {
    try {
      const actions = useAppStore.getState().actions;

      if (user.role === 'worker') {
        await this.loadWorkerData(user.id);
      } else if (user.role === 'client') {
        await this.loadClientData(user.id);
      } else if (user.role === 'admin' || user.role === 'manager') {
        await this.loadAdminData();
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
      useAppStore.getState().actions.setError('Failed to load user data');
    }
  }

  /**
   * Load worker-specific data
   */
  private async loadWorkerData(workerId: string): Promise<void> {
    try {
      const actions = useAppStore.getState().actions;

      // Load worker profile
      const workerProfile = await this.serviceContainer.databaseIntegration.getWorkerProfile(workerId);
      if (workerProfile) {
        actions.setCurrentWorker(workerProfile);
        actions.setAssignedBuildings(workerProfile.assignedBuildings);
      }

      // Load worker tasks
      const tasksResult = await this.serviceContainer.databaseIntegration.getWorkerTasks(workerId, {
        limit: 50,
        sort: [{ field: 'due_date', direction: 'ASC' }]
      });
      actions.setWorkerTasks(tasksResult.data);

      // Load worker performance
      const performance = await this.serviceContainer.databaseIntegration.getWorkerPerformanceMetrics(workerId);
      actions.setWorkerPerformance(performance);

      // Load clock status
      const clockStatus = await this.serviceContainer.databaseIntegration.getWorkerClockStatus(workerId);
      if (clockStatus) {
        actions.setClockStatus({
          isClockedIn: true,
          clockInTime: clockStatus.clockInTime,
          currentBuilding: {
            id: clockStatus.buildingId,
            name: clockStatus.buildingName,
            latitude: 0, // Will be loaded from building data
            longitude: 0,
            address: clockStatus.buildingAddress
          }
        });
      }

    } catch (error) {
      console.error('Failed to load worker data:', error);
    }
  }

  /**
   * Load client-specific data
   */
  private async loadClientData(clientId: string): Promise<void> {
    try {
      const actions = useAppStore.getState().actions;

      // Load client buildings
      const buildingsResult = await this.serviceContainer.databaseIntegration.getBuildings({
        limit: 100
      });
      actions.setBuildings(buildingsResult.data);

    } catch (error) {
      console.error('Failed to load client data:', error);
    }
  }

  /**
   * Load admin-specific data
   */
  private async loadAdminData(): Promise<void> {
    try {
      const actions = useAppStore.getState().actions;

      // Load all workers
      const workersResult = await this.serviceContainer.databaseIntegration.getWorkers({
        limit: 100
      });

      // Load all buildings
      const buildingsResult = await this.serviceContainer.databaseIntegration.getBuildings({
        limit: 100
      });
      actions.setBuildings(buildingsResult.data);

      // Load all tasks
      const tasksResult = await this.serviceContainer.databaseIntegration.executeQuery(
        'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100'
      );
      actions.setTasks(tasksResult);

    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  }

  // MARK: - Task Management Integration

  /**
   * Create new task
   */
  async createTask(taskData: Partial<OperationalDataTaskAssignment>): Promise<string | null> {
    try {
      const actions = useAppStore.getState().actions;
      actions.setLoading(true);

      const taskId = await this.serviceContainer.databaseIntegration.createTask(taskData);
      
      if (taskId) {
        // Reload tasks to get the new task with full data
        await this.refreshTasks();
        
        // Broadcast task creation
        await this.serviceContainer.realTimeCommunication.broadcastTaskUpdate(
          taskId,
          'created',
          { ...taskData, id: taskId },
          {
            userId: useAppStore.getState().user.user?.id || '',
            userRole: useAppStore.getState().user.user?.role || 'worker'
          }
        );
      }

      actions.setLoading(false);
      return taskId;

    } catch (error) {
      console.error('Failed to create task:', error);
      useAppStore.getState().actions.setError('Failed to create task');
      useAppStore.getState().actions.setLoading(false);
      return null;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, completionNotes?: string): Promise<boolean> {
    try {
      const actions = useAppStore.getState().actions;
      actions.setLoading(true);

      const success = await this.serviceContainer.databaseIntegration.updateTaskStatus(
        taskId,
        status,
        completionNotes
      );

      if (success) {
        // Update local state
        actions.updateTask(taskId, { status });
        
        // Broadcast task update
        const task = useAppStore.getState().tasks.tasks.find(t => t.id === taskId);
        if (task) {
          await this.serviceContainer.realTimeCommunication.broadcastTaskUpdate(
            taskId,
            'updated',
            { ...task, status },
            {
              userId: useAppStore.getState().user.user?.id || '',
              userRole: useAppStore.getState().user.user?.role || 'worker'
            }
          );
        }
      }

      actions.setLoading(false);
      return success;

    } catch (error) {
      console.error('Failed to update task status:', error);
      useAppStore.getState().actions.setError('Failed to update task status');
      useAppStore.getState().actions.setLoading(false);
      return false;
    }
  }

  /**
   * Refresh tasks from database
   */
  async refreshTasks(): Promise<void> {
    try {
      const user = useAppStore.getState().user.user;
      if (!user) return;

      let tasks: OperationalDataTaskAssignment[] = [];

      if (user.role === 'worker') {
        const result = await this.serviceContainer.databaseIntegration.getWorkerTasks(user.id, {
          limit: 100,
          sort: [{ field: 'due_date', direction: 'ASC' }]
        });
        tasks = result.data;
      } else {
        // Admin/Manager - get all tasks
        const result = await this.serviceContainer.databaseIntegration.executeQuery(
          'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100'
        );
        tasks = result;
      }

      useAppStore.getState().actions.setTasks(tasks);

    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  }

  // MARK: - Clock In/Out Integration

  /**
   * Clock in worker
   */
  async clockInWorker(buildingId: string): Promise<boolean> {
    try {
      const actions = useAppStore.getState().actions;
      const user = useAppStore.getState().user.user;
      
      if (!user || user.role !== 'worker') {
        actions.setError('Only workers can clock in');
        return false;
      }

      actions.setLoading(true);

      const success = await this.serviceContainer.databaseIntegration.clockInWorker(user.id, buildingId);
      
      if (success) {
        // Get building info
        const building = await this.serviceContainer.databaseIntegration.getBuilding(buildingId);
        
        // Update clock status
        actions.setClockStatus({
          isClockedIn: true,
          clockInTime: new Date(),
          currentBuilding: building
        });

        // Set current building
        if (building) {
          actions.setCurrentBuilding(building);
        }

        // Broadcast worker status update
        await this.serviceContainer.realTimeCommunication.broadcastWorkerStatusUpdate(
          user.id,
          'clocked_in',
          { buildingId, buildingName: building?.name },
          {
            userId: user.id,
            userRole: user.role
          }
        );
      }

      actions.setLoading(false);
      return success;

    } catch (error) {
      console.error('Failed to clock in:', error);
      useAppStore.getState().actions.setError('Failed to clock in');
      useAppStore.getState().actions.setLoading(false);
      return false;
    }
  }

  /**
   * Clock out worker
   */
  async clockOutWorker(): Promise<boolean> {
    try {
      const actions = useAppStore.getState().actions;
      const user = useAppStore.getState().user.user;
      
      if (!user || user.role !== 'worker') {
        actions.setError('Only workers can clock out');
        return false;
      }

      actions.setLoading(true);

      const success = await this.serviceContainer.databaseIntegration.clockOutWorker(user.id);
      
      if (success) {
        // Update clock status
        actions.setClockStatus({
          isClockedIn: false,
          clockInTime: null,
          currentBuilding: null
        });

        // Clear current building
        actions.setCurrentBuilding(null);

        // Broadcast worker status update
        await this.serviceContainer.realTimeCommunication.broadcastWorkerStatusUpdate(
          user.id,
          'clocked_out',
          {},
          {
            userId: user.id,
            userRole: user.role
          }
        );
      }

      actions.setLoading(false);
      return success;

    } catch (error) {
      console.error('Failed to clock out:', error);
      useAppStore.getState().actions.setError('Failed to clock out');
      useAppStore.getState().actions.setLoading(false);
      return false;
    }
  }

  // MARK: - Real-Time Integration

  /**
   * Setup real-time event listeners
   */
  private async setupRealTimeListeners(): Promise<void> {
    const realTimeService = this.serviceContainer.realTimeCommunication;
    const actions = useAppStore.getState().actions;

    // Connection status updates
    realTimeService.on('connected', () => {
      actions.setRealTimeConnected(true);
      actions.setConnectionQuality('excellent');
    });

    realTimeService.on('disconnected', () => {
      actions.setRealTimeConnected(false);
      actions.setConnectionQuality('disconnected');
    });

    // Task updates
    realTimeService.on('event:task:created', (event) => {
      actions.addTask(event.data.task);
      actions.addNotification({
        id: `task_created_${event.id}`,
        type: 'info',
        title: 'New Task Created',
        message: `Task "${event.data.task.name}" has been created`,
        timestamp: new Date()
      });
    });

    realTimeService.on('event:task:updated', (event) => {
      actions.updateTask(event.data.taskId, event.data.task);
      actions.addNotification({
        id: `task_updated_${event.id}`,
        type: 'info',
        title: 'Task Updated',
        message: `Task "${event.data.task.name}" has been updated`,
        timestamp: new Date()
      });
    });

    // Worker status updates
    realTimeService.on('event:worker:clocked_in', (event) => {
      actions.addNotification({
        id: `worker_clocked_in_${event.id}`,
        type: 'success',
        title: 'Worker Clocked In',
        message: `${event.data.worker.name} clocked in at ${event.data.building.name}`,
        timestamp: new Date()
      });
    });

    realTimeService.on('event:worker:clocked_out', (event) => {
      actions.addNotification({
        id: `worker_clocked_out_${event.id}`,
        type: 'info',
        title: 'Worker Clocked Out',
        message: `${event.data.worker.name} clocked out`,
        timestamp: new Date()
      });
    });

    // Building alerts
    realTimeService.on('event:building:alert', (event) => {
      actions.addBuildingAlert(event.data.buildingId, event.data.alert);
      actions.addNotification({
        id: `building_alert_${event.id}`,
        type: 'warning',
        title: 'Building Alert',
        message: event.data.alert.message,
        timestamp: new Date()
      });
    });
  }

  // MARK: - Nova AI Integration

  /**
   * Setup Nova AI integration
   */
  private async setupNovaAIIntegration(): Promise<void> {
    const novaService = this.serviceContainer.novaAIBrain;
    const actions = useAppStore.getState().actions;

    // Set Nova AI connection status
    actions.setNovaConnectionStatus(novaService.isSupabaseAvailable() ? 'connected' : 'disconnected');
  }

  /**
   * Process Nova AI prompt
   */
  async processNovaPrompt(promptText: string): Promise<any> {
    try {
      const actions = useAppStore.getState().actions;
      const user = useAppStore.getState().user.user;
      const currentBuilding = useAppStore.getState().worker.currentBuilding;
      const currentTask = useAppStore.getState().tasks.currentTask;

      if (!user) {
        actions.setError('User not authenticated');
        return null;
      }

      actions.setNovaProcessing(true);

      const prompt = {
        id: `prompt_${Date.now()}`,
        text: promptText,
        context: {
          userRole: user.role,
          userId: user.id,
          currentBuilding,
          currentTask,
          timeContext: {
            timeOfDay: this.getTimeOfDay(),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            season: this.getSeason()
          }
        },
        priority: 'medium' as const,
        expectedResponseType: 'analysis' as const,
        metadata: { source: 'mobile_app' }
      };

      const response = await this.serviceContainer.novaAIBrain.processPrompt(prompt);
      
      // Update Nova AI state
      actions.addNovaResponse(response);
      actions.setNovaProcessing(false);

      // Add insights to state
      if (response.insights && response.insights.length > 0) {
        response.insights.forEach(insight => {
          actions.addNovaInsight(insight);
        });
      }

      return response;

    } catch (error) {
      console.error('Failed to process Nova prompt:', error);
      useAppStore.getState().actions.setError('Failed to process Nova prompt');
      useAppStore.getState().actions.setNovaProcessing(false);
      return null;
    }
  }

  // MARK: - Periodic Sync

  /**
   * Start periodic data synchronization
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncData();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic synchronization
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync data with server
   */
  private async syncData(): Promise<void> {
    try {
      const user = useAppStore.getState().user.user;
      if (!user) return;

      // Refresh tasks
      await this.refreshTasks();

      // Update last sync time
      useAppStore.getState().actions.setLastSyncTime(new Date());

    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }

  // MARK: - Utility Methods

  /**
   * Get time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get current season
   */
  private getSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    this.stopPeriodicSync();
    await this.serviceContainer.realTimeCommunication.disconnect();
    this.isInitialized = false;
  }
}

export default ServiceIntegrationLayer;
