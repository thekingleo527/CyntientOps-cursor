/**
 * 📱 CyntientOps Mobile App
 * Main application entry point with navigation and state management
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { WorkerProfile } from '@cyntientops/domain-schema';

export default function App() {
  const [user, setUser] = useState<WorkerProfile | null>(null);

  const handleLoginSuccess = (user: WorkerProfile) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#0a0a0a" />
        <AppNavigator 
          initialUser={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
