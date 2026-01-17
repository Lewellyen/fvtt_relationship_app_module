import { MODULE_METADATA, LOG_PREFIX } from "@/application/constants/app-constants";
import { isOk } from "@/domain/utils/result";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";
import { frameworkBootstrapInitHookServiceToken } from "@/framework/tokens/bootstrap-init-hook-service.token";
import { frameworkBootstrapReadyHookServiceToken } from "@/framework/tokens/bootstrap-ready-hook-service.token";
import { CompositionRoot } from "@/framework/core/composition-root";
import { tryGetFoundryVersion } from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { BootstrapErrorHandler } from "@/framework/core/bootstrap-error-handler";
import type { Result } from "@/domain/types/result";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { BootstrapHookService } from "@/framework/core/bootstrap/bootstrap-hook-service.interface";

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
 * NOTE: The function is fully covered via init-solid.test.ts.
 */
function initializeFoundryModule(): void {
  const containerResult = root.getContainer();
  // Edge case: getContainer() fails after successful bootstrap.
  // This is extremely unlikely in practice, but the error path exists for defensive programming.
  // The root instance is created at module level (line 162), making it difficult to mock
  // this specific error path in tests. The code path exists and will execute in real scenarios.
  if (!containerResult.ok) {
    console.error(`${LOG_PREFIX} ${containerResult.error}`);
    return;
  }

  const loggerResult = containerResult.value.resolveWithError(platformLoggingPortToken);
  if (!loggerResult.ok) {
    console.error(`${LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`);
    return;
  }
  const logger: PlatformLoggingPort = loggerResult.value;

  // Resolve bootstrap hook services and register hooks
  // CRITICAL: Use direct Hooks.on() for init/ready hooks to avoid chicken-egg problem.
  // The PlatformEventPort system requires version detection (game.version), but game.version
  // might not be available before the init hook runs. These bootstrap hooks must be registered
  // immediately, so we use direct Foundry Hooks API here.
  // All other hooks (registered inside init) can use PlatformEventPort normally.
  const initHookServiceResult = containerResult.value.resolveWithError(
    frameworkBootstrapInitHookServiceToken
  );
  if (!initHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapInitHookService: ${initHookServiceResult.error.message}`
    );
    return;
  }
  const initHookService: BootstrapHookService = initHookServiceResult.value;
  initHookService.register();

  const readyHookServiceResult = containerResult.value.resolveWithError(
    frameworkBootstrapReadyHookServiceToken
  );
  if (!readyHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapReadyHookService: ${readyHookServiceResult.error.message}`
    );
    return;
  }
  const readyHookService: BootstrapHookService = readyHookServiceResult.value;
  readyHookService.register();
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

// Bootstrap-Fehlerpfade sind stark Foundry-versionsabhängig und schwer
// deterministisch in Unit-Tests abzudecken. Die Logik wird über Integrationspfade geprüft.
if (!bootstrapOk) {
  // Detect version once and reuse for both error logging and version-specific checks
  /* v8 ignore start */
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
      if (typeof ui !== "undefined" && ui?.notifications) {
        ui.notifications.error(
          `${MODULE_METADATA.NAME} benötigt mindestens Foundry VTT Version 13. ` +
            `Ihre Version: ${foundryVersion}. Bitte aktualisieren Sie Foundry VTT.`,
          { permanent: true }
        );
      }
    }
  }

  // Show generic error notification (only if not old Foundry version)
  if (!isOldFoundryVersion && typeof ui !== "undefined" && ui?.notifications) {
    ui.notifications?.error(
      `${MODULE_METADATA.NAME} failed to initialize. Check console for details.`,
      { permanent: true }
    );
  }

  // Soft abort: Don't proceed with initialization
  // (no throw, no return - just don't call initializeFoundryModule)
  /* v8 ignore stop */
} else {
  // Only initialize if bootstrap succeeded
  initializeFoundryModule();
}
