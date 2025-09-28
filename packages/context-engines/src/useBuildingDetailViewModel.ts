/**
 * @cyntientops/context-engines
 * 
 * Building Detail ViewModel Hook
 * Mirrors: CyntientOps/ViewModels/Building/BuildingDetailViewModel.swift
 */

import { useState, useEffect, useCallback } from 'react';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingDetailViewModelState {
  // Building Data
  buildingData: any | null;
  buildingImage: string | null;
  buildingType: string;
  buildingSize: number;
  yearBuilt: number;
  contractType: string | null;
  buildingRating: string;
  
  // Units
  residentialUnits: number;
  commercialUnits: number;
  violations: number;
  
  // Metrics
  completionPercentage: number;
  efficiencyScore: number;
  complianceScore: string;
  complianceStatus: string | null;
  openIssues: number;
  
  // Workers
  workersOnSite: number;
  workersPresent: string[];
  
  // Tasks
  buildingTasks: any[];
  todaysTasks: { completed: number; total: number } | null;
  nextCriticalTask: string | null;
  
  // Inventory
  inventorySummary: {
    cleaningLow: number;
    maintenanceLow: number;
    totalLow: number;
  };
  
  // Activity
  recentActivities: Array<{
    type: string;
    description: string;
    workerName?: string;
    timestamp: number;
  }>;
  
  // Contacts
  primaryContact: {
    name: string;
    role: string;
    phone?: string;
  } | null;
  
  // User Role
  userRole: 'worker' | 'admin' | 'client';
  
  // Loading State
  isLoading: boolean;
  errorMessage: string | null;
}

export interface BuildingDetailViewModelActions {
  loadBuildingData: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateBuildingInfo: (updates: Partial<any>) => Promise<void>;
  reportIssue: (issue: any) => Promise<void>;
  requestSupplies: (supplies: any) => Promise<void>;
  addPhoto: (photo: any) => Promise<void>;
  callContact: (contact: any) => void;
  messageContact: (contact: any) => void;
}

