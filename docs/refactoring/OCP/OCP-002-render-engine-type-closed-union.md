---
id: OCP-002
prinzip: OCP
schweregrad: mittel
layer: domain
status: Proposed
reviewed: 2026-01-19
relevance: still-relevant
notes: `src/domain/windows/types/component-descriptor.interface.ts` still defines `RenderEngineType` as a closed union.
---

# 1. Problem
Die Render-Engine Typen sind als String-Union im Domain-Layer fest verdrahtet. Neue Renderer erfordern Aenderungen an Domain-Typen und damit am Kernmodell.

# 2. Evidence (Belege)
`src/domain/windows/types/component-descriptor.interface.ts`:
```
export type RenderEngineType = "svelte" | "react" | "vue" | "handlebars";
```

`src/domain/windows/types/component-instance.interface.ts`:
```
export type ComponentInstance =
  | SvelteComponentInstance
  | ReactComponentInstance
  | VueComponentInstance
  | HandlebarsComponentInstance;
```

# 3. SOLID-Analyse
Verstoss gegen OCP: Der Domain-Code ist nicht fuer Erweiterungen geschlossen. Jede neue Engine erzwingt Modifikationen an Domain-Types und deren Konsumenten.

# 4. Zielbild
Renderer sind erweiterbar ueber Registry/Plugin-Mechanismus. Domain kennt nur abstrakte Engine-IDs, die nicht im Domain-Layer erweitert werden muessen.

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- Ersetze `RenderEngineType` durch `RenderEngineId` (opaque string/branding).
- Entferne `ComponentInstance` Union aus Domain, nutze `ComponentHandle`.
- Renderer registrieren sich ueber `IRendererRegistry` mit `RenderEngineId`.

**Approach B (Alternative):**
- Behalte Union, aber verschiebe sie in Framework/Infrastructure und expose nur generische Domain-Handles.

Trade-offs: Approach A minimiert Domain-Aenderungen bei neuen Engines.

# 6. Refactoring-Schritte
1. `RenderEngineId` Typ im Domain einfuehren (z.B. `type RenderEngineId = string & { __brand: "RenderEngineId" }`).
2. `ComponentDescriptor.type` auf `RenderEngineId` umstellen.
3. `ComponentInstance` Union entfernen oder in Infrastructure verschieben.
4. Renderer-Registry auf IDs basieren lassen.

# 7. Beispiel-Code
**After (Domain):**
```
export type RenderEngineId = string & { __brand: "RenderEngineId" };
export interface ComponentDescriptor { readonly type: RenderEngineId; ... }
```

# 8. Tests & Quality Gates
- Registry-Tests mit neuen Engine-IDs ohne Domain-Aenderung.
- Typ-Tests fuer Brand-IDs.

# 9. Akzeptanzkriterien
- Neue Renderer koennen registriert werden, ohne `src/domain/**` zu aendern.
