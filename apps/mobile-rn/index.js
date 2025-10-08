// Polyfill secure random before anything else
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import App from './App';

// Bridge selected app.json extras into process.env for runtime config (RN)
try {
  const extra = (Constants?.expoConfig && Constants.expoConfig.extra) || {};
  const keys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_AI_ENABLED',
    'SUPABASE_REALTIME_ENABLED',
    'SUPABASE_ANALYTICS_ENABLED',
    'DATABASE_PATH',
    'WEBSOCKET_URL',
    'ENABLE_OFFLINE_MODE',
    'ENABLE_REALTIME_SYNC',
    'ENABLE_INTELLIGENCE',
    'ENABLE_WEATHER_INTEGRATION',
    'DEBUG',
    'LOG_LEVEL',
    'ENV',
  ];
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(extra, k) && typeof process !== 'undefined') {
      process.env[k] = String(extra[k]);
    }
  });
} catch {}

// Register the main component
registerRootComponent(App);
