# Dependency Map - FVTT Relationship App Module

**Erstellungsdatum:** 2025-11-09  
**Aktualisiert:** 2025-11-09 (v0.10.0)  
**Zweck:** Detaillierte Abhängigkeits-Visualisierung für Refactoring  
**Model:** Claude Sonnet 4.5  
**Projekt-Status:** Version 0.10.0 (Pre-Release)  
**Breaking Changes:** ✅ Erlaubt - Aggressives Refactoring erwünscht!  
**Legacy-Codes:** ❌ Sofort eliminieren  
**Versioning:** Siehe [VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md)

---

## 📊 Dependency Layers

Das Projekt ist in **5 Architektur-Schichten** strukturiert:

```
Layer 0: Configuration & Constants
    ↓
Layer 1: Utilities (No Dependencies)
    ↓
Layer 2: Infrastructure (ENV, Metrics, Logger)
    ↓
Layer 3: Foundry Adapters (Ports, Services)
    ↓
Layer 4: Business Services & Facades
```

---

## Layer 0: Configuration & Constants

### EnvironmentConfig (ENV)
**Datei:** `src/config/environment.ts`  
**Dependencies:** Keine  
**Exports:**
- `ENV` - Singleton Environment Configuration
- `LogLevel` - Enum
- `EnvironmentConfig` - Interface

**Consumed By:**
- MetricsCollector
- ConsoleLoggerService ⭐ UPDATED (Self-Configuring)
- LocalI18nService
- PerformanceTrackingService
- ErrorSanitizer
- Fallback Logger Factory (in dependencyconfig.ts)

---

### MODULE_CONSTANTS
**Datei:** `src/constants.ts`  
**Dependencies:** Keine  
**Exports:**
- `MODULE_CONSTANTS` - Zentrale Konstanten (Module ID, Log Prefix, Flags, etc.)

**Consumed By:**
- ConsoleLoggerService (LOG_PREFIX)
- JournalVisibilityService (FLAGS.HIDDEN, DEFAULTS.UNKNOWN_NAME)
- MetricsCollector (METRICS_CONFIG)
- CompositionRoot (MODULE.ID, API.VERSION)

---

## Layer 1: Utilities (Zero Dependencies)

### Result Utilities
**Datei:** `src/utils/functional/result.ts`  
**Dependencies:** Keine  
**Exports:** 
- `ok()`, `err()`, `isOk()`, `isErr()`
- `map()`, `mapError()`, `andThen()`
- `unwrapOr()`, `unwrapOrElse()`, `getOrThrow()`
- `tryCatch()`, `all()`, `match()`, `lift()`
- Async: `asyncMap()`, `asyncAndThen()`, `fromPromise()`, `asyncAll()`

**Consumed By:** **ALLE** Services (ubiquitous)

---

### Promise Timeout Utilities
**Datei:** `src/utils/async/promise-timeout.ts`  
**Dependencies:** Keine  
**Exports:**
- `withTimeout(promise, timeoutMs)` - Promise mit Timeout
- `TimeoutError` - Custom Error

**Consumed By:**
- ServiceContainer (Resolution Timeout Protection)

---

### Event Utilities (Throttle, Debounce)
**Datei:** `src/utils/events/throttle.ts`  
**Dependencies:** Keine  
**Exports:**
- `throttle(fn, windowMs)` - Rate Limiting
- `debounce(fn, delayMs)` - Debouncing mit Cancel-Support

**Consumed By:**
- (Potentiell Hook-Handler, noch nicht genutzt)

---

### Trace Utilities
**Datei:** `src/utils/observability/trace.ts`  
**Dependencies:** Keine  
**Exports:**
- `generateTraceId()` - Format: `{timestamp}-{random}`
- `getTraceTimestamp(traceId)` - Timestamp-Extraktion

**Consumed By:**
- ConsoleLoggerService (`withTraceId()`)

---

### Error Sanitizer
**Datei:** `src/utils/security/error-sanitizer.ts`  
**Dependencies:** `EnvironmentConfig`  
**Exports:**
- `sanitizeErrorForProduction(env, error)`
- `sanitizeMessageForProduction(env, message)`

**Consumed By:**
- (Potentiell Error-Handler, noch nicht genutzt)

---

## Layer 2: Infrastructure

### MetricsCollector
**Datei:** `src/observability/metrics-collector.ts`  
**Token:** `metricsCollectorToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  environmentConfigToken  // EnvironmentConfig
]
```

**Implements:**
- `MetricsRecorder` (Interface Segregation)
- `MetricsSampler` (Interface Segregation)

**Methods:**
- `recordResolution(token, durationMs, success)`
- `recordPortSelection(version)`
- `recordPortSelectionFailure(version)`
- `recordCacheAccess(hit)`
- `shouldSample()` - Sampling-Logic
- `getSnapshot()` - Metrics Export
- `logSummary()` - Console-Output
- `reset()` - Clear Metrics

**Consumed By:**
- `ModuleHealthService` → `metricsCollectorToken`
- `PerformanceTrackingService` → `metricsSamplerToken` (alias)
- `RetryService` → `metricsCollectorToken`
- `PortSelectionObserver` → `metricsRecorderToken` (alias)
- `ServiceResolver` → `metricsCollectorToken` (internal)

---

