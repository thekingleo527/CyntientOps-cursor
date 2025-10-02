/**
 * 🛠️ Admin Profile View
 * Purpose: Admin profile summary with system metrics and quick links.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../../glass';
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
  actionsCard: { padding: Spacing.lg, marginBottom: Spacing['2xl'] },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: Colors.glass.regular, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  actionText: { ...Typography.caption, color: Colors.text.primary, fontWeight: '700' },
});

export default AdminProfileView;
