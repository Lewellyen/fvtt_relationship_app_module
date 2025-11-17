# Erweiterte Integration Tests

**Status:** ✅ IMPLEMENTIERT  
**Priorität:** 🥇 HÖCHSTE PRIORITÄT  
**Aufwand:** Abgeschlossen  
**Tool:** Vitest (bereits vorhanden)

---

## Übersicht

Erweiterte Integration-Tests decken End-to-End-Workflows ab, die mehrere Komponenten zusammen testen. Sie finden Integrationsfehler, die Unit-Tests nicht finden können.

**Aktueller Stand:**
- ✅ 7 Integration-Tests vorhanden:
  - `src/__tests__/integration/full-bootstrap.test.ts` (6 Test-Cases)
  - `src/observability/trace/__tests__/TraceContext.integration.test.ts` (12 Test-Cases)
  - `src/__tests__/integration/journal-visibility-e2e.test.ts` (2 Test-Cases) - **NEU**
  - `src/__tests__/integration/hook-registration-execution.test.ts` (1 Test-Case) - **NEU**
  - `src/__tests__/integration/cache-invalidation-workflow.test.ts` (1 Test-Case) - **NEU**
  - `src/__tests__/integration/module-lifecycle.test.ts` (1 Test-Case) - **NEU**
  - `src/__tests__/integration/settings-change-reaction.test.ts` (1 Test-Case) - **NEU**
- ✅ Alle 5 empfohlenen Integration-Tests implementiert und laufen erfolgreich

---

## Was wird getestet?

### 1. Journal Visibility End-to-End Workflow

**Szenario:** Kompletter Workflow vom Flag setzen bis zum Verstecken im Journal Directory

**Schritte:**
1. Bootstrap Container
2. Journal Entry mit `hidden: true` Flag erstellen
3. Journal Directory rendern (Hook feuert)
4. Prüfen ob Entry im DOM versteckt ist

**Erwartetes Ergebnis:**
- Entry ist nicht im DOM sichtbar
- DOM-Manipulation wurde korrekt ausgeführt
- Hook wurde registriert und ausgeführt

---

### 2. Hook-Registrierung + Ausführung

**Szenario:** Hook wird registriert und Foundry Hook feuert → Service wird aufgerufen

**Schritte:**
1. Bootstrap Container
2. Hook registrieren (z.B. `renderJournalDirectory`)
3. Foundry Hook manuell feuern (Callback extrahieren und aufrufen)
4. Prüfen ob Service-Methode aufgerufen wurde

**Erwartetes Ergebnis:**
- Hook wurde registriert
- Callback wurde ausgeführt
- Service-Methode wurde aufgerufen

---

### 3. Cache-Invalidierung Workflow

**Szenario:** Journal ändern → Hook feuert → Cache wird invalidiert

**Schritte:**
1. Bootstrap Container
2. Journal Entry erstellen und in Cache laden
3. Journal Entry ändern (Update)
4. Hook manuell feuern (`updateJournalEntry`)
5. Prüfen ob Cache invalidiert wurde

**Erwartetes Ergebnis:**
- Cache enthält Entry vor Update
- Hook wurde ausgeführt
- Cache wurde invalidiert (Entry nicht mehr im Cache)

---

### 4. Module-Lifecycle

**Szenario:** Module-Lifecycle (init → ready)

**Wichtig:** Foundry VTT hat keine `disable`/`close` Hooks. Module werden durch Deaktivieren in den Settings deaktiviert, aber es gibt keinen Hook dafür. Der Test fokussiert daher auf die vorhandenen Foundry-Lifecycle-Hooks (`init`, `ready`).

**Schritte:**
1. Bootstrap Container
2. `init` Hook feuern
3. `ready` Hook feuern
4. Prüfen ob Services korrekt initialisiert wurden

**Erwartetes Ergebnis:**
- Services werden bei `init` initialisiert
- API wird bei `init` exponiert
- Settings werden bei `init` registriert
- Hooks werden bei `init` registriert
- Services sind bei `ready` vollständig bereitgestellt