### ConsoleLoggerService ⭐ UPDATED v0.8.0
**Datei:** `src/services/consolelogger.ts`  
**Token:** `loggerToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[environmentConfigToken]  // ⭐ NEW: Self-Configuring via EnvironmentConfig
```

**Self-Configuring:** Logger setzt `minLevel` aus `env.logLevel` beim Instantiieren

**Implements:**
- `Logger` Interface

**Methods:**
- `log(message, ...params)`
- `error(message, ...params)`
- `warn(message, ...params)`
- `info(message, ...params)`
- `debug(message, ...params)`
- `setMinLevel(level)` - Log-Level Filtering
- `withTraceId(traceId)` - Returns TracedLogger (Decorator Pattern)

**Consumed By:**
- `FoundryHooksService` → `loggerToken`
- `JournalVisibilityService` → `loggerToken`
- `RetryService` → `loggerToken`
- `PortSelectionObserver` → `loggerToken`
- `CompositionRoot` → `loggerToken` (Bootstrap-Logging)

**Fallback:** Registered als Fallback Factory (kritischer Service)

---

### ModuleHealthService
**Datei:** `src/core/module-health-service.ts`  
**Token:** `moduleHealthServiceToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  // Special: Container Self-Reference (via Factory)
  // Direct constructor: (container, metricsCollector)
  metricsCollectorToken  // MetricsCollector
]
```

**Methods:**
- `getHealth()` - Returns `HealthStatus`
  - Container Validation Status
  - Port Selection Status
  - Last Error
  - Timestamp

**Consumed By:**
- `CompositionRoot` → `moduleHealthServiceToken` (Public API: `api.getHealth()`)

**Special:** Container Self-Reference (registered via Factory, nicht via `registerClass`)

---

### PerformanceTrackerImpl (Base Class)
**Datei:** `src/observability/performance-tracker-impl.ts`  
**Token:** Keine (Base Class, nicht registriert)

**Dependencies:**
```typescript
// Constructor
[
  EnvironmentConfig,
  MetricsSampler
]
```

**Methods:**
- `track(fn, onComplete)` - Sync Tracking
- `trackAsync(fn, onComplete)` - Async Tracking

**Consumed By:**
- `PerformanceTrackingService` (extends)
- `BootstrapPerformanceTracker` (extends)

---

### BootstrapPerformanceTracker
**Datei:** `src/observability/bootstrap-performance-tracker.ts`  
**Token:** Keine (Bootstrap-Phase, kein DI)

**Dependencies:**
```typescript
// Constructor (Direct, no DI)
[
  EnvironmentConfig,       // Direct ENV import
  MetricsSampler | null    // Optional (nicht verfügbar in Bootstrap)
]
```

**Extends:** `PerformanceTrackerImpl`

**Consumed By:**
- `CompositionRoot` (`bootstrap()` Method)

---

## Layer 3: Foundry Adapters

### Port Selection Infrastructure

#### PortSelector ⭐ UPDATED v0.8.0
**Datei:** `src/foundry/versioning/portselector.ts`  
**Token:** `portSelectorToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectionEventEmitterToken,   // ⭐ NEW: Event Emitter (TRANSIENT)
  observabilityRegistryToken         // ⭐ NEW: Self-Registration für Observability
]
```

**Methods:**
- `selectPortFromFactories(factories, foundryVersion?, adapterName?)`
- `onEvent(callback)` - Event Subscription (via EventEmitter)

**Features:**
- Factory-basierte Port-Instantiation (lazy, verhindert Crashes)
- Fallback-Strategie (v14 → v13)
- Event-Emission (success/failure)
- **Self-Registration:** Registriert sich automatisch bei ObservabilityRegistry im Constructor ⭐ NEW

**Consumed By:**
- `FoundryGameService` → `portSelectorToken`
- `FoundryHooksService` → `portSelectorToken`
- `FoundryDocumentService` → `portSelectorToken`
- `FoundryUIService` → `portSelectorToken`
- `FoundrySettingsService` → `portSelectorToken`
- `FoundryI18nService` → `portSelectorToken`

---

#### PortRegistry<T>
**Datei:** `src/foundry/versioning/portregistry.ts`  
**Token:** 
- `foundryGamePortRegistryToken` (PortRegistry<FoundryGame>)
- `foundryHooksPortRegistryToken` (PortRegistry<FoundryHooks>)
- `foundryDocumentPortRegistryToken` (PortRegistry<FoundryDocument>)
- `foundryUIPortRegistryToken` (PortRegistry<FoundryUI>)
- `foundrySettingsPortRegistryToken` (PortRegistry<FoundrySettings>)
- `foundryI18nPortRegistryToken` (PortRegistry<FoundryI18n>)

**Lifecycle:** VALUE (pre-instantiated)

**Dependencies:** Keine

**Methods:**
- `register(version, factory)` - Port Factory Registrierung
- `getFactories()` - Alle Factories
- `getFactory(version)` - Specific Factory

**Consumed By:**
- Alle Foundry Services (je nach Service-Typ)

---

#### ObservabilityRegistry ⭐ NEW v0.8.0 (ersetzt PortSelectionObserver)
**Datei:** `src/observability/observability-registry.ts`  
**Token:** `observabilityRegistryToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  loggerToken,            // Logger
  metricsRecorderToken    // MetricsRecorder (alias zu MetricsCollector)
]
```

