/**
 * 🏢 Business Core Package - Main Export
 * Mirrors: CyntientOps/Services/Core/ServiceContainer.swift
 * Purpose: Core business logic, services, and managers
 */

// Services
export { Logger, LogLevel } from './services/LoggingService';
export type { LogEntry } from './services/LoggingService';
export { SupabaseService, supabase } from './services/SupabaseService';
export type { SupabaseHealthCheck, SupabaseQueryResult } from './services/SupabaseService';
export { ProductionMonitoring, monitoring } from './services/ProductionMonitoring';
export type { PerformanceMetric, ErrorReport, AnalyticsEvent } from './services/ProductionMonitoring';
export { TaskService } from './services/TaskService';
export { WorkerService } from './services/WorkerService';
export { BuildingService } from './services/BuildingService';
export { ClientService } from './services/ClientService';
export { OperationalDataService } from './services/OperationalDataService';
export { ComplianceService } from './services/ComplianceService';
export { AuthService } from './services/AuthService';
export { AuthenticationService } from './services/AuthenticationService';
export type { AuthenticatedUser, UserCredentials, LoginResult } from './services/AuthenticationService';
export { RouteManager } from './services/RouteManager';
export { NovaAIBrainService } from './services/NovaAIBrainService';
export type {
  NovaInsight,
  NovaAnalysis,
  NovaContext,
  NovaPrompt,
  NovaResponse,
  NovaAction
} from './services/NovaAIBrainService';
export { PerformanceOptimizer } from './services/PerformanceOptimizer';
export { SecurityManager } from './services/SecurityManager';
export { ProductionManager } from './services/ProductionManager';
export { BuildingInfrastructureCatalog } from './services/BuildingInfrastructureCatalog';
export { RealTimeOrchestrator } from './services/RealTimeOrchestrator';
export { SystemDateTimeService, systemDateTime } from './services/SystemDateTimeService';
export { SmartPhotoRequirementService, smartPhotoRequirement, PhotoCategory, TaskCategory } from './services/SmartPhotoRequirementService';
export { IntelligentPhotoStorageService, intelligentPhotoStorage } from './services/IntelligentPhotoStorageService';
export { WeatherTriggeredTaskManager } from './services/WeatherTriggeredTaskManager';
export { AdvancedVoiceProcessingService } from './services/AdvancedVoiceProcessingService';
export { IntelligenceService } from './services/IntelligenceService';
export { AlertsService } from './services/AlertsService';
export { BuildingMetricsService } from './services/BuildingMetricsService';
export { ComplianceService } from './services/ComplianceService';
export { NYCService } from './services/NYCService';
export { AnalyticsService } from './services/AnalyticsService';
export { NotesService } from './services/NotesService';
export { InventoryService } from './services/InventoryService';
export { VendorAccessService } from './services/VendorAccessService';
export { SystemService } from './services/SystemService';
export { PropertyDataService } from './services/PropertyDataService';
export type { PropertyDetails } from './services/PropertyDataService';
export { RealDataService } from './services/RealDataService';
export { default as RealDataServiceDefault } from './services/RealDataService';
export { TagSuggestionService } from './services/TagSuggestionService';
export { SecureStorageService } from './services/SecureStorageService';
export { CacheManager } from './services/CacheManager';
export { OfflineTaskManager } from './services/OfflineTaskManager';
export { OptimizedWebSocketManager } from './services/OptimizedWebSocketManager';
export { BackupManager } from './services/BackupManager';
export { IntelligenceService } from './services/IntelligenceService';
export { RealTimeSyncIntegration } from './services/RealTimeSyncIntegration';
export { PushNotificationService } from './services/PushNotificationService';
export { TaskCompletionService } from './services/TaskCompletionService';
export { TaskNotificationService } from './services/TaskNotificationService';
export type { NotificationConfig, ScheduledNotification } from './services/TaskNotificationService';

// Service Container
export { ServiceContainer } from './ServiceContainer';

// ViewModel Integration Helpers
export {
  useViewModel,
  useService,
  createActionHandler,
  useDebouncedViewModelUpdate,
} from './helpers/ViewModelIntegration';

// NYC API Integration Helpers
export { NYCAPIIntegration, nycAPI } from './helpers/NYCAPIIntegration';
export type { APITestResult, NYCAPIConfig } from './helpers/NYCAPIIntegration';

// Supabase Configuration
export { SUPABASE_CONFIG, getSupabaseConfig } from './config/supabase.config';
export type { SupabaseConfig } from './config/supabase.config';
export { getSupabaseClient, resetSupabaseClient, isSupabaseConfigured } from './config/supabase.client';

// Types
export type { ServiceContainerConfig } from './ServiceContainer';
export type {
  RoutineTaskCompletion,
  TaskCompletionInput,
  TaskCompletionStats,
  WorkerCompletionHistory,
  BuildingCompletionHistory,
  TaskCompletionPhoto
} from './types/TaskCompletion';

// Operational Data Types
export type {
  OperationalDataTaskAssignment,
  WorkerRoutineSchedule,
  WorkerScheduleItem,
  CachedBuilding,
  CachedWorker,
  OperationalEvent
} from './OperationalDataManager';
export { OperationalDataManager, operationalDataManager, CanonicalIDs } from './OperationalDataManager';
