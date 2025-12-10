# Übersicht: Infrastructure Services

**Model:** Claude Sonnet 4.5
**Datum:** 2025-01-08
**Status:** Unreleased

---

## Einleitung

Dieses Dokument bietet eine vollständige Übersicht aller Services im `src/infrastructure/` Verzeichnis mit ihren Verantwortlichkeiten, Abhängigkeiten und Verwendungszwecken.

Die Infrastruktur-Schicht ist nach Clean Architecture für technische Implementierungsdetails zuständig und stellt die Verbindung zwischen Domain/Application Layer und dem Framework (Foundry VTT) her.

---

## Service-Kategorien

### 1. Dependency Injection (DI) System

#### ServiceContainer
**Datei:** `src/infrastructure/di/container.ts`
**Verantwortlichkeiten:**
- Zentrale Facade für das Dependency Injection System
- Koordiniert spezialisierte Komponenten (Registry, Validator, Cache, Resolver, ScopeManager)
- Verwaltet Container-Hierarchie (Root-Container, Child-Container, Scopes)
- Implementiert PlatformContainerPort für Domain-Layer-Integration
- Kaskadierende Disposal: Beim Disposal des Parent-Containers werden alle Child-Container automatisch disposed

**Abhängigkeiten:**
- ServiceRegistry (Registrierungen)
- ContainerValidator (Validierung)
- InstanceCache (Instanz-Caching)
- ServiceResolver (Service-Auflösung)
- ScopeManager (Lifecycle-Management)

**Design Pattern:** Facade Pattern

---

#### ServiceRegistry
**Datei:** `src/infrastructure/di/registry/ServiceRegistry.ts`
**Verantwortlichkeiten:**
- Verwaltet Service-Registrierungen (add, retrieve, check existence)
- Validiert Registrierungen (keine Duplikate, gültige Werte)
- Unterstützt Cloning für Child-Container
- Enforced Registration Limits (DoS-Schutz: max. 10.000 Registrierungen)
- Lifecycle-Index für schnelle Suche nach Lifecycle-Typen

**Verwaltet NICHT:**
- Service-Resolution (ServiceResolver)
- Dependency-Validierung (ContainerValidator)

**Design Pattern:** Registry Pattern

---

#### ServiceResolver
**Datei:** `src/infrastructure/di/resolution/ServiceResolver.ts`
**Verantwortlichkeiten:**
- Löst Service-Instanzen basierend auf Lifecycle und Registrierung auf
- Behandelt Alias-Auflösung (rekursiv)
- Delegiert Lifecycle-spezifische Auflösung an LifecycleResolver
- Delegiert Service-Instanziierung an ServiceInstantiator
- Performance-Tracking für Resolution-Zeiten
- Metrics-Recording für Container-Statistiken

**Abhängigkeiten:**
- ServiceRegistry
- InstanceCache
- ParentResolver (für Singleton-Sharing)
- PerformanceTracker
- MetricsCollector (nach Container-Validierung injiziert)

**Design Pattern:** Strategy Pattern (LifecycleResolver, ServiceInstantiator)

---

#### ScopeManager
**Datei:** `src/infrastructure/di/scope/ScopeManager.ts`
**Verantwortlichkeiten:**
- Verwaltet Scope-Hierarchie und Disposal-Lifecycle
- Verfolgt Child-Scopes in Hierarchie
- Generiert eindeutige Scope-Namen (UUID-basiert)
- Disposed Instanzen (unterstützt Disposable und AsyncDisposable)
- Kaskadierende Disposal zu Children
- Enforced Maximum Scope Depth (Stack-Overflow-Schutz: max. 10 Ebenen)

**Disposal-Modi:**
- `dispose()`: Synchron (für Browser-Unload, Notfall-Cleanup)
- `disposeAsync()`: Asynchron (bevorzugt, behandelt async Cleanup korrekt)

