# Test-Strategie und Tools

Beziehungsnetzwerke für Foundry VTT - Umfassende Test-Dokumentation

**Datum:** 2025-01-XX  
**Stand:** Version 0.25.10  
**Status:** ✅ Aktive Dokumentation

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Test-Kategorien im Detail](#test-kategorien-im-detail)
3. [Tools und Mittel](#tools-und-mittel)
4. [Was wird getestet - Was nicht](#was-wird-getestet---was-nicht)
5. [Priorisierung](#priorisierung)
6. [Best Practices](#best-practices)
7. [Dependency Management](#dependency-management)
8. [Integration-Tests: Machbarkeit mit vorhandenen Tools](#integration-tests-machbarkeit-mit-vorhandenen-tools)
9. [Phase 3: E2E (End-to-End) Tests](#phase-3-e2e-end-to-end-tests)

---

## Übersicht

### Aktuelle Test-Infrastruktur

**Bereits vorhanden:**
- ✅ **Vitest 3.2.4** - Test-Framework (Jest-kompatibel)
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
- ✅ **95 Test-Dateien** vorhanden
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

## Test-Kategorien im Detail

### 1. Performance & Load Tests

**Was wird geprüft:**
- Ausführungszeit kritischer Operationen
- Skalierbarkeit bei großen Datenmengen (z.B. 10.000 Journal-Entries)
- Cache-Performance und Hit-Rate
- Throttling-Verhalten bei häufigen Hook-Fires

**Warum wichtig:**
- Verhindert Performance-Regressionen bei Code-Änderungen
- Findet Bottlenecks frühzeitig
- Sichert akzeptable Antwortzeiten für Endnutzer
- Verhindert UI-Freezes bei großen Datenmengen

**Tool:** Vitest Bench (bereits in Vitest enthalten)

**Beispiel:**
```typescript
import { bench, describe } from 'vitest';

describe('Journal Cache Performance', () => {
  bench('should handle 10,000 entries', () => {
    processJournalEntries(largeDataset);
  }, { time: 1000 }); // 1 Sekunde Laufzeit
});
```

**Status:** ✅ Tool vorhanden, Tests implementierbar

---

### 2. Concurrency & Race Condition Tests

**Was wird geprüft:**
- Parallele Zugriffe auf geteilte Ressourcen (Port-Selection, Cache)
- Thread-Safety von Services
- Gleichzeitige Hook-Registrierungen
- Cache-Zugriffe unter Last

**Warum wichtig:**
- Verhindert Race Conditions, die zu undefiniertem Verhalten führen
- Sichert korrektes Verhalten bei gleichzeitigen Requests
- Findet Deadlocks und Livelocks
- Kritisch für Multi-User-Szenarien in Foundry

**Tool:** Vitest (eingebaut) + Node.js Worker Threads

**Beispiel:**
```typescript
describe("Port Selection Race Conditions", () => {
  it.concurrent("should handle concurrent requests", async () => {
    const promises = Array.from({ length: 10 }, () => 
      service.getJournalEntries()
    );
    const results = await Promise.all(promises);
    expect(results.every(r => r.ok)).toBe(true);
  });
});
```

**Status:** ✅ Tool vorhanden, Tests implementierbar

---

### 3. Memory Leak Tests

**Was wird geprüft:**
- Speicherverbrauch nach vielen Operationen (z.B. 1000 Hook-Registrierungen)
- Cleanup von Event Listeners
- Disposal von Services/Scopes
- WeakMap/WeakSet-Verhalten

**Warum wichtig:**
- Verhindert Speicherlecks, die zu Browser-Crashes führen
- Sichert korrektes Cleanup (Hooks werden automatisch entfernt bei Module-Deaktivierung)
- Wichtig für lange laufende Foundry-Sessions
- Verhindert Performance-Degradation über Zeit

**Tool:** Node.js `--expose-gc` + `performance.memory` API

**Beispiel:**
```typescript
it("should not leak memory after disposal", () => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  // 1000 Hooks registrieren
  for (let i = 0; i < 1000; i++) {
    hooks.on("test", () => {});
  }
  hooks.dispose();
  
  // Force GC (nur mit --expose-gc Flag)
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
});
```

**Status:** ✅ Tool vorhanden, Tests implementierbar

---

### 4. Foundry API Compatibility Tests

**⚠️ WICHTIG: Realistische Einschätzung**

**Was WIRKLICH getestet wird (mit Mocks):**
- ✅ Version-Parsing-Logik (`"13.348"` → `13`)
- ✅ Port-Selection-Algorithmus (welcher Port wird bei welcher Version gewählt)
- ✅ Mock-Korrektheit (sind Mocks korrekt aufgebaut)
- ✅ Edge Cases (ungültige Versionen, fehlende Ports)

**Was NICHT getestet wird (ohne echte Foundry-Instanz):**
- ❌ Echte API-Kompatibilität mit Foundry v13/v14
- ❌ Echte Breaking Changes zwischen Foundry-Versionen
- ❌ Echte DOM-Struktur in Foundry
- ❌ Funktionieren Ports tatsächlich mit echten Foundry-Versionen

**Warum wichtig (trotz Limitationen):**
- Verhindert Regressionen in der Logik (Parsing, Selection)
- Dokumentiert erwartetes Verhalten
- Findet Edge Cases in der Logik
- **ABER:** Echte Kompatibilität muss manuell in Foundry getestet werden

**Tool:** Vitest + Custom Mocks (bereits vorhanden)

**Beispiel (was getestet werden kann):**
```typescript
// ✅ Sinnvoll: Testet Parsing-Logik
describe("Version Parsing", () => {
  it("should parse 13.348 → 13", () => {
    const cleanup = withFoundryGlobals({
      game: createMockGame({ version: "13.348" })
    });
    const result = getFoundryVersionResult();
    expect(result.value).toBe(13);
    cleanup();
  });
});

// ✅ Sinnvoll: Testet Port-Selection-Logik
describe("Port Selection Logic", () => {
  it("should select v13 port when Foundry version is 13", () => {
    const factories = new Map([
      [13, () => "port-v13"],
      [14, () => "port-v14"]
    ]);
    const result = selector.selectPortFromFactories(factories, 13);
    expect(result.value).toBe("port-v13");
  });
});
```

**Beispiel (was NICHT getestet werden kann):**
```typescript
// ❌ NICHT SINNVOLL: Testet nur Mock, nicht echte Kompatibilität
versions.forEach(version => {
  it(`should work with Foundry v${version}`, () => {
    // Testet nur Mock-Verhalten, nicht echte Foundry-Kompatibilität!
  });
});
```

**Status:** ✅ Tool vorhanden, Tests implementierbar (mit realistischen Erwartungen)

**Empfehlung:** Tests als "Port Selection Logic Tests" oder "Version Parsing Tests" bezeichnen, nicht als "Compatibility Tests"

---

### 5. Security Tests

**Was wird geprüft:**
- XSS-Injection-Schutz (Script-Tags, Event-Handler)
- SQL-Injection-Schutz (obwohl Foundry keine SQL nutzt, defensive Programmierung)
- Input-Validierung (Journal-IDs, Flag-Keys)
- HTML-Sanitization
- Prototype-Pollution-Schutz

**Warum wichtig:**
- Verhindert Sicherheitslücken, die zu Angriffen führen
- Schützt vor Code-Injection in Foundry-Umgebung
- Erfüllt Security-Best-Practices
- Kritisch für Module, die User-Input verarbeiten

**Tool:** Vitest (bereits vorhanden)

**Bereits vorhanden:**
- `src/foundry/validation/__tests__/input-validators-security.test.ts`
- `src/foundry/validation/__tests__/schemas.test.ts` (Sanitization-Tests)

**Beispiel:**
```typescript
describe("XSS Protection", () => {
  it("should reject XSS script tags", () => {
    const result = validateJournalId("<script>alert('xss')</script>");
    expect(result.ok).toBe(false);
  });
  
  it("should sanitize HTML entities", () => {
    const sanitized = sanitizeHtml("<img src=x onerror=alert(1)>");
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror=');
  });
});
```

**Status:** ✅ Teilweise vorhanden, erweiterbar

---

### 6. Integration Tests

**Was wird geprüft:**
- Zusammenspiel mehrerer Komponenten (DI-Container, Services, Ports)
- Vollständiger Bootstrap-Prozess
- End-to-End-Workflows (z.B. Journal-Entry verstecken)
- Module-Lifecycle (init → ready) - **Hinweis:** Foundry hat keine `disable`/`close` Hooks

**Warum wichtig:**
- Testet das Zusammenspiel, nicht nur einzelne Komponenten
- Findet Integrationsfehler, die Unit-Tests nicht finden
- Simuliert reale Nutzung
- Sichert, dass Module korrekt initialisiert wird

**Tool:** Vitest (bereits vorhanden)

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
- ❌ Hook-Registrierung + Ausführung (Hook registrieren → Foundry Hook feuert → Service wird aufgerufen)
- ❌ Cache-Invalidierung Workflow (Journal ändern → Hook feuert → Cache wird invalidiert)
- ❌ Module-Lifecycle (init → ready) - **Hinweis:** Foundry hat keine `disable`/`close` Hooks
- ❌ Settings-Änderung + Service-Reaktion (Setting ändern → Logger-Level aktualisiert)

**Beispiel für fehlende Tests:**
```typescript
describe("Journal Visibility End-to-End", () => {
  it("should hide journal entries in complete workflow", async () => {
    // 1. Bootstrap
    const container = bootstrap();
    
    // 2. Journal Entry mit Flag erstellen
    const entry = createJournalEntry({ hidden: true });
    
    // 3. Journal Directory rendern
    renderJournalDirectory();
    
    // 4. Prüfen ob Entry versteckt ist
    expect(isEntryVisible(entry)).toBe(false);
  });
});
```

**Status:** ⚠️ Teilweise vorhanden (2 Tests), weitere empfohlen

**Machbarkeit mit vorhandenen Tools:**
✅ **Alle fehlenden Integration-Tests können mit vorhandenen Tools implementiert werden!**

**Vorhandene Test-Tools:**
1. **Hook-System:**
   - `createMockHooks()` - Erstellt Mock-Hooks mit `on`, `off`, `once`, `call`, `callAll`
   - Callbacks können aus `mock.calls` extrahiert und manuell aufgerufen werden
   - Beispiel-Pattern (aus `init-solid.test.ts`):
     ```typescript
     const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
     const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
     const initCallback = initCall?.[1];
     initCallback!(); // Callback manuell aufrufen
     ```

2. **Foundry-Globals:**
   - `createMockGame()` - Mock für `game`-Objekt
   - `createMockHooks()` - Mock für `Hooks`
   - `createMockUI()` - Mock für `ui`
   - `withFoundryGlobals()` - Helper für Setup/Cleanup

3. **Journal Entries:**
   - `createMockJournalEntry()` - Erstellt Mock Journal Entries mit Flags
   - `getFlag`/`setFlag` können gemockt werden

4. **DOM-Manipulation:**
   - `createMockDOM()` - Erstellt DOM-Struktur für UI-Tests
   - `happy-dom` - DOM-Environment für Tests

5. **DI-Container:**
   - `CompositionRoot` - Bootstrap-Container
   - `createMockContainer()` - Mock-Container für Tests
   - `configureDependencies()` - Dependency-Registrierung

6. **Settings:**
   - `game.settings.register`, `get`, `set` können mit `vi.fn()` gemockt werden
   - `onChange` Callbacks können getestet werden

**Machbarkeits-Matrix:**

| Test | Vorhandene Tools | Status |
|------|------------------|--------|
| **Journal Visibility End-to-End** | ✅ `createMockJournalEntry()`, `createMockDOM()`, `createMockHooks()`, `CompositionRoot` | ✅ Machbar |
| **Hook-Registrierung + Ausführung** | ✅ `createMockHooks()`, Callback-Extraktion | ✅ Machbar |
| **Cache-Invalidierung Workflow** | ✅ `createMockHooks()`, Callback-Extraktion, `createMockJournalEntry()` | ✅ Machbar |
| **Module-Lifecycle** | ✅ `createMockHooks()`, `CompositionRoot`, Callback-Extraktion | ✅ Machbar |
| **Settings-Änderung + Service-Reaktion** | ✅ `game.settings` Mock, `onChange` Callbacks | ✅ Machbar |

**Implementierungs-Pattern:**
1. Hook-Callbacks aus `mock.calls` extrahieren (wie in `init-solid.test.ts`)
2. Callbacks manuell mit Test-Parametern aufrufen
3. Foundry-Globals mit `withFoundryGlobals()` mocken
4. DOM mit `createMockDOM()` erstellen
5. Container mit `CompositionRoot` bootstrappen

**Keine zusätzlichen Tools erforderlich!** ✅

---

### 7. Mutation Testing

**Was wird geprüft:**
- Qualität der Tests (nicht nur Coverage)
- Werden Fehler in Tests erkannt?
- Test-Robustheit (sind Tests zu schwach?)

**Warum wichtig:**
- Misst Test-Qualität, nicht nur Coverage-Metriken
- Findet unzureichende Tests (Tests die grün bleiben, obwohl Code falsch ist)
- Verbessert Test-Robustheit
- Findet "False Positives" (Tests die immer grün sind)

**Tool:** Stryker (externes Tool)

**Installation:**
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

**Konfiguration:**
```json
// stryker.conf.json
{
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 60
  }
}
```

**Beispiel:**
```typescript
// Mutation Testing ändert Code automatisch:
// Original: if (value > 0) return true;
// Mutiert:   if (value >= 0) return true;
// 
// Wenn Tests weiterhin grün sind → Test ist zu schwach!
// Wenn Tests rot werden → Test ist gut!
```

**Status:** ⚠️ Optional, Tool muss installiert werden

**Priorität:** Niedrig (nice-to-have)

---

### 8. Property-Based Testing

**Was wird geprüft:**
- Verhalten mit zufälligen Inputs (automatisch generiert)
- Invarianten (z.B. Idempotenz: `f(f(x)) === f(x)`)
- Edge Cases automatisch finden
- Mathematische Eigenschaften

**Warum wichtig:**
- Findet unerwartete Edge Cases automatisch
- Testet viele Inputs ohne manuelle Test-Cases
- Sichert mathematische Eigenschaften (Idempotenz, Kommutativität)
- Findet Bugs, die manuelle Tests übersehen

**Tool:** fast-check (externes Tool)

**Installation:**
```bash
npm install --save-dev fast-check
```

**Beispiel:**
```typescript
import { fc, test } from 'fast-check';
import { validateJournalId } from '@/foundry/validation/input-validators';

describe("Input Validation Properties", () => {
  test.prop([fc.string()])(
    "validateJournalId should be idempotent",
    (input) => {
      const result1 = validateJournalId(input);
      const result2 = validateJournalId(input);
      return result1.ok === result2.ok; // Sollte immer gleich sein
    }
  );
  
  test.prop([fc.string()])(
    "should never throw",
    (input) => {
      const result = validateJournalId(input);
      return typeof result.ok === 'boolean'; // Sollte nie crashen
    }
  );
});
```

**Status:** ⚠️ Optional, Tool muss installiert werden

**Priorität:** Mittel (hilfreich für Input-Validation)

---

### 9. Bundle Size Analysis

**Was wird geprüft:**
- Größe des kompilierten Bundles
- Performance-Impact durch Bundle-Größe
- Tree-Shaking-Effektivität
- Gzip/Brotli-Kompression

**Warum wichtig:**
- Schnellere Ladezeiten in Foundry
- Geringerer Speicherverbrauch
- Bessere User Experience
- Verhindert Bundle-Bloat

**Tool:** vite-bundle-visualizer (externes Tool)

**Installation:**
```bash
npm install --save-dev vite-bundle-visualizer
```

**Konfiguration:**
```typescript
// vite.config.ts
import { visualizer } from 'vite-bundle-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

**Alternative:** `bundlesize`
```bash
npm install --save-dev bundlesize
```

**Status:** ⚠️ Optional, Tool muss installiert werden

**Priorität:** Niedrig (nice-to-have)

---

### 10. Dependency & Vulnerability Scanning

**Was wird geprüft:**
- Bekannte Sicherheitslücken in Dependencies (CVE)
- Veraltete Pakete
- Breaking Changes in Updates
- Dependency-Konflikte

**Warum wichtig:**
- Schließt Sicherheitslücken frühzeitig
- Hält Dependencies aktuell
- Verhindert veraltete Abhängigkeiten
- Erfüllt Security-Best-Practices

**Tool:** Dependabot (GitHub) + npm audit

**Status:** ✅ **BEREITS AKTIV**

**Konfiguration vorhanden:**
- `.github/dependabot.yml` - Wöchentliche Checks
- `.github/workflows/security.yml` - Automatische Security-Audits

**Dependabot-Einstellungen:**
```yaml
# .github/dependabot.yml
- package-ecosystem: "npm"
  schedule:
    interval: "weekly"  # Prüft wöchentlich
  groups:
    production-dependencies:
      update-types: ["patch"]  # Auto-Updates für Patches
```

**Zusätzliche Tests NICHT nötig:**
- ✅ Dependabot prüft wöchentlich automatisch
- ✅ Security-Workflow läuft bei jedem PR
- ✅ npm audit läuft in CI
- ✅ PRs werden automatisch für Updates erstellt

**Status:** ✅ Vollständig abgedeckt, keine zusätzlichen Tests nötig

---

### 11. Runtime Error Monitoring Tests

**Was wird geprüft:**
- Fehlerbehandlung bei Foundry API-Fehlern
- Graceful Degradation (z.B. wenn `game.journal` undefined ist)
- Result-Pattern-Konsistenz (keine Exceptions, immer Result)
- Error-Recovery (Retry-Logik bei transienten Fehlern)

**Warum wichtig:**
- Verhindert Crashes in Foundry
- Sichert robustes Fehlerhandling
- Verbessert User Experience (keine unerwarteten Fehler)
- Sichert, dass Module auch bei Fehlern stabil bleibt

**Tool:** Vitest (bereits vorhanden)

**Beispiel:**
```typescript
describe("Error Recovery", () => {
  it("should handle Foundry API failures gracefully", () => {
    const cleanup = withFoundryGlobals({
      game: undefined // Simuliert API-Fehler
    });
    
    const result = gameService.getJournalEntries();
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
    // Sollte nicht crashen, sondern Result zurückgeben
    
    cleanup();
  });
  
  it("should retry on transient errors", async () => {
    // Simuliere transienten Fehler (z.B. Network)
    // Prüfe ob Retry-Logik funktioniert
  });
});
```

**Status:** ✅ Tool vorhanden, Tests implementierbar

---

### 12. Type Safety Regression Tests

**Was wird geprüft:**
- TypeScript-Type-Korrektheit
- API-Type-Stabilität (Breaking Changes in Types)
- Type-Coverage (100%)

**Warum wichtig:**
- Verhindert Type-Fehler zur Laufzeit
- Sichert API-Kompatibilität
- Verbessert Developer Experience
- Findet Breaking Changes in Types früh

**Tool:** type-coverage (bereits vorhanden)

**Status:** ✅ **BEREITS AKTIV**

**Konfiguration:**
```bash
npm run type-coverage  # Prüft 100% Type Coverage
```

**Zusätzliche Tests:**
```typescript
// Compile-Time Tests für API-Stabilität
// Diese Datei kompiliert nur, wenn Types korrekt sind
import type { ModuleAPI } from '@/core/module-api';

// Test: API-Stabilität
type ApiShape = {
  version: string;
  resolve: <T>(token: symbol) => T;
  resolveWithError: <T>(token: symbol) => Result<T, ContainerError>;
};

// Compile-Time Assertion
const _typeCheck: ApiShape = {} as ModuleAPI;
```

**Status:** ✅ Vollständig abgedeckt

---

## Tools und Mittel

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

### Installation (Minimal)

**Nur die wichtigsten zusätzlichen Tools:**
```bash
# Property-Based Testing (empfohlen für Input-Validation)
npm install --save-dev fast-check
```

**Alle anderen Tests können mit bestehenden Tools durchgeführt werden!**

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
     - Module-Lifecycle (init → ready) - **Hinweis:** Foundry hat keine `disable`/`close` Hooks
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

### ❌ Nicht nötig

10. **Dependency Scanning**
   - **Status:** ✅ Dependabot ist bereits aktiv
   - **Zusätzliche Tests:** Nicht nötig
   - **Begründung:** Vollständig durch Dependabot + Security-Workflow abgedeckt

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

## Dependency Management

### Dependabot (GitHub)

**Status:** ✅ **AKTIV**

**Konfiguration:** `.github/dependabot.yml`

**Features:**
- ✅ Wöchentliche Checks (Montags 9:00 Uhr)
- ✅ Automatische PRs für Patch-Updates
- ✅ Gruppierung von Updates
- ✅ Separate PRs für Major-Updates (Breaking Changes)

**Workflow:**
1. Dependabot prüft wöchentlich Dependencies
2. Erstellt PRs für Updates
3. CI läuft automatisch
4. Manuelles Review für Major-Updates

**Zusätzliche Tests:** ❌ Nicht nötig

---

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
- ✅ **95 Test-Dateien** mit 100% Coverage
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
1. Concurrency Tests (Race Conditions)
2. Memory Leak Tests
3. Erweiterte Integration Tests
4. Runtime Error Monitoring Tests

**Mittlere Priorität:**
5. Performance Tests
6. Property-Based Tests (fast-check)
7. Erweiterte Security Tests

**Niedrige Priorität:**
8. Mutation Testing (Stryker)
9. Bundle Size Analysis

### Realistische Erwartungen

**Tests sind wertvoll für:**
- ✅ Regression-Schutz
- ✅ Logik-Korrektheit
- ✅ Dokumentation
- ✅ Edge Cases

**Tests ersetzen NICHT:**
- ❌ Manuelles Testen in Foundry
- ❌ Echte Kompatibilitätstests
- ❌ API-Validierung

**Empfehlung:**
- Fokus auf Tests mit hoher Priorität
- Realistische Erwartungen setzen
- Echte Kompatibilität manuell testen

---

## Integration-Tests: Machbarkeit mit vorhandenen Tools

### ✅ Alle fehlenden Integration-Tests sind mit vorhandenen Tools implementierbar

**Zusammenfassung:**
- **95 Unit-Tests** vorhanden (100% Coverage)
- **2 Integration-Tests** vorhanden
- **5 weitere Integration-Tests** empfohlen
- **Alle empfohlenen Tests können mit vorhandenen Tools implementiert werden**
- **Keine zusätzlichen Tools oder Dependencies erforderlich**

### Vorhandene Test-Infrastruktur

**Test-Framework:**
- ✅ Vitest 3.2.4 (bereits vorhanden)
- ✅ @vitest/coverage-v8 (bereits vorhanden)
- ✅ happy-dom (bereits vorhanden)

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

### Implementierungs-Pattern für Integration-Tests

**1. Hook-Callbacks extrahieren und aufrufen:**
```typescript
// Pattern aus init-solid.test.ts
const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
const initCallback = initCall?.[1] as (() => void) | undefined;
initCallback!(); // Callback manuell aufrufen
```

**2. Foundry-Globals mocken:**
```typescript
const cleanup = withFoundryGlobals({
  game: createMockGame({ version: "13.350" }),
  Hooks: createMockHooks(),
  ui: createMockUI(),
});
// Test code...
cleanup();
```

**3. DOM-Struktur erstellen:**
```typescript
const { container, element } = createMockDOM(
  '<div class="journal-entry" data-entry-id="test-123"></div>',
  ".journal-entry"
);
```

**4. Container bootstrappen:**
```typescript
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
expectResultOk(bootstrapResult);
const containerResult = root.getContainer();
```

**5. Settings mocken:**
```typescript
const mockSettingsGet = vi.fn().mockReturnValue("debug");
const mockSettingsSet = vi.fn();
vi.stubGlobal("game", {
  settings: {
    get: mockSettingsGet,
    set: mockSettingsSet,
    register: vi.fn(),
  },
});
```

### Machbarkeits-Matrix für fehlende Integration-Tests

| Test | Benötigte Tools | Vorhanden? | Status |
|------|-----------------|------------|--------|
| **Journal Visibility End-to-End** | `createMockJournalEntry()`, `createMockDOM()`, `createMockHooks()`, `CompositionRoot` | ✅ Alle vorhanden | ✅ Machbar |
| **Hook-Registrierung + Ausführung** | `createMockHooks()`, Callback-Extraktion | ✅ Alle vorhanden | ✅ Machbar |
| **Cache-Invalidierung Workflow** | `createMockHooks()`, Callback-Extraktion, `createMockJournalEntry()` | ✅ Alle vorhanden | ✅ Machbar |
| **Module-Lifecycle** | `createMockHooks()`, `CompositionRoot`, Callback-Extraktion | ✅ Alle vorhanden | ✅ Machbar |
| **Settings-Änderung + Service-Reaktion** | `game.settings` Mock, `onChange` Callbacks | ✅ Alle vorhanden | ✅ Machbar |

### Referenz-Beispiele

**Bestehende Integration-Tests als Referenz:**
1. `src/__tests__/integration/full-bootstrap.test.ts` - Zeigt Bootstrap-Pattern
2. `src/observability/trace/__tests__/TraceContext.integration.test.ts` - Zeigt DI-Integration
3. `src/core/__tests__/init-solid.test.ts` - Zeigt Hook-Callback-Extraktion (Zeile 54-64)

**Unit-Tests mit relevanten Patterns:**
- `src/core/hooks/__tests__/render-journal-directory-hook.test.ts` - Zeigt Hook-Callback-Aufruf
- `src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts` - Zeigt Cache-Invalidierung
- `src/foundry/ports/v13/__tests__/FoundrySettingsPort.test.ts` - Zeigt Settings-Mocking

### Fazit

**✅ Alle fehlenden Integration-Tests können mit vorhandenen Tools implementiert werden!**

- Keine zusätzlichen Dependencies erforderlich
- Alle benötigten Mock-Utilities vorhanden
- Bewährte Patterns in bestehenden Tests dokumentiert
- Implementierungsaufwand: 3-5 Stunden (siehe Priorisierung)

---

## Phase 3: E2E (End-to-End) Tests

### Übersicht

**Status:** ⚠️ Noch nicht implementiert, Planung vorhanden

**Ziel:**
E2E-Tests stellen sicher, dass das Modul in einer realen Foundry VTT-Instanz inkl. UI (Svelte, Cytoscape, @xyflow/svelte) erwartungsgemäß funktioniert. Sie dienen als Absicherung für UI-/Environment-Pfade, die in Unit-/Integration-Tests nicht sinnvoll abbildbar sind.

**Test-Pyramide:**
- **Phase 1:** Unit Tests ✅ (95 Tests, 100% Coverage)
- **Phase 2:** Integration Tests ✅ (2 vorhanden, 5 empfohlen)
- **Phase 3:** E2E Tests ⚠️ (noch nicht implementiert)

### Warum E2E-Tests?

**Was E2E-Tests abdecken:**
- ✅ Reale Browser-Umgebung (DOM, Events, Rendering)
- ✅ Svelte-Komponenten-Rendering
- ✅ Cytoscape.js Graph-Visualisierung
- ✅ @xyflow/svelte Graph-Interaktionen
- ✅ Foundry UI-Integration (Notifications, Settings UI)
- ✅ Journal-Directory DOM-Manipulation
- ✅ Browser-Console-Errors
- ✅ Cross-Browser-Kompatibilität

**Was E2E-Tests NICHT ersetzen:**
- ❌ Unit-Tests (Logik-Tests)
- ❌ Integration-Tests (Service-Interaktionen)
- ❌ Manuelles Testen (Explorative Tests)

### Tools und Setup

#### 1. Playwright (Empfohlen)

**Warum Playwright?**
- ✅ Moderne, stabile Browser-Automation
- ✅ Multi-Browser-Support (Chromium, Firefox, WebKit)
- ✅ Gute TypeScript-Unterstützung
- ✅ Screenshot/Video-Aufnahme für Debugging
- ✅ Netzwerk-Interception für Mocking
- ✅ Auto-Waiting (weniger Flaky-Tests)

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Alternative Tools:**
- **Puppeteer** - Ähnlich, aber weniger Features
- **Cypress** - Gut für Web-Apps, aber weniger geeignet für Foundry (iframe-Probleme)
- **Selenium** - Veraltet, nicht empfohlen

#### 2. Foundry VTT Setup

**Voraussetzungen:**
- ✅ Lokale Foundry VTT-Installation
- ✅ Testwelt mit aktiviertem Modul
- ✅ Fester Port (z.B. `http://localhost:30001`)
- ✅ Testdaten (Actors, Journals) vorbereitet

**Setup-Schritte:**
1. Foundry VTT starten
2. Testwelt erstellen/öffnen
3. Modul installieren und aktivieren
4. Testdaten vorbereiten (optional)
5. Port notieren (für Playwright-Config)

### Projekt-Struktur

```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── foundry-fixtures.ts      # Foundry-spezifische Fixtures
│   │   └── test-data.ts             # Testdaten (Actors, Journals)
│   ├── helpers/
│   │   ├── foundry-helpers.ts       # Helper-Funktionen für Foundry-API
│   │   └── ui-helpers.ts            # Helper für UI-Interaktionen
│   ├── bootstrap.spec.ts             # Bootstrap & Initialisierung
│   ├── journal-visibility.spec.ts   # Journal-Entry-Verstecken
│   ├── relationships.spec.ts        # Beziehungsnetzwerke
│   ├── settings.spec.ts              # Settings-UI
│   └── notifications.spec.ts        # Notification-System
├── playwright.config.ts              # Playwright-Konfiguration
└── .env.example                      # Environment-Variablen
```

### Playwright-Konfiguration

**`playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.FOUNDRY_URL || 'http://localhost:30001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional: Firefox & WebKit für Cross-Browser-Tests
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  webServer: {
    // Optional: Foundry automatisch starten
    // command: 'node scripts/start-foundry.mjs',
    // port: 30001,
    // reuseExistingServer: !process.env.CI,
  },
});
```

**Environment-Variablen (`.env`):**
```bash
FOUNDRY_URL=http://localhost:30001
FOUNDRY_USERNAME=test-user
FOUNDRY_PASSWORD=test-password
FOUNDRY_WORLD=test-world
```

### E2E-Test-Szenarien

#### 1. Bootstrap & Initialisierung

**Datei:** `tests/e2e/bootstrap.spec.ts`

**Szenarien:**
- ✅ Modul lädt ohne JavaScript-Errors
- ✅ API ist verfügbar (`game.modules.get(...).api`)
- ✅ Alle Services resolvable
- ✅ Hooks registriert
- ✅ Settings registriert
- ✅ Keine Browser-Console-Errors

**Beispiel:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Module Bootstrap', () => {
  test('should load module without errors', async ({ page }) => {
    // Console-Errors sammeln
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Foundry-Seite öffnen
    await page.goto('/');
    
    // Warten bis Modul geladen ist
    await page.waitForFunction(() => {
      const mod = (window as any).game?.modules?.get('fvtt_relationship_app_module');
      return mod?.active === true;
    });

    // API prüfen
    const api = await page.evaluate(() => {
      return (window as any).game.modules.get('fvtt_relationship_app_module').api;
    });

    expect(api).toBeDefined();
    expect(api.version).toBeDefined();
    expect(api.resolve).toBeDefined();
    expect(api.resolveWithError).toBeDefined();

    // Keine JavaScript-Errors
    expect(errors).toHaveLength(0);
  });
});
```

#### 2. Journal Visibility

**Datei:** `tests/e2e/journal-visibility.spec.ts`

**Szenarien:**
- ✅ Journal-Entry mit Flag wird versteckt
- ✅ Journal-Entry ohne Flag bleibt sichtbar
- ✅ Journal-Directory wird korrekt gefiltert
- ✅ DOM-Elemente werden entfernt

**Beispiel:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Journal Visibility', () => {
  test('should hide journal entries with hidden flag', async ({ page }) => {
    await page.goto('/');
    
    // Journal-Entry mit Flag erstellen
    await page.evaluate(async () => {
      const entry = await JournalEntry.create({
        name: 'Hidden Entry',
        flags: {
          'fvtt_relationship_app_module': {
            hidden: true,
          },
        },
      });
      return entry.id;
    });

    // Journal-Directory öffnen
    await page.click('[data-action="journal"]');
    await page.waitForSelector('.journal-directory');

    // Entry sollte nicht sichtbar sein
    const entryVisible = await page.locator('[data-entry-id]').count();
    expect(entryVisible).toBe(0);
  });
});
```

#### 3. Beziehungsnetzwerke

**Datei:** `tests/e2e/relationships.spec.ts`

**Szenarien:**
- ✅ Graph-UI öffnet sich
- ✅ Nodes werden korrekt gerendert
- ✅ Edges werden korrekt gerendert
- ✅ Interaktionen funktionieren (Drag, Zoom, Pan)
- ✅ Filter funktionieren

**Beispiel:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Relationship Networks', () => {
  test('should render relationship graph', async ({ page }) => {
    await page.goto('/');
    
    // Graph-UI öffnen (abhängig von Implementierung)
    await page.click('[data-action="open-relationship-graph"]');
    
    // Warten bis Graph geladen ist
    await page.waitForSelector('.relationship-graph');
    
    // Nodes prüfen
    const nodes = await page.locator('.relationship-node').count();
    expect(nodes).toBeGreaterThan(0);
    
    // Cytoscape-Container prüfen
    const cytoscapeContainer = await page.locator('#cytoscape-container');
    await expect(cytoscapeContainer).toBeVisible();
  });
});
```

#### 4. Settings-UI

**Datei:** `tests/e2e/settings.spec.ts`

**Szenarien:**
- ✅ Settings-UI öffnet sich
- ✅ Settings können geändert werden
- ✅ Änderungen werden gespeichert
- ✅ `onChange` Callbacks werden ausgelöst

**Beispiel:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Settings UI', () => {
  test('should change log level setting', async ({ page }) => {
    await page.goto('/');
    
    // Settings öffnen
    await page.click('[data-action="configure"]');
    await page.waitForSelector('.module-settings');
    
    // Log-Level ändern
    await page.selectOption('[name="logLevel"]', '2'); // WARN
    
    // Speichern
    await page.click('button[type="submit"]');
    
    // Prüfen dass Setting gespeichert wurde
    const logLevel = await page.evaluate(() => {
      return (window as any).game.settings.get(
        'fvtt_relationship_app_module',
        'logLevel'
      );
    });
    
    expect(logLevel).toBe(2);
  });
});
```

#### 5. Notifications

**Datei:** `tests/e2e/notifications.spec.ts`

**Szenarien:**
- ✅ Error-Notifications werden angezeigt
- ✅ Info-Notifications werden angezeigt
- ✅ Notifications verschwinden automatisch
- ✅ Keine unerwarteten Notifications

**Beispiel:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test('should display error notification', async ({ page }) => {
    await page.goto('/');
    
    // Fehler provozieren (z.B. inkompatible Version)
    await page.evaluate(() => {
      const api = (window as any).game.modules.get('fvtt_relationship_app_module').api;
      // Fehler auslösen
    });
    
    // Notification prüfen
    await page.waitForSelector('.notification.error');
    const notificationText = await page.textContent('.notification.error');
    expect(notificationText).toContain('Error');
  });
});
```

### Helper-Funktionen

**`tests/e2e/helpers/foundry-helpers.ts`:**
```typescript
import { Page } from '@playwright/test';

export async function waitForModuleLoaded(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const mod = (window as any).game?.modules?.get('fvtt_relationship_app_module');
    return mod?.active === true && mod?.api !== undefined;
  });
}

