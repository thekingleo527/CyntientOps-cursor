/**
 * @cyntientops/intelligence-services
 * 
 * Intelligence services for CyntientOps
 * AI-powered analytics, insights, and predictive features
 */

export { IntelligenceService } from './IntelligenceService';
export { PerformanceMonitor } from './PerformanceMonitor';

export type { 
  PerformanceInsight,
  PredictiveAnalytics,
  AnomalyDetection,
  OptimizationRecommendation,
  IntelligenceReport
} from './IntelligenceService';

export type {
  PerformanceMetrics,
  PerformanceAlert,
  SystemPerformanceMetrics,
  BottleneckAnalysis,
  OptimizationOpportunity
} from './PerformanceMonitor';

// Intelligence service initialization helper
export async function initializeIntelligenceService(
  databaseManager: any,
  serviceContainer: any,
  apiClientManager: any
): Promise<IntelligenceService> {
  return IntelligenceService.getInstance(
    databaseManager,
    serviceContainer,
    apiClientManager
  );
}

// Default export
export default IntelligenceService;
