/**
 * @cyntientops/ui-components
 * 
 * Map Clustering Hook
 * Purpose: Performance-optimized hook for map clustering with debounced updates
 * Features: Debounced cluster updates, automatic initialization, cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import MapClusteringService, { BuildingMarker, ClusteredMarker } from '../services/MapClusteringService';

export const useMapClustering = (buildings: BuildingMarker[]) => {
  const [clusters, setClusters] = useState<ClusteredMarker[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize clustering
  useEffect(() => {
    if (buildings && buildings.length > 0) {
      MapClusteringService.initialize(buildings);
    }
  }, [buildings]);

  // Debounced cluster update (improves performance during pan/zoom)
  const updateClusters = useCallback((region: any) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (MapClusteringService.isInitialized()) {
        const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
        const newClusters = MapClusteringService.getClusters(region, zoom);
        setClusters(newClusters);
      }
    }, 100); // 100ms debounce
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    clusters,
    updateClusters,
    isInitialized: MapClusteringService.isInitialized(),
  };
};
