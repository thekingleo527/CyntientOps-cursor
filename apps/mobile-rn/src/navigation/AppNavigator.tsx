/**
 * 🧭 App Navigator
 * Mirrors: CyntientOps/Navigation/NavigationCoordinator.swift
 * Purpose: Main navigation coordinator with role-based routing
 *
 * Summary
 * - Uses `@react-navigation/native-stack` for a real stack navigator.
 * - Restores sessions from AsyncStorage and validates via `services.sessionManager`.
 * - Bridges authenticated user/session to a lightweight `AppUser` consumed by tabs and screens.
 * - Exposes a `Main` route that renders role-based tabs via `EnhancedTabNavigator`.
 *
 * Notes
 * - This file replaces prior mocked navigation with real React Navigation wiring.
 * - Token persistence key: `cyntientops.session.token`.
 * - When a session is missing/invalid, app shows the `Login` screen.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import { BuildingDetailScreen } from '../screens/BuildingDetailScreen';
import { TaskTimelineScreen } from '../screens/TaskTimelineScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MultisiteDepartureScreen } from '../screens/MultisiteDepartureScreen';
import { WeeklyRoutineScreen } from '../screens/WeeklyRoutineScreen';
import { DailyRoutineScreen } from '../screens/DailyRoutineScreen';
import { PhotoCaptureModal } from '../screens/PhotoCaptureModal';
import { ProfileScreen } from '../screens/ProfileScreen';

// Enhanced Tab Navigator
import { EnhancedTabNavigator } from './EnhancedTabNavigator';

// Types
import type { AuthUser } from '@cyntientops/business-core/src/services/AuthService';
import type { SessionData } from '@cyntientops/business-core/src/services/SessionManager';
import type { AuthenticatedUser } from '@cyntientops/business-core/src/services/AuthenticationService';
import { WorkerProfile, UserRole } from '@cyntientops/domain-schema';
import { useServices } from '../providers/AppProvider';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';

export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: 'worker' | 'client' | 'admin'; userId: string; userName: string };
  BuildingDetail: { buildingId: string; userRole?: 'worker' | 'client' | 'admin' };
  TaskTimeline: { taskId: string };
  ClockInModal: { buildingId: string };
  PhotoCaptureModal: { taskId: string };
  Profile: { userName?: string; userRole?: 'worker' | 'client' | 'admin'; onLogout?: () => void } | undefined;
  MultisiteDeparture: undefined;
  WeeklyRoutine: undefined;
  DailyRoutine: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'client' | 'admin';
  profile?: WorkerProfile;
};

const SESSION_TOKEN_STORAGE_KEY = 'cyntientops.session.token';

interface AppNavigatorProps {
  initialUser?: WorkerProfile;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ initialUser }) => {
  const services = useServices();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [user, setUser] = useState<AppUser | null>(() =>
    initialUser
      ? {
          id: initialUser.id,
          name: initialUser.name,
          email: initialUser.email,
          role: (initialUser.role as UserRole) === 'admin' ? 'admin' : 'worker',
          profile: initialUser,
        }
      : null,
  );

  useEffect(() => {
    void restoreActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Attempt to restore an active session from AsyncStorage and validate it
   * with the `SessionManager`. If valid, derive an `AppUser` for downstream
   * consumers and mark the navigator as ready. Invalid tokens are removed.
   */
  const restoreActiveSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const validated = await services.sessionManager.validateSession(storedToken);
      if (!validated) {
        await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      setSession(validated);
      setUser(resolveAppUser(validated));
    } catch (error) {
      console.error('Failed to restore session', error);
      await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  // Use EnhancedTabNavigator with role-based tabs
  const MainTabs = ({ route }: { route: any }) => {
    const { userRole, userId, userName } = route.params;

    return (
      <EnhancedTabNavigator
        userRole={userRole}
        userId={userId}
        userName={userName}
        onLogout={handleLogout}
      />
    );
  };

  /**
   * Handle successful authentication from `LoginScreen` by creating an app
   * session using the `SessionManager`, persisting the token, and reducing the
   * `SessionData` into an `AppUser` for UI consumption.
   */
  const handleLoginSuccess = useCallback(
    async (authenticatedUser: AuthenticatedUser) => {
      const authUser: AuthUser = {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role as UserRole,
        name: authenticatedUser.name,
        profile: authenticatedUser.profile,
        isAuthenticated: true,
        lastLogin: new Date(),
      };

      const sessionData = await services.sessionManager.createSession(
        authUser,
        `device-${authenticatedUser.id}`,
        undefined,
        'CyntientOps-Mobile'
      );

      if (!sessionData) {
        throw new Error('Unable to create application session');
      }

      await AsyncStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionData.sessionToken);
      setSession(sessionData);
      setUser(resolveAppUser(sessionData));
    },
    [services.sessionManager],
  );

  const handleLogout = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
      if (token) {
        await services.sessionManager.logout(token);
      }
      await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    } catch (err) {
      // Best-effort logout
    } finally {
      setSession(null);
      setUser(null);
    }
  }, [services.sessionManager]);

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
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {!user ? (
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              initialParams={{
                userRole: user.role,
                userId: user.id,
                userName: user.name
              }}
            />
            <Stack.Screen
              name="PhotoCaptureModal"
              component={PhotoCaptureModal}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                presentation: 'modal',
                title: 'Photo Evidence'
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
                title: 'Profile'
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

/**
 * Convert validated `SessionData` to the simplified `AppUser` used by the app.
 * If a profile is absent, attempt to hydrate from `RealDataService` as a
 * fallback for worker/admin roles.
 */
const resolveAppUser = (session: SessionData): AppUser => {
  const role: AppUser['role'] = (session.userRole === 'manager' ? 'admin' : session.userRole) as AppUser['role'];

  if (session.profile && (role === 'worker' || role === 'admin')) {
    const profile = session.profile as WorkerProfile;
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role,
      profile,
    };
  }

  if (role === 'worker' || role === 'admin') {
    const worker = RealDataService.getWorkerById(session.userId);
    if (worker) {
      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: (worker.role as UserRole) === 'admin' ? 'admin' : 'worker',
        profile: worker,
      };
    }
  }

  return {
    id: session.userId,
    name: session.profile && 'name' in session.profile ? session.profile.name : session.userId,
    email: session.profile && 'email' in session.profile ? session.profile.email || '' : '',
    role,
  };
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
