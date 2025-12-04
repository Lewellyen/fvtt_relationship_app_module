# Umsetzungsplan: Domain Ports Zyklen beheben

**Problem-ID:** Circular Dependencies #2
**Betroffene Dateien:**
- `src/domain/ports/platform-ui-port.interface.ts`
- `src/domain/ports/journal-directory-ui-port.interface.ts`
- `src/domain/ports/notification-port.interface.ts`
- `src/domain/ports/collections/platform-entity-collection-port.interface.ts`
- `src/domain/ports/collections/entity-query-builder.interface.ts`

**Anzahl Zyklen:** 3
**Schweregrad:** 🟡 MITTEL
**Geschätzte Dauer:** 2-3 Stunden

---

## 📊 Problem-Analyse

### Aktueller Zustand

**Zyklus 1 & 2:** `PlatformUIPort` ↔ `JournalDirectoryUiPort` ↔ `NotificationPort`

```typescript
// platform-ui-port.interface.ts (Zeilen 1-29)
export interface PlatformUIError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

import type { JournalDirectoryUiPort } from "./journal-directory-ui-port.interface";
import type { NotificationPort } from "./notification-port.interface";

export interface PlatformUIPort extends JournalDirectoryUiPort, NotificationPort {}
```

```typescript
// journal-directory-ui-port.interface.ts (Zeile 2)
import type { PlatformUIError } from "./platform-ui-port.interface";
//                                   ↑
//                                   Importiert von Datei, die sie selbst importiert!

export interface JournalDirectoryUiPort {
  removeJournalElement(...): Result<void, PlatformUIError>;
  rerenderJournalDirectory(): Result<boolean, PlatformUIError>;
}
```

```typescript
// notification-port.interface.ts (Zeile 2)
import type { PlatformUIError } from "./platform-ui-port.interface";
//                                   ↑
//                                   Gleicher Zyklus!

export interface NotificationPort {
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError>;
}
```

**Zyklus 3:** `PlatformEntityCollectionPort` ↔ `EntityQueryBuilder`

```typescript
// platform-entity-collection-port.interface.ts
import type { EntityQueryBuilder } from "./entity-query-builder.interface";

export interface PlatformEntityCollectionPort<T> {
  query(): EntityQueryBuilder<T>;
}
```

```typescript
// entity-query-builder.interface.ts
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";

export interface EntityQueryBuilder<T> {
  // Nutzt PlatformEntityCollectionPort in irgendeiner Form
}
```

### Root Cause

**Verletzung des Interface Segregation Principle:**

1. ❌ **Shared Error-Type in Composite Interface**
   - `PlatformUIError` ist in `platform-ui-port.interface.ts` definiert
   - Wird aber von den **spezifischen** Interfaces (`JournalDirectoryUiPort`, `NotificationPort`) benötigt
   - **Lösung:** Error-Types in separate Datei auslagern

2. ❌ **Bidirektionale Interface-Abhängigkeiten**
   - `PlatformEntityCollectionPort` kennt `EntityQueryBuilder`
   - `EntityQueryBuilder` kennt `PlatformEntityCollectionPort`
   - **Lösung:** Gemeinsame Base-Interfaces oder Forward References

---

## 🎯 Ziel-Architektur

### Prinzipien

1. ✅ **Error-Types sind shared und dependency-free**
2. ✅ **Port-Interfaces kennen nur "nach unten" (zu Basis-Typen)**
3. ✅ **Composite-Interfaces (z.B. PlatformUIPort) nur in Consumer-Schicht**
4. ✅ **Builder-Pattern ohne zirkuläre Type-Dependencies**

### Neue Struktur

```
src/domain/
├── ports/
│   ├── errors/                                    # 🆕 NEU
│   │   ├── platform-ui-error.interface.ts         # Shared Error-Types
│   │   ├── platform-cache-error.interface.ts
│   │   └── platform-collection-error.interface.ts
│   │
│   ├── platform-ui-port.interface.ts              # ✅ Composite (importiert JournalDir + Notification)
│   ├── journal-directory-ui-port.interface.ts     # ✅ Spezifisch (importiert nur Error)
│   ├── notification-port.interface.ts             # ✅ Spezifisch (importiert nur Error)
│   │
│   └── collections/
│       ├── entity-query-builder.interface.ts      # ✅ Builder (kennt nur Result-Types)
│       ├── query-result.interface.ts              # 🆕 Shared zwischen Builder und Collection
│       └── platform-entity-collection-port.interface.ts  # ✅ Collection (nutzt Builder)
```

---

## 🔧 Umsetzungsschritte

### Phase 1: Error-Types auslagern (Breaking Change vermeiden)

**Dauer:** 45 Minuten

#### Schritt 1.1: Error-Types Datei erstellen

