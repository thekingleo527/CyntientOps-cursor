/**
 * 📸 Photo Evidence Manager with Smart Location Tagging
 * Mirrors: CyntientOps/Managers/PhotoEvidenceManager.swift
 * Purpose: Photo capture, storage, evidence management, and smart location tagging
 * Features: Smart location detection, building space mapping, worker area specification
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';

export interface PhotoEvidence {
  id: string;
  taskId: string;
  workerId: string;
  buildingId: string;
  imageUri: string;
  thumbnailUri: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
  };
  smartLocation?: {
    detectedSpace?: string;
    detectedFloor?: number;
    confidence: number;
    buildingSpaceId?: string;
  };
  workerSpecifiedArea?: {
    spaceId: string;
    spaceName: string;
    floor: number;
    notes?: string;
    timestamp: number;
  };
  metadata: {
    category: string;
    taskName: string;
    workerName: string;
    buildingId: string;
    buildingName: string;
    source: 'camera' | 'gallery';
    exif?: any;
    deviceInfo?: {
      model: string;
      os: string;
      appVersion: string;
    };
    notes?: string;
  };
  status: 'pending' | 'uploaded' | 'failed' | 'location_verified';
  uploadAttempts: number;
  tags: string[];
}

export interface BuildingSpace {
  id: string;
  name: string;
  category: 'utility' | 'mechanical' | 'storage' | 'electrical' | 'access' | 'office' | 'common' | 'exterior';
  floor: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
  buildingId: string;
  description?: string;
}

export class PhotoEvidenceManager {
  private static instance: PhotoEvidenceManager;
  private dbManager: DatabaseManager;
  private photoDirectory: string;
  private buildingSpaces: Map<string, BuildingSpace[]> = new Map();

  private constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.photoDirectory = `${FileSystem.documentDirectory}photos/`;
    this.initializePhotoDirectory();
    this.loadBuildingSpaces();
  }

  public static getInstance(dbManager: DatabaseManager): PhotoEvidenceManager {
    if (!PhotoEvidenceManager.instance) {
      PhotoEvidenceManager.instance = new PhotoEvidenceManager(dbManager);
    }
    return PhotoEvidenceManager.instance;
  }

  private async initializePhotoDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.photoDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.photoDirectory, { intermediates: true });
        console.log('Photo directory created:', this.photoDirectory);
      }
    } catch (error) {
      console.error('Failed to create photo directory:', error);
    }
  }

  async capturePhoto(
    task: OperationalDataTaskAssignment,
    worker: WorkerProfile,
    photoUri: string,
    metadata: any
  ): Promise<PhotoEvidence> {
    try {
      // Get current location with smart detection
      const location = await this.getCurrentLocation();
      
      // Get building information from database
      const building = task.buildingId ? 
        await this.dbManager.get('buildings', task.buildingId) : null;
      
      if (!building) {
        throw new Error('Building not found for task');
      }

      // Smart location detection
      const smartLocation = await this.detectLocation(building.id, location);

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${photoId}.jpg`;
      const thumbnailFileName = `${photoId}_thumb.jpg`;
      
      const destinationUri = `${this.photoDirectory}${fileName}`;
      const thumbnailUri = `${this.photoDirectory}${thumbnailFileName}`;

      // Copy photo to app directory
      await FileSystem.copyAsync({
        from: photoUri,
        to: destinationUri,
      });

      // Create thumbnail
      await this.createThumbnail(destinationUri, thumbnailUri);

      const photoEvidence: PhotoEvidence = {
        id: photoId,
        taskId: task.taskName, // Use task name as ID since we don't have task.id
        workerId: worker.id,
        buildingId: building.id,
        imageUri: destinationUri,
        thumbnailUri: thumbnailUri,
        timestamp: Date.now(),
        location: location,
        smartLocation: smartLocation,
        metadata: {
          category: task.category,
          taskName: task.taskName,
          workerName: worker.name,
          buildingId: building.id,
          buildingName: building.name,
          source: metadata.source || 'camera',
          exif: metadata.exif,
          deviceInfo: {
            model: metadata.deviceModel || 'Unknown',
            os: metadata.osVersion || 'Unknown',
            appVersion: metadata.appVersion || '1.0.0'
          }
        },
        status: 'pending',
        uploadAttempts: 0,
        tags: this.generateTags(task, smartLocation, metadata)
      };

      // Save to database
      await this.savePhotoEvidence(photoEvidence);

      // Save to device photo library if permission granted
      await this.saveToPhotoLibrary(destinationUri);

      console.log('Photo captured successfully with smart location:', photoId);
      return photoEvidence;
    } catch (error) {
      console.error('Failed to capture photo:', error);
      throw error;
    }
  }

  async addPhoto(photo: {
    id?: string;
    buildingId: string;
    workerId?: string;
    taskId?: string;
    imageUri: string;
    thumbnailUri?: string;
    category?: string;
    notes?: string;
    source?: 'camera' | 'gallery';
    metadata?: Record<string, any>;
    tags?: string[];
    status?: 'pending' | 'uploaded' | 'failed' | 'location_verified';
  }): Promise<PhotoEvidence> {
    try {
      const photoId = photo.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();
      const metadata = photo.metadata || {};
      const imageUri = photo.imageUri || (metadata.uri as string) || (photo as any).uri;

      if (!imageUri) {
        throw new Error('Photo imageUri is required to add photo evidence');
      }

      const tagsSource = photo.tags || metadata.tags || [];
      const tags = Array.isArray(tagsSource) ? tagsSource : [tagsSource];

      const photoEvidence: PhotoEvidence = {
        id: photoId,
        taskId: photo.taskId || 'manual_upload',
        workerId: photo.workerId || 'unknown_worker',
        buildingId: photo.buildingId,
        imageUri,
        thumbnailUri: photo.thumbnailUri || metadata.thumbnailUri || imageUri,
        timestamp,
        location: metadata.location,
        smartLocation: metadata.smartLocation,
        workerSpecifiedArea: metadata.workerSpecifiedArea,
        metadata: {
          category: photo.category || metadata.category || 'general',
          taskName: metadata.taskName || 'Building Photo',
          workerName: metadata.workerName || this.getWorkerName(photo.workerId),
          buildingId: photo.buildingId,
          buildingName: metadata.buildingName || this.getBuildingName(photo.buildingId),
          source: photo.source || metadata.source || 'gallery',
          exif: metadata.exif,
          deviceInfo: metadata.deviceInfo,
          notes: photo.notes || metadata.notes,
        },
        status: photo.status || 'pending',
        uploadAttempts: 0,
        tags,
      };

      await this.savePhotoEvidence(photoEvidence);
      return photoEvidence;
    } catch (error) {
      console.error('Failed to add photo evidence:', error);
      throw error;
    }
  }

  private async createThumbnail(sourceUri: string, thumbnailUri: string): Promise<void> {
    try {
      // For now, we'll copy the original image as thumbnail
      // In a real implementation, you would use an image processing library
      await FileSystem.copyAsync({
        from: sourceUri,
        to: thumbnailUri,
      });
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
    }
  }

  private async loadBuildingSpaces(): Promise<void> {
    try {
      // Load building spaces from database
      const spaces = await this.dbManager.query(`
        SELECT * FROM building_spaces 
        ORDER BY building_id, floor, name
      `);
      
      // Group spaces by building ID
      spaces.forEach((space: any) => {
        const buildingId = space.building_id;
        if (!this.buildingSpaces.has(buildingId)) {
          this.buildingSpaces.set(buildingId, []);
        }
        
        this.buildingSpaces.get(buildingId)!.push({
          id: space.id,
          name: space.name,
          category: space.category,
          floor: space.floor,
          coordinates: space.coordinates ? JSON.parse(space.coordinates) : undefined,
          buildingId: buildingId,
          description: space.description
        });
      });
    } catch (error) {
      console.error('Failed to load building spaces:', error);
    }
  }

  private async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
  }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds
        timeout: 15000 // 15 seconds
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw new Error('Unable to determine location');
    }
  }

  private async detectLocation(buildingId: string, location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }): Promise<{
    detectedSpace?: string;
    detectedFloor?: number;
    confidence: number;
    buildingSpaceId?: string;
  }> {
    try {
      const buildingSpaces = this.buildingSpaces.get(buildingId) || [];
      
      // Find the closest space within accuracy radius
      let bestMatch: BuildingSpace | null = null;
      let bestDistance = Infinity;
      let confidence = 0;

      for (const space of buildingSpaces) {
        if (space.coordinates) {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            space.coordinates.latitude,
            space.coordinates.longitude
          );

          // Check if within the space's radius and accuracy
          if (distance <= space.coordinates.radius && distance < bestDistance) {
            bestMatch = space;
            bestDistance = distance;
            confidence = Math.max(0, 1 - (distance / space.coordinates.radius));
          }
        }
      }

      if (bestMatch) {
        return {
          detectedSpace: bestMatch.name,
          detectedFloor: bestMatch.floor,
          confidence: Math.round(confidence * 100),
          buildingSpaceId: bestMatch.id
        };
      }

      // If no specific space found, try to determine floor based on altitude
      const detectedFloor = await this.detectFloorFromAltitude(location.altitude);
      
      return {
        detectedSpace: 'Unknown Area',
        detectedFloor: detectedFloor,
        confidence: 30, // Low confidence for general area
        buildingSpaceId: undefined
      };
    } catch (error) {
      console.error('Failed to detect location:', error);
      return {
        detectedSpace: 'Unknown Area',
        detectedFloor: undefined,
        confidence: 0,
        buildingSpaceId: undefined
      };
    }
  }

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

  private async detectFloorFromAltitude(altitude?: number): Promise<number | undefined> {
    if (!altitude) return undefined;
    
    // Rough estimation: each floor is approximately 3 meters
    // This is a simplified calculation and should be calibrated per building
    const floorHeight = 3; // meters per floor
    const groundLevel = 0; // This should be the building's ground level altitude
    
    const floor = Math.round((altitude - groundLevel) / floorHeight);
    return floor >= 0 ? floor : undefined;
  }

  private generateTags(
    task: OperationalDataTaskAssignment,
    smartLocation: any,
    metadata: any
  ): string[] {
    const tags: string[] = [];
    
    // Task-based tags
    tags.push(task.category);
    tags.push(task.name.toLowerCase().replace(/\s+/g, '_'));
    
    // Location-based tags
    if (smartLocation.detectedSpace) {
      tags.push(smartLocation.detectedSpace.toLowerCase().replace(/\s+/g, '_'));
    }
    if (smartLocation.detectedFloor !== undefined) {
      tags.push(`floor_${smartLocation.detectedFloor}`);
    }
    
    // Time-based tags
    const date = new Date();
    tags.push(`month_${date.getMonth() + 1}`);
    tags.push(`year_${date.getFullYear()}`);
    
    // Source-based tags
    tags.push(metadata.source || 'camera');
    
    return tags;
  }

  private async saveToPhotoLibrary(photoUri: string): Promise<void> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(photoUri);
        console.log('Photo saved to device library');
      }
    } catch (error) {
      console.error('Failed to save to photo library:', error);
    }
  }

  private async savePhotoEvidence(photoEvidence: PhotoEvidence): Promise<void> {
    try {
      await this.dbManager.insert('photo_evidence', {
        id: photoEvidence.id,
        task_id: photoEvidence.taskId,
        worker_id: photoEvidence.workerId,
        image_uri: photoEvidence.imageUri,
        thumbnail_uri: photoEvidence.thumbnailUri,
        timestamp: photoEvidence.timestamp,
        location: photoEvidence.location ? JSON.stringify(photoEvidence.location) : null,
        metadata: JSON.stringify(photoEvidence.metadata),
        status: photoEvidence.status,
        upload_attempts: photoEvidence.uploadAttempts,
      });
    } catch (error) {
      console.error('Failed to save photo evidence to database:', error);
      throw error;
    }
  }

  async getPhotosForTask(taskId: string): Promise<PhotoEvidence[]> {
    try {
      const photos = await this.dbManager.getAll('photo_evidence', { task_id: taskId });
      return photos.map(this.mapDatabaseToPhotoEvidence);
    } catch (error) {
      console.error('Failed to get photos for task:', error);
      return [];
    }
  }

  async getPhotosForWorker(workerId: string): Promise<PhotoEvidence[]> {
    try {
      const photos = await this.dbManager.getAll('photo_evidence', { worker_id: workerId });
      return photos.map(this.mapDatabaseToPhotoEvidence);
    } catch (error) {
      console.error('Failed to get photos for worker:', error);
      return [];
    }
  }

  async getPhotosForBuilding(buildingId: string): Promise<PhotoEvidence[]> {
    try {
      const photos = await this.dbManager.getAll('photo_evidence');
      return photos
        .map(this.mapDatabaseToPhotoEvidence)
        .filter(photo => photo.metadata.buildingId === buildingId);
    } catch (error) {
      console.error('Failed to get photos for building:', error);
      return [];
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      const photo = await this.dbManager.get('photo_evidence', photoId);
      if (!photo) {
        return false;
      }

      // Delete files
      await FileSystem.deleteAsync(photo.image_uri, { idempotent: true });
      await FileSystem.deleteAsync(photo.thumbnail_uri, { idempotent: true });

      // Delete from database
      await this.dbManager.delete('photo_evidence', photoId);

      console.log('Photo deleted successfully:', photoId);
      return true;
    } catch (error) {
      console.error('Failed to delete photo:', error);
      return false;
    }
  }

  async uploadPendingPhotos(): Promise<void> {
    try {
      const pendingPhotos = await this.dbManager.getAll('photo_evidence', { status: 'pending' });
      
      for (const photo of pendingPhotos) {
        try {
          await this.uploadPhoto(photo);
        } catch (error) {
          console.error(`Failed to upload photo ${photo.id}:`, error);
          await this.updatePhotoStatus(photo.id, 'failed', photo.upload_attempts + 1);
        }
      }
    } catch (error) {
      console.error('Failed to upload pending photos:', error);
    }
  }

  private async uploadPhoto(photo: any): Promise<void> {
    // This would integrate with your backend API
    // For now, we'll simulate a successful upload
    console.log('Uploading photo:', photo.id);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.updatePhotoStatus(photo.id, 'uploaded', photo.upload_attempts);
  }

  private async updatePhotoStatus(photoId: string, status: string, uploadAttempts: number): Promise<void> {
    try {
      await this.dbManager.update('photo_evidence', photoId, {
        status,
        upload_attempts: uploadAttempts,
      });
    } catch (error) {
      console.error('Failed to update photo status:', error);
    }
  }

  private mapDatabaseToPhotoEvidence(dbPhoto: any): PhotoEvidence {
    return {
      id: dbPhoto.id,
      taskId: dbPhoto.task_id,
      workerId: dbPhoto.worker_id,
      buildingId: dbPhoto.building_id,
      imageUri: dbPhoto.image_uri,
      thumbnailUri: dbPhoto.thumbnail_uri,
      timestamp: dbPhoto.timestamp,
      location: dbPhoto.location ? JSON.parse(dbPhoto.location) : undefined,
      smartLocation: dbPhoto.smart_location ? JSON.parse(dbPhoto.smart_location) : undefined,
      workerSpecifiedArea: dbPhoto.worker_specified_area ? JSON.parse(dbPhoto.worker_specified_area) : undefined,
      metadata: JSON.parse(dbPhoto.metadata),
      status: dbPhoto.status,
      uploadAttempts: dbPhoto.upload_attempts,
      tags: dbPhoto.tags ? JSON.parse(dbPhoto.tags) : [],
    } as PhotoEvidence;
  }

  async getStorageInfo(): Promise<{ totalPhotos: number; totalSize: number; pendingUploads: number }> {
    try {
      const allPhotos = await this.dbManager.getAll('photo_evidence');
      const pendingPhotos = allPhotos.filter(photo => photo.status === 'pending');
      
      let totalSize = 0;
      for (const photo of allPhotos) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(photo.image_uri);
          if (fileInfo.exists) {
            totalSize += fileInfo.size || 0;
          }
        } catch (error) {
          console.error('Failed to get file size:', error);
        }
      }

      return {
        totalPhotos: allPhotos.length,
        totalSize,
        pendingUploads: pendingPhotos.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { totalPhotos: 0, totalSize: 0, pendingUploads: 0 };
    }
  }

  // Worker area specification methods
  async specifyWorkerArea(
    photoId: string,
    spaceId: string,
    notes?: string
  ): Promise<void> {
    try {
      const space = await this.getBuildingSpace(spaceId);
      if (!space) {
        throw new Error('Building space not found');
      }

      const workerSpecifiedArea = {
        spaceId: space.id,
        spaceName: space.name,
        floor: space.floor,
        notes: notes,
        timestamp: Date.now()
      };

      // Update photo evidence with worker-specified area
      await this.dbManager.query(`
        UPDATE photo_evidence 
        SET worker_specified_area = ?, status = 'location_verified'
        WHERE id = ?
      `, [JSON.stringify(workerSpecifiedArea), photoId]);

      console.log('Worker area specified for photo:', photoId);
    } catch (error) {
      console.error('Failed to specify worker area:', error);
      throw error;
    }
  }

  // Photo repository methods for BuildingSpacesTab
  // Note: getPhotosForBuilding method already exists above

  async getPhotosForSpace(spaceId: string): Promise<PhotoEvidence[]> {
    try {
      const photos = await this.dbManager.query(`
        SELECT * FROM photo_evidence 
        WHERE JSON_EXTRACT(worker_specified_area, '$.spaceId') = ?
           OR JSON_EXTRACT(smart_location, '$.buildingSpaceId') = ?
        ORDER BY timestamp DESC
      `, [spaceId, spaceId]);

      return photos.map(this.mapDatabaseToPhotoEvidence);
    } catch (error) {
      console.error('Failed to get photos for space:', error);
      return [];
    }
  }

  async getBuildingSpaces(buildingId: string): Promise<BuildingSpace[]> {
    return this.buildingSpaces.get(buildingId) || [];
  }

  private async getBuildingSpace(spaceId: string): Promise<BuildingSpace | null> {
    for (const spaces of this.buildingSpaces.values()) {
      const space = spaces.find(s => s.id === spaceId);
      if (space) return space;
    }
    return null;
  }

  private getWorkerName(workerId?: string): string {
    if (!workerId) {
      return 'Unknown Worker';
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const workers = require('@cyntientops/data-seed/src/workers.json');
      const worker = workers.find((w: any) => w.id === workerId);
      return worker?.name || 'Unknown Worker';
    } catch (error) {
      console.warn('Failed to resolve worker name for photo evidence:', error);
      return 'Unknown Worker';
    }
  }

  private getBuildingName(buildingId: string): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const buildings = require('@cyntientops/data-seed/src/buildings.json');
      const building = buildings.find((b: any) => b.id === buildingId);
      return building?.name || 'Unknown Building';
    } catch (error) {
      console.warn('Failed to resolve building name for photo evidence:', error);
      return 'Unknown Building';
    }
  }
}
