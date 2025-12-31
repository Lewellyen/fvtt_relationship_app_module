---
ID: OCP-001
Prinzip: OCP
Schweregrad: Mittel
Module/Layer: application/services
Status: Proposed
---

# 1. Problem

`ModuleEventRegistrar` ist nur durch Änderungen am Konstruktor und der internen Liste erweiterbar. Jeder neue Event-Registrar erfordert Code-Änderungen im Registrar selbst und im DI-Wrapper.

# 2. Evidence (Belege)

**Pfad:** `src/application/services/ModuleEventRegistrar.ts`

```ts
constructor(
  processJournalDirectoryOnRender: EventRegistrar,
  invalidateJournalCacheOnChange: EventRegistrar,
  triggerJournalDirectoryReRender: EventRegistrar,
  private readonly notifications: NotificationPublisherPort
) {
  this.eventRegistrars = [
    processJournalDirectoryOnRender,
    invalidateJournalCacheOnChange,
    triggerJournalDirectoryReRender,
  ];
}
```

# 3. SOLID-Analyse

- **OCP-Verstoß:** Erweiterungen erfordern Modifikation.
- **Folgeprobleme:** Hoher Change-Overhead bei neuen Features.

# 4. Zielbild

- Registrar erhält eine **Liste/Registry** von Event-Registrars via DI.
- Neue Registrars werden durch Registrierung ergänzt, nicht durch Code-Änderung.

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- `EventRegistrarRegistry` Interface einführen.
- `ModuleEventRegistrar` iteriert über Registry.

**Approach B (Alternative):**
- DI-Token für `EventRegistrar[]` (Multi-Binding) und dynamische Liste.

**Trade-offs:**
- Registry erfordert zusätzliche Infrastruktur, ist aber sauberer für Tests.

# 6. Refactoring-Schritte

1. `EventRegistrarRegistry` definieren (`getAll(): EventRegistrar[]`).
2. Implementierung in Application oder Infrastructure anlegen.
3. `ModuleEventRegistrar` auf Registry umstellen.
4. DI-Konfiguration anpassen (Multi-Binding oder Registry).

**Breaking Changes:**
- DI-Registrierung für Event-Registrars ändert sich.

# 7. Beispiel-Code

**After (skizziert)**
```ts
constructor(registry: EventRegistrarRegistry, notifications: NotificationPublisherPort) {
  this.eventRegistrars = registry.getAll();
}
```

# 8. Tests & Quality Gates

- Unit-Test: Registry liefert Registrars in definierter Reihenfolge.
- Integration-Test: neue Registrars ohne Code-Änderung addierbar.

# 9. Akzeptanzkriterien

- Neue Event-Registrars werden ausschließlich über DI/Registry ergänzt.
- `ModuleEventRegistrar` enthält keine hard-coded Liste.
