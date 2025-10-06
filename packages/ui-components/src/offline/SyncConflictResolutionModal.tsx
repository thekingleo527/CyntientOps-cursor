/**
 * 🔄 Sync Conflict Resolution Modal
 * Purpose: UI for resolving data conflicts during sync
 * Features: Conflict visualization, resolution options, merge capabilities
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { LinearGradient } from 'expo-linear-gradient';

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  localValue: any;
  serverValue: any;
  localTimestamp: string;
  serverTimestamp: string;
  resolution?: 'local' | 'server' | 'merged';
}

export interface SyncConflictResolutionModalProps {
  visible: boolean;
  conflicts: SyncConflict[];
  onResolve: (conflictId: string, resolution: 'local' | 'server' | 'merged', mergedValue?: any) => void;
  onResolveAll: (resolutions: { [conflictId: string]: { resolution: 'local' | 'server' | 'merged'; mergedValue?: any } }) => void;
  onCancel: () => void;
}

export const SyncConflictResolutionModal: React.FC<SyncConflictResolutionModalProps> = ({
  visible,
  conflicts,
  onResolve,
  onResolveAll,
  onCancel,
}) => {
  const [resolutions, setResolutions] = useState<{ [conflictId: string]: { resolution: 'local' | 'server' | 'merged'; mergedValue?: any } }>({});
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);

  const handleResolutionChange = useCallback((conflictId: string, resolution: 'local' | 'server' | 'merged', mergedValue?: any) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: { resolution, mergedValue },
    }));
  }, []);

  const handleResolveAll = useCallback(() => {
    if (Object.keys(resolutions).length !== conflicts.length) {
      Alert.alert(
        'Incomplete Resolutions',
        'Please resolve all conflicts before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    onResolveAll(resolutions);
    setResolutions({});
  }, [resolutions, conflicts.length, onResolveAll]);

  const handleResolveIndividual = useCallback((conflictId: string) => {
    const resolution = resolutions[conflictId];
    if (resolution) {
      onResolve(conflictId, resolution.resolution, resolution.mergedValue);
      setResolutions(prev => {
        const newResolutions = { ...prev };
        delete newResolutions[conflictId];
        return newResolutions;
      });
    }
  }, [resolutions, onResolve]);

  const getResolutionColor = (resolution: 'local' | 'server' | 'merged') => {
    switch (resolution) {
      case 'local':
        return Colors.status.warning;
      case 'server':
        return Colors.status.info;
      case 'merged':
        return Colors.status.success;
      default:
        return Colors.text.secondary;
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'None';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <GlassCard intensity={GlassIntensity.strong} cornerRadius={CornerRadius.large} style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>🔄 Sync Conflicts Detected</Text>
          <Text style={styles.subtitle}>
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
          </Text>
        </View>

        <ScrollView style={styles.conflictsList} showsVerticalScrollIndicator={false}>
          {conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <TouchableOpacity
                style={styles.conflictHeader}
                onPress={() => setExpandedConflict(expandedConflict === conflict.id ? null : conflict.id)}
              >
                <View style={styles.conflictInfo}>
                  <Text style={styles.conflictTitle}>
                    {conflict.entityType}: {conflict.field}
                  </Text>
                  <Text style={styles.conflictSubtitle}>
                    {conflict.entityId}
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedConflict === conflict.id ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedConflict === conflict.id && (
                <View style={styles.conflictDetails}>
                  <View style={styles.valueComparison}>
                    <View style={styles.valueCard}>
                      <LinearGradient
                        colors={[Colors.status.warning, Colors.status.error]}
                        style={styles.valueGradient}
                      >
                        <Text style={styles.valueLabel}>Local Value</Text>
                        <Text style={styles.valueText}>{formatValue(conflict.localValue)}</Text>
                        <Text style={styles.timestampText}>
                          {formatTimestamp(conflict.localTimestamp)}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.valueCard}>
                      <LinearGradient
                        colors={[Colors.status.info, Colors.status.success]}
                        style={styles.valueGradient}
                      >
                        <Text style={styles.valueLabel}>Server Value</Text>
                        <Text style={styles.valueText}>{formatValue(conflict.serverValue)}</Text>
                        <Text style={styles.timestampText}>
                          {formatTimestamp(conflict.serverTimestamp)}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>

                  <View style={styles.resolutionOptions}>
                    <Text style={styles.resolutionTitle}>Choose Resolution:</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.resolutionOption,
                        resolutions[conflict.id]?.resolution === 'local' && styles.selectedOption,
                      ]}
                      onPress={() => handleResolutionChange(conflict.id, 'local')}
                    >
                      <Text style={styles.resolutionOptionText}>Use Local Value</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.resolutionOption,
                        resolutions[conflict.id]?.resolution === 'server' && styles.selectedOption,
                      ]}
                      onPress={() => handleResolutionChange(conflict.id, 'server')}
                    >
                      <Text style={styles.resolutionOptionText}>Use Server Value</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.resolutionOption,
                        resolutions[conflict.id]?.resolution === 'merged' && styles.selectedOption,
                      ]}
                      onPress={() => handleResolutionChange(conflict.id, 'merged', `${conflict.localValue} | ${conflict.serverValue}`)}
                    >
                      <Text style={styles.resolutionOptionText}>Merge Values</Text>
                    </TouchableOpacity>
                  </View>

                  {resolutions[conflict.id] && (
                    <TouchableOpacity
                      style={[styles.resolveButton, { backgroundColor: getResolutionColor(resolutions[conflict.id].resolution) }]}
                      onPress={() => handleResolveIndividual(conflict.id)}
                    >
                      <Text style={styles.resolveButtonText}>
                        Resolve Conflict
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resolveAllButton,
              Object.keys(resolutions).length !== conflicts.length && styles.disabledButton,
            ]}
            onPress={handleResolveAll}
            disabled={Object.keys(resolutions).length !== conflicts.length}
          >
            <Text style={styles.resolveAllButtonText}>
              Resolve All ({Object.keys(resolutions).length}/{conflicts.length})
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  conflictsList: {
    maxHeight: 400,
  },
  conflictCard: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  conflictSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  expandIcon: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },
  conflictDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  valueComparison: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  valueCard: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  valueGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  valueLabel: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  valueText: {
    ...Typography.body,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  timestampText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.8,
    fontSize: 10,
  },
  resolutionOptions: {
    marginBottom: Spacing.md,
  },
  resolutionTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  resolutionOption: {
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.xs,
  },
  selectedOption: {
    backgroundColor: Colors.status.info,
    borderColor: Colors.status.info,
  },
  resolutionOptionText: {
    ...Typography.body,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  resolveButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  resolveAllButton: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.status.success,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.text.tertiary,
  },
  resolveAllButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
});

export default SyncConflictResolutionModal;