**Methods:**
- `registerPortSelector(service)` - Registriert PortSelector für Observability
- (Future: `registerXxx()` für weitere Observable Services)

**Consumed By:**
- `PortSelector` (Self-Registration im Constructor)

**Purpose:** 
- Zentraler Hub für Self-Registration Pattern
- Routet Events zu Logger & Metrics
- Decoupling von Event-Emission und Observability

**Design Pattern:** Observer Pattern, Registry Pattern

**Siehe:** [ADR-0006 Update](./adr/0006-observability-strategy.md#update-2025-11-09-self-registration-pattern--observabilityregistry)

---

#### PortSelectionEventEmitter ⭐ NEW v0.8.0
**Datei:** `src/foundry/versioning/port-selection-events.ts`  
**Token:** `portSelectionEventEmitterToken`  
**Lifecycle:** TRANSIENT (neue Instanz pro Resolution)

**Dependencies:**
```typescript
[]  // Keine Dependencies
```

**Methods:**
- `onEvent(callback)` - Event-Listener registrieren (returns unsubscribe function)
- `emit(event)` - Event emittieren

**Consumed By:**
- `PortSelector` (Constructor Dependency)

**Purpose:** Type-Safe Event-Emitter für PortSelector-Events

---

### Foundry Service Wrappers

#### FoundryGameService
**Datei:** `src/foundry/services/FoundryGameService.ts`  
**Token:** `foundryGameToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundryGamePortRegistryToken       // PortRegistry<FoundryGame>
]
```

**Implements:** `FoundryGame`, `Disposable`

**Methods:**
- `getJournalEntries()` → Result<FoundryJournalEntry[], FoundryError>
- `getJournalEntryById(id)` → Result<FoundryJournalEntry | null, FoundryError>
- `dispose()` - Cleanup

**Consumed By:**
- `FoundryJournalFacade` → `foundryGameToken`

---

#### FoundryHooksService
**Datei:** `src/foundry/services/FoundryHooksService.ts`  
**Token:** `foundryHooksToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundryHooksPortRegistryToken,     // PortRegistry<FoundryHooks>
  loggerToken                        // Logger
]
```

**Implements:** `FoundryHooks`, `Disposable`

**Methods:**
- `on(hookName, callback)` → Result<number, FoundryError>
- `once(hookName, callback)` → Result<number, FoundryError>
- `off(hookName, callbackOrId)` → Result<void, FoundryError>
- `dispose()` - Cleanup (deregisters all hooks)

**Features:**
- Bidirectional Hook Tracking (hookName ↔ callback ↔ id)
- Support für reused callbacks

**Consumed By:**
- (Hook-Registrierungen in Module-Setup)

---

#### FoundryDocumentService
**Datei:** `src/foundry/services/FoundryDocumentService.ts`  
**Token:** `foundryDocumentToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundryDocumentPortRegistryToken   // PortRegistry<FoundryDocument>
]
```

**Implements:** `FoundryDocument`, `Disposable`

**Methods:**
- `getFlag<T>(document, scope, key)` → Result<T | null, FoundryError>
- `setFlag<T>(document, scope, key, value)` → Promise<Result<void, FoundryError>>
- `dispose()` - Cleanup

**Consumed By:**
- `FoundryJournalFacade` → `foundryDocumentToken`

---

#### FoundryUIService
**Datei:** `src/foundry/services/FoundryUIService.ts`  
**Token:** `foundryUIToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundryUIPortRegistryToken         // PortRegistry<FoundryUI>
]
```

**Implements:** `FoundryUI`, `Disposable`

**Methods:**
- `removeJournalElement(id, name, html)` → Result<void, FoundryError>
- `findElement(container, selector)` → Result<HTMLElement | null, FoundryError>
- `notify(message, type)` → Result<void, FoundryError>
- `dispose()` - Cleanup

**Consumed By:**
- `FoundryJournalFacade` → `foundryUIToken`

---

#### FoundrySettingsService
**Datei:** `src/foundry/services/FoundrySettingsService.ts`  
**Token:** `foundrySettingsToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundrySettingsPortRegistryToken   // PortRegistry<FoundrySettings>
]
```

**Implements:** `FoundrySettings`, `Disposable`

**Methods:**
- `register<T>(namespace, key, config)` → Result<void, FoundryError>
- `get<T>(namespace, key)` → Result<T, FoundryError>
- `set<T>(namespace, key, value)` → Promise<Result<void, FoundryError>>
- `dispose()` - Cleanup

**Consumed By:**
- (Settings-Registrierung in Module-Setup)

---

#### FoundryI18nService
**Datei:** `src/foundry/services/FoundryI18nService.ts`  
**Token:** `foundryI18nToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  portSelectorToken,                 // PortSelector
  foundryI18nPortRegistryToken       // PortRegistry<FoundryI18n>
]
```

**Implements:** `FoundryI18n`

**Methods:**
- `localize(key)` → Result<string, FoundryError>
- `format(key, data)` → Result<string, FoundryError>
- `has(key)` → Result<boolean, FoundryError>

**Consumed By:**
- `I18nFacadeService` → `foundryI18nToken`

---

### Registrars & Hooks ⭐ NEW v0.8.0

#### ModuleSettingsRegistrar
**Datei:** `src/core/module-settings-registrar.ts`  
**Token:** `moduleSettingsRegistrarToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  foundrySettingsToken,   // FoundrySettings
  loggerToken,            // Logger
  i18nFacadeToken         // I18nFacadeService
]
```

**Methods:**
- `registerAll(container)` - Registriert alle Modul-Settings

**Purpose:** DI-managed Settings-Registrierung (ersetzt direkte `new` Instantiierung)

---

#### ModuleHookRegistrar
**Datei:** `src/core/module-hook-registrar.ts`  
**Token:** `moduleHookRegistrarToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  renderJournalDirectoryHookToken   // RenderJournalDirectoryHook
]
```

**Methods:**
- `registerAll(container)` - Registriert alle Modul-Hooks

**Purpose:** DI-managed Hook-Registrierung mit Hook-Dependencies via Constructor

---

#### RenderJournalDirectoryHook
**Datei:** `src/core/hooks/render-journal-directory-hook.ts`  
**Token:** `renderJournalDirectoryHookToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  foundryHooksToken,              // FoundryHooksService
  loggerToken,                    // Logger
  journalVisibilityServiceToken   // JournalVisibilityService
]
```

**Implements:** `HookRegistrar` Interface

**Methods:**
- `register(container)` - Registriert Hook bei Foundry
- `dispose()` - Cleanup (unsubscribe)

**Purpose:** Eigenständiger Hook-Handler mit eigenen Dependencies

---

## Layer 4: Business Services & Facades

### Facades

#### FoundryJournalFacade
**Datei:** `src/foundry/facades/foundry-journal-facade.ts`  
**Token:** `foundryJournalFacadeToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  foundryGameToken,       // FoundryGameService
  foundryDocumentToken,   // FoundryDocumentService
  foundryUIToken          // FoundryUIService
]
```

**Implements:** `FoundryJournalFacade` Interface

**Methods:**
- `getJournalEntries()` → Result<FoundryJournalEntry[], FoundryError>
- `getEntryFlag<T>(journal, key)` → Result<T | null, FoundryError>
- `removeJournalElement(id, name, html)` → Result<void, FoundryError>

**Purpose:** Facade Pattern - kombiniert 3 Foundry Services für Journal-Operations

**Consumed By:**
- `JournalVisibilityService` → `foundryJournalFacadeToken`

**Impact:** Dependency Reduction von 4 → 2 (50%) für JournalVisibilityService

---

#### I18nFacadeService
**Datei:** `src/services/I18nFacadeService.ts`  
**Token:** `i18nFacadeToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  foundryI18nToken,  // FoundryI18nService
  localI18nToken     // LocalI18nService
]
```

**Methods:**
- `translate(key, fallback?)` → string
- `format(key, data, fallback?)` → string
- `has(key)` → boolean
- `loadLocalTranslations(translations)` → void

**Strategy:** Foundry-First → Local Fallback → Key/Fallback

**Consumed By:**
- (i18n-Konsumenten im Modul)

---

### Business Services

#### JournalVisibilityService
**Datei:** `src/services/JournalVisibilityService.ts`  
**Token:** `journalVisibilityServiceToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  foundryJournalFacadeToken,  // FoundryJournalFacade
  loggerToken                 // Logger
]
```

**Methods:**
- `getHiddenJournalEntries()` → Result<FoundryJournalEntry[], FoundryError>
- `processJournalDirectory(htmlElement)` → void
- Private: `hideEntries(entries, html)` → void
- Private: `sanitizeForLog(input)` → string

**Business Logic:**
- Filtert Journal-Einträge via Module-Flags
- UI-Manipulation (DOM-Removal)
- HTML-Sanitization für sichere Log-Ausgabe

**Consumed By:**
- (Hook-Handler: `renderJournalDirectory`)

---

#### LocalI18nService
**Datei:** `src/services/LocalI18nService.ts`  
**Token:** `localI18nToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[]  // Keine (Foundry-unabhängig)
```

**Methods:**
- `loadTranslations(translations)` → void
- `translate(key)` → Result<string, string>
- `format(key, data)` → Result<string, string>
- `has(key)` → Result<boolean, string>
- `getCurrentLocale()` → string
- `setLocale(locale)` → void

**Features:**
- Browser Locale Detection (`navigator.language`)
- Regex-Injection-Protection (Placeholder-Ersetzung)

**Consumed By:**
- `I18nFacadeService` → `localI18nToken`

---

### Utility Services

#### PerformanceTrackingService
**Datei:** `src/services/PerformanceTrackingService.ts`  
**Token:** `performanceTrackingServiceToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  environmentConfigToken,  // EnvironmentConfig
  metricsSamplerToken      // MetricsSampler (alias zu MetricsCollector)
]
```

**Extends:** `PerformanceTrackerImpl`

**Methods:**
- `track(fn, onComplete)` - Inherited
- `trackAsync(fn, onComplete)` - Inherited

**Consumed By:**
- (Performance-kritische Operations)

---

#### RetryService
**Datei:** `src/services/RetryService.ts`  
**Token:** `retryServiceToken`  
**Lifecycle:** SINGLETON

**Dependencies:**
```typescript
[
  loggerToken,             // Logger
  metricsCollectorToken    // MetricsCollector
]
```

**Methods:**
- `retry(fn, options)` → Promise<Result<T, E>>
- `retrySync(fn, options)` → Result<T, E>

**Features:**
- Exponential Backoff
- Exception Mapping (safe `as` cast via `mapException`)
- Legacy API Support (backwards compatible)

**Consumed By:**
- (Transient-Failure-Handling in Services)

---

## Complete Dependency Tree (Hierarchical)

```
Level 0: Configuration
  - EnvironmentConfig (ENV)
  - MODULE_CONSTANTS

Level 1: Utilities (Zero Dependencies)
  - Result Utilities
  - Promise Timeout
  - Throttle/Debounce
  - Trace Utilities

Level 2: Infrastructure
  - MetricsCollector → [ENV]
  - ConsoleLoggerService → [ENV, MODULE_CONSTANTS]
  - ErrorSanitizer → [ENV]

Level 3a: Infrastructure Extended
  - ModuleHealthService → [Container, MetricsCollector]
  - PerformanceTrackerImpl → [ENV, MetricsSampler]
  - BootstrapPerformanceTracker → [ENV, MetricsSampler?]
  - PerformanceTrackingService → [ENV, MetricsSampler]
  - RetryService → [Logger, MetricsCollector]

Level 3b: Port Infrastructure
  - PortSelector → []
  - PortRegistry → []
  - PortSelectionObserver → [Logger, MetricsRecorder]

Level 4: Foundry Services (6 Services)
  - FoundryGameService → [PortSelector, GamePortRegistry]
  - FoundryHooksService → [PortSelector, HooksPortRegistry, Logger]
  - FoundryDocumentService → [PortSelector, DocumentPortRegistry]
  - FoundryUIService → [PortSelector, UIPortRegistry]
  - FoundrySettingsService → [PortSelector, SettingsPortRegistry]
  - FoundryI18nService → [PortSelector, I18nPortRegistry]

Level 5a: Facades (2 Facades)
  - FoundryJournalFacade → [FoundryGame, FoundryDocument, FoundryUI]
  - LocalI18nService → [ENV]

Level 5b: i18n Facade
  - I18nFacadeService → [FoundryI18n, LocalI18n]

Level 6: Business Services
  - JournalVisibilityService → [FoundryJournalFacade, Logger]
```

---

## Dependency Injection Token Registry

### Core Infrastructure Tokens
```typescript
// src/tokens/tokenindex.ts
export const environmentConfigToken: InjectionToken<EnvironmentConfig>
export const metricsCollectorToken: InjectionToken<MetricsCollector>
export const metricsRecorderToken: InjectionToken<MetricsRecorder>  // Alias
export const metricsSamplerToken: InjectionToken<MetricsSampler>    // Alias
export const loggerToken: InjectionToken<Logger>
export const moduleHealthServiceToken: InjectionToken<ModuleHealthService>
export const performanceTrackingServiceToken: InjectionToken<PerformanceTrackingService>
export const retryServiceToken: InjectionToken<RetryService>
```

### Foundry Service Tokens
```typescript
// src/foundry/foundrytokens.ts
export const foundryGameToken: InjectionToken<FoundryGameService>
export const foundryHooksToken: InjectionToken<FoundryHooksService>
export const foundryDocumentToken: InjectionToken<FoundryDocumentService>
export const foundryUIToken: InjectionToken<FoundryUIService>
export const foundrySettingsToken: InjectionToken<FoundrySettingsService>
export const foundryI18nToken: InjectionToken<FoundryI18nService>
```

### Port Infrastructure Tokens
```typescript
// src/foundry/foundrytokens.ts
export const portSelectorToken: InjectionToken<PortSelector>
export const foundryGamePortRegistryToken: InjectionToken<PortRegistry<FoundryGame>>
export const foundryHooksPortRegistryToken: InjectionToken<PortRegistry<FoundryHooks>>
export const foundryDocumentPortRegistryToken: InjectionToken<PortRegistry<FoundryDocument>>
export const foundryUIPortRegistryToken: InjectionToken<PortRegistry<FoundryUI>>
export const foundrySettingsPortRegistryToken: InjectionToken<PortRegistry<FoundrySettings>>
export const foundryI18nPortRegistryToken: InjectionToken<PortRegistry<FoundryI18n>>
```

### Business Service Tokens
```typescript
// src/tokens/tokenindex.ts
export const journalVisibilityServiceToken: InjectionToken<JournalVisibilityService>
export const localI18nToken: InjectionToken<LocalI18nService>
export const i18nFacadeToken: InjectionToken<I18nFacadeService>
```

### Facade Tokens
```typescript
// src/foundry/foundrytokens.ts
export const foundryJournalFacadeToken: InjectionToken<FoundryJournalFacade>
```

---

## Critical Dependency Paths

### Path 1: Business Service → Foundry API
```
JournalVisibilityService
  → FoundryJournalFacade
    → FoundryGameService → PortSelector → FoundryGamePortV13 → game.journal
    → FoundryDocumentService → PortSelector → FoundryDocumentPortV13 → document.getFlag()
    → FoundryUIService → PortSelector → FoundryUIPortV13 → ui.notifications
```

### Path 2: Logging with Tracing
```
Business Logic
  → Logger.withTraceId(generateTraceId())
    → TracedLogger (Decorator)
      → ConsoleLoggerService
        → console.log/error/warn/info/debug
```

### Path 3: Performance Tracking
```
Business Logic
  → PerformanceTrackingService.trackAsync(fn, onComplete)
    → PerformanceTrackerImpl.trackAsync()
      → MetricsSampler.shouldSample()
        → MetricsCollector.shouldSample()
          → ENV.performanceSamplingRate
      → performance.now()
      → onComplete(duration, result)
        → MetricsCollector.recordOperation()
```

### Path 4: Retry with Metrics
```
Business Logic (e.g. Foundry API Call)
  → RetryService.retry(fn, options)
    → fn() [Result<T, E>]
    → Logger.debug("Retry attempt X")
    → setTimeout(delay) [Exponential Backoff]
    → MetricsCollector.recordRetry() [Not implemented yet]
```

### Path 5: i18n Translation Fallback Chain
```
UI/Business Logic
  → I18nFacadeService.translate(key)
    → FoundryI18nService.localize(key)
      → PortSelector → FoundryI18nPortV13 → game.i18n.localize()
      [IF NOT FOUND]
    → LocalI18nService.translate(key)
      → translations.get(key)
      [IF NOT FOUND]
    → fallback ?? key
```

---

## Circular Dependency Analysis

### ✅ No Circular Dependencies Detected

Das Projekt ist **frei von zirkulären Abhängigkeiten** dank:

1. **Layered Architecture**: Klare Top-Down-Dependency-Flow
2. **Container Validation**: `ContainerValidator` prüft Circular Dependencies
3. **Dependency Inversion**: High-Level Services depend on Interfaces, nicht Implementations
4. **Event-Based Observability**: PortSelector → Events → Observer (keine direkte Dependency)

### ⚠️ Special Case: ModuleHealthService
```typescript
ModuleHealthService → ServiceContainer (Self-Reference)
```

**Mitigation:**
- Registered via **Factory** (nicht `registerClass`)
- Factory resolved Dependencies erst zur Laufzeit
- Keine echte Circular Dependency (Container ist Singleton, vor ModuleHealthService erstellt)

---

## Dependency Coupling Metrics

### Afferent Coupling (Ca) - "Used By" Count

| Service | Ca | Description |
|---------|---:|-------------|
| EnvironmentConfig | 7 | Höchste Afferent Coupling (viele Konsumenten) |
| MetricsCollector | 5 | Zentrale Metrics-Sammlung |
| Logger | 5 | Ubiquitous Logging |
| PortSelector | 6 | Alle Foundry Services |
| PortRegistry | 6 | Alle Foundry Services |
| Result Utilities | ~20 | Ubiquitous (überall genutzt) |

### Efferent Coupling (Ce) - "Depends On" Count

| Service | Ce | Description |
|---------|---:|-------------|
| FoundryJournalFacade | 3 | Kombiniert 3 Services (Facade Pattern) |
| JournalVisibilityService | 2 | Niedrige Coupling dank Facade |
| FoundryHooksService | 3 | PortSelector, PortRegistry, Logger |
| ModuleHealthService | 2 | Container, MetricsCollector (+ Self-Reference) |
| PerformanceTrackingService | 2 | ENV, MetricsSampler |
| RetryService | 2 | Logger, MetricsCollector |
| I18nFacadeService | 2 | Foundry i18n, Local i18n |
| LocalI18nService | 0 | **Zero Dependencies** (Foundry-unabhängig) |
| PortSelector | 0 | **Zero Dependencies** (Event-basiert) |

### Instability (I = Ce / (Ce + Ca))

| Service | Ce | Ca | I | Interpretation |
|---------|---:|---:|--:|----------------|
| EnvironmentConfig | 0 | 7 | 0.00 | Maximal stabil (Pure Configuration) |
| PortSelector | 0 | 6 | 0.00 | Maximal stabil (Infrastructure) |
| LocalI18nService | 0 | 1 | 0.00 | Maximal stabil (Standalone) |
| Logger | 0 | 5 | 0.00 | Maximal stabil (Infrastructure) |
| FoundryJournalFacade | 3 | 1 | 0.75 | Instabil (Facade, kombiniert Services) |
| JournalVisibilityService | 2 | 0 | 1.00 | Maximal instabil (Business Logic, Leaf Node) |

**Interpretation:**
- **I = 0.00**: Stabile Foundation-Layer-Services (gut!)
- **I = 1.00**: Business-Logic-Services (gut, da Leaf Nodes!)
- **I = 0.75**: Facade (akzeptabel, da designed für Delegation)

---

## Refactoring-Impact-Analyse

### High-Impact Refactorings (Breaking Changes erlaubt!)

#### 1. Base Class für Foundry Services
**Impact:**
- **Reduziert:** 6 × 20 Zeilen `getPort()` Code = ~120 Zeilen
- **Erhöht Wartbarkeit:** Single Source of Truth für Lazy Loading
- **Risiko:** NIEDRIG (ändert nur Implementation, nicht Interface)
- **Breaking Changes:** Minimal (nur Implementation)
- **Status:** ✅ **Sofort umsetzbar**

**Affected Services:**
- FoundryGameService
- FoundryHooksService
- FoundryDocumentService
- FoundryUIService
- FoundrySettingsService
- FoundryI18nService

**Aufwand:** ~2-4h

---

#### 2. v14 Ports implementieren (sobald API verfügbar)
**Status:** ⏳ **Wartend auf Foundry v14 API-Release** (Stand: Nov 2025)  
**Versionskompatibilität:** Definiert in `module.json` (aktuell: `maximum: 13`)

**Vorbereitung abgeschlossen:**
- ✅ Port-Adapter-Infrastruktur vorhanden
- ✅ PortRegistry unterstützt beliebige Versionen
- ✅ PortSelector mit Fallback-Strategie (v14 → v13)
- ✅ Factory-basierte Lazy Loading verhindert Crashes
- ✅ v13 Ports vollständig (erfüllt `compatibility.minimum/maximum: 13`)

**Trigger für v14-Implementation:**
- `module.json` → `compatibility.maximum` auf 14 erhöhen
- Ports sind nur für Versionen zwischen `minimum` und `maximum` notwendig

**Impact (nach v14-Release):**
- **Erhöht Kompatibilität:** Foundry v14 Support
- **Test-Coverage:** +6 Port-Implementierungen, +Port-Selection-Tests
- **Risiko:** MITTEL (API-Änderungen noch unbekannt)

**Affected Components:**
- PortRegistry (registriert v14 Factories)
- PortSelector (selectiert v14 bei Foundry v14+)
- Alle 6 Foundry Port-Typen

---

#### 3. Trace-Context-Manager
**Impact:**
- **Verbessert DX:** Auto-Trace-ID-Generation
- **Reduziert Boilerplate:** `generateTraceId()` Calls
- **Risiko:** NIEDRIG (additive Change, kein Breaking Change)

**Affected Services:**
- ConsoleLoggerService (neue `trace()` Method)
- Alle Logger-Konsumenten (optional: können `trace()` statt `withTraceId()` nutzen)

---

#### 2. Health-Check-Registry (Container Self-Reference eliminieren)
**Impact:**
- **Eliminiert:** Container Self-Reference komplett
- **Erhöht Testbarkeit:** Services unabhängig testbar
- **Erhöht Erweiterbarkeit:** Neue Health-Checks ohne Code-Änderung
- **Risiko:** MITTEL (Architektur-Änderung)
- **Breaking Changes:** ✅ **Erlaubt (Pre-Release)**
- **Status:** ✅ **Sofort umsetzbar** (vor 1.0.0 empfohlen)

**Affected Components:**
- ModuleHealthService (komplett refactored)
- CompositionRoot (Health-Check-Registrierung)
- dependencyconfig.ts (neue Registry-Registrierung)

**Neue Komponenten:**
- `HealthCheckRegistry` (neu)
- `HealthCheck` Interface (neu)

**Aufwand:** ~4-6h

---

### Medium-Impact Refactorings

#### 3. Retry-Service: Legacy API entfernen
**Impact:**
- **Simplify API:** Nur noch Options-Object-Signatur
- **Erhöht Type Safety:** Keine Union-Types mehr
- **Risiko:** NIEDRIG (Breaking Change, aber Pre-Release)
- **Breaking Changes:** ✅ **Erlaubt (Pre-Release)**
- **Status:** ✅ **Sofort umsetzbar**

**Affected:**
- RetryService (API Cleanup)
- Alle Call-Sites (Migration zu Options-Object)

**Migration:**
```typescript
// Vorher (Legacy)
await retry(fn, 3, 100);

// Nachher (Options-Object)
await retry(fn, { maxAttempts: 3, delayMs: 100 });
```

**Aufwand:** ~1-2h

---

#### 4. I18n-Facade Chain-of-Responsibility
**Impact:**
- **Reduziert:** ~20 Zeilen Duplikation
- **Erhöht Erweiterbarkeit:** Neue i18n-Provider einfach hinzufügbar
- **Risiko:** NIEDRIG (ändert nur Implementation)
- **Breaking Changes:** Keine

---

#### 5. Metrics Persistierung
**Impact:**
- **Neue Features:** Langzeit-Metriken, Export
- **Erhöht Observability:** Analyse über Browser-Reloads hinweg
- **Risiko:** NIEDRIG (additive Feature)

---

### Low-Impact Refactorings

#### 6. Error Sanitizer: Strategy Pattern
**Impact:**
- **Reduziert:** ENV Coupling
- **Erhöht Testbarkeit:** Separate Sanitizer-Klassen
- **Risiko:** NIEDRIG
- **Breaking Changes:** Keine
- **Status:** Optional

---

#### 7. Dependency Config: Separate Config Classes
**Impact:**
- **Verbessert Modularität:** Service-Kategorie-spezifische Config-Klassen
- **Risiko:** NIEDRIG
- **Breaking Changes:** Keine
- **Status:** Optional (bereits gut strukturiert mit Subfunctions)

---

## Dependency Injection Registration Order

**CRITICAL:** Registrierungs-Reihenfolge muss eingehalten werden!

```typescript
// 1. Fallbacks (kritische Services)
container.registerFallback(loggerToken, () => new ConsoleLoggerService());

// 2. Configuration (keine Dependencies)
container.registerValue(environmentConfigToken, ENV);

// 3. Metrics (Dependencies: [ENV])
container.registerClass(metricsCollectorToken, MetricsCollector, SINGLETON);
container.registerAlias(metricsRecorderToken, metricsCollectorToken);
container.registerAlias(metricsSamplerToken, metricsCollectorToken);

// 4. Logger (Dependencies: [ENV])
container.registerClass(loggerToken, ConsoleLoggerService, SINGLETON);

// 5. ModuleHealthService (Dependencies: [Container, Metrics])
container.registerFactory(moduleHealthServiceToken, () => {...}, SINGLETON);

// 6. Utility Services
container.registerClass(performanceTrackingServiceToken, PerformanceTrackingService, SINGLETON);
container.registerClass(retryServiceToken, RetryService, SINGLETON);

// 7. Port Infrastructure
container.registerClass(portSelectorToken, PortSelector, SINGLETON);
// ... Port Registries (VALUE registrations)

// 8. Foundry Services (Dependencies: [PortSelector, PortRegistry])
container.registerClass(foundryGameToken, FoundryGameService, SINGLETON);
// ... (alle 6 Foundry Services)

// 9. Facades
container.registerClass(foundryJournalFacadeToken, FoundryJournalFacade, SINGLETON);
container.registerClass(localI18nToken, LocalI18nService, SINGLETON);
container.registerClass(foundryI18nToken, FoundryI18nService, SINGLETON);
container.registerClass(i18nFacadeToken, I18nFacadeService, SINGLETON);

// 10. Business Services
container.registerClass(journalVisibilityServiceToken, JournalVisibilityService, SINGLETON);

// 11. Validation
container.validate();
```

**Failure Modes:**
- ❌ Registering `RetryService` before `Logger` → Validation Error (missing dependency)
- ❌ Registering `FoundryJournalFacade` before Foundry Services → Validation Error
- ❌ Registering `I18nFacadeService` before `FoundryI18nService` → Validation Error

---

## Best Practices für neue Services

### 1. Service mit Dependencies erstellen
```typescript
// src/services/MyNewService.ts
export class MyNewService {
  static dependencies = [loggerToken, metricsCollectorToken] as const;
  
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsCollector
  ) {}
  
  doSomething(): Result<string, MyError> {
    this.logger.debug("Doing something");
    return ok("done");
  }
}
```

### 2. Token definieren
```typescript
// src/tokens/tokenindex.ts
export const myNewServiceToken = createInjectionToken<MyNewService>(
  "MyNewService"
);
```

### 3. Registrieren in dependencyconfig.ts
```typescript
// src/config/dependencyconfig.ts
const myServiceResult = container.registerClass(
  myNewServiceToken,
  MyNewService,
  ServiceLifecycle.SINGLETON
);
if (isErr(myServiceResult)) {
  return err(`Failed to register MyNewService: ${myServiceResult.error.message}`);
}
```

### 4. Dependency Order prüfen
- Stelle sicher, dass alle Dependencies **VOR** dem Service registriert werden
- Wenn Circular Dependency → Refactor zu Factory oder Event-basiert

---

## Monitoring & Debugging

### Container-Status abfragen
```typescript
// Über Module-API (Foundry VTT Console)
const api = game.modules.get("fvtt_relationship_app_module").api;

// 1. Verfügbare Tokens
const tokens = api.getAvailableTokens();
console.table(Array.from(tokens.entries()));

// 2. Metrics
const metrics = api.getMetrics();
console.table(metrics);

// 3. Health Status
const health = api.getHealth();
console.log(health);
```

### Dependency Graph Validation
```typescript
// Container Validation (manuell)
const container = api.resolve(containerToken); // Nicht exposed
const validationResult = container.validate();
if (!validationResult.ok) {
  console.error("Validation Errors:", validationResult.error);
}
```

---

## Zusammenfassung

### Dependency-Statistiken

| Kategorie | Count |
|-----------|------:|
| **Total Services** | 19 |
| **Zero Dependencies** | 4 (ENV, PortSelector, PortRegistry, LocalI18n) |
| **1 Dependency** | 3 (Metrics, Logger, ErrorSanitizer) |
| **2 Dependencies** | 7 (Foundry Services, Retry, Perf, Health) |
| **3+ Dependencies** | 5 (Facades, Business Services) |
| **Max Dependency Depth** | 6 Levels |
| **Circular Dependencies** | 0 ✅ |

### Architektur-Qualität

| Metrik | Wert | Bewertung |
|--------|------|-----------|
| **Layered Architecture** | ✅ | Excellent (5 klar getrennte Layer) |
| **Dependency Direction** | ✅ | Excellent (Top-Down, keine Inversionen) |
| **Circular Dependencies** | ✅ | Excellent (0 Circular Dependencies) |
| **Coupling** | ✅ | Good (Facades reduzieren Coupling) |
| **Cohesion** | ✅ | Excellent (Single Responsibility) |
| **Testability** | ✅ | Excellent (DI, Result Pattern) |

### Refactoring-Potenzial (Pre-Release 0.x.x)

| Refactoring | Aufwand | Breaking Changes | Status |
|-------------|--------:|------------------|--------|
| Base Class für Foundry Services | 2-4h | Minimal | ✅ Sofort |
| Health-Check-Registry | 4-6h | ✅ Ja | ✅ Sofort |
| Trace-Context-Manager | 4-8h | Minimal | ✅ Nächste Iteration |
| Retry-Service Legacy API | 1-2h | ✅ Ja | ✅ Nächste Iteration |
| I18n-Facade CoR | 2-4h | Keine | Optional |
| Metrics Persistierung | 4-8h | Keine | Optional |
| **Gesamt (Top 4)** | **12-20h** | - | **Vor 1.0.0** |

---

**Ende der Dependency Map**

