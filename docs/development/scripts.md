# NPM-Scripts & Build-Tools

**Zweck:** Vollständige Dokumentation aller verfügbaren NPM-Scripts
**Zielgruppe:** Entwickler
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Build-Scripts

### `npm run build`

Production Build - Erstellt optimiertes Bundle für Release.

```bash
npm run build
```

**Ausgabe:** `dist/fvtt_relationship_app_module.js`

**Eigenschaften:**
- Minifiziert
- Optimiert
- Keine Source Maps

---

### `npm run build:dev`

Development Build - Erstellt Development-Bundle.

```bash
npm run build:dev
```

**Ausgabe:** `dist/fvtt_relationship_app_module.js`

**Eigenschaften:**
- Source Maps generiert
- Nicht minifiziert
- Schnelleres Build

---

### `npm run dev`

Watch-Modus - Automatisches Rebuild bei Änderungen.

```bash
npm run dev
```

**Empfohlen für:** Entwicklung

**Eigenschaften:**
- Watch-Modus aktiv
- Automatisches Rebuild bei Datei-Änderungen
- Development-Modus

---

## Quality-Check-Scripts

### `npm run check-all`

Führt alle Quality-Checks sequenziell aus (read-only).

```bash
npm run check-all
```

**Führt aus:**
- Format-Check
- Lint
- CSS-Lint
- Encoding-Check
- Type-Check
- Svelte-Check
- Type-Coverage
- Test-Coverage

**Empfohlen für:** Pre-Commit, CI/CD

---

### `npm run check:all`

Führt alle Quality-Checks aus und fixiert automatisch.

```bash
npm run check:all
```

**Unterschied zu `check-all`:**
- Auto-Fix aktiviert
- Ändert Dateien

**Empfohlen für:** Lokale Entwicklung

---

### `npm run check:build`

Führt alle Checks aus und erstellt Development-Build.

```bash
npm run check:build
```

**Führt aus:**
- BOM entfernen
- Format
- Lint
- CSS-Lint
- Encoding-Check
- Type-Check
- Svelte-Check
- Type-Coverage
- Test-Coverage
- Development-Build

---

## Code-Qualität

### `npm run lint`

ESLint mit Auto-Fix.

```bash
npm run lint
```

**Führt aus:**
- ESLint mit Auto-Fix
- Progress-Anzeige

**Konfiguration:** `.eslintrc.cjs`, `eslint.config.mjs`

---

### `npm run format`

Prettier Code-Formatierung.

```bash
npm run format
```

**Formatiert:**
- TypeScript/JavaScript (`src/**/*.{ts,js}`)
- Svelte (`src/**/*.svelte`)
- CSS (`styles/**/*.css`)

**Konfiguration:** `.prettierrc`

---

### `npm run format:check`

Prettier Format-Check (ohne Änderungen).

```bash
npm run format:check
```

**Empfohlen für:** CI/CD

---

### `npm run css-lint`

Stylelint für CSS-Dateien.

```bash
npm run css-lint
```

**Konfiguration:** `.stylelintrc.json`

---

## TypeScript

### `npm run type-check`

TypeScript Type-Checking (ohne Build).

```bash
npm run type-check
```

**Prüft:**
- Type-Fehler
- Kompilierbarkeit

**Konfiguration:** `tsconfig.json`

---

### `npm run type-check:watch`

TypeScript Type-Checking im Watch-Modus.

```bash
npm run type-check:watch
```

**Empfohlen für:** Entwicklung

---

### `npm run type-coverage`

TypeScript Type-Coverage prüfen.

```bash
npm run type-coverage
```

**Ziel:** 100% Type Coverage

**Konfiguration:** `scripts/run-type-coverage.mjs`

**Ausgabe:**
- Type-Coverage-Report
- Detailierte Ausnahmen

---

### `npm run svelte-check`

Svelte Type-Checking.

```bash
npm run svelte-check
```

**Prüft:**
- Svelte-Komponenten
- Type-Safety

**Konfiguration:** `tsconfig.json`

---

## Testing

### `npm test`

Alle Tests ausführen (Single Run).

```bash
npm test
```

**Empfohlen für:** CI/CD

---

### `npm run test:watch`

Tests im Watch-Modus.

```bash
npm run test:watch
```

**Empfohlen für:** Entwicklung

---

### `npm run test:ui`

Interaktive Test-UI.

```bash
npm run test:ui
```

**Öffnet:** Browser-basierte Test-UI

---

### `npm run test:coverage`

Tests mit Coverage-Report.

```bash
npm run test:coverage
```

**Ausgabe:** `coverage/index.html`

**Ziel:** 100% Coverage (Lines, Functions, Branches, Statements)

---

### `npm run test:e2e`

E2E-Tests mit Playwright.

```bash
npm run test:e2e
```

**Voraussetzung:** Foundry VTT muss lokal laufen

