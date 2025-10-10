/**
 * 📋 Task Completion Card
 * Purpose: UI component for marking routine tasks as complete
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { WorkerScheduleItem } from '@cyntientops/business-core';
import type { TaskCompletionInput, TaskCompletionPhoto } from '@cyntientops/business-core';
import { TaskCompletionService } from '@cyntientops/business-core';
import { DatabaseManager } from '@cyntientops/database';

interface TaskCompletionCardProps {
  task: WorkerScheduleItem;
  onComplete?: (completionId: string) => void;
  onCancel?: () => void;
}

export const TaskCompletionCard: React.FC<TaskCompletionCardProps> = ({
  task,
  onComplete,
  onCancel
}) => {
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<TaskCompletionPhoto[]>([]);
  const [qualityRating, setQualityRating] = useState<number | undefined>(undefined);
  const [requiresFollowup, setRequiresFollowup] = useState(false);
  const [followupNotes, setFollowupNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteTask = async (status: 'completed' | 'partial' | 'skipped') => {
    try {
      setIsSubmitting(true);

      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();
      const completionService = TaskCompletionService.getInstance(db);

      const now = new Date().toISOString();
      const completionInput: TaskCompletionInput = {
        routineId: task.routineId,
        workerId: task.workerId,
        buildingId: task.buildingId,
        taskName: task.title,
        scheduledStart: task.startTime.toISOString(),
        scheduledEnd: task.endTime.toISOString(),
        actualStart: now, // Could be tracked more accurately with a timer
        actualEnd: now,
        status,
        photos,
        notes: notes.trim() || undefined,
        locationVerified: true, // Could be enhanced with GPS verification
        qualityRating,
        requiresFollowup,
        followupNotes: followupNotes.trim() || undefined,
        metadata: {
          category: task.category,
          isWeatherDependent: task.isWeatherDependent
        }
      };

      const completion = await completionService.recordCompletion(completionInput);

      Alert.alert(
        'Task Completed',
        `"${task.title}" has been marked as ${status}.`,
        [{ text: 'OK', onPress: () => onComplete?.(completion.id) }]
      );
    } catch (error) {
      console.error('Failed to complete task:', error);
      Alert.alert('Error', 'Failed to save task completion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      // Dynamic require to avoid type/dep issues if not installed
      const ImagePicker: any = require('expo-image-picker');

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Permission', 'Camera permission is required to add photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto: TaskCompletionPhoto = {
          id: `photo_${Date.now()}`,
          uri: result.assets[0].uri,
          timestamp: Date.now(),
          metadata: {
            width: result.assets[0].width,
            height: result.assets[0].height
          }
        };
        setPhotos([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Failed to add photo:', error);
      Alert.alert('Error', 'Failed to add photo');
    }
  };

  const handleRating = (rating: number) => {
    setQualityRating(rating === qualityRating ? undefined : rating);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.buildingName}>{task.buildingName}</Text>
        <Text style={styles.category}>{task.category}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handleAddPhoto}
          disabled={isSubmitting}
        >
          <Text style={styles.addPhotoText}>+ Add Photo</Text>
        </TouchableOpacity>
        {photos.length > 0 && (
          <Text style={styles.photoCount}>{photos.length} photo(s) added</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Rating</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(rating => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                qualityRating === rating && styles.ratingButtonActive
              ]}
              onPress={() => handleRating(rating)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.ratingText,
                  qualityRating === rating && styles.ratingTextActive
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add any notes about this task..."
          placeholderTextColor="#6b7280"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.followupToggle}
          onPress={() => setRequiresFollowup(!requiresFollowup)}
          disabled={isSubmitting}
        >
          <View style={[styles.checkbox, requiresFollowup && styles.checkboxChecked]} />
          <Text style={styles.followupLabel}>Requires Follow-up</Text>
        </TouchableOpacity>

        {requiresFollowup && (
          <TextInput
            style={styles.notesInput}
            placeholder="Follow-up notes..."
            placeholderTextColor="#6b7280"
            value={followupNotes}
            onChangeText={setFollowupNotes}
            multiline
            numberOfLines={3}
            editable={!isSubmitting}
          />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={() => handleCompleteTask('completed')}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving...' : 'Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.partialButton]}
          onPress={() => handleCompleteTask('partial')}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Partial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.skipButton]}
          onPress={() => handleCompleteTask('skipped')}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  taskTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  buildingName: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  category: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  sectionTitle: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  addPhotoButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPhotoText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  photoCount: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#10b981',
  },
  ratingText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingTextActive: {
    color: '#000',
  },
  notesInput: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  followupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  followupLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  partialButton: {
    backgroundColor: '#f59e0b',
  },
  skipButton: {
    backgroundColor: '#6b7280',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    color: '#9ca3af',
  },
});
