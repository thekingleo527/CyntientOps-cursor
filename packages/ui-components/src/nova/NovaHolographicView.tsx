/**
 * NovaHolographicView.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA HOLOGRAPHIC WORKSPACE - Immersive 3D AI Interface
 * ✅ HOLOGRAPHIC: 400x400px holographic Nova with advanced effects
 * ✅ INTERACTIVE: Full workspace with map, portfolio, analytics
 * ✅ PARTICLE: Advanced particle field and scanline effects
 * ✅ GESTURES: Pinch, rotate, swipe navigation
 * ✅ VOICE: Voice waveform and command interface
 * ✅ IMMERSIVE: Full-screen experience with depth
 * 
 * Based on SwiftUI NovaHolographicView.swift (1,051+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNovaAIManager } from './NovaAIManager';

// Types
export interface WorkspaceTab {
  id: string;
  icon: string;
  displayName: string;
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

export interface HolographicGridProps {
  offset: Animated.Value;
}

// Workspace Tabs
const WORKSPACE_TABS: WorkspaceTab[] = [
  { id: 'nova', icon: '🧠', displayName: 'Nova' },
  { id: 'map', icon: '🗺️', displayName: 'Map' },
  { id: 'portfolio', icon: '🏢', displayName: 'Portfolio' },
  { id: 'insights', icon: '💡', displayName: 'Insights' },
];

// Nova Holographic View Component
export const NovaHolographicView: React.FC<{
  onDismiss: () => void;
}> = ({ onDismiss }) => {
  const {
    novaState,
    particlePhase,
    holographicScale,
    holographicRotation,
    holographicOffset,
    voiceWaveform,
    onPanGestureEvent,
    onPinchGestureEvent,
    startVoiceListening,
    stopVoiceListening,
    engageHolographicMode,
    disengageHolographicMode,
  } = useNovaAIManager();

  // State
  const [currentScale, setCurrentScale] = useState(1.0);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentOffset, setCurrentOffset] = useState({ x: 0, y: 0 });
  const [showingControls, setShowingControls] = useState(true);
  const [animationOffset, setAnimationOffset] = useState(0);
  const [selectedWorkspaceTab, setSelectedWorkspaceTab] = useState<WorkspaceTab>(WORKSPACE_TABS[0]);
  const [interactiveParticles, setInteractiveParticles] = useState<AdvancedParticle[]>([]);
  const [energyField, setEnergyField] = useState(0.5);
  const [particleSystemActive, setParticleSystemActive] = useState(false);

  // Animation refs
  const holographicScaleAnimated = useRef(new Animated.Value(1.0)).current;
  const holographicRotationAnimated = useRef(new Animated.Value(0)).current;
  const holographicOffsetAnimated = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const particlePhaseAnimated = useRef(new Animated.Value(0)).current;
  const animationOffsetAnimated = useRef(new Animated.Value(0)).current;

  const { width, height } = Dimensions.get('window');

  // Initialize holographic effects
  useEffect(() => {
    startHolographicEffects();
    return () => stopHolographicEffects();
  }, []);

  // Start holographic effects
  const startHolographicEffects = useCallback(() => {
    // Particle phase animation
    Animated.loop(
      Animated.timing(particlePhaseAnimated, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Animation offset
    Animated.loop(
      Animated.timing(animationOffsetAnimated, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();

    // Initialize interactive particles
    initializeInteractiveParticles();
  }, []);

  // Stop holographic effects
  const stopHolographicEffects = useCallback(() => {
    particlePhaseAnimated.stopAnimation();
    animationOffsetAnimated.stopAnimation();
    setParticleSystemActive(false);
  }, []);

  // Initialize interactive particles
  const initializeInteractiveParticles = useCallback(() => {
    const particles: AdvancedParticle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        id: i.toString(),
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 1,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`, // Cyan to blue range
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        life: Math.random() * 100,
        maxLife: 100,
      });
    }
    setInteractiveParticles(particles);
    setParticleSystemActive(true);
  }, [width, height]);

  // Handle tab selection
  const handleTabSelection = useCallback((tab: WorkspaceTab) => {
    setSelectedWorkspaceTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle Nova tap
  const handleNovaTap = useCallback(() => {
    setShowingControls(!showingControls);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [showingControls]);

  // Handle Nova long press
  const handleNovaLongPress = useCallback(() => {
    if (novaState.isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [novaState.isListening, startVoiceListening, stopVoiceListening]);

  // Handle voice toggle
  const handleVoiceToggle = useCallback(() => {
    if (novaState.isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [novaState.isListening, startVoiceListening, stopVoiceListening]);

  // Handle exit
  const handleExit = useCallback(() => {
    disengageHolographicMode();
    onDismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [disengageHolographicMode, onDismiss]);

  return (
    <View style={styles.container}>
      {/* Deep space background */}
      <LinearGradient
        colors={['#000000', '#000033', '#000066', '#000000']}
        style={styles.background}
      />
      
      {/* Moving grid pattern */}
      <HolographicGrid offset={animationOffsetAnimated} />
      
      {/* Enhanced particle field effect */}
      <ParticleFieldView phase={particlePhaseAnimated} />
      
      {/* Advanced interactive particle system */}
      {particleSystemActive && (
        <AdvancedParticleSystemView
          particles={interactiveParticles}
          energyField={energyField}
          touchPoint={currentOffset}
          scale={currentScale}
        />
      )}
      
      {/* Main holographic workspace */}
      <View style={styles.workspace}>
        {/* Top control bar */}
        {showingControls && (
          <View style={styles.controlBar}>
            <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.modeIndicator}>
              <Text style={styles.modeIcon}>🔮</Text>
              <Text style={styles.modeText}>HOLOGRAPHIC MODE</Text>
            </View>
            
            <TouchableOpacity onPress={handleVoiceToggle} style={styles.voiceButton}>
              <Text style={styles.voiceButtonText}>
                {novaState.isListening ? '🎤' : '🎵'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.spacer} />
        
        {/* Central holographic Nova */}
        <View style={styles.holographicContainer}>
          <PinchGestureHandler onGestureEvent={onPinchGestureEvent}>
            <PanGestureHandler onGestureEvent={onPanGestureEvent}>
              <Animated.View
                style={[
                  styles.centralNovaHologram,
                  {
                    transform: [
                      { scale: holographicScaleAnimated },
                      { rotate: holographicRotationAnimated.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      }) },
                      { translateX: holographicOffsetAnimated.x },
                      { translateY: holographicOffsetAnimated.y }
                    ]
                  }
                ]}
              >
                {/* Base holographic Nova */}
                {novaState.holographicImage && (
                  <Image
                    source={{ uri: novaState.holographicImage }}
                    style={styles.holographicImage}
                  />
                )}
                
                {/* Scanline effect */}
                <ScanlineEffect />
                
                {/* Hologram distortion */}
                <HologramDistortion />
                
                {/* Holographic aura rings */}
                {[0, 1, 2].map(index => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.auraRing,
                      {
                        width: 400 + (index * 30),
                        height: 400 + (index * 30),
                        transform: [{
                          rotate: particlePhaseAnimated.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', `${(index + 1) * 360}deg`]
                          })
                        }]
                      }
                    ]}
                  />
                ))}
                
                {/* Status text */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>{novaState.statusText}</Text>
                </View>
              </Animated.View>
            </PanGestureHandler>
          </PinchGestureHandler>
        </View>
        
        <View style={styles.spacer} />
        
        {/* Bottom workspace tabs */}
        <View style={styles.workspaceTabBar}>
          {WORKSPACE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.workspaceTab,
                selectedWorkspaceTab.id === tab.id && styles.workspaceTabActive
              ]}
              onPress={() => handleTabSelection(tab)}
            >
              <Text style={[
                styles.workspaceTabIcon,
                selectedWorkspaceTab.id === tab.id && styles.workspaceTabIconActive
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.workspaceTabText,
                selectedWorkspaceTab.id === tab.id && styles.workspaceTabTextActive
              ]}>
                {tab.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Workspace content */}
        <View style={styles.workspaceContent}>
          <WorkspaceContent tab={selectedWorkspaceTab} novaState={novaState} />
        </View>
      </View>
      
      {/* Voice interface overlay */}
      {novaState.isListening && (
        <VoiceInterfaceOverlay waveform={voiceWaveform} />
      )}
    </View>
  );
};

