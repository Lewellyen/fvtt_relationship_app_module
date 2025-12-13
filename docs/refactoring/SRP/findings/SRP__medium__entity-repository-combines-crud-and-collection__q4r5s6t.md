---
principle: SRP
severity: medium
confidence: high
component_kind: interface
component_name: "PlatformEntityRepository"
file: "src/domain/ports/repositories/platform-entity-repository.interface.ts"
location:
  start_line: 1
  end_line: 227
tags: ["responsibility", "interface", "repository", "crud"]
---

# Problem

Das Interface `PlatformEntityRepository` kombiniert zwei unterschiedliche Verantwortlichkeiten:
1. **Collection-Operationen** (Read-Only): Erbt von `PlatformEntityCollectionPort` (getAll, getById, search, query, etc.)
2. **CRUD-Operationen** (Write): Create, Update, Delete, Flag-Operationen

Während die Vererbung semantisch sinnvoll ist (ein Repository "ist eine" Collection mit zusätzlichen Write-Operationen), könnte dies als Verstoß gegen SRP angesehen werden, da das Interface sehr groß ist (227 Zeilen) und viele Methoden definiert.

## Evidence

```1:227:src/domain/ports/repositories/platform-entity-repository.interface.ts
import type { Result } from "@/domain/types/result";
import type { PlatformEntityCollectionPort } from "../collections/platform-entity-collection-port.interface";

/**
 * Generic port for entity repository with full CRUD operations.
 *
 * Extends collection port with create, update, delete operations.
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 *
 * @template TEntity - The entity type this repository manages
 *
 * @example
 * ```typescript
 * // Journal Repository
 * interface PlatformJournalRepository extends PlatformEntityRepository<JournalEntry> {}
 *
 * // Actor Repository
 * interface ActorRepository extends PlatformEntityRepository<Actor> {}
 * ```
 */
export interface PlatformEntityRepository<TEntity> extends PlatformEntityCollectionPort<TEntity> {
  // ===== CREATE Operations =====
  create(data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  createMany(data: CreateEntityData<TEntity>[]): Promise<Result<TEntity[], EntityRepositoryError>>;

  // ===== UPDATE Operations =====
  update(id: string, changes: EntityChanges<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  updateMany(updates: Array<{ id: string; changes: EntityChanges<TEntity> }>): Promise<Result<TEntity[], EntityRepositoryError>>;
  patch(id: string, partial: Partial<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  upsert(id: string, data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;

  // ===== DELETE Operations =====
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  deleteMany(ids: string[]): Promise<Result<void, EntityRepositoryError>>;

  // ===== Flag Convenience Methods =====
  getFlag(id: string, scope: string, key: string): Result<unknown | null, EntityRepositoryError>;
  setFlag(id: string, scope: string, key: string, value: unknown): Promise<Result<void, EntityRepositoryError>>;
  unsetFlag(id: string, scope: string, key: string): Promise<Result<void, EntityRepositoryError>>;
}
```

Das Interface erbt von `PlatformEntityCollectionPort`, welches bereits folgende Methoden definiert:
- `getAll()`, `getById()`, `getByIds()`, `exists()`, `count()`, `search()`, `query()`

Zusätzlich definiert `PlatformEntityRepository`:
- 3 Create-Methoden (create, createMany)
- 4 Update-Methoden (update, updateMany, patch, upsert)
- 2 Delete-Methoden (delete, deleteMany)
- 3 Flag-Methoden (getFlag, setFlag, unsetFlag)

**Gesamt: ~12 zusätzliche Methoden + ~7 geerbte Methoden = ~19 Methoden**

## Impact

- **Große Interface-Definition**: 227 Zeilen für ein Interface
- **Viele Methoden**: ~19 Methoden in einem Interface
- **Potentielle Überlastung**: Implementierungen müssen alle Methoden implementieren, auch wenn sie nicht alle benötigt werden
- **Schwerer zu testen**: Viele Methoden bedeuten viele Testfälle

## Recommendation

**Option 1: Keine Änderung (Empfohlen für Domain-Layer)**
- Die Vererbung ist semantisch korrekt: Ein Repository "ist eine" Collection mit zusätzlichen Write-Operationen
- Die Trennung zwischen Collection (Read) und Repository (Read+Write) ist bereits vorhanden
- Dies ist ein Domain-Interface, nicht eine konkrete Implementierung - die Komplexität ist hier akzeptabel

**Option 2: Weitere Segregation (Nur wenn nötig)**
Falls bestimmte Clients nur Read-Operationen benötigen, könnten separate Interfaces erstellt werden:
- `PlatformEntityReadRepository<TEntity>`: Nur Read-Operationen (erbt von Collection)
- `PlatformEntityWriteRepository<TEntity>`: Nur Write-Operationen
- `PlatformEntityRepository<TEntity>`: Kombiniert beide (wie aktuell)

Dies würde jedoch die Komplexität erhöhen und ist für den Domain-Layer möglicherweise übertrieben.

## Example Fix

Falls weitere Segregation gewünscht wird:

```typescript
// src/domain/ports/repositories/platform-entity-write-repository.interface.ts
export interface PlatformEntityWriteRepository<TEntity> {
  create(data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  update(id: string, changes: EntityChanges<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  // ... weitere Write-Operationen
}

// src/domain/ports/repositories/platform-entity-repository.interface.ts
export interface PlatformEntityRepository<TEntity>
  extends PlatformEntityCollectionPort<TEntity>,
          PlatformEntityWriteRepository<TEntity> {
  // Optional: Zusätzliche kombinierte Operationen
}
```

## Notes

- **Status**: Dies ist eher eine Beobachtung als ein kritisches Problem
- Die aktuelle Struktur folgt dem Repository-Pattern korrekt
- Die Vererbung von `PlatformEntityCollectionPort` ist semantisch sinnvoll
- **Empfehlung**: Keine Änderung erforderlich, aber dokumentiert für zukünftige Überlegungen
- Dies könnte eher ein ISP-Problem sein (Interface Segregation), wenn Clients gezwungen werden, Methoden zu implementieren, die sie nicht benötigen

