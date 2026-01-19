import { PUBLIC_API_VERSION } from "@/application/constants/app-constants";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { InjectionToken } from "@/application/di/injection-token";
import type { ModuleApi, TokenInfo, ModuleApiTokens } from "@/framework/core/api/module-api";
import type { IModuleApiBuilder } from "../interfaces/api-component-interfaces";
import { createApiTokens } from "../api-token-config";
import { getRegistrationStatus } from "@/framework/core/utils/get-registration-status";
import {
  platformContainerPortToken,
  platformLoggingPortToken,
  platformMetricsSnapshotPortToken,
  platformSettingsPortToken,
  platformSettingsRegistrationPortToken,
  platformI18nPortToken,
  platformNotificationPortToken,
  platformUIPortToken,
  platformJournalDirectoryUiPortToken,
  platformJournalCollectionPortToken,
  platformUINotificationPortToken,
  platformValidationPortToken,
  platformContextMenuRegistrationPortToken,
  platformUuidUtilsPortToken,
  platformObjectUtilsPortToken,
  platformHtmlUtilsPortToken,
  platformAsyncUtilsPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { sheetFacadeToken } from "@/application/tokens/api-facades.tokens";
import type { IApiServiceResolver } from "../interfaces/api-component-interfaces";
import type { IApiHealthMetricsProvider } from "../interfaces/api-component-interfaces";

/**
 * ModuleApiBuilder
 *
 * Responsible for creating API objects and token collections.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 */
export class ModuleApiBuilder implements IModuleApiBuilder {
  constructor(
    private readonly serviceResolver: IApiServiceResolver,
    private readonly healthMetricsProvider: IApiHealthMetricsProvider
  ) {}

  /**
   * Creates the well-known API tokens collection.
   *
   * @returns Type-safe token collection for external modules
   */
  createApiTokens(): ModuleApiTokens {
    return createApiTokens();
  }

  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   */
  createApi(container: PlatformContainerPort, wellKnownTokens: ModuleApiTokens): ModuleApi {
    return {
      version: PUBLIC_API_VERSION,

      // Overloaded resolve method (throws on error)
      resolve: this.serviceResolver.createResolveFunction(container, wellKnownTokens),

      // Result-Pattern method (safe, never throws)
      resolveWithError: this.serviceResolver.createResolveWithErrorFunction(
        container,
        wellKnownTokens
      ),

      getAvailableTokens: (): Map<symbol, TokenInfo> => {
        const tokenMap = new Map<symbol, TokenInfo>();

        // Add well-known tokens with their registration status
        const tokenEntries: Array<[string, InjectionToken<unknown>]> = [
          ["platformContainerPortToken", platformContainerPortToken],
          ["platformLoggingPortToken", platformLoggingPortToken],
          ["platformMetricsSnapshotPortToken", platformMetricsSnapshotPortToken],
          ["platformSettingsPortToken", platformSettingsPortToken],
          ["platformSettingsRegistrationPortToken", platformSettingsRegistrationPortToken],
          ["platformI18nPortToken", platformI18nPortToken],
          ["platformNotificationPortToken", platformNotificationPortToken],
          ["platformUIPortToken", platformUIPortToken],
          ["platformJournalDirectoryUiPortToken", platformJournalDirectoryUiPortToken],
          ["platformJournalCollectionPortToken", platformJournalCollectionPortToken],
          ["platformUINotificationPortToken", platformUINotificationPortToken],
          ["platformValidationPortToken", platformValidationPortToken],
          ["platformContextMenuRegistrationPortToken", platformContextMenuRegistrationPortToken],
          ["platformUuidUtilsPortToken", platformUuidUtilsPortToken],
          ["platformObjectUtilsPortToken", platformObjectUtilsPortToken],
          ["platformHtmlUtilsPortToken", platformHtmlUtilsPortToken],
          ["platformAsyncUtilsPortToken", platformAsyncUtilsPortToken],
          ["sheetFacadeToken", sheetFacadeToken],
        ];

        for (const [, token] of tokenEntries) {
          const isRegisteredResult = container.isRegistered(token);
          tokenMap.set(token, {
            description: String(token).replace("Symbol(", "").replace(")", ""),
            isRegistered: getRegistrationStatus(isRegisteredResult),
          });
        }

        return tokenMap;
      },

      tokens: wellKnownTokens,

      getMetrics: () => this.healthMetricsProvider.getMetrics(container),

      getHealth: () => this.healthMetricsProvider.getHealth(container),
    };
  }
}
