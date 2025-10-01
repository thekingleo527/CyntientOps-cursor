/**
 * 🧭 Unified Navigation System
 * Complete navigation solution for CyntientOps Mobile App
 * Purpose: Single source of truth for all navigation logic
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import main dashboard screens
import { WorkerDashboardMainView } from '@cyntientops/ui-components/src/dashboards/WorkerDashboardMainView';
import { ClientDashboardMainView } from '@cyntientops/ui-components/src/dashboards/ClientDashboardMainView';
import { AdminDashboardMainView } from '@cyntientops/ui-components/src/dashboards/AdminDashboardMainView';

// Import screen components
import { LoginScreen } from '../screens/LoginScreen';
import { BuildingDetailScreen } from '../screens/BuildingDetailScreen';
import { TaskTimelineScreen } from '../screens/TaskTimelineScreen';
import { MultisiteDepartureScreen } from '../screens/MultisiteDepartureScreen';
import { WeeklyRoutineScreen } from '../screens/WeeklyRoutineScreen';
import { DailyRoutineScreen } from '../screens/DailyRoutineScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';

// Import tab screens
import { WorkerScheduleTab } from './tabs/WorkerScheduleTab';
import { WorkerSiteDepartureTab } from './tabs/WorkerSiteDepartureTab';
import { WorkerMapTab } from './tabs/WorkerMapTab';
import { WorkerIntelligenceTab } from './tabs/WorkerIntelligenceTab';
import { ClientPortfolioTab } from './tabs/ClientPortfolioTab';
import { ClientIntelligenceTab } from './tabs/ClientIntelligenceTab';
import { AdminPortfolioTab } from './tabs/AdminPortfolioTab';
import { AdminWorkersTab } from './tabs/AdminWorkersTab';
import { AdminIntelligenceTab } from './tabs/AdminIntelligenceTab';

// Import global components
import { EmergencyQuickAccess } from '../components/EmergencyQuickAccess';
import { WeatherAlertBanner } from '../components/WeatherAlertBanner';
import { UnifiedNovaAI } from '@cyntientops/ui-components/src/nova/UnifiedNovaAISystem';

// Import services
import { ServiceContainer } from '@cyntientops/business-core';
import { AuthService } from '@cyntientops/business-core';

// Types
import { WorkerProfile, UserRole } from '@cyntientops/domain-schema';

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: UserRole; userId: string; userName: string };
  BuildingDetail: { buildingId: string };
  TaskTimeline: { taskId: string };
  ClockInModal: { buildingId: string };
  PhotoCaptureModal: { taskId: string };
  MultisiteDeparture: undefined;
  WeeklyRoutine: undefined;
  DailyRoutine: undefined;
  Profile: undefined;
  Settings: undefined;
  Emergency: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Schedule?: undefined;
  Departure?: undefined;
  Map?: undefined;
  Intelligence?: undefined;
  Portfolio?: undefined;
  Workers?: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

// Tab Navigator Component
const MainTabNavigator: React.FC<{
  userRole: UserRole;
  userId: string;
  userName: string;
}> = ({ userRole, userId, userName }) => {
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  // Mock weather alerts for demonstration
  useEffect(() => {
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
              name="Home"
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
              name="Schedule"
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
              name="Departure"
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
              name="Map"
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
              name="Intelligence"
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
              name="Home"
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

            {/* Client Tab 2: Portfolio */}
            <Tab.Screen
              name="Portfolio"
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

            {/* Client Tab 3: Intelligence */}
            <Tab.Screen
              name="Intelligence"
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
              name="Home"
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

            {/* Admin Tab 2: Portfolio */}
            <Tab.Screen
              name="Portfolio"
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

            {/* Admin Tab 3: Workers */}
            <Tab.Screen
              name="Workers"
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

            {/* Admin Tab 4: Intelligence */}
            <Tab.Screen
              name="Intelligence"
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
            backgroundColor: '#0a0a0a',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: getRoleColor(userRole),
          tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
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

      {/* Unified Nova AI System */}
      <UnifiedNovaAI
        userId={userId}
        userRole={userRole}
        onInsightGenerated={(insight) => console.log('Nova insight:', insight)}
        onActionTriggered={(action) => console.log('Nova action:', action)}
        config={{
          enableVoice: true,
          enableHolographic: true,
          enableParticles: true,
          enableHaptic: true,
          enableSupabase: true
        }}
      />
    </View>
  );
};

// Helper function to get role-specific colors
const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'worker': return '#10b981';
    case 'client': return '#3b82f6';
    case 'admin': return '#f59e0b';
    default: return '#6366f1';
  }
};

// Main Navigation Component
export const UnifiedNavigationSystem: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<WorkerProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const serviceContainer = ServiceContainer.getInstance();
        await serviceContainer.initialize();
        setIsInitialized(true);
        console.log('✅ Services initialized');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        Alert.alert('Initialization Error', 'Failed to initialize app services');
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []);

  // Check authentication status
  useEffect(() => {
    if (!isInitialized) return;

    const checkAuthStatus = async () => {
      try {
        const authService = ServiceContainer.getInstance().authService;
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.log('No authenticated user found');
      }
    };

    checkAuthStatus();
  }, [isInitialized]);

  const handleLoginSuccess = async (authenticatedUser: any) => {
    try {
      // Convert AuthenticatedUser to WorkerProfile format
      const workerProfile: WorkerProfile = {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        phone: authenticatedUser.profile?.phone || '',
        status: 'Available',
        capabilities: authenticatedUser.profile?.capabilities || {}
      };
      
      setUser(workerProfile);
    } catch (error) {
      console.error('Login success handler error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const authService = ServiceContainer.getInstance().authService;
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {!user ? (
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
            >
              {() => (
                <MainTabNavigator
                  userRole={user.role}
                  userId={user.id}
                  userName={user.name}
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen 
              name="BuildingDetail" 
              component={BuildingDetailScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="TaskTimeline" 
              component={TaskTimelineScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="MultisiteDeparture" 
              component={MultisiteDepartureScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="WeeklyRoutine" 
              component={WeeklyRoutineScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="DailyRoutine" 
              component={DailyRoutineScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            
            <Stack.Screen 
              name="Emergency" 
              component={EmergencyScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#dc2626' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
});

export default UnifiedNavigationSystem;

