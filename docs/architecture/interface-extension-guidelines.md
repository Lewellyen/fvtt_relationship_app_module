# Interface Extension Guidelines

**Zweck:** Richtlinien für die Erweiterung von Interfaces unter Beachtung des Liskov Substitution Principle (LSP)
**Zielgruppe:** Entwickler, Architekten
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.44.0

---

## Übersicht

Bei der Erweiterung von Interfaces müssen folgende Regeln beachtet werden, um das **Liskov Substitution Principle (LSP)** einzuhalten:

- Subtypen müssen vollständig substituierbar sein
- Preconditions dürfen nicht verschärft werden
- Postconditions dürfen nicht abgeschwächt werden
- Keine zusätzlichen Exceptions in Subtypen

---

## Liskov Substitution Principle Guidelines

### 1. Preconditions dürfen nicht verschärft werden

Subtypen dürfen **keine strengeren Preconditions** haben als der Basistyp.

```typescript
// ❌ Falsch: Strengere Precondition
interface Base {
  process(value: string): void; // value kann null sein
}

interface Derived extends Base {
  process(value: string): void; // value darf nicht null sein - LSP-Verstoß!
}
```

**Problem:** Code, der `Base` verwendet und `null` übergibt, funktioniert nicht mehr mit `Derived`.

```typescript
// ✅ Korrekt: Gleiche oder schwächere Preconditions
interface Base {
  process(value: string): void; // value kann null sein
}

interface Derived extends Base {
  process(value: string): void; // value kann auch null sein - LSP-konform
}
```

**Alternative:** Wenn strengere Preconditions nötig sind, sollte ein neues Interface erstellt werden:

```typescript
// ✅ Korrekt: Neues Interface statt Erweiterung
interface Base {
  process(value: string): void; // value kann null sein
}

interface StrictProcessor {
  process(value: string): void; // value darf nicht null sein
  // Keine Vererbung von Base, da unterschiedliche Verträge
}
```

---

### 2. Postconditions dürfen nicht abgeschwächt werden

Subtypen dürfen **keine schwächeren Postconditions** haben als der Basistyp.

```typescript
// ❌ Falsch: Schwächere Postcondition
interface Base {
  getValue(): number; // Gibt immer einen Wert zurück
}

interface Derived extends Base {
  getValue(): number | null; // Kann null zurückgeben - LSP-Verstoß!
}
```

**Problem:** Code, der `Base` verwendet und davon ausgeht, dass immer ein Wert zurückkommt, kann mit `Derived` fehlschlagen.

```typescript
// ✅ Korrekt: Gleiche oder stärkere Postconditions
interface Base {
  getValue(): number | null; // Kann null zurückgeben
}

interface Derived extends Base {
  getValue(): number; // Gibt immer einen Wert zurück - LSP-konform (stärkere Postcondition)
}
```

**Alternative:** Wenn schwächere Postconditions nötig sind, sollte ein neues Interface erstellt werden:

```typescript
// ✅ Korrekt: Neues Interface statt Erweiterung
interface Base {
  getValue(): number; // Gibt immer einen Wert zurück
}

interface OptionalValueProvider {
  getValue(): number | null; // Kann null zurückgeben
  // Keine Vererbung von Base, da unterschiedliche Verträge
}
```

---

### 3. Keine zusätzlichen Exceptions

Subtypen dürfen **keine zusätzlichen Exceptions** werfen, die der Basistyp nicht wirft.

```typescript
// ❌ Falsch: Zusätzliche Exception
interface Base {
  save(): void; // Wirft keine Exceptions
}

interface Derived extends Base {
  save(): void; // Wirft ValidationError - LSP-Verstoß!
}
```

**Problem:** Code, der `Base` verwendet und keine Exception-Behandlung hat, kann mit `Derived` unerwartet crashen.

```typescript
// ✅ Korrekt: Gleiche oder weniger Exceptions
interface Base {
  save(): void; // Wirft keine Exceptions
}

interface Derived extends Base {
  save(): void; // Wirft auch keine Exceptions - LSP-konform
}
```

**Alternative:** Wenn zusätzliche Exceptions nötig sind, sollte ein neues Interface erstellt werden:

