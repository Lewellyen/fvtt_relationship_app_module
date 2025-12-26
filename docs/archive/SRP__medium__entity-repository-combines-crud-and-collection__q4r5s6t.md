---
principle: SRP
severity: medium
confidence: high
component_kind: interface
component_name: "PlatformEntityRepository"
file: "src/domain/ports/repositories/platform-entity-repository.interface.ts"
location:
  start_line: 1
  end_line: 33
tags: ["responsibility", "interface", "repository", "crud", "resolved"]
status: resolved
resolved_date: "2025-12-26"
related_findings:
  - "docs/archive/ISP__medium__entity-repository-fat-interface__g4h5i6j.md"
---

# Problem (RESOLVED)

**Status: ✅ RESOLVED** - Das Problem wurde durch das ISP-Refactoring behoben (siehe [ISP Finding](docs/archive/ISP__medium__entity-repository-fat-interface__g4h5i6j.md) und [CHANGELOG v0.33.0](CHANGELOG.md#0330))

Das Interface `PlatformEntityRepository` kombinierte ursprünglich zwei unterschiedliche Verantwortlichkeiten:
1. **Collection-Operationen** (Read-Only): Erbt von `PlatformEntityCollectionPort` (getAll, getById, search, query, etc.)
2. **CRUD-Operationen** (Write): Create, Update, Delete, Flag-Operationen

Das ursprüngliche Interface war sehr groß (227 Zeilen) und definierte viele Methoden (~19 Methoden), was als Verstoß gegen SRP angesehen werden konnte.

## Lösung (Implementiert)

**Option 2 wurde umgesetzt**: Das Interface wurde in separate, fokussierte Interfaces aufgeteilt:

1. **`PlatformEntityReadRepository<TEntity>`**: Enthält nur Read-Operationen (erbt von `PlatformEntityCollectionPort`)
   - Datei: `src/domain/ports/repositories/platform-entity-read-repository.interface.ts`
   - Verantwortlichkeit: Nur Read-Operationen

2. **`PlatformEntityWriteRepository<TEntity>`**: Enthält Write-Operationen (create, update, delete, flags)
   - Datei: `src/domain/ports/repositories/platform-entity-write-repository.interface.ts`
   - Verantwortlichkeit: Nur Write-Operationen

3. **`PlatformEntityRepository<TEntity>`**: Kombiniert beide Interfaces durch Multi-Inheritance
   - Datei: `src/domain/ports/repositories/platform-entity-repository.interface.ts`
   - Verantwortlichkeit: Zusammengesetztes Interface für vollständige CRUD-Operationen

## Aktuelle Struktur

```1:33:src/domain/ports/repositories/platform-entity-repository.interface.ts
import type { PlatformEntityReadRepository } from "./platform-entity-read-repository.interface";
import type { PlatformEntityWriteRepository } from "./platform-entity-write-repository.interface";

// Re-export types for backward compatibility
export type {
  CreateEntityData,
  EntityChanges,
  EntityRepositoryError,
} from "./platform-entity-repository.types";

/**
 * Generic port for entity repository with full CRUD operations.
 *
 * Combines read and write repository operations.
 * Extends both PlatformEntityReadRepository and PlatformEntityWriteRepository.
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
export interface PlatformEntityRepository<TEntity>
  extends PlatformEntityReadRepository<TEntity>, PlatformEntityWriteRepository<TEntity> {
  // Kombiniert Read- und Write-Operationen
  // Alle Methoden werden von den erweiterten Interfaces geerbt
}
```

**Vorteile der neuen Struktur:**
- ✅ **Klar getrennte Verantwortlichkeiten**: Read- und Write-Operationen sind in separaten Interfaces
- ✅ **Viel kleineres Haupt-Interface**: Nur noch 33 Zeilen statt 227 Zeilen
- ✅ **Bessere Testbarkeit**: Mocks können nur die benötigten Interfaces implementieren (Read-only oder Write-only)
- ✅ **Backward Compatible**: Public API bleibt vollständig kompatibel, da `PlatformEntityRepository` alle ursprünglichen Methoden enthält
- ✅ **SRP-konform**: Jedes Interface hat jetzt eine einzige, klare Verantwortlichkeit

## Impact (Vorher → Nachher)

**Vorher:**
- ❌ Große Interface-Definition: 227 Zeilen
- ❌ Viele Methoden: ~19 Methoden in einem Interface
- ❌ Zwei Verantwortlichkeiten in einem Interface (Read + Write)

**Nachher:**
- ✅ Kompaktes Haupt-Interface: 33 Zeilen
- ✅ Klare Trennung: Read- und Write-Operationen in separaten Interfaces
- ✅ Jedes Interface hat eine einzige Verantwortlichkeit (SRP-konform)

## Verwandte Findings

- **ISP-Finding**: Das gleiche Problem wurde auch als ISP-Violation identifiziert und dokumentiert: [ISP__medium__entity-repository-fat-interface__g4h5i6j.md](docs/archive/ISP__medium__entity-repository-fat-interface__g4h5i6j.md)
- **CHANGELOG**: Das Refactoring wurde in Version 0.33.0 dokumentiert: [CHANGELOG.md](CHANGELOG.md#0330)

## Notes

- **Status**: ✅ RESOLVED - Das Problem wurde erfolgreich behoben
- Das Refactoring wurde als ISP-Refactoring durchgeführt, löst aber gleichzeitig auch das SRP-Problem
- Die neue Struktur folgt sowohl SRP als auch ISP
- Backward Compatibility wurde vollständig erhalten

