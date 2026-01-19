---
ID: SRP-003
Prinzip: SRP
Schweregrad: Hoch
Module/Layer: application/windows
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

`createJournalOverviewWindowDefinition` enthält umfangreiche Workflow- und Orchestrierungslogik (Loading-State, Daten holen, Flag-Toggling, Cache invalidieren, Re-Render triggern, Sort/Filter Engine). Damit wird die Window-Definition vom deklarativen „Definition-Objekt“ zur **God-Workflow-Datei** mit vielen Änderungsgründen.

Das führt zu:
- schwer testbarem, langem File,
- starker Kopplung an DI-/Token-Landschaft (über Container-Auflösung),
- und vermischten Verantwortlichkeiten (UI-State, Business Rules, Infrastruktur-Trigger).

# 2. Evidence (Belege)

**Pfad**
- `src/application/windows/definitions/journal-overview-window.definition.ts`

**Minimierte Codeauszüge**

```ts
// Service Locator im Handler
const container = getContainerFromContext(context);
const serviceResult = container.resolveWithError(journalOverviewServiceToken);
```

```ts
// Business + Infrastruktur in einem Handler
const repoResult = container.resolveWithError(platformJournalRepositoryToken);
await repository.setFlag(...);
const cacheResult = container.resolveWithError(cacheInvalidationPortToken);
cache.invalidateWhere(...);
const schedulerResult = container.resolveWithError(journalDirectoryRerenderSchedulerToken);
scheduler.requestRerender();
```

# 3. SOLID-Analyse

**SRP-Verstoß:** Eine Datei/Konstruktionseinheit ist gleichzeitig:
- UI/ViewModel-Orchestrator (Loading/State Updates),
- Business-Use-Case (Visibility togglen),
- Infrastruktur-Koordinator (Cache invalidation, directory rerender),
- und DI/Service-Locator Consumer.

**Nebenwirkungen**
- Änderungen an einem Teil (z.B. Sort-Logik) riskieren Seiteneffekte im Toggle-Flow.
- Code-Reviews/Merges werden konfliktanfällig („Hotspot“-Datei).

# 4. Zielbild

- Window-Definition bleibt **deklarativ** (IDs, Title, Component, Action-IDs).
- Workflow-Logik liegt in separaten Use-Cases/Handlers mit klaren Dependencies.
- Keine Container-Auflösung innerhalb der Definition.

# 5. Lösungsvorschlag

**Approach A (empfohlen): Action Handlers als Use-Case Klassen**
- Erzeuge z.B.:
  - `LoadJournalOverviewUseCase`
  - `ToggleJournalVisibilityUseCase`
  - `ApplyJournalOverviewFiltersUseCase`
- `ActionDispatcher` mappt Action IDs → Handler-Instanzen (DI).

**Approach B (Alternative): Presenter/Controller pro Window**
- Ein `JournalOverviewPresenter` kapselt Sort/Filter/Reload und publiziert State Patches.
- Definition ruft nur Presenter-Methoden.

Trade-offs:
- A ist feiner granuliert, ideal für Testbarkeit und Wiederverwendung.
- B ist weniger Klassen, aber Presenter kann wieder „fat“ werden.

# 6. Refactoring-Schritte

1. Action-IDs festlegen und aus Definition extrahieren (kein Business-Code in Definition).
2. Neue Handler/Use-Cases implementieren und in DI registrieren.
3. Definition: Handler nur noch referenzieren (oder die IDs deklarieren).
4. Entferne Container-Auflösung aus Actions (siehe DIP-009).

**Breaking Changes**
- ActionDispatcher/WindowDefinition Contract kann sich ändern (je nach Approach).

# 7. Beispiel-Code

```ts
// After: declarative definition
actions: [
  { id: "onOpen", handlerId: "JournalOverview.OnOpen" },
  { id: "toggleJournalVisibility", handlerId: "JournalOverview.ToggleVisibility" },
]
```

# 8. Tests & Quality Gates

- Unit-Tests pro Handler (ohne Window/DI Container).
- Arch-Gate: `src/application/windows/definitions/**` enthält kein `resolveWithError(`.

# 9. Akzeptanzkriterien

- `journal-overview-window.definition.ts` enthält keine Business-/Infra-Orchestrierung mehr.
- Jede Action hat genau einen dedizierten Handler mit klaren Dependencies.
