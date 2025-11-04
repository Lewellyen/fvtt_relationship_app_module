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
git clone <repository-url>
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

Verwende aussagekräftige Commit-Messages im Format:

```
feat: Add user authentication
fix: Resolve journal loading issue
docs: Update API documentation
test: Add tests for hook registration
refactor: Improve port selection logic
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
├── core/                  # Bootstrap & Orchestrierung
├── di_infrastructure/     # Dependency Injection Container
├── foundry/              # Foundry-Adapter (Ports & Services)
│   ├── interfaces/       # Port-Interfaces
│   ├── ports/v13/        # v13-spezifische Implementierungen
│   └── services/         # Version-agnostische Service-Wrapper
├── services/             # Business Logic Services
├── utils/                # Utilities (Result-Pattern, etc.)
└── types/                # Gemeinsame Type Definitions
```

## Architecture Guidelines

### Port-Adapter-Pattern

Für neue Foundry-Versionen:

1. Interface in `foundry/interfaces/` definieren
2. Port in `foundry/ports/v{version}/` implementieren
3. In `dependencyconfig.ts` registrieren
4. Keine Änderungen an Services nötig! 🎉

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

## Release Process

1. Version in `package.json` und `module.json` erhöhen
2. Changelog in `docs/development/foundry/releases/` erstellen
3. `npm run build` ausführen
4. Git Tag erstellen: `git tag v0.0.15`
5. Push mit Tags: `git push --tags`

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

