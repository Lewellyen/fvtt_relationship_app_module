import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { InitPhaseContext } from "./init-phase.interface";
import { InitPhaseRegistry } from "./init-phase-registry";
import { createDefaultInitPhaseRegistry } from "./default-init-phase-registry";
import { InitPhaseErrorHandler } from "./init-phase-error-handler";
import type { InitError } from "./init-error";

export type { InitError };

/**
 * Orchestrator for the complete bootstrap initialization sequence.
 *
 * Responsibilities:
 * - Execute all bootstrap phases in order from registry
 * - Coordinate phase execution and context creation
 *
 * Design:
 * - Phases are provided via InitPhaseRegistry (OCP-compliant)
 * - Each phase is isolated and can be tested independently
 * - Error handling is delegated to InitPhaseErrorHandler (SRP compliance)
 * - New phases can be added via registry extension without modifying orchestrator
 */
export class InitOrchestrator {
  private readonly registry: InitPhaseRegistry;

  /**
   * Creates a new InitOrchestrator instance.
   *
   * @param registry - Registry providing init phases (defaults to standard phases)
   */
  constructor(registry?: InitPhaseRegistry) {
    this.registry = registry ?? createDefaultInitPhaseRegistry();
  }

  /**
   * Executes the complete initialization sequence.
   *
   * Phases are executed in priority order (ascending). Error handling
   * follows each phase's criticality setting:
   * - HALT_ON_ERROR: Errors are collected and returned, stopping bootstrap
   * - WARN_AND_CONTINUE: Errors are logged as warnings but don't stop bootstrap
   *
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger for error reporting
   * @returns Result indicating success or aggregated errors
   */
  execute(
    container: PlatformContainerPort,
    logger: PlatformLoggingPort
  ): Result<void, InitError[]> {
    const errors: InitError[] = [];
    const phases = this.registry.getAll();
    const ctx: InitPhaseContext = { container, logger };
    const errorHandler = new InitPhaseErrorHandler();

    for (const phase of phases) {
      const result = phase.execute(ctx);

      if (!result.ok) {
        errorHandler.handlePhaseError(phase, result.error, errors, logger);
      }
    }

    // If any critical phases failed, return errors
    if (errors.length > 0) {
      return err(errors);
    }

    return ok(undefined);
  }

  /**
   * Static convenience method for backward compatibility.
   *
   * Creates a new orchestrator with default registry and executes.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger for error reporting
   * @returns Result indicating success or aggregated errors
   */
  static execute(
    container: PlatformContainerPort,
    logger: PlatformLoggingPort
  ): Result<void, InitError[]> {
    const orchestrator = new InitOrchestrator();
    return orchestrator.execute(container, logger);
  }
}
