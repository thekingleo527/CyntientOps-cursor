module.exports = {
  root: true,
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/*.tsx', '**/*.ts'],
      rules: {
        'react-hooks/exhaustive-deps': 'off'
      }
    }
  ],
    rules: {
      // Basic rules for CyntientOps
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-console': 'off', // Allow console statements in development
      'no-undef': 'off', // TypeScript handles this
      'no-dupe-keys': 'error',
      'no-empty': 'warn',
      'no-unreachable': 'warn',
      'no-redeclare': 'error'
    },
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    'NodeJS': 'readonly',
    'WebSocket': 'readonly',
    'window': 'readonly',
    'navigator': 'readonly',
    'MediaStreamTrack': 'readonly',
    'AudioNode': 'readonly',
    'AudioParam': 'readonly',
    'MediaStreamConstraints': 'readonly',
    'AudioContext': 'readonly',
    'MediaStream': 'readonly',
    'ScriptProcessorNode': 'readonly',
    'AnalyserNode': 'readonly',
    'GainNode': 'readonly',
    'DynamicsCompressorNode': 'readonly',
    'requestAnimationFrame': 'readonly',
    'cancelAnimationFrame': 'readonly',
    'AudioBuffer': 'readonly',
    'timestamp': 'readonly',
    'audioData': 'readonly',
    'CloseEvent': 'readonly',
    'Supercluster': 'readonly',
    'NetworkMonitor': 'readonly',
    'weatherData': 'readonly',
    'building': 'readonly',
    'onBuildingPress': 'readonly',
    'EndToEndTestSuite': 'readonly',
    'WorkerViewModel': 'readonly',
    'ClientViewModel': 'readonly',
    'AdminViewModel': 'readonly'
  }
};