import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";
import type { ServiceRegistration } from "../types/core/serviceregistration";
import type { DependencyResolver } from "./dependency-resolver.interface";
import type { ServiceInstantiator } from "./service-instantiation.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * Instantiates service instances based on registration type.
 *
 * Responsibilities:
 * - Handle class instantiation with dependency injection
 * - Handle factory function calls
 * - Handle value returns
 * - Wrap errors in ContainerError format
 *
 * This class separates service instantiation logic from ServiceResolver,
 * following the Single Responsibility Principle.
 *
 * Uses DependencyResolver interface instead of ServiceResolver to break
 * circular dependency (Dependency Inversion Principle).
 */
export class ServiceInstantiatorImpl implements ServiceInstantiator {
  constructor(private readonly dependencyResolver: DependencyResolver) {}

  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Handles dependency resolution for classes, direct factory calls, and value returns.
   *
   * @template T - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiate<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>
  ): Result<T, ContainerError> {
    if (registration.serviceClass) {
      // Class: Resolve all dependencies first
      const resolvedDeps: unknown[] = [];

      for (const dep of registration.dependencies) {
        const depResult = this.dependencyResolver.resolve(dep);
        if (!depResult.ok) {
          // Return structured error with cause chain
          return err({
            code: "DependencyResolveFailed",
            message: `Cannot resolve dependency ${String(dep)} for ${String(token)}`,
            tokenDescription: String(dep),
            cause: depResult.error,
          });
        }
        resolvedDeps.push(depResult.value);
      }

      // Instantiate class with resolved dependencies
      try {
        return ok(new registration.serviceClass(...resolvedDeps));
      } catch (constructorError) {
        return err({
          code: "FactoryFailed",
          message: `Constructor failed for ${String(token)}: ${String(constructorError)}`,
          tokenDescription: String(token),
          cause: constructorError,
        });
      }
    } else if (registration.factory) {
      // Factory: Call directly
      try {
        return ok(registration.factory());
      } catch (factoryError) {
        return err({
          code: "FactoryFailed",
          message: `Factory failed for ${String(token)}: ${String(factoryError)}`,
          tokenDescription: String(token),
          cause: factoryError,
        });
      }
    } else if (registration.value !== undefined) {
      // Value: Return as-is
      return ok(registration.value);
    } else {
      // Invalid registration
      return err({
        code: "InvalidOperation",
        message: `Invalid registration for ${String(token)} - no class, factory, or value`,
        tokenDescription: String(token),
      });
    }
  }
}
