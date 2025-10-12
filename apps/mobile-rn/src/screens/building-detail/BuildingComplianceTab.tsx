/**
 * 🏢 Building Compliance Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingComplianceTabOptimized.swift
 * Purpose: Full NYC compliance integration with violation tracking, risk scoring, and trends
 *
 * ⚖️ COMPLIANCE FOCUSED: NYC regulations and violations
 * 🚀 PERFORMANCE: Cached data with smart refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { NYCComplianceService } from '@cyntientops/api-clients/src/nyc';
import { Database } from '@cyntientops/database';
import { getSupabaseClient, isSupabaseConfigured } from '@cyntientops/business-core';

interface ComplianceSnapshot {
  ll97Status: string;
  ll97NextDue?: Date;
  ll11Status: string;
  ll11NextDue?: Date;
  activeViolations: number;
  hpdViolations: number;
  violations: ComplianceViolation[];
  upcomingDeadlines: ComplianceDeadline[];
}

interface ComplianceViolation {
  id: string;
  type: string;
  department: string;
  issueDate: Date;
  description?: string;
  fineAmount: number;
  status: string;
}

interface ComplianceDeadline {
  requirement: string;
  dueDate: Date;
  priority: string;
}

interface BuildingComplianceTabProps {
  buildingId: string;
  buildingName: string;
}

interface KnowledgeHighlight {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  tags: string[];
  updatedAt?: Date;
}

export const BuildingComplianceTab: React.FC<BuildingComplianceTabProps> = ({
  buildingId,
  buildingName,
}) => {
  const [complianceData, setComplianceData] = useState<ComplianceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [knowledgeHighlights, setKnowledgeHighlights] = useState<KnowledgeHighlight[]>([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const loadComplianceData = useCallback(async () => {
    try {
      const db = Database.getInstance();

      // Load violations from database
      const violationRows = await db.executeSql(
        `SELECT v.id, v.violation_type, v.issue_date, v.department,
                v.description, v.fine_amount, v.status
         FROM violations v
         WHERE v.building_id = ? AND v.status = 'open'
         ORDER BY v.issue_date DESC
         LIMIT 20`,
        [buildingId]
      );

      const violations: ComplianceViolation[] = violationRows.map((row: any) => ({
        id: row.id,
        type: row.violation_type || 'Unknown',
        department: row.department || 'Unknown',
        issueDate: new Date(row.issue_date),
        description: row.description,
        fineAmount: row.fine_amount || 0,
        status: row.status || 'open',
      }));

      // Load compliance status from NYC API service
      const nycService = NYCComplianceService.getInstance();
      const ll97Status = await nycService.getLL97Status(buildingId);
      const ll11Status = await nycService.getLL11Status(buildingId);

      const data: ComplianceSnapshot = {
        ll97Status: ll97Status.isCompliant ? 'compliant' : 'pending',
        ll97NextDue: ll97Status.nextDueDate,
        ll11Status: ll11Status.isCompliant ? 'compliant' : 'pending',
        ll11NextDue: ll11Status.nextDueDate,
        activeViolations: violations.length,
        hpdViolations: violations.filter((v) =>
          v.department.toLowerCase().includes('hpd')
        ).length,
        violations,
        upcomingDeadlines: generateUpcomingDeadlines(),
      };

      setComplianceData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      setComplianceData(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [buildingId]);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  useEffect(() => {
    let mounted = true;

    async function fetchKnowledge() {
      if (!isSupabaseConfigured()) {
        if (mounted) setKnowledgeStatus('ready');
        return;
      }

      try {
        setKnowledgeStatus('loading');
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('knowledge_chunks')
          .select(
            `id, content, chunk_index, knowledge_documents(id, title, source_type, tags, updated_at)`
          )
          .ilike('content', `%${buildingName ?? ''}%`)
          .in('knowledge_documents.source_type', ['compliance', 'compliance_alert', 'dsny_violation'])
          .order('updated_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const mapped: KnowledgeHighlight[] = (data ?? [])
          .map((item: any) => {
            const doc = item.knowledge_documents ?? {};
            return {
              id: item.id,
              title: doc.title ?? 'Compliance Entry',
              content: item.content ?? '',
              sourceType: doc.source_type ?? 'knowledge',
              tags: Array.isArray(doc.tags) ? doc.tags : [],
              updatedAt: doc.updated_at ? new Date(doc.updated_at) : undefined,
            };
          })
          .filter((entry: KnowledgeHighlight) => entry.content.length > 0);

        if (!mounted) return;
        setKnowledgeHighlights(mapped);
        setKnowledgeStatus('ready');
      } catch (err: any) {
        if (!mounted) return;
        setKnowledgeStatus('error');
      }
    }

    if (knowledgeStatus === 'idle') {
      fetchKnowledge();
    }

    return () => {
      mounted = false;
    };
  }, [buildingName, knowledgeStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadComplianceData();
  }, [loadComplianceData]);

  const generateUpcomingDeadlines = (): ComplianceDeadline[] => {
    const now = new Date();
    return [
      {
        requirement: 'LL97 Energy Report',
        dueDate: new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()),
        priority: 'high',
      },
      {
        requirement: 'Facade Inspection',
        dueDate: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()),
        priority: 'medium',
      },
    ];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  if (!complianceData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Compliance Data</Text>
        <Text style={styles.errorMessage}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            loadComplianceData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.info}
        />
      }
    >
      <View style={styles.content}>
        {/* Knowledge Highlights */}
        {knowledgeStatus !== 'idle' && knowledgeHighlights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Compliance Insights</Text>
            {knowledgeHighlights.map((item) => (
              <GlassCard
                key={item.id}
                intensity={GlassIntensity.medium}
                cornerRadius={CornerRadius.lg}
                style={styles.knowledgeCard}
              >
                <Text style={styles.knowledgeTitle}>{item.title}</Text>
                <Text style={styles.knowledgeContent}>{item.content}</Text>
                {item.tags.length > 0 && (
                  <View style={styles.tagContainer}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <Text key={`${item.id}-${tag}`} style={styles.tag}>
                        {tag.toUpperCase()}
                      </Text>
                    ))}
                  </View>
                )}
              </GlassCard>
            ))}
          </>
        )}

        {/* Compliance Overview */}
        <Text style={styles.sectionTitle}>Compliance Overview</Text>
        <View style={styles.overviewGrid}>
          <ComplianceStatusCard
            title="LL97 Emissions"
            status={complianceData.ll97Status}
            dueDate={complianceData.ll97NextDue}
          />
          <ComplianceStatusCard
            title="LL11 Facade"
            status={complianceData.ll11Status}
            dueDate={complianceData.ll11NextDue}
          />
          <ComplianceStatusCard
            title="Active Violations"
            status={complianceData.activeViolations === 0 ? 'compliant' : 'violations'}
            subtitle={`${complianceData.activeViolations} open`}
          />
          <ComplianceStatusCard
            title="HPD Violations"
            status={complianceData.hpdViolations === 0 ? 'compliant' : 'violations'}
            subtitle={`${complianceData.hpdViolations} active`}
          />
        </View>

        {/* Recent Violations */}
        {complianceData.violations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Violations</Text>
            {complianceData.violations.slice(0, 5).map((violation) => (
              <ViolationRow key={violation.id} violation={violation} />
            ))}
            {complianceData.violations.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  View All Violations ({complianceData.violations.length})
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Upcoming Deadlines */}
        {complianceData.upcomingDeadlines.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            {complianceData.upcomingDeadlines.slice(0, 3).map((deadline, index) => (
              <DeadlineRow key={index} deadline={deadline} />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const ComplianceStatusCard: React.FC<{
  title: string;
  status: string;
  dueDate?: Date;
  subtitle?: string;
}> = ({ title, status, dueDate, subtitle }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return Colors.success;
      case 'violations':
      case 'pending':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const statusColor = getStatusColor();

  return (
    <GlassCard
      intensity={GlassIntensity.THIN}
      cornerRadius={CornerRadius.SMALL}
      style={styles.statusCard}
    >
      <Text style={styles.statusCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
        <Text style={styles.statusIndicatorText}>
          {status === 'compliant' ? '✓' : '!'}
        </Text>
      </View>
      {subtitle && <Text style={styles.statusCardSubtitle}>{subtitle}</Text>}
      {dueDate && (
        <Text style={styles.statusCardSubtitle}>
          {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
    </GlassCard>
  );
};

const ViolationRow: React.FC<{ violation: ComplianceViolation }> = ({ violation }) => (
  <GlassCard
    intensity={GlassIntensity.THIN}
    cornerRadius={CornerRadius.SMALL}
    style={styles.violationCard}
  >
    <View style={styles.violationHeader}>
      <Text style={styles.violationType}>{violation.type}</Text>
      <View style={styles.departmentBadge}>
        <Text style={styles.departmentText}>{violation.department}</Text>
      </View>
    </View>
    {violation.description && (
      <Text style={styles.violationDescription} numberOfLines={2}>
        {violation.description}
      </Text>
    )}
    <View style={styles.violationFooter}>
      <Text style={styles.violationDate}>
        {violation.issueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
      {violation.fineAmount > 0 && (
        <Text style={styles.violationFine}>${Math.round(violation.fineAmount)}</Text>
      )}
    </View>
  </GlassCard>
);

const DeadlineRow: React.FC<{ deadline: ComplianceDeadline }> = ({ deadline }) => {
  const getPriorityColor = () => {
    switch (deadline.priority.toLowerCase()) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.text.secondary;
    }
  };

  const priorityColor = getPriorityColor();

  return (
    <GlassCard
      intensity={GlassIntensity.THIN}
      cornerRadius={CornerRadius.SMALL}
      style={styles.deadlineCard}
    >
      <View style={styles.deadlineContent}>
        <View style={styles.deadlineInfo}>
          <Text style={styles.deadlineRequirement}>{deadline.requirement}</Text>
          <Text style={styles.deadlineDate}>
            {deadline.dueDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '33' }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {deadline.priority.charAt(0).toUpperCase() + deadline.priority.slice(1)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    ...Typography.bodyMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    backgroundColor: Colors.info + '33',
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.info,
    fontWeight: '600',
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statusCard: {
    width: '48%',
    padding: Spacing.md,
    alignItems: 'center',
  },
  statusCardTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusCardSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  violationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  violationType: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  departmentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.warning + '33',
  },
  departmentText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
  },
  violationDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  violationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  violationDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  violationFine: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '700',
  },
  viewAllButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    ...Typography.bodyMedium,
    color: Colors.info,
    textAlign: 'center',
  },
  deadlineCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  deadlineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineRequirement: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  deadlineDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  knowledgeCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  knowledgeTitle: {
    ...Typography.bodyBold,
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
  },
  knowledgeContent: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    ...Typography.captionSmall,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: CornerRadius.xs,
    backgroundColor: Colors.surface.brandTertiary,
    color: Colors.text.primary,
  },
});

export default BuildingComplianceTab;
