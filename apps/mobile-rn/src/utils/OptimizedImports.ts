/**
 * 🚀 Optimized Imports
 * Centralized import optimization to reduce bundle size
 * Uses tree-shaking and selective imports for better performance
 */

// Type-only imports (no runtime cost)
export type { AuthUser } from '@cyntientops/business-core/src/services/AuthService';
export type { SessionData } from '@cyntientops/business-core/src/services/SessionManager';
export type { AuthenticatedUser } from '@cyntientops/business-core/src/services/AuthenticationService';
export type { WorkerProfile, UserRole } from '@cyntientops/domain-schema';

// Lazy service imports (loaded on demand)
export const getSecureStorageService = () => 
  import('@cyntientops/business-core/src/services/SecureStorageService').then(m => m.SecureStorageService);

export const getLogger = () => 
  import('@cyntientops/business-core/src/services/LoggingService').then(m => m.Logger);

export const getSessionManager = () => 
  import('@cyntientops/business-core/src/services/SessionManager').then(m => m.SessionManager);

// UI Components - selective imports
export const getGlassCard = () => 
  import('@cyntientops/ui-components/src/glass/GlassCard').then(m => m.GlassCard);

export const getBuildingDetailOverview = () => 
  import('@cyntientops/ui-components/src/buildings/BuildingDetailOverview').then(m => m.BuildingDetailOverview);

export const getWorkerDashboardMainView = () => 
  import('@cyntientops/ui-components/src/dashboards/WorkerDashboardMainView').then(m => m.WorkerDashboardMainView);

// Business Core - selective imports
export const getRealDataService = () => 
  import('@cyntientops/business-core/src/services/RealDataService').then(m => m.RealDataService);

export const getNYCService = () => 
  import('@cyntientops/business-core/src/services/NYCService').then(m => m.NYCService);

export const getDatabaseManager = () => 
  import('@cyntientops/database/src/DatabaseManager').then(m => m.DatabaseManager);

// Context Engines - selective imports
export const getWorkerDashboardViewModel = () => 
  import('@cyntientops/context-engines/src/WorkerDashboardViewModel').then(m => m.WorkerDashboardViewModel);

// Error Boundary - direct import (small, used frequently)
export { ErrorBoundary } from '@cyntientops/ui-components/src/errors/ErrorBoundary';

/**
 * Preload critical services for faster access
 */
export const preloadCriticalServices = async () => {
  const criticalServices = [
    getLogger(),
    getSecureStorageService(),
  ];
  
  await Promise.allSettled(criticalServices);
};

/**
 * Preload UI components for faster rendering
 */
export const preloadUIComponents = async () => {
  const uiComponents = [
    getGlassCard(),
    getBuildingDetailOverview(),
    getWorkerDashboardMainView(),
  ];
  
  await Promise.allSettled(uiComponents);
};
