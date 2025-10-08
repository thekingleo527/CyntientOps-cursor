module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Explicitly set jsxRuntime to avoid removed option warnings
      ['babel-preset-expo', { jsxRuntime: 'classic' }],
    ],
    plugins: [
      // Reanimated plugin MUST be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
