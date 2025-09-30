/**
 * @cyntientops/managers
 * 
 * Core managers for CyntientOps
 * ClockIn, Location, and Notification managers
 */

export { ClockInManager } from './ClockInManager';
export { LocationManager } from './LocationManager';
export { NotificationManager } from './NotificationManager';
export { PhotoEvidenceManager } from './PhotoEvidenceManager';
export { WeatherTaskManager } from './WeatherTaskManager';
export { WorkCompletionManager } from './WorkCompletionManager';

export type { 
  ClockInData, 
  ClockOutData, 
  ClockSession, 
  ClockInValidation 
} from './ClockInManager';

export type { 
  LocationData, 
  GeofenceEvent, 
  LocationHistory, 
  GeofenceConfig 
} from './LocationManager';

export type { 
  NotificationData, 
  NotificationSettings, 
  NotificationTemplate 
} from './NotificationManager';

export type { 
  PhotoEvidence 
} from './PhotoEvidenceManager';

export type { 
  WeatherRiskAssessment,
  OutdoorWorkConditions,
  WeatherTaskAdjustment
} from './WeatherTaskManager';

export type { 
  WorkCompletionRecord,
  RoutineCompletion,
  TaskCompletion,
  MaintenanceCompletion,
  InspectionCompletion,
  WorkCompletionStats
} from './WorkCompletionManager';

// Manager initialization helper
export async function initializeManagers(databaseManager: any, weatherClient?: any) {
  const { ClockInManager: ClockInMgr } = await import('./ClockInManager');
  const { LocationManager: LocationMgr } = await import('./LocationManager');
  const { NotificationManager: NotificationMgr } = await import('./NotificationManager');
  const { PhotoEvidenceManager: PhotoEvidenceMgr } = await import('./PhotoEvidenceManager');
  const { WeatherTaskManager: WeatherTaskMgr } = await import('./WeatherTaskManager');
  
  const clockInManager = ClockInMgr.getInstance(databaseManager);
  const locationManager = LocationMgr.getInstance(databaseManager);
  const notificationManager = NotificationMgr.getInstance(databaseManager);
  const photoEvidenceManager = PhotoEvidenceMgr.getInstance(databaseManager);
  const weatherTaskManager = weatherClient ? WeatherTaskMgr.getInstance(weatherClient, databaseManager) : null;

  return {
    clockIn: clockInManager,
    location: locationManager,
    notification: notificationManager,
    photoEvidence: photoEvidenceManager,
    weatherTask: weatherTaskManager
  };
}

// Default exports - using dynamic imports to avoid circular dependencies
export default {
  get ClockInManager() { return require('./ClockInManager').ClockInManager; },
  get LocationManager() { return require('./LocationManager').LocationManager; },
  get NotificationManager() { return require('./NotificationManager').NotificationManager; },
  get PhotoEvidenceManager() { return require('./PhotoEvidenceManager').PhotoEvidenceManager; },
  get WeatherTaskManager() { return require('./WeatherTaskManager').WeatherTaskManager; },
  get WorkCompletionManager() { return require('./WorkCompletionManager').WorkCompletionManager; }
};
