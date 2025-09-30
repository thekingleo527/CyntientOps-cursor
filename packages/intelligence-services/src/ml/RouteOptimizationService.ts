/**
 * @cyntientops/intelligence-services
 * 
 * Route Optimization Service
 * Purpose: Advanced route optimization using TSP algorithms for worker efficiency
 * Features: TSP solving, multi-worker assignment, time windows, map integration
 */

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  priority: number;
  estimatedDuration: number; // minutes
  timeWindow?: {
    start: number; // timestamp
    end: number;   // timestamp
  };
}

export interface OptimizedRoute {
  workerId: string;
  workerName: string;
  locations: Location[];
  totalDistance: number; // meters
  totalDuration: number; // minutes
  totalTravelTime: number; // minutes
  startTime: number;
  endTime: number;
  efficiency: number; // 0-1 score
  mapPolyline: string; // Encoded polyline for map display
}

export interface RouteOptimizationOptions {
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
  startTime?: number;
  maxLocations?: number;
  prioritizeUrgent?: boolean;
  avoidTraffic?: boolean;
}

export class RouteOptimizationService {
  private db: any; // DatabaseManager

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Optimize route using Traveling Salesman Problem (TSP) algorithm
   * Using Nearest Neighbor with 2-opt improvements
   */
  async optimizeRoute(
    workerId: string,
    locations: Location[],
    options: RouteOptimizationOptions = {}
  ): Promise<OptimizedRoute> {
    console.log(`[RouteOptimization] Optimizing route for ${locations.length} locations`);

    if (locations.length === 0) {
      throw new Error('No locations to optimize');
    }

    if (locations.length === 1) {
      // Single location - no optimization needed
      return this.createSingleLocationRoute(workerId, locations[0], options);
    }

    // Get worker data
    const workerData = await this.getWorkerData(workerId);

    // Get start location (worker's current location or specified)
    const startLocation = options.startLocation || {
      latitude: workerData.last_latitude,
      longitude: workerData.last_longitude,
    };

    // Step 1: Build distance matrix
    const distanceMatrix = await this.buildDistanceMatrix([startLocation, ...locations]);

    // Step 2: Apply TSP algorithm
    let route: number[];

    if (locations.length <= 10) {
      // For small problems, use more accurate algorithm
      route = this.solveTSPNearestNeighbor(distanceMatrix);
      route = this.improve2Opt(route, distanceMatrix);
    } else {
      // For larger problems, use fast greedy algorithm
      route = this.solveTSPGreedy(distanceMatrix);
    }

    // Step 3: Convert indices to locations
    const orderedLocations = route
      .slice(1) // Skip start location
      .map(idx => locations[idx - 1]); // Adjust for start location offset

    // Step 4: Calculate route metrics
    const metrics = this.calculateRouteMetrics(
      startLocation,
      orderedLocations,
      distanceMatrix,
      route
    );

    // Step 5: Apply time window constraints
    const scheduledRoute = this.applyTimeWindows(orderedLocations, options.startTime || Date.now());

    // Step 6: Generate map polyline
    const mapPolyline = this.generatePolyline(startLocation, scheduledRoute);

    return {
      workerId,
      workerName: workerData.name,
      locations: scheduledRoute,
      totalDistance: metrics.totalDistance,
      totalDuration: metrics.totalDuration,
      totalTravelTime: metrics.totalTravelTime,
      startTime: options.startTime || Date.now(),
      endTime: (options.startTime || Date.now()) + metrics.totalDuration * 60000,
      efficiency: this.calculateEfficiency(route, distanceMatrix),
      mapPolyline,
    };
  }

  /**
   * Build distance matrix between all locations
   */
  private async buildDistanceMatrix(
    locations: Array<{ latitude: number; longitude: number }>
  ): Promise<number[][]> {
    const n = locations.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.calculateDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }

