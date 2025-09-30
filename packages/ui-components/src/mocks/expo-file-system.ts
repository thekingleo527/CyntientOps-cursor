/**
 * Mock expo-file-system for development
 */

export const FileSystem = {
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  readAsStringAsync: async (uri: string) => '',
  writeAsStringAsync: async (uri: string, content: string) => {},
  deleteAsync: async (uri: string) => {},
  makeDirectoryAsync: async (uri: string) => {},
  getInfoAsync: async (uri: string) => ({ exists: false, isDirectory: false }),
  copyAsync: async (from: string, to: string) => {},
  moveAsync: async (from: string, to: string) => {},
};

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export default FileSystem;
