/**
 * 📱 Mobile Optimized Card
 * Purpose: Responsive card wrapper with mobile-first design
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isDesktop = screenWidth >= 1024;

export interface MobileOptimizedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  priority?: 'high' | 'medium' | 'low';
  compact?: boolean;
  fullWidth?: boolean;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  priority = 'medium',
  compact = isMobile,
  fullWidth = false,
}) => {
  const getCardSize = () => {
    if (compact) return 'compact';
    if (isTablet) return 'medium';
    return 'large';
  };

  const getCardPadding = () => {
    if (compact) return Spacing.sm;
    if (isTablet) return Spacing.md;
    return Spacing.lg;
  };

  const getCardMargin = () => {
    if (compact) return Spacing.xs;
    if (isTablet) return Spacing.sm;
    return Spacing.md;
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return Colors.status.error;
      case 'medium':
        return Colors.status.info;
      case 'low':
        return Colors.text.secondary;
      default:
        return Colors.primary;
    }
  };

  const renderContent = () => (
    <GlassCard 
      style={[
        styles.container,
        {
          padding: getCardPadding(),
          margin: getCardMargin(),
          width: fullWidth ? '100%' : undefined,
          minHeight: compact ? 120 : 160,
        }
      ]} 
      intensity={GlassIntensity.REGULAR} 
      cornerRadius={CornerRadius.CARD}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[
              styles.title,
              { fontSize: compact ? Typography.body.fontSize : Typography.titleMedium.fontSize }
            ]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[
              styles.subtitle,
              { fontSize: compact ? Typography.caption.fontSize : Typography.body.fontSize }
            ]}>
              {subtitle}
            </Text>
          )}
          {priority !== 'medium' && (
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
          )}
        </View>
      )}
      
      <View style={styles.content}>
        {children}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: Colors.glass.regular,
  },
  header: {
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  title: {
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.text.secondary,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
});

export default MobileOptimizedCard;

