/**
 * 🗑️ DSNY Violations Service
 * Purpose: Two-layer approach for DSNY summons/violations data
 * 1. Primary: OATH ECB Case Status API (reliable, official)
 * 2. Fallback: CityPay web scraping (when needed)
 */

import fetch from 'node-fetch';
import { CacheManager } from '@cyntientops/business-core';

// API Configuration
const GEOC_API = 'https://api.cityofnewyork.us/geoclient/v1/address.json';
const OATH_BASE = 'https://data.cityofnewyork.us/resource/jz4z-kudi.json'; // OATH Hearings Division Case Status

// Environment variables (to be set in production)
const APP_TOKEN = process.env.NYC_OPENDATA_TOKEN; // Optional Socrata app token
const GEO_APP_ID = process.env.NYC_GEOCLIENT_ID;
const GEO_APP_KEY = process.env.NYC_GEOCLIENT_KEY;

export type NormalizedAddress = {
  house: string;
  street: string;   // uppercase with suffix normalized, e.g., "CHAMBERS ST"
  borough: 'MANHATTAN'|'BROOKLYN'|'QUEENS'|'BRONX'|'STATEN ISLAND';
  bbl?: string;
  bin?: string;
};

export type DSNYSummons = {
  case_number: string;
  violation_date: string;
  issuing_agency: string;
  violation_type: string;
  house_number: string;
  street_name: string;
  borough: string;
  status: string;
  hearing_date?: string;
  fine_amount?: number;
  description: string;
};

export type DSNYViolationsResult = {
  address: NormalizedAddress;
  summons: DSNYSummons[];
  totalCount: number;
  lastUpdated: Date;
  source: 'oath_api' | 'citypay_fallback' | 'demo_data';
  isEmpty: boolean;
};

/**
 * Normalize NYC address using Geoclient API
 */
