import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";

/**
 * NoopWrapperStrategy
 *
 * Fallback strategy that returns the service unchanged.
 * Used for services that don't require wrapping.
 * This strategy should have the lowest priority to only match when no other strategy applies.
 */
export class NoopWrapperStrategy implements ApiWrapperStrategy {
  supports<TServiceType>(
    _token: ApiSafeToken<TServiceType>,
    _wellKnownTokens: ModuleApiTokens
  ): boolean {
    return true; // Always matches (fallback)
  }

  wrap<TServiceType>(
    service: TServiceType,
    _token: ApiSafeToken<TServiceType>,
    _wellKnownTokens: ModuleApiTokens
  ): TServiceType {
    return service; // Return unchanged
  }

  getPriority(): number {
    return 1000; // Lowest priority - only used as fallback
  }
}
