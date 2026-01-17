import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApi, ModuleApiTokens } from "@/framework/core/api/module-api";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/domain/ports/platform-container-port.interface";
import type { MetricsSnapshot } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import type { HealthStatus } from "@/domain/types/health-status";
import type { DeprecationInfo } from "@/framework/core/api/module-api";

/**
 * Interface for ModuleApiBuilder.
 * Responsible for creating API objects and token collections.
 */
export interface IModuleApiBuilder {
  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   */
  createApi(container: PlatformContainerPort, wellKnownTokens: ModuleApiTokens): ModuleApi;

  /**
   * Creates the well-known API tokens collection.
   *
   * @returns Type-safe token collection for external modules
   */
  createApiTokens(): ModuleApiTokens;
}

/**
 * Interface for ServiceWrapperFactory.
 * Responsible for wrapping sensitive services with read-only wrappers.
 */
export interface IServiceWrapperFactory {
  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
   *
   * @param token - API token used for resolution
   * @param service - Service resolved from the container
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service when applicable
   */
  wrapSensitiveService<TServiceType>(
    token: ApiSafeToken<TServiceType>,
    service: TServiceType,
    wellKnownTokens: ModuleApiTokens
  ): TServiceType;
}

/**
 * Interface for DeprecationHandler.
 * Responsible for handling deprecation warnings for tokens.
 */
export interface IDeprecationHandler {
  /**
   * Handles deprecation warnings for tokens.
   * Logs warning to console if token is deprecated and warning hasn't been shown yet.
   *
   * @param token - Token to check for deprecation
   */
  handleDeprecationWarning<TServiceType>(token: ApiSafeToken<TServiceType>): void;

  /**
   * Checks if a token is deprecated.
   *
   * @param token - Token to check
   * @returns DeprecationInfo if deprecated, null otherwise
   */
  checkDeprecation<TServiceType>(token: ApiSafeToken<TServiceType>): DeprecationInfo | null;
}

/**
 * Interface for ApiServiceResolver.
 * Responsible for creating resolve functions for the public API.
 */
export interface IApiServiceResolver {
  /**
   * Creates the resolve() function for the public API.
   * Resolves services and applies wrappers (throws on error).
   *
   * @param container - PlatformContainerPort for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Resolve function for ModuleApi
   */
  createResolveFunction(
    container: PlatformContainerPort,
    wellKnownTokens: ModuleApiTokens
  ): <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;

  /**
   * Creates the resolveWithError() function for the public API.
   * Resolves services with Result pattern (never throws).
   *
   * @param container - PlatformContainerPort for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns ResolveWithError function for ModuleApi
   */
  createResolveWithErrorFunction(
    container: PlatformContainerPort,
    wellKnownTokens: ModuleApiTokens
  ): <TServiceType>(token: ApiSafeToken<TServiceType>) => Result<TServiceType, ContainerError>;
}

/**
 * Interface for ApiHealthMetricsProvider.
 * Responsible for providing health and metrics information.
 */
export interface IApiHealthMetricsProvider {
  /**
   * Gets a snapshot of performance metrics.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Current metrics snapshot
   */
  getMetrics(container: PlatformContainerPort): MetricsSnapshot;

  /**
   * Gets module health status.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Health status with checks and overall status
   */
  getHealth(container: PlatformContainerPort): HealthStatus;
}
