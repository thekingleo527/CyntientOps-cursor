/**
 * Mock @expo/vector-icons for development
 */

import React from 'react';
import { Text } from 'react-native';

export const Ionicons = React.forwardRef<any, any>((props, ref) => (
  <Text ref={ref} {...props}>📱</Text>
));

export const MaterialIcons = React.forwardRef<any, any>((props, ref) => (
  <Text ref={ref} {...props}>🔧</Text>
));

export const FontAwesome = React.forwardRef<any, any>((props, ref) => (
  <Text ref={ref} {...props}>⭐</Text>
));

export default {
  Ionicons,
  MaterialIcons,
  FontAwesome,
};
