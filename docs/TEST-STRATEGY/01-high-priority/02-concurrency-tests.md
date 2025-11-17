# Concurrency Tests

**Status:** ⚠️ TODO  
**Priorität:** 🥇 Hohe Priorität  
**Aufwand:** 2-4 Stunden  
**Tool:** Vitest (bereits vorhanden) + Node.js Worker Threads

---

## Übersicht

Concurrency-Tests prüfen das Verhalten bei gleichzeitigen Zugriffen auf geteilte Ressourcen. Sie finden Race Conditions, Deadlocks und Livelocks, die zu undefiniertem Verhalten führen können.

**Warum kritisch:**
- Foundry VTT ist eine Multi-User-Umgebung
- Gleichzeitige Hook-Fires sind möglich
- Cache-Zugriffe können parallel erfolgen
- Port-Selection kann unter Last getestet werden

---

## Was wird getestet?

### 1. Parallele Port-Selection

**Szenario:** Mehrere gleichzeitige Requests für Port-Selection

**Schritte:**
1. Mehrere parallele `getPort()` Aufrufe
2. Prüfen ob immer derselbe Port zurückgegeben wird
3. Prüfen ob keine Race Conditions auftreten

**Erwartetes Ergebnis:**
- Alle Requests erhalten denselben Port
- Keine Race Conditions
- Thread-Safe

---

### 2. Parallele Cache-Zugriffe

**Szenario:** Gleichzeitige Cache-Reads und -Writes

**Schritte:**
1. Mehrere parallele `cache.get()` Aufrufe
2. Gleichzeitige `cache.set()` Aufrufe
3. Prüfen ob Cache konsistent bleibt

**Erwartetes Ergebnis:**
- Cache bleibt konsistent
- Keine Race Conditions
- Alle Reads erhalten korrekte Werte

---

### 3. Gleichzeitige Hook-Registrierungen

**Szenario:** Mehrere Hooks werden gleichzeitig registriert

**Schritte:**
1. Mehrere parallele `Hooks.on()` Aufrufe
2. Prüfen ob alle Hooks registriert wurden
3. Prüfen ob keine Duplikate entstehen

**Erwartetes Ergebnis:**
- Alle Hooks werden registriert
- Keine Duplikate
- Thread-Safe

---

### 4. Parallele Journal-Zugriffe

**Szenario:** Gleichzeitige Journal-Entry-Zugriffe

**Schritte:**
1. Mehrere parallele `getJournalEntries()` Aufrufe
2. Prüfen ob alle Requests erfolgreich sind
3. Prüfen ob Daten konsistent sind

**Erwartetes Ergebnis:**
- Alle Requests erfolgreich
- Daten konsistent
- Keine Race Conditions

---

## Warum wichtig?

- ✅ Verhindert Race Conditions
- ✅ Sichert korrektes Verhalten bei gleichzeitigen Requests
- ✅ Findet Deadlocks und Livelocks
- ✅ Kritisch für Multi-User-Szenarien in Foundry

---

## Implementierungsanleitung

### Voraussetzungen

**Tools:**
- ✅ Vitest (bereits vorhanden)
- ✅ `it.concurrent()` für parallele Tests
- ✅ `Promise.all()` für gleichzeitige Ausführung
- ✅ Node.js Worker Threads (optional, für echte Parallelität)

---

### Pattern 1: Parallele Test-Ausführung

**Vitest `it.concurrent()`:**

```typescript
describe("Concurrency Tests", () => {
  it.concurrent("should handle concurrent requests", async () => {
    // Test wird parallel zu anderen Tests ausgeführt
  });
});
```

**Wichtig:**
- `it.concurrent()` führt Tests parallel aus
- Tests müssen isoliert sein (keine geteilten Zustände)
- Cleanup muss in jedem Test erfolgen

---

### Pattern 2: Promise.all für gleichzeitige Aufrufe

```typescript
it("should handle concurrent port selection", async () => {
  const promises = Array.from({ length: 10 }, () => 
    portSelector.getPort()
  );
  
  const results = await Promise.all(promises);
  
  // Alle Ergebnisse sollten gleich sein
  const firstResult = results[0];
  expect(results.every(r => r.value === firstResult.value)).toBe(true);
});
```

---

### Pattern 3: Race Condition Detection

