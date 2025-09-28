/**
 * @cyntientops/testing
 * 
 * End-to-end testing suite for CyntientOps
 * Comprehensive testing with real data validation
 */

export { EndToEndTestSuite } from './EndToEndTestSuite';

export type { 
  TestResult,
  TestSuite
} from './EndToEndTestSuite';

// Test runner helper
export async function runEndToEndTests(): Promise<void> {
  const testSuite = new EndToEndTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    
    if (results.failed > 0) {
      console.error(`❌ ${results.failed} tests failed`);
      process.exit(1);
    } else {
      console.log(`✅ All ${results.passed} tests passed!`);
      process.exit(0);
    }
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await testSuite.cleanup();
  }
}

// Default export
export default EndToEndTestSuite;
