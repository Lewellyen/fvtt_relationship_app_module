import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceType } from "../service-type-registry";

/**
 * Type definition for service dependencies.
 * Represents an array of injection tokens that a service depends on.
 *
 * Dependencies are declared in the service class as a static property
 * and are automatically resolved by the container when the service is instantiated.
 *
 * @typedef {readonly Array<InjectionToken>} ServiceDependencies
 *
 * @example
 * ```typescript
 * class UserService {
 *   static dependencies = [LoggerToken, DatabaseToken] as const;
 *
 *   constructor(
 *     private logger: Logger,
 *     private database: Database
 *   ) {}
 * }
 * ```
 */
export type ServiceDependencies = readonly InjectionToken<ServiceType>[];
