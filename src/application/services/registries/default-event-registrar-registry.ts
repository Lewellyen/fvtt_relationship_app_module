/**
 * Default implementation of EventRegistrarRegistry.
 *
 * Provides all module event registrars for registration.
 * This is the migration path from the hardcoded list in ModuleEventRegistrar.
 */

import type { EventRegistrarRegistry } from "./event-registrar-registry.interface";
import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";

/**
 * Default registry containing all module event registrars.
 *
 * Implements Open/Closed Principle: New event registrars can be added via DI configuration
 * without modifying ModuleEventRegistrar.
 */
export class DefaultEventRegistrarRegistry implements EventRegistrarRegistry {
  constructor(private readonly eventRegistrars: readonly EventRegistrar[]) {}

  getAll(): readonly EventRegistrar[] {
    return this.eventRegistrars;
  }
}
