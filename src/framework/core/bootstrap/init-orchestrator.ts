import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { InitPhaseContext } from "./init-phase.interface";
import { InitPhaseCriticality } from "./init-phase.interface";
import { InitPhaseRegistry } from "./init-phase-registry";
import { createDefaultInitPhaseRegistry } from "./default-init-phase-registry";

/**
 * Error type for init orchestration failures.
 */
export interface InitError {
  phase: string;
  message: string;
  originalError?: string;
}

/**
 * Orchestrator for the complete bootstrap initialization sequence.
 *
 * Responsibilities:
 * - Execute all bootstrap phases in order from registry
 * - Handle errors according to phase criticality
 * - Aggregate errors for reporting
 *
 * Design:
 * - Phases are provided via InitPhaseRegistry (OCP-compliant)
 * - Each phase is isolated and can be tested independently
 * - Error handling is determined by phase criticality, not hardcoded logic
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
  execute(container: PlatformContainerPort, logger: Logger): Result<void, InitError[]> {
    const errors: InitError[] = [];
    const phases = this.registry.getAll();
    const ctx: InitPhaseContext = { container, logger };

    for (const phase of phases) {
      const result = phase.execute(ctx);

      if (!result.ok) {
        if (phase.criticality === InitPhaseCriticality.HALT_ON_ERROR) {
          errors.push({
            phase: phase.id,
            message: result.error,
          });
          logger.error(`Failed to execute phase '${phase.id}': ${result.error}`);
        } else {
          logger.warn(`Phase '${phase.id}' failed: ${result.error}`);
        }
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
  static execute(container: PlatformContainerPort, logger: Logger): Result<void, InitError[]> {
    const orchestrator = new InitOrchestrator();
    return orchestrator.execute(container, logger);
  }
}