**Design Pattern:** Composite Pattern (Scope-Hierarchie)

---

#### InstanceCache
**Datei:** `src/infrastructure/di/cache/InstanceCache.ts`
**Verantwortlichkeiten:**
- Cached Service-Instanzen basierend auf Lifecycle
- Singleton-Instanzen werden einmalig erstellt und wiederverwendet
- Scoped-Instanzen werden pro Scope gecacht
- Transient-Instanzen werden nicht gecacht
- Unterstützt Disposal von gecachten Instanzen

---

#### ContainerValidator
**Datei:** `src/infrastructure/di/validation/ContainerValidator.ts`
**Verantwortlichkeiten:**
- Validiert Container-Konfiguration vor Verwendung
- Prüft auf zirkuläre Abhängigkeiten
- Validiert Dependency-Chains
- Prüft auf fehlende Registrierungen
- Enforced Validation-Reihenfolge (nur nach Registrierungen, vor Resolution)

---

### 2. Logging

#### ConsoleLoggerService
**Datei:** `src/infrastructure/logging/ConsoleLoggerService.ts`
**Verantwortlichkeiten:**
- Console-basierter Logger mit Modul-Präfix
- Log-Level-Filtering (DEBUG, INFO, WARN, ERROR)
- Automatische Trace-ID-Integration via TraceContext
- Runtime-Config-Integration für dynamische Log-Level-Änderungen
- Unterstützt `withTraceId()` für explizite Trace-ID-Weitergabe (Decorator Pattern)

**Abhängigkeiten:**
- RuntimeConfigService (Log-Level-Konfiguration)
- TraceContext (optional, für automatische Trace-ID-Propagation)

**Design Pattern:** Decorator Pattern (TracedLogger)

---

#### BootstrapLogger
**Datei:** `src/infrastructure/logging/BootstrapLogger.ts`
**Verantwortlichkeiten:**
- Logger für Bootstrap-Phase (vor DI-Container-Initialisierung)
- Minimaler Logger ohne Dependencies
- Wird durch ConsoleLoggerService ersetzt, sobald Container verfügbar ist

---

### 3. Observability & Metrics

#### MetricsCollector
**Datei:** `src/infrastructure/observability/metrics-collector.ts`
**Verantwortlichkeiten:**
- Sammelt Performance-Metriken für Observability
- Container-Service-Resolution-Zeiten
- Port-Selection-Statistiken
- Cache Hit/Miss-Raten
- Implementiert MetricsRecorder-Interface (Interface Segregation Principle)
- Metrics werden nur gesammelt, wenn `enablePerformanceTracking` aktiviert ist

**Metriken:**
- Container-Resolutions (Anzahl, Durchschnittszeit, Fehler)
- Port-Selections (nach Foundry-Version)
- Cache-Statistiken (Hits, Misses, Hit-Rate)

**Design Pattern:** Interface Segregation (MetricsRecorder, MetricsSampler)

---

#### MetricsSampler
**Datei:** `src/infrastructure/observability/metrics-sampler.ts`
**Verantwortlichkeiten:**
- Entscheidet, ob Metriken gesampelt werden sollen
- Sampling-basierte Performance-Optimierung
- Konfigurierbare Sampling-Rate via Runtime-Config

**Abhängigkeiten:**
- RuntimeConfigService

---

#### ObservabilityRegistry
**Datei:** `src/infrastructure/observability/observability-registry.ts`
**Verantwortlichkeiten:**
- Zentrale Registry für selbst-registrierende Observable Services
- Routet Events zu passenden Observers basierend auf Event-Typ
- Self-Registration-Pattern: Services registrieren sich selbst via Constructor-Injection
- Automatisches Logging und Metrics-Recording für Port-Selection-Events

**Abhängigkeiten:**
- Logger
- MetricsRecorder

**Design Pattern:** Observer Pattern, Registry Pattern

---

