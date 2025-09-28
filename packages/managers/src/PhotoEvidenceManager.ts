/**
 * 📸 Photo Evidence Manager
 * Mirrors: CyntientOps/Managers/PhotoEvidenceManager.swift
 * Purpose: Photo capture, storage, and evidence management
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';

export interface PhotoEvidence {
  id: string;
  taskId: string;
  workerId: string;
  imageUri: string;
  thumbnailUri: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  metadata: {
    category: string;
    taskName: string;
    workerName: string;
    buildingId?: string;
    buildingName?: string;
    source: 'camera' | 'gallery';
    exif?: any;
  };
  status: 'pending' | 'uploaded' | 'failed';
  uploadAttempts: number;
}

export class PhotoEvidenceManager {
  private static instance: PhotoEvidenceManager;
  private dbManager: DatabaseManager;
  private photoDirectory: string;

  private constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.photoDirectory = `${FileSystem.documentDirectory}photos/`;
    this.initializePhotoDirectory();
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

      // Get building information if available
      const building = task.assigned_building_id ? 
        this.dbManager.getBuildingById(task.assigned_building_id) : null;

      const photoEvidence: PhotoEvidence = {
        id: photoId,
        taskId: task.id,
        workerId: worker.id,
        imageUri: destinationUri,
        thumbnailUri: thumbnailUri,
        timestamp: Date.now(),
        location: metadata.location,
        metadata: {
          category: task.category,
          taskName: task.name,
          workerName: worker.name,
          buildingId: building?.id,
          buildingName: building?.name,
          source: metadata.source || 'camera',
          exif: metadata.exif,
        },
        status: 'pending',
        uploadAttempts: 0,
      };

      // Save to database
      await this.savePhotoEvidence(photoEvidence);

      // Save to device photo library if permission granted
      await this.saveToPhotoLibrary(destinationUri);

      console.log('Photo captured successfully:', photoId);
      return photoEvidence;
    } catch (error) {
      console.error('Failed to capture photo:', error);
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
      imageUri: dbPhoto.image_uri,
      thumbnailUri: dbPhoto.thumbnail_uri,
      timestamp: dbPhoto.timestamp,
      location: dbPhoto.location ? JSON.parse(dbPhoto.location) : undefined,
      metadata: JSON.parse(dbPhoto.metadata),
      status: dbPhoto.status,
      uploadAttempts: dbPhoto.upload_attempts,
    };
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
}
