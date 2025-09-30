/**
 * 🌤️ Weather Ribbon View
 * Mirrors: CyntientOps/Components/Weather/WeatherRibbonView.swift
 * Purpose: Weather display with task recommendations and outdoor work adjustments
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { WeatherSnapshot, OutdoorWorkRisk } from '@cyntientops/domain-schema';

export interface WeatherRibbonViewProps {
  weather?: WeatherSnapshot;
  onWeatherPress?: () => void;
  onTaskRecommendationPress?: (recommendation: WeatherRecommendation) => void;
  isLoading?: boolean;
  showRecommendations?: boolean;
  compact?: boolean;
}

export interface WeatherRecommendation {
  id: string;
  type: 'indoor' | 'outdoor' | 'postpone' | 'equipment';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  taskIds?: string[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  weatherCode: number;
  description: string;
  windSpeed: number;
  humidity: number;
  precipitation: {
    probability: number;
    amount: number;
  };
  outdoorWorkRisk: OutdoorWorkRisk;
  recommendations: string[];
}

const WeatherRibbonView: React.FC<WeatherRibbonViewProps> = ({
  weather,
  onWeatherPress,
  onTaskRecommendationPress,
  isLoading = false,
  showRecommendations = true,
  compact = false
}) => {
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);

  useEffect(() => {
    if (weather) {
      generateWeatherRecommendations();
    }
  }, [weather]);

  const generateWeatherRecommendations = () => {
    if (!weather) return;

    const newRecommendations: WeatherRecommendation[] = [];

    // Generate recommendations based on weather conditions
    if (weather.outdoorWorkRisk === 'high') {
      newRecommendations.push({
        id: 'postpone_outdoor',
        type: 'postpone',
        title: 'Postpone Outdoor Tasks',
        description: 'High risk conditions detected. Consider rescheduling outdoor work.',
        priority: 'high',
        taskIds: [] // TODO: Get actual outdoor task IDs
      });
    }

    if (weather.temperature < 32 || weather.temperature > 95) {
      newRecommendations.push({
        id: 'temperature_equipment',
        type: 'equipment',
        title: 'Special Equipment Needed',
        description: 'Extreme temperatures require additional safety equipment.',
        priority: 'medium',
        taskIds: []
      });
    }

    if (weather.windSpeed > 25) {
      newRecommendations.push({
        id: 'wind_safety',
        type: 'equipment',
        title: 'High Wind Safety',
        description: 'Strong winds detected. Secure equipment and use extra caution.',
        priority: 'medium',
        taskIds: []
      });
    }

    if (weather.outdoorWorkRisk === 'low' && weather.temperature >= 50 && weather.temperature <= 85) {
      newRecommendations.push({
        id: 'ideal_outdoor',
        type: 'outdoor',
        title: 'Ideal Outdoor Conditions',
        description: 'Perfect weather for outdoor tasks. Consider prioritizing outdoor work.',
        priority: 'low',
        taskIds: []
      });
    }

    setRecommendations(newRecommendations);
  };

  const getWeatherIcon = (weatherCode: number) => {
    // OpenMeteo weather code mapping
    if (weatherCode === 0) return '☀️'; // Clear sky
    if (weatherCode <= 3) return '⛅'; // Partly cloudy
    if (weatherCode <= 48) return '☁️'; // Cloudy
    if (weatherCode <= 67) return '🌧️'; // Rain
    if (weatherCode <= 77) return '🌨️'; // Snow
    if (weatherCode <= 82) return '🌧️'; // Rain showers
    if (weatherCode <= 86) return '🌨️'; // Snow showers
    if (weatherCode <= 99) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  const getRiskColor = (risk: OutdoorWorkRisk) => {
    switch (risk) {
      case 'low': return Colors.status.success;
      case 'medium': return Colors.status.warning;
      case 'high': return Colors.status.error;
      default: return Colors.text.tertiary;
    }
  };

  const getRiskText = (risk: OutdoorWorkRisk) => {
    switch (risk) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      default: return 'Unknown';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'indoor': return '🏠';
      case 'outdoor': return '🌳';
      case 'postpone': return '⏰';
      case 'equipment': return '🛡️';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.info;
      default: return Colors.text.tertiary;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onWeatherPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.text.primary} />
        ) : weather ? (
          <View style={styles.compactContent}>
            <Text style={styles.compactIcon}>
              {getWeatherIcon(weather.weatherCode)}
            </Text>
            <View style={styles.compactTextContainer}>
              <Text style={styles.compactTemperature}>
                {weather.temperature}°F
              </Text>
              <Text style={styles.compactDescription}>
                {weather.description}
              </Text>
            </View>
            <View style={[
              styles.compactRiskBadge,
              { backgroundColor: getRiskColor(weather.outdoorWorkRisk) }
            ]}>
              <Text style={styles.compactRiskText}>
                {getRiskText(weather.outdoorWorkRisk)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.compactNoData}>No weather data</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <TouchableOpacity
        style={styles.weatherHeader}
        onPress={onWeatherPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.blue} />
            <Text style={styles.loadingText}>Loading weather...</Text>
          </View>
        ) : weather ? (
          <View style={styles.weatherContent}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherIcon}>
                {getWeatherIcon(weather.weatherCode)}
              </Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.temperature}>
                  {weather.temperature}°F
                </Text>
                <Text style={styles.description}>
                  {weather.description}
                </Text>
                <Text style={styles.timestamp}>
                  Updated {weather.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{weather.windSpeed} mph</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Risk</Text>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskColor(weather.outdoorWorkRisk) }
                ]}>
                  <Text style={styles.riskText}>
                    {getRiskText(weather.outdoorWorkRisk)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>🌤️</Text>
            <Text style={styles.noDataText}>Weather data unavailable</Text>
          </View>
        )}
      </TouchableOpacity>

      {showRecommendations && recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Weather Recommendations</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.recommendationsScroll}
          >
            {recommendations.map((recommendation) => (
              <TouchableOpacity
                key={recommendation.id}
                style={[
                  styles.recommendationCard,
                  { borderLeftColor: getPriorityColor(recommendation.priority) }
                ]}
                onPress={() => onTaskRecommendationPress?.(recommendation)}
              >
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationIcon}>
                    {getRecommendationIcon(recommendation.type)}
                  </Text>
                  <View style={[
                    styles.priorityIndicator,
                    { backgroundColor: getPriorityColor(recommendation.priority) }
                  ]} />
                </View>
                <Text style={styles.recommendationTitle} numberOfLines={1}>
                  {recommendation.title}
                </Text>
                <Text style={styles.recommendationDescription} numberOfLines={2}>
                  {recommendation.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {weather && (
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>3-Day Forecast</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.forecastScroll}
          >
            {forecast.slice(0, 3).map((day, index) => (
              <View key={index} style={styles.forecastDay}>
                <Text style={styles.forecastDate}>
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={styles.forecastIcon}>
                  {getWeatherIcon(day.weatherCode)}
                </Text>
                <Text style={styles.forecastTemp}>
                  {day.temperature.max}°/{day.temperature.min}°
                </Text>
                <View style={[
                  styles.forecastRisk,
                  { backgroundColor: getRiskColor(day.outdoorWorkRisk) }
                ]}>
                  <Text style={styles.forecastRiskText}>
                    {getRiskText(day.outdoorWorkRisk)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  // Main Container Styles
  container: {
    margin: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 16,
  },
  
  // Weather Header Styles
  weatherHeader: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  description: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  detailItem: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  riskText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },

  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  noDataIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  noDataText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },

  // Recommendations Styles
  recommendationsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.medium,
  },
  recommendationsTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  recommendationsScroll: {
    marginHorizontal: -Spacing.sm,
  },
  recommendationCard: {
    width: 160,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recommendationIcon: {
    fontSize: 20,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recommendationTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  recommendationDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    lineHeight: 16,
  },

  // Forecast Styles
  forecastContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.medium,
  },
  forecastTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  forecastScroll: {
    marginHorizontal: -Spacing.sm,
  },
  forecastDay: {
    width: 80,
    alignItems: 'center',
    padding: Spacing.sm,
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
  },
  forecastDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  forecastIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  forecastTemp: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  forecastRisk: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  forecastRiskText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 8,
  },

  // Compact Mode Styles
  compactContainer: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glass.medium,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTemperature: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  compactDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  compactRiskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  compactRiskText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  compactNoData: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default WeatherRibbonView;
