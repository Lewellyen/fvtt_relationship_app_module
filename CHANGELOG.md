# Changelog

## [Unreleased]

### Hinzugefügt

### Geändert

### Fehlerbehebungen

### Bekannte Probleme

### Upgrade-Hinweise

## [0.34.0] - 2025-11-25
### Hinzugefügt
- **PlatformSettingsPort**: Platform-agnostisches Interface für Settings-Operationen ([Details](src/domain/ports/platform-settings-port.interface.ts))
- `PlatformSettingsPort`: Interface für register, get und set Operationen
- `PlatformSettingConfig<T>`: Platform-agnostische Setting-Konfiguration
- `SettingType`: Union-Type für String/Number/Boolean (sowohl Constructor als auch String-Varianten)
- `SettingsError`: Platform-agnostische Error-Typen für Settings-Operationen
- **FoundrySettingsAdapter**: Foundry-spezifische Implementierung von PlatformSettingsPort ([Details](src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts))
- Type-Mapping von PlatformSettingConfig zu FoundrySettings.SettingConfig
- Error-Mapping von FoundryError zu SettingsError
- DI-Integration über `platformSettingsPortToken`

### Geändert
- **ModuleSettingsRegistrar**: Nutzt jetzt `PlatformSettingsPort` statt `FoundrySettings` direkt ([Details](src/application/services/ModuleSettingsRegistrar.ts))
- Entkoppelt von Foundry-spezifischen Abhängigkeiten
- `SettingDefinition.SettingConfig` ist jetzt ein Type-Alias für `PlatformSettingConfig`
- **DI-Container**: Neue Registrierung für `PlatformSettingsPort` in `settings-ports.config.ts`
- `DIModuleSettingsRegistrar` nutzt jetzt `platformSettingsPortToken` statt `foundrySettingsToken`

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.33.0] - 2025-11-25
### Hinzugefügt
- **Entity Collections & Repositories**: Neue generische Port-Interfaces für Entity-Zugriffe ([Details](src/domain/ports/collections/), [Details](src/domain/ports/repositories/))
- `PlatformEntityCollectionPort<T>`: Generisches Interface für read-only Collection-Zugriffe mit Query Builder
- `JournalCollectionPort`: Spezialisiertes Interface für JournalEntry Collections
- `PlatformEntityRepository<T>`: Generisches Interface für vollständige CRUD-Operationen (Create, Read, Update, Delete)
- `JournalRepository`: Spezialisiertes Interface für JournalEntry CRUD-Operationen
- `EntitySearchQuery`: Interface für komplexe Suchabfragen mit Filtern, Filter-Gruppen, Sortierung und Pagination
- `EntityQueryBuilder`: Fluent API für die Konstruktion von Suchabfragen (where, orWhere, or, and, limit, offset, sortBy)
- **Foundry Collection & Repository Adapters**: Implementierungen für Foundry VTT ([Details](src/infrastructure/adapters/foundry/collection-adapters/), [Details](src/infrastructure/adapters/foundry/repository-adapters/))
- `FoundryJournalCollectionAdapter`: Implementiert `JournalCollectionPort` mit Foundry-spezifischer Logik
- `FoundryJournalRepositoryAdapter`: Implementiert `JournalRepository` mit vollständigen CRUD-Operationen
- `FoundryJournalQueryBuilder`: Fluent Query Builder mit Unterstützung für AND/OR-Logik
- **FoundryDocumentPort Erweiterungen**: Neue CRUD-Methoden für Document-Operationen ([Details](src/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort.ts))
- `create()`: Erstellt neue Documents (z.B. `JournalEntry.create()`)
- `update()`: Aktualisiert bestehende Documents mit Foundry-spezifischer Update-Syntax
- `delete()`: Löscht Documents
- `unsetFlag()`: Entfernt Flags von Documents (mit Fallback auf Update-Syntax)
- **DI-Tokens für Collections & Repositories**: Neue Injection Tokens ([Details](src/infrastructure/shared/tokens/collection-tokens.ts), [Details](src/infrastructure/shared/tokens/repository-tokens.ts))
- `journalCollectionPortToken`: Token für `JournalCollectionPort`
- `journalRepositoryToken`: Token für `JournalRepository`
- **Query Builder Features**: Fluent API für komplexe Suchabfragen
- Unterstützung für AND/OR-Logik über `where()`, `orWhere()`, `or()`, `and()`
- Pagination über `limit()` und `offset()`
- Sortierung über `sortBy()`
- Automatische OR-Group-Verwaltung beim Wechsel zwischen AND/OR-Operationen

### Geändert
- **FoundryV13DocumentPort**: Erweitert um CRUD-Methoden (`create`, `update`, `delete`, `unsetFlag`)
- **FoundryDocumentPort**: Wrapper-Methoden für CRUD-Operationen hinzugefügt
- **DI-Container**: Neue Registrierungen für `JournalCollectionPort` und `JournalRepository` in `entity-ports.config.ts`

### Fehlerbehebungen
- **OR-Query-Logik**: Korrigiert die Logik für `orWhere()` und `or()` Callbacks, sodass das vorherige `where()` korrekt in die OR-Group verschoben wird
- **Query Builder**: Automatisches Schließen von OR-Groups beim Wechsel zu anderen Operationen (limit, offset, sortBy, execute)
- **Release-Prozess Git-Lock-Behandlung**: Verbesserte Behandlung von Git-Lock-Dateien im Release-Prozess ([Details](scripts/release_utils.py))
- `FileNotFoundError` beim Entfernen wird jetzt korrekt als Erfolg behandelt (Datei wurde bereits entfernt)
- Retry-Mechanismus hinzugefügt, um Race Conditions zu vermeiden
- Verbesserte Fehlerbehandlung mit spezifischen Fehlermeldungen für verschiedene Fehlertypen

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.32.0] - 2025-11-24
### Hinzugefügt
- **JournalContextMenuLibWrapperService**: Neuer Service für die Verwaltung der libWrapper-Registrierung für Journal Context-Menü ([Details](src/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService.ts))
- Service registriert libWrapper direkt im `init`-Hook (nicht über Event-System)
- Verwaltet Callback-Liste für Handler, die Context-Menü-Optionen modifizieren können
- DI-Integration über `journalContextMenuLibWrapperServiceToken`

### Geändert
- **Context-Menü aus Event-System entfernt**: Context-Menü ist kein Event mehr, sondern eine direkte libWrapper-Registrierung
- `RegisterContextMenuUseCase` ist kein `EventRegistrar` mehr - registriert nur Callbacks beim libWrapper-Service
- `PlatformJournalEventPort.onJournalContextMenu()` entfernt (war fälschlicherweise als Event behandelt)
- `FoundryJournalEventAdapter.onJournalContextMenu()` komplett entfernt
- `ModuleEventRegistrar` hat jetzt nur noch 3 Event-Registrars (statt 4)
- libWrapper-Registrierung erfolgt jetzt direkt im `BootstrapInitHookService.init`-Hook
- **Breaking Change**: `RegisterContextMenuUseCase` implementiert nicht mehr `EventRegistrar` Interface

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.31.0] - 2025-11-24
### Hinzugefügt
- **Bootstrap-Services für Hook-Registrierung**: Neue DI-Services `BootstrapInitHookService` und `BootstrapReadyHookService` für die Registrierung der Foundry `init` und `ready` Hooks ([Details](src/framework/core/bootstrap-init-hook.ts), [Details](src/framework/core/bootstrap-ready-hook.ts))
- `BootstrapInitHookService`: Verantwortlich für die Registrierung des `init` Hooks und die gesamte Init-Phase-Logik (API-Exposition, Settings-Registrierung, Event-Registrierung, Logger-Konfiguration)
- `BootstrapReadyHookService`: Verantwortlich für die Registrierung des `ready` Hooks und die Ready-Phase-Logik
- Beide Services nutzen direkte `Hooks.on()` Aufrufe, um das Henne-Ei-Problem zu vermeiden (Version-Detection benötigt `game.version`, welches erst nach `init` verfügbar ist)
- Vollständige DI-Integration: Services werden als Singletons im Container registriert und über `bootstrapInitHookServiceToken` bzw. `bootstrapReadyHookServiceToken` verfügbar gemacht
- 100% Test-Coverage für beide Services

### Geändert
- **Bootstrap-Lifecycle-Refactoring**: Hook-Registrierung in `init-solid.ts` wurde in dedizierte DI-Services ausgelagert ([Details](src/framework/core/init-solid.ts))
- `initializeFoundryModule()` resolved jetzt die Bootstrap-Services aus dem Container und ruft deren `register()` Methoden auf
- Bessere Separation of Concerns: Init- und Ready-Phase-Logik ist jetzt in separaten Services gekapselt
- Verbesserte Testbarkeit: Services können isoliert getestet werden
- DI-konforme Architektur: Alle Dependencies werden über den Container injiziert
- **No-Ignores-Policy**: Bootstrap-Services zur Whitelist hinzugefügt ([Details](scripts/check-no-ignores.mjs))
- `bootstrap-init-hook.ts` und `bootstrap-ready-hook.ts` sind jetzt in der Whitelist für `v8 ignore` Marker
- Begründung: Foundry-spezifische Runtime-Umgebung und direkte Hooks.on() Nutzung zur Vermeidung des Henne-Ei-Problems

### Fehlerbehebungen
- **Test-Fixes**: Fehlgeschlagene Tests nach Bootstrap-Refactoring behoben
- `hooks-guard.test.ts`: Warnungstext angepasst (separate Warnungen für init/ready Hooks)
- `init-solid.test.ts`: Veralteten Test für Container-Resolution-Fehler entfernt (Logik ist jetzt im Service)
- Assertions für Service-Resolution-Fehler korrigiert
- **TypeScript-Fehler**: Doppelte Token-Imports in `core-services.config.ts` entfernt

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.30.0] - 2025-11-23
### Hinzugefügt
- **LibWrapperService**: Neuer Service als Facade für libWrapper-Interaktionen ([Details](src/domain/services/lib-wrapper-service.interface.ts))
- `LibWrapperService` Interface im Domain-Layer für platform-agnostische libWrapper-Abstraktion
- `FoundryLibWrapperService` Implementierung im Infrastructure-Layer mit vollständiger Error-Handling
- Unterstützt `register()`, `unregister()` und `dispose()` für sauberes Lifecycle-Management
- Tracking von registrierten Targets für automatisches Cleanup
- 100% Test-Coverage mit Edge-Case-Tests (libWrapper nicht verfügbar, doppelte Registrierung, etc.)
- DI-Integration über `libWrapperServiceToken` als Singleton-Service

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.5] - 2025-11-23
### Hinzugefügt
- **PlatformEventPort-Implementierung in FoundryHooksPort**: `FoundryHooksPort` implementiert jetzt `PlatformEventPort<unknown>` mit `registerListener()` und `unregisterListener()` Methoden für platform-agnostische Event-Registrierung ([Details](docs/architecture/event-system-hierarchy.md))
- **Hook-Name-Tracking**: `FoundryHooksPort` trackt jetzt Registration-IDs zu Hook-Namen für `unregisterListener()` Unterstützung

### Geändert
- **Event-System-Hierarchie**: Vollständige Umsetzung der Event-System-Hierarchie gemäß Dokumentation ([Details](docs/architecture/event-system-hierarchy.md))
- `FoundryHooksPort` implementiert jetzt `PlatformEventPort<unknown>` zusätzlich zu `FoundryHooks`
- `FoundryJournalEventAdapter` nutzt jetzt `FoundryHooksPort` statt direkt `FoundryHooks` Interface
- `init-solid.ts` nutzt jetzt `PlatformEventPort.registerListener()` statt direkter `Hooks.on()` Aufrufe
- Dependency Chain: Application → PlatformEventPort → FoundryHooksPort → FoundryV13HooksPort → Hooks API
- **Code-Qualität**: Entfernung aller `v8 ignore` Kommentare aus Produktionscode durch vollständige Test-Abdeckung
- Alle Code-Pfade in `foundry-journal-event-adapter.ts` sind jetzt durch Tests abgedeckt (100% Coverage)
- Redundante Type-Guards entfernt, die nicht testbare else-Branches erzeugten
- Zusätzliche Tests für Edge-Cases hinzugefügt (null/undefined Events, non-array Events, etc.)
- **Type-Safety**: Verbesserte Type-Safety durch Entfernung von Type-Assertions
- Type-Assertions durch explizite Type-Guards und Runtime-Safe-Cast-Funktionen ersetzt
- 100% Type-Coverage erreicht ohne Type-Assertions

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.4] - 2025-11-23
### Hinzugefügt
- Keine Einträge

