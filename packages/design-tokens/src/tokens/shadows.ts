/**
 * @cyntientops/design-tokens
 * 
 * Shadow System for Glass Morphism
 * Extracted from Swift CyntientOpsDesign.swift
 */

// Base shadow values
export const ShadowValues = {
  // Elevation shadows
  elevation1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  elevation2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  elevation3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  elevation4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  elevation5: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },

  // Glass morphism shadows
  glassLight: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  glassMedium: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  glassHeavy: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Inner shadows (for glass effect)
  innerLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: -1,
  },
  innerMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: -2,
  },
} as const;

// Component-specific shadows
export const ComponentShadows = {
  // Card shadows
  card: ShadowValues.elevation2,
  cardHover: ShadowValues.elevation3,
  cardActive: ShadowValues.elevation1,

  // Button shadows
  button: ShadowValues.elevation1,
  buttonHover: ShadowValues.elevation2,
  buttonActive: ShadowValues.elevation1,

  // Modal shadows
  modal: ShadowValues.elevation4,
  modalBackdrop: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 0,
  },

  // Glass card shadows
  glassCard: ShadowValues.glassMedium,
  glassCardHover: ShadowValues.glassHeavy,

  // Navigation shadows
  navBar: ShadowValues.elevation2,
  tabBar: ShadowValues.elevation1,

  // Floating action button
  fab: ShadowValues.elevation3,
  fabHover: ShadowValues.elevation4,

  // Dropdown shadows
  dropdown: ShadowValues.elevation3,
  tooltip: ShadowValues.elevation2,
} as const;

// Glass morphism specific shadows
export const GlassShadows = {
  // Glass intensity shadows
  ultraThin: {
    ...ShadowValues.glassLight,
    shadowOpacity: 0.05,
  },
  thin: {
    ...ShadowValues.glassLight,
    shadowOpacity: 0.1,
  },
  regular: {
    ...ShadowValues.glassMedium,
    shadowOpacity: 0.15,
  },
  thick: {
    ...ShadowValues.glassHeavy,
    shadowOpacity: 0.25,
  },
} as const;

// Blur effects for glass morphism
export const BlurEffects = {
  ultraThin: 10,
  thin: 15,
  regular: 20,
  thick: 30,
} as const;

export type ShadowVariant = keyof typeof ShadowValues;
export type ComponentShadow = keyof typeof ComponentShadows;
export type GlassShadow = keyof typeof GlassShadows;
export type BlurIntensity = keyof typeof BlurEffects;
