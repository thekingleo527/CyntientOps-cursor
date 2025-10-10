/**
 * 🏢 Building Detail Compliance Integration
 * 
 * Integration component that adds compliance dashboard functionality
 * to the building detail screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useBuildingDetailComplianceIntegration } from './ComplianceDashboardIntegration';
import { ServiceContainer } from '@cyntientops/business-core';

interface BuildingDetailComplianceIntegrationProps {
  container: ServiceContainer;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  onNavigate?: (screen: string, params?: any) => void;
}

export const BuildingDetailComplianceIntegration: React.FC<BuildingDetailComplianceIntegrationProps> = ({
  container,
  buildingId,
  buildingName,
  buildingAddress,
  onNavigate
}) => {
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [complianceGrade, setComplianceGrade] = useState<string>('F');
  const [complianceStatus, setComplianceStatus] = useState<'critical' | 'high' | 'medium' | 'low'>('low');
  const [isLoading, setIsLoading] = useState(true);
  
  const integration = useBuildingDetailComplianceIntegration(
    container,
    buildingId,
    buildingName,
    buildingAddress
  );

  useEffect(() => {
    loadComplianceData();
  }, [buildingId]);

  const loadComplianceData = async () => {
    try {
      setIsLoading(true);
      
      const [score, grade, status] = await Promise.all([
        integration.getBuildingComplianceScore(buildingId),
        integration.getBuildingComplianceGrade(buildingId),
        integration.getBuildingComplianceStatus(buildingId)
      ]);
      
      setComplianceScore(score);
      setComplianceGrade(grade);
      setComplianceStatus(status);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowComplianceDashboard = async () => {
    try {
      await integration.loadBuildingCompliance();
      integration.showComplianceDashboard();
    } catch (error) {
      Alert.alert('Error', 'Failed to load compliance dashboard');
    }
  };

  const handleRefresh = async () => {
    await integration.refreshComplianceData();
    await loadComplianceData();
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.integrationContainer}>
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceTitle}>Building Compliance</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>⟳</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.complianceMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Score</Text>
            <Text style={[styles.metricValue, { color: getComplianceColor(complianceStatus) }]}>
              {complianceScore}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Grade</Text>
            <Text style={[styles.metricValue, { color: getComplianceColor(complianceStatus) }]}>
              {complianceGrade}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Status</Text>
            <Text style={[styles.metricValue, { color: getComplianceColor(complianceStatus) }]}>
              {getComplianceIcon(complianceStatus)} {complianceStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.complianceButton} onPress={handleShowComplianceDashboard}>
          <Text style={styles.complianceButtonText}>🏢 View Detailed Compliance</Text>
          <Text style={styles.complianceButtonSubtext}>
            HPD, DSNY, FDNY, and 311 violations data
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  integrationContainer: {
    margin: 16,
  },
  complianceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  complianceTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  complianceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  complianceButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  complianceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  complianceButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
});

export default BuildingDetailComplianceIntegration;
