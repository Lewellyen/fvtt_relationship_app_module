---
ID: DIP-001
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: domain/windows
Status: Proposed
---

# 1. Problem

Die Domain-Schicht (Window-Subdomain) ist direkt an Browser-DOM-Typen (`HTMLElement`) gekoppelt. Das bricht die Dependency Inversion (Domain → Platform), verhindert Headless/Server-Tests und zwingt Infrastruktur-Details in die Kernmodelle.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/domain/windows/types/application-v2.interface.ts`
- `src/domain/windows/types/component-instance.interface.ts`
- `src/domain/windows/ports/render-engine-port.interface.ts`
- `src/domain/windows/ports/window-controller-port.interface.ts`

**Minimierte Codeauszüge**
```ts
// src/domain/windows/types/application-v2.interface.ts
export interface ApplicationV2 {
  element?: HTMLElement;
}
```
```ts
// src/domain/windows/ports/render-engine-port.interface.ts
render(target: HTMLElement, ...): Promise<Result<void, WindowError>>;
```
```ts
// src/domain/windows/ports/window-controller-port.interface.ts
onFoundryRender(element: HTMLElement): Promise<Result<void, WindowError>>;
```

# 3. SOLID-Analyse

**DIP-Verstoß:** Domain-Interfaces referenzieren konkrete UI/DOM-Typen, die eigentlich in Infrastruktur/Framework verankert sein sollten. Dadurch ist die Domain nicht mehr plattformagnostisch.

**Nebenwirkungen:**
- Keine echte Headless-Ausführung ohne DOM-Mocks.
- Jede UI-Technologieänderung propagiert in Domain-Typen.
- Build/Typecheck hängt von DOM-Libs ab.

# 4. Zielbild

- Domain verwendet **plattformneutrale Handles** (z. B. `UIElementRef`, `RenderTargetId`).
- Infrastruktur/Framework mappt diese Handles auf echte `HTMLElement`.
- Abhängigkeitsrichtung: Domain → Abstraktion, Infra → konkrete DOM.

```
Domain: UIElementRef (opaque)
Infra: HTMLElementAdapter implements UIElementRef
```

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Ersetze `HTMLElement` in Domain-Interfaces durch `UIElementRef` (opaque type).
- `RenderEnginePort` & `WindowControllerPort` nehmen `RenderTarget` (z. B. `{ id: string }`).
- Infrastruktur liefert Adapter, die `RenderTarget` → `HTMLElement` auflösen.

**Approach B (Alternative)**
- Definiere ein minimales DOM-Interface in Domain (z. B. `DomElementLike` mit nur `querySelector`, `classList`), das in Infra gemappt wird.

**Trade-offs:**
- A: sauberste Entkopplung, erfordert breitere Refactors.
- B: schneller, aber Domain bleibt indirekt DOM-abhängig.

# 6. Refactoring-Schritte

1. Neues Domain-Typmodul `domain/windows/types/ui-element-ref.ts` einführen.
2. `HTMLElement`-Verwendungen in Domain-Ports/Types auf `UIElementRef` umstellen.
3. Infrastruktur-Adapter schreiben, die `UIElementRef` → `HTMLElement` auflösen.
4. Tests auf Headless-Mocks umstellen (kein DOM notwendig).

**Breaking Changes:**
- Alle Implementierungen der Window-Ports müssen Signaturen anpassen.

# 7. Beispiel-Code

**Before**
```ts
onFoundryRender(element: HTMLElement): Promise<Result<void, WindowError>>;
```

**After**
```ts
type UIElementRef = { id: string };

onRender(target: UIElementRef): Promise<Result<void, WindowError>>;
```

# 8. Tests & Quality Gates

- Unit-Tests für Domain ohne DOM (tsconfig ohne `dom` lib).
- Adapter-Tests in Infrastructure für DOM-Auflösung.
- Arch-Lint: Domain darf keine `HTMLElement` referenzieren.

# 9. Akzeptanzkriterien

- Domain enthält keinen direkten `HTMLElement`-Typ mehr.
- Window-Ports sind plattformagnostisch.
- Headless Tests laufen ohne DOM-Library.
