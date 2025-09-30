/**
 * 🧠 Intelligence Service
 * Provides portfolio insights and analytics
 */

import { OperationalDataService } from '../data/OperationalDataService';
import { BuildingService } from './BuildingService';
import { WorkerService } from './WorkerService';
import { TaskService } from './TaskService';

export interface PortfolioInsights {
  totalBuildings: number;
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  completedTasksToday: number;
  averageCompletionRate: number;
  complianceScore: number;
  criticalIssues: number;
  topPerformingBuildings: Array<{
    buildingId: string;
    buildingName: string;
    score: number;
  }>;
  workerProductivity: Array<{
    workerId: string;
    workerName: string;
    tasksCompleted: number;
    efficiency: number;
  }>;
  buildingHealth: Array<{
    buildingId: string;
    buildingName: string;
    healthScore: number;
    issues: string[];
  }>;
}

export class IntelligenceService {
  private static instance: IntelligenceService;
  private operationalDataService: OperationalDataService;
  private buildingService: BuildingService;
  private workerService: WorkerService;
  private taskService: TaskService;

  private constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.buildingService = new BuildingService();
    this.workerService = new WorkerService();
    this.taskService = new TaskService();
  }

  public static getInstance(): IntelligenceService {
    if (!IntelligenceService.instance) {
      IntelligenceService.instance = new IntelligenceService();
    }
    return IntelligenceService.instance;
  }

  /**
   * Get comprehensive portfolio insights
   */
  public async getPortfolioInsights(): Promise<PortfolioInsights> {
    const buildings = this.buildingService.getAllBuildings();
    const workers = this.workerService.getAllWorkers();
    const tasks = this.taskService.getAllTasks();
    
    const activeWorkers = workers.filter(worker => worker.isClockedIn);
    const completedTasksToday = tasks.filter(task => 
      task.isCompleted && 
      new Date(task.completed_at || '').toDateString() === new Date().toDateString()
    );
    
    const totalTasks = tasks.length;
    const averageCompletionRate = totalTasks > 0 ? (completedTasksToday.length / totalTasks) * 100 : 0;
    
    // Calculate compliance score based on building data
    const complianceScore = this.calculateComplianceScore(buildings);
    
    // Get top performing buildings
    const topPerformingBuildings = buildings
      .map(building => ({
        buildingId: building.id,
        buildingName: building.name,
        score: building.compliance_score * 100 || 95
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Get worker productivity
    const workerProductivity = workers.map(worker => {
      const workerTasks = tasks.filter(task => task.assigned_worker_id === worker.id);
      const completedTasks = workerTasks.filter(task => task.isCompleted);
      const efficiency = workerTasks.length > 0 ? (completedTasks.length / workerTasks.length) * 100 : 0;
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        tasksCompleted: completedTasks.length,
        efficiency
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
    
    // Get building health
    const buildingHealth = buildings.map(building => {
      const buildingTasks = tasks.filter(task => task.assigned_building_id === building.id);
      const incompleteTasks = buildingTasks.filter(task => !task.isCompleted);
      const healthScore = buildingTasks.length > 0 ? 
        ((buildingTasks.length - incompleteTasks.length) / buildingTasks.length) * 100 : 100;
      
      const issues: string[] = [];
      if (incompleteTasks.length > 0) {
        issues.push(`${incompleteTasks.length} incomplete tasks`);
      }
      if (building.compliance_score < 0.8) {
        issues.push('Compliance issues detected');
      }
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        healthScore,
        issues
      };
    });
    
    const criticalIssues = buildingHealth.filter(building => building.healthScore < 70).length;
    
    return {
      totalBuildings: buildings.length,
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      totalTasks,
      completedTasksToday: completedTasksToday.length,
      averageCompletionRate,
      complianceScore,
      criticalIssues,
      topPerformingBuildings,
      workerProductivity,
      buildingHealth
    };
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(buildings: any[]): number {
    if (buildings.length === 0) return 100;
    
    const totalScore = buildings.reduce((sum, building) => {
      return sum + (building.compliance_score * 100 || 95);
    }, 0);
    
    return totalScore / buildings.length;
  }

  /**
   * Get building-specific insights
   */
  public async getBuildingInsights(buildingId: string): Promise<any> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    const buildingTasks = this.taskService.getAllTasks().filter(task => 
      task.assigned_building_id === buildingId
    );
    
    const completedTasks = buildingTasks.filter(task => task.isCompleted);
    const completionRate = buildingTasks.length > 0 ? 
      (completedTasks.length / buildingTasks.length) * 100 : 100;
    
    return {
      buildingId,
      buildingName: building.name,
      totalTasks: buildingTasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      complianceScore: building.compliance_score * 100 || 95,
      lastUpdated: new Date()
    };
  }

  /**
   * Get worker-specific insights
   */
  public async getWorkerInsights(workerId: string): Promise<any> {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }
    
    const workerTasks = this.taskService.getAllTasks().filter(task => 
      task.assigned_worker_id === workerId
    );
    
    const completedTasks = workerTasks.filter(task => task.isCompleted);
    const efficiency = workerTasks.length > 0 ? 
      (completedTasks.length / workerTasks.length) * 100 : 100;
    
    return {
      workerId,
      workerName: worker.name,
      totalTasks: workerTasks.length,
      completedTasks: completedTasks.length,
      efficiency,
      isActive: worker.isClockedIn,
      lastUpdated: new Date()
    };
  }
}
