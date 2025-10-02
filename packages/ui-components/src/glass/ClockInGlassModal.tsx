/**
 * 🎨 Clock In Glass Modal
 * Mirrors: CyntientOps/Components/Glass/ClockInGlassModal.swift
 * Purpose: Glassmorphism clock-in modal with blur effects and location validation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { NamedCoordinate } from '@cyntientops/domain-schema';

export interface ClockInGlassModalProps {
  visible: boolean;
  onClose: () => void;
  onClockIn: (buildingId: string, location: { latitude: number; longitude: number }) => void;
  buildings: NamedCoordinate[];
  currentLocation?: { latitude: number; longitude: number };
  workerName: string;
  showBlur?: boolean;
}

export const ClockInGlassModal: React.FC<ClockInGlassModalProps> = ({
  visible,
  onClose,
  onClockIn,
  buildings,
  currentLocation,
  workerName,
  showBlur = true,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<NamedCoordinate | null>(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [locationValid, setLocationValid] = useState(false);

  useEffect(() => {
    if (visible && currentLocation && selectedBuilding) {
      validateLocation();
    }
  }, [visible, currentLocation, selectedBuilding]);

  const validateLocation = async () => {
    if (!currentLocation || !selectedBuilding) return;

    setIsValidatingLocation(true);
    
    // Simulate location validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple distance calculation (in real app, use proper geolocation)
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedBuilding.latitude,
      selectedBuilding.longitude
    );
    
    // Consider valid if within 100 meters
    setLocationValid(distance <= 0.1);
    setIsValidatingLocation(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const handleClockIn = () => {
    if (!selectedBuilding || !currentLocation) {
      Alert.alert('Error', 'Please select a building and ensure location is available.');
      return;
    }

    if (!locationValid) {
      Alert.alert(
        'Location Validation Failed',
        'You must be within 100 meters of the selected building to clock in.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Force Clock In', style: 'destructive', onPress: () => forceClockIn() },
        ]
      );
      return;
    }

    onClockIn(selectedBuilding.id, currentLocation);
    onClose();
  };

  const forceClockIn = () => {
    if (selectedBuilding && currentLocation) {
      Alert.alert(
        'Force Clock In',
        'Are you sure you want to clock in despite location validation failure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => {
            onClockIn(selectedBuilding.id, currentLocation);
            onClose();
          }},
        ]
      );
    }
  };

  const renderContent = () => (
    <View style={styles.modalContainer}>
      <GlassCard style={styles.modalContent} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <View style={styles.header}>
          <Text style={styles.title}>Clock In</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.workerName}>Welcome, {workerName}</Text>

        <View style={styles.locationStatus}>
          <Text style={styles.locationLabel}>Current Location:</Text>
          {currentLocation ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.locationStatusText}>Location detected</Text>
            </View>
          ) : (
            <Text style={styles.locationError}>Location not available</Text>
          )}
        </View>

        <View style={styles.buildingSelection}>
          <Text style={styles.buildingLabel}>Select Building:</Text>
          <ScrollView style={styles.buildingsList} showsVerticalScrollIndicator={false}>
            {buildings.map(building => (
              <TouchableOpacity
                key={building.id}
                style={[
                  styles.buildingItem,
                  selectedBuilding?.id === building.id && styles.selectedBuildingItem,
                ]}
                onPress={() => setSelectedBuilding(building)}
              >
                <View style={styles.buildingInfo}>
                  <Text style={styles.buildingName}>{building.name}</Text>
                  <Text style={styles.buildingAddress}>{building.address}</Text>
                </View>
                {selectedBuilding?.id === building.id && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedBuilding && (
          <View style={styles.validationStatus}>
            {isValidatingLocation ? (
              <View style={styles.validatingContainer}>
                <ActivityIndicator size="small" color={Colors.status.info} />
                <Text style={styles.validatingText}>Validating location...</Text>
              </View>
            ) : locationValid ? (
              <View style={styles.validContainer}>
                <Text style={styles.validIcon}>✅</Text>
                <Text style={styles.validText}>Location validated - Ready to clock in</Text>
              </View>
            ) : (
              <View style={styles.invalidContainer}>
                <Text style={styles.invalidIcon}>⚠️</Text>
                <Text style={styles.invalidText}>Location validation failed - You may need to be closer to the building</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clockInButton,
              (!selectedBuilding || !currentLocation) && styles.disabledButton,
            ]}
            onPress={handleClockIn}
            disabled={!selectedBuilding || !currentLocation}
          >
            <Text style={styles.clockInButtonText}>🕐 Clock In</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {showBlur ? (
        <BlurView intensity={20} style={styles.modalOverlay}>
          {renderContent()}
        </BlurView>
      ) : (
        <View style={styles.modalOverlay}>
          {renderContent()}
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    padding: Spacing.lg,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  locationStatus: {
    marginBottom: Spacing.lg,
  },
  locationLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  locationInfo: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  locationText: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  locationStatusText: {
    ...Typography.caption,
    color: Colors.status.success,
    marginTop: 2,
  },
  locationError: {
    ...Typography.body,
    color: Colors.status.error,
  },
  buildingSelection: {
    marginBottom: Spacing.lg,
  },
  buildingLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  buildingsList: {
    maxHeight: 200,
  },
  buildingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedBuildingItem: {
    backgroundColor: Colors.status.info + '20',
    borderColor: Colors.status.info,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  buildingAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  selectedIcon: {
    ...Typography.titleMedium,
    color: Colors.status.info,
    fontWeight: 'bold',
  },
  validationStatus: {
    marginBottom: Spacing.lg,
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  validatingText: {
    ...Typography.body,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.success + '20',
    borderRadius: 8,
    padding: Spacing.sm,
  },
  validIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  validText: {
    ...Typography.body,
    color: Colors.status.success,
    fontWeight: '600',
  },
  invalidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.warning + '20',
    borderRadius: 8,
    padding: Spacing.sm,
  },
  invalidIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  invalidText: {
    ...Typography.body,
    color: Colors.status.warning,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.glass.thin,
  },
  cancelButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  clockInButton: {
    backgroundColor: Colors.status.success,
  },
  disabledButton: {
    backgroundColor: Colors.text.secondary,
  },
  clockInButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});

export default ClockInGlassModal;
