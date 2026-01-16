---
id: DIP-004
prinzip: DIP
schweregrad: hoch
layer: domain
status: Proposed
---

# 1. Problem
Domain-Typen fuer Window/Rendering enthalten DOM- und UI-Framework-spezifische Typen (HTMLElement, ReactRoot, VueApp, Svelte/Handlebars). Dadurch ist der Domain-Layer an konkrete UI-Technologien und den Browser gebunden.

# 2. Evidence (Belege)
`src/domain/windows/types/component-instance.interface.ts`:
```
export interface BaseComponentInstance {
  readonly id: string;
  readonly type: RenderEngineType;
  readonly element: HTMLElement;
  readonly props: Readonly<Record<string, unknown>>;
}
...
export interface ReactComponentInstance extends BaseComponentInstance {
  readonly type: "react";
  readonly root: ReactRoot; // React-spezifisch
}
export interface VueComponentInstance extends BaseComponentInstance {
  readonly type: "vue";
  readonly app: VueApp; // Vue-spezifisch
}
```

`src/domain/windows/ports/render-engine-port.interface.ts`:
```
mount(
  descriptor: ComponentDescriptor,
  target: HTMLElement,
  viewModel: ViewModel
): Result<TInstance, RenderError>;
```

# 3. SOLID-Analyse
Verstoss gegen DIP: Domain definiert Kernvertraege, ist aber direkt von UI-Framework-Details und dem DOM abhaengig. Dadurch koennen alternative Renderer (SSR, Headless, CLI) nicht substituieren, ohne Domain-Typen zu brechen.

# 4. Zielbild
Domain enthaelt nur abstrakte Renderer/Component-Contracts ohne DOM/Framework-Typen. UI-spezifische Typen liegen in Infrastructure/Framework. Domain arbeitet mit platform-agnostischen Handles (z.B. `RenderTargetRef`, `ComponentHandle`).

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- Ersetze `HTMLElement` durch ein abstraktes `RenderTargetRef` im Domain-Layer.
- Ersetze `ComponentInstance` durch `ComponentHandle` ohne Framework-Typen.
- Konkrete Renderer definieren ihre eigenen Instance-Typen in Infrastructure.

**Approach B (Alternative):**
- Fuehre einen `render-engine` Sub-Layer in Framework ein, der die Dom/Framework-Typen kapselt.
- Domain kommuniziert nur ueber Ports und DTOs.

Trade-offs: Mehr Adapter-Code, dafuer echte Engine-Unabhaengigkeit.

# 6. Refactoring-Schritte
1. Neues Domain-Interface `RenderTargetRef` und `ComponentHandle` einfuehren.
2. Domain-Ports (`IRenderEnginePort`, `IWindowController`) auf abstrakte Typen umstellen.
3. Renderer in Infrastructure anpassen und konkrete Typen kapseln.
4. Mapper/Wrapper zwischen Foundry/DOM und Domain-Handles einfuehren.

# 7. Beispiel-Code
**Before (Domain):**
```
readonly element: HTMLElement;
readonly root: ReactRoot;
```

**After (Domain):**
```
export interface RenderTargetRef { readonly id: string; }
export interface ComponentHandle { readonly id: string; readonly type: RenderEngineType; }
```

# 8. Tests & Quality Gates
- Domain-Tests ohne DOM/Framework-Typen.
- Adapter-Tests fuer RenderTarget-Mapping.
- Contract-Tests fuer Renderer-Port Implementationen.

# 9. Akzeptanzkriterien
- `src/domain/windows/**` enthaelt keine DOM- oder Framework-Typen.
- Renderer koennen ohne Aenderung im Domain-Layer hinzugefuegt werden.
