/**
 * Injection token for FoundryDocument port.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryDocumentPort } from "@/infrastructure/adapters/foundry/services/FoundryDocumentPort";

/**
 * Injection token for FoundryDocument port.
 *
 * Provides access to Foundry's document API for flag management.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const doc = container.resolve(foundryDocumentToken);
 * const flag = doc.getFlag(journal, "my-module", "my-flag");
 * if (flag.ok) {
 *   console.log("Flag value:", flag.value);
 * }
 * ```
 */
export const foundryDocumentToken = createInjectionToken<FoundryDocumentPort>("FoundryDocument");
