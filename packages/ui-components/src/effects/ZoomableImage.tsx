/**
 * ZoomableImage
 * Gesture-based pinch-to-zoom + pan image for RN (Reanimated + RNGH)
 */

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDecay, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface ZoomableImageProps {
  uri: string;
  maxScale?: number;
  minScale?: number;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, maxScale = 4, minScale = 1 }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(minScale, Math.min(maxScale, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (savedScale.value < minScale) {
        savedScale.value = minScale;
        scale.value = withTiming(minScale);
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) return; // disable pan when not zoomed
      translationX.value = savedX.value + e.translationX;
      translationY.value = savedY.value + e.translationY;
    })
    .onEnd((e) => {
      savedX.value = translationX.value;
      savedY.value = translationY.value;
      if (scale.value <= 1) {
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      } else {
        // gentle decay for pan end
        translationX.value = withDecay({ velocity: e.velocityX, clamp: undefined });
        translationY.value = withDecay({ velocity: e.velocityY, clamp: undefined });
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <AnimatedImage source={{ uri }} style={[styles.image, style]} resizeMode="contain" />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});

export default ZoomableImage;

