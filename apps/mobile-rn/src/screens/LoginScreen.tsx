/**
 * 🔐 Login Screen
 * Mirrors: CyntientOps/Views/Auth/LoginView.swift
 * Purpose: User authentication and role-based access
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { WorkerProfile } from '@cyntientops/domain-schema';

interface LoginScreenProps {
  onLoginSuccess: (user: WorkerProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);

      const databaseManager = DatabaseManager.getInstance({
        path: 'cyntientops.db'
      });
      await databaseManager.initialize();

      // Find user by email
      const workers = databaseManager.getWorkers();
      const user = workers.find(worker => worker.email === email);

      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // In a real app, you would verify the password here
      // For demo purposes, we'll accept any password
      onLoginSuccess(user);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'worker' | 'admin') => {
    // Demo login with predefined users
    const demoUsers = {
      worker: {
        id: '4',
        name: 'Kevin Dutan',
        email: 'kevin@cyntientops.com',
        phone: '+1-555-0123',
        role: 'worker',
        status: 'Available',
        capabilities: {}
      } as WorkerProfile,
      admin: {
        id: '1',
        name: 'Greg Hutson',
        email: 'greg@cyntientops.com',
        phone: '+1-555-0124',
        role: 'admin',
        status: 'Available',
        capabilities: {}
      } as WorkerProfile
    };

    onLoginSuccess(demoUsers[role]);
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

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Access</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDemoLogin('worker')}
            >
              <Text style={styles.demoButtonText}>Worker Demo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDemoLogin('admin')}
            >
              <Text style={styles.demoButtonText}>Admin Demo</Text>
            </TouchableOpacity>
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
});

export default LoginScreen;