    return matrix;
  }

  /**
   * Solve TSP using Nearest Neighbor heuristic
   */
  private solveTSPNearestNeighbor(distanceMatrix: number[][]): number[] {
    const n = distanceMatrix.length;
    const visited = new Set<number>();
    const route: number[] = [0]; // Start at depot (index 0)
    visited.add(0);

    let current = 0;

    while (visited.size < n) {
      let nearest = -1;
      let minDistance = Infinity;

      // Find nearest unvisited node
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && distanceMatrix[current][i] < minDistance) {
          nearest = i;
          minDistance = distanceMatrix[current][i];
        }
      }

      if (nearest === -1) break;

      route.push(nearest);
      visited.add(nearest);
      current = nearest;
    }

    return route;
  }

  /**
   * Improve route using 2-opt algorithm
   */
  private improve2Opt(route: number[], distanceMatrix: number[][]): number[] {
    let improved = true;
    let bestRoute = [...route];

    while (improved) {
      improved = false;

      for (let i = 1; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          // Try reversing segment [i, j]
          const newRoute = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, j + 1).reverse(),
            ...bestRoute.slice(j + 1),
          ];

          const currentDistance = this.calculateTotalDistance(bestRoute, distanceMatrix);
          const newDistance = this.calculateTotalDistance(newRoute, distanceMatrix);

          if (newDistance < currentDistance) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * Solve TSP using greedy algorithm (for large problems)
   */
  private solveTSPGreedy(distanceMatrix: number[][]): number[] {
    // Same as nearest neighbor for now
    return this.solveTSPNearestNeighbor(distanceMatrix);
  }

  /**
   * Calculate total distance for route
   */
  private calculateTotalDistance(route: number[], distanceMatrix: number[][]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i]][route[i + 1]];
    }
    return total;
  }

  /**
   * Calculate route metrics
   */
  private calculateRouteMetrics(
    startLocation: any,
    locations: Location[],
    distanceMatrix: number[][],
    route: number[]
  ): {
    totalDistance: number;
    totalDuration: number;
    totalTravelTime: number;
  } {
    const totalDistance = this.calculateTotalDistance(route, distanceMatrix);

    // Calculate total task duration
    const totalTaskDuration = locations.reduce((sum, loc) => sum + loc.estimatedDuration, 0);

    // Estimate travel time (assuming 40 km/h average speed in NYC)
    const avgSpeedMps = (40 * 1000) / 3600; // meters per second
    const totalTravelTime = Math.round(totalDistance / avgSpeedMps / 60); // minutes

    const totalDuration = totalTaskDuration + totalTravelTime;

    return {
      totalDistance: Math.round(totalDistance),
      totalDuration,
      totalTravelTime,
    };
  }

  /**
   * Apply time window constraints
   */
  private applyTimeWindows(locations: Location[], startTime: number): Location[] {
    const scheduled: Location[] = [];
    let currentTime = startTime;

    for (const location of locations) {
      const scheduledLocation = { ...location };

      // Check time window
      if (location.timeWindow) {
        // If we arrive before window opens, wait
        if (currentTime < location.timeWindow.start) {
          currentTime = location.timeWindow.start;
        }

        // If we arrive after window closes, skip or reschedule
        if (currentTime > location.timeWindow.end) {
          console.warn(`[RouteOptimization] Location ${location.name} misses time window`);
          // Could implement rescheduling logic here
        }
      }

      scheduled.push(scheduledLocation);
      currentTime += location.estimatedDuration * 60000; // Convert to ms
    }

    return scheduled;
  }

  /**
   * Calculate route efficiency score
   */
  private calculateEfficiency(route: number[], distanceMatrix: number[][]): number {
    // Compare to straight-line distance
    const actualDistance = this.calculateTotalDistance(route, distanceMatrix);
    const straightLineDistance = distanceMatrix[route[0]][route[route.length - 1]];

    const efficiency = straightLineDistance / actualDistance;
    return Math.min(1, Math.max(0, efficiency));
  }

  /**
   * Generate polyline for map display
   */
  private generatePolyline(
    startLocation: any,
    locations: Location[]
  ): string {
    // Simplified polyline encoding
    const points = [startLocation, ...locations];
    return points
      .map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
      .join('|');
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get worker data
   */
  private async getWorkerData(workerId: string): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT * FROM workers WHERE id = ?`,
      [workerId]
    );

    return result.rows.item(0);
  }

  /**
   * Create route for single location
   */
  private createSingleLocationRoute(
    workerId: string,
    location: Location,
    options: RouteOptimizationOptions
  ): OptimizedRoute {
    return {
      workerId,
      workerName: 'Worker',
      locations: [location],
      totalDistance: 0,
      totalDuration: location.estimatedDuration,
      totalTravelTime: 0,
      startTime: options.startTime || Date.now(),
      endTime: (options.startTime || Date.now()) + location.estimatedDuration * 60000,
      efficiency: 1.0,
      mapPolyline: `${location.latitude},${location.longitude}`,
    };
  }

  /**
   * Optimize routes for multiple workers (Vehicle Routing Problem)
   */
  async optimizeMultipleWorkers(
    workerIds: string[],
    locations: Location[],
    options: RouteOptimizationOptions = {}
  ): Promise<OptimizedRoute[]> {
    console.log(`[RouteOptimization] Optimizing for ${workerIds.length} workers, ${locations.length} locations`);

    // Simple clustering: assign locations to workers by proximity
    const workerLocations = await this.clusterLocationsByWorkers(workerIds, locations);

    const routes: OptimizedRoute[] = [];

    for (const workerId of workerIds) {
      const workerLocs = workerLocations.get(workerId) || [];

      if (workerLocs.length > 0) {
        const route = await this.optimizeRoute(workerId, workerLocs, options);
        routes.push(route);
      }
    }

    return routes;
  }

  /**
   * Cluster locations by workers using k-means-like approach
   */
  private async clusterLocationsByWorkers(
    workerIds: string[],
    locations: Location[]
  ): Promise<Map<string, Location[]>> {
    const assignments = new Map<string, Location[]>();

    // Get worker locations
    const workerLocations: Array<{ id: string; lat: number; lon: number }> = [];

    for (const workerId of workerIds) {
      const worker = await this.getWorkerData(workerId);
      workerLocations.push({
        id: workerId,
        lat: worker.last_latitude,
        lon: worker.last_longitude,
      });
      assignments.set(workerId, []);
    }

    // Assign each location to nearest worker
    for (const location of locations) {
      let nearestWorker = workerIds[0];
      let minDistance = Infinity;

      for (const worker of workerLocations) {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          worker.lat,
          worker.lon
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestWorker = worker.id;
        }
      }

      assignments.get(nearestWorker)!.push(location);
    }

    return assignments;
  }
}
