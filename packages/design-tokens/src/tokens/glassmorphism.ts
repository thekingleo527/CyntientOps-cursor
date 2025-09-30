/**
 * Glassmorphism Design Tokens
 * 
 * Complete glassmorphism system extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Design/GlassStyleTokens.swift
 * Mirrors: CyntientOps/Components/Glass/GlassTypes.swift
 */

import { StyleSheet } from 'react-native';

// MARK: - Glass Intensity (SINGLE SOURCE OF TRUTH)
export enum GlassIntensity {
  ULTRA_THIN = 'ultraThin',
  THIN = 'thin',
  REGULAR = 'regular',
  THICK = 'thick'
}

export interface GlassIntensityConfig {
  opacity: number;
  blurRadius: number;
  strokeOpacity: number;
  shadowRadius: number;
  brightness: number;
}

export const GLASS_INTENSITY_CONFIG: Record<GlassIntensity, GlassIntensityConfig> = {
  [GlassIntensity.ULTRA_THIN]: {
    opacity: 0.05,
    blurRadius: 10,
    strokeOpacity: 0.05,
    shadowRadius: 6,
    brightness: 0.3
  },
  [GlassIntensity.THIN]: {
    opacity: 0.1,
    blurRadius: 15,
    strokeOpacity: 0.1,
    shadowRadius: 12,
    brightness: 0.2
  },
  [GlassIntensity.REGULAR]: {
    opacity: 0.15,
    blurRadius: 20,
    strokeOpacity: 0.15,
    shadowRadius: 20,
    brightness: 0.1
  },
  [GlassIntensity.THICK]: {
    opacity: 0.25,
    blurRadius: 30,
    strokeOpacity: 0.25,
    shadowRadius: 30,
    brightness: 0.05
  }
};

// MARK: - Glass Overlays
export interface GlassOverlay {
  background: string;
  stroke: string;
  glow?: string;
}

export const GLASS_OVERLAYS = {
  light: {
    background: 'rgba(255, 255, 255, 0.1)',
    stroke: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.1)'
  },
  regular: {
    background: 'rgba(255, 255, 255, 0.15)',
    stroke: 'rgba(255, 255, 255, 0.3)',
    glow: 'rgba(255, 255, 255, 0.15)'
  },
  strong: {
    background: 'rgba(255, 255, 255, 0.2)',
    stroke: 'rgba(255, 255, 255, 0.4)',
    glow: 'rgba(255, 255, 255, 0.2)'
  }
};

// MARK: - Corner Radius
export enum CornerRadius {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  CARD = 'card'
}

export const CORNER_RADIUS_VALUES: Record<CornerRadius, number> = {
  [CornerRadius.SMALL]: 8,
  [CornerRadius.MEDIUM]: 12,
  [CornerRadius.LARGE]: 16,
  [CornerRadius.CARD]: 20
};

// MARK: - Glass Style Configuration
export interface GlassStyle {
  intensity: GlassIntensity;
  overlay: GlassOverlay;
  cornerRadius: CornerRadius;
  hasShadow: boolean;
  hasGlow: boolean;
}

// MARK: - Preset Combinations
export const GLASS_STYLE_PRESETS = {
  heroCard: {
    intensity: GlassIntensity.REGULAR,
    overlay: GLASS_OVERLAYS.regular,
    cornerRadius: CornerRadius.CARD,
    hasShadow: true,
    hasGlow: true
  },
  weatherRibbon: {
    intensity: GlassIntensity.THIN,
    overlay: GLASS_OVERLAYS.light,
    cornerRadius: CornerRadius.MEDIUM,
    hasShadow: false,
    hasGlow: false
  },
  mapPopover: {
    intensity: GlassIntensity.THICK,
    overlay: GLASS_OVERLAYS.strong,
    cornerRadius: CornerRadius.MEDIUM,
    hasShadow: true,
    hasGlow: true
  },
  tabBar: {
    intensity: GlassIntensity.REGULAR,
    overlay: GLASS_OVERLAYS.regular,
    cornerRadius: CornerRadius.LARGE,
    hasShadow: false,
    hasGlow: false
  },
  novaChat: {
    intensity: GlassIntensity.THICK,
    overlay: GLASS_OVERLAYS.regular,
    cornerRadius: CornerRadius.LARGE,
    hasShadow: true,
    hasGlow: false
  }
};

// MARK: - Glass Button Styles
export enum GlassButtonStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive',
  CUSTOM = 'custom'
}

export interface GlassButtonStyleConfig {
  baseColor: string;
  textColor: string;
  intensity: GlassIntensity;
}

