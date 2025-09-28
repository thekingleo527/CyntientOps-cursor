/**
 * @cyntientops/design-tokens
 * 
 * Spacing System
 * Extracted from Swift CyntientOpsDesign.swift
 */

// Base spacing unit (8px)
const baseUnit = 8;

// Spacing Scale
export const Spacing = {
  xs: baseUnit * 0.5,           // 4px
  sm: baseUnit * 1,             // 8px
  md: baseUnit * 1.5,           // 12px
  lg: baseUnit * 2,             // 16px
  xl: baseUnit * 3,             // 24px
  '2xl': baseUnit * 4,          // 32px
  '3xl': baseUnit * 6,          // 48px
  '4xl': baseUnit * 8,          // 64px
  '5xl': baseUnit * 12,         // 96px
  '6xl': baseUnit * 16,         // 128px
} as const;

// Component-specific spacing
export const ComponentSpacing = {
  // Card spacing
  cardPadding: Spacing.lg,      // 16px
  cardMargin: Spacing.md,       // 12px
  cardGap: Spacing.sm,          // 8px

  // Button spacing
  buttonPadding: {
    horizontal: Spacing.lg,     // 16px
    vertical: Spacing.md,       // 12px
  },
  buttonGap: Spacing.sm,        // 8px

  // Form spacing
  formFieldGap: Spacing.lg,     // 16px
  formGroupGap: Spacing.xl,     // 24px
  formLabelGap: Spacing.sm,     // 8px

  // List spacing
  listItemGap: Spacing.sm,      // 8px
  listSectionGap: Spacing.lg,   // 16px

  // Navigation spacing
  navItemPadding: {
    horizontal: Spacing.lg,     // 16px
    vertical: Spacing.md,       // 12px
  },
  navGap: Spacing.sm,           // 8px

  // Modal spacing
  modalPadding: Spacing.xl,     // 24px
  modalGap: Spacing.lg,         // 16px

  // Dashboard spacing
  dashboardGap: Spacing.lg,     // 16px
  dashboardPadding: Spacing.lg, // 16px
  dashboardSectionGap: Spacing.xl, // 24px

  // Task spacing
  taskGap: Spacing.sm,          // 8px
  taskPadding: Spacing.md,      // 12px
  taskGroupGap: Spacing.lg,     // 16px

  // Building spacing
  buildingCardGap: Spacing.md,  // 12px
  buildingCardPadding: Spacing.lg, // 16px

  // Worker spacing
  workerCardGap: Spacing.sm,    // 8px
  workerCardPadding: Spacing.md, // 12px
} as const;

// Layout spacing
export const LayoutSpacing = {
  // Screen margins
  screenMargin: Spacing.lg,     // 16px
  screenPadding: Spacing.lg,    // 16px

  // Section spacing
  sectionGap: Spacing.xl,       // 24px
  sectionPadding: Spacing.lg,   // 16px

  // Grid spacing
  gridGap: Spacing.lg,          // 16px
  gridPadding: Spacing.md,      // 12px

  // Stack spacing
  stackGap: Spacing.md,         // 12px
  stackPadding: Spacing.sm,     // 8px
} as const;

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Component-specific border radius
export const ComponentBorderRadius = {
  card: BorderRadius.lg,        // 12px
  button: BorderRadius.md,      // 8px
  input: BorderRadius.md,       // 8px
  modal: BorderRadius.xl,       // 16px
  badge: BorderRadius.full,     // 9999px
  avatar: BorderRadius.full,    // 9999px
} as const;

export type SpacingSize = keyof typeof Spacing;
export type BorderRadiusSize = keyof typeof BorderRadius;
