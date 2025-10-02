
import { DatabaseManager } from '@cyntientops/database';

interface CacheEntry {
  id: string;
  cache_key: string;
  cache_value: string;
  expires_at: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private databaseManager: DatabaseManager;

  private constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
  }

  public static getInstance(databaseManager: DatabaseManager): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(databaseManager);
    }
    return CacheManager.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    const query = 'SELECT * FROM cache_entries WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > ?)';
    const params = [key, new Date().toISOString()];
    const result = await this.databaseManager.query<CacheEntry>(query, params);

    if (result.length > 0) {
      const entry = result[0];
      return JSON.parse(entry.cache_value) as T;
    }

    return null;
  }

  public async set<T>(key: string, value: T, ttl: number | null = null): Promise<void> {
    const expires_at = ttl ? new Date(Date.now() + ttl).toISOString() : null;
    const query = 'INSERT OR REPLACE INTO cache_entries (cache_key, cache_value, expires_at) VALUES (?, ?, ?)';
    const params = [key, JSON.stringify(value), expires_at];
    await this.databaseManager.execute(query, params);
  }

  public async clear(key: string): Promise<void> {
    const query = 'DELETE FROM cache_entries WHERE cache_key = ?';
    const params = [key];
    await this.databaseManager.execute(query, params);
  }

  public async clearAll(): Promise<void> {
    const query = 'DELETE FROM cache_entries';
    await this.databaseManager.execute(query);
  }
}
