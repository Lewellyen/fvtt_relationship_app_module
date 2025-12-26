import type { Result } from "@/domain/types/result";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import type { EntitySearchQuery } from "@/domain/ports/collections/entity-search-query.interface";
import type { EntityQueryBuilder } from "@/domain/ports/collections/entity-query-builder.interface";
import type { EntityFilter } from "@/domain/ports/collections/entity-search-query.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { JournalMapperRegistry } from "../mappers/journal-mapper-registry";
import { DefaultJournalMapper } from "../mappers/default-journal-mapper";
import { ok, err } from "@/domain/utils/result";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { FilterOperatorRegistry } from "./filter-operator-registry";
import { createDefaultFilterOperators } from "./default-filter-operators";

/**
 * Foundry-specific implementation of PlatformJournalCollectionPort.
 *
 * Maps Foundry's game.journal collection to platform-agnostic journal collection port.
 * Type mapping is handled by JournalMapperRegistry (OCP-compliant).
 * Filter operators are handled by FilterOperatorRegistry (OCP-compliant Strategy Pattern).
 */
export class FoundryJournalCollectionAdapter implements PlatformJournalCollectionPort {
  constructor(
    private readonly foundryGame: FoundryGame, // FoundryGamePort (version-agnostisch), nicht FoundryV13GamePort!
    private readonly mapperRegistry: JournalMapperRegistry, // Mapper registry for extensible mapping (OCP)
    private readonly operatorRegistry: FilterOperatorRegistry = createDefaultFilterOperators() // Operator registry for extensible filtering (OCP)
  ) {}

  getAll(): Result<JournalEntry[], EntityCollectionError> {
    const result = this.foundryGame.getJournalEntries();

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "COLLECTION_NOT_AVAILABLE",
          message: `Failed to get journals from Foundry: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    // Map Foundry types → Domain types using mapper registry
    const entries: JournalEntry[] = [];
    for (const foundryEntry of result.value) {
      try {
        entries.push(this.mapperRegistry.mapToDomain(foundryEntry));
      } catch (error) {
        return err({
          code: "PLATFORM_ERROR",
          message: `Failed to map journal entry to domain: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
        });
      }
    }

    return ok(entries);
  }

  getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
    const result = this.foundryGame.getJournalEntryById(id);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: `Failed to get journal ${id} from Foundry: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    // Not found → return null (not an error)
    if (!result.value) {
      return ok(null);
    }

    // Map Foundry type → Domain type using mapper registry
    try {
      const entry = this.mapperRegistry.mapToDomain(result.value);
      return ok(entry);
    } catch (error) {
      return err({
        code: "PLATFORM_ERROR",
        message: `Failed to map journal entry to domain: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }

  getByIds(ids: string[]): Result<JournalEntry[], EntityCollectionError> {
    const results: JournalEntry[] = [];
    const errors: EntityCollectionError[] = [];

    for (const id of ids) {
      const result = this.getById(id);
      if (!result.ok) {
        errors.push(result.error);
      } else if (result.value) {
        // Found - add to results
        results.push(result.value);
      }
      // else: Not found - skip (not an error for batch operations)
    }

    if (errors.length > 0) {
      // Guaranteed to exist due to length > 0 check
      // type-coverage:ignore-next-line - Array with length > 0 guarantees element at index 0
      const firstError = errors[0]!;
      return err(firstError);
    }

    return ok(results);
  }

  exists(id: string): Result<boolean, EntityCollectionError> {
    const result = this.getById(id);
    if (!result.ok) {
      return result; // Propagate error
    }
    return ok(result.value !== null);
  }

  count(): Result<number, EntityCollectionError> {
    const result = this.getAll();
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }
    return ok(result.value.length);
  }

  search(query: EntitySearchQuery<JournalEntry>): Result<JournalEntry[], EntityCollectionError> {
    // Get all entities first
    const allResult = this.getAll();
    if (!allResult.ok) {
      return allResult;
    }

    let results = allResult.value;

    // Apply filters
    if (query.filters && query.filters.length > 0) {
      const filters = query.filters; // Type narrowing
      results = results.filter((entity) => {
        // All filters must match (AND logic)
        return filters.every((filter) => {
          const fieldValue = entity[filter.field];
          return this.matchesFilter(fieldValue, filter.operator, filter.value);
        });
      });
    }

    // Apply filter groups (for complex AND/OR logic)
    if (query.filterGroups && query.filterGroups.length > 0) {
      const filterGroups = query.filterGroups; // Type narrowing
      results = results.filter((entity) => {
        // All groups must match (AND between groups)
        return filterGroups.every((group) => {
          if (group.filters.length === 0) return true;

          if (group.logic === "OR") {
            // At least one filter in group must match
            return group.filters.some((filter) => {
              const fieldValue = entity[filter.field];
              return this.matchesFilter(fieldValue, filter.operator, filter.value);
            });
          } else {
            // All filters in group must match (AND)
            return group.filters.every((filter) => {
              const fieldValue = entity[filter.field];
              return this.matchesFilter(fieldValue, filter.operator, filter.value);
            });
          }
        });
      });
    }

    // Apply sorting
    if (query.sortBy) {
      const sortBy = query.sortBy; // Type narrowing
      results.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return query.sortOrder === "desc" ? -comparison : comparison;
      });
    }

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return ok(results);
  }

  query(): EntityQueryBuilder<JournalEntry> {
    return new FoundryJournalQueryBuilder(this);
  }

  /**
   * Checks if a field value matches a filter using the registered operator.
   *
   * Uses FilterOperatorRegistry (Strategy Pattern) for OCP-compliant extensibility.
   * New operators can be added without modifying this method.
   *
   * @param fieldValue - The value from the entity field
   * @param operator - The operator name (e.g., "equals", "contains")
   * @param filterValue - The value from the filter
   * @returns true if the field value matches the filter, false otherwise
   */
  private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
    const op = this.operatorRegistry.get(operator);
    if (!op) {
      return false; // Unknown operator → no match
    }
    return op.matches(fieldValue, filterValue);
  }
}

