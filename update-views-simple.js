const fs = require('fs');

// Real violation data from our investigation
const realViolationData = {
  '1': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '3': { hpd: 0, dob: 1, dsny: 0, outstanding: 0, score: 100 },
  '4': { hpd: 4, dob: 71, dsny: 50, outstanding: 1027, score: 75 },
  '5': { hpd: 0, dob: 1, dsny: 0, outstanding: 0, score: 100 },
  '6': { hpd: 0, dob: 61, dsny: 22, outstanding: 2100, score: 45 },
  '7': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '8': { hpd: 0, dob: 0, dsny: 50, outstanding: 0, score: 100 },
  '9': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '10': { hpd: 0, dob: 76, dsny: 14, outstanding: 2550, score: 70 },
  '11': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '13': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '14': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '15': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '16': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '17': { hpd: 0, dob: 3, dsny: 14, outstanding: 14687, score: 30 },
  '18': { hpd: 0, dob: 0, dsny: 23, outstanding: 1825, score: 60 },
  '19': { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 },
  '21': { hpd: 0, dob: 0, dsny: 50, outstanding: 2425, score: 50 }
};

function updateBuildingDetailScreen() {
  console.log('🔄 Updating BuildingDetailScreen compliance tab...');
  
  const filePath = '/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/src/screens/BuildingDetailScreen.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Add real violation data at the top
  const dataImport = `// Real violation data from NYC APIs
const realViolationData = ${JSON.stringify(realViolationData, null, 2)};

`;
  
  // Insert after imports
  content = content.replace(
    /(import.*?;\s*)/s,
    `$1${dataImport}`
  );
  
  // Replace the hardcoded compliance categories
  const oldCompliance = `{['HPD', 'DOB', 'FDNY', 'LL97', 'LL11', 'DEP'].map((category) => (
            <View key={category} style={styles.complianceCard}>
              <Text style={styles.complianceCategory}>{category}</Text>
              <View style={[styles.complianceStatus, { backgroundColor: '#10b981' }]}>
                <Text style={styles.complianceStatusText}>COMPLIANT</Text>
              </View>
              <Text style={styles.complianceDetails}>No violations</Text>
            </View>
          ))}`;
  
  const newCompliance = `{(() => {
            const buildingId = buildingDetails.id;
            const data = realViolationData[buildingId] || { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 };
            
            const getStatus = (count, outstanding = 0) => {
              if (count === 0 && outstanding === 0) return { text: 'COMPLIANT', color: '#10b981' };
              if (outstanding > 1000) return { text: 'CRITICAL', color: '#ef4444' };
              if (count > 0) return { text: 'VIOLATIONS', color: '#f59e0b' };
              return { text: 'COMPLIANT', color: '#10b981' };
            };
            
            return [
              { key: 'HPD', label: 'HPD', count: data.hpd, outstanding: 0 },
              { key: 'DOB', label: 'DOB', count: data.dob, outstanding: 0 },
              { key: 'DSNY', label: 'DSNY', count: data.dsny, outstanding: data.outstanding }
            ].map((category) => {
              const status = getStatus(category.count, category.outstanding);
              return (
                <View key={category.key} style={styles.complianceCard}>
                  <Text style={styles.complianceCategory}>{category.label}</Text>
                  <View style={[styles.complianceStatus, { backgroundColor: status.color }]}>
                    <Text style={styles.complianceStatusText}>{status.text}</Text>
                  </View>
                  <Text style={styles.complianceDetails}>
                    {category.count} {category.count === 1 ? 'violation' : 'violations'}
                    {category.outstanding > 0 && ' • $' + category.outstanding.toLocaleString() + ' outstanding'}
                  </Text>
                </View>
              );
            });
          })()}`;
  
  content = content.replace(oldCompliance, newCompliance);
  
  // Update compliance status
  content = content.replace(
    /buildingDetails\.complianceStatus/g,
    'realViolationData[buildingDetails.id]?.score >= 90 ? "excellent" : realViolationData[buildingDetails.id]?.score >= 70 ? "good" : realViolationData[buildingDetails.id]?.score >= 50 ? "warning" : "critical"'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ BuildingDetailScreen updated');
}

function createViolationService() {
  console.log('🔄 Creating ViolationDataService...');
  
  const serviceContent = `/**
 * 🏛️ Violation Data Service
 * Real violation data from NYC APIs
 */

export const realViolationData = ${JSON.stringify(realViolationData, null, 2)};

export class ViolationDataService {
  static getViolationData(buildingId: string) {
    return realViolationData[buildingId] || { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 };
  }

  static getComplianceStatus(score: number) {
    if (score >= 90) return { status: 'EXCELLENT', color: '#10b981' };
    if (score >= 70) return { status: 'GOOD', color: '#f59e0b' };
    if (score >= 50) return { status: 'WARNING', color: '#f97316' };
    return { status: 'CRITICAL', color: '#ef4444' };
  }

  static getCriticalBuildings() {
    return Object.entries(realViolationData)
      .filter(([_, data]) => data.outstanding > 1000 || data.score < 70)
      .map(([id, data]) => ({ id, outstanding: data.outstanding, score: data.score }));
  }
}
`;

  const servicePath = '/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/src/services/ViolationDataService.ts';
  fs.writeFileSync(servicePath, serviceContent);
  console.log('✅ ViolationDataService created');
}

function main() {
  console.log('🚀 UPDATING MOBILE VIEWS WITH REAL VIOLATION DATA');
  console.log('================================================');
  
  try {
    updateBuildingDetailScreen();
    createViolationService();
    
    console.log('\n✅ MOBILE VIEWS UPDATED SUCCESSFULLY');
    console.log('====================================');
    console.log('📱 BuildingDetailScreen: Real violation data integrated');
    console.log('🏛️ ViolationDataService: Created for data management');
    console.log('\n🎯 CRITICAL BUILDINGS IDENTIFIED:');
    
    const criticalBuildings = Object.entries(realViolationData)
      .filter(([_, data]) => data.outstanding > 1000 || data.score < 70)
      .map(([id, data]) => ({ id, outstanding: data.outstanding, score: data.score }));
    
    criticalBuildings.forEach(building => {
      console.log(`   Building ${building.id}: $${building.outstanding.toLocaleString()} outstanding, Score: ${building.score}/100`);
    });
    
    console.log('\n📱 NEXT STEPS:');
    console.log('1. Test the mobile app with real violation data');
    console.log('2. Verify compliance tabs show correct information');
    console.log('3. Check critical alerts for buildings with outstanding fines');
    
  } catch (error) {
    console.error('❌ Error updating mobile views:', error);
  }
}

main();
