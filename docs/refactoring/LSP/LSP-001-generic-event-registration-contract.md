---
ID: LSP-001
Prinzip: LSP
Schweregrad: Mittel
Module/Layer: infrastructure/adapters/foundry/event-adapters
Status: Proposed
---

# 1. Problem

`FoundryJournalEventAdapter.registerListener()` erzeugt generische `JournalEvent`-Objekte ohne die Invarianten der spezialisierten Event-Typen sicherzustellen. Verbraucher des `PlatformEventPort<JournalEvent>` können dadurch unvollständige Events erhalten (z. B. leere `journalId` oder fehlende `changes`). Substitution der Port-Implementierung ist nicht garantiert.

# 2. Evidence (Belege)

**Pfad:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

```ts
registerListener(eventType: string, callback: (event: JournalEvent) => void) {
  const foundryCallback = (...args: unknown[]): void => {
    if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
      const candidate = args[0];
      if ("journalId" in candidate || "timestamp" in candidate) {
        const event: JournalEvent = {
          journalId: typeof eventRecord.journalId === "string" ? eventRecord.journalId : "",
          timestamp: typeof eventRecord.timestamp === "number" ? eventRecord.timestamp : Date.now(),
        };
        callback(event);
      }
    }
  };
}
```

# 3. SOLID-Analyse

- **LSP-Verstoß:** Implementierung liefert Events, die nicht die erwarteten Eigenschaften garantieren.
- **Folgeprobleme:** Upstream-Use-Cases können auf Felder zugreifen, die fehlen oder ungültig sind.

# 4. Zielbild

- `registerListener` liefert **vollständig validierte** `JournalEvent`-Objekte oder bricht mit klarer Fehlermeldung ab.
- Alternativ: `registerListener` gibt `unknown` oder einen spezifischen Event-Typ zurück und erzwingt explizite Mapper.

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- Entferne/Deprekiere die generische `registerListener`-Nutzung für `PlatformJournalEventPort`.
- Erzwinge Nutzung der spezialisierten Methoden (`onJournalCreated`, `onJournalUpdated`, ...).

**Approach B (Alternative):**
- Führe einen `EventMapper` ein, der `eventType` → konkrete Event-DTOs mappt und validiert.

**Trade-offs:**
- Approach A reduziert API-Unsicherheit, ist aber eine Breaking-Change für generische Nutzer.

# 6. Refactoring-Schritte

1. Markiere `registerListener` als deprecated für Journal-Ports.
2. Ergänze statische Guards/Validatoren pro EventType.
3. Passe Use-Cases auf spezialisierte Methoden an.
4. Entferne generische Nutzung nach Übergangsphase.

**Breaking Changes:**
- Generische Registrierung auf Journal-Ports wird entfernt oder strikt validiert.

# 7. Beispiel-Code

**After (skizziert)**
```ts
onJournalUpdated(cb) { /* map Foundry args -> JournalUpdatedEvent */ }
// registerListener entweder entfernt oder typed: PlatformEventPort<unknown>
```

# 8. Tests & Quality Gates

- Contract-Test: `JournalUpdatedEvent` enthält immer `journalId` und `changes`.
- Adapter-Tests: validierte Mapping-Pfade je Event-Type.

# 9. Akzeptanzkriterien

- Keine `JournalEvent`-Instanz ohne gültige Pflichtfelder.
- Use-Cases verwenden ausschließlich spezialisierte Event-Methoden.
