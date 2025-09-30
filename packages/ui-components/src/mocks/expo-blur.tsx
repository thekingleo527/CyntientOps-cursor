/**
 * Mock expo-blur for development
 */

import React from 'react';
import { View } from 'react-native';

export const BlurView: React.FC<{ intensity?: number; style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
    {children}
  </View>
);

export default BlurView;
