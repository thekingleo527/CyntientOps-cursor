/**
 * 📸 Photo Capture Modal
 * Adds intelligent tagging flow: space selection + tags, then compresses and saves
 */

import React, { useEffect, useState } from 'react';
import config from '../config/app.config';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DatabaseManager } from '@cyntientops/database';
import { PhotoEvidenceManager } from '@cyntientops/managers';
import { TagSuggestionService } from '@cyntientops/business-core';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as MediaLibrary from 'expo-media-library';

type PhotoCaptureRoute = RouteProp<RootStackParamList, 'PhotoCaptureModal'>;

export const PhotoCaptureModal: React.FC = () => {
  const route = useRoute<PhotoCaptureRoute>();
  const { taskId, buildingId: routeBuildingId } = route.params || {};

  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState<'pick' | 'tag' | 'done'>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(routeBuildingId || null);
  const [workerId, setWorkerId] = useState<string>('unknown_worker');
  const [taskName, setTaskName] = useState<string>('Task');
  const [spaces, setSpaces] = useState<Array<any>>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [suggestedSpaceId, setSuggestedSpaceId] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState<string>('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const commonTags = TagSuggestionService.getCommonTags();

  // When user selects space, enrich tag suggestions
  useEffect(() => {
    try {
      const sp = spaces.find(s => s.id === selectedSpaceId) || spaces.find(s => s.id === suggestedSpaceId);
      const merged = TagSuggestionService.getSuggestions({ taskName, buildingName: (buildingId || routeBuildingId || undefined) as any, space: sp ? { name: sp.name, floor: sp.floor, category: sp.category } : undefined });
      setSuggestedTags(merged);
    } catch (error) {
      console.warn('Failed to get tag suggestions:', error);
      // Non-critical: User can still add tags manually
    }
      }, [selectedSpaceId, suggestedSpaceId]);

  const handleAttach = async () => {
    try {
      setIsBusy(true);
      const db = DatabaseManager.getInstance({ path: config.databasePath });
      await db.initialize();

      const manager = PhotoEvidenceManager.getInstance(db);
      // Resolve building/worker from task if provided
      if (taskId) {
        const taskRow = await db.getFirst(
          'SELECT assigned_building_id as buildingId, assigned_worker_id as workerId, name as taskName FROM tasks WHERE id = ?',
          [taskId]
        );
        setBuildingId(taskRow?.buildingId || routeBuildingId || 'unknown_building');
        setWorkerId(taskRow?.workerId || 'unknown_worker');
        setTaskName(taskRow?.taskName || 'Task');
      }

      // Try ImagePicker if available
      let chosenUri: string | null = null;
      try {
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
            chosenUri = result.assets[0].uri;
          }
        }
      } catch (error) {
        console.warn('Failed to process camera photo:', error);
        // Non-critical: Will fallback to library photo
      }

      // Fallback: grab latest photo from library
      if (!chosenUri) {
        const perm2 = await MediaLibrary.requestPermissionsAsync();
        if (!perm2.granted) throw new Error('Media library permission denied');
        const assets = await MediaLibrary.getAssetsAsync({ mediaType: 'photo', first: 1, sortBy: MediaLibrary.SortBy.modificationTime });
        if (assets.assets.length === 0) throw new Error('No photos found');
        const info = await MediaLibrary.getAssetInfoAsync(assets.assets[0]);
        chosenUri = info.localUri || info.uri || null;
      }

      if (!chosenUri) throw new Error('No image selected');

      // Load spaces and basic suggestion (if possible)
      const bId = buildingId || routeBuildingId || 'unknown_building';
      const spaceList = await manager.getBuildingSpaces(bId);
      setSpaces(spaceList);
      // Try basic location suggestion with expo-location
      try {
        const Location: any = require('expo-location');
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm?.status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, maximumAge: 10000, timeout: 15000 });
          const { latitude, longitude } = pos.coords;
          const toRad = (v: number) => (v * Math.PI) / 180;
          const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371e3; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
            return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };
          let best: any = null; let bestDist = Infinity;
          for (const sp of spaceList) {
            if (sp.coordinates) {
              const dist = distance(latitude, longitude, sp.coordinates.latitude, sp.coordinates.longitude);
              if (dist < bestDist && dist <= (sp.coordinates.radius || 50)) { best = sp; bestDist = dist; }
            }
          }
          if (best) { setSuggestedSpaceId(best.id); setSelectedSpaceId(best.id); }
        }
      } catch (error) {
        console.warn('Failed to suggest space for photo:', error);
        // Non-critical: User can select space manually
      }

      setImageUri(chosenUri);
      // initialize base tag suggestions
      try {
        const baseTags = TagSuggestionService.getSuggestions({ taskName, buildingName: (buildingId || routeBuildingId || undefined) as any });
        setSuggestedTags(baseTags);
      } catch (error) {
        console.warn('Failed to get base tag suggestions:', error);
        // Non-critical: User can add tags manually
      }
      setStep('tag');
    } catch (err) {
      Alert.alert('Failed', 'Unable to attach photo evidence.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === 'pick' && (
        <View style={styles.content}>
          <Text style={styles.title}>Photo Evidence</Text>
          {!!taskId && <Text style={styles.subtitle}>Task: {taskId}</Text>}
          <TouchableOpacity style={[styles.button, isBusy && styles.buttonDisabled]} onPress={handleAttach} disabled={isBusy}>
            <Text style={styles.buttonText}>{isBusy ? 'Loading…' : 'Pick From Library'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 'tag' && (
        <ScrollView contentContainerStyle={[styles.content, { alignItems: 'stretch' }]}>
          <Text style={styles.title}>Confirm Location & Tags</Text>
          <Text style={styles.subtitle}>Building: {buildingId || '—'}</Text>
          <Text style={styles.subtitle}>Suggested: {spaces.find(s => s.id === suggestedSpaceId)?.name || '—'}</Text>
          <View style={{ marginVertical: 12 }}>
            <Text style={styles.inputLabel}>Select Space</Text>
            {spaces.length === 0 ? (
              <Text style={styles.subtitle}>No spaces found for this building</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {spaces.map((sp) => (
                  <TouchableOpacity key={sp.id} style={[styles.spaceOption, selectedSpaceId === sp.id && styles.spaceOptionSelected]} onPress={() => setSelectedSpaceId(sp.id)}>
                    <Text style={[styles.spaceOptionText, selectedSpaceId === sp.id && styles.spaceOptionTextSelected]}>
                      {sp.name}{sp.floor !== undefined ? ` • Floor ${sp.floor}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={{ marginVertical: 12 }}>
            <Text style={styles.inputLabel}>Suggestions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {suggestedTags.map(tag => (
                <TouchableOpacity key={tag} style={styles.suggestChip} onPress={() => {
                  const existing = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                  if (!existing.includes(tag)) {
                    const next = existing.concat(tag).join(', ');
                    setTagsText(next);
                  }
                }}>
                  <Text style={styles.suggestChipText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginVertical: 12 }}>
            <Text style={styles.inputLabel}>Common</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {commonTags.map(tag => (
                <TouchableOpacity key={tag} style={styles.suggestChip} onPress={() => {
                  const existing = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                  if (!existing.includes(tag)) {
                    const next = existing.concat(tag).join(', ');
                    setTagsText(next);
                  }
                }}>
                  <Text style={styles.suggestChipText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginVertical: 12 }}>
            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
            <TextInput style={styles.textInput} placeholder="lobby, cleaning, floor_1" placeholderTextColor="#9CA3AF" value={tagsText} onChangeText={setTagsText} />
          </View>
          <TouchableOpacity
            style={[styles.button, (!imageUri || !buildingId || isBusy) && styles.buttonDisabled]}
            disabled={!imageUri || !buildingId || isBusy}
            onPress={async () => {
              try {
                setIsBusy(true);
                const db = DatabaseManager.getInstance({ path: config.databasePath });
                await db.initialize();
                const manager = PhotoEvidenceManager.getInstance(db);
                const bId = buildingId || routeBuildingId || 'unknown_building';
                const wId = workerId;
                const tName = taskName;
                const selectedSpace = spaces.find(s => s.id === selectedSpaceId) || spaces.find(s => s.id === suggestedSpaceId) || null;

                const { intelligentPhotoStorage } = require('@cyntientops/business-core');
                const storageResult = await intelligentPhotoStorage.processAndStorePhoto(
                  imageUri!,
                  intelligentPhotoStorage.getOptimalSettingsForTaskType('cleaning'),
                  { taskId: taskId || 'manual', taskTitle: tName, category: 'general', workerId: wId, buildingId: bId }
                );

                const tags = tagsText.split(',').map((t: string) => t.trim()).filter(Boolean);

                const saved = await manager.addPhoto({
                  buildingId: bId,
                  workerId: wId,
                  taskId: taskId || 'manual_upload',
                  imageUri: storageResult.compressedUri,
                  thumbnailUri: storageResult.thumbnailUri,
                  category: 'general',
                  notes: `Auto‑compressed (${Math.round(storageResult.compressionRatio * 100)} of original)` ,
                  source: 'gallery',
                  metadata: {
                    taskName: tName,
                    buildingName: bId,
                    smartLocation: selectedSpace
                      ? { detectedSpace: selectedSpace.name, detectedFloor: selectedSpace.floor, confidence: 90, buildingSpaceId: selectedSpace.id }
                      : undefined,
                  },
                  tags,
                } as any);

                if (selectedSpace) {
                  try { 
                    await manager.specifyWorkerArea(saved.id, selectedSpace.id); 
                  } catch (error) {
                    console.warn('Failed to specify worker area:', error);
                    // Non-critical: Photo is still saved, area can be specified later
                  }
                }

                setStep('done');
                Alert.alert('Photo Attached', 'Photo saved with location and tags.');
              } catch (e) {
                Alert.alert('Failed', 'Unable to save photo.');
              } finally {
                setIsBusy(false);
              }
            }}
          >
            <Text style={styles.buttonText}>{isBusy ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      {step === 'done' && (
        <View style={styles.content}>
          <Text style={styles.title}>Photo Saved</Text>
          <TouchableOpacity style={styles.button} onPress={() => setStep('pick')}>
            <Text style={styles.buttonText}>Add Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#d1d5db', fontSize: 14, marginBottom: 8 },
  button: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700' },
  inputLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, marginTop: 12 },
  textInput: { backgroundColor: '#111827', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  spaceOption: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  spaceOptionSelected: { backgroundColor: '#1f2937' },
  spaceOptionText: { color: '#E5E7EB', fontSize: 14 },
  spaceOptionTextSelected: { color: '#93C5FD', fontWeight: '700' },
  suggestChip: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  suggestChipText: { color: '#9CA3AF', fontSize: 12 },
});

export default PhotoCaptureModal;
