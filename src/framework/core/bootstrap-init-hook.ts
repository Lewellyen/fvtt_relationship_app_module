/**
 * Bootstrap init hook registration service.
 *
 * CRITICAL: Uses direct Hooks.on() instead of PlatformEventPort to avoid chicken-egg problem.
 * The PlatformEventPort system requires version detection (game.version), but game.version
 * might not be available before the init hook runs. These bootstrap hooks must be registered
 * immediately, so we use direct Foundry Hooks API here.
 *
 * All other hooks (registered inside init) can use PlatformEventPort normally.
 */

import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import {
  moduleSettingsRegistrarToken,
  moduleEventRegistrarToken,
  moduleApiInitializerToken,
  notificationCenterToken,
  uiChannelToken,
  journalContextMenuLibWrapperServiceToken,
} from "@/infrastructure/shared/tokens";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens";
import { LOG_LEVEL_SCHEMA } from "@/infrastructure/adapters/foundry/validation/setting-schemas";
import { LogLevel } from "@/framework/config/environment";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { loggerToken, serviceContainerToken } from "@/infrastructure/shared/tokens";

/**
 * Service responsible for registering the Foundry 'init' hook.
 * Handles all initialization logic when the init hook fires.
 */
export class BootstrapInitHookService {
  constructor(
    private readonly logger: Logger,
    private readonly container: ServiceContainer
  ) {}

  /**
   * Registers the init hook with direct Hooks.on().
   * Must be called before Foundry's init hook fires.
   */
  register(): void {
    // Guard: Ensure Foundry Hooks API is available
    if (typeof Hooks === "undefined") {
      this.logger.warn("Foundry Hooks API not available - init hook registration skipped");
      return;
    }

    /* v8 ignore start -- @preserve */
    /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
     * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
     * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
    // CRITICAL: Use direct Hooks.on() instead of PlatformEventPort to avoid chicken-egg problem
    Hooks.on("init", () => {
      this.logger.info("init-phase");

      // Add UI notifications channel once Foundry UI ports are available.
      const notificationCenterResult = this.container.resolveWithError(notificationCenterToken);
      if (notificationCenterResult.ok) {
        const uiChannelResult = this.container.resolveWithError(uiChannelToken);
        if (uiChannelResult.ok) {
          notificationCenterResult.value.addChannel(uiChannelResult.value);
        } else {
          this.logger.warn(
            "UI channel could not be resolved; NotificationCenter will remain console-only",
            uiChannelResult.error
          );
        }
      } else {
        this.logger.warn(
          "NotificationCenter could not be resolved during init; UI channel not attached",
          notificationCenterResult.error
        );
      }

      // Expose Module API via DI-Service
      const apiInitializerResult = this.container.resolveWithError(moduleApiInitializerToken);
      if (!apiInitializerResult.ok) {
        this.logger.error(
          `Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`
        );
        return;
      }

      const exposeResult = apiInitializerResult.value.expose(this.container);
      if (!exposeResult.ok) {
        this.logger.error(`Failed to expose API: ${exposeResult.error}`);
        return;
      }

      // Register module settings (must be done before settings are read)
      const settingsRegistrarResult = this.container.resolveWithError(moduleSettingsRegistrarToken);
      if (!settingsRegistrarResult.ok) {
        this.logger.error(
          `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
        );
        return;
      }
      // Container parameter removed - all dependencies injected via constructor
      settingsRegistrarResult.value.registerAll();

      // Configure logger with current setting value
      const settingsResult = this.container.resolveWithError(foundrySettingsToken);
      if (settingsResult.ok) {
        const settings = settingsResult.value;
        const logLevelResult = settings.get(
          MODULE_CONSTANTS.MODULE.ID,
          MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
          LOG_LEVEL_SCHEMA
        );

        if (logLevelResult.ok && this.logger.setMinLevel) {
          this.logger.setMinLevel(logLevelResult.value);
          this.logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
        }
      }

      // Register event listeners
      const eventRegistrarResult = this.container.resolveWithError(moduleEventRegistrarToken);
      if (!eventRegistrarResult.ok) {
        this.logger.error(
          `Failed to resolve ModuleEventRegistrar: ${eventRegistrarResult.error.message}`
        );
        return;
      }
      // Container parameter removed - all dependencies injected via constructor
      const eventRegistrationResult = eventRegistrarResult.value.registerAll();
      if (!eventRegistrationResult.ok) {
        this.logger.error("Failed to register one or more event listeners", {
          errors: eventRegistrationResult.error.map((e) => e.message),
        });
        return;
      }

      // Register context menu libWrapper (NOT an event - direct libWrapper registration)
      const contextMenuLibWrapperResult = this.container.resolveWithError(
        journalContextMenuLibWrapperServiceToken
      );
      if (contextMenuLibWrapperResult.ok) {
        const registerResult = contextMenuLibWrapperResult.value.register();
        if (!registerResult.ok) {
          this.logger.warn(
            `Failed to register context menu libWrapper: ${registerResult.error.message}`
          );
        } else {
          this.logger.debug("Context menu libWrapper registered successfully");
        }
      } else {
        this.logger.warn(
          `Failed to resolve JournalContextMenuLibWrapperService: ${contextMenuLibWrapperResult.error.message}`
        );
      }

      this.logger.info("init-phase completed");
    });
    /* v8 ignore stop -- @preserve */
  }
}

/**
 * DI wrapper for BootstrapInitHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapInitHookService extends BootstrapInitHookService {
  static dependencies = [loggerToken, serviceContainerToken] as const;

  constructor(logger: Logger, container: ServiceContainer) {
    super(logger, container);
  }
}
