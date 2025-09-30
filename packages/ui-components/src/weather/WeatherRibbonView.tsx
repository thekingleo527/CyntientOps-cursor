/**
 * 🌤️ Weather Ribbon View Component
 * Purpose: Compact weather information display with real-time updates
 * Features: Current conditions, forecast, alerts, location-based data
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from '../mocks/expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { WeatherSnapshot } from '@cyntientops/domain-schema';

const { width } = Dimensions.get('window');

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory' | 'emergency';
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

export interface WeatherRibbonViewProps {
  currentWeather: WeatherSnapshot;
  forecast?: WeatherForecast[];
  alerts?: WeatherAlert[];
  location?: string;
  onLocationPress?: () => void;
  onForecastPress?: (forecast: WeatherForecast) => void;
  onAlertPress?: (alert: WeatherAlert) => void;
  showForecast?: boolean;
  showAlerts?: boolean;
  compact?: boolean;
  style?: any;
}

export const WeatherRibbonView: React.FC<WeatherRibbonViewProps> = ({
  currentWeather,
  forecast = [],
  alerts = [],
  location,
  onLocationPress,
  onForecastPress,
  onAlertPress,
  showForecast = true,
  showAlerts = true,
  compact = false,
  style,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'current' | 'forecast' | 'alerts'>('current');
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Pulse animation for alerts
    if (alerts.length > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [alerts.length]);

  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: string } = {
      'sunny': '☀️',
      'clear': '☀️',
      'cloudy': '☁️',
      'overcast': '☁️',
      'rainy': '🌧️',
      'rain': '🌧️',
      'stormy': '⛈️',
      'thunderstorm': '⛈️',
      'snowy': '❄️',
      'snow': '❄️',
      'partly_cloudy': '⛅',
      'partly cloudy': '⛅',
      'foggy': '🌫️',
      'fog': '🌫️',
      'windy': '💨',
      'wind': '💨',
    };

    return iconMap[condition.toLowerCase()] || '❓';
  };

  const getWeatherColor = (condition: string) => {
    const colorMap: { [key: string]: string } = {
      'sunny': Colors.warning,
      'clear': Colors.warning,
      'cloudy': Colors.secondaryText,
      'overcast': Colors.secondaryText,
      'rainy': Colors.info,
      'rain': Colors.info,
      'stormy': Colors.error,
      'thunderstorm': Colors.error,
      'snowy': Colors.info,
      'snow': Colors.info,
      'partly_cloudy': Colors.info,
      'partly cloudy': Colors.info,
      'foggy': Colors.tertiaryText,
      'fog': Colors.tertiaryText,
      'windy': Colors.info,
      'wind': Colors.info,
    };

    return colorMap[condition.toLowerCase()] || Colors.info;
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'emergency': return Colors.error;
      case 'warning': return Colors.warning;
      case 'watch': return Colors.info;
      case 'advisory': return Colors.success;
      default: return Colors.secondaryText;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'warning': return '⚠️';
      case 'watch': return '👁️';
      case 'advisory': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderCurrentWeather = () => (
    <View style={styles.currentWeatherContainer}>
      <View style={styles.mainWeatherInfo}>
        <Text style={styles.weatherIcon}>{getWeatherIcon(currentWeather.condition)}</Text>
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>{currentWeather.temperature}°</Text>
          <Text style={styles.condition}>{currentWeather.description}</Text>
        </View>
      </View>

      <View style={styles.weatherDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{currentWeather.windSpeed} mph</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{formatTime(currentTime)}</Text>
        </View>
      </View>

      {location && (
        <TouchableOpacity style={styles.locationContainer} onPress={onLocationPress}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{location}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderForecast = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastContainer}>
      {forecast.map((day, index) => (
        <TouchableOpacity
          key={index}
          style={styles.forecastItem}
          onPress={() => onForecastPress?.(day)}
        >
          <Text style={styles.forecastDate}>{formatDate(new Date(day.date))}</Text>
          <Text style={styles.forecastIcon}>{getWeatherIcon(day.condition)}</Text>
          <View style={styles.forecastTemps}>
            <Text style={styles.forecastHigh}>{day.high}°</Text>
            <Text style={styles.forecastLow}>{day.low}°</Text>
          </View>
          <Text style={styles.forecastPrecip}>
            {day.precipitation > 0 ? `${day.precipitation}%` : '0%'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAlerts = () => (
    <View style={styles.alertsContainer}>
      {alerts.length === 0 ? (
        <Text style={styles.noAlertsText}>No weather alerts</Text>
      ) : (
        alerts.map((alert) => (
          <Animated.View
            key={alert.id}
            style={[
              styles.alertItem,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.alertContent, { borderLeftColor: getAlertColor(alert.type) }]}
              onPress={() => onAlertPress?.(alert)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={[styles.alertSeverity, { color: getAlertColor(alert.type) }]}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertDescription} numberOfLines={2}>
                {alert.description}
              </Text>
              <Text style={styles.alertTime}>
                Until {formatTime(alert.endTime)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </View>
  );

  if (compact) {
    return (
      <GlassCard style={[styles.compactContainer, style]} intensity="regular" cornerRadius="card">
        <LinearGradient
          colors={[Colors.glassOverlayLight, Colors.glassOverlayDark]}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            <Text style={styles.compactIcon}>{getWeatherIcon(currentWeather.condition)}</Text>
            <View style={styles.compactInfo}>
              <Text style={styles.compactTemperature}>{currentWeather.temperature}°</Text>
              <Text style={styles.compactCondition}>{currentWeather.description}</Text>
            </View>
            {alerts.length > 0 && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={styles.compactAlertIcon}>⚠️</Text>
              </Animated.View>
            )}
          </View>
        </LinearGradient>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={[styles.container, style]} intensity="regular" cornerRadius="card">
      <LinearGradient
        colors={[Colors.glassOverlayLight, Colors.glassOverlayDark]}
        style={styles.gradientBackground}
      >
        {/* Header with Tabs */}
        <View style={styles.header}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
              onPress={() => setSelectedTab('current')}
            >
              <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
                Current
              </Text>
            </TouchableOpacity>
            {showForecast && (
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'forecast' && styles.activeTab]}
                onPress={() => setSelectedTab('forecast')}
              >
                <Text style={[styles.tabText, selectedTab === 'forecast' && styles.activeTabText]}>
                  Forecast
                </Text>
              </TouchableOpacity>
            )}
            {showAlerts && (
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'alerts' && styles.activeTab]}
                onPress={() => setSelectedTab('alerts')}
              >
                <Text style={[styles.tabText, selectedTab === 'alerts' && styles.activeTabText]}>
                  Alerts {alerts.length > 0 && `(${alerts.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {selectedTab === 'current' && renderCurrentWeather()}
          {selectedTab === 'forecast' && renderForecast()}
          {selectedTab === 'alerts' && renderAlerts()}
        </View>
      </LinearGradient>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.md,
    overflow: 'hidden',
  },
  compactContainer: {
    margin: Spacing.sm,
    overflow: 'hidden',
  },
  gradientBackground: {
    padding: Spacing.md,
  },
  compactGradient: {
    padding: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.thin,
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primaryAction,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  content: {
    minHeight: 120,
  },
  currentWeatherContainer: {
    alignItems: 'center',
  },
  mainWeatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  temperatureContainer: {
    alignItems: 'center',
  },
  temperature: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    fontSize: 36,
  },
  condition: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.md,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  forecastContainer: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.thin,
    borderRadius: 8,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  forecastDate: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  forecastIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  forecastTemps: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  forecastHigh: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  forecastLow: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  forecastPrecip: {
    ...Typography.captionSmall,
    color: Colors.info,
  },
  alertsContainer: {
    flex: 1,
  },
  noAlertsText: {
    ...Typography.body,
    color: Colors.tertiaryText,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  alertItem: {
    marginBottom: Spacing.sm,
  },
  alertContent: {
    backgroundColor: Colors.thin,
    borderRadius: 8,
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  alertTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
    flex: 1,
  },
  alertSeverity: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  alertDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  alertTime: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactIcon: {
    fontSize: 24,
  },
  compactInfo: {
    flex: 1,
    alignItems: 'center',
  },
  compactTemperature: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  compactCondition: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  compactAlertIcon: {
    fontSize: 16,
  },
});

export default WeatherRibbonView;