/**
 * @cyntientops/intelligence-services
 * 
 * Predictive Maintenance Service
 * Purpose: ML-powered maintenance prediction using historical data
 * Features: Maintenance scheduling, risk assessment, cost optimization
 */

import { MLEngine, TrainingData, Prediction } from './MLEngine';

export interface MaintenancePrediction {
  buildingId: string;
  buildingName: string;
  predictedIssue: string;
  likelihood: number; // 0-1
  estimatedDays: number;
  recommendedActions: string[];
  factors: Array<{ name: string; importance: number }>;
  historicalPatterns: any;
}

export class PredictiveMaintenanceService {
  private db: any; // DatabaseManager
  private mlEngine: MLEngine;
  private modelName = 'maintenance_prediction';

  constructor(db: any) {
    this.db = db;
    this.mlEngine = new MLEngine(db);
  }

  /**
   * Initialize and train model
   */
  async initialize(): Promise<void> {
    await this.mlEngine.initialize();

    // Train model if not already trained
    if (!this.mlEngine.hasModel(this.modelName)) {
      await this.trainModel();
    }
  }

  /**
   * Train maintenance prediction model
   */
  async trainModel(): Promise<void> {
    console.log('[PredictiveMaintenance] Gathering training data...');

    // Gather historical maintenance data
    const trainingData = await this.gatherTrainingData();

    if (trainingData.features.length < 100) {
      console.warn('[PredictiveMaintenance] Insufficient data for training');
      return;
    }

    console.log(`[PredictiveMaintenance] Training with ${trainingData.features.length} samples`);

    // Train model
    const result = await this.mlEngine.trainModel(this.modelName, trainingData, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
    });

