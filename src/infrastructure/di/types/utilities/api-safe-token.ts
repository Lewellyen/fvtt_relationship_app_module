import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceType } from "../service-type-registry";

/**
 * Compile-time brand marker for API-safe tokens.
 *
 * This symbol only exists at the type level and is erased at runtime.
 * It's used to mark tokens that are safe for external module consumption via the public API.
 *
 * @internal This is a type-level-only marker
 */
declare const API_SAFE_BRAND: unique symbol;

/**
 * Runtime registry of API-safe tokens.
 *
 * Uses Set for O(1) lookups. Since symbols are primitives (not objects),
 * WeakSet cannot be used. This is safe because tokens are compile-time constants
 * and never get garbage collected anyway.
 *
 * @internal
 */
const apiSafeTokens = new Set<symbol>();

/**
 * InjectionToken branded as "API-safe" for external module consumption.
 *
 * Only tokens marked via `markAsApiSafe()` can be used with the throwing
 * `container.resolve()` method. This enforces that internal code uses
 * `resolveWithError()` for Result-based error handling.
 *
 * **Enforcement:**
 * - Compile-time: TypeScript enforces ApiSafeToken type (prevents `container.resolve(regularToken)`)
 * - Runtime: Symbol marker validates token was marked via markAsApiSafe()
 *
 * **Design rationale:**
 * - External modules (unfamiliar with Result pattern) get exception-based API
 * - Internal code (uses Result pattern) cannot accidentally use throwing API
 * - Defense-in-depth: Type system + runtime guard
 *
 * @template T - The service type this token resolves to
 *
 * @see markAsApiSafe - Function to mark tokens as API-safe
 * @see https://github.com/tc39/proposal-type-annotations (future TC39 standard alignment)
 */
export type ApiSafeToken<T extends ServiceType> = InjectionToken<T> & {
  readonly [API_SAFE_BRAND]: true;
};

/**
 * Marks an injection token as safe for API exposure.
 *
 * **🔒 RESTRICTED: Only call this in composition-root.ts**
 *
 * This function should ONLY be used when creating the public ModuleApi
 * to mark tokens that external modules can safely use with `api.resolve()`.
 *
 * Internal code should never call this function - it should always use
 * `resolveWithError()` with regular InjectionToken types.
 *
 * **Implementation:**
 * 1. Adds token to Set registry
 * 2. Returns token cast as ApiSafeToken (compile-time brand)
 *
 * **Performance:**
 * - Minimal runtime overhead (Set.add is O(1))
 * - Compile-time type checking prevents misuse
 *
 * @param token - The injection token to mark as API-safe
 * @returns The same token, branded as ApiSafeToken with runtime marker
 *
 * @example
 * ```typescript
 * // ✅ CORRECT: In composition-root.ts
 * const api: ModuleApi = {
 *   tokens: {
 *     loggerToken: markAsApiSafe(loggerToken),
 *     gameToken: markAsApiSafe(foundryGameToken),
 *   }
 * };
 *
 * // ❌ WRONG: In service code
 * const logger = container.resolve(markAsApiSafe(loggerToken));
 * // Use resolveWithError() instead!
 * ```
 */
export function markAsApiSafe<T extends ServiceType>(token: InjectionToken<T>): ApiSafeToken<T> {
  // Add to Set registry (O(1) lookup)
  apiSafeTokens.add(token);

  /* type-coverage:ignore-next-line -- Nominal branding: Return with compile-time brand marker (type cast) */
  return token as ApiSafeToken<T>;
}

/**
 * Runtime validation that a token is API-safe.
 *
 * Checks if the token is in the Set registry.
 * Used by container.resolve() to enforce API boundary at runtime.
 *
 * This provides defense-in-depth against:
 * - @ts-ignore comments bypassing type checks
 * - Type assertions (`token as ApiSafeToken`)
 * - JavaScript consumers (no type checking)
 *
 * **Performance:**
 * - O(1) Set lookup (~1-2 nanoseconds)
 * - Negligible impact (~0.4% of resolve() time)
 * - Safe: Tokens are compile-time constants, never GC'd
 *
 * @param token - The token to validate
 * @returns True if token was marked via markAsApiSafe(), false otherwise
 *
 * @internal Used by ServiceContainer, not intended for external use
 *
 * @example
 * ```typescript
 * // Container.resolve() implementation:
 * resolve(token) {
 *   if (!isApiSafeTokenRuntime(token)) {
 *     throw new Error("Use resolveWithError() in internal code");
 *   }
 *   // ...
 * }
 * ```
 */
export function isApiSafeTokenRuntime<T extends ServiceType>(
  token: InjectionToken<T>
): token is ApiSafeToken<T> {
  // Check Set registry
  return apiSafeTokens.has(token);
}
