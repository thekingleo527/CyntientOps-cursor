const fetch = require('node-fetch');

async function testDSNYViolations() {
  console.log('🗑️ Testing DSNY Violations API...');
  console.log('=====================================');
  
  // Test different DSNY endpoints
  const endpoints = [
    {
      name: 'DSNY Violations (ebb7-mvp5)',
      url: 'https://data.cityofnewyork.us/resource/ebb7-mvp5.json'
    },
    {
      name: 'DSNY Collection Schedule (8rma-cm9c)', 
      url: 'https://data.cityofnewyork.us/resource/8rma-cm9c.json'
    },
    {
      name: 'DSNY Violations (5hyu-4b8h)',
      url: 'https://data.cityofnewyork.us/resource/5hyu-4b8h.json'
    },
    {
      name: 'DSNY Violations (7x5e-2fxh)',
      url: 'https://data.cityofnewyork.us/resource/7x5e-2fxh.json'
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url + '?$limit=5');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: Found ${data.length} records`);
        if (data.length > 0) {
          console.log('   📋 Sample record fields:', Object.keys(data[0]));
          if (data[0].address) {
            console.log(`   📍 Sample address: ${data[0].address}`);
          }
          if (data[0].violation_type) {
            console.log(`   ⚠️  Sample violation: ${data[0].violation_type}`);
          }
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test specific addresses
  console.log('\n🏢 Testing specific building addresses...');
  const testAddresses = [
    '123 1st Avenue',
    '68 Perry Street', 
    '12 West 18th Street',
    '104 Franklin Street'
  ];
  
  for (const address of testAddresses) {
    try {
      console.log(`\n🔍 Searching for: ${address}`);
      const response = await fetch(`https://data.cityofnewyork.us/resource/ebb7-mvp5.json?$where=address like '%${encodeURIComponent(address)}%'&$limit=10`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Found ${data.length} violations for ${address}`);
        if (data.length > 0) {
          data.forEach((violation, index) => {
            console.log(`   ${index + 1}. ${violation.violation_type || 'Unknown'} - ${violation.violation_date || 'No date'}`);
          });
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testDSNYViolations();
