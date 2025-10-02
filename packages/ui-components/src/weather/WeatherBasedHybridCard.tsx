/**
 * 🌤️ Weather Based Hybrid Card
 * Purpose: Real-time weather-based task suggestions for worker dashboard
 * Features: Weather monitoring, intelligent task recommendations, proactive maintenance alerts
 * Context: Displays below hero cards on worker dashboard with weather-driven task suggestions
 */

import React from 'react';
const { useState, useEffect, useCallback } = React;
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Mock Animated for development
class MockAnimatedValue {
  _value: number;
  constructor(value: number) {
    this._value = value;
  }
  setValue = () => {};
  interpolate = () => this._value;
}

const Animated = {
  Value: MockAnimatedValue,
  timing: (value: any, config: any) => ({ start: () => {} }),
  parallel: (animations: any[]) => ({ start: () => {} }),
  sequence: (animations: any[]) => ({ start: () => {} }),
  View: View,
};
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { WeatherSnapshot, OperationalDataTaskAssignment, NamedCoordinate } from '@cyntientops/domain-schema';
// Mock WeatherAPIClient for development
interface WeatherAPIClient {
  getCurrentWeather(lat: number, lng: number): Promise<any>;
}

export interface WeatherBasedHybridCardProps {
  weather?: WeatherSnapshot;
  building?: NamedCoordinate;
  suggestedTasks?: OperationalDataTaskAssignment[];
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onWeatherPress?: () => void;
  onSuggestionPress?: (suggestion: WeatherSuggestion) => void;
  userRole?: string;
  currentLocation?: { latitude: number; longitude: number };
}

export interface WeatherSuggestion {
  id: string;
  type: WeatherSuggestionType;
  priority: WeatherSuggestionPriority;
  title: string;
  description: string;
  reasoning: string;
  estimatedDuration: number;
  weatherCondition: string;
  weatherImpact: WeatherImpact;
  actionable: boolean;
  category: string;
  buildingId?: string;
}

export interface WeatherImpact {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  urgency: 'immediate' | 'soon' | 'planned' | 'monitor';
  timeWindow: string;
}

export enum WeatherSuggestionType {
  PREVENTIVE_MAINTENANCE = 'preventive_maintenance',
  SAFETY_CHECK = 'safety_check',
  EMERGENCY_PREPARATION = 'emergency_preparation',
  DRAINAGE_CHECK = 'drainage_check',
  STRUCTURAL_INSPECTION = 'structural_inspection',
  // Weather-specific augmentation types
  PRE_RAIN_PREPARATION = 'pre_rain_preparation',
  POST_RAIN_CLEANUP = 'post_rain_cleanup',
  PRE_SNOW_PREPARATION = 'pre_snow_preparation',
  POST_SNOW_CLEANUP = 'post_snow_cleanup',
  WIND_SAFETY_CHECK = 'wind_safety_check',
  HEAT_WAVE_PREPARATION = 'heat_wave_preparation',
  COLD_SNAP_PREPARATION = 'cold_snap_preparation',
}

