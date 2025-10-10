/**
 * 📱 Mobile Compliance Dashboard
 * 
 * Mobile-ready compliance dashboard component that integrates
 * with building details, client, and admin screens
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplianceDashboard } from './ComplianceDashboard';
import { BuildingComplianceDetail } from './BuildingComplianceDetail';
import { complianceDashboardService, BuildingComplianceData } from '@cyntientops/compliance-engine';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

interface MobileComplianceDashboardProps {
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin?: string;
  }>;
  onBuildingSelect?: (building: BuildingComplianceData) => void;
  onRefresh?: () => void;
  userRole: 'client' | 'admin' | 'worker';
  showBackButton?: boolean;
  onBack?: () => void;
}

export const MobileComplianceDashboard: React.FC<MobileComplianceDashboardProps> = ({
  buildings,
  onBuildingSelect,
  onRefresh,
  userRole,
  showBackButton = false,
  onBack
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingComplianceData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleBuildingSelect = async (building: BuildingComplianceData) => {
    setSelectedBuilding(building);
    onBuildingSelect?.(building);
  };

  const handleCloseBuilding = () => {
    setSelectedBuilding(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh?.();
    setRefreshing(false);
  };

  const handleViolationPress = (violation: any) => {
    Alert.alert(
      'Violation Details',
      `${violation.type}\n\n${violation.description}\n\nStatus: ${violation.status}`,
      [{ text: 'OK' }]
    );
  };

  const getHeaderTitle = () => {
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

  const getHeaderSubtitle = () => {
    switch (userRole) {
      case 'client':
        return 'Your building compliance overview';
      case 'admin':
        return 'All buildings compliance overview';
      case 'worker':
        return 'Current building compliance status';
      default:
        return 'Real-time compliance data from NYC APIs';
    }
  };

  if (selectedBuilding) {
    return (
      <SafeAreaView style={styles.container}>
        <BuildingComplianceDetail
          building={selectedBuilding}
          onClose={handleCloseBuilding}
          onViolationPress={handleViolationPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Compliance Dashboard */}
      <ComplianceDashboard
        buildings={buildings}
        onBuildingSelect={handleBuildingSelect}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MobileComplianceDashboard;
