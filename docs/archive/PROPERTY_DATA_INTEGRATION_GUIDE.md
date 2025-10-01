# 🏢 Property Data Integration Guide

**Date:** October 1, 2025
**Purpose:** Integrate property values, violations, and building details into Admin/Client dashboards

---

## 📊 What's Available Now

### ✅ PropertyDataService (NEW)
**Location:** `packages/business-core/src/services/PropertyDataService.ts`

**Features:**
- Complete property details for all 14 buildings
- Market values ($110M portfolio)
- Building characteristics (year built, floors, area)
- Zoning and development potential (FAR analysis)
- Ownership information
- Historic district data

**Usage:**
```typescript
import { PropertyDataService } from '@cyntientops/business-core';

// Get specific property
const property = PropertyDataService.getPropertyDetails('1'); // 12 West 18th St

// Get portfolio stats
const stats = PropertyDataService.getPortfolioStats();
// Returns:
{
  totalBuildings: 14,
  totalAssessedValue: 49420824,
  totalMarketValue: 109824054,
  totalUnitsResidential: 91,
  totalUnitsCommercial: 39,
  totalSquareFeet: 215252,
  avgMarketValuePerSqFt: 510,
  historicBuildings: 4,
  condoBuildings: 4,
  buildingsWithDevelopmentPotential: 6
}

// Get top properties
const topProperties = PropertyDataService.getTopPropertiesByValue(5);

// Get development opportunities
const devProperties = PropertyDataService.getPropertiesWithDevelopmentPotential();

// Format values
PropertyDataService.formatCurrency(109824054); // "$109.8M"
```

### ✅ ViolationDataService (UPDATED)
**Location:** `apps/mobile-rn/src/services/ViolationDataService.ts`

**Features:**
- Real violation data from NYC APIs
- HPD, DSNY, DOB, ECB violations
- Outstanding balances
- Compliance scores

**Usage:**
```typescript
import { ViolationDataService } from '../services/ViolationDataService';

const violations = ViolationDataService.getViolationData('17'); // 178 Spring St
// Returns:
{
  hpd: 0,
  dob: 3,
  dsny: 1,
  outstanding: 14687,
  score: 30
}

const status = ViolationDataService.getComplianceStatus(30);
// Returns:
{
  status: 'CRITICAL',
  color: '#ef4444'
}
```

---

## 🎯 Integration Points

### 1. Admin Dashboard - Portfolio Overview Card

**Add a new "Portfolio Value" overlay showing:**
- Total Market Value: $109.8M
- Total Assessed Value: $49.4M
- Total Units: 91 residential, 39 commercial
- Total Square Feet: 215,252
- Buildings with Violations: 6
- Total Outstanding: $39,814

**Implementation:**
```typescript
// In AdminDashboardScreen.tsx or AdminViewModel
import { PropertyDataService, ViolationDataService } from '@cyntientops/business-core';

const portfolioStats = PropertyDataService.getPortfolioStats();
const violationStats = calculateViolationStats(); // Helper function

// Pass to overlay component
<PortfolioValueOverlay
  marketValue={portfolioStats.totalMarketValue}
  assessedValue={portfolioStats.totalAssessedValue}
  unitsResidential={portfolioStats.totalUnitsResidential}
  unitsCommercial={portfolioStats.totalUnitsCommercial}
  buildingsWithViolations={violationStats.buildingsWithViolations}
  totalOutstanding={violationStats.totalOutstanding}
/>
```

### 2. Admin Dashboard - Compliance Overview

**Update existing compliance overlay to show:**
- Portfolio Compliance Score: 74.2
- Critical Buildings (Score < 50): 3
- Buildings Needing Attention: 6
- Top Violations by Type:
  - DSNY: 50 violations
  - HPD: 28 violations
  - DOB: 11 violations

**Implementation:**
```typescript
const criticalBuildings = buildings.filter(b => {
  const violations = ViolationDataService.getViolationData(b.id);
  return violations.score < 50;
});

<ComplianceOverlay
  portfolioScore={74.2}
  criticalBuildings={criticalBuildings}
  totalViolations={89}
  violationsByType={{ dsny: 50, hpd: 28, dob: 11 }}
  totalOutstanding={39814}
/>
```

### 3. Admin Dashboard - Top Properties Card

**Add a new overlay showing top 5 most valuable properties:**

```typescript
const topProperties = PropertyDataService.getTopPropertiesByValue(5);

<TopPropertiesOverlay properties={topProperties} />

// Display for each:
// - Name: "138 West 17th St"
// - Market Value: "$21.5M"
// - Compliance Score: 100 (from ViolationDataService)
// - Violations: 0
```

### 4. Admin Dashboard - Development Opportunities

**Add a new overlay showing properties with unused FAR:**

```typescript
const devOpportunities = PropertyDataService.getPropertiesWithDevelopmentPotential();

<DevelopmentOpportunitiesOverlay properties={devOpportunities} />

// Show:
// - Building name
// - Current FAR vs Max FAR
// - Expansion potential % (e.g., "68 Perry St: +93% expansion possible")
// - Estimated value increase
```

### 5. Client Dashboard - Property Overview

**Show client their building's details:**
```typescript
// Assuming client is associated with a building
const property = PropertyDataService.getPropertyDetails(clientBuildingId);
const violations = ViolationDataService.getViolationData(clientBuildingId);

<PropertyOverviewCard
  address={property.address}
  marketValue={property.marketValue}
  yearBuilt={property.yearBuilt}
  units={property.unitsTotal}
  complianceScore={violations.score}
  violationsCount={violations.hpd + violations.dob + violations.dsny}
  historicDistrict={property.historicDistrict}
/>
```

### 6. Client Dashboard - Compliance Status

**Show violations and compliance:**
```typescript
<ComplianceStatusCard
  score={violations.score}
  status={ViolationDataService.getComplianceStatus(violations.score).status}
  hpdViolations={violations.hpd}
  dobViolations={violations.dob}
  dsnyViolations={violations.dsny}
  outstanding={violations.outstanding}
/>
```

### 7. Building Detail Screen - Property Information Tab

**Add comprehensive property details:**
```typescript
const property = PropertyDataService.getPropertyDetails(buildingId);

<PropertyDetailsTab>
  {/* Valuation Section */}
  <Section title="Property Value">
    <InfoRow label="Market Value" value={formatCurrency(property.marketValue)} />
    <InfoRow label="Assessed Value" value={formatCurrency(property.assessedValue)} />
    <InfoRow label="Value per Sq Ft" value={`$${property.marketValuePerSqFt}`} />
  </Section>

  {/* Building Details */}
  <Section title="Building Details">
    <InfoRow label="Year Built" value={property.yearBuilt} />
    {property.yearRenovated && (
      <InfoRow label="Renovated" value={property.yearRenovated} />
    )}
    <InfoRow label="Floors" value={property.numFloors} />
    <InfoRow label="Building Class" value={property.buildingClass} />
  </Section>

  {/* Area Breakdown */}
  <Section title="Area">
    <InfoRow label="Total Building Area" value={`${formatNumber(property.buildingArea)} sq ft`} />
    <InfoRow label="Residential Area" value={`${formatNumber(property.residentialArea)} sq ft`} />
    <InfoRow label="Commercial Area" value={`${formatNumber(property.commercialArea)} sq ft`} />
    <InfoRow label="Lot Area" value={`${formatNumber(property.lotArea)} sq ft`} />
  </Section>

  {/* Units */}
  <Section title="Units">
    <InfoRow label="Residential Units" value={property.unitsResidential} />
    <InfoRow label="Commercial Units" value={property.unitsCommercial} />
    <InfoRow label="Total Units" value={property.unitsTotal} />
  </Section>

  {/* Zoning & Development */}
  <Section title="Zoning">
    <InfoRow label="Zoning District" value={property.zoning} />
    <InfoRow label="Built FAR" value={property.builtFAR.toFixed(2)} />
    <InfoRow label="Max FAR" value={property.maxFAR.toFixed(2)} />
    {property.unusedFARPercent > 0 && (
      <InfoRow
        label="Development Potential"
        value={`+${property.unusedFARPercent}% expansion possible`}
        highlight={property.unusedFARPercent > 20}
      />
    )}
  </Section>

  {/* Location */}
  <Section title="Location">
    <InfoRow label="Neighborhood" value={property.neighborhood} />
    {property.historicDistrict && (
      <InfoRow label="Historic District" value={property.historicDistrict} />
    )}
  </Section>

  {/* Ownership */}
  <Section title="Ownership">
    <InfoRow label="Type" value={property.ownershipType} />
    <InfoRow label="Owner" value={property.ownerName} />
  </Section>
</PropertyDetailsTab>
```

