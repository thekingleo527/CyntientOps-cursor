#!/usr/bin/env node

const https = require('https');

const buildings = [
  { id: '17', name: '178 Spring St', house: '178', street: 'SPRING', boro: 'MANHATTAN' },
  { id: '18', name: '36 Walker St', house: '36', street: 'WALKER', boro: 'MANHATTAN' },
  { id: '4', name: '104 Franklin St', house: '104', street: 'FRANKLIN', boro: 'MANHATTAN' },
  { id: '6', name: '68 Perry St', house: '68', street: 'PERRY', boro: 'MANHATTAN' },
  { id: '10', name: '131 Perry St', house: '131', street: 'PERRY', boro: 'MANHATTAN' },
  { id: '21', name: '148 Chambers St', house: '148', street: 'CHAMBERS', boro: 'MANHATTAN' }
];

async function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(Array.isArray(parsed) ? parsed : []);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  console.log('🔍 Searching OATH API for DSNY/DOB violations\n');
  console.log('=' .repeat(80));

  for (const b of buildings) {
    console.log(`\n📍 ${b.name}`);

    // OATH API search
    const where = `violation_location_house='${b.house}' and upper(violation_location_street_name) like '%${b.street}%' and upper(violation_location_borough)='${b.boro.toUpperCase()}'`;
    const url = `https://data.cityofnewyork.us/resource/jz4z-kudi.json?$where=${encodeURIComponent(where)}&$limit=1000`;

    const violations = await fetch(url);

    // Filter for DSNY and active violations
    const dsny = violations.filter(v => {
      const agency = (v.issuing_agency || '').toUpperCase();
      const status = (v.hearing_status || '').toUpperCase();
      const isActive = !status.includes('PAID') && !status.includes('DISMISS') && !status.includes('COMPLY');
      return isActive && (agency.includes('SANITATION') || agency.includes('DSNY') || agency.includes('DOS'));
    });

    // Filter for DOB violations
    const dob = violations.filter(v => {
      const agency = (v.issuing_agency || '').toUpperCase();
      const status = (v.hearing_status || '').toUpperCase();
      const isActive = !status.includes('PAID') && !status.includes('DISMISS') && !status.includes('COMPLY');
      return isActive && (agency.includes('BUILDING') || agency.includes('DOB'));
    });

    // Calculate outstanding
    const outstanding = violations
      .filter(v => {
        const status = (v.hearing_status || '').toUpperCase();
        return !status.includes('PAID') && !status.includes('DISMISS');
      })
      .reduce((sum, v) => sum + parseFloat(v.balance_due || v.penalty_imposed || 0), 0);

    console.log(`   Total OATH violations: ${violations.length}`);
    console.log(`   DSNY violations: ${dsny.length}`);
    console.log(`   DOB violations: ${dob.length}`);
    console.log(`   Outstanding: $${outstanding.toFixed(2)}`);

    if (dsny.length > 0 || dob.length > 0) {
      console.log('\n   📋 Violation Details:');
      [...dsny.slice(0, 3), ...dob.slice(0, 3)].forEach(v => {
        console.log(`      - ${v.issuing_agency}: $${v.penalty_imposed || 0} (${v.hearing_status})`);
        console.log(`        ${v.charge_1_code_description || 'N/A'}`);
      });
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '=' .repeat(80));
}

main();
