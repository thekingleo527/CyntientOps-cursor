/**
 * 🔄 Dashboard Sync Service
 * Mirrors: CyntientOps/Services/Core/DashboardSyncService.swift
 * Purpose: Cross-dashboard synchronization for real-time updates
 */

import { DatabaseManager } from '@cyntientops/database';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { 
  DashboardUpdate, 
  DashboardUpdateSource, 
  DashboardUpdateType,
  UserRole 
} from '@cyntientops/domain-schema';

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

export class DashboardSyncService {
  private static instance: DashboardSyncService;
  
  private database: DatabaseManager;
  private webSocketManager: WebSocketManager;
  private isInitialized = false;
  private isLive = true;
  private isOnline = true;
  
  // Live update feeds
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
  
  private constructor(database: DatabaseManager, webSocketManager: WebSocketManager) {
    this.database = database;
    this.webSocketManager = webSocketManager;
  }
  
  public static getInstance(database?: DatabaseManager, webSocketManager?: WebSocketManager): DashboardSyncService {
    if (!DashboardSyncService.instance) {
      if (!database || !webSocketManager) {
        throw new Error('DashboardSyncService requires database and webSocketManager for initialization');
      }
      DashboardSyncService.instance = new DashboardSyncService(database, webSocketManager);
    }
    return DashboardSyncService.instance;
  }
  
  // MARK: - Initialization
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing DashboardSyncService...');
    
    try {
      // Setup WebSocket connection
      await this.setupWebSocketConnection();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup authentication monitoring
      this.setupAuthenticationMonitoring();
      
      this.isInitialized = true;
      console.log('✅ DashboardSyncService initialized');
      
    } catch (error) {
      console.error('❌ DashboardSyncService initialization failed:', error);
      throw error;
    }
  }
  
  // MARK: - Public Broadcasting Methods
  
  public broadcastWorkerUpdate(update: DashboardUpdate): void {
    if (!this.isLive) return;
    
    console.log('📤 Broadcasting worker update:', update.type);
    
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
    
    console.log('📤 Broadcasting admin update:', update.type);
    
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
    
    console.log('📤 Broadcasting client update:', update.type);
    
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
    const update: DashboardUpdate = {
      id: this.generateUpdateId(),
      source: 'worker' as DashboardUpdateSource,
      type: 'workerClockedIn' as DashboardUpdateType,
      buildingId,
      workerId,
      data: {
        buildingName: buildingName || '',
        workerName: '', // TODO: Get from database
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
        buildingName: '', // TODO: Get from database
        workerName: '', // TODO: Get from database
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
        buildingName: '', // TODO: Get from database
        workerName: '', // TODO: Get from database
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
        console.error('Error in update listener:', error);
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
      trend: 'stable', // TODO: Calculate from historical data
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
      // TODO: Get auth token from auth service
      const token = 'placeholder-token';
      await this.webSocketManager.connect(token);
      console.log('🔌 WebSocket connected');
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
    }
  }
  
  private async sendToServer(update: DashboardUpdate): Promise<void> {
    try {
      await this.webSocketManager.send(update);
      console.log('🌐 Sent update to server:', update.type);
    } catch (error) {
      console.error('❌ Failed to send update to server:', error);
      // Queue for retry
      this.enqueueUpdate(update);
    }
  }
  
  public async handleRemoteUpdate(update: DashboardUpdate): Promise<void> {
    console.log('📥 Received remote update:', update.type);
    
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
      // TODO: Store in database for offline processing
      console.log('📥 Queued update for offline processing:', update.type);
      this.pendingUpdatesCount++;
      
      if (this.getUpdatePriority(update.type) === 'urgent') {
        this.urgentPendingCount++;
      }
      
    } catch (error) {
      console.error('❌ Failed to queue update:', error);
    }
  }
  
  public async processPendingUpdatesBatch(): Promise<void> {
    if (!this.isOnline) return;
    
    console.log('🔄 Processing pending updates...');
    
    try {
      // TODO: Process queued updates from database
      this.pendingUpdatesCount = 0;
      this.urgentPendingCount = 0;
      this.lastSyncTime = new Date();
      
      console.log('✅ Pending updates processed');
    } catch (error) {
      console.error('❌ Failed to process pending updates:', error);
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
  
  private async detectAndResolveConflicts(update: DashboardUpdate): Promise<void> {
    // TODO: Implement conflict detection and resolution
    console.log('🔍 Checking for conflicts in update:', update.id);
  }
  
  // MARK: - Network Monitoring
  
  private setupNetworkMonitoring(): void {
    // TODO: Implement network status monitoring
    console.log('📡 Network monitoring setup');
  }
  
  private setupAuthenticationMonitoring(): void {
    // TODO: Implement authentication state monitoring
    console.log('🔐 Authentication monitoring setup');
  }
  
  // MARK: - Public Control Methods
  
  public enableCrossDashboardSync(): void {
    this.isLive = true;
    console.log('🔄 Cross-dashboard synchronization enabled');
  }
  
  public disableCrossDashboardSync(): void {
    this.isLive = false;
    console.log('⏸️ Cross-dashboard synchronization disabled');
  }
  
  public clearLiveUpdates(): void {
    this.liveWorkerUpdates = [];
    this.liveAdminAlerts = [];
    this.liveClientMetrics = [];
  }
  
  public async disconnect(): Promise<void> {
    await this.webSocketManager.disconnect();
    this.isOnline = false;
    console.log('🔌 DashboardSyncService disconnected');
  }
}
