/**
 * 📷 Building Media Tab
 * Mirrors: SwiftUI BuildingDetailView Media tab functionality
 * Purpose: Photo documentation and media management for building operations
 * Features: Photo gallery, video recordings, document storage, media organization
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  FlatList
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';
import { PhotoEvidenceManager, PhotoEvidence } from '@cyntientops/managers';

export interface BuildingMediaTabProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onMediaPress?: (media: MediaItem) => void;
  onPhotoCapture?: () => void;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'document';
  title: string;
  description?: string;
  uri: string;
  thumbnailUri?: string;
  timestamp: Date;
  workerId: string;
  workerName: string;
  taskId?: string;
  taskName?: string;
  spaceId?: string;
  spaceName?: string;
  tags: string[];
  metadata: {
    size: number;
    format: string;
    dimensions?: { width: number; height: number };
    location?: { latitude: number; longitude: number };
    smartLocation?: {
      detectedSpace?: string;
      detectedFloor?: number;
      confidence: number;
    };
  };
}

export interface MediaStats {
  totalPhotos: number;
  totalVideos: number;
  totalDocuments: number;
  totalSize: number;
  recentUploads: number;
  spaceCoverage: number;
  taskCoverage: number;
}

export const BuildingMediaTab: React.FC<BuildingMediaTabProps> = ({
  buildingId,
  buildingName,
  container,
  onMediaPress,
  onPhotoCapture,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video' | 'document'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [photoManager, setPhotoManager] = useState<PhotoEvidenceManager | null>(null);

  useEffect(() => {
    initializePhotoManager();
    loadMediaData();
  }, [buildingId]);

  useEffect(() => {
    applyFilters();
  }, [mediaItems, filterType, filterPeriod]);

  const initializePhotoManager = async () => {
    try {
      const manager = new PhotoEvidenceManager(container.database);
      setPhotoManager(manager);
    } catch (error) {
      console.error('Failed to initialize photo manager:', error);
    }
  };

  const loadMediaData = async () => {
    setIsLoading(true);
    try {
      const [photos, videos, documents] = await Promise.all([
        loadPhotoMedia(),
        loadVideoMedia(),
        loadDocumentMedia()
      ]);

      const allMedia = [...photos, ...videos, ...documents]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setMediaItems(allMedia);
      
      const mediaStats = calculateMediaStats(allMedia);
      setStats(mediaStats);
    } catch (error) {
      console.error('Failed to load media data:', error);
      Alert.alert('Error', 'Failed to load building media');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotoMedia = async (): Promise<MediaItem[]> => {
    try {
      if (!photoManager) return [];

      const photos = await photoManager.getPhotosForBuilding(buildingId);
      
      return photos.map((photo: PhotoEvidence) => ({
        id: photo.id,
        type: 'photo' as const,
        title: photo.metadata.taskName || 'Building Photo',
        description: photo.metadata.category || 'Photo documentation',
        uri: photo.imageUri,
        thumbnailUri: photo.thumbnailUri,
        timestamp: new Date(photo.timestamp),
        workerId: photo.workerId,
        workerName: photo.metadata.workerName,
        taskId: photo.taskId,
        taskName: photo.metadata.taskName,
        spaceId: photo.smartLocation?.buildingSpaceId,
        spaceName: photo.smartLocation?.detectedSpace,
        tags: photo.tags,
        metadata: {
          size: 0, // Would need to get from file system
          format: 'jpg',
          dimensions: { width: 1920, height: 1080 }, // Default
          location: photo.location,
          smartLocation: photo.smartLocation
        }
      }));
    } catch (error) {
      console.error('Failed to load photo media:', error);
      return [];
    }
  };

  const loadVideoMedia = async (): Promise<MediaItem[]> => {
    try {
      // Load video media from database
      const result = await container.database.query(`
        SELECT v.*, w.name as worker_name, t.title as task_name, s.name as space_name
        FROM building_videos v
        LEFT JOIN workers w ON v.worker_id = w.id
        LEFT JOIN tasks t ON v.task_id = t.id
        LEFT JOIN building_spaces s ON v.space_id = s.id
        WHERE v.building_id = ?
        AND v.created_at >= date('now', '-${getDateOffset(filterPeriod)}')
        ORDER BY v.created_at DESC
      `, [buildingId]);

      return result.map((video: any) => ({
        id: `video_${video.id}`,
        type: 'video' as const,
        title: video.title || 'Building Video',
        description: video.description || 'Video documentation',
        uri: video.video_uri,
        thumbnailUri: video.thumbnail_uri,
        timestamp: new Date(video.created_at),
        workerId: video.worker_id,
        workerName: video.worker_name,
        taskId: video.task_id,
        taskName: video.task_name,
        spaceId: video.space_id,
        spaceName: video.space_name,
        tags: JSON.parse(video.tags || '[]'),
        metadata: {
          size: video.file_size || 0,
          format: video.format || 'mp4',
          dimensions: JSON.parse(video.dimensions || '{"width": 1920, "height": 1080}'),
          location: JSON.parse(video.location || '{}')
        }
      }));
    } catch (error) {
      console.error('Failed to load video media:', error);
      return [];
    }
  };

  const loadDocumentMedia = async (): Promise<MediaItem[]> => {
    try {
      // Load document media from database
      const result = await container.database.query(`
        SELECT d.*, w.name as worker_name, t.title as task_name
        FROM building_documents d
        LEFT JOIN workers w ON d.worker_id = w.id
        LEFT JOIN tasks t ON d.task_id = t.id
        WHERE d.building_id = ?
        AND d.created_at >= date('now', '-${getDateOffset(filterPeriod)}')
        ORDER BY d.created_at DESC
      `, [buildingId]);

      return result.map((document: any) => ({
        id: `document_${document.id}`,
        type: 'document' as const,
        title: document.title || 'Building Document',
        description: document.description || 'Documentation',
        uri: document.document_uri,
        timestamp: new Date(document.created_at),
        workerId: document.worker_id,
        workerName: document.worker_name,
        taskId: document.task_id,
        taskName: document.task_name,
        tags: JSON.parse(document.tags || '[]'),
        metadata: {
          size: document.file_size || 0,
          format: document.format || 'pdf'
        }
      }));
    } catch (error) {
      console.error('Failed to load document media:', error);
      return [];
    }
  };

  const getDateOffset = (period: string): string => {
    switch (period) {
      case 'week': return '7 days';
      case 'month': return '1 month';
      case 'quarter': return '3 months';
      case 'year': return '1 year';
      default: return '1 month';
    }
  };

  const calculateMediaStats = (items: MediaItem[]): MediaStats => {
    const totalPhotos = items.filter(item => item.type === 'photo').length;
    const totalVideos = items.filter(item => item.type === 'video').length;
    const totalDocuments = items.filter(item => item.type === 'document').length;
    const totalSize = items.reduce((sum, item) => sum + item.metadata.size, 0);
    
    const recentUploads = items.filter(item => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return item.timestamp >= weekAgo;
    }).length;

    const uniqueSpaces = new Set(items.filter(item => item.spaceId).map(item => item.spaceId)).size;
    const uniqueTasks = new Set(items.filter(item => item.taskId).map(item => item.taskId)).size;

    return {
      totalPhotos,
      totalVideos,
      totalDocuments,
      totalSize,
      recentUploads,
      spaceCoverage: uniqueSpaces,
      taskCoverage: uniqueTasks
    };
  };

  const applyFilters = () => {
    // Filter logic is handled in the render method
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMediaData();
    setIsRefreshing(false);
  };

  const handleMediaPress = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowMediaModal(true);
    onMediaPress?.(media);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📷';
      case 'video': return '🎥';
      case 'document': return '📄';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const filteredItems = mediaItems.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - getDaysOffset(filterPeriod));
    return item.timestamp >= cutoffDate;
  });

  const getDaysOffset = (period: string): number => {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading building media...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Media Stats */}
        {stats && (
          <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.sectionTitle}>📊 Media Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalPhotos}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalVideos}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDocuments}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatFileSize(stats.totalSize)}</Text>
                <Text style={styles.statLabel}>Total Size</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <GlassCard style={styles.actionsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>📸 Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={onPhotoCapture}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionText}>Capture Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🎥</Text>
              <Text style={styles.actionText}>Record Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionText}>Upload Document</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={styles.actionText}>Organize Media</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Filters */}
        <GlassCard style={styles.filtersCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>🔍 Filters</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Type</Text>
            <View style={styles.filterOptions}>
              {(['all', 'photo', 'video', 'document'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filterType === type && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterType === type && styles.filterOptionTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Period</Text>
            <View style={styles.filterOptions}>
              {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.filterOption,
                    filterPeriod === period && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterPeriod(period)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterPeriod === period && styles.filterOptionTextSelected
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* Media Grid */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>📁 Media Library</Text>
          
          {filteredItems.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyText}>No media found for the selected period</Text>
            </GlassCard>
          ) : (
            <View style={styles.mediaGrid}>
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mediaItem}
                  onPress={() => handleMediaPress(item)}
                >
                  <View style={styles.mediaThumbnail}>
                    {item.type === 'photo' ? (
                      <Image
                        source={{ uri: item.thumbnailUri || item.uri }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mediaPlaceholder}>
                        <Text style={styles.mediaPlaceholderIcon}>{getTypeIcon(item.type)}</Text>
                      </View>
                    )}
                    <View style={styles.mediaTypeBadge}>
                      <Text style={styles.mediaTypeText}>{item.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.mediaDescription} numberOfLines={1}>
                      {item.workerName} • {formatTimestamp(item.timestamp)}
                    </Text>
                    {item.spaceName && (
                      <Text style={styles.mediaLocation} numberOfLines={1}>
                        📍 {item.spaceName}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Media Modal */}
      <Modal
        visible={showMediaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMedia && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedMedia.title}</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowMediaModal(false)}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  {selectedMedia.type === 'photo' ? (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.modalPlaceholder}>
                      <Text style={styles.modalPlaceholderIcon}>{getTypeIcon(selectedMedia.type)}</Text>
                      <Text style={styles.modalPlaceholderText}>{selectedMedia.type.toUpperCase()}</Text>
                    </View>
                  )}
                  
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalDescription}>{selectedMedia.description}</Text>
                    <Text style={styles.modalMeta}>
                      By {selectedMedia.workerName} • {formatTimestamp(selectedMedia.timestamp)}
                    </Text>
                    {selectedMedia.spaceName && (
                      <Text style={styles.modalMeta}>📍 {selectedMedia.spaceName}</Text>
                    )}
                    {selectedMedia.tags.length > 0 && (
                      <View style={styles.modalTags}>
                        {selectedMedia.tags.map((tag, index) => (
                          <Text key={index} style={styles.modalTag}>#{tag}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.md,
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
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '48%',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '500',
    textAlign: 'center',
  },
  filtersCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.glassOverlay,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  filterOptionText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  mediaSection: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  mediaItem: {
    width: '48%',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  mediaThumbnail: {
    position: 'relative',
    height: 120,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderIcon: {
    fontSize: 32,
    color: Colors.secondaryText,
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaTypeText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  mediaInfo: {
    padding: Spacing.sm,
  },
  mediaTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  mediaDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  mediaLocation: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalCloseText: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  modalBody: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalPlaceholder: {
    height: 300,
    backgroundColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderIcon: {
    fontSize: 48,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  modalPlaceholderText: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  modalInfo: {
    padding: Spacing.md,
  },
  modalDescription: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  modalMeta: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  modalTag: {
    ...Typography.caption,
    color: Colors.primaryAction,
    backgroundColor: Colors.primaryAction + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});

export default BuildingMediaTab;