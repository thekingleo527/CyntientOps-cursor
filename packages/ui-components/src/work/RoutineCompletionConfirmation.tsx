/**
 * ✅ Routine Completion Confirmation
 * Purpose: Confirm routine completion with verification methods
 * Features: Photo verification, GPS location, quality scoring, issue reporting
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { WorkCompletionManager, RoutineCompletion } from '@cyntientops/managers';

export interface RoutineCompletionConfirmationProps {
  routineId: string;
  routineTitle: string;
  buildingId: string;
  buildingName: string;
  workerId: string;
  workerName: string;
  location: string;
  workCompletionManager: WorkCompletionManager;
  onCompletionConfirmed: (completion: RoutineCompletion) => void;
  onCancel: () => void;
}

export const RoutineCompletionConfirmation: React.FC<RoutineCompletionConfirmationProps> = ({
  routineId,
  routineTitle,
  buildingId,
  buildingName,
  workerId,
  workerName,
  location,
  workCompletionManager,
  onCompletionConfirmed,
  onCancel,
}) => {
  const [verificationMethod, setVerificationMethod] = useState<'photo' | 'signature' | 'gps' | 'manual'>('photo');
  const [qualityScore, setQualityScore] = useState<number>(8);
  const [notes, setNotes] = useState('');
  const [issuesFound, setIssuesFound] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmCompletion = async () => {
    setIsSubmitting(true);
    try {
      const completion: RoutineCompletion = {
        id: `routine_${routineId}_${Date.now()}`,
        buildingId,
        routineId,
        routineTitle,
        workerId,
        workerName,
        completedAt: new Date(),
        location,
        verificationMethod,
        notes: notes.trim() || undefined,
        qualityScore,
        issuesFound: issuesFound.length > 0 ? issuesFound : undefined,
      };

      await workCompletionManager.recordRoutineCompletion(completion);
      onCompletionConfirmed(completion);
    } catch (error) {
      console.error('Failed to confirm routine completion:', error);
      Alert.alert('Error', 'Failed to confirm routine completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIssue = () => {
    Alert.prompt(
      'Add Issue',
      'Describe any issues found during this routine:',
      (text) => {
        if (text && text.trim()) {
          setIssuesFound([...issuesFound, text.trim()]);
        }
      }
    );
  };

  const removeIssue = (index: number) => {
    setIssuesFound(issuesFound.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <GlassCard style={styles.headerCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.headerTitle}>✅ Confirm Routine Completion</Text>
          <Text style={styles.routineTitle}>{routineTitle}</Text>
          <Text style={styles.buildingInfo}>{buildingName}</Text>
          <Text style={styles.locationInfo}>📍 {location}</Text>
        </GlassCard>

        <GlassCard style={styles.verificationCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Verification Method</Text>
          <View style={styles.verificationOptions}>
            {(['photo', 'signature', 'gps', 'manual'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.verificationOption,
                  verificationMethod === method && styles.verificationOptionSelected
                ]}
                onPress={() => setVerificationMethod(method)}
              >
                <Text style={[
                  styles.verificationOptionText,
                  verificationMethod === method && styles.verificationOptionTextSelected
                ]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.qualityCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Quality Score</Text>
          <Text style={styles.qualityDescription}>Rate the quality of work completed (1-10)</Text>
          <View style={styles.qualityOptions}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <TouchableOpacity
                key={score}
                style={[
                  styles.qualityOption,
                  qualityScore === score && styles.qualityOptionSelected
                ]}
                onPress={() => setQualityScore(score)}
              >
                <Text style={[
                  styles.qualityOptionText,
                  qualityScore === score && styles.qualityOptionTextSelected
                ]}>
                  {score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.issuesCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <View style={styles.issuesHeader}>
            <Text style={styles.sectionTitle}>Issues Found</Text>
            <TouchableOpacity style={styles.addIssueButton} onPress={addIssue}>
              <Text style={styles.addIssueButtonText}>+ Add Issue</Text>
            </TouchableOpacity>
          </View>
          
          {issuesFound.length === 0 ? (
            <Text style={styles.noIssuesText}>No issues found</Text>
          ) : (
            issuesFound.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <Text style={styles.issueText}>{issue}</Text>
                <TouchableOpacity
                  style={styles.removeIssueButton}
                  onPress={() => removeIssue(index)}
                >
                  <Text style={styles.removeIssueButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard style={styles.notesCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional notes about this routine completion..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </GlassCard>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
            onPress={handleConfirmCompletion}
            disabled={isSubmitting}
          >
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? 'Confirming...' : 'Confirm Completion'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.md,
  },
  headerCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  routineTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  buildingInfo: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  locationInfo: {
    ...Typography.body,
    color: Colors.tertiaryText,
  },
  verificationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  verificationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  verificationOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.glassOverlay,
  },
  verificationOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  verificationOptionText: {
    ...Typography.body,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  verificationOptionTextSelected: {
    color: 'white',
  },
  qualityCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  qualityDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  qualityOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  qualityOptionText: {
    ...Typography.body,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  qualityOptionTextSelected: {
    color: 'white',
  },
  issuesCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  issuesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addIssueButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  addIssueButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  noIssuesText: {
    ...Typography.body,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  issueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.glassOverlay,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  issueText: {
    ...Typography.body,
    color: Colors.primaryText,
    flex: 1,
    marginRight: Spacing.sm,
  },
  removeIssueButton: {
    padding: Spacing.xs,
  },
  removeIssueButtonText: {
    ...Typography.body,
    color: Colors.critical,
    fontWeight: 'bold',
  },
  notesCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    ...Typography.body,
    color: Colors.primaryText,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.glassOverlay,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.success,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
  confirmButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default RoutineCompletionConfirmation;
