const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Set the project root correctly
config.projectRoot = __dirname;

// Set the entry point explicitly
config.resolver.mainFields = ['react-native', 'browser', 'main'];

// Package aliases for workspace packages
config.resolver.alias = {
  // Override the default entry point resolution
  'index': path.resolve(__dirname, 'index.js'),
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
};

// Watch folders for monorepo
config.watchFolders = [
  path.resolve(__dirname, '../../packages'),
  path.resolve(__dirname, '../../config'),
];

// Resolve node_modules from root and app
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, '../../node_modules'),
  path.resolve(__dirname, 'node_modules'),
];

// Ultra-aggressive performance optimizations
config.transformer = {
  ...config.transformer,
  // Disable Hermes parser for faster compilation
  hermesParser: false,
  // Disable minification for development
  minifierConfig: false,
  // Disable source maps for speed
  enableBabelRCLookup: false,
  // Skip asset processing
  assetPlugins: [],
  // Disable async require for speed
  asyncRequireModulePath: false,
};

// Ultra-fast resolver configuration
config.resolver = {
  ...config.resolver,
  // Disable symlink resolution for speed
  unstable_enableSymlinks: false,
  // Minimal condition names for speed
  unstable_conditionNames: ['react-native', 'main'],
  // Minimal file extensions
  sourceExts: ['js', 'jsx', 'ts', 'tsx'],
  assetExts: ['png', 'jpg', 'jpeg'],
  // Disable platform-specific resolution
  platforms: ['ios', 'android', 'native', 'web'],
  // Skip node modules resolution
  nodeModulesPaths: [],
};

// Disable caching for maximum speed
config.cacheStores = [];

// Ultra-fast transformer
config.transformer = {
  ...config.transformer,
  // Disable all optimizations for speed
  asyncRequireModulePath: false,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  enableBabelRCLookup: false,
  assetPlugins: [],
  // Disable all processing
  hermesParser: false,
  minifierConfig: false,
};

// Minimal serializer
config.serializer = {
  ...config.serializer,
  // Use default module ID factory
  createModuleIdFactory: () => (path) => path,
  // Minimal run module statement
  getRunModuleStatement: (moduleId) => `__r(${moduleId});`,
  // Skip all filtering for speed
  processModuleFilter: () => true,
};

module.exports = config;
