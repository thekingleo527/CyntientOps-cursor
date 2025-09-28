/**
 * User Experience Design System
 * Defines how the app looks and feels for each user type
 * Orchestrates all functions and dependencies for seamless operation
 */

import { Colors } from './colors';

// User Role Definitions
export enum UserRole {
  WORKER = 'worker',
  CLIENT = 'client', 
  ADMIN = 'admin'
}

// User Experience Profiles
export interface UserExperienceProfile {
  role: UserRole;
  primaryColor: string;
  accentColor: string;
  dashboardLayout: 'worker' | 'client' | 'admin';
  dataFocus: string[];
  navigationPriority: string[];
  intelligenceLevel: 'basic' | 'intermediate' | 'advanced';
  realTimeUpdates: boolean;
  aiAssistance: boolean;
}

// User Experience Configurations
export const USER_EXPERIENCE_PROFILES: Record<UserRole, UserExperienceProfile> = {
  [UserRole.WORKER]: {
    role: UserRole.WORKER,
    primaryColor: Colors.primary, // Blue - consistent across all users
    accentColor: Colors.success,  // Green - for task completion
    dashboardLayout: 'worker',
    dataFocus: [
      'assigned_tasks',
      'current_building',
      'clock_status',
      'weather_impact',
      'route_optimization',
      'photo_evidence'
    ],
    navigationPriority: [
      'tasks',
      'clock_in_out',
      'building_details',
      'nova_assistant',
      'profile'
    ],
    intelligenceLevel: 'intermediate',
    realTimeUpdates: true,
    aiAssistance: true
  },
  [UserRole.CLIENT]: {
    role: UserRole.CLIENT,
    primaryColor: Colors.primary, // Blue - consistent across all users
    accentColor: Colors.info,     // Cyan - for client insights
    dashboardLayout: 'client',
    dataFocus: [
      'building_portfolio',
      'compliance_status',
      'worker_performance',
      'maintenance_schedules',
      'cost_analytics',
      'reports'
    ],
    navigationPriority: [
      'portfolio',
      'compliance',
      'workers',
      'analytics',
      'reports'
    ],
    intelligenceLevel: 'advanced',
    realTimeUpdates: true,
    aiAssistance: true
  },
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    primaryColor: Colors.primary, // Blue - consistent across all users
    accentColor: Colors.warning,  // Orange - for system alerts
    dashboardLayout: 'admin',
    dataFocus: [
      'system_health',
      'all_workers',
      'all_buildings',
      'compliance_overview',
      'performance_metrics',
      'emergency_alerts'
    ],
    navigationPriority: [
      'system_overview',
      'worker_management',
      'building_management',
      'compliance_suite',
      'analytics'
    ],
    intelligenceLevel: 'advanced',
    realTimeUpdates: true,
    aiAssistance: true
  }
};

