const fetch = require('node-fetch');

async function testDSNYEnforcement() {
  console.log('🗑️ Testing DSNY Enforcement & Violations APIs...');
  console.log('================================================');
  
  // Test different DSNY enforcement endpoints
  const endpoints = [
    {
      name: 'DSNY Enforcement Actions',
      url: 'https://data.cityofnewyork.us/resource/7x5e-2fxh.json'
    },
    {
      name: 'DSNY Violations (Alternative)',
      url: 'https://data.cityofnewyork.us/resource/5hyu-4b8h.json'
    },
    {
      name: 'DSNY Collection Data',
      url: 'https://data.cityofnewyork.us/resource/ebb7-mvp5.json'
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
      
      const response = await fetch(endpoint.url + '?$limit=3');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: Found ${data.length} records`);
        if (data.length > 0) {
          console.log('   📋 Sample record fields:', Object.keys(data[0]).slice(0, 10));
          // Look for address-related fields
          const addressFields = Object.keys(data[0]).filter(key => 
            key.toLowerCase().includes('address') || 
            key.toLowerCase().includes('street') ||
            key.toLowerCase().includes('location')
          );
          if (addressFields.length > 0) {
            console.log('   📍 Address fields found:', addressFields);
          }
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test with different query parameters
  console.log('\n🔍 Testing with different query parameters...');
  
  const testQueries = [
    '?$limit=5',
    '?$select=*&$limit=3',
    '?$where=1=1&$limit=3',
    '?$order=:id&$limit=3'
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing query: ${query}`);
      const response = await fetch(`https://data.cityofnewyork.us/resource/7x5e-2fxh.json${query}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: Found ${data.length} records`);
        if (data.length > 0) {
          console.log('   📋 First record keys:', Object.keys(data[0]).slice(0, 15));
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testDSNYEnforcement();
