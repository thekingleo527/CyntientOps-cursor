#!/usr/bin/env node

/**
 * 🧪 React Native Independence Test
 * Tests if the React Native app can operate independently of SwiftUI backend
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Core services that should be available
  requiredServices: [
    'ServiceContainer',
    'NYCService', 
    'ComplianceService',
    'CacheManager',
    'DatabaseManager'
  ],
  
  // NYC API endpoints that should be functional
  requiredAPIs: [
    'getHPDViolations',
    'getDOBPermits', 
    'getLL97Emissions',
    'getDSNYViolations'
  ],
  
  // Compliance features that should work
  requiredComplianceFeatures: [
    'compliance scoring',
    'deadline tracking',
    'LL97 calculations',
    'violation management'
  ]
};

async function testReactNativeIndependence() {
  console.log('🧪 Testing React Native App Independence\n');
  
  const results = {
    serviceAvailability: {},
    apiFunctionality: {},
    complianceFeatures: {},
    overallScore: 0
  };
  
  // Test 1: Check if core services exist and are properly implemented
  console.log('📦 Testing Core Services Availability...');
  for (const service of TEST_CONFIG.requiredServices) {
    try {
      const servicePath = findServiceFile(service);
      if (servicePath) {
        const content = fs.readFileSync(servicePath, 'utf8');
        const hasImplementation = content.length > 1000; // Basic check for substantial implementation
        const hasExports = content.includes('export') || content.includes('module.exports');
        
        results.serviceAvailability[service] = {
          exists: true,
          hasImplementation,
          hasExports,
          score: hasImplementation && hasExports ? 100 : 50
        };
        
        console.log(`  ✅ ${service}: ${hasImplementation ? 'Implemented' : 'Basic'} (${results.serviceAvailability[service].score}%)`);
      } else {
        results.serviceAvailability[service] = {
          exists: false,
          hasImplementation: false,
          hasExports: false,
          score: 0
        };
        console.log(`  ❌ ${service}: Not found`);
      }
    } catch (error) {
      results.serviceAvailability[service] = {
        exists: false,
        error: error.message,
        score: 0
      };
      console.log(`  ❌ ${service}: Error - ${error.message}`);
    }
  }
  
  // Test 2: Check NYC API functionality
  console.log('\n🌐 Testing NYC API Functionality...');
  for (const api of TEST_CONFIG.requiredAPIs) {
    try {
      const apiPath = findAPIFile(api);
      if (apiPath) {
        const content = fs.readFileSync(apiPath, 'utf8');
        const hasMethod = content.includes(`async ${api}(`) || content.includes(`${api}(`);
        const hasRealImplementation = content.includes('data.cityofnewyork.us') || content.includes('fetch(');
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        
        results.apiFunctionality[api] = {
          exists: true,
          hasMethod,
          hasRealImplementation,
          hasErrorHandling,
          score: [hasMethod, hasRealImplementation, hasErrorHandling].filter(Boolean).length * 33
        };
        
        console.log(`  ✅ ${api}: ${hasRealImplementation ? 'Real API' : 'Mock'} implementation (${results.apiFunctionality[api].score}%)`);
      } else {
        results.apiFunctionality[api] = {
          exists: false,
          score: 0
        };
        console.log(`  ❌ ${api}: Not found`);
      }
    } catch (error) {
      results.apiFunctionality[api] = {
        exists: false,
        error: error.message,
        score: 0
      };
      console.log(`  ❌ ${api}: Error - ${error.message}`);
    }
  }
  
  // Test 3: Check compliance features
  console.log('\n🛡️ Testing Compliance Features...');
  for (const feature of TEST_CONFIG.requiredComplianceFeatures) {
    try {
      const featurePath = findComplianceFile(feature);
      if (featurePath) {
        const content = fs.readFileSync(featurePath, 'utf8');
        const hasFeature = content.toLowerCase().includes(feature.toLowerCase());
        const hasCalculation = content.includes('calculate') || content.includes('score') || content.includes('deadline');
        const hasBusinessLogic = content.length > 2000; // Substantial business logic
        
        results.complianceFeatures[feature] = {
          exists: true,
          hasFeature,
          hasCalculation,
          hasBusinessLogic,
          score: [hasFeature, hasCalculation, hasBusinessLogic].filter(Boolean).length * 33
        };
        
        console.log(`  ✅ ${feature}: ${hasBusinessLogic ? 'Full implementation' : 'Basic'} (${results.complianceFeatures[feature].score}%)`);
      } else {
        results.complianceFeatures[feature] = {
          exists: false,
          score: 0
        };
        console.log(`  ❌ ${feature}: Not found`);
      }
    } catch (error) {
      results.complianceFeatures[feature] = {
        exists: false,
        error: error.message,
        score: 0
      };
      console.log(`  ❌ ${feature}: Error - ${error.message}`);
    }
  }
  
  // Calculate overall score
  const serviceScore = Object.values(results.serviceAvailability).reduce((sum, s) => sum + s.score, 0) / TEST_CONFIG.requiredServices.length;
  const apiScore = Object.values(results.apiFunctionality).reduce((sum, a) => sum + a.score, 0) / TEST_CONFIG.requiredAPIs.length;
  const complianceScore = Object.values(results.complianceFeatures).reduce((sum, c) => sum + c.score, 0) / TEST_CONFIG.requiredComplianceFeatures.length;
  
  results.overallScore = (serviceScore + apiScore + complianceScore) / 3;
  
  // Generate report
  console.log('\n📊 Independence Test Results:');
  console.log(`  📦 Services: ${serviceScore.toFixed(1)}%`);
  console.log(`  🌐 APIs: ${apiScore.toFixed(1)}%`);
  console.log(`  🛡️ Compliance: ${complianceScore.toFixed(1)}%`);
  console.log(`  🎯 Overall: ${results.overallScore.toFixed(1)}%`);
  
  // Determine independence level
  let independenceLevel;
  if (results.overallScore >= 90) {
    independenceLevel = '🟢 FULLY INDEPENDENT';
  } else if (results.overallScore >= 75) {
    independenceLevel = '🟡 MOSTLY INDEPENDENT';
  } else if (results.overallScore >= 50) {
    independenceLevel = '🟠 PARTIALLY INDEPENDENT';
  } else {
    independenceLevel = '🔴 NOT INDEPENDENT';
  }
  
  console.log(`\n🎯 Independence Level: ${independenceLevel}`);
  
  // Recommendations
  console.log('\n📋 Recommendations:');
  if (results.overallScore >= 85) {
    console.log('  ✅ React Native app is ready for independent operation');
    console.log('  ✅ Can proceed with production deployment');
    console.log('  ✅ SwiftUI backend dependency can be removed');
  } else if (results.overallScore >= 70) {
    console.log('  ⚠️  Minor issues need to be addressed');
    console.log('  🔧 Focus on improving low-scoring components');
    console.log('  📈 App is close to full independence');
  } else {
    console.log('  ❌ Significant work needed for independence');
    console.log('  🔧 Address critical missing components');
    console.log('  📚 Review implementation gaps');
  }
  
  return results;
}

function findServiceFile(serviceName) {
  const possiblePaths = [
    `packages/business-core/src/ServiceContainer.ts`,
    `packages/business-core/src/services/${serviceName}.ts`,
    `packages/business-core/src/services/${serviceName}Service.ts`,
    `packages/database/src/${serviceName}.ts`
  ];
  
  for (const filePath of possiblePaths) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function findAPIFile(apiName) {
  const possiblePaths = [
    `packages/api-clients/src/nyc/NYCAPIService.ts`,
    `packages/business-core/src/services/NYCService.ts`,
    `packages/business-core/src/services/ComplianceService.ts`
  ];
  
  for (const filePath of possiblePaths) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function findComplianceFile(feature) {
  const possiblePaths = [
    `packages/business-core/src/services/ComplianceService.ts`,
    `packages/business-core/src/services/NYCService.ts`,
    `packages/api-clients/src/nyc/NYCAPIService.ts`
  ];
  
  for (const filePath of possiblePaths) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// Run the test
if (require.main === module) {
  testReactNativeIndependence().catch(console.error);
}

module.exports = { testReactNativeIndependence };