```typescript
// ✅ Korrekt: Neues Interface statt Erweiterung
interface Base {
  save(): void; // Wirft keine Exceptions
}

interface ValidatingSaver {
  save(): void; // Wirft ValidationError
  // Keine Vererbung von Base, da unterschiedliche Verträge
}
```

---

### 4. Methoden nur hinzufügen, nicht modifizieren

Subtypen sollten **nur neue Methoden hinzufügen**, nicht bestehende Methoden modifizieren.

```typescript
// ✅ Korrekt: Neue Methoden hinzufügen
interface Base {
  getValue(): number;
}

interface Derived extends Base {
  getValue(): number; // Erbt von Base
  getValueAsString(): string; // Neue Methode - LSP-konform
}
```

**Wichtig:** In TypeScript können Interfaces Methoden nicht "überschreiben" (im Sinne von verändern), aber die Implementierung kann sich ändern. Die Signatur muss kompatibel bleiben.

---

## Best Practices

### Interface-Komposition statt Vererbung

Wenn unterschiedliche Verträge benötigt werden, sollte **Komposition** statt Vererbung verwendet werden:

```typescript
// ✅ Korrekt: Komposition
interface ReadRepository<T> {
  getById(id: string): Result<T | null, Error>;
}

interface WriteRepository<T> {
  create(data: T): Promise<Result<T, Error>>;
}

interface FullRepository<T> extends ReadRepository<T>, WriteRepository<T> {
  // Kombiniert beide Interfaces
}
```

### Dokumentation von Preconditions und Postconditions

Dokumentiere Preconditions und Postconditions in JSDoc-Kommentaren:

```typescript
/**
 * Verarbeitet einen Wert.
 *
 * @param value - Der zu verarbeitende Wert (kann null sein)
 * @throws {ValidationError} Wenn value ungültig ist
 * @returns Gibt immer einen Wert zurück (nie null)
 */
interface Processor {
  process(value: string | null): string;
}
```

### Regelmäßige Code-Reviews

- Prüfe neue Interface-Erweiterungen auf LSP-Verstöße
- Verwende TypeScript's strikte Typenprüfung
- Teste Substitution: Kann ein Subtyp überall verwendet werden, wo der Basistyp erwartet wird?

---

## Aktuelle Interface-Hierarchien im Projekt

Die folgenden Interface-Hierarchien wurden analysiert und sind **LSP-konform**:

### Repository-Hierarchie
- `PlatformEntityRepository<TEntity>` erweitert `PlatformEntityCollectionPort<TEntity>`
- `PlatformJournalRepository` erweitert `PlatformEntityRepository<JournalEntry>`
- `PlatformJournalCollectionPort` erweitert `PlatformEntityCollectionPort<JournalEntry>`

### Event-Port-Hierarchie
- `PlatformJournalEventPort` erweitert `PlatformEventPort<JournalEvent>`

### Channel-Port-Hierarchie
- `PlatformUINotificationChannelPort` erweitert `PlatformChannelPort`
- `PlatformConsoleChannelPort` erweitert `PlatformChannelPort`

### UI-Port-Komposition
- `PlatformUIPort` erweitert `PlatformJournalDirectoryUiPort, PlatformUINotificationPort`

**Analyse-Ergebnis:**
- ✅ Alle Interfaces fügen nur Methoden hinzu (keine Modifikation bestehender Methoden)
- ✅ Keine strengeren Preconditions in Subtypen
- ✅ Keine schwächeren Postconditions in Subtypen
- ✅ Keine zusätzlichen Exceptions in Subtypen
- ✅ Alle Subtypen sind vollständig substituierbar

---

## Weitere Informationen

- [Architektur-Patterns](./patterns.md) - Port-Adapter, Result, DI
- [SOLID-Prinzipien](../refactoring/README.md) - SOLID-Audit-Ergebnisse
- [LSP-Finding](../refactoring/LSP/findings/LSP__low__interface-hierarchies-analyzed__s3t4u5v.md) - Detaillierte Analyse

---

**Siehe auch:** [Architektur-Übersicht](./README.md)

