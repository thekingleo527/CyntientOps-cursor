/**
 * 📸 Photo Capture Modal
 * Purpose: Attach photo evidence via PhotoEvidenceManager using either
 * - Expo ImagePicker (if available), or
 * - Fallback: latest photo from MediaLibrary
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DatabaseManager } from '@cyntientops/database';
import { PhotoEvidenceManager } from '@cyntientops/managers';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as MediaLibrary from 'expo-media-library';

type PhotoCaptureRoute = RouteProp<RootStackParamList, 'PhotoCaptureModal'>;

export const PhotoCaptureModal: React.FC = () => {
  const route = useRoute<PhotoCaptureRoute>();
  const { taskId } = route.params;

  const [isBusy, setIsBusy] = useState(false);

  const handleAttach = async () => {
    try {
      setIsBusy(true);
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const manager = PhotoEvidenceManager.getInstance(db);
      // Derive building/worker from DB task
      const taskRow = await db.getFirst(
        'SELECT assigned_building_id as buildingId, assigned_worker_id as workerId, name as taskName FROM tasks WHERE id = ?',
        [taskId]
      );
      const buildingId = taskRow?.buildingId || 'unknown_building';
      const workerId = taskRow?.workerId || 'unknown_worker';
      const taskName = taskRow?.taskName || 'Task';

      // Try ImagePicker if available
      let imageUri: string | null = null;
      try {
        // Dynamic require to avoid type/dep issues if not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ImagePicker: any = require('expo-image-picker');
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm?.granted) {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            imageUri = result.assets[0].uri;
          }
        }
      } catch {}

      // Fallback: grab latest photo from library
      if (!imageUri) {
        const perm2 = await MediaLibrary.requestPermissionsAsync();
        if (!perm2.granted) throw new Error('Media library permission denied');
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 1,
          sortBy: MediaLibrary.SortBy.modificationTime,
        });
        if (assets.assets.length === 0) throw new Error('No photos found');
        const info = await MediaLibrary.getAssetInfoAsync(assets.assets[0]);
        imageUri = info.localUri || info.uri || null;
      }

      if (!imageUri) throw new Error('No image selected');

      await manager.addPhoto({
        buildingId,
        workerId,
        taskId,
        imageUri,
        category: 'general',
        notes: 'Uploaded from library',
        source: 'gallery',
        metadata: { taskName, buildingName: buildingId },
      } as any);

      Alert.alert('Photo Attached', 'Photo evidence saved.');
    } catch (err) {
      Alert.alert('Failed', 'Unable to attach photo evidence.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Photo Evidence</Text>
        <Text style={styles.subtitle}>Task: {taskId}</Text>
        <TouchableOpacity style={[styles.button, isBusy && styles.buttonDisabled]} onPress={handleAttach} disabled={isBusy}>
          <Text style={styles.buttonText}>{isBusy ? 'Saving…' : 'Pick From Library'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
          onPress={async () => {
            try {
              setIsBusy(true);
              const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
              await db.initialize();
              const manager = PhotoEvidenceManager.getInstance(db);
              const taskRow = await db.getFirst(
                'SELECT assigned_building_id as buildingId, assigned_worker_id as workerId, name as taskName FROM tasks WHERE id = ?',
                [taskId]
              );
              const buildingId = taskRow?.buildingId || 'unknown_building';
              const workerId = taskRow?.workerId || 'unknown_worker';
              const taskName = taskRow?.taskName || 'Task';

              // Dynamic ImagePicker camera capture
              const ImagePicker: any = require('expo-image-picker');
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm?.granted) {
                Alert.alert('Permission', 'Camera permission is required');
                setIsBusy(false);
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
              });
              if (result.canceled || !result.assets || result.assets.length === 0) {
                setIsBusy(false);
                return;
              }
              const imageUri = result.assets[0].uri;
              await manager.addPhoto({
                buildingId,
                workerId,
                taskId,
                imageUri,
                category: 'general',
                notes: 'Captured via camera',
                source: 'camera',
                metadata: { taskName, buildingName: buildingId },
              } as any);
              Alert.alert('Photo Attached', 'Photo evidence saved.');
            } catch (err) {
              Alert.alert('Failed', 'Unable to capture photo.');
            } finally {
              setIsBusy(false);
            }
          }}
          disabled={isBusy}
        >
          <Text style={styles.buttonText}>{isBusy ? 'Saving…' : 'Take Photo'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#d1d5db', fontSize: 14, marginBottom: 24 },
  button: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#3b82f6', marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
});

export default PhotoCaptureModal;
