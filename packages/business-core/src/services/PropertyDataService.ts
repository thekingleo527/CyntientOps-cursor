/**
 * 🏢 Property Data Service
 * Comprehensive property values, building details, and market data
 * Last Updated: October 1, 2025
 *
 * Data Sources:
 * - NYC PLUTO Dataset (property values, building characteristics)
 * - Manual verification (building dates, market values)
 * - NYC Open Data APIs
 */

export interface PropertyDetails {
  id: string;
  name: string;
  address: string;

  // Valuation
  assessedValue: number;
  marketValue: number;
  marketValuePerSqFt: number;

  // Building Details
  yearBuilt: string;
  yearRenovated?: string;
  numFloors: number;
  buildingClass: string;

  // Area
  lotArea: number;
  buildingArea: number;
  residentialArea: number;
  commercialArea: number;

  // Units
  unitsResidential: number;
  unitsCommercial: number;
  unitsTotal: number;

  // Zoning
  zoning: string;
  builtFAR: number;
  maxFAR: number;
  unusedFARPercent: number;

  // Location
  neighborhood: string;
  historicDistrict?: string;

  // Ownership
  ownershipType: 'Condo' | 'Co-op' | 'LLC' | 'Corporation' | 'Trust' | 'Other';
  ownerName: string;
}

