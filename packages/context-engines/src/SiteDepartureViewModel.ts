// packages/context-engines/src/SiteDepartureViewModel.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  Building, 
  WorkerProfile, 
  PhotoEvidence,
  DepartureRequirement,
  DepartureStatus
} from '@cyntientops/domain-schema';

export interface SiteDepartureState {
  buildings: Building[];
  currentWorker: WorkerProfile | null;
  departureRequirements: DepartureRequirement[];
  photoEvidence: PhotoEvidence[];
  departureStatus: DepartureStatus;
  isLoading: boolean;
  error: string | null;
  isGeneratingRequirements: boolean;
  isFinalizing: boolean;
  isUploadingPhoto: boolean;
}

export interface SiteDepartureActions {
  loadBuildings: () => Promise<void>;
  generateDepartureRequirements: (buildingIds: string[]) => Promise<void>;
  uploadDeparturePhoto: (buildingId: string, photoUri: string, description?: string) => Promise<void>;
  markRequirementComplete: (requirementId: string) => Promise<void>;
  finalizeDeparture: () => Promise<void>;
  refreshRequirements: () => Promise<void>;
}

export interface SiteDepartureViewModel extends SiteDepartureState, SiteDepartureActions {}

export const useSiteDepartureViewModel = (workerId: string): SiteDepartureViewModel => {
  const [state, setState] = useState<SiteDepartureState>({
    buildings: [],
    currentWorker: null,
    departureRequirements: [],
    photoEvidence: [],
    departureStatus: DepartureStatus.NotStarted,
    isLoading: true,
    error: null,
    isGeneratingRequirements: false,
    isFinalizing: false,
    isUploadingPhoto: false,
  });

  const loadBuildings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load worker details
      const worker = await loadWorkerDetails(workerId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Load buildings assigned to worker
      const buildings = await loadWorkerBuildings(workerId);

      setState(prev => ({
        ...prev,
        currentWorker: worker,
        buildings,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load buildings',
        isLoading: false,
      }));
    }
  }, [workerId]);

  const generateDepartureRequirements = useCallback(async (buildingIds: string[]) => {
    try {
      setState(prev => ({ ...prev, isGeneratingRequirements: true, error: null }));

      // Generate requirements for each building
      const requirements: DepartureRequirement[] = [];
      
      for (const buildingId of buildingIds) {
        const buildingRequirements = await generateBuildingDepartureRequirements(buildingId);
        requirements.push(...buildingRequirements);
      }

      setState(prev => ({
        ...prev,
        departureRequirements: requirements,
        departureStatus: DepartureStatus.InProgress,
        isGeneratingRequirements: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate requirements',
        isGeneratingRequirements: false,
      }));
    }
  }, []);

  const uploadDeparturePhoto = useCallback(async (buildingId: string, photoUri: string, description?: string) => {
    try {
      setState(prev => ({ ...prev, isUploadingPhoto: true, error: null }));

      // Create photo evidence record
      const photoEvidence: PhotoEvidence = {
        id: generateId(),
        taskId: `departure_${buildingId}`,
        photoUri,
        description: description || `Departure photo for ${buildingId}`,
        timestamp: new Date(),
        uploadedBy: workerId,
        isVerified: false,
      };

      // Upload photo to storage
      await uploadPhotoToStorage(photoUri, photoEvidence.id);

      // Save photo evidence to database
      await savePhotoEvidence(photoEvidence);

      // Update requirements that need photo evidence
      await updatePhotoRequirements(buildingId, photoEvidence.id);

      setState(prev => ({
        ...prev,
        isUploadingPhoto: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to upload photo',
        isUploadingPhoto: false,
      }));
    }
  }, [workerId]);

  const markRequirementComplete = useCallback(async (requirementId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Mark requirement as complete
      await updateRequirementStatus(requirementId, true);

      // Refresh requirements
      await refreshRequirements();

      // Check if all requirements are complete
      const allComplete = state.departureRequirements.every(req => req.isCompleted);
      if (allComplete) {
        setState(prev => ({
          ...prev,
          departureStatus: DepartureStatus.ReadyToFinalize,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark requirement complete',
      }));
    }
  }, [state.departureRequirements]);

  const finalizeDeparture = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isFinalizing: true, error: null }));

      // Validate all requirements are complete
      const incompleteRequirements = state.departureRequirements.filter(req => !req.isCompleted);
      if (incompleteRequirements.length > 0) {
        throw new Error('Cannot finalize departure with incomplete requirements');
      }

      // Record departure completion
      await recordDepartureCompletion(workerId, state.buildings.map(b => b.id));

      setState(prev => ({
        ...prev,
        departureStatus: DepartureStatus.Completed,
        isFinalizing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to finalize departure',
        isFinalizing: false,
      }));
    }
  }, [workerId, state.buildings, state.departureRequirements]);

  const refreshRequirements = useCallback(async () => {
    if (state.departureRequirements.length > 0) {
      const updatedRequirements = await loadDepartureRequirements(
        state.departureRequirements.map(req => req.id)
      );
      setState(prev => ({
        ...prev,
        departureRequirements: updatedRequirements,
      }));
    }
  }, [state.departureRequirements]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  return {
    ...state,
    loadBuildings,
    generateDepartureRequirements,
    uploadDeparturePhoto,
    markRequirementComplete,
    finalizeDeparture,
    refreshRequirements,
  };
};

// Helper functions (to be implemented with actual database/API calls)
async function loadWorkerDetails(workerId: string): Promise<WorkerProfile | null> {
  // Implementation will connect to actual database
  return null;
}

async function loadWorkerBuildings(workerId: string): Promise<Building[]> {
  // Implementation will connect to actual database
  return [];
}

async function generateBuildingDepartureRequirements(buildingId: string): Promise<DepartureRequirement[]> {
  // Implementation will generate requirements based on building type and tasks
  return [];
}

async function uploadPhotoToStorage(photoUri: string, photoId: string): Promise<void> {
  // Implementation will upload to cloud storage
}

async function savePhotoEvidence(photoEvidence: PhotoEvidence): Promise<void> {
  // Implementation will connect to actual database
}

async function updatePhotoRequirements(buildingId: string, photoId: string): Promise<void> {
  // Implementation will connect to actual database
}

async function updateRequirementStatus(requirementId: string, isCompleted: boolean): Promise<void> {
  // Implementation will connect to actual database
}

async function loadDepartureRequirements(requirementIds: string[]): Promise<DepartureRequirement[]> {
  // Implementation will connect to actual database
  return [];
}

async function recordDepartureCompletion(workerId: string, buildingIds: string[]): Promise<void> {
  // Implementation will connect to actual database
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
