/**
 * 📸 Photo Evidence Capture
 * Purpose: Photo evidence management system for task documentation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { smartPhotoRequirement, PhotoCategory, TaskCategory } from '@cyntientops/business-core';
import { intelligentPhotoStorage } from '@cyntientops/business-core';

export interface PhotoEvidenceCaptureProps {
  task: OperationalDataTaskAssignment;
  onPhotoCaptured: (photoData: PhotoEvidenceData) => void;
  onClose: () => void;
  existingPhotos?: PhotoEvidenceData[];
}

export interface PhotoEvidenceData {
  id: string;
  uri: string;
  timestamp: Date;
  category: PhotoCategory;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export enum PhotoCategory {
  BEFORE = 'before',
  DURING = 'during',
  AFTER = 'after',
  ISSUE = 'issue',
  COMPLETION = 'completion'
}

export const PhotoEvidenceCapture: React.FC<PhotoEvidenceCaptureProps> = ({
  task,
  onPhotoCaptured,
  onClose,
  existingPhotos = []
}) => {
  const [photos, setPhotos] = React.useState<PhotoEvidenceData[]>(existingPhotos);
  const [isLoading, setIsLoading] = React.useState(false);
  const [photoRequirements, setPhotoRequirements] = React.useState<any>(null);
  const [smartPrompts, setSmartPrompts] = React.useState<string[]>([]);
  const [photoTips, setPhotoTips] = React.useState<string[]>([]);

  // Initialize smart photo requirements
  React.useEffect(() => {
    const requirements = smartPhotoRequirement.getPhotoRequirements(
      task.title,
      task.category as TaskCategory,
      task.description
    );
    const prompts = smartPhotoRequirement.getSmartPhotoPrompts(
      task.title,
      task.category as TaskCategory,
      task.description
    );
    const tips = smartPhotoRequirement.getPhotoTips(
      task.title,
      task.category as TaskCategory,
      task.description
    );

    setPhotoRequirements(requirements);
    setSmartPrompts(prompts);
    setPhotoTips(tips);
  }, [task]);

  const handleAddPhoto = async (category: PhotoCategory) => {
    if (!photoRequirements?.requiresPhotos) {
      Alert.alert(
        'No Photos Required',
        `This task "${task.title}" does not require photos. ${photoRequirements?.reasoning || ''}`
      );
      return;
    }

    setIsLoading(true);
    try {
      // Simulate photo capture and intelligent processing
      const mockPhotoUri = 'https://via.placeholder.com/300x200/10b981/ffffff?text=Photo+Evidence';
      
      // Process with intelligent storage
      const storageResult = await intelligentPhotoStorage.processAndStorePhoto(
        mockPhotoUri,
        intelligentPhotoStorage.getOptimalSettingsForTaskType(task.category),
        {
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          workerId: 'current_worker',
          buildingId: task.buildingId || 'default'
        }
      );

      const newPhoto: PhotoEvidenceData = {
        id: `photo_${Date.now()}`,
        uri: storageResult.compressedUri,
        timestamp: new Date(),
        category: category,
        notes: `Intelligently processed - ${Math.round(storageResult.compressionRatio * 100)}% compression`
      };

      setPhotos(prev => [...prev, newPhoto]);
    } catch (error) {
      Alert.alert('Error', 'Failed to process photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        }}
      ]
    );
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo before submitting.');
      return;
    }

    setIsLoading(true);
    // Simulate photo processing
    setTimeout(() => {
      photos.forEach(photo => onPhotoCaptured(photo));
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const getCategoryColor = (category: PhotoCategory) => {
    switch (category) {
      case PhotoCategory.BEFORE: return Colors.info;
      case PhotoCategory.DURING: return Colors.primaryAction;
      case PhotoCategory.AFTER: return Colors.success;
      case PhotoCategory.ISSUE: return Colors.warning;
      case PhotoCategory.COMPLETION: return Colors.role.admin.primary;
      default: return Colors.secondaryText;
    }
  };

  const getCategoryIcon = (category: PhotoCategory) => {
    switch (category) {
      case PhotoCategory.BEFORE: return '📷';
      case PhotoCategory.DURING: return '⚡';
      case PhotoCategory.AFTER: return '✅';
      case PhotoCategory.ISSUE: return '⚠️';
      case PhotoCategory.COMPLETION: return '🎯';
      default: return '📸';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 Photo Evidence</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.taskInfo} intensity="regular" cornerRadius="card">
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription}>{task.description}</Text>
          <Text style={styles.taskMeta}>
            📍 {task.buildingName} • ⏰ {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        </GlassCard>

        <GlassCard style={styles.photosSection} intensity="regular" cornerRadius="card">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photo Evidence ({photos.length})</Text>
            {photoRequirements?.requiresPhotos && (
              <Text style={styles.requirementText}>{photoRequirements.reasoning}</Text>
            )}
          </View>

          {/* Smart Photo Requirements */}
          {photoRequirements && (
            <View style={styles.requirementsSection}>
              {!photoRequirements.requiresPhotos ? (
                <View style={styles.noPhotosRequired}>
                  <Text style={styles.noPhotosText}>✅ No photos required for this task</Text>
                  <Text style={styles.noPhotosReason}>{photoRequirements.reasoning}</Text>
                </View>
              ) : (
                <View style={styles.photoRequirements}>
                  <Text style={styles.requirementsTitle}>📸 Required Photos:</Text>
                  <View style={styles.requirementButtons}>
                    {photoRequirements.beforePhoto && (
                      <TouchableOpacity 
                        style={[styles.requirementButton, styles.beforeButton]}
                        onPress={() => handleAddPhoto(PhotoCategory.BEFORE)}
                        disabled={isLoading}
                      >
                        <Text style={styles.requirementButtonText}>📷 BEFORE</Text>
                      </TouchableOpacity>
                    )}
                    {photoRequirements.afterPhoto && (
                      <TouchableOpacity 
                        style={[styles.requirementButton, styles.afterButton]}
                        onPress={() => handleAddPhoto(PhotoCategory.AFTER)}
                        disabled={isLoading}
                      >
                        <Text style={styles.requirementButtonText}>✅ AFTER</Text>
                      </TouchableOpacity>
                    )}
                    {photoRequirements.duringPhoto && (
                      <TouchableOpacity 
                        style={[styles.requirementButton, styles.duringButton]}
                        onPress={() => handleAddPhoto(PhotoCategory.DURING)}
                        disabled={isLoading}
                      >
                        <Text style={styles.requirementButtonText}>⚡ DURING</Text>
                      </TouchableOpacity>
                    )}
                    {photoRequirements.issuePhoto && (
                      <TouchableOpacity 
                        style={[styles.requirementButton, styles.issueButton]}
                        onPress={() => handleAddPhoto(PhotoCategory.ISSUE)}
                        disabled={isLoading}
                      >
                        <Text style={styles.requirementButtonText}>⚠️ ISSUE</Text>
                      </TouchableOpacity>
                    )}
                    {photoRequirements.completionPhoto && (
                      <TouchableOpacity 
                        style={[styles.requirementButton, styles.completionButton]}
                        onPress={() => handleAddPhoto(PhotoCategory.COMPLETION)}
                        disabled={isLoading}
                      >
                        <Text style={styles.requirementButtonText}>🎯 COMPLETION</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Smart Photo Tips */}
          {photoTips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Photo Tips:</Text>
              {photoTips.map((tip, index) => (
                <Text key={index} style={styles.tipText}>{tip}</Text>
              ))}
            </View>
          )}

          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No photos added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add Photo" to start documenting this task</Text>
            </View>
          ) : (
            <View style={styles.photosList}>
              {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
              <View style={styles.photoInfo}>
                    <View style={styles.photoHeader}>
                <Text style={styles.photoCategory}>
                        {getCategoryIcon(photo.category)} {photo.category.toUpperCase()}
                </Text>
                      <Text style={styles.photoTime}>
                        {photo.timestamp.toLocaleTimeString()}
                </Text>
                    </View>
                {photo.notes && (
                  <Text style={styles.photoNotes}>{photo.notes}</Text>
                )}
              </View>
                  <TouchableOpacity 
                    onPress={() => handleRemovePhoto(photo.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
              ))}
            </View>
          )}
        </GlassCard>

          <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primaryText} />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit {photos.length} Photo{photos.length !== 1 ? 's' : ''}
            </Text>
          )}
          </TouchableOpacity>
      </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.primaryText,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    ...Typography.subheadline,
    color: Colors.secondaryText,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  taskInfo: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  taskTitle: {
    ...Typography.headline,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  taskDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  taskMeta: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  photosSection: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    textAlign: 'center',
  },
  photosList: {
    gap: Spacing.sm,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  photoInfo: {
    flex: 1,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  photoCategory: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  photoTime: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  photoNotes: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  removeButtonText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.success,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
  submitButtonText: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  requirementText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  requirementsSection: {
    marginBottom: Spacing.md,
  },
  noPhotosRequired: {
    backgroundColor: Colors.success + '20',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  noPhotosText: {
    ...Typography.subheadline,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noPhotosReason: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  photoRequirements: {
    backgroundColor: Colors.glassOverlay,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  requirementsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  requirementButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  requirementButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  beforeButton: {
    backgroundColor: Colors.info + '20',
    borderColor: Colors.info,
  },
  afterButton: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  duringButton: {
    backgroundColor: Colors.primaryAction + '20',
    borderColor: Colors.primaryAction,
  },
  issueButton: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
  },
  completionButton: {
    backgroundColor: Colors.role.admin.primary + '20',
    borderColor: Colors.role.admin.primary,
  },
  requirementButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsSection: {
    backgroundColor: Colors.glassOverlay,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
});