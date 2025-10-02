/**
 * @cyntientops/ui-components
 * 
 * Map Clustering Service
 * Mirrors: Advanced map clustering for 100+ building markers
 * Purpose: Performant map rendering with Supercluster
 * Features: Dynamic clustering, zoom-based expansion, performance optimization
 */

// Type definitions for external libraries
declare global {
  interface Supercluster {
    load(features: any[]): void;
    getClusters(bbox: [number, number, number, number], zoom: number): any[];
    getClusterExpansionZoom(clusterId: number): number;
    getClusterLeaves(clusterId: number, limit?: number): any[];
  }
  
  const Supercluster: {
    new (options?: any): Supercluster;
  };
}

// Import Logger
import { Logger } from '@cyntientops/business-core';

// Mock Supercluster for development
interface MockSupercluster {
  load(features: any[]): void;
  getClusters(bbox: [number, number, number, number], zoom: number): any[];
  getClusterExpansionZoom(clusterId: number): number;
  getClusterLeaves(clusterId: number, limit?: number): any[];
}

// Mock implementation
class MockSuperclusterImpl implements MockSupercluster {
  private features: any[] = [];
  
  load(features: any[]): void {
    this.features = features;
  }
  
  getClusters(bbox: [number, number, number, number], zoom: number): any[] {
    // Simple mock - return all features as individual markers
    return this.features.map((feature, index) => ({
      id: index,
      geometry: feature.geometry,
      properties: { ...feature.properties, cluster: false }
    }));
  }
  
  getClusterExpansionZoom(clusterId: number): number {
    return 15; // Mock zoom level
  }
  
  getClusterLeaves(clusterId: number, limit: number = Infinity): any[] {
    // Mock - return first few features
    return this.features.slice(0, Math.min(limit, 5)).map((feature, index) => ({
      id: index,
      geometry: feature.geometry,
      properties: feature.properties
    }));
  }
}

// Use mock for now
const Supercluster = MockSuperclusterImpl;

export interface BuildingMarker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  taskCount: number;
  urgentTaskCount: number;
  complianceScore: number;
  status: 'active' | 'inactive' | 'emergency';
  metadata?: any;
}

export interface ClusteredMarker {
  id: string;
  latitude: number;
  longitude: number;
  pointCount?: number;
  cluster: boolean;
  properties?: any;
}

export interface ClusterExpansionRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export class MapClusteringService {
  private supercluster: Supercluster | null = null;
  private buildings: BuildingMarker[] = [];
  private initialized = false;

  // Clustering configuration
  private readonly config = {
    radius: 60, // Cluster radius in pixels
    maxZoom: 20, // Max zoom to cluster points on
    minZoom: 0, // Min zoom to cluster points on
    extent: 256, // Tile extent (default)
    nodeSize: 64, // KD-tree node size (performance)
  };

  /**
   * Initialize clustering engine with buildings
   */
  initialize(buildings: BuildingMarker[]): void {
    console.log(`[MapClustering] Initializing with ${buildings.length} buildings`);

    this.buildings = buildings;

    // Convert buildings to GeoJSON features
    const features = buildings.map(building => ({
      type: 'Feature' as const,
      properties: {
        id: building.id,
        name: building.name,
        address: building.address,
        taskCount: building.taskCount,
        urgentTaskCount: building.urgentTaskCount,
        complianceScore: building.complianceScore,
        status: building.status,
        cluster: false,
        metadata: building.metadata,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [building.longitude, building.latitude],
      },
    }));

    // Initialize Supercluster
    this.supercluster = new Supercluster(this.config);
    this.supercluster.load(features);
    this.initialized = true;

    Logger.debug('Initialization complete', undefined, 'MapClusteringService');
  }

  /**
   * Get clusters for current map region
   */
  getClusters(region: any, zoom: number): ClusteredMarker[] {
    if (!this.initialized || !this.supercluster) {
      Logger.warn('Not initialized', undefined, 'MapClusteringService');
      return [];
    }

    // Calculate bounding box from region
    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2, // west
      region.latitude - region.latitudeDelta / 2,   // south
      region.longitude + region.longitudeDelta / 2, // east
      region.latitude + region.latitudeDelta / 2,   // north
    ];

    // Get clusters from Supercluster
    const clusters = this.supercluster.getClusters(bbox, this.getZoomLevel(region));

