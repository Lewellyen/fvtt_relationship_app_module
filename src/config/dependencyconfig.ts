import { ServiceContainer } from "@/di_infrastructure/container";
import { ok, err, isErr } from "@/utils/functional/result";
import type { Result } from "@/types/result";
import type { Logger } from "@/interfaces/logger";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { LogLevel } from "@/config/environment";
import type { EnvironmentConfig } from "@/config/environment";

// Import config modules
import { registerCoreServices } from "@/config/modules/core-services.config";
import { registerObservability } from "@/config/modules/observability.config";
import { registerPortInfrastructure } from "@/config/modules/port-infrastructure.config";
import { registerFoundryServices } from "@/config/modules/foundry-services.config";
import { registerUtilityServices } from "@/config/modules/utility-services.config";
import { registerI18nServices } from "@/config/modules/i18n-services.config";
import { registerRegistrars } from "@/config/modules/registrars.config";

/**
 * Registers fallback factories for critical services.
 * Fallbacks are used when normal resolution fails.
 */
function registerFallbacks(container: ServiceContainer): void {
  container.registerFallback<Logger>(loggerToken, (): Logger => {
    // Fallback without EnvironmentConfig - DEBUG-Level for maximum transparency
    const fallbackConfig: EnvironmentConfig = {
      logLevel: LogLevel.DEBUG,
      isDevelopment: false,
      isProduction: false,
      enablePerformanceTracking: false,
      enableDebugMode: true,
      performanceSamplingRate: 1.0,
    };
    return new ConsoleLoggerService(fallbackConfig);
  });
}

/**
 * Validates the container configuration.
 * Ensures all dependencies are resolvable and no circular dependencies exist.
 */
function validateContainer(container: ServiceContainer): Result<void, string> {
  const validateResult = container.validate();
  /* c8 ignore start -- Defensive: Validation can only fail if dependencies are missing or circular */
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  /* c8 ignore stop */
  return ok(undefined);
}

/**
 * Configures all dependency injection mappings for the application.
 *
 * RESPONSIBILITY: Orchestrate registration of all service modules.
 *
 * DESIGN PRINCIPLES:
 * - Services are self-configuring via constructor dependencies
 * - Observability uses self-registration pattern
 * - No manual wiring - all connections via DI
 * - Modular config files by domain
 *
 * REGISTRATION ORDER:
 * 1. Fallbacks (Logger emergency fallback)
 * 2. Core Services (Logger, Metrics, Environment, ModuleHealth)
 * 3. Observability (EventEmitter, ObservabilityRegistry)
 * 4. Utility Services (Performance, Retry)
 * 5. Port Infrastructure (PortSelector, PortRegistries)
 * 6. Foundry Services (Game, Hooks, Document, UI, Settings, Journal)
 * 7. I18n Services (FoundryI18n, LocalI18n, I18nFacade)
 * 8. Registrars (ModuleSettingsRegistrar, ModuleHookRegistrar)
 * 9. Validation (Check dependency graph)
 *
 * @param container - The service container to configure
 * @returns Result indicating success or configuration errors
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.createRoot();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const logger = container.resolve(loggerToken);
 * }
 * ```
 */
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  registerFallbacks(container);

  // Register all service modules in order
  const coreResult = registerCoreServices(container);
  /* c8 ignore next -- Error propagation: Core services failure tested in sub-module */
  if (isErr(coreResult)) return coreResult;

  const observabilityResult = registerObservability(container);
  /* c8 ignore next -- Error propagation: Observability failure tested in sub-module */
  if (isErr(observabilityResult)) return observabilityResult;

  const utilityResult = registerUtilityServices(container);
  /* c8 ignore next -- Error propagation: Utility services failure tested in sub-module */
  if (isErr(utilityResult)) return utilityResult;

  const portInfraResult = registerPortInfrastructure(container);
  /* c8 ignore next -- Error propagation: Port infrastructure failure tested in sub-module */
  if (isErr(portInfraResult)) return portInfraResult;

  const foundryServicesResult = registerFoundryServices(container);
  /* c8 ignore next -- Error propagation: Foundry services failure tested in sub-module */
  if (isErr(foundryServicesResult)) return foundryServicesResult;

  const i18nServicesResult = registerI18nServices(container);
  /* c8 ignore next -- Error propagation: I18n services failure tested in sub-module */
  if (isErr(i18nServicesResult)) return i18nServicesResult;

  const registrarsResult = registerRegistrars(container);
  /* c8 ignore next -- Error propagation: Registrars failure tested in sub-module */
  if (isErr(registrarsResult)) return registrarsResult;

  // Validate container configuration
  const validationResult = validateContainer(container);
  /* c8 ignore next -- Error propagation: Validation failure tested in validateContainer */
  if (isErr(validationResult)) return validationResult;

  return ok(undefined);
}
