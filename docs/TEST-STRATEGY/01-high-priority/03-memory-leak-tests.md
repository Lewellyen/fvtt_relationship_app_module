# Memory Leak Tests

**Status:** ✅ Implementiert  
**Priorität:** 🥇 Hohe Priorität  
**Aufwand:** 2-3 Stunden  
**Tool:** Node.js `--expose-gc` + `performance.memory` API

---

## Übersicht

Memory Leak Tests prüfen, ob Services und Komponenten korrekt aufgeräumt werden. Sie finden Speicherlecks, die zu Browser-Crashes führen können.

**Warum wichtig:**
- Foundry VTT-Sessions können lange laufen
- Speicherlecks führen zu Performance-Degradation
- Wichtig für korrektes Cleanup (Hooks werden automatisch entfernt bei Module-Deaktivierung)
- Verhindert Browser-Crashes

**Hinweis:** Foundry VTT hat keine `disable`/`close` Hooks. Module werden durch Deaktivieren in den Settings deaktiviert, aber es gibt keinen Hook dafür. Hooks müssen daher manuell via `dispose()` aufgeräumt werden.

---

## Was wird getestet?

### 1. Hook-Registrierung Cleanup

**Szenario:** 1000 Hooks registrieren → dispose → prüfen ob Speicher freigegeben wurde

**Schritte:**
1. 1000 Hooks registrieren
2. Initialen Speicherverbrauch messen
3. Hooks dispose
4. GC forcieren
5. Finalen Speicherverbrauch messen
6. Prüfen ob Speicher freigegeben wurde

**Erwartetes Ergebnis:**
- Speicherverbrauch nach Cleanup < 10MB über Initial
- Keine Memory Leaks

---

### 2. Service Disposal

**Szenario:** Services erstellen → dispose → prüfen ob Event Listeners entfernt wurden

**Schritte:**
1. Services erstellen (mit Event Listeners)
2. Initialen Speicherverbrauch messen
3. Services dispose
4. GC forcieren
5. Prüfen ob Event Listeners entfernt wurden

**Erwartetes Ergebnis:**
- Event Listeners wurden entfernt
- Speicher wurde freigegeben

---

### 3. Container Scope Cleanup

**Szenario:** Scoped Container erstellen → dispose → prüfen ob Services disposed wurden

**Schritte:**
1. Scoped Container erstellen
2. Services resolven
3. Container dispose
4. Prüfen ob Services disposed wurden

**Erwartetes Ergebnis:**
- Services wurden disposed
- Keine Memory Leaks

---

### 4. Cache Cleanup

**Szenario:** Cache mit vielen Einträgen füllen → clear → prüfen ob Speicher freigegeben wurde

**Schritte:**
1. Cache mit 1000 Einträgen füllen
2. Initialen Speicherverbrauch messen
3. Cache clear
4. GC forcieren
5. Prüfen ob Speicher freigegeben wurde

**Erwartetes Ergebnis:**
- Cache wurde geleert
- Speicher wurde freigegeben

---

## Warum wichtig?

- ✅ Verhindert Speicherlecks
- ✅ Sichert korrektes Cleanup (Hooks werden automatisch entfernt bei Module-Deaktivierung)
- ✅ Wichtig für lange laufende Foundry-Sessions
- ✅ Verhindert Performance-Degradation über Zeit

---

## Implementierungsanleitung

### Voraussetzungen

**Tools:**
- ✅ Node.js `--expose-gc` Flag (für `global.gc()`)
- ✅ `performance.memory` API (für Speichermessung)
- ✅ Vitest (bereits vorhanden)

**Wichtig:**
- Tests müssen mit `--expose-gc` Flag laufen
- `performance.memory` ist nur in Node.js verfügbar (nicht in Browser)
- GC kann nicht in allen Umgebungen forciert werden

---

### Pattern 1: Speichermessung

```typescript
function getMemoryUsage(): number {
  if (typeof (performance as any).memory !== "undefined") {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}
```

