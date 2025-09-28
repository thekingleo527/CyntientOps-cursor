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
  ENTRY = 'entry',
  EXIT = 'exit',
  INSPECTION = 'inspection',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency'
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
  
  // Vendor Access
  recentVendorAccess: VendorAccessEntry[];
  
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
  
  // Task Management
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, evidence?: any) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  
  // Building Management
  clockIn: (buildingId: string) => Promise<void>;
  clockOut: (buildingId: string) => Promise<void>;
  
  // Vendor Access
  logVendorAccess: (entry: Omit<VendorAccessEntry, 'id' | 'timestamp'>) => Promise<void>;
  
  // UI State
  toggleCompactMode: () => void;
  toggleWeatherStrip: () => void;
  setDarkMode: (enabled: boolean) => void;
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
    recentVendorAccess: [],
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

  const completeTask = useCallback(async (taskId: string, evidence?: any) => {
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
  
  const clockIn = useCallback(async (buildingId: string) => {
    try {
      await container.clockIn.clockIn(buildingId, workerId);
      
      // Update building status
      setState(prev => ({
        ...prev,
        assignedBuildings: prev.assignedBuildings.map(building =>
          building.id === buildingId 
            ? { ...building, status: BuildingStatus.CURRENT }
            : { ...building, status: BuildingStatus.ASSIGNED }
        )
      }));
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'workerClockedIn',
        buildingId,
        workerId,
        data: { timestamp: new Date().toISOString() }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to clock in'
      }));
    }
  }, [container, workerId]);

  const clockOut = useCallback(async (buildingId: string) => {
    try {
      await container.clockIn.clockOut(buildingId, workerId);
      
      // Update building status
      setState(prev => ({
        ...prev,
        assignedBuildings: prev.assignedBuildings.map(building =>
          building.id === buildingId 
            ? { ...building, status: BuildingStatus.ASSIGNED }
            : building
        )
      }));
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'workerClockedOut',
        buildingId,
        workerId,
        data: { timestamp: new Date().toISOString() }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to clock out'
      }));
    }
  }, [container, workerId]);

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

  // MARK: - Helper Methods
  
  const loadWorkerCapabilities = async (workerId: string): Promise<WorkerCapabilities> => {
    try {
      const capabilities = await container.workers.getWorkerCapabilities(workerId);
      return capabilities;
    } catch (error) {
      // Return default capabilities
      return {
        canUploadPhotos: true,
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
        id: building.id,
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
      const tasks = await container.tasks.getTasksForWorker(workerId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return tasks
        .filter(task => {
          if (!task.dueDate) return true;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        })
        .map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          buildingId: task.buildingId,
          dueDate: task.dueDate,
          urgency: mapTaskUrgency(task.urgency),
          isCompleted: task.status === 'completed',
          category: task.category || 'general',
          requiresPhoto: task.category === 'sanitation' || task.category === 'cleaning'
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
        date: new Date(),
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
        date: new Date(),
        items: [],
        totalHours: 0
      };
    }
  };

  const loadWorkerPerformance = async (workerId: string): Promise<WorkerPerformance> => {
    try {
      const performance = await container.workers.getWorkerPerformance(workerId);
      return {
        efficiency: performance.efficiency,
        completedCount: performance.completedCount,
        averageTime: performance.averageTime,
        qualityScore: performance.qualityScore,
        weeklyTrend: mapTrendDirection(performance.weeklyTrend)
      };
    } catch (error) {
      console.error('Failed to load worker performance:', error);
      return {
        efficiency: 0,
        completedCount: 0,
        averageTime: 0,
        qualityScore: 0,
        weeklyTrend: TrendDirection.STABLE
      };
    }
  };

  const loadWeatherData = async (buildings: BuildingSummary[]): Promise<WorkerWeatherSnapshot> => {
    try {
      const weather = await container.weather.getCurrentWeather();
      const buildingGuidance = await Promise.all(
        buildings.map(building => 
          container.weather.getBuildingSpecificGuidance(building.id)
        )
      );
      
      return {
        temperature: weather.temperature,
        condition: weather.condition,
        guidance: weather.guidance,
        isOutdoorSafe: weather.isOutdoorSafe,
        timestamp: new Date(),
        buildingSpecificGuidance: buildingGuidance.flat()
      };
    } catch (error) {
      console.error('Failed to load weather data:', error);
      return {
        temperature: 0,
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
      case 'normal': return TaskUrgency.NORMAL;
      case 'high': return TaskUrgency.HIGH;
      case 'urgent': return TaskUrgency.URGENT;
      case 'critical': return TaskUrgency.CRITICAL;
      case 'emergency': return TaskUrgency.EMERGENCY;
      default: return TaskUrgency.NORMAL;
    }
  };

  const mapTrendDirection = (trend: string): TrendDirection => {
    switch (trend) {
      case 'up': return TrendDirection.UP;
      case 'down': return TrendDirection.DOWN;
      case 'stable': return TrendDirection.STABLE;
      default: return TrendDirection.STABLE;
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
    ...state,
    currentBuilding,
    hasUrgentTasks,
    completionRate,
    selectTab,
    selectBuilding,
    loadDashboardData,
    refreshData,
    startTask,
    completeTask,
    updateTaskStatus,
    clockIn,
    clockOut,
    logVendorAccess,
    toggleCompactMode,
    toggleWeatherStrip,
    setDarkMode
  };
}
