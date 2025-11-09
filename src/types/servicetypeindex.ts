/**
 * Type definitions for all service types used in dependency injection.
 */
import type { Logger } from "@/interfaces/logger";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import type { MetricsCollector } from "@/observability/metrics-collector";
import type { MetricsRecorder } from "@/observability/interfaces/metrics-recorder";
import type { MetricsSampler } from "@/observability/interfaces/metrics-sampler";
import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { LocalI18nService } from "@/services/LocalI18nService";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { ModuleHealthService } from "@/core/module-health-service";
import type { EnvironmentConfig } from "@/config/environment";
import type { PerformanceTrackingService } from "@/services/PerformanceTrackingService";
import type { RetryService } from "@/services/RetryService";

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
  | FoundryI18nService
  | FoundryJournalFacade
  | LocalI18nService
  | I18nFacadeService
  | ModuleHealthService
  | EnvironmentConfig
  | PerformanceTrackingService
  | RetryService;
