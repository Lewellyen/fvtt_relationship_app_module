---
principle: LSP
severity: low
confidence: high
component_kind: interface
component_name: "Interface Hierarchies"
file: "src/domain/ports"
location:
  start_line: 1
  end_line: 1
tags: ["liskov-substitution", "interface-hierarchy", "inheritance"]
---

# Problem

Analyse der Interface-Hierarchien im Domain-Layer auf Verstöße gegen das Liskov Substitution Principle. Alle analysierten Hierarchien erscheinen korrekt, aber es gibt potenzielle Risiken bei zukünftigen Erweiterungen.

## Evidence

**Analysierte Interface-Hierarchien:**

1. **Repository-Hierarchie:**
   - `PlatformEntityRepository<TEntity>` erweitert `PlatformEntityCollectionPort<TEntity>`
   - `PlatformJournalRepository` erweitert `PlatformEntityRepository<JournalEntry>`
   - `PlatformJournalCollectionPort` erweitert `PlatformEntityCollectionPort<JournalEntry>`

2. **Event-Port-Hierarchie:**
   - `PlatformJournalEventPort` erweitert `PlatformEventPort<JournalEvent>`

3. **Channel-Port-Hierarchie:**
   - `PlatformUINotificationChannelPort` erweitert `PlatformChannelPort`
   - `PlatformConsoleChannelPort` erweitert `PlatformChannelPort`

4. **UI-Port-Komposition:**
   - `PlatformUIPort` erweitert `PlatformJournalDirectoryUiPort, PlatformUINotificationPort`

**Analyse-Ergebnis:**
- Alle Interfaces fügen nur Methoden hinzu (keine Modifikation bestehender Methoden)
- Keine strengeren Preconditions in Subtypen
- Keine schwächeren Postconditions in Subtypen
- Keine zusätzlichen Exceptions in Subtypen
- Alle Subtypen sind vollständig substituierbar

## Impact

- **Aktuell**: Keine LSP-Verstöße erkannt
- **Potentielle Risiken**: Bei zukünftigen Erweiterungen könnten LSP-Verstöße entstehen, wenn:
  - Subtypen Methoden mit strengeren Preconditions einführen
  - Subtypen Methoden mit schwächeren Postconditions einführen
  - Subtypen zusätzliche Exceptions werfen, die der Basistyp nicht wirft

## Recommendation

**Option 1: Keine Änderung (Empfohlen)**
Die aktuellen Interface-Hierarchien sind korrekt und LSP-konform. Keine Änderungen erforderlich.

**Option 2: Dokumentation und Guidelines**
Guidelines für zukünftige Interface-Erweiterungen erstellen:
- Subtypen dürfen keine strengeren Preconditions haben
- Subtypen dürfen keine schwächeren Postconditions haben
- Subtypen dürfen keine zusätzlichen Exceptions werfen
- Subtypen sollten nur Methoden hinzufügen, nicht modifizieren

## Example Fix

Falls Guidelines gewünscht werden:

```typescript
// docs/architecture/interface-extension-guidelines.md

## Liskov Substitution Principle Guidelines

Bei der Erweiterung von Interfaces müssen folgende Regeln beachtet werden:

1. **Preconditions dürfen nicht verschärft werden**
   ```typescript
   // ❌ Falsch: Strengere Precondition
   interface Base {
     process(value: string): void; // value kann null sein
   }
   interface Derived extends Base {
     process(value: string): void; // value darf nicht null sein - LSP-Verstoß!
   }
   ```

2. **Postconditions dürfen nicht abgeschwächt werden**
   ```typescript
   // ❌ Falsch: Schwächere Postcondition
   interface Base {
     getValue(): number; // Gibt immer einen Wert zurück
   }
   interface Derived extends Base {
     getValue(): number | null; // Kann null zurückgeben - LSP-Verstoß!
   }
   ```

3. **Keine zusätzlichen Exceptions**
   ```typescript
   // ❌ Falsch: Zusätzliche Exception
   interface Base {
     save(): void; // Wirft keine Exceptions
   }
   interface Derived extends Base {
     save(): void; // Wirft ValidationError - LSP-Verstoß!
   }
   ```
```

## Notes

- **Status**: Low Severity, da aktuell keine Verstöße erkannt wurden
- Die Interface-Hierarchien sind korrekt implementiert
- **Empfehlung**: Keine Änderung erforderlich, aber Guidelines für zukünftige Erweiterungen könnten hilfreich sein
- Regelmäßige Code-Reviews sollten LSP-Verstöße in zukünftigen Erweiterungen verhindern

