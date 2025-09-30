/**
 * 📸 Photo Evidence Capture
 * Purpose: Complete photo capture and management system for task evidence
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface PhotoEvidenceCaptureProps {
  task: OperationalDataTaskAssignment;
  onPhotoCaptured: (photoData: PhotoEvidenceData) => void;
  onClose: () => void;
  existingPhotos?: PhotoEvidenceData[];
}

export interface PhotoEvidenceData {
  id: string;
  taskId: string;
  buildingId: string;
  workerId: string;
  photoPath: string;
  photoCategory: PhotoCategory;
  notes: string;
  takenAt: Date;
  uploadedAt?: Date;
  isSynced: boolean;
  metadata: PhotoMetadata;
}

export interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  weatherCondition?: string;
  temperature?: number;
  buildingName?: string;
  taskName?: string;
}

export enum PhotoCategory {
  BEFORE = 'before',
  DURING = 'during',
  AFTER = 'after',
  ISSUE = 'issue',
  COMPLETION = 'completion',
  SAFETY = 'safety',
  COMPLIANCE = 'compliance',
  GENERAL = 'general'
}

export const PhotoEvidenceCapture: React.FC<PhotoEvidenceCaptureProps> = ({
  task,
  onPhotoCaptured,
  onClose,
  existingPhotos = [],
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>(PhotoCategory.DURING);
  const [notes, setNotes] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoEvidenceData[]>(existingPhotos);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (photo) {
        const photoData: PhotoEvidenceData = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId: task.id,
          buildingId: task.assigned_building_id || '',
          workerId: task.assigned_worker_id || '',
          photoPath: photo.uri,
          photoCategory: selectedCategory,
          notes: notes,
          takenAt: new Date(),
          isSynced: false,
          metadata: {
            latitude: photo.exif?.GPSLatitude,
            longitude: photo.exif?.GPSLongitude,
            accuracy: photo.exif?.GPSHPositioningError,
            buildingName: task.assigned_building_id,
            taskName: task.name,
          }
        };

        setCapturedPhotos(prev => [...prev, photoData]);
        onPhotoCaptured(photoData);
        
        Alert.alert(
          'Photo Captured',
          'Photo evidence has been saved successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const photoData: PhotoEvidenceData = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId: task.id,
          buildingId: task.assigned_building_id || '',
          workerId: task.assigned_worker_id || '',
          photoPath: asset.uri,
          photoCategory: selectedCategory,
          notes: notes,
          takenAt: new Date(),
          isSynced: false,
          metadata: {
            buildingName: task.assigned_building_id,
            taskName: task.name,
          }
        };

        setCapturedPhotos(prev => [...prev, photoData]);
        onPhotoCaptured(photoData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image from gallery.');
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      <Text style={styles.categoryLabel}>Photo Category:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {Object.values(PhotoCategory).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText,
            ]}>
              {category.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCameraControls = () => (
    <View style={styles.cameraControls}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setCameraType(
          cameraType === CameraType.back ? CameraType.front : CameraType.back
        )}
      >
        <Text style={styles.controlButtonText}>🔄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.captureButton, isCapturing && styles.capturingButton]}
        onPress={takePicture}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <ActivityIndicator color={Colors.text.primary} />
        ) : (
          <Text style={styles.captureButtonText}>📸</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setFlashMode(
          flashMode === FlashMode.off ? FlashMode.on : FlashMode.off
        )}
      >
        <Text style={styles.controlButtonText}>
          {flashMode === FlashMode.off ? '⚡' : '⚡'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhotoGallery = () => (
    <Modal
      visible={showGallery}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowGallery(false)}
    >
      <View style={styles.galleryContainer}>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>Photo Evidence</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowGallery(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.galleryScroll}>
          {capturedPhotos.map(photo => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.photoPath }} style={styles.photoThumbnail} />
              <View style={styles.photoInfo}>
                <Text style={styles.photoCategory}>
                  {photo.photoCategory.toUpperCase()}
                </Text>
                <Text style={styles.photoDate}>
                  {photo.takenAt.toLocaleString()}
                </Text>
                {photo.notes && (
                  <Text style={styles.photoNotes}>{photo.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to capture photos.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Photo Evidence</Text>
          <Text style={styles.subtitle}>{task.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {renderCategorySelector()}

        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskCategory}>{task.category}</Text>
              </View>
            </View>
          </Camera>
        </View>

        {renderCameraControls()}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => setShowGallery(true)}
          >
            <Text style={styles.galleryButtonText}>
              📷 Gallery ({capturedPhotos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickButton}
            onPress={pickImageFromGallery}
          >
            <Text style={styles.pickButtonText}>📁 Pick from Gallery</Text>
          </TouchableOpacity>
        </View>

        {renderPhotoGallery()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  categorySelector: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  categoryLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderColor: Colors.primary.blue,
  },
  categoryButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: Spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  taskInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.md,
    borderRadius: 8,
  },
  taskName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  taskCategory: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.text.primary,
  },
  capturingButton: {
    backgroundColor: Colors.status.warning,
  },
  captureButtonText: {
    fontSize: 32,
  },
  bottomControls: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  galleryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.green,
    borderRadius: 12,
    alignItems: 'center',
  },
  galleryButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  pickButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.purple,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  permissionText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
  },
  permissionButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  galleryTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  galleryScroll: {
    flex: 1,
    padding: Spacing.lg,
  },
  photoItem: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  photoInfo: {
    flex: 1,
  },
  photoCategory: {
    ...Typography.subheadline,
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  photoDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  photoNotes: {
    ...Typography.body,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
});

export default PhotoEvidenceCapture;
