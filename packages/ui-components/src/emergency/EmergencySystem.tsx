/**
 * 🚨 Emergency System
 * Purpose: Safety features and emergency contact system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { UserRole, NamedCoordinate } from '@cyntientops/domain-schema';
import { EmergencyMessagingSystem, EmergencyMessage, EmergencyAlert } from '../messaging/EmergencyMessagingSystem';

export interface EmergencySystemProps {
  userRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  currentLocation?: { latitude: number; longitude: number };
  currentBuilding?: NamedCoordinate;
  onEmergencyReported?: (emergency: EmergencyReport) => void;
  onSafetyCheck?: () => void;
  onMessageSent?: (message: EmergencyMessage) => void;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
}

export interface EmergencyReport {
  id: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  location: {
    latitude: number;
    longitude: number;
    buildingId?: string;
    buildingName?: string;
  };
  description: string;
  reporterId: string;
  reporterName: string;
  timestamp: Date;
  status: EmergencyStatus;
  contacts: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  department: string;
}

export enum EmergencyType {
  MEDICAL = 'medical',
  FIRE = 'fire',
  SECURITY = 'security',
  STRUCTURAL = 'structural',
  ENVIRONMENTAL = 'environmental',
  EQUIPMENT = 'equipment',
  SAFETY = 'safety',
  OTHER = 'other'
}

export enum EmergencySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EmergencyStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved'
}

export const EmergencySystem: React.FC<EmergencySystemProps> = ({
  userRole,
  currentUserId,
  currentUserName,
  currentLocation,
  currentBuilding,
  onEmergencyReported,
  onSafetyCheck,
  onMessageSent,
  onEmergencyAlert,
}) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<EmergencySeverity>(EmergencySeverity.MEDIUM);
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [recentEmergencies, setRecentEmergencies] = useState<EmergencyReport[]>([]);
  const [showMessagingSystem, setShowMessagingSystem] = useState(false);

  useEffect(() => {
    loadEmergencyContacts();
    loadRecentEmergencies();
  }, []);

  const loadEmergencyContacts = () => {
    // Mock emergency contacts - in real implementation, this would come from database
    const contacts: EmergencyContact[] = [
      {
        id: 'contact-1',
        name: 'Emergency Services',
        role: 'Emergency Response',
        phone: '911',
        isPrimary: true,
        department: 'Emergency'
      },
      {
        id: 'contact-2',
        name: 'Building Security',
        role: 'Security Manager',
        phone: '+1-555-0123',
        email: 'security@cyntientops.com',
        isPrimary: true,
        department: 'Security'
      },
      {
        id: 'contact-3',
        name: 'Safety Coordinator',
        role: 'Safety Manager',
        phone: '+1-555-0124',
        email: 'safety@cyntientops.com',
        isPrimary: true,
        department: 'Safety'
      },
      {
        id: 'contact-4',
        name: 'Building Manager',
        role: 'Property Manager',
        phone: '+1-555-0125',
        email: 'manager@cyntientops.com',
        isPrimary: false,
        department: 'Management'
      },
      {
        id: 'contact-5',
        name: 'Maintenance Supervisor',
        role: 'Maintenance Lead',
        phone: '+1-555-0126',
        email: 'maintenance@cyntientops.com',
        isPrimary: false,
        department: 'Maintenance'
      }
    ];
    setEmergencyContacts(contacts);
  };

  const loadRecentEmergencies = () => {
    // Mock recent emergencies - in real implementation, this would come from database
    const emergencies: EmergencyReport[] = [
      {
        id: 'emergency-1',
        type: EmergencyType.SAFETY,
        severity: EmergencySeverity.MEDIUM,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          buildingId: 'building-1',
          buildingName: 'Sample Building'
        },
        description: 'Slippery floor in lobby area',
        reporterId: 'worker-1',
        reporterName: 'John Worker',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: EmergencyStatus.RESOLVED,
        contacts: []
      }
    ];
    setRecentEmergencies(emergencies);
  };

  const handleEmergencyCall = (contact: EmergencyContact) => {
    Alert.alert(
      `Call ${contact.name}`,
      `Are you sure you want to call ${contact.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
          }
        }
      ]
    );
  };

  const handleEmergencyEmail = (contact: EmergencyContact) => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}?subject=Emergency Report&body=Emergency details...`);
    }
  };

  const handleReportEmergency = async () => {
    if (!selectedEmergencyType || !emergencyDescription.trim()) {
      Alert.alert('Error', 'Please select emergency type and provide description.');
      return;
    }

    setIsReporting(true);
    try {
      const emergency: EmergencyReport = {
        id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedEmergencyType,
        severity: selectedSeverity,
        location: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          buildingId: currentBuilding?.id,
          buildingName: currentBuilding?.name
        },
        description: emergencyDescription,
        reporterId: 'current-user', // In real implementation, get from auth
        reporterName: 'Current User', // In real implementation, get from auth
        timestamp: new Date(),
        status: EmergencyStatus.REPORTED,
        contacts: emergencyContacts.filter(c => c.isPrimary)
      };

      // Report emergency
      onEmergencyReported?.(emergency);
      
      // Send emergency message to all relevant parties
      const emergencyMessage: EmergencyMessage = {
        id: `emergency_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: userRole,
        messageType: 'emergency' as any,
        priority: selectedSeverity === EmergencySeverity.CRITICAL ? 'critical' as any : 'high' as any,
        content: `EMERGENCY REPORTED: ${selectedEmergencyType?.toUpperCase()} - ${emergencyDescription}`,
        timestamp: new Date(),
        isRead: false,
        location: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          buildingId: currentBuilding?.id,
          buildingName: currentBuilding?.name
        },
        emergencyId: emergency.id
      };
      onMessageSent?.(emergencyMessage);

      // Send emergency alert
      const emergencyAlert: EmergencyAlert = {
        id: `emergency_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'emergency_report' as any,
        severity: selectedSeverity === EmergencySeverity.CRITICAL ? 'critical' as any : 'warning' as any,
        title: `${selectedEmergencyType?.toUpperCase()} Emergency`,
        message: emergencyDescription,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientRoles: ['admin', 'manager', 'worker'],
        timestamp: new Date(),
        isAcknowledged: false,
        location: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          buildingId: currentBuilding?.id,
          buildingName: currentBuilding?.name
        }
      };
      onEmergencyAlert?.(emergencyAlert);
      
      // Auto-call primary emergency contact for critical emergencies
      if (selectedSeverity === EmergencySeverity.CRITICAL) {
        const primaryContact = emergencyContacts.find(c => c.isPrimary && c.department === 'Emergency');
        if (primaryContact) {
          Alert.alert(
            'Critical Emergency',
            'This is a critical emergency. Calling emergency services now.',
            [
              {
                text: 'Call Now',
                onPress: () => handleEmergencyCall(primaryContact)
              }
            ]
          );
        }
      }

      // Reset form
      setSelectedEmergencyType(null);
      setSelectedSeverity(EmergencySeverity.MEDIUM);
      setEmergencyDescription('');
      setShowEmergencyModal(false);

      Alert.alert(
        'Emergency Reported',
        'Your emergency report has been submitted successfully. Emergency contacts have been notified.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error reporting emergency:', error);
      Alert.alert('Error', 'Failed to report emergency. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  const getEmergencyTypeIcon = (type: EmergencyType): string => {
    switch (type) {
      case EmergencyType.MEDICAL: return '🏥';
      case EmergencyType.FIRE: return '🔥';
      case EmergencyType.SECURITY: return '🛡️';
      case EmergencyType.STRUCTURAL: return '🏗️';
      case EmergencyType.ENVIRONMENTAL: return '🌍';
      case EmergencyType.EQUIPMENT: return '🔧';
      case EmergencyType.SAFETY: return '⚠️';
      case EmergencyType.OTHER: return '🚨';
      default: return '🚨';
    }
  };

  const getSeverityColor = (severity: EmergencySeverity): string => {
    switch (severity) {
      case EmergencySeverity.LOW: return Colors.status.success;
      case EmergencySeverity.MEDIUM: return Colors.status.warning;
      case EmergencySeverity.HIGH: return Colors.status.warning;
      case EmergencySeverity.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getStatusColor = (status: EmergencyStatus): string => {
    switch (status) {
      case EmergencyStatus.REPORTED: return Colors.status.warning;
      case EmergencyStatus.ACKNOWLEDGED: return Colors.status.info;
      case EmergencyStatus.RESPONDING: return Colors.status.warning;
      case EmergencyStatus.RESOLVED: return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  const renderEmergencyButton = () => (
    <TouchableOpacity
      style={styles.emergencyButton}
      onPress={() => setShowEmergencyModal(true)}
    >
      <Text style={styles.emergencyButtonIcon}>🚨</Text>
      <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
    </TouchableOpacity>
  );

  const renderEmergencyContacts = () => (
    <View style={styles.contactsSection}>
      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      {emergencyContacts.map(contact => (
        <View key={contact.id} style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactRole}>{contact.role}</Text>
            <Text style={styles.contactDepartment}>{contact.department}</Text>
          </View>
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleEmergencyCall(contact)}
            >
              <Text style={styles.contactButtonText}>📞</Text>
            </TouchableOpacity>
            {contact.email && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleEmergencyEmail(contact)}
              >
                <Text style={styles.contactButtonText}>📧</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderRecentEmergencies = () => (
    <View style={styles.emergenciesSection}>
      <Text style={styles.sectionTitle}>Recent Emergencies</Text>
      {recentEmergencies.length === 0 ? (
        <Text style={styles.noEmergenciesText}>No recent emergencies</Text>
      ) : (
        recentEmergencies.map(emergency => (
          <View key={emergency.id} style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyIcon}>
                {getEmergencyTypeIcon(emergency.type)}
              </Text>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyType}>
                  {emergency.type.toUpperCase()}
                </Text>
                <Text style={styles.emergencyTime}>
                  {emergency.timestamp.toLocaleString()}
                </Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(emergency.severity) }
              ]}>
                <Text style={styles.severityText}>
                  {emergency.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.emergencyDescription}>
              {emergency.description}
            </Text>
            <View style={styles.emergencyFooter}>
              <Text style={styles.emergencyReporter}>
                Reported by: {emergency.reporterName}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(emergency.status) }
              ]}>
                <Text style={styles.statusText}>
                  {emergency.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderEmergencyModal = () => (
    <Modal
      visible={showEmergencyModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowEmergencyModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Report Emergency</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowEmergencyModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.emergencyTypeSection}>
            <Text style={styles.inputLabel}>Emergency Type</Text>
            <View style={styles.emergencyTypeGrid}>
              {Object.values(EmergencyType).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.emergencyTypeButton,
                    selectedEmergencyType === type && styles.selectedEmergencyTypeButton,
                  ]}
                  onPress={() => setSelectedEmergencyType(type)}
                >
                  <Text style={styles.emergencyTypeIcon}>
                    {getEmergencyTypeIcon(type)}
                  </Text>
                  <Text style={[
                    styles.emergencyTypeText,
                    selectedEmergencyType === type && styles.selectedEmergencyTypeText,
                  ]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.severitySection}>
            <Text style={styles.inputLabel}>Severity Level</Text>
            <View style={styles.severityButtons}>
              {Object.values(EmergencySeverity).map(severity => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    { backgroundColor: getSeverityColor(severity) + '20' },
                    selectedSeverity === severity && { backgroundColor: getSeverityColor(severity) }
                  ]}
                  onPress={() => setSelectedSeverity(severity)}
                >
                  <Text style={[
                    styles.severityButtonText,
                    selectedSeverity === severity && { color: Colors.text.primary }
                  ]}>
                    {severity.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.descriptionInput}>
              <Text style={styles.descriptionPlaceholder}>
                Describe the emergency situation in detail...
              </Text>
            </View>
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.inputLabel}>Location</Text>
            <Text style={styles.locationText}>
              {currentBuilding ? currentBuilding.name : 'Current Location'}
            </Text>
            {currentLocation && (
              <Text style={styles.coordinatesText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowEmergencyModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.reportButton,
              { backgroundColor: getSeverityColor(selectedSeverity) }
            ]}
            onPress={handleReportEmergency}
            disabled={isReporting}
          >
            {isReporting ? (
              <ActivityIndicator color={Colors.text.primary} />
            ) : (
              <Text style={styles.reportButtonText}>Report Emergency</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (showMessagingSystem) {
    return (
      <EmergencyMessagingSystem
        userRole={userRole}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentLocation={currentLocation}
        currentBuilding={currentBuilding}
        onMessageSent={onMessageSent}
        onEmergencyAlert={onEmergencyAlert}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderEmergencyButton()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.messagingSection}>
          <Text style={styles.sectionTitle}>Emergency Communication</Text>
          <TouchableOpacity
            style={styles.messagingButton}
            onPress={() => setShowMessagingSystem(true)}
          >
            <Text style={styles.messagingButtonText}>💬 Open Messaging System</Text>
          </TouchableOpacity>
        </View>
        
        {renderEmergencyContacts()}
        {renderRecentEmergencies()}
      </ScrollView>

      {renderEmergencyModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  emergencyButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1000,
    backgroundColor: Colors.status.error,
    borderRadius: 30,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.status.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  emergencyButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: 80, // Space for emergency button
  },
  messagingSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  messagingButton: {
    backgroundColor: Colors.status.info,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  messagingButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  contactsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  contactCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  contactRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  contactDepartment: {
    ...Typography.captionSmall,
    color: Colors.status.info,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.status.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
  },
  emergenciesSection: {
    padding: Spacing.lg,
  },
  noEmergenciesText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emergencyCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyType: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  emergencyTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  severityText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  emergencyDescription: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emergencyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyReporter: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
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
    backgroundColor: Colors.glass.regular,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  emergencyTypeSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  emergencyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emergencyTypeButton: {
    width: '48%',
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedEmergencyTypeButton: {
        backgroundColor: Colors.status.info + '20',
    borderColor: Colors.status.info,
  },
  emergencyTypeIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  emergencyTypeText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedEmergencyTypeText: {
    color: Colors.status.info,
    fontWeight: '600',
  },
  severitySection: {
    marginBottom: Spacing.lg,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  severityButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: Spacing.lg,
  },
  descriptionInput: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
    padding: Spacing.md,
    minHeight: 100,
  },
  descriptionPlaceholder: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  locationSection: {
    marginBottom: Spacing.lg,
  },
  locationText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  coordinatesText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  reportButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});

export default EmergencySystem;
