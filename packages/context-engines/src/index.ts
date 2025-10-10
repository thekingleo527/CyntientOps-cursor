/**
 * @cyntientops/context-engines
 * 
 * Context engines for CyntientOps
 * ViewModels and state management
 */

export { WorkerViewModel } from './WorkerViewModel';
export { ClientViewModel } from './ClientViewModel';
export { AdminViewModel } from './AdminViewModel';

// ViewModel Hooks
export { useBuildingDetailViewModel } from './useBuildingDetailViewModel';
export { useWorkerDashboardViewModel, WorkerDashboardViewModel } from './WorkerDashboardViewModel';
export { AdminDashboardViewModel } from './AdminDashboardViewModel';

// Compliance Dashboard Integration
export { 
  useBuildingDetailComplianceIntegration,
  useClientDashboardComplianceIntegration,
  useAdminDashboardComplianceIntegration,
  getComplianceNavigationConfig,
  getCompliancePermissions
} from './ComplianceDashboardIntegration';

export { default as ClientDashboardComplianceIntegration } from './ClientDashboardComplianceIntegration';
export { default as AdminDashboardComplianceIntegration } from './AdminDashboardComplianceIntegration';
// BuildingDetailComplianceIntegration removed - functionality integrated into main BuildingDetailView

// Context Engines
export { WorkerContextEngine } from './WorkerContextEngine';
export { AdminContextEngine } from './AdminContextEngine';

export type { 
  WorkerDashboardState,
  WorkerAction
} from './WorkerViewModel';

export type { 
  ClientDashboardState,
  ClientAction
} from './ClientViewModel';

export type { 
  AdminDashboardState,
  AdminAction
} from './AdminViewModel';

// Context engines initialization helper
export async function initializeContextEngines(
  databaseManager: any,
  clockInManager: any,
  locationManager: any,
  notificationManager: any,
  intelligenceService: any
) {
  const workerViewModel = WorkerViewModel.getInstance(
    databaseManager,
    clockInManager,
    locationManager,
    notificationManager,
    intelligenceService
  );

  const clientViewModel = ClientViewModel.getInstance(
    databaseManager,
    notificationManager,
    intelligenceService
  );

  const adminViewModel = AdminViewModel.getInstance(
    databaseManager,
    notificationManager,
    intelligenceService
  );

  return {
    worker: workerViewModel,
    client: clientViewModel,
    admin: adminViewModel
  };
}

// Default exports
export default {
  WorkerViewModel,
  ClientViewModel,
  AdminViewModel
};
