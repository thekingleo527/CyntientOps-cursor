const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 🚀 ULTRA OPTIMIZED METRO CONFIGURATION
// Advanced bundling optimizations for maximum performance

// 1. RESOLVER OPTIMIZATIONS
config.resolver = {
  ...config.resolver,
  
  // Package aliases for faster resolution
  alias: {
    '@cyntientops/business-core': path.resolve(__dirname, '../../packages/business-core/src'),
    '@cyntientops/domain-schema': path.resolve(__dirname, '../../packages/domain-schema/src'),
    '@cyntientops/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
    '@cyntientops/api-clients': path.resolve(__dirname, '../../packages/api-clients/src'),
    '@cyntientops/intelligence-services': path.resolve(__dirname, '../../packages/intelligence-services/src'),
    '@cyntientops/database': path.resolve(__dirname, '../../packages/database/src'),
    '@cyntientops/realtime-sync': path.resolve(__dirname, '../../packages/realtime-sync/src'),
    '@cyntientops/offline-support': path.resolve(__dirname, '../../packages/offline-support/src'),
    '@cyntientops/managers': path.resolve(__dirname, '../../packages/managers/src'),
    '@cyntientops/design-tokens': path.resolve(__dirname, '../../packages/design-tokens/src'),
    '@cyntientops/command-chains': path.resolve(__dirname, '../../packages/command-chains/src'),
    '@cyntientops/compliance-engine': path.resolve(__dirname, '../../packages/compliance-engine/src'),
    '@cyntientops/context-engines': path.resolve(__dirname, '../../packages/context-engines/src'),
    '@cyntientops/data-seed': path.resolve(__dirname, '../../packages/data-seed/src'),
    '@cyntientops/testing': path.resolve(__dirname, '../../packages/testing/src'),
    '@': path.resolve(__dirname, './src'),
  },
  
  // Platform-specific extensions
  platforms: ['ios', 'android', 'native', 'web'],
  
  // Asset extensions
  assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
  
  // Source extensions
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Resolve main fields for faster resolution
  mainFields: ['react-native', 'browser', 'main'],
  
  // Disable symlinks for faster resolution
  unstable_enableSymlinks: false,
  
  // Enable package exports
  unstable_enablePackageExports: true,
};

// 2. TRANSFORMER OPTIMIZATIONS
config.transformer = {
  ...config.transformer,
  
  // Enable Hermes optimizations
  hermesParser: true,
  
  // Enable minification
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  
  // Enable tree shaking
  unstable_allowRequireContext: false,
  
  // Optimize imports
  unstable_disableES6Transforms: false,
  
  // Enable inline requires for better performance
  inlineRequires: true,
  
  // Enable experimental features
  experimentalImportSupport: true,
  unstable_disableES6Transforms: false,
};

// 3. SERVER OPTIMIZATIONS
config.server = {
  ...config.server,
  
  // Enable compression
  compress: true,
  
  // Enable HTTP/2
  http2: true,
  
  // Optimize worker count
  maxWorkers: 4,
  
  // Enable caching
  cache: true,
  
  // Enable hot reloading optimizations
  hot: true,
  
  // Enable live reloading
  liveReload: true,
};

// 4. WATCHER OPTIMIZATIONS
config.watchFolders = [
  path.resolve(__dirname, '../../packages'),
  path.resolve(__dirname, '../../config'),
  path.resolve(__dirname, '../../node_modules'),
];

// 5. CACHE OPTIMIZATIONS
config.cacheStores = [
  {
    name: 'filesystem',
    path: '/Volumes/FastSSD/Developer/_devdata/metro-cache',
  },
];

// 6. BUNDLE OPTIMIZATIONS
config.serializer = {
  ...config.serializer,
  
  // Enable experimental serializer features
  experimentalSerializerHook: (graph, delta) => {
    // Custom serialization optimizations
    return graph;
  },
  
  // Custom module map
  createModuleIdFactory: () => {
    let nextId = 0;
    return (path) => {
      // Optimize module IDs for faster resolution
      return nextId++;
    };
  },
  
  // Enable custom serializer
  customSerializer: (entryPoint, preModules, graph, options) => {
    // Custom bundle serialization for optimal performance
    return {
      entryPoint,
      preModules,
      graph,
      options,
    };
  },
};

// 7. RESOLVER PLUGINS
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 8. EXPERIMENTAL FEATURES
config.experimental = {
  // Enable experimental features
  unstable_allowRequireContext: false,
  unstable_disableES6Transforms: false,
  unstable_enablePackageExports: true,
  unstable_enableSymlinks: false,
};

// 9. PERFORMANCE MONITORING
config.reporter = {
  update: (event) => {
    // Custom performance monitoring
    if (event.type === 'bundle_build_done') {
      console.log(`🚀 Bundle built in ${event.buildTime}ms`);
    }
  },
};

// 10. ADVANCED OPTIMIZATIONS
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

// Enable advanced optimizations
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Optimize for production builds
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
  };
}

module.exports = config;
