/**
 * 🎬 Advanced Animation System
 * Purpose: Comprehensive animation library with smooth transitions and effects
 * Features: Page transitions, micro-interactions, loading animations, gesture animations
 */

import React, { useRef, useEffect, ReactNode } from 'react';
import { Animated, Easing, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { Colors } from '@cyntientops/design-tokens';

const { width, height } = Dimensions.get('window');

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'spring';
  useNativeDriver?: boolean;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface PageTransitionConfig extends AnimationConfig {
  type: 'slide' | 'fade' | 'scale' | 'flip' | 'cube' | 'carousel';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface MicroInteractionConfig extends AnimationConfig {
  type: 'bounce' | 'pulse' | 'shake' | 'wiggle' | 'glow' | 'ripple';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export interface LoadingAnimationConfig extends AnimationConfig {
  type: 'spinner' | 'dots' | 'bars' | 'pulse' | 'wave' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export interface GestureAnimationConfig {
  type: 'swipe' | 'pinch' | 'rotate' | 'drag' | 'longPress';
  threshold?: number;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  onGestureUpdate?: (progress: number) => void;
}

// Page Transition Animations
export const PageTransition: React.FC<{
  children: ReactNode;
  visible: boolean;
  config: PageTransitionConfig;
  style?: any;
}> = ({ children, visible, config, style }) => {
  const animatedValue = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: visible ? 1 : 0,
      duration: config.duration || 300,
      delay: config.delay || 0,
      easing: getEasingFunction(config.easing || 'ease-in-out'),
      useNativeDriver: config.useNativeDriver !== false,
    });

    animation.start();
  }, [visible, config]);

  const getTransitionStyle = () => {
    const { type, direction = 'right' } = config;

    switch (type) {
      case 'slide':
        return {
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: direction === 'left' ? [width, 0] : direction === 'right' ? [-width, 0] : [0, 0],
              }),
            },
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: direction === 'up' ? [height, 0] : direction === 'down' ? [-height, 0] : [0, 0],
              }),
            },
          ],
        };
      case 'fade':
        return {
          opacity: animatedValue,
        };
      case 'scale':
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };
      case 'flip':
        return {
          transform: [
            {
              rotateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['180deg', '0deg'],
              }),
            },
          ],
        };
      case 'cube':
        return {
          transform: [
            {
              rotateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['90deg', '0deg'],
              }),
            },
            {
              perspective: 1000,
            },
          ],
        };
      default:
        return {
          opacity: animatedValue,
        };
    }
  };

  return (
    <Animated.View style={[getTransitionStyle(), style]}>
      {children}
    </Animated.View>
  );
};

