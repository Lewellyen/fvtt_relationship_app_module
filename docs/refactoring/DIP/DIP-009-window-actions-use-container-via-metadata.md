---
ID: DIP-009
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: application/windows
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

Window-Actions/Definitionen beziehen ihre Dependencies über `ActionContext.metadata` (Controller/Container) und rufen dann `container.resolveWithError(...)` auf. Damit werden Abhängigkeiten:

- **versteckt** (nicht im Konstruktor/Use-Case sichtbar),
- **zur Laufzeit** aufgelöst (Service Locator),
- und an einen impliziten „metadata contract“ gebunden, der nur durch Cast-Utilities abgesichert wird.

Das ist ein DIP-Problem (Policy hängt an Mechanismus) und erzeugt fragile Kopplung zwischen ActionDispatcher/WindowController/Definition-Files.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/domain/windows/types/action-definition.interface.ts` (`metadata?: Record<string, unknown>`)
- `src/application/windows/utils/window-casts.ts` (casts `metadata.container`)
- `src/application/windows/definitions/journal-overview-window.definition.ts` (resolve services via container aus metadata)
- `src/application/windows/services/window-controller.ts` (schreibt container/controller in metadata)

**Minimierte Codeauszüge**

```ts
// src/domain/windows/types/action-definition.interface.ts
export interface ActionContext<TState = Record<string, unknown>> {
  readonly state: Readonly<TState>;
  readonly metadata?: Record<string, unknown>;
}
```

```ts
// src/application/windows/definitions/journal-overview-window.definition.ts
const container = getContainerFromContext(context);
const serviceResult = container.resolveWithError(journalOverviewServiceToken);
```

```ts
// src/application/windows/services/window-controller.ts
metadata: {
  controller: this,
  ...(this.container !== undefined && { container: this.container }),
  ...(additionalMetadata !== undefined && additionalMetadata),
},
```

# 3. SOLID-Analyse

**DIP-Verstoß:** Abhängigkeiten werden nicht invertiert (explizit injiziert), sondern über einen generischen Resolver/metadata transportiert. Action-Handler sind dadurch nicht isolierbar und nicht klar „closed“ gegen DI-/Runtime-Mechaniken.

**Nebenwirkungen**
- Schwer zu testen: man mockt „metadata contract“ + Container statt fachliche Abhängigkeiten.
- Runtime-Risiko: metadata kann fehlen/anders sein; Casts sind nicht echte Contracts.
- SRP: WindowController wird zum Transit-Kanal für Abhängigkeiten, statt Lifecycle-Orchestrator zu bleiben.

# 4. Zielbild

- Action-Handler sind **explizit verdrahtet** (Factory/Use-Case Objekte), keine Container-Resolution im Action Flow.
- `ActionContext` trägt nur fachliche Daten (state, ids, payload), nicht DI/Container.

# 5. Lösungsvorschlag

**Approach A (empfohlen): Action Handlers als DI-konstruierte Use-Case-Objekte**
- Definiere eine Klasse pro Action-Gruppe (z.B. `JournalOverviewActions`) mit klaren Dependencies.
- `WindowDefinition.actions[]` referenziert nur Action-IDs; `ActionDispatcher` mappt IDs auf DI-registrierte Handler-Instanzen.

**Approach B (Alternative): Handler-Factories**
- `createJournalOverviewWindowDefinition(deps)` erhält Dependencies als Parameter und erzeugt Handler-Closures.

Trade-offs:
- A ist sauberer für größere Systeme (Testbarkeit, SRP, klare Ports).
- B ist schneller, aber Definitionen bleiben „procedural“.

# 6. Refactoring-Schritte

1. `ActionContext.metadata` Nutzung inventarisieren (Controller/Container).
2. Für jede betroffene Definition: benötigte Services/Ports explizit bestimmen.
3. Introduce `ActionHandlerRegistry` (Application) der DI-registrierte Handler bereitstellt.
4. Entferne Container/Controller aus `metadata` (oder beschränke auf technische Debug-Metadaten außerhalb Domain).
5. Entferne `getContainerFromContext` und die related casts.

**Breaking Changes**
- Signaturen/Erwartungen an `ActionContext.metadata` ändern sich.
- WindowController/ActionDispatcher Wires müssen angepasst werden.

# 7. Beispiel-Code

```ts
// After: DI-Handler
export class JournalOverviewOnOpenHandler {
  constructor(private readonly service: JournalOverviewService) {}
  handle(ctx: ActionContext): Result<void, ActionError> { /* ... */ }
}
```

# 8. Tests & Quality Gates

- Unit Tests: Action Handler ohne Container-Setup.
- Arch-Gate: `src/application/windows/definitions/**` enthält kein `resolveWithError(`.
- Contract Tests: Dispatcher ruft die richtigen Handler auf.

# 9. Akzeptanzkriterien

- Keine `container.resolveWithError(...)` im Action-Execution-Pfad.
- `ActionContext.metadata` wird nicht für DI/Container genutzt.
- Handler-Dependencies sind explizit und typisiert.
