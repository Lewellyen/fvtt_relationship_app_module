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
// Hook-spezifische Logik ist in ModuleHookRegistrar ausgelagert

/**
 * Leerer Platzhalter – frühere Initialisierung ist jetzt in den Bootkernel ausgelagert.
 */
export function initializeModule(): void {}

/**
 * Initializes the module when Foundry VTT starts.
 * Registers hooks for hiding journal entries based on module flags.
 */

// Eager bootstrap DI before Foundry init
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);

if (!bootstrapOk) {
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} bootstrap failed`);
  console.error(bootstrapResult.error);
  throw new Error(bootstrapResult.error);
}

const logger = root.getContainerOrThrow().resolve(loggerToken);

// Guard: Ensure Foundry Hooks API is available before registering hooks
if (typeof Hooks === "undefined") {
  logger.warn("Foundry Hooks API not available - module initialization skipped");
  // Soft abort: Don't register hooks if Foundry isn't ready
  // This allows tests or non-standard environments to load the module
} else {
  Hooks.on("init", () => {
    logger.info("init-phase");
    // Expose API and register hooks
    root.exposeToModuleApi();
    new ModuleHookRegistrar().registerAll(root.getContainerOrThrow());
    logger.info("init-phase completed");
  });

  /**
   * Ready hook: Module initialization complete.
   * Executes when Foundry VTT is fully ready.
   */
  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
}
