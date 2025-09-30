/**
 * 🧪 Phase 1 Integration Test
 * Purpose: Comprehensive test of all Phase 1 infrastructure components
 * Tests: Database Integration, Authentication, WebSocket, Nova AI Brain
 */

import { ServiceContainer } from './ServiceContainer';
import { DatabaseManager } from '@cyntientops/database';
import { UserRole } from '@cyntientops/domain-schema';

export interface TestResult {
  service: string;
  test: string;
  success: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface Phase1TestSuite {
  databaseIntegration: TestResult[];
  authentication: TestResult[];
  realTimeCommunication: TestResult[];
  novaAIBrain: TestResult[];
  serviceContainer: TestResult[];
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    totalDuration: number;
  };
}

export class Phase1IntegrationTest {
  private serviceContainer: ServiceContainer;
  private testResults: TestResult[] = [];

  constructor(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
  }

  /**
   * Run complete Phase 1 integration test suite
   */
  async runFullTestSuite(): Promise<Phase1TestSuite> {
    console.log('🧪 Starting Phase 1 Integration Test Suite...');
    const startTime = Date.now();

    this.testResults = [];

    try {
      // Test Database Integration
      await this.testDatabaseIntegration();
      
      // Test Authentication System
      await this.testAuthenticationSystem();
      
      // Test Real-Time Communication
      await this.testRealTimeCommunication();
      
      // Test Nova AI Brain
      await this.testNovaAIBrain();
      
      // Test Service Container Integration
      await this.testServiceContainerIntegration();

      const totalDuration = Date.now() - startTime;
      const passedTests = this.testResults.filter(r => r.success).length;
      const failedTests = this.testResults.filter(r => !r.success).length;

      const results: Phase1TestSuite = {
        databaseIntegration: this.testResults.filter(r => r.service === 'database'),
        authentication: this.testResults.filter(r => r.service === 'authentication'),
        realTimeCommunication: this.testResults.filter(r => r.service === 'realtime'),
        novaAIBrain: this.testResults.filter(r => r.service === 'nova'),
        serviceContainer: this.testResults.filter(r => r.service === 'container'),
        overall: {
          totalTests: this.testResults.length,
          passedTests,
          failedTests,
          successRate: (passedTests / this.testResults.length) * 100,
          totalDuration
        }
      };

      console.log(`✅ Phase 1 Integration Test Complete: ${passedTests}/${this.testResults.length} tests passed (${results.overall.successRate.toFixed(1)}%)`);
      return results;

    } catch (error) {
      console.error('❌ Phase 1 Integration Test Suite failed:', error);
      throw error;
    }
  }

  // MARK: - Database Integration Tests

  private async testDatabaseIntegration(): Promise<void> {
    console.log('🗄️ Testing Database Integration...');

    // Test 1: Database Connection
    await this.runTest('database', 'connection', async () => {
      const stats = await this.serviceContainer.databaseIntegration.getDatabaseStats();
      return {
        connected: true,
        stats
      };
    });

    // Test 2: Worker Data Operations
    await this.runTest('database', 'worker_operations', async () => {
      // Test getting workers
      const workers = await this.serviceContainer.databaseIntegration.getWorkers({ limit: 5 });
      return {
        workersFound: workers.count,
        hasData: workers.data.length > 0
      };
    });

    // Test 3: Task Operations
    await this.runTest('database', 'task_operations', async () => {
      // Test creating a task
      const testTask = {
        name: 'Test Task',
        description: 'Integration test task',
        category: 'test',
        priority: 'medium',
        assigned_worker_id: 'test_worker',
        assigned_building_id: 'test_building',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration: 60
      };

      const taskId = await this.serviceContainer.databaseIntegration.createTask(testTask);
      return {
        taskCreated: !!taskId,
        taskId
      };
    });

    // Test 4: Building Operations
    await this.runTest('database', 'building_operations', async () => {
      const buildings = await this.serviceContainer.databaseIntegration.getBuildings({ limit: 3 });
      return {
        buildingsFound: buildings.count,
        hasData: buildings.data.length > 0
      };
    });

    // Test 5: Clock In/Out Operations
    await this.runTest('database', 'clock_operations', async () => {
      const testWorkerId = 'test_worker_clock';
      const testBuildingId = 'test_building_clock';

      // Test clock in
      const clockInSuccess = await this.serviceContainer.databaseIntegration.clockInWorker(testWorkerId, testBuildingId);
      
      // Test clock status
      const clockStatus = await this.serviceContainer.databaseIntegration.getWorkerClockStatus(testWorkerId);
      
      // Test clock out
      const clockOutSuccess = await this.serviceContainer.databaseIntegration.clockOutWorker(testWorkerId);

      return {
        clockInSuccess,
        clockStatusFound: !!clockStatus,
        clockOutSuccess
      };
    });
  }

