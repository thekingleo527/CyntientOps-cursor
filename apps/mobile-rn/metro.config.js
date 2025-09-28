const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path resolution for @/ alias
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
  '@cyntientops': path.resolve(__dirname, '../../packages'),
};

module.exports = config;
