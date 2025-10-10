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

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Defer secure storage load to runtime to reduce initial bundle weight

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
// Import optimized lazy loading
import { createLazyComponent, ComponentPreloader } from '../components/LazyComponentLoader';

// Enhanced Tab Navigator - high priority as it's critical for navigation
const EnhancedTabNavigator = createLazyComponent(() => import('./EnhancedTabNavigator'), { priority: 'high' });

// Lazy-load heavy screens with optimized loading
const BuildingDetailScreen = createLazyComponent(() => import('../screens/BuildingDetailScreen'), { priority: 'medium' });
const TaskTimelineScreen = createLazyComponent(() => import('../screens/TaskTimelineScreen'), { priority: 'low' });
const MultisiteDepartureScreen = createLazyComponent(() => import('../screens/MultisiteDepartureScreen'), { priority: 'low' });
const WeeklyRoutineScreen = createLazyComponent(() => import('../screens/WeeklyRoutineScreen'), { priority: 'low' });
const DailyRoutineScreen = createLazyComponent(() => import('../screens/DailyRoutineScreen'), { priority: 'low' });
const PhotoCaptureModal = createLazyComponent(() => import('../screens/PhotoCaptureModal'), { priority: 'low' });
const HPDDetailScreen = createLazyComponent(() => import('../screens/compliance/HPDDetailScreen'), { priority: 'low' });
const DOBDetailScreen = createLazyComponent(() => import('../screens/compliance/DOBDetailScreen'), { priority: 'low' });
const DSNYDetailScreen = createLazyComponent(() => import('../screens/compliance/DSNYDetailScreen'), { priority: 'low' });
const LL97DetailScreen = createLazyComponent(() => import('../screens/compliance/LL97DetailScreen'), { priority: 'low' });

// Types
import type { AuthUser } from '@cyntientops/business-core/src/services/AuthService';
import type { SessionData } from '@cyntientops/business-core/src/services/SessionManager';
import type { AuthenticatedUser } from '@cyntientops/business-core/src/services/AuthenticationService';
import { WorkerProfile, UserRole } from '@cyntientops/domain-schema';
import { useServices } from '../providers/AppProvider';
// Defer RealDataService import until needed

export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: 'worker' | 'client' | 'admin'; userId: string; userName: string };
  Profile: { userId?: string; userName?: string; userRole?: 'worker' | 'client' | 'admin'; onLogout?: () => void } | undefined;
  BuildingDetail: { buildingId: string; userRole?: 'worker' | 'client' | 'admin' };
  TaskTimeline: { taskId: string };
  PhotoCaptureModal: { taskId?: string; buildingId?: string };
  MultisiteDeparture: undefined;
  WeeklyRoutine: undefined;
  DailyRoutine: undefined;
  HPDDetail: { buildingId: string };
  DOBDetail: { buildingId: string };
  DSNYDetail: { buildingId: string };
  LL97Detail: { buildingId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'client' | 'admin';
  profile?: WorkerProfile;
};

let secureStorage: any = null;

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
    
    // Preload components after initial render
    ComponentPreloader.preloadCriticalScreens();
  }, []);

  /**
   * Attempt to restore an active session from AsyncStorage and validate it
   * with the `SessionManager`. If valid, derive an `AppUser` for downstream
   * consumers and mark the navigator as ready. Invalid tokens are removed.
   */
  const restoreActiveSession = async () => {
    try {
      // Use secure storage only (migration complete)
      if (!secureStorage) {
        const { SecureStorageService } = await import('@cyntientops/business-core/src/services/SecureStorageService');
        secureStorage = SecureStorageService.getInstance();
      }
      const storedToken = await secureStorage.getSessionToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const validated = await services.sessionManager.validateSession(storedToken);
      if (!validated) {
        await secureStorage.removeSessionToken();
        setIsLoading(false);
        return;
      }

      setSession(validated);
      try { 
        services.sessionManager.setCurrentSession(validated); 
      } catch (error) {
        console.warn('Failed to set current session, continuing with restored session:', error);
        // Session is still valid, just couldn't set it in the manager
        // This is non-critical as the session is already restored
      }
      setUser(resolveAppUser(validated));
    } catch (error) {
      console.error('Failed to restore session', error);
      await secureStorage.removeSessionToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Use EnhancedTabNavigator with role-based tabs
  const MainTabs = ({ route }: { route: any }) => {
    const { userRole, userId, userName } = route.params;

    return (
      <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
        <EnhancedTabNavigator
          userRole={userRole}
          userId={userId}
          userName={userName}
          onLogout={handleLogout}
        />
      </Suspense>
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

      if (!secureStorage) {
        const { SecureStorageService } = await import('@cyntientops/business-core/src/services/SecureStorageService');
        secureStorage = SecureStorageService.getInstance();
      }
      await secureStorage.storeSessionToken(sessionData.sessionToken);
      setSession(sessionData);
      setUser(resolveAppUser(sessionData));
    },
    [services.sessionManager],
  );

  const handleLogout = useCallback(async () => {
    try {
      if (!secureStorage) {
        const { SecureStorageService } = await import('@cyntientops/business-core/src/services/SecureStorageService');
        secureStorage = SecureStorageService.getInstance();
      }
      const token = await secureStorage.getSessionToken();
      if (token) {
        await services.sessionManager.logout(token);
      }
      await secureStorage.removeSessionToken();
    } catch (err) {
      // Best-effort logout - ensure token is removed even on error
      await secureStorage.removeSessionToken().catch((error) => {
        console.warn('Failed to remove session token during logout:', error);
        // Non-critical: token removal failed but logout should continue
        // The session is already cleared from memory
      });
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
        id="root-stack"
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
              name="Profile"
              children={() => <ProfileScreen />}
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
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <BuildingDetailScreen />
                </Suspense>
              )}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="TaskTimeline"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <TaskTimelineScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            <Stack.Screen
              name="MultisiteDeparture"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <MultisiteDepartureScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            <Stack.Screen
              name="WeeklyRoutine"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <WeeklyRoutineScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            <Stack.Screen
              name="DailyRoutine"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <DailyRoutineScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
              }}
            />
            <Stack.Screen
              name="PhotoCaptureModal"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <PhotoCaptureModal />
                </Suspense>
              )}
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
              name="HPDDetail"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <HPDDetailScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                title: 'HPD Violations'
              }}
            />
            <Stack.Screen
              name="DOBDetail"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <DOBDetailScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                title: 'DOB Permits'
              }}
            />
            <Stack.Screen
              name="DSNYDetail"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <DSNYDetailScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                title: 'DSNY Violations'
              }}
            />
            <Stack.Screen
              name="LL97Detail"
              children={() => (
                <Suspense fallback={<ActivityIndicator size="large" color="#10b981" />}>
                  <LL97DetailScreen />
                </Suspense>
              )}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f0f0f' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                title: 'LL97 Emissions'
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
    // Dynamically require to avoid pulling full business-core at startup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RealDataService } = require('@cyntientops/business-core/src/services/RealDataService');
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
