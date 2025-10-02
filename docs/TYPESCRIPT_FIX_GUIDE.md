# TypeScript Fix Guide
## Remaining Errors & Solutions

**Last Updated:** October 1, 2025
**Status:** ~150 errors remaining (down from ~200)

---

## ✅ COMPLETED FIXES

1. **Critical Syntax Errors** - ✅ Fixed (6 errors)
   - RealTimeOrchestrator import syntax
   - JSX < character errors (4 files)
   - WeatherBasedHybridCard object structure

2. **Type Exports** - ✅ Fixed (~15 errors)
   - Added Building, BuildingProfile, WeatherForecast type aliases
   - Exported analytics-types and compliance-types
   - Installed @react-navigation/native-stack

3. **Property Mismatches** - ✅ Fixed (4 errors)
   - AdminDashboardScreen property names aligned with PropertyDataService

---

## 🔄 REMAINING ERRORS (~150 total)

### Category 1: Import Path Issues (~80 errors)

**Problem:** Imports using `/src/` paths instead of package roots

**Pattern:**
```typescript
// ❌ Wrong
import { GlassCard } from '@cyntientops/ui-components/src/glass';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';

// ✅ Correct
import { GlassCard } from '@cyntientops/ui-components';
import { RealDataService } from '@cyntientops/business-core';
```

**Affected Files:**
- apps/mobile-rn/src/components/EmergencyQuickAccess.tsx
- apps/mobile-rn/src/components/WeatherAlertBanner.tsx
- apps/mobile-rn/src/navigation/tabs/* (9 files)
- apps/mobile-rn/src/screens/* (10+ files)

**Quick Fix Script:**
```bash
# Run from project root
find apps/mobile-rn/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's|@cyntientops/ui-components/src/glass|@cyntientops/ui-components|g' \
  -e 's|@cyntientops/business-core/src/services/RealDataService|@cyntientops/business-core|g' \
  -e 's|@cyntientops/business-core/src/services/|@cyntientops/business-core|g'
```

---

### Category 2: ErrorBoundary Component Issues (~10 errors)

**Problem:** ErrorBoundary JSX component type errors

**Files:**
- App.tsx (line 16)
- AdminDashboardScreen.tsx (line 204)
- ClientDashboardScreen.tsx (line 171)
- WorkerDashboardScreen.tsx (line 202)

**Error:**
```
TS2607: JSX element class does not support attributes
TS2786: 'ErrorBoundary' cannot be used as a JSX component
```

**Solution:** Check ErrorBoundary implementation - likely needs proper React.Component typing

**Location:** packages/ui-components/src/errors/ErrorBoundary.tsx

---

### Category 3: JSON Import Issues (~5 errors)

**Problem:** Cannot import JSON files

**Files:**
- AdminPortfolioTab.tsx
- ClientIntelligenceTab.tsx
- ClientPortfolioTab.tsx
- WorkerMapTab.tsx

**Error:**
```
TS2307: Cannot find module '@cyntientops/data-seed/buildings.json'
```

**Solution:** TypeScript can't resolve JSON through paths. Options:
1. Import from package root: `import buildings from '@cyntientops/data-seed'` (if exported)
2. Use dynamic import: `const buildings = require('@cyntientops/data-seed/buildings.json')`
3. Create .d.ts declaration file

---

### Category 4: Missing API Client Exports (~10 errors)

**Problem:** NYCAPIService, NYCComplianceService, NYCDataCoordinator not exported

**File:** packages/api-clients/src/index.ts (lines 76-89)

**Error:**
```
TS2304: Cannot find name 'NYCAPIService'
```

**Solution:** Either:
1. Remove the commented/incomplete export code
2. Implement the missing classes
3. Import from correct location

---

### Category 5: ViewModel Interface Mismatches (~15 errors)

**Problem:** WorkerDashboardViewModel missing methods

**File:** apps/mobile-rn/src/screens/WorkerDashboardScreen.tsx

**Missing:**
- initialize()
- clockIn()
- clockOut()
- updateTaskStatus()
- markNotificationAsRead()
- getState()

**Solution:** Either:
1. Implement missing methods in ViewModel
2. Update screen to use correct ViewModel API
3. Check if using wrong ViewModel class

---

### Category 6: Style/Type Compatibility (~20 errors)

**Problem:** Style type mismatches (ViewStyle | TextStyle | ImageStyle)

**File:** apps/mobile-rn/src/screens/BuildingDetailScreen.tsx (40+ errors)

**Error:**
```
TS2322: Type 'ViewStyle | TextStyle | ImageStyle' is not assignable to 'StyleProp<ViewStyle>'
TS2769: No overload matches this call
```

**Solution:** Ensure StyleSheet.create returns proper typed styles

---

### Category 7: Miscellaneous (~10 errors)

**Various small issues:**
- Missing mock exports (expo-vector-icons, expo-camera)
- Property access on wrong types (Colors.text.primary vs Colors.background)
- Component prop mismatches

---

## 🎯 RECOMMENDED FIX ORDER

### Phase 1: Quick Wins (30 min)
1. ✅ Run import path batch fix script
2. ✅ Fix ErrorBoundary typing
3. ✅ Fix JSON imports

**Expected:** ~100 errors fixed

### Phase 2: Medium Effort (1 hour)
4. Fix WorkerDashboardViewModel interface
5. Fix api-clients exports
6. Fix BuildingDetailScreen styles

**Expected:** ~40 errors fixed

### Phase 3: Polish (30 min)
7. Fix remaining mock imports
8. Fix misc type issues
9. Final compile test

**Expected:** All errors resolved ✅

---

## 📝 CURRENT STATUS

**Errors Fixed:** 50
**Errors Remaining:** ~150
**Next Step:** Run Phase 1 batch fixes

**Files Modified:**
- packages/domain-schema/src/index.ts ✅
- apps/mobile-rn/src/screens/AdminDashboardScreen.tsx ✅
- packages/business-core/src/services/RealTimeOrchestrator.ts ✅
- 4x overlay component files ✅
- packages/ui-components/src/weather/WeatherBasedHybridCard.tsx ✅

**Commits:**
- b3423e8: Critical syntax errors fixed
- 45ddd04: Code review documentation
- efbe529: Type exports and property fixes

---

## 🚀 QUICK START

To continue fixing errors:

```bash
# 1. Run import path fixes
./scripts/fix-import-paths.sh  # (create this script with sed commands above)

# 2. Check ErrorBoundary
code packages/ui-components/src/errors/ErrorBoundary.tsx

# 3. Test compile
npx tsc --noEmit

# 4. Commit progress
git add -A
git commit -m "fix: Batch import path corrections"
git push
```

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
