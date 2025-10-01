#!/usr/bin/env node

/**
 * 🏢 Find Real Building Data with Correct Address Format
 * 
 * This script searches for our buildings using the correct NYC PLUTO address format
 * and finds their real BBL numbers for violation data lookup.
 */

const https = require('https');

// Our buildings with corrected address formats for NYC PLUTO dataset
const buildings = [
  { id: '1', name: '12 West 18th Street', searchAddress: '12 WEST 18 STREET', zipcode: '10011' },
  { id: '3', name: '135-139 West 17th Street', searchAddress: '135 WEST 17 STREET', zipcode: '10011' },
  { id: '4', name: '104 Franklin Street', searchAddress: '104 FRANKLIN STREET', zipcode: '10013' },
  { id: '5', name: '138 West 17th Street', searchAddress: '138 WEST 17 STREET', zipcode: '10011' },
  { id: '6', name: '68 Perry Street', searchAddress: '68 PERRY STREET', zipcode: '10014' },
  { id: '7', name: '112 West 18th Street', searchAddress: '112 WEST 18 STREET', zipcode: '10011' },
  { id: '8', name: '41 Elizabeth Street', searchAddress: '41 ELIZABETH STREET', zipcode: '10013' },
  { id: '9', name: '117 West 17th Street', searchAddress: '117 WEST 17 STREET', zipcode: '10011' },
  { id: '10', name: '131 Perry Street', searchAddress: '131 PERRY STREET', zipcode: '10014' },
  { id: '11', name: '123 1st Avenue', searchAddress: '123 1 AVENUE', zipcode: '10003' },
  { id: '13', name: '136 West 17th Street', searchAddress: '136 WEST 17 STREET', zipcode: '10011' },
  { id: '14', name: 'Rubin Museum', searchAddress: '150 WEST 17 STREET', zipcode: '10011' },
  { id: '15', name: '133 East 15th Street', searchAddress: '133 EAST 15 STREET', zipcode: '10003' },
  { id: '17', name: '178 Spring Street', searchAddress: '178 SPRING STREET', zipcode: '10012' },
  { id: '18', name: '36 Walker Street', searchAddress: '36 WALKER STREET', zipcode: '10013' },
  { id: '19', name: '115 7th Avenue', searchAddress: '115 7 AVENUE', zipcode: '10011' },
  { id: '21', name: '148 Chambers Street', searchAddress: '148 CHAMBERS STREET', zipcode: '10007' }
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
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Search for building by exact address match
 */
async function findBuilding(building) {
  try {
    console.log(`🔍 Searching for: ${building.name} (${building.searchAddress})`);
    
    const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address='${building.searchAddress}'&$limit=5`;
    const results = await makeAPIRequest(url);
    
    if (results.length > 0) {
      const match = results[0];
      console.log(`✅ Found: ${match.address} | BBL: ${match.bbl}`);
      return {
        buildingId: building.id,
        buildingName: building.name,
        originalAddress: building.searchAddress,
        plutoAddress: match.address,
        bbl: match.bbl,
        borough: match.borough,
        block: match.block,
        lot: match.lot,
        zipcode: match.zipcode,
        landUse: match.landuse,
        yearBuilt: match.yearbuilt,
        unitsRes: match.unitsres,
        unitsCom: match.unitscom,
        bldgArea: match.bldgarea
      };
    } else {
      console.log(`❌ Not found: ${building.searchAddress}`);
      return null;
    }
    
  } catch (error) {
    console.error(`Error searching for ${building.name}:`, error.message);
    return null;
  }
}

/**
 * Get violations for a building using BBL
 */
async function getViolationsForBuilding(buildingData) {
  try {
    console.log(`🔍 Getting violations for ${buildingData.buildingName} (BBL: ${buildingData.bbl})`);
    
    const [hpdViolations, dobViolations, dsnyViolations] = await Promise.all([
      makeAPIRequest(`https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${buildingData.bbl}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=bbl='${buildingData.bbl}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/ebb7-mvp5.json?$where=bbl='${buildingData.bbl}'&$limit=100`)
    ]);
    
    const activeHPD = hpdViolations.filter(v => 
      v.currentstatus === 'OPEN' || v.currentstatus === 'ACTIVE'
    );
    
    const activeDOB = dobViolations.filter(v => 
      v.violation_status === 'OPEN' || v.violation_status === 'ACTIVE'
    );
    
    const activeDSNY = dsnyViolations.filter(v => 
      v.violation_status === 'OPEN' || v.violation_status === 'ACTIVE'
    );
    
    const outstanding = dobViolations.reduce((sum, v) => 
      sum + (parseFloat(v.outstanding_amount) || 0), 0
    );
    
    const violationData = {
      hpd: activeHPD.length,
      dob: activeDOB.length,
      dsny: activeDSNY.length,
      outstanding: Math.round(outstanding),
      totalHPD: hpdViolations.length,
      totalDOB: dobViolations.length,
      totalDSNY: dsnyViolations.length
    };
    
    // Calculate compliance score
    const totalViolations = violationData.hpd + violationData.dob + violationData.dsny;
    violationData.score = Math.max(0, 100 - (totalViolations * 5));
    
    console.log(`   HPD: ${violationData.hpd} active, ${violationData.totalHPD} total`);
    console.log(`   DOB: ${violationData.dob} active, ${violationData.totalDOB} total`);
    console.log(`   DSNY: ${violationData.dsny} active, ${violationData.totalDSNY} total`);
    console.log(`   Outstanding: $${violationData.outstanding.toLocaleString()}`);
    console.log(`   Compliance Score: ${violationData.score}%`);
    
    return violationData;
    
  } catch (error) {
    console.error(`Error getting violations for ${buildingData.buildingName}:`, error.message);
    return null;
  }
}

