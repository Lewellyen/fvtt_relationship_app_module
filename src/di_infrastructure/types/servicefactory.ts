// TypeServiceFactory.ts: Type for service factories
import type { ServiceType } from "@/types/servicetypeindex";

/**
 * A factory function type that creates instances of a service.
 * Used by the DI container to instantiate services on-demand based on their lifecycle.
 * 
 * @template TServiceType - The type of service this factory creates (must extend ServiceType)
 * @returns A new instance of the service
 * 
 * @remarks
 * - Factory functions are lazily executed when a service is resolved
 * - The container caches instances based on the service lifecycle (Singleton/Transient/Scoped)
 * - Each call to the factory function creates a new instance unless cached
 * 
 * @example
 * ```typescript
 * // Simple service factory
 * const loggerFactory: ServiceFactory<Logger> = () => new Logger();
 * 
 * // Factory with initialization
 * const dbFactory: ServiceFactory<Database> = () => {
 *   const db = new Database();
 *   db.configure(config);
 *   return db;
 * };
 * 
 * // Factory using dependencies from container
 * const userRepoFactory: ServiceFactory<UserRepository> = () => {
 *   const db = container.resolve(DatabaseToken);
 *   return new UserRepository(db);
 * };
 * ```
 */
export type ServiceFactory<TServiceType extends ServiceType> = () => TServiceType;