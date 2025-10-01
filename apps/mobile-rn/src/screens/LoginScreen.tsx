/**
 * 🔐 Login Screen
 * Mirrors: CyntientOps/Views/Auth/LoginView.swift
 * Purpose: User authentication and role-based access
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { WorkerProfile } from '@cyntientops/domain-schema';
import { AuthenticationService, AuthenticatedUser } from '@cyntientops/business-core/src/services/AuthenticationService';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';
import { Logger } from '@cyntientops/business-core';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authService, setAuthService] = useState<AuthenticationService | null>(null);

  // Initialize authentication service
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const databaseManager = DatabaseManager.getInstance({
          path: 'cyntientops.db'
        });
        await databaseManager.initialize();
        const service = AuthenticationService.getInstance(databaseManager);
        setAuthService(service);
      } catch (error) {
        Logger.error('Failed to initialize authentication service:', undefined, 'LoginScreen.tsx');
      }
    };
    initializeAuth();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!authService) {
      Alert.alert('Error', 'Authentication service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      const result = await authService.authenticate(email, password);
      
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      Logger.error('Login error:', undefined, 'LoginScreen.tsx');
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    if (!authService) {
      Alert.alert('Error', 'Authentication service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      const result = await authService.quickLogin(username);
      
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        Alert.alert('Error', result.error || 'Quick login failed');
      }
    } catch (error) {
      Logger.error('Quick login error:', undefined, 'LoginScreen.tsx');
      Alert.alert('Error', 'Quick login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>CyntientOps</Text>
          <Text style={styles.subtitle}>Field Operations Management</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Glass Card Quick Login */}
        <View style={styles.glassCardsSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.glassCardsGrid}>
            {authService?.getGlassCardUsers().map((user, index) => (
              <TouchableOpacity
                key={index}
                style={styles.glassCardContainer}
                onPress={() => handleQuickLogin(user.username)}
                disabled={isLoading}
              >
                <GlassCard
                  intensity={GlassIntensity.regular}
                  cornerRadius={CornerRadius.medium}
                  style={styles.glassCard}
                >
                  <Text style={styles.glassCardName}>{user.name}</Text>
                  <Text style={styles.glassCardRole}>{user.role}</Text>
                  <Text style={styles.glassCardUsername}>@{user.username}</Text>
                </GlassCard>
              </TouchableOpacity>
            )) || []}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with TypeScript & React Native
          </Text>
          <Text style={styles.footerText}>
            Mirroring SwiftUI Architecture
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    marginBottom: 32,
  },
  demoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  demoButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  glassCardsSection: {
    marginBottom: 32,
  },
  glassCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  glassCardContainer: {
    width: '48%',
    marginBottom: 12,
  },
  glassCard: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  glassCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  glassCardRole: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  glassCardUsername: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
});

export default LoginScreen;
