/**
 * @cyntientops/design-tokens
 * 
 * Typography System
 * Extracted from Swift CyntientOpsDesign.swift
 */

// Font Families
export const FontFamilies = {
  primary: 'System',            // System font (SF Pro on iOS, Roboto on Android)
  secondary: 'SpaceMono',       // Monospace for technical content
  display: 'System',            // Display font for headings
} as const;

// Font Weights
export const FontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Font Sizes (in pixels)
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

// Line Heights
export const LineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Letter Spacing
export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Typography Scale
export const Typography = {
  // Display Styles
  displayLarge: {
    fontSize: FontSizes['6xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  displayMedium: {
    fontSize: FontSizes['5xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  displaySmall: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },

  // Headline Styles
  headlineLarge: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.semibold,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  headlineMedium: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semibold,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  headlineSmall: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // Title Styles
  titleLarge: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  titleMedium: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  titleSmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // Body Styles
  bodyLarge: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  bodyMedium: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  bodySmall: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },

  // Label Styles
  labelLarge: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
  },
  labelMedium: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
  },
  labelSmall: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
  },

  // Monospace Styles (for technical content)
  monoLarge: {
    fontFamily: FontFamilies.secondary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  monoMedium: {
    fontFamily: FontFamilies.secondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  monoSmall: {
    fontFamily: FontFamilies.secondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;
export type FontSize = keyof typeof FontSizes;
export type FontWeight = keyof typeof FontWeights;
