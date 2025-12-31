---
ID: DIP-002
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: application/services, application/handlers
Status: Proposed
---

# 1. Problem

Application-Services/Handler manipulieren DOM und UI-Details direkt (HTML, ContextMenu-Options). Das koppelt Application an Foundry/Browser-UI und verletzt DIP (sowie die Schichtentrennung UI ↔ Domäne).

# 2. Evidence (Belege)

**Pfad:** `src/application/services/JournalDirectoryProcessor.ts`

```ts
processDirectory(htmlElement: HTMLElement, hiddenEntries: JournalEntry[]): Result<void, ...>
```

**Pfad:** `src/application/handlers/hide-journal-context-menu-handler.ts`

```ts
const documentId = element.getAttribute("data-document-id");
// ...
event.options.push({
  name: "Journal ausblenden",
  icon: '<i class="fas fa-eye-slash"></i>',
  callback: async (_li: HTMLElement) => { ... }
});
```

# 3. SOLID-Analyse

- **DIP-Verstoß:** Application hängt von DOM/Foundry-UI ab.
- **Nebenwirkungen:** Tests erfordern DOM-Umgebung, UI-Änderungen erzwingen Application-Änderungen.
- **Folgeprobleme:** Adapters können nicht isoliert ausgetauscht werden.

# 4. Zielbild

- Application-Layer arbeitet ausschließlich mit **Ports/DTOs**.
- UI/DOM-Operationen befinden sich im Infrastructure/Adapter-Layer.

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- Ersetze `HTMLElement`-Parameter durch abstrahierte Ports (`PlatformJournalDirectoryUiPort`, `PlatformContextMenuPort`).
- Verschiebe DOM-spezifische Logik in Foundry-Adapter.

**Approach B (Alternative):**
- Introduce UI-Use-Case-Schicht (separates `ui/` Modul), Application bleibt UI-frei.

**Trade-offs:**
- Approach A erfordert Umstellung der Handler-API, ist aber konsistent mit Clean Architecture.

# 6. Refactoring-Schritte

1. Neue UI-Ports definieren (z. B. `PlatformContextMenuPort` mit DTOs).
2. `HideJournalContextMenuHandler` in `infrastructure/adapters/foundry` verschieben.
3. `JournalDirectoryProcessor` auf DTOs + Port-Aufrufe umstellen.
4. Use-Case- und Event-Adapter anpassen.

**Breaking Changes:**
- Handler-Signaturen ändern sich (keine DOM-Elemente im Application-Layer).

# 7. Beispiel-Code

**Before**
```ts
handle(event: JournalContextMenuEvent): void
```

**After**
```ts
handle(event: JournalContextMenuPayload): void
// DOM-Details werden im Adapter in Payload gemappt
```

# 8. Tests & Quality Gates

- Unit-Tests für Application-Layer ohne DOM.
- Adapter-Tests: DOM -> DTO Mapping.
- Architektur-Lint: Application darf keine `HTMLElement`-Imports haben.

# 9. Akzeptanzkriterien

- `application/` enthält keine DOM-Manipulation.
- Foundry-spezifische HTML/ContextMenu-Logik liegt ausschließlich in `infrastructure/`.
