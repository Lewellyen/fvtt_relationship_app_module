import type { InjectionToken } from "../core/injectiontoken";
import type { ApiSafeToken } from "./api-safe-token";
import { markAsApiSafe } from "./api-safe-token";
import type { ServiceType } from "@/infrastructure/shared/tokens";

/**
 * Deprecation metadata attached to deprecated tokens.
 * Stores information about why the token is deprecated and what to use instead.
 */
export interface DeprecationInfo {
  /** Reason why the token is deprecated */
  reason: string;
  /** Replacement token description (if available) */
  replacement: string | null;
  /** Version in which the token will be removed */
  removedInVersion: string;
  /** Whether the deprecation warning has been shown (prevents spam) */
  warningShown: boolean;
}

/**
 * Map to store deprecation metadata for tokens.
 * Symbols are used as keys directly (Map supports symbol keys natively).
 *
 * Memory: Tokens are singletons (defined once in tokenindex.ts), so no memory leak risk.
 * Using Map instead of WeakMap for 100% type-coverage (no any-casts needed).
 */
const deprecationMetadata = new Map<symbol, DeprecationInfo>();

/**
 * Marks an injection token as deprecated with metadata.
 *
 * The token remains functional but will emit a console warning when resolved.
 * This allows for graceful migration periods before breaking changes.
 *
 * @param token - The injection token to deprecate
 * @param reason - Human-readable reason for deprecation
 * @param replacement - Optional replacement token (for migration guidance)
 * @param removedInVersion - Version in which the token will be removed
 * @returns API-safe token with deprecation metadata attached
 *
 * @example
 * ```typescript
 * // Deprecate oldLoggerToken in favor of loggerToken
 * const wellKnownTokens = {
 *   oldLoggerToken: markAsDeprecated(
 *     oldLoggerInternalToken,
 *     "Use enhanced logger v2 with better performance",
 *     loggerToken,
 *     "2.0.0"
 *   ),
 *   loggerToken: markAsApiSafe(loggerToken)
 * };
 *
 * // User code will see:
 * // ⚠️ DEPRECATED: Token "oldLoggerToken" is deprecated.
 * // Reason: Use enhanced logger v2 with better performance
 * // Use "Symbol(Logger)" instead.
 * // This token will be removed in version 2.0.0.
 * ```
 */
export function markAsDeprecated<T extends ServiceType>(
  token: InjectionToken<T>,
  reason: string,
  replacement: InjectionToken<T> | null,
  removedInVersion: string
): ApiSafeToken<T> {
  const apiSafeToken = markAsApiSafe(token);

  // Store deprecation metadata in Map (symbols are valid keys)
  deprecationMetadata.set(apiSafeToken, {
    reason,
    replacement: replacement ? String(replacement) : null,
    removedInVersion,
    warningShown: false,
  });

  return apiSafeToken;
}

/**
 * Checks if a token has deprecation metadata attached.
 *
 * @param token - Token to check
 * @returns Deprecation info if token is deprecated, null otherwise
 * @internal
 */
export function getDeprecationInfo(token: unknown): DeprecationInfo | null {
  if (!token || typeof token !== "symbol") {
    return null;
  }
  return deprecationMetadata.get(token) || null;
}
