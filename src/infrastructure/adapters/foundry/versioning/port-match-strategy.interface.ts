/**
 * Strategy interface for port matching algorithms.
 *
 * Enables different matching strategies (greedy, strict, LTS, etc.) to be
 * swapped without modifying PortSelector, following the Open/Closed Principle.
 *
 * @template T - The port type
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Result of a port match operation.
 * Contains the selected token and version, or an error describing why no match was found.
 */
export interface PortMatch<T> {
  /** The injection token for the matched port */
  token: InjectionToken<T>;
  /** The version number of the matched port */
  version: number;
}

/**
 * Error describing why port matching failed.
 */
export interface MatchError extends FoundryError {
  code: "PORT_SELECTION_FAILED";
}

/**
 * Strategy for selecting a compatible port from available tokens.
 *
 * Different strategies can implement different selection algorithms:
 * - Greedy: Select highest compatible version (default)
 * - Strict: Only exact version matches
 * - LTS: Prefer LTS versions
 * - Beta-first: Prefer beta/experimental versions
 */
export interface PortMatchStrategy<T> {
  /**
   * Selects a compatible port from the available tokens based on the Foundry version.
   *
   * @param tokens - Map of version numbers to injection tokens
   * @param foundryVersion - The current Foundry version to match against
   * @returns Result with matched port token and version, or error if no match found
   *
   * @example
   * ```typescript
   * const tokens = new Map([
   *   [13, foundryV13GamePortToken],
   *   [14, foundryV14GamePortToken]
   * ]);
   * const result = strategy.select(tokens, 14);
   * if (result.ok) {
   *   const { token, version } = result.value;
   *   // Use token to resolve port from container
   * }
   * ```
   */
  select(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion: number
  ): Result<PortMatch<T>, MatchError>;
}
