#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packages = [
  'api-clients',
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
  'testing'
];

const apps = [
  'admin-portal',
  'web-dashboard'
];

// Create project.json for packages
packages.forEach(pkg => {
  const projectPath = `packages/${pkg}/project.json`;
  const projectConfig = {
    "name": pkg,
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": `packages/${pkg}/src`,
    "projectType": "library",
    "targets": {
      "build": {
        "executor": "@nx/js:tsc",
        "outputs": ["{options.outputPath}"],
        "options": {
          "outputPath": `dist/packages/${pkg}`,
          "main": `packages/${pkg}/src/index.ts`,
          "tsConfig": `packages/${pkg}/tsconfig.lib.json`,
          "assets": [`packages/${pkg}/*.md`]
        }
      },
      "test": {
        "executor": "@nx/jest:jest",
        "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
        "options": {
          "jestConfig": `packages/${pkg}/jest.config.ts`,
          "passWithNoTests": true
        }
      },
      "lint": {
        "executor": "@nx/eslint:lint",
        "outputs": ["{options.outputFile}"],
        "options": {
          "lintFilePatterns": [`packages/${pkg}/**/*.{ts,tsx,js,jsx}`]
        }
      }
    },
    "tags": [`scope:${pkg.split('-')[0]}`, "type:lib"]
  };

  fs.writeFileSync(projectPath, JSON.stringify(projectConfig, null, 2));
  console.log(`Created ${projectPath}`);
});

// Create project.json for apps
apps.forEach(app => {
  const projectPath = `apps/${app}/project.json`;
  const projectConfig = {
    "name": app,
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": `apps/${app}`,
    "projectType": "application",
    "targets": {
      "build": {
        "executor": "@nx/next:build",
        "outputs": ["{options.outputPath}"],
        "options": {
          "outputPath": `dist/apps/${app}`
        }
      },
      "serve": {
        "executor": "@nx/next:server",
        "options": {
          "buildTarget": `${app}:build`,
          "dev": true
        }
      },
      "export": {
        "executor": "@nx/next:export",
        "options": {
          "buildTarget": `${app}:build`
        }
      },
      "test": {
        "executor": "@nx/jest:jest",
        "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
        "options": {
          "jestConfig": `apps/${app}/jest.config.ts`,
          "passWithNoTests": true
        }
      },
      "lint": {
        "executor": "@nx/eslint:lint",
        "outputs": ["{options.outputFile}"],
        "options": {
          "lintFilePatterns": [`apps/${app}/**/*.{ts,tsx,js,jsx}`]
        }
      }
    },
    "tags": ["scope:web", "type:app"]
  };

  fs.writeFileSync(projectPath, JSON.stringify(projectConfig, null, 2));
  console.log(`Created ${projectPath}`);
});

console.log('All project.json files created successfully!');
