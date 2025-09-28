/**
 * GlassModal Component
 * Mirrors SwiftUI GlassModal with proper glass morphism effects
 */

import React from 'react';
import { Modal, View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassIntensity, getGlassConfig } from './GlassIntensity';

export interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  intensity?: GlassIntensity;
  cornerRadius?: number;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  testID?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  children,
  intensity = GlassIntensity.regular,
  cornerRadius = 16,
  animationType = 'slide',
  presentationStyle = 'overFullScreen',
  testID
}) => {
  const [isVisible, setIsVisible] = React.useState(visible);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const config = getGlassConfig(intensity);

  React.useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible]);

  const handleBackdropPress = () => {
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        >
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.5)"
          />
        </Animated.View>

        {/* Backdrop Pressable */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdropPress}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              borderRadius: cornerRadius,
              borderWidth: 1,
              borderColor: `rgba(255, 255, 255, ${config.borderOpacity})`,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: config.shadowOpacity * 2,
              shadowRadius: config.shadowRadius * 2,
              elevation: 8,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="light"
            blurAmount={config.blur}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
          />
          <View style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: `rgba(255, 255, 255, ${config.opacity})` }
          ]} />
          <View style={{ zIndex: 1 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden'
  }
});
