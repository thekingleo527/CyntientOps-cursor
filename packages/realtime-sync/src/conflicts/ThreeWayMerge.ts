/**
 * @cyntientops/realtime-sync
 * 
 * Three-Way Merge Service
 * Purpose: Advanced conflict resolution using 3-way merge algorithm
 * Features: Smart merge strategies, field-level conflict detection, array merging
 */

import { Conflict, DataRecord, ConflictResolution } from './ConflictDetector';

export interface MergeResult {
  success: boolean;
  mergedData?: any;
  remainingConflicts?: Array<{
    field: string;
    localValue: any;
    serverValue: any;
    ancestorValue?: any;
  }>;
  error?: string;
}

export class ThreeWayMergeService {
  /**
   * Perform 3-way merge on conflicting records
   */
  merge(conflict: Conflict): MergeResult {
    if (conflict.type !== 'update_update') {
      return {
        success: false,
        error: 'Three-way merge only applies to update-update conflicts',
      };
    }

    if (!conflict.commonAncestor) {
      // Fallback to 2-way merge
      return this.twoWayMerge(conflict);
    }

    try {
      const merged = this.performThreeWayMerge(
        conflict.localVersion.data,
        conflict.serverVersion.data,
        conflict.commonAncestor.data
      );

      return merged;
    } catch (error: any) {
      console.error('[ThreeWayMerge] Merge failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Core 3-way merge algorithm
   */
  private performThreeWayMerge(
    local: any,
    server: any,
    ancestor: any
  ): MergeResult {
    const mergedData: any = { ...ancestor };
    const conflicts: MergeResult['remainingConflicts'] = [];

    // Get all unique keys
    const allKeys = new Set([
      ...Object.keys(local),
      ...Object.keys(server),
      ...Object.keys(ancestor),
    ]);

    for (const key of allKeys) {
      const localValue = local[key];
      const serverValue = server[key];
      const ancestorValue = ancestor[key];

      // Skip internal fields
      if (key === 'id' || key === 'version' || key === 'lastModified') {
        continue;
      }

      // Case 1: Both unchanged from ancestor - keep ancestor
      if (this.valuesEqual(localValue, ancestorValue) &&
          this.valuesEqual(serverValue, ancestorValue)) {
        mergedData[key] = ancestorValue;
        continue;
      }

      // Case 2: Local changed, server unchanged - use local
      if (!this.valuesEqual(localValue, ancestorValue) &&
          this.valuesEqual(serverValue, ancestorValue)) {
        mergedData[key] = localValue;
        continue;
      }

      // Case 3: Server changed, local unchanged - use server
      if (this.valuesEqual(localValue, ancestorValue) &&
          !this.valuesEqual(serverValue, ancestorValue)) {
        mergedData[key] = serverValue;
        continue;
      }

      // Case 4: Both changed identically - use either
      if (this.valuesEqual(localValue, serverValue)) {
        mergedData[key] = localValue;
        continue;
      }

      // Case 5: Both changed differently - CONFLICT
      // Try smart merge strategies
      const smartMerge = this.attemptSmartMerge(
        key,
        localValue,
        serverValue,
        ancestorValue
      );

      if (smartMerge.success) {
        mergedData[key] = smartMerge.value;
      } else {
        // Cannot auto-merge - flag for manual resolution
        conflicts.push({
          field: key,
          localValue,
          serverValue,
          ancestorValue,
        });

        // Default: prefer server version (configurable)
        mergedData[key] = serverValue;
      }
    }

    return {
      success: conflicts.length === 0,
      mergedData,
      remainingConflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  /**
   * Attempt smart merge strategies for specific data types
   */
  private attemptSmartMerge(
    field: string,
    localValue: any,
    serverValue: any,
    ancestorValue: any
  ): { success: boolean; value?: any } {
    // Strategy 1: Array merge (union)
    if (Array.isArray(localValue) && Array.isArray(serverValue)) {
      const ancestorArray = Array.isArray(ancestorValue) ? ancestorValue : [];
      const merged = this.mergeArrays(localValue, serverValue, ancestorArray);
      return { success: true, value: merged };
    }

    // Strategy 2: Numeric merge (prefer larger value)
    if (typeof localValue === 'number' && typeof serverValue === 'number') {
      // For certain fields like counts, prefer the sum
      if (field.includes('count') || field.includes('total')) {
        const ancestorNum = typeof ancestorValue === 'number' ? ancestorValue : 0;
        const localDiff = localValue - ancestorNum;
        const serverDiff = serverValue - ancestorNum;
        return { success: true, value: ancestorNum + localDiff + serverDiff };
      }

      // Otherwise prefer larger value
      return { success: true, value: Math.max(localValue, serverValue) };
    }

    // Strategy 3: Timestamp merge (prefer more recent)
    if (field.includes('timestamp') || field.includes('date') || field.includes('time')) {
      return { success: true, value: Math.max(localValue, serverValue) };
    }

    // Strategy 4: Boolean merge (prefer true for certain fields)
    if (typeof localValue === 'boolean' && typeof serverValue === 'boolean') {
      if (field.includes('completed') || field.includes('verified') || field.includes('approved')) {
        return { success: true, value: localValue || serverValue };
      }
    }

    // Strategy 5: Object merge (recursive)
    if (typeof localValue === 'object' && typeof serverValue === 'object' &&
        localValue !== null && serverValue !== null &&
        !Array.isArray(localValue) && !Array.isArray(serverValue)) {
      const merged = this.performThreeWayMerge(
        localValue,
        serverValue,
        ancestorValue || {}
      );
      if (merged.success) {
        return { success: true, value: merged.mergedData };
      }
    }

    return { success: false };
  }

  /**
   * Merge arrays using set operations
   */
  private mergeArrays(local: any[], server: any[], ancestor: any[]): any[] {
    // Elements added locally
    const localAdded = local.filter(item => !this.arrayIncludes(ancestor, item));

    // Elements added on server
    const serverAdded = server.filter(item => !this.arrayIncludes(ancestor, item));

    // Elements removed locally
    const localRemoved = ancestor.filter(item => !this.arrayIncludes(local, item));

    // Start with server version
    let merged = [...server];

    // Add local additions
    for (const item of localAdded) {
      if (!this.arrayIncludes(merged, item)) {
        merged.push(item);
      }
    }

    // Remove items that were removed locally
    merged = merged.filter(item => !this.arrayIncludes(localRemoved, item));

    return merged;
  }

  /**
   * Two-way merge fallback (no ancestor available)
   */
  private twoWayMerge(conflict: Conflict): MergeResult {
    const local = conflict.localVersion.data;
    const server = conflict.serverVersion.data;

    // Simple strategy: prefer newer timestamp
    if (conflict.localVersion.lastModified > conflict.serverVersion.lastModified) {
      return {
        success: true,
        mergedData: local,
      };
    } else {
      return {
        success: true,
        mergedData: server,
      };
    }
  }

  /**
   * Deep equality check
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.valuesEqual(val, b[idx]));
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.valuesEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Check if array includes value (deep comparison)
   */
  private arrayIncludes(array: any[], value: any): boolean {
    return array.some(item => this.valuesEqual(item, value));
  }
}
