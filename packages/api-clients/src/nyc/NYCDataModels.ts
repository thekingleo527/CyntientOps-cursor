// packages/api-clients/src/nyc/NYCDataModels.ts

// HPD Violations Data Model
export interface HPDViolation {
  violationid: string;
  buildingid: string;
  registrationid: string;
  bbl: string;
  bin: string;
  boro: string;
  housenumber: string;
  streetname: string;
  apartment: string;
  story: string;
  block: string;
  lot: string;
  violationclass: string;
  inspectiondate: string;
  approveddate: string;
  originalcertifybydate: string;
  originalcorrectbydate: string;
  newcertifybydate: string;
  newcorrectbydate: string;
  certifieddate: string;
  ordernumber: string;
  novid: string;
  novdescription: string;
  novissueddate: string;
  currentstatus: string;
  currentstatusdate: string;
  novtype: string;
  violationstatus: string;
  latitude: string;
  longitude: string;
  communityboard: string;
  councildistrict: string;
  censustract: string;
  nta: string;
  ntaname: string;
  bbl_10_digit: string;
  bin_10_digit: string;
}

// DOB Permits Data Model
export interface DOBPermit {
  job_filing_number: string;
  job_type: string;
  job_status: string;
  job_status_descrp: string;
  job_status_date: string;
  latest_action_date: string;
  building_type: string;
  community_board: string;
  cluster: string;
  landmark: string;
  adult_estab: string;
  loft_board: string;
  city_owned: string;
  little_e: string;
  pcfiled: string;
  efiling_filed: string;
  plumb: string;
  boiler: string;
  fuel_burning: string;
  fuel_burning_equipment: string;
  sprinkler: string;
  standpipe: string;
  other: string;
  otherdesc: string;
  applicant_license: string;
  applicant_license_type: string;
  applicant_individual_license: string;
  applicant_individual_license_type: string;
  applicant_professional_license: string;
  applicant_professional_license_type: string;
  applicant_business_name: string;
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_phone: string;
  applicant_s_license: string;
  applicant_s_license_type: string;
  applicant_s_individual_license: string;
  applicant_s_individual_license_type: string;
  applicant_s_professional_license: string;
  applicant_s_professional_license_type: string;
  applicant_s_business_name: string;
  applicant_s_first_name: string;
  applicant_s_last_name: string;
  applicant_s_phone: string;
  owner_license: string;
  owner_license_type: string;
  owner_individual_license: string;
  owner_individual_license_type: string;
  owner_professional_license: string;
  owner_professional_license_type: string;
  owner_business_name: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_phone: string;
  owner_s_license: string;
  owner_s_license_type: string;
  owner_s_individual_license: string;
  owner_s_individual_license_type: string;
  owner_s_professional_license: string;
  owner_s_professional_license_type: string;
  owner_s_business_name: string;
  owner_s_first_name: string;
  owner_s_last_name: string;
  owner_s_phone: string;
  job_start_date: string;
  job_end_date: string;
  job_cost: string;
  job_floor_count: string;
  job_units_count: string;
  lot: string;
  block: string;
  bin: string;
  bbl: string;
  house: string;
  street_name: string;
  borough: string;
  xcoord: string;
  ycoord: string;
  latitude: string;
  longitude: string;
  community_board: string;
  censustract: string;
  nta: string;
  ntaname: string;
}

// DSNY Collection Schedule Data Model
export interface DSNYRoute {
  bin: string;
  bbl: string;
  address: string;
  borough: string;
  community_board: string;
  council_district: string;
  census_tract: string;
  nta: string;
  nta_name: string;
  sanitation_district: string;
  sanitation_section: string;
  sanitation_subsection: string;
  collection_day: string;
  collection_frequency: string;
  collection_type: string;
  bulk_pickup_day: string;
  bulk_pickup_frequency: string;
  recycling_day: string;
  recycling_frequency: string;
  organics_day: string;
  organics_frequency: string;
  paper_day: string;
  paper_frequency: string;
  metal_glass_plastic_day: string;
  metal_glass_plastic_frequency: string;
  leaf_collection_day: string;
  leaf_collection_frequency: string;
  christmas_tree_collection_day: string;
  christmas_tree_collection_frequency: string;
  latitude: string;
  longitude: string;
  xcoord: string;
  ycoord: string;
}

