/**
 * 🏛️ Violation History Service
 * Comprehensive tracking of all tickets, violations, and permits for our real portfolio
 * Purpose: Historical analysis and compliance monitoring for CyntientOps buildings
 */

import { ServiceContainer } from '../ServiceContainer';
import { Logger } from '../utils/Logger';

export interface ViolationHistoryEntry {
  id: string;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  type: 'HPD_VIOLATION' | 'DSNY_VIOLATION' | 'FDNY_INSPECTION' | 'DOB_PERMIT' | '311_COMPLAINT';
  source: 'HPD' | 'DSNY' | 'FDNY' | 'DOB' | '311';
  status: 'open' | 'closed' | 'resolved' | 'pending' | 'failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  dateIssued: Date;
  dateResolved?: Date;
  dueDate?: Date;
  fineAmount?: number;
  paidAmount?: number;
  violationClass?: string;
  permitNumber?: string;
  inspectionDate?: Date;
  nextInspectionDate?: Date;
  hearingDate?: Date;
  hearingStatus?: string;
  notes?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViolationHistorySummary {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  totalViolations: number;
  openViolations: number;
  closedViolations: number;
  totalFines: number;
  paidFines: number;
  outstandingFines: number;
  complianceScore: number;
  lastUpdated: Date;
  violationBreakdown: {
    hpd: number;
    dsny: number;
    fdny: number;
    dob: number;
    complaints311: number;
  };
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class ViolationHistoryService {
  private static instance: ViolationHistoryService;
  private container: ServiceContainer;
  private historyCache: Map<string, ViolationHistoryEntry[]> = new Map();
  private summaryCache: Map<string, ViolationHistorySummary> = new Map();

  private constructor(container: ServiceContainer) {
    this.container = container;
  }

  public static getInstance(container: ServiceContainer): ViolationHistoryService {
    if (!ViolationHistoryService.instance) {
      ViolationHistoryService.instance = new ViolationHistoryService(container);
    } else {
      ViolationHistoryService.instance.container = container;
    }
    return ViolationHistoryService.instance;
  }

  /**
   * Get comprehensive violation history for a building
   */
  async getBuildingViolationHistory(buildingId: string, limit: number = 100): Promise<ViolationHistoryEntry[]> {
    try {
      const cacheKey = `history_${buildingId}`;
      
      // Check cache first
      if (this.historyCache.has(cacheKey)) {
        const cached = this.historyCache.get(cacheKey)!;
        if (cached.length > 0 && this.isCacheValid(cached[0].updatedAt)) {
          return cached.slice(0, limit);
        }
      }

      Logger.info(`Loading violation history for building ${buildingId}`, null, 'ViolationHistoryService');

      // Load all violation types in parallel
      const [hpdViolations, dsnyViolations, fdnyInspections, dobPermits, complaints311] = await Promise.allSettled([
        this.loadHPDViolations(buildingId),
        this.loadDSNYViolations(buildingId),
        this.loadFDNYInspections(buildingId),
        this.loadDOBPermits(buildingId),
        this.load311Complaints(buildingId)
      ]);

      const allViolations: ViolationHistoryEntry[] = [];

      // Process HPD violations
      if (hpdViolations.status === 'fulfilled') {
        allViolations.push(...hpdViolations.value);
      }

      // Process DSNY violations
      if (dsnyViolations.status === 'fulfilled') {
        allViolations.push(...dsnyViolations.value);
      }

      // Process FDNY inspections
      if (fdnyInspections.status === 'fulfilled') {
        allViolations.push(...fdnyInspections.value);
      }

      // Process DOB permits
      if (dobPermits.status === 'fulfilled') {
        allViolations.push(...dobPermits.value);
      }

      // Process 311 complaints
      if (complaints311.status === 'fulfilled') {
        allViolations.push(...complaints311.value);
      }

      // Sort by date (newest first)
      allViolations.sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());

      // Cache the results
      this.historyCache.set(cacheKey, allViolations);

      return allViolations.slice(0, limit);
    } catch (error) {
      Logger.error('Failed to load violation history', error, 'ViolationHistoryService');
      return [];
    }
  }

  /**
   * Get violation history summary for a building
   */
  async getBuildingViolationSummary(buildingId: string): Promise<ViolationHistorySummary | null> {
    try {
      const cacheKey = `summary_${buildingId}`;
      
      // Check cache first
      if (this.summaryCache.has(cacheKey)) {
        const cached = this.summaryCache.get(cacheKey)!;
        if (this.isCacheValid(cached.lastUpdated)) {
          return cached;
        }
      }

      const violations = await this.getBuildingViolationHistory(buildingId);
      if (violations.length === 0) {
        return null;
      }

      // Get building info
      const building = await this.getBuildingInfo(buildingId);
      if (!building) {
        return null;
      }

      // Calculate summary statistics
      const summary: ViolationHistorySummary = {
        buildingId,
        buildingName: building.name,
        buildingAddress: building.address,
        totalViolations: violations.length,
        openViolations: violations.filter(v => v.status === 'open' || v.status === 'pending').length,
        closedViolations: violations.filter(v => v.status === 'closed' || v.status === 'resolved').length,
        totalFines: violations.reduce((sum, v) => sum + (v.fineAmount || 0), 0),
        paidFines: violations.reduce((sum, v) => sum + (v.paidAmount || 0), 0),
        outstandingFines: violations.reduce((sum, v) => {
          if (v.status === 'open' || v.status === 'pending') {
            return sum + (v.fineAmount || 0) - (v.paidAmount || 0);
          }
          return sum;
        }, 0),
        complianceScore: this.calculateComplianceScore(violations),
        lastUpdated: new Date(),
        violationBreakdown: {
          hpd: violations.filter(v => v.type === 'HPD_VIOLATION').length,
          dsny: violations.filter(v => v.type === 'DSNY_VIOLATION').length,
          fdny: violations.filter(v => v.type === 'FDNY_INSPECTION').length,
          dob: violations.filter(v => v.type === 'DOB_PERMIT').length,
          complaints311: violations.filter(v => v.type === '311_COMPLAINT').length
        },
        severityBreakdown: {
          critical: violations.filter(v => v.severity === 'critical').length,
          high: violations.filter(v => v.severity === 'high').length,
          medium: violations.filter(v => v.severity === 'medium').length,
          low: violations.filter(v => v.severity === 'low').length
        }
      };

      // Cache the summary
      this.summaryCache.set(cacheKey, summary);

      return summary;
    } catch (error) {
      Logger.error('Failed to generate violation summary', error, 'ViolationHistoryService');
      return null;
    }
  }

  /**
   * Get violation history for all buildings in portfolio
   */
  async getAllBuildingsViolationHistory(): Promise<Map<string, ViolationHistorySummary>> {
    try {
      const buildings = await this.getAllBuildings();
      const summaries = new Map<string, ViolationHistorySummary>();

      // Process buildings in parallel with rate limiting
      const promises = buildings.map(async (building, index) => {
        // Add small delay to respect rate limits
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const summary = await this.getBuildingViolationSummary(building.id);
        if (summary) {
          summaries.set(building.id, summary);
        }
      });

      await Promise.all(promises);
      return summaries;
    } catch (error) {
      Logger.error('Failed to load all buildings violation history', error, 'ViolationHistoryService');
      return new Map();
    }
  }

  /**
   * Search violation history across all buildings
   */
  async searchViolationHistory(query: string, filters?: {
    buildingIds?: string[];
    types?: string[];
    statuses?: string[];
    severity?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<ViolationHistoryEntry[]> {
    try {
      const allViolations: ViolationHistoryEntry[] = [];
      const buildings = filters?.buildingIds || (await this.getAllBuildings()).map(b => b.id);

      // Load violations for specified buildings
      for (const buildingId of buildings) {
        const violations = await this.getBuildingViolationHistory(buildingId);
        allViolations.push(...violations);
      }

      // Apply filters
      let filtered = allViolations;

      if (query) {
        const searchTerm = query.toLowerCase();
        filtered = filtered.filter(v => 
          v.title.toLowerCase().includes(searchTerm) ||
          v.description.toLowerCase().includes(searchTerm) ||
          v.buildingName.toLowerCase().includes(searchTerm) ||
          v.buildingAddress.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.types && filters.types.length > 0) {
        filtered = filtered.filter(v => filters.types!.includes(v.type));
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        filtered = filtered.filter(v => filters.statuses!.includes(v.status));
      }

      if (filters?.severity && filters.severity.length > 0) {
        filtered = filtered.filter(v => filters.severity!.includes(v.severity));
      }

      if (filters?.dateRange) {
        filtered = filtered.filter(v => 
          v.dateIssued >= filters.dateRange!.start && 
          v.dateIssued <= filters.dateRange!.end
        );
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());

      return filtered;
    } catch (error) {
      Logger.error('Failed to search violation history', error, 'ViolationHistoryService');
      return [];
    }
  }

  // Private helper methods

  private async loadHPDViolations(buildingId: string): Promise<ViolationHistoryEntry[]> {
    try {
      const building = await this.getBuildingInfo(buildingId);
      if (!building) return [];

      const violations = await this.container.apiClients.hpd.getBuildingViolations(buildingId);
      
      return violations.map((violation: any) => ({
        id: `hpd_${violation.violationid}`,
        buildingId,
        buildingName: building.name,
        buildingAddress: building.address,
        type: 'HPD_VIOLATION' as const,
        source: 'HPD' as const,
        status: violation.currentstatus === 'OPEN' ? 'open' : 'closed',
        severity: this.mapHPDViolationSeverity(violation.violationclass),
        title: violation.novdescription,
        description: violation.novdescription,
        dateIssued: new Date(violation.inspectiondate),
        dateResolved: violation.certifieddate ? new Date(violation.certifieddate) : undefined,
        dueDate: violation.originalcorrectbydate ? new Date(violation.originalcorrectbydate) : undefined,
        violationClass: violation.violationclass,
        notes: violation.novdescription,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      Logger.error('Failed to load HPD violations', error, 'ViolationHistoryService');
      return [];
    }
  }

  private async loadDSNYViolations(buildingId: string): Promise<ViolationHistoryEntry[]> {
    try {
      const building = await this.getBuildingInfo(buildingId);
      if (!building) return [];

      const violations = await this.container.apiClients.dsny.getBuildingViolations(buildingId);
      
      return violations.map((violation: any) => ({
        id: `dsny_${violation.ticket_number}`,
        buildingId,
        buildingName: building.name,
        buildingAddress: building.address,
        type: 'DSNY_VIOLATION' as const,
        source: 'DSNY' as const,
        status: violation.hearing_status?.includes('PAID') ? 'closed' : 'open',
        severity: this.mapDSNYViolationSeverity(violation.penalty_imposed),
        title: violation.charge_1_code_description,
        description: `${violation.charge_1_code_section} - ${violation.charge_1_code_description}`,
        dateIssued: new Date(violation.violation_date),
        dueDate: violation.hearing_date ? new Date(violation.hearing_date) : undefined,
        fineAmount: parseFloat(violation.penalty_imposed || '0') / 100,
        hearingDate: violation.hearing_date ? new Date(violation.hearing_date) : undefined,
        hearingStatus: violation.hearing_status,
        notes: violation.charge_1_code_description,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      Logger.error('Failed to load DSNY violations', error, 'ViolationHistoryService');
      return [];
    }
  }

  private async loadFDNYInspections(buildingId: string): Promise<ViolationHistoryEntry[]> {
    try {
      const building = await this.getBuildingInfo(buildingId);
      if (!building) return [];

      const inspections = await this.container.apiClients.fdny.getBuildingInspections(buildingId, 50);
      
      return inspections.map((inspection: any) => ({
        id: `fdny_${inspection.id}`,
        buildingId,
        buildingName: building.name,
        buildingAddress: building.address,
        type: 'FDNY_INSPECTION' as const,
        source: 'FDNY' as const,
        status: inspection.status === 'failed' ? 'failed' : 'closed',
        severity: inspection.status === 'failed' ? 'high' : 'low',
        title: `FDNY ${inspection.inspectionType} Inspection`,
        description: `Fire safety inspection: ${inspection.notes || 'No details available'}`,
        dateIssued: new Date(inspection.inspectionDate),
        inspectionDate: new Date(inspection.inspectionDate),
        nextInspectionDate: inspection.nextInspectionDate ? new Date(inspection.nextInspectionDate) : undefined,
        notes: inspection.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      Logger.error('Failed to load FDNY inspections', error, 'ViolationHistoryService');
      return [];
    }
  }

  private async loadDOBPermits(buildingId: string): Promise<ViolationHistoryEntry[]> {
    try {
      const building = await this.getBuildingInfo(buildingId);
      if (!building) return [];

      // DOB permits would be loaded from DOB API
      // For now, return empty array as DOB API integration needs to be implemented
      return [];
    } catch (error) {
      Logger.error('Failed to load DOB permits', error, 'ViolationHistoryService');
      return [];
    }
  }

  private async load311Complaints(buildingId: string): Promise<ViolationHistoryEntry[]> {
    try {
      const building = await this.getBuildingInfo(buildingId);
      if (!building) return [];

      const complaints = await this.container.apiClients.complaints311.getBuildingComplaints(buildingId, 50);
      
      return complaints.map((complaint: any) => ({
        id: `311_${complaint.id}`,
        buildingId,
        buildingName: building.name,
        buildingAddress: building.address,
        type: '311_COMPLAINT' as const,
        source: '311' as const,
        status: complaint.status === 'open' || complaint.status === 'in_progress' ? 'open' : 'closed',
        severity: this.map311ComplaintSeverity(complaint.complaintType),
        title: complaint.complaintType,
        description: complaint.description,
        dateIssued: new Date(complaint.createdDate),
        dateResolved: complaint.resolvedDate ? new Date(complaint.resolvedDate) : undefined,
        notes: complaint.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      Logger.error('Failed to load 311 complaints', error, 'ViolationHistoryService');
      return [];
    }
  }

  private async getBuildingInfo(buildingId: string): Promise<{ id: string; name: string; address: string } | null> {
    try {
      // This would typically come from the building catalog
      // For now, return basic info based on building ID
      const building = await this.container.buildingInfrastructureCatalog.getBuildingInfrastructure(buildingId);
      return {
        id: buildingId,
        name: building.name || `Building ${buildingId}`,
        address: building.address || 'Address not available'
      };
    } catch (error) {
      Logger.error('Failed to get building info', error, 'ViolationHistoryService');
      return null;
    }
  }

  private async getAllBuildings(): Promise<{ id: string; name: string; address: string }[]> {
    try {
      // Return our real 18-building portfolio
      return [
        { id: '1', name: '12 West 18th Street', address: '12 West 18th Street, New York, NY 10011' },
        { id: '3', name: '135-139 West 17th Street', address: '135-139 West 17th Street, New York, NY 10011' },
        { id: '4', name: '104 Franklin Street', address: '104 Franklin Street, New York, NY 10013' },
        { id: '5', name: '138 West 17th Street', address: '138 West 17th Street, New York, NY 10011' },
        { id: '6', name: '68 Perry Street', address: '68 Perry Street, New York, NY 10014' },
        { id: '7', name: '112 West 18th Street', address: '112 West 18th Street, New York, NY 10011' },
        { id: '8', name: '41 Elizabeth Street', address: '41 Elizabeth Street, New York, NY 10013' },
        { id: '9', name: '117 West 17th Street', address: '117 West 17th Street, New York, NY 10011' },
        { id: '10', name: '131 Perry Street', address: '131 Perry Street, New York, NY 10014' },
        { id: '11', name: '123 1st Avenue', address: '123 1st Avenue, New York, NY 10003' },
        { id: '13', name: '136 West 17th Street', address: '136 West 17th Street, New York, NY 10011' },
        { id: '14', name: 'Rubin Museum (142-148 W 17th)', address: '142-148 West 17th Street, New York, NY 10011' },
        { id: '15', name: '133 East 15th Street', address: '133 East 15th Street, New York, NY 10003' },
        { id: '16', name: 'Stuyvesant Cove Park', address: 'Stuyvesant Cove Park, New York, NY 10010' },
        { id: '17', name: '178 Spring Street', address: '178 Spring Street, New York, NY 10012' },
        { id: '18', name: '36 Walker Street', address: '36 Walker Street, New York, NY 10013' },
        { id: '19', name: '115 7th Avenue', address: '115 7th Avenue, New York, NY 10011' },
        { id: '21', name: '148 Chambers Street', address: '148 Chambers Street, New York, NY 10007' }
      ];
    } catch (error) {
      Logger.error('Failed to get all buildings', error, 'ViolationHistoryService');
      return [];
    }
  }

  private mapHPDViolationSeverity(violationClass: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (violationClass?.toUpperCase()) {
      case 'A': return 'critical';
      case 'B': return 'high';
      case 'C': return 'medium';
      default: return 'low';
    }
  }

  private mapDSNYViolationSeverity(penaltyAmount: string): 'low' | 'medium' | 'high' | 'critical' {
    const amount = parseFloat(penaltyAmount || '0');
    if (amount >= 500) return 'critical';
    if (amount >= 200) return 'high';
    if (amount >= 100) return 'medium';
    return 'low';
  }

  private map311ComplaintSeverity(complaintType: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes = ['HEATING', 'PLUMBING', 'ELECTRICAL', 'ELEVATOR'];
    const highTypes = ['NOISE', 'CONSTRUCTION', 'SANITATION'];
    
    if (criticalTypes.includes(complaintType)) return 'critical';
    if (highTypes.includes(complaintType)) return 'high';
    return 'medium';
  }

  private calculateComplianceScore(violations: ViolationHistoryEntry[]): number {
    let score = 100;
    
    violations.forEach(violation => {
      if (violation.severity === 'critical') {
        score -= 15;
      } else if (violation.severity === 'high') {
        score -= 10;
      } else if (violation.severity === 'medium') {
        score -= 5;
      } else {
        score -= 2;
      }
    });

    // Bonus for resolved violations
    const resolvedCount = violations.filter(v => v.status === 'closed' || v.status === 'resolved').length;
    score += Math.min(resolvedCount * 2, 20);

    return Math.max(0, Math.min(100, score));
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    return diffMinutes < 30; // Cache valid for 30 minutes
  }
}
