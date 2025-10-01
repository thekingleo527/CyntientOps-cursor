#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const buildings = [
  { id: '1', bbl: '1008197501', block: '819', lot: '7501', boro: '1', name: '12 West 18th St' },
  { id: '3', bbl: '1007930017', block: '793', lot: '17', boro: '1', name: '135-139 West 17th St' },
  { id: '4', bbl: '1001780005', block: '178', lot: '5', boro: '1', name: '104 Franklin St' },
  { id: '5', bbl: '1007927502', block: '792', lot: '7502', boro: '1', name: '138 West 17th St' },
  { id: '6', bbl: '1006210051', block: '621', lot: '51', boro: '1', name: '68 Perry St' },
  { id: '8', bbl: '1002040024', block: '204', lot: '24', boro: '1', name: '41 Elizabeth St' },
  { id: '10', bbl: '1006330028', block: '633', lot: '28', boro: '1', name: '131 Perry St' },
  { id: '11', bbl: '1004490034', block: '449', lot: '34', boro: '1', name: '123 1st Ave' },
  { id: '13', bbl: '1007927507', block: '792', lot: '7507', boro: '1', name: '136 West 17th St' },
  { id: '14', bbl: '1007920064', block: '792', lot: '64', boro: '1', name: 'Rubin Museum' },
  { id: '15', bbl: '1008710030', block: '871', lot: '30', boro: '1', name: '133 East 15th St' },
  { id: '17', bbl: '1004880016', block: '488', lot: '16', boro: '1', name: '178 Spring St' },
  { id: '18', bbl: '1001940014', block: '194', lot: '14', boro: '1', name: '36 Walker St' },
  { id: '21', bbl: '1001377505', block: '137', lot: '7505', boro: '1', name: '148 Chambers St' }
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
  console.log('Building | HPD | DOB | ECB | DSNY');
  console.log('----------------------------------------');

  const results = [];

  for (const b of buildings) {
    // HPD violations
    const hpdUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${b.bbl}' and violationstatus='Open'&$limit=1000`;
    const hpd = await fetch(hpdUrl);
    await new Promise(r => setTimeout(r, 800));

    // DOB violations
    const dobUrl = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=block='${b.block}' and lot='${b.lot}' and boro='${b.boro}'&$limit=1000`;
    const dob = await fetch(dobUrl);
    await new Promise(r => setTimeout(r, 800));

    // ECB violations (includes DSNY)
    const ecbUrl = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=respondent_boro='${b.boro}' and block='${b.block}' and lot='${b.lot}'&$limit=1000`;
    const ecb = await fetch(ecbUrl);
    await new Promise(r => setTimeout(r, 800));

    // Filter active ECB violations
    const activeECB = ecb.filter(v => {
      const status = (v.ecb_violation_status || v.hearing_status || '').toUpperCase();
      return !status.includes('RESOLVE') && !status.includes('DISMISS') && !status.includes('PAID');
    });

    // Filter DSNY violations
    const dsny = activeECB.filter(v => {
      const agency = (v.issuing_agency || '').toUpperCase();
      return agency.includes('SANITATION') || agency.includes('DSNY');
    });

    const hpdCount = hpd.length;
    const dobCount = dob.length;
    const ecbCount = activeECB.length;
    const dsnyCount = dsny.length;

    results.push({
      id: b.id,
      name: b.name,
      hpd: hpdCount,
      dob: dobCount,
      dsny: dsnyCount,
      ecb: ecbCount - dsnyCount, // Non-DSNY ECB violations
      outstanding: hpdCount + dobCount + ecbCount,
      score: Math.max(30, 100 - ((hpdCount + dobCount + ecbCount) * 3))
    });

    console.log(`${b.id.padEnd(8)} | ${String(hpdCount).padEnd(3)} | ${String(dobCount).padEnd(3)} | ${String(ecbCount).padEnd(3)} | ${dsnyCount}`);
  }

  console.log('\n📊 Complete Results:\n');
  console.log(JSON.stringify(results, null, 2));

  // Save to file
  const outputPath = path.join(__dirname, '../audit-reports/complete-violations-2025-10-01.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    searchDate: new Date().toISOString(),
    buildings: results,
    summary: {
      totalHPD: results.reduce((sum, r) => sum + r.hpd, 0),
      totalDOB: results.reduce((sum, r) => sum + r.dob, 0),
      totalDSNY: results.reduce((sum, r) => sum + r.dsny, 0),
      totalECB: results.reduce((sum, r) => sum + r.ecb, 0),
      buildingsWithViolations: results.filter(r => r.outstanding > 0).length
    }
  }, null, 2));

  console.log(`\n✅ Saved to: ${outputPath}\n`);
}

main();
