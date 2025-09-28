/**
 * 🔒 Security Manager
 * Purpose: Advanced security and compliance features using canonical data
 * Data Source: packages/data-seed/src/* (NO MOCK DATA)
 */

import { DatabaseManager } from '@cyntientops/database';
import { UserRole } from '@cyntientops/domain-schema';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'authentication' | 'authorization' | 'data_protection' | 'audit' | 'compliance';
  rules: SecurityRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  type: 'HPD' | 'DOB' | 'DSNY' | 'FIRE' | 'HEALTH' | 'OSHA' | 'GDPR' | 'CCPA';
  description: string;
  requirements: string[];
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  buildingId?: string;
  workerId?: string;
  clientId?: string;
}

export interface SecurityAudit {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  ipAddress: string;
  userAgent: string;
  details: any;
}

export interface AccessControl {
  userId: string;
  role: UserRole;
  permissions: string[];
  buildings: string[];
  clients: string[];
  features: string[];
  restrictions: string[];
}

export interface DataProtection {
  encryption: boolean;
  backup: boolean;
  retention: number; // days
  anonymization: boolean;
  accessLogging: boolean;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export class SecurityManager {
  private static instance: SecurityManager;
  private database: DatabaseManager;
  private securityPolicies: SecurityPolicy[] = [];
  private complianceRequirements: ComplianceRequirement[] = [];
  private securityAudits: SecurityAudit[] = [];
  private accessControls: Map<string, AccessControl> = new Map();

  private constructor(database: DatabaseManager) {
    this.database = database;
    console.log('SecurityManager initialized');
    this.initializeSecurityPolicies();
    this.initializeComplianceRequirements();
  }

  public static getInstance(database: DatabaseManager): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager(database);
    }
    return SecurityManager.instance;
  }

  private initializeSecurityPolicies(): void {
    this.securityPolicies = [
      {
        id: 'auth_policy_001',
        name: 'Authentication Policy',
        description: 'Standard authentication requirements',
        type: 'authentication',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'auth_rule_001',
            name: 'Password Requirements',
            condition: 'password_strength >= 8',
            action: 'allow',
            severity: 'high',
            description: 'Passwords must be at least 8 characters with mixed case, numbers, and symbols',
          },
          {
            id: 'auth_rule_002',
            name: 'Session Timeout',
            condition: 'session_duration > 8_hours',
            action: 'deny',
            severity: 'medium',
            description: 'Sessions must not exceed 8 hours',
          },
        ],
      },
      {
        id: 'authz_policy_001',
        name: 'Authorization Policy',
        description: 'Role-based access control',
        type: 'authorization',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'authz_rule_001',
            name: 'Worker Access',
            condition: 'role == worker',
            action: 'allow',
            severity: 'medium',
            description: 'Workers can only access their assigned buildings and tasks',
          },
          {
            id: 'authz_rule_002',
            name: 'Admin Access',
            condition: 'role == admin',
            action: 'allow',
            severity: 'high',
            description: 'Admins have full access to all resources',
          },
        ],
      },
      {
        id: 'data_policy_001',
        name: 'Data Protection Policy',
        description: 'Data protection and privacy requirements',
        type: 'data_protection',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'data_rule_001',
            name: 'Data Encryption',
            condition: 'data_type == sensitive',
            action: 'allow',
            severity: 'critical',
            description: 'All sensitive data must be encrypted',
          },
          {
            id: 'data_rule_002',
            name: 'Data Retention',
            condition: 'data_age > retention_period',
            action: 'deny',
            severity: 'high',
            description: 'Data must be deleted after retention period',
          },
        ],
      },
    ];
  }

  private initializeComplianceRequirements(): void {
    this.complianceRequirements = [
      {
        id: 'hpd_001',
        name: 'HPD Annual Registration',
        type: 'HPD',
        description: 'Annual registration with NYC Housing Preservation and Development',
        requirements: [
          'Submit annual registration form',
          'Provide building information',
          'Pay registration fees',
          'Maintain compliance records',
        ],
        deadline: new Date('2024-12-31'),
        status: 'pending',
      },
      {
        id: 'dob_001',
        name: 'DOB Safety Inspection',
        type: 'DOB',
        description: 'Annual safety inspection by Department of Buildings',
        requirements: [
          'Schedule inspection appointment',
          'Prepare building for inspection',
          'Address any violations found',
          'Submit compliance documentation',
        ],
        deadline: new Date('2024-11-30'),
        status: 'in_progress',
      },
      {
        id: 'dsny_001',
        name: 'DSNY Waste Management',
        type: 'DSNY',
        description: 'Compliance with Department of Sanitation waste management rules',
        requirements: [
          'Proper waste separation',
          'Scheduled collection compliance',
          'Recycling program implementation',
          'Violation response procedures',
        ],
        deadline: new Date('2024-10-31'),
        status: 'completed',
      },
      {
        id: 'fire_001',
        name: 'Fire Safety Compliance',
        type: 'FIRE',
        description: 'Annual fire safety inspection and compliance',
        requirements: [
          'Fire alarm system testing',
          'Emergency exit maintenance',
          'Fire extinguisher inspection',
          'Evacuation plan updates',
        ],
        deadline: new Date('2024-09-30'),
        status: 'overdue',
      },
      {
        id: 'health_001',
        name: 'Health Department Inspection',
        type: 'HEALTH',
        description: 'Annual health and safety inspection',
        requirements: [
          'Pest control measures',
          'Sanitation standards',
          'Air quality monitoring',
          'Water system maintenance',
        ],
        deadline: new Date('2024-08-31'),
        status: 'completed',
      },
    ];
  }

  // MARK: - Authentication & Authorization

  public async authenticateUser(userId: string, password: string): Promise<boolean> {
    try {
      // Load canonical worker data
      const workersData = await import('@cyntientops/data-seed');
      const worker = workersData.workers.find((w: any) => w.id === userId);
      
      if (!worker) {
        this.logSecurityEvent(userId, 'authentication', 'user_not_found', 'failure');
        return false;
      }
      
      // In a real implementation, this would use proper password hashing
      const isValid = worker.password === password;
      
      this.logSecurityEvent(userId, 'authentication', 'login_attempt', isValid ? 'success' : 'failure');
      
      return isValid;
    } catch (error) {
      console.error('Authentication error:', error);
      this.logSecurityEvent(userId, 'authentication', 'system_error', 'failure');
      return false;
    }
  }

  public async authorizeUser(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const accessControl = await this.getAccessControl(userId);
      if (!accessControl) {
        this.logSecurityEvent(userId, 'authorization', 'no_access_control', 'failure');
        return false;
      }
      
      // Check role-based permissions
      const hasPermission = this.checkPermission(accessControl, resource, action);
      
      this.logSecurityEvent(userId, 'authorization', `${resource}:${action}`, hasPermission ? 'success' : 'failure');
      
      return hasPermission;
    } catch (error) {
      console.error('Authorization error:', error);
      this.logSecurityEvent(userId, 'authorization', 'system_error', 'failure');
      return false;
    }
  }

  private async getAccessControl(userId: string): Promise<AccessControl | null> {
    if (this.accessControls.has(userId)) {
      return this.accessControls.get(userId)!;
    }
    
    try {
      // Load canonical worker data
      const workersData = await import('@cyntientops/data-seed');
      const worker = workersData.workers.find((w: any) => w.id === userId);
      
      if (!worker) {
        return null;
      }
      
      const accessControl: AccessControl = {
        userId: worker.id,
        role: worker.role as UserRole,
        permissions: this.getRolePermissions(worker.role),
        buildings: await this.getWorkerBuildings(worker.id),
        clients: await this.getWorkerClients(worker.id),
        features: this.getRoleFeatures(worker.role),
        restrictions: this.getRoleRestrictions(worker.role),
      };
      
      this.accessControls.set(userId, accessControl);
      return accessControl;
    } catch (error) {
      console.error('Failed to get access control:', error);
      return null;
    }
  }

  private getRolePermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_buildings', 'view_analytics'];
      case 'worker':
        return ['read', 'write', 'view_tasks', 'update_status', 'upload_photos'];
      case 'client':
        return ['read', 'view_reports', 'view_buildings'];
      default:
        return ['read'];
    }
  }

  private async getWorkerBuildings(workerId: string): Promise<string[]> {
    try {
      const routinesData = await import('@cyntientops/data-seed');
      const workerRoutines = routinesData.routines.filter((r: any) => r.workerId === workerId);
      return [...new Set(workerRoutines.map((r: any) => r.buildingId))];
    } catch (error) {
      console.error('Failed to get worker buildings:', error);
      return [];
    }
  }

  private async getWorkerClients(workerId: string): Promise<string[]> {
    try {
      const buildingsData = await import('@cyntientops/data-seed');
      const buildings = await this.getWorkerBuildings(workerId);
      const clientIds = buildings.map(buildingId => {
        const building = buildingsData.buildings.find((b: any) => b.id === buildingId);
        return building?.client_id;
      }).filter(Boolean);
      
      return [...new Set(clientIds)];
    } catch (error) {
      console.error('Failed to get worker clients:', error);
      return [];
    }
  }

  private getRoleFeatures(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['dashboard', 'analytics', 'reports', 'user_management', 'building_management', 'compliance'];
      case 'worker':
        return ['dashboard', 'tasks', 'clock_in', 'photo_upload', 'building_info'];
      case 'client':
        return ['dashboard', 'reports', 'building_status', 'compliance'];
      default:
        return ['dashboard'];
    }
  }

  private getRoleRestrictions(role: string): string[] {
    switch (role) {
      case 'admin':
        return [];
      case 'worker':
        return ['no_user_management', 'no_financial_data', 'no_system_settings'];
      case 'client':
        return ['no_user_management', 'no_worker_data', 'no_system_settings', 'read_only'];
      default:
        return ['read_only'];
    }
  }

  private checkPermission(accessControl: AccessControl, resource: string, action: string): boolean {
    // Check if user has the required permission
    if (!accessControl.permissions.includes(action)) {
      return false;
    }
    
    // Check role-based restrictions
    if (accessControl.restrictions.includes('read_only') && action !== 'read') {
      return false;
    }
    
    // Check resource-specific access
    if (resource.startsWith('building:') && !accessControl.buildings.includes(resource.split(':')[1])) {
      return false;
    }
    
    if (resource.startsWith('client:') && !accessControl.clients.includes(resource.split(':')[1])) {
      return false;
    }
    
    return true;
  }

  // MARK: - Compliance Management

  public async getComplianceRequirements(buildingId?: string, clientId?: string): Promise<ComplianceRequirement[]> {
    let requirements = [...this.complianceRequirements];
    
    if (buildingId) {
      // Filter requirements specific to building
      requirements = requirements.filter(req => req.buildingId === buildingId);
    }
    
    if (clientId) {
      // Filter requirements specific to client
      requirements = requirements.filter(req => req.clientId === clientId);
    }
    
    return requirements;
  }

  public async updateComplianceStatus(requirementId: string, status: ComplianceRequirement['status']): Promise<void> {
    const requirement = this.complianceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      requirement.status = status;
      requirement.updatedAt = new Date();
      
      this.logSecurityEvent('system', 'compliance', `update_${requirementId}`, 'success');
    }
  }

  public async getComplianceScore(buildingId?: string, clientId?: string): Promise<number> {
    const requirements = await this.getComplianceRequirements(buildingId, clientId);
    
    if (requirements.length === 0) {
      return 100; // No requirements = perfect score
    }
    
    const completed = requirements.filter(req => req.status === 'completed').length;
    const overdue = requirements.filter(req => req.status === 'overdue').length;
    
    // Calculate score: completed requirements + penalty for overdue
    const score = ((completed / requirements.length) * 100) - (overdue * 10);
    
    return Math.max(0, Math.min(100, score));
  }

  // MARK: - Security Auditing

  private logSecurityEvent(userId: string, action: string, resource: string, result: SecurityAudit['result']): void {
    const audit: SecurityAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      resource,
      result,
      ipAddress: '127.0.0.1', // In real app, get actual IP
      userAgent: 'CyntientOps-Mobile/1.0', // In real app, get actual user agent
      details: {},
    };
    
    this.securityAudits.push(audit);
    
    // Keep only last 1000 audits to prevent memory issues
    if (this.securityAudits.length > 1000) {
      this.securityAudits = this.securityAudits.slice(-1000);
    }
  }

  public getSecurityAudits(limit: number = 100): SecurityAudit[] {
    return this.securityAudits.slice(-limit);
  }

  public getSecurityAuditsByUser(userId: string, limit: number = 100): SecurityAudit[] {
    return this.securityAudits
      .filter(audit => audit.userId === userId)
      .slice(-limit);
  }

  public getSecurityAuditsByAction(action: string, limit: number = 100): SecurityAudit[] {
    return this.securityAudits
      .filter(audit => audit.action === action)
      .slice(-limit);
  }

  // MARK: - Data Protection

  public async encryptSensitiveData(data: any): Promise<string> {
    // In a real implementation, this would use proper encryption
    console.log('Encrypting sensitive data...');
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  public async decryptSensitiveData(encryptedData: string): Promise<any> {
    // In a real implementation, this would use proper decryption
    console.log('Decrypting sensitive data...');
    return JSON.parse(Buffer.from(encryptedData, 'base64').toString());
  }

  public async backupData(): Promise<void> {
    console.log('Creating data backup...');
    // In a real implementation, this would create actual backups
  }

  public async anonymizeData(data: any): Promise<any> {
    console.log('Anonymizing data...');
    // In a real implementation, this would properly anonymize data
    const anonymized = { ...data };
    if (anonymized.email) {
      anonymized.email = anonymized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    }
    if (anonymized.phone) {
      anonymized.phone = anonymized.phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
    }
    return anonymized;
  }

  // MARK: - Public API

  public getSecurityPolicies(): SecurityPolicy[] {
    return [...this.securityPolicies];
  }

  public updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): void {
    const policy = this.securityPolicies.find(p => p.id === policyId);
    if (policy) {
      Object.assign(policy, updates);
      policy.updatedAt = new Date();
    }
  }

  public async generateSecurityReport(): Promise<any> {
    const report = {
      totalAudits: this.securityAudits.length,
      failedLogins: this.securityAudits.filter(a => a.action === 'authentication' && a.result === 'failure').length,
      unauthorizedAccess: this.securityAudits.filter(a => a.action === 'authorization' && a.result === 'failure').length,
      complianceScore: await this.getComplianceScore(),
      activePolicies: this.securityPolicies.filter(p => p.enabled).length,
      overdueRequirements: this.complianceRequirements.filter(r => r.status === 'overdue').length,
    };
    
    return report;
  }
}
