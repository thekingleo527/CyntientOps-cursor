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

  // WebSocket
  websocketUrl: getEnvVar('WEBSOCKET_URL', 'ws://localhost:8080/ws'),

  // NYC APIs
  dsnyApiKey: getEnvVar('DSNY_API_KEY', 'P1XfR3qQk9vN2wB8yH4mJ7pL5sK6tG9zC0dF2aE8'),
  hpdApiKey: getEnvVar('HPD_API_KEY', 'd4f7b6c9e2a1f8h5k3j9m6n0q2w8r7t5y1u4i8o6'),
  dobApiKey: getEnvVar('DOB_API_KEY', '3e9f1a5d7c2b8h6k4j0m9n3q5w7r1t8y2u6i4o0p'),
  weatherApiKey: getEnvVar('WEATHER_API_KEY', ''),

  // Feature Flags
  enableOfflineMode: getBoolEnvVar('ENABLE_OFFLINE_MODE', true),
  enableRealTimeSync: getBoolEnvVar('ENABLE_REALTIME_SYNC', true),
  enableIntelligence: getBoolEnvVar('ENABLE_INTELLIGENCE', true),
  enableWeatherIntegration: getBoolEnvVar('ENABLE_WEATHER_INTEGRATION', true),

  // Debug
  debug: getBoolEnvVar('DEBUG', __DEV__),
  logLevel: (getEnvVar('LOG_LEVEL', 'info') as AppConfig['logLevel']),

  // Environment
  env: (getEnvVar('ENV', __DEV__ ? 'development' : 'production') as AppConfig['env']),
};

export default config;