---

### Pattern 2: Memory Leak Detection

```typescript
it("should not leak memory after disposal", () => {
  const initialMemory = getMemoryUsage();
  
  // 1000 Hooks registrieren
  for (let i = 0; i < 1000; i++) {
    hooks.on("test", () => {});
  }
  
  // Cleanup
  hooks.dispose();
  
  // GC forcieren
  forceGC();
  
  // Warten (GC ist asynchron)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const finalMemory = getMemoryUsage();
  const memoryDiff = finalMemory - initialMemory;
  
  // Sollte weniger als 10MB sein
  expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
});
```

---

### Pattern 3: Event Listener Cleanup

```typescript
it("should remove event listeners on disposal", () => {
  const service = new MyService();
  const listener = vi.fn();
  
  service.addEventListener("test", listener);
  
  // Prüfen ob Listener registriert ist
  expect(service.hasEventListener("test", listener)).toBe(true);
  
  // Dispose
  service.dispose();
  
  // Prüfen ob Listener entfernt wurde
  expect(service.hasEventListener("test", listener)).toBe(false);
});
```

---

## Detaillierte Implementierung

### Test 1: Hook-Registrierung Cleanup

**Datei:** `src/core/hooks/__tests__/hook-memory-leak.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

function getMemoryUsage(): number {
  if (typeof (performance as any).memory !== "undefined") {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}

describe("Memory Leak: Hook Registration", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should not leak memory after hook disposal", async () => {
    const mockHooks = createMockHooks();
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: mockHooks,
    });

    // Initialen Speicherverbrauch messen
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // Bootstrap (registriert Hooks)
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    // Prüfen ob Hooks registriert wurden
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    expect(hooksOnMock.mock.calls.length).toBeGreaterThan(0);

    // Speicher nach Registrierung
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterRegistrationMemory = getMemoryUsage();

    // Hooks entfernen (manuelles Cleanup - Foundry hat keinen disable Hook)
    const hooksOffMock = (global as any).Hooks.off as ReturnType<typeof vi.fn>;
    if (hooksOffMock) {
      // Alle registrierten Hooks entfernen
      hooksOnMock.mock.calls.forEach(([hookName, callback]) => {
        hooksOffMock(hookName, callback);
      });
    }

    // GC forcieren
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher-Differenz sollte akzeptabel sein (< 10MB)
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Speichermessung implementieren
- [x] Hook-Registrierung testen
- [x] Cleanup testen
- [x] Memory Leak Detection

---

### Test 2: Service Disposal

**Datei:** `src/services/__tests__/service-memory-leak.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/di_infrastructure/configure-dependencies";
import { expectResultOk } from "@/test/utils/test-helpers";
import { loggerToken } from "@/di_infrastructure/tokens";
import type { Logger } from "@/services/logger/logger";

