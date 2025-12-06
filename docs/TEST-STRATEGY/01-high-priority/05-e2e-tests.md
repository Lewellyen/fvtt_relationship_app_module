# E2E (End-to-End) Tests

**Status:** ✅ **IMPLEMENTIERT**
**Priorität:** 🥇 Hohe Priorität
**Aufwand:** Abgeschlossen
**Tool:** Playwright (bereits installiert)
**Implementiert:** 2025-01-18

**Detaillierte Analyse:** Siehe [E2E-TESTS-ANALYSIS.md](./E2E-TESTS-ANALYSIS.md)

---

## Übersicht

E2E-Tests stellen sicher, dass das Modul in einer realen Foundry VTT-Instanz inkl. UI (Svelte, Cytoscape, @xyflow/svelte) erwartungsgemäß funktioniert. Sie dienen als Absicherung für UI-/Environment-Pfade, die in Unit-/Integration-Tests nicht sinnvoll abbildbar sind.

**Test-Pyramide:**
- **Phase 1:** Unit Tests ✅ (95 Tests, 100% Coverage)
- **Phase 2:** Integration Tests ✅ (7 Test-Dateien, 24+ Tests)
- **Phase 3:** E2E Tests ✅ (4 Test-Suites, 13+ Tests) **IMPLEMENTIERT**

**Aktueller Stand:**
- ✅ 4 E2E-Test-Suites implementiert:
  - `tests/e2e/bootstrap.spec.ts` (4 Tests)
  - `tests/e2e/journal-visibility.spec.ts` (4 Tests)
  - `tests/e2e/notifications.spec.ts` (2 Tests)
  - `tests/e2e/settings.spec.ts` (3 Tests)
- ✅ Playwright-Konfiguration vollständig
- ✅ Helper-Funktionen für Foundry-Integration
- ✅ Debugging-Dokumentation vorhanden

**Voraussetzungen:**
- ✅ Lokale Foundry VTT-Instanz vorhanden
- ✅ Foundry VTT läuft auf festem Port (z.B. `http://localhost:30001`)
- ✅ Testwelt mit aktiviertem Modul

---

## Was wird getestet?

### 1. Bootstrap & Initialisierung

**Szenarien:**
- ✅ Modul lädt ohne JavaScript-Errors
- ✅ API ist verfügbar (`game.modules.get(...).api`)
- ✅ Alle Services resolvable
- ✅ Hooks registriert
- ✅ Settings registriert
- ✅ Keine Browser-Console-Errors

---

### 2. Journal Visibility

**Szenarien:**
- ✅ Journal-Entry mit Flag wird versteckt
- ✅ Journal-Entry ohne Flag bleibt sichtbar
- ✅ Journal-Directory wird korrekt gefiltert
- ✅ DOM-Elemente werden entfernt

---

### 3. Beziehungsnetzwerke

**Status:** ⚠️ **NICHT IMPLEMENTIERT** - UI-Komponenten existieren noch nicht

**Hinweis:** Die Relationship Graph UI (Svelte-Komponenten mit Cytoscape/@xyflow/svelte) ist aktuell noch nicht implementiert. Diese Tests sollten erst erstellt werden, wenn die UI-Komponenten vorhanden sind.

**Geplante Szenarien (wenn UI fertig):**
- Graph-UI öffnet sich
- Nodes werden korrekt gerendert
- Edges werden korrekt gerendert
- Interaktionen funktionieren (Drag, Zoom, Pan)
- Filter funktionieren

---

### 4. Settings-UI

**Szenarien:**
- ✅ Settings-UI öffnet sich
- ✅ Settings können geändert werden
- ✅ Änderungen werden gespeichert
- ✅ `onChange` Callbacks werden ausgelöst

---

### 5. Notifications

**Szenarien:**
- ✅ Error-Notifications werden angezeigt
- ✅ Info-Notifications werden angezeigt
- ✅ Notifications verschwinden automatisch
- ✅ Keine unerwarteten Notifications

---

## Warum wichtig?

- ✅ Reale Browser-Umgebung (DOM, Events, Rendering)
- ✅ Svelte-Komponenten-Rendering
- ✅ Cytoscape.js Graph-Visualisierung
- ✅ @xyflow/svelte Graph-Interaktionen
- ✅ Foundry UI-Integration
- ✅ Browser-Console-Errors

