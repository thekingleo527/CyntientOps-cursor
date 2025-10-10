/**
 * 🏢 Client Dashboard Compliance Integration
 * 
 * Integration component that adds compliance dashboard functionality
 * to the client dashboard screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useClientDashboardComplianceIntegration } from './ComplianceDashboardIntegration';
import { ServiceContainer } from '@cyntientops/business-core';

interface ClientDashboardComplianceIntegrationProps {
  container: ServiceContainer;
  clientId: string;
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin?: string;
  }>;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ClientDashboardComplianceIntegration: React.FC<ClientDashboardComplianceIntegrationProps> = ({
  container,
  clientId,
  buildings,
  onNavigate
}) => {
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false);
  
  const integration = useClientDashboardComplianceIntegration(container, clientId);

  const handleShowComplianceDashboard = async () => {
    try {
      await integration.loadComplianceDashboard(buildings);
      setShowComplianceDashboard(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load compliance dashboard');
    }
  };

  const handleHideComplianceDashboard = () => {
    setShowComplianceDashboard(false);
  };

  const handleBuildingSelect = (building: any) => {
    integration.selectBuilding(building);
    onNavigate?.('BuildingComplianceDetail', { building });
  };

  const handleRefresh = async () => {
    await integration.refreshComplianceData();
  };

  if (showComplianceDashboard) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleHideComplianceDashboard}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portfolio Compliance</Text>
        </View>
        
        {/* Compliance Dashboard would be rendered here */}
        <View style={styles.dashboardContainer}>
          <Text style={styles.dashboardText}>Compliance Dashboard Content</Text>
          <Text style={styles.dashboardSubtext}>
            Real-time compliance data for {buildings.length} buildings
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.integrationContainer}>
      <TouchableOpacity style={styles.complianceButton} onPress={handleShowComplianceDashboard}>
        <Text style={styles.complianceButtonText}>🏢 View Portfolio Compliance</Text>
        <Text style={styles.complianceButtonSubtext}>
          Real-time compliance data from NYC APIs
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dashboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dashboardText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dashboardSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  integrationContainer: {
    margin: 16,
  },
  complianceButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  complianceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  complianceButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});

export default ClientDashboardComplianceIntegration;
