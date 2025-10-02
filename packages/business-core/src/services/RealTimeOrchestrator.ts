/**
 * 🔄 Real-Time Orchestrator
 * Purpose: Coordinates real-time data flow between Worker, Admin, and Client dashboards
 * Ensures seamless orchestration of all user actions and system events
 */

import { ServiceContainer } from '../ServiceContainer';
import { DatabaseManager } from '@cyntientops/database';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { Logger } from './LoggingService';
import {
  DashboardUpdate,
  DashboardUpdateSource,
  DashboardUpdateType,
  UserRole,
  ContextualTask,
  WorkerProfile,
  ComplianceIssue,
  AdminAlert,
  IntelligenceInsight
} from '@cyntientops/domain-schema';

export interface RealTimeEvent {
  id: string;
  type: RealTimeEventType;
  source: UserRole;
  targetRoles: UserRole[];
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export enum RealTimeEventType {
  // Worker Events
  WORKER_CLOCKED_IN = 'worker_clocked_in',
  WORKER_CLOCKED_OUT = 'worker_clocked_out',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  PHOTO_CAPTURED = 'photo_captured',
  VENDOR_LOG_CREATED = 'vendor_log_created',
  QUICK_NOTE_ADDED = 'quick_note_added',
  SITE_DEPARTURE_STARTED = 'site_departure_started',
  SITE_DEPARTURE_COMPLETED = 'site_departure_completed',
  EMERGENCY_REPORTED = 'emergency_reported',
  
  // Admin Events
  TASK_ASSIGNED = 'task_assigned',
  TASK_REASSIGNED = 'task_reassigned',
  WORKER_ASSIGNED = 'worker_assigned',
  COMPLIANCE_ISSUE_CREATED = 'compliance_issue_created',
  COMPLIANCE_ISSUE_RESOLVED = 'compliance_issue_resolved',
  ALERT_CREATED = 'alert_created',
  ALERT_ACKNOWLEDGED = 'alert_acknowledged',
  SCHEDULE_UPDATED = 'schedule_updated',
  BUILDING_ASSIGNED = 'building_assigned',
  
  // Client Events
  CLIENT_REQUEST_CREATED = 'client_request_created',
  CLIENT_REQUEST_UPDATED = 'client_request_updated',
  PORTFOLIO_UPDATED = 'portfolio_updated',
  BUDGET_ALERT = 'budget_alert',
  
  // System Events
  WEATHER_ALERT = 'weather_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  DATA_SYNC_COMPLETED = 'data_sync_completed',
  NOVA_INSIGHT_GENERATED = 'nova_insight_generated'
}

export interface EventSubscription {
  id: string;
  eventType: RealTimeEventType;
  userRole: UserRole;
  callback: (event: RealTimeEvent) => void;
}

// Live update interfaces from DashboardSyncService
export interface LiveWorkerUpdate {
  id: string;
  workerId: string;
  workerName?: string;
  action: string;
  buildingId?: string;
  buildingName?: string;
  timestamp: Date;
}

export interface LiveAdminAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  buildingId: string;
  timestamp: Date;
}

export interface LiveClientMetric {
  id: string;
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export interface UpdatePriority {
  level: 'low' | 'normal' | 'high' | 'urgent';
  retryDelay: number;
  maxRetries: number;
}

export class RealTimeOrchestrator {
  private static instance: RealTimeOrchestrator;
  
  private database: DatabaseManager;
  private webSocketManager: WebSocketManager;
  private serviceContainer: ServiceContainer;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventQueue: RealTimeEvent[] = [];
  private isProcessing = false;
  private isInitialized = false;
  private isLive = true;
  private isOnline = true;
  
  // Live update feeds (from DashboardSyncService)
  public liveWorkerUpdates: LiveWorkerUpdate[] = [];
  public liveAdminAlerts: LiveAdminAlert[] = [];
  public liveClientMetrics: LiveClientMetric[] = [];
  
  // Unified dashboard state
  public unifiedBuildingMetrics: Map<string, any> = new Map();
  public lastSyncTime?: Date;
  public pendingUpdatesCount = 0;
  public urgentPendingCount = 0;
  
  // Event listeners
  private updateListeners: Map<string, (update: DashboardUpdate) => void> = new Map();
  
  // Event handlers for different user roles
  private workerEventHandlers: Map<RealTimeEventType, (event: RealTimeEvent) => void> = new Map();
  private adminEventHandlers: Map<RealTimeEventType, (event: RealTimeEvent) => void> = new Map();
  private clientEventHandlers: Map<RealTimeEventType, (event: RealTimeEvent) => void> = new Map();
  