#### TraceContext
**Datei:** `src/infrastructure/observability/trace/TraceContext.ts`
**Verantwortlichkeiten:**
- Automatische Trace-ID-Propagation über verschachtelte Funktionsaufrufe
- Eliminiert manuelle Trace-ID-Weitergabe als Parameter
- Unterstützt sync und async Operations
- Context-Stacking für verschachtelte Traces
- Korrekte Cleanup via try/finally

**Features:**
- Automatische Trace-ID-Generierung
- Custom Trace-IDs
- Nested Traces (verschiedene IDs)
- Metadata-Support

**Design Pattern:** Context Pattern

---

#### PerformanceTrackingService
**Datei:** `src/infrastructure/performance/PerformanceTrackingService.ts`
**Verantwortlichkeiten:**
- Performance-Tracking mit Sampling-Support
- Zentralisierte Performance-Messung mit konfigurierbaren Sampling-Rates
- Erweitert PerformanceTrackerImpl für polymorphic Usage
- Unterstützt sync und async Operations

**Abhängigkeiten:**
- RuntimeConfigService
- MetricsSampler

**Design Pattern:** Template Method Pattern

---

#### BootstrapPerformanceTracker
**Datei:** `src/infrastructure/observability/bootstrap-performance-tracker.ts`
**Verantwortlichkeiten:**
- Performance-Tracker für Bootstrap-Phase (vor DI-Container)
- Minimaler Tracker ohne Dependencies
- Wird durch PerformanceTrackingService ersetzt, sobald Container verfügbar ist

---

### 4. Caching

#### CacheService
**Datei:** `src/infrastructure/cache/CacheService.ts`
**Verantwortlichkeiten:**
- In-Memory-Cache mit TTL (Time-To-Live)
- Get/Set-Operationen mit optionalen TTLs
- `getOrSet()` für atomare Cache-Or-Compute-Operationen
- Cache-Statistiken (Hits, Misses, Evictions)
- LRU-Eviction-Strategy bei Kapazitätsüberschreitung
- Metrics-Integration für Cache-Observability
- Konfigurierbar via Runtime-Config (enabled, defaultTtlMs, maxEntries)

**Abhängigkeiten:**
- CacheServiceConfig
- MetricsCollector (optional)
- CacheCapacityManager
- CacheMetricsObserver

**Design Pattern:** Strategy Pattern (Eviction-Strategies)

---

#### CacheCapacityManager
**Datei:** `src/infrastructure/cache/cache-capacity-manager.ts`
**Verantwortlichkeiten:**
- Verwaltet Cache-Kapazität
- Entscheidet über Eviction bei Kapazitätsüberschreitung
- Delegiert an Eviction-Strategy (z.B. LRU)

---

#### LRUEvictionStrategy
**Datei:** `src/infrastructure/cache/lru-eviction-strategy.ts`
**Verantwortlichkeiten:**
- Least-Recently-Used Eviction-Strategy
- Entfernt am wenigsten genutzte Einträge bei Kapazitätsüberschreitung

**Design Pattern:** Strategy Pattern

---

#### CacheConfigSync
**Datei:** `src/infrastructure/cache/CacheConfigSync.ts`
**Verantwortlichkeiten:**
- Synchronisiert Cache-Konfiguration mit Runtime-Config
- Reagiert auf Konfigurationsänderungen (z.B. Cache deaktivieren)
- Automatische Cache-Invalidierung bei Konfigurationsänderungen

**Abhängigkeiten:**
- RuntimeConfigService
- CacheService

---

### 5. Retry & Resilience

#### RetryService
**Datei:** `src/infrastructure/retry/RetryService.ts`
**Verantwortlichkeiten:**
- Behandelt transiente Fehler mit automatischer Retry-Logik
- Exponential Backoff mit konfigurierbarem Faktor
- Type-safe Error-Mapping via `mapException`-Callback
- Optionales Logging für Retry-Versuche
- Unterstützt Result-Pattern (keine Exceptions)

