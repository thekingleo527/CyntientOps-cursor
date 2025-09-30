/**
 * @cyntientops/mobile-rn
 * 
 * Enhanced Tab Navigator - Role-based tab structure
 * Worker: Home, Schedule, SiteDeparture, Map, Intelligence (5 tabs)
 * Client: Home, Intelligence (2 tabs)  
 * Admin: Home, Workers, Intelligence (3 tabs)
 * 
 * Note: Portfolio and Map functionality are within Intelligence panels
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@cyntientops/ui-components/src/mocks/expo-vector-icons';
import { Colors } from '@cyntientops/design-tokens';

// Import main dashboard screens
import { WorkerDashboardMainView } from '@cyntientops/ui-components/src/dashboards/WorkerDashboardMainView';
import { ClientDashboardMainView } from '@cyntientops/ui-components/src/dashboards/ClientDashboardMainView';
import { AdminDashboardMainView } from '@cyntientops/ui-components/src/dashboards/AdminDashboardMainView';

// Import tab screens
import { WorkerScheduleTab } from './tabs/WorkerScheduleTab';
import { WorkerSiteDepartureTab } from './tabs/WorkerSiteDepartureTab';
import { WorkerMapTab } from './tabs/WorkerMapTab';
import { WorkerIntelligenceTab } from './tabs/WorkerIntelligenceTab';
import { ClientIntelligenceTab } from './tabs/ClientIntelligenceTab';
import { AdminWorkersTab } from './tabs/AdminWorkersTab';
import { AdminIntelligenceTab } from './tabs/AdminIntelligenceTab';

// Import global components
import { EmergencyQuickAccess } from '../components/EmergencyQuickAccess';
import { WeatherAlertBanner } from '../components/WeatherAlertBanner';

const Tab = createBottomTabNavigator();

// Types
export interface TabNavigatorProps {
  userRole: 'worker' | 'client' | 'admin';
  userId: string;
  userName: string;
}

export const EnhancedTabNavigator: React.FC<TabNavigatorProps> = ({
  userRole,
  userId,
  userName,
}) => {
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  // Mock weather alerts for demonstration
  React.useEffect(() => {
    setWeatherAlerts([
      'Rain expected in 2 hours - consider rescheduling outdoor tasks',
      'High winds warning - secure loose materials',
    ]);
  }, []);

  const handleEmergencyActivation = () => {
    setShowEmergencyAccess(true);
  };

  const handleEmergencyClose = () => {
    setShowEmergencyAccess(false);
  };

  const getTabScreens = () => {
    switch (userRole) {
      case 'worker':
        return (
          <>
            {/* Worker Tab 1: Home (default) */}
            <Tab.Screen
              name="WorkerHome"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <WorkerDashboardMainView
                  workerId={userId}
                  workerName={userName}
                  userRole={userRole}
                  onTaskPress={(task) => console.log('Task pressed:', task)}
                  onBuildingPress={(buildingId) => console.log('Building pressed:', buildingId)}
                  onClockIn={(buildingId) => console.log('Clock in:', buildingId)}
                  onClockOut={() => console.log('Clock out')}
                  onHeaderRoute={(route) => console.log('Header route:', route)}
                />
              )}
            </Tab.Screen>
            
            {/* Worker Tab 2: Schedule */}
            <Tab.Screen
              name="WorkerSchedule"
              options={{
                title: 'Schedule',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="calendar-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <WorkerScheduleTab
                  workerId={userId}
                  userName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
            
            {/* Worker Tab 3: Site Departure */}
            <Tab.Screen
              name="WorkerSiteDeparture"
              options={{
                title: 'Departure',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="exit-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <WorkerSiteDepartureTab
                  workerId={userId}
                  userName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
            
            {/* Worker Tab 4: Map */}
            <Tab.Screen
              name="WorkerMap"
              options={{
                title: 'Map',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="map-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <WorkerMapTab
                  userId={userId}
                  userName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
            
            {/* Worker Tab 5: Intelligence */}
            <Tab.Screen
              name="WorkerIntelligence"
              options={{
                title: 'Intelligence',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="bulb-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <WorkerIntelligenceTab
                  userId={userId}
                  userName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
          </>
        );

      case 'client':
        return (
          <>
            {/* Client Tab 1: Home (default) */}
            <Tab.Screen
              name="ClientHome"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="business-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <ClientDashboardMainView
                  clientId={userId}
                  clientName={userName}
                  userRole={userRole}
                  onBuildingPress={(buildingId) => console.log('Building pressed:', buildingId)}
                  onHeaderRoute={(route) => console.log('Header route:', route)}
                />
              )}
            </Tab.Screen>
            
            {/* Client Tab 2: Intelligence */}
            <Tab.Screen
              name="ClientIntelligence"
              options={{
                title: 'Intelligence',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="bulb-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <ClientIntelligenceTab
                  clientId={userId}
                  clientName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
          </>
        );

      case 'admin':
        return (
          <>
            {/* Admin Tab 1: Home (default) */}
            <Tab.Screen
              name="AdminHome"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="settings-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <AdminDashboardMainView
                  adminId={userId}
                  adminName={userName}
                  userRole={userRole}
                  onWorkerPress={(workerId) => console.log('Worker pressed:', workerId)}
                  onBuildingPress={(buildingId) => console.log('Building pressed:', buildingId)}
                  onHeaderRoute={(route) => console.log('Header route:', route)}
                />
              )}
            </Tab.Screen>
            
            {/* Admin Tab 2: Workers */}
            <Tab.Screen
              name="AdminWorkers"
              options={{
                title: 'Workers',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="people-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <AdminWorkersTab
                  adminId={userId}
                  adminName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
            
            {/* Admin Tab 3: Intelligence */}
            <Tab.Screen
              name="AdminIntelligence"
              options={{
                title: 'Intelligence',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="bulb-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <AdminIntelligenceTab
                  adminId={userId}
                  adminName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Weather Alert Banner */}
      {weatherAlerts.length > 0 && (
        <WeatherAlertBanner
          alerts={weatherAlerts}
          onAlertPress={(alert) => console.log('Alert pressed:', alert)}
          autoDismiss={true}
          dismissDelay={5000}
        />
      )}

      {/* Main Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.background,
            borderTopWidth: 1,
            borderTopColor: Colors.border.light,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: getRoleColor(userRole),
          tabBarInactiveTintColor: Colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        {getTabScreens()}
      </Tab.Navigator>

      {/* Emergency Quick Access Modal */}
      {showEmergencyAccess && (
        <EmergencyQuickAccess
          onClose={handleEmergencyClose}
          userId={userId}
        />
      )}
    </View>
  );
};

// Helper function to get role-specific colors
const getRoleColor = (role: string) => {
  switch (role) {
    case 'worker': return Colors.role.worker.primary;
    case 'client': return Colors.role.client.primary;
    case 'admin': return Colors.role.admin.primary;
    default: return Colors.primaryAction;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default EnhancedTabNavigator;