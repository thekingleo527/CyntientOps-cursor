/**
 * @cyntientops/ui-components
 * 
 * Cluster List View Component
 * Purpose: Display buildings in a cluster for inspection and selection
 * Features: Building list with stats, urgent task indicators, compliance scores
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { BuildingMarker } from '../services/MapClusteringService';

interface ClusterListViewProps {
  buildings: BuildingMarker[];
  onBuildingPress: (buildingId: string) => void;
  onClose: () => void;
}

export const ClusterListView: React.FC<ClusterListViewProps> = ({
  buildings,
  onBuildingPress,
  onClose,
}) => {
  const renderBuilding = ({ item }: { item: BuildingMarker }) => (
    <TouchableOpacity
      style={styles.buildingItem}
      onPress={() => {
        onBuildingPress(item.id);
        onClose();
      }}
    >
      <View style={styles.buildingInfo}>
        <Text style={styles.buildingName}>{item.name}</Text>
        <Text style={styles.buildingAddress}>{item.address}</Text>
      </View>
      <View style={styles.buildingStats}>
        {item.urgentTaskCount > 0 && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>{item.urgentTaskCount} urgent</Text>
          </View>
        )}
        <Text style={styles.taskCount}>{item.taskCount} tasks</Text>
        <Text
          style={[
            styles.compliance,
            item.complianceScore < 70 && styles.complianceLow,
          ]}
        >
          {item.complianceScore}% compliant
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{buildings.length} Buildings in Cluster</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={buildings}
        renderItem={renderBuilding}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.baseBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  list: {
    padding: Spacing.md,
  },
  buildingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 4,
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  buildingStats: {
    alignItems: 'flex-end',
  },
  urgentBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  urgentText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  taskCount: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: 2,
  },
  compliance: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  complianceLow: {
    color: Colors.warning,
  },
});
