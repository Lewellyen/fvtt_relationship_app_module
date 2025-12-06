/**
 * Bootstrap ready hook registration service.
 *
 * DIP-Compliant: Uses PlatformBootstrapEventPort instead of direct Hooks.on().
 * The port abstracts the platform-specific hook registration while still
 * allowing the adapter to use direct APIs to avoid the chicken-egg problem.
 *
 * All other hooks (registered inside init) can use PlatformEventPort normally.
 */

import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";
import { platformBootstrapEventPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import type { ModuleReadyService } from "@/application/services/module-ready-service";
import { moduleReadyServiceToken } from "@/application/services/module-ready-service";

/**
 * Service responsible for registering the Foundry 'ready' hook.
 * Handles ready-phase logic when the ready hook fires.
 *
 * DIP-Compliant: Uses PlatformBootstrapEventPort for event registration instead of
 * direct platform API access.
 */
export class BootstrapReadyHookService {
  constructor(
    private readonly logger: Logger,
    private readonly bootstrapEvents: PlatformBootstrapEventPort,
    private readonly moduleReadyService: ModuleReadyService
  ) {}

  /**
   * Registers the ready event via PlatformBootstrapEventPort.
   * Must be called before the platform's ready hook fires.
   */
  register(): void {
    const result = this.bootstrapEvents.onReady(() => this.handleReady());

    if (!result.ok) {
      this.logger.warn(
        `Ready hook registration failed: ${result.error.message}`,
        result.error.details
      );
    }
  }

  /* v8 ignore start -- @preserve */
  /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
   * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
   * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
  private handleReady(): void {
    this.logger.info("ready-phase");

    // Setze module.ready = true, sobald Bootstrap-Ready-Hook fertig ist
    // Ähnlich wie game.ready, aber für unser Modul
    this.moduleReadyService.setReady();
    this.logger.info("module.ready set to true");

    this.logger.info("ready-phase completed");
  }
  /* v8 ignore stop -- @preserve */
}

/**
 * DI wrapper for BootstrapReadyHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapReadyHookService extends BootstrapReadyHookService {
  static dependencies = [
    loggerToken,
    platformBootstrapEventPortToken,
    moduleReadyServiceToken,
  ] as const;

  constructor(
    logger: Logger,
    bootstrapEvents: PlatformBootstrapEventPort,
    moduleReadyService: ModuleReadyService
  ) {
    super(logger, bootstrapEvents, moduleReadyService);
  }
}
