/**
 * @cyntientops/business-core
 * 
 * Core business logic and services for CyntientOps
 * Mirrors Swift ServiceContainer architecture
 */

// Core Services
export { OperationalDataService } from './services/OperationalDataService';
export { WorkerService } from './services/WorkerService';
export { BuildingService } from './services/BuildingService';
export { TaskService } from './services/TaskService';
export { ClientService } from './services/ClientService';

// Service Types
export type { OperationalDataState } from './services/OperationalDataService';
export type { WorkerLocation, ClockInData, WorkerAssignment } from './services/WorkerService';
export type { BuildingComplianceStatus, BuildingMaintenanceSchedule } from './services/BuildingService';
export type { TaskSchedule, TaskProgress, TaskFilter } from './services/TaskService';
export type { ClientPortfolio, ClientPerformanceMetrics, ClientBillingSummary } from './services/ClientService';

// Service Container (Singleton pattern)
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  public readonly operationalData: OperationalDataService;
  public readonly worker: WorkerService;
  public readonly building: BuildingService;
  public readonly task: TaskService;
  public readonly client: ClientService;

  private constructor() {
    this.operationalData = OperationalDataService.getInstance();
    this.worker = new WorkerService();
    this.building = new BuildingService();
    this.task = new TaskService();
    this.client = new ClientService();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize all services with operational data
   */
  public async initialize(): Promise<void> {
    await this.operationalData.loadOperationalData();
    console.log('✅ ServiceContainer initialized successfully');
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): {
    operationalData: boolean;
    worker: boolean;
    building: boolean;
    task: boolean;
    client: boolean;
    overall: boolean;
  } {
    const operationalDataHealthy = this.operationalData.isDataLoaded();
    
    return {
      operationalData: operationalDataHealthy,
      worker: true, // WorkerService is stateless
      building: true, // BuildingService is stateless
      task: true, // TaskService is stateless
      client: true, // ClientService is stateless
      overall: operationalDataHealthy
    };
  }
}

// Default export
export default ServiceContainer;