```typescript
it("should not have race conditions in cache", async () => {
  const cache = container.resolve(cacheToken);
  
  // 100 parallele Reads und Writes
  const promises = Array.from({ length: 100 }, (_, i) => {
    if (i % 2 === 0) {
      return cache.get(`key-${i}`);
    } else {
      return cache.set(`key-${i}`, `value-${i}`);
    }
  });
  
  const results = await Promise.all(promises);
  
  // Prüfen ob alle erfolgreich waren
  expect(results.every(r => r.ok)).toBe(true);
  
  // Prüfen ob Cache konsistent ist
  const getResult = cache.get("key-0");
  expectResultOk(getResult);
});
```

---

## Detaillierte Implementierung

### Test 1: Parallele Port-Selection

**Datei:** `src/foundry/ports/__tests__/port-selector-concurrency.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { PortSelector } from "@/foundry/ports/port-selector";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Concurrency: Port Selection", () => {
  let cleanup: (() => void) | undefined;
  let portSelector: PortSelector;

  beforeEach(() => {
    cleanup = withFoundryGlobals({
      game: createMockGame({ version: "13.350" }),
    });
    
    portSelector = new PortSelector();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
  });

  it.concurrent("should return same port for concurrent requests", async () => {
    // 10 parallele Requests
    const promises = Array.from({ length: 10 }, () => 
      portSelector.getPort()
    );
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    results.forEach(result => {
      expectResultOk(result);
    });
    
    // Alle sollten denselben Port zurückgeben
    const firstPort = results[0].value;
    expect(results.every(r => r.value === firstPort)).toBe(true);
  });

  it.concurrent("should handle 100 concurrent requests", async () => {
    const promises = Array.from({ length: 100 }, () => 
      portSelector.getPort()
    );
    
    const results = await Promise.all(promises);
    
    // Alle erfolgreich
    expect(results.every(r => r.ok)).toBe(true);
    
    // Alle gleich
    const firstPort = results[0].value;
    expect(results.every(r => r.value === firstPort)).toBe(true);
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Parallele Requests implementieren
- [ ] Konsistenz prüfen
- [ ] Edge Cases testen (100+ Requests)

---

### Test 2: Parallele Cache-Zugriffe

**Datei:** `src/services/cache/__tests__/cache-concurrency.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/di_infrastructure/configure-dependencies";
import { expectResultOk } from "@/test/utils/test-helpers";
import { cacheServiceToken } from "@/di_infrastructure/tokens";
import type { CacheService } from "@/services/cache/cache-service";

