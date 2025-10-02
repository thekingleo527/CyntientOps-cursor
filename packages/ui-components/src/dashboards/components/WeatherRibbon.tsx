/**
 * @cyntientops/ui-components
 * 
 * Weather Ribbon Component
 * Mirrors Swift WeatherRibbon.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { WeatherSnapshot, OutdoorWorkRisk } from '@cyntientops/domain-schema';
import { APIClientManager } from '@cyntientops/api-clients';

export const WeatherRibbon: React.FC = () => {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      const apiManager = APIClientManager.getInstance();
      const weatherData = await apiManager.weather.getCurrentWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode: number) => {
    // Simplified weather icon mapping
    if (weatherCode === 0) return '☀️';
    if (weatherCode > 0 && weatherCode < 3) return '⛅';
    if (weatherCode >= 3 && weatherCode < 50) return '☁️';
    if (weatherCode >= 51 && weatherCode < 60) return '🌦️';
    if (weatherCode >= 61 && weatherCode < 70) return '🌧️';
    if (weatherCode >= 71 && weatherCode < 80) return '❄️';
    if (weatherCode >= 80 && weatherCode < 90) return '⛈️';
    if (weatherCode >= 90) return '⛈️';
    return '🌤️';
  };

  const getRiskColor = (risk: OutdoorWorkRisk) => {
    switch (risk) {
      case 'low':
        return Colors.status.success;
      case 'medium':
        return Colors.status.warning;
      case 'high':
        return Colors.status.error;
      default:
        return Colors.text.tertiary;
    }
  };

  const getRiskText = (risk: OutdoorWorkRisk) => {
    switch (risk) {
      case 'low':
        return 'Safe for outdoor work';
      case 'medium':
        return 'Caution for outdoor work';
      case 'high':
        return 'Avoid outdoor work';
      default:
        return 'Weather data unavailable';
    }
  };

  if (loading) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </GlassCard>
    );
  }

  if (!weather) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.errorText}>Weather data unavailable</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.weatherContent}>
        <View style={styles.weatherMain}>
          <Text style={styles.weatherIcon}>
            {getWeatherIcon(weather.weatherCode)}
          </Text>
          <View style={styles.weatherInfo}>
            <Text style={styles.temperature}>
              {Math.round(weather.temperature)}°F
            </Text>
            <Text style={styles.description}>
              {weather.description}
            </Text>
          </View>
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.windSpeed)} mph
            </Text>
          </View>
          
          <View style={styles.riskIndicator}>
            <View style={[
              styles.riskDot,
              { backgroundColor: getRiskColor(weather.outdoorWorkRisk) }
            ]} />
            <Text style={[
              styles.riskText,
              { color: getRiskColor(weather.outdoorWorkRisk) }
            ]}>
              {getRiskText(weather.outdoorWorkRisk)}
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
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
    fontSize: 32,
    marginRight: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    ...Typography.headlineSmall,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  detailItem: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
  detailValue: {
    ...Typography.labelMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  riskText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.status.error,
    textAlign: 'center',
  },
});
