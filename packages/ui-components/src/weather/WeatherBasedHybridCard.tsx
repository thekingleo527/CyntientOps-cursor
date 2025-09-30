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

    // Rain-based suggestions
    if (weatherData.condition === 'rainy' || weatherData.condition === 'stormy') {
      newSuggestions.push({
        id: 'drainage_check_rain',
        type: WeatherSuggestionType.DRAINAGE_CHECK,
        priority: WeatherSuggestionPriority.HIGH,
        title: 'Check Roof Drains & Gutters',
        description: 'Inspect and clear roof drains, gutters, and downspouts to prevent water damage',
        reasoning: `It's currently ${weatherData.condition} with ${weatherData.description}. Ensure proper drainage to prevent water accumulation.`,
        estimatedDuration: 30,
        weatherCondition: weatherData.condition,
        weatherImpact: {
          level: 'high',
          description: 'Active rain requires immediate drainage attention',
          urgency: 'immediate',
          timeWindow: 'Next 2 hours',
        },
        actionable: true,
        category: 'Maintenance',
        buildingId: building?.id,
      });
    }

    // Snow-based suggestions
    if (weatherData.condition === 'snowy' || weatherData.condition === 'blizzard') {
      newSuggestions.push({
        id: 'snow_removal_prep',
        type: WeatherSuggestionType.EMERGENCY_PREPARATION,
        priority: WeatherSuggestionPriority.URGENT,
        title: 'Prepare Snow Removal Equipment',
        description: 'Check and prepare snow removal equipment for immediate use',
        reasoning: `Snow conditions detected: ${weatherData.description}. Prepare equipment for snow removal operations.`,
        estimatedDuration: 45,
        weatherCondition: weatherData.condition,
        weatherImpact: {
          level: 'critical',
          description: 'Snow accumulation requires immediate response',
          urgency: 'immediate',
          timeWindow: 'Next 1 hour',
        },
        actionable: true,
        category: 'Emergency Response',
        buildingId: building?.id,
      });
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