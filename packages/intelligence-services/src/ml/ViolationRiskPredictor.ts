/**
 * @cyntientops/intelligence-services
 * 
 * Violation Risk Predictor
 * Purpose: ML-powered violation risk prediction for compliance management
 * Features: Risk scoring, preventive actions, historical context analysis
 */

import { MLEngine, TrainingData } from './MLEngine';
import { Logger } from '@cyntientops/business-core';

export interface ViolationRisk {
  buildingId: string;
  buildingName: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violationType: 'HPD' | 'DOB' | 'FDNY' | 'DEP' | 'LL97' | 'LL11';
  predictedViolation: string;
  likelihood: number; // 0-1
  timeframe: number; // Days until predicted
  preventiveActions: string[];
  riskFactors: Array<{ factor: string; impact: number }>;
  historicalContext: any;
}

export class ViolationRiskPredictor {
  private db: any; // DatabaseManager
  private mlEngine: MLEngine;
  private modelName = 'violation_risk_prediction';

  constructor(db: any) {
    this.db = db;
    this.mlEngine = new MLEngine(db);
  }

  async initialize(): Promise<void> {
    await this.mlEngine.initialize();

    if (!this.mlEngine.hasModel(this.modelName)) {
      await this.trainModel();
    }
  }

  /**
   * Train violation risk prediction model
   */
  async trainModel(): Promise<void> {
    Logger.info('[ViolationRiskPredictor] Gathering training data...');

    const trainingData = await this.gatherTrainingData();

    if (trainingData.features.length < 50) {
      Logger.warn('[ViolationRiskPredictor] Insufficient data, using default model', null, 'ViolationRiskPredictor');
      return;
    }

    Logger.info(`[ViolationRiskPredictor] Training with ${trainingData.features.length} samples`);

    await this.mlEngine.trainModel(this.modelName, trainingData, {
      epochs: 150,
      batchSize: 16,
      validationSplit: 0.25,
    });
  }

  /**
   * Gather training data from historical violations
   */
  private async gatherTrainingData(): Promise<TrainingData> {
    const features: number[][] = [];
    const labels: number[] = [];

    // Get compliance history
    const result = await this.db.executeSql(
      `SELECT 
        c.*,
        b.age_years,
        b.square_footage,
        b.unit_count,
        b.compliance_score,
        COUNT(DISTINCT c2.id) as historical_violation_count,
        MAX(c2.resolved_at) as last_violation_resolved
       FROM compliance c
       JOIN buildings b ON c.building_id = b.id
       LEFT JOIN compliance c2 ON c2.building_id = b.id 
         AND c2.created_at < c.created_at
         AND c2.violation_type = c.violation_type
       WHERE c.created_at > ?
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT 500`,
      [Date.now() - 63072000000] // 2 years
    );

    for (let i = 0; i < result.rows.length; i++) {
      const record = result.rows.item(i);

      // Extract features
      const daysSinceLastViolation = record.last_violation_resolved
        ? (record.created_at - record.last_violation_resolved) / (1000 * 60 * 60 * 24)
        : 9999;

      const featureVector = [
        record.age_years || 0,                        // Building age
        record.square_footage / 10000 || 0,           // Building size (normalized)
        record.unit_count || 0,                       // Unit count
        record.compliance_score || 100,               // Current compliance score
        record.historical_violation_count || 0,       // Past violations
        Math.min(daysSinceLastViolation, 365) / 365,  // Time since last (normalized)
        this.getViolationTypeFactor(record.violation_type), // Violation type
        this.getSeasonFactor(record.created_at),      // Season
        record.severity === 'critical' ? 1 : 0,       // Was critical?
        record.resolved_at ? 1 : 0,                   // Was resolved?
      ];

      features.push(featureVector);

      // Label: 1 if violation occurred, 0 if not
      labels.push(1); // This record IS a violation

      // Add "no violation" samples for balance (deterministic approach)
      if (i % 2 === 0) { // Every other sample gets a "no violation" counterpart
        // Create synthetic "no violation" sample
        const noViolationFeatures = [...featureVector];
        noViolationFeatures[3] = Math.min(100, featureVector[3] + 20); // Higher compliance
        noViolationFeatures[4] = Math.max(0, featureVector[4] - 1);    // Fewer past violations
        features.push(noViolationFeatures);
        labels.push(0);
      }
    }

    return { features, labels };
  }

  /**
   * Get violation type factor
   */
  private getViolationTypeFactor(violationType: string): number {
    const factors: { [key: string]: number } = {
      HPD: 0.8,     // Most common
      DOB: 0.6,
      FDNY: 0.4,
      DEP: 0.3,
      LL97: 0.5,
      LL11: 0.2,
    };
    return factors[violationType] || 0.5;
  }

