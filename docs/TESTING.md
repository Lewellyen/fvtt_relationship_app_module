# Testing Guide

Beziehungsnetzwerke für Foundry VTT - Test-Dokumentation

---

## Running Tests

### Alle Tests ausführen

```bash
# Watch-Modus (empfohlen für Entwicklung)
npm test

# Single Run (für CI/CD)
npm run test:run

# Mit Coverage-Report
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Spezifische Tests ausführen

```bash
# Nur Unit Tests
npm test -- src/services

# Nur Integration Tests
npm test -- src/__tests__/integration

# Spezifische Test-Datei
npm test -- container.test.ts
```

---

## Coverage Requirements

Das Projekt hat definierte Mindest-Coverage-Anforderungen:

| Metrik | Ziel | Aktuell (v0.10.0) |
|--------|------|------------------|
| Lines | 100% | ✅ 100% |
| Functions | 100% | ✅ 100% |
| Branches | 100% | ✅ 100% |
| Statements | 100% | ✅ 100% |
| Type Coverage | 100% | ✅ 100% (8617/8617) |

**Status:** ✅ Alle Coverage-Ziele erreicht!

**Überprüfung:**

```bash
npm run test:coverage
```

Coverage-Report wird generiert in `coverage/index.html`.

---

## Test Structure

Tests sind co-located mit dem Source-Code:

```
src/
├── __tests__/                    # Integration Tests
│   └── integration/
│       └── full-bootstrap.test.ts
├── services/
│   ├── consolelogger.ts
│   └── __tests__/
│       └── consolelogger.test.ts  # Unit Test
├── di_infrastructure/
│   ├── container.ts
│   └── __tests__/
│       ├── container.test.ts       # Unit Test
│       └── container-edge-cases.test.ts  # Edge Cases
└── test/
    ├── mocks/                     # Shared Mocks
    ├── setup.ts                   # Test Setup
    └── utils/                     # Test Utilities
```

---

## Writing Tests

### Unit Tests

Unit Tests sollten:
- ✅ Co-located sein (im `__tests__/` Ordner neben Source)
- ✅ Eine Datei/Klasse/Funktion testen
- ✅ Schnell sein (< 100ms)
- ✅ Isoliert sein (keine externen Dependencies)

**Beispiel:**

```typescript
// src/services/myservice.ts
export class MyService {
  doSomething() { ... }
}

// src/services/__tests__/myservice.test.ts
import { describe, it, expect } from "vitest";
import { MyService } from "../myservice";

describe("MyService", () => {
  it("should do something", () => {
    const service = new MyService();
    const result = service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

Integration Tests sollten:
- ✅ In `src/__tests__/integration/` liegen
- ✅ Mehrere Komponenten testen
- ✅ End-to-End-Workflows testen
- ✅ Foundry-Globals mocken

**Beispiel:**

```typescript
// src/__tests__/integration/my-feature.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Integration: My Feature", () => {
  beforeEach(() => {
    vi.stubGlobal('game', { /* mock */ });
  });

  it("should work end-to-end", () => {
    // Test kompletten Workflow
  });
});
```

---

## Testing Best Practices

### 1. Result-Pattern Assertions

Nutze die Test-Utilities für Result-Pattern:

```typescript
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

it("should return ok result", () => {
  const result = myFunction();
  expectResultOk(result);
  // result.value ist jetzt type-safe verfügbar
});
```

### 2. Foundry Globals Mocken

```typescript
import { withFoundryGlobals } from "@/test/utils/test-helpers";

it("should work with Foundry", () => {
  const cleanup = withFoundryGlobals({
    game: createMockGame(),
    Hooks: createMockHooks()
  });

  // Test code...

  cleanup();
});
```

### 3. Test Behavior, not Implementation

❌ **Schlecht:**
```typescript
it("should call private method", () => {
  const spy = vi.spyOn(service as any, 'privateMethod');
  service.doSomething();
  expect(spy).toHaveBeenCalled();
});
```

✅ **Gut:**
```typescript
it("should produce correct result", () => {
  const result = service.doSomething();
  expect(result).toEqual(expectedValue);
});
```

### 4. Edge Cases testen

Teste immer:
- ✅ Null/Undefined inputs
- ✅ Empty strings/arrays
- ✅ Boundary values (min/max)
- ✅ Invalid inputs
- ✅ Error conditions

---

## Test Categories

### Unit Tests (meiste Tests)

- Testen einzelne Funktionen/Klassen
- Schnell (< 100ms)
- Isoliert
- Beispiele: `result.test.ts`, `container.test.ts`

### Edge Case Tests

- Testen ungewöhnliche Szenarien
- Concurrent Operations
- Circular Dependencies
- Security (Injection-Angriffe)
- Beispiele: `container-edge-cases.test.ts`, `input-validators-security.test.ts`

### Integration Tests

- Testen Zusammenspiel mehrerer Komponenten
- Full Bootstrap
- End-to-End Workflows
- Beispiele: `full-bootstrap.test.ts`

---

## Coverage Exclusions

Folgende Dateien sind von Coverage ausgeschlossen:

- Type-Definitionen (`src/types/**`, `src/**/interfaces/**`)
- Test-Files selbst (`**/*.test.ts`)
- Config-Files (`**/*.config.*`)
- Type Declaration Files (`**/*.d.ts`)
- Pure Interface Files
- Polyfills
- Svelte Components (separate Coverage)

---

## CI/CD Integration

Tests laufen automatisch in der CI-Pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

Coverage-Reports werden zu Codecov hochgeladen.

---

## Debugging Tests

### VSCode Integration

Nutze Vitest Extension für VSCode:
- Run/Debug buttons direkt im Editor
- Coverage-Highlighting
- Test Explorer

### Watch-Modus

```bash
npm run test:watch
```

Führt Tests automatisch aus bei Datei-Änderungen.

### UI-Modus

```bash
npm run test:ui
```

Öffnet interaktive Test-UI im Browser.

---

## Performance-Tests

Für Performance-kritische Code:

```typescript
import { bench, describe } from 'vitest';

describe('Performance', () => {
  bench('myFunction', () => {
    myFunction();
  });
});
```

Ausführen mit:

```bash
npm run test -- --run *.bench.ts
```

---

## Häufige Probleme

### Tests schlagen fehl: "game is not defined"

**Lösung:** Foundry globals mocken

```typescript
beforeEach(() => {
  vi.stubGlobal('game', { /* mock */ });
});
```

### Tests sind langsam

**Lösung:** 
- Prüfe auf `await` in synchronen Tests
- Nutze Mocks statt echte Services
- Teile große Tests auf

### Coverage zu niedrig

**Lösung:**
- Identifiziere ungetestete Dateien: `coverage/index.html`
- Schreibe Tests für kritische Pfade
- Edge Cases hinzufügen

---

## Weitere Ressourcen

- **Vitest Dokumentation:** https://vitest.dev/
- **Test Utilities:** `src/test/utils/test-helpers.ts`
- **Mock Factories:** `src/test/mocks/foundry.ts`

