#!/usr/bin/env node

/**
 * 🚨 Get REAL Violations - CORRECTED LOGIC
 *
 * Previous audits used wrong filter logic.
 * Correct filter: violationstatus='Open' (not currentstatus='OPEN')
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const buildings = [
  { id: '1', name: '12 West 18th Street', bbl: '1008197501', block: '819', lot: '7501', boro: '1' },
  { id: '3', name: '135-139 West 17th Street', bbl: '1007930017', block: '793', lot: '17', boro: '1' },
  { id: '4', name: '104 Franklin Street', bbl: '1001780005', block: '178', lot: '5', boro: '1' },
  { id: '5', name: '138 West 17th Street', bbl: '1007927502', block: '792', lot: '7502', boro: '1' },
  { id: '6', name: '68 Perry Street', bbl: '1006210051', block: '621', lot: '51', boro: '1' },
  { id: '8', name: '41 Elizabeth Street', bbl: '1002040024', block: '204', lot: '24', boro: '1' },
  { id: '10', name: '131 Perry Street', bbl: '1006330028', block: '633', lot: '28', boro: '1' },
  { id: '11', name: '123 1st Avenue', bbl: '1004490034', block: '449', lot: '34', boro: '1' },
  { id: '13', name: '136 West 17th Street', bbl: '1007927507', block: '792', lot: '7507', boro: '1' },
  { id: '14', name: 'Rubin Museum', bbl: '1007920064', block: '792', lot: '64', boro: '1' },
  { id: '15', name: '133 East 15th Street', bbl: '1008710030', block: '871', lot: '30', boro: '1' },
  { id: '17', name: '178 Spring Street', bbl: '1004880016', block: '488', lot: '16', boro: '1' },
  { id: '18', name: '36 Walker Street', bbl: '1001940014', block: '194', lot: '14', boro: '1' },
  { id: '21', name: '148 Chambers Street', bbl: '1001377505', block: '137', lot: '7505', boro: '1' }
];

function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error(`API Error: ${err.message}`);
      resolve([]);
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getHPDViolations(bbl) {
  try {
    // CORRECT FILTER: violationstatus='Open'
    const url = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=bbl='${bbl}' and violationstatus='Open'&$limit=1000`;
    const violations = await fetchAPI(url);
    return violations.length;
  } catch (error) {
    console.error(`Error fetching HPD for BBL ${bbl}:`, error.message);
    return 0;
  }
}

async function getDOBViolations(block, lot, boro) {
  try {
    const url = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=block='${block}' and lot='${lot}' and boro='${boro}'&$limit=1000`;
    const violations = await fetchAPI(url);

    // Filter for active/open DOB violations
    const active = violations.filter(v => {
      const status = (v.violation_status || v.status || '').toUpperCase();
      return status.includes('ACTIVE') || status.includes('OPEN') || status.includes('PENDING');
    });

    return active.length;
  } catch (error) {
    console.error(`Error fetching DOB for block ${block}:`, error.message);
    return 0;
  }
}

async function getECBViolations(block, lot, boro) {
  try {
    // ECB includes DSNY violations
    const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=respondent_boro='${boro}' and block='${block}' and lot='${lot}'&$limit=1000`;
    const violations = await fetchAPI(url);

    // Filter for active/open ECB violations
    const active = violations.filter(v => {
      const status = (v.ecb_violation_status || v.hearing_status || '').toUpperCase();
      return !status.includes('RESOLVE') && !status.includes('DISMISS') && !status.includes('PAID');
    });

    // Separate DSNY violations
    const dsny = active.filter(v => {
      const agency = (v.issuing_agency || '').toUpperCase();
      return agency.includes('SANITATION') || agency.includes('DSNY');
    });

    return {
      ecb: active.length,
      dsny: dsny.length
    };
  } catch (error) {
    console.error(`Error fetching ECB for block ${block}:`, error.message);
    return { ecb: 0, dsny: 0 };
  }
}

async function main() {
  console.log('\n🚨 CyntientOps Real Violations Search - CORRECTED\n');
  console.log('=' .repeat(80));
  console.log('Using CORRECT filter logic: violationstatus=\"Open\"\n');

  const results = [];

  for (const building of buildings) {
    console.log(`🏢 ${building.name} (ID: ${building.id})`);

    // HPD Violations
    const hpd = await getHPDViolations(building.bbl);
    await delay(500); // Rate limiting

    // DOB Violations
    const dob = await getDOBViolations(building.block, building.lot, building.boro);
    await delay(500);

    // ECB Violations (includes DSNY)
    const ecbData = await getECBViolations(building.block, building.lot, building.boro);
    await delay(500);

    const total = hpd + dob + ecbData.ecb;
    const score = total === 0 ? 100 : Math.max(30, 100 - (total * 5));

    results.push({
      id: building.id,
      name: building.name,
      hpd,
      dob,
      dsny: ecbData.dsny,
      ecb: ecbData.ecb - ecbData.dsny, // Non-DSNY ECB violations
      total,
      score
    });

    console.log(`   HPD: ${hpd} | DOB: ${dob} | DSNY: ${ecbData.dsny} | ECB: ${ecbData.ecb - ecbData.dsny} | Total: ${total}`);
    console.log('');
  }

  // Summary
  console.log('=' .repeat(80));
  console.log('\n📊 PORTFOLIO SUMMARY\n');

  const totalHPD = results.reduce((sum, r) => sum + r.hpd, 0);
  const totalDOB = results.reduce((sum, r) => sum + r.dob, 0);
  const totalDSNY = results.reduce((sum, r) => sum + r.dsny, 0);
  const totalECB = results.reduce((sum, r) => sum + r.ecb, 0);
  const totalViolations = results.reduce((sum, r) => sum + r.total, 0);

  console.log(`Total HPD Violations: ${totalHPD}`);
  console.log(`Total DOB Violations: ${totalDOB}`);
  console.log(`Total DSNY Violations: ${totalDSNY}`);
  console.log(`Total ECB Violations: ${totalECB}`);
  console.log(`Total ALL Violations: ${totalViolations}\n`);

  console.log(`Buildings with Violations: ${results.filter(r => r.total > 0).length}`);
  console.log(`Clean Buildings: ${results.filter(r => r.total === 0).length}\n`);

  // Save results
  const outputPath = path.join(__dirname, '../audit-reports/real-violations-corrected.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    searchDate: new Date().toISOString(),
    totalViolations,
    buildings: results,
    summary: {
      totalHPD,
      totalDOB,
      totalDSNY,
      totalECB,
      buildingsWithViolations: results.filter(r => r.total > 0).length,
      cleanBuildings: results.filter(r => r.total === 0).length
    }
  }, null, 2));

  console.log(`✅ Results saved to: ${outputPath}\n`);
}

main();