// Micro Interaction Animations
export const MicroInteraction: React.FC<{
  children: ReactNode;
  config: MicroInteractionConfig;
  trigger?: boolean;
  style?: any;
}> = ({ children, config, trigger = true, style }) => {
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!trigger) return;

    const { type, intensity = 'medium' } = config;
    const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'strong' ? 1.5 : 1;

    let animation: Animated.CompositeAnimation;

    switch (type) {
      case 'bounce':
        animation = Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.2 * intensityMultiplier,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.8 * intensityMultiplier,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1.1 * intensityMultiplier,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      case 'shake':
        animation = Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: -10 * intensityMultiplier,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 10 * intensityMultiplier,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -10 * intensityMultiplier,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 10 * intensityMultiplier,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'wiggle':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 5 * intensityMultiplier,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: -5 * intensityMultiplier,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        );
        break;
      case 'glow':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1.2 * intensityMultiplier,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      default:
        animation = Animated.timing(animatedValue, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        });
    }

    animation.start();
  }, [trigger, config]);

  const getInteractionStyle = () => {
    const { type } = config;

    switch (type) {
      case 'bounce':
      case 'pulse':
      case 'glow':
        return {
          transform: [{ scale: animatedValue }],
        };
      case 'shake':
      case 'wiggle':
        return {
          transform: [{ translateX: animatedValue }],
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View style={[getInteractionStyle(), style]}>
      {children}
    </Animated.View>
  );
};

// Loading Animations
export const LoadingAnimation: React.FC<{
  config: LoadingAnimationConfig;
  style?: any;
}> = ({ config, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { type, size = 'medium', color = Colors.primaryAction } = config;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: config.duration || 1000,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [config.duration]);

  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 60;
      default: return 40;
    }
  };

  const renderSpinner = () => (
    <Animated.View
      style={[
        styles.loadingContainer,
        {
          width: getSizeValue(),
          height: getSizeValue(),
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [
            {
              rotate: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );

  const renderDots = () => (
    <View style={[styles.dotsContainer, style]}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              width: getSizeValue() / 4,
              height: getSizeValue() / 4,
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderBars = () => (
    <View style={[styles.barsContainer, style]}>
      {[0, 1, 2, 3].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: getSizeValue(),
              transform: [
                {
                  scaleY: animatedValue.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0.3, 1, 0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulseContainer,
        {
          width: getSizeValue(),
          height: getSizeValue(),
          backgroundColor: color,
          opacity: animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3],
          }),
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1.2, 0.8],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );

  const renderWave = () => (
    <View style={[styles.waveContainer, style]}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              height: getSizeValue(),
              transform: [
                {
                  scaleY: animatedValue.interpolate({
                    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    outputRange: [0.3, 1, 0.3, 1, 0.3, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderSkeleton = () => (
    <View style={[styles.skeletonContainer, style]}>
      <Animated.View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: color,
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.7, 0.3],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: color,
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.7, 0.3],
            }),
          },
        ]}
      />
    </View>
  );

  switch (type) {
    case 'spinner':
      return renderSpinner();
    case 'dots':
      return renderDots();
    case 'bars':
      return renderBars();
    case 'pulse':
      return renderPulse();
    case 'wave':
      return renderWave();
    case 'skeleton':
      return renderSkeleton();
    default:
      return renderSpinner();
  }
};

// Gesture Animations
export const GestureAnimation: React.FC<{
  children: ReactNode;
  config: GestureAnimationConfig;
  style?: any;
}> = ({ children, config, style }) => {
  const animatedValue = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        config.onGestureStart?.();
        animatedValue.setOffset({
          x: animatedValue.x._value,
          y: animatedValue.y._value,
        });
        animatedValue.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { type, threshold = 50 } = config;
        
        switch (type) {
          case 'swipe':
          case 'drag':
            animatedValue.setValue({ x: gestureState.dx, y: gestureState.dy });
            break;
          case 'pinch':
            const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
            const scale = Math.max(0.5, Math.min(2, distance / threshold));
            scaleValue.setValue(scale);
            break;
          case 'rotate':
            const angle = Math.atan2(gestureState.dy, gestureState.dx) * (180 / Math.PI);
            rotateValue.setValue(angle);
            break;
        }

        const progress = Math.min(1, Math.abs(gestureState.dx) / threshold);
        config.onGestureUpdate?.(progress);
      },
      onPanResponderRelease: () => {
        config.onGestureEnd?.();
        animatedValue.flattenOffset();
        
        // Spring back to original position
        Animated.parallel([
          Animated.spring(animatedValue, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(rotateValue, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const getGestureStyle = () => {
    const { type } = config;

    switch (type) {
      case 'swipe':
      case 'drag':
        return {
          transform: [
            { translateX: animatedValue.x },
            { translateY: animatedValue.y },
          ],
        };
      case 'pinch':
        return {
          transform: [{ scale: scaleValue }],
        };
      case 'rotate':
        return {
          transform: [
            { rotate: rotateValue.interpolate({
              inputRange: [-180, 180],
              outputRange: ['-180deg', '180deg'],
            }) },
          ],
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View
      style={[getGestureStyle(), style]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

// Utility Functions
const getEasingFunction = (easing: string) => {
  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'ease':
      return Easing.ease;
    case 'ease-in':
      return Easing.in(Easing.ease);
    case 'ease-out':
      return Easing.out(Easing.ease);
    case 'ease-in-out':
      return Easing.inOut(Easing.ease);
    case 'bounce':
      return Easing.bounce;
    case 'spring':
      return Easing.elastic(1);
    default:
      return Easing.ease;
  }
};

// Styles
const styles = {
  loadingContainer: {
    borderWidth: 3,
    borderRadius: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 50,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  pulseContainer: {
    borderRadius: 50,
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 2,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  skeletonContainer: {
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    width: '100%',
  },
};

export {
  PageTransition,
  MicroInteraction,
  LoadingAnimation,
  GestureAnimation,
};