**Features:**
- Konfigurierbare Max-Attempts
- Base-Delay mit Exponential Backoff
- Operation-Name für Logging
- Type-safe Error-Handling

**Abhängigkeiten:**
- Logger (optional, für Retry-Logging)

**Design Pattern:** Retry Pattern

---

### 6. Internationalisierung (i18n)

#### I18nFacadeService
**Datei:** `src/infrastructure/i18n/I18nFacadeService.ts`
**Verantwortlichkeiten:**
- Facade-Service, der Foundry's i18n und lokale Fallback-Übersetzungen kombiniert
- Chain-of-Responsibility-Pattern via DI
- Übersetzungs-Kette: FoundryTranslationHandler → LocalTranslationHandler → FallbackTranslationHandler
- Graceful Degradation bei fehlenden Übersetzungen

**Abhängigkeiten:**
- TranslationHandlerChain (Handler-Kette)
- LocalI18nService

**Design Pattern:** Facade Pattern, Chain of Responsibility Pattern

---

#### LocalI18nService
**Datei:** `src/infrastructure/i18n/LocalI18nService.ts`
**Verantwortlichkeiten:**
- JSON-basierte lokale Übersetzungen
- Fallback für Development/Testing ohne Foundry-Runtime
- Lädt Übersetzungen aus `lang/` Verzeichnis

**Abhängigkeiten:**
- EnvironmentConfig (für Modul-Pfad)

---

#### TranslationHandlerChain
**Datei:** `src/infrastructure/i18n/TranslationHandlerChain.ts`
**Verantwortlichkeiten:**
- Verwaltet Chain-of-Responsibility für Übersetzungen
- Delegiert an Handler in Reihenfolge: Foundry → Local → Fallback
- Jeder Handler versucht Übersetzung, delegiert bei Misserfolg an nächsten

**Design Pattern:** Chain of Responsibility Pattern

---

#### FoundryTranslationHandler
**Datei:** `src/infrastructure/i18n/FoundryTranslationHandler.ts`
**Verantwortlichkeiten:**
- Versucht Übersetzung via Foundry's `game.i18n.localize()`
- Delegiert an nächsten Handler bei Misserfolg

---

#### LocalTranslationHandler
**Datei:** `src/infrastructure/i18n/LocalTranslationHandler.ts`
**Verantwortlichkeiten:**
- Versucht Übersetzung via LocalI18nService
- Delegiert an nächsten Handler bei Misserfolg

---

#### FallbackTranslationHandler
**Datei:** `src/infrastructure/i18n/FallbackTranslationHandler.ts`
**Verantwortlichkeiten:**
- Chain-Terminator ohne Dependencies
- Gibt Fallback-String oder Key selbst zurück

---

### 7. Notifications

#### NotificationCenter (Application Layer)
**Datei:** `src/application/services/NotificationCenter.ts`
**Verantwortlichkeiten:**
- Zentrale Notification-Verwaltung
- Channel-basierte Notification-Routing
- Unterstützt mehrere Channels (ConsoleChannel, UIChannel)
- Filtert Notifications basierend auf Channel-Capabilities

**Design Pattern:** Strategy Pattern (Channels), Observer Pattern

---

#### UIChannel
**Datei:** `src/infrastructure/notifications/channels/UIChannel.ts`
**Verantwortlichkeiten:**
- Routet Notifications zu Platform UI
- Filtert Debug-Messages (nicht relevant für End-User)
- Sanitized Messages in Production-Mode
- Mapped Notification-Levels zu UI-Notification-Types
- Platform-agnostisch via PlatformUINotificationPort

**Abhängigkeiten:**
- PlatformUINotificationPort
- RuntimeConfigService

**Design Pattern:** Adapter Pattern

---

