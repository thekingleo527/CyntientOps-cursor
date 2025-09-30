/**
 * Mock @react-navigation/stack for development
 */

import React from 'react';
import { View } from 'react-native';

export const createStackNavigator = () => ({
  Navigator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
});

export const StackActions = {
  push: (name: string, params?: any) => ({ type: 'PUSH', payload: { name, params } }),
  pop: (count?: number) => ({ type: 'POP', payload: { count } }),
  popToTop: () => ({ type: 'POP_TO_TOP' }),
  replace: (name: string, params?: any) => ({ type: 'REPLACE', payload: { name, params } }),
};

export const TransitionPresets = {
  SlideFromRightIOS: {},
  SlideFromRight: {},
  SlideFromBottomIOS: {},
  SlideFromBottom: {},
  FadeFromBottomAndroid: {},
  RevealFromBottomAndroid: {},
  ScaleFromCenterAndroid: {},
  DefaultTransition: {},
  ModalPresentationIOS: {},
  ModalSlideFromBottomIOS: {},
  ModalFadePresentationIOS: {},
  NoAnimation: {},
};

export default {
  createStackNavigator,
  StackActions,
  TransitionPresets,
};
