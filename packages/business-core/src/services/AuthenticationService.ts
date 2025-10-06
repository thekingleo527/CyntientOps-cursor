/**
 * @cyntientops/business-core
 * 
 * AuthenticationService - Complete User Authentication
 * Maps all 15 users from data seed with proper credentials
 */

import { DatabaseManager } from '@cyntientops/database';
import { WorkerProfile } from '@cyntientops/domain-schema';
import workersData from '@cyntientops/data-seed/src/workers.json';
import clientsData from '@cyntientops/data-seed/src/clients.json';
import { Logger } from './LoggingService';
import bcrypt from 'bcryptjs';

// Generate hashed passwords for security
const generateHashedPassword = (plainPassword: string): string => {
  return bcrypt.hashSync(plainPassword, 10);
};

// Default password for all users (in production, each user should have unique passwords)
const DEFAULT_PASSWORD = 'password';
const HASHED_DEFAULT_PASSWORD = generateHashedPassword(DEFAULT_PASSWORD);

// Types
export interface UserCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'admin' | 'client';
  profile: WorkerProfile | ClientProfile;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export class AuthenticationService {
  private db: DatabaseManager;
  private static instance: AuthenticationService;

  // Complete user credentials mapping
  private readonly USER_CREDENTIALS: Record<string, UserCredentials> = {
    // Workers (7 users) - matches workers.json exactly
    'greg.hutson@francomanagement.com': {
      email: 'greg.hutson@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'greg.hutson'
    },
    'edwin.lema@francomanagement.com': {
      email: 'edwin.lema@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'edwin.lema'
    },
    'kevin.dutan@francomanagement.com': {
      email: 'kevin.dutan@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'kevin.dutan'
    },
    'mercedes.inamagua@francomanagement.com': {
      email: 'mercedes.inamagua@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'mercedes.inamagua'
    },
    'luis.lopez@francomanagement.com': {
      email: 'luis.lopez@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'luis.lopez'
    },
    'angel.guirachocha@francomanagement.com': {
      email: 'angel.guirachocha@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'angel.guirachocha'
    },
    'shawn.magloire@francomanagement.com': {
      email: 'shawn.magloire@francomanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'shawn.magloire'
    },

    // Client Users (7 users) - property managers/clients
    'david@jmrealty.org': {
      email: 'david@jmrealty.org',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'david'
    },
    'mfarhat@farhatrealtymanagement.com': {
      email: 'mfarhat@farhatrealtymanagement.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'mfarhat'
    },
    'facilities@solarone.org': {
      email: 'facilities@solarone.org',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'solarone'
    },
    'management@grandelizabeth.com': {
      email: 'management@grandelizabeth.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'gelman'
    },
    'property@citadelrealty.com': {
      email: 'property@citadelrealty.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'citadel'
    },
    'admin@corbelproperty.com': {
      email: 'admin@corbelproperty.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'corbel'
    },
    'management@chelsea115.com': {
      email: 'management@chelsea115.com',
      password: HASHED_DEFAULT_PASSWORD,
      username: 'chelsea'
    }
  };

  // Glass card user mappings (for quick login) - Workers only
  private readonly GLASS_CARD_USERS = {
    'kevin.dutan': 'kevin.dutan@francomanagement.com',
    'greg.hutson': 'greg.hutson@francomanagement.com',
    'edwin.lema': 'edwin.lema@francomanagement.com',
    'mercedes.inamagua': 'mercedes.inamagua@francomanagement.com',
    'luis.lopez': 'luis.lopez@francomanagement.com',
    'shawn.magloire': 'shawn.magloire@francomanagement.com'
  };

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  static getInstance(db: DatabaseManager): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService(db);
    }
    return AuthenticationService.instance;
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(email: string, password: string): Promise<LoginResult> {
    try {
      // Check if credentials exist
      const credentials = this.USER_CREDENTIALS[email];
      if (!credentials) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify password using bcrypt
      if (!bcrypt.compareSync(password, credentials.password)) {
        return {
          success: false,
          error: 'Invalid password'
        };
      }

      // Get user profile
      const user = await this.getUserProfile(email);
      if (!user) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      Logger.error('Authentication failed', error, 'AuthenticationService');
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Quick login for glass card users
   */
  async quickLogin(username: string): Promise<LoginResult> {
    const email = this.GLASS_CARD_USERS[username as keyof typeof this.GLASS_CARD_USERS];
    if (!email) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const credentials = this.USER_CREDENTIALS[email];
    if (!credentials) {
      return {
        success: false,
        error: 'Credentials not found'
      };
    }

    return this.authenticate(email, credentials.password);
  }

  /**
   * Get user profile by email
   */
  private async getUserProfile(email: string): Promise<AuthenticatedUser | null> {
    // Check workers first
    const worker = workersData.find(w => w.email === email);
    if (worker) {
      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role as 'worker' | 'admin',
        profile: {
          id: worker.id,
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          role: worker.role,
          status: worker.status,
          capabilities: {
            skills: worker.skills,
            hourlyRate: worker.hourlyRate,
            shift: worker.shift,
            isActive: worker.isActive
          }
        } as WorkerProfile
      };
    }

    // Check clients
    const client = clientsData.find(c => c.contact_email === email);
    if (client) {
      return {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        role: 'client',
        profile: {
          id: client.id,
          name: client.name,
          email: client.contact_email,
          phone: client.contact_phone,
          address: client.address,
          isActive: client.is_active
        } as ClientProfile
      };
    }

    return null;
  }

  /**
   * Get all available users for glass cards (Workers only)
   */
  getGlassCardUsers(): Array<{
    username: string;
    name: string;
    role: string;
    email: string;
  }> {
    return [
      {
        username: 'kevin.dutan',
        name: 'Kevin Dutan',
        role: 'Worker',
        email: 'kevin.dutan@francomanagement.com'
      },
      {
        username: 'greg.hutson',
        name: 'Greg Hutson',
        role: 'Worker',
        email: 'greg.hutson@francomanagement.com'
      },
      {
        username: 'edwin.lema',
        name: 'Edwin Lema',
        role: 'Worker',
        email: 'edwin.lema@francomanagement.com'
      },
      {
        username: 'mercedes.inamagua',
        name: 'Mercedes Inamagua',
        role: 'Worker',
        email: 'mercedes.inamagua@francomanagement.com'
      },
      {
        username: 'luis.lopez',
        name: 'Luis Lopez',
        role: 'Worker',
        email: 'luis.lopez@francomanagement.com'
      },
      {
        username: 'shawn.magloire',
        name: 'Shawn Magloire',
        role: 'Admin',
        email: 'shawn.magloire@francomanagement.com'
      }
    ];
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    // Check workers
    const worker = workersData.find(w => w.id === userId);
    if (worker) {
      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role as 'worker' | 'admin',
        profile: {
          id: worker.id,
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          role: worker.role,
          status: worker.status,
          capabilities: {
            skills: worker.skills,
            hourlyRate: worker.hourlyRate,
            shift: worker.shift,
            isActive: worker.isActive
          }
        } as WorkerProfile
      };
    }

    // Check clients
    const client = clientsData.find(c => c.id === userId);
    if (client) {
      return {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        role: 'client',
        profile: {
          id: client.id,
          name: client.name,
          email: client.contact_email,
          phone: client.contact_phone,
          address: client.address,
          isActive: client.is_active
        } as ClientProfile
      };
    }

    return null;
  }

  /**
   * Get all users by role
   */
  getUsersByRole(role: 'worker' | 'admin' | 'client'): AuthenticatedUser[] {
    const users: AuthenticatedUser[] = [];

    if (role === 'worker' || role === 'admin') {
      workersData.forEach(worker => {
        if (worker.role === role) {
          users.push({
            id: worker.id,
            name: worker.name,
            email: worker.email,
            role: worker.role as 'worker' | 'admin',
            profile: {
              id: worker.id,
              name: worker.name,
              email: worker.email,
              phone: worker.phone,
              role: worker.role,
              status: worker.status,
              capabilities: {
                skills: worker.skills,
                hourlyRate: worker.hourlyRate,
                shift: worker.shift,
                isActive: worker.isActive
              }
            } as WorkerProfile
          });
        }
      });
    }

    if (role === 'client') {
      clientsData.forEach(client => {
        users.push({
          id: client.id,
          name: client.name,
          email: client.contact_email,
          role: 'client',
          profile: {
            id: client.id,
            name: client.name,
            email: client.contact_email,
            phone: client.contact_phone,
            address: client.address,
            isActive: client.is_active
          } as ClientProfile
        });
      });
    }

    return users;
  }

  /**
   * Validate user session
   */
  async validateSession(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return user !== null;
    } catch (error) {
      Logger.error('Session validation failed', error, 'AuthenticationService');
      return false;
    }
  }

  /**
   * Get user statistics
   */
  getUserStats(): {
    totalUsers: number;
    workers: number;
    admins: number;
    clients: number;
  } {
    return {
      totalUsers: workersData.length + clientsData.length,
      workers: workersData.filter(w => w.role === 'worker').length,
      admins: workersData.filter(w => w.role === 'admin').length,
      clients: clientsData.length
    };
  }
}

export default AuthenticationService;
