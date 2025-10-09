/**
 * Lazy Component Loader
 * Provides optimized lazy loading for React Native components
 */

import React, { ComponentType, lazy } from 'react';

export interface LazyLoadOptions {
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Creates a lazy-loaded component with optional priority hints
 */
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): T {
  return lazy(factory) as unknown as T;
}

/**
 * Utility for preloading components
 */
export class ComponentPreloader {
  private static preloadedComponents = new Set<() => Promise<any>>();

  static preloadCriticalScreens(): void {
    // Preload critical components if needed
    // This is called from AppNavigator on mount
  }

  static preloadComponent(factory: () => Promise<any>): void {
    if (!this.preloadedComponents.has(factory)) {
      this.preloadedComponents.add(factory);
      void factory();
    }
  }
}
