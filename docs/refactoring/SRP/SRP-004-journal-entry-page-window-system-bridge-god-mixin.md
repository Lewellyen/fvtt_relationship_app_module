---
ID: SRP-004
Prinzip: SRP
Schweregrad: Hoch
Module/Layer: infrastructure/ui/window-system
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

`JournalEntryPageWindowSystemBridgeMixin` bündelt extrem viele Verantwortlichkeiten in einer einzelnen Mixin-Datei:

- Foundry Sheet Lifecycle Integration (`_onRender`, `_updateObject`, `close`)
- Svelte Mounting/Unmounting
- Save-Button Interception + Persist-Flow
- Service Resolution über Module API + Container-Port (inkl. lokale API-Typkopie)
- Edit/View Mode Heuristiken + Caching
- Weitergabe von dynamischen Props/Callbacks in das ViewModel

Das ist ein klassisches SRP-Problem („God Mixin“): jede Änderung an UI, Persistenz, API, DI oder Foundry-Lifecycle berührt dieselbe Datei.

# 2. Evidence (Belege)

**Pfad**
- `src/infrastructure/ui/window-system/JournalEntryPageWindowSystemBridgeMixin.ts`

**Symptomatische Ausschnitte**

```ts
// 1) API/DI Resolution + lokale API Typen
private get api(): ServiceResolutionApi { /* ... throws ... */ }
const containerPort = this.resolveService(this.api.tokens.platformContainerPortToken);
```

```ts
// 2) UI Mounting + Save Button Wiring
const mountResult = this.svelteRenderer.mount(...);
saveButton.addEventListener("click", this.saveButtonListener);
```

```ts
// 3) Persistenz/Update Flow
await this.document.update(updateData);
// oder: nodeService.saveNodeData(...), graphService.saveGraphData(...)
```

# 3. SOLID-Analyse

**SRP-Verstoß:** Mehrere unabhängige Änderungsgründe (Foundry API, Svelte Renderer, Persistenzstrategie, Service-Resolution, UI-Interaktion) sind in einem Knoten verdrahtet. Das erhöht Defekt-Risiko und erschwert Isolation/Tests.

**Nebenwirkungen**
- DIP-Drift: Mixin braucht immer mehr Kenntnisse über API/DI/Services.
- LSP-Risiko: Mixin muss für unterschiedliche Sheet-Basen kompatibel bleiben, enthält aber viele implizite Annahmen (DOM/Foundry Properties).

# 4. Zielbild

Ein dünner Bridge-Entry point, der an fokussierte Komponenten delegiert:

- `SheetApiResolver` (API/Token Zugriff, kein UI)
- `SheetRendererBridge` (Mount/Unmount + renderer-specific casting)
- `SheetPersistCoordinator` (Save Flow, Node/Graph Speicherung)
- `SheetModeDetector` (view/edit detection)
- `SheetLifecycleAdapter` (Foundry overrides, ruft obige Komponenten)

# 5. Lösungsvorschlag

**Approach A (empfohlen): Komposition statt monolithischem Mixin**
- Mixin bleibt, aber ist nur ein dünner Delegator.
- Extrahiere die oben genannten Komponenten als Klassen mit klaren Dependencies.

**Approach B (Alternative): Separate Base-Sheet Klassen**
- Statt Mixin: zwei Basisklassen (`RelationshipNodeSheetBase`, `RelationshipGraphSheetBase`) die delegieren.
- Weniger generisch, aber einfacher zu verstehen und zu testen.

Trade-offs:
- A maximiert Wiederverwendung, verlangt Disziplin bei den neuen Komponenten.
- B reduziert Komplexität, aber dupliziert evtl. etwas Code.

# 6. Refactoring-Schritte

1. Extrahiere `ServiceResolutionApi` Contract (siehe DIP-010) und ersetze lokale Kopie.
2. Extrahiere `SaveButtonInterceptor` (Listener setup + teardown).
3. Extrahiere `PersistCoordinator` (Node/Graph Save via Services, Fallback-Strategie).
4. Extrahiere `SvelteMountCoordinator` (mount/unmount + mountpoint handling).
5. Mixin bleibt als „glue“ und ruft nur noch diese Komponenten.

**Breaking Changes**
- Primär interne Strukturänderung; äußere Sheet-Klassen bleiben (idealerweise) kompatibel.

# 7. Beispiel-Code

```ts
class SheetLifecycleAdapter {
  constructor(
    private readonly mount: SvelteMountCoordinator,
    private readonly persist: PersistCoordinator,
    private readonly mode: SheetModeDetector,
  ) {}
}
```

# 8. Tests & Quality Gates

- Unit-Tests pro extrahierter Komponente (Mode detection, mountpoint logic, save flow).
- Integration-Test: Sheet render → mount → save → close unmount.

# 9. Akzeptanzkriterien

- `JournalEntryPageWindowSystemBridgeMixin.ts` ist deutlich kleiner und enthält keine Workflow-Logik.
- UI Mounting, Persistenz und API/DI sind in separaten, testbaren Einheiten gekapselt.