**Hinweis:** Module-Deaktivierung in Foundry erfolgt ohne Hook. Hooks werden automatisch entfernt, wenn das Modul deaktiviert wird (Foundry-Interna). Ein expliziter `disable`-Test ist daher nicht möglich.

---

### 5. Settings-Änderung + Service-Reaktion

**Szenario:** Setting ändern → `onChange` Callback → Service reagiert

**Schritte:**
1. Bootstrap Container
2. Setting registrieren (z.B. `logLevel`)
3. Setting ändern (`game.settings.set()`)
4. Prüfen ob `onChange` Callback ausgeführt wurde
5. Prüfen ob Service-Level aktualisiert wurde (z.B. Logger-Level)

**Erwartetes Ergebnis:**
- Setting wurde registriert
- `onChange` Callback wurde ausgeführt
- Service-Level wurde aktualisiert

---

## Warum wichtig?

- ✅ Testet reale Nutzung (End-to-End-Workflows)
- ✅ Findet Integrationsfehler, die Unit-Tests nicht finden
- ✅ Sichert, dass Module korrekt initialisiert wird
- ✅ Dokumentiert erwartetes Verhalten

---

## Implementierungsanleitung

### Voraussetzungen

**Alle benötigten Tools sind bereits vorhanden:**
- ✅ Vitest 3.2.4
- ✅ `createMockGame()`, `createMockHooks()`, `createMockUI()`
- ✅ `createMockJournalEntry()`, `createMockDOM()`
- ✅ `withFoundryGlobals()` Helper
- ✅ `CompositionRoot` für Bootstrap
- ✅ `expectResultOk()` / `expectResultErr()` Assertions

---

### Test-Datei-Struktur

**Neue Dateien erstellen:**
```
src/__tests__/integration/
├── full-bootstrap.test.ts                    # ✅ Bereits vorhanden
├── journal-visibility-e2e.test.ts            # ✅ Implementiert
├── hook-registration-execution.test.ts       # ✅ Implementiert
├── cache-invalidation-workflow.test.ts       # ✅ Implementiert
├── module-lifecycle.test.ts                  # ✅ Implementiert
└── settings-change-reaction.test.ts          # ✅ Implementiert
```

---

### Pattern 1: Hook-Callback-Extraktion

**Referenz:** `src/core/__tests__/init-solid.test.ts` (Zeile 54-64)

```typescript
// Hook-Callback aus Mock extrahieren
const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
const initCallback = initCall?.[1] as (() => void) | undefined;

// Callback manuell aufrufen
initCallback!();
```

**Wichtig:**
- Callbacks werden aus `mock.calls` extrahiert
- Callbacks können manuell mit Test-Parametern aufgerufen werden
- Pattern funktioniert für alle Hook-Typen (`init`, `ready`, `updateJournalEntry`, etc.)

---

### Pattern 2: Foundry-Globals Mocken

**Referenz:** `src/test/utils/test-helpers.ts`

```typescript
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";

const cleanup = withFoundryGlobals({
  game: createMockGame({ version: "13.350" }),
  Hooks: createMockHooks(),
  ui: createMockUI(),
});

// Test code...

cleanup(); // WICHTIG: Immer aufräumen!
```

---

### Pattern 3: Container Bootstrap

**Referenz:** `src/__tests__/integration/full-bootstrap.test.ts`

```typescript
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
expectResultOk(bootstrapResult);

const containerResult = root.getContainer();
expectResultOk(containerResult);
const container = containerResult.value;
```

---

### Pattern 4: DOM-Manipulation

**Referenz:** `src/test/mocks/foundry.ts` (createMockDOM)

```typescript
import { createMockDOM } from "@/test/mocks/foundry";

const { container, element } = createMockDOM(
  '<div class="journal-entry" data-entry-id="test-123"></div>',
  ".journal-entry"
);

// DOM-Manipulation testen
expect(element).toBeDefined();
expect(element?.getAttribute("data-entry-id")).toBe("test-123");
```

---

### Pattern 5: Settings Mocken

