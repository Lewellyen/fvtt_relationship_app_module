---
ID: OCP-001
Prinzip: OCP
Schweregrad: Mittel
Module/Layer: application/windows
Status: Proposed
---

# 1. Problem

`WindowController` enthält hardcodierte Default-State-Logik für ein konkretes Fenster (`journal-overview`). Neue Fenster mit eigenen Defaults erfordern Änderungen an der zentralen Controller-Klasse.

# 2. Evidence (Belege)

**Pfad / Klasse**
- `src/application/windows/services/window-controller.ts`

**Konkrete Belege**
```ts
if (this.definitionId === "journal-overview") {
  defaultState.sortColumn = null;
  defaultState.sortDirection = "asc";
  defaultState.columnFilters = {};
  defaultState.globalSearch = "";
  defaultState.filteredJournals = [];
}
```

# 3. SOLID-Analyse

OCP-Verstoß: Erweiterungen (neue Window-Definitionen mit eigenen Defaults) erfordern Modifikation des Controllers statt Extension über Konfiguration/Strategien.

# 4. Zielbild

- Window-spezifische Defaults werden über Strategien/Registries bereitgestellt.
- `WindowController` bleibt unverändert, neue Defaults werden durch Hinzufügen neuer Implementierungen integriert.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- `WindowDefaultStateProvider` Interface einführen.
- Registry/Map `{definitionId -> provider}`.
- Controller ruft Provider statt if/else.

**Approach B (Alternative)**
- Defaults in `WindowDefinition` selbst definieren.

**Trade-offs**
- A entkoppelt Controller, benötigt Registry.
- B ist einfacher, vergrößert Definitionen.

# 6. Refactoring-Schritte

1. `WindowDefaultStateProvider` Interface definieren.
2. Registry erstellen und DI verdrahten.
3. Default-State für `journal-overview` als Provider implementieren.
4. `WindowController` nutzt Provider-Registry.
5. Tests anpassen/ergänzen.

# 7. Beispiel-Code

**After**
```ts
const defaultState = defaultStateProviders.get(this.definitionId)?.build() ?? {};
this.statePort.patch(defaultState);
```

# 8. Tests & Quality Gates

- Unit: Provider für `journal-overview` liefert erwartete Defaults.
- Regression: `WindowController` bleibt unverändert bei neuen Definitions.

# 9. Akzeptanzkriterien

- Keine `if (definitionId === ...)`-Blöcke im Controller.
- Neue Window-Defaults ohne Änderung an `WindowController` integrierbar.
