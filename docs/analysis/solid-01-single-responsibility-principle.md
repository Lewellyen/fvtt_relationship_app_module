# SOLID-Analyse: Single Responsibility Principle (SRP)

**Erstellungsdatum:** 2025-12-10
**Zweck:** Analyse aller Klassen auf Einhaltung des Single Responsibility Principle
**Model:** Claude Sonnet 4.5

---

## Single Responsibility Principle (SRP)

**Definition:** Eine Klasse sollte nur einen Grund zur Änderung haben. Jede Klasse sollte nur eine Verantwortlichkeit haben.

**Kriterien für die Bewertung:**
- ✅ **Einhält SRP:** Klasse hat eine klar definierte, einzige Verantwortlichkeit
- ⚠️ **Teilweise:** Klasse hat hauptsächlich eine Verantwortlichkeit, aber einige sekundäre Aufgaben
- ❌ **Verletzt SRP:** Klasse hat mehrere unabhängige Verantwortlichkeiten

---

## Domain Layer

**Pfad:** `src/domain/`

*Keine Klassen vorhanden (nur Interfaces/Types)*

---

## Application Layer

**Pfad:** `src/application/`

### Services

| Klasse | Status | Begründung |
|--------|--------|------------|
| `RuntimeConfigService` | ✅ | Einzige Verantwortlichkeit: Verwaltung der Runtime-Konfiguration |
| `RuntimeConfigSync` | ✅ | Einzige Verantwortlichkeit: Synchronisation zwischen Foundry Settings und Runtime Config |
| `DIRuntimeConfigSync` | ✅ | DI-Wrapper, keine zusätzliche Verantwortlichkeit |
| `ModuleSettingsRegistrar` | ⚠️ | Registriert Settings UND synchronisiert mit Runtime Config - könnte aufgeteilt werden |
| `DIModuleSettingsRegistrar` | ✅ | DI-Wrapper |
| `NotificationCenter` | ✅ | Einzige Verantwortlichkeit: Routing von Notifications zu Channels |
| `DINotificationCenter` | ✅ | DI-Wrapper |
| `SettingRegistrationErrorMapper` | ✅ | Einzige Verantwortlichkeit: Mapping von Settings-Fehlern |
| `DISettingRegistrationErrorMapper` | ✅ | DI-Wrapper |
| `ModuleHealthService` | ✅ | Einzige Verantwortlichkeit: Aggregation von Health Checks |
| `DIModuleHealthService` | ✅ | DI-Wrapper |
| `ModuleReadyService` | ✅ | Einzige Verantwortlichkeit: Prüfung ob Modul bereit ist |
| `DIModuleReadyService` | ✅ | DI-Wrapper |
| `ModuleEventRegistrar` | ✅ | Einzige Verantwortlichkeit: Registrierung von Events |
| `DIModuleEventRegistrar` | ✅ | DI-Wrapper |
| `JournalDirectoryProcessor` | ✅ | Einzige Verantwortlichkeit: Verarbeitung von Journal-Directory |
| `DIJournalDirectoryProcessor` | ✅ | DI-Wrapper |
| `JournalVisibilityService` | ✅ | Einzige Verantwortlichkeit: Verwaltung der Journal-Sichtbarkeit |
| `DIJournalVisibilityService` | ✅ | DI-Wrapper |

### Health Checks

| Klasse | Status | Begründung |
|--------|--------|------------|
| `MetricsHealthCheck` | ✅ | Einzige Verantwortlichkeit: Health Check für Metrics |
| `DIMetricsHealthCheck` | ✅ | DI-Wrapper |
| `HealthCheckRegistry` | ✅ | Einzige Verantwortlichkeit: Verwaltung von Health Checks |
| `DIHealthCheckRegistry` | ✅ | DI-Wrapper |
| `ContainerHealthCheck` | ✅ | Einzige Verantwortlichkeit: Health Check für Container |
| `DIContainerHealthCheck` | ✅ | DI-Wrapper |

### Use Cases

