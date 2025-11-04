# Beziehungsnetzwerke für Foundry VTT

Ein Foundry VTT Modul zur Verwaltung und Visualisierung von Beziehungsnetzwerken zwischen Akteuren und anderen Entitäten.

---

## 📋 Features

- **Beziehungsnetzwerke**: Visualisierung von Beziehungen zwischen Charakteren, NPCs und anderen Entitäten
- **Journal-Integration**: Verstecken von Journal-Einträgen basierend auf Flags
- **Multi-Version-Support**: Unterstützt verschiedene Foundry VTT-Versionen durch Port-Adapter-Pattern
- **Clean Architecture**: Klare Schichtentrennung mit Dependency Injection

---

## 🚀 Installation

### Automatische Installation

1. Öffne Foundry VTT
2. Gehe zu **Add-on Modules**
3. Klicke **Install Module**
4. Füge die Manifest-URL ein: `<URL zur module.json>`
5. Klicke **Install**

### Manuelle Installation

1. Lade das Modul herunter
2. Entpacke es in `<FoundryData>/modules/fvtt_relationship_app_module`
3. Starte Foundry VTT neu
4. Aktiviere das Modul in deiner Welt

---

## 🛠️ Entwicklung

### Voraussetzungen

- Node.js 18+ 
- npm oder pnpm
- Foundry VTT 13+ ⚠️ **Mindestversion beachten!**

### Setup

```bash
# Dependencies installieren
npm install

# Entwicklungsmodus (mit Watch)
npm run dev

# Production Build
npm run build

# Tests ausführen
npm test

# Code-Qualität prüfen
npm run check-all
```

### Scripts

- `npm run dev` - Vite Build mit Watch-Modus
- `npm run build` - Production Build
- `npm run type-check` - TypeScript Type-Checking
- `npm run lint` - ESLint mit Auto-Fix
- `npm run format` - Prettier Code-Formatierung
- `npm run test` - Vitest Tests
- `npm run check:encoding` - UTF-8 Encoding-Validierung

---

## 📚 Architektur

Das Modul folgt einer **Clean Architecture** mit klarer Schichtentrennung:

```
Core Layer (Bootstrap)
    ↓
Configuration Layer (DI Config)
    ↓
DI Infrastructure Layer (Container)
    ↓
Foundry Adapter Layer (Services → Ports → Foundry API)
```

### Wichtige Konzepte

- **Port-Adapter-Pattern**: Unterstützung für mehrere Foundry-Versionen
- **Result Pattern**: Explizite Fehlerbehandlung ohne Exceptions
- **Dependency Injection**: ServiceContainer mit Singleton/Transient/Scoped Lifecycles

📖 **Detaillierte Dokumentation**: 
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architektur-Details
- [API.md](./docs/API.md) - Öffentliche API für andere Module

### Architektur-Garantien

#### Port-Adapter: Lazy Instantiation

Das Modul verhindert Crashes durch inkompatible Port-Versionen:

- ✅ Nur der kompatible Port wird instantiiert
- ✅ Neuere Ports (v14+) werden auf v13 nie aufgerufen
- ✅ Automatische Fallback-Selektion (v14 → v13)

#### Hook-Kompatibilität

Foundry-Hooks werden sowohl im alten (jQuery) als auch neuen Format (HTMLElement) unterstützt:

- ✅ v10-12: jQuery-Wrapper werden automatisch extrahiert
- ✅ v13+: Native HTMLElement direkt verwendet
- ✅ Keine manuelle Anpassung nötig

#### Type-Safe Public API

Die Modul-API behält volle Typ-Information:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// logger hat Typ Logger (nicht ServiceType)
const logger = api.resolve(api.tokens.loggerToken);
logger.info("Type-safe!"); // Autocomplete funktioniert