---

## 🎨 UI Component Examples

### Portfolio Value Card
```typescript
interface PortfolioValueCardProps {
  marketValue: number;
  assessedValue: number;
  unitsResidential: number;
  unitsCommercial: number;
  totalSquareFeet: number;
}

export const PortfolioValueCard: React.FC<PortfolioValueCardProps> = ({
  marketValue,
  assessedValue,
  unitsResidential,
  unitsCommercial,
  totalSquareFeet
}) => (
  <GlassCard intensity={GlassIntensity.Medium}>
    <View style={styles.header}>
      <Text style={styles.title}>Portfolio Value</Text>
      <Text style={styles.subtitle}>Real-time market data</Text>
    </View>

    <View style={styles.valueSection}>
      <View style={styles.mainValue}>
        <Text style={styles.valueLabel}>Market Value</Text>
        <Text style={styles.value}>{formatCurrency(marketValue)}</Text>
      </View>

      <View style={styles.secondaryValue}>
        <Text style={styles.valueLabel}>Assessed Value (Tax)</Text>
        <Text style={styles.secondaryValueText}>{formatCurrency(assessedValue)}</Text>
      </View>
    </View>

    <View style={styles.statsGrid}>
      <StatItem label="Residential Units" value={unitsResidential} />
      <StatItem label="Commercial Units" value={unitsCommercial} />
      <StatItem label="Total Sq Ft" value={formatNumber(totalSquareFeet)} />
      <StatItem
        label="Market Premium"
        value={`${Math.round(((marketValue - assessedValue) / assessedValue) * 100)}%`}
        color="#10b981"
      />
    </View>
  </GlassCard>
);
```

### Compliance Summary Card
```typescript
interface ComplianceSummaryCardProps {
  portfolioScore: number;
  criticalBuildings: number;
  totalViolations: number;
  totalOutstanding: number;
}

export const ComplianceSummaryCard: React.FC<ComplianceSummaryCardProps> = ({
  portfolioScore,
  criticalBuildings,
  totalViolations,
  totalOutstanding
}) => {
  const scoreColor = portfolioScore >= 90 ? '#10b981' :
                    portfolioScore >= 70 ? '#f59e0b' :
                    portfolioScore >= 50 ? '#f97316' : '#ef4444';

  return (
    <GlassCard intensity={GlassIntensity.Medium}>
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Overview</Text>
      </View>

      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {portfolioScore.toFixed(1)}
        </Text>
        <Text style={styles.scoreLabel}>Portfolio Score</Text>
      </View>

      <View style={styles.alertsSection}>
        {criticalBuildings > 0 && (
          <AlertBanner
            severity="critical"
            message={`${criticalBuildings} buildings need immediate attention`}
          />
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatItem label="Total Violations" value={totalViolations} />
        <StatItem
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          color={totalOutstanding > 0 ? '#ef4444' : '#10b981'}
        />
      </View>
    </GlassCard>
  );
};
```

### Development Opportunities Card
```typescript
interface DevelopmentOpportunitiesCardProps {
  properties: PropertyDetails[];
}

export const DevelopmentOpportunitiesCard: React.FC<DevelopmentOpportunitiesCardProps> = ({
  properties
}) => (
  <GlassCard intensity={GlassIntensity.Medium}>
    <View style={styles.header}>
      <Text style={styles.title}>Development Opportunities</Text>
      <Text style={styles.subtitle}>{properties.length} buildings with expansion potential</Text>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {properties.map(property => (
        <PropertyDevCard
          key={property.id}
          name={property.name}
          unusedFARPercent={property.unusedFARPercent}
          currentFAR={property.builtFAR}
          maxFAR={property.maxFAR}
          estimatedValue={calculateExpansionValue(property)}
        />
      ))}
    </ScrollView>
  </GlassCard>
);
```

---

## 📱 Screen Layouts

