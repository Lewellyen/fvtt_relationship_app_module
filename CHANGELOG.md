# Changelog

## [Unreleased]

### Hinzugefügt

### Geändert
- **GitHub Actions: CI und Release kombiniert** (.github/workflows/ci.yml)
  - Release-Job in CI-Workflow integriert mit klaren Dependencies: `test` → `build` → `release`
  - Release läuft nur bei erfolgreichen Tests und Build-Prozess
  - Separater release.yml Workflow entfernt
  - **Artifact-Reuse**: Build-Artifacts werden von build-Job zu release-Job weitergereicht
  - Spart Zeit und Ressourcen: Kein erneutes `npm ci` und `npm run build` im Release-Job
  - Release-Job läuft nur bei Tag-Push (`v*`), wird bei normalem Push übersprungen
  - Alle Schritte in einem Workflow-Run sichtbar für einfacheres Debugging
  - ([Details](docs/adr/) - ADR folgt bei Bedarf)

### Fehlerbehebungen
- **GitHub Actions Release-Workflow**: Fehlende `permissions: contents: write` hinzugefügt
  - Behebt 403-Fehler "Resource not accessible by integration" beim Erstellen von Releases
  - Default GITHUB_TOKEN hatte keine Berechtigung zum Erstellen von Releases
- **GitHub Actions: Release-Qualitätssicherung**
  - Release wird jetzt nur noch nach erfolgreichen CI-Tests erstellt
  - Vorher: Release-Workflow lief unabhängig, ohne auf CI-Tests zu warten
  - Jetzt: Release-Job hat `needs: [test, build]` Dependency

### Bekannte Probleme

### Upgrade-Hinweise

## [0.12.0] - 2025-11-10
### Hinzugefügt
- **ADR-0009: Bootstrap DI Exceptions** (docs/adr/0009-bootstrap-di-exceptions.md)
- Dokumentiert legitime Ausnahmen von DI-Regel in Bootstrap-Phase
- ENV-Import in CompositionRoot (Chicken-Egg-Problem)
- console.error in init-solid.ts (Pre-Logger-Fehler)
- BootstrapErrorHandler als statische Klasse (vor Logger-Verfügbarkeit)
- Definiert klare Phasen: Bootstrap vs. Runtime mit unterschiedlichen Regeln
- **Release-Tool: Automatische Erkennung**: Unterscheidet Code- vs. Dokumentations-Änderungen
- Analysiert `git status` und klassifiziert geänderte Dateien automatisch
- Info-Banner zeigt Erkennungsergebnis mit Liste geänderter Dateien
- Empfiehlt automatisch den passenden Modus (Release vs. Docs-Commit)
- **Release-Tool: Zwei Modi**:
- **Release-Modus**: Version hochsetzen, Build, Tag, GitHub Release (wie bisher)
- **Dokumentations-Modus**: Nur Commit + Push, keine neue Version, kein Tag
- Unreleased-Sektion im CHANGELOG bleibt bei Doku-Commits erhalten
- Sammelt alle Änderungen (inkl. Doku) für den nächsten echten Code-Release
- **GitHub Actions: Automatischer Release-Workflow** (.github/workflows/release.yml)
- Läuft automatisch bei Git-Tags (v*)
- Erstellt Production Build (`npm run build`)
- Generiert module.zip mit allen Foundry VTT-relevanten Dateien
- Erstellt GitHub Release mit Release Notes aus `docs/releases/`
- Markiert v0.x.x automatisch als Pre-Release
- Uploadet module.zip und module.json für Foundry VTT Installation

