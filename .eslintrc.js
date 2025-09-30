module.exports = {
  root: true,
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Basic rules for CyntientOps
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn'
  },
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  }
};
