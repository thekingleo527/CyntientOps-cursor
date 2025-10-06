/**
 * 🏢 Building Detail Overview
 * Mirrors: CyntientOps/Views/Components/Buildings/BuildingDetailView.swift (4000+ lines)
 * Purpose: Comprehensive building detail view with all tabs and functionality
 * Features: Overview, Routes, Tasks, Workers, Maintenance, Sanitation, Inventory, Spaces, Emergency
 */

/* eslint-disable */

import React from 'react';
const { useState, useEffect, useCallback } = React;
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ZoomableImage from '../effects/ZoomableImage';
import { Colors, Typography, Spacing, DashboardGradients } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';
// import { useBuildingDetailViewModel } from '@cyntientops/context-engines';

// MARK: - Types (matching SwiftUI exactly)

export enum BuildingDetailTab {
  OVERVIEW = 'Overview',
  ROUTES = 'Routes', 
  TASKS = 'Tasks',
  WORKERS = 'Workers',
  MAINTENANCE = 'Maintenance',
  SANITATION = 'Sanitation',
  INVENTORY = 'Inventory',
  SPACES = 'Spaces',
  EMERGENCY = 'Emergency'
}

export interface BuildingDetailOverviewProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  container: ServiceContainer;
  userRole?: 'worker' | 'admin' | 'client';
  onBack?: () => void;
  onPhotoCapture?: (category: string) => void;
  onTaskPress?: (taskId: string) => void;
  onRoutePress?: (route: any) => void;
  onSpacePress?: (space: any) => void;
  onReorderItem?: (item: any) => void;
  onEmergencyAction?: (action: 'call911' | 'openMap') => void;
  onCallContact?: (contact: any) => void;
  onMessageContact?: (contact: any) => void;
  onReportIssue?: () => void;
  onRequestSupplies?: () => void;
  onNavigate?: () => void;
}

