/**
 * 🧭 App Navigator
 * Mirrors: CyntientOps/Navigation/NavigationCoordinator.swift
 * Purpose: Main navigation coordinator with role-based routing
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '../mocks/react-navigation-stack';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screens
import { BuildingDetailScreen } from '../screens/BuildingDetailScreen';
import { TaskTimelineScreen } from '../screens/TaskTimelineScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MultisiteDepartureScreen } from '../screens/MultisiteDepartureScreen';
import { WeeklyRoutineScreen } from '../screens/WeeklyRoutineScreen';
import { DailyRoutineScreen } from '../screens/DailyRoutineScreen';

// Enhanced Tab Navigator
import { EnhancedTabNavigator } from './EnhancedTabNavigator';

// Types
import { WorkerProfile } from '@cyntientops/domain-schema';

export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: 'worker' | 'client' | 'admin'; userId: string; userName: string };
  BuildingDetail: { buildingId: string };
  TaskTimeline: { taskId: string };
  ClockInModal: { buildingId: string };
  PhotoCaptureModal: { taskId: string };
  MultisiteDeparture: undefined;
  WeeklyRoutine: undefined;
  DailyRoutine: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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

  // Use EnhancedTabNavigator with role-based tabs
  const MainTabs = ({ route }: { route: any }) => {
    const { userRole, userId, userName } = route.params;

    return (
      <EnhancedTabNavigator
        userRole={userRole}
        userId={userId}
        userName={userName}
      />
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
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen
                onLoginSuccess={(authenticatedUser) => {
                  // Convert AuthenticatedUser to WorkerProfile format
                  const workerProfile: WorkerProfile = {
                    id: authenticatedUser.id,
                    name: authenticatedUser.name,
                    email: authenticatedUser.email,
                    role: authenticatedUser.role,
                    phone: authenticatedUser.profile.phone || '',
                    status: 'Available',
                    capabilities: (authenticatedUser.profile as any).capabilities || {}
                  };
                  setUser(workerProfile);
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              initialParams={{
                userRole: user.role === 'admin' ? 'admin' : 'worker',
                userId: user.id,
                userName: user.name
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
});

export default AppNavigator;
