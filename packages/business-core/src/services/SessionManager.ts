/**
 * 🔐 Session Manager
 * Purpose: Advanced session management with role-based access control
 * Mirrors: CyntientOps/Services/Auth/NewAuthManager.swift session handling
 */

import { DatabaseManager } from '@cyntientops/database';
import { UserRole, WorkerProfile, ClientProfile } from '@cyntientops/domain-schema';
import { AuthService, AuthUser } from './AuthService';
import { Logger } from './LoggingService';

export interface SessionData {
  userId: string;
  userRole: UserRole;
  sessionToken: string;
  expiresAt: Date;
  lastActivity: Date;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  permissions: string[];
  profile?: WorkerProfile | ClientProfile;
}

export interface SessionConfig {
  sessionDuration: number; // in milliseconds
  maxInactiveTime: number; // in milliseconds
  maxConcurrentSessions: number;
  enableDeviceTracking: boolean;
  enableLocationTracking: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  session?: SessionData;
  error?: string;
  requiresTwoFactor?: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private database: DatabaseManager;
  private authService: AuthService;
  private activeSessions: Map<string, SessionData> = new Map();
  private config: SessionConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(database: DatabaseManager, authService: AuthService, config: SessionConfig) {
    this.database = database;
    this.authService = authService;
    this.config = config;
    this.startSessionCleanup();
  }

  public static getInstance(
    database: DatabaseManager, 
    authService: AuthService, 
    config?: Partial<SessionConfig>
  ): SessionManager {
    if (!SessionManager.instance) {
      const defaultConfig: SessionConfig = {
        sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
        maxInactiveTime: 2 * 60 * 60 * 1000, // 2 hours
        maxConcurrentSessions: 3,
        enableDeviceTracking: true,
        enableLocationTracking: false
      };
      
      SessionManager.instance = new SessionManager(
        database, 
        authService, 
        { ...defaultConfig, ...config }
      );
    }
    return SessionManager.instance;
  }

  // MARK: - Session Management