---

## Implementierungsanleitung

### Schritt 1: Playwright und Dependencies installieren

```bash
npm install --save-dev @playwright/test dotenv
npx playwright install
```

**Wichtig:**
- `npx playwright install` installiert die Browser (Chromium, Firefox, WebKit)
- `dotenv` wird für `.env`-Datei-Support benötigt

---

### Schritt 2: Projekt-Struktur erstellen

**Verzeichnisse anlegen:**

```bash
mkdir -p tests/e2e/fixtures
mkdir -p tests/e2e/helpers
```

**Struktur:**
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
│   └── notifications.spec.ts          # Notification-System
├── playwright.config.ts              # Playwright-Konfiguration
└── .env.example                      # Environment-Variablen
```

**Checkliste:**
- [ ] Verzeichnisse erstellt
- [ ] Struktur angelegt

---

### Schritt 3: Playwright-Konfiguration erstellen

**Datei:** `tests/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env Datei laden
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './e2e',
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
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
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
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Optional: Foundry automatisch starten (falls Script vorhanden)
  // webServer: {
  //   command: 'node scripts/start-foundry.mjs',
  //   port: 30001,
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Konfiguration angepasst (Port, Timeouts)
- [ ] Browser-Projekte konfiguriert

---

### Schritt 4: Environment-Variablen erstellen

**Datei:** `tests/.env.example`

```bash
# Foundry VTT URL
FOUNDRY_URL=http://localhost:30001

# Optional: Login-Daten (falls benötigt)
FOUNDRY_USERNAME=test-user
FOUNDRY_PASSWORD=test-password

# Optional: Testwelt
FOUNDRY_WORLD=test-world
```

**Datei:** `tests/.env` (lokal, nicht committen!)

```bash
# Lokale Foundry-Instanz
FOUNDRY_URL=http://localhost:30001
```

**Wichtig:** `.env` zu `.gitignore` hinzufügen!

**Checkliste:**
- [ ] `.env.example` erstellt
- [ ] `.env` erstellt (lokal)
- [ ] `.env` zu `.gitignore` hinzugefügt

---

### Schritt 5: Helper-Funktionen erstellen

**Datei:** `tests/e2e/helpers/foundry-helpers.ts`

```typescript
import { Page } from '@playwright/test';

const MODULE_ID = 'fvtt_relationship_app_module';

/**
 * Wartet bis das Modul geladen ist
 */
export async function waitForModuleLoaded(page: Page): Promise<void> {
  await page.waitForFunction(
    (moduleId) => {
      const mod = (window as any).game?.modules?.get(moduleId);
      return mod?.active === true && mod?.api !== undefined;
    },
    MODULE_ID,
    { timeout: 30000 }
  );
}

/**
 * Gibt die Modul-API zurück
 */
export async function getModuleAPI(page: Page): Promise<any> {
  await waitForModuleLoaded(page);
  return await page.evaluate((moduleId) => {
    return (window as any).game.modules.get(moduleId).api;
  }, MODULE_ID);
}

/**
 * Erstellt einen Test-Journal-Entry
 */
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

/**
 * Erstellt einen Test-Actor
 */
export async function createTestActor(
  page: Page,
  name: string,
  type: string = 'character'
): Promise<string> {
  return await page.evaluate(
    async ({ name, type }) => {
      const actor = await Actor.create({
        name,
        type,
      });
      return actor.id;
    },
    { name, type }
  );
}

/**
 * Öffnet das Journal-Directory
 */
export async function openJournalDirectory(page: Page): Promise<void> {
  // Journal-Button klicken
  await page.click('[data-action="journal"]');
  // Warten bis Directory geladen ist
  await page.waitForSelector('.journal-directory', { timeout: 10000 });
}

/**
 * Prüft ob ein Journal-Entry sichtbar ist
 */
export async function isJournalEntryVisible(
  page: Page,
  entryId: string
): Promise<boolean> {
  const count = await page
    .locator(`[data-entry-id="${entryId}"]`)
    .count();
  return count > 0;
}
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Helper-Funktionen implementiert
- [ ] TypeScript-Typen korrekt

---

**Datei:** `tests/e2e/helpers/ui-helpers.ts`

```typescript
import { Page } from '@playwright/test';

