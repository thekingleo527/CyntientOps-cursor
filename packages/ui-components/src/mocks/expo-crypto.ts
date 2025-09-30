/**
 * Mock expo-crypto for development
 */

export const Crypto = {
  digestStringAsync: async (algorithm: string, data: string) => 'mock-hash',
  randomUUID: () => 'mock-uuid',
  getRandomBytes: (length: number) => new Uint8Array(length),
  getRandomBytesAsync: async (length: number) => new Uint8Array(length),
};

export const CryptoDigestAlgorithm = {
  SHA1: 'SHA1',
  SHA256: 'SHA256',
  SHA384: 'SHA384',
  SHA512: 'SHA512',
};

export const CryptoEncoding = {
  HEX: 'hex',
  BASE64: 'base64',
};

export default Crypto;
