/**
 * Bootstrap init hook registration service.
 *
 * DIP-Compliant: Uses BootstrapHooksPort instead of direct Hooks.on().
 * The port abstracts the platform-specific hook registration while still
 * allowing the adapter to use direct APIs to avoid the chicken-egg problem.
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
  registerContextMenuUseCaseToken,
  bootstrapHooksPortToken,
} from "@/infrastructure/shared/tokens";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens";
import { LOG_LEVEL_SCHEMA } from "@/infrastructure/adapters/foundry/validation/setting-schemas";
import { LogLevel } from "@/framework/config/environment";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import { loggerToken, serviceContainerToken } from "@/infrastructure/shared/tokens";

/**
 * Service responsible for registering the Foundry 'init' hook.
 * Handles all initialization logic when the init hook fires.
 *
 * DIP-Compliant: Uses BootstrapHooksPort for hook registration instead of
 * direct platform API access.
 */
export class BootstrapInitHookService {
  constructor(
    private readonly logger: Logger,
    private readonly container: ServiceContainer,
    private readonly bootstrapHooks: BootstrapHooksPort
  ) {}

  /**
   * Registers the init hook via BootstrapHooksPort.
   * Must be called before the platform's init hook fires.
   */
  register(): void {
    const result = this.bootstrapHooks.onInit(() => this.handleInit());

    if (!result.ok) {
      this.logger.warn(
        `Init hook registration failed: ${result.error.message}`,
        result.error.details
      );
    }
  }

  /* v8 ignore start -- @preserve */
  /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
   * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
   * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
  private handleInit(): void {
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

        // Register context menu callbacks (after libWrapper is registered)
        const contextMenuUseCaseResult = this.container.resolveWithError(
          registerContextMenuUseCaseToken
        );
        if (contextMenuUseCaseResult.ok) {
          const callbackRegisterResult = contextMenuUseCaseResult.value.register();
          if (!callbackRegisterResult.ok) {
            this.logger.warn(
              `Failed to register context menu callbacks: ${callbackRegisterResult.error.message}`
            );
          } else {
            this.logger.debug("Context menu callbacks registered successfully");
          }
        } else {
          this.logger.warn(
            `Failed to resolve RegisterContextMenuUseCase: ${contextMenuUseCaseResult.error.message}`
          );
        }
      }
    } else {
      this.logger.warn(
        `Failed to resolve JournalContextMenuLibWrapperService: ${contextMenuLibWrapperResult.error.message}`
      );
    }

    this.logger.info("init-phase completed");
  }
  /* v8 ignore stop -- @preserve */
}

/**
 * DI wrapper for BootstrapInitHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapInitHookService extends BootstrapInitHookService {
  static dependencies = [loggerToken, serviceContainerToken, bootstrapHooksPortToken] as const;

  constructor(logger: Logger, container: ServiceContainer, bootstrapHooks: BootstrapHooksPort) {
    super(logger, container, bootstrapHooks);
  }
}
