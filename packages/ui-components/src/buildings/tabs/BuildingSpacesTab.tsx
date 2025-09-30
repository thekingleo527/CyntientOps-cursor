/**
 * 🔑 Building Spaces Tab - Photo Repository
 * Mirrors: SwiftUI BuildingDetailView Spaces tab functionality
 * Purpose: Building spaces management, access control, and photo repository
 * Features: Space inventory, access codes, key management, space utilization, photo gallery with smart location tagging
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
  RefreshControl,
  Image,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';
import { PhotoEvidenceManager, PhotoEvidence } from '@cyntientops/managers';
import { BuildingInspectionView } from '../BuildingInspectionView';

// Define BuildingSpace interface locally since it's not exported from managers
export interface BuildingSpace {
  id: string;
  name: string;
  category: 'utility' | 'mechanical' | 'storage' | 'electrical' | 'access' | 'office' | 'common' | 'exterior' | 'elevator' | 'roof' | 'stairwell' | 'fire_safety' | 'trash';
  floor: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
  buildingId: string;
  description?: string;
  accessType?: 'key' | 'code' | 'card' | 'biometric';
  accessCode?: string;
  keyLocation?: string;
  isAccessible?: boolean;
  lastAccessed?: Date;
  notes?: string;
  photos?: PhotoEvidence[];
  photoCount?: number;
  lastPhotoDate?: Date;
}

export interface BuildingSpacesTabProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  currentUserId?: string;
  currentUserName?: string;
  userRole?: 'admin' | 'worker' | 'manager';
  onSpacePress?: (space: any) => void;
  onPhotoPress?: (photo: PhotoEvidence) => void;
}

export interface BuildingSpaceWithPhotos extends BuildingSpace {
  accessType: 'key' | 'code' | 'card' | 'biometric';
  isAccessible: boolean;
  photos: PhotoEvidence[];
  photoCount: number;
}

export interface SpaceStats {
  totalSpaces: number;
  accessibleSpaces: number;
  keyAccessSpaces: number;
  codeAccessSpaces: number;
  categoriesCount: number;
  utilizationRate: number;
}

export const BuildingSpacesTab: React.FC<BuildingSpacesTabProps> = ({
  buildingId,
  buildingName,
  container,
  currentUserId = '1',
  currentUserName = 'Edwin Lema',
  userRole = 'worker',
  onSpacePress,
  onPhotoPress
}) => {
  const [buildingSpaces, setBuildingSpaces] = useState<BuildingSpaceWithPhotos[]>([]);
  const [spaceStats, setSpaceStats] = useState<SpaceStats>({
    totalSpaces: 0,
    accessibleSpaces: 0,
    keyAccessSpaces: 0,
    codeAccessSpaces: 0,
    categoriesCount: 0,
    utilizationRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<BuildingSpaceWithPhotos | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'utility' | 'mechanical' | 'storage' | 'electrical' | 'access' | 'office' | 'common' | 'exterior' | 'elevator' | 'roof' | 'stairwell' | 'fire_safety' | 'trash'>('all');
  const [filterAccess, setFilterAccess] = useState<'all' | 'key' | 'code' | 'card' | 'biometric'>('all');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEvidence | null>(null);
  const [showAreaSpecification, setShowAreaSpecification] = useState(false);
  const [areaNotes, setAreaNotes] = useState('');
  const [photoManager, setPhotoManager] = useState<PhotoEvidenceManager | null>(null);
  const [showInspection, setShowInspection] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);
  const [showInspectionHistory, setShowInspectionHistory] = useState(false);

  useEffect(() => {
    loadSpacesData();
  }, [buildingId]);

  const loadSpacesData = async () => {
    setIsLoading(true);
    try {
      // Initialize photo manager
      const manager = PhotoEvidenceManager.getInstance(container.database);
      setPhotoManager(manager);

      // Load building spaces, photos, and inspection data
      const [spaces, allPhotos, inspectionData] = await Promise.all([
        generateBuildingSpaces(buildingId),
        manager.getPhotosForBuilding(buildingId),
        loadInspectionData()
      ]);

      // Enhance spaces with photo data
      const spacesWithPhotos = await Promise.all(
        spaces.map(async (space) => {
          const spacePhotos = await manager.getPhotosForSpace(space.id);
          const lastPhotoDate = spacePhotos.length > 0 
            ? new Date(Math.max(...spacePhotos.map(p => p.timestamp)))
            : undefined;

          return {
            ...space,
            photos: spacePhotos,
            photoCount: spacePhotos.length,
            lastPhotoDate
          };
        })
      );

      setBuildingSpaces(spacesWithPhotos);
      calculateSpaceStats(spacesWithPhotos);
    } catch (error) {
      console.error('Failed to load spaces data:', error);
      Alert.alert('Error', 'Failed to load spaces data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInspectionData = async () => {
    try {
      // Load current month's inspection
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const currentInspectionResult = await container.database.query(`
        SELECT * FROM building_inspections 
        WHERE building_id = ? AND strftime('%m', inspection_date) = ? AND strftime('%Y', inspection_date) = ?
        ORDER BY inspection_date DESC LIMIT 1
      `, [buildingId, String(currentMonth).padStart(2, '0'), String(currentYear)]);

      // Load inspection history (last 6 months)
      const historyResult = await container.database.query(`
        SELECT * FROM building_inspections 
        WHERE building_id = ? 
        ORDER BY inspection_date DESC 
        LIMIT 6
      `, [buildingId]);

      const currentInspection = currentInspectionResult.length > 0 ? currentInspectionResult[0] : null;
      const history = historyResult || [];

      setCurrentInspection(currentInspection);
      setInspectionHistory(history);

      return { currentInspection, history };
    } catch (error) {
      console.error('Failed to load inspection data:', error);
      return { currentInspection: null, history: [] };
    }
  };

  const generateBuildingSpaces = async (buildingId: string): Promise<BuildingSpace[]> => {
    const buildingSpacesData = {
      '1': [ // 12 West 18th Street - Standard Commercial Building
        // Mechanical Systems
        {
          id: 'space_1_1',
          name: 'Boiler Room',
          category: 'mechanical' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          notes: 'Primary heating system - monthly inspection required',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 5 }
        },
        {
          id: 'space_1_2',
          name: 'Elevator Machine Room',
          category: 'elevator' as const,
          floor: 6, // Top floor
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Building Manager Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          notes: 'Monthly elevator inspection - restricted access',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 3 }
        },
        // Electrical Systems
        {
          id: 'space_1_3',
          name: 'Main Electrical Room',
          category: 'electrical' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'code' as const,
          accessCode: '1234',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Main electrical panel - emergency access only',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 4 }
        },
        {
          id: 'space_1_4',
          name: 'Electrical Closet - Floor 2',
          category: 'electrical' as const,
          floor: 2,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Floor electrical distribution',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 2 }
        },
        // Fire Safety Systems
        {
          id: 'space_1_5',
          name: 'Fire Pump Room',
          category: 'fire_safety' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          notes: 'Fire suppression system - monthly inspection required',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 4 }
        },
        {
          id: 'space_1_6',
          name: 'Sprinkler Riser Room',
          category: 'fire_safety' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          notes: 'Sprinkler system controls',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 3 }
        },
        // Roof and Drainage
        {
          id: 'space_1_7',
          name: 'Roof Access',
          category: 'roof' as const,
          floor: 6,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Roof drainage inspection - monthly required',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 10 }
        },
        {
          id: 'space_1_8',
          name: 'Roof Drain Area A',
          category: 'roof' as const,
          floor: 6,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Primary roof drain - check for debris',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 2 }
        },
        // Stairwells
        {
          id: 'space_1_9',
          name: 'Main Stairwell A',
          category: 'stairwell' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'code' as const,
          accessCode: '5678',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Emergency egress - monthly safety check',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 3 }
        },
        {
          id: 'space_1_10',
          name: 'Emergency Stairwell B',
          category: 'stairwell' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'code' as const,
          accessCode: '5678',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Secondary egress - monthly safety check',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 3 }
        },
        // Trash and Waste
        {
          id: 'space_1_11',
          name: 'Trash Room',
          category: 'trash' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Maintenance Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Waste management - daily inspection required',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 5 }
        },
        // Storage
        {
          id: 'space_1_12',
          name: 'Storage Room A',
          category: 'storage' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'key' as const,
          keyLocation: 'Building Manager Office',
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 3 * 60 * 60 * 1000),
          notes: 'Cleaning supplies and equipment',
          coordinates: { latitude: 40.7389, longitude: -73.9928, radius: 4 }
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area) - Museum Building
        // Museum-Specific Mechanical Systems
        {
          id: 'space_4_1',
          name: 'Museum Climate Control',
          category: 'mechanical' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'biometric' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 30 * 60 * 1000),
          notes: 'Critical for artifact preservation - high security',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 3 }
        },
        {
          id: 'space_4_2',
          name: 'Museum Elevator Machine Room',
          category: 'elevator' as const,
          floor: 4,
          buildingId: buildingId,
          accessType: 'biometric' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Museum elevator - specialized for artifact transport',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 3 }
        },
        // Museum Electrical Systems
        {
          id: 'space_4_3',
          name: 'Museum Electrical Room',
          category: 'electrical' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'card' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'Museum electrical systems - backup power critical',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 4 }
        },
        // Museum Fire Safety (Enhanced)
        {
          id: 'space_4_4',
          name: 'Museum Fire Suppression Room',
          category: 'fire_safety' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'biometric' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Specialized fire suppression for artifacts',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 4 }
        },
        // Museum Security
        {
          id: 'space_4_5',
          name: 'Security Control Room',
          category: 'access' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'card' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 15 * 60 * 1000),
          notes: '24/7 monitoring station',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 3 }
        },
        // Museum Storage
        {
          id: 'space_4_6',
          name: 'Artifact Storage',
          category: 'storage' as const,
          floor: 2,
          buildingId: buildingId,
          accessType: 'biometric' as const,
          isAccessible: false,
          notes: 'Restricted access - museum personnel only',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 5 }
        },
        // Museum Roof Systems
        {
          id: 'space_4_7',
          name: 'Museum Roof Access',
          category: 'roof' as const,
          floor: 4,
          buildingId: buildingId,
          accessType: 'card' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Museum roof - specialized drainage for artifact protection',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 8 }
        },
        // Museum Stairwells
        {
          id: 'space_4_8',
          name: 'Museum Main Stairwell',
          category: 'stairwell' as const,
          floor: 1,
          buildingId: buildingId,
          accessType: 'card' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Museum egress - enhanced security',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 3 }
        },
        // Museum Trash (Specialized)
        {
          id: 'space_4_9',
          name: 'Museum Waste Room',
          category: 'trash' as const,
          floor: -1,
          buildingId: buildingId,
          accessType: 'card' as const,
          isAccessible: true,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Museum waste - specialized handling required',
          coordinates: { latitude: 40.7193, longitude: -74.0059, radius: 4 }
        }
      ]
    };

    return buildingSpacesData[buildingId as keyof typeof buildingSpacesData] || [];
  };

  const calculateSpaceStats = (spaces: BuildingSpace[]) => {
    const totalSpaces = spaces.length;
    const accessibleSpaces = spaces.filter(s => s.isAccessible).length;
    const keyAccessSpaces = spaces.filter(s => s.accessType === 'key').length;
    const codeAccessSpaces = spaces.filter(s => s.accessType === 'code').length;
    const categoriesCount = new Set(spaces.map(s => s.category)).size;
    const utilizationRate = totalSpaces > 0 ? Math.round((accessibleSpaces / totalSpaces) * 100) : 0;

    setSpaceStats({
      totalSpaces,
      accessibleSpaces,
      keyAccessSpaces,
      codeAccessSpaces,
      categoriesCount,
      utilizationRate
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSpacesData();
    setIsRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'utility': return '🔧';
      case 'mechanical': return '⚙️';
      case 'storage': return '📦';
      case 'electrical': return '⚡';
      case 'access': return '🚪';
      case 'office': return '🏢';
      case 'elevator': return '🛗';
      case 'roof': return '🏠';
      case 'stairwell': return '🪜';
      case 'fire_safety': return '🚨';
      case 'trash': return '🗑️';
      case 'common': return '🏛️';
      case 'exterior': return '🌳';
      default: return '🏠';
    }
  };

  const getAccessIcon = (accessType: string) => {
    switch (accessType) {
      case 'key': return '🗝️';
      case 'code': return '🔢';
      case 'card': return '💳';
      case 'biometric': return '👆';
      default: return '🔒';
    }
  };

  const getAccessColor = (accessType: string) => {
    switch (accessType) {
      case 'key': return Colors.warning;
      case 'code': return Colors.info;
      case 'card': return Colors.primaryAction;
      case 'biometric': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getInspectionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.info;
      case 'scheduled': return Colors.warning;
      case 'overdue': return Colors.critical;
      default: return Colors.inactive;
    }
  };

  const formatLastAccessed = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderSpaceItem = (space: BuildingSpace) => {
    const isSelected = selectedSpace?.id === space.id;
    const accessColor = getAccessColor(space.accessType);

    return (
      <TouchableOpacity
        key={space.id}
        onPress={() => {
          setSelectedSpace(space);
          onSpacePress?.(space);
        }}
      >
        <GlassCard 
          style={[
            styles.spaceCard,
            !space.isAccessible && styles.inaccessibleSpaceCard,
            isSelected && styles.selectedSpaceCard
          ]} 
          intensity={GlassIntensity.REGULAR} 
          cornerRadius={CornerRadius.CARD}
        >
          <View style={styles.spaceHeader}>
            <View style={styles.spaceHeaderLeft}>
              <Text style={styles.spaceIcon}>{getCategoryIcon(space.category)}</Text>
              <View style={styles.spaceInfo}>
                <Text style={styles.spaceName}>{space.name}</Text>
                <Text style={styles.spaceFloor}>Floor {space.floor}</Text>
      </View>
            </View>
            
            <View style={styles.spaceHeaderRight}>
              <View style={[styles.accessBadge, { backgroundColor: accessColor + '20' }]}>
                <Text style={styles.accessIcon}>{getAccessIcon(space.accessType)}</Text>
                <Text style={[styles.accessText, { color: accessColor }]}>
                  {space.accessType.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.spaceMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>
                  {space.category}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Access</Text>
                <Text style={[styles.metaValue, { color: accessColor }]}>
                  {space.accessType}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, { color: space.isAccessible ? Colors.success : Colors.critical }]}>
                  {space.isAccessible ? 'Accessible' : 'Restricted'}
                </Text>
              </View>
            </View>
            
            {space.lastAccessed && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Last Accessed</Text>
                  <Text style={styles.metaValue}>
                    {formatLastAccessed(space.lastAccessed)}
                  </Text>
                </View>
                {space.accessCode && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Access Code</Text>
                    <Text style={[styles.metaValue, { color: Colors.primaryAction }]}>
                      {space.accessCode}
                    </Text>
                  </View>
                )}
                {space.keyLocation && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Key Location</Text>
                    <Text style={styles.metaValue}>
                      {space.keyLocation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {space.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{space.notes}</Text>
            </View>
          )}

          {/* Photo Gallery Section */}
          {space.photos.length > 0 && (
            <View style={styles.photoGalleryContainer}>
              <View style={styles.photoGalleryHeader}>
                <Text style={styles.photoGalleryTitle}>📸 Photos ({space.photoCount})</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedSpace(space);
                    setShowPhotoModal(true);
                  }}
                >
                  <Text style={styles.viewAllPhotosText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.photoThumbnails}
              >
                {space.photos.slice(0, 5).map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => {
                      setSelectedPhoto(photo);
                      onPhotoPress?.(photo);
                    }}
                  >
                    <Image 
                      source={{ uri: photo.thumbnailUri }} 
                      style={styles.photoThumbnail}
                    />
                    {photo.smartLocation && (
                      <View style={styles.photoLocationBadge}>
                        <Text style={styles.photoLocationText}>
                          {photo.smartLocation.detectedSpace || 'Unknown'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {space.photos.length > 5 && (
                  <View style={styles.morePhotosIndicator}>
                    <Text style={styles.morePhotosText}>+{space.photos.length - 5}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {!space.isAccessible && (
            <View style={styles.restrictedWarning}>
              <Text style={styles.restrictedText}>🚫 Restricted Access</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
  return (
      <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.statsTitle}>Space Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{spaceStats.totalSpaces}</Text>
            <Text style={styles.statLabel}>Total Spaces</Text>
      </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{spaceStats.accessibleSpaces}</Text>
            <Text style={styles.statLabel}>Accessible</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{spaceStats.keyAccessSpaces}</Text>
            <Text style={styles.statLabel}>Key Access</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{spaceStats.codeAccessSpaces}</Text>
            <Text style={styles.statLabel}>Code Access</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primaryAction }]}>{spaceStats.categoriesCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{spaceStats.utilizationRate}%</Text>
            <Text style={styles.statLabel}>Utilization</Text>
          </View>
        </View>

        {/* Inspection Status */}
        {currentInspection && (
          <View style={styles.inspectionStatusContainer}>
            <View style={styles.inspectionStatusHeader}>
              <Text style={styles.inspectionStatusTitle}>🏢 Current Inspection</Text>
              <TouchableOpacity 
                onPress={() => setShowInspectionHistory(true)}
                style={styles.viewHistoryButton}
              >
                <Text style={styles.viewHistoryText}>View History</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inspectionStatusInfo}>
              <View style={styles.inspectionStatusLeft}>
                <Text style={styles.inspectionDate}>
                  {new Date(currentInspection.inspection_date).toLocaleDateString()}
                </Text>
                <Text style={styles.inspectionInspector}>
                  Inspector: {currentInspection.inspector_name}
                </Text>
              </View>
              
              <View style={styles.inspectionStatusRight}>
                <View style={[
                  styles.inspectionStatusBadge, 
                  { backgroundColor: getInspectionStatusColor(currentInspection.status) + '20' }
                ]}>
                  <Text style={[
                    styles.inspectionStatusText, 
                    { color: getInspectionStatusColor(currentInspection.status) }
                  ]}>
                    {currentInspection.status.toUpperCase()}
                  </Text>
                </View>
                
                {currentInspection.checklist && (
                  <Text style={styles.inspectionProgress}>
                    {JSON.parse(currentInspection.checklist).filter((item: any) => item.status !== 'pending').length} / {JSON.parse(currentInspection.checklist).length} Complete
                  </Text>
                )}
              </View>
            </View>

            {currentInspection.issues && JSON.parse(currentInspection.issues).length > 0 && (
              <View style={styles.inspectionIssuesContainer}>
                <Text style={styles.inspectionIssuesTitle}>
                  🚨 {JSON.parse(currentInspection.issues).length} Issue(s) Found
                </Text>
                {JSON.parse(currentInspection.issues).slice(0, 2).map((issue: any) => (
                  <Text key={issue.id} style={styles.inspectionIssueItem}>
                    • {issue.title} ({issue.severity})
                  </Text>
                ))}
                {JSON.parse(currentInspection.issues).length > 2 && (
                  <Text style={styles.inspectionMoreIssues}>
                    +{JSON.parse(currentInspection.issues).length - 2} more issues
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  const renderQuickActions = () => {
    return (
      <GlassCard style={styles.quickActionsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowInspection(true)}
          >
            <Text style={styles.quickActionIcon}>🏢</Text>
            <Text style={styles.quickActionText}>Monthly Inspection</Text>
            <Text style={styles.quickActionSubtext}>Building walkthrough</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              // Navigate to photo capture
              Alert.alert('Photo Capture', 'Photo capture functionality will be integrated here');
            }}
          >
            <Text style={styles.quickActionIcon}>📸</Text>
            <Text style={styles.quickActionText}>Capture Photo</Text>
            <Text style={styles.quickActionSubtext}>Document space</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              // Navigate to space management
              Alert.alert('Space Management', 'Space management functionality will be integrated here');
            }}
          >
            <Text style={styles.quickActionIcon}>🔧</Text>
            <Text style={styles.quickActionText}>Manage Spaces</Text>
            <Text style={styles.quickActionSubtext}>Add/edit spaces</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              // Navigate to access control
              Alert.alert('Access Control', 'Access control management will be integrated here');
            }}
          >
            <Text style={styles.quickActionIcon}>🔐</Text>
            <Text style={styles.quickActionText}>Access Control</Text>
            <Text style={styles.quickActionSubtext}>Manage access</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  const renderFilters = () => {
    return (
      <GlassCard style={styles.filtersCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.filtersTitle}>Filters</Text>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'utility', 'mechanical', 'storage', 'electrical', 'access', 'office', 'common', 'exterior', 'elevator', 'roof', 'stairwell', 'fire_safety', 'trash'].map(category => (
          <TouchableOpacity
                key={category}
            style={[
                  styles.filterOption,
                  filterCategory === category && styles.filterOptionSelected
            ]}
                onPress={() => setFilterCategory(category as any)}
          >
            <Text style={[
                  styles.filterOptionText,
                  filterCategory === category && styles.filterOptionTextSelected
            ]}>
                  {category.toUpperCase()}
            </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Access Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'key', 'code', 'card', 'biometric'].map(access => (
              <TouchableOpacity
                key={access}
                style={[
                  styles.filterOption,
                  filterAccess === access && styles.filterOptionSelected
                ]}
                onPress={() => setFilterAccess(access as any)}
              >
            <Text style={[
                  styles.filterOptionText,
                  filterAccess === access && styles.filterOptionTextSelected
            ]}>
                  {access.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
        </View>
      </GlassCard>
    );
  };

  const filteredSpaces = buildingSpaces.filter(space => {
    const categoryMatch = filterCategory === 'all' || space.category === filterCategory;
    const accessMatch = filterAccess === 'all' || space.accessType === filterAccess;
    return categoryMatch && accessMatch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading spaces data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryAction}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔑 Building Spaces</Text>
          <Text style={styles.headerSubtitle}>
            Space management and access control for {buildingName}
          </Text>
        </View>

        {renderStats()}
        {renderQuickActions()}
        {renderFilters()}

        <View style={styles.spacesContainer}>
          {filteredSpaces.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyTitle}>No Spaces Found</Text>
              <Text style={styles.emptyDescription}>
                No spaces match the current filters.
              </Text>
            </GlassCard>
          ) : (
            filteredSpaces.map(renderSpaceItem)
                )}
              </View>
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalContainer}>
          <View style={styles.photoModalHeader}>
            <Text style={styles.photoModalTitle}>
              📸 {selectedSpace?.name} Photos
                </Text>
            <TouchableOpacity 
              onPress={() => setShowPhotoModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
              </View>

          {selectedSpace && (
            <FlatList
              data={selectedSpace.photos}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.photoGrid}
              renderItem={({ item: photo }) => (
                <TouchableOpacity
                  style={styles.photoGridItem}
                  onPress={() => {
                    setSelectedPhoto(photo);
                    setShowAreaSpecification(true);
                  }}
                >
                  <Image 
                    source={{ uri: photo.thumbnailUri }} 
                    style={styles.photoGridImage}
                  />
                  <View style={styles.photoGridInfo}>
                    <Text style={styles.photoGridDate}>
                      {new Date(photo.timestamp).toLocaleDateString()}
                  </Text>
                    {photo.smartLocation && (
                      <Text style={styles.photoGridLocation}>
                        {photo.smartLocation.detectedSpace}
                      </Text>
                    )}
                    {photo.workerSpecifiedArea && (
                      <Text style={styles.photoGridSpecified}>
                        ✓ Worker Specified
                  </Text>
              )}
                </View>
                </TouchableOpacity>
              )}
            />
              )}
            </View>
      </Modal>

      {/* Area Specification Modal */}
      <Modal
        visible={showAreaSpecification}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAreaSpecification(false)}
      >
        <View style={styles.areaSpecModalContainer}>
          <View style={styles.areaSpecModalHeader}>
            <Text style={styles.areaSpecModalTitle}>Specify Photo Location</Text>
              <TouchableOpacity
              onPress={() => setShowAreaSpecification(false)}
              style={styles.closeButton}
              >
              <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
          </View>

          {selectedPhoto && (
            <View style={styles.areaSpecContent}>
              <Image 
                source={{ uri: selectedPhoto.imageUri }} 
                style={styles.areaSpecPhoto}
              />
              
              <View style={styles.areaSpecInfo}>
                <Text style={styles.areaSpecInfoTitle}>Smart Detection:</Text>
                {selectedPhoto.smartLocation ? (
                  <Text style={styles.areaSpecInfoText}>
                    {selectedPhoto.smartLocation.detectedSpace} 
                    (Confidence: {selectedPhoto.smartLocation.confidence}%)
                  </Text>
                ) : (
                  <Text style={styles.areaSpecInfoText}>No location detected</Text>
                )}
              </View>

              <View style={styles.areaSpecForm}>
                <Text style={styles.areaSpecFormLabel}>Select Correct Space:</Text>
                <ScrollView style={styles.spaceSelector}>
                  {buildingSpaces.map((space) => (
                <TouchableOpacity
                      key={space.id}
                      style={styles.spaceOption}
                      onPress={async () => {
                        if (photoManager && selectedPhoto) {
                          try {
                            await photoManager.specifyWorkerArea(
                              selectedPhoto.id,
                              space.id,
                              areaNotes
                            );
                            Alert.alert('Success', 'Photo location updated successfully');
                            setShowAreaSpecification(false);
                            loadSpacesData(); // Refresh data
                          } catch (error) {
                            Alert.alert('Error', 'Failed to update photo location');
                          }
                        }
                      }}
                    >
                      <Text style={styles.spaceOptionText}>
                        {space.name} (Floor {space.floor})
                      </Text>
                </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.areaSpecNotes}
                  placeholder="Add notes about this location..."
                  value={areaNotes}
                  onChangeText={setAreaNotes}
                  multiline
                />
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Building Inspection Modal */}
      <Modal
        visible={showInspection}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowInspection(false)}
      >
        <BuildingInspectionView
          buildingId={buildingId}
          buildingName={buildingName}
          container={container}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          userRole={userRole}
          onInspectionComplete={(inspection) => {
            Alert.alert('Inspection Complete', 'Building inspection has been completed successfully');
            setShowInspection(false);
          }}
        />
        <TouchableOpacity 
          style={styles.closeInspectionButton}
          onPress={() => setShowInspection(false)}
        >
          <Text style={styles.closeInspectionButtonText}>✕ Close</Text>
        </TouchableOpacity>
      </Modal>

      {/* Inspection History Modal */}
      <Modal
        visible={showInspectionHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInspectionHistory(false)}
      >
        <View style={styles.inspectionHistoryContainer}>
          <View style={styles.inspectionHistoryHeader}>
            <Text style={styles.inspectionHistoryTitle}>🏢 Inspection History</Text>
            <TouchableOpacity 
              onPress={() => setShowInspectionHistory(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.inspectionHistoryContent}>
            {inspectionHistory.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>No inspection history available</Text>
              </View>
            ) : (
              inspectionHistory.map((inspection) => (
                <TouchableOpacity
                  key={inspection.id}
                  style={styles.inspectionHistoryItem}
                  onPress={() => {
                    setShowInspectionHistory(false);
                    setShowInspection(true);
                  }}
                >
                  <View style={styles.inspectionHistoryItemHeader}>
                    <Text style={styles.inspectionHistoryDate}>
                      {new Date(inspection.inspection_date).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.inspectionHistoryStatusBadge,
                      { backgroundColor: getInspectionStatusColor(inspection.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.inspectionHistoryStatusText,
                        { color: getInspectionStatusColor(inspection.status) }
                      ]}>
                        {inspection.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.inspectionHistoryInspector}>
                    Inspector: {inspection.inspector_name}
                  </Text>
                  
                  {inspection.checklist && (
                    <Text style={styles.inspectionHistoryProgress}>
                      {JSON.parse(inspection.checklist).filter((item: any) => item.status !== 'pending').length} / {JSON.parse(inspection.checklist).length} items completed
                    </Text>
                  )}
                  
                  {inspection.issues && JSON.parse(inspection.issues).length > 0 && (
                    <Text style={styles.inspectionHistoryIssues}>
                      🚨 {JSON.parse(inspection.issues).length} issue(s) found
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
  // Quick Actions Styles
  quickActionsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  quickActionsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtext: {
    ...Typography.captionSmall,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  closeInspectionButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: Colors.glassOverlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    zIndex: 1000,
  },
  closeInspectionButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  // Inspection Status Styles
  inspectionStatusContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inspectionStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inspectionStatusTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  viewHistoryButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryAction,
    borderRadius: 6,
  },
  viewHistoryText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  inspectionStatusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inspectionStatusLeft: {
    flex: 1,
  },
  inspectionDate: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  inspectionInspector: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  inspectionStatusRight: {
    alignItems: 'flex-end',
  },
  inspectionStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  inspectionStatusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  inspectionProgress: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  inspectionIssuesContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.critical + '10',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
  },
  inspectionIssuesTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inspectionIssueItem: {
    ...Typography.captionSmall,
    color: Colors.primaryText,
    marginBottom: 2,
  },
  inspectionMoreIssues: {
    ...Typography.captionSmall,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  // Inspection History Styles
  inspectionHistoryContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inspectionHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  inspectionHistoryTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  inspectionHistoryContent: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyHistoryText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  inspectionHistoryItem: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inspectionHistoryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inspectionHistoryDate: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  inspectionHistoryStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  inspectionHistoryStatusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  inspectionHistoryInspector: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  inspectionHistoryProgress: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  inspectionHistoryIssues: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  filtersCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filtersTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
  spacesContainer: {
    marginBottom: Spacing.lg,
  },
  spaceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  inaccessibleSpaceCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  selectedSpaceCard: {
    borderWidth: 2,
    borderColor: Colors.primaryAction,
  },
  spaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  spaceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spaceIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  spaceFloor: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  spaceHeaderRight: {
    marginLeft: Spacing.sm,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  accessIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  accessText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  spaceMeta: {
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  notesContainer: {
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
  restrictedWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.critical + '20',
    borderRadius: 6,
  },
  restrictedText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  // Photo Gallery Styles
  photoGalleryContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
  },
  photoGalleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  photoGalleryTitle: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  viewAllPhotosText: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  photoThumbnails: {
    flexDirection: 'row',
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.xs,
  },
  photoLocationBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: Colors.primaryAction + '80',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoLocationText: {
    ...Typography.captionSmall,
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
  },
  morePhotosIndicator: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
  },
  morePhotosText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  // Photo Modal Styles
  photoModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  photoModalTitle: {
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
  photoGrid: {
    padding: Spacing.md,
  },
  photoGridItem: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoGridImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  photoGridInfo: {
    padding: Spacing.sm,
  },
  photoGridDate: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  photoGridLocation: {
    ...Typography.captionSmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  photoGridSpecified: {
    ...Typography.captionSmall,
    color: Colors.success,
    marginTop: 2,
    fontWeight: '600',
  },
  // Area Specification Modal Styles
  areaSpecModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  areaSpecModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  areaSpecModalTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  areaSpecContent: {
    flex: 1,
    padding: Spacing.md,
  },
  areaSpecPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  areaSpecInfo: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
  },
  areaSpecInfoTitle: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  areaSpecInfoText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  areaSpecForm: {
    flex: 1,
  },
  areaSpecFormLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  spaceSelector: {
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  spaceOption: {
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  spaceOptionText: {
    ...Typography.body,
    color: Colors.primaryText,
  },
  areaSpecNotes: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    ...Typography.body,
    color: Colors.primaryText,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default BuildingSpacesTab;