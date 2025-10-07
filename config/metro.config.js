const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = path.resolve(__dirname, 'apps/mobile-rn');
const workspaceRoot = path.resolve(__dirname);

const config = getDefaultConfig(projectRoot);

// Ensure root is the project
config.projectRoot = projectRoot;

// Set the entry point for the mobile app
config.resolver.mainFields = ['react-native', 'browser', 'main'];

// Package aliases for workspace packages
config.resolver.alias = {
  // Ensure bcryptjs uses ESM build which checks global crypto.getRandomValues
  'bcryptjs': path.resolve(workspaceRoot, 'node_modules/bcryptjs/index.js'),
  '@cyntientops/design-tokens': path.resolve(projectRoot, 'packages/design-tokens/src'),
  '@cyntientops/ui-components': path.resolve(projectRoot, 'packages/ui-components/src'),
  '@cyntientops/business-core': path.resolve(projectRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(projectRoot, 'packages/domain-schema/src'),
  '@cyntientops/database': path.resolve(projectRoot, 'packages/database/src'),
  '@cyntientops/intelligence-services': path.resolve(projectRoot, 'packages/intelligence-services/src'),
  '@cyntientops/managers': path.resolve(projectRoot, 'packages/managers/src'),
  '@cyntientops/data-seed': path.resolve(projectRoot, 'packages/data-seed/src'),
  '@cyntientops/context-engines': path.resolve(projectRoot, 'packages/context-engines/src'),
  '@cyntientops/api-clients': path.resolve(projectRoot, 'packages/api-clients/src'),
  '@cyntientops/command-chains': path.resolve(projectRoot, 'packages/command-chains/src'),
  '@cyntientops/offline-support': path.resolve(projectRoot, 'packages/offline-support/src'),
  '@cyntientops/realtime-sync': path.resolve(projectRoot, 'packages/realtime-sync/src'),
  '@cyntientops/compliance-engine': path.resolve(projectRoot, 'packages/compliance-engine/src'),
  '@cyntientops/testing': path.resolve(projectRoot, 'packages/testing/src'),
};

// Watch essential app and packages
config.watchFolders = [
  path.resolve(projectRoot, 'apps/mobile-rn'),
  path.resolve(projectRoot, 'packages/ui-components'),
  path.resolve(projectRoot, 'packages/business-core'),
  path.resolve(projectRoot, 'packages/domain-schema'),
  path.resolve(projectRoot, 'packages/database'),
  path.resolve(projectRoot, 'packages/intelligence-services'),
  path.resolve(projectRoot, 'packages/managers'),
  path.resolve(projectRoot, 'packages/data-seed'),
  path.resolve(projectRoot, 'packages/context-engines'),
  path.resolve(projectRoot, 'packages/api-clients'),
  path.resolve(projectRoot, 'packages/command-chains'),
  path.resolve(projectRoot, 'packages/offline-support'),
  path.resolve(projectRoot, 'packages/realtime-sync'),
  path.resolve(projectRoot, 'packages/compliance-engine'),
  path.resolve(projectRoot, 'packages/testing'),
  path.resolve(projectRoot, 'packages/design-tokens'),
];

// Resolve node_modules from root and app
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, 'apps/mobile-rn/node_modules'),
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

config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

// Honor EXPO/Metro cache root if provided
const cacheRoot = process.env.METRO_CACHE_ROOT;
if (cacheRoot) {
  const { FileStore } = require('metro-cache');
  config.cacheStores = [new FileStore({ root: cacheRoot })];
}

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [require.resolve('react-native/Libraries/Core/InitializeCore')],
  // Enable Hermes bytecode compilation for production
  customSerializer: process.env.NODE_ENV === 'production' ? require('metro-serializer-hermes') : undefined,
};

config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
};

module.exports = config;
