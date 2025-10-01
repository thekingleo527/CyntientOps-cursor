#!/usr/bin/env node

/**
 * 🏢 CyntientOps Building BIN Lookup Script
 * 
 * This script looks up the actual BIN (Building Identification Number) 
 * for each of our buildings using NYC's PLUTO dataset.
 * 
 * NYC API: https://data.cityofnewyork.us/resource/64uk-42ks.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Building data from our system
const buildings = [
  { id: '1', name: '12 West 18th Street', address: '12 West 18th Street, New York, NY 10011' },
  { id: '3', name: '135-139 West 17th Street', address: '135-139 West 17th Street, New York, NY 10011' },
  { id: '4', name: '104 Franklin Street', address: '104 Franklin Street, New York, NY 10013' },
  { id: '5', name: '138 West 17th Street', address: '138 West 17th Street, New York, NY 10011' },
  { id: '6', name: '68 Perry Street', address: '68 Perry Street, New York, NY 10014' },
  { id: '7', name: '112 West 18th Street', address: '112 West 18th Street, New York, NY 10011' },
  { id: '8', name: '41 Elizabeth Street', address: '41 Elizabeth Street, New York, NY 10013' },
  { id: '9', name: '117 West 17th Street', address: '117 West 17th Street, New York, NY 10011' },
  { id: '10', name: '131 Perry Street', address: '131 Perry Street, New York, NY 10014' },
  { id: '11', name: '123 1st Avenue', address: '123 1st Avenue, New York, NY 10003' },
  { id: '13', name: '136 West 17th Street', address: '136 West 17th Street, New York, NY 10011' },
  { id: '14', name: 'Rubin Museum (142–148 W 17th)', address: '150 West 17th Street, New York, NY 10011' },
  { id: '15', name: '133 East 15th Street', address: '133 East 15th Street, New York, NY 10003' },
  { id: '16', name: 'Stuyvesant Cove Park', address: 'Stuyvesant Cove Park, New York, NY 10009' },
  { id: '17', name: '178 Spring Street', address: '178 Spring Street, New York, NY 10012' },
  { id: '18', name: '36 Walker Street', address: '36 Walker Street, New York, NY 10013' },
  { id: '19', name: '115 7th Avenue', address: '115 7th Avenue, New York, NY 10011' },
  { id: '21', name: '148 Chambers Street', address: '148 Chambers Street, New York, NY 10007' }
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
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse address to extract street number and name
 */
function parseAddress(address) {
  const match = address.match(/^(\d+(?:-\d+)?)\s+(.+?)(?:,|$)/);
  if (match) {
    return {
      number: match[1],
      street: match[2].trim()
    };
  }
  return null;
}

/**
 * Look up BIN for a building using PLUTO dataset
 */
async function lookupBIN(building) {
  try {
    const parsed = parseAddress(building.address);
    if (!parsed) {
      console.log(`❌ Could not parse address for ${building.name}: ${building.address}`);
      return null;
    }
    
    // Query PLUTO dataset for the building
    const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address='${parsed.number} ${parsed.street}'&$limit=10`;
    const results = await makeAPIRequest(url);
    
    if (results.length === 0) {
      console.log(`❌ No BIN found for ${building.name}: ${building.address}`);
      return null;
    }
    
    // Find the best match
    const bestMatch = results.find(r => 
      r.address && r.address.toLowerCase().includes(parsed.street.toLowerCase())
    ) || results[0];
    
    return {
      buildingId: building.id,
      buildingName: building.name,
      address: building.address,
      bin: bestMatch.bin,
      bbl: bestMatch.bbl,
      borough: bestMatch.borough,
      block: bestMatch.block,
      lot: bestMatch.lot,
      zipcode: bestMatch.zipcode,
      landUse: bestMatch.landuse,
      yearBuilt: bestMatch.yearbuilt,
      unitsTotal: bestMatch.unitsres,
      unitsCommercial: bestMatch.unitscom,
      squareFootage: bestMatch.bldgarea
    };
    
  } catch (error) {
    console.error(`Error looking up BIN for ${building.name}:`, error.message);
    return null;
  }
}

/**
 * Main function to lookup all BINs
 */
async function lookupAllBINs() {
  console.log('🏢 Starting Building BIN Lookup...\n');
  
  const results = [];
  const failed = [];
  
  for (const building of buildings) {
    console.log(`🔍 Looking up BIN for ${building.name}...`);
    
    const result = await lookupBIN(building);
    if (result) {
      results.push(result);
      console.log(`✅ Found BIN ${result.bin} for ${building.name}`);
    } else {
      failed.push(building);
      console.log(`❌ Failed to find BIN for ${building.name}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  const report = {
    lookupDate: new Date().toISOString(),
    totalBuildings: buildings.length,
    successfulLookups: results.length,
    failedLookups: failed.length,
    buildings: results,
    failed: failed
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'audit-reports', `building-bins-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 BIN Lookup Complete!`);
  console.log(`   Total Buildings: ${buildings.length}`);
  console.log(`   Successful Lookups: ${results.length}`);
  console.log(`   Failed Lookups: ${failed.length}`);
  console.log(`   Report saved to: ${reportPath}`);
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed to find BINs for ${failed.length} buildings:`);
    failed.forEach(b => console.log(`   - ${b.name}: ${b.address}`));
  }
  
  return report;
}

// Run the lookup
if (require.main === module) {
  lookupAllBINs().catch(console.error);
}

module.exports = { lookupAllBINs, buildings };