**Siehe:** [Testing - E2E-Tests](../development/testing.md#e2e-tests-phase-3)

---

### `npm run test:e2e:ui`

E2E-Tests mit Playwright UI.

```bash
npm run test:e2e:ui
```

---

### `npm run test:e2e:headed`

E2E-Tests mit sichtbarem Browser.

```bash
npm run test:e2e:headed
```

---

### `npm run test:e2e:debug`

E2E-Tests im Debug-Modus.

```bash
npm run test:e2e:debug
```

---

## Encoding & Datei-Management

### `npm run check:encoding`

UTF-8 Encoding-Validierung.

```bash
npm run check:encoding
```

**Prüft:** Alle Dateien auf UTF-8 ohne BOM

---

### `npm run remove:bom`

BOM (Byte Order Mark) entfernen.

```bash
npm run remove:bom
```

**Entfernt:** BOM aus allen Dateien

---

### `npm run check:no-ignores`

Prüft auf undokumentierte Ignores.

```bash
npm run check:no-ignores
```

**Prüft:**
- `v8 ignore` Kommentare
- `type-coverage:ignore` Kommentare
- `eslint-disable` Direktiven

**Siehe:** [Quality Gates](../quality/README.md)

---

## Dependency-Analyse

### `npm run analyze:deps`

Dependency-Analyse (JSON).

```bash
npm run analyze:deps
```

**Ausgabe:** `dependencies.json`

---

### `npm run analyze:circular`

Zirkuläre Dependencies finden.

```bash
npm run analyze:circular
```

**Tool:** madge

---

### `npm run analyze:circular:json`

Zirkuläre Dependencies (JSON).

```bash
npm run analyze:circular:json
```

**Ausgabe:** `circular-dependencies.json`

---

### `npm run analyze:graph`

Dependency-Graph visualisieren.

```bash
npm run analyze:graph
```

**Ausgabe:** `architecture.svg`

---

### `npm run analyze:graph:domain`

Domain-Layer Dependency-Graph.

```bash
npm run analyze:graph:domain
```

**Ausgabe:** `domain.svg`

---

### `npm run analyze:graph:application`

Application-Layer Dependency-Graph.

```bash
npm run analyze:graph:application
```

**Ausgabe:** `application.svg`

---

### `npm run analyze:graph:infrastructure`

Infrastructure-Layer Dependency-Graph.

```bash
npm run analyze:graph:infrastructure
```

**Ausgabe:** `infrastructure.svg`

---

### `npm run analyze:graph:framework`

Framework-Layer Dependency-Graph.

```bash
npm run analyze:graph:framework
```

**Ausgabe:** `framework.svg`

---

### `npm run analyze:all`

Alle Dependency-Analysen ausführen.

```bash
npm run analyze:all
```

**Führt aus:**
- Circular Dependencies
- Alle Dependency-Graphs

---

## Domain-Boundary-Check

### `npm run check:domain-boundaries`

Prüft Domain-Layer-Boundaries.

```bash
npm run check:domain-boundaries
```

**Prüft:** Clean Architecture Layer-Regeln

---

## GitHub-Integration

### `npm run issue:create`

Erstellt Feature-Issue auf GitHub.

```bash
npm run issue:create
```

**Tool:** `scripts/create-feature-issue.mjs`

---

### `npm run issue:link`

Aktualisiert Feature-Issue-Link.

```bash
npm run issue:link
```

**Tool:** `scripts/update-feature-issue-link.mjs`

---

## Post-Install

### `npm run postinstall`

Automatisch nach `npm install` ausgeführt.

```bash
npm run postinstall
```

**Führt aus:**
- `patch-package` - Wendet Patches an

**Patches:** `patches/cytoscape+3.33.1.patch`

---

## Script-Kategorien

### Build & Development
- `build` - Production Build
- `build:dev` - Development Build
- `dev` - Watch-Modus

### Quality Checks
- `check-all` - Alle Checks (read-only)
- `check:all` - Alle Checks (mit Auto-Fix)
- `check:build` - Checks + Build

### Code-Qualität
- `lint` - ESLint
- `format` - Prettier
- `format:check` - Prettier Check
- `css-lint` - Stylelint

### TypeScript
- `type-check` - Type-Checking
- `type-check:watch` - Type-Checking Watch
- `type-coverage` - Type-Coverage
- `svelte-check` - Svelte Check

### Testing
- `test` - Tests ausführen
- `test:watch` - Tests Watch
- `test:ui` - Test-UI
- `test:coverage` - Tests mit Coverage
- `test:e2e` - E2E-Tests
- `test:e2e:ui` - E2E-Tests UI
- `test:e2e:headed` - E2E-Tests Headed
- `test:e2e:debug` - E2E-Tests Debug

### Encoding & Dateien
- `check:encoding` - Encoding prüfen
- `remove:bom` - BOM entfernen
- `check:no-ignores` - Ignores prüfen

### Dependency-Analyse
- `analyze:deps` - Dependency-Analyse
- `analyze:circular` - Zirkuläre Dependencies
- `analyze:graph` - Dependency-Graph
- `analyze:all` - Alle Analysen

### Domain-Boundaries
- `check:domain-boundaries` - Layer-Regeln prüfen

### GitHub
- `issue:create` - Feature-Issue erstellen
- `issue:link` - Issue-Link aktualisieren

---

## Empfohlene Workflows

### Entwicklung

```bash
# Terminal 1: Watch-Modus
npm run dev

# Terminal 2: Tests im Watch-Modus
npm run test:watch

# Terminal 3: Type-Check im Watch-Modus
npm run type-check:watch
```

### Pre-Commit

```bash
# Alle Checks ausführen
npm run check-all
```

### Pre-Push

```bash
# Alle Checks + Tests
npm run check-all
npm test
```

### CI/CD

```bash
# Production Build + alle Checks
npm run build
npm run check-all
npm test
npm run test:coverage
```

---

## Weitere Informationen

- [Testing](../development/testing.md) - Test-Strategie & Anleitung
- [Code-Standards](../development/coding-standards.md) - Coding-Konventionen
- [Quality Gates](../quality/README.md) - Qualitätsmetriken

---

**Letzte Aktualisierung:** 2025-01-XX