### Geändert
- **SOLID Refactoring: ModuleApiInitializer** (src/core/api/module-api-initializer.ts)
- DRY: Deprecation-Warning-Logik in private Methode `handleDeprecationWarning()` extrahiert
- SRP: `expose()` Methode von 255 auf ~20 Zeilen reduziert durch Methoden-Extraktion:
- `createResolveFunction()` - Erstellt resolve() mit Wrapper-Logik
- `createResolveWithErrorFunction()` - Erstellt resolveWithError() mit Result-Pattern
- `createApiObject()` - Erstellt komplettes ModuleApi-Objekt
- Deprecation-Warnings bleiben bei console.warn (für externe API-Consumer, nicht interne Logs)
- Verbesserte Testbarkeit und Wartbarkeit durch Methoden-Extraktion
- **SOLID Refactoring: ModuleHookRegistrar** (src/core/module-hook-registrar.ts)
- Logger als Dependency injiziert (statt console.error)
- SRP: Logging-Verantwortlichkeit beim Logger-Service
- Dependency Chain geprüft: Logger (Step 2) -> ModuleHookRegistrar (Step 8) - keine Circular Dependency
- **GitHub Actions: Alle Workflows optimiert mit Whitelist-Ansatz**
- **CI-Workflow** (.github/workflows/ci.yml): Läuft nur bei Code/Config-Änderungen
- **Security Audit** (.github/workflows/security.yml): Läuft nur bei package.json/package-lock.json Änderungen
- **CodeQL Security Analysis** (.github/workflows/codeql.yml): Läuft nur bei Source-Code-Änderungen
- Alle mit `paths:` Whitelist statt Blacklist
- Konsistent mit Release-Tool-Logik (gleiche Definition von "Code")
- Spart massiv GitHub Actions Minutes bei Doku-Commits und Tooling-Updates
- **Release-Tool GUI**: Komplett überarbeitet mit intelligentem Modus-System
- Neue Funktionen in `release_utils.py`: `detect_change_type()`, `get_changed_files_info()`, `is_code_file()`, `is_documentation_file()`
- **Whitelist-Ansatz**: Prüft ob Änderungen in Code-Verzeichnissen (src/, templates/, styles/, lang/) oder wichtigen Config-Dateien
- Alles andere (docs/, scripts/, .github/, *.md, etc.) wird als Doku/Tooling klassifiziert
- Info-Banner mit automatischer Erkennung und Dateiliste
- Radio Buttons für Modus-Auswahl (Release vs. Docs)
- UI passt sich dynamisch an gewählten Modus an (Version-Controls nur bei Release)
- Neue `documentation_commit()` Methode für Doku-Commits ohne Versions-Änderung

### Fehlerbehebungen
- **Release-Tool GUI**: Button-Sperre im Dokumentations-Modus entfernt
- Versions-Validierung läuft nur im Release-Modus
- Im Dokumentations-Modus ist der "Commit erstellen" Button immer aktiv

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.11.2] - 2025-11-10
### Hinzugefügt
- **GitHub Community Standards**: Pull Request Template hinzugefügt (.github/pull_request_template.md)
- Strukturierte Vorlage für PRs mit Type of Change, Testing, Documentation Checklist
- Foundry VTT-spezifische Kompatibilitäts-Sektion
- Breaking Changes Sektion mit Migration Guide
- Foundry-spezifische Informationen (APIs, Hooks, Document Types)
- Hinweis auf Pre-Release Phase (0.x.x)

