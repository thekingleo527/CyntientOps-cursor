/**
 * 🔧 Supabase Configuration
 * Configuration for Supabase integration with Nova AI system
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enableAI: boolean;
  enableRealtime: boolean;
  enableAnalytics: boolean;
}

export const SUPABASE_CONFIG: SupabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  enableAI: process.env.SUPABASE_AI_ENABLED === 'true' || true,
  enableRealtime: process.env.SUPABASE_REALTIME_ENABLED === 'true' || true,
  enableAnalytics: process.env.SUPABASE_ANALYTICS_ENABLED === 'true' || true
};

export const getSupabaseConfig = (): SupabaseConfig => {
  return SUPABASE_CONFIG;
};

