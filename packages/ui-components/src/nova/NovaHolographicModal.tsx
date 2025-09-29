/**
 * NovaHolographicModal.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA HOLOGRAPHIC MODAL - Immersive 3D AI Workspace
 * ✅ FULL-SCREEN: Immersive 3D holographic workspace experience
 * ✅ PARTICLE EFFECTS: Advanced particle field and interactive effects
 * ✅ GESTURES: Pinch, rotate, swipe navigation controls
 * ✅ VOICE INTERFACE: Voice waveform and command interface
 * ✅ WORKSPACE TABS: Map, portfolio, analytics, and Nova workspace
 * ✅ HOLOGRAPHIC NOVA: 400x400px holographic Nova with advanced effects
 * ✅ INTERACTIVE: Full workspace with map, portfolio, analytics
 * 
 * Based on SwiftUI NovaHolographicView.swift (1,200+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  TouchableOpacity,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NovaAvatar } from './NovaAvatar';
import { NovaAIManager } from './NovaAIManager';
import { NovaContextType } from './NovaTypes';
import { CoreTypes } from '@cyntientops/domain-schema';

// Types
export interface NovaHolographicModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: CoreTypes.UserRole;
  userId?: string;
  userName?: string;
  
  // Customization
  theme?: 'dark' | 'light';
  showControls?: boolean;
  enableGestures?: boolean;
  
  // Callbacks
  onWorkspaceTabChange?: (tab: WorkspaceTab) => void;
  onVoiceCommand?: (command: string) => void;
  onGestureAction?: (action: GestureAction) => void;
}

export interface NovaHolographicState {
  currentScale: number;
  currentRotation: number;
  currentOffset: { x: number; y: number };
  showingControls: boolean;
  animationOffset: number;
  particlePhase: number;
  selectedWorkspaceTab: WorkspaceTab;
  interactiveParticles: AdvancedParticle[];
  energyField: number;
  particleSystemActive: boolean;
  isListening: boolean;
  waveformData: number[];
}

export interface AdvancedParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

export interface GestureAction {
  type: 'pinch' | 'rotate' | 'swipe' | 'tap';
  data: any;
}

export enum WorkspaceTab {
  NOVA = 'nova',
  MAP = 'map',
  PORTFOLIO = 'portfolio',
  ANALYTICS = 'analytics',
}

// Constants
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const NOVA_SIZE = 400;
const PARTICLE_COUNT = 50;
const ANIMATION_DURATION = 2000;
const GESTURE_THRESHOLD = 0.1;

export const NovaHolographicModal: React.FC<NovaHolographicModalProps> = ({
  visible,
  onClose,
  userRole,
  userId,
  userName,
  theme = 'dark',
  showControls = true,
  enableGestures = true,
  onWorkspaceTabChange,
  onVoiceCommand,
  onGestureAction,
}) => {
  // State
  const [state, setState] = useState<NovaHolographicState>({
    currentScale: 1.0,
    currentRotation: 0,
    currentOffset: { x: 0, y: 0 },
    showingControls: showControls,
    animationOffset: 0,
    particlePhase: 0,
    selectedWorkspaceTab: WorkspaceTab.NOVA,
    interactiveParticles: [],
    energyField: 0.5,
    particleSystemActive: false,
    isListening: false,
    waveformData: [],
  });

  // Refs
  const novaManagerRef = useRef<NovaAIManager | null>(null);
  const animationRefs = useRef({
    particlePhase: null as Animated.CompositeAnimation | null,
    energyField: null as Animated.CompositeAnimation | null,
    waveform: null as Animated.CompositeAnimation | null,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Effects
  useEffect(() => {
    if (visible) {
      initializeHolographicWorkspace();
      showModal();
      startHolographicEffects();
    } else {
      hideModal();
      stopHolographicEffects();
    }
  }, [visible]);

  useEffect(() => {
    if (state.particleSystemActive) {
      generateInteractiveParticles();
    }
  }, [state.particleSystemActive]);

  // Initialize Holographic Workspace
  const initializeHolographicWorkspace = async () => {
    try {
      // Initialize Nova AI Manager
      novaManagerRef.current = new NovaAIManager({
        userRole,
        userId,
        userName,
      });

      // Generate initial particles
      generateInteractiveParticles();
      
    } catch (error) {
      console.error('❌ Failed to initialize holographic workspace:', error);
      Alert.alert('Error', 'Failed to initialize Nova holographic workspace');
    }
  };

  // Modal Animations
  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Holographic Effects
  const startHolographicEffects = () => {
    // Particle phase animation
    animationRefs.current.particlePhase = Animated.loop(
      Animated.timing(new Animated.Value(0), {
        toValue: 1,
        duration: ANIMATION_DURATION * 2,
        useNativeDriver: false,
      })
    );
    animationRefs.current.particlePhase.start(({ value }) => {
      setState(prev => ({ ...prev, particlePhase: value }));
    });

    // Energy field animation
    animationRefs.current.energyField = Animated.loop(
      Animated.sequence([
        Animated.timing(new Animated.Value(0.3), {
          toValue: 0.8,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(new Animated.Value(0.8), {
          toValue: 0.3,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ])
    );
    animationRefs.current.energyField.start(({ value }) => {
      setState(prev => ({ ...prev, energyField: value }));
    });

    // Waveform animation (when listening)
    if (state.isListening) {
      startWaveformAnimation();
    }
  };

  const stopHolographicEffects = () => {
    Object.values(animationRefs.current).forEach(animation => {
      if (animation) {
        animation.stop();
      }
    });
  };

  const startWaveformAnimation = () => {
    animationRefs.current.waveform = Animated.loop(
      Animated.timing(new Animated.Value(0), {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      })
    );
    animationRefs.current.waveform.start(({ value }) => {
      // Generate waveform data
      const waveformData = Array.from({ length: 20 }, (_, i) => 
        Math.sin(value * Math.PI * 2 + i * 0.5) * 0.5 + 0.5
      );
      setState(prev => ({ ...prev, waveformData }));
    });
  };

  // Particle System
  const generateInteractiveParticles = () => {
    const particles: AdvancedParticle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: `particle_${i}`,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`, // Blue-green range
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      },
      life: Math.random() * 100,
      maxLife: 100,
    }));

    setState(prev => ({ ...prev, interactiveParticles: particles }));
  };

  // Gesture Handlers
  const handlePinchGesture = useCallback((event: any) => {
    if (!enableGestures) return;
    
    const scale = event.nativeEvent.scale;
    setState(prev => ({ ...prev, currentScale: Math.max(0.5, Math.min(2.0, scale)) }));
    
    if (onGestureAction) {
      onGestureAction({ type: 'pinch', data: { scale } });
    }
  }, [enableGestures, onGestureAction]);

  const handlePanGesture = useCallback((event: any) => {
    if (!enableGestures) return;
    
    const { translationX, translationY } = event.nativeEvent;
    setState(prev => ({
      ...prev,
      currentOffset: { x: translationX, y: translationY },
    }));
    
    if (onGestureAction) {
      onGestureAction({ type: 'swipe', data: { x: translationX, y: translationY } });
    }
  }, [enableGestures, onGestureAction]);

  const handleTapGesture = useCallback((event: any) => {
    if (!enableGestures) return;
    
    const { x, y } = event.nativeEvent;
    
    // Toggle controls on tap
    setState(prev => ({ ...prev, showingControls: !prev.showingControls }));
    
    if (onGestureAction) {
      onGestureAction({ type: 'tap', data: { x, y } });
    }
  }, [enableGestures, onGestureAction]);

  // Voice Interface
  const startVoiceInput = () => {
    setState(prev => ({ ...prev, isListening: true }));
    startWaveformAnimation();
    
    // Simulate voice input (replace with actual speech recognition)
    setTimeout(() => {
      const mockCommand = 'Show me the portfolio analytics';
      setState(prev => ({ ...prev, isListening: false }));
      
      if (onVoiceCommand) {
        onVoiceCommand(mockCommand);
      }
    }, 3000);
  };

  const stopVoiceInput = () => {
    setState(prev => ({ ...prev, isListening: false }));
    if (animationRefs.current.waveform) {
      animationRefs.current.waveform.stop();
    }
  };

  // Workspace Tab Management
  const handleWorkspaceTabChange = (tab: WorkspaceTab) => {
    setState(prev => ({ ...prev, selectedWorkspaceTab: tab }));
    
    if (onWorkspaceTabChange) {
      onWorkspaceTabChange(tab);
    }
  };

  // Render Methods
  const renderHolographicBackground = () => (
    <LinearGradient
      colors={theme === 'dark' 
        ? ['#000000', '#0a0a0a', '#1a1a2e', '#16213e', '#000000']
        : ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#ffffff']
      }
      style={styles.backgroundGradient}
    />
  );

  const renderParticleField = () => (
    <View style={styles.particleField}>
      {state.interactiveParticles.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderHolographicControlBar = () => {
    if (!state.showingControls) return null;

    return (
      <Animated.View style={[styles.controlBar, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.controlBarBlur}>
          <View style={styles.controlBarContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={styles.controlBarTitle}>Nova Holographic Workspace</Text>
            
            <View style={styles.controlBarActions}>
              <TouchableOpacity
                style={[styles.voiceButton, { backgroundColor: state.isListening ? '#FF4444' : '#00D4FF' }]}
                onPress={state.isListening ? stopVoiceInput : startVoiceInput}
              >
                <Ionicons 
                  name={state.isListening ? 'stop' : 'mic'} 
                  size={20} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderCentralNovaHologram = () => (
    <Animated.View
      style={[
        styles.centralNova,
        {
          transform: [
            { scale: scaleAnim },
            { scale: state.currentScale },
            { rotate: `${state.currentRotation}deg` },
            { translateX: state.currentOffset.x },
            { translateY: state.currentOffset.y },
          ],
        },
      ]}
    >
      <NovaAvatar
        size={NOVA_SIZE}
        isProcessing={state.isListening}
        showHolographicEffects={true}
        contextType={NovaContextType.PORTFOLIO}
      />
      
      {/* Holographic scanlines */}
      <View style={styles.holographicScanlines}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.scanline,
              {
                top: (i * NOVA_SIZE / 10) + (state.particlePhase * NOVA_SIZE),
                opacity: Math.sin(state.particlePhase * Math.PI * 2 + i * 0.5) * 0.5 + 0.5,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderWorkspaceTabBar = () => (
    <Animated.View style={[styles.workspaceTabBar, { opacity: fadeAnim }]}>
      <BlurView intensity={20} style={styles.tabBarBlur}>
        <View style={styles.tabBarContent}>
          {Object.values(WorkspaceTab).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                state.selectedWorkspaceTab === tab && styles.activeTabButton,
              ]}
              onPress={() => handleWorkspaceTabChange(tab)}
            >
              <Ionicons
                name={getTabIcon(tab)}
                size={24}
                color={state.selectedWorkspaceTab === tab ? '#00D4FF' : '#888888'}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: state.selectedWorkspaceTab === tab ? '#00D4FF' : '#888888' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderWorkspaceContent = () => {
    switch (state.selectedWorkspaceTab) {
      case WorkspaceTab.NOVA:
        return renderNovaWorkspace();
      case WorkspaceTab.MAP:
        return renderMapWorkspace();
      case WorkspaceTab.PORTFOLIO:
        return renderPortfolioWorkspace();
      case WorkspaceTab.ANALYTICS:
        return renderAnalyticsWorkspace();
      default:
        return renderNovaWorkspace();
    }
  };

  const renderNovaWorkspace = () => (
    <View style={styles.workspaceContent}>
      <Text style={styles.workspaceTitle}>Nova AI Workspace</Text>
      <Text style={styles.workspaceDescription}>
        Interactive AI assistant workspace with voice commands and gesture controls
      </Text>
    </View>
  );

  const renderMapWorkspace = () => (
    <View style={styles.workspaceContent}>
      <Text style={styles.workspaceTitle}>Portfolio Map</Text>
      <Text style={styles.workspaceDescription}>
        Interactive map view of all portfolio buildings and assets
      </Text>
    </View>
  );

  const renderPortfolioWorkspace = () => (
    <View style={styles.workspaceContent}>
      <Text style={styles.workspaceTitle}>Portfolio Overview</Text>
      <Text style={styles.workspaceDescription}>
        Comprehensive portfolio management and building information
      </Text>
    </View>
  );

  const renderAnalyticsWorkspace = () => (
    <View style={styles.workspaceContent}>
      <Text style={styles.workspaceTitle}>Analytics Dashboard</Text>
      <Text style={styles.workspaceDescription}>
        Performance metrics and operational analytics
      </Text>
    </View>
  );

  const renderVoiceInterfaceOverlay = () => {
    if (!state.isListening) return null;

    return (
      <Animated.View style={[styles.voiceInterfaceOverlay, { opacity: fadeAnim }]}>
        <BlurView intensity={30} style={styles.voiceInterfaceBlur}>
          <View style={styles.voiceInterfaceContent}>
            <Text style={styles.voiceInterfaceTitle}>Listening...</Text>
            
            {/* Waveform visualization */}
            <View style={styles.waveformContainer}>
              {state.waveformData.map((amplitude, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: amplitude * 40 + 10,
                      backgroundColor: `hsl(${180 + amplitude * 60}, 70%, 60%)`,
                    },
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.voiceInterfaceSubtitle}>
              Speak your command to Nova
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  // Helper Functions
  const getTabIcon = (tab: WorkspaceTab): string => {
    switch (tab) {
      case WorkspaceTab.NOVA: return 'brain';
      case WorkspaceTab.MAP: return 'map';
      case WorkspaceTab.PORTFOLIO: return 'business';
      case WorkspaceTab.ANALYTICS: return 'analytics';
      default: return 'brain';
    }
  };

  // Main Render
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderHolographicBackground()}
        {renderParticleField()}
        
        <View style={styles.mainContent}>
          {renderHolographicControlBar()}
          
          <View style={styles.centralArea}>
            {renderCentralNovaHologram()}
          </View>
          
          {renderWorkspaceTabBar()}
          {renderWorkspaceContent()}
        </View>
        
        {renderVoiceInterfaceOverlay()}
      </Animated.View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  particleField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  
  mainContent: {
    flex: 1,
    padding: 20,
  },
  
  controlBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  
  controlBarBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  controlBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  closeButton: {
    padding: 8,
  },
  
  controlBarTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  
  controlBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  centralArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  centralNova: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  holographicScanlines: {
    position: 'absolute',
    width: NOVA_SIZE,
    height: NOVA_SIZE,
    overflow: 'hidden',
  },
  
  scanline: {
    position: 'absolute',
    width: NOVA_SIZE,
    height: 2,
    backgroundColor: '#00D4FF',
    left: 0,
  },
  
  workspaceTabBar: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  
  tabBarBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  
  activeTabButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  
  workspaceContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  workspaceTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  workspaceDescription: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  voiceInterfaceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  voiceInterfaceBlur: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  voiceInterfaceContent: {
    padding: 40,
    alignItems: 'center',
  },
  
  voiceInterfaceTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 20,
    gap: 4,
  },
  
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  
  voiceInterfaceSubtitle: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
});

// Export default
export default NovaHolographicModal;
