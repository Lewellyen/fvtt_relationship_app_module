# Runtime Error Monitoring Tests

**Status:** ✅ Implementiert  
**Priorität:** 🥇 Hohe Priorität  
**Aufwand:** 2-3 Stunden  
**Tool:** Vitest (bereits vorhanden)

---

## Übersicht

Runtime Error Monitoring Tests prüfen, ob Fehlerbehandlung korrekt funktioniert. Sie stellen sicher, dass das Modul auch bei Fehlern stabil bleibt und keine unerwarteten Exceptions wirft.

**Warum wichtig:**
- Verhindert Crashes in Foundry
- Sichert robustes Fehlerhandling
- Verbessert User Experience
- Sichert Result-Pattern-Konsistenz

---

## Was wird getestet?

### 1. Foundry API-Fehler

**Szenario:** Foundry API ist nicht verfügbar oder wirft Fehler

**Schritte:**
1. `game.journal` auf `undefined` setzen
2. `getJournalEntries()` aufrufen
3. Prüfen ob Result-Pattern zurückgegeben wird (keine Exception)

**Erwartetes Ergebnis:**
- Result mit `ok: false`
- Fehler-Code: `API_NOT_AVAILABLE`
- Keine Exception

---

### 2. Graceful Degradation

**Szenario:** Teilweise fehlende Foundry-APIs

**Schritte:**
1. `game.journal` auf `undefined` setzen
2. Service-Methoden aufrufen
3. Prüfen ob Module weiterhin funktioniert

**Erwartetes Ergebnis:**
- Module crasht nicht
- Fehler werden korrekt behandelt
- Result-Pattern wird verwendet

---

### 3. Result-Pattern-Konsistenz

**Szenario:** Alle Service-Methoden verwenden Result-Pattern

**Schritte:**
1. Alle Service-Methoden aufrufen (auch bei Fehlern)
2. Prüfen ob immer Result zurückgegeben wird
3. Prüfen ob nie Exceptions geworfen werden

**Erwartetes Ergebnis:**
- Alle Methoden geben Result zurück
- Keine Exceptions
- Konsistentes Fehlerhandling

---

### 4. Error Recovery (Retry-Logik)

**Szenario:** Transiente Fehler werden retried

**Schritte:**
1. Transienten Fehler simulieren (z.B. Network-Error)
2. Retry-Logik testen
3. Prüfen ob nach Retry erfolgreich

**Erwartetes Ergebnis:**
- Retry-Logik funktioniert
- Nach Retry erfolgreich
- Max Retries werden respektiert

---

## Warum wichtig?

- ✅ Verhindert Crashes in Foundry
- ✅ Sichert robustes Fehlerhandling
- ✅ Verbessert User Experience
- ✅ Sichert Result-Pattern-Konsistenz

---

## Implementierungsanleitung

### Voraussetzungen

**Tools:**
- ✅ Vitest (bereits vorhanden)
- ✅ `expectResultOk()` / `expectResultErr()` Assertions
- ✅ `withFoundryGlobals()` Helper

---

### Pattern 1: API-Fehler simulieren

```typescript
it("should handle Foundry API failures gracefully", () => {
  const cleanup = withFoundryGlobals({
    game: undefined, // Simuliert API-Fehler
  });
  
  const result = gameService.getJournalEntries();
  expectResultErr(result);
  expect(result.error.code).toBe("API_NOT_AVAILABLE");
  // Sollte nicht crashen, sondern Result zurückgeben
  
  cleanup();
});
```

---

### Pattern 2: Graceful Degradation

```typescript
it("should handle partial API availability", () => {
  const mockGame = createMockGame();
  // game.journal auf undefined setzen
  delete (mockGame as any).journal;
  
  const cleanup = withFoundryGlobals({
    game: mockGame,
  });
  
  // Service sollte weiterhin funktionieren
  const result = gameService.getJournalEntries();
  expectResultErr(result);
  // Module sollte nicht crashen
  
  cleanup();
});
```

---

### Pattern 3: Result-Pattern-Konsistenz

```typescript
it("should always return Result, never throw", () => {
  // Alle Service-Methoden testen
  const methods = [
    () => service.method1(),
    () => service.method2(),
    () => service.method3(),
  ];
  
  methods.forEach(method => {
    // Sollte nie Exception werfen
    expect(() => {
      const result = method();
      // Sollte immer Result sein
      expect(result).toHaveProperty("ok");
    }).not.toThrow();
  });
});
```

---

## Detaillierte Implementierung

### Test 1: Foundry API-Fehler

