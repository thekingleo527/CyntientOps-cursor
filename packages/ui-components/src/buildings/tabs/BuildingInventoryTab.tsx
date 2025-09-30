/**
 * 📦 Building Inventory Tab
 * Mirrors: SwiftUI BuildingDetailView Inventory tab functionality
 * Purpose: Inventory management, stock tracking, and low stock alerts
 * Features: Inventory items, stock levels, reorder alerts, cost tracking
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
  RefreshControl
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingInventoryTabProps {
  inventory: any[];
  buildingId: string;
  container: ServiceContainer;
  onInventoryPress?: (item: any) => void;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'cleaning' | 'maintenance' | 'safety' | 'office' | 'tools';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  cost: number;
  location: string;
  lastUpdated: Date;
  supplier?: string;
  notes?: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categoriesCount: number;
  reorderNeeded: number;
}

export const BuildingInventoryTab: React.FC<BuildingInventoryTabProps> = ({
  inventory,
  buildingId,
  container,
  onInventoryPress
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    categoriesCount: 0,
    reorderNeeded: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'cleaning' | 'maintenance' | 'safety' | 'office' | 'tools'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out' | 'normal'>('all');

  useEffect(() => {
    loadInventoryData();
  }, [buildingId]);

  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      const items = await generateInventoryItems(buildingId);
      setInventoryItems(items);
      calculateInventoryStats(items);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInventoryItems = async (buildingId: string): Promise<InventoryItem[]> => {
    const buildingInventory = {
      '1': [ // 12 West 18th Street
        {
          id: 'inv_1_1',
          name: 'All-Purpose Cleaner',
          category: 'cleaning' as const,
          currentStock: 5,
          minimumStock: 10,
          maximumStock: 50,
          unit: 'bottles',
          cost: 8.99,
          location: 'Storage Room A',
          lastUpdated: new Date(),
          supplier: 'Cleaning Supplies Co',
          notes: 'Primary cleaning solution'
        },
        {
          id: 'inv_1_2',
          name: 'Trash Bags (Large)',
          category: 'cleaning' as const,
          currentStock: 2,
          minimumStock: 20,
          maximumStock: 100,
          unit: 'rolls',
          cost: 12.50,
          location: 'Storage Room A',
          lastUpdated: new Date(),
          supplier: 'Waste Management Inc',
          notes: 'Low stock - reorder needed'
        },
        {
          id: 'inv_1_3',
          name: 'Safety Gloves',
          category: 'safety' as const,
          currentStock: 0,
          minimumStock: 5,
          maximumStock: 25,
          unit: 'pairs',
          cost: 15.99,
          location: 'Safety Cabinet',
          lastUpdated: new Date(),
          supplier: 'Safety First Supply',
          notes: 'Out of stock - urgent reorder'
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'inv_4_1',
          name: 'Museum-Grade Cleaner',
          category: 'cleaning' as const,
          currentStock: 8,
          minimumStock: 5,
          maximumStock: 30,
          unit: 'bottles',
          cost: 25.99,
          location: 'Museum Storage',
          lastUpdated: new Date(),
          supplier: 'Museum Supplies Pro',
          notes: 'Specialized for artifact areas'
        },
        {
          id: 'inv_4_2',
          name: 'Microfiber Cloths',
          category: 'cleaning' as const,
          currentStock: 15,
          minimumStock: 10,
          maximumStock: 50,
          unit: 'pieces',
          cost: 3.99,
          location: 'Museum Storage',
          lastUpdated: new Date(),
          supplier: 'Cleaning Supplies Co',
          notes: 'For delicate surfaces'
        }
      ]
    };

    return buildingInventory[buildingId as keyof typeof buildingInventory] || [];
  };

  const calculateInventoryStats = (items: InventoryItem[]) => {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.currentStock <= item.minimumStock && item.currentStock > 0).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);
    const categoriesCount = new Set(items.map(item => item.category)).size;
    const reorderNeeded = items.filter(item => item.currentStock <= item.minimumStock).length;

    setInventoryStats({
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      categoriesCount,
      reorderNeeded
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInventoryData();
    setIsRefreshing(false);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out';
    if (item.currentStock <= item.minimumStock) return 'low';
    return 'normal';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'out': return Colors.critical;
      case 'low': return Colors.warning;
      case 'normal': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'safety': return '🛡️';
      case 'office': return '📋';
      case 'tools': return '🔨';
      default: return '📦';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderInventoryItem = (item: InventoryItem) => {
    const stockStatus = getStockStatus(item);
    const stockColor = getStockColor(stockStatus);
    const isSelected = selectedItem?.id === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          setSelectedItem(item);
          onInventoryPress?.(item);
        }}
      >
        <GlassCard 
          style={[
            styles.itemCard,
            stockStatus === 'out' && styles.outOfStockCard,
            isSelected && styles.selectedItemCard
          ]} 
          intensity={GlassIntensity.REGULAR} 
          cornerRadius={CornerRadius.CARD}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemLocation}>📍 {item.location}</Text>
              </View>
            </View>
            
            <View style={styles.itemHeaderRight}>
              <View style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}>
                <Text style={[styles.stockText, { color: stockColor }]}>
                  {stockStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Current Stock</Text>
                <Text style={[styles.metaValue, { color: stockColor }]}>
                  {item.currentStock} {item.unit}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Minimum</Text>
                <Text style={styles.metaValue}>
                  {item.minimumStock} {item.unit}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Maximum</Text>
                <Text style={styles.metaValue}>
                  {item.maximumStock} {item.unit}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Unit Cost</Text>
                <Text style={styles.metaValue}>
                  {formatCurrency(item.cost)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Total Value</Text>
                <Text style={styles.metaValue}>
                  {formatCurrency(item.currentStock * item.cost)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          {stockStatus === 'out' && (
            <View style={styles.outOfStockWarning}>
              <Text style={styles.outOfStockText}>🚨 OUT OF STOCK - URGENT REORDER NEEDED</Text>
            </View>
          )}

          {stockStatus === 'low' && (
            <View style={styles.lowStockWarning}>
              <Text style={styles.lowStockText}>⚠️ Low stock - reorder recommended</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    return (
      <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.statsTitle}>Inventory Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inventoryStats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{inventoryStats.lowStockItems}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.critical }]}>{inventoryStats.outOfStockItems}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primaryAction }]}>
              {formatCurrency(inventoryStats.totalValue)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{inventoryStats.categoriesCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{inventoryStats.reorderNeeded}</Text>
            <Text style={styles.statLabel}>Reorder Needed</Text>
          </View>
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
            {['all', 'cleaning', 'maintenance', 'safety', 'office', 'tools'].map(category => (
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
          <Text style={styles.filterLabel}>Stock Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'normal', 'low', 'out'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filterStock === status && styles.filterOptionSelected
                ]}
                onPress={() => setFilterStock(status as any)}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStock === status && styles.filterOptionTextSelected
                ]}>
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </GlassCard>
    );
  };

  const filteredItems = inventoryItems.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const stockMatch = filterStock === 'all' || getStockStatus(item) === filterStock;
    return categoryMatch && stockMatch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading inventory data...</Text>
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
          <Text style={styles.headerTitle}>📦 Inventory Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} inventory item{filteredItems.length !== 1 ? 's' : ''} for building {buildingId}
          </Text>
        </View>

        {renderStats()}
        {renderFilters()}

        <View style={styles.itemsContainer}>
          {filteredItems.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyTitle}>No Inventory Items</Text>
              <Text style={styles.emptyDescription}>
                No inventory items match the current filters.
              </Text>
            </GlassCard>
          ) : (
            filteredItems.map(renderInventoryItem)
          )}
        </View>
      </ScrollView>
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
  itemsContainer: {
    marginBottom: Spacing.lg,
  },
  itemCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  outOfStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: Colors.primaryAction,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemLocation: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  itemHeaderRight: {
    marginLeft: Spacing.sm,
  },
  stockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  stockText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  itemMeta: {
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
  outOfStockWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.critical + '20',
    borderRadius: 6,
  },
  outOfStockText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lowStockWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warning + '20',
    borderRadius: 6,
  },
  lowStockText: {
    ...Typography.caption,
    color: Colors.warning,
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
});

export default BuildingInventoryTab;