/**
 * 🏢 Business Core Package - Main Export
 * Mirrors: CyntientOps/Services/Core/ServiceContainer.swift
 * Purpose: Core business logic, services, and managers
 */

// Services
export { Logger, LogLevel } from './services/LoggingService';
export type { LogEntry } from './services/LoggingService';
export { TaskService } from './services/TaskService';
export { WorkerService } from './services/WorkerService';
export { BuildingService } from './services/BuildingService';
export { ClientService } from './services/ClientService';
export { OperationalDataService } from './services/OperationalDataService';
export { ComplianceService } from './services/ComplianceService';
export { AuthService } from './services/AuthService';
export { RouteManager } from './services/RouteManager';
export { NovaAPIService } from './services/NovaAPIService';
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
export { AnalyticsEngine } from './services/AnalyticsEngine';
export { SecurityManager } from './services/SecurityManager';
export { ProductionManager } from './services/ProductionManager';
export { BuildingInfrastructureCatalog } from './services/BuildingInfrastructureCatalog';
export { RealTimeOrchestrator } from './services/RealTimeOrchestrator';
export { SystemDateTimeService, systemDateTime } from './services/SystemDateTimeService';
export { SmartPhotoRequirementService, smartPhotoRequirement, PhotoCategory, TaskCategory } from './services/SmartPhotoRequirementService';
export { IntelligentPhotoStorageService, intelligentPhotoStorage } from './services/IntelligentPhotoStorageService';
export { WeatherTriggeredTaskManager } from './services/WeatherTriggeredTaskManager';
export { RouteOptimizationService } from './services/RouteOptimizationService';
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

// Managers
export { ClockInManager } from './managers/ClockInManager';
export { LocationManager } from './managers/LocationManager';
export { NotificationManager } from './managers/NotificationManager';
export { PhotoEvidenceManager } from './managers/PhotoEvidenceManager';
export { WeatherTaskManager } from './managers/WeatherTaskManager';

// Business Logic
export { TaskAssignmentEngine } from './engines/TaskAssignmentEngine';
export { ComplianceEngine } from './engines/ComplianceEngine';
export { PerformanceEngine } from './engines/PerformanceEngine';

// Service Container
export { ServiceContainer } from './ServiceContainer';

// Supabase Configuration
export { SUPABASE_CONFIG, getSupabaseConfig } from './config/supabase.config';
export type { SupabaseConfig } from './config/supabase.config';
export { getSupabaseClient, resetSupabaseClient, isSupabaseConfigured } from './config/supabase.client';

// Types
export type {
  ServiceContainerConfig,
  TaskAssignmentResult,
  ComplianceStatus,
  PerformanceMetrics
} from './types';