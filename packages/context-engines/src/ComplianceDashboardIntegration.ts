/**
 * 🏢 Compliance Dashboard Integration
 * 
 * Integration layer that wires compliance dashboard components
 * through building details, client, and admin screens
 */

import { useState, useEffect, useCallback } from 'react';
import { ServiceContainer } from '@cyntientops/business-core';
import { complianceDashboardService, ComplianceDashboardData, BuildingComplianceData } from '@cyntientops/compliance-engine';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

// MARK: - Integration Types

export interface ComplianceDashboardIntegrationState {
  // Dashboard Data
  dashboardData: ComplianceDashboardData | null;
  selectedBuilding: BuildingComplianceData | null;
  
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string;
  
  // Navigation State
  showComplianceDashboard: boolean;
  showBuildingDetail: boolean;
  activeTab: 'overview' | 'violations' | 'financial' | 'inspections';
}

export interface ComplianceDashboardIntegrationActions {
  // Data Loading
  loadComplianceDashboard: (buildings: Array<{ id: string; name: string; address: string; bbl: string; bin?: string }>) => Promise<void>;
  loadBuildingCompliance: (building: { id: string; name: string; address: string; bbl: string; bin?: string }) => Promise<void>;
  refreshComplianceData: () => Promise<void>;
  
  // Navigation
  showComplianceDashboard: () => void;
  hideComplianceDashboard: () => void;
  selectBuilding: (building: BuildingComplianceData) => void;
  closeBuildingDetail: () => void;
  setActiveTab: (tab: 'overview' | 'violations' | 'financial' | 'inspections') => void;
  
  // Building Management
  getBuildingComplianceScore: (buildingId: string) => Promise<number>;
  getBuildingComplianceGrade: (buildingId: string) => Promise<string>;
  getBuildingComplianceStatus: (buildingId: string) => Promise<'critical' | 'high' | 'medium' | 'low'>;
}

// MARK: - Building Detail Integration

export function useBuildingDetailComplianceIntegration(
  container: ServiceContainer,
  buildingId: string,
  buildingName: string,
  buildingAddress: string
) {
  const [state, setState] = useState<ComplianceDashboardIntegrationState>({
    dashboardData: null,
    selectedBuilding: null,
    isLoading: false,
    isRefreshing: false,
    showComplianceDashboard: false,
    showBuildingDetail: false,
    activeTab: 'overview'
  });

  const loadBuildingCompliance = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      const building = {
        id: buildingId,
        name: buildingName,
        address: buildingAddress,
        bbl: `100${buildingId.padStart(6, '0')}${buildingId.padStart(2, '0')}`,
        bin: undefined
      };
      
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      
      setState(prev => ({
        ...prev,
        selectedBuilding: buildingCompliance,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building compliance data',
        isLoading: false
      }));
    }
  }, [buildingId, buildingName, buildingAddress]);

  const getBuildingComplianceScore = useCallback(async (buildingId: string): Promise<number> => {
    try {
      const building = {
        id: buildingId,
        name: buildingName,
        address: buildingAddress,
        bbl: `100${buildingId.padStart(6, '0')}${buildingId.padStart(2, '0')}`,
        bin: undefined
      };
      
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      return buildingCompliance.score;
    } catch (error) {
      console.error('Failed to get building compliance score:', error);
      return 0;
    }
  }, [buildingName, buildingAddress]);

  const getBuildingComplianceGrade = useCallback(async (buildingId: string): Promise<string> => {
    try {
      const building = {
        id: buildingId,
        name: buildingName,
        address: buildingAddress,
        bbl: `100${buildingId.padStart(6, '0')}${buildingId.padStart(2, '0')}`,
        bin: undefined
      };
      
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      return buildingCompliance.grade;
    } catch (error) {
      console.error('Failed to get building compliance grade:', error);
      return 'F';
    }
  }, [buildingName, buildingAddress]);

  const getBuildingComplianceStatus = useCallback(async (buildingId: string): Promise<'critical' | 'high' | 'medium' | 'low'> => {
    try {
      const building = {
        id: buildingId,
        name: buildingName,
        address: buildingAddress,
        bbl: `100${buildingId.padStart(6, '0')}${buildingId.padStart(2, '0')}`,
        bin: undefined
      };
      
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      return buildingCompliance.status;
    } catch (error) {
      console.error('Failed to get building compliance status:', error);
      return 'low';
    }
  }, [buildingName, buildingAddress]);

  const showComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: true }));
  }, []);

  const hideComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: false }));
  }, []);

  const selectBuilding = useCallback((building: BuildingComplianceData) => {
    setState(prev => ({
      ...prev,
      selectedBuilding: building,
      showBuildingDetail: true,
      showComplianceDashboard: false
    }));
  }, []);

  const closeBuildingDetail = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBuilding: null,
      showBuildingDetail: false
    }));
  }, []);

  const setActiveTab = useCallback((tab: 'overview' | 'violations' | 'financial' | 'inspections') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const refreshComplianceData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    await loadBuildingCompliance();
    setState(prev => ({ ...prev, isRefreshing: false }));
  }, [loadBuildingCompliance]);

  useEffect(() => {
    loadBuildingCompliance();
  }, [loadBuildingCompliance]);

  return {
    ...state,
    loadBuildingCompliance,
    getBuildingComplianceScore,
    getBuildingComplianceGrade,
    getBuildingComplianceStatus,
    showComplianceDashboard,
    hideComplianceDashboard,
    selectBuilding,
    closeBuildingDetail,
    setActiveTab,
    refreshComplianceData
  };
}

// MARK: - Client Dashboard Integration

export function useClientDashboardComplianceIntegration(
  container: ServiceContainer,
  clientId: string
) {
  const [state, setState] = useState<ComplianceDashboardIntegrationState>({
    dashboardData: null,
    selectedBuilding: null,
    isLoading: false,
    isRefreshing: false,
    showComplianceDashboard: false,
    showBuildingDetail: false,
    activeTab: 'overview'
  });

  const loadComplianceDashboard = useCallback(async (buildings: Array<{ id: string; name: string; address: string; bbl: string; bin?: string }>) => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      const dashboardData = await complianceDashboardService.getComplianceDashboardData(buildings);
      
      setState(prev => ({
        ...prev,
        dashboardData,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load compliance dashboard data',
        isLoading: false
      }));
    }
  }, []);

  const loadBuildingCompliance = useCallback(async (building: { id: string; name: string; address: string; bbl: string; bin?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      
      setState(prev => ({
        ...prev,
        selectedBuilding: buildingCompliance,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building compliance data',
        isLoading: false
      }));
    }
  }, []);

  const showComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: true }));
  }, []);

  const hideComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: false }));
  }, []);

  const selectBuilding = useCallback((building: BuildingComplianceData) => {
    setState(prev => ({
      ...prev,
      selectedBuilding: building,
      showBuildingDetail: true,
      showComplianceDashboard: false
    }));
  }, []);

  const closeBuildingDetail = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBuilding: null,
      showBuildingDetail: false
    }));
  }, []);

  const setActiveTab = useCallback((tab: 'overview' | 'violations' | 'financial' | 'inspections') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const refreshComplianceData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    // Refresh logic would go here
    setState(prev => ({ ...prev, isRefreshing: false }));
  }, []);

  return {
    ...state,
    loadComplianceDashboard,
    loadBuildingCompliance,
    showComplianceDashboard,
    hideComplianceDashboard,
    selectBuilding,
    closeBuildingDetail,
    setActiveTab,
    refreshComplianceData
  };
}

// MARK: - Admin Dashboard Integration

