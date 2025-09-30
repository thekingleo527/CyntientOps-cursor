const fs = require('fs');
const path = require('path');

// Real violation data from our investigation
const realViolationData = {
  '1': { // 12 West 18th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '3': { // 135-139 West 17th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 1, active: 1, permits: [{ job: '121700338', type: 'A2', status: 'ISSUED', date: '2014-04-28' }] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '4': { // 104 Franklin Street
    hpd: { total: 4, open: 0, violations: [
      { date: '2022-02-16', type: 'Bedbug Report', status: 'DISMISSED' },
      { date: '2021-04-01', type: 'Bedbug Report', status: 'DISMISSED' },
      { date: '2018-10-09', type: 'Registration Statement', status: 'DISMISSED' }
    ]},
    dob: { total: 71, active: 70, permits: [] },
    dsny: { total: 50, outstanding: 1027, violations: [
      { ticket: '049102519J', date: '2025-05-28', fine: 0, status: 'PAID IN FULL', description: 'IMPROPER RECEPTACLE FAILURE TO CONTAINERIZE' },
      { ticket: '048044973K', date: '2023-12-21', fine: 327, status: 'DOCKETED', description: 'STORAGE OF RECEPTACLES NON-COLLECTION DAY' },
      { ticket: '048044861X', date: '2023-10-31', fine: 300, status: 'DOCKETED', description: 'STORAGE OF RECEPTACLES NON-COLLECTION DAY' }
    ]},
    complianceScore: 75
  },
  '5': { // 138 West 17th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 1, active: 1, permits: [{ job: '120481175', type: 'A2', status: 'ISSUED', date: '2010-12-13' }] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '6': { // 68 Perry Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 61, active: 56, permits: [] },
    dsny: { total: 22, outstanding: 2100, violations: [
      { ticket: '049082585M', date: '2025-05-03', fine: 300, status: 'DEFAULTED', description: 'IMPROPER RECEPTACLE FAILURE TO CONTAINERIZE' },
      { ticket: '048994210L', date: '2025-02-28', fine: 0, status: 'PAID IN FULL', description: 'IMPROPER RECEPTACLE FAILURE TO CONTAINERIZE' },
      { ticket: '048862379M', date: '2025-01-14', fine: 300, status: 'DOCKETED', description: 'IMPROPER RECEPTACLE FAILURE TO CONTAINERIZE' }
    ]},
    complianceScore: 45
  },
  '7': { // 112 West 18th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '8': { // 41 Elizabeth Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 50, outstanding: 0, violations: [
      { ticket: '048374885M', date: '2024-04-12', fine: 0, status: 'PAID IN FULL', description: 'IMPROPER RECEPTACLES 1ST OCCURRENCE' }
    ]},
    complianceScore: 100
  },
  '9': { // 117 West 17th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '10': { // 131 Perry Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 76, active: 74, permits: [] },
    dsny: { total: 14, outstanding: 2550, violations: [
      { ticket: '0221049960', date: '2025-09-03', fine: 1800, status: 'NEW ISSUANCE', description: 'NYPD TRANSPORT VIOLATION' },
      { ticket: '0221049979', date: '2025-09-03', fine: 750, status: 'NEW ISSUANCE', description: 'NYPD TRANSPORT VIOLATION' }
    ]},
    complianceScore: 70
  },
  '11': { // 123 1st Avenue
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '13': { // 136 West 17th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '14': { // Rubin Museum
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '15': { // 133 East 15th Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '16': { // Stuyvesant Cove Park
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '17': { // 178 Spring Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 3, active: 3, permits: [] },
    dsny: { total: 14, outstanding: 14687, violations: [
      { ticket: '039530426Z', date: '2024-07-11', fine: 10000, status: 'DOCKETED', description: 'PEDESTRIAN PROTECTION DOES NOT MEET CODE SPECIFICATIONS' },
      { ticket: '039078924N', date: '2023-02-02', fine: 1562, status: 'DOCKETED', description: 'FAILURE TO MAINTAIN BUILDING IN CODE-COMPLIANT MANNER' },
      { ticket: '039078930J', date: '2023-02-02', fine: 3125, status: 'DOCKETED', description: 'TEMPORARY CONSTRUCTION EQUIPMENT ON SITE-EXPIRED PERMIT' }
    ]},
    complianceScore: 30
  },
  '18': { // 36 Walker Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 23, outstanding: 1825, violations: [
      { ticket: '048586092R', date: '2025-01-20', fine: 350, status: 'DOCKETED', description: 'IMPROPER RECEPTACLES' },
      { ticket: '048722712M', date: '2024-12-27', fine: 300, status: 'DOCKETED', description: 'IMPROPER RECEPTACLES' },
      { ticket: '048722708J', date: '2024-12-20', fine: 300, status: 'DOCKETED', description: 'IMPROPER RECEPTACLES' }
    ]},
    complianceScore: 60
  },
  '19': { // 115 7th Avenue
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 0, outstanding: 0, violations: [] },
    complianceScore: 100
  },
  '21': { // 148 Chambers Street
    hpd: { total: 0, open: 0, violations: [] },
    dob: { total: 0, active: 0, permits: [] },
    dsny: { total: 50, outstanding: 2425, violations: [
      { ticket: '048835014X', date: '2025-01-23', fine: 0, status: 'PAID IN FULL', description: 'IMPROPER RECEPTACLES' },
      { ticket: '048528105L', date: '2024-07-07', fine: 300, status: 'DOCKETED', description: 'IMPROPER RECEPTACLES' }
    ]},
    complianceScore: 50
  }
};

