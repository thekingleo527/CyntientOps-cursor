/**
 * 📍 Location Manager
 * Mirrors: CyntientOps/Managers/LocationManager.swift
 * Purpose: GPS tracking, geofencing, and location-based services
 */

import { DatabaseManager } from '@cyntientops/database';
// import { WorkerProfile, Building } from '@cyntientops/domain-schema'; // Unused for now

export interface LocationData {
  workerId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface GeofenceEvent {
  id: string;
  workerId: string;
  buildingId: string;
  eventType: 'enter' | 'exit';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface LocationHistory {
  workerId: string;
  locations: LocationData[];
  startTime: Date;
  endTime: Date;
  totalDistance: number;
  averageSpeed: number;
}

export interface GeofenceConfig {
  buildingId: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  isActive: boolean;
}

export class LocationManager {
  private static instance: LocationManager;
  private databaseManager: DatabaseManager;
  private locationHistory: Map<string, LocationData[]> = new Map();
  private geofences: Map<string, GeofenceConfig> = new Map();
  private trackingWorkers: Set<string> = new Set();
  private watchId: number | null = null;

  private constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
    this.initializeGeofences();
  }

  public static getInstance(databaseManager: DatabaseManager): LocationManager {
    if (!LocationManager.instance) {
      LocationManager.instance = new LocationManager(databaseManager);
    }
    return LocationManager.instance;
  }

  /**
   * Initialize geofences for all buildings
   */
  private initializeGeofences(): void {
    const buildings = this.databaseManager.getBuildings();
    
    buildings.forEach(building => {
      this.geofences.set(building.id, {
        buildingId: building.id,
        center: {
          latitude: building.latitude,
          longitude: building.longitude
        },
        radius: 100, // Default 100m radius
        isActive: true
      });
    });
  }

  /**
   * Start location tracking for a worker
   */
  public async startTrackingWorker(workerId: string): Promise<boolean> {
    try {
      if (this.trackingWorkers.has(workerId)) {
        return true; // Already tracking
      }

      // Initialize location history for worker
      if (!this.locationHistory.has(workerId)) {
        this.locationHistory.set(workerId, []);
      }

      this.trackingWorkers.add(workerId);

      // Start GPS tracking if not already started
      if (!this.watchId) {
        await this.startGPSTracking();
      }

      console.log(`Started location tracking for worker: ${workerId}`);
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  /**
   * Stop location tracking for a worker
   */
  public async stopTrackingWorker(workerId: string): Promise<boolean> {
    try {
      this.trackingWorkers.delete(workerId);

      // Stop GPS tracking if no workers are being tracked
      if (this.trackingWorkers.size === 0 && this.watchId) {
        await this.stopGPSTracking();
      }

      console.log(`Stopped location tracking for worker: ${workerId}`);
      return true;
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking
   */
  private async startGPSTracking(): Promise<void> {
    try {
      // This would integrate with React Native's Geolocation API
      // For now, we'll simulate GPS tracking
      console.log('GPS tracking started');
      
      // Simulate location updates every 30 seconds
      this.watchId = setInterval(() => {
        this.simulateLocationUpdate();
      }, 30000);
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
    }
  }

  /**
   * Stop GPS tracking
   */
  private async stopGPSTracking(): Promise<void> {
    if (this.watchId) {
      clearInterval(this.watchId);
      this.watchId = null;
      console.log('GPS tracking stopped');
    }
  }

  /**
   * Simulate location update (for testing)
   */
  private simulateLocationUpdate(): void {
    this.trackingWorkers.forEach(workerId => {
      // Simulate location near a random building
      const buildings = this.databaseManager.getBuildings();
      const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
      
      const location: LocationData = {
        workerId,
        latitude: randomBuilding.latitude + (Math.random() - 0.5) * 0.001, // Small random offset
        longitude: randomBuilding.longitude + (Math.random() - 0.5) * 0.001,
        accuracy: 5 + Math.random() * 10, // 5-15m accuracy
        timestamp: new Date(),
        altitude: 10 + Math.random() * 50,
        speed: Math.random() * 5, // 0-5 m/s
        heading: Math.random() * 360
      };

      this.updateLocation(location);
    });
  }

  /**
   * Update worker location
   */
  public updateLocation(location: LocationData): void {
    try {
      // Add to location history
      const history = this.locationHistory.get(location.workerId) || [];
      history.push(location);
      
      // Keep only last 100 locations per worker
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      this.locationHistory.set(location.workerId, history);

      // Check geofence events
      this.checkGeofenceEvents(location);

      // Store location in database
      this.storeLocationInDatabase(location);

      console.log(`Location updated for worker ${location.workerId}: ${location.latitude}, ${location.longitude}`);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }

  /**
   * Check for geofence events
   */
  private checkGeofenceEvents(location: LocationData): void {
    this.geofences.forEach((geofence, buildingId) => {
      if (!geofence.isActive) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center.latitude,
        geofence.center.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.wasWorkerInsideGeofence(location.workerId, buildingId);

      if (isInside && !wasInside) {
        // Worker entered geofence
        this.handleGeofenceEvent({
          id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workerId: location.workerId,
          buildingId,
          eventType: 'enter',
          timestamp: location.timestamp,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          }
        });
      } else if (!isInside && wasInside) {
        // Worker exited geofence
        this.handleGeofenceEvent({
          id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workerId: location.workerId,
          buildingId,
          eventType: 'exit',
          timestamp: location.timestamp,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          }
        });
      }
    });
  }

  /**
   * Check if worker was inside geofence (simplified)
   */
  private wasWorkerInsideGeofence(_workerId: string, _buildingId: string): boolean {
    // This would check the last known location state
    // For now, return false (simplified implementation)
    return false;
  }

  /**
   * Handle geofence event
   */
  private handleGeofenceEvent(event: GeofenceEvent): void {
    console.log(`Geofence event: Worker ${event.workerId} ${event.eventType} building ${event.buildingId}`);
    
    // Store geofence event in database
    this.storeGeofenceEvent(event);
    
    // Trigger notifications or other actions
    this.onGeofenceEvent(event);
  }

  /**
   * Geofence event callback
   */
  private onGeofenceEvent(event: GeofenceEvent): void {
    // This would trigger notifications, update worker status, etc.
    console.log(`Processing geofence event: ${event.eventType} for worker ${event.workerId}`);
  }

  /**
   * Get current location for worker
   */
  public getCurrentLocation(workerId: string): LocationData | null {
    const history = this.locationHistory.get(workerId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get location history for worker
   */
  public getLocationHistory(workerId: string, startTime?: Date, endTime?: Date): LocationData[] {
    const history = this.locationHistory.get(workerId) || [];
    
    if (!startTime && !endTime) {
      return history;
    }

    return history.filter(location => {
      if (startTime && location.timestamp < startTime) return false;
      if (endTime && location.timestamp > endTime) return false;
      return true;
    });
  }

  /**
   * Get workers near a location
   */
  public getWorkersNearLocation(latitude: number, longitude: number, radiusKm: number = 1): Array<{
    workerId: string;
    location: LocationData;
    distance: number;
  }> {
    const nearbyWorkers: Array<{
      workerId: string;
      location: LocationData;
      distance: number;
    }> = [];

    this.locationHistory.forEach((history, workerId) => {
      if (history.length === 0) return;

      const lastLocation = history[history.length - 1];
      const distance = this.calculateDistance(
        latitude,
        longitude,
        lastLocation.latitude,
        lastLocation.longitude
      );

      if (distance <= radiusKm * 1000) { // Convert km to meters
        nearbyWorkers.push({
          workerId,
          location: lastLocation,
          distance
        });
      }
    });

    return nearbyWorkers.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Set geofence for building
   */
  public setGeofence(buildingId: string, radius: number): boolean {
    const geofence = this.geofences.get(buildingId);
    if (!geofence) return false;

    geofence.radius = radius;
    this.geofences.set(buildingId, geofence);
    
    console.log(`Updated geofence for building ${buildingId}: ${radius}m radius`);
    return true;
  }

  /**
   * Enable/disable geofence for building
   */
  public setGeofenceActive(buildingId: string, isActive: boolean): boolean {
    const geofence = this.geofences.get(buildingId);
    if (!geofence) return false;

    geofence.isActive = isActive;
    this.geofences.set(buildingId, geofence);
    
    console.log(`Geofence for building ${buildingId} ${isActive ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get geofence configuration
   */
  public getGeofence(buildingId: string): GeofenceConfig | null {
    return this.geofences.get(buildingId) || null;
  }

  /**
   * Get all geofences
   */
  public getAllGeofences(): GeofenceConfig[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Store location in database
   */
  private storeLocationInDatabase(location: LocationData): void {
    // This would store the location in the database
    console.log(`Storing location for worker ${location.workerId} in database`);
  }

  /**
   * Store geofence event in database
   */
  private storeGeofenceEvent(event: GeofenceEvent): void {
    // This would store the geofence event in the database
    console.log(`Storing geofence event ${event.id} in database`);
  }

  /**
   * Get location statistics for worker
   */
  public getLocationStats(workerId: string, _period: 'daily' | 'weekly' | 'monthly' = 'daily'): {
    totalDistance: number;
    averageSpeed: number;
    timeSpent: number;
    locationsCount: number;
  } {
    const history = this.getLocationHistory(workerId);
    
    if (history.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        timeSpent: 0,
        locationsCount: history.length
      };
    }

    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      
      const timeDiff = curr.timestamp.getTime() - prev.timestamp.getTime();
      
      totalDistance += distance;
      totalTime += timeDiff;
    }

    const averageSpeed = totalTime > 0 ? (totalDistance / totalTime) * 1000 : 0; // m/s
    const timeSpent = totalTime / (1000 * 60 * 60); // hours

    return {
      totalDistance,
      averageSpeed,
      timeSpent,
      locationsCount: history.length
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopGPSTracking();
    this.trackingWorkers.clear();
    this.locationHistory.clear();
  }
}
