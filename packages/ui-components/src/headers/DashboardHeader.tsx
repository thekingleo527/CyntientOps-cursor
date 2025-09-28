/**
 * 🎯 Dashboard Header
 * Purpose: Intelligent header with logo, Nova AI, identity pill, and clock pill
 * Features: Role-based navigation, smart building selection, real-time status
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  WorkerProfile, 
  ClientProfile, 
  Building,
  UserRole,
  ClockInStatus
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface DashboardHeaderProps {
  userRole: UserRole;
  worker?: WorkerProfile;
  client?: ClientProfile;
  currentBuilding?: Building;
  clockInStatus?: ClockInStatus;
  onProfilePress?: () => void;
  onClockInPress?: () => void;
  onBuildingSelect?: (building: Building) => void;
  onNovaAIPress?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userRole,
  worker,
  client,
  currentBuilding,
  clockInStatus,
  onProfilePress,
  onClockInPress,
  onBuildingSelect,
  onNovaAIPress
}) => {
  const [showBuildingSelector, setShowBuildingSelector] = useState(false);
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    if (userRole === 'worker' && worker) {
      loadAvailableBuildings();
    }
  }, [userRole, worker]);

  const loadAvailableBuildings = async () => {
    try {
      setIsLoading(true);
      // Load buildings assigned to this worker
      const buildings = await services.building.getBuildingsForWorker(worker?.id || '');
      setAvailableBuildings(buildings);
    } catch (error) {
      console.error('Error loading available buildings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockInPress = () => {
    if (userRole === 'worker') {
      if (currentBuilding) {
        // Direct clock in if building is already selected
        onClockInPress?.();
      } else {
        // Show building selector first
        setShowBuildingSelector(true);
      }
    }
  };

  const handleBuildingSelect = (building: Building) => {
    setShowBuildingSelector(false);
    onBuildingSelect?.(building);
    // Navigate to building detail view for review before clock in
    // This will be handled by the parent component
  };

  const renderLogo = () => (
    <TouchableOpacity style={styles.logoContainer}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>CyntientOps</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNovaAI = () => (
    <TouchableOpacity 
      style={styles.novaContainer}
      onPress={onNovaAIPress}
    >
      <View style={[
        styles.novaPill,
        { 
          backgroundColor: Colors.primary.purple + '20',
          borderColor: Colors.primary.purple,
          borderWidth: 1
        }
      ]}>
        <Text style={styles.novaIcon}>🧠</Text>
        <Text style={styles.novaText}>Nova AI</Text>
        <View style={styles.novaStatus}>
          <Text style={styles.novaStatusText}>●</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderIdentityPill = () => {
    if (userRole === 'worker' && worker) {
      return (
        <TouchableOpacity 
          style={styles.identityPill}
          onPress={onProfilePress}
        >
          <View style={styles.identityContent}>
            {worker.profile.avatar ? (
              <Image source={{ uri: worker.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.role.worker.primary }]}>
                <Text style={styles.avatarText}>
                  {worker.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{worker.name}</Text>
              <Text style={styles.identityRole}>Worker</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (userRole === 'client' && client) {
      return (
        <TouchableOpacity 
          style={styles.identityPill}
          onPress={onProfilePress}
        >
          <View style={styles.identityContent}>
            {client.profile.avatar ? (
              <Image source={{ uri: client.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.role.client.primary }]}>
                <Text style={styles.avatarText}>
                  {client.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{client.name}</Text>
              <Text style={styles.identityRole}>Client</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (userRole === 'admin' || userRole === 'manager' || userRole === 'super_admin') {
      const roleDisplayName = userRole === 'super_admin' ? 'Super Admin' : 
                             userRole === 'manager' ? 'Manager' : 'Admin';
      const roleInitial = userRole === 'super_admin' ? 'SA' : 
                         userRole === 'manager' ? 'M' : 'A';
      
      return (
        <TouchableOpacity 
          style={styles.identityPill}
          onPress={onProfilePress}
        >
          <View style={styles.identityContent}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.role.admin.primary }]}>
              <Text style={styles.avatarText}>{roleInitial}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{roleDisplayName}</Text>
              <Text style={styles.identityRole}>Administrator</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderClockPill = () => {
    if (userRole !== 'worker') return null;

    const isClockedIn = clockInStatus?.isClockedIn || false;
    const currentBuildingName = currentBuilding?.name || 'Select Building';

    return (
      <TouchableOpacity 
        style={[
          styles.clockPill,
          isClockedIn && styles.clockPillActive
        ]}
        onPress={handleClockInPress}
      >
        <View style={styles.clockContent}>
          <Text style={styles.clockIcon}>🕐</Text>
          <View style={styles.clockInfo}>
            <Text style={styles.clockStatus}>
              {isClockedIn ? 'Clocked In' : 'Clock In'}
            </Text>
            <Text style={styles.clockBuilding}>{currentBuildingName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBuildingSelector = () => (
    <Modal
      visible={showBuildingSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowBuildingSelector(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Building</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowBuildingSelector(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.buildingList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading buildings...</Text>
            </View>
          ) : availableBuildings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No buildings assigned</Text>
            </View>
          ) : (
            availableBuildings.map(building => (
              <TouchableOpacity
                key={building.id}
                style={styles.buildingItem}
                onPress={() => handleBuildingSelect(building)}
              >
                <View style={styles.buildingInfo}>
                  <Text style={styles.buildingName}>{building.name}</Text>
                  <Text style={styles.buildingAddress}>{building.address}</Text>
                  <Text style={styles.buildingType}>{building.type}</Text>
                </View>
                <View style={styles.buildingActions}>
                  <Text style={styles.selectButton}>Select</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderLogo()}
      {renderNovaAI()}
      <View style={styles.rightSection}>
        {userRole === 'worker' && renderClockPill()}
        {renderIdentityPill()}
      </View>
      {userRole === 'worker' && renderBuildingSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.medium,
  },
  
  // Logo
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.blue,
    borderRadius: 8,
  },
  logoText: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  
  // Nova AI
  novaContainer: {
    flex: 1,
    alignItems: 'center',
  },
  novaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary.purple,
  },
  novaIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  novaText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  novaStatus: {
    marginLeft: Spacing.sm,
  },
  novaStatusText: {
    fontSize: 8,
    color: Colors.status.success,
  },
  
  // Right Section
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  
  // Identity Pill
  identityPill: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.thick,
  },
  identityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  identityRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  
  // Clock Pill
  clockPill: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.thick,
  },
  clockPillActive: {
    backgroundColor: Colors.status.success + '20',
    borderColor: Colors.status.success,
  },
  clockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  clockInfo: {
    flex: 1,
  },
  clockStatus: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  clockBuilding: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  
  // Building Selector Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.medium,
  },
  modalTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
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
    color: Colors.text.primary,
  },
  buildingList: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    marginBottom: Spacing.md,
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
});
