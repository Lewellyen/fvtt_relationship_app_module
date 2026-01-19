---
ID: DIP-008
Prinzip: DIP
Schweregrad: Mittel
Module/Layer: application/windows
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

Der Application-Layer importiert Svelte-Typen (`import("svelte").Component`) in Utility-Funktionen. Damit hängt Application direkt von einem konkreten UI-Framework ab und verletzt die Layer-Regel „Application darf nicht von Framework/UI abhängen“.

Selbst wenn es „nur“ Type-Imports sind: die Typ-Abhängigkeit beeinflusst Kompilierung, IDE/Tooling und verleitet dazu, weitere UI-spezifische Logik in Application zu platzieren.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/application/windows/utils/service-casts.ts`
- `src/application/windows/utils/window-state-casts.ts`

**Minimierte Codeauszüge**

```ts
// src/application/windows/utils/service-casts.ts
export function castSvelteComponent<TProps extends Record<string, unknown> = Record<string, unknown>>(
  component: unknown
): import("svelte").Component<TProps> | null {
  // ...
}
```

```ts
// src/application/windows/utils/window-state-casts.ts
export function castSvelteComponent<TProps extends Record<string, unknown> = Record<string, unknown>>(
  component: unknown
): import("svelte").Component<TProps> | null {
  // ...
}
```

# 3. SOLID-Analyse

**DIP-Verstoß:** Application-Code (High-Level Policies/Use-Cases) hängt von Low-Level UI Framework Contracts ab. UI-Framework ist „detail“, nicht „policy“.

**Nebenwirkungen**
- Erschwert Austausch/Parallelbetrieb anderer Renderer.
- Zementiert Svelte in der Application-Schicht; Renderer-Substitution wird teurer.

# 4. Zielbild

- Application kennt nur **Renderer-agnostische** Typen/Handles.
- Svelte-Typen leben in Infrastructure (Renderer-Implementierung) oder Framework (UI Integration).

# 5. Lösungsvorschlag

**Approach A (empfohlen): Svelte-Casts in Infrastructure verschieben**
- Verschiebe `castSvelteComponent` nach `src/infrastructure/windows/renderers/svelte/**` (oder `src/infrastructure/ui/svelte/**`).
- Application arbeitet nur mit `unknown`/`ComponentDescriptor` und delegiert Typ-Narrowing an den Renderer.

**Approach B (Alternative): Abstraktes „ComponentFactory“-Interface**
- Application nutzt ein Port/Interface `SvelteComponentFactory`/`RendererComponentValidatorPort`.
- Infrastructure implementiert die Framework-spezifische Validierung.

Trade-offs:
- A ist schnell und reduziert sofort Coupling.
- B macht Validierung testbarer/portabler, kostet aber mehr Boilerplate.

# 6. Refactoring-Schritte

1. Neues Infrastructure-Modul für Svelte-Helpers anlegen.
2. `castSvelteComponent` aus Application entfernen, Call-Sites umhängen.
3. Arch-Gate: `src/application/**` darf keine Imports von `svelte` (auch type-level) enthalten.

**Breaking Changes**
- Import-Pfade für `castSvelteComponent` ändern sich (intern).

# 7. Beispiel-Code

**After (Renderer owns type narrowing)**

```ts
// infrastructure/windows/renderers/svelte/svelte-component-cast.ts
export function castSvelteComponent(component: unknown): import("svelte").Component | null {
  if (typeof component !== "function") return null;
  return component as import("svelte").Component;
}
```

# 8. Tests & Quality Gates

- Arch-Gate: `application` enthält keine `svelte`-Imports.
- Renderer-Tests: SvelteRenderer akzeptiert/validiert Komponenten weiterhin.

# 9. Akzeptanzkriterien

- Keine `import("svelte")` Referenzen mehr unter `src/application/**`.
- Renderer-spezifische Typen liegen ausschließlich außerhalb Application.
