#!/usr/bin/env ts-node

/**
 * 🏢 Property Values Update Script
 * Purpose: Update buildings.json with market and assessed values from DOF API
 * Usage: npm run update-property-values
 */

import * as fs from 'fs';
import * as path from 'path';
import { PropertyValueService } from '../../api-clients/src/property/PropertyValueService';

const BUILDINGS_FILE_PATH = path.join(__dirname, '../src/buildings.json');
const BACKUP_FILE_PATH = path.join(__dirname, '../src/buildings.backup.json');

async function updatePropertyValues() {
  console.log('🏢 Starting Property Values Update...');
  console.log('=====================================');

  try {
    // Read current buildings data
    console.log('📖 Reading buildings.json...');
    const buildingsData = JSON.parse(fs.readFileSync(BUILDINGS_FILE_PATH, 'utf8'));
    console.log(`   Found ${buildingsData.length} buildings`);

    // Create backup
    console.log('💾 Creating backup...');
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(buildingsData, null, 2));
    console.log(`   Backup saved to: ${BACKUP_FILE_PATH}`);

    // Initialize property value service
    const propertyValueService = new PropertyValueService();

    // Update buildings with property values
    console.log('🔄 Updating buildings with property values...');
    const updateResult = await propertyValueService.updateBuildingsWithPropertyValues(buildingsData);

    // Save updated buildings data
    console.log('💾 Saving updated buildings.json...');
    fs.writeFileSync(BUILDINGS_FILE_PATH, JSON.stringify(buildingsData, null, 2));
    console.log(`   Updated file saved to: ${BUILDINGS_FILE_PATH}`);

    // Generate analytics
    console.log('📊 Generating property value analytics...');
    const analytics = await propertyValueService.getPropertyValueAnalytics(buildingsData);

    // Display results
    console.log('\n🎉 Property Values Update Complete!');
    console.log('=====================================');
    console.log(`✅ Successfully updated: ${updateResult.updatedBuildings} buildings`);
    console.log(`❌ Failed to update: ${updateResult.failedBuildings.length} buildings`);
    console.log(`💰 Total Market Value: $${updateResult.totalMarketValue.toLocaleString()}`);
    console.log(`💰 Total Assessed Value: $${updateResult.totalAssessedValue.toLocaleString()}`);
    
    console.log('\n📈 Property Value Analytics:');
    console.log(`   Total Buildings: ${analytics.totalBuildings}`);
    console.log(`   Buildings with Values: ${analytics.buildingsWithValues}`);
    console.log(`   Average Market Value: $${Math.round(analytics.averageMarketValue).toLocaleString()}`);
    console.log(`   Average Assessed Value: $${Math.round(analytics.averageAssessedValue).toLocaleString()}`);

    console.log('\n🏷️ Properties by Tax Class:');
    Object.entries(analytics.propertiesByTaxClass).forEach(([taxClass, count]) => {
      console.log(`   ${taxClass}: ${count} properties`);
    });

    console.log('\n🏢 Properties by Type:');
    Object.entries(analytics.propertiesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} properties`);
    });

    console.log('\n📊 Assessment Trends:');
    Object.entries(analytics.assessmentTrends).forEach(([trend, count]) => {
      console.log(`   ${trend}: ${count} properties`);
    });

    console.log('\n💎 Top 5 Most Valuable Properties:');
    analytics.topValuableProperties.slice(0, 5).forEach((property, index) => {
      console.log(`   ${index + 1}. ${property.name}`);
      console.log(`      Market Value: $${property.marketValue.toLocaleString()}`);
      console.log(`      Assessed Value: $${property.assessedValue.toLocaleString()}`);
    });

    if (updateResult.failedBuildings.length > 0) {
      console.log('\n⚠️ Failed Buildings:');
      updateResult.failedBuildings.forEach(buildingId => {
        console.log(`   Building ID: ${buildingId}`);
      });
    }

    console.log('\n✨ Property values have been successfully updated!');
    console.log('   You can now run the app to see the enhanced building data.');

  } catch (error) {
    console.error('❌ Error updating property values:', error);
    
    // Restore backup if update failed
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      console.log('🔄 Restoring backup...');
      const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE_PATH, 'utf8'));
      fs.writeFileSync(BUILDINGS_FILE_PATH, JSON.stringify(backupData, null, 2));
      console.log('   Backup restored successfully');
    }
    
    process.exit(1);
  }
}

// Run the update
if (require.main === module) {
  updatePropertyValues().catch(console.error);
}

export { updatePropertyValues };
