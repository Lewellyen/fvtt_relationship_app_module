# Entwicklungssetup

**Zweck:** Anleitung zur Einrichtung der Entwicklungsumgebung
**Zielgruppe:** Contributor, Entwickler
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Voraussetzungen

- **Node.js 20.12.0+** (siehe `package.json` engines)
- **npm 10.0.0+** oder **pnpm**
- **Foundry VTT 13+** ⚠️ **Mindestversion beachten!**
- Git (für Repository-Zugriff)

---

## Setup-Schritte

### 1. Repository klonen

```bash
git clone https://github.com/Lewellyen/fvtt_relationship_app_module.git
cd fvtt_relationship_app_module
```

### 2. Dependencies installieren

```bash
npm install
```

Dies installiert alle Dependencies inkl. Patches (via `patch-package`).

### 3. Entwicklungsumgebung verlinken

**Option A: Symlink (Empfohlen für Entwicklung)**

```bash
# Windows (PowerShell als Administrator)
New-Item -ItemType SymbolicLink -Path "<FoundryData>\modules\fvtt_relationship_app_module" -Target "$PWD"

# Linux/Mac
ln -s "$PWD" "<FoundryData>/modules/fvtt_relationship_app_module"
```

**Option B: Manuelles Kopieren**

Kopiere den Projektordner nach `<FoundryData>/modules/fvtt_relationship_app_module`

### 4. Entwicklung starten

```bash
# Watch-Modus (automatisches Rebuild bei Änderungen)
npm run dev
```

Das Modul wird automatisch neu gebaut, wenn Dateien geändert werden.

### 5. In Foundry testen

1. Starte Foundry VTT
2. Öffne eine Welt
3. Aktiviere das Modul
4. Änderungen werden nach Rebuild automatisch übernommen (Reload erforderlich)

---

## Build-Befehle

### Development Build

```bash
npm run dev
```

- Watch-Modus aktiv
- Source Maps generiert
- Schnelleres Build

### Production Build

```bash
npm run build
```

- Optimiertes Bundle
- Minifiziert
- Keine Source Maps

### Build prüfen

```bash
npm run check:build
```

Führt alle Checks aus (Format, Lint, Type-Check, Tests, Build).

---

## Quality Checks

### Alle Checks ausführen

```bash
npm run check-all
```

Führt sequenziell aus:
- Format-Check
- Lint
- CSS-Lint
- Encoding-Check
- Type-Check
- Svelte-Check
- Type-Coverage
- Test-Coverage

### Einzelne Checks

```bash
npm run format        # Code formatieren
npm run lint          # ESLint mit Auto-Fix
npm run type-check    # TypeScript Type-Checking
npm run test          # Tests ausführen
npm run test:coverage # Tests mit Coverage
```

---

## Editor-Konfiguration

### VS Code

Empfohlene Extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

Die Projekt-Konfigurationen (`.eslintrc.cjs`, `.prettierrc`) werden automatisch verwendet.

### Encoding

**Wichtig:** Alle Dateien müssen als **UTF-8 ohne BOM** gespeichert werden.

**VS Code:**
- Standardmäßig UTF-8
- Prüfen: Statusleiste zeigt Encoding

**IntelliJ/WebStorm:**
- File → File Properties → File Encoding → UTF-8

**Encoding prüfen:**
```bash
npm run check:encoding
```

---

## Erste Schritte

### 1. Projekt-Struktur verstehen

- [Architektur-Übersicht](../architecture/overview.md) - High-Level Architektur
- [Quick Reference](../reference/quick-reference.md) - Schnellreferenz
- [Entwickler-Guide](../development/README.md) - Entwicklungsumgebung

### 2. Tests ausführen

```bash
npm test
```

Siehe [Testing](../development/testing.md) für Details.

### 3. Code-Standards prüfen

```bash
npm run lint
npm run format:check
```

Siehe [Code-Standards](../development/coding-standards.md) für Details.

---

## Troubleshooting

### Dependencies installieren fehlschlägt

```bash
# Cache löschen
npm cache clean --force

# node_modules löschen und neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Build-Fehler

```bash
# Type-Check ausführen
npm run type-check

# Lint ausführen
npm run lint
```

### Encoding-Fehler

```bash
# BOM entfernen
npm run remove:bom

# Encoding prüfen
npm run check:encoding
```

### Tests schlagen fehl

```bash
# Tests mit Details ausführen
npm test -- --reporter=verbose

# Spezifische Test-Datei
npm test -- container.test.ts
```

---

## Nächste Schritte

- [Entwickler-Guide](../development/README.md) - Entwicklungsumgebung, Scripts, Testing
- [Code-Standards](../development/coding-standards.md) - Coding-Konventionen
- [Architektur-Übersicht](../architecture/overview.md) - Architektur verstehen
- [Beitragen](../guides/contributing.md) - Beitragsprozess

---

**Letzte Aktualisierung:** 2025-01-XX
