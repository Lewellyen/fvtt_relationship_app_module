import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceDependencies } from "@/di_infrastructure/types/servicedependencies";

/**
 * Type definition for service classes that can be registered in the container.
 * Services using this interface must have a constructor and optionally declare dependencies.
 *
 * **Features:**
 * - Constructor signature: `new (...args: any[]) => T`
 * - Optional static dependencies: `static dependencies?: ServiceDependencies`
 *
 * @interface ServiceClass
 * @template T - The service type this class implements (must extend ServiceType)
 *
 * @example
 * ```typescript
 * class LoggerService implements ServiceClass<Logger> {
 *   static dependencies = [] as const;  // No dependencies
 *   constructor() {}
 * }
 * ```
 *
 * @example
 * ```typescript
 * class UserService implements ServiceClass<UserService> {
 *   static dependencies = [LoggerToken, DatabaseToken] as const;
 *
 *   constructor(
 *     private logger: Logger,
 *     private database: Database
 *   ) {}
 * }
 * ```
 */
export interface ServiceClass<T extends ServiceType> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* type-coverage:ignore-next-line -- Variadic constructor: Constructor needs `any[]` to accept variable arguments during dependency injection */
  new (...args: any[]): T;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  dependencies?: ServiceDependencies;
}
