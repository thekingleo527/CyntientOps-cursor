/**
 * 🧭 App Navigator
 * Mirrors: CyntientOps/Navigation/NavigationCoordinator.swift
 * Purpose: Main navigation coordinator with role-based routing
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '../mocks/react-navigation-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screens
import { WorkerDashboardScreen } from '../screens/WorkerDashboardScreen';
import { ClientDashboardScreen } from '../screens/ClientDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { BuildingDetailScreen } from '../screens/BuildingDetailScreen';
import { TaskTimelineScreen } from '../screens/TaskTimelineScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MultisiteDepartureScreen } from '../screens/MultisiteDepartureScreen';
import { WeeklyRoutineScreen } from '../screens/WeeklyRoutineScreen';
import { DailyRoutineScreen } from '../screens/DailyRoutineScreen';

// Types
import { WorkerProfile } from '@cyntientops/domain-schema';

export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: 'worker' | 'client' | 'admin'; userId: string };
  BuildingDetail: { buildingId: string };
  TaskTimeline: { taskId: string };
  ClockInModal: { buildingId: string };
  PhotoCaptureModal: { taskId: string };
  MultisiteDeparture: undefined;
  WeeklyRoutine: undefined;
  DailyRoutine: undefined;
};

export type MainTabParamList = {
  WorkerDashboard: { workerId: string };
  ClientDashboard: { clientId: string };
  AdminDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface AppNavigatorProps {
  initialUser?: WorkerProfile;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ initialUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<WorkerProfile | null>(initialUser || null);

  useEffect(() => {
    // Simulate user authentication check
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const MainTabs = ({ route }: { route: any }) => {
    const { userRole, userId } = route.params;

    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f0f0f',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        {userRole === 'worker' && (
          <Tab.Screen
            name="WorkerDashboard"
            component={WorkerDashboardScreen}
            initialParams={{ workerId: userId }}
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <View style={[styles.tabIcon, { backgroundColor: color }]} />
              ),
            }}
          />
        )}
        
        {userRole === 'client' && (
          <Tab.Screen
            name="ClientDashboard"
            component={ClientDashboardScreen}
            initialParams={{ clientId: userId }}
            options={{
              title: 'Portfolio',
              tabBarIcon: ({ color, size }) => (
                <View style={[styles.tabIcon, { backgroundColor: color }]} />
              ),
            }}
          />
        )}
        
        {userRole === 'admin' && (
          <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{
              title: 'Admin',
              tabBarIcon: ({ color, size }) => (
                <View style={[styles.tabIcon, { backgroundColor: color }]} />
              ),
            }}
          />
        )}
      </Tab.Navigator>
    );
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
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              initialParams={{ 
                userRole: user.role === 'admin' ? 'admin' : 'worker',
                userId: user.id 
              }}
            />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  tabIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default AppNavigator;
