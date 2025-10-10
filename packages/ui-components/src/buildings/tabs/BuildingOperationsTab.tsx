/**
 * 🏢 Building Operations Tab
 * Purpose: Operations, tasks, team management, and messaging
 * Features: Today's tasks, team status, messaging, route optimization
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface BuildingOperationsTabProps {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedWorker?: string;
    dueDate: Date;
    estimatedDuration: number;
  }>;
  workers: Array<{
    id: string;
    name: string;
    role: string;
    status: 'online' | 'offline' | 'busy';
    currentTasks: number;
    completionRate: number;
    lastSeen: Date;
  }>;
  routes: Array<{
    id: string;
    name: string;
    description: string;
    waypoints: Array<{
      id: string;
      name: string;
      coordinate: { latitude: number; longitude: number };
      order: number;
    }>;
    estimatedDuration: number;
    lastUsed?: Date;
  }>;
  onTaskPress?: (taskId: string) => void;
  onWorkerPress?: (workerId: string) => void;
}

export const BuildingOperationsTab: React.FC<BuildingOperationsTabProps> = ({
  tasks,
  workers,
  routes,
  onTaskPress,
  onWorkerPress,
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const todaysTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  );

  const completedTasks = tasks.filter(task => task.status === 'completed');

  const onlineWorkers = workers.filter(worker => worker.status === 'online');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      Alert.alert('Message Sent', `"${messageText}" sent to team`);
      setMessageText('');
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRoute(routeId);
    Alert.alert('Route Selected', 'Navigation started to selected location');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Today's Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        {todaysTasks.length > 0 ? (
          todaysTasks.map(task => (
            <GlassCard 
              key={task.id} 
              intensity={GlassIntensity.THIN} 
              cornerRadius={CornerRadius.MEDIUM} 
              style={styles.taskCard}
            >
              <TouchableOpacity onPress={() => onTaskPress?.(task.id)}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <View style={styles.taskFooter}>
                  <Text style={styles.taskWorker}>
                    👤 {task.assignedWorker || 'Unassigned'}
                  </Text>
                  <Text style={styles.taskDuration}>
                    ⏱️ {task.estimatedDuration}min
                  </Text>
                </View>
              </TouchableOpacity>
            </GlassCard>
          ))
        ) : (
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending tasks for today</Text>
          </GlassCard>
        )}
      </View>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Today</Text>
          {completedTasks.slice(0, 3).map(task => (
            <GlassCard 
              key={task.id} 
              intensity={GlassIntensity.THIN} 
              cornerRadius={CornerRadius.MEDIUM} 
              style={styles.completedTaskCard}
            >
              <View style={styles.completedTaskHeader}>
                <Text style={styles.completedTaskTitle}>✅ {task.title}</Text>
                <Text style={styles.completedTaskTime}>
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.completedTaskWorker}>
                Completed by: {task.assignedWorker || 'Unknown'}
              </Text>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Team Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Status</Text>
        {onlineWorkers.length > 0 ? (
          onlineWorkers.map(worker => (
            <GlassCard 
              key={worker.id} 
              intensity={GlassIntensity.THIN} 
              cornerRadius={CornerRadius.MEDIUM} 
              style={styles.workerCard}
            >
              <TouchableOpacity onPress={() => onWorkerPress?.(worker.id)}>
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerRole}>{worker.role}</Text>
                  </View>
                  <View style={styles.workerStatus}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
                    <Text style={styles.statusText}>Online</Text>
                  </View>
                </View>
                <View style={styles.workerStats}>
                  <Text style={styles.workerStat}>
                    📋 {worker.currentTasks} tasks
                  </Text>
                  <Text style={styles.workerStat}>
                    📈 {Math.round(worker.completionRate * 100)}% completion
                  </Text>
                </View>
              </TouchableOpacity>
            </GlassCard>
          ))
        ) : (
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No workers currently online</Text>
          </GlassCard>
        )}
      </View>

      {/* Route to Next Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route to Next Location</Text>
        <View style={styles.routeOptions}>
          <TouchableOpacity 
            style={[styles.routeButton, { backgroundColor: Colors.base.primary }]}
            onPress={() => Alert.alert('Navigation', 'Starting bike route to next location')}
          >
            <Text style={styles.routeButtonText}>🚴 Bike Route</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.routeButton, { backgroundColor: Colors.glass.regular }]}
            onPress={() => Alert.alert('Navigation', 'Starting walking route to next location')}
          >
            <Text style={styles.routeButtonText}>🚶 Walking</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.routeButton, { backgroundColor: Colors.glass.regular }]}
            onPress={() => Alert.alert('Navigation', 'Starting driving route to next location')}
          >
            <Text style={styles.routeButtonText}>🚗 Driving</Text>
          </TouchableOpacity>
        </View>
        
        {routes.length > 0 && (
          <View style={styles.routeList}>
            <Text style={styles.routeListTitle}>Available Routes:</Text>
            {routes.map(route => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeItem,
                  selectedRoute === route.id && styles.selectedRouteItem
                ]}
                onPress={() => handleRouteSelect(route.id)}
              >
                <Text style={styles.routeItemName}>{route.name}</Text>
                <Text style={styles.routeItemDuration}>
                  ⏱️ {route.estimatedDuration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Team Messaging */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Messaging</Text>
        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.messagingCard}>
          <View style={styles.messageInput}>
            <TextInput
              style={styles.messageTextInput}
              placeholder="Type a message to the team..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { opacity: messageText.trim() ? 1 : 0.5 }]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          
          {/* Sample Messages */}
          <View style={styles.messageHistory}>
            <View style={styles.messageItem}>
              <Text style={styles.messageSender}>Edwin L. • 2:45 PM</Text>
              <Text style={styles.messageText}>Water filter change completed at 224 E 14th</Text>
            </View>
            <View style={styles.messageItem}>
              <Text style={styles.messageSender}>Kevin D. • 2:30 PM</Text>
              <Text style={styles.messageText}>Stairwell cleaning finished, moving to next location</Text>
            </View>
            <View style={styles.messageItem}>
              <Text style={styles.messageSender}>Admin • 1:15 PM</Text>
              <Text style={styles.messageText}>Great work on the compliance improvements!</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return Colors.status.error;
    case 'high': return Colors.status.warning;
    case 'medium': return Colors.base.primary;
    case 'low': return Colors.status.success;
    default: return Colors.glass.regular;
  }
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
  taskCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  taskDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskWorker: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  taskDuration: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  completedTaskCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.status.success + '10',
  },
  completedTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  completedTaskTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  completedTaskTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  completedTaskWorker: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  workerCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
  routeOptions: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  routeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  routeButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  routeList: {
    marginTop: Spacing.md,
  },
  routeListTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  selectedRouteItem: {
    backgroundColor: Colors.base.primary + '20',
    borderWidth: 1,
    borderColor: Colors.base.primary,
  },
  routeItemName: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  routeItemDuration: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  messagingCard: {
    padding: Spacing.lg,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  messageTextInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.base.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  sendButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  messageHistory: {
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
    paddingTop: Spacing.md,
  },
  messageItem: {
    marginBottom: Spacing.md,
  },
  messageSender: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  messageText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
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

export default BuildingOperationsTab;
