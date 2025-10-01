/**
 * 🔧 Supabase Client
 * Singleton client for Supabase integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase.config';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * @returns {SupabaseClient} The Supabase client instance
 * @throws {Error} If Supabase configuration is invalid
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getSupabaseConfig();

  // Validate configuration
  if (!config.url || !config.anonKey) {
    throw new Error(
      'Supabase configuration is invalid. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment variables.'
    );
  }

  // Create the client
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseClient;
};

/**
 * Reset the Supabase client (useful for testing)
 */
export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};

/**
 * Check if Supabase is properly configured
 * @returns {boolean} True if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  try {
    const config = getSupabaseConfig();
    return !!(config.url && config.anonKey);
  } catch {
    return false;
  }
};
