/**
 * Unified Design Tokens - Colors
 * Single source of truth for all colors across the app
 * Consistent regardless of user role, location, weather, or time
 */

export const Colors = {
  // Base Colors - Consistent across all users
  primary: '#3B82F6',      // Blue - Primary action color
  secondary: '#6B7280',    // Gray - Secondary actions
  success: '#10B981',      // Green - Success states
  warning: '#F59E0B',      // Orange - Warning states
  error: '#EF4444',        // Red - Error states
  info: '#06B6D4',         // Cyan - Information states

  // Background Colors - Dark theme base
  background: {
    primary: '#0A0A0A',    // Main background
    secondary: '#0F0F0F',  // Card backgrounds
    tertiary: '#1A1A1A',   // Elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.5)' // Modal overlays
  },

  // Text Colors - Consistent hierarchy
  text: {
    primary: '#FFFFFF',     // Primary text
    secondary: '#D1D5DB',   // Secondary text
    tertiary: '#9CA3AF',    // Tertiary text
    disabled: '#6B7280',    // Disabled text
    inverse: '#000000'      // Text on light backgrounds
  },

  // Glass Morphism Colors
  glass: {
    overlay: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },

  // Status Colors - Context-aware but consistent
  status: {
    online: '#10B981',      // Online/Active
    offline: '#6B7280',     // Offline/Inactive
    pending: '#F59E0B',     // Pending/Waiting
    completed: '#10B981',   // Completed/Success
    overdue: '#EF4444',     // Overdue/Urgent
    scheduled: '#3B82F6'    // Scheduled/Planned
  },

  // Nova AI Colors - Consistent AI branding
  nova: {
    idle: '#3B82F6',        // Default Nova state
    thinking: '#8B5CF6',    // Processing state
    active: '#10B981',      // Active state
    urgent: '#EF4444',      // Urgent state
    error: '#F59E0B'        // Error state
  },

  // Weather Colors - Context-aware but consistent
  weather: {
    sunny: '#F59E0B',       // Sunny weather
    cloudy: '#6B7280',      // Cloudy weather
    rainy: '#3B82F6',       // Rainy weather
    snowy: '#E5E7EB',       // Snowy weather
    stormy: '#7C3AED'       // Stormy weather
  },

  // Time-based Colors - Subtle variations
  time: {
    morning: '#F59E0B',     // Morning (6-12)
    afternoon: '#3B82F6',   // Afternoon (12-18)
    evening: '#8B5CF6',     // Evening (18-24)
    night: '#1F2937'        // Night (0-6)
  },

  // Building Status Colors - Consistent across all buildings
  building: {
    active: '#10B981',      // Active building
    maintenance: '#F59E0B', // Maintenance mode
    closed: '#6B7280',      // Closed building
    emergency: '#EF4444'    // Emergency state
  },

  // Task Priority Colors - Consistent priority system
  priority: {
    low: '#6B7280',         // Low priority
    normal: '#3B82F6',      // Normal priority
    high: '#F59E0B',        // High priority
    urgent: '#EF4444',      // Urgent priority
    critical: '#DC2626',    // Critical priority
    emergency: '#991B1B'    // Emergency priority
  },

  // Compliance Colors - Consistent compliance status
  compliance: {
    compliant: '#10B981',   // Fully compliant
    warning: '#F59E0B',     // Compliance warning
    violation: '#EF4444',   // Compliance violation
    pending: '#6B7280'      // Pending review
  }
} as const;

// Helper function to get time-based color
export const getTimeBasedColor = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return Colors.time.morning;
  if (hour >= 12 && hour < 18) return Colors.time.afternoon;
  if (hour >= 18 && hour < 24) return Colors.time.evening;
  return Colors.time.night;
};

// Helper function to get weather-based color
export const getWeatherBasedColor = (weatherType: string): string => {
  switch (weatherType.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return Colors.weather.sunny;
    case 'cloudy':
    case 'overcast':
      return Colors.weather.cloudy;
    case 'rainy':
    case 'rain':
      return Colors.weather.rainy;
    case 'snowy':
    case 'snow':
      return Colors.weather.snowy;
    case 'stormy':
    case 'thunderstorm':
      return Colors.weather.stormy;
    default:
      return Colors.primary;
  }
};

// Helper function to get priority color
export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'low':
      return Colors.priority.low;
    case 'normal':
    case 'medium':
      return Colors.priority.normal;
    case 'high':
      return Colors.priority.high;
    case 'urgent':
      return Colors.priority.urgent;
    case 'critical':
      return Colors.priority.critical;
    case 'emergency':
      return Colors.priority.emergency;
    default:
      return Colors.priority.normal;
  }
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'completed':
      return Colors.status.online;
    case 'offline':
    case 'inactive':
      return Colors.status.offline;
    case 'pending':
    case 'waiting':
      return Colors.status.pending;
    case 'overdue':
    case 'urgent':
      return Colors.status.overdue;
    case 'scheduled':
    case 'planned':
      return Colors.status.scheduled;
    default:
      return Colors.status.offline;
  }
};