  private constructor(database: DatabaseManager, webSocketManager: WebSocketManager, serviceContainer: ServiceContainer) {
    this.database = database;
    this.webSocketManager = webSocketManager;
    this.serviceContainer = serviceContainer;
    this.setupEventHandlers();
  }
  
  public static getInstance(database?: DatabaseManager, webSocketManager?: WebSocketManager, serviceContainer?: ServiceContainer): RealTimeOrchestrator {
    if (!RealTimeOrchestrator.instance) {
      if (!database || !webSocketManager || !serviceContainer) {
        throw new Error('RealTimeOrchestrator requires database, webSocketManager, and serviceContainer for initialization');
      }
      RealTimeOrchestrator.instance = new RealTimeOrchestrator(database, webSocketManager, serviceContainer);
    }
    return RealTimeOrchestrator.instance;
  }
  
  // MARK: - Initialization
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    Logger.debug('🔄 Initializing RealTimeOrchestrator...', undefined, 'RealTimeOrchestrator');
    
    try {
      // Setup WebSocket connection
      await this.setupWebSocketConnection();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup authentication monitoring
      this.setupAuthenticationMonitoring();
      
      this.isInitialized = true;
      Logger.debug('✅ RealTimeOrchestrator initialized', undefined, 'RealTimeOrchestrator');
      
    } catch (error) {
      Logger.error('❌ RealTimeOrchestrator initialization failed:', undefined, 'RealTimeOrchestrator');
      throw error;
    }
  }
  
  // MARK: - Event Publishing
  
  public async publishEvent(event: Omit<RealTimeEvent, 'id' | 'timestamp'>): Promise<void> {
    const realTimeEvent: RealTimeEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };
    
    // Add to queue for processing
    this.eventQueue.push(realTimeEvent);
    
