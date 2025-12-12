/**
 * Greedy port matching strategy.
 *
 * Implements the default "greedy highest <= version" algorithm:
 * - Never selects a port with version > current Foundry version
 * - Selects the highest port version that is <= Foundry version
 *
 * This is the default strategy used by PortSelector.
 */

import type { Result } from "@/domain/types/result";
import { err, ok } from "@/domain/utils/result";
import { APP_DEFAULTS } from "@/application/constants/app-constants";
import type { PortMatchStrategy, PortMatch, MatchError } from "./port-match-strategy.interface";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Creates a MatchError for port selection failures.
 */
function createMatchError(
  message: string,
  details?: { version: number; availableVersions: string }
): MatchError {
  return {
    code: "PORT_SELECTION_FAILED",
    message,
    details,
  };
}

/**
 * Greedy port matching strategy.
 *
 * Selects the highest compatible port version (highest version <= Foundry version).
 * This is the default strategy used by PortSelector.
 *
 * @template T - The port type
 */
export class GreedyPortMatchStrategy<T> implements PortMatchStrategy<T> {
  /**
   * Selects the highest compatible port version.
   *
   * Algorithm:
   * 1. Never select a port with version > current Foundry version
   *    (prevents using APIs that don't exist yet)
   * 2. Select the highest port version that is <= Foundry version
   *    (use the newest compatible implementation)
   *
   * Time Complexity: O(n) where n = number of registered ports
   * Space Complexity: O(1)
   *
   * @param tokens - Map of version numbers to injection tokens
   * @param foundryVersion - The current Foundry version to match against
   * @returns Result with matched port token and version, or error if no match found
   *
   * @example
   * ```typescript
   * const strategy = new GreedyPortMatchStrategy();
   * const tokens = new Map([
   *   [13, foundryV13GamePortToken],
   *   [14, foundryV14GamePortToken]
   * ]);
   * // Foundry v14: selects v14
   * // Foundry v13: selects v13
   * // Foundry v15: selects v14 (fallback to highest available)
   * const result = strategy.select(tokens, 14);
   * ```
   */
  select(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion: number
  ): Result<PortMatch<T>, MatchError> {
    let selectedToken: InjectionToken<T> | undefined;
    let selectedVersion: number = APP_DEFAULTS.NO_VERSION_SELECTED;

    // Linear search for highest compatible version
    // Could be optimized with sorted array + binary search, but n is typically small (2-5 ports)
    for (const [portVersion, token] of tokens.entries()) {
      // Rule 1: Skip ports newer than current Foundry version
      // These ports may use APIs that don't exist yet → runtime crashes
      if (portVersion > foundryVersion) {
        continue; // Incompatible (too new)
      }

      // Rule 2: Greedy selection - always prefer higher version numbers
      // Track the highest compatible version seen so far
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedToken = token;
      }
    }

    if (selectedToken === undefined) {
      const availableVersions = Array.from(tokens.keys())
        .sort((a, b) => a - b)
        .join(", ");

      return err(
        createMatchError(`No compatible port found for Foundry version ${foundryVersion}`, {
          version: foundryVersion,
          availableVersions: availableVersions || "none",
        })
      );
    }

    return ok({
      token: selectedToken,
      version: selectedVersion,
    });
  }
}
