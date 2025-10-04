/**
 * 🔄 Real-Time Compliance Configuration
 * Purpose: Configuration for real-time compliance monitoring
 * Last Updated: October 4, 2025
 */

export interface RealTimeComplianceConfig {
  // Polling configuration
  pollingInterval: number; // milliseconds between API calls
  maxPollingInterval: number; // maximum interval for backoff
  minPollingInterval: number; // minimum interval for aggressive monitoring
  
  // WebSocket configuration
  webSocketEnabled: boolean;
  webSocketUrl: string;
  webSocketReconnectInterval: number;
  
  // Push notification configuration
  pushNotificationsEnabled: boolean;
  notificationChannels: string[];
  
  // Building-specific configuration
  buildingIds: string[];
  priorityBuildings: string[]; // Buildings that need more frequent monitoring
  
  // API rate limiting
  apiRateLimit: number; // requests per minute
  apiTimeout: number; // milliseconds
  
  // Data retention
  updateHistoryDays: number;
  maxUpdatesPerBuilding: number;
  
  // Alert thresholds
  complianceScoreThresholds: {
    critical: number; // < 50
    warning: number; // < 70
    good: number; // < 90
    excellent: number; // >= 90
  };
  
  // Notification preferences
  notificationPreferences: {
    violationAdded: boolean;
    violationResolved: boolean;
    inspectionScheduled: boolean;
    complianceScoreChanged: boolean;
    emergencyAlerts: boolean;
  };
}

export const DEFAULT_REAL_TIME_COMPLIANCE_CONFIG: RealTimeComplianceConfig = {
  // Polling configuration - Start with 5-minute intervals
  pollingInterval: 5 * 60 * 1000, // 5 minutes
  maxPollingInterval: 30 * 60 * 1000, // 30 minutes
  minPollingInterval: 1 * 60 * 1000, // 1 minute
  
  // WebSocket configuration
  webSocketEnabled: true,
  webSocketUrl: 'wss://api.cyntientops.com/ws',
  webSocketReconnectInterval: 5000,
  
  // Push notification configuration
  pushNotificationsEnabled: true,
  notificationChannels: ['compliance', 'violations', 'inspections'],
  
  // Building-specific configuration
  buildingIds: ['6'], // 68 Perry Street
  priorityBuildings: ['6'], // 68 Perry Street needs priority monitoring
  
  // API rate limiting
  apiRateLimit: 100, // 100 requests per minute
  apiTimeout: 10000, // 10 seconds
  
  // Data retention
  updateHistoryDays: 30,
  maxUpdatesPerBuilding: 1000,
  
  // Alert thresholds
  complianceScoreThresholds: {
    critical: 50,
    warning: 70,
    good: 90,
    excellent: 90
  },
  
  // Notification preferences
  notificationPreferences: {
    violationAdded: true,
    violationResolved: true,
    inspectionScheduled: true,
    complianceScoreChanged: true,
    emergencyAlerts: true
  }
};

export const PRODUCTION_REAL_TIME_COMPLIANCE_CONFIG: RealTimeComplianceConfig = {
  // Polling configuration - Production settings
  pollingInterval: 2 * 60 * 1000, // 2 minutes for production
  maxPollingInterval: 15 * 60 * 1000, // 15 minutes
  minPollingInterval: 30 * 1000, // 30 seconds for critical buildings
  
  // WebSocket configuration
  webSocketEnabled: true,
  webSocketUrl: 'wss://api.cyntientops.com/ws',
  webSocketReconnectInterval: 3000,
  
  // Push notification configuration
  pushNotificationsEnabled: true,
  notificationChannels: ['compliance', 'violations', 'inspections', 'emergency'],
  
  // Building-specific configuration
  buildingIds: ['1', '3', '4', '5', '6', '7', '8', '9', '10'], // All J&M Realty buildings
  priorityBuildings: ['6'], // 68 Perry Street is priority
  
  // API rate limiting
  apiRateLimit: 200, // 200 requests per minute
  apiTimeout: 15000, // 15 seconds
  
  // Data retention
  updateHistoryDays: 90,
  maxUpdatesPerBuilding: 5000,
  
  // Alert thresholds
  complianceScoreThresholds: {
    critical: 50,
    warning: 70,
    good: 90,
    excellent: 90
  },
  
  // Notification preferences
  notificationPreferences: {
    violationAdded: true,
    violationResolved: true,
    inspectionScheduled: true,
    complianceScoreChanged: true,
    emergencyAlerts: true
  }
};

export const DEVELOPMENT_REAL_TIME_COMPLIANCE_CONFIG: RealTimeComplianceConfig = {
  // Polling configuration - Development settings
  pollingInterval: 10 * 60 * 1000, // 10 minutes for development
  maxPollingInterval: 60 * 60 * 1000, // 1 hour
  minPollingInterval: 2 * 60 * 1000, // 2 minutes
  
  // WebSocket configuration
  webSocketEnabled: false, // Disabled for development
  webSocketUrl: 'ws://localhost:8080/ws',
  webSocketReconnectInterval: 10000,
  
  // Push notification configuration
  pushNotificationsEnabled: false, // Disabled for development
  notificationChannels: ['compliance'],
  
  // Building-specific configuration
  buildingIds: ['6'], // Only 68 Perry Street for development
  priorityBuildings: ['6'],
  
  // API rate limiting
  apiRateLimit: 50, // 50 requests per minute
  apiTimeout: 5000, // 5 seconds
  
  // Data retention
  updateHistoryDays: 7,
  maxUpdatesPerBuilding: 100,
  
  // Alert thresholds
  complianceScoreThresholds: {
    critical: 50,
    warning: 70,
    good: 90,
    excellent: 90
  },
  
  // Notification preferences
  notificationPreferences: {
    violationAdded: true,
    violationResolved: false,
    inspectionScheduled: false,
    complianceScoreChanged: true,
    emergencyAlerts: true
  }
};

export function getRealTimeComplianceConfig(environment: 'development' | 'production' | 'default' = 'default'): RealTimeComplianceConfig {
  switch (environment) {
    case 'development':
      return DEVELOPMENT_REAL_TIME_COMPLIANCE_CONFIG;
    case 'production':
      return PRODUCTION_REAL_TIME_COMPLIANCE_CONFIG;
    default:
      return DEFAULT_REAL_TIME_COMPLIANCE_CONFIG;
  }
}
