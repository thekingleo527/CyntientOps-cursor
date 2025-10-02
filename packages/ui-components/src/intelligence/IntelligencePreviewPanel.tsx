/**
 * 🧠 Intelligence Preview Panel
 * Mirrors: CyntientOps/Components/Intelligence/IntelligencePreviewPanel.swift
 * Purpose: Nova AI integration panel with expandable/collapsible modes
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Dimensions 
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { IntelligenceInsight, UserRole } from '@cyntientops/domain-schema';

export interface IntelligencePreviewPanelProps {
  insights: IntelligenceInsight[];
  onInsightTap?: (insight: IntelligenceInsight) => void;
  onRefresh?: () => Promise<void>;
  displayMode?: 'panel' | 'compact';
  onNavigate?: (target: NavigationTarget) => void;
  userRole?: UserRole;
  isProcessing?: boolean;
}

export interface NavigationTarget {
  type: 'building' | 'task' | 'worker' | 'compliance' | 'analytics';
  id: string;
  name: string;
}

export interface NovaInsight {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'routine' | 'compliance' | 'performance' | 'weather' | 'maintenance';
  actionable: boolean;
  timestamp: Date;
  buildingId?: string;
  buildingName?: string;
  workerId?: string;
  workerName?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const IntelligencePreviewPanel: React.FC<IntelligencePreviewPanelProps> = ({
  insights,
  onInsightTap,
  onRefresh,
  displayMode = 'panel',
  onNavigate,
  userRole = 'worker',
  isProcessing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (displayMode === 'compact') {
      Animated.timing(slideAnimation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isExpanded, displayMode]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInsightPress = (insight: IntelligenceInsight) => {
    if (onInsightTap) {
      onInsightTap(insight);
    }
    
    if (displayMode === 'compact') {
      setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.text.tertiary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'routine': return '📋';
      case 'compliance': return '🛡️';
      case 'performance': return '📊';
      case 'weather': return '🌤️';
      case 'maintenance': return '🔧';
      default: return '💡';
    }
  };

  const getRoleSpecificInsights = () => {
    switch (userRole) {
      case 'worker':
        return insights.filter(insight => 
          insight.category === 'routine' || 
          insight.category === 'weather' ||
          insight.category === 'maintenance'
        );
      case 'admin':
      case 'manager':
        return insights.filter(insight => 
          insight.category === 'performance' || 
          insight.category === 'compliance'
        );
      case 'client':
        return insights.filter(insight => 
          insight.category === 'compliance' || 
          insight.category === 'performance'
        );
      default:
        return insights;
    }
  };

  const filteredInsights = getRoleSpecificInsights();
  const criticalInsights = filteredInsights.filter(insight => insight.priority === 'critical');
  const highPriorityInsights = filteredInsights.filter(insight => insight.priority === 'high');

  if (displayMode === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={styles.compactHeader}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.compactHeaderContent}>
            <Text style={styles.compactTitle}>Nova AI</Text>
            <View style={styles.compactBadges}>
              {criticalInsights.length > 0 && (
                <View style={[styles.badge, { backgroundColor: Colors.status.error }]}>
                  <Text style={styles.badgeText}>{criticalInsights.length}</Text>
                </View>
              )}
              {highPriorityInsights.length > 0 && (
                <View style={[styles.badge, { backgroundColor: Colors.status.warning }]}>
                  <Text style={styles.badgeText}>{highPriorityInsights.length}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.compactContent,
            {
              opacity: slideAnimation,
              transform: [{
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          {isExpanded && (
            <ScrollView style={styles.compactScrollView} showsVerticalScrollIndicator={false}>
              {filteredInsights.slice(0, 3).map((insight) => (
                <TouchableOpacity
                  key={insight.id}
                  style={styles.compactInsightItem}
                  onPress={() => handleInsightPress(insight)}
                >
                  <View style={styles.compactInsightHeader}>
                    <Text style={styles.compactInsightIcon}>
                      {getCategoryIcon(insight.category)}
                    </Text>
                    <Text style={styles.compactInsightTitle} numberOfLines={1}>
                      {insight.title}
                    </Text>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(insight.priority) }]} />
                  </View>
                  <Text style={styles.compactInsightDescription} numberOfLines={2}>
                    {insight.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    );
  }

  return (
    <GlassCard style={styles.panelContainer} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleContainer}>
          <Text style={styles.panelTitle}>Nova AI Insights</Text>
          <Text style={styles.panelSubtitle}>
            {filteredInsights.length} insights for {userRole}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={Colors.text.primary} />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="small" color={Colors.primary.blue} />
          <Text style={styles.processingText}>Nova is analyzing...</Text>
        </View>
      )}

      <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={false}>
        {filteredInsights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>No insights available</Text>
            <Text style={styles.emptySubtitle}>
              Nova AI is analyzing your data and will provide insights soon.
            </Text>
          </View>
        ) : (
          filteredInsights.map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[
                styles.insightItem,
                expandedInsight === insight.id && styles.insightItemExpanded
              ]}
              onPress={() => handleInsightPress(insight)}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightMeta}>
                  <Text style={styles.insightIcon}>
                    {getCategoryIcon(insight.category)}
                  </Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={styles.insightTitle} numberOfLines={1}>
                      {insight.title}
                    </Text>
                    <Text style={styles.insightCategory}>
                      {insight.category} • {insight.priority}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.insightActions}>
                  <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(insight.priority) }]} />
                  {insight.actionable && (
                    <Text style={styles.actionableIcon}>⚡</Text>
                  )}
                </View>
              </View>

              <Text style={styles.insightDescription} numberOfLines={expandedInsight === insight.id ? undefined : 2}>
                {insight.description}
              </Text>

              {(insight.buildingName || insight.workerName) && (
                <View style={styles.insightContext}>
                  {insight.buildingName && (
                    <View style={styles.contextItem}>
                      <Text style={styles.contextIcon}>🏢</Text>
                      <Text style={styles.contextText}>{insight.buildingName}</Text>
                    </View>
                  )}
                  {insight.workerName && (
                    <View style={styles.contextItem}>
                      <Text style={styles.contextIcon}>👷</Text>
                      <Text style={styles.contextText}>{insight.workerName}</Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.insightTimestamp}>
                {insight.timestamp.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {filteredInsights.length > 0 && (
        <View style={styles.panelFooter}>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => onNavigate?.({ type: 'analytics', id: 'all', name: 'All Insights' })}
          >
            <Text style={styles.viewAllText}>View All Insights</Text>
            <Text style={styles.viewAllIcon}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  // Panel Mode Styles
  panelContainer: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  panelTitleContainer: {
    flex: 1,
  },
  panelTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  panelSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.glass.thin,
  },
  refreshIcon: {
    fontSize: 16,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.primary.blue + '20',
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  processingText: {
    ...Typography.caption,
    color: Colors.primary.blue,
    marginLeft: Spacing.sm,
  },
  insightsContainer: {
    maxHeight: 400,
  },
  insightItem: {
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glass.medium,
  },
  insightItemExpanded: {
    backgroundColor: Colors.glass.medium,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  insightCategory: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  insightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  actionableIcon: {
    fontSize: 16,
  },
  insightDescription: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  insightContext: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  contextIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  contextText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  insightTimestamp: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  panelFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.medium,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  viewAllText: {
    ...Typography.subheadline,
    color: Colors.primary.blue,
    fontWeight: '500',
  },
  viewAllIcon: {
    ...Typography.subheadline,
    color: Colors.primary.blue,
    marginLeft: Spacing.xs,
  },

  // Compact Mode Styles
  compactContainer: {
    margin: Spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glass.medium,
  },
  compactHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  compactBadges: {
    flexDirection: 'row',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  expandIcon: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  compactContent: {
    marginTop: Spacing.sm,
  },
  compactScrollView: {
    maxHeight: 200,
  },
  compactInsightItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  compactInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  compactInsightIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  compactInsightTitle: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactInsightDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 11,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
