const fetch = require('node-fetch');

async function testDSNYRealViolations() {
  console.log('🗑️ Testing Real DSNY Violations APIs...');
  console.log('========================================');
  
  // Test different potential DSNY violations endpoints
  const endpoints = [
    {
      name: 'DSNY Violations (fhrw-4uyv)',
      url: 'https://data.cityofnewyork.us/resource/fhrw-4uyv.json'
    },
    {
      name: 'DSNY Violations (7x5e-2fxh) - LL97 Data',
      url: 'https://data.cityofnewyork.us/resource/7x5e-2fxh.json'
    },
    {
      name: 'DSNY Violations (5hyu-4b8h)',
      url: 'https://data.cityofnewyork.us/resource/5hyu-4b8h.json'
    },
    {
      name: 'DSNY Violations (8rma-cm9c)',
      url: 'https://data.cityofnewyork.us/resource/8rma-cm9c.json'
    },
    {
      name: 'DSNY Violations (ebb7-mvp5) - Collection Data',
      url: 'https://data.cityofnewyork.us/resource/ebb7-mvp5.json'
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
          
          // Check if this looks like violations data
          const violationFields = Object.keys(data[0]).filter(key => 
            key.toLowerCase().includes('violation') || 
            key.toLowerCase().includes('ticket') ||
            key.toLowerCase().includes('fine') ||
            key.toLowerCase().includes('penalty') ||
            key.toLowerCase().includes('enforcement')
          );
          
          if (violationFields.length > 0) {
            console.log('   ⚠️  Violation fields found:', violationFields);
          }
          
          // Show sample data
          console.log('   📄 Sample record:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test searching for specific addresses in the working endpoint
  console.log('\n🏢 Testing address search in working endpoints...');
  
  const testAddresses = [
    '123 1st Avenue',
    '68 Perry Street', 
    '12 West 18th Street',
    '104 Franklin Street'
  ];
  
  // Test with the LL97 dataset since it has address_1 field
  for (const address of testAddresses) {
    try {
      console.log(`\n🔍 Searching for: ${address}`);
      const response = await fetch(`https://data.cityofnewyork.us/resource/7x5e-2fxh.json?$where=address_1 like '%${encodeURIComponent(address)}%'&$limit=5`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Found ${data.length} records for ${address}`);
        if (data.length > 0) {
          data.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.address_1} - ${record.primary_property_type || 'Unknown type'}`);
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

testDSNYRealViolations();