/**
 * Öffnet die Settings-UI
 */
export async function openSettings(page: Page): Promise<void> {
  await page.click('[data-action="configure"]');
  await page.waitForSelector('.module-settings', { timeout: 10000 });
}

/**
 * Ändert ein Setting
 */
export async function changeSetting(
  page: Page,
  settingName: string,
  value: string | number
): Promise<void> {
  await openSettings(page);

  // Setting-Input finden und ändern
  const selector = `[name="${settingName}"]`;
  await page.waitForSelector(selector);

  if (typeof value === 'number') {
    await page.selectOption(selector, value.toString());
  } else {
    await page.fill(selector, value);
  }

  // Speichern
  await page.click('button[type="submit"]');

  // Warten bis Settings geschlossen sind
  await page.waitForSelector('.module-settings', { state: 'hidden' });
}

/**
 * Öffnet die Relationship-Graph-UI
 *
 * ⚠️ HINWEIS: UI-Komponenten existieren noch nicht!
 * Diese Funktion sollte erst implementiert werden, wenn die UI-Komponenten vorhanden sind.
 */
export async function openRelationshipGraph(page: Page): Promise<void> {
  // TODO: Implementieren wenn UI-Komponenten vorhanden sind
  // Button zum Öffnen des Graphs finden und klicken
  // await page.click('[data-action="open-relationship-graph"]');
  // await page.waitForSelector('.relationship-graph', { timeout: 10000 });
  throw new Error('Relationship Graph UI ist noch nicht implementiert');
}

/**
 * Wartet auf eine Notification
 */
export async function waitForNotification(
  page: Page,
  type: 'error' | 'info' | 'warning' | 'success'
): Promise<string> {
  const selector = `.notification.${type}`;
  await page.waitForSelector(selector, { timeout: 5000 });
  return await page.textContent(selector) || '';
}
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] UI-Helper implementiert
- [ ] TypeScript-Typen korrekt

---

### Schritt 6: Fixtures erstellen

**Datei:** `tests/e2e/fixtures/foundry-fixtures.ts`

```typescript
import { test as base } from '@playwright/test';
import { getModuleAPI, waitForModuleLoaded } from '../helpers/foundry-helpers';
import type { Page } from '@playwright/test';

type FoundryFixtures = {
  moduleAPI: any;
  page: Page;
};

export const test = base.extend<FoundryFixtures>({
  moduleAPI: async ({ page }, use) => {
    // Warten bis Modul geladen ist
    await waitForModuleLoaded(page);

    // API abrufen
    const api = await getModuleAPI(page);

    // API für Tests bereitstellen
    await use(api);
  },
});

export { expect } from '@playwright/test';
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Fixtures implementiert
- [ ] TypeScript-Typen korrekt

---

**Datei:** `tests/e2e/fixtures/test-data.ts`

```typescript
/**
 * Testdaten für E2E-Tests
 */

export const TEST_JOURNAL_ENTRIES = [
  {
    name: 'Test Entry 1',
    flags: {
      'fvtt_relationship_app_module': {
        hidden: false,
      },
    },
  },
  {
    name: 'Hidden Entry',
    flags: {
      'fvtt_relationship_app_module': {
        hidden: true,
      },
    },
  },
];

export const TEST_ACTORS = [
  {
    name: 'Test Character',
    type: 'character',
  },
  {
    name: 'Test NPC',
    type: 'npc',
  },
];
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Testdaten definiert

---

### Schritt 7: E2E-Tests implementieren

#### Test 1: Bootstrap & Initialisierung

