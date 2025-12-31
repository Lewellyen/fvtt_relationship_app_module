---
ID: DIP-001
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: domain/ports/events
Status: Proposed
---

# 1. Problem

Die Domain-Schicht referenziert DOM-spezifische Typen (`HTMLElement`) und UI-spezifische Details (Context-Menu Optionen). Damit hängt der Kern an der Plattform-UI und verletzt das Dependency Inversion Principle (DIP). Der Domain-Layer sollte keinerlei Abhängigkeit zu Browser/Foundry-UI besitzen.

# 2. Evidence (Belege)

**Pfad:** `src/domain/ports/events/platform-journal-event-port.interface.ts`

```ts
export interface JournalDirectoryRenderedEvent {
  htmlElement: HTMLElement; // DOM ist überall gleich
  timestamp: number;
}

export interface JournalContextMenuEvent {
  htmlElement: HTMLElement; // DOM ist überall gleich
  options: ContextMenuOption[]; // Mutable array
  timestamp: number;
}

export interface ContextMenuOption {
  name: string;
  icon: string;
  callback: (li: HTMLElement) => void | Promise<void>;
}
```

# 3. SOLID-Analyse

- **DIP-Verstoß:** Domain-Ports sind vom konkreten UI/DOM abhängig.
- **Nebenwirkungen:** Domain wird untestbar in Nicht-DOM-Umgebungen, Adapter müssen DOM stubs liefern.
- **Folgeprobleme:** Plattformwechsel oder Headless-Ausführung erfordert Domain-Anpassungen.

# 4. Zielbild

- Domain kennt nur **UI-unabhängige** Event-DTOs (IDs, Flags, Metadaten).
- UI/DOM wird in **Infrastructure-Adapter** oder einem dedizierten **UI-Port** gekapselt.

ASCII-Skizze:

```
Domain (Events/DTOs) -> Application (Use-Cases) -> Ports (UI) -> Infrastructure (Foundry DOM)
```

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- Ersetze `HTMLElement` in Domain-Events durch **serialisierbare DTOs** (z. B. `journalId`, `contextMenuId`).
- Erzeuge einen neuen UI-Port `PlatformJournalUiEventPort` im Domain-Layer, der UI-spezifische Events kapselt.

**Approach B (Alternative):**
- Verschiebe UI-spezifische Events komplett aus dem Domain-Layer nach `infrastructure/adapters/foundry/events` und expose sie nur im Framework.

**Trade-offs:**
- Approach A ist sauberer (Ports bleiben stabil), erfordert aber Adapter- und Use-Case-Änderungen.
- Approach B reduziert Domain-Layer schneller, erschwert aber Testbarkeit im Application-Layer.

# 6. Refactoring-Schritte

1. Neue UI-Event-DTOs definieren (z. B. `JournalDirectoryRenderPayload`, ohne DOM).
2. Neues Port-Interface `PlatformJournalUiEventPort` erstellen.
3. Domain-Interface `PlatformJournalEventPort` bereinigen (nur Core-Events).
4. Use-Cases auf neuen Port migrieren.
5. Foundry-Adapter anpassen (DOM -> DTO-Mapping).

**Breaking Changes:**
- Signaturen der Journal-Events ändern sich (keine `HTMLElement`-Parameter mehr).

# 7. Beispiel-Code

**Before**
```ts
onJournalDirectoryRendered(callback: (event: JournalDirectoryRenderedEvent) => void)
```

**After**
```ts
export interface JournalDirectoryRenderedEvent {
  directoryId: string; // oder "journal"
  timestamp: number;
}
```

# 8. Tests & Quality Gates

- Contract-Tests für `PlatformJournalEventPort` (ohne DOM-Abhängigkeit).
- Adapter-Tests für Foundry: Mapping von DOM -> DTO.
- Architektur-Lint: Domain darf keine DOM-Types importieren.

# 9. Akzeptanzkriterien

- `domain/ports/events` enthält **keine** DOM-Typen.
- Use-Cases benötigen keine `HTMLElement`-Parameter.
- Foundry-Adapter kapseln alle DOM-Typen.
