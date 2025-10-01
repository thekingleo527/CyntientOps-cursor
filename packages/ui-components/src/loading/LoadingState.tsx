/**
 * ⏳ LoadingState Component
 * Professional loading states with animations and context
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface LoadingStateProps {
  loading: boolean;
  error: Error | null;
  data: any;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * Wrapper component for handling loading, error, and empty states
 *
 * @example
 * <LoadingState
 *   loading={loading}
 *   error={error}
 *   data={buildings}
 *   loadingMessage="Loading buildings..."
 * >
 *   <BuildingList buildings={buildings} />
 * </LoadingState>
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  data,
  children,
  loadingMessage = 'Loading...',
  errorMessage,
  emptyMessage = 'No data available',
  onRetry,
  size = 'large',
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  // Loading state
  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator
          size={size}
          color={Colors.primary}
          style={styles.indicator}
        />
        <Text style={styles.message}>{loadingMessage}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={containerStyle}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>
          {errorMessage || error.message || 'Something went wrong'}
        </Text>
        {onRetry && (
          <Text style={styles.retryButton} onPress={onRetry}>
            Tap to retry
          </Text>
        )}
      </View>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <View style={containerStyle}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  // Success state - render children
  return <>{children}</>;
};

/**
 * Inline loading indicator (for buttons, etc.)
 */
export const InlineLoading: React.FC<{ loading: boolean; text?: string; color?: string }> = ({
  loading,
  text = 'Loading...',
  color = Colors.primary,
}) => {
  if (!loading) return null;

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color={color} />
      {text && <Text style={[styles.inlineText, { color }]}>{text}</Text>}
    </View>
  );
};

/**
 * Skeleton loader for content placeholders
 */
export const SkeletonLoader: React.FC<{ count?: number; height?: number }> = ({
  count = 3,
  height = 60,
}) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonItem,
            { height, marginBottom: index < count - 1 ? Spacing.md : 0 },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
  },
  indicator: {
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.status.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    ...Typography.body.medium,
    color: Colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inlineText: {
    ...Typography.body.small,
  },
  skeletonContainer: {
    padding: Spacing.md,
  },
  skeletonItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    opacity: 0.6,
  },
});

export default LoadingState;
