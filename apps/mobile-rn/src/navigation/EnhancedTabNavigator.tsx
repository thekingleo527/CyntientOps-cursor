/**
 * @cyntientops/mobile-rn
 *
 * Enhanced Tab Navigator - Role-based tab structure
 * Worker: Home, Schedule, SiteDeparture, Map, Intelligence (5 tabs)
 * Client: Home, Portfolio, Intelligence (3 tabs)
 * Admin: Home, Portfolio, Workers, Intelligence (4 tabs)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@cyntientops/ui-components/src/mocks/expo-vector-icons';
import { Colors } from '@cyntientops/design-tokens';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';
import { useServices } from '../providers/AppProvider';
import type { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import type { RootStackParamList } from './AppNavigator';

import { WorkerDashboardMainView } from '@cyntientops/ui-components/src/dashboards/WorkerDashboardMainView';
import { ClientDashboardMainView } from '@cyntientops/ui-components/src/dashboards/ClientDashboardMainView';
import { AdminDashboardMainView } from '@cyntientops/ui-components/src/dashboards/AdminDashboardMainView';
import { WorkerScheduleTab } from './tabs/WorkerScheduleTab';
import { WorkerSiteDepartureTab } from './tabs/WorkerSiteDepartureTab';
import { WorkerMapTab } from './tabs/WorkerMapTab';
import { WorkerIntelligenceTab } from './tabs/WorkerIntelligenceTab';
import { ClientPortfolioTab } from './tabs/ClientPortfolioTab';
import { ClientIntelligenceTab } from './tabs/ClientIntelligenceTab';
import { AdminPortfolioTab } from './tabs/AdminPortfolioTab';
import { AdminWorkersTab } from './tabs/AdminWorkersTab';
import { AdminIntelligenceTab } from './tabs/AdminIntelligenceTab';
import { EmergencyQuickAccess } from '../components/EmergencyQuickAccess';
import { WeatherAlertBanner } from '../components/WeatherAlertBanner';

const Tab = createBottomTabNavigator();

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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const services = useServices();

  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  React.useEffect(() => {
    setWeatherAlerts([
      'Rain expected in 2 hours - consider rescheduling outdoor tasks',
      'High winds warning - secure loose materials',
    ]);
  }, []);

  const handleTaskNavigation = useCallback(
    (task?: OperationalDataTaskAssignment) => {
      if (!task?.id) {
        Alert.alert('Task Unavailable', 'This task is missing an identifier.');
        return;
      }
      navigation.navigate('TaskTimeline', { taskId: task.id });
    },
    [navigation],
  );

  const handleBuildingNavigation = useCallback(
    (buildingId?: string) => {
      if (!buildingId) {
        Alert.alert('Building Unavailable', 'No building selected.');
        return;
      }
      navigation.navigate('BuildingDetail', { buildingId });
    },
    [navigation],
  );

  const handleClockIn = useCallback(
    async (buildingId?: string) => {
      if (!buildingId) {
        Alert.alert('Clock In Failed', 'Select a building before clocking in.');
        return;
      }

      const building = RealDataService.getBuildingById(buildingId);
      if (!building) {
        Alert.alert('Clock In Failed', 'Unable to find building details.');
        return;
      }

      const result = await services.clockIn.clockInWorker({
        workerId: userId,
        buildingId,
        latitude: building.latitude ?? 0,
        longitude: building.longitude ?? 0,
        timestamp: new Date(),
      });

      if (result.success) {
        Alert.alert('Clocked In', `You are now clocked in at ${building.name}.`);
      } else {
        const validation = result.validation;
        const message = validation.errors.join('\n') || 'Clock in validation failed.';
        Alert.alert('Clock In Failed', message);
      }
    },
    [services.clockIn, userId],
  );

  const handleClockOut = useCallback(
    async () => {
      const result = await services.clockIn.clockOutWorker({
        workerId: userId,
        timestamp: new Date(),
      });

      if (result.success) {
        Alert.alert('Clocked Out', 'You are now clocked out.');
      } else {
        Alert.alert('Clock Out Failed', 'No active clock-in session was found.');
      }
    },
    [services.clockIn, userId],
  );

  const handleHeaderRoute = useCallback(
    (route: unknown) => {
      const target = typeof route === 'string' ? route : String(route ?? '');
      switch (target) {
        case 'profile':
          navigation.navigate('DailyRoutine');
          break;
        case 'novaChat':
          Alert.alert('Nova AI', 'Launching Nova intelligence assistant…');
          break;
        case 'clockAction':
          handleClockOut();
          break;
        default:
          navigation.navigate('MultisiteDeparture');
          break;
      }
    },
    [handleClockOut, navigation],
  );

  const handleWeatherAlert = useCallback(
    (alertMessage: string) => {
      Alert.alert('Weather Alert', alertMessage, [
        { text: 'Dismiss', style: 'cancel' },
        {
          text: 'Emergency Tools',
          onPress: () => setShowEmergencyAccess(true),
        },
      ]);
    },
    [],
  );

  const handleWorkerSelect = useCallback((workerId: string) => {
    const worker = RealDataService.getWorkerById(workerId);
    Alert.alert('Worker Selected', worker ? worker.name : workerId);
  }, []);

  const tabScreens = useMemo(() => {
    switch (userRole) {
      case 'worker':
        return (
          <>
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
                  onTaskPress={handleTaskNavigation}
                  onBuildingPress={handleBuildingNavigation}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  onHeaderRoute={handleHeaderRoute}
                />
              )}
            </Tab.Screen>

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
                  onBuildingPress={handleBuildingNavigation}
                  onHeaderRoute={handleHeaderRoute}
                />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="ClientPortfolio"
              options={{
                title: 'Portfolio',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="map-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <ClientPortfolioTab
                  clientId={userId}
                  clientName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>

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
                  onWorkerPress={handleWorkerSelect}
                  onBuildingPress={handleBuildingNavigation}
                  onHeaderRoute={handleHeaderRoute}
                />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="AdminPortfolio"
              options={{
                title: 'Portfolio',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="map-outline" color={color} size={size} />
                ),
              }}
            >
              {() => (
                <AdminPortfolioTab
                  adminId={userId}
                  adminName={userName}
                  userRole={userRole}
                />
              )}
            </Tab.Screen>

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
  }, [
    handleBuildingNavigation,
    handleClockIn,
    handleClockOut,
    handleHeaderRoute,
    handleTaskNavigation,
    handleWorkerSelect,
    userId,
    userName,
    userRole,
  ]);

  return (
    <View style={styles.container}>
      {weatherAlerts.length > 0 && (
        <WeatherAlertBanner
          alerts={weatherAlerts}
          onAlertPress={handleWeatherAlert}
          autoDismiss
          dismissDelay={5000}
        />
      )}

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
        {tabScreens}
      </Tab.Navigator>

      {showEmergencyAccess && (
        <EmergencyQuickAccess
          onClose={() => setShowEmergencyAccess(false)}
          userId={userId}
        />
      )}
    </View>
  );
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'worker':
      return Colors.role.worker.primary;
    case 'client':
      return Colors.role.client.primary;
    case 'admin':
      return Colors.role.admin.primary;
    default:
      return Colors.primaryAction;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default EnhancedTabNavigator;
