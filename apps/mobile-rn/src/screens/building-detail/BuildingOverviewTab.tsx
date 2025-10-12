/**
 * 🏢 Building Overview Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingOverviewTabOptimized.swift
 * Purpose: Essential building information, property details, compliance summary, team, and DSNY schedule
 *
 * 🎯 FOCUSED: Essential building information only
 * ⚡ FAST: Minimal queries, maximum impact
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

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

export const BuildingOverviewTab: React.FC<BuildingOverviewTabProps> = ({
  buildingId,
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
});

export default BuildingOverviewTab;