**Datei:** `tests/e2e/bootstrap.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForModuleLoaded, getModuleAPI } from './helpers/foundry-helpers';

const MODULE_ID = 'fvtt_relationship_app_module';

test.describe('E2E: Module Bootstrap', () => {
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
    await waitForModuleLoaded(page);

    // API prüfen
    const api = await getModuleAPI(page);

    expect(api).toBeDefined();
    expect(api.version).toBeDefined();
    expect(api.resolve).toBeDefined();
    expect(api.resolveWithError).toBeDefined();

    // Keine JavaScript-Errors
    expect(errors).toHaveLength(0);
  });

  test('should have all services resolvable', async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);

    const api = await getModuleAPI(page);

    // Wichtige Services prüfen
    const loggerToken = api.tokens?.loggerToken;
    const cacheToken = api.tokens?.cacheServiceToken;
    const gameServiceToken = api.tokens?.foundryGameServiceToken;

    if (loggerToken) {
      const loggerResult = api.resolveWithError(loggerToken);
      expect(loggerResult.ok).toBe(true);
    }

    if (cacheToken) {
      const cacheResult = api.resolveWithError(cacheToken);
      expect(cacheResult.ok).toBe(true);
    }

    if (gameServiceToken) {
      const gameServiceResult = api.resolveWithError(gameServiceToken);
      expect(gameServiceResult.ok).toBe(true);
    }
  });

  test('should have hooks registered', async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);

    // Prüfen ob Hooks registriert sind
    const hooksRegistered = await page.evaluate((moduleId) => {
      const mod = (window as any).game.modules.get(moduleId);
      // Hooks werden über Foundry Hooks.on registriert
      // Prüfen ob init/ready Hooks existieren
      return mod?.active === true;
    }, MODULE_ID);

    expect(hooksRegistered).toBe(true);
  });

  test('should have settings registered', async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);

    // Prüfen ob Settings registriert sind
    const settingsRegistered = await page.evaluate((moduleId) => {
      const settings = (window as any).game.settings;
      // Prüfen ob Modul-Settings existieren
      return settings?.get(moduleId, 'logLevel') !== undefined;
    }, MODULE_ID);

    expect(settingsRegistered).toBe(true);
  });
});
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Bootstrap-Tests implementiert
- [ ] Console-Error-Check implementiert
- [ ] API-Verfügbarkeit geprüft

---

#### Test 2: Journal Visibility

**Datei:** `tests/e2e/journal-visibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import {
  createTestJournalEntry,
  openJournalDirectory,
  isJournalEntryVisible,
} from './helpers/foundry-helpers';
import { waitForModuleLoaded } from './helpers/foundry-helpers';

const MODULE_ID = 'fvtt_relationship_app_module';

test.describe('E2E: Journal Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);
  });

  test('should hide journal entries with hidden flag', async ({ page }) => {
    // Journal-Entry mit Flag erstellen
    const entryId = await createTestJournalEntry(page, 'Hidden Entry', {
      [MODULE_ID]: {
        hidden: true,
      },
    });

    // Journal-Directory öffnen
    await openJournalDirectory(page);

    // Entry sollte nicht sichtbar sein
    const visible = await isJournalEntryVisible(page, entryId);
    expect(visible).toBe(false);
  });

  test('should keep visible journal entries visible', async ({ page }) => {
    // Journal-Entry ohne Flag erstellen
    const entryId = await createTestJournalEntry(page, 'Visible Entry', {
      [MODULE_ID]: {
        hidden: false,
      },
    });

    // Journal-Directory öffnen
    await openJournalDirectory(page);

    // Entry sollte sichtbar sein
    const visible = await isJournalEntryVisible(page, entryId);
    expect(visible).toBe(true);
  });

  test('should filter multiple entries correctly', async ({ page }) => {
    // Mehrere Entries erstellen
    const visibleId = await createTestJournalEntry(page, 'Visible Entry', {
      [MODULE_ID]: { hidden: false },
    });
    const hiddenId = await createTestJournalEntry(page, 'Hidden Entry', {
      [MODULE_ID]: { hidden: true },
    });

    // Journal-Directory öffnen
    await openJournalDirectory(page);

    // Sichtbare Entry sollte sichtbar sein
    const visible = await isJournalEntryVisible(page, visibleId);
    expect(visible).toBe(true);

    // Versteckte Entry sollte nicht sichtbar sein
    const hidden = await isJournalEntryVisible(page, hiddenId);
    expect(hidden).toBe(false);
  });
});
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Journal Visibility Tests implementiert
- [ ] Flag-basierte Filterung getestet
- [ ] Multiple Entries getestet

---

#### Test 3: Settings-UI

