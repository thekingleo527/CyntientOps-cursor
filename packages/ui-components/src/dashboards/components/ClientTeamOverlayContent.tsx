/**
 * @cyntientops/ui-components
 * 
 * Client Team Overlay Content - Team management and communication
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';

export interface ClientTeamOverlayContentProps {
  clientId: string;
  clientName: string;
  onWorkerPress?: (workerId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const ClientTeamOverlayContent: React.FC<ClientTeamOverlayContentProps> = ({
  clientId,
  clientName,
  onWorkerPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  // Mock team data - in real app, this would come from props or state
  const teamMembers = [
    { id: '1', name: 'Kevin Dutan', role: 'Primary Maintenance Specialist', status: 'active', buildings: ['131 Perry Street', '135 West 17th Street'], completionRate: 94, lastActive: '2 minutes ago' },
    { id: '2', name: 'Greg Hutson', role: 'Cleaning Specialist', status: 'active', buildings: ['145 15th Street'], completionRate: 89, lastActive: '15 minutes ago' },
    { id: '3', name: 'Moises Farhat', role: 'Building Manager', status: 'active', buildings: ['Rubin Museum'], completionRate: 96, lastActive: '1 hour ago' },
    { id: '4', name: 'Sarah Johnson', role: 'Maintenance Worker', status: 'break', buildings: ['200 5th Avenue'], completionRate: 92, lastActive: '30 minutes ago' },
    { id: '5', name: 'Mike Wilson', role: 'Cleaning Worker', status: 'offline', buildings: ['100 Central Park South'], completionRate: 85, lastActive: '2 hours ago' },
  ];

  const renderTeamStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👥 Team Statistics</Text>
      <View style={styles.statsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{teamMembers.filter(m => m.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{Math.round(teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length)}%</Text>
            <Text style={styles.statLabel}>Avg Performance</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderTeamList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👷 Team Members</Text>
      {teamMembers.map((member) => (
        <TouchableOpacity
          key={member.id}
          style={styles.memberCard}
          onPress={() => onWorkerPress?.(member.id)}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.memberCardContent}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberLastActive}>
                    Last active: {member.lastActive}
                  </Text>
                </View>
              </View>
              <View style={styles.memberStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: member.status === 'active' ? Colors.status.success : 
                                    member.status === 'break' ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.statusText}>
                  {member.status === 'active' ? 'Active' : 
                   member.status === 'break' ? 'On Break' : 'Offline'}
                </Text>
              </View>
            </View>
            
            <View style={styles.memberBuildings}>
              <Text style={styles.memberBuildingsLabel}>Assigned Buildings:</Text>
              <Text style={styles.memberBuildingsText}>
                {member.buildings.join(', ')}
              </Text>
            </View>
            
            <View style={styles.memberMetrics}>
              <View style={styles.memberMetric}>
                <Text style={styles.memberMetricLabel}>Performance</Text>
                <Text style={styles.memberMetricValue}>{member.completionRate}%</Text>
              </View>
              <View style={styles.memberMetric}>
                <Text style={styles.memberMetricLabel}>Buildings</Text>
                <Text style={styles.memberMetricValue}>{member.buildings.length}</Text>
              </View>
              <View style={styles.memberMetric}>
                <Text style={styles.memberMetricLabel}>Rating</Text>
                <Text style={styles.memberMetricValue}>4.{member.completionRate % 10}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopPerformers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.performersCard}>
        {teamMembers
          .sort((a, b) => b.completionRate - a.completionRate)
          .slice(0, 3)
          .map((member, index) => (
            <View key={member.id} style={styles.performerItem}>
              <View style={styles.performerRank}>
                <Text style={styles.performerRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{member.name}</Text>
                <Text style={styles.performerRole}>{member.role}</Text>
              </View>
              <View style={styles.performerScore}>
                <Text style={styles.performerScoreValue}>{member.completionRate}%</Text>
                <Text style={styles.performerScoreLabel}>Performance</Text>
              </View>
            </View>
          ))}
      </GlassCard>
    </View>
  );

  const renderCommunication = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💬 Team Communication</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.communicationCard}>
        <View style={styles.communicationHeader}>
          <Text style={styles.communicationTitle}>Recent Messages</Text>
          <TouchableOpacity style={styles.newMessageButton}>
            <Text style={styles.newMessageText}>+ New</Text>
          </TouchableOpacity>
        </View>
        
        {[
          { sender: 'Kevin Dutan', message: 'Completed maintenance at 131 Perry Street', time: '2m ago', type: 'update' },
          { sender: 'Greg Hutson', message: 'Cleaning finished at 145 15th Street', time: '15m ago', type: 'update' },
          { sender: 'Moises Farhat', message: 'Rubin Museum inspection scheduled for tomorrow', time: '1h ago', type: 'schedule' },
          { sender: 'Sarah Johnson', message: 'Need supplies for 200 5th Avenue', time: '2h ago', type: 'request' },
        ].map((message, index) => (
          <View key={index} style={styles.messageItem}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>{message.sender}</Text>
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
            <Text style={styles.messageText}>{message.message}</Text>
            <View style={[
              styles.messageType,
              { backgroundColor: message.type === 'update' ? Colors.status.success : 
                               message.type === 'schedule' ? Colors.status.info : Colors.status.warning }
            ]}>
              <Text style={styles.messageTypeText}>
                {message.type === 'update' ? 'Update' : 
                 message.type === 'schedule' ? 'Schedule' : 'Request'}
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Send Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Performance Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Schedule Meeting</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Team Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.client.primary}
        />
      }
    >
      {renderTeamStats()}
      {renderTeamList()}
      {renderTopPerformers()}
      {renderCommunication()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  memberCard: {
    marginBottom: Spacing.md,
  },
  memberCardContent: {
    padding: Spacing.lg,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  memberInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  memberAvatarText: {
    ...Typography.subheadline,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  memberLastActive: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  memberStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  memberBuildings: {
    marginBottom: Spacing.md,
  },
  memberBuildingsLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  memberBuildingsText: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  memberMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  memberMetric: {
    alignItems: 'center',
  },
  memberMetricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  memberMetricValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  performersCard: {
    padding: Spacing.lg,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  performerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  performerRankText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  performerRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  performerScore: {
    alignItems: 'center',
  },
  performerScoreValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  performerScoreLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  communicationCard: {
    padding: Spacing.lg,
  },
  communicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  communicationTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  newMessageButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.role.client.primary,
    borderRadius: 6,
  },
  newMessageText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  messageItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  messageSender: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  messageTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  messageText: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  messageType: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messageTypeText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ClientTeamOverlayContent;
