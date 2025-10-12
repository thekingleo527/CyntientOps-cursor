/**
 * 🏢 Building Resources Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingResourcesTab.swift
 * Purpose: Inventory management, stock levels, and resource tracking
 *
 * 📦 Resources: Inventory, supplies, and related actions
 * ✅ Uses InventoryService + database integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { InventoryService } from '@cyntientops/business-core';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  lastRestocked?: Date;
  location?: string;
}

interface BuildingResourcesTabProps {
  buildingId: string;
  buildingName: string;
}

export const BuildingResourcesTab: React.FC<BuildingResourcesTabProps> = ({
  buildingId,
  buildingName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [itemsByCategory, setItemsByCategory] = useState<Map<string, InventoryItem[]>>(
    new Map()
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoadError(null);
      const inventoryService = InventoryService.getInstance();
      const allItems = await inventoryService.getInventoryForBuilding(buildingId);

      // Group items by category
      const grouped = new Map<string, InventoryItem[]>();
      allItems.forEach((item: any) => {
        const category = item.category || 'other';
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }
        grouped.get(category)!.push({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          minThreshold: item.minThreshold || 0,
          unit: item.unit || 'units',
          lastRestocked: item.lastRestocked ? new Date(item.lastRestocked) : undefined,
          location: item.location,
        });
      });

      setItemsByCategory(grouped);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setLoadError(String(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [buildingId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInventory();
  }, [loadInventory]);

  const getSortedCategories = (): string[] => {
    return Array.from(itemsByCategory.keys()).sort();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load inventory</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
      </View>
    );
  }

  if (itemsByCategory.size === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No inventory items found</Text>
        <Text style={styles.emptyMessage}>
          Add items or sync data to populate resources.
        </Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Building Resources</Text>
          <Text style={styles.headerSubtitle}>{buildingName}</Text>
        </View>

        {getSortedCategories().map((category) => {
          const items = itemsByCategory.get(category) || [];
          return (
            <InventoryCategoryCard
              key={category}
              category={category}
              items={items}
              buildingId={buildingId}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

const InventoryCategoryCard: React.FC<{
  category: string;
  items: InventoryItem[];
  buildingId: string;
}> = ({ category, items }) => {
  const lowStockItems = items.filter((item) => item.quantity <= item.minThreshold);

  return (
    <GlassCard
      intensity={GlassIntensity.THIN}
      cornerRadius={CornerRadius.MEDIUM}
      style={styles.categoryCard}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{items.length} items</Text>
        </View>
      </View>

      {lowStockItems.length > 0 && (
        <View style={styles.lowStockAlert}>
          <Text style={styles.lowStockIcon}>⚠️</Text>
          <Text style={styles.lowStockText}>
            {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} low
            on stock
          </Text>
        </View>
      )}

      <View style={styles.itemList}>
        {items.map((item) => (
          <InventoryItemRow key={item.id} item={item} />
        ))}
      </View>
    </GlassCard>
  );
};

const InventoryItemRow: React.FC<{ item: InventoryItem }> = ({ item }) => {
  const isLowStock = item.quantity <= item.minThreshold;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.location && (
          <Text style={styles.itemLocation}>📍 {item.location}</Text>
        )}
      </View>
      <View style={styles.itemQuantity}>
        <Text
          style={[
            styles.itemQuantityText,
            isLowStock && styles.itemQuantityLow,
          ]}
        >
          {item.quantity} {item.unit}
        </Text>
        {isLowStock && (
          <Text style={styles.itemThreshold}>Min: {item.minThreshold}</Text>
        )}
      </View>
    </View>
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
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  categoryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.info + '33',
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: '600',
  },
  lowStockAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.warning + '20',
    marginBottom: Spacing.md,
  },
  lowStockIcon: {
    fontSize: 16,
  },
  lowStockText: {
    ...Typography.bodyMedium,
    color: Colors.warning,
    fontWeight: '600',
  },
  itemList: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemLocation: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  itemQuantityText: {
    ...Typography.bodyMedium,
    color: Colors.success,
    fontWeight: '600',
  },
  itemQuantityLow: {
    color: Colors.error,
  },
  itemThreshold: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});

export default BuildingResourcesTab;