**Datei:** `src/foundry/services/__tests__/foundry-api-error-handling.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { foundryGameServiceToken } from "@/di_infrastructure/tokens";
import type { FoundryGameService } from "@/foundry/services/foundry-game-service";

describe("Runtime Error: Foundry API Failures", () => {
  let cleanup: (() => void) | undefined;
  let container: any;
  let gameService: FoundryGameService;

  beforeEach(async () => {
    vi.resetModules();
    
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;
    
    gameService = container.resolve(foundryGameServiceToken);
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should handle undefined game.journal gracefully", () => {
    const mockGame = createMockGame();
    delete (mockGame as any).journal; // API nicht verfügbar
    
    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntries();
    
    // Sollte Result mit Fehler zurückgeben, nicht Exception
    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should handle game.journal.get throwing error", () => {
    const mockGame = createMockGame();
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockImplementation(() => {
        throw new Error("Journal API error");
      });
    }
    
    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntry("test-id");
    
    expectResultErr(result);
    expect(result.error.message).toContain("Journal API error");
  });

  it("should handle game.journal.contents being undefined", () => {
    const mockGame = createMockGame();
    if (mockGame.journal) {
      mockGame.journal.contents = undefined as any;
    }
    
    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntries();
    
    // Sollte leeres Array oder Fehler zurückgeben, nicht crashen
    if (result.ok) {
      expect(Array.isArray(result.value)).toBe(true);
    } else {
      expectResultErr(result);
    }
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] API-Fehler-Szenarien testen
- [x] Result-Pattern prüfen
- [x] Keine Exceptions

---

### Test 2: Graceful Degradation

**Datei:** `src/core/__tests__/graceful-degradation.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Runtime Error: Graceful Degradation", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should bootstrap even when Foundry APIs are partially missing", () => {
    const mockGame = createMockGame();
    // Teilweise APIs entfernen
    delete (mockGame as any).journal;
    delete (mockGame as any).actors;
    
    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    // Bootstrap sollte trotzdem funktionieren
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    
    // Sollte erfolgreich sein (Module sollte nicht crashen)
    expectResultOk(bootstrapResult);
  });

  it("should handle missing Hooks gracefully", () => {
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: undefined, // Hooks nicht verfügbar
    });

    // Bootstrap sollte trotzdem funktionieren
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    
    // Sollte erfolgreich sein oder Fehler zurückgeben, nicht crashen
    if (!bootstrapResult.ok) {
      expect(bootstrapResult.error).toBeDefined();
    }
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Teilweise fehlende APIs testen
- [x] Bootstrap-Robustheit prüfen
- [x] Keine Crashes

---

### Test 3: Result-Pattern-Konsistenz

**Datei:** `src/core/__tests__/result-pattern-consistency.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import type { Result } from "@/utils/result";

describe("Runtime Error: Result Pattern Consistency", () => {
  let cleanup: (() => void) | undefined;
  let container: any;

  beforeEach(async () => {
    vi.resetModules();
    
    cleanup = withFoundryGlobals({
      game: createMockGame(),
    });

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should never throw exceptions, always return Result", () => {
    // Alle Service-Methoden testen
    const services = [
      container.resolve(foundryGameServiceToken),
      container.resolve(cacheServiceToken),
      container.resolve(loggerToken),
    ];

    services.forEach(service => {
      // Alle öffentlichen Methoden testen
      Object.getOwnPropertyNames(Object.getPrototypeOf(service))
        .filter(name => name !== "constructor" && typeof service[name] === "function")
        .forEach(methodName => {
          try {
            const result = service[methodName]();
            // Sollte immer Result sein
            expect(result).toHaveProperty("ok");
            expect(typeof result.ok).toBe("boolean");
          } catch (error) {
            // Sollte nie Exception werfen
            fail(`Service method ${methodName} threw exception: ${error}`);
          }
        });
    });
  });

  it("should handle errors in Result pattern", () => {
    const gameService = container.resolve(foundryGameServiceToken);
    
    // Fehler provozieren (undefined journal)
    const mockGame = createMockGame();
    delete (mockGame as any).journal;
    
    vi.stubGlobal("game", mockGame);
    
    const result = gameService.getJournalEntries();
    
    // Sollte Result sein, nicht Exception
    expect(result).toHaveProperty("ok");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error");
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Alle Service-Methoden testen
- [x] Result-Pattern prüfen
- [x] Keine Exceptions

---

### Test 4: Error Recovery (Retry-Logik)

**Datei:** `src/services/retry/__tests__/retry-error-recovery.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RetryService } from "@/services/retry/retry-service";