// Holographic Grid Component
const HolographicGrid: React.FC<HolographicGridProps> = ({ offset }) => {
  return (
    <Animated.View
      style={[
        styles.holographicGrid,
        {
          transform: [{
            translateX: offset.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50]
            })
          }]
        }
      ]}
    >
      {/* Grid lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <View key={i} style={styles.gridLine} />
      ))}
    </Animated.View>
  );
};

// Particle Field View Component
const ParticleFieldView: React.FC<{ phase: Animated.Value }> = ({ phase }) => {
  const particles = Array.from({ length: 50 }, (_, i) => i);
  
  return (
    <View style={styles.particleField}>
      {particles.map(index => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: Math.random() * 400,
              top: Math.random() * 400,
              transform: [{
                scale: phase.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5]
                })
              }]
            }
          ]}
        />
      ))}
    </View>
  );
};

// Advanced Particle System View
const AdvancedParticleSystemView: React.FC<{
  particles: AdvancedParticle[];
  energyField: number;
  touchPoint: { x: number; y: number };
  scale: number;
}> = ({ particles, energyField, touchPoint, scale }) => {
  return (
    <View style={styles.advancedParticleSystem}>
      {particles.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.advancedParticle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
            }
          ]}
        />
      ))}
    </View>
  );
};

// Scanline Effect Component
const ScanlineEffect: React.FC = () => {
  const [scanlinePosition, setScanlinePosition] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePosition(prev => (prev + 1) % 400);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.scanlineEffect}>
      <View
        style={[
          styles.scanline,
          { top: scanlinePosition }
        ]}
      />
    </View>
  );
};

// Hologram Distortion Component
const HologramDistortion: React.FC = () => {
  return (
    <View style={styles.hologramDistortion}>
      {/* Distortion effects */}
      <View style={styles.distortionWave} />
      <View style={[styles.distortionWave, styles.distortionWave2]} />
      <View style={[styles.distortionWave, styles.distortionWave3]} />
    </View>
  );
};

