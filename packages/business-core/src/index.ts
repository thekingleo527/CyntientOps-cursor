/**
 * 🏢 Business Core Package - Main Export
 * Mirrors: CyntientOps/Services/Core/ServiceContainer.swift
 * Purpose: Core business logic, services, and managers
 */

// Services
export { TaskService } from './services/TaskService';
export { WorkerService } from './services/WorkerService';
export { BuildingService } from './services/BuildingService';
export { ClientService } from './services/ClientService';
export { OperationalDataService } from './services/OperationalDataService';
export { ComplianceService } from './services/ComplianceService';
export { DashboardSyncService } from './services/DashboardSyncService';

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

// Types
export type {
  ServiceContainerConfig,
  TaskAssignmentResult,
  ComplianceStatus,
  PerformanceMetrics
} from './types';