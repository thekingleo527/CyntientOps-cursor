const fetch = require('node-fetch');

// Building data
const buildings = [
  { id: '1', name: '12 West 18th Street', address: '12 West 18th Street' },
  { id: '3', name: '135 West 17th Street', address: '135 West 17th Street' },
  { id: '4', name: '104 Franklin Street', address: '104 Franklin Street' },
  { id: '5', name: '138 West 17th Street', address: '138 West 17th Street' },
  { id: '6', name: '68 Perry Street', address: '68 Perry Street' },
  { id: '10', name: '131 Perry Street', address: '131 Perry Street' }
];

async function testBuildingHydration() {
  console.log('🏢 CyntientOps Building Data Hydration Test');
  console.log('==========================================\n');

  for (const building of buildings) {
    console.log(`\n📍 ${building.name}`);
    console.log('='.repeat(building.name.length + 3));

    // Test DSNY Violations
    console.log('\n🗑️  DSNY VIOLATIONS:');
    try {
      // Extract street name (e.g., "Perry Street" from "131 Perry Street")
      const streetName = building.address.split(',')[0].split(' ').slice(1).join(' ');
      const dsnyUrl = `https://data.cityofnewyork.us/resource/rf9i-y2ch.json?violation_location_street_name=${encodeURIComponent(streetName.toUpperCase())}&$limit=10&$order=violation_date DESC`;
      const dsnyResponse = await fetch(dsnyUrl);
      if (dsnyResponse.ok) {
        const violations = await dsnyResponse.json();
        console.log(`   ✅ Found ${violations.length} violations`);
        if (violations.length > 0) {
          violations.slice(0, 3).forEach((v, i) => {
            const fineAmount = parseFloat(v.penalty_imposed || v.total_violation_amount || '0') / 100;
            console.log(`   ${i + 1}. ${v.charge_1_code_description || 'Unknown'}`);
            console.log(`      Date: ${v.violation_date?.substring(0, 10) || 'N/A'}`);
            console.log(`      Fine: $${fineAmount.toFixed(2)}`);
            console.log(`      Status: ${v.hearing_status || 'Unknown'}`);
            console.log(`      Address: ${v.violation_location_house} ${v.violation_location_street_name}`);
          });
        }
      } else {
        console.log(`   ❌ Failed: ${dsnyResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test DOB Permits
    console.log('\n🏗️  DOB PERMITS:');
    try {
      const houseNum = building.address.split(' ')[0];
      const streetName = building.address.split(',')[0].split(' ').slice(1).join(' ');
      // Fetch permits by house number first
      const dobUrl = `https://data.cityofnewyork.us/resource/ipu4-2q9a.json?house__=${houseNum}&$limit=100`;
      const dobResponse = await fetch(dobUrl);
      if (dobResponse.ok) {
        let permits = await dobResponse.json();
        // Filter by street name client-side
        const streetUpper = streetName.toUpperCase();
        permits = permits.filter(p => p.street_name && p.street_name.includes(streetUpper));
        console.log(`   ✅ Found ${permits.length} permits`);
        if (permits.length > 0) {
          permits.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.job_type || 'Unknown'}`);
            console.log(`      Job #: ${p.job__ || 'N/A'}`);
            console.log(`      Status: ${p.permit_status || 'Unknown'}`);
            console.log(`      Filing Date: ${p.filing_date || 'N/A'}`);
            console.log(`      Issuance Date: ${p.issuance_date || 'N/A'}`);
            console.log(`      Address: ${p.house__} ${p.street_name}, ${p.borough}`);
          });
        }
      } else {
        console.log(`   ❌ Failed: ${dobResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test HPD Violations
    console.log('\n🏘️  HPD VIOLATIONS:');
    try {
      const houseNum = building.address.split(' ')[0];
      const streetName = building.address.split(',')[0].split(' ').slice(1).join(' ');
      const hpdUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?housenumber=${houseNum}&streetname=${encodeURIComponent(streetName.toUpperCase())}&$limit=10&$order=inspectiondate DESC`;
      const hpdResponse = await fetch(hpdUrl);
      if (hpdResponse.ok) {
        const violations = await hpdResponse.json();
        console.log(`   ✅ Found ${violations.length} violations`);
        if (violations.length > 0) {
          violations.slice(0, 3).forEach((v, i) => {
            console.log(`   ${i + 1}. ${v.novdescription || 'Unknown'}`);
            console.log(`      Class: ${v.violationclass || 'N/A'}`);
            console.log(`      Status: ${v.currentstatus || 'Unknown'}`);
            console.log(`      Date: ${v.inspectiondate?.substring(0, 10) || 'N/A'}`);
            console.log(`      Address: ${v.housenumber} ${v.streetname}, ${v.boro}`);
          });
        }
      } else {
        console.log(`   ❌ Failed: ${hpdResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Delay between buildings to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n📊 SUMMARY');
  console.log('==========================================');
  console.log('Test complete. Check results above for each building.');
  console.log('\nKey Locations:');
  console.log('• 131 Perry Street (ID: 10) - Local Law Project');
  console.log('• 138 West 17th Street (ID: 5) - Local Law Project');
}

testBuildingHydration().catch(console.error);
