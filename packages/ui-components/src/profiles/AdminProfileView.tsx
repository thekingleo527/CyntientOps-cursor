/**
 * 🛠️ Admin Profile View
 * Purpose: Admin profile summary with system metrics and quick links.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { LinearGradient } from 'expo-linear-gradient';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';

interface AdminProfileViewProps {
  adminId: string;
  onManageWorkers?: () => void;
  onSystemSettings?: () => void;
  onLogout?: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({ adminId, onManageWorkers, onSystemSettings, onLogout }) => {
  const [admin, setAdmin] = useState<any | null>(null);
  const [metrics, setMetrics] = useState({ totalWorkers: 0, totalBuildings: 0, avgCompliance: 0 });

  useEffect(() => {
    const worker = RealDataService.getWorkerById(adminId);
    setAdmin(worker || { name: 'Admin', email: '', phone: '' });
    const workers = RealDataService.getWorkers();
    const buildings = RealDataService.getBuildings();
    const avg = buildings.length
      ? Math.round((buildings.reduce((s: number, b: any) => s + (b.compliance_score || 0.85), 0) / buildings.length) * 100)
      : 0;
    setMetrics({ totalWorkers: workers.length, totalBuildings: buildings.length, avgCompliance: avg });
  }, [adminId]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.headerCard}>
        <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
        <Text style={styles.adminMeta}>{admin?.email || 'admin@company.com'}</Text>
        {admin?.phone && <Text style={styles.adminMeta}>{admin.phone}</Text>}
      </GlassCard>

      <GlassCard style={styles.statsCard}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{metrics.totalWorkers}</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{metrics.totalBuildings}</Text>
            <Text style={styles.statLabel}>Buildings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{metrics.avgCompliance}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onManageWorkers}>
            <Text style={styles.actionText}>Manage Workers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onSystemSettings}>
            <Text style={styles.actionText}>System Settings</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* System Status Section */}
      <GlassCard style={styles.systemCard}>
        <Text style={styles.sectionTitle}>⚙️ System Status</Text>
        <View style={styles.systemStatusGrid}>
          <View style={styles.systemStatusItem}>
            <Text style={styles.systemStatusLabel}>Database</Text>
            <View style={styles.systemStatusValue}>
              <View style={[styles.systemStatusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.systemStatusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.systemStatusItem}>
            <Text style={styles.systemStatusLabel}>API Services</Text>
            <View style={styles.systemStatusValue}>
              <View style={[styles.systemStatusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.systemStatusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.systemStatusItem}>
            <Text style={styles.systemStatusLabel}>Weather API</Text>
            <View style={styles.systemStatusValue}>
              <View style={[styles.systemStatusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.systemStatusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.systemStatusItem}>
            <Text style={styles.systemStatusLabel}>Nova AI</Text>
            <View style={styles.systemStatusValue}>
              <View style={[styles.systemStatusDot, { backgroundColor: Colors.status.success }]} />
              <Text style={styles.systemStatusText}>Online</Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* System Metrics Section */}
      <GlassCard style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>📊 System Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <LinearGradient
              colors={[Colors.status.success, Colors.status.info]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>99.9%</Text>
              <Text style={styles.metricLabel}>Uptime</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricItem}>
            <LinearGradient
              colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>45ms</Text>
              <Text style={styles.metricLabel}>Response</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricItem}>
            <LinearGradient
              colors={[Colors.status.warning, Colors.status.error]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>68%</Text>
              <Text style={styles.metricLabel}>Memory</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricItem}>
            <LinearGradient
              colors={[Colors.role.client.primary, Colors.role.client.secondary]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>42%</Text>
              <Text style={styles.metricLabel}>CPU</Text>
            </LinearGradient>
          </View>
        </View>
      </GlassCard>

      {/* System Settings Section */}
      <GlassCard style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>⚙️ System Settings</Text>
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

      {!!onLogout && (
        <View style={{ paddingHorizontal: Spacing.md }}>
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: Colors.error, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ ...Typography.subheadline, color: Colors.text.primary, fontWeight: '700' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  headerCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  adminName: { ...Typography.titleLarge, color: Colors.text.primary, fontWeight: '700' },
  adminMeta: { ...Typography.caption, color: Colors.text.secondary },
  statsCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.titleMedium, color: Colors.text.primary, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.titleLarge, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.secondary },
  actionsCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: Colors.glass.regular, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  actionText: { ...Typography.caption, color: Colors.text.primary, fontWeight: '700' },
  // System Status Styles
  systemCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  systemStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  systemStatusItem: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  systemStatusLabel: { ...Typography.body, color: Colors.text.primary },
  systemStatusValue: { flexDirection: 'row', alignItems: 'center' },
  systemStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.xs },
  systemStatusText: { ...Typography.body, color: Colors.text.primary, fontWeight: '600' },
  // System Metrics Styles
  metricsCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metricItem: { width: '48%', overflow: 'hidden', borderRadius: 12 },
  metricGradient: { padding: Spacing.lg, alignItems: 'center' },
  metricValue: { ...Typography.titleLarge, color: Colors.text.inverse, fontWeight: 'bold', fontSize: 20 },
  metricLabel: { ...Typography.body, color: Colors.text.inverse, marginTop: Spacing.xs, textAlign: 'center' },
  // System Settings Styles
  settingsCard: { padding: Spacing.lg, marginBottom: Spacing['2xl'] },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  settingLabel: { ...Typography.body, color: Colors.text.primary },
  toggle: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 12, minWidth: 50, alignItems: 'center' },
  toggleText: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '600' },
});

export default AdminProfileView;
