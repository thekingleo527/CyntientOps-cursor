import * as Crypto from 'expo-crypto';

export interface ExpoEncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
}

export interface ExpoDecryptionResult {
  decryptedData: string;
  success: boolean;
}

/**
 * Enhanced AES-256-GCM encryption using expo-crypto
 * Provides secure encryption for React Native applications
 */
export class ExpoAESEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Generates a secure random key for AES-256 encryption using expo-crypto
   */
  public static async generateKey(): Promise<string> {
    try {
      const keyBytes = await Crypto.getRandomBytesAsync(this.KEY_LENGTH);
      return Array.from(keyBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Generates a secure random IV using expo-crypto
   */
  public static async generateIV(): Promise<string> {
    try {
      const ivBytes = await Crypto.getRandomBytesAsync(this.IV_LENGTH);
      return Array.from(ivBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate IV:', error);
      throw new Error('Failed to generate IV');
    }
  }

  /**
   * Encrypts data using AES-256-GCM with expo-crypto
   */
  public static async encrypt(text: string, keyHex: string): Promise<ExpoEncryptionResult> {
    try {
      // Convert hex key to Uint8Array
      const key = this.hexToUint8Array(keyHex);
      
      // Generate random IV
      const iv = await this.generateIV();
      const ivBytes = this.hexToUint8Array(iv);

      // Import the key for encryption
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: this.ALGORITHM },
        false,
        ['encrypt']
      );

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: ivBytes,
        },
        cryptoKey,
        new TextEncoder().encode(text)
      );

      // Extract the encrypted data and authentication tag
      const encryptedData = new Uint8Array(encryptedBuffer);
      const tag = encryptedData.slice(-this.TAG_LENGTH);
      const ciphertext = encryptedData.slice(0, -this.TAG_LENGTH);

      return {
        encryptedData: this.uint8ArrayToHex(ciphertext),
        iv: iv,
        tag: this.uint8ArrayToHex(tag),
        algorithm: this.ALGORITHM,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts data using AES-256-GCM with expo-crypto
   */
  public static async decrypt(
    encryptedDataHex: string,
    keyHex: string,
    ivHex: string,
    tagHex: string
  ): Promise<ExpoDecryptionResult> {
    try {
      // Convert hex strings to Uint8Arrays
      const key = this.hexToUint8Array(keyHex);
      const iv = this.hexToUint8Array(ivHex);
      const tag = this.hexToUint8Array(tagHex);
      const ciphertext = this.hexToUint8Array(encryptedDataHex);

      // Import the key for decryption
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: this.ALGORITHM },
        false,
        ['decrypt']
      );

      // Combine ciphertext and tag
      const encryptedData = new Uint8Array(ciphertext.length + tag.length);
      encryptedData.set(ciphertext);
      encryptedData.set(tag, ciphertext.length);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        cryptoKey,
        encryptedData
      );

      const decryptedData = new TextDecoder().decode(decryptedBuffer);

      return { decryptedData, success: true };
    } catch (error) {
      console.error('Decryption failed:', error);
      return { decryptedData: '', success: false };
    }
  }

  /**
   * Converts hex string to Uint8Array
   */
  private static hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Converts Uint8Array to hex string
   */
  private static uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates a secure random salt for password hashing
   */
  public static async generateSalt(): Promise<string> {
    try {
      const saltBytes = await Crypto.getRandomBytesAsync(32);
      return Array.from(saltBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate salt:', error);
      throw new Error('Failed to generate salt');
    }
  }

  /**
   * Creates a secure hash using expo-crypto
   */
  public static async createHash(data: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Hash creation failed:', error);
      throw new Error('Hash creation failed');
    }
  }

  /**
   * Verifies a hash against data
   */
  public static async verifyHash(data: string, hash: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<boolean> {
    try {
      const computedHash = await this.createHash(data, algorithm);
      return computedHash === hash;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }
}
