/**
 * 🌤️ Weather Tasks Section
 * Mirrors: CyntientOps/Components/Common/WeatherTasksSection.swift
 * Purpose: Weather-aware task generation and management
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Building, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { WeatherAPIClient } from '@cyntientops/api-clients';

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
}

interface WeatherTasksSectionProps {
  building: Building;
  onTaskTap: (task: WeatherTask) => void;
  weatherClient?: WeatherAPIClient;
}

export const WeatherTasksSection: React.FC<WeatherTasksSectionProps> = ({
  building,
  onTaskTap,
  weatherClient
}) => {
  const [weatherTasks, setWeatherTasks] = useState<WeatherTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string>('Unknown');

  useEffect(() => {
    loadWeatherTasks();
  }, [building.id]);

  const loadWeatherTasks = async () => {
    if (!weatherClient) {
      console.warn('Weather client not available');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current weather for building location
      const weatherData = await weatherClient.getCurrentWeather(
        building.latitude || 40.7128,
        building.longitude || -74.0060
      );
      
      setWeatherCondition(weatherData.condition);
      setLastUpdate(new Date());
      
      // Generate weather-appropriate tasks
      const tasks = generateWeatherTasks(weatherData, building);
      setWeatherTasks(tasks);
      
    } catch (error) {
      console.error('Failed to load weather tasks:', error);
      // Fallback to default tasks
      setWeatherTasks(generateDefaultTasks(building));
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeatherTasks = (weatherData: any, building: Building): WeatherTask[] => {
    const tasks: WeatherTask[] = [];
    const condition = weatherData.condition?.toLowerCase() || '';
    const temperature = weatherData.temperature || 20;
    const precipitation = weatherData.precipitation || 0;
    const windSpeed = weatherData.windSpeed || 0;

    // Rain-related tasks
    if (condition.includes('rain') || precipitation > 0) {
      tasks.push({
        id: 'weather-rain-1',
        name: 'Check Drainage Systems',
        description: 'Inspect and clear building drainage systems to prevent flooding',
        category: 'Maintenance',
        priority: 'high',
        weatherCondition: 'Rain',
        estimatedDuration: 30,
        requiresOutdoorWork: true,
        weatherAdvice: 'Wear waterproof gear and work in covered areas when possible',
        riskLevel: 'medium'
      });

      tasks.push({
        id: 'weather-rain-2',
        name: 'Inspect Roof Leaks',
        description: 'Check for potential roof leaks and water damage',
        category: 'Inspection',
        priority: 'urgent',
        weatherCondition: 'Rain',
        estimatedDuration: 45,
        requiresOutdoorWork: true,
        weatherAdvice: 'Use safety equipment and avoid working on wet surfaces',
        riskLevel: 'high'
      });
    }

    // Snow-related tasks
    if (condition.includes('snow') || temperature < 0) {
      tasks.push({
        id: 'weather-snow-1',
        name: 'Clear Snow and Ice',
        description: 'Remove snow and ice from building entrances and walkways',
        category: 'Maintenance',
        priority: 'urgent',
        weatherCondition: 'Snow',
        estimatedDuration: 60,
        requiresOutdoorWork: true,
        weatherAdvice: 'Use salt and proper snow removal equipment',
        riskLevel: 'medium'
      });

      tasks.push({
        id: 'weather-snow-2',
        name: 'Check Heating Systems',
        description: 'Verify heating systems are working properly during cold weather',
        category: 'Maintenance',
        priority: 'high',
        weatherCondition: 'Snow',
        estimatedDuration: 30,
        requiresOutdoorWork: false,
        weatherAdvice: 'Monitor temperature settings and check for efficiency',
        riskLevel: 'low'
      });
    }

    // High wind tasks
    if (windSpeed > 25) {
      tasks.push({
        id: 'weather-wind-1',
        name: 'Secure Loose Items',
        description: 'Secure or remove loose items that could become projectiles',
        category: 'Safety',
        priority: 'high',
        weatherCondition: 'High Wind',
        estimatedDuration: 20,
        requiresOutdoorWork: true,
        weatherAdvice: 'Avoid working in high wind conditions - postpone if necessary',
        riskLevel: 'high'
      });
    }

    // Hot weather tasks
    if (temperature > 30) {
      tasks.push({
        id: 'weather-heat-1',
        name: 'Check Air Conditioning',
        description: 'Verify AC systems are functioning properly in hot weather',
        category: 'Maintenance',
        priority: 'high',
        weatherCondition: 'Hot Weather',
        estimatedDuration: 45,
        requiresOutdoorWork: false,
        weatherAdvice: 'Monitor energy usage and ensure proper ventilation',
        riskLevel: 'low'
      });
    }

    // Default maintenance tasks (always available)
    if (tasks.length === 0) {
      tasks.push(...generateDefaultTasks(building));
    }

    return tasks;
  };

  const generateDefaultTasks = (building: Building): WeatherTask[] => {
    return [
      {
        id: 'weather-default-1',
        name: 'General Weather Inspection',
        description: 'Perform routine weather-related building inspection',
        category: 'Inspection',
        priority: 'medium',
        weatherCondition: 'Clear',
        estimatedDuration: 30,
        requiresOutdoorWork: true,
        weatherAdvice: 'Good weather for outdoor maintenance tasks',
        riskLevel: 'low'
      }
    ];
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatLastUpdate = (): string => {
    if (!lastUpdate) return '';
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🌤️</Text>
          <View>
            <Text style={styles.headerTitle}>Weather-Related Tasks</Text>
            <Text style={styles.weatherCondition}>{weatherCondition}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Updated {formatLastUpdate()}
            </Text>
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={loadWeatherTasks}>
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Checking weather conditions...</Text>
        </View>
      ) : weatherTasks.length === 0 ? (
        <View style={styles.noTasksContainer}>
          <Text style={styles.noTasksIcon}>☀️</Text>
          <Text style={styles.noTasksText}>No weather-related tasks needed</Text>
        </View>
      ) : (
        <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
          {weatherTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => onTaskTap(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{task.name}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.taskDescription}>{task.description}</Text>
              
              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Category:</Text>
                  <Text style={styles.metaValue}>{task.category}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Duration:</Text>
                  <Text style={styles.metaValue}>{task.estimatedDuration}m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Risk:</Text>
                  <Text style={[styles.metaValue, { color: getRiskColor(task.riskLevel) }]}>
                    {task.riskLevel.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              {task.weatherAdvice && (
                <View style={styles.adviceContainer}>
                  <Text style={styles.adviceIcon}>💡</Text>
                  <Text style={styles.adviceText}>{task.weatherAdvice}</Text>
                </View>
              )}
              
              <View style={styles.taskFooter}>
                <Text style={styles.weatherConditionText}>
                  Weather: {task.weatherCondition}
                </Text>
                {task.requiresOutdoorWork && (
                  <Text style={styles.outdoorWorkText}>Outdoor Work</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  weatherCondition: {
    color: '#3b82f6',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastUpdate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  refreshButton: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 16,
    color: '#3b82f6',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  noTasksContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noTasksIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noTasksText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  tasksList: {
    maxHeight: 400,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  adviceIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  adviceText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherConditionText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  outdoorWorkText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WeatherTasksSection;