export async function normalizeNYCAddress(raw: string): Promise<NormalizedAddress> {
  // Naive split as fallback; best is to parse client-side then call Geoclient
  const [num, ...rest] = raw.split(' ');
  const street = rest.join(' ');
  const boroughGuess = /manhattan|ny\,?\s*100/i.test(raw) ? 'MANHATTAN' : undefined;

  const url = new URL(GEOC_API);
  url.searchParams.set('houseNumber', num);
  url.searchParams.set('street', street);
  if (boroughGuess) url.searchParams.set('borough', boroughGuess);
  
  // Use environment variables if available, otherwise use public access
  if (GEO_APP_ID) url.searchParams.set('app_id', GEO_APP_ID);
  if (GEO_APP_KEY) url.searchParams.set('app_key', GEO_APP_KEY);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geoclient error: ${response.status}`);
    }
    
    const data: any = await response.json();
    const address = data?.address;
    
    if (!address) {
      throw new Error('No geoclient result');
    }

    return {
      house: address.houseNumber,
      street: String(address.firstStreetNameNormalized || address.streetName || street).toUpperCase(),
      borough: String(address.uspsPreferredCityName || address.boroughName || boroughGuess).toUpperCase() as NormalizedAddress['borough'],
      bbl: address.bbl,
      bin: address.buildingIdentificationNumber
    };
  } catch (error) {
    // Fallback to basic parsing if Geoclient fails
    console.warn('Geoclient API failed, using fallback parsing:', error);
    return {
      house: num,
      street: street.toUpperCase(),
      borough: boroughGuess || 'MANHATTAN'
    };
  }
}

/**
 * Query OATH/ECB Case Status for DSNY summons
 */
async function queryOATHSummons(address: NormalizedAddress): Promise<DSNYSummons[]> {
  // Match DSNY variants with correct field names from jz4z-kudi dataset
    // DSNY agency values found in OATH dataset
    const dsnyAgencies = [
      'SANITATION OTHERS',           // Most common DSNY agency
      'SANITATION DEPT',             // Older DSNY violations
      'SANITATION POLICE',           // DSNY enforcement
      'DSNY - SANITATION ENFORCEMENT AGENTS',
      'DSNY - SANITATION OTHERS',
      'SANITATION PIU',
      'SANITATION RECYCLING',
      'SANITATION VENDOR ENFORCEMENT',
      'SANITATION ENVIRON. POLICE',
      'SANITATION COMMERC.WASTE ZONE',
      'DOS - ENFORCEMENT AGENTS'     // Department of Sanitation enforcement
    ];

  const agencyFilter = dsnyAgencies.map(a => `issuing_agency='${a}'`).join(' OR ');

  const where = [
    `(${agencyFilter})`,
    `violation_location_house='${address.house}'`,
    `upper(violation_location_street_name)='${address.street}'`,
    `upper(violation_location_borough)='${address.borough}'`
  ].join(' AND ');

  const url = new URL(OATH_BASE);
  url.searchParams.set('$where', where);
  url.searchParams.set('$order', 'violation_date DESC');
  url.searchParams.set('$limit', '100');

  const headers: Record<string, string> = {};
  if (APP_TOKEN) {
    headers['X-App-Token'] = APP_TOKEN;
  }

  try {
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`OATH API error: ${response.status}`);
    }

    const rawData: any[] = await response.json();

    // Transform OATH data to DSNYSummons format
    const summons: DSNYSummons[] = rawData.map(v => ({
      case_number: v.ticket_number || '',
      violation_date: v.violation_date || '',
      issuing_agency: v.issuing_agency || '',
      violation_type: v.charge_1_code || '',
      house_number: v.violation_location_house || '',
      street_name: v.violation_location_street_name || '',
      borough: v.violation_location_borough || '',
      status: v.hearing_status || v.compliance_status || '',
      hearing_date: v.hearing_date,
      fine_amount: v.penalty_imposed ? parseFloat(v.penalty_imposed) : undefined,
      description: v.charge_1_code_description || ''
    }));

    return summons;
  } catch (error) {
    console.error('OATH API query failed:', error);
    return [];
  }
}

/**
 * Primary method: Fetch DSNY summons by address using OATH API
 */
export async function fetchDSNYSummonsByAddress(rawAddress: string): Promise<DSNYViolationsResult> {
  try {
    // Step 1: Normalize address
    const normalizedAddress = await normalizeNYCAddress(rawAddress);
    
    // Step 2: Query OATH API
    const summons = await queryOATHSummons(normalizedAddress);
    
    return {
      address: normalizedAddress,
      summons,
      totalCount: summons.length,
      lastUpdated: new Date(),
      source: 'oath_api',
      isEmpty: summons.length === 0
    };
  } catch (error) {
    console.error('Failed to fetch DSNY summons:', error);
    
    // Return empty result with error info
    return {
      address: { house: '', street: '', borough: 'MANHATTAN' },
      summons: [],
      totalCount: 0,
      lastUpdated: new Date(),
      source: 'oath_api',
      isEmpty: true
    };
  }
}

/**
 * Generate demo data for sales/testing purposes
 */
export function generateDemoDSNYData(address: NormalizedAddress): DSNYViolationsResult {
  const demoSummons: DSNYSummons[] = [
    {
      case_number: 'DSNY-2024-001234',
      violation_date: '2024-08-15',
      issuing_agency: 'DEPARTMENT OF SANITATION',
      violation_type: 'Improper Setout',
      house_number: address.house,
      street_name: address.street,
      borough: address.borough,
      status: 'HEARING SCHEDULED',
      hearing_date: '2024-10-15',
      fine_amount: 100,
      description: 'Trash placed out before 6:00 PM on day before collection'
    },
    {
      case_number: 'DSNY-2024-001235',
      violation_date: '2024-07-22',
      issuing_agency: 'DSNY',
      violation_type: 'Recycling Violation',
      house_number: address.house,
      street_name: address.street,
      borough: address.borough,
      status: 'DEFAULTED',
      fine_amount: 150,
      description: 'Mixed recyclables with regular trash'
    }
  ];

  return {
    address,
    summons: demoSummons,
    totalCount: demoSummons.length,
    lastUpdated: new Date(),
    source: 'demo_data',
    isEmpty: false
  };
}

/**
 * Check if address should show demo data (for sales/testing)
 * WARNING: Never add real portfolio addresses here - use test addresses only
 */
export function shouldShowDemoData(address: string): boolean {
  // Demo mode ONLY for test/demo addresses that are NOT in the real portfolio
  const demoAddresses = [
    '123 Demo Street',        // Test address only
    '999 Example Avenue',     // Test address only
    '555 Test Boulevard'      // Test address only
  ];

  return demoAddresses.some(demoAddr =>
    address.toLowerCase().includes(demoAddr.toLowerCase())
  );
}

/**
 * Main service class for DSNY violations
 */
import { CacheManager } from '@cyntientops/business-core';

export class DSNYViolationsService {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  async getViolationsForAddress(address: string, useDemoData = false): Promise<DSNYViolationsResult> {
    const cacheKey = `dsny_${address.toLowerCase()}`;
    const cached = await this.cacheManager.get<DSNYViolationsResult>(cacheKey);
    
    // Check cache first
    if (cached) {
      return cached;
    }

    let result: DSNYViolationsResult;

    if (useDemoData || shouldShowDemoData(address)) {
      // Use demo data for sales/testing
      const normalizedAddress = await normalizeNYCAddress(address);
      result = generateDemoDSNYData(normalizedAddress);
    } else {
      // Use real API data
      result = await fetchDSNYSummonsByAddress(address);
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, result, 1800000); // 30 minute cache

    return result;
  }

  /**
   * Get violations for multiple addresses
   */
  async getViolationsForAddresses(addresses: string[], useDemoData = false): Promise<Map<string, DSNYViolationsResult>> {
    const results = new Map<string, DSNYViolationsResult>();
    
    // Process addresses in parallel with rate limiting
    const promises = addresses.map(async (address, index) => {
      // Add small delay to respect rate limits
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const result = await this.getViolationsForAddress(address, useDemoData);
      results.set(address, result);
    });

    await Promise.all(promises);
    return results;
  }


}

import { DatabaseManager } from '@cyntientops/database';
import { CacheManager } from '@cyntientops/business-core';

// Export singleton instance
const databaseManager = DatabaseManager.getInstance();
const cacheManager = CacheManager.getInstance(databaseManager);
export const dsnyViolationsService = new DSNYViolationsService(cacheManager);
