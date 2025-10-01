#!/usr/bin/env node

/**
 * 🚨 CyntientOps Violation Data Audit with BBL
 * 
 * This script audits violation data using BBL (Borough, Block, Lot) numbers
 * since BIN numbers may not be available in all NYC datasets.
 */

const https = require('https');

// Test building with known address
const testBuilding = {
  id: '1',
  name: '12 West 18th Street',
  address: '12 West 18th Street, New York, NY 10011',
  zipcode: '10011'
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
 * Search for building by address pattern
 */
async function findBuildingByAddress(address, zipcode) {
  try {
    console.log(`🔍 Searching for building: ${address}`);
    
    // Try different search patterns
    const searchPatterns = [
      `address like '%12 West 18th%'`,
      `address like '%12%20West%2018th%'`,
      `zipcode='${zipcode}' and address like '%18th%'`,
      `zipcode='${zipcode}' and address like '%West%'`
    ];
    
    for (const pattern of searchPatterns) {
      const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=${encodeURIComponent(pattern)}&$limit=10`;
      const results = await makeAPIRequest(url);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} potential matches`);
        return results;
      }
    }
    
    console.log('❌ No matches found');
    return [];
    
  } catch (error) {
    console.error('Error searching for building:', error.message);
    return [];
  }
}

/**
 * Get violations using BBL
 */
async function getViolationsByBBL(bbl) {
  try {
    console.log(`🔍 Fetching violations for BBL: ${bbl}`);
    
    const [hpdViolations, dobViolations, dsnyViolations] = await Promise.all([
      makeAPIRequest(`https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${bbl}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=bbl='${bbl}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/ebb7-mvp5.json?$where=bbl='${bbl}'&$limit=100`)
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
    
    return {
      hpd: activeHPD.length,
      dob: activeDOB.length,
      dsny: activeDSNY.length,
      outstanding: Math.round(outstanding),
      totalHPD: hpdViolations.length,
      totalDOB: dobViolations.length,
      totalDSNY: dsnyViolations.length
    };
    
  } catch (error) {
    console.error('Error fetching violations:', error.message);
    return null;
  }
}

/**
 * Test with a known building in the area
 */
async function testWithKnownBuilding() {
  try {
    console.log('🧪 Testing with known building in 10011 zip code...\n');
    
    // Search for any building in the area
    const buildings = await findBuildingByAddress('12 West 18th Street', '10011');
    
    if (buildings.length === 0) {
      console.log('❌ No buildings found in the area');
      return;
    }
    
    // Test with the first building found
    const testBuilding = buildings[0];
    console.log(`📋 Testing with: ${testBuilding.address}`);
    console.log(`   BBL: ${testBuilding.bbl}`);
    console.log(`   Borough: ${testBuilding.borough}`);
    console.log(`   Block: ${testBuilding.block}, Lot: ${testBuilding.lot}\n`);
    
    // Get violations
    const violations = await getViolationsByBBL(testBuilding.bbl);
    
    if (violations) {
      console.log('📊 Real Violation Data:');
      console.log(`   HPD Violations (Active): ${violations.hpd}`);
      console.log(`   DOB Violations (Active): ${violations.dob}`);
      console.log(`   DSNY Violations (Active): ${violations.dsny}`);
      console.log(`   Outstanding Amount: $${violations.outstanding.toLocaleString()}`);
      console.log(`   Total HPD Records: ${violations.totalHPD}`);
      console.log(`   Total DOB Records: ${violations.totalDOB}`);
      console.log(`   Total DSNY Records: ${violations.totalDSNY}`);
      
      const complianceScore = Math.max(0, 100 - ((violations.hpd + violations.dob + violations.dsny) * 5));
      console.log(`   Calculated Compliance Score: ${complianceScore}%`);
      
      console.log('\n🎯 Key Findings:');
      if (violations.totalHPD > 0 || violations.totalDOB > 0 || violations.totalDSNY > 0) {
        console.log('   ✅ Real violation data is available from NYC APIs');
        console.log('   ✅ APIs are working and returning data');
        console.log('   ✅ Our mock data can be replaced with real data');
      } else {
        console.log('   ℹ️  No violations found for this building (clean record)');
        console.log('   ✅ APIs are working correctly');
      }
      
    } else {
      console.log('❌ Failed to retrieve violation data');
    }
    
  } catch (error) {
    console.error('Error in test:', error.message);
  }
}

/**
 * Demonstrate the audit process
 */
async function demonstrateAudit() {
  console.log('🚨 CyntientOps Violation Data Audit Demonstration\n');
  
  console.log('📋 Current Issues with Mock Data:');
  console.log('   1. BIN numbers are sequential (1001234-1001251)');
  console.log('   2. Violation counts appear to be placeholder data');
  console.log('   3. Compliance scores may not reflect reality');
  console.log('   4. Outstanding amounts seem unrealistic\n');
  
  console.log('🔧 Solution: Replace with Real NYC Data');
  console.log('   - Use BBL (Borough, Block, Lot) for building identification');
  console.log('   - Query HPD, DOB, and DSNY APIs for real violations');
  console.log('   - Calculate accurate compliance scores\n');
  
  await testWithKnownBuilding();
  
  console.log('\n📋 Next Steps for Full Audit:');
  console.log('   1. Get real BBL numbers for all 18 buildings');
  console.log('   2. Query all violation APIs for each building');
  console.log('   3. Calculate real compliance scores');
  console.log('   4. Update BuildingDetailScreen.tsx with real data');
  console.log('   5. Implement ongoing data refresh');
  
  console.log('\n🎯 Commands to Run:');
  console.log('   node scripts/get-building-bins.js    # Get real BBL numbers');
  console.log('   node scripts/audit-violations.js     # Get real violation data');
  console.log('   node scripts/generate-audit-report.js # Generate full report');
}

// Run the demonstration
if (require.main === module) {
  demonstrateAudit().catch(console.error);
}

module.exports = { demonstrateAudit, findBuildingByAddress, getViolationsByBBL };
