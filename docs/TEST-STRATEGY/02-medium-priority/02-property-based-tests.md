# Property-Based Tests

**Status:** ⚠️ TODO  
**Priorität:** 🥈 Mittlere Priorität  
**Aufwand:** 3-4 Stunden  
**Tool:** fast-check (neu installieren)

---

## Übersicht

Property-Based Tests prüfen Verhalten mit zufälligen Inputs. Sie finden automatisch Edge Cases und testen mathematische Eigenschaften (Idempotenz, Kommutativität).

**Warum wichtig:**
- Findet unerwartete Edge Cases automatisch
- Testet viele Inputs ohne manuelle Test-Cases
- Sichert mathematische Eigenschaften
- Findet Bugs, die manuelle Tests übersehen

---

## Was wird getestet?

### 1. Input-Validation Properties

**Szenario:** Zufällige Strings für Input-Validation

**Schritte:**
1. Zufällige Strings generieren
2. `validateJournalId()` aufrufen
3. Prüfen ob Idempotenz gilt: `f(f(x)) === f(x)`

**Erwartetes Ergebnis:**
- Idempotenz gilt
- Nie Exceptions
- Konsistentes Verhalten

---

### 2. Cache Properties

**Szenario:** Zufällige Cache-Operationen

**Schritte:**
1. Zufällige Cache-Operationen generieren
2. Prüfen ob Konsistenz gilt
3. Prüfen ob Idempotenz gilt

**Erwartetes Ergebnis:**
- Cache bleibt konsistent
- Idempotenz gilt
- Keine Race Conditions

---

### 3. Result-Pattern Properties

**Szenario:** Zufällige Service-Aufrufe

**Schritte:**
1. Zufällige Service-Aufrufe generieren
2. Prüfen ob immer Result zurückgegeben wird
3. Prüfen ob nie Exceptions geworfen werden

**Erwartetes Ergebnis:**
- Immer Result
- Nie Exceptions
- Konsistentes Verhalten

---

## Warum wichtig?

- ✅ Findet Edge Cases automatisch
- ✅ Testet viele Inputs
- ✅ Sichert mathematische Eigenschaften
- ✅ Findet Bugs, die manuelle Tests übersehen

---

## Implementierungsanleitung

### Voraussetzungen

**Installation:**
```bash
npm install --save-dev fast-check
```

**Tools:**
- ✅ fast-check (neu installieren)
- ✅ Vitest (bereits vorhanden)

---

### Pattern 1: Property-Based Test

```typescript
import { fc, test } from 'fast-check';
import { validateJournalId } from '@/foundry/validation/input-validators';

describe('Property-Based Tests', () => {
  test.prop([fc.string()])(
    'validateJournalId should be idempotent',
    (input) => {
      const result1 = validateJournalId(input);
      const result2 = validateJournalId(input);
      return result1.ok === result2.ok; // Sollte immer gleich sein
    }
  );
});
```

---

### Pattern 2: Idempotenz-Test

```typescript
test.prop([fc.string()])(
  'should be idempotent',
  (input) => {
    const result1 = process(input);
    const result2 = process(result1);
    return result1 === result2; // f(f(x)) === f(x)
  }
);
```

---

### Pattern 3: Never-Throw-Test

```typescript
test.prop([fc.string()])(
  'should never throw',
  (input) => {
    const result = validateJournalId(input);
    return typeof result.ok === 'boolean'; // Sollte nie crashen
  }
);
```

---

## Detaillierte Implementierung

### Test 1: Input-Validation Properties

**Datei:** `src/foundry/validation/__tests__/input-validators-property.test.ts`

```typescript
import { describe } from 'vitest';
import { fc, test } from 'fast-check';
import { validateJournalId } from '@/foundry/validation/input-validators';

describe('Property-Based: Input Validation', () => {
  test.prop([fc.string()])(
    'validateJournalId should be idempotent',
    (input) => {
      const result1 = validateJournalId(input);
      const result2 = validateJournalId(input);
      // Sollte immer dasselbe Ergebnis liefern
      return result1.ok === result2.ok;
    }
  );

  test.prop([fc.string()])(
    'validateJournalId should never throw',
    (input) => {
      try {
        const result = validateJournalId(input);
        return typeof result.ok === 'boolean';
      } catch (error) {
        return false; // Sollte nie Exception werfen
      }
    }
  );

  test.prop([fc.string()])(
    'validateJournalId should handle any string',
    (input) => {
      const result = validateJournalId(input);
      // Sollte immer Result zurückgeben
      return typeof result.ok === 'boolean' && 
             (result.ok ? typeof result.value === 'string' : typeof result.error === 'object');
    }
  );

  test.prop([fc.string(), fc.string()])(
    'validateJournalId should be deterministic',
    (input1, input2) => {
      if (input1 === input2) {
        const result1 = validateJournalId(input1);
        const result2 = validateJournalId(input2);
        return result1.ok === result2.ok;
      }
      return true; // Verschiedene Inputs können verschiedene Ergebnisse haben
    }
  );
});
```

