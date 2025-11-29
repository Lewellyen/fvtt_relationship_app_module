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
  - Keine `/* v8 ignore */`-Marker im Produktionscode.
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

- Keine spezifischen Regressionswächter definiert.

---

## Test Structure

Tests sind co-located mit dem Source-Code:

```
src/
├── __tests__/                    # Integration Tests
│   └── integration/              # Erweiterte Integration Tests
│       ├── full-bootstrap.test.ts
│       ├── journal-visibility-e2e.test.ts
│       ├── hook-registration-execution.test.ts
│       ├── cache-invalidation-workflow.test.ts
│       ├── module-lifecycle.test.ts
│       └── settings-change-reaction.test.ts
├── services/
│   ├── consolelogger.ts
│   └── __tests__/
│       └── consolelogger.test.ts  # Unit Test
├── di_infrastructure/
│   ├── container.ts
│   └── __tests__/
│       └── container.test.ts      # Unit Test
```

---

## Test Patterns

### 1. Result Pattern Testing

```typescript
it("should return error on failure", () => {
  const result = service.doSomething();
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain("expected error");
  }
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
- **Type-only Files** (2025-11-29):
  - `src/application/services/JournalVisibilityConfig.ts` - Nur Interface/Type
  - `src/domain/types/cache/cache-types.ts` - Nur Type-Definitionen
- **Re-Export Files** (2025-11-29):
  - `src/infrastructure/shared/utils/result.ts` - Re-Export von Domain-Utilities
  - `src/infrastructure/shared/tokens/collection-tokens.ts` - Re-Export
  - `src/infrastructure/shared/tokens/repository-tokens.ts` - Re-Export
  - `src/application/tokens/index.ts` - Re-Export-Datei

### Inline Exclusions (v8 ignore)

Alle inline Coverage-Ausnahmen sind dokumentiert:
- **Code Coverage:** Siehe `docs/quality-gates/code-coverage-exclusions.md`
- **Type Coverage:** Siehe `docs/quality-gates/type-coverage-exclusions.md`

**177** `v8 ignore` Kommentare (alle mit Begründung)  
**43** `type-coverage:ignore` Kommentare (alle mit Begründung)

**Audit-Befehle:**
```bash
# Prüfe ob alle v8 ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "v8 ignore$" src/
grep -r "v8 ignore-next-line$" src/

# Prüfe ob alle type-coverage:ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "type-coverage:ignore-next-line$" src/
```

---

## CI/CD Integration

Tests laufen automatisch in der CI-Pipeline:
