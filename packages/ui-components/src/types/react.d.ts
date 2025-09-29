// Comprehensive type declarations for React and React Native
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
  
  // Export all React types and functions
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useContext: typeof React.useContext;
  export const useReducer: typeof React.useReducer;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  export const useImperativeHandle: typeof React.useImperativeHandle;
  export const useDebugValue: typeof React.useDebugValue;
  
  // Export React types
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type ComponentType<P = {}> = React.ComponentType<P>;
  export type ReactNode = React.ReactNode;
  export type ReactElement = React.ReactElement;
  export type ComponentProps<T> = React.ComponentProps<T>;
  export type Ref<T> = React.Ref<T>;
  export type RefObject<T> = React.RefObject<T>;
  export type MutableRefObject<T> = React.MutableRefObject<T>;
  
  // Export default
  export default React;
}

declare module 'react-native' {
  import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Alert, Linking } from 'react-native';
  
  export { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Alert, Linking };
  export * from 'react-native';
}

declare module 'expo-linear-gradient' {
  import { LinearGradient } from 'expo-linear-gradient';
  export { LinearGradient };
  export * from 'expo-linear-gradient';
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}
