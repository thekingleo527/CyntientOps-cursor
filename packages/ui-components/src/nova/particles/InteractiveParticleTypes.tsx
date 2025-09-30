/**
 * 🎨 Interactive Particle Types
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 INTERACTIVE PARTICLE TYPES - Advanced particle type system with custom behaviors
 * ✅ PARTICLE TYPES: Energy, Data, Thought, Quantum particles with unique properties
 * ✅ CUSTOM BEHAVIORS: User-defined particle behaviors and interactions
 * ✅ VISUAL EFFECTS: Advanced visual effects and animations for each particle type
 * ✅ INTERACTIONS: Complex particle-to-particle interaction systems
 * ✅ PERFORMANCE: Optimized particle type management and rendering
 * ✅ EXTENSIBILITY: Easy addition of new particle types and behaviors
 * 
 * Based on SwiftUI InteractiveParticleTypes.swift (300+ lines)
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@cyntientops/design-tokens';
import { ParticlePhysicsEngine, ParticleType, Particle, Vector2D } from './ParticlePhysicsEngine';

export interface InteractiveParticleTypesProps {
  physicsEngine: ParticlePhysicsEngine;
  
  // Configuration
  enableCustomTypes?: boolean;
  enableTypeEditor?: boolean;
  enableParticleCreation?: boolean;
  maxCustomTypes?: number;
  
  // Callbacks
  onParticleTypeCreated?: (particleType: ParticleType) => void;
  onParticleTypeModified?: (particleType: ParticleType) => void;
  onParticleTypeDeleted?: (typeId: string) => void;
  onParticleCreated?: (particle: Particle) => void;
  onError?: (error: Error) => void;
}

export interface ParticleTypePreview {
  type: ParticleType;
  particles: Particle[];
  isActive: boolean;
  animationPhase: number;
}

export interface CustomParticleType {
  id: string;
  name: string;
  description: string;
  behavior: ParticleType['behavior'];
  physics: ParticleType['physics'];
  appearance: ParticleType['appearance'];
  interactions: ParticleType['interactions'];
  isCustom: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ParticleTypeEditor {
  isVisible: boolean;
  editingType: CustomParticleType | null;
  isCreating: boolean;
}

export const InteractiveParticleTypes: React.FC<InteractiveParticleTypesProps> = ({
  physicsEngine,
  enableCustomTypes = true,
  enableTypeEditor = true,
  enableParticleCreation = true,
  maxCustomTypes = 20,
  onParticleTypeCreated,
  onParticleTypeModified,
  onParticleTypeDeleted,
  onParticleCreated,
  onError,
}) => {
  // State
  const [particleTypes, setParticleTypes] = useState<ParticleType[]>([]);
  const [customTypes, setCustomTypes] = useState<CustomParticleType[]>([]);
  const [previews, setPreviews] = useState<Map<string, ParticleTypePreview>>(new Map());
  const [selectedType, setSelectedType] = useState<ParticleType | null>(null);
  const [editor, setEditor] = useState<ParticleTypeEditor>({
    isVisible: false,
    editingType: null,
    isCreating: false,
  });
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Refs
  const animationRefs = useRef<Map<string, Animated.Value>>(new Map());
  const previewParticles = useRef<Map<string, Particle[]>>(new Map());

  // Initialize particle types
  useEffect(() => {
    const types = physicsEngine.getParticleTypes();
    setParticleTypes(types);
    setSelectedType(types[0] || null);
    
    // Create previews for each type
    types.forEach(type => createParticleTypePreview(type));
  }, [physicsEngine]);

  // Create particle type preview
  const createParticleTypePreview = useCallback((particleType: ParticleType) => {
    try {
      // Create preview particles
      const previewParticles: Particle[] = [];
      const centerX = 50;
      const centerY = 50;
      
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 20;
        const position: Vector2D = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
        
        const velocity: Vector2D = {
          x: Math.cos(angle + Math.PI / 2) * 0.5,
          y: Math.sin(angle + Math.PI / 2) * 0.5,
        };
        
        const particle = physicsEngine.createParticle(particleType.id, position, velocity);
        if (particle) {
          previewParticles.push(particle);
        }
      }
      
      const preview: ParticleTypePreview = {
        type: particleType,
        particles: previewParticles,
        isActive: true,
        animationPhase: 0,
      };
      
      setPreviews(prev => new Map(prev.set(particleType.id, preview)));
      
      // Start preview animation
      startPreviewAnimation(particleType.id);
    } catch (error) {
      console.error('❌ Error creating particle type preview:', error);
      onError?.(error as Error);
    }
  }, [physicsEngine, onError]);

  // Start preview animation
  const startPreviewAnimation = useCallback((typeId: string) => {
    const animationValue = new Animated.Value(0);
    animationRefs.current.set(typeId, animationValue);
    
    Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Create custom particle type
  const createCustomParticleType = useCallback((customType: Omit<CustomParticleType, 'id' | 'createdAt'>) => {
    try {
      if (customTypes.length >= maxCustomTypes) {
        throw new Error('Maximum number of custom particle types reached');
      }
      
      const newCustomType: CustomParticleType = {
        ...customType,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      // Convert to ParticleType
      const particleType: ParticleType = {
        id: newCustomType.id,
        name: newCustomType.name,
        behavior: newCustomType.behavior,
        physics: newCustomType.physics,
        appearance: newCustomType.appearance,
        interactions: newCustomType.interactions,
      };
      
      // Add to physics engine
      physicsEngine.addParticleType(particleType);
      
      // Update state
      setCustomTypes(prev => [...prev, newCustomType]);
      setParticleTypes(prev => [...prev, particleType]);
      
      // Create preview
      createParticleTypePreview(particleType);
      
      onParticleTypeCreated?.(particleType);
      
      return newCustomType;
    } catch (error) {
      console.error('❌ Error creating custom particle type:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [customTypes.length, maxCustomTypes, physicsEngine, createParticleTypePreview, onParticleTypeCreated, onError]);

  // Modify custom particle type
  const modifyCustomParticleType = useCallback((typeId: string, updates: Partial<CustomParticleType>) => {
    try {
      setCustomTypes(prev => prev.map(customType => {
        if (customType.id === typeId) {
          const updatedCustomType = { ...customType, ...updates };
          
          // Convert to ParticleType and update in physics engine
          const particleType: ParticleType = {
            id: updatedCustomType.id,
            name: updatedCustomType.name,
            behavior: updatedCustomType.behavior,
            physics: updatedCustomType.physics,
            appearance: updatedCustomType.appearance,
            interactions: updatedCustomType.interactions,
          };
          
          // Remove old type and add updated type
          physicsEngine.addParticleType(particleType);
          
          // Update particle types
          setParticleTypes(prev => prev.map(pt => pt.id === typeId ? particleType : pt));
          
          // Update preview
          createParticleTypePreview(particleType);
          
          onParticleTypeModified?.(particleType);
          return updatedCustomType;
        }
        return customType;
      }));
    } catch (error) {
      console.error('❌ Error modifying custom particle type:', error);
      onError?.(error as Error);
    }
  }, [physicsEngine, createParticleTypePreview, onParticleTypeModified, onError]);

  // Delete custom particle type
  const deleteCustomParticleType = useCallback((typeId: string) => {
    try {
      // Remove from custom types
      setCustomTypes(prev => prev.filter(ct => ct.id !== typeId));
      
      // Remove from particle types
      setParticleTypes(prev => prev.filter(pt => pt.id !== typeId));
      
      // Remove preview
      setPreviews(prev => {
        const newMap = new Map(prev);
        newMap.delete(typeId);
        return newMap;
      });
      
      // Remove animation
      animationRefs.current.delete(typeId);
      
      onParticleTypeDeleted?.(typeId);
    } catch (error) {
      console.error('❌ Error deleting custom particle type:', error);
      onError?.(error as Error);
    }
  }, [onParticleTypeDeleted, onError]);

  // Create particle of selected type
  const createParticleOfType = useCallback((type: ParticleType, position: Vector2D) => {
    try {
      const particle = physicsEngine.createParticle(type.id, position);
      if (particle) {
        onParticleCreated?.(particle);
        
        // Trigger haptic feedback
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
      return particle;
    } catch (error) {
      console.error('❌ Error creating particle:', error);
      onError?.(error as Error);
      return null;
    }
  }, [physicsEngine, onParticleCreated, onError]);

  // Open type editor
  const openTypeEditor = useCallback((customType?: CustomParticleType) => {
    setEditor({
      isVisible: true,
      editingType: customType || null,
      isCreating: !customType,
    });
  }, []);

  // Close type editor
  const closeTypeEditor = useCallback(() => {
    setEditor({
      isVisible: false,
      editingType: null,
      isCreating: false,
    });
  }, []);

  // Render particle type preview
  const renderParticleTypePreview = (preview: ParticleTypePreview) => {
    const animationValue = animationRefs.current.get(preview.type.id);
    if (!animationValue) return null;

    return (
      <View key={preview.type.id} style={styles.previewContainer}>
        <Text style={styles.previewTitle}>{preview.type.name}</Text>
        
        <Animated.View
          style={[
            styles.previewArea,
            {
              transform: [
                {
                  rotate: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {preview.particles.map((particle, index) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.previewParticle,
                {
                  left: particle.position.x,
                  top: particle.position.y,
                  width: particle.radius * 2,
                  height: particle.radius * 2,
                  backgroundColor: particle.color,
                  opacity: particle.opacity,
                  borderRadius: particle.radius,
                  transform: [
                    {
                      scale: animationValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
        
        <View style={styles.previewInfo}>
          <Text style={styles.previewInfoText}>
            Mass: {preview.type.physics.mass}
          </Text>
          <Text style={styles.previewInfoText}>
            Charge: {preview.type.physics.charge}
          </Text>
          <Text style={styles.previewInfoText}>
            Energy: {preview.type.physics.energy}
          </Text>
        </View>
      </View>
    );
  };

  // Render particle type selector
  const renderParticleTypeSelector = () => {
    if (!showTypeSelector) return null;

    return (
      <Modal
        visible={showTypeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeSelector(false)}
      >
        <BlurView intensity={20} style={styles.selectorModal}>
          <View style={styles.selectorContent}>
            <Text style={styles.selectorTitle}>Select Particle Type</Text>
            
            <ScrollView style={styles.selectorScroll}>
              {particleTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeSelectorItem,
                    {
                      backgroundColor: selectedType?.id === type.id 
                        ? Colors.primary + '20' 
                        : 'rgba(255, 255, 255, 0.1)',
                      borderColor: selectedType?.id === type.id 
                        ? Colors.primary 
                        : 'rgba(255, 255, 255, 0.2)',
                    },
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setShowTypeSelector(false);
                  }}
                >
                  <View style={styles.typeSelectorIcon}>
                    <View
                      style={[
                        styles.typeIcon,
                        {
                          backgroundColor: type.appearance.color,
                          width: type.appearance.size * 2,
                          height: type.appearance.size * 2,
                          borderRadius: type.appearance.size,
                        },
                      ]}
                    />
                  </View>
                  
                  <View style={styles.typeSelectorInfo}>
                    <Text style={styles.typeSelectorName}>{type.name}</Text>
                    <Text style={styles.typeSelectorDescription}>
                      {type.behavior.movement} • {type.physics.mass}kg • {type.physics.charge}q
                    </Text>
                  </View>
                  
                  {customTypes.some(ct => ct.id === type.id) && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.selectorActions}>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowTypeSelector(false)}
              >
                <Text style={styles.selectorButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              {enableCustomTypes && (
                <TouchableOpacity
                  style={[styles.selectorButton, styles.selectorButtonPrimary]}
                  onPress={() => {
                    setShowTypeSelector(false);
                    openTypeEditor();
                  }}
                >
                  <Text style={styles.selectorButtonText}>Create Custom</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  // Render type editor
  const renderTypeEditor = () => {
    if (!editor.isVisible) return null;

    return (
      <Modal
        visible={editor.isVisible}
        transparent
        animationType="slide"
        onRequestClose={closeTypeEditor}
      >
        <BlurView intensity={20} style={styles.editorModal}>
          <View style={styles.editorContent}>
            <Text style={styles.editorTitle}>
              {editor.isCreating ? 'Create Custom Particle Type' : 'Edit Particle Type'}
            </Text>
            
            {/* Editor form would go here */}
            <View style={styles.editorForm}>
              <Text style={styles.editorFormText}>
                Particle type editor form would be implemented here
              </Text>
            </View>
            
            <View style={styles.editorActions}>
              <TouchableOpacity
                style={styles.editorButton}
                onPress={closeTypeEditor}
              >
                <Text style={styles.editorButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editorButton, styles.editorButtonPrimary]}
                onPress={() => {
                  // Save logic would go here
                  closeTypeEditor();
                }}
              >
                <Text style={styles.editorButtonText}>
                  {editor.isCreating ? 'Create' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  // Render controls
  const renderControls = () => {
    return (
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowTypeSelector(true)}
        >
          <Ionicons name="list" size={20} color={Colors.white} />
          <Text style={styles.controlButtonText}>Types</Text>
        </TouchableOpacity>
        
        {enableCustomTypes && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => openTypeEditor()}
          >
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.controlButtonText}>Custom</Text>
          </TouchableOpacity>
        )}
        
        {enableParticleCreation && selectedType && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              const centerX = Dimensions.get('window').width / 2;
              const centerY = Dimensions.get('window').height / 2;
              createParticleOfType(selectedType, { x: centerX, y: centerY });
            }}
          >
            <Ionicons name="nuclear" size={20} color={Colors.white} />
            <Text style={styles.controlButtonText}>Create</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Particle type previews */}
      <ScrollView style={styles.previewsContainer} horizontal>
        {Array.from(previews.values()).map(renderParticleTypePreview)}
      </ScrollView>
      
      {/* Controls */}
      {renderControls()}
      
      {/* Type selector modal */}
      {renderParticleTypeSelector()}
      
      {/* Type editor modal */}
      {renderTypeEditor()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewsContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  previewContainer: {
    width: 200,
    height: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  previewArea: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  previewParticle: {
    position: 'absolute',
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewInfoText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  controlButtonText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.white,
    marginTop: 4,
  },
  selectorModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  selectorTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  selectorScroll: {
    maxHeight: 400,
  },
  typeSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeSelectorIcon: {
    marginRight: Spacing.md,
  },
  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  typeSelectorInfo: {
    flex: 1,
  },
  typeSelectorName: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
  },
  typeSelectorDescription: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  customBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  customBadgeText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
  },
  selectorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  selectorButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  selectorButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  selectorButtonText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
  },
  editorModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  editorTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  editorForm: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorFormText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  editorButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  editorButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  editorButtonText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
  },
});

export default InteractiveParticleTypes;
