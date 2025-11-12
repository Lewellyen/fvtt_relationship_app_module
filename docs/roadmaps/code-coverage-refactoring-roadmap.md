# Code Coverage Refactoring Roadmap

**Status:** 🟡 In Planning  
**Last Updated:** 11. November 2025  
**Version:** 1.0.0  
**Related:** [code-coverage-exclusions.md](../quality-gates/code-coverage-exclusions.md)

---

## Executive Summary

Diese Roadmap dokumentiert den strategischen Plan zur Reduzierung der Code-Coverage-Ignores im Projekt. Nach einem vollständigen Audit aller 184 c8 ignore Marker wurden ~21-29 Ignores als eliminierbar identifiziert (~10-15% Reduktion).

### Current State
- **184 c8 ignore Marker** (~201 Lines) über 35 Dateien
- **100% Code Coverage** mit dokumentierten Ausnahmen
- **9 Kategorien** vollständig analysiert

### Target State
- **103-163 c8 ignore Marker** (21-81 eliminiert)
- **~120-180 ignorierte Lines**
- **11.4-44.0% Reduktion**
- Verbleibende Ignores sind architektonisch gerechtfertigt

### Investment
- **Quick Wins (Empfohlen)**: 5-6 Stunden → 21 Ignores eliminiert (11.4%)
- **Optional (Mittelfristig)**: 7-9 Stunden → 60 Ignores eliminiert (32.6%)
- **Total**: 12-15 Stunden → 81 Ignores eliminiert (44.0%)

---

## Table of Contents

1. [Phase 1: Quick Wins (Empfohlen)](#phase-1-quick-wins-empfohlen)
2. [Phase 2: Mittelfristige Maßnahmen (Optional)](#phase-2-mittelfristige-maßnahmen-optional)
3. [Phase 3: Nicht Empfohlen](#phase-3-nicht-empfohlen)
4. [Implementierungsreihenfolge](#implementierungsreihenfolge)
5. [Tracking & Progress](#tracking--progress)
6. [Expected Results](#expected-results)

---

## Phase 1: Quick Wins (Empfohlen)

**Status:** 🟡 Not Started  
**Total Effort:** 5-6 Stunden  
**Total Impact:** ~21 Ignores (10.5% Reduktion)  
**Priority:** HIGH

---

### 1.1 Disposed State Guards

**Status:** 🟡 Not Started  
**Effort:** 3-4 Stunden  
**Impact:** ~14 Ignores (7% Reduktion)  
**Priority:** 🥇 Highest  
**Risk:** LOW

#### Problem

Alle Ports haben no-op `dispose()` Methoden, die nur das `Disposable` Interface erfüllen, aber keine Ressourcen aufräumen:

```typescript
// FoundryHooksPort.ts
/* c8 ignore start -- Lifecycle: No resources to clean up, no-op method */
dispose(): void {
  // No resources to clean up
}
/* c8 ignore stop */
```

**Betroffene Dateien (14 Marker):**
- `src/foundry/ports/v13/FoundryHooksPort.ts`: 2 Marker
- `src/foundry/ports/v13/FoundryUIPort.ts`: 2 Marker
- `src/foundry/ports/v13/FoundryDocumentPort.ts`: 2 Marker
- `src/foundry/ports/v13/FoundrySettingsPort.ts`: 2 Marker
- `src/foundry/ports/v13/FoundryI18nPort.ts`: 2 Marker
- `src/foundry/ports/v13/FoundryGamePort.ts`: 2 Marker
- `src/foundry/services/FoundryServiceBase.ts`: 2 Marker

#### Solution: `#disposed` State mit Defensive Guards

**Strategie:** Implementiere private `#disposed` Variable in allen Ports und nutze sie als Guard in allen öffentlichen Methoden. Das macht `dispose()` zu einer echten State-Änderung und fügt defensive Programmierung hinzu.

**Vorteile:**
- ✅ Kein No-Op mehr (echter State-Change)
- ✅ Defensive Programming (verhindert Nutzung nach Disposal)
- ✅ Test-worthy (Verhalten kann getestet werden)
- ✅ Alle c8 ignore Marker eliminierbar
- ✅ Keine Interface-Änderungen nötig (Disposable bleibt)

**Implementierung:**

```typescript
// FoundryHooksPort.ts - BEFORE
/* c8 ignore start -- Lifecycle: No resources to clean up, no-op method */
dispose(): void {
  // No resources to clean up
}
/* c8 ignore stop */

// FoundryHooksPort.ts - AFTER
#disposed = false;

on(event: string, callback: HookCallback): Result<number, FoundryError> {
  if (this.#disposed) {
    return err(createFoundryError(
      "DISPOSED",
      "Cannot register hook on disposed port",
      { event }
    ));
  }
  
  // ... normale Foundry API call Implementation
}

once(event: string, callback: HookCallback): Result<number, FoundryError> {
  if (this.#disposed) {
    return err(createFoundryError(
      "DISPOSED",
      "Cannot register hook on disposed port",
      { event }
    ));
  }
  
  // ... normale Implementation
}

off(event: string, id: number): Result<void, FoundryError> {
  if (this.#disposed) {
    return err(createFoundryError(
      "DISPOSED",
      "Cannot unregister hook on disposed port",
      { event, hookId: id }
    ));
  }
  
  // ... normale Implementation
}

dispose(): void {
  if (this.#disposed) return; // Idempotent
  this.#disposed = true;
  // Optional: Cleanup von registrierten Hooks hier
}
```

**Pattern für alle Ports:**

```typescript
class FoundryXxxPort implements FoundryXxx, Disposable {
  #disposed = false;
  
  // Jede öffentliche Methode beginnt mit:
  publicMethod(...args): Result<T, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError(
        "DISPOSED",
        "Cannot call publicMethod on disposed port"
      ));
    }
    
    // ... normale Implementation
  }
  
  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // Optional: Cleanup von Ressourcen
  }
}
```

**FoundryServiceBase bleibt unverändert:**

```typescript
// Keine Änderung nötig, da alle Ports weiterhin Disposable implementieren
dispose(): void {
  if (
    this.port &&
    typeof this.port === "object" &&
    "dispose" in this.port &&
    typeof (this.port as unknown as { dispose: unknown }).dispose === "function"
  ) {
    (this.port as unknown as Disposable).dispose();
  }
  this.port = null;
}
```

Aber c8 ignore kann entfernt werden, da `dispose()` jetzt immer tatsächlich was tut!

#### Implementation Steps

**1. ✅ FoundryHooksPort (1h)**
   - Add `#disposed = false` private field
   - Add guard to `on()`, `once()`, `off()` methods
   - Implement `dispose()` mit idempotency check
   - Remove c8 ignore markers (2 total)
   - Add tests für disposed state guards

**2. ✅ FoundryGamePort (30min)**
   - Add `#disposed = false`
   - Add guards to `getFoundryVersion()`, `isReady()`, `validateJournalEntry()`
   - Implement `dispose()`
   - Remove c8 ignore markers (2 total)
   - Add tests

**3. ✅ FoundryUIPort (30min)**
   - Add `#disposed = false`
   - Add guards to `showNotification()`, `showNotificationWithFallback()`, `getActiveApplication()`
   - Implement `dispose()`
   - Remove c8 ignore markers (2 total)
   - Add tests

**4. ✅ FoundryDocumentPort (30min)**
   - Add `#disposed = false`
   - Add guards to `getFlag()`, `setFlag()`, `unsetFlag()`
   - Implement `dispose()`
   - Remove c8 ignore markers (2 total)
   - Add tests

**5. ✅ FoundrySettingsPort (30min)**
   - Add `#disposed = false`
   - Add guards to `register()`, `get()`, `set()`
   - Implement `dispose()`
   - Remove c8 ignore markers (2 total)
   - Add tests

**6. ✅ FoundryI18nPort (30min)**
   - Add `#disposed = false`
   - Add guards to `localize()`, `format()`, `has()`
   - Implement `dispose()`
   - Remove c8 ignore markers (2 total)
   - Add tests

**7. ✅ FoundryServiceBase (30min)**
   - Remove c8 ignore markers from `dispose()` (2 total)
   - Keine Code-Änderung nötig (Guards in Ports reichen)
   - Test disposal chain weiterhin funktioniert

**8. ✅ Integration Testing (30min)**
   - Test Services with disposed ports
   - Verify error messages sind hilfreich
   - Regression tests für disposal chain

**9. ✅ Documentation (30min)**
   - Update `code-coverage-exclusions.md` (Category 4 komplett eliminiert)
   - Update CHANGELOG.md
   - Document disposed guard pattern im Code
   - Update port documentation

#### Code-Beispiele für Tests

```typescript
// FoundryHooksPort.test.ts
describe("FoundryHooksPort - disposed guards", () => {
  it("should prevent registering hooks after disposal", () => {
    const port = new FoundryHooksPortV13();
    port.dispose();
    
    const result = port.on("ready", () => {});
    
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("DISPOSED");
    expect(result.error.message).toContain("Cannot register hook on disposed port");
  });
  
  it("should be idempotent (can call dispose multiple times)", () => {
    const port = new FoundryHooksPortV13();
    
    port.dispose();
    port.dispose(); // Should not throw or error
    port.dispose();
    
    // Port should still be disposed
    const result = port.on("ready", () => {});
    expect(result.ok).toBe(false);
  });
});
```

#### Validation Criteria

- ✅ All 14 c8 ignore markers removed
- ✅ Alle Ports haben `#disposed` Guards in allen public methods
- ✅ `dispose()` ist idempotent (mehrfach aufrufbar)
- ✅ Fehlerhafte Nutzung nach Disposal gibt hilfreiche Error-Messages
- ✅ Integration: Services funktionieren mit disposed ports
- ✅ No regression in disposal chain
- ✅ All tests pass (inkl. neue disposed-guard tests)

#### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance Overhead | LOW | HIGH | Guard-Check ist trivial (1 if-statement) |
| Vergessene Guards | MEDIUM | LOW | Code-Review checkt alle public methods |
| Breaking existing code | LOW | VERY LOW | Nur nach Disposal, normale Nutzung unverändert |
| Test-Komplexität | MEDIUM | MEDIUM | Klare Test-Patterns dokumentiert |

#### Expected Benefits

**Code Quality:**
- ✅ Defensive Programming gegen "use after dispose"
- ✅ Klare Fehlermeldungen bei falscher Nutzung
- ✅ Idempotente `dispose()` Methode
- ✅ Konsistentes Pattern über alle Ports

**Coverage:**
- ✅ 14 c8 ignore Marker eliminiert (7%)
- ✅ Neue Tests für disposed state guards
- ✅ 100% coverage ohne ignore für disposal logic

**Architecture:**
- ✅ Disposable Interface bleibt (keine Breaking Changes)
- ✅ LSP nicht verletzt (Behavior Addition, nicht Modification)
- ✅ Alle Ports folgen gleichem Pattern

---

### 1.2 Default Parameter Tests

**Status:** 🟡 Not Started  
**Effort:** 30 Minuten  
**Impact:** ~5 Ignores (2.5% Reduktion)  
**Priority:** 🥈 High  
**Risk:** VERY LOW

#### Problem

Nullish coalescing operators für Default-Parameter, wo beide Branches separat getestet werden:

```typescript
// LocalI18nService.ts
/* c8 ignore next -- Defensive: navigator.language.split always returns non-empty array */
this.currentLocale = lang ?? "en";

// module-api-initializer.ts
/* c8 ignore start -- Optional replacement info */
const replacement = metadata.replacement ? ` Use ${metadata.replacement} instead.` : "";
/* c8 ignore stop */
```

**Betroffene Dateien (6 Marker):**
- `src/services/LocalI18nService.ts`: 1 Marker
- `src/core/api/module-api-initializer.ts`: 2 Marker
- `src/services/consolelogger.ts`: 1 Marker (TracedLogger.setMinLevel)
- `src/services/RetryService.ts`: 2 Marker (bereits in Defensive Programming gezählt)

#### Solution

Schreibe Tests die beide Branches gleichzeitig testen:

```typescript
// LocalI18nService.test.ts - BEFORE (Hypothetisch)
it("should use browser language", () => {
  // Tests only the left branch of ??
});

// LocalI18nService.test.ts - AFTER
describe("locale detection", () => {
  it("should use browser language when available", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    const service = new LocalI18nService();
    expect(service.getCurrentLocale()).toBe("de");
  });

  it("should fallback to 'en' when navigator.language is undefined", () => {
    vi.stubGlobal("navigator", { language: undefined });
    const service = new LocalI18nService();
    expect(service.getCurrentLocale()).toBe("en"); // Tests right branch of ??
  });

  it("should fallback to 'en' when split returns empty array", () => {
    // Edge case: This tests the defensive fallback
    vi.stubGlobal("navigator", { language: "" });
    const service = new LocalI18nService();
    expect(service.getCurrentLocale()).toBe("en");
  });
});
```

#### Implementation Steps

1. ✅ **LocalI18nService Tests** (10min)
   - Add test for empty `navigator.language`
   - Test fallback branch of `??`
   - Remove c8 ignore marker

2. ✅ **module-api-initializer Tests** (10min)
   - Test deprecation warning with and without replacement
   - Remove c8 ignore markers

3. ✅ **ConsoleLogger Tests** (5min)
   - Test TracedLogger with optional `setMinLevel`
   - Remove c8 ignore marker

4. ✅ **Documentation** (5min)
   - Update `code-coverage-exclusions.md`
   - Update CHANGELOG.md

#### Validation Criteria

- ✅ All 5 c8 ignore markers removed
- ✅ Both branches of `??` operators tested
- ✅ 100% code coverage maintained
- ✅ All tests pass

---

### 1.3 Exhaustive Enum Checking

**Status:** 🟡 Not Started  
**Effort:** 1 Stunde  
**Impact:** ~2 Ignores (1% Reduktion)  
**Priority:** 🥉 Medium  
**Risk:** LOW

#### Problem

Switch-Statement mit defensive default-Branch für Enum, der nie erreicht werden kann:

```typescript
// ServiceResolver.ts
switch (lifecycle) {
  case ServiceLifecycle.SINGLETON:
    // ...
  case ServiceLifecycle.TRANSIENT:
    // ...
  case ServiceLifecycle.SCOPED:
    // ...
  /* c8 ignore start -- Defensive: ServiceLifecycle enum ensures only valid values */
  default:
    return err({
      code: "InvalidLifecycle",
      message: `Unknown lifecycle: ${lifecycle}`,
      tokenDescription: String(token),
    });
  /* c8 ignore stop */
}
```

**Betroffene Dateien (2 Marker):**
- `src/di_infrastructure/resolution/ServiceResolver.ts`: 2 Marker

#### Solution

Nutze TypeScript's `never` type für exhaustive checking:

```typescript
// ServiceResolver.ts - AFTER
switch (lifecycle) {
  case ServiceLifecycle.SINGLETON:
    // ...
    break;
  case ServiceLifecycle.TRANSIENT:
    // ...
    break;
  case ServiceLifecycle.SCOPED:
    // ...
    break;
  default:
    // TypeScript ensures this is unreachable
    const _exhaustiveCheck: never = lifecycle;
    return err({
      code: "InvalidLifecycle",
      message: `Unknown lifecycle: ${_exhaustiveCheck}`,
      tokenDescription: String(token),
    });
}
```

**Vorteile:**
- TypeScript compiler error wenn neuer Lifecycle hinzugefügt wird
- Default-Branch wird als unreachable erkannt
- Kein c8 ignore nötig (TypeScript garantiert exhaustiveness)

#### Implementation Steps

1. ✅ **ServiceResolver Refactoring** (30min)
   - Add `never` type to switch default
   - Remove c8 ignore markers
   - Verify TypeScript compilation

2. ✅ **Testing** (20min)
   - Verify existing tests still pass
   - Test that adding new enum value causes compile error

3. ✅ **Documentation** (10min)
   - Update `code-coverage-exclusions.md`
   - Add code comment explaining `never` pattern
   - Update CHANGELOG.md

#### Validation Criteria

- ✅ All 2 c8 ignore markers removed
- ✅ TypeScript compiler enforces exhaustiveness
- ✅ Adding new enum value causes compilation error
- ✅ All tests pass

#### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing code | LOW | VERY LOW | `never` type is non-breaking change |
| Future enum additions missed | MEDIUM | VERY LOW | TypeScript compiler catches missing cases |

---

## Phase 2: Mittelfristige Maßnahmen (Optional)

**Status:** 🟡 Not Started  
**Total Effort:** 7-9 Stunden  
**Total Impact:** ~60 Ignores (32.6% Reduktion)  
**Priority:** MEDIUM-HIGH

---

### 2.1 TypeScript Compile-Time Checks

**Status:** 🟡 Not Started  
**Effort:** 2 Stunden  
**Impact:** ~2 Ignores (1% Reduktion)  
**Priority:** MEDIUM  
**Risk:** LOW

#### Problem

Runtime-Checks die bereits durch TypeScript compile-time garantiert werden:

```typescript
// input-validators.ts
/* c8 ignore start -- TypeScript ensures id is string at compile time */
if (typeof id !== "string") {
  return err(createFoundryError("VALIDATION_FAILED", "ID must be a string"));
}
/* c8 ignore stop */
```

**Betroffene Dateien (2 Marker):**
- `src/foundry/validation/input-validators.ts`: 2 Marker

#### Solution

**Option A: Remove Runtime Check (Empfohlen für interne Funktionen)**

```typescript
// BEFORE
export function validateJournalId(id: string): Result<string, FoundryError> {
  /* c8 ignore start -- TypeScript ensures id is string at compile time */
  if (typeof id !== "string") {
    return err(createFoundryError("VALIDATION_FAILED", "ID must be a string"));
  }
  /* c8 ignore stop */
  
  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID must not be empty"));
  }
  return ok(id);
}

// AFTER
export function validateJournalId(id: string): Result<string, FoundryError> {
  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID must not be empty"));
  }
  return ok(id);
}
```

**Option B: Assert Type mit Type Guard (für public API)**

```typescript
// If function is part of public API exposed to unknown consumers
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError("Expected string");
  }
}

export function validateJournalId(id: unknown): Result<string, FoundryError> {
  assertString(id); // Throws if not string
  
  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID must not be empty"));
  }
  return ok(id);
}
```

#### Implementation Steps

1. ✅ **Analyze API Surface** (30min)
   - Determine if `validateJournalId` is internal or public API
   - Check all callers

2. ✅ **Refactoring** (1h)
   - Remove runtime check if internal API
   - Or convert to assertion if public API
   - Remove c8 ignore markers

3. ✅ **Testing** (30min)
   - Verify callers still work correctly
   - Add test for edge cases if needed

#### Validation Criteria

- ✅ 2 c8 ignore markers removed
- ✅ Type safety maintained
- ✅ All tests pass

---

### 2.2 Sampling Tests with Fixed Seed

**Status:** 🟡 Not Started  
**Effort:** 1-2 Stunden  
**Impact:** ~2 Ignores (1% Reduktion)  
**Priority:** MEDIUM  
**Risk:** LOW

#### Problem

Sampling logic mit `Math.random()` ist schwer deterministisch zu testen:

```typescript
// metrics-collector.ts
/* c8 ignore start -- Production sampling: Math.random() behavior tested in shouldSample tests */
return Math.random() < this.env.performanceSamplingRate;
/* c8 ignore stop */
```

**Betroffene Dateien (4 Marker, ~2 eliminierbar):**
- `src/observability/metrics-collector.ts`: 4 Marker (Development mode + Sampling)

#### Solution

Mock `Math.random()` mit festem Seed für deterministische Tests:

```typescript
// metrics-collector.test.ts - NEW
describe("shouldSample - production sampling", () => {
  it("should sample when random < samplingRate", () => {
    const env = { ...testEnv, isDevelopment: false, performanceSamplingRate: 0.7 };
    const collector = new MetricsCollector(env);
    
    // Mock Math.random to return 0.5 (< 0.7 = should sample)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    
    expect(collector.shouldSample()).toBe(true); // Tests left branch
  });

  it("should not sample when random >= samplingRate", () => {
    const env = { ...testEnv, isDevelopment: false, performanceSamplingRate: 0.3 };
    const collector = new MetricsCollector(env);
    
    // Mock Math.random to return 0.5 (>= 0.3 = should NOT sample)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    
    expect(collector.shouldSample()).toBe(false); // Tests right branch
  });
});
```

#### Implementation Steps

1. ✅ **Test Implementation** (1h)
   - Add tests for production sampling with mocked `Math.random()`
   - Test both branches (sample / no sample)
   - Remove c8 ignore markers

2. ✅ **Documentation** (30min)
   - Update `code-coverage-exclusions.md`
   - Add comment explaining why Math.random is mocked

#### Validation Criteria

- ✅ ~2 c8 ignore markers removed (sampling branch)
- ✅ Development mode ignore can stay (legitimate conditional)
- ✅ Sampling behavior tested deterministically
- ✅ All tests pass

---

### 2.3 withRetry Direct Tests

**Status:** 🟡 Not Started  
**Effort:** 1-2 Stunden  
**Impact:** ~4 Ignores (2% Reduktion)  
**Priority:** LOW  
**Risk:** LOW

#### Problem

`withRetry` und `withRetryAsync` Methoden werden nur indirekt getestet:

```typescript
// FoundryServiceBase.ts
/* c8 ignore start -- Tested indirectly via Foundry Services that call this method */
protected withRetry<T>(operation: () => T, options?: RetryOptions): Result<T, Error> {
  return this.retryService.retry(operation, options);
}
/* c8 ignore stop */
```

**Betroffene Dateien (4 Marker):**
- `src/foundry/services/FoundryServiceBase.ts`: 4 Marker

#### Solution

Erstelle direkte Unit-Tests für `FoundryServiceBase`:

```typescript
// FoundryServiceBase.test.ts - NEW
describe("FoundryServiceBase - withRetry", () => {
  it("should delegate to RetryService.retry", () => {
    const mockRetry = vi.fn().mockReturnValue(ok("success"));
    const mockRetryService = { retry: mockRetry, retryAsync: vi.fn() };
    
    class TestService extends FoundryServiceBase<MockPort> {
      constructor() {
        super(mockPort, mockRetryService as any, "TestPort");
      }
      
      testRetry() {
        return this.withRetry(() => "test", { maxAttempts: 2, mapException: e => e });
      }
    }
    
    const service = new TestService();
    const result = service.testRetry();
    
    expect(result.ok).toBe(true);
    expect(mockRetry).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ maxAttempts: 2 }));
  });

  it("should pass options to RetryService", () => {
    // Test that options are correctly forwarded
  });
});
```

#### Implementation Steps

1. ✅ **Create Test File** (30min)
   - Create `FoundryServiceBase.test.ts`
   - Setup mocks for port and retry service

2. ✅ **Implement Tests** (1h)
   - Test `withRetry()` delegation
   - Test `withRetryAsync()` delegation
   - Test option forwarding
   - Remove c8 ignore markers

3. ✅ **Documentation** (30min)
   - Update `code-coverage-exclusions.md`

#### Validation Criteria

- ✅ 4 c8 ignore markers removed
- ✅ Direct tests for withRetry methods
- ✅ All tests pass

---

### 2.4 Error Propagation Tests

**Status:** 🟡 Not Started  
**Effort:** 2-3 Stunden  
**Impact:** ~52 Ignores (28.3% Reduktion)  
**Priority:** HIGH 🔥  
**Risk:** LOW

#### Problem

Parent-Module (wie `configureDependencies`) propagieren Errors von Sub-Modulen, aber diese Error-Propagation wird nicht getestet:

```typescript
// dependencyconfig.ts
const coreResult = registerCoreServices(container);
/* c8 ignore next -- Error propagation: Core services failure tested in sub-module */
if (isErr(coreResult)) return coreResult;

const observabilityResult = registerObservability(container);
/* c8 ignore next -- Error propagation: Observability failure tested in sub-module */
if (isErr(observabilityResult)) return observabilityResult;

// ... 7 Sub-Module insgesamt
```

**Betroffene Dateien (~52 Marker):**
- `src/config/dependencyconfig.ts`: 8 Marker (7 sub-modules + validation)
- `src/config/modules/port-infrastructure.config.ts`: 13 Marker (6 registries)
- `src/config/modules/utility-services.config.ts`: 4 Marker
- `src/config/modules/i18n-services.config.ts`: 6 Marker
- `src/config/modules/foundry-services.config.ts`: 2 Marker
- `src/di_infrastructure/registry/ServiceRegistry.ts`: 8 Marker
- `src/di_infrastructure/resolution/ServiceResolver.ts`: 4 Marker
- `src/di_infrastructure/container.ts`: 2 Marker
- Und weitere...

#### Solution: Mock Sub-Modules und teste Orchestration

**Revidierte Bewertung:**

**Ursprüngliche Annahme (FALSCH):**
> ❌ "Tests würden Sub-Module-Tests duplizieren"  
> ❌ "DRY-Prinzip wichtiger als Coverage-Metrik"

**Neue Erkenntnis:**
> ✅ **Test-Duplikation ist in Tests OK** (DAMP > DRY)  
> ✅ Tests geben **Confidence über Orchestration**  
> ✅ Aufwand ist **akzeptabel** für 28% Impact!

**Implementierung:**

```typescript
// dependencyconfig.test.ts - NEW
import { vi, describe, it, expect, beforeEach } from "vitest";
import { configureDependencies } from "../dependencyconfig";
import { ServiceContainer } from "@/di_infrastructure/container";
import { err } from "@/utils/functional/result";

// Mock all sub-modules
vi.mock("@/config/modules/core-services.config", () => ({
  registerCoreServices: vi.fn(),
}));

vi.mock("@/config/modules/observability.config", () => ({
  registerObservability: vi.fn(),
}));

// ... mock all 7 sub-modules

describe("configureDependencies - error propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default, all succeed
    vi.mocked(registerCoreServices).mockReturnValue(ok(undefined));
    vi.mocked(registerObservability).mockReturnValue(ok(undefined));
    // ...
  });

  it("should propagate error from registerCoreServices", async () => {
    const { registerCoreServices } = await import("@/config/modules/core-services.config");
    vi.mocked(registerCoreServices).mockReturnValue(err("Core services failed"));
    
    const container = ServiceContainer.createRoot();
    const result = configureDependencies(container);
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Core services failed");
  });

  it("should propagate error from registerObservability", async () => {
    const { registerObservability } = await import("@/config/modules/observability.config");
    vi.mocked(registerObservability).mockReturnValue(err("Observability failed"));
    
    const container = ServiceContainer.createRoot();
    const result = configureDependencies(container);
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Observability failed");
  });

  // ... 5 more tests for other sub-modules

  it("should propagate validation errors", async () => {
    // Mock container.validate() to fail
    const container = ServiceContainer.createRoot();
    vi.spyOn(container, "validate").mockReturnValue(err([
      { code: "MissingDependency", message: "Missing Logger" }
    ]));
    
    const result = configureDependencies(container);
    
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Validation failed");
  });
});
```

**Pattern für alle Config-Module:**

```typescript
// port-infrastructure.config.test.ts - NEW
describe("registerPortInfrastructure - error propagation", () => {
  it("should propagate PortSelector registration error", () => {
    const container = ServiceContainer.createRoot();
    vi.spyOn(container, "registerClass").mockReturnValueOnce(
      err({ code: "RegistrationFailed", message: "PortSelector failed" })
    );
    
    const result = registerPortInfrastructure(container);
    
    expect(result.ok).toBe(false);
    expect(result.error).toContain("PortSelector");
  });

  // 6 more tests for each registry registration
});
```

#### Implementation Steps

**1. ✅ dependencyconfig.ts Tests (1h)**
   - Mock 7 sub-modules
   - Test error propagation für jeden Sub-Module
   - Test validation error propagation
   - Remove 8 c8 ignore markers

**2. ✅ port-infrastructure.config.ts Tests (30min)**
   - Test PortSelector registration error
   - Test 6 registry registration errors
   - Remove 13 c8 ignore markers

**3. ✅ Other Config Modules (30min)**
   - utility-services.config.ts (4 markers)
   - i18n-services.config.ts (6 markers)
   - foundry-services.config.ts (2 markers)
   - Remove 12 c8 ignore markers total

**4. ✅ DI Infrastructure Tests (30min)**
   - ServiceRegistry.ts error propagation (8 markers)
   - ServiceResolver.ts error propagation (4 markers)
   - Container.ts error propagation (2 markers)
   - Remove 14 c8 ignore markers

**5. ✅ Documentation (30min)**
   - Update `code-coverage-exclusions.md` (Category 1 komplett eliminiert!)
   - Update CHANGELOG.md
   - Document testing pattern for future modules

#### Code-Beispiele für Tests

```typescript
// Pattern: Test Error Propagation mit vi.mock()
describe("Parent Module - error propagation", () => {
  it("should propagate error from SubModuleA", () => {
    vi.mocked(registerSubModuleA).mockReturnValue(err("SubModuleA failed"));
    
    const result = parentModule();
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("SubModuleA failed");
  });
});

// Pattern: Test Service Registration Errors
describe("Config Module - registration errors", () => {
  it("should handle ServiceX registration failure", () => {
    vi.spyOn(container, "registerClass").mockReturnValueOnce(
      err({ code: "RegistrationFailed", message: "ServiceX failed" })
    );
    
    const result = configModule(container);
    
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ServiceX");
  });
});
```

#### Validation Criteria

- ✅ ~52 c8 ignore markers removed (28.3%)
- ✅ All error propagation paths tested
- ✅ Mocks sind clean und wartbar
- ✅ Tests geben Confidence über Orchestration
- ✅ Keine Code-Duplikation im Production Code
- ✅ Test-Duplikation ist OK (DAMP > DRY für Tests)
- ✅ All tests pass

#### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Mock-Complexity | MEDIUM | LOW | Klare Mock-Patterns dokumentiert |
| Fragile Tests (Sub-Module-Änderungen) | MEDIUM | MEDIUM | Mocks nur an Schnittstellen, nicht Implementation |
| False Confidence | LOW | LOW | Tests prüfen echte Error-Propagation-Logic |
| Maintenance Overhead | MEDIUM | MEDIUM | 52 neue Tests müssen gepflegt werden |

#### Expected Benefits

**Coverage:**
- ✅ 52 c8 ignore Marker eliminiert (28.3% - **HÖCHSTER IMPACT!**)
- ✅ Komplette Category 1 eliminiert
- ✅ 100% coverage für Orchestration-Logic

**Confidence:**
- ✅ Verifiziert dass Parent-Module richtig verkabelt sind
- ✅ Fehler in Orchestration werden gefangen
- ✅ Regression-Protection bei Refactorings

**Architecture:**
- ✅ Keine Änderungen am Production Code
- ✅ Test-Duplikation ist legitim (DAMP > DRY)
- ✅ Klare Separation: Sub-Module testen Logic, Parent testet Orchestration

#### Why This Is Now Recommended

**Ursprüngliche Ablehnung basierte auf falscher Annahme:**
- ❌ "DRY-Prinzip gilt für Tests" → **FALSCH**, DAMP > DRY für Tests!
- ❌ "Test-Duplikation ist schlecht" → **FALSCH**, ist OK wenn Klarheit erhöht!

**Neue Bewertung:**
- ✅ **28.3% Impact** ist massiv (höchster Einzelimpact!)
- ✅ **2-3h Aufwand** ist akzeptabel
- ✅ **Test-Patterns sind einfach** (Mock + Error check)
- ✅ **Gibt echten Wert** (Confidence über Orchestration)

---

## Phase 3: Nicht Empfohlen

**Status:** ⛔ Will Not Do  
**Reason:** Aufwand > Nutzen, oder architektonische Constraints

---

### 3.1 Foundry Runtime Integration-Tests

**Category:** Foundry Runtime Dependencies  
**Potential Impact:** ~45 Ignores (22%)  
**Effort:** SEHR HOCH (20+ Stunden)  
**Recommendation:** ⛔ **DO NOT IMPLEMENT (in Unit-Tests)**

#### Why Not

- Foundry Runtime ist nicht in Unit-Tests simulierbar
- Würde vollständige Foundry VTT Mock-Infrastruktur erfordern
- Integration-Tests sind separate Test-Suite
- Unit-Test-Coverage ist falsches Metrik für Integration-Points

#### Alternative

✅ **Erstelle separate Integration-Test-Suite** (Future Task):
- Integration-Tests mit echtem Foundry VTT Environment
- Separate von Unit-Tests
- Nicht in Coverage-Metrik gezählt

---

### 3.2 Lifecycle Method Testing

**Category:** Lifecycle Methods  
**Potential Impact:** ~12 Ignores (6%)  
**Effort:** UNMÖGLICH  
**Recommendation:** ⛔ **DO NOT IMPLEMENT**

#### Why Not

- Lifecycle-Events (Module disable, disposeAll) nicht in Unit-Tests simulierbar
- Würde Mock-Infrastruktur zu komplex machen
- Tests würden nicht echtes Verhalten testen

#### Alternative

Akzeptieren als legitime Ausnahme. Lifecycle-Callbacks sind architektonisch gerechtfertigt.

---

## Implementierungsreihenfolge

### Recommended Path: Quick Wins Only

**Total Effort:** 5-6 Stunden  
**Total Impact:** 21 Ignores (10.5%)

1. **Week 1-2: Disposed State Guards** (3-4h)
   - Highest impact (7%)
   - Defensive programming improvement
   - Eliminates entire category
   - Adds idempotent disposal pattern

2. **Week 1: Default Parameter Tests** (30min)
   - Lowest effort
   - Quick win for immediate results
   - Good learning for team

3. **Week 2: Exhaustive Enum Checking** (1h)
   - Medium effort
   - Teaches TypeScript best practice
   - Compile-time safety improvement

**Result:** 163 Ignores remaining (from 184), 11.4% reduction

---

### Optional Path: Quick Wins + Mittelfristig

**Total Effort:** 12-15 Stunden  
**Total Impact:** 81 Ignores (44.0%)

Add Phase 2 tasks after Quick Wins:

4. **Week 3: TypeScript Compile-Time Checks** (2h) - 2 ignores
5. **Week 4: Sampling Tests** (1-2h) - 2 ignores
6. **Week 5: withRetry Direct Tests** (1-2h) - 4 ignores
7. **Week 6-7: Error Propagation Tests** (2-3h) - 52 ignores 🔥

**Result:** 103 Ignores remaining (from 184), 44.0% reduction

---

### Aggressive Path: Maximum Reduction

If you complete all Phase 1 + Phase 2 tasks: **44% reduction achieved!**

**Remaining 120 lines are legitimately justified:**
- Foundry Runtime Dependencies (45): Echte Integration-Points
- Lifecycle Methods (12): Nicht in Unit-Tests testbar
- Defensive Programming (34): Fail-Safes und Edge-Cases
- Performance/Lifecycle Callbacks (8): Sampling und optionale Callbacks
- Indirect Testing (8): FoundryServiceBase (wenn Task 2.3 nicht gemacht)
- Default Parameters (1): TracedLogger.setMinLevel optional
- Original Miscellaneous (12): Various edge cases

**Recommendation:** ✅ Phase 1 + Phase 2 ist das realistische Maximum

---

## Tracking & Progress

### Progress Dashboard

| Phase | Status | Effort | Impact | Completed |
|-------|--------|--------|--------|-----------|
| **Phase 1: Quick Wins** | 🟡 Not Started | 5-6h | 21 ignores | 0% |
| 1.1 Disposed State Guards | 🟡 Not Started | 3-4h | 14 ignores | 0% |
| 1.2 Default Parameter Tests | 🟡 Not Started | 30min | 5 ignores | 0% |
| 1.3 Exhaustive Enum | 🟡 Not Started | 1h | 2 ignores | 0% |
| **Phase 2: Optional** | 🟡 Not Started | 7-9h | 60 ignores | 0% |
| 2.1 Compile-Time Checks | 🟡 Not Started | 2h | 2 ignores | 0% |
| 2.2 Sampling Tests | 🟡 Not Started | 1-2h | 2 ignores | 0% |
| 2.3 withRetry Tests | 🟡 Not Started | 1-2h | 4 ignores | 0% |
| 2.4 Error Propagation Tests 🔥 | 🟡 Not Started | 2-3h | 52 ignores | 0% |
| **Phase 3: Not Recommended** | ⛔ Will Not Do | - | - | N/A |

**Legend:**
- 🟢 Completed
- 🔵 In Progress
- 🟡 Not Started
- ⛔ Will Not Do

---

### Milestones

#### Milestone 1: Quick Wins Completed
- **Target:** End of Week 2-3 (je nach Team-Kapazität)
- **Criteria:**
  - ✅ All Phase 1 tasks completed
  - ✅ 21 Ignores eliminated
  - ✅ All tests passing
  - ✅ Documentation updated

#### Milestone 2: Optional Tasks Completed
- **Target:** End of Week 6-7 (je nach Team-Kapazität)
- **Criteria:**
  - ✅ All Phase 2 tasks completed
  - ✅ 81 Ignores eliminated total (44% reduction!)
  - ✅ All tests passing
  - ✅ Documentation updated
  - ✅ Category 1 (Module Registration) komplett eliminiert

---

## Expected Results

### Before Refactoring

```
Current State:
├─ 184 c8 ignore markers
├─ ~201 ignored lines
├─ 35 files with ignores
└─ 100% coverage (with exceptions)

Category Breakdown:
├─ Module Registration Error Propagation: 52 lines (26%)
├─ Foundry Runtime Dependencies: 45 lines (22%)
├─ Defensive Programming: 38 lines (19%)
├─ Port/Service Disposal Methods: 14 lines (7%)
├─ Performance/Lifecycle Callbacks: 10 lines (5%)
├─ Default Parameter Coverage: 6 lines (3%)
├─ Lifecycle Methods: 12 lines (6%)
├─ Indirect Testing: 12 lines (6%)
└─ Miscellaneous: 12 lines (6%)
```

---

### After Phase 1 (Quick Wins)

```
Target State:
├─ 163 c8 ignore markers (-21, -11.4%)
├─ ~180 ignored lines (-21, -10.5%)
├─ 32 files with ignores (-3)
└─ 100% coverage (with exceptions)

Eliminated Categories:
└─ Port/Service Disposal Methods: 0 lines (was 14) ✅

Reduced Categories:
├─ Defensive Programming: 36 lines (-2)
└─ Default Parameter Coverage: 1 line (-5)

Unchanged:
├─ Module Registration Error Propagation: 52 lines (architektonisch begründet)
├─ Foundry Runtime Dependencies: 45 lines (Integration-Points)
├─ Performance/Lifecycle Callbacks: 10 lines (legitim)
├─ Lifecycle Methods: 12 lines (nicht testbar)
├─ Indirect Testing: 12 lines (noch nicht refactored)
└─ Miscellaneous: 12 lines (noch nicht refactored)
```

---

### After Phase 2 (Quick Wins + Optional)

```
Final Target State:
├─ 103 c8 ignore markers (-81, -44.0%) 🎉
├─ 120 ignored lines (-81, -40.3%)
├─ 25 files with ignores (-10)
└─ 100% coverage (with exceptions)

Eliminated Categories (2):
├─ Port/Service Disposal Methods: 0 lines (was 14) ✅
└─ Module Registration Error Propagation: 0 lines (was 52) ✅

Reduced Categories (4):
├─ Defensive Programming: 34 lines (was 38, -4)
├─ Default Parameter Coverage: 1 line (was 6, -5)
├─ Performance/Lifecycle Callbacks: 8 lines (was 10, -2)
└─ Indirect Testing: 8 lines (was 12, -4)

Remaining Unchanged (3):
├─ Foundry Runtime Dependencies: 45 lines (Integration-Points, Phase 3.1)
├─ Lifecycle Methods: 12 lines (Nicht testbar, Phase 3.2)
└─ Original Miscellaneous: 12 lines (Various edge cases)

Total Remaining: 120 lines (45 + 12 + 34 + 8 + 1 + 8 + 12 = 120)
├─ 57 lines (48%): Absolut legitim (Foundry Runtime + Lifecycle)
├─ 63 lines (52%): Größtenteils legitim (Reduced + Misc)
└─ Alle architektonisch gerechtfertigt ✅
```

#### Detaillierte Category-Aufschlüsselung der 120 verbleibenden Lines

| Kategorie | Lines | % of 120 | Original | Reduktion | Status | Grund |
|-----------|-------|----------|----------|-----------|--------|-------|
| Foundry Runtime Dependencies | 45 | 38% | 45 | 0 | ⛔ Phase 3.1 | Integration-Points, nicht unit-testbar |
| Defensive Programming | 34 | 28% | 38 | -4 | ⚠️ Größtenteils legitim | Fail-Safes, Edge-Cases |
| Lifecycle Methods | 12 | 10% | 12 | 0 | ⛔ Phase 3.2 | Events nicht simulierbar |
| Original Miscellaneous | 12 | 10% | 12 | 0 | ✅ Legitim | Various edge cases |
| Performance/Lifecycle Callbacks | 8 | 7% | 10 | -2 | ⚠️ Größtenteils legitim | Sampling, optionale Callbacks |
| Indirect Testing | 8 | 7% | 12 | -4 | ⚠️ Wenn Task 2.3 nicht | FoundryServiceBase withRetry |
| Default Parameter Coverage | 1 | 1% | 6 | -5 | ✅ Legitim | TracedLogger.setMinLevel optional |
| **TOTAL** | **120** | **100%** | **135** | **-15** | | **-11.1% intern** |

**Hinweis:** Die 120 verbleibenden Lines sind das Ergebnis von 135 Lines (nach Phase 2 Kategorien-Reduktion), nicht 201 Original. Die 81 eliminierten Lines kommen aus komplett eliminierten Kategorien (66 Lines) + Reduktionen innerhalb Kategorien (15 Lines).

---

### Quality Metrics After Completion

| Metric | Before | After Phase 1 | After Phase 2 | Improvement |
|--------|--------|---------------|---------------|-------------|
| c8 ignore markers | 184 | 163 | 103 | -44.0% 🎉 |
| Ignored lines | 201 | 180 | 120 | -40.3% |
| Files with ignores | 35 | 32 | 25 | -28.6% |
| Categories eliminated | 0 | 1 | 2 | ✅✅ |
| Architectural justifications | 100% | 100% | 100% | ✅ |

---

## Dependencies & Prerequisites

### Technical Prerequisites

- ✅ TypeScript 5.x (für `never` type)
- ✅ Vitest (für Mocking)
- ✅ Existing test infrastructure
- ✅ c8 code coverage setup

### Knowledge Prerequisites

- Understanding of TypeScript advanced types (`never`, type guards)
- Understanding of Disposable pattern
- Understanding of test mocking strategies
- Familiarity with codebase architecture

### Blocking Issues

None identified. All tasks can start immediately.

---

## Risks & Mitigations

### Overall Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing functionality | HIGH | LOW | Comprehensive testing, incremental rollout |
| Introducing new ignores | MEDIUM | MEDIUM | Code review, strict justification required |
| Team time investment | MEDIUM | HIGH | Prioritize Quick Wins, make Optional truly optional |
| LSP violations | MEDIUM | LOW | Type guards, careful interface design |

### Risk Management Strategy

1. **Incremental Implementation**: One task at a time, merge after each completion
2. **Comprehensive Testing**: No merge without 100% test pass rate
3. **Code Review**: All changes reviewed by 2+ developers
4. **Documentation**: Update docs immediately after each task
5. **Rollback Plan**: Git revert capability, feature flags if needed

---

## Success Criteria

### Definition of Done (Per Task)

- ✅ All targeted c8 ignore markers removed
- ✅ 100% code coverage maintained
- ✅ All existing tests pass
- ✅ New tests added where needed
- ✅ No regressions introduced
- ✅ Documentation updated
- ✅ Code reviewed and approved
- ✅ CHANGELOG.md entry added

### Project Success Criteria

**Minimum Success (Phase 1 only):**
- ✅ 21 Ignores eliminated (11.4%)
- ✅ 163 markers remaining
- ✅ Disposed State Guards pattern established
- ✅ Team learned TypeScript best practices

**Full Success (Phase 1 + 2) - EMPFOHLEN:**
- ✅ 81 Ignores eliminated (44.0%) 🎉
- ✅ 103 markers remaining
- ✅ 2 komplette Kategorien eliminiert
- ✅ All Quick Wins + Optional tasks completed
- ✅ Remaining ignores are architecturally justified
- ✅ Confidence über Orchestration-Logic

---

## Related Documentation

- [Code Coverage Exclusions](../quality-gates/code-coverage-exclusions.md) - Vollständiger Audit
- [Quality Gates README](../quality-gates/README.md) - Quality Gates Overview
- [Type Coverage Exclusions](../quality-gates/type-coverage-exclusions.md) - Type-Safety Casts
- [Linter Exclusions](../quality-gates/linter-exclusions.md) - ESLint Disables

---

## Changelog

### Version 1.2.0 (11. November 2025)
- **Korrektur:** Verbleibende Lines-Aufschlüsselung präzisiert
- "Miscellaneous 46 lines" aufgeschlüsselt in 7 konkrete Kategorien
- Detaillierte Tabelle für 120 verbleibende Lines hinzugefügt
- Rechnung korrigiert: 45 + 12 + 34 + 8 + 1 + 8 + 12 = 120 ✓
- Klarstellung: 57 lines absolut legitim (48%), 63 lines größtenteils legitim (52%)

### Version 1.1.0 (11. November 2025)
- **Major Update:** Error Propagation Tests zu Phase 2 hinzugefügt (Task 2.4)
- Revidierte Bewertung: DAMP > DRY für Tests!
- Phase 2 Impact erhöht: 8 → 60 ignores (32.6%)
- Total Impact erhöht: 29 → 81 ignores (44.0%)
- Kategorie 1 (Module Registration) nun eliminierbar
- 2 komplette Kategorien nach Phase 2 eliminiert (statt 1)
- Task 1.1 umbenannt: "Optional Disposable" → "Disposed State Guards"
- Disposed State Guards mit `#disposed` private field Pattern dokumentiert

### Version 1.0.0 (11. November 2025)
- Initial roadmap created
- 9 Kategorien analysiert
- 3 Phasen definiert (Quick Wins, Optional, Not Recommended)
- Detaillierte Implementation Steps für alle Quick Wins
- Expected Results dokumentiert
- Tracking Dashboard erstellt

