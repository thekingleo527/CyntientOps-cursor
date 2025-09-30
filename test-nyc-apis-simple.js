/**
 * 🧪 NYC API Integration Test Script (Simple Version)
 * Tests real API keys against NYC Open Data endpoints using fetch
 */

// API Keys from NYCAPIService.ts
const API_KEYS = {
  DSNY_API_TOKEN: "P1XfR3qQk9vN2wB8yH4mJ7pL5sK6tG9zC0dF2aE8",
  HPD_API_KEY: "d4f7b6c9e2a1f8h5k3j9m6n0q2w8r7t5y1u4i8o6",
  DOB_SUBSCRIBER_KEY: "3e9f1a5d7c2b8h6k4j0m9n3q5w7r1t8y2u6i4o0p",
};

const BASE_URL = "https://data.cityofnewyork.us/resource";

console.log('🧪 Starting NYC API Integration Tests...\n');

// Test 1: HPD Violations API
async function testHPDViolations() {
  console.log('📋 Test 1: HPD Violations API');
  console.log('Endpoint: /wvxf-dwi5.json');

  try {
    const response = await fetch(`${BASE_URL}/wvxf-dwi5.json?$limit=5&$order=inspectiondate DESC`, {
      headers: {
        'X-App-Token': API_KEYS.HPD_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ HPD Violations API: SUCCESS');
      console.log(`   Retrieved ${data.length} violations`);

      if (data.length > 0) {
        const violation = data[0];
        console.log(`   Sample Violation:`);
        console.log(`   - ID: ${violation.violationid || 'N/A'}`);
        console.log(`   - Address: ${violation.housenumber || ''} ${violation.streetname || ''}`);
        console.log(`   - Class: ${violation.class || 'N/A'}`);
        console.log(`   - Status: ${violation.currentstatus || 'N/A'}`);
        console.log(`   - Inspection Date: ${violation.inspectiondate || 'N/A'}`);
      }
      return { success: true, count: data.length };
    } else {
      console.log('❌ HPD Violations API: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ HPD Violations API: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 2: DSNY Collection Schedule API
async function testDSNYSchedule() {
  console.log('\n🗑️  Test 2: DSNY Collection Schedule API');
  console.log('Endpoint: /8rma-cm9c.json');

  try {
    const response = await fetch(`${BASE_URL}/8rma-cm9c.json?$limit=5`, {
      headers: {
        'X-App-Token': API_KEYS.DSNY_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DSNY Collection Schedule API: SUCCESS');
      console.log(`   Retrieved ${data.length} collection schedules`);

      if (data.length > 0) {
        const schedule = data[0];
        console.log(`   Sample Schedule:`);
        console.log(`   - Borough: ${schedule.borough || 'N/A'}`);
        console.log(`   - Community District: ${schedule.communitydistrict || 'N/A'}`);
        console.log(`   - Refuse Days: ${schedule.refuse_days || 'N/A'}`);
        console.log(`   - Recycling Days: ${schedule.recycling_days || 'N/A'}`);
      }
      return { success: true, count: data.length };
    } else {
      console.log('❌ DSNY Collection Schedule API: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ DSNY Collection Schedule API: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 3: DOB Permits API
async function testDOBPermits() {
  console.log('\n🏗️  Test 3: DOB Permits API');
  console.log('Endpoint: /ipu4-2q9a.json');

  try {
    const response = await fetch(`${BASE_URL}/ipu4-2q9a.json?$limit=5&$order=issuance_date DESC`, {
      headers: {
        'X-App-Token': API_KEYS.DOB_SUBSCRIBER_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DOB Permits API: SUCCESS');
      console.log(`   Retrieved ${data.length} permits`);

      if (data.length > 0) {
        const permit = data[0];
        console.log(`   Sample Permit:`);
        console.log(`   - Job Number: ${permit.job__ || 'N/A'}`);
        console.log(`   - Address: ${permit.house__ || ''} ${permit.street_name || ''}`);
        console.log(`   - Work Type: ${permit.work_type || 'N/A'}`);
        console.log(`   - Permit Status: ${permit.permit_status || 'N/A'}`);
        console.log(`   - Issuance Date: ${permit.issuance_date || 'N/A'}`);
      }
      return { success: true, count: data.length };
    } else {
      console.log('❌ DOB Permits API: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ DOB Permits API: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 4: DOB Complaints API (Bonus)
async function testDOBComplaints() {
  console.log('\n📢 Test 4: DOB Complaints API (Bonus)');
  console.log('Endpoint: /eabe-havv.json');

  try {
    const response = await fetch(`${BASE_URL}/eabe-havv.json?$limit=5&$order=date_entered DESC`, {
      headers: {
        'X-App-Token': API_KEYS.DOB_SUBSCRIBER_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DOB Complaints API: SUCCESS');
      console.log(`   Retrieved ${data.length} complaints`);

      if (data.length > 0) {
        const complaint = data[0];
        console.log(`   Sample Complaint:`);
        console.log(`   - Complaint Number: ${complaint.complaint_number || 'N/A'}`);
        console.log(`   - Category: ${complaint.complaint_category || 'N/A'}`);
        console.log(`   - Status: ${complaint.status || 'N/A'}`);
        console.log(`   - Date: ${complaint.date_entered || 'N/A'}`);
      }
      return { success: true, count: data.length };
    } else {
      console.log('❌ DOB Complaints API: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ DOB Complaints API: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
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
