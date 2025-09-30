/**
 * Mock expo-asset for development
 */

export const Asset = {
  fromModule: (module: any) => ({
    uri: 'mock-asset-uri',
    name: 'mock-asset',
    type: 'image',
    hash: 'mock-hash',
    uri_web: 'mock-web-uri',
  }),
  loadAsync: async (assets: any[]) => {
    console.log('Loading assets:', assets);
    return assets;
  },
};

export default Asset;