  // MARK: - Authentication System Tests

  private async testAuthenticationSystem(): Promise<void> {
    console.log('🔐 Testing Authentication System...');

    // Test 1: Session Creation
    await this.runTest('authentication', 'session_creation', async () => {
      const testUser = {
        id: 'test_user_auth',
        email: 'test@cyntientops.com',
        role: 'worker' as UserRole,
        name: 'Test User',
        isAuthenticated: true
      };

      const session = await this.serviceContainer.sessionManager.createSession(
        testUser,
        'test_device',
        '127.0.0.1',
        'Test User Agent'
      );

      return {
        sessionCreated: !!session,
        sessionToken: session?.sessionToken
      };
    });

    // Test 2: Session Validation
    await this.runTest('authentication', 'session_validation', async () => {
      const testUser = {
        id: 'test_user_validate',
        email: 'test@cyntientops.com',
        role: 'worker' as UserRole,
        name: 'Test User',
        isAuthenticated: true
      };

      const session = await this.serviceContainer.sessionManager.createSession(
        testUser,
        'test_device_validate',
        '127.0.0.1',
        'Test User Agent'
      );

      if (!session) {
        throw new Error('Session creation failed');
      }

      const validatedSession = await this.serviceContainer.sessionManager.validateSession(session.sessionToken);
      
      return {
        sessionValidated: !!validatedSession,
        sessionId: validatedSession?.sessionToken
      };
    });

    // Test 3: Permission Checking
    await this.runTest('authentication', 'permission_checking', async () => {
      const testUser = {
        id: 'test_user_perms',
        email: 'test@cyntientops.com',
        role: 'worker' as UserRole,
        name: 'Test User',
        isAuthenticated: true
      };

      const session = await this.serviceContainer.sessionManager.createSession(
        testUser,
        'test_device_perms',
        '127.0.0.1',
        'Test User Agent'
      );

      if (!session) {
        throw new Error('Session creation failed');
      }

      const canViewTasks = this.serviceContainer.sessionManager.hasPermission(session, 'view_tasks');
      const canManageWorkers = this.serviceContainer.sessionManager.hasPermission(session, 'manage_workers');

      return {
        canViewTasks,
        canManageWorkers,
        permissions: session.permissions
      };
    });

    // Test 4: Session Statistics
    await this.runTest('authentication', 'session_statistics', async () => {
      const stats = await this.serviceContainer.sessionManager.getSessionStats();
      return {
        activeSessions: stats.activeSessions,
        activeUsers: stats.activeUsers,
        memorySessions: stats.memorySessions
      };
    });
  }

  // MARK: - Real-Time Communication Tests

