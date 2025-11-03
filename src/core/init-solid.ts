import { MODULE_CONSTANTS } from "../constants";
import { isOk } from "@/utils/result";
import { loggerToken } from "@/tokens/tokenindex";
import { CompositionRoot } from "@/core/composition-root";
import { ModuleHookRegistrar } from "@/core/module-hook-registrar";

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
  const logger = root.getContainerOrThrow().resolve(loggerToken);

  // Guard: Ensure Foundry Hooks API is available
  if (typeof Hooks === "undefined") {
    logger.warn("Foundry Hooks API not available - module initialization skipped");
    return; // Soft abort - OK inside function
  }

  Hooks.on("init", () => {
    logger.info("init-phase");
    root.exposeToModuleApi();
    new ModuleHookRegistrar().registerAll(root.getContainerOrThrow());
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
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} bootstrap failed`);
  console.error(bootstrapResult.error);

  // Graceful degradation: Show UI notification if available
  if (typeof ui !== "undefined" && ui?.notifications) {
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
