---
ID: SRP-001
Prinzip: SRP
Schweregrad: Hoch
Module/Layer: application/windows
Status: Proposed
---

# 1. Problem

`WindowController` bündelt zu viele Verantwortlichkeiten (Lifecycle-Orchestrierung, State-Initialisierung, Rendering, Event-Registrierung, Persistenz, Error-Handling). Das erschwert Tests, Erweiterbarkeit und Isolation von UI-/Persistenzregeln.

# 2. Evidence (Belege)

**Pfade / Klassen**
- `src/application/windows/services/window-controller.ts` (`WindowController`)

**Konkrete Belege**
- State-Initialisierung inkl. Speziallogik für `journal-overview`.
- Binding-Initialisierung, Renderer-Auswahl, Mounting.
- Event-Registrierung und Persistenz-Aufrufe in derselben Klasse.

```ts
// State-Initialisierung inkl. Feature-spezifischer Defaults
if (this.definitionId === "journal-overview") {
  defaultState.sortColumn = null;
  defaultState.sortDirection = "asc";
  defaultState.columnFilters = {};
  defaultState.globalSearch = "";
  defaultState.filteredJournals = [];
}

// Renderer holen, mounten, Event-Listener registrieren
const rendererResult = this.rendererRegistry.get(this.definition.component.type);
...
const mountResult = rendererResult.value.mount(...);
...
this.registerEventListeners();

// Persistieren bei close()
if (this.definition.persist) {
  const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
  await this.persist(meta);
}
```

# 3. SOLID-Analyse

SRP-Verstoß: Die Klasse mischt UI-Lifecycle, State-Policy (Default-State), Rendering-Strategie und Persistenz-Orchestrierung. Änderungen in einem Bereich erzwingen Änderungen in der zentralen Klasse; Tests müssen mehrere Subsysteme gleichzeitig mocken.

# 4. Zielbild

- `WindowLifecycleOrchestrator`: nur Lifecycle-Schritte (render/update/close) koordinieren.
- `WindowStateInitializer`: liefert initialen State pro Window-Definition (Plug-in-Strategie).
- `WindowRendererCoordinator`: isoliert Rendering/Mounting.
- `WindowPersistenceCoordinator`: Persist/Restore mit `IPersistAdapter`.

Mermaid (optional):
```
WindowController -> LifecycleOrchestrator
LifecycleOrchestrator -> StateInitializer
LifecycleOrchestrator -> RendererCoordinator
LifecycleOrchestrator -> PersistenceCoordinator
```

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Zerlege `WindowController` in orchestrierende Facade + spezialisierte Services.
- Speziallogik für `journal-overview` in `WindowStateInitializer` auslagern (konfigurierbar je Window).

**Approach B (Alternative)**
- Teilweise Extraktion (State init + Persist) und restliche Logik im Controller belassen.

**Trade-offs**
- A erhöht Anzahl der Klassen, verbessert Testbarkeit und Erweiterbarkeit.
- B ist schneller, lässt aber hohen Kopplungsgrad bestehen.

# 6. Refactoring-Schritte

1. `WindowStateInitializer` Interface definieren (application/windows/ports).
2. `DefaultWindowStateInitializer` + `JournalOverviewStateInitializer` implementieren.
3. `WindowRendererCoordinator` extrahieren (Mount/Unmount/Update).
4. `WindowPersistenceCoordinator` extrahieren (persist/restore).
5. `WindowController` als Facade: delegiert an die neuen Komponenten.
6. DI-Registrierung anpassen (tokens + wiring).
7. Tests je Komponente erstellen/migrieren.

# 7. Beispiel-Code

**Before**
```ts
if (this.definitionId === "journal-overview") {
  defaultState.sortColumn = null;
}
```

**After**
```ts
const defaultState = this.stateInitializer.buildInitialState(this.definitionId);
this.statePort.patch(defaultState);
```

# 8. Tests & Quality Gates

- Unit-Tests: `WindowStateInitializer` je Definition.
- Integration: `WindowController` (nur Orchestrierung).
- Architektur-Lint: `application/windows/services` darf keine Feature-spezifischen Defaults enthalten.

# 9. Akzeptanzkriterien

- `WindowController` enthält keine Feature-spezifische State-Logik.
- Rendering/Persistenz/State-Init sind in getrennten Klassen isoliert.
- Neue Window-Definitionen können Defaults hinzufügen ohne `WindowController` zu ändern.
