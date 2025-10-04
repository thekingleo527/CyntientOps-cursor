/**
 * 🔐 Secure Credential Manager
 * Purpose: Secure storage and retrieval of sensitive credentials
 * Features: Environment variable validation, encrypted storage, credential rotation
 */

import { AdvancedSecurityManager } from './AdvancedSecurityManager';

export interface SecureCredentials {
  quickbooks: {
    clientId: string;
    clientSecret: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  nycApis: {
    dofApiKey?: string;
    dsnyApiKey?: string;
    fdnyApiKey?: string;
  };
}

export class CredentialManager {
  private static instance: CredentialManager;
  private securityManager: AdvancedSecurityManager;
  private credentials: SecureCredentials | null = null;

  private constructor(securityManager: AdvancedSecurityManager) {
    this.securityManager = securityManager;
  }

  public static getInstance(securityManager: AdvancedSecurityManager): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager(securityManager);
    }
    return CredentialManager.instance;
  }

  /**
   * Initialize and validate all required credentials
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing Credential Manager...');

      // Validate QuickBooks credentials
      const quickbooksClientId = process.env.QUICKBOOKS_CLIENT_ID;
      const quickbooksClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

      if (!quickbooksClientId || !quickbooksClientSecret) {
        throw new Error('QuickBooks credentials not found in environment variables');
      }

      // Validate Supabase credentials
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found in environment variables');
      }

      // Validate NYC API keys (optional)
      const dofApiKey = process.env.DOF_API_KEY;
      const dsnyApiKey = process.env.DSNY_API_KEY;
      const fdnyApiKey = process.env.FDNY_API_KEY;

      this.credentials = {
        quickbooks: {
          clientId: quickbooksClientId,
          clientSecret: quickbooksClientSecret,
        },
        supabase: {
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          serviceRoleKey: supabaseServiceRoleKey,
        },
        nycApis: {
          dofApiKey,
          dsnyApiKey,
          fdnyApiKey,
        },
      };

      // Encrypt sensitive credentials
      await this.encryptCredentials();

      console.log('✅ Credential Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Credential Manager:', error);
      throw error;
    }
  }

  /**
   * Get QuickBooks credentials
   */
  async getQuickBooksCredentials(): Promise<{ clientId: string; clientSecret: string }> {
    if (!this.credentials) {
      throw new Error('Credential Manager not initialized');
    }

    return {
      clientId: this.credentials.quickbooks.clientId,
      clientSecret: this.credentials.quickbooks.clientSecret,
    };
  }

  /**
   * Get Supabase credentials
   */
  async getSupabaseCredentials(): Promise<{ url: string; anonKey: string; serviceRoleKey?: string }> {
    if (!this.credentials) {
      throw new Error('Credential Manager not initialized');
    }

    return this.credentials.supabase;
  }

  /**
   * Get NYC API credentials
   */
  async getNYCAPICredentials(): Promise<{ dofApiKey?: string; dsnyApiKey?: string; fdnyApiKey?: string }> {
    if (!this.credentials) {
      throw new Error('Credential Manager not initialized');
    }

    return this.credentials.nycApis;
  }

  /**
   * Encrypt sensitive credentials for secure storage
   */
  private async encryptCredentials(): Promise<void> {
    if (!this.credentials) return;

    try {
      // Encrypt QuickBooks credentials
      this.credentials.quickbooks.clientId = await this.securityManager.encryptData(this.credentials.quickbooks.clientId);
      this.credentials.quickbooks.clientSecret = await this.securityManager.encryptData(this.credentials.quickbooks.clientSecret);

      // Encrypt Supabase service role key if present
      if (this.credentials.supabase.serviceRoleKey) {
        this.credentials.supabase.serviceRoleKey = await this.securityManager.encryptData(this.credentials.supabase.serviceRoleKey);
      }

      // Encrypt NYC API keys if present
      if (this.credentials.nycApis.dofApiKey) {
        this.credentials.nycApis.dofApiKey = await this.securityManager.encryptData(this.credentials.nycApis.dofApiKey);
      }
      if (this.credentials.nycApis.dsnyApiKey) {
        this.credentials.nycApis.dsnyApiKey = await this.securityManager.encryptData(this.credentials.nycApis.dsnyApiKey);
      }
      if (this.credentials.nycApis.fdnyApiKey) {
        this.credentials.nycApis.fdnyApiKey = await this.securityManager.encryptData(this.credentials.nycApis.fdnyApiKey);
      }

    } catch (error) {
      console.error('Failed to encrypt credentials:', error);
      throw error;
    }
  }

  /**
   * Decrypt credentials for use
   */
  async decryptCredentials(): Promise<SecureCredentials> {
    if (!this.credentials) {
      throw new Error('Credential Manager not initialized');
    }

    try {
      const decryptedCredentials: SecureCredentials = {
        quickbooks: {
          clientId: await this.securityManager.decryptData(this.credentials.quickbooks.clientId),
          clientSecret: await this.securityManager.decryptData(this.credentials.quickbooks.clientSecret),
        },
        supabase: {
          url: this.credentials.supabase.url, // URL doesn't need encryption
          anonKey: this.credentials.supabase.anonKey, // Anon key is safe to expose
          serviceRoleKey: this.credentials.supabase.serviceRoleKey 
            ? await this.securityManager.decryptData(this.credentials.supabase.serviceRoleKey)
            : undefined,
        },
        nycApis: {
          dofApiKey: this.credentials.nycApis.dofApiKey 
            ? await this.securityManager.decryptData(this.credentials.nycApis.dofApiKey)
            : undefined,
          dsnyApiKey: this.credentials.nycApis.dsnyApiKey 
            ? await this.securityManager.decryptData(this.credentials.nycApis.dsnyApiKey)
            : undefined,
          fdnyApiKey: this.credentials.nycApis.fdnyApiKey 
            ? await this.securityManager.decryptData(this.credentials.nycApis.fdnyApiKey)
            : undefined,
        },
      };

      return decryptedCredentials;

    } catch (error) {
      console.error('Failed to decrypt credentials:', error);
      throw error;
    }
  }

  /**
   * Validate credential format and security
   */
  private validateCredentials(): void {
    if (!this.credentials) return;

    // Validate QuickBooks credentials
    if (this.credentials.quickbooks.clientId.length < 10) {
      throw new Error('Invalid QuickBooks Client ID format');
    }
    if (this.credentials.quickbooks.clientSecret.length < 10) {
      throw new Error('Invalid QuickBooks Client Secret format');
    }

    // Validate Supabase credentials
    if (!this.credentials.supabase.url.startsWith('https://')) {
      throw new Error('Supabase URL must use HTTPS');
    }
    if (this.credentials.supabase.anonKey.length < 20) {
      throw new Error('Invalid Supabase Anon Key format');
    }

    console.log('✅ Credential validation passed');
  }

  /**
   * Rotate credentials (for security purposes)
   */
  async rotateCredentials(): Promise<void> {
    try {
      console.log('🔄 Rotating credentials...');
      
      // Log security event
      await this.securityManager.createSecurityEvent(
        'security_violation',
        'high',
        'system',
        'admin' as any,
        'Credential rotation initiated',
        { timestamp: new Date().toISOString() }
      );

      // Re-initialize with new credentials
      await this.initialize();

      console.log('✅ Credentials rotated successfully');

    } catch (error) {
      console.error('❌ Failed to rotate credentials:', error);
      throw error;
    }
  }

  /**
   * Check if credentials are expired or need rotation
   */
  async checkCredentialHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      if (!this.credentials) {
        issues.push('Credentials not initialized');
        return { healthy: false, issues };
      }

      // Check if credentials are properly encrypted
      try {
        await this.decryptCredentials();
      } catch (error) {
        issues.push('Credential decryption failed');
      }

      // Check credential age (if we had timestamps)
      // This would be implemented with credential creation timestamps

      return {
        healthy: issues.length === 0,
        issues
      };

    } catch (error) {
      issues.push(`Health check failed: ${error}`);
      return { healthy: false, issues };
    }
  }

  /**
   * Destroy credentials from memory
   */
  async destroy(): Promise<void> {
    this.credentials = null;
    console.log('🔐 Credentials destroyed from memory');
  }
}

export default CredentialManager;
