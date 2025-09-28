/**
 * 🔐 Authentication Service
 * Purpose: Role-based authentication and session management
 */

import { UserRole, WorkerProfile, ClientProfile } from '@cyntientops/domain-schema';
import { DatabaseManager } from '@cyntientops/database';

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
  private currentUser: AuthUser | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor(database: DatabaseManager) {
    this.database = database;
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
      console.error('Login failed:', error);
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
      console.error('Logout failed:', error);
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
      console.error('Session restoration failed:', error);
      return null;
    }
  }

  /**
   * Validate user credentials
   */
  private async validateCredentials(credentials: LoginCredentials): Promise<AuthUser | null> {
    // Demo credentials for testing
    const demoUsers = [
      {
        id: 'worker-1',
        email: 'worker@cyntientops.com',
        password: 'worker123',
        role: 'worker' as UserRole,
        name: 'John Worker',
      },
      {
        id: 'admin-1',
        email: 'admin@cyntientops.com',
        password: 'admin123',
        role: 'admin' as UserRole,
        name: 'Admin User',
      },
      {
        id: 'client-1',
        email: 'client@cyntientops.com',
        password: 'client123',
        role: 'client' as UserRole,
        name: 'Client User',
      },
    ];

    const demoUser = demoUsers.find(
      user => user.email === credentials.email && user.password === credentials.password
    );

    if (demoUser) {
      // Load profile from database
      const profile = await this.loadUserProfile(demoUser.id, demoUser.role);
      
      return {
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        name: demoUser.name,
        profile,
        isAuthenticated: false, // Will be set to true after session creation
      };
    }

    return null;
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string, role: UserRole): Promise<WorkerProfile | ClientProfile | undefined> {
    try {
      if (role === 'worker') {
        const workers = await this.database.getWorkers();
        const worker = workers.find(w => w.id === userId);
        return worker;
      } else if (role === 'client') {
        // In a real implementation, this would load client profile
        return undefined;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
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
      console.log('Session stored for user:', user.id);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Clear session from database
   */
  private async clearSession(userId: string): Promise<void> {
    try {
      // In a real implementation, this would clear from sessions table
      console.log('Session cleared for user:', userId);
    } catch (error) {
      console.error('Failed to clear session:', error);
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
      console.error('Failed to get stored session:', error);
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthUser): boolean {
    if (!session.lastLogin) return false;
    
    const now = new Date();
    const sessionAge = now.getTime() - session.lastLogin.getTime();
    
    return sessionAge < this.SESSION_DURATION;
  }

  /**
   * Set session timeout
   */
  private setSessionTimeout(): void {
    this.clearSessionTimeout();
    
    this.sessionTimeout = setTimeout(() => {
      console.log('Session expired, logging out user');
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
   * Get demo login options for testing
   */
  getDemoCredentials(): LoginCredentials[] {
    return [
      { email: 'worker@cyntientops.com', password: 'worker123' },
      { email: 'admin@cyntientops.com', password: 'admin123' },
      { email: 'client@cyntientops.com', password: 'client123' },
    ];
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
      console.error('Failed to check building access:', error);
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
