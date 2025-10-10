/**
 * 🏢 Building Resources Tab
 * Purpose: Smart gallery, supplies inventory, and documentation
 * Features: Intelligent image gallery with smart tags, supplies management, documentation
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Image,
  Alert
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface BuildingResourcesTabProps {
  inventory: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    status: 'available' | 'low_stock' | 'out_of_stock';
    lastUpdated: Date;
  }>;
  media: Array<{
    id: string;
    type: 'photo' | 'video' | 'document';
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    uploadedBy: string;
    uploadedAt: Date;
    tags: string[];
  }>;
  building: {
    id: string;
    name: string;
    address: string;
    coordinate: { latitude: number; longitude: number };
  };
}

export const BuildingResourcesTab: React.FC<BuildingResourcesTabProps> = ({
  inventory,
  media,
  building,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Smart tags based on building infrastructure
  const smartTags = [
    'Building Exterior',
    'Basement Boiler', 
    'Roof Drains',
    'Garbage Set-Out',
    'Hot Water System',
    'Stairwell Access',
    'Unit Entrance',
    'Maintenance Areas',
    'Common Areas',
    'Storage Areas',
    'Emergency Areas'
  ];

  const categories = ['All', 'Exterior', 'Interior', 'Mechanical', 'Safety', 'Maintenance'];

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                           item.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Camera or gallery access would open here');
  };

  const handleEditGallery = () => {
    Alert.alert('Edit Gallery', 'Gallery editor would open here');
  };

  const handleExport = () => {
    Alert.alert('Export', 'Gallery export options would appear here');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing options would appear here');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Building Gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Building Gallery</Text>
        
        {/* Gallery Controls */}
        <View style={styles.galleryControls}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search photos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryButtonText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.viewControls}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={styles.viewButtonText}>⊞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <Text style={styles.viewButtonText}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Smart Tags */}
        <View style={styles.smartTagsContainer}>
          <Text style={styles.smartTagsTitle}>Smart Tags:</Text>
          <View style={styles.smartTags}>
            {smartTags.map(tag => (
              <TouchableOpacity key={tag} style={styles.smartTag}>
                <Text style={styles.smartTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gallery Actions */}
        <View style={styles.galleryActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddPhoto}>
            <Text style={styles.actionButtonText}>📷 Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditGallery}>
            <Text style={styles.actionButtonText}>✏️ Edit Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
            <Text style={styles.actionButtonText}>📤 Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Gallery Content */}
        {filteredMedia.length > 0 ? (
          <View style={styles.galleryContent}>
            {filteredMedia.map(item => (
              <GlassCard 
                key={item.id} 
                intensity={GlassIntensity.THIN} 
                cornerRadius={CornerRadius.MEDIUM} 
                style={styles.mediaItem}
              >
                <Image 
                  source={{ uri: item.thumbnailUrl || item.url }} 
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaTitle}>{item.title}</Text>
                  <Text style={styles.mediaDescription}>{item.description}</Text>
                  <View style={styles.mediaTags}>
                    {item.tags.slice(0, 3).map(tag => (
                      <View key={tag} style={styles.mediaTag}>
                        <Text style={styles.mediaTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.mediaMeta}>
                    By {item.uploadedBy} • {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No media found matching your criteria</Text>
          </GlassCard>
        )}
      </View>

      {/* Supplies Inventory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supplies Inventory</Text>
        
        {inventory.length > 0 ? (
          <View style={styles.inventoryList}>
            {inventory.map(item => (
              <GlassCard 
                key={item.id} 
                intensity={GlassIntensity.THIN} 
                cornerRadius={CornerRadius.MEDIUM} 
                style={[
                  styles.inventoryItem,
                  item.status === 'low_stock' && styles.lowStockItem,
                  item.status === 'out_of_stock' && styles.outOfStockItem
                ]}
              >
                <View style={styles.inventoryHeader}>
                  <Text style={styles.inventoryName}>{item.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.inventoryDetails}>
                  <Text style={styles.inventoryCategory}>Category: {item.category}</Text>
                  <Text style={styles.inventoryQuantity}>Quantity: {item.quantity}</Text>
                  <Text style={styles.inventoryUpdated}>
                    Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No inventory items found</Text>
          </GlassCard>
        )}

        {lowStockItems.length > 0 && (
          <View style={styles.lowStockAlert}>
            <Text style={styles.lowStockTitle}>⚠️ Low Stock Alert</Text>
            <Text style={styles.lowStockText}>
              {lowStockItems.length} items need restocking
            </Text>
          </View>
        )}
      </View>

      {/* Documentation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentation</Text>
        
        <View style={styles.documentationList}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.docItem}>
            <Text style={styles.docTitle}>📋 Building Manual</Text>
            <Text style={styles.docDescription}>Complete building operations manual</Text>
            <Text style={styles.docMeta}>Last updated: 10/01/2025</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.docItem}>
            <Text style={styles.docTitle}>🔧 Maintenance Procedures</Text>
            <Text style={styles.docDescription}>Step-by-step maintenance guides</Text>
            <Text style={styles.docMeta}>Last updated: 09/28/2025</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.docItem}>
            <Text style={styles.docTitle}>🚨 Emergency Procedures</Text>
            <Text style={styles.docDescription}>Emergency response protocols</Text>
            <Text style={styles.docMeta}>Last updated: 09/15/2025</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.docItem}>
            <Text style={styles.docTitle}>📊 Compliance Reports</Text>
            <Text style={styles.docDescription}>Recent compliance documentation</Text>
            <Text style={styles.docMeta}>Last updated: 10/05/2025</Text>
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available': return Colors.status.success;
    case 'low_stock': return Colors.status.warning;
    case 'out_of_stock': return Colors.status.error;
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
  galleryControls: {
    marginBottom: Spacing.lg,
  },
  searchInput: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.glass.regular,
    marginRight: Spacing.sm,
  },
  selectedCategoryButton: {
    backgroundColor: Colors.base.primary,
  },
  categoryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: Colors.text.primary,
  },
  viewControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  viewButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.glass.regular,
  },
  activeViewButton: {
    backgroundColor: Colors.base.primary,
  },
  viewButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
  },
  smartTagsContainer: {
    marginBottom: Spacing.lg,
  },
  smartTagsTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  smartTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  smartTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.base.primary + '20',
    borderWidth: 1,
    borderColor: Colors.base.primary,
  },
  smartTagText: {
    ...Typography.caption,
    color: Colors.base.primary,
    fontWeight: '500',
  },
  galleryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.glass.regular,
  },
  actionButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  galleryContent: {
    gap: Spacing.md,
  },
  mediaItem: {
    padding: Spacing.md,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  mediaInfo: {
    gap: Spacing.xs,
  },
  mediaTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  mediaDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  mediaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  mediaTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.glass.thin,
  },
  mediaTagText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  mediaMeta: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  inventoryList: {
    gap: Spacing.md,
  },
  inventoryItem: {
    padding: Spacing.lg,
  },
  lowStockItem: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
  },
  outOfStockItem: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.error,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inventoryName: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  inventoryDetails: {
    gap: Spacing.xs,
  },
  inventoryCategory: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  inventoryQuantity: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  inventoryUpdated: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  lowStockAlert: {
    backgroundColor: Colors.status.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  lowStockTitle: {
    ...Typography.bodyLarge,
    color: Colors.status.warning,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  lowStockText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  documentationList: {
    gap: Spacing.md,
  },
  docItem: {
    padding: Spacing.lg,
  },
  docTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  docDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  docMeta: {
    ...Typography.caption,
    color: Colors.text.secondary,
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

export default BuildingResourcesTab;
