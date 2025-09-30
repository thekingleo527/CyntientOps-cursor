/**
 * @cyntientops/ui-components
 * 
 * Expo Module Mocks
 * Mock implementations for development without native modules
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock LinearGradient
export const LinearGradient: React.FC<{ colors: string[]; style?: any; children?: React.ReactNode }> = ({ colors, style, children }) => (
  <View style={[style, { backgroundColor: colors[0] }]}>
    {children}
  </View>
);

// Mock BlurView
export const BlurView: React.FC<{ intensity?: number; style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
    {children}
  </View>
);

// Mock Haptics
export const Haptics = {
  impactAsync: async (style: any) => {
    console.log('Haptic feedback:', style);
  },
  notificationAsync: async (type: any) => {
    console.log('Haptic notification:', type);
  },
  selectionAsync: async () => {
    console.log('Haptic selection');
  },
};

// Mock SecureStore
export const SecureStore = {
  setItemAsync: async (key: string, value: string) => {
    console.log('SecureStore set:', key);
  },
  getItemAsync: async (key: string) => {
    console.log('SecureStore get:', key);
    return null;
  },
  deleteItemAsync: async (key: string) => {
    console.log('SecureStore delete:', key);
  },
};

// Mock LocalAuthentication
export const LocalAuthentication = {
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  authenticateAsync: async () => ({ success: true }),
};

// Mock FileSystem
export const FileSystem = {
  documentDirectory: '/mock/documents/',
  readAsStringAsync: async (uri: string) => '',
  writeAsStringAsync: async (uri: string, content: string) => {},
  deleteAsync: async (uri: string) => {},
};

// Mock Crypto
export const Crypto = {
  digestStringAsync: async (algorithm: string, data: string) => 'mock-hash',
  randomUUID: () => 'mock-uuid',
};

// Mock AV
export const Audio = {
  Recording: {
    startAsync: async () => {},
    stopAndUnloadAsync: async () => {},
  },
  Sound: {
    createAsync: async () => ({ sound: { playAsync: async () => {} } }),
  },
};

// Mock Speech
export const Speech = {
  speak: async (text: string) => {
    console.log('Speech:', text);
  },
  stop: async () => {
    console.log('Speech stopped');
  },
};

// Mock Vector Icons
export const Ionicons = {
  name: 'ios-checkmark',
  size: 24,
  color: '#000',
};

// Mock Animated
export const Animated = {
  View: View,
  Text: Text,
  Value: (value: number) => ({ _value: value }),
  timing: (value: any, config: any) => ({
    start: (callback?: () => void) => {
      if (callback) callback();
    },
  }),
  spring: (value: any, config: any) => ({
    start: (callback?: () => void) => {
      if (callback) callback();
    },
  }),
  sequence: (animations: any[]) => ({
    start: (callback?: () => void) => {
      if (callback) callback();
    },
  }),
  parallel: (animations: any[]) => ({
    start: (callback?: () => void) => {
      if (callback) callback();
    },
  }),
};

// Mock PanResponder
export const PanResponder = {
  create: (config: any) => ({
    panHandlers: {},
  }),
};

// Mock State
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export default {
  LinearGradient,
  BlurView,
  Haptics,
  SecureStore,
  LocalAuthentication,
  FileSystem,
  Crypto,
  Audio,
  Speech,
  Ionicons,
  Animated,
  PanResponder,
  State,
};
