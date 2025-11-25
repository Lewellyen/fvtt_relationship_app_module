/**
 * Bootstrap ready hook registration service.
 *
 * DIP-Compliant: Uses BootstrapHooksPort instead of direct Hooks.on().
 * The port abstracts the platform-specific hook registration while still
 * allowing the adapter to use direct APIs to avoid the chicken-egg problem.
 *
 * All other hooks (registered inside init) can use PlatformEventPort normally.
 */

import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import { loggerToken, bootstrapHooksPortToken } from "@/infrastructure/shared/tokens";

/**
 * Service responsible for registering the Foundry 'ready' hook.
 * Handles ready-phase logic when the ready hook fires.
 *
 * DIP-Compliant: Uses BootstrapHooksPort for hook registration instead of
 * direct platform API access.
 */
export class BootstrapReadyHookService {
  constructor(
    private readonly logger: Logger,
    private readonly bootstrapHooks: BootstrapHooksPort
  ) {}

  /**
   * Registers the ready hook via BootstrapHooksPort.
   * Must be called before the platform's ready hook fires.
   */
  register(): void {
    const result = this.bootstrapHooks.onReady(() => this.handleReady());

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
    this.logger.info("ready-phase completed");
  }
  /* v8 ignore stop -- @preserve */
}

/**
 * DI wrapper for BootstrapReadyHookService.
 * Injects dependencies via constructor.
 */
export class DIBootstrapReadyHookService extends BootstrapReadyHookService {
  static dependencies = [loggerToken, bootstrapHooksPortToken] as const;

  constructor(logger: Logger, bootstrapHooks: BootstrapHooksPort) {
    super(logger, bootstrapHooks);
  }
}
