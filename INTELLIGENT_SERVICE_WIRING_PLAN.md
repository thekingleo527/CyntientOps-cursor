# 🔧 **INTELLIGENT SERVICE WIRING PLAN**

**Date:** September 30, 2025  
**Purpose:** Detailed wiring integrations for all remaining TODO/placeholder implementations  
**Priority:** High → Medium → Low  

---

## 🔴 **HIGH PRIORITY - CORE BUSINESS SERVICES**

### **1. Building Metrics Service**
**Current:** `private _metrics: any | null = null; // TODO: Implement BuildingMetricsService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/BuildingMetricsService.ts
export class BuildingMetricsService {
  private operationalDataService: OperationalDataService;
  private buildingService: BuildingService;
  private taskService: TaskService;
  private nycAPIService: NYCAPIService; // Real NYC API integration

  constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.buildingService = new BuildingService();
    this.taskService = new TaskService();
    this.nycAPIService = new NYCAPIService();
  }

  async getBuildingMetrics(buildingId: string): Promise<BuildingMetrics> {
    const building = this.buildingService.getBuildingById(buildingId);
    const tasks = this.taskService.getAllTasks().filter(t => t.assigned_building_id === buildingId);
    
    // Real NYC API data integration
    const complianceData = await this.nycAPIService.getBuildingComplianceData(
      building.bbl, 
      building.bin, 
      building.address
    );
    
    return {
      buildingId,
      overallScore: this.calculateOverallScore(building, complianceData),
      hpdViolations: complianceData.violations.length,
      dobPermits: complianceData.permits.length,
      dsnyCompliance: complianceData.dsnyViolations?.isEmpty || true,
      taskCompletionRate: this.calculateTaskCompletionRate(tasks),
      lastInspection: building.lastInspection ? new Date(building.lastInspection) : null,
      nextInspection: this.calculateNextInspection(building),
      efficiencyScore: this.calculateEfficiencyScore(tasks, building),
      complianceTrend: this.calculateComplianceTrend(complianceData),
      criticalIssues: this.identifyCriticalIssues(complianceData)
    };
  }

  private calculateOverallScore(building: any, complianceData: any): number {
    // Real calculation based on actual data
    const baseScore = building.compliance_score * 100 || 95;
    const violationPenalty = complianceData.violations.length * 5;
    const dsnyPenalty = complianceData.dsnyViolations?.outstanding > 1000 ? 10 : 0;
    return Math.max(0, baseScore - violationPenalty - dsnyPenalty);
  }
}
```

**ServiceContainer Integration:**
```typescript
// Update ServiceContainer.ts
private _metrics: BuildingMetricsService | null = null;

public get metrics(): BuildingMetricsService {
  if (!this._metrics) {
    this._metrics = new BuildingMetricsService();
  }
  return this._metrics;
}
```

---

### **2. Compliance Service**
**Current:** `private _compliance: any | null = null; // TODO: Implement ComplianceService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/ComplianceService.ts
export class ComplianceService {
  private nycAPIService: NYCAPIService;
  private buildingService: BuildingService;
  private alertsService: AlertsService;

  constructor() {
    this.nycAPIService = new NYCAPIService();
    this.buildingService = new BuildingService();
    this.alertsService = AlertsService.getInstance();
  }

  async getComplianceStatus(buildingId: string): Promise<ComplianceStatus> {
    const building = this.buildingService.getBuildingById(buildingId);
    const complianceData = await this.nycAPIService.getBuildingComplianceData(
      building.bbl, 
      building.bin, 
      building.address
    );
    
    return {
      buildingId,
      overallScore: this.calculateComplianceScore(complianceData),
      hpdStatus: this.assessHPDStatus(complianceData.violations),
      dobStatus: this.assessDOBStatus(complianceData.permits),
      dsnyStatus: this.assessDSNYStatus(complianceData.dsnyViolations),
      ll97Status: this.assessLL97Status(complianceData.emissions),
      criticalAlerts: await this.alertsService.getAlertsForBuilding(buildingId),
      lastUpdated: new Date(),
      nextReview: this.calculateNextReview(building)
    };
  }

  async getPortfolioCompliance(): Promise<PortfolioComplianceStatus> {
    const buildings = this.buildingService.getAllBuildings();
    const complianceStatuses = await Promise.all(
      buildings.map(building => this.getComplianceStatus(building.id))
    );
    
    return {
      totalBuildings: buildings.length,
      compliantBuildings: complianceStatuses.filter(s => s.overallScore >= 90).length,
      averageScore: complianceStatuses.reduce((sum, s) => sum + s.overallScore, 0) / buildings.length,
      criticalIssues: complianceStatuses.filter(s => s.overallScore < 70).length,
      lastUpdated: new Date()
    };
  }
}
```

---

