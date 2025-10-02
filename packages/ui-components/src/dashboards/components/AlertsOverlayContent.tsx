/**
 * @cyntientops/ui-components
 *
 * Alerts Overlay Content - Critical alerts and urgent tasks view
 * Contains: Urgent tasks, weather alerts, system alerts, compliance notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { TaskTimelineView } from '../../timeline/TaskTimelineView';
import type { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export type AlertType = 'urgent' | 'weather' | 'system' | 'compliance';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface AlertsOverlayContentProps {
  workerId: string;
  workerName: string;
  urgentTasks?: OperationalDataTaskAssignment[];
  alerts?: Alert[];
  onTaskPress: (task: OperationalDataTaskAssignment) => void;
  onAlertPress?: (alert: Alert) => void;
  onRefresh?: () => Promise<void>;
}

export const AlertsOverlayContent: React.FC<AlertsOverlayContentProps> = ({
  workerId,
  workerName,
  urgentTasks = [],
  alerts = [],
  onTaskPress,
  onAlertPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const getAlertColor = (type: AlertType): string => {
    switch (type) {
      case 'urgent':
        return Colors.status.error;
      case 'weather':
        return Colors.status.warning;
      case 'system':
        return Colors.status.info;
      case 'compliance':
        return Colors.status.warning;
      default:
        return Colors.text.secondary;
    }
  };

  const renderUrgentTasks = () => {
    if (urgentTasks.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Urgent Tasks</Text>
          <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No urgent tasks at the moment</Text>
          </GlassCard>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚨 Urgent Tasks</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{urgentTasks.length}</Text>
          </View>
        </View>
        <TaskTimelineView
          tasks={urgentTasks}
          onTaskPress={onTaskPress}
        />
      </View>
    );
  };

  const renderAlerts = () => {
    if (alerts.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ System Alerts</Text>
          <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No system alerts</Text>
          </GlassCard>
        </View>
      );
    }

    const weatherAlerts = alerts.filter(a => a.type === 'weather');
    const systemAlerts = alerts.filter(a => a.type === 'system');
    const complianceAlerts = alerts.filter(a => a.type === 'compliance');

    return (
      <>
        {weatherAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌦️ Weather Alerts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{weatherAlerts.length}</Text>
              </View>
            </View>
            <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.alertsCard}>
              {weatherAlerts.map(alert => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => onAlertPress?.(alert)}
                >
                  <View style={[styles.alertIconContainer, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                    <Text style={styles.alertIcon}>{alert.icon}</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
                  </View>
                  {alert.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        )}

        {systemAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚙️ System Alerts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{systemAlerts.length}</Text>
              </View>
            </View>
            <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.alertsCard}>
              {systemAlerts.map(alert => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => onAlertPress?.(alert)}
                >
                  <View style={[styles.alertIconContainer, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                    <Text style={styles.alertIcon}>{alert.icon}</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        )}

        {complianceAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Compliance Alerts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{complianceAlerts.length}</Text>
              </View>
            </View>
            <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.alertsCard}>
              {complianceAlerts.map(alert => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => onAlertPress?.(alert)}
                >
                  <View style={[styles.alertIconContainer, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                    <Text style={styles.alertIcon}>{alert.icon}</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
                  </View>
                  {alert.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        )}
      </>
    );
  };

  const renderQuickStats = () => {
    const totalAlerts = alerts.length;
    const highPriorityAlerts = alerts.filter(a => a.priority === 'high').length;
    const urgentTaskCount = urgentTasks.length;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Alert Summary</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.status.error }]}>{urgentTaskCount}</Text>
              <Text style={styles.statLabel}>Urgent Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.status.warning }]}>{highPriorityAlerts}</Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.status.info }]}>{totalAlerts}</Text>
              <Text style={styles.statLabel}>Total Alerts</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.worker.primary}
        />
      }
    >
      {renderQuickStats()}
      {renderUrgentTasks()}
      {renderAlerts()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.status.error + '20',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  alertsCard: {
    padding: Spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.tertiary,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  priorityText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  statsCard: {
    padding: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xLarge,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default AlertsOverlayContent;