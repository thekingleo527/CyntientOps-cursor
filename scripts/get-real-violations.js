#!/usr/bin/env node

/**
 * 🚨 Get Real Violation Data for CyntientOps Buildings
 * 
 * This script gets real violation data using the correct field names
 * for each NYC API (HPD uses bbl, DOB uses block/lot/boro, etc.)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Buildings we found with real BBL numbers
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
    console.error(`Error fetching HPD violations: ${error.message}`);
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
    console.error(`Error fetching DOB violations: ${error.message}`);
    return { total: 0, active: 0, violations: [] };
  }
}

/**
 * Get DSNY violations using BBL
 */
async function getDSNYViolations(bbl) {
  try {
    const url = `https://data.cityofnewyork.us/resource/ebb7-mvp5.json?$where=bbl='${bbl}'&$limit=1000`;
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
    console.error(`Error fetching DSNY violations: ${error.message}`);
    return { total: 0, active: 0, violations: [] };
  }
}

/**
 * Get violation data for a building
 */
async function getViolationData(building) {
  console.log(`🔍 Getting violations for ${building.name}...`);
  
  const [hpd, dob, dsny] = await Promise.all([
    getHPDViolations(building.bbl),
    getDOBViolations(building.block, building.lot, building.boro),
    getDSNYViolations(building.bbl)
  ]);
  
  const violationData = {
    hpd: hpd.active,
    dob: dob.active,
    dsny: dsny.active,
    outstanding: 0, // We'll calculate this from DOB violations
    totalHPD: hpd.total,
    totalDOB: dob.total,
    totalDSNY: dsny.total,
    score: 0 // We'll calculate this
  };
  
  // Calculate outstanding amount from DOB violations
  const outstandingAmount = dob.violations.reduce((sum, v) => {
    const amount = parseFloat(v.outstanding_amount) || 0;
    return sum + amount;
  }, 0);
  violationData.outstanding = Math.round(outstandingAmount);
  
  // Calculate compliance score
  const totalViolations = violationData.hpd + violationData.dob + violationData.dsny;
  violationData.score = Math.max(0, 100 - (totalViolations * 5));
  
  console.log(`   HPD: ${violationData.hpd} active (${violationData.totalHPD} total)`);
  console.log(`   DOB: ${violationData.dob} active (${violationData.totalDOB} total)`);
  console.log(`   DSNY: ${violationData.dsny} active (${violationData.totalDSNY} total)`);
  console.log(`   Outstanding: $${violationData.outstanding.toLocaleString()}`);
  console.log(`   Compliance Score: ${violationData.score}%`);
  
  return violationData;
}

/**
 * Main function to get all violation data
 */
async function getAllViolationData() {
  console.log('🚨 Getting Real Violation Data for All Buildings...\n');
  
  const results = [];
  
  for (const building of buildings) {
    try {
      const violations = await getViolationData(building);
      
      results.push({
        buildingId: building.id,
        buildingName: building.name,
        bbl: building.bbl,
        block: building.block,
        lot: building.lot,
        boro: building.boro,
        violations
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${building.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Buildings: ${buildings.length}`);
  console.log(`   Processed: ${results.length}`);
  
  // Calculate totals
  const totals = results.reduce((acc, r) => {
    acc.hpd += r.violations.hpd;
    acc.dob += r.violations.dob;
    acc.dsny += r.violations.dsny;
    acc.outstanding += r.violations.outstanding;
    return acc;
  }, { hpd: 0, dob: 0, dsny: 0, outstanding: 0 });
  
  console.log(`\n📈 Portfolio Totals:`);
  console.log(`   HPD Violations: ${totals.hpd}`);
  console.log(`   DOB Violations: ${totals.dob}`);
  console.log(`   DSNY Violations: ${totals.dsny}`);
  console.log(`   Outstanding Amount: $${totals.outstanding.toLocaleString()}`);
  
  // Generate report
  const report = {
    auditDate: new Date().toISOString(),
    totalBuildings: buildings.length,
    processedBuildings: results.length,
    portfolioTotals: totals,
    buildings: results
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'audit-reports', `real-violation-data-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  // Show top buildings with violations
  const buildingsWithViolations = results.filter(r => 
    r.violations.hpd > 0 || r.violations.dob > 0 || r.violations.dsny > 0
  );
  
  if (buildingsWithViolations.length > 0) {
    console.log(`\n🚨 Buildings with Active Violations:`);
    buildingsWithViolations.forEach(b => {
      console.log(`   ${b.buildingName}: HPD=${b.violations.hpd}, DOB=${b.violations.dob}, DSNY=${b.violations.dsny}, Score=${b.violations.score}%`);
    });
  } else {
    console.log(`\n✅ No active violations found across all buildings!`);
  }
  
  return report;
}

// Run the violation data collection
if (require.main === module) {
  getAllViolationData().catch(console.error);
}

module.exports = { getAllViolationData, buildings };