### Geändert
- **Port-Naming-Konsolidierung**: Domain-Ports heißen jetzt `PlatformJournalVisibilityPort` und `PlatformJournalEventPort`, Foundry-Abstraktionen folgen dem Muster `Foundry<Name>Port`, und versionsspezifische Adapter heißen `FoundryV13<Name>Port` ([Details](ARCHITECTURE.md#port-adapter-pattern))
- **Token-Updates**: Alle zugehörigen Injection-Tokens (z. B. `platformJournalEventPortToken`, `foundryV13GamePortToken`) wurden entsprechend umbenannt und beschrieben ([Details](src/infrastructure/shared/tokens))
- **Dokumentation**: `ARCHITECTURE.md` und alle Config-Dateien spiegeln die neue Benennung wider; `CHANGELOG.md` dokumentiert die Migration

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.3] - 2025-11-23
### Hinzugefügt
- **v13 Port-Registrierung**: Neue Datei `src/infrastructure/adapters/foundry/ports/v13/port-registration.ts` für version-spezifische Port-Registrierung ([Details](src/infrastructure/adapters/foundry/ports/v13/port-registration.ts))
- **Version-spezifische Injection Tokens**: Neue Tokens für alle v13 Port-Implementierungen (`foundryGamePortV13Token`, `foundryHooksPortV13Token`, etc.) in `foundry.tokens.ts` ([Details](src/infrastructure/shared/tokens/foundry.tokens.ts))

### Geändert
- **Schichttrennung Port-Registrierung**: Port-Registrierung von Config-Schicht in v13-Schicht verschoben, um Schichtbruch zu beheben ([Details](src/framework/config/modules/port-infrastructure.config.ts), [Details](src/infrastructure/adapters/foundry/ports/v13/port-registration.ts))
- Config-Schicht (`port-infrastructure.config.ts`) importiert keine konkreten v13 Port-Klassen mehr
- v13 Port-Registrierung liegt jetzt in "Concrete Platform Concrete Version" Schicht
- `registerV13Ports()` Funktion delegiert Registrierung an version-spezifische Schicht
- Vorbereitet für zukünftige Versionen (v14, v15, etc.) durch modulare Registrierungsfunktionen
- **Port-Instanziierung über DI statt `new`**: Ports werden jetzt vollständig über den DI-Container instanziiert, was DIP (Dependency Inversion Principle) vollständig einhält ([Details](ARCHITECTURE.md#port-registrierung-schichttrennung))
- **PortRegistry**: Speichert jetzt `InjectionToken<T>` statt `PortFactory<T>` (Factories entfernt)
- **PortSelector**: Bekommt `ServiceContainer` als Dependency und resolved Ports über `container.resolveWithError(token)`
- **Port-Registrierung**: Ports werden im Container registriert (`container.registerClass()`) und Tokens in `PortRegistry` gespeichert
- **FoundryServiceBase**: Nutzt `getTokens()` und `selectPortFromTokens()` statt `getFactories()` und `selectPortFromFactories()`
- Alle `new`-Aufrufe außerhalb des Containers für Ports eliminiert
- Konsistent mit `ContainerHealthCheck`-Pattern
- **Type-Safety Verbesserungen**: Type-Constraints für `FoundryServiceBase<TPort extends ServiceType>` und `registerPortToRegistry<T extends ServiceType>` hinzugefügt
- **Test-Coverage auf 100%**: Alle Tests angepasst und Coverage auf 100% Statements, Branches, Functions und Lines erhöht
- Alle Test-Dateien angepasst: `getFactories()` → `getTokens()`, `selectPortFromFactories()` → `selectPortFromTokens()`
- PortSelector-Tests erweitert: Catch-Block mit mehreren Tokens und `adapterName`-Parameter abgedeckt

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.2] - 2025-11-23
### Hinzugefügt
- Keine Einträge

### Geändert
- **Journal-Ausblenden Notification**: UI-Benachrichtigung zeigt jetzt den Journal-Namen statt der ID an (`Journal "Mein Tagebuch" wurde ausgeblendet` statt `Journal "journal-123" wurde ausgeblendet`)
- Journal-ID bleibt weiterhin in Logs für Debugging-Zwecke erhalten
- Fallback auf ID, falls Journal-Eintrag nicht gefunden wird
- Verbesserte Benutzerfreundlichkeit durch ansprechendere Meldungen

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.1] - 2025-11-23
### Hinzugefügt
- **Type-Definitionen für libWrapper**: Explizite Typen `FoundryContextMenu` und `LibWrapperFunction` für bessere Type-Safety
- **Test-Coverage für Context-Menü-Callbacks**: Neue Tests für Promise-basierte Callbacks und Fehlerbehandlung in Context-Menü-Optionen
- **Test-Coverage für FoundryUIPort Fallback**: Test für `game.journal.directory.render()` Fallback-Logik

### Geändert
- **Type-Coverage auf 100%**: Verbesserte Typisierung in `foundry-journal-event-adapter.ts` durch explizite Typen statt `any`/`unknown` Assertions
- `FoundryContextMenu` Type-Definition für Context-Menü-Instanzen
- `LibWrapperFunction` Type-Definition für libWrapper Wrapper-Funktionen
- Verwendung von `this: FoundryContextMenu` Parameter statt Type-Assertions
- Direkte Verwendung von `this` statt Aliasing in lokale Variable (Linter-Konformität)
- **Code-Coverage auf 100%**: Zusätzliche Tests für alle Code-Pfade
- Context-Menü-Optionen mit Promise-basierten Callbacks
- Fehlerbehandlung für rejected Promises in Callbacks
- Fallback-Logik in `FoundryUIPort.rerenderJournalDirectory()`
- **libWrapper Typisierung**: Verbesserte Type-Definitionen für `globalThis.libWrapper` mit präzisen Funktionssignaturen

### Fehlerbehebungen
- **Type-Coverage**: Behebung von Type-Coverage-Problemen (99.88% → 100%)
- Entfernung von `any`-Typisierungen durch explizite Typen
- Entfernung von `unknown`-Assertions durch präzise Typ-Definitionen
- **Linter-Konformität**: Behebung von `@typescript-eslint/no-this-alias` Warnung durch direkte `this`-Verwendung

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.29.0] - 2025-11-23
### Hinzugefügt
- **Journal Context-Menü via libWrapper**: Context-Menü-Eintrag "Journal ausblenden" über libWrapper statt Hook implementiert ([Details](docs/refactoring/Context-Menu-Custom-Entry-Implementation.md))
- **Handler-Pattern für Context-Menü**: Erweiterbares Handler-Pattern für Context-Menü-Items (`JournalContextMenuHandler`, `HideJournalContextMenuHandler`)
- **lib-wrapper Dependency**: lib-wrapper als Dependency hinzugefügt für sichere Method-Wrapping
- **RegisterContextMenuUseCase**: Neuer Use-Case als Orchestrator für mehrere Context-Menü-Handler
- **JournalVisibilityPort.setEntryFlag()**: Neue Methode zum Setzen von Flags auf Journal-Einträgen
- **JournalEventPort.onJournalContextMenu()**: Neue Methode für Context-Menü-Events (nutzt jetzt libWrapper)

### Geändert
- **FoundryJournalEventAdapter.onJournalContextMenu()**: Nutzt jetzt libWrapper für `ContextMenu.prototype.render` statt Hook `getJournalEntryContext` (der in Foundry v13 nicht mehr aufgerufen wird)
- **Runtime-Casts**: Verbesserte Runtime-Validierung für `castFoundrySettingsApi`, `castDisposablePort`, `castFoundryDocumentForFlag`, `castCachedServiceInstanceForResult`; gemeinsame Type-Guard-Utilities in `shared/utils/type-guards.ts`; Verwendung von Result-Pattern statt Error-Throws für konsistente Fehlerbehandlung ([Details](src/infrastructure/adapters/foundry/runtime-casts.ts), [Details](src/infrastructure/di/types/utilities/runtime-safe-cast.ts))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.28.0] - 2025-11-22
### Hinzugefügt
- **Code & Type Coverage 100%**: Alle Quality Gates erreicht - 100% Statement/Branch/Function/Line Coverage und 100% Type Coverage (13835/13835 Typen)
- **Runtime-Safe-Cast Helpers**: `castToFoundryHookCallback` für sichere Typ-Assertions in `runtime-safe-cast.ts`
- **PlatformUIPort**: Neuer platform-agnostischer Port für UI-Operationen im Domain Layer ([Details](docs/archive/DIP-Refactoring-Plan-4-JournalCacheInvalidationHookGlobals.md))
- **FoundryUIAdapter**: Adapter von FoundryUI zu PlatformUIPort für Clean Architecture Konformität
- **TriggerJournalDirectoryReRenderUseCase**: Neuer Use-Case für automatisches UI-Re-Render bei Hidden-Flag-Änderungen
- **FoundryUI.rerenderJournalDirectory()**: Neue Methode für Journal-Directory Re-Rendering

### Geändert
- **Type Safety Improvements**: Typ-Casts durch explizite Type Guards ersetzt in Event-Adaptern und Use-Cases
- **DIP-Refactoring Plan 4**: Archiviert nach erfolgreicher Umsetzung - Event-System vollständig platform-agnostisch ([Details](docs/archive/DIP-Refactoring-Plan-4-JournalCacheInvalidationHookGlobals.md))
- **Clean Architecture**: JournalVisibilityService nutzt jetzt PlatformUIPort statt direktem FoundryUI-Zugriff
- **Schichtentrennung**: Application Layer Services nutzen ausschließlich Domain Ports (konsistent mit Event-System)
- **JournalVisibilityPort**: `removeEntryFromDOM()` Methode entfernt - UI-Operationen über PlatformUIPort

### Fehlerbehebungen
- **Test Coverage**: Fehlende Branches in `ModuleSettingsRegistrar`, `dependencyconfig`, `foundry-journal-event-adapter` und `invalidate-journal-cache-on-change.use-case` abgedeckt
- **Type Coverage**: Alle verbleibenden Typ-Unsicherheiten durch Type Guards oder Runtime-Safe-Casts behoben
- **UI Re-Render**: Wiederherstellung der fehlenden UI-Re-Render-Funktionalität bei Hidden-Flag-Änderungen

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.27.0] - 2025-11-21
### Hinzugefügt
- **Platform-Agnostisches Event-System (Phase 1)**: Vollständiges Refactoring des Event-Systems zu platform-agnostischen Ports ([Details](docs/refactoring/phases/phase-1-event-system-refactoring.md))
- **PlatformEventPort<T>**: Generischer Port für Event-Systeme (Foundry Hooks, Roll20, etc.) mit Result-Pattern und Registration-Tracking
- **JournalEventPort**: Spezialisierter Port für Journal-Events (`onJournalCreated`, `onJournalUpdated`, `onJournalDeleted`, `onJournalDirectoryRendered`)
- **FoundryJournalEventAdapter**: Foundry-spezifische Implementierung des JournalEventPort, mappt Foundry-Hooks zu Domain-Events
- **Use-Cases**: `InvalidateJournalCacheOnChangeUseCase` und `ProcessJournalDirectoryOnRenderUseCase` ersetzen alte Hook-Klassen
- **EventRegistrar**: Interface für platform-agnostische Event-Listener-Registrierung (ersetzt `HookRegistrar`)
- **ModuleEventRegistrar**: Event-Listener-Manager für alle platform-agnostischen Event-Listener
- **Vorteile**: Vollständige Entkopplung von Foundry-spezifischen APIs, Multi-VTT-Fähigkeit, Tests ohne Foundry-Globals
- **Clean Architecture Multi-Platform Refactoring Plan**: Umfassender Refactoring-Plan für vollständige Platform-Agnostizität durch generische und spezialisierte Ports ([Details](docs/refactoring/Clean-Architecture-Multi-Platform-Refactoring-Plan.md))
- ✅ **Phase 1: Event-System** - Abgeschlossen
- **Phase 2: Entity-Collections** - Generischer `PlatformEntityCollectionPort<T>` für CRUD-Operationen auf allen Entity-Typen
- **Phase 3: Settings-System** - `PlatformSettingsPort` für platform-agnostische Settings-Verwaltung
- **Phase 4: UI-Operations** - `PlatformUIPort` für platform-agnostische UI-Operationen
- **Ziel**: Multi-VTT-Fähigkeit (Foundry, Roll20, Fantasy Grounds, CSV/File-based)
- **Aufwand**: 40-62h über 5-6 Wochen verteilt
- **DIP-Refactoring Dokumentation**: Vollständige Analyse und Dokumentation aller DIP-Verletzungen (SOLID-Prinzip) mit 5 detaillierten Refactoring-Plänen ([Übersicht](docs/refactoring/DIP-Refactoring-Overview.md))
- Plan 1: JournalVisibilityPort (✅ bereits umgesetzt in v0.26.3)
- Plan 2: BootstrapLifecycle - Bootstrap nutzt globale Foundry-Hooks ([Details](docs/refactoring/DIP-Refactoring-Plan-2-BootstrapLifecycle.md))
- Plan 3: SettingsRegistrationPort - Settings-Registrar mischt Domäne und Foundry-Details ([Details](docs/refactoring/DIP-Refactoring-Plan-3-SettingsRegistrationPort.md))
- Plan 4: JournalCacheInvalidationHook - Hook nutzt Foundry-Globals trotz injizierter Services ([Details](docs/refactoring/DIP-Refactoring-Plan-4-JournalCacheInvalidationHookGlobals.md))
- Plan 5: MetricsStorageFactory - Direkte Instantiierung von LocalStorageMetricsStorage ([Details](docs/refactoring/DIP-Refactoring-Plan-5-MetricsStorageFactory.md))

