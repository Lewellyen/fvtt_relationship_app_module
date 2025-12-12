import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { IServiceWrapperFactory } from "../interfaces/api-component-interfaces";
import { ApiWrapperStrategyRegistry } from "./strategies/api-wrapper-strategy-registry";
import { I18nWrapperStrategy } from "./strategies/i18n-wrapper-strategy";
import { NotificationWrapperStrategy } from "./strategies/notification-wrapper-strategy";
import { SettingsWrapperStrategy } from "./strategies/settings-wrapper-strategy";
import { NoopWrapperStrategy } from "./strategies/noop-wrapper-strategy";

/**
 * ServiceWrapperFactory
 *
 * Responsible for wrapping sensitive services with read-only wrappers.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 *
 * Uses Strategy Pattern to follow Open/Closed Principle:
 * - New services can be wrapped by adding new strategies
 * - No modifications needed to this class or ModuleApiInitializer
 */
export class ServiceWrapperFactory implements IServiceWrapperFactory {
  private readonly strategyRegistry: ApiWrapperStrategyRegistry;

  constructor(strategyRegistry?: ApiWrapperStrategyRegistry) {
    this.strategyRegistry = strategyRegistry ?? this.createDefaultRegistry();
  }

  /**
   * Creates the default strategy registry with standard wrapper strategies.
   *
   * @returns Registry with I18n, Notification, Settings, and Noop strategies
   */
  private createDefaultRegistry(): ApiWrapperStrategyRegistry {
    const registry = new ApiWrapperStrategyRegistry();
    registry.registerAll([
      new I18nWrapperStrategy(),
      new NotificationWrapperStrategy(),
      new SettingsWrapperStrategy(),
      new NoopWrapperStrategy(), // Fallback strategy
    ]);
    return registry;
  }

  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
   *
   * Delegates to registered strategies following Open/Closed Principle.
   * No token-specific if/else chains - all logic is in strategies.
   *
   * @param token - API token used for resolution
   * @param service - Service resolved from the container
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service when applicable
   */
  wrapSensitiveService<TServiceType>(
    token: ApiSafeToken<TServiceType>,
    service: TServiceType,
    wellKnownTokens: ModuleApiTokens
  ): TServiceType {
    const strategy = this.strategyRegistry.findStrategy(token, wellKnownTokens);

    if (strategy) {
      return strategy.wrap(service, token, wellKnownTokens);
    }

    // Fallback: return service unchanged if no strategy found
    // (should not happen if NoopWrapperStrategy is registered)
    return service;
  }
}