export async function getModuleAPI(page: Page): Promise<any> {
  return await page.evaluate(() => {
    return (window as any).game.modules.get('fvtt_relationship_app_module').api;
  });
}

export async function createTestJournalEntry(
  page: Page,
  name: string,
  flags?: Record<string, unknown>
): Promise<string> {
  return await page.evaluate(
    async ({ name, flags }) => {
      const entry = await JournalEntry.create({
        name,
        flags: flags || {},
      });
      return entry.id;
    },
    { name, flags }
  );
}
```

### NPM-Scripts

**`package.json`:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### CI/CD-Integration

**⚠️ Wichtig:** Foundry VTT ist proprietäre Software und kann **nicht** als Docker-Container in GitHub Actions bereitgestellt werden. E2E-Tests müssen daher **lokal** ausgeführt werden.

**Empfohlene Strategie:**

#### Option 1: Lokale E2E-Tests (Empfohlen)

E2E-Tests werden **nur lokal** ausgeführt, nicht in CI/CD:

**Vorteile:**
- ✅ Keine Lizenz-Probleme
- ✅ Vollständige Kontrolle über Foundry-Instanz
- ✅ Schnellere Test-Ausführung
- ✅ Einfacheres Debugging

**Workflow:**
```bash
# Vor jedem Commit/PR lokal ausführen
npm run test:e2e
```

**GitHub Actions (nur für Unit/Integration-Tests):**
```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit and integration tests
        run: npm test
      
      - name: Run coverage
        run: npm run test:coverage
