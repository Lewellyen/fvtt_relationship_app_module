# Changelog

## [Unreleased]

### Hinzugefügt

### Geändert

### Fehlerbehebungen

### Bekannte Probleme

### Upgrade-Hinweise

## [0.8.0] - 2025-11-09
### Hinzugefügt
- **ObservabilityRegistry**: Neuer zentraler Hub für Self-Registration Pattern ([Details](docs/adr/0006-observability-strategy.md#update-2025-11-09-self-registration-pattern--observabilityregistry))
- **Modular Config Structure**: DI-Konfiguration in 7 thematische Module aufgeteilt ([Details](docs/DOKUMENTATIONS_UPDATES_2025-11-09.md#2-modular-config-structure))
- `core-services.config.ts` - Logger, Metrics, Environment
- `observability.config.ts` - EventEmitter, ObservabilityRegistry
- `port-infrastructure.config.ts` - PortSelector, PortRegistries
- `foundry-services.config.ts` - FoundryGame, Hooks, Document, UI
- `utility-services.config.ts` - Performance, Retry
- `i18n-services.config.ts` - I18n Services
- `registrars.config.ts` - ModuleSettingsRegistrar, ModuleHookRegistrar
- **Self-Registration Pattern**: Services registrieren sich automatisch für Observability im Constructor ([Details](docs/BOOTFLOW.md#observability--self-registration))
- **ObservableService Interface**: Type-Safe Event-System für Observable Services

### Geändert
- **Self-Configuring Services**: Logger konfiguriert sich selbst via `EnvironmentConfig` Dependency ([Details](docs/DOKUMENTATIONS_UPDATES_2025-11-09.md#3-self-configuring-services))
- **DI-Managed Registrars**: `ModuleSettingsRegistrar` und `ModuleHookRegistrar` werden via DI aufgelöst statt mit `new` instantiiert ([Details](docs/DOKUMENTATIONS_UPDATES_2025-11-09.md#4-di-managed-registrars))
- **PortSelectionEventEmitter**: Als TRANSIENT Service für bessere Testability ([Details](ARCHITECTURE.md#observability--self-registration-pattern))
- **dependencyconfig.ts**: Jetzt Orchestrator statt monolithische Config-Datei (150 statt 400+ Zeilen)
- **Release-Tool Commits**: Verwenden jetzt Conventional Commits Format (`release: v{version}`) mit strukturierten Changelog-Sektionen
- **Release-Tool Pfade**: Korrigiert zu `docs/releases/` (vorher fehlerhafter Pfad)
- **CONTRIBUTING.md**: Aktualisiert mit Conventional Commits, Changelog Guidelines, aktuellem Release-Prozess und Modular Config Structure
- **README.md**: Version auf 0.8.0, neue Architektur-Patterns dokumentiert
- **INDEX.md**: Version auf 0.8.0, neue Dokumentation verlinkt
- **QUICK_REFERENCE.md**: Neue Services & Tokens hinzugefügt (ObservabilityRegistry, EventEmitter, Registrars)
- **PROJECT_ANALYSIS.md**: 5 neue Services dokumentiert (Nr. 17-21)
- **DEPENDENCY_MAP.md**: Neue Dependencies und Services in Dependency-Tree eingetragen
- **TESTING.md**: Coverage-Requirements auf 100% aktualisiert
- **DOKUMENTENLAGE_ÜBERSICHT.md**: Version auf 0.8.0
- **VERSIONING_STRATEGY.md**: Aktueller Status auf 0.8.0
- **REFACTORING_ROADMAP.md**: Version auf 0.8.0, Modular Config als umgesetzt markiert

### Fehlerbehebungen
- **PortSelector Events**: Events werden jetzt korrekt abonniert und geloggt (ursprünglicher Bug: Events wurden emittiert aber nicht abonniert)
- **Metriken**: Port-Selection-Metriken werden wieder erfasst

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.7.1] - 2025-11-09
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- falscher Toolaufruf in ci.yml gefixt.

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.7.0] - 2025-11-09
### Hinzugefügt
- Keine Einträge

### Geändert
- Einige Utilities wurden zu Services umgebaut.

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.6.1] - 2025-11-08
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Im Container-Resolver war ein c8 ignore nicht richtig gesetzt.

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.6.0] - 2025-11-08
### Hinzugefügt
- Keine Einträge

### Geändert
- Utilities in Services umgewandelt (ENV)

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.5.4] - 2025-11-07
### Hinzugefügt
- Keine Einträge

### Geändert
- type-coverage auf 100%

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.5.3] - 2025-11-06
### Hinzugefügt
- Keine Einträge

### Geändert
- CI/CD Node auf 20/22 erhöht statt wie vorher 18/20

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.5.2] - 2025-11-06
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.5.1] - 2025-11-06
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.5.0] - 2025-11-06
### Hinzugefügt
- Localisationsupport

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.4.1] - 2025-11-06
### Hinzugefügt
- Keine Einträge

### Geändert
- Codeanpassungen nach Audit. Siehe Dokumentation.

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.4.0] - 2025-11-06
### Hinzugefügt
- .env.example hinzugefügt
- Auditdokumentation angelegt.

### Geändert
- Testing verbessert

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.3.0] - 2025-11-06
### Hinzugefügt
- Keine Einträge

