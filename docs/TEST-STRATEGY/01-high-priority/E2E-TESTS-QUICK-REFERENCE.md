# E2E-Tests: Quick Reference

**Schnellübersicht:** Welche Tests vorhanden sind und wie man sie ausführt.

---

## 📋 Verfügbare Test-Suites

Aktuell sind **4 Test-Suites** mit **13 Tests** vorhanden:

### 1. Bootstrap Tests (`bootstrap.spec.ts`)
**4 Tests** - Module-Initialisierung und API-Verfügbarkeit

| Test | Beschreibung |
|------|--------------|
| `should load module without errors` | Prüft ob Modul ohne JavaScript-Errors lädt |
| `should have all services resolvable` | Prüft ob alle Services über API resolvable sind |
| `should have hooks registered` | Prüft ob Hooks korrekt registriert wurden |
| `should have settings registered` | Prüft ob Settings registriert sind |

### 2. Journal Visibility Tests (`journal-visibility.spec.ts`)
**4 Tests** - Journal-Entry-Versteckung im Directory

| Test | Beschreibung |
|------|--------------|
| `should hide journal entries with hidden flag` | Entry mit `hidden: true` wird versteckt |
| `should keep visible journal entries visible` | Entry ohne Flag bleibt sichtbar |
| `should filter multiple entries correctly` | Mehrere Entries werden korrekt gefiltert |
| `should show DOM snapshot when journal directory is open` | Erstellt Debug-Snapshot des DOMs |

### 3. Notifications Tests (`notifications.spec.ts`)
**2 Tests** - Notification-System

| Test | Beschreibung |
|------|--------------|
| `should display error notification on error` | Error-Notifications werden angezeigt |
| `should display info notification` | Info-Notifications werden angezeigt |

### 4. Settings Tests (`settings.spec.ts`)
**3 Tests** - Settings-UI

| Test | Beschreibung |
|------|--------------|
| `should open settings UI` | Settings-UI öffnet sich korrekt |
| `should change log level setting` | Settings können geändert werden |
| `should persist setting changes` | Settings werden nach Reload persistiert |

---

## 🚀 Tests ausführen

### Grundlegende Befehle

```bash
# Alle E2E-Tests ausführen
npm run test:e2e

# Interaktive UI zum Ausführen einzelner Tests
npm run test:e2e:ui

# Tests im sichtbaren Browser ausführen (headed mode)
npm run test:e2e:headed

# Tests im Debug-Modus (mit Breakpoints)
npm run test:e2e:debug

# HTML-Report anzeigen
npm run test:e2e:report
```

### Spezifische Tests ausführen

```bash
# Nur eine bestimmte Test-Datei
npx playwright test tests/e2e/bootstrap.spec.ts

# Nur ein bestimmter Test (per Pattern)
npx playwright test -g "should load module without errors"

# Nur eine Test-Suite (per Pattern)
npx playwright test -g "E2E: Module Bootstrap"
```

### Mit Optionen

```bash
# Tests mit Retry
npx playwright test --retries=3

# Tests mit Screenshot bei Fehlern
npx playwright test --screenshot=only-on-failure

# Tests mit Video-Recording
npx playwright test --video=on

# Nur bestimmten Browser
npx playwright test --project=chromium
```

---

## 📁 Datei-Struktur

```
tests/
├── e2e/
│   ├── bootstrap.spec.ts          ✅ 4 Tests
│   ├── journal-visibility.spec.ts ✅ 4 Tests
│   ├── notifications.spec.ts      ✅ 2 Tests
│   ├── settings.spec.ts           ✅ 3 Tests
│   ├── helpers/
│   │   ├── foundry-helpers.ts     Helper-Funktionen
│   │   └── ui-helpers.ts          UI-Helper
│   └── fixtures/
│       ├── foundry-fixtures.ts    Playwright-Fixtures
│       └── test-data.ts           Testdaten
├── playwright.config.ts           Konfiguration
└── tsconfig.json                  TypeScript-Config
```

---

## ⚙️ Konfiguration

### Environment-Variablen

