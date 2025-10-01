#!/usr/bin/env node

/**
 * Get Aggregated Condo Values
 * For condo buildings, sum all individual unit assessments
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const buildings = [
  { id: '1', name: '12 West 18th St', bbl: '1008197501', address: '12 WEST 18 STREET', block: '819', lot: '7501' },
  { id: '3', name: '135-139 West 17th St', bbl: '1007930017', address: '135 WEST 17 STREET', block: '793', lot: '17' },
  { id: '4', name: '104 Franklin St', bbl: '1001780005', address: '104 FRANKLIN STREET', block: '178', lot: '5' },
  { id: '5', name: '138 West 17th St', bbl: '1007927502', address: '138 WEST 17 STREET', block: '792', lot: '7502' },
  { id: '6', name: '68 Perry St', bbl: '1006210051', address: '68 PERRY STREET', block: '621', lot: '51' },
  { id: '8', name: '41 Elizabeth St', bbl: '1002040024', address: '41 ELIZABETH STREET', block: '204', lot: '24' },
  { id: '10', name: '131 Perry St', bbl: '1006330028', address: '131 PERRY STREET', block: '633', lot: '28' },
  { id: '11', name: '123 1st Ave', bbl: '1004490034', address: '123 1 AVENUE', block: '449', lot: '34' },
  { id: '13', name: '136 West 17th St', bbl: '1007927507', address: '136 WEST 17 STREET', block: '792', lot: '7507' },
  { id: '14', name: 'Rubin Museum', bbl: '1007920064', address: '150 WEST 17 STREET', block: '792', lot: '64' },
  { id: '15', name: '133 East 15th St', bbl: '1008710030', address: '133 EAST 15 STREET', block: '871', lot: '30' },
  { id: '17', name: '178 Spring St', bbl: '1004880016', address: '178 SPRING STREET', block: '488', lot: '16' },
  { id: '18', name: '36 Walker St', bbl: '1001940014', address: '36 WALKER STREET', block: '194', lot: '14' },
  { id: '21', name: '148 Chambers St', bbl: '1001377505', address: '148 CHAMBERS STREET', block: '137', lot: '7505' }
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

async function getCondoUnits(address) {
  // Search by address to find all condo units
  const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?address=${encodeURIComponent(address)}&$limit=500`;
  return await fetch(url);
}

function formatCurrency(value) {
  if (!value || value === 0) return '$0';
  return `$${parseInt(value).toLocaleString()}`;
}

async function main() {
  console.log('🏢 Aggregated Condo Values Analysis\n');
  console.log('=' .repeat(100));

  const results = [];
  let totalAssessed = 0;
  let totalEstimatedMarket = 0;

  for (const b of buildings) {
    console.log(`\n📍 ${b.name}`);

    // Get all units at this address
    const units = await getCondoUnits(b.address);
    await new Promise(r => setTimeout(r, 800));

    if (units.length === 0) {
      console.log('   ⚠️ No units found');
      continue;
    }

    // Check if it's a condo
    const isCondo = units.some(u => u.condono && u.condono !== '0');
    const condoNo = isCondo ? units[0].condono : null;

    // Sum all assessments
    const totalUnitAssessed = units.reduce((sum, u) => sum + parseFloat(u.assesstot || 0), 0);
    const baseAssessed = parseFloat(units[0].assesstot || 0);

    // Get details
    const yearBuilt = units[0].yearbuilt || 'Unknown';
    const numFloors = units[0].numfloors || 'Unknown';
    const bldgClass = units[0].bldgclass || 'Unknown';
    const ownerName = units[0].ownername || 'Unknown';
    const unitsRes = parseInt(units[0].unitsres || 0);
    const unitsTotal = parseInt(units[0].unitstotal || 0);
    const lotArea = parseInt(units[0].lotarea || 0);
    const bldgArea = parseInt(units[0].bldgarea || 0);

    // Calculate market value (45% assessment ratio)
    const estimatedMarket = Math.round(totalUnitAssessed / 0.45);

    results.push({
      id: b.id,
      name: b.name,
      address: b.address,
      isCondo,
      condoNo,
      unitCount: units.length,
      baseAssessed,
      totalAssessed: totalUnitAssessed,
      estimatedMarket,
      yearBuilt,
      numFloors,
      bldgClass,
      ownerName,
      unitsRes,
      unitsTotal,
      lotArea,
      bldgArea
    });

    totalAssessed += totalUnitAssessed;
    totalEstimatedMarket += estimatedMarket;

    console.log(`   Type: ${isCondo ? `CONDO (Condo #${condoNo})` : 'NON-CONDO'}`);
    console.log(`   Units Found in Database: ${units.length}`);
    if (isCondo && units.length > 1) {
      console.log(`   📊 AGGREGATED CONDO VALUES:`);
      console.log(`      Base Building Assessment: ${formatCurrency(baseAssessed)}`);
      console.log(`      All ${units.length} Condo Units Total: ${formatCurrency(totalUnitAssessed)}`);
      console.log(`      Difference: ${formatCurrency(totalUnitAssessed - baseAssessed)} (${Math.round(((totalUnitAssessed - baseAssessed) / baseAssessed) * 100)}% more)`);
    } else {
      console.log(`   Assessment: ${formatCurrency(totalUnitAssessed)}`);
    }
    console.log(`   Estimated Market Value: ${formatCurrency(estimatedMarket)}`);
    console.log(`   Year Built: ${yearBuilt} | Floors: ${numFloors} | Class: ${bldgClass}`);
    console.log(`   Units: ${unitsRes} residential, ${unitsTotal - unitsRes} commercial`);
  }

  console.log('\n' + '=' .repeat(100));
  console.log('\n📊 PORTFOLIO SUMMARY WITH AGGREGATED CONDO VALUES\n');

  const condoBuildings = results.filter(r => r.isCondo).length;
  const nonCondoBuildings = results.filter(r => !r.isCondo).length;

  console.log(`Total Buildings: ${results.length}`);
  console.log(`Condo Buildings: ${condoBuildings}`);
  console.log(`Non-Condo Buildings: ${nonCondoBuildings}`);
  console.log(`\nTotal Assessed Value (Aggregated): ${formatCurrency(totalAssessed)}`);
  console.log(`Estimated Market Value: ${formatCurrency(totalEstimatedMarket)}`);
  console.log(`Market Premium over Assessment: ${formatCurrency(totalEstimatedMarket - totalAssessed)} (${Math.round(((totalEstimatedMarket - totalAssessed) / totalAssessed) * 100)}%)`);

  // Show breakdown
  console.log('\n📋 CONDO vs NON-CONDO BREAKDOWN:\n');
  results.forEach(r => {
    const type = r.isCondo ? `CONDO (${r.unitCount} units)` : 'NON-CONDO';
    console.log(`${r.name.padEnd(30)} | ${type.padEnd(20)} | Assessed: ${formatCurrency(r.totalAssessed).padEnd(15)} | Market: ${formatCurrency(r.estimatedMarket)}`);
  });

  // Save results
  const outputPath = path.join(__dirname, '../audit-reports/aggregated-condo-values-2025-10-01.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    reportDate: new Date().toISOString(),
    totalBuildings: results.length,
    condoBuildings,
    nonCondoBuildings,
    totalAssessedValue: totalAssessed,
    totalEstimatedMarketValue: totalEstimatedMarket,
    buildings: results
  }, null, 2));

  console.log(`\n✅ Aggregated values saved to: ${outputPath}\n`);
}

main();
