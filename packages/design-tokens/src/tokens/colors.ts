/**
 * @cyntientops/design-tokens
 * 
 * Glass Morphism Color System
 * Extracted from Swift CyntientOpsDesign.swift
 */

// Base Background Colors (Dark Elegance Theme)
export const BaseColors = {
  background: '#0a0a0a',        // rgb(10, 10, 10)
  cardBackground: '#0f0f0f',    // rgb(15, 15, 15)
  surface: '#1a1a1a',          // rgb(26, 26, 26)
  elevated: '#2a2a2a',         // rgb(42, 42, 42)
} as const;

// Glass Overlay Colors
export const GlassColors = {
  ultraThin: 'rgba(255, 255, 255, 0.05)',   // opacity: 0.05
  thin: 'rgba(255, 255, 255, 0.1)',         // opacity: 0.1
  regular: 'rgba(255, 255, 255, 0.15)',     // opacity: 0.15
  thick: 'rgba(255, 255, 255, 0.25)',       // opacity: 0.25
} as const;

// Role-Based Primary Colors
export const RoleColors = {
  worker: {
    primary: '#10b981',         // rgb(16, 185, 129) - Green
    secondary: '#059669',       // rgb(5, 150, 105)
    accent: '#34d399',          // rgb(52, 211, 153)
    background: 'rgba(16, 185, 129, 0.1)',
  },
  admin: {
    primary: '#8b5cf6',         // rgb(139, 92, 246) - Purple
    secondary: '#7c3aed',       // rgb(124, 58, 237)
    accent: '#a78bfa',          // rgb(167, 139, 250)
    background: 'rgba(139, 92, 246, 0.1)',
  },
  client: {
    primary: '#10b981',         // rgb(16, 185, 129) - Green (same as worker)
    secondary: '#059669',       // rgb(5, 150, 105)
    accent: '#34d399',          // rgb(52, 211, 153)
    background: 'rgba(16, 185, 129, 0.1)',
  },
} as const;

// Status Colors
export const StatusColors = {
  success: '#10b981',           // Green
  warning: '#f59e0b',           // Amber
  error: '#ef4444',             // Red
  info: '#3b82f6',              // Blue
  pending: '#6b7280',           // Gray
} as const;

// Text Colors
export const TextColors = {
  primary: '#ffffff',           // White
  secondary: '#d1d5db',         // Light gray
  tertiary: '#9ca3af',          // Medium gray
  disabled: '#6b7280',          // Dark gray
  inverse: '#000000',           // Black
} as const;

// Border Colors
export const BorderColors = {
  light: 'rgba(255, 255, 255, 0.1)',
  medium: 'rgba(255, 255, 255, 0.2)',
  strong: 'rgba(255, 255, 255, 0.3)',
  accent: 'rgba(16, 185, 129, 0.3)',
} as const;

// Task Category Colors
export const TaskCategoryColors = {
  cleaning: '#10b981',          // Green
  maintenance: '#f59e0b',       // Amber
  sanitation: '#3b82f6',        // Blue
  inspection: '#8b5cf6',        // Purple
  operations: '#06b6d4',        // Cyan
  repair: '#ef4444',            // Red
  security: '#6b7280',          // Gray
} as const;

// Priority Colors
export const PriorityColors = {
  low: '#6b7280',               // Gray
  medium: '#f59e0b',            // Amber
  high: '#ef4444',              // Red
  urgent: '#dc2626',            // Dark red
  critical: '#991b1b',          // Very dark red
} as const;

// Complete Color Palette - Flattened for easy access
export const Colors = {
  // Base colors
  ...BaseColors,
  
  // Glass colors
  ...GlassColors,
  
  // Status colors (flattened)
  success: StatusColors.success,
  warning: StatusColors.warning,
  error: StatusColors.error,
  critical: StatusColors.error,
  info: StatusColors.info,
  pending: StatusColors.pending,
  inactive: StatusColors.pending,
  
  // Text colors (flattened)
  primaryText: TextColors.primary,
  secondaryText: TextColors.secondary,
  tertiaryText: TextColors.tertiary,
  disabledText: TextColors.disabled,
  inverseText: TextColors.inverse,
  
  // Border colors (flattened)
  borderSubtle: BorderColors.light,
  borderMedium: BorderColors.medium,
  borderStrong: BorderColors.strong,
  borderAccent: BorderColors.accent,
  
  // Primary action color (default to worker primary)
  primaryAction: RoleColors.worker.primary,
  
  // Glass overlay
  glassOverlay: GlassColors.regular,
  
  // Base background
  baseBackground: BaseColors.background,
  
  // Task category colors (flattened)
  ...TaskCategoryColors,
  
  // Priority colors (flattened)
  ...PriorityColors,
  
  // Role colors (nested for specific access)
  role: RoleColors,
  
  // Legacy compatibility - add the missing properties that components expect
  base: BaseColors,
  glass: GlassColors,
  text: TextColors,
  status: StatusColors,
  border: BorderColors,
  primary: RoleColors.worker.primary,
  secondary: RoleColors.worker.secondary,
  accent: RoleColors.worker.accent,
  
  // Additional missing properties
  blue: '#3b82f6',
  green: '#10b981',
  medium: BorderColors.medium,
  glassOverlayLight: 'rgba(255, 255, 255, 0.1)',
  glassOverlayDark: 'rgba(255, 255, 255, 0.2)',
  
  // Fix border color access
  borderLight: BorderColors.light,
  borderMedium: BorderColors.medium,
  borderStrong: BorderColors.strong,
  borderAccent: BorderColors.accent,
} as const;

export type ColorRole = keyof typeof RoleColors;
export type GlassIntensity = keyof typeof GlassColors;
export type TaskCategory = keyof typeof TaskCategoryColors;
export type Priority = keyof typeof PriorityColors;
