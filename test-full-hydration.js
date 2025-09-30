const fetch = require('node-fetch');

// API Configuration
const HPD_BASE = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json';
const DOB_BASE = 'https://data.cityofnewyork.us/resource/ipu4-2q9a.json';
const OATH_BASE = 'https://data.cityofnewyork.us/resource/jz4z-kudi.json';

const DSNY_AGENCIES = [
  'DSNY - SANITATION ENFORCEMENT AGENTS',
  'DSNY - SANITATION OTHERS',
  'SANITATION DEPT',
  'SANITATION POLICE',
  'SANITATION OTHERS',
  'SANITATION PIU',
  'SANITATION RECYCLING',
  'SANITATION VENDOR ENFORCEMENT',
  'SANITATION ENVIRON. POLICE',
  'SANITATION COMMERC.WASTE ZONE',
  'DOS - ENFORCEMENT AGENTS'
];

// Portfolio buildings from buildings.json
const buildings = [
  {
    id: '1',
    name: '12 West 18th Street',
    address: '12 West 18th Street, New York, NY 10011',
    house: '12',
    street: 'WEST 18TH STREET',
    borough: 'MANHATTAN',
    bbl: '1008340026',
    bin: '1015990',
    marketValue: 8500000,
    assessedValue: 4250000
  },
  {
    id: '3',
    name: '135 West 17th Street',
    address: '135 West 17th Street, New York, NY 10011',
    house: '135',
    street: 'WEST 17TH STREET',
    borough: 'MANHATTAN',
    bbl: '1008340027',
    bin: '1015991',
    marketValue: 9200000,
    assessedValue: 4600000
  },
  {
    id: '4',
    name: '104 Franklin Street',
    address: '104 Franklin Street, New York, NY 10013',
    house: '104',
    street: 'FRANKLIN STREET',
    borough: 'MANHATTAN',
    bbl: '1001880001',
    bin: '1001236',
    marketValue: 12800000,
    assessedValue: 6400000
  },
  {
    id: '5',
    name: '138 West 17th Street',
    address: '138 West 17th Street, New York, NY 10011',
    house: '138',
    street: 'WEST 17TH STREET',
    borough: 'MANHATTAN',
    bbl: '1008340028',
    bin: '1015992',
    marketValue: 11200000,
    assessedValue: 5600000
  },
  {
    id: '6',
    name: '68 Perry Street',
    address: '68 Perry Street, New York, NY 10014',
    house: '68',
    street: 'PERRY STREET',
    borough: 'MANHATTAN',
    bbl: '1006290001',
    bin: '1008961',
    marketValue: 14500000,
    assessedValue: 7250000
  },
  {
    id: '10',
    name: '131 Perry Street',
    address: '131 Perry Street, New York, NY 10014',
    house: '131',
    street: 'PERRY STREET',
    borough: 'MANHATTAN',
    bbl: '1006380044',
    bin: '1009058',
    marketValue: 18900000,
    assessedValue: 9450000
  }
];

async function testHPDViolations(bbl, buildingName) {
  try {
    const url = `${HPD_BASE}?bbl=${bbl}&$limit=100&$order=inspectiondate DESC`;
    const response = await fetch(url);
    if (!response.ok) return { error: response.status, count: 0 };

    const violations = await response.json();
    const open = violations.filter(v => v.currentstatus === 'OPEN').length;
    const classA = violations.filter(v => v.violationclass === 'A').length;
    const classB = violations.filter(v => v.violationclass === 'B').length;
    const classC = violations.filter(v => v.violationclass === 'C').length;

    return {
      total: violations.length,
      open,
      classA,
      classB,
      classC,
      recent: violations.slice(0, 3).map(v => ({
        date: v.inspectiondate?.substring(0, 10),
        class: v.violationclass,
        status: v.currentstatus,
        description: v.novdescription?.substring(0, 80)
      }))
    };
  } catch (error) {
    return { error: error.message, count: 0 };
  }
}

async function testDOBPermits(house, street, buildingName) {
  try {
    // Fetch by house number, then filter by street
    const url = `${DOB_BASE}?house__=${house}&$limit=100&$order=filing_date DESC`;
    const response = await fetch(url);
    if (!response.ok) return { error: response.status, count: 0 };

    let permits = await response.json();
    // Filter by street name
    permits = permits.filter(p => p.street_name && p.street_name.includes(street.split(' ')[1]));

    const active = permits.filter(p => p.permit_status === 'ISSUED').length;
    const filed2024 = permits.filter(p => p.filing_date && p.filing_date.startsWith('2024')).length;
    const filed2025 = permits.filter(p => p.filing_date && p.filing_date.startsWith('2025')).length;

    return {
      total: permits.length,
      active,
      filed2024,
      filed2025,
      recent: permits.slice(0, 3).map(p => ({
        job: p.job__,
        type: p.job_type,
        status: p.permit_status,
        filingDate: p.filing_date,
        address: `${p.house__} ${p.street_name}`
      }))
    };
  } catch (error) {
    return { error: error.message, count: 0 };
  }
}

