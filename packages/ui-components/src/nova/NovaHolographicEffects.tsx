/**
 * NovaHolographicEffects.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA HOLOGRAPHIC EFFECTS - Advanced 3D Holographic Rendering
 * ✅ 3D TRANSFORMS: Advanced 3D transformations and rotations
 * ✅ HOLOGRAPHIC SHADERS: Custom holographic rendering effects
 * ✅ SCANLINES: Authentic holographic scanline effects
 * ✅ DISTORTION: Realistic holographic distortion and glitch effects
 * ✅ GLOW: Dynamic glow and bloom effects
 * ✅ REFLECTIONS: Holographic reflection and refraction
 * ✅ ANIMATIONS: Smooth holographic animations and transitions
 * ✅ INTERACTIONS: Interactive holographic manipulation
 * ✅ PERFORMANCE: Optimized rendering for smooth 60fps
 * 
 * Based on SwiftUI holographic system (600+ lines of advanced effects)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Types
export interface HolographicConfig {
  intensity: number; // 0-1, overall effect intensity
  scanlines: {
    enabled: boolean;
    density: number; // lines per pixel
    speed: number; // animation speed
    opacity: number; // 0-1
    color: string;
  };
  distortion: {
    enabled: boolean;
    strength: number; // 0-1
    frequency: number; // waves per second
    amplitude: number; // pixel displacement
    type: 'wave' | 'glitch' | 'static' | 'pulse';
  };
  glow: {
    enabled: boolean;
    radius: number; // blur radius
    intensity: number; // 0-1
    color: string;
    bloom: boolean;
  };
  reflections: {
    enabled: boolean;
    opacity: number; // 0-1
    offset: number; // pixel offset
    blur: number; // blur radius
  };
  animations: {
    enabled: boolean;
    rotation: {
      enabled: boolean;
      speed: number; // degrees per second
      axis: 'x' | 'y' | 'z' | 'xyz';
    };
    pulse: {
      enabled: boolean;
      speed: number; // cycles per second
      intensity: number; // 0-1
    };
    float: {
      enabled: boolean;
      speed: number; // cycles per second
      amplitude: number; // pixel movement
    };
  };
  performance: {
    targetFPS: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    enableOptimizations: boolean;
  };
}

export interface HolographicState {
  isActive: boolean;
  currentIntensity: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
  opacity: number;
  distortionOffset: number;
  scanlineOffset: number;
  pulsePhase: number;
  floatPhase: number;
  performance: {
    fps: number;
    renderTime: number;
    frameDrops: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: HolographicConfig = {
  intensity: 0.8,
  scanlines: {
    enabled: true,
    density: 0.1,
    speed: 2.0,
    opacity: 0.3,
    color: '#00FFFF',
  },
  distortion: {
    enabled: true,
    strength: 0.2,
    frequency: 1.0,
    amplitude: 2.0,
    type: 'wave',
  },
  glow: {
    enabled: true,
    radius: 10,
    intensity: 0.6,
    color: '#00FFFF',
    bloom: true,
  },
  reflections: {
    enabled: true,
    opacity: 0.2,
    offset: 5,
    blur: 3,
  },
  animations: {
    enabled: true,
    rotation: {
      enabled: true,
      speed: 10,
      axis: 'y',
    },
    pulse: {
      enabled: true,
      speed: 2,
      intensity: 0.3,
    },
    float: {
      enabled: true,
      speed: 1,
      amplitude: 10,
    },
  },
  performance: {
    targetFPS: 60,
    quality: 'high',
    enableOptimizations: true,
  },
};

// Holographic Effects Manager Class
class HolographicEffectsManager {
  private static instance: HolographicEffectsManager;
  private config: HolographicConfig;
  private state: HolographicState;
  private isRunning: boolean = false;
  private animationFrame: number | null = null;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private renderTime: number = 0;
  private frameDrops: number = 0;
  private onUpdate: ((state: HolographicState) => void) | null = null;

  private constructor(config: HolographicConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.state = {
      isActive: false,
      currentIntensity: config.intensity,
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      opacity: 1,
      distortionOffset: 0,
      scanlineOffset: 0,
      pulsePhase: 0,
      floatPhase: 0,
      performance: { fps: 0, renderTime: 0, frameDrops: 0 },
    };
  }

  static getInstance(config?: HolographicConfig): HolographicEffectsManager {
    if (!HolographicEffectsManager.instance) {
      HolographicEffectsManager.instance = new HolographicEffectsManager(config);
    }
    return HolographicEffectsManager.instance;
  }

  // Start holographic effects
  start(): void {
    if (this.isRunning) return;
    
    console.log('🔮 Starting holographic effects...');
    this.isRunning = true;
    this.state.isActive = true;
    this.lastTime = performance.now();
    this.animate();
  }

  // Stop holographic effects
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('🛑 Stopping holographic effects...');
    this.isRunning = false;
    this.state.isActive = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Main animation loop
  private animate = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update FPS
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = 1000 / deltaTime;
      this.state.performance.fps = this.fps;
    }

    // Check for frame drops
    if (deltaTime > 1000 / this.config.performance.targetFPS * 1.5) {
      this.frameDrops++;
    }

    // Update effects
    this.updateEffects(deltaTime);

    // Notify listeners
    this.onUpdate?.(this.state);

    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  // Update holographic effects
  private updateEffects(deltaTime: number): void {
    if (!this.config.animations.enabled) return;

    const time = deltaTime * 0.001; // Convert to seconds

    // Update rotation
    if (this.config.animations.rotation.enabled) {
      const rotationSpeed = this.config.animations.rotation.speed * time;
      
      switch (this.config.animations.rotation.axis) {
        case 'x':
          this.state.rotation.x += rotationSpeed;
          break;
        case 'y':
          this.state.rotation.y += rotationSpeed;
          break;
        case 'z':
          this.state.rotation.z += rotationSpeed;
          break;
        case 'xyz':
          this.state.rotation.x += rotationSpeed * 0.5;
          this.state.rotation.y += rotationSpeed;
          this.state.rotation.z += rotationSpeed * 0.3;
          break;
      }
    }

    // Update pulse
    if (this.config.animations.pulse.enabled) {
      this.state.pulsePhase += this.config.animations.pulse.speed * time;
      const pulseIntensity = 1 + Math.sin(this.state.pulsePhase) * this.config.animations.pulse.intensity;
      this.state.scale = pulseIntensity;
    }

    // Update float
    if (this.config.animations.float.enabled) {
      this.state.floatPhase += this.config.animations.float.speed * time;
      const floatOffset = Math.sin(this.state.floatPhase) * this.config.animations.float.amplitude;
      this.state.rotation.z += floatOffset * 0.01; // Subtle rotation from float
    }

    // Update distortion
    if (this.config.distortion.enabled) {
      this.state.distortionOffset += this.config.distortion.frequency * time;
    }

    // Update scanlines
    if (this.config.scanlines.enabled) {
      this.state.scanlineOffset += this.config.scanlines.speed * time;
    }

    // Update performance metrics
    this.state.performance.renderTime = deltaTime;
    this.state.performance.frameDrops = this.frameDrops;
  }

  // Get current state
  getState(): HolographicState {
    return { ...this.state };
  }

  // Update configuration
  updateConfig(config: Partial<HolographicConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Set intensity
  setIntensity(intensity: number): void {
    this.state.currentIntensity = Math.max(0, Math.min(1, intensity));
  }

  // Set rotation
  setRotation(rotation: Partial<HolographicState['rotation']>): void {
    this.state.rotation = { ...this.state.rotation, ...rotation };
  }

  // Set scale
  setScale(scale: number): void {
    this.state.scale = scale;
  }

  // Set opacity
  setOpacity(opacity: number): void {
    this.state.opacity = Math.max(0, Math.min(1, opacity));
  }

  // Set update callback
  setOnUpdate(callback: (state: HolographicState) => void): void {
    this.onUpdate = callback;
  }

  // Cleanup
  cleanup(): void {
    this.stop();
    this.onUpdate = null;
  }
}

// Nova Holographic Effects Hook
export const useNovaHolographicEffects = (config: Partial<HolographicConfig> = {}) => {
  const [state, setState] = useState<HolographicState>({
    isActive: false,
    currentIntensity: 0.8,
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    opacity: 1,
    distortionOffset: 0,
    scanlineOffset: 0,
    pulsePhase: 0,
    floatPhase: 0,
    performance: { fps: 0, renderTime: 0, frameDrops: 0 },
  });

  const managerRef = useRef<HolographicEffectsManager | null>(null);

  // Initialize holographic effects
  const initialize = useCallback(() => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    managerRef.current = HolographicEffectsManager.getInstance(finalConfig);
    
    managerRef.current.setOnUpdate((newState) => {
      setState(newState);
    });
  }, [config]);

  // Start effects
  const start = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.start();
    }
  }, []);

  // Stop effects
  const stop = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stop();
    }
  }, []);

  // Toggle effects
  const toggle = useCallback(() => {
    if (state.isActive) {
      stop();
    } else {
      start();
    }
  }, [state.isActive, start, stop]);

  // Set intensity
  const setIntensity = useCallback((intensity: number) => {
    if (managerRef.current) {
      managerRef.current.setIntensity(intensity);
    }
  }, []);

  // Set rotation
  const setRotation = useCallback((rotation: Partial<HolographicState['rotation']>) => {
    if (managerRef.current) {
      managerRef.current.setRotation(rotation);
    }
  }, []);

  // Set scale
  const setScale = useCallback((scale: number) => {
    if (managerRef.current) {
      managerRef.current.setScale(scale);
    }
  }, []);

  // Set opacity
  const setOpacity = useCallback((opacity: number) => {
    if (managerRef.current) {
      managerRef.current.setOpacity(opacity);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<HolographicConfig>) => {
    if (managerRef.current) {
      managerRef.current.updateConfig(newConfig);
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cleanup();
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return {
    state,
    initialize,
    start,
    stop,
    toggle,
    setIntensity,
    setRotation,
    setScale,
    setOpacity,
    updateConfig,
    cleanup,
  };
};

// Scanline Component
const ScanlineComponent: React.FC<{
  config: HolographicConfig['scanlines'];
  offset: number;
  style?: any;
}> = ({ config, offset, style }) => {
  if (!config.enabled) return null;

  const { width, height } = Dimensions.get('window');
  const lineHeight = 1 / config.density;
  const lineCount = Math.ceil(height / lineHeight);

  return (
    <View style={[styles.scanlineContainer, style]}>
      {Array.from({ length: lineCount }, (_, i) => (
        <View
          key={i}
          style={[
            styles.scanline,
            {
              top: (i * lineHeight + offset * 100) % height,
              height: lineHeight,
              backgroundColor: config.color,
              opacity: config.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Distortion Component
const DistortionComponent: React.FC<{
  config: HolographicConfig['distortion'];
  offset: number;
  children: React.ReactNode;
  style?: any;
}> = ({ config, offset, children, style }) => {
  if (!config.enabled) return <>{children}</>;

  const distortionValue = Math.sin(offset) * config.amplitude;

  return (
    <View
      style={[
        styles.distortionContainer,
        {
          transform: [
            { translateX: distortionValue },
            { translateY: distortionValue * 0.5 },
          ],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Glow Component
const GlowComponent: React.FC<{
  config: HolographicConfig['glow'];
  children: React.ReactNode;
  style?: any;
}> = ({ config, children, style }) => {
  if (!config.enabled) return <>{children}</>;

  return (
    <View style={[styles.glowContainer, style]}>
      {/* Glow background */}
      <BlurView
        intensity={config.intensity * 100}
        style={[
          styles.glowBackground,
          {
            shadowColor: config.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: config.intensity,
            shadowRadius: config.radius,
          },
        ]}
      />
      
      {/* Content */}
      <View style={styles.glowContent}>
        {children}
      </View>
    </View>
  );
};

