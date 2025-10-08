const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../apps/mobile-rn');
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);

// Ensure root is the project
config.projectRoot = projectRoot;

// Set the entry point for the mobile app
config.resolver.mainFields = ['react-native', 'browser', 'main'];

// Package aliases for workspace packages
config.resolver.alias = {
  // Ensure bcryptjs uses the correct build for React Native
  'bcryptjs': path.resolve(workspaceRoot, 'node_modules/bcryptjs/index.js'),
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

// Watch essential app and packages
config.watchFolders = [
  path.resolve(workspaceRoot, 'apps/mobile-rn'),
  path.resolve(workspaceRoot, 'packages/ui-components'),
  path.resolve(workspaceRoot, 'packages/business-core'),
  path.resolve(workspaceRoot, 'packages/domain-schema'),
  path.resolve(workspaceRoot, 'packages/database'),
  path.resolve(workspaceRoot, 'packages/intelligence-services'),
  path.resolve(workspaceRoot, 'packages/managers'),
  path.resolve(workspaceRoot, 'packages/data-seed'),
  path.resolve(workspaceRoot, 'packages/context-engines'),
  path.resolve(workspaceRoot, 'packages/api-clients'),
  path.resolve(workspaceRoot, 'packages/command-chains'),
  path.resolve(workspaceRoot, 'packages/offline-support'),
  path.resolve(workspaceRoot, 'packages/realtime-sync'),
  path.resolve(workspaceRoot, 'packages/compliance-engine'),
  path.resolve(workspaceRoot, 'packages/testing'),
  path.resolve(workspaceRoot, 'packages/design-tokens'),
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

// Transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: process.env.NODE_ENV === 'development',
    mangle: process.env.NODE_ENV === 'production',
    compress: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV === 'development',
  },
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

if (process.env.NODE_ENV === 'development') {
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });
} else {
  // Production optimizations
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });
}

// Optimize worker count for faster builds
config.maxWorkers = Math.max(2, Math.floor(require('os').cpus().length * 0.75));

// Honor EXPO/Metro cache root if provided
// Temporarily disabled to fix caching conflict
// const cacheRoot = process.env.METRO_CACHE_ROOT;
// if (cacheRoot && !config.cacheStores) {
//   const { FileStore } = require('metro-cache');
//   config.cacheStores = [new FileStore({ 
//     root: cacheRoot,
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   })];
// }

// Optimize resolver for faster module resolution
config.resolver.unstable_enableSymlinks = false;
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'import', 'require'];

// Optimize transformer for faster builds
config.transformer.unstable_allowRequireContext = false;
config.transformer.unstable_disableES6Transforms = false;

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [require.resolve('react-native/Libraries/Core/InitializeCore')],
  // Optimize module order for faster startup
  getPolyfills: () => [],
};

config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
};

module.exports = config;
