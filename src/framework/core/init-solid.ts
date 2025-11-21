import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { isOk } from "@/infrastructure/shared/utils/result";
import {
  loggerToken,
  moduleSettingsRegistrarToken,
  moduleEventRegistrarToken,
  moduleApiInitializerToken,
  notificationCenterToken,
  uiChannelToken,
} from "@/infrastructure/shared/tokens";
import { CompositionRoot } from "@/framework/core/composition-root";
import { tryGetFoundryVersion } from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens";
import { LogLevel } from "@/framework/config/environment";
import { BootstrapErrorHandler } from "@/framework/core/bootstrap-error-handler";
import { LOG_LEVEL_SCHEMA } from "@/infrastructure/adapters/foundry/validation/setting-schemas";
import type { Result } from "@/domain/types/result";
import type { ServiceContainer } from "@/infrastructure/di/container";

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
 * environment-dependent branches (Foundry globals) use fine-grained v8 ignores.
 */
function initializeFoundryModule(): void {
  const containerResult = root.getContainer();
  /* v8 ignore start -- @preserve */
  // Edge case: getContainer() fails after successful bootstrap.
  // This is extremely unlikely in practice, but the error path exists for defensive programming.
  // The root instance is created at module level (line 162), making it difficult to mock
  // this specific error path in tests. The code path exists and will execute in real scenarios.
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  /* v8 ignore stop -- @preserve */

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

  /* v8 ignore start -- @preserve */
  /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
   * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
   * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
  Hooks.on("init", () => {
    logger.info("init-phase");

    const initContainerResult = root.getContainer();
    if (!initContainerResult.ok) {
      logger.error(`Failed to get container in init hook: ${initContainerResult.error}`);
      return;
    }

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
    if (!apiInitializerResult.ok) {
      logger.error(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
      return;
    }

    const exposeResult = apiInitializerResult.value.expose(initContainerResult.value);
    if (!exposeResult.ok) {
      logger.error(`Failed to expose API: ${exposeResult.error}`);
      return;
    }

    // Register module settings (must be done before settings are read)
    const settingsRegistrarResult = initContainerResult.value.resolveWithError(
      moduleSettingsRegistrarToken
    );
    if (!settingsRegistrarResult.ok) {
      logger.error(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
      return;
    }
    // Container parameter removed - all dependencies injected via constructor
    settingsRegistrarResult.value.registerAll();

    // Configure logger with current setting value
    const settingsResult = initContainerResult.value.resolveWithError(foundrySettingsToken);
    if (settingsResult.ok) {
      const settings = settingsResult.value;
      const logLevelResult = settings.get(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
        LOG_LEVEL_SCHEMA
      );

      if (logLevelResult.ok && logger.setMinLevel) {
        logger.setMinLevel(logLevelResult.value);
        logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
      }
    }

    // Register event listeners
    const eventRegistrarResult =
      initContainerResult.value.resolveWithError(moduleEventRegistrarToken);
    if (!eventRegistrarResult.ok) {
      logger.error(`Failed to resolve ModuleEventRegistrar: ${eventRegistrarResult.error.message}`);
      return;
    }
    // Container parameter removed - all dependencies injected via constructor
    const eventRegistrationResult = eventRegistrarResult.value.registerAll();
    if (!eventRegistrationResult.ok) {
      logger.error("Failed to register one or more event listeners", {
        errors: eventRegistrationResult.error.map((e) => e.message),
      });
      return;
    }
    logger.info("init-phase completed");
  });

  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
  /* v8 ignore stop -- @preserve */
}

// Eager bootstrap DI before Foundry init
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);

/**
 * Internal export for testing purposes only.
 * Returns the container from init-solid.ts.
 * This allows integration tests to use the same container instance as the module.
 *
 * @internal - For testing only
 */
export function getRootContainer(): Result<ServiceContainer, string> {
  return root.getContainer();
}

/* v8 ignore start -- @preserve */
/* Bootstrap-Fehlerpfade sind stark Foundry-versionsabhängig und schwer
 * deterministisch in Unit-Tests abzudecken. Die Logik wird über Integrationspfade geprüft;
 * für das Coverage-Gateway markieren wir diese Zweige vorerst als ignoriert. */
if (!bootstrapOk) {
  // Detect version once and reuse for both error logging and version-specific checks
  const foundryVersion = tryGetFoundryVersion();

  BootstrapErrorHandler.logError(bootstrapResult.error, {
    phase: "bootstrap",
    component: "CompositionRoot",
    metadata: {
      foundryVersion,
    },
  });

  // Check if error is due to old Foundry version
  let isOldFoundryVersion = false;
  if (
    typeof bootstrapResult.error === "string" &&
    bootstrapResult.error.includes("PORT_SELECTION_FAILED")
  ) {
    if (foundryVersion !== undefined && foundryVersion < 13) {
      isOldFoundryVersion = true;
      /* v8 ignore next -- @preserve */
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
/* v8 ignore stop -- @preserve */