async function testDSNYViolations(house, street, borough, buildingName) {
  try {
    const agencyFilter = DSNY_AGENCIES.map(a => `issuing_agency='${a}'`).join(' OR ');
    const where = [
      `(${agencyFilter})`,
      `violation_location_house='${house}'`,
      `upper(violation_location_street_name)='${street}'`,
      `upper(violation_location_borough)='${borough}'`
    ].join(' AND ');

    const url = `${OATH_BASE}?$where=${encodeURIComponent(where)}&$order=violation_date DESC&$limit=100`;
    const response = await fetch(url);
    if (!response.ok) return { error: response.status, count: 0 };

    const violations = await response.json();

    const defaulted = violations.filter(v => v.hearing_status === 'DEFAULTED').length;
    const docketed = violations.filter(v => v.compliance_status === 'DOCKETED').length;
    const paid = violations.filter(v => v.hearing_status === 'PAID IN FULL').length;

    let totalFines = 0;
    let outstandingBalance = 0;

    violations.forEach(v => {
      const fine = parseFloat(v.penalty_imposed || 0);
      totalFines += fine;
      if (v.balance_due) {
        outstandingBalance += parseFloat(v.balance_due);
      }
    });

    return {
      total: violations.length,
      defaulted,
      docketed,
      paid,
      totalFines: totalFines,
      outstandingBalance,
      recent: violations.slice(0, 3).map(v => ({
        ticket: v.ticket_number,
        date: v.violation_date?.substring(0, 10),
        type: v.charge_1_code_description,
        fine: parseFloat(v.penalty_imposed || 0),
        status: v.hearing_status || v.compliance_status
      }))
    };
  } catch (error) {
    return { error: error.message, count: 0 };
  }
}