export enum WeatherSuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export const WeatherBasedHybridCard: React.FC<WeatherBasedHybridCardProps> = ({
  weather,
  building,
  suggestedTasks = [],
  onTaskPress,
  onWeatherPress,
  onSuggestionPress,
  userRole = 'worker',
  currentLocation,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherSnapshot | null>(weather || null);
  const [suggestions, setSuggestions] = useState<WeatherSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (weatherData) {
      generateWeatherSuggestions();
    }
  }, [weatherData, suggestedTasks, building]);

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const generateWeatherSuggestions = useCallback(() => {
    if (!weatherData) return;

    const newSuggestions: WeatherSuggestion[] = [];
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 6 && currentHour <= 18;

    // Enhanced Rain Intelligence - Pre/During/Post Rain Tasks
    if (weatherData.condition === 'rainy' || weatherData.condition === 'stormy') {
      // Pre-rain preparation (if rain is coming)
      if (weatherData.outdoorWorkRisk === 'medium' || weatherData.outdoorWorkRisk === 'high') {
        newSuggestions.push({
          id: 'pre-rain-mats',
          type: WeatherSuggestionType.PRE_RAIN_PREPARATION,
          priority: WeatherSuggestionPriority.HIGH,
          title: 'Put Out Rain Mats',
          description: 'Place rain mats at all building entrances before rain starts',
          reasoning: `Rain expected with ${weatherData.description}. Prevent water damage and slip hazards.`,
          estimatedDuration: 15,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'high',
            description: 'Prevents water damage and slip hazards',
            urgency: 'immediate',
            timeWindow: 'Next 2 hours',
          },
          actionable: true,
          category: 'Maintenance',
          buildingId: building?.id,
        });
      }

      // Post-rain cleanup (if rain just ended)
      if (weatherData.outdoorWorkRisk === 'low' && weatherData.condition === 'rainy') {
        newSuggestions.push({
          id: 'post-rain-cleanup',
          type: WeatherSuggestionType.POST_RAIN_CLEANUP,
          priority: WeatherSuggestionPriority.MEDIUM,
          title: 'Collect & Clean Rain Mats',
          description: 'Collect rain mats and clean them for next use',
          reasoning: 'Rain has ended, time to clean up and prepare for next weather event',
          estimatedDuration: 20,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'medium',
            description: 'Maintains cleanliness and prepares for next rain',
            urgency: 'planned',
            timeWindow: 'Next 4 hours',
          },
          actionable: true,
          category: 'Cleanup',
          buildingId: building?.id,
        });

        newSuggestions.push({
          id: 'check-water-damage',
          type: WeatherSuggestionType.STRUCTURAL_INSPECTION,
          priority: WeatherSuggestionPriority.HIGH,
          title: 'Check for Water Damage',
          description: 'Inspect building for any water damage or leaks',
          reasoning: 'Post-rain inspection to catch any issues early',
          estimatedDuration: 30,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'high',
            description: 'Early detection prevents costly repairs',
            urgency: 'soon',
            timeWindow: 'Next 2 hours',
          },
          actionable: true,
          category: 'Inspection',
          buildingId: building?.id,
        });
      }
    }

    // Enhanced Snow Intelligence - Pre/During/Post Snow Tasks
    if (weatherData.condition === 'snowy' || weatherData.condition === 'blizzard') {
      // Pre-snow preparation
      if (weatherData.outdoorWorkRisk === 'medium' || weatherData.outdoorWorkRisk === 'high') {
        newSuggestions.push({
          id: 'pre-snow-salt',
          type: WeatherSuggestionType.PRE_SNOW_PREPARATION,
          priority: WeatherSuggestionPriority.HIGH,
          title: 'Salt Sidewalks & Entrances',
          description: 'Apply salt to sidewalks and building entrances before snow starts',
          reasoning: `Snow expected with ${weatherData.description}. Prevent ice formation and slip hazards.`,
          estimatedDuration: 25,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'high',
            description: 'Prevents ice formation and slip hazards',
            urgency: 'soon',
            timeWindow: 'Next 2 hours',
          },
          actionable: true,
          category: 'Safety Preparation',
          buildingId: building?.id,
        });

        newSuggestions.push({
          id: 'check-snow-equipment',
          type: WeatherSuggestionType.PRE_SNOW_PREPARATION,
          priority: WeatherSuggestionPriority.MEDIUM,
          title: 'Check Snow Removal Equipment',
          description: 'Ensure shovels and snow removal equipment are ready',
          reasoning: 'Prepare equipment before snow starts for efficient cleanup',
          estimatedDuration: 10,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'medium',
            description: 'Ensures efficient snow removal',
            urgency: 'soon',
            timeWindow: 'Next 2 hours',
          },
          actionable: true,
          category: 'Equipment Check',
          buildingId: building?.id,
        });
      }

      // Post-snow cleanup (if snow just ended)
      if (weatherData.outdoorWorkRisk === 'low' && weatherData.condition === 'snowy') {
        newSuggestions.push({
          id: 'post-snow-shovel',
          type: WeatherSuggestionType.POST_SNOW_CLEANUP,
          priority: WeatherSuggestionPriority.HIGH,
          title: 'Shovel Sidewalks',
          description: 'Clear snow from sidewalks and building entrances',
          reasoning: 'Snow has ended, time to clear walkways for safety',
          estimatedDuration: 45,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'high',
            description: 'Ensures safe pedestrian access',
            urgency: 'immediate',
            timeWindow: 'Next 2 hours',
          },
          actionable: true,
          category: 'Snow Removal',
          buildingId: building?.id,
        });

        newSuggestions.push({
          id: 'post-snow-re-salt',
          type: WeatherSuggestionType.POST_SNOW_CLEANUP,
          priority: WeatherSuggestionPriority.MEDIUM,
          title: 'Re-salt if Needed',
          description: 'Apply additional salt if ice formation is detected',
          reasoning: 'Prevent ice formation after snow removal',
          estimatedDuration: 15,
          weatherCondition: weatherData.condition,
          weatherImpact: {
            level: 'medium',
            description: 'Prevents ice formation and slip hazards',
            urgency: 'soon',
            timeWindow: 'Next 4 hours',
          },
          actionable: true,
          category: 'Safety Maintenance',
          buildingId: building?.id,
        });
      }
    }

    // High wind suggestions
    if (weatherData.windSpeed > 25) {
      newSuggestions.push({
        id: 'wind_damage_check',
        type: WeatherSuggestionType.STRUCTURAL_INSPECTION,
        priority: WeatherSuggestionPriority.HIGH,
        title: 'Check for Wind Damage',
        description: 'Inspect building exterior for wind damage, loose items, and structural issues',
        reasoning: `High winds detected (${weatherData.windSpeed} mph). Check for damage and secure loose items.`,
        estimatedDuration: 40,
        weatherCondition: weatherData.condition,
        weatherImpact: {
          level: 'high',
          description: 'High winds can cause immediate damage',
          urgency: 'immediate',
          timeWindow: 'Next 2 hours',
        },
        actionable: true,
        category: 'Safety Inspection',
        buildingId: building?.id,
      });
    }

    setSuggestions(newSuggestions.slice(0, 3)); // Show top 3 suggestions
  }, [weatherData, building]);

  const getWeatherIcon = (condition: string): string => {
    const iconMap: Record<string, string> = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️',
      snowy: '❄️',
      partly_cloudy: '⛅',
    };
    return iconMap[condition] || '🌤️';
  };

  const getPriorityColor = (priority: WeatherSuggestionPriority): string => {
    const colorMap: Record<WeatherSuggestionPriority, string> = {
      [WeatherSuggestionPriority.LOW]: Colors.info,
      [WeatherSuggestionPriority.MEDIUM]: Colors.warning,
      [WeatherSuggestionPriority.HIGH]: Colors.primaryAction,
      [WeatherSuggestionPriority.URGENT]: Colors.error,
      [WeatherSuggestionPriority.CRITICAL]: Colors.role.admin.primary,
    };
    return colorMap[priority] || Colors.secondaryText;
  };

  const getUrgencyIcon = (urgency: string): string => {
    const iconMap: Record<string, string> = {
      immediate: '🚨',
      soon: '⏰',
      planned: '📅',
      monitor: '👁️',
    };
    return iconMap[urgency] || '📋';
  };

  const handleSuggestionPress = (suggestion: WeatherSuggestion) => {
    onSuggestionPress?.(suggestion);
  };

  const renderWeatherHeader = () => (
    <View style={styles.weatherHeader}>
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherIcon}>
          {weatherData ? getWeatherIcon(weatherData.condition) : '🌤️'}
        </Text>
        <View style={styles.weatherDetails}>
          <Text style={styles.weatherTemperature}>
            {weatherData ? `${weatherData.temperature}°F` : '--°F'}
          </Text>
          <Text style={styles.weatherCondition}>
            {weatherData ? weatherData.description : 'Loading...'}
          </Text>
          <Text style={styles.weatherLocation}>
            {building ? building.name : weatherData?.location || 'Current Location'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.expandButtonText}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeatherSuggestions = () => {
    if (suggestions.length === 0) {
      return (
        <View style={styles.noSuggestions}>
          <Text style={styles.noSuggestionsText}>
            No weather-based suggestions at this time
          </Text>
          <Text style={styles.noSuggestionsSubtext}>
            Weather conditions are normal for routine operations
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.suggestionsContainer,
          {
            height: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, suggestions.length * 120 + 20],
            }),
            opacity: animationValue,
          },
        ]}
      >
        <ScrollView
          style={styles.suggestionsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={[
                styles.suggestionCard,
                { borderLeftColor: getPriorityColor(suggestion.priority) },
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionTitleContainer}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <View style={styles.suggestionMeta}>
                    <Text style={styles.suggestionDuration}>
                      ⏱️ {suggestion.estimatedDuration} min
                    </Text>
                    <Text style={styles.suggestionCategory}>
                      📋 {suggestion.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.suggestionPriority}>
                  <Text style={styles.priorityText}>
                    {suggestion.priority.toUpperCase()}
                  </Text>
                  <Text style={styles.urgencyText}>
                    {getUrgencyIcon(suggestion.weatherImpact.urgency)} {suggestion.weatherImpact.urgency}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.suggestionDescription}>
                {suggestion.description}
              </Text>
              
              <View style={styles.suggestionReasoning}>
                <Text style={styles.reasoningLabel}>💡 Why now:</Text>
                <Text style={styles.reasoningText}>{suggestion.reasoning}</Text>
              </View>
              
              <View style={styles.suggestionImpact}>
                <Text style={styles.impactLabel}>
                  🌡️ Weather Impact: {suggestion.weatherImpact.level.toUpperCase()}
                </Text>
                <Text style={styles.impactDescription}>
                  {suggestion.weatherImpact.description}
                </Text>
                <Text style={styles.impactTimeWindow}>
                  ⏰ {suggestion.weatherImpact.timeWindow}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <GlassCard style={styles.container} intensity="regular" cornerRadius="card">
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onWeatherPress}
        activeOpacity={0.8}
      >
        {renderWeatherHeader()}
        {renderWeatherSuggestions()}
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.md,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  weatherDetails: {
    flex: 1,
  },
  weatherTemperature: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  weatherCondition: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  weatherLocation: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    marginTop: 2,
  },
  expandButton: {
    padding: Spacing.sm,
  },
  expandButtonText: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  suggestionsContainer: {
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionCard: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  suggestionTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  suggestionTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  suggestionMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  suggestionDuration: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: '500',
  },
  suggestionCategory: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '500',
  },
  suggestionPriority: {
    alignItems: 'flex-end',
  },
  priorityText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  urgencyText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  suggestionDescription: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  suggestionReasoning: {
    backgroundColor: Colors.background + '40',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reasoningLabel: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: '600',
    marginBottom: 2,
  },
  reasoningText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  suggestionImpact: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 8,
    padding: Spacing.sm,
  },
  impactLabel: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: 2,
  },
  impactDescription: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginBottom: 2,
  },
  impactTimeWindow: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: '500',
  },
  noSuggestions: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noSuggestionsText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  noSuggestionsSubtext: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    textAlign: 'center',
  },
});

export default WeatherBasedHybridCard;