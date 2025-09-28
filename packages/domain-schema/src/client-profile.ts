/**
 * 🏢 Client Profile Schema
 * Purpose: Comprehensive client profile with portfolio management and contact information
 */

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Profile Details
  profile: ClientProfileDetails;
  
  // Portfolio Management
  portfolio: ClientPortfolio;
  
  // Billing & Contracts
  billing: ClientBilling;
  
  // Performance & Analytics
  performance: ClientPerformance;
  
  // Communication Preferences
  communication: CommunicationPreferences;
}

export interface ClientProfileDetails {
  avatar?: string;
  companyName: string;
  industry: string;
  address: Address;
  website?: string;
  description?: string;
  notes?: string;
  
  // Primary Contact
  primaryContact: ContactPerson;
  
  // Additional Contacts
  additionalContacts: ContactPerson[];
}

export interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  department?: string;
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ClientPortfolio {
  buildings: PortfolioBuilding[];
  totalBuildings: number;
  totalSqFt: number;
  totalValue: number;
  averageRating: number;
  lastUpdated: Date;
}

export interface PortfolioBuilding {
  id: string;
  name: string;
  address: Address;
  buildingType: BuildingType;
  sqFt: number;
  estimatedValue: number;
  yearBuilt?: number;
  floors: number;
  units?: number;
  
  // Service Information
  serviceLevel: ServiceLevel;
  contractStartDate: Date;
  contractEndDate?: Date;
  monthlyFee: number;
  
  // Performance Metrics
  performance: BuildingPerformance;
  
  // Compliance Status
  compliance: BuildingCompliance;
  
  // Current Status
  status: BuildingStatus;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  
  // Notes
  notes?: string;
  specialInstructions?: string[];
}

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED_USE = 'mixed_use',
  RETAIL = 'retail',
  OFFICE = 'office',
  INDUSTRIAL = 'industrial',
  WAREHOUSE = 'warehouse',
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
  OTHER = 'other'
}

export enum ServiceLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  CUSTOM = 'custom'
}

export interface BuildingPerformance {
  overallRating: number;
  cleanlinessScore: number;
  maintenanceScore: number;
  complianceScore: number;
  customerSatisfaction: number;
  lastUpdated: Date;
  
  // Trends
  ratingTrend: 'improving' | 'stable' | 'declining';
  issuesResolved: number;
  issuesPending: number;
  averageResponseTime: number; // hours
}

export interface BuildingCompliance {
  overallStatus: ComplianceStatus;
  hpdViolations: number;
  dobViolations: number;
  dsnyIssues: number;
  ll97Compliance: boolean;
  lastComplianceCheck: Date;
  nextComplianceCheck: Date;
  
  // Violation Details
  activeViolations: ComplianceViolation[];
  resolvedViolations: ComplianceViolation[];
}

export enum ComplianceStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

export interface ComplianceViolation {
  id: string;
  type: 'hpd' | 'dob' | 'dsny' | 'll97';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedDate: Date;
  dueDate?: Date;
  status: 'active' | 'resolved' | 'appealed';
  fine?: number;
  notes?: string;
}

export enum BuildingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RENOVATION = 'renovation',
  VACANT = 'vacant',
  SOLD = 'sold'
}

export interface ClientBilling {
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  billingCycle: BillingCycle;
  currentBalance: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  nextBillingDate: Date;
  paymentHistory: PaymentRecord[];
  
  // Contract Information
  contracts: ServiceContract[];
  activeContract?: ServiceContract;
}

export interface PaymentMethod {
  type: 'credit_card' | 'bank_transfer' | 'check' | 'ach';
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  CUSTOM = 'custom'
}

export interface PaymentRecord {
  id: string;
  date: Date;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  invoiceId: string;
  notes?: string;
}

export interface ServiceContract {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  monthlyFee: number;
  services: ServiceType[];
  terms: string;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  autoRenew: boolean;
  notes?: string;
}

export enum ServiceType {
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  LANDSCAPING = 'landscaping',
  SNOW_REMOVAL = 'snow_removal',
  WASTE_MANAGEMENT = 'waste_management',
  COMPLIANCE = 'compliance',
  EMERGENCY = 'emergency',
  CUSTOM = 'custom'
}

export interface ClientPerformance {
  metrics: ClientMetrics;
  trends: PerformanceTrend[];
  goals: ClientGoal[];
  reviews: ClientReview[];
}

export interface ClientMetrics {
  totalSpend: number;
  averageMonthlySpend: number;
  costPerSqFt: number;
  serviceQuality: number;
  responseTime: number; // hours
  issueResolutionRate: number;
  contractRenewalRate: number;
  lastUpdated: Date;
}

export interface PerformanceTrend {
  metric: string;
  period: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ClientGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface ClientReview {
  id: string;
  reviewDate: Date;
  reviewedBy: string;
  overallRating: number;
  categories: ReviewCategory[];
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  notes?: string;
}

export interface ReviewCategory {
  name: string;
  rating: number;
  comments?: string;
}

export interface CommunicationPreferences {
  preferredMethod: 'email' | 'phone' | 'sms' | 'app';
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  notifications: NotificationSettings;
  language: string;
  timeZone: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  emergencyAlerts: boolean;
  complianceAlerts: boolean;
  billingAlerts: boolean;
}

export enum UserRole {
  WORKER = 'worker',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CLIENT = 'client',
  SUPER_ADMIN = 'super_admin'
}
