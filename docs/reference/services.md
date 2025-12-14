# Service-Übersicht

**Zweck:** Vollständige Übersicht aller Services im Projekt
**Zielgruppe:** Entwickler, Maintainer
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Übersicht

Das Projekt verwendet eine **Clean Architecture** mit klarer Schichtentrennung. Services sind nach Layern organisiert:

- **Domain Layer**: Interfaces, Types, Entities (keine Services)
- **Application Layer**: Business Services, Use-Cases, Health Checks
- **Infrastructure Layer**: Technische Services (DI, Cache, Logging, etc.)
- **Framework Layer**: Bootstrap, Config, API

**Gesamtanzahl:** 194+ exportierte Klassen (inkl. DI-Wrapper)

---

## Application Layer Services

**Pfad:** `src/application/`

### Business Services

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `JournalVisibilityService` | `src/application/services/JournalVisibilityService.ts` | Verwaltung versteckter Journal-Einträge |
| `RuntimeConfigService` | `src/application/services/RuntimeConfigService.ts` | Runtime-Konfiguration mit Live-Updates |
| `ModuleHealthService` | `src/application/services/ModuleHealthService.ts` | Aggregiert Health-Check-Ergebnisse |
| `ModuleReadyService` | `src/application/services/module-ready-service.ts` | Modul-Bereitschafts-Prüfung |
| `NotificationCenter` | `src/application/services/NotificationCenter.ts` | Zentrale Routing-Instanz für Notifications |
| `ModuleSettingsRegistrar` | `src/application/services/ModuleSettingsRegistrar.ts` | Registriert Foundry-Settings |
| `ModuleEventRegistrar` | `src/application/services/ModuleEventRegistrar.ts` | Registriert Event-Listener |
| `JournalDirectoryProcessor` | `src/application/services/JournalDirectoryProcessor.ts` | Verarbeitet Journal-Directory-Rendering |

### Use-Cases

| Use-Case | Datei | Beschreibung |
|----------|-------|--------------|
| `RegisterContextMenuUseCase` | `src/application/use-cases/register-context-menu.use-case.ts` | Registriert Context-Menü-Handler |
| `ProcessJournalDirectoryOnRenderUseCase` | `src/application/use-cases/process-journal-directory-on-render.use-case.ts` | Verarbeitet Journal-Directory beim Rendern |
| `InvalidateJournalCacheOnChangeUseCase` | `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts` | Invalidiert Cache bei Journal-Änderungen |
| `TriggerJournalDirectoryReRenderUseCase` | `src/application/use-cases/trigger-journal-directory-rerender.use-case.ts` | Triggert Journal-Directory-Re-Rendering |

### Health Checks

| Health Check | Datei | Beschreibung |
|--------------|-------|--------------|
| `ContainerHealthCheck` | `src/application/health/ContainerHealthCheck.ts` | Validiert DI-Container-Status |
| `MetricsHealthCheck` | `src/application/health/MetricsHealthCheck.ts` | Prüft Port-Selection und Resolution-Errors |
| `HealthCheckRegistry` | `src/application/health/HealthCheckRegistry.ts` | Registry für Health-Checks |

---

## Infrastructure Layer Services

**Pfad:** `src/infrastructure/`

### Dependency Injection

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `ServiceContainer` | `src/infrastructure/di/container.ts` | Zentrale DI-Container-Implementierung |
| `ServiceRegistry` | `src/infrastructure/di/registry/ServiceRegistry.ts` | Verwaltet Service-Registrierungen |
| `ServiceResolver` | `src/infrastructure/di/resolution/ServiceResolver.ts` | Löst Service-Instanzen auf |
| `ScopeManager` | `src/infrastructure/di/scope/ScopeManager.ts` | Verwaltet Scope-Hierarchie |
| `InstanceCache` | `src/infrastructure/di/cache/InstanceCache.ts` | Cached Service-Instanzen |
| `ContainerValidator` | `src/infrastructure/di/validation/ContainerValidator.ts` | Validiert Container-Konfiguration |

---

### Logging

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `ConsoleLoggerService` | `src/infrastructure/logging/ConsoleLoggerService.ts` | Console-basierter Logger |
| `BootstrapLoggerService` | `src/infrastructure/logging/BootstrapLogger.ts` | Logger für Bootstrap-Phase |
| `TracedLogger` | `src/infrastructure/logging/TracedLogger.ts` | Logger mit Trace-ID-Support |

---

