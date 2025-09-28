/**
 * ClientDashboardViewModel
 * 
 * Comprehensive ViewModel for Client Dashboard functionality
 * Mirrors SwiftUI ClientDashboardViewModel with portfolio intelligence
 * Orchestrates all client-specific data and building metrics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, WorkerProfile, BuildingMetrics, ContextualTask, DashboardUpdate, ClientPortfolioIntelligence, ExecutiveSummary, PortfolioBenchmark, StrategicRecommendation, BuildingWithImage, RealtimeRoutineMetrics, ActiveWorkerStatus, MonthlyMetrics, ComplianceIssue, IntelligenceInsight, DashboardSyncStatus, ClientTaskMetrics } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// MARK: - Supporting Types

export interface ClientDashboardState {
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string;
  successMessage?: string;
  lastUpdateTime?: Date;
  
  // Portfolio Intelligence
  portfolioIntelligence?: ClientPortfolioIntelligence;
  executiveSummary?: ExecutiveSummary;
  portfolioBenchmarks: PortfolioBenchmark[];
  strategicRecommendations: StrategicRecommendation[];
  
  // Buildings and Metrics
  buildingsList: any[];
  buildingsWithImages: BuildingWithImage[];
  buildingMetrics: Record<string, BuildingMetrics>;
  totalBuildings: number;
  activeWorkers: number;
  completionRate: number;
  criticalIssues: number;
  complianceScore: number;
  monthlyTrend: string;
  
  // Real-time Metrics
  realtimeRoutineMetrics: RealtimeRoutineMetrics;
  activeWorkerStatus: ActiveWorkerStatus;
  monthlyMetrics: MonthlyMetrics;
  
  // Compliance and Intelligence
  complianceIssues: ComplianceIssue[];
  intelligenceInsights: IntelligenceInsight[];
  dashboardUpdates: DashboardUpdate[];
  dashboardSyncStatus: DashboardSyncStatus;
  
  // NYC API Compliance Data
  hpdViolationsData: Record<string, any[]>;
  dobPermitsData: Record<string, any[]>;
  dsnyScheduleData: Record<string, any[]>;
  dsnyViolationsData: Record<string, any[]>;
  ll97EmissionsData: Record<string, any[]>;
  
  // Photo Evidence
  recentPhotos: any[];
  todaysPhotoCount: number;
  photoCategories: Record<string, number>;
  
  // Client-specific data
  clientBuildings: any[];
  clientBuildingsWithImages: BuildingWithImage[];
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  portfolioAssessedValue: number;
  portfolioMarketValue: number;
  clientTasks: ContextualTask[];
  clientTaskMetrics?: ClientTaskMetrics;
  
  // Map and Navigation
  mapRegion: {
    center: { latitude: number; longitude: number };
    span: { latitudeDelta: number; longitudeDelta: number };
  };
  
  // Loading states
  isLoadingInsights: boolean;
  showCostData: boolean;
}

export interface ClientDashboardActions {
  // Data Loading
  loadDashboardData: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadPortfolioIntelligence: () => Promise<void>;
  loadBuildingMetrics: () => Promise<void>;
  loadComplianceData: () => Promise<void>;
  
  // Building Management
  selectBuilding: (buildingId: string) => void;
  getBuildingDetails: (buildingId: string) => Promise<any>;
  
  // Worker Management
  getAvailableWorkers: () => any[];
  getWorkerSchedules: () => any[];
  getClientRoutines: () => any[];
  
  // Analytics
  generatePortfolioReport: () => Promise<void>;
  exportBuildingData: (buildingId: string) => Promise<void>;
  
  // UI State
  toggleCostData: () => void;
  setMapRegion: (region: any) => void;
}

// MARK: - Main ViewModel Hook

export function useClientDashboardViewModel(
  container: ServiceContainer,
  clientId: string
): ClientDashboardState & ClientDashboardActions {
  
  // MARK: - State Management
  
  const [state, setState] = useState<ClientDashboardState>({
    isLoading: true,
    isRefreshing: false,
    buildingsList: [],
    buildingsWithImages: [],
    buildingMetrics: {},
    totalBuildings: 0,
    activeWorkers: 0,
    completionRate: 0.0,
    criticalIssues: 0,
    complianceScore: 92,
    monthlyTrend: 'stable',
    realtimeRoutineMetrics: {
      totalRoutines: 0,
      completedRoutines: 0,
      inProgressRoutines: 0,
      overdueRoutines: 0,
      completionRate: 0.0,
      averageCompletionTime: 0,
      lastUpdated: new Date()
    },
    activeWorkerStatus: {
      totalActive: 0,
      byBuilding: {},
      utilizationRate: 0.0
    },
    monthlyMetrics: {
      currentSpend: 0,
      monthlyBudget: 10000,
      projectedSpend: 0,
      daysRemaining: 30
    },
    complianceIssues: [],
    intelligenceInsights: [],
    dashboardUpdates: [],
    dashboardSyncStatus: 'synced',
    hpdViolationsData: {},
    dobPermitsData: {},
    dsnyScheduleData: {},
    dsnyViolationsData: {},
    ll97EmissionsData: {},
    recentPhotos: [],
    todaysPhotoCount: 0,
    photoCategories: {},
    clientBuildings: [],
    clientBuildingsWithImages: [],
    portfolioAssessedValue: 0,
    portfolioMarketValue: 0,
    clientTasks: [],
    mapRegion: {
      center: { latitude: 40.7589, longitude: -73.9851 },
      span: { latitudeDelta: 0.01, longitudeDelta: 0.01 }
    },
    isLoadingInsights: false,
    showCostData: true,
    portfolioBenchmarks: [],
    strategicRecommendations: []
  });

  // MARK: - Computed Properties
  
  const hasActiveIssues = useMemo(() => {
    return state.criticalIssues > 0 || state.complianceIssues.some(issue => issue.severity === 'critical');
  }, [state.criticalIssues, state.complianceIssues]);

  const portfolioHealth = useMemo(() => ({
    overallScore: state.completionRate,
    totalBuildings: state.totalBuildings,
    activeBuildings: state.clientBuildings.length,
    criticalIssues: state.criticalIssues,
    trend: state.monthlyTrend,
    lastUpdated: new Date()
  }), [state.completionRate, state.totalBuildings, state.clientBuildings.length, state.criticalIssues, state.monthlyTrend]);

  const complianceOverview = useMemo(() => ({
    id: `compliance_${Date.now()}`,
    overallScore: state.complianceScore / 100.0,
    criticalViolations: state.complianceIssues.filter(issue => issue.severity === 'critical').length,
    pendingInspections: state.complianceIssues.filter(issue => issue.status === 'pending').length,
    lastUpdated: new Date()
  }), [state.complianceScore, state.complianceIssues]);

  const clientDisplayName = useMemo(() => {
    return state.clientName || 'Client';
  }, [state.clientName]);

  const clientInitials = useMemo(() => {
    const name = state.clientName || '';
    if (!name) return 'C';
    const components = name.split(' ');
    if (components.length >= 2) {
      const first = components[0].charAt(0).toUpperCase();
      const last = components[1].charAt(0).toUpperCase();
      return `${first}${last}`;
    }
    return name.substring(0, 2).toUpperCase();
  }, [state.clientName]);

  const clientOrgName = useMemo(() => {
    // This would ideally come from a client data model
    return 'Edelman Properties LLC';
  }, []);

  // MARK: - Data Loading Methods
  
  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, errorMessage: undefined }));
    
    try {
      // Load client profile
      const clientProfile = await container.clients.getClientProfile(clientId);
      
      // Load client buildings
      const clientBuildings = await container.clients.getClientBuildings(clientId);
      
      // Load building metrics
      const buildingMetrics = await loadBuildingMetricsForClient(clientId);
      
      // Load portfolio intelligence
      const portfolioIntelligence = await container.intelligence.getPortfolioIntelligence(clientId);
      
      // Load compliance data
      const complianceData = await loadComplianceDataForClient(clientId);
      
      // Load real-time metrics
      const realtimeMetrics = await container.metrics.getRealtimeMetrics(clientId);
      
      // Load photo evidence
      const photoData = await loadPhotoEvidenceForClient(clientId);

      setState(prev => ({
        ...prev,
        clientId,
        clientName: clientProfile.name,
        clientEmail: clientProfile.email,
        clientBuildings,
        buildingsList: clientBuildings,
        buildingsWithImages: clientBuildings.map(building => ({
          ...building,
          imageUrl: building.imageUrl || '/assets/images/buildings/building_placeholder.png'
        })),
        buildingMetrics,
        totalBuildings: clientBuildings.length,
        portfolioIntelligence,
        complianceIssues: complianceData.issues,
        realtimeRoutineMetrics: realtimeMetrics.routineMetrics,
        activeWorkerStatus: realtimeMetrics.workerStatus,
        monthlyMetrics: realtimeMetrics.monthlyMetrics,
        recentPhotos: photoData.recentPhotos,
        todaysPhotoCount: photoData.todaysPhotoCount,
        photoCategories: photoData.categories,
        isLoading: false,
        lastUpdateTime: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load dashboard data',
        isLoading: false
      }));
    }
  }, [container, clientId]);

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    await loadDashboardData();
    setState(prev => ({ ...prev, isRefreshing: false }));
  }, [loadDashboardData]);

  const loadPortfolioIntelligence = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingInsights: true }));
    
    try {
      const [intelligence, summary, benchmarks, recommendations] = await Promise.all([
        container.intelligence.getPortfolioIntelligence(clientId),
        container.intelligence.getExecutiveSummary(clientId),
        container.intelligence.getPortfolioBenchmarks(clientId),
        container.intelligence.getStrategicRecommendations(clientId)
      ]);

      setState(prev => ({
        ...prev,
        portfolioIntelligence: intelligence,
        executiveSummary: summary,
        portfolioBenchmarks: benchmarks,
        strategicRecommendations: recommendations,
        isLoadingInsights: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load portfolio intelligence',
        isLoadingInsights: false
      }));
    }
  }, [container, clientId]);

  const loadBuildingMetrics = useCallback(async () => {
    try {
      const metrics = await loadBuildingMetricsForClient(clientId);
      setState(prev => ({ ...prev, buildingMetrics: metrics }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building metrics'
      }));
    }
  }, [clientId]);

  const loadComplianceData = useCallback(async () => {
    try {
      const complianceData = await loadComplianceDataForClient(clientId);
      setState(prev => ({
        ...prev,
        complianceIssues: complianceData.issues,
        hpdViolationsData: complianceData.hpdViolations,
        dobPermitsData: complianceData.dobPermits,
        dsnyScheduleData: complianceData.dsnySchedule,
        dsnyViolationsData: complianceData.dsnyViolations,
        ll97EmissionsData: complianceData.ll97Emissions
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load compliance data'
      }));
    }
  }, [clientId]);

  // MARK: - Building Management Methods
  
  const selectBuilding = useCallback((buildingId: string) => {
    // This would typically navigate to building detail view
    console.log('Selected building:', buildingId);
  }, []);

  const getBuildingDetails = useCallback(async (buildingId: string) => {
    try {
      const building = await container.buildings.getBuildingDetails(buildingId);
      return building;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to load building details'
      }));
      return null;
    }
  }, [container]);

  // MARK: - Worker Management Methods
  
  const getAvailableWorkers = useCallback((): any[] => {
    // Get actual workers assigned to client buildings using real data
    const workers: any[] = [];
    
    // Use async task to get real worker assignments
    (async () => {
      try {
        const assignments = await container.operationalData.getRealWorkerAssignments();
        for (const building of state.clientBuildings) {
          if (assignments[building.name]) {
            for (const workerName of assignments[building.name]) {
              const worker = {
                id: `worker_${Date.now()}`,
                name: workerName,
                role: 'worker',
                capabilities: [],
                isActive: true,
                currentBuildingId: building.id
              };
              workers.push(worker);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load worker assignments:', error);
      }
    })();
    
    return workers;
  }, [container, state.clientBuildings]);

  const getWorkerSchedules = useCallback((): any[] => {
    // Get real worker schedules from OperationalDataManager
    // Using available methods - return empty for now
    return [];
  }, []);

  const getClientRoutines = useCallback((): any[] => {
    // Get actual worker routines happening at client buildings
    const routines: any[] = [];
    
    for (const building of state.clientBuildings) {
      // This would load actual routines for the building
      // For now, return empty array
    }
    
    return routines;
  }, [state.clientBuildings]);

  // MARK: - Analytics Methods
  
  const generatePortfolioReport = useCallback(async () => {
    try {
      const report = await container.analytics.generatePortfolioReport(clientId);
      setState(prev => ({
        ...prev,
        successMessage: 'Portfolio report generated successfully'
      }));
      return report;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to generate portfolio report'
      }));
    }
  }, [container, clientId]);

  const exportBuildingData = useCallback(async (buildingId: string) => {
    try {
      const data = await container.analytics.exportBuildingData(buildingId);
      setState(prev => ({
        ...prev,
        successMessage: 'Building data exported successfully'
      }));
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to export building data'
      }));
    }
  }, [container]);

  // MARK: - UI State Methods
  
  const toggleCostData = useCallback(() => {
    setState(prev => ({ ...prev, showCostData: !prev.showCostData }));
  }, []);

  const setMapRegion = useCallback((region: any) => {
    setState(prev => ({ ...prev, mapRegion: region }));
  }, []);

  // MARK: - Helper Methods
  
  const loadBuildingMetricsForClient = async (clientId: string): Promise<Record<string, BuildingMetrics>> => {
    try {
      const buildings = await container.clients.getClientBuildings(clientId);
      const metrics: Record<string, BuildingMetrics> = {};
      
      for (const building of buildings) {
        const buildingMetrics = await container.buildings.getBuildingMetrics(building.id);
        metrics[building.id] = buildingMetrics;
      }
      
      return metrics;
    } catch (error) {
      console.error('Failed to load building metrics for client:', error);
      return {};
    }
  };

  const loadComplianceDataForClient = async (clientId: string) => {
    try {
      const buildings = await container.clients.getClientBuildings(clientId);
      const complianceData = {
        issues: [] as ComplianceIssue[],
        hpdViolations: {} as Record<string, any[]>,
        dobPermits: {} as Record<string, any[]>,
        dsnySchedule: {} as Record<string, any[]>,
        dsnyViolations: {} as Record<string, any[]>,
        ll97Emissions: {} as Record<string, any[]>
      };
      
      for (const building of buildings) {
        // Load compliance data for each building
        const [hpdViolations, dobPermits, dsnySchedule, dsnyViolations, ll97Emissions] = await Promise.all([
          container.nyc.getHPDViolations(building.id),
          container.nyc.getDOBPermits(building.id),
          container.nyc.getDSNYSchedule(building.id),
          container.nyc.getDSNYViolations(building.id),
          container.nyc.getLL97Emissions(building.id)
        ]);
        
        complianceData.hpdViolations[building.id] = hpdViolations;
        complianceData.dobPermits[building.id] = dobPermits;
        complianceData.dsnySchedule[building.id] = dsnySchedule;
        complianceData.dsnyViolations[building.id] = dsnyViolations;
        complianceData.ll97Emissions[building.id] = ll97Emissions;
        
        // Generate compliance issues from violations
        if (hpdViolations.length > 0) {
          complianceData.issues.push({
            id: `hpd_${building.id}`,
            buildingId: building.id,
            buildingName: building.name,
            type: 'hpd_violation',
            severity: 'high',
            status: 'open',
            description: `${hpdViolations.length} HPD violations`,
            dueDate: new Date(),
            createdAt: new Date()
          });
        }
      }
      
      return complianceData;
    } catch (error) {
      console.error('Failed to load compliance data for client:', error);
      return {
        issues: [],
        hpdViolations: {},
        dobPermits: {},
        dsnySchedule: {},
        dsnyViolations: {},
        ll97Emissions: {}
      };
    }
  };

  const loadPhotoEvidenceForClient = async (clientId: string) => {
    try {
      const buildings = await container.clients.getClientBuildings(clientId);
      const photoData = {
        recentPhotos: [] as any[],
        todaysPhotoCount: 0,
        categories: {} as Record<string, number>
      };
      
      for (const building of buildings) {
        const photos = await container.photos.getRecentPhotos(building.id, 10);
        photoData.recentPhotos.push(...photos);
        
        // Count today's photos
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysPhotos = photos.filter(photo => {
          const photoDate = new Date(photo.timestamp);
          photoDate.setHours(0, 0, 0, 0);
          return photoDate.getTime() === today.getTime();
        });
        photoData.todaysPhotoCount += todaysPhotos.length;
        
        // Count by category
        for (const photo of photos) {
          const category = photo.category || 'other';
          photoData.categories[category] = (photoData.categories[category] || 0) + 1;
        }
      }
      
      return photoData;
    } catch (error) {
      console.error('Failed to load photo evidence for client:', error);
      return {
        recentPhotos: [],
        todaysPhotoCount: 0,
        categories: {}
      };
    }
  };

  // MARK: - Effects
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Subscribe to dashboard updates
  useEffect(() => {
    const unsubscribe = container.dashboardSync.subscribeToUpdates((update) => {
      if (update.buildingId && state.clientBuildings.some(building => building.id === update.buildingId)) {
        setState(prev => ({
          ...prev,
          dashboardUpdates: [update, ...prev.dashboardUpdates].slice(0, 50),
          lastUpdateTime: new Date()
        }));
      }
    });

    return unsubscribe;
  }, [container.dashboardSync, state.clientBuildings]);

  // MARK: - Return Combined State and Actions
  
  return {
    ...state,
    hasActiveIssues,
    portfolioHealth,
    complianceOverview,
    clientDisplayName,
    clientInitials,
    clientOrgName,
    loadDashboardData,
    refreshData,
    loadPortfolioIntelligence,
    loadBuildingMetrics,
    loadComplianceData,
    selectBuilding,
    getBuildingDetails,
    getAvailableWorkers,
    getWorkerSchedules,
    getClientRoutines,
    generatePortfolioReport,
    exportBuildingData,
    toggleCostData,
    setMapRegion
  };
}
