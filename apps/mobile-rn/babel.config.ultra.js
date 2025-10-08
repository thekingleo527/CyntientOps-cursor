/**
 * 🚀 Ultra-Optimized Babel Configuration
 * Advanced transformations for maximum performance
 */

module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // 🚀 PERFORMANCE PLUGINS
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-logical-assignment-operators',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-optional-catch-binding',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-proposal-pipeline-operator',
    '@babel/plugin-proposal-partial-application',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-logical-assignment-operators',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-optional-catch-binding',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-proposal-pipeline-operator',
    '@babel/plugin-proposal-partial-application',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-function-sent',
    
    // 🚀 OPTIMIZATION PLUGINS
    ['@babel/plugin-transform-modules-commonjs', {
      strict: false,
      strictMode: false,
      allowTopLevelThis: true,
      loose: true,
    }],
    ['@babel/plugin-transform-arrow-functions', {
      spec: false,
    }],
    ['@babel/plugin-transform-classes', {
      loose: true,
    }],
    ['@babel/plugin-transform-computed-properties', {
      loose: true,
    }],
    ['@babel/plugin-transform-destructuring', {
      loose: true,
    }],
    ['@babel/plugin-transform-for-of', {
      loose: true,
    }],
    ['@babel/plugin-transform-function-name', {
      loose: true,
    }],
    ['@babel/plugin-transform-literals', {
      loose: true,
    }],
    ['@babel/plugin-transform-object-super', {
      loose: true,
    }],
    ['@babel/plugin-transform-parameters', {
      loose: true,
    }],
    ['@babel/plugin-transform-shorthand-properties', {
      loose: true,
    }],
    ['@babel/plugin-transform-spread', {
      loose: true,
    }],
    ['@babel/plugin-transform-template-literals', {
      loose: true,
    }],
    ['@babel/plugin-transform-unicode-regex', {
      loose: true,
    }],
    
    // 🚀 REACT NATIVE SPECIFIC
    'react-native-reanimated/plugin',
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'classic',
    }],
    ['@babel/plugin-transform-react-jsx-source', {
      runtime: 'classic',
    }],
    ['@babel/plugin-transform-react-jsx-self', {
      runtime: 'classic',
    }],
    
    // 🚀 ADVANCED OPTIMIZATIONS
    ['@babel/plugin-transform-async-to-generator', {
      loose: true,
    }],
    ['@babel/plugin-transform-block-scoping', {
      loose: true,
    }],
    ['@babel/plugin-transform-classes', {
      loose: true,
    }],
    ['@babel/plugin-transform-computed-properties', {
      loose: true,
    }],
    ['@babel/plugin-transform-destructuring', {
      loose: true,
    }],
    ['@babel/plugin-transform-for-of', {
      loose: true,
    }],
    ['@babel/plugin-transform-function-name', {
      loose: true,
    }],
    ['@babel/plugin-transform-literals', {
      loose: true,
    }],
    ['@babel/plugin-transform-object-super', {
      loose: true,
    }],
    ['@babel/plugin-transform-parameters', {
      loose: true,
    }],
    ['@babel/plugin-transform-shorthand-properties', {
      loose: true,
    }],
    ['@babel/plugin-transform-spread', {
      loose: true,
    }],
    ['@babel/plugin-transform-template-literals', {
      loose: true,
    }],
    ['@babel/plugin-transform-unicode-regex', {
      loose: true,
    }],
    
    // 🚀 TREE SHAKING OPTIMIZATIONS
    ['@babel/plugin-transform-modules-commonjs', {
      strict: false,
      strictMode: false,
      allowTopLevelThis: true,
      loose: true,
    }],
    
    // 🚀 DEAD CODE ELIMINATION
    ['@babel/plugin-transform-remove-console', {
      exclude: ['error', 'warn'],
    }],
    ['@babel/plugin-transform-remove-debugger'],
    ['@babel/plugin-transform-remove-undefined'],
    
    // 🚀 INLINE OPTIMIZATIONS
    ['@babel/plugin-transform-inline-environment-variables'],
    ['@babel/plugin-transform-inline-constants'],
    
    // 🚀 MEMORY OPTIMIZATIONS
    ['@babel/plugin-transform-remove-unused-variables'],
    ['@babel/plugin-transform-remove-unused-imports'],
  ];

  const presets = [
    // 🚀 REACT NATIVE PRESET
    ['@babel/preset-react-native', {
      runtime: 'classic',
      development: process.env.NODE_ENV === 'development',
      production: process.env.NODE_ENV === 'production',
    }],
    
    // 🚀 TYPESCRIPT PRESET
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      allowDeclareFields: true,
      allowNamespaces: true,
      onlyRemoveTypeImports: true,
    }],
    
    // 🚀 ENV PRESET
    ['@babel/preset-env', {
      targets: {
        node: 'current',
      },
      modules: 'commonjs',
      loose: true,
      useBuiltIns: 'usage',
      corejs: 3,
      debug: false,
      include: [
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-logical-assignment-operators',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-optional-catch-binding',
        '@babel/plugin-proposal-throw-expressions',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-dynamic-import',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
        '@babel/plugin-proposal-decorators',
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-pipeline-operator',
        '@babel/plugin-proposal-partial-application',
        '@babel/plugin-proposal-do-expressions',
        '@babel/plugin-proposal-function-sent',
      ],
    }],
  ];

  return {
    presets,
    plugins,
    env: {
      development: {
        plugins: [
          'react-refresh/babel',
        ],
      },
      production: {
        plugins: [
          ['@babel/plugin-transform-remove-console', {
            exclude: ['error', 'warn'],
          }],
          ['@babel/plugin-transform-remove-debugger'],
          ['@babel/plugin-transform-remove-undefined'],
          ['@babel/plugin-transform-remove-unused-variables'],
          ['@babel/plugin-transform-remove-unused-imports'],
        ],
      },
      test: {
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    },
  };
};
