#!/usr/bin/env node

/**
 * Build Performance Monitoring Script
 * Monitors and optimizes build performance for CyntientOps Mobile
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildPerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      buildStart: this.startTime,
      buildEnd: null,
      totalTime: 0,
      phases: {},
      optimizations: []
    };
  }

  startPhase(phaseName) {
    this.metrics.phases[phaseName] = {
      start: Date.now(),
      end: null,
      duration: 0
    };
    console.log(`🚀 Starting ${phaseName}...`);
  }

  endPhase(phaseName) {
    if (this.metrics.phases[phaseName]) {
      this.metrics.phases[phaseName].end = Date.now();
      this.metrics.phases[phaseName].duration = 
        this.metrics.phases[phaseName].end - this.metrics.phases[phaseName].start;
      console.log(`✅ ${phaseName} completed in ${this.metrics.phases[phaseName].duration}ms`);
    }
  }

  endBuild() {
    this.metrics.buildEnd = Date.now();
    this.metrics.totalTime = this.metrics.buildEnd - this.metrics.buildStart;
    
    console.log('\n📊 Build Performance Report:');
    console.log(`Total Build Time: ${this.metrics.totalTime}ms (${(this.metrics.totalTime / 1000).toFixed(2)}s)`);
    
    console.log('\nPhase Breakdown:');
    Object.entries(this.metrics.phases).forEach(([phase, data]) => {
      const percentage = ((data.duration / this.metrics.totalTime) * 100).toFixed(1);
      console.log(`  ${phase}: ${data.duration}ms (${percentage}%)`);
    });

    this.generateOptimizations();
    this.saveMetrics();
  }

  generateOptimizations() {
    console.log('\n🔧 Performance Optimizations:');
    
    // Check for slow phases
    Object.entries(this.metrics.phases).forEach(([phase, data]) => {
      const percentage = (data.duration / this.metrics.totalTime) * 100;
      if (percentage > 30) {
        console.log(`  ⚠️  ${phase} is taking ${percentage.toFixed(1)}% of build time`);
        this.metrics.optimizations.push({
          phase,
          issue: `High build time (${percentage.toFixed(1)}%)`,
          recommendation: this.getOptimizationRecommendation(phase)
        });
      }
    });

    // Check total build time
    if (this.metrics.totalTime > 120000) { // 2 minutes
      console.log(`  ⚠️  Total build time is ${(this.metrics.totalTime / 1000).toFixed(2)}s (target: <120s)`);
      this.metrics.optimizations.push({
        phase: 'Overall',
        issue: 'Build time exceeds 2 minutes',
        recommendation: 'Consider using incremental builds, parallel compilation, or build caching'
      });
    }

    // Display optimizations
    if (this.metrics.optimizations.length > 0) {
      console.log('\n💡 Recommended Optimizations:');
      this.metrics.optimizations.forEach((opt, index) => {
        console.log(`  ${index + 1}. ${opt.phase}: ${opt.recommendation}`);
      });
    } else {
      console.log('  ✅ Build performance is optimal!');
    }
  }

  getOptimizationRecommendation(phase) {
    const recommendations = {
      'TypeScript Compilation': 'Enable incremental compilation, reduce strict mode, use skipLibCheck',
      'Metro Bundling': 'Increase max-workers, enable caching, optimize transformer',
      'iOS Build': 'Enable parallel builds, reduce optimization level for debug, use build cache',
      'Dependency Resolution': 'Use symlinks, optimize module resolution, enable caching',
      'Asset Processing': 'Optimize image compression, use webp format, enable asset caching'
    };
    
    return recommendations[phase] || 'Review build configuration and consider parallel processing';
  }

  saveMetrics() {
    const metricsPath = path.join(__dirname, '../build-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
    console.log(`\n📁 Metrics saved to: ${metricsPath}`);
  }

  // Static methods for quick analysis
  static analyzeBuildMetrics() {
    const metricsPath = path.join(__dirname, '../build-metrics.json');
    if (fs.existsSync(metricsPath)) {
      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      console.log('📊 Historical Build Performance:');
      console.log(`Average Build Time: ${metrics.totalTime}ms`);
      
      if (metrics.optimizations.length > 0) {
        console.log('\n🔧 Pending Optimizations:');
        metrics.optimizations.forEach((opt, index) => {
          console.log(`  ${index + 1}. ${opt.phase}: ${opt.recommendation}`);
        });
      }
    } else {
      console.log('No build metrics found. Run a build to generate metrics.');
    }
  }

  static getBuildRecommendations() {
    console.log('🚀 Build Performance Recommendations:');
    console.log('1. Use yarn start:fast for development builds');
    console.log('2. Use yarn ios:fast for iOS builds');
    console.log('3. Enable Metro caching with METRO_CACHE_ROOT');
    console.log('4. Use --max-workers 8 for parallel processing');
    console.log('5. Enable --reset-cache only when needed');
    console.log('6. Use NODE_ENV=development for faster builds');
    console.log('7. Consider using --no-dev for production-like builds');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      BuildPerformanceMonitor.analyzeBuildMetrics();
      break;
    case 'recommendations':
      BuildPerformanceMonitor.getBuildRecommendations();
      break;
    default:
      console.log('Usage: node build-performance.js [analyze|recommendations]');
      console.log('  analyze        - Analyze historical build metrics');
      console.log('  recommendations - Show build optimization recommendations');
  }
}

module.exports = BuildPerformanceMonitor;
