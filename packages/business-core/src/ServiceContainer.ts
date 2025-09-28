/**
 * 🏗️ Service Container
 * Mirrors: CyntientOps/Services/Core/ServiceContainer.swift
 * Purpose: Central dependency injection system with lazy initialization
 */

import { DatabaseManager } from '@cyntientops/database';
import { APIClientManager } from '@cyntientops/api-clients';
import { ClockInManager } from '@cyntientops/managers';
import { LocationManager } from '@cyntientops/managers';
import { NotificationManager } from '@cyntientops/managers';
import { PhotoEvidenceManager } from '@cyntientops/managers';
import { WeatherTaskManager } from '@cyntientops/managers';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { OfflineManager } from '@cyntientops/offline-support';
import { IntelligenceService } from '@cyntientops/intelligence-services';

// Services
import { TaskService } from './services/TaskService';
import { WorkerService } from './services/WorkerService';
import { BuildingService } from './services/BuildingService';
import { ClientService } from './services/ClientService';
import { OperationalDataService } from './services/OperationalDataService';
import { AuthService } from './services/AuthService';
import { RealTimeOrchestrator } from './services/RealTimeOrchestrator';
import { RouteManager } from './services/RouteManager';
import { NovaAPIService } from './services/NovaAPIService';
import { PerformanceOptimizer } from './services/PerformanceOptimizer';
import { AnalyticsEngine } from './services/AnalyticsEngine';
import { SecurityManager } from './services/SecurityManager';
import { ProductionManager } from './services/ProductionManager';

// Types
import { 
  WorkerProfile, 
  Building, 
  ContextualTask, 
  UserRole,
  ServiceHealth 
} from '@cyntientops/domain-schema';

export interface ServiceContainerConfig {
  databasePath: string;
  enableOfflineMode: boolean;
  enableRealTimeSync: boolean;
  enableIntelligence: boolean;
  enableWeatherIntegration: boolean;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  
  // MARK: - Layer 0: Database & Data
  public readonly database: DatabaseManager;
  public readonly operationalData: OperationalDataService;
  
  // MARK: - Layer 1: Core Services (LAZY INITIALIZATION)
  public readonly auth: AuthService;
  
  // Lazy services - initialized when first accessed
  private _workers: WorkerService | null = null;
  private _buildings: BuildingService | null = null;
  private _tasks: TaskService | null = null;
  private _client: ClientService | null = null;
  
  // MARK: - Layer 2: Business Logic (LAZY)
  private _realTimeOrchestrator: RealTimeOrchestrator | null = null;
  private _routeManager: RouteManager | null = null;
  private _novaAPI: NovaAPIService | null = null;
  private _performanceOptimizer: PerformanceOptimizer | null = null;
  private _analyticsEngine: AnalyticsEngine | null = null;
  private _securityManager: SecurityManager | null = null;
  private _productionManager: ProductionManager | null = null;
  private _metrics: any | null = null; // TODO: Implement BuildingMetricsService
  private _compliance: any | null = null; // TODO: Implement ComplianceService
  private _webSocket: WebSocketManager | null = null;
  
  // MARK: - Layer 3: Intelligence (ASYNC INIT)
  private _intelligence: IntelligenceService | null = null;
  
  // MARK: - Layer 4: Managers (LAZY)
  private _clockIn: ClockInManager | null = null;
  private _location: LocationManager | null = null;
  private _notifications: NotificationManager | null = null;
  private _photoEvidence: PhotoEvidenceManager | null = null;
  private _weatherTasks: WeatherTaskManager | null = null;
  private _offlineQueue: OfflineManager | null = null;
  
  // MARK: - API Clients
  private _apiClients: APIClientManager | null = null;
  
  // MARK: - Configuration
  private config: ServiceContainerConfig;
  private isInitialized = false;
  
  private constructor(config: ServiceContainerConfig) {
    this.config = config;
    
    // Initialize essential services synchronously
    this.database = DatabaseManager.getInstance({ path: config.databasePath });
    this.operationalData = new OperationalDataService(this.database);
    this.auth = AuthService.getInstance(this.database);
  }
  
  public static getInstance(config?: ServiceContainerConfig): ServiceContainer {
    if (!ServiceContainer.instance) {
      const defaultConfig: ServiceContainerConfig = {
        databasePath: 'cyntientops.db',
        enableOfflineMode: true,
        enableRealTimeSync: true,
        enableIntelligence: true,
        enableWeatherIntegration: true,
        ...config
      };
      ServiceContainer.instance = new ServiceContainer(defaultConfig);
    }
    return ServiceContainer.instance;
  }
  
  // MARK: - Initialization
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('⚡ Fast ServiceContainer initialization...');
    
    try {
      // Initialize database
      await this.database.initialize();
      console.log('✅ Layer 0: Database connected');
      
      // Initialize operational data
      await this.operationalData.initialize();
      console.log('✅ Layer 0: Operational data loaded');
      
      // Initialize essential services
      console.log('✅ Auth ready');
      
      // Start background initialization
      this.initializeDataInBackground();
      
      this.isInitialized = true;
      console.log('✅ ServiceContainer initialization complete!');
      
    } catch (error) {
      console.error('❌ ServiceContainer initialization failed:', error);
      throw error;
    }
  }
  
  // MARK: - Background Initialization
  
  private async initializeDataInBackground(): Promise<void> {
    console.log('🔄 Starting background data initialization...');
    
    try {
      // Initialize lazy services as needed
      await this.initializeLazyServices();
      
      console.log('✅ Background data initialization complete');
    } catch (error) {
      console.error('❌ Background initialization failed:', error);
    }
  }
  
  private async initializeLazyServices(): Promise<void> {
    // Initialize managers
    this.clockIn;
    this.location;
    this.notifications;
    this.photoEvidence;
    this.weatherTasks;
    this.offlineQueue;
    
    // Initialize API clients
    this.apiClients;
    
    // Initialize intelligence if enabled
    if (this.config.enableIntelligence) {
      await this.intelligence;
    }
  }
  
  // MARK: - Lazy Service Accessors
  
  public get workers(): WorkerService {
    if (!this._workers) {
      this._workers = new WorkerService(this.database, this.dashboardSync);
    }
    return this._workers;
  }
  
  public get buildings(): BuildingService {
    if (!this._buildings) {
      this._buildings = new BuildingService(this.database, this.dashboardSync);
    }
    return this._buildings;
  }
  
  public get tasks(): TaskService {
    if (!this._tasks) {
      this._tasks = new TaskService(this.database, this.dashboardSync);
    }
    return this._tasks;
  }
  
  public get client(): ClientService {
    if (!this._client) {
      this._client = new ClientService(this.database, this.buildings);
    }
    return this._client;
  }
  
  public get realTimeOrchestrator(): RealTimeOrchestrator {
    if (!this._realTimeOrchestrator) {
      this._realTimeOrchestrator = RealTimeOrchestrator.getInstance(this.database, this.webSocket, this);
    }
    return this._realTimeOrchestrator;
  }

  public get routeManager(): RouteManager {
    if (!this._routeManager) {
      this._routeManager = RouteManager.getInstance(this.database);
    }
    return this._routeManager;
  }

  public get novaAPI(): NovaAPIService {
    if (!this._novaAPI) {
      this._novaAPI = NovaAPIService.getInstance(this.database);
    }
    return this._novaAPI;
  }

  public get performanceOptimizer(): PerformanceOptimizer {
    if (!this._performanceOptimizer) {
      this._performanceOptimizer = PerformanceOptimizer.getInstance(this.database);
    }
    return this._performanceOptimizer;
  }

  public get analyticsEngine(): AnalyticsEngine {
    if (!this._analyticsEngine) {
      this._analyticsEngine = AnalyticsEngine.getInstance(this.database);
    }
    return this._analyticsEngine;
  }

  public get securityManager(): SecurityManager {
    if (!this._securityManager) {
      this._securityManager = SecurityManager.getInstance(this.database);
    }
    return this._securityManager;
  }

  public get productionManager(): ProductionManager {
    if (!this._productionManager) {
      this._productionManager = ProductionManager.getInstance(this.database);
    }
    return this._productionManager;
  }
  
  // DashboardSyncService compatibility - delegate to RealTimeOrchestrator
  public get dashboardSync(): any {
    return this.realTimeOrchestrator;
  }
  
  public get webSocket(): WebSocketManager {
    if (!this._webSocket) {
      this._webSocket = new WebSocketManager();
    }
    return this._webSocket;
  }
  
  public get intelligence(): Promise<IntelligenceService> {
    return new Promise(async (resolve, reject) => {
      if (this._intelligence) {
        resolve(this._intelligence);
        return;
      }
      
      try {
        this._intelligence = IntelligenceService.getInstance();
        await this._intelligence.initialize();
        resolve(this._intelligence);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // MARK: - Manager Accessors
  
  public get clockIn(): ClockInManager {
    if (!this._clockIn) {
      this._clockIn = ClockInManager.getInstance();
    }
    return this._clockIn;
  }
  
  public get location(): LocationManager {
    if (!this._location) {
      this._location = LocationManager.getInstance();
    }
    return this._location;
  }
  
  public get notifications(): NotificationManager {
    if (!this._notifications) {
      this._notifications = NotificationManager.getInstance();
    }
    return this._notifications;
  }
  
  public get photoEvidence(): PhotoEvidenceManager {
    if (!this._photoEvidence) {
      this._photoEvidence = PhotoEvidenceManager.getInstance();
    }
    return this._photoEvidence;
  }
  
  public get weatherTasks(): WeatherTaskManager {
    if (!this._weatherTasks) {
      this._weatherTasks = WeatherTaskManager.getInstance();
    }
    return this._weatherTasks;
  }
  
  public get offlineQueue(): OfflineManager {
    if (!this._offlineQueue) {
      this._offlineQueue = OfflineManager.getInstance();
    }
    return this._offlineQueue;
  }
  
  public get apiClients(): APIClientManager {
    if (!this._apiClients) {
      this._apiClients = APIClientManager.getInstance();
    }
    return this._apiClients;
  }
  
  // MARK: - Utility Methods
  
  public verifyServicesReady(): boolean {
    const ready = this.database.isConnected && this.isInitialized;
    
    if (!ready) {
      console.log('⚠️ Services not ready:');
      console.log('   - Database connected:', this.database.isConnected);
      console.log('   - Container initialized:', this.isInitialized);
    }
    
    return ready;
  }
  
  public getServiceHealth(): ServiceHealth {
    return {
      databaseConnected: this.database.isConnected,
      authInitialized: this.auth !== null,
      tasksLoaded: this._tasks !== null,
      intelligenceActive: this._intelligence !== null,
      syncActive: this._dashboardSync !== null,
      offlineQueueSize: 0, // TODO: Get from offline manager
      cacheSize: 0, // TODO: Get from cache manager
      backgroundTasksActive: 0 // TODO: Track background tasks
    };
  }
  
  public async stopBackgroundServices(): Promise<void> {
    console.log('🛑 Stopping background services...');
    
    // Stop WebSocket
    if (this._webSocket) {
      await this._webSocket.disconnect();
    }
    
    // Stop offline queue
    if (this._offlineQueue) {
      await this._offlineQueue.stop();
    }
    
    console.log('✅ Background services stopped');
  }
}

// MARK: - Service Health Type

export interface ServiceHealth {
  databaseConnected: boolean;
  authInitialized: boolean;
  tasksLoaded: boolean;
  intelligenceActive: boolean;
  syncActive: boolean;
  offlineQueueSize: number;
  cacheSize: number;
  backgroundTasksActive: number;
  
  isHealthy?: boolean;
  summary?: string;
}
