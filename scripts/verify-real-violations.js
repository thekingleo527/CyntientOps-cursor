#!/usr/bin/env node

/**
 * Verify Real Violations - Live NYC API Test
 */

const https = require('https');

function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function verifyViolations() {
  console.log('\n🔍 Verifying Real NYC Violations Data\n');
  console.log('=' .repeat(80));

  // Test 135-139 West 17th Street (BBL 1007930017)
  console.log('\n📍 Building: 135-139 West 17th Street');
  console.log('BBL: 1007930017\n');

  try {
    // HPD Violations
    const hpdURL = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='1007930017'&$limit=1000`;
    const hpdData = await fetchAPI(hpdURL);

    const openHPD = hpdData.filter(v => v.violationstatus === 'Open');
    const closedHPD = hpdData.filter(v => v.violationstatus === 'Close');

    console.log(`✅ HPD API Response:`);
    console.log(`   Total Violations: ${hpdData.length}`);
    console.log(`   Open Violations: ${openHPD.length}`);
    console.log(`   Closed Violations: ${closedHPD.length}\n`);

    if (openHPD.length > 0) {
      console.log(`📋 Open HPD Violations:`);
      openHPD.forEach((v, i) => {
        console.log(`   ${i + 1}. ID: ${v.violationid}`);
        console.log(`      Status: ${v.currentstatus}`);
        console.log(`      Date: ${v.inspectiondate}`);
        console.log(`      Description: ${v.novdescription?.substring(0, 80)}...`);
        console.log('');
      });
    }

    // DOB Violations
    const dobURL = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=block='793' and lot='17' and boro='1'&$limit=1000`;
    const dobData = await fetchAPI(dobURL);

    console.log(`✅ DOB API Response:`);
    console.log(`   Total Violations: ${dobData.length}\n`);

    if (dobData.length > 0) {
      console.log(`📋 DOB Violations:`);
      dobData.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i + 1}. Number: ${v.number}`);
        console.log(`      Status: ${v.violation_status || v.status}`);
        console.log(`      Type: ${v.violation_type || v.violation_category}`);
        console.log('');
      });
    }

    // ECB Violations (DSNY)
    const ecbURL = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=respondent_house_number='135' and respondent_street like '%WEST 17%'&$limit=1000`;
    const ecbData = await fetchAPI(ecbURL);

    console.log(`✅ ECB API Response:`);
    console.log(`   Total Violations: ${ecbData.length}\n`);

    if (ecbData.length > 0) {
      console.log(`📋 ECB Violations:`);
      ecbData.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i + 1}. Ticket: ${v.ticket_number || v.isn_dob_bis_extract}`);
        console.log(`      Status: ${v.ecb_violation_status || v.hearing_status}`);
        console.log(`      Type: ${v.violation_type || v.issuing_agency}`);
        console.log('');
      });
    }

    console.log('=' .repeat(80));
    console.log('\n✅ Verification Complete!\n');
    console.log(`Summary for 135-139 West 17th Street:`);
    console.log(`  HPD: ${openHPD.length} open violations`);
    console.log(`  DOB: ${dobData.length} violations`);
    console.log(`  ECB: ${ecbData.length} violations\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyViolations();