// game hat Typ FoundryGame (nicht ServiceType)
const game = api.resolve(api.tokens.foundryGameToken);
const journals = game.getJournalEntries(); // Type-safe!
```

---

## 🔧 Konfiguration

### Encoding

⚠️ **Wichtig**: Alle Dateien müssen als **UTF-8 ohne BOM** gespeichert werden.

Konfiguriere deinen Editor:
- **VS Code**: Standardmäßig UTF-8
- **IntelliJ/WebStorm**: File → File Properties → File Encoding → UTF-8

### TypeScript

Strict Mode ist aktiviert (`tsconfig.json`):
```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true
}
```

### Log-Level zur Laufzeit ändern

Für Debugging in Production können Sie das Log-Level dynamisch anpassen:

**Methode 1: Foundry UI (Empfohlen)**
1. Einstellungen → Module-Konfiguration
2. "Beziehungsnetzwerke für Foundry" → "Log Level"
3. Wähle gewünschtes Level:
   - **DEBUG**: Alle Logs (für Debugging/Fehlersuche)
   - **INFO**: Standard-Logs (Default)
   - **WARN**: Nur Warnungen und Fehler
   - **ERROR**: Nur kritische Fehler
4. **Sofort aktiv** (kein Reload nötig!)

**Methode 2: Browser-Console (Schnell-Zugriff)**
```javascript
// Console öffnen (F12)
const api = game.modules.get('fvtt_relationship_app_module').api;

// DEBUG aktivieren (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
api.resolve(api.tokens.loggerToken).setMinLevel(0);

// Oder über Settings-API (persistiert Änderung)
await api.resolve(api.tokens.foundrySettingsToken).set(
  'fvtt_relationship_app_module', 
  'logLevel', 
  0
);
```

---

## 🧪 Testing

```bash
# Alle Tests ausführen
npm test

# Tests mit UI
npm run test:ui

# Tests mit Coverage
npm run test:coverage

# Tests im Watch-Mode
npm run test:watch
```

---

## 📦 Verwendete Technologien

### Frontend
- **Svelte 5** - Reactive UI Framework mit Runes
- **Flowbite Svelte** - UI-Komponenten
- **@xyflow/svelte** - Graph-Visualisierung
- **Cytoscape.js** - Netzwerk-Visualisierung

### Build & Development
- **Vite** - Build Tool
- **TypeScript** - Type Safety
- **Vitest** - Unit Testing
- **ESLint** - Code Linting
- **Prettier** - Code Formatting

### Architecture
- **Custom DI Container** - Dependency Injection
- **Result Pattern** - Fehlerbehandlung
- **Port-Adapter Pattern** - Multi-Version-Support

---

## 🤝 Beitragen

### Branching-Strategie

- `main` - Stabiler Production Branch
- `develop` - Entwicklungs-Branch
- `feature/*` - Feature-Branches

### Pull Requests

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Führe `npm run check-all` aus
5. Erstelle einen Pull Request

### Code-Konventionen

- **Naming**: PascalCase für Klassen, camelCase für Funktionen/Variablen
- **Result Pattern**: Alle externen Interaktionen geben `Result<T, E>` zurück
- **No throw**: Verwende `Result` statt Exceptions für erwartbare Fehler
- **UTF-8**: Alle Dateien in UTF-8 ohne BOM

---

## 📄 Lizenz

[Lizenz hier einfügen]

---

## 👤 Autor

**Andreas Rothe**
- Email: forenadmin.tir@gmail.com
- Discord: lewellyen

---

## 🐛 Bekannte Probleme

Keine bekannten Probleme zum aktuellen Zeitpunkt.

Probleme melden: [GitHub Issues](URL-hier-einfügen)

---

## 📝 Changelog

### Version 0.0.11 (Aktuell)
- Initiale Entwicklungsversion
- Journal-Entry-Verstecken-Feature
- Port-Adapter-Pattern für Multi-Version-Support
- Clean Architecture mit DI

---

## 🙏 Danksagungen

- Foundry VTT Community
- Alle Contributors

---

**Hinweis**: Dieses Modul befindet sich in aktiver Entwicklung. Features und API können sich ändern.