#### ConsoleChannel
**Datei:** `src/infrastructure/notifications/channels/ConsoleChannel.ts`
**Verantwortlichkeiten:**
- Routet Notifications zu Console
- Alle Notification-Levels werden unterstützt
- Platform-agnostisch via Logger

**Abhängigkeiten:**
- Logger

**Design Pattern:** Adapter Pattern

---

#### NotificationPortAdapter
**Datei:** `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts`
**Verantwortlichkeiten:**
- Adapter, der PlatformNotificationPort implementiert
- Wrapped NotificationCenter
- Übersetzt platform-agnostische Options zu NotificationCenter-Options

**Abhängigkeiten:**
- NotificationCenter

**Design Pattern:** Adapter Pattern

---

### 8. Health Checks

#### HealthCheckRegistryAdapter
**Datei:** `src/infrastructure/health/health-check-registry-adapter.ts`
**Verantwortlichkeiten:**
- Infrastructure-Adapter, der HealthCheckRegistry als PlatformHealthCheckPort wrapped
- Bridge zwischen Infrastructure und Domain Layer
- Delegiert alle Operationen an HealthCheckRegistry

**Abhängigkeiten:**
- HealthCheckRegistry (Application Layer)

**Design Pattern:** Adapter Pattern

---

### 9. Configuration

#### RuntimeConfigAdapter
**Datei:** `src/infrastructure/config/runtime-config-adapter.ts`
**Verantwortlichkeiten:**
- Infrastructure-Adapter, der RuntimeConfigService als PlatformRuntimeConfigPort wrapped
- Bridge zwischen Infrastructure und Domain Layer
- Delegiert alle Operationen an RuntimeConfigService

**Abhängigkeiten:**
- EnvironmentConfig
- RuntimeConfigService (Application Layer)

**Design Pattern:** Adapter Pattern

---

### 10. Foundry Adapter Services

#### PortSelector
**Datei:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`
**Verantwortlichkeiten:**
- Wählt passende Port-Implementation basierend auf Foundry-Version
- Version-agnostische Port-Auswahl
- Foundry v13 → v13 Ports
- Foundry v14 → v14 Ports (falls verfügbar), sonst Fallback zu v13
- Lazy Port-Resolution: Nur ausgewählter Port wird aus Container resolved
- Emittiert Events für Observability (Port-Selection-Success/Failure)
- Self-Registration mit ObservabilityRegistry

**Abhängigkeiten:**
- FoundryVersionDetector
- PortSelectionEventEmitter
- ObservabilityRegistry
- ServiceContainer

**Design Pattern:** Strategy Pattern (Port-Resolution), Observer Pattern

---

#### FoundryVersionDetector
**Datei:** `src/infrastructure/adapters/foundry/versioning/foundry-version-detector.ts`
**Verantwortlichkeiten:**
- Erkennt aktuelle Foundry-Version
- Cached Version-Erkennung für Performance
- Unterstützt Version-Override für Testing

---

#### PortSelectionEventEmitter
**Datei:** `src/infrastructure/adapters/foundry/versioning/port-selection-events.ts`
**Verantwortlichkeiten:**
- Event-Emitter für Port-Selection-Events
- TRANSIENT Service (neue Instanz pro Resolution)
- Unterstützt Subscriptions/Unsubscriptions

**Design Pattern:** Observer Pattern

---

#### FoundryServiceBase
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts`
**Verantwortlichkeiten:**
- Basis-Klasse für alle Foundry-Services
- Gemeinsamer Lazy-Port-Mechanismus
- Eliminiert Code-Duplikation (~120 Zeilen)
- Retry-Logik für transiente Fehler
- Error-Handling und Metrics-Integration

**Abhängigkeiten:**
- PortSelector
- RetryService
- MetricsCollector (optional)

**Design Pattern:** Template Method Pattern

---

#### FoundryGameService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryGameService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's `game` API
- Zugriff auf Journal-Entries, Collections, etc.
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- GamePortRegistry
- RetryService

---

