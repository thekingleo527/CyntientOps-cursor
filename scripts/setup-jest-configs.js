#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packages = [
  'api-clients',
  'business-core',
  'command-chains', 
  'context-engines',
  'data-seed',
  'database',
  'design-tokens',
  'domain-schema',
  'intelligence-services',
  'managers',
  'offline-support',
  'realtime-sync',
  'testing',
  'ui-components'
];

// Create jest.config.ts for packages
packages.forEach(pkg => {
  const jestPath = `packages/${pkg}/jest.config.ts`;
  const jestConfig = `/* eslint-disable */
export default {
  displayName: '${pkg}',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react-native/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/${pkg}',
};`;

  fs.writeFileSync(jestPath, jestConfig);
  console.log(`Created ${jestPath}`);
});

console.log('All jest.config.ts files created successfully!');
