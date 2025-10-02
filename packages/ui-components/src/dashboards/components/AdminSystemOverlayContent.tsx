/**
 * @cyntientops/ui-components
 * 
 * Admin System Overlay Content - System management and configuration
 */

import React from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

export interface AdminSystemOverlayContentProps {
  adminId: string;
  adminName: string;
  onRefresh?: () => Promise<void>;
}

export const AdminSystemOverlayContent: React.FC<AdminSystemOverlayContentProps> = ({
  adminId,
  adminName,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const renderSystemStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ System Status</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Overall System Health</Text>
          <View style={[styles.statusIndicator, { backgroundColor: Colors.status.success }]}>
            <Text style={styles.statusText}>All Systems Operational</Text>
          </View>
        </View>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Database</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>API Services</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Weather API</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Nova AI</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Push Notifications</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>File Storage</Text>
            <View style={styles.statusItemValue}>
              <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.statusItemText}>Online</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderSystemMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 System Metrics</Text>
      <View style={styles.metricsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>99.9%</Text>
            <Text style={styles.metricLabel}>Uptime</Text>
            <Text style={styles.metricSubtext}>Last 30 days</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>45ms</Text>
            <Text style={styles.metricLabel}>Response Time</Text>
            <Text style={styles.metricSubtext}>Average</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>68%</Text>
            <Text style={styles.metricLabel}>Memory Usage</Text>
            <Text style={styles.metricSubtext}>Current</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>42%</Text>
            <Text style={styles.metricLabel}>CPU Usage</Text>
            <Text style={styles.metricSubtext}>Current</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderSystemLogs = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 System Logs</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.logsCard}>
        {[
          { time: '14:32:15', level: 'INFO', message: 'System backup completed successfully' },
          { time: '14:28:42', level: 'INFO', message: 'Weather API sync completed' },
          { time: '14:25:18', level: 'WARN', message: 'High memory usage detected' },
          { time: '14:20:05', level: 'INFO', message: 'Nova AI model updated' },
          { time: '14:15:33', level: 'INFO', message: 'Database optimization completed' },
        ].map((log, index) => (
          <View key={index} style={styles.logItem}>
            <Text style={styles.logTime}>{log.time}</Text>
            <View style={[
              styles.logLevel,
              { backgroundColor: log.level === 'WARN' ? Colors.status.warning : Colors.status.info }
            ]}>
              <Text style={styles.logLevelText}>{log.level}</Text>
            </View>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  const renderSystemSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ System Settings</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.settingsCard}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto Backup</Text>
          <TouchableOpacity style={[styles.toggle, { backgroundColor: Colors.status.success }]}>
            <Text style={styles.toggleText}>ON</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Weather Alerts</Text>
          <TouchableOpacity style={[styles.toggle, { backgroundColor: Colors.status.success }]}>
            <Text style={styles.toggleText}>ON</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Maintenance Mode</Text>
          <TouchableOpacity style={[styles.toggle, { backgroundColor: Colors.border.light }]}>
            <Text style={styles.toggleText}>OFF</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Debug Logging</Text>
          <TouchableOpacity style={[styles.toggle, { backgroundColor: Colors.border.light }]}>
            <Text style={styles.toggleText}>OFF</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Restart Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💾</Text>
          <Text style={styles.actionText}>Backup Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {renderSystemStatus()}
      {renderSystemMetrics()}
      {renderSystemLogs()}
      {renderSystemSettings()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statusCard: {
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statusItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statusItemLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  statusItemValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusItemText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricCard: {
    width: '48%',
    overflow: 'hidden',
  },
  metricGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  metricLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  metricSubtext: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  logsCard: {
    padding: Spacing.lg,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  logTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    width: 60,
  },
  logLevel: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  logLevelText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  logMessage: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  settingsCard: {
    padding: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  toggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminSystemOverlayContent;
