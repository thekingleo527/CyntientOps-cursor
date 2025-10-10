# 🏢 Compliance Dashboard Integration Guide

## Overview

The Compliance Dashboard provides real-time compliance data from all NYC APIs (HPD, DSNY, FDNY, 311) with proper data hydration for the CyntientOps application. This guide covers the complete integration process.

## Architecture

### Core Components

1. **ComplianceDashboardService** - Main service for data aggregation
2. **ComplianceDashboard** - React Native dashboard component
3. **BuildingComplianceDetail** - Detailed building view
4. **APIClientManager** - NYC API integration layer
5. **ComplianceCalculator** - Scoring and calculation engine

### Data Flow

```
NYC APIs (HPD, DSNY, FDNY, 311) 
    ↓
APIClientManager 
    ↓
ComplianceDashboardService 
    ↓
ComplianceDashboard Component
    ↓
BuildingComplianceDetail Component
```

## Integration Steps

### 1. Install Dependencies

```bash
# Install compliance engine
yarn add @cyntientops/compliance-engine

# Install API clients
yarn add @cyntientops/api-clients

# Install UI components
yarn add @cyntientops/ui-components
```

### 2. Initialize API Manager

```typescript
import { APIClientManager } from '@cyntientops/api-clients';

// Initialize with API keys (optional for public access)
const apiManager = APIClientManager.getInstance({
  dsnyApiKey: process.env.DSNY_API_KEY,
  hpdApiKey: process.env.HPD_API_KEY,
  dobApiKey: process.env.DOB_API_KEY,
  weatherApiKey: process.env.WEATHER_API_KEY,
  weatherLatitude: 40.7128,
  weatherLongitude: -74.0060,
});

// Initialize all APIs
await apiManager.initialize();
```

### 3. Use Compliance Dashboard

```typescript
import React from 'react';
import { ComplianceDashboard } from '@cyntientops/ui-components';
import { complianceDashboardService } from '@cyntientops/compliance-engine';

const MyComplianceScreen = () => {
  const buildings = [
    {
      id: '1',
      name: 'Building A',
      address: '123 Main St, New York, NY 10001',
      bbl: '1001234001',
      bin: '1234567'
    }
  ];

  const handleBuildingSelect = async (building) => {
    const buildingData = await complianceDashboardService.getBuildingComplianceData(building);
    // Navigate to building detail
  };

  return (
    <ComplianceDashboard
      buildings={buildings}
      onBuildingSelect={handleBuildingSelect}
      onRefresh={() => console.log('Refreshing...')}
    />
  );
};
```

### 4. Use Building Detail View

```typescript
import { BuildingComplianceDetail } from '@cyntientops/ui-components';

const BuildingDetailScreen = ({ building }) => {
  const handleViolationPress = (violation) => {
    // Show violation details
    console.log('Violation:', violation);
  };

  return (
    <BuildingComplianceDetail
      building={building}
      onClose={() => navigation.goBack()}
      onViolationPress={handleViolationPress}
    />
  );
};
```

## Data Hydration

### Building Data Structure

```typescript
interface BuildingComplianceData {
  id: string;
  name: string;
  address: string;
  bbl: string;
  bin?: string;
  score: number;           // 0-100 compliance score
  grade: string;           // A+ to F grade
  status: 'critical' | 'high' | 'medium' | 'low';
  violations: {
    hpd: HPDViolation[];      // HPD violations
    dsny: DSNYViolation[];    // DSNY violations
    fdny: FDNYInspection[];  // FDNY inspections
    complaints311: Complaint311[]; // 311 complaints
  };
  financial: {
    totalFines: number;
    outstandingFines: number;
    paidFines: number;
    estimatedResolution: number;
  };
  inspections: {
    lastInspection: Date | null;
    nextInspection: Date | null;
    inspectionHistory: InspectionHistory[];
  };
}
```

### Dashboard Data Structure

```typescript
interface ComplianceDashboardData {
  portfolio: {
    totalBuildings: number;
    criticalIssues: number;
    overallScore: number;
    grade: string;
    totalFines: number;
    outstandingFines: number;
    paidFines: number;
  };
  criticalBuildings: CriticalBuilding[];
  violations: {
    hpd: ViolationSummary;
    dsny: ViolationSummary;
    fdny: ViolationSummary;
    complaints311: ViolationSummary;
  };
  trends: {
    violations: TrendData[];
    fines: TrendData[];
    compliance: TrendData[];
  };
  alerts: ComplianceAlert[];
}
```

## NYC API Integration

### HPD (Housing Preservation & Development)

