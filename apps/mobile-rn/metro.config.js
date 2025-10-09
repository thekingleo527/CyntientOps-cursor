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
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx'],
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
  
  // Block problematic Node.js modules
  blockList: [
    /node_modules\/bcryptjs\/.*/,
  ],
};

// Fix for React 19 compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Server configuration
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Handle CORS for development
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
