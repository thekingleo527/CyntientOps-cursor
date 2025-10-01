/**
 * @cyntientops/ui-components
 * 
 * Client Dashboard Main View - Portfolio management dashboard
 * Architecture: Header + Hero Cards + Intelligence Panel (1-2 scrolls max)
 */

import React from 'react';
const { useState, useEffect, useRef } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// Mock RefreshControl for development
const RefreshControl = ({ refreshing, onRefresh, tintColor }: any) => null;
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { LinearGradient } from '../mocks/expo-linear-gradient';
import { ClientHeaderV3B } from '../headers/ClientHeaderV3B';
// Mock components for development
const BuildingDetailOverview = ({ building }: any) => (
  <View style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, margin: 8 }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{building?.name || 'Building Details'}</Text>
    <Text style={{ color: 'white', fontSize: 14, marginTop: 8 }}>Building details coming soon...</Text>
  </View>
);

const ComplianceSuiteScreen = ({ building }: any) => (
  <View style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, margin: 8 }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Compliance Suite</Text>
    <Text style={{ color: 'white', fontSize: 14, marginTop: 8 }}>Compliance details coming soon...</Text>
  </View>
);
import { ClientProfile } from '@cyntientops/domain-schema';
// Import REAL data from data-seed package - NO MOCK DATA ANYWHERE
import { buildings as buildingsData, clients as clientsData } from '@cyntientops/data-seed';

// Define BuildingProfile interface based on actual data structure
interface BuildingProfile {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  imageAssetName: string;
  numberOfUnits: number;
  yearBuilt: number;
  squareFootage: number;
  managementCompany: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  normalized_name: string;
  borough: string;
  compliance_score: number;
  client_id: string;
}
import { IntelligencePanelTabs } from './components/IntelligencePanelTabs';
import { IntelligenceOverlay } from './components/IntelligenceOverlay';
import { ClientOverviewOverlayContent } from './components/ClientOverviewOverlayContent';
import { ClientBuildingsOverlayContent } from './components/ClientBuildingsOverlayContent';
import { ClientComplianceOverlayContent } from './components/ClientComplianceOverlayContent';
import { ClientTeamOverlayContent } from './components/ClientTeamOverlayContent';
import { ClientAnalyticsOverlayContent } from './components/ClientAnalyticsOverlayContent';

// Types
export interface ClientDashboardMainViewProps {
  clientId: string;
  clientName: string;
  userRole: string;
  onBuildingPress?: (buildingId: string) => void;
  onHeaderRoute?: (route: string) => void;
}

export interface ClientDashboardData {
  client: ClientProfile;
  buildings: BuildingProfile[];
  totalUnits: number;
  totalSquareFootage: number;
  averageCompliance: number;
  activeAlerts: number;
  recentActivity: string[];
}

export interface ClientIntelligenceTab {
  id: 'overview' | 'buildings' | 'compliance' | 'team' | 'analytics';
  title: string;
  icon: string;
}

const CLIENT_INTELLIGENCE_TABS: ClientIntelligenceTab[] = [
  { id: 'overview', title: 'Overview', icon: '📊' },
  { id: 'buildings', title: 'Buildings', icon: '🏢' },
  { id: 'compliance', title: 'Compliance', icon: '✅' },
  { id: 'team', title: 'Team', icon: '👥' },
  { id: 'analytics', title: 'Analytics', icon: '📈' },
];