### **3. NYC Service**
**Current:** `private _nyc: any | null = null; // TODO: Implement NYCService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/NYCService.ts
export class NYCService {
  private nycAPIService: NYCAPIService;
  private dsnyViolationsService: DSNYViolationsService;
  private propertyValueService: PropertyValueService;

  constructor() {
    this.nycAPIService = new NYCAPIService();
    this.dsnyViolationsService = new DSNYViolationsService();
    this.propertyValueService = new PropertyValueService();
  }

  async getHPDViolations(buildingId: string): Promise<HPDViolation[]> {
    const building = this.buildingService.getBuildingById(buildingId);
    return await this.nycAPIService.getHPDViolations(building.bbl);
  }

  async getDOBPermits(buildingId: string): Promise<DOBPermit[]> {
    const building = this.buildingService.getBuildingById(buildingId);
    return await this.nycAPIService.getDOBPermits(building.bin);
  }

  async getDSNYViolations(buildingId: string): Promise<DSNYViolationsResult> {
    const building = this.buildingService.getBuildingById(buildingId);
    return await this.dsnyViolationsService.getViolationsForAddress(building.address);
  }

  async getPropertyValue(buildingId: string): Promise<BuildingPropertyValue> {
    return await this.propertyValueService.getBuildingPropertyValue(buildingId);
  }

  async getComprehensiveBuildingData(buildingId: string): Promise<NYCComplianceData> {
    const building = this.buildingService.getBuildingById(buildingId);
    return await this.nycAPIService.getBuildingComplianceData(
      building.bbl, 
      building.bin, 
      building.address
    );
  }
}
```

---

## 🟡 **MEDIUM PRIORITY - ENHANCED FEATURES**

### **4. Analytics Service**
**Current:** `private _analytics: any | null = null; // TODO: Implement AnalyticsService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/AnalyticsService.ts
export class AnalyticsService {
  private intelligenceService: IntelligenceService;
  private buildingService: BuildingService;
  private taskService: TaskService;
  private complianceService: ComplianceService;

  constructor() {
    this.intelligenceService = IntelligenceService.getInstance();
    this.buildingService = new BuildingService();
    this.taskService = new TaskService();
    this.complianceService = new ComplianceService();
  }

  async generatePortfolioReport(clientId: string): Promise<PortfolioReport> {
    const buildings = this.buildingService.getBuildingsByClient(clientId);
    const portfolioInsights = await this.intelligenceService.getPortfolioInsights();
    const complianceStatus = await this.complianceService.getPortfolioCompliance();
    
    return {
      clientId,
      reportDate: new Date(),
      portfolioSummary: {
        totalBuildings: buildings.length,
        totalValue: buildings.reduce((sum, b) => sum + (b.marketValue || 0), 0),
        averageCompliance: complianceStatus.averageScore,
        criticalIssues: complianceStatus.criticalIssues
      },
      buildingDetails: await Promise.all(
        buildings.map(async building => ({
          buildingId: building.id,
          buildingName: building.name,
          complianceScore: (await this.complianceService.getComplianceStatus(building.id)).overallScore,
          marketValue: building.marketValue,
          outstandingIssues: (await this.complianceService.getComplianceStatus(building.id)).criticalAlerts.length
        }))
      ),
      recommendations: this.generateRecommendations(complianceStatus, portfolioInsights)
    };
  }

  async exportBuildingData(buildingId: string): Promise<BuildingDataExport> {
    const building = this.buildingService.getBuildingById(buildingId);
    const complianceData = await this.complianceService.getComplianceStatus(buildingId);
    const tasks = this.taskService.getAllTasks().filter(t => t.assigned_building_id === buildingId);
    
    return {
      buildingId,
      exportDate: new Date(),
      buildingInfo: building,
      complianceData,
      taskHistory: tasks,
      metrics: await this.intelligenceService.getBuildingInsights(buildingId)
    };
  }
}
```

---

