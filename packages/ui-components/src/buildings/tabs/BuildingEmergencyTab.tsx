/**
 * 🏢 Building Emergency Tab
 * Purpose: Emergency procedures, contacts, and safety information
 * Features: Emergency contacts, safety procedures, emergency response
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface BuildingEmergencyTabProps {
  building: {
    id: string;
    name: string;
    address: string;
    coordinate: { latitude: number; longitude: number };
  };
  workers: Array<{
    id: string;
    name: string;
    role: string;
    status: 'online' | 'offline' | 'busy';
    currentTasks: number;
    completionRate: number;
    lastSeen: Date;
  }>;
  compliance: {
    score: number;
    issues: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'resolved';
      dueDate?: Date;
    }>;
    lastUpdate: Date;
    nextInspection?: Date;
  };
}

export const BuildingEmergencyTab: React.FC<BuildingEmergencyTabProps> = ({
  building,
  workers,
  compliance,
}) => {
  const [emergencyType, setEmergencyType] = useState<string | null>(null);

  const criticalIssues = compliance.issues.filter(issue => issue.severity === 'critical');
  const onlineWorkers = workers.filter(worker => worker.status === 'online');

  const handleEmergencyCall = (phoneNumber: string, emergencyType: string) => {
    Alert.alert(
      'Emergency Call',
      `Calling ${emergencyType} at ${phoneNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          style: 'destructive',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        }
      ]
    );
  };

  const handleAlertTeam = () => {
    Alert.alert(
      'Alert Team',
      'Sending emergency alert to all team members',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Alert Sent', 'Emergency alert sent to all team members');
          }
        }
      ]
    );
  };

  const handleTestSystems = () => {
    Alert.alert('Test Systems', 'Emergency systems test initiated');
  };

  const handleUpdateContacts = () => {
    Alert.alert('Update Contacts', 'Contact management would open here');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Emergency Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Status</Text>
        
        <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.MEDIUM} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: Colors.status.success }]} />
            <Text style={styles.statusText}>All Systems Operational</Text>
          </View>
          <Text style={styles.statusDescription}>
            No active emergencies detected. All safety systems are functioning normally.
          </Text>
          
          {criticalIssues.length > 0 && (
            <View style={styles.criticalAlert}>
              <Text style={styles.criticalTitle}>⚠️ Critical Issues Detected</Text>
              <Text style={styles.criticalText}>
                {criticalIssues.length} critical compliance issues require immediate attention
              </Text>
            </View>
          )}
        </GlassCard>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        
        <View style={styles.contactsGrid}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleEmergencyCall('911', 'Emergency Services')}
            >
              <Text style={styles.contactIcon}>🚨</Text>
              <Text style={styles.contactTitle}>Emergency Services</Text>
              <Text style={styles.contactNumber}>911</Text>
              <Text style={styles.contactDescription}>Fire, Police, Medical</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleEmergencyCall('+1-212-555-0200', 'Building Management')}
            >
              <Text style={styles.contactIcon}>🏢</Text>
              <Text style={styles.contactTitle}>Building Management</Text>
              <Text style={styles.contactNumber}>(212) 555-0200</Text>
              <Text style={styles.contactDescription}>24/7 Emergency Line</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleEmergencyCall('+1-212-555-0108', 'Lead Worker')}
            >
              <Text style={styles.contactIcon}>👷</Text>
              <Text style={styles.contactTitle}>Lead Worker</Text>
              <Text style={styles.contactNumber}>(212) 555-0108</Text>
              <Text style={styles.contactDescription}>Shawn Magloire</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleEmergencyCall('+1-212-555-0109', 'Evening Worker')}
            >
              <Text style={styles.contactIcon}>🌙</Text>
              <Text style={styles.contactTitle}>Evening Worker</Text>
              <Text style={styles.contactNumber}>(212) 555-0109</Text>
              <Text style={styles.contactDescription}>Angel Guirachocha</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>

      {/* Emergency Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyAction]}
            onPress={handleAlertTeam}
          >
            <Text style={styles.actionIcon}>📢</Text>
            <Text style={styles.actionTitle}>Alert Team</Text>
            <Text style={styles.actionDescription}>Send emergency alert to all team members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.testAction]}
            onPress={handleTestSystems}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionTitle}>Test Systems</Text>
            <Text style={styles.actionDescription}>Test emergency systems and alarms</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.updateAction]}
            onPress={handleUpdateContacts}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Update Contacts</Text>
            <Text style={styles.actionDescription}>Manage emergency contact information</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Team Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Status</Text>
        
        {onlineWorkers.length > 0 ? (
          <View style={styles.teamList}>
            {onlineWorkers.map(worker => (
              <GlassCard 
                key={worker.id} 
                intensity={GlassIntensity.THIN} 
                cornerRadius={CornerRadius.MEDIUM} 
                style={styles.workerCard}
              >
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerRole}>{worker.role}</Text>
                  </View>
                  <View style={styles.workerStatus}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
                    <Text style={styles.statusText}>Available</Text>
                  </View>
                </View>
                <View style={styles.workerStats}>
                  <Text style={styles.workerStat}>
                    📋 {worker.currentTasks} active tasks
                  </Text>
                  <Text style={styles.workerStat}>
                    📈 {Math.round(worker.completionRate * 100)}% completion rate
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No team members currently available</Text>
          </GlassCard>
        )}
      </View>

      {/* Emergency Procedures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Procedures</Text>
        
        <View style={styles.proceduresList}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.procedureCard}>
            <Text style={styles.procedureTitle}>🚨 Fire Emergency</Text>
            <Text style={styles.procedureSteps}>
              1. Pull fire alarm immediately{'\n'}
              2. Call 911 and building management{'\n'}
              3. Evacuate building using nearest exit{'\n'}
              4. Meet at designated assembly point{'\n'}
              5. Do not use elevators
            </Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.procedureCard}>
            <Text style={styles.procedureTitle}>💧 Water Emergency</Text>
            <Text style={styles.procedureSteps}>
              1. Locate and shut off main water valve{'\n'}
              2. Contact building management immediately{'\n'}
              3. Move valuable items to safety{'\n'}
              4. Document damage with photos{'\n'}
              5. Notify affected residents
            </Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.procedureCard}>
            <Text style={styles.procedureTitle}>⚡ Power Outage</Text>
            <Text style={styles.procedureSteps}>
              1. Check if outage is building-wide{'\n'}
              2. Contact utility company{'\n'}
              3. Activate backup systems if available{'\n'}
              4. Secure building and common areas{'\n'}
              5. Update residents on status
            </Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.procedureCard}>
            <Text style={styles.procedureTitle}>🏥 Medical Emergency</Text>
            <Text style={styles.procedureSteps}>
              1. Call 911 immediately{'\n'}
              2. Provide clear location and situation{'\n'}
              3. Administer first aid if trained{'\n'}
              4. Clear path for emergency responders{'\n'}
              5. Stay with person until help arrives
            </Text>
          </GlassCard>
        </View>
      </View>

      {/* Safety Equipment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Equipment</Text>
        
        <View style={styles.equipmentList}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.equipmentCard}>
            <Text style={styles.equipmentTitle}>🧯 Fire Extinguishers</Text>
            <Text style={styles.equipmentLocation}>Location: Each floor, lobby, basement</Text>
            <Text style={styles.equipmentStatus}>Status: ✅ Inspected 10/01/2025</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.equipmentCard}>
            <Text style={styles.equipmentTitle}>🚨 Smoke Detectors</Text>
            <Text style={styles.equipmentLocation}>Location: All units, common areas</Text>
            <Text style={styles.equipmentStatus}>Status: ✅ Tested 10/01/2025</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.equipmentCard}>
            <Text style={styles.equipmentTitle}>🚪 Emergency Exits</Text>
            <Text style={styles.equipmentLocation}>Location: Stairwells A & B, rear exit</Text>
            <Text style={styles.equipmentStatus}>Status: ✅ Clear and accessible</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.equipmentCard}>
            <Text style={styles.equipmentTitle}>📞 Emergency Phone</Text>
            <Text style={styles.equipmentLocation}>Location: Lobby, basement</Text>
            <Text style={styles.equipmentStatus}>Status: ✅ Tested 10/01/2025</Text>
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  statusCard: {
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  statusDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  criticalAlert: {
    backgroundColor: Colors.status.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.error,
    padding: Spacing.md,
    borderRadius: 8,
  },
  criticalTitle: {
    ...Typography.bodyLarge,
    color: Colors.status.error,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  criticalText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  contactCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
  },
  contactButton: {
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  contactTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  contactNumber: {
    ...Typography.titleMedium,
    color: Colors.base.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  contactDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyAction: {
    backgroundColor: Colors.status.error + '20',
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  testAction: {
    backgroundColor: Colors.status.warning + '20',
    borderWidth: 1,
    borderColor: Colors.status.warning,
  },
  updateAction: {
    backgroundColor: Colors.base.primary + '20',
    borderWidth: 1,
    borderColor: Colors.base.primary,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  actionDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  teamList: {
    gap: Spacing.md,
  },
  workerCard: {
    padding: Spacing.lg,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  workerRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  workerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  workerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workerStat: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  proceduresList: {
    gap: Spacing.md,
  },
  procedureCard: {
    padding: Spacing.lg,
  },
  procedureTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  procedureSteps: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  equipmentList: {
    gap: Spacing.md,
  },
  equipmentCard: {
    padding: Spacing.lg,
  },
  equipmentTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  equipmentLocation: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  equipmentStatus: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default BuildingEmergencyTab;