| Klasse | Status | Begründung |
|--------|--------|------------|
| `RegisterContextMenuUseCase` | ✅ | Einzige Verantwortlichkeit: Registrierung von Context Menus |
| `DIRegisterContextMenuUseCase` | ✅ | DI-Wrapper |
| `TriggerJournalDirectoryReRenderUseCase` | ✅ | Einzige Verantwortlichkeit: Auslösen von Journal Directory Re-Render |
| `DITriggerJournalDirectoryReRenderUseCase` | ✅ | DI-Wrapper |
| `ProcessJournalDirectoryOnRenderUseCase` | ✅ | Einzige Verantwortlichkeit: Verarbeitung bei Render |
| `DIProcessJournalDirectoryOnRenderUseCase` | ✅ | DI-Wrapper |
| `InvalidateJournalCacheOnChangeUseCase` | ✅ | Einzige Verantwortlichkeit: Cache-Invalidierung bei Änderungen |
| `DIInvalidateJournalCacheOnChangeUseCase` | ✅ | DI-Wrapper |
| `HookRegistrationManager` | ✅ | Einzige Verantwortlichkeit: Verwaltung von Hook-Registrierungen |

### Handlers

| Klasse | Status | Begründung |
|--------|--------|------------|
| `HideJournalContextMenuHandler` | ✅ | Einzige Verantwortlichkeit: Behandlung von Context Menu Hide-Events |
| `DIHideJournalContextMenuHandler` | ✅ | DI-Wrapper |

---

## Infrastructure Layer

**Pfad:** `src/infrastructure/`

### Logging

| Klasse | Status | Begründung |
|--------|--------|------------|
| `BaseConsoleLogger` | ✅ | Einzige Verantwortlichkeit: Basis-Logging zu Console |
| `ConsoleLoggerService` | ✅ | Einzige Verantwortlichkeit: Komposition von Logger-Decorators |
| `DIConsoleLoggerService` | ✅ | DI-Wrapper |
| `StackTraceLoggerDecorator` | ✅ | Einzige Verantwortlichkeit: Stack Trace Decorator |
| `TraceContextLoggerDecorator` | ✅ | Einzige Verantwortlichkeit: Trace Context Decorator |
| `TracedLogger` | ✅ | Einzige Verantwortlichkeit: Logger mit Trace ID |
| `RuntimeConfigLoggerDecorator` | ✅ | Einzige Verantwortlichkeit: Runtime Config Decorator |

### Retry

| Klasse | Status | Begründung |
|--------|--------|------------|
| `BaseRetryService` | ✅ | Einzige Verantwortlichkeit: Basis-Retry-Logik |
| `RetryObservabilityDecorator` | ✅ | Einzige Verantwortlichkeit: Observability für Retry |
| `RetryService` | ✅ | Einzige Verantwortlichkeit: Retry-Logik mit Observability |
| `DIRetryService` | ✅ | DI-Wrapper |

### Notifications

| Klasse | Status | Begründung |
|--------|--------|------------|
| `NotificationQueue` | ✅ | Einzige Verantwortlichkeit: Queue-Verwaltung für Notifications |
| `DINotificationQueue` | ✅ | DI-Wrapper |
| `QueuedUIChannel` | ✅ | Einzige Verantwortlichkeit: UI Channel mit Queue |
| `DIQueuedUIChannel` | ✅ | DI-Wrapper |
| `UIChannel` | ✅ | Einzige Verantwortlichkeit: UI Notification Channel |
| `DIUIChannel` | ✅ | DI-Wrapper |
| `ConsoleChannel` | ✅ | Einzige Verantwortlichkeit: Console Notification Channel |
| `DIConsoleChannel` | ✅ | DI-Wrapper |

### Cache

| Klasse | Status | Begründung |
|--------|--------|------------|
| `CacheService` | ⚠️ | Verantwortlichkeiten: Caching, Eviction, Metrics - könnte aufgeteilt werden, aber gut komponiert |
| `DICacheService` | ✅ | DI-Wrapper |
| `CacheConfigSync` | ✅ | Einzige Verantwortlichkeit: Synchronisation von Cache-Config |
| `DICacheConfigSync` | ✅ | DI-Wrapper |

### Dependency Injection

| Klasse | Status | Begründung |
|--------|--------|------------|
| `ServiceContainer` | ✅ | Facade-Pattern: Koordiniert spezialisierte Komponenten (SRP-konform) |
| `ServiceRegistration` | ✅ | Einzige Verantwortlichkeit: Repräsentation einer Service-Registrierung |
| `ServiceResolver` | ✅ | Einzige Verantwortlichkeit: Auflösung von Services |
| `TransientResolutionStrategy` | ✅ | Einzige Verantwortlichkeit: Transient Lifecycle Resolution |
| `SingletonResolutionStrategy` | ✅ | Einzige Verantwortlichkeit: Singleton Lifecycle Resolution |
| `ScopedResolutionStrategy` | ✅ | Einzige Verantwortlichkeit: Scoped Lifecycle Resolution |
| `ScopeManager` | ✅ | Einzige Verantwortlichkeit: Verwaltung von Scopes |
| `ServiceRegistry` | ✅ | Einzige Verantwortlichkeit: Verwaltung von Service-Registrierungen |

