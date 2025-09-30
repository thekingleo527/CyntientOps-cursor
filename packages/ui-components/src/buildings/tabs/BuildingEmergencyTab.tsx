/**
 * 🚨 Building Emergency Tab
 * Mirrors: SwiftUI BuildingDetailView Emergency tab functionality
 * Purpose: Emergency contacts, procedures, and response management
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingEmergencyTabProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  container: ServiceContainer;
  onCall?: (contact: any) => void;
  onMessage?: (contact: any) => void;
  onEmergencyReport?: (report: any) => void;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isEmergency: boolean;
  notes?: string;
}

export const BuildingEmergencyTab: React.FC<BuildingEmergencyTabProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  container,
  onCall,
  onMessage,
  onEmergencyReport
}) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmergencyData();
  }, [buildingId]);

  const loadEmergencyData = async () => {
    setIsLoading(true);
    try {
      const contacts = await generateEmergencyContacts(buildingId);
      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('Failed to load emergency data:', error);
      Alert.alert('Error', 'Failed to load emergency data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmergencyContacts = async (buildingId: string): Promise<EmergencyContact[]> => {
    const buildingContacts = {
      '1': [
        {
          id: 'contact_1_1',
          name: 'David Edelman',
          role: 'J&M Realty Portfolio Manager',
          phone: '+1 (212) 555-0200',
          email: 'David@jmrealty.org',
          isPrimary: true,
          isEmergency: true,
          notes: 'Primary contact for all building issues'
        },
        {
          id: 'contact_1_2',
          name: 'Franco Response Team',
          role: '24/7 Emergency Response',
          phone: '(212) 555-0911',
          isPrimary: false,
          isEmergency: true,
          notes: '24/7 emergency response team'
        }
      ],
      '4': [
        {
          id: 'contact_4_1',
          name: 'Moises Farhat',
          role: 'Weber Farhat Realty Manager',
          phone: '+1 (212) 555-0201',
          email: 'mfarhat@farhatrealtymanagement.com',
          isPrimary: true,
          isEmergency: true,
          notes: 'Museum area specialist'
        }
      ]
    };

    return buildingContacts[buildingId as keyof typeof buildingContacts] || [];
  };

  const handleCall = (contact: EmergencyContact) => {
    const cleanNumber = contact.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
    onCall?.(contact);
  };

  const handleEmergencyReport = () => {
    const report = {
      buildingId,
      buildingName,
      buildingAddress,
      timestamp: new Date(),
      type: 'emergency'
    };
    onEmergencyReport?.(report);
    Alert.alert('Emergency Report', 'Emergency report has been submitted');
  };

  const renderEmergencyContact = (contact: EmergencyContact) => {
    return (
      <GlassCard 
        key={contact.id}
        style={[
          styles.contactCard,
          contact.isEmergency && styles.emergencyContactCard
        ]} 
        intensity={GlassIntensity.REGULAR} 
        cornerRadius={CornerRadius.CARD}
      >
        <View style={styles.contactHeader}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactRole}>{contact.role}</Text>
            {contact.isPrimary && (
              <Text style={styles.primaryBadge}>PRIMARY</Text>
            )}
          </View>
        </View>

        <View style={styles.contactDetails}>
          <Text style={styles.contactPhone}>📞 {contact.phone}</Text>
          {contact.email && (
            <Text style={styles.contactEmail}>📧 {contact.email}</Text>
          )}
          {contact.notes && (
            <Text style={styles.contactNotes}>{contact.notes}</Text>
          )}
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => handleCall(contact)}
          >
            <Text style={styles.callButtonText}>📞 Call</Text>
          </TouchableOpacity>
          {contact.email && (
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => onMessage?.(contact)}
            >
              <Text style={styles.messageButtonText}>📧 Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading emergency data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚨 Emergency Management</Text>
          <Text style={styles.headerSubtitle}>
            Emergency contacts and procedures for {buildingName}
          </Text>
        </View>

        <GlassCard style={styles.quickActionsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.emergencyButton]}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Text style={styles.quickActionIcon}>🚨</Text>
              <Text style={styles.quickActionText}>Call 911</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.reportButton]}
              onPress={handleEmergencyReport}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Report Emergency</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.contactsContainer}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {emergencyContacts.map(renderEmergencyContact)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  quickActionsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  quickActionsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: Colors.critical,
  },
  reportButton: {
    backgroundColor: Colors.warning,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  contactsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  contactCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  emergencyContactCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  contactHeader: {
    marginBottom: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRole: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  primaryBadge: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: 'bold',
    fontSize: 10,
  },
  contactDetails: {
    marginBottom: Spacing.md,
  },
  contactPhone: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  contactEmail: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  contactNotes: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  callButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.info,
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  messageButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
});

export default BuildingEmergencyTab;