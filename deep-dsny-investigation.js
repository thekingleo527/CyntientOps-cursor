const fetch = require('node-fetch');

async function deepDSNYInvestigation() {
  console.log('🔍 DEEP DSNY VIOLATIONS INVESTIGATION');
  console.log('=====================================');
  
  const OATH_BASE = 'https://data.cityofnewyork.us/resource/jz4z-kudi.json';
  
  // Test addresses that should have violations
  const testAddresses = [
    { name: '123 1st Avenue', house: '123', street: '1ST AVENUE', borough: 'MANHATTAN' },
    { name: '68 Perry Street', house: '68', street: 'PERRY STREET', borough: 'MANHATTAN' },
    { name: '104 Franklin Street', house: '104', street: 'FRANKLIN STREET', borough: 'MANHATTAN' },
    { name: '148 Chambers Street', house: '148', street: 'CHAMBERS STREET', borough: 'MANHATTAN' }
  ];

  for (const address of testAddresses) {
    console.log(`\n🏢 Testing: ${address.name}`);
    console.log('─'.repeat(50));
    
    // Test 1: Exact address match
    try {
      const url1 = `${OATH_BASE}?violation_location_house=${address.house}&violation_location_street_name=${encodeURIComponent(address.street)}&violation_location_borough=${address.borough}&$limit=10`;
      console.log('📍 Query 1 - Exact address match:');
      console.log(`   URL: ${url1}`);
      
      const response1 = await fetch(url1);
      const data1 = await response1.json();
      console.log(`   Result: ${data1.length} violations found`);
      
      if (data1.length > 0) {
        data1.slice(0, 3).forEach((v, i) => {
          console.log(`   ${i+1}. ${v.ticket_number} - ${v.issuing_agency}`);
          console.log(`      Date: ${v.violation_date} | Fine: $${v.balance_due}`);
          console.log(`      Status: ${v.hearing_status || v.compliance_status}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 2: Broader search with DSNY agencies
    try {
      const dsnyAgencies = [
        'SANITATION POLICE',
        'SANITATION OTHERS', 
        'SANITATION DEPT',
        'DSNY - SANITATION ENFORCEMENT AGENTS'
      ];
      
      for (const agency of dsnyAgencies) {
        const url2 = `${OATH_BASE}?violation_location_house=${address.house}&violation_location_street_name=${encodeURIComponent(address.street)}&violation_location_borough=${address.borough}&issuing_agency=${encodeURIComponent(agency)}&$limit=5`;
        console.log(`\n📍 Query 2 - ${agency}:`);
        
        const response2 = await fetch(url2);
        const data2 = await response2.json();
        console.log(`   Result: ${data2.length} violations found`);
        
        if (data2.length > 0) {
          data2.forEach((v, i) => {
            console.log(`   ${i+1}. ${v.ticket_number} - ${v.issuing_agency}`);
            console.log(`      Date: ${v.violation_date} | Fine: $${v.balance_due}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 3: Check for any violations at this address (no agency filter)
    try {
      const url3 = `${OATH_BASE}?violation_location_house=${address.house}&violation_location_street_name=${encodeURIComponent(address.street)}&violation_location_borough=${address.borough}&$limit=20`;
      console.log(`\n📍 Query 3 - Any violations at address:`);
      
      const response3 = await fetch(url3);
      const data3 = await response3.json();
      console.log(`   Result: ${data3.length} total violations found`);
      
      if (data3.length > 0) {
        // Group by agency
        const agencies = {};
        data3.forEach(v => {
          const agency = v.issuing_agency || 'UNKNOWN';
          if (!agencies[agency]) agencies[agency] = 0;
          agencies[agency]++;
        });
        
        console.log('   Agencies found:');
        Object.entries(agencies).forEach(([agency, count]) => {
          console.log(`   - ${agency}: ${count} violations`);
        });
        
        // Show sample violations
        data3.slice(0, 3).forEach((v, i) => {
          console.log(`   ${i+1}. ${v.ticket_number} - ${v.issuing_agency}`);
          console.log(`      Date: ${v.violation_date} | Fine: $${v.balance_due}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 4: Check all buildings 7-18 for any violations
  console.log('\n🏢 TESTING BUILDINGS 7-18 FOR ANY VIOLATIONS');
  console.log('─'.repeat(60));
  
  const buildings7to18 = [
    { id: '7', name: '112 West 18th Street', house: '112', street: 'WEST 18TH STREET', borough: 'MANHATTAN' },
    { id: '8', name: '41 Elizabeth Street', house: '41', street: 'ELIZABETH STREET', borough: 'MANHATTAN' },
    { id: '9', name: '117 West 17th Street', house: '117', street: 'WEST 17TH STREET', borough: 'MANHATTAN' },
    { id: '10', name: '131 Perry Street', house: '131', street: 'PERRY STREET', borough: 'MANHATTAN' },
    { id: '11', name: '123 1st Avenue', house: '123', street: '1ST AVENUE', borough: 'MANHATTAN' },
    { id: '13', name: '136 West 17th Street', house: '136', street: 'WEST 17TH STREET', borough: 'MANHATTAN' },
    { id: '14', name: 'Rubin Museum', house: '142', street: 'WEST 17TH STREET', borough: 'MANHATTAN' },
    { id: '15', name: '133 East 15th Street', house: '133', street: 'EAST 15TH STREET', borough: 'MANHATTAN' },
    { id: '16', name: 'Stuyvesant Cove Park', house: '1', street: 'STUYVESANT COVE', borough: 'MANHATTAN' },
    { id: '17', name: '178 Spring Street', house: '178', street: 'SPRING STREET', borough: 'MANHATTAN' },
    { id: '18', name: '36 Walker Street', house: '36', street: 'WALKER STREET', borough: 'MANHATTAN' },
    { id: '19', name: '115 7th Avenue', house: '115', street: '7TH AVENUE', borough: 'MANHATTAN' },
    { id: '21', name: '148 Chambers Street', house: '148', street: 'CHAMBERS STREET', borough: 'MANHATTAN' }
  ];

  for (const building of buildings7to18) {
    try {
      const url = `${OATH_BASE}?violation_location_house=${building.house}&violation_location_street_name=${encodeURIComponent(building.street)}&violation_location_borough=${building.borough}&$limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.length > 0) {
        console.log(`\n🏢 ${building.name} (ID: ${building.id}) - ${data.length} violations found!`);
        data.forEach((v, i) => {
          console.log(`   ${i+1}. ${v.ticket_number} - ${v.issuing_agency}`);
          console.log(`      Date: ${v.violation_date} | Fine: $${v.balance_due}`);
          console.log(`      Status: ${v.hearing_status || v.compliance_status}`);
        });
      } else {
        console.log(`✅ ${building.name} (ID: ${building.id}) - No violations found`);
      }
    } catch (error) {
      console.log(`❌ ${building.name} (ID: ${building.id}) - Error: ${error.message}`);
    }
  }

  console.log('\n🎯 INVESTIGATION COMPLETE');
  console.log('========================');
}

deepDSNYInvestigation();