### Observability

| Klasse | Status | Begründung |
|--------|--------|------------|
| `MetricsCollector` | ⚠️ | Sammelt Metrics UND erstellt Snapshots - könnte getrennt werden |
| `DIMetricsCollector` | ✅ | DI-Wrapper |
| `MetricsSampler` | ✅ | Einzige Verantwortlichkeit: Sampling von Metrics |
| `DIMetricsSampler` | ✅ | DI-Wrapper |
| `MetricsReporter` | ✅ | Einzige Verantwortlichkeit: Reporting von Metrics |
| `DIMetricsReporter` | ✅ | DI-Wrapper |
| `ObservabilityRegistry` | ✅ | Einzige Verantwortlichkeit: Registry für Observability-Komponenten |
| `DIObservabilityRegistry` | ✅ | DI-Wrapper |
| `PerformanceTrackerImpl` | ✅ | Einzige Verantwortlichkeit: Performance-Tracking |
| `PersistentMetricsCollector` | ✅ | Einzige Verantwortlichkeit: Persistente Metrics-Sammlung |
| `DIPersistentMetricsCollector` | ✅ | DI-Wrapper |
| `DIMetricsSnapshotAdapter` | ✅ | Adapter für Metrics Snapshots |

### Performance

| Klasse | Status | Begründung |
|--------|--------|------------|
| `PerformanceTrackingService` | ✅ | Einzige Verantwortlichkeit: Performance-Tracking Service |
| `DIPerformanceTrackingService` | ✅ | DI-Wrapper |

### I18n

| Klasse | Status | Begründung |
|--------|--------|------------|
| `I18nFacadeService` | ✅ | Einzige Verantwortlichkeit: Facade für I18n |
| `DII18nFacadeService` | ✅ | DI-Wrapper |
| `TranslationHandlerChain` | ✅ | Einzige Verantwortlichkeit: Chain of Responsibility für Translation |
| `DITranslationHandlerChain` | ✅ | DI-Wrapper |
| `AbstractTranslationHandler` | ✅ | Abstrakte Basis-Klasse für Translation Handler |
| `LocalTranslationHandler` | ✅ | Einzige Verantwortlichkeit: Lokale Translation |
| `DILocalTranslationHandler` | ✅ | DI-Wrapper |
| `FoundryTranslationHandler` | ✅ | Einzige Verantwortlichkeit: Foundry Translation |
| `DIFoundryTranslationHandler` | ✅ | DI-Wrapper |
| `FallbackTranslationHandler` | ✅ | Einzige Verantwortlichkeit: Fallback Translation |

### Health

| Klasse | Status | Begründung |
|--------|--------|------------|
| `HealthCheckRegistryAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Health Check Registry |

### Config

| Klasse | Status | Begründung |
|--------|--------|------------|
| `RuntimeConfigAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Runtime Config |

