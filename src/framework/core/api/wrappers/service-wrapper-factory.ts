import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { IServiceWrapperFactory } from "../interfaces/api-component-interfaces";
import {
  createPublicI18n,
  createPublicNotificationCenter,
  createPublicFoundrySettings,
} from "../public-api-wrappers";
import {
  wrapFoundrySettingsPort,
  wrapI18nService,
  wrapNotificationCenterService,
} from "@/infrastructure/di/types/utilities/api-casts";

/**
 * ServiceWrapperFactory
 *
 * Responsible for wrapping sensitive services with read-only wrappers.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 */
export class ServiceWrapperFactory implements IServiceWrapperFactory {
  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
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
    if (token === wellKnownTokens.i18nFacadeToken) {
      return wrapI18nService(service, createPublicI18n);
    }

    if (token === wellKnownTokens.notificationCenterToken) {
      return wrapNotificationCenterService(service, createPublicNotificationCenter);
    }

    if (token === wellKnownTokens.foundrySettingsToken) {
      return wrapFoundrySettingsPort(service, createPublicFoundrySettings);
    }

    // Default: return original service for read-only or safe services
    return service;
  }
}
