# Testing Infrastructure for GinMai

## ⚠️ Important: Manual Testing Required

**Status:** Testing infrastructure added but **NOT manually tested in the app yet**.

### Safe Revert Point

If anything breaks during manual testing, you can safely revert to the last confirmed working commit:

```bash
# Revert to last known working state (before testing infrastructure)
git reset --hard 0af95e8

# Or create a new branch from the safe commit
git checkout -b safe-working-state 0af95e8
```

**Timeline:**
- ✅ **Commit `0af95e8` and earlier** - Confirmed working (M3 complete)
- ⚠️ **Commit `ffb1037` and later** - Testing infrastructure added, needs manual verification

### Before Merging to Production

1. ✅ Run unit tests: `npm test` (28/28 passing)
2. ⏳ Manual testing of all M1-M3 features
3. ⏳ Run Maestro E2E tests on actual device
4. ⏳ Verify no regressions introduced

---

## Overview

This document describes the testing strategy and setup for GinMai, including both E2E (Maestro) and unit tests (Jest).

---

## E2E Testing with Maestro

### Why Maestro?
- **Zero native configuration**: Works with Expo out-of-the-box (no ejecting required)
- **Declarative YAML syntax**: Easier to write and maintain than JavaScript
- **No app rebuilds**: Test changes don't require recompilation
- **GPS mocking built-in**: Perfect for testing location-based features

### Installation

```bash
# Install Maestro CLI (macOS)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro -v
```

### Running E2E Tests

```bash
# Start the Expo app first
cd app && npx expo start --ios

# In another terminal, run tests
maestro test .maestro/flows/

# Run specific flow
maestro test .maestro/flows/01-auth-signup.yaml

# Visual test recorder (for creating new tests)
maestro studio
```

### Available Test Flows

1. **01-auth-signup.yaml** - Complete authentication signup with OTP
2. **02-create-moment.yaml** - Create a moment (time, place, seats)
3. **03-join-moment.yaml** - Join an existing moment
4. **04-arrival-flow.yaml** - Arrival confirmation and "Found them!" flow
5. **05-feedback-flow.yaml** - Post-meal feedback submission

### Writing New Maestro Tests

Create a new YAML file in `.maestro/flows/`:

```yaml
appId: com.ginmai.app
---
- launchApp
- assertVisible: "Welcome"
- tapOn: "Button Text"
- inputText: "Some text"
- assertVisible: "Success message"
```

See existing flows for more examples.

---

## Unit Testing with Jest

### Current Status: ✅ WORKING

**Jest tests are now fully functional!**

The Expo SDK 54 + Jest compatibility issue has been resolved by:
1. Creating polyfills for `structuredClone` and Expo globals
2. Mocking the `expo` module to bypass Winter bundling system
3. Using `testEnvironment: 'node'` to avoid React Native environment issues
4. Using fake timers to handle async operations in tests

### Test Results

```
Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
```

**Coverage:**
- `notificationStore.ts` - 91.66% coverage ✅
- `momentStore.ts` - 6.16% coverage (business logic tested, Supabase mocked)
- `authStore.ts` - 3.25% coverage (business logic tested, Supabase mocked)

### Unit Test Files

- `app/src/stores/__tests__/momentStore.test.ts` - 18 tests
  - Moment CRUD operations
  - User connection tracking
  - Moment filtering and status

- `app/src/stores/__tests__/authStore.test.ts` - 8 tests
  - Authentication state management
  - User stats tracking
  - Session management

- `app/src/stores/__tests__/notificationStore.test.ts` - 12 tests
  - Notification CRUD operations
  - Unread count tracking
  - Mark as read functionality
  - Edge cases

### Running Tests

```bash
cd app

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test notificationStore
```

---

## Testing Strategy

### What We Test

**E2E Tests (Maestro) - User Flows:**
- ✅ Authentication signup and OTP verification
- ✅ Creating moments (full 3-step flow)
- ✅ Joining moments
- ✅ Arrival and "Found them!" confirmation
- ✅ Post-meal feedback submission

**Unit Tests (Jest) - Business Logic:**
- ✅ Moment CRUD operations (add, update, remove, clear)
- ✅ User connection tracking (hasJoinedMoment)
- ✅ Notification state management (add, remove, mark as read)
- ✅ Authentication state transitions (login, logout, stats)

### What We Don't Test (Yet)

- Real-time Supabase subscriptions (mocked in tests)
- Push notifications (M4 feature, not implemented)
- Performance and load testing
- Android-specific E2E flows

---

## DEV_MODE for Testing

The app has a `DEV_MODE` flag in `src/config/supabase.ts` that enables:

1. **Mock OTP verification** - Use `1234` as the verification code
2. **Local-only moments** - Moments don't sync to Supabase
3. **Deterministic test data** - Predictable behavior for testing

Enable DEV_MODE for testing:

```typescript
// src/config/supabase.ts
export const DEV_MODE = true; // ← Set this to true
```

---

## CI/CD Integration

**Status:** Not yet implemented

**Planned:**
- GitHub Actions workflow to run Maestro tests on PR
- Automated test runs on iOS simulator
- Test coverage reporting (when Jest works)

---

## Troubleshooting

### Maestro Tests Failing

**Issue:** "No connected devices"
```bash
# Solution: Start iOS simulator first
open -a Simulator
```

**Issue:** "App not found"
```bash
# Solution: Ensure Expo app is running
cd app && npx expo start --ios
```

**Issue:** Tests timeout
```bash
# Solution: Check if app is responding
# Look for build errors in Expo terminal
```

### Jest Tests Not Running

**Current Status:** Jest is incompatible with Expo SDK 54. Use Maestro for now.

If you need unit tests urgently, consider:
1. Testing stores directly in a Node.js environment (no React Native deps)
2. Using Maestro for critical logic verification
3. Waiting for Expo SDK 55

---

## Next Steps

### Short Term
1. ✅ Complete Maestro E2E test suite
2. ⏳ Add more edge case tests to Maestro flows
3. ⏳ Test Android flows with Maestro

### Medium Term
1. ⏳ Fix Jest compatibility (Expo SDK 55 or workaround)
2. ⏳ Add component snapshot tests
3. ⏳ Setup CI/CD with GitHub Actions

### Long Term
1. ⏳ Add visual regression testing
2. ⏳ Performance testing for real-time features
3. ⏳ Load testing for Supabase backend

---

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/getting-started/introduction)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## Questions?

If tests are failing or you need help:
1. Check the "Troubleshooting" section above
2. Review the plan document for testing setup details
3. Ask the team or create a GitHub issue

**Remember:** E2E tests with Maestro are the primary testing method right now. Jest unit tests will be enabled once the Expo/Jest compatibility issue is resolved.
