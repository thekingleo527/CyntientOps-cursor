/**
 * AdminDashboardViewModel
 * 
 * Comprehensive ViewModel for Admin Dashboard functionality
 * Mirrors SwiftUI AdminDashboardViewModel with system overview and worker management
 * Orchestrates all admin-specific data and system-wide operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, WorkerProfile, BuildingMetrics, ContextualTask, DashboardUpdate, PortfolioMetrics, AdminAlert, ComplianceIssue, DashboardSyncStatus } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// MARK: - Supporting Types

export enum AdminIntelTab {
  PRIORITIES = 'Priorities',
  WORKER_MGMT = 'Workers',
  COMPLIANCE = 'Compliance',
  ANALYTICS = 'Analytics',
  CHAT = 'Chat',
  MAP = 'Map'
}

export enum AdminRoute {
  BUILDINGS = 'buildings',
  WORKERS = 'workers',
  COMPLIANCE = 'compliance',
  REPORTS = 'reports',
  EMERGENCIES = 'emergencies',
  ANALYTICS = 'analytics',
  PROFILE = 'profile',
  SETTINGS = 'settings'
}

export enum SyncStatus {
  SYNCED = 'synced',
  SYNCING = 'syncing',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface AdminDashboardState {
  // Core Data
  buildings: any[];
  workers: WorkerProfile[];
  activeWorkers: WorkerProfile[];
  tasks: ContextualTask[];
  ongoingTasks: ContextualTask[];
  buildingMetrics: Record<string, BuildingMetrics>;
  portfolioInsights: any[];
  
  // Portfolio & Admin Properties
  portfolioMetrics: PortfolioMetrics;
  criticalAlerts: AdminAlert[];
  complianceIssues: ComplianceIssue[];
  
  // Digital Twin Core Properties
  buildingCount: number;
  workersActive: number;
  workersTotal: number;
  completionToday: number;
  complianceScore: number;
  intelTab: AdminIntelTab;
  intelligencePanelExpanded: boolean;
  sheet?: AdminRoute;
  
  // Map and Navigation
  mapRegion: {
    center: { latitude: number; longitude: number };
    span: { latitudeDelta: number; longitudeDelta: number };
  };
  
  // Sync Status
  isSynced: boolean;
  lastSyncAt: Date;
  dashboardSyncStatus: DashboardSyncStatus;
  historicalLoadMonths: number;
  historicalLoadedAt?: Date;
  complianceTrendText: string;
  
  // Convenience Data Properties
  hpdViolationsData: Record<string, any[]>;
  dobPermitsData: Record<string, any[]>;
  dsnyScheduleData: Record<string, any[]>;
  dsnyViolationsByBuilding: Record<string, any[]>;
  ll97EmissionsData: Record<string, any[]>;
  buildingsList: any[];
  crossDashboardUpdates: DashboardUpdate[];
  
  // Loading States
  isLoading: boolean;
  errorMessage?: string;
}

export interface AdminDashboardActions {
  // Data Loading
  loadDashboardData: () => Promise<void>;
  refresh: () => Promise<void>;
  updateDigitalTwinMetrics: () => void;
  setInitialMapRegion: () => void;
  
  // Task Management
  getPressingTasks: () => ContextualTask[];
  getTodaysPendingReminders: () => any[];
  
  // Worker Management
  getActiveWorkers: () => WorkerProfile[];
  getWorkerPerformance: (workerId: string) => Promise<any>;
  updateWorkerStatus: (workerId: string, status: string) => Promise<void>;
  
  // Building Management
  getBuildingHealth: (buildingId: string) => Promise<any>;
  updateBuildingStatus: (buildingId: string, status: string) => Promise<void>;
  
  // Compliance Management
  getComplianceOverview: () => any;
  resolveComplianceIssue: (issueId: string) => Promise<void>;
  
  // System Management
  getSystemHealth: () => Promise<any>;
  triggerSystemSync: () => Promise<void>;
  
  // UI State
  selectIntelTab: (tab: AdminIntelTab) => void;
  toggleIntelligencePanel: () => void;
  setSheet: (route?: AdminRoute) => void;
  setMapRegion: (region: any) => void;
}

// MARK: - Main ViewModel Hook

export function useAdminDashboardViewModel(
  container: ServiceContainer
): AdminDashboardState & AdminDashboardActions {
  
  // MARK: - State Management
  
  const [state, setState] = useState<AdminDashboardState>({
    buildings: [],
    workers: [],
    activeWorkers: [],
    tasks: [],
    ongoingTasks: [],
    buildingMetrics: {},
    portfolioInsights: [],
    portfolioMetrics: {
      totalBuildings: 0,
      activeWorkers: 0,
      overallCompletionRate: 0.0,
      criticalIssues: 0,
      complianceScore: 0.0
    },
    criticalAlerts: [],
    complianceIssues: [],
    buildingCount: 0,
    workersActive: 0,
    workersTotal: 0,
    completionToday: 0.0,
    complianceScore: 0.0,
    intelTab: AdminIntelTab.PRIORITIES,
    intelligencePanelExpanded: false,
    mapRegion: {
      center: { latitude: 40.7589, longitude: -73.9851 },
      span: { latitudeDelta: 0.02, longitudeDelta: 0.02 }
    },
    isSynced: true,
    lastSyncAt: new Date(),
    dashboardSyncStatus: 'synced',
    historicalLoadMonths: 6,
    complianceTrendText: '',
    hpdViolationsData: {},
    dobPermitsData: {},
    dsnyScheduleData: {},
    dsnyViolationsByBuilding: {},
    ll97EmissionsData: {},
    buildingsList: [],
    crossDashboardUpdates: [],
    isLoading: true
  });

  // MARK: - Computed Properties
  
  const syncStatus = useMemo((): SyncStatus => {
    switch (state.dashboardSyncStatus) {
      case 'synced':
        return SyncStatus.SYNCED;
      case 'syncing':
        return SyncStatus.SYNCING;
      case 'failed':
      case 'error':
        return SyncStatus.ERROR;
      case 'offline':
        return SyncStatus.OFFLINE;
      default:
        return SyncStatus.SYNCED;
    }
  }, [state.dashboardSyncStatus]);

  const hasCriticalAlerts = useMemo(() => {
    return state.criticalAlerts.length > 0;
  }, [state.criticalAlerts]);

  const systemHealth = useMemo(() => {
    return {
      buildings: state.buildingCount,
      workers: `${state.workersActive}/${state.workersTotal}`,
      completion: `${Math.round(state.completionToday * 100)}%`,
      compliance: `${Math.round(state.complianceScore * 100)}%`,
      sync: state.isSynced ? 'Synced' : 'Out of Sync'
    };
  }, [state.buildingCount, state.workersActive, state.workersTotal, state.completionToday, state.complianceScore, state.isSynced]);

  // MARK: - Data Loading Methods
  
  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      // Load all buildings
      const buildings = await container.buildings.getAllBuildings();
      
      // Load all workers
      const workers = await container.workers.getAllWorkers();
      const activeWorkers = workers.filter(worker => worker.isActive);
      
      // Load all tasks
      const tasks = await container.tasks.getAllTasks();
      const ongoingTasks = tasks.filter(task => !task.isCompleted);
      
      // Load building metrics
      const buildingMetrics: Record<string, BuildingMetrics> = {};
      for (const building of buildings) {
        buildingMetrics[building.id] = await container.buildings.getBuildingMetrics(building.id);
      }
      
      // Load portfolio insights
      const portfolioInsights = await container.intelligence.getPortfolioInsights();
      
      // Load compliance data
      const complianceData = await loadComplianceData();
      
      // Load critical alerts
      const criticalAlerts = await container.alerts.getCriticalAlerts();

      setState(prev => ({
        ...prev,
        buildings,
        workers,
        activeWorkers,
        tasks,
        ongoingTasks,
        buildingMetrics,
        portfolioInsights,
        complianceIssues: complianceData.issues,
        hpdViolationsData: complianceData.hpdViolations,
        dobPermitsData: complianceData.dobPermits,
        dsnyScheduleData: complianceData.dsnySchedule,
        dsnyViolationsByBuilding: complianceData.dsnyViolations,
        ll97EmissionsData: complianceData.ll97Emissions,
        buildingsList: buildings,
        criticalAlerts,
        isLoading: false,
        lastSyncAt: new Date()
      }));

      // Update digital twin metrics
      updateDigitalTwinMetrics();
      
      // Set initial map region
      setInitialMapRegion();

    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load dashboard data',
        isLoading: false
      }));
    }
  }, [container]);

  const refresh = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  const updateDigitalTwinMetrics = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        buildingCount: prev.buildings.length,
        workersTotal: prev.workers.length,
        workersActive: prev.activeWorkers.length,
        completionToday: prev.portfolioMetrics.overallCompletionRate,
        complianceScore: prev.portfolioMetrics.complianceScore,
        isSynced: prev.dashboardSyncStatus === 'synced',
        lastSyncAt: new Date()
      };
      
      console.log(`🔄 Updated digital twin metrics: ${newState.buildingCount} buildings, ${newState.workersActive}/${newState.workersTotal} workers, ${Math.round(newState.completionToday * 100)}% completion`);
      
      return newState;
    });
  }, []);

  const setInitialMapRegion = useCallback(() => {
    setState(prev => {
      if (prev.buildings.length === 0) return prev;
      
      // Calculate centroid of all buildings
      const latitudes = prev.buildings.map(building => building.latitude);
      const longitudes = prev.buildings.map(building => building.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLon = Math.min(...longitudes);
      const maxLon = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      const spanLat = (maxLat - minLat) * 1.3; // Add 30% padding
      const spanLon = (maxLon - minLon) * 1.3;
      
      const newMapRegion = {
        center: { latitude: centerLat, longitude: centerLon },
        span: { 
          latitudeDelta: Math.max(spanLat, 0.01), 
          longitudeDelta: Math.max(spanLon, 0.01) 
        }
      };
      
      console.log(`🗺️ Set admin map region to center: ${centerLat}, ${centerLon}`);
      
      return { ...prev, mapRegion: newMapRegion };
    });
  }, []);

  // MARK: - Task Management Methods
  
  const getPressingTasks = useCallback((): ContextualTask[] => {
    const currentDate = new Date();
    const calendar = new Date();
    calendar.setHours(0, 0, 0, 0);
    
    const pressingTasks: ContextualTask[] = [];
    
    // 1. Traditional pressing tasks
    const urgentTasks = state.tasks.filter(task => {
      const isUrgent = task.urgency === 'high' || task.urgency === 'critical' || task.urgency === 'emergency';
      const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === currentDate.toDateString();
      const isOverdue = task.dueDate && new Date(task.dueDate) < currentDate;
      
      return (isUrgent || isDueToday || isOverdue) && !task.isCompleted;
    });
    
    pressingTasks.push(...urgentTasks);
    
    // 2. Convert operational intelligence reminders to pressing tasks
    const todaysReminders = getTodaysPendingReminders();
    for (const reminder of todaysReminders.slice(0, 3)) { // Limit to top 3 reminders
      const reminderTask: ContextualTask = {
        id: `reminder_${reminder.id}`,
        title: reminder.title,
        description: reminder.description,
        status: 'pending',
        dueDate: reminder.dueDate,
        category: reminder.category,
        urgency: reminder.urgency,
        buildingId: reminder.buildingId,
        assignedWorkerId: reminder.workerId,
        createdAt: new Date(),
        isCompleted: false
      };
      pressingTasks.push(reminderTask);
    }
    
    return pressingTasks;
  }, [state.tasks]);

  const getTodaysPendingReminders = useCallback((): any[] => {
    // This would load actual reminders from the intelligence service
    // For now, return empty array
    return [];
  }, []);

  // MARK: - Worker Management Methods
  
  const getActiveWorkers = useCallback((): WorkerProfile[] => {
    return state.activeWorkers;
  }, [state.activeWorkers]);

  const getWorkerPerformance = useCallback(async (workerId: string) => {
    try {
      const performance = await container.workers.getWorkerPerformance(workerId);
      return performance;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load worker performance'
      }));
      return null;
    }
  }, [container]);

  const updateWorkerStatus = useCallback(async (workerId: string, status: string) => {
    try {
      await container.workers.updateWorkerStatus(workerId, status);
      
      // Update local state
      setState(prev => ({
        ...prev,
        workers: prev.workers.map(worker =>
          worker.id === workerId ? { ...worker, isActive: status === 'active' } : worker
        ),
        activeWorkers: prev.workers.filter(worker => worker.isActive)
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to update worker status'
      }));
    }
  }, [container]);

  // MARK: - Building Management Methods
  
  const getBuildingHealth = useCallback(async (buildingId: string) => {
    try {
      const health = await container.buildings.getBuildingHealth(buildingId);
      return health;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building health'
      }));
      return null;
    }
  }, [container]);

  const updateBuildingStatus = useCallback(async (buildingId: string, status: string) => {
    try {
      await container.buildings.updateBuildingStatus(buildingId, status);
      
      // Update local state
      setState(prev => ({
        ...prev,
        buildings: prev.buildings.map(building =>
          building.id === buildingId ? { ...building, status } : building
        )
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to update building status'
      }));
    }
  }, [container]);

  // MARK: - Compliance Management Methods
  
  const getComplianceOverview = useCallback(() => {
    return {
      totalIssues: state.complianceIssues.length,
      criticalIssues: state.complianceIssues.filter(issue => issue.severity === 'critical').length,
      pendingIssues: state.complianceIssues.filter(issue => issue.status === 'pending').length,
      resolvedIssues: state.complianceIssues.filter(issue => issue.status === 'resolved').length,
      complianceScore: state.complianceScore
    };
  }, [state.complianceIssues, state.complianceScore]);

  const resolveComplianceIssue = useCallback(async (issueId: string) => {
    try {
      await container.compliance.resolveIssue(issueId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        complianceIssues: prev.complianceIssues.map(issue =>
          issue.id === issueId ? { ...issue, status: 'resolved' } : issue
        )
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to resolve compliance issue'
      }));
    }
  }, [container]);

  // MARK: - System Management Methods
  
  const getSystemHealth = useCallback(async () => {
    try {
      const health = await container.system.getSystemHealth();
      return health;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load system health'
      }));
      return null;
    }
  }, [container]);

  const triggerSystemSync = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, dashboardSyncStatus: 'syncing' }));
      
      await container.dashboardSync.triggerFullSync();
      
      setState(prev => ({ 
        ...prev, 
        dashboardSyncStatus: 'synced',
        lastSyncAt: new Date()
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        dashboardSyncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to sync system'
      }));
    }
  }, [container]);

  // MARK: - UI State Methods
  
  const selectIntelTab = useCallback((tab: AdminIntelTab) => {
    setState(prev => ({ ...prev, intelTab: tab }));
  }, []);

  const toggleIntelligencePanel = useCallback(() => {
    setState(prev => ({ ...prev, intelligencePanelExpanded: !prev.intelligencePanelExpanded }));
  }, []);

  const setSheet = useCallback((route?: AdminRoute) => {
    setState(prev => ({ ...prev, sheet: route }));
  }, []);

  const setMapRegion = useCallback((region: any) => {
    setState(prev => ({ ...prev, mapRegion: region }));
  }, []);

  // MARK: - Helper Methods
  
  const loadComplianceData = async () => {
    try {
      const buildings = await container.buildings.getAllBuildings();
      const complianceData = {
        issues: [] as ComplianceIssue[],
        hpdViolations: {} as Record<string, any[]>,
        dobPermits: {} as Record<string, any[]>,
        dsnySchedule: {} as Record<string, any[]>,
        dsnyViolations: {} as Record<string, any[]>,
        ll97Emissions: {} as Record<string, any[]>
      };
      
      for (const building of buildings) {
        // Load compliance data for each building
        const [hpdViolations, dobPermits, dsnySchedule, dsnyViolations, ll97Emissions] = await Promise.all([
          container.nyc.getHPDViolations(building.id),
          container.nyc.getDOBPermits(building.id),
          container.nyc.getDSNYSchedule(building.id),
          container.nyc.getDSNYViolations(building.id),
          container.nyc.getLL97Emissions(building.id)
        ]);
        
        complianceData.hpdViolations[building.id] = hpdViolations;
        complianceData.dobPermits[building.id] = dobPermits;
        complianceData.dsnySchedule[building.id] = dsnySchedule;
        complianceData.dsnyViolations[building.id] = dsnyViolations;
        complianceData.ll97Emissions[building.id] = ll97Emissions;
        
        // Generate compliance issues from violations
        if (hpdViolations.length > 0) {
          complianceData.issues.push({
            id: `hpd_${building.id}`,
            buildingId: building.id,
            buildingName: building.name,
            type: 'hpd_violation',
            severity: 'high',
            status: 'open',
            description: `${hpdViolations.length} HPD violations`,
            dueDate: new Date(),
            createdAt: new Date()
          });
        }
      }
      
      return complianceData;
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      return {
        issues: [],
        hpdViolations: {},
        dobPermits: {},
        dsnySchedule: {},
        dsnyViolations: {},
        ll97Emissions: {}
      };
    }
  };

  // MARK: - Effects
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Subscribe to dashboard updates
  useEffect(() => {
    const unsubscribe = container.dashboardSync.subscribeToUpdates((update) => {
      setState(prev => ({
        ...prev,
        crossDashboardUpdates: [update, ...prev.crossDashboardUpdates].slice(0, 100),
        lastSyncAt: new Date()
      }));
    });

    return unsubscribe;
  }, [container.dashboardSync]);

  // MARK: - Return Combined State and Actions
  
  return {
    ...state,
    syncStatus,
    hasCriticalAlerts,
    systemHealth,
    loadDashboardData,
    refresh,
    updateDigitalTwinMetrics,
    setInitialMapRegion,
    getPressingTasks,
    getTodaysPendingReminders,
    getActiveWorkers,
    getWorkerPerformance,
    updateWorkerStatus,
    getBuildingHealth,
    updateBuildingStatus,
    getComplianceOverview,
    resolveComplianceIssue,
    getSystemHealth,
    triggerSystemSync,
    selectIntelTab,
    toggleIntelligencePanel,
    setSheet,
    setMapRegion
  };
}
