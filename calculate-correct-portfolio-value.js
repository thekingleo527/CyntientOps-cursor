const buildings = require('./packages/data-seed/src/buildings.json');

console.log('🏢 CyntientOps Complete Portfolio Value Analysis\n');
console.log('=' .repeat(80));

// Calculate total portfolio value
let totalMarket = 0;
let totalAssessed = 0;

// Group by client
const clientPortfolios = {};

buildings.forEach(building => {
  const market = building.marketValue || 0;
  const assessed = building.assessedValue || 0;
  const client = building.client_id || 'UNKNOWN';

  totalMarket += market;
  totalAssessed += assessed;

  if (!clientPortfolios[client]) {
    clientPortfolios[client] = {
      buildings: [],
      totalMarket: 0,
      totalAssessed: 0
    };
  }

  clientPortfolios[client].buildings.push({
    id: building.id,
    name: building.name,
    marketValue: market,
    assessedValue: assessed,
    units: building.numberOfUnits,
    address: building.address
  });

  clientPortfolios[client].totalMarket += market;
  clientPortfolios[client].totalAssessed += assessed;
});

console.log(`\n📊 TOTAL PORTFOLIO VALUE`);
console.log('=' .repeat(80));
console.log(`Total Buildings: ${buildings.length}`);
console.log(`Total Market Value: $${totalMarket.toLocaleString()}`);
console.log(`Total Assessed Value: $${totalAssessed.toLocaleString()}`);
console.log(`Assessment Ratio: ${((totalAssessed / totalMarket) * 100).toFixed(1)}%`);

console.log(`\n\n👥 CLIENT PORTFOLIOS`);
console.log('=' .repeat(80));

// Sort clients by total value
const sortedClients = Object.entries(clientPortfolios).sort((a, b) =>
  b[1].totalMarket - a[1].totalMarket
);

sortedClients.forEach(([clientId, portfolio]) => {
  const pctOfTotal = ((portfolio.totalMarket / totalMarket) * 100).toFixed(1);

  console.log(`\n\n${clientId} - ${portfolio.buildings.length} buildings - ${pctOfTotal}% of portfolio`);
  console.log('-'.repeat(80));
  console.log(`Total Market Value: $${portfolio.totalMarket.toLocaleString()}`);
  console.log(`Total Assessed Value: $${portfolio.totalAssessed.toLocaleString()}`);
  console.log(`\nBuildings:`);

  // Sort buildings by market value
  portfolio.buildings.sort((a, b) => b.marketValue - a.marketValue);

  portfolio.buildings.forEach((building, idx) => {
    console.log(`  ${idx + 1}. ${building.name.padEnd(45)} $${building.marketValue.toLocaleString().padStart(12)}`);
    console.log(`     ${building.address}`);
  });
});

console.log(`\n\n📋 ALL BUILDINGS SORTED BY VALUE`);
console.log('=' .repeat(80));

const sortedBuildings = buildings
  .map(b => ({
    name: b.name,
    marketValue: b.marketValue,
    client: b.client_id,
    units: b.numberOfUnits
  }))
  .sort((a, b) => b.marketValue - a.marketValue);

sortedBuildings.forEach((b, idx) => {
  const pctOfTotal = ((b.marketValue / totalMarket) * 100).toFixed(1);
  console.log(`${(idx + 1).toString().padStart(2)}. ${b.name.padEnd(50)} $${b.marketValue.toLocaleString().padStart(12)} (${pctOfTotal}%) - ${b.client}`);
});

console.log(`\n\n✅ Portfolio value calculation complete!\n`);
