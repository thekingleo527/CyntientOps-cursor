/**
 * 🚀 Advanced Asset Optimizer
 * Optimized asset loading with compression, lazy loading, and memory management
 */

import { Image, Dimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { nativeImageCompressor } from './NativeImageCompressor';
import { performanceMonitor } from './PerformanceMonitor';

// Get device dimensions for responsive image loading
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Critical assets - only essential for app startup
const CRITICAL_ASSETS = {
  icon: require('../../assets/images/icon.png'),
  splash: require('../../assets/images/splash.png'),
  aiAssistant: require('../../assets/images/AIAssistant.png'),
};

// Lazy-loaded assets - building photos and non-critical images
const LAZY_ASSETS = {
  // Building photos - loaded on demand
  buildings: [
    '104_Franklin_Street.jpg',
    '112_West_18th_Street.jpg',
    '115_7th_ave.JPG',
    '117_West_17th_Street.jpg',
    '12_West_18th_Street.jpg',
    '123_1st_Avenue.jpg',
    '131_Perry_Street.jpg',
    '133_East_15th_Street.jpg',
    '135West17thStreet.jpg',
    '136_West_17th_Street.jpg',
    '138West17thStreet.jpg',
    '148chambers.jpg',
    '178_Spring_st.jpg',
    '29_31_East_20th_Street.jpg',
    '36_Walker_Street.jpg',
    '41_Elizabeth_Street.jpeg',
    '68_Perry_Street.jpg',
    'Rubin_Museum_142_148_West_17th_Street.jpg',
    'Stuyvesant_Cove_Park.jpg',
  ],
};

// Optimized asset cache with memory management
const assetCache = new Map<string, any>();
const preloadedAssets = new Set<string>();
const loadingPromises = new Map<string, Promise<any>>();

export class AssetOptimizer {
  private static instance: AssetOptimizer;
  private maxCacheSize = 50; // Limit cache size to prevent memory issues
  private cacheAccessCount = new Map<string, number>();

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  /**
   * Preload critical assets for faster app startup
   * Only loads essential assets to minimize initial bundle
   */
  async preloadCriticalAssets(): Promise<void> {
    try {
      performanceMonitor.startMeasurement('critical_assets_preload', 'rendering');
      
      const preloadPromises = Object.entries(CRITICAL_ASSETS).map(async ([key, asset]) => {
        try {
          // Use Expo Asset for better caching and optimization
          const assetInstance = Asset.fromModule(asset);
          await assetInstance.downloadAsync();
          
          // Compress critical images for better performance
          if (key === 'icon' || key === 'splash' || key === 'aiAssistant') {
            try {
              const compressedResult = await nativeImageCompressor.compressImage(
                assetInstance.localUri || assetInstance.uri,
                key === 'icon' ? 'icon' : key === 'splash' ? 'splash' : 'general'
              );
              
              // Store compressed version
              assetCache.set(`${key}_compressed`, compressedResult);
              console.log(`✅ Critical asset compressed: ${key} (${(compressedResult.compressionRatio * 100).toFixed(1)}% of original)`);
            } catch (compressionError) {
              console.warn(`Failed to compress ${key}, using original:`, compressionError);
            }
          }
          
          assetCache.set(key, assetInstance);
          preloadedAssets.add(key);
          this.cacheAccessCount.set(key, 1);
          
          console.log(`✅ Critical asset preloaded: ${key}`);
        } catch (error) {
          console.warn(`❌ Failed to preload asset ${key}:`, error);
        }
      });

      await Promise.allSettled(preloadPromises);
      performanceMonitor.endMeasurement('critical_assets_preload');
      console.log('🚀 Critical assets preloaded successfully');
    } catch (error) {
      console.warn('Asset preloading failed:', error);
    }
  }

  /**
   * Lazy load building photos on demand with intelligent compression
   * Only loads when actually needed to reduce initial bundle
   */
  async loadBuildingPhoto(photoName: string): Promise<any> {
    const cacheKey = `building_${photoName}`;
    const compressedCacheKey = `building_compressed_${photoName}`;
    
    // Return cached compressed asset if available
    if (assetCache.has(compressedCacheKey)) {
      this.cacheAccessCount.set(compressedCacheKey, (this.cacheAccessCount.get(compressedCacheKey) || 0) + 1);
      return assetCache.get(compressedCacheKey);
    }
    
    // Return cached original asset if available
    if (assetCache.has(cacheKey)) {
      this.cacheAccessCount.set(cacheKey, (this.cacheAccessCount.get(cacheKey) || 0) + 1);
      return assetCache.get(cacheKey);
    }

    // Return existing loading promise if already loading
    if (loadingPromises.has(cacheKey)) {
      return loadingPromises.get(cacheKey);
    }

    // Create loading promise
    const loadingPromise = this.loadBuildingPhotoInternal(photoName);
    loadingPromises.set(cacheKey, loadingPromise);

    try {
      const asset = await loadingPromise;
      assetCache.set(cacheKey, asset);
      this.cacheAccessCount.set(cacheKey, 1);
      preloadedAssets.add(cacheKey);
      loadingPromises.delete(cacheKey);
      
      // Compress the building photo for better performance
      try {
        const compressedResult = await nativeImageCompressor.compressImage(
          asset.localUri || asset.uri,
          'building'
        );
        
        // Store compressed version
        assetCache.set(compressedCacheKey, compressedResult);
        console.log(`✅ Building photo compressed: ${photoName} (${(compressedResult.compressionRatio * 100).toFixed(1)}% of original)`);
        
        // Return compressed version for better performance
        return compressedResult;
      } catch (compressionError) {
        console.warn(`Failed to compress building photo ${photoName}, using original:`, compressionError);
        return asset;
      }
      
      // Manage cache size
      this.manageCacheSize();
      
    } catch (error) {
      loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  private async loadBuildingPhotoInternal(photoName: string): Promise<any> {
    try {
      const assetPath = `../../assets/images/buildings/${photoName}`;
      const asset = require(assetPath);
      const assetInstance = Asset.fromModule(asset);
      await assetInstance.downloadAsync();
      return assetInstance;
    } catch (error) {
      console.warn(`Failed to load building photo ${photoName}:`, error);
      throw error;
    }
  }

  /**
   * Manage cache size to prevent memory issues
   * Uses LRU (Least Recently Used) strategy
   */
  private manageCacheSize(): void {
    if (assetCache.size <= this.maxCacheSize) return;

    // Sort by access count (least accessed first)
    const sortedEntries = Array.from(this.cacheAccessCount.entries())
      .sort(([, a], [, b]) => (a || 0) - (b || 0));

    // Remove least accessed items
    const itemsToRemove = assetCache.size - this.maxCacheSize;
    for (let i = 0; i < itemsToRemove && i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (entry) {
        const [key] = entry;
        assetCache.delete(key);
        preloadedAssets.delete(key);
        this.cacheAccessCount.delete(key);
      }
    }
  }

  /**
   * Get cached asset or load it
   */
  getAsset(uri: string): any {
    return assetCache.get(uri) || null;
  }

  /**
   * Preload image for faster rendering with optimization
   */
  preloadImage(uri: string, width?: number, height?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const optimizedUri = this.getOptimizedImageUri(uri, width, height);
      
      Image.prefetch(optimizedUri)
        .then(() => {
          console.log(`✅ Image preloaded: ${optimizedUri}`);
          resolve();
        })
        .catch((error) => {
          console.warn(`❌ Image preload failed: ${optimizedUri}`, error);
          reject(error);
        });
    });
  }

  /**
   * Get optimized image URI based on device dimensions
   */
  private getOptimizedImageUri(uri: string, width?: number, height?: number): string {
    // For remote images, you could add optimization parameters here
    // For now, return the original URI
    return uri;
  }

  /**
   * Get responsive image dimensions
   */
  getResponsiveDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
    const maxWidth = screenWidth * 0.9; // 90% of screen width
    const maxHeight = screenHeight * 0.6; // 60% of screen height
    
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width, height };
  }

  /**
   * Clear asset cache (useful for development)
   */
  clearCache(): void {
    assetCache.clear();
    preloadedAssets.clear();
    loadingPromises.clear();
    this.cacheAccessCount.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    cacheSize: number;
    preloadedAssets: string[];
    loadingPromises: string[];
    memoryUsage: string;
  } {
    return {
      cacheSize: assetCache.size,
      preloadedAssets: Array.from(preloadedAssets),
      loadingPromises: Array.from(loadingPromises.keys()),
      memoryUsage: `${assetCache.size}/${this.maxCacheSize} assets cached`,
    };
  }

  /**
   * Preload building photos in background
   * Only loads a few at a time to avoid overwhelming the system
   */
  async preloadBuildingPhotos(limit: number = 5): Promise<void> {
    const photosToLoad = LAZY_ASSETS.buildings.slice(0, limit);
    
    const preloadPromises = photosToLoad.map(async (photoName) => {
      try {
        await this.loadBuildingPhoto(photoName);
        console.log(`✅ Building photo preloaded: ${photoName}`);
      } catch (error) {
        console.warn(`❌ Failed to preload building photo ${photoName}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }
}

export default AssetOptimizer;
