---
principle: OCP
severity: low
confidence: high
component_kind: const
component_name: "DOMAIN_FLAGS, DOMAIN_EVENTS"
file: "src/domain/constants/domain-constants.ts"
location:
  start_line: 1
  end_line: 44
tags: ["extensibility", "open-closed", "constants"]
---

# Problem

Die Domain-Konstanten `DOMAIN_FLAGS` und `DOMAIN_EVENTS` sind hardcoded und nicht erweiterbar. Neue Flags oder Events können nicht hinzugefügt werden, ohne die ursprüngliche Datei zu modifizieren.

## Evidence

```1:44:src/domain/constants/domain-constants.ts
/**
 * Domain-layer constants.
 *
 * Diese Konstanten repräsentieren Domain-Konzepte, die unabhängig von
 * jeglicher Technologie oder Framework-Implementierung sind.
 */

/**
 * Domain-level feature flags.
 * Diese Flags definieren Domain-Funktionalität, nicht technische Implementation.
 */
export const DOMAIN_FLAGS = {
  /** Flag key für versteckte Journal-Einträge */
  HIDDEN: "hidden",
} as const;

/**
 * Domain event names.
 * Diese Hook-Namen repräsentieren Domain-Events, die unabhängig von
 * der Platform-Implementierung (Foundry) sind.
 */
export const DOMAIN_EVENTS = {
  /** Event: Journal Directory wird gerendert */
  RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",

  /** Event: System-Initialisierung */
  INIT: "init",

  /** Event: System ist bereit */
  READY: "ready",

  /** Event: Journal Entry wird erstellt */
  CREATE_JOURNAL_ENTRY: "createJournalEntry",

  /** Event: Journal Entry wird aktualisiert */
  UPDATE_JOURNAL_ENTRY: "updateJournalEntry",

  /** Event: Journal Entry wird gelöscht */
  DELETE_JOURNAL_ENTRY: "deleteJournalEntry",
} as const;

// Deep freeze für Runtime-Immutability
Object.freeze(DOMAIN_FLAGS);
Object.freeze(DOMAIN_EVENTS);
```

Die Konstanten sind mit `as const` definiert und `Object.freeze()` gesichert, was sie unveränderlich macht.

## Impact

- **Nicht erweiterbar**: Neue Flags oder Events können nicht ohne Modifikation hinzugefügt werden
- **Domain-Stabilität**: Für Domain-Konstanten ist dies möglicherweise gewünscht, da sie die Kern-Domain-Konzepte definieren
- **Breaking Changes**: Änderungen betreffen alle Konsumenten

## Recommendation

**Option 1: Keine Änderung (Empfohlen)**
Domain-Konstanten sollten stabil und nicht erweiterbar sein, da sie die Kern-Domain-Konzepte definieren. Neue Domain-Konzepte sollten durch neue Konstanten-Dateien oder durch Erweiterung der bestehenden Datei hinzugefügt werden.

**Option 2: Registry-Pattern (Nur wenn nötig)**
Falls Module eigene Domain-Events hinzufügen müssen, könnte ein Registry-Pattern verwendet werden:

```typescript
// src/domain/constants/domain-event-registry.ts
export interface DomainEventRegistry {
  register(eventName: string): void;
  getAll(): readonly string[];
}

export const DomainEvents = createEventRegistry();
```

**Option 3: Namespace-basierte Erweiterung**
Events könnten nach Namespace gruppiert werden:

```typescript
export const DOMAIN_EVENTS = {
  JOURNAL: {
    CREATE: "createJournalEntry",
    UPDATE: "updateJournalEntry",
    DELETE: "deleteJournalEntry",
  },
  SYSTEM: {
    INIT: "init",
    READY: "ready",
  },
} as const;
```

## Example Fix

Falls Erweiterbarkeit gewünscht wird:

```typescript
// src/domain/constants/domain-event-registry.ts
class DomainEventRegistryImpl {
  private events = new Set<string>();

  constructor(initialEvents: readonly string[]) {
    initialEvents.forEach(event => this.events.add(event));
  }

  register(eventName: string): void {
    this.events.add(eventName);
  }

  getAll(): readonly string[] {
    return Array.from(this.events);
  }

  has(eventName: string): boolean {
    return this.events.has(eventName);
  }
}

export function createDomainEventRegistry() {
  return new DomainEventRegistryImpl([
    "renderJournalDirectory",
    "init",
    "ready",
    "createJournalEntry",
    "updateJournalEntry",
    "deleteJournalEntry",
  ]);
}

export const DomainEvents = createDomainEventRegistry();
```

## Notes

- **Status**: Low Severity, da Domain-Konstanten typischerweise stabil sein sollten
- Die aktuelle Implementierung ist für Domain-Konstanten angemessen
- `Object.freeze()` stellt sicher, dass die Konstanten zur Laufzeit unveränderlich sind
- **Empfehlung**: Keine Änderung erforderlich - Domain-Konstanten sollten stabil sein
- Neue Domain-Konzepte sollten durch explizite Änderungen der Domain-Definition hinzugefügt werden, nicht durch Runtime-Registrierung

