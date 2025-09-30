/**
 * 💥 Particle Collision System
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 PARTICLE COLLISION SYSTEM - Advanced collision detection and response
 * ✅ COLLISION DETECTION: Real-time collision detection between particles
 * ✅ COLLISION RESPONSE: Multiple collision response types (bounce, merge, destroy, split)
 * ✅ COLLISION VISUALIZATION: Visual effects for collision events
 * ✅ PERFORMANCE: Optimized collision detection algorithms
 * ✅ COLLISION ANALYSIS: Detailed collision analysis and statistics
 * ✅ CUSTOM RESPONSES: Support for custom collision response functions
 * 
 * Based on SwiftUI ParticleCollisionSystem.swift (250+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@cyntientops/design-tokens';
import { ParticlePhysicsEngine, CollisionEvent, Particle } from './ParticlePhysicsEngine';

export interface ParticleCollisionSystemProps {
  physicsEngine: ParticlePhysicsEngine;
  
  // Configuration
  enableCollisionVisualization?: boolean;
  enableCollisionEffects?: boolean;
  enableCollisionAnalysis?: boolean;
  enableHapticFeedback?: boolean;
  maxCollisionHistory?: number;
  
  // Callbacks
  onCollisionDetected?: (event: CollisionEvent) => void;
  onCollisionAnalysis?: (analysis: CollisionAnalysis) => void;
  onError?: (error: Error) => void;
}

export interface CollisionAnalysis {
  totalCollisions: number;
  collisionsByType: Record<string, number>;
  averageImpactForce: number;
  collisionFrequency: number;
  mostActiveParticles: string[];
  collisionHotspots: Vector2D[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface CollisionVisualization {
  event: CollisionEvent;
  animation: Animated.Value;
  isVisible: boolean;
  timestamp: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface CollisionStatistics {
  totalCollisions: number;
  bounceCollisions: number;
  mergeCollisions: number;
  destroyCollisions: number;
  splitCollisions: number;
  averageImpactForce: number;
  maxImpactForce: number;
  collisionRate: number; // collisions per second
}

export const ParticleCollisionSystem: React.FC<ParticleCollisionSystemProps> = ({
  physicsEngine,
  enableCollisionVisualization = true,
  enableCollisionEffects = true,
  enableCollisionAnalysis = true,
  enableHapticFeedback = true,
  maxCollisionHistory = 100,
  onCollisionDetected,
  onCollisionAnalysis,
  onError,
}) => {
  // State
  const [collisionEvents, setCollisionEvents] = useState<CollisionEvent[]>([]);
  const [visualizations, setVisualizations] = useState<Map<string, CollisionVisualization>>(new Map());
  const [statistics, setStatistics] = useState<CollisionStatistics>({
    totalCollisions: 0,
    bounceCollisions: 0,
    mergeCollisions: 0,
    destroyCollisions: 0,
    splitCollisions: 0,
    averageImpactForce: 0,
    maxImpactForce: 0,
    collisionRate: 0,
  });
  const [analysis, setAnalysis] = useState<CollisionAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // Refs
  const collisionHistory = useRef<CollisionEvent[]>([]);
  const lastAnalysisTime = useRef<Date>(new Date());
  const animationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize collision system
  useEffect(() => {
    // Set up collision callback
    physicsEngine.setCallbacks({
      onCollision: handleCollision,
    });

    // Start analysis timer
    const analysisInterval = setInterval(() => {
      if (enableCollisionAnalysis) {
        performCollisionAnalysis();
      }
    }, 5000); // Analyze every 5 seconds

    return () => {
      clearInterval(analysisInterval);
      // Clear all animation timeouts
      animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      animationTimeouts.current.clear();
    };
  }, [physicsEngine, enableCollisionAnalysis]);

  // Handle collision event
  const handleCollision = useCallback((event: CollisionEvent) => {
    try {
      // Add to collision history
      collisionHistory.current.push(event);
      if (collisionHistory.current.length > maxCollisionHistory) {
        collisionHistory.current = collisionHistory.current.slice(-maxCollisionHistory);
      }

      // Update collision events
      setCollisionEvents(prev => [...prev, event].slice(-maxCollisionHistory));

      // Update statistics
      updateCollisionStatistics(event);

      // Create collision visualization
      if (enableCollisionVisualization) {
        createCollisionVisualization(event);
      }

      // Trigger haptic feedback
      if (enableHapticFeedback && Platform.OS !== 'web') {
        const intensity = Math.min(event.impactForce / 10, 1);
        if (intensity > 0.3) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      // Trigger collision effects
      if (enableCollisionEffects) {
        triggerCollisionEffects(event);
      }

      onCollisionDetected?.(event);
    } catch (error) {
      console.error('❌ Error handling collision:', error);
      onError?.(error as Error);
    }
  }, [
    maxCollisionHistory,
    enableCollisionVisualization,
    enableCollisionEffects,
    enableHapticFeedback,
    onCollisionDetected,
    onError,
  ]);

  // Update collision statistics
  const updateCollisionStatistics = useCallback((event: CollisionEvent) => {
    setStatistics(prev => {
      const newStats = { ...prev };
      newStats.totalCollisions++;
      newStats.averageImpactForce = 
        (newStats.averageImpactForce * (newStats.totalCollisions - 1) + event.impactForce) / 
        newStats.totalCollisions;
      newStats.maxImpactForce = Math.max(newStats.maxImpactForce, event.impactForce);

      // Determine collision type based on particle types
      const response1 = event.particle1.type.interactions.collisionResponse;
      const response2 = event.particle2.type.interactions.collisionResponse;
      const response = getMoreDestructiveResponse(response1, response2);

      switch (response) {
        case 'bounce':
          newStats.bounceCollisions++;
          break;
        case 'merge':
          newStats.mergeCollisions++;
          break;
        case 'destroy':
          newStats.destroyCollisions++;
          break;
        case 'split':
          newStats.splitCollisions++;
          break;
      }

      // Calculate collision rate
      const now = new Date();
      const timeDiff = (now.getTime() - lastAnalysisTime.current.getTime()) / 1000;
      newStats.collisionRate = newStats.totalCollisions / Math.max(1, timeDiff);

      return newStats;
    });
  }, []);

  // Get more destructive collision response
  const getMoreDestructiveResponse = (response1: string, response2: string): string => {
    const destructiveness = {
      'bounce': 1,
      'merge': 2,
      'split': 3,
      'destroy': 4,
      'custom': 2,
    };
    
    return destructiveness[response1] > destructiveness[response2] ? response1 : response2;
  };

  // Create collision visualization
  const createCollisionVisualization = useCallback((event: CollisionEvent) => {
    const animation = new Animated.Value(0);
    const visualization: CollisionVisualization = {
      event,
      animation,
      isVisible: true,
      timestamp: Date.now(),
    };

    setVisualizations(prev => new Map(prev.set(event.particle1.id + '_' + event.particle2.id, visualization)));

    // Start collision animation
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Remove visualization after animation
    const timeout = setTimeout(() => {
      setVisualizations(prev => {
        const newMap = new Map(prev);
        newMap.delete(event.particle1.id + '_' + event.particle2.id);
        return newMap;
      });
    }, 600);

    animationTimeouts.current.set(event.particle1.id + '_' + event.particle2.id, timeout);
  }, []);

  // Trigger collision effects
  const triggerCollisionEffects = useCallback((event: CollisionEvent) => {
    // Create explosion effect at collision point
    const explosionParticles: Particle[] = [];
    const particleCount = Math.min(10, Math.floor(event.impactForce * 2));

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = event.impactForce * 0.5;
      const position = { ...event.collisionPoint };
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };

      // Create explosion particle
      const explosionParticle = physicsEngine.createParticle('energy', position, velocity, {
        explosion: true,
        collisionEvent: event.timestamp,
      });

      if (explosionParticle) {
        explosionParticles.push(explosionParticle);
      }
    }
  }, [physicsEngine]);

  // Perform collision analysis
  const performCollisionAnalysis = useCallback(() => {
    try {
      const now = new Date();
      const timeRange = {
        start: lastAnalysisTime.current,
        end: now,
      };

      // Analyze collisions in time range
      const recentCollisions = collisionHistory.current.filter(
        event => event.timestamp >= timeRange.start.getTime() && 
                 event.timestamp <= timeRange.end.getTime()
      );

      // Group collisions by type
      const collisionsByType: Record<string, number> = {};
      recentCollisions.forEach(event => {
        const response1 = event.particle1.type.interactions.collisionResponse;
        const response2 = event.particle2.type.interactions.collisionResponse;
        const response = getMoreDestructiveResponse(response1, response2);
        collisionsByType[response] = (collisionsByType[response] || 0) + 1;
      });

      // Calculate average impact force
      const averageImpactForce = recentCollisions.length > 0
        ? recentCollisions.reduce((sum, event) => sum + event.impactForce, 0) / recentCollisions.length
        : 0;

      // Calculate collision frequency
      const timeDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / 1000;
      const collisionFrequency = recentCollisions.length / Math.max(1, timeDiff);

      // Find most active particles
      const particleActivity: Record<string, number> = {};
      recentCollisions.forEach(event => {
        particleActivity[event.particle1.id] = (particleActivity[event.particle1.id] || 0) + 1;
        particleActivity[event.particle2.id] = (particleActivity[event.particle2.id] || 0) + 1;
      });

      const mostActiveParticles = Object.entries(particleActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      // Find collision hotspots
      const hotspotMap: Record<string, { count: number; x: number; y: number }> = {};
      recentCollisions.forEach(event => {
        const key = `${Math.floor(event.collisionPoint.x / 50)}_${Math.floor(event.collisionPoint.y / 50)}`;
        if (hotspotMap[key]) {
          hotspotMap[key].count++;
        } else {
          hotspotMap[key] = {
            count: 1,
            x: event.collisionPoint.x,
            y: event.collisionPoint.y,
          };
        }
      });

      const collisionHotspots = Object.values(hotspotMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(hotspot => ({ x: hotspot.x, y: hotspot.y }));

      const newAnalysis: CollisionAnalysis = {
        totalCollisions: recentCollisions.length,
        collisionsByType,
        averageImpactForce,
        collisionFrequency,
        mostActiveParticles,
        collisionHotspots,
        timeRange,
      };

      setAnalysis(newAnalysis);
      lastAnalysisTime.current = now;

      onCollisionAnalysis?.(newAnalysis);
    } catch (error) {
      console.error('❌ Error performing collision analysis:', error);
      onError?.(error as Error);
    }
  }, [onCollisionAnalysis, onError]);

  // Render collision visualization
  const renderCollisionVisualization = (visualization: CollisionVisualization) => {
    if (!visualization.isVisible) return null;

    const { event, animation } = visualization;
    const intensity = Math.min(event.impactForce / 10, 1);

    return (
      <Animated.View
        key={event.particle1.id + '_' + event.particle2.id}
        style={[
          styles.collisionEffect,
          {
            left: event.collisionPoint.x - 25,
            top: event.collisionPoint.y - 25,
            opacity: animation,
            transform: [
              {
                scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 2],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            `rgba(255, 255, 0, ${intensity * 0.8})`,
            `rgba(255, 0, 0, ${intensity * 0.6})`,
            'transparent',
          ]}
          style={styles.collisionGradient}
        />
        
        <View style={styles.collisionRing}>
          <Text style={styles.collisionForce}>
            {Math.round(event.impactForce)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Render collision statistics
  const renderCollisionStatistics = () => {
    if (!showStatistics) return null;

    return (
      <BlurView intensity={20} style={styles.statisticsPanel}>
        <Text style={styles.statisticsTitle}>Collision Statistics</Text>
        
        <View style={styles.statisticsGrid}>
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Total Collisions</Text>
            <Text style={styles.statisticValue}>{statistics.totalCollisions}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Bounce</Text>
            <Text style={styles.statisticValue}>{statistics.bounceCollisions}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Merge</Text>
            <Text style={styles.statisticValue}>{statistics.mergeCollisions}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Destroy</Text>
            <Text style={styles.statisticValue}>{statistics.destroyCollisions}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Split</Text>
            <Text style={styles.statisticValue}>{statistics.splitCollisions}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Avg Force</Text>
            <Text style={styles.statisticValue}>{statistics.averageImpactForce.toFixed(1)}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Max Force</Text>
            <Text style={styles.statisticValue}>{statistics.maxImpactForce.toFixed(1)}</Text>
          </View>
          
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>Rate/sec</Text>
            <Text style={styles.statisticValue}>{statistics.collisionRate.toFixed(1)}</Text>
          </View>
        </View>
      </BlurView>
    );
  };

  // Render collision analysis
  const renderCollisionAnalysis = () => {
    if (!showAnalysis || !analysis) return null;

    return (
      <BlurView intensity={20} style={styles.analysisPanel}>
        <Text style={styles.analysisTitle}>Collision Analysis</Text>
        
        <ScrollView style={styles.analysisContent}>
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Collision Types</Text>
            {Object.entries(analysis.collisionsByType).map(([type, count]) => (
              <View key={type} style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>{type}</Text>
                <Text style={styles.analysisValue}>{count}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Most Active Particles</Text>
            {analysis.mostActiveParticles.map((particleId, index) => (
              <View key={particleId} style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>#{index + 1}</Text>
                <Text style={styles.analysisValue}>{particleId.slice(-8)}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Collision Hotspots</Text>
            {analysis.collisionHotspots.slice(0, 5).map((hotspot, index) => (
              <View key={index} style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Hotspot #{index + 1}</Text>
                <Text style={styles.analysisValue}>
                  ({hotspot.x.toFixed(0)}, {hotspot.y.toFixed(0)})
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </BlurView>
    );
  };

  // Render controls
  const renderControls = () => {
    return (
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: showStatistics ? Colors.primary : 'rgba(255, 255, 255, 0.1)' },
          ]}
          onPress={() => setShowStatistics(!showStatistics)}
        >
          <Ionicons name="stats-chart" size={20} color={Colors.white} />
          <Text style={styles.controlButtonText}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: showAnalysis ? Colors.primary : 'rgba(255, 255, 255, 0.1)' },
          ]}
          onPress={() => setShowAnalysis(!showAnalysis)}
        >
          <Ionicons name="analytics" size={20} color={Colors.white} />
          <Text style={styles.controlButtonText}>Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            setCollisionEvents([]);
            collisionHistory.current = [];
            setStatistics({
              totalCollisions: 0,
              bounceCollisions: 0,
              mergeCollisions: 0,
              destroyCollisions: 0,
              splitCollisions: 0,
              averageImpactForce: 0,
              maxImpactForce: 0,
              collisionRate: 0,
            });
          }}
        >
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <Text style={styles.controlButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Collision visualizations */}
      {Array.from(visualizations.values()).map(renderCollisionVisualization)}
      
      {/* Statistics panel */}
      {renderCollisionStatistics()}
      
      {/* Analysis panel */}
      {renderCollisionAnalysis()}
      
      {/* Controls */}
      {renderControls()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  collisionEffect: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  collisionGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  collisionRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collisionForce: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
  },
  statisticsPanel: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statisticsTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statisticItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statisticLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  statisticValue: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  analysisPanel: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    bottom: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  analysisTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  analysisContent: {
    flex: 1,
  },
  analysisSection: {
    marginBottom: Spacing.md,
  },
  analysisSectionTitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  analysisLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
  },
  analysisValue: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
  },
  controls: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  controlButton: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  controlButtonText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.white,
    marginTop: 4,
  },
});

export default ParticleCollisionSystem;