```

#### Option 2: Self-Hosted Runner (Optional)

Falls ein eigener Server mit Foundry verfügbar ist:

**GitHub Actions mit Self-Hosted Runner:**
```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch: # Manuell auslösbar

jobs:
  e2e:
    runs-on: self-hosted # Läuft auf eigenem Server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build module
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          FOUNDRY_URL: http://localhost:30001 # Foundry muss auf Server laufen
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

**Voraussetzungen:**
- Eigenes Server-Setup erforderlich
- Foundry VTT muss installiert und laufend sein
- Sicherheits-Überlegungen (Self-Hosted Runner)

#### Option 3: Manuelle E2E-Tests (Minimal)

E2E-Tests werden **nur manuell** vor Releases ausgeführt:

**Checklist vor Release:**
- [ ] Lokale E2E-Tests ausführen (`npm run test:e2e`)
- [ ] Alle Szenarien manuell testen
- [ ] Browser-Console auf Errors prüfen
- [ ] Cross-Browser-Tests (optional)

**Dokumentation:**
```markdown
## Pre-Release Checklist

1. Unit & Integration Tests: ✅ (laufen in CI/CD)
2. E2E Tests: ⚠️ (lokal ausführen)
3. Manuelle Tests: ⚠️ (in Foundry testen)
```

