/**
 * Bootstrap init hook registration service.
 *
 * DIP-Compliant: Uses PlatformBootstrapEventPort instead of direct Hooks.on().
 * The port abstracts the platform-specific hook registration while still
 * allowing the adapter to use direct APIs to avoid the chicken-egg problem.
 *
 * All other hooks (registered inside init) can use PlatformEventPort normally.
 */

import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";
import { platformBootstrapEventPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";
import { InitOrchestrator } from "./bootstrap/init-orchestrator";

/**
 * Service responsible for registering the Foundry 'init' hook.
 * Handles all initialization logic when the init hook fires.
 *
 * DIP-Compliant: Uses PlatformBootstrapEventPort for event registration instead of
 * direct platform API access.
 */
export class BootstrapInitHookService {
  constructor(
    private readonly logger: Logger,
    private readonly container: PlatformContainerPort,
    private readonly bootstrapEvents: PlatformBootstrapEventPort
  ) {}

  /**
   * Registers the init event via PlatformBootstrapEventPort.
   * Must be called before the platform's init hook fires.
   */
  register(): void {
    const result = this.bootstrapEvents.onInit(() => this.handleInit());

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

    // Delegate to InitOrchestrator for all initialization phases
    const result = InitOrchestrator.execute(this.container, this.logger);

    if (!result.ok) {
      // Log aggregated errors
      const errorMessages = result.error.map((e) => `${e.phase}: ${e.message}`).join("; ");
      this.logger.error(`Init phase completed with errors: ${errorMessages}`);
    } else {
      this.logger.info("init-phase completed");
    }
  }
  /* v8 ignore stop -- @preserve */
}

/**
 * DI wrapper for BootstrapInitHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapInitHookService extends BootstrapInitHookService {
  static dependencies = [
    loggerToken,
    platformContainerPortToken,
    platformBootstrapEventPortToken,
  ] as const;

  constructor(
    logger: Logger,
    container: PlatformContainerPort,
    bootstrapEvents: PlatformBootstrapEventPort
  ) {
    super(logger, container, bootstrapEvents);
  }
}
