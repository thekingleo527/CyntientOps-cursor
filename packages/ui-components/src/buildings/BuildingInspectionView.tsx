/**
 * 🏢 Building Inspection View
 * Purpose: Monthly building walkthrough inspections for admin and workers
 * Features: Inspection checklists, photo documentation, issue tracking, compliance reporting
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';
import { PhotoEvidenceManager, PhotoEvidence } from '@cyntientops/managers';

export interface BuildingInspection {
  id: string;
  buildingId: string;
  buildingName: string;
  inspectorId: string;
  inspectorName: string;
  inspectionDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  checklist: InspectionChecklistItem[];
  issues: InspectionIssue[];
  photos: PhotoEvidence[];
  notes: string;
  completionDate?: Date;
  nextInspectionDate: Date;
}

export interface InspectionChecklistItem {
  id: string;
  category: 'electrical' | 'mechanical' | 'fire_safety' | 'structural' | 'plumbing' | 'roof' | 'elevator' | 'accessibility' | 'security' | 'environmental';
  title: string;
  description: string;
  spaceId?: string;
  spaceName?: string;
  isRequired: boolean;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  notes?: string;
  photos: PhotoEvidence[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface InspectionIssue {
  id: string;
  checklistItemId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  dueDate?: Date;
  resolutionNotes?: string;
  photos: PhotoEvidence[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface BuildingInspectionViewProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  currentUserId: string;
  currentUserName: string;
  userRole: 'admin' | 'worker' | 'manager';
  onInspectionComplete?: (inspection: BuildingInspection) => void;
}

export const BuildingInspectionView: React.FC<BuildingInspectionViewProps> = ({
  buildingId,
  buildingName,
  container,
  currentUserId,
  currentUserName,
  userRole,
  onInspectionComplete
}) => {
  const [currentInspection, setCurrentInspection] = useState<BuildingInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<InspectionChecklistItem | null>(null);
  const [photoManager, setPhotoManager] = useState<PhotoEvidenceManager | null>(null);

  useEffect(() => {
    loadInspectionData();
  }, [buildingId]);

  const loadInspectionData = async () => {
    setIsLoading(true);
    try {
      const manager = PhotoEvidenceManager.getInstance(container.database);
      setPhotoManager(manager);

      // Load or create current month's inspection
      const inspection = await getOrCreateCurrentInspection();
      setCurrentInspection(inspection);
    } catch (error) {
      console.error('Failed to load inspection data:', error);
      Alert.alert('Error', 'Failed to load inspection data');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateCurrentInspection = async (): Promise<BuildingInspection> => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if inspection exists for current month
    const existingInspection = await container.database.query(`
      SELECT * FROM building_inspections 
      WHERE building_id = ? AND strftime('%m', inspection_date) = ? AND strftime('%Y', inspection_date) = ?
    `, [buildingId, String(currentMonth + 1).padStart(2, '0'), String(currentYear)]);

    if (existingInspection.length > 0) {
      return mapDatabaseRowToInspection(existingInspection[0]);
    }

    // Create new inspection for current month
    const newInspection = await createNewInspection();
    return newInspection;
  };

  const createNewInspection = async (): Promise<BuildingInspection> => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const inspection: BuildingInspection = {
      id: `inspection_${buildingId}_${now.getFullYear()}_${now.getMonth() + 1}`,
      buildingId,
      buildingName,
      inspectorId: currentUserId,
      inspectorName: currentUserName,
      inspectionDate: now,
      status: 'scheduled',
      checklist: generateInspectionChecklist(buildingId),
      issues: [],
      photos: [],
      notes: '',
      nextInspectionDate: nextMonth
    };

    // Save to database
    await container.database.query(`
      INSERT INTO building_inspections (
        id, building_id, building_name, inspector_id, inspector_name,
        inspection_date, status, checklist, issues, photos, notes, next_inspection_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inspection.id,
      inspection.buildingId,
      inspection.buildingName,
      inspection.inspectorId,
      inspection.inspectorName,
      inspection.inspectionDate.toISOString(),
      inspection.status,
      JSON.stringify(inspection.checklist),
      JSON.stringify(inspection.issues),
      JSON.stringify(inspection.photos),
      inspection.notes,
      inspection.nextInspectionDate.toISOString()
    ]);

    return inspection;
  };

  const generateInspectionChecklist = (buildingId: string): InspectionChecklistItem[] => {
    // Generate building-specific inspection checklist
    const baseChecklist: InspectionChecklistItem[] = [
      // Electrical Systems
      {
        id: 'elec_1',
        category: 'electrical',
        title: 'Main Electrical Room',
        description: 'Check main electrical panel, connections, and safety equipment',
        spaceId: buildingId === '1' ? 'space_1_3' : 'space_4_3',
        spaceName: buildingId === '1' ? 'Main Electrical Room' : 'Museum Electrical Room',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      {
        id: 'elec_2',
        category: 'electrical',
        title: 'Emergency Lighting',
        description: 'Test emergency lighting systems and backup power',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      
      // Mechanical Systems
      {
        id: 'mech_1',
        category: 'mechanical',
        title: 'Boiler/Heating System',
        description: 'Inspect boiler room, heating equipment, and safety systems',
        spaceId: buildingId === '1' ? 'space_1_1' : 'space_4_1',
        spaceName: buildingId === '1' ? 'Boiler Room' : 'Museum Climate Control',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      {
        id: 'mech_2',
        category: 'mechanical',
        title: 'HVAC Systems',
        description: 'Check air handling units, filters, and temperature controls',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'medium'
      },
      
      // Fire Safety
      {
        id: 'fire_1',
        category: 'fire_safety',
        title: 'Fire Suppression System',
        description: 'Inspect fire pump, sprinkler heads, and suppression equipment',
        spaceId: buildingId === '1' ? 'space_1_5' : 'space_4_4',
        spaceName: buildingId === '1' ? 'Fire Pump Room' : 'Museum Fire Suppression Room',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'critical'
      },
      {
        id: 'fire_2',
        category: 'fire_safety',
        title: 'Fire Extinguishers',
        description: 'Check fire extinguisher locations, pressure, and accessibility',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      {
        id: 'fire_3',
        category: 'fire_safety',
        title: 'Emergency Exits',
        description: 'Verify emergency exit doors, signage, and egress paths',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'critical'
      },
      
      // Elevator Systems
      {
        id: 'elev_1',
        category: 'elevator',
        title: 'Elevator Machine Room',
        description: 'Inspect elevator equipment, safety systems, and maintenance records',
        spaceId: buildingId === '1' ? 'space_1_2' : 'space_4_2',
        spaceName: buildingId === '1' ? 'Elevator Machine Room' : 'Museum Elevator Machine Room',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      
      // Roof and Drainage
      {
        id: 'roof_1',
        category: 'roof',
        title: 'Roof Drainage',
        description: 'Check roof drains, gutters, and drainage systems',
        spaceId: buildingId === '1' ? 'space_1_7' : 'space_4_7',
        spaceName: buildingId === '1' ? 'Roof Access' : 'Museum Roof Access',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'medium'
      },
      {
        id: 'roof_2',
        category: 'roof',
        title: 'Roof Surface',
        description: 'Inspect roof membrane, flashing, and structural integrity',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'medium'
      },
      
      // Stairwells and Egress
      {
        id: 'stair_1',
        category: 'structural',
        title: 'Main Stairwell',
        description: 'Check stairwell lighting, handrails, and emergency systems',
        spaceId: buildingId === '1' ? 'space_1_9' : 'space_4_8',
        spaceName: buildingId === '1' ? 'Main Stairwell A' : 'Museum Main Stairwell',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'high'
      },
      
      // Trash and Waste
      {
        id: 'trash_1',
        category: 'environmental',
        title: 'Trash Room',
        description: 'Inspect waste management area, cleanliness, and pest control',
        spaceId: buildingId === '1' ? 'space_1_11' : 'space_4_9',
        spaceName: buildingId === '1' ? 'Trash Room' : 'Museum Waste Room',
        isRequired: true,
        status: 'pending',
        photos: [],
        priority: 'medium'
      }
    ];

    return baseChecklist;
  };

  const mapDatabaseRowToInspection = (row: any): BuildingInspection => {
    return {
      id: row.id,
      buildingId: row.building_id,
      buildingName: row.building_name,
      inspectorId: row.inspector_id,
      inspectorName: row.inspector_name,
      inspectionDate: new Date(row.inspection_date),
      status: row.status,
      checklist: JSON.parse(row.checklist),
      issues: JSON.parse(row.issues),
      photos: JSON.parse(row.photos),
      notes: row.notes,
      completionDate: row.completion_date ? new Date(row.completion_date) : undefined,
      nextInspectionDate: new Date(row.next_inspection_date)
    };
  };

  const updateChecklistItem = async (itemId: string, status: string, notes?: string) => {
    if (!currentInspection) return;

    const updatedChecklist = currentInspection.checklist.map(item => 
      item.id === itemId 
        ? { ...item, status: status as any, notes: notes || item.notes }
        : item
    );

    const updatedInspection = {
      ...currentInspection,
      checklist: updatedChecklist,
      status: updatedChecklist.every(item => item.status !== 'pending') ? 'completed' : 'in_progress'
    };

    setCurrentInspection(updatedInspection);

    // Update database
    await container.database.query(`
      UPDATE building_inspections 
      SET checklist = ?, status = ?
      WHERE id = ?
    `, [JSON.stringify(updatedChecklist), updatedInspection.status, currentInspection.id]);

    if (updatedInspection.status === 'completed') {
      onInspectionComplete?.(updatedInspection);
    }
  };

  const createIssue = async (checklistItemId: string, title: string, description: string, severity: string) => {
    if (!currentInspection) return;

    const newIssue: InspectionIssue = {
      id: `issue_${Date.now()}`,
      checklistItemId,
      title,
      description,
      severity: severity as any,
      status: 'open',
      photos: [],
      createdAt: new Date()
    };

    const updatedIssues = [...currentInspection.issues, newIssue];
    const updatedInspection = {
      ...currentInspection,
      issues: updatedIssues
    };

    setCurrentInspection(updatedInspection);

    // Update database
    await container.database.query(`
      UPDATE building_inspections 
      SET issues = ?
      WHERE id = ?
    `, [JSON.stringify(updatedIssues), currentInspection.id]);

    setShowIssueModal(false);
    setSelectedChecklistItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return Colors.success;
      case 'failed': return Colors.critical;
      case 'pending': return Colors.warning;
      case 'not_applicable': return Colors.inactive;
      default: return Colors.inactive;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return Colors.critical;
      case 'high': return Colors.warning;
      case 'medium': return Colors.info;
      case 'low': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical': return '⚡';
      case 'mechanical': return '⚙️';
      case 'fire_safety': return '🚨';
      case 'structural': return '🏗️';
      case 'plumbing': return '🚿';
      case 'roof': return '🏠';
      case 'elevator': return '🛗';
      case 'accessibility': return '♿';
      case 'security': return '🔒';
      case 'environmental': return '🌱';
      default: return '📋';
    }
  };

  const renderChecklistItem = (item: InspectionChecklistItem) => {
    const statusColor = getStatusColor(item.status);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          setSelectedChecklistItem(item);
          setShowIssueModal(true);
        }}
      >
        <GlassCard style={styles.checklistItem} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <View style={styles.checklistItemHeader}>
            <View style={styles.checklistItemLeft}>
              <Text style={styles.checklistItemIcon}>{getCategoryIcon(item.category)}</Text>
              <View style={styles.checklistItemInfo}>
                <Text style={styles.checklistItemTitle}>{item.title}</Text>
                <Text style={styles.checklistItemDescription}>{item.description}</Text>
                {item.spaceName && (
                  <Text style={styles.checklistItemSpace}>📍 {item.spaceName}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.checklistItemRight}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {item.notes && (
            <View style={styles.checklistItemNotes}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          {item.photos.length > 0 && (
            <View style={styles.checklistItemPhotos}>
              <Text style={styles.photosLabel}>📸 {item.photos.length} photo(s)</Text>
            </View>
          )}

          <View style={styles.checklistItemActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]}
              onPress={() => updateChecklistItem(item.id, 'passed')}
            >
              <Text style={styles.actionButtonText}>✓ Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.failButton]}
              onPress={() => updateChecklistItem(item.id, 'failed')}
            >
              <Text style={styles.actionButtonText}>✗ Fail</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.naButton]}
              onPress={() => updateChecklistItem(item.id, 'not_applicable')}
            >
              <Text style={styles.actionButtonText}>N/A</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderIssueModal = () => {
    if (!selectedChecklistItem) return null;

    return (
      <Modal
        visible={showIssueModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.issueModalContainer}>
          <View style={styles.issueModalHeader}>
            <Text style={styles.issueModalTitle}>Report Issue</Text>
            <TouchableOpacity 
              onPress={() => setShowIssueModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.issueModalContent}>
            <Text style={styles.issueModalSubtitle}>
              Issue with: {selectedChecklistItem.title}
            </Text>

            <View style={styles.issueForm}>
              <Text style={styles.formLabel}>Issue Title:</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Brief description of the issue"
                multiline
              />

              <Text style={styles.formLabel}>Detailed Description:</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Provide detailed information about the issue"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>Severity:</Text>
              <View style={styles.severityOptions}>
                {['low', 'medium', 'high', 'critical'].map(severity => (
                  <TouchableOpacity
                    key={severity}
                    style={[styles.severityOption, { backgroundColor: getPriorityColor(severity) + '20' }]}
                  >
                    <Text style={[styles.severityText, { color: getPriorityColor(severity) }]}>
                      {severity.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={() => {
                  // Create issue logic here
                  setShowIssueModal(false);
                  setSelectedChecklistItem(null);
                }}
              >
                <Text style={styles.submitButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading inspection data...</Text>
      </View>
    );
  }

  if (!currentInspection) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No inspection data available</Text>
      </View>
    );
  }

  const filteredChecklist = selectedCategory === 'all' 
    ? currentInspection.checklist 
    : currentInspection.checklist.filter(item => item.category === selectedCategory);

  const progress = currentInspection.checklist.filter(item => item.status !== 'pending').length;
  const total = currentInspection.checklist.length;
  const progressPercentage = Math.round((progress / total) * 100);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏢 Building Inspection</Text>
          <Text style={styles.headerSubtitle}>
            {buildingName} - {currentInspection.inspectionDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Inspection Progress */}
        <GlassCard style={styles.progressCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.progressTitle}>Inspection Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress} of {total} items completed ({progressPercentage}%)
          </Text>
        </GlassCard>

        {/* Category Filter */}
        <GlassCard style={styles.filterCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.filterTitle}>Filter by Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {['all', 'electrical', 'mechanical', 'fire_safety', 'structural', 'roof', 'elevator', 'environmental'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.categoryOptionSelected
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected
                ]}>
                  {category === 'all' ? 'ALL' : category.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Checklist Items */}
        <View style={styles.checklistContainer}>
          {filteredChecklist.map(renderChecklistItem)}
        </View>

        {/* Issues Summary */}
        {currentInspection.issues.length > 0 && (
          <GlassCard style={styles.issuesCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.issuesTitle}>🚨 Issues Found ({currentInspection.issues.length})</Text>
            {currentInspection.issues.map(issue => (
              <View key={issue.id} style={styles.issueItem}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={[styles.issueSeverity, { color: getPriorityColor(issue.severity) }]}>
                  {issue.severity.toUpperCase()}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>

      {renderIssueModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorText: {
    ...Typography.body,
    color: Colors.critical,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  progressCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  progressTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryAction,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  filterCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filterTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  categoryFilter: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: 'white',
  },
  checklistContainer: {
    marginBottom: Spacing.lg,
  },
  checklistItem: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  checklistItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  checklistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checklistItemIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  checklistItemInfo: {
    flex: 1,
  },
  checklistItemTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  checklistItemDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  checklistItemSpace: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
  },
  checklistItemRight: {
    marginLeft: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  priorityText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  checklistItemNotes: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 6,
  },
  notesLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  notesText: {
    ...Typography.caption,
    color: Colors.primaryText,
  },
  checklistItemPhotos: {
    marginTop: Spacing.sm,
  },
  photosLabel: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '500',
  },
  checklistItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  passButton: {
    backgroundColor: Colors.success,
  },
  failButton: {
    backgroundColor: Colors.critical,
  },
  naButton: {
    backgroundColor: Colors.inactive,
  },
  actionButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  issuesCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  issuesTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  issueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  issueTitle: {
    ...Typography.body,
    color: Colors.primaryText,
    flex: 1,
  },
  issueSeverity: {
    ...Typography.caption,
    fontWeight: '600',
  },
  // Issue Modal Styles
  issueModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  issueModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  issueModalTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  issueModalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  issueModalSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.lg,
  },
  issueForm: {
    flex: 1,
  },
  formLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    ...Typography.body,
    color: Colors.primaryText,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  severityOption: {
    flex: 1,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  severityText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primaryAction,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default BuildingInspectionView;
