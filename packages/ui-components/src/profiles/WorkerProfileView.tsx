/**
 * 👷 Worker Profile View
 * Purpose: Comprehensive worker profile with calendar, time-off, and QuickBooks integration
 * Design: Elegant, non-bloated, with smart navigation and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { 
  WorkerProfile, 
  TimeOffRequest, 
  CalendarEvent,
  TimesheetEntry,
  PerformanceGoal
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface WorkerProfileViewProps {
  workerId: string;
  onEditProfile?: () => void;
  onRequestTimeOff?: () => void;
  onViewTimesheet?: () => void;
  onViewPerformance?: () => void;
  onViewCalendar?: () => void;
}

export enum ProfileTab {
  OVERVIEW = 'overview',
  CALENDAR = 'calendar',
  TIME_OFF = 'time_off',
  TIMESHEET = 'timesheet',
  PERFORMANCE = 'performance'
}

export const WorkerProfileView: React.FC<WorkerProfileViewProps> = ({
  workerId,
  onEditProfile,
  onRequestTimeOff,
  onViewTimesheet,
  onViewPerformance,
  onViewCalendar
}) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [selectedTab, setSelectedTab] = useState<ProfileTab>(ProfileTab.OVERVIEW);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadWorkerProfile();
  }, [workerId]);

  const loadWorkerProfile = async () => {
    try {
      setIsLoading(true);
      const workerData = services.workers.getWorkerById(workerId);
      setWorker(workerData);
    } catch (error) {
      console.error('Error loading worker profile:', error);
      Alert.alert('Error', 'Failed to load worker profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkerProfile();
    setIsRefreshing(false);
  };

  const renderTabButton = (tab: ProfileTab, title: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        selectedTab === tab && styles.selectedTabButton,
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text
        style={[
          styles.tabButtonText,
          selectedTab === tab && styles.selectedTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => {
    if (!worker) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <GlassCard style={styles.profileHeader} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <View style={styles.profileInfo}>
            {worker.profile.avatar ? (
              <Image source={{ uri: worker.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {worker.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.profileDetails}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerPosition}>{worker.profile.position}</Text>
              <Text style={styles.workerDepartment}>{worker.profile.department}</Text>
              <Text style={styles.workerRate}>${worker.profile.hourlyRate}/hour</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{worker.performance.metrics.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(worker.performance.metrics.onTimeRate)}%</Text>
              <Text style={styles.statLabel}>On-Time Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{worker.performance.metrics.customerRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Customer Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{worker.timeOff.availableDays}</Text>
              <Text style={styles.statLabel}>Days Off Available</Text>
            </View>
          </View>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard style={styles.activityCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {worker.calendar.upcomingEvents.slice(0, 3).map(event => (
              <View key={event.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>
                    {event.type === 'task' ? '📋' : 
                     event.type === 'meeting' ? '👥' : 
                     event.type === 'training' ? '🎓' : '📅'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{event.title}</Text>
                  <Text style={styles.activityDate}>
                    {event.startDate.toLocaleDateString()} at {event.startDate.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard style={styles.actionsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={onRequestTimeOff}>
              <Text style={styles.actionIcon}>🏖️</Text>
              <Text style={styles.actionText}>Request Time Off</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onViewTimesheet}>
              <Text style={styles.actionIcon}>⏰</Text>
              <Text style={styles.actionText}>View Timesheet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onViewPerformance}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Performance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onViewCalendar}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    );
  };

  const renderCalendarTab = () => {
    if (!worker) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.calendarCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity style={styles.addButton} onPress={onViewCalendar}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.eventsList}>
            {worker.calendar.upcomingEvents.map(event => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>{event.startDate.getDate()}</Text>
                  <Text style={styles.eventMonth}>
                    {event.startDate.toLocaleDateString('en', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.buildingName && ` • ${event.buildingName}`}
                  </Text>
                  <View style={[styles.eventStatus, { backgroundColor: getEventStatusColor(event.status) }]}>
                    <Text style={styles.eventStatusText}>{event.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Working Hours */}
        <GlassCard style={styles.hoursCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.hoursList}>
            {Object.entries(worker.calendar.workingHours).map(([day, slots]) => (
              <View key={day} style={styles.hoursItem}>
                <Text style={styles.hoursDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Text style={styles.hoursSlots}>
                  {slots.length > 0 
                    ? slots.map(slot => `${slot.start}-${slot.end}`).join(', ')
                    : 'Not available'
                  }
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    );
  };

  const renderTimeOffTab = () => {
    if (!worker) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Time Off Summary */}
        <GlassCard style={styles.timeOffSummary} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Time Off Balance</Text>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{worker.timeOff.availableDays}</Text>
              <Text style={styles.balanceLabel}>Available</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{worker.timeOff.usedDays}</Text>
              <Text style={styles.balanceLabel}>Used</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{worker.timeOff.pendingRequests.length}</Text>
              <Text style={styles.balanceLabel}>Pending</Text>
            </View>
          </View>
        </GlassCard>

        {/* Pending Requests */}
        {worker.timeOff.pendingRequests.length > 0 && (
          <GlassCard style={styles.requestsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {worker.timeOff.pendingRequests.map(request => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestType}>{request.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.requestDates}>
                    {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                  </Text>
                  <Text style={styles.requestReason}>{request.reason}</Text>
                </View>
                <View style={styles.requestStatus}>
                  <Text style={styles.requestStatusText}>Pending</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Recent Requests */}
        <GlassCard style={styles.requestsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {[...worker.timeOff.approvedRequests, ...worker.timeOff.rejectedRequests]
            .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
            .slice(0, 5)
            .map(request => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestType}>{request.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.requestDates}>
                    {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.requestStatus,
                  { backgroundColor: request.status === 'approved' ? Colors.status.success : Colors.status.error }
                ]}>
                  <Text style={styles.requestStatusText}>{request.status}</Text>
                </View>
              </View>
            ))}
        </GlassCard>

        {/* Request Time Off Button */}
        <TouchableOpacity style={styles.requestTimeOffButton} onPress={onRequestTimeOff}>
          <Text style={styles.requestTimeOffButtonText}>Request Time Off</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderTimesheetTab = () => {
    if (!worker) return null;

    const recentEntries = worker.quickBooks.timesheetEntries
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Timesheet Summary */}
        <GlassCard style={styles.timesheetSummary} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.timesheetStats}>
            <View style={styles.timesheetStat}>
              <Text style={styles.timesheetStatValue}>
                {recentEntries.reduce((sum, entry) => sum + entry.totalHours, 0).toFixed(1)}
              </Text>
              <Text style={styles.timesheetStatLabel}>Hours</Text>
            </View>
            <View style={styles.timesheetStat}>
              <Text style={styles.timesheetStatValue}>
                ${recentEntries.reduce((sum, entry) => sum + entry.totalPay, 0).toFixed(2)}
              </Text>
              <Text style={styles.timesheetStatLabel}>Earnings</Text>
            </View>
          </View>
        </GlassCard>

        {/* Recent Entries */}
        <GlassCard style={styles.entriesCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {recentEntries.map(entry => (
            <View key={entry.id} style={styles.entryItem}>
              <View style={styles.entryDate}>
                <Text style={styles.entryDay}>{entry.date.getDate()}</Text>
                <Text style={styles.entryMonth}>
                  {entry.date.toLocaleDateString('en', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>
                  {entry.taskName || entry.buildingName || 'General Work'}
                </Text>
                <Text style={styles.entryTime}>
                  {entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {entry.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.entryHours}>{entry.totalHours.toFixed(1)} hours</Text>
              </View>
              <View style={styles.entryPay}>
                <Text style={styles.entryPayAmount}>${entry.totalPay.toFixed(2)}</Text>
                <View style={[styles.entryStatus, { backgroundColor: getEntryStatusColor(entry.status) }]}>
                  <Text style={styles.entryStatusText}>{entry.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* View Full Timesheet Button */}
        <TouchableOpacity style={styles.viewTimesheetButton} onPress={onViewTimesheet}>
          <Text style={styles.viewTimesheetButtonText}>View Full Timesheet</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    if (!worker) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Performance Metrics */}
        <GlassCard style={styles.metricsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{worker.performance.metrics.tasksCompleted}</Text>
              <Text style={styles.metricLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(worker.performance.metrics.onTimeRate)}%</Text>
              <Text style={styles.metricLabel}>On-Time Rate</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{worker.performance.metrics.customerRating.toFixed(1)}</Text>
              <Text style={styles.metricLabel}>Customer Rating</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{worker.performance.metrics.safetyScore}</Text>
              <Text style={styles.metricLabel}>Safety Score</Text>
            </View>
          </View>
        </GlassCard>

        {/* Current Goals */}
        <GlassCard style={styles.goalsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Current Goals</Text>
          {worker.performance.goals
            .filter(goal => goal.status === 'in_progress')
            .map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalProgress}>
                    {goal.currentValue}/{goal.targetValue} {goal.unit}
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill,
                      { width: `${(goal.currentValue / goal.targetValue) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.goalDeadline}>
                  Due: {goal.deadline.toLocaleDateString()}
                </Text>
              </View>
            ))}
        </GlassCard>

        {/* Recent Achievements */}
        <GlassCard style={styles.achievementsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {worker.performance.achievements
            .sort((a, b) => b.earnedDate.getTime() - a.earnedDate.getTime())
            .slice(0, 3)
            .map(achievement => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>
                  {achievement.type === 'safety' ? '🛡️' :
                   achievement.type === 'performance' ? '🏆' :
                   achievement.type === 'customer_service' ? '⭐' :
                   achievement.type === 'innovation' ? '💡' : '🤝'}
                </Text>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDate}>
                    {achievement.earnedDate.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.achievementPoints}>+{achievement.points}</Text>
              </View>
            ))}
        </GlassCard>

        {/* View Full Performance Button */}
        <TouchableOpacity style={styles.viewPerformanceButton} onPress={onViewPerformance}>
          <Text style={styles.viewPerformanceButtonText}>View Full Performance</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case ProfileTab.OVERVIEW:
        return renderOverviewTab();
      case ProfileTab.CALENDAR:
        return renderCalendarTab();
      case ProfileTab.TIME_OFF:
        return renderTimeOffTab();
      case ProfileTab.TIMESHEET:
        return renderTimesheetTab();
      case ProfileTab.PERFORMANCE:
        return renderPerformanceTab();
      default:
        return renderOverviewTab();
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return Colors.status.info;
      case 'in_progress': return Colors.status.warning;
      case 'completed': return Colors.status.success;
      case 'cancelled': return Colors.status.error;
      default: return Colors.glass.medium;
    }
  };

  const getEntryStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return Colors.status.warning;
      case 'submitted': return Colors.status.info;
      case 'approved': return Colors.status.success;
      case 'paid': return Colors.status.success;
      default: return Colors.glass.medium;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading worker profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Worker not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.worker.primary}
          />
        }
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton(ProfileTab.OVERVIEW, 'Overview', '👤')}
          {renderTabButton(ProfileTab.CALENDAR, 'Calendar', '📅')}
          {renderTabButton(ProfileTab.TIME_OFF, 'Time Off', '🏖️')}
          {renderTabButton(ProfileTab.TIMESHEET, 'Timesheet', '⏰')}
          {renderTabButton(ProfileTab.PERFORMANCE, 'Performance', '📊')}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.status.error,
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.medium,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedTabButton: {
    backgroundColor: Colors.glass.medium,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  selectedTabButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Tab Content
  tabContent: {
    flex: 1,
    padding: Spacing.md,
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  workerName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  workerPosition: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  workerDepartment: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  workerRate: {
    ...Typography.subheadline,
    color: Colors.primary.green,
    fontWeight: '600',
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.blue,
    borderRadius: 8,
  },
  editButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Stats
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Activity
  activityCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  activityDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  
  // Actions
  actionsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Calendar
  calendarCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  eventsList: {
    gap: Spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  eventDate: {
    alignItems: 'center',
    marginRight: Spacing.sm,
    minWidth: 40,
  },
  eventDay: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  eventMonth: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  eventTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  eventStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  eventStatusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  
  // Hours
  hoursCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  hoursList: {
    gap: Spacing.sm,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  hoursDay: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    minWidth: 80,
  },
  hoursSlots: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
    textAlign: 'right',
  },
  
  // Time Off
  timeOffSummary: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  requestsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  requestDates: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  requestReason: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  requestStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requestStatusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  requestTimeOffButton: {
    backgroundColor: Colors.primary.green,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requestTimeOffButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Timesheet
  timesheetSummary: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timesheetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timesheetStat: {
    alignItems: 'center',
  },
  timesheetStatValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  timesheetStatLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  entriesCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  entryDate: {
    alignItems: 'center',
    marginRight: Spacing.sm,
    minWidth: 40,
  },
  entryDay: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  entryMonth: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  entryTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  entryHours: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  entryPay: {
    alignItems: 'flex-end',
  },
  entryPayAmount: {
    ...Typography.subheadline,
    color: Colors.primary.green,
    fontWeight: '600',
  },
  entryStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  entryStatusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  viewTimesheetButton: {
    backgroundColor: Colors.primary.blue,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewTimesheetButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Performance
  metricsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  goalsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  goalItem: {
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  goalProgress: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: Colors.glass.medium,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.green,
    borderRadius: 2,
  },
  goalDeadline: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  achievementsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  achievementDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  achievementPoints: {
    ...Typography.subheadline,
    color: Colors.primary.green,
    fontWeight: '600',
  },
  viewPerformanceButton: {
    backgroundColor: Colors.primary.blue,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewPerformanceButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