/**
 * Query builder implementation for Foundry journal collection.
 */
class FoundryJournalQueryBuilder implements EntityQueryBuilder<JournalEntry> {
  private query: EntitySearchQuery<JournalEntry> = {};
  private currentOrGroup: Array<{
    field: keyof JournalEntry;
    operator: EntityFilter<JournalEntry>["operator"];
    value: unknown;
  }> | null = null;

  constructor(private readonly adapter: FoundryJournalCollectionAdapter) {}

  where(
    field: keyof JournalEntry,
    operator: EntityFilter<JournalEntry>["operator"],
    value: unknown
  ): EntityQueryBuilder<JournalEntry> {
    // If we're inside an or() callback, add to currentOrGroup
    if (this.currentOrGroup !== null) {
      this.currentOrGroup.push({ field, operator, value });
      return this;
    }

    // Otherwise, close any open OR group and add to AND filters
    this.closeOrGroup();

    if (!this.query.filters) {
      this.query.filters = [];
    }
    this.query.filters.push({ field, operator, value });
    return this;
  }

  orWhere(
    field: keyof JournalEntry,
    operator: EntityFilter<JournalEntry>["operator"],
    value: unknown
  ): EntityQueryBuilder<JournalEntry> {
    // Start OR group if not already started
    if (this.currentOrGroup === null) {
      this.currentOrGroup = [];
      // Move the last where() filter into the OR group
      if (this.query.filters && this.query.filters.length > 0) {
        // type-coverage:ignore-next-line - Array with length > 0 guarantees element from pop()
        const lastFilter = this.query.filters.pop()!;
        this.currentOrGroup.push({
          field: lastFilter.field,
          operator: lastFilter.operator,
          value: lastFilter.value,
        });
      }
    }

    this.currentOrGroup.push({ field, operator, value });
    return this;
  }