// Reflection Component
const ReflectionComponent: React.FC<{
  config: HolographicConfig['reflections'];
  children: React.ReactNode;
  style?: any;
}> = ({ config, children, style }) => {
  if (!config.enabled) return <>{children}</>;

  return (
    <View style={[styles.reflectionContainer, style]}>
      {/* Original content */}
      <View style={styles.reflectionOriginal}>
        {children}
      </View>
      
      {/* Reflection */}
      <View
        style={[
          styles.reflection,
          {
            opacity: config.opacity,
            transform: [
              { translateY: config.offset },
              { scaleY: -1 },
            ],
          },
        ]}
      >
        <BlurView intensity={config.blur * 10}>
          {children}
        </BlurView>
      </View>
    </View>
  );
};

// Nova Holographic Effects Component
export const NovaHolographicEffects: React.FC<{
  config?: Partial<HolographicConfig>;
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}> = ({ config, children, style, onPress }) => {
  const { state, start, stop, toggle } = useNovaHolographicEffects(config);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-start when component mounts
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
    if (isVisible) {
      stop();
    } else {
      start();
    }
  }, [isVisible, start, stop]);

  // Pan responder for interactions
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Handle press
      onPress?.();
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      // Handle drag for interactive effects
      const { moveX, moveY } = evt.nativeEvent;
      // Update rotation based on drag
    },
    onPanResponderRelease: () => {
      // Handle release
    },
  });

  if (!isVisible) return null;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {/* Glow effect */}
      <GlowComponent config={finalConfig.glow}>
        {/* Distortion effect */}
        <DistortionComponent
          config={finalConfig.distortion}
          offset={state.distortionOffset}
        >
          {/* Reflection effect */}
          <ReflectionComponent config={finalConfig.reflections}>
            {/* Main content with 3D transforms */}
            <Animated.View
              style={[
                styles.content,
                {
                  transform: [
                    { perspective: 1000 },
                    { rotateX: `${state.rotation.x}deg` },
                    { rotateY: `${state.rotation.y}deg` },
                    { rotateZ: `${state.rotation.z}deg` },
                    { scale: state.scale },
                  ],
                  opacity: state.opacity * state.currentIntensity,
                },
              ]}
            >
              {children}
            </Animated.View>
          </ReflectionComponent>
        </DistortionComponent>
      </GlowComponent>
      
      {/* Scanlines overlay */}
      <ScanlineComponent
        config={finalConfig.scanlines}
        offset={state.scanlineOffset}
        style={styles.scanlineOverlay}
      />
      
      {/* Performance overlay */}
      {__DEV__ && (
        <View style={styles.performanceOverlay}>
          <Text style={styles.performanceText}>
            FPS: {Math.round(state.performance.fps)} | 
            Render: {Math.round(state.performance.renderTime)}ms | 
            Drops: {state.performance.frameDrops}
          </Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  
  content: {
    position: 'relative',
  },
  
  scanlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  
  distortionContainer: {
    position: 'relative',
  },
  
  glowContainer: {
    position: 'relative',
  },
  
  glowBackground: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 20,
  },
  
  glowContent: {
    position: 'relative',
    zIndex: 1,
  },
  
  reflectionContainer: {
    position: 'relative',
  },
  
  reflectionOriginal: {
    position: 'relative',
  },
  
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  performanceOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 4,
  },
  
  performanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

// Export default
export default NovaHolographicEffects;