export const propertyData: Record<string, PropertyDetails> = {
  "1": {
    id: "1",
    name: "12 West 18th Street",
    address: "12 WEST 18 STREET",
    assessedValue: 5876544,
    marketValue: 13058987,
    marketValuePerSqFt: 426,
    yearBuilt: "1885",
    numFloors: 9,
    buildingClass: "RM",
    lotArea: 4876,
    buildingArea: 30675,
    residentialArea: 22750,
    commercialArea: 7925,
    unitsResidential: 13,
    unitsCommercial: 5,
    unitsTotal: 18,
    zoning: "C6-4A",
    builtFAR: 6.29,
    maxFAR: 10.00,
    unusedFARPercent: 37,
    neighborhood: "Chelsea",
    historicDistrict: "Ladies' Mile Historic District",
    ownershipType: "Condo",
    ownerName: "CHELSEA E CONDOMINIUMS"
  },
  "3": {
    id: "3",
    name: "135-139 West 17th Street",
    address: "135 WEST 17 STREET",
    assessedValue: 4188150,
    marketValue: 9307000,
    marketValuePerSqFt: 288,
    yearBuilt: "1920",
    yearRenovated: "1988",
    numFloors: 6,
    buildingClass: "D0",
    lotArea: 5980,
    buildingArea: 32322,
    residentialArea: 26732,
    commercialArea: 5590,
    unitsResidential: 14,
    unitsCommercial: 1,
    unitsTotal: 15,
    zoning: "C6-2A",
    builtFAR: 5.41,
    maxFAR: 6.50,
    unusedFARPercent: 17,
    neighborhood: "Chelsea",
    ownershipType: "Co-op",
    ownerName: "135 W 17 ST TENANTS CORP"
  },
  "4": {
    id: "4",
    name: "104 Franklin Street",
    address: "104 FRANKLIN STREET",
    assessedValue: 2236950,
    marketValue: 4971000,
    marketValuePerSqFt: 438,
    yearBuilt: "1868",
    yearRenovated: "2019",
    numFloors: 5,
    buildingClass: "O5",
    lotArea: 2512,
    buildingArea: 11355,
    residentialArea: 0,
    commercialArea: 11355,
    unitsResidential: 0,
    unitsCommercial: 6,
    unitsTotal: 6,
    zoning: "C6-2A",
    builtFAR: 4.52,
    maxFAR: 6.50,
    unusedFARPercent: 44,
    neighborhood: "Tribeca",
    historicDistrict: "Tribeca East Historic District",
    ownershipType: "LLC",
    ownerName: "104 FRANKLIN LLC"
  },
  "5": {
    id: "5",
    name: "138 West 17th Street",
    address: "138 WEST 17 STREET",
    assessedValue: 9683100,
    marketValue: 21518000,
    marketValuePerSqFt: 622,
    yearBuilt: "1968",
    yearRenovated: "1985",
    numFloors: 10,
    buildingClass: "RM",
    lotArea: 3880,
    buildingArea: 34581,
    residentialArea: 27518,
    commercialArea: 7063,
    unitsResidential: 8,
    unitsCommercial: 1,
    unitsTotal: 9,
    zoning: "C6-2A",
    builtFAR: 8.91,
    maxFAR: 6.50,
    unusedFARPercent: 0, // Grandfathered, over current max
    neighborhood: "Chelsea",
    ownershipType: "Condo",
    ownerName: "NAME NOT ON FILE"
  },
  "6": {
    id: "6",
    name: "68 Perry Street",
    address: "68 PERRY STREET",
    assessedValue: 2602800,
    marketValue: 5784000,
    marketValuePerSqFt: 1228,
    yearBuilt: "1867",
    yearRenovated: "1987",
    numFloors: 4,
    buildingClass: "C5",
    lotArea: 1900,
    buildingArea: 4710,
    residentialArea: 4710,
    commercialArea: 0,
    unitsResidential: 9,
    unitsCommercial: 0,
    unitsTotal: 9,
    zoning: "R6",
    builtFAR: 2.48,
    maxFAR: 4.80,
    unusedFARPercent: 93,
    neighborhood: "West Village",
    historicDistrict: "Greenwich Village Historic District",
    ownershipType: "LLC",
    ownerName: "68 PERRY STREET, LLC"
  },
  "8": {
    id: "8",
    name: "41 Elizabeth Street",
    address: "41 ELIZABETH STREET",
    assessedValue: 3802950,
    marketValue: 8451000,
    marketValuePerSqFt: 185,
    yearBuilt: "1920",
    yearRenovated: "2003",
    numFloors: 7,
    buildingClass: "O6",
    lotArea: 7052,
    buildingArea: 45700,
    residentialArea: 0,
    commercialArea: 45700,
    unitsResidential: 0,
    unitsCommercial: 22,
    unitsTotal: 22,
    zoning: "C6-2G",
    builtFAR: 6.48,
    maxFAR: 6.50,
    unusedFARPercent: 0,
    neighborhood: "Chinatown",
    ownershipType: "Corporation",
    ownerName: "ELDAD RLTY CORP"
  },
  "10": {
    id: "10",
    name: "131 Perry Street",
    address: "131 PERRY STREET",
    assessedValue: 3614400,
    marketValue: 8032000,
    marketValuePerSqFt: 251,
    yearBuilt: "1905",
    yearRenovated: "1980",
    numFloors: 7,
    buildingClass: "D0",
    lotArea: 4750,
    buildingArea: 32000,
    residentialArea: 31000,
    commercialArea: 1000,
    unitsResidential: 14,
    unitsCommercial: 0,
    unitsTotal: 14,
    zoning: "C1-6A",
    builtFAR: 6.74,
    maxFAR: 4.00,
    unusedFARPercent: 0, // Grandfathered, over current max
    neighborhood: "West Village",
    historicDistrict: "Greenwich Village Historic District",
    ownershipType: "Co-op",
    ownerName: "131 PERRY ST APARTMENT CORP"
  },
  "11": {
    id: "11",
    name: "123 1st Avenue",
    address: "123 1 AVENUE",
    assessedValue: 1337400,
    marketValue: 2972000,
    marketValuePerSqFt: 808,
    yearBuilt: "1900",
    numFloors: 4,
    buildingClass: "S3",
    lotArea: 1000,
    buildingArea: 3680,
    residentialArea: 2740,
    commercialArea: 940,
    unitsResidential: 3,
    unitsCommercial: 1,
    unitsTotal: 4,
    zoning: "R7A / C1-5",
    builtFAR: 3.68,
    maxFAR: 4.00,
    unusedFARPercent: 9,
    neighborhood: "East Village",
    ownershipType: "LLC",
    ownerName: "LUNAR ESTATES, LLC"
  },
  "13": {
    id: "13",
    name: "136 West 17th Street",
    address: "136 WEST 17 STREET",
    assessedValue: 4890151,
    marketValue: 10867002,
    marketValuePerSqFt: 970,
    yearBuilt: "2013", // Complete rebuild 2012-2014
    yearRenovated: "2013",
    numFloors: 10,
    buildingClass: "RM",
    lotArea: 2300,
    buildingArea: 11200,
    residentialArea: 9543,
    commercialArea: 1657,
    unitsResidential: 7,
    unitsCommercial: 1,
    unitsTotal: 8,
    zoning: "C6-2A",
    builtFAR: 4.87,
    maxFAR: 6.50,
    unusedFARPercent: 25,
    neighborhood: "Chelsea",
    ownershipType: "Condo",
    ownerName: "UNAVAILABLE OWNER"
  },
  "14": {
    id: "14",
    name: "Rubin Museum",
    address: "150 WEST 17 STREET",
    assessedValue: 2083050,
    marketValue: 4629000,
    marketValuePerSqFt: 386,
    yearBuilt: "1915",
    yearRenovated: "1985",
    numFloors: 6,
    buildingClass: "P7",
    lotArea: 2231,
    buildingArea: 12000,
    residentialArea: 0,
    commercialArea: 12000,
    unitsResidential: 0,
    unitsCommercial: 2,
    unitsTotal: 2,
    zoning: "C6-2A",
    builtFAR: 5.38,
    maxFAR: 6.50,
    unusedFARPercent: 17,
    neighborhood: "Chelsea",
    ownershipType: "Trust",
    ownerName: "RUBIN, DONALD CULTURAL TRUST"
  },
  "15": {
    id: "15",
    name: "133 East 15th Street",
    address: "133 EAST 15 STREET",
    assessedValue: 1486350,
    marketValue: 3303000,
    marketValuePerSqFt: 346,
    yearBuilt: "1900",
    yearRenovated: "1986",
    numFloors: 4,
    buildingClass: "C6",
    lotArea: 2581,
    buildingArea: 9535,
    residentialArea: 9535,
    commercialArea: 0,
    unitsResidential: 13,
    unitsCommercial: 0,
    unitsTotal: 13,
    zoning: "R8B",
    builtFAR: 3.69,
    maxFAR: 4.00,
    unusedFARPercent: 8,
    neighborhood: "Union Square",
    ownershipType: "Co-op",
    ownerName: "13315 OWNERS CORP."
  },
  "17": {
    id: "17",
    name: "178 Spring Street",
    address: "178 SPRING STREET",
    assessedValue: 2191050,
    marketValue: 4869000,
    marketValuePerSqFt: 964,
    yearBuilt: "1854",
    numFloors: 5,
    buildingClass: "C4",
    lotArea: 1260,
    buildingArea: 5049,
    residentialArea: 4239,
    commercialArea: 810,
    unitsResidential: 4,
    unitsCommercial: 0,
    unitsTotal: 4,
    zoning: "R7-2 / C1-5",
    builtFAR: 4.01,
    maxFAR: 6.50,
    unusedFARPercent: 62,
    neighborhood: "SoHo",
    historicDistrict: "Sullivan-Thompson Historic District",
    ownershipType: "Corporation",
    ownerName: "HWS 178 SPRING STREET CORP."
  },
  "18": {
    id: "18",
    name: "36 Walker Street",
    address: "36 WALKER STREET",
    assessedValue: 660180,
    marketValue: 1467067,
    marketValuePerSqFt: 171,
    yearBuilt: "1860",
    numFloors: 5,
    buildingClass: "K4",
    lotArea: 1883,
    buildingArea: 8600,
    residentialArea: 0,
    commercialArea: 8600,
    unitsResidential: 0,
    unitsCommercial: 5,
    unitsTotal: 5,
    zoning: "C6-2A",
    builtFAR: 4.57,
    maxFAR: 6.50,
    unusedFARPercent: 42,
    neighborhood: "Tribeca",
    historicDistrict: "Tribeca East Historic District",
    ownershipType: "LLC",
    ownerName: "36 WALKER LLC"
  },
  "21": {
    id: "21",
    name: "148 Chambers Street",
    address: "148 CHAMBERS STREET",
    assessedValue: 4767749,
    marketValue: 10594998,
    marketValuePerSqFt: 804,
    yearBuilt: "1915",
    yearRenovated: "1987",
    numFloors: 7.5,
    buildingClass: "RM",
    lotArea: 1922,
    buildingArea: 13177,
    residentialArea: 10197,
    commercialArea: 2980,
    unitsResidential: 6,
    unitsCommercial: 1,
    unitsTotal: 7,
    zoning: "C6-3A",
    builtFAR: 6.86,
    maxFAR: 7.50,
    unusedFARPercent: 9,
    neighborhood: "Tribeca",
    ownershipType: "Condo",
    ownerName: "EVAN TOUHEY"
  }
};

