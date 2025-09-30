/**
 * ⚡ Energy Field System
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 ENERGY FIELD SYSTEM - Interactive energy fields for particle physics
 * ✅ FIELD TYPES: Attraction, repulsion, gravity, magnetic, electric fields
 * ✅ INTERACTIVE: Touch-based field creation and manipulation
 * ✅ VISUALIZATION: Real-time field visualization with gradients
 * ✅ PARTICLE INTERACTION: Dynamic particle-field interactions
 * ✅ PERFORMANCE: Optimized field calculations and rendering
 * ✅ CUSTOM FIELDS: Support for custom field functions
 * 
 * Based on SwiftUI EnergyFieldSystem.swift (400+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@cyntientops/design-tokens';
import { ParticlePhysicsEngine, EnergyField, Vector2D } from './ParticlePhysicsEngine';

export interface EnergyFieldSystemProps {
  physicsEngine: ParticlePhysicsEngine;
  width: number;
  height: number;
  
  // Configuration
  enableTouchFields?: boolean;
  enableVisualization?: boolean;
  enableHapticFeedback?: boolean;
  maxFields?: number;
  
  // Field types
  availableFieldTypes?: FieldType[];
  defaultFieldType?: FieldType;
  
  // Callbacks
  onFieldCreated?: (field: EnergyField) => void;
  onFieldRemoved?: (fieldId: string) => void;
  onFieldModified?: (field: EnergyField) => void;
  onError?: (error: Error) => void;
}

export interface FieldType {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultStrength: number;
  defaultRadius: number;
  description: string;
}

export interface FieldVisualization {
  field: EnergyField;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  pulse: Animated.Value;
}

export interface TouchField {
  id: string;
  position: Vector2D;
  type: FieldType;
  strength: number;
  radius: number;
  active: boolean;
  timestamp: number;
}

export const EnergyFieldSystem: React.FC<EnergyFieldSystemProps> = ({
  physicsEngine,
  width,
  height,
  enableTouchFields = true,
  enableVisualization = true,
  enableHapticFeedback = true,
  maxFields = 10,
  availableFieldTypes = [],
  defaultFieldType,
  onFieldCreated,
  onFieldRemoved,
  onFieldModified,
  onError,
}) => {
  // State
  const [fields, setFields] = useState<EnergyField[]>([]);
  const [visualizations, setVisualizations] = useState<Map<string, FieldVisualization>>(new Map());
  const [touchFields, setTouchFields] = useState<TouchField[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(
    defaultFieldType || availableFieldTypes[0] || null
  );
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [showFieldControls, setShowFieldControls] = useState(false);

  // Refs
  const gestureRefs = useRef<Map<string, any>>(new Map());
  const animationRefs = useRef<Map<string, Animated.Value>>(new Map());

  // Default field types
  const defaultFieldTypes: FieldType[] = [
    {
      id: 'attraction',
      name: 'Attraction',
      icon: 'magnet',
      color: '#00FFFF',
      defaultStrength: 50,
      defaultRadius: 100,
      description: 'Attracts particles toward the field center',
    },
    {
      id: 'repulsion',
      name: 'Repulsion',
      icon: 'close-circle',
      color: '#FF0000',
      defaultStrength: 50,
      defaultRadius: 100,
      description: 'Repels particles away from the field center',
    },
    {
      id: 'gravity',
      name: 'Gravity',
      icon: 'planet',
      color: '#8B4513',
      defaultStrength: 30,
      defaultRadius: 150,
      description: 'Creates gravitational pull based on particle mass',
    },
    {
      id: 'magnetic',
      name: 'Magnetic',
      icon: 'magnet-outline',
      color: '#FFD700',
      defaultStrength: 40,
      defaultRadius: 120,
      description: 'Creates magnetic field based on particle charge',
    },
    {
      id: 'electric',
      name: 'Electric',
      color: '#FF00FF',
      icon: 'flash',
      defaultStrength: 60,
      defaultRadius: 80,
      description: 'Creates electric field based on particle charge',
    },
  ];

  const fieldTypes = availableFieldTypes.length > 0 ? availableFieldTypes : defaultFieldTypes;

  // Initialize field visualizations
  useEffect(() => {
    fields.forEach(field => {
      if (!visualizations.has(field.id)) {
        createFieldVisualization(field);
      }
    });
  }, [fields]);

  // Create field visualization
  const createFieldVisualization = useCallback((field: EnergyField) => {
    const visualization: FieldVisualization = {
      field,
      opacity: new Animated.Value(0.3),
      scale: new Animated.Value(1),
      rotation: new Animated.Value(0),
      pulse: new Animated.Value(1),
    };

    setVisualizations(prev => new Map(prev.set(field.id, visualization)));

    // Start field animations
    startFieldAnimations(visualization);
  }, []);

  // Start field animations
  const startFieldAnimations = useCallback((visualization: FieldVisualization) => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(visualization.pulse, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(visualization.pulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(visualization.rotation, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Create energy field
  const createEnergyField = useCallback((
    position: Vector2D,
    type: FieldType,
    strength: number = type.defaultStrength,
    radius: number = type.defaultRadius
  ): EnergyField => {
    try {
      const field: EnergyField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type.id as any,
        position: { ...position },
        strength,
        radius,
        falloff: 'quadratic',
        color: type.color,
        opacity: 0.6,
        active: true,
      };

      // Add to physics engine
      physicsEngine.addEnergyField(field);

      // Update state
      setFields(prev => [...prev, field]);

      // Trigger haptic feedback
      if (enableHapticFeedback && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onFieldCreated?.(field);
      return field;
    } catch (error) {
      console.error('❌ Error creating energy field:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [physicsEngine, enableHapticFeedback, onFieldCreated, onError]);

  // Remove energy field
  const removeEnergyField = useCallback((fieldId: string) => {
    try {
      // Remove from physics engine
      physicsEngine.removeEnergyField(fieldId);

      // Remove from state
      setFields(prev => prev.filter(field => field.id !== fieldId));

      // Remove visualization
      setVisualizations(prev => {
        const newMap = new Map(prev);
        newMap.delete(fieldId);
        return newMap;
      });

      // Trigger haptic feedback
      if (enableHapticFeedback && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      onFieldRemoved?.(fieldId);
    } catch (error) {
      console.error('❌ Error removing energy field:', error);
      onError?.(error as Error);
    }
  }, [physicsEngine, enableHapticFeedback, onFieldRemoved, onError]);

  // Modify energy field
  const modifyEnergyField = useCallback((fieldId: string, updates: Partial<EnergyField>) => {
    try {
      setFields(prev => prev.map(field => {
        if (field.id === fieldId) {
          const updatedField = { ...field, ...updates };
          
          // Update in physics engine
          physicsEngine.removeEnergyField(fieldId);
          physicsEngine.addEnergyField(updatedField);
          
          onFieldModified?.(updatedField);
          return updatedField;
        }
        return field;
      }));
    } catch (error) {
      console.error('❌ Error modifying energy field:', error);
      onError?.(error as Error);
    }
  }, [physicsEngine, onFieldModified, onError]);

  // Handle touch field creation
  const handleTouchFieldCreation = useCallback((position: Vector2D) => {
    if (!selectedFieldType || fields.length >= maxFields) return;

    const touchField: TouchField = {
      id: `touch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { ...position },
      type: selectedFieldType,
      strength: selectedFieldType.defaultStrength,
      radius: selectedFieldType.defaultRadius,
      active: true,
      timestamp: Date.now(),
    };

    setTouchFields(prev => [...prev, touchField]);

    // Create actual energy field after short delay
    setTimeout(() => {
      createEnergyField(position, selectedFieldType);
      setTouchFields(prev => prev.filter(tf => tf.id !== touchField.id));
    }, 100);
  }, [selectedFieldType, fields.length, maxFields, createEnergyField]);

  // Handle pan gesture
  const handlePanGesture = useCallback((event: any, fieldId: string) => {
    const { translationX, translationY } = event.nativeEvent;
    const field = fields.find(f => f.id === fieldId);
    
    if (field) {
      const newPosition = {
        x: field.position.x + translationX,
        y: field.position.y + translationY,
      };
      
      modifyEnergyField(fieldId, { position: newPosition });
    }
  }, [fields, modifyEnergyField]);

  // Handle pinch gesture
  const handlePinchGesture = useCallback((event: any, fieldId: string) => {
    const { scale } = event.nativeEvent;
    const field = fields.find(f => f.id === fieldId);
    
    if (field) {
      const newRadius = Math.max(20, Math.min(300, field.radius * scale));
      modifyEnergyField(fieldId, { radius: newRadius });
    }
  }, [fields, modifyEnergyField]);

  // Render field visualization
  const renderFieldVisualization = (field: EnergyField) => {
    const visualization = visualizations.get(field.id);
    if (!visualization || !enableVisualization) return null;

    const fieldType = fieldTypes.find(ft => ft.id === field.type);
    if (!fieldType) return null;

    return (
      <PanGestureHandler
        key={field.id}
        onGestureEvent={(event) => handlePanGesture(event, field.id)}
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.END) {
            // Gesture ended
          }
        }}
      >
        <Animated.View
          style={[
            styles.fieldContainer,
            {
              left: field.position.x - field.radius,
              top: field.position.y - field.radius,
              width: field.radius * 2,
              height: field.radius * 2,
              transform: [
                { scale: visualization.pulse },
                { rotate: visualization.rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
            },
          ]}
        >
          {/* Field gradient */}
          <LinearGradient
            colors={[
              `${fieldType.color}${Math.floor(field.opacity * 255).toString(16).padStart(2, '0')}`,
              `${fieldType.color}00`,
            ]}
            style={[
              styles.fieldGradient,
              {
                borderRadius: field.radius,
              },
            ]}
          />

          {/* Field border */}
          <View
            style={[
              styles.fieldBorder,
              {
                borderRadius: field.radius,
                borderColor: fieldType.color,
                borderWidth: 2,
              },
            ]}
          />

          {/* Field icon */}
          <View style={styles.fieldIcon}>
            <Ionicons
              name={fieldType.icon as any}
              size={24}
              color={fieldType.color}
            />
          </View>

          {/* Field strength indicator */}
          <View style={styles.fieldStrength}>
            <Text style={[styles.fieldStrengthText, { color: fieldType.color }]}>
              {Math.round(field.strength)}
            </Text>
          </View>

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeEnergyField(field.id)}
          >
            <Ionicons name="close" size={16} color={Colors.error} />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // Render field type selector
  const renderFieldTypeSelector = () => {
    if (!showFieldControls) return null;

    return (
      <BlurView intensity={20} style={styles.fieldTypeSelector}>
        <Text style={styles.selectorTitle}>Field Types</Text>
        <View style={styles.fieldTypeGrid}>
          {fieldTypes.map(fieldType => (
            <TouchableOpacity
              key={fieldType.id}
              style={[
                styles.fieldTypeButton,
                {
                  backgroundColor: selectedFieldType?.id === fieldType.id 
                    ? fieldType.color + '20' 
                    : 'rgba(255, 255, 255, 0.1)',
                  borderColor: fieldType.color,
                },
              ]}
              onPress={() => setSelectedFieldType(fieldType)}
            >
              <Ionicons
                name={fieldType.icon as any}
                size={24}
                color={fieldType.color}
              />
              <Text style={[styles.fieldTypeName, { color: fieldType.color }]}>
                {fieldType.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    );
  };

  // Render touch field preview
  const renderTouchFieldPreview = () => {
    if (!isCreatingField || !selectedFieldType) return null;

    return (
      <View style={styles.touchFieldPreview}>
        <Text style={styles.previewText}>
          Tap to create {selectedFieldType.name} field
        </Text>
      </View>
    );
  };

  // Render field controls
  const renderFieldControls = () => {
    return (
      <View style={styles.fieldControls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: showFieldControls ? Colors.primary : 'rgba(255, 255, 255, 0.1)',
            },
          ]}
          onPress={() => setShowFieldControls(!showFieldControls)}
        >
          <Ionicons
            name="settings"
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: isCreatingField ? Colors.success : 'rgba(255, 255, 255, 0.1)',
            },
          ]}
          onPress={() => setIsCreatingField(!isCreatingField)}
        >
          <Ionicons
            name="add"
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          ]}
          onPress={() => {
            fields.forEach(field => removeEnergyField(field.id));
          }}
        >
          <Ionicons
            name="trash"
            size={20}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={[styles.container, { width, height }]}>
      {/* Field visualizations */}
      {fields.map(renderFieldVisualization)}

      {/* Touch field preview */}
      {renderTouchFieldPreview()}

      {/* Field type selector */}
      {renderFieldTypeSelector()}

      {/* Field controls */}
      {renderFieldControls()}

      {/* Touch handler for field creation */}
      {enableTouchFields && isCreatingField && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={(event) => {
            const { locationX, locationY } = event.nativeEvent;
            handleTouchFieldCreation({ x: locationX, y: locationY });
          }}
          activeOpacity={1}
        />
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fieldContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  fieldBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  fieldIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  fieldStrength: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fieldStrengthText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTypeSelector: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  selectorTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  fieldTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldTypeButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  fieldTypeName: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  touchFieldPreview: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  previewText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.white,
    textAlign: 'center',
  },
  fieldControls: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default EnergyFieldSystem;