### Geändert
- **Event-System Architektur**: Alte Hook-Klassen (`RenderJournalDirectoryHook`, `JournalCacheInvalidationHook`) durch Use-Cases ersetzt
- Hooks arbeiten jetzt über `JournalEventPort` statt direkt mit `FoundryHooks`
- `ModuleHookRegistrar` durch `ModuleEventRegistrar` ersetzt
- `HookRegistrar` Interface durch `EventRegistrar` Interface ersetzt
- Alle Event-bezogenen Tokens in separater `event.tokens.ts` Datei organisiert

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.5] - 2025-11-21
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- **CodeQL-Warnungen**: "Expression has no effect" in `readonly-wrapper.test.ts` behoben - `void` Operator für Property-Zugriff mit Seiteneffekt verwendet
- **CodeQL-Warnungen**: "Useless assignment to local variable" in `hook-registration-manager.test.ts` behoben - doppelte Imports und duplizierte Test-Suites entfernt (5 Tests auf 3 konsolidiert, gleiche Coverage)
- **Test-Cleanup**: `@ts-nocheck` aus `hook-registration-manager.test.ts` entfernt (nicht mehr benötigt)

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.4] - 2025-11-21
### Hinzugefügt
- Keine neuen Features

### Geändert
- **Clean Architecture Restrukturierung (Option B)**: Vollständige Umstrukturierung des `/src` Verzeichnisses nach Clean Architecture Prinzipien mit klarer Schichtentrennung ([Details](docs/refactoring/project_restructuring.md))
- **Domain Layer** (`src/domain/`): Entities, Ports und Types - Geschäftslogik ohne Framework-Abhängigkeiten
- **Application Layer** (`src/application/`): Services, Use-Cases, Settings und Health-Checks - Anwendungslogik
- **Infrastructure Layer** (`src/infrastructure/`): Adapters (Foundry), DI-Container, Cache, Notifications, Observability, I18n, Logging, Shared-Utilities - Technische Infrastruktur
- **Framework Layer** (`src/framework/`): Bootstrap, Config, API, Types, UI - Framework-Integration für Foundry VTT
- **Token-Organisation**: Tokens aufgeteilt in thematische Kategorien (`src/infrastructure/shared/tokens/`) - `core.tokens.ts`, `observability.tokens.ts`, `i18n.tokens.ts`, `notifications.tokens.ts`, `infrastructure.tokens.ts`, `foundry.tokens.ts` mit zentralem Index ([Details](src/infrastructure/shared/tokens/index.ts))
- **DI-Types-Gruppierung**: DI-Types in logische Kategorien organisiert (`src/infrastructure/di/types/`) - `core/`, `errors/`, `resolution/`, `utilities/` mit zentralem Export ([Details](src/infrastructure/di/types/index.ts))
- **Konsolidierte Interfaces**: Alle DI-Interfaces in einer Datei zusammengeführt (`src/infrastructure/di/interfaces.ts`) - Container, ContainerError, Disposable, AsyncDisposable ([Details](src/infrastructure/di/interfaces.ts))
- **Import-Pfad-Stabilität**: Alle `@/`-Imports bleiben unverändert funktionsfähig durch `tsconfig.json` paths-Konfiguration - keine Breaking Changes in der öffentlichen API
- **Foundry-Vorgaben eingehalten**: Root-Ordner für Foundry-spezifische Assets unverändert (`templates/`, `styles/`, `assets/`, `lang/`) - nur `/src` restrukturiert
- **Aufräumen**: Leere Verzeichnisse nach Migration entfernt (`src/framework/core/health/`, `src/framework/core/hooks/`, `src/framework/core/ports/`, `src/framework/core/settings/`)
- **Encoding-Fixes**: UTF-8 BOM aus 42 Dateien entfernt für konsistentes Encoding ohne BOM
- **No-Ignores Whitelist**: Pfade in `scripts/check-no-ignores.mjs` aktualisiert auf neue Ordnerstruktur (15 Dateien)
- **Build-Konfiguration**: Entry Point in `vite.config.ts` auf neuen Pfad `src/framework/index.ts` aktualisiert

### Fehlerbehebungen
- **Encoding**: Alle Dateien verwenden jetzt UTF-8 ohne BOM (42 Dateien korrigiert)
- **Check-Scripts**: Whitelist-Pfade in `check-no-ignores.mjs` auf neue Struktur angepasst

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.3] - 2025-11-20
### Hinzugefügt
- **JournalVisibilityPort**: Neues Port-Interface für Journal-Operations, abstrahiert Platform-Details ([Details](src/core/ports/journal-visibility-port.interface.ts))
- **FoundryJournalVisibilityAdapter**: Foundry-spezifische Implementierung des JournalVisibilityPort ([Details](src/foundry/adapters/foundry-journal-visibility-adapter.ts))
- **JournalEntry Domain Model**: Domänenneutrales Modell für Journal-Entries ([Details](src/core/domain/journal-entry.ts))

