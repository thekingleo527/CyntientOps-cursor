const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Set the project root to the mobile app directory
const projectRoot = path.resolve(__dirname, 'apps/mobile-rn');
const workspaceRoot = __dirname;

// Start from Expo's default config
const defaultConfig = getDefaultConfig(projectRoot);
const config = { ...defaultConfig };

// Ensure the project root is set correctly
config.projectRoot = projectRoot;

// Set the entry point explicitly while preserving Expo defaults
config.resolver = {
  ...defaultConfig.resolver,
  mainFields: ['react-native', 'browser', 'main'],
};

// Package aliases for workspace packages
config.resolver.alias = {
  // Override the default entry point resolution
  'index': path.resolve(projectRoot, 'index.js'),
  '@cyntientops/business-core': path.resolve(workspaceRoot, 'packages/business-core/src'),
  '@cyntientops/domain-schema': path.resolve(workspaceRoot, 'packages/domain-schema/src'),
  '@cyntientops/ui-components': path.resolve(workspaceRoot, 'packages/ui-components/src'),
  '@cyntientops/api-clients': path.resolve(workspaceRoot, 'packages/api-clients/src'),
  '@cyntientops/intelligence-services': path.resolve(workspaceRoot, 'packages/intelligence-services/src'),
  '@cyntientops/database': path.resolve(workspaceRoot, 'packages/database/src'),
  '@cyntientops/realtime-sync': path.resolve(workspaceRoot, 'packages/realtime-sync/src'),
  '@cyntientops/offline-support': path.resolve(workspaceRoot, 'packages/offline-support/src'),
  '@cyntientops/managers': path.resolve(workspaceRoot, 'packages/managers/src'),
  '@cyntientops/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
  '@cyntientops/command-chains': path.resolve(workspaceRoot, 'packages/command-chains/src'),
  '@cyntientops/compliance-engine': path.resolve(workspaceRoot, 'packages/compliance-engine/src'),
  '@cyntientops/context-engines': path.resolve(workspaceRoot, 'packages/context-engines/src'),
  '@cyntientops/data-seed': path.resolve(workspaceRoot, 'packages/data-seed/src'),
  '@cyntientops/testing': path.resolve(workspaceRoot, 'packages/testing/src'),
  '@': path.resolve(projectRoot, 'src'),
};

// Watch folders for monorepo (merge with Expo defaults)
const extraWatchFolders = [
  path.resolve(workspaceRoot, 'packages'),
  path.resolve(workspaceRoot, 'config'),
];
config.watchFolders = Array.from(
  new Set([...(defaultConfig.watchFolders || []), ...extraWatchFolders])
);

// Resolve node_modules from root and app (preserve defaults)
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(defaultConfig.resolver?.nodeModulesPaths || []),
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(projectRoot, 'node_modules'),
  ])
);

module.exports = config;
