/**
 * 🏗️ CORE TYPES - Zod Schemas
 * Ported from: CyntientOps/Core/Types/CoreTypes.swift
 * Purpose: Complete type safety and validation for all CyntientOps data models
 *
 * CRITICAL: These schemas must exactly match the Swift CoreTypes implementation
 */

import { z } from 'zod';
import { WorkerId, BuildingId, TaskCategory, SkillLevel, RecurrenceType } from './canonical-ids';

// MARK: - User & Worker Types

export const UserRoleSchema = z.enum(['superAdmin', 'admin', 'manager', 'worker', 'client']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  workerId: z.string(), // WorkerId type
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const WorkerStatusSchema = z.enum(['Available', 'Clocked In', 'Clocked Out', 'On Break', 'Offline']);
export type WorkerStatus = z.infer<typeof WorkerStatusSchema>;

export const ClockStatusSchema = z.enum(['clockedIn', 'clockedOut', 'onBreak']);
export type ClockStatus = z.infer<typeof ClockStatusSchema>;

export const WorkerCapabilitiesSchema = z.object({
  canUploadPhotos: z.boolean().default(true),
  canAddNotes: z.boolean().default(true),
  canViewMap: z.boolean().default(true),
  canAddEmergencyTasks: z.boolean().default(false),
  requiresPhotoForSanitation: z.boolean().default(true),
  simplifiedInterface: z.boolean().default(false),
});
export type WorkerCapabilities = z.infer<typeof WorkerCapabilitiesSchema>;

export const WorkerProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: UserRoleSchema,
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hireDate: z.date().optional(),
  isActive: z.boolean().default(true),
  profileImageUrl: z.string().url().optional(),
  assignedBuildingIds: z.array(z.string()).default([]),
  capabilities: WorkerCapabilitiesSchema.optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  status: WorkerStatusSchema.default('offline'),
  isClockedIn: z.boolean().default(false),
  currentBuildingId: z.string().optional(),
  clockStatus: ClockStatusSchema.optional(),
});
export type WorkerProfile = z.infer<typeof WorkerProfileSchema>;

// MARK: - Location & Building Types

export const BuildingTypeSchema = z.enum([
  'Office', 'Residential', 'Retail', 'Commercial',
  'Industrial', 'Warehouse', 'Medical', 'Educational', 'Mixed Use'
]);
export type BuildingType = z.infer<typeof BuildingTypeSchema>;

export const NamedCoordinateSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: BuildingTypeSchema.optional(),
});
export type NamedCoordinate = z.infer<typeof NamedCoordinateSchema>;

export const BuildingMetricsSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  buildingId: z.string(),
  completionRate: z.number().min(0).max(1),
  averageTaskTime: z.number().default(3600), // TimeInterval in seconds
  overdueTasks: z.number().min(0),
  totalTasks: z.number().min(0),
  activeWorkers: z.number().min(0),
  isCompliant: z.boolean().default(true),
  overallScore: z.number().min(0).max(1),
  lastUpdated: z.date().default(() => new Date()),
  pendingTasks: z.number().min(0),
  urgentTasksCount: z.number().min(0),
  hasWorkerOnSite: z.boolean().default(false),
  maintenanceEfficiency: z.number().min(0).max(1).default(0.85),
  weeklyCompletionTrend: z.number().default(0),
  criticalIssues: z.number().min(0).default(0),
});
export type BuildingMetrics = z.infer<typeof BuildingMetricsSchema>;

// MARK: - Task Types

export const TaskCategorySchema = z.enum([
  'cleaning', 'maintenance', 'security', 'inspection', 'administrative',
  'repair', 'installation', 'utilities', 'emergency', 'renovation',
  'compliance', 'landscaping', 'sanitation', 'documentation'
]);
export type TaskCategoryType = z.infer<typeof TaskCategorySchema>;

export const TaskUrgencySchema = z.enum(['low', 'medium', 'normal', 'high', 'critical', 'urgent', 'emergency']);
export type TaskUrgency = z.infer<typeof TaskUrgencySchema>;

export const TaskStatusSchema = z.enum(['Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled', 'Paused', 'Waiting']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskFrequencySchema = z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annual', 'on-demand']);
export type TaskFrequency = z.infer<typeof TaskFrequencySchema>;

export const ContextualTaskSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema.default('Pending'),
  completedAt: z.date().optional(),
  scheduledDate: z.date().optional(),
  dueDate: z.date().optional(),
  category: TaskCategorySchema.optional(),
  urgency: TaskUrgencySchema.optional(),
  building: NamedCoordinateSchema.optional(),
  worker: WorkerProfileSchema.optional(),
  buildingId: z.string().optional(),
  buildingName: z.string().optional(),
  assignedWorkerId: z.string().optional(),
  priority: TaskUrgencySchema.optional(),
  frequency: TaskFrequencySchema.optional(),
  requiresPhoto: z.boolean().default(false),
  photoPaths: z.array(z.string()).default([]),
  estimatedDuration: z.number().optional(), // TimeInterval in seconds
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type ContextualTask = z.infer<typeof ContextualTaskSchema>;

// MARK: - Photo Evidence Types

export const PhotoCategorySchema = z.enum([
  'before', 'after', 'compliance', 'damage', 'maintenance', 'sanitation', 'general'
]);
export type PhotoCategory = z.infer<typeof PhotoCategorySchema>;

export const ProcessedPhotoSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  taskId: z.string(),
  workerId: z.string(),
  buildingId: z.string(),
  category: PhotoCategorySchema,
  timestamp: z.date().default(() => new Date()),
  localPath: z.string(),
  uploadedPath: z.string().optional(),
  thumbnail: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ProcessedPhoto = z.infer<typeof ProcessedPhotoSchema>;

// MARK: - Route & Assignment Types

export const RouteTypeSchema = z.enum(['daily', 'weekly', 'special', 'emergency']);
export type RouteType = z.infer<typeof RouteTypeSchema>;

export const RouteSequenceSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  buildingId: z.string(),
  order: z.number(),
  estimatedArrival: z.date().optional(),
  estimatedDuration: z.number(), // in minutes
  tasks: z.array(z.string()), // Task IDs
  isCompleted: z.boolean().default(false),
});
export type RouteSequence = z.infer<typeof RouteSequenceSchema>;

