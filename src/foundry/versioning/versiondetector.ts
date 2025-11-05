/**
 * Version detection for Foundry VTT.
 * Extracts the major version number from Foundry's version string.
 */

import type { Result } from "@/types/result";
import { ok, err } from "@/utils/result";

/**
 * Cached version result to avoid repeated game.version access.
 * Improves performance when version is checked multiple times (e.g., during port selection).
 */
let cachedVersion: Result<number, string> | null = null;

/**
 * Internal function to detect Foundry version without caching.
 * Called only once on first version check.
 */
function detectFoundryVersion(): Result<number, string> {
  if (typeof game === "undefined") {
    return err("Foundry game object is not available or version cannot be determined");
  }

  // game.version is typed as string by fvtt-types
  // Format is "{major}.{minor}" (e.g., "13.348")
  const versionString = game.version;
  if (!versionString) {
    return err("Foundry version is not available on the game object");
  }

  const match = versionString.match(/^(\d+)/);
  if (!match) {
    return err(`Could not parse Foundry version from: ${versionString}`);
  }

  return ok(Number.parseInt(match[1]!, 10));
}

/**
 * Gets the major version number of the currently running Foundry VTT instance.
 * Returns a Result for proper error handling.
 *
 * Performance: Version is cached after first detection to avoid repeated game.version access.
 *
 * @returns Result with major version number (e.g., 13 for "13.348") or error message
 *
 * @example
 * ```typescript
 * const versionResult = getFoundryVersionResult();
 * if (versionResult.ok) {
 *   console.log(`Foundry version: ${versionResult.value}`);
 * } else {
 *   console.error(`Version detection failed: ${versionResult.error}`);
 * }
 * ```
 */
export function getFoundryVersionResult(): Result<number, string> {
  if (cachedVersion === null) {
    cachedVersion = detectFoundryVersion();
  }
  return cachedVersion;
}

/**
 * Resets the version cache.
 *
 * @internal For testing purposes only.
 *
 * Should be called in test cleanup (afterEach) to ensure test isolation.
 * DO NOT use in production code - version detection is intentionally cached
 * for performance reasons.
 */
export function resetVersionCache(): void {
  cachedVersion = null;
}

/**
 * Gets the major version number of the currently running Foundry VTT instance.
 *
 * @deprecated Use getFoundryVersionResult() for proper error handling with Result pattern
 * @returns The major version number (e.g., 13 for "13.348")
 * @throws Error if game is not available or version cannot be determined
 */
export function getFoundryVersion(): number {
  const result = getFoundryVersionResult();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

/**
 * Safely gets the Foundry version, returning undefined if it cannot be determined.
 * @returns The major version number or undefined if not available
 */
export function tryGetFoundryVersion(): number | undefined {
  const result = getFoundryVersionResult();
  return result.ok ? result.value : undefined;
}
