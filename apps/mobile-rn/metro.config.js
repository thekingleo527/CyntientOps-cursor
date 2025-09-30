const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.sourceExts.push('cjs', 'mjs');

// Configure transformer for better performance
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configure resolver for monorepo
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
  require('path').resolve(__dirname, '../../node_modules'),
];

// Configure watchman for better file watching
config.watchFolders = [
  require('path').resolve(__dirname, '../../packages'),
];

// Enable Hermes for better performance
config.transformer.hermesParser = true;

// Configure asset extensions
config.resolver.assetExts.push(
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'pdf',
  'zip'
);

module.exports = withNativeWind(config, { input: './global.css' });