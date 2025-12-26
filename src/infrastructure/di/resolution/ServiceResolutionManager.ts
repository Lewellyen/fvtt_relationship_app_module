import type { InjectionToken } from "../types/core/injectiontoken";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { ContainerValidationState } from "../types/errors/containervalidationstate";
import type { ContainerError as DomainContainerError } from "@/domain/ports/platform-container-port.interface";
import { ServiceResolver } from "./ServiceResolver";
import { err, isOk } from "@/domain/utils/result";
import { castResolvedService } from "../types/utilities/runtime-safe-cast";

/**
 * Manages service resolution operations.
 *
 * Responsibilities:
 * - Delegates resolution to ServiceResolver
 * - Validates disposal state before resolution
 * - Validates validation state before resolution
 * - Handles domain/infrastructure token type conversion
 *
 * Design:
 * - Pure delegation to ServiceResolver
 * - State checks (disposal, validation) are responsibility of this manager
 */
export class ServiceResolutionManager {
  constructor(
    private readonly resolver: ServiceResolver,
    private readonly isDisposed: () => boolean,
    private readonly getValidationState: () => ContainerValidationState
  ) {}

  /**
   * Resolve service with Result return.
   * Supports both infrastructure and domain tokens.
   * PlatformContainerPort uses generic `symbol`, which is compatible with InjectionToken<T> (which extends symbol).
   */
  resolveWithError<T>(token: symbol): Result<T, DomainContainerError>;
  resolveWithError<T>(token: InjectionToken<T>): Result<T, ContainerError>;
  resolveWithError<T>(
    token: InjectionToken<T> | symbol
  ): Result<T, ContainerError> | Result<T, DomainContainerError> {
    if (this.isDisposed()) {
      const error: ContainerError = {
        code: "Disposed",
        message: `Cannot resolve from disposed container`,
        tokenDescription: String(token),
      };
      const domainError: DomainContainerError = {
        code: error.code,
        message: error.message,
        cause: error.cause,
      };
      return err(domainError);
    }

    if (this.getValidationState() !== "validated") {
      const error: ContainerError = {
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token),
      };
      const domainError: DomainContainerError = {
        code: error.code,
        message: error.message,
        cause: error.cause,
      };
      return err(domainError);
    }

    const result = this.resolver.resolve(token as InjectionToken<T>);
    if (!result.ok) {
      // Convert ContainerError to DomainContainerError
      const domainError: DomainContainerError = {
        code: result.error.code,
        message: result.error.message,
        cause: result.error.cause,
      };
      return err(domainError);
    }
    return result as Result<T, ContainerError>;
  }

  /**
   * Resolves a service instance (throws on failure).
   * FOR EXTERNAL API USE ONLY - uses ApiSafeToken validation.
   */
  resolve<T>(token: InjectionToken<T>): T {
    // Runtime validation is handled by ServiceContainer.resolve()
    // This method is only called after runtime validation passes
    const result = this.resolveWithError(token);

    if (isOk(result)) {
      return castResolvedService<T>(result.value);
    }

    // No fallback - throw with context
    throw new Error(`Cannot resolve ${String(token)}: ${result.error.message}`);
  }
}
