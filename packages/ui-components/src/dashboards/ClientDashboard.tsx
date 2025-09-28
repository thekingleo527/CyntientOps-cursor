/**
 * @cyntientops/ui-components
 * 
 * Client Dashboard Component
 * Mirrors Swift ClientDashboardView.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { GlassCard, GlassButton, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { Client, ClientPortfolio } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// Import dashboard components
import { PortfolioOverview } from './components/PortfolioOverview';
import { ComplianceAlerts } from './components/ComplianceAlerts';
import { WorkerAssignments } from './components/WorkerAssignments';
import { CostAnalysis } from './components/CostAnalysis';

export interface ClientDashboardProps {
  clientId: string;
  onBuildingPress?: (buildingId: string) => void;
  onWorkerPress?: (workerId: string) => void;
  onAlertPress?: (alertId: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  clientId,
  onBuildingPress,
  onWorkerPress,
  onAlertPress,
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [portfolio, setPortfolio] = useState<ClientPortfolio | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const clientData = services.client.getClientById(clientId);
      const portfolioData = services.client.getClientPortfolio(clientId);
      
      setClient(clientData || null);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClientData();
    setIsRefreshing(false);
  };

  if (!client || !portfolio) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading client data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.client.primary}
        />
      }
    >
      {/* Client Header */}
      <GlassCard style={styles.headerCard} variant="elevated">
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientContact}>{client.contact_email}</Text>
            <Text style={styles.clientPhone}>{client.contact_phone}</Text>
          </View>
          <View style={styles.clientStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: client.is_active ? Colors.status.success : Colors.status.error }
            ]}>
              <Text style={styles.statusText}>
                {client.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Portfolio Overview */}
      <PortfolioOverview
        portfolio={portfolio}
        onBuildingPress={onBuildingPress}
      />

      {/* Compliance Alerts */}
      <ComplianceAlerts
        clientId={clientId}
        onAlertPress={onAlertPress}
      />

      {/* Worker Assignments */}
      <WorkerAssignments
        clientId={clientId}
        onWorkerPress={onWorkerPress}
      />

      {/* Cost Analysis */}
      <CostAnalysis
        clientId={clientId}
      />

      {/* Quick Actions */}
      <GlassCard style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <GlassButton
            title="View All Buildings"
            onPress={() => {}}
            variant="secondary"
            size="small"
          />
          <GlassButton
            title="Generate Report"
            onPress={() => {}}
            variant="tertiary"
            size="small"
          />
          <GlassButton
            title="Contact Client"
            onPress={() => {}}
            variant="primary"
            size="small"
          />
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },
  headerCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.headlineMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  clientContact: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  clientPhone: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  clientStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  quickActionsCard: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
