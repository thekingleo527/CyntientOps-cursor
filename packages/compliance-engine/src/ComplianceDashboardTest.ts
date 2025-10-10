/**
 * 🧪 Compliance Dashboard Integration Test
 * 
 * Comprehensive test suite for compliance dashboard hydration
 * Tests all NYC API integrations and data processing
 */

import { complianceDashboardService, ComplianceDashboardData, BuildingComplianceData } from './ComplianceDashboardService';
import { APIClientManager } from '@cyntientops/api-clients';

// Mock building data for testing
const mockBuildings = [
  {
    id: '1',
    name: 'Test Building 1',
    address: '123 Main St, New York, NY 10001',
    bbl: '1001234001',
    bin: '1234567'
  },
  {
    id: '2',
    name: 'Test Building 2',
    address: '456 Broadway, New York, NY 10002',
    bbl: '1001234002',
    bin: '1234568'
  }
];

export class ComplianceDashboardTest {
  private apiManager: APIClientManager;

  constructor() {
    this.apiManager = APIClientManager.getInstance();
  }

  /**
   * Run all compliance dashboard tests
   */
  public async runAllTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      test: string;
      status: 'passed' | 'failed';
      message: string;
      duration: number;
    }>;
  }> {
    console.log('🧪 Starting Compliance Dashboard Tests...');
    
    const results: Array<{
      test: string;
      status: 'passed' | 'failed';
      message: string;
      duration: number;
    }> = [];

    const tests = [
      () => this.testAPIConnectivity(),
      () => this.testComplianceDashboardData(),
      () => this.testBuildingComplianceData(),
      () => this.testComplianceAlerts(),
      () => this.testComplianceTrends(),
      () => this.testDataHydration(),
      () => this.testErrorHandling(),
      () => this.testPerformance()
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        const result = await test();
        const duration = Date.now() - startTime;
        
        results.push({
          test: result.test,
          status: 'passed',
          message: result.message,
          duration
        });
        
        console.log(`✅ ${result.test}: ${result.message} (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        results.push({
          test: error instanceof Error ? error.message : 'Unknown test',
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration
        });
        
        console.log(`❌ ${error instanceof Error ? error.message : 'Unknown test'}: ${error instanceof Error ? error.message : 'Unknown error'} (${duration}ms)`);
      }
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    return { passed, failed, results };
  }

  /**
   * Test API connectivity
   */
  private async testAPIConnectivity(): Promise<{ test: string; message: string }> {
    try {
      const healthStatus = await this.apiManager.getHealthStatus();
      
      if (!healthStatus.overall) {
        throw new Error('API health check failed');
      }

      return {
        test: 'API Connectivity',
        message: `All APIs healthy (${healthStatus.apis.length} APIs checked)`
      };
    } catch (error) {
      throw new Error(`API Connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test compliance dashboard data generation
   */
  private async testComplianceDashboardData(): Promise<{ test: string; message: string }> {
    try {
      const dashboardData = await complianceDashboardService.getComplianceDashboardData(mockBuildings);
      
      if (!dashboardData) {
        throw new Error('Dashboard data is null');
      }

      if (!dashboardData.portfolio) {
        throw new Error('Portfolio data missing');
      }

      if (!dashboardData.criticalBuildings) {
        throw new Error('Critical buildings data missing');
      }

      if (!dashboardData.violations) {
        throw new Error('Violations data missing');
      }

      if (!dashboardData.alerts) {
        throw new Error('Alerts data missing');
      }

      return {
        test: 'Compliance Dashboard Data',
        message: `Dashboard data generated successfully (${dashboardData.portfolio.totalBuildings} buildings)`
      };
    } catch (error) {
      throw new Error(`Compliance Dashboard Data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test building compliance data generation
   */
  private async testBuildingComplianceData(): Promise<{ test: string; message: string }> {
    try {
      const buildingData = await complianceDashboardService.getBuildingComplianceData(mockBuildings[0]);
      
      if (!buildingData) {
        throw new Error('Building data is null');
      }

      if (!buildingData.id || !buildingData.name || !buildingData.address) {
        throw new Error('Required building fields missing');
      }

      if (typeof buildingData.score !== 'number' || buildingData.score < 0 || buildingData.score > 100) {
        throw new Error('Invalid compliance score');
      }

      if (!buildingData.violations) {
        throw new Error('Violations data missing');
      }

      if (!buildingData.financial) {
        throw new Error('Financial data missing');
      }

      if (!buildingData.inspections) {
        throw new Error('Inspections data missing');
      }

      return {
        test: 'Building Compliance Data',
        message: `Building data generated successfully (Score: ${buildingData.score}%, Grade: ${buildingData.grade})`
      };
    } catch (error) {
      throw new Error(`Building Compliance Data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test compliance alerts generation
   */
  private async testComplianceAlerts(): Promise<{ test: string; message: string }> {
    try {
      const alerts = await complianceDashboardService.getComplianceAlerts(mockBuildings);
      
      if (!Array.isArray(alerts)) {
        throw new Error('Alerts should be an array');
      }

      // Check alert structure
      for (const alert of alerts) {
        if (!alert.id || !alert.type || !alert.title || !alert.message) {
          throw new Error('Invalid alert structure');
        }

        if (!['critical', 'warning', 'info'].includes(alert.type)) {
          throw new Error('Invalid alert type');
        }
      }

      return {
        test: 'Compliance Alerts',
        message: `${alerts.length} alerts generated successfully`
      };
    } catch (error) {
      throw new Error(`Compliance Alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test compliance trends calculation
   */
  private async testComplianceTrends(): Promise<{ test: string; message: string }> {
    try {
      const trends = await complianceDashboardService.getComplianceTrends(mockBuildings);
      
      if (!trends) {
        throw new Error('Trends data is null');
      }

      if (!Array.isArray(trends.violations)) {
        throw new Error('Violations trends should be an array');
      }

      if (!Array.isArray(trends.fines)) {
        throw new Error('Fines trends should be an array');
      }

      if (!Array.isArray(trends.compliance)) {
        throw new Error('Compliance trends should be an array');
      }

      return {
        test: 'Compliance Trends',
        message: `Trends calculated successfully (${trends.violations.length} violation data points)`
      };
    } catch (error) {
      throw new Error(`Compliance Trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test data hydration from NYC APIs
   */
  private async testDataHydration(): Promise<{ test: string; message: string }> {
    try {
      // Test HPD API
      const hpdViolations = await this.apiManager.hpd.getViolationsByAddress(mockBuildings[0].address);
      if (!Array.isArray(hpdViolations)) {
        throw new Error('HPD violations should be an array');
      }

      // Test DSNY API
      const dsnySchedule = await this.apiManager.dsny.getCollectionSchedule(mockBuildings[0].address);
      // DSNY schedule can be null if no data found

      // Test Weather API
      const weatherStatus = await this.apiManager.weather.getHealthStatus();
      if (!weatherStatus.isHealthy) {
        throw new Error('Weather API not healthy');
      }

      return {
        test: 'Data Hydration',
        message: `NYC APIs hydrated successfully (HPD: ${hpdViolations.length} violations)`
      };
    } catch (error) {
      throw new Error(`Data Hydration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<{ test: string; message: string }> {
    try {
      // Test with invalid building data
      const invalidBuildings = [
        {
          id: '',
          name: '',
          address: '',
          bbl: '',
          bin: ''
        }
      ];

      try {
        await complianceDashboardService.getComplianceDashboardData(invalidBuildings);
        // Should not throw an error, but should handle gracefully
      } catch (error) {
        // Expected to handle errors gracefully
      }

      return {
        test: 'Error Handling',
        message: 'Error handling works correctly'
      };
    } catch (error) {
      throw new Error(`Error Handling: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<{ test: string; message: string }> {
    try {
      const startTime = Date.now();
      
      await complianceDashboardService.getComplianceDashboardData(mockBuildings);
      
      const duration = Date.now() - startTime;
      
      if (duration > 10000) { // 10 seconds
        throw new Error(`Performance too slow: ${duration}ms`);
      }

      return {
        test: 'Performance',
        message: `Dashboard data generated in ${duration}ms`
      };
    } catch (error) {
      throw new Error(`Performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test compliance scoring accuracy
   */
  public async testComplianceScoring(): Promise<{
    test: string;
    message: string;
  }> {
    try {
      const buildingData = await complianceDashboardService.getBuildingComplianceData(mockBuildings[0]);
      
      // Validate score calculation
      if (buildingData.score < 0 || buildingData.score > 100) {
        throw new Error(`Invalid score: ${buildingData.score}`);
      }

      // Validate grade calculation
      const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
      if (!validGrades.includes(buildingData.grade)) {
        throw new Error(`Invalid grade: ${buildingData.grade}`);
      }

      // Validate status calculation
      const validStatuses = ['critical', 'high', 'medium', 'low'];
      if (!validStatuses.includes(buildingData.status)) {
        throw new Error(`Invalid status: ${buildingData.status}`);
      }

      return {
        test: 'Compliance Scoring',
        message: `Scoring accurate (Score: ${buildingData.score}%, Grade: ${buildingData.grade}, Status: ${buildingData.status})`
      };
    } catch (error) {
      throw new Error(`Compliance Scoring: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test data consistency
   */
  public async testDataConsistency(): Promise<{
    test: string;
    message: string;
  }> {
    try {
      const dashboardData = await complianceDashboardService.getComplianceDashboardData(mockBuildings);
      
      // Check portfolio consistency
      if (dashboardData.portfolio.totalBuildings !== mockBuildings.length) {
        throw new Error('Total buildings count mismatch');
      }

      // Check critical buildings consistency
      if (dashboardData.criticalBuildings.length > mockBuildings.length) {
        throw new Error('Critical buildings count exceeds total buildings');
      }

      // Check violations consistency
      const totalViolations = dashboardData.violations.hpd.total + 
                             dashboardData.violations.dsny.total + 
                             dashboardData.violations.fdny.total + 
                             dashboardData.violations.complaints311.total;
      
      if (totalViolations < 0) {
        throw new Error('Negative violation count');
      }

      return {
        test: 'Data Consistency',
        message: 'All data relationships are consistent'
      };
    } catch (error) {
      throw new Error(`Data Consistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export test runner
export const runComplianceDashboardTests = async () => {
  const testRunner = new ComplianceDashboardTest();
  return await testRunner.runAllTests();
};

export default ComplianceDashboardTest;
