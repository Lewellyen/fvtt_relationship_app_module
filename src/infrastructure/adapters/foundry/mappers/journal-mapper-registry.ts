import type { JournalMapper } from "./journal-mapper.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";

/**
 * Registry for journal mappers with priority-based selection.
 *
 * When mapping a Foundry entity to domain, the registry returns the first mapper
 * that supports the entity (based on registration order).
 *
 * This enables extensible mapping: new mappers can be registered to handle
 * additional fields or entity variants without modifying existing code (OCP).
 *
 * @example
 * ```typescript
 * const registry = new JournalMapperRegistry();
 * registry.register(new DefaultJournalMapper());
 * registry.register(new FolderJournalMapper());
 *
 * const domainEntry = registry.mapToDomain(foundryEntry);
 * ```
 */
export class JournalMapperRegistry {
  private readonly mappers: JournalMapper[] = [];

  /**
   * Registers a mapper with the registry.
   *
   * Mappers are checked in registration order (first registered = highest priority).
   * The first mapper that returns true for `supports()` will be used.
   *
   * @param mapper - The mapper to register
   * @throws Error if the mapper is already registered
   */
  register(mapper: JournalMapper): void {
    if (this.mappers.includes(mapper)) {
      throw new Error("Mapper is already registered");
    }
    this.mappers.push(mapper);
  }

  /**
   * Unregisters a mapper from the registry.
   *
   * @param mapper - The mapper to unregister
   */
  unregister(mapper: JournalMapper): void {
    const index = this.mappers.indexOf(mapper);
    if (index !== -1) {
      this.mappers.splice(index, 1);
    }
  }

  /**
   * Returns all registered mappers in priority order.
   *
   * @returns Array of mappers (first = highest priority)
   */
  getAll(): readonly JournalMapper[] {
    return [...this.mappers];
  }

  /**
   * Finds the first mapper that supports the given entity.
   *
   * @param entity - The Foundry entity to find a mapper for
   * @returns The first matching mapper, or undefined if none found
   */
  findMapper(entity: unknown): JournalMapper | undefined {
    return this.mappers.find((mapper) => mapper.supports(entity));
  }

  /**
   * Maps a Foundry journal entry to a domain journal entry using the first matching mapper.
   *
   * @param entity - The Foundry journal entry to map
   * @returns The domain journal entry
   * @throws Error if no mapper supports the entity
   */
  mapToDomain(entity: unknown): JournalEntry {
    const mapper = this.findMapper(entity);
    if (!mapper) {
      throw new Error(`No mapper found for entity: ${JSON.stringify(entity).substring(0, 100)}`);
    }

    // Type narrowing: mapper.supports() is a type guard
    if (!mapper.supports(entity)) {
      throw new Error(
        `Mapper supports() returned false after findMapper() returned it: ${mapper.constructor.name}`
      );
    }

    return mapper.toDomain(entity);
  }

  /**
   * Validates that no two mappers have overlapping support.
   *
   * This is useful for detecting configuration errors during development.
   * Note: This is a best-effort check and may not catch all overlaps.
   *
   * @param testEntities - Optional array of test entities to check against
   * @returns Array of conflicts (empty if none)
   */
  validateNoOverlaps(testEntities: unknown[] = []): Array<{
    entity: unknown;
    mappers: JournalMapper[];
  }> {
    const conflicts: Array<{ entity: unknown; mappers: JournalMapper[] }> = [];

    for (const entity of testEntities) {
      const matchingMappers = this.mappers.filter((mapper) => mapper.supports(entity));
      if (matchingMappers.length > 1) {
        conflicts.push({
          entity,
          mappers: matchingMappers,
        });
      }
    }

    return conflicts;
  }
}
