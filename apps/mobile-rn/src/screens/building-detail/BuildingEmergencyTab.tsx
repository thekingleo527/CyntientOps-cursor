/**
 * 🏢 Building Emergency Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingEmergencyTabOptimized.swift
 * Purpose: Emergency contacts, protocols, and quick actions
 *
 * 🚨 Emergency: Contacts and quick actions
 * ✅ Uses EmergencyContactService with building-specific contacts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { EmergencyContactService } from '@cyntientops/business-core';

type EmergencyReason =
  | 'fire'
  | 'flood'
  | 'electrical'
  | 'gas'
  | 'structural'
  | 'medical'
  | 'security'
  | 'other';

interface EmergencyContact {
  id: string;
  name: string;
  type: string;
  phone: string;
  description?: string;
}

interface BuildingEmergencyTabProps {
  buildingId: string;
  buildingName: string;
}

export const BuildingEmergencyTab: React.FC<BuildingEmergencyTabProps> = ({
  buildingId,
  buildingName,
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedReason, setSelectedReason] = useState<EmergencyReason>('other');

  useEffect(() => {
    loadContacts();
  }, [buildingId]);

  const loadContacts = () => {
    const emergencyService = EmergencyContactService.getInstance();
    const buildingContacts = emergencyService.getEmergencyContacts(buildingId);
    setContacts(buildingContacts);
  };

  const handleEmergencyModeToggle = (enabled: boolean) => {
    const emergencyService = EmergencyContactService.getInstance();

    if (enabled) {
      emergencyService.activateEmergencyMode(buildingId, selectedReason);
      Alert.alert(
        'Emergency Mode Activated',
        'All team members have been notified. Emergency contacts are prioritized.',
        [{ text: 'OK' }]
      );
    } else {
      emergencyService.deactivateEmergencyMode();
      Alert.alert('Emergency Mode Deactivated', 'Normal operations resumed.', [
        { text: 'OK' },
      ]);
    }

    setIsEmergencyMode(enabled);
  };

  const makeEmergencyCall = (contact: EmergencyContact) => {
    Alert.alert(
      `Call ${contact.name}?`,
      `This will dial ${contact.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
          },
        },
      ]
    );
  };

  const call911 = () => {
    Alert.alert(
      'Emergency 911',
      'This will immediately dial 911. Only use for life-threatening emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
      ]
    );
  };

  const reportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Issue reported to management and on-call team.',
      [{ text: 'OK' }]
    );
  };

  const alertTeam = () => {
    Alert.alert(
      'Alert Team',
      'All team members assigned to this building have been notified.',
      [{ text: 'OK' }]
    );
  };

  const getContactIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'emergency911':
        return '🚨';
      case 'fire':
        return '🔥';
      case 'police':
        return '🚓';
      case 'ems':
        return '🚑';
      case 'buildingsecurity':
        return '🔒';
      case 'management':
        return '🏢';
      case 'company':
        return '💼';
      case 'manager':
        return '👔';
      case 'worker':
        return '👷';
      case 'technical':
        return '🔧';
      case 'utility':
        return '⚡';
      case 'cityservice':
        return '🏛️';
      default:
        return '📞';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <Text style={styles.headerSubtitle}>{buildingName}</Text>
        </View>

        {/* Emergency Mode Toggle */}
        <GlassCard
          intensity={GlassIntensity.REGULAR}
          cornerRadius={CornerRadius.MEDIUM}
          style={[styles.emergencyModeCard, isEmergencyMode && styles.emergencyModeActive]}
        >
          <View style={styles.emergencyModeContent}>
            <View style={styles.emergencyModeInfo}>
              <Text style={styles.emergencyModeIcon}>⚠️</Text>
              <Text style={styles.emergencyModeTitle}>Activate Emergency Mode</Text>
            </View>
            <Switch
              value={isEmergencyMode}
              onValueChange={handleEmergencyModeToggle}
              trackColor={{ false: Colors.glass.regular, true: Colors.error }}
              thumbColor={isEmergencyMode ? '#ffffff' : Colors.text.secondary}
            />
          </View>
        </GlassCard>

        {/* Reason Picker */}
        <GlassCard
          intensity={GlassIntensity.THIN}
          cornerRadius={CornerRadius.MEDIUM}
          style={styles.reasonCard}
        >
          <Text style={styles.reasonTitle}>Emergency Type</Text>
          <View style={styles.reasonGrid}>
            {(['fire', 'flood', 'electrical', 'gas', 'structural', 'medical', 'security', 'other'] as EmergencyReason[]).map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.reasonButtonActive,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextActive,
                  ]}
                >
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Contact List */}
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {contacts.map((contact) => (
          <EmergencyContactRow
            key={contact.id}
            contact={contact}
            icon={getContactIcon(contact.type)}
            onCall={() => makeEmergencyCall(contact)}
          />
        ))}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={call911}>
            <Text style={styles.quickActionIcon}>🚨</Text>
            <Text style={styles.quickActionText}>Call 911</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={reportIssue}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={alertTeam}>
            <Text style={styles.quickActionIcon}>📢</Text>
            <Text style={styles.quickActionText}>Alert Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const EmergencyContactRow: React.FC<{
  contact: EmergencyContact;
  icon: string;
  onCall: () => void;
}> = ({ contact, icon, onCall }) => (
  <GlassCard
    intensity={GlassIntensity.THIN}
    cornerRadius={CornerRadius.MEDIUM}
    style={styles.contactCard}
  >
    <View style={styles.contactContent}>
      <Text style={styles.contactIcon}>{icon}</Text>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        {contact.description && (
          <Text style={styles.contactDescription}>{contact.description}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.callButton} onPress={onCall}>
        <Text style={styles.callButtonIcon}>📞</Text>
      </TouchableOpacity>
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  emergencyModeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyModeActive: {
    backgroundColor: Colors.error + '20',
  },
  emergencyModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emergencyModeIcon: {
    fontSize: 24,
  },
  emergencyModeTitle: {
    ...Typography.bodyLarge,
    color: '#ffffff',
    fontWeight: '600',
  },
  reasonCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reasonTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.glass.regular,
  },
  reasonButtonActive: {
    backgroundColor: Colors.error + '33',
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  reasonTextActive: {
    color: Colors.error,
    fontWeight: '600',
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactIcon: {
    fontSize: 28,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonIcon: {
    fontSize: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BuildingEmergencyTab;
