# Testing Guide

Beziehungsnetzwerke für Foundry VTT - Test-Dokumentation

---

## Running Tests

### Alle Tests ausführen

```bash
# Watch-Modus (empfohlen für Entwicklung)
npm run test:watch

# Single Run (für CI/CD)
npm test

# Mit Coverage-Report
npm run test:coverage

# Interaktive UI
npm run test:ui
```

### Komplettes Quality Gate

```bash
npm run check-all
```

Führt `test:coverage`, `type-coverage`, `type-check`, `svelte-check`, `lint`, `css-lint`, `format` und `check:encoding` sequenziell aus (siehe `package.json`).

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

| Metrik | Ziel |
|--------|------|
| Lines | 100% |
| Functions | 100% |
| Branches | 100% |
| Statements | 100% |
| Type Coverage | 100% |

**Quality Gates:**

- In `src/core/**` (ohne `init-solid.ts`), `src/services/**`, `src/utils/**`, `src/types/**` gelten:
  - Keine `/* c8 ignore */`-Marker im Produktionscode.
  - Keine `type-coverage:ignore`-Kommentare im Produktionscode.
  - Keine `eslint-disable` / `ts-ignore`-Direktiven, außer bei nachweisbaren Bugs in externen Typdefinitionen.
- Tests, Mocks und polyfill-/adapter-spezifische Dateien folgen eigenen, separat dokumentierten Ausnahmen (siehe Quality-Gates-Dokumente).

**Überprüfung:**

```bash
npm run test:coverage
npm run type-coverage
```

Der Coverage-Report wird in `coverage/index.html` generiert, Detailausnahmen sind in `docs/quality-gates/*.md` dokumentiert.

### Regressionswächter

- **ModuleSettingsContextResolver**: Die Datei `src/core/settings/__tests__/module-settings-context-resolver.test.ts` deckt sowohl Erfolgs- als auch Fehlerpfade (NotificationCenter-Ausfall, fehlende DI-Abhängigkeiten) ab und stellt sicher, dass die globalen 100 %-Coverage-Grenzen bei zukünftigen Refactorings eingehalten werden.

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

### File-Level Exclusions (vitest.config.ts)

Folgende Dateien sind von Coverage ausgeschlossen:

- Type-Definitionen (`src/types/**`, `src/**/interfaces/**`)
- Test-Files selbst (`**/*.test.ts`)
- Config-Files (`**/*.config.*`)
- Type Declaration Files (`**/*.d.ts`)
- Pure Interface Files
- Polyfills
- Svelte Components (separate Coverage)

### Inline Exclusions (c8 ignore)

Alle inline Coverage-Ausnahmen sind dokumentiert:
- **Code Coverage:** Siehe `docs/quality-gates/code-coverage-exclusions.md`
- **Type Coverage:** Siehe `docs/quality-gates/type-coverage-exclusions.md`

**177** `c8 ignore` Kommentare (alle mit Begründung)  
**43** `type-coverage:ignore` Kommentare (alle mit Begründung)

**Audit-Befehle:**
```bash
# Prüfe ob alle c8 ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "c8 ignore$" src/
grep -r "c8 ignore-next-line$" src/

# Prüfe ob alle type-coverage:ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "type-coverage:ignore-next-line$" src/
```

---

## CI/CD Integration

Tests laufen automatisch in der CI-Pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm test

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

