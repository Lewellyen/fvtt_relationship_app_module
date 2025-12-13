---
principle: ISP
severity: low
confidence: high
component_kind: interface
component_name: "PlatformEntityCollectionPort"
file: "src/domain/ports/collections/platform-entity-collection-port.interface.ts"
location:
  start_line: 23
  end_line: 129
tags: ["interface-segregation", "collection", "query"]
---

# Problem

Das Interface `PlatformEntityCollectionPort` definiert viele Methoden (~7 Methoden) für verschiedene Query-Operationen. Clients, die nur einfache Read-Operationen benötigen, müssen trotzdem alle Methoden implementieren, auch wenn sie z.B. keine Query-Builder-Funktionalität benötigen.

## Evidence

```23:129:src/domain/ports/collections/platform-entity-collection-port.interface.ts
export interface PlatformEntityCollectionPort<TEntity> {
  /**
   * Get all entities in the collection.
   */
  getAll(): Result<TEntity[], EntityCollectionError>;

  /**
   * Get a specific entity by its ID.
   */
  getById(id: string): Result<TEntity | null, EntityCollectionError>;

  /**
   * Get multiple entities by their IDs.
   */
  getByIds(ids: string[]): Result<TEntity[], EntityCollectionError>;

  /**
   * Check if an entity exists.
   */
  exists(id: string): Result<boolean, EntityCollectionError>;

  /**
   * Get the total count of entities in the collection.
   */
  count(): Result<number, EntityCollectionError>;

  /**
   * Search entities with a query object.
   */
  search(query: EntitySearchQuery<TEntity>): Result<TEntity[], EntityCollectionError>;

  /**
   * Create a query builder for fluent API.
   */
  query(): EntityQueryBuilder<TEntity>;
}
```

Das Interface definiert:
- **Einfache Read-Operationen**: `getAll()`, `getById()`, `getByIds()`, `exists()`, `count()`
- **Erweiterte Query-Operationen**: `search()`, `query()`

## Impact

- **Viele Methoden**: ~7 Methoden in einem Interface
- **Potentielle Überlastung**: Clients, die nur einfache Read-Operationen benötigen, müssen auch Query-Methoden implementieren
- **Schwerer zu mocken**: Viele Methoden bedeuten viele Mock-Implementierungen

## Recommendation

**Option 1: Separate Interfaces (Optional)**
Interfaces nach Komplexität trennen:

```typescript
// Einfache Read-Operationen
export interface PlatformEntityBasicCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityCollectionError>;
  getById(id: string): Result<TEntity | null, EntityCollectionError>;
  getByIds(ids: string[]): Result<TEntity[], EntityCollectionError>;
  exists(id: string): Result<boolean, EntityCollectionError>;
  count(): Result<number, EntityCollectionError>;
}

// Erweiterte Query-Operationen
export interface PlatformEntityQueryCollectionPort<TEntity> {
  search(query: EntitySearchQuery<TEntity>): Result<TEntity[], EntityCollectionError>;
  query(): EntityQueryBuilder<TEntity>;
}

// Vollständiges Collection-Interface
export interface PlatformEntityCollectionPort<TEntity>
  extends PlatformEntityBasicCollectionPort<TEntity>,
          PlatformEntityQueryCollectionPort<TEntity> {
}
```

**Option 2: Keine Änderung (Empfohlen)**
Die Methoden sind alle für Read-Operationen und gehören semantisch zusammen. Die Trennung würde die Komplexität erhöhen, ohne großen Nutzen zu bringen.

## Example Fix

Falls Trennung gewünscht wird:

```typescript
// src/domain/ports/collections/platform-entity-basic-collection-port.interface.ts
export interface PlatformEntityBasicCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityCollectionError>;
  getById(id: string): Result<TEntity | null, EntityCollectionError>;
  getByIds(ids: string[]): Result<TEntity[], EntityCollectionError>;
  exists(id: string): Result<boolean, EntityCollectionError>;
  count(): Result<number, EntityCollectionError>;
}
```

```typescript
// src/domain/ports/collections/platform-entity-query-collection-port.interface.ts
export interface PlatformEntityQueryCollectionPort<TEntity> {
  search(query: EntitySearchQuery<TEntity>): Result<TEntity[], EntityCollectionError>;
  query(): EntityQueryBuilder<TEntity>;
}
```

```typescript
// src/domain/ports/collections/platform-entity-collection-port.interface.ts
export interface PlatformEntityCollectionPort<TEntity>
  extends PlatformEntityBasicCollectionPort<TEntity>,
          PlatformEntityQueryCollectionPort<TEntity> {
}
```

## Notes

- **Status**: Low Severity, da alle Methoden für Read-Operationen sind und semantisch zusammengehören
- Die aktuelle Struktur ist für eine Collection-Interface angemessen
- **Empfehlung**: Option 2 (keine Änderung) - die Methoden gehören zusammen
- Eine Trennung würde die Komplexität erhöhen, ohne großen Nutzen zu bringen
- Clients, die nur einfache Operationen benötigen, können die erweiterten Methoden mit leeren Implementierungen oder Fehlern versehen