### Empfohlene CI/CD-Strategie

**Für dieses Projekt:**

1. **CI/CD Pipeline (GitHub Actions):**
   - ✅ Unit Tests
   - ✅ Integration Tests
   - ✅ Type Checking
   - ✅ Linting
   - ✅ Code Coverage
   - ❌ E2E Tests (lokal)

2. **Lokale Pre-Commit Checks:**
   - ✅ Unit/Integration Tests (`npm test`)
   - ✅ Code Quality (`npm run check-all`)
   - ⚠️ E2E Tests (`npm run test:e2e`) - optional, vor größeren Commits

3. **Pre-Release Checklist:**
   - ✅ Alle CI/CD Checks bestanden
   - ⚠️ E2E Tests lokal ausgeführt
   - ⚠️ Manuelle Tests in Foundry

**GitHub Actions Workflow (final):**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit and integration tests
        run: npm test
      
      - name: Run coverage
        run: npm run test:coverage
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      # E2E Tests werden NICHT in CI/CD ausgeführt
      # Siehe: docs/TEST-STRATEGY.md - Phase 3: E2E Tests
```

**Hinweis in README/Contributing:**
```markdown
## E2E Tests

E2E-Tests müssen lokal ausgeführt werden, da Foundry VTT nicht in CI/CD verfügbar ist:

