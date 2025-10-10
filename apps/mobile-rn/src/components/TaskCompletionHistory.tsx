/**
 * 📊 Task Completion History
 * Purpose: Display completion history and statistics
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import type {
  RoutineTaskCompletion,
  TaskCompletionStats
} from '@cyntientops/business-core';
import { TaskCompletionService } from '@cyntientops/business-core';
import { DatabaseManager } from '@cyntientops/database';

interface TaskCompletionHistoryProps {
  workerId?: string;
  buildingId?: string;
  routineId?: string;
  limit?: number;
}

export const TaskCompletionHistory: React.FC<TaskCompletionHistoryProps> = ({
  workerId,
  buildingId,
  routineId,
  limit = 20
}) => {
  const [completions, setCompletions] = useState<RoutineTaskCompletion[]>([]);
  const [stats, setStats] = useState<TaskCompletionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCompletions = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();
      const completionService = TaskCompletionService.getInstance(db);

      let data: RoutineTaskCompletion[] = [];

      if (routineId) {
        data = await completionService.getRoutineCompletions(routineId, limit);
      } else if (workerId) {
        data = await completionService.getWorkerCompletions(workerId, limit);
        const workerStats = await completionService.getWorkerStats(workerId);
        setStats(workerStats);
      } else if (buildingId) {
        data = await completionService.getBuildingCompletions(buildingId, limit);
        const buildingStats = await completionService.getBuildingStats(buildingId);
        setStats(buildingStats);
      }

      setCompletions(data);
    } catch (error) {
      console.error('Failed to load completions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompletions();
  }, [workerId, buildingId, routineId]);

  const renderCompletion = ({ item }: { item: RoutineTaskCompletion }) => {
    const completedDate = new Date(item.completedAt);
    const statusColor = {
      completed: '#10b981',
      partial: '#f59e0b',
      skipped: '#6b7280',
      cancelled: '#ef4444'
    }[item.status];

    return (
      <TouchableOpacity style={styles.completionCard}>
        <View style={styles.completionHeader}>
          <Text style={styles.taskName}>{item.taskName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.completionDate}>
          {completedDate.toLocaleDateString()} at {completedDate.toLocaleTimeString()}
        </Text>

        {item.durationMinutes && (
          <Text style={styles.duration}>{item.durationMinutes} minutes</Text>
        )}

        {item.qualityRating && (
          <View style={styles.rating}>
            <Text style={styles.ratingLabel}>Quality:</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text
                  key={star}
                  style={[
                    styles.star,
                    star <= item.qualityRating! && styles.starFilled
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        )}

        {item.photos.length > 0 && (
          <Text style={styles.photoCount}>📸 {item.photos.length} photos</Text>
        )}

        {item.notes && (
          <Text style={styles.notes}>{item.notes}</Text>
        )}

        {item.requiresFollowup && (
          <View style={styles.followupBadge}>
            <Text style={styles.followupText}>Requires Follow-up</Text>
            {item.followupNotes && (
              <Text style={styles.followupNotes}>{item.followupNotes}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCompletions}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completionRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedOnTime}</Text>
            <Text style={styles.statLabel}>On Time</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageDuration.toFixed(0)}m</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>

        {stats.averageQualityRating && (
          <View style={styles.qualitySection}>
            <Text style={styles.qualityLabel}>Average Quality:</Text>
            <Text style={styles.qualityValue}>
              {stats.averageQualityRating.toFixed(1)} / 5.0
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading completion history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={completions}
        keyExtractor={item => item.id}
        renderItem={renderCompletion}
        ListHeaderComponent={renderStats}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completions yet</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadCompletions(true)}
            tintColor="#10b981"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  qualitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  qualityLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  qualityValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  completionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  completionDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  duration: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    color: '#374151',
    fontSize: 16,
  },
  starFilled: {
    color: '#fbbf24',
  },
  photoCount: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 8,
  },
  notes: {
    color: '#d1d5db',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  followupBadge: {
    backgroundColor: '#7c2d12',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  followupText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  followupNotes: {
    color: '#fed7aa',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
