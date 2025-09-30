/**
 * 🔐 Login Screen
 * Purpose: Authentication screen with integration to Phase 1 services
 * Mirrors: SwiftUI LoginView with enhanced UX and security features
 * Features: Biometric auth, session management, error handling, and role-based routing
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';

// State Management
import { useActions, useIsLoading, useError } from '@cyntientops/business-core';

// Design Tokens
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@cyntientops/design-tokens';

// Services
import { ServiceContainer } from '@cyntientops/business-core';
import { ServiceIntegrationLayer } from '@cyntientops/business-core';

// Types
import { UserRole } from '@cyntientops/domain-schema';

const { width, height } = Dimensions.get('window');

export interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onRegister,
}) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  // Refs
  const passwordInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

  // State Management
  const actions = useActions();
  const isLoading = useIsLoading();
  const error = useError();

  // Services
  const [serviceIntegration, setServiceIntegration] = useState<ServiceIntegrationLayer | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const serviceContainer = ServiceContainer.getInstance({
          databasePath: 'cyntientops.db',
          enableRealTimeSync: true,
          enableIntelligence: true,
          enableWeatherIntegration: false
        });

        await serviceContainer.database.initialize();
        
        const integration = ServiceIntegrationLayer.getInstance(serviceContainer);
        await integration.initialize();
        
        setServiceIntegration(integration);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        actions.setError('Failed to initialize application');
      }
    };

    initializeServices();
  }, []);

  // Check biometric availability
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (hasHardware && isEnrolled) {
          setBiometricAvailable(true);
          
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Touch ID');
          } else {
            setBiometricType('Biometric');
          }
        }
      } catch (error) {
        console.error('Failed to check biometric availability:', error);
      }
    };

    checkBiometricAvailability();
  }, []);

  // Handle login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      actions.setError('Please enter both email and password');
      return;
    }

    if (!serviceIntegration) {
      actions.setError('Application not ready. Please try again.');
      return;
    }

    try {
      const deviceId = Device.osInternalBuildId || 'unknown-device';
      const success = await serviceIntegration.loginUser(email, password, deviceId);

      if (success) {
        onLoginSuccess?.();
      }
    } catch (error) {
      console.error('Login failed:', error);
      actions.setError('Login failed. Please check your credentials.');
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!biometricAvailable || !serviceIntegration) return;

    try {
      setIsBiometricLoading(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access CyntientOps',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // For demo purposes, use a default account
        // In production, this would retrieve stored credentials
        const deviceId = Device.osInternalBuildId || 'unknown-device';
        const success = await serviceIntegration.loginUser(
          'demo@cyntientops.com',
          'demo123',
          deviceId
        );

        if (success) {
          onLoginSuccess?.();
        }
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      actions.setError('Biometric authentication failed');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  // Handle register
  const handleRegister = () => {
    Alert.alert(
      'Register',
      'Registration functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  // Demo login for testing
  const handleDemoLogin = async (role: UserRole) => {
    if (!serviceIntegration) return;

    const demoCredentials = {
      worker: { email: 'worker@cyntientops.com', password: 'worker123' },
      admin: { email: 'admin@cyntientops.com', password: 'admin123' },
      client: { email: 'client@cyntientops.com', password: 'client123' },
    };

    const credentials = demoCredentials[role];
    const deviceId = Device.osInternalBuildId || 'unknown-device';
    
    const success = await serviceIntegration.loginUser(
      credentials.email,
      credentials.password,
      deviceId
    );

    if (success) {
      onLoginSuccess?.();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, Colors.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="construct" size={48} color={Colors.white} />
            </View>
            <Text style={styles.title}>CyntientOps</Text>
            <Text style={styles.subtitle}>Field Operations Management</Text>
          </View>

          {/* Login Form */}
          <BlurView intensity={20} style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={Colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.secondaryText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={Colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.secondaryText}
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color={Colors.white} />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Biometric Login */}
            {biometricAvailable && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isBiometricLoading}
              >
                {isBiometricLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name={biometricType === 'Face ID' ? 'face-recognition' : 'finger-print'}
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.biometricButtonText}>
                      Sign in with {biometricType}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Role-Based Glass Cards */}
            <View style={styles.roleCardsContainer}>
              <Text style={styles.roleCardsTitle}>Quick Access</Text>
              
              {/* Field Team Card */}
              <View style={[styles.roleCard, styles.fieldTeamCard]}>
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                    <Ionicons name="people" size={18} color={Colors.success} />
                  </View>
                  <View style={styles.roleCardTitleContainer}>
                    <Text style={styles.roleCardTitle}>Field Team</Text>
                    <Text style={styles.roleCardSubtitle}>CyntientOps Workers</Text>
                  </View>
                </View>
                
                <View style={styles.roleUsersGrid}>
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(34, 197, 94, 0.4)' }]}
                    onPress={() => handleDemoLogin('worker')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.success }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.success }]}>Worker</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>Kevin Dutan</Text>
                    <Text style={styles.userEmail}>kevin.dutan</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(34, 197, 94, 0.4)' }]}
                    onPress={() => handleDemoLogin('worker')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.success }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.success }]}>Worker</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>Greg Hutson</Text>
                    <Text style={styles.userEmail}>greg.hutson</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Property Managers Card */}
              <View style={[styles.roleCard, styles.propertyManagersCard]}>
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                    <Ionicons name="business" size={18} color={Colors.purple} />
                  </View>
                  <View style={styles.roleCardTitleContainer}>
                    <Text style={styles.roleCardTitle}>Property Managers</Text>
                    <Text style={styles.roleCardSubtitle}>Client Admins</Text>
                  </View>
                </View>
                
                <View style={styles.roleUsersGrid}>
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(168, 85, 247, 0.4)' }]}
                    onPress={() => handleDemoLogin('admin')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.purple }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.purple }]}>Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>Moises Farhat</Text>
                    <Text style={styles.userEmail}>mfarhat</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(168, 85, 247, 0.4)' }]}
                    onPress={() => handleDemoLogin('admin')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.purple }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.purple }]}>Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>Michelle</Text>
                    <Text style={styles.userEmail}>michelle</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* JM Realty Card */}
              <View style={[styles.roleCard, styles.jmRealtyCard]}>
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Ionicons name="business" size={18} color={Colors.info} />
                  </View>
                  <View style={styles.roleCardTitleContainer}>
                    <Text style={styles.roleCardTitle}>JM Realty</Text>
                    <Text style={styles.roleCardSubtitle}>9 Buildings Portfolio</Text>
                  </View>
                </View>
                
                <View style={styles.roleUsersGrid}>
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}
                    onPress={() => handleDemoLogin('client')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.info }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.info }]}>Client</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>David Edelman</Text>
                    <Text style={styles.userEmail}>david</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.userCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}
                    onPress={() => handleDemoLogin('admin')}
                  >
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userStatusDot, { backgroundColor: Colors.info }]} />
                      <View style={[styles.userRoleBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <Text style={[styles.userRoleText, { color: Colors.info }]}>Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>Jerry Edelman</Text>
                    <Text style={styles.userEmail}>jedelman</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink} onPress={handleRegister}>
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  formTitle: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassOverlay,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.primaryText,
    paddingVertical: Spacing.md,
  },
  passwordToggle: {
    padding: Spacing.sm,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.secondaryText,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glassOverlay,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  biometricButtonText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  roleCardsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  roleCardsTitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  fieldTeamCard: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  propertyManagersCard: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  jmRealtyCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  roleCardTitleContainer: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  roleCardSubtitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  roleUsersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderWidth: 0.5,
    minHeight: 70,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  userStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userRoleBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userRoleText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
  },
  userName: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footerLink: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
});

export default LoginScreen;