### Geändert
- **GitHub Issue Templates**: Personalisiert und an Foundry VTT Modul angepasst
- **Bug Report**: Foundry VTT-spezifisch (Foundry Version, Game System, Modul-Konflikte)
- Smartphone-Felder entfernt (nicht relevant für Desktop VTT)
- Console Logs und Modul-Konflikt-Analyse hinzugefügt
- Deutsche Sprache für bessere Accessibility
- **Feature Request**: Foundry-Integration und Kompatibilitäts-Checklisten
- Use-Case-orientiert strukturiert
- Prioritäts- und Breaking-Change-Bewertung
- Bereitschaft zur Mitarbeit abfragbar
- **Frage/Diskussion** (ehemals Custom): Umbenannt und sinnvoll strukturiert
- Dokumentations-Checkliste für Self-Service
- Kontextabfrage für bessere Hilfestellung
- **SECURITY.md**: An Projekt-Versionsstand angepasst (0.x.x Pre-Release Phase)
- Supported Versions Tabelle aktualisiert für 0.x.x
- Detaillierter Vulnerability Reporting Prozess
- Response Timeline und Sicherheitsrichtlinien definiert
- Foundry VTT Community-Kontext hinzugefügt
- **CONTRIBUTING.md**: Repository-URL von GitHub ausgelesen und Platzhalter ersetzt
- **README.md**:
- Versionsstand auf 0.11.1 aktualisiert (war noch 0.10.0)
- Manifest-URL mit korrekter GitHub-URL hinzugefügt
- **package.json**: Repository-Informationen hinzugefügt
- Author: Andreas Rothe mit E-Mail und GitHub-Profil
- Repository, Bugs und Homepage URLs
- License: MIT
- **module.json**: Foundry VTT-spezifische URLs hinzugefügt
- manifest, download, bugs, changelog URLs
- Author URL ergänzt

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.11.1] - 2025-11-09
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- **generate_changelog.py**: Semantic Versioning Sortierung statt alphabetischer String-Sort
- Falsche Reihenfolge: 0.1.0 < 0.10.0 < 0.11.0 < 0.2.0 (String-Sort)
- Korrekte Reihenfolge: 0.1.0 < 0.2.0 < ... < 0.10.0 < 0.11.0 (Semantic-Sort)
- Implementiert custom `parse_version()` Funktion für tuple-basierte Versionsnummer-Vergleiche
- Keine externe Dependency auf `packaging` Modul benötigt

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.11.0] - 2025-11-09
### Hinzugefügt
- **Public API: resolveWithError()**: Result-Pattern Alternative zu resolve() ([Details](docs/API.md#service-auflösung-resolve-vs-resolvewitherror))
- Gibt `Result<T, ContainerError>` zurück
- Wirft nie Exceptions (vollständig Result-Pattern konform)
- Empfohlen für optionale/custom Services
- Unterstützt Deprecation-Warnings und ReadOnly-Wrapper
- Vollständige Test-Coverage (23 Tests für ModuleApiInitializer)

### Geändert
- **Dokumentation**: Versionsaktualisierung von 0.8.0 auf 0.10.0 in 17 Dokumenten ([Details](docs/DOKUMENTATIONS_UPDATES_2025-11-09.md))
- README.md, ARCHITECTURE.md, BOOTFLOW.md aktualisiert
- Alle Hauptdokumentationen (API.md, INDEX.md, PROJECT_ANALYSIS.md, etc.)
- Release-Roadmap und Versioning-Strategy
- Testing- und Quick-Reference-Guides
- Konsistente Versionsinformationen im gesamten Projekt

### Fehlerbehebungen
- **init-solid.ts**: Fehlerhaftes `/* c8 ignore stop */` ohne korrespondierendes `start` entfernt
- Verhinderte Coverage-Messung für init/ready Hooks
- Coverage wiederhergestellt: 63.88% → 100%
- **module-api-initializer.ts**: Coverage für Default-Path (non-wrapped Services) wiederhergestellt
- Test für FoundryGame-Token-Resolution hinzugefügt
- 99.13% → 100% Coverage

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.10.0] - 2025-11-09
### Hinzugefügt
- **ModuleApiInitializer**: Separater DI-Service für API-Exposition ([Details](src/core/api/module-api-initializer.ts))
- Eigenständiger Service statt Methode in CompositionRoot
- Result-Pattern für sichere API-Exposition
- Vollständige Test-Coverage (17 Tests)
- **api-token-config.ts**: Factory für API-Token-Mapping ([Details](src/core/api/api-token-config.ts))
- Zentralisiert Well-Known-Tokens Creation
- Verhindert Code-Duplikation

### Geändert
- **CompositionRoot**: Reduziert auf reine Container-Bootstrap-Verantwortung ([Details](docs/BOOTFLOW.md))
- Entfernt: `exposeToModuleApi()` Methode (-152 Zeilen)
- Fokus: Nur `bootstrap()` und `getContainer()`
- SRP-Konformität: Single Responsibility
- **init-solid.ts**: Orchestriert ModuleApiInitializer via DI ([Details](src/core/init-solid.ts))
- Resolve via `resolveWithError(moduleApiInitializerToken)`
- Result-Pattern für API-Exposition-Fehler
- **Deprecation-Metadata**: Map statt WeakMap für 100% Type-Coverage ([Details](src/di_infrastructure/types/deprecated-token.ts))
- Keine `any`-Casts mehr nötig
- Memory-sicher: Tokens sind Singletons
- **Type-Coverage**: 100% mit gezielten inline-ignores ([Details](docs/guides/type-coverage-exclusions.md))
- 5 technisch notwendige Casts (Generic Type Narrowing) mit `type-coverage:ignore-next-line`
- Kein globales `--ignore-as-assertion` Flag
- Jeder ignored Cast ist dokumentiert und begründet

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.9.0] - 2025-11-09
### Hinzugefügt
- **Deprecation-Mechanismus**: `markAsDeprecated()` ermöglicht sanfte Breaking Changes mit automatischen Console-Warnings ([Details](docs/API-CHANGELOG.md))
- WeakMap-basiertes Metadata-System für Deprecation-Info
- Einmalige Warnungen pro Session (Spam-Prevention)
- Replacement-Token-Vorschläge in Warnmeldungen
- **API-CHANGELOG.md**: Separates Changelog nur für Public API-Änderungen ([Details](docs/API-CHANGELOG.md))
- Unabhängig von internen Modul-Änderungen
- Kategorien: Added, Changed, Deprecated, Removed, Breaking Changes
- Manuell gepflegt für maximale API-Transparenz
- **ReadOnly-Wrapper**: Proxy-basierte Wrapper für sensible Services ([Details](src/core/api/public-api-wrappers.ts))
- `createReadOnlyWrapper()` - Generic Factory für Service-Protection
- `createPublicLogger()` - Blockiert `setMinLevel()`, erlaubt nur Logging
- `createPublicI18n()` - Blockiert interne Properties, erlaubt nur Read-Ops
- Automatisches Wrapping in `CompositionRoot.resolve()`

### Geändert
- **Type-Coverage**: Ziel auf 99.6% angepasst (WeakMap<any> für Deprecation-Metadata technisch notwendig)
- **API resolve()**: Erweitert um Deprecation-Checks und ReadOnly-Wrapping
- **package.json**: Type-Coverage-Check mit `--ignore-as-assertion` Flag

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

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