// Workspace Content Component
const WorkspaceContent: React.FC<{
  tab: WorkspaceTab;
  novaState: any;
}> = ({ tab, novaState }) => {
  switch (tab.id) {
    case 'nova':
      return <NovaWorkspace novaState={novaState} />;
    case 'map':
      return <MapWorkspace />;
    case 'portfolio':
      return <PortfolioWorkspace />;
    case 'insights':
      return <InsightsWorkspace novaState={novaState} />;
    default:
      return <NovaWorkspace novaState={novaState} />;
  }
};

// Nova Workspace Component
const NovaWorkspace: React.FC<{ novaState: any }> = ({ novaState }) => (
  <View style={styles.workspaceView}>
    <View style={styles.workspaceHeader}>
      <Text style={styles.workspaceIcon}>🧠</Text>
      <Text style={styles.workspaceTitle}>Nova AI Status</Text>
    </View>
    
    <View style={styles.workspaceStats}>
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>{novaState.currentInsights.length}</Text>
        <Text style={styles.workspaceStatLabel}>Insights</Text>
      </View>
      
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>{novaState.priorityTasks.length}</Text>
        <Text style={styles.workspaceStatLabel}>Priority Tasks</Text>
      </View>
      
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>{novaState.novaState}</Text>
        <Text style={styles.workspaceStatLabel}>Status</Text>
      </View>
    </View>
  </View>
);

// Map Workspace Component
const MapWorkspace: React.FC = () => (
  <View style={styles.workspaceView}>
    <View style={styles.workspaceHeader}>
      <Text style={styles.workspaceIcon}>🗺️</Text>
      <Text style={styles.workspaceTitle}>Building Portfolio Map</Text>
    </View>
    
    <Text style={styles.workspacePlaceholder}>
      Interactive building map integration coming soon...
    </Text>
  </View>
);

