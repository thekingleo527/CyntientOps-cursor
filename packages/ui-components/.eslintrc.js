module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    // Disable TypeScript import errors for React/React Native
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    // Disable React/React Native specific rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    '**/*.d.ts',
  ],
};