### Observability & Metrics

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `MetricsCollector` | `src/infrastructure/observability/metrics-collector.ts` | Sammelt Performance-Metriken |
| `MetricsSampler` | `src/infrastructure/observability/metrics-sampler.ts` | Entscheidet über Sampling |
| `ObservabilityRegistry` | `src/infrastructure/observability/observability-registry.ts` | Zentrale Registry für Observable Services |
| `TraceContext` | `src/infrastructure/observability/trace/TraceContext.ts` | Automatische Trace-ID-Propagation |
| `PerformanceTrackingService` | `src/infrastructure/performance/PerformanceTrackingService.ts` | Performance-Tracking mit Sampling |

---

### Cache

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `CacheService` | `src/infrastructure/cache/CacheService.ts` | In-Memory-Cache mit TTL |
| `CacheCapacityManager` | `src/infrastructure/cache/cache-capacity-manager.ts` | Verwaltet Cache-Kapazität |
| `LRUEvictionStrategy` | `src/infrastructure/cache/lru-eviction-strategy.ts` | LRU Eviction-Strategy |
| `CacheConfigSync` | `src/infrastructure/cache/CacheConfigSync.ts` | Synchronisiert Cache-Konfiguration |

---

### Retry & Resilience

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `RetryService` | `src/infrastructure/retry/RetryService.ts` | Retry-Logik mit Exponential Backoff |

---

### Notifications

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `NotificationQueue` | `src/infrastructure/notifications/NotificationQueue.ts` | Queue für UI-Notifications |
| `ConsoleChannel` | `src/infrastructure/notifications/channels/ConsoleChannel.ts` | Console-Notification-Channel |
| `UIChannel` | `src/infrastructure/notifications/channels/UIChannel.ts` | UI-Notification-Channel |
| `QueuedUIChannel` | `src/infrastructure/notifications/channels/QueuedUIChannel.ts` | Queued UI-Channel |

---

### I18n

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `I18nFacadeService` | `src/infrastructure/i18n/I18nFacadeService.ts` | Internationalisierungs-Facade |
| `LocalI18nService` | `src/infrastructure/i18n/LocalI18nService.ts` | Lokale JSON-basierte Übersetzungen |
| `TranslationHandlerChain` | `src/infrastructure/i18n/TranslationHandlerChain.ts` | Chain-of-Responsibility für Übersetzungen |
| `FoundryTranslationHandler` | `src/infrastructure/i18n/FoundryTranslationHandler.ts` | Foundry-Übersetzungs-Handler |
| `LocalTranslationHandler` | `src/infrastructure/i18n/LocalTranslationHandler.ts` | Lokaler Übersetzungs-Handler |
| `FallbackTranslationHandler` | `src/infrastructure/i18n/FallbackTranslationHandler.ts` | Fallback-Übersetzungs-Handler |

---

### Foundry Adapters

#### Version-agnostische Services

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `FoundryGamePort` | `src/infrastructure/adapters/foundry/services/FoundryGamePort.ts` | Wrapper für FoundryGame |
| `FoundryHooksPort` | `src/infrastructure/adapters/foundry/services/FoundryHooksPort.ts` | Wrapper für FoundryHooks |
| `FoundryDocumentPort` | `src/infrastructure/adapters/foundry/services/FoundryDocumentPort.ts` | Wrapper für FoundryDocument |
| `FoundryUIPort` | `src/infrastructure/adapters/foundry/services/FoundryUIPort.ts` | Wrapper für FoundryUI |
| `FoundrySettingsPort` | `src/infrastructure/adapters/foundry/services/FoundrySettingsPort.ts` | Wrapper für FoundrySettings |
| `FoundryI18nPort` | `src/infrastructure/adapters/foundry/services/FoundryI18nPort.ts` | Wrapper für FoundryI18n |
| `FoundryServiceBase` | `src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts` | Abstract Base Class für alle Foundry Services |

#### Versionsspezifische Ports (v13)

| Port | Datei | Beschreibung |
|------|-------|--------------|
| `FoundryV13GamePort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts` | V13-spezifische Game-API |
| `FoundryV13HooksPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13HooksPort.ts` | V13-spezifische Hooks-API |
| `FoundryV13DocumentPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort.ts` | V13-spezifische Document-API |
| `FoundryV13UIPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13UIPort.ts` | V13-spezifische UI-API |
| `FoundryV13SettingsPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort.ts` | V13-spezifische Settings-API |
| `FoundryV13I18nPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13I18nPort.ts` | V13-spezifische I18n-API |

