import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { Logger } from "@/interfaces/logger";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import type { MetricsCollector } from "@/observability/metrics-collector";
import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import type { LocalI18nService } from "@/services/LocalI18nService";
import type { I18nFacadeService } from "@/services/I18nFacadeService";

/**
 * Injection token for the application logger service.
 *
 * Resolves to ConsoleLoggerService, providing structured logging
 * with configurable log levels (DEBUG, INFO, WARN, ERROR).
 *
 * @example
 * ```typescript
 * const logger = container.resolve(loggerToken);
 * logger.info("Application started");
 * logger.error("Error occurred", { code: 500, details: error });
 * ```
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

/**
 * Injection token for the MetricsCollector service.
 *
 * Provides observability and performance tracking for the DI container.
 * Collects metrics about service resolutions, port selections, and cache performance.
 *
 * @example
 * ```typescript
 * const metrics = container.resolve(metricsCollectorToken);
 * metrics.recordResolution(someToken, 2.5, true);
 * const snapshot = metrics.getSnapshot();
 * console.table(snapshot);
 * ```
 */
export const metricsCollectorToken = createInjectionToken<MetricsCollector>("MetricsCollector");

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 * Handles hiding/showing entries in the Foundry UI and processes
 * journal directory rendering.
 *
 * @example
 * ```typescript
 * const service = container.resolve(journalVisibilityServiceToken);
 * const hidden = service.getHiddenJournalEntries();
 * if (hidden.ok) {
 *   console.log(`Found ${hidden.value.length} hidden entries`);
 * }
 * ```
 */
export const journalVisibilityServiceToken = createInjectionToken<JournalVisibilityService>(
  "JournalVisibilityService"
);

/**
 * Injection token for the FoundryI18nService.
 *
 * Provides access to Foundry VTT's i18n API via Port-Adapter pattern.
 * Automatically selects the correct port based on Foundry version.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(foundryI18nToken);
 * const result = i18n.localize("MODULE.SETTINGS.enableFeature");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
export const foundryI18nToken = createInjectionToken<FoundryI18nService>("FoundryI18nService");

/**
 * Injection token for the LocalI18nService.
 *
 * Provides Foundry-independent JSON-based translations.
 * Used as fallback when Foundry's i18n is unavailable.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(localI18nToken);
 * const result = i18n.translate("MODULE.SETTINGS.enableFeature");
 * console.log(result.value);
 * ```
 */
export const localI18nToken = createInjectionToken<LocalI18nService>("LocalI18nService");

/**
 * Injection token for the I18nFacadeService.
 *
 * Combines Foundry's i18n and local translations with intelligent fallback.
 * This is the recommended token to use for all internationalization needs.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 * const text = i18n.translate("MODULE.SETTINGS.enableFeature", "Enable Feature");
 * console.log(text);
 * ```
 */
export const i18nFacadeToken = createInjectionToken<I18nFacadeService>("I18nFacadeService");

/**
 * Re-export port-related tokens for convenience.
 * These are defined in @/foundry/foundrytokens but exported here for easier access.
 */
export { portSelectorToken } from "@/foundry/foundrytokens";
