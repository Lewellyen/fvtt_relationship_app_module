import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { moduleEventRegistrarToken } from "@/infrastructure/shared/tokens/event.tokens";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

/**
 * Orchestrator for registering event listeners during bootstrap.
 *
 * Responsibilities:
 * - Resolve ModuleEventRegistrar
 * - Register all event listeners
 */
export class EventsBootstrapper {
  /**
   * Registers all event listeners.
   *
   * @param container - ContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static registerEvents(container: ContainerPort): Result<void, string> {
    const eventRegistrarResult = container.resolveWithError(moduleEventRegistrarToken);
    if (!eventRegistrarResult.ok) {
      return err(`Failed to resolve ModuleEventRegistrar: ${eventRegistrarResult.error.message}`);
    }

    // Container parameter removed - all dependencies injected via constructor
    const eventRegistrar = castResolvedService<ModuleEventRegistrar>(eventRegistrarResult.value);
    const eventRegistrationResult = eventRegistrar.registerAll();
    if (!eventRegistrationResult.ok) {
      const errorMessages = eventRegistrationResult.error.map((e: Error) => e.message).join(", ");
      return err(`Failed to register one or more event listeners: ${errorMessages}`);
    }

    return ok(undefined);
  }
}
