---
ID: ISP-001
Prinzip: ISP
Schweregrad: Mittel
Module/Layer: application/services + domain/ports
Status: Proposed
---

# 1. Problem

`JournalVisibilityService` benötigt ausschließlich Flag-Lesezugriff, hängt aber von `PlatformJournalRepository` ab, das das volle CRUD-Interface (`PlatformEntityRepository`) inkl. Create/Update/Delete/Batch-Operationen erzwingt. Das verletzt ISP, weil Konsumenten mehr Methoden „mitziehen“, als sie brauchen.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/application/services/JournalVisibilityService.ts`
- `src/domain/ports/repositories/platform-journal-repository.interface.ts`
- `src/domain/ports/repositories/platform-entity-write-repository.interface.ts`

**Minimierte Codeauszüge**
```ts
// src/application/services/JournalVisibilityService.ts
constructor(
  private readonly journalRepository: PlatformJournalRepository,
  ...
) {}

const flagResult = this.journalRepository.getFlag(...);
```
```ts
// src/domain/ports/repositories/platform-entity-write-repository.interface.ts
export interface PlatformEntityWriteRepository<TEntity> {
  create(...): Promise<Result<TEntity, EntityRepositoryError>>;
  update(...): Promise<Result<TEntity, EntityRepositoryError>>;
  delete(...): Promise<Result<void, EntityRepositoryError>>;
  // + Flags & Batch APIs
}
```

# 3. SOLID-Analyse

**ISP-Verstoß:** Ein Service, der ausschließlich `getFlag` benötigt, muss ein Interface implementieren/kennen, das Create/Update/Delete etc. enthält. Das erhöht Kopplung und erschwert alternative Implementierungen (z. B. read-only/flag-only Adapter).

# 4. Zielbild

- **Kleinere Ports:** `PlatformEntityFlagPort` oder `PlatformEntityMetadataPort`.
- Services hängen nur von den minimalen Ports.
- Repositories können mehrere kleine Interfaces implementieren (Komposition statt Monolith).

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Introduce `PlatformEntityFlagPort` mit `getFlag/setFlag/unsetFlag`.
- `JournalVisibilityService` hängt nur von `PlatformEntityFlagPort`.
- `PlatformJournalRepository` implementiert Flag-Port zusätzlich (Adapter/Facade).

**Approach B (Alternative)**
- Use `PlatformEntityReadRepository` + `PlatformEntityFlagPort` als separate Dependencies.

**Trade-offs:**
- A: sauberer für Flag-only Use-Cases.
- B: weniger neue Typen, aber zwei Dependencies.

# 6. Refactoring-Schritte

1. Neues Domain-Interface `PlatformEntityFlagPort` definieren.
2. Foundry-Journal-Repository implementiert Flag-Port.
3. DI-Tokens für Flag-Port hinzufügen.
4. `JournalVisibilityService` auf Flag-Port umstellen.

**Breaking Changes:**
- Signature von `JournalVisibilityService` und DI-Konfiguration ändern.

# 7. Beispiel-Code

**Before**
```ts
constructor(private readonly journalRepository: PlatformJournalRepository) {}
```

**After**
```ts
constructor(private readonly journalFlags: PlatformEntityFlagPort) {}
```

# 8. Tests & Quality Gates

- Unit-Test: `JournalVisibilityService` mit Flag-Port-Mock.
- Typecheck: Services dürfen nicht mehr das Full-Repo benötigen.

# 9. Akzeptanzkriterien

- `JournalVisibilityService` importiert kein Full-Repo-Interface.
- Separate Flag-Port existiert und ist in DI registriert.
