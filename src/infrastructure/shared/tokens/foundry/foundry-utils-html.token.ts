/**
 * Injection token for FoundryUtilsHtmlPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUtilsHtmlPort } from "@/infrastructure/adapters/foundry/interfaces/FoundryUtilsHtmlPort";

/**
 * Injection token for FoundryUtilsHtmlPort.
 *
 * Provides HTML manipulation utilities from Foundry's utils API (cleanHTML, escapeHTML, etc.).
 * Services that only need HTML manipulation should depend on this token instead of the full FoundryUtils.
 *
 * @example
 * ```typescript
 * const htmlUtils = container.resolve(foundryUtilsHtmlToken);
 * const cleaned = htmlUtils.cleanHTML("<script>alert('xss')</script><p>Safe</p>");
 * const escaped = htmlUtils.escapeHTML("<div>Test</div>");
 * ```
 */
export const foundryUtilsHtmlToken =
  createInjectionToken<FoundryUtilsHtmlPort>("FoundryUtilsHtmlPort");
