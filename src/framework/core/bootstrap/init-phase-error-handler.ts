import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { InitPhase } from "./init-phase.interface";
import { InitPhaseCriticality } from "./init-phase.interface";
import type { InitError } from "./init-error";

/**
 * Handles errors for init phases based on their criticality.
 *
 * Responsibilities:
 * - Determine error handling strategy based on phase criticality
 * - Log errors appropriately (error vs. warn)
 * - Aggregate critical errors for reporting
 *
 * This class separates error handling concerns from orchestration logic,
 * improving testability and maintainability (SRP compliance).
 */
export class InitPhaseErrorHandler {
  /**
   * Handles an error from a phase execution.
   *
   * @param phase - The phase that failed
   * @param error - The error message from the phase
   * @param errors - Array to collect critical errors (mutated if phase is critical)
   * @param logger - Logger for error reporting
   */
  handlePhaseError(phase: InitPhase, error: string, errors: InitError[], logger: Logger): void {
    if (phase.criticality === InitPhaseCriticality.HALT_ON_ERROR) {
      errors.push({
        phase: phase.id,
        message: error,
      });
      logger.error(`Failed to execute phase '${phase.id}': ${error}`);
    } else {
      logger.warn(`Phase '${phase.id}' failed: ${error}`);
    }
  }
}