Erstelle eine `.env` Datei im `tests/` Verzeichnis:

```env
FOUNDRY_URL=http://localhost:30000
```

**Standard:** `http://localhost:30000` (falls nicht gesetzt)

### Wichtige Einstellungen

- **Sequenzielle Ausführung:** `workers: 1` (Foundry erlaubt nur eine Sitzung pro User)
- **Video-Recording:** Aktiviert für alle Tests (Full HD, 1920x1080)
- **Screenshots:** Nur bei Fehlern
- **Trace:** Bei Retry
- **Timeout:** 30s (Actions), 60s (Navigation)

---

## 🔍 Debugging

### 1. Interaktiver Debug-Modus

```bash
npm run test:e2e:debug
```

- Browser öffnet sich automatisch
- Playwright Inspector startet
- Schritt-für-Schritt-Debugging möglich

### 2. `page.pause()` in Tests

Füge `await page.pause();` in den Test ein:

```typescript
test('my test', async ({ page }) => {
  await loginToFoundry(page);
  await page.pause(); // Test pausiert hier!
  // Jetzt kannst du im Browser DevTools debuggen
});
```

### 3. Browser DevTools

Während `page.pause()`:
- Öffne DevTools (F12)
- Prüfe Console für Errors
- Inspiziere DOM
- Führe Code in Console aus

### 4. Playwright UI Mode

```bash
npm run test:e2e:ui
```

- Interaktive Test-Ausführung
- Tests einzeln ausführen
- Screenshots und Videos ansehen
- Timeline-View für Actions

### 5. Screenshots & Videos

**Speicherort:**
- Screenshots: `tests/test-results/`
- Videos: `tests/test-results/`
- Trace: `tests/test-results/`

**Anzeigen:**
```bash
# HTML-Report (enthält Screenshots & Videos)
npm run test:e2e:report
```

---

## 📊 Test-Report

### HTML-Report anzeigen

```bash
npm run test:e2e:report
```

**Enthält:**
- ✅ Test-Ergebnisse
- ✅ Screenshots bei Fehlern
- ✅ Videos aller Tests
- ✅ Timeline-View
- ✅ Console-Logs

### Trace-Viewer

```bash
# Trace bei Retry ansehen
npx playwright show-trace tests/test-results/[trace-file].zip
```

---

## ⚠️ Wichtige Hinweise

### Foundry-Voraussetzungen

1. **Foundry VTT muss laufen** auf `http://localhost:30000` (oder `FOUNDRY_URL`)
2. **Testwelt muss vorhanden sein** mit aktiviertem Modul
3. **TestGM User muss existieren** (Standard-Username für Login)

### Sequenzielle Ausführung

**Wichtig:** Tests laufen **immer sequenziell** (`workers: 1`), weil:
- Foundry erlaubt nur eine Sitzung pro Benutzer
- Parallele Logins würden kollidieren
- Tests sind daher langsamer, aber sicher

### Timeouts

- **Action Timeout:** 30 Sekunden
- **Navigation Timeout:** 60 Sekunden
- **Test Timeout:** Standard (30 Sekunden pro Test)

Bei langsamer Foundry-Instanz können Timeouts angepasst werden in `playwright.config.ts`.

---

## 🎯 Nächste Schritte

### Verfügbare Tests erweitern

1. **Weitere Edge Cases** testen
2. **Performance-Tests** hinzufügen
3. **Relationship Graph UI-Tests** (wenn UI fertig)

### Bestehende Tests verbessern

1. **Stabilere Selektoren** verwenden
2. **Bessere Fehlermeldungen** bei Assertions
3. **Mehr Debug-Ausgaben** bei Fehlern

---

## 📚 Weitere Dokumentation

- **Detaillierte Analyse:** [E2E-TESTS-ANALYSIS.md](./E2E-TESTS-ANALYSIS.md)
- **Debugging-Guide:** `tests/e2e/DEBUGGING.md`
- **Video-Recording:** `tests/e2e/VIDEO_RECORDING.md`
- **Playwright Docs:** https://playwright.dev/

---

**Zuletzt aktualisiert:** 2025-01-18