/**
 * Main function to find all buildings and get their violation data
 */
async function findRealBuildingData() {
  console.log('🏢 Finding Real Building Data with Violations...\n');
  
  const results = [];
  const found = [];
  const notFound = [];
  
  for (const building of buildings) {
    const buildingData = await findBuilding(building);
    
    if (buildingData) {
      found.push(buildingData);
      
      // Get violation data
      const violations = await getViolationsForBuilding(buildingData);
      
      if (violations) {
        results.push({
          ...buildingData,
          violations
        });
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      notFound.push(building);
    }
  }
  
  console.log(`\n📊 Results Summary:`);
  console.log(`   Total Buildings: ${buildings.length}`);
  console.log(`   Found: ${found.length}`);
  console.log(`   Not Found: ${notFound.length}`);
  console.log(`   With Violation Data: ${results.length}`);
  
  if (notFound.length > 0) {
    console.log(`\n❌ Buildings Not Found:`);
    notFound.forEach(b => console.log(`   - ${b.name}: ${b.searchAddress}`));
  }
  
  // Generate report
  const report = {
    searchDate: new Date().toISOString(),
    totalBuildings: buildings.length,
    foundBuildings: found.length,
    notFoundBuildings: notFound.length,
    withViolationData: results.length,
    buildings: results,
    notFound: notFound
  };
  
  // Save report
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, '..', 'audit-reports', `real-building-data-${new Date().toISOString().split('T')[0]}.json`);
  require('fs').mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  if (results.length > 0) {
    console.log(`\n🎯 Real Data Found for ${results.length} Buildings:`);
    results.forEach(b => {
      console.log(`   ${b.buildingName}: HPD=${b.violations.hpd}, DOB=${b.violations.dob}, DSNY=${b.violations.dsny}, Score=${b.violations.score}%`);
    });
  }
  
  return report;
}

// Run the search
if (require.main === module) {
  findRealBuildingData().catch(console.error);
}

module.exports = { findRealBuildingData, buildings };
