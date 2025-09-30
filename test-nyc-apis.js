/**
 * 🧪 NYC API Integration Test Script
 * Tests real API keys against NYC Open Data endpoints
 */

const axios = require('axios');

// API Keys from NYCAPIService.ts
const API_KEYS = {
  DSNY_API_TOKEN: "P1XfR3qQk9vN2wB8yH4mJ7pL5sK6tG9zC0dF2aE8",
  HPD_API_KEY: "d4f7b6c9e2a1f8h5k3j9m6n0q2w8r7t5y1u4i8o6",
  DOB_SUBSCRIBER_KEY: "3e9f1a5d7c2b8h6k4j0m9n3q5w7r1t8y2u6i4o0p",
};

const BASE_URL = "https://data.cityofnewyork.us/resource";

// Test building: 12 West 18th Street (from buildings.json)
const TEST_ADDRESS = "12 West 18th Street, New York, NY";
const TEST_BBL = "1008400026"; // Sample BBL for Manhattan building

console.log('🧪 Starting NYC API Integration Tests...\n');

// Test 1: HPD Violations API
async function testHPDViolations() {
  console.log('📋 Test 1: HPD Violations API');
  console.log('Endpoint: /wvxf-dwi5.json');

  try {
    const response = await axios.get(`${BASE_URL}/wvxf-dwi5.json`, {
      headers: {
        'X-App-Token': API_KEYS.HPD_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        '$limit': 5,
        '$order': 'inspectiondate DESC'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('✅ HPD Violations API: SUCCESS');
      console.log(`   Retrieved ${response.data.length} violations`);

      if (response.data.length > 0) {
        const violation = response.data[0];
        console.log(`   Sample Violation:`);
        console.log(`   - ID: ${violation.violationid || 'N/A'}`);
        console.log(`   - Address: ${violation.housenumber || ''} ${violation.streetname || ''}`);
        console.log(`   - Class: ${violation.class || 'N/A'}`);
        console.log(`   - Status: ${violation.currentstatus || 'N/A'}`);
        console.log(`   - Inspection Date: ${violation.inspectiondate || 'N/A'}`);
      }
      return { success: true, count: response.data.length };
    }
  } catch (error) {
    console.log('❌ HPD Violations API: FAILED');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return { success: false, error: error.message };
  }
  console.log('');
}

// Test 2: DSNY Collection Schedule API
async function testDSNYSchedule() {
  console.log('\n🗑️  Test 2: DSNY Collection Schedule API');
  console.log('Endpoint: /8rma-cm9c.json');

  try {
    const response = await axios.get(`${BASE_URL}/8rma-cm9c.json`, {
      headers: {
        'X-App-Token': API_KEYS.DSNY_API_TOKEN,
        'Content-Type': 'application/json'
      },
      params: {
        '$limit': 5
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('✅ DSNY Collection Schedule API: SUCCESS');
      console.log(`   Retrieved ${response.data.length} collection schedules`);

      if (response.data.length > 0) {
        const schedule = response.data[0];
        console.log(`   Sample Schedule:`);
        console.log(`   - Borough: ${schedule.borough || 'N/A'}`);
        console.log(`   - Community District: ${schedule.communitydistrict || 'N/A'}`);
        console.log(`   - Refuse Days: ${schedule.refuse_days || 'N/A'}`);
        console.log(`   - Recycling Days: ${schedule.recycling_days || 'N/A'}`);
      }
      return { success: true, count: response.data.length };
    }
  } catch (error) {
    console.log('❌ DSNY Collection Schedule API: FAILED');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return { success: false, error: error.message };
  }
  console.log('');
}

// Test 3: DOB Permits API
async function testDOBPermits() {
  console.log('\n🏗️  Test 3: DOB Permits API');
  console.log('Endpoint: /ipu4-2q9a.json');

  try {
    const response = await axios.get(`${BASE_URL}/ipu4-2q9a.json`, {
      headers: {
        'X-App-Token': API_KEYS.DOB_SUBSCRIBER_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        '$limit': 5,
        '$order': 'issuance_date DESC'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('✅ DOB Permits API: SUCCESS');
      console.log(`   Retrieved ${response.data.length} permits`);

      if (response.data.length > 0) {
        const permit = response.data[0];
        console.log(`   Sample Permit:`);
        console.log(`   - Job Number: ${permit.job__ || 'N/A'}`);
        console.log(`   - Address: ${permit.house__ || ''} ${permit.street_name || ''}`);
        console.log(`   - Work Type: ${permit.work_type || 'N/A'}`);
        console.log(`   - Permit Status: ${permit.permit_status || 'N/A'}`);
        console.log(`   - Issuance Date: ${permit.issuance_date || 'N/A'}`);
      }
      return { success: true, count: response.data.length };
    }
  } catch (error) {
    console.log('❌ DOB Permits API: FAILED');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return { success: false, error: error.message };
  }
  console.log('');
}

// Test 4: DOB Complaints API (Bonus)
async function testDOBComplaints() {
  console.log('\n📢 Test 4: DOB Complaints API (Bonus)');
  console.log('Endpoint: /eabe-havv.json');

  try {
    const response = await axios.get(`${BASE_URL}/eabe-havv.json`, {
      headers: {
        'X-App-Token': API_KEYS.DOB_SUBSCRIBER_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        '$limit': 5,
        '$order': 'date_entered DESC'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('✅ DOB Complaints API: SUCCESS');
      console.log(`   Retrieved ${response.data.length} complaints`);

      if (response.data.length > 0) {
        const complaint = response.data[0];
        console.log(`   Sample Complaint:`);
        console.log(`   - Complaint Number: ${complaint.complaint_number || 'N/A'}`);
        console.log(`   - Category: ${complaint.complaint_category || 'N/A'}`);
        console.log(`   - Status: ${complaint.status || 'N/A'}`);
        console.log(`   - Date: ${complaint.date_entered || 'N/A'}`);
      }
      return { success: true, count: response.data.length };
    }
  } catch (error) {
    console.log('❌ DOB Complaints API: FAILED');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return { success: false, error: error.message };
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 NYC Open Data API Integration Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {
    hpd: await testHPDViolations(),
    dsny: await testDSNYSchedule(),
    dob: await testDOBPermits(),
    complaints: await testDOBComplaints()
  };

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════════');

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.values(results).length;

  console.log(`\n✅ HPD Violations API: ${results.hpd.success ? 'PASS' : 'FAIL'}`);
  if (results.hpd.success) {
    console.log(`   Retrieved ${results.hpd.count} records`);
  }

  console.log(`\n✅ DSNY Collection API: ${results.dsny.success ? 'PASS' : 'FAIL'}`);
  if (results.dsny.success) {
    console.log(`   Retrieved ${results.dsny.count} records`);
  }

  console.log(`\n✅ DOB Permits API: ${results.dob.success ? 'PASS' : 'FAIL'}`);
  if (results.dob.success) {
    console.log(`   Retrieved ${results.dob.count} records`);
  }

  console.log(`\n✅ DOB Complaints API: ${results.complaints.success ? 'PASS' : 'FAIL'}`);
  if (results.complaints.success) {
    console.log(`   Retrieved ${results.complaints.count} records`);
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`Overall: ${successCount}/${totalTests} tests passed`);
  console.log(`Status: ${successCount === totalTests ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  if (successCount === totalTests) {
    console.log('🎉 All API keys are working correctly!');
    console.log('🔌 Real-world data is being successfully retrieved from NYC Open Data');
    console.log('✅ Ready to hydrate compliance pages, DOB permits, and DSNY schedules\n');
  } else {
    console.log('⚠️  Some API keys may need to be updated or have rate limiting issues');
    console.log('📝 Check the error messages above for details\n');
  }

  return results;
}

// Execute tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});