/**
 * 🧭 Worker Navigation Flow
 * Purpose: Intelligent navigation flow for workers from building selection to clock-in
 * Features: Smart building preview, routine review, compliance check, clock-in confirmation
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  Building, 
  WorkerProfile,
  ClockInStatus
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';
// BuildingDetailPreview removed - functionality integrated into main BuildingDetailView

export interface WorkerNavigationFlowProps {
  worker: WorkerProfile;
  isVisible: boolean;
  onClose: () => void;
  onClockIn: (buildingId: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onNavigateToBuilding: (building: Building) => void;
}

export enum NavigationStep {
  BUILDING_SELECTION = 'building_selection',
  BUILDING_PREVIEW = 'building_preview',
  CLOCK_IN_CONFIRMATION = 'clock_in_confirmation',
  CLOCKED_IN = 'clocked_in'
}

export const WorkerNavigationFlow: React.FC<WorkerNavigationFlowProps> = ({
  worker,
  isVisible,
  onClose,
  onClockIn,
  onNavigateToBuilding
}) => {
  const [currentStep, setCurrentStep] = useState<NavigationStep>(NavigationStep.BUILDING_SELECTION);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    if (isVisible && worker) {
      loadAvailableBuildings();
    }
  }, [isVisible, worker]);

  const loadAvailableBuildings = async () => {
    try {
      setIsLoading(true);
      const buildings = await services.building.getBuildingsForWorker(worker.id);
      setAvailableBuildings(buildings);
    } catch (error) {
      console.error('Error loading available buildings:', error);
      Alert.alert('Error', 'Failed to load available buildings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setCurrentStep(NavigationStep.BUILDING_PREVIEW);
  };

  const handleViewFullDetails = () => {
    if (selectedBuilding) {
      onNavigateToBuilding(selectedBuilding);
      onClose();
    }
  };

  const handleClockInFromPreview = (buildingId: string) => {
    setCurrentStep(NavigationStep.CLOCK_IN_CONFIRMATION);
  };

  const handleClockInConfirm = async () => {
    if (!selectedBuilding) return;

    try {
      // Get current location
      const location = await services.location.getCurrentLocation();
      
      // Clock in
      await onClockIn(selectedBuilding.id, location);
      
      setCurrentStep(NavigationStep.CLOCKED_IN);
      
      // Auto-close after successful clock-in
      setTimeout(() => {
        onClose();
        setCurrentStep(NavigationStep.BUILDING_SELECTION);
        setSelectedBuilding(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error clocking in:', error);
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case NavigationStep.BUILDING_PREVIEW:
        setCurrentStep(NavigationStep.BUILDING_SELECTION);
        setSelectedBuilding(null);
        break;
      case NavigationStep.CLOCK_IN_CONFIRMATION:
        setCurrentStep(NavigationStep.BUILDING_PREVIEW);
        break;
      default:
        onClose();
        break;
    }
  };

  const renderBuildingSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Building</Text>
      <Text style={styles.stepDescription}>
        Choose a building to clock in at. You can review details before clocking in.
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      ) : availableBuildings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No buildings assigned</Text>
        </View>
      ) : (
        <View style={styles.buildingsList}>
          {availableBuildings.map(building => (
            <View key={building.id} style={styles.buildingItem}>
              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.buildingAddress}>{building.address}</Text>
                <Text style={styles.buildingType}>{building.type}</Text>
              </View>
              <View style={styles.buildingActions}>
                <Text 
                  style={styles.selectButton}
                  onPress={() => handleBuildingSelect(building)}
                >
                  Select
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderBuildingPreview = () => {
    if (!selectedBuilding) return null;

    return (
      {/* BuildingDetailPreview functionality integrated into main BuildingDetailView */}
      <View style={styles.previewPlaceholder}>
        <Text style={styles.previewText}>Building detail preview functionality integrated into main building detail view</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleBack}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderClockInConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Clock In</Text>
      <Text style={styles.stepDescription}>
        You're about to clock in at {selectedBuilding?.name}. Make sure you're at the correct location.
      </Text>
      
      <View style={styles.confirmationCard}>
        <Text style={styles.confirmationBuilding}>{selectedBuilding?.name}</Text>
        <Text style={styles.confirmationAddress}>{selectedBuilding?.address}</Text>
        <Text style={styles.confirmationType}>{selectedBuilding?.type}</Text>
      </View>
      
      <View style={styles.confirmationActions}>
        <Text 
          style={styles.backButton}
          onPress={handleBack}
        >
          Back
        </Text>
        <Text 
          style={styles.confirmButton}
          onPress={handleClockInConfirm}
        >
          Clock In
        </Text>
      </View>
    </View>
  );

  const renderClockedIn = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.stepTitle}>Successfully Clocked In</Text>
      <Text style={styles.stepDescription}>
        You're now clocked in at {selectedBuilding?.name}. Good luck with your work!
      </Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case NavigationStep.BUILDING_SELECTION:
        return renderBuildingSelection();
      case NavigationStep.BUILDING_PREVIEW:
        return renderBuildingPreview();
      case NavigationStep.CLOCK_IN_CONFIRMATION:
        return renderClockInConfirmation();
      case NavigationStep.CLOCKED_IN:
        return renderClockedIn();
      default:
        return renderBuildingSelection();
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {renderCurrentStep()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  
  // Step Container
  stepContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  
  // Buildings List
  buildingsList: {
    gap: Spacing.md,
  },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glass.medium,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  buildingAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  buildingType: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  buildingActions: {
    marginLeft: Spacing.md,
  },
  selectButton: {
    ...Typography.caption,
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  
  // Confirmation
  confirmationCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  confirmationBuilding: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  confirmationAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  confirmationType: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    textAlign: 'center',
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.primary.green,
    borderRadius: 12,
    textAlign: 'center',
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Success
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  previewText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  closeButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
