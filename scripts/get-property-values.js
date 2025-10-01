#!/usr/bin/env node

/**
 * Get Property Values from NYC PLUTO Dataset
 * API: https://data.cityofnewyork.us/resource/64uk-42ks.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const buildings = [
  { id: '1', name: '12 West 18th St', bbl: '1008197501' },
  { id: '3', name: '135-139 West 17th St', bbl: '1007930017' },
  { id: '4', name: '104 Franklin St', bbl: '1001780005' },
  { id: '5', name: '138 West 17th St', bbl: '1007927502' },
  { id: '6', name: '68 Perry St', bbl: '1006210051' },
  { id: '8', name: '41 Elizabeth St', bbl: '1002040024' },
  { id: '10', name: '131 Perry St', bbl: '1006330028' },
  { id: '11', name: '123 1st Ave', bbl: '1004490034' },
  { id: '13', name: '136 West 17th St', bbl: '1007927507' },
  { id: '14', name: 'Rubin Museum', bbl: '1007920064' },
  { id: '15', name: '133 East 15th St', bbl: '1008710030' },
  { id: '17', name: '178 Spring St', bbl: '1004880016' },
  { id: '18', name: '36 Walker St', bbl: '1001940014' },
  { id: '21', name: '148 Chambers St', bbl: '1001377505' }
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

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${parseInt(value).toLocaleString()}`;
}

function formatNumber(value) {
  if (!value) return '0';
  return parseInt(value).toLocaleString();
}

async function main() {
  console.log('🏢 Getting Property Values from NYC PLUTO Dataset\n');
  console.log('=' .repeat(100));

  const results = [];

  for (const b of buildings) {
    console.log(`\n📍 ${b.name} (BBL: ${b.bbl})`);

    const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?bbl=${b.bbl}`;
    const data = await fetch(url);

    if (data.length === 0) {
      console.log('   ⚠️ Property not found in PLUTO dataset');
      results.push({
        id: b.id,
        name: b.name,
        bbl: b.bbl,
        found: false
      });
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    const property = data[0];

    const result = {
      id: b.id,
      name: b.name,
      bbl: b.bbl,
      found: true,
      address: property.address || 'N/A',
      assessedLand: parseInt(property.assessland || 0),
      assessedTotal: parseInt(property.assesstot || 0),
      yearBuilt: property.yearbuilt || 'N/A',
      numFloors: property.numfloors || 'N/A',
      unitsRes: property.unitsres || '0',
      unitsCom: property.unitstotal ? parseInt(property.unitstotal) - parseInt(property.unitsres || 0) : '0',
      lotArea: property.lotarea || 'N/A',
      buildingArea: property.bldgarea || 'N/A',
      buildingClass: property.bldgclass || 'N/A',
      landUse: property.landuse || 'N/A',
      ownerName: property.ownername || 'N/A',
      zipCode: property.zipcode || 'N/A'
    };

    results.push(result);

    console.log(`   Address: ${result.address}`);
    console.log(`   Owner: ${result.ownerName}`);
    console.log(`   Assessed Value (Land): ${formatCurrency(result.assessedLand)}`);
    console.log(`   Assessed Value (Total): ${formatCurrency(result.assessedTotal)}`);
    console.log(`   Year Built: ${result.yearBuilt}`);
    console.log(`   Floors: ${result.numFloors}`);
    console.log(`   Units (Residential): ${result.unitsRes}`);
    console.log(`   Units (Commercial): ${result.unitsCom}`);
    console.log(`   Lot Area: ${formatNumber(result.lotArea)} sq ft`);
    console.log(`   Building Area: ${formatNumber(result.buildingArea)} sq ft`);
    console.log(`   Building Class: ${result.buildingClass}`);
    console.log(`   Zip Code: ${result.zipCode}`);

    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n' + '=' .repeat(100));
  console.log('\n📊 PORTFOLIO SUMMARY\n');

  const totalAssessedValue = results
    .filter(r => r.found)
    .reduce((sum, r) => sum + r.assessedTotal, 0);

  const totalBuildings = results.filter(r => r.found).length;
  const totalUnitsRes = results
    .filter(r => r.found)
    .reduce((sum, r) => sum + parseInt(r.unitsRes || 0), 0);

  console.log(`Total Buildings Found: ${totalBuildings}`);
  console.log(`Total Assessed Value: ${formatCurrency(totalAssessedValue)}`);
  console.log(`Total Residential Units: ${totalUnitsRes}`);
  console.log(`Average Assessed Value: ${formatCurrency(totalAssessedValue / totalBuildings)}`);

  // Save results
  const outputPath = path.join(__dirname, '../audit-reports/property-values-2025-10-01.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    reportDate: new Date().toISOString(),
    totalBuildings,
    totalAssessedValue,
    totalUnitsRes,
    buildings: results
  }, null, 2));

  console.log(`\n✅ Property values saved to: ${outputPath}\n`);
}

main();
