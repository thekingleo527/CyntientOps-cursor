import { DatabaseManager } from '@cyntientops/database';

type CacheValue = any;

export class CacheManager {
  private static instance: CacheManager;
  private db: DatabaseManager;

  private constructor(database: DatabaseManager) {
    this.db = database;
  }

  public static getInstance(database: DatabaseManager): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(database);
    }
    return CacheManager.instance;
  }

  public async get<T = CacheValue>(key: string): Promise<T | null> {
    try {
      const rows = await this.db.query<any>(
        `SELECT cache_value, expires_at FROM cache_entries WHERE cache_key = ? LIMIT 1`,
        [key]
      );
      if (!rows || rows.length === 0) return null;
      const row = rows[0];
      if (row.expires_at) {
        const expires = new Date(row.expires_at).getTime();
        if (Date.now() > expires) {
          await this.delete(key);
          return null;
        }
      }
      return JSON.parse(row.cache_value) as T;
    } catch {
      return null;
    }
  }

  public async set<T = CacheValue>(key: string, value: T, ttlMs?: number): Promise<void> {
    const now = new Date();
    const expiresAt = ttlMs ? new Date(now.getTime() + ttlMs).toISOString() : null;
    const json = JSON.stringify(value ?? null);
    const id = `${key}`;
    await this.db.execute(
      `INSERT INTO cache_entries (id, cache_key, cache_value, expires_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(cache_key) DO UPDATE SET cache_value=excluded.cache_value, expires_at=excluded.expires_at, updated_at=CURRENT_TIMESTAMP`,
      [id, key, json, expiresAt]
    );
  }

  public async delete(key: string): Promise<void> {
    await this.db.execute(`DELETE FROM cache_entries WHERE cache_key = ?`, [key]);
  }

  public async clear(): Promise<void> {
    await this.db.execute(`DELETE FROM cache_entries`, []);
  }
}

