/**
 * @cyntientops/ui-components
 * 
 * Intelligence Panel Tabs - Collapsed state tab bar
 * Shows horizontal tabs for Intelligence panel navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

const { width } = Dimensions.get('window');

export interface IntelligenceTab {
  id: string;
  title: string;
  icon: string;
  color: string;
}

// Default Worker tabs
const WORKER_TABS: IntelligenceTab[] = [
  { id: 'routines', title: 'Routines', icon: '🔄', color: Colors.role.worker.primary },
  { id: 'portfolio', title: 'Portfolio', icon: '🗺️', color: Colors.status.info },
  { id: 'insights', title: 'Insights', icon: '💡', color: Colors.status.info },
  { id: 'alerts', title: 'Alerts', icon: '⚠️', color: Colors.status.warning },
  { id: 'quickactions', title: 'Actions', icon: '⚡', color: Colors.role.worker.accent },
];

// Client tabs
const CLIENT_TABS: IntelligenceTab[] = [
  { id: 'overview', title: 'Overview', icon: '📊', color: Colors.role.client.primary },
  { id: 'buildings', title: 'Buildings', icon: '🏢', color: Colors.status.info },
  { id: 'compliance', title: 'Compliance', icon: '✅', color: Colors.status.success },
  { id: 'team', title: 'Team', icon: '👥', color: Colors.status.warning },
  { id: 'analytics', title: 'Analytics', icon: '📈', color: Colors.role.client.accent },
];

// Admin tabs
const ADMIN_TABS: IntelligenceTab[] = [
  { id: 'overview', title: 'Overview', icon: '📊', color: Colors.role.admin.primary },
  { id: 'workers', title: 'Workers', icon: '👥', color: Colors.status.info },
  { id: 'buildings', title: 'Buildings', icon: '🏢', color: Colors.status.success },
  { id: 'analytics', title: 'Analytics', icon: '📈', color: Colors.status.warning },
  { id: 'system', title: 'System', icon: '⚙️', color: Colors.role.admin.accent },
];

export interface IntelligencePanelTabsProps {
  selectedTab: string | null;
  onTabPress: (tabId: string) => void;
  collapsed?: boolean;
  userRole?: 'worker' | 'client' | 'admin';
}

export const IntelligencePanelTabs: React.FC<IntelligencePanelTabsProps> = ({
  selectedTab,
  onTabPress,
  collapsed = true,
  userRole = 'worker',
}) => {
  const getTabsForRole = (role: string): IntelligenceTab[] => {
    switch (role) {
      case 'client':
        return CLIENT_TABS;
      case 'admin':
        return ADMIN_TABS;
      default:
        return WORKER_TABS;
    }
  };

  const tabs = getTabsForRole(userRole);
  const renderTab = (tab: IntelligenceTab) => {
    const isActive = selectedTab === tab.id;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabButton,
          isActive && styles.activeTabButton,
          { backgroundColor: isActive ? tab.color + '20' : 'transparent' }
        ]}
        onPress={() => onTabPress(tab.id)}
      >
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        {!collapsed && (
          <Text style={[
            styles.tabText,
            isActive && styles.activeTabText,
            { color: isActive ? tab.color : Colors.text.secondary }
          ]}>
            {tab.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <GlassCard
        intensity={GlassIntensity.regular}
        cornerRadius={CornerRadius.large}
        style={styles.tabContainer}
      >
        <View style={styles.tabsRow}>
          {tabs.map(renderTab)}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tabContainer: {
    padding: Spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTabButton: {
    // Active styling handled by backgroundColor in renderTab
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '700',
  },
});

export default IntelligencePanelTabs;