export const WorkerRouteSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  workerId: z.string(),
  routeName: z.string(),
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
  startTime: z.date(),
  estimatedEndTime: z.date(),
  sequences: z.array(RouteSequenceSchema),
  routeType: RouteTypeSchema,
});
export type WorkerRoute = z.infer<typeof WorkerRouteSchema>;

// MARK: - Compliance Types

export const ComplianceSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ComplianceSeverity = z.infer<typeof ComplianceSeveritySchema>;

export const ComplianceStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed', 'pending']);
export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;

export const HPDViolationSchema = z.object({
  violationId: z.string(),
  buildingId: z.string(),
  violationType: z.string(),
  description: z.string(),
  severity: ComplianceSeveritySchema,
  status: ComplianceStatusSchema,
  dateFound: z.date(),
  dateResolved: z.date().optional(),
});
export type HPDViolation = z.infer<typeof HPDViolationSchema>;

export const DOBPermitSchema = z.object({
  permitId: z.string(),
  buildingId: z.string(),
  permitType: z.string(),
  description: z.string(),
  status: z.string(),
  issueDate: z.date(),
  expirationDate: z.date().optional(),
});
export type DOBPermit = z.infer<typeof DOBPermitSchema>;

export const DSNYRouteSchema = z.object({
  routeId: z.string(),
  buildingId: z.string(),
  districtSection: z.string(),
  refuseDays: z.string().optional(),
  recyclingDays: z.string().optional(),
  organicsDays: z.string().optional(),
  bulkDays: z.string().optional(),
});
export type DSNYRoute = z.infer<typeof DSNYRouteSchema>;

export const LL97EmissionSchema = z.object({
  buildingId: z.string(),
  year: z.number(),
  emissionLimit: z.number(),
  actualEmissions: z.number(),
  isCompliant: z.boolean(),
  penalty: z.number().optional(),
});
export type LL97Emission = z.infer<typeof LL97EmissionSchema>;

// MARK: - Weather Types

export const OutdoorWorkRiskSchema = z.enum(['low', 'medium', 'high', 'extreme']);
export type OutdoorWorkRisk = z.infer<typeof OutdoorWorkRiskSchema>;

export const WeatherSnapshotSchema = z.object({
  timestamp: z.date().default(() => new Date()),
  temperature: z.number(),
  weatherCode: z.number(),
  windSpeed: z.number(),
  description: z.string(),
  outdoorWorkRisk: OutdoorWorkRiskSchema,
});
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

// MARK: - Operational Data Types (from OperationalDataManager)

export const OperationalDataTaskAssignmentSchema = z.object({
  building: z.string(),
  taskName: z.string(),
  assignedWorker: z.string(),
  category: z.string(),
  skillLevel: z.string(),
  recurrence: z.string(),
  startHour: z.number().optional(),
  endHour: z.number().optional(),
  daysOfWeek: z.string().optional(),
  workerId: z.string(), // Canonical ID
  buildingId: z.string(), // Canonical ID
  requiresPhoto: z.boolean().default(false),
  estimatedDuration: z.number().default(30), // in minutes
});
export type OperationalDataTaskAssignment = z.infer<typeof OperationalDataTaskAssignmentSchema>;

// MARK: - Client & Portfolio Types

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type Client = z.infer<typeof ClientSchema>;

export const PortfolioMetricsSchema = z.object({
  totalBuildings: z.number(),
  portfolioValue: z.number(),
  complianceScore: z.number().min(0).max(1),
  monthlySpend: z.number(),
  projectedCosts: z.number(),
  averageEfficiency: z.number().min(0).max(1),
});
export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;

// MARK: - System Types

export const DatabaseStatsSchema = z.object({
  workers: z.number(),
  buildings: z.number(),
  tasks: z.number(),
  isHealthy: z.boolean(),
});
export type DatabaseStats = z.infer<typeof DatabaseStatsSchema>;

// MARK: - Validation Helpers

export function validateWorkerId(id: string): boolean {
  const validIds = ['1', '2', '4', '5', '6', '7', '8'];
  return validIds.includes(id);
}

export function validateBuildingId(id: string): boolean {
  const validIds = ['1', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
  return validIds.includes(id);
}

// MARK: - Utility Functions

export function getUrgencyLevel(urgency: TaskUrgency): number {
  const levels = {
    low: 1,
    medium: 2,
    normal: 2,
    high: 3,
    urgent: 4,
    critical: 5,
    emergency: 6
  };
  return levels[urgency] || 2;
}

export function isTaskOverdue(task: ContextualTask): boolean {
  if (!task.dueDate || task.status === 'Completed') return false;
  return new Date() > task.dueDate;
}

export function calculateDistance(coord1: NamedCoordinate, coord2: NamedCoordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}