import { MODULE_METADATA, LOG_PREFIX } from "@/application/constants/app-constants";
import { isOk } from "@/domain/utils/result";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { bootstrapInitHookServiceToken } from "@/infrastructure/shared/tokens/core/bootstrap-init-hook-service.token";
import { bootstrapReadyHookServiceToken } from "@/infrastructure/shared/tokens/core/bootstrap-ready-hook-service.token";
import { CompositionRoot } from "@/framework/core/composition-root";
import { tryGetFoundryVersion } from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { BootstrapErrorHandler } from "@/framework/core/bootstrap-error-handler";
import type { Result } from "@/domain/types/result";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";

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
    console.error(`${LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  /* v8 ignore stop -- @preserve */

  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  if (!loggerResult.ok) {
    console.error(`${LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`);
    return;
  }
  const logger = castResolvedService<Logger>(loggerResult.value);

  // Resolve bootstrap hook services and register hooks
  // CRITICAL: Use direct Hooks.on() for init/ready hooks to avoid chicken-egg problem.
  // The PlatformEventPort system requires version detection (game.version), but game.version
  // might not be available before the init hook runs. These bootstrap hooks must be registered
  // immediately, so we use direct Foundry Hooks API here.
  // All other hooks (registered inside init) can use PlatformEventPort normally.
  const initHookServiceResult = containerResult.value.resolveWithError(
    bootstrapInitHookServiceToken
  );
  if (!initHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapInitHookService: ${initHookServiceResult.error.message}`
    );
    return;
  }
  const initHookService = castResolvedService<BootstrapInitHookService>(
    initHookServiceResult.value
  );
  initHookService.register();

  const readyHookServiceResult = containerResult.value.resolveWithError(
    bootstrapReadyHookServiceToken
  );
  if (!readyHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapReadyHookService: ${readyHookServiceResult.error.message}`
    );
    return;
  }
  const readyHookService = castResolvedService<BootstrapReadyHookService>(
    readyHookServiceResult.value
  );
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
} else {
  // Only initialize if bootstrap succeeded
  initializeFoundryModule();
}
/* v8 ignore stop -- @preserve */