    console.log(`[PredictiveMaintenance] Model trained: accuracy=${result.accuracy.toFixed(2)}`);
  }

  /**
   * Gather training data from historical maintenance records
   */
  private async gatherTrainingData(): Promise<TrainingData> {
    const features: number[][] = [];
    const labels: number[] = [];

    // Get all maintenance tasks with outcomes
    const result = await this.db.executeSql(
      `SELECT 
        t.*,
        b.age_years,
        b.square_footage,
        b.unit_count,
        b.compliance_score,
        COUNT(DISTINCT t2.id) as recent_task_count,
        AVG(t2.completion_time) as avg_completion_time
       FROM tasks t
       JOIN buildings b ON t.building_id = b.id
       LEFT JOIN tasks t2 ON t2.building_id = b.id 
         AND t2.completed_at BETWEEN t.completed_at - 2592000000 AND t.completed_at
       WHERE t.status = 'completed' 
         AND t.task_type = 'maintenance'
         AND t.completed_at IS NOT NULL
       GROUP BY t.id
       ORDER BY t.completed_at DESC
       LIMIT 1000`,
      []
    );

    for (let i = 0; i < result.rows.length; i++) {
      const task = result.rows.item(i);

      // Extract features
      const featureVector = [
        task.age_years || 0,                    // Building age
        task.square_footage / 10000 || 0,       // Building size (normalized)
        task.unit_count || 0,                   // Unit count
        task.compliance_score || 100,           // Compliance score
        task.recent_task_count || 0,            // Recent maintenance frequency
        task.avg_completion_time / 3600 || 0,   // Avg time (hours)
        this.getSeasonFactor(task.completed_at), // Seasonal factor
        task.priority === 'urgent' ? 1 : 0,     // Was urgent?
      ];

      features.push(featureVector);

      // Label: Days until next maintenance
      const label = await this.getDaysUntilNextMaintenance(
        task.building_id,
        task.completed_at
      );
      labels.push(label);
    }

    return { features, labels };
  }

  /**
   * Get seasonal factor (0-1)
   */
  private getSeasonFactor(timestamp: number): number {
    const month = new Date(timestamp).getMonth();
    // Winter months (Dec-Feb) = higher maintenance factor
    if (month === 11 || month === 0 || month === 1) return 1.0;
    // Summer months (Jun-Aug) = moderate factor
    if (month >= 5 && month <= 7) return 0.6;
    // Spring/Fall = lower factor
    return 0.3;
  }

  /**
   * Get days until next maintenance occurred
   */
  private async getDaysUntilNextMaintenance(
    buildingId: string,
    afterTimestamp: number
  ): Promise<number> {
    const result = await this.db.executeSql(
      `SELECT MIN(completed_at) as next_maintenance
       FROM tasks
       WHERE building_id = ?
         AND task_type = 'maintenance'
         AND completed_at > ?`,
      [buildingId, afterTimestamp]
    );

    if (result.rows.length > 0 && result.rows.item(0).next_maintenance) {
      const nextTimestamp = result.rows.item(0).next_maintenance;
      const days = (nextTimestamp - afterTimestamp) / (1000 * 60 * 60 * 24);
      return Math.max(1, days); // Minimum 1 day
    }

    return 365; // Default: 1 year if no next maintenance
  }

  /**
   * Predict maintenance needs for building
   */
  async predictMaintenance(buildingId: string): Promise<MaintenancePrediction> {
    // Get building data
    const buildingData = await this.getBuildingData(buildingId);

    // Prepare features
    const features = [
      buildingData.age_years || 0,
      buildingData.square_footage / 10000 || 0,
      buildingData.unit_count || 0,
      buildingData.compliance_score || 100,
      buildingData.recent_task_count || 0,
      buildingData.avg_completion_time / 3600 || 0,
      this.getSeasonFactor(Date.now()),
      0, // Not currently urgent
    ];

    // Make prediction
    const prediction = await this.mlEngine.predict(this.modelName, features);

    // Interpret prediction
    const estimatedDays = Math.round(prediction.value * 365); // Convert to days
    const likelihood = Math.min(1, Math.max(0, 1 - estimatedDays / 365));

    // Get recommended actions
    const recommendedActions = this.getRecommendedActions(buildingData, estimatedDays, prediction.factors);

    // Get historical patterns
    const historicalPatterns = await this.getHistoricalPatterns(buildingId);

    return {
      buildingId,
      buildingName: buildingData.name,
      predictedIssue: this.getPredictedIssue(buildingData, prediction.factors),
      likelihood,
      estimatedDays,
      recommendedActions,
      factors: prediction.factors,
      historicalPatterns,
    };
  }

  /**
   * Get building data for prediction
   */
  private async getBuildingData(buildingId: string): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT 
        b.*,
        COUNT(DISTINCT t.id) as recent_task_count,
        AVG(t.completion_time) as avg_completion_time
       FROM buildings b
       LEFT JOIN tasks t ON t.building_id = b.id 
         AND t.completed_at > ?
       WHERE b.id = ?
       GROUP BY b.id`,
      [Date.now() - 2592000000, buildingId] // 30 days
    );

    return result.rows.item(0);
  }

  /**
   * Get predicted issue type
   */
  private getPredictedIssue(buildingData: any, factors: any[]): string {
    // Logic based on building characteristics
    if (buildingData.age_years > 50) {
      return 'Plumbing System Maintenance';
    }
    if (factors[0]?.name.includes('compliance')) {
      return 'Compliance-Related Maintenance';
    }
    return 'General Maintenance';
  }

  /**
   * Get recommended actions
   */
  private getRecommendedActions(
    buildingData: any,
    estimatedDays: number,
    factors: any[]
  ): string[] {
    const actions: string[] = [];

    if (estimatedDays < 30) {
      actions.push('Schedule preventive maintenance within 2 weeks');
      actions.push('Inspect high-priority systems');
    }

    if (buildingData.compliance_score < 80) {
      actions.push('Address compliance issues to prevent forced maintenance');
    }

    if (buildingData.age_years > 40) {
      actions.push('Consider system upgrades to reduce maintenance frequency');
    }

    actions.push('Monitor building closely for early warning signs');
    actions.push('Budget for maintenance in next financial period');

    return actions;
  }

  /**
   * Get historical maintenance patterns
   */
  private async getHistoricalPatterns(buildingId: string): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT 
        task_type,
        COUNT(*) as count,
        AVG(completion_time) as avg_time,
        AVG(julianday(completed_at) - julianday(created_at)) as avg_response_days
       FROM tasks
       WHERE building_id = ?
         AND status = 'completed'
         AND completed_at > ?
       GROUP BY task_type`,
      [buildingId, Date.now() - 31536000000] // 1 year
    );

    const patterns: any = {};
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      patterns[row.task_type] = {
        frequency: row.count,
        avgTimeHours: row.avg_time / 3600,
        avgResponseDays: row.avg_response_days,
      };
    }

    return patterns;
  }

  /**
   * Get predictions for all buildings
   */
  async predictAllBuildings(): Promise<MaintenancePrediction[]> {
    const buildings = await this.db.executeSql(
      `SELECT id FROM buildings WHERE active = 1`,
      []
    );

    const predictions: MaintenancePrediction[] = [];
    for (let i = 0; i < buildings.rows.length; i++) {
      const building = buildings.rows.item(i);
      try {
        const prediction = await this.predictMaintenance(building.id);
        predictions.push(prediction);
      } catch (error) {
        console.error(`[PredictiveMaintenance] Failed for building ${building.id}:`, error);
      }
    }

    // Sort by likelihood (highest risk first)
    predictions.sort((a, b) => b.likelihood - a.likelihood);

    return predictions;
  }

  /**
   * Retrain model with new data (call periodically)
   */
  async retrainModel(): Promise<void> {
    console.log('[PredictiveMaintenance] Retraining model with updated data...');
    await this.trainModel();
  }
}
