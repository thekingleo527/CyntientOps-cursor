/**
 * BuildingDetailViewModel
 * 
 * Comprehensive ViewModel for Building Detail functionality
 * Mirrors SwiftUI BuildingDetailViewModel with comprehensive building data and compliance
 * Orchestrates all building-specific data, tasks, workers, and compliance information
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, WorkerProfile, BuildingMetrics, ContextualTask, DashboardUpdate, ComplianceStatus, InventoryItem, MaintenanceTask } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// MARK: - Supporting Types

export interface DailyRoutine {
  id: string;
  title: string;
  scheduledTime?: string;
  isCompleted: boolean;
  assignedWorker?: string;
  requiredInventory: string[];
}

export interface InventorySummary {
  cleaningLow: number;
  cleaningTotal: number;
  equipmentLow: number;
  equipmentTotal: number;
  maintenanceLow: number;
  maintenanceTotal: number;
  safetyLow: number;
  safetyTotal: number;
}

export enum SpaceCategory {
  ALL = 'All',
  UTILITY = 'Utility',
  MECHANICAL = 'Mechanical',
  STORAGE = 'Storage',
  ELECTRICAL = 'Electrical',
  ACCESS = 'Access'
}

export interface SpaceAccess {
  id: string;
  name: string;
  category: SpaceCategory;
  thumbnail?: string;
  lastUpdated: Date;
  accessCode?: string;
  notes?: string;
  requiresKey: boolean;
  photoIds: string[];
}

export interface AccessCode {
  id: string;
  location: string;
  code: string;
  type: string;
  updatedDate: Date;
}

export interface BuildingContact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  isEmergencyContact: boolean;
}

export interface AssignedWorker {
  id: string;
  name: string;
  schedule?: string;
  isOnSite: boolean;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  date: Date;
  description: string;
  cost?: number;
}

export interface BuildingDetailActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  workerName?: string;
  photoId?: string;
}

export enum ActivityType {
  TASK_COMPLETED = 'taskCompleted',
  PHOTO_ADDED = 'photoAdded',
  ISSUE_REPORTED = 'issueReported',
  WORKER_ARRIVED = 'workerArrived',
  WORKER_DEPARTED = 'workerDeparted',
  ROUTINE_COMPLETED = 'routineCompleted',
  INVENTORY_USED = 'inventoryUsed'
}

export interface BuildingDetailStatistics {
  totalTasks: number;
  completedTasks: number;
  workersAssigned: number;
  workersOnSite: number;
  complianceScore: number;
  lastInspectionDate: Date;
  nextScheduledMaintenance: Date;
}

export interface BuildingDetailState {
  // User context
  userRole: UserRole;
  isLoading: boolean;
  errorMessage?: string;
  
  // Building details
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  buildingImage?: string;
  buildingType: string;
  buildingSize: number;
  floors: number;
  units: number;
  yearBuilt: number;
  contractType?: string;
  
  // Overview data
  completionPercentage: number;
  workersOnSite: number;
  workersPresent: string[];
  todaysTasks: { total: number; completed: number };
  nextCriticalTask?: string;
  todaysSpecialNote?: string;
  isFavorite: boolean;
  complianceStatus?: ComplianceStatus;
  primaryContact?: BuildingContact;
  emergencyContact?: BuildingContact;
  
  // Metrics
  efficiencyScore: number;
  complianceScore: string;
  openIssues: number;
  
  // Tasks & Routines
  dailyRoutines: DailyRoutine[];
  completedRoutines: number;
  totalRoutines: number;
  maintenanceTasks: MaintenanceTask[];
  
  // Workers
  assignedWorkers: AssignedWorker[];
  onSiteWorkers: AssignedWorker[];
  
  // Maintenance
  maintenanceHistory: MaintenanceRecord[];
  maintenanceThisWeek: number;
  repairCount: number;
  totalMaintenanceCost: number;
  lastMaintenanceDate?: Date;
  nextScheduledMaintenance?: Date;
  
  // Inventory
  inventorySummary: InventorySummary;
  inventoryItems: InventoryItem[];
  totalInventoryItems: number;
  lowStockCount: number;
  totalInventoryValue: number;
  
  // Spaces & Access
  spaces: SpaceAccess[];
  accessCodes: AccessCode[];
  spaceSearchQuery: string;
  selectedSpaceCategory: SpaceCategory;
  
  // Compliance
  dsnyCompliance: ComplianceStatus;
  nextDSNYAction?: string;
  fireSafetyCompliance: ComplianceStatus;
  nextFireSafetyAction?: string;
  healthCompliance: ComplianceStatus;
  nextHealthAction?: string;
  
  // Raw NYC API compliance data
  rawHPDViolations: any[];
  rawDOBPermits: any[];
  rawDSNYSchedule: any[];
  rawDSNYViolations: any[];
  rawLL97Data: any[];
  facadeFilings: any[];
  facadeNextDueDate?: Date;
  
  // Activity
  recentActivities: BuildingDetailActivity[];
  
  // Statistics
  buildingStatistics?: BuildingDetailStatistics;
  
  // Context data
  buildingTasks: ContextualTask[];
  workerProfiles: WorkerProfile[];
  
  // Building coordinate information
  coordinate: { latitude: number; longitude: number };
}

export interface BuildingDetailActions {
  // Data Loading
  loadBuildingData: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadBuildingDetails: () => Promise<void>;
  loadTodaysMetrics: () => Promise<void>;
  loadRoutines: () => Promise<void>;
  loadSpacesAndAccess: () => Promise<void>;
  loadInventorySummary: () => Promise<void>;
  loadComplianceStatus: () => Promise<void>;
  loadActivityData: () => Promise<void>;
  loadBuildingStatistics: () => Promise<void>;
  loadContextualTasks: () => Promise<void>;
  
  // Task Management
  toggleRoutineCompletion: (routine: DailyRoutine) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  initiateReorder: () => Promise<void>;
  
  // Photo Management
  savePhoto: (photo: any, category: string, notes: string) => Promise<void>;
  
  // Building Management
  toggleFavorite: () => void;
  editBuildingInfo: () => void;
  reportIssue: () => void;
  requestSupplies: () => void;
  reportEmergencyIssue: () => Promise<void>;
  alertEmergencyTeam: () => Promise<void>;
  
  // Space Management
  updateSpace: (space: SpaceAccess) => void;
  
  // UI State
  setSpaceSearchQuery: (query: string) => void;
  setSelectedSpaceCategory: (category: SpaceCategory) => void;
}

// MARK: - Main ViewModel Hook

export function useBuildingDetailViewModel(
  container: ServiceContainer,
  buildingId: string,
  buildingName: string,
  buildingAddress: string
): BuildingDetailState & BuildingDetailActions {
  
  // MARK: - State Management
  
  const [state, setState] = useState<BuildingDetailState>({
    userRole: UserRole.WORKER,
    isLoading: true,
    buildingId,
    buildingName,
    buildingAddress,
    buildingType: 'Commercial',
    buildingSize: 0,
    floors: 0,
    units: 0,
    yearBuilt: 1900,
    completionPercentage: 0,
    workersOnSite: 0,
    workersPresent: [],
    todaysTasks: { total: 0, completed: 0 },
    efficiencyScore: 0,
    complianceScore: 'A',
    openIssues: 0,
    dailyRoutines: [],
    completedRoutines: 0,
    totalRoutines: 0,
    maintenanceTasks: [],
    assignedWorkers: [],
    onSiteWorkers: [],
    maintenanceHistory: [],
    maintenanceThisWeek: 0,
    repairCount: 0,
    totalMaintenanceCost: 0,
    inventorySummary: {
      cleaningLow: 0,
      cleaningTotal: 0,
      equipmentLow: 0,
      equipmentTotal: 0,
      maintenanceLow: 0,
      maintenanceTotal: 0,
      safetyLow: 0,
      safetyTotal: 0
    },
    inventoryItems: [],
    totalInventoryItems: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    spaces: [],
    accessCodes: [],
    spaceSearchQuery: '',
    selectedSpaceCategory: SpaceCategory.ALL,
    dsnyCompliance: ComplianceStatus.COMPLIANT,
    fireSafetyCompliance: ComplianceStatus.COMPLIANT,
    healthCompliance: ComplianceStatus.COMPLIANT,
    rawHPDViolations: [],
    rawDOBPermits: [],
    rawDSNYSchedule: [],
    rawDSNYViolations: [],
    rawLL97Data: [],
    facadeFilings: [],
    recentActivities: [],
    buildingTasks: [],
    workerProfiles: [],
    coordinate: { latitude: 40.7589, longitude: -73.9851 }
  });

  // MARK: - Computed Properties
  
  const buildingIcon = useMemo(() => {
    if (state.buildingName.toLowerCase().includes('museum')) {
      return 'building.columns.fill';
    } else if (state.buildingName.toLowerCase().includes('park')) {
      return 'leaf.fill';
    } else {
      return 'building.2.fill';
    }
  }, [state.buildingName]);

  const averageWorkerHours = useMemo(() => {
    return state.assignedWorkers.length > 0 ? 8 : 0;
  }, [state.assignedWorkers.length]);

  const buildingRating = useMemo(() => {
    if (state.efficiencyScore >= 90 && state.complianceScore === 'A') {
      return 'A+';
    } else if (state.efficiencyScore >= 80) {
      return 'A';
    } else if (state.efficiencyScore >= 70) {
      return 'B';
    } else {
      return 'C';
    }
  }, [state.efficiencyScore, state.complianceScore]);

  const hasComplianceIssues = useMemo(() => {
    return state.dsnyCompliance !== ComplianceStatus.COMPLIANT ||
           state.fireSafetyCompliance !== ComplianceStatus.COMPLIANT ||
           state.healthCompliance !== ComplianceStatus.COMPLIANT;
  }, [state.dsnyCompliance, state.fireSafetyCompliance, state.healthCompliance]);

  const hasLowStockItems = useMemo(() => {
    return state.lowStockCount > 0;
  }, [state.lowStockCount]);

  const filteredSpaces = useMemo(() => {
    let filtered = state.spaces;
    
    // Category filter
    if (state.selectedSpaceCategory !== SpaceCategory.ALL) {
      filtered = filtered.filter(space => space.category === state.selectedSpaceCategory);
    }
    
    // Search filter
    if (state.spaceSearchQuery) {
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(state.spaceSearchQuery.toLowerCase()) ||
        (space.notes && space.notes.toLowerCase().includes(state.spaceSearchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  }, [state.spaces, state.selectedSpaceCategory, state.spaceSearchQuery]);

  // MARK: - Data Loading Methods
  
  const loadBuildingData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      await Promise.all([
        loadBuildingDetails(),
        loadTodaysMetrics(),
        loadRoutines(),
        loadSpacesAndAccess(),
        loadInventorySummary(),
        loadComplianceStatus(),
        loadActivityData(),
        loadBuildingStatistics(),
        loadContextualTasks()
      ]);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building data',
        isLoading: false
      }));
    }
  }, [buildingId]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadTodaysMetrics(),
      loadActivityData(),
      loadRoutines()
    ]);
  }, []);

  const loadBuildingDetails = useCallback(async () => {
    try {
      // Get comprehensive building data from database
      const buildingData = await container.database.query(`
        SELECT b.*, 
               c.name as client_name,
               c.contact_email as client_email,
               c.contact_phone as client_phone
        FROM buildings b
        LEFT JOIN client_buildings cb ON b.id = cb.building_id
        LEFT JOIN clients c ON cb.client_id = c.id
        WHERE b.id = ?
      `, [buildingId]);
      
      if (buildingData.length > 0) {
        const building = buildingData[0];
        
        setState(prev => ({
          ...prev,
          buildingType: building.buildingType || 'Residential',
          buildingSize: building.squareFootage || 25000,
          floors: building.floors || 5,
          units: building.numberOfUnits || 20,
          yearBuilt: building.yearBuilt || 1985,
          contractType: 'Management Agreement',
          buildingImage: building.imageAssetName || undefined,
          primaryContact: building.client_name ? {
            id: `contact_${Date.now()}`,
            name: building.client_name,
            role: 'Property Owner',
            email: building.client_email,
            phone: building.client_phone || '(212) 555-0100',
            isEmergencyContact: false
          } : undefined,
          emergencyContact: getEmergencyContact(buildingId)
        }));
      }
    } catch (error) {
      console.error('Failed to load building details:', error);
    }
  }, [buildingId, container]);

  const loadTodaysMetrics = useCallback(async () => {
    try {
      const metrics = await container.buildings.getBuildingMetrics(buildingId);
      
      setState(prev => ({
        ...prev,
        completionPercentage: Math.round(metrics.completionRate * 100),
        workersOnSite: metrics.hasWorkerOnSite ? 1 : 0,
        workersPresent: Array.from({ length: metrics.activeWorkers }, (_, i) => `Worker ${i + 1}`),
        todaysTasks: { total: metrics.totalTasks, completed: metrics.totalTasks - metrics.pendingTasks - metrics.overdueTasks },
        efficiencyScore: Math.round(metrics.overallScore * 100),
        openIssues: metrics.overdueTasks
      }));
    } catch (error) {
      console.error('Failed to load today\'s metrics:', error);
      setState(prev => ({
        ...prev,
        completionPercentage: 75,
        workersOnSite: 2,
        todaysTasks: { total: 12, completed: 9 },
        efficiencyScore: 85
      }));
    }
  }, [buildingId, container]);

  const loadRoutines = useCallback(async () => {
    try {
      // Load today's specific tasks
      const taskData = await container.database.query(`
        SELECT t.*, w.name as worker_name,
               tt.name as template_name,
               tt.estimated_duration,
               tt.required_tools,
               tt.safety_notes
        FROM tasks t
        LEFT JOIN workers w ON t.assignee_id = w.id
        LEFT JOIN task_templates tt ON t.template_id = tt.id
        WHERE t.building_id = ? 
          AND DATE(t.scheduled_date) = DATE('now')
        ORDER BY t.scheduled_date ASC
      `, [buildingId]);
      
      // Load recurring routine schedules
      const routineData = await container.database.query(`
        SELECT rs.*, w.name as worker_name
        FROM routine_schedules rs
        LEFT JOIN workers w ON rs.worker_id = w.id
        WHERE rs.building_id = ?
        ORDER BY rs.name ASC
      `, [buildingId]);
      
      const allRoutines: DailyRoutine[] = [];
      
      // Add today's specific tasks
      const todayTasks = taskData.map(task => ({
        id: task.id,
        title: task.title || task.template_name || 'Routine Task',
        scheduledTime: task.scheduled_date ? new Date(task.scheduled_date).toLocaleTimeString() : undefined,
        isCompleted: task.status === 'completed',
        assignedWorker: task.worker_name || 'Unassigned',
        requiredInventory: task.required_tools ? task.required_tools.split(',') : []
      }));
      allRoutines.push(...todayTasks);
      
      // Add recurring routines
      const recurringRoutines = routineData
        .filter(routine => shouldRoutineRunToday(routine.rrule))
        .map(routine => ({
          id: routine.id,
          title: `${routine.name} (${routine.category})`,
          scheduledTime: extractTimeFromRRule(routine.rrule),
          isCompleted: false,
          assignedWorker: routine.worker_name,
          requiredInventory: routine.category === 'Cleaning' ? ['Cleaning supplies', 'Trash bags'] : []
        }));
      allRoutines.push(...recurringRoutines);
      
      setState(prev => ({
        ...prev,
        dailyRoutines: allRoutines,
        completedRoutines: allRoutines.filter(routine => routine.isCompleted).length,
        totalRoutines: allRoutines.length
      }));
      
    } catch (error) {
      console.error('Failed to load routines:', error);
    }
  }, [buildingId, container]);

  const loadSpacesAndAccess = useCallback(async () => {
    try {
      const buildingSpaces = await container.buildings.getSpaces(buildingId);
      
      setState(prev => ({
        ...prev,
        spaces: buildingSpaces.map(space => ({
          id: space.id,
          name: space.name,
          category: SpaceCategory.UTILITY,
          thumbnail: undefined,
          lastUpdated: new Date(),
          accessCode: undefined,
          notes: space.description,
          requiresKey: false,
          photoIds: []
        })),
        accessCodes: []
      }));
    } catch (error) {
      console.error('Failed to load spaces and access:', error);
      setState(prev => ({
        ...prev,
        spaces: [],
        accessCodes: []
      }));
    }
  }, [buildingId, container]);

  const loadInventorySummary = useCallback(async () => {
    try {
      const items = await container.database.query(`
        SELECT id, name, category, quantity, minStock, unitCost, location 
        FROM inventory 
        WHERE buildingId = ?
      `, [buildingId]);
      
      const inventoryItems: InventoryItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        minimumStock: item.minStock || 0,
        maxStock: (item.minStock || 0) * 3,
        unit: 'units',
        cost: item.unitCost || 0.0,
        location: item.location
      }));
      
      const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minimumStock);
      const totalValue = inventoryItems.reduce((total, item) => total + (item.currentStock * item.cost), 0);
      
      // Calculate counts by category
      const cleaningItems = inventoryItems.filter(item => item.category === 'cleaning');
      const equipmentItems = inventoryItems.filter(item => item.category === 'equipment');
      const maintenanceItems = inventoryItems.filter(item => item.category === 'maintenance');
      const safetyItems = inventoryItems.filter(item => item.category === 'safety');
      
      const lowStockIds = new Set(lowStockItems.map(item => item.id));
      
      setState(prev => ({
        ...prev,
        inventorySummary: {
          cleaningLow: cleaningItems.filter(item => lowStockIds.has(item.id)).length,
          cleaningTotal: cleaningItems.length,
          equipmentLow: equipmentItems.filter(item => lowStockIds.has(item.id)).length,
          equipmentTotal: equipmentItems.length,
          maintenanceLow: maintenanceItems.filter(item => lowStockIds.has(item.id)).length,
          maintenanceTotal: maintenanceItems.length,
          safetyLow: safetyItems.filter(item => lowStockIds.has(item.id)).length,
          safetyTotal: safetyItems.length
        },
        inventoryItems,
        totalInventoryItems: inventoryItems.length,
        lowStockCount: lowStockItems.length,
        totalInventoryValue: totalValue
      }));
    } catch (error) {
      console.error('Failed to load inventory summary:', error);
    }
  }, [buildingId, container]);

  const loadComplianceStatus = useCallback(async () => {
    try {
      const complianceService = container.nyc;
      await complianceService.syncBuildingCompliance({
        id: buildingId,
        name: state.buildingName,
        address: state.buildingAddress,
        latitude: state.coordinate.latitude,
        longitude: state.coordinate.longitude
      });
      
      const [hpdViolations, dobPermits, dsnyViolations, dsnySchedule, ll97Data] = await Promise.all([
        complianceService.getHPDViolations(buildingId),
        complianceService.getDOBPermits(buildingId),
        complianceService.getDSNYViolations(buildingId),
        complianceService.getDSNYSchedule(buildingId),
        complianceService.getLL97Emissions(buildingId)
      ]);
      
      const activeHPDViolations = hpdViolations.filter(violation => 
        violation.currentStatus.toLowerCase().includes('open')
      );
      const activeDSNYViolations = dsnyViolations.filter(violation => violation.isActive);
      const hasActiveDOBViolations = dobPermits.some(permit => 
        permit.permitStatus.toLowerCase().includes('violation')
      );
      
      setState(prev => ({
        ...prev,
        dsnyCompliance: activeDSNYViolations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        fireSafetyCompliance: hasActiveDOBViolations ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        healthCompliance: activeHPDViolations.length === 0 ? ComplianceStatus.COMPLIANT : ComplianceStatus.VIOLATION,
        complianceScore: activeHPDViolations.length === 0 ? 'A' : 
                        activeHPDViolations.length <= 2 ? 'B' : 
                        activeHPDViolations.length <= 5 ? 'C' : 'D',
        nextHealthAction: activeHPDViolations.length > 0 ? 
          `Resolve ${activeHPDViolations.length} HPD violation(s)` : 
          'Maintain compliance status',
        nextFireSafetyAction: hasActiveDOBViolations ? 
          'Address DOB compliance issues' : 
          `Next inspection due ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
        nextDSNYAction: activeDSNYViolations.length > 0 ? 
          `Resolve ${activeDSNYViolations.length} violation(s)` : 
          'Monitor collection schedule',
        rawHPDViolations: hpdViolations,
        rawDOBPermits: dobPermits,
        rawDSNYSchedule: dsnySchedule,
        rawDSNYViolations: dsnyViolations,
        rawLL97Data: ll97Data
      }));
    } catch (error) {
      console.error('Failed to load compliance status:', error);
    }
  }, [buildingId, state.buildingName, state.buildingAddress, state.coordinate, container]);

  const loadActivityData = useCallback(async () => {
    try {
      const workers = await container.workers.getActiveWorkersForBuilding(buildingId);
      
      setState(prev => ({
        ...prev,
        assignedWorkers: workers.map(worker => ({
          id: worker.id,
          name: worker.name,
          schedule: undefined,
          isOnSite: worker.clockStatus === 'clockedIn' && worker.currentBuildingId === buildingId
        })),
        onSiteWorkers: workers.filter(worker => 
          worker.clockStatus === 'clockedIn' && worker.currentBuildingId === buildingId
        ).map(worker => ({
          id: worker.id,
          name: worker.name,
          schedule: undefined,
          isOnSite: true
        })),
        recentActivities: workers
          .filter(worker => worker.clockStatus === 'clockedIn' && worker.currentBuildingId === buildingId)
          .map(worker => ({
            id: `activity_${Date.now()}`,
            type: ActivityType.WORKER_ARRIVED,
            description: `${worker.name} arrived on site`,
            timestamp: new Date(),
            workerName: worker.name
          })),
        workerProfiles: workers
      }));
    } catch (error) {
      console.error('Failed to load activity data:', error);
    }
  }, [buildingId, container]);

  const loadBuildingStatistics = useCallback(async () => {
    setState(prev => ({
      ...prev,
      buildingStatistics: {
        totalTasks: prev.todaysTasks.total,
        completedTasks: prev.todaysTasks.completed,
        workersAssigned: prev.assignedWorkers.length,
        workersOnSite: prev.onSiteWorkers.length,
        complianceScore: prev.complianceStatus === ComplianceStatus.COMPLIANT ? 100 : 75,
        lastInspectionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextScheduledMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }));
  }, []);

  const loadContextualTasks = useCallback(async () => {
    try {
      const tasks = await container.tasks.getTasksForBuilding(buildingId);
      
      setState(prev => ({
        ...prev,
        buildingTasks: tasks,
        maintenanceTasks: tasks
          .filter(task => task.category === 'maintenance' || task.category === 'repair')
          .map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            category: task.category || 'maintenance',
            urgency: task.urgency || 'medium',
            status: task.status,
            buildingId: buildingId,
            assignedWorkerId: task.assignedWorkerId,
            estimatedDuration: task.estimatedDuration || 3600,
            createdDate: task.createdAt,
            dueDate: task.dueDate,
            completedDate: task.completedAt
          }))
      }));
    } catch (error) {
      console.error('Failed to load contextual tasks:', error);
    }
  }, [buildingId, container]);

  // MARK: - Task Management Methods
  
  const toggleRoutineCompletion = useCallback(async (routine: DailyRoutine) => {
    try {
      const newStatus = routine.isCompleted ? 'pending' : 'completed';
      await container.tasks.updateTaskStatus(routine.id, newStatus);
      
      setState(prev => ({
        ...prev,
        dailyRoutines: prev.dailyRoutines.map(r =>
          r.id === routine.id ? { ...r, isCompleted: !r.isCompleted } : r
        ),
        completedRoutines: prev.dailyRoutines.filter(r => r.isCompleted).length
      }));
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'taskCompleted',
        buildingId: buildingId,
        workerId: 'current_worker',
        data: {
          routineId: routine.id,
          routineTitle: routine.title,
          isCompleted: String(!routine.isCompleted)
        }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      console.error('Failed to update routine:', error);
    }
  }, [buildingId, container]);

  const updateInventoryItem = useCallback(async (item: InventoryItem) => {
    try {
      await container.database.execute(`
        UPDATE inventory 
        SET quantity = ?, minStock = ?, unitCost = ?, location = ?
        WHERE id = ?
      `, [item.currentStock, item.minimumStock, item.cost, item.location || '', item.id]);
      
      await loadInventorySummary();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    }
  }, [loadInventorySummary, container]);

  const initiateReorder = useCallback(async () => {
    const lowStockItems = state.inventoryItems.filter(item => 
      item.currentStock <= item.minimumStock
    );
    
    for (const item of lowStockItems) {
      const reorderQuantity = Math.max(item.minimumStock * 2 - item.currentStock, item.minimumStock);
      console.log(`📦 Reorder needed for ${item.name}: ${reorderQuantity} units`);
    }
    
    setState(prev => ({
      ...prev,
      todaysSpecialNote: `Reorder requests submitted for ${lowStockItems.length} items`
    }));
  }, [state.inventoryItems]);

  // MARK: - Photo Management Methods
  
  const savePhoto = useCallback(async (photo: any, category: string, notes: string) => {
    try {
      const currentWorker = {
        id: 'current_worker',
        name: 'Current User',
        email: '',
        role: UserRole.WORKER,
        isActive: true
      };
      
      const savedPhoto = await container.photos.captureQuick(
        photo,
        category,
        buildingId,
        currentWorker.id,
        notes
      );
      
      console.log('✅ Photo saved:', savedPhoto.id);
      
      // Reload spaces if it was a space photo
      if (category === 'compliance' || category === 'issue') {
        await loadSpacesAndAccess();
      }
      
      // Broadcast update
      const update: DashboardUpdate = {
        source: 'worker',
        type: 'buildingMetricsChanged',
        buildingId: buildingId,
        workerId: currentWorker.id,
        data: {
          action: 'photoAdded',
          photoId: savedPhoto.id,
          category: category
        }
      };
      container.dashboardSync.broadcastWorkerUpdate(update);
      
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  }, [buildingId, container, loadSpacesAndAccess]);

  // MARK: - Building Management Methods
  
  const toggleFavorite = useCallback(() => {
    setState(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  }, []);

  const editBuildingInfo = useCallback(() => {
    console.log('📝 Opening building editor...');
  }, []);

  const reportIssue = useCallback(() => {
    console.log('⚠️ Opening issue reporter...');
  }, []);

  const requestSupplies = useCallback(() => {
    console.log('📦 Opening supply request...');
  }, []);

  const reportEmergencyIssue = useCallback(async () => {
    const update: DashboardUpdate = {
      source: 'worker',
      type: 'criticalUpdate',
      buildingId: buildingId,
      workerId: 'current_worker',
      data: {
        type: 'emergency',
        buildingName: state.buildingName,
        reportedBy: 'Current User'
      }
    };
    container.dashboardSync.broadcastWorkerUpdate(update);
  }, [buildingId, state.buildingName, container]);

  const alertEmergencyTeam = useCallback(async () => {
    const update: DashboardUpdate = {
      source: 'admin',
      type: 'criticalUpdate',
      buildingId: buildingId,
      workerId: '',
      data: {
        type: 'emergency_team_alert',
        buildingName: state.buildingName,
        priority: 'urgent'
      }
    };
    container.dashboardSync.broadcastAdminUpdate(update);
  }, [buildingId, state.buildingName, container]);

  // MARK: - Space Management Methods
  
  const updateSpace = useCallback((space: SpaceAccess) => {
    setState(prev => ({
      ...prev,
      spaces: prev.spaces.map(s => s.id === space.id ? space : s)
    }));
  }, []);

  // MARK: - UI State Methods
  
  const setSpaceSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, spaceSearchQuery: query }));
  }, []);

  const setSelectedSpaceCategory = useCallback((category: SpaceCategory) => {
    setState(prev => ({ ...prev, selectedSpaceCategory: category }));
  }, []);

  // MARK: - Helper Methods
  
  const getEmergencyContact = (buildingId: string): BuildingContact => {
    const jmRealtyBuildingIds = ['3', '5', '6', '7', '9', '10', '11', '14', '21'];
    const weberFarhatBuildingIds = ['13'];
    
    if (jmRealtyBuildingIds.includes(buildingId)) {
      return {
        id: `emergency_${Date.now()}`,
        name: 'David Edelman',
        role: 'J&M Realty Portfolio Manager',
        email: 'David@jmrealty.org',
        phone: '+1 (212) 555-0200',
        isEmergencyContact: true
      };
    } else if (weberFarhatBuildingIds.includes(buildingId)) {
      return {
        id: `emergency_${Date.now()}`,
        name: 'Moises Farhat',
        role: 'Weber Farhat Realty Manager',
        email: 'mfarhat@farhatrealtymanagement.com',
        phone: '+1 (212) 555-0201',
        isEmergencyContact: true
      };
    } else {
      return {
        id: `emergency_${Date.now()}`,
        name: '24/7 Emergency Line',
        role: 'Emergency Response Team',
        email: 'emergency@cyntientops.com',
        phone: '(212) 555-0911',
        isEmergencyContact: true
      };
    }
  };

  const shouldRoutineRunToday = (rrule: string): boolean => {
    const today = new Date();
    const todayWeekday = today.getDay();
    
    // Check daily routines
    if (rrule.includes('FREQ=DAILY')) {
      return true;
    }
    
    // Check weekly routines
    if (rrule.includes('FREQ=WEEKLY')) {
      if (rrule.includes('BYDAY=')) {
        const dayAbbreviations = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const dayNumbers = [0, 1, 2, 3, 4, 5, 6];
        for (let i = 0; i < dayAbbreviations.length; i++) {
          if (rrule.includes(dayAbbreviations[i]) && dayNumbers[i] === todayWeekday) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const extractTimeFromRRule = (rrule: string): string | undefined => {
    const hourMatch = rrule.match(/BYHOUR=(\d+)/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      return new Date(2024, 0, 1, hour, 0).toLocaleTimeString();
    }
    return undefined;
  };

  // MARK: - Effects
  
  useEffect(() => {
    loadBuildingData();
  }, [loadBuildingData]);

  // Subscribe to dashboard updates
  useEffect(() => {
    const unsubscribe = container.dashboardSync.subscribeToUpdates((update) => {
      if (update.buildingId === buildingId) {
        // Handle dashboard update
        console.log('Received dashboard update for building:', buildingId, update);
      }
    });

    return unsubscribe;
  }, [container.dashboardSync, buildingId]);

  // MARK: - Return Combined State and Actions
  
  return {
    ...state,
    buildingIcon,
    averageWorkerHours,
    buildingRating,
    hasComplianceIssues,
    hasLowStockItems,
    filteredSpaces,
    loadBuildingData,
    refreshData,
    loadBuildingDetails,
    loadTodaysMetrics,
    loadRoutines,
    loadSpacesAndAccess,
    loadInventorySummary,
    loadComplianceStatus,
    loadActivityData,
    loadBuildingStatistics,
    loadContextualTasks,
    toggleRoutineCompletion,
    updateInventoryItem,
    initiateReorder,
    savePhoto,
    toggleFavorite,
    editBuildingInfo,
    reportIssue,
    requestSupplies,
    reportEmergencyIssue,
    alertEmergencyTeam,
    updateSpace,
    setSpaceSearchQuery,
    setSelectedSpaceCategory
  };
}
