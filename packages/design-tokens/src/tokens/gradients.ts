/**
 * @cyntientops/design-tokens
 * 
 * Gradient System
 * Extracted from Swift CyntientOpsDesign.swift
 */

export interface GradientConfig {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

// Background Gradients
export const BackgroundGradients = {
  primary: {
    colors: ['#0a0a0a', '#1a1a1a', '#0f0f0f'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: ['#1a1a1a', '#2a2a2a', '#1a1a1a'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dark: {
    colors: ['#000000', '#0a0a0a', '#1a1a1a'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

// Role-Based Gradients
export const RoleGradients = {
  worker: {
    colors: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)', 'transparent'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  admin: {
    colors: ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)', 'transparent'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  client: {
    colors: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)', 'transparent'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

// Status Gradients
export const StatusGradients = {
  success: {
    colors: ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warning: {
    colors: ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  error: {
    colors: ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  info: {
    colors: ['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

// Dashboard Gradients (for main backgrounds)
export const DashboardGradients = {
  backgroundGradient: BackgroundGradients.primary,
  cardGradient: BackgroundGradients.secondary,
  heroGradient: BackgroundGradients.dark,
} as const;

// Complete Gradients Export
export const Gradients = {
  background: BackgroundGradients,
  role: RoleGradients,
  status: StatusGradients,
  dashboard: DashboardGradients,
} as const;

export type GradientType = keyof typeof BackgroundGradients;
export type RoleGradientType = keyof typeof RoleGradients;
export type StatusGradientType = keyof typeof StatusGradients;
