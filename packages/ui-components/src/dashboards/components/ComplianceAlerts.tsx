/**
 * @cyntientops/ui-components
 * 
 * Compliance Alerts Component
 * Mirrors Swift ComplianceAlerts.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { ServiceContainer } from '@cyntientops/business-core';

export interface ComplianceAlert {
  id: string;
  type: 'compliance' | 'overdue' | 'urgent' | 'billing' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  buildingId?: string;
  taskId?: string;
  date: Date;
}

export interface ComplianceAlertsProps {
  clientId: string;
  onAlertPress?: (alertId: string) => void;
}

export const ComplianceAlerts: React.FC<ComplianceAlertsProps> = ({
  clientId,
  onAlertPress,
}) => {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadComplianceAlerts();
  }, [clientId]);

  const loadComplianceAlerts = () => {
    try {
      const clientAlerts = services.client.getClientAlerts(clientId);
      setAlerts(clientAlerts);
    } catch (error) {
      console.error('Error loading compliance alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return Colors.status.error;
      case 'high':
        return Colors.priority.high;
      case 'medium':
        return Colors.status.warning;
      case 'low':
        return Colors.status.info;
      default:
        return Colors.text.tertiary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance':
        return '⚠️';
      case 'overdue':
        return '⏰';
      case 'urgent':
        return '🚨';
      case 'billing':
        return '💰';
      case 'performance':
        return '📊';
      default:
        return 'ℹ️';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <GlassCard style={styles.container}>
        <Text style={styles.loadingText}>Loading compliance alerts...</Text>
      </GlassCard>
    );
  }

  if (alerts.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <Text style={styles.sectionTitle}>Compliance Alerts</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>All Clear! 🎉</Text>
          <Text style={styles.emptySubtitle}>
            No compliance alerts at this time.
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.sectionTitle}>Compliance Alerts</Text>
      
      {alerts.map((alert) => (
        <TouchableOpacity
          key={alert.id}
          style={styles.alertItem}
          onPress={() => onAlertPress?.(alert.id)}
        >
          <View style={styles.alertHeader}>
            <View style={styles.alertIcon}>
              <Text style={styles.iconText}>{getTypeIcon(alert.type)}</Text>
            </View>
            
            <View style={styles.alertInfo}>
              <Text style={styles.alertMessage} numberOfLines={2}>
                {alert.message}
              </Text>
              <Text style={styles.alertDate}>
                {formatDate(alert.date)}
              </Text>
            </View>
            
            <View style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(alert.severity) }
            ]}>
              <Text style={styles.severityText}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {alert.buildingId && (
            <View style={styles.alertDetails}>
              <Text style={styles.detailText}>
                Building: {alert.buildingId}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Alert Summary */}
      <View style={styles.alertSummary}>
        <Text style={styles.summaryTitle}>Alert Summary</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={[
              styles.summaryValue,
              { color: Colors.status.error }
            ]}>
              {alerts.filter(a => a.severity === 'critical').length}
            </Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[
              styles.summaryValue,
              { color: Colors.priority.high }
            ]}>
              {alerts.filter(a => a.severity === 'high').length}
            </Text>
            <Text style={styles.summaryLabel}>High</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[
              styles.summaryValue,
              { color: Colors.status.warning }
            ]}>
              {alerts.filter(a => a.severity === 'medium').length}
            </Text>
            <Text style={styles.summaryLabel}>Medium</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[
              styles.summaryValue,
              { color: Colors.status.info }
            ]}>
              {alerts.filter(a => a.severity === 'low').length}
            </Text>
            <Text style={styles.summaryLabel}>Low</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  alertItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
  },
  iconText: {
    fontSize: 20,
  },
  alertInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  alertMessage: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  alertDate: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  severityText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  alertDetails: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.xl,
  },
  detailText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  alertSummary: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  summaryTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.titleLarge,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
});
