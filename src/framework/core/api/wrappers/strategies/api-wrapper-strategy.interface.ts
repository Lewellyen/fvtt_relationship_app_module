import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";

/**
 * ApiWrapperStrategy
 *
 * Strategy interface for wrapping sensitive services with read-only wrappers.
 * Follows Open/Closed Principle: new services can be wrapped by adding new strategies
 * without modifying existing code.
 *
 * @template TServiceType - The service type that this strategy wraps
 */
export interface ApiWrapperStrategy<TServiceType = unknown> {
  /**
   * Determines if this strategy supports wrapping the given token.
   *
   * @param token - API token used for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns true if this strategy can wrap the token, false otherwise
   */
  supports(token: ApiSafeToken<TServiceType>, wellKnownTokens: ModuleApiTokens): boolean;

  /**
   * Wraps the service with a read-only wrapper.
   *
   * @param service - Service resolved from the container
   * @param token - API token used for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service instance
   */
  wrap(
    service: TServiceType,
    token: ApiSafeToken<TServiceType>,
    wellKnownTokens: ModuleApiTokens
  ): TServiceType;

  /**
   * Priority of this strategy (lower numbers = higher priority).
   * Used to determine order when multiple strategies could match.
   *
   * @returns Priority value (default: 100)
   */
  getPriority?(): number;
}