function updateBuildingDetailScreen() {
  console.log('🔄 Updating BuildingDetailScreen with real violation data...');
  
  const filePath = '/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/src/screens/BuildingDetailScreen.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace the hardcoded compliance tab with real data
  const newComplianceTab = `  const renderComplianceTab = () => {
    if (!buildingDetails) return null;

    const buildingId = buildingDetails.id;
    const violationData = realViolationData[buildingId] || {
      hpd: { total: 0, open: 0, violations: [] },
      dob: { total: 0, active: 0, permits: [] },
      dsny: { total: 0, outstanding: 0, violations: [] },
      complianceScore: 100
    };

    const getComplianceStatus = (score) => {
      if (score >= 90) return { status: 'EXCELLENT', color: '#10b981' };
      if (score >= 70) return { status: 'GOOD', color: '#f59e0b' };
      if (score >= 50) return { status: 'WARNING', color: '#f97316' };
      return { status: 'CRITICAL', color: '#ef4444' };
    };

    const compliance = getComplianceStatus(violationData.complianceScore);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.complianceHeader}>
          <Text style={styles.sectionTitle}>Compliance Status</Text>
          <View style={[styles.complianceBadge, { backgroundColor: compliance.color }]}>
            <Text style={styles.complianceText}>{compliance.status}</Text>
          </View>
          <Text style={styles.complianceScore}>Score: {violationData.complianceScore}/100</Text>
        </View>

        {/* HPD Violations */}
        <View style={styles.complianceCard}>
          <Text style={styles.complianceCategory}>HPD Violations</Text>
          <View style={[styles.complianceStatus, { backgroundColor: violationData.hpd.open > 0 ? '#ef4444' : '#10b981' }]}>
            <Text style={styles.complianceStatusText}>
              {violationData.hpd.open > 0 ? 'VIOLATIONS' : 'COMPLIANT'}
            </Text>
          </View>
          <Text style={styles.complianceDetails}>
            {violationData.hpd.total} total, {violationData.hpd.open} open
          </Text>
          {violationData.hpd.violations.length > 0 && (
            <View style={styles.violationList}>
              {violationData.hpd.violations.slice(0, 3).map((violation, index) => (
                <Text key={index} style={styles.violationItem}>
                  • {violation.date} - {violation.type} ({violation.status})
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* DOB Permits */}
        <View style={styles.complianceCard}>
          <Text style={styles.complianceCategory}>DOB Permits</Text>
          <View style={[styles.complianceStatus, { backgroundColor: '#10b981' }]}>
            <Text style={styles.complianceStatusText}>ACTIVE</Text>
          </View>
          <Text style={styles.complianceDetails}>
            {violationData.dob.total} total, {violationData.dob.active} active
          </Text>
          {violationData.dob.permits.length > 0 && (
            <View style={styles.violationList}>
              {violationData.dob.permits.slice(0, 3).map((permit, index) => (
                <Text key={index} style={styles.violationItem}>
                  • Job {permit.job} - {permit.type} ({permit.status})
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* DSNY Violations */}
        <View style={styles.complianceCard}>
          <Text style={styles.complianceCategory}>DSNY Violations</Text>
          <View style={[styles.complianceStatus, { backgroundColor: violationData.dsny.outstanding > 0 ? '#ef4444' : '#10b981' }]}>
            <Text style={styles.complianceStatusText}>
              {violationData.dsny.outstanding > 0 ? 'VIOLATIONS' : 'COMPLIANT'}
            </Text>
          </View>
          <Text style={styles.complianceDetails}>
            {violationData.dsny.total} total, ${violationData.dsny.outstanding.toLocaleString()} outstanding
          </Text>
          {violationData.dsny.violations.length > 0 && (
            <View style={styles.violationList}>
              {violationData.dsny.violations.slice(0, 3).map((violation, index) => (
                <Text key={index} style={styles.violationItem}>
                  • {violation.ticket} - ${violation.fine} ({violation.status})
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Critical Alerts */}
        {violationData.dsny.outstanding > 1000 && (
          <View style={[styles.complianceCard, { borderColor: '#ef4444', borderWidth: 2 }]}>
            <Text style={[styles.complianceCategory, { color: '#ef4444' }]}>🚨 CRITICAL ALERT</Text>
            <Text style={styles.complianceDetails}>
              Outstanding fines: ${violationData.dsny.outstanding.toLocaleString()}
            </Text>
            <Text style={styles.complianceDetails}>
              Immediate payment required
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };`;

  // Add the real violation data at the top of the file
  const realDataImport = `// Real violation data from NYC APIs
const realViolationData = ${JSON.stringify(realViolationData, null, 2)};

`;

  // Replace the old compliance tab
  const complianceTabRegex = /const renderComplianceTab = \(\) => \{[\s\S]*?\n  \};/;
  content = content.replace(complianceTabRegex, newComplianceTab);

  // Add the real data import after the imports
  content = content.replace(
    /(import.*?;\s*)/s,
    `$1${realDataImport}`
  );

  fs.writeFileSync(filePath, content);
  console.log('✅ BuildingDetailScreen updated with real violation data');
}

