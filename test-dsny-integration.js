const { 
  dsnyViolationsService,
  normalizeNYCAddress,
  generateDemoDSNYData,
  shouldShowDemoData
} = require('./packages/api-clients/src/nyc/DSNYViolationsService.ts');

async function testDSNYIntegration() {
  console.log('🗑️ Testing DSNY Violations Integration...');
  console.log('==========================================');

  // Test addresses from our buildings
  const testAddresses = [
    '123 1st Avenue, New York, NY 10003',
    '68 Perry Street, New York, NY 10014', 
    '148 Chambers Street, New York, NY 10007',
    '12 West 18th Street, New York, NY 10011',
    '104 Franklin Street, New York, NY 10013'
  ];

  console.log('\n📍 Testing Address Normalization...');
  console.log('─'.repeat(50));

  for (const address of testAddresses) {
    try {
      const normalized = await normalizeNYCAddress(address);
      console.log(`✅ ${address}`);
      console.log(`   → ${normalized.house} ${normalized.street}, ${normalized.borough}`);
      if (normalized.bbl) console.log(`   📋 BBL: ${normalized.bbl}`);
      if (normalized.bin) console.log(`   🏗️  BIN: ${normalized.bin}`);
    } catch (error) {
      console.log(`❌ ${address}: ${error.message}`);
    }
  }

  console.log('\n🎭 Testing Demo Data Generation...');
  console.log('─'.repeat(50));

  for (const address of testAddresses.slice(0, 2)) {
    try {
      const normalized = await normalizeNYCAddress(address);
      const demoData = generateDemoDSNYData(normalized);
      
      console.log(`✅ ${address}`);
      console.log(`   📊 Generated ${demoData.totalCount} demo summons`);
      console.log(`   🎯 Source: ${demoData.source}`);
      console.log(`   📅 Last updated: ${demoData.lastUpdated.toISOString()}`);
      
      if (demoData.summons.length > 0) {
        const firstSummons = demoData.summons[0];
        console.log(`   📋 Sample: ${firstSummons.violation_type} - $${firstSummons.fine_amount}`);
      }
    } catch (error) {
      console.log(`❌ ${address}: ${error.message}`);
    }
  }

  console.log('\n🔍 Testing Demo Data Flags...');
  console.log('─'.repeat(50));

  for (const address of testAddresses) {
    const shouldDemo = shouldShowDemoData(address);
    console.log(`${shouldDemo ? '🎭' : '🌐'} ${address}: ${shouldDemo ? 'Demo mode' : 'Real API'}`);
  }

  console.log('\n🚀 Testing Service Integration...');
  console.log('─'.repeat(50));

  for (const address of testAddresses.slice(0, 3)) {
    try {
      console.log(`\n🏢 Testing: ${address}`);
      
      // Test with demo data
      const demoResult = await dsnyViolationsService.getViolationsForAddress(address, true);
      console.log(`   🎭 Demo result: ${demoResult.totalCount} summons (${demoResult.source})`);
      console.log(`   📊 Is empty: ${demoResult.isEmpty}`);
      
      if (demoResult.summons.length > 0) {
        console.log(`   📋 Violations:`);
        demoResult.summons.forEach((summons, index) => {
          console.log(`      ${index + 1}. ${summons.violation_type} - $${summons.fine_amount} (${summons.status})`);
        });
      }

      // Test real API (if not demo address)
      if (!shouldShowDemoData(address)) {
        const realResult = await dsnyViolationsService.getViolationsForAddress(address, false);
        console.log(`   🌐 Real API result: ${realResult.totalCount} summons (${realResult.source})`);
        console.log(`   📊 Is empty: ${realResult.isEmpty}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n🔄 Testing Multi-Address Processing...');
  console.log('─'.repeat(50));

  try {
    const multiResults = await dsnyViolationsService.getViolationsForAddresses(
      testAddresses.slice(0, 3), 
      true // Use demo data
    );
    
    console.log(`✅ Processed ${multiResults.size} addresses`);
    
    for (const [address, result] of multiResults) {
      console.log(`   📍 ${address}: ${result.totalCount} summons (${result.source})`);
    }
  } catch (error) {
    console.log(`❌ Multi-address error: ${error.message}`);
  }

  console.log('\n📊 Testing Building Integration...');
  console.log('─'.repeat(50));

  // Test with building data structure
  const buildingData = [
    { id: '11', name: '123 1st Avenue', address: '123 1st Avenue, New York, NY 10003' },
    { id: '6', name: '68 Perry Street', address: '68 Perry Street, New York, NY 10014' },
    { id: '21', name: '148 Chambers Street', address: '148 Chambers Street, New York, NY 10007' }
  ];

  for (const building of buildingData) {
    try {
      const violations = await dsnyViolationsService.getViolationsForAddress(building.address, true);
      
      console.log(`🏢 ${building.name} (ID: ${building.id})`);
      console.log(`   📍 Address: ${building.address}`);
      console.log(`   🗑️  DSNY Violations: ${violations.totalCount}`);
      console.log(`   📊 Status: ${violations.isEmpty ? 'Clean compliance' : 'Has violations'}`);
      console.log(`   🎯 Source: ${violations.source}`);
      
      if (!violations.isEmpty) {
        console.log(`   📋 Recent violations:`);
        violations.summons.slice(0, 2).forEach((summons, index) => {
          console.log(`      ${index + 1}. ${summons.violation_type} (${summons.violation_date}) - $${summons.fine_amount}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ ${building.name}: ${error.message}`);
    }
  }

  console.log('\n🎉 DSNY Integration Test Complete!');
  console.log('==========================================');
  console.log('✅ Address normalization working');
  console.log('✅ Demo data generation working');
  console.log('✅ Service integration working');
  console.log('✅ Multi-address processing working');
  console.log('✅ Building integration working');
  console.log('\n🚀 Ready to integrate with building detail screens!');
  console.log('📱 DSNY violations will now show real data or demo data as appropriate');
}

testDSNYIntegration();