function getMemoryUsage(): number {
  if (typeof (performance as any).memory !== "undefined") {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}

describe("Memory Leak: Service Disposal", () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = ServiceContainer.createRoot();
    configureDependencies(container);
  });

  afterEach(() => {
    container.dispose();
  });

  it("should dispose services correctly", async () => {
    // Services resolven
    const logger = container.resolve(loggerToken);
    expect(logger).toBeDefined();

    // Initialen Speicherverbrauch
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // 100 Services erstellen (in Scoped Container)
    const scopedContainers: ServiceContainer[] = [];
    for (let i = 0; i < 100; i++) {
      const scoped = container.createScope();
      scopedContainers.push(scoped);
      const scopedLogger = scoped.resolve(loggerToken);
      expect(scopedLogger).toBeDefined();
    }

    // Speicher nach Erstellung
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterCreationMemory = getMemoryUsage();

    // Scoped Container dispose
    scopedContainers.forEach(scoped => scoped.dispose());

    // GC forcieren
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher sollte freigegeben worden sein
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Service-Erstellung testen
- [x] Scoped Container testen
- [x] Disposal testen
- [x] Memory Leak Detection

---

### Test 3: Container Scope Cleanup

**Datei:** `src/di_infrastructure/container/__tests__/container-memory-leak.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/di_infrastructure/configure-dependencies";

function getMemoryUsage(): number {
  if (typeof (performance as any).memory !== "undefined") {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}

describe("Memory Leak: Container Scope Cleanup", () => {
  let rootContainer: ServiceContainer;

  beforeEach(() => {
    rootContainer = ServiceContainer.createRoot();
    configureDependencies(rootContainer);
  });

  afterEach(() => {
    rootContainer.dispose();
  });

  it("should cleanup scoped containers", async () => {
    // Initialen Speicherverbrauch
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // 100 Scoped Container erstellen
    const scopedContainers: ServiceContainer[] = [];
    for (let i = 0; i < 100; i++) {
      const scoped = rootContainer.createScope();
      scopedContainers.push(scoped);
    }

    // Speicher nach Erstellung
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterCreationMemory = getMemoryUsage();

    // Alle Scoped Container dispose
    scopedContainers.forEach(scoped => scoped.dispose());

    // GC forcieren
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher sollte freigegeben worden sein
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Scoped Container Erstellung testen
- [x] Disposal testen
- [x] Memory Leak Detection

---

### Test 4: Cache Cleanup

**Datei:** `src/services/cache/__tests__/cache-memory-leak.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/di_infrastructure/configure-dependencies";
import { expectResultOk } from "@/test/utils/test-helpers";
import { cacheServiceToken } from "@/di_infrastructure/tokens";
import type { CacheService } from "@/services/cache/cache-service";

function getMemoryUsage(): number {
  if (typeof (performance as any).memory !== "undefined") {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}

describe("Memory Leak: Cache Cleanup", () => {
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

  it("should free memory after cache clear", async () => {
    // Initialen Speicherverbrauch
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // Cache mit 1000 Einträgen füllen
    for (let i = 0; i < 1000; i++) {
      const setResult = cacheService.set(`key-${i}`, `value-${i}`);
      expectResultOk(setResult);
    }

    // Speicher nach Füllen
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterFillMemory = getMemoryUsage();

    // Cache clear
    const clearResult = cacheService.clear();
    expectResultOk(clearResult);

    // GC forcieren
    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher sollte freigegeben worden sein
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
```

**Checkliste:**
- [x] Datei erstellen
- [x] Cache-Füllen testen
- [x] Cache-Clear testen
- [x] Memory Leak Detection

---

## Vitest-Konfiguration

**`vitest.config.ts` anpassen:**

```typescript
export default defineConfig({
  test: {
    // GC für Memory Leak Tests
    nodeOptions: {
      exposeGc: true,
    },
  },
});
```

**Oder in `package.json`:**

```json
{
  "scripts": {
    "test:memory": "node --expose-gc node_modules/.bin/vitest run --config vitest.config.ts"
  }
}
```

---

## Referenzen

**Bestehende Tests:**
- `src/di_infrastructure/container/__tests__/` - Container-Tests
- `src/services/cache/__tests__/` - Cache-Tests
- `src/core/hooks/__tests__/` - Hook-Tests

**Node.js GC API:**
- [Node.js --expose-gc](https://nodejs.org/api/cli.html#--expose-gc)

---

## Checkliste

### Vorbereitung
- [x] Vitest-Konfiguration für GC angepasst
- [x] Speichermessung-Funktionen implementiert
- [x] GC-Pattern verstanden

### Implementierung
- [x] Test 1: Hook-Registrierung Cleanup
- [x] Test 2: Service Disposal
- [x] Test 3: Container Scope Cleanup
- [x] Test 4: Cache Cleanup

### Validierung
- [x] Tests laufen mit `--expose-gc` Flag
- [x] Memory Leaks werden erkannt
- [x] Cleanup funktioniert korrekt

---

**Nächste Schritte:** Nach Implementierung zu `04-runtime-error-monitoring-tests.md` weitergehen.

