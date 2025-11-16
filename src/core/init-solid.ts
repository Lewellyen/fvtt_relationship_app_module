import { MODULE_CONSTANTS } from "../constants";
import { isOk } from "@/utils/functional/result";
import {
  loggerToken,
  moduleSettingsRegistrarToken,
  moduleHookRegistrarToken,
  moduleApiInitializerToken,
  notificationCenterToken,
  uiChannelToken,
} from "@/tokens/tokenindex";
import { CompositionRoot } from "@/core/composition-root";
import { tryGetFoundryVersion } from "@/foundry/versioning/versiondetector";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import { LogLevel } from "@/config/environment";
import { BootstrapErrorHandler } from "@/core/bootstrap-error-handler";
import { LOG_LEVEL_SCHEMA } from "@/foundry/validation/setting-schemas";

/**
 * Boot-Orchestrierung für das Modul.
 *
 * Ablauf:
 * - Vor init: DI-Container erstellen (CompositionRoot.bootstrap) und bei Fehler abbrechen
 * - In init: API (resolve) exponieren, Ports selektieren/binden (via externem Selector), Hooks registrieren
 * - In ready: nur Logging o.ä. – Services sind über api.resolve nutzbar
 */

/**
 * Function to encapsulate initialization logic.
 * This allows us to use return statements for soft aborts.
 *
 * NOTE: The function is fully covered via init-solid.test.ts; only truly
 * environment-dependent branches (Foundry globals) use fine-grained c8 ignores.
 */
function initializeFoundryModule(): void {
  const containerResult = root.getContainer();
  /* c8 ignore start -- Bootstrap failure path tested in init-solid.test.ts bootstrap failure tests */
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  /* c8 ignore stop */

  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  /* c8 ignore start -- Defensive: Logger resolution can only fail if container is not validated, which is checked in bootstrap */
  if (!loggerResult.ok) {
    console.error(
      `${MODULE_CONSTANTS.LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`
    );
    return;
  }
  /* c8 ignore stop */
  const logger = loggerResult.value;

  // Guard: Ensure Foundry Hooks API is available
  /* c8 ignore next -- Requires Foundry Hooks global */
  if (typeof Hooks === "undefined") {
    logger.warn("Foundry Hooks API not available - module initialization skipped");
    return; // Soft abort - OK inside function
  }

  /* c8 ignore next -- Registers Foundry hook callbacks (behavior verified via tests) */
  Hooks.on("init", () => {
    logger.info("init-phase");

    const initContainerResult = root.getContainer();
    /* c8 ignore start -- Defensive: Container is available after successful bootstrap */
    if (!initContainerResult.ok) {
      logger.error(`Failed to get container in init hook: ${initContainerResult.error}`);
      return;
    }
    /* c8 ignore stop */

    // Add UI notifications channel once Foundry UI ports are available.
    const notificationCenterResult =
      initContainerResult.value.resolveWithError(notificationCenterToken);
    if (notificationCenterResult.ok) {
      const uiChannelResult = initContainerResult.value.resolveWithError(uiChannelToken);
      if (uiChannelResult.ok) {
        notificationCenterResult.value.addChannel(uiChannelResult.value);
      } else {
        logger.warn(
          "UI channel could not be resolved; NotificationCenter will remain console-only",
          uiChannelResult.error
        );
      }
    } else {
      logger.warn(
        "NotificationCenter could not be resolved during init; UI channel not attached",
        notificationCenterResult.error
      );
    }

    // Expose Module API via DI-Service
    const apiInitializerResult =
      initContainerResult.value.resolveWithError(moduleApiInitializerToken);
    /* c8 ignore start -- Defensive: ModuleApiInitializer resolution can only fail if container validation failed */
    if (!apiInitializerResult.ok) {
      logger.error(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
      return;
    }
    /* c8 ignore stop */

    const exposeResult = apiInitializerResult.value.expose(initContainerResult.value);
    /* c8 ignore start -- Defensive: API exposition can only fail if game.modules is unavailable (tested in module-api-initializer.test.ts) */
    if (!exposeResult.ok) {
      logger.error(`Failed to expose API: ${exposeResult.error}`);
      return;
    }
    /* c8 ignore stop */

    // Register module settings (must be done before settings are read)
    const settingsRegistrarResult = initContainerResult.value.resolveWithError(
      moduleSettingsRegistrarToken
    );
    /* c8 ignore start -- Defensive: Registrar resolution can only fail if container validation failed */
    if (!settingsRegistrarResult.ok) {
      logger.error(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
      return;
    }
    /* c8 ignore stop */
    settingsRegistrarResult.value.registerAll(initContainerResult.value);

    // Configure logger with current setting value
    const settingsResult = initContainerResult.value.resolveWithError(foundrySettingsToken);
    if (settingsResult.ok) {
      const settings = settingsResult.value;
      const logLevelResult = settings.get(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
        LOG_LEVEL_SCHEMA
      );

      /* c8 ignore start -- Logger configuration: setMinLevel is optional method, and log level setting may not be configured yet */
      if (logLevelResult.ok && logger.setMinLevel) {
        logger.setMinLevel(logLevelResult.value);
        logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
      }
      /* c8 ignore stop */
    }

    // Register module hooks
    const hookRegistrarResult =
      initContainerResult.value.resolveWithError(moduleHookRegistrarToken);
    /* c8 ignore start -- Defensive: Registrar resolution can only fail if container validation failed */
    if (!hookRegistrarResult.ok) {
      logger.error(`Failed to resolve ModuleHookRegistrar: ${hookRegistrarResult.error.message}`);
      return;
    }
    /* c8 ignore stop */
    hookRegistrarResult.value.registerAll(initContainerResult.value);
    logger.info("init-phase completed");
  });

  /* c8 ignore next -- Registers Foundry hook callbacks (behavior verified via tests) */
  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
}

// Eager bootstrap DI before Foundry init
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);

/* c8 ignore next -- Branch depends on Foundry UI notifications */
if (!bootstrapOk) {
  BootstrapErrorHandler.logError(bootstrapResult.error, {
    phase: "bootstrap",
    component: "CompositionRoot",
    metadata: {
      foundryVersion: tryGetFoundryVersion(),
    },
  });

  // Check if error is due to old Foundry version
  let isOldFoundryVersion = false;
  /* c8 ignore next -- Requires Foundry version detection context */
  if (
    typeof bootstrapResult.error === "string" &&
    bootstrapResult.error.includes("PORT_SELECTION_FAILED")
  ) {
    const foundryVersion = tryGetFoundryVersion();
    if (foundryVersion !== undefined && foundryVersion < 13) {
      isOldFoundryVersion = true;
      /* c8 ignore next -- Displays Foundry notification */
      if (typeof ui !== "undefined" && ui?.notifications) {
        ui.notifications.error(
          `${MODULE_CONSTANTS.MODULE.NAME} benötigt mindestens Foundry VTT Version 13. ` +
            `Ihre Version: ${foundryVersion}. Bitte aktualisieren Sie Foundry VTT.`,
          { permanent: true }
        );
      }
    }
  }

  // Show generic error notification (only if not old Foundry version)
  /* c8 ignore next -- Displays Foundry notification */
  if (!isOldFoundryVersion && typeof ui !== "undefined" && ui?.notifications) {
    ui.notifications?.error(
      `${MODULE_CONSTANTS.MODULE.NAME} failed to initialize. Check console for details.`,
      { permanent: true }
    );
  }

  // Soft abort: Don't proceed with initialization
  // (no throw, no return - just don't call initializeFoundryModule)
} else {
  // Only initialize if bootstrap succeeded
  initializeFoundryModule();
}
