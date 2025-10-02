/**
 * @cyntientops/ui-components
 * 
 * Realtime Monitoring Component
 * Mirrors Swift RealtimeMonitoring.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { WorkerLocation } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface RealtimeMonitoringProps {
  onWorkerPress?: (workerId: string) => void;
}

export const RealtimeMonitoring: React.FC<RealtimeMonitoringProps> = ({
  onWorkerPress,
}) => {
  const [workerLocations, setWorkerLocations] = useState<WorkerLocation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadWorkerLocations();
    
    // Update locations every 30 seconds
    const interval = setInterval(loadWorkerLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWorkerLocations = () => {
    try {
      const locations = services.worker.getAllWorkerLocations();
      setWorkerLocations(locations);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading worker locations:', error);
    }
  };

  const getWorkerName = (workerId: string) => {
    const worker = services.operationalData.getWorkerById(workerId);
    return worker?.name || 'Unknown Worker';
  };

  const getWorkerStatus = (workerId: string) => {
    const clockInData = services.worker.getClockInData(workerId);
    return clockInData ? 'Clocked In' : 'Available';
  };

  const getStatusColor = (workerId: string) => {
    const clockInData = services.worker.getClockInData(workerId);
    return clockInData ? Colors.status.success : Colors.text.tertiary;
  };

  const formatLastSeen = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return timestamp.toLocaleDateString();
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Realtime Monitoring</Text>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {formatLastUpdate(lastUpdated)}
          </Text>
        </View>
      </View>

      {workerLocations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Workers</Text>
          <Text style={styles.emptySubtitle}>
            No workers are currently active or have location data.
          </Text>
        </View>
      ) : (
        <>
          {workerLocations.map((location) => (
            <TouchableOpacity
              key={location.workerId}
              style={styles.workerItem}
              onPress={() => onWorkerPress?.(location.workerId)}
            >
              <View style={styles.workerHeader}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>
                    {getWorkerName(location.workerId)}
                  </Text>
                  <Text style={styles.workerId}>ID: {location.workerId}</Text>
                </View>
                
                <View style={styles.workerStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(location.workerId) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getWorkerStatus(location.workerId)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.locationInfo}>
                <View style={styles.coordinates}>
                  <Text style={styles.coordinateLabel}>Latitude:</Text>
                  <Text style={styles.coordinateValue}>
                    {location.latitude.toFixed(6)}
                  </Text>
                </View>
                
                <View style={styles.coordinates}>
                  <Text style={styles.coordinateLabel}>Longitude:</Text>
                  <Text style={styles.coordinateValue}>
                    {location.longitude.toFixed(6)}
                  </Text>
                </View>
                
                {location.accuracy && (
                  <View style={styles.accuracy}>
                    <Text style={styles.accuracyLabel}>Accuracy:</Text>
                    <Text style={styles.accuracyValue}>
                      {location.accuracy.toFixed(1)}m
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.timestamp}>
                <Text style={styles.timestampText}>
                  Last seen: {formatLastSeen(location.timestamp)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Monitoring Summary</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{workerLocations.length}</Text>
                <Text style={styles.summaryLabel}>Active Workers</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={[
                  styles.summaryValue,
                  { color: Colors.status.success }
                ]}>
                  {workerLocations.filter(loc => 
                    services.worker.getClockInData(loc.workerId)
                  ).length}
                </Text>
                <Text style={styles.summaryLabel}>Clocked In</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {workerLocations.filter(loc => 
                    new Date().getTime() - loc.timestamp.getTime() < 5 * 60 * 1000
                  ).length}
                </Text>
                <Text style={styles.summaryLabel}>Recent Activity</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
  },
  lastUpdated: {
    alignItems: 'flex-end',
  },
  lastUpdatedText: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
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
  workerItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  workerId: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  workerStatus: {
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
  locationInfo: {
    marginBottom: Spacing.md,
  },
  coordinates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  coordinateLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  coordinateValue: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  accuracy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  accuracyValue: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  timestamp: {
    alignItems: 'flex-end',
  },
  timestampText: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
  summaryContainer: {
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
    color: Colors.role.admin.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
});
