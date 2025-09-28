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

// Manager initialization helper
export async function initializeManagers(databaseManager: any, weatherClient?: any) {
  const clockInManager = ClockInManager.getInstance(databaseManager);
  const locationManager = LocationManager.getInstance(databaseManager);
  const notificationManager = NotificationManager.getInstance(databaseManager);
  const photoEvidenceManager = PhotoEvidenceManager.getInstance(databaseManager);
  const weatherTaskManager = weatherClient ? WeatherTaskManager.getInstance(weatherClient, databaseManager) : null;

  return {
    clockIn: clockInManager,
    location: locationManager,
    notification: notificationManager,
    photoEvidence: photoEvidenceManager,
    weatherTask: weatherTaskManager
  };
}

// Default exports
export default {
  ClockInManager,
  LocationManager,
  NotificationManager,
  PhotoEvidenceManager,
  WeatherTaskManager
};