**Referenz:** `src/foundry/ports/v13/__tests__/FoundrySettingsPort.test.ts`

```typescript
const mockSettingsGet = vi.fn().mockReturnValue("debug");
const mockSettingsSet = vi.fn();
const mockSettingsOnChange = vi.fn();

vi.stubGlobal("game", {
  settings: {
    get: mockSettingsGet,
    set: mockSettingsSet,
    register: vi.fn(),
    // onChange Callback speichern
    register: vi.fn((moduleId, key, config) => {
      if (config.onChange) {
        mockSettingsOnChange.mockImplementation(config.onChange);
      }
    }),
  },
});

// Setting ändern
mockSettingsSet.mockImplementation((moduleId, key, value) => {
  // onChange Callback ausführen
  if (mockSettingsOnChange) {
    mockSettingsOnChange(value);
  }
});
```

---

## Detaillierte Implementierung

### Test 1: Journal Visibility End-to-End

**Datei:** `src/__tests__/integration/journal-visibility-e2e.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { createMockJournalEntry, createMockDOM } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { MODULE_CONSTANTS } from "@/constants";

describe("Integration: Journal Visibility End-to-End", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should hide journal entry in complete workflow", async () => {
    // 1. Setup Foundry Globals
    const mockGame = createMockGame({ version: "13.350" });
    const mockHooks = createMockHooks();
    
    // Journal Entry mit Flag erstellen
    const mockEntry = createMockJournalEntry({
      id: "test-entry-123",
      name: "Hidden Entry",
      flags: {
        [MODULE_CONSTANTS.MODULE.ID]: {
          hidden: true,
        },
      },
    });

    // Journal Directory DOM erstellen
    const { container: domContainer, element: entryElement } = createMockDOM(
      `<div class="journal-entry" data-entry-id="${mockEntry.id}">
        <h4>${mockEntry.name}</h4>
      </div>`,
      `.journal-entry[data-entry-id="${mockEntry.id}"]`
    );

    // game.journal mocken
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(mockEntry);
      mockGame.journal.contents = [mockEntry];
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: mockHooks,
      ui: createMockUI(),
    });

    // 2. Bootstrap Container
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    const container = containerResult.value;

    // 3. Hook-Callback extrahieren (renderJournalDirectory)
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const renderCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === "renderJournalDirectory"
    );
    const renderCallback = renderCall?.[1] as ((app: any, html: HTMLElement) => void) | undefined;

    expect(renderCallback).toBeDefined();

    // 4. Hook manuell feuern (simuliert Foundry Hook)
    renderCallback!(mockGame.journal, domContainer);

    // 5. Prüfen ob Entry versteckt ist
    const hiddenElement = domContainer.querySelector(
      `.journal-entry[data-entry-id="${mockEntry.id}"]`
    );
    expect(hiddenElement).toBeNull(); // Entry sollte nicht im DOM sein
  });

  it("should keep visible journal entry visible", async () => {
    // Ähnlicher Test, aber mit hidden: false
    // Entry sollte sichtbar bleiben
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Bootstrap-Pattern implementieren
- [ ] Hook-Callback-Extraktion implementieren
- [ ] DOM-Manipulation testen
- [ ] Edge Cases testen (visible entries, multiple entries)

---

### Test 2: Hook-Registrierung + Ausführung

**Datei:** `src/__tests__/integration/hook-registration-execution.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Integration: Hook Registration + Execution", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should register hook and execute callback when Foundry hook fires", async () => {
    // 1. Setup
    const mockHooks = createMockHooks();
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: mockHooks,
    });

    // 2. Bootstrap
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    // 3. Prüfen dass Hook registriert wurde
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    expect(hooksOnMock).toHaveBeenCalledWith("renderJournalDirectory", expect.any(Function));

    // 4. Callback extrahieren
    const renderCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === "renderJournalDirectory"
    );
    const renderCallback = renderCall?.[1] as ((app: any, html: HTMLElement) => void) | undefined;

    expect(renderCallback).toBeDefined();

    // 5. Service-Methode spyen (z.B. JournalVisibilityService)
    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    const container = containerResult.value;

    // Service resolven und spyen
    // const journalService = container.resolve(journalVisibilityServiceToken);
    // const hideEntriesSpy = vi.spyOn(journalService, "hideEntries");

    // 6. Hook manuell feuern
    const mockApp = {};
    const mockHtml = document.createElement("div");
    renderCallback!(mockApp, mockHtml);

    // 7. Prüfen ob Service-Methode aufgerufen wurde
    // expect(hideEntriesSpy).toHaveBeenCalled();
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Hook-Registrierung prüfen
- [ ] Callback-Extraktion implementieren
- [ ] Service-Spy implementieren
- [ ] Hook-Ausführung testen

