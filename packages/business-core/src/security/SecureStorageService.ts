/**
 * 🔐 Secure Storage Service
 * Purpose: Encrypted storage for sensitive data with TTL support
 * Features: AES-256 encryption, automatic expiration, secure deletion
 */

import { AESEncryption } from './AESEncryption';
import { DatabaseManager } from '@cyntientops/database';

export interface SecureStorageItem {
  id: string;
  key: string;
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
  ttl?: number; // Time to live in milliseconds
  createdAt: number;
  expiresAt?: number;
  metadata?: any;
}

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  metadata?: any;
  encryptMetadata?: boolean;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private database: DatabaseManager;
  private encryptionKey: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(database: DatabaseManager, encryptionKey: string) {
    this.database = database;
    this.encryptionKey = encryptionKey;
  }

  public static getInstance(database: DatabaseManager, encryptionKey: string): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService(database, encryptionKey);
    }
    return SecureStorageService.instance;
  }

  /**
   * Initialize the secure storage service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing Secure Storage Service...');

      // Create secure storage table if it doesn't exist
      await this.createSecureStorageTable();

      // Start cleanup interval for expired items
      this.startCleanupInterval();

      console.log('✅ Secure Storage Service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Secure Storage Service:', error);
      throw error;
    }
  }

  /**
   * Store encrypted data with optional TTL
   */
  async store(
    key: string, 
    data: any, 
    options: StorageOptions = {}
  ): Promise<string> {
    try {
      const id = AESEncryption.generateSecureRandom(16);
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Encrypt the data
      const encryptionResult = AESEncryption.encrypt(dataString, this.encryptionKey);
      
      // Calculate expiration time
      const now = Date.now();
      const expiresAt = options.ttl ? now + options.ttl : undefined;
      
      // Encrypt metadata if requested
      let encryptedMetadata = null;
      if (options.metadata) {
        const metadataString = JSON.stringify(options.metadata);
        if (options.encryptMetadata) {
          encryptedMetadata = AESEncryption.encrypt(metadataString, this.encryptionKey).encryptedData;
        } else {
          encryptedMetadata = metadataString;
        }
      }

      // Store in database
      await this.database.execute(
        `INSERT INTO secure_storage (id, storage_key, encrypted_data, iv, tag, algorithm, ttl, created_at, expires_at, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          key,
          encryptionResult.encryptedData,
          encryptionResult.iv,
          encryptionResult.tag,
          encryptionResult.algorithm,
          options.ttl || null,
          now,
          expiresAt || null,
          encryptedMetadata
        ]
      );

      console.log(`🔐 Stored encrypted data for key: ${key}`);
      return id;

    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async retrieve<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM secure_storage WHERE storage_key = ? AND (expires_at IS NULL OR expires_at > ?)',
        [key, Date.now()]
      );

      if (result.length === 0) {
        return null;
      }

      const item = result[0];

      // Decrypt the data
      const decryptionResult = AESEncryption.decrypt(
        item.encrypted_data,
        this.encryptionKey,
        item.iv,
        item.tag
      );

      if (!decryptionResult.success) {
        console.error('Failed to decrypt stored data');
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decryptionResult.decryptedData);
      } catch {
        return decryptionResult.decryptedData as T;
      }

    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  /**
   * Retrieve with metadata
   */
  async retrieveWithMetadata<T = any>(key: string): Promise<{ data: T | null; metadata: any; expiresAt?: number }> {
    try {
      const result = await this.database.query(
        'SELECT * FROM secure_storage WHERE storage_key = ? AND (expires_at IS NULL OR expires_at > ?)',
        [key, Date.now()]
      );

      if (result.length === 0) {
        return { data: null, metadata: null };
      }

      const item = result[0];

      // Decrypt the data
      const decryptionResult = AESEncryption.decrypt(
        item.encrypted_data,
        this.encryptionKey,
        item.iv,
        item.tag
      );

      if (!decryptionResult.success) {
        return { data: null, metadata: null };
      }

      // Parse data
      let data: T;
      try {
        data = JSON.parse(decryptionResult.decryptedData);
      } catch {
        data = decryptionResult.decryptedData as T;
      }

      // Parse metadata
      let metadata = null;
      if (item.metadata) {
        try {
          metadata = JSON.parse(item.metadata);
        } catch {
          metadata = item.metadata;
        }
      }

      return {
        data,
        metadata,
        expiresAt: item.expires_at
      };

    } catch (error) {
      console.error('Failed to retrieve data with metadata:', error);
      return { data: null, metadata: null };
    }
  }

  /**
   * Update existing stored data
   */
  async update(key: string, data: any, options: StorageOptions = {}): Promise<boolean> {
    try {
      // Check if item exists
      const existing = await this.database.query(
        'SELECT id FROM secure_storage WHERE storage_key = ?',
        [key]
      );

      if (existing.length === 0) {
        return false;
      }

      // Store new data (this will overwrite the existing)
      await this.store(key, data, options);
      return true;

    } catch (error) {
      console.error('Failed to update stored data:', error);
      return false;
    }
  }

  /**
   * Delete stored data
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.database.execute(
        'DELETE FROM secure_storage WHERE storage_key = ?',
        [key]
      );

      console.log(`🗑️ Deleted encrypted data for key: ${key}`);
      return true;

    } catch (error) {
      console.error('Failed to delete stored data:', error);
      return false;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.database.query(
        'SELECT 1 FROM secure_storage WHERE storage_key = ? AND (expires_at IS NULL OR expires_at > ?)',
        [key, Date.now()]
      );

      return result.length > 0;

    } catch (error) {
      console.error('Failed to check if key exists:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number | null> {
    try {
      const result = await this.database.query(
        'SELECT expires_at FROM secure_storage WHERE storage_key = ?',
        [key]
      );

      if (result.length === 0) {
        return null;
      }

      const expiresAt = result[0].expires_at;
      if (!expiresAt) {
        return null; // No expiration
      }

      const ttl = expiresAt - Date.now();
      return ttl > 0 ? ttl : 0; // Return 0 if expired

    } catch (error) {
      console.error('Failed to get TTL:', error);
      return null;
    }
  }

  /**
   * Extend TTL for a key
   */
  async extendTTL(key: string, additionalTTL: number): Promise<boolean> {
    try {
      const result = await this.database.query(
        'SELECT expires_at FROM secure_storage WHERE storage_key = ?',
        [key]
      );

      if (result.length === 0) {
        return false;
      }

      const currentExpiresAt = result[0].expires_at;
      const newExpiresAt = currentExpiresAt ? currentExpiresAt + additionalTTL : Date.now() + additionalTTL;

      await this.database.execute(
        'UPDATE secure_storage SET expires_at = ? WHERE storage_key = ?',
        [newExpiresAt, key]
      );

      return true;

    } catch (error) {
      console.error('Failed to extend TTL:', error);
      return false;
    }
  }

  /**
   * Clean up expired items
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await this.database.execute(
        'DELETE FROM secure_storage WHERE expires_at IS NOT NULL AND expires_at <= ?',
        [Date.now()]
      );

      const deletedCount = result.changes || 0;
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired secure storage items`);
      }

      return deletedCount;

    } catch (error) {
      console.error('Failed to cleanup expired items:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    expiredItems: number;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const totalResult = await this.database.query('SELECT COUNT(*) as count FROM secure_storage');
      const expiredResult = await this.database.query(
        'SELECT COUNT(*) as count FROM secure_storage WHERE expires_at IS NOT NULL AND expires_at <= ?',
        [Date.now()]
      );
      const sizeResult = await this.database.query(
        'SELECT AVG(LENGTH(encrypted_data)) as avg_size FROM secure_storage'
      );

      return {
        totalItems: totalResult[0].count,
        expiredItems: expiredResult[0].count,
        totalSize: 0, // Would need to calculate actual size
        averageSize: sizeResult[0].avg_size || 0
      };

    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalItems: 0,
        expiredItems: 0,
        totalSize: 0,
        averageSize: 0
      };
    }
  }

  /**
   * Create secure storage table
   */
  private async createSecureStorageTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS secure_storage (
        id TEXT PRIMARY KEY,
        storage_key TEXT UNIQUE NOT NULL,
        encrypted_data TEXT NOT NULL,
        iv TEXT NOT NULL,
        tag TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        ttl INTEGER,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        metadata TEXT,
        INDEX idx_storage_key (storage_key),
        INDEX idx_expires_at (expires_at)
      )
    `;

    await this.database.execute(createTableSQL);
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpired();
      } catch (error) {
        console.error('Cleanup interval error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
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
    console.log('🔐 Secure Storage Service destroyed');
  }

  /**
   * Store photo with 24-hour TTL
   */
  async storePhoto(photoPath: string, metadata?: any): Promise<string> {
    try {
      const photoKey = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const photoMetadata = {
        ...metadata,
        type: 'photo',
        originalPath: photoPath,
        storedAt: new Date().toISOString(),
      };

      await this.store(photoKey, photoPath, {
        ttl,
        metadata: photoMetadata,
        encryptMetadata: true,
      });

      console.log(`📸 Photo stored with 24-hour TTL: ${photoKey}`);
      return photoKey;
    } catch (error) {
      console.error('Failed to store photo:', error);
      throw error;
    }
  }

  /**
   * Get all photos that will expire soon (within 1 hour)
   */
  async getPhotosExpiringSoon(): Promise<any[]> {
    try {
      const oneHourFromNow = Date.now() + 60 * 60 * 1000;
      
      const result = await this.database.query(
        `SELECT * FROM secure_storage 
         WHERE storage_key LIKE 'photo_%' 
         AND expires_at IS NOT NULL 
         AND expires_at < ?
         ORDER BY expires_at ASC`,
        [oneHourFromNow]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Failed to get expiring photos:', error);
      throw error;
    }
  }

  /**
   * Clean up expired photos specifically
   */
  async cleanupExpiredPhotos(): Promise<number> {
    try {
      const result = await this.database.execute(
        `DELETE FROM secure_storage 
         WHERE storage_key LIKE 'photo_%' 
         AND expires_at IS NOT NULL 
         AND expires_at < ?`,
        [Date.now()]
      );

      console.log(`📸 Cleaned up ${result.changes} expired photos`);
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup expired photos:', error);
      throw error;
    }
  }

  /**
   * Get photo expiration status
   */
  async getPhotoExpirationStatus(photoKey: string): Promise<{
    isExpired: boolean;
    expiresAt?: number;
    timeRemaining?: number;
  }> {
    try {
      const result = await this.database.query(
        `SELECT expires_at FROM secure_storage WHERE storage_key = ?`,
        [photoKey]
      );

      if (!result.rows || result.rows.length === 0) {
        return { isExpired: true };
      }

      const expiresAt = result.rows[0].expires_at;
      if (!expiresAt) {
        return { isExpired: false };
      }

      const now = Date.now();
      const isExpired = expiresAt < now;
      const timeRemaining = isExpired ? 0 : expiresAt - now;

      return {
        isExpired,
        expiresAt,
        timeRemaining,
      };
    } catch (error) {
      console.error('Failed to get photo expiration status:', error);
      throw error;
    }
  }
}

export default SecureStorageService;
