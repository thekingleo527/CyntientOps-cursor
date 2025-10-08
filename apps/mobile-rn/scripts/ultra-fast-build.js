#!/usr/bin/env node

/**
 * Ultra-Fast Build Script
 * Optimized for sub-30 second builds
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class UltraFastBuild {
  constructor() {
    this.startTime = Date.now();
    this.buildType = process.argv[2] || 'lightning';
    this.optimizations = {
      lightning: {
        workers: 20,
        nodeEnv: 'production',
        noDev: true,
        minify: true,
        noSourceMaps: true,
        noCache: true
      },
      ultra: {
        workers: 16,
        nodeEnv: 'development',
        noDev: true,
        minify: true,
        noSourceMaps: true,
        noCache: false
      }
    };
  }

  async run() {
    console.log(`🚀 Starting ultra-fast ${this.buildType} build...`);
    
    try {
      // Kill existing processes
      this.killPorts();
      
      // Set environment variables
      this.setEnvironment();
      
      // Start build
      await this.startBuild();
      
      const duration = Date.now() - this.startTime;
      console.log(`✅ Build completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      
      if (duration < 30000) {
        console.log('🎉 SUCCESS: Build completed under 30 seconds!');
      } else {
        console.log('⚠️  Build took longer than 30 seconds. Consider using lightning mode.');
      }
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  killPorts() {
    console.log('🔪 Killing existing processes...');
    try {
      execSync('bash -lc "lsof -nP -i:8081 -t | xargs -r kill -9; lsof -nP -i:19000 -t | xargs -r kill -9; lsof -nP -i:19001 -t | xargs -r kill -9"', { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors - ports might not be in use
    }
  }

  setEnvironment() {
    const config = this.optimizations[this.buildType];
    
    process.env.EXPO_DEV_SERVER_PORT = '19000';
    process.env.RCT_METRO_PORT = '8081';
    process.env.NODE_ENV = config.nodeEnv;
    
    if (config.noCache) {
      process.env.METRO_CACHE_ROOT = '';
    } else {
      process.env.METRO_CACHE_ROOT = '/Volumes/FastSSD/Developer/_devdata/metro-cache';
    }
    
    console.log(`⚙️  Environment: ${config.nodeEnv}, Workers: ${config.workers}`);
  }

  async startBuild() {
    const config = this.optimizations[this.buildType];
    
    const args = [
      'start',
      '-c',
      '--dev-client',
      `--max-workers`,
      config.workers.toString()
    ];
    
    if (config.noDev) args.push('--no-dev');
    if (config.minify) args.push('--minify');
    if (config.noSourceMaps) args.push('--no-source-maps');
    if (config.noCache) args.push('--no-cache');
    
    console.log(`🏗️  Starting build with args: ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const child = spawn('expo', args, {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// CLI interface
if (require.main === module) {
  const buildType = process.argv[2] || 'lightning';
  
  if (buildType === 'help') {
    console.log(`
🚀 Ultra-Fast Build Script

Usage: node ultra-fast-build.js [lightning|ultra]

Modes:
  lightning  - Maximum speed (20 workers, no cache, production)
  ultra      - Fast with cache (16 workers, cached, development)

Examples:
  node ultra-fast-build.js lightning
  node ultra-fast-build.js ultra
    `);
    process.exit(0);
  }
  
  const build = new UltraFastBuild();
  build.run().catch(console.error);
}

module.exports = UltraFastBuild;