// LL97 Emissions Data Model (Local Law 97)
export interface LL97Emission {
  bbl: string;
  bin: string;
  address: string;
  borough: string;
  building_class: string;
  building_type: string;
  year_built: string;
  number_of_buildings: string;
  number_of_floors: string;
  occupancy: string;
  energy_star_score: string;
  site_eui: string;
  source_eui: string;
  weather_normalized_site_eui: string;
  weather_normalized_source_eui: string;
  total_ghg_emissions: string;
  total_ghg_emissions_intensity: string;
  electricity_use: string;
  electricity_ghg_emissions: string;
  electricity_ghg_emissions_intensity: string;
  natural_gas_use: string;
  natural_gas_ghg_emissions: string;
  natural_gas_ghg_emissions_intensity: string;
  steam_use: string;
  steam_ghg_emissions: string;
  steam_ghg_emissions_intensity: string;
  fuel_oil_2_use: string;
  fuel_oil_2_ghg_emissions: string;
  fuel_oil_2_ghg_emissions_intensity: string;
  fuel_oil_4_use: string;
  fuel_oil_4_ghg_emissions: string;
  fuel_oil_4_ghg_emissions_intensity: string;
  fuel_oil_5_6_use: string;
  fuel_oil_5_6_ghg_emissions: string;
  fuel_oil_5_6_ghg_emissions_intensity: string;
  diesel_2_use: string;
  diesel_2_ghg_emissions: string;
  diesel_2_ghg_emissions_intensity: string;
  kerosene_use: string;
  kerosene_ghg_emissions: string;
  kerosene_ghg_emissions_intensity: string;
  propane_use: string;
  propane_ghg_emissions: string;
  propane_ghg_emissions_intensity: string;
  wood_use: string;
  wood_ghg_emissions: string;
  wood_ghg_emissions_intensity: string;
  coal_anthracite_use: string;
  coal_anthracite_ghg_emissions: string;
  coal_anthracite_ghg_emissions_intensity: string;
  coal_bituminous_use: string;
  coal_bituminous_ghg_emissions: string;
  coal_bituminous_ghg_emissions_intensity: string;
  coke_use: string;
  coke_ghg_emissions: string;
  coke_ghg_emissions_intensity: string;
  other_fuel_use: string;
  other_fuel_ghg_emissions: string;
  other_fuel_ghg_emissions_intensity: string;
  latitude: string;
  longitude: string;
  xcoord: string;
  ycoord: string;
  community_board: string;
  census_tract: string;
  nta: string;
  nta_name: string;
}

// DSNY Violations Data Model (OATH Hearings Division Case Status)
// Dataset: jz4z-kudi (OATH ECB Hearings)
export interface DSNYViolation {
  ticket_number: string;
  violation_date: string;
  violation_time?: string;
  issuing_agency: string;
  respondent_first_name?: string;
  respondent_last_name?: string;
  balance_due?: string;
  violation_location_borough?: string;
  violation_location_block_no?: string;
  violation_location_lot_no?: string;
  violation_location_house?: string;
  violation_location_street_name?: string;
  violation_location_city?: string;
  violation_location_zip_code?: string;
  violation_location_state_name?: string;
  respondent_address_borough?: string;
  respondent_address_house?: string;
  respondent_address_street_name?: string;
  respondent_address_city?: string;
  respondent_address_zip_code?: string;
  respondent_address_state_name?: string;
  hearing_status?: string;
  hearing_result?: string;
  scheduled_hearing_location?: string;
  hearing_date?: string;
  hearing_time?: string;
  decision_date?: string;
  total_violation_amount?: string;
  violation_details?: string;
  penalty_imposed?: string;
  paid_amount?: string;
  additional_penalties_or_late_fees?: string;
  compliance_status?: string;
  charge_1_code?: string;
  charge_1_code_section?: string;
  charge_1_code_description?: string;
  charge_1_infraction_amount?: string;
  charge_2_code?: string;
  charge_2_code_section?: string;
  charge_2_code_description?: string;
  charge_3_code?: string;
  charge_3_code_section?: string;
  charge_3_code_description?: string;
}

// Comprehensive NYC Compliance Data
export interface NYCComplianceData {
  bbl: string;
  violations: HPDViolation[];
  permits: DOBPermit[];
  emissions: LL97Emission[];
  dsnyViolations?: any; // DSNYViolationsResult from DSNYViolationsService
  lastUpdated: Date;
}

// Compliance Summary for Dashboard Display
export interface ComplianceSummary {
  bbl: string;
  buildingId: string;
  buildingName: string;
  address: string;
  totalViolations: number;
  openViolations: number;
  criticalViolations: number;
  recentPermits: number;
  activePermits: number;
  emissionsScore: number;
  complianceStatus: 'compliant' | 'warning' | 'critical';
  lastInspectionDate: Date | null;
  nextInspectionDue: Date | null;
  riskLevel: 'low' | 'medium' | 'high';
}

// DSNY Collection Schedule Summary
export interface CollectionScheduleSummary {
  bin: string;
  buildingId: string;
  buildingName: string;
  address: string;
  regularCollectionDay: string;
  recyclingDay: string;
  organicsDay: string;
  bulkPickupDay: string;
  nextCollectionDate: Date;
  nextRecyclingDate: Date;
  nextOrganicsDate: Date;
  nextBulkPickupDate: Date;
  collectionFrequency: string;
  specialInstructions: string[];
}

// NYC API Response Types
export interface NYCAPIResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// Error Types
export interface NYCAPIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Filter Types for API Queries
export interface HPDViolationFilters {
  bbl?: string;
  bin?: string;
  status?: string;
  violationClass?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface DOBPermitFilters {
  bbl?: string;
  bin?: string;
  jobType?: string;
  jobStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface DSNYRouteFilters {
  bin?: string;
  bbl?: string;
  borough?: string;
  communityBoard?: string;
  collectionDay?: string;
  limit?: number;
  offset?: number;
}

export interface LL97EmissionFilters {
  bbl?: string;
  bin?: string;
  borough?: string;
  buildingClass?: string;
  yearBuiltFrom?: string;
  yearBuiltTo?: string;
  limit?: number;
  offset?: number;
}

export interface DSNYViolationFilters {
  address?: string;
  streetName?: string;
  houseNumber?: string;
  borough?: string;
  ticketNumber?: string;
  hearingStatus?: string;
  violationDateFrom?: string;
  violationDateTo?: string;
  limit?: number;
  offset?: number;
}