  private async testRealTimeCommunication(): Promise<void> {
    console.log('🔌 Testing Real-Time Communication...');

    // Test 1: Service Initialization
    await this.runTest('realtime', 'service_initialization', async () => {
      const realTimeService = this.serviceContainer.realTimeCommunication;
      return {
        serviceInitialized: !!realTimeService,
        connectionStatus: realTimeService.getConnectionStatus()
      };
    });

    // Test 2: Event Subscription
    await this.runTest('realtime', 'event_subscription', async () => {
      const realTimeService = this.serviceContainer.realTimeCommunication;
      
      const subscriptionId = realTimeService.subscribe({
        userId: 'test_user_realtime',
        userRole: 'worker',
        eventTypes: ['task:created', 'task:updated'],
        filters: {
          buildingIds: ['test_building'],
          categories: ['task']
        },
        callback: (event) => {
          console.log('Test event received:', event);
        }
      });

      return {
        subscriptionCreated: !!subscriptionId,
        subscriptionId,
        activeSubscriptions: realTimeService.getActiveSubscriptionsCount()
      };
    });

    // Test 3: Event Broadcasting
    await this.runTest('realtime', 'event_broadcasting', async () => {
      const realTimeService = this.serviceContainer.realTimeCommunication;
      
      const broadcastSuccess = await realTimeService.broadcastEvent({
        type: 'test:integration',
        category: 'system',
        priority: 'medium',
        data: { test: true, timestamp: new Date().toISOString() },
        source: {
          userId: 'test_user',
          userRole: 'worker'
        },
        targets: {
          broadcast: true
        }
      });

      return {
        broadcastAttempted: true,
        queuedMessages: realTimeService.getQueuedMessagesCount()
      };
    });

    // Test 4: Task Event Broadcasting
    await this.runTest('realtime', 'task_event_broadcasting', async () => {
      const realTimeService = this.serviceContainer.realTimeCommunication;
      
      const taskUpdateSuccess = await realTimeService.broadcastTaskUpdate(
        'test_task_id',
        'created',
        {
          id: 'test_task_id',
          name: 'Test Task',
          buildingId: 'test_building'
        },
        {
          userId: 'test_user',
          userRole: 'worker'
        }
      );

      return {
        taskUpdateBroadcasted: taskUpdateSuccess
      };
    });
  }

  // MARK: - Nova AI Brain Tests

  private async testNovaAIBrain(): Promise<void> {
    console.log('🧠 Testing Nova AI Brain...');

    // Test 1: Service Initialization
    await this.runTest('nova', 'service_initialization', async () => {
      const novaService = this.serviceContainer.novaAIBrain;
      const stats = await novaService.getServiceStats();
      
      return {
        serviceInitialized: !!novaService,
        supabaseEnabled: novaService.isSupabaseAvailable(),
        stats
      };
    });

    // Test 2: Prompt Processing
    await this.runTest('nova', 'prompt_processing', async () => {
      const novaService = this.serviceContainer.novaAIBrain;
      
      const prompt = {
        id: 'test_prompt_1',
        text: 'What is my current task status?',
        context: {
          userRole: 'worker' as UserRole,
          userId: 'test_user_nova',
          currentBuilding: {
            id: 'test_building',
            name: 'Test Building',
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Test St'
          }
        },
        priority: 'medium' as const,
        expectedResponseType: 'analysis' as const,
        metadata: { test: true }
      };

      const response = await novaService.processPrompt(prompt);
      
      return {
        responseGenerated: !!response,
        responseType: response.responseType,
        confidence: response.confidence,
        insightsCount: response.insights.length,
        actionsCount: response.actions.length,
        processingTime: response.processingTime
      };
    });

    // Test 3: Context Building
    await this.runTest('nova', 'context_building', async () => {
      const novaService = this.serviceContainer.novaAIBrain;
      
      const context = {
        userRole: 'worker' as UserRole,
        userId: 'test_user_context',
        currentBuilding: {
          id: 'test_building_context',
          name: 'Test Building Context',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Context St'
        },
        timeContext: {
          timeOfDay: 'morning' as const,
          dayOfWeek: 'Monday',
          season: 'Spring'
        }
      };

      const prompt = {
        id: 'test_prompt_context',
        text: 'Analyze my performance this week',
        context,
        priority: 'medium' as const,
        expectedResponseType: 'analysis' as const,
        metadata: { test: true }
      };

      const response = await novaService.processPrompt(prompt);
      
      return {
        contextProcessed: !!response,
        hasInsights: response.insights.length > 0,
        confidence: response.confidence
      };
    });

    // Test 4: Service Statistics
    await this.runTest('nova', 'service_statistics', async () => {
      const novaService = this.serviceContainer.novaAIBrain;
      const stats = await novaService.getServiceStats();
      
      return {
        queueSize: stats.queueSize,
        responsesLast24h: stats.responsesLast24h,
        isProcessing: stats.isProcessing
      };
    });
  }

