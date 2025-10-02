/**
 * @cyntientops/ui-components
 * 
 * Quick Actions Overlay Content - Full quick actions view
 * Contains: 4 main actions + center + button for custom actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';

export interface QuickActionType {
  id: 'photo' | 'vendor_log' | 'quick_note' | 'emergency';
  title: string;
  icon: string;
  color: string;
}

const QUICK_ACTIONS: QuickActionType[] = [
  { id: 'photo', title: 'Take Photo', icon: '📸', color: Colors.role.worker.primary },
  { id: 'vendor_log', title: 'Vendor Log', icon: '📝', color: Colors.status.info },
  { id: 'quick_note', title: 'Quick Note', icon: '📋', color: Colors.status.warning },
  { id: 'emergency', title: 'Emergency', icon: '🚨', color: Colors.status.error },
];

export interface QuickActionsOverlayContentProps {
  workerId: string;
  workerName: string;
  onActionPress: (actionId: string) => void;
}

export const QuickActionsOverlayContent: React.FC<QuickActionsOverlayContentProps> = ({
  workerId,
  workerName,
  onActionPress,
}) => {
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'photo':
        Alert.alert('Take Photo', 'Opening camera for task documentation...');
        break;
      case 'vendor_log':
        Alert.alert('Vendor Log', 'Opening vendor log form...');
        break;
      case 'quick_note':
        Alert.alert('Quick Note', 'Opening note-taking interface...');
        break;
      case 'emergency':
        Alert.alert('Emergency', 'Opening emergency reporting system...');
        break;
    }
    onActionPress(actionId);
  };

  const handleAddQuickAction = () => {
    Alert.alert('Add Quick Action', 'Custom quick action creation coming soon...');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>Tap any action to get started</Text>
        
        {/* Quick Actions Grid with + in center */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionButton,
                  { backgroundColor: action.color + '20' }
                ]}
                onPress={() => handleQuickAction(action.id)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Center + Button */}
          <View style={styles.centerPlusContainer}>
            <TouchableOpacity
              style={styles.centerPlusButton}
              onPress={handleAddQuickAction}
            >
              <LinearGradient
                colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
                style={styles.centerPlusGradient}
              >
                <Text style={styles.centerPlusText}>+</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.centerPlusLabel}>Add Action</Text>
          </View>
        </View>

        {/* Recent Actions */}
        <View style={styles.recentActionsSection}>
          <Text style={styles.recentActionsTitle}>Recent Actions</Text>
          <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.recentActionsCard}>
            <View style={styles.recentActionItem}>
              <Text style={styles.recentActionIcon}>📸</Text>
              <View style={styles.recentActionInfo}>
                <Text style={styles.recentActionTitle}>Task Photo</Text>
                <Text style={styles.recentActionTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.recentActionItem}>
              <Text style={styles.recentActionIcon}>📝</Text>
              <View style={styles.recentActionInfo}>
                <Text style={styles.recentActionTitle}>Vendor Log Entry</Text>
                <Text style={styles.recentActionTime}>Yesterday</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xLarge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  quickActionsContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    marginBottom: Spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  quickActionButton: {
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  quickActionIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  centerPlusContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerPlusGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  centerPlusLabel: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  recentActionsSection: {
    marginTop: Spacing.lg,
  },
  recentActionsTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  recentActionsCard: {
    padding: Spacing.md,
  },
  recentActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  recentActionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  recentActionInfo: {
    flex: 1,
  },
  recentActionTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  recentActionTime: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
  },
});

export default QuickActionsOverlayContent;
