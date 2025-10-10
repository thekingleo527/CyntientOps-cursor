const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix hoisted dependencies resolution in monorepo
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

// Watch folders for monorepo
config.watchFolders = [workspaceRoot];

// Comprehensive resolver configuration for monorepo
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
  resolverMainFields: ['react-native', 'browser', 'main'],
  unstable_enablePackageExports: false,
  unstable_conditionNames: ['react-native', 'browser', 'require'],
  
  // Node modules resolution paths
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'packages'),
  ],
  
  // Alias for problematic dependencies
  alias: {
    'zod': path.resolve(workspaceRoot, 'node_modules/zod'),
    'crypto-js': path.resolve(workspaceRoot, 'node_modules/crypto-js'),
  },
  
  // Block problematic Node.js modules and duplicate react-native
  blockList: [
    /node_modules\/bcryptjs\/.*/,
    // Block duplicate/nested react-native installations
    /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
  ],

  // Ensure we use the root react-native
  extraNodeModules: {
    'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  },
};

// Fix for React 19 compatibility
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Server configuration - Let Metro auto-select available port
config.server = {
  ...config.server,
  // Port will be auto-selected by Metro if 8081 is busy
};

module.exports = config;