#### FoundryHooksService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryHooksService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's Hook-System
- Registriert und verwaltet Hooks
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- HooksPortRegistry
- RetryService
- Logger

---

#### FoundryDocumentService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryDocumentService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's Document-API
- Zugriff auf Document-Flags, Collections, etc.
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- DocumentPortRegistry
- RetryService

---

#### FoundryUIService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryUIService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's UI-API
- Zugriff auf Notifications, Dialogs, etc.
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- UIPortRegistry
- RetryService

---

#### FoundrySettingsService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundrySettingsService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's Settings-API
- Zugriff auf Modul-Settings
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- SettingsPortRegistry
- RetryService

---

#### FoundryI18nService
**Datei:** `src/infrastructure/adapters/foundry/services/FoundryI18nService.ts`
**Verantwortlichkeiten:**
- Adapter für Foundry's i18n-API
- Zugriff auf `game.i18n.localize()`
- Erweitert FoundryServiceBase

**Abhängigkeiten:**
- PortSelector
- I18nPortRegistry
- RetryService

---

### 11. Foundry Facades

#### FoundryJournalFacade
**Datei:** `src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts`
**Verantwortlichkeiten:**
- Facade, die FoundryGame, FoundryDocument und FoundryUI kombiniert
- Vereinfachte API für Journal-Operationen
- Kapselt Komplexität der Foundry-API

**Abhängigkeiten:**
- FoundryGameService
- FoundryDocumentService
- FoundryUIService

**Design Pattern:** Facade Pattern

---

### 12. Foundry Collection & Repository Adapters

#### FoundryJournalCollectionAdapter
**Datei:** `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts`
**Verantwortlichkeiten:**
- Read-Only Adapter für Journal-Collection
- Implementiert JournalCollectionPort
- Zugriff auf Journal-Entries ohne Modifikation

**Abhängigkeiten:**
- FoundryGameService

**Design Pattern:** Adapter Pattern

---

#### FoundryJournalRepositoryAdapter
**Datei:** `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts`
**Verantwortlichkeiten:**
- CRUD-Adapter für Journal-Repository
- Implementiert JournalRepository
- Vollständige CRUD-Operationen für Journal-Entries

**Abhängigkeiten:**
- FoundryGameService
- FoundryDocumentService

**Design Pattern:** Adapter Pattern

---

### 13. Cache Adapter

#### PlatformCachePortAdapter
**Datei:** `src/infrastructure/adapters/cache/platform-cache-port-adapter.ts`
**Verantwortlichkeiten:**
- Adapter, der CacheService als PlatformCachePort wrapped
- Bridge zwischen Infrastructure und Domain Layer
- Delegiert alle Operationen an CacheService

**Abhängigkeiten:**
- CacheService

**Design Pattern:** Adapter Pattern

---

### 14. i18n Adapter

#### PlatformI18nPortAdapter
**Datei:** `src/infrastructure/adapters/i18n/platform-i18n-port-adapter.ts`
**Verantwortlichkeiten:**
- Adapter, der I18nFacadeService als PlatformI18nPort wrapped
- Bridge zwischen Infrastructure und Domain Layer
- Delegiert alle Operationen an I18nFacadeService

**Abhängigkeiten:**
- I18nFacadeService

**Design Pattern:** Adapter Pattern

---

## Service-Abhängigkeits-Übersicht

### Level 0: Configuration
- EnvironmentConfig
- MODULE_CONSTANTS

### Level 1: Core Infrastructure
- MetricsCollector → [RuntimeConfig]
- ConsoleLoggerService → [RuntimeConfig, TraceContext?]
- TraceContext → []
- ObservabilityRegistry → [Logger, MetricsRecorder]

### Level 2: DI Infrastructure
- ServiceRegistry → []
- InstanceCache → []
- ContainerValidator → [ServiceRegistry]
- ServiceResolver → [ServiceRegistry, InstanceCache, PerformanceTracker]
- ScopeManager → [InstanceCache]
- ServiceContainer → [Alle DI-Komponenten]

