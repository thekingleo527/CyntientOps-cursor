/**
 * 🛡️ Enhanced Error Boundary Component
 * Purpose: Comprehensive error handling with recovery mechanisms
 * Features: Error reporting, recovery options, graceful degradation
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';

interface Props {
  children: ReactNode;
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console and external service
    console.error(`Error in ${this.props.context || 'Unknown'}:`, error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (e.g., Sentry, Bugsnag)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, you would send this to your error tracking service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context,
        timestamp: new Date().toISOString(),
        userAgent: 'React Native',
        retryCount: this.state.retryCount,
      };
      
      console.log('Error Report:', errorReport);
      
      // Example: Send to error tracking service
      // ErrorTrackingService.captureException(error, { extra: errorReport });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleReload = () => {
    // In a real app, you might want to reload the entire app or specific module
    console.log('Reloading application...');
    // AppReloader.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <GlassCard intensity={GlassIntensity.medium} cornerRadius={CornerRadius.large} style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Something went wrong</Text>
              </View>

              <Text style={styles.errorMessage}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>

              {this.props.context && (
                <Text style={styles.errorContext}>
                  Context: {this.props.context}
                </Text>
              )}

              {this.props.showDetails && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.detailsTitle}>Error Details:</Text>
                  <Text style={styles.detailsText}>{this.state.error.stack}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                {this.state.retryCount < this.maxRetries && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={this.handleRetry}
                  >
                    <Text style={styles.actionButtonText}>
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={this.handleReset}
                >
                  <Text style={styles.actionButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.reloadButton]}
                  onPress={this.handleReload}
                >
                  <Text style={styles.actionButtonText}>Reload App</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.errorFooter}>
                <Text style={styles.footerText}>
                  If this problem persists, please contact support.
                </Text>
              </View>
            </GlassCard>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorCard: {
    padding: Spacing.xl,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorMessage: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  errorContext: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  errorDetails: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  detailsTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  detailsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: Colors.status.warning,
  },
  resetButton: {
    backgroundColor: Colors.status.info,
  },
  reloadButton: {
    backgroundColor: Colors.status.error,
  },
  actionButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  errorFooter: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});

export default EnhancedErrorBoundary;
