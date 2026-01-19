---
id: SRP-002
prinzip: SRP
schweregrad: hoch
layer: application
status: Proposed
reviewed: 2026-01-19
relevance: still-relevant
notes: `src/application/windows/services/window-controller.ts` still contains journal-overview special-casing + container-based service resolution.
---

# 1. Problem
`WindowController` buendelt zu viele Verantwortlichkeiten: generischer Window-Lifecycle, UI-Action-Mapping, Journal-spezifische Sonderlogik, Service-Lookups ueber Container und Event-Registrierung. Aenderungen fuer eine einzelne Window-Variante erzeugen Seiteneffekte in der zentralen Steuerung.

# 2. Evidence (Belege)
`src/application/windows/services/window-controller.ts`:
```
// Special handling for journal-overview window actions with parameters
if (this.definitionId === "journal-overview") {
  if (actionDef.id === "toggleJournalVisibility") {
    (actions as Record<string, unknown>)[actionDef.id] = (journalId: string) => {
      this.dispatchAction(actionDef.id, undefined, undefined, { journalId });
    };
    continue;
  }
  ...
}
```
```
if (this.definitionId === "journal-overview" && this.container) {
  const journalEventsResult = this.container.resolveWithError(platformJournalEventPortToken);
  ...
  const registrationResult = journalEvents.onJournalUpdated((event) => {
    ...
    this.reloadJournalOverviewData();
  });
}
```
```
private async reloadJournalOverviewData(): Promise<void> {
  if (!this.container) return;
  const serviceResult = this.container.resolveWithError(journalOverviewServiceToken);
  ...
  const result = service.getAllJournalsWithVisibilityStatus();
  if (result.ok) {
    await this.updateStateLocal({ journals: result.value });
  }
}
```

# 3. SOLID-Analyse
Verstoss gegen SRP: Die Klasse agiert als generischer Controller *und* als spezialisierter JournalOverview-Workflow-Koordinator. Damit wird sie zum Aenderungshotspot fuer fachliche Sonderfaelle.

# 4. Zielbild
Ein generischer `WindowController` koordiniert nur Lifecycle/State/Render. Spezialfaelle werden ueber dedizierte Extension Points kapselt (z.B. `WindowBehavior`/`WindowPlugin` pro Definition).

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- Einfuehren eines `WindowBehavior` Ports (z.B. `onRender`, `onClose`, `mapActions`, `registerListeners`).
- Journal-Overview Verhalten in eigene Klasse auslagern.
- `WindowController` ruft Behavior nur noch auf.

**Approach B (Alternative):**
- Subclassing: `JournalOverviewWindowController` erweitert einen schlanken `BaseWindowController`.
- Composition Root entscheidet, welcher Controller fuer Definition genutzt wird.

Trade-offs: Mehr Klassen, dafuer klare Verantwortlichkeiten und keine Sonderfaelle im Core.

# 6. Refactoring-Schritte
1. Neues Interface `WindowBehavior` (domain/application) definieren.
2. Standard-Behavior implementieren (no-op).
3. Journal-Overview Behavior implementieren (Action-Mapping + Event-Registrierung + Reload).
4. `WindowController` auf Behavior delegieren.
5. DI/Factory aktualisieren.

# 7. Beispiel-Code
**Before (Controller):**
```
if (this.definitionId === "journal-overview") { ... }
```

**After (Behavior):**
```
behavior.registerListeners(context);
behavior.mapActions(definition, dispatcher);
```

# 8. Tests & Quality Gates
- Unit-Tests fuer Standard-Behavior (keine Sonderfaelle).
- Unit-Tests fuer JournalOverviewBehavior.
- Integrationstest: Journal-Overview reload bei Journal-Update.

# 9. Akzeptanzkriterien
- `WindowController` enthaelt keine `definitionId === "journal-overview"` Sonderlogik.
- Spezialfaelle sind in separaten Behavior-Klassen gekapselt.
