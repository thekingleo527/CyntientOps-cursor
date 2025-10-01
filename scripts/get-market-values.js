#!/usr/bin/env node

/**
 * Get Market Values and Comprehensive Property Details
 *
 * Data Sources:
 * 1. NYC Property Sales - Actual market transactions
 * 2. PLUTO - Tax assessed values and property characteristics
 * 3. ACRIS - Property deeds and ownership history
 * 4. DOB Building Data - Construction details
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const buildings = [
  { id: '1', name: '12 West 18th St', bbl: '1008197501', address: '12 WEST 18 STREET' },
  { id: '3', name: '135-139 West 17th St', bbl: '1007930017', address: '135 WEST 17 STREET' },
  { id: '4', name: '104 Franklin St', bbl: '1001780005', address: '104 FRANKLIN STREET' },
  { id: '5', name: '138 West 17th St', bbl: '1007927502', address: '138 WEST 17 STREET' },
  { id: '6', name: '68 Perry St', bbl: '1006210051', address: '68 PERRY STREET' },
  { id: '8', name: '41 Elizabeth St', bbl: '1002040024', address: '41 ELIZABETH STREET' },
  { id: '10', name: '131 Perry St', bbl: '1006330028', address: '131 PERRY STREET' },
  { id: '11', name: '123 1st Ave', bbl: '1004490034', address: '123 1 AVENUE' },
  { id: '13', name: '136 West 17th St', bbl: '1007927507', address: '136 WEST 17 STREET' },
  { id: '14', name: 'Rubin Museum', bbl: '1007920064', address: '150 WEST 17 STREET' },
  { id: '15', name: '133 East 15th St', bbl: '1008710030', address: '133 EAST 15 STREET' },
  { id: '17', name: '178 Spring St', bbl: '1004880016', address: '178 SPRING STREET' },
  { id: '18', name: '36 Walker St', bbl: '1001940014', address: '36 WALKER STREET' },
  { id: '21', name: '148 Chambers St', bbl: '1001377505', address: '148 CHAMBERS STREET' }
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
  if (!value || value === 0) return 'N/A';
  return `$${parseInt(value).toLocaleString()}`;
}

function formatNumber(value) {
  if (!value) return 'N/A';
  return parseInt(value).toLocaleString();
}

// Calculate estimated market value using assessment ratio
// NYC typical assessment ratio is 45% for residential, 45% for commercial
function estimateMarketValue(assessedTotal, landUse, buildingClass) {
  if (!assessedTotal) return null;

  // Different ratios based on property type
  let assessmentRatio = 0.45; // Default

  if (buildingClass && buildingClass.startsWith('R')) {
    // Residential condos and co-ops
    assessmentRatio = 0.45;
  } else if (buildingClass && (buildingClass.startsWith('C') || buildingClass.startsWith('D'))) {
    // Walkup apartments
    assessmentRatio = 0.45;
  } else if (buildingClass && buildingClass.startsWith('O')) {
    // Office/commercial
    assessmentRatio = 0.45;
  }

  return Math.round(assessedTotal / assessmentRatio);
}

async function getPropertySales(bbl) {
  // NYC Annualized Rolling Sales dataset
  const url = `https://data.cityofnewyork.us/resource/uzf5-f8n2.json?bbl=${bbl}&$order=sale_date DESC&$limit=10`;
  return await fetch(url);
}

async function getPLUTOData(bbl) {
  const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?bbl=${bbl}`;
  const data = await fetch(url);
  return data.length > 0 ? data[0] : null;
}

async function main() {
  console.log('🏢 Comprehensive Property Analysis - Market Values & Details\n');
  console.log('=' .repeat(100));

  const results = [];

  for (const b of buildings) {
    console.log(`\n📍 ${b.name} (BBL: ${b.bbl})`);

    // Get PLUTO data
    const pluto = await getPLUTOData(b.bbl);
    await new Promise(r => setTimeout(r, 500));

    // Get recent sales
    const sales = await getPropertySales(b.bbl);
    await new Promise(r => setTimeout(r, 500));

    if (!pluto) {
      console.log('   ⚠️ Property not found in PLUTO dataset');
      results.push({
        id: b.id,
        name: b.name,
        bbl: b.bbl,
        found: false
      });
      continue;
    }

    // Calculate estimated market value
    const assessedTotal = parseInt(pluto.assesstot || 0);
    const assessedLand = parseInt(pluto.assessland || 0);
    const estimatedMarketValue = estimateMarketValue(assessedTotal, pluto.landuse, pluto.bldgclass);

    // Get most recent sale
    let lastSalePrice = null;
    let lastSaleDate = null;
    if (sales && sales.length > 0) {
      const recentSale = sales.find(s => s.sale_price && parseInt(s.sale_price) > 100);
      if (recentSale) {
        lastSalePrice = parseInt(recentSale.sale_price);
        lastSaleDate = recentSale.sale_date;
      }
    }

    const result = {
      id: b.id,
      name: b.name,
      bbl: b.bbl,
      address: pluto.address || b.address,

      // Valuation
      assessedLand,
      assessedTotal,
      estimatedMarketValue,
      lastSalePrice,
      lastSaleDate,

      // Building Details
      yearBuilt: pluto.yearbuilt || 'Unknown',
      yearAlter1: pluto.yearalter1 || 0,
      yearAlter2: pluto.yearalter2 || 0,
      numFloors: pluto.numfloors || 'Unknown',
      numBldgs: pluto.numbldgs || 1,

      // Area
      lotArea: parseInt(pluto.lotarea || 0),
      buildingArea: parseInt(pluto.bldgarea || 0),
      resArea: parseInt(pluto.resarea || 0),
      comArea: parseInt(pluto.comarea || 0),
      officeArea: parseInt(pluto.officearea || 0),
      retailArea: parseInt(pluto.retailarea || 0),

      // Units
      unitsRes: parseInt(pluto.unitsres || 0),
      unitsTotal: parseInt(pluto.unitstotal || 0),

      // Classification
      buildingClass: pluto.bldgclass || 'Unknown',
      landUse: pluto.landuse || 'Unknown',
      zoneDist1: pluto.zonedist1 || 'Unknown',
      overlay1: pluto.overlay1 || 'None',

      // FAR
      builtFAR: parseFloat(pluto.builtfar || 0),
      residFAR: parseFloat(pluto.residfar || 0),
      commFAR: parseFloat(pluto.commfar || 0),
      facilFAR: parseFloat(pluto.facilfar || 0),

      // Owner
      ownerName: pluto.ownername || 'Unknown',

      // Location
      zipCode: pluto.zipcode || 'Unknown',
      cd: pluto.cd || 'Unknown',
      council: pluto.council || 'Unknown',

      // Historic
      histDist: pluto.histdist || 'None'
    };

    results.push(result);

    console.log(`   Address: ${result.address}`);
    console.log(`   Owner: ${result.ownerName}`);
    console.log(`\n   💰 VALUATION:`);
    console.log(`      Assessed Value (Tax): ${formatCurrency(result.assessedTotal)}`);
    console.log(`      Estimated Market Value: ${formatCurrency(result.estimatedMarketValue)} (based on 45% assessment ratio)`);
    if (lastSalePrice) {
      console.log(`      Last Sale: ${formatCurrency(lastSalePrice)} (${lastSaleDate})`);
    }
    console.log(`      Assessment-to-Market Ratio: ${assessedTotal > 0 && estimatedMarketValue > 0 ? Math.round((assessedTotal / estimatedMarketValue) * 100) : 'N/A'}%`);

    console.log(`\n   🏗️ BUILDING DETAILS:`);
    console.log(`      Year Built: ${result.yearBuilt}`);
    if (result.yearAlter1 > 0) console.log(`      Major Alteration: ${result.yearAlter1}`);
    console.log(`      Floors: ${result.numFloors}`);
    console.log(`      Building Class: ${result.buildingClass}`);
    console.log(`      Zoning: ${result.zoneDist1}${result.overlay1 !== 'None' ? ' / ' + result.overlay1 : ''}`);
    if (result.histDist !== 'None') console.log(`      Historic District: ${result.histDist}`);

    console.log(`\n   📐 AREA BREAKDOWN:`);
    console.log(`      Lot Area: ${formatNumber(result.lotArea)} sq ft`);
    console.log(`      Total Building Area: ${formatNumber(result.buildingArea)} sq ft`);
    if (result.resArea > 0) console.log(`      Residential Area: ${formatNumber(result.resArea)} sq ft`);
    if (result.comArea > 0) console.log(`      Commercial Area: ${formatNumber(result.comArea)} sq ft`);
    if (result.officeArea > 0) console.log(`      Office Area: ${formatNumber(result.officeArea)} sq ft`);
    if (result.retailArea > 0) console.log(`      Retail Area: ${formatNumber(result.retailArea)} sq ft`);
    console.log(`      Built FAR: ${result.builtFAR.toFixed(2)} (Zoning allows up to ${result.facilFAR.toFixed(2)})`);

    console.log(`\n   🏘️ UNITS:`);
    console.log(`      Residential Units: ${result.unitsRes}`);
    console.log(`      Total Units: ${result.unitsTotal}`);
    console.log(`      Commercial Units: ${result.unitsTotal - result.unitsRes}`);
  }

  console.log('\n' + '=' .repeat(100));
  console.log('\n📊 PORTFOLIO MARKET VALUE ANALYSIS\n');

  const totalAssessed = results.filter(r => r.assessedTotal).reduce((sum, r) => sum + r.assessedTotal, 0);
  const totalEstimatedMarket = results.filter(r => r.estimatedMarketValue).reduce((sum, r) => sum + r.estimatedMarketValue, 0);
  const totalRecentSales = results.filter(r => r.lastSalePrice).reduce((sum, r) => sum + r.lastSalePrice, 0);
  const numRecentSales = results.filter(r => r.lastSalePrice).length;

  console.log(`Total Assessed Value (Tax): ${formatCurrency(totalAssessed)}`);
  console.log(`Estimated Market Value: ${formatCurrency(totalEstimatedMarket)}`);
  console.log(`Recent Sales Data Available: ${numRecentSales} buildings`);
  if (numRecentSales > 0) {
    console.log(`Total of Recent Sales: ${formatCurrency(totalRecentSales)}`);
  }
  console.log(`\nMarket Value Premium: ${formatCurrency(totalEstimatedMarket - totalAssessed)} (${Math.round(((totalEstimatedMarket - totalAssessed) / totalAssessed) * 100)}% above assessed)`);

  // Save results
  const outputPath = path.join(__dirname, '../audit-reports/market-values-2025-10-01.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    reportDate: new Date().toISOString(),
    totalBuildings: results.length,
    totalAssessedValue: totalAssessed,
    totalEstimatedMarketValue: totalEstimatedMarket,
    totalRecentSalesValue: totalRecentSales,
    buildings: results
  }, null, 2));

  console.log(`\n✅ Market values saved to: ${outputPath}\n`);
}

main();