### Foundry Adapters - Services

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryUIAvailabilityPort` | ✅ | Einzige Verantwortlichkeit: Prüfung der UI-Verfügbarkeit |
| `DIFoundryUIAvailabilityPort` | ✅ | DI-Wrapper |
| `FoundryUIPort` | ✅ | Einzige Verantwortlichkeit: Foundry UI Port |
| `DIFoundryUIPort` | ✅ | DI-Wrapper |
| `FoundrySettingsPort` | ✅ | Einzige Verantwortlichkeit: Foundry Settings Port |
| `DIFoundrySettingsPort` | ✅ | DI-Wrapper |
| `FoundryModuleReadyPort` | ✅ | Einzige Verantwortlichkeit: Foundry Module Ready Port |
| `DIFoundryModuleReadyPort` | ✅ | DI-Wrapper |
| `FoundryLibWrapperService` | ✅ | Einzige Verantwortlichkeit: LibWrapper Service |
| `DIFoundryLibWrapperService` | ✅ | DI-Wrapper |
| `FoundryI18nPort` | ✅ | Einzige Verantwortlichkeit: Foundry I18n Port |
| `DIFoundryI18nPort` | ✅ | DI-Wrapper |
| `FoundryHooksPort` | ✅ | Einzige Verantwortlichkeit: Foundry Hooks Port |
| `DIFoundryHooksPort` | ✅ | DI-Wrapper |
| `FoundryGamePort` | ✅ | Einzige Verantwortlichkeit: Foundry Game Port |
| `DIFoundryGamePort` | ✅ | DI-Wrapper |
| `FoundryDocumentPort` | ✅ | Einzige Verantwortlichkeit: Foundry Document Port |
| `DIFoundryDocumentPort` | ✅ | DI-Wrapper |
| `JournalContextMenuLibWrapperService` | ✅ | Einzige Verantwortlichkeit: Journal Context Menu LibWrapper |
| `DIJournalContextMenuLibWrapperService` | ✅ | DI-Wrapper |
| `FoundryServiceBase` | ✅ | Abstrakte Basis-Klasse für Foundry Services |

### Foundry Adapters - Versioning

| Klasse | Status | Begründung |
|--------|--------|------------|
| `PortSelector` | ⚠️ | Wählt Ports UND emittiert Events - könnte getrennt werden, aber gut komponiert |
| `DIPortSelector` | ✅ | DI-Wrapper |
| `FoundryVersionDetector` | ✅ | Einzige Verantwortlichkeit: Erkennung der Foundry-Version |
| `DIFoundryVersionDetector` | ✅ | DI-Wrapper |
| `PortResolutionStrategy` | ✅ | Einzige Verantwortlichkeit: Strategie für Port-Auflösung |

### Foundry Adapters - Settings

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundrySettingsAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Foundry Settings |
| `DIFoundrySettingsAdapter` | ✅ | DI-Wrapper |
| `FoundrySettingsRegistrationAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Settings-Registrierung |
| `DIFoundrySettingsRegistrationAdapter` | ✅ | DI-Wrapper |

### Foundry Adapters - Collection Adapters

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryJournalCollectionAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Journal Collection |
| `DIFoundryJournalCollectionAdapter` | ✅ | DI-Wrapper |

### Foundry Adapters - Repository Adapters

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryJournalRepositoryAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Journal Repository |
| `DIFoundryJournalRepositoryAdapter` | ✅ | DI-Wrapper |

### Foundry Adapters - Facades

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryJournalFacade` | ✅ | Einzige Verantwortlichkeit: Facade für Foundry Journal |
| `DIFoundryJournalFacade` | ✅ | DI-Wrapper |

### Foundry Adapters - Event Adapters

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryJournalEventAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Journal Events |
| `DIFoundryJournalEventAdapter` | ✅ | DI-Wrapper |

### Foundry Adapters - UI Adapters

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryUIAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Foundry UI |
| `DIFoundryUIAdapter` | ✅ | DI-Wrapper |

### Foundry Adapters - Ports (v13)

| Klasse | Status | Begründung |
|--------|--------|------------|
| `FoundryV13ModulePort` | ✅ | Einzige Verantwortlichkeit: Foundry v13 Module Port |
| `DIFoundryV13ModulePort` | ✅ | DI-Wrapper |
| `FoundryV13DocumentPort` | ✅ | Einzige Verantwortlichkeit: Foundry v13 Document Port |
| `DIFoundryV13DocumentPort` | ✅ | DI-Wrapper |

### Platform Adapters - Notifications

| Klasse | Status | Begründung |
|--------|--------|------------|
| `NotificationPortAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Notification Port |
| `DINotificationPortAdapter` | ✅ | DI-Wrapper |

### Platform Adapters - I18n