**Datei:** `src/domain/ports/errors/platform-ui-error.interface.ts`

```typescript
/**
 * Platform-agnostic error types for UI operations.
 *
 * Diese Error-Types werden von mehreren Port-Interfaces verwendet:
 * - PlatformUIPort
 * - JournalDirectoryUiPort
 * - NotificationPort
 *
 * Ausgelagert in separate Datei, um zirkuläre Abhängigkeiten zu vermeiden.
 */

/**
 * Base error interface for platform UI operations.
 */
export interface PlatformUIError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Specific error codes for UI operations.
 */
export const PlatformUIErrorCodes = {
  JOURNAL_ELEMENT_NOT_FOUND: "JOURNAL_ELEMENT_NOT_FOUND",
  JOURNAL_DIRECTORY_NOT_OPEN: "JOURNAL_DIRECTORY_NOT_OPEN",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",
  DOM_MANIPULATION_FAILED: "DOM_MANIPULATION_FAILED",
} as const;

export type PlatformUIErrorCode = typeof PlatformUIErrorCodes[keyof typeof PlatformUIErrorCodes];
```

**Commit:** `refactor(domain): extract PlatformUIError to separate file`

#### Schritt 1.2: Import-Pfade aktualisieren

**Datei 1:** `src/domain/ports/platform-ui-port.interface.ts`

```typescript
/**
 * Platform-agnostic error for UI operations.
 *
 * @deprecated Import from @/domain/ports/errors/platform-ui-error.interface instead
 */
export type { PlatformUIError } from "./errors/platform-ui-error.interface";

import type { JournalDirectoryUiPort } from "./journal-directory-ui-port.interface";
import type { NotificationPort } from "./notification-port.interface";

/**
 * Platform-agnostic port for UI operations.
 *
 * Convenience interface that combines JournalDirectoryUiPort and NotificationPort.
 * Services that need both capabilities can depend on this interface.
 * Services that only need one capability should depend on the specific port.
 *
 * This follows Interface Segregation Principle by providing a composition interface
 * while allowing consumers to depend on minimal interfaces.
 *
 * Implementations:
 * - Foundry: FoundryUIAdapter (implements both JournalDirectoryUiPort and NotificationPort)
 * - Roll20: Roll20UIAdapter
 * - CSV/Headless: NoOpUIAdapter
 */
export interface PlatformUIPort extends JournalDirectoryUiPort, NotificationPort {}
```

**Datei 2:** `src/domain/ports/journal-directory-ui-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { PlatformUIError } from "./errors/platform-ui-error.interface";
//                                   ↑ NEU: Direkter Import von Error-Datei

/**
 * Platform-agnostic port for journal directory UI operations.
 *
 * Focused interface for DOM manipulation operations on the journal directory.
 * Separated from notification operations to follow Interface Segregation Principle.
 *
 * Implementations:
 * - Foundry: FoundryJournalDirectoryUIAdapter (wraps FoundryV13UIPort)
 * - Roll20: Roll20JournalDirectoryUIAdapter
 * - CSV/Headless: NoOpJournalDirectoryUIAdapter
 */
export interface JournalDirectoryUiPort {
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, PlatformUIError>;

  rerenderJournalDirectory(): Result<boolean, PlatformUIError>;
}
```

**Datei 3:** `src/domain/ports/notification-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { PlatformUIError } from "./errors/platform-ui-error.interface";
//                                   ↑ NEU: Direkter Import von Error-Datei

/**
 * Platform-agnostic port for user notifications.
 *
 * Focused interface for displaying notifications to users.
 * Separated from DOM manipulation operations to follow Interface Segregation Principle.
 *
 * Implementations:
 * - Foundry: FoundryNotificationAdapter (wraps FoundryV13UIPort)
 * - Roll20: Roll20NotificationAdapter
 * - CSV/Headless: NoOpNotificationAdapter
 */
export interface NotificationPort {
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError>;
}
```

**PowerShell Script zum automatischen Ersetzen:**

```powershell
# Alle Dateien finden, die PlatformUIError von platform-ui-port importieren
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -Exclude "*.spec.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Ersetze Import von platform-ui-port.interface durch errors/platform-ui-error.interface
    # Aber NUR für PlatformUIError, nicht für PlatformUIPort!
    $pattern = 'import\s+type\s+\{\s*PlatformUIError\s*\}\s+from\s+[''"]\.\/platform-ui-port\.interface[''"];?'
    $replacement = 'import type { PlatformUIError } from "./errors/platform-ui-error.interface";'

    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
    }
}
```

**Commit:** `refactor(domain): update imports to use separate error file`

**Testen:**
```powershell
npm run type-check
npm run analyze:circular
```

✅ **Erwartetes Ergebnis:** Zyklus 1 & 2 behoben (74 → 72 circular deps)

