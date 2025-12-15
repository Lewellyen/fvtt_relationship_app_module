# Beziehungsnetzwerke für Foundry VTT

Ein Foundry VTT Modul zur Verwaltung und Visualisierung von Beziehungsnetzwerken zwischen Akteuren und anderen Entitäten.

**Version:** 0.44.0
**Status:** ✅ Aktive Entwicklung - Aggressives Refactoring erwünscht!
**Foundry VTT:** v13+ (siehe `module.json`)

## 📑 Inhaltsverzeichnis

- [📋 Features](#-features)
- [🚀 Installation](#-installation)
- [🛠️ Entwicklung](#-entwicklung)
- [📚 Architektur](#-architektur)
- [🔧 Konfiguration](#-konfiguration)
- [🧪 Testing](#-testing)
- [📦 Verwendete Technologien](#-verwendete-technologien)
- [🤝 Beitragen](#-beitragen)
- [📄 Lizenz](#-lizenz)
- [🐛 Bekannte Probleme](#-bekannte-probleme)
- [📝 Changelog](#-changelog)

---

## 📋 Features

- **Beziehungsnetzwerke**: Visualisierung von Beziehungen zwischen Charakteren, NPCs und anderen Entitäten
- **Journal-Integration**: Verstecken von Journal-Einträgen basierend auf Flags
- **Multi-Version-Support**: Unterstützt verschiedene Foundry VTT-Versionen durch Port-Adapter-Pattern
- **Clean Architecture**: Klare Schichtentrennung mit Dependency Injection

---

## 🚀 Installation

👉 **Vollständige Installationsanleitung:** [Installation](./docs/getting-started/installation.md)

### Schnellstart

1. Öffne Foundry VTT
2. Gehe zu **Add-on Modules** → **Install Module**
3. Manifest-URL: `https://github.com/Lewellyen/fvtt_relationship_app_module/releases/latest/download/module.json`
4. Modul in deiner Welt aktivieren

---

## 🛠️ Entwicklung

👉 **Vollständige Entwickler-Dokumentation:** [Entwickler-Guide](./docs/development/README.md)

### Schnellstart

```bash
# Dependencies installieren
npm install

# Entwicklung starten (Watch-Modus)
npm run dev

# Alle Quality-Checks
npm run check-all
```

**Voraussetzungen:**
- Node.js 20.12.0+ (siehe `package.json` engines)
- npm 10.0.0+ oder pnpm
- Foundry VTT 13+

👉 **Weitere Informationen:**
- [Entwicklungssetup](./docs/getting-started/setup.md) - Detaillierte Setup-Anleitung
- [Scripts](./docs/development/scripts.md) - Alle NPM-Scripts dokumentiert
- [Testing](./docs/development/testing.md) - Test-Strategie & Anleitung

---

## 📚 Architektur

Das Modul folgt einer **Clean Architecture** mit klarer Schichtentrennung:

- **Domain Layer**: Framework-unabhängige Geschäftslogik
- **Application Layer**: Anwendungslogik (Services, Use-Cases)
- **Infrastructure Layer**: Technische Infrastruktur (DI, Cache, etc.)
- **Framework Layer**: Framework-Integration (Bootstrap, Config)

### Wichtige Konzepte

- **Port-Adapter-Pattern**: Unterstützung für mehrere Foundry-Versionen
- **Result Pattern**: Explizite Fehlerbehandlung ohne Exceptions
- **Dependency Injection**: ServiceContainer mit Singleton/Transient/Scoped Lifecycles

📖 **Detaillierte Dokumentation:** [Architektur-Dokumentation](./docs/architecture/README.md)

- [Architektur-Übersicht](./docs/architecture/overview.md) - High-Level Architektur
- [Schichten](./docs/architecture/layers.md) - Clean Architecture Schichten
- [Patterns](./docs/architecture/patterns.md) - Port-Adapter, Result, DI
- [Bootstrap](./docs/architecture/bootstrap.md) - Bootstrap-Prozess

👉 **Weitere Architektur-Informationen:** [Architektur-Übersicht](./docs/architecture/overview.md)

---

## 🔧 Konfiguration

👉 **Vollständige Konfigurationsanleitung:** [Konfiguration](./docs/guides/configuration.md)

**Kurzübersicht:**
- **Encoding**: Alle Dateien müssen UTF-8 ohne BOM sein
- **Log-Level**: Über Foundry-Settings oder Browser-Console änderbar
- **Environment Variables**: Build-Time-Konfiguration (ENV-Flags)

---

## 🧪 Testing

👉 **Vollständige Test-Dokumentation:** [Testing](./docs/development/testing.md)

**Schnellstart:**
```bash
npm test              # Alle Tests
npm run test:coverage # Tests mit Coverage
npm run test:watch    # Watch-Modus
```

**Coverage:** 100% (Lines, Functions, Branches, Statements, Type Coverage)

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
- **Custom DI Container** - Dependency Injection mit Modular Config Structure
- **Result Pattern** - Fehlerbehandlung ohne Exceptions
- **Port-Adapter Pattern** - Multi-Version-Support (lazy instantiation)
- **Self-Registration Pattern** - Observability via Self-Registration
- **Type-Safe Tokens** - API-Safe Injection Tokens

---

## 🤝 Beitragen

👉 **Vollständiger Beitrags-Guide:** [Beitragen](./docs/guides/contributing.md)

**Schnellstart:**
1. Fork das Repository
2. Erstelle Feature-Branch
3. Implementiere Änderungen
4. `npm run check-all` ausführen
5. Pull Request erstellen

**Code-Standards:** [Code-Standards](./docs/development/coding-standards.md)
**Versionierung:** [Versionierung](./docs/development/versioning.md)

---

## 📄 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](./LICENSE).

---

## 👤 Autor

**Andreas Rothe**
- Email: forenadmin.tir@gmail.com
- Discord: lewellyen

---

## 🐛 Bekannte Probleme

Keine bekannten Probleme zum aktuellen Zeitpunkt.

Probleme melden: [GitHub Issues](https://github.com/Lewellyen/fvtt_relationship_app_module/issues)

---

## 📝 Changelog

👉 **Vollständige Versionshistorie:** [CHANGELOG.md](./CHANGELOG.md)

**Aktuelle Version:** 0.44.0

---

## 📚 Dokumentation

👉 **Vollständige Dokumentation:** [Dokumentations-Index](./docs/README.md)

**Schnellzugriff:**
- [Installation](./docs/getting-started/installation.md) - Modul installieren
- [Entwicklungssetup](./docs/getting-started/setup.md) - Entwicklungsumgebung
- [Architektur](./docs/architecture/overview.md) - Architektur-Übersicht
- [API-Referenz](./docs/reference/api-reference.md) - Öffentliche API
- [Testing](./docs/development/testing.md) - Test-Strategie
- [Code-Standards](./docs/development/coding-standards.md) - Coding-Konventionen

---

## 🙏 Danksagungen

- Foundry VTT Community
- Alle Contributors

---

**Hinweis**: Dieses Modul befindet sich in aktiver Entwicklung. Features und API können sich ändern.

