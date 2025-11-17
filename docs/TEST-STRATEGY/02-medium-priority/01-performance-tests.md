# Performance Tests

**Status:** ⚠️ TODO  
**Priorität:** 🥈 Mittlere Priorität  
**Aufwand:** 2-3 Stunden  
**Tool:** Vitest Bench (bereits vorhanden)

---

## Übersicht

Performance-Tests prüfen die Ausführungszeit kritischer Operationen. Sie verhindern Performance-Regressionen bei Code-Änderungen.

**Warum wichtig:**
- Verhindert Performance-Regressionen
- Findet Bottlenecks frühzeitig
- Sichert akzeptable Antwortzeiten
- Verhindert UI-Freezes bei großen Datenmengen

---

## Was wird getestet?

### 1. Journal Cache Performance

**Szenario:** 10.000 Journal-Entries verarbeiten

**Schritte:**
1. 10.000 Journal-Entries erstellen
2. Cache-Performance messen
3. Hit-Rate prüfen

**Erwartetes Ergebnis:**
- Verarbeitung < 1 Sekunde
- Cache Hit-Rate > 80%

---

### 2. Port-Selection Performance

**Szenario:** 1000 Port-Selection-Requests

**Schritte:**
1. 1000 Port-Selection-Requests ausführen
2. Durchschnittliche Ausführungszeit messen

**Erwartetes Ergebnis:**
- Durchschnittliche Ausführungszeit < 1ms

---

### 3. Hook-Registrierung Performance

**Szenario:** 1000 Hooks registrieren

**Schritte:**
1. 1000 Hooks registrieren
2. Registrierungszeit messen

**Erwartetes Ergebnis:**
- Registrierungszeit < 100ms

---

### 4. Cache Hit-Rate

**Szenario:** Cache-Performance bei wiederholten Zugriffen

**Schritte:**
1. Cache mit Daten füllen
2. 1000 Zugriffe ausführen
3. Hit-Rate berechnen

**Erwartetes Ergebnis:**
- Hit-Rate > 80%

---

## Warum wichtig?

- ✅ Verhindert Performance-Regressionen
- ✅ Findet Bottlenecks frühzeitig
- ✅ Sichert akzeptable Antwortzeiten
- ✅ Verhindert UI-Freezes

---

## Implementierungsanleitung

### Voraussetzungen

**Tools:**
- ✅ Vitest Bench (bereits in Vitest enthalten)
- ✅ `bench()` Funktion

---

### Pattern 1: Vitest Bench

```typescript
import { bench, describe } from 'vitest';

describe('Performance Tests', () => {
  bench('should handle 10,000 entries', () => {
    processJournalEntries(largeDataset);
  }, { time: 1000 }); // 1 Sekunde Laufzeit
});
```

---

### Pattern 2: Performance-Messung

```typescript
bench('should process entries quickly', () => {
  const start = performance.now();
  processEntries(entries);
  const end = performance.now();
  const duration = end - start;
  
  expect(duration).toBeLessThan(1000); // < 1 Sekunde
});
```

---

## Detaillierte Implementierung

### Test 1: Journal Cache Performance

**Datei:** `src/services/cache/__tests__/cache-performance.test.ts`

```typescript
import { describe, bench, expect } from 'vitest';
import { ServiceContainer } from '@/di_infrastructure/container';
import { configureDependencies } from '@/di_infrastructure/configure-dependencies';
import { expectResultOk } from '@/test/utils/test-helpers';
import { cacheServiceToken } from '@/di_infrastructure/tokens';
import type { CacheService } from '@/services/cache/cache-service';
import { createMockJournalEntry } from '@/test/mocks/foundry';

describe('Performance: Journal Cache', () => {
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

  bench('should handle 10,000 entries', () => {
    const entries = Array.from({ length: 10000 }, (_, i) => 
      createMockJournalEntry({ id: `entry-${i}`, name: `Entry ${i}` })
    );

    entries.forEach((entry, i) => {
      const result = cacheService.set(`journal:${entry.id}`, entry);
      expectResultOk(result);
    });
  }, { time: 1000 }); // 1 Sekunde Laufzeit

  bench('should retrieve entries quickly', () => {
    // Cache mit 1000 Einträgen füllen
    for (let i = 0; i < 1000; i++) {
      cacheService.set(`key-${i}`, `value-${i}`);
    }

    // 1000 Zugriffe
    for (let i = 0; i < 1000; i++) {
      const result = cacheService.get(`key-${i}`);
      expectResultOk(result);
    }
  }, { time: 500 }); // 0.5 Sekunden Laufzeit
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Bench-Tests implementieren
- [ ] Performance-Schwellenwerte definieren
- [ ] Ergebnisse dokumentieren

---

### Test 2: Port-Selection Performance

**Datei:** `src/foundry/ports/__tests__/port-selector-performance.test.ts`

```typescript
import { describe, bench, expect, beforeEach, afterEach, vi } from 'vitest';
import { withFoundryGlobals } from '@/test/utils/test-helpers';
import { createMockGame } from '@/test/mocks/foundry';
import { PortSelector } from '@/foundry/ports/port-selector';
import { expectResultOk } from '@/test/utils/test-helpers';

