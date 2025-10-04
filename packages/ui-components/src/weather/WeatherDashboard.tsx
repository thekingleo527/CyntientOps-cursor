/**
 * 🌤️ Comprehensive Weather Dashboard
 * Consolidates WeatherTasksSection and WeatherBasedHybridCard functionality
 * Purpose: Weather-aware task management and recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Building, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { WeatherAPIClient } from '@cyntientops/api-clients';
import { WeatherManager } from '@cyntientops/managers';

// MARK: - Interfaces

interface WeatherTask {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  weatherCondition: string;
  estimatedDuration: number; // minutes
  requiresOutdoorWork: boolean;
  weatherAdvice?: string;
  riskLevel: 'low' | 'medium' | 'high';
  equipment?: string[];
  recommendations?: string[];
}

interface WeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  safetyScore: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface WeatherDashboardProps {
  building: Building;
  onTaskTap: (task: WeatherTask) => void;
  weatherClient?: WeatherAPIClient;
  weatherManager?: WeatherManager;
}

// MARK: - Main Component

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  building,
  onTaskTap,
  weatherClient,
  weatherManager
}) => {
  const [weatherTasks, setWeatherTasks] = useState<WeatherTask[]>([]);
  const [weatherConditions, setWeatherConditions] = useState<WeatherConditions | null>(null);
  const [equipmentRecommendations, setEquipmentRecommendations] = useState<{
    equipment: string[];
    tasks: string[];
    recommendations: string[];
  }>({ equipment: [], tasks: [], recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize weather client and manager
  const client = weatherClient || new WeatherAPIClient();
  const manager = weatherManager || WeatherManager.getInstance();

  // MARK: - Effects

  useEffect(() => {
    loadWeatherData();
  }, [building]);

  useEffect(() => {
    // Set up weather monitoring
    manager.startWeatherMonitoring();
    
    return () => {
      manager.stopWeatherMonitoring();
    };
  }, [manager]);

  // MARK: - Data Loading

  const loadWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current weather conditions
      const currentWeather = await client.getCurrentWeather();
      const forecast = await client.getWeatherForecast(7);
      
      // Process weather conditions
      const conditions: WeatherConditions = {
        temperature: currentWeather.temperature,
        humidity: forecast[0]?.humidity || 50,
        windSpeed: currentWeather.windSpeed,
        precipitation: forecast[0]?.precipitation || 0,
        visibility: forecast[0]?.visibility || 10,
        safetyScore: calculateSafetyScore(currentWeather, forecast[0]),
        description: currentWeather.description,
        riskLevel: determineRiskLevel(currentWeather, forecast[0])
      };

      setWeatherConditions(conditions);

      // Get equipment recommendations
      const recommendations = await manager.getWeatherEquipmentRecommendations(forecast[0]);
      setEquipmentRecommendations(recommendations);

      // Generate weather-based tasks
      const tasks = await generateWeatherTasks(conditions, recommendations);
      setWeatherTasks(tasks);

    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [building, client, manager]);

  // MARK: - Helper Functions

  const calculateSafetyScore = (current: any, forecast: any): number => {
    let score = 100;
    const temp = current.temperature;
    const wind = current.windSpeed;
    const precip = forecast?.precipitation || 0;
    const visibility = forecast?.visibility || 10;

    // Temperature penalties
    if (temp < 32 || temp > 95) score -= 30;
    else if (temp < 40 || temp > 85) score -= 15;
    
    // Wind penalties
    if (wind > 25) score -= 25;
    else if (wind > 15) score -= 10;
    
    // Precipitation penalties
    if (precip > 0.5) score -= 40;
    else if (precip > 0.1) score -= 20;
    
    // Visibility penalties
    if (visibility < 1) score -= 50;
    else if (visibility < 3) score -= 25;

    return Math.max(0, score);
  };

  const determineRiskLevel = (current: any, forecast: any): 'low' | 'medium' | 'high' | 'extreme' => {
    const temp = current.temperature;
    const wind = current.windSpeed;
    const precip = forecast?.precipitation || 0;
    const visibility = forecast?.visibility || 10;

    if (temp < 20 || temp > 100 || wind > 30 || precip > 1 || visibility < 1) {
      return 'extreme';
    }
    if (temp < 32 || temp > 95 || wind > 25 || precip > 0.5 || visibility < 3) {
      return 'high';
    }
    if (temp < 40 || temp > 85 || wind > 15 || precip > 0.1 || visibility < 5) {
      return 'medium';
    }
    return 'low';
  };

  const generateWeatherTasks = async (conditions: WeatherConditions, recommendations: any): Promise<WeatherTask[]> => {
    const tasks: WeatherTask[] = [];

    // Rain-related tasks
    if (conditions.precipitation > 0.1) {
      tasks.push({
        id: 'rain_drain_check',
        name: 'Drain Inspection',
        description: 'Check and clear building drains to prevent flooding',
        category: 'Maintenance',
        priority: 'high',
        weatherCondition: 'Rain',
        estimatedDuration: 30,
        requiresOutdoorWork: true,
        weatherAdvice: 'Wear waterproof gear and use proper drainage tools',
        riskLevel: conditions.riskLevel,
        equipment: ['Drain Snake', 'Flashlight', 'Waterproof Gear'],
        recommendations: ['Check all drain covers', 'Clear debris from gutters', 'Test drainage flow']
      });

      if (conditions.precipitation > 0.5) {
        tasks.push({
          id: 'rain_mat_deployment',
          name: 'Rain Mat Deployment',
          description: 'Deploy rain mats at building entrances',
          category: 'Safety',
          priority: 'urgent',
          weatherCondition: 'Heavy Rain',
          estimatedDuration: 15,
          requiresOutdoorWork: true,
          weatherAdvice: 'Deploy immediately to prevent slip hazards',
          riskLevel: 'high',
          equipment: ['Rain Mats', 'Non-slip Signs'],
          recommendations: ['Place at all entrances', 'Secure mats properly', 'Monitor for wear']
        });
      }
    }

    // Clear weather tasks
    if (conditions.precipitation === 0 && conditions.visibility > 5) {
      tasks.push({
        id: 'curb_clearing',
        name: 'Curb Clearing',
        description: 'Clear curbs and gutters of debris',
        category: 'Cleaning',
        priority: 'medium',
        weatherCondition: 'Clear',
        estimatedDuration: 45,
        requiresOutdoorWork: true,
        weatherAdvice: 'Good conditions for outdoor cleaning work',
        riskLevel: 'low',
        equipment: ['Broom', 'Shovel', 'Trash Bags'],
        recommendations: ['Clear all debris', 'Check drainage', 'Dispose properly']
      });

      tasks.push({
        id: 'rain_mat_removal',
        name: 'Rain Mat Removal',
        description: 'Remove rain mats after weather clears',
        category: 'Safety',
        priority: 'medium',
        weatherCondition: 'Clear',
        estimatedDuration: 10,
        requiresOutdoorWork: true,
        weatherAdvice: 'Remove to prevent tripping hazards',
        riskLevel: 'low',
        equipment: ['Storage Bags'],
        recommendations: ['Clean and dry mats', 'Store properly', 'Check for damage']
      });
    }

    // Temperature-based tasks
    if (conditions.temperature < 32) {
      tasks.push({
        id: 'ice_treatment',
        name: 'Ice Treatment',
        description: 'Apply de-icing agents to sidewalks and entrances',
        category: 'Safety',
        priority: 'high',
        weatherCondition: 'Freezing',
        estimatedDuration: 60,
        requiresOutdoorWork: true,
        weatherAdvice: 'Apply before ice forms for best effectiveness',
        riskLevel: 'high',
        equipment: ['De-icing Salt', 'Spreader', 'Safety Gear'],
        recommendations: ['Apply to all walkways', 'Focus on entrances', 'Monitor effectiveness']
      });
    }

    if (conditions.temperature > 85) {
      tasks.push({
        id: 'heat_safety_check',
        name: 'Heat Safety Check',
        description: 'Check cooling systems and provide heat safety measures',
        category: 'Maintenance',
        priority: 'high',
        weatherCondition: 'Hot',
        estimatedDuration: 30,
        requiresOutdoorWork: false,
        weatherAdvice: 'Ensure cooling systems are functioning properly',
        riskLevel: 'medium',
        equipment: ['Thermometer', 'Cooling Supplies'],
        recommendations: ['Check AC systems', 'Provide cooling stations', 'Monitor temperatures']
      });
    }

    return tasks;
  };

  // MARK: - Event Handlers

  const handleTaskPress = useCallback((task: WeatherTask) => {
    onTaskTap(task);
  }, [onTaskTap]);

  const handleRefresh = useCallback(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // MARK: - Render Methods

  const renderWeatherConditions = () => {
    if (!weatherConditions) return null;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'extreme': return '#ff4444';
        case 'high': return '#ff8800';
        case 'medium': return '#ffaa00';
        default: return '#44aa44';
      }
    };

    return (
      <View style={styles.conditionsCard}>
        <Text style={styles.conditionsTitle}>Current Weather Conditions</Text>
        <View style={styles.conditionsGrid}>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Temperature</Text>
            <Text style={styles.conditionValue}>{weatherConditions.temperature}°F</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Wind Speed</Text>
            <Text style={styles.conditionValue}>{weatherConditions.windSpeed} mph</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Precipitation</Text>
            <Text style={styles.conditionValue}>{weatherConditions.precipitation}"</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Safety Score</Text>
            <Text style={[styles.conditionValue, { color: getRiskColor(weatherConditions.riskLevel) }]}>
              {weatherConditions.safetyScore}/100
            </Text>
          </View>
        </View>
        <Text style={styles.conditionsDescription}>{weatherConditions.description}</Text>
      </View>
    );
  };

  const renderEquipmentRecommendations = () => {
    if (equipmentRecommendations.equipment.length === 0) return null;

    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.recommendationsTitle}>Equipment Recommendations</Text>
        <View style={styles.equipmentList}>
          {equipmentRecommendations.equipment.map((item, index) => (
            <Text key={index} style={styles.equipmentItem}>• {item}</Text>
          ))}
        </View>
        {equipmentRecommendations.recommendations.length > 0 && (
          <View style={styles.recommendationsList}>
            <Text style={styles.recommendationsSubtitle}>Recommendations:</Text>
            {equipmentRecommendations.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWeatherTasks = () => {
    if (weatherTasks.length === 0) {
      return (
        <View style={styles.noTasksCard}>
          <Text style={styles.noTasksText}>No weather-specific tasks at this time</Text>
          <Text style={styles.noTasksSubtext}>Weather conditions are suitable for normal operations</Text>
        </View>
      );
    }

    return (
      <View style={styles.tasksCard}>
        <Text style={styles.tasksTitle}>Weather-Based Tasks</Text>
        {weatherTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskItem, { borderLeftColor: getPriorityColor(task.priority) }]}
            onPress={() => handleTaskPress(task)}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskPriority}>{task.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.taskDescription}>{task.description}</Text>
            <View style={styles.taskDetails}>
              <Text style={styles.taskDuration}>{task.estimatedDuration} min</Text>
              <Text style={styles.taskCondition}>{task.weatherCondition}</Text>
              <Text style={[styles.taskRisk, { color: getRiskColor(task.riskLevel) }]}>
                {task.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
            {task.weatherAdvice && (
              <Text style={styles.taskAdvice}>💡 {task.weatherAdvice}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      default: return '#44aa44';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff8800';
      default: return '#44aa44';
    }
  };

  // MARK: - Main Render

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderWeatherConditions()}
      {renderEquipmentRecommendations()}
      {renderWeatherTasks()}
    </ScrollView>
  );
};

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  conditionsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conditionItem: {
    width: '48%',
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  conditionsDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  equipmentList: {
    marginBottom: 12,
  },
  equipmentItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendationsList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  recommendationsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tasksCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  noTasksCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noTasksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noTasksSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  taskItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  taskPriority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskDuration: {
    fontSize: 12,
    color: '#666',
  },
  taskCondition: {
    fontSize: 12,
    color: '#666',
  },
  taskRisk: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskAdvice: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});

export default WeatherDashboard;
