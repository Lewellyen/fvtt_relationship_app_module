import type { Result } from "@/domain/types/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";

/**
 * Error handling strategy for init phases.
 */
export enum InitPhaseCriticality {
  /**
   * Phase must succeed - failure stops the entire bootstrap process.
   */
  HALT_ON_ERROR = "haltOnError",
  /**
   * Phase is optional - failure is logged as warning but bootstrap continues.
   */
  WARN_AND_CONTINUE = "warnAndContinue",
}

/**
 * Context passed to init phase execution.
 */
export interface InitPhaseContext {
  container: PlatformContainerPort;
  logger: Logger;
}

/**
 * Interface for initialization phases in the bootstrap process.
 *
 * Each phase represents a single initialization step that can be executed
 * independently. Phases are ordered by priority and can have different
 * error handling strategies.
 */
export interface InitPhase {
  /**
   * Unique identifier for this phase.
   */
  readonly id: string;

  /**
   * Priority for ordering phases (lower numbers execute first).
   */
  readonly priority: number;

  /**
   * Error handling strategy for this phase.
   */
  readonly criticality: InitPhaseCriticality;

  /**
   * Executes the initialization phase.
   *
   * @param ctx - Context containing container and logger
   * @returns Result indicating success or error message
   */
  execute(ctx: InitPhaseContext): Result<void, string>;
}
