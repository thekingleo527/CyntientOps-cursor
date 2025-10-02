/**
 * Asset Optimizer for Development Performance
 * Preloads and caches critical assets to reduce bundle time
 */

import { Asset } from 'expo-asset';
import { Image } from 'react-native';

// Critical assets that should be preloaded
const CRITICAL_ASSETS = [
  require('../../assets/images/icon.png'),
  require('../../assets/images/splash.png'),
  require('../../assets/images/AIAssistant.png'),
];

// Asset cache for faster loading
const assetCache = new Map<string, any>();

export class AssetOptimizer {
  private static instance: AssetOptimizer;
  private preloadedAssets: Set<string> = new Set();

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  /**
   * Preload critical assets for faster app startup
   */
  async preloadCriticalAssets(): Promise<void> {
    try {
      const preloadPromises = CRITICAL_ASSETS.map(async (asset) => {
        const assetObj = Asset.fromModule(asset);
        await assetObj.downloadAsync();
        this.preloadedAssets.add(assetObj.uri || '');
        assetCache.set(assetObj.uri || '', assetObj);
      });

      await Promise.all(preloadPromises);
      console.log('✅ Critical assets preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Asset preloading failed:', error);
    }
  }

  /**
   * Get cached asset or load it
   */
  getAsset(uri: string): any {
    return assetCache.get(uri) || null;
  }

  /**
   * Preload image for faster rendering
   */
  preloadImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Image.prefetch(uri)
        .then(() => {
          console.log(`✅ Image preloaded: ${uri}`);
          resolve();
        })
        .catch((error) => {
          console.warn(`⚠️ Image preload failed: ${uri}`, error);
          reject(error);
        });
    });
  }

  /**
   * Clear asset cache (useful for development)
   */
  clearCache(): void {
    assetCache.clear();
    this.preloadedAssets.clear();
  }
}

export default AssetOptimizer;
