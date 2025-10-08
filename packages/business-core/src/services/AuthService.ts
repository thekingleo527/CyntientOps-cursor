/**
 * 🔐 Authentication Service
 * Purpose: Role-based authentication and session management
 */

import { UserRole, WorkerProfile, ClientProfile } from '@cyntientops/domain-schema';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataService } from './OperationalDataService';
import { Logger } from './LoggingService';
import { PasswordSecurityService } from '../security/PasswordSecurityService';
import { AdvancedSecurityManager } from '../security/AdvancedSecurityManager';
import { SecureStorageService } from '../security/SecureStorageService';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profile?: WorkerProfile | ClientProfile;
  isAuthenticated: boolean;
  lastLogin?: Date;
  sessionToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private database: DatabaseManager;
  private passwordSecurity: PasswordSecurityService;
  private securityManager: AdvancedSecurityManager;
  private secureStorage: SecureStorageService;
  private currentUser: AuthUser | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor(database: DatabaseManager) {
    this.database = database;
    this.securityManager = AdvancedSecurityManager.getInstance(database, {});
    this.secureStorage = SecureStorageService.getInstance(database, process.env.ENCRYPTION_KEY || 'default-key');
    this.passwordSecurity = PasswordSecurityService.getInstance(database, this.securityManager, this.secureStorage);
  }

  public static getInstance(database: DatabaseManager): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(database);
    }
    return AuthService.instance;
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // In a real implementation, this would validate against a secure auth system
      // For now, we'll use demo credentials and local database lookup
      const user = await this.validateCredentials(credentials);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      this.currentUser = {
        ...user,
        isAuthenticated: true,
        lastLogin: new Date(),
        sessionToken,
      };

      // Store session in database
      await this.storeSession(this.currentUser);

      // Set session timeout
      this.setSessionTimeout();

      console.log(`User ${user.email} logged in successfully`);
      return this.currentUser;
    } catch (error) {
      Logger.error('Login failed:', undefined, 'AuthService');
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      if (this.currentUser) {
        // Clear session from database
        await this.clearSession(this.currentUser.id);
        
        console.log(`User ${this.currentUser.email} logged out`);
      }

      this.currentUser = null;
      this.clearSessionTimeout();

    } catch (error) {
      Logger.error('Logout failed:', undefined, 'AuthService');
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
    }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser?.isAuthenticated || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
    }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
    }

  /**
   * Restore session from stored data
   */
  async restoreSession(): Promise<AuthUser | null> {
    try {
      // In a real implementation, this would check stored session tokens
      // For demo purposes, we'll check if there's a valid session in the database
      const session = await this.getStoredSession();
      
      if (session && this.isSessionValid(session)) {
        this.currentUser = session;
        this.setSessionTimeout();
        return session;
    }

      return null;
    } catch (error) {
      Logger.error('Session restoration failed:', undefined, 'AuthService');
      return null;
    }
  }

  /**
   * Validate user credentials
   */
  private async validateCredentials(credentials: LoginCredentials): Promise<AuthUser | null> {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const operationalData = OperationalDataService.getInstance();

    // Ensure operational data is ready for profile hydration
    await operationalData.initialize();

    // 1. Check workers (includes admins/managers)
    const workers = await this.database.getWorkers();
    const worker = workers.find(
      (row: any) => (row.email || '').toLowerCase() === normalizedEmail
    );

    if (worker && await this.passwordMatches(credentials.password, worker.password)) {
      const profile = operationalData.getWorkerById(worker.id);

      return {
  // id: worker.id,
        email: worker.email,
        role: (worker.role as UserRole) || 'worker',
        name: worker.name,
        profile,
        isAuthenticated: false,
      };
    }

    // 2. Check client contact emails (shared portal password)
    const clients = await this.database.getClients();
    const client = clients.find((row: any) => {
      const email = (row.email || row.contact_email || '').toLowerCase();
      return email === normalizedEmail;
    });

    if (client && await this.passwordMatches(credentials.password, 'client123')) {
      const profile = operationalData.getClientById(client.id);

      return {
  // id: client.id,
        email: normalizedEmail,
        role: 'client',
        name: client.name,
        profile,
        isAuthenticated: false,
      };
    }

    return null;
    }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string, role: UserRole): Promise<WorkerProfile | ClientProfile | undefined> {
    try {
      const operationalData = OperationalDataService.getInstance();
      await operationalData.initialize();

      if (role === 'worker' || role === 'admin') {
        return operationalData.getWorkerById(userId);
    }

      if (role === 'client') {
        return operationalData.getClientById(userId);
    }
    } catch (error) {
      Logger.error('Failed to load user profile:', undefined, 'AuthService');
    }

    return undefined;
    }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

  /**
   * Store session in database
   */
  private async storeSession(user: AuthUser): Promise<void> {
    try {
      // In a real implementation, this would store in a sessions table
      // For now, we'll just log it
      Logger.debug('Session stored for user:', undefined, 'AuthService');
    } catch (error) {
      Logger.error('Failed to store session:', undefined, 'AuthService');
    }
  }

  /**
   * Clear session from database
   */
  private async clearSession(userId: string): Promise<void> {
    try {
      // In a real implementation, this would clear from sessions table
      Logger.debug('Session cleared for user:', undefined, 'AuthService');
    } catch (error) {
      Logger.error('Failed to clear session:', undefined, 'AuthService');
    }
  }

  /**
   * Get stored session
   */
  private async getStoredSession(): Promise<AuthUser | null> {
    try {
      // In a real implementation, this would retrieve from sessions table
      return null;
    } catch (error) {
      Logger.error('Failed to get stored session:', undefined, 'AuthService');
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthUser): boolean {
    if (!session.lastLogin) return false;
  // const now = new Date();
    const sessionAge = now.getTime() - session.lastLogin.getTime();
    
    return sessionAge < this.SESSION_DURATION;
    }

  /**
   * Set session timeout
   */
  private setSessionTimeout(): void {
    this.clearSessionTimeout();
    
    this.sessionTimeout = setTimeout(() => {
      Logger.debug('Session expired, logging out user', undefined, 'AuthService');
      this.logout();
    }, this.SESSION_DURATION);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Hash a password for secure storage
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // TODO: Implement proper password hashing with expo-crypto
      // const bcrypt = require('bcryptjs');
      // return await bcrypt.hash(password, 12);
      return password; // Placeholder - should use proper hashing
    } catch (error) {
      Logger.error('Password hashing failed:', error, 'AuthService');
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Get demo login options for testing
   * Note: These use plain text passwords for demo purposes
   * In production, all passwords should be hashed
   */
  getDemoCredentials(): LoginCredentials[] {
    return [
  // { email: 'shawn.magloire@francomanagement.com', password: 'password' },
      { email: 'greg.hutson@francomanagement.com', password: 'password' },
      { email: 'david@jmrealty.org', password: 'client123' },
    ];
  }

  private async passwordMatches(input: string, stored?: string | null, userId?: string): Promise<boolean> {
    if (!stored) {
      return false;
    }

    try {
      // If we have a userId, use the enhanced password security service
      if (userId) {
        return await this.passwordSecurity.verifyPassword(input, userId);
      }

      // Fallback to legacy password verification for backward compatibility
      // Check if stored password is already hashed (starts with $2a$ or $2b$)
      if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
        // TODO: Implement proper password verification with expo-crypto
        // const bcrypt = require('bcryptjs');
        // return await bcrypt.compare(input, stored);
        return stored === input; // Placeholder - should use proper verification
      }
      
      // For backward compatibility with plain text passwords (migration phase)
      // Check if this is a legacy plain text password
      if (stored === input) {
        // Legacy password found - log for migration tracking
        Logger.warn('Legacy plain text password detected - consider migrating to hashed format', 
          { userId: input }, 'AuthService');
        return true;
      }
      
      // Password doesn't match
      return false;
    } catch (error) {
      Logger.error('Password verification failed:', error, 'AuthService');
      return false;
    }
  }

  /**
   * Check if user can access specific building
   */
  async canAccessBuilding(buildingId: string): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      if (this.currentUser.role === 'admin' || this.currentUser.role === 'manager' || this.currentUser.role === 'super_admin') {
        return true; // Admins can access all buildings
      }

      if (this.currentUser.role === 'worker') {
        const buildings = await this.database.getBuildingsForWorker(this.currentUser.id);
        return buildings.some(b => b.id === buildingId);
      }

      if (this.currentUser.role === 'client') {
        // In a real implementation, this would check client's portfolio
        return true;
      }

      return false;
    } catch (error) {
      Logger.error('Failed to check building access:', undefined, 'AuthService');
      return false;
    }
  }

  /**
   * Check if user can perform specific action
   */
  canPerformAction(action: string): boolean {
    if (!this.currentUser) return false;
    
    const permissions = {
      'worker': ['view_tasks', 'complete_tasks', 'add_photos', 'clock_in', 'clock_out'],
      'admin': ['view_all', 'assign_tasks', 'manage_workers', 'view_reports', 'manage_buildings'],
      'manager': ['view_all', 'assign_tasks', 'manage_workers', 'view_reports'],
      'super_admin': ['*'], // All permissions
      'client': ['view_portfolio', 'view_reports', 'request_services'],
    };

    const userPermissions = permissions[this.currentUser.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
    }
}
