/**
 * Mock expo-media-library for development
 */

export const MediaLibrary = {
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  createAssetAsync: async (uri: string) => ({
    id: 'mock-asset-id',
    filename: 'mock-filename',
    uri: uri,
    mediaType: 'photo',
    width: 100,
    height: 100,
    creationTime: Date.now(),
    modificationTime: Date.now(),
    duration: 0,
  }),
  createAlbumAsync: async (name: string) => ({
    id: 'mock-album-id',
    title: name,
    assetCount: 0,
  }),
  addAssetsToAlbumAsync: async (assets: any[], album: any) => {},
};

export default MediaLibrary;