  or(callback: (qb: EntityQueryBuilder<JournalEntry>) => void): EntityQueryBuilder<JournalEntry> {
    // Close any open OR group first
    this.closeOrGroup();

    // Create new OR group
    const orGroup: Array<{
      field: keyof JournalEntry;
      operator: EntityFilter<JournalEntry>["operator"];
      value: unknown;
    }> = [];

    // Move the last where() filter into the OR group
    if (this.query.filters && this.query.filters.length > 0) {
      // type-coverage:ignore-next-line - Array with length > 0 guarantees element from pop()
      const lastFilter = this.query.filters.pop()!;
      orGroup.push({
        field: lastFilter.field,
        operator: lastFilter.operator,
        value: lastFilter.value,
      });
    }

    // Temporarily set currentOrGroup to capture filters from callback
    const originalOrGroup = this.currentOrGroup;
    this.currentOrGroup = orGroup;

    // Execute callback - where() calls inside will be captured in orGroup
    callback(this);

    // Restore original state
    this.currentOrGroup = originalOrGroup;

    // Add OR group to filterGroups
    if (orGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "OR",
        filters: orGroup.map((f) => ({ field: f.field, operator: f.operator, value: f.value })),
      });
    }

    return this;
  }

  and(callback: (qb: EntityQueryBuilder<JournalEntry>) => void): EntityQueryBuilder<JournalEntry> {
    // Close any open OR group first
    this.closeOrGroup();

    // Create new AND group
    const andGroup: Array<{
      field: keyof JournalEntry;
      operator: EntityFilter<JournalEntry>["operator"];
      value: unknown;
    }> = [];

    // Temporarily set filters to capture where() calls from callback
    const originalFilters = this.query.filters;
    this.query.filters = andGroup as EntityFilter<JournalEntry>[];

    // Execute callback - where() calls inside will be captured in andGroup
    callback(this);

    // Restore original state
    if (originalFilters !== undefined) {
      this.query.filters = originalFilters;
    } else {
      delete this.query.filters;
    }

    // Add AND group to filterGroups
    if (andGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "AND",
        filters: andGroup.map((f) => ({ field: f.field, operator: f.operator, value: f.value })),
      });
    }

    return this;
  }

  limit(count: number): EntityQueryBuilder<JournalEntry> {
    this.closeOrGroup(); // Close OR group before limit
    this.query.limit = count;
    return this;
  }

  offset(count: number): EntityQueryBuilder<JournalEntry> {
    this.closeOrGroup(); // Close OR group before offset
    this.query.offset = count;
    return this;
  }

  sortBy(field: keyof JournalEntry, order: "asc" | "desc"): EntityQueryBuilder<JournalEntry> {
    this.closeOrGroup(); // Close OR group before sort
    this.query.sortBy = field;
    this.query.sortOrder = order;
    return this;
  }

  execute(): Result<JournalEntry[], EntityCollectionError> {
    this.closeOrGroup(); // Close any open OR group before execution
    return this.adapter.search(this.query);
  }

  /**
   * Closes the current OR group and adds it to filterGroups.
   * Called automatically before where(), limit(), offset(), sortBy(), execute().
   */
  private closeOrGroup(): void {
    if (this.currentOrGroup && this.currentOrGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "OR",
        filters: this.currentOrGroup.map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value,
        })),
      });
      this.currentOrGroup = null;
    }
  }
}

// DI-Wrapper
export class DIFoundryJournalCollectionAdapter extends FoundryJournalCollectionAdapter {
  static dependencies = [foundryGameToken] as const; // foundryGameToken → FoundryGamePort (version-agnostisch)

  constructor(foundryGame: FoundryGame) {
    // FoundryGamePort wird injiziert
    // Create mapper registry with default mapper
    // Note: Registry should be injected via DI in the future for better testability
    const mapperRegistry = new JournalMapperRegistry();
    mapperRegistry.register(new DefaultJournalMapper());
    super(foundryGame, mapperRegistry);
  }
}
