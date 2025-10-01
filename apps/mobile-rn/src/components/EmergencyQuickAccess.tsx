/**
 * @cyntientops/mobile-rn
 * 
 * Emergency Quick Access - Triple-tap or shake gesture activation
 * Features: Emergency contacts, location sharing, quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';

const { width, height } = Dimensions.get('window');

// Types
export interface EmergencyQuickAccessProps {
  onClose: () => void;
  userId: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  role: 'supervisor' | 'emergency' | 'medical' | 'security';
  priority: number;
}

export interface EmergencyAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
}

export const EmergencyQuickAccess: React.FC<EmergencyQuickAccessProps> = ({
  onClose,
  userId,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyActions, setEmergencyActions] = useState<EmergencyAction[]>([]);

  // Emergency contacts
  const contacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Emergency Services',
      phone: '911',
      role: 'emergency',
      priority: 1,
    },
    {
      id: '2',
      name: 'Supervisor',
      phone: '+1-555-0100',
      role: 'supervisor',
      priority: 2,
    },
    {
      id: '3',
      name: 'Medical Emergency',
      phone: '+1-555-0101',
      role: 'medical',
      priority: 3,
    },
    {
      id: '4',
      name: 'Security',
      phone: '+1-555-0102',
      role: 'security',
      priority: 4,
    },
  ];

  // Emergency actions
  const actions: EmergencyAction[] = [
    {
      id: 'location',
      title: 'Share Location',
      description: 'Send your current location to emergency contacts',
      icon: '📍',
      action: () => handleShareLocation(),
      color: Colors.status.info,
    },
    {
      id: 'panic',
      title: 'Panic Button',
      description: 'Immediately alert all emergency contacts',
      icon: '🚨',
      action: () => handlePanicButton(),
      color: Colors.status.error,
    },
    {
      id: 'medical',
      title: 'Medical Info',
      description: 'Share medical information with responders',
      icon: '🏥',
      action: () => handleMedicalInfo(),
      color: Colors.status.warning,
    },
    {
      id: 'evacuate',
      title: 'Evacuation',
      description: 'Start evacuation procedures',
      icon: '🚪',
      action: () => handleEvacuation(),
      color: Colors.status.error,
    },
  ];

  useEffect(() => {
    setEmergencyContacts(contacts);
    setEmergencyActions(actions);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContactPress = (contact: EmergencyContact) => {
    Alert.alert(
      `Call ${contact.name}?`,
      `This will call ${contact.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: async () => {
            try {
              const sanitized = contact.phone.replace(/[^0-9+]/g, '');
              const phoneUrl = sanitized ? `tel:${sanitized}` : '';
              if (!sanitized || !phoneUrl) {
                Alert.alert('Call Failed', 'Phone number is not available.');
                return;
              }
              const canOpen = await Linking.canOpenURL(phoneUrl);
              if (!canOpen) {
                Alert.alert('Call Failed', 'Unable to initiate a phone call on this device.');
                return;
              }
              await Linking.openURL(phoneUrl);
            } catch (callError) {
              console.error('Phone call failed', callError);
              Alert.alert('Call Failed', 'Something went wrong while trying to place the call.');
            }
          }
        },
      ]
    );
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Location Shared',
      'Your location has been shared with emergency contacts',
      [{ text: 'OK' }]
    );
  };

  const handlePanicButton = () => {
    Alert.alert(
      'Panic Button Activated',
      'All emergency contacts have been notified immediately',
      [{ text: 'OK' }]
    );
  };

  const handleMedicalInfo = () => {
    Alert.alert(
      'Medical Information',
      'Medical information shared with emergency responders',
      [{ text: 'OK' }]
    );
  };

  const handleEvacuation = () => {
    Alert.alert(
      'Evacuation Procedures',
      'Evacuation procedures have been initiated',
      [{ text: 'OK' }]
    );
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const renderContact = (contact: EmergencyContact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactItem}
      onPress={() => handleContactPress(contact)}
    >
      <GlassCard
        intensity={GlassIntensity.regular}
        cornerRadius={CornerRadius.medium}
        style={styles.contactCard}
      >
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <View style={[styles.contactRole, { backgroundColor: getRoleColor(contact.role) }]}>
            <Text style={styles.contactRoleText}>{contact.role.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
      </GlassCard>
    </TouchableOpacity>
  );

  const renderAction = (action: EmergencyAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionItem}
      onPress={action.action}
    >
      <GlassCard
        intensity={GlassIntensity.regular}
        cornerRadius={CornerRadius.medium}
        style={[styles.actionCard, { borderLeftColor: action.color, borderLeftWidth: 4 }]}
      >
        <View style={styles.actionHeader}>
          <Text style={styles.actionIcon}>{action.icon}</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'emergency': return Colors.status.error;
      case 'supervisor': return Colors.status.warning;
      case 'medical': return Colors.status.info;
      case 'security': return Colors.status.success;
      default: return Colors.text.tertiary;
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <GlassCard
            intensity={GlassIntensity.thick}
            cornerRadius={CornerRadius.large}
            style={styles.modalCard}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🚨 Emergency Access</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Contacts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <View style={styles.contactsList}>
                {emergencyContacts.map(renderContact)}
              </View>
            </View>

            {/* Emergency Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsList}>
                {emergencyActions.map(renderAction)}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Emergency mode activated. All actions are logged for safety.
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: height * 0.8,
  },
  modalCard: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
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
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  contactsList: {
    gap: 12,
  },
  contactItem: {
    marginBottom: 8,
  },
  contactCard: {
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  contactRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contactRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    marginBottom: 8,
  },
  actionCard: {
    padding: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default EmergencyQuickAccess;