export function useAdminDashboardComplianceIntegration(
  container: ServiceContainer
) {
  const [state, setState] = useState<ComplianceDashboardIntegrationState>({
    dashboardData: null,
    selectedBuilding: null,
    isLoading: false,
    isRefreshing: false,
    showComplianceDashboard: false,
    showBuildingDetail: false,
    activeTab: 'overview'
  });

  const loadComplianceDashboard = useCallback(async (buildings: Array<{ id: string; name: string; address: string; bbl: string; bin?: string }>) => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      const dashboardData = await complianceDashboardService.getComplianceDashboardData(buildings);
      
      setState(prev => ({
        ...prev,
        dashboardData,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load compliance dashboard data',
        isLoading: false
      }));
    }
  }, []);

  const loadBuildingCompliance = useCallback(async (building: { id: string; name: string; address: string; bbl: string; bin?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      const buildingCompliance = await complianceDashboardService.getBuildingComplianceData(building);
      
      setState(prev => ({
        ...prev,
        selectedBuilding: buildingCompliance,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building compliance data',
        isLoading: false
      }));
    }
  }, []);

  const showComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: true }));
  }, []);

  const hideComplianceDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showComplianceDashboard: false }));
  }, []);

  const selectBuilding = useCallback((building: BuildingComplianceData) => {
    setState(prev => ({
      ...prev,
      selectedBuilding: building,
      showBuildingDetail: true,
      showComplianceDashboard: false
    }));
  }, []);

  const closeBuildingDetail = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBuilding: null,
      showBuildingDetail: false
    }));
  }, []);

  const setActiveTab = useCallback((tab: 'overview' | 'violations' | 'financial' | 'inspections') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const refreshComplianceData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    // Refresh logic would go here
    setState(prev => ({ ...prev, isRefreshing: false }));
  }, []);

  return {
    ...state,
    loadComplianceDashboard,
    loadBuildingCompliance,
    showComplianceDashboard,
    hideComplianceDashboard,
    selectBuilding,
    closeBuildingDetail,
    setActiveTab,
    refreshComplianceData
  };
}

// MARK: - Mobile-Ready Compliance Components

export interface MobileComplianceDashboardProps {
  buildings: Array<{ id: string; name: string; address: string; bbl: string; bin?: string }>;
  onBuildingSelect?: (building: BuildingComplianceData) => void;
  onRefresh?: () => void;
  userRole: 'client' | 'admin' | 'worker';
}

export interface MobileBuildingComplianceDetailProps {
  building: BuildingComplianceData;
  onClose?: () => void;
  onViolationPress?: (violation: any) => void;
  userRole: 'client' | 'admin' | 'worker';
}

// MARK: - Mobile Integration Helpers

export const getComplianceNavigationConfig = (userRole: 'client' | 'admin' | 'worker') => {
  const baseConfig = {
    complianceDashboard: {
      title: 'Compliance Dashboard',
      icon: 'shield-check',
      screen: 'ComplianceDashboard'
    },
    buildingComplianceDetail: {
      title: 'Building Compliance',
      icon: 'building.2',
      screen: 'BuildingComplianceDetail'
    }
  };

  switch (userRole) {
    case 'client':
      return {
        ...baseConfig,
        complianceDashboard: {
          ...baseConfig.complianceDashboard,
          title: 'Portfolio Compliance',
          subtitle: 'Your building compliance overview'
        }
      };
    case 'admin':
      return {
        ...baseConfig,
        complianceDashboard: {
          ...baseConfig.complianceDashboard,
          title: 'System Compliance',
          subtitle: 'All buildings compliance overview'
        }
      };
    case 'worker':
      return {
        ...baseConfig,
        complianceDashboard: {
          ...baseConfig.complianceDashboard,
          title: 'Building Compliance',
          subtitle: 'Current building compliance status'
        }
      };
    default:
      return baseConfig;
  }
};

export const getCompliancePermissions = (userRole: 'client' | 'admin' | 'worker') => {
  switch (userRole) {
    case 'client':
      return {
        canViewCompliance: true,
        canViewViolations: true,
        canViewFinancial: true,
        canViewInspections: true,
        canEditCompliance: false,
        canResolveViolations: false,
        canManageFines: false
      };
    case 'admin':
      return {
        canViewCompliance: true,
        canViewViolations: true,
        canViewFinancial: true,
        canViewInspections: true,
        canEditCompliance: true,
        canResolveViolations: true,
        canManageFines: true
      };
    case 'worker':
      return {
        canViewCompliance: true,
        canViewViolations: true,
        canViewFinancial: false,
        canViewInspections: true,
        canEditCompliance: false,
        canResolveViolations: false,
        canManageFines: false
      };
    default:
      return {
        canViewCompliance: false,
        canViewViolations: false,
        canViewFinancial: false,
        canViewInspections: false,
        canEditCompliance: false,
        canResolveViolations: false,
        canManageFines: false
      };
  }
};

export default {
  useBuildingDetailComplianceIntegration,
  useClientDashboardComplianceIntegration,
  useAdminDashboardComplianceIntegration,
  getComplianceNavigationConfig,
  getCompliancePermissions
};