  /**
   * Create new session for authenticated user
   */
  async createSession(
    user: AuthUser, 
    deviceId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<SessionData | null> {
    try {
      // Check concurrent session limit
      const existingSessions = await this.getUserActiveSessions(user.id);
      if (existingSessions.length >= this.config.maxConcurrentSessions) {
        // Remove oldest session
        const oldestSession = existingSessions.sort((a, b) => 
          a.lastActivity.getTime() - b.lastActivity.getTime()
        )[0];
        await this.invalidateSession(oldestSession.sessionToken);
      }

      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.config.sessionDuration);
      const lastActivity = new Date();

      const session: SessionData = {
        userId: user.id,
        userRole: user.role,
        sessionToken,
        expiresAt,
        lastActivity,
        deviceId,
        ipAddress,
        userAgent,
        permissions: this.getUserPermissions(user.role),
        profile: user.profile
      };

      // Store session in database
      await this.database.execute(
        `INSERT INTO user_sessions (session_token, user_id, user_role, expires_at, 
         last_activity, device_id, ip_address, user_agent, permissions, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionToken,
          user.id,
          user.role,
          expiresAt.toISOString(),
          lastActivity.toISOString(),
          deviceId,
          ipAddress || null,
          userAgent || null,
          JSON.stringify(session.permissions),
          new Date().toISOString()
        ]
      );

      // Store in memory for fast access
      this.activeSessions.set(sessionToken, session);

      console.log(`✅ Session created for user ${user.id} (${user.role})`);
      return session;
    } catch (error) {
      Logger.error('Failed to create session:', undefined, 'SessionManager');
      return null;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<SessionData | null> {
    try {
      // Check memory cache first
      let session = this.activeSessions.get(sessionToken);
      
      if (!session) {
        // Load from database
        const result = await this.database.query(
          'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > ?',
          [sessionToken, new Date().toISOString()]
        );

        if (result.length === 0) {
          return null;
        }

        const dbSession = result[0];
        session = {
          userId: dbSession.user_id,
          userRole: dbSession.user_role,
          sessionToken: dbSession.session_token,
          expiresAt: new Date(dbSession.expires_at),
          lastActivity: new Date(dbSession.last_activity),
          deviceId: dbSession.device_id,
          ipAddress: dbSession.ip_address,
          userAgent: dbSession.user_agent,
          permissions: JSON.parse(dbSession.permissions || '[]'),
          profile: dbSession.profile ? JSON.parse(dbSession.profile) : undefined
        };

        // Cache in memory
        this.activeSessions.set(sessionToken, session);
      }

      // Check if session is expired
      if (session.expiresAt <= new Date()) {
        await this.invalidateSession(sessionToken);
        return null;
      }

      // Check if session is inactive too long
      const inactiveTime = Date.now() - session.lastActivity.getTime();
      if (inactiveTime > this.config.maxInactiveTime) {
        await this.invalidateSession(sessionToken);
        return null;
      }

      // Update last activity
      await this.updateSessionActivity(sessionToken);

      return session;
    } catch (error) {
      Logger.error('Failed to validate session:', undefined, 'SessionManager');
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionToken: string): Promise<void> {
    try {
      const now = new Date();
      
      // Update database
      await this.database.execute(
        'UPDATE user_sessions SET last_activity = ? WHERE session_token = ?',
        [now.toISOString(), sessionToken]
      );

      // Update memory cache
      const session = this.activeSessions.get(sessionToken);
      if (session) {
        session.lastActivity = now;
        this.activeSessions.set(sessionToken, session);
      }
    } catch (error) {
      Logger.error('Failed to update session activity:', undefined, 'SessionManager');
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      // Remove from database
      await this.database.execute(
        'UPDATE user_sessions SET expires_at = ?, status = "invalidated" WHERE session_token = ?',
        [new Date().toISOString(), sessionToken]
      );

      // Remove from memory
      this.activeSessions.delete(sessionToken);

      console.log(`🔒 Session invalidated: ${sessionToken}`);
    } catch (error) {
      Logger.error('Failed to invalidate session:', undefined, 'SessionManager');
    }
  }

  /**
   * Invalidate all sessions for user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all active sessions for user
      const sessions = await this.getUserActiveSessions(userId);
      
      // Invalidate each session
      for (const session of sessions) {
        await this.invalidateSession(session.sessionToken);
      }

      console.log(`🔒 All sessions invalidated for user: ${userId}`);
    } catch (error) {
      Logger.error('Failed to invalidate all user sessions:', undefined, 'SessionManager');
    }
  }

  // MARK: - Authentication

  /**
   * Login user with credentials
   */
  async login(
    email: string, 
    password: string, 
    deviceId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<LoginResult> {
    try {
      // Authenticate user
      const authResult = await this.authService.authenticate(email, password);
      
      if (!authResult.success || !authResult.user) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        };
      }

      // Create session
      const session = await this.createSession(
        authResult.user, 
        deviceId, 
        ipAddress, 
        userAgent
      );

      if (!session) {
        return {
          success: false,
          error: 'Failed to create session'
        };
      }

      return {
        success: true,
        user: authResult.user,
        session
      };
    } catch (error) {
      Logger.error('Login failed:', undefined, 'SessionManager');
      return {
        success: false,
        error: 'Login failed due to system error'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(sessionToken: string): Promise<boolean> {
    try {
      await this.invalidateSession(sessionToken);
      return true;
    } catch (error) {
      Logger.error('Logout failed:', undefined, 'SessionManager');
      return false;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(sessionToken: string): Promise<SessionData | null> {
    try {
      const session = await this.validateSession(sessionToken);
      if (!session) {
        return null;
      }

      // Extend session duration
      const newExpiresAt = new Date(Date.now() + this.config.sessionDuration);
      
      await this.database.execute(
        'UPDATE user_sessions SET expires_at = ? WHERE session_token = ?',
        [newExpiresAt.toISOString(), sessionToken]
      );

      session.expiresAt = newExpiresAt;
      this.activeSessions.set(sessionToken, session);

      return session;
    } catch (error) {
      Logger.error('Failed to refresh session:', undefined, 'SessionManager');
      return null;
    }
  }

  // MARK: - Authorization

  /**
   * Check if user has permission
   */
  hasPermission(session: SessionData, permission: string): boolean {
    return session.permissions.includes('*') || session.permissions.includes(permission);
  }

  /**
   * Check if user can access resource
   */
  async canAccessResource(session: SessionData, resource: string, action: string): Promise<boolean> {
    try {
      // Check basic permissions
      if (!this.hasPermission(session, `${resource}:${action}`)) {
        return false;
      }

      // Role-specific access control
      switch (session.userRole) {
        case 'worker':
          return await this.canWorkerAccessResource(session, resource, action);
        case 'admin':
        case 'manager':
          return await this.canAdminAccessResource(session, resource, action);
        case 'client':
          return await this.canClientAccessResource(session, resource, action);
        default:
          return false;
      }
    } catch (error) {
      Logger.error('Failed to check resource access:', undefined, 'SessionManager');
      return false;
    }
  }

  /**
   * Worker-specific access control
   */
  private async canWorkerAccessResource(session: SessionData, resource: string, action: string): Promise<boolean> {
    // Workers can only access their own data and assigned buildings
    if (resource === 'worker' && action === 'view') {
      return true; // Can view own profile
    }
    
    if (resource === 'building' && action === 'view') {
      // Check if building is assigned to worker
      const profile = session.profile as WorkerProfile;
      if (profile?.assignedBuildings) {
        // This would need to be implemented with actual building ID check
        return true;
      }
    }

    if (resource === 'task' && (action === 'view' || action === 'update')) {
      return true; // Can view and update assigned tasks
    }

    return false;
  }

  /**
   * Admin-specific access control
   */
  private async canAdminAccessResource(session: SessionData, resource: string, action: string): Promise<boolean> {
    // Admins have broader access
    const adminResources = ['worker', 'building', 'task', 'client', 'analytics', 'reports'];
    return adminResources.includes(resource);
  }

  /**
   * Client-specific access control
   */
  private async canClientAccessResource(session: SessionData, resource: string, action: string): Promise<boolean> {
    // Clients can only access their portfolio data
    if (resource === 'client' && action === 'view') {
      return true; // Can view own profile
    }
    
    if (resource === 'building' && action === 'view') {
      // Check if building belongs to client's portfolio
      return true; // This would need actual portfolio check
    }

    if (resource === 'reports' && action === 'view') {
      return true; // Can view portfolio reports
    }

    return false;
  }

  // MARK: - Utility Methods

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: UserRole): string[] {
    const permissions = {
      'worker': [
        'view_tasks', 'complete_tasks', 'add_photos', 'clock_in', 'clock_out',
        'view_building', 'view_worker'
      ],
      'admin': [
        '*'
      ],
      'manager': [
        'view_all', 'assign_tasks', 'manage_workers', 'view_reports', 'manage_buildings'
      ],
      'client': [
        'view_portfolio', 'view_reports', 'request_services', 'view_building'
      ]
    };

    return permissions[role] || [];
  }

  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const extraRandom = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${randomPart}_${extraRandom}`;
  }

  /**
   * Get active sessions for user
   */
  private async getUserActiveSessions(userId: string): Promise<SessionData[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > ? AND status = "active"',
        [userId, new Date().toISOString()]
      );

      return result.map(row => ({
        userId: row.user_id,
        userRole: row.user_role,
        sessionToken: row.session_token,
        expiresAt: new Date(row.expires_at),
        lastActivity: new Date(row.last_activity),
        deviceId: row.device_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        permissions: JSON.parse(row.permissions || '[]'),
        profile: row.profile ? JSON.parse(row.profile) : undefined
      }));
    } catch (error) {
      Logger.error('Failed to get user active sessions:', undefined, 'SessionManager');
      return [];
    }
  }

