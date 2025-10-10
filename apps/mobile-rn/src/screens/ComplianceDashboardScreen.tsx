/**
 * 🏢 Compliance Dashboard Screen
 * 
 * Mobile screen that integrates compliance dashboard with building details,
 * client, and admin screens
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileComplianceDashboard } from '@cyntientops/ui-components';
import { useClientDashboardComplianceIntegration, useAdminDashboardComplianceIntegration, useBuildingDetailComplianceIntegration } from '@cyntientops/context-engines';
import { ServiceContainer } from '@cyntientops/business-core';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

interface ComplianceDashboardScreenProps {
  userRole: 'client' | 'admin' | 'worker';
  clientId?: string;
  buildingId?: string;
  buildingName?: string;
  buildingAddress?: string;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ComplianceDashboardScreen: React.FC<ComplianceDashboardScreenProps> = ({
  userRole,
  clientId,
  buildingId,
  buildingName,
  buildingAddress,
  onNavigate
}) => {
  const [buildings, setBuildings] = useState<Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin?: string;
  }>>([]);

  // Initialize service container
  const container = ServiceContainer.getInstance();

  // Use appropriate integration based on user role
  const clientIntegration = useClientDashboardComplianceIntegration(container, clientId || '');
  const adminIntegration = useAdminDashboardComplianceIntegration(container);
  const buildingIntegration = useBuildingDetailComplianceIntegration(
    container,
    buildingId || '',
    buildingName || '',
    buildingAddress || ''
  );

  const integration = userRole === 'client' ? clientIntegration :
                      userRole === 'admin' ? adminIntegration :
                      buildingIntegration;

  useEffect(() => {
    loadBuildings();
  }, [userRole, clientId, buildingId]);

  const loadBuildings = async () => {
    try {
      let buildingsData: Array<{
        id: string;
        name: string;
        address: string;
        bbl: string;
        bin?: string;
      }> = [];

      switch (userRole) {
        case 'client':
          if (clientId) {
            const clientBuildings = await container.clients.getClientBuildings(clientId);
            buildingsData = clientBuildings.map(building => ({
              id: building.id,
              name: building.name,
              address: building.address,
              bbl: building.bbl || `100${building.id.padStart(6, '0')}${building.id.padStart(2, '0')}`,
              bin: building.bin
            }));
          }
          break;
        case 'admin':
          const allBuildings = await container.buildings.getAllBuildings();
          buildingsData = allBuildings.map(building => ({
            id: building.id,
            name: building.name,
            address: building.address,
            bbl: building.bbl || `100${building.id.padStart(6, '0')}${building.id.padStart(2, '0')}`,
            bin: building.bin
          }));
          break;
        case 'worker':
          if (buildingId) {
            buildingsData = [{
              id: buildingId,
              name: buildingName || 'Current Building',
              address: buildingAddress || 'Unknown Address',
              bbl: `100${buildingId.padStart(6, '0')}${buildingId.padStart(2, '0')}`,
              bin: undefined
            }];
          }
          break;
      }

      setBuildings(buildingsData);

      // Load compliance dashboard data
      if (buildingsData.length > 0) {
        await integration.loadComplianceDashboard(buildingsData);
      }
    } catch (error) {
      console.error('Failed to load buildings:', error);
      Alert.alert('Error', 'Failed to load building data');
    }
  };

  const handleBuildingSelect = (building: any) => {
    console.log('Selected building:', building.name);
    // Navigation logic would go here
  };

  const handleRefresh = async () => {
    await loadBuildings();
  };

  const handleBack = () => {
    onNavigate?.('back');
  };

  const getScreenTitle = () => {
    switch (userRole) {
      case 'client':
        return 'Portfolio Compliance';
      case 'admin':
        return 'System Compliance';
      case 'worker':
        return 'Building Compliance';
      default:
        return 'Compliance Dashboard';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MobileComplianceDashboard
        buildings={buildings}
        onBuildingSelect={handleBuildingSelect}
        onRefresh={handleRefresh}
        userRole={userRole}
        showBackButton={true}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
});

export default ComplianceDashboardScreen;
