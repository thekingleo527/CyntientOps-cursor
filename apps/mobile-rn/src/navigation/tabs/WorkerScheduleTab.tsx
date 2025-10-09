/**
 * @cyntientops/mobile-rn
 * 
 * Worker Schedule Tab - Enhanced with Weather Integration
 * Features: Today/Week/Routines with weather impact badges and forecast overlay
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius, TaskCard } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskService, TaskSchedule } from '@cyntientops/business-core';
import { WeatherRibbonView } from '@cyntientops/ui-components';
import { OperationalDataTaskAssignment, WeatherSnapshot, WeatherForecast } from '@cyntientops/domain-schema';
import { Logger } from '@cyntientops/business-core';

const { width } = Dimensions.get('window');

// Types
export interface WorkerScheduleTabProps {
  userId: string;
  userName: string;
  userRole: string;
}

export interface ScheduleSegment {
  id: 'today' | 'week' | 'routines';
  title: string;
  icon: string;
}

export interface WeatherImpact {
  taskId: string;
  impact: 'positive' | 'negative' | 'neutral';
  reason: string;
  recommendation: string;
}

const SCHEDULE_SEGMENTS: ScheduleSegment[] = [
  { id: 'today', title: 'Today', icon: '📅' },
  { id: 'week', title: 'Week', icon: '📊' },
  { id: 'routines', title: 'Routines', icon: '🔄' },
];

export const WorkerScheduleTab: React.FC<WorkerScheduleTabProps> = ({
  userId,
  userName,
}) => {
  const [activeSegment, setActiveSegment] = useState<'today' | 'week' | 'routines'>('today');
  const [taskSchedule, setTaskSchedule] = useState<TaskSchedule | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherSnapshot | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [weatherImpacts, setWeatherImpacts] = useState<WeatherImpact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clockInStatus, setClockInStatus] = useState<'in' | 'out'>('out');

  // Initialize data
  useEffect(() => {
    loadScheduleData();
    loadWeatherData();
  }, [userId]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadScheduleData();
      loadWeatherData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadScheduleData = async () => {
    try {
      const taskService = TaskService.getInstance();
      const schedule = taskService.generateWorkerTasks(userId);
      setTaskSchedule(schedule);
      
      // Generate weather impacts
      const impacts = generateWeatherImpacts(schedule.today, weatherData);
      setWeatherImpacts(impacts);
    } catch (error) {
      Logger.error('Failed to load schedule data:', undefined, 'WorkerScheduleTab.tsx');
    }
  };

  const loadWeatherData = async () => {
    try {
      // Mock weather data - in real app, fetch from weather service
      const mockWeather: WeatherSnapshot = {
        temperature: 72,
        humidity: 65,
        precipitationProbability: 30,
        windSpeed: 12,
        pressure: 30.1,
        visibility: 10,
        condition: 'partly_cloudy',
        timestamp: new Date(),
      };

      const mockForecast: WeatherForecast = {
        current: mockWeather,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          ...mockWeather,
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
          temperature: mockWeather.temperature + (Math.random() - 0.5) * 10,
        })),
        daily: Array.from({ length: 7 }, (_, i) => ({
          ...mockWeather,
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          temperature: mockWeather.temperature + (Math.random() - 0.5) * 15,
        })),
      };

      setWeatherData(mockWeather);
      setWeatherForecast(mockForecast);
    } catch (error) {
      Logger.error('Failed to load weather data:', undefined, 'WorkerScheduleTab.tsx');
    }
  };

  const generateWeatherImpacts = (
    tasks: OperationalDataTaskAssignment[],
    weather: WeatherSnapshot | null
  ): WeatherImpact[] => {
    if (!weather) return [];

    return tasks.map(task => {
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      let reason = '';
      let recommendation = '';

      // Rain impact
      if (weather.precipitationProbability > 50) {
        if (task.category.toLowerCase().includes('outdoor') || 
            task.category.toLowerCase().includes('cleaning')) {
          impact = 'negative';
          reason = 'High chance of rain';
          recommendation = 'Reschedule outdoor work or prepare rain gear';
        }
      }

      // Wind impact
      if (weather.windSpeed > 20) {
        if (task.category.toLowerCase().includes('ladder') || 
            task.category.toLowerCase().includes('height')) {
          impact = 'negative';
          reason = 'High wind conditions';
          recommendation = 'Avoid ladder work or use additional safety measures';
        }
      }

      // Temperature impact
      if (weather.temperature > 90) {
        if (task.category.toLowerCase().includes('outdoor')) {
          impact = 'negative';
          reason = 'Extreme heat conditions';
          recommendation = 'Schedule work during cooler hours';
        }
      }

      return {
        taskId: task.id,
        impact,
        reason,
        recommendation,
      };
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadScheduleData(), loadWeatherData()]);
    setRefreshing(false);
  };

  const handleClockIn = () => {
    setClockInStatus('in');
    // In real app, this would call the clock-in service
  };

  const handleClockOut = () => {
    setClockInStatus('out');
    // In real app, this would call the clock-out service
  };

  const renderSegmentButton = (segment: ScheduleSegment) => {
    const isActive = activeSegment === segment.id;
    
    return (
      <TouchableOpacity
        key={segment.id}
        style={[styles.segmentButton, isActive && styles.activeSegmentButton]}
        onPress={() => setActiveSegment(segment.id)}
      >
        <Text style={styles.segmentIcon}>{segment.icon}</Text>
        <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
          {segment.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatHour = (hour: number): string => {
    const taskService = TaskService.getInstance();
    return taskService.formatHour(hour);
  };

  const handleTaskComplete = (taskId: string) => {
    Logger.info(`Task completed: ${taskId}`, 'WorkerScheduleTab');
    // TODO: Implement task completion logic
  };

  const handleReportIssue = (taskId: string) => {
    Logger.info(`Issue reported for task: ${taskId}`, 'WorkerScheduleTab');
    // TODO: Implement issue reporting logic
  };

  const renderTaskCard = (task: OperationalDataTaskAssignment, status: 'now' | 'next' | 'today' | 'completed') => {
    const statusConfig = {
      now: { icon: '🟢', label: 'NOW', color: '#10b981' },
      next: { icon: '⏭️', label: 'NEXT', color: '#3b82f6' },
      today: { icon: '📋', label: 'TODAY', color: '#6b7280' },
      completed: { icon: '✅', label: 'COMPLETED', color: '#059669' }
    };

    const config = statusConfig[status];

    return (
      <TaskCard
        key={task.id}
        status={status}
        statusIcon={config.icon}
        statusLabel={config.label}
        statusColor={config.color}
        title={task.title}
        building={task.buildingName}
        timeRange={`${formatHour(task.metadata?.startHour || 0)} - ${formatHour(task.metadata?.endHour || 0)}`}
        duration={`${task.estimatedDuration} min`}
        category={task.category}
        skillLevel={task.skillLevel || 'Basic'}
        requiresPhoto={task.requiresPhoto}
        onPress={() => Logger.info(`Task pressed: ${task.id}`, 'WorkerScheduleTab')}
        onComplete={status === 'now' ? () => handleTaskComplete(task.id) : undefined}
        onIssue={status === 'now' ? () => handleReportIssue(task.id) : undefined}
      />
    );
  };

  const renderTodayView = () => {
    if (!taskSchedule) return null;

    return (
      <View style={styles.content}>
        {/* Clock In/Out Section */}
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.clockCard}
        >
          <View style={styles.clockHeader}>
            <Text style={styles.clockTitle}>Time Tracking</Text>
            <View style={[styles.clockStatus, { backgroundColor: clockInStatus === 'in' ? Colors.status.success : Colors.status.pending }]}>
              <Text style={styles.clockStatusText}>
                {clockInStatus === 'in' ? 'Clocked In' : 'Clocked Out'}
              </Text>
            </View>
          </View>

          <View style={styles.clockActions}>
            {clockInStatus === 'out' ? (
              <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn}>
                <LinearGradient
                  colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
                  style={styles.clockButtonGradient}
                >
                  <Text style={styles.clockButtonText}>Clock In</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut}>
                <Text style={styles.clockOutButtonText}>Clock Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Current Tasks - NOW */}
        {taskSchedule.now.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🟢 Happening Now</Text>
            {taskSchedule.now.map(task => renderTaskCard(task, 'now'))}
          </View>
        )}

        {/* Next Tasks - NEXT */}
        {taskSchedule.next.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏭️ Up Next</Text>
            {taskSchedule.next.map(task => renderTaskCard(task, 'next'))}
          </View>
        )}

        {/* All Today's Tasks - TODAY */}
        {taskSchedule.today.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 All Today's Tasks</Text>
            {taskSchedule.today.map(task => renderTaskCard(task, 'today'))}
          </View>
        )}

        {/* Completed Tasks */}
        {taskSchedule.completed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Completed</Text>
            {taskSchedule.completed.map(task => renderTaskCard(task, 'completed'))}
          </View>
        )}

        {/* No tasks message */}
        {taskSchedule.today.length === 0 && (
          <GlassCard
            intensity={GlassIntensity.thin}
            cornerRadius={CornerRadius.medium}
            style={styles.noTasksCard}
          >
            <Text style={styles.noTasksText}>No tasks scheduled for today</Text>
          </GlassCard>
        )}
      </View>
    );
  };

  const renderWeekView = () => {
    return (
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.weekCard}
        >
          <Text style={styles.comingSoonText}>Weekly calendar view coming soon</Text>
          <Text style={styles.comingSoonSubtext}>
            This will show your full week schedule with weather forecast overlay
          </Text>
        </GlassCard>
      </View>
    );
  };

  const renderRoutinesView = () => {
    return (
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recurring Routines</Text>
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.routinesCard}
        >
          <Text style={styles.comingSoonText}>Routine management coming soon</Text>
          <Text style={styles.comingSoonSubtext}>
            This will show all your recurring tasks and allow you to manage schedules
          </Text>
        </GlassCard>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeSegment) {
      case 'today':
        return renderTodayView();
      case 'week':
        return renderWeekView();
      case 'routines':
        return renderRoutinesView();
      default:
        return renderTodayView();
    }
  };

  return (
    <View style={styles.container}>
      {/* Weather Ribbon */}
      {weatherData && weatherForecast && (
        <WeatherRibbonView
          currentWeather={weatherData}
          forecast={weatherForecast}
          onWeatherAlert={(alert) => Logger.debug('Weather alert:', undefined, 'WorkerScheduleTab.tsx')}
          showHourlyForecast={true}
          showTaskImpacts={true}
          showWorkerGuidance={true}
          isCompact={false}
        />
      )}

      {/* Segment Control */}
      <View style={styles.segmentControl}>
        {SCHEDULE_SEGMENTS.map(renderSegmentButton)}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.worker.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.regular,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeSegmentButton: {
    backgroundColor: Colors.role.worker.primary,
  },
  segmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeSegmentText: {
    color: Colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  clockCard: {
    padding: 20,
    marginBottom: 20,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  clockStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clockStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  clockActions: {
    alignItems: 'center',
  },
  clockInButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  clockButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  clockButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  clockOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  clockOutButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  weekCard: {
    padding: 20,
    alignItems: 'center',
  },
  routinesCard: {
    padding: 20,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  noTasksCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTasksText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default WorkerScheduleTab;
