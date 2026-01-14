# Code Coverage Exceptions (c8 ignore)

This document catalogues all intentional code coverage exclusions marked with `/* c8 ignore */` comments. Each exclusion is justified, categorized, and analyzed for refactoring potential.

**Last Updated:** 29. November 2025
**Coverage Status:** ✅ **100% Lines/Statements, 100% Branches, 100% Functions**
**Total Exclusions:** ~119 ignored lines across 29 files (101 c8 ignore markers) + File-Level Exclusions
**Refactoring Completed:** 88 markers eliminated (47.8% reduction from 184 → 96 functional markers, +5 reporting artifact markers = 101 total)
**Recent Updates:** Type-only files and re-export files added to file-level exclusions (2025-11-29)

**Note:** The difference between 184 markers and 201 lines is that a single `/* c8 ignore start */.../* c8 ignore stop */` block (2 markers) can span multiple lines.

---

## Table of Contents

1. [Categories Overview](#categories-overview)
2. [Detailed Category Analysis](#detailed-category-analysis)
3. [Refactoring Roadmap](#refactoring-roadmap)
4. [Documentation Standard](#documentation-standard)
5. [Verification](#verification)
6. [Maintenance Guidelines](#maintenance-guidelines)

---

## Categories Overview

| Category | Lines | Markers | % | Refactorable | Status |
|----------|-------|---------|---|--------------|--------|
| 1. Module Registration Error Propagation | ~52 | 33 | 26% | ❌ No | DRY Principle |
| 2. Foundry Runtime Dependencies | ~45 | 45 | 22% | ❌ No | Integration Points |
| 3. Defensive Programming | ~38 | 38 | 19% | ⚠️ Partial | ~4 eliminable |
| 4. Port/Service Disposal Methods | ~14 | 14 | 7% | ✅ Yes | ~14 eliminable |
| 5. Performance/Lifecycle Callbacks | ~10 | 10 | 5% | ⚠️ Partial | ~2 eliminable |
| 6. Default Parameter Coverage | ~6 | 6 | 3% | ✅ Yes | ~5 eliminable |
| 7. Lifecycle Methods | ~12 | 12 | 6% | ❌ No | Not testable |
| 8. Indirect Testing | ~12 | 12 | 6% | ⚠️ Partial | ~4 eliminable |
| 9. Miscellaneous | ~12 | 14 | 6% | ❌ No | Various |
| **Total** | **~201** | **184** | **100%** | | **~29 eliminable** |

---

## Detailed Category Analysis

### Category 1: Module Registration Error Propagation (~52 Lines, 26%)

**Pattern:** `/* c8 ignore next -- Error propagation: Tested in sub-module */`

Error handling for failures in sub-module registrations. The actual error conditions are tested in the respective sub-module tests.

**Files (33 markers):**

| File | Markers | Pattern |
|------|---------|---------|
| `src/config/dependencyconfig.ts` | 8 | Sub-module registration error propagation |
| `src/config/modules/port-infrastructure.config.ts` | 13 | Port registry registration errors |
| `src/config/modules/utility-services.config.ts` | 4 | Service registration defensive checks |
| `src/config/modules/i18n-services.config.ts` | 6 | I18n service registration errors |
| `src/config/modules/foundry-services.config.ts` | 2 | Foundry service registration error |
| `src/di_infrastructure/registry/ServiceRegistry.ts` | 8 | ServiceRegistration.create* error propagation (4 methods × 2) |
| `src/di_infrastructure/resolution/ServiceResolver.ts` | 4 | Dependency resolution error propagation |
| `src/di_infrastructure/container.ts` | 2 | ScopeManager.createChild() error propagation |

**Examples:**

```typescript
// Pattern: Error propagation from sub-module
const coreResult = registerCoreServices(container);
/* c8 ignore next -- Error propagation: Core services failure tested in sub-module */
if (isErr(coreResult)) return coreResult;
```

**Justification:** Testing error propagation at the top level would duplicate all sub-module error tests. DRY principle is more important than coverage metric.

**Refactoring Analysis:**
- **Effort:** HIGH (Would require test duplication)
- **Benefit:** LOW (Violates DRY principle)
- **Recommendation:** ❌ **DO NOT REFACTOR**
- **Alternative:** Could create helper function `propagateError()` but saves only ~5 markers

---

### Category 2: Foundry Runtime Dependencies (~45 Lines, 22%)

**Pattern:** Code requires Foundry VTT global objects (`game`, `Hooks`, `ui`)

Code that requires Foundry VTT global objects to be present. These cannot be meaningfully unit-tested without a full Foundry environment.

**Files (45 markers):**

| File | Markers | Reason |
|------|---------|--------|
| `src/core/init-solid.ts` | 24 | Entire initialization function requires Foundry Hooks API |
| `src/foundry/ports/v13/FoundryI18nPort.ts` | 17 | Foundry `game.i18n` API calls |
| `src/core/hooks/render-journal-directory-hook.ts` | 4 | Service resolution + lifecycle (dispose) |

**Examples:**

```typescript
// init-solid.ts - Foundry Hook registration
/* c8 ignore next -- Registers Foundry hook callbacks */
Hooks.once("ready", () => {
  // ... hook callback ...
});

// FoundryI18nPort.ts - Foundry globals
/* c8 ignore start -- Requires Foundry game globals; tested in integration tests */
if (typeof game === "undefined" || !game?.i18n) {
  return ok(key); // Graceful degradation
}
/* c8 ignore stop */
```

**Justification:** These are integration points with Foundry VTT runtime. Testing requires full Foundry environment (integration testing, not unit testing).

**Refactoring Analysis:**
- **Effort:** IMPOSSIBLE (Real integration points)
- **Benefit:** LOW (Unit tests can't mock Foundry runtime)
- **Recommendation:** ❌ **DO NOT REFACTOR**
- **Alternative:** ✅ Create separate integration test suite (not counted in unit test coverage)

---

### Category 3: Defensive Programming (~38 Lines, 19%)

**Pattern:** Unreachable branches after validation, impossible states

Code paths that would only execute if there's a severe bug elsewhere in the system. These are kept for robustness but are effectively unreachable in normal operation.

**Files (38 markers):**

| File | Markers | Type |
|------|---------|------|
| `src/di_infrastructure/resolution/ServiceResolver.ts` | 6 | Enum default, optional chaining, invalid registration |
| `src/foundry/versioning/portregistry.ts` | 4 | Defensive checks after validation |
| `src/core/module-health-service.ts` | 2 | Logically impossible branch |
| `src/config/dependencyconfig.ts` | 4 | Validation, dependency checks |
| `src/di_infrastructure/container.ts` | 10 | Factory validation, concurrent guards |
| `src/foundry/validation/input-validators.ts` | 2 | TypeScript compile-time guaranteed |
| `src/di_infrastructure/validation/ContainerValidator.ts` | 2 | Graph traversal visited check |
| `src/services/RetryService.ts` | 2 | maxAttempts >= 1 guarantees assignment |
| `src/foundry/services/FoundryServiceBase.ts` | 2 | Disposal defensive |
| `src/foundry/ports/v13/FoundryGamePort.ts` | 2 | Input validation defensive |
| `src/foundry/validation/schemas.ts` | 2 | Valibot error path |

**Examples:**

```typescript
// ServiceResolver.ts - Enum exhaustive check
switch (lifecycle) {
  case ServiceLifecycle.SINGLETON: // ...
  case ServiceLifecycle.TRANSIENT: // ...
  case ServiceLifecycle.SCOPED: // ...
  /* c8 ignore start -- Defensive: ServiceLifecycle enum ensures only valid values */
  default:
    return err({ code: "InvalidLifecycle", ... });
  /* c8 ignore stop */
}

// input-validators.ts - TypeScript compile-time check
/* c8 ignore start -- TypeScript ensures id is string at compile time; runtime check is defensive */
if (typeof id !== "string") {
  return err(createFoundryError("VALIDATION_FAILED", "ID must be a string"));
}
/* c8 ignore stop */
```

**Justification:** These guards protect against impossible states but cannot be triggered in tests without breaking system invariants.

**Refactoring Analysis:**
- **Effort:** MEDIUM (Type-system improvements possible)
- **Benefit:** LOW-MEDIUM (~4 markers eliminable)
- **Recommendation:** ⚠️ **SELECTIVE REFACTORING**
  - ✅ **TypeScript compile-time checks** (input-validators.ts): 2 markers eliminable (remove runtime check)
  - ✅ **Enum exhaustive checking** (ServiceResolver switch): 2 markers eliminable (use TypeScript `never` type)
  - ❌ **Validation fallbacks**: KEEP (sensible fail-safes)

**Quick Win:** TypeScript `never` type for exhaustive enum checking (~2 ignores)

---

### Category 4: Port/Service Disposal Methods (~14 Lines, 7%)

**Pattern:** No-op `dispose()` methods

Empty disposal methods in ports that have no resources to clean up.

**Files (14 markers):**

| File | Markers | Reason |
|------|---------|--------|
| `src/foundry/ports/v13/FoundryHooksPort.ts` | 2 | No-op dispose() |
| `src/foundry/ports/v13/FoundryUIPort.ts` | 2 | No-op dispose() |
| `src/foundry/ports/v13/FoundryDocumentPort.ts` | 2 | No-op dispose() |
| `src/foundry/ports/v13/FoundrySettingsPort.ts` | 2 | No-op dispose() |
| `src/foundry/ports/v13/FoundryI18nPort.ts` | 2 | No-op dispose() |
| `src/foundry/services/FoundryServiceBase.ts` | 2 | Defensive disposal (ports don't implement Disposable) |
| `src/foundry/ports/v13/FoundryGamePort.ts` | 2 | No-op dispose() |

**Examples:**

```typescript
// FoundryHooksPort.ts - No-op disposal
/* c8 ignore start -- Lifecycle: No resources to clean up, no-op method */
dispose(): void {
  // No resources to clean up
}
/* c8 ignore stop */
```

**Justification:** Ports don't have resources to clean up. Disposal methods exist to fulfill interface contract.

**Refactoring Analysis:**
- **Effort:** LOW (2-3 hours)
- **Benefit:** HIGH (~14 markers eliminable = 7%)
- **Recommendation:** ✅ **REFACTOR**
  - Make `Disposable` interface optional (only implement when resources need cleanup)
  - Remove no-op `dispose()` methods
  - ⚠️ **Check Liskov Substitution Principle** - ensure polymorphism still works

**Quick Win:** Optional Disposable Interface (~14 ignores eliminable)

---

### Category 5: Performance/Lifecycle Callbacks (~10 Lines, 5%)

**Pattern:** Optional callbacks, sampling, rarely-called methods

Optional callbacks and performance tracking hooks that are only called conditionally.

**Files (10 markers):**

| File | Markers | Type |
|------|---------|------|
| `src/core/composition-root.ts` | 2 | onComplete callback (sampling) |
| `src/observability/observability-registry.ts` | 4 | Optional adapterName, error path |
| `src/observability/metrics-collector.ts` | 4 | Development mode, sampling |

**Examples:**

```typescript
// composition-root.ts - Conditional callback
const configured = performanceTracker.track(
  () => configureDependencies(container),
  /* c8 ignore start -- onComplete callback only called when performance tracking enabled and sampling passes */
  (duration) => {
    loggerResult.value.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
  }
  /* c8 ignore stop */
);

// metrics-collector.ts - Sampling logic
/* c8 ignore start -- Production sampling: Math.random() behavior tested in shouldSample tests */
return Math.random() < this.env.performanceSamplingRate;
/* c8 ignore stop */
```

**Justification:** Optional features with sampling/conditional execution. Testing all combinations would be expensive with minimal value.

**Refactoring Analysis:**
- **Effort:** MEDIUM (1-2 hours)
- **Benefit:** LOW (~2 markers eliminable)
- **Recommendation:** ⚠️ **OPTIONAL**
  - ✅ **Sampling Logic**: Test with fixed random seed (~2 markers)
  - ❌ **Optional Callbacks**: Keep (conditional execution is legitimate)
  - ❌ **Error Path**: Keep (edge case testing too expensive)

---

### Category 6: Default Parameter Coverage (~6 Lines, 3%)

**Pattern:** `value ?? defaultValue` where both branches tested separately

Nullish coalescing operators for default parameters where both branches are tested separately in different tests.

**Files (6 markers):**

| File | Markers | Example |
|------|---------|---------|
| `src/services/RetryService.ts` | 2 | (Counted in Defensive Programming) |
| `src/core/api/module-api-initializer.ts` | 2 | Optional replacement info |
| `src/services/LocalI18nService.ts` | 1 | navigator.language fallback |
| `src/services/consolelogger.ts` | 1 | Optional setMinLevel |

**Examples:**

```typescript
// module-api-initializer.ts - Optional parameter
/* c8 ignore start -- Optional replacement info: Tested in deprecated-token.test.ts */
const replacement = metadata.replacement ? ` Use ${metadata.replacement} instead.` : "";
/* c8 ignore stop */

// LocalI18nService.ts - Defensive fallback
/* c8 ignore next -- Defensive: navigator.language.split always returns non-empty array */
this.currentLocale = lang ?? "en";
```

**Justification:** Both branches (provided vs default) are covered by different test cases. The specific line with `??` is marked to avoid false coverage gaps.

**Refactoring Analysis:**
- **Effort:** VERY LOW (30 minutes)
- **Benefit:** LOW (~5 markers eliminable)
- **Recommendation:** ✅ **QUICK WIN**
  - Write tests that exercise both branches in the same test
  - Effort: ~30 minutes
  - Reward: ~5 ignores eliminated

---

### Category 7: Lifecycle Methods (~12 Lines, 6%)

**Pattern:** Module disable callbacks, cleanup logic not testable in unit tests

Lifecycle methods called when module is disabled or during cleanup. Not testable in unit tests.

**Files (12 markers):**

| File | Markers | Type |
|------|---------|------|
| `src/core/module-hook-registrar.ts` | 2 | disposeAll() lifecycle |
| `src/core/module-settings-registrar.ts` | 2 | Service resolution defensive |
| `src/core/hooks/render-journal-directory-hook.ts` | 2 | dispose() lifecycle |
| `src/core/settings/log-level-setting.ts` | 2 | onChange callback |
| `src/di_infrastructure/scope/ScopeManager.ts` | 1 | crypto.randomUUID() |
| `src/services/JournalVisibilityService.ts` | 2 | Branch testing (common case) |
| `src/foundry/services/FoundrySettingsService.ts` | 2 | Port error paths |

**Examples:**

```typescript
// ModuleHookRegistrar.ts - Disposal lifecycle
/* c8 ignore start -- Lifecycle method: Called when module is disabled; not testable in unit tests */
disposeAll(): void {
  for (const hook of this.hooks) {
    hook.dispose();
  }
}
/* c8 ignore stop */

// ScopeManager.ts - Browser API delegation
try {
  /* c8 ignore next -- Delegates to browser crypto implementation */
  return crypto.randomUUID();
} catch {
  return Date.now() + "-" + Math.random();
}
```

**Justification:** Lifecycle events cannot be simulated in unit tests. Would require integration test setup.

**Refactoring Analysis:**
- **Effort:** IMPOSSIBLE (Lifecycle events not simulatable)
- **Benefit:** LOW
- **Recommendation:** ❌ **DO NOT REFACTOR** - Lifecycle callbacks are legitimate exceptions

---

### Category 8: Indirect Testing (~12 Lines, 6%)

**Pattern:** Tested via callers, not directly

Code tested indirectly through calling code rather than directly.

**Files (12 markers):**

| File | Markers | Type |
|------|---------|------|
| `src/foundry/services/FoundryServiceBase.ts` | 4 | withRetry, withRetryAsync methods |
| `src/foundry/ports/v13/FoundrySettingsPort.ts` | 2 | Error propagation |
| `src/di_infrastructure/container.ts` | 6 | Async validation edge cases |

**Examples:**

```typescript
// FoundryServiceBase.ts - Indirect testing
/* c8 ignore start -- Tested indirectly via Foundry Services that call this method */
protected withRetry<T>(operation: () => T, options?: RetryOptions): Result<T, Error> {
  return this.retryService.retry(operation, options);
}
/* c8 ignore stop */

// container.ts - Race condition guards
/* c8 ignore start -- Race condition guard for concurrent validateAsync calls */
if (this.validationPromise !== null) {
  return this.validationPromise;
}
/* c8 ignore stop */
```

**Justification:** Testing these directly would duplicate caller tests or require complex async race condition setups.

**Refactoring Analysis:**
- **Effort:** MEDIUM (1-2 hours for withRetry methods)
- **Benefit:** LOW (~4 markers eliminable)
- **Recommendation:** ⚠️ **OPTIONAL**
  - withRetry methods: Can be tested directly
  - Async validation edge cases: Too complex for value gained

---

### Category 9: Miscellaneous (~12 Lines, 6%)

**Pattern:** Various uncategorized exceptions

**Files (14 markers):**

| File | Markers | Reason |
|------|---------|--------|
| `src/di_infrastructure/container.ts` | 1 | Cleanup logic (null assignment) |
| `src/observability/observability-registry.ts` | (Counted in Category 5) | |

---

## Refactoring Roadmap

### ✅ Quick Wins (Recommended)

| Priority | Category | Effort | Reward | Impact |
|----------|----------|--------|--------|--------|
| 🥇 **1** | Optional Disposable Interface (Cat 4) | 2-3h | ~14 ignores | 7% |
| 🥈 **2** | Default Parameter Tests (Cat 6) | 30min | ~5 ignores | 2.5% |
| 🥉 **3** | Exhaustive Enum Checking (Cat 3) | 1h | ~2 ignores | 1% |

**Total Quick Wins:** ~21 ignores eliminable, 10.5% reduction, 4-5 hours effort

### ⚠️ Optional (Moderate Benefit)

| Priority | Category | Effort | Reward | Impact |
|----------|----------|--------|--------|--------|
| 4 | TypeScript Compile-Time Checks (Cat 3) | 2h | ~2 ignores | 1% |
| 5 | Sampling Tests with Fixed Seed (Cat 5) | 1-2h | ~2 ignores | 1% |
| 6 | withRetry Direct Tests (Cat 8) | 1-2h | ~4 ignores | 2% |

**Total Optional:** ~8 ignores eliminable, 4% reduction, 5-6 hours effort

### ❌ Not Recommended

- **Error Propagation Helper** (Cat 1): DRY principle > coverage metric
- **Foundry Runtime Integration-Tests** (Cat 2): Integration tests are separate suite
- **Lifecycle Method Testing** (Cat 7): Not simulatable in unit tests
- **Module Registration Error Testing** (Cat 1): Would duplicate sub-module tests

---

## Expected Results After Refactoring

### Current State
- **201 ignored lines** across 35 files
- **184 c8 ignore markers**
- **100% Code Coverage** (with documented exceptions)

### After Quick Wins (Recommended)
- **~180 ignored lines** (21 eliminated)
- **~163 c8 ignore markers** (21 eliminated)
- **10.5% reduction**

### After All Refactoring (Optional + Quick Wins)
- **~172 ignored lines** (29 eliminated)
- **~155 c8 ignore markers** (29 eliminated)
- **14.5% reduction**

### Remaining ~155 Ignores are Architecturally Justified:
- Integration points to Foundry VTT (not unit-testable)
- DRY principle (error propagation)
- Defensive programming (fail-safes)
- Lifecycle events (not simulatable)

---

## Documentation Standard

All `c8 ignore` comments follow this format:

```typescript
// File-level disable (rare, only for entire untestable functions):
/* c8 ignore start -- Entire function requires Foundry Hooks globals to be present */
export function initSolid(container: ServiceContainer) {
  // ... Foundry-dependent code ...
}
/* c8 ignore stop */

// Block disable with reason:
/* c8 ignore start -- Category: Specific reason why code is not tested */
if (unreachableCondition) {
  // defensive code
}
/* c8 ignore stop */

// Single line disable:
/* c8 ignore next -- Category: Reason */
const value = something ?? default;

// Inline disable (2 lines):
/* c8 ignore next 2 -- Category: Reason */
const finalError = lastError ?? mapException("No attempts made", 0);
return err(finalError);
```

**Rules:**
1. ✅ Every ignore must have a comment explaining WHY
2. ✅ Comment must categorize the exclusion
3. ✅ Comment must reference the invariant/condition that makes it untestable
4. ✅ Multi-line blocks use `start`/`stop` markers
5. ✅ Prefer inline disable with reason over file-level

---

## Verification

To audit all coverage exceptions:

```powershell
# Find all c8 ignore comments
grep -r "c8 ignore" src/

# Count c8 ignore markers
(grep -r "c8 ignore (start|next|stop)" src/ | Measure-Object).Count

# Find undocumented exceptions (should return 0)
grep -r "c8 ignore$" src/
grep -r "c8 ignore-next-line$" src/

# Verify all markers have reasons
grep -r "c8 ignore" src/ | Select-String -NotMatch " -- "
```

**Current Status:** ✅ All 184 markers documented with reasons. Zero undocumented exceptions.

---

## Related Documentation

- **Quality Gates Overview:** `docs/quality-gates/README.md`
- **Type Coverage Exclusions:** `docs/quality-gates/type-coverage-exclusions.md` (25 inline exceptions)
- **Linter Exclusions:** `docs/quality-gates/linter-exclusions.md` (94 uses across 44 files)
- **Testing Guide:** `docs/TESTING.md`
- **Coverage Reports:** Generated in `coverage/index.html` after `npm run test:coverage`

---

## Maintenance Guidelines

### Adding New c8 Ignore Comments

When adding new `c8 ignore` comments:

1. ✅ **Question First:** Is this ignore necessary, or can the code be refactored?
2. ✅ **Categorize:** Assign to one of the 9 categories above
3. ✅ **Document Inline:** Always include `-- Category: Reason` comment
4. ✅ **Update This Doc:** If introducing a new pattern, update category documentation
5. ✅ **Verify Justification:** Ensure the exclusion is architecturally justified

### Philosophy

**Coverage exclusions should be rare and well-justified.** Prefer refactoring to make code testable over adding ignore comments. Each ignore is a small compromise in code quality.

However, **legitimate architectural reasons exist**:
- Integration points (Foundry VTT runtime)
- DRY principle (tested in sub-modules)
- Defensive programming (fail-safes for impossible states)
- Lifecycle events (not simulatable)

**The goal is not 100% coverage without ignores, but 100% coverage with minimal, justified ignores.**

### Refactoring Priority

When considering removing ignores, prioritize:
1. ✅ **Quick Wins** (high impact, low effort)
2. ⚠️ **Optional** (moderate impact, moderate effort)
3. ❌ **Not Recommended** (low impact, high effort, or architectural constraint)

---

## File-Level Exclusions (vitest.config.ts)

In addition to inline `c8 ignore` markers, certain file types are excluded from coverage at the configuration level. These exclusions are documented in `vitest.config.ts` and include:

### Type-Only Files (2025-11-29)
- `src/application/services/JournalVisibilityConfig.ts` - Interface/Type definitions only
- `src/domain/types/cache/cache-types.ts` - Domain cache type definitions only

### Re-Export Files (2025-11-29)
- `src/infrastructure/shared/utils/result.ts` - Re-exports from `@/domain/utils/result` (backward compatibility)
- `src/infrastructure/shared/tokens/collection-tokens.ts` - Re-exports from Application tokens
- `src/infrastructure/shared/tokens/repository-tokens.ts` - Re-exports from Application tokens
- `src/application/tokens/index.ts` - Re-export aggregation file

**Justification:** These files contain no executable runtime code - they are pure type definitions or re-exports for backward compatibility. Excluding them from coverage is architecturally correct.

### Migration Service (2025-11-29)
- `src/application/services/MigrationService.ts` - Migration code paths only testable with actual v2 migration

**Justification:** The migration service contains framework code for future schema migrations (v1 → v2). Migration code paths (migration loop, final version verification, post-migration type guards) are only testable when an actual schema version 2 migration exists. With current schema version 1 and no migrations, these code paths cannot be executed. Excluding this file from coverage is architecturally correct until schema version 2 is introduced.

---

## Audit History

### November 2025 - Full Audit & Refactoring Analysis
- **Counted:** 184 markers, ~201 ignored lines across 35 files
- **Categorized:** 9 categories with detailed analysis
- **Identified:** ~21-29 ignores eliminable (10-15%)
- **Clarified:** Marker count vs line count discrepancy
- **Documented:** Refactoring roadmap with effort/benefit analysis

### November 2025 - DIP-Violations Refactoring (2025-11-29)
- **File-Level Exclusions Added:** Type-only files and re-export files excluded from coverage
- **Coverage Status:** 100% in all categories (Lines, Statements, Branches, Functions)
- **Tests Added:** Missing error path tests in `dependencyconfig.ts` and `platform-cache-port-adapter.ts`
