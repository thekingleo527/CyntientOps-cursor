import { DatabaseManager } from '@cyntientops/database';

export class ComplianceCache {
  constructor(private db: DatabaseManager) {}

  async get<T>(key: string): Promise<T | null> {
    const rows = await this.db.query<any>(
      `SELECT cache_value, expires_at FROM cache_entries WHERE cache_key = ? LIMIT 1`,
      [key]
    );
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    if (row.expires_at) {
      const expires = new Date(row.expires_at).getTime();
      if (Date.now() > expires) {
        await this.invalidate(key);
        return null;
      }
    }
    return JSON.parse(row.cache_value);
  }

  async set<T>(key: string, value: T, ttlMs: number = 15 * 60 * 1000): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    const json = JSON.stringify(value ?? null);
    await this.db.execute(
      `INSERT INTO cache_entries (id, cache_key, cache_value, expires_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(cache_key) DO UPDATE SET cache_value=excluded.cache_value, expires_at=excluded.expires_at, updated_at=CURRENT_TIMESTAMP`,
      [key, key, json, expiresAt]
    );
  }

  async invalidate(key: string): Promise<void> {
    await this.db.execute(`DELETE FROM cache_entries WHERE cache_key = ?`, [key]);
  }
}

