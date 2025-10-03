/**
 * NovaAvatar.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA AVATAR - Animated AiAssistant Image with Glowing Effects
 * ✅ AIASSISTANT IMAGE: Uses actual AiAssistant image from resources
 * ✅ GLOWING: Advanced glow effects with color transitions
 * ✅ ANIMATED: Smooth animations for processing, listening, and idle states
 * ✅ INTERACTIVE: Responds to touch and voice input with visual feedback
 * ✅ HOLOGRAPHIC: Particle effects and scanlines for immersive experience
 * ✅ CONTEXTUAL: Different glow colors based on context and state
 * ✅ VOICE READY: Prepared for voice animation integration
 * 
 * Based on SwiftUI NovaAvatar.swift (400+ lines)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NovaContextType } from './NovaTypes';

// Types
export interface NovaAvatarProps {
  size?: number;
  isProcessing?: boolean;
  isListening?: boolean;
  showHolographicEffects?: boolean;
  contextType?: NovaContextType;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
}

export interface NovaAvatarState {
  pulseAnimation: Animated.Value;
  rotationAnimation: Animated.Value;
  glowAnimation: Animated.Value;
  scanlineAnimation: Animated.Value;
  particleAnimation: Animated.Value;
  breathingAnimation: Animated.Value;
  imageLoaded: boolean;
  imageError: boolean;
}

// Constants
const AVATAR_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const ANIMATION_DURATION = 2000;
const PROCESSING_ANIMATION_DURATION = 1000;
const BREATHING_DURATION = 3000;

// Glow color schemes for different states
const GLOW_COLORS = {
  idle: {
    primary: '#00D4FF',
    secondary: '#0099CC',
    alpha: [0.4, 0.1],
  },
  processing: {
    primary: '#FFA500',
    secondary: '#FF8C00',
    alpha: [0.6, 0.2],
  },
  listening: {
    primary: '#00FF88',
    secondary: '#00CC66',
    alpha: [0.7, 0.3],
  },
  error: {
    primary: '#FF4444',
    secondary: '#CC3333',
    alpha: [0.5, 0.2],
  },
  building: {
    primary: '#8A2BE2',
    secondary: '#6A1B9A',
    alpha: [0.5, 0.2],
  },
  task: {
    primary: '#FF6B6B',
    secondary: '#E55353',
    alpha: [0.5, 0.2],
  },
};

export const NovaAvatar: React.FC<NovaAvatarProps> = ({
  size = AVATAR_SIZES.medium,
  isProcessing = false,
  isListening = false,
  showHolographicEffects = true,
  contextType = NovaContextType.PORTFOLIO,
  onPress,
  onLongPress,
  style,
}) => {
  // State
  const [state, setState] = useState<NovaAvatarState>({
    pulseAnimation: new Animated.Value(1),
    rotationAnimation: new Animated.Value(0),
    glowAnimation: new Animated.Value(0.5),
    scanlineAnimation: new Animated.Value(0),
    particleAnimation: new Animated.Value(0),
    breathingAnimation: new Animated.Value(1),
    imageLoaded: false,
    imageError: false,
  });

  // Refs
  const animationRefs = useRef({
    pulse: null as Animated.CompositeAnimation | null,
    rotation: null as Animated.CompositeAnimation | null,
    glow: null as Animated.CompositeAnimation | null,
    scanline: null as Animated.CompositeAnimation | null,
    particle: null as Animated.CompositeAnimation | null,
    breathing: null as Animated.CompositeAnimation | null,
  });

  // Effects
  useEffect(() => {
    startAnimations();
    return () => stopAnimations();
  }, []);

  useEffect(() => {
    if (isProcessing || isListening) {
      startProcessingAnimations();
    } else {
      startIdleAnimations();
    }
  }, [isProcessing, isListening]);

  // Animation Management
  const startAnimations = () => {
    startIdleAnimations();
    if (showHolographicEffects) {
      startHolographicEffects();
    }
  };

  const startIdleAnimations = () => {
    // Gentle breathing animation
    animationRefs.current.breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(state.breathingAnimation, {
          toValue: 1.05,
          duration: BREATHING_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(state.breathingAnimation, {
          toValue: 0.98,
          duration: BREATHING_DURATION / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.breathing.start();

    // Subtle pulse animation
    animationRefs.current.pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(state.pulseAnimation, {
          toValue: 1.08,
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(state.pulseAnimation, {
          toValue: 0.95,
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.pulse.start();

    // Glow animation
    animationRefs.current.glow = Animated.loop(
      Animated.sequence([
        Animated.timing(state.glowAnimation, {
          toValue: 0.8,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(state.glowAnimation, {
          toValue: 0.3,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.glow.start();
  };

  const startProcessingAnimations = () => {
    // Faster, more intense pulse when processing
    if (animationRefs.current.pulse) {
      animationRefs.current.pulse.stop();
    }
    
    animationRefs.current.pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(state.pulseAnimation, {
          toValue: 1.15,
          duration: PROCESSING_ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(state.pulseAnimation, {
          toValue: 0.9,
          duration: PROCESSING_ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.pulse.start();

    // Brighter, faster glow when processing
    if (animationRefs.current.glow) {
      animationRefs.current.glow.stop();
    }
    
    animationRefs.current.glow = Animated.loop(
      Animated.sequence([
        Animated.timing(state.glowAnimation, {
          toValue: 1.0,
          duration: PROCESSING_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(state.glowAnimation, {
          toValue: 0.6,
          duration: PROCESSING_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.glow.start();
  };

  const startHolographicEffects = () => {
    // Slow rotation animation
    animationRefs.current.rotation = Animated.loop(
      Animated.timing(state.rotationAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION * 6,
        useNativeDriver: true,
      })
    );
    animationRefs.current.rotation.start();

    // Scanline animation
    animationRefs.current.scanline = Animated.loop(
      Animated.sequence([
        Animated.timing(state.scanlineAnimation, {
          toValue: 1,
          duration: ANIMATION_DURATION * 2,
          useNativeDriver: true,
        }),
        Animated.timing(state.scanlineAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.scanline.start();

    // Particle animation
    animationRefs.current.particle = Animated.loop(
      Animated.timing(state.particleAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION * 4,
        useNativeDriver: true,
      })
    );
    animationRefs.current.particle.start();
  };

  const stopAnimations = () => {
    Object.values(animationRefs.current).forEach(animation => {
      if (animation) {
        animation.stop();
      }
    });
  };

  // Render Methods
  const getGlowColors = () => {
    let colorScheme = GLOW_COLORS.idle;
    
    if (isListening) {
      colorScheme = GLOW_COLORS.listening;
    } else if (isProcessing) {
      colorScheme = GLOW_COLORS.processing;
    } else if (contextType === NovaContextType.BUILDING) {
      colorScheme = GLOW_COLORS.building;
    } else if (contextType === NovaContextType.TASK) {
      colorScheme = GLOW_COLORS.task;
    }
    
    return [
      `${colorScheme.primary}${Math.round(colorScheme.alpha[0] * 255).toString(16).padStart(2, '0')}`,
      `${colorScheme.secondary}${Math.round(colorScheme.alpha[1] * 255).toString(16).padStart(2, '0')}`,
    ];
  };

  const renderHolographicBackground = () => {
    if (!showHolographicEffects) return null;

    const rotation = state.rotationAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const scanlinePosition = state.scanlineAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-size, size],
    });

    return (
      <>
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.holographicRing,
            {
              width: size + 24,
              height: size + 24,
              opacity: state.glowAnimation,
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <LinearGradient
            colors={getGlowColors()}
            style={styles.holographicGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Inner glow ring */}
        <Animated.View
          style={[
            styles.innerGlowRing,
            {
              width: size + 12,
              height: size + 12,
              opacity: state.glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[`${getGlowColors()[0]}40`, `${getGlowColors()[1]}20`]}
            style={styles.innerGlowGradient}
          />
        </Animated.View>

        {/* Scanline effect */}
        <Animated.View
          style={[
            styles.scanline,
            {
              width: size,
              height: 3,
              top: scanlinePosition,
              opacity: state.glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        />

        {/* Particle effects */}
        {Array.from({ length: 8 }).map((_, index) => {
          const particleRotation = state.particleAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          const particleRadius = size / 2 + 18;
          const angle = (index * 45) * (Math.PI / 180);
          const x = Math.cos(angle) * particleRadius;
          const y = Math.sin(angle) * particleRadius;

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: size / 2 + x - 3,
                  top: size / 2 + y - 3,
                  transform: [{ rotate: particleRotation }],
                  opacity: state.glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.7],
                  }),
                },
              ]}
            />
          );
        })}
      </>
    );
  };

  const renderAiAssistantImage = () => {
    return (
      <Image
          source={require('../../../../apps/mobile-rn/assets/images/AIAssistant.png')}
        style={[
          styles.aiAssistantImage,
          {
            width: size,
            height: size,
            opacity: state.imageLoaded ? 1 : 0,
          },
        ]}
        onLoad={() => setState(prev => ({ ...prev, imageLoaded: true }))}
        onError={() => setState(prev => ({ ...prev, imageError: true }))}
        resizeMode="contain"
      />
    );
  };

  const renderFallbackAvatar = () => {
    if (state.imageLoaded && !state.imageError) return null;

    return (
      <View
        style={[
          styles.fallbackAvatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <LinearGradient
          colors={[getGlowColors()[0], getGlowColors()[1]]}
          style={styles.fallbackGradient}
        />
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          N
        </Text>
      </View>
    );
  };

  // Main Render
  const avatarContent = (
    <View style={[styles.avatarContainer, { width: size, height: size }, style]}>
      {renderHolographicBackground()}
      
      <Animated.View
        style={[
          styles.avatarContent,
          {
            width: size,
            height: size,
            transform: [
              { scale: Animated.multiply(state.pulseAnimation, state.breathingAnimation) },
            ],
          },
        ]}
      >
        {renderAiAssistantImage()}
        {renderFallbackAvatar()}
      </Animated.View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        style={style}
      >
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

// Styles
const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  aiAssistantImage: {
    borderRadius: 50,
  },
  
  fallbackAvatar: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  fallbackGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  holographicRing: {
    position: 'absolute',
    borderRadius: 50,
    overflow: 'hidden',
  },
  
  holographicGradient: {
    width: '100%',
    height: '100%',
  },
  
  innerGlowRing: {
    position: 'absolute',
    borderRadius: 50,
    overflow: 'hidden',
  },
  
  innerGlowGradient: {
    width: '100%',
    height: '100%',
  },
  
  scanline: {
    position: 'absolute',
    backgroundColor: '#00D4FF',
    left: 0,
    borderRadius: 2,
  },
  
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#00D4FF',
    borderRadius: 3,
  },
});

// Export default
export default NovaAvatar;
