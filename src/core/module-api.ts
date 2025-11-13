import type { ApiSafeToken } from "@/di_infrastructure/types/api-safe-token";
import type { ServiceType } from "@/types/servicetypeindex";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { MetricsSnapshot } from "@/observability/metrics-collector";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { Result } from "@/types/result";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";

/**
 * Information about a registered service token.
 * Provides metadata to help external callers discover available services.
 */
export interface TokenInfo {
  /** Symbol description (e.g., "NotificationCenter", "FoundryGame") */
  description: string;
  /** Whether the service is currently registered */
  isRegistered: boolean;
}

/**
 * Deprecation metadata for tokens.
 * Used by markAsDeprecated() to track deprecated API tokens.
 */
export interface DeprecationInfo {
  /** Reason why the token is deprecated */
  reason: string;
  /** Replacement token description (if available) */
  replacement: string | null;
  /** Version in which the token will be removed */
  removedInVersion: string;
  /** Whether the deprecation warning has been shown */
  warningShown: boolean;
}

/**
 * Type-safe token collection for external modules.
 *
 * All tokens are branded as ApiSafeToken, allowing external modules
 * to use both:
 * - api.resolve() (exception-based, throws on error)
 * - api.resolveWithError() (Result-based, explicit error handling)
 *
 * Internal code cannot use these with container.resolve() due to type enforcement.
 */
export interface ModuleApiTokens {
  notificationCenterToken: ApiSafeToken<NotificationCenter>;
  journalVisibilityServiceToken: ApiSafeToken<JournalVisibilityService>;
  foundryGameToken: ApiSafeToken<FoundryGame>;
  foundryHooksToken: ApiSafeToken<FoundryHooks>;
  foundryDocumentToken: ApiSafeToken<FoundryDocument>;
  foundryUIToken: ApiSafeToken<FoundryUI>;
  foundrySettingsToken: ApiSafeToken<FoundrySettings>;
  i18nFacadeToken: ApiSafeToken<I18nFacadeService>;
  foundryJournalFacadeToken: ApiSafeToken<FoundryJournalFacade>;
}

/**
 * Health status information for the module.
 * Provides diagnostic information about module state.
 */
export interface HealthStatus {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Individual health checks */
  checks: {
    /** Whether DI container is validated and ready */
    containerValidated: boolean;
    /** Whether Foundry ports have been selected */
    portsSelected: boolean;
    /** Last error encountered (if any) */
    lastError: string | null;
  };
  /** Timestamp of health check */
  timestamp: string;
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
 * // Check API version
 * console.log(`API version: ${api.version}`);
 *
 * // Check health status
 * const health = api.getHealth();
 * console.log(`Module status: ${health.status}`);
 *
 * // Option 1: Use exported tokens
 * const notifications = api.resolve(api.tokens.notificationCenterToken);
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
   * API version following semantic versioning (MAJOR.MINOR.PATCH).
   * Breaking changes increment MAJOR, new features increment MINOR, bugfixes increment PATCH.
   *
   * Version History:
   * - 1.0.0: Initial public API
   */
  readonly version: "1.0.0";

  /**
   * Resolves a service from the DI container (throws on failure).
   *
   * **For external modules:** Exception-based error handling.
   *
   * Only accepts ApiSafeToken types (available via api.tokens).
   * This ensures external modules use tokens that have been explicitly exposed
   * and prevents internal token leakage.
   *
   * @param token - An API-safe injection token from api.tokens
   * @returns The resolved service instance
   * @throws Error if token is not API-safe or resolution fails
   *
   * @example
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   *
   * try {
   *   const notifications = api.resolve(api.tokens.notificationCenterToken);
   *   notifications.error("Success", { code: "TEST", message: "It works" });
   * } catch (error) {
   *   console.error("Failed:", error);
   * }
   * ```
   */
  resolve: <TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;

  /**
   * Resolves a service by its injection token with Result-Pattern (never throws).
   *
   * **Recommended for:**
   * - Custom/optional services that might not be registered
   * - When explicit error handling is required
   * - When you want to avoid try-catch blocks
   *
   * **Well-known tokens** (notificationCenterToken, foundryGameToken, etc.) are guaranteed to resolve successfully.
   *
   * @param token - API-safe injection token (marked via markAsApiSafe)
   * @returns Result with service instance or error details
   *
   * @example Safe Resolution with Error Handling
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   * const result = api.resolveWithError(api.tokens.notificationCenterToken);
   *
   * if (result.ok) {
   *   result.value.error('Notifications available');
   * } else {
   *   console.error('Failed to resolve:', result.error.message);
   * }
   * ```
   *
   * @example Optional Service Resolution
   * ```typescript
   * const customResult = api.resolveWithError(customToken);
   * if (customResult.ok) {
   *   customResult.value.doSomething();
   * } else {
   *   console.warn('Optional service not available, using fallback');
   *   // Fallback logic
   * }
   * ```
   */
  resolveWithError: <TServiceType extends ServiceType>(
    token: ApiSafeToken<TServiceType>
  ) => Result<TServiceType, ContainerError>;

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
  getAvailableTokens: () => Map<InjectionTokenKey, TokenInfo>;

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
   * // notifications has type NotificationCenter (not ServiceType)
   * const notifications = api.resolve(api.tokens.notificationCenterToken);
   * notifications.error("Hello users", { code: "DEMO", message: "Type-safe notifications!" });
   *
   * // game has type FoundryGame (not ServiceType)
   * const game = api.resolve(api.tokens.foundryGameToken);
   * const journals = game.getJournalEntries();
   * ```
   */
  tokens: ModuleApiTokens;

  /**
   * Gets a snapshot of performance metrics.
   *
   * Available when VITE_ENABLE_PERF_TRACKING is enabled.
   * Provides insights into container resolution performance,
   * cache hit rates, and port selection statistics.
   *
   * @returns Current metrics snapshot
   *
   * @example
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   * const metrics = api.getMetrics();
   * console.table(metrics);
   * ```
   */
  getMetrics: () => MetricsSnapshot;

  /**
   * Gets module health status.
   *
   * Provides diagnostic information about module state, useful for
   * troubleshooting and monitoring.
   *
   * @returns Health status with checks and overall status
   *
   * @example
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   * const health = api.getHealth();
   *
   * if (health.status !== 'healthy') {
   *   console.warn('Module is not healthy:', health.checks);
   * }
   * ```
   */
  getHealth: () => HealthStatus;
}

// Helper type alias for the token map key (symbol description).
export type InjectionTokenKey = symbol;
