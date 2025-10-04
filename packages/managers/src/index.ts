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
export { WeatherManager } from './WeatherManager';
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
} from './WeatherManager';

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
  const { WeatherManager: WeatherMgr } = await import('./WeatherManager');
  
  const clockInManager = ClockInMgr.getInstance(databaseManager);
  const locationManager = LocationMgr.getInstance(databaseManager);
  const notificationManager = NotificationMgr.getInstance(databaseManager);
  const photoEvidenceManager = PhotoEvidenceMgr.getInstance(databaseManager);
  const weatherManager = weatherClient ? WeatherMgr.getInstance(weatherClient, databaseManager) : null;

  return {
    clockIn: clockInManager,
    location: locationManager,
    notification: notificationManager,
    photoEvidence: photoEvidenceManager,
    weather: weatherManager
  };
}

// Default exports - using dynamic imports to avoid circular dependencies
export default {
  get ClockInManager() { return require('./ClockInManager').ClockInManager; },
  get LocationManager() { return require('./LocationManager').LocationManager; },
  get NotificationManager() { return require('./NotificationManager').NotificationManager; },
  get PhotoEvidenceManager() { return require('./PhotoEvidenceManager').PhotoEvidenceManager; },
  get WeatherManager() { return require('./WeatherManager').WeatherManager; },
  get WorkCompletionManager() { return require('./WorkCompletionManager').WorkCompletionManager; }
};
