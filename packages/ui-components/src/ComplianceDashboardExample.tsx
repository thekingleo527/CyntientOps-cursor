/**
 * 🏢 Compliance Dashboard Example
 * 
 * Example implementation showing how to integrate the compliance dashboard
 * with real building data from the data-seed package
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ComplianceDashboard } from './ComplianceDashboard';
import { BuildingComplianceDetail } from './BuildingComplianceDetail';
import { complianceDashboardService, BuildingComplianceData } from '@cyntientops/compliance-engine';

// Import building data from data-seed package
import buildingsData from '@cyntientops/data-seed/buildings.json';

interface ComplianceDashboardExampleProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const ComplianceDashboardExample: React.FC<ComplianceDashboardExampleProps> = ({
  onNavigate
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingComplianceData | null>(null);
  const [buildings, setBuildings] = useState<Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin?: string;
  }>>([]);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = () => {
    try {
      // Transform building data from data-seed package
      const transformedBuildings = buildingsData.map((building, index) => ({
        id: building.id,
        name: building.name,
        address: building.address,
        bbl: building.bbl || `100${index.toString().padStart(6, '0')}${index.toString().padStart(2, '0')}`,
        bin: building.bin
      }));

      setBuildings(transformedBuildings);
      console.log('🏢 Loaded', transformedBuildings.length, 'buildings for compliance dashboard');
    } catch (error) {
      console.error('Error loading buildings:', error);
      Alert.alert('Error', 'Failed to load building data');
    }
  };

  const handleBuildingSelect = (building: BuildingComplianceData) => {
    setSelectedBuilding(building);
    console.log('🏠 Selected building:', building.name);
  };

  const handleCloseBuilding = () => {
    setSelectedBuilding(null);
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing compliance data...');
    // The ComplianceDashboard component will handle the refresh
  };

  const handleViolationPress = (violation: any) => {
    console.log('📋 Violation pressed:', violation);
    Alert.alert(
      'Violation Details',
      `${violation.type}\n\n${violation.description}\n\nStatus: ${violation.status}`,
      [{ text: 'OK' }]
    );
  };

  if (selectedBuilding) {
    return (
      <BuildingComplianceDetail
        building={selectedBuilding}
        onClose={handleCloseBuilding}
        onViolationPress={handleViolationPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compliance Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Real-time compliance data from NYC APIs
        </Text>
      </View>
      
      <ComplianceDashboard
        buildings={buildings}
        onBuildingSelect={handleBuildingSelect}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
});

export default ComplianceDashboardExample;
