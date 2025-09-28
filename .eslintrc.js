module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Custom rules for CyntientOps
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    'react-native/react-native': true,
    jest: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
};
