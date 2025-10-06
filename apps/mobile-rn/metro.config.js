const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// Set the correct project root
config.projectRoot = projectRoot;

// Add workspace packages to watch folders
config.watchFolders = [
  ...config.watchFolders, // Include Expo's default watch folders
  path.resolve(workspaceRoot, 'packages/design-tokens'),
  path.resolve(workspaceRoot, 'packages/ui-components'),
  path.resolve(workspaceRoot, 'packages/business-core'),
  path.resolve(workspaceRoot, 'packages/domain-schema'),
  path.resolve(workspaceRoot, 'packages/database'),
  path.resolve(workspaceRoot, 'packages/intelligence-services'),
  path.resolve(workspaceRoot, 'packages/managers'),
  path.resolve(workspaceRoot, 'packages/data-seed'),
];

// Node modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Workspace package resolution
config.resolver.alias = {
  // Ensure bcryptjs uses ESM build which checks global crypto.getRandomValues
  'bcryptjs': path.resolve(workspaceRoot, 'node_modules/bcryptjs/index.js'),
  '@cyntientops/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
  '@cyntientops/ui-components': path.resolve(workspaceRoot, 'packages/ui-components/src'),
  '@cyntientops/business-core': path.resolve(workspaceRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(workspaceRoot, 'packages/domain-schema/src'),
  '@cyntientops/database': path.resolve(workspaceRoot, 'packages/database/src'),
  '@cyntientops/intelligence-services': path.resolve(workspaceRoot, 'packages/intelligence-services/src'),
  '@cyntientops/managers': path.resolve(workspaceRoot, 'packages/managers/src'),
  '@cyntientops/data-seed': path.resolve(workspaceRoot, 'packages/data-seed/src'),
};

// Asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'db', 'mp3', 'ttf', 'obj', 'otf', 'woff', 'woff2'
];

// Source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts', 'tsx', 'js', 'jsx', 'json'
];

// Platform extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Transformer configuration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: false,
    compress: false,
  },
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Development optimizations
if (process.env.NODE_ENV === 'development') {
  config.transformer.minifierConfig.sourceMap = false;
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });
}

// Worker configuration
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

// Server configuration
config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
};

module.exports = config;
