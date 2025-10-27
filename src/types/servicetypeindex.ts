// servicetypesindex.ts: Type definitions for service types
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