/**
 * 🔄 useAsync Hook
 * Professional async state management with loading, error, and data states
 * Perfect for API calls and async operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '@cyntientops/business-core';

// Type definitions for Node.js globals
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  context?: string;
}

export interface UseAsyncReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for handling async operations with loading states
 *
 * @example
 * const { data, loading, error, execute } = useAsync(fetchBuildings, { immediate: true });
 *
 * @example
 * const { data, loading, execute } = useAsync(
 *   async (id: string) => await api.getBuilding(id),
 *   { context: 'BuildingDetail' }
 * );
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T, Args> {
  const {
    immediate = false,
    onSuccess,
    onError,
    context = 'useAsync',
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);
  const executingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      // Prevent concurrent executions
      if (executingRef.current) {
        Logger.debug('Skipping concurrent execution', undefined, context);
        return null;
      }

      executingRef.current = true;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      Logger.debug('Executing async operation', { args }, context);

      try {
        const data = await asyncFunction(...args);

        if (!mountedRef.current) {
          Logger.debug('Component unmounted, ignoring result', undefined, context);
          return null;
        }

        setState({ data, loading: false, error: null });
        Logger.debug('Async operation successful', undefined, context);

        if (onSuccess) {
          onSuccess(data);
        }

        executingRef.current = false;
        return data;
      } catch (error) {
        if (!mountedRef.current) {
          Logger.debug('Component unmounted, ignoring error', undefined, context);
          return null;
        }

        const err = error instanceof Error ? error : new Error(String(error));

        setState({ data: null, loading: false, error: err });
        Logger.error('Async operation failed', err, context);

        if (onError) {
          onError(err);
        }

        executingRef.current = false;
        return null;
      }
    },
    [asyncFunction, onSuccess, onError, context]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    executingRef.current = false;
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

/**
 * Hook for handling multiple async operations in parallel
 *
 * @example
 * const { data, loading, error, execute } = useAsyncAll([
 *   () => fetchBuildings(),
 *   () => fetchTasks(),
 *   () => fetchWorkers()
 * ]);
 */
export function useAsyncAll<T extends any[]>(
  asyncFunctions: Array<() => Promise<any>>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T, []> {
  const combinedFunction = useCallback(async () => {
    return Promise.all(asyncFunctions.map((fn) => fn())) as Promise<T>;
  }, [asyncFunctions]);

  return useAsync(combinedFunction, options);
}

/**
 * Hook for debounced async operations (e.g., search)
 *
 * @example
 * const { data, loading, execute } = useDebouncedAsync(
 *   searchBuildings,
 *   { delay: 500, context: 'BuildingSearch' }
 * );
 */
export function useDebouncedAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions & { delay?: number } = {}
): UseAsyncReturn<T, Args> {
  const { delay = 300, ...asyncOptions } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedFunction = useCallback(
    async (...args: Args): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await asyncFunction(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [asyncFunction, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useAsync(debouncedFunction, asyncOptions);
}