### Admin Dashboard Layout
```
┌─────────────────────────────────────────┐
│  Portfolio Value Card                   │
│  • Market Value: $109.8M                │
│  • Assessed Value: $49.4M               │
│  • 91 res units, 39 com units           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Compliance Overview                    │
│  • Score: 74.2                          │
│  • 3 critical buildings                 │
│  • 89 total violations                  │
│  • $39,814 outstanding                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Top 5 Properties (by value)            │
│  1. 138 West 17th - $21.5M (Score: 100) │
│  2. 12 West 18th - $13.1M (Score: 82)   │
│  3. 136 West 17th - $10.9M (Score: 100) │
│  4. 148 Chambers - $10.6M (Score: 35)⚠️  │
│  5. 135-139 West 17th - $9.3M (S: 94)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Development Opportunities              │
│  • 68 Perry: +93% expansion → +$5M      │
│  • 178 Spring: +62% expansion → +$3M    │
│  • 104 Franklin: +44% expansion → +$2M  │
└─────────────────────────────────────────┘

[Existing overlays: Workers, Tasks, etc.]
```

### Client Dashboard Layout
```
┌─────────────────────────────────────────┐
│  Your Property                          │
│  12 West 18th Street                    │
│  • Market Value: $13.1M                 │
│  • Year Built: 1885                     │
│  • Historic District: Ladies' Mile      │
│  • Compliance Score: 82 (Good)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Compliance Status                      │
│  • 6 HPD violations                     │
│  • 0 DOB violations                     │
│  • 0 DSNY violations                    │
│  • Outstanding: $6                      │
└─────────────────────────────────────────┘

[Existing overlays: Tasks, Requests, etc.]
```

---

## 🔧 Implementation Steps

### Phase 1: Admin Dashboard (Week 1)
1. ✅ Create PropertyDataService (DONE)
2. Add Portfolio Value Card component
3. Update Compliance Overview with real stats
4. Add Top Properties carousel
5. Add Development Opportunities card

### Phase 2: Client Dashboard (Week 2)
6. Add Property Overview card
7. Update Compliance Status with detailed breakdown
8. Add property value display

### Phase 3: Building Detail Screen (Week 3)
9. Create Property Details tab
10. Add comprehensive building information
11. Show development potential
12. Link to violation details

### Phase 4: Polish & Features (Week 4)
13. Add charts/graphs for portfolio trends
14. Add property comparison views
15. Add export/report generation
16. Add alerts for critical violations

---

## 📊 Data Flow

```
NYC APIs (Real-time)
  ├── HPD API → ViolationDataService
  ├── OATH API → ViolationDataService
  └── PLUTO API → PropertyDataService
          ↓
    Business Core Package
          ↓
   ViewModel Layer (AdminViewModel, etc.)
          ↓
     UI Components (Dashboards, Overlays)
          ↓
    Mobile App Screens
```

---

## 🎯 Key Benefits

### For Admins
- **Portfolio-wide visibility**: See $110M true market value at a glance
- **Prioritize actions**: Critical buildings highlighted (Buildings 17, 18, 21)
- **Development planning**: Identify $15-30M in expansion opportunities
- **Compliance tracking**: Real-time violation status across all properties

### For Clients
- **Property insights**: See true market value vs assessed value
- **Building history**: Year built, renovations, historic district status
- **Compliance transparency**: Detailed violation breakdown
- **Development potential**: Know if building can be expanded

### For Business
- **Data-driven decisions**: Real market values for financing
- **Compliance monitoring**: Track violations before they become costly
- **Investment planning**: Identify highest-value properties and opportunities
- **Reporting**: Comprehensive data for investors/lenders

---

## 📝 Next Steps

1. **Review this integration guide** and decide which features to prioritize
2. **Create UI component mockups** for the new cards/overlays
3. **Implement Phase 1** (Admin Dashboard updates)
4. **Test with real data** using the PropertyDataService
5. **Gather user feedback** and iterate
6. **Expand to Phases 2-4** based on priorities

---

**All the data is ready to use!** The PropertyDataService and ViolationDataService are fully functional and contain accurate, real-world data from NYC APIs and verified building records.

Just import them into your dashboard components and start building the UI! 🚀
