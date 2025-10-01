# 🔗 CyntientOps Integration Guide

Complete guide for integrating ViewModels, Services, and APIs with React components.

---

## 📚 Table of Contents

1. [ViewModel Integration](#viewmodel-integration)
2. [Supabase Integration](#supabase-integration)
3. [NYC API Integration](#nyc-api-integration)
4. [Production Monitoring](#production-monitoring)
5. [Async State Management](#async-state-management)
6. [Deployment](#deployment)

---

## 🎯 ViewModel Integration

### Using the useViewModel Hook

The `useViewModel` hook simplifies connecting ViewModels to React components:

```typescript
import { useViewModel } from '@cyntientops/business-core';
import { WorkerDashboardViewModel } from '@cyntientops/context-engines';

function WorkerDashboard({ workerId }) {
  const { viewModel, state, loading, error, refresh } = useViewModel(
    WorkerDashboardViewModel,
    workerId
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <View>
      <Text>Tasks: {state.tasks.length}</Text>
      <Button onPress={refresh}>Refresh</Button>
    </View>
  );
}
```

### Features:
- ✅ Automatic initialization
- ✅ State subscription
- ✅ Memory leak prevention
- ✅ Refresh functionality
- ✅ Error handling

---

## 🗄️ Supabase Integration

### Testing Connection

```typescript
import { supabase } from '@cyntientops/business-core';

// Health check
const health = await supabase.healthCheck();
console.log('Connected:', health.connected);
console.log('Latency:', health.latency);
```

### CRUD Operations

```typescript
// Insert
const { data, error } = await supabase.insert('buildings', {
  name: '120 Broadway',
  address: '120 Broadway, NY 10271'
});

// Update
await supabase.update('buildings', buildingId, {
  compliance_score: 0.95
});

// Select
const { data } = await supabase.select('buildings', '*', {
  client_id: 'JMR'
});

// Delete
await supabase.delete('buildings', buildingId);
```

### File Upload

```typescript
const { url, error } = await supabase.uploadFile(
  'building-photos',
  `${buildingId}/${Date.now()}.jpg`,
  photoFile,
  { contentType: 'image/jpeg' }
);
```

### Real-time Subscriptions

```typescript
const unsubscribe = supabase.subscribeToTable(
  'tasks',
  (payload) => {
    console.log('Task updated:', payload);
    // Update UI
  }
);

// Cleanup
unsubscribe();
```

---

## 🏙️ NYC API Integration

**🔑 Important: NYC Open Data APIs are PUBLIC**

All NYC Open Data APIs work without authentication. API keys are **optional** and only provide higher rate limits:
- **Without keys**: ~1000 requests/day (shared IP-based pool)
- **With keys**: 1000 requests/hour per app

Get free API keys at: https://data.cityofnewyork.us/

### Testing All APIs

```typescript
import { nycAPI } from '@cyntientops/business-core';

// Test all APIs at once (works with or without keys)
const results = await nycAPI.testAllAPIs('1001026');

results.forEach(result => {
  console.log(`${result.api}: ${result.success ? '✅' : '❌'}`);
  console.log(`Latency: ${result.latency}ms`);
  console.log(`Records: ${result.recordCount}`);
});
```

### Individual API Tests

```typescript
// Test HPD Violations
const hpdResult = await nycAPI.testHPDAPI('1001026');

// Test DOB Permits
const dobResult = await nycAPI.testDOBAPI('1001026');

// Test DSNY Schedule
const dsnyResult = await nycAPI.testDSNYAPI('120 Broadway');
```

### Fetching Production Data

```typescript
// Get violations for a building
const { data, error } = await nycAPI.fetchBuildingViolations('1001026', {
  limit: 50,
  openOnly: true
});

if (data) {
  console.log(`Found ${data.length} open violations`);
}
```

### Checking API Configuration

```typescript
const status = nycAPI.getConfigStatus();
console.log('HPD configured:', status.HPD);
console.log('DOB configured:', status.DOB);
console.log('DSNY configured:', status.DSNY);
```

---

## 📊 Production Monitoring

### Setting Up Monitoring

```typescript
import { monitoring } from '@cyntientops/business-core';

// Set user context (after login)
monitoring.setUser(userId, {
  role: 'worker',
  email: user.email
});

// Clear context (on logout)
monitoring.clearUser();
```

### Tracking Performance

```typescript
// Manual tracking
monitoring.trackPerformance('dashboard_load', 1234, {
  screen: 'worker_dashboard'
});

// Automatic tracking with measureAsync
const data = await monitoring.measureAsync(
  'fetch_buildings',
  async () => {
    return await api.fetchBuildings();
  },
  { client_id: 'JMR' }
);
```

### Error Reporting

```typescript
try {
  await riskyOperation();
} catch (error) {
  monitoring.reportError(
    error,
    'building_update',
    { buildingId, userId }
  );
}
```

### Analytics Events

```typescript
// Track screen views
monitoring.trackScreenView('WorkerDashboard', {
  worker_id: workerId
});

// Track user actions
monitoring.trackAction('task_completed', {
  task_id: taskId,
  duration_ms: 3600000
});

// Custom events
monitoring.trackEvent('photo_uploaded', {
  building_id: buildingId,
  file_size: photoSize
});
```

### Getting Summaries

```typescript
// Performance summary
const perfSummary = monitoring.getPerformanceSummary();
console.log('Avg duration:', perfSummary.averageDuration);
console.log('Slowest:', perfSummary.slowestOperations);

// Error summary
const errorSummary = monitoring.getErrorSummary();
console.log('Total errors:', errorSummary.count);
console.log('By context:', errorSummary.errorsByContext);
```

---

## ⚡ Async State Management

### Using useAsync Hook

```typescript
import { useAsync } from '@cyntientops/ui-components';

function BuildingList() {
  const { data, loading, error, execute } = useAsync(
    async () => {
      return await api.fetchBuildings();
    },
    {
      immediate: true,
      onSuccess: (buildings) => {
        console.log(`Loaded ${buildings.length} buildings`);
      },
      context: 'BuildingList'
    }
  );

  if (loading) return <LoadingState loading={true} />;
  if (error) return <LoadingState error={error} />;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <BuildingCard building={item} />}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={execute} />
      }
    />
  );
}
```

### Parallel Operations

```typescript
import { useAsyncAll } from '@cyntientops/ui-components';

function Dashboard() {
  const { data, loading, error } = useAsyncAll([
    () => api.fetchBuildings(),
    () => api.fetchTasks(),
    () => api.fetchWorkers()
  ], { immediate: true });

  if (loading) return <LoadingState loading={true} />;

  const [buildings, tasks, workers] = data || [[], [], []];

  return (
    <View>
      <Text>Buildings: {buildings.length}</Text>
      <Text>Tasks: {tasks.length}</Text>
      <Text>Workers: {workers.length}</Text>
    </View>
  );
}
```

### Debounced Operations

```typescript
import { useDebouncedAsync } from '@cyntientops/ui-components';

function BuildingSearch() {
  const { data, loading, execute } = useDebouncedAsync(
    async (query: string) => {
      return await api.searchBuildings(query);
    },
    { delay: 500 }
  );

  return (
    <View>
      <TextInput
        placeholder="Search buildings..."
        onChangeText={execute}
      />
      {loading && <ActivityIndicator />}
      {data && <SearchResults results={data} />}
    </View>
  );
}
```

### Loading State Component

```typescript
import { LoadingState } from '@cyntientops/ui-components';

function DataView() {
  const { data, loading, error, execute } = useAsync(fetchData);

  return (
    <LoadingState
      loading={loading}
      error={error}
      data={data}
      loadingMessage="Loading buildings..."
      errorMessage="Failed to load buildings"
      emptyMessage="No buildings found"
      onRetry={execute}
    >
      <BuildingList buildings={data} />
    </LoadingState>
  );
}
```

---

## 🚀 Deployment

### Beta Deployment

```bash
# Deploy to TestFlight + Play Store Internal Testing
./scripts/deploy-beta.sh

# Follow prompts to select platform
```

### Production Deployment

```bash
# Deploy to App Store + Play Store
./scripts/deploy-production.sh

# ⚠️ Make sure you've:
# - Tested thoroughly in beta
# - Updated version numbers
# - Fixed all critical bugs
```

### Manual EAS Commands

```bash
cd apps/mobile-rn

# Build for preview
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Build for production
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Environment Variables

Make sure your `.env` file has:

```bash
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NYC APIs (OPTIONAL - only for higher rate limits)
# Without keys: ~1000 requests/day (shared pool)
# With keys: 1000 requests/hour per app
HPD_API_KEY=
DOB_API_KEY=
DOB_SUBSCRIBER_KEY=
DSNY_API_KEY=

# Weather (OPTIONAL)
WEATHER_API_KEY=your-weather-key
```

---

## 🎯 Quick Start Checklist

### Before First Build:

- [ ] Add Supabase credentials to `.env` (REQUIRED)
- [ ] (Optional) Add NYC API keys to `.env` for higher rate limits
- [ ] Test Supabase connection: `supabase.healthCheck()`
- [ ] Test NYC APIs: `nycAPI.testAllAPIs()` (works without keys)
- [ ] Update `app.json` version number
- [ ] Configure EAS: `eas.json` (already done)

### First Beta Build:

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm test

# 3. Deploy to beta
./scripts/deploy-beta.sh
```

### Monitoring Setup:

```typescript
// In your App.tsx or main entry point
import { monitoring, supabase, nycAPI } from '@cyntientops/business-core';

// On app start
useEffect(() => {
  // Test connections
  supabase.healthCheck().then(health => {
    monitoring.trackEvent('supabase_health', { connected: health.connected });
  });

  nycAPI.testAllAPIs().then(results => {
    const successful = results.filter(r => r.success).length;
    monitoring.trackEvent('nyc_api_health', { successful });
  });
}, []);

// On user login
monitoring.setUser(user.id, { role: user.role, email: user.email });

// On user logout
monitoring.clearUser();
```

---

## 💡 Best Practices

### 1. Always Use Hooks for ViewModels

✅ **Good:**
```typescript
const { state, loading } = useViewModel(WorkerDashboardViewModel, workerId);
```

❌ **Bad:**
```typescript
const viewModel = new WorkerDashboardViewModel(workerId); // Manual management
```

### 2. Use LoadingState for Consistent UX

✅ **Good:**
```typescript
<LoadingState loading={loading} error={error} data={data}>
  <Content data={data} />
</LoadingState>
```

❌ **Bad:**
```typescript
{loading && <Text>Loading...</Text>}
{error && <Text>{error.message}</Text>}
{data && <Content data={data} />}
```

### 3. Track Important Operations

✅ **Good:**
```typescript
await monitoring.measureAsync('building_update', async () => {
  return await updateBuilding(id, data);
});
```

❌ **Bad:**
```typescript
await updateBuilding(id, data); // No tracking
```

### 4. Test APIs Before Production

✅ **Good:**
```typescript
// In development, test on mount
useEffect(() => {
  if (__DEV__) {
    nycAPI.testAllAPIs().then(results => {
      console.log('API Test Results:', results);
    });
  }
}, []);
```

---

## 📖 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **NYC Open Data**: https://opendata.cityofnewyork.us/
- **React Native Docs**: https://reactnative.dev/

---

**Need Help?**

Check the CONTINUITY_REPORT.md for implementation details and progress tracking.
