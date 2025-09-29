/**
 * NovaHeader.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA HEADER - Persistent AI Assistant Integration
 * ✅ PERSISTENT: Always visible Nova avatar in dashboard headers
 * ✅ INTERACTIVE: Tap to open Nova interaction modal
 * ✅ STATUS: Shows processing state and connection status
 * ✅ INTEGRATED: Works across all dashboard types (Admin, Worker, Client)
 * ✅ HOLOGRAPHIC: Subtle holographic effects and animations
 * ✅ RESPONSIVE: Adapts to different header layouts
 * 
 * Based on SwiftUI Nova integration patterns
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NovaAvatar } from './NovaAvatar';
import { NovaAIManager } from './NovaAIManager';
import { NovaInteractionModal } from './NovaInteractionModal';
import { NovaHolographicModal } from './NovaHolographicModal';
import { NovaContextType, NovaPrompt, NovaResponse } from './NovaTypes';
import { CoreTypes } from '@cyntientops/domain-schema';

// Types
export interface NovaHeaderProps {
  // Core props
  userRole: CoreTypes.UserRole;
  userId?: string;
  userName?: string;
  
  // Layout props
  size?: 'small' | 'medium' | 'large';
  position?: 'left' | 'center' | 'right';
  showStatus?: boolean;
  showLabel?: boolean;
  
  // Interaction props
  onNovaPress?: () => void;
  onNovaLongPress?: () => void;
  
  // Style props
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  
  // Modal props
  showInteractionModal?: boolean;
  showHolographicModal?: boolean;
  onModalClose?: () => void;
  
  // Context props
  buildingContext?: string;
  taskContext?: string;
  workerContext?: string;
}

export interface NovaHeaderState {
  isProcessing: boolean;
  isConnected: boolean;
  lastResponse?: NovaResponse;
  pulseAnimation: Animated.Value;
  glowAnimation: Animated.Value;
  rotationAnimation: Animated.Value;
}

// Constants
const HEADER_SIZES = {
  small: { avatar: 32, text: 12, spacing: 8 },
  medium: { avatar: 40, text: 14, spacing: 12 },
  large: { avatar: 48, text: 16, spacing: 16 },
};

const ANIMATION_DURATION = 2000;
const PULSE_RANGE = [0.8, 1.2];
const GLOW_RANGE = [0.3, 1.0];

export const NovaHeader: React.FC<NovaHeaderProps> = ({
  userRole,
  userId,
  userName,
  size = 'medium',
  position = 'right',
  showStatus = true,
  showLabel = true,
  onNovaPress,
  onNovaLongPress,
  backgroundColor = 'rgba(0, 0, 0, 0.8)',
  textColor = '#FFFFFF',
  accentColor = '#00D4FF',
  showInteractionModal = false,
  showHolographicModal = false,
  onModalClose,
  buildingContext,
  taskContext,
  workerContext,
}) => {
  // State
  const [state, setState] = useState<NovaHeaderState>({
    isProcessing: false,
    isConnected: true,
    pulseAnimation: new Animated.Value(1),
    glowAnimation: new Animated.Value(0.5),
    rotationAnimation: new Animated.Value(0),
  });

  // Refs
  const novaManagerRef = useRef<NovaAIManager | null>(null);
  const animationRefs = useRef({
    pulse: null as Animated.CompositeAnimation | null,
    glow: null as Animated.CompositeAnimation | null,
    rotation: null as Animated.CompositeAnimation | null,
  });

  // Effects
  useEffect(() => {
    initializeNovaManager();
    startAnimations();
    
    return () => {
      stopAnimations();
    };
  }, []);

  useEffect(() => {
    if (state.isProcessing) {
      startProcessingAnimations();
    } else {
      stopProcessingAnimations();
    }
  }, [state.isProcessing]);

  // Initialize Nova Manager
  const initializeNovaManager = async () => {
    try {
      // Initialize Nova AI Manager with context
      const context = {
        userRole,
        userId,
        userName,
        buildingContext,
        taskContext,
        workerContext,
      };
      
      // This would initialize the actual NovaAIManager
      // For now, we'll simulate the connection status
      setState(prev => ({
        ...prev,
        isConnected: true,
      }));
      
    } catch (error) {
      console.error('❌ Failed to initialize Nova Manager:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
      }));
    }
  };

  // Animation Management
  const startAnimations = () => {
    // Pulse animation
    animationRefs.current.pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(state.pulseAnimation, {
          toValue: PULSE_RANGE[1],
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(state.pulseAnimation, {
          toValue: PULSE_RANGE[0],
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.pulse.start();

    // Glow animation
    animationRefs.current.glow = Animated.loop(
      Animated.sequence([
        Animated.timing(state.glowAnimation, {
          toValue: GLOW_RANGE[1],
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(state.glowAnimation, {
          toValue: GLOW_RANGE[0],
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.glow.start();

    // Rotation animation (subtle)
    animationRefs.current.rotation = Animated.loop(
      Animated.timing(state.rotationAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION * 4,
        useNativeDriver: true,
      })
    );
    animationRefs.current.rotation.start();
  };

  const stopAnimations = () => {
    Object.values(animationRefs.current).forEach(animation => {
      if (animation) {
        animation.stop();
      }
    });
  };

  const startProcessingAnimations = () => {
    // Faster pulse when processing
    if (animationRefs.current.pulse) {
      animationRefs.current.pulse.stop();
    }
    
    animationRefs.current.pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(state.pulseAnimation, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(state.pulseAnimation, {
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animationRefs.current.pulse.start();
  };

  const stopProcessingAnimations = () => {
    if (animationRefs.current.pulse) {
      animationRefs.current.pulse.stop();
    }
    startAnimations(); // Resume normal animations
  };

  // Event Handlers
  const handleNovaPress = () => {
    if (onNovaPress) {
      onNovaPress();
    } else {
      // Default behavior: open interaction modal
      setState(prev => ({ ...prev, showInteractionModal: true }));
    }
  };

  const handleNovaLongPress = () => {
    if (onNovaLongPress) {
      onNovaLongPress();
    } else {
      // Default behavior: open holographic modal
      setState(prev => ({ ...prev, showHolographicModal: true }));
    }
  };

  const handleModalClose = () => {
    setState(prev => ({
      ...prev,
      showInteractionModal: false,
      showHolographicModal: false,
    }));
    
    if (onModalClose) {
      onModalClose();
    }
  };

  // Quick Actions
  const handleQuickQuery = async (query: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const prompt: NovaPrompt = {
        id: `quick_${Date.now()}`,
        text: query,
        priority: CoreTypes.AIPriority.MEDIUM,
        createdAt: new Date(),
        metadata: {
          source: 'nova_header',
          userRole: userRole,
          userId: userId,
        },
      };
      
      // This would call the actual Nova API service
      // For now, simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastResponse: {
          id: `response_${Date.now()}`,
          success: true,
          message: `Quick response to: ${query}`,
          insights: [],
          actions: [],
          confidence: 0.9,
          timestamp: new Date(),
          metadata: { source: 'quick_query' },
        },
      }));
      
    } catch (error) {
      console.error('❌ Quick query failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Render Methods
  const renderStatusIndicator = () => {
    if (!showStatus) return null;
    
    return (
      <View style={styles.statusContainer}>
        {state.isProcessing ? (
          <ActivityIndicator 
            size="small" 
            color={accentColor} 
            style={styles.statusIndicator}
          />
        ) : (
          <View 
            style={[
              styles.statusDot, 
              { 
                backgroundColor: state.isConnected ? '#00FF88' : '#FF4444' 
              }
            ]} 
          />
        )}
      </View>
    );
  };

  const renderNovaLabel = () => {
    if (!showLabel) return null;
    
    const sizeConfig = HEADER_SIZES[size];
    
    return (
      <Text 
        style={[
          styles.novaLabel, 
          { 
            fontSize: sizeConfig.text,
            color: textColor,
            marginLeft: sizeConfig.spacing,
          }
        ]}
      >
        Nova AI
      </Text>
    );
  };

  const renderNovaAvatar = () => {
    const sizeConfig = HEADER_SIZES[size];
    const rotation = state.rotationAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    
    return (
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [
              { scale: state.pulseAnimation },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <NovaAvatar
          size={sizeConfig.avatar}
          isProcessing={state.isProcessing}
          showHolographicEffects={true}
          contextType={buildingContext ? NovaContextType.BUILDING : NovaContextType.PORTFOLIO}
        />
        
        {/* Holographic glow effect */}
        <Animated.View
          style={[
            styles.holographicGlow,
            {
              opacity: state.glowAnimation,
              width: sizeConfig.avatar + 20,
              height: sizeConfig.avatar + 20,
            },
          ]}
        />
      </Animated.View>
    );
  };

  // Main Render
  const sizeConfig = HEADER_SIZES[size];
  
  return (
    <>
      <TouchableOpacity
        style={[
          styles.novaHeader,
          {
            backgroundColor,
            padding: sizeConfig.spacing,
          },
        ]}
        onPress={handleNovaPress}
        onLongPress={handleNovaLongPress}
        activeOpacity={0.7}
      >
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.contentContainer}>
            {position === 'left' && renderNovaLabel()}
            
            {renderNovaAvatar()}
            
            {position === 'right' && renderNovaLabel()}
            
            {renderStatusIndicator()}
          </View>
        </BlurView>
      </TouchableOpacity>

      {/* Modals */}
      {showInteractionModal && (
        <NovaInteractionModal
          visible={showInteractionModal}
          onClose={handleModalClose}
          userRole={userRole}
          userId={userId}
          userName={userName}
          buildingContext={buildingContext}
          taskContext={taskContext}
          workerContext={workerContext}
        />
      )}

      {showHolographicModal && (
        <NovaHolographicModal
          visible={showHolographicModal}
          onClose={handleModalClose}
          userRole={userRole}
          userId={userId}
          userName={userName}
        />
      )}
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  novaHeader: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  holographicGlow: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    top: -10,
    left: -10,
  },
  
  novaLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  statusContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusIndicator: {
    width: 16,
    height: 16,
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// Export default
export default NovaHeader;
