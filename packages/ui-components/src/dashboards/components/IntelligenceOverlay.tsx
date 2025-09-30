/**
 * @cyntientops/ui-components
 * 
 * Intelligence Overlay - Full screen overlay for Intelligence panel content
 * Slides up from bottom, covers content but not header
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';

const { height } = Dimensions.get('window');

export interface IntelligenceOverlayProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  tabId: string;
}

export const IntelligenceOverlay: React.FC<IntelligenceOverlayProps> = ({
  visible,
  onClose,
  title,
  children,
  tabId,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // If swiped down significantly or with high velocity, close overlay
      if (translationY > 100 || velocityY > 500) {
        onClose();
      }
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <PanGestureHandler onHandlerStateChange={handleGestureEvent}>
        <View style={styles.overlayContent}>
          {/* Overlay Header */}
          <View style={styles.overlayHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.overlayTitle}>{title}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Overlay Content */}
          <View style={styles.overlayBody}>
            {children}
          </View>

          {/* Swipe Indicator */}
          <View style={styles.swipeIndicator}>
            <View style={styles.swipeHandle} />
          </View>
        </View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 80, // Start below header
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 1000,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.glass.regular,
  },
  headerLeft: {
    flex: 1,
  },
  overlayTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  overlayBody: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text.tertiary,
  },
});

export default IntelligenceOverlay;