export class PropertyDataService {
  /**
   * Get property details by building ID
   */
  static getPropertyDetails(buildingId: string): PropertyDetails | null {
    return propertyData[buildingId] || null;
  }

  /**
   * Get all properties
   */
  static getAllProperties(): PropertyDetails[] {
    return Object.values(propertyData);
  }

  /**
   * Get portfolio statistics
   */
  static getPortfolioStats() {
    const properties = this.getAllProperties();

    return {
      totalBuildings: properties.length,
      totalAssessedValue: properties.reduce((sum, p) => sum + p.assessedValue, 0),
      totalMarketValue: properties.reduce((sum, p) => sum + p.marketValue, 0),
      totalUnitsResidential: properties.reduce((sum, p) => sum + p.unitsResidential, 0),
      totalUnitsCommercial: properties.reduce((sum, p) => sum + p.unitsCommercial, 0),
      totalSquareFeet: properties.reduce((sum, p) => sum + p.buildingArea, 0),
      avgMarketValuePerSqFt: Math.round(
        properties.reduce((sum, p) => sum + p.marketValue, 0) /
        properties.reduce((sum, p) => sum + p.buildingArea, 0)
      ),
      historicBuildings: properties.filter(p => p.historicDistrict).length,
      condoBuildings: properties.filter(p => p.ownershipType === 'Condo').length,
      buildingsWithDevelopmentPotential: properties.filter(p => p.unusedFARPercent > 20).length
    };
  }

  /**
   * Get top properties by market value
   */
  static getTopPropertiesByValue(count: number = 5): PropertyDetails[] {
    return this.getAllProperties()
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, count);
  }

  /**
   * Get properties with development potential
   */
  static getPropertiesWithDevelopmentPotential(): PropertyDetails[] {
    return this.getAllProperties()
      .filter(p => p.unusedFARPercent > 20)
      .sort((a, b) => b.unusedFARPercent - a.unusedFARPercent);
  }

  /**
   * Get historic district properties
   */
  static getHistoricProperties(): PropertyDetails[] {
    return this.getAllProperties()
      .filter(p => p.historicDistrict);
  }

  /**
   * Format currency
   */
  static formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  }

  /**
   * Format number with commas
   */
  static formatNumber(value: number): string {
    return value.toLocaleString();
  }
}
