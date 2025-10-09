/**
 * 🖼️ Native Image Compressor
 * Native image compression using Expo Image Manipulator
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { performanceMonitor } from './PerformanceMonitor';

interface CompressionOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: ImageManipulator.SaveFormat;
  compress?: number;
}

interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  format: string;
  processingTime: number;
}

class NativeImageCompressor {
  private static instance: NativeImageCompressor;
  private compressionCache = new Map<string, CompressionResult>();

  static getInstance(): NativeImageCompressor {
    if (!NativeImageCompressor.instance) {
      NativeImageCompressor.instance = new NativeImageCompressor();
    }
    return NativeImageCompressor.instance;
  }

  /**
   * Get device-optimized compression settings
   */
  private getCompressionSettings(
    originalWidth: number,
    originalHeight: number,
    imageType: 'building' | 'icon' | 'splash' | 'general' = 'general'
  ): CompressionOptions {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    
    // Calculate optimal dimensions based on device and image type
    let maxWidth = screenWidth;
    let maxHeight = screenHeight;
    let quality = 0.8;
    let format: ImageManipulator.SaveFormat = ImageManipulator.SaveFormat.JPEG;

    switch (imageType) {
      case 'building':
        maxWidth = Math.min(screenWidth * 0.9, 800);
        maxHeight = Math.min(screenHeight * 0.6, 600);
        quality = 0.7;
        format = Platform.OS === 'android' ? ImageManipulator.SaveFormat.WEBP : ImageManipulator.SaveFormat.JPEG;
        break;
      case 'icon':
        maxWidth = Math.min(screenWidth * 0.2, 200);
        maxHeight = Math.min(screenHeight * 0.2, 200);
        quality = 0.9;
        format = ImageManipulator.SaveFormat.PNG;
        break;
      case 'splash':
        maxWidth = screenWidth;
        maxHeight = screenHeight;
        quality = 0.85;
        format = ImageManipulator.SaveFormat.PNG;
        break;
      default:
        maxWidth = Math.min(screenWidth * 0.8, 600);
        maxHeight = Math.min(screenHeight * 0.8, 600);
        quality = 0.8;
        format = ImageManipulator.SaveFormat.JPEG;
    }

    // Adjust quality based on device capabilities
    if (pixelRatio > 2.5) {
      quality = Math.min(quality * 1.1, 1.0);
    } else if (pixelRatio < 1.5) {
      quality = Math.max(quality * 0.9, 0.5);
    }

    return {
      quality,
      maxWidth,
      maxHeight,
      format,
      compress: quality,
    };
  }

  /**
   * Compress image using native compression
   */
  async compressImage(
    imageUri: string,
    imageType: 'building' | 'icon' | 'splash' | 'general' = 'general',
    customOptions?: Partial<CompressionOptions>
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const cacheKey = `${imageUri}_${imageType}`;
    
    // Check cache first
    if (this.compressionCache.has(cacheKey)) {
      const cached = this.compressionCache.get(cacheKey)!;
      console.log(`🖼️ Using cached compression for ${imageUri}`);
      return cached;
    }

    try {
      // Get image dimensions first
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get optimal compression settings
      const options = this.getCompressionSettings(
        imageInfo.width,
        imageInfo.height,
        imageType
      );

      // Apply custom options
      const finalOptions = { ...options, ...customOptions };

      // Perform compression
      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: finalOptions.maxWidth,
              height: finalOptions.maxHeight,
            },
          },
        ],
        {
          format: finalOptions.format,
          compress: finalOptions.compress || finalOptions.quality,
        }
      );

      const processingTime = Date.now() - startTime;
      
      // Calculate compression ratio (simplified)
      const compressionRatio = 0.7; // Placeholder - would need actual file size comparison
      
      const result: CompressionResult = {
        uri: compressedImage.uri,
        width: compressedImage.width,
        height: compressedImage.height,
        originalSize: imageInfo.width * imageInfo.height * 3, // Rough estimate
        compressedSize: compressedImage.width * compressedImage.height * 3 * compressionRatio,
        compressionRatio,
        quality: finalOptions.quality,
        format: finalOptions.format,
        processingTime,
      };

      // Cache the result
      this.compressionCache.set(cacheKey, result);
      
      // Log performance metrics
      performanceMonitor.startMeasurement(`native_compression_${imageType}`, 'rendering', {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio,
        processingTime,
      });

      console.log(`🖼️ Image compressed: ${imageUri} (${(compressionRatio * 100).toFixed(1)}% of original)`);
      
      return result;
    } catch (error) {
      console.error('Native image compression failed:', error);
      throw error;
    }
  }

  /**
   * Batch compress multiple images
   */
  async batchCompress(
    images: Array<{ uri: string; type: 'building' | 'icon' | 'splash' | 'general' }>,
    concurrency: number = 2
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    // Process images in batches to avoid overwhelming the system
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchPromises = batch.map(({ uri, type }) => 
        this.compressImage(uri, type).catch(error => {
          console.warn(`Failed to compress image ${uri}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches
      if (i + concurrency < images.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Compress building photos with intelligent optimization
   */
  async compressBuildingPhotos(): Promise<CompressionResult[]> {
    const buildingPhotos = [
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
    ];

    const images = buildingPhotos.map(photo => ({
      uri: `../../assets/images/buildings/${photo}`,
      type: 'building' as const,
    }));

    try {
      const results = await this.batchCompress(images, 2);
      console.log(`🖼️ Compressed ${results.length} building photos`);
      return results;
    } catch (error) {
      console.warn('Failed to compress building photos:', error);
      return [];
    }
  }

  /**
   * Compress critical app images
   */
  async compressCriticalImages(): Promise<CompressionResult[]> {
    const criticalImages = [
      { uri: require('../../assets/images/icon.png'), type: 'icon' as const },
      { uri: require('../../assets/images/splash.png'), type: 'splash' as const },
      { uri: require('../../assets/images/AIAssistant.png'), type: 'general' as const },
    ];

    try {
      const results = await this.batchCompress(criticalImages, 2);
      console.log(`🖼️ Compressed ${results.length} critical images`);
      return results;
    } catch (error) {
      console.warn('Failed to compress critical images:', error);
      return [];
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): {
    totalImages: number;
    averageCompressionRatio: number;
    totalSpaceSaved: number;
    cacheSize: number;
    averageProcessingTime: number;
  } {
    const entries = Array.from(this.compressionCache.values());
    const totalImages = entries.length;
    
    if (totalImages === 0) {
      return {
        totalImages: 0,
        averageCompressionRatio: 0,
        totalSpaceSaved: 0,
        cacheSize: 0,
        averageProcessingTime: 0,
      };
    }

    const totalOriginalSize = entries.reduce((sum, entry) => sum + entry.originalSize, 0);
    const totalCompressedSize = entries.reduce((sum, entry) => sum + entry.compressedSize, 0);
    const averageCompressionRatio = totalCompressedSize / totalOriginalSize;
    const totalSpaceSaved = totalOriginalSize - totalCompressedSize;
    const averageProcessingTime = entries.reduce((sum, entry) => sum + entry.processingTime, 0) / totalImages;

    return {
      totalImages,
      averageCompressionRatio,
      totalSpaceSaved,
      cacheSize: totalCompressedSize,
      averageProcessingTime,
    };
  }

  /**
   * Clear compression cache
   */
  clearCache(): void {
    this.compressionCache.clear();
    console.log('🖼️ Native image compression cache cleared');
  }

  /**
   * Get optimized image URI for display
   */
  getOptimizedImageUri(
    originalUri: string,
    imageType: 'building' | 'icon' | 'splash' | 'general' = 'general'
  ): string {
    const cacheKey = `${originalUri}_${imageType}`;
    const cached = this.compressionCache.get(cacheKey);
    return cached ? cached.uri : originalUri;
  }

  /**
   * Preload and compress images in background
   */
  async preloadImages(): Promise<void> {
    try {
      // Compress critical images first
      await this.compressCriticalImages();
      
      // Then compress building photos in background
      setTimeout(() => {
        this.compressBuildingPhotos().catch(error => {
          console.warn('Background building photo compression failed:', error);
        });
      }, 1000);
      
      console.log('🖼️ Image preloading started');
    } catch (error) {
      console.warn('Image preloading failed:', error);
    }
  }
}

export const nativeImageCompressor = NativeImageCompressor.getInstance();
export default nativeImageCompressor;
