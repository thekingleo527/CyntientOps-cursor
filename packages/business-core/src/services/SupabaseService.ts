/**
 * 🗄️ Supabase Service
 * High-level service for Supabase operations
 * Wraps the client with business logic and error handling
 */

import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.client';
import { Logger } from './LoggingService';

export interface SupabaseHealthCheck {
  connected: boolean;
  version?: string;
  latency?: number;
  error?: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

export class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Test Supabase connection and get health status
   */
  async healthCheck(): Promise<SupabaseHealthCheck> {
    const startTime = Date.now();

    try {
      if (!isSupabaseConfigured()) {
        return {
          connected: false,
          error: 'Supabase not configured. Check environment variables.',
        };
      }

      const client = getSupabaseClient();

      // Try a simple query to test connection
      const { data, error } = await client
        .from('_health')
        .select('*')
        .limit(1)
        .maybeSingle();

      const latency = Date.now() - startTime;

      if (error) {
        // If health table doesn't exist, try getting session (auth check)
        const { data: sessionData } = await client.auth.getSession();

        if (sessionData) {
          Logger.info('Supabase connected (no health table)', { latency }, 'SupabaseService');
          return {
            connected: true,
            latency,
          };
        }

        Logger.warn('Supabase connection check failed', error, 'SupabaseService');
        return {
          connected: false,
          error: error.message,
        };
      }

      Logger.info('Supabase connected successfully', { latency }, 'SupabaseService');
      return {
        connected: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      Logger.error('Supabase health check failed', error, 'SupabaseService');
      return {
        connected: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generic query with error handling and logging
   */
  async query<T>(
    table: string,
    operation: (client: ReturnType<typeof getSupabaseClient>) => Promise<any>,
    context: string = 'query'
  ): Promise<SupabaseQueryResult<T>> {
    try {
      const client = getSupabaseClient();
      const result = await operation(client);

      if (result.error) {
        Logger.error(`Supabase ${context} failed`, result.error, 'SupabaseService');
        return {
          data: null,
          error: new Error(result.error.message),
        };
      }

      Logger.debug(`Supabase ${context} successful`, { table }, 'SupabaseService');
      return {
        data: result.data as T,
        error: null,
        count: result.count,
      };
    } catch (error) {
      Logger.error(`Supabase ${context} exception`, error, 'SupabaseService');
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Insert data with error handling
   */
  async insert<T>(table: string, data: any): Promise<SupabaseQueryResult<T>> {
    return this.query<T>(
      table,
      (client) => client.from(table).insert(data).select(),
      `insert into ${table}`
    );
  }

  /**
   * Update data with error handling
   */
  async update<T>(
    table: string,
    id: string,
    data: any
  ): Promise<SupabaseQueryResult<T>> {
    return this.query<T>(
      table,
      (client) => client.from(table).update(data).eq('id', id).select(),
      `update ${table}`
    );
  }

  /**
   * Delete data with error handling
   */
  async delete<T>(table: string, id: string): Promise<SupabaseQueryResult<T>> {
    return this.query<T>(
      table,
      (client) => client.from(table).delete().eq('id', id).select(),
      `delete from ${table}`
    );
  }

  /**
   * Select data with error handling
   */
  async select<T>(
    table: string,
    query?: string,
    filter?: Record<string, any>
  ): Promise<SupabaseQueryResult<T[]>> {
    return this.query<T[]>(
      table,
      async (client) => {
        let queryBuilder = client.from(table).select(query || '*');

        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }

        return queryBuilder;
      },
      `select from ${table}`
    );
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string; cacheControl?: string }
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client.storage
        .from(bucket)
        .upload(path, file, options);

      if (error) {
        Logger.error('File upload failed', error, 'SupabaseService');
        return { url: null, error: new Error(error.message) };
      }

      // Get public URL
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);

      Logger.info('File uploaded successfully', { bucket, path }, 'SupabaseService');
      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      Logger.error('File upload exception', error, 'SupabaseService');
      return {
        url: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToTable<T>(
    table: string,
    callback: (payload: T) => void,
    filter?: Record<string, any>
  ) {
    const client = getSupabaseClient();

    const channel = client
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          Logger.debug('Real-time update received', { table }, 'SupabaseService');
          callback(payload as T);
        }
      );

    channel.subscribe((status) => {
      Logger.info('Subscription status', { table, status }, 'SupabaseService');
    });

    return () => {
      channel.unsubscribe();
    };
  }
}

// Export singleton
export const supabase = SupabaseService.getInstance();
