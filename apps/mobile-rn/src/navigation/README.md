# Navigation Overview

This directory wires the mobile app’s real navigation system using React Navigation. It replaces prior mocks and establishes a consistent, role-aware flow.

## Architecture

- `AppNavigator.tsx`
  - Native stack navigator (`@react-navigation/native-stack`).
  - Restores and validates sessions using `ServiceContainer.sessionManager`.
  - Persists session token under `cyntientops.session.token` via AsyncStorage.
  - Reduces `SessionData` to a simplified `AppUser` used by the UI.
  - Routes to `Login` when unauthenticated, otherwise to `Main` with role/user params.

- `EnhancedTabNavigator.tsx`
  - Role-based tab composition:
    - Worker: Home, Schedule, SiteDeparture, Map, Intelligence
    - Client: Home, Portfolio, Intelligence
    - Admin: Home, Portfolio, Workers, Intelligence
  - Bridges user actions (task, building, clock-in/out) to navigation and services.
  - Carries `userRole`, `userId`, `userName` from `AppNavigator.Main` params.

- `UnifiedNavigationSystem.tsx`
  - Thin wrapper around `AppNavigator` for backwards compatibility.

## Routes

- `Login` → unauthenticated entry
- `Main` → renders `EnhancedTabNavigator`
- `BuildingDetail` → `buildingId` (and optional `userRole`) param
- `TaskTimeline` → `taskId` param
- `MultisiteDeparture`, `WeeklyRoutine`, `DailyRoutine` → utility flows

## Session Flow

1. On app start, `AppNavigator` reads `cyntientops.session.token` from AsyncStorage.
2. Token is validated using `services.sessionManager.validateSession(token)`.
3. If valid, session is stored in state and converted to `AppUser`.
4. If invalid/missing, token is cleared and `Login` is shown.
5. On `LoginScreen` success, `handleLoginSuccess` creates a new session and persists the token.

## Known Gaps / Next Steps

- Comprehensive auth error UI and retry UX in `LoginScreen`.
- Deep linking and push-notification routing.
- Cross-tab state sharing and unread indicators.
- Tests for session restore and route guards (planned after feature integration).

## Tips

- Prefer pushing user context (role/id/name) as route params to keep screen modules decoupled.
- Keep session validation in `AppNavigator` to avoid coupling navigation with data services in screens.

