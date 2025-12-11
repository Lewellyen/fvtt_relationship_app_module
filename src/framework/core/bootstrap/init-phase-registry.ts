import type { InitPhase } from "./init-phase.interface";

/**
 * Registry for initialization phases.
 *
 * Responsibilities:
 * - Maintain ordered list of init phases
 * - Provide sorted phases for orchestrator consumption
 * - Support extension without modifying orchestrator code
 */
export class InitPhaseRegistry {
  private readonly phases: InitPhase[] = [];

  /**
   * Creates a new registry with the provided phases.
   *
   * @param phases - Array of init phases (will be sorted by priority)
   */
  constructor(phases: InitPhase[] = []) {
    this.phases = [...phases];
    this.sortPhases();
  }

  /**
   * Returns all phases sorted by priority (ascending).
   *
   * @returns Sorted array of init phases
   */
  getAll(): InitPhase[] {
    return [...this.phases];
  }

  /**
   * Adds a phase to the registry and re-sorts.
   *
   * @param phase - Phase to add
   */
  add(phase: InitPhase): void {
    this.phases.push(phase);
    this.sortPhases();
  }

  /**
   * Sorts phases by priority (ascending).
   */
  private sortPhases(): void {
    this.phases.sort((a, b) => a.priority - b.priority);
  }
}
