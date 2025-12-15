# Testing - Strategie & Anleitung

**Zweck:** Umfassende Test-Dokumentation mit Strategie, Tools, Best Practices und praktischen Anleitungen
**Zielgruppe:** Entwickler, QA, Maintainer
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Tests ausführen](#tests-ausführen)
3. [Test-Kategorien](#test-kategorien)
4. [Coverage-Anforderungen](#coverage-anforderungen)
5. [Test-Patterns](#test-patterns)
6. [Tools & Infrastruktur](#tools--infrastruktur)
7. [Priorisierung](#priorisierung)
8. [Best Practices](#best-practices)
9. [E2E-Tests (Phase 3)](#e2e-tests-phase-3)

---

## Übersicht

### Aktuelle Test-Infrastruktur

**Bereits vorhanden:**
- ✅ **Vitest 4.0.10** - Test-Framework (Jest-kompatibel)
- ✅ **@vitest/coverage-v8** - Code Coverage (100% Lines/Functions/Branches/Statements)
- ✅ **@vitest/ui** - Interaktive Test-UI
- ✅ **happy-dom** - DOM-Environment für Tests
- ✅ **type-coverage** - TypeScript Type Coverage (100%)
- ✅ **Dependabot** - Automatische Dependency-Updates (GitHub)

**Test-Coverage:**
- Lines: 100%
- Functions: 100%
- Branches: 100%
- Statements: 100%
- Type Coverage: 100%

### Aktueller Test-Stand

**Unit-Tests:**
- ✅ **95+ Test-Dateien** vorhanden
- ✅ **Co-located** mit Source-Code (in `__tests__/` Ordnern)
- ✅ **Vollständige Coverage** aller Services, Utilities, Ports, DI-Infrastructure
- ✅ **Edge Case Tests** vorhanden (z.B. `container-edge-cases.test.ts`, `input-validators-security.test.ts`)

**Integration-Tests:**
- ✅ **2 Integration-Tests** vorhanden:
  1. `src/__tests__/integration/full-bootstrap.test.ts` - Vollständiger Bootstrap-Prozess
  2. `src/observability/trace/__tests__/TraceContext.integration.test.ts` - TraceContext + Logger Integration
- ⚠️ **Weitere Integration-Tests empfohlen** (siehe [Priorisierung](#priorisierung))

**Test-Verteilung:**
- **DI-Infrastructure:** ~15 Test-Dateien (Container, Registry, Resolution, Validation)
- **Services:** ~8 Test-Dateien (Logger, Cache, I18n, Journal Visibility, Retry)
- **Foundry Ports:** ~12 Test-Dateien (v13 Ports für alle Interfaces)
- **Foundry Services:** ~15 Test-Dateien (Service-Wrapper, Facades)
- **Core:** ~10 Test-Dateien (Bootstrap, Hooks, Settings, API)
- **Observability:** ~4 Test-Dateien (Metrics, Performance, Trace)
- **Notifications:** ~2 Test-Dateien (NotificationCenter, Channels)
- **Utils:** ~8 Test-Dateien (Functional, Security, Settings, String)
- **Config:** ~3 Test-Dateien (Dependency Config, Environment)

---

## Tests ausführen

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

## Test-Kategorien

### 1. Unit Tests (meiste Tests)

**Was wird geprüft:**
- Einzelne Funktionen/Klassen
- Isolierte Logik
- Edge Cases

**Eigenschaften:**
- Schnell (< 100ms)
- Isoliert
- Beispiele: `result.test.ts`, `container.test.ts`

### 2. Integration Tests

**Was wird geprüft:**
- Zusammenspiel mehrerer Komponenten (DI-Container, Services, Ports)
- Vollständiger Bootstrap-Prozess
- End-to-End-Workflows (z.B. Journal-Entry verstecken)
- Module-Lifecycle (init → ready)

**Bereits vorhanden:**
1. **`src/__tests__/integration/full-bootstrap.test.ts`**
   - Testet vollständigen Bootstrap-Prozess
   - Prüft Container-Erstellung, Service-Resolution, API-Exposition
   - 6 Test-Cases

2. **`src/observability/trace/__tests__/TraceContext.integration.test.ts`**
   - Testet TraceContext + Logger Integration
   - Prüft DI-Container-Resolution, Trace-Injection, Nested Traces
   - 12 Test-Cases

**Fehlende Integration-Tests (empfohlen):**
- ❌ Journal Visibility End-to-End (Bootstrap → Flag setzen → Directory rendern → Entry versteckt)
- ❌ Hook-Registrierung + Ausführung (Hook registrieren → Foundry Hook → Service)
- ❌ Cache-Invalidierung Workflow (Journal ändern → Hook → Cache invalidiert)
- ❌ Module-Lifecycle (init → ready)
- ❌ Settings-Änderung + Service-Reaktion

**Machbarkeit:** ✅ Alle fehlenden Integration-Tests können mit vorhandenen Tools implementiert werden!

### 3. Performance & Load Tests

**Was wird geprüft:**
- Ausführungszeit kritischer Operationen
- Skalierbarkeit bei großen Datenmengen (z.B. 10.000 Journal-Entries)
- Cache-Performance und Hit-Rate
- Throttling-Verhalten bei häufigen Hook-Fires

**Tool:** Vitest Bench (bereits in Vitest enthalten)

**Status:** ✅ Tool vorhanden, Tests implementierbar

### 4. Concurrency & Race Condition Tests

**Was wird geprüft:**
- Parallele Zugriffe auf geteilte Ressourcen (Port-Selection, Cache)
- Thread-Safety von Services
- Gleichzeitige Hook-Registrierungen
- Cache-Zugriffe unter Last

**Tool:** Vitest (eingebaut) + Node.js Worker Threads

**Status:** ✅ Tool vorhanden, Tests implementierbar

### 5. Memory Leak Tests

**Was wird geprüft:**
- Speicherverbrauch nach vielen Operationen (z.B. 1000 Hook-Registrierungen)
- Cleanup von Event Listeners
- Disposal von Services/Scopes
- WeakMap/WeakSet-Verhalten

**Tool:** Node.js `--expose-gc` + `performance.memory` API

**Status:** ✅ Tool vorhanden, Tests implementierbar

### 6. Security Tests

**Was wird geprüft:**
- XSS-Injection-Schutz (Script-Tags, Event-Handler)
- Input-Validierung (Journal-IDs, Flag-Keys)
- HTML-Sanitization
- Prototype-Pollution-Schutz

**Bereits vorhanden:**
- `src/foundry/validation/__tests__/input-validators-security.test.ts`
- `src/foundry/validation/__tests__/schemas.test.ts` (Sanitization-Tests)

**Status:** ✅ Teilweise vorhanden, erweiterbar

### 7. Runtime Error Monitoring Tests

**Was wird geprüft:**
- Fehlerbehandlung bei Foundry API-Fehlern
- Graceful Degradation (z.B. wenn `game.journal` undefined ist)
- Result-Pattern-Konsistenz (keine Exceptions, immer Result)
- Error-Recovery (Retry-Logik bei transienten Fehlern)

**Tool:** Vitest (bereits vorhanden)

**Status:** ✅ Tool vorhanden, Tests implementierbar

### 8. E2E (End-to-End) Tests

**Status:** ⚠️ Noch nicht implementiert, Planung vorhanden

Siehe [E2E-Tests (Phase 3)](#e2e-tests-phase-3) für Details.

---

## Coverage-Anforderungen

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
- Tests, Mocks und polyfill-/adapter-spezifische Dateien folgen eigenen, separat dokumentierten Ausnahmen (siehe [Quality Gates](../quality/README.md)).

**Überprüfung:**

```bash
npm run test:coverage
npm run type-coverage
```

Der Coverage-Report wird in `coverage/index.html` generiert, Detailausnahmen sind in `docs/quality/` dokumentiert.

### Coverage Exclusions

**File-Level Exclusions (vitest.config.ts):**

Folgende Dateien sind von Coverage ausgeschlossen:
- Type-Definitionen (`src/types/**`, `src/**/interfaces/**`)
- Test-Files selbst (`**/*.test.ts`)
- Config-Files (`**/*.config.*`)
- Type Declaration Files (`**/*.d.ts`)
- Pure Interface Files
- Polyfills
- Svelte Components (separate Coverage)

**Inline Exclusions (v8 ignore):**

Alle inline Coverage-Ausnahmen sind dokumentiert:
- **Code Coverage:** Siehe [Code Coverage Exclusions](../quality/coverage.md)
- **Type Coverage:** Siehe [Type Safety](../quality/type-safety.md)

**Audit-Befehle:**
```bash
# Prüfe ob alle v8 ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "v8 ignore$" src/
grep -r "v8 ignore-next-line$" src/

# Prüfe ob alle type-coverage:ignore dokumentiert sind (sollte 0 zurückgeben)
grep -r "type-coverage:ignore-next-line$" src/
```

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

## Test-Patterns

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

## Tools & Infrastruktur

### Übersicht: Tools nach Kategorie

| Test-Kategorie | Tool | Installation | Status |
|----------------|------|--------------|--------|
| **Performance** | Vitest Bench | ✅ Bereits vorhanden | ✅ Ready |
| **Concurrency** | Vitest + Node.js | ✅ Bereits vorhanden | ✅ Ready |
| **Memory Leaks** | Node.js GC API | ✅ Bereits vorhanden | ✅ Ready |
| **Compatibility** | Vitest + Mocks | ✅ Bereits vorhanden | ✅ Ready (mit Einschränkungen) |
| **Security** | Vitest | ✅ Bereits vorhanden | ✅ Ready |
| **Integration** | Vitest | ✅ Bereits vorhanden | ✅ Ready |
| **Mutation** | Stryker | ❌ Neu installieren | ⚠️ Optional |
| **Property-Based** | fast-check | ❌ Neu installieren | ⚠️ Optional |
| **Bundle Size** | vite-bundle-visualizer | ❌ Neu installieren | ⚠️ Optional |
| **Dependencies** | Dependabot + npm audit | ✅ Bereits vorhanden | ✅ Ready |
| **Runtime Errors** | Vitest | ✅ Bereits vorhanden | ✅ Ready |
| **Type Safety** | type-coverage | ✅ Bereits vorhanden | ✅ Ready |

### Vorhandene Test-Tools

**Mock-Utilities (in `src/test/`):**
- ✅ `createMockGame()` - Mock für Foundry `game`-Objekt
- ✅ `createMockHooks()` - Mock für Foundry `Hooks`
- ✅ `createMockUI()` - Mock für Foundry `ui`
- ✅ `createMockJournalEntry()` - Mock für Journal Entries
- ✅ `createMockDOM()` - DOM-Struktur für UI-Tests
- ✅ `createMockContainer()` - Mock-Container für DI-Tests
- ✅ `withFoundryGlobals()` - Helper für Foundry-Globals Setup/Cleanup
- ✅ `expectResultOk()` / `expectResultErr()` - Result-Pattern Assertions

**Test-Helpers:**
- ✅ `CompositionRoot` - Bootstrap-Container für Integration-Tests
- ✅ `configureDependencies()` - Dependency-Registrierung
- ✅ Vitest Spies (`vi.fn()`, `vi.spyOn()`) - Callback-Extraktion und Mocking

---

## Priorisierung

### 🥇 Hohe Priorität (empfohlen, sofort implementieren)

1. **Erweiterte Integration Tests** ⭐ **HÖCHSTE PRIORITÄT**
   - **Prüft:** End-to-End-Workflows
   - **Warum:** Testet reale Nutzung, findet Integrationsfehler
   - **Tool:** Vitest (bereits vorhanden)
   - **Aufwand:** 3-5 Stunden
   - **Fehlende Tests:**
     - Journal Visibility Workflow (Flag setzen → Directory rendern → Entry versteckt)
     - Hook-Registrierung + Ausführung (Hook → Foundry Hook → Service)
     - Cache-Invalidierung Workflow (Journal ändern → Hook → Cache invalidiert)
     - Module-Lifecycle (init → ready)
     - Settings-Änderung + Service-Reaktion

2. **Concurrency Tests**
   - **Prüft:** Race Conditions
   - **Warum:** Kritisch für Stabilität
   - **Tool:** Vitest (bereits vorhanden)
   - **Aufwand:** 2-4 Stunden

3. **Memory Leak Tests**
   - **Prüft:** Speicherlecks
   - **Warum:** Wichtig für lange Sessions
   - **Tool:** Node.js GC API (bereits vorhanden)
   - **Aufwand:** 2-3 Stunden

4. **Runtime Error Monitoring Tests**
   - **Prüft:** Fehlerbehandlung
   - **Warum:** Verhindert Crashes
   - **Tool:** Vitest (bereits vorhanden)
   - **Aufwand:** 2-3 Stunden

**Gesamtaufwand (Hohe Priorität):** ~9-15 Stunden

---

### 🥈 Mittlere Priorität (optional, nächste Iteration)

5. **Performance Tests**
   - **Prüft:** Ausführungszeit
   - **Warum:** Verhindert Performance-Regressionen
   - **Tool:** Vitest Bench (bereits vorhanden)
   - **Aufwand:** 2-3 Stunden

6. **Property-Based Tests**
   - **Prüft:** Zufällige Inputs
   - **Warum:** Findet Edge Cases
   - **Tool:** fast-check (neu installieren)
   - **Aufwand:** 3-4 Stunden

7. **Erweiterte Security Tests**
   - **Prüft:** OWASP Top 10 Vektoren
   - **Warum:** Umfassender Security-Schutz
   - **Tool:** Vitest (bereits vorhanden)
   - **Aufwand:** 2-3 Stunden

**Gesamtaufwand (Mittlere Priorität):** ~7-10 Stunden

---

### 🥉 Niedrige Priorität (nice-to-have, später)

8. **Mutation Testing**
   - **Prüft:** Test-Qualität
   - **Warum:** Misst Test-Robustheit
   - **Tool:** Stryker (neu installieren)
   - **Aufwand:** 4-6 Stunden Setup + Laufzeit

9. **Bundle Size Analysis**
   - **Prüft:** Bundle-Größe
   - **Warum:** Performance-Optimierung
   - **Tool:** vite-bundle-visualizer (neu installieren)
   - **Aufwand:** 1-2 Stunden

**Gesamtaufwand (Niedrige Priorität):** ~5-8 Stunden

---

## Best Practices

### 1. Test-Naming

**✅ Gut:**
```typescript
describe("Port Selection Logic", () => {
  it("should select v13 port when Foundry version is 13");
});

describe("Version Parsing", () => {
  it("should parse 13.348 → 13");
});
```

**❌ Schlecht:**
```typescript
describe("Foundry Compatibility", () => {
  it("should work with Foundry v13"); // Führt zu falschen Erwartungen!
});
```

### 2. Mock-Verwendung

**✅ Gut:**
```typescript
// Klare Mock-Definition
const mockGame = createMockGame({ version: "13.348" });
const cleanup = withFoundryGlobals({ game: mockGame });

// Test
const result = getFoundryVersionResult();
expect(result.value).toBe(13);

cleanup();
```

**❌ Schlecht:**
```typescript
// Unklare Mock-Definition
global.game = { version: "13.348" }; // Leak in andere Tests!
```

### 3. Test-Isolation

**✅ Gut:**
```typescript
afterEach(() => {
  vi.unstubAllGlobals();
  resetVersionCache(); // Cleanup für Test-Isolation
});
```

**❌ Schlecht:**
```typescript
// Kein Cleanup → Tests beeinflussen sich gegenseitig
```

### 4. Realistische Erwartungen

**✅ Gut:**
```typescript
// Testet Logik, nicht echte Kompatibilität
it("should select v13 port when version is 13", () => {
  // Testet Port-Selection-Logik
});
```

**❌ Schlecht:**
```typescript
// Falsche Erwartungen
it("should work with real Foundry v13", () => {
  // Kann nicht getestet werden ohne echte Foundry-Instanz!
});
```

---

## E2E-Tests (Phase 3)

### Übersicht

**Status:** ⚠️ Noch nicht implementiert, Planung vorhanden

**Ziel:**
E2E-Tests stellen sicher, dass das Modul in einer realen Foundry VTT-Instanz inkl. UI (Svelte, Cytoscape, @xyflow/svelte) erwartungsgemäß funktioniert.

**Test-Pyramide:**
- **Phase 1:** Unit Tests ✅ (95+ Tests, 100% Coverage)
- **Phase 2:** Integration Tests ✅ (2 vorhanden, 5 empfohlen)
- **Phase 3:** E2E Tests ⚠️ (noch nicht implementiert)

### Tools und Setup

#### Playwright (Empfohlen)

**Warum Playwright?**
- ✅ Moderne, stabile Browser-Automation
- ✅ Multi-Browser-Support (Chromium, Firefox, WebKit)
- ✅ Gute TypeScript-Unterstützung
- ✅ Screenshot/Video-Aufnahme für Debugging
- ✅ Auto-Waiting (weniger Flaky-Tests)

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### CI/CD-Integration

**⚠️ Wichtig:** Foundry VTT ist proprietäre Software und kann **nicht** als Docker-Container in GitHub Actions bereitgestellt werden. E2E-Tests müssen daher **lokal** ausgeführt werden.

**Empfohlene Strategie:**
- E2E-Tests werden **nur lokal** ausgeführt, nicht in CI/CD
- Vor größeren Commits/PRs: `npm run test:e2e`
- Manuelles Testen in Foundry vor Releases

**NPM-Scripts:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### E2E-Test-Szenarien

1. **Bootstrap & Initialisierung**
   - Modul lädt ohne JavaScript-Errors
   - API ist verfügbar
   - Alle Services resolvable
   - Keine Browser-Console-Errors

2. **Journal Visibility**
   - Journal-Entry mit Flag wird versteckt
   - Journal-Directory wird korrekt gefiltert

3. **Beziehungsnetzwerke**
   - Graph-UI öffnet sich
   - Nodes werden korrekt gerendert
   - Interaktionen funktionieren

4. **Settings-UI**
   - Settings können geändert werden
   - Änderungen werden gespeichert

5. **Notifications**
   - Error-Notifications werden angezeigt
   - Notifications verschwinden automatisch

**Aufwand-Schätzung:**
- **Setup:** 4-6 Stunden
- **Bootstrap-Tests:** 2-3 Stunden
- **Journal Visibility Tests:** 3-4 Stunden
- **Settings-Tests:** 2-3 Stunden
- **Relationship-Tests:** 4-6 Stunden (wenn UI fertig)

**Gesamtaufwand:** ~15-22 Stunden

---

## CI/CD Integration

Tests laufen automatisch in der CI-Pipeline:

- ✅ Unit & Integration Tests (GitHub Actions)
- ✅ Type Checking
- ✅ Linting
- ✅ Code Coverage
- ⚠️ E2E Tests (lokal, nicht in CI/CD)

---

## Was wird getestet - Was nicht

### ✅ Was WIRKLICH getestet wird

1. **Logik-Korrektheit**
   - Version-Parsing funktioniert (`"13.348"` → `13`)
   - Port-Selection-Algorithmus ist korrekt
   - Edge Cases werden behandelt

2. **Regression-Schutz**
   - Verhindert, dass Parsing-Logik kaputt geht
   - Verhindert, dass Port-Selection-Logik kaputt geht
   - Verhindert, dass Security-Validierung kaputt geht

3. **Dokumentation**
   - Zeigt erwartetes Verhalten
   - Dokumentiert Edge Cases
   - Erklärt Algorithmen

### ❌ Was NICHT getestet wird

1. **Echte Kompatibilität**
   - ❌ Keine Garantie, dass Code mit echter Foundry-Version funktioniert
   - ❌ Keine Garantie gegen Breaking Changes in Foundry
   - ❌ Keine Validierung gegen echte Foundry-API

2. **API-Validierung**
   - ❌ Keine Validierung gegen echte Foundry-API
   - ❌ Keine Erkennung von API-Änderungen
   - ❌ Keine Validierung der DOM-Struktur

3. **Echte Umgebung**
   - ❌ Tests laufen nicht in echter Foundry-Umgebung
   - ❌ Tests nutzen Mocks, nicht echte Foundry-Objekte
   - ❌ Tests können echte Browser-Umgebung nicht simulieren

### ⚠️ Realistische Erwartungen

**Tests sind wertvoll für:**
- ✅ Regression-Schutz der Logik
- ✅ Dokumentation des erwarteten Verhaltens
- ✅ Edge-Case-Abdeckung
- ✅ Sicherheit (Input-Validation)

**Tests ersetzen NICHT:**
- ❌ Manuelles Testen in echten Foundry-Instanzen
- ❌ Echte Kompatibilitätstests
- ❌ API-Validierung gegen echte Foundry-Versionen

**Empfehlung:**
- Tests als "Port Selection Logic Tests" oder "Version Parsing Tests" bezeichnen
- Nicht als "Compatibility Tests" bezeichnen (führt zu falschen Erwartungen)
- Echte Kompatibilität manuell in Foundry testen

---

## Dependency Management

### Dependabot (GitHub)

**Status:** ✅ **AKTIV**

**Konfiguration:** `.github/dependabot.yml`

**Features:**
- ✅ Wöchentliche Checks (Montags 9:00 Uhr)
- ✅ Automatische PRs für Patch-Updates
- ✅ Gruppierung von Updates
- ✅ Separate PRs für Major-Updates (Breaking Changes)

**Zusätzliche Tests:** ❌ Nicht nötig

### npm audit

**Status:** ✅ **AKTIV**

**Konfiguration:** `.github/workflows/security.yml`

**Features:**
- ✅ Läuft bei jedem PR
- ✅ Läuft wöchentlich (scheduled)
- ✅ Separate Checks für Production/Dev Dependencies
- ✅ Generiert Audit-Reports bei Fehlern

**Zusätzliche Tests:** ❌ Nicht nötig

---

## Zusammenfassung

### Was ist bereits vorhanden?

**Test-Infrastruktur:**
- ✅ Vollständige Test-Infrastruktur (Vitest, Coverage, Type-Coverage)
- ✅ Dependabot für Dependency-Management
- ✅ Security-Workflow für npm audit

**Unit-Tests:**
- ✅ **95+ Test-Dateien** mit 100% Coverage
- ✅ Alle Services, Ports, DI-Infrastructure, Utils getestet
- ✅ Edge Case Tests vorhanden
- ✅ Security Tests vorhanden

**Integration-Tests:**
- ✅ **2 Integration-Tests** vorhanden:
  - Full Bootstrap Test (6 Test-Cases)
  - TraceContext Integration Test (12 Test-Cases)
- ⚠️ **Weitere Integration-Tests empfohlen** (siehe Priorisierung)

### Was sollte ergänzt werden?

**Hohe Priorität:**
1. Erweiterte Integration Tests (End-to-End-Workflows)
2. Concurrency Tests (Race Conditions)
3. Memory Leak Tests
4. Runtime Error Monitoring Tests

**Mittlere Priorität:**
5. Performance Tests
6. Property-Based Tests (fast-check)
7. Erweiterte Security Tests

**Niedrige Priorität:**
8. Mutation Testing (Stryker)
9. Bundle Size Analysis

---

## Verwandte Dokumentation

- [Quality Gates](../quality/README.md) - Qualitätsmetriken & Pflicht-Gates
- [Code Coverage](../quality/coverage.md) - Coverage-Strategie & Exclusions
- [Type Safety](../quality/type-safety.md) - Type Coverage
- [Architektur-Übersicht](../architecture/overview.md) - Architektur-Details

---

**Letzte Aktualisierung:** 2025-01-XX
**Nächste Review:** Bei Änderungen an Test-Strategie oder neuen Tools