### Geändert
- TestCoverage auf 100%

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.2.0] - 2025-11-05
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.1.0] - 2025-11-04
### Hinzugefügt
- Keine Einträge

### Geändert
- Zahlreiche Absicherungen und Optimierungen

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.9] - 2025-10-29
### Hinzugefügt
- Keine Einträge

### Geändert
- Verbesserungen am DI-Container mit weiteren Methoden
- Dokumentation mit JSDoc verbessert

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.8] - 2025-10-27
### Hinzugefügt
- Einführung Resultpattern

### Geändert
- Einführung Resultpattern

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.7] - 2025-10-27
### Hinzugefügt
- Containerstruktur Prototyp

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.6] - 2025-10-26
### Hinzugefügt
- Keine Einträge

### Geändert
- Umbenennungen und Aufräumarbeiten + Dokumentationen hinzugefügt.

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.5] - 2025-10-25
### Hinzugefügt
- Keine Einträge

### Geändert
- Basis-Modul-Skelett erstellt

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.4] - 2025-10-24
### Hinzugefügt
- Keine Einträge

### Geändert
- Setup-Dev-Umgebung

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.15] - 2025-11-04
### Hinzugefügt
- Logger-Setting hinzugefügt inklusive Service, Foundryport, Token und Api

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.14] - 2025-11-03
### Hinzugefügt
- Keine Einträge

### Geändert
- BREAKING CHANGE: All Foundry interfaces now return Result<T, FoundryError> instead of Result<T, string>
- Features:
- Add structured FoundryError type with 6 error codes (API_NOT_AVAILABLE, VALIDATION_FAILED, NOT_FOUND, ACCESS_DENIED, PORT_SELECTION_FAILED, OPERATION_FAILED)
- Add Zod-based journal entry validation in FoundryGamePort
- Add XSS protection with sanitizeId() and sanitizeHtml() utilities
- Add registerPortToRegistry() helper to reduce code duplication in DI setup
- Extend ContainerError with PartialDisposal code and details field
- Improvements:
- Refactor ScopeManager.dispose() to collect errors structurally instead of console.warn
- Update JournalVisibilityService to use structured error logging with context
- Migrate all Foundry ports, services, and interfaces to FoundryError
- Migrate all tests to assert on structured error objects
- Tests:
- Add 15 new tests for Zod validation and sanitization utilities
- Add test for ScopeManager PartialDisposal error handling
- Update 40+ existing tests to use structured FoundryError assertions
- All 332 tests passing
- Docs:
- Add JSDoc for FoundryError factory and type guards
- Document XSS protection in sanitization utilities

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.13] - 2025-11-03
### Hinzugefügt
- Keine Einträge

### Geändert
- Port-Lazy-Instantiation: Verhindert Crashes durch v14-Ports auf v13
- jQuery-Kompatibilität: extractHtmlElement() für v10-13
- Bootstrap-Graceful-Degradation: Keine Exception mehr
- API-Typsicherheit: ModuleApiTokens mit konkreten Generics
- Tests: 317/317 passed, Coverage: 93.6%"

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.12] - 2025-11-02
### Hinzugefügt
- Test-Suite

### Geändert
- Fehlerbehandlung verbessert.

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.11] - 2025-10-31
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Bugfix Loggeraufruf init-solid.ts

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.0.10] - 2025-10-30
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

