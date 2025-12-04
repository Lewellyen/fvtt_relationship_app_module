/**
 * Service Type Registry
 *
 * Zentrale Definition aller registrierten Service-Typen.
 * Diese Datei wird NUR vom DI-Container und internen DI-Utilities importiert.
 *
 * ⚠️ WICHTIG: Services sollten diese Datei NICHT direkt importieren!
 * Services importieren nur die spezifischen Token, die sie benötigen.
 *
 * Die ServiceType Union wird verwendet für:
 * - Container interne Type-Safety
 * - InstanceCache<ServiceType>
 * - ServiceRegistry<ServiceType>
 * - Runtime-Casts in runtime-safe-cast.ts
 */

// Import aller Service-Typen
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { FoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import type { FoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { LocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import type { MetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import type { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";
import type { NotificationChannel } from "@/infrastructure/notifications/notification-channel.interface";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Container } from "@/infrastructure/di/interfaces";
import type { CacheService, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { InvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import type { ProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import type { TriggerJournalDirectoryReRenderUseCase } from "@/application/use-cases/trigger-journal-directory-rerender.use-case";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { LibWrapperService } from "@/domain/services/lib-wrapper-service.interface";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import type { SettingsRegistrationPort } from "@/domain/ports/settings-registration-port.interface";
import type { ContextMenuRegistrationPort } from "@/domain/ports/context-menu-registration-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { NotificationPort } from "@/domain/ports/notification-port.interface";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";

/**
 * Union type representing all registered service types in the application.
 *
 * @internal - Nur für DI-Container interne Nutzung
 *
 * @example
 * ```typescript
 * // Add a new service to the registry:
 * export type ServiceType = Logger | Database | Cache | NewService;
 * ```
 */
export type ServiceType =
  | Logger
  | FoundryGame
  | FoundryHooks
  | FoundryDocument
  | FoundryUI
  | FoundrySettings
  | FoundryI18n
  | PortSelector
  | PortRegistry<FoundryGame>
  | PortRegistry<FoundryHooks>
  | PortRegistry<FoundryDocument>
  | PortRegistry<FoundryUI>
  | PortRegistry<FoundrySettings>
  | PortRegistry<FoundryI18n>
  | JournalVisibilityService
  | MetricsCollector
  | MetricsRecorder
  | MetricsSampler
  | MetricsStorage
  | TraceContext
  | FoundryI18nPort
  | FoundryJournalFacade
  | PlatformJournalEventPort
  | LocalI18nService
  | I18nFacadeService
  | ModuleHealthService
  | EnvironmentConfig
  | PerformanceTrackingService
  | RetryService
  | PortSelectionEventEmitter
  | ObservabilityRegistry
  | ModuleSettingsRegistrar
  | ModuleApiInitializer
  | ContainerHealthCheck
  | MetricsHealthCheck
  | HealthCheckRegistry
  | TranslationHandler
  | NotificationChannel
  | NotificationService
  | Container
  | CacheService
  | CacheServiceConfig
  | RuntimeConfigService
  | InvalidateJournalCacheOnChangeUseCase
  | ProcessJournalDirectoryOnRenderUseCase
  | TriggerJournalDirectoryReRenderUseCase
  | RegisterContextMenuUseCase
  | ModuleEventRegistrar
  | PlatformUIPort
  | PlatformSettingsPort
  | HideJournalContextMenuHandler
  | LibWrapperService
  | JournalContextMenuLibWrapperService
  | ServiceContainer
  | BootstrapInitHookService
  | BootstrapReadyHookService
  | JournalCollectionPort
  | JournalRepository
  | BootstrapHooksPort
  | SettingsRegistrationPort
  | ContextMenuRegistrationPort
  | PlatformNotificationPort
  | PlatformCachePort
  | PlatformI18nPort
  | JournalVisibilityConfig
  | ContainerPort
  | JournalDirectoryUiPort
  | NotificationPort
  | TranslationHandler[]
  | JournalContextMenuHandler[];
