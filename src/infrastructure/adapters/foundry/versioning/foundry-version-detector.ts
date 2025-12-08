/**
 * Service for detecting the current Foundry VTT version.
 *
 * Encapsulates version detection logic to follow Single Responsibility Principle.
 * This service can be injected into other services that need to determine the
 * Foundry version, making it testable and reusable.
 *
 * **Performance:**
 * Version detection is cached after first detection to avoid repeated
 * `game.version` access. The cache is managed by the underlying `getFoundryVersionResult()` function.
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { getFoundryVersionResult } from "./versiondetector";
import { err, ok } from "@/domain/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

/**
 * Service for detecting the current Foundry VTT version.
 *
 * Provides a clean interface for version detection that can be injected
 * into other services, following Dependency Inversion Principle.
 */
export class FoundryVersionDetector {
  /**
   * Gets the major version number of the currently running Foundry VTT instance.
   *
   * @returns Result with major version number (e.g., 13 for "13.348") or FoundryError
   *
   * @example
   * ```typescript
   * const detector = new FoundryVersionDetector();
   * const versionResult = detector.getVersion();
   * if (versionResult.ok) {
   *   console.log(`Foundry version: ${versionResult.value}`);
   * }
   * ```
   */
  getVersion(): Result<number, FoundryError> {
    const versionResult = getFoundryVersionResult();
    if (!versionResult.ok) {
      return err(
        createFoundryError(
          "VERSION_DETECTION_FAILED",
          "Could not determine Foundry version",
          undefined,
          versionResult.error
        )
      );
    }
    return ok(versionResult.value);
  }
}

/**
 * DI wrapper for FoundryVersionDetector.
 *
 * Implements the DI pattern by declaring static dependencies.
 * This allows the DI container to resolve and inject dependencies automatically.
 */
export class DIFoundryVersionDetector extends FoundryVersionDetector {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
