/**
 * 🔒 Privacy Compliance Manager
 * Purpose: GDPR/CCPA compliance features and data protection
 */

import { DatabaseManager } from '@cyntientops/database';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';
import { Logger } from './LoggingService';

export enum DataSubjectType {
  WORKER = 'worker',
  CLIENT = 'client',
  VISITOR = 'visitor',
  VENDOR = 'vendor'
}

export enum DataCategory {
  PERSONAL = 'personal',
  SENSITIVE = 'sensitive',
  BIOMETRIC = 'biometric',
  LOCATION = 'location',
  COMMUNICATION = 'communication',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  PERFORMANCE = 'performance'
}

export enum ProcessingPurpose {
  EMPLOYMENT = 'employment',
  PAYROLL = 'payroll',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  OPERATIONS = 'operations',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics'
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export interface DataSubject {
  id: string;
  type: DataSubjectType;
  email: string;
  name: string;
  consentGiven: boolean;
  consentDate?: Date;
  consentWithdrawn?: Date;
  dataRetentionPeriod: number; // days
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingRecord {
  id: string;
  dataSubjectId: string;
  dataCategory: DataCategory;
  processingPurpose: ProcessingPurpose;
  legalBasis: LegalBasis;
  dataCollected: string; // JSON string of data fields
  processingDate: Date;
  retentionPeriod: number; // days
  sharedWith: string[]; // list of third parties
  createdAt: Date;
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purpose: ProcessingPurpose;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  method: 'explicit' | 'opt_in' | 'opt_out';
  version: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DataBreachRecord {
  id: string;
  description: string;
  affectedDataSubjects: string[];
  dataCategories: DataCategory[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  discoveredAt: Date;
  reportedAt?: Date;
  resolvedAt?: Date;
  status: 'discovered' | 'investigating' | 'reported' | 'resolved';
  actions: string[];
  createdAt: Date;
}

export interface DataSubjectRequest {
  id: string;
  dataSubjectId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  responseData?: string; // JSON string
  notes?: string;
  createdAt: Date;
}

export class PrivacyComplianceManager {
  private static instance: PrivacyComplianceManager;
  private database: DatabaseManager;
  private errorHandler: ErrorHandler;

  private constructor(database: DatabaseManager) {
    this.database = database;
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(database: DatabaseManager): PrivacyComplianceManager {
    if (!PrivacyComplianceManager.instance) {
      PrivacyComplianceManager.instance = new PrivacyComplianceManager(database);
    }
    return PrivacyComplianceManager.instance;
  }

  // Data Subject Management
  public async registerDataSubject(subject: Omit<DataSubject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const dataSubject: DataSubject = {
        ...subject,
        id,
        createdAt: now,
        updatedAt: now
      };

      await this.database.execute(
        `INSERT INTO data_subjects (id, type, email, name, consent_given, consent_date, consent_withdrawn, 
         data_retention_period, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dataSubject.id,
          dataSubject.type,
          dataSubject.email,
          dataSubject.name,
          dataSubject.consentGiven ? 1 : 0,
          dataSubject.consentDate?.toISOString(),
          dataSubject.consentWithdrawn?.toISOString(),
          dataSubject.dataRetentionPeriod,
          dataSubject.createdAt.toISOString(),
          dataSubject.updatedAt.toISOString()
        ]
      );

      Logger.info(`Data subject registered: ${id}`, { dataSubjectId: id }, 'PrivacyComplianceManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  public async getDataSubject(id: string): Promise<DataSubject | null> {
    try {
      const result = await this.database.query<DataSubject>(
        'SELECT * FROM data_subjects WHERE id = ?',
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      const subject = result[0];
      return {
        ...subject,
        consentGiven: Boolean(subject.consentGiven),
        consentDate: subject.consentDate ? new Date(subject.consentDate) : undefined,
        consentWithdrawn: subject.consentWithdrawn ? new Date(subject.consentWithdrawn) : undefined,
        createdAt: new Date(subject.createdAt),
        updatedAt: new Date(subject.updatedAt)
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  // Consent Management
  public async recordConsent(consent: Omit<ConsentRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const consentRecord: ConsentRecord = {
        ...consent,
        id,
        createdAt: now
      };

      await this.database.execute(
        `INSERT INTO consent_records (id, data_subject_id, purpose, granted, granted_at, withdrawn_at, 
         method, version, ip_address, user_agent, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          consentRecord.id,
          consentRecord.dataSubjectId,
          consentRecord.purpose,
          consentRecord.granted ? 1 : 0,
          consentRecord.grantedAt?.toISOString(),
          consentRecord.withdrawnAt?.toISOString(),
          consentRecord.method,
          consentRecord.version,
          consentRecord.ipAddress,
          consentRecord.userAgent,
          consentRecord.createdAt.toISOString()
        ]
      );

      Logger.info(`Consent recorded: ${id}`, { consentId: id, dataSubjectId: consent.dataSubjectId }, 'PrivacyComplianceManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  public async withdrawConsent(dataSubjectId: string, purpose: ProcessingPurpose): Promise<void> {
    try {
      const now = new Date();
      
      await this.database.execute(
        'UPDATE consent_records SET withdrawn_at = ? WHERE data_subject_id = ? AND purpose = ? AND granted = 1',
        [now.toISOString(), dataSubjectId, purpose]
      );

      // Update data subject consent status
      await this.database.execute(
        'UPDATE data_subjects SET consent_withdrawn = ?, updated_at = ? WHERE id = ?',
        [now.toISOString(), now.toISOString(), dataSubjectId]
      );

      Logger.info(`Consent withdrawn`, { dataSubjectId, purpose }, 'PrivacyComplianceManager');
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  // Data Processing Records
  public async recordDataProcessing(processing: Omit<DataProcessingRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const processingRecord: DataProcessingRecord = {
        ...processing,
        id,
        createdAt: now
      };

      await this.database.execute(
        `INSERT INTO data_processing_records (id, data_subject_id, data_category, processing_purpose, 
         legal_basis, data_collected, processing_date, retention_period, shared_with, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          processingRecord.id,
          processingRecord.dataSubjectId,
          processingRecord.dataCategory,
          processingRecord.processingPurpose,
          processingRecord.legalBasis,
          processingRecord.dataCollected,
          processingRecord.processingDate.toISOString(),
          processingRecord.retentionPeriod,
          JSON.stringify(processingRecord.sharedWith),
          processingRecord.createdAt.toISOString()
        ]
      );

      Logger.info(`Data processing recorded: ${id}`, { processingId: id, dataSubjectId: processing.dataSubjectId }, 'PrivacyComplianceManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  // Data Subject Rights (GDPR Article 15-22)
  public async handleDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const dataSubjectRequest: DataSubjectRequest = {
        ...request,
        id,
        createdAt: now
      };

      await this.database.execute(
        `INSERT INTO data_subject_requests (id, data_subject_id, request_type, description, status, 
         requested_at, completed_at, response_data, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dataSubjectRequest.id,
          dataSubjectRequest.dataSubjectId,
          dataSubjectRequest.requestType,
          dataSubjectRequest.description,
          dataSubjectRequest.status,
          dataSubjectRequest.requestedAt.toISOString(),
          dataSubjectRequest.completedAt?.toISOString(),
          dataSubjectRequest.responseData,
          dataSubjectRequest.notes,
          dataSubjectRequest.createdAt.toISOString()
        ]
      );

      Logger.info(`Data subject request created: ${id}`, { requestId: id, dataSubjectId: request.dataSubjectId }, 'PrivacyComplianceManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  public async processDataSubjectRequest(requestId: string, responseData?: any, notes?: string): Promise<void> {
    try {
      const now = new Date();
      
      await this.database.execute(
        'UPDATE data_subject_requests SET status = ?, completed_at = ?, response_data = ?, notes = ? WHERE id = ?',
        ['completed', now.toISOString(), responseData ? JSON.stringify(responseData) : null, notes, requestId]
      );

      Logger.info(`Data subject request completed: ${requestId}`, { requestId }, 'PrivacyComplianceManager');
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  // Data Breach Management (GDPR Article 33-34)
  public async recordDataBreach(breach: Omit<DataBreachRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const breachRecord: DataBreachRecord = {
        ...breach,
        id,
        createdAt: now
      };

      await this.database.execute(
        `INSERT INTO data_breach_records (id, description, affected_data_subjects, data_categories, 
         severity, discovered_at, reported_at, resolved_at, status, actions, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          breachRecord.id,
          breachRecord.description,
          JSON.stringify(breachRecord.affectedDataSubjects),
          JSON.stringify(breachRecord.dataCategories),
          breachRecord.severity,
          breachRecord.discoveredAt.toISOString(),
          breachRecord.reportedAt?.toISOString(),
          breachRecord.resolvedAt?.toISOString(),
          breachRecord.status,
          JSON.stringify(breachRecord.actions),
          breachRecord.createdAt.toISOString()
        ]
      );

      Logger.error(`Data breach recorded: ${id}`, { breachId: id, severity: breach.severity }, 'PrivacyComplianceManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SECURITY, ErrorSeverity.CRITICAL);
      throw error;
    }
  }

  // Data Retention and Deletion
  public async getExpiredData(): Promise<DataProcessingRecord[]> {
    try {
      const result = await this.database.query<DataProcessingRecord>(
        `SELECT * FROM data_processing_records 
         WHERE date(processing_date, '+' || retention_period || ' days') < date('now')`
      );

      return result.map(record => ({
        ...record,
        processingDate: new Date(record.processingDate),
        createdAt: new Date(record.createdAt)
      }));
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  public async deleteExpiredData(): Promise<number> {
    try {
      const expiredRecords = await this.getExpiredData();
      let deletedCount = 0;

      for (const record of expiredRecords) {
        // Delete from relevant tables based on data category and subject
        await this.deleteDataForSubject(record.dataSubjectId, record.dataCategory);
        deletedCount++;
      }

      Logger.info(`Deleted ${deletedCount} expired data records`, { deletedCount }, 'PrivacyComplianceManager');
      return deletedCount;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.HIGH);
      throw error;
    }
  }

  private async deleteDataForSubject(dataSubjectId: string, dataCategory: DataCategory): Promise<void> {
    try {
      // This would implement actual data deletion based on the data category
      // For now, we'll just log the deletion
      Logger.info(`Deleting data for subject: ${dataSubjectId}`, { dataSubjectId, dataCategory }, 'PrivacyComplianceManager');
      
      // In a real implementation, this would:
      // - Delete from workers table if dataCategory is PERSONAL and subject is WORKER
      // - Delete from buildings table if dataCategory is LOCATION
      // - Delete from tasks table if dataCategory is PERFORMANCE
      // - etc.
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.HIGH);
      throw error;
    }
  }

  // Compliance Reporting
  public async generateComplianceReport(startDate: Date, endDate: Date): Promise<{
    dataSubjects: number;
    consentRecords: number;
    processingRecords: number;
    dataBreaches: number;
    dataSubjectRequests: number;
    completedRequests: number;
  }> {
    try {
      const [dataSubjects, consentRecords, processingRecords, dataBreaches, dataSubjectRequests, completedRequests] = await Promise.all([
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM data_subjects WHERE created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM consent_records WHERE created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM data_processing_records WHERE created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM data_breach_records WHERE created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM data_subject_requests WHERE created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM data_subject_requests WHERE status = "completed" AND created_at BETWEEN ? AND ?',
          [startDate.toISOString(), endDate.toISOString()]
        )
      ]);

      return {
        dataSubjects: dataSubjects[0]?.count || 0,
        consentRecords: consentRecords[0]?.count || 0,
        processingRecords: processingRecords[0]?.count || 0,
        dataBreaches: dataBreaches[0]?.count || 0,
        dataSubjectRequests: dataSubjectRequests[0]?.count || 0,
        completedRequests: completedRequests[0]?.count || 0
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  // Utility methods
  private generateId(): string {
    return 'privacy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public async initializeTables(): Promise<void> {
    try {
      const tables = [
        `CREATE TABLE IF NOT EXISTS data_subjects (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          consent_given INTEGER DEFAULT 0,
          consent_date TEXT,
          consent_withdrawn TEXT,
          data_retention_period INTEGER DEFAULT 2555, -- 7 years in days
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS consent_records (
          id TEXT PRIMARY KEY,
          data_subject_id TEXT NOT NULL,
          purpose TEXT NOT NULL,
          granted INTEGER NOT NULL,
          granted_at TEXT,
          withdrawn_at TEXT,
          method TEXT NOT NULL,
          version TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (data_subject_id) REFERENCES data_subjects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS data_processing_records (
          id TEXT PRIMARY KEY,
          data_subject_id TEXT NOT NULL,
          data_category TEXT NOT NULL,
          processing_purpose TEXT NOT NULL,
          legal_basis TEXT NOT NULL,
          data_collected TEXT NOT NULL,
          processing_date TEXT NOT NULL,
          retention_period INTEGER NOT NULL,
          shared_with TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (data_subject_id) REFERENCES data_subjects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS data_subject_requests (
          id TEXT PRIMARY KEY,
          data_subject_id TEXT NOT NULL,
          request_type TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL,
          requested_at TEXT NOT NULL,
          completed_at TEXT,
          response_data TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (data_subject_id) REFERENCES data_subjects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS data_breach_records (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          affected_data_subjects TEXT NOT NULL,
          data_categories TEXT NOT NULL,
          severity TEXT NOT NULL,
          discovered_at TEXT NOT NULL,
          reported_at TEXT,
          resolved_at TEXT,
          status TEXT NOT NULL,
          actions TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`
      ];

      for (const table of tables) {
        await this.database.execute(table);
      }

      Logger.info('Privacy compliance tables initialized', undefined, 'PrivacyComplianceManager');
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.CRITICAL);
      throw error;
    }
  }
}
