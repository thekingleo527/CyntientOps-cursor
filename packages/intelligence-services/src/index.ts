/**
 * @cyntientops/intelligence-services
 * 
 * Intelligence Services Package
 * Purpose: ML/AI services for predictive analytics and optimization
 * Features: Predictive maintenance, violation risk prediction, route optimization
 */

// ML Engine
export { MLEngine } from './ml/MLEngine';
export type { TrainingData, Prediction } from './ml/MLEngine';

// Predictive Maintenance
export { PredictiveMaintenanceService } from './ml/PredictiveMaintenanceService';
export type { MaintenancePrediction } from './ml/PredictiveMaintenanceService';

// Violation Risk Prediction
export { ViolationRiskPredictor } from './ml/ViolationRiskPredictor';
export type { ViolationRisk } from './ml/ViolationRiskPredictor';

// Route Optimization
export { RouteOptimizationService } from './ml/RouteOptimizationService';
export type { 
  Location, 
  OptimizedRoute, 
  RouteOptimizationOptions 
} from './ml/RouteOptimizationService';