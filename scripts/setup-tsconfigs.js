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

// Create tsconfig.lib.json for packages
packages.forEach(pkg => {
  const tsconfigPath = `packages/${pkg}/tsconfig.lib.json`;
  const tsconfig = {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "outDir": "../../dist/out-tsc",
      "declaration": true,
      "declarationMap": true,
      "inlineSources": true,
      "types": ["node"]
    },
    "include": [
      "src/**/*.ts",
      "src/**/*.tsx"
    ],
    "exclude": [
      "jest.config.ts",
      "src/**/*.spec.ts",
      "src/**/*.test.ts",
      "src/**/*.stories.ts",
      "src/**/*.stories.tsx"
    ]
  };

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log(`Created ${tsconfigPath}`);
});

console.log('All tsconfig.lib.json files created successfully!');
