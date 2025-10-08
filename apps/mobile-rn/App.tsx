/**
 * 📱 CyntientOps Mobile App
 * Main application entry point with navigation and state management
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProvider } from './src/providers/AppProvider';
import { ErrorBoundary } from '../../packages/ui-components/src/errors/ErrorBoundary';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

// Temporary root error boundary to prevent crashes during development
class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Root Error Boundary caught an error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading...</Text>
          <Text style={styles.errorSubtext}>Please restart the app if this persists</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <ErrorBoundary context="App">
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <AppProvider>
              <StatusBar style="light" backgroundColor="#0a0a0a" />
              <AppNavigator />
            </AppProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});
