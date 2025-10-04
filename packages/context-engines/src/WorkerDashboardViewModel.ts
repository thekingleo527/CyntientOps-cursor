/**
 * WorkerDashboardViewModel
 * 
 * Comprehensive ViewModel for Worker Dashboard functionality
 * Mirrors SwiftUI WorkerDashboardViewModel with real data hydration
 * Orchestrates all worker-specific data and UI state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, WorkerProfile, BuildingMetrics, ContextualTask, DashboardUpdate } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// MARK: - Supporting Types

export enum BuildingAccessType {
  ASSIGNED = 'assigned',
  COVERAGE = 'coverage',
  UNKNOWN = 'unknown'
}

// MARK: - Type Definitions for any types

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  location: string;
  timestamp: string;
  humidity: number;
  windSpeed: number;
  outdoorWorkRisk: string;
  weatherHint?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface HeroNextTask {
  id: string;
  title: string;
  description: string;
  buildingId: string;
  buildingName: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  dueTime?: Date;
  weatherImpact?: string;
}

export interface NovaInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'safety' | 'efficiency' | 'compliance' | 'weather' | 'route';
  confidence: number;
  actionable: boolean;
  timestamp: Date;
  workerId?: string;
  buildingId?: string;
  taskId?: string;
  data: Record<string, any>;
}

export interface BuildingPin {
  id: string;
  name: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  status: BuildingStatus;
}

export enum BuildingStatus {
  CURRENT = 'current',
  ASSIGNED = 'assigned',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable'
}

export enum NovaTab {
  PRIORITIES = 'Priorities',
  TASKS = 'Tasks',
  ANALYTICS = 'Analytics',
  CHAT = 'Chat',
  MAP = 'Map'
}

export interface WorkerDashboardUIState {
  isDarkMode: boolean;
  showWeatherStrip: boolean;
  compactMode: boolean;
}

export interface BuildingSummary {
  id: string;
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  status: BuildingStatus;
  todayTaskCount: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  buildingId?: string;
  dueDate?: Date;
  urgency: TaskUrgency;
  isCompleted: boolean;
  category: string;
  requiresPhoto: boolean;
}

export enum TaskUrgency {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export interface DaySchedule {
  date: Date;
  items: ScheduleItem[];
  totalHours: number;
}

export interface ScheduleItem {
  id: string;
  startTime: Date;
  endTime: Date;
  buildingId: string;
  title: string;
  taskCount: number;
}

export interface WorkerPerformance {
  efficiency: number;
  completedCount: number;
  averageTime: number;
  qualityScore: number;
  weeklyTrend: TrendDirection;
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export interface WorkerWeatherSnapshot {
  temperature: number;
  condition: string;
  guidance: string;
  isOutdoorSafe: boolean;
  timestamp: Date;
  buildingSpecificGuidance: string[];
}

export interface WorkerCapabilities {
  canUploadPhotos: boolean;
  canAddNotes: boolean;
  canViewMap: boolean;
  canAddEmergencyTasks: boolean;
  requiresPhotoForSanitation: boolean;
  simplifiedInterface: boolean;
}

export interface VendorAccessEntry {
  id: string;
  timestamp: Date;
  buildingId: string;
  buildingName: string;
  vendorName: string;
  vendorCompany: string;
  vendorType: VendorType;
  accessType: VendorAccessType;
  accessDetails: string;
  notes: string;
  photoEvidence?: string;
  signatureData?: string;
  workerId: string;
  workerName: string;
}

export enum VendorType {
  SPRINKLER_SERVICE = 'Sprinkler Service Tech',
  ELEVATOR_SERVICE = 'Elevator Service Tech',
  SPECTRUM_TECH = 'Spectrum Tech',
  ELECTRICIAN = 'Electrician',
  PLUMBER = 'Plumber',
  CONTRACTOR = 'Contractor',
  DOB_INSPECTOR = 'DOB Inspector',
  DEP_INSPECTOR = 'DEP Inspector',
  CON_ED = 'ConEd',
  EXTERMINATOR = 'Exterminator',
  ROOFER = 'Roofer',
  LOCKSMITH = 'Locksmith',
  LAUNDRY_SERVICE_TECH = 'Laundry Service Tech',
  ARCHITECT = 'Architect'
}

export enum VendorAccessType {
  SCHEDULED = 'Scheduled',
  EMERGENCY = 'Emergency',
  ROUTINE = 'Routine',
  INSPECTION = 'Inspection',
  REPAIR = 'Repair',
  INSTALLATION = 'Installation'
}

export enum VendorCategory {
  BUILDING = 'Building Systems',
  UTILITY = 'Utilities',
  MAINTENANCE = 'Maintenance & Repair',
  INSPECTION = 'Inspections',
  SERVICE = 'Services',
  PROFESSIONAL = 'Professional Services',
  OTHER = 'Other'
}

// MARK: - Daily Notes Types

export interface DailyNote {
  id: string;
  buildingId: string;
  buildingName: string;
  workerId: string;
  workerName: string;
  noteText: string;
  category: NoteCategory;
  timestamp: Date;
  photoEvidence?: string;
  location?: string;
}

export enum NoteCategory {
  GENERAL = 'General',
  MAINTENANCE = 'Maintenance Issue',
  SAFETY = 'Safety Concern',
  SUPPLY = 'Supply Need',
  TENANT = 'Tenant Issue',
  OBSERVATION = 'Observation',
  REPAIR = 'Repair Required',
  CLEANING = 'Cleaning Note'
}

// MARK: - Inventory Integration Types

export interface SupplyRequest {
  id: string;
  requestNumber: string;
  buildingId: string;
  buildingName: string;
  requestedBy: string;
  requesterName: string;
  items: RequestedItem[];
  priority: SupplyPriority;
  status: SupplyStatus;
  notes: string;
  totalCost: number;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface RequestedItem {
  itemId: string;
  itemName: string;
  quantityRequested: number;
  quantityApproved?: number;
  unitCost: number;
  notes?: string;
}

export enum SupplyPriority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum SupplyStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  ORDERED = 'Ordered',
  RECEIVED = 'Received',
  REJECTED = 'Rejected'
}

export interface InventoryUsageRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usedAt: Date;
  workerId: string;
  workerName: string;
  buildingId: string;
  buildingName: string;
  taskId?: string;
  notes?: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  buildingId: string;
  buildingName: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  category: string;
  alertedAt: Date;
  isResolved: boolean;
}

// MARK: - Building-Specific Weather Guidance

export enum WeatherCondition {
  RAIN = 'rain',
  SNOW = 'snow',
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  STORM = 'storm'
}

export interface BuildingWeatherGuidance {
  buildingId: string;
  buildingName: string;
  tasks: string[];
  priority: TaskPriority;
}

export enum TaskPriority {
  IMMEDIATE = 'immediate',
  BEFORE_WEATHER = 'beforeWeather',
  AFTER_WEATHER = 'afterWeather',
  ROUTINE = 'routine'
}

// MARK: - Main ViewModel Hook

export interface WorkerDashboardViewModelState {
  // User Context
  userRole: UserRole;
  workerProfile?: WorkerProfile;
  workerCapabilities?: WorkerCapabilities;
  isLoading: boolean;
  errorMessage?: string;
  
  // Dashboard State
  selectedTab: NovaTab;
  uiState: WorkerDashboardUIState;
  
  // Building Data
  assignedBuildings: BuildingSummary[];
  allBuildings: BuildingSummary[]; // For coverage purposes
  currentBuilding?: BuildingSummary;
  buildingPins: BuildingPin[];
  
  // Task Data
  todaysTasks: TaskItem[];
  upcomingTasks: TaskItem[];
  completedTasks: TaskItem[];
  urgentTasks: TaskItem[];
  
  // Schedule Data
  todaysSchedule: DaySchedule;
  weeklySchedule: DaySchedule[];
  
  // Performance Data
  performance: WorkerPerformance;
  
  // Weather Data
  weatherSnapshot: WorkerWeatherSnapshot;
  weatherData?: WeatherData;
  outdoorWorkRisk: string;
  
  // Vendor Access
  recentVendorAccess: VendorAccessEntry[];
  showingVendorAccessLog: boolean;
  isLoggingVendorAccess: boolean;
  
  // Daily Notes
  dailyNotes: Record<string, DailyNote[]>; // BuildingId -> Notes
  todayNotes: DailyNote[];
  showingAddNote: boolean;
  isAddingNote: boolean;
  
  // Inventory Integration
  pendingSupplyRequests: SupplyRequest[];
  recentInventoryUsage: InventoryUsageRecord[];
  showingInventoryRequest: boolean;
  lowStockAlerts: LowStockAlert[];
  isCreatingSupplyRequest: boolean;
  
  // Clock In/Out State
  isClockedIn: boolean;
  clockInTime?: Date;
  clockInLocation?: LocationData;
  hoursWorkedToday: number;
  
  // Performance Metrics
  completionRate: number;
  todaysEfficiency: number;
  weeklyPerformance: TrendDirection;
  
  // Dashboard Sync
  dashboardSyncStatus: string;
  
  // Hero Tile Properties
  heroNextTask?: HeroNextTask;
  weatherHint?: string;
  buildingsForMap: BuildingPin[];
  mapRegion: MapRegion;
  
  // Intelligence Panel
  intelligencePanelExpanded: boolean;
  currentInsights: NovaInsight[];
  
  // Real-time Updates
  dashboardUpdates: DashboardUpdate[];
  lastUpdateTime: Date;
}

export interface WorkerDashboardViewModelActions {
  // Navigation
  selectTab: (tab: NovaTab) => void;
  selectBuilding: (buildingId: string) => void;
  
  // Data Loading
  loadDashboardData: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadInitialData: () => Promise<void>;
  
  // Task Management
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, evidence?: Record<string, any>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  getPhotoRequirement: (taskId: string) => boolean;
  createPhotoEvidenceForTask: (taskId: string, photoURLs: string[]) => Record<string, any>;
  
  // Building Management
  clockIn: (buildingId: string, location?: LocationData) => Promise<boolean>;
  clockOut: () => Promise<boolean>;
  reportIssue: (building?: BuildingSummary) => void;
  emergencyCall: () => void;
  
  // Vendor Access
  logVendorAccess: (entry: Omit<VendorAccessEntry, 'id' | 'timestamp'>) => Promise<void>;
  showVendorAccessLog: () => void;
  hideVendorAccessLog: () => void;
  
  // Daily Notes
  addDailyNote: (note: Omit<DailyNote, 'id' | 'timestamp'>) => Promise<void>;
  showAddNote: () => void;
  hideAddNote: () => void;
  loadDailyNotes: (buildingId: string) => Promise<void>;
  
  // Inventory Management
  createSupplyRequest: (request: Omit<SupplyRequest, 'id' | 'createdAt'>) => Promise<void>;
  showInventoryRequest: () => void;
  hideInventoryRequest: () => void;
  loadInventoryData: (buildingId: string) => Promise<void>;
  loadLowStockAlerts: (buildingId: string) => Promise<void>;
  
  // Weather Management
  loadWeatherForBuilding: (building: BuildingSummary) => Promise<void>;
  getBuildingWeatherGuidance: (buildingId: string) => Promise<BuildingWeatherGuidance[]>;
  
  // Performance & Analytics
  calculateMetrics: () => Promise<void>;
  calculateHoursWorkedToday: () => Promise<void>;
  updateHeroTileProperties: () => Promise<void>;
  
  // Intelligence Panel
  toggleIntelligencePanel: () => void;
  loadIntelligenceInsights: () => Promise<void>;
  
  // Map Management
  updateMapRegion: () => void;
  setMapRegion: (region: MapRegion) => void;
  
  // UI State
  toggleCompactMode: () => void;
  toggleWeatherStrip: () => void;
  setDarkMode: (enabled: boolean) => void;
  setHeroExpanded: (expanded: boolean) => void;
}

// Class-based implementation for getInstance compatibility
export class WorkerDashboardViewModel {
  private static instance: WorkerDashboardViewModel | null = null;
  private container: ServiceContainer;
  private workerId: string;

  private constructor(container: ServiceContainer, workerId: string) {
    this.container = container;
    this.workerId = workerId;
  }

  public static getInstance(container: ServiceContainer, workerId: string): WorkerDashboardViewModel {
    if (!WorkerDashboardViewModel.instance) {
      WorkerDashboardViewModel.instance = new WorkerDashboardViewModel(container, workerId);
    }
    return WorkerDashboardViewModel.instance;
  }

  // Delegate to the hook implementation
  public getViewModel() {
    return useWorkerDashboardViewModel(this.container, this.workerId);
  }

  // Required methods for WorkerDashboardScreen compatibility
  public async initialize(workerId: string): Promise<void> {
    try {
      // Initialize worker data and state (mirrors SwiftUI loadInitialData)
      this.workerId = workerId;
      
      console.log(`🔄 WorkerDashboardVM: Loading initial data for worker ${workerId}`);

      // Load worker profile
      const worker = await this.container.workers.getWorkerById(workerId);
      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Load context and sync state (mirrors SwiftUI container.workerContext.loadContext)
      try {
        await this.container.workerContext?.loadContext?.(workerId);
        await this.syncStateFromContextEngine();
      } catch (contextError) {
        console.warn('Context loading failed, continuing with basic initialization:', contextError);
      }

      // Load core data (mirrors SwiftUI loadTodaysTasks, loadAssignedBuildings, etc.)
      const [buildings, tasks, weatherData, clockInStatus] = await Promise.all([
        this.loadAssignedBuildings(),
        this.loadTodaysTasks(),
        this.loadWeatherData(),
        this.loadClockInStatus(workerId)
      ]);
      
      // Initialize state
      this.setState({
        userRole: worker.role as any,
        assignedBuildings: buildings,
        tasks: tasks,
        weatherData: weatherData,
        isClockedIn: clockInStatus.isClockedIn,
        clockInTime: clockInStatus.clockInTime,
        currentBuilding: clockInStatus.currentBuilding,
        isLoading: false,
        lastUpdateTime: new Date()
      });

      // Calculate metrics (mirrors SwiftUI calculateMetrics)
      await this.calculateMetrics();
      await this.loadBuildingMetrics();
      await this.calculateHoursWorkedToday();

      console.log(`✅ WorkerDashboardVM: Initial data loaded - tasks: ${tasks.length}, buildings: ${buildings.length}`);
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      throw error;
    }
  }

  public async clockIn(buildingId: string, location: { latitude: number; longitude: number; accuracy: number }): Promise<boolean> {
    try {
      if (!this.workerId) {
        throw new Error('No worker ID available for clock in');
      }

      // Get building information (mirrors SwiftUI CoreTypes.NamedCoordinate)
      const building = this.state.assignedBuildings.find(b => b.id === buildingId);
      if (!building) {
        throw new Error('Building not found in assigned buildings');
      }

      // Use ClockInService wrapper (mirrors SwiftUI container.clockIn.clockIn)
      await this.container.clockIn.clockIn(this.workerId, buildingId);
      
      // Update state (mirrors SwiftUI updateClockInState)
      this.setState({
        isClockedIn: true,
        clockInTime: new Date(),
        clockInLocation: location,
        currentBuilding: buildingId
      });
      
      // Load weather and tasks for the building (mirrors SwiftUI loadWeatherData, loadBuildingTasks)
      await Promise.all([
        this.loadWeatherDataForBuilding(building),
        this.loadBuildingTasks(this.workerId, buildingId)
      ]);
      
      // Broadcast update (mirrors SwiftUI broadcastClockIn)
      this.broadcastClockIn(this.workerId, building, location);
      
      console.log(`✅ Clocked in at ${building.name}`);
      return true;
    } catch (error) {
      console.error('Clock in failed:', error);
      return false;
    }
  }

  public async clockOut(): Promise<boolean> {
    try {
      if (!this.workerId || !this.state.isClockedIn || !this.state.currentBuilding) {
        throw new Error('Worker is not currently clocked in');
      }

      const building = this.state.assignedBuildings.find(b => b.id === this.state.currentBuilding);
      if (!building) {
        throw new Error('Current building not found');
      }

      // Calculate session summary (mirrors SwiftUI calculateSessionSummary)
      const sessionSummary = this.calculateSessionSummary(building);
      
      // Use ClockInService wrapper (mirrors SwiftUI container.clockIn.clockOut)
      await this.container.clockIn.clockOut(this.workerId);
      
      // Reset state (mirrors SwiftUI resetClockInState)
      this.setState({
        isClockedIn: false,
        clockInTime: undefined,
        clockInLocation: undefined,
        currentBuilding: null,
        hoursWorkedToday: sessionSummary.hoursWorked
      });
      
      // Broadcast summary (mirrors SwiftUI broadcastClockOut)
      this.broadcastClockOut(this.workerId, building, sessionSummary);
      
      console.log(`✅ Clocked out from ${building.name}`);
      return true;
    } catch (error) {
      console.error('Clock out failed:', error);
      return false;
    }
  }

  public async updateTaskStatus(taskId: string, status: string): Promise<boolean> {
    try {
      // Validate task ownership
      const task = await this.container.tasks.getTaskById(taskId);
      if (!task || task.assignedWorkerId !== this.workerId) {
        throw new Error('Task not found or not assigned to this worker');
      }

      // Update task status
      const updateResult = await this.container.tasks.updateTaskStatus(taskId, status);
      
      if (updateResult.success) {
        // Update local state
        const updatedTasks = this.state.tasks.map(t => 
          t.id === taskId ? { ...t, status } : t
        );
        
        this.setState({ tasks: updatedTasks });
        
        console.log(`Task ${taskId} status updated to ${status}`);
        return true;
    }
      
      return false;
    } catch (error) {
      console.error('Task status update failed:', error);
      return false;
    }
  }

  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Mark notification as read
      await this.container.notifications.markAsRead(notificationId);
      
      // Update local state
      const updatedNotifications = this.state.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      
      this.setState({ notifications: updatedNotifications });
      
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  public getState() {
    // Return a basic state object for now
    return {
  // userRole: 'worker' as any,
      isLoading: false,
      selectedTab: 'Priorities' as any,
      uiState: {
        isDarkMode: true,
        showWeatherStrip: true,
        compactMode: false
      },
      assignedBuildings: [],
      allBuildings: [],
      currentBuilding: null,
      tasks: [],
      notifications: [],
      dashboardUpdates: [],
      lastUpdateTime: new Date(),
      completionRate: 0,
      hasUrgentTasks: false
    };
  }

  // MARK: - Helper Methods (mirrors SwiftUI implementation)

  private async syncStateFromContextEngine(): Promise<void> {
    // Sync state from context engine (mirrors SwiftUI syncStateFromContextEngine)
    try {
      // Implementation would sync state from the context engine
      console.log('Syncing state from context engine');
    } catch (error) {
      console.warn('Failed to sync state from context engine:', error);
    }
  }

  private async loadAssignedBuildings(): Promise<any[]> {
    // Load assigned buildings (mirrors SwiftUI loadAssignedBuildings)
    try {
      return await this.container.buildings.getBuildingsByWorkerId(this.workerId);
    } catch (error) {
      console.error('Failed to load assigned buildings:', error);
      return [];
    }
  }

  private async loadTodaysTasks(): Promise<any[]> {
    // Load today's tasks (mirrors SwiftUI loadTodaysTasks)
    try {
      return await this.container.tasks.getTasksForWorker(this.workerId, new Date());
    } catch (error) {
      console.error('Failed to load today\'s tasks:', error);
      return [];
    }
  }

  private async loadWeatherData(): Promise<WeatherData | null> {
    // Load weather data (mirrors SwiftUI loadWeatherData)
    try {
      // Implementation would load weather data
      return null;
    } catch (error) {
      console.error('Failed to load weather data:', error);
      return null;
    }
  }

  private async loadClockInStatus(workerId: string): Promise<{isClockedIn: boolean, clockInTime?: Date, currentBuilding?: string}> {
    // Load clock in status (mirrors SwiftUI loadClockInStatus)
    try {
      const status = await this.container.clockIn.getClockInStatus(workerId);
      return {
  // isClockedIn: status.isClockedIn,
        clockInTime: status.clockInTime,
        currentBuilding: status.buildingId
      };
    } catch (error) {
      console.error('Failed to load clock in status:', error);
      return { isClockedIn: false };
    }
  }

  private async calculateMetrics(): Promise<void> {
    // Calculate metrics (mirrors SwiftUI calculateMetrics)
    try {
      // Implementation would calculate various metrics
      console.log('Calculating metrics');
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
    }
  }

  private async loadBuildingMetrics(): Promise<void> {
    // Load building metrics (mirrors SwiftUI loadBuildingMetrics)
    try {
      // Implementation would load building metrics
      console.log('Loading building metrics');
    } catch (error) {
      console.error('Failed to load building metrics:', error);
    }
  }

  private async calculateHoursWorkedToday(): Promise<void> {
    // Calculate hours worked today (mirrors SwiftUI calculateHoursWorkedToday)
    try {
      // Implementation would calculate hours worked
      console.log('Calculating hours worked today');
    } catch (error) {
      console.error('Failed to calculate hours worked:', error);
    }
  }

  private async loadWeatherDataForBuilding(building: any): Promise<void> {
    // Load weather data for specific building (mirrors SwiftUI loadWeatherData)
    try {
      // Implementation would load weather data for the building
      console.log(`Loading weather data for building ${building.name}`);
    } catch (error) {
      console.error('Failed to load weather data for building:', error);
    }
  }

  private async loadBuildingTasks(workerId: string, buildingId: string): Promise<void> {
    // Load building tasks (mirrors SwiftUI loadBuildingTasks)
    try {
      const tasks = await this.container.tasks.getTasksForWorkerAndBuilding(workerId, buildingId);
      // Update state with building-specific tasks
      console.log(`Loaded ${tasks.length} tasks for building ${buildingId}`);
    } catch (error) {
      console.error('Failed to load building tasks:', error);
    }
  }

  private calculateSessionSummary(building: any): {hoursWorked: number, tasksCompleted: number} {
    // Calculate session summary (mirrors SwiftUI calculateSessionSummary)
    const clockInTime = this.state.clockInTime;
    const now = new Date();
    const hoursWorked = clockInTime ? (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) : 0;
    
    return {
  // hoursWorked: Math.round(hoursWorked * 100) / 100,
      tasksCompleted: this.state.tasks.filter(t => t.isCompleted).length
    };
  }

  private broadcastClockIn(workerId: string, building: any, location: LocationData): void {
    // Broadcast clock in (mirrors SwiftUI broadcastClockIn)
    try {
      // Implementation would broadcast clock in event
      console.log(`Broadcasting clock in for worker ${workerId} at ${building.name}`);
    } catch (error) {
      console.error('Failed to broadcast clock in:', error);
    }
  }

  private broadcastClockOut(workerId: string, building: any, summary: any): void {
    // Broadcast clock out (mirrors SwiftUI broadcastClockOut)
    try {
      // Implementation would broadcast clock out event
      console.log(`Broadcasting clock out for worker ${workerId} from ${building.name}`);
    } catch (error) {
      console.error('Failed to broadcast clock out:', error);
    }
  }
}

export function useWorkerDashboardViewModel(
  container: ServiceContainer,
  workerId: string
): WorkerDashboardViewModelState & WorkerDashboardViewModelActions {
  
  // MARK: - State Management
  
  const [state, setState] = useState<WorkerDashboardViewModelState>({
    userRole: UserRole.WORKER,
    isLoading: true,
    selectedTab: NovaTab.PRIORITIES,
    uiState: {
      isDarkMode: true,
      showWeatherStrip: true,
      compactMode: false
    },
    assignedBuildings: [],
    allBuildings: [],
    buildingPins: [],
    todaysTasks: [],
    upcomingTasks: [],
    completedTasks: [],
    urgentTasks: [],
    todaysSchedule: {
      date: new Date(),
      items: [],
      totalHours: 0
    },
    weeklySchedule: [],
    performance: {
      efficiency: 0,
      completedCount: 0,
      averageTime: 0,
      qualityScore: 0,
      weeklyTrend: TrendDirection.STABLE
    },
    weatherSnapshot: {
      temperature: 0,
      condition: 'Unknown',
      guidance: 'Loading weather data...',
      isOutdoorSafe: true,
      timestamp: new Date(),
      buildingSpecificGuidance: []
    },
    weatherData: undefined,
    outdoorWorkRisk: 'low',
    recentVendorAccess: [],
    showingVendorAccessLog: false,
    isLoggingVendorAccess: false,
    dailyNotes: {},
    todayNotes: [],
    showingAddNote: false,
    isAddingNote: false,
    pendingSupplyRequests: [],
    recentInventoryUsage: [],
    showingInventoryRequest: false,
    lowStockAlerts: [],
    isCreatingSupplyRequest: false,
    isClockedIn: false,
    clockInTime: undefined,
    clockInLocation: undefined,
    hoursWorkedToday: 0,
    completionRate: 0,
    todaysEfficiency: 0,
    weeklyPerformance: TrendDirection.STABLE,
    dashboardSyncStatus: 'synced',
    heroNextTask: undefined,
    weatherHint: undefined,
    buildingsForMap: [],
    mapRegion: {
      center: { latitude: 40.7580, longitude: -73.9855 },
      span: { latitudeDelta: 0.01, longitudeDelta: 0.01 }
    },
    intelligencePanelExpanded: false,
    currentInsights: [],
    dashboardUpdates: [],
    lastUpdateTime: new Date()
  });

  // MARK: - Computed Properties
  
  const currentBuilding = useMemo(() => {
    return state.assignedBuildings.find(b => b.status === BuildingStatus.CURRENT);
    }, [state.assignedBuildings]);

  const hasUrgentTasks = useMemo(() => {
    return state.urgentTasks.length > 0;
    }, [state.urgentTasks]);

  const completionRate = useMemo(() => {
    const total = state.todaysTasks.length;
    const completed = state.completedTasks.length;
    return total > 0 ? (completed / total) * 100 : 0;
    }, [state.todaysTasks.length, state.completedTasks.length]);

  // MARK: - Data Loading Methods
  
  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      // Load worker profile and capabilities
      const [workerProfile, capabilities] = await Promise.all([
        container.workers.getWorkerProfile(workerId),
        loadWorkerCapabilities(workerId)
      ]);

      // Load assigned buildings
      const assignedBuildings = await loadAssignedBuildings(workerId);
      
      // Load today's tasks
      const todaysTasks = await loadTodaysTasks(workerId);
      
      // Load schedule data
      const todaysSchedule = await loadTodaysSchedule(workerId);
      
      // Load performance data
      const performance = await loadWorkerPerformance(workerId);
      
      // Load weather data
      const weatherSnapshot = await loadWeatherData(assignedBuildings);
      
      // Load vendor access data
      const recentVendorAccess = await loadRecentVendorAccess(workerId);

      setState(prev => ({
        ...prev,
        workerProfile,
        workerCapabilities: capabilities,
        assignedBuildings,
        buildingPins: assignedBuildings.map(building => ({
          id: building.id,
          name: building.name,
          coordinate: building.coordinate,
          status: building.status
        })),
        todaysTasks,
        upcomingTasks: todaysTasks.filter(task => !task.isCompleted && task.urgency === TaskUrgency.HIGH),
        completedTasks: todaysTasks.filter(task => task.isCompleted),
        urgentTasks: todaysTasks.filter(task => 
          !task.isCompleted && 
          (task.urgency === TaskUrgency.URGENT || task.urgency === TaskUrgency.CRITICAL || task.urgency === TaskUrgency.EMERGENCY)
        ),
        todaysSchedule,
        performance,
        weatherSnapshot,
        recentVendorAccess,
        isLoading: false,
        lastUpdateTime: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load dashboard data',
        isLoading: false
      }));
    }
  }, [container, workerId]);

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  // MARK: - Task Management Methods
  
  const startTask = useCallback(async (taskId: string) => {
    try {
      await container.tasks.startTask(taskId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        todaysTasks: prev.todaysTasks.map(task =>
          task.id === taskId ? { ...task, isCompleted: false } : task
        )
      }));
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'taskStarted',
        buildingId: currentBuilding?.id || '',
        workerId,
        data: { taskId, timestamp: new Date().toISOString() }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to start task'
      }));
    }
  }, [container, workerId, currentBuilding]);

  const completeTask = useCallback(async (taskId: string, evidence?: Record<string, any>) => {
    try {
      await container.tasks.completeTask(taskId, evidence);
      
      // Update local state
      setState(prev => ({
        ...prev,
        todaysTasks: prev.todaysTasks.map(task =>
          task.id === taskId ? { ...task, isCompleted: true } : task
        ),
        completedTasks: prev.todaysTasks.filter(task => task.id === taskId || task.isCompleted),
        urgentTasks: prev.urgentTasks.filter(task => task.id !== taskId)
      }));
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'taskCompleted',
        buildingId: currentBuilding?.id || '',
        workerId,
        data: { taskId, timestamp: new Date().toISOString() }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to complete task'
      }));
    }
  }, [container, workerId, currentBuilding]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      await container.tasks.updateTaskStatus(taskId, status);
      
      // Update local state
      setState(prev => ({
        ...prev,
        todaysTasks: prev.todaysTasks.map(task =>
          task.id === taskId ? { ...task, isCompleted: status === 'completed' } : task
        )
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to update task status'
      }));
    }
  }, [container]);

  // MARK: - Building Management Methods
  

  const clockIn = useCallback(async (buildingId: string, manualLocation?: { latitude: number; longitude: number; accuracy?: number }) => {
    try {
      const building = container.buildings.getBuildingById(buildingId);
      if (!building) {
        throw new Error('Building not found');
      }

      const latestLocation = manualLocation ?? container.location.getCurrentLocation(workerId);
      const clockInTimestamp = new Date();
      const latitude = latestLocation?.latitude ?? building.latitude ?? 0;
      const longitude = latestLocation?.longitude ?? building.longitude ?? 0;
      const accuracy = latestLocation?.accuracy ?? 25;

      const result = await container.clockIn.clockInWorker({
        workerId,
        buildingId,
        latitude,
        longitude,
        accuracy,
        timestamp: clockInTimestamp
      });

      if (!result.success) {
        const validationMessage = result.validation?.errors?.join(', ') || 'Clock in failed';
        throw new Error(validationMessage);
      }

      setState(prev => ({
        ...prev,
        isClockedIn: true,
        clockInTime: clockInTimestamp,
        clockInLocation: { latitude, longitude, accuracy, timestamp: clockInTimestamp },
        assignedBuildings: prev.assignedBuildings.map(building =>
          building.id === buildingId
            ? { ...building, status: BuildingStatus.CURRENT }
            : { ...building, status: BuildingStatus.ASSIGNED }
        )
      }));

      const update: DashboardUpdate = {
        source: 'worker',
        type: 'workerClockedIn',
        buildingId,
        workerId,
        data: { timestamp: clockInTimestamp.toISOString() }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to clock in'
      }));
      return false;
    }
  }, [container, workerId]);

  const clockOut = useCallback(async () => {
    try {
      const clockOutTimestamp = new Date();
      const result = await container.clockIn.clockOutWorker({
        workerId,
        timestamp: clockOutTimestamp
      });

      if (!result.success) {
        throw new Error('Clock out failed');
      }

      const sessionBuildingId = result.session?.buildingId ?? currentBuilding?.id ?? null;

      setState(prev => ({
        ...prev,
        isClockedIn: false,
        clockInTime: undefined,
        clockInLocation: undefined,
        assignedBuildings: sessionBuildingId
          ? prev.assignedBuildings.map(building =>
              building.id === sessionBuildingId
                ? { ...building, status: BuildingStatus.ASSIGNED }
                : building
            )
          : prev.assignedBuildings
      }));

      if (sessionBuildingId) {
        const update: DashboardUpdate = {
          source: 'worker',
          type: 'workerClockedOut',
          buildingId: sessionBuildingId,
          workerId,
          data: { timestamp: clockOutTimestamp.toISOString() }
        };
        container.dashboardSync.broadcastWorkerUpdate(update);
      }

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to clock out'
      }));
      return false;
    }
  }, [container, workerId, currentBuilding]);

  // MARK: - Vendor Access Methods
  
  const logVendorAccess = useCallback(async (entry: Omit<VendorAccessEntry, 'id' | 'timestamp'>) => {
    try {
      const vendorEntry: VendorAccessEntry = {
        ...entry,
        id: `vendor_${Date.now()}`,
        timestamp: new Date()
      };
      
      // Save to database
      await container.vendorAccess.logAccess(vendorEntry);
      
      // Update local state
      setState(prev => ({
        ...prev,
        recentVendorAccess: [vendorEntry, ...prev.recentVendorAccess].slice(0, 10)
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to log vendor access'
      }));
    }
  }, [container]);

  // MARK: - UI State Methods
  
  const selectTab = useCallback((tab: NovaTab) => {
    setState(prev => ({ ...prev, selectedTab: tab }));
  }, []);

  const selectBuilding = useCallback((buildingId: string) => {
    setState(prev => ({
      ...prev,
      assignedBuildings: prev.assignedBuildings.map(building =>
        building.id === buildingId 
          ? { ...building, status: BuildingStatus.CURRENT }
          : { ...building, status: BuildingStatus.ASSIGNED }
      )
    }));
  }, []);

  const toggleCompactMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, compactMode: !prev.uiState.compactMode }
    }));
  }, []);

  const toggleWeatherStrip = useCallback(() => {
    setState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, showWeatherStrip: !prev.uiState.showWeatherStrip }
    }));
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, isDarkMode: enabled }
    }));
  }, []);

  const setHeroExpanded = useCallback((expanded: boolean) => {
    setState(prev => ({ ...prev, heroExpanded: expanded }));
  }, []);

  // MARK: - Additional Methods from SwiftUI Implementation

  const loadInitialData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    try {
      const task = state.todaysTasks.find(t => t.id === taskId);
      if (!task) return;
  // const newStatus = !task.isCompleted;
      await container.tasks.updateTaskStatus(taskId, newStatus ? 'completed' : 'pending');
      
      setState(prev => ({
        ...prev,
        todaysTasks: prev.todaysTasks.map(t =>
          t.id === taskId ? { ...t, isCompleted: newStatus } : t
        )
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to toggle task completion'
      }));
    }
  }, [container, state.todaysTasks]);

  const getPhotoRequirement = useCallback((taskId: string): boolean => {
    const task = state.todaysTasks.find(t => t.id === taskId);
    return task?.requiresPhoto ?? false;
    }, [state.todaysTasks]);

  const createPhotoEvidenceForTask = useCallback((taskId: string, photoURLs: string[]) => {
    const task = state.todaysTasks.find(t => t.id === taskId);
    const description = task?.title.includes('Roof Drain') && task?.title.includes('2F')
      ? 'Roof drain maintenance completed - 2F Terrace at Rubin Museum'
      : `Task completed with photo verification: ${task?.title ?? 'Task'}`;
    
    return {
  // description,
      photoURLs,
      timestamp: new Date()
    };
  }, [state.todaysTasks]);

  const reportIssue = useCallback((building?: BuildingSummary) => {
    // Implementation for reporting issues
    console.log('Reporting issue for building:', building?.name);
  }, []);

  const emergencyCall = useCallback(() => {
    // Implementation for emergency calls
    console.log('Emergency call initiated');
  }, []);

  const showVendorAccessLog = useCallback(() => {
    setState(prev => ({ ...prev, showingVendorAccessLog: true }));
  }, []);

  const hideVendorAccessLog = useCallback(() => {
    setState(prev => ({ ...prev, showingVendorAccessLog: false }));
  }, []);

  const addDailyNote = useCallback(async (note: Omit<DailyNote, 'id' | 'timestamp'>) => {
    try {
      const newNote: DailyNote = {
        ...note,
        id: `note_${Date.now()}`,
        timestamp: new Date()
      };
      
      await container.notes.addDailyNote(newNote);
      
      setState(prev => ({
        ...prev,
        dailyNotes: {
          ...prev.dailyNotes,
          [note.buildingId]: [newNote, ...(prev.dailyNotes[note.buildingId] || [])]
        },
        todayNotes: [newNote, ...prev.todayNotes]
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to add daily note'
      }));
    }
  }, [container]);

  const showAddNote = useCallback(() => {
    setState(prev => ({ ...prev, showingAddNote: true }));
  }, []);

  const hideAddNote = useCallback(() => {
    setState(prev => ({ ...prev, showingAddNote: false }));
  }, []);

  const loadDailyNotes = useCallback(async (buildingId: string) => {
    try {
      const notes = await container.notes.getDailyNotes(buildingId);
      setState(prev => ({
        ...prev,
        dailyNotes: {
          ...prev.dailyNotes,
          [buildingId]: notes
        }
      }));
    } catch (error) {
      console.error('Failed to load daily notes:', error);
    }
  }, [container]);

  const createSupplyRequest = useCallback(async (request: Omit<SupplyRequest, 'id' | 'createdAt'>) => {
    try {
      const newRequest: SupplyRequest = {
        ...request,
        id: `request_${Date.now()}`,
        createdAt: new Date()
      };
      
      await container.inventory.createSupplyRequest(newRequest);
      
      setState(prev => ({
        ...prev,
        pendingSupplyRequests: [newRequest, ...prev.pendingSupplyRequests]
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to create supply request'
      }));
    }
  }, [container]);

  const showInventoryRequest = useCallback(() => {
    setState(prev => ({ ...prev, showingInventoryRequest: true }));
  }, []);

  const hideInventoryRequest = useCallback(() => {
    setState(prev => ({ ...prev, showingInventoryRequest: false }));
  }, []);

  const loadInventoryData = useCallback(async (buildingId: string) => {
    try {
      const [usage, alerts] = await Promise.all([
        container.inventory.getInventoryUsage(buildingId),
        container.inventory.getLowStockAlerts(buildingId)
      ]);
      
      setState(prev => ({
        ...prev,
        recentInventoryUsage: usage,
        lowStockAlerts: alerts
      }));
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    }
  }, [container]);

  const loadLowStockAlerts = useCallback(async (buildingId: string) => {
    try {
      const alerts = await container.inventory.getLowStockAlerts(buildingId);
      setState(prev => ({ ...prev, lowStockAlerts: alerts }));
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    }
  }, [container]);

  const loadWeatherForBuilding = useCallback(async (building: BuildingSummary) => {
    try {
      const weather = await container.weather.getWeatherForBuilding(building.id);
      setState(prev => ({
        ...prev,
        weatherData: weather,
        outdoorWorkRisk: weather.outdoorWorkRisk || 'low'
      }));
    } catch (error) {
      console.error('Failed to load weather for building:', error);
    }
  }, [container]);

  const getBuildingWeatherGuidance = useCallback(async (buildingId: string): Promise<BuildingWeatherGuidance[]> => {
    try {
      return await container.weather.getBuildingWeatherGuidance(buildingId);
    } catch (error) {
      console.error('Failed to get building weather guidance:', error);
      return [];
    }
  }, [container]);

  const calculateMetrics = useCallback(async () => {
    const totalTasks = state.todaysTasks.length;
    const completedTasks = state.completedTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    setState(prev => ({
      ...prev,
      completionRate,
      todaysEfficiency: completionRate // Simplified for now
    }));
  }, [state.todaysTasks.length, state.completedTasks.length]);

  const calculateHoursWorkedToday = useCallback(async () => {
    if (state.clockInTime) {
      const hoursWorked = (Date.now() - state.clockInTime.getTime()) / (1000 * 60 * 60);
      setState(prev => ({ ...prev, hoursWorkedToday: hoursWorked }));
    }
  }, [state.clockInTime]);

  const updateHeroTileProperties = useCallback(async () => {
    const nextTask = state.todaysTasks
      .filter(task => !task.isCompleted)
      .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))[0];
    
    setState(prev => ({
      ...prev,
      heroNextTask: nextTask,
      weatherHint: prev.weatherSnapshot.guidance
    }));
  }, [state.todaysTasks, state.weatherSnapshot.guidance]);

  const toggleIntelligencePanel = useCallback(() => {
    setState(prev => ({ ...prev, intelligencePanelExpanded: !prev.intelligencePanelExpanded }));
  }, []);

  const loadIntelligenceInsights = useCallback(async () => {
    try {
      const insights = await container.intelligence.getWorkerInsights(workerId);
      setState(prev => ({ ...prev, currentInsights: insights }));
    } catch (error) {
      console.error('Failed to load intelligence insights:', error);
    }
  }, [container, workerId]);

  const updateMapRegion = useCallback(() => {
    if (state.assignedBuildings.length === 0) return;
  // const coordinates = state.assignedBuildings.map(b => b.coordinate);
    const minLat = Math.min(...coordinates.map(c => c.latitude));
    const maxLat = Math.max(...coordinates.map(c => c.latitude));
    const minLon = Math.min(...coordinates.map(c => c.longitude));
    const maxLon = Math.max(...coordinates.map(c => c.longitude));
    
    const center = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2
    };
    
    const span = {
      latitudeDelta: Math.max(0.008, (maxLat - minLat) * 1.3),
      longitudeDelta: Math.max(0.008, (maxLon - minLon) * 1.3)
    };
    
    setState(prev => ({
      ...prev,
      mapRegion: { center, span }
    }));
  }, [state.assignedBuildings]);

  const setMapRegion = useCallback((region: MapRegion) => {
    setState(prev => ({ ...prev, mapRegion: region }));
  }, []);

  // MARK: - Helper Methods
  
  const loadWorkerCapabilities = async (workerId: string): Promise<WorkerCapabilities> => {
    try {
      const capabilities = await container.workers.getWorkerCapabilities(workerId);
      return capabilities;
    } catch (error) {
      // Return default capabilities
      return {
  // canUploadPhotos: true,
        canAddNotes: true,
        canViewMap: true,
        canAddEmergencyTasks: false,
        requiresPhotoForSanitation: true,
        simplifiedInterface: false
      };
    }
  };

  const loadAssignedBuildings = async (workerId: string): Promise<BuildingSummary[]> => {
    try {
      const buildings = await container.workers.getAssignedBuildings(workerId);
      return buildings.map(building => ({
  // id: building.id,
        name: building.name,
        address: building.address,
        coordinate: {
          latitude: building.latitude,
          longitude: building.longitude
        },
        status: BuildingStatus.ASSIGNED,
        todayTaskCount: 0 // Will be updated when tasks are loaded
      }));
    } catch (error) {
      console.error('Failed to load assigned buildings:', error);
      return [];
    }
  };

  const loadTodaysTasks = async (workerId: string): Promise<TaskItem[]> => {
    try {
      // Get real worker data from OperationalDataManager
      const workerName = container.operationalData.getWorkerName(workerId);
      if (!workerName) {
        console.warn(`Worker not found for ID: ${workerId}`);
        return [];
    }
      
      // Get all tasks for this worker from real operational data
      const realTasks = container.operationalData.getRealWorldTasks(workerName);
      const today = new Date();
      const currentHour = today.getHours();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Map day numbers to day names
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayName = dayNames[currentDay];
      
      return realTasks
        .filter(task => {
          // Check if task should be active today based on daysOfWeek
          if (task.daysOfWeek) {
            const taskDays = task.daysOfWeek.split(',');
            if (!taskDays.includes(todayName)) return false;
          }
          
          // Check if task should be active now based on start/end hours
          if (task.startHour !== null && task.endHour !== null) {
            return currentHour >= task.startHour && currentHour <= task.endHour;
          }
          
          // Include tasks without specific time constraints
          return true;
        })
        .map((task, index) => ({
          id: `${workerId}-${task.buildingId}-${index}`,
          title: task.taskName,
          description: `${task.category} - ${task.skillLevel} level`,
          buildingId: task.buildingId,
          dueDate: task.endHour ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), task.endHour, 0, 0).toISOString() : undefined,
          urgency: mapTaskUrgencyFromCategory(task.category, task.skillLevel),
          isCompleted: false, // Will be updated based on real completion status
          category: task.category.toLowerCase(),
          requiresPhoto: task.requiresPhoto,
          assignedWorker: task.assignedWorker,
          recurrence: task.recurrence,
          estimatedDuration: task.estimatedDuration,
          startHour: task.startHour,
          endHour: task.endHour,
          daysOfWeek: task.daysOfWeek
        }));
    } catch (error) {
      console.error('Failed to load today\'s tasks:', error);
      return [];
    }
  };

  const loadTodaysSchedule = async (workerId: string): Promise<DaySchedule> => {
    try {
      const schedule = await container.workers.getWorkerSchedule(workerId, new Date());
      return {
  // date: new Date(),
        items: schedule.map(item => ({
          id: item.id,
          startTime: item.startTime,
          endTime: item.endTime,
          buildingId: item.buildingId,
          title: item.title,
          taskCount: item.taskCount
        })),
        totalHours: schedule.reduce((total, item) => {
          const duration = item.endTime.getTime() - item.startTime.getTime();
          return total + (duration / (1000 * 60 * 60)); // Convert to hours
        }, 0)
      };
    } catch (error) {
      console.error('Failed to load today\'s schedule:', error);
      return {
  // date: new Date(),
        items: [],
        totalHours: 0
      };
    }
  };

  const loadWorkerPerformance = async (workerId: string): Promise<WorkerPerformance> => {
    try {
      const performance = await container.workers.getWorkerPerformance(workerId);
      return {
  // efficiency: performance.efficiency,
        completedCount: performance.completedCount,
        averageTime: performance.averageTime,
        qualityScore: performance.qualityScore,
        weeklyTrend: mapTrendDirection(performance.weeklyTrend)
      };
    } catch (error) {
      console.error('Failed to load worker performance:', error);
      return {
  // efficiency: 0,
        completedCount: 0,
        averageTime: 0,
        qualityScore: 0,
        weeklyTrend: TrendDirection.STABLE
      };
    }
  };

  const loadWeatherData = async (buildings: BuildingSummary[]): Promise<WorkerWeatherSnapshot> => {
    try {
      // Use first building coordinate or NYC default
      const coord = buildings[0]?.coordinate || { latitude: 40.7128, longitude: -74.0060 };
      const { WeatherAPIClient } = await import('@cyntientops/api-clients/src/weather/WeatherAPIClient');
      const weatherClient = new WeatherAPIClient(coord.latitude, coord.longitude);
      const current = await weatherClient.getCurrentWeather();

      // Basic, building-agnostic guidance from current conditions
      const risk = await weatherClient.getOutdoorWorkRisk();

      return {
  // temperature: current.temperature,
        condition: current.description,
        guidance: risk.recommendations[0] || 'Weather conditions suitable for outdoor work',
        isOutdoorSafe: risk.isSafeForWork,
        timestamp: new Date(),
        buildingSpecificGuidance: buildings.map(b => `${b.name}: ${risk.recommendations[0] || 'OK'}`)
      };
    } catch (error) {
      console.error('Failed to load weather data:', error);
      return {
  // temperature: 0,
        condition: 'Unknown',
        guidance: 'Weather data unavailable',
        isOutdoorSafe: true,
        timestamp: new Date(),
        buildingSpecificGuidance: []
      };
    }
  };

  const loadRecentVendorAccess = async (workerId: string): Promise<VendorAccessEntry[]> => {
    try {
      const access = await container.vendorAccess.getRecentAccess(workerId, 10);
      return access;
    } catch (error) {
      console.error('Failed to load recent vendor access:', error);
      return [];
    }
  };

  const mapTaskUrgency = (urgency: string): TaskUrgency => {
    switch (urgency) {
      case 'low': return TaskUrgency.LOW;
  // case 'normal': return TaskUrgency.NORMAL;
  // case 'high': return TaskUrgency.HIGH;
  // case 'urgent': return TaskUrgency.URGENT;
  // case 'critical': return TaskUrgency.CRITICAL;
  // case 'emergency': return TaskUrgency.EMERGENCY;
  // default: return TaskUrgency.NORMAL;
    }
  };
  
  const mapTaskUrgencyFromCategory = (category: string, skillLevel: string): TaskUrgency => {
    // Map task urgency based on category and skill level from real operational data
    if (category === 'Maintenance' && skillLevel === 'Advanced') {
      return TaskUrgency.HIGH;
    }
    if (category === 'Sanitation') {
      return TaskUrgency.HIGH;
    }
    if (category === 'Operations') {
      return TaskUrgency.MEDIUM;
    }
    if (category === 'Inspection') {
      return TaskUrgency.MEDIUM;
    }
    return TaskUrgency.LOW;
    };

  const mapTrendDirection = (trend: string): TrendDirection => {
    switch (trend) {
      case 'up': return TrendDirection.UP;
  // case 'down': return TrendDirection.DOWN;
  // case 'stable': return TrendDirection.STABLE;
  // default: return TrendDirection.STABLE;
    }
  };

  // MARK: - Effects
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Subscribe to dashboard updates
  useEffect(() => {
    const unsubscribe = container.dashboardSync.subscribeToUpdates((update) => {
      if (update.workerId === workerId || update.buildingId === currentBuilding?.id) {
        setState(prev => ({
          ...prev,
          dashboardUpdates: [update, ...prev.dashboardUpdates].slice(0, 50),
          lastUpdateTime: new Date()
        }));
      }
    });

    return unsubscribe;
    }, [container.dashboardSync, workerId, currentBuilding]);

  // MARK: - Return Combined State and Actions
  
  return {
  // ...state,
    currentBuilding,
    hasUrgentTasks,
    completionRate,
    selectTab,
    selectBuilding,
    loadDashboardData,
    refreshData,
    loadInitialData,
    startTask,
    completeTask,
    updateTaskStatus,
    toggleTaskCompletion,
    getPhotoRequirement,
    createPhotoEvidenceForTask,
    clockIn,
    clockOut,
    reportIssue,
    emergencyCall,
    logVendorAccess,
    showVendorAccessLog,
    hideVendorAccessLog,
    addDailyNote,
    showAddNote,
    hideAddNote,
    loadDailyNotes,
    createSupplyRequest,
    showInventoryRequest,
    hideInventoryRequest,
    loadInventoryData,
    loadLowStockAlerts,
    loadWeatherForBuilding,
    getBuildingWeatherGuidance,
    calculateMetrics,
    calculateHoursWorkedToday,
    updateHeroTileProperties,
    toggleIntelligencePanel,
    loadIntelligenceInsights,
    updateMapRegion,
    setMapRegion,
    toggleCompactMode,
    toggleWeatherStrip,
    setDarkMode,
    setHeroExpanded
  };
}