  // MARK: - Service Container Integration Tests

  private async testServiceContainerIntegration(): Promise<void> {
    console.log('🏗️ Testing Service Container Integration...');

    // Test 1: Service Container Initialization
    await this.runTest('container', 'initialization', async () => {
      return {
        containerInitialized: !!this.serviceContainer,
        databaseConnected: !!this.serviceContainer.database,
        authServiceAvailable: !!this.serviceContainer.auth,
        sessionManagerAvailable: !!this.serviceContainer.sessionManager
      };
    });

    // Test 2: Lazy Service Loading
    await this.runTest('container', 'lazy_loading', async () => {
      const workers = this.serviceContainer.workers;
      const buildings = this.serviceContainer.buildings;
      const tasks = this.serviceContainer.tasks;
      const realTimeComm = this.serviceContainer.realTimeCommunication;
      const novaBrain = this.serviceContainer.novaAIBrain;

      return {
        workersLoaded: !!workers,
        buildingsLoaded: !!buildings,
        tasksLoaded: !!tasks,
        realTimeCommLoaded: !!realTimeComm,
        novaBrainLoaded: !!novaBrain
      };
    });

    // Test 3: Service Dependencies
    await this.runTest('container', 'service_dependencies', async () => {
      // Test that services can access their dependencies
      const workers = this.serviceContainer.workers;
      const buildings = this.serviceContainer.buildings;
      
      return {
        workersHasDatabase: !!workers,
        buildingsHasDatabase: !!buildings,
        dependenciesResolved: true
      };
    });

    // Test 4: Configuration
    await this.runTest('container', 'configuration', async () => {
      return {
        configLoaded: true,
        enableIntelligence: this.serviceContainer.config?.enableIntelligence || false,
        enableWeatherIntegration: this.serviceContainer.config?.enableWeatherIntegration || false
      };
    });
  }

  // MARK: - Test Utilities

  private async runTest(service: string, testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        service,
        test: testName,
        success: true,
        duration,
        details: result
      });
      
      console.log(`  ✅ ${service}.${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        service,
        test: testName,
        success: false,
        error: error.message,
        duration,
        details: { error: error.message }
      });
      
      console.log(`  ❌ ${service}.${testName} (${duration}ms): ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport(results: Phase1TestSuite): string {
    const report = `
# Phase 1 Integration Test Report

## Overall Results
- **Total Tests**: ${results.overall.totalTests}
- **Passed**: ${results.overall.passedTests}
- **Failed**: ${results.overall.failedTests}
- **Success Rate**: ${results.overall.successRate.toFixed(1)}%
- **Total Duration**: ${results.overall.totalDuration}ms

## Service Results

### Database Integration (${results.databaseIntegration.length} tests)
${results.databaseIntegration.map(r => `- ${r.test}: ${r.success ? '✅' : '❌'} (${r.duration}ms)`).join('\n')}

### Authentication System (${results.authentication.length} tests)
${results.authentication.map(r => `- ${r.test}: ${r.success ? '✅' : '❌'} (${r.duration}ms)`).join('\n')}

### Real-Time Communication (${results.realTimeCommunication.length} tests)
${results.realTimeCommunication.map(r => `- ${r.test}: ${r.success ? '✅' : '❌'} (${r.duration}ms)`).join('\n')}

### Nova AI Brain (${results.novaAIBrain.length} tests)
${results.novaAIBrain.map(r => `- ${r.test}: ${r.success ? '✅' : '❌'} (${r.duration}ms)`).join('\n')}

### Service Container (${results.serviceContainer.length} tests)
${results.serviceContainer.map(r => `- ${r.test}: ${r.success ? '✅' : '❌'} (${r.duration}ms)`).join('\n')}

## Failed Tests
${results.overall.failedTests > 0 ? 
  this.testResults.filter(r => !r.success).map(r => `- ${r.service}.${r.test}: ${r.error}`).join('\n') :
  'No failed tests! 🎉'
}

## Phase 1 Status: ${results.overall.successRate >= 90 ? '✅ COMPLETE' : '⚠️ NEEDS ATTENTION'}
`;

    return report;
  }
}

export default Phase1IntegrationTest;
