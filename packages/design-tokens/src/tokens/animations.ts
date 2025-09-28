/**
 * @cyntientops/design-tokens
 * 
 * Animation System
 * Extracted from Swift CyntientOpsDesign.swift
 */

// Duration values (in milliseconds)
export const AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750,
  slowest: 1000,
} as const;

// Easing functions
export const EasingFunctions = {
  // Standard easing
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom easing (for React Native)
  easeInCubic: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOutCubic: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOutCubic: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Spring-like easing
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

// Animation presets
export const AnimationPresets = {
  // Fade animations
  fadeIn: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOut,
  },
  fadeOut: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeIn,
  },

  // Scale animations
  scaleIn: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.spring,
  },
  scaleOut: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeIn,
  },

  // Slide animations
  slideInUp: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },
  slideInDown: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },
  slideInLeft: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },
  slideInRight: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },

  // Modal animations
  modalPresent: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },
  modalDismiss: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeInCubic,
  },

  // Button animations
  buttonPress: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeOut,
  },
  buttonRelease: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeIn,
  },

  // Card animations
  cardHover: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeOut,
  },
  cardUnhover: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeIn,
  },

  // Loading animations
  loading: {
    duration: AnimationDurations.slow,
    easing: EasingFunctions.linear,
  },
  pulse: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeInOut,
  },

  // Glass morphism animations
  glassBlur: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOut,
  },
  glassFocus: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeOut,
  },
} as const;

// Transition presets
export const TransitionPresets = {
  // Page transitions
  pageSlide: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeInOutCubic,
  },
  pageFade: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeInOut,
  },

  // Tab transitions
  tabSwitch: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeOut,
  },

  // List transitions
  listItemEnter: {
    duration: AnimationDurations.normal,
    easing: EasingFunctions.easeOutCubic,
  },
  listItemExit: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeInCubic,
  },

  // Form transitions
  formFieldFocus: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeOut,
  },
  formFieldBlur: {
    duration: AnimationDurations.fast,
    easing: EasingFunctions.easeIn,
  },
} as const;

// Stagger animations
export const StaggerConfig = {
  delay: 50,                    // 50ms between each item
  duration: AnimationDurations.normal,
  easing: EasingFunctions.easeOutCubic,
} as const;

// Haptic feedback timing
export const HapticTiming = {
  light: 10,                    // 10ms
  medium: 20,                   // 20ms
  heavy: 30,                    // 30ms
} as const;

export type AnimationDuration = keyof typeof AnimationDurations;
export type EasingFunction = keyof typeof EasingFunctions;
export type AnimationPreset = keyof typeof AnimationPresets;
export type TransitionPreset = keyof typeof TransitionPresets;