  /**
   * Get seasonal factor
   */
  private getSeasonFactor(timestamp: number): number {
    const month = new Date(timestamp).getMonth();
    // Winter: More heating violations
    if (month === 11 || month === 0 || month === 1) return 1.0;
    // Summer: More cooling/water violations
    if (month >= 5 && month <= 7) return 0.8;
    return 0.5;
  }

  /**
   * Predict violation risk for building
   */
  async predictRisk(buildingId: string): Promise<ViolationRisk[]> {
    const buildingData = await this.getBuildingData(buildingId);
    const risks: ViolationRisk[] = [];

    // Check risk for each violation type
    const violationTypes = ['HPD', 'DOB', 'FDNY', 'DEP', 'LL97', 'LL11'];

    for (const violationType of violationTypes) {
      const risk = await this.predictViolationTypeRisk(
        buildingData,
        violationType
      );

      if (risk.riskScore > 30) { // Only include significant risks
        risks.push(risk);
      }
    }

    // Sort by risk score
    risks.sort((a, b) => b.riskScore - a.riskScore);

    return risks;
  }

  /**
   * Predict risk for specific violation type
   */
  private async predictViolationTypeRisk(
    buildingData: any,
    violationType: string
  ): Promise<ViolationRisk> {
    // Get historical violations of this type
    const historicalCount = await this.getHistoricalViolationCount(
      buildingData.id,
      violationType
    );

    const lastViolation = await this.getLastViolation(
      buildingData.id,
      violationType
    );

    const daysSinceLastViolation = lastViolation
      ? (Date.now() - lastViolation.resolved_at) / (1000 * 60 * 60 * 24)
      : 9999;

    // Prepare features
    const features = [
      buildingData.age_years || 0,
      buildingData.square_footage / 10000 || 0,
      buildingData.unit_count || 0,
      buildingData.compliance_score || 100,
      historicalCount,
      Math.min(daysSinceLastViolation, 365) / 365,
      this.getViolationTypeFactor(violationType),
      this.getSeasonFactor(Date.now()),
      0, // Not currently critical
      1, // Assume resolved
    ];

    // Make prediction
    const prediction = await this.mlEngine.predict(this.modelName, features);

    // Convert to risk score (0-100)
    const riskScore = Math.round(prediction.value * 100);
    const likelihood = prediction.confidence * prediction.value;

    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore);

    // Get preventive actions
    const preventiveActions = this.getPreventiveActions(
      violationType,
      riskScore,
      buildingData
    );

    // Get risk factors
    const riskFactors = this.interpretRiskFactors(
      prediction.factors,
      features,
      violationType
    );

    // Get historical context
    const historicalContext = await this.getHistoricalContext(
      buildingData.id,
      violationType
    );

