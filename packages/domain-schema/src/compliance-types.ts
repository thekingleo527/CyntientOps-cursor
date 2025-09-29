/**
 * 🛡️ Compliance Types
 * Mirrors: CyntientOps/Core/Types/ComplianceTypes.swift
 * Purpose: Complete compliance system types and interfaces
 */

export enum ComplianceSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ComplianceType {
  REGULATORY = 'regulatory',
  SAFETY = 'safety',
  ENVIRONMENTAL = 'environmental',
  OPERATIONAL = 'operational'
}

export enum ComplianceStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum ComplianceCategory {
  ALL = 'all',
  HPD = 'hpd',
  DOB = 'dob',
  FDNY = 'fdny',
  LL97 = 'll97',
  LL11 = 'll11',
  DEP = 'dep'
}

export interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  severity: ComplianceSeverity;
  type: ComplianceType;
  status: ComplianceStatus;
  buildingId: string;
  buildingName?: string;
  dueDate: Date;
  createdDate: Date;
  resolvedDate?: Date;
  category: ComplianceCategory;
  priority: number;
  estimatedCost?: number;
  assignedWorkerId?: string;
  notes?: string;
  evidence?: string[];
}

export interface ComplianceDeadline {
  id: string;
  title: string;
  dueDate: Date;
  buildingId: string;
  category: string;
  severity: ComplianceSeverity;
  daysRemaining: number;
  description?: string;
  estimatedCost?: number;
}

export interface ComplianceMetrics {
  overallScore: number;
  activeViolations: number;
  pendingInspections: number;
  resolvedThisMonth: number;
  violationsTrend: number;
  inspectionsTrend: number;
  resolutionTrend: number;
  costTrend: number;
  formattedComplianceCost: string;
  categoryScores: Record<ComplianceCategory, number>;
}

export interface HPDViolation {
  id: string;
  buildingId: string;
  buildingAddress: string;
  violationType: string;
  violationClass: string;
  description: string;
  status: string;
  dateIssued: Date;
  dateCertified?: Date;
  priority: number;
  novId?: string;
  certifiedDate?: Date;
  currentStatus: string;
  novDescription: string;
}

export interface DOBPermit {
  id: string;
  buildingId: string;
  permitNumber: string;
  permitType: string;
  status: string;
  issueDate: Date;
  expirationDate?: Date;
  description: string;
  applicantName?: string;
  contractorName?: string;
}

export interface DSNYViolation {
  id: string;
  buildingId: string;
  violationType: string;
  description: string;
  status: string;
  dateIssued: Date;
  fineAmount?: number;
  dueDate?: Date;
  resolutionDate?: Date;
}

export interface LL97Emission {
  id: string;
  buildingId: string;
  year: number;
  totalEmissions: number;
  limit: number;
  complianceStatus: string;
  penaltyAmount?: number;
  reportingDate: Date;
}

export interface ViolationTrendData {
  date: Date;
  count: number;
  violationClass: string;
}

export interface ResolutionTimeData {
  month: string;
  averageDays: number;
  violationClass: string;
}

export interface BuildingPerformanceData {
  buildingId: string;
  buildingName: string;
  totalViolations: number;
  resolvedViolations: number;
  averageResolutionDays: number;
}

export interface CompliancePredictiveInsight {
  id: string;
  title: string;
  description: string;
  riskScore: number;
  confidence: number;
  buildingId: string;
  category: string;
  predictedDate?: Date;
  recommendedAction?: string;
}

export interface ComplianceReport {
  id: string;
  title: string;
  generatedDate: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalViolations: number;
    resolvedViolations: number;
    pendingViolations: number;
    totalCost: number;
    averageResolutionTime: number;
  };
  buildingReports: BuildingComplianceReport[];
  categoryBreakdown: Record<ComplianceCategory, number>;
  trends: ViolationTrendData[];
  insights: CompliancePredictiveInsight[];
}

export interface BuildingComplianceReport {
  buildingId: string;
  buildingName: string;
  complianceScore: number;
  violations: ComplianceIssue[];
  inspections: ComplianceIssue[];
  deadlines: ComplianceDeadline[];
  performance: BuildingPerformanceData;
}

// Compliance API Response Types
export interface ComplianceAPIResponse {
  violations: HPDViolation[];
  permits: DOBPermit[];
  dsnyViolations: DSNYViolation[];
  ll97Emissions: LL97Emission[];
  lastUpdated: Date;
}

// Compliance Filter Types
export interface ComplianceFilter {
  category?: ComplianceCategory;
  severity?: ComplianceSeverity;
  status?: ComplianceStatus;
  buildingId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  searchTerm?: string;
}

// Compliance Action Types
export interface ComplianceAction {
  id: string;
  type: 'resolve' | 'assign' | 'escalate' | 'schedule_inspection' | 'update_status';
  issueId: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: number;
  createdBy: string;
  createdDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// Compliance Notification Types
export interface ComplianceNotification {
  id: string;
  type: 'deadline_approaching' | 'violation_issued' | 'inspection_scheduled' | 'resolution_required';
  title: string;
  message: string;
  buildingId: string;
  issueId?: string;
  severity: ComplianceSeverity;
  dueDate?: Date;
  isRead: boolean;
  createdDate: Date;
}

// Compliance Dashboard Data
export interface ComplianceDashboardData {
  metrics: ComplianceMetrics;
  recentViolations: ComplianceIssue[];
  criticalDeadlines: ComplianceDeadline[];
  buildingCompliance: Record<string, number>;
  predictiveInsights: CompliancePredictiveInsight[];
  trends: ViolationTrendData[];
  lastUpdated: Date;
}

// Compliance Service Interface
export interface ComplianceService {
  // Data Loading
  loadComplianceData(buildingIds: string[]): Promise<ComplianceDashboardData>;
  loadViolations(filter?: ComplianceFilter): Promise<ComplianceIssue[]>;
  loadHPDViolations(buildingId: string): Promise<HPDViolation[]>;
  loadDOBPermits(buildingId: string): Promise<DOBPermit[]>;
  loadDSNYViolations(buildingId: string): Promise<DSNYViolation[]>;
  loadLL97Emissions(buildingId: string): Promise<LL97Emission[]>;
  
  // Metrics and Analytics
  calculateComplianceScore(buildingId: string): Promise<number>;
  getComplianceMetrics(buildingIds: string[]): Promise<ComplianceMetrics>;
  getCriticalDeadlines(buildingIds: string[]): Promise<ComplianceDeadline[]>;
  getPredictiveInsights(buildingIds: string[]): Promise<CompliancePredictiveInsight[]>;
  
  // Actions
  resolveViolation(issueId: string, resolution: string): Promise<void>;
  assignViolation(issueId: string, workerId: string): Promise<void>;
  scheduleInspection(issueId: string, date: Date): Promise<void>;
  updateViolationStatus(issueId: string, status: ComplianceStatus): Promise<void>;
  
  // Reporting
  generateComplianceReport(buildingIds: string[], period: { startDate: Date; endDate: Date }): Promise<ComplianceReport>;
  exportComplianceData(format: 'pdf' | 'csv' | 'json'): Promise<string>;
  
  // Notifications
  getComplianceNotifications(): Promise<ComplianceNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Real-time Updates
  subscribeToComplianceUpdates(callback: (update: ComplianceIssue) => void): () => void;
}
