/**
 * 🏢 Property Value Service
 * Purpose: Integrate DOF API data to enhance buildings.json with market and assessed values
 * Features: Fetch property values, update building data, cache results
 */

import { DOFAPIClient, DOFPropertyAssessment, DOFPropertySummary } from '../nyc/DOFAPIClient';
import { NYCAPIService } from '../nyc/NYCAPIService';

export interface BuildingPropertyValue {
  id: string;
  name: string;
  address: string;
  marketValue?: number;
  assessedValue?: number;
  taxableValue?: number;
  taxClass?: string;
  propertyType?: string;
  lastAssessmentDate?: Date;
  assessmentYear?: number;
  exemptions?: number;
  currentTaxOwed?: number;
  assessmentTrend?: string;
  lastUpdated: Date;
}

export interface PropertyValueUpdateResult {
  success: boolean;
  updatedBuildings: number;
  failedBuildings: string[];
  errors: string[];
  totalMarketValue: number;
  totalAssessedValue: number;
}

export class PropertyValueService {
  private dofClient: DOFAPIClient;
  private cache: Map<string, { data: BuildingPropertyValue; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (assessments change annually)

  constructor() {
    this.dofClient = new DOFAPIClient(new NYCAPIService());
  }

  /**
   * Get property values for a single building
   */
  async getBuildingPropertyValue(buildingId: string): Promise<BuildingPropertyValue | null> {
    const cacheKey = `property_value_${buildingId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const assessment = await this.dofClient.getPropertyAssessment(buildingId);
      const summary = await this.dofClient.getPropertySummary(buildingId);
      
      const propertyValue: BuildingPropertyValue = {
        id: buildingId,
        name: assessment.propertyAddress,
        address: assessment.propertyAddress,
        marketValue: assessment.marketValue,
        assessedValue: assessment.assessedValue,
        taxableValue: assessment.taxableValue,
        taxClass: assessment.taxClass,
        propertyType: assessment.propertyType,
        lastAssessmentDate: new Date(assessment.assessmentYear, 0, 1),
        assessmentYear: assessment.assessmentYear,
        exemptions: assessment.exemptionAmount,
        currentTaxOwed: summary.currentTaxOwed,
        assessmentTrend: summary.assessmentTrend,
        lastUpdated: new Date(),
      };

      this.cache.set(cacheKey, {
        data: propertyValue,
        timestamp: Date.now(),
      });

      return propertyValue;
    } catch (error) {
      console.error(`Failed to fetch property value for building ${buildingId}:`, error);
      return null;
    }
  }

  /**
   * Get property values for multiple buildings
   */
  async getBuildingsPropertyValues(buildingIds: string[]): Promise<BuildingPropertyValue[]> {
    const results = await Promise.allSettled(
      buildingIds.map(id => this.getBuildingPropertyValue(id))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<BuildingPropertyValue> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  /**
   * Update buildings.json with property values
   */
  async updateBuildingsWithPropertyValues(buildingsData: any[]): Promise<PropertyValueUpdateResult> {
    const result: PropertyValueUpdateResult = {
      success: true,
      updatedBuildings: 0,
      failedBuildings: [],
      errors: [],
      totalMarketValue: 0,
      totalAssessedValue: 0,
    };

    console.log(`🏢 Starting property value update for ${buildingsData.length} buildings...`);

    for (const building of buildingsData) {
      try {
        const propertyValue = await this.getBuildingPropertyValue(building.id);
        
        if (propertyValue) {
          // Update building with property value data
          building.marketValue = propertyValue.marketValue;
          building.assessedValue = propertyValue.assessedValue;
          building.taxableValue = propertyValue.taxableValue;
          building.taxClass = propertyValue.taxClass;
          building.propertyType = propertyValue.propertyType;
          building.lastAssessmentDate = propertyValue.lastAssessmentDate?.toISOString();
          building.assessmentYear = propertyValue.assessmentYear;
          building.exemptions = propertyValue.exemptions;
          building.currentTaxOwed = propertyValue.currentTaxOwed;
          building.assessmentTrend = propertyValue.assessmentTrend;
          building.propertyValueLastUpdated = propertyValue.lastUpdated.toISOString();

          result.updatedBuildings++;
          result.totalMarketValue += propertyValue.marketValue || 0;
          result.totalAssessedValue += propertyValue.assessedValue || 0;

          console.log(`✅ Updated building ${building.id} (${building.name}) - Market: $${propertyValue.marketValue?.toLocaleString()}, Assessed: $${propertyValue.assessedValue?.toLocaleString()}`);
        } else {
          result.failedBuildings.push(building.id);
          result.errors.push(`Failed to fetch property value for building ${building.id}`);
          console.log(`❌ Failed to update building ${building.id} (${building.name})`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        result.failedBuildings.push(building.id);
        result.errors.push(`Error updating building ${building.id}: ${error}`);
        console.error(`Error updating building ${building.id}:`, error);
      }
    }

    result.success = result.failedBuildings.length === 0;
    
    console.log(`📊 Property value update complete:`);
    console.log(`   ✅ Updated: ${result.updatedBuildings} buildings`);
    console.log(`   ❌ Failed: ${result.failedBuildings.length} buildings`);
    console.log(`   💰 Total Market Value: $${result.totalMarketValue.toLocaleString()}`);
    console.log(`   💰 Total Assessed Value: $${result.totalAssessedValue.toLocaleString()}`);

    return result;
  }

  /**
   * Generate property value summary for analytics
   */
  async getPropertyValueAnalytics(buildingsData: any[]): Promise<{
    totalBuildings: number;
    buildingsWithValues: number;
    totalMarketValue: number;
    totalAssessedValue: number;
    averageMarketValue: number;
    averageAssessedValue: number;
    propertiesByTaxClass: Record<string, number>;
    propertiesByType: Record<string, number>;
    assessmentTrends: Record<string, number>;
    topValuableProperties: Array<{
      id: string;
      name: string;
      marketValue: number;
      assessedValue: number;
    }>;
  }> {
    const buildingsWithValues = buildingsData.filter(b => b.marketValue && b.assessedValue);
    
    const totalMarketValue = buildingsWithValues.reduce((sum, b) => sum + (b.marketValue || 0), 0);
    const totalAssessedValue = buildingsWithValues.reduce((sum, b) => sum + (b.assessedValue || 0), 0);
    
    const propertiesByTaxClass: Record<string, number> = {};
    const propertiesByType: Record<string, number> = {};
    const assessmentTrends: Record<string, number> = {};

    buildingsWithValues.forEach(building => {
      // Count by tax class
      if (building.taxClass) {
        propertiesByTaxClass[building.taxClass] = (propertiesByTaxClass[building.taxClass] || 0) + 1;
      }
      
      // Count by property type
      if (building.propertyType) {
        propertiesByType[building.propertyType] = (propertiesByType[building.propertyType] || 0) + 1;
      }
      
      // Count by assessment trend
      if (building.assessmentTrend) {
        assessmentTrends[building.assessmentTrend] = (assessmentTrends[building.assessmentTrend] || 0) + 1;
      }
    });

    // Get top valuable properties
    const topValuableProperties = buildingsWithValues
      .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
      .slice(0, 10)
      .map(building => ({
        id: building.id,
        name: building.name,
        marketValue: building.marketValue || 0,
        assessedValue: building.assessedValue || 0,
      }));

    return {
      totalBuildings: buildingsData.length,
      buildingsWithValues: buildingsWithValues.length,
      totalMarketValue,
      totalAssessedValue,
      averageMarketValue: buildingsWithValues.length > 0 ? totalMarketValue / buildingsWithValues.length : 0,
      averageAssessedValue: buildingsWithValues.length > 0 ? totalAssessedValue / buildingsWithValues.length : 0,
      propertiesByTaxClass,
      propertiesByType,
      assessmentTrends,
      topValuableProperties,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Property value cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const propertyValueService = new PropertyValueService();
