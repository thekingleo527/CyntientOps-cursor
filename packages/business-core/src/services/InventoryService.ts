/**
 * 📦 Inventory Service
 * Purpose: Manage building supplies, stock levels, and supply requests
 */

import { DatabaseManager } from '@cyntientops/database';
import { Logger } from './LoggingService';
import { OperationalDataService } from './OperationalDataService';

export interface InventoryItem {
  id: string;
  buildingId: string;
  name: string;
  category: 'cleaning' | 'maintenance' | 'safety' | 'office' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  location: string;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyRequest {
  id: string;
  buildingId: string;
  workerId: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }[];
  status: 'pending' | 'approved' | 'ordered' | 'delivered' | 'rejected';
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface InventoryUsage {
  id: string;
  itemId: string;
  buildingId: string;
  workerId: string;
  quantityUsed: number;
  taskId?: string;
  date: string;
  notes?: string;
}

export class InventoryService {
  private static instance: InventoryService;
  private database: DatabaseManager;

  private constructor(database: DatabaseManager) {
    this.database = database;
  }

  public static getInstance(database: DatabaseManager): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService(database);
    }
    return InventoryService.instance;
  }

  /**
   * Create a supply request
   */
  async createSupplyRequest(request: Omit<SupplyRequest, 'id' | 'status' | 'requestedAt'>): Promise<string> {
    const requestId = this.generateRequestId();
    const now = new Date().toISOString();

    const supplyRequest: SupplyRequest = {
      ...request,
      id: requestId,
      status: 'pending',
      requestedAt: now,
    };

    Logger.debug('Creating supply request:', undefined, 'InventoryService');
    return requestId;
  }

  /**
   * Get inventory for a building
   */
  async getInventory(buildingId: string): Promise<InventoryItem[]> {
    Logger.debug('Fetching inventory for building:', undefined, 'InventoryService');

    // Ensure operational data is available for light intelligence
    const ops = OperationalDataService.getInstance();
    try { await ops.initialize(); } catch { /* TODO: Implement */ }

    const b = ops.getBuildingById(buildingId);
    const sf = b?.squareFootage || 0;
    const clientId = b?.client_id || b?.clientId;

    // Intelligence: detect carpets/mats from routines
    const tasks = ops.getTasksForBuilding(buildingId) || [];
    const hasCarpetsOrMats = tasks.some((t: any) => {
      const s = `${t.title || t.name || ''}`.toLowerCase();
      return s.includes('carpet') || s.includes('mat');
    });

    // Intelligence: bathrooms for these buildings (per requirements)
    const bathroomBuildings = new Set<string>(['1', '3', '10']); // 12 W 18th, 135-139 W 17th, 131 Perry
    const hasBathrooms = bathroomBuildings.has(String(buildingId));

    const bagSize = sf > 12000 ? '65 gal' : '55 gal';
    const now = new Date().toISOString();
    const closet = 'Supply Closet A';
    const makeId = (slug: string) => `inv_${buildingId}_${slug}`;
    const item = (
      name: string,
      category: InventoryItem['category'],
      quantity: number,
      unit: string,
      min: number,
      max: number,
      loc = closet
    ): InventoryItem => ({
      id: makeId(name.toLowerCase().replace(/[^a-z0-9]+/g, '_')),
      buildingId,
      name,
      category,
      quantity,
      unit,
      minThreshold: min,
      maxThreshold: max,
      location: loc,
      lastRestocked: now,
      createdAt: now,
      updatedAt: now,
    });

    const items: InventoryItem[] = [];

    // Core list (as requested)
    items.push(item('Black Nitrile Gloves', 'safety', 4, 'boxes', 2, 12));
    items.push(item('Paper Towels', 'cleaning', 24, 'rolls', 12, 48));
    items.push(item('Windex (Glass Cleaner)', 'cleaning', 6, 'bottles', 3, 18));
    items.push(item('Fantastik Spray (All‑Purpose)', 'cleaning', 6, 'bottles', 3, 18));
    items.push(item('Cherry Deodorant Floor Cleaner (5 gal)', 'cleaning', 1, 'pail', 1, 4));
    items.push(item(`Black Garbage Bags (${bagSize})`, 'cleaning', 120, 'bags', 60, 240));
    items.push(item(`Clear Bags (${bagSize})`, 'cleaning', 80, 'bags', 40, 200));
    items.push(item('TimeMist Air Freshener Spray', 'cleaning', 8, 'cans', 4, 16));

    // Conditional items
    if (hasCarpetsOrMats) {
      items.push(item('Resolve Carpet Spray', 'cleaning', 4, 'bottles', 2, 8));
    }
    if (hasBathrooms) {
      // Use larger baseline for toilet paper
      items.push(item('Toilet Paper', 'cleaning', 96, 'rolls', 48, 192));
    }

    return items;
  }

  /**
   * Get inventory usage for a building
   */
  async getInventoryUsage(buildingId: string, days: number = 30): Promise<InventoryUsage[]> {
    Logger.debug('Fetching inventory usage for building:', undefined, 'InventoryService');
    return [];
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(buildingId: string): Promise<InventoryItem[]> {
    Logger.debug('Fetching low stock alerts for building:', undefined, 'InventoryService');

    const inventory = await this.getInventory(buildingId);
    return inventory.filter(item => item.quantity <= item.minThreshold);
  }

  /**
   * Record inventory usage
   */
  async recordUsage(usage: Omit<InventoryUsage, 'id' | 'date'>): Promise<string> {
    const usageId = this.generateUsageId();
    const now = new Date().toISOString();

    const inventoryUsage: InventoryUsage = {
      ...usage,
      id: usageId,
      date: now,
    };

    Logger.debug('Recording inventory usage:', undefined, 'InventoryService');
    return usageId;
  }

  /**
   * Update inventory quantity
   */
  async updateQuantity(itemId: string, quantity: number): Promise<boolean> {
    Logger.debug('Updating inventory item:', undefined, 'InventoryService');
    return true;
  }

  /**
   * Get supply requests for a building
   */
  async getSupplyRequests(buildingId: string): Promise<SupplyRequest[]> {
    Logger.debug('Fetching supply requests for building:', undefined, 'InventoryService');
    return [];
  }

  /**
   * Update supply request status
   */
  async updateRequestStatus(requestId: string, status: SupplyRequest['status']): Promise<boolean> {
    Logger.debug('Updating supply request:', undefined, 'InventoryService');
    return true;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUsageId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default InventoryService;