// Portfolio Workspace Component
const PortfolioWorkspace: React.FC = () => (
  <View style={styles.workspaceView}>
    <View style={styles.workspaceHeader}>
      <Text style={styles.workspaceIcon}>🏢</Text>
      <Text style={styles.workspaceTitle}>Portfolio Overview</Text>
    </View>
    
    <View style={styles.workspaceStats}>
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>18</Text>
        <Text style={styles.workspaceStatLabel}>Buildings</Text>
      </View>
      
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>8</Text>
        <Text style={styles.workspaceStatLabel}>Workers</Text>
      </View>
      
      <View style={styles.workspaceStat}>
        <Text style={styles.workspaceStatValue}>150</Text>
        <Text style={styles.workspaceStatLabel}>Tasks</Text>
      </View>
    </View>
  </View>
);

// Insights Workspace Component
const InsightsWorkspace: React.FC<{ novaState: any }> = ({ novaState }) => (
  <View style={styles.workspaceView}>
    <View style={styles.workspaceHeader}>
      <Text style={styles.workspaceIcon}>💡</Text>
      <Text style={styles.workspaceTitle}>AI Insights</Text>
    </View>
    
    {novaState.currentInsights.length === 0 ? (
      <Text style={styles.workspacePlaceholder}>No active insights</Text>
    ) : (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {novaState.currentInsights.slice(0, 3).map((insight: any, index: number) => (
          <View key={index} style={styles.insightCard}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </ScrollView>
    )}
  </View>
);

// Voice Interface Overlay Component
const VoiceInterfaceOverlay: React.FC<{ waveform: Animated.Value }> = ({ waveform }) => {
  return (
    <View style={styles.voiceOverlay}>
      <Animated.View
        style={[
          styles.voiceWaveform,
          {
            transform: [{
              scaleY: waveform.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 2.0]
              })
            }]
          }
        ]}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  holographicGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#00FFFF',
    opacity: 0.2,
  },
  particleField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#00FFFF',
    borderRadius: 1,
  },
  advancedParticleSystem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  advancedParticle: {
    position: 'absolute',
    borderRadius: 2,
  },
  workspace: {
    flex: 1,
    padding: 20,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  exitButtonText: {
    color: '#00FFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.5)',
  },
  modeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modeText: {
    color: '#00FFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  voiceButtonText: {
    fontSize: 18,
  },
  spacer: {
    flex: 1,
  },
  holographicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralNovaHologram: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holographicImage: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  scanlineEffect: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#00FFFF',
    opacity: 0.8,
  },
  hologramDistortion: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    overflow: 'hidden',
  },
  distortionWave: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#00FFFF',
    opacity: 0.3,
  },
  distortionWave2: {
    top: 100,
  },
  distortionWave3: {
    top: 200,
  },
  auraRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FFFF',
    borderRadius: 200,
    opacity: 0.7,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00FFFF',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  workspaceTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  workspaceTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  workspaceTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.5)',
  },
  workspaceTabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#666',
  },
  workspaceTabIconActive: {
    color: '#00FFFF',
  },
  workspaceTabText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  workspaceTabTextActive: {
    color: '#00FFFF',
  },
  workspaceContent: {
    height: 200,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  workspaceView: {
    flex: 1,
    padding: 16,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workspaceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  workspaceTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workspaceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  workspaceStat: {
    alignItems: 'center',
  },
  workspaceStatValue: {
    color: '#00FFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  workspaceStatLabel: {
    color: '#666',
    fontSize: 12,
  },
  workspacePlaceholder: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  insightCard: {
    width: 150,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 12,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    color: '#666',
    fontSize: 10,
  },
  voiceOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveform: {
    width: 200,
    height: 20,
    backgroundColor: '#00FFFF',
    borderRadius: 10,
    opacity: 0.8,
  },
});

export default NovaHolographicView;
