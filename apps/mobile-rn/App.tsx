/**
 * 📱 CyntientOps Mobile App
 * Main application entry point with navigation and state management
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProvider } from './src/providers/AppProvider';
import { ErrorBoundary } from '@cyntientops/ui-components';

export default function App() {
  return (
    <ErrorBoundary context="App">
      <SafeAreaProvider>
        <AppProvider>
          <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#0a0a0a" />
            <AppNavigator />
          </View>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
