/**
 * 🪝 useErrorBoundary Hook
 * Purpose: Hook for easy error boundary integration
 */

import React, { useCallback } from 'react';
import { ComponentErrorBoundary } from '../errors/ComponentErrorBoundary';
import { Logger } from '@cyntientops/business-core';

interface UseErrorBoundaryOptions {
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const useErrorBoundary = (options: UseErrorBoundaryOptions = {}) => {
  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    const componentName = options.componentName || 'Unknown Component';
    
    Logger.error(`Error in ${componentName}`, error, 'useErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: componentName,
    });

    if (options.onError) {
      options.onError(error, errorInfo);
    }
  }, [options]);

  const ErrorBoundary = useCallback(({ children }: { children: React.ReactNode }) => (
    <ComponentErrorBoundary
      componentName={options.componentName}
      onError={handleError}
    >
      {children}
    </ComponentErrorBoundary>
  ), [options.componentName, handleError]);

  return { ErrorBoundary };
};

export default useErrorBoundary;
