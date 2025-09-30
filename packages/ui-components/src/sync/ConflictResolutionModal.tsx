/**
 * @cyntientops/ui-components
 * 
 * Conflict Resolution Modal
 * Purpose: UI for resolving sync conflicts with multiple strategies
 * Features: Auto-merge, manual resolution, field-level selection, visual comparison
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface Conflict {
  id: string;
  recordId: string;
  tableName: string;
  type: 'update_update' | 'update_delete' | 'delete_delete';
  localVersion: any;
  serverVersion: any;
  commonAncestor?: any;
  detectedAt: number;
  status: 'pending' | 'resolved' | 'deferred';
  resolution?: any;
}

export type ResolutionStrategy =
  | 'auto_merge'
  | 'prefer_local'
  | 'prefer_server'
  | 'prefer_newer'
  | 'manual'
  | 'field_level';

interface ConflictResolutionModalProps {
  conflict: Conflict;
  visible: boolean;
  onResolve: (strategy: ResolutionStrategy, data?: any) => void;
  onCancel: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  visible,
  onResolve,
  onCancel,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>('auto_merge');
  const [fieldSelections, setFieldSelections] = useState<{ [key: string]: 'local' | 'server' }>({});

  const handleResolve = () => {
    if (selectedStrategy === 'field_level') {
      onResolve(selectedStrategy, fieldSelections);
    } else {
      onResolve(selectedStrategy);
    }
  };

  const renderFieldComparison = () => {
    const fields = new Set([
      ...Object.keys(conflict.localVersion.data || {}),
      ...Object.keys(conflict.serverVersion.data || {}),
    ]);

    return Array.from(fields).map(field => {
      const localValue = conflict.localVersion.data?.[field];
      const serverValue = conflict.serverVersion.data?.[field];
      const isConflict = localValue !== serverValue;

      if (!isConflict) return null;

      return (
        <View key={field} style={styles.fieldComparison}>
          <Text style={styles.fieldName}>{field}</Text>

          <TouchableOpacity
            style={[
              styles.versionOption,
              fieldSelections[field] === 'local' && styles.versionSelected,
            ]}
            onPress={() => setFieldSelections({ ...fieldSelections, [field]: 'local' })}
          >
            <Text style={styles.versionLabel}>Local</Text>
            <Text style={styles.versionValue}>{JSON.stringify(localValue)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.versionOption,
              fieldSelections[field] === 'server' && styles.versionSelected,
            ]}
            onPress={() => setFieldSelections({ ...fieldSelections, [field]: 'server' })}
          >
            <Text style={styles.versionLabel}>Server</Text>
            <Text style={styles.versionValue}>{JSON.stringify(serverValue)}</Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Resolve Sync Conflict</Text>
            <Text style={styles.subtitle}>
              {conflict.tableName} • {conflict.type}
            </Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.strategySection}>
              <Text style={styles.sectionTitle}>Resolution Strategy</Text>

              <TouchableOpacity
                style={[
                  styles.strategyOption,
                  selectedStrategy === 'auto_merge' && styles.strategySelected,
                ]}
                onPress={() => setSelectedStrategy('auto_merge')}
              >
                <Text style={styles.strategyName}>Auto Merge</Text>
                <Text style={styles.strategyDescription}>
                  Automatically merge changes using 3-way merge
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.strategyOption,
                  selectedStrategy === 'prefer_local' && styles.strategySelected,
                ]}
                onPress={() => setSelectedStrategy('prefer_local')}
              >
                <Text style={styles.strategyName}>Use Local Version</Text>
                <Text style={styles.strategyDescription}>
                  Keep your local changes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.strategyOption,
                  selectedStrategy === 'prefer_server' && styles.strategySelected,
                ]}
                onPress={() => setSelectedStrategy('prefer_server')}
              >
                <Text style={styles.strategyName}>Use Server Version</Text>
                <Text style={styles.strategyDescription}>
                  Accept server changes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.strategyOption,
                  selectedStrategy === 'field_level' && styles.strategySelected,
                ]}
                onPress={() => setSelectedStrategy('field_level')}
              >
                <Text style={styles.strategyName}>Field-by-Field</Text>
                <Text style={styles.strategyDescription}>
                  Choose per field
                </Text>
              </TouchableOpacity>
            </View>

            {selectedStrategy === 'field_level' && (
              <View style={styles.fieldsSection}>
                <Text style={styles.sectionTitle}>Choose Fields</Text>
                {renderFieldComparison()}
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
              <Text style={styles.resolveText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.baseBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  scrollView: {
    flex: 1,
  },
  strategySection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  strategyOption: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategySelected: {
    borderColor: Colors.primaryAction,
    backgroundColor: Colors.primaryAction + '20',
  },
  strategyName: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 4,
  },
  strategyDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  fieldsSection: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldComparison: {
    marginBottom: Spacing.lg,
  },
  fieldName: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  versionOption: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  versionSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '20',
  },
  versionLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionValue: {
    ...Typography.body,
    color: Colors.primaryText,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.bodyLarge,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  resolveButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primaryAction,
    borderRadius: 12,
    alignItems: 'center',
  },
  resolveText: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: '600',
  },
});