async function hydrateBuilding(building) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🏢 ${building.name} (ID: ${building.id})`);
  console.log(`📍 ${building.address}`);
  console.log(`🔢 BBL: ${building.bbl} | BIN: ${building.bin}`);
  console.log(`💰 Market Value: $${building.marketValue.toLocaleString()}`);
  console.log(`${'='.repeat(70)}\n`);

  // HPD Violations
  console.log('🏘️  HPD VIOLATIONS');
  console.log('-'.repeat(50));
  const hpd = await testHPDViolations(building.bbl, building.name);
  if (hpd.error) {
    console.log(`   ❌ Error: ${hpd.error}`);
  } else {
    console.log(`   Total: ${hpd.total} violations`);
    console.log(`   Open: ${hpd.open} | Class A: ${hpd.classA} | Class B: ${hpd.classB} | Class C: ${hpd.classC}`);
    if (hpd.recent && hpd.recent.length > 0) {
      console.log('   Recent violations:');
      hpd.recent.forEach((v, i) => {
        if (v.date) {
          console.log(`   ${i + 1}. ${v.date} - Class ${v.class} - ${v.status}`);
          console.log(`      ${v.description || 'N/A'}`);
        }
      });
    }
  }

  // DOB Permits
  console.log('\n🏗️  DOB PERMITS');
  console.log('-'.repeat(50));
  const dob = await testDOBPermits(building.house, building.street, building.name);
  if (dob.error) {
    console.log(`   ❌ Error: ${dob.error}`);
  } else {
    console.log(`   Total: ${dob.total} permits`);
    console.log(`   Active: ${dob.active} | Filed 2024: ${dob.filed2024} | Filed 2025: ${dob.filed2025}`);
    if (dob.recent && dob.recent.length > 0) {
      console.log('   Recent permits:');
      dob.recent.forEach((p, i) => {
        if (p.job) {
          console.log(`   ${i + 1}. Job ${p.job} - ${p.type} - ${p.status}`);
          console.log(`      Filed: ${p.filingDate} - ${p.address}`);
        }
      });
    }
  }

  // DSNY Violations
  console.log('\n🗑️  DSNY VIOLATIONS (OATH)');
  console.log('-'.repeat(50));
  const dsny = await testDSNYViolations(building.house, building.street, building.borough, building.name);
  if (dsny.error) {
    console.log(`   ❌ Error: ${dsny.error}`);
  } else {
    console.log(`   Total: ${dsny.total} violations`);
    console.log(`   Defaulted: ${dsny.defaulted} | Docketed: ${dsny.docketed} | Paid: ${dsny.paid}`);
    console.log(`   Total Fines: $${dsny.totalFines.toFixed(2)}`);
    console.log(`   Outstanding Balance: $${dsny.outstandingBalance.toFixed(2)}`);
    if (dsny.recent && dsny.recent.length > 0) {
      console.log('   Recent violations:');
      dsny.recent.forEach((v, i) => {
        if (v.ticket) {
          console.log(`   ${i + 1}. ${v.date} - Ticket ${v.ticket}`);
          console.log(`      ${v.type || 'Unknown'}`);
          console.log(`      Fine: $${v.fine.toFixed(2)} - Status: ${v.status}`);
        }
      });
    }
  }

  // Property Value
  console.log('\n💵 PROPERTY VALUES');
  console.log('-'.repeat(50));
  console.log(`   Market Value: $${building.marketValue.toLocaleString()}`);
  console.log(`   Assessed Value: $${building.assessedValue.toLocaleString()}`);
  console.log(`   Assessment Ratio: ${((building.assessedValue / building.marketValue) * 100).toFixed(1)}%`);

  // Compliance Summary
  console.log('\n📊 COMPLIANCE SUMMARY');
  console.log('-'.repeat(50));

  let complianceScore = 100;
  const issues = [];

  if (hpd.open > 0) {
    complianceScore -= (hpd.open * 5);
    issues.push(`${hpd.open} open HPD violations`);
  }
  if (hpd.classA > 0) {
    complianceScore -= (hpd.classA * 10);
    issues.push(`${hpd.classA} Class A violations (critical)`);
  }
  if (dsny.defaulted > 0) {
    complianceScore -= (dsny.defaulted * 15);
    issues.push(`${dsny.defaulted} defaulted DSNY violations`);
  }
  if (dsny.outstandingBalance > 0) {
    complianceScore -= Math.min(20, dsny.outstandingBalance / 100);
    issues.push(`$${dsny.outstandingBalance.toFixed(2)} outstanding DSNY fines`);
  }

  complianceScore = Math.max(0, complianceScore);

  let status = '🟢 EXCELLENT';
  if (complianceScore < 60) status = '🔴 CRITICAL';
  else if (complianceScore < 80) status = '🟡 WARNING';

  console.log(`   Status: ${status}`);
  console.log(`   Compliance Score: ${complianceScore.toFixed(1)}/100`);

  if (issues.length > 0) {
    console.log('   Issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('   ✅ No compliance issues detected');
  }

  return {
    building: building.name,
    hpd,
    dob,
    dsny,
    propertyValue: {
      market: building.marketValue,
      assessed: building.assessedValue
    },
    complianceScore,
    status
  };
}

async function fullPortfolioHydration() {
  console.log('🚀 CyntientOps Full Portfolio Data Hydration');
  console.log('Testing ALL data sources: HPD, DOB, DSNY, Property Values\n');

  const results = [];

  for (const building of buildings) {
    const result = await hydrateBuilding(building);
    results.push(result);
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Portfolio Summary
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('📊 PORTFOLIO SUMMARY');
  console.log('='.repeat(70));

  const summary = {
    totalBuildings: results.length,
    totalHPDViolations: results.reduce((sum, r) => sum + (r.hpd.total || 0), 0),
    totalOpenHPD: results.reduce((sum, r) => sum + (r.hpd.open || 0), 0),
    totalDOBPermits: results.reduce((sum, r) => sum + (r.dob.total || 0), 0),
    totalActiveDOB: results.reduce((sum, r) => sum + (r.dob.active || 0), 0),
    totalDSNYViolations: results.reduce((sum, r) => sum + (r.dsny.total || 0), 0),
    totalDSNYOutstanding: results.reduce((sum, r) => sum + (r.dsny.outstandingBalance || 0), 0),
    totalMarketValue: results.reduce((sum, r) => sum + r.propertyValue.market, 0),
    totalAssessedValue: results.reduce((sum, r) => sum + r.propertyValue.assessed, 0),
    avgComplianceScore: results.reduce((sum, r) => sum + r.complianceScore, 0) / results.length
  };

  console.log(`\n📈 Portfolio Metrics:`);
  console.log(`   Total Buildings: ${summary.totalBuildings}`);
  console.log(`   Total Market Value: $${summary.totalMarketValue.toLocaleString()}`);
  console.log(`   Total Assessed Value: $${summary.totalAssessedValue.toLocaleString()}`);
  console.log(`   Average Compliance Score: ${summary.avgComplianceScore.toFixed(1)}/100`);

  console.log(`\n🏘️  HPD Violations:`);
  console.log(`   Total: ${summary.totalHPDViolations}`);
  console.log(`   Open: ${summary.totalOpenHPD}`);

  console.log(`\n🏗️  DOB Permits:`);
  console.log(`   Total: ${summary.totalDOBPermits}`);
  console.log(`   Active: ${summary.totalActiveDOB}`);

  console.log(`\n🗑️  DSNY Violations:`);
  console.log(`   Total: ${summary.totalDSNYViolations}`);
  console.log(`   Outstanding Balance: $${summary.totalDSNYOutstanding.toFixed(2)}`);

  console.log('\n\n📋 Building Risk Rankings:');
  console.log('-'.repeat(70));

  const ranked = results.sort((a, b) => a.complianceScore - b.complianceScore);
  ranked.forEach((r, i) => {
    console.log(`${i + 1}. ${r.building.padEnd(30)} ${r.status} (${r.complianceScore.toFixed(1)}/100)`);
  });

  console.log('\n✅ Full hydration complete!\n');
  return { results, summary };
}

fullPortfolioHydration().catch(console.error);
