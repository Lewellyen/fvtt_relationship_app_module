import { MODULE_CONSTANTS } from "../constants";
import { isOk } from "@/utils/result";
import { loggerToken } from "@/tokens/tokenindex";
import { CompositionRoot } from "@/core/composition-root";
import { ModuleHookRegistrar } from "@/core/module-hook-registrar";
import { ModuleSettingsRegistrar } from "@/core/module-settings-registrar";
import { tryGetFoundryVersion } from "@/foundry/versioning/versiondetector";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import { LogLevel } from "@/config/environment";
import { BootstrapErrorHandler } from "@/core/bootstrap-error-handler";

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
 */
function initializeFoundryModule(): void {
  const containerResult = root.getContainer();
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }

  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  if (!loggerResult.ok) {
    console.error(
      `${MODULE_CONSTANTS.LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`
    );
    return;
  }
  const logger = loggerResult.value;

  // Guard: Ensure Foundry Hooks API is available
  if (typeof Hooks === "undefined") {
    logger.warn("Foundry Hooks API not available - module initialization skipped");
    return; // Soft abort - OK inside function
  }

  Hooks.on("init", () => {
    logger.info("init-phase");
    root.exposeToModuleApi();

    const initContainerResult = root.getContainer();
    if (!initContainerResult.ok) {
      logger.error(`Failed to get container in init hook: ${initContainerResult.error}`);
      return;
    }

    // Register module settings (must be done before settings are read)
    new ModuleSettingsRegistrar().registerAll(initContainerResult.value);

    // Configure logger with current setting value
    const settingsResult = initContainerResult.value.resolveWithError(foundrySettingsToken);
    if (settingsResult.ok) {
      const settings = settingsResult.value;
      const logLevelResult = settings.get<number>(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL
      );

      if (logLevelResult.ok && logger.setMinLevel) {
        logger.setMinLevel(logLevelResult.value as LogLevel);
        logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
      }
    }

    // Register module hooks
    new ModuleHookRegistrar().registerAll(initContainerResult.value);
    logger.info("init-phase completed");
  });

  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
}

/**
 * Leerer Platzhalter – frühere Initialisierung ist jetzt in den Bootkernel ausgelagert.
 */
export function initializeModule(): void {}

// Eager bootstrap DI before Foundry init
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);

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
  if (
    typeof bootstrapResult.error === "string" &&
    bootstrapResult.error.includes("PORT_SELECTION_FAILED")
  ) {
    const foundryVersion = tryGetFoundryVersion();
    if (foundryVersion !== undefined && foundryVersion < 13) {
      isOldFoundryVersion = true;
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