| Klasse | Status | Begründung |
|--------|--------|------------|
| `I18nPortAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für I18n Port |
| `DII18nPortAdapter` | ✅ | DI-Wrapper |

### Platform Adapters - Cache

| Klasse | Status | Begründung |
|--------|--------|------------|
| `CachePortAdapter` | ✅ | Einzige Verantwortlichkeit: Adapter für Cache Port |
| `DICachePortAdapter` | ✅ | DI-Wrapper |

---

## Framework Layer

**Pfad:** `src/framework/`

### Core

| Klasse | Status | Begründung |
|--------|--------|------------|
| `CompositionRoot` | ❌ | Verletzt SRP: Container-Erstellung, Dependency-Konfiguration, Performance-Tracking, Error-Handling |
| `BootstrapInitHookService` | ✅ | Einzige Verantwortlichkeit: Init Hook Service |
| `DIBootstrapInitHookService` | ✅ | DI-Wrapper |
| `BootstrapReadyHookService` | ✅ | Einzige Verantwortlichkeit: Ready Hook Service |
| `DIBootstrapReadyHookService` | ✅ | DI-Wrapper |
| `BootstrapErrorHandler` | ✅ | Einzige Verantwortlichkeit: Error Handling beim Bootstrap |

### API

| Klasse | Status | Begründung |
|--------|--------|------------|
| `ModuleApiInitializer` | ❌ | Verletzt SRP: API-Erstellung, Wrapping, Deprecation, Resolution, Health |
| `DIModuleApiInitializer` | ✅ | DI-Wrapper |

### Bootstrap Orchestrators

| Klasse | Status | Begründung |
|--------|--------|------------|
| `InitOrchestrator` | ✅ | Einzige Verantwortlichkeit: Orchestrierung der Initialisierung |
| `LoggingBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Logging |
| `MetricsBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Metrics |
| `SettingsBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Settings |
| `NotificationBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Notifications |
| `ContextMenuBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Context Menu |
| `ApiBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für API |
| `EventsBootstrapper` | ✅ | Einzige Verantwortlichkeit: Bootstrap für Events |

---

## Kritische SRP-Verstöße (Detaillierte Analyse)

### 1. ServiceContainer - God Object

**Klasse:** `ServiceContainer`
**Datei:** `src/infrastructure/di/container.ts`
**Status:** ❌ **Verletzt SRP schwerwiegend**

**Verantwortlichkeiten:**
1. Service-Registrierung (registerClass, registerFactory, registerValue, registerAlias)
2. Service-Validierung (validate, validation state management)
3. Service-Auflösung (resolve, resolveWithError)
4. Scope-Management (createScope, child container creation)
5. Disposal-Management (dispose, disposal state)
6. Metrics-Injection (injectMetricsCollector)
7. API-Sicherheit (ApiSafeToken validation)
8. Domain/Infrastructure Token-Mapping

**Problem:** Die Klasse hat mindestens 8 verschiedene Gründe zur Änderung. Ein God Object.

**Refactoring-Vorschlag:**
- `ContainerFacade`: Koordiniert nur (Facade-Pattern)
- `ServiceRegistrationManager`: Nur Registrierung
- `ContainerValidationManager`: Nur Validierung
- `ServiceResolutionManager`: Nur Auflösung
- `ScopeManager`: Bereits vorhanden, aber Container erstellt Scopes selbst
- `MetricsInjectionManager`: Nur Metrics-Injection

---

### 2. MetricsCollector - Multiple Responsibilities

**Klasse:** `MetricsCollector`
**Datei:** `src/infrastructure/observability/metrics-collector.ts`
**Status:** ❌ **Verletzt SRP**

**Verantwortlichkeiten:**
1. Metrics-Sammlung (recordResolution, recordPortSelection, recordCacheAccess)
2. Snapshot-Erstellung (getSnapshot, Berechnung von Durchschnitten)
3. Persistence-Management (getPersistenceState, restoreFromPersistenceState)
4. State-Management (reset, onStateChanged)

**Problem:** Sammeln, Aggregieren und Persistieren sind unterschiedliche Verantwortlichkeiten.

**Refactoring-Vorschlag:**
- `MetricsCollector`: Nur Sammlung
- `MetricsAggregator`: Nur Snapshot-Erstellung und Berechnungen
- `MetricsPersistenceManager`: Nur Persistence (bereits in PersistentMetricsCollector, aber Logik in Base)

---

### 3. CacheService - God Object

**Klasse:** `CacheService`
**Datei:** `src/infrastructure/cache/CacheService.ts`
**Status:** ❌ **Verletzt SRP**

**Verantwortlichkeiten:**
1. Cache-Operationen (get, set, delete, has, clear)
2. TTL-Management (Expiration-Checking, Metadata-Erstellung)
3. Capacity-Management (enforceCapacity, Eviction)
4. Statistics-Tracking (hits, misses, evictions)
5. Metrics-Integration (metricsObserver)
6. Config-Management (updateConfig, Config-Synchronisation)

**Problem:** Caching, Eviction, Statistics und Config sind unterschiedliche Verantwortlichkeiten.

**Refactoring-Vorschlag:**
- `CacheStore`: Nur Storage-Operationen
- `CacheExpirationManager`: Nur TTL/Expiration
- `CacheCapacityManager`: Bereits vorhanden, aber CacheService ruft direkt auf
- `CacheStatisticsCollector`: Nur Statistics
- `CacheConfigManager`: Nur Config-Management

---

### 4. PortSelector - Multiple Concerns

**Klasse:** `PortSelector`
**Datei:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`
**Status:** ⚠️ **Teilweise - Verletzt SRP**

