/**
 * @cyntientops/ui-components
 * 
 * Cluster Marker Component
 * Purpose: Visual representation of map clusters with dynamic sizing and colors
 * Features: Size based on point count, color based on urgency/compliance, urgent task badges
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '@cyntientops/design-tokens';

interface ClusterMarkerProps {
  latitude: number;
  longitude: number;
  pointCount: number;
  onPress: () => void;
  stats?: {
    totalTasks: number;
    urgentTasks: number;
    averageCompliance: number;
    emergencyCount: number;
  };
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  latitude,
  longitude,
  pointCount,
  onPress,
  stats,
}) => {
  // Calculate cluster size based on point count
  const getClusterSize = (count: number): number => {
    if (count < 10) return 40;
    if (count < 50) return 50;
    if (count < 100) return 60;
    return 70;
  };

  // Get cluster color based on stats
  const getClusterColor = (): string => {
    if (stats?.emergencyCount && stats.emergencyCount > 0) {
      return Colors.error; // Red for emergencies
    }
    if (stats?.urgentTasks && stats.urgentTasks > 5) {
      return Colors.warning; // Orange for urgent tasks
    }
    if (stats?.averageCompliance && stats.averageCompliance < 70) {
      return Colors.warning; // Yellow for low compliance
    }
    return Colors.success; // Green for normal
  };

  const size = getClusterSize(pointCount);
  const color = getClusterColor();

  return (
    <TouchableOpacity
      style={[
        styles.cluster,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.clusterText}>{pointCount}</Text>
      {stats && stats.urgentTasks > 0 && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>{stats.urgentTasks}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cluster: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: '700',
    textAlign: 'center',
  },
  urgentBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryText,
  },
  urgentBadgeText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '700',
  },
});
