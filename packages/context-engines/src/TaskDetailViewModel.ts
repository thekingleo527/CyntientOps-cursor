// packages/context-engines/src/TaskDetailViewModel.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  OperationalDataTaskAssignment, 
  WorkerProfile, 
  Building, 
  PhotoEvidence,
  TaskVerificationStatus,
  TaskStatus
} from '@cyntientops/domain-schema';

export interface TaskDetailState {
  task: OperationalDataTaskAssignment | null;
  building: Building | null;
  worker: WorkerProfile | null;
  photoEvidence: PhotoEvidence[];
  verificationStatus: TaskVerificationStatus;
  isLoading: boolean;
  error: string | null;
  isStarting: boolean;
  isCompleting: boolean;
  isUploadingPhoto: boolean;
}

export interface TaskDetailActions {
  loadTask: (taskId: string) => Promise<void>;
  startTask: () => Promise<void>;
  completeTask: () => Promise<void>;
  uploadPhotoEvidence: (photoUri: string, description?: string) => Promise<void>;
  verifyTask: (verified: boolean, notes?: string) => Promise<void>;
  refreshTask: () => Promise<void>;
}

export interface TaskDetailViewModel extends TaskDetailState, TaskDetailActions {}

export const useTaskDetailViewModel = (taskId: string): TaskDetailViewModel => {
  const [state, setState] = useState<TaskDetailState>({
    task: null,
    building: null,
    worker: null,
    photoEvidence: [],
    verificationStatus: TaskVerificationStatus.Pending,
    isLoading: true,
    error: null,
    isStarting: false,
    isCompleting: false,
    isUploadingPhoto: false,
  });

  const loadTask = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load task details
      const task = await loadTaskDetails(id);
      if (!task) {
        throw new Error('Task not found');
      }

      // Load building details
      const building = await loadBuildingDetails(task.buildingId);
      if (!building) {
        throw new Error('Building not found');
      }

      // Load worker details
      const worker = await loadWorkerDetails(task.assignedWorkerId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Load photo evidence
      const photoEvidence = await loadPhotoEvidence(id);

      // Load verification status
      const verificationStatus = await loadVerificationStatus(id);

      setState(prev => ({
        ...prev,
        task,
        building,
        worker,
        photoEvidence,
        verificationStatus,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load task',
        isLoading: false,
      }));
    }
  }, []);

  const startTask = useCallback(async () => {
    if (!state.task) return;

    try {
      setState(prev => ({ ...prev, isStarting: true, error: null }));

      // Update task status to in progress
      await updateTaskStatus(state.task.id, TaskStatus.InProgress);
      
      // Record start time
      await recordTaskStartTime(state.task.id, new Date());

      // Refresh task data
      await loadTask(state.task.id);

      setState(prev => ({ ...prev, isStarting: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start task',
        isStarting: false,
      }));
    }
  }, [state.task, loadTask]);

  const completeTask = useCallback(async () => {
    if (!state.task) return;

    try {
      setState(prev => ({ ...prev, isCompleting: true, error: null }));

      // Update task status to completed
      await updateTaskStatus(state.task.id, TaskStatus.Completed);
      
      // Record completion time
      await recordTaskCompletionTime(state.task.id, new Date());

      // Refresh task data
      await loadTask(state.task.id);

      setState(prev => ({ ...prev, isCompleting: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete task',
        isCompleting: false,
      }));
    }
  }, [state.task, loadTask]);

  const uploadPhotoEvidence = useCallback(async (photoUri: string, description?: string) => {
    if (!state.task) return;

    try {
      setState(prev => ({ ...prev, isUploadingPhoto: true, error: null }));

      // Create photo evidence record
      const photoEvidence: PhotoEvidence = {
        id: generateId(),
        taskId: state.task.id,
        photoUri,
        description: description || '',
        timestamp: new Date(),
        uploadedBy: state.worker?.id || '',
        isVerified: false,
      };

      // Upload photo to storage
      await uploadPhotoToStorage(photoUri, photoEvidence.id);

      // Save photo evidence to database
      await savePhotoEvidence(photoEvidence);

      // Refresh photo evidence list
      const updatedPhotoEvidence = await loadPhotoEvidence(state.task.id);

      setState(prev => ({
        ...prev,
        photoEvidence: updatedPhotoEvidence,
        isUploadingPhoto: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to upload photo',
        isUploadingPhoto: false,
      }));
    }
  }, [state.task, state.worker]);

  const verifyTask = useCallback(async (verified: boolean, notes?: string) => {
    if (!state.task) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Update verification status
      const newStatus = verified ? TaskVerificationStatus.Verified : TaskVerificationStatus.Rejected;
      await updateVerificationStatus(state.task.id, newStatus, notes);

      // Refresh verification status
      const updatedStatus = await loadVerificationStatus(state.task.id);

      setState(prev => ({
        ...prev,
        verificationStatus: updatedStatus,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to verify task',
      }));
    }
  }, [state.task]);

  const refreshTask = useCallback(async () => {
    if (state.task) {
      await loadTask(state.task.id);
    }
  }, [state.task, loadTask]);

  useEffect(() => {
    if (taskId) {
      loadTask(taskId);
    }
  }, [taskId, loadTask]);

  return {
    ...state,
    loadTask,
    startTask,
    completeTask,
    uploadPhotoEvidence,
    verifyTask,
    refreshTask,
  };
};

// Helper functions (to be implemented with actual database/API calls)
async function loadTaskDetails(taskId: string): Promise<OperationalDataTaskAssignment | null> {
  // Implementation will connect to actual database
  return null;
}

async function loadBuildingDetails(buildingId: string): Promise<Building | null> {
  // Implementation will connect to actual database
  return null;
}

async function loadWorkerDetails(workerId: string): Promise<WorkerProfile | null> {
  // Implementation will connect to actual database
  return null;
}

async function loadPhotoEvidence(taskId: string): Promise<PhotoEvidence[]> {
  // Implementation will connect to actual database
  return [];
}

async function loadVerificationStatus(taskId: string): Promise<TaskVerificationStatus> {
  // Implementation will connect to actual database
  return TaskVerificationStatus.Pending;
}

async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  // Implementation will connect to actual database
}

async function recordTaskStartTime(taskId: string, startTime: Date): Promise<void> {
  // Implementation will connect to actual database
}

async function recordTaskCompletionTime(taskId: string, completionTime: Date): Promise<void> {
  // Implementation will connect to actual database
}

async function uploadPhotoToStorage(photoUri: string, photoId: string): Promise<void> {
  // Implementation will upload to cloud storage
}

async function savePhotoEvidence(photoEvidence: PhotoEvidence): Promise<void> {
  // Implementation will connect to actual database
}

async function updateVerificationStatus(
  taskId: string, 
  status: TaskVerificationStatus, 
  notes?: string
): Promise<void> {
  // Implementation will connect to actual database
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
