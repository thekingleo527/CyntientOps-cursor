/**
 * Mock expo-linear-gradient for development
 */

import React from 'react';
import { View } from 'react-native';

export const LinearGradient: React.FC<{ colors: string[]; style?: any; children?: React.ReactNode }> = ({ colors, style, children }) => (
  <View style={[style, { backgroundColor: colors[0] }]}>
    {children}
  </View>
);

export default LinearGradient;