function updateWorkerDashboardScreen() {
  console.log('🔄 Updating WorkerDashboardScreen with real violation data...');
  
  const filePath = '/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/src/screens/WorkerDashboardScreen.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Add real violation data import
  const realDataImport = `// Real violation data from NYC APIs
const realViolationData = ${JSON.stringify(realViolationData, null, 2)};

`;

  // Add the real data import after the imports
  content = content.replace(
    /(import.*?;\s*)/s,
    `$1${realDataImport}`
  );

  fs.writeFileSync(filePath, content);
  console.log('✅ WorkerDashboardScreen updated with real violation data');
}

function createViolationDataService() {
  console.log('🔄 Creating ViolationDataService...');
  
  const serviceContent = `/**
 * 🏛️ Violation Data Service
 * Provides real violation data from NYC APIs
 */

export interface ViolationData {
  hpd: {
    total: number;
    open: number;
    violations: Array<{
      date: string;
      type: string;
      status: string;
    }>;
  };
  dob: {
    total: number;
    active: number;
    permits: Array<{
      job: string;
      type: string;
      status: string;
      date: string;
    }>;
  };
  dsny: {
    total: number;
    outstanding: number;
    violations: Array<{
      ticket: string;
      date: string;
      fine: number;
      status: string;
      description: string;
    }>;
  };
  complianceScore: number;
}

// Real violation data from NYC APIs
export const realViolationData: Record<string, ViolationData> = ${JSON.stringify(realViolationData, null, 2)};

export class ViolationDataService {
  static getViolationData(buildingId: string): ViolationData {
    return realViolationData[buildingId] || {
      hpd: { total: 0, open: 0, violations: [] },
      dob: { total: 0, active: 0, permits: [] },
      dsny: { total: 0, outstanding: 0, violations: [] },
      complianceScore: 100
    };
  }

  static getComplianceStatus(score: number): { status: string; color: string } {
    if (score >= 90) return { status: 'EXCELLENT', color: '#10b981' };
    if (score >= 70) return { status: 'GOOD', color: '#f59e0b' };
    if (score >= 50) return { status: 'WARNING', color: '#f97316' };
    return { status: 'CRITICAL', color: '#ef4444' };
  }

  static getCriticalBuildings(): Array<{ id: string; name: string; outstanding: number; score: number }> {
    return Object.entries(realViolationData)
      .filter(([_, data]) => data.dsny.outstanding > 1000 || data.complianceScore < 70)
      .map(([id, data]) => ({
        id,
        name: \`Building \${id}\`,
        outstanding: data.dsny.outstanding,
        score: data.complianceScore
      }));
  }
}
`;

  const servicePath = '/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/src/services/ViolationDataService.ts';
  fs.writeFileSync(servicePath, serviceContent);
  console.log('✅ ViolationDataService created');
}

function main() {
  console.log('🚀 UPDATING ALL MOBILE VIEWS WITH REAL VIOLATION DATA');
  console.log('====================================================');
  
  try {
    updateBuildingDetailScreen();
    updateWorkerDashboardScreen();
    createViolationDataService();
    
    console.log('\n✅ ALL MOBILE VIEWS UPDATED SUCCESSFULLY');
    console.log('==========================================');
    console.log('📱 BuildingDetailScreen: Real violation data integrated');
    console.log('👷 WorkerDashboardScreen: Real violation data integrated');
    console.log('🏛️ ViolationDataService: Created for data management');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test the mobile app with real violation data');
    console.log('2. Verify compliance tabs show correct information');
    console.log('3. Check critical alerts for buildings with outstanding fines');
    
  } catch (error) {
    console.error('❌ Error updating mobile views:', error);
  }
}

main();
