/**
 * 👔 Client Profile View
 * Purpose: Detailed client profile with portfolio metrics, contact details,
 * and top buildings summary. Uses real data via ClientService.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { ServiceContainer } from '@cyntientops/business-core';

interface ClientProfileViewProps {
  clientId: string;
  onViewPortfolio?: (clientId: string) => void;
  onContact?: (email: string) => void;
  onLogout?: () => void;
}

export const ClientProfileView: React.FC<ClientProfileViewProps> = ({ clientId, onViewPortfolio, onContact, onLogout }) => {
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const services = ServiceContainer.getInstance();

  useEffect(() => {
    try {
      const c = services.client.getClientById(clientId);
      setClient(c);
      const pf = services.client.getClientPortfolio(clientId);
      setPortfolio(pf);
    } catch (err) {
      Alert.alert('Error', 'Failed to load client profile');
    }
  }, [clientId]);

  if (!client || !portfolio) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading client profile…</Text>
      </View>
    );
  }

  const avgCompliance = Math.round((portfolio.averageComplianceScore || 0) * 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <GlassCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.contact_email && <Text style={styles.clientMeta}>{client.contact_email}</Text>}
            {client.contact_phone && <Text style={styles.clientMeta}>{client.contact_phone}</Text>}
          </View>
          <TouchableOpacity style={styles.portfolioButton} onPress={() => onViewPortfolio?.(clientId)}>
            <Text style={styles.portfolioButtonText}>View Portfolio</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Stats */}
      <GlassCard style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Portfolio Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{portfolio.totalBuildings}</Text>
            <Text style={styles.statLabel}>Buildings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{portfolio.totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgCompliance}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>
      </GlassCard>

      {/* Top Buildings */}
      <GlassCard style={styles.buildingsCard}>
        <Text style={styles.sectionTitle}>Top Buildings</Text>
        {portfolio.buildings.slice(0, 5).map((b: any) => (
          <View key={b.buildingId} style={styles.buildingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.buildingName}>{b.buildingName}</Text>
              <Text style={styles.buildingMeta}>{Math.round((b.complianceScore || 0) * 100)}% • {b.taskCount} tasks</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Contact */}
      <GlassCard style={styles.contactCard}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.contactText}>Email: {client.contact_email || '—'}</Text>
        <Text style={styles.contactText}>Phone: {client.contact_phone || '—'}</Text>
        {client.address && <Text style={styles.contactText}>Address: {client.address}</Text>}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodyLarge, color: Colors.text.secondary },
  headerCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  clientName: { ...Typography.titleLarge, color: Colors.text.primary, fontWeight: '700' },
  clientMeta: { ...Typography.caption, color: Colors.text.secondary },
  portfolioButton: { backgroundColor: Colors.role.client.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  portfolioButtonText: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '700' },
  statsCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.titleMedium, color: Colors.text.primary, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.titleLarge, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.secondary },
  buildingsCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  buildingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  buildingName: { ...Typography.bodyLarge, color: Colors.text.primary },
  buildingMeta: { ...Typography.caption, color: Colors.text.secondary },
  contactCard: { padding: Spacing.lg, marginBottom: Spacing['2xl'] },
  contactText: { ...Typography.bodyMedium, color: Colors.text.primary, marginBottom: 4 },
});

export default ClientProfileView;
