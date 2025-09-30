/**
 * Mock expo-image-picker for development
 */

const ImagePicker = {
  requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
  getMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
  launchImageLibraryAsync: async () => ({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      width: 100,
      height: 100,
    }]
  }),
  launchCameraAsync: async () => ({
    canceled: false,
    assets: [{
      uri: 'mock-camera-uri',
      width: 100,
      height: 100,
    }]
  }),
};

export { ImagePicker };

export const MediaTypeOptions = {
  Images: 'Images',
  Videos: 'Videos',
  All: 'All',
};

export default ImagePicker;