### **5. Photos Service**
**Current:** `private _photos: any | null = null; // TODO: Implement PhotosService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/PhotosService.ts
export class PhotosService {
  private databaseManager: DatabaseManager;
  private photoEvidenceManager: PhotoEvidenceManager;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
    this.photoEvidenceManager = PhotoEvidenceManager.getInstance();
  }

  async getRecentPhotos(buildingId: string, limit: number = 10): Promise<PhotoEvidence[]> {
    const query = `
      SELECT * FROM photo_evidence 
      WHERE building_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    return await this.databaseManager.query(query, [buildingId, limit]);
  }

  async addPhoto(photo: PhotoEvidence): Promise<void> {
    await this.photoEvidenceManager.storePhotoEvidence(photo);
  }

  async getPhotosByTask(taskId: string): Promise<PhotoEvidence[]> {
    const query = `
      SELECT * FROM photo_evidence 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `;
    
    return await this.databaseManager.query(query, [taskId]);
  }

  async getPhotosByWorker(workerId: string, dateRange?: { start: Date; end: Date }): Promise<PhotoEvidence[]> {
    let query = `
      SELECT * FROM photo_evidence 
      WHERE worker_id = ?
    `;
    const params = [workerId];
    
    if (dateRange) {
      query += ` AND created_at BETWEEN ? AND ?`;
      params.push(dateRange.start.toISOString(), dateRange.end.toISOString());
    }
    
    query += ` ORDER BY created_at DESC`;
    
    return await this.databaseManager.query(query, params);
  }
}
```

---

## 🟢 **LOW PRIORITY - NICE-TO-HAVE FEATURES**

### **6. Notes Service**
**Current:** `private _notes: any | null = null; // TODO: Implement NotesService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/NotesService.ts
export class NotesService {
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  async addDailyNote(note: DailyNote): Promise<void> {
    const query = `
      INSERT INTO daily_notes (building_id, worker_id, note_text, note_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await this.databaseManager.query(query, [
      note.buildingId,
      note.workerId,
      note.noteText,
      note.noteType,
      new Date().toISOString()
    ]);
  }

  async getDailyNotes(buildingId: string, date?: Date): Promise<DailyNote[]> {
    let query = `
      SELECT * FROM daily_notes 
      WHERE building_id = ?
    `;
    const params = [buildingId];
    
    if (date) {
      query += ` AND DATE(created_at) = DATE(?)`;
      params.push(date.toISOString());
    }
    
    query += ` ORDER BY created_at DESC`;
    
    return await this.databaseManager.query(query, params);
  }
}
```

---

### **7. Inventory Service**
**Current:** `private _inventory: any | null = null; // TODO: Implement InventoryService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/InventoryService.ts
export class InventoryService {
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  async createSupplyRequest(request: SupplyRequest): Promise<void> {
    const query = `
      INSERT INTO supply_requests (building_id, worker_id, items, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await this.databaseManager.query(query, [
      request.buildingId,
      request.workerId,
      JSON.stringify(request.items),
      request.priority,
      'pending',
      new Date().toISOString()
    ]);
  }

  async getInventoryUsage(buildingId: string): Promise<InventoryUsage[]> {
    const query = `
      SELECT * FROM inventory_usage 
      WHERE building_id = ? 
      ORDER BY usage_date DESC
    `;
    
    return await this.databaseManager.query(query, [buildingId]);
  }
}
```

---

### **8. Weather Service**
**Current:** `private _weather: any | null = null; // TODO: Implement WeatherService`

**Intelligent Wiring:**
```typescript
// packages/business-core/src/services/WeatherService.ts
export class WeatherService {
  private weatherAPIClient: WeatherAPIClient;
  private buildingService: BuildingService;

  constructor() {
    this.weatherAPIClient = new WeatherAPIClient();
    this.buildingService = new BuildingService();
  }

  async getWeatherForBuilding(buildingId: string): Promise<WeatherData> {
    const building = this.buildingService.getBuildingById(buildingId);
    return await this.weatherAPIClient.getWeatherForLocation(
      building.latitude, 
      building.longitude
    );
  }

  async getBuildingWeatherGuidance(buildingId: string): Promise<WeatherGuidance[]> {
    const weatherData = await this.getWeatherForBuilding(buildingId);
    return this.generateWeatherGuidance(weatherData);
  }

  private generateWeatherGuidance(weather: WeatherData): WeatherGuidance[] {
    const guidance: WeatherGuidance[] = [];
    
    if (weather.temperature < 32) {
      guidance.push({
        type: 'freeze_warning',
        message: 'Freeze warning: Check for frozen pipes and heating systems',
        priority: 'high'
      });
    }
    
    if (weather.precipitation > 0.5) {
      guidance.push({
        type: 'rain_advisory',
        message: 'Heavy rain expected: Check drainage systems and roof conditions',
        priority: 'medium'
      });
    }
    
    return guidance;
  }
}
```

---

## 🔧 **IMPLEMENTATION STRATEGY**

### **Phase 1: High Priority (Week 1)**
1. **Building Metrics Service** - Real metrics calculation
2. **Compliance Service** - Enhanced compliance tracking
3. **NYC Service** - Comprehensive NYC API wrapper

### **Phase 2: Medium Priority (Week 2)**
1. **Analytics Service** - Real reporting functionality
2. **Photos Service** - Photo management integration

### **Phase 3: Low Priority (Week 3)**
1. **Notes Service** - Daily note management
2. **Inventory Service** - Supply request management
3. **Weather Service** - Weather-based guidance

### **Database Schema Updates**
```sql
-- Add tables for new services
CREATE TABLE daily_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE supply_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  items TEXT NOT NULL, -- JSON
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE inventory_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity_used INTEGER NOT NULL,
  usage_date DATETIME NOT NULL
);
```

---

## 🎯 **INTEGRATION POINTS**

### **Dashboard Integration**
- **Admin Dashboard**: Building metrics, compliance status, analytics
- **Worker Dashboard**: Weather guidance, photo management, notes
- **Client Dashboard**: Portfolio reports, compliance summaries

### **API Integration**
- **NYC APIs**: HPD, DOB, DSNY, DOF, LL97
- **Weather APIs**: OpenWeatherMap, NOAA
- **Database**: SQLite with proper indexing

### **Real-time Updates**
- **WebSocket**: Live compliance updates
- **Push Notifications**: Critical alerts
- **Background Sync**: Weather and compliance data

This plan provides intelligent wiring for all remaining placeholder implementations with real data integration and proper service architecture.
