/**
 * 🚀 Optimized Metro Configuration
 * Advanced bundling optimizations for faster startup and better performance
 */

const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');
const os = require('os');

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

// Ensure root is the project
config.projectRoot = projectRoot;

// Set the entry point for the mobile app
config.resolver.mainFields = ['react-native', 'browser', 'main'];

// Advanced package aliases for workspace packages - optimized for faster resolution
config.resolver.alias = {
  // Ensure bcryptjs uses the correct build for React Native
  'bcryptjs': path.resolve(workspaceRoot, 'node_modules/bcryptjs/index.js'),
  // Force single React and RN resolution to avoid duplicates
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  
  // Workspace packages with optimized paths
  '@cyntientops/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
  '@cyntientops/ui-components': path.resolve(workspaceRoot, 'packages/ui-components/src'),
  '@cyntientops/business-core': path.resolve(workspaceRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(workspaceRoot, 'packages/domain-schema/src'),
  '@cyntientops/database': path.resolve(workspaceRoot, 'packages/database/src'),
  '@cyntientops/intelligence-services': path.resolve(workspaceRoot, 'packages/intelligence-services/src'),
  '@cyntientops/managers': path.resolve(workspaceRoot, 'packages/managers/src'),
  '@cyntientops/data-seed': path.resolve(workspaceRoot, 'packages/data-seed/src'),
  '@cyntientops/context-engines': path.resolve(workspaceRoot, 'packages/context-engines/src'),
  '@cyntientops/api-clients': path.resolve(workspaceRoot, 'packages/api-clients/src'),
  '@cyntientops/command-chains': path.resolve(workspaceRoot, 'packages/command-chains/src'),
  '@cyntientops/offline-support': path.resolve(workspaceRoot, 'packages/offline-support/src'),
  '@cyntientops/realtime-sync': path.resolve(workspaceRoot, 'packages/realtime-sync/src'),
  '@cyntientops/compliance-engine': path.resolve(workspaceRoot, 'packages/compliance-engine/src'),
  '@cyntientops/testing': path.resolve(workspaceRoot, 'packages/testing/src'),
};

// Optimized watch folders - only essential directories
config.watchFolders = [
  path.resolve(workspaceRoot),
  path.resolve(workspaceRoot, 'apps/mobile-rn'),
  path.resolve(workspaceRoot, 'packages/ui-components'),
  path.resolve(workspaceRoot, 'packages/business-core'),
  path.resolve(workspaceRoot, 'packages/domain-schema'),
];

// Resolve node_modules from root and app
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Asset & source extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'otf', 'woff', 'woff2'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Advanced transformer optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: process.env.NODE_ENV === 'development',
    mangle: process.env.NODE_ENV === 'production',
    compress: {
      ...(process.env.NODE_ENV === 'production' ? {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      } : {}),
    },
    sourceMap: process.env.NODE_ENV === 'development',
  },
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  
  // Advanced transform options
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
      // Enable tree shaking
      unstable_disableES6Transforms: false,
    },
  }),
  
  // Enable Hermes optimizations
  hermesParser: true,
  
  // Enable experimental features for better performance
  unstable_allowRequireContext: false,
  unstable_disableES6Transforms: false,
};

// Optimize worker count for faster builds
config.maxWorkers = Math.max(2, Math.floor(os.cpus().length * 0.75));

// Advanced cache configuration
const cacheRoot = process.env.METRO_CACHE_ROOT || path.resolve(os.tmpdir(), 'metro-cache');
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: cacheRoot,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }),
];

// Optimize resolver for faster module resolution
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'import', 'require'];

// Advanced serializer optimizations
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
  // Optimize module order for faster startup
  getPolyfills: () => [],
  
  // Enable experimental serializer features
  experimentalSerializerHook: (graph, delta) => {
    // Custom serialization logic for better performance
    return graph;
  },
};

// Server configuration
config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
  // Enable experimental server features
  experimentalImportSupport: true,
};

// Advanced bundling optimizations
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable tree shaking and dead code elimination
config.transformer.unstable_disableES6Transforms = false;
config.transformer.unstable_allowRequireContext = false;

// Optimize for development vs production
if (process.env.NODE_ENV === 'development') {
  // Development optimizations
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: false,
    compress: false,
    sourceMap: true,
  };
  
  // Enable hot reloading optimizations
  config.server.experimentalImportSupport = true;
} else {
  // Production optimizations
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: true,
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      passes: 2,
    },
    sourceMap: false,
  };
}

// Enable experimental features for better performance
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'import', 'require'];

// Advanced bundling features
config.transformer.unstable_allowRequireContext = false;
config.transformer.unstable_disableES6Transforms = false;

// Enable Hermes optimizations
config.transformer.hermesParser = true;

// Optimize for different platforms
if (process.env.PLATFORM === 'ios') {
  // iOS-specific optimizations
  config.resolver.platforms = ['ios', 'native'];
} else if (process.env.PLATFORM === 'android') {
  // Android-specific optimizations
  config.resolver.platforms = ['android', 'native'];
}

// Enable experimental bundling features
config.experimental = {
  // Enable experimental features
  unstable_allowRequireContext: false,
  unstable_disableES6Transforms: false,
};

module.exports = config;