export const GLASS_BUTTON_STYLES: Record<GlassButtonStyle, GlassButtonStyleConfig> = {
  [GlassButtonStyle.PRIMARY]: {
    baseColor: '#007AFF',
    textColor: '#FFFFFF',
    intensity: GlassIntensity.REGULAR
  },
  [GlassButtonStyle.SECONDARY]: {
    baseColor: '#8E8E93',
    textColor: '#FFFFFF',
    intensity: GlassIntensity.THIN
  },
  [GlassButtonStyle.TERTIARY]: {
    baseColor: 'transparent',
    textColor: 'rgba(255, 255, 255, 0.8)',
    intensity: GlassIntensity.ULTRA_THIN
  },
  [GlassButtonStyle.DESTRUCTIVE]: {
    baseColor: '#FF3B30',
    textColor: '#FFFFFF',
    intensity: GlassIntensity.REGULAR
  },
  [GlassButtonStyle.CUSTOM]: {
    baseColor: '#007AFF',
    textColor: '#FFFFFF',
    intensity: GlassIntensity.REGULAR
  }
};

// MARK: - Glass Button Sizes
export enum GlassButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export interface GlassButtonSizeConfig {
  padding: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  fontSize: number;
  cornerRadius: number;
}

export const GLASS_BUTTON_SIZES: Record<GlassButtonSize, GlassButtonSizeConfig> = {
  [GlassButtonSize.SMALL]: {
    padding: { top: 8, left: 16, bottom: 8, right: 16 },
    fontSize: 14,
    cornerRadius: 12
  },
  [GlassButtonSize.MEDIUM]: {
    padding: { top: 12, left: 24, bottom: 12, right: 24 },
    fontSize: 16,
    cornerRadius: 16
  },
  [GlassButtonSize.LARGE]: {
    padding: { top: 16, left: 32, bottom: 16, right: 32 },
    fontSize: 18,
    cornerRadius: 20
  }
};

// MARK: - Glass Modal Sizes
export enum GlassModalSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  FULL_SCREEN = 'fullScreen'
}

export interface GlassModalSizeConfig {
  width?: number;
  height?: number;
}

export const GLASS_MODAL_SIZES: Record<GlassModalSize, GlassModalSizeConfig> = {
  [GlassModalSize.SMALL]: { width: 300, height: 200 },
  [GlassModalSize.MEDIUM]: { width: 400, height: 400 },
  [GlassModalSize.LARGE]: { width: 600, height: 600 },
  [GlassModalSize.FULL_SCREEN]: { width: undefined, height: undefined }
};

// MARK: - Glass Theme
export interface GlassTheme {
  primary: string;
  secondary: string;
  background: string[];
  cardIntensity: GlassIntensity;
  modalIntensity: GlassIntensity;
}

export const GLASS_THEMES = {
  dark: {
    primary: '#007AFF',
    secondary: '#8B5CF6',
    background: [
      'rgba(13, 13, 39, 1)',
      'rgba(25, 25, 64, 1)'
    ],
    cardIntensity: GlassIntensity.REGULAR,
    modalIntensity: GlassIntensity.THICK
  },
  light: {
    primary: '#007AFF',
    secondary: '#4F46E5',
    background: [
      'rgba(242, 242, 247, 1)',
      'rgba(230, 230, 235, 1)'
    ],
    cardIntensity: GlassIntensity.THIN,
    modalIntensity: GlassIntensity.REGULAR
  }
};

// MARK: - Glass Configuration
export const GLASS_CONFIG = {
  defaultCornerRadius: 16,
  compactCornerRadius: 12,
  defaultPadding: 16,
  compactPadding: 12,
  defaultShadowRadius: 10,
  strokeOpacity: 0.1,
  
  // Animation durations
  quickAnimation: 200,
  standardAnimation: 300,
  slowAnimation: 500
};

// MARK: - Glass Color Utilities
export const GLASS_COLORS = {
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  glassBlack: 'rgba(0, 0, 0, 0.15)',
  glassBlue: 'rgba(0, 122, 255, 0.2)',
  glassPurple: 'rgba(139, 92, 246, 0.2)',
  glassGreen: 'rgba(52, 199, 89, 0.2)',
  glassOrange: 'rgba(255, 149, 0, 0.2)',
  glassRed: 'rgba(255, 59, 48, 0.2)'
};

// MARK: - Glass StyleSheet Utilities
export const createGlassStyle = (style: GlassStyle) => {
  const intensityConfig = GLASS_INTENSITY_CONFIG[style.intensity];
  const cornerRadius = CORNER_RADIUS_VALUES[style.cornerRadius];
  
  return StyleSheet.create({
    container: {
      backgroundColor: style.overlay.background,
      borderRadius: cornerRadius,
      borderWidth: 1,
      borderColor: style.overlay.stroke,
      ...(style.hasShadow && {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: intensityConfig.shadowRadius,
        elevation: 8
      })
    }
  });
};

// MARK: - Glass Animation Presets
export const GLASS_ANIMATIONS = {
  spring: {
    response: 0.6,
    dampingFraction: 0.8
  },
  quick: {
    duration: 200
  },
  standard: {
    duration: 300
  },
  slow: {
    duration: 500
  }
};
