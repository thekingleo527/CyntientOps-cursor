// BULLETPROOF Metro config for CyntientOps monorepo
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// CRITICAL: Set the correct project root
config.projectRoot = projectRoot;

// Watch folders - only essential directories
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'packages/ui-components'),
  path.resolve(workspaceRoot, 'packages/business-core'),
  path.resolve(workspaceRoot, 'packages/domain-schema'),
];

// Node modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Workspace package resolution
config.resolver.alias = {
  '@cyntientops/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
  '@cyntientops/ui-components': path.resolve(workspaceRoot, 'packages/ui-components/src'),
  '@cyntientops/business-core': path.resolve(workspaceRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(workspaceRoot, 'packages/domain-schema/src'),
  '@cyntientops/database': path.resolve(workspaceRoot, 'packages/database/src'),
  '@cyntientops/intelligence-services': path.resolve(workspaceRoot, 'packages/intelligence-services/src'),
  '@cyntientops/managers': path.resolve(workspaceRoot, 'packages/managers/src'),
};

// Enable symlinks for monorepo
config.resolver.unstable_enableSymlinks = true;

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
  // Disable minification in development for speed
  minifierConfig: {
    keep_fnames: true,
    mangle: false,
    compress: false,
  },
  // Asset plugins
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Development optimizations
if (process.env.NODE_ENV === 'development') {
  // Disable source maps for speed
  config.transformer.minifierConfig.sourceMap = false;
  
  // Inline requires for faster startup
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });
}

// Worker configuration
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

// Cache configuration - simplified for reliability
config.cacheStores = [
  {
    get: async () => null,
    set: async () => {},
    clear: async () => {},
  },
];

// Serializer configuration
config.serializer = {
  ...config.serializer,
  // Custom serializer options for development build
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
};

// Server configuration
config.server = {
  ...config.server,
  port: parseInt(process.env.RCT_METRO_PORT || '8081', 10),
};

module.exports = config;
