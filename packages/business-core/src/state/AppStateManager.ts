/**
 * 🏪 App State Manager
 * Purpose: Centralized state management using Zustand for optimal performance
 * Mirrors: SwiftUI @StateObject and @ObservedObject patterns
 * Features: Type-safe, reactive, and optimized for React Native
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { UserRole, WorkerProfile, ClientProfile, NamedCoordinate, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

// MARK: - Core State Types

export interface UserState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profile?: WorkerProfile | ClientProfile;
  } | null;
  session: {
    token: string;
    expiresAt: Date;
    deviceId: string;
  } | null;
  permissions: string[];
}

export interface WorkerState {
  currentWorker: WorkerProfile | null;
  assignedBuildings: NamedCoordinate[];
  currentBuilding: NamedCoordinate | null;
  tasks: OperationalDataTaskAssignment[];
  clockStatus: {
    isClockedIn: boolean;
    clockInTime: Date | null;
    currentBuilding: NamedCoordinate | null;
  };
  performance: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    activeDays: number;
  };
}

export interface TaskState {
  tasks: OperationalDataTaskAssignment[];
  currentTask: OperationalDataTaskAssignment | null;
  taskHistory: any[];
  filters: {
    status?: string;
    priority?: string;
    buildingId?: string;
    dueDate?: Date;
  };
  sortBy: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
}

export interface BuildingState {
  buildings: NamedCoordinate[];
  currentBuilding: NamedCoordinate | null;
  buildingMetrics: Map<string, any>;
  buildingTasks: Map<string, OperationalDataTaskAssignment[]>;
  buildingAlerts: Map<string, any[]>;
}

export interface NovaAIState {
  isActive: boolean;
  isProcessing: boolean;
  currentContext: any;
  insights: any[];
  responses: any[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastResponse: any | null;
}

export interface RealTimeState {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  subscriptions: string[];
  pendingUpdates: any[];
  lastSyncTime: Date | null;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  activeModal: string | null;
  navigationState: any;
  theme: 'light' | 'dark';
  notifications: any[];
}

export interface AppState {
  // Core states
  user: UserState;
  worker: WorkerState;
  tasks: TaskState;
  buildings: BuildingState;
  novaAI: NovaAIState;
  realTime: RealTimeState;
  ui: UIState;
  
  // Actions
  actions: {
    // User actions
    setUser: (user: UserState['user']) => void;
    setSession: (session: UserState['session']) => void;
    setPermissions: (permissions: string[]) => void;
    logout: () => void;
    
    // Worker actions
    setCurrentWorker: (worker: WorkerProfile | null) => void;
    setAssignedBuildings: (buildings: NamedCoordinate[]) => void;
    setCurrentBuilding: (building: NamedCoordinate | null) => void;
    setWorkerTasks: (tasks: OperationalDataTaskAssignment[]) => void;
    setClockStatus: (status: WorkerState['clockStatus']) => void;
    setWorkerPerformance: (performance: WorkerState['performance']) => void;
    
    // Task actions
    setTasks: (tasks: OperationalDataTaskAssignment[]) => void;
    setCurrentTask: (task: OperationalDataTaskAssignment | null) => void;
    addTask: (task: OperationalDataTaskAssignment) => void;
    updateTask: (taskId: string, updates: Partial<OperationalDataTaskAssignment>) => void;
    setTaskFilters: (filters: TaskState['filters']) => void;
    setTaskSort: (sort: TaskState['sortBy']) => void;
    
    // Building actions
    setBuildings: (buildings: NamedCoordinate[]) => void;
    setCurrentBuilding: (building: NamedCoordinate | null) => void;
    setBuildingMetrics: (buildingId: string, metrics: any) => void;
    setBuildingTasks: (buildingId: string, tasks: OperationalDataTaskAssignment[]) => void;
    addBuildingAlert: (buildingId: string, alert: any) => void;
    
    // Nova AI actions
    setNovaActive: (active: boolean) => void;
    setNovaProcessing: (processing: boolean) => void;
    setNovaContext: (context: any) => void;
    addNovaInsight: (insight: any) => void;
    addNovaResponse: (response: any) => void;
    setNovaConnectionStatus: (status: NovaAIState['connectionStatus']) => void;
    
    // Real-time actions
    setRealTimeConnected: (connected: boolean) => void;
    setConnectionQuality: (quality: RealTimeState['connectionQuality']) => void;
    addSubscription: (subscriptionId: string) => void;
    removeSubscription: (subscriptionId: string) => void;
    addPendingUpdate: (update: any) => void;
    clearPendingUpdates: () => void;
    setLastSyncTime: (time: Date) => void;
    
    // UI actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveModal: (modal: string | null) => void;
    setNavigationState: (state: any) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    addNotification: (notification: any) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
  };
}

// MARK: - State Store Creation

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      user: {
        isAuthenticated: false,
        user: null,
        session: null,
        permissions: []
      },
      
      worker: {
        currentWorker: null,
        assignedBuildings: [],
        currentBuilding: null,
        tasks: [],
        clockStatus: {
          isClockedIn: false,
          clockInTime: null,
          currentBuilding: null
        },
        performance: {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          activeDays: 0
        }
      },
      
      tasks: {
        tasks: [],
        currentTask: null,
        taskHistory: [],
        filters: {},
        sortBy: {
          field: 'due_date',
          direction: 'ASC'
        }
      },
      
      buildings: {
        buildings: [],
        currentBuilding: null,
        buildingMetrics: new Map(),
        buildingTasks: new Map(),
        buildingAlerts: new Map()
      },
      
      novaAI: {
        isActive: false,
        isProcessing: false,
        currentContext: null,
        insights: [],
        responses: [],
        connectionStatus: 'disconnected',
        lastResponse: null
      },
      
      realTime: {
        isConnected: false,
        connectionQuality: 'disconnected',
        subscriptions: [],
        pendingUpdates: [],
        lastSyncTime: null
      },
      
      ui: {
        isLoading: false,
        error: null,
        activeModal: null,
        navigationState: null,
        theme: 'light',
        notifications: []
      },
      
      // Actions
      actions: {
        // User actions
        setUser: (user) => set((state) => ({
          user: {
            ...state.user,
            user,
            isAuthenticated: !!user
          }
        })),
        
        setSession: (session) => set((state) => ({
          user: {
            ...state.user,
            session
          }
        })),
        
        setPermissions: (permissions) => set((state) => ({
          user: {
            ...state.user,
            permissions
          }
        })),
        
        logout: () => set((state) => ({
          user: {
            isAuthenticated: false,
            user: null,
            session: null,
            permissions: []
          },
          worker: {
            currentWorker: null,
            assignedBuildings: [],
            currentBuilding: null,
            tasks: [],
            clockStatus: {
              isClockedIn: false,
              clockInTime: null,
              currentBuilding: null
            },
            performance: {
              totalTasks: 0,
              completedTasks: 0,
              completionRate: 0,
              averageCompletionTime: 0,
              activeDays: 0
            }
          },
          tasks: {
            tasks: [],
            currentTask: null,
            taskHistory: [],
            filters: {},
            sortBy: {
              field: 'due_date',
              direction: 'ASC'
            }
          }
        })),
        
        // Worker actions
        setCurrentWorker: (worker) => set((state) => ({
          worker: {
            ...state.worker,
            currentWorker: worker
          }
        })),
        
        setAssignedBuildings: (buildings) => set((state) => ({
          worker: {
            ...state.worker,
            assignedBuildings: buildings
          }
        })),
        
        setCurrentBuilding: (building) => set((state) => ({
          worker: {
            ...state.worker,
            currentBuilding: building
          },
          buildings: {
            ...state.buildings,
            currentBuilding: building
          }
        })),
        
        setWorkerTasks: (tasks) => set((state) => ({
          worker: {
            ...state.worker,
            tasks
          },
          tasks: {
            ...state.tasks,
            tasks
          }
        })),
        
        setClockStatus: (status) => set((state) => ({
          worker: {
            ...state.worker,
            clockStatus: status
          }
        })),
        
        setWorkerPerformance: (performance) => set((state) => ({
          worker: {
            ...state.worker,
            performance
          }
        })),
        
        // Task actions
        setTasks: (tasks) => set((state) => ({
          tasks: {
            ...state.tasks,
            tasks
          }
        })),
        
        setCurrentTask: (task) => set((state) => ({
          tasks: {
            ...state.tasks,
            currentTask: task
          }
        })),
        
        addTask: (task) => set((state) => ({
          tasks: {
            ...state.tasks,
            tasks: [...state.tasks.tasks, task]
          }
        })),
        
        updateTask: (taskId, updates) => set((state) => ({
          tasks: {
            ...state.tasks,
            tasks: state.tasks.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        })),
        
        setTaskFilters: (filters) => set((state) => ({
          tasks: {
            ...state.tasks,
            filters
          }
        })),
        
        setTaskSort: (sort) => set((state) => ({
          tasks: {
            ...state.tasks,
            sortBy: sort
          }
        })),
        
        // Building actions
        setBuildings: (buildings) => set((state) => ({
          buildings: {
            ...state.buildings,
            buildings
          }
        })),
        
        setCurrentBuilding: (building) => set((state) => ({
          buildings: {
            ...state.buildings,
            currentBuilding: building
          },
          worker: {
            ...state.worker,
            currentBuilding: building
          }
        })),
        
        setBuildingMetrics: (buildingId, metrics) => set((state) => {
          const newMetrics = new Map(state.buildings.buildingMetrics);
          newMetrics.set(buildingId, metrics);
          return {
            buildings: {
              ...state.buildings,
              buildingMetrics: newMetrics
            }
          };
        }),
        
        setBuildingTasks: (buildingId, tasks) => set((state) => {
          const newBuildingTasks = new Map(state.buildings.buildingTasks);
          newBuildingTasks.set(buildingId, tasks);
          return {
            buildings: {
              ...state.buildings,
              buildingTasks: newBuildingTasks
            }
          };
        }),
        
        addBuildingAlert: (buildingId, alert) => set((state) => {
          const newAlerts = new Map(state.buildings.buildingAlerts);
          const existingAlerts = newAlerts.get(buildingId) || [];
          newAlerts.set(buildingId, [...existingAlerts, alert]);
          return {
            buildings: {
              ...state.buildings,
              buildingAlerts: newAlerts
            }
          };
        }),
        
        // Nova AI actions
        setNovaActive: (active) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            isActive: active
          }
        })),
        
        setNovaProcessing: (processing) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            isProcessing: processing
          }
        })),
        
        setNovaContext: (context) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            currentContext: context
          }
        })),
        
        addNovaInsight: (insight) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            insights: [...state.novaAI.insights, insight]
          }
        })),
        
        addNovaResponse: (response) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            responses: [...state.novaAI.responses, response],
            lastResponse: response
          }
        })),
        
        setNovaConnectionStatus: (status) => set((state) => ({
          novaAI: {
            ...state.novaAI,
            connectionStatus: status
          }
        })),
        
        // Real-time actions
        setRealTimeConnected: (connected) => set((state) => ({
          realTime: {
            ...state.realTime,
            isConnected: connected
          }
        })),
        
        setConnectionQuality: (quality) => set((state) => ({
          realTime: {
            ...state.realTime,
            connectionQuality: quality
          }
        })),
        
        addSubscription: (subscriptionId) => set((state) => ({
          realTime: {
            ...state.realTime,
            subscriptions: [...state.realTime.subscriptions, subscriptionId]
          }
        })),
        
        removeSubscription: (subscriptionId) => set((state) => ({
          realTime: {
            ...state.realTime,
            subscriptions: state.realTime.subscriptions.filter(id => id !== subscriptionId)
          }
        })),
        
        addPendingUpdate: (update) => set((state) => ({
          realTime: {
            ...state.realTime,
            pendingUpdates: [...state.realTime.pendingUpdates, update]
          }
        })),
        
        clearPendingUpdates: () => set((state) => ({
          realTime: {
            ...state.realTime,
            pendingUpdates: []
          }
        })),
        
        setLastSyncTime: (time) => set((state) => ({
          realTime: {
            ...state.realTime,
            lastSyncTime: time
          }
        })),
        
        // UI actions
        setLoading: (loading) => set((state) => ({
          ui: {
            ...state.ui,
            isLoading: loading
          }
        })),
        
        setError: (error) => set((state) => ({
          ui: {
            ...state.ui,
            error
          }
        })),
        
        setActiveModal: (modal) => set((state) => ({
          ui: {
            ...state.ui,
            activeModal: modal
          }
        })),
        
        setNavigationState: (navState) => set((state) => ({
          ui: {
            ...state.ui,
            navigationState: navState
          }
        })),
        
        setTheme: (theme) => set((state) => ({
          ui: {
            ...state.ui,
            theme
          }
        })),
        
        addNotification: (notification) => set((state) => ({
          ui: {
            ...state.ui,
            notifications: [...state.ui.notifications, notification]
          }
        })),
        
        removeNotification: (id) => set((state) => ({
          ui: {
            ...state.ui,
            notifications: state.ui.notifications.filter(n => n.id !== id)
          }
        })),
        
        clearNotifications: () => set((state) => ({
          ui: {
            ...state.ui,
            notifications: []
          }
        }))
      }
    })),
    {
      name: 'cyntientops-app-state',
      partialize: (state) => ({
        user: state.user,
        ui: {
          theme: state.ui.theme
        }
      })
    }
  )
);

// MARK: - Selector Hooks for Performance

export const useUser = () => useAppStore((state) => state.user);
export const useWorker = () => useAppStore((state) => state.worker);
export const useTasks = () => useAppStore((state) => state.tasks);
export const useBuildings = () => useAppStore((state) => state.buildings);
export const useNovaAI = () => useAppStore((state) => state.novaAI);
export const useRealTime = () => useAppStore((state) => state.realTime);
export const useUI = () => useAppStore((state) => state.ui);
export const useActions = () => useAppStore((state) => state.actions);

// MARK: - Computed Selectors

export const useIsAuthenticated = () => useAppStore((state) => state.user.isAuthenticated);
export const useCurrentUser = () => useAppStore((state) => state.user.user);
export const useCurrentWorker = () => useAppStore((state) => state.worker.currentWorker);
export const useCurrentBuilding = () => useAppStore((state) => state.worker.currentBuilding);
export const useCurrentTask = () => useAppStore((state) => state.tasks.currentTask);
export const useIsClockedIn = () => useAppStore((state) => state.worker.clockStatus.isClockedIn);
export const useIsLoading = () => useAppStore((state) => state.ui.isLoading);
export const useError = () => useAppStore((state) => state.ui.error);

// MARK: - State Persistence

export const persistState = () => {
  const state = useAppStore.getState();
  // Persist critical state to AsyncStorage
  // This will be implemented with AsyncStorage integration
};

export const restoreState = async () => {
  // Restore state from AsyncStorage
  // This will be implemented with AsyncStorage integration
};

export default useAppStore;