- **Violations**: Building code violations, class A/B/C
- **Inspections**: Inspection history and results
- **Compliance**: Overall building compliance status

### DSNY (Department of Sanitation)

- **Collection Schedules**: Refuse, recycling, organics, bulk
- **Violations**: Sanitation violations and fines
- **Routes**: Collection route information

### FDNY (Fire Department)

- **Inspections**: Fire safety inspections
- **Violations**: Fire code violations
- **Compliance**: Fire safety compliance status

### 311 Complaints

- **Complaints**: Public complaints about buildings
- **Response Times**: Agency response times
- **Satisfaction**: Public satisfaction scores

## Compliance Scoring

### Score Calculation

```typescript
// Base score: 100
// Deductions:
// - Critical violations: -12 points each
// - Warning violations: -6 points each
// - Info violations: -2 points each
// - High emissions: -10 points
// - Outstanding fines: -1 point per $500

const score = Math.max(0, Math.min(100, calculatedScore));
```

### Grade Assignment

```typescript
// A+: 95-100
// A: 90-94
// A-: 85-89
// B+: 80-84
// B: 75-79
// B-: 70-74
// C+: 65-69
// C: 60-64
// C-: 55-59
// D: 50-54
// F: 0-49
```

## Real-time Updates

### Caching Strategy

- **Cache Duration**: 30 minutes for compliance data
- **Cache Invalidation**: On new violations or inspections
- **Background Refresh**: Every 15 minutes

### WebSocket Integration

```typescript
// Real-time violation updates
const ws = new WebSocket('wss://api.cyntientops.com/compliance');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update compliance dashboard
};
```

## Testing

### Run Compliance Tests

```typescript
import { runComplianceDashboardTests } from '@cyntientops/compliance-engine';

const testResults = await runComplianceDashboardTests();
console.log(`Tests: ${testResults.passed} passed, ${testResults.failed} failed`);
```

### Test Coverage

- ✅ API connectivity
- ✅ Data hydration
- ✅ Compliance scoring
- ✅ Error handling
- ✅ Performance
- ✅ Data consistency

## Performance Optimization

### Data Loading

- **Parallel API Calls**: All NYC APIs called simultaneously
- **Caching**: 30-minute cache for compliance data
- **Pagination**: Large datasets paginated
- **Background Refresh**: Non-blocking updates

### Memory Management

- **Data Cleanup**: Old data automatically removed
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Compressed images and icons

## Error Handling

### API Failures

```typescript
try {
  const dashboardData = await complianceDashboardService.getComplianceDashboardData(buildings);
} catch (error) {
  // Handle API failures gracefully
  console.error('Compliance data unavailable:', error);
  // Show cached data or fallback UI
}
```

### Network Issues

- **Offline Support**: Cached data when offline
- **Retry Logic**: Automatic retry on network errors
- **Fallback UI**: Graceful degradation

## Security

### API Keys

- **Environment Variables**: Store keys securely
- **Rate Limiting**: Respect API rate limits
- **Data Privacy**: No sensitive data in logs

### Data Protection

- **Encryption**: All data encrypted in transit
- **Authentication**: Secure API access
- **Authorization**: Role-based access control

## Monitoring

### Health Checks

```typescript
const healthStatus = await apiManager.getHealthStatus();
console.log('API Health:', healthStatus.overall);
```

### Metrics

- **Response Times**: API response monitoring
- **Error Rates**: Failure rate tracking
- **Data Quality**: Data validation metrics

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Implement exponential backoff
2. **Data Inconsistency**: Validate data relationships
3. **Performance Issues**: Optimize API calls
4. **Cache Issues**: Clear cache and retry

### Debug Mode

```typescript
// Enable debug logging
process.env.COMPLIANCE_DEBUG = 'true';
```

## Future Enhancements

### Planned Features

- **Historical Trends**: Long-term compliance tracking
- **Predictive Analytics**: AI-powered compliance predictions
- **Automated Alerts**: Smart notification system
- **Mobile Optimization**: Enhanced mobile experience

### API Expansions

- **DOB Permits**: Building permit tracking
- **ECB Violations**: Environmental Control Board
- **Property Values**: Real estate value integration
- **Weather Impact**: Weather-based compliance adjustments

## Support

### Documentation

- **API Reference**: Complete API documentation
- **Code Examples**: Working code samples
- **Video Tutorials**: Step-by-step guides

### Community

- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time community support
- **Email**: Direct support contact

---

*This guide provides comprehensive coverage of the Compliance Dashboard integration. For additional support, contact the CyntientOps development team.*