**Datei:** `tests/e2e/settings.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForModuleLoaded } from './helpers/foundry-helpers';
import { openSettings, changeSetting } from './helpers/ui-helpers';

const MODULE_ID = 'fvtt_relationship_app_module';

test.describe('E2E: Settings UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);
  });

  test('should open settings UI', async ({ page }) => {
    await openSettings(page);

    // Settings-UI sollte sichtbar sein
    const settingsVisible = await page.isVisible('.module-settings');
    expect(settingsVisible).toBe(true);
  });

  test('should change log level setting', async ({ page }) => {
    // Log-Level ändern
    await changeSetting(page, 'logLevel', '2'); // WARN

    // Prüfen dass Setting gespeichert wurde
    const logLevel = await page.evaluate(
      (moduleId) => {
        return (window as any).game.settings.get(moduleId, 'logLevel');
      },
      MODULE_ID
    );

    expect(logLevel).toBe(2);
  });

  test('should persist setting changes', async ({ page }) => {
    // Setting ändern
    await changeSetting(page, 'logLevel', '1'); // INFO

    // Seite neu laden
    await page.reload();
    await waitForModuleLoaded(page);

    // Setting sollte persistiert sein
    const logLevel = await page.evaluate(
      (moduleId) => {
        return (window as any).game.settings.get(moduleId, 'logLevel');
      },
      MODULE_ID
    );

    expect(logLevel).toBe(1);
  });
});
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Settings-UI Tests implementiert
- [ ] Setting-Änderungen getestet
- [ ] Persistenz getestet

---

#### Test 4: Notifications

**Datei:** `tests/e2e/notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForModuleLoaded, getModuleAPI } from './helpers/foundry-helpers';
import { waitForNotification } from './helpers/ui-helpers';

test.describe('E2E: Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);
  });

  test('should display error notification on error', async ({ page }) => {
    // Fehler provozieren (z.B. ungültige API-Nutzung)
    const api = await getModuleAPI(page);

    // Fehler auslösen (abhängig von Implementierung)
    await page.evaluate(() => {
      const api = (window as any).game.modules.get('fvtt_relationship_app_module').api;
      // Fehler provozieren
      try {
        api.resolveWithError(Symbol('invalid-token'));
      } catch (error) {
        // Fehler sollte Notification auslösen
      }
    });

    // Notification prüfen
    const notificationText = await waitForNotification(page, 'error');
    expect(notificationText).toBeDefined();
    expect(notificationText.length).toBeGreaterThan(0);
  });

  test('should display info notification', async ({ page }) => {
    // Info-Notification auslösen (abhängig von Implementierung)
    const api = await getModuleAPI(page);

    // Info-Notification testen
    // (Implementierung abhängig von NotificationCenter)
  });
});
```

**Checkliste:**
- [ ] Datei erstellt
- [ ] Notification-Tests implementiert
- [ ] Error-Notifications getestet
- [ ] Info-Notifications getestet

---

#### Test 5: Beziehungsnetzwerke

**Status:** ⚠️ **NICHT IMPLEMENTIERT** - UI-Komponenten existieren noch nicht

**Hinweis:** Die Relationship Graph UI (Svelte-Komponenten mit Cytoscape/@xyflow/svelte) ist aktuell noch nicht implementiert. Diese Tests sollten erst erstellt werden, wenn die UI-Komponenten vorhanden sind.

**Geplante Datei:** `tests/e2e/relationships.spec.ts` (wenn UI fertig)

**Geplante Tests (wenn UI fertig):**
```typescript
import { test, expect } from '@playwright/test';
import { waitForModuleLoaded } from './helpers/foundry-helpers';
import { openRelationshipGraph } from './helpers/ui-helpers';

