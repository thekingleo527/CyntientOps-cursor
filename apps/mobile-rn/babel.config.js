module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react',
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      // Fix for React 19 compatibility
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react',
        },
      ],
      // Prevent property configuration conflicts
      [
        '@babel/plugin-transform-modules-commonjs',
        {
          strictMode: false,
          allowTopLevelThis: true,
        },
      ],
    ],
  };
};
