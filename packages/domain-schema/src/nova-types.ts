/**
 * 🧠 Nova AI Types
 * Purpose: Type definitions for Nova AI system using canonical data
 * Data Source: packages/data-seed/src/* (NO MOCK DATA)
 */

export type NovaInsightType = 'recommendation' | 'alert' | 'prediction' | 'optimization';
export type NovaPriority = 'low' | 'medium' | 'high' | 'critical';
export type NovaCategory = 'performance' | 'safety' | 'efficiency' | 'compliance' | 'weather' | 'route';
export type NovaConfidence = number; // 0-100

export interface NovaInsight {
  id: string;
  type: NovaInsightType;
  title: string;
  description: string;
  priority: NovaPriority;
  category: NovaCategory;
  confidence: NovaConfidence;
  actionable: boolean;
  timestamp: Date;
  workerId?: string;
  buildingId?: string;
  taskId?: string;
  data: any;
}

export interface NovaAnalysis {
  workerId: string;
  buildingId: string;
  weather?: {
    temperature: number;
    condition: string;
    description: string;
    icon: string;
    location: string;
    timestamp: string;
    humidity: number;
    windSpeed: number;
  };
  insights: NovaInsight[];
  recommendations: string[];
  alerts: string[];
  predictions: string[];
  optimizations: string[];
}

export interface NovaContext {
  workers: Array<{
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    hourlyRate: number;
    skills: string;
    isActive: boolean;
    address: string;
    shift: string;
    display_name: string;
    timezone: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    imageAssetName: string;
    numberOfUnits: number;
    yearBuilt: number;
    squareFootage: number;
    managementCompany: string;
    primaryContact: string;
    contactPhone: string;
    isActive: boolean;
    normalized_name: string;
    borough: string;
    compliance_score: number;
    client_id: string;
  }>;
  routines: Array<{
    id: string;
    title: string;
    description: string;
    building: string;
    buildingId: string;
    assignedWorker: string;
    workerId: string;
    category: string;
    skillLevel: string;
    recurrence: string;
    startHour: number;
    endHour: number;
    daysOfWeek: string;
    estimatedDuration: number;
    requiresPhoto: boolean;
  }>;
  weather?: {
    temperature: number;
    condition: string;
    description: string;
    icon: string;
    location: string;
    timestamp: string;
    humidity: number;
    windSpeed: number;
  };
  currentTime: Date;
  location?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface NovaPerformanceMetrics {
  workerId: string;
  completionRate: number;
  averageTaskTime: number;
  efficiency: number;
  streak: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface NovaRouteOptimization {
  workerId: string;
  workerName: string;
  totalTasks: number;
  totalDuration: number;
  estimatedCompletion: Date;
  route: Array<{
    id: string;
    title: string;
    description: string;
    building: string;
    buildingId: string;
    assignedWorker: string;
    workerId: string;
    category: string;
    skillLevel: string;
    recurrence: string;
    startHour: number;
    endHour: number;
    daysOfWeek: string;
    estimatedDuration: number;
    requiresPhoto: boolean;
    coordinates?: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address: string;
    };
    priority: number;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    dueDate?: Date;
  }>;
  efficiency: number;
  distance: number;
}

export interface NovaWeatherImpact {
  workerId: string;
  weatherCondition: string;
  affectedTasks: number;
  recommendations: string[];
  alerts: string[];
  impactLevel: 'low' | 'medium' | 'high';
}

export interface NovaComplianceAnalysis {
  workerId: string;
  photoComplianceRate: number;
  photoRequiredTasks: number;
  complianceScore: number;
  violations: number;
  warnings: number;
  recommendations: string[];
}

export interface NovaSkillAnalysis {
  workerId: string;
  skills: string[];
  skillUtilization: number;
  underutilizedSkills: string[];
  overutilizedSkills: string[];
  recommendations: string[];
}

export interface NovaTimeAnalysis {
  workerId: string;
  timeDistribution: { [hour: number]: number };
  peakHours: string[];
  efficiency: number;
  recommendations: string[];
}

export interface NovaBuildingAnalysis {
  buildingId: string;
  workerDistribution: { [workerId: string]: number };
  taskDistribution: { [category: string]: number };
  efficiency: number;
  recommendations: string[];
}

export interface NovaClientAnalysis {
  clientId: string;
  buildingCount: number;
  workerCount: number;
  totalTasks: number;
  completionRate: number;
  complianceScore: number;
  recommendations: string[];
  alerts: string[];
  predictions: string[];
}

export interface NovaSystemHealth {
  totalWorkers: number;
  activeWorkers: number;
  totalBuildings: number;
  activeBuildings: number;
  totalTasks: number;
  completedTasks: number;
  systemEfficiency: number;
  overallCompliance: number;
  criticalAlerts: number;
  recommendations: string[];
  systemStatus: 'healthy' | 'warning' | 'critical';
}

export interface NovaAPIConfig {
  onlineMode: boolean;
  cacheEnabled: boolean;
  realTimeUpdates: boolean;
  weatherIntegration: boolean;
  locationTracking: boolean;
  complianceMonitoring: boolean;
  performanceTracking: boolean;
  routeOptimization: boolean;
}

export interface NovaAPIService {
  analyzeWorkerPerformance(workerId: string): Promise<NovaAnalysis>;
  getInsights(workerId: string): Promise<NovaInsight[]>;
  getRecommendations(workerId: string): Promise<string[]>;
  getAlerts(workerId: string): Promise<string[]>;
  getPredictions(workerId: string): Promise<string[]>;
  getOptimizations(workerId: string): Promise<string[]>;
  setWeather(weather: any): void;
  setLocation(location: any): void;
  isOnlineMode(): boolean;
  setOnlineMode(online: boolean): void;
}

export interface NovaRouteManager {
  optimizeRoute(workerId: string, date: Date): Promise<NovaRouteOptimization>;
  getWorkerTasks(workerId: string, date: Date): Promise<any[]>;
  updateTaskStatus(taskId: string, status: string): Promise<void>;
  getBuildingCoordinates(buildingId: string): Promise<any>;
  calculateDistance(from: any, to: any): number;
}

export interface NovaDatabaseManager {
  getWorkers(): Promise<any[]>;
  getBuildings(): Promise<any[]>;
  getRoutines(): Promise<any[]>;
  getWorkerById(id: string): Promise<any>;
  getBuildingById(id: string): Promise<any>;
  getRoutinesByWorker(workerId: string): Promise<any[]>;
  getRoutinesByBuilding(buildingId: string): Promise<any[]>;
  updateTaskStatus(taskId: string, status: string): Promise<void>;
}
