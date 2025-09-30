/**
 * Mock expo-secure-store for development
 */

export const SecureStore = {
  setItemAsync: async (key: string, value: string) => {
    console.log('SecureStore set:', key);
  },
  getItemAsync: async (key: string) => {
    console.log('SecureStore get:', key);
    return null;
  },
  deleteItemAsync: async (key: string) => {
    console.log('SecureStore delete:', key);
  },
  isAvailableAsync: async () => true,
};

export default SecureStore;