describe("Concurrency: Cache Access", () => {
  let container: ServiceContainer;
  let cacheService: CacheService;

  beforeEach(() => {
    container = ServiceContainer.createRoot();
    configureDependencies(container);
    cacheService = container.resolve(cacheServiceToken);
  });

  afterEach(() => {
    container.dispose();
  });

  it.concurrent("should handle concurrent reads", async () => {
    // Cache mit Daten füllen
    const setResult = cacheService.set("test-key", "test-value");
    expectResultOk(setResult);

    // 50 parallele Reads
    const promises = Array.from({ length: 50 }, () => 
      cacheService.get("test-key")
    );
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    results.forEach(result => {
      expectResultOk(result);
      expect(result.value).toBe("test-value");
    });
  });

  it.concurrent("should handle concurrent writes", async () => {
    // 50 parallele Writes (gleicher Key)
    const promises = Array.from({ length: 50 }, (_, i) => 
      cacheService.set("test-key", `value-${i}`)
    );
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    expect(results.every(r => r.ok)).toBe(true);
    
    // Finaler Wert sollte konsistent sein
    const getResult = cacheService.get("test-key");
    expectResultOk(getResult);
    // Wert sollte einer der geschriebenen Werte sein
    expect(getResult.value).toBeDefined();
  });

  it.concurrent("should handle concurrent read-write mix", async () => {
    // Initialer Wert
    cacheService.set("test-key", "initial");

    // 50 Reads und 50 Writes parallel
    const promises = Array.from({ length: 100 }, (_, i) => {
      if (i % 2 === 0) {
        return cacheService.get("test-key");
      } else {
        return cacheService.set("test-key", `value-${i}`);
      }
    });
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    expect(results.every(r => r.ok)).toBe(true);
    
    // Cache sollte konsistent sein
    const finalGetResult = cacheService.get("test-key");
    expectResultOk(finalGetResult);
    expect(finalGetResult.value).toBeDefined();
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Parallele Reads testen
- [ ] Parallele Writes testen
- [ ] Read-Write-Mix testen
- [ ] Konsistenz prüfen

---

### Test 3: Gleichzeitige Hook-Registrierungen

**Datei:** `src/core/hooks/__tests__/hook-registration-concurrency.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Concurrency: Hook Registration", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.concurrent("should register all hooks without duplicates", async () => {
    const mockHooks = createMockHooks();
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: mockHooks,
    });

    // Mehrere parallele Bootstrap-Versuche
    const promises = Array.from({ length: 5 }, async () => {
      const root = new CompositionRoot();
      return root.bootstrap();
    });
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    results.forEach(result => {
      expectResultOk(result);
    });
    
    // Prüfen ob Hooks registriert wurden (ohne Duplikate)
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const hookCalls = hooksOnMock.mock.calls;
    
    // Jeder Hook sollte registriert sein
    const initCalls = hookCalls.filter(([hookName]) => hookName === "init");
    const readyCalls = hookCalls.filter(([hookName]) => hookName === "ready");
    
    // Sollte mindestens einmal registriert sein
    expect(initCalls.length).toBeGreaterThan(0);
    expect(readyCalls.length).toBeGreaterThan(0);
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Parallele Bootstrap-Versuche testen
- [ ] Hook-Registrierung prüfen
- [ ] Duplikate vermeiden

---

### Test 4: Parallele Journal-Zugriffe

**Datei:** `src/foundry/services/__tests__/journal-service-concurrency.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { foundryGameServiceToken } from "@/di_infrastructure/tokens";
import type { FoundryGameService } from "@/foundry/services/foundry-game-service";

describe("Concurrency: Journal Access", () => {
  let cleanup: (() => void) | undefined;
  let container: any;
  let journalService: FoundryGameService;

  beforeEach(async () => {
    vi.resetModules();
    
    const mockGame = createMockGame();
    const mockEntries = Array.from({ length: 10 }, (_, i) => 
      createMockJournalEntry({ id: `entry-${i}`, name: `Entry ${i}` })
    );
    
    if (mockGame.journal) {
      mockGame.journal.contents = mockEntries;
      mockGame.journal.get = vi.fn((id: string) => 
        mockEntries.find(e => e.id === id)
      );
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: createMockHooks(),
    });

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;
    
    journalService = container.resolve(foundryGameServiceToken);
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.concurrent("should handle concurrent journal entry requests", async () => {
    // 50 parallele Requests
    const promises = Array.from({ length: 50 }, () => 
      journalService.getJournalEntries()
    );
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    results.forEach(result => {
      expectResultOk(result);
    });
    
    // Alle sollten dieselben Daten zurückgeben
    const firstEntries = results[0].value;
    expect(results.every(r => r.value.length === firstEntries.length)).toBe(true);
  });

  it.concurrent("should handle concurrent single entry requests", async () => {
    // 50 parallele Requests für denselben Entry
    const promises = Array.from({ length: 50 }, () => 
      journalService.getJournalEntry("entry-0")
    );
    
    const results = await Promise.all(promises);
    
    // Alle sollten erfolgreich sein
    results.forEach(result => {
      expectResultOk(result);
    });
    
    // Alle sollten denselben Entry zurückgeben
    const firstEntry = results[0].value;
    expect(results.every(r => r.value.id === firstEntry.id)).toBe(true);
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Parallele Journal-Requests testen
- [ ] Konsistenz prüfen
- [ ] Edge Cases testen

---

## Referenzen

**Bestehende Tests:**
- `src/foundry/ports/__tests__/port-selector.test.ts` - Port-Selection-Logik
- `src/services/cache/__tests__/cache-service.test.ts` - Cache-Logik
- `src/core/hooks/__tests__/` - Hook-Registrierung

**Vitest Dokumentation:**
- [Vitest Concurrent Tests](https://vitest.dev/guide/features.html#concurrent)

---

## Checkliste

### Vorbereitung
- [ ] Vitest `it.concurrent()` verstanden
- [ ] Promise.all Pattern verstanden
- [ ] Race Condition Detection verstanden

### Implementierung
- [ ] Test 1: Parallele Port-Selection
- [ ] Test 2: Parallele Cache-Zugriffe
- [ ] Test 3: Gleichzeitige Hook-Registrierungen
- [ ] Test 4: Parallele Journal-Zugriffe

### Validierung
- [ ] Alle Tests laufen erfolgreich
- [ ] Tests sind isoliert
- [ ] Keine Race Conditions erkannt

---

**Nächste Schritte:** Nach Implementierung zu `03-memory-leak-tests.md` weitergehen.