**Checkliste:**
- [ ] fast-check installieren
- [ ] Datei erstellen
- [ ] Idempotenz-Test implementieren
- [ ] Never-Throw-Test implementieren
- [ ] Determinismus-Test implementieren

---

### Test 2: Cache Properties

**Datei:** `src/services/cache/__tests__/cache-properties.test.ts`

```typescript
import { describe } from 'vitest';
import { fc, test } from 'fast-check';
import { ServiceContainer } from '@/di_infrastructure/container';
import { configureDependencies } from '@/di_infrastructure/configure-dependencies';
import { cacheServiceToken } from '@/di_infrastructure/tokens';
import type { CacheService } from '@/services/cache/cache-service';

describe('Property-Based: Cache Properties', () => {
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

  test.prop([fc.string(), fc.anything()])(
    'cache.set then get should return same value',
    (key, value) => {
      const setResult = cacheService.set(key, value);
      if (!setResult.ok) return false;

      const getResult = cacheService.get(key);
      if (!getResult.ok) return false;

      // Sollte denselben Wert zurückgeben
      return JSON.stringify(getResult.value) === JSON.stringify(value);
    }
  );

  test.prop([fc.string(), fc.anything(), fc.anything()])(
    'cache.set should be idempotent',
    (key, value1, value2) => {
      cacheService.set(key, value1);
      const result1 = cacheService.get(key);
      
      cacheService.set(key, value2);
      const result2 = cacheService.get(key);
      
      // Zweiter Set sollte zweiten Wert zurückgeben
      if (!result1.ok || !result2.ok) return false;
      return JSON.stringify(result2.value) === JSON.stringify(value2);
    }
  );

  test.prop([fc.string()])(
    'cache.get on non-existent key should return error',
    (key) => {
      // Key nicht setzen
      const result = cacheService.get(key);
      return !result.ok; // Sollte Fehler sein
    }
  );
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Set-Get-Konsistenz testen
- [ ] Idempotenz testen
- [ ] Nicht-existente Keys testen

---

### Test 3: Result-Pattern Properties

**Datei:** `src/core/__tests__/result-pattern-properties.test.ts`

```typescript
import { describe } from 'vitest';
import { fc, test } from 'fast-check';
import { withFoundryGlobals } from '@/test/utils/test-helpers';
import { createMockGame } from '@/test/mocks/foundry';
import { CompositionRoot } from '@/core/bootstrap/composition-root';
import { expectResultOk } from '@/test/utils/test-helpers';
import { foundryGameServiceToken } from '@/di_infrastructure/tokens';
import type { FoundryGameService } from '@/foundry/services/foundry-game-service';

describe('Property-Based: Result Pattern', () => {
  test.prop([fc.string()])(
    'service methods should always return Result',
    (journalId) => {
      const cleanup = withFoundryGlobals({
        game: createMockGame(),
      });

      try {
        const root = new CompositionRoot();
        const bootstrapResult = root.bootstrap();
        if (!bootstrapResult.ok) {
          cleanup();
          return false;
        }

        const containerResult = root.getContainer();
        if (!containerResult.ok) {
          cleanup();
          return false;
        }

        const container = containerResult.value;
        const gameService = container.resolve(foundryGameServiceToken);
        
        const result = gameService.getJournalEntry(journalId);
        
        cleanup();
        
        // Sollte immer Result sein
        return typeof result.ok === 'boolean' &&
               (result.ok ? result.value !== undefined : result.error !== undefined);
      } catch (error) {
        cleanup();
        return false; // Sollte nie Exception werfen
      }
    }
  );
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Result-Pattern-Konsistenz testen
- [ ] Never-Throw testen
- [ ] Verschiedene Inputs testen

---

## Referenzen

**fast-check:**
- [fast-check Documentation](https://github.com/dubzzz/fast-check)

**Bestehende Tests:**
- `src/foundry/validation/__tests__/` - Input-Validation-Tests
- `src/services/cache/__tests__/` - Cache-Tests

---

## Checkliste

### Vorbereitung
- [ ] fast-check installiert
- [ ] Property-Based Testing verstanden
- [ ] Idempotenz-Konzept verstanden

### Implementierung
- [ ] Test 1: Input-Validation Properties
- [ ] Test 2: Cache Properties
- [ ] Test 3: Result-Pattern Properties

### Validierung
- [ ] Tests laufen erfolgreich
- [ ] Edge Cases werden gefunden
- [ ] Properties werden validiert

---

**Nächste Schritte:** Nach Implementierung zu `03-extended-security-tests.md` weitergehen.

