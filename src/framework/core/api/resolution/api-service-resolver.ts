import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ContainerError } from "@/domain/ports/platform-container-port.interface";
import type { IApiServiceResolver } from "../interfaces/api-component-interfaces";
import type { IDeprecationHandler } from "../interfaces/api-component-interfaces";
import type { IServiceWrapperFactory } from "../interfaces/api-component-interfaces";

/**
 * ApiServiceResolver
 *
 * Responsible for creating resolve functions for the public API.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 */
export class ApiServiceResolver implements IApiServiceResolver {
  constructor(
    private readonly deprecationHandler: IDeprecationHandler,
    private readonly serviceWrapperFactory: IServiceWrapperFactory
  ) {}

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
  ): <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType {
    return <TServiceType>(token: ApiSafeToken<TServiceType>): TServiceType => {
      // Handle deprecation warnings
      this.deprecationHandler.handleDeprecationWarning(token);

      // Resolve service from container
      const service: TServiceType = container.resolve(token);

      return this.serviceWrapperFactory.wrapSensitiveService(token, service, wellKnownTokens);
    };
  }

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
  ): <TServiceType>(token: ApiSafeToken<TServiceType>) => Result<TServiceType, ContainerError> {
    return <TServiceType>(
      token: ApiSafeToken<TServiceType>
    ): Result<TServiceType, ContainerError> => {
      // Handle deprecation warnings
      this.deprecationHandler.handleDeprecationWarning(token);

      // Resolve with Result-Pattern (never throws)
      const result = container.resolveWithError<TServiceType>(token);

      // Apply wrappers if resolution succeeded
      if (!result.ok) {
        return err({
          code: result.error.code,
          message: result.error.message,
          cause: result.error.cause,
        });
      }

      const service = result.value;

      const wrappedService = this.serviceWrapperFactory.wrapSensitiveService(
        token,
        service,
        wellKnownTokens
      );
      return ok(wrappedService);
    };
  }
}
