const fetch = require('node-fetch');

async function checkSpringStreetViolations() {
  console.log('🏢 178 Spring Street - Detailed Violation Analysis');
  console.log('='.repeat(60));

  const OATH_BASE = 'https://data.cityofnewyork.us/resource/jz4z-kudi.json';
  
  try {
    const url = `${OATH_BASE}?violation_location_house=178&violation_location_street_name=SPRING%20STREET&violation_location_borough=MANHATTAN&$limit=20`;
    console.log('🔍 Fetching violations...');
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`\n📊 Total Violations Found: ${data.length}`);
    console.log('');

    let totalOutstanding = 0;
    let defaulted = 0;
    let docketed = 0;
    let paid = 0;
    let newIssuance = 0;

    data.forEach((v, i) => {
      const fine = parseFloat(v.balance_due) || 0;
      totalOutstanding += fine;
      
      const status = (v.hearing_status || v.compliance_status || '').toUpperCase();
      if (status.includes('DEFAULTED')) defaulted++;
      else if (status.includes('DOCKETED')) docketed++;
      else if (status.includes('PAID')) paid++;
      else if (status.includes('NEW ISSUANCE')) newIssuance++;
      
      console.log(`${i+1}. Ticket: ${v.ticket_number}`);
      console.log(`   Agency: ${v.issuing_agency}`);
      console.log(`   Date: ${v.violation_date}`);
      console.log(`   Fine: $${fine}`);
      console.log(`   Status: ${status}`);
      
      // Show violation description if available
      if (v.charge_1_code_description) {
        console.log(`   Description: ${v.charge_1_code_description}`);
      }
      if (v.charge_2_code_description) {
        console.log(`   Additional: ${v.charge_2_code_description}`);
      }
      if (v.violation_details) {
        console.log(`   Details: ${v.violation_details}`);
      }
      
      // Show charge codes
      if (v.charge_1_code) {
        console.log(`   Charge 1: ${v.charge_1_code} - ${v.charge_1_code_section || ''}`);
      }
      if (v.charge_2_code) {
        console.log(`   Charge 2: ${v.charge_2_code} - ${v.charge_2_code_section || ''}`);
      }
      if (v.charge_3_code) {
        console.log(`   Charge 3: ${v.charge_3_code} - ${v.charge_3_code_section || ''}`);
      }
      
      console.log('');
    });

    console.log('📊 SUMMARY:');
    console.log(`Total Outstanding: $${totalOutstanding.toFixed(2)}`);
    console.log(`Status Breakdown:`);
    console.log(`  - Defaulted: ${defaulted}`);
    console.log(`  - Docketed: ${docketed}`);
    console.log(`  - Paid: ${paid}`);
    console.log(`  - New Issuance: ${newIssuance}`);
    
    // Group by agency
    const agencies = {};
    data.forEach(v => {
      const agency = v.issuing_agency || 'UNKNOWN';
      if (!agencies[agency]) agencies[agency] = 0;
      agencies[agency]++;
    });
    
    console.log('\n🏛️ Violations by Agency:');
    Object.entries(agencies).forEach(([agency, count]) => {
      console.log(`  - ${agency}: ${count} violations`);
    });
    
    // Show most recent violations
    const recentViolations = data.slice(0, 5);
    console.log('\n🕒 Most Recent Violations:');
    recentViolations.forEach((v, i) => {
      const fine = parseFloat(v.balance_due) || 0;
      const status = v.hearing_status || v.compliance_status || 'UNKNOWN';
      console.log(`  ${i+1}. ${v.violation_date} - ${v.ticket_number} - $${fine} - ${status}`);
    });

  } catch (error) {
    console.error('❌ Error fetching violations:', error.message);
  }
}

checkSpringStreetViolations();