### Level 3: Utility Services
- RetryService → [Logger]
- PerformanceTrackingService → [RuntimeConfig, MetricsSampler]
- CacheService → [CacheConfig, MetricsCollector?]

### Level 4: Foundry Infrastructure
- PortSelector → [FoundryVersionDetector, PortSelectionEventEmitter, ObservabilityRegistry, ServiceContainer]
- FoundryVersionDetector → []
- PortSelectionEventEmitter → []

### Level 5: Foundry Services
- FoundryGameService → [PortSelector, GamePortRegistry, RetryService]
- FoundryHooksService → [PortSelector, HooksPortRegistry, RetryService, Logger]
- FoundryDocumentService → [PortSelector, DocumentPortRegistry, RetryService]
- FoundryUIService → [PortSelector, UIPortRegistry, RetryService]
- FoundrySettingsService → [PortSelector, SettingsPortRegistry, RetryService]
- FoundryI18nService → [PortSelector, I18nPortRegistry, RetryService]

### Level 6: Facades
- FoundryJournalFacade → [FoundryGame, FoundryDocument, FoundryUI]
- I18nFacadeService → [TranslationHandlerChain, LocalI18nService]

### Level 7: Adapters
- PlatformCachePortAdapter → [CacheService]
- PlatformI18nPortAdapter → [I18nFacadeService]
- PlatformNotificationPortAdapter → [NotificationCenter]
- RuntimeConfigAdapter → [RuntimeConfigService]
- HealthCheckRegistryAdapter → [HealthCheckRegistry]

---

## Design Patterns im Überblick

| Pattern | Services | Zweck |
|---------|----------|-------|
| **Facade** | ServiceContainer, FoundryJournalFacade, I18nFacadeService | API-Vereinfachung |
| **Adapter** | Alle `*Adapter` Services | Platform-Integration |
| **Strategy** | LifecycleResolver, EvictionStrategy, PortResolutionStrategy | Algorithmus-Auswahl |
| **Observer** | ObservabilityRegistry, PortSelectionEventEmitter | Event-basierte Kommunikation |
| **Chain of Responsibility** | TranslationHandlerChain | i18n Fallback-Kette |
| **Registry** | ServiceRegistry, ObservabilityRegistry | Service-Registrierung |
| **Template Method** | FoundryServiceBase, PerformanceTrackerImpl | Gemeinsame Basis-Logik |
| **Decorator** | TracedLogger | Logging-Erweiterung |
| **Retry** | RetryService | Resilience-Pattern |
| **Context** | TraceContext | Trace-ID-Propagation |

---

## Wichtige Hinweise

### Service-Lifecycle
- **SINGLETON**: Eine Instanz für gesamte Anwendung (z.B. ServiceContainer, Logger)
- **SCOPED**: Eine Instanz pro Scope (z.B. Request-Scope)
- **TRANSIENT**: Neue Instanz bei jeder Resolution (z.B. PortSelectionEventEmitter)

### Bootstrap-Phase
- BootstrapLogger und BootstrapPerformanceTracker werden vor DI-Container verwendet
- Werden durch vollwertige Services ersetzt, sobald Container verfügbar ist

### Error-Handling
- Alle Services verwenden Result-Pattern (keine Exceptions)
- Type-safe Error-Mapping via Callbacks
- Graceful Degradation bei Fehlern

### Observability
- Automatische Metrics-Collection (wenn aktiviert)
- Trace-ID-Propagation für Request-Correlation
- Performance-Tracking mit Sampling

---

## Weiterführende Dokumentation

- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Schnelle Service-Referenz
- [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) - Detaillierte Dependency-Visualisierung
- [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) - Vollständige Projektanalyse
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architektur-Übersicht

---

**Ende Dokument**




