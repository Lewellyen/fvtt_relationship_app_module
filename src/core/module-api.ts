import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { Logger } from "@/interfaces/logger";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";

/**
 * Information about a registered service token.
 * Provides metadata to help external callers discover available services.
 */
export interface TokenInfo {
  /** Symbol description (e.g., "Logger", "FoundryGame") */
  description: string;
  /** Whether the service is currently registered */
  isRegistered: boolean;
}

/**
 * Type-safe token collection with concrete generics.
 * Preserves type information when using api.resolve().
 */
export interface ModuleApiTokens {
  loggerToken: InjectionToken<Logger>;
  journalVisibilityServiceToken: InjectionToken<JournalVisibilityService>;
  foundryGameToken: InjectionToken<FoundryGame>;
  foundryHooksToken: InjectionToken<FoundryHooks>;
  foundryDocumentToken: InjectionToken<FoundryDocument>;
  foundryUIToken: InjectionToken<FoundryUI>;
  foundrySettingsToken: InjectionToken<FoundrySettings>;
}

/**
 * Public API exposed to external scripts and modules.
 * Provides controlled access to the DI container.
 *
 * Available via: game.modules.get(MODULE_ID).api
 *
 * @example
 * ```typescript
 * const api = game.modules.get('fvtt_relationship_app_module').api;
 *
 * // Option 1: Use exported tokens
 * const logger = api.resolve(api.tokens.loggerToken);
 *
 * // Option 2: Discover available tokens
 * const tokens = api.getAvailableTokens();
 * for (const [token, info] of tokens.entries()) {
 *   console.log(`Available: ${info.description}`);
 * }
 * ```
 */
export interface ModuleApi {
  /**
   * Resolves a service from the DI container.
   * @param token - The injection token identifying the service
   * @returns The resolved service instance
   * @throws Error if service is not registered or cannot be resolved
   */
  resolve: <TServiceType extends ServiceType>(token: InjectionToken<TServiceType>) => TServiceType;

  /**
   * Lists all registered service tokens with their descriptions.
   * Useful for discovering what services are available for external scripts.
   *
   * @returns Map of token symbols to their metadata (description, registration status)
   *
   * @example
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   * const tokens = api.getAvailableTokens();
   *
   * for (const [token, info] of tokens.entries()) {
   *   console.log(`Token: ${info.description}, Registered: ${info.isRegistered}`);
   * }
   * ```
   */
  getAvailableTokens: () => Map<symbol, TokenInfo>;

  /**
   * Well-known tokens exported by this module for easy access.
   *
   * FIXED: Each token has its precise generic type for type safety.
   *
   * External scripts can use these directly without importing token files.
   *
   * @example
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   *
   * // logger has type Logger (not ServiceType)
   * const logger = api.resolve(api.tokens.loggerToken);
   * logger.info("Type-safe logging!");
   *
   * // game has type FoundryGame (not ServiceType)
   * const game = api.resolve(api.tokens.foundryGameToken);
   * const journals = game.getJournalEntries();
   * ```
   */
  tokens: ModuleApiTokens;
}
