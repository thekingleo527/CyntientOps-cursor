/**
 * 📸 Photo Capture Modal
 * Mirrors: CyntientOps/Views/Modals/PhotoCaptureModal.swift
 * Purpose: Camera integration for task documentation and evidence
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

interface PhotoCaptureModalProps {
  visible: boolean;
  task: OperationalDataTaskAssignment;
  onClose: () => void;
  onPhotoCaptured: (photoUri: string, metadata: any) => void;
}

const { width, height } = Dimensions.get('window');

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  visible,
  task,
  onClose,
  onPhotoCaptured
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      const metadata = {
        taskId: task.id,
        taskName: task.name,
        timestamp: new Date().toISOString(),
        location: null, // Would be populated with GPS coordinates
        category: task.category,
        requiresPhoto: task.requires_photo,
      };

      onPhotoCaptured(photo.uri, metadata);
      onClose();
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
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
        const metadata = {
          taskId: task.id,
          taskName: task.name,
          timestamp: new Date().toISOString(),
          location: null,
          category: task.category,
          requiresPhoto: task.requires_photo,
          source: 'gallery',
        };

        onPhotoCaptured(result.assets[0].uri, metadata);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(current => 
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera permission is required to take photos</Text>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photo Evidence</Text>
          <TouchableOpacity style={styles.headerButton} onPress={pickImageFromGallery}>
            <Text style={styles.headerButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskCategory}>{task.category}</Text>
        </View>

        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
            ratio="4:3"
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Text style={styles.controlButtonText}>
              {flashMode === FlashMode.on ? 'Flash On' : 'Flash Off'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
            <Text style={styles.controlButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Take a clear photo showing the completed work or current condition
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1f1f1f',
  },
  taskName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskCategory: {
    color: '#10b981',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoCaptureModal;
