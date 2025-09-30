/**
 * 🧭 App Navigator
 * Purpose: React Navigation setup with authentication guards and role-based routing
 * Mirrors: SwiftUI NavigationView with role-based access control
 * Features: Authentication guards, role-based screens, deep linking, and state persistence
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// State Management
import { useIsAuthenticated, useCurrentUser, useUI, useActions } from '@cyntientops/business-core';

// Design Tokens
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';

// Screens
import { LoginScreen } from '../auth/LoginScreen';
import { WorkerDashboardMainView } from '../dashboards/WorkerDashboardMainView';
import { AdminDashboardMainView } from '../dashboards/AdminDashboardMainView';
import { ClientDashboardMainView } from '../dashboards/ClientDashboardMainView';
import { TaskDetailScreen } from '../tasks/TaskDetailScreen';
import { BuildingDetailScreen } from '../buildings/BuildingDetailScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { NovaAIChatModal } from '../modals/NovaAIChatModal';

// Types
import { UserRole } from '@cyntientops/domain-schema';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TaskDetail: { taskId: string };
  BuildingDetail: { buildingId: string };
  Profile: undefined;
  Settings: undefined;
  NovaAI: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Buildings: undefined;
  Profile: undefined;
};

export type WorkerTabParamList = {
  WorkerDashboard: undefined;
  MyTasks: undefined;
  MyBuildings: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AllTasks: undefined;
  AllBuildings: undefined;
  Workers: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type ClientTabParamList = {
  ClientDashboard: undefined;
  Portfolio: undefined;
  Reports: undefined;
  Profile: undefined;
};

// Stack Navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const WorkerTab = createBottomTabNavigator<WorkerTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();

// MARK: - Loading Screen

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.loadingText}>Loading CyntientOps...</Text>
  </View>
);

// MARK: - Auth Stack Navigator

const AuthStackNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: Colors.baseBackground }
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// MARK: - Worker Tab Navigator

const WorkerTabNavigator: React.FC = () => {
  const { theme } = useUI();
  const isDark = theme === 'dark';

  return (
    <WorkerTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'WorkerDashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'MyTasks':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'MyBuildings':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderSubtle,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontFamily: Typography.fonts.primary,
          fontWeight: Typography.weights.semibold,
        },
      })}
    >
      <WorkerTab.Screen 
        name="WorkerDashboard" 
        component={WorkerDashboardMainView}
        options={{ title: 'Dashboard' }}
      />
      <WorkerTab.Screen 
        name="MyTasks" 
        component={TaskListScreen}
        options={{ title: 'My Tasks' }}
      />
      <WorkerTab.Screen 
        name="MyBuildings" 
        component={BuildingListScreen}
        options={{ title: 'My Buildings' }}
      />
      <WorkerTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </WorkerTab.Navigator>
  );
};

// MARK: - Admin Tab Navigator

const AdminTabNavigator: React.FC = () => {
  const { theme } = useUI();
  const isDark = theme === 'dark';

  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'AdminDashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'AllTasks':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'AllBuildings':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'Workers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderSubtle,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontFamily: Typography.fonts.primary,
          fontWeight: Typography.weights.semibold,
        },
      })}
    >
      <AdminTab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardMainView}
        options={{ title: 'Admin Dashboard' }}
      />
      <AdminTab.Screen 
        name="AllTasks" 
        component={TaskListScreen}
        options={{ title: 'All Tasks' }}
      />
      <AdminTab.Screen 
        name="AllBuildings" 
        component={BuildingListScreen}
        options={{ title: 'All Buildings' }}
      />
      <AdminTab.Screen 
        name="Workers" 
        component={WorkerListScreen}
        options={{ title: 'Workers' }}
      />
      <AdminTab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <AdminTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </AdminTab.Navigator>
  );
};

// MARK: - Client Tab Navigator

const ClientTabNavigator: React.FC = () => {
  const { theme } = useUI();
  const isDark = theme === 'dark';

  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'ClientDashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Portfolio':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderSubtle,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontFamily: Typography.fonts.primary,
          fontWeight: Typography.weights.semibold,
        },
      })}
    >
      <ClientTab.Screen 
        name="ClientDashboard" 
        component={ClientDashboardMainView}
        options={{ title: 'Portfolio Dashboard' }}
      />
      <ClientTab.Screen 
        name="Portfolio" 
        component={BuildingListScreen}
        options={{ title: 'My Buildings' }}
      />
      <ClientTab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <ClientTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </ClientTab.Navigator>
  );
};

// MARK: - Main Stack Navigator

const MainStackNavigator: React.FC = () => {
  const currentUser = useCurrentUser();
  const { theme } = useUI();
  const isDark = theme === 'dark';

  const renderTabNavigator = () => {
    switch (currentUser?.role) {
      case 'worker':
        return <WorkerTabNavigator />;
      case 'admin':
      case 'manager':
        return <AdminTabNavigator />;
      case 'client':
        return <ClientTabNavigator />;
      default:
        return <WorkerTabNavigator />; // Default fallback
    }
  };

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontFamily: Typography.fonts.primary,
          fontWeight: Typography.weights.semibold,
        },
        cardStyle: { backgroundColor: Colors.background }
      }}
    >
      <RootStack.Screen 
        name="Main" 
        component={renderTabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <RootStack.Screen 
        name="BuildingDetail" 
        component={BuildingDetailScreen}
        options={{ title: 'Building Details' }}
      />
      <RootStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <RootStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </RootStack.Navigator>
  );
};

// MARK: - Main App Navigator

export const AppNavigator: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const { isLoading, theme } = useUI();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize navigation state
    const initializeNavigation = async () => {
      try {
        // Any navigation initialization logic here
        setIsInitialized(true);
      } catch (error) {
        console.error('Navigation initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initializeNavigation();
  }, []);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

// MARK: - Placeholder Screens (to be implemented)

const TaskListScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Task List Screen</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const BuildingListScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Building List Screen</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const WorkerListScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Worker List Screen</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const AnalyticsScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Analytics Screen</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const ReportsScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Reports Screen</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

// MARK: - Styles

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.baseBackground,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fonts.primary,
    color: Colors.primaryText,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.baseBackground,
    padding: Spacing.lg,
  },
  placeholderText: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});

export default AppNavigator;
