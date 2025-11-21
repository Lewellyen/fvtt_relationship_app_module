/**
 * Central token registry and ServiceType definition.
 *
 * This file re-exports all injection tokens and defines the ServiceType union
 * that represents all registered service types in the application.
 */
// Core tokens
export * from "./core.tokens";

// Observability tokens
export * from "./observability.tokens";

// I18n tokens
export * from "./i18n.tokens";

// Notification tokens
export * from "./notifications.tokens";

// Infrastructure tokens
export * from "./infrastructure.tokens";

// Foundry tokens
export * from "./foundry.tokens";

// Event tokens
export * from "./event.tokens";

// ServiceType union - represents all registered service types
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
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { FoundryI18nService } from "@/infrastructure/adapters/foundry/services/FoundryI18nService";
import type { FoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface";
import type { JournalVisibilityPort } from "@/domain/ports/journal-visibility-port.interface";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { LocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import type { EnvironmentConfig } from "@/framework/config/environment";
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
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { CacheService, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { InvalidateJournalCacheOnChangeUseCase } from "@/application/use-cases/invalidate-journal-cache-on-change.use-case";
import type { ProcessJournalDirectoryOnRenderUseCase } from "@/application/use-cases/process-journal-directory-on-render.use-case";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * Union type representing all registered service types in the application.
 * Add new service interfaces to this union as you create them.
 *
 * @example
 * ```typescript
 * // Add a new service:
 * export type ServiceType = Logger | Database | Cache;
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
  | FoundryI18nService
  | FoundryJournalFacade
  | JournalVisibilityPort
  | JournalEventPort
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
  | NotificationCenter
  | CacheService
  | CacheServiceConfig
  | RuntimeConfigService
  | InvalidateJournalCacheOnChangeUseCase
  | ProcessJournalDirectoryOnRenderUseCase
  | ModuleEventRegistrar
  | ServiceContainer;