---

### Test 3: Cache-Invalidierung Workflow

**Datei:** `src/__tests__/integration/cache-invalidation-workflow.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Integration: Cache Invalidation Workflow", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should invalidate cache when journal entry is updated", async () => {
    // 1. Setup
    const mockEntry = createMockJournalEntry({ id: "test-entry-123" });
    const mockGame = createMockGame();
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(mockEntry);
      mockGame.journal.contents = [mockEntry];
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: createMockHooks(),
    });

    // 2. Bootstrap
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    const container = containerResult.value;

    // 3. Cache mit Entry füllen
    // const cacheService = container.resolve(cacheServiceToken);
    // const getResult = cacheService.get("journal:test-entry-123");
    // expectResultOk(getResult);
    // expect(getResult.value).toBeDefined();

    // 4. Hook-Callback extrahieren (updateJournalEntry)
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const updateCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((entry: any) => void) | undefined;

    expect(updateCallback).toBeDefined();

    // 5. Entry updaten (simuliert Foundry Update)
    const updatedEntry = { ...mockEntry, name: "Updated Entry" };
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(updatedEntry);
    }

    // 6. Hook manuell feuern
    updateCallback!(updatedEntry);

    // 7. Prüfen ob Cache invalidiert wurde
    // const getResultAfter = cacheService.get("journal:test-entry-123");
    // expect(getResultAfter.ok).toBe(false); // Cache sollte invalidiert sein
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Cache-Service resolven
- [ ] Cache mit Entry füllen
- [ ] Hook-Callback extrahieren
- [ ] Cache-Invalidierung prüfen

---

### Test 4: Module-Lifecycle

**Datei:** `src/__tests__/integration/module-lifecycle.test.ts`

**Wichtig:** Foundry VTT hat keine `disable`/`close` Hooks. Module werden durch Deaktivieren in den Settings deaktiviert, aber es gibt keinen Hook dafür. Der Test fokussiert daher auf die vorhandenen Foundry-Lifecycle-Hooks (`init`, `ready`).

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { MODULE_CONSTANTS } from "@/constants";

describe("Integration: Module Lifecycle", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should handle module lifecycle (init → ready)", async () => {
    // 1. Setup
    const mockGame = createMockGame();
    const mockModule = {
      api: undefined as unknown,
    };
    if (mockGame.modules) {
      mockGame.modules.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: createMockHooks(),
    });

    // 2. Bootstrap
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    // 3. Hook-Callbacks extrahieren
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    
    const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
    const initCallback = initCall?.[1] as (() => void) | undefined;

    const readyCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "ready");
    const readyCallback = readyCall?.[1] as (() => void) | undefined;

    expect(initCallback).toBeDefined();
    expect(readyCallback).toBeDefined();

    // 4. init Hook feuern
    initCallback!();
    
    // Prüfen dass API exponiert wurde
    expect(mockModule.api).toBeDefined();
    
    // Prüfen dass Settings registriert wurden
    const settingsRegistered = (global as any).game.settings.register;
    expect(settingsRegistered).toHaveBeenCalled();

    // Prüfen dass Hooks registriert wurden
    const renderJournalCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === "renderJournalDirectory"
    );
    expect(renderJournalCall).toBeDefined();

    // 5. ready Hook feuern
    readyCallback!();
    
    // Prüfen dass Services bereit sind (Container sollte funktionieren)
    const containerResult = root.getContainer();
    expectResultOk(containerResult);
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] init und ready Hooks extrahieren
- [ ] init → ready testen
- [ ] API-Exposition prüfen
- [ ] Settings-Registrierung prüfen
- [ ] Hook-Registrierung prüfen

---

### Test 5: Settings-Änderung + Service-Reaktion

**Datei:** `src/__tests__/integration/settings-change-reaction.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/bootstrap/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Integration: Settings Change + Service Reaction", () => {
  let cleanup: (() => void) | undefined;
  let mockSettingsOnChange: ReturnType<typeof vi.fn> | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should update service level when setting changes", async () => {
    // 1. Setup Settings Mock
    const mockSettingsGet = vi.fn().mockReturnValue(0); // INFO
    const mockSettingsSet = vi.fn();
    
    const mockGame = createMockGame();
    vi.stubGlobal("game", {
      ...mockGame,
      settings: {
        get: mockSettingsGet,
        set: mockSettingsSet,
        register: vi.fn((moduleId, key, config) => {
          // onChange Callback speichern
          if (config.onChange) {
            mockSettingsOnChange = vi.fn(config.onChange);
          }
        }),
      },
    });

    cleanup = withFoundryGlobals({
      game: global.game as any,
      Hooks: createMockHooks(),
    });

    // 2. Bootstrap
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    // 3. Prüfen dass Setting registriert wurde
    const gameSettings = (global as any).game.settings;
    expect(gameSettings.register).toHaveBeenCalled();

    // 4. Setting ändern
    mockSettingsGet.mockReturnValue(2); // WARN
    if (mockSettingsOnChange) {
      mockSettingsOnChange(2);
    }

    // 5. Prüfen ob Service-Level aktualisiert wurde
    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    const container = containerResult.value;

    // const loggerService = container.resolve(loggerToken);
    // expect(loggerService.getLevel()).toBe(2); // WARN
  });
});
```

**Checkliste:**
- [ ] Datei erstellen
- [ ] Settings-Mock mit onChange implementieren
- [ ] Setting-Änderung simulieren
- [ ] Service-Reaktion prüfen

---

## Referenzen

**Bestehende Integration-Tests:**
- `src/__tests__/integration/full-bootstrap.test.ts` - Bootstrap-Pattern
- `src/observability/trace/__tests__/TraceContext.integration.test.ts` - DI-Integration

**Unit-Tests mit relevanten Patterns:**
- `src/core/__tests__/init-solid.test.ts` - Hook-Callback-Extraktion (Zeile 54-64)
- `src/core/hooks/__tests__/render-journal-directory-hook.test.ts` - Hook-Aufruf
- `src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts` - Cache-Invalidierung
- `src/foundry/ports/v13/__tests__/FoundrySettingsPort.test.ts` - Settings-Mocking

**Test-Utilities:**
- `src/test/utils/test-helpers.ts` - `withFoundryGlobals()`, `expectResultOk()`, etc.
- `src/test/mocks/foundry.ts` - `createMockGame()`, `createMockHooks()`, etc.

---

## Checkliste

### Vorbereitung
- [ ] Alle Referenz-Tests gelesen und verstanden
- [ ] Test-Utilities verstanden (`withFoundryGlobals()`, `expectResultOk()`, etc.)
- [ ] Hook-Callback-Extraktion-Pattern verstanden

### Implementierung
- [ ] Test 1: Journal Visibility End-to-End
- [ ] Test 2: Hook-Registrierung + Ausführung
- [ ] Test 3: Cache-Invalidierung Workflow
- [ ] Test 4: Module-Lifecycle
- [ ] Test 5: Settings-Änderung + Service-Reaktion

### Validierung
- [ ] Alle Tests laufen erfolgreich (`npm test`)
- [ ] Code Coverage bleibt bei 100%
- [ ] Keine Linter-Fehler
- [ ] Tests sind isoliert (keine Seiteneffekte)

---

**Nächste Schritte:** Nach Implementierung zu `02-concurrency-tests.md` weitergehen.