---

### Phase 2: Collection/QueryBuilder Zyklus beheben

**Dauer:** 1 Stunde

#### Schritt 2.1: Aktuellen Zustand analysieren

```powershell
# Finde alle Entity-Query-Builder Nutzungen
grep -r "EntityQueryBuilder" src/domain/ports/collections/
```

Lass uns erst die tatsächlichen Dateien lesen:

```powershell
cat src/domain/ports/collections/entity-query-builder.interface.ts
cat src/domain/ports/collections/platform-entity-collection-port.interface.ts
```

#### Schritt 2.2: Query-Result Interface erstellen

**Datei:** `src/domain/ports/collections/query-result.interface.ts`

```typescript
/**
 * Query result interface - shared between QueryBuilder and Collection
 *
 * Breaks circular dependency by providing a common type that both
 * EntityQueryBuilder and PlatformEntityCollectionPort can reference.
 */
export interface QueryResult<T> {
  items: T[];
  count: number;
  hasMore: boolean;
}

/**
 * Query options that can be used by both builder and collection
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
```

**Commit:** `refactor(domain): add shared QueryResult interface`

#### Schritt 2.3: EntityQueryBuilder refactoren

**Datei:** `src/domain/ports/collections/entity-query-builder.interface.ts`

**Vorher (zirkulär):**
```typescript
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";

export interface EntityQueryBuilder<T> {
  where(predicate: (item: T) => boolean): EntityQueryBuilder<T>;
  limit(count: number): EntityQueryBuilder<T>;
  execute(): PlatformEntityCollectionPort<T>; // ← Zyklus!
}
```

**Nachher (zyklus-frei):**
```typescript
import type { QueryResult, QueryOptions } from "./query-result.interface";

/**
 * Fluent query builder for entity collections.
 *
 * Pattern: Builder Pattern ohne zirkuläre Abhängigkeit zur Collection.
 * Der Builder gibt QueryResult zurück, nicht die Collection selbst.
 */
export interface EntityQueryBuilder<T> {
  /**
   * Add a filter predicate
   */
  where(predicate: (item: T) => boolean): EntityQueryBuilder<T>;

  /**
   * Limit number of results
   */
  limit(count: number): EntityQueryBuilder<T>;

  /**
   * Skip first N results
   */
  offset(count: number): EntityQueryBuilder<T>;

  /**
   * Sort by field
   */
  sortBy(field: keyof T, direction?: "asc" | "desc"): EntityQueryBuilder<T>;

  /**
   * Execute query and return results
   *
   * Returns QueryResult instead of Collection to avoid circular dependency.
   */
  execute(): Promise<QueryResult<T>>;

  /**
   * Execute query synchronously (for in-memory collections)
   */
  executeSync(): QueryResult<T>;
}
```

**Commit:** `refactor(domain): break circular dependency in EntityQueryBuilder`

#### Schritt 2.4: PlatformEntityCollectionPort aktualisieren

**Datei:** `src/domain/ports/collections/platform-entity-collection-port.interface.ts`

```typescript
import type { EntityQueryBuilder } from "./entity-query-builder.interface";
import type { QueryResult, QueryOptions } from "./query-result.interface";

/**
 * Platform-agnostic port for entity collection operations.
 *
 * Provides both direct access and fluent query builder interface.
 */
export interface PlatformEntityCollectionPort<T> {
  /**
   * Get all entities (use with caution - prefer query() for filtering)
   */
  getAll(): Promise<T[]>;

  /**
   * Get entity by ID
   */
  getById(id: string): Promise<T | undefined>;

  /**
   * Create a query builder for complex queries
   *
   * @example
   * ```typescript
   * const result = await collection
   *   .query()
   *   .where(entity => entity.visible === true)
   *   .limit(10)
   *   .execute();
   * ```
   */
  query(): EntityQueryBuilder<T>;

  /**
   * Execute a simple query with options
   *
   * Alternative to fluent query builder for simple cases.
   */
  queryWithOptions(options: QueryOptions): Promise<QueryResult<T>>;
}
```

**Commit:** `refactor(domain): update PlatformEntityCollectionPort to use QueryResult`

**Testen:**
```powershell
npm run type-check
npm run analyze:circular
```

✅ **Erwartetes Ergebnis:** Alle 3 Domain-Port-Zyklen behoben (72 → 69 circular deps)

---

### Phase 3: Implementations aktualisieren

**Dauer:** 1 Stunde

#### Schritt 3.1: Adapter-Implementierungen finden

```powershell
# Finde alle Implementierungen von JournalDirectoryUiPort
grep -r "implements.*JournalDirectoryUiPort" src/
grep -r "implements.*NotificationPort" src/
grep -r "implements.*PlatformEntityCollectionPort" src/
```

