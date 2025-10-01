#!/usr/bin/env node

/**
 * 🚨 Get All Building Violations - Comprehensive Search
 * 
 * This script searches for ALL violations across all relevant NYC APIs
 * and provides a comprehensive list of violations for CyntientOps buildings.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// All building identifiers we have
const buildings = [
  { id: '1', name: '12 West 18th Street', bbl: '1008197501.00000000', block: '819', lot: '7501', boro: '1' },
  { id: '3', name: '135-139 West 17th Street', bbl: '1007930017.00000000', block: '793', lot: '17', boro: '1' },
  { id: '4', name: '104 Franklin Street', bbl: '1001780005.00000000', block: '178', lot: '5', boro: '1' },
  { id: '5', name: '138 West 17th Street', bbl: '1007927502.00000000', block: '792', lot: '7502', boro: '1' },
  { id: '6', name: '68 Perry Street', bbl: '1006210051.00000000', block: '621', lot: '51', boro: '1' },
  { id: '8', name: '41 Elizabeth Street', bbl: '1002040024.00000000', block: '204', lot: '24', boro: '1' },
  { id: '10', name: '131 Perry Street', bbl: '1006330028.00000000', block: '633', lot: '28', boro: '1' },
  { id: '11', name: '123 1st Avenue', bbl: '1004490034.00000000', block: '449', lot: '34', boro: '1' },
  { id: '13', name: '136 West 17th Street', bbl: '1007927507.00000000', block: '792', lot: '7507', boro: '1' },
  { id: '14', name: 'Rubin Museum', bbl: '1007920064.00000000', block: '792', lot: '64', boro: '1' },
  { id: '15', name: '133 East 15th Street', bbl: '1008710030.00000000', block: '871', lot: '30', boro: '1' },
  { id: '17', name: '178 Spring Street', bbl: '1004880016.00000000', block: '488', lot: '16', boro: '1' },
  { id: '18', name: '36 Walker Street', bbl: '1001940014.00000000', block: '194', lot: '14', boro: '1' },
  { id: '21', name: '148 Chambers Street', bbl: '1001377505.00000000', block: '137', lot: '7505', boro: '1' }
];

// Additional buildings mentioned by user
const additionalBuildings = [
  { name: '112 West 17th Street', searchTerms: ['112', 'WEST 17'] },
  { name: '113 West 17th Street', searchTerms: ['113', 'WEST 17'] },
  { name: '117 West 17th Street', searchTerms: ['117', 'WEST 17'] }
];

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
          const result = JSON.parse(data);
          resolve(Array.isArray(result) ? result : []);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get HPD violations using BBL
 */
async function getHPDViolations(bbl) {
  try {
    const url = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${bbl}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    
    const active = violations.filter(v => 
      v.currentstatus === 'OPEN' || 
      v.currentstatus === 'ACTIVE' || 
      v.job_status === 'ACTIVE'
    );
    
    return {
      total: violations.length,
      active: active.length,
      violations: active
    };
  } catch (error) {
    console.error(`Error fetching HPD violations for BBL ${bbl}:`, error.message);
    return { total: 0, active: 0, violations: [] };
  }
}

/**
 * Get DOB violations using block, lot, boro
 */
async function getDOBViolations(block, lot, boro) {
  try {
    const url = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=block='${block}' and lot='${lot}' and boro='${boro}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    
    const active = violations.filter(v => 
      v.violation_status === 'OPEN' || 
      v.violation_status === 'ACTIVE'
    );
    
    return {
      total: violations.length,
      active: active.length,
      violations: active
    };
  } catch (error) {
    console.error(`Error fetching DOB violations:`, error.message);
    return { total: 0, active: 0, violations: [] };
  }
}

/**
 * Get ECB violations using block, lot, boro
 */