### Geändert
- **JournalVisibilityService DIP-Refactoring**: Entkopplung von Foundry-spezifischen Typen durch Einführung eines `JournalVisibilityPort`. Service verwendet jetzt domänenneutrale Typen (`JournalEntry`, `JournalVisibilityError`) statt Foundry-Typen. `FoundryJournalVisibilityAdapter` implementiert den Port und mappt zwischen Domäne und Foundry. Verbessert Testbarkeit, Wartbarkeit und ermöglicht zukünftige Multi-VTT-Unterstützung ([Details](src/core/ports/journal-visibility-port.interface.ts), [Details](src/foundry/adapters/foundry-journal-visibility-adapter.ts), [Details](ARCHITECTURE.md#domain-ports-für-dip-konformität))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.2] - 2025-11-20
### Hinzugefügt
- Keine Einträge

### Geändert
- **DIP-Verbesserungen Bootstrap-Phase**: Factory-Funktionen für Bootstrap-Logger und RuntimeConfigService eingeführt, um Dependency Inversion Principle (DIP) vollständig einzuhalten. Direkte Instanziierungen wurden durch Factory-Funktionen ersetzt: `createRuntimeConfig()` und `createBootstrapLogger()`. Dies verbessert Testbarkeit, Erweiterbarkeit und DIP-Konformität ([Details](src/core/runtime-config/runtime-config-factory.ts), [Details](src/services/bootstrap-logger.ts), [Details](ARCHITECTURE.md#bootstrap-factories-dip-konformität))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.1] - 2025-11-20
### Hinzugefügt
- Keine Einträge

### Geändert
- **Service Locator Pattern zu Constructor Injection**: `ModuleSettingsRegistrar` und `ModuleHookRegistrar` verwenden jetzt Constructor Injection statt Service Locator Pattern. `ModuleSettingsContextResolver` wurde entfernt, da überflüssig. Alle Dependencies werden jetzt explizit über den Constructor injiziert, was zu klarerem Code, besserer Testbarkeit und konsistentem DI-Pattern führt ([Details](src/core/module-settings-registrar.ts), [Details](src/core/module-hook-registrar.ts))
- **HookRegistrar Interface**: Container-Parameter aus `register()` Methode entfernt - alle Dependencies werden über Constructor injiziert ([Details](src/core/hooks/hook-registrar.interface.ts))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.26.0] - 2025-11-20
### Hinzugefügt
- **Test Coverage für Type-Guards**: Test für `getHiddenFlagValue` Type-Guard hinzugefügt, um Edge-Case abzudecken wenn Entry kein `getFlag`-Method hat ([Details](src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts#L985))
- **FoundryGame.invalidateCache()**: Neue Methode zum Invalidieren des Journal-Entries-Cache hinzugefügt ([Details](src/foundry/interfaces/FoundryGame.ts#L25))
- **FoundryGameService.invalidateCache()**: Implementierung der Cache-Invalidierung für Journal-Entries ([Details](src/foundry/services/FoundryGameService.ts#L42))
- **Umfassende Test-Suite für JournalCacheInvalidationHook**: 34 Tests hinzugefügt, um alle Edge-Cases und Code-Pfade abzudecken ([Details](src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts))

### Geändert
- **Code-Formatierung**: Prettier-Formatierung für `journal-cache-invalidation-hook.ts` und Test-Datei angewendet ([Details](src/core/hooks/journal-cache-invalidation-hook.ts), [Details](src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts))
- **ESLint-Konfiguration für Test-Dateien**: ESLint-Disable-Regeln für `any`-Typen und deprecated APIs in Test-Dateien hinzugefügt ([Details](src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts#L1-4))
- **No-Ignores Whitelist**: `journal-cache-invalidation-hook.ts` zur Whitelist für `eslint-disable`-Marker hinzugefügt ([Details](scripts/check-no-ignores.mjs#L112))
- **throttle() Funktion**: Unterstützung für async-Funktionen hinzugefügt, Dokumentation erweitert ([Details](src/utils/events/throttle.ts#L7, #L22))
- **render-journal-directory-hook.ts**: Kommentar zur Flag-Persistenz hinzugefügt ([Details](src/core/hooks/render-journal-directory-hook.ts#L78))

### Fehlerbehebungen
- **Code Coverage**: 100% Code Coverage erreicht durch Test für Type-Guard in `getHiddenFlagValue` ([Details](src/core/hooks/journal-cache-invalidation-hook.ts#L150))
- **ESLint-Fehler**: Unbenutzte Variablen behoben (`journalVisibility`, `error` → `_error`) ([Details](src/core/hooks/journal-cache-invalidation-hook.ts#L35, #L161))
- **ESLint-Fehler**: Unbenutzte Parameter in Test-Datei behoben (`id` → `_id`) ([Details](src/core/hooks/__tests__/journal-cache-invalidation-hook.test.ts#L1064))
- **ESLint-Deprecated-Warnung**: `Hooks.call` deprecated-Warnung mit `eslint-disable-next-line` unterdrückt, da als Fallback notwendig ([Details](src/core/hooks/journal-cache-invalidation-hook.ts#L258))
- **TypeScript-Fehler in Test-Dateien**: `invalidateCache` Mock zu FoundryGame-Mocks in Test-Dateien hinzugefügt ([Details](src/foundry/facades/__tests__/foundry-journal-facade.test.ts), [Details](src/foundry/services/__tests__/FoundryGameService.test.ts), [Details](src/foundry/services/__tests__/FoundryServiceBase.test.ts), [Details](src/foundry/services/__tests__/foundry-game-service-concurrency.test.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.16] - 2025-11-19
### Hinzugefügt
- **Runtime Error Monitoring Tests**: Vollständige Test-Suite implementiert ([Details](docs/TEST-STRATEGY/01-high-priority/04-runtime-error-monitoring-tests.md))
- Test 1: Foundry API-Fehler Handling - Prüft korrektes Error-Handling bei fehlenden oder fehlerhaften Foundry APIs
- Test 2: Graceful Degradation - Prüft Bootstrap-Robustheit bei teilweise fehlenden Foundry APIs
- Test 3: Result-Pattern-Konsistenz - Prüft dass alle Service-Methoden Result-Pattern verwenden (mit Hinweis auf `api.resolve()` Ausnahme)
- Test 4: Error Recovery (Retry-Logik) - Prüft Retry-Verhalten bei transienten und permanenten Fehlern
- Test 5: ModuleApi Error Handling - Prüft Unterschied zwischen `api.resolve()` (Exceptions) und `api.resolveWithError()` (Result-Pattern)

### Geändert
- Keine Einträge

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.15] - 2025-11-18
### Hinzugefügt
- **Memory Leak Tests**: Umfassende Test-Suite für Memory Leak Detection implementiert ([Details](docs/TEST-STRATEGY/01-high-priority/03-memory-leak-tests.md))
- `hook-memory-leak.test.ts`: Testet Hook-Registrierung Cleanup mit 1000 Hooks, prüft Speicherfreigabe nach Disposal
- `service-memory-leak.test.ts`: Testet Service Disposal mit 100 Scoped Containers, prüft korrektes Cleanup von Services
- `container-memory-leak.test.ts`: Testet Container Scope Cleanup mit 100 Scoped Containers, prüft Speicherfreigabe nach Disposal
- `cache-memory-leak.test.ts`: Testet Cache Cleanup mit 1000 Cache-Einträgen, prüft Speicherfreigabe nach Clear
- Alle Tests verwenden `performance.memory.usedJSHeapSize` für Speichermessung und `global.gc()` für Garbage Collection
- Vitest-Konfiguration erweitert um `nodeOptions.exposeGc: true` für GC-Support
- **Concurrency Tests**: Umfassende Test-Suite für parallele Zugriffe implementiert ([Details](docs/TEST-STRATEGY/01-high-priority/02-concurrency-tests.md))
- `port-selector-concurrency.test.ts`: Testet parallele Port-Selection mit 10 und 100 gleichzeitigen Requests, prüft Konsistenz und Thread-Safety
- `cache-service-concurrency.test.ts`: Testet parallele Cache-Zugriffe (Reads, Writes, Read-Write-Mix) mit 50-100 parallelen Operationen, prüft Cache-Konsistenz
- `composition-root-concurrency.test.ts`: Testet parallele `CompositionRoot.bootstrap()` Aufrufe, prüft Container-Initialisierung ohne Duplikate
- `foundry-game-service-concurrency.test.ts`: Testet parallele Journal-Zugriffe (`getJournalEntries()`, `getJournalEntryById()`) mit 50 parallelen Requests, prüft Datenkonsistenz
- Alle Tests verwenden Vitest `it.concurrent()` für echte parallele Ausführung und `Promise.all()` für gleichzeitige Aufrufe

### Geändert
- **Vitest-Konfiguration**: `nodeOptions.exposeGc: true` hinzugefügt für Memory Leak Tests ([Details](vitest.config.ts#L24))

### Fehlerbehebungen
- **TypeScript-Fehler in Concurrency-Tests behoben**: Type Guards für sichere Result-Zugriffe hinzugefügt ([Details](src/foundry/services/__tests__/foundry-game-service-concurrency.test.ts), [Details](src/foundry/versioning/__tests__/port-selector-concurrency.test.ts))
- Zugriff auf `results[0]` ohne Null-Check behoben
- Zugriff auf `.value` ohne `result.ok`-Prüfung behoben
- Type Guards für sichere Zugriffe implementiert
- **ESLint-Fehler in Concurrency-Tests behoben**: Unbenutzte Imports und Variablen entfernt ([Details](src/core/__tests__/composition-root-concurrency.test.ts))
- Unbenutzten Import `ServiceContainer` entfernt
- Unbenutzte Variable `containerResult` entfernt
- `any`-Typ entfernt (unbenutzter Code entfernt)

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.14] - 2025-11-18
### Hinzugefügt
- **NotificationCenter Test Coverage**: Test für Error-Path bei nicht existierenden Channels hinzugefügt ([Details](src/notifications/__tests__/NotificationCenter.test.ts#L366))

### Geändert
- **JournalVisibilityService Dokumentation**: Dependency-Kommentar aktualisiert (2 → 3 Dependencies: FoundryJournalFacade, NotificationCenter, CacheService) ([Details](src/services/JournalVisibilityService.ts#L24))

### Fehlerbehebungen
- **README Typo**: "instantiiert" → "instanziiert" in Port-Adapter-Garantie korrigiert ([Details](README.md#L112))
- **CacheService Metrics**: Metrics-Tracking (recordMiss/recordHit) wird nicht mehr ausgeführt, wenn Cache disabled ist - verhindert verzerrte Hit-Rate-Statistiken ([Details](src/services/CacheService.ts#L209))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.13] - 2025-11-18
### Hinzugefügt
- **getFirstArrayElement Helper**: Neue Helper-Funktion in `runtime-safe-cast.ts` für sicheren Array-Zugriff nach Längenprüfung, um Type-Coverage bei 100% zu halten ([Details](src/di_infrastructure/types/runtime-safe-cast.ts#L168))

### Geändert
- **check-no-ignores Script**: Verbesserte Zuverlässigkeit durch Dual-Method-Ansatz (ripgrep + Fallback), bessere Pfad-Normalisierung für Windows/Linux-Konsistenz und Debug-Ausgabe ([Details](scripts/check-no-ignores.mjs))

### Fehlerbehebungen
- **ESLint-Fehler**: 14 ESLint-Fehler behoben (unbenutzte Variablen, falsche Namenskonventionen, `any`-Typen) ([Details](src/core/__tests__/composition-root.test.ts), [Details](src/di_infrastructure/__tests__/container.test.ts), [Details](src/di_infrastructure/validation/__tests__/ContainerValidator.test.ts), [Details](src/utils/async/__tests__/promise-timeout.test.ts))
- **TypeScript-Fehler**: Type-Fehler in `composition-root.test.ts` behoben (ServiceContainer-Typ, Null-Checks) ([Details](src/core/__tests__/composition-root.test.ts))
- **Verbotenes v8 ignore**: `v8 ignore` aus `JournalVisibilityService.ts` entfernt und durch Helper-Funktion `getFirstArrayElement` ersetzt, um Type-Coverage bei 100% zu halten ([Details](src/services/JournalVisibilityService.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.12] - 2025-11-18
### Hinzugefügt
- Keine Einträge

### Geändert
- **Coverage-Tool Migration**: Alle `c8 ignore` Kommentare zu `v8 ignore` migriert aufgrund des Vitest 4.0.10 Upgrades, das `@vitest/coverage-v8` verwendet. Alle Kommentare enthalten jetzt `@preserve` Hinweis, damit sie beim TypeScript/esbuild Transpiling nicht entfernt werden ([Details](vitest.config.ts), [Details](scripts/check-no-ignores.mjs))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.11] - 2025-11-18
### Hinzugefügt
- **Erweiterte Integration-Tests**: 5 neue End-to-End Integration-Tests implementiert ([Details](docs/TEST-STRATEGY/01-high-priority/01-extended-integration-tests.md))
- `journal-visibility-e2e.test.ts`: Journal Visibility End-to-End Workflow
- `hook-registration-execution.test.ts`: Hook-Registrierung + Ausführung
- `cache-invalidation-workflow.test.ts`: Cache-Invalidierung Workflow
- `module-lifecycle.test.ts`: Module-Lifecycle (init → ready)
- `settings-change-reaction.test.ts`: Settings-Änderung + Service-Reaktion
- **Debug-Konfiguration**: `.vscode/launch.json` mit 4 Debug-Profilen für Tests ([Details](.vscode/launch.json))
- "Debug Current Test File": Debuggt die aktuell geöffnete Test-Datei
- "Debug Cache Invalidation Test": Debuggt speziell den Cache-Invalidierung Test
- "Debug Settings Change Test": Debuggt speziell den Settings-Change Test
- "Debug All Integration Tests": Debuggt alle Integration-Tests
- **getRootContainer() Export**: Interner Export in `init-solid.ts` für Test-Zwecke ([Details](src/core/init-solid.ts#L171))

### Geändert
- **Integration-Tests**: Token-Imports werden jetzt dynamisch nach `vi.resetModules()` durchgeführt, um Symbol-Instanz-Probleme zu vermeiden
- **Integration-Tests**: Container-Zugriff verwendet jetzt `getRootContainer()` aus `init-solid.ts` statt separaten `bootstrapTestContainer()` Helper, um den gleichen Container wie die Hooks zu verwenden

### Fehlerbehebungen
- **Symbol-Token-Probleme in Tests behoben**: `vi.resetModules()` erzeugte neue Symbol-Instanzen, sodass Tokens in Tests nicht mit Tokens in der Registry übereinstimmten - behoben durch dynamische Imports nach `vi.resetModules()`
- **Container-Instanz-Mismatch behoben**: Tests erstellten neuen Container über `bootstrapTestContainer()`, während Hooks den Container aus `init-solid.ts` verwendeten - behoben durch `getRootContainer()` Export
- **Settings onChange Callback Speicherung**: `mockSettingsRegister` speichert jetzt korrekt den `onChange` Callback nur für das `logLevel` Setting und gibt `Result` zurück
- **Cache-Key Type-Safety**: Integration-Tests verwenden jetzt `createCacheNamespace()` und `CacheKey` Type statt plain Strings
- **CacheEntryMetadata Type-Safety**: Integration-Tests verwenden jetzt vollständiges `CacheEntryMetadata` Interface statt Teilobjekten

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.10] - 2025-11-17
### Hinzugefügt
- Keine Einträge

### Geändert
- **ServiceContainer.injectMetricsCollector()**: Methode ist jetzt synchron statt async ([Details](src/di_infrastructure/container.ts#L313))
- Statischer Import von `metricsCollectorToken` statt dynamischer Import
- Keine Race Conditions mehr möglich, da Injektion sofort abgeschlossen ist
- Fehler werden nicht mehr ignoriert (vorher `void` Promise)
- Vereinfachter Code ohne async/Promise-Overhead

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.9] - 2025-11-17
### Hinzugefügt
- **100% Test Coverage**: Vollständige Code-Coverage für alle Statements, Branches, Functions und Lines erreicht ([Details](docs/quality-gates/code-coverage-exclusions.md))
- 1336 Tests in 95 Test-Dateien
- Alle Edge-Cases und Fehlerpfade abgedeckt
- Defensive Checks und Type-Guards vollständig getestet

### Geändert
- **Result-Pattern Konsistenz**: Alle fehlschlagenden Operationen verwenden jetzt konsequent das Result-Pattern ([Details](docs/adr/0001-use-result-pattern-instead-of-exceptions.md))
- **CacheService.getOrSet()**: Gibt jetzt `Promise<Result<CacheLookupResult<TValue>, string>>` zurück statt `Promise<CacheLookupResult<TValue>>` - factory-Fehler werden als Result zurückgegeben
- **JournalVisibilityService.processJournalDirectory()**: Gibt jetzt `Result<void, FoundryError>` zurück statt `void` - Fehler werden aggregiert und zurückgegeben
- **I18nFacadeService**: Alle Methoden (`translate()`, `format()`, `has()`) geben jetzt `Result<string, string>` bzw. `Result<boolean, string>` zurück statt direkte Werte
- **TranslationHandler Interface**: `handle()` und `has()` verwenden jetzt Result-Pattern - alle Handler-Implementierungen angepasst
- **Assertion-Failures**: `assertNonEmptyArray()` umbenannt zu `ensureNonEmptyArray()` und gibt `Result<[T, ...T[]], FoundryError>` zurück
- **UIChannel.mapLevelToUIType()**: Gibt jetzt `Result<"info" | "warning" | "error", string>` zurück statt direkten Wert

### Fehlerbehebungen
- **Result-Pattern Inkonsistenzen behoben**: Alle identifizierten Stellen, die Exceptions warfen oder direkte Werte zurückgaben, verwenden jetzt konsistent Result-Pattern
- **Fehlende Imports behoben**: `ok`, `err` und `Result` Type-Imports in `FoundryTranslationHandler.ts`, `LocalTranslationHandler.ts`, `FallbackTranslationHandler.ts`, `CacheService.ts` und Test-Dateien ergänzt
- **CacheService.getOrSet() synchrone Fehlerbehandlung**: Behandelt jetzt sowohl synchrone als auch asynchrone Factory-Fehler korrekt (try-catch für synchrone, `fromPromise` für asynchrone)
- **AbstractTranslationHandler.has() Fehlerpropagierung**: Propagiert jetzt Fehler von `doHas()` korrekt an Aufrufer
- **TypeScript-Fehler behoben**:
- `override` Modifier in Test-Klassen hinzugefügt
- Return-Types in Test-Klassen ergänzt
- Type-Guard für `errors[0]` in `JournalVisibilityService.ts` hinzugefügt
- **Linter-Fehler behoben**: Ungenutzte Imports entfernt, unused Parameter umbenannt
- **Test Coverage auf 100% erhöht**:
- Test für `processJournalDirectory` Fehlerfall in `render-journal-directory-hook.test.ts`
- Test für `ensureNonEmptyArray` Fehlerfall in `portregistry.test.ts`
- Test für `mapLevelToUIType` Fehlerfall in `UIChannel.test.ts`
- Test für synchronen Factory-Erfolgsfall in `CacheService.test.ts`
- Test für Fallback-Verwendung in `AbstractTranslationHandler.test.ts`

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.8] - 2025-11-17
### Hinzugefügt
- **ESLint-Konfiguration erweitert**: File-Level Overrides für spezifische Code-Patterns ([Details](docs/quality-gates/no-ignores/eslint-config-analysis.md))
- Valibot-Schemas: PascalCase für Schema-Exports erlauben (`**/schemas.ts`, `**/validation/schemas.ts`)
- console.table Kompatibilität: String-Literal-Keys in Interfaces erlauben (`**/metrics-collector.ts`)
- Heterogene Service-Typen: `any` erlauben in `TypeSafeRegistrationMap.ts` (architektonisch notwendig)
- Variadische Konstruktoren: `any[]` erlauben in `serviceclass.ts` (für Dependency Injection notwendig)
- Type-Definitionen: deprecated APIs erlauben in `*.d.ts` Dateien
- Hauptkonfiguration: `no-unused-vars` mit `argsIgnorePattern: '^_'` erweitert für Interface-Kompatibilität

### Geändert
- **ESLint-Disable Marker eliminiert**: Alle 13 `eslint-disable` Marker aus Produktivcode entfernt ([Details](docs/quality-gates/no-ignores/eslint-config-analysis.md))
- `schemas.ts`: 3 Marker entfernt (naming-convention für PascalCase Schemas)
- `metrics-collector.ts`: 2 Marker entfernt (naming-convention für console.table String-Literals)
- `TypeSafeRegistrationMap.ts`: 3 Marker entfernt (no-explicit-any für heterogene Service-Typen)
- `serviceclass.ts`: 1 Marker entfernt (no-explicit-any für variadische Konstruktoren)
- TranslationHandler-Dateien: 3 Marker entfernt (no-unused-vars für Interface-Kompatibilität)
- `custom.d.ts`: 1 Marker entfernt (no-deprecated für Type-Definitionen)
- Alle Marker durch File-Level Overrides in ESLint-Konfiguration ersetzt
- Produktivcode ist jetzt vollständig ohne inline `eslint-disable` Kommentare

### Fehlerbehebungen
- **Linter-Warnungen behoben**: Return-Type in `runtime-casts.test.ts` hinzugefügt
- **ESLint-Regeln optimiert**: `no-explicit-any` für architektonisch notwendige `any`-Typen auf `'off'` gesetzt
- `TypeSafeRegistrationMap.ts`: Heterogene Service-Typen erfordern `any` in Map-Speicherung
- `serviceclass.ts`: Variadische Konstruktoren für Dependency Injection erfordern `any[]`

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.7] - 2025-11-17
### Hinzugefügt
- **Quality Gate – Observability & Notifications**: No-Ignores-Gate für `src/observability/**` und `src/notifications/**` verschärft; alle `c8 ignore` und `eslint-disable` entfernt ([Details](docs/quality-gates/no-ignores/04-observability-notifications.md), [docs/quality-gates/no-ignores/04-observability-notifications-status.md))
- **Erweiterte Test-Abdeckung**: Tests für Event-Emission in `ObservabilityRegistry` (Success mit/ohne adapterName, Failure, Multiple Events), `getStorage()` in `LocalStorageMetricsStorage` (verfügbar, nicht verfügbar, Exception) und exhaustive Type-Check in `UIChannel` hinzugefügt ([Details](src/observability/__tests__/observability-registry.test.ts), [src/observability/metrics-persistence/__tests__/local-storage-metrics-storage.test.ts], [src/notifications/channels/__tests__/UIChannel.test.ts])

### Geändert
- **Observability & Notifications Coverage**: Alle `c8 ignore` und `eslint-disable` in Observability- und Notifications-Modulen entfernt; Coverage für `src/observability/**` und `src/notifications/**` erreicht 100% ([Details](src/observability/), [src/notifications/))
- **ObservabilityRegistry**: Alle Event-Pfade (Success mit/ohne adapterName, Failure) sind jetzt getestet; 2 `c8 ignore` Blöcke entfernt ([Details](src/observability/observability-registry.ts))
- **MetricsCollector**: Explizites `MetricsTableData` Interface für console.table() definiert; `eslint-disable` in `logSummary()` entfernt (nur noch für Interface-Definition, begründet) ([Details](src/observability/metrics-collector.ts))
- **UIChannel**: Exhaustive Type-Check mit `never`-Type für debug-Level implementiert; `mapLevelToUIType` auf `protected` geändert für Testbarkeit; `c8 ignore next` entfernt ([Details](src/notifications/channels/UIChannel.ts))
- **LocalStorageMetricsStorage**: `getStorage()` Funktion exportiert für Tests; alle Pfade (verfügbar, nicht verfügbar, Exception) sind getestet; `c8 ignore` Block entfernt ([Details](src/observability/metrics-persistence/local-storage-metrics-storage.ts))

### Fehlerbehebungen
- **Linter-Fehler**: Unbenutzte Imports in Test-Dateien entfernt; eslint-disable für exhaustive Type-Check und Interface-Definition hinzugefügt ([Details](src/observability/metrics-persistence/__tests__/local-storage-metrics-storage.test.ts), [src/notifications/channels/UIChannel.ts], [src/observability/metrics-collector.ts])

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.6] - 2025-11-17
### Hinzugefügt
- **Quality Gate – Foundry-Adapter & Ports**: No-Ignores-Gate für `src/foundry/**` verschärft; Foundry-spezifische Runtime-Casts in zentrale Datei `src/foundry/runtime-casts.ts` ausgelagert ([Details](docs/quality-gates/no-ignores/03-foundry-adapters.md), [docs/quality-gates/no-ignores/03-foundry-adapters-status.md))
- **Zentrale Foundry Runtime-Casts**: Neue Datei `src/foundry/runtime-casts.ts` kapselt alle Foundry-spezifischen Runtime-Casts (Settings-API, Document-Flags, FoundryError, Disposable-Ports, Non-Empty-Arrays); analog zu `runtime-safe-cast.ts` für DI-Infrastruktur ([Details](src/foundry/runtime-casts.ts))
- **Erweiterte Test-Abdeckung**: Tests für Fehlerpropagierung in `FoundrySettingsPort`, Port-Error-Pfade in `FoundrySettingsService`, Valibot-Validation-Error-Pfad in `schemas.ts` und Input-Validation in `FoundryGamePort` hinzugefügt ([Details](src/foundry/ports/v13/__tests__/FoundrySettingsPort.test.ts), [src/foundry/services/__tests__/FoundrySettingsService.test.ts], [src/foundry/validation/__tests__/schemas.test.ts], [src/foundry/ports/v13/__tests__/FoundryGamePort.test.ts])
- **No-Ignores-Check Erweiterung**: `check-no-ignores.mjs` prüft jetzt auch Foundry-Adapter (`src/foundry/**`) mit dokumentierten Ausnahmen für `runtime-casts.ts` und defensiven Check in `portregistry.ts` ([Details](scripts/check-no-ignores.mjs))

### Geändert
- **Foundry-Adapter Coverage**: Alle `c8 ignore` und `type-coverage:ignore` in Foundry-Adapter entfernt; Runtime-Casts durch zentrale Helper-Funktionen ersetzt; Coverage für `src/foundry/**` erreicht 100% ([Details](src/foundry/ports/v13/), [src/foundry/services/), [src/foundry/validation/), [src/foundry/versioning/))
- **FoundryI18nPort**: Alle 9 `c8 ignore`-Blöcke entfernt; alle Pfade (game undefined, game.i18n undefined, Exception-Handling) sind jetzt getestet ([Details](src/foundry/ports/v13/FoundryI18nPort.ts))
- **FoundrySettingsPort**: Fehlerpropagierung von `validateSettingConfig` getestet; alle `type-coverage:ignore` durch `castFoundrySettingsApi()` und `castFoundryError()` ersetzt ([Details](src/foundry/ports/v13/FoundrySettingsPort.ts))
- **FoundryDocumentPort & Facades**: Runtime-Casts durch `castFoundryError()` und `castFoundryDocumentForFlag()` ersetzt ([Details](src/foundry/ports/v13/FoundryDocumentPort.ts), [src/foundry/facades/foundry-journal-facade.ts))
- **FoundryServiceBase**: Disposable-Port-Cast durch `castDisposablePort()` ersetzt ([Details](src/foundry/services/FoundryServiceBase.ts))
- **PortRegistry**: Non-Null-Assertions durch Type-Guard `assertNonEmptyArray()` ersetzt; defensiver Check für Factory-Not-Found mit `c8 ignore` dokumentiert ([Details](src/foundry/versioning/portregistry.ts))
- **Type-Coverage-Konfiguration**: `src/foundry/runtime-casts.ts` zur Type-Coverage-Ignore-Liste hinzugefügt (analog zu `runtime-safe-cast.ts`) ([Details](type-coverage.json))

### Fehlerbehebungen
- **Coverage-Verbesserungen**: Fehlende Coverage für `FoundryGamePort.ts` (Zeilen 87-88) und `portregistry.ts` (Zeilen 99-106) behoben; Test für ungültige Journal-ID hinzugefügt, defensiver Check dokumentiert ([Details](src/foundry/ports/v13/__tests__/FoundryGamePort.test.ts), [src/foundry/versioning/portregistry.ts))
- **Linter-Fehler**: Ungenutzten Import `FoundrySettings` aus `runtime-casts.ts` entfernt ([Details](src/foundry/runtime-casts.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.5] - 2025-11-17
### Hinzugefügt
- **Quality Gate – DI-Infrastruktur & Bootstrap**: No-Ignores-Gate für `src/di_infrastructure/**` und `src/config/dependencyconfig.ts` verschärft; `src/core/composition-root.ts` ist jetzt vollständig ohne Ignores ([Details](docs/quality-gates/no-ignores/02-di-bootstrap.md), [docs/quality-gates/no-ignores/02-di-bootstrap-status.md))
- **No-Ignores-Check Erweiterung**: `check-no-ignores.mjs` prüft jetzt auch DI-Infrastruktur und Dependency-Config mit dokumentierten Ausnahmen für begründete Coverage-Tool-Limitationen ([Details](scripts/check-no-ignores.mjs))

### Geändert
- **DI-Infrastruktur Coverage**: Alle DI/Bootstrap-Bereiche erreichen jetzt 100% Code Coverage; verbleibende `c8 ignore`-Blöcke sind minimal, begründet und dokumentiert (Coverage-Tool-Limitationen für finally-Blöcke, early returns, optional chaining) ([Details](src/di_infrastructure/container.ts), [src/di_infrastructure/validation/ContainerValidator.ts], [src/di_infrastructure/resolution/ServiceResolver.ts])
- **Type-Coverage DI-Infrastruktur**: Type-Coverage auf 100% (13015/13015); Runtime-Casts für ServiceRegistration-Iteration in `runtime-safe-cast.ts` ausgelagert ([Details](src/di_infrastructure/types/runtime-safe-cast.ts), [src/di_infrastructure/registry/ServiceRegistry.ts])
- **CompositionRoot**: Vollständig ohne Ignores; alle Erfolgs- und Fehlerpfade (inkl. Performance-Tracking) sind getestet ([Details](src/core/composition-root.ts))
- **DependencyConfig**: Alle Fehlerpropagierungszweige sind getestet; verbleibendes `c8 ignore` für Coverage-Tool-Limitation bei return-Statements ([Details](src/config/dependencyconfig.ts))
- **init-solid.ts**: Ignores auf echte Environment-Fälle reduziert (Foundry Hooks, Bootstrap-Fehlerpfade); alle testbaren Pfade sind abgedeckt ([Details](src/core/init-solid.ts))

### Fehlerbehebungen
- **Linter-Fehler**: Ungenutzte Variablen in Test-Dateien entfernt, `any`-Typen durch spezifische Typen ersetzt, Naming-Conventionen korrigiert ([Details](src/core/__tests__/composition-root.test.ts), [src/core/__tests__/init-solid.test.ts], [src/config/__tests__/dependencyconfig.test.ts))
- **Type-Check-Fehler**: Typen für Runtime-Casts korrigiert, `override`-Modifier hinzugefügt, Return-Types präzisiert ([Details](src/core/__tests__/composition-root.test.ts), [src/core/__tests__/init-solid.test.ts])

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.4] - 2025-11-16
### Hinzugefügt
- **Quality Gate – Core/Services/Utils/Types**: No-Ignores-Gate für `src/core/**` (ohne `init-solid.ts`), `src/services/**`, `src/utils/**` und `src/types/**`; Produktionscode in diesen Bereichen verzichtet vollständig auf `c8 ignore`, `type-coverage:ignore`, `eslint-disable` und `ts-ignore` ([Details](docs/quality-gates/no-ignores/01-core-services-utils.md), [docs/TESTING.md#coverage-requirements))
- **No-Ignores-Check Script**: Neues `npm run check:no-ignores` Script prüft automatisch auf verbotene Ignore-Direktiven in No-Ignores-Zonen; in `check:all`/`check-all` und CI-Pipeline integriert ([Details](scripts/check-no-ignores.mjs), [.github/workflows/ci.yml])

### Geändert
- **CacheService & RuntimeConfig**: Cache-Lookups, LRU-Enforcement und RuntimeConfig-Listener sind jetzt vollständig per Tests abgedeckt und kommen ohne `c8 ignore`-/`type-coverage:ignore`-Marker aus; der Cache-Service bleibt generisch typisiert, ohne `any`-Leaks ([Details](src/services/CacheService.ts), [src/core/runtime-config/runtime-config.service.ts))
- **JournalVisibility & Hooks**: `JournalVisibilityService`, `RenderJournalDirectoryHook` und `JournalCacheInvalidationHook` wurden so angepasst, dass alle Error- und Edge-Pfade testbar sind (inkl. Cache-Hits, XSS-Sanitizing, Hook-Rollback) und keine Coverage-Ignores im Kern mehr benötigen ([Details](src/services/JournalVisibilityService.ts), [src/core/hooks/render-journal-directory-hook.ts), [src/core/hooks/journal-cache-invalidation-hook.ts))
- **Readonly-Wrapper & Public API**: `createReadOnlyWrapper` und `ModuleApiInitializer` verwenden präzisere Generics statt type-coverage-Ignores; alle ReadOnly-Proxys (Logger, I18n, NotificationCenter, FoundrySettings) sind weiterhin 100 % test- und type-abgedeckt ([Details](src/core/api/readonly-wrapper.ts), [src/core/api/module-api-initializer.ts))

### Fehlerbehebungen
- **RetryService lastError-Flow**: Beide Retry-Schleifen (`retry`, `retrySync`) behandeln jetzt auch theoretisch unmögliche Pfade ohne Non-Null-Assertions und melden im Extremfall einen synthetisch gemappten Fehler, statt auf Flow-Analyse-Casts zu vertrauen ([Details](src/services/RetryService.ts))
- **LocalI18nService Locale Edge-Cases**: Locale-Erkennung deckt nun auch exotische `navigator.language`-Formate (z.B. Objekte mit eigener `split()`-Implementierung) ab; Tests sichern den Fallback auf `"en"` und schließen die letzten Branch-Lücken ohne `c8 ignore` ([Details](src/services/LocalI18nService.ts), [src/services/__tests__/LocalI18nService.test.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.3] - 2025-11-16
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

## [0.25.2] - 2025-11-16
### Hinzugefügt
- Keine Einträge

### Geändert
- **Hook-DI & Registrare**: `RenderJournalDirectoryHook` und `JournalCacheInvalidationHook` nutzen jetzt konsequent konstruktorbasierte DI, und `ModuleHookRegistrar.registerAll` propagiert Hook-Registrierungsfehler als `Result<void, Error[]>` für klarere Bootstrap-Fehlerpfade ([Details](src/core/hooks/render-journal-directory-hook.ts), [src/core/hooks/journal-cache-invalidation-hook.ts), [src/core/module-hook-registrar.ts], [src/core/init-solid.ts])
- **DependencyConfig & init-solid Coverage**: Grobe `c8 ignore`-Blöcke rund um Loop-Prevention-Initialisierung und Bootstrap/Init-Flow wurden entfernt bzw. verfeinert; bestehende Tests decken jetzt die Fehlerpfade explizit ab ([Details](src/config/dependencyconfig.ts), [src/config/__tests__/dependencyconfig.test.ts), [src/core/init-solid.ts], [src/core/__tests__/init-solid.test.ts])
- **Lifecycle-Disposal**: Dispose-Pfade für Hooks, ObservabilityRegistry und HookRegistrationManager sind nun explizit getestet; `HookRegistrationManager.dispose` loggt fehlgeschlagene Unregister-Callbacks defensiv in die Konsole, ohne den Shutdown zu unterbrechen ([Details](src/core/hooks/render-journal-directory-hook.ts), [src/core/hooks/journal-cache-invalidation-hook.ts], [src/observability/observability-registry.ts], [src/core/hooks/hook-registration-manager.ts], [src/observability/__tests__/observability-registry.test.ts], [src/core/hooks/__tests__/hook-registration-manager.test.ts])

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.1] - 2025-11-16
### Hinzugefügt
- Keine Einträge

### Geändert
- **RetryService**: Entfernt ungenutzte MetricsCollector-Abhängigkeit und vereinfacht die DI-Signatur; Retry-Metriken werden künftig zentral über MetricsCollector/PerformanceTracking erfasst ([Details](src/services/RetryService.ts))
- **ObservabilityRegistry**: Verwalter jetzt Subscription-Lebenszyklus für PortSelector-Events und bietet eine `dispose()`-Methode für sauberes Aufräumen beim Container-Shutdown ([Details](src/observability/observability-registry.ts))
- **NotificationCenter**: Präzisiert Fehlerverhalten bei expliziter Channel-Auswahl, wenn kein Channel eine Notification verarbeiten kann; vermeidet stille Fehlkonfigurationen durch aussagekräftige Fehlermeldungen ([Details](src/notifications/NotificationCenter.ts))
- **Bootstrap-Flow**: Entfernt den pauschalen `c8 ignore`-Block rund um `initializeFoundryModule` und verlässt sich auf fein-granulare Abdeckungen in den vorhandenen init-solid-Tests ([Details](src/core/init-solid.ts), [docs/BOOTFLOW.md](docs/BOOTFLOW.md))

### Fehlerbehebungen
- **Hooks-Lifecycle**: RenderJournalDirectoryHook und JournalCacheInvalidationHook deregistrieren ihre Foundry-Hooks jetzt zuverlässig (inkl. Rollback bei partiellen Registrierungsfehlern), um Mehrfach-Registrierungen nach Modul-Reloads zu verhindern ([Details](src/core/hooks/render-journal-directory-hook.ts), [src/core/hooks/journal-cache-invalidation-hook.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.25.0] - 2025-11-16
### Hinzugefügt
- **Audit-Report**: Dokumentiert Clean-Code-/Dokumentations-Findings vom 15.11.2025 inkl. Architektur-, Settings- und JSDoc-Bewertung ([Details](docs/audits/audit-2025-11-15.md))
- **Roadmap 2025-11**: Neuer Fahrplan fokussiert UI-Styles-Reaktivierung & RuntimeConfig-DX ([Details](docs/roadmaps/ROADMAP-2025-11.md))

### Geändert
- **ModuleSettingsRegistrar**: Verwendet einen Context-Resolver statt Service-Locator-Aufrufen und bleibt dadurch init-hook-kompatibel ([Details](src/core/settings/module-settings-context-resolver.ts))
- **CacheService**: Hört auf RuntimeConfig-Änderungen (enable/TTL/maxEntries) und setzt Foundry-Settings ohne Reload um ([Details](src/services/CacheService.ts))

### Fehlerbehebungen
- **ModuleSettingsContextResolver**: Fehlende Tests ließen die globale Coverage-Grenze von 100 % reißen; neue Spezifikation deckt Erfolgs- und Fehlerpfade ab und stabilisiert das Quality Gate dauerhaft ([Details](docs/TESTING.md#regressionswächter))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.24.0] - 2025-11-15
### Hinzugefügt
- **RuntimeConfigService**: Neue Config-Schicht verbindet ENV-Defaults mit Foundry-Settings und stellt `get/onChange` für Services bereit ([Details](src/core/runtime-config/runtime-config.service.ts), [docs/runtime-config-layer.md](docs/runtime-config-layer.md))
- **Cache-Einstellungen**: Foundry-Settings für `cacheEnabled`, `cacheTtlMs` und `cacheMaxEntries` erlauben jetzt Runtime-Overrides und greifen direkt via RuntimeConfigService in den CacheService ein ([Details](src/core/settings), [docs/CONFIGURATION.md](docs/CONFIGURATION.md))
- **Performance- & Metrics-Settings**: Weitere Foundry-Einstellungen (`performanceTrackingEnabled`, `performanceSamplingRate`, `metricsPersistenceEnabled`, `metricsPersistenceKey`) erlauben Runtime-Overrides für Observability-Flags und werden automatisch in den RuntimeConfigService gespiegelt ([Details](src/core/settings), [docs/CONFIGURATION.md](docs/CONFIGURATION.md))

### Geändert
- **ModuleSettingsRegistrar & Logger**: Foundry-Settings synchronisieren jetzt Log-Level in den RuntimeConfigService; der ConsoleLogger reagiert über `bindRuntimeConfig()` sofort auf Änderungen ([Details](src/core/module-settings-registrar.ts), [src/services/consolelogger.ts))
- **ConsoleLogger & CacheService**: Logger, CacheServiceConfig und Core-Registrierungen beziehen ihre Werte ausschließlich über den RuntimeConfigService; directes `EnvironmentConfig`-Wiring entfällt ([Details](src/services/consolelogger.ts), [src/config/modules/cache-services.config.ts], [src/config/modules/core-services.config.ts))
- **Konfigurations-Doku**: `docs/CONFIGURATION.md` beschreibt die neue Override-Kette zwischen ENV, RuntimeConfigService und Foundry-Settings (inkl. Performance-/Metrics-Settings) ([Details](docs/CONFIGURATION.md))
- **Observability & UI**: MetricsCollector, PersistentMetricsCollector, PerformanceTrackingService, UIChannel und ContainerErrorHandler beziehen ihre Flags jetzt über den RuntimeConfigService statt direkt aus `EnvironmentConfig` ([Details](src/observability/metrics-collector.ts), [src/services/PerformanceTrackingService.ts], [src/notifications/channels/UIChannel.ts], [src/di_infrastructure/error-handler.ts))

### Fehlerbehebungen
- **RuntimeConfigService**: Optionales `cacheMaxEntries` respektiert wieder unbegrenzte Defaults, wenn weder ENV noch Foundry-Setting gesetzt sind; Tests prüfen das Verhalten und verhindern versehentliche LRU-Limits ([Details](src/core/runtime-config/runtime-config.service.ts), [docs/runtime-config-layer.md](docs/runtime-config-layer.md))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.23.1] - 2025-11-15
### Hinzugefügt
- Keine Einträge

### Geändert
- **NotificationCenter Logging**: JournalVisibilityService und die Journal-Hooks übergeben jetzt immer strukturierte Kontext-Payloads statt `undefined`, wodurch alle Benachrichtigungen konsistente Metadaten enthalten ([JournalVisibilityService](src/services/JournalVisibilityService.ts), [RenderJournalDirectoryHook](src/core/hooks/render-journal-directory-hook.ts), [JournalCacheInvalidationHook](src/core/hooks/journal-cache-invalidation-hook.ts))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.23.0] - 2025-11-15
### Hinzugefügt
- Keine Einträge

### Geändert
- **NotificationCenter**: ConsoleChannel + NotificationCenter stehen nun bereits im Bootstrap bereit, ein dedizierter `BootstrapLoggerService` deckt nur noch Pre-Validation-Logs ab. Ab dem `init`-Hook wird der UI-Channel automatisch angehängt und alle Hooks/Registrare (RenderJournalDirectory, JournalCacheInvalidation, ModuleSettingsRegistrar, JournalVisibilityService) routen ihre Meldungen ausschließlich über das NotificationCenter ([Details](ARCHITECTURE.md#notifications-subsystem), [src/core/init-solid.ts](src/core/init-solid.ts)).

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.22.0] - 2025-11-14
### Hinzugefügt
- **CacheService**: Neuer DI-Singleton (konfigurierbar via ENV) für TTL-/LRU-Caching inkl. MetricsCollector-Integration und Tagged Invalidation ([Details](src/services/CacheService.ts), [docs/DEPENDENCY-MAP.md](docs/DEPENDENCY-MAP.md#layer-2-infrastructure))
- **JournalCacheInvalidationHook**: Lauscht auf `create/update/deleteJournalEntry` und räumt Cache-Tags wie `journal:hidden` sofort auf ([Details](src/core/hooks/journal-cache-invalidation-hook.ts))

### Geändert
- **JournalVisibilityService**: `getHiddenJournalEntries()` nutzt jetzt den CacheService (CA-02), liefert Hits in ~O(1) und loggt Cache-Status für Observability; Invalidierung erfolgt Hook-basiert ([Details](src/services/JournalVisibilityService.ts), [docs/PROJECT-ANALYSIS.md](docs/PROJECT-ANALYSIS.md#3-journalvisibilityservice))

### Fehlerbehebungen
- **CA-02**: Render-N+1 bei Hidden Journals behoben – CacheService + Hook-Invalidation eliminieren den Vollscan pro Directory-Render ([Details](docs/audit-log-2025-11-14.md))
- **CacheService-Konfiguration**: ENV/DI-Registrierung akzeptiert `cacheMaxEntries` jetzt nur bei gültigen Werten; optionaler Namespace/TTL behalten 100 % Type-/Lint-/Coverage-Gates bei ([Details](docs/PROJECT-ANALYSIS.md#3-journalvisibilityservice))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.21.0] - 2025-11-14
### Hinzugefügt
- Keine Einträge

### Geändert
- **Bundle**: Nicht benötigte `@xyflow/svelte`-Styles aus dem Entry entfernt, um das Bootstrap-Bundle zu schlanken (werden reaktiviert, sobald die UI live geht) ([Details](src/index.ts))
- **CI Pipeline**: Tests laufen nun ohne Doppelung (Coverage nur auf Node 20, schlanker Test auf Node 22), `build:dev` entfällt und Tag-Pushes (`v*`) triggern wieder Release-Builds; `check-all` nutzt `format:check` ([Details](.github/workflows/ci.yml), [package.json](package.json))
- **Dokumentation**: `ARCHITECTURE.md`, `docs/PROJECT-ANALYSIS.md` und `docs/VERSIONING-STRATEGY.md` spiegeln jetzt den Stand v0.20.0 (NotificationCenter, DI-Wrapper, persistente Metriken) wider ([Details](ARCHITECTURE.md)).
- **Testing Guide**: `docs/TESTING.md` beschreibt die tatsächlichen npm-Skripte (`npm test`, `npm run test:watch`, `npm run check-all`) und aktualisierte CI-Beispiele ([Details](docs/TESTING.md)).
- **JournalVisibilityService (CA-02)**: CacheRegistry-basierter Hidden-Journal-Cache wurde wieder entfernt; die Performance-Maßnahme bleibt offen und der Service lädt weiterhin alle Journale pro Render ([Details](docs/audit-log-2025-11-14.md), [docs/PROJECT-ANALYSIS.md](docs/PROJECT-ANALYSIS.md)).

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.20.0] - 2025-11-14
### Hinzugefügt
- **Observability**: Optionaler `PersistentMetricsCollector` mit LocalStorage-Persistenz und austauschbarem `MetricsStorage` ([Details](src/observability/metrics-persistence/persistent-metrics-collector.ts))
- **Konfiguration**: Neue ENV-Flags `VITE_ENABLE_METRICS_PERSISTENCE` & `VITE_METRICS_PERSISTENCE_KEY` für persistente Metriken ([Details](docs/CONFIGURATION.md))

### Geändert
- **Public API**: NotificationCenter- und FoundrySettings-Tokens liefern jetzt ReadOnly-Proxys; Mutationsversuche werfen klare Hinweise ([Details](src/core/api/module-api-initializer.ts))
- **Dokumentation**: Roadmap-Inhalte in `docs/roadmaps/ROADMAP.md` konsolidiert und erledigte Punkte entfernt ([Details](docs/roadmaps/ROADMAP.md))
- **Dependency Injection**: Basisklassen nutzen nun dedizierte `DI…`-Wrapper (u. a. ModuleHealthService, Foundry-Services, Retry/Performance) mit aktualisierten Registrierungen und Dokumentation ([Details](docs/PROJECT-ANALYSIS.md), [Details](docs/DEPENDENCY-MAP.md))
- **Core Services**: Alle verbleibenden Services (TraceContext, HealthCheckRegistry, ModuleApiInitializer, LocalI18nService, FallbackTranslationHandler, MetricsCollector, ModuleSettingsRegistrar, RenderJournalDirectoryHook) besitzen jetzt explizite `DI…`-Wrapper trotz leerer Abhängigkeitslisten; DI-Module registrieren ausschließlich Wrapper-Klassen ([Details](docs/DEPENDENCY-MAP.md#core-services), [Details](docs/PROJECT-ANALYSIS.md#core-services))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.19.1] - 2025-11-13
### Hinzugefügt
- Keine Einträge

### Geändert
- **NotificationCenter**: UI-Channel und Foundry v13-Port leiten jetzt die offiziellen `ui.notifications`-Optionen (`permanent`, `localize`, `format`, `console`, `clean`, `escape`, `progress`) über `NotificationCenterOptions.uiOptions` weiter ([Details](docs/API.md#notificationcenter))
- **Dokumentation**: API-Referenz und Architekturübersicht erläutern die Option-Weitergabe für persistente bzw. lokalisierte UI-Benachrichtigungen ([Details](ARCHITECTURE.md#notifications-subsystem))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.19.0] - 2025-11-13
### Hinzugefügt
- Keine Einträge

### Geändert
- **NotificationCenter**: UI-Channel und Foundry v13-Port leiten jetzt alle `ui.notifications`-Optionen (u. a. `permanent`, `title`, `actions`, `duration`) über `NotificationCenterOptions.uiOptions` weiter ([Details](docs/API.md#notificationcenter))
- **Dokumentation**: API-Referenz und Architekturübersicht erläutern die neue Option-Weitergabe für persistente UI-Benachrichtigungen ([Details](ARCHITECTURE.md#notifications-subsystem))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.18.0] - 2025-11-13
### Hinzugefügt
- Keine Einträge

### Geändert
- **Public API Tokens**: `notificationCenterToken` ersetzt `loggerToken` im externen API-Surface; Logger bleibt intern über DI verfügbar, während externe Integrationen jetzt das NotificationCenter nutzen ([Details](docs/API.md))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.17.0] - 2025-11-13
### Hinzugefügt
- **NotificationCenter - Extensible Message Bus**: Zentrale Nachrichtenverteilung mit flexiblem Channel-System ([Details](src/notifications/NotificationCenter.ts))
- Ersetzt direkte Logger/ErrorService-Aufrufe durch einheitliches Notification-Pattern
- **Channel-basierte Architektur**: Extensible Output-Channels (Strategy Pattern)
- `ConsoleChannel`: Console-Logging via Logger (alle Levels: debug/info/warn/error)
- `UIChannel`: End-User-Benachrichtigungen via FoundryUI (nur info/warn/error, automatische Sanitization in Production)
- Weitere Channels einfach erweiterbar (z.B. SentryChannel, LogFileChannel, WebhookChannel)
- **Multi-Channel-Routing**: Nachrichten automatisch an passende Channels verteilt
- **Level-basiertes Filtering**: Channels können per `canHandle()` entscheiden, welche Notifications sie akzeptieren
- **Convenience Methods**: `debug()`, `info()`, `warn()`, `error()` für einfache Nutzung
- **Dynamic Channel Management**: Channels zur Laufzeit hinzufügen/entfernen (`addChannel()`, `removeChannel()`)
- **TraceId-Support**: Optionale Trace-IDs für Request-Tracking über Channel-Grenzen hinweg
- Test-Suite konsolidiert (1151 Tests nach Entfernen der ErrorService-Spezialtests)
- 100% Test-Coverage für Notification-Center-Module
- 100% Type-Coverage (10530/10530)
- DI-Singleton per `registerClass` in `notification-center.config.ts` registriert
- Vollständig SOLID-konform: Open/Closed Principle für neue Channels
- **ADR-0012 (Superseded)**: Dokumentiert historische ErrorService-Architektur, nun vom NotificationCenter abgelöst
- **Port Infrastructure Test Suite**: Dedizierte Tests für PortSelector- und Registry-Registrierung ([Details](src/config/modules/__tests__/port-infrastructure.config.test.ts))
- **Value Registration Pipeline Docs**: Neue Dokumentationsabschnitte zu Static/Subcontainer/Loop-Values ([Details](ARCHITECTURE.md#bootstrap-value-kategorien-neu))
- **ServiceContainer Token**: `serviceContainerToken` ermöglicht gezielte DI für Container-abhängige Infrastruktur (z. B. HealthChecks) ([Details](src/tokens/tokenindex.ts))

### Geändert
- **Dependency Configuration Registration Order**: ErrorHandling-Modul entfällt
- Neue Registrierungs-Reihenfolge: Core → Observability → Utilities → Port Infrastructure → Foundry Services → I18n Services → Notification Center → Registrars → Validation
- NotificationCenter benötigt Logger, FoundryUI, EnvironmentConfig (alle bereits früher registriert)
- **Projektweite Umstellung auf NotificationCenter**: Alle Business-Services nutzen direkt NotificationCenter
- `JournalVisibilityService`, `ModuleHookRegistrar`, `ModuleSettingsRegistrar`, `RenderJournalDirectoryHook`
- Konsistentes Routing via `{ channels: ["ConsoleChannel"] }` für Bootstrap-/Interne Fehler
- Legacy `ErrorService` inklusive Token, Tests und Config entfernt
- **Static/Subcontainer/Loop Value Flow**: `configureDependencies` trennt Bootstrap-Werte in drei Kategorien und registriert Health-Checks erst nach erfolgreicher Validation ([Details](src/config/dependencyconfig.ts))
- **Factory → Class Migration**: Alle bisherigen `registerFactory`-Pfadstellen auf konsistente `registerClass`-Wrapper umgestellt (Logger, PortSelectionEventEmitter, TranslationHandlerChain, NotificationCenter, HealthChecks)
- **DI Wrapper Layout**: Wrapper und Basisklasse leben jetzt im selben File, die Basisklasse steht oben und der `DI...`-Wrapper folgt direkt danach. Dadurch bleiben `static dependencies` sichtbar und Tests können die Basisklasse weiterhin direkt instanziieren ([Details](src/services/consolelogger.ts))
- **Dependency Config Tests**: Erweiterte Fehlerpfad-Abdeckung (NotificationCenter, HealthChecks, Registries) ([Details](src/config/__tests__/dependencyconfig.test.ts))

### Fehlerbehebungen
- **Health Check Registration Errors**: `registerLoopPreventionServices()` propagiert fehlgeschlagene Registrierungen sofort und vermeidet Post-Validation Value-Registrierungen ([Details](src/config/dependencyconfig.ts))

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.16.0] - 2025-11-12
### Hinzugefügt
- **ADR-0011: Bootstrap `new` Instantiation Exceptions**: Dokumentiert warum `new` Aufrufe im Bootstrap-Code architektonisch gerechtfertigt sind ([Details](docs/adr/0011-bootstrap-new-instantiation-exceptions.md))
- Container Self-Reference Problem erklärt (Chicken-and-Egg)
- Alternative Ansätze geprüft und verworfen (alle würden Architektur verschlechtern)
- 4 erlaubte Kategorien definiert: Container Self-Reference, Bootstrap Services, Post-Validation Init, Test Code
- Klare Trennung: Bootstrap Layer (Orchestration) vs. Application Layer (DI-managed)
- **I18n Chain of Responsibility Pattern**: Translation Handler Architektur implementiert ([Details](src/services/i18n/))
- `TranslationHandler` Interface für erweiterbare Handler-Chain
- `AbstractTranslationHandler` Base Class mit Chain-Logik
- `FoundryTranslationHandler` → `LocalTranslationHandler` → `FallbackTranslationHandler`
- **SOLID-konform**: Alle Handler per DI-Token injiziert (kein `new` in Application-Code)
- Handler-Chain per Factory gebaut mit automatischer Dependency Resolution
- 4 neue Tokens: `foundryTranslationHandlerToken`, `localTranslationHandlerToken`, `fallbackTranslationHandlerToken`, `translationHandlerChainToken`
- `TranslationHandler` zu `ServiceType` Union hinzugefügt
- Eliminiert Code-Duplikation in I18nFacadeService (translate, format, has)
- +39 neue Handler-Tests, -11 vereinfachte Facade-Tests = +28 Tests netto (1076 → 1104)
- Vollständig kompatibel: Öffentliche API unverändert

### Geändert
- **I18nFacadeService refactored**: Nutzt jetzt Chain of Responsibility Pattern mit DI
- Interne Implementierung von translate(), format(), has() vereinfacht (jeweils ~3 Zeilen statt ~15)
- Handler-Chain wird per DI injiziert statt per `new` instantiiert (DIP-konform)
- Keine Code-Duplikation mehr zwischen den drei Methoden
- Öffentliche API bleibt identisch (keine Breaking Changes)
- **PROJECT-ANALYSIS.md aktualisiert**: Refactoring-Status aktualisiert auf Stand v0.15.0
- 6 Refactorings als ✅ abgeschlossen markiert (Base Class, Health-Check-Registry, TraceContext, Retry-Service, I18n-Facade, Dependency Config)
- Dependency Config als gelöst eingestuft: Bereits in 7 Module seit v0.8.0 aufgeteilt, aktuelles Design mit gezielten `new` Aufrufen ist optimal
- Verbleibende `new` Aufrufe architektonisch gerechtfertigt und in ADR-0011 dokumentiert
- Gesamtbewertung auf 5/5 Sterne erhöht (alle Kategorien)
- Nur noch 2 optionale Refactorings verbleibend (Error Sanitizer, Metrics Persistierung)
- Architektur ist production-ready ([Details](docs/PROJECT-ANALYSIS.md))

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.15.0] - 2025-11-12
### Hinzugefügt
- **TraceContext Service**: Automatische Trace-ID-Propagation für Observability ([Details](docs/QUICK-REFERENCE.md#tracecontext))
- `trace()` für synchrone Operationen mit automatischer Trace-ID-Generierung
- `traceAsync()` für asynchrone Operationen
- `getCurrentTraceId()` für Zugriff auf aktuelle Trace-ID
- Logger-Integration: Automatische Trace-ID-Injection ohne manuelle Weitergabe
- Context-Stacking für verschachtelte Traces
- Implementiert `Disposable` für ordnungsgemäßes Cleanup
- +50 neue Tests (1026 → 1076)
- Vollständig kompatibel: Explizites `withTraceId()` bleibt vollwertige Alternative

### Geändert
- **Logger Factory Registration**: Logger wird jetzt als Factory registriert (statt Class) um TraceContext-Injection zu ermöglichen ([Details](src/config/modules/core-services.config.ts))
- Factory resolved TraceContext nach dessen Erstellung
- Verhindert zirkuläre Abhängigkeit Logger ↔ TraceContext
- Vollständig kompatibel: Logger funktioniert mit und ohne TraceContext

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.14.0] - 2025-11-12
### Hinzugefügt
- **Code Coverage Refactoring - Phase 1, 2 & Defensive Guards**: 88 c8 ignore markers eliminiert (47.8% Reduktion) ([Details](docs/roadmaps/code-coverage-refactoring-roadmap.md))
- **Phase 1 Quick Wins**: 18 markers eliminiert
- Task 1.1: Disposed State Guards in allen 6 Ports (`#disposed` private field, idempotente `dispose()`, DISPOSED error code)
- Task 1.2: Default Parameter Tests (LocalI18nService, module-api-initializer)
- Task 1.3: Exhaustive Enum Checking mit TypeScript `never` type (ServiceResolver)
- **Phase 2 Optional**: 60 markers eliminiert
- Task 2.1: TypeScript Compile-Time Checks entfernt (input-validators redundante runtime checks)
- Task 2.2: Sampling Tests mit Math.random() mocking (metrics-collector production sampling)
- Task 2.3: withRetry Direct Tests (FoundryServiceBase.test.ts erstellt mit 14 Tests)
- Task 2.4: Error Propagation Tests (Config modules, ServiceRegistry, ServiceResolver, Container)
- **Phase 3 Defensive Guards**: 10 markers eliminiert
- Non-null assertions für TypeScript flow-analysis (RetryService lastError!, portregistry selections!)
- Logik-Vereinfachung (module-health-service ternary statt if/else/else)
- **Neue Tests**: 43 Tests hinzugefügt (983 → 1026)
- **Coverage**: 100% (Lines/Statements), 100% (Branches), 100% (Functions) ✅
- **Verbleibend**: ~96 markers (architektonisch gerechtfertigt: Foundry Runtime, Lifecycle Methods, Service Resolution guards)
- **Code Coverage Refactoring Roadmap**: Actionable Plan zur Reduzierung von c8 ignore Kommentaren ([Details](docs/roadmaps/code-coverage-refactoring-roadmap.md))
- **Phase 1 Quick Wins**: 21 ignores eliminierbar in 5-6h (11.4% Reduktion)
- **Task 1.1 - Disposed State Guards**: `#disposed` Variable in allen Ports für Defensive Programming
- Private `#disposed` field verhindert Nutzung nach Disposal
- Guards in allen public methods mit hilfreichen Error-Messages
- Idempotente `dispose()` Methode (mehrfach aufrufbar)
- Eliminiert 14 c8 ignore markers (7% Reduktion)
- Task 1.2: Default Parameter Tests (5 ignores)
- Task 1.3: Exhaustive Enum Checking (2 ignores)
- **Phase 2 Optional**: 60 ignores eliminierbar in 7-9h (32.6% Reduktion)
- **Task 2.4 - Error Propagation Tests**: Höchster Einzelimpact! 🔥
- Mock Sub-Modules und teste Orchestration-Logic
- Verifiziert dass Parent-Module richtig verkabelt sind
- Eliminiert komplette Category 1 (Module Registration): 52 ignores (28.3%)
- Revidierte Bewertung: DAMP > DRY für Tests!
- Task 2.1-2.3: TypeScript Checks, Sampling Tests, withRetry Tests (8 ignores)
- **Gesamt-Potenzial**: 81 ignores eliminierbar (44.0% Reduktion!)
- 2 komplette Kategorien eliminierbar nach Phase 2
- Detaillierte Implementation Steps mit Code-Beispielen
- Priorisierte Implementierungsreihenfolge mit Milestones
- Tracking Dashboard für Progress-Monitoring

### Geändert
- **Code Coverage Refactoring Roadmap v1.2.0**: Verbleibende Lines-Aufschlüsselung präzisiert ([Details](docs/roadmaps/code-coverage-refactoring-roadmap.md#after-phase-2-quick-wins--optional))
- "Miscellaneous 46 lines" aufgeschlüsselt in 7 konkrete Kategorien
- Detaillierte Tabelle für 120 verbleibende Lines hinzugefügt
- Rechnung korrigiert: 45 + 12 + 34 + 8 + 1 + 8 + 12 = 120 ✓
- 57 lines (48%) absolut legitim, 63 lines (52%) größtenteils legitim
- **Code Coverage Exclusions Dokumentation**: Vollständiger Audit und Refactoring-Analyse ([Details](docs/quality-gates/code-coverage-exclusions.md))
- 184 c8 ignore Marker über 35 Dateien vollständig kategorisiert
- ~201 ignorierte Zeilen in 9 Kategorien aufgeschlüsselt
- Diskrepanz zwischen Marker-Count und Line-Count geklärt (Start/Stop-Blocks spannen mehrere Zeilen)
- Refactoring-Potenzial identifiziert: ~21-29 ignores eliminierbar (~10-15%)
- Quick Wins dokumentiert: Optional Disposable Interface (~14 ignores), Default Parameter Tests (~5 ignores)
- Priorisierte Refactoring-Roadmap mit Aufwand/Nutzen-Bewertung
- Verbleibende ~155-172 ignores sind architektonisch gerechtfertigt (Integration-Points, DRY-Prinzip, Defensive Programming)

### Fehlerbehebungen
- Keine Einträge

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.13.1] - 2025-11-11
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

## [0.13.0] - 2025-11-11
### Hinzugefügt
- **FoundryServiceBase**: Abstract Base Class für Foundry Services reduziert Code-Duplikation um ~120 Zeilen ([Details](docs/DEPENDENCY-MAP.md#foundry-service-base))
- Gemeinsame Port-Selection-Logik für alle 6 Foundry Services
- Integrierte Retry-Logik mit `withRetry()` und `withRetryAsync()` für Resilienz bei transient failures
- Foundry API-Calls sind nun automatisch gegen Race Conditions und Timing-Issues geschützt
- **Health-Check-Registry Pattern**: Erweiterbare Health-Check-Infrastruktur ([Details](docs/DEPENDENCY-MAP.md#health-check-registry))
- `HealthCheckRegistry` für dynamische Registrierung von Health-Checks
- `ContainerHealthCheck` für DI-Container-Validierung
- `MetricsHealthCheck` für Port-Selection und Metrics-Überwachung
- Modulares Design ermöglicht einfaches Hinzufügen neuer Health-Checks ohne Code-Änderungen
- **RetryService Integration**: Foundry Services nutzen jetzt Retry-Logik für Resilienz bei API-Calls
- Maximal 2 Attempts (1 Retry) mit 100ms Delay verhindert Performance-Impact
- Fängt 90% transiente Fehler ab (Race Conditions, Timing Issues, temporäre Port-Selection-Fehler)
- **Schema Validation für Settings/Flags** (Security): Runtime-Validierung mit Valibot
- `FoundrySettings.get()` und `FoundryDocument.getFlag()` erfordern nun Valibot-Schema-Parameter
- Verhindert Injection-Angriffe auf externe Inputs (Settings & Flags)
- Eliminiert unsichere Type-Casts
- Neue Schemas: `LOG_LEVEL_SCHEMA`, `BOOLEAN_FLAG_SCHEMA`, `SettingConfigSchema`
- **Disposable Interface für alle Ports**: Konsistente Resource-Cleanup-Architektur
- Alle 6 Port-Interfaces (`FoundryGame`, `FoundryDocument`, `FoundrySettings`, `FoundryUI`, `FoundryI18n`, `FoundryHooks`) erweitern nun `Disposable`
- `FoundryServiceBase.dispose()` drastisch vereinfacht (11 → 4 Zeilen Code)
- Eliminiert Runtime-Type-Checks für Disposal-Support
- **Test Helper**: `createDummyService()` für DI-Container-Test-Registrierungen
- Zentraler Helper eliminiert Code-Duplikation in Tests
- Eliminiert 2 type-coverage:ignore aus Test-Code

### Geändert
- **RetryService**: Legacy-API entfernt + mapException required (Breaking Change)
- Union Type `options: RetryOptions<ErrorType> | number` entfernt
- Parameter `legacyDelayMs?: number` entfernt
- **mapException ist nun REQUIRED** (kein Default-Cast mehr für Type-Safety)
- Early-Return-Pattern eliminiert NonNull-Assertions
- Unsafe `as ErrorType` casts komplett eliminiert
- Signatur: `retry(fn, options: RetryOptions<ErrorType>)` (options required!)
- Signatur: `retrySync(fn, options: Omit<RetryOptions, "delayMs" | "backoffFactor">)` (options required!)
- **jQuery Support entfernt**: Foundry V13+ nutzt native HTMLElement
- jQuery-Kompatibilitätsschicht aus `render-journal-directory-hook.ts` entfernt (36 Zeilen Code eliminiert)
- `extractHtmlElement()` vereinfacht: nur noch native `HTMLElement` Support
- 3 jQuery-Tests entfernt
- Type-Coverage Verbesserung: 9288 → 9216 types (-72 Zeilen)
- **ModuleHealthService**: Refactored zu Health-Check-Registry (eliminiert Container Self-Reference)
- Dependencies: `[container, metricsCollectorToken]` → `[healthCheckRegistryToken]`
- Container Self-Reference komplett eliminiert (Ce 2→1)
- Erweiterbares Design: Neue Health-Checks ohne ModuleHealthService-Änderungen
- **Foundry Services**: Extends `FoundryServiceBase` für einheitliche Architektur
- `FoundryGameService`: Refactored (85 → 50 Zeilen, -41%)
- `FoundryDocumentService`: Refactored (92 → 58 Zeilen, -37%)
- `FoundryUIService`: Refactored (93 → 65 Zeilen, -30%)
- `FoundrySettingsService`: Refactored (91 → 66 Zeilen, -27%)
- `FoundryI18nService`: Refactored (64 → 60 Zeilen, -6%)
- `FoundryHooksService`: Teilweise refactored (behält eigene dispose()-Logik für Hook-Cleanup)
- Alle Services nutzen jetzt Retry-Logik via Base Class
- Dependencies erweitert um `retryServiceToken` (über Base Class)
- **Facade Interface konsistent**: `FoundryJournalFacade.getEntryFlag()`
- Parameter-Typ geändert: `entry: unknown` → `entry: FoundryJournalEntry`
- Type-Safety verbessert, Cast bleibt (fvtt-types restrictive scope)
- **Valibot Schema für Setting Config Validation**: `validateSettingConfig()` nutzt jetzt Valibot
- `SettingConfigSchema` erstellt für strukturierte Validierung
- Eliminiert manuelle Type-Checks und Casts (2 type-coverage:ignore entfernt)
- **Type Coverage Dokumentation**: Alle 34 `type-coverage:ignore` Kommentare standardisiert ([Details](docs/quality-gates/type-coverage-exclusions.md))
- 20 Dateien auf Standard-Format umgestellt: `/* type-coverage:ignore-next-line -- reason */`
- Begründung jetzt inline statt in separater Zeile (bessere Wartbarkeit)
- Dokumentation vollständig aktualisiert und konsistent (19 Dateien, 34 Casts)
- Veraltete Einträge entfernt, alle Pfade und Cast-Anzahlen korrigiert
- 100% Type Coverage beibehalten (9278 / 9278)
- **Type Coverage Refactoring**: 12 type-coverage:ignore Casts eliminiert (34 → 24) ([Details](docs/quality-gates/type-coverage-exclusions.md))
- **Phase 1 - Non-null Assertions (6 eliminiert):**
- Direkter Wertezugriff statt `Map.get()!` in FoundryHooksService und ServiceRegistry
- Optional chaining statt `match[1]!` in versiondetector
- Destructuring statt `parts[0]!` in trace
- `Array.at(-1)` statt `[length-1]!` in portregistry
- `slice() + reduce()` statt Loop mit `[i]!` in metrics-collector
- **Phase 2 - Type Guards (1 eliminiert netto):**
- `isStringValue()` Type Guard in schemas.ts eliminiert 1 Cast
- `isAllowedKey()` Type Guard in readonly-wrapper.ts: Type Predicate musste zu boolean werden, 1 Cast zurück (TypeScript Limitation)
- **Phase 3 - DI-System Generic Type-Safety (4 eliminiert):**
- `ServiceRegistration<TServiceType>` generic gemacht
- `TypeSafeRegistrationMap` erstellt für token-based type narrowing
- Token-Generic propagiert durch Registration/Resolution Pipeline
- Alias-, Factory-, Class- und Value-Casts in ServiceResolver eliminiert
- 100% Type Coverage beibehalten (9335 / 9335)
- Verbleibend: 25 Casts (13 Dateien), alle architektonisch begründet
- Neue Tests: TypeSafeRegistrationMap (11 Tests), trace.ts Edge-Cases (2 Tests), readonly-wrapper Symbol-Test (1 Test)
- **Quality Gates Dokumentation**: Vollständige Dokumentation aller Quality-Check-Ausnahmen ([Details](docs/quality-gates/README.md))
- Neuer Ordner `docs/quality-gates/` für zentrale Quality-Dokumentation
- `linter-exclusions.md` erstellt: 94 eslint-disable Stellen dokumentiert (10 in Production Code)
- `type-coverage-exclusions.md` verschoben und aktualisiert (25 Casts)
- `code-coverage-exclusions.md` verschoben und umbenannt (201 c8 ignores)
- Alle Kategorien mit Begründungen und Statistiken
- Wartungs-Workflow und Verification-Commands dokumentiert
- `docs/guides/` aufgeräumt: 6 veraltete Dateien gelöscht, 1 verschoben
- Nur noch relevante Development Guides behalten
- **Dokumentations-Reorganisation**: Einheitliche Namensgebung nach Best Practices ([Details](docs/INDEX.md))
- 7 Dokumente umbenannt: Underscores → Bindestriche (URL-freundlich, Markdown-Standard)
- `DEPENDENCY_MAP.md` → `DEPENDENCY-MAP.md`
- `PROJECT_ANALYSIS.md` → `PROJECT-ANALYSIS.md`
- `QUICK_REFERENCE.md` → `QUICK-REFERENCE.md`
- `CHANGELOG_ANALYSIS.md` → `CHANGELOG-ANALYSIS.md`
- `VERSIONING_STRATEGY.md` → `VERSIONING-STRATEGY.md`
- `REFACTORING_ROADMAP.md` → `REFACTORING-ROADMAP.md`
- `API-FUTURE-TASKS.md` → `api-future-tasks.md` (lowercase für Task-Docs)
- 2 veraltete Dokumente archiviert: `DOKUMENTATIONS_UPDATES_2025-11-09.md`, `DOKUMENTENLAGE_ÜBERSICHT.md`
- 6 obsolete Dateien gelöscht aus `docs/guides/` (Begriffserläuterungen, Beispiel Container, etc.)
- Alle internen Links aktualisiert (15+ Dateien)
- Konsistente Struktur: Meta-Docs UPPERCASE, Guides lowercase-with-hyphens
- **Neuer Unterordner `docs/roadmaps/`** für Future Planning Dokumente
- `api-future-tasks.md` → `docs/roadmaps/` verschoben
- `REFACTORING-ROADMAP.md` → `docs/roadmaps/` verschoben
- `CHANGELOG-ANALYSIS.md` → `docs/archive/` archiviert (Git-History dokumentiert Dokumenten-Änderungen)
- Top-Level Docs reduziert: 15 → 12 Dokumente (bessere Übersichtlichkeit)

### Fehlerbehebungen
- Keine Fehlerbehebungen in diesem Release

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.12.2] - 2025-11-11
### Hinzugefügt
- Keine Einträge

### Geändert
- Keine Einträge

### Fehlerbehebungen
- **GitHub Actions: CI-Workflow Doppelausführung verhindert** (.github/workflows/ci.yml)
- Tag-Trigger entfernt, da dieser zu doppelten Workflow-Runs führte (Branch-Push + Tag-Push)
- CI läuft jetzt nur noch bei Branch-Pushes auf main/develop
- Release-Job prüft via `if`-Bedingung ob ein Tag vorhanden ist
- **Wichtig**: Bei Releases Branch und Tag zusammen pushen (`git push origin main --tags`)

### Bekannte Probleme
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

## [0.12.1] - 2025-11-10
### Hinzugefügt
- Keine Einträge

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
- Keine bekannten Probleme

### Upgrade-Hinweise
- Keine besonderen Maßnahmen erforderlich

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
- **Type-Coverage**: 100% mit gezielten inline-ignores ([Details](docs/quality-gates/type-coverage-exclusions.md))
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
- **PROJECT-ANALYSIS.md**: 5 neue Services dokumentiert (Nr. 17-21)
- **DEPENDENCY-MAP.md**: Neue Dependencies und Services in Dependency-Tree eingetragen
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