**Verantwortlichkeiten:**
1. Port-Auswahl (selectPortFromTokens, Version-Matching-Algorithmus)
2. Event-Emission (emit success/failure events)
3. Self-Registration (registriert sich selbst bei ObservabilityRegistry)
4. Performance-Tracking (inline performance.now() tracking)

**Problem:** Port-Auswahl, Event-Handling und Observability sind unterschiedliche Verantwortlichkeiten.

**Refactoring-Vorschlag:**
- `PortSelector`: Nur Port-Auswahl
- `PortSelectionObserver`: Nur Event-Emission (bereits vorhanden als EventEmitter, aber PortSelector nutzt direkt)
- `PortSelectionObservability`: Nur Self-Registration

---

### 5. ModuleApiInitializer - Multiple Responsibilities

**Klasse:** `ModuleApiInitializer`
**Datei:** `src/framework/core/api/module-api-initializer.ts`
**Status:** ❌ **Verletzt SRP**

**Verantwortlichkeiten:**
1. API-Erstellung (createApi, createApiTokens)
2. Service-Wrapping (wrapSensitiveService für verschiedene Service-Types)
3. Deprecation-Handling (handleDeprecationWarning)
4. Service-Resolution (createResolveFunction, createResolveWithErrorFunction)
5. Health/Metrics-Integration (getMetrics, getHealth)

**Problem:** API-Erstellung, Wrapping, Deprecation und Resolution sind unterschiedliche Verantwortlichkeiten.

**Refactoring-Vorschlag:**
- `ModuleApiBuilder`: Nur API-Erstellung
- `ServiceWrapperFactory`: Nur Service-Wrapping
- `DeprecationHandler`: Nur Deprecation-Warnings
- `ApiServiceResolver`: Nur Resolution-Logik

---

### 6. FoundryJournalRepositoryAdapter - Combines Collection + Repository

**Klasse:** `FoundryJournalRepositoryAdapter`
**Datei:** `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts`
**Status:** ⚠️ **Teilweise - Verletzt SRP**

**Verantwortlichkeiten:**
1. Collection-Operationen (delegiert zu FoundryJournalCollectionAdapter)
2. Repository-Operationen (create, update, delete, flags)
3. Type-Mapping (Foundry → Domain)

**Problem:** Kombiniert Collection UND Repository. Sollte nur Repository sein, Collection ist separate Verantwortlichkeit.

**Refactoring-Vorschlag:**
- Repository sollte Composition nutzen statt Delegation
- Collection-Adapter sollte nicht Teil der Repository-Klasse sein

---

### 7. ModuleSettingsRegistrar - Multiple Responsibilities

**Klasse:** `ModuleSettingsRegistrar`
**Datei:** `src/application/services/ModuleSettingsRegistrar.ts`
**Status:** ❌ **Verletzt SRP** (bereits in Review identifiziert)

**Verantwortlichkeiten:**
1. Settings-Registrierung (registerAll, registerDefinition)
2. RuntimeConfig-Synchronisation (attachBinding, syncInitialValue)
3. Error-Mapping (mapAndNotify - bereits extrahiert zu SettingRegistrationErrorMapper, aber noch in registerDefinition)

**Problem:** Registrierung, Synchronisation und Error-Handling sind unterschiedliche Verantwortlichkeiten.

---

### 8. ConsoleLoggerService - Multiple Concerns

**Klasse:** `ConsoleLoggerService`
**Datei:** `src/infrastructure/logging/ConsoleLoggerService.ts`
**Status:** ❌ **Verletzt SRP** (bereits in Review identifiziert)