```bash
# Vor größeren Commits/PRs
npm run test:e2e
```

### Best Practices

**1. Test-Isolation:**
- ✅ Jeder Test sollte unabhängig sein
- ✅ Testdaten vor/nach jedem Test aufräumen
- ✅ Keine Abhängigkeiten zwischen Tests

**2. Warte-Strategien:**
- ✅ `page.waitForSelector()` statt `page.waitForTimeout()`
- ✅ `page.waitForFunction()` für komplexe Bedingungen
- ✅ Auto-Waiting von Playwright nutzen

**3. Selektoren:**
- ✅ Data-Attribute bevorzugen (`[data-testid="..."]`)
- ✅ Stabile Selektoren (nicht CSS-Klassen die sich ändern)
- ✅ Page Object Model für komplexe UIs

**4. Debugging:**
- ✅ Screenshots bei Fehlern (`screenshot: 'only-on-failure'`)
- ✅ Videos bei Fehlern (`video: 'retain-on-failure'`)
- ✅ Trace-Viewer für detaillierte Analyse (`trace: 'on-first-retry'`)

**5. Performance:**
- ✅ Tests parallelisieren (`fullyParallel: true`)
- ✅ Nur notwendige Browser testen (Chromium für Start)
- ✅ Timeouts angemessen setzen

