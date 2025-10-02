/**
 * @cyntientops/mobile-rn
 * 
 * Weather Alert Banner - Global weather alerts and warnings
 * Features: Severity-based styling, auto-dismiss, actionable alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

const { width } = Dimensions.get('window');

// Types
export interface WeatherAlertBannerProps {
  alerts: string[];
  onAlertPress?: (alert: string) => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

export interface WeatherAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  type: 'warning' | 'advisory' | 'watch' | 'alert';
  expiresAt?: Date;
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  alerts,
  onAlertPress,
  autoDismiss = true,
  dismissDelay = 5000,
}) => {
  const [visible, setVisible] = useState(true);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));

  // Parse alerts into structured format
  const parsedAlerts: WeatherAlert[] = alerts.map((alert, index) => ({
    id: `alert_${index}`,
    message: alert,
    severity: getSeverityFromMessage(alert),
    type: getTypeFromMessage(alert),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  }));

  useEffect(() => {
    if (alerts.length === 0) {
      setVisible(false);
      return;
    }

    // Animate in
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [alerts]);

  // Auto-rotate through multiple alerts
  useEffect(() => {
    if (parsedAlerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % parsedAlerts.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [parsedAlerts.length]);

  const getSeverityFromMessage = (message: string): 'low' | 'medium' | 'high' | 'extreme' => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('extreme') || lowerMessage.includes('emergency')) {
      return 'extreme';
    }
    if (lowerMessage.includes('warning') || lowerMessage.includes('severe')) {
      return 'high';
    }
    if (lowerMessage.includes('advisory') || lowerMessage.includes('caution')) {
      return 'medium';
    }
    return 'low';
  };

  const getTypeFromMessage = (message: string): 'warning' | 'advisory' | 'watch' | 'alert' => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('warning')) return 'warning';
    if (lowerMessage.includes('advisory')) return 'advisory';
    if (lowerMessage.includes('watch')) return 'watch';
    return 'alert';
  };

  const getAlertColors = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return ['#FF3B30', '#FF6B6B'];
      case 'high':
        return ['#FF9500', '#FFB84D'];
      case 'medium':
        return ['#FFCC00', '#FFD93D'];
      case 'low':
        return ['#34C759', '#5ACF7A'];
      default:
        return ['#007AFF', '#4A9EFF'];
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'extreme') return '🚨';
    if (type === 'warning') return '⚠️';
    if (type === 'advisory') return 'ℹ️';
    if (type === 'watch') return '👁️';
    return '🌤️';
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleAlertPress = () => {
    if (onAlertPress && parsedAlerts[currentAlertIndex]) {
      onAlertPress(parsedAlerts[currentAlertIndex].message);
    }
  };

  if (!visible || parsedAlerts.length === 0) {
    return null;
  }

  const currentAlert = parsedAlerts[currentAlertIndex];
  const colors = getAlertColors(currentAlert.severity);
  const icon = getAlertIcon(currentAlert.type, currentAlert.severity);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handleAlertPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.alertInfo}>
              <Text style={styles.icon}>{icon}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.severity}>
                  {currentAlert.severity.toUpperCase()} {currentAlert.type.toUpperCase()}
                </Text>
                <Text style={styles.message}>{currentAlert.message}</Text>
              </View>
            </View>
            
            <View style={styles.actions}>
              {parsedAlerts.length > 1 && (
                <View style={styles.alertIndicator}>
                  <Text style={styles.alertCount}>
                    {currentAlertIndex + 1}/{parsedAlerts.length}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <Text style={styles.dismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  severity: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertCount: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});

export default WeatherAlertBanner;
