/**
 * 🚀 Phase 1 Test Runner
 * Purpose: Execute Phase 1 integration tests and generate report
 */

import { ServiceContainer } from './ServiceContainer';
import { Phase1IntegrationTest } from './Phase1IntegrationTest';

async function runPhase1Tests(): Promise<void> {
  console.log('🚀 Starting Phase 1 Test Runner...');
  
  try {
    // Initialize Service Container
    console.log('🏗️ Initializing Service Container...');
    const serviceContainer = ServiceContainer.getInstance({
      databasePath: ':memory:', // Use in-memory database for testing
      enableRealTimeSync: true,
      enableIntelligence: true,
      enableWeatherIntegration: false
    });

    // Initialize database
    await serviceContainer.database.initialize();
    console.log('✅ Service Container initialized');

    // Run integration tests
    console.log('🧪 Running Phase 1 Integration Tests...');
    const testSuite = new Phase1IntegrationTest(serviceContainer);
    const results = await testSuite.runFullTestSuite();

    // Generate and display report
    const report = testSuite.generateReport(results);
    console.log(report);

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '..', '..', '..', 'Phase1TestReport.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Test report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (results.overall.successRate >= 90) {
      console.log('🎉 Phase 1 Integration Tests PASSED!');
      process.exit(0);
    } else {
      console.log('❌ Phase 1 Integration Tests FAILED!');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Phase 1 Test Runner failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPhase1Tests();
}

export { runPhase1Tests };