### Herausforderungen und Lösungen

**1. Foundry-Instanz starten:**
- **Problem:** Foundry muss laufen (lokal)
- **Lösung:** Lokale Foundry-Instanz starten
- **⚠️ CI/CD:** Nicht möglich (Foundry ist proprietär, kein Docker-Image verfügbar)
- **Alternative:** Self-Hosted Runner (falls eigener Server verfügbar)

**2. Testdaten vorbereiten:**
- **Problem:** Actors, Journals müssen existieren
- **Lösung:** Fixtures mit Testdaten erstellen
- **Alternative:** API-basiert erstellen (langsamer)

**3. Flaky-Tests:**
- **Problem:** Timing-Probleme, Race Conditions
- **Lösung:** Auto-Waiting, explizite Waits
- **Alternative:** Retries in CI/CD

**4. Cross-Browser-Tests:**
- **Problem:** Unterschiedliche Browser-Verhalten
- **Lösung:** Chromium für Start, optional Firefox/WebKit
- **Alternative:** Nur Chromium (Foundry nutzt primär Chromium)

### Priorisierung

**Hohe Priorität:**
1. ✅ Bootstrap & Initialisierung
2. ✅ Journal Visibility (Hauptfeature)
3. ✅ Notifications (Fehlerbehandlung)