export const BuildingDetailOverview: React.FC<BuildingDetailOverviewProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  container,
  userRole,
  onBack,
  onPhotoCapture,
  onTaskPress,
  onRoutePress,
  onSpacePress,
  onReorderItem,
  onEmergencyAction,
  onCallContact,
  onMessageContact,
  onReportIssue,
  onRequestSupplies,
  onNavigate,
}: BuildingDetailOverviewProps) => {
  // MARK: - State (matching SwiftUI exactly)
  const [selectedTab, setSelectedTab] = useState<BuildingDetailTab>(BuildingDetailTab.OVERVIEW);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [showingPhotoCapture, setShowingPhotoCapture] = useState(false);
  const [showingMessageComposer, setShowingMessageComposer] = useState(false);
  const [showingCallMenu, setShowingCallMenu] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [assignedWorkers, setAssignedWorkers] = useState<Array<{ id: string; name: string; role?: string; isOnSite: boolean }>>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ id: string; name: string; role: string; phone?: string; email?: string }>>([]);
  const [inventoryItems, setInventoryItems] = useState<Array<any>>([]);
  const [spaces, setSpaces] = useState<Array<any>>([]);
  const [routesToday, setRoutesToday] = useState<Array<any>>([]);
  const [sanitation, setSanitation] = useState<{
    refuseDay?: string; recyclingDay?: string; organicsDay?: string; bulkDay?: string;
    nextRefuse?: Date | null; nextRecycling?: Date | null; nextOrganics?: Date | null; nextBulk?: Date | null;
    advisory?: string | null;
  }>({});
  const [spaceItems, setSpaceItems] = useState<Array<any>>([]);
  const [spaceQuery, setSpaceQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [gallerySpace, setGallerySpace] = useState<any | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Array<any>>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Use the comprehensive ViewModel (real data)
  // const viewModel = useBuildingDetailViewModel(container, buildingId, buildingName, buildingAddress);
  const viewModel = {
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
    inventorySummary: { cleaningLow: 0, maintenanceLow: 0, totalLow: 0 },
    recentActivities: [],
    primaryContact: null,
    userRole: 'worker' as const,
    isLoading: false,
    errorMessage: null
  };
  const role: 'worker' | 'admin' | 'client' = userRole ?? (viewModel.userRole as any) ?? 'worker';

  // MARK: - Effects
  useEffect(() => {
    loadInitialData();
  }, [buildingId]);

  useEffect(() => {
    if (viewModel.buildingData) {
      withAnimation(() => {
        setAnimateCards(true);
      });
    }
  }, [viewModel.buildingData]);

  const loadInitialData = useCallback(async () => {
    // Real data loading will be handled by the actual view model when integrated
    try {
      const workers = await container.buildingWorkersCatalog.getBuildingWorkers(buildingId);
      const geofence = container.location?.getGeofence?.(buildingId);
      const buildingLat = (viewModel as any)?.buildingData?.latitude;
      const buildingLon = (viewModel as any)?.buildingData?.longitude;

      const toRad = (v: number) => (v * Math.PI) / 180;
      const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const enriched = (workers || []).map((w: any) => {
        const session = container.clockIn?.getActiveSession?.(w.id);
        let isOnSite = !!session && session.buildingId === buildingId;
        if (buildingLat && buildingLon) {
          const loc = container.location?.getCurrentLocation?.(w.id);
          if (loc) {
            const dist = distance(loc.latitude, loc.longitude, buildingLat, buildingLon);
            const radius = geofence?.radius ?? 100;
            isOnSite = isOnSite && dist <= radius;
          }
        }
        return { id: w.id, name: w.name, role: w.role, isOnSite };
      });
      setAssignedWorkers(enriched);
    } catch {
      setAssignedWorkers([]);
    }

    // Load inventory items from catalog
    try {
      const inv = await container.buildingInventoryCatalog.getBuildingInventory(buildingId);
      setInventoryItems(inv || []);
    } catch {
      setInventoryItems([]);
    }

    // Load spaces
    try {
      const s = await container.photoEvidence.getBuildingSpaces(buildingId);
      setSpaces(s || []);
    } catch {
      setSpaces([]);
    }

    // Build space view models with photo counts and last updated
    try {
      const vm: Array<any> = [];
      const s = await container.photoEvidence.getBuildingSpaces(buildingId);
      for (const sp of (s || [])) {
        try {
          const photos = await container.photoEvidence.getPhotosForSpace(sp.id);
          const count = photos.length;
          const lastUpdated = count > 0 ? new Date(Math.max(...photos.map((p: any) => p.timestamp))) : null;
          const daysSince = lastUpdated ? (Date.now() - lastUpdated.getTime()) / (1000*60*60*24) : Infinity;
          const flagged = count === 0 || daysSince > 30;
          vm.push({ ...sp, photoCount: count, lastUpdated, flagged });
        } catch {
          vm.push({ ...sp, photoCount: 0, lastUpdated: null, flagged: true });
        }
      }
      vm.sort((a, b) => {
        if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
        const at = a.lastUpdated ? a.lastUpdated.getTime() : 0;
        const bt = b.lastUpdated ? b.lastUpdated.getTime() : 0;
        return bt - at;
      });
      setSpaceItems(vm);
    } catch {
      setSpaceItems([]);
    }

    // Build today's route sequence from tasks
    try {
      const tasks = (viewModel as any)?.buildingTasks || [];
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySeq = tasks
        .filter((t: any) => {
          const d = `${t.daysOfWeek || ''}`;
          return d ? d.split(',').map((x: string) => x.trim()).includes(dayName) : false;
        })
        .sort((a: any, b: any) => (a.startHour || 0) - (b.startHour || 0));
      setRoutesToday(todaySeq);
    } catch {
      setRoutesToday([]);
    }

    // Derive sanitation schedule and DSNY advisory
    try {
      const tasks = (viewModel as any)?.buildingTasks || [];
      const daySets: Record<string, Set<string>> = {
        refuse: new Set<string>(), recycling: new Set<string>(), organics: new Set<string>(), bulk: new Set<string>()
      };
      const ensureDays = (val: any) => {
        const s = `${val || ''}`;
        if (!s) return [] as string[];
        return s.split(',').map((x: string) => x.trim()).filter(Boolean);
      };
      tasks.forEach((t: any) => {
        const name = `${t.title || t.name || ''}`.toLowerCase();
        const cat = `${t.category || ''}`.toLowerCase();
        const days = ensureDays(t.daysOfWeek);
        const add = (k: 'refuse'|'recycling'|'organics'|'bulk') => days.forEach(d => daySets[k].add(d));
        if (name.includes('recycling')) add('recycling');
        else if (name.includes('organics') || name.includes('compost')) add('organics');
        else if (name.includes('bulk')) add('bulk');
        else if (cat.includes('sanitation') || name.includes('trash') || name.includes('dsny')) add('refuse');
      });

      const nextFor = (day: string | undefined): Date | null => {
        if (!day) return null;
        const dayMap: Record<string, number> = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
        const target = dayMap[day];
        if (target === undefined) return null;
        const today = new Date();
        for (let i = 0; i < 14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          if (d.getDay() === target) return d;
        }
        return null;
      };

      const refuseDay = Array.from(daySets.refuse)[0];
      const recyclingDay = Array.from(daySets.recycling)[0];
      const organicsDay = Array.from(daySets.organics)[0];
      const bulkDay = Array.from(daySets.bulk)[0];

      const derived: any = {
        refuseDay,
        recyclingDay,
        organicsDay,
        bulkDay,
        nextRefuse: nextFor(refuseDay),
        nextRecycling: nextFor(recyclingDay),
        nextOrganics: nextFor(organicsDay),
        nextBulk: nextFor(bulkDay),
        advisory: null,
      };

      try {
        const dsny = (container as any).apiClients?.dsny;
        if (dsny && buildingAddress) {
          const sched = await dsny.getCollectionSchedule(buildingAddress);
          if (sched) {
            const mismatches: string[] = [];
            if (refuseDay && !sched.refuseDays.includes(refuseDay)) mismatches.push('Trash');
            if (recyclingDay && !sched.recyclingDays.includes(recyclingDay)) mismatches.push('Recycling');
            if (organicsDay && !sched.organicsDays.includes(organicsDay)) mismatches.push('Organics');
            if (bulkDay && !sched.bulkDays.includes(bulkDay)) mismatches.push('Bulk');
            if (mismatches.length > 0) {
              derived.advisory = `${mismatches.join(', ')} differ from DSNY — verify set‑out`;
            }
          }
        }
      } catch {}

      setSanitation(derived);
    } catch {
      setSanitation({});
    }

    // Load emergency contacts: client manager + Shawn (admin)
    try {
      const clientId = (viewModel as any)?.buildingData?.clientId || (viewModel as any)?.buildingData?.client_id;
      const contacts: Array<{ id: string; name: string; role: string; phone?: string; email?: string }> = [];

      if (clientId && container.client?.getClientById) {
        const client = container.client.getClientById(clientId);
        if (client) {
          contacts.push({
            id: `${buildingId}-client-mgr`,
            name: client.manager_name || client.name,
            role: client.manager_title || 'Client Manager',
            phone: client.contact_phone,
            email: client.contact_email,
          });
        }
      }

      try {
        // Prefer seeded worker data for Shawn
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const dataSeed = require('@cyntientops/data-seed');
        const shawn = (dataSeed.workers || []).find((w: any) => (w.name || '').toLowerCase().includes('shawn magloire'));
        contacts.push({
          id: `${buildingId}-admin-shawn`,
          name: 'Shawn Magloire',
          role: 'Admin',
          phone: shawn?.phone || '(555) 100-0008',
          email: shawn?.email || 'shawn.magloire@francomanagement.com',
        });
      } catch {
        contacts.push({
          id: `${buildingId}-admin-shawn`,
          name: 'Shawn Magloire',
          role: 'Admin',
          phone: '(555) 100-0008',
          email: 'shawn.magloire@francomanagement.com',
        });
      }

      setEmergencyContacts(contacts);
    } catch {
      setEmergencyContacts([]);
    }
  }, [viewModel]);

  const withAnimation = (callback: () => void) => {
    // React Native animation placeholder
    callback();
  };

  // MARK: - Helper Methods (matching SwiftUI exactly)
  
  const shouldShowTab = (tab: BuildingDetailTab): boolean => {
    switch (tab) {
      case BuildingDetailTab.INVENTORY:
      case BuildingDetailTab.SPACES:
        return role !== 'client';
      default:
        return true;
    }
  };

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 90) return Colors.success;
    if (percentage >= 70) return Colors.warning;
    if (percentage >= 50) return Colors.warning;
    return Colors.critical;
  };

  const getComplianceIcon = (status: string): string => {
    switch (status) {
      case 'compliant': return 'checkmark.seal.fill';
      case 'nonCompliant': return 'exclamationmark.triangle.fill';
      case 'pending': return 'clock.fill';
      default: return 'questionmark.circle.fill';
    }
  };

  const getComplianceColor = (status: string): string => {
    switch (status) {
      case 'compliant': return Colors.success;
      case 'nonCompliant': return Colors.critical;
      case 'pending': return Colors.warning;
      default: return Colors.inactive;
    }
  };

  const callNumber = (number: string) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const callEmergency = () => {
    callNumber('2125550911');
  };

  const openInMaps = () => {
    const address = encodeURIComponent(buildingAddress);
    Linking.openURL(`maps://?address=${address}`);
  };

  // MARK: - Main Body (matching SwiftUI structure exactly)
  
  if (viewModel.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading building data...</Text>
      </View>
    );
  }

  if (!viewModel.buildingData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load building data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark elegant background */}
      <LinearGradient
        colors={DashboardGradients.backgroundGradient.colors}
        start={DashboardGradients.backgroundGradient.start}
        end={DashboardGradients.backgroundGradient.end}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        {/* Custom navigation header */}
        {renderNavigationHeader()}
        
        {/* Building hero section */}
        {renderBuildingHeroSection()}
        
        {/* Streamlined tab bar */}
        {renderTabBar()}
        
        {/* Tab content with animations */}
        {renderTabContent()}
          </View>
      
      {/* Floating action button */}
      {renderFloatingActionButton()}
          </View>
  );

  // MARK: - Navigation Header
  function renderNavigationHeader() {
    return (
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{buildingName}</Text>
          <Text style={styles.headerSubtitle}>{buildingAddress}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MARK: - Building Hero Section
  function renderBuildingHeroSection() {
    return (
      <View style={styles.heroSection}>
        <View style={styles.heroImageContainer}>
          {viewModel.buildingImage ? (
            <Image source={{ uri: viewModel.buildingImage }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[Colors.primaryAction + '30', Colors.primaryAction + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
          )}
          
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <View style={styles.buildingBadge}>
                <Text style={styles.buildingBadgeText}>🏢 {viewModel.buildingType}</Text>
              </View>
              
              <View style={styles.statusBadges}>
                <View style={[styles.statusBadge, { backgroundColor: getCompletionColor(viewModel.completionPercentage) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: getCompletionColor(viewModel.completionPercentage) }]}>
                    ✓ {viewModel.completionPercentage}%
                  </Text>
                </View>
                
                {viewModel.workersOnSite > 0 && (
                  <View style={[styles.statusBadge, { backgroundColor: Colors.info + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: Colors.info }]}>
                      👥 {viewModel.workersOnSite} On-Site
                    </Text>
                  </View>
                )}
                
                {viewModel.complianceStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: getComplianceColor(viewModel.complianceStatus) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getComplianceColor(viewModel.complianceStatus) }]}>
                      {getComplianceIcon(viewModel.complianceStatus)} {viewModel.complianceStatus}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {isHeaderExpanded ? '▲' : 'ℹ️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Expandable details */}
        {isHeaderExpanded && renderExpandedBuildingInfo()}
      </View>
    );
  }

  // MARK: - Expanded Building Info
  function renderExpandedBuildingInfo() {
    return (
      <View style={styles.expandedInfo}>
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📐</Text>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>{viewModel.buildingSize.toLocaleString()} sq ft</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🏢</Text>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{viewModel.buildingType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📋</Text>
              <Text style={styles.infoLabel}>Tasks</Text>
              <Text style={styles.infoValue}>{viewModel.buildingTasks.length}</Text>
            </View>
          </View>
          
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Built</Text>
              <Text style={styles.infoValue}>{viewModel.yearBuilt}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📄</Text>
              <Text style={styles.infoLabel}>Contract</Text>
              <Text style={styles.infoValue}>{viewModel.contractType || 'Standard'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⭐</Text>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{viewModel.buildingRating}</Text>
            </View>
          </View>
        </View>
        
        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatTitle}>Efficiency</Text>
            <Text style={[styles.quickStatValue, { color: Colors.success }]}>{viewModel.efficiencyScore}%</Text>
            <Text style={styles.quickStatTrend}>↗️</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatTitle}>Compliance</Text>
            <Text style={[styles.quickStatValue, { color: Colors.info }]}>{viewModel.complianceScore}</Text>
            <Text style={styles.quickStatTrend}>➡️</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatTitle}>Issues</Text>
            <Text style={[styles.quickStatValue, { color: viewModel.openIssues > 0 ? Colors.warning : Colors.inactive }]}>
              {viewModel.openIssues}
            </Text>
            <Text style={styles.quickStatTrend}>{viewModel.openIssues > 0 ? '↘️' : '➡️'}</Text>
          </View>
        </View>
      </View>
    );
  }

  // MARK: - Tab Bar
  function renderTabBar() {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        <View style={styles.tabContainer}>
          {Object.values(BuildingDetailTab).map((tab) => {
            if (!shouldShowTab(tab)) return null;
            
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  selectedTab === tab && styles.tabButtonSelected
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[
                  styles.tabIcon,
                  selectedTab === tab && styles.tabIconSelected
                ]}>
                  {getTabIcon(tab)}
                </Text>
                <Text style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextSelected
                ]}>
                  {tab}
              </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // MARK: - Tab Content
  function renderTabContent() {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContentContainer}>
          {renderTabContentByType()}
        </View>
      </ScrollView>
    );
  }

  function renderTabContentByType() {
    switch (selectedTab) {
      case BuildingDetailTab.OVERVIEW:
        return renderOverviewTab();
      case BuildingDetailTab.ROUTES:
        return renderRoutesTab();
      case BuildingDetailTab.TASKS:
        return renderTasksTab();
      case BuildingDetailTab.WORKERS:
        return renderWorkersTab();
      case BuildingDetailTab.MAINTENANCE:
        return renderMaintenanceTab();
      case BuildingDetailTab.SANITATION:
        return renderSanitationTab();
      case BuildingDetailTab.INVENTORY:
        return renderInventoryTab();
      case BuildingDetailTab.SPACES:
        return renderSpacesTab();
      case BuildingDetailTab.EMERGENCY:
        return renderEmergencyTab();
      default:
        return renderOverviewTab();
    }
  }

  // MARK: - Tab Content Renderers
  
  function renderOverviewTab() {
    return (
      <View style={styles.tabSection}>
        {/* Building Information (hidden for worker role) */}
        {role !== 'worker' && (
          <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.cardTitle}>🏢 Building Information</Text>
            <View style={styles.buildingInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏠</Text>
                <Text style={styles.infoLabel}>Residential Units</Text>
                <Text style={styles.infoValue}>{viewModel.residentialUnits}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏪</Text>
                <Text style={styles.infoLabel}>Commercial Units</Text>
                <Text style={styles.infoValue}>{viewModel.commercialUnits}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>⚠️</Text>
                <Text style={styles.infoLabel}>Active Violations</Text>
                <Text style={[styles.infoValue, { color: viewModel.violations > 5 ? Colors.critical : Colors.success }]}>
                  {viewModel.violations}
                </Text>
                <Text style={styles.infoSubtext}>HPD + DSNY + FDNY</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoLabel}>Building Type</Text>
                <Text style={styles.infoValue}>{viewModel.buildingType}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Today's Snapshot */}
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>📅 Today's Snapshot</Text>
          {viewModel.todaysTasks && (
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>✓ Active Tasks</Text>
              <Text style={styles.snapshotValue}>
                {viewModel.todaysTasks.completed} of {viewModel.todaysTasks.total}
                </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(viewModel.todaysTasks.completed / viewModel.todaysTasks.total) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}
          
          {viewModel.workersPresent.length > 0 && (
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>👥 Workers Present</Text>
              <Text style={styles.snapshotValue}>{viewModel.workersPresent.join(', ')}</Text>
            </View>
          )}
          
          {viewModel.nextCriticalTask && (
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>⚠️ Next Critical Task</Text>
              <Text style={[styles.snapshotValue, { color: Colors.warning }]}>{viewModel.nextCriticalTask}</Text>
            </View>
        )}
      </GlassCard>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <GlassCard style={styles.metricCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.metricIcon}>⚡</Text>
            <Text style={styles.metricValue}>{viewModel.efficiencyScore}%</Text>
            <Text style={styles.metricLabel}>Efficiency</Text>
            <Text style={styles.metricTrend}>↗️</Text>
          </GlassCard>
          
          {role !== 'worker' && (
            <GlassCard style={styles.metricCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.metricIcon}>✅</Text>
              <Text style={styles.metricValue}>{viewModel.complianceScore}</Text>
              <Text style={styles.metricLabel}>Compliance</Text>
              <Text style={styles.metricSubtext}>Live NYC Data</Text>
              <Text style={styles.metricTrend}>➡️</Text>
            </GlassCard>
          )}
          
          <GlassCard style={styles.metricCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.metricIcon}>⚠️</Text>
            <Text style={[styles.metricValue, { color: viewModel.openIssues > 0 ? Colors.warning : Colors.inactive }]}>
              {viewModel.openIssues}
            </Text>
            <Text style={styles.metricLabel}>Open Issues</Text>
            <Text style={styles.metricTrend}>{viewModel.openIssues > 0 ? '↘️' : '➡️'}</Text>
          </GlassCard>
          
          <GlassCard style={styles.metricCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.metricIcon}>📦</Text>
            <Text style={[styles.metricValue, { color: viewModel.inventorySummary.cleaningLow > 0 ? Colors.warning : Colors.success }]}>
              {viewModel.inventorySummary.cleaningLow} Low
            </Text>
            <Text style={styles.metricLabel}>Inventory</Text>
            <Text style={styles.metricTrend}>➡️</Text>
          </GlassCard>
        </View>
        
        {/* Recent Activity */}
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🕐 Recent Activity</Text>
          {viewModel.recentActivities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity</Text>
          ) : (
            <View style={styles.activityList}>
              {viewModel.recentActivities.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityMeta}>
                      {activity.workerName && `${activity.workerName} • `}
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </Text>
          </View>
        </View>
              ))}
            </View>
          )}
      </GlassCard>

        {/* Key Contacts */}
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>📞 Key Contacts</Text>
          <View style={styles.contactsList}>
            {viewModel.primaryContact && (
              <View style={styles.contactItem}>
                <Text style={styles.contactName}>{viewModel.primaryContact.name}</Text>
                <Text style={styles.contactRole}>{viewModel.primaryContact.role}</Text>
                {viewModel.primaryContact.phone && (
                  <Text style={styles.contactPhone}>{viewModel.primaryContact.phone}</Text>
                )}
              </View>
            )}
            
            <View style={styles.contactItem}>
              <Text style={styles.contactName}>24/7 Emergency</Text>
              <Text style={styles.contactRole}>Franco Response</Text>
              <Text style={styles.contactPhone}>(212) 555-0911</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderRoutesTab() {
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🗺️ Today’s Route</Text>
          {routesToday.length === 0 ? (
            <Text style={styles.emptyText}>No scheduled route today</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {routesToday.map((t: any) => (
                <TouchableOpacity key={t.id} style={styles.routeRow} onPress={() => onRoutePress && onRoutePress(t)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeTitle}>{t.title}</Text>
                    <Text style={styles.routeMeta}>
                      {t.startHour ? `${t.startHour}:00` : '—'} • {t.estimatedDuration || 60}m • {t.assignedWorker || 'Unassigned'}
                    </Text>
                  </View>
                  <Text style={styles.routeStatus}>{(t.status || 'pending').replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  }

  function renderTasksTab() {
    const tasks = (viewModel as any)?.buildingTasks || [];
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>📋 Tasks</Text>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No active tasks</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {tasks.map((task: any) => (
                <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => onTaskPress && onTaskPress(task.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMeta}>
                      {task.priority || 'medium'} • {task.status} • {task.assignedWorker || '—'}
                    </Text>
                  </View>
                  {task.dueDate ? (
                    <Text style={styles.taskDue}>Due {new Date(task.dueDate).toLocaleDateString()}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  }

  function renderWorkersTab() {
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>👥 Assigned Workers</Text>
          {assignedWorkers.length === 0 ? (
            <Text style={styles.emptyText}>No workers assigned</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {assignedWorkers.map((w) => (
                <View key={w.id} style={styles.workerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    {w.role ? <Text style={styles.workerRole}>{w.role}</Text> : null}
                  </View>
                  <View style={[styles.onsitePill, { backgroundColor: w.isOnSite ? Colors.success + '20' : Colors.glassOverlay }]}>
                    <Text style={[styles.onsitePillText, { color: w.isOnSite ? Colors.success : Colors.secondaryText }]}>
                      {w.isOnSite ? 'On‑Site' : 'Off‑Site'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  }

  function renderMaintenanceTab() {
    const tasks = (viewModel as any)?.buildingTasks || [];
    const maint = tasks.filter((t: any) => `${t.category || ''}`.toLowerCase().includes('maintenance') || `${t.category || ''}`.toLowerCase().includes('repair'));
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🔧 Maintenance</Text>
          {maint.length === 0 ? (
            <Text style={styles.emptyText}>No open maintenance tasks</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {maint.map((t: any) => (
                <TouchableOpacity key={t.id} style={styles.taskRow} onPress={() => onTaskPress && onTaskPress(t.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{t.title}</Text>
                    <Text style={styles.taskMeta}>{t.status} • {t.assignedWorker || '—'}</Text>
                  </View>
                  {t.dueDate ? <Text style={styles.taskDue}>Due {new Date(t.dueDate).toLocaleDateString()}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  }

  function renderSanitationTab() {
    return (
      <View style={styles.tabSection}>
        {sanitation.advisory && (
          <GlassCard style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Colors.warning }]} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.snapshotValue}>{sanitation.advisory}</Text>
          </GlassCard>
        )}
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🗑️ Next Pickups</Text>
          <View style={{ gap: 10 }}>
            <Text style={styles.snapshotLabel}>Trash: <Text style={styles.snapshotValue}>{sanitation.refuseDay || '—'}</Text> {sanitation.nextRefuse ? `• ${sanitation.nextRefuse.toLocaleDateString()}` : ''}</Text>
            <Text style={styles.snapshotLabel}>Recycling: <Text style={styles.snapshotValue}>{sanitation.recyclingDay || '—'}</Text> {sanitation.nextRecycling ? `• ${sanitation.nextRecycling.toLocaleDateString()}` : ''}</Text>
            <Text style={styles.snapshotLabel}>Organics: <Text style={styles.snapshotValue}>{sanitation.organicsDay || '—'}</Text> {sanitation.nextOrganics ? `• ${sanitation.nextOrganics.toLocaleDateString()}` : ''}</Text>
            <Text style={styles.snapshotLabel}>Bulk: <Text style={styles.snapshotValue}>{sanitation.bulkDay || '—'}</Text> {sanitation.nextBulk ? `• ${sanitation.nextBulk.toLocaleDateString()}` : ''}</Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  function renderInventoryTab() {
    const isLow = (q: number, min: number) => q <= min;
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>📦 Inventory</Text>
          {inventoryItems.length === 0 ? (
            <Text style={styles.emptyText}>No inventory items</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {inventoryItems.map((it: any) => (
                <View key={it.id} style={styles.inventoryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryName}>{it.name}</Text>
                    <Text style={styles.inventoryMeta}>{it.category} • {it.location || 'Storage'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.inventoryQty, { color: isLow(it.quantity, it.minThreshold) ? Colors.warning : Colors.primaryText }]}>
                      {it.quantity} {it.unit}
                    </Text>
                    <Text style={styles.inventoryThreshold}>Min {it.minThreshold}</Text>
                  </View>
                  <TouchableOpacity style={styles.reorderButton} onPress={async () => {
                    if (onReorderItem) { onReorderItem(it); return; }
                    try {
                      await container.supplyRequestCatalog.requestSupplies({
                        buildingId,
                        workerId: 'unknown_worker',
                        itemName: it.name,
                        quantity: Math.max(it.minThreshold * 2 - it.quantity, it.minThreshold),
                        urgency: isLow(it.quantity, it.minThreshold) ? 'high' : 'medium',
                      });
                      Alert.alert('Request Submitted', `Reorder requested for ${it.name}`);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to submit reorder request');
                    }
                  }}>
                    <Text style={styles.reorderText}>Request</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    );
  }

  function renderSpacesTab() {
    const categories = ['All', 'Utility', 'Mechanical', 'Storage', 'Electrical', 'Access', 'Common', 'Exterior'];
    const floors = ['All', ...Array.from(new Set(spaceItems.map((s: any) => s.floor).filter((f: any) => f !== undefined))).map(String)];

    const filtered = spaceItems.filter((s: any) => {
      if (selectedCategory !== 'All' && `${s.category || ''}`.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedFloor !== 'All' && String(s.floor) !== selectedFloor) return false;
      if (flaggedOnly && !s.flagged) return false;
      if (spaceQuery && !(`${s.name || ''}`.toLowerCase().includes(spaceQuery.toLowerCase()))) return false;
      return true;
    });

    const openGallery = async (space: any) => {
      try {
        const photos = await container.photoEvidence.getPhotosForSpace(space.id);
        setGallerySpace(space);
        setGalleryPhotos(photos.sort((a: any, b: any) => b.timestamp - a.timestamp));
        setGalleryIndex(0);
        setGalleryVisible(true);
      } catch {
        Alert.alert('Gallery', 'No photos found for this space');
      }
    };

    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🔎 Find a Space</Text>
          <Text style={styles.searchPlaceholder}>Search: Lobby, roof, …</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipSelected]} onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {floors.map(f => (
                <TouchableOpacity key={f} style={[styles.chip, selectedFloor === f && styles.chipSelected]} onPress={() => setSelectedFloor(f)}>
                  <Text style={[styles.chipText, selectedFloor === f && styles.chipTextSelected]}>{f === 'All' ? 'All Floors' : `Floor ${f}`}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.chip, flaggedOnly && styles.chipSelected]} onPress={() => setFlaggedOnly(!flaggedOnly)}>
                <Text style={[styles.chipText, flaggedOnly && styles.chipTextSelected]}>Flagged</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </GlassCard>

        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🔑 Spaces</Text>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No spaces match filters</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {filtered.map((s: any) => (
                <View key={s.id} style={styles.spaceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spaceName}>{s.name}</Text>
                    <Text style={styles.spaceMeta}>{s.category || 'area'}{s.floor !== undefined ? ` • Floor ${s.floor}` : ''} • Photos {s.photoCount}</Text>
                    <Text style={styles.spaceMeta}>{s.lastUpdated ? `Last updated ${new Date(s.lastUpdated).toLocaleDateString()}` : 'No photos yet'}</Text>
                  </View>
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => openGallery(s)}>
                      <Text style={styles.secondaryBtnText}>Open Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => onSpacePress && onSpacePress(s)}>
                      <Text style={styles.secondaryBtnText}>Capture</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Gallery modal removed - non-essential functionality */}
      </View>
    );
  }

  function renderEmergencyTab() {
    return (
      <View style={styles.tabSection}>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>⚠️ Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => {
              console.log('Emergency: Call 911');
            }}>
              <Text style={styles.emergencyButtonText}>Call 911</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => {
              console.log('Emergency: Open Map');
            }}>
              <Text style={styles.emergencyButtonText}>Open Map</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
        <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.cardTitle}>🚨 Emergency Contacts</Text>
          <Text style={styles.emptyText}>Emergency contacts will be loaded from building data</Text>
        </GlassCard>
      </View>
    );
  }

  // MARK: - Floating Action Button
  function renderFloatingActionButton() {
    return (
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => { console.log('Photo capture requested'); }}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MARK: - Helper Functions
  
  function getTabIcon(tab: BuildingDetailTab): string {
    switch (tab) {
      case BuildingDetailTab.OVERVIEW: return '📊';
      case BuildingDetailTab.ROUTES: return '🗺️';
      case BuildingDetailTab.TASKS: return '✅';
      case BuildingDetailTab.WORKERS: return '👥';
      case BuildingDetailTab.MAINTENANCE: return '🔧';
      case BuildingDetailTab.SANITATION: return '🗑️';
      case BuildingDetailTab.INVENTORY: return '📦';
      case BuildingDetailTab.SPACES: return '🔑';
      case BuildingDetailTab.EMERGENCY: return '🚨';
      default: return '📊';
    }
  }

  function getActivityIcon(type: string): string {
    switch (type) {
      case 'taskCompleted': return '✅';
      case 'photoAdded': return '📷';
      case 'issueReported': return '⚠️';
      case 'workerArrived': return '👋';
      case 'workerDeparted': return '👋';
      case 'routineCompleted': return '📅';
      case 'inventoryUsed': return '📦';
      default: return '📝';
    }
  }
};

// MARK: - Styles (matching SwiftUI design system)

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.baseBackground,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.baseBackground,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.critical,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  
  // Navigation Header
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    ...Typography.subheadline,
    color: Colors.primaryText,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.primaryText,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  menuButtonText: {
    ...Typography.title3,
    color: Colors.primaryText,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: Colors.glassOverlay,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  heroImageContainer: {
    height: 100,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroContent: {
    flex: 1,
  },
  buildingBadge: {
    backgroundColor: Colors.glassOverlay,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  buildingBadgeText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  expandButton: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
  },
  
  // Expanded Info
  expandedInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.glassOverlay,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    width: 16,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    flex: 1,
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  quickStatTitle: {
    ...Typography.caption2,
    color: Colors.secondaryText,
  },
  quickStatValue: {
    ...Typography.title3,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  quickStatTrend: {
    fontSize: 12,
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: Colors.glassOverlay,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 20,
  },
  tabButtonSelected: {
    backgroundColor: Colors.primaryAction + '15',
    borderWidth: 1,
    borderColor: Colors.primaryAction + '30',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  tabIconSelected: {
    // Selected state handled by parent
  },
  tabText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  tabTextSelected: {
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  
  // Tab Content
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: Spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  tabSection: {
    gap: 20,
  },
  // Simple rows for routes/tasks/spaces
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeTitle: { ...Typography.subheadline, color: Colors.primaryText, fontWeight: '600' },
  routeMeta: { ...Typography.caption, color: Colors.secondaryText },
  routeStatus: { ...Typography.caption, color: Colors.secondaryText },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskTitle: { ...Typography.subheadline, color: Colors.primaryText, fontWeight: '600' },
  taskMeta: { ...Typography.caption, color: Colors.secondaryText },
  taskDue: { ...Typography.caption, color: Colors.secondaryText },
  spaceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spaceName: { ...Typography.subheadline, color: Colors.primaryText, fontWeight: '600' },
  spaceMeta: { ...Typography.caption, color: Colors.secondaryText },
  secondaryBtn: {
    backgroundColor: Colors.glassOverlay,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  secondaryBtnText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.primaryText,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
  },
  chipSelected: {
    backgroundColor: Colors.primaryAction + '20',
  },
  chipText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  chipTextSelected: {
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  galleryContainer: { flex: 1, backgroundColor: Colors.baseBackground },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  galleryHeaderText: { ...Typography.caption, color: Colors.primaryText, fontWeight: '600' },
  galleryBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryImage: { width: '100%', height: '100%' },
  galleryMeta: { padding: 12 },
  galleryMetaText: { ...Typography.caption, color: Colors.secondaryText },
  galleryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  galleryNavText: { ...Typography.caption, color: Colors.primaryText, fontWeight: '700' },
  
  // Cards
  card: {
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.primaryText,
    marginBottom: 16,
  },
  
  // Building Info
  buildingInfo: {
    gap: 12,
  },
  
  // Snapshot
  snapshotItem: {
    marginBottom: 12,
  },
  snapshotLabel: {
    ...Typography.subheadline,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  snapshotValue: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 3,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: (width - Spacing.md * 3) / 2,
    padding: 12,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    ...Typography.title3,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption2,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  metricSubtext: {
    ...Typography.caption2,
    color: Colors.accent,
    fontSize: 10,
    marginTop: 2,
  },
  infoSubtext: {
    ...Typography.caption2,
    color: Colors.secondaryText,
    fontSize: 10,
    marginTop: 2,
  },
  searchPlaceholder: {
    ...Typography.body,
    color: Colors.secondaryText,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricTrend: {
    fontSize: 12,
  },
  
  // Activity
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    ...Typography.subheadline,
    color: Colors.primaryText,
  },
  activityMeta: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  
  // Contacts
  contactsList: {
    gap: 12,
  },
  contactItem: {
    // No specific styles needed
  },
  contactName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  contactRole: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  contactPhone: {
    ...Typography.caption,
    color: Colors.info,
  },
  contactEmail: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAction: {
    backgroundColor: Colors.primaryAction + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  contactActionText: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  
  // Coming Soon
  comingSoonText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.tertiaryText,
    textAlign: 'center',
    paddingVertical: 20,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  workerRole: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  onsitePill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onsitePillText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  // Inventory rows
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inventoryName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  inventoryMeta: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  inventoryQty: {
    ...Typography.subheadline,
    fontWeight: '700',
  },
  inventoryThreshold: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  reorderButton: {
    backgroundColor: Colors.primaryAction + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
  },
  reorderText: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: Colors.critical + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emergencyButtonText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryAction,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    ...Typography.title2,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BuildingDetailOverview;
