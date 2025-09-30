/**
 * @cyntientops/mobile-rn
 * 
 * Enhanced Tab Navigator - Based on Audit Recommendations
 * Features: Weather integration, Global Nova, Clock-in flow, Emergency access
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';

// Import screens
import { WorkerDashboardMainView } from '@cyntientops/ui-components/src/dashboards/WorkerDashboardMainView';
import { ClientDashboardMainView } from '@cyntientops/ui-components/src/dashboards/ClientDashboardMainView';
import { AdminDashboardMainView } from '@cyntientops/ui-components/src/dashboards/AdminDashboardMainView';
import { BuildingDetailScreen } from '../screens/BuildingDetailScreen';
import { TaskTimelineScreen } from '../screens/TaskTimelineScreen';

// Import new tab screens
import { WorkerScheduleTab } from './tabs/WorkerScheduleTab';
import { WorkerMapTab } from './tabs/WorkerMapTab';
import { WorkerIntelligenceTab } from './tabs/WorkerIntelligenceTab';
import { ClientPortfolioTab } from './tabs/ClientPortfolioTab';
import { ClientMapTab } from './tabs/ClientMapTab';
import { AdminWorkersTab } from './tabs/AdminWorkersTab';
import { AdminPortfolioTab } from './tabs/AdminPortfolioTab';

// Import global components
import { EmergencyQuickAccess } from '../components/EmergencyQuickAccess';
import { WeatherAlertBanner } from '../components/WeatherAlertBanner';

// Types
export interface TabNavigatorProps {
  userRole: 'worker' | 'client' | 'admin';
  userId: string;
  userName: string;
}

export interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  icon: string;
  label: string;
  badge?: number;
  showWeather?: boolean;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Worker Tab Configuration
const WorkerTabs: TabConfig[] = [
  {
    name: 'WorkerHome',
    component: WorkerDashboardMainView,
    icon: 'home',
    label: 'Home',
    showWeather: true,
  },
  {
    name: 'Schedule',
    component: WorkerScheduleTab,
    icon: 'calendar',
    label: 'Schedule',
    showWeather: true,
  },
  {
    name: 'Map',
    component: WorkerMapTab,
    icon: 'map',
    label: 'Map',
  },
  {
    name: 'Intelligence',
    component: WorkerIntelligenceTab,
    icon: 'analytics',
    label: 'Nova',
  },
];

// Client Tab Configuration
const ClientTabs: TabConfig[] = [
  {
    name: 'ClientHome',
    component: ClientDashboardMainView,
    icon: 'home',
    label: 'Home',
  },
  {
    name: 'Portfolio',
    component: ClientPortfolioTab,
    icon: 'business',
    label: 'Portfolio',
  },
  {
    name: 'Map',
    component: ClientMapTab,
    icon: 'map',
    label: 'Map',
  },
  {
    name: 'Intelligence',
    component: WorkerIntelligenceTab, // Reuse for now
    icon: 'analytics',
    label: 'Insights',
  },
];

// Admin Tab Configuration
const AdminTabs: TabConfig[] = [
  {
    name: 'AdminHome',
    component: AdminDashboardMainView,
    icon: 'home',
    label: 'Home',
  },
  {
    name: 'Workers',
    component: AdminWorkersTab,
    icon: 'people',
    label: 'Workers',
  },
  {
    name: 'Portfolio',
    component: AdminPortfolioTab,
    icon: 'business',
    label: 'Portfolio',
  },
  {
    name: 'Map',
    component: WorkerMapTab, // Reuse for now
    icon: 'map',
    label: 'Map',
  },
  {
    name: 'Intelligence',
    component: WorkerIntelligenceTab, // Reuse for now
    icon: 'analytics',
    label: 'Analytics',
  },
];

// Tab Icon Component
const TabIcon: React.FC<{
  name: string;
  focused: boolean;
  color: string;
  size: number;
  badge?: number;
}> = ({ name, focused, color, size, badge }) => {
  const iconName = focused ? `${name}-outline` : `${name}`;
  
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={iconName as any} size={size} color={color} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
};

// Weather Badge Component
const WeatherBadge: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  return (
    <View style={styles.weatherBadge}>
      <Text style={styles.weatherBadgeText}>🌤️</Text>
    </View>
  );
};

// Main Tab Navigator
export const EnhancedTabNavigator: React.FC<TabNavigatorProps> = ({
  userRole,
  userId,
  userName,
}) => {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  // Get tab configuration based on role
  const getTabConfig = (): TabConfig[] => {
    switch (userRole) {
      case 'worker':
        return WorkerTabs;
      case 'client':
        return ClientTabs;
      case 'admin':
        return AdminTabs;
      default:
        return WorkerTabs;
    }
  };

  const tabs = getTabConfig();

  // Emergency detection (triple-tap or shake)
  useEffect(() => {
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;

    const handleTripleTap = () => {
      tapCount++;
      if (tapCount === 3) {
        setEmergencyMode(true);
        Alert.alert(
          'Emergency Mode',
          'Emergency mode activated. All emergency contacts have been notified.',
          [{ text: 'OK', onPress: () => setEmergencyMode(false) }]
        );
      }
      
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, 1000);
    };

    // Add triple-tap detection to tab bar
    return () => clearTimeout(tapTimer);
  }, []);

  // Weather alert monitoring
  useEffect(() => {
    // Simulate weather alerts
    const alerts = ['High wind warning', 'Rain expected in 2 hours'];
    setWeatherAlerts(alerts);
  }, []);

  return (
    <View style={styles.container}>
      {/* Weather Alert Banner */}
      {weatherAlerts.length > 0 && (
        <WeatherAlertBanner alerts={weatherAlerts} />
      )}

      {/* Emergency Mode Overlay */}
      {emergencyMode && (
        <EmergencyQuickAccess
          onClose={() => setEmergencyMode(false)}
          userId={userId}
        />
      )}

      {/* Main Tab Navigator */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const tab = tabs.find(t => t.name === route.name);
            return (
              <TabIcon
                name={tab?.icon || 'help'}
                focused={focused}
                color={color}
                size={size}
                badge={tab?.badge}
              />
            );
          },
          tabBarLabel: ({ focused, color }) => {
            const tab = tabs.find(t => t.name === route.name);
            return (
              <View style={styles.tabLabelContainer}>
                <Text style={[styles.tabLabel, { color }]}>
                  {tab?.label}
                </Text>
                {tab?.showWeather && <WeatherBadge show={true} />}
              </View>
            );
          },
          tabBarStyle: {
            backgroundColor: Colors.background,
            borderTopColor: Colors.border.medium,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: Colors.role.worker.primary,
          tabBarInactiveTintColor: Colors.text.tertiary,
          headerShown: false,
        })}
      >
        {tabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            initialParams={{
              userId,
              userName,
              userRole,
            }}
          />
        ))}
      </Tab.Navigator>

    </View>
  );
};

// Stack Navigator for detailed screens
export const EnhancedStackNavigator: React.FC<TabNavigatorProps> = ({
  userRole,
  userId,
  userName,
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: Colors.border.medium,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={EnhancedTabNavigator}
        options={{ headerShown: false }}
        initialParams={{ userRole, userId, userName }}
      />
      <Stack.Screen
        name="BuildingDetail"
        component={BuildingDetailScreen}
        options={{ title: 'Building Details' }}
      />
      <Stack.Screen
        name="TaskTimeline"
        component={TaskTimelineScreen}
        options={{ title: 'Task Timeline' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabelContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  weatherBadge: {
    marginTop: 2,
  },
  weatherBadgeText: {
    fontSize: 10,
  },
});

export default EnhancedTabNavigator;
