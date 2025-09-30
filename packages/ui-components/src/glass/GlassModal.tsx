/**
 * GlassModal Component
 * 
 * Complete glass modal implementation extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Glass/GlassModal.swift
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  PanGestureHandler,
  State,
  StyleSheet,
  ViewStyle,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassIntensity, 
  GLASS_INTENSITY_CONFIG, 
  CORNER_RADIUS_VALUES, 
  CornerRadius,
  GLASS_OVERLAYS,
  GlassModalSize,
  GLASS_MODAL_SIZES
} from '@cyntientops/design-tokens';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  intensity?: GlassIntensity;
  cornerRadius?: CornerRadius;
  showCloseButton?: boolean;
  size?: GlassModalSize;
  title?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  children,
  intensity = GlassIntensity.REGULAR,
  cornerRadius = CornerRadius.LARGE,
  showCloseButton = true,
  size = GlassModalSize.MEDIUM,
  title,
  style,
  contentStyle,
  testID
}) => {
  const [scaleValue] = useState(new Animated.Value(0.9));
  const [opacityValue] = useState(new Animated.Value(0));
  const [backgroundOpacity] = useState(new Animated.Value(0));
  const [offsetValue] = useState(new Animated.ValueXY({ x: 0, y: 50 }));

  const intensityConfig = GLASS_INTENSITY_CONFIG[intensity];
  const radius = CORNER_RADIUS_VALUES[cornerRadius];
  const overlay = GLASS_OVERLAYS.regular;
  const sizeConfig = GLASS_MODAL_SIZES[size];

  useEffect(() => {
    if (visible) {
      presentModal();
    } else {
      dismissModal();
    }
  }, [visible]);

  const presentModal = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(offsetValue, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  };

  const dismissModal = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(offsetValue, {
        toValue: { x: 0, y: 50 },
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleBackgroundPress = () => {
    dismissModal();
  };

  const handleGestureEvent = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    if (translationY > 0) {
      const dragAmount = Math.abs(translationY);
      const scale = Math.max(0.85, 1.0 - (dragAmount / 1000));
      const opacity = Math.max(0.3, 1.0 - (dragAmount / 500));
      
      scaleValue.setValue(scale);
      opacityValue.setValue(opacity);
      offsetValue.setValue({ x: 0, y: translationY });
    }
  };

  const handleGestureStateChange = (event: any) => {
    const { state, translationY } = event.nativeEvent;
    
    if (state === State.END) {
      const dismissThreshold = 100;
      
      if (Math.abs(translationY) > dismissThreshold) {
        dismissModal();
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(opacityValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(offsetValue, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          })
        ]).start();
      }
    }
  };

  const modalStyle = [
    styles.modal,
    {
      maxWidth: sizeConfig.width,
      maxHeight: sizeConfig.height,
      borderRadius: radius,
      backgroundColor: overlay.background,
      borderColor: overlay.stroke,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: intensityConfig.shadowRadius,
      elevation: 20,
    },
    style
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissModal}
      testID={testID}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.background,
            {
              opacity: backgroundOpacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.backgroundTouchable}
            activeOpacity={1}
            onPress={handleBackgroundPress}
          />
        </Animated.View>

        <View style={styles.modalContainer}>
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View
              style={[
                modalStyle,
                {
                  transform: [
                    { scale: scaleValue },
                    { translateX: offsetValue.x },
                    { translateY: offsetValue.y }
                  ],
                  opacity: opacityValue,
                }
              ]}
            >
              <BlurView
                intensity={intensityConfig.blurRadius}
                tint="dark"
                style={[
                  styles.blurView,
                  {
                    borderRadius: radius,
                  }
                ]}
              >
                {showCloseButton && (
                  <View style={styles.closeButtonContainer}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={dismissModal}
                      testID={`${testID}-close`}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={[styles.content, contentStyle]}>
                  {title && (
                    <Text style={styles.title}>{title}</Text>
                  )}
                  {children}
                </View>
              </BlurView>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  blurView: {
    flex: 1,
    overflow: 'hidden',
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingRight: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'left',
  },
});

export default GlassModal;