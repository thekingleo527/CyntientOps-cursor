/**
 * 🔗 ViewModel Integration Helpers
 * Utilities for connecting ViewModels to React components
 * Simplifies data flow and state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Logger } from '../services/LoggingService';

/**
 * Hook to integrate ViewModels with React components
 * Automatically subscribes to ViewModel updates and cleans up
 *
 * @example
 * const { state, loading, error } = useViewModel(WorkerDashboardViewModel, workerId);
 */
export function useViewModel<T, Args extends any[]>(
  ViewModelClass: any,
  ...args: Args
): {
  viewModel: T | null;
  state: any;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [viewModel, setViewModel] = useState<T | null>(null);
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initializeViewModel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      Logger.info('Initializing ViewModel', { ViewModelClass: ViewModelClass.name }, 'useViewModel');

      // Get or create ViewModel instance
      const instance =
        typeof ViewModelClass.getInstance === 'function'
          ? ViewModelClass.getInstance(...args)
          : new ViewModelClass(...args);

      // Initialize if method exists
      if (typeof instance.initialize === 'function') {
        await instance.initialize(...args);
      }

      if (!mountedRef.current) return;

      setViewModel(instance);

      // Get initial state
      if (typeof instance.getState === 'function') {
        const initialState = instance.getState();
        setState(initialState);
      }

      // Subscribe to updates if method exists
      if (typeof instance.subscribe === 'function') {
        instance.subscribe((newState: any) => {
          if (mountedRef.current) {
            setState(newState);
          }
        });
      }

      Logger.info('ViewModel initialized successfully', { ViewModelClass: ViewModelClass.name }, 'useViewModel');
    } catch (err) {
      Logger.error('ViewModel initialization failed', err, 'useViewModel');
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [ViewModelClass, ...args]);

  const refresh = useCallback(async () => {
    if (!viewModel) return;

    try {
      Logger.debug('Refreshing ViewModel', { ViewModelClass: ViewModelClass.name }, 'useViewModel');

      if (typeof (viewModel as any).refresh === 'function') {
        await (viewModel as any).refresh();
      } else if (typeof (viewModel as any).initialize === 'function') {
        await (viewModel as any).initialize(...args);
      }

      // Update state
      if (typeof (viewModel as any).getState === 'function') {
        const newState = (viewModel as any).getState();
        setState(newState);
      }
    } catch (err) {
      Logger.error('ViewModel refresh failed', err, 'useViewModel');
      setError(err instanceof Error ? err : new Error('Refresh failed'));
    }
  }, [viewModel, ViewModelClass, ...args]);

  useEffect(() => {
    initializeViewModel();
  }, [initializeViewModel]);

  return {
    viewModel,
    state,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for connecting services to components
 * Simplified service access with loading states
 */
export function useService<T>(
  ServiceClass: any,
  initMethod?: string
): {
  service: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [service, setService] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);

        Logger.debug('Initializing service', { ServiceClass: ServiceClass.name }, 'useService');

        // Get instance
        const instance =
          typeof ServiceClass.getInstance === 'function'
            ? ServiceClass.getInstance()
            : new ServiceClass();

        // Initialize if method specified
        if (initMethod && typeof (instance as any)[initMethod] === 'function') {
          await (instance as any)[initMethod]();
        }

        if (!mountedRef.current) return;

        setService(instance);
        Logger.debug('Service initialized', { ServiceClass: ServiceClass.name }, 'useService');
      } catch (err) {
        Logger.error('Service initialization failed', err, 'useService');
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeService();
  }, [ServiceClass, initMethod]);

  return {
    service,
    loading,
    error,
  };
}

/**
 * Helper to create ViewModel action handlers with error handling
 */
export function createActionHandler<Args extends any[]>(
  action: (...args: Args) => Promise<any>,
  options: {
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
    context?: string;
  } = {}
) {
  return async (...args: Args) => {
    const { onSuccess, onError, context = 'action' } = options;

    try {
      Logger.debug(`Executing ${context}`, { args }, 'ActionHandler');
      const result = await action(...args);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      Logger.error(`${context} failed`, error, 'ActionHandler');

      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }

      throw error;
    }
  };
}

/**
 * Helper for debounced ViewModel updates
 */
export function useDebouncedViewModelUpdate<T>(
  callback: (value: T) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );
}
