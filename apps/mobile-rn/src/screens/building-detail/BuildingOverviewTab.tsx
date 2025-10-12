/**
 * 🏢 Building Overview Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingOverviewTabOptimized.swift
 * Purpose: Essential building information, property details, compliance summary, team, DSNY schedule, and knowledge highlights
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { getSupabaseClient, isSupabaseConfigured } from '@cyntientops/business-core';

interface BuildingOverviewTabProps {
  buildingId: string;
  building: any;
  complianceScore: number;
  violationSummary: any;
  propertyDetails?: any;
  schedule?: any;
  dsnyScheduleData?: any;
  workers: any[];
  routineSummaries: any[];
  canViewPropertyDetails: boolean;
  renderPropertyDetailsCard: (property: any) => React.ReactNode;
  renderComplianceCard: (summary: any, score: number) => React.ReactNode;
  renderScheduleCard: (schedule: any) => React.ReactNode;
  renderWorkerCard: (worker: any) => React.ReactNode;
  renderRoutineCard: (routine: any) => React.ReactNode;
  renderEmptyMessage: (message: string) => React.ReactNode;
  renderSectionHeader: (title: string) => React.ReactNode;
  DSNYScheduleCard?: React.ComponentType<any>;
}

interface KnowledgeHighlight {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  tags: string[];
  updatedAt?: Date;
}

export const BuildingOverviewTab: React.FC<BuildingOverviewTabProps> = ({
  building,
  complianceScore,
  violationSummary,
  propertyDetails,
  schedule,
  dsnyScheduleData,
  workers,
  routineSummaries,
  canViewPropertyDetails,
  renderPropertyDetailsCard,
  renderComplianceCard,
  renderScheduleCard,
  renderWorkerCard,
  renderRoutineCard,
  renderEmptyMessage,
  renderSectionHeader,
  DSNYScheduleCard,
}) => {
  const [knowledgeStatus, setKnowledgeStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [knowledgeHighlights, setKnowledgeHighlights] = useState<KnowledgeHighlight[]>([]);

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
          .ilike('content', `%${building?.name ?? ''}%`)
          .order('updated_at', { ascending: false })
          .limit(6);

        if (error) throw error;

        const mapped: KnowledgeHighlight[] = (data ?? [])
          .map((item: any) => {
            const doc = item.knowledge_documents ?? {};
            return {
              id: item.id,
              title: doc.title ?? 'Knowledge Entry',
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
        setKnowledgeError(mapped.length === 0 ? 'No knowledge entries yet for this building.' : null);
      } catch (err: any) {
        if (!mounted) return;
        setKnowledgeStatus('error');
        setKnowledgeError(err?.message ?? 'Unable to load knowledge highlights');
      }
    }

    if (knowledgeStatus === 'idle') {
      fetchKnowledge();
    }

    return () => {
      mounted = false;
    };
  }, [building?.name, knowledgeStatus]);

  const displayedKnowledge = useMemo(() => knowledgeHighlights.slice(0, 3), [knowledgeHighlights]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Property Information (Admin/Client only) */}
        {canViewPropertyDetails && propertyDetails && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('Property Information')}
            {renderPropertyDetailsCard(propertyDetails)}
          </View>
        )}

        {/* Compliance Overview */}
        <View style={styles.sectionGroup}>
          {renderSectionHeader('Compliance Overview')}
          {renderComplianceCard(violationSummary, complianceScore)}
        </View>

        {/* Sanitation Schedule */}
        {schedule && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('Sanitation Schedule')}
            {renderScheduleCard(schedule)}
          </View>
        )}

        {/* Knowledge Highlights */}
        {knowledgeStatus !== 'idle' && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('Knowledge Highlights')}
            <KnowledgeHighlights
              status={knowledgeStatus}
              highlights={displayedKnowledge}
              error={knowledgeError}
            />
          </View>
        )}

        {/* DSNY Collection Details */}
        {dsnyScheduleData && dsnyScheduleData.collectionDays?.length > 0 && DSNYScheduleCard && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('DSNY Collection Details')}
            <DSNYScheduleCard
              collectionDays={dsnyScheduleData.collectionDays}
              setOutWorker={dsnyScheduleData.setOutWorker}
              setOutTime={dsnyScheduleData.setOutTime}
              bringInWorker={dsnyScheduleData.bringInWorker}
              bringInTime={dsnyScheduleData.bringInTime}
              nextCollection={dsnyScheduleData.nextCollection}
              onViewFull={() => {
                console.log('View full DSNY schedule');
              }}
            />
          </View>
        )}

        {/* Assigned Team */}
        <View style={styles.sectionGroup}>
          {renderSectionHeader('Assigned Team')}
          {workers.length > 0
            ? workers.map(renderWorkerCard)
            : renderEmptyMessage('No active worker assignments')}
        </View>

        {/* Routine Tasks */}
        <View style={styles.sectionGroup}>
          {renderSectionHeader('Routine Tasks')}
          {routineSummaries.length > 0
            ? routineSummaries.map(renderRoutineCard)
            : renderEmptyMessage('No routines defined for this building')}
        </View>
      </View>
    </ScrollView>
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
  sectionGroup: {
    marginBottom: Spacing['2xl'],
  },
  knowledgeCard: {
    marginBottom: Spacing.lg,
  },
  knowledgeTitle: {
    ...Typography.bodyBold,
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
  },
  knowledgeContent: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  knowledgeMeta: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    color: Colors.text.tertiary,
  },
  knowledgeEmpty: {
    ...Typography.caption,
    color: Colors.text.secondary,
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

export default BuildingOverviewTab;

interface KnowledgeHighlightsProps {
  status: 'loading' | 'ready' | 'error';
  highlights: KnowledgeHighlight[];
  error: string | null;
}

const KnowledgeHighlights: React.FC<KnowledgeHighlightsProps> = ({ status, highlights, error }) => {
  if (status === 'loading') {
    return (
      <GlassCard intensity={GlassIntensity.medium} cornerRadius={CornerRadius.lg} style={styles.knowledgeCard}>
        <Text style={styles.knowledgeContent}>Loading knowledge…</Text>
      </GlassCard>
    );
  }

  if (status === 'error') {
    return (
      <GlassCard intensity={GlassIntensity.medium} cornerRadius={CornerRadius.lg} style={styles.knowledgeCard}>
        <Text style={styles.knowledgeEmpty}>{error ?? 'Unable to load knowledge highlights.'}</Text>
      </GlassCard>
    );
  }

  if (!highlights.length) {
    return (
      <GlassCard intensity={GlassIntensity.medium} cornerRadius={CornerRadius.lg} style={styles.knowledgeCard}>
        <Text style={styles.knowledgeEmpty}>{error ?? 'No knowledge entries yet for this building.'}</Text>
      </GlassCard>
    );
  }

  return (
    <View>
      {highlights.map((item) => (
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
          <Text style={styles.knowledgeMeta}>
            Source: {formatSource(item.sourceType)}
            {item.updatedAt ? ` • Updated ${item.updatedAt.toLocaleString()}` : ''}
          </Text>
        </GlassCard>
      ))}
    </View>
  );
};

const formatSource = (source: string) => {
  switch (source) {
    case 'building':
      return 'Building Summary';
    case 'dsny_schedule':
      return 'DSNY Schedule';
    case 'dsny_violation':
      return 'DSNY Violation';
    case 'compliance':
      return 'Compliance';
    case 'compliance_alert':
      return 'Compliance Alert';
    case 'weather_current':
      return 'Weather Snapshot';
    case 'task':
      return 'Task Summary';
    default:
      return 'Knowledge Base';
  }
};
