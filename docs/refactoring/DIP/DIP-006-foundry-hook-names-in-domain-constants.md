---
ID: DIP-006
Prinzip: DIP
Schweregrad: Mittel
Module/Layer: domain/constants
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

Der Domain-Layer enthält in `DOMAIN_EVENTS` **Foundry-spezifische Hook-Namen** (z. B. `"renderJournalDirectory"`, `"createJournalEntry"`). Dadurch wird die Domain implizit an Foundry gekoppelt: selbst wenn keine Foundry-Typen importiert werden, ist die **Semantik dieser Strings** platformgebunden.

Symptome:
- „Port-Adapter“ wird unterlaufen: eine alternative Platform müsste exakt dieselben String-Namen übernehmen oder Domain ändern.
- Verwechslung von „Domain-Event“ (fachlich) vs. „Platform-Hook“ (technisch).

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/domain/constants/domain-constants.ts`

**Minimierter Codeauszug**

```ts
// src/domain/constants/domain-constants.ts
export const DOMAIN_EVENTS = {
  RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",
  INIT: "init",
  READY: "ready",
  CREATE_JOURNAL_ENTRY: "createJournalEntry",
  UPDATE_JOURNAL_ENTRY: "updateJournalEntry",
  DELETE_JOURNAL_ENTRY: "deleteJournalEntry",
} as const;
```

# 3. SOLID-Analyse

**DIP-Verstoß:** Domain hält Wissen über Low-Level Event-/Hook-Mechanik (Foundry Hook IDs). Dadurch kann die Domain nicht unabhängig evolvieren und „Policy“ hängt von „Mechanism“.

**Nebenwirkungen**
- OCP-Leak: neue Plattformen/Mechanismen benötigen Domain-Änderungen.
- Architektur-Risikofaktor: Entwickler verwenden `DOMAIN_EVENTS` als „Hook-Quelle“, statt Ports zu nutzen.

# 4. Zielbild

- Domain definiert nur **fachliche Ereignisse** (wenn überhaupt) – ohne platformgebundene IDs.
- Platform-Hook-Namen leben in Infrastructure (Foundry-Adapter) oder Framework (Bootstrap).
- Abbildung: `DomainEvent` → `FoundryHookName` gehört in Adapter-Layer.

# 5. Lösungsvorschlag

**Approach A (empfohlen): Entfernen der Platform-IDs aus Domain**
- Entferne `DOMAIN_EVENTS` komplett aus Domain.
- Foundry-spezifische Hook-Namen werden in `src/infrastructure/adapters/foundry/**` gehalten.
- Application arbeitet gegen Ports (z. B. `PlatformJournalEventPort`, `PlatformJournalUiEventPort`, `PlatformBootstrapEventPort`) und braucht keine Hook-Strings.

**Approach B (Alternative): Domain behält semantische Event-IDs**
- Domain: `DomainEventName = "JournalDirectoryRendered" | "JournalCreated" | ...`
- Infrastructure: Map `DomainEventName -> FoundryHookName`.

Trade-offs:
- A reduziert „nutzlose“ Konstanten und verhindert Shortcut-Nutzung.
- B kann hilfreich sein, wenn Domain-Events auch außerhalb Foundry verwendet werden sollen.

# 6. Refactoring-Schritte

1. Inventar: Call-Sites von `DOMAIN_EVENTS` finden.
2. Ersetzen durch Port-Aufrufe oder infrastructure-lokale Konstanten.
3. `DOMAIN_EVENTS` aus `src/domain/constants/domain-constants.ts` entfernen (oder nur `DOMAIN_FLAGS` behalten).
4. Optional: Introduce `DomainEventName` (Approach B) und Mapping im Foundry-Adapter.

**Breaking Changes**
- Alle Imports von `DOMAIN_EVENTS` ändern sich.

# 7. Beispiel-Code

**After (Infrastructure mapping)**

```ts
// src/infrastructure/adapters/foundry/constants/foundry-hooks.ts
export const FOUNDY_HOOKS = {
  renderJournalDirectory: "renderJournalDirectory",
  updateJournalEntry: "updateJournalEntry",
  // ...
} as const;
```

# 8. Tests & Quality Gates

- Arch-Gate: Domain darf keine Foundry Hook-Namen als konstante IDs enthalten.
- Integration-Test: Hook-Registration läuft weiterhin, aber über Adapter/Ports.

# 9. Akzeptanzkriterien

- `src/domain/constants/domain-constants.ts` enthält keine Foundry Hook IDs mehr.
- Hook-Namen sind ausschließlich in Infrastructure/Framework verortet.
