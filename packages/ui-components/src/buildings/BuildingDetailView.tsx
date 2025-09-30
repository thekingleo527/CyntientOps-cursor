/**
 * 🏢 Building Detail View
 * Mirrors: CyntientOps/Views/Components/Buildings/BuildingDetailView.swift (1,240+ lines)
 * Purpose: Complete building management with 9 tabs system
 * Features: Overview, Tasks, Team, Inventory, Compliance, History, Routes, Media, Settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { NamedCoordinate, BuildingMetrics, ComplianceIssue } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';
import { BuildingOverviewTab } from './tabs/BuildingOverviewTab';
import { BuildingTasksTab } from './tabs/BuildingTasksTab';
import { BuildingTeamTab } from './tabs/BuildingTeamTab';
import { BuildingInventoryTab } from './tabs/BuildingInventoryTab';
import { BuildingComplianceTab } from './tabs/BuildingComplianceTab';
import { BuildingHistoryTab } from './tabs/BuildingHistoryTab';
import { BuildingRoutesTab } from './tabs/BuildingRoutesTab';
import { BuildingMediaTab } from './tabs/BuildingMediaTab';
import { BuildingSettingsTab } from './tabs/BuildingSettingsTab';

export interface BuildingDetailViewProps {
  container: ServiceContainer;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  onBack?: () => void;
  onWorkerPress?: (workerId: string) => void;
  onTaskPress?: (taskId: string) => void;
  onCompliancePress?: (issue: ComplianceIssue) => void;
}

export enum BuildingDetailTab {
  OVERVIEW = 'Overview',
  TASKS = 'Tasks',
  TEAM = 'Team',
  INVENTORY = 'Inventory',
  COMPLIANCE = 'Compliance',
  HISTORY = 'History',
  ROUTES = 'Routes',
  MEDIA = 'Media',
  SETTINGS = 'Settings'
}

export interface BuildingDetailData {
  building: {
    id: string;
    name: string;
    address: string;
    coordinate: {
      latitude: number;
      longitude: number;
    };
    metrics: BuildingMetrics;
    status: 'active' | 'inactive' | 'maintenance';
    lastInspection?: Date;
    nextInspection?: Date;
  };
  workers: Array<{
    id: string;
    name: string;
    role: string;
    status: 'online' | 'offline' | 'busy';
    currentTasks: number;
    completionRate: number;
    lastSeen: Date;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedWorker?: string;
    dueDate: Date;
    estimatedDuration: number;
  }>;
  compliance: {
    score: number;
    issues: ComplianceIssue[];
    lastUpdate: Date;
    nextInspection?: Date;
  };
  inventory: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    status: 'available' | 'low_stock' | 'out_of_stock';
    lastUpdated: Date;
  }>;
  routes: Array<{
    id: string;
    name: string;
    description: string;
    waypoints: Array<{
      id: string;
      name: string;
      coordinate: { latitude: number; longitude: number };
      order: number;
    }>;
    estimatedDuration: number;
    lastUsed?: Date;
  }>;
  media: Array<{
    id: string;
    type: 'photo' | 'video' | 'document';
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    uploadedBy: string;
    uploadedAt: Date;
    tags: string[];
  }>;
}

export const BuildingDetailView: React.FC<BuildingDetailViewProps> = ({
  container,
  buildingId,
  buildingName,
  buildingAddress,
  onBack,
  onWorkerPress,
  onTaskPress,
  onCompliancePress,
}) => {
  const [selectedTab, setSelectedTab] = useState<BuildingDetailTab>(BuildingDetailTab.OVERVIEW);
  const [buildingData, setBuildingData] = useState<BuildingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load building data
  const loadBuildingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get building metrics
      const metrics = await container.metrics?.getBuildingMetrics?.(buildingId);
      
      // Get workers assigned to this building
      const workers = await container.workers?.getWorkersByBuilding?.(buildingId) || [];
      
      // Get tasks for this building
      const tasks = await container.tasks?.getTasksByBuilding?.(buildingId) || [];
      
      // Get compliance data
      const compliance = await container.compliance?.getBuildingCompliance?.(buildingId);
      
      // Get inventory
      const inventory = await container.inventory?.getBuildingInventory?.(buildingId) || [];
      
      // Get routes
      const routes = await container.routes?.getBuildingRoutes?.(buildingId) || [];
      
      // Get media
      const media = await container.media?.getBuildingMedia?.(buildingId) || [];

      const data: BuildingDetailData = {
        building: {
          id: buildingId,
          name: buildingName,
          address: buildingAddress,
          coordinate: { latitude: 40.7450, longitude: -73.9950 }, // Default coordinate
          metrics: metrics || {
            efficiency: 0.85,
            quality: 0.92,
            compliance: 0.88,
            costPerSqFt: 3.2,
            taskCount: tasks.length,
            completionRate: 0.78,
            averageResponseTime: 2.5,
            lastInspection: new Date(),
            criticalIssues: 0
          },
          status: 'active',
          lastInspection: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          nextInspection: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        workers: workers.map(worker => ({
          id: worker.id,
          name: worker.name,
          role: worker.role || 'Maintenance',
          status: worker.isActive ? 'online' : 'offline',
          currentTasks: tasks.filter(task => task.assignedWorkerId === worker.id).length,
          completionRate: 0.85,
          lastSeen: new Date(),
        })),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.taskName,
          description: task.description || '',
          status: task.isCompleted ? 'completed' : 
                  task.isOverdue ? 'overdue' : 
                  task.assignedWorkerId ? 'in_progress' : 'pending',
          priority: task.priority || 'medium',
          assignedWorker: task.assignedWorkerId,
          dueDate: task.dueDate || new Date(),
          estimatedDuration: task.estimatedDuration || 60,
        })),
        compliance: {
          score: compliance?.score || 88,
          issues: compliance?.issues || [],
          lastUpdate: new Date(),
          nextInspection: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        inventory: inventory.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          quantity: item.quantity || 0,
          status: item.quantity === 0 ? 'out_of_stock' : 
                  item.quantity < 5 ? 'low_stock' : 'available',
          lastUpdated: new Date(),
        })),
        routes: routes.map(route => ({
          id: route.id,
          name: route.name,
          description: route.description || '',
          waypoints: route.waypoints || [],
          estimatedDuration: route.estimatedDuration || 30,
          lastUsed: route.lastUsed,
        })),
        media: media.map(mediaItem => ({
          id: mediaItem.id,
          type: mediaItem.type || 'photo',
          title: mediaItem.title,
          description: mediaItem.description,
          url: mediaItem.url,
          thumbnailUrl: mediaItem.thumbnailUrl,
          uploadedBy: mediaItem.uploadedBy || 'System',
          uploadedAt: mediaItem.uploadedAt || new Date(),
          tags: mediaItem.tags || [],
        })),
      };

      setBuildingData(data);
    } catch (error) {
      console.error('Failed to load building data:', error);
      setError('Failed to load building data');
    } finally {
      setIsLoading(false);
    }
  }, [container, buildingId, buildingName, buildingAddress]);

  useEffect(() => {
    loadBuildingData();
  }, [loadBuildingData]);

  const handleTabPress = useCallback((tab: BuildingDetailTab) => {
    setSelectedTab(tab);
  }, []);

  const getTabIcon = (tab: BuildingDetailTab): string => {
    switch (tab) {
      case BuildingDetailTab.OVERVIEW: return '📊';
      case BuildingDetailTab.TASKS: return '✅';
      case BuildingDetailTab.TEAM: return '👥';
      case BuildingDetailTab.INVENTORY: return '📦';
      case BuildingDetailTab.COMPLIANCE: return '🛡️';
      case BuildingDetailTab.HISTORY: return '📅';
      case BuildingDetailTab.ROUTES: return '🗺️';
      case BuildingDetailTab.MEDIA: return '📷';
      case BuildingDetailTab.SETTINGS: return '⚙️';
      default: return '📊';
    }
  };

  const getTabBadgeCount = (tab: BuildingDetailTab): number => {
    if (!buildingData) return 0;
    
    switch (tab) {
      case BuildingDetailTab.TASKS:
        return buildingData.tasks.filter(task => task.status === 'pending' || task.status === 'overdue').length;
      case BuildingDetailTab.TEAM:
        return buildingData.workers.filter(worker => worker.status === 'online').length;
      case BuildingDetailTab.COMPLIANCE:
        return buildingData.compliance.issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length;
      case BuildingDetailTab.INVENTORY:
        return buildingData.inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;
      default:
        return 0;
    }
  };

  const renderTabContent = () => {
    if (!buildingData) return null;

    switch (selectedTab) {
      case BuildingDetailTab.OVERVIEW:
        return (
          <BuildingOverviewTab
            building={buildingData.building}
            metrics={buildingData.building.metrics}
            onWorkerPress={onWorkerPress}
            onTaskPress={onTaskPress}
          />
        );
      case BuildingDetailTab.TASKS:
        return (
          <BuildingTasksTab
            tasks={buildingData.tasks}
            workers={buildingData.workers}
            onTaskPress={onTaskPress}
            onWorkerPress={onWorkerPress}
          />
        );
      case BuildingDetailTab.TEAM:
        return (
          <BuildingTeamTab
            workers={buildingData.workers}
            onWorkerPress={onWorkerPress}
          />
        );
      case BuildingDetailTab.INVENTORY:
        return (
          <BuildingInventoryTab
            inventory={buildingData.inventory}
          />
        );
      case BuildingDetailTab.COMPLIANCE:
        return (
          <BuildingComplianceTab
            compliance={buildingData.compliance}
            onCompliancePress={onCompliancePress}
          />
        );
      case BuildingDetailTab.HISTORY:
        return (
          <BuildingHistoryTab
            building={buildingData.building}
          />
        );
      case BuildingDetailTab.ROUTES:
        return (
          <BuildingRoutesTab
            routes={buildingData.routes}
            building={buildingData.building}
          />
        );
      case BuildingDetailTab.MEDIA:
        return (
          <BuildingMediaTab
            media={buildingData.media}
          />
        );
      case BuildingDetailTab.SETTINGS:
        return (
          <BuildingSettingsTab
            building={buildingData.building}
            onBuildingUpdate={loadBuildingData}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.base.primary} />
        <Text style={styles.loadingText}>Loading building details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBuildingData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!buildingData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No building data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{buildingData.building.name}</Text>
            <Text style={styles.headerSubtitle}>{buildingData.building.address}</Text>
          </View>
          <View style={styles.headerStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: buildingData.building.status === 'active' ? Colors.status.success : Colors.status.warning }
            ]} />
            <Text style={styles.statusText}>
              {buildingData.building.status.charAt(0).toUpperCase() + buildingData.building.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {Object.values(BuildingDetailTab).map((tab) => {
          const badgeCount = getTabBadgeCount(tab);
          const isSelected = selectedTab === tab;
          
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                { backgroundColor: isSelected ? Colors.base.primary : Colors.glass.thin }
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={styles.tabIcon}>{getTabIcon(tab)}</Text>
              <Text style={[
                styles.tabText,
                { color: isSelected ? Colors.text.primary : Colors.text.secondary }
              ]}>
                {tab}
              </Text>
              {badgeCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.status.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.base.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: Colors.glass.regular,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.base.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  tabContainer: {
    backgroundColor: Colors.glass.thin,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
  },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    minWidth: 100,
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  tabBadge: {
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  tabBadgeText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
});

export default BuildingDetailView;

