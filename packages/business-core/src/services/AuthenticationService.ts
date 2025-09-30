/**
 * @cyntientops/business-core
 * 
 * AuthenticationService - Complete User Authentication
 * Maps all 15 users from data seed with proper credentials
 */

import { DatabaseManager } from '@cyntientops/database';
import { WorkerProfile } from '@cyntientops/domain-schema';
import workersData from '@cyntientops/data-seed/workers.json';
import clientsData from '@cyntientops/data-seed/clients.json';

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
    // Workers (7 users)
    'greg.hutson@francomanagement.com': {
      email: 'greg.hutson@francomanagement.com',
      password: 'password',
      username: 'greg.hutson'
    },
    'edwin.lema@francomanagement.com': {
      email: 'edwin.lema@francomanagement.com',
      password: 'password',
      username: 'edwin.lema'
    },
    'kevin.dutan@francomanagement.com': {
      email: 'kevin.dutan@francomanagement.com',
      password: 'password',
      username: 'kevin.dutan'
    },
    'moises.farhat@francomanagement.com': {
      email: 'moises.farhat@francomanagement.com',
      password: 'password',
      username: 'mfarhat'
    },
    'michelle@francomanagement.com': {
      email: 'michelle@francomanagement.com',
      password: 'password',
      username: 'michelle'
    },
    'david.edelman@francomanagement.com': {
      email: 'david.edelman@francomanagement.com',
      password: 'password',
      username: 'david'
    },
    'jerry.edelman@francomanagement.com': {
      email: 'jerry.edelman@francomanagement.com',
      password: 'password',
      username: 'jedelman'
    },

    // Client Users (7 users)
    'david@jmrealty.org': {
      email: 'david@jmrealty.org',
      password: 'password',
      username: 'david'
    },
    'mfarhat@farhatrealtymanagement.com': {
      email: 'mfarhat@farhatrealtymanagement.com',
      password: 'password',
      username: 'mfarhat'
    },
    'facilities@solarone.org': {
      email: 'facilities@solarone.org',
      password: 'password',
      username: 'solarone'
    },
    'contact@gelmanrealty.com': {
      email: 'contact@gelmanrealty.com',
      password: 'password',
      username: 'gelman'
    },
    'admin@rubinmuseum.org': {
      email: 'admin@rubinmuseum.org',
      password: 'password',
      username: 'rubin'
    },
    'operations@cyntientops.com': {
      email: 'operations@cyntientops.com',
      password: 'password',
      username: 'cyntientops'
    },
    'admin@cyntientops.com': {
      email: 'admin@cyntientops.com',
      password: 'password',
      username: 'admin'
    }
  };

  // Glass card user mappings (for quick login)
  private readonly GLASS_CARD_USERS = {
    'kevin.dutan': 'kevin.dutan@francomanagement.com',
    'greg.hutson': 'greg.hutson@francomanagement.com',
    'mfarhat': 'mfarhat@farhatrealtymanagement.com',
    'michelle': 'michelle@francomanagement.com',
    'david': 'david@jmrealty.org',
    'jedelman': 'jerry.edelman@francomanagement.com'
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

      // Verify password
      if (credentials.password !== password) {
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
      console.error('[AuthenticationService] Authentication failed:', error);
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
   * Get all available users for glass cards
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
        username: 'mfarhat',
        name: 'Moises Farhat',
        role: 'Admin',
        email: 'mfarhat@farhatrealtymanagement.com'
      },
      {
        username: 'michelle',
        name: 'Michelle',
        role: 'Admin',
        email: 'michelle@francomanagement.com'
      },
      {
        username: 'david',
        name: 'David Edelman',
        role: 'Client',
        email: 'david@jmrealty.org'
      },
      {
        username: 'jedelman',
        name: 'Jerry Edelman',
        role: 'Admin',
        email: 'jerry.edelman@francomanagement.com'
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
      console.error('[AuthenticationService] Session validation failed:', error);
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