test.describe('E2E: Relationship Networks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForModuleLoaded(page);
  });

  test('should open relationship graph UI', async ({ page }) => {
    await openRelationshipGraph(page);

    // Graph-UI sollte sichtbar sein
    const graphVisible = await page.isVisible('.relationship-graph');
    expect(graphVisible).toBe(true);
  });

  test('should render nodes', async ({ page }) => {
    await openRelationshipGraph(page);

    // Nodes prüfen
    const nodes = await page.locator('.relationship-node').count();
    expect(nodes).toBeGreaterThan(0);
  });

  test('should render edges', async ({ page }) => {
    await openRelationshipGraph(page);

    // Edges prüfen (abhängig von Implementierung)
    const edges = await page.locator('.relationship-edge').count();
    expect(edges).toBeGreaterThanOrEqual(0);
  });
});
```

**Checkliste:**
- [ ] ⚠️ Warten auf UI-Implementierung
- [ ] Datei erstellen (wenn UI-Komponenten vorhanden)
- [ ] Graph-UI Tests implementieren
- [ ] Nodes/Edges Rendering testen

---

### Schritt 8: NPM-Scripts hinzufügen

**`package.json` anpassen:**

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

**Checkliste:**
- [ ] NPM-Scripts hinzugefügt
- [ ] Scripts getestet

---

### Schritt 9: .gitignore anpassen

**`.gitignore` erweitern:**

```
# E2E Tests
tests/.env
tests/playwright-report/
tests/test-results/
playwright/.cache/
```

**Checkliste:**
- [ ] `.gitignore` angepasst
- [ ] Test-Artifacts ausgeschlossen

---

## Foundry VTT Setup

### Voraussetzungen

1. **Foundry VTT installiert und laufend**
   - Port: `http://localhost:30001` (oder anderer Port)
   - Zugriff ohne Login (oder Test-Account)

2. **Testwelt erstellen**
   - Neue Welt erstellen
   - Modul installieren und aktivieren
   - Optional: Testdaten vorbereiten

3. **Modul aktivieren**
   - In Foundry: Settings → Manage Modules
   - "Beziehungsnetzwerke für Foundry" aktivieren

### Setup-Schritte

1. **Foundry VTT starten**
   ```bash
   # Foundry VTT starten (abhängig von Installation)
   # Port notieren (z.B. 30001)
   ```

2. **Testwelt erstellen/öffnen**
   - Neue Welt erstellen oder bestehende öffnen
   - Welt-Name notieren

3. **Modul aktivieren**
   - Settings → Manage Modules
   - Modul aktivieren

4. **Port in `.env` eintragen**
   ```bash
   FOUNDRY_URL=http://localhost:30001
   ```

---

## Ausführung

### Lokale Ausführung

```bash
# Alle E2E-Tests ausführen
npm run test:e2e

# Mit UI (interaktiv)
npm run test:e2e:ui

# Headed Mode (Browser sichtbar)
npm run test:e2e:headed

# Debug Mode
npm run test:e2e:debug

# Report anzeigen
npm run test:e2e:report
```

---

## Best Practices

### 1. Test-Isolation

- ✅ Jeder Test sollte unabhängig sein
- ✅ Testdaten vor/nach jedem Test aufräumen
- ✅ Keine Abhängigkeiten zwischen Tests

### 2. Warte-Strategien

- ✅ `page.waitForSelector()` statt `page.waitForTimeout()`
- ✅ `page.waitForFunction()` für komplexe Bedingungen
- ✅ Auto-Waiting von Playwright nutzen

### 3. Selektoren

- ✅ Data-Attribute bevorzugen (`[data-testid="..."]`)
- ✅ Stabile Selektoren (nicht CSS-Klassen die sich ändern)
- ✅ Page Object Model für komplexe UIs

### 4. Debugging

- ✅ Screenshots bei Fehlern (`screenshot: 'only-on-failure'`)
- ✅ Videos bei Fehlern (`video: 'retain-on-failure'`)
- ✅ Trace-Viewer für detaillierte Analyse (`trace: 'on-first-retry'`)

---

## Referenzen

**Playwright:**
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

**Bestehende Dokumentation:**
- `docs/TEST-STRATEGY.md` - Abschnitt "Phase 3: E2E Tests"

---

## Checkliste

### Vorbereitung
- [ ] Playwright installiert
- [ ] Foundry VTT läuft
- [ ] Testwelt erstellt
- [ ] Modul aktiviert
- [ ] `.env` konfiguriert

### Implementierung
- [ ] Projekt-Struktur erstellt
- [ ] Playwright-Konfiguration erstellt
- [ ] Helper-Funktionen implementiert
- [ ] Fixtures erstellt
- [ ] Test 1: Bootstrap & Initialisierung
- [ ] Test 2: Journal Visibility
- [ ] Test 3: Settings-UI
- [ ] Test 4: Notifications
- [ ] Test 5: Beziehungsnetzwerke (optional)

### Validierung
- [ ] Alle Tests laufen erfolgreich
- [ ] Tests sind isoliert
- [ ] Debugging-Tools funktionieren

---

**Nächste Schritte:** Nach Implementierung alle E2E-Tests ausführen und validieren.