describe('Performance: Port Selection', () => {
  let cleanup: (() => void) | undefined;
  let portSelector: PortSelector;

  beforeEach(() => {
    cleanup = withFoundryGlobals({
      game: createMockGame({ version: '13.350' }),
    });
    
    portSelector = new PortSelector();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
  });

  bench('should select port quickly', () => {
    const result = portSelector.getPort();
    expectResultOk(result);
  }, { time: 1000 });

  bench('should handle 1000 concurrent selections', () => {
    const results = Array.from({ length: 1000 }, () => 
      portSelector.getPort()
    );
    
    results.forEach(result => {
      expectResultOk(result);
    });
  }, { time: 2000 });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Bench-Tests implementieren
- [ ] Performance-Schwellenwerte definieren

---

### Test 3: Hook-Registrierung Performance

**Datei:** `src/core/hooks/__tests__/hook-registration-performance.test.ts`

```typescript
import { describe, bench, expect, beforeEach, afterEach, vi } from 'vitest';
import { withFoundryGlobals } from '@/test/utils/test-helpers';
import { createMockGame, createMockHooks } from '@/test/mocks/foundry';
import { CompositionRoot } from '@/core/bootstrap/composition-root';
import { expectResultOk } from '@/test/utils/test-helpers';

describe('Performance: Hook Registration', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  bench('should bootstrap quickly', () => {
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: createMockHooks(),
    });

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);
  }, { time: 1000 });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Bench-Tests implementieren
- [ ] Performance-Schwellenwerte definieren

---

### Test 4: Cache Hit-Rate

**Datei:** `src/services/cache/__tests__/cache-hit-rate.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceContainer } from '@/di_infrastructure/container';
import { configureDependencies } from '@/di_infrastructure/configure-dependencies';
import { expectResultOk } from '@/test/utils/test-helpers';
import { cacheServiceToken } from '@/di_infrastructure/tokens';
import type { CacheService } from '@/services/cache/cache-service';

describe('Performance: Cache Hit Rate', () => {
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

  it('should have high hit rate for repeated accesses', () => {
    // Cache mit 100 Einträgen füllen
    for (let i = 0; i < 100; i++) {
      cacheService.set(`key-${i}`, `value-${i}`);
    }

    let hits = 0;
    let misses = 0;

    // 1000 Zugriffe (wiederholte Keys)
    for (let i = 0; i < 1000; i++) {
      const key = `key-${i % 100}`; // Wiederholte Keys
      const result = cacheService.get(key);
      
      if (result.ok) {
        hits++;
      } else {
        misses++;
      }
    }

    const hitRate = hits / (hits + misses);
    expect(hitRate).toBeGreaterThan(0.8); // > 80% Hit-Rate
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Hit-Rate-Berechnung implementieren
- [ ] Schwellenwert prüfen (> 80%)

---

## Referenzen

**Vitest Bench:**
- [Vitest Bench Documentation](https://vitest.dev/guide/features.html#benchmarking)

**Bestehende Tests:**
- `src/services/cache/__tests__/` - Cache-Tests
- `src/foundry/ports/__tests__/` - Port-Tests

---

## Checkliste

### Vorbereitung
- [ ] Vitest Bench verstanden
- [ ] Performance-Schwellenwerte definiert
- [ ] Bench-Pattern verstanden

### Implementierung
- [ ] Test 1: Journal Cache Performance
- [ ] Test 2: Port-Selection Performance
- [ ] Test 3: Hook-Registrierung Performance
- [ ] Test 4: Cache Hit-Rate

### Validierung
- [ ] Bench-Tests laufen erfolgreich
- [ ] Performance-Schwellenwerte eingehalten
- [ ] Ergebnisse dokumentiert

---

**Nächste Schritte:** Nach Implementierung zu `02-property-based-tests.md` weitergehen.