async function getECBViolations(block, lot, boro) {
  try {
    const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=block='${block}' and lot='${lot}' and boro='${boro}'&$limit=1000`;
    const violations = await makeAPIRequest(url);
    
    const active = violations.filter(v => 
      v.ecb_violation_status === 'ACTIVE' || 
      v.ecb_violation_status === 'OPEN' ||
      v.ecb_violation_status === 'RESOLVE'
    );
    
    return {
      total: violations.length,
      active: active.length,
      violations: active
    };
  } catch (error) {
    console.error(`Error fetching ECB violations:`, error.message);
    return { total: 0, active: 0, violations: [] };
  }
}

/**
 * Search for additional buildings by address
 */
async function searchAdditionalBuildings() {
  console.log('🔍 Searching for additional buildings mentioned...');
  
  const results = [];
  
  for (const building of additionalBuildings) {
    try {
      const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=boro='1' and respondent_house_number='${building.searchTerms[0]}' and respondent_street like '%${building.searchTerms[1]}%'&$limit=100`;
      const violations = await makeAPIRequest(url);
      
      if (violations.length > 0) {
        console.log(`   Found ${violations.length} violations for ${building.name}`);
        results.push({
          building: building.name,
          violations: violations
        });
      }
    } catch (error) {
      console.error(`Error searching ${building.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Get all violations for a building
 */
async function getAllViolationsForBuilding(building) {
  console.log(`🔍 Getting all violations for ${building.name}...`);
  
  const [hpd, dob, ecb] = await Promise.all([
    getHPDViolations(building.bbl),
    getDOBViolations(building.block, building.lot, building.boro),
    getECBViolations(building.block, building.lot, building.boro)
  ]);
  
  const totalViolations = hpd.active + dob.active + ecb.active;
  const totalRecords = hpd.total + dob.total + ecb.total;
  
  console.log(`   HPD: ${hpd.active} active (${hpd.total} total)`);
  console.log(`   DOB: ${dob.active} active (${dob.total} total)`);
  console.log(`   ECB: ${ecb.active} active (${ecb.total} total)`);
  console.log(`   Total: ${totalViolations} active violations`);
  
  return {
    buildingId: building.id,
    buildingName: building.name,
    bbl: building.bbl,
    block: building.block,
    lot: building.lot,
    boro: building.boro,
    violations: {
      hpd: hpd,
      dob: dob,
      ecb: ecb
    },
    summary: {
      totalActive: totalViolations,
      totalRecords: totalRecords,
      complianceScore: Math.max(0, 100 - (totalViolations * 5))
    }
  };
}

/**
 * Main function to get all violations
 */
async function getAllViolations() {
  console.log('🚨 Getting ALL Building Violations - Comprehensive Search...\n');
  
  const results = [];
  const additionalResults = [];
  
  // Get violations for all known buildings
  for (const building of buildings) {
    try {
      const buildingViolations = await getAllViolationsForBuilding(building);
      results.push(buildingViolations);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${building.name}:`, error.message);
    }
  }
  
  // Search for additional buildings
  const additionalViolations = await searchAdditionalBuildings();
  additionalResults.push(...additionalViolations);
  
  // Calculate totals
  const totalActive = results.reduce((sum, r) => sum + r.summary.totalActive, 0);
  const totalRecords = results.reduce((sum, r) => sum + r.summary.totalRecords, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Buildings: ${buildings.length}`);
  console.log(`   Total Active Violations: ${totalActive}`);
  console.log(`   Total Records: ${totalRecords}`);
  console.log(`   Additional Buildings Found: ${additionalResults.length}`);
  
  // Show buildings with violations
  const buildingsWithViolations = results.filter(r => r.summary.totalActive > 0);
  if (buildingsWithViolations.length > 0) {
    console.log(`\n🚨 Buildings with Active Violations:`);
    buildingsWithViolations.forEach(b => {
      console.log(`   ${b.buildingName}: ${b.summary.totalActive} active violations`);
    });
  } else {
    console.log(`\n✅ No active violations found in known buildings`);
  }
  
  // Show additional buildings with violations
  if (additionalResults.length > 0) {
    console.log(`\n🏢 Additional Buildings with Violations:`);
    additionalResults.forEach(b => {
      console.log(`   ${b.building}: ${b.violations.length} violations`);
    });
  }
  
  // Generate comprehensive report
  const report = {
    searchDate: new Date().toISOString(),
    totalBuildings: buildings.length,
    totalActiveViolations: totalActive,
    totalRecords: totalRecords,
    additionalBuildings: additionalResults.length,
    buildings: results,
    additionalBuildings: additionalResults,
    summary: {
      buildingsWithViolations: buildingsWithViolations.length,
      cleanBuildings: buildings.length - buildingsWithViolations.length,
      averageViolationsPerBuilding: buildings.length > 0 ? (totalActive / buildings.length).toFixed(2) : 0
    }
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'audit-reports', `all-violations-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
  
  return report;
}

// Run the comprehensive search
if (require.main === module) {
  getAllViolations().catch(console.error);
}

module.exports = { getAllViolations, buildings, additionalBuildings };
