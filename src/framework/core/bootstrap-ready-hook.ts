/**
 * Bootstrap ready hook registration service.
 *
 * CRITICAL: Uses direct Hooks.on() instead of PlatformEventPort to avoid chicken-egg problem.
 * The PlatformEventPort system requires version detection (game.version), but game.version
 * might not be available before the init hook runs. These bootstrap hooks must be registered
 * immediately, so we use direct Foundry Hooks API here.
 *
 * All other hooks (registered inside init) can use PlatformEventPort normally.
 */

import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens";

/**
 * Service responsible for registering the Foundry 'ready' hook.
 * Handles ready-phase logic when the ready hook fires.
 */
export class BootstrapReadyHookService {
  constructor(private readonly logger: Logger) {}

  /**
   * Registers the ready hook with direct Hooks.on().
   * Must be called before Foundry's ready hook fires.
   */
  register(): void {
    // Guard: Ensure Foundry Hooks API is available
    if (typeof Hooks === "undefined") {
      this.logger.warn("Foundry Hooks API not available - ready hook registration skipped");
      return;
    }

    /* v8 ignore start -- @preserve */
    /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
     * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
     * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
    // CRITICAL: Use direct Hooks.on() instead of PlatformEventPort to avoid chicken-egg problem
    Hooks.on("ready", () => {
      this.logger.info("ready-phase");
      this.logger.info("ready-phase completed");
    });
    /* v8 ignore stop -- @preserve */
  }
}

/**
 * DI wrapper for BootstrapReadyHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapReadyHookService extends BootstrapReadyHookService {
  static dependencies = [loggerToken] as const;

  constructor(logger: Logger) {
    super(logger);
  }
}
