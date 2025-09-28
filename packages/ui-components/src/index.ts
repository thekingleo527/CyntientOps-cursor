/**
 * @cyntientops/ui-components
 * 
 * Complete UI Components Library for CyntientOps
 * Glass Morphism Dashboard Components
 */

// Export all dashboard components
export * from './dashboards/WorkerDashboard';
export * from './dashboards/ClientDashboard';
export * from './dashboards/AdminDashboard';

// Export all dashboard sub-components
export * from './dashboards/components/WorkerHeroCard';
export * from './dashboards/components/TaskTimelineView';
export * from './dashboards/components/ClockInButton';
export * from './dashboards/components/WeatherRibbon';
export * from './dashboards/components/PerformanceMetrics';
export * from './dashboards/components/PortfolioOverview';
export * from './dashboards/components/ComplianceAlerts';
export * from './dashboards/components/WorkerAssignments';
export * from './dashboards/components/CostAnalysis';
export * from './dashboards/components/RealtimeMonitoring';
export * from './dashboards/components/TaskDistribution';
export * from './dashboards/components/BuildingManagement';
export * from './dashboards/components/PerformanceReports';

// Maps
export { MapContainer } from './maps/MapContainer';
export { IntelligencePopover } from './maps/IntelligencePopover';
export { BuildingMarker } from './maps/BuildingMarker';

// Timeline
export { TaskTimelineRow } from './timeline/TaskTimelineRow';

// Routines
export { RoutinePriorityComponent, RoutinePriority, ScheduleType, BuildingRoutine } from './routines/RoutinePriority';

// Weather
export { WeatherTasksSection } from './weather/WeatherTasksSection';

// Progress
export { TodaysProgressDetailView } from './progress/TodaysProgressDetailView';

// Intelligence Components
export { IntelligencePreviewPanel } from './intelligence/IntelligencePreviewPanel';
export { WorkerIntelligencePanel } from './intelligence/WorkerIntelligencePanel';
export { AdminIntelligencePanel } from './intelligence/AdminIntelligencePanel';
export { ClientIntelligencePanel } from './intelligence/ClientIntelligencePanel';

// Header Components
export { DashboardHeader } from './headers/DashboardHeader';

// Building Components
export { BuildingDetailPreview } from './buildings/BuildingDetailPreview';

// Profile Components
export { WorkerProfileView } from './profiles/WorkerProfileView';

// Navigation Components
export { WorkerNavigationFlow } from './navigation/WorkerNavigationFlow';

// Weather Components
export { default as WeatherRibbonView } from './weather/WeatherRibbonView';
export { default as WeatherBasedHybridCard } from './weather/WeatherBasedHybridCard';

// Timeline Components
export { default as TaskTimelineView } from './timeline/TaskTimelineView';
export { default as TaskTimelineRow } from './timeline/TaskTimelineRow';
export { default as UnifiedTaskDetailView } from './timeline/UnifiedTaskDetailView';

// Map Components
export { default as BuildingMapView } from './maps/BuildingMapView';

// Re-export design tokens for convenience
export * from '@cyntientops/design-tokens';