#### Schritt 3.2: Implementierungen aktualisieren

Für jede gefundene Implementierung:

1. **Import-Pfade aktualisieren:**
   ```typescript
   // ALT:
   import type { PlatformUIError } from "@/domain/ports/platform-ui-port.interface";

   // NEU:
   import type { PlatformUIError } from "@/domain/ports/errors/platform-ui-error.interface";
   ```

2. **QueryBuilder-Implementierungen aktualisieren:**
   - `execute()` gibt `QueryResult<T>` zurück statt `Collection<T>`
   - Implementiere `QueryResult` Interface

**Script für automatische Migration:**

```powershell
$files = Get-ChildItem -Path "src/infrastructure" -Recurse -Filter "*Adapter.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Update PlatformUIError imports
    $content = $content -replace `
        'from "@/domain/ports/platform-ui-port.interface"', `
        'from "@/domain/ports/errors/platform-ui-error.interface"'

    # Update QueryResult imports if needed
    if ($content -match "EntityQueryBuilder|PlatformEntityCollectionPort") {
        # Add QueryResult import if not present
        if ($content -notmatch 'import.*QueryResult.*from.*query-result') {
            $importLine = 'import type { QueryResult } from "@/domain/ports/collections/query-result.interface";'
            $content = $content -replace '(import type.*from.*entity-query-builder)', "$importLine`n`$1"
        }
    }

    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
}
```

**Commit:** `refactor(infrastructure): update adapters for new error/query structure`

---

## ✅ Erfolgskriterien

### Funktional

- [ ] Alle Tests laufen durch (`npm run test`)
- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Keine neuen Linter-Fehler (`npm run lint`)

### Architektur

- [ ] 3 Domain-Port Zyklen behoben (74 → 71)
- [ ] `PlatformUIError` in separater `errors/` Datei
- [ ] `QueryResult` in separater Datei
- [ ] Keine bidirektionalen Interface-Dependencies mehr

### Code Quality

- [ ] Error-Types sind wiederverwendbar
- [ ] Builder-Pattern ohne Zyklen implementiert
- [ ] Alle Adapter-Implementierungen aktualisiert

---

## 🔙 Rollback-Plan

### Wenn Phase 1 fehlschlägt:

```powershell
# Lösche errors/ Ordner
Remove-Item -Path "src/domain/ports/errors" -Recurse -Force

# Revert Commits
git revert HEAD
git revert HEAD~1
```

### Wenn Phase 2 fehlschlägt:

```powershell
# Lösche query-result.interface.ts
Remove-Item -Path "src/domain/ports/collections/query-result.interface.ts"

# Revert QueryBuilder Änderungen
git checkout src/domain/ports/collections/entity-query-builder.interface.ts
git checkout src/domain/ports/collections/platform-entity-collection-port.interface.ts
```

### Notfall-Rollback:

```powershell
# Kompletter Rollback auf letzten stabilen Stand
git reset --hard HEAD~5
```

---

## 📚 Design Patterns

### Interface Segregation Principle (ISP)

✅ **Richtig umgesetzt:**
```typescript
// Spezifische Interfaces mit minimalen Dependencies
interface JournalDirectoryUiPort { ... }
interface NotificationPort { ... }

// Composite Interface nur für Consumer
interface PlatformUIPort extends JournalDirectoryUiPort, NotificationPort {}
```

❌ **Falsch (vorher):**
```typescript
// Error-Type im Composite Interface definiert
interface PlatformUIPort {
  error: PlatformUIError; // ← Spezifische Ports müssen das Composite importieren
}
```

### Builder Pattern ohne Zyklen

✅ **Richtig:**
```typescript
// Builder gibt Werte-Objekt zurück
interface QueryBuilder<T> {
  execute(): QueryResult<T>;
}

// Collection erstellt Builder
interface Collection<T> {
  query(): QueryBuilder<T>;
}
```

❌ **Falsch (vorher):**
```typescript
// Builder gibt Collection zurück → Zyklus!
interface QueryBuilder<T> {
  execute(): Collection<T>;
}
```

---

## 📊 Metriken

### Vorher

- Zirkuläre Dependencies: 74
- Domain Port Zyklen: 3
- Coupling Level: HOCH (Composite Interfaces kennen Specifics)

### Nachher

- Zirkuläre Dependencies: 71
- Domain Port Zyklen: 0
- Coupling Level: NIEDRIG (Shared Base-Types, unidirektionale Dependencies)

---

**Status:** 🟡 BEREIT ZUR UMSETZUNG
**Priorität:** 🟡 MITTEL
**Risiko:** 🟢 NIEDRIG (Clean Refactoring ohne Breaking Changes)
**Dependencies:** Keine (kann parallel zu Plan 1 umgesetzt werden)

