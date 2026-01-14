import { PUBLIC_API_VERSION } from "@/application/constants/app-constants";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { InjectionToken } from "@/application/di/injection-token";
import type { ModuleApi, TokenInfo, ModuleApiTokens } from "@/framework/core/api/module-api";
import type { IModuleApiBuilder } from "../interfaces/api-component-interfaces";
import { createApiTokens } from "../api-token-config";
import { getRegistrationStatus } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import {
  journalVisibilityServiceToken,
  journalDirectoryProcessorToken,
  graphDataServiceToken,
  nodeDataServiceToken,
} from "@/application/tokens/application.tokens";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { i18nFacadeToken } from "@/infrastructure/shared/tokens/i18n/i18n-facade.token";
import { foundryJournalFacadeToken } from "@/infrastructure/shared/tokens/foundry/foundry-journal-facade.token";
import { notificationCenterToken } from "@/application/tokens/notifications/notification-center.token";
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
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["journalDirectoryProcessorToken", journalDirectoryProcessorToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken],
          ["i18nFacadeToken", i18nFacadeToken],
          ["foundryJournalFacadeToken", foundryJournalFacadeToken],
          ["notificationCenterToken", notificationCenterToken],
          ["graphDataServiceToken", graphDataServiceToken],
          ["nodeDataServiceToken", nodeDataServiceToken],
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
