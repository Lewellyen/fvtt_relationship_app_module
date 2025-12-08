/**
 * Injection token for FoundryVersionDetector.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";

/**
 * Injection token for FoundryVersionDetector.
 *
 * Service for detecting the current Foundry VTT version.
 * Encapsulates version detection logic following Single Responsibility Principle.
 *
 * @remarks
 * This is a core infrastructure service used by PortSelector and other services
 * that need to determine the Foundry version.
 */
export const foundryVersionDetectorToken =
  createInjectionToken<FoundryVersionDetector>("FoundryVersionDetector");
