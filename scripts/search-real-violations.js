#!/usr/bin/env node

/**
 * 🔍 Search for Real Violations in CyntientOps Building Areas
 * 
 * This script searches for actual violations in the areas where our buildings
 * are located, including DSNY violations that might be in the ECB system.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Building areas to search (based on blocks we found)
const searchAreas = [
  { name: 'West 17th Street Area', blocks: ['792', '793'], streets: ['WEST 17 STREET', 'WEST 17TH STREET'] },
  { name: 'West 18th Street Area', blocks: ['819'], streets: ['WEST 18 STREET', 'WEST 18TH STREET'] },
  { name: 'Perry Street Area', blocks: ['621', '633'], streets: ['PERRY STREET'] },
  { name: 'Franklin Street Area', blocks: ['178'], streets: ['FRANKLIN STREET'] },
  { name: 'Elizabeth Street Area', blocks: ['204'], streets: ['ELIZABETH STREET'] },
  { name: '1st Avenue Area', blocks: ['449'], streets: ['1 AVENUE', '1ST AVENUE'] },
  { name: 'East 15th Street Area', blocks: ['871'], streets: ['EAST 15 STREET', 'EAST 15TH STREET'] },
  { name: 'Spring Street Area', blocks: ['488'], streets: ['SPRING STREET'] },
  { name: 'Walker Street Area', blocks: ['194'], streets: ['WALKER STREET'] },
  { name: 'Chambers Street Area', blocks: ['137'], streets: ['CHAMBERS STREET'] }
];

// DSNY-related violation keywords
const dsnyKeywords = [
  'TRASH', 'GARBAGE', 'REFUSE', 'SANITATION', 'DSNY', 'WASTE', 'LITTER',
  'DUMPSTER', 'BIN', 'COLLECTION', 'DISPOSAL', 'RECYCLING', 'ORGANIC'
];

/**
 * Make HTTP request to NYC API
 */
function makeAPIRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(Array.isArray(result) ? result : []);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Search for violations in a specific area
 */
async function searchAreaViolations(area) {
  console.log(`🔍 Searching ${area.name} (blocks: ${area.blocks.join(', ')})...`);
  
  const violations = [];
  
  // Search by blocks
  for (const block of area.blocks) {
    try {
      const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=boro='1' and block='${block}'&$limit=100`;
      const blockViolations = await makeAPIRequest(url);
      violations.push(...blockViolations);
    } catch (error) {
      console.error(`Error searching block ${block}:`, error.message);
    }
  }
  
  // Search by streets
  for (const street of area.streets) {
    try {
      const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=boro='1' and respondent_street like '%${street}%'&$limit=100`;
      const streetViolations = await makeAPIRequest(url);
      violations.push(...streetViolations);
    } catch (error) {
      console.error(`Error searching street ${street}:`, error.message);
    }
  }
  
  // Remove duplicates
  const uniqueViolations = violations.filter((violation, index, self) => 
    index === self.findIndex(v => v.ecb_violation_number === violation.ecb_violation_number)
  );
  
  console.log(`   Found ${uniqueViolations.length} violations`);
  
  return uniqueViolations;
}

/**
 * Categorize violations
 */
function categorizeViolations(violations) {
  const categories = {
    dsny: [],
    dob: [],
    other: []
  };
  
  violations.forEach(violation => {
    const description = (violation.violation_description || '').toUpperCase();
    const isDSNY = dsnyKeywords.some(keyword => description.includes(keyword));
    
    if (isDSNY) {
      categories.dsny.push(violation);
    } else if (description.includes('DOB') || description.includes('BUILDING') || description.includes('PERMIT')) {
      categories.dob.push(violation);
    } else {
      categories.other.push(violation);
    }
  });
  
  return categories;
}

/**
 * Search for specific buildings mentioned by user
 */