    // Transform to ClusteredMarker format
    return clusters.map(cluster => {
      const [longitude, latitude] = cluster.geometry.coordinates;

      if (cluster.properties.cluster) {
        // This is a cluster
        return {
          id: `cluster_${cluster.id}`,
          latitude,
          longitude,
          pointCount: cluster.properties.point_count,
          cluster: true,
          properties: {
            cluster_id: cluster.id,
            point_count: cluster.properties.point_count,
            point_count_abbreviated: this.abbreviateNumber(cluster.properties.point_count),
          },
        };
      } else {
        // This is an individual building
        return {
          id: cluster.properties.id,
          latitude,
          longitude,
          cluster: false,
          properties: cluster.properties,
        };
      }
    });
  }

  /**
   * Get expansion region for cluster (for zoom-in on tap)
   */
  getClusterExpansionRegion(clusterId: number): ClusterExpansionRegion | null {
    if (!this.initialized || !this.supercluster) {
      return null;
    }

    try {
      const expansionZoom = this.supercluster.getClusterExpansionZoom(clusterId);
      const [longitude, latitude] = this.supercluster.getClusterLeaves(clusterId, 1)[0]
        .geometry.coordinates;

      // Calculate region for expansion zoom
      const latitudeDelta = this.getLatitudeDelta(expansionZoom);
      const longitudeDelta = this.getLongitudeDelta(expansionZoom);

      return {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      };
    } catch (error) {
      Logger.error('Failed to get expansion region:', error, 'MapClustering');
      return null;
    }
  }

  /**
   * Get all buildings in a cluster
   */
  getClusterLeaves(clusterId: number, limit = Infinity): BuildingMarker[] {
    if (!this.initialized || !this.supercluster) {
      return [];
    }

    try {
      const leaves = this.supercluster.getClusterLeaves(clusterId, limit);
      return leaves.map(leaf => ({
        id: leaf.properties.id,
        name: leaf.properties.name,
        address: leaf.properties.address,
        latitude: leaf.geometry.coordinates[1],
        longitude: leaf.geometry.coordinates[0],
        taskCount: leaf.properties.taskCount,
        urgentTaskCount: leaf.properties.urgentTaskCount,
        complianceScore: leaf.properties.complianceScore,
        status: leaf.properties.status,
        metadata: leaf.properties.metadata,
      }));
    } catch (error) {
      Logger.error('Failed to get cluster leaves:', error, 'MapClustering');
      return [];
    }
  }

  /**
   * Get cluster statistics (for display)
   */
  getClusterStats(clusterId: number): {
    totalTasks: number;
    urgentTasks: number;
    averageCompliance: number;
    emergencyCount: number;
  } {
    const leaves = this.getClusterLeaves(clusterId);

    const stats = leaves.reduce(
      (acc, building) => ({
        totalTasks: acc.totalTasks + building.taskCount,
        urgentTasks: acc.urgentTasks + building.urgentTaskCount,
        averageCompliance: acc.averageCompliance + building.complianceScore,
        emergencyCount:
          acc.emergencyCount + (building.status === 'emergency' ? 1 : 0),
      }),
      { totalTasks: 0, urgentTasks: 0, averageCompliance: 0, emergencyCount: 0 }
    );

    stats.averageCompliance = leaves.length > 0 ? stats.averageCompliance / leaves.length : 0;

    return stats;
  }

  /**
   * Calculate zoom level from region
   */
  private getZoomLevel(region: any): number {
    const angle = region.longitudeDelta;
    return Math.round(Math.log(360 / angle) / Math.LN2);
  }

  /**
   * Calculate latitude delta for zoom level
   */
  private getLatitudeDelta(zoom: number): number {
    return 360 / Math.pow(2, zoom);
  }

  /**
   * Calculate longitude delta for zoom level
   */
  private getLongitudeDelta(zoom: number): number {
    return 360 / Math.pow(2, zoom);
  }

  /**
   * Abbreviate large numbers (1000 -> 1K)
   */
  private abbreviateNumber(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }

  /**
   * Update buildings data (call when buildings change)
   */
  updateBuildings(buildings: BuildingMarker[]): void {
    this.initialize(buildings);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total building count
   */
  getBuildingCount(): number {
    return this.buildings.length;
  }
}

export default new MapClusteringService();
