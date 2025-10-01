#!/usr/bin/env node

/**
 * 🚨 CyntientOps Violation Data Audit Script
 * 
 * This script audits the violation data by querying real NYC public APIs
 * to verify the accuracy of our compliance data.
 * 
 * NYC APIs Used:
 * - HPD Violations: https://data.cityofnewyork.us/resource/wvxf-dwi5.json
 * - DOB Violations: https://data.cityofnewyork.us/resource/3h2n-5cm9.json
 * - DOB Permits: https://data.cityofnewyork.us/resource/ic3t-wcy2.json
 * - DSNY Violations: https://data.cityofnewyork.us/resource/ebb7-mvp5.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Building data from our system
const buildings = [
  { id: '1', name: '12 West 18th Street', address: '12 West 18th Street, New York, NY 10011', bin: '1001234' },
  { id: '3', name: '135-139 West 17th Street', address: '135-139 West 17th Street, New York, NY 10011', bin: '1001235' },
  { id: '4', name: '104 Franklin Street', address: '104 Franklin Street, New York, NY 10013', bin: '1001236' },
  { id: '5', name: '138 West 17th Street', address: '138 West 17th Street, New York, NY 10011', bin: '1001237' },
  { id: '6', name: '68 Perry Street', address: '68 Perry Street, New York, NY 10014', bin: '1001238' },
  { id: '7', name: '112 West 18th Street', address: '112 West 18th Street, New York, NY 10011', bin: '1001239' },
  { id: '8', name: '41 Elizabeth Street', address: '41 Elizabeth Street, New York, NY 10013', bin: '1001240' },
  { id: '9', name: '117 West 17th Street', address: '117 West 17th Street, New York, NY 10011', bin: '1001241' },
  { id: '10', name: '131 Perry Street', address: '131 Perry Street, New York, NY 10014', bin: '1001242' },
  { id: '11', name: '123 1st Avenue', address: '123 1st Avenue, New York, NY 10003', bin: '1001243' },
  { id: '13', name: '136 West 17th Street', address: '136 West 17th Street, New York, NY 10011', bin: '1001244' },
  { id: '14', name: 'Rubin Museum (142–148 W 17th)', address: '150 West 17th Street, New York, NY 10011', bin: '1001245' },
  { id: '15', name: '133 East 15th Street', address: '133 East 15th Street, New York, NY 10003', bin: '1001246' },
  { id: '16', name: 'Stuyvesant Cove Park', address: 'Stuyvesant Cove Park, New York, NY 10009', bin: '1001247' },
  { id: '17', name: '178 Spring Street', address: '178 Spring Street, New York, NY 10012', bin: '1001248' },
  { id: '18', name: '36 Walker Street', address: '36 Walker Street, New York, NY 10013', bin: '1001249' },
  { id: '19', name: '115 7th Avenue', address: '115 7th Avenue, New York, NY 10011', bin: '1001250' },
  { id: '21', name: '148 Chambers Street', address: '148 Chambers Street, New York, NY 10007', bin: '1001251' }
];

// NYC API endpoints
const NYC_APIS = {
  hpd: 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json',
  dob: 'https://data.cityofnewyork.us/resource/3h2n-5cm9.json',
  dobPermits: 'https://data.cityofnewyork.us/resource/ic3t-wcy2.json',
  dsny: 'https://data.cityofnewyork.us/resource/ebb7-mvp5.json'
};

// Current mock data for comparison
const mockData = {
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

/**
 * Make HTTP request to NYC API
 */
function makeAPIRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Query HPD violations for a building
 */
async function getHPDViolations(bin) {
  try {
    const url = `${NYC_APIS.hpd}?$where=bbl='${bin}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    return violations.filter(v => 
      v.currentstatus === 'OPEN' || 
      v.currentstatus === 'ACTIVE' || 
      v.job_status === 'ACTIVE'
    );
  } catch (error) {
    console.error(`Error fetching HPD violations for BIN ${bin}:`, error.message);
    return [];
  }
}

/**
 * Query DOB violations for a building
 */
async function getDOBViolations(bin) {
  try {
    const url = `${NYC_APIS.dob}?$where=bbl='${bin}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    return violations.filter(v => 
      v.violation_status === 'OPEN' || 
      v.violation_status === 'ACTIVE'
    );
  } catch (error) {
    console.error(`Error fetching DOB violations for BIN ${bin}:`, error.message);
    return [];
  }
}

/**
 * Query DOB permits for a building
 */
