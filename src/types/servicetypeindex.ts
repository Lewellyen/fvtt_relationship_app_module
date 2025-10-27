/**
 * Type definitions for all service types used in dependency injection.
 */
import type { Logger } from "@/interfaces/logger";

/**
 * Union type representing all registered service types in the application.
 * Add new service interfaces to this union as you create them.
 *
 * @example
 * ```typescript
 * // Add a new service:
 * export type ServiceType = Logger | Database | Cache;
 * ```
 */
export type ServiceType = Logger;
