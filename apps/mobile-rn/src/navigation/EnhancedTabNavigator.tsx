/**
 * Enhanced Tab Navigator
 * Role-based tab navigation for Workers, Clients, and Admins
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Dashboard screens
import { WorkerDashboardScreen } from '../screens/WorkerDashboardScreen';
import { ClientDashboardScreen } from '../screens/ClientDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

// Tab screens
import { WorkerMapTab } from './tabs/WorkerMapTab';
import { WorkerScheduleTab } from './tabs/WorkerScheduleTab';
import { WorkerIntelligenceTab } from './tabs/WorkerIntelligenceTab';
import { WorkerSiteDepartureTab } from './tabs/WorkerSiteDepartureTab';
import { ClientPortfolioTab } from './tabs/ClientPortfolioTab';
import { ClientIntelligenceTab } from './tabs/ClientIntelligenceTab';
import { AdminWorkersTab } from './tabs/AdminWorkersTab';
import { AdminPortfolioTab } from './tabs/AdminPortfolioTab';
import { AdminIntelligenceTab } from './tabs/AdminIntelligenceTab';

const Tab = createBottomTabNavigator();

interface EnhancedTabNavigatorProps {
  userRole: 'worker' | 'client' | 'admin';
  userId: string;
  userName: string;
  onLogout: () => void;
}

export const EnhancedTabNavigator: React.FC<EnhancedTabNavigatorProps> = ({
  userRole,
  userId,
  userName,
  onLogout,
}) => {
  if (userRole === 'worker') {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f0f0f',
            borderTopColor: '#1f1f1f',
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen
          name="Dashboard"
          children={() => <WorkerDashboardScreen userId={userId} userName={userName} onLogout={onLogout} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Map"
          children={() => <WorkerMapTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Schedule"
          children={() => <WorkerScheduleTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Intelligence"
          children={() => <WorkerIntelligenceTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="lightbulb" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Departure"
          children={() => <WorkerSiteDepartureTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="logout" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    );
  }

  if (userRole === 'client') {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f0f0f',
            borderTopColor: '#1f1f1f',
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen
          name="Dashboard"
          children={() => <ClientDashboardScreen userId={userId} userName={userName} onLogout={onLogout} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Portfolio"
          children={() => <ClientPortfolioTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Intelligence"
          children={() => <ClientIntelligenceTab userId={userId} />}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="lightbulb" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    );
  }

  // Admin
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f0f',
          borderTopColor: '#1f1f1f',
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        children={() => <AdminDashboardScreen userId={userId} userName={userName} onLogout={onLogout} />}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workers"
        children={() => <AdminWorkersTab userId={userId} />}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        children={() => <AdminPortfolioTab userId={userId} />}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Intelligence"
        children={() => <AdminIntelligenceTab userId={userId} />}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="lightbulb" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default EnhancedTabNavigator;
