/**
 * 🌤️ Weather-Based Hybrid Card
 * Purpose: Intelligent weather-based task suggestions and building recommendations
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { WeatherSnapshot, OutdoorWorkRisk, NamedCoordinate, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface WeatherBasedHybridCardProps {
  weather: WeatherSnapshot;
  workerBuildings: NamedCoordinate[];
  todaysTasks: OperationalDataTaskAssignment[];
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onBuildingPress?: (building: NamedCoordinate) => void;
  isLoading?: boolean;
}

export interface WeatherSuggestion {
  id: string;
  type: 'indoor' | 'outdoor' | 'weather_sensitive';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  buildingId?: string;
  buildingName?: string;
  taskId?: string;
  icon: string;
  reason: string;
}

export const WeatherBasedHybridCard: React.FC<WeatherBasedHybridCardProps> = ({
  weather,
  workerBuildings,
  todaysTasks,
  onTaskPress,
  onBuildingPress,
  isLoading = false,
}) => {
  const [suggestions, setSuggestions] = useState<WeatherSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'indoor' | 'outdoor' | 'weather_sensitive'>('all');

  useEffect(() => {
    generateWeatherSuggestions();
  }, [weather, workerBuildings, todaysTasks]);

  const generateWeatherSuggestions = () => {
    const newSuggestions: WeatherSuggestion[] = [];
    
    // Analyze weather conditions
    const isRaining = weather.condition?.toLowerCase().includes('rain') || 
                     weather.condition?.toLowerCase().includes('drizzle') ||
                     weather.condition?.toLowerCase().includes('storm');
    const isSnowing = weather.condition?.toLowerCase().includes('snow');
    const isWindy = weather.windSpeed && weather.windSpeed > 15; // mph
    const isCold = weather.temperature && weather.temperature < 40; // fahrenheit
    const isHot = weather.temperature && weather.temperature > 85;
    const isHumid = weather.humidity && weather.humidity > 70;

    // Generate building-specific suggestions
    workerBuildings.forEach(building => {
      const buildingTasks = todaysTasks.filter(task => task.assigned_building_id === building.id);
      
      // Indoor task suggestions
      if (isRaining || isSnowing || isWindy || isCold) {
        buildingTasks.forEach(task => {
          if (isIndoorTask(task.category)) {
            newSuggestions.push({
              id: `indoor-${task.id}`,
              type: 'indoor',
              priority: 'high',
              title: `Indoor Task: ${task.name}`,
              description: `Perfect weather for indoor work at ${building.name}`,
              buildingId: building.id,
              buildingName: building.name,
              taskId: task.id,
              icon: '🏠',
              reason: getWeatherReason(isRaining, isSnowing, isWindy, isCold)
            });
          }
        });
      }

      // Outdoor task suggestions
      if (!isRaining && !isSnowing && !isWindy && !isCold && !isHot) {
        buildingTasks.forEach(task => {
          if (isOutdoorTask(task.category)) {
            newSuggestions.push({
              id: `outdoor-${task.id}`,
              type: 'outdoor',
              priority: 'medium',
              title: `Outdoor Task: ${task.name}`,
              description: `Great weather for outdoor work at ${building.name}`,
              buildingId: building.id,
              buildingName: building.name,
              taskId: task.id,
              icon: '🌤️',
              reason: 'Perfect outdoor conditions'
            });
          }
        });
      }

      // Weather-sensitive task suggestions
      if (isHot || isHumid) {
        buildingTasks.forEach(task => {
          if (isWeatherSensitiveTask(task.category)) {
            newSuggestions.push({
              id: `weather-${task.id}`,
              type: 'weather_sensitive',
              priority: 'high',
              title: `Weather Alert: ${task.name}`,
              description: `Consider timing for ${building.name} due to weather`,
              buildingId: building.id,
              buildingName: building.name,
              taskId: task.id,
              icon: '⚠️',
              reason: getWeatherSensitivityReason(isHot, isHumid)
            });
          }
        });
      }
    });

    // Add general weather recommendations
    if (isRaining || isSnowing) {
      newSuggestions.push({
        id: 'weather-general-1',
        type: 'weather_sensitive',
        priority: 'high',
        title: 'Weather Advisory',
        description: 'Focus on indoor tasks and building maintenance',
        icon: '🌧️',
        reason: 'Precipitation detected - prioritize indoor work'
      });
    }

    if (isHot) {
      newSuggestions.push({
        id: 'weather-general-2',
        type: 'weather_sensitive',
        priority: 'medium',
        title: 'Heat Advisory',
        description: 'Stay hydrated and take frequent breaks',
        icon: '🌡️',
        reason: 'High temperature - take safety precautions'
      });
    }

    setSuggestions(newSuggestions);
  };

  const isIndoorTask = (category: string): boolean => {
    const indoorCategories = [
      'cleaning', 'maintenance', 'repair', 'inspection', 
      'painting', 'electrical', 'plumbing', 'hvac'
    ];
    return indoorCategories.some(cat => category.toLowerCase().includes(cat));
  };

  const isOutdoorTask = (category: string): boolean => {
    const outdoorCategories = [
      'landscaping', 'exterior', 'roofing', 'gutter', 
      'sidewalk', 'parking', 'outdoor_cleaning'
    ];
    return outdoorCategories.some(cat => category.toLowerCase().includes(cat));
  };

  const isWeatherSensitiveTask = (category: string): boolean => {
    const weatherSensitiveCategories = [
      'painting', 'roofing', 'electrical', 'outdoor_cleaning',
      'landscaping', 'gutter', 'exterior'
    ];
    return weatherSensitiveCategories.some(cat => category.toLowerCase().includes(cat));
  };

  const getWeatherReason = (rain: boolean, snow: boolean, wind: boolean, cold: boolean): string => {
    if (rain) return 'Rainy conditions - perfect for indoor work';
    if (snow) return 'Snowy conditions - ideal for indoor tasks';
    if (wind) return 'Windy conditions - better to work indoors';
    if (cold) return 'Cold weather - focus on indoor maintenance';
    return 'Weather conditions favor indoor work';
  };

  const getWeatherSensitivityReason = (hot: boolean, humid: boolean): string => {
    if (hot && humid) return 'Hot and humid - plan work timing carefully';
    if (hot) return 'High temperature - consider early morning work';
    if (humid) return 'High humidity - take extra precautions';
    return 'Weather conditions require special attention';
  };

  const getFilteredSuggestions = (): WeatherSuggestion[] => {
    if (selectedCategory === 'all') return suggestions;
    return suggestions.filter(s => s.type === selectedCategory);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  const renderWeatherSummary = () => (
    <View style={styles.weatherSummary}>
      <View style={styles.weatherMain}>
        <Text style={styles.weatherIcon}>🌤️</Text>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTemp}>
            {weather.temperature ? `${Math.round(weather.temperature)}°F` : 'N/A'}
          </Text>
          <Text style={styles.weatherCondition}>
            {weather.condition || 'Unknown'}
          </Text>
        </View>
      </View>
      <View style={styles.weatherDetails}>
        <Text style={styles.weatherDetail}>
          💨 {weather.windSpeed ? `${weather.windSpeed} mph` : 'N/A'}
        </Text>
        <Text style={styles.weatherDetail}>
          💧 {weather.humidity ? `${weather.humidity}%` : 'N/A'}
        </Text>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      {(['all', 'indoor', 'outdoor', 'weather_sensitive'] as const).map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.activeCategoryButton,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.activeCategoryButtonText,
          ]}>
            {category.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSuggestion = (suggestion: WeatherSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => {
        if (suggestion.taskId) {
          const task = todaysTasks.find(t => t.id === suggestion.taskId);
          if (task) onTaskPress?.(task);
        } else if (suggestion.buildingId) {
          const building = workerBuildings.find(b => b.id === suggestion.buildingId);
          if (building) onBuildingPress?.(building);
        }
      }}
    >
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
        </View>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(suggestion.priority) }]} />
      </View>
      
      {suggestion.buildingName && (
        <Text style={styles.suggestionBuilding}>📍 {suggestion.buildingName}</Text>
      )}
      
      <Text style={styles.suggestionReason}>💡 {suggestion.reason}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🌤️</Text>
      <Text style={styles.emptyTitle}>No weather-based suggestions</Text>
      <Text style={styles.emptyDescription}>
        Current weather conditions don't require special task adjustments.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <GlassCard style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.blue} />
          <Text style={styles.loadingText}>Analyzing weather conditions...</Text>
        </View>
      </GlassCard>
    );
  }

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather-Based Recommendations</Text>
        <Text style={styles.subtitle}>Smart suggestions based on current conditions</Text>
      </View>

      {renderWeatherSummary()}
      {renderCategoryFilter()}

      <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
        {filteredSuggestions.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredSuggestions.map(renderSuggestion)
        )}
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  weatherSummary: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  weatherCondition: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherDetail: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  categoryFilter: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.glass.medium,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderWidth: 1,
    borderColor: Colors.primary.blue,
  },
  categoryButtonText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  suggestionBuilding: {
    ...Typography.caption,
    color: Colors.primary.blue,
    marginBottom: Spacing.xs,
  },
  suggestionReason: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
});

export default WeatherBasedHybridCard;
