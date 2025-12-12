import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";

/**
 * ApiWrapperStrategyRegistry
 *
 * Manages registered wrapper strategies and their priorities.
 * Provides a centralized way to find and apply the appropriate strategy
 * for wrapping sensitive services.
 */
export class ApiWrapperStrategyRegistry {
  private readonly strategies: ApiWrapperStrategy[] = [];

  /**
   * Registers a wrapper strategy.
   *
   * @param strategy - Strategy to register
   */
  register(strategy: ApiWrapperStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Registers multiple wrapper strategies.
   *
   * @param strategies - Array of strategies to register
   */
  registerAll(strategies: ApiWrapperStrategy[]): void {
    for (const strategy of strategies) {
      this.register(strategy);
    }
  }

  /**
   * Gets all registered strategies, sorted by priority (lower = higher priority).
   *
   * @returns Array of strategies in priority order
   */
  getAll(): ApiWrapperStrategy[] {
    return [...this.strategies].sort((a, b) => {
      const priorityA = a.getPriority?.() ?? 100;
      const priorityB = b.getPriority?.() ?? 100;
      return priorityA - priorityB;
    });
  }

  /**
   * Finds the first strategy that supports the given token.
   *
   * @param token - API token to find strategy for
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Strategy that supports the token, or null if none found
   */
  findStrategy<TServiceType>(
    token: ApiSafeToken<TServiceType>,
    wellKnownTokens: ModuleApiTokens
  ): ApiWrapperStrategy<TServiceType> | null {
    const sortedStrategies = this.getAll();

    for (const strategy of sortedStrategies) {
      if (strategy.supports(token, wellKnownTokens)) {
        // Type narrowing: strategy.supports() guarantees compatibility with TServiceType,
        // but TypeScript cannot infer the generic type from runtime checks.
        /* type-coverage:ignore-next-line -- Generic type narrowing: supports() guarantees TServiceType compatibility */
        return strategy as ApiWrapperStrategy<TServiceType>;
      }
    }

    return null;
  }

  /**
   * Clears all registered strategies.
   * Useful for testing or reset scenarios.
   */
  clear(): void {
    this.strategies.length = 0;
  }
}