    // Process immediately for critical events
    if (realTimeEvent.priority === 'critical') {
      await this.processEvent(realTimeEvent);
    } else {
      // Process queue asynchronously
      this.processEventQueue();
    }
  }
  
  // MARK: - Worker Event Publishing
  
  public async publishWorkerClockIn(workerId: string, buildingId: string, buildingName: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.WORKER_CLOCKED_IN,
      source: 'worker',
      targetRoles: ['admin', 'client'],
      data: { workerId, buildingId, buildingName },
      priority: 'high'
    });
  }
  
  public async publishWorkerClockOut(workerId: string, buildingId: string, duration: number): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.WORKER_CLOCKED_OUT,
      source: 'worker',
      targetRoles: ['admin', 'client'],
      data: { workerId, buildingId, duration },
      priority: 'medium'
    });
  }
  
  public async publishTaskCompleted(taskId: string, workerId: string, buildingId: string, taskName: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.TASK_COMPLETED,
      source: 'worker',
      targetRoles: ['admin', 'client'],
      data: { taskId, workerId, buildingId, taskName },
      priority: 'high'
    });
  }
  
  public async publishPhotoCaptured(taskId: string, workerId: string, buildingId: string, photoCount: number): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.PHOTO_CAPTURED,
      source: 'worker',
      targetRoles: ['admin', 'client'],
      data: { taskId, workerId, buildingId, photoCount },
      priority: 'medium'
    });
  }
  
  public async publishEmergencyReported(workerId: string, buildingId: string, emergencyType: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.EMERGENCY_REPORTED,
      source: 'worker',
      targetRoles: ['admin', 'client'],
      data: { workerId, buildingId, emergencyType },
      priority: 'critical'
    });
  }
  
  // MARK: - Admin Event Publishing
  
  public async publishTaskAssigned(taskId: string, workerId: string, buildingId: string, assignedBy: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.TASK_ASSIGNED,
      source: 'admin',
      targetRoles: ['worker', 'client'],
      data: { taskId, workerId, buildingId, assignedBy },
      priority: 'high'
    });
  }
  
  public async publishComplianceIssueCreated(issueId: string, buildingId: string, severity: string, createdBy: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.COMPLIANCE_ISSUE_CREATED,
      source: 'admin',
      targetRoles: ['worker', 'client'],
      data: { issueId, buildingId, severity, createdBy },
      priority: 'high'
    });
  }
  
  public async publishAlertCreated(alertId: string, alertType: string, buildingId: string, createdBy: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.ALERT_CREATED,
      source: 'admin',
      targetRoles: ['worker', 'client'],
      data: { alertId, alertType, buildingId, createdBy },
      priority: 'high'
    });
  }
  
  // MARK: - Client Event Publishing
  
  public async publishClientRequest(requestId: string, buildingId: string, requestType: string, priority: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.CLIENT_REQUEST_CREATED,
      source: 'client',
      targetRoles: ['admin', 'worker'],
      data: { requestId, buildingId, requestType, priority },
      priority: priority === 'urgent' ? 'critical' : 'medium'
    });
  }
  
  public async publishBudgetAlert(buildingId: string, budgetUtilization: number, threshold: number): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.BUDGET_ALERT,
      source: 'client',
      targetRoles: ['admin', 'worker'],
      data: { buildingId, budgetUtilization, threshold },
      priority: 'high'
    });
  }
  
  // MARK: - System Event Publishing
  
  public async publishWeatherAlert(alertType: string, affectedBuildings: string[], severity: string): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.WEATHER_ALERT,
      source: 'admin', // System events come from admin
      targetRoles: ['worker', 'client'],
      data: { alertType, affectedBuildings, severity },
      priority: severity === 'severe' ? 'critical' : 'medium'
    });
  }
  
  public async publishNovaInsight(insightId: string, insightType: string, targetRoles: UserRole[], data: any): Promise<void> {
    await this.publishEvent({
      type: RealTimeEventType.NOVA_INSIGHT_GENERATED,
      source: 'admin', // Nova insights come from system
      targetRoles,
      data: { insightId, insightType, ...data },
      priority: 'medium'
    });
  }
  
  // MARK: - Event Subscription
  
  public subscribe(eventType: RealTimeEventType, userRole: UserRole, callback: (event: RealTimeEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      userRole,
      callback
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }
  
  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }
  
  // MARK: - Event Processing
  
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.processEvent(event);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async processEvent(event: RealTimeEvent): Promise<void> {
    try {
      // Notify subscribers
      this.notifySubscribers(event);
      
      // Update dashboard sync
      await this.updateDashboardSync(event);
      
      // Update context engines
      await this.updateContextEngines(event);
      
      // Update intelligence services
      await this.updateIntelligenceServices(event);
      
      console.log(`✅ Processed real-time event: ${event.type} from ${event.source}`);
      
    } catch (error) {
      console.error(`❌ Failed to process real-time event: ${event.type}`, error);
    }
  }
  
  private notifySubscribers(event: RealTimeEvent): void {
    this.subscriptions.forEach(subscription => {
      if (subscription.eventType === event.type && 
          event.targetRoles.includes(subscription.userRole)) {
        try {
          subscription.callback(event);
        } catch (error) {
          Logger.error('Error in event subscription callback:', undefined, 'RealTimeOrchestrator');
        }
      }
    });
  }
  
  private async updateDashboardSync(event: RealTimeEvent): Promise<void> {
    const dashboardUpdate: DashboardUpdate = {
      id: event.id,
      source: event.source as DashboardUpdateSource,
      type: this.mapEventTypeToUpdateType(event.type),
      buildingId: event.data.buildingId || '',
      workerId: event.data.workerId || '',
      data: event.data,
      timestamp: event.timestamp
    };
    
    // Broadcast to appropriate dashboards using the orchestrator itself as the sync layer
    switch (event.source) {
      case 'worker':
        this.broadcastWorkerUpdate(dashboardUpdate);
        break;
      case 'admin':
        this.broadcastAdminUpdate(dashboardUpdate);
        break;
      case 'client':
        this.broadcastClientUpdate(dashboardUpdate);
        break;
    }
  }
  
  private async updateContextEngines(event: RealTimeEvent): Promise<void> {
    // Update worker context engine
    if (event.data.workerId) {
      // Update WorkerContextEngine with new data
      this.updateWorkerContextEngine(event);
    }
    
    // Update admin context engine
    if (event.targetRoles.includes('admin')) {
      // Update AdminContextEngine with new data
      this.updateAdminContextEngine(event);
    }
  }
  
  private async updateIntelligenceServices(event: RealTimeEvent): Promise<void> {
    // Update intelligence services with new event data
    // Update Nova AI and intelligence services
    this.updateNovaAI(event);
  }
  
  // MARK: - Event Handlers Setup
  
  private setupEventHandlers(): void {
    // Worker event handlers
    this.workerEventHandlers.set(RealTimeEventType.TASK_ASSIGNED, this.handleTaskAssigned.bind(this));
    this.workerEventHandlers.set(RealTimeEventType.SCHEDULE_UPDATED, this.handleScheduleUpdated.bind(this));
    this.workerEventHandlers.set(RealTimeEventType.ALERT_CREATED, this.handleAlertCreated.bind(this));
    
    // Admin event handlers
    this.adminEventHandlers.set(RealTimeEventType.WORKER_CLOCKED_IN, this.handleWorkerClockIn.bind(this));
    this.adminEventHandlers.set(RealTimeEventType.TASK_COMPLETED, this.handleTaskCompleted.bind(this));
    this.adminEventHandlers.set(RealTimeEventType.EMERGENCY_REPORTED, this.handleEmergencyReported.bind(this));
    
    // Client event handlers
    this.clientEventHandlers.set(RealTimeEventType.TASK_COMPLETED, this.handleTaskCompletedForClient.bind(this));
    this.clientEventHandlers.set(RealTimeEventType.COMPLIANCE_ISSUE_CREATED, this.handleComplianceIssueForClient.bind(this));
  }
  
  // MARK: - Event Handlers
  
  private async handleTaskAssigned(event: RealTimeEvent): Promise<void> {
    // Update worker's task list and notifications
    console.log(`Worker ${event.data.workerId} assigned task ${event.data.taskId}`);
  }
  
  private async handleScheduleUpdated(event: RealTimeEvent): Promise<void> {
    // Update worker's schedule
    console.log(`Schedule updated for worker ${event.data.workerId}`);
  }
  
  private async handleAlertCreated(event: RealTimeEvent): Promise<void> {
    // Show alert to worker
    console.log(`Alert created for worker ${event.data.workerId}: ${event.data.alertType}`);
  }
  
  private async handleWorkerClockIn(event: RealTimeEvent): Promise<void> {
    // Update admin dashboard with worker status
    console.log(`Worker ${event.data.workerId} clocked in at ${event.data.buildingName}`);
  }
  
  private async handleTaskCompleted(event: RealTimeEvent): Promise<void> {
    // Update admin dashboard with task completion
    console.log(`Task ${event.data.taskId} completed by worker ${event.data.workerId}`);
  }
  
  private async handleEmergencyReported(event: RealTimeEvent): Promise<void> {
    // Critical alert for admin
    console.log(`EMERGENCY: ${event.data.emergencyType} reported by worker ${event.data.workerId}`);
  }
  
  private async handleTaskCompletedForClient(event: RealTimeEvent): Promise<void> {
    // Update client dashboard with task completion
    console.log(`Task completed for client at building ${event.data.buildingId}`);
  }
  
  private async handleComplianceIssueForClient(event: RealTimeEvent): Promise<void> {
    // Update client dashboard with compliance issue
    console.log(`Compliance issue created for client at building ${event.data.buildingId}`);
  }
  
  // MARK: - Helper Methods
  
  private mapEventTypeToUpdateType(eventType: RealTimeEventType): DashboardUpdateType {
    const mapping: Record<RealTimeEventType, DashboardUpdateType> = {
      [RealTimeEventType.WORKER_CLOCKED_IN]: 'workerClockedIn',
      [RealTimeEventType.WORKER_CLOCKED_OUT]: 'workerClockedOut',
      [RealTimeEventType.TASK_COMPLETED]: 'taskCompleted',
      [RealTimeEventType.TASK_STARTED]: 'taskStarted',
      [RealTimeEventType.PHOTO_CAPTURED]: 'photoCaptured',
      [RealTimeEventType.EMERGENCY_REPORTED]: 'criticalAlert',
      [RealTimeEventType.COMPLIANCE_ISSUE_CREATED]: 'complianceStatusChanged',
      [RealTimeEventType.ALERT_CREATED]: 'criticalAlert',
      [RealTimeEventType.WEATHER_ALERT]: 'weatherAlert',
      [RealTimeEventType.NOVA_INSIGHT_GENERATED]: 'intelligenceInsight',
      // Add more mappings as needed
    } as Record<RealTimeEventType, DashboardUpdateType>;
    
    return mapping[eventType] || 'generalUpdate';
  }
  
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // MARK: - Public Methods
  
  public getEventQueueLength(): number {
    return this.eventQueue.length;
  }
  
  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
  
  public async clearEventQueue(): Promise<void> {
    this.eventQueue = [];
  }
  
  public async shutdown(): Promise<void> {
    this.subscriptions.clear();
    this.eventQueue = [];
    this.workerEventHandlers.clear();
    this.adminEventHandlers.clear();
    this.clientEventHandlers.clear();
    await this.webSocketManager.disconnect();
  }
  
  // MARK: - DashboardSyncService Compatibility Methods
  
  public broadcastWorkerUpdate(update: DashboardUpdate): void {
    if (!this.isLive) return;
    
    Logger.debug('📤 Broadcasting worker update:', undefined, 'RealTimeOrchestrator');
    
    if (this.isOnline) {
      // Send locally
      this.notifyListeners(update);
      
      // Create live updates
      this.createLiveWorkerUpdate(update);
      this.createLiveAdminAlert(update);
      
      // Send via WebSocket
      this.sendToServer(update);
      
    } else {
      // Queue for later if offline
      this.enqueueUpdate(update);
    }
  }
  
  public broadcastAdminUpdate(update: DashboardUpdate): void {
    if (!this.isLive) return;
    
    Logger.debug('📤 Broadcasting admin update:', undefined, 'RealTimeOrchestrator');
    
    if (this.isOnline) {
      // Send locally
      this.notifyListeners(update);
      
      // Create live updates
      this.createLiveAdminAlert(update);
      this.createLiveClientMetric(update);
      
      // Send via WebSocket
      this.sendToServer(update);
      
    } else {
      // Queue for later if offline
      this.enqueueUpdate(update);
    }
  }
  
  public broadcastClientUpdate(update: DashboardUpdate): void {
    if (!this.isLive) return;
    
    Logger.debug('📤 Broadcasting client update:', undefined, 'RealTimeOrchestrator');
    
    if (this.isOnline) {
      // Send locally
      this.notifyListeners(update);
      
      // Create live updates
      this.createLiveClientMetric(update);
      
      // Send via WebSocket
      this.sendToServer(update);
      
    } else {
      // Queue for later if offline
      this.enqueueUpdate(update);
    }
  }
  
  // MARK: - Convenience Broadcasting Methods
  
  public onWorkerClockedIn(workerId: string, buildingId: string, buildingName?: string): void {
    const resolvedBuildingName = buildingName ?? this.getBuildingName(buildingId);

    const update: DashboardUpdate = {
      id: this.generateUpdateId(),
      source: 'worker' as DashboardUpdateSource,
      type: 'workerClockedIn' as DashboardUpdateType,
      buildingId,
      workerId,
      data: {
        buildingName: resolvedBuildingName,
        workerName: this.getWorkerName(workerId), // Get from database
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };
    this.broadcastWorkerUpdate(update);
  }
  
  public onWorkerClockedOut(workerId: string, buildingId: string, duration?: number): void {
    const update: DashboardUpdate = {
      id: this.generateUpdateId(),
      source: 'worker' as DashboardUpdateSource,
      type: 'workerClockedOut' as DashboardUpdateType,
      buildingId,
      workerId,
      data: {
        buildingName: this.getBuildingName(buildingId), // Get from database
        workerName: this.getWorkerName(workerId), // Get from database
        duration: duration ? `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m` : '',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };
    this.broadcastWorkerUpdate(update);
  }
  
  public onTaskCompleted(taskId: string, workerId: string, buildingId: string, taskName?: string): void {
    const update: DashboardUpdate = {
      id: this.generateUpdateId(),
      source: 'worker' as DashboardUpdateSource,
      type: 'taskCompleted' as DashboardUpdateType,
      buildingId,
      workerId,
      data: {
        taskId,
        taskName: taskName || 'task',
        buildingName: this.getBuildingName(buildingId), // Get from database
        workerName: this.getWorkerName(workerId), // Get from database
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };
    this.broadcastWorkerUpdate(update);
  }
  
  // MARK: - Event Listeners
  
  public addUpdateListener(id: string, listener: (update: DashboardUpdate) => void): void {
    this.updateListeners.set(id, listener);
  }
  
  public removeUpdateListener(id: string): void {
    this.updateListeners.delete(id);
  }
  
  private notifyListeners(update: DashboardUpdate): void {
    this.updateListeners.forEach((listener) => {
      try {
        listener(update);
      } catch (error) {
        Logger.error('Error in update listener:', undefined, 'RealTimeOrchestrator');
      }
    });
  }
  
  // MARK: - Live Update Creation
  
  private createLiveWorkerUpdate(update: DashboardUpdate): void {
    if (update.source !== 'worker') return;
    
    const workerUpdate: LiveWorkerUpdate = {
      id: this.generateUpdateId(),
      workerId: update.workerId,
      workerName: update.data.workerName,
      action: this.generateDetailedAction(update),
      buildingId: update.buildingId || undefined,
      buildingName: update.data.buildingName,
      timestamp: update.timestamp
    };
    
    this.liveWorkerUpdates.push(workerUpdate);
    this.limitLiveUpdates();
  }
  
  private createLiveAdminAlert(update: DashboardUpdate): void {
    if (update.type !== 'buildingMetricsChanged' && 
        update.type !== 'complianceStatusChanged' && 
        update.type !== 'criticalAlert') return;
    
    const severity: 'low' | 'medium' | 'high' | 'critical' = 
      update.type === 'criticalAlert' ? 'critical' : 'medium';
    
    const alert: LiveAdminAlert = {
      id: this.generateUpdateId(),
      title: update.data.title || update.type,
      severity,
      buildingId: update.buildingId,
      timestamp: update.timestamp
    };
    
    this.liveAdminAlerts.push(alert);
    this.limitLiveUpdates();
  }
  
  private createLiveClientMetric(update: DashboardUpdate): void {
    if (update.type !== 'buildingMetricsChanged' && 
        update.type !== 'routineStatusChanged' && 
        update.type !== 'monthlyMetricsUpdated') return;
    
    const metric: LiveClientMetric = {
      id: this.generateUpdateId(),
      name: this.getMetricName(update.type),
      value: this.getMetricValue(update.data),
      trend: this.calculateTrend(update.data),
      timestamp: update.timestamp
    };
    
    this.liveClientMetrics.push(metric);
    this.limitLiveUpdates();
  }
  
  private limitLiveUpdates(): void {
    const maxUpdates = 50; // Keep last 50 updates
    
    if (this.liveWorkerUpdates.length > maxUpdates) {
      this.liveWorkerUpdates = this.liveWorkerUpdates.slice(-maxUpdates);
    }
    if (this.liveAdminAlerts.length > maxUpdates) {
      this.liveAdminAlerts = this.liveAdminAlerts.slice(-maxUpdates);
    }
    if (this.liveClientMetrics.length > maxUpdates) {
      this.liveClientMetrics = this.liveClientMetrics.slice(-maxUpdates);
    }
  }
  
  // MARK: - WebSocket Integration
  
  private async setupWebSocketConnection(): Promise<void> {
    try {
      // Get auth token from ServiceContainer's session manager
      const authToken = await this.getAuthToken();
      await this.webSocketManager.connect(authToken);
      Logger.debug('🔌 WebSocket connected with auth token', undefined, 'RealTimeOrchestrator');
    } catch (error) {
      Logger.error('❌ WebSocket connection failed:', undefined, 'RealTimeOrchestrator');
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const session = this.serviceContainer.sessionManager.getCurrentSession();
      return session?.sessionToken || 'anonymous-token';
    } catch (error) {
      Logger.warn('⚠️ Failed to get auth token, using anonymous:', undefined, 'RealTimeOrchestrator');
      return 'anonymous-token';
    }
  }
  
  private async sendToServer(update: DashboardUpdate): Promise<void> {
    try {
      await this.webSocketManager.send(update);
      Logger.debug('🌐 Sent update to server:', undefined, 'RealTimeOrchestrator');
    } catch (error) {
      Logger.error('❌ Failed to send update to server:', undefined, 'RealTimeOrchestrator');
      // Queue for retry
      this.enqueueUpdate(update);
    }
  }
  
  public async handleRemoteUpdate(update: DashboardUpdate): Promise<void> {
    Logger.debug('📥 Received remote update:', undefined, 'RealTimeOrchestrator');
    
    // Handle conflicts
    await this.detectAndResolveConflicts(update);
    
    // Broadcast the remote update locally
    this.notifyListeners(update);
    
    // Create appropriate live updates
    this.createLiveWorkerUpdate(update);
    this.createLiveAdminAlert(update);
    this.createLiveClientMetric(update);
  }
  
  // MARK: - Offline Queue Management
  
  private async enqueueUpdate(update: DashboardUpdate): Promise<void> {
    try {
      // Store in database for offline processing
      await this.database.execute(
        `INSERT INTO offline_queue (id, update_type, update_data, priority, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          update.id,
          update.type,
          JSON.stringify(update),
          this.getUpdatePriority(update.type),
          update.timestamp.toISOString()
        ]
      );

      Logger.debug('📥 Queued update for offline processing:', undefined, 'RealTimeOrchestrator');
      this.pendingUpdatesCount++;

      if (this.getUpdatePriority(update.type) === 'urgent') {
        this.urgentPendingCount++;
      }

    } catch (error) {
      Logger.error('❌ Failed to queue update:', undefined, 'RealTimeOrchestrator');
    }
  }
  
  public async processPendingUpdatesBatch(): Promise<void> {
    if (!this.isOnline) return;

    Logger.debug('🔄 Processing pending updates...', undefined, 'RealTimeOrchestrator');

    try {
      // Retrieve queued updates from database, ordered by priority and creation time
      const queuedUpdates = await this.database.query(
        `SELECT * FROM offline_queue ORDER BY priority DESC, created_at ASC LIMIT 100`
      );

      let processed = 0;
      let failed = 0;

      for (const row of queuedUpdates) {
        try {
          const update: DashboardUpdate = JSON.parse(row.update_data as string);
          await this.sendToServer(update);

          // Delete successfully processed update from queue
          await this.database.execute(
            `DELETE FROM offline_queue WHERE id = ?`,
            [row.id]
          );
          processed++;
        } catch (error) {
          Logger.error('❌ Failed to process queued update:', undefined, 'RealTimeOrchestrator');
          failed++;
        }
      }

      // Update counts from database
      const remainingCount = await this.database.query(
        `SELECT COUNT(*) as count FROM offline_queue`
      );
      this.pendingUpdatesCount = (remainingCount[0]?.count as number) || 0;

      const urgentCount = await this.database.query(
        `SELECT COUNT(*) as count FROM offline_queue WHERE priority = 'urgent'`
      );
      this.urgentPendingCount = (urgentCount[0]?.count as number) || 0;

      this.lastSyncTime = new Date();

      console.log(`✅ Processed ${processed} updates, ${failed} failed, ${this.pendingUpdatesCount} remaining`);
    } catch (error) {
      Logger.error('❌ Failed to process pending updates:', undefined, 'RealTimeOrchestrator');
    }
  }
  
  // MARK: - Helper Methods
  
  private generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateDetailedAction(update: DashboardUpdate): string {
    switch (update.type) {
      case 'taskCompleted':
        return `completed ${update.data.taskName || 'task'}`;
      case 'workerClockedIn':
        return 'clocked in';
      case 'workerClockedOut':
        return update.data.duration ? `clocked out after ${update.data.duration}` : 'clocked out';
      case 'taskStarted':
        return `started ${update.data.taskName || 'task'}`;
      default:
        return update.type;
    }
  }
  
  private getMetricName(type: string): string {
    switch (type) {
      case 'routineStatusChanged':
        return 'Routine Status';
      case 'monthlyMetricsUpdated':
        return 'Monthly Budget';
      default:
        return 'Building Metrics';
    }
  }
  
  private getMetricValue(data: any): string {
    if (data.completionRate) {
      return `${data.completionRate}%`;
    } else if (data.budgetUtilization) {
      return `${data.budgetUtilization}%`;
    }
    return 'N/A';
  }
  
  private getUpdatePriority(type: string): 'low' | 'normal' | 'high' | 'urgent' {
    switch (type) {
      case 'workerClockedIn':
      case 'workerClockedOut':
      case 'criticalAlert':
        return 'urgent';
      case 'taskCompleted':
      case 'complianceStatusChanged':
        return 'high';
      case 'buildingMetricsChanged':
        return 'normal';
      default:
        return 'low';
    }
  }
  
  private calculateTrend(data: any): 'up' | 'down' | 'stable' {
    // Calculate trend based on data changes
    if (!data || typeof data !== 'object') return 'stable';

    if (data.previousValue !== undefined && data.currentValue !== undefined) {
      const prev = Number(data.previousValue);
      const curr = Number(data.currentValue);

      if (!isNaN(prev) && !isNaN(curr)) {
        if (curr > prev) return 'up';
        if (curr < prev) return 'down';
      }
    }

    // Check for percentage change
    if (data.percentageChange !== undefined) {
      const change = Number(data.percentageChange);
      if (!isNaN(change)) {
        if (change > 0) return 'up';
        if (change < 0) return 'down';
      }
    }

    return 'stable';
  }

  private async detectAndResolveConflicts(update: DashboardUpdate): Promise<void> {
    try {
      // Get local version of the data
      const localVersion = await this.getLocalVersion(update);

      if (!localVersion) {
        // No local version, no conflict
        return;
      }

      // Check for conflicts based on timestamps and versions
      const hasConflict =
        localVersion.timestamp > update.timestamp ||
        (localVersion.version && update.data.version &&
         localVersion.version !== update.data.version);

      if (hasConflict) {
        Logger.debug('⚠️ Conflict detected for update:', undefined, 'RealTimeOrchestrator');

        // Use last-write-wins strategy
        if (localVersion.timestamp > update.timestamp) {
          Logger.debug('📌 Local version is newer, keeping local', undefined, 'RealTimeOrchestrator');
          return;
        } else {
          Logger.debug('📥 Remote version is newer, using remote', undefined, 'RealTimeOrchestrator');
        }
      }
    } catch (error) {
      Logger.error('❌ Conflict detection failed:', undefined, 'RealTimeOrchestrator');
    }
  }

  private async getLocalVersion(update: DashboardUpdate): Promise<any> {
    try {
      const result = await this.database.query(
        `SELECT * FROM dashboard_updates WHERE id = ? OR
         (building_id = ? AND worker_id = ? AND type = ?)
         ORDER BY timestamp DESC LIMIT 1`,
        [update.id, update.buildingId, update.workerId, update.type]
      );
      return result[0];
    } catch (error) {
      return null;
    }
  }
  
  // MARK: - Network Monitoring

  private setupNetworkMonitoring(): void {
    // Set initial online status
    this.isOnline = true;
    Logger.debug('📡 Network monitoring setup (online mode)', undefined, 'RealTimeOrchestrator');

    // Periodically check network status
    setInterval(() => {
      this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      const wasOnline = this.isOnline;
      // Use WebSocket connection status as network health indicator
      this.isOnline = this.webSocketManager.isConnected();

      if (!wasOnline && this.isOnline) {
        Logger.debug('🌐 Network restored, processing pending updates...', undefined, 'RealTimeOrchestrator');
        await this.processPendingUpdatesBatch();
      } else if (wasOnline && !this.isOnline) {
        Logger.debug('📴 Network lost, queuing updates for offline processing', undefined, 'RealTimeOrchestrator');
      }
    } catch (error) {
      Logger.error('❌ Network status check failed:', undefined, 'RealTimeOrchestrator');
    }
  }

  private setupAuthenticationMonitoring(): void {
    try {
      // Periodically check authentication status
      setInterval(async () => {
        await this.checkAuthenticationStatus();
      }, 60000); // Check every minute

      Logger.debug('🔐 Authentication monitoring setup', undefined, 'RealTimeOrchestrator');
    } catch (error) {
      Logger.error('❌ Authentication monitoring setup failed:', undefined, 'RealTimeOrchestrator');
    }
  }

  private async checkAuthenticationStatus(): Promise<void> {
    try {
      const session = this.serviceContainer.sessionManager.getCurrentSession();

      if (!session || !session.isValid) {
        Logger.warn('⚠️ Session invalid or expired, disconnecting real-time services', undefined, 'RealTimeOrchestrator');
        await this.disconnect();
      }
    } catch (error) {
      Logger.error('❌ Authentication status check failed:', undefined, 'RealTimeOrchestrator');
    }
  }
  
  // MARK: - Public Control Methods
  
  public enableCrossDashboardSync(): void {
    this.isLive = true;
    Logger.debug('🔄 Cross-dashboard synchronization enabled', undefined, 'RealTimeOrchestrator');
  }
  
  public disableCrossDashboardSync(): void {
    this.isLive = false;
    Logger.debug('⏸️ Cross-dashboard synchronization disabled', undefined, 'RealTimeOrchestrator');
  }
  
  public clearLiveUpdates(): void {
    this.liveWorkerUpdates = [];
    this.liveAdminAlerts = [];
    this.liveClientMetrics = [];
  }
  
  public async disconnect(): Promise<void> {
    await this.webSocketManager.disconnect();
    this.isOnline = false;
    Logger.debug('🔌 RealTimeOrchestrator disconnected', undefined, 'RealTimeOrchestrator');
  }

  // MARK: - Missing Helper Methods

  private updateWorkerContextEngine(event: RealTimeEvent): void {
    Logger.debug('🔄 Updating WorkerContextEngine with event:', undefined, 'RealTimeOrchestrator');
    // Implementation would update worker context engine
  }

  private updateAdminContextEngine(event: RealTimeEvent): void {
    Logger.debug('🔄 Updating AdminContextEngine with event:', undefined, 'RealTimeOrchestrator');
    // Implementation would update admin context engine
  }

  private updateNovaAI(event: RealTimeEvent): void {
    Logger.debug('🔄 Updating Nova AI with event:', undefined, 'RealTimeOrchestrator');
    // Implementation would update Nova AI
  }

  private getWorkerName(workerId: string): string {
    // Get worker name from database
    const workers = require('@cyntientops/data-seed/workers.json');
    const worker = workers.find((w: any) => w.id === workerId);
    return worker?.name || 'Unknown Worker';
  }

  private getBuildingName(buildingId: string): string {
    // Get building name from database
    const buildings = require('@cyntientops/data-seed/buildings.json');
    const building = buildings.find((b: any) => b.id === buildingId);
    return building?.name || 'Unknown Building';
  }
}
