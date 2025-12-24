---
principle: ISP
severity: medium
confidence: high
component_kind: interface
component_name: "PlatformEntityRepository"
file: "src/domain/ports/repositories/platform-entity-repository.interface.ts"
location:
  start_line: 21
  end_line: 227
tags: ["interface-segregation", "fat-interface", "repository"]
---

# Problem

Das Interface `PlatformEntityRepository` ist sehr groß und definiert viele Methoden (~19 Methoden). Clients, die nur Read-Operationen benötigen, müssen trotzdem alle Write-Methoden (Create, Update, Delete, Flags) implementieren, auch wenn sie diese nicht verwenden.

## Evidence

```21:227:src/domain/ports/repositories/platform-entity-repository.interface.ts
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

Zusätzlich erbt das Interface von `PlatformEntityCollectionPort`, welches weitere ~7 Methoden definiert:
- `getAll()`, `getById()`, `getByIds()`, `exists()`, `count()`, `search()`, `query()`

**Gesamt: ~19 Methoden in einem Interface**

## Impact

- **Fat Interface**: Clients müssen alle Methoden implementieren, auch wenn sie nicht alle benötigen
- **Schwerer zu mocken**: Viele Methoden bedeuten viele Mock-Implementierungen in Tests
- **Tight Coupling**: Clients sind an das gesamte Interface gekoppelt, nicht nur an die benötigten Methoden
- **Read-Only Use Cases**: Clients, die nur Read-Operationen benötigen, müssen trotzdem Write-Methoden implementieren

## Recommendation

**Option 1: Separate Interfaces (Empfohlen)**
Interfaces nach Verantwortlichkeit trennen:

```typescript
// Read-only Repository
export interface PlatformEntityReadRepository<TEntity>
  extends PlatformEntityCollectionPort<TEntity> {
  // Nur Read-Operationen
}

// Write-only Repository
export interface PlatformEntityWriteRepository<TEntity> {
  create(data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  update(id: string, changes: EntityChanges<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  // ... weitere Write-Operationen
}

// Full Repository (kombiniert beide)
export interface PlatformEntityRepository<TEntity>
  extends PlatformEntityReadRepository<TEntity>,
          PlatformEntityWriteRepository<TEntity> {
  // Optional: Zusätzliche kombinierte Operationen
}
```

**Option 2: Keine Änderung (Akzeptabel für Domain-Layer)**
Für den Domain-Layer könnte es akzeptabel sein, dass das Repository-Interface alle Operationen definiert. Implementierungen können leere Implementierungen für nicht benötigte Methoden bereitstellen.

## Example Fix

```typescript
// src/domain/ports/repositories/platform-entity-read-repository.interface.ts
import type { PlatformEntityCollectionPort } from "../collections/platform-entity-collection-port.interface";

export interface PlatformEntityReadRepository<TEntity>
  extends PlatformEntityCollectionPort<TEntity> {
  // Nur Read-Operationen (geerbt von PlatformEntityCollectionPort)
}
```

```typescript
// src/domain/ports/repositories/platform-entity-write-repository.interface.ts
import type { Result } from "@/domain/types/result";
import type { CreateEntityData, EntityChanges, EntityRepositoryError } from "./platform-entity-repository.interface";

export interface PlatformEntityWriteRepository<TEntity> {
  create(data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  createMany(data: CreateEntityData<TEntity>[]): Promise<Result<TEntity[], EntityRepositoryError>>;
  update(id: string, changes: EntityChanges<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;
  updateMany(updates: Array<{ id: string; changes: EntityChanges<TEntity> }>): Promise<Result<TEntity[], EntityRepositoryError>>;
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  deleteMany(ids: string[]): Promise<Result<void, EntityRepositoryError>>;
  // ... Flag-Operationen
}
```

```typescript
// src/domain/ports/repositories/platform-entity-repository.interface.ts
import type { PlatformEntityReadRepository } from "./platform-entity-read-repository.interface";
import type { PlatformEntityWriteRepository } from "./platform-entity-write-repository.interface";

export interface PlatformEntityRepository<TEntity>
  extends PlatformEntityReadRepository<TEntity>,
          PlatformEntityWriteRepository<TEntity> {
  // Optional: Zusätzliche kombinierte Operationen wie upsert()
}
```

## Notes

- **Status**: Medium Severity, da das Interface groß ist, aber die Vererbung semantisch korrekt ist
- Die aktuelle Struktur folgt dem Repository-Pattern korrekt
- **Empfehlung**: Option 1 (Separate Interfaces) für bessere Interface-Segregation
- Dies würde es Clients ermöglichen, nur die benötigten Interfaces zu implementieren
- Read-Only-Repositories könnten `PlatformEntityReadRepository` implementieren, ohne Write-Methoden implementieren zu müssen