describe("Runtime Error: Error Recovery (Retry)", () => {
  it("should retry on transient errors", async () => {
    let attemptCount = 0;
    const maxRetries = 3;
    
    const retryService = new RetryService();
    
    const failingFunction = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < maxRetries) {
        throw new Error("Transient error");
      }
      return { ok: true, value: "success" };
    });
    
    const result = await retryService.retry(failingFunction, {
      maxRetries,
      retryDelay: 10,
    });
    
    expectResultOk(result);
    expect(result.value).toBe("success");
    expect(failingFunction).toHaveBeenCalledTimes(maxRetries);
  });

  it("should fail after max retries", async () => {
    const maxRetries = 3;
    const retryService = new RetryService();
    
    const alwaysFailingFunction = vi.fn().mockImplementation(() => {
      throw new Error("Permanent error");
    });
    
    const result = await retryService.retry(alwaysFailingFunction, {
      maxRetries,
      retryDelay: 10,
    });
    
    expectResultErr(result);
    expect(alwaysFailingFunction).toHaveBeenCalledTimes(maxRetries);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Retry-Logik testen
- [x] Max Retries prüfen
- [x] Transiente vs. permanente Fehler

---

### Test 5: ModuleApi Error Handling

**Datei:** `src/core/api/__tests__/module-api-error-handling.test.ts`

**Besonderheit:** ModuleApi hat zwei Resolve-Methoden mit unterschiedlichem Error-Handling:
- `api.resolve()` - wirft Exceptions (für externe Module, exception-basiert)
- `api.resolveWithError()` - gibt Result zurück (Result-Pattern, nie Exceptions)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/composition-root";
import { ModuleApiInitializer } from "@/core/api/module-api-initializer";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("Runtime Error: ModuleApi Error Handling", () => {
  // Test 5.1: api.resolve() wirft Exceptions (erwartetes Verhalten)
  it("should throw exception when token is invalid", () => {
    const invalidToken = markAsApiSafe(createInjectionToken("InvalidService"));
    
    // api.resolve() SOLL Exception werfen (erwartetes Verhalten)
    expect(() => {
      api.resolve(invalidToken);
    }).toThrow();
  });

  // Test 5.2: api.resolveWithError() gibt Result zurück (nie Exceptions)
  it("should return Result with ok: false when token is invalid", () => {
    const invalidToken = markAsApiSafe(createInjectionToken("InvalidService"));
    
    // api.resolveWithError() SOLLTE nie Exception werfen
    const result = api.resolveWithError(invalidToken);
    
    expectResultErr(result);
    expect(result).toHaveProperty("ok");
    expect(result.ok).toBe(false);
  });

  // Test 5.3: Beide Methoden bei erfolgreicher Resolution
  it("should return same service instance on successful resolution", () => {
    const service1 = api.resolve(api.tokens.notificationCenterToken);
    const result2 = api.resolveWithError(api.tokens.notificationCenterToken);
    
    expectResultOk(result2);
    if (result2.ok) {
      expect(service1).toBe(result2.value);
    }
  });

  // Test 5.4: Konsistenz zwischen beiden Methoden
  it("should handle errors consistently (Exception vs Result)", () => {
    const invalidToken = markAsApiSafe(createInjectionToken("InvalidService"));
    
    // api.resolve() wirft Exception
    expect(() => {
      api.resolve(invalidToken);
    }).toThrow();
    
    // api.resolveWithError() gibt Result zurück
    const result = api.resolveWithError(invalidToken);
    expectResultErr(result);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] api.resolve() Exception-Verhalten testen
- [x] api.resolveWithError() Result-Pattern testen
- [x] Konsistenz zwischen beiden Methoden prüfen

---

## Referenzen

**Bestehende Tests:**
- `src/foundry/services/__tests__/` - Foundry Service Tests
- `src/services/retry/__tests__/` - Retry Service Tests
- `src/utils/result/__tests__/` - Result Pattern Tests

**Result Pattern:**
- `src/utils/result.ts` - Result-Implementierung
- `src/test/utils/test-helpers.ts` - `expectResultOk()` / `expectResultErr()`

---

## Checkliste

### Vorbereitung
- [ ] Result-Pattern verstanden
- [ ] `expectResultOk()` / `expectResultErr()` verstanden
- [ ] Fehlerbehandlung-Pattern verstanden

### Implementierung
- [x] Test 1: Foundry API-Fehler
- [x] Test 2: Graceful Degradation
- [x] Test 3: Result-Pattern-Konsistenz
- [x] Test 4: Error Recovery (Retry-Logik)
- [x] Test 5: ModuleApi Error Handling (resolve vs resolveWithError)

### Validierung
- [ ] Alle Tests laufen erfolgreich
- [ ] Keine Exceptions in Tests
- [ ] Result-Pattern konsistent

---

**Nächste Schritte:** Nach Implementierung zu `02-medium-priority/` weitergehen.

