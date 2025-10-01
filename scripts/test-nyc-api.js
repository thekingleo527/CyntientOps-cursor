/**
 * Test NYC Open Data APIs (Public Access)
 * Tests whether data is accessible without API keys
 */

// Node.js 18+ has built-in fetch

async function testPublicEndpoint(name, url, description) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`   ${description}`);
  console.log(`   URL: ${url}`);

  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      console.log(`   ❌ Failed: HTTP ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const recordCount = Array.isArray(data) ? data.length : (data.length || 0);

    console.log(`   ✅ Success!`);
    console.log(`   📊 Records: ${recordCount}`);
    console.log(`   ⚡ Latency: ${latency}ms`);
    console.log(`   📝 Sample: ${JSON.stringify(data[0] || data, null, 2).substring(0, 200)}...`);

    return true;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   ⚡ Latency: ${latency}ms`);
    return false;
  }
}

async function main() {
  console.log('🗽 NYC Open Data API - Public Access Test');
  console.log('==========================================\n');

  const tests = [
    {
      name: 'HPD Violations',
      url: 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json?bin=1001026&$limit=5',
      description: 'Housing Preservation & Development violations'
    },
    {
      name: 'DOB Violations',
      url: 'https://data.cityofnewyork.us/resource/3h2n-5cm9.json?bin=1001026&$limit=5',
      description: 'Department of Buildings violations'
    },
    {
      name: '311 Service Requests',
      url: 'https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5',
      description: '311 complaints and service requests'
    },
    {
      name: 'DOB Job Applications',
      url: 'https://data.cityofnewyork.us/resource/ic3t-wcy2.json?$limit=5',
      description: 'Department of Buildings permits'
    },
    {
      name: 'DSNY Collection Schedule',
      url: 'https://data.cityofnewyork.us/resource/8rma-fjni.json?$limit=5',
      description: 'Sanitation collection schedules'
    }
  ];

  let successCount = 0;

  for (const test of tests) {
    const success = await testPublicEndpoint(test.name, test.url, test.description);
    if (success) successCount++;
  }

  console.log('\n');
  console.log('==========================================');
  console.log(`📊 Results: ${successCount}/${tests.length} endpoints accessible`);
  console.log('==========================================\n');

  if (successCount === tests.length) {
    console.log('✅ All NYC Open Data endpoints are PUBLIC!');
    console.log('🔑 API keys are OPTIONAL (only for higher rate limits)');
    console.log('');
    console.log('Rate Limits:');
    console.log('  Without token: ~1000 requests/day (shared pool)');
    console.log('  With token:    1000 requests/hour per app');
    console.log('');
  } else {
    console.log('⚠️  Some endpoints may require authentication');
  }
}

main().catch(console.error);
