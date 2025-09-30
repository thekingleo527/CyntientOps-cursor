/**
 * 🗺️ Building Routes Tab
 * Mirrors: SwiftUI BuildingDetailView Routes tab functionality
 * Purpose: Route visualization, sequence management, and worker navigation
 * Features: Route sequences, operation tracking, navigation assistance
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';
import { NamedCoordinate } from '@cyntientops/domain-schema';

export interface BuildingRoutesTabProps {
  routes: any[];
  building: NamedCoordinate;
  container: ServiceContainer;
  onRoutePress?: (route: any) => void;
  onSequencePress?: (sequence: any) => void;
}

export interface RouteSequence {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  operations: RouteOperation[];
  assignedWorker?: string;
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  priority: 'low' | 'medium' | 'high';
  category: 'cleaning' | 'maintenance' | 'inspection' | 'delivery';
}

export interface RouteOperation {
  id: string;
  title: string;
  description: string;
  location: string;
  estimatedDuration: number;
  isCompleted: boolean;
  requiredTools: string[];
  notes?: string;
  photoRequired: boolean;
  sequence: number;
}

export const BuildingRoutesTab: React.FC<BuildingRoutesTabProps> = ({
  routes,
  building,
  container,
  onRoutePress,
  onSequencePress
}) => {
  const [routeSequences, setRouteSequences] = useState<RouteSequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<RouteSequence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRouteSequences();
  }, [building.id]);

  const loadRouteSequences = async () => {
    setIsLoading(true);
    try {
      // Load route sequences from hardcoded data
      const sequences = generateRouteSequences(building.id);
      setRouteSequences(sequences);
    } catch (error) {
      console.error('Failed to load route sequences:', error);
      Alert.alert('Error', 'Failed to load route sequences');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRouteSequences = (buildingId: string): RouteSequence[] => {
    // Generate building-specific route sequences based on hardcoded data
    const buildingSequences = {
      '1': [ // 12 West 18th Street
        {
          id: 'route_1_1',
          title: 'Daily Cleaning Route',
          description: 'Complete daily cleaning routine for all common areas',
          estimatedDuration: 180,
          operations: [
            {
              id: 'op_1_1',
              title: 'Lobby Cleaning',
              description: 'Clean lobby floors, windows, and furniture',
              location: 'Lobby',
              estimatedDuration: 45,
              isCompleted: false,
              requiredTools: ['Vacuum', 'Cleaning supplies', 'Window cleaner'],
              sequence: 1,
              photoRequired: true
            },
            {
              id: 'op_1_2',
              title: 'Stairwell Maintenance',
              description: 'Sweep and mop all stairwells',
              location: 'Stairwells',
              estimatedDuration: 60,
              isCompleted: false,
              requiredTools: ['Broom', 'Mop', 'Cleaning supplies'],
              sequence: 2,
              photoRequired: false
            },
            {
              id: 'op_1_3',
              title: 'Trash Collection',
              description: 'Collect and dispose of all trash',
              location: 'All floors',
              estimatedDuration: 30,
              isCompleted: false,
              requiredTools: ['Trash bags', 'Gloves'],
              sequence: 3,
              photoRequired: true
            }
          ],
          assignedWorker: 'Greg Hutson',
          status: 'pending' as const,
          priority: 'high' as const,
          category: 'cleaning' as const
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'route_4_1',
          title: 'Museum Area Special Route',
          description: 'Specialized cleaning for Rubin Museum area',
          estimatedDuration: 240,
          operations: [
            {
              id: 'op_4_1',
              title: 'Museum Entrance Cleaning',
              description: 'Deep clean museum entrance and surrounding area',
              location: 'Museum Entrance',
              estimatedDuration: 90,
              isCompleted: false,
              requiredTools: ['Specialized cleaning supplies', 'Microfiber cloths'],
              sequence: 1,
              photoRequired: true
            },
            {
              id: 'op_4_2',
              title: 'Cultural Area Maintenance',
              description: 'Maintain cultural area cleanliness standards',
              location: 'Cultural Area',
              estimatedDuration: 75,
              isCompleted: false,
              requiredTools: ['Cultural cleaning supplies'],
              sequence: 2,
              photoRequired: true
            },
            {
              id: 'op_4_3',
              title: 'Visitor Area Preparation',
              description: 'Prepare visitor areas for daily operations',
              location: 'Visitor Areas',
              estimatedDuration: 75,
              isCompleted: false,
              requiredTools: ['Preparation supplies'],
              sequence: 3,
              photoRequired: false
            }
          ],
          assignedWorker: 'Kevin Dutan',
          status: 'in_progress' as const,
          priority: 'high' as const,
          category: 'cleaning' as const
        }
      ]
    };

    return buildingSequences[buildingId as keyof typeof buildingSequences] || [];
  };

  const toggleSequenceExpansion = (sequenceId: string) => {
    const newExpanded = new Set(expandedSequences);
    if (newExpanded.has(sequenceId)) {
      newExpanded.delete(sequenceId);
    } else {
      newExpanded.add(sequenceId);
    }
    setExpandedSequences(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'pending': return Colors.inactive;
      default: return Colors.inactive;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.critical;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'inspection': return '🔍';
      case 'delivery': return '📦';
      default: return '📋';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderRouteSequence = (sequence: RouteSequence) => {
    const isExpanded = expandedSequences.has(sequence.id);
    const completedOperations = sequence.operations.filter(op => op.isCompleted).length;
    const totalOperations = sequence.operations.length;
    const progressPercentage = (completedOperations / totalOperations) * 100;

    return (
      <GlassCard 
        key={sequence.id} 
        style={styles.sequenceCard} 
        intensity={GlassIntensity.REGULAR} 
        cornerRadius={CornerRadius.CARD}
      >
        <TouchableOpacity 
          onPress={() => toggleSequenceExpansion(sequence.id)}
          style={styles.sequenceHeader}
        >
          <View style={styles.sequenceHeaderLeft}>
            <Text style={styles.sequenceIcon}>{getCategoryIcon(sequence.category)}</Text>
            <View style={styles.sequenceInfo}>
              <Text style={styles.sequenceTitle}>{sequence.title}</Text>
              <Text style={styles.sequenceDescription}>{sequence.description}</Text>
            </View>
          </View>
          
          <View style={styles.sequenceHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sequence.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(sequence.status) }]}>
                {sequence.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sequenceMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValue}>{formatDuration(sequence.estimatedDuration)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Progress</Text>
            <Text style={styles.metaValue}>{completedOperations}/{totalOperations}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Worker</Text>
            <Text style={styles.metaValue}>{sequence.assignedWorker || 'Unassigned'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Priority</Text>
            <Text style={[styles.metaValue, { color: getPriorityColor(sequence.priority) }]}>
              {sequence.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: getStatusColor(sequence.status)
              }
            ]} 
          />
        </View>

        {isExpanded && (
          <View style={styles.operationsContainer}>
            <Text style={styles.operationsTitle}>Operations</Text>
            {sequence.operations.map((operation, index) => (
              <View key={operation.id} style={styles.operationItem}>
                <View style={styles.operationHeader}>
                  <View style={styles.operationNumber}>
                    <Text style={styles.operationNumberText}>{operation.sequence}</Text>
                  </View>
                  <View style={styles.operationInfo}>
                    <Text style={styles.operationTitle}>{operation.title}</Text>
                    <Text style={styles.operationLocation}>📍 {operation.location}</Text>
                    <Text style={styles.operationDuration}>⏱️ {formatDuration(operation.estimatedDuration)}</Text>
                  </View>
                  <View style={styles.operationStatus}>
                    {operation.isCompleted ? (
                      <Text style={styles.completedIcon}>✅</Text>
                    ) : (
                      <Text style={styles.pendingIcon}>⏳</Text>
                    )}
                  </View>
                </View>
                
                <Text style={styles.operationDescription}>{operation.description}</Text>
                
                {operation.requiredTools.length > 0 && (
                  <View style={styles.toolsContainer}>
                    <Text style={styles.toolsLabel}>Required Tools:</Text>
                    <View style={styles.toolsList}>
                      {operation.requiredTools.map((tool, toolIndex) => (
                        <View key={toolIndex} style={styles.toolItem}>
                          <Text style={styles.toolText}>{tool}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {operation.photoRequired && (
                  <View style={styles.photoRequired}>
                    <Text style={styles.photoRequiredText}>📷 Photo Required</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading route sequences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🗺️ Route Sequences</Text>
          <Text style={styles.headerSubtitle}>
            {routeSequences.length} route sequence{routeSequences.length !== 1 ? 's' : ''} for {building.name}
          </Text>
        </View>

        {routeSequences.length === 0 ? (
          <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.emptyTitle}>No Route Sequences</Text>
            <Text style={styles.emptyDescription}>
              No route sequences have been configured for this building yet.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.sequencesContainer}>
            {routeSequences.map(renderRouteSequence)}
          </View>
        )}

        <View style={styles.summaryCard}>
          <GlassCard style={styles.summaryCardContent} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.summaryTitle}>Route Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{routeSequences.length}</Text>
                <Text style={styles.summaryStatLabel}>Total Routes</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {routeSequences.filter(s => s.status === 'completed').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Completed</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {routeSequences.filter(s => s.status === 'in_progress').length}
                </Text>
                <Text style={styles.summaryStatLabel}>In Progress</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {routeSequences.reduce((total, s) => total + s.estimatedDuration, 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>Total Minutes</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  sequencesContainer: {
    marginBottom: Spacing.lg,
  },
  sequenceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sequenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sequenceIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  sequenceDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  sequenceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  expandIcon: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  sequenceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.inactive + '20',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  operationsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  operationsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  operationItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  operationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryAction,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  operationNumberText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  operationInfo: {
    flex: 1,
  },
  operationTitle: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  operationLocation: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  operationDuration: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  operationStatus: {
    marginLeft: Spacing.sm,
  },
  completedIcon: {
    fontSize: 16,
  },
  pendingIcon: {
    fontSize: 16,
  },
  operationDescription: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  toolsContainer: {
    marginTop: Spacing.xs,
  },
  toolsLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  toolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolItem: {
    backgroundColor: Colors.primaryAction + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  toolText: {
    ...Typography.captionSmall,
    color: Colors.primaryAction,
    fontWeight: '500',
  },
  photoRequired: {
    marginTop: Spacing.xs,
    padding: Spacing.xs,
    backgroundColor: Colors.warning + '20',
    borderRadius: 6,
  },
  photoRequiredText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '500',
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryCardContent: {
    padding: Spacing.md,
  },
  summaryTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    ...Typography.titleMedium,
    color: Colors.primaryAction,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryStatLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
});

export default BuildingRoutesTab;