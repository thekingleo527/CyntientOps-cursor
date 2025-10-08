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

export default function App() {
  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
