import type { ServiceContainer } from "@/di_infrastructure/container";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { Logger } from "@/interfaces/logger";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import {
  loggerToken,
  i18nFacadeToken,
  notificationCenterToken,
  runtimeConfigToken,
} from "@/tokens/tokenindex";

export interface ModuleSettingsContext {
  notifications: NotificationCenter;
  foundrySettings: FoundrySettings;
  logger: Logger;
  i18n: I18nFacadeService;
  runtimeConfig: RuntimeConfigService;
}

/**
 * Centralized resolver for ModuleSettingsRegistrar dependencies.
 * Keeps lazy resolution inside init-hook while avoiding repeated
 * Service-Locator calls in the registrar itself.
 */
export class ModuleSettingsContextResolver {
  resolve(container: ServiceContainer): ModuleSettingsContext | null {
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!notificationCenterResult.ok) {
      console.error("Failed to resolve NotificationCenter for ModuleSettingsRegistrar", {
        error: notificationCenterResult.error,
      });
      return null;
    }

    const notifications = notificationCenterResult.value;

    const foundrySettingsResult = container.resolveWithError(foundrySettingsToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const i18nResult = container.resolveWithError(i18nFacadeToken);
    const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);

    if (
      !foundrySettingsResult.ok ||
      !loggerResult.ok ||
      !i18nResult.ok ||
      !runtimeConfigResult.ok
    ) {
      notifications.error(
        "DI resolution failed in ModuleSettingsRegistrar",
        {
          code: "DI_RESOLUTION_FAILED",
          message: "Required services for ModuleSettingsRegistrar are missing",
          details: {
            settingsResolved: foundrySettingsResult.ok,
            i18nResolved: i18nResult.ok,
            loggerResolved: loggerResult.ok,
            runtimeConfigResolved: runtimeConfigResult.ok,
          },
        },
        { channels: ["ConsoleChannel"] }
      );
      return null;
    }

    return {
      notifications,
      foundrySettings: foundrySettingsResult.value,
      logger: loggerResult.value,
      i18n: i18nResult.value,
      runtimeConfig: runtimeConfigResult.value,
    };
  }
}