export function useBuildingDetailViewModel(
  container: ServiceContainer,
  buildingId: string,
  buildingName: string,
  buildingAddress: string
): BuildingDetailViewModelState & BuildingDetailViewModelActions {
  
  // MARK: - State
  const [state, setState] = useState<BuildingDetailViewModelState>({
    buildingData: null,
    buildingImage: null,
    buildingType: 'Residential',
    buildingSize: 0,
    yearBuilt: 0,
    contractType: null,
    buildingRating: 'A',
    residentialUnits: 0,
    commercialUnits: 0,
    violations: 0,
    completionPercentage: 0,
    efficiencyScore: 0,
    complianceScore: 'A',
    complianceStatus: null,
    openIssues: 0,
    workersOnSite: 0,
    workersPresent: [],
    buildingTasks: [],
    todaysTasks: null,
    nextCriticalTask: null,
    inventorySummary: {
      cleaningLow: 0,
      maintenanceLow: 0,
      totalLow: 0,
    },
    recentActivities: [],
    primaryContact: null,
    userRole: 'worker',
    isLoading: true,
    errorMessage: null,
  });

  // MARK: - Actions
  
  const loadBuildingData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: null }));
    
    try {
      // Load building infrastructure data
      const buildingInfrastructure = container.buildingInfrastructureCatalog.getBuildingInfrastructure(buildingId);
      
      // Load building details
      const buildingDetails = container.buildingDetailsCatalog.getBuildingDetails(buildingId);
      
      // Load building metrics
      const buildingMetrics = container.buildingMetricsCatalog.getBuildingMetrics(buildingId);
      
      // Load building tasks
      const buildingTasks = container.buildingTasksCatalog.getBuildingTasks(buildingId);
      
      // Load building contacts
      const buildingContacts = container.buildingContactsCatalog.getBuildingContacts(buildingId);
      
      // Load building activity
      const buildingActivity = container.buildingActivityCatalog.getBuildingActivity(buildingId);
      
      // Load building inventory
      const buildingInventory = container.buildingInventoryCatalog.getBuildingInventory(buildingId);
      
      // Load building workers
      const buildingWorkers = container.buildingWorkersCatalog.getBuildingWorkers(buildingId);
      
      // Process and combine data
      const processedData = {
        ...buildingInfrastructure,
        ...buildingDetails,
        ...buildingMetrics,
        tasks: buildingTasks,
        contacts: buildingContacts,
        activity: buildingActivity,
        inventory: buildingInventory,
        workers: buildingWorkers,
      };
      
      // Calculate derived metrics
      const completionPercentage = buildingTasks.length > 0 
        ? (buildingTasks.filter((task: any) => task.status === 'completed').length / buildingTasks.length) * 100
        : 0;
      
      const todaysTasks = {
        completed: buildingTasks.filter((task: any) => 
          task.status === 'completed' && 
          new Date(task.completedAt).toDateString() === new Date().toDateString()
        ).length,
        total: buildingTasks.filter((task: any) => 
          new Date(task.scheduledAt).toDateString() === new Date().toDateString()
        ).length,
      };
      
      const nextCriticalTask = buildingTasks
        .filter((task: any) => task.priority === 'critical' && task.status !== 'completed')
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.title || null;
      
      const inventorySummary = {
        cleaningLow: buildingInventory.filter((item: any) => 
          item.category === 'cleaning' && item.quantity < item.minThreshold
        ).length,
        maintenanceLow: buildingInventory.filter((item: any) => 
          item.category === 'maintenance' && item.quantity < item.minThreshold
        ).length,
        totalLow: buildingInventory.filter((item: any) => 
          item.quantity < item.minThreshold
        ).length,
      };
      
      const recentActivities = buildingActivity
        .slice(0, 10)
        .map((activity: any) => ({
          type: activity.type,
          description: activity.description,
          workerName: activity.workerName,
          timestamp: new Date(activity.timestamp).getTime(),
        }));
      
      const primaryContact = buildingContacts.find((contact: any) => contact.isPrimary) || null;
      
      const workersPresent = buildingWorkers
        .filter((worker: any) => worker.isOnSite)
        .map((worker: any) => worker.name);
      
      setState(prev => ({
        ...prev,
        buildingData: processedData,
        buildingImage: buildingInfrastructure.imageUrl || null,
        buildingType: buildingInfrastructure.type || 'Residential',
        buildingSize: buildingInfrastructure.size || 0,
        yearBuilt: buildingInfrastructure.yearBuilt || 0,
        contractType: buildingInfrastructure.contractType || null,
        buildingRating: buildingMetrics.rating || 'A',
        residentialUnits: buildingInfrastructure.residentialUnits || 0,
        commercialUnits: buildingInfrastructure.commercialUnits || 0,
        violations: buildingMetrics.violations || 0,
        completionPercentage,
        efficiencyScore: buildingMetrics.efficiencyScore || 0,
        complianceScore: buildingMetrics.complianceScore || 'A',
        complianceStatus: buildingMetrics.complianceStatus || null,
        openIssues: buildingMetrics.openIssues || 0,
        workersOnSite: buildingWorkers.filter((worker: any) => worker.isOnSite).length,
        workersPresent,
        buildingTasks,
        todaysTasks,
        nextCriticalTask,
        inventorySummary,
        recentActivities,
        primaryContact,
        isLoading: false,
      }));
      
    } catch (error) {
      console.error('Failed to load building data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building data',
      }));
    }
  }, [container, buildingId]);

  const refreshData = useCallback(async () => {
    await loadBuildingData();
  }, [loadBuildingData]);

  const updateBuildingInfo = useCallback(async (updates: Partial<any>) => {
    try {
      // Update building information
      await container.buildingDetailsCatalog.updateBuildingDetails(buildingId, updates);
      await refreshData();
    } catch (error) {
      console.error('Failed to update building info:', error);
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to update building info',
      }));
    }
  }, [container, buildingId, refreshData]);

  const reportIssue = useCallback(async (issue: any) => {
    try {
      // Report issue
      await container.issueReportingCatalog.reportIssue({
        ...issue,
        buildingId,
        timestamp: new Date().toISOString(),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to report issue:', error);
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to report issue',
      }));
    }
  }, [container, buildingId, refreshData]);

  const requestSupplies = useCallback(async (supplies: any) => {
    try {
      // Request supplies
      await container.supplyRequestCatalog.requestSupplies({
        ...supplies,
        buildingId,
        timestamp: new Date().toISOString(),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to request supplies:', error);
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to request supplies',
      }));
    }
  }, [container, buildingId, refreshData]);

  const addPhoto = useCallback(async (photo: any) => {
    try {
      // Add photo
      await container.photoCatalog.addPhoto({
        ...photo,
        buildingId,
        timestamp: new Date().toISOString(),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to add photo:', error);
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to add photo',
      }));
    }
  }, [container, buildingId, refreshData]);

  const callContact = useCallback((contact: any) => {
    // Handle calling contact
    console.log('Calling contact:', contact);
  }, []);

  const messageContact = useCallback((contact: any) => {
    // Handle messaging contact
    console.log('Messaging contact:', contact);
  }, []);

  // MARK: - Effects
  
  useEffect(() => {
    loadBuildingData();
  }, [loadBuildingData]);

  // MARK: - Return
  
  return {
    ...state,
    loadBuildingData,
    refreshData,
    updateBuildingInfo,
    reportIssue,
    requestSupplies,
    addPhoto,
    callContact,
    messageContact,
  };
}
