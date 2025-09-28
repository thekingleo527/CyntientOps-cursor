/**
 * 🗺️ Map Reveal Container
 * Mirrors: CyntientOps/Views/Components/Containers/MapRevealContainer.swift
 * Purpose: Container that reveals map when expanded, shows content when collapsed
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, PanGestureHandler, State } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { NamedCoordinate } from '@cyntientops/domain-schema';
import { BuildingMapView } from '../maps/BuildingMapView';

export interface MapRevealContainerProps {
  buildings: NamedCoordinate[];
  currentBuildingId?: string;
  focusBuildingId?: string;
  isRevealed: boolean;
  onBuildingTap?: (building: NamedCoordinate) => void;
  children: React.ReactNode;
}

export const MapRevealContainer: React.FC<MapRevealContainerProps> = ({
  buildings,
  currentBuildingId,
  focusBuildingId,
  isRevealed,
  onBuildingTap,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(isRevealed);
  const [dragY] = useState(new Animated.Value(0));
  const [containerHeight] = useState(new Animated.Value(Dimensions.get('window').height * 0.7));
  const [mapOpacity] = useState(new Animated.Value(isRevealed ? 1 : 0));
  
  const { height: screenHeight } = Dimensions.get('window');
  const expandedHeight = screenHeight * 0.9;
  const collapsedHeight = screenHeight * 0.7;

  useEffect(() => {
    if (isRevealed !== isExpanded) {
      setIsExpanded(isRevealed);
      animateToState(isRevealed);
    }
  }, [isRevealed]);

  const animateToState = (expanded: boolean) => {
    const targetHeight = expanded ? expandedHeight : collapsedHeight;
    const targetMapOpacity = expanded ? 1 : 0;

    Animated.parallel([
      Animated.timing(containerHeight, {
        toValue: targetHeight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mapOpacity, {
        toValue: targetMapOpacity,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    { useNativeDriver: false }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Determine if we should expand or collapse based on gesture
      const shouldExpand = translationY < -50 || velocityY < -500;
      const shouldCollapse = translationY > 50 || velocityY > 500;
      
      if (shouldExpand && !isExpanded) {
        setIsExpanded(true);
        animateToState(true);
      } else if (shouldCollapse && isExpanded) {
        setIsExpanded(false);
        animateToState(false);
      } else {
        // Snap back to current state
        animateToState(isExpanded);
      }
      
      dragY.setValue(0);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Layer */}
      <Animated.View 
        style={[
          styles.mapLayer,
          {
            opacity: mapOpacity,
            transform: [
              {
                translateY: Animated.add(
                  dragY,
                  Animated.subtract(containerHeight, screenHeight)
                ),
              },
            ],
          },
        ]}
      >
        <BuildingMapView
          buildings={buildings}
          currentBuildingId={currentBuildingId}
          focusBuildingId={focusBuildingId}
          onBuildingPress={onBuildingTap}
          style={styles.map}
        />
      </Animated.View>

      {/* Content Layer */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View
          style={[
            styles.contentLayer,
            {
              height: Animated.add(containerHeight, dragY),
              transform: [{ translateY: dragY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  mapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  map: {
    flex: 1,
  },
  contentLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.glass.regular,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.glass.thin,
    zIndex: 2,
    shadowColor: Colors.base.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.text.secondary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
});

export default MapRevealContainer;
