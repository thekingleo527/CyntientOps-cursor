#!/usr/bin/env node

/**
 * 📊 Bundle Analyzer
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.mobileAppPath = path.join(this.projectRoot, 'apps/mobile-rn');
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundle() {
    console.log('🔍 Analyzing bundle size and composition...\n');

    try {
      // Create bundle analysis directory
      const analysisDir = path.join(this.projectRoot, 'dist/bundle-analysis');
      if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
      }

      // Export bundle for analysis
      console.log('📦 Exporting bundle for analysis...');
      execSync('yarn expo export --platform ios --output-dir ../../dist/bundle-analysis', {
        cwd: this.mobileAppPath,
        stdio: 'pipe'
      });

      // Analyze bundle files
      const bundleFiles = this.getBundleFiles(analysisDir);
      const analysis = this.analyzeBundleFiles(bundleFiles);

      // Generate report
      this.generateReport(analysis);

      return analysis;
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get bundle files from analysis directory
   */
  getBundleFiles(analysisDir) {
    const files = [];
    
    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.jsbundle')) {
          files.push({
            path: fullPath,
            size: stat.size,
            relativePath: path.relative(analysisDir, fullPath)
          });
        }
      }
    };

    walkDir(analysisDir);
    return files;
  }

  /**
   * Analyze bundle files and identify optimization opportunities
   */
  analyzeBundleFiles(files) {
    const analysis = {
      totalSize: 0,
      largestFiles: [],
      recommendations: [],
      fileCount: files.length
    };

    // Calculate total size and find largest files
    files.forEach(file => {
      analysis.totalSize += file.size;
    });

    // Sort by size and get top 10 largest files
    analysis.largestFiles = files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Bundle size recommendations
    if (analysis.totalSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'bundle-size',
        priority: 'high',
        message: `Bundle size is ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB. Consider code splitting and lazy loading.`
      });
    }

    // Large file recommendations
    const largeFiles = analysis.largestFiles.filter(file => file.size > 1024 * 1024); // 1MB
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'large-files',
        priority: 'medium',
        message: `Found ${largeFiles.length} files larger than 1MB. Consider splitting these modules.`,
        files: largeFiles.map(f => f.relativePath)
      });
    }

    // General recommendations
    recommendations.push({
      type: 'general',
      priority: 'low',
      message: 'Consider implementing tree shaking, removing unused dependencies, and optimizing images.'
    });

    return recommendations;
  }

  /**
   * Generate detailed report
   */
  generateReport(analysis) {
    console.log('📊 Bundle Analysis Report');
    console.log('========================\n');

    console.log(`📦 Total Bundle Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Total Files: ${analysis.fileCount}\n`);

    console.log('🔝 Largest Files:');
    analysis.largestFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.relativePath} - ${(file.size / 1024).toFixed(2)} KB`);
    });

    console.log('\n💡 Optimization Recommendations:');
    analysis.recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${priority} ${rec.message}`);
      
      if (rec.files) {
        rec.files.forEach(file => {
          console.log(`     - ${file}`);
        });
      }
    });

    console.log('\n🚀 Performance Tips:');
    console.log('  • Use React.lazy() for code splitting');
    console.log('  • Implement service worker caching');
    console.log('  • Optimize images and assets');
    console.log('  • Remove unused dependencies');
    console.log('  • Use tree shaking for smaller bundles');
    console.log('  • Consider using Hermes for better performance');
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyzeBundle().catch(console.error);
}

module.exports = BundleAnalyzer;