// Dashboard Layout Configurations
export interface DashboardLayout {
  headerHeight: number;
  heroSectionHeight: number;
  intelligencePanelHeight: number;
  tabBarHeight: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export const DASHBOARD_LAYOUTS: Record<string, DashboardLayout> = {
  worker: {
    headerHeight: 60,
    heroSectionHeight: 200,
    intelligencePanelHeight: 80,
    tabBarHeight: 65,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  },
  client: {
    headerHeight: 60,
    heroSectionHeight: 180,
    intelligencePanelHeight: 100,
    tabBarHeight: 65,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  },
  admin: {
    headerHeight: 60,
    heroSectionHeight: 160,
    intelligencePanelHeight: 120,
    tabBarHeight: 65,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  }
};

// Data Hydration Strategy
export interface DataHydrationStrategy {
  userRole: UserRole;
  realTimeData: string[];
  cachedData: string[];
  onDemandData: string[];
  refreshIntervals: Record<string, number>; // in milliseconds
}

export const DATA_HYDRATION_STRATEGIES: Record<UserRole, DataHydrationStrategy> = {
  [UserRole.WORKER]: {
    userRole: UserRole.WORKER,
    realTimeData: [
      'clock_status',
      'current_location',
      'task_updates',
      'weather_data',
      'nova_insights'
    ],
    cachedData: [
      'assigned_buildings',
      'worker_profile',
      'routine_schedules',
      'building_details'
    ],
    onDemandData: [
      'task_history',
      'performance_metrics',
      'compliance_reports',
      'photo_evidence'
    ],
    refreshIntervals: {
      clock_status: 1000,      // 1 second
      weather_data: 300000,    // 5 minutes
      task_updates: 30000,     // 30 seconds
      nova_insights: 60000     // 1 minute
    }
  },
  [UserRole.CLIENT]: {
    userRole: UserRole.CLIENT,
    realTimeData: [
      'worker_status',
      'compliance_alerts',
      'building_metrics',
      'cost_updates'
    ],
    cachedData: [
      'building_portfolio',
      'worker_assignments',
      'compliance_status',
      'maintenance_schedules'
    ],
    onDemandData: [
      'detailed_reports',
      'historical_data',
      'analytics',
      'export_data'
    ],
    refreshIntervals: {
      worker_status: 30000,    // 30 seconds
      compliance_alerts: 60000, // 1 minute
      building_metrics: 300000, // 5 minutes
      cost_updates: 600000     // 10 minutes
    }
  },
  [UserRole.ADMIN]: {
    userRole: UserRole.ADMIN,
    realTimeData: [
      'system_health',
      'all_worker_status',
      'emergency_alerts',
      'performance_metrics'
    ],
    cachedData: [
      'all_buildings',
      'all_workers',
      'compliance_overview',
      'system_configuration'
    ],
    onDemandData: [
      'detailed_analytics',
      'system_logs',
      'user_management',
      'configuration_changes'
    ],
    refreshIntervals: {
      system_health: 10000,    // 10 seconds
      worker_status: 15000,    // 15 seconds
      emergency_alerts: 5000,  // 5 seconds
      performance_metrics: 60000 // 1 minute
    }
  }
};

// Navigation Flow Definitions
export interface NavigationFlow {
  userRole: UserRole;
  primaryRoutes: string[];
  secondaryRoutes: string[];
  modalRoutes: string[];
  deepLinkRoutes: string[];
}

export const NAVIGATION_FLOWS: Record<UserRole, NavigationFlow> = {
  [UserRole.WORKER]: {
    userRole: UserRole.WORKER,
    primaryRoutes: [
      'Dashboard',
      'Tasks',
      'ClockIn',
      'BuildingDetail',
      'Profile'
    ],
    secondaryRoutes: [
      'TaskTimeline',
      'MultisiteDeparture',
      'WeeklyRoutine',
      'DailyRoutine',
      'PhotoCapture'
    ],
    modalRoutes: [
      'ClockInModal',
      'PhotoCaptureModal',
      'NovaChat'
    ],
    deepLinkRoutes: [
      'TaskDetail',
      'BuildingDetail',
      'EmergencyAlert'
    ]
  },
  [UserRole.CLIENT]: {
    userRole: UserRole.CLIENT,
    primaryRoutes: [
      'Dashboard',
      'Portfolio',
      'Compliance',
      'Workers',
      'Analytics'
    ],
    secondaryRoutes: [
      'BuildingDetail',
      'WorkerDetail',
      'ComplianceDetail',
      'Reports',
      'Settings'
    ],
    modalRoutes: [
      'BuildingReport',
      'WorkerReport',
      'NovaChat'
    ],
    deepLinkRoutes: [
      'BuildingDetail',
      'WorkerDetail',
      'ComplianceAlert'
    ]
  },
  [UserRole.ADMIN]: {
    userRole: UserRole.ADMIN,
    primaryRoutes: [
      'Dashboard',
      'SystemOverview',
      'WorkerManagement',
      'BuildingManagement',
      'ComplianceSuite'
    ],
    secondaryRoutes: [
      'Analytics',
      'Reports',
      'Settings',
      'UserManagement',
      'SystemLogs'
    ],
    modalRoutes: [
      'SystemAlert',
      'WorkerDetail',
      'BuildingDetail',
      'NovaChat'
    ],
    deepLinkRoutes: [
      'EmergencyAlert',
      'SystemAlert',
      'WorkerDetail',
      'BuildingDetail'
    ]
  }
};

// Helper Functions
export const getUserExperienceProfile = (userRole: UserRole): UserExperienceProfile => {
  return USER_EXPERIENCE_PROFILES[userRole];
};

export const getDashboardLayout = (layoutType: string): DashboardLayout => {
  return DASHBOARD_LAYOUTS[layoutType] || DASHBOARD_LAYOUTS.worker;
};

export const getDataHydrationStrategy = (userRole: UserRole): DataHydrationStrategy => {
  return DATA_HYDRATION_STRATEGIES[userRole];
};

export const getNavigationFlow = (userRole: UserRole): NavigationFlow => {
  return NAVIGATION_FLOWS[userRole];
};

// System Orchestration
export interface SystemOrchestration {
  userRole: UserRole;
  dataFlow: string[];
  componentDependencies: string[];
  serviceDependencies: string[];
  realTimeConnections: string[];
}

export const SYSTEM_ORCHESTRATION: Record<UserRole, SystemOrchestration> = {
  [UserRole.WORKER]: {
    userRole: UserRole.WORKER,
    dataFlow: [
      'AuthService -> WorkerProfile',
      'LocationService -> CurrentBuilding',
      'TaskService -> AssignedTasks',
      'WeatherService -> WeatherData',
      'ClockInService -> ClockStatus',
      'NovaService -> AIInsights'
    ],
    componentDependencies: [
      'WorkerHeader',
      'TaskTimeline',
      'WeatherRibbon',
      'NovaAvatar',
      'ClockInPill',
      'BuildingMap'
    ],
    serviceDependencies: [
      'AuthManager',
      'LocationManager',
      'TaskManager',
      'WeatherManager',
      'ClockInManager',
      'NovaManager'
    ],
    realTimeConnections: [
      'WebSocket -> TaskUpdates',
      'WebSocket -> ClockStatus',
      'WebSocket -> WeatherUpdates',
      'WebSocket -> NovaInsights'
    ]
  },
  [UserRole.CLIENT]: {
    userRole: UserRole.CLIENT,
    dataFlow: [
      'AuthService -> ClientProfile',
      'BuildingService -> Portfolio',
      'WorkerService -> AssignedWorkers',
      'ComplianceService -> ComplianceStatus',
      'AnalyticsService -> PerformanceMetrics',
      'NovaService -> AIInsights'
    ],
    componentDependencies: [
      'ClientHeader',
      'PortfolioOverview',
      'ComplianceDashboard',
      'WorkerGrid',
      'AnalyticsCharts',
      'NovaAvatar'
    ],
    serviceDependencies: [
      'AuthManager',
      'BuildingManager',
      'WorkerManager',
      'ComplianceManager',
      'AnalyticsManager',
      'NovaManager'
    ],
    realTimeConnections: [
      'WebSocket -> WorkerStatus',
      'WebSocket -> ComplianceAlerts',
      'WebSocket -> BuildingMetrics',
      'WebSocket -> NovaInsights'
    ]
  },
  [UserRole.ADMIN]: {
    userRole: UserRole.ADMIN,
    dataFlow: [
      'AuthService -> AdminProfile',
      'SystemService -> SystemHealth',
      'WorkerService -> AllWorkers',
      'BuildingService -> AllBuildings',
      'ComplianceService -> ComplianceOverview',
      'NovaService -> AIInsights'
    ],
    componentDependencies: [
      'AdminHeader',
      'SystemOverview',
      'WorkerManagement',
      'BuildingManagement',
      'ComplianceSuite',
      'NovaAvatar'
    ],
    serviceDependencies: [
      'AuthManager',
      'SystemManager',
      'WorkerManager',
      'BuildingManager',
      'ComplianceManager',
      'NovaManager'
    ],
    realTimeConnections: [
      'WebSocket -> SystemHealth',
      'WebSocket -> WorkerStatus',
      'WebSocket -> EmergencyAlerts',
      'WebSocket -> NovaInsights'
    ]
  }
};

export const getSystemOrchestration = (userRole: UserRole): SystemOrchestration => {
  return SYSTEM_ORCHESTRATION[userRole];
};
