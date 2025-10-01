/**
 * ⚡ Performance Optimizer
 * Purpose: Fast, graceful performance optimizations for CyntientOps
 * Features: Lazy loading, memory management, smooth animations, efficient rendering
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { InteractionManager, Dimensions, ScrollView, View, Image, Modal } from 'react-native';

const { width, height } = Dimensions.get('window');

// Performance monitoring
export const PerformanceMonitor = {
  frameDrops: 0,
  lastFrameTime: 0,
  
  startMonitoring: () => {
    const monitor = () => {
      const now = Date.now();
      if (PerformanceMonitor.lastFrameTime > 0) {
        const frameTime = now - PerformanceMonitor.lastFrameTime;
        if (frameTime > 16.67) { // 60fps threshold
          PerformanceMonitor.frameDrops++;
        }
      }
      PerformanceMonitor.lastFrameTime = now;
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  },
  
  getPerformanceMetrics: () => ({
    frameDrops: PerformanceMonitor.frameDrops,
    fps: PerformanceMonitor.frameDrops < 5 ? '60fps' : '30fps',
    isSmooth: PerformanceMonitor.frameDrops < 10
  })
};

// Lazy loading hook
export const useLazyLoading = <T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (loading || data) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use InteractionManager to defer loading until interactions are complete
      InteractionManager.runAfterInteractions(async () => {
        const result = await loadFunction();
        if (mountedRef.current) {
          setData(result);
        }
      });
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadFunction, loading, data]);

  useEffect(() => {
    load();
  }, dependencies);

  return { data, loading, error, reload: load };
};

// Memoized component wrapper
export const MemoizedComponent = React.memo(({ children, ...props }: any) => {
  return React.cloneElement(children, props);
});

// Efficient list rendering
export const VirtualizedList = React.memo(({ 
  data, 
  renderItem, 
  itemHeight = 60,
  containerHeight = height * 0.6,
  ...props 
}: {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  itemHeight?: number;
  containerHeight?: number;
  [key: string]: any;
}) => {
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 10 });
  const scrollViewRef = useRef<any>(null);

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const start = Math.floor(scrollY / itemHeight);
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 2, data.length);
    
    setVisibleRange({ start, end });
  }, [itemHeight, containerHeight, data.length]);

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      style={{ height: containerHeight }}
      {...props}
    >
      {/* Spacer for items before visible range */}
      <View style={{ height: visibleRange.start * itemHeight }} />
      
      {/* Render visible items */}
      {visibleItems.map((item, index) => 
        renderItem(item, visibleRange.start + index)
      )}
      
      {/* Spacer for items after visible range */}
      <View style={{ height: (data.length - visibleRange.end) * itemHeight }} />
    </ScrollView>
  );
});

// Image optimization
export const OptimizedImage = React.memo(({ 
  source, 
  style, 
  placeholder,
  ...props 
}: {
  source: any;
  style?: any;
  placeholder?: React.ReactElement;
  [key: string]: any;
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  if (error) {
    return placeholder || <View style={[style, { backgroundColor: '#f0f0f0' }]} />;
  }

  return (
    <View style={style}>
      {!loaded && placeholder}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </View>
  );
});

// Debounced input
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled function
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return func(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          func(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [func, delay]
  );
};

// Memory-efficient data processing
export const useDataProcessor = <T, R>(
  data: T[],
  processor: (data: T[]) => R,
  dependencies: any[] = []
) => {
  return useMemo(() => {
    if (!data || data.length === 0) return null;
    return processor(data);
  }, [data, ...dependencies]);
};

// Smooth scroll optimization
export const SmoothScrollView = React.memo(({ children, ...props }: any) => {
  const scrollViewRef = useRef<any>(null);
  
  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      {...props}
    >
      {children}
    </ScrollView>
  );
});

// Performance-optimized modal
export const OptimizedModal = React.memo(({ 
  visible, 
  children, 
  onClose,
  ...props 
}: {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  [key: string]: any;
}) => {
  const [shouldRender, setShouldRender] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      {...props}
    >
      {children}
    </Modal>
  );
};

// Export all performance utilities
export {
  PerformanceMonitor,
  useLazyLoading,
  MemoizedComponent,
  VirtualizedList,
  OptimizedImage,
  useDebounce,
  useThrottle,
  useDataProcessor,
  SmoothScrollView,
  OptimizedModal,
};