    return {
      buildingId: buildingData.id,
      buildingName: buildingData.name,
      riskScore,
      riskLevel,
      violationType: violationType as any,
      predictedViolation: this.getPredictedViolation(violationType, riskScore),
      likelihood,
      timeframe: this.estimateTimeframe(riskScore, daysSinceLastViolation),
      preventiveActions,
      riskFactors,
      historicalContext,
    };
  }

  /**
   * Get historical violation count
   */
  private async getHistoricalViolationCount(
    buildingId: string,
    violationType: string
  ): Promise<number> {
    const result = await this.db.executeSql(
      `SELECT COUNT(*) as count
       FROM compliance
       WHERE building_id = ? AND violation_type = ?`,
      [buildingId, violationType]
    );

    return result.rows.item(0).count;
  }

  /**
   * Get last violation
   */
  private async getLastViolation(
    buildingId: string,
    violationType: string
  ): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT *
       FROM compliance
       WHERE building_id = ? AND violation_type = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [buildingId, violationType]
    );

    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  /**
   * Get building data
   */
  private async getBuildingData(buildingId: string): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT * FROM buildings WHERE id = ?`,
      [buildingId]
    );

    return result.rows.item(0);
  }

  /**
   * Get risk level
   */
  private getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get predicted violation
   */
  private getPredictedViolation(violationType: string, riskScore: number): string {
    const predictions: { [key: string]: { [key: number]: string } } = {
      HPD: {
        80: 'Class C Immediate Hazard Violation',
        60: 'Class B Hazardous Violation',
        40: 'Class A Non-Hazardous Violation',
      },
      DOB: {
        80: 'Stop Work Order',
        60: 'Major Safety Violation',
        40: 'Minor Code Violation',
      },
      FDNY: {
        80: 'Fire Safety System Failure',
        60: 'Fire Code Violation',
        40: 'Inspection Deficiency',
      },
      DEP: {
        80: 'Water Quality Violation',
        60: 'Backflow Prevention Failure',
        40: 'Plumbing Code Violation',
      },
      LL97: {
        80: 'Carbon Emissions Limit Exceeded',
        60: 'Emissions Trending Above Limit',
        40: 'Emissions Monitoring Issue',
      },
      LL11: {
        80: 'Facade Critical Condition',
        60: 'Facade Unsafe Condition',
        40: 'Facade Inspection Required',
      },
    };

    const typePredictions = predictions[violationType] || {};

    if (riskScore >= 80) return typePredictions[80] || 'Critical Violation';
    if (riskScore >= 60) return typePredictions[60] || 'Serious Violation';
    if (riskScore >= 40) return typePredictions[40] || 'Minor Violation';
    return 'Administrative Issue';
  }

  /**
   * Get preventive actions
   */
  private getPreventiveActions(
    violationType: string,
    riskScore: number,
    _buildingData: any
  ): string[] {
    const actions: string[] = [];

    const actionsByType: { [key: string]: string[] } = {
      HPD: [
        'Schedule preventive maintenance for high-risk systems',
        'Conduct tenant apartment inspections',
        'Address outstanding repair requests promptly',
        'Review heating/hot water system performance',
      ],
      DOB: [
        'Ensure all permits are current and posted',
        'Inspect construction safety measures',
        'Update building systems documentation',
        'Schedule facade inspection if approaching deadline',
      ],
      FDNY: [
        'Test fire alarm and sprinkler systems',
        'Inspect fire extinguishers and emergency lighting',
        'Clear fire exits and access routes',
        'Update fire safety plan',
      ],
      DEP: [
        'Test backflow prevention devices',
        'Inspect water supply systems',
        'Monitor water usage patterns',
        'Address any plumbing leaks immediately',
      ],
      LL97: [
        'Conduct energy audit',
        'Implement energy efficiency upgrades',
        'Monitor carbon emissions monthly',
        'Develop emissions reduction plan',
      ],
      LL11: [
        'Schedule facade inspection',
        'Address visible facade deterioration',
        'Review architect/engineer reports',
        'Budget for facade repairs',
      ],
    };

    const baseActions = actionsByType[violationType] || [];

    if (riskScore >= 80) {
      actions.push(`⚠️ URGENT: Take immediate action to prevent ${violationType} violation`);
    }

    actions.push(...baseActions.slice(0, riskScore >= 60 ? 4 : 2));

    return actions;
  }

  /**
   * Interpret risk factors
   */
  private interpretRiskFactors(
    factors: Array<{ name: string; importance: number }>,
    _features: number[],
    _violationType: string
  ): Array<{ factor: string; impact: number }> {
    const featureNames = [
      'Building Age',
      'Building Size',
      'Unit Count',
      'Compliance Score',
      'Historical Violations',
      'Time Since Last Violation',
      'Violation Type Pattern',
      'Seasonal Factors',
      'Critical History',
      'Resolution History',
    ];

    return factors.slice(0, 5).map((factor, i) => ({
      factor: featureNames[i] || factor.name,
      impact: Math.round(factor.importance * 100),
    }));
  }

  /**
   * Estimate timeframe
   */
  private estimateTimeframe(riskScore: number, _daysSinceLastViolation: number): number {
    // Higher risk = sooner violation expected
    if (riskScore >= 80) return 30;  // Within 1 month
    if (riskScore >= 60) return 90;  // Within 3 months
    if (riskScore >= 40) return 180; // Within 6 months
    return 365; // Within 1 year
  }

  /**
   * Get historical context
   */
  private async getHistoricalContext(
    buildingId: string,
    violationType: string
  ): Promise<any> {
    const result = await this.db.executeSql(
      `SELECT 
        COUNT(*) as total_violations,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        AVG(CASE WHEN resolved_at IS NOT NULL 
          THEN (resolved_at - created_at) / 86400000.0 
          ELSE NULL END) as avg_resolution_days
       FROM compliance
       WHERE building_id = ? AND violation_type = ?`,
      [buildingId, violationType]
    );

    return result.rows.item(0);
  }

  /**
   * Get risk summary for all buildings
   */
  async getRiskSummary(): Promise<{
    totalBuildings: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    topRisks: ViolationRisk[];
  }> {
    const buildings = await this.db.executeSql(
      `SELECT id FROM buildings WHERE active = 1`,
      []
    );

    let criticalRisk = 0;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    const allRisks: ViolationRisk[] = [];

    for (let i = 0; i < buildings.rows.length; i++) {
      const building = buildings.rows.item(i);
      const risks = await this.predictRisk(building.id);

      for (const risk of risks) {
        allRisks.push(risk);

        if (risk.riskLevel === 'critical') criticalRisk++;
        else if (risk.riskLevel === 'high') highRisk++;
        else if (risk.riskLevel === 'medium') mediumRisk++;
        else lowRisk++;
      }
    }

    // Get top 10 risks
    const topRisks = allRisks
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      totalBuildings: buildings.rows.length,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      topRisks,
    };
  }
}