**Mittlere Priorität:**
4. ⚠️ Settings-UI
5. ⚠️ Beziehungsnetzwerke (wenn UI fertig)

**Niedrige Priorität:**
6. ⚠️ Cross-Browser-Tests
7. ⚠️ Performance-Tests

### Aufwand-Schätzung

- **Setup:** 4-6 Stunden
  - Playwright-Installation & Konfiguration
  - Foundry-Setup
  - Helper-Funktionen
  - CI/CD-Integration

- **Bootstrap-Tests:** 2-3 Stunden
- **Journal Visibility Tests:** 3-4 Stunden
- **Settings-Tests:** 2-3 Stunden
- **Relationship-Tests:** 4-6 Stunden (wenn UI fertig)

**Gesamtaufwand:** ~15-22 Stunden

### Status und nächste Schritte

**Aktueller Status:**
- ⚠️ E2E-Tests noch nicht implementiert
- ✅ Planung vorhanden (`docs/quality-gates/no-ignores/06-e2e-tests.md`)
- ✅ Tools identifiziert (Playwright)
- ✅ Szenarien definiert

**Nächste Schritte:**
1. Playwright installieren
2. Playwright-Konfiguration erstellen
3. Foundry-Test-Setup vorbereiten (lokal)
4. Bootstrap-Tests implementieren
5. Journal Visibility Tests implementieren
6. Lokale Test-Dokumentation (CI/CD nicht möglich)

---

## Verwandte Dokumentation

- **Testing Guide:** `docs/TESTING.md` - Praktische Test-Anleitung
- **Quality Gates:** `docs/quality-gates/` - Coverage-Exclusions, Linter-Exclusions
- **Architecture:** `docs/ARCHITECTURE.md` - Architektur-Übersicht
- **API Documentation:** `docs/API.md` - Öffentliche API

---

**Letzte Aktualisierung:** 2025-01-XX  
**Nächste Review:** Bei Änderungen an Test-Strategie oder neuen Tools

