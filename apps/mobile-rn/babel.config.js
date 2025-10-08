module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Explicitly set jsxRuntime to avoid removed option warnings
      ['babel-preset-expo', { 
        jsxRuntime: 'automatic',  // Better tree shaking than 'classic'
      }],
    ],
    plugins: [
      // Production optimizations
      ...(process.env.NODE_ENV === 'production' 
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []
      ),
      // Reanimated plugin MUST be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
