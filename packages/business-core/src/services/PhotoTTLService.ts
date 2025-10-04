import { SecureStorageService } from '../security/SecureStorageService';
import { Logger } from './Logger';

export interface PhotoTTLConfig {
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  warningThreshold: number; // Warning threshold in milliseconds (e.g., 1 hour before expiry)
}

export interface PhotoMetadata {
  originalPath: string;
  storedAt: string;
  expiresAt: number;
  taskId?: string;
  buildingId?: string;
  workerId?: string;
  category?: string;
  notes?: string;
}

export class PhotoTTLService {
  private static instance: PhotoTTLService;
  private secureStorage: SecureStorageService;
  private config: PhotoTTLConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(secureStorage: SecureStorageService, config?: Partial<PhotoTTLConfig>) {
    this.secureStorage = secureStorage;
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      warningThreshold: 60 * 60 * 1000, // 1 hour before expiry
      ...config,
    };
  }

  public static getInstance(secureStorage: SecureStorageService, config?: Partial<PhotoTTLConfig>): PhotoTTLService {
    if (!PhotoTTLService.instance) {
      PhotoTTLService.instance = new PhotoTTLService(secureStorage, config);
    }
    return PhotoTTLService.instance;
  }

  /**
   * Initialize the photo TTL service
   */
  async initialize(): Promise<void> {
    try {
      // Start cleanup interval
      this.startCleanupInterval();
      Logger.info('PhotoTTLService initialized successfully', 'PhotoTTLService');
    } catch (error) {
      Logger.error('Failed to initialize PhotoTTLService:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Store a photo with TTL
   */
  async storePhoto(
    photoPath: string,
    metadata?: Partial<PhotoMetadata>,
    customTTL?: number
  ): Promise<string> {
    try {
      const ttl = customTTL || this.config.defaultTTL;
      const expiresAt = Date.now() + ttl;

      const photoMetadata: PhotoMetadata = {
        originalPath: photoPath,
        storedAt: new Date().toISOString(),
        expiresAt,
        ...metadata,
      };

      const photoKey = await this.secureStorage.storePhoto(photoPath, photoMetadata);
      
      Logger.info(`Photo stored with TTL: ${photoKey}`, 'PhotoTTLService');
      return photoKey;
    } catch (error) {
      Logger.error('Failed to store photo with TTL:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Get photo expiration status
   */
  async getPhotoStatus(photoKey: string): Promise<{
    isExpired: boolean;
    expiresAt?: number;
    timeRemaining?: number;
    metadata?: PhotoMetadata;
  }> {
    try {
      const status = await this.secureStorage.getPhotoExpirationStatus(photoKey);
      
      // Get metadata if photo exists
      let metadata: PhotoMetadata | undefined;
      if (!status.isExpired) {
        try {
          const result = await this.secureStorage.retrieveWithMetadata(photoKey);
          metadata = result.metadata as PhotoMetadata;
        } catch (error) {
          Logger.warn('Failed to retrieve photo metadata:', error, 'PhotoTTLService');
        }
      }

      return {
        ...status,
        metadata,
      };
    } catch (error) {
      Logger.error('Failed to get photo status:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Get all photos expiring soon
   */
  async getPhotosExpiringSoon(): Promise<Array<{
    photoKey: string;
    expiresAt: number;
    timeRemaining: number;
    metadata: PhotoMetadata;
  }>> {
    try {
      const expiringPhotos = await this.secureStorage.getPhotosExpiringSoon();
      
      return expiringPhotos.map(photo => ({
        photoKey: photo.storage_key,
        expiresAt: photo.expires_at,
        timeRemaining: photo.expires_at - Date.now(),
        metadata: photo.metadata ? JSON.parse(photo.metadata) : {},
      }));
    } catch (error) {
      Logger.error('Failed to get expiring photos:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Extend photo TTL
   */
  async extendPhotoTTL(photoKey: string, additionalTTL: number): Promise<boolean> {
    try {
      const status = await this.getPhotoStatus(photoKey);
      
      if (status.isExpired) {
        Logger.warn(`Cannot extend TTL for expired photo: ${photoKey}`, 'PhotoTTLService');
        return false;
      }

      const newExpiresAt = (status.expiresAt || Date.now()) + additionalTTL;
      
      // Update the photo with new TTL
      await this.secureStorage.update(photoKey, status.metadata?.originalPath || '', {
        ttl: additionalTTL,
        metadata: {
          ...status.metadata,
          expiresAt: newExpiresAt,
        },
      });

      Logger.info(`Extended TTL for photo: ${photoKey}`, 'PhotoTTLService');
      return true;
    } catch (error) {
      Logger.error('Failed to extend photo TTL:', error, 'PhotoTTLService');
      return false;
    }
  }

  /**
   * Clean up expired photos
   */
  async cleanupExpiredPhotos(): Promise<number> {
    try {
      const deletedCount = await this.secureStorage.cleanupExpiredPhotos();
      Logger.info(`Cleaned up ${deletedCount} expired photos`, 'PhotoTTLService');
      return deletedCount;
    } catch (error) {
      Logger.error('Failed to cleanup expired photos:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Get photo statistics
   */
  async getPhotoStatistics(): Promise<{
    totalPhotos: number;
    expiredPhotos: number;
    expiringSoon: number;
    totalStorageUsed: number;
  }> {
    try {
      const stats = await this.secureStorage.getStatistics();
      const expiringSoon = await this.getPhotosExpiringSoon();
      
      return {
        totalPhotos: stats.totalItems,
        expiredPhotos: stats.expiredItems,
        expiringSoon: expiringSoon.length,
        totalStorageUsed: stats.totalSize,
      };
    } catch (error) {
      Logger.error('Failed to get photo statistics:', error, 'PhotoTTLService');
      throw error;
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredPhotos();
        
        // Check for photos expiring soon and log warnings
        const expiringSoon = await this.getPhotosExpiringSoon();
        if (expiringSoon.length > 0) {
          Logger.warn(`${expiringSoon.length} photos expiring soon`, 'PhotoTTLService');
        }
      } catch (error) {
        Logger.error('Cleanup interval error:', error, 'PhotoTTLService');
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy the service
   */
  async destroy(): Promise<void> {
    this.stopCleanupInterval();
    Logger.info('PhotoTTLService destroyed', 'PhotoTTLService');
  }
}
