/**
 * 🏢 Building Configuration Screen
 * Purpose: Configure building settings and details
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { CanonicalIDs } from '@cyntientops/business-core';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

interface Building {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_asset_name?: string;
  number_of_units?: number;
  year_built?: number;
  square_footage?: number;
  management_company?: string;
  primary_contact?: string;
  contact_phone?: string;
  is_active: number;
  normalized_name?: string;
  aliases?: string;
  borough?: string;
  compliance_score?: number;
  client_id?: string;
  special_notes?: string;
}

export const BuildingConfigurationScreen: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formUnits, setFormUnits] = useState('');
  const [formYearBuilt, setFormYearBuilt] = useState('');
  const [formSquareFeet, setFormSquareFeet] = useState('');
  const [formManagementCompany, setFormManagementCompany] = useState('');
  const [formPrimaryContact, setFormPrimaryContact] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formBorough, setFormBorough] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const rows = await db.getAll(
        `SELECT * FROM buildings ORDER BY name`,
        []
      );

      setBuildings(rows as Building[]);
    } catch (error) {
      console.error('Failed to load buildings:', error);
      Alert.alert('Error', 'Failed to load buildings');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (building: Building) => {
    setFormName(building.name);
    setFormAddress(building.address);
    setFormLatitude(String(building.latitude));
    setFormLongitude(String(building.longitude));
    setFormUnits(String(building.number_of_units || ''));
    setFormYearBuilt(String(building.year_built || ''));
    setFormSquareFeet(String(building.square_footage || ''));
    setFormManagementCompany(building.management_company || '');
    setFormPrimaryContact(building.primary_contact || '');
    setFormContactPhone(building.contact_phone || '');
    setFormBorough(building.borough || '');
    setFormNotes(building.special_notes || '');
    setFormIsActive(Boolean(building.is_active));
    setEditingBuilding(building);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      Alert.alert('Validation Error', 'Name and Address are required');
      return;
    }

    const lat = parseFloat(formLatitude);
    const lng = parseFloat(formLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Validation Error', 'Valid coordinates are required');
      return;
    }

    try {
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const now = new Date().toISOString();

      if (editingBuilding) {
        await db.run(
          `UPDATE buildings SET
            name = ?,
            address = ?,
            latitude = ?,
            longitude = ?,
            number_of_units = ?,
            year_built = ?,
            square_footage = ?,
            management_company = ?,
            primary_contact = ?,
            contact_phone = ?,
            borough = ?,
            special_notes = ?,
            is_active = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            formName,
            formAddress,
            lat,
            lng,
            formUnits ? parseInt(formUnits) : null,
            formYearBuilt ? parseInt(formYearBuilt) : null,
            formSquareFeet ? parseInt(formSquareFeet) : null,
            formManagementCompany || null,
            formPrimaryContact || null,
            formContactPhone || null,
            formBorough || null,
            formNotes || null,
            formIsActive ? 1 : 0,
            now,
            editingBuilding.id
          ]
        );

        setShowEditModal(false);
        await loadBuildings();
        Alert.alert('Success', 'Building updated successfully');
      }
    } catch (error) {
      console.error('Failed to save building:', error);
      Alert.alert('Error', 'Failed to save building');
    }
  };

  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBuilding = ({ item }: { item: Building }) => {
    const routineCount = 0; // Could be loaded from DB

    return (
      <TouchableOpacity
        style={styles.buildingCard}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.buildingHeader}>
          <View style={styles.buildingTitleContainer}>
            <Text style={styles.buildingName}>{item.name}</Text>
            <Text style={styles.buildingId}>ID: {item.id}</Text>
          </View>
          <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>
              {item.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <Text style={styles.buildingAddress}>📍 {item.address}</Text>

        {item.borough && (
          <Text style={styles.buildingBorough}>🗺️ {item.borough}</Text>
        )}

        <View style={styles.buildingStats}>
          {item.number_of_units && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Units</Text>
              <Text style={styles.statValue}>{item.number_of_units}</Text>
            </View>
          )}
          {item.square_footage && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sq Ft</Text>
              <Text style={styles.statValue}>{item.square_footage.toLocaleString()}</Text>
            </View>
          )}
          {item.year_built && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Built</Text>
              <Text style={styles.statValue}>{item.year_built}</Text>
            </View>
          )}
        </View>

        {item.management_company && (
          <Text style={styles.buildingManagement}>🏛️ {item.management_company}</Text>
        )}

        {item.primary_contact && (
          <Text style={styles.buildingContact}>
            👤 {item.primary_contact}
            {item.contact_phone && ` • ${item.contact_phone}`}
          </Text>
        )}

        {item.compliance_score !== undefined && (
          <View style={styles.complianceContainer}>
            <Text style={styles.complianceLabel}>Compliance Score</Text>
            <Text style={[
              styles.complianceScore,
              item.compliance_score >= 90 ? styles.complianceGood :
              item.compliance_score >= 70 ? styles.complianceWarning :
              styles.compliancePoor
            ]}>
              {Math.round(item.compliance_score * 100)}%
            </Text>
            <Text style={styles.complianceGrade}>
              {item.compliance_score >= 0.95 ? 'A+' :
               item.compliance_score >= 0.90 ? 'A' :
               item.compliance_score >= 0.85 ? 'A-' :
               item.compliance_score >= 0.80 ? 'B+' :
               item.compliance_score >= 0.75 ? 'B' :
               item.compliance_score >= 0.70 ? 'B-' :
               item.compliance_score >= 0.65 ? 'C+' :
               item.compliance_score >= 0.60 ? 'C' :
               item.compliance_score >= 0.50 ? 'D' : 'F'}
            </Text>
          </View>
        )}

        <View style={styles.buildingCoordinates}>
          <Text style={styles.coordinateText}>
            📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Building Configuration</Text>
        <Text style={styles.headerSubtitle}>{buildings.length} buildings</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buildings..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredBuildings}
        keyExtractor={item => item.id}
        renderItem={renderBuilding}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No buildings found</Text>
          </View>
        }
      />

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Building</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Building name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Full address"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formLatitude}
                  onChangeText={setFormLatitude}
                  placeholder="40.7589"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formLongitude}
                  onChangeText={setFormLongitude}
                  placeholder="-73.9851"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Units</Text>
                <TextInput
                  style={styles.input}
                  value={formUnits}
                  onChangeText={setFormUnits}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Year Built</Text>
                <TextInput
                  style={styles.input}
                  value={formYearBuilt}
                  onChangeText={setFormYearBuilt}
                  placeholder="2020"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Square Footage</Text>
              <TextInput
                style={styles.input}
                value={formSquareFeet}
                onChangeText={setFormSquareFeet}
                placeholder="0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Borough</Text>
              <View style={styles.boroughButtons}>
                {['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].map(borough => (
                  <TouchableOpacity
                    key={borough}
                    style={[
                      styles.boroughButton,
                      formBorough === borough && styles.boroughButtonActive
                    ]}
                    onPress={() => setFormBorough(borough)}
                  >
                    <Text
                      style={[
                        styles.boroughButtonText,
                        formBorough === borough && styles.boroughButtonTextActive
                      ]}
                    >
                      {borough}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Management Company</Text>
              <TextInput
                style={styles.input}
                value={formManagementCompany}
                onChangeText={setFormManagementCompany}
                placeholder="Company name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Primary Contact</Text>
              <TextInput
                style={styles.input}
                value={formPrimaryContact}
                onChangeText={setFormPrimaryContact}
                placeholder="Contact name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={formContactPhone}
                onChangeText={setFormContactPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Special Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Optional notes"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                  thumbColor={formIsActive ? '#fff' : '#9ca3af'}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  buildingCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  buildingTitleContainer: {
    flex: 1,
  },
  buildingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  buildingId: {
    color: '#6b7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  buildingAddress: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
  },
  buildingBorough: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 12,
  },
  buildingStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  buildingManagement: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 4,
  },
  buildingContact: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 8,
  },
  complianceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  complianceLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  complianceScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  complianceGrade: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  complianceGood: {
    color: '#10b981',
  },
  complianceWarning: {
    color: '#f59e0b',
  },
  compliancePoor: {
    color: '#ef4444',
  },
  buildingCoordinates: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  coordinateText: {
    color: '#6b7280',
    fontSize: 11,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalCancel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  boroughButtons: {
    gap: 8,
  },
  boroughButton: {
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
  },
  boroughButtonActive: {
    backgroundColor: '#10b981',
  },
  boroughButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  boroughButtonTextActive: {
    color: '#000',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default BuildingConfigurationScreen;
