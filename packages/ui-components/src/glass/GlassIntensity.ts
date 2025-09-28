/**
 * Glass Intensity Levels
 * Mirrors SwiftUI GlassIntensity enum with proper material effects
 */

export enum GlassIntensity {
  thin = 'thin',
  regular = 'regular',
  thick = 'thick',
  ultraThin = 'ultraThin',
  ultraThick = 'ultraThick'
}

export interface GlassIntensityConfig {
  opacity: number;
  blur: number;
  borderOpacity: number;
  shadowOpacity: number;
  shadowRadius: number;
}

export const GLASS_INTENSITY_CONFIGS: Record<GlassIntensity, GlassIntensityConfig> = {
  [GlassIntensity.ultraThin]: {
    opacity: 0.1,
    blur: 2,
    borderOpacity: 0.05,
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  [GlassIntensity.thin]: {
    opacity: 0.2,
    blur: 4,
    borderOpacity: 0.1,
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  [GlassIntensity.regular]: {
    opacity: 0.3,
    blur: 8,
    borderOpacity: 0.15,
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  [GlassIntensity.thick]: {
    opacity: 0.4,
    blur: 12,
    borderOpacity: 0.2,
    shadowOpacity: 0.2,
    shadowRadius: 12
  },
  [GlassIntensity.ultraThick]: {
    opacity: 0.5,
    blur: 16,
    borderOpacity: 0.25,
    shadowOpacity: 0.25,
    shadowRadius: 16
  }
};

export const getGlassConfig = (intensity: GlassIntensity): GlassIntensityConfig => {
  return GLASS_INTENSITY_CONFIGS[intensity];
};