async function searchSpecificBuildings() {
  console.log('🔍 Searching for specific buildings mentioned (112, 113, 117 West 17th Street)...');
  
  const specificBuildings = [
    { house: '112', street: 'WEST 17' },
    { house: '113', street: 'WEST 17' },
    { house: '117', street: 'WEST 17' }
  ];
  
  const violations = [];
  
  for (const building of specificBuildings) {
    try {
      const url = `https://data.cityofnewyork.us/resource/6bgk-3dad.json?$where=boro='1' and respondent_house_number='${building.house}' and respondent_street like '%${building.street}%'&$limit=50`;
      const buildingViolations = await makeAPIRequest(url);
      violations.push(...buildingViolations);
      
      if (buildingViolations.length > 0) {
        console.log(`   Found ${buildingViolations.length} violations for ${building.house} ${building.street} Street`);
      }
    } catch (error) {
      console.error(`Error searching ${building.house} ${building.street}:`, error.message);
    }
  }
  
  return violations;
}

/**
 * Main search function
 */
async function searchRealViolations() {
  console.log('🚨 Searching for Real Violations in CyntientOps Building Areas...\n');
  
  const allViolations = [];
  
  // Search each area
  for (const area of searchAreas) {
    const areaViolations = await searchAreaViolations(area);
    allViolations.push(...areaViolations);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Search specific buildings
  const specificViolations = await searchSpecificBuildings();
  allViolations.push(...specificViolations);
  
  // Remove duplicates
  const uniqueViolations = allViolations.filter((violation, index, self) => 
    index === self.findIndex(v => v.ecb_violation_number === violation.ecb_violation_number)
  );
  
  console.log(`\n📊 Total Violations Found: ${uniqueViolations.length}`);
  
  // Categorize violations
  const categories = categorizeViolations(uniqueViolations);
  
  console.log(`\n📋 Violation Categories:`);
  console.log(`   DSNY/Sanitation: ${categories.dsny.length}`);
  console.log(`   DOB/Building: ${categories.dob.length}`);
  console.log(`   Other: ${categories.other.length}`);
  
  // Show recent violations
  const recentViolations = uniqueViolations
    .filter(v => v.issue_date && v.issue_date >= '20200101')
    .sort((a, b) => b.issue_date - a.issue_date)
    .slice(0, 10);
  
  if (recentViolations.length > 0) {
    console.log(`\n🚨 Recent Violations (2020+):`);
    recentViolations.forEach(v => {
      console.log(`   ${v.respondent_house_number} ${v.respondent_street}`);
      console.log(`   ${v.violation_description.substring(0, 100)}...`);
      console.log(`   Status: ${v.ecb_violation_status}, Date: ${v.issue_date}`);
      console.log('');
    });
  }
  
  // Show DSNY violations
  if (categories.dsny.length > 0) {
    console.log(`\n🗑️ DSNY/Sanitation Violations:`);
    categories.dsny.forEach(v => {
      console.log(`   ${v.respondent_house_number} ${v.respondent_street}`);
      console.log(`   ${v.violation_description.substring(0, 100)}...`);
      console.log(`   Status: ${v.ecb_violation_status}, Date: ${v.issue_date}`);
      console.log('');
    });
  }
  
  // Generate report
  const report = {
    searchDate: new Date().toISOString(),
    totalViolations: uniqueViolations.length,
    categories: {
      dsny: categories.dsny.length,
      dob: categories.dob.length,
      other: categories.other.length
    },
    recentViolations: recentViolations.length,
    violations: uniqueViolations,
    categorizedViolations: categories
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'audit-reports', `real-violations-found-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  if (uniqueViolations.length > 0) {
    console.log(`\n🎯 Key Findings:`);
    console.log(`   - Found ${uniqueViolations.length} total violations in building areas`);
    console.log(`   - ${categories.dsny.length} DSNY/sanitation violations`);
    console.log(`   - ${categories.dob.length} DOB/building violations`);
    console.log(`   - ${recentViolations.length} recent violations (2020+)`);
    console.log(`\n✅ This confirms that real violation data exists and should be used instead of mock data!`);
  } else {
    console.log(`\n⚠️ No violations found in the searched areas. This could mean:`);
    console.log(`   - The buildings are truly clean (unlikely given your feedback)`);
    console.log(`   - The search parameters need adjustment`);
    console.log(`   - Violations are in a different dataset`);
  }
  
  return report;
}

// Run the search
if (require.main === module) {
  searchRealViolations().catch(console.error);
}

module.exports = { searchRealViolations, searchAreas, dsnyKeywords };
