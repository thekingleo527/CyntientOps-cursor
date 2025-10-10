/**
 * 📋 Task Completion Types
 * Purpose: Type definitions for routine task completion tracking
 */

export interface TaskCompletionPhoto {
  id: string;
  uri: string;
  thumbnailUri?: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface RoutineTaskCompletion {
  id: string;
  routineId: string;
  workerId: string;
  buildingId: string;
  taskName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  completedAt: string;
  status: 'completed' | 'partial' | 'skipped' | 'cancelled';
  durationMinutes?: number;
  photos: TaskCompletionPhoto[];
  notes?: string;
  locationVerified: boolean;
  qualityRating?: number; // 1-5
  requiresFollowup: boolean;
  followupNotes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletionInput {
  routineId: string;
  workerId: string;
  buildingId: string;
  taskName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'completed' | 'partial' | 'skipped' | 'cancelled';
  photos?: TaskCompletionPhoto[];
  notes?: string;
  locationVerified?: boolean;
  qualityRating?: number;
  requiresFollowup?: boolean;
  followupNotes?: string;
  metadata?: Record<string, any>;
}

export interface TaskCompletionStats {
  totalCompletions: number;
  completedOnTime: number;
  completedLate: number;
  averageDuration: number;
  completionRate: number; // Percentage
  photosRequired: number;
  photosSubmitted: number;
  averageQualityRating?: number;
}

export interface WorkerCompletionHistory {
  workerId: string;
  workerName: string;
  completions: RoutineTaskCompletion[];
  stats: TaskCompletionStats;
}

export interface BuildingCompletionHistory {
  buildingId: string;
  buildingName: string;
  completions: RoutineTaskCompletion[];
  stats: TaskCompletionStats;
}
