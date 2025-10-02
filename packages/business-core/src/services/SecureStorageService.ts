/**
 * 🔐 Secure Storage Service
 * Purpose: Secure storage for sensitive data using Expo SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import { Logger } from './LoggingService';

export interface SecureStorageConfig {
  requireAuthentication?: boolean;
  keychainService?: string;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private config: SecureStorageConfig;

  private constructor(config: SecureStorageConfig = {}) {
    this.config = {
      requireAuthentication: false,
      keychainService: 'cyntientops-secure-storage',
      ...config
    };
  }

  public static getInstance(config?: SecureStorageConfig): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService(config);
    }
    return SecureStorageService.instance;
  }

  /**
   * Store sensitive data securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        keychainService: this.config.keychainService,
        requireAuthentication: this.config.requireAuthentication,
      };

      await SecureStore.setItemAsync(key, value, options);
      Logger.debug(`Securely stored item: ${key}`, undefined, 'SecureStorageService');
    } catch (error) {
      Logger.error(`Failed to store secure item: ${key}`, error, 'SecureStorageService');
      throw new Error(`Failed to store secure item: ${key}`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        keychainService: this.config.keychainService,
        requireAuthentication: this.config.requireAuthentication,
      };

      const value = await SecureStore.getItemAsync(key, options);
      Logger.debug(`Retrieved secure item: ${key}`, undefined, 'SecureStorageService');
      return value;
    } catch (error) {
      Logger.error(`Failed to retrieve secure item: ${key}`, error, 'SecureStorageService');
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  async removeItem(key: string): Promise<void> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        keychainService: this.config.keychainService,
      };

      await SecureStore.deleteItemAsync(key, options);
      Logger.debug(`Removed secure item: ${key}`, undefined, 'SecureStorageService');
    } catch (error) {
      Logger.error(`Failed to remove secure item: ${key}`, error, 'SecureStorageService');
      throw new Error(`Failed to remove secure item: ${key}`);
    }
  }

  /**
   * Store session token securely
   */
  async storeSessionToken(token: string): Promise<void> {
    await this.setItem('cyntientops.session.token', token);
  }

  /**
   * Retrieve session token securely
   */
  async getSessionToken(): Promise<string | null> {
    return await this.getItem('cyntientops.session.token');
  }

  /**
   * Remove session token
   */
  async removeSessionToken(): Promise<void> {
    await this.removeItem('cyntientops.session.token');
  }

  /**
   * Store API keys securely
   */
  async storeApiKey(service: string, key: string): Promise<void> {
    await this.setItem(`cyntientops.api.${service}`, key);
  }

  /**
   * Retrieve API key securely
   */
  async getApiKey(service: string): Promise<string | null> {
    return await this.getItem(`cyntientops.api.${service}`);
  }

  /**
   * Store user credentials securely (for biometric auth)
   */
  async storeUserCredentials(userId: string, credentials: string): Promise<void> {
    await this.setItem(`cyntientops.user.${userId}.credentials`, credentials);
  }

  /**
   * Retrieve user credentials securely
   */
  async getUserCredentials(userId: string): Promise<string | null> {
    return await this.getItem(`cyntientops.user.${userId}.credentials`);
  }

  /**
   * Check if secure storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await SecureStore.isAvailableAsync();
      return true;
    } catch (error) {
      Logger.warn('Secure storage not available', error, 'SecureStorageService');
      return false;
    }
  }

  /**
   * Clear all secure storage (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      // Note: SecureStore doesn't have a clear all method
      // We need to track keys and remove them individually
      Logger.warn('Clear all secure storage requested - not implemented', undefined, 'SecureStorageService');
    } catch (error) {
      Logger.error('Failed to clear secure storage', error, 'SecureStorageService');
      throw error;
    }
  }
}

export default SecureStorageService;
