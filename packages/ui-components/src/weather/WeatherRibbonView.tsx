/**
 * @cyntientops/ui-components
 * 
 * WeatherRibbonView - Animated Weather Display
 * Based on SwiftUI WeatherRibbonView.swift (298 lines)
 * Features: Animated weather display, hourly forecast, task impact indicators, worker guidance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity, 
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { WeatherSnapshot, WeatherForecast } from '@cyntientops/domain-schema';

const { width } = Dimensions.get('window');

// Types
export interface WeatherRibbonViewProps {
  currentWeather: WeatherSnapshot;
  forecast: WeatherForecast;
  onWeatherAlert: (alert: WeatherAlert) => void;
  showHourlyForecast?: boolean;
  showTaskImpacts?: boolean;
  showWorkerGuidance?: boolean;
  isCompact?: boolean;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'advisory' | 'watch';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedTasks: string[];
}

export interface TaskImpact {
  taskId: string;
  taskTitle: string;
  impact: 'positive' | 'negative' | 'neutral';
  reason: string;
  recommendation: string;
}

export interface WorkerGuidance {
  workerId: string;
  guidance: string;
  priority: 'low' | 'medium' | 'high';
  weatherCondition: string;
}

export interface WeatherRibbonState {
  isExpanded: boolean;
  currentHour: number;
  selectedHour: number | null;
  alerts: WeatherAlert[];
  taskImpacts: TaskImpact[];
  workerGuidance: WorkerGuidance[];
}

export const WeatherRibbonView: React.FC<WeatherRibbonViewProps> = ({
  currentWeather,
  forecast,
  onWeatherAlert,
  showHourlyForecast = true,
  showTaskImpacts = true,
  showWorkerGuidance = true,
  isCompact = false,
}) => {
  // State
  const [ribbonState, setRibbonState] = useState<WeatherRibbonState>({
    isExpanded: false,
    currentHour: new Date().getHours(),
    selectedHour: null,
    alerts: [],
    taskImpacts: [],
    workerGuidance: [],
  });

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-update current hour
  useEffect(() => {
    const interval = setInterval(() => {
      setRibbonState(prev => ({ ...prev, currentHour: new Date().getHours() }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate weather alerts
  useEffect(() => {
    const alerts = generateWeatherAlerts(currentWeather, forecast);
    setRibbonState(prev => ({ ...prev, alerts }));
    
    // Notify parent of new alerts
    alerts.forEach(alert => onWeatherAlert(alert));
  }, [currentWeather, forecast, onWeatherAlert]);

  // Generate task impacts
  useEffect(() => {
    if (showTaskImpacts) {
      const impacts = generateTaskImpacts(currentWeather, forecast);
      setRibbonState(prev => ({ ...prev, taskImpacts: impacts }));
    }
  }, [currentWeather, forecast, showTaskImpacts]);

  // Generate worker guidance
  useEffect(() => {
    if (showWorkerGuidance) {
      const guidance = generateWorkerGuidance(currentWeather, forecast);
      setRibbonState(prev => ({ ...prev, workerGuidance: guidance }));
    }
  }, [currentWeather, forecast, showWorkerGuidance]);

  // Toggle expansion
  const toggleExpansion = useCallback(() => {
    const toValue = ribbonState.isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: toValue * 200,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setRibbonState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, [ribbonState.isExpanded, expandAnim, slideAnim]);

  // Select hour
  const selectHour = useCallback((hour: number) => {
    setRibbonState(prev => ({ ...prev, selectedHour: hour }));
  }, []);

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    const icons = {
      'sunny': '☀️',
      'partly_cloudy': '⛅',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'stormy': '⛈️',
      'snowy': '❄️',
      'foggy': '🌫️',
      'windy': '💨',
    };
    return icons[condition as keyof typeof icons] || '🌤️';
  };

  // Get weather color
  const getWeatherColor = (condition: string) => {
    const colors = {
      'sunny': ['#FFD700', '#FFA500'],
      'partly_cloudy': ['#87CEEB', '#B0C4DE'],
      'cloudy': ['#708090', '#A9A9A9'],
      'rainy': ['#4682B4', '#5F9EA0'],
      'stormy': ['#2F4F4F', '#696969'],
      'snowy': ['#F0F8FF', '#E6E6FA'],
      'foggy': ['#D3D3D3', '#C0C0C0'],
      'windy': ['#20B2AA', '#48CAE4'],
    };
    return colors[condition as keyof typeof colors] || ['#87CEEB', '#B0C4DE'];
  };

  // Get alert color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  // Render hourly forecast
  const renderHourlyForecast = () => {
    if (!showHourlyForecast || !ribbonState.isExpanded) return null;

    return (
      <Animated.View
        style={[
          styles.hourlyForecast,
          {
            height: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 120],
            }),
            opacity: expandAnim,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {forecast.hourly.map((hour, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.hourItem,
                ribbonState.selectedHour === index && styles.selectedHourItem,
              ]}
              onPress={() => selectHour(index)}
            >
              <Text style={styles.hourText}>
                {new Date(hour.timestamp).getHours()}:00
              </Text>
              <Text style={styles.hourIcon}>
                {getWeatherIcon(hour.condition)}
              </Text>
              <Text style={styles.hourTemp}>
                {Math.round(hour.temperature)}°
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  // Render task impacts
  const renderTaskImpacts = () => {
    if (!showTaskImpacts || !ribbonState.isExpanded || ribbonState.taskImpacts.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.taskImpacts,
          {
            height: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 100],
            }),
            opacity: expandAnim,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Task Impacts</Text>
        {ribbonState.taskImpacts.slice(0, 3).map((impact, index) => (
          <View key={index} style={styles.impactItem}>
            <Text style={styles.impactTitle}>{impact.taskTitle}</Text>
            <Text style={styles.impactReason}>{impact.reason}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  // Render worker guidance
  const renderWorkerGuidance = () => {
    if (!showWorkerGuidance || !ribbonState.isExpanded || ribbonState.workerGuidance.length === 0) return null;

  return (
      <Animated.View
        style={[
          styles.workerGuidance,
          {
            height: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 80],
            }),
            opacity: expandAnim,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Worker Guidance</Text>
        {ribbonState.workerGuidance.slice(0, 2).map((guidance, index) => (
          <View key={index} style={styles.guidanceItem}>
            <Text style={styles.guidanceText}>{guidance.guidance}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={getWeatherColor(currentWeather.condition)}
        style={styles.weatherGradient}
      >
        <TouchableOpacity
          style={styles.weatherCard}
          onPress={toggleExpansion}
          activeOpacity={0.8}
        >
          {/* Main Weather Display */}
          <View style={styles.mainWeather}>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherIcon}>
                {getWeatherIcon(currentWeather.condition)}
              </Text>
              <View style={styles.weatherDetails}>
                <Text style={styles.temperature}>
                  {Math.round(currentWeather.temperature)}°
                </Text>
                <Text style={styles.condition}>
                  {currentWeather.condition.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherStats}>
              <Text style={styles.statText}>
                💧 {currentWeather.humidity}%
              </Text>
              <Text style={styles.statText}>
                💨 {currentWeather.windSpeed} mph
              </Text>
              <Text style={styles.statText}>
                👁️ {currentWeather.visibility} mi
                  </Text>
            </View>
          </View>

          {/* Weather Alerts */}
          {ribbonState.alerts.length > 0 && (
            <Animated.View
              style={[
                styles.alertsContainer,
                {
                  opacity: pulseAnim,
                },
              ]}
            >
              {ribbonState.alerts.slice(0, 2).map((alert, index) => (
                <View
                  key={alert.id}
                style={[
                    styles.alertBadge,
                    { backgroundColor: getAlertColor(alert.severity) },
                ]}
              >
                  <Text style={styles.alertText}>
                    ⚠️ {alert.title}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Expansion Indicator */}
          <Animated.View
            style={[
              styles.expandIndicator,
              {
                transform: [
                  {
                    rotate: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.expandIcon}>▼</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {renderHourlyForecast()}
        {renderTaskImpacts()}
        {renderWorkerGuidance()}
      </LinearGradient>
    </Animated.View>
  );
};

// Helper functions
const generateWeatherAlerts = (current: WeatherSnapshot, forecast: WeatherForecast): WeatherAlert[] => {
  const alerts: WeatherAlert[] = [];

  // Temperature alerts
  if (current.temperature > 95) {
    alerts.push({
      id: `heat_${Date.now()}`,
      type: 'warning',
      severity: 'high',
      title: 'Heat Warning',
      description: 'Extreme heat conditions detected',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      affectedTasks: [],
    });
  }

  if (current.temperature < 32) {
    alerts.push({
      id: `freeze_${Date.now()}`,
      type: 'warning',
      severity: 'high',
      title: 'Freeze Warning',
      description: 'Freezing temperatures detected',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      affectedTasks: [],
    });
  }

  // Wind alerts
  if (current.windSpeed > 25) {
    alerts.push({
      id: `wind_${Date.now()}`,
      type: 'advisory',
      severity: 'medium',
      title: 'Wind Advisory',
      description: 'High wind conditions',
      startTime: new Date(),
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      affectedTasks: [],
    });
  }

  // Precipitation alerts
  if (current.precipitationProbability > 70) {
    alerts.push({
      id: `rain_${Date.now()}`,
      type: 'advisory',
      severity: 'medium',
      title: 'Rain Advisory',
      description: 'High chance of precipitation',
      startTime: new Date(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      affectedTasks: [],
    });
  }

  return alerts;
};

const generateTaskImpacts = (current: WeatherSnapshot, forecast: WeatherForecast): TaskImpact[] => {
  const impacts: TaskImpact[] = [];

  // Rain impact
  if (current.precipitationProbability > 50) {
    impacts.push({
      taskId: 'outdoor_tasks',
      taskTitle: 'Outdoor Tasks',
      impact: 'negative',
      reason: 'High chance of rain',
      recommendation: 'Reschedule outdoor work or prepare rain gear',
    });
  }

  // Wind impact
  if (current.windSpeed > 20) {
    impacts.push({
      taskId: 'ladder_work',
      taskTitle: 'Ladder Work',
      impact: 'negative',
      reason: 'High wind conditions',
      recommendation: 'Avoid ladder work or use additional safety measures',
    });
  }

  // Temperature impact
  if (current.temperature > 90) {
    impacts.push({
      taskId: 'outdoor_maintenance',
      taskTitle: 'Outdoor Maintenance',
      impact: 'negative',
      reason: 'Extreme heat conditions',
      recommendation: 'Schedule work during cooler hours',
    });
  }

  return impacts;
};

const generateWorkerGuidance = (current: WeatherSnapshot, forecast: WeatherForecast): WorkerGuidance[] => {
  const guidance: WorkerGuidance[] = [];

  // Heat guidance
  if (current.temperature > 85) {
    guidance.push({
      workerId: 'all',
      guidance: 'Stay hydrated and take frequent breaks in shaded areas',
      priority: 'high',
      weatherCondition: 'heat',
    });
  }

  // Rain guidance
  if (current.precipitationProbability > 60) {
    guidance.push({
      workerId: 'all',
      guidance: 'Wear appropriate rain gear and be cautious of slippery surfaces',
      priority: 'medium',
      weatherCondition: 'rain',
    });
  }

  // Wind guidance
  if (current.windSpeed > 15) {
    guidance.push({
      workerId: 'all',
      guidance: 'Secure loose items and avoid working at heights',
      priority: 'medium',
      weatherCondition: 'wind',
    });
  }

  return guidance;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  weatherGradient: {
    borderRadius: 16,
  },
  weatherCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainWeather: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  weatherDetails: {
    flex: 1,
  },
  temperature: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  condition: {
    fontSize: 14,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  weatherStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginBottom: 2,
  },
  alertsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  expandIndicator: {
    marginLeft: 12,
  },
  expandIcon: {
    fontSize: 16,
    color: Colors.text.inverse,
    opacity: 0.7,
  },
  hourlyForecast: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  hourItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedHourItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  hourText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  hourIcon: {
    fontSize: 20,
    marginVertical: 4,
  },
  hourTemp: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  taskImpacts: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginBottom: 8,
  },
  impactItem: {
    marginBottom: 4,
  },
  impactTitle: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  impactReason: {
    fontSize: 11,
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  workerGuidance: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  guidanceItem: {
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 12,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
});

export default WeatherRibbonView;