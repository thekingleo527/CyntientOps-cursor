#!/usr/bin/env node

/**
 * 🧪 Test Real NYC Data for One Building
 * 
 * This script tests fetching real violation data for one building
 * to demonstrate the difference between mock and real data.
 */

const https = require('https');

// Test with 12 West 18th Street (Building ID: 1)
const testBuilding = {
  id: '1',
  name: '12 West 18th Street',
  address: '12 West 18th Street, New York, NY 10011',
  mockBin: '1001234', // This is mock data
  mockData: { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 }
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
 * Look up real BIN for the test building
 */
async function getRealBIN() {
  try {
    console.log('🔍 Looking up real BIN for 12 West 18th Street...');
    
    // Query PLUTO dataset
    const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address='12 West 18th Street'&$limit=5`;
    const results = await makeAPIRequest(url);
    
    if (results.length === 0) {
      console.log('❌ No BIN found for 12 West 18th Street');
      return null;
    }
    
    const building = results[0];
    console.log(`✅ Found real BIN: ${building.bin}`);
    console.log(`   BBL: ${building.bbl}`);
    console.log(`   Borough: ${building.borough}`);
    console.log(`   Block: ${building.block}, Lot: ${building.lot}`);
    console.log(`   Year Built: ${building.yearbuilt}`);
    console.log(`   Units: ${building.unitsres}`);
    
    return building.bin;
    
  } catch (error) {
    console.error('Error looking up BIN:', error.message);
    return null;
  }
}

/**
 * Get real violation data using the real BIN
 */
async function getRealViolations(bin) {
  try {
    console.log(`\n🔍 Fetching real violation data for BIN ${bin}...`);
    
    const [hpdViolations, dobViolations, dsnyViolations] = await Promise.all([
      makeAPIRequest(`https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${bin}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=bbl='${bin}'&$limit=100`),
      makeAPIRequest(`https://data.cityofnewyork.us/resource/ebb7-mvp5.json?$where=bbl='${bin}'&$limit=100`)
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
    
    const realData = {
      hpd: activeHPD.length,
      dob: activeDOB.length,
      dsny: activeDSNY.length,
      outstanding: Math.round(outstanding),
      score: Math.max(0, 100 - ((activeHPD.length + activeDOB.length + activeDSNY.length) * 5))
    };
    
    console.log('✅ Real violation data retrieved:');
    console.log(`   HPD Violations: ${realData.hpd}`);
    console.log(`   DOB Violations: ${realData.dob}`);
    console.log(`   DSNY Violations: ${realData.dsny}`);
    console.log(`   Outstanding Amount: $${realData.outstanding.toLocaleString()}`);
    console.log(`   Compliance Score: ${realData.score}%`);
    
    return realData;
    
  } catch (error) {
    console.error('Error fetching violations:', error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function testRealData() {
  console.log('🧪 Testing Real NYC Data vs Mock Data\n');
  console.log(`Building: ${testBuilding.name}`);
  console.log(`Address: ${testBuilding.address}\n`);
  
  console.log('📊 Current Mock Data:');
  console.log(`   BIN: ${testBuilding.mockBin} (MOCK)`);
  console.log(`   HPD: ${testBuilding.mockData.hpd}`);
  console.log(`   DOB: ${testBuilding.mockData.dob}`);
  console.log(`   DSNY: ${testBuilding.mockData.dsny}`);
  console.log(`   Outstanding: $${testBuilding.mockData.outstanding}`);
  console.log(`   Score: ${testBuilding.mockData.score}%\n`);
  
  // Get real BIN
  const realBIN = await getRealBIN();
  if (!realBIN) {
    console.log('❌ Cannot proceed without real BIN');
    return;
  }
  
  // Get real violations
  const realData = await getRealViolations(realBIN);
  if (!realData) {
    console.log('❌ Cannot proceed without real violation data');
    return;
  }
  
  // Compare data
  console.log('\n📈 Comparison:');
  console.log('┌─────────────────┬─────────┬─────────┬──────────┐');
  console.log('│ Metric          │ Mock    │ Real    │ Diff     │');
  console.log('├─────────────────┼─────────┼─────────┼──────────┤');
  console.log(`│ BIN             │ ${testBuilding.mockBin.padEnd(7)} │ ${realBIN.padEnd(7)} │ ${(realBIN !== testBuilding.mockBin ? 'DIFFERENT' : 'SAME').padEnd(8)} │`);
  console.log(`│ HPD Violations  │ ${testBuilding.mockData.hpd.toString().padEnd(7)} │ ${realData.hpd.toString().padEnd(7)} │ ${(realData.hpd - testBuilding.mockData.hpd).toString().padEnd(8)} │`);
  console.log(`│ DOB Violations  │ ${testBuilding.mockData.dob.toString().padEnd(7)} │ ${realData.dob.toString().padEnd(7)} │ ${(realData.dob - testBuilding.mockData.dob).toString().padEnd(8)} │`);
  console.log(`│ DSNY Violations │ ${testBuilding.mockData.dsny.toString().padEnd(7)} │ ${realData.dsny.toString().padEnd(7)} │ ${(realData.dsny - testBuilding.mockData.dsny).toString().padEnd(8)} │`);
  console.log(`│ Outstanding     │ $${testBuilding.mockData.outstanding.toString().padEnd(6)} │ $${realData.outstanding.toString().padEnd(6)} │ $${(realData.outstanding - testBuilding.mockData.outstanding).toString().padEnd(7)} │`);
  console.log(`│ Compliance      │ ${testBuilding.mockData.score}%     │ ${realData.score}%     │ ${(realData.score - testBuilding.mockData.score).toString().padEnd(8)} │`);
  console.log('└─────────────────┴─────────┴─────────┴──────────┘');
  
  // Summary
  const hasDifferences = realBIN !== testBuilding.mockBin || 
                        realData.hpd !== testBuilding.mockData.hpd ||
                        realData.dob !== testBuilding.mockData.dob ||
                        realData.dsny !== testBuilding.mockData.dsny ||
                        Math.abs(realData.outstanding - testBuilding.mockData.outstanding) > 100;
  
  if (hasDifferences) {
    console.log('\n🚨 SIGNIFICANT DIFFERENCES FOUND!');
    console.log('   The mock data does not match real NYC data.');
    console.log('   This confirms the need for a full audit and data update.');
  } else {
    console.log('\n✅ Data matches (unlikely with mock data)');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Run full BIN lookup: node scripts/get-building-bins.js');
  console.log('   2. Run full violation audit: node scripts/audit-violations.js');
  console.log('   3. Update BuildingDetailScreen.tsx with real data');
}

// Run the test
if (require.main === module) {
  testRealData().catch(console.error);
}

module.exports = { testRealData };