#### Versioning

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `PortSelector` | `src/infrastructure/adapters/foundry/versioning/portselector.ts` | Wählt kompatiblen Port |
| `PortRegistry` | `src/infrastructure/adapters/foundry/versioning/portregistry.ts` | Registry für Port-Tokens |
| `FoundryVersionDetector` | `src/infrastructure/adapters/foundry/versioning/foundry-version-detector.ts` | Erkennt Foundry-Version |

#### Collection & Repository Adapters

| Adapter | Datei | Beschreibung |
|---------|-------|--------------|
| `FoundryJournalCollectionAdapter` | `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts` | Read-Only Journal-Zugriff |
| `FoundryJournalRepositoryAdapter` | `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts` | CRUD-Operationen für Journals |

#### Facades

| Facade | Datei | Beschreibung |
|--------|-------|--------------|
| `FoundryJournalFacade` | `src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts` | Kombiniert Game/Document/UI |

#### Platform Adapters

| Adapter | Datei | Beschreibung |
|---------|-------|--------------|
| `NotificationPortAdapter` | `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts` | Platform-agnostische Notifications |
| `CachePortAdapter` | `src/infrastructure/adapters/cache/platform-cache-port-adapter.ts` | Platform-agnostisches Caching |
| `I18nPortAdapter` | `src/infrastructure/adapters/i18n/platform-i18n-port-adapter.ts` | Platform-agnostische I18n |

---

## Framework Layer Services

**Pfad:** `src/framework/`

### Core

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| `CompositionRoot` | `src/framework/core/composition-root.ts` | Zentrale Bootstrap-Komponente |
| `BootstrapInitHookService` | `src/framework/core/bootstrap-init-hook.ts` | Init-Hook-Service |
| `BootstrapReadyHookService` | `src/framework/core/bootstrap-ready-hook.ts` | Ready-Hook-Service |
| `ModuleApiInitializer` | `src/framework/core/api/module-api-initializer.ts` | Initialisiert Public API |

### Bootstrap Orchestrators

| Orchestrator | Datei | Beschreibung |
|--------------|-------|--------------|
| `InitOrchestrator` | `src/framework/core/bootstrap/init-orchestrator.ts` | Orchestriert Init-Phase |
| `LoggingBootstrapper` | `src/framework/core/bootstrap/orchestrators/logging-bootstrapper.ts` | Bootstrappt Logging |
| `MetricsBootstrapper` | `src/framework/core/bootstrap/orchestrators/metrics-bootstrapper.ts` | Bootstrappt Metrics |
| `SettingsBootstrapper` | `src/framework/core/bootstrap/orchestrators/settings-bootstrapper.ts` | Bootstrappt Settings |
| `NotificationBootstrapper` | `src/framework/core/bootstrap/orchestrators/notification-bootstrapper.ts` | Bootstrappt Notifications |
| `ApiBootstrapper` | `src/framework/core/bootstrap/orchestrators/api-bootstrapper.ts` | Bootstrappt API |
| `EventsBootstrapper` | `src/framework/core/bootstrap/orchestrators/events-bootstrapper.ts` | Bootstrappt Events |

---

## DI-Wrapper-Pattern

Die meisten Services haben ein **DI-Wrapper-Pendant**:

**Pattern:**
```typescript
// Basisklasse
class ConsoleLoggerService {
  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    // ...
  }
}

// DI-Wrapper
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    super(env, traceContext);
  }
}
```

**Vorteile:**
- ✅ Constructor-Signaturen bleiben stabil
- ✅ Tests können Basisklasse direkt nutzen
- ✅ Config registriert nur Wrapper

---

## Service-Kategorien

### Core Infrastructure
- Logger (ConsoleLoggerService, BootstrapLoggerService)
- Metrics (MetricsCollector, MetricsSampler)
- Trace (TraceContext)
- Health (ModuleHealthService, HealthCheckRegistry)

### Foundry Integration
- Foundry Services (FoundryGamePort, FoundryHooksPort, etc.)
- Foundry Ports (FoundryV13GamePort, FoundryV13HooksPort, etc.)
- Foundry Adapters (Collection, Repository, Event)

### Business Services
- JournalVisibilityService
- NotificationCenter
- RuntimeConfigService

### Infrastructure Services
- Cache (CacheService)
- Retry (RetryService)
- I18n (I18nFacadeService)
- Performance (PerformanceTrackingService)

---

## Weitere Informationen

- [Quick Reference](./quick-reference.md) - Schnellreferenz für Entwickler
- [Token-Katalog](./tokens.md) - DI-Token-Übersicht
- [Architektur-Übersicht](../architecture/overview.md) - Architektur-Details
- [Glossar](./glossary.md) - Begriffslexikon

---

**Letzte Aktualisierung:** 2025-01-XX
