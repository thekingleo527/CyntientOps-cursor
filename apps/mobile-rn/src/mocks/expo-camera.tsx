/**
 * Mock expo-camera for development
 */

import React from 'react';
import { View, Text } from 'react-native';

export const Camera = {
  requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
  getCameraPermissionsAsync: async () => ({ status: 'granted' }),
};

export const CameraView = React.forwardRef<any, any>((props, ref) => (
  <View ref={ref} {...props}>
    <Text>Mock Camera View</Text>
  </View>
));

export const useCameraPermissions = () => [
  { granted: true },
  { requestPermission: async () => ({ granted: true }) }
];

export default {
  Camera,
  CameraView,
  useCameraPermissions,
};
