
import { DatabaseManager } from '@cyntientops/database';
import * as CryptoJS from 'crypto-js';

interface CacheEntry {
  id: string;
  cache_key: string;
  cache_value: string;
  expires_at: string;
  encrypted: number;
  created_at: string;
  updated_at: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private databaseManager: DatabaseManager;
  private encryptionKey: string;

  private constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
    this.encryptionKey = this.getEncryptionKey();
  }

  public static getInstance(databaseManager: DatabaseManager): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(databaseManager);
    }
    return CacheManager.instance;
  }

  private getEncryptionKey(): string {
    const key = process.env.CACHE_ENCRYPTION_KEY || 'CyntientOps-Cache-Key-2025-Secure';
    return CryptoJS.SHA256(key).toString();
  }

  private encryptValue(value: string): string {
    return CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
  }

  private decryptValue(encryptedValue: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'api_key', 'session', 'private', 'confidential'
    ];
    return sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern));
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const query = 'SELECT * FROM cache_entries WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > ?)';
      const params = [key, new Date().toISOString()];
      const result = await this.databaseManager.query<CacheEntry>(query, params);

      if (result.length > 0) {
        const entry = result[0];
        let cacheValue = entry.cache_value;
        
        // Decrypt if the entry is encrypted
        if (entry.encrypted === 1) {
          cacheValue = this.decryptValue(entry.cache_value);
        }
        
        return JSON.parse(cacheValue) as T;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl: number | null = null): Promise<void> {
    try {
      const expires_at = ttl ? new Date(Date.now() + ttl).toISOString() : null;
      const serializedValue = JSON.stringify(value);
      
      // Encrypt sensitive data
      const isSensitive = this.isSensitiveKey(key);
      const finalValue = isSensitive ? this.encryptValue(serializedValue) : serializedValue;
      const encrypted = isSensitive ? 1 : 0;
      
      const query = `
        INSERT OR REPLACE INTO cache_entries 
        (cache_key, cache_value, expires_at, encrypted, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      const params = [key, finalValue, expires_at, encrypted];
      await this.databaseManager.execute(query, params);
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  public async clear(key: string): Promise<void> {
    try {
      const query = 'DELETE FROM cache_entries WHERE cache_key = ?';
      const params = [key];
      await this.databaseManager.execute(query, params);
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  public async clearAll(): Promise<void> {
    try {
      const query = 'DELETE FROM cache_entries';
      await this.databaseManager.execute(query);
    } catch (error) {
      console.error('Cache clear all error:', error);
      throw error;
    }
  }

  public async clearExpired(): Promise<void> {
    try {
      const query = 'DELETE FROM cache_entries WHERE expires_at IS NOT NULL AND expires_at < ?';
      const params = [new Date().toISOString()];
      await this.databaseManager.execute(query, params);
    } catch (error) {
      console.error('Cache clear expired error:', error);
      throw error;
    }
  }

  public async getCacheStats(): Promise<{total: number, expired: number, encrypted: number}> {
    try {
      const totalQuery = 'SELECT COUNT(*) as count FROM cache_entries';
      const expiredQuery = 'SELECT COUNT(*) as count FROM cache_entries WHERE expires_at IS NOT NULL AND expires_at < ?';
      const encryptedQuery = 'SELECT COUNT(*) as count FROM cache_entries WHERE encrypted = 1';
      
      const [totalResult, expiredResult, encryptedResult] = await Promise.all([
        this.databaseManager.query<{count: number}>(totalQuery),
        this.databaseManager.query<{count: number}>(expiredQuery, [new Date().toISOString()]),
        this.databaseManager.query<{count: number}>(encryptedQuery)
      ]);
      
      return {
        total: totalResult[0]?.count || 0,
        expired: expiredResult[0]?.count || 0,
        encrypted: encryptedResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { total: 0, expired: 0, encrypted: 0 };
    }
  }
}
