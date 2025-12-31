---
ID: ISP-001
Prinzip: ISP
Schweregrad: Mittel
Module/Layer: domain/ports/events
Status: Proposed
---

# 1. Problem

`PlatformJournalEventPort` bündelt Core-Journal-Events (create/update/delete) mit UI-spezifischen Events (Render, Context-Menu). Nicht-UI Implementierungen müssen diese Methoden stubben oder no-op implementieren. Das verletzt ISP.

# 2. Evidence (Belege)

**Pfad:** `src/domain/ports/events/platform-journal-event-port.interface.ts`

```ts
onJournalCreated(...)
onJournalUpdated(...)
onJournalDeleted(...)

// UI-spezifisch
onJournalDirectoryRendered(...)
```

# 3. SOLID-Analyse

- **ISP-Verstoß:** Clients müssen UI-Methoden implementieren, obwohl sie nur Core-Events benötigen.
- **Folgeprobleme:** Headless/Server-Adapter werden künstlich aufgebläht.

# 4. Zielbild

- Zwei Ports:
  - `PlatformJournalEventPort` (Core)
  - `PlatformJournalUiEventPort` (UI/Render/ContextMenu)

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- Neues Interface `PlatformJournalUiEventPort` definieren.
- UI-Use-Cases depend on UI-Port; Core-Use-Cases depend on Core-Port.

**Approach B (Alternative):**
- UI-Methoden optional machen, mit explizitem Feature-Flag im Port.

**Trade-offs:**
- Approach A erhöht Klarheit und Testbarkeit, benötigt aber mehr DI-Registrierungen.

# 6. Refactoring-Schritte

1. Neues Interface `PlatformJournalUiEventPort` erstellen.
2. `onJournalDirectoryRendered` (und Kontextmenü) dorthin verschieben.
3. Foundry-Adapter in zwei Implementationen splitten oder zwei Interfaces implementieren.
4. Use-Cases auf den passenden Port migrieren.

**Breaking Changes:**
- Adapter müssen neu implementieren; Use-Cases passen ihre Abhängigkeiten an.

# 7. Beispiel-Code

**After (skizziert)**
```ts
export interface PlatformJournalEventPort {
  onJournalCreated(...);
  onJournalUpdated(...);
  onJournalDeleted(...);
}

export interface PlatformJournalUiEventPort {
  onJournalDirectoryRendered(...);
  onJournalContextMenu(...);
}
```

# 8. Tests & Quality Gates

- Contract-Tests für beide Ports.
- Headless-Adapter implementiert nur Core-Port.

# 9. Akzeptanzkriterien

- Core-Use-Cases importieren kein UI-Port-Interface.
- Headless/Non-UI Adapter implementieren nur Core-Port.