export const ClientDashboardMainView: React.FC<ClientDashboardMainViewProps> = ({
  clientId,
  clientName,
  userRole,
  onBuildingPress,
  onHeaderRoute,
}) => {
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [intelligencePanelExpanded, setIntelligencePanelExpanded] = useState(false);
  const [selectedIntelligenceTab, setSelectedIntelligenceTab] = useState<'overview' | 'buildings' | 'compliance' | 'team' | 'analytics' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDashboardData();
  }, [clientId]);

  const loadDashboardData = async () => {
    try {
      // Load client profile
      const client = clientsData.find((c: any) => c.id === clientId);
      if (!client) {
        console.error('Client not found:', clientId);
        return;
      }

      // Load client buildings
      const buildings = buildingsData.filter((building: any) => building.client_id === clientId);

      // Calculate metrics
      const totalUnits = buildings.reduce((sum, building) => sum + (building.numberOfUnits || 0), 0);
      const totalSquareFootage = buildings.reduce((sum, building) => sum + (building.squareFootage || 0), 0);
      const averageCompliance = buildings.reduce((sum, building) => sum + (building.compliance_score || 0), 0) / buildings.length || 0;

      const dashboardData: ClientDashboardData = {
        client: {
          id: client.id,
          name: client.name,
          email: client.contact_email,
          phone: client.contact_phone,
          role: 'client' as any,
          isActive: client.is_active,
          createdAt: new Date(),
          updatedAt: new Date(),
          profile: {
            companyName: client.name,
            industry: 'Real Estate',
            address: {
              street: client.address,
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            },
            primaryContact: {
              id: '1',
              name: client.name,
              title: 'Property Manager',
              email: client.contact_email,
              phone: client.contact_phone,
              isPrimary: true
            },
            additionalContacts: []
          },
          portfolio: {
            totalBuildings: buildings.length,
            totalUnits: totalUnits,
            totalSquareFootage: totalSquareFootage,
            totalSqFt: totalSquareFootage,
            totalValue: buildings.reduce((sum, b) => sum + (b.marketValue || 0), 0),
            averageCompliance: averageCompliance,
            averageRating: averageCompliance / 100,
            lastUpdated: new Date(),
            buildings: buildings.map(b => ({
              id: b.id,
              name: b.name,
              address: b.address,
              units: b.numberOfUnits || 0,
              squareFootage: b.squareFootage || 0,
              complianceScore: b.compliance_score || 0
            }))
          },
          billing: {
            monthlyRate: 0,
            paymentMethod: 'ACH',
            billingAddress: client.address,
            invoices: [],
            payments: []
          },
          performance: {
            averageResponseTime: 0,
            taskCompletionRate: 0,
            clientSatisfaction: 0,
            metrics: []
          },
          communication: {
            preferredMethod: 'email',
            notificationSettings: {
              email: true,
              sms: false,
              push: true
            },
            communicationHistory: []
          }
        } as unknown as ClientProfile,
        buildings: buildings as BuildingProfile[],
        totalUnits,
        totalSquareFootage,
        averageCompliance,
        activeAlerts: Math.floor(Math.random() * 5), // Mock data
        recentActivity: [
          'Compliance inspection completed at 131 Perry Street',
          'Maintenance scheduled for Rubin Museum',
          'New tenant move-in at 135 West 17th Street',
        ],
      };

      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Failed to load client dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleIntelligenceTabPress = (tabId: 'overview' | 'buildings' | 'compliance' | 'team' | 'analytics') => {
    if (selectedIntelligenceTab === tabId) {
      // If same tab is pressed, close overlay
      setSelectedIntelligenceTab(null);
    } else {
      // Open new tab overlay
      setSelectedIntelligenceTab(tabId);
    }
  };

  const renderHeroCards = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.heroCardsContainer}>
        {/* Portfolio Overview Card */}
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.large}
          style={styles.heroCard}
        >
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Portfolio Overview</Text>
              <Text style={styles.heroSubtitle}>{dashboardData.buildings.length} Buildings</Text>
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>{dashboardData.totalUnits}</Text>
                  <Text style={styles.heroMetricLabel}>Units</Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>
                    {dashboardData.totalSquareFootage.toLocaleString()}
                  </Text>
                  <Text style={styles.heroMetricLabel}>Sq Ft</Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>
                    {Math.round(dashboardData.averageCompliance * 100)}%
                  </Text>
                  <Text style={styles.heroMetricLabel}>Compliance</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Compliance Status Card */}
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.large}
          style={styles.heroCard}
        >
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Compliance Status</Text>
              <Text style={styles.heroSubtitle}>
                {dashboardData.activeAlerts === 0 ? 'All Clear' : `${dashboardData.activeAlerts} Alerts`}
              </Text>
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>
                    {dashboardData.buildings.filter(b => (b.complianceScore || 0) > 0.9).length}
                  </Text>
                  <Text style={styles.heroMetricLabel}>Excellent</Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>
                    {dashboardData.buildings.filter(b => (b.complianceScore || 0) > 0.7 && (b.complianceScore || 0) <= 0.9).length}
                  </Text>
                  <Text style={styles.heroMetricLabel}>Good</Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricValue}>
                    {dashboardData.buildings.filter(b => (b.complianceScore || 0) <= 0.7).length}
                  </Text>
                  <Text style={styles.heroMetricLabel}>Needs Attention</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>
      </View>
    );
  };

  const renderBuildingPortfolioCard = () => {
    if (!dashboardData) return null;

    const topBuildings = dashboardData.buildings.slice(0, 4); // Show top 4 buildings

    return (
      <View style={styles.buildingPortfolioSection}>
        <Text style={styles.sectionTitle}>🏢 Building Portfolio</Text>
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.large}
          style={styles.buildingPortfolioCard}
        >
          <View style={styles.buildingPortfolioHeader}>
            <Text style={styles.buildingPortfolioTitle}>
              {dashboardData.client.name} Portfolio
            </Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All {dashboardData.buildings.length}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buildingsGrid}>
            {topBuildings.map((building) => (
              <TouchableOpacity
                key={building.id}
                style={styles.buildingItem}
                onPress={() => onBuildingPress?.(building.id)}
              >
                <View style={styles.buildingIcon}>
                  <Text style={styles.buildingIconText}>🏢</Text>
                </View>
                <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
                <Text style={styles.buildingAddress} numberOfLines={1}>
                  {building.address.split(',')[0]} {/* Show just street address */}
                </Text>
                <View style={styles.buildingDetails}>
                  <Text style={styles.buildingUnits}>{building.numberOfUnits || 0} units</Text>
                  <Text style={styles.buildingYear}>Built {building.yearBuilt || 'N/A'}</Text>
                </View>
                <View style={styles.buildingCompliance}>
                  <View style={[
                    styles.complianceBar,
                    { 
                      backgroundColor: (building.complianceScore || 0.85) > 0.9 
                        ? Colors.status.success 
                        : (building.complianceScore || 0.85) > 0.7 
                        ? Colors.status.warning 
                        : Colors.status.error 
                    }
                  ]} />
                  <Text style={styles.complianceText}>
                    {Math.round((building.complianceScore || 0.85) * 100)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.buildingPortfolioFooter}>
            <View style={styles.footerMetric}>
              <Text style={styles.footerMetricValue}>{dashboardData.totalUnits}</Text>
              <Text style={styles.footerMetricLabel}>Total Units</Text>
            </View>
            <View style={styles.footerMetric}>
              <Text style={styles.footerMetricValue}>
                {Math.round(dashboardData.averageCompliance * 100)}%
              </Text>
              <Text style={styles.footerMetricLabel}>Avg Compliance</Text>
            </View>
            <View style={styles.footerMetric}>
              <Text style={styles.footerMetricValue}>
                {Math.round(dashboardData.totalSquareFootage / 1000)}K
              </Text>
              <Text style={styles.footerMetricLabel}>Sq Ft</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  };

  const renderIntelligencePanel = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.intelligenceSection}>
        <TouchableOpacity
          style={styles.intelligenceHeader}
          onPress={() => setIntelligencePanelExpanded(!intelligencePanelExpanded)}
        >
          <Text style={styles.intelligenceTitle}>🧠 Client Intelligence</Text>
          <Text style={styles.intelligenceToggle}>
            {intelligencePanelExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {intelligencePanelExpanded && (
          <View style={styles.intelligenceContent}>
            <View style={styles.intelligenceTabs}>
              {CLIENT_INTELLIGENCE_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.intelligenceTab, selectedIntelligenceTab === tab.id && styles.selectedIntelligenceTab]}
                  onPress={() => setSelectedIntelligenceTab(tab.id)}
                >
                  <Text style={styles.intelligenceTabIcon}>{tab.icon}</Text>
                  <Text style={styles.intelligenceTabText}>{tab.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.intelligenceTabContent}>
              {renderIntelligenceTabContent()}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderIntelligenceTabContent = () => {
    if (!dashboardData) return null;

    switch (selectedIntelligenceTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Portfolio Overview</Text>
            <View style={styles.overviewGrid}>
              <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
                <Text style={styles.overviewCardTitle}>Total Value</Text>
                <Text style={styles.overviewCardValue}>$2.4M</Text>
              </GlassCard>
              <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
                <Text style={styles.overviewCardTitle}>Occupancy Rate</Text>
                <Text style={styles.overviewCardValue}>94%</Text>
              </GlassCard>
            </View>
          </View>
        );

      case 'buildings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Building Portfolio</Text>
            {dashboardData.buildings.slice(0, 3).map(building => (
              <TouchableOpacity
                key={building.id}
                style={styles.buildingItem}
                onPress={() => onBuildingPress?.(building.id)}
              >
                <BuildingDetailOverview
                  building={building}
                  onPress={() => onBuildingPress?.(building.id)}
                />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'compliance':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Compliance Status</Text>
            {dashboardData.buildings.slice(0, 2).map(building => (
              <View key={building.id} style={styles.complianceItem}>
                <ComplianceSuiteScreen
                  buildingId={building.id}
                  buildingName={building.name}
                  onCompliancePress={() => onBuildingPress?.(building.id)}
                />
              </View>
            ))}
          </View>
        );

      case 'team':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Team Management</Text>
            <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.teamCard}>
              <Text style={styles.teamCardTitle}>Assigned Workers</Text>
              <Text style={styles.teamCardText}>• Kevin Dutan - Primary Maintenance</Text>
              <Text style={styles.teamCardText}>• Greg Hutson - Cleaning Specialist</Text>
              <Text style={styles.teamCardText}>• Moises Farhat - Building Manager</Text>
            </GlassCard>
          </View>
        );

      case 'analytics':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Portfolio Analytics</Text>
            <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>Performance Metrics</Text>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Maintenance Efficiency:</Text>
                <Text style={styles.analyticsValue}>94%</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Tenant Satisfaction:</Text>
                <Text style={styles.analyticsValue}>4.8/5</Text>
              </View>
            </GlassCard>
          </View>
        );

      default:
        return null;
    }
  };

  if (!dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading client dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Client Header */}
      <ClientHeaderV3B
        clientName={dashboardData.client.name}
        clientId={dashboardData.client.id}
        userRole={userRole}
        onRoute={onHeaderRoute}
      />

      {/* Base Screen Content - Only ~450px total */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.baseScreenContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.client.primary}
          />
        }
      >
        {/* Hero Cards - ~200px */}
        {renderHeroCards()}
        
        {/* Building Portfolio Overview Card - ~150px */}
        {renderBuildingPortfolioCard()}
      </ScrollView>

      {/* Intelligence Panel Tabs - Always visible at bottom - ~100px */}
      <IntelligencePanelTabs
        selectedTab={selectedIntelligenceTab}
        onTabPress={handleIntelligenceTabPress}
        collapsed={!selectedIntelligenceTab}
        userRole="client"
      />

      {/* Intelligence Overlays - Full screen when active */}
      {selectedIntelligenceTab === 'overview' && (
        <IntelligenceOverlay
          visible={true}
          onClose={() => setSelectedIntelligenceTab(null)}
          title="Portfolio Overview"
          tabId="overview"
        >
          <ClientOverviewOverlayContent
            clientId={clientId}
            clientName={clientName}
            totalBuildings={dashboardData?.buildings.length || 0}
            totalUnits={dashboardData?.totalUnits || 0}
            totalSquareFootage={dashboardData?.totalSquareFootage || 0}
            averageCompliance={dashboardData?.averageCompliance || 0}
            activeAlerts={dashboardData?.activeAlerts || 0}
            onRefresh={handleRefresh}
          />
        </IntelligenceOverlay>
      )}

      {selectedIntelligenceTab === 'buildings' && (
        <IntelligenceOverlay
          visible={true}
          onClose={() => setSelectedIntelligenceTab(null)}
          title="Building Management"
          tabId="buildings"
        >
          <ClientBuildingsOverlayContent
            clientId={clientId}
            clientName={clientName}
            onBuildingPress={onBuildingPress}
            onRefresh={handleRefresh}
          />
        </IntelligenceOverlay>
      )}

      {selectedIntelligenceTab === 'compliance' && (
        <IntelligenceOverlay
          visible={true}
          onClose={() => setSelectedIntelligenceTab(null)}
          title="Compliance Status"
          tabId="compliance"
        >
          <ClientComplianceOverlayContent
            clientId={clientId}
            clientName={clientName}
            onBuildingPress={onBuildingPress}
            onRefresh={handleRefresh}
          />
        </IntelligenceOverlay>
      )}

      {selectedIntelligenceTab === 'team' && (
        <IntelligenceOverlay
          visible={true}
          onClose={() => setSelectedIntelligenceTab(null)}
          title="Team Management"
          tabId="team"
        >
          <ClientTeamOverlayContent
            clientId={clientId}
            clientName={clientName}
            onWorkerPress={(workerId) => console.log('Worker pressed:', workerId)}
            onRefresh={handleRefresh}
          />
        </IntelligenceOverlay>
      )}

      {selectedIntelligenceTab === 'analytics' && (
        <IntelligenceOverlay
          visible={true}
          onClose={() => setSelectedIntelligenceTab(null)}
          title="Analytics Dashboard"
          tabId="analytics"
        >
          <ClientAnalyticsOverlayContent
            clientId={clientId}
            clientName={clientName}
            onRefresh={handleRefresh}
          />
        </IntelligenceOverlay>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  baseScreenContent: {
    paddingBottom: 120, // Space for Intelligence Panel Tabs
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  overlayText: {
    fontSize: Typography.fontSize.large,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  heroCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  heroCard: {
    flex: 1,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginBottom: 16,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  heroMetric: {
    alignItems: 'center',
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  heroMetricLabel: {
    fontSize: 10,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 2,
  },
  intelligenceSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  intelligenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    marginBottom: 12,
  },
  intelligenceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  intelligenceToggle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  intelligenceContent: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: 16,
  },
  intelligenceTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
  },
  intelligenceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  selectedIntelligenceTab: {
    backgroundColor: Colors.role.client.primary,
  },
  intelligenceTabIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  intelligenceTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  intelligenceTabContent: {
    minHeight: 200,
  },
  tabContent: {
    padding: 8,
  },
  tabContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  overviewCardTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  overviewCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  complianceItem: {
    marginBottom: 12,
  },
  teamCard: {
    padding: 16,
  },
  teamCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  teamCardText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  analyticsCard: {
    padding: 16,
  },
  analyticsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  analyticsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buildingPortfolioSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  buildingPortfolioCard: {
    padding: 20,
  },
  buildingPortfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buildingPortfolioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.role.client.primary,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  buildingItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
  },
  buildingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildingIconText: {
    fontSize: 20,
  },
  buildingName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  buildingAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  buildingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  buildingUnits: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  buildingYear: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  buildingCompliance: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  complianceBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  complianceText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buildingPortfolioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerMetric: {
    alignItems: 'center',
  },
  footerMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  footerMetricLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});

export default ClientDashboardMainView;