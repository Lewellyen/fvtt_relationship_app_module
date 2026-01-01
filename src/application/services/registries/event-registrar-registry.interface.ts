/**
 * Interface for event registrar registries.
 *
 * Implements Open/Closed Principle: New event registrars can be added by extending
 * the registry without modifying ModuleEventRegistrar.
 *
 * **Design Rationale:**
 * - Open/Closed: ModuleEventRegistrar is closed for modification but open for extension via registries
 * - Single Responsibility: Registry only provides event registrars
 * - Dependency Inversion: ModuleEventRegistrar depends on abstraction, not concrete implementations
 */

import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";

/**
 * Registry that provides event registrars for registration.
 *
 * @see ModuleEventRegistrar for usage
 */
export interface EventRegistrarRegistry {
  /**
   * Returns all event registrars that should be registered.
   *
   * @returns Array of event registrars
   */
  getAll(): readonly EventRegistrar[];
}
