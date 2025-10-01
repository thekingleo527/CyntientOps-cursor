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
import { AlertsService } from './services/AlertsService';
import { BuildingMetricsService } from './services/BuildingMetricsService';
import { ComplianceService } from './services/ComplianceService';
import { NYCService } from './services/NYCService';
import { AnalyticsService } from './services/AnalyticsService';
import { NotesService } from './services/NotesService';
import { InventoryService } from './services/InventoryService';
import { VendorAccessService } from './services/VendorAccessService';
import { SystemService } from './services/SystemService';

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
import { BuildingInfrastructureCatalog } from './services/BuildingInfrastructureCatalog';
import { RealTimeSyncService } from './services/RealTimeSyncService';
import { CommandChainManager } from '@cyntientops/command-chains';
import { OperationalDataManager, operationalDataManager } from './OperationalDataManager';
import { DatabaseIntegrationService } from './services/DatabaseIntegrationService';
import { SessionManager } from './services/SessionManager';
import { RealTimeCommunicationService } from './services/RealTimeCommunicationService';
import { NovaAIBrainService } from './services/NovaAIBrainService';

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
  public readonly databaseIntegration: DatabaseIntegrationService;
  
  // MARK: - Layer 1: Core Services (LAZY INITIALIZATION)
  public readonly auth: AuthService;
  public readonly sessionManager: SessionManager;
  
  // Lazy services - initialized when first accessed
  private _workers: WorkerService | null = null;
  private _buildings: BuildingService | null = null;
  private _tasks: TaskService | null = null;
  private _client: ClientService | null = null;
  
  // MARK: - Layer 2: Business Logic (LAZY)
  private _realTimeOrchestrator: RealTimeOrchestrator | null = null;
  private _realTimeSync: RealTimeSyncService | null = null;
  private _realTimeCommunication: RealTimeCommunicationService | null = null;
  private _routeManager: RouteManager | null = null;
  private _novaAIBrain: NovaAIBrainService | null = null;
  private _performanceOptimizer: PerformanceOptimizer | null = null;
  private _analyticsService: AnalyticsService | null = null;
  private _securityManager: SecurityManager | null = null;
  private _productionManager: ProductionManager | null = null;
  private _buildingInfrastructureCatalog: BuildingInfrastructureCatalog | null = null;
  private _commandChainManager: CommandChainManager | null = null;
  private _metrics: BuildingMetricsService | null = null;
  private _compliance: ComplianceService | null = null;
  private _webSocket: WebSocketManager | null = null;
  private _notes: NotesService | null = null;
  private _inventory: InventoryService | null = null;
  private _weather: any | null = null; // Weather via WeatherAPIClient in api-clients
  private _vendorAccess: VendorAccessService | null = null;
  private _alerts: AlertsService | null = null;
  private _system: SystemService | null = null;
  
  // Building Detail Services
  private _buildingDetailsCatalog: any | null = null;
  private _buildingMetricsCatalog: any | null = null;
  private _buildingTasksCatalog: any | null = null;
  private _buildingContactsCatalog: any | null = null;
  private _buildingActivityCatalog: any | null = null;
  private _buildingInventoryCatalog: any | null = null;
  private _buildingWorkersCatalog: any | null = null;
  private _issueReportingCatalog: any | null = null;
  private _supplyRequestCatalog: any | null = null;
  private _photoCatalog: any | null = null;
  private _nyc: NYCService | null = null;
  // Photos delegated to PhotoEvidenceManager (no separate PhotosService needed)
  private _analytics: AnalyticsService | null = null;
  
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
    this.operationalData = OperationalDataService.getInstance();
    this.databaseIntegration = DatabaseIntegrationService.getInstance(this.database);
    this.auth = AuthService.getInstance(this.database);
    this.sessionManager = SessionManager.getInstance(this.database, this.auth);
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

  public get realTimeSync(): RealTimeSyncService {
    if (!this._realTimeSync) {
      this._realTimeSync = RealTimeSyncService.getInstance(
        operationalDataManager,
        this.webSocket,
        {
          enableRealTimeSync: this.config.enableRealTimeSync,
          syncInterval: 30000,
          maxRetries: 3,
          retryDelay: 5000
        }
      );
    }
    return this._realTimeSync;
  }

  public get routeManager(): RouteManager {
    if (!this._routeManager) {
      this._routeManager = RouteManager.getInstance(this.database);
    }
    return this._routeManager;
  }

  public get realTimeCommunication(): RealTimeCommunicationService {
    if (!this._realTimeCommunication) {
      this._realTimeCommunication = RealTimeCommunicationService.getInstance(this.database, this.webSocket);
    }
    return this._realTimeCommunication;
  }

  public get novaAIBrain(): NovaAIBrainService {
    if (!this._novaAIBrain) {
      this._novaAIBrain = NovaAIBrainService.getInstance(this.database);
    }
    return this._novaAIBrain;
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

  public get buildingInfrastructureCatalog(): BuildingInfrastructureCatalog {
    if (!this._buildingInfrastructureCatalog) {
      this._buildingInfrastructureCatalog = BuildingInfrastructureCatalog.getInstance(this.database);
    }
    return this._buildingInfrastructureCatalog;
  }

  public get commandChainManager(): CommandChainManager {
    if (!this._commandChainManager) {
      this._commandChainManager = CommandChainManager.getInstance(
        this.database,
        this.clockIn,
        this.location,
        this.notifications,
        this.intelligence,
        this // Pass this ServiceContainer as IServiceContainer
      );
    }
    return this._commandChainManager;
  }

  public get operationalData(): OperationalDataManager {
    return operationalDataManager;
  }

  // MARK: - Building Data Helper Methods
  
  private getBuildingType(buildingId: string): string {
    const buildingTypes: Record<string, string> = {
      "14": "Museum", // Rubin Museum
      "20": "Office", // CyntientOps HQ
      "16": "Park",   // Stuyvesant Cove
    };
    return buildingTypes[buildingId] || "Residential";
  }
  
  private getBuildingSize(buildingId: string): number {
    const buildingSizes: Record<string, number> = {
      "14": 50000, // Rubin Museum
      "20": 10000, // CyntientOps HQ
      "16": 20000, // Stuyvesant Cove
    };
    return buildingSizes[buildingId] || 25000;
  }
  
  private getBuildingYearBuilt(buildingId: string): number {
    const buildingYears: Record<string, number> = {
      "14": 2004, // Rubin Museum
      "20": 2020, // CyntientOps HQ
      "16": 2010, // Stuyvesant Cove
    };
    return buildingYears[buildingId] || 1995;
  }
  
  private getBuildingContractType(buildingId: string): string {
    const contractTypes: Record<string, string> = {
      "14": "Museum Contract", // Rubin Museum
      "20": "Internal", // CyntientOps HQ
      "16": "Park Contract", // Stuyvesant Cove
    };
    return contractTypes[buildingId] || "Standard";
  }
  
  private getBuildingRating(buildingId: string): string {
    const buildingRatings: Record<string, string> = {
      "14": "A+", // Rubin Museum
      "20": "A",  // CyntientOps HQ
      "16": "A",  // Stuyvesant Cove
    };
    return buildingRatings[buildingId] || "B+";
  }
  
  // MARK: - Task Processing Helper Methods
  
  private getTaskStatus(task: any): string {
    const now = new Date();
    const hour = now.getHours();
    
    // Check if task should be active based on schedule
    if (task.startHour && task.endHour) {
      if (hour >= task.startHour && hour <= task.endHour) {
        return 'in_progress';
      } else if (hour < task.startHour) {
        return 'pending';
      } else {
        return 'completed';
      }
    }
    
    return 'pending';
  }
  
  private getTaskPriority(task: any): string {
    if (task.category === 'Maintenance' && task.skillLevel === 'Advanced') return 'high';
    if (task.category === 'Sanitation') return 'high';
    if (task.category === 'Operations') return 'medium';
    return 'low';
  }
  
  private getScheduledTime(task: any): string {
    const now = new Date();
    if (task.startHour) {
      const scheduledDate = new Date(now);
      scheduledDate.setHours(task.startHour, 0, 0, 0);
      return scheduledDate.toISOString();
    }
    return now.toISOString();
  }
  
  private getDueDate(task: any): string {
    const now = new Date();
    if (task.endHour) {
      const dueDate = new Date(now);
      dueDate.setHours(task.endHour, 0, 0, 0);
      return dueDate.toISOString();
    }
    // Default to end of day
    const dueDate = new Date(now);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate.toISOString();
  }
  
  // MARK: - Worker Helper Methods
  
  private getWorkerRole(workerName: string): string {
    const roles: Record<string, string> = {
      'Greg Hutson': 'Building Specialist',
      'Edwin Lema': 'Maintenance Specialist',
      'Kevin Dutan': 'Cleaning Specialist',
      'Mercedes Inamagua': 'Glass Cleaning Specialist',
      'Luis Lopez': 'Building Specialist',
      'Angel Guirachocha': 'Evening Operations',
      'Shawn Magloire': 'Maintenance Manager',
    };
    return roles[workerName] || 'Worker';
  }
  
  private getWorkerPhone(workerName: string): string {
    const phones: Record<string, string> = {
      'Greg Hutson': '(555) 100-0001',
      'Edwin Lema': '(555) 100-0002',
      'Kevin Dutan': '(555) 100-0004',
      'Mercedes Inamagua': '(555) 100-0005',
      'Luis Lopez': '(555) 100-0006',
      'Angel Guirachocha': '(555) 100-0007',
      'Shawn Magloire': '(555) 100-0008',
    };
    return phones[workerName] || '(555) 000-0000';
  }
  
  private getWorkerEmail(workerName: string): string {
    const emails: Record<string, string> = {
      'Greg Hutson': 'greg.hutson@francomanagement.com',
      'Edwin Lema': 'edwin.lema@francomanagement.com',
      'Kevin Dutan': 'kevin.dutan@francomanagement.com',
      'Mercedes Inamagua': 'mercedes.inamagua@francomanagement.com',
      'Luis Lopez': 'luis.lopez@francomanagement.com',
      'Angel Guirachocha': 'angel.guirachocha@francomanagement.com',
      'Shawn Magloire': 'shawn.magloire@francomanagement.com',
    };
    return emails[workerName] || 'worker@francomanagement.com';
  }

  // MARK: - Building Detail Services (for useBuildingDetailViewModel)

  public get buildingDetailsCatalog(): any {
    if (!this._buildingDetailsCatalog) {
      this._buildingDetailsCatalog = {
        getBuildingDetails: (buildingId: string) => {
          const building = this.operationalData.getBuilding(buildingId);
          const stats = this.operationalData.getBuildingStatistics(buildingId);
          
          return {
            id: buildingId,
            name: building?.name || 'Unknown Building',
            address: building?.address || 'Address not available',
            type: this.getBuildingType(buildingId),
            size: this.getBuildingSize(buildingId),
            yearBuilt: this.getBuildingYearBuilt(buildingId),
            contractType: this.getBuildingContractType(buildingId),
            rating: this.getBuildingRating(buildingId),
            totalTasks: stats.totalTasks,
            dailyTasks: stats.dailyTasks,
            weeklyTasks: stats.weeklyTasks,
            tasksByCategory: stats.tasksByCategory,
            tasksByWorker: stats.tasksByWorker,
            latitude: building?.latitude || 40.7589,
            longitude: building?.longitude || -73.9851,
          };
        },
        updateBuildingDetails: async (buildingId: string, updates: any) => {
          this.operationalData.logEvent('building_details_updated', buildingId, undefined, updates);
          console.log('Updating building details:', buildingId, updates);
        },
      };
    }
    return this._buildingDetailsCatalog;
  }

  public get buildingMetricsCatalog(): any {
    if (!this._buildingMetricsCatalog) {
      this._buildingMetricsCatalog = {
        getBuildingMetrics: async (buildingId: string) => {
          return await this.metrics.getBuildingMetrics(buildingId);
        },
      };
    }
    return this._buildingMetricsCatalog;
  }

  public get buildingTasksCatalog(): any {
    if (!this._buildingTasksCatalog) {
      this._buildingTasksCatalog = {
        getBuildingTasks: (buildingId: string) => {
          const buildingName = operationalDataManager.getBuildingName(buildingId);
          const tasks = operationalDataManager.getTasksForBuilding(buildingName);
          
          return tasks.map((task, index) => ({
            id: `${buildingId}-${index}`,
            title: task.taskName,
            description: `${task.category} - ${task.skillLevel} level`,
            status: this.getTaskStatus(task),
            priority: this.getTaskPriority(task),
            scheduledAt: this.getScheduledTime(task),
            dueDate: this.getDueDate(task),
            assignedWorker: task.assignedWorker,
            category: task.category,
            skillLevel: task.skillLevel,
            recurrence: task.recurrence,
            requiresPhoto: task.requiresPhoto,
            estimatedDuration: task.estimatedDuration,
            daysOfWeek: task.daysOfWeek,
            startHour: task.startHour,
            endHour: task.endHour,
          }));
        },
      };
    }
    return this._buildingTasksCatalog;
  }

  public get buildingContactsCatalog(): any {
    if (!this._buildingContactsCatalog) {
      this._buildingContactsCatalog = {
        getBuildingContacts: (buildingId: string) => {
          const buildingName = operationalDataManager.getBuildingName(buildingId);
          const tasks = operationalDataManager.getTasksForBuilding(buildingName || '');
          const assignedWorkers = [...new Set(tasks.map(task => task.assignedWorker))];
          
          const contacts = assignedWorkers.map((workerName, index) => ({
            id: `${buildingId}-worker-${index}`,
            name: workerName,
            role: this.getWorkerRole(workerName),
            phone: this.getWorkerPhone(workerName),
            email: this.getWorkerEmail(workerName),
            isPrimary: index === 0,
            isEmergency: workerName.includes('Angel') || workerName.includes('Shawn'),
          }));
          
          // Add building-specific contacts
          if (buildingName?.includes('Museum')) {
            contacts.push({
              id: `${buildingId}-museum-contact`,
              name: 'Museum Operations',
              role: 'Museum Manager',
              phone: '(212) 620-5000',
              email: 'operations@rubinmuseum.org',
              isPrimary: false,
              isEmergency: true,
            });
          }
          
          return contacts;
        },
      };
    }
    return this._buildingContactsCatalog;
  }

  public get buildingActivityCatalog(): any {
    if (!this._buildingActivityCatalog) {
      // TODO: Implement BuildingActivityCatalog
      this._buildingActivityCatalog = {
        getBuildingActivity: (buildingId: string) => [
          {
            id: '1',
            type: 'taskCompleted',
            description: 'Daily cleaning completed',
            workerName: 'Jane Doe',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            type: 'photoAdded',
            description: 'Photo evidence added for maintenance task',
            workerName: 'Bob Johnson',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }
    return this._buildingActivityCatalog;
  }

  public get buildingInventoryCatalog(): any {
    if (!this._buildingInventoryCatalog) {
      // TODO: Implement BuildingInventoryCatalog
      this._buildingInventoryCatalog = {
        getBuildingInventory: (buildingId: string) => [
          {
            id: '1',
            name: 'Cleaning Supplies',
            category: 'cleaning',
            quantity: 5,
            minThreshold: 10,
          },
          {
            id: '2',
            name: 'Maintenance Tools',
            category: 'maintenance',
            quantity: 15,
            minThreshold: 5,
          },
        ],
      };
    }
    return this._buildingInventoryCatalog;
  }

  public get buildingWorkersCatalog(): any {
    if (!this._buildingWorkersCatalog) {
      // TODO: Implement BuildingWorkersCatalog
      this._buildingWorkersCatalog = {
        getBuildingWorkers: (buildingId: string) => [
          {
            id: '1',
            name: 'Jane Doe',
            isOnSite: true,
            role: 'Cleaning Specialist',
          },
          {
            id: '2',
            name: 'Bob Johnson',
            isOnSite: false,
            role: 'Maintenance Technician',
          },
        ],
      };
    }
    return this._buildingWorkersCatalog;
  }

  public get issueReportingCatalog(): any {
    if (!this._issueReportingCatalog) {
      // TODO: Implement IssueReportingCatalog
      this._issueReportingCatalog = {
        reportIssue: async (issue: any) => {
          console.log('Reporting issue:', issue);
        },
      };
    }
    return this._issueReportingCatalog;
  }

  public get supplyRequestCatalog(): any {
    if (!this._supplyRequestCatalog) {
      // TODO: Implement SupplyRequestCatalog
      this._supplyRequestCatalog = {
        requestSupplies: async (supplies: any) => {
          console.log('Requesting supplies:', supplies);
        },
      };
    }
    return this._supplyRequestCatalog;
  }

  public get photoCatalog(): any {
    if (!this._photoCatalog) {
      // TODO: Implement PhotoCatalog
      this._photoCatalog = {
        addPhoto: async (photo: any) => {
          console.log('Adding photo:', photo);
        },
      };
    }
    return this._photoCatalog;
  }

  // MARK: - Additional Services for Enhanced ViewModels

  public get notes(): NotesService {
    if (!this._notes) {
      this._notes = NotesService.getInstance(this.database);
    }
    return this._notes;
  }

  public get inventory(): InventoryService {
    if (!this._inventory) {
      this._inventory = InventoryService.getInstance(this.database);
    }
    return this._inventory;
  }

  public get weather(): any {
    if (!this._weather) {
      // Weather functionality is provided by WeatherAPIClient in api-clients package
      // Access via this.apiClients.weather or this.weatherTasks
      this._weather = this.weatherTasks;
    }
    return this._weather;
  }

  public get vendorAccess(): VendorAccessService {
    if (!this._vendorAccess) {
      this._vendorAccess = VendorAccessService.getInstance(this.database);
    }
    return this._vendorAccess;
  }

  public get alerts(): AlertsService {
    if (!this._alerts) {
      this._alerts = AlertsService.getInstance();
    }
    return this._alerts;
  }

  public get metrics(): BuildingMetricsService {
    if (!this._metrics) {
      this._metrics = BuildingMetricsService.getInstance();
    }
    return this._metrics;
  }

  public get compliance(): ComplianceService {
    if (!this._compliance) {
      this._compliance = ComplianceService.getInstance(this);
    }
    return this._compliance;
  }

  public get system(): SystemService {
    if (!this._system) {
      this._system = SystemService.getInstance(this.database);
    }
    return this._system;
  }

  public get nyc(): NYCService {
    if (!this._nyc) {
      this._nyc = NYCService.getInstance();
    }
    return this._nyc;
  }

  public get photos(): PhotoEvidenceManager {
    // Photos are handled by PhotoEvidenceManager, not a separate service
    return this.photoEvidence;
  }

  public get analytics(): AnalyticsService {
    if (!this._analytics) {
      this._analytics = AnalyticsService.getInstance();
    }
    return this._analytics;
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
  
  public get intelligence(): IntelligenceService {
    if (!this._intelligence) {
      this._intelligence = IntelligenceService.getInstance();
    }
    return this._intelligence;
  }
  
  // MARK: - Manager Accessors
  
  public get clockIn(): ClockInManager {
    if (!this._clockIn) {
      this._clockIn = ClockInManager.getInstance(this.database);
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
      syncActive: this._realTimeSync !== null,
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