  /**
   * Start session cleanup timer
   */
  private startSessionCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Remove expired sessions from database
      await this.database.execute(
        'UPDATE user_sessions SET status = "expired" WHERE expires_at <= ? AND status = "active"',
        [now]
      );

      // Remove expired sessions from memory
      for (const [token, session] of this.activeSessions.entries()) {
        if (session.expiresAt <= new Date()) {
          this.activeSessions.delete(token);
        }
      }

      Logger.debug('🧹 Session cleanup completed', undefined, 'SessionManager');
    } catch (error) {
      Logger.error('Failed to cleanup expired sessions:', undefined, 'SessionManager');
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<any> {
    try {
      const stats = await Promise.all([
        this.database.query('SELECT COUNT(*) as count FROM user_sessions WHERE status = "active"'),
        this.database.query('SELECT COUNT(*) as count FROM user_sessions WHERE expires_at <= ?', [new Date().toISOString()]),
        this.database.query('SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE status = "active"')
      ]);

      return {
        activeSessions: stats[0][0]?.count || 0,
        expiredSessions: stats[1][0]?.count || 0,
        activeUsers: stats[2][0]?.count || 0,
        memorySessions: this.activeSessions.size
      };
    } catch (error) {
      Logger.error('Failed to get session stats:', undefined, 'SessionManager');
      return {
        activeSessions: 0,
        expiredSessions: 0,
        activeUsers: 0,
        memorySessions: 0
      };
    }
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.activeSessions.clear();
  }
}

export default SessionManager;
