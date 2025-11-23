# Contributing to Beziehungsnetzwerke für Foundry VTT

Vielen Dank für dein Interesse, zu diesem Projekt beizutragen! 🎉

## Setup

### Voraussetzungen

- Node.js 18+
- npm oder pnpm
- Foundry VTT 13+

### Installation

```bash
# Repository klonen
git clone https://github.com/Lewellyen/fvtt_relationship_app_module.git
cd fvtt_relationship_app_module

# Dependencies installieren
npm install

# Entwicklungsmodus starten (mit Watch)
npm run dev
```

## Development Workflow

### 1. Branch erstellen

```bash
git checkout -b feature/my-feature
# oder
git checkout -b fix/my-bugfix
```

### 2. Änderungen vornehmen

- Schreibe sauberen, gut dokumentierten Code
- Folge den bestehenden Code-Konventionen
- Füge Tests für neue Features hinzu
- **Wichtig**: Aktualisiere die `[Unreleased]` Sektion in `CHANGELOG.md` mit deinen Änderungen (siehe [Changelog Guidelines](#changelog-guidelines))

### 3. Code-Qualität prüfen

Vor dem Commit immer alle Checks ausführen:

```bash
npm run check-all
```

Dies führt aus:
- TypeScript Type-Checking
- ESLint (mit Auto-Fix)
- Prettier Code-Formatierung
- Svelte-Check
- UTF-8 Encoding-Validierung

### 4. Tests ausführen

```bash
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Tests im Watch-Mode
npm run test:watch
```

### 5. Commit erstellen

Verwende **Conventional Commits** Format:

```
feat: Add user authentication
feat(api): Add new endpoint for relationships
fix: Resolve journal loading issue
fix(port-selector): Subscribe to events correctly
docs: Update API documentation
docs(adr): Add ADR for observability strategy
test: Add tests for hook registration
refactor: Improve port selection logic
refactor(config): Split into modular structure
chore: Update dependencies
chore(deps): Bump vite to 5.0
ci: Update GitHub Actions workflow
```

**Format:** `<type>[optional scope]: <description>`

**Verfügbare Types:**
- `feat` - Neues Feature
- `fix` - Bug-Fix
- `docs` - Dokumentation
- `refactor` - Code-Refactoring (keine Features/Fixes)
- `test` - Tests hinzufügen/ändern
- `chore` - Wartungsarbeiten, Build, Dependencies
- `ci` - CI/CD Änderungen
- `perf` - Performance-Verbesserungen
- `style` - Code-Formatierung (keine funktionalen Änderungen)
- `release` - Release-Commits (automatisch via Release-Tool)

**Optional: Breaking Changes markieren:**
```
feat(api)!: change response format

BREAKING CHANGE: API now returns array instead of object
```

### 6. Pull Request erstellen

1. Pushe deinen Branch
2. Erstelle einen Pull Request auf GitHub
3. Beschreibe deine Änderungen detailliert
4. Verlinke relevante Issues

## Code Standards

### TypeScript

- **Strict Mode ist aktiviert** - Keine `any` ohne guten Grund
- **Result Pattern** statt Exceptions für erwartbare Fehler
- **Explizite Typen** für öffentliche APIs
- **JSDoc-Kommentare** für alle öffentlichen Funktionen/Klassen

### Naming Conventions

- **Klassen, Interfaces, Types**: PascalCase (`UserService`, `FoundryGame`)
- **Funktionen, Variablen**: camelCase (`getUserData`, `isValid`)
- **Konstanten**: UPPER_CASE (`MODULE_CONSTANTS`, `LOG_PREFIX`)
- **Tokens**: camelCase mit "Token"-Suffix (`loggerToken`, `foundryGameToken`)

### Result Pattern

Alle Funktionen, die fehlschlagen können, sollten `Result<T, E>` zurückgeben:

```typescript
// ✅ Gut
function loadData(): Result<Data, string> {
  // ...
}

// ❌ Schlecht
function loadData(): Data {
  // throw new Error(...) 
}
```

### File Encoding

⚠️ **KRITISCH**: Alle Dateien MÜSSEN als UTF-8 ohne BOM gespeichert werden.

Konfiguriere deinen Editor:
- **VS Code**: Standardmäßig UTF-8 ✅
- **IntelliJ/WebStorm**: File → File Properties → File Encoding → UTF-8

### Testing

- **Unit Tests** für alle neuen Features
- **Integration Tests** für Service-Interaktionen
- **Test-Coverage** sollte nicht sinken
- **Mocks** für externe Dependencies (Foundry API)

## Projekt-Struktur

```
src/
├── config/               # DI-Konfiguration
│   ├── dependencyconfig.ts       # Orchestrator
│   └── modules/                  # Thematische Config-Module
├── core/                 # Bootstrap & Orchestrierung
├── di_infrastructure/    # Dependency Injection Container
├── foundry/             # Foundry-Adapter (Ports & Services)
│   ├── interfaces/      # Port-Interfaces
│   ├── ports/v13/       # v13-spezifische Implementierungen
│   ├── services/        # Version-agnostische Service-Wrapper
│   └── versioning/      # PortSelector, PortRegistry
├── observability/       # Observability (Metrics, Registry, Tracking)
├── services/            # Business Logic Services
├── tokens/              # Injection Tokens (tokenindex.ts)
├── types/               # Gemeinsame Type Definitions
└── utils/               # Utilities (Result-Pattern, etc.)
```

## Architecture Guidelines

### Public API Development

Änderungen an der Public API (`game.modules.get(MODULE_ID).api`) erfordern besondere Sorgfalt:

**1. Tokens exponieren (src/core/composition-root.ts)**
```typescript
import { newServiceToken } from "@/tokens/tokenindex";

const wellKnownTokens: ModuleApiTokens = {
  // ... existing tokens
  newServiceToken: markAsApiSafe(newServiceToken),
};
```

**2. Type-Definition erweitern (src/core/module-api.ts)**
```typescript
export interface ModuleApiTokens {
  // ... existing tokens
  newServiceToken: ApiSafeToken<NewService>;
}
```

**3. API-CHANGELOG.md aktualisieren**
- Alle API-Änderungen in `[Unreleased]` dokumentieren
- Bei Release: Unreleased → neue API-Version umbenennen
- Separates Changelog für API-Transparenz

**4. Deprecation-Mechanismus (ab 1.0.0)**
```typescript
// Token als deprecated markieren
const oldTokenSafe = markAsDeprecated(
  oldToken,
  "Use newToken for better performance",
  newToken,
  "2.0.0" // Version in der Token entfernt wird
);
```

**5. ReadOnly-Wrapper (für sensible Services)**
- Logger und I18n sind automatisch geprotected
- Neue sensible Services: Wrapper in `public-api-wrappers.ts` erstellen

**API-Regeln:**
- Breaking Changes nur mit ≥1 Major-Version Vorlaufzeit (ab 1.0.0)
- Pre-1.0.0: Breaking Changes erlaubt (Pre-Release Phase)
- Immer Tests für API-Änderungen schreiben
- Dokumentation in API.md aktualisieren

### Port-Adapter-Pattern

Für neue Foundry-Versionen:

1. Interface in `foundry/interfaces/` definieren
2. Port in `foundry/ports/v{version}/` implementieren
3. In entsprechendem Config-Modul unter `src/config/modules/` registrieren (z.B. `foundry-services.config.ts`)
4. Keine Änderungen an Services nötig! 🎉

### Modular Config Structure

DI-Konfiguration ist in thematische Module aufgeteilt:

```
src/config/
├── dependencyconfig.ts                (Orchestrator)
├── modules/
│   ├── core-services.config.ts        (Logger, Metrics, Environment)
│   ├── observability.config.ts        (EventEmitter, ObservabilityRegistry)
│   ├── port-infrastructure.config.ts  (PortSelector, PortRegistries)
│   ├── foundry-services.config.ts     (FoundryGame, Hooks, Document, UI)
│   ├── utility-services.config.ts     (Performance, Retry)
│   ├── i18n-services.config.ts        (I18n Services)
│   └── registrars.config.ts           (ModuleSettingsRegistrar, ModuleHookRegistrar)
```

**Neue Services in das passende thematische Modul einfügen!**

### Dependency Injection

Services deklarieren Dependencies als statische Property:

```typescript
class MyService {
  static dependencies = [loggerToken, gameToken] as const;
  
  constructor(
    private logger: Logger,
    private game: FoundryGame
  ) {}
}
```

### Error Handling

```typescript
// Foundry API-Calls
const result = game.getJournalEntries();
if (!result.ok) {
  logger.error("Failed to load journals", result.error);
  return;
}

// Verwende match() für Pattern Matching
match(result, {
  onOk: (entries) => processEntries(entries),
  onErr: (error) => handleError(error)
});
```

## Changelog Guidelines

**Wichtig:** Die `[Unreleased]` Sektion in `CHANGELOG.md` muss aktuell gehalten werden!

### Bei jeder Änderung:

1. Öffne `CHANGELOG.md`
2. Füge deine Änderung in die passende Kategorie unter `[Unreleased]` ein:
   - **Hinzugefügt** - Neue Features
   - **Geändert** - Änderungen an bestehender Funktionalität
   - **Fehlerbehebungen** - Bug-Fixes
   - **Bekannte Probleme** - Bekannte Bugs/Einschränkungen
   - **Upgrade-Hinweise** - Breaking Changes

### Format:

```markdown
### Hinzugefügt
- **Feature Name**: Kurze Beschreibung ([Details](docs/pfad/zur/dok.md#anchor))

### Geändert
- **Komponente**: Was wurde geändert ([Details](docs/pfad/zur/dok.md))

### Fehlerbehebungen
- **Bug**: Was wurde gefixt (ursprüngliches Problem beschreiben)
```

**Best Practices:**
- ✅ Bold für Hauptthemen
- ✅ Kurze, prägnante Beschreibung
- ✅ Link zu weiterführender Dokumentation (ADRs, Architecture Docs, etc.)
- ✅ Bei Bug-Fixes: Ursprüngliches Problem erwähnen

### Beispiel:

```markdown
### Hinzugefügt
- **ObservabilityRegistry**: Neuer zentraler Hub für Self-Registration Pattern ([Details](docs/adr/0006-observability-strategy.md))

### Fehlerbehebungen
- **PortSelector Events**: Events werden jetzt korrekt abonniert und geloggt (Bug: Events wurden emittiert aber nicht abonniert)
```

## Release Process

**Für Maintainer:** Releases werden mit dem Python-Release-Tool erstellt.

### Automatisierter Workflow:

```bash
# Release-Tool starten
python scripts/release_gui.py
```

Das Tool:
1. ✅ Liest aktuelle Version aus `scripts/constants.cjs`
2. ✅ Zeigt GUI zur Version-Auswahl (Major/Minor/Patch)
3. ✅ Öffnet Modal mit vorbefüllten Changelog-Sektionen (aus `[Unreleased]`)
4. ✅ Erlaubt Bearbeitung + optionale Commit-Bemerkung
5. ✅ Aktualisiert automatisch:
   - `scripts/constants.cjs`, `module.json`, `package.json`, `package-lock.json`
   - `CHANGELOG.md` (Unreleased → neue Version)
   - `docs/releases/v{version}.md` (Release Notes)
6. ✅ Erstellt Conventional Commits: `release: v{version}`
7. ✅ Erstellt Git-Tag mit strukturierter Message
8. ✅ Pushed alles zu GitHub

**Manuelle Schritte nicht mehr nötig!** Das Tool automatisiert den kompletten Release-Prozess.

## Getting Help

- **Discord**: lewellyen
- **Email**: forenadmin.tir@gmail.com
- **Issues**: GitHub Issues für Bugs und Feature Requests

## Code Review Process

Pull Requests werden geprüft auf:

- ✅ Code-Qualität (ESLint, TypeScript)
- ✅ Test-Coverage
- ✅ Dokumentation
- ✅ Breaking Changes (werden klar kommuniziert)
- ✅ Performance-Implikationen

## License

Siehe LICENSE-Datei im Projekt-Root.

---

**Vielen Dank für deinen Beitrag! 🚀**

