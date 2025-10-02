const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname; // repo root
const workspaceRoot = projectRoot;

const config = getDefaultConfig(projectRoot);

// Ensure root is the project
config.projectRoot = projectRoot;

// Watch only essential app and packages
config.watchFolders = [
  path.resolve(projectRoot, 'apps/mobile-rn'),
  path.resolve(projectRoot, 'packages/ui-components'),
  path.resolve(projectRoot, 'packages/business-core'),
  path.resolve(projectRoot, 'packages/domain-schema'),
  path.resolve(projectRoot, 'packages/database'),
  path.resolve(projectRoot, 'packages/intelligence-services'),
  path.resolve(projectRoot, 'packages/managers'),
];

// Resolve node_modules from root and app
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, 'apps/mobile-rn/node_modules'),
];

// Package aliases for src resolution
config.resolver.alias = {
  '@cyntientops/design-tokens': path.resolve(projectRoot, 'packages/design-tokens/src'),
  '@cyntientops/ui-components': path.resolve(projectRoot, 'packages/ui-components/src'),
  '@cyntientops/business-core': path.resolve(projectRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(projectRoot, 'packages/domain-schema/src'),
  '@cyntientops/database': path.resolve(projectRoot, 'packages/database/src'),
  '@cyntientops/intelligence-services': path.resolve(projectRoot, 'packages/intelligence-services/src'),
  '@cyntientops/managers': path.resolve(projectRoot, 'packages/managers/src'),
};

config.resolver.unstable_enableSymlinks = true;

// Asset & source extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'otf', 'woff', 'woff2'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: false,
    compress: false,
  },
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

if (process.env.NODE_ENV === 'development') {
  config.transformer.minifierConfig.sourceMap = false;
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
};

config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
};

module.exports = config;

