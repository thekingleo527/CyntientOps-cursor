/**
 * 👷 Worker Profile Schema
 * Purpose: Comprehensive worker profile with calendar, time-off, and QuickBooks integration
 */

export interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  skills: string[];
  certifications: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Profile Details
  profile: WorkerProfileDetails;
  
  // Calendar & Scheduling
  calendar: WorkerCalendar;
  
  // Time Management
  timeOff: TimeOffManagement;
  
  // QuickBooks Integration
  quickBooks: QuickBooksWorkerData;
  
  // Performance & Analytics
  performance: WorkerPerformance;
}

export interface WorkerProfileDetails {
  avatar?: string;
  emergencyContact: EmergencyContact;
  address: Address;
  hireDate: Date;
  department: string;
  position: string;
  hourlyRate: number;
  benefits: string[];
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface WorkerCalendar {
  timeZone: string;
  workingHours: WorkingHours;
  recurringAvailability: RecurringAvailability[];
  blockedDates: BlockedDate[];
  upcomingEvents: CalendarEvent[];
}

export interface WorkingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
  type: 'work' | 'break' | 'unavailable';
}

export interface RecurringAvailability {
  id: string;
  title: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BlockedDate {
  id: string;
  date: Date;
  reason: string;
  type: 'time_off' | 'training' | 'meeting' | 'personal';
  isApproved: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'task' | 'meeting' | 'training' | 'time_off' | 'maintenance';
  buildingId?: string;
  buildingName?: string;
  isAllDay: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface TimeOffManagement {
  availableDays: number;
  usedDays: number;
  pendingRequests: TimeOffRequest[];
  approvedRequests: TimeOffRequest[];
  rejectedRequests: TimeOffRequest[];
  policy: TimeOffPolicy;
}

export interface TimeOffRequest {
  id: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  isPaid: boolean;
}

export enum TimeOffType {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  PERSONAL = 'personal',
  BEREAVEMENT = 'bereavement',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  JURY_DUTY = 'jury_duty',
  UNPAID = 'unpaid'
}

export interface TimeOffPolicy {
  vacationDaysPerYear: number;
  sickDaysPerYear: number;
  personalDaysPerYear: number;
  carryOverLimit: number;
  advanceNoticeRequired: number; // days
  maxConsecutiveDays: number;
}

export interface QuickBooksWorkerData {
  employeeId?: string;
  vendorId?: string;
  isEmployee: boolean;
  isVendor: boolean;
  hourlyRate: number;
  overtimeRate: number;
  lastSyncDate?: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  timesheetEntries: TimesheetEntry[];
  payStubs: PayStub[];
}

export interface TimesheetEntry {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakDuration: number; // minutes
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
  buildingId?: string;
  buildingName?: string;
  taskId?: string;
  taskName?: string;
  isOvertime: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface PayStub {
  id: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payDate: Date;
  grossPay: number;
  deductions: PayrollDeduction[];
  netPay: number;
  hoursWorked: number;
  overtimeHours: number;
  status: 'draft' | 'final' | 'paid';
}

export interface PayrollDeduction {
  type: 'tax' | 'insurance' | 'retirement' | 'other';
  description: string;
  amount: number;
}

export interface WorkerPerformance {
  metrics: PerformanceMetrics;
  goals: PerformanceGoal[];
  reviews: PerformanceReview[];
  achievements: Achievement[];
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  tasksOnTime: number;
  onTimeRate: number;
  averageTaskTime: number;
  customerRating: number;
  safetyScore: number;
  attendanceRate: number;
  lastUpdated: Date;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  createdAt: Date;
}

export interface PerformanceReview {
  id: string;
  reviewPeriod: string;
  reviewDate: Date;
  reviewedBy: string;
  overallRating: number;
  categories: ReviewCategory[];
  strengths: string[];
  areasForImprovement: string[];
  goals: string[];
  notes?: string;
}

export interface ReviewCategory {
  name: string;
  rating: number;
  comments?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'safety' | 'performance' | 'customer_service' | 'innovation' | 'teamwork';
  earnedDate: Date;
  points: number;
  isPublic: boolean;
}

export enum UserRole {
  WORKER = 'worker',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CLIENT = 'client',
  SUPER_ADMIN = 'super_admin'
}
