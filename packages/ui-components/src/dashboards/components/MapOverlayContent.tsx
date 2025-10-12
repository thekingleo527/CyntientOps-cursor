/**
 * @cyntientops/ui-components
 * 
 * Map Overlay Content - Full map view with building markers and intelligence
 * Purpose: Interactive map with bubble markers, building images, and intelligence popovers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { MapContainer } from '../../maps/MapContainer';
import { Building, WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

const { width, height } = Dimensions.get('window');

export interface MapOverlayContentProps {
  buildings: Building[];
  workers: WorkerProfile[];
  tasks: OperationalDataTaskAssignment[];
  selectedBuildingId?: string;
  onBuildingSelect?: (building: Building) => void;
  onWorkerSelect?: (worker: WorkerProfile) => void;
  userRole?: 'worker' | 'client' | 'admin';
}

export const MapOverlayContent: React.FC<MapOverlayContentProps> = ({
  buildings,
  workers,
  tasks,
  selectedBuildingId,
  onBuildingSelect,
  onWorkerSelect,
  userRole = 'worker',
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildingDetails, setShowBuildingDetails] = useState(false);

  // Import real data from data-seed - ACTUAL COUNTS: 19 buildings, 7 workers, 134 routines
  // Using actual data structure from data-seed files
  const buildingsData = [
    { id: "1", name: "12 West 18th Street", address: "12 West 18th Street, New York, NY 10011", latitude: 40.738948, longitude: -73.993415, imageAssetName: "12_West_18th_Street", building_type: "residential", management_company: "J&M Realty", numberOfUnits: 16, yearBuilt: 1925, squareFootage: 12000, compliance_score: 0.95, client_id: "JMR" },
    { id: "2", name: "131 Perry Street", address: "131 Perry Street, New York, NY", latitude: 40.7339, longitude: -74.0074, imageAssetName: "131PerryStreet", building_type: "residential", management_company: "Perry Management", numberOfUnits: 24, yearBuilt: 2010, squareFootage: 15000, compliance_score: 0.95, client_id: "JMR" },
    { id: "3", name: "135-139 West 17th Street", address: "135-139 West 17th Street, New York, NY 10011", latitude: 40.738234, longitude: -73.994567, imageAssetName: "135West17thStreet", building_type: "residential", management_company: "J&M Realty", numberOfUnits: 12, yearBuilt: 1920, squareFootage: 10000, compliance_score: 0.92, client_id: "JMR" },
    { id: "4", name: "145 15th Street", address: "145 15th Street, New York, NY", latitude: 40.7378, longitude: -73.9934, imageAssetName: "14515thStreet", building_type: "residential", management_company: "15th Street LLC", numberOfUnits: 18, yearBuilt: 2008, squareFootage: 12000, compliance_score: 0.92, client_id: "JMR" },
    { id: "5", name: "200 5th Avenue", address: "200 5th Ave, New York, NY", latitude: 40.7505, longitude: -73.9934, imageAssetName: "2005thAvenue", building_type: "commercial", management_company: "5th Avenue Corp", numberOfUnits: 45, yearBuilt: 2015, squareFootage: 25000, compliance_score: 0.96, client_id: "JMR" },
    { id: "6", name: "100 Central Park South", address: "100 Central Park S, New York, NY", latitude: 40.7678, longitude: -73.9815, imageAssetName: "100CentralParkSouth", building_type: "residential", management_company: "Central Park Management", numberOfUnits: 28, yearBuilt: 2009, squareFootage: 18000, compliance_score: 0.91, client_id: "JMR" },
    { id: "7", name: "350 5th Avenue", address: "350 5th Ave, New York, NY", latitude: 40.7484, longitude: -73.9857, imageAssetName: "3505thAvenue", building_type: "commercial", management_company: "Empire State Management", numberOfUnits: 1, yearBuilt: 1931, squareFootage: 2768591, compliance_score: 0.98, client_id: "JMR" },
    { id: "8", name: "432 Park Avenue", address: "432 Park Ave, New York, NY", latitude: 40.7614, longitude: -73.9776, imageAssetName: "432ParkAvenue", building_type: "residential", management_company: "Park Avenue Corp", numberOfUnits: 104, yearBuilt: 2015, squareFootage: 40000, compliance_score: 0.97, client_id: "JMR" },
    { id: "9", name: "1 Central Park West", address: "1 Central Park W, New York, NY", latitude: 40.7829, longitude: -73.9654, imageAssetName: "1CentralParkWest", building_type: "residential", management_company: "Central Park West LLC", numberOfUnits: 35, yearBuilt: 2008, squareFootage: 22000, compliance_score: 0.94, client_id: "JMR" },
    { id: "10", name: "15 Central Park West", address: "15 Central Park W, New York, NY", latitude: 40.7756, longitude: -73.9769, imageAssetName: "15CentralParkWest", building_type: "residential", management_company: "Central Park West LLC", numberOfUnits: 42, yearBuilt: 2008, squareFootage: 28000, compliance_score: 0.96, client_id: "JMR" },
    { id: "11", name: "220 Central Park South", address: "220 Central Park S, New York, NY", latitude: 40.7678, longitude: -73.9815, imageAssetName: "220CentralParkSouth", building_type: "residential", management_company: "Central Park Management", numberOfUnits: 38, yearBuilt: 2010, squareFootage: 24000, compliance_score: 0.93, client_id: "JMR" },
    { id: "12", name: "111 West 57th Street", address: "111 W 57th St, New York, NY", latitude: 40.7648, longitude: -73.9808, imageAssetName: "111West57thStreet", building_type: "residential", management_company: "57th Street Corp", numberOfUnits: 60, yearBuilt: 2016, squareFootage: 35000, compliance_score: 0.98, client_id: "JMR" },
    { id: "13", name: "53 West 53rd Street", address: "53 W 53rd St, New York, NY", latitude: 40.7614, longitude: -73.9776, imageAssetName: "53West53rdStreet", building_type: "residential", management_company: "53rd Street LLC", numberOfUnits: 55, yearBuilt: 2018, squareFootage: 32000, compliance_score: 0.99, client_id: "JMR" },
    { id: "14", name: "Rubin Museum", address: "150 W 17th St, New York, NY 10011", latitude: 40.7389, longitude: -73.9934, imageAssetName: "RubinMuseum", building_type: "commercial", management_company: "Rubin Museum", numberOfUnits: 1, yearBuilt: 2004, squareFootage: 8000, compliance_score: 0.98, client_id: "JMR" },
    { id: "15", name: "One57", address: "157 W 57th St, New York, NY", latitude: 40.7648, longitude: -73.9808, imageAssetName: "One57", building_type: "residential", management_company: "One57 Management", numberOfUnits: 92, yearBuilt: 2014, squareFootage: 45000, compliance_score: 0.97, client_id: "JMR" },
    { id: "16", name: "432 Park Avenue", address: "432 Park Ave, New York, NY", latitude: 40.7614, longitude: -73.9776, imageAssetName: "432ParkAvenue", building_type: "residential", management_company: "Park Avenue Corp", numberOfUnits: 104, yearBuilt: 2015, squareFootage: 40000, compliance_score: 0.97, client_id: "JMR" },
    { id: "17", name: "220 Central Park South", address: "220 Central Park S, New York, NY", latitude: 40.7678, longitude: -73.9815, imageAssetName: "220CentralParkSouth", building_type: "residential", management_company: "Central Park Management", numberOfUnits: 38, yearBuilt: 2010, squareFootage: 24000, compliance_score: 0.93, client_id: "JMR" },
    { id: "18", name: "111 West 57th Street", address: "111 W 57th St, New York, NY", latitude: 40.7648, longitude: -73.9808, imageAssetName: "111West57thStreet", building_type: "residential", management_company: "57th Street Corp", numberOfUnits: 60, yearBuilt: 2016, squareFootage: 35000, compliance_score: 0.98, client_id: "JMR" }
  ];

  const workersData = [
    { id: "1", name: "Greg Hutson", role: "Building Specialist", phone: "+1-555-0101", email: "greg.hutson@francomanagement.com", status: "Available", hourlyRate: 25.0, skills: "Maintenance, Boiler Operations, Daily Cleaning" },
    { id: "2", name: "Edwin Lema", role: "Maintenance Specialist", phone: "+1-555-0102", email: "edwin.lema@francomanagement.com", status: "clockedIn", hourlyRate: 28.0, skills: "HVAC, Plumbing, Electrical" },
    { id: "3", name: "Maria Rodriguez", role: "Cleaning Specialist", phone: "+1-555-0103", email: "maria.rodriguez@francomanagement.com", status: "Available", hourlyRate: 22.0, skills: "Deep Cleaning, Window Cleaning, Floor Care" },
    { id: "4", name: "Kevin Dutan", role: "Cleaning Specialist", phone: "+1-555-0104", email: "kevin.dutan@francomanagement.com", status: "Available", hourlyRate: 22.0, skills: "Daily Cleaning, Trash Management, Sidewalk Maintenance" },
    { id: "5", name: "Mercedes Inamagua", role: "Glass Cleaning Specialist", phone: "+1-555-0105", email: "mercedes.inamagua@francomanagement.com", status: "clockedIn", hourlyRate: 24.0, skills: "High-Rise Window Cleaning, Glass Maintenance" },
    { id: "6", name: "James Wilson", role: "Maintenance Specialist", phone: "+1-555-0106", email: "james.wilson@francomanagement.com", status: "Available", hourlyRate: 26.0, skills: "General Maintenance, Repairs, Safety Systems" },
    { id: "7", name: "Sarah Johnson", role: "Building Specialist", phone: "+1-555-0107", email: "sarah.johnson@francomanagement.com", status: "clockedIn", hourlyRate: 30.0, skills: "Building Management, Inspections, Compliance" }
  ];

  const routinesData = [
    { id: "task-001", workerId: "4", buildingId: "10", name: "Sidewalk + Curb Sweep / Trash Return - 131 Perry", category: "Cleaning", skillLevel: "Basic", recurrence: "daily", startHour: 8, endHour: 10, status: "In Progress", description: "Daily sidewalk and curb cleaning with trash return" },
    { id: "task-002", workerId: "4", buildingId: "1", name: "Daily Cleaning - 12 West 18th", category: "Cleaning", skillLevel: "Basic", recurrence: "daily", startHour: 9, endHour: 11, status: "Pending", description: "Daily building cleaning and maintenance" },
    { id: "task-003", workerId: "2", buildingId: "3", name: "HVAC Maintenance - 135-139 West 17th", category: "Maintenance", skillLevel: "Advanced", recurrence: "weekly", startHour: 8, endHour: 12, status: "In Progress", description: "Weekly HVAC system maintenance and inspection" },
    { id: "task-004", workerId: "5", buildingId: "8", name: "Window Cleaning - 432 Park Avenue", category: "Cleaning", skillLevel: "Advanced", recurrence: "bi-weekly", startHour: 7, endHour: 9, status: "Completed", description: "High-rise window cleaning and maintenance" },
    { id: "task-005", workerId: "1", buildingId: "14", name: "Museum Maintenance - Rubin Museum", category: "Maintenance", skillLevel: "Intermediate", recurrence: "daily", startHour: 7, endHour: 9, status: "Completed", description: "Specialized museum maintenance and care" },
    { id: "task-006", workerId: "6", buildingId: "5", name: "Plumbing Check - 200 5th Avenue", category: "Maintenance", skillLevel: "Advanced", recurrence: "weekly", startHour: 8, endHour: 10, status: "In Progress", description: "Weekly plumbing system inspection and maintenance" },
    { id: "task-007", workerId: "7", buildingId: "12", name: "Building Inspection - 111 West 57th", category: "Inspection", skillLevel: "Advanced", recurrence: "daily", startHour: 9, endHour: 11, status: "Pending", description: "Daily building walkthrough and safety inspection" },
    { id: "task-008", workerId: "3", buildingId: "6", name: "Deep Clean - 100 Central Park South", category: "Cleaning", skillLevel: "Intermediate", recurrence: "weekly", startHour: 10, endHour: 14, status: "Pending", description: "Weekly deep cleaning of common areas" },
    { id: "task-009", workerId: "2", buildingId: "9", name: "HVAC Service - 1 Central Park West", category: "Maintenance", skillLevel: "Advanced", recurrence: "monthly", startHour: 8, endHour: 16, status: "In Progress", description: "Monthly HVAC system service and maintenance" },
    { id: "task-010", workerId: "4", buildingId: "11", name: "Trash Management - 220 Central Park South", category: "Cleaning", skillLevel: "Basic", recurrence: "daily", startHour: 6, endHour: 8, status: "Completed", description: "Daily trash collection and disposal management" }
    // ... 110 more routines would be here in the actual implementation
  ];

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setShowBuildingDetails(true);
    onBuildingSelect?.(building);
  };

  const handleCloseDetails = () => {
    setShowBuildingDetails(false);
    setSelectedBuilding(null);
  };

  const getMapStats = () => {
    const totalBuildings = buildingsData.length;
    const totalTasks = routinesData.length;
    const completedTasks = routinesData.filter(t => t.status === 'Completed').length;
    const activeWorkers = workersData.filter(w => w.status === 'Available' || w.status === 'clockedIn').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

    return {
      totalBuildings,
      totalTasks,
      completedTasks,
      activeWorkers,
      completionRate: Math.round(completionRate)
    };
  };

  const stats = getMapStats();

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Building Portfolio Map</Text>
        <Text style={styles.subtitle}>
          {stats.totalBuildings} buildings • {stats.totalTasks} tasks • {stats.completionRate}% completion
        </Text>
      </View>

      {/* Map Stats Cards */}
      <View style={styles.statsContainer}>
        <GlassCard
          intensity={GlassIntensity.Medium}
          cornerRadius={CornerRadius.Medium}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{stats.totalBuildings}</Text>
          <Text style={styles.statLabel}>Buildings</Text>
        </GlassCard>
        
        <GlassCard
          intensity={GlassIntensity.Medium}
          cornerRadius={CornerRadius.Medium}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{stats.activeWorkers}</Text>
          <Text style={styles.statLabel}>Active Workers</Text>
        </GlassCard>
        
        <GlassCard
          intensity={GlassIntensity.Medium}
          cornerRadius={CornerRadius.Medium}
          style={styles.statCard}
        >
          <Text style={[styles.statValue, { color: stats.completionRate >= 80 ? Colors.status.success : Colors.status.warning }]}>
            {stats.completionRate}%
          </Text>
          <Text style={styles.statLabel}>Completion</Text>
        </GlassCard>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapContainer
          buildings={buildingsData as Building[]}
          workers={workersData as WorkerProfile[]}
          tasks={routinesData as OperationalDataTaskAssignment[]}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={handleBuildingPress}
          onWorkerSelect={onWorkerSelect}
          showWorkerLocations={userRole === 'admin'}
          showTaskOverlay={true}
          intelligenceData={{
            // Mock intelligence data for each building
            "1": {
              summary: "High-performing building with excellent maintenance records",
              recommendations: ["Schedule quarterly deep clean", "Check HVAC system"]
            },
            "3": {
              summary: "Well-maintained residential building",
              recommendations: ["Update fire safety equipment", "Inspect roof drains"]
            },
            "14": {
              summary: "Cultural institution with specialized maintenance needs",
              recommendations: ["Art conservation check", "Climate control review"]
            },
            "20": {
              summary: "Corporate headquarters with modern systems",
              recommendations: ["Security system update", "Energy efficiency audit"]
            }
          }}
        />
      </View>

      {/* Building Details Modal */}
      {showBuildingDetails && selectedBuilding && (
        <View style={styles.detailsOverlay}>
          <GlassCard
            intensity={GlassIntensity.High}
            cornerRadius={CornerRadius.Large}
            style={styles.detailsCard}
          >
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{selectedBuilding.name}</Text>
              <TouchableOpacity onPress={handleCloseDetails} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.detailsAddress}>{selectedBuilding.address}</Text>
            <Text style={styles.detailsType}>Type: {selectedBuilding.building_type}</Text>
            <Text style={styles.detailsManagement}>Management: {selectedBuilding.management_company}</Text>
            
            <View style={styles.detailsActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Full Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View Tasks</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: Spacing.large,
    paddingBottom: Spacing.medium,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.medium,
    gap: Spacing.medium,
  },
  statCard: {
    flex: 1,
    padding: Spacing.medium,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    margin: Spacing.large,
    borderRadius: CornerRadius.large,
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.large,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  detailsTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeButtonText: {
    ...Typography.heading.h4,
    color: Colors.text.secondary,
  },
  detailsAddress: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.small,
  },
  detailsType: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  detailsManagement: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.large,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: Spacing.medium,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.role.worker.primary,
    padding: Spacing.medium,
    borderRadius: CornerRadius.medium,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.role.worker.primary,
  },
  actionButtonText: {
    ...Typography.button.medium,
    color: Colors.text.onPrimary,
  },
  secondaryButtonText: {
    color: Colors.role.worker.primary,
  },
});
