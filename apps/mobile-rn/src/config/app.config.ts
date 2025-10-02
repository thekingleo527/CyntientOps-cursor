/**
 * 🔧 App Configuration
 * Central configuration for the CyntientOps mobile app
 */

import Constants from 'expo-constants';

interface AppConfig {
  // Database
  databasePath: string;

  // WebSocket
  websocketUrl: string;

  // NYC APIs
  dsnyApiKey: string;
  hpdApiKey: string;
  dobApiKey: string;
  weatherApiKey: string;

  // Feature Flags
  enableOfflineMode: boolean;
  enableRealTimeSync: boolean;
  enableIntelligence: boolean;
  enableWeatherIntegration: boolean;

  // Debug
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Environment
  env: 'development' | 'staging' | 'production';
}

// Get environment variables (from .env or expo config)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || Constants.expoConfig?.extra?.[key] || defaultValue;
};

const getBoolEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1';
};

export const config: AppConfig = {
  // Database
  databasePath: getEnvVar('DATABASE_PATH', 'cyntientops.db'),

  // WebSocket - Disabled for testing, will be enabled when backend is ready
  websocketUrl: getEnvVar('WEBSOCKET_URL'),

  // NYC APIs - Using public data sources, no API keys needed
  dsnyApiKey: getEnvVar('DSNY_API_KEY'),
  hpdApiKey: getEnvVar('HPD_API_KEY'),
  dobApiKey: getEnvVar('DOB_API_KEY'),
  weatherApiKey: getEnvVar('WEATHER_API_KEY'),

  // Feature Flags - Optimized for testing
  enableOfflineMode: getBoolEnvVar('ENABLE_OFFLINE_MODE', true),
  enableRealTimeSync: getBoolEnvVar('ENABLE_REALTIME_SYNC', false),
  enableIntelligence: getBoolEnvVar('ENABLE_INTELLIGENCE', true),
  enableWeatherIntegration: getBoolEnvVar('ENABLE_WEATHER_INTEGRATION', true),

  // Debug
  debug: getBoolEnvVar('DEBUG', false),
  logLevel: (getEnvVar('LOG_LEVEL', 'warn') as AppConfig['logLevel']),

  // Environment
  env: (getEnvVar('ENV', 'production') as AppConfig['env']),
};

export default config;