async function getDOBPermits(bin) {
  try {
    const url = `${NYC_APIS.dobPermits}?$where=bbl='${bin}'&$limit=1000`;
    const permits = await makeAPIRequest(url);
    return permits.filter(p => 
      p.job_status === 'ACTIVE' || 
      p.job_status === 'OPEN'
    );
  } catch (error) {
    console.error(`Error fetching DOB permits for BIN ${bin}:`, error.message);
    return [];
  }
}

/**
 * Query DSNY violations for a building
 */
async function getDSNYViolations(bin) {
  try {
    const url = `${NYC_APIS.dsny}?$where=bbl='${bin}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    return violations.filter(v => 
      v.violation_status === 'OPEN' || 
      v.violation_status === 'ACTIVE'
    );
  } catch (error) {
    console.error(`Error fetching DSNY violations for BIN ${bin}:`, error.message);
    return [];
  }
}

/**
 * Calculate compliance score based on violations
 */
function calculateComplianceScore(hpd, dob, dsny, outstanding) {
  const totalViolations = hpd + dob + dsny + (outstanding / 100);
  if (totalViolations === 0) return 100;
  if (totalViolations > 100) return 0;
  return Math.max(0, 100 - (totalViolations * 2));
}

/**
 * Main audit function
 */
async function auditViolations() {
  console.log('🚨 Starting CyntientOps Violation Data Audit...\n');
  
  const auditResults = [];
  const discrepancies = [];
  
  for (const building of buildings) {
    console.log(`📋 Auditing ${building.name} (BIN: ${building.bin})...`);
    
    try {
      // Query all violation types in parallel
      const [hpdViolations, dobViolations, dobPermits, dsnyViolations] = await Promise.all([
        getHPDViolations(building.bin),
        getDOBViolations(building.bin),
        getDOBPermits(building.bin),
        getDSNYViolations(building.bin)
      ]);
      
      const realData = {
        hpd: hpdViolations.length,
        dob: dobViolations.length,
        dsny: dsnyViolations.length,
        outstanding: dobViolations.filter(v => v.outstanding_amount).reduce((sum, v) => sum + (parseFloat(v.outstanding_amount) || 0), 0),
        permits: dobPermits.length
      };
      
      realData.score = calculateComplianceScore(realData.hpd, realData.dob, realData.dsny, realData.outstanding);
      
      const mock = mockData[building.id];
      const auditResult = {
        buildingId: building.id,
        buildingName: building.name,
        address: building.address,
        bin: building.bin,
        mockData: mock,
        realData: realData,
        discrepancies: {
          hpd: mock.hpd !== realData.hpd,
          dob: mock.dob !== realData.dob,
          dsny: mock.dsny !== realData.dsny,
          outstanding: Math.abs(mock.outstanding - realData.outstanding) > 100,
          score: Math.abs(mock.score - realData.score) > 10
        }
      };
      
      auditResults.push(auditResult);
      
      // Check for significant discrepancies
      const hasDiscrepancies = Object.values(auditResult.discrepancies).some(d => d);
      if (hasDiscrepancies) {
        discrepancies.push(auditResult);
        console.log(`⚠️  DISCREPANCIES FOUND for ${building.name}`);
        console.log(`   Mock: HPD=${mock.hpd}, DOB=${mock.dob}, DSNY=${mock.dsny}, Outstanding=${mock.outstanding}, Score=${mock.score}`);
        console.log(`   Real: HPD=${realData.hpd}, DOB=${realData.dob}, DSNY=${realData.dsny}, Outstanding=${realData.outstanding}, Score=${realData.score}`);
      } else {
        console.log(`✅ Data matches for ${building.name}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error auditing ${building.name}:`, error.message);
    }
  }
  
  // Generate audit report
  const report = {
    auditDate: new Date().toISOString(),
    totalBuildings: buildings.length,
    buildingsWithDiscrepancies: discrepancies.length,
    discrepancies: discrepancies,
    fullResults: auditResults
  };
  
  // Save audit report
  const reportPath = path.join(__dirname, '..', 'audit-reports', `violation-audit-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Audit Complete!`);
  console.log(`   Total Buildings: ${buildings.length}`);
  console.log(`   Buildings with Discrepancies: ${discrepancies.length}`);
  console.log(`   Report saved to: ${reportPath}`);
  
  if (discrepancies.length > 0) {
    console.log(`\n🚨 CRITICAL: ${discrepancies.length} buildings have data discrepancies!`);
    console.log('   Review the audit report and update the violation data accordingly.');
  }
  
  return report;
}

// Run the audit
if (require.main === module) {
  auditViolations().catch(console.error);
}

module.exports = { auditViolations, buildings, mockData };
