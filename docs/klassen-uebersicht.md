# Klassen-Übersicht

**Erstellungsdatum:** 2025-12-10
**Zweck:** Vollständige Übersicht aller Klassen im Projekt mit ihren Dateien
**Model:** Claude Sonnet 4.5

---

## Inhaltsverzeichnis

1. [Domain Layer](#domain-layer)
2. [Application Layer](#application-layer)
3. [Infrastructure Layer](#infrastructure-layer)
4. [Framework Layer](#framework-layer)

---

## Domain Layer

**Pfad:** `src/domain/`

*Hinweis: Der Domain Layer enthält hauptsächlich Interfaces, Types und Entities. Keine exportierten Klassen gefunden.*

---

## Application Layer

**Pfad:** `src/application/`

### Services

| Klasse | Datei |
|--------|-------|
| `RuntimeConfigService` | `src/application/services/RuntimeConfigService.ts` |
| `RuntimeConfigSync` | `src/application/services/RuntimeConfigSync.ts` |
| `DIRuntimeConfigSync` | `src/application/services/RuntimeConfigSync.ts` |
| `ModuleSettingsRegistrar` | `src/application/services/ModuleSettingsRegistrar.ts` |
| `DIModuleSettingsRegistrar` | `src/application/services/ModuleSettingsRegistrar.ts` |
| `NotificationCenter` | `src/application/services/NotificationCenter.ts` |
| `DINotificationCenter` | `src/application/services/NotificationCenter.ts` |
| `SettingRegistrationErrorMapper` | `src/application/services/SettingRegistrationErrorMapper.ts` |
| `DISettingRegistrationErrorMapper` | `src/application/services/SettingRegistrationErrorMapper.ts` |
| `ModuleHealthService` | `src/application/services/ModuleHealthService.ts` |
| `DIModuleHealthService` | `src/application/services/ModuleHealthService.ts` |
| `ModuleReadyService` | `src/application/services/module-ready-service.ts` |
| `DIModuleReadyService` | `src/application/services/module-ready-service.ts` |
| `ModuleEventRegistrar` | `src/application/services/ModuleEventRegistrar.ts` |
| `DIModuleEventRegistrar` | `src/application/services/ModuleEventRegistrar.ts` |
| `JournalDirectoryProcessor` | `src/application/services/JournalDirectoryProcessor.ts` |
| `DIJournalDirectoryProcessor` | `src/application/services/JournalDirectoryProcessor.ts` |
| `JournalVisibilityService` | `src/application/services/JournalVisibilityService.ts` |
| `DIJournalVisibilityService` | `src/application/services/JournalVisibilityService.ts` |

### Health Checks

| Klasse | Datei |
|--------|-------|
| `MetricsHealthCheck` | `src/application/health/MetricsHealthCheck.ts` |
| `DIMetricsHealthCheck` | `src/application/health/MetricsHealthCheck.ts` |
| `HealthCheckRegistry` | `src/application/health/HealthCheckRegistry.ts` |
| `DIHealthCheckRegistry` | `src/application/health/HealthCheckRegistry.ts` |
| `ContainerHealthCheck` | `src/application/health/ContainerHealthCheck.ts` |
| `DIContainerHealthCheck` | `src/application/health/ContainerHealthCheck.ts` |

### Use Cases

| Klasse | Datei |
|--------|-------|
| `RegisterContextMenuUseCase` | `src/application/use-cases/register-context-menu.use-case.ts` |
| `DIRegisterContextMenuUseCase` | `src/application/use-cases/register-context-menu.use-case.ts` |
| `TriggerJournalDirectoryReRenderUseCase` | `src/application/use-cases/trigger-journal-directory-rerender.use-case.ts` |
| `DITriggerJournalDirectoryReRenderUseCase` | `src/application/use-cases/trigger-journal-directory-rerender.use-case.ts` |
| `ProcessJournalDirectoryOnRenderUseCase` | `src/application/use-cases/process-journal-directory-on-render.use-case.ts` |
| `DIProcessJournalDirectoryOnRenderUseCase` | `src/application/use-cases/process-journal-directory-on-render.use-case.ts` |
| `InvalidateJournalCacheOnChangeUseCase` | `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts` |
| `DIInvalidateJournalCacheOnChangeUseCase` | `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts` |
| `HookRegistrationManager` | `src/application/use-cases/hook-registration-manager.ts` |

### Handlers

| Klasse | Datei |
|--------|-------|
| `HideJournalContextMenuHandler` | `src/application/handlers/hide-journal-context-menu-handler.ts` |
| `DIHideJournalContextMenuHandler` | `src/application/handlers/hide-journal-context-menu-handler.ts` |

---

## Infrastructure Layer

**Pfad:** `src/infrastructure/`

### Logging

| Klasse | Datei |
|--------|-------|
| `BaseConsoleLogger` | `src/infrastructure/logging/BaseConsoleLogger.ts` |
| `ConsoleLoggerService` | `src/infrastructure/logging/ConsoleLoggerService.ts` |
| `DIConsoleLoggerService` | `src/infrastructure/logging/ConsoleLoggerService.ts` |
| `BootstrapLoggerService` | `src/infrastructure/logging/BootstrapLogger.ts` |
| `StackTraceLoggerDecorator` | `src/infrastructure/logging/StackTraceLoggerDecorator.ts` |
| `TraceContextLoggerDecorator` | `src/infrastructure/logging/TraceContextLoggerDecorator.ts` |
| `TracedLogger` | `src/infrastructure/logging/TracedLogger.ts` |
| `RuntimeConfigLoggerDecorator` | `src/infrastructure/logging/RuntimeConfigLoggerDecorator.ts` |

### Retry

| Klasse | Datei |
|--------|-------|
| `BaseRetryService` | `src/infrastructure/retry/BaseRetryService.ts` |
| `RetryObservabilityDecorator` | `src/infrastructure/retry/RetryObservabilityDecorator.ts` |
| `RetryService` | `src/infrastructure/retry/RetryService.ts` |
| `DIRetryService` | `src/infrastructure/retry/RetryService.ts` |

### Notifications

| Klasse | Datei |
|--------|-------|
| `NotificationQueue` | `src/infrastructure/notifications/NotificationQueue.ts` |
| `DINotificationQueue` | `src/infrastructure/notifications/NotificationQueue.ts` |
| `QueuedUIChannel` | `src/infrastructure/notifications/channels/QueuedUIChannel.ts` |
| `DIQueuedUIChannel` | `src/infrastructure/notifications/channels/QueuedUIChannel.ts` |
| `UIChannel` | `src/infrastructure/notifications/channels/UIChannel.ts` |
| `DIUIChannel` | `src/infrastructure/notifications/channels/UIChannel.ts` |
| `ConsoleChannel` | `src/infrastructure/notifications/channels/ConsoleChannel.ts` |
| `DIConsoleChannel` | `src/infrastructure/notifications/channels/ConsoleChannel.ts` |

### Cache

| Klasse | Datei |
|--------|-------|
| `CacheService` | `src/infrastructure/cache/CacheService.ts` |
| `DICacheService` | `src/infrastructure/cache/CacheService.ts` |
| `CacheConfigSync` | `src/infrastructure/cache/CacheConfigSync.ts` |
| `DICacheConfigSync` | `src/infrastructure/cache/CacheConfigSync.ts` |
| `CacheMetricsCollector` | `src/infrastructure/cache/cache-metrics-collector.ts` |
| `CacheCapacityManager` | `src/infrastructure/cache/cache-capacity-manager.ts` |
| `LRUEvictionStrategy` | `src/infrastructure/cache/lru-eviction-strategy.ts` |

### Dependency Injection

| Klasse | Datei |
|--------|-------|
| `ServiceContainer` | `src/infrastructure/di/container.ts` |
| `ServiceRegistration` | `src/infrastructure/di/types/core/serviceregistration.ts` |
| `ServiceResolver` | `src/infrastructure/di/resolution/ServiceResolver.ts` |
| `TransientResolutionStrategy` | `src/infrastructure/di/resolution/strategies/transient-resolution-strategy.ts` |
| `SingletonResolutionStrategy` | `src/infrastructure/di/resolution/strategies/singleton-resolution-strategy.ts` |
| `ScopedResolutionStrategy` | `src/infrastructure/di/resolution/strategies/scoped-resolution-strategy.ts` |
| `ScopeManager` | `src/infrastructure/di/scope/ScopeManager.ts` |
| `ServiceRegistry` | `src/infrastructure/di/registry/ServiceRegistry.ts` |

### Observability

| Klasse | Datei |
|--------|-------|
| `MetricsCollector` | `src/infrastructure/observability/metrics-collector.ts` |
| `DIMetricsCollector` | `src/infrastructure/observability/metrics-collector.ts` |
| `MetricsSampler` | `src/infrastructure/observability/metrics-sampler.ts` |
| `DIMetricsSampler` | `src/infrastructure/observability/metrics-sampler.ts` |
| `MetricsReporter` | `src/infrastructure/observability/metrics-reporter.ts` |
| `DIMetricsReporter` | `src/infrastructure/observability/metrics-reporter.ts` |
| `ObservabilityRegistry` | `src/infrastructure/observability/observability-registry.ts` |
| `DIObservabilityRegistry` | `src/infrastructure/observability/observability-registry.ts` |
| `MetricsSnapshotAdapter` | `src/infrastructure/observability/metrics-snapshot-adapter.ts` |
| `PerformanceTrackerImpl` | `src/infrastructure/observability/performance-tracker-impl.ts` |
| `PersistentMetricsCollector` | `src/infrastructure/observability/metrics-persistence/persistent-metrics-collector.ts` |
| `DIPersistentMetricsCollector` | `src/infrastructure/observability/metrics-persistence/persistent-metrics-collector.ts` |
| `DIMetricsSnapshotAdapter` | `src/infrastructure/observability/di-metrics-snapshot-adapter.ts` |
| `BootstrapPerformanceTracker` | `src/infrastructure/observability/bootstrap-performance-tracker.ts` |
| `TraceContext` | `src/infrastructure/observability/trace/TraceContext.ts` |
| `DITraceContext` | `src/infrastructure/observability/trace/TraceContext.ts` |
| `LocalStorageMetricsStorage` | `src/infrastructure/observability/metrics-persistence/local-storage-metrics-storage.ts` |

### Performance

| Klasse | Datei |
|--------|-------|
| `PerformanceTrackingService` | `src/infrastructure/performance/PerformanceTrackingService.ts` |
| `DIPerformanceTrackingService` | `src/infrastructure/performance/PerformanceTrackingService.ts` |

### I18n

| Klasse | Datei |
|--------|-------|
| `I18nFacadeService` | `src/infrastructure/i18n/I18nFacadeService.ts` |
| `DII18nFacadeService` | `src/infrastructure/i18n/I18nFacadeService.ts` |
| `TranslationHandlerChain` | `src/infrastructure/i18n/TranslationHandlerChain.ts` |
| `DITranslationHandlerChain` | `src/infrastructure/i18n/TranslationHandlerChain.ts` |
| `AbstractTranslationHandler` (abstract) | `src/infrastructure/i18n/AbstractTranslationHandler.ts` |
| `LocalTranslationHandler` | `src/infrastructure/i18n/LocalTranslationHandler.ts` |
| `DILocalTranslationHandler` | `src/infrastructure/i18n/LocalTranslationHandler.ts` |
| `LocalI18nService` | `src/infrastructure/i18n/LocalI18nService.ts` |
| `DILocalI18nService` | `src/infrastructure/i18n/LocalI18nService.ts` |
| `FoundryTranslationHandler` | `src/infrastructure/i18n/FoundryTranslationHandler.ts` |
| `DIFoundryTranslationHandler` | `src/infrastructure/i18n/FoundryTranslationHandler.ts` |
| `FallbackTranslationHandler` | `src/infrastructure/i18n/FallbackTranslationHandler.ts` |

### Health

| Klasse | Datei |
|--------|-------|
| `HealthCheckRegistryAdapter` | `src/infrastructure/health/health-check-registry-adapter.ts` |

### Config

| Klasse | Datei |
|--------|-------|
| `RuntimeConfigAdapter` | `src/infrastructure/config/runtime-config-adapter.ts` |

### Validation

| Klasse | Datei |
|--------|-------|
| `ValibotValidationAdapter` | `src/infrastructure/validation/valibot-validation-adapter.ts` |
| `DIValibotValidationAdapter` | `src/infrastructure/validation/di-valibot-validation-adapter.ts` |

### Foundry Adapters - Services

| Klasse | Datei |
|--------|-------|
| `FoundryUIAvailabilityPort` | `src/infrastructure/adapters/foundry/services/FoundryUIAvailabilityPort.ts` |
| `DIFoundryUIAvailabilityPort` | `src/infrastructure/adapters/foundry/services/FoundryUIAvailabilityPort.ts` |
| `FoundryUIPort` | `src/infrastructure/adapters/foundry/services/FoundryUIPort.ts` |
| `DIFoundryUIPort` | `src/infrastructure/adapters/foundry/services/FoundryUIPort.ts` |
| `FoundrySettingsPort` | `src/infrastructure/adapters/foundry/services/FoundrySettingsPort.ts` |
| `DIFoundrySettingsPort` | `src/infrastructure/adapters/foundry/services/FoundrySettingsPort.ts` |
| `FoundryModuleReadyPort` | `src/infrastructure/adapters/foundry/services/FoundryModuleReadyPort.ts` |
| `DIFoundryModuleReadyPort` | `src/infrastructure/adapters/foundry/services/FoundryModuleReadyPort.ts` |
| `FoundryLibWrapperService` | `src/infrastructure/adapters/foundry/services/FoundryLibWrapperService.ts` |
| `DIFoundryLibWrapperService` | `src/infrastructure/adapters/foundry/services/FoundryLibWrapperService.ts` |
| `FoundryI18nPort` | `src/infrastructure/adapters/foundry/services/FoundryI18nPort.ts` |
| `DIFoundryI18nPort` | `src/infrastructure/adapters/foundry/services/FoundryI18nPort.ts` |
| `FoundryHooksPort` | `src/infrastructure/adapters/foundry/services/FoundryHooksPort.ts` |
| `DIFoundryHooksPort` | `src/infrastructure/adapters/foundry/services/FoundryHooksPort.ts` |
| `FoundryGamePort` | `src/infrastructure/adapters/foundry/services/FoundryGamePort.ts` |
| `DIFoundryGamePort` | `src/infrastructure/adapters/foundry/services/FoundryGamePort.ts` |
| `FoundryDocumentPort` | `src/infrastructure/adapters/foundry/services/FoundryDocumentPort.ts` |
| `DIFoundryDocumentPort` | `src/infrastructure/adapters/foundry/services/FoundryDocumentPort.ts` |
| `JournalContextMenuLibWrapperService` | `src/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService.ts` |
| `DIJournalContextMenuLibWrapperService` | `src/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService.ts` |
| `FoundryServiceBase` (abstract) | `src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts` |

### Foundry Adapters - Versioning

| Klasse | Datei |
|--------|-------|
| `PortSelector` | `src/infrastructure/adapters/foundry/versioning/portselector.ts` |
| `DIPortSelector` | `src/infrastructure/adapters/foundry/versioning/portselector.ts` |
| `FoundryVersionDetector` | `src/infrastructure/adapters/foundry/versioning/foundry-version-detector.ts` |
| `DIFoundryVersionDetector` | `src/infrastructure/adapters/foundry/versioning/foundry-version-detector.ts` |
| `PortResolutionStrategy` | `src/infrastructure/adapters/foundry/versioning/port-resolution-strategy.ts` |
| `PortSelectionEventEmitter` | `src/infrastructure/adapters/foundry/versioning/port-selection-events.ts` |
| `DIPortSelectionEventEmitter` | `src/infrastructure/adapters/foundry/versioning/port-selection-events.ts` |
| `PortSelectionObserver` | `src/infrastructure/adapters/foundry/versioning/port-selection-observer.ts` |
| `PortRegistry` | `src/infrastructure/adapters/foundry/versioning/portregistry.ts` |

### Foundry Adapters - Settings

| Klasse | Datei |
|--------|-------|
| `FoundrySettingsAdapter` | `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts` |
| `DIFoundrySettingsAdapter` | `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts` |
| `FoundrySettingsRegistrationAdapter` | `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-registration-adapter.ts` |
| `DIFoundrySettingsRegistrationAdapter` | `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-registration-adapter.ts` |

### Foundry Adapters - Collection Adapters

| Klasse | Datei |
|--------|-------|
| `FoundryJournalCollectionAdapter` | `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts` |
| `DIFoundryJournalCollectionAdapter` | `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts` |

### Foundry Adapters - Repository Adapters

| Klasse | Datei |
|--------|-------|
| `FoundryJournalRepositoryAdapter` | `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts` |
| `DIFoundryJournalRepositoryAdapter` | `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts` |

### Foundry Adapters - Facades

| Klasse | Datei |
|--------|-------|
| `FoundryJournalFacade` | `src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts` |
| `DIFoundryJournalFacade` | `src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts` |

### Foundry Adapters - Event Adapters

| Klasse | Datei |
|--------|-------|
| `FoundryJournalEventAdapter` | `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts` |
| `DIFoundryJournalEventAdapter` | `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts` |
| `FoundryBootstrapEventAdapter` | `src/infrastructure/adapters/foundry/bootstrap-hooks-adapter.ts` |
| `DIFoundryBootstrapEventAdapter` | `src/infrastructure/adapters/foundry/bootstrap-hooks-adapter.ts` |

### Foundry Adapters - UI Adapters

| Klasse | Datei |
|--------|-------|
| `FoundryUIAdapter` | `src/infrastructure/adapters/foundry/adapters/foundry-ui-adapter.ts` |
| `DIFoundryUIAdapter` | `src/infrastructure/adapters/foundry/adapters/foundry-ui-adapter.ts` |

### Foundry Adapters - Ports (v13)

| Klasse | Datei |
|--------|-------|
| `FoundryV13ModulePort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13ModulePort.ts` |
| `DIFoundryV13ModulePort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13ModulePort.ts` |
| `FoundryV13DocumentPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort.ts` |
| `DIFoundryV13DocumentPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort.ts` |
| `FoundryV13GamePort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts` |
| `FoundryV13HooksPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13HooksPort.ts` |
| `FoundryV13UIPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13UIPort.ts` |
| `FoundryV13SettingsPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort.ts` |
| `FoundryV13I18nPort` | `src/infrastructure/adapters/foundry/ports/v13/FoundryV13I18nPort.ts` |

### Platform Adapters - Notifications

| Klasse | Datei |
|--------|-------|
| `NotificationPortAdapter` | `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts` |
| `DINotificationPortAdapter` | `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts` |

### Platform Adapters - I18n

| Klasse | Datei |
|--------|-------|
| `I18nPortAdapter` | `src/infrastructure/adapters/i18n/platform-i18n-port-adapter.ts` |
| `DII18nPortAdapter` | `src/infrastructure/adapters/i18n/platform-i18n-port-adapter.ts` |

### Platform Adapters - Cache

| Klasse | Datei |
|--------|-------|
| `CachePortAdapter` | `src/infrastructure/adapters/cache/platform-cache-port-adapter.ts` |
| `DICachePortAdapter` | `src/infrastructure/adapters/cache/platform-cache-port-adapter.ts` |

---

## Framework Layer

**Pfad:** `src/framework/`

### Core

| Klasse | Datei |
|--------|-------|
| `CompositionRoot` | `src/framework/core/composition-root.ts` |
| `BootstrapInitHookService` | `src/framework/core/bootstrap-init-hook.ts` |
| `DIBootstrapInitHookService` | `src/framework/core/bootstrap-init-hook.ts` |
| `BootstrapReadyHookService` | `src/framework/core/bootstrap-ready-hook.ts` |
| `DIBootstrapReadyHookService` | `src/framework/core/bootstrap-ready-hook.ts` |
| `BootstrapErrorHandler` | `src/framework/core/bootstrap-error-handler.ts` |

### API

| Klasse | Datei |
|--------|-------|
| `ModuleApiInitializer` | `src/framework/core/api/module-api-initializer.ts` |
| `DIModuleApiInitializer` | `src/framework/core/api/module-api-initializer.ts` |

### Bootstrap Orchestrators

| Klasse | Datei |
|--------|-------|
| `InitOrchestrator` | `src/framework/core/bootstrap/init-orchestrator.ts` |
| `LoggingBootstrapper` | `src/framework/core/bootstrap/orchestrators/logging-bootstrapper.ts` |
| `MetricsBootstrapper` | `src/framework/core/bootstrap/orchestrators/metrics-bootstrapper.ts` |
| `SettingsBootstrapper` | `src/framework/core/bootstrap/orchestrators/settings-bootstrapper.ts` |
| `NotificationBootstrapper` | `src/framework/core/bootstrap/orchestrators/notification-bootstrapper.ts` |
| `ContextMenuBootstrapper` | `src/framework/core/bootstrap/orchestrators/context-menu-bootstrapper.ts` |
| `ApiBootstrapper` | `src/framework/core/bootstrap/orchestrators/api-bootstrapper.ts` |
| `EventsBootstrapper` | `src/framework/core/bootstrap/orchestrators/events-bootstrapper.ts` |

---

## Statistik

- **Gesamtanzahl Klassen:** 194 exportierte Klassen (inkl. abstrakter Klassen)
- **Domain Layer:** 0 Klassen (nur Interfaces/Types)
- **Application Layer:** 37 Klassen
- **Infrastructure Layer:** 141 Klassen (inkl. 2 abstrakter Klassen)
- **Framework Layer:** 16 Klassen
- **Abstrakte Klassen:** 2 (`FoundryServiceBase`, `AbstractTranslationHandler`)

---

## Hinweise

- Die meisten Klassen haben eine entsprechende DI-Variante (z.B. `DIConsoleLoggerService` für `ConsoleLoggerService`)
- DI-Klassen erweitern in der Regel ihre Basis-Klassen und fügen Dependency Injection hinzu
- Test-Klassen wurden aus dieser Übersicht ausgeschlossen
- Die Klassen sind nach Clean Architecture Prinzipien organisiert

---

**Letzte Aktualisierung:** 2025-12-10