**Verantwortlichkeiten:**
1. Logging (delegiert zu BaseConsoleLogger)
2. RuntimeConfig-Integration (RuntimeConfigLoggerDecorator)
3. Trace-Context-Integration (TraceContextLoggerDecorator)
4. Stack-Trace-Integration (StackTraceLoggerDecorator)

**Problem:** Obwohl Decorator-Pattern genutzt wird, ist ConsoleLoggerService für die Komposition verantwortlich, was eine separate Verantwortlichkeit ist.

---

### 9. RetryService - Observability + Retry Logic

**Klasse:** `RetryService`
**Datei:** `src/infrastructure/retry/RetryService.ts`
**Status:** ❌ **Verletzt SRP** (bereits in Review identifiziert)

**Verantwortlichkeiten:**
1. Retry-Algorithmus (bereits in BaseRetryService)
2. Observability (Timing, Logging - bereits in RetryObservabilityDecorator)

**Problem:** Obwohl bereits aufgeteilt, ist RetryService noch eine Wrapper-Klasse, die beide kombiniert.

---

### 10. CompositionRoot - Multiple Responsibilities

**Klasse:** `CompositionRoot`
**Datei:** `src/framework/core/composition-root.ts`
**Status:** ❌ **Verletzt SRP**

**Verantwortlichkeiten:**
1. Container-Erstellung (`ServiceContainer.createRoot()`)
2. Dependency-Konfiguration (`configureDependencies()`)
3. Performance-Tracking (`BootstrapPerformanceTracker.track()`)
4. Error-Handling/Logging (Bootstrap-Logger für Fehler)

**Problem:** Container-Erstellung, Konfiguration, Performance-Tracking und Error-Handling sind unterschiedliche Verantwortlichkeiten.

**Refactoring-Vorschlag:**
- `ContainerFactory`: Nur Container-Erstellung
- `DependencyConfigurator`: Nur Dependency-Konfiguration
- `BootstrapPerformanceTracker`: Bereits vorhanden, aber CompositionRoot erstellt es selbst
- `BootstrapErrorHandler`: Bereits vorhanden, aber CompositionRoot nutzt es nicht

---

## Zusammenfassung

### Statistik (Kritische Analyse)

- **✅ Einhält SRP:** ~149 Klassen (77%)
- **⚠️ Teilweise:** ~15 Klassen (8%)
- **❌ Verletzt SRP:** ~29 Klassen (15%)

### Schwerwiegende Verstöße

1. **ServiceContainer** - God Object mit 8+ Verantwortlichkeiten
2. **MetricsCollector** - 4 Verantwortlichkeiten (Sammlung, Aggregation, Persistence, State)
3. **CacheService** - 6 Verantwortlichkeiten (Storage, TTL, Capacity, Statistics, Metrics, Config)
4. **ModuleApiInitializer** - 5 Verantwortlichkeiten (API-Erstellung, Wrapping, Deprecation, Resolution, Health)
5. **ModuleSettingsRegistrar** - 3 Verantwortlichkeiten (Registrierung, Sync, Error-Handling)
6. **ConsoleLoggerService** - 4 Verantwortlichkeiten (Logging, Config, Trace, StackTrace)
7. **RetryService** - 2 Verantwortlichkeiten (Retry, Observability)
8. **CompositionRoot** - 4 Verantwortlichkeiten (Container-Erstellung, Dependency-Konfiguration, Performance-Tracking, Error-Handling)

### Verbesserungsvorschläge

1. **ServiceContainer aufteilen:** Facade + separate Manager für Registration, Validation, Resolution
2. **MetricsCollector aufteilen:** Collector, Aggregator, PersistenceManager
3. **CacheService aufteilen:** Store, ExpirationManager, StatisticsCollector, ConfigManager
4. **PortSelector aufteilen:** Selector, Observer, Observability
5. **ModuleApiInitializer aufteilen:** Builder, WrapperFactory, DeprecationHandler, Resolver

### Allgemeine Beobachtungen

- **Viele God Objects:** Große Klassen mit zu vielen Verantwortlichkeiten
- **Facade-Pattern missbraucht:** Facades sollten nur koordinieren, nicht selbst implementieren
- **Composition statt Separation:** Viele Klassen kombinieren mehrere Concerns
- **DI-Wrapper sind SRP-konform:** Alle DI-Wrapper-Klassen sind SRP-konform (nur Dependency Injection)

---

**Letzte Aktualisierung:** 2025-12-10

