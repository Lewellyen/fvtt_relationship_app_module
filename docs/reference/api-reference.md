# API-Referenz

**Zweck:** Vollständige Dokumentation der öffentlichen API für externe Module
**Zielgruppe:** Externe Entwickler, Module-Integratoren
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)
**API-Version:** 1.0.0

---

## 📖 Übersicht

Dieses Modul stellt eine öffentliche API unter `game.modules.get('fvtt_relationship_app_module').api` bereit, die es anderen Modulen und Makros ermöglicht, mit dem Beziehungsnetzwerk-System zu interagieren.

### ⚠️ Anforderungen

- **Foundry VTT Version 13+** (Mindestversion)
- Ältere Versionen (v10-12) werden nicht unterstützt

---

## 🚀 Getting Started

### Zugriff auf die Modul-API

```typescript
// API-Objekt abrufen
const api = game.modules.get('fvtt_relationship_app_module').api;

if (!api) {
  console.error('Relationship App Module nicht aktiviert');
  return;
}

// Option 1: resolve() - Guaranteed Return (throws on error)
const notifications = api.resolve(api.tokens.notificationCenterToken);
notifications.error('Hello from external module!', {
  code: 'EXTERNAL_MODULE',
  message: 'Greetings from another module',
});

// Option 2: resolveWithError() - Result-Pattern (safe, never throws)
const notificationResult = api.resolveWithError(api.tokens.notificationCenterToken);
if (notificationResult.ok) {
  notificationResult.value.warn('Safe with Result-Pattern', {
    code: 'RESULT',
    message: 'All good',
  });
} else {
  console.error('Failed to resolve notification center:', notificationResult.error);
}
```

### TypeScript-Unterstützung

Für TypeScript-Projekte steht vollständige Typisierung zur Verfügung:

```typescript
// Option 1: Global Declaration (empfohlen für eigene Module)
declare global {
  interface Game {
    modules: Map<string, {
      active: boolean;
      api?: {
        version: string;
        resolve<T>(token: symbol): T; // Throws on error
        resolveWithError<T>(token: symbol): Result<T, ContainerError>; // Never throws
        getAvailableTokens(): Map<symbol, TokenInfo>;
        getMetrics(): MetricsSnapshot;
        getHealth(): HealthStatus;
        tokens: {
          notificationCenterToken: symbol;
          journalVisibilityServiceToken: symbol;
          foundryGameToken: symbol;
          foundryHooksToken: symbol;
          foundryDocumentToken: symbol;
          foundryUIToken: symbol;
          foundrySettingsToken: symbol;
          i18nFacadeToken: symbol;
          foundryJournalFacadeToken: symbol;
          journalCollectionPortToken: symbol;
          journalRepositoryToken: symbol;
        };
      };
    }>;
  }
}

// Option 2: resolve() - Clean Code (empfohlen für well-known tokens)
const mod = game.modules.get('fvtt_relationship_app_module');
if (mod?.active && mod.api) {
  const notifications = mod.api.resolve(mod.api.tokens.notificationCenterToken);
  notifications.info('Type-safe!');
}

// Option 3: resolveWithError() - Result-Pattern (empfohlen für optionale Services)
const api = game.modules.get('fvtt_relationship_app_module')?.api;
const notificationsResult = api?.resolveWithError(api.tokens.notificationCenterToken);
if (notificationsResult?.ok) {
  notificationsResult.value.warn('Sicher mit Result-Pattern');
} else {
  console.error('Notification center not available:', notificationsResult.error.message);
}
```

### TypeScript Type Definitions

Vollständige Type Definitions für externe Module:

```typescript
// Result Pattern Types
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E> = Ok<T> | Err<E>;

// Container Error
interface ContainerError {
  code: string;
  message: string;
  cause?: unknown;
  tokenDescription?: string;
  details?: unknown;
  stack?: string;
  timestamp?: number;
  containerScope?: string;
}

// Foundry Error
interface FoundryError {
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
}

// Token Info
interface TokenInfo {
  description: string;
  isRegistered: boolean;
}

// Metrics Snapshot
interface MetricsSnapshot {
  containerResolutions: number;
  resolutionErrors: number;
  avgResolutionTimeMs: number;
  portSelections: Record<number, number>;
  portSelectionFailures: Record<number, number>;
  cacheHitRate: number;
}

// Health Status
interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: number;
  checks: {
    containerValidated: boolean;
    lastError?: string;
  };
}
```

---

## 🔧 Service-Auflösung: resolve() vs. resolveWithError()

Die API bietet **zwei Methoden** zur Service-Auflösung:

### `resolve<T>(token): T` - Guaranteed Return

**Wann verwenden:**
- ✅ Well-known tokens (notificationCenterToken, foundryGameToken, etc.)
- ✅ Services die garantiert registriert sind
- ✅ Clean Code ohne Result-Checks gewünscht

**Verhalten:**
- Gibt Service **direkt** zurück
- **Wirft Exception** bei Fehler
- Externe Module müssen `try-catch` nutzen

**Beispiel:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

try {
  const notifications = api.resolve(api.tokens.notificationCenterToken);
  notifications.info('Hello World'); // Clean code
} catch (error) {
  console.error('Failed:', error);
}
```

---

### `resolveWithError<T>(token): Result<T, ContainerError>` - Result-Pattern

**Wann verwenden:**
- ✅ Custom/optionale Services
- ✅ Wenn explizite Fehlerbehandlung gewünscht
- ✅ Wenn try-catch vermieden werden soll
- ✅ Wenn Result-Pattern bevorzugt wird

**Verhalten:**
- Gibt **Result** zurück (ok/error)
- **Wirft nie** eine Exception
- Type-safe error handling

**Beispiel:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

const notificationResult = api.resolveWithError(api.tokens.notificationCenterToken);

if (notificationResult.ok) {
  notificationResult.value.info('Erfolg!');
} else {
  console.error('Fehler:', notificationResult.error.code, notificationResult.error.message);
  // Fallback-Logik
  console.log('Using fallback logger');
}
```

**Error-Struktur:**
```typescript
interface ContainerError {
  code: string;              // z.B. "SERVICE_NOT_REGISTERED"
  message: string;           // Human-readable Fehlermeldung
  tokenDescription?: string; // Name des fehlenden Tokens
  details?: unknown;         // Zusätzliche Debug-Info
  stack?: string;            // Stack-Trace (falls verfügbar)
}
```

---

### Vergleich

| Aspekt | `resolve()` | `resolveWithError()` |
|--------|-------------|----------------------|
| **Rückgabe** | `T` (direkt) | `Result<T, ContainerError>` |
| **Bei Fehler** | Throws Exception | Returns `{ ok: false, error }` |
| **Error Handling** | `try-catch` nötig | `if (result.ok)` check |
| **Empfohlen für** | Well-known tokens | Custom/optionale Services |
| **Code-Stil** | Clean, kurz | Explicit, safe |

---

## 🔑 Verfügbare Tokens

Die API stellt folgende Injection-Tokens bereit:

| Token | Service-Typ | Beschreibung |
|-------|-------------|--------------|
| `notificationCenterToken` | `NotificationCenter` | Zentrale Routing-Instanz für Module-notifications |
| `journalVisibilityServiceToken` | `JournalVisibilityService` | Verwaltung versteckter Journal-Einträge |
| `foundryGameToken` | `FoundryGame` | Zugriff auf Foundry Game API (journal entries) |
| `foundryHooksToken` | `FoundryHooks` | Foundry Hook-System |
| `foundryDocumentToken` | `FoundryDocument` | Foundry Document API (flags, etc.) |
| `foundryUIToken` | `FoundryUI` | Foundry UI-Manipulationen |
| `foundrySettingsToken` | `FoundrySettings` | Foundry Settings-System (Runtime-Konfiguration) |
| `journalCollectionPortToken` | `JournalCollectionPort` | Platform-agnostischer Zugriff auf Journal Collections (Read-Only) |
| `journalRepositoryToken` | `JournalRepository` | Platform-agnostischer Zugriff auf Journal CRUD-Operationen |

### Token-Informationen abrufen

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// Alle verfügbaren Tokens auflisten
const tokens = api.getAvailableTokens();

for (const [symbol, info] of tokens) {
  console.log(`Token: ${info.description}`);
  console.log(`Registered: ${info.isRegistered}`);
}
```

---

## 📚 Service-Interfaces

### NotificationCenter

`NotificationCenter` bündelt alle Modul-Benachrichtigungen und routet sie an registrierte Channels (z. B. Konsole, Foundry UI, Remote-Logging).

```typescript
interface NotificationCenterOptions {
  channels?: string[]; // Zielkanäle einschränken
  traceId?: string;    // Korrelations-ID für Logs/Metriken
  uiOptions?: FoundryNotificationOptions; // Durchgereichte Foundry UI Optionen
}

interface FoundryNotificationOptions {
  clean?: boolean;
  console?: boolean;
  escape?: boolean;
  format?: Record<string, string>;
  localize?: boolean;
  permanent?: boolean;
  progress?: boolean;
}
```

**Beispiel – Persistente UI Notification**

```typescript
const notifications = api.resolve(api.tokens.notificationCenterToken);

notifications.info(
  'Neue Beziehungen synchronisiert',
  { actorCount: 12 },
  {
    uiOptions: {
      permanent: true,
      localize: true,
    },
  }
);
```

---

### FoundryGame

Zugriff auf Foundry Game-API (versionssicher über Port-Adapter).

```typescript
interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError>;
  invalidateCache(): void; // Invalidates the journal entries cache
}
```

**Beispiel:**

```typescript
const gameService = api.resolve(api.tokens.foundryGameToken);

const journalsResult = gameService.getJournalEntries();
if (journalsResult.ok) {
  console.log(`Gefunden: ${journalsResult.value.length} Journal-Einträge`);
} else {
  console.error(`Fehler: ${journalsResult.error.message}`);
}
```

---

### FoundryHooks

Foundry Hook-System (versionssicher).

**Basiert auf**: [Foundry VTT v13 Hooks API](https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html)

```typescript
interface FoundryHooks {
  on(hook: string, fn: Function): Result<number, FoundryError>;
  once(hook: string, fn: Function): Result<number, FoundryError>;
  off(hook: string, callbackOrId: Function | number): Result<void, FoundryError>;
}
```

**Beispiel - Hook registrieren und mit ID deregistrieren:**

```typescript
const hooksService = api.resolve(api.tokens.foundryHooksToken);

// Register hook and get ID
const hookResult = hooksService.on('updateActor', (actor, updateData, options, userId) => {
  console.log(`Actor ${actor.name} wurde aktualisiert`);
});

if (hookResult.ok) {
  const hookId = hookResult.value;
  console.log(`Hook registered with ID: ${hookId}`);

  // Later: Unregister by ID
  hooksService.off('updateActor', hookId);
} else {
  console.error(`Hook-Registrierung fehlgeschlagen: ${hookResult.error.message}`);
}
```

---

### FoundryDocument

Foundry Document API (Flags, etc.).

```typescript
interface FoundryDocument {
  getFlag<T>(document: unknown, scope: string, key: string): Result<T | undefined, FoundryError>;
  setFlag(document: unknown, scope: string, key: string, value: unknown): Promise<Result<void, FoundryError>>;
}
```

**Beispiel:**

```typescript
const documentService = api.resolve(api.tokens.foundryDocumentToken);

// Flag lesen
const flagResult = documentService.getFlag<boolean>(
  journalEntry,
  'fvtt_relationship_app_module',
  'hidden'
);

if (flagResult.ok && flagResult.value === true) {
  console.log('Journal-Eintrag ist versteckt');
}

// Flag setzen
await documentService.setFlag(
  journalEntry,
  'fvtt_relationship_app_module',
  'hidden',
  true
);
```

---

### FoundrySettings

Zugriff auf Foundry Settings-System (versionssicher).

**Basiert auf**: [Foundry VTT v13 Settings API](https://foundryvtt.com/article/settings/)

```typescript
interface FoundrySettings {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): Result<void, FoundryError>;
  get<T>(namespace: string, key: string): Result<T, FoundryError>;
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>>;
}
```

**Beispiel - Log-Level ändern:**

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const settings = api.resolve(api.tokens.foundrySettingsToken);

// Log-Level abrufen
const currentLevel = settings.get<number>('fvtt_relationship_app_module', 'logLevel');
if (currentLevel.ok) {
  console.log(`Current log level: ${currentLevel.value}`);
}

// Log-Level setzen (triggert onChange-Callback)
await settings.set('fvtt_relationship_app_module', 'logLevel', 0); // DEBUG
```

---

### JournalVisibilityService

Verwaltung von versteckten Journal-Einträgen.

```typescript
interface JournalVisibilityService {
  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError>;
  processJournalDirectory(htmlElement: HTMLElement): Result<void, JournalVisibilityError>;
}

// Domain Types (domänenneutral)
interface JournalEntry {
  readonly id: string;
  readonly name: string | null;
}
```

**Beispiel:**

```typescript
const visibilityService = api.resolve(api.tokens.journalVisibilityServiceToken);

const hiddenResult = visibilityService.getHiddenJournalEntries();
if (hiddenResult.ok) {
  console.log(`${hiddenResult.value.length} versteckte Journal-Einträge gefunden`);
  hiddenResult.value.forEach(entry => {
    console.log(`Hidden: ${entry.name ?? entry.id}`);
  });
}
```

---

### JournalCollectionPort

Platform-agnostischer Zugriff auf Journal Collections (Read-Only). Ermöglicht Abfragen und Suchen von Journal-Einträgen ohne direkte Foundry-Abhängigkeiten.

```typescript
interface JournalCollectionPort {
  getAll(): Result<JournalEntry[], EntityCollectionError>;
  getById(id: string): Result<JournalEntry | null, EntityCollectionError>;
  getByIds(ids: string[]): Result<JournalEntry[], EntityCollectionError>;
  exists(id: string): Result<boolean, EntityCollectionError>;
  count(): Result<number, EntityCollectionError>;
  search(query: EntitySearchQuery<JournalEntry>): Result<JournalEntry[], EntityCollectionError>;
  query(): EntityQueryBuilder<JournalEntry>;
}
```

**Beispiel - Query Builder verwenden:**

```typescript
const collection = api.resolve(api.tokens.journalCollectionPortToken);

// Query Builder verwenden
const queryResult = collection.query()
  .where("name", "contains", "Quest")
  .limit(10)
  .execute();

if (queryResult.ok) {
  console.log(`Gefunden: ${queryResult.value.length} Journals mit "Quest" im Namen`);
}
```

---

### JournalRepository

Platform-agnostischer Zugriff auf Journal CRUD-Operationen. Erweitert `JournalCollectionPort` um Create, Update, Delete und Flag-Operationen.

```typescript
interface JournalRepository extends JournalCollectionPort {
  create(data: CreateEntityData<JournalEntry>): Promise<Result<JournalEntry, EntityRepositoryError>>;
  update(id: string, changes: EntityChanges<JournalEntry>): Promise<Result<JournalEntry, EntityRepositoryError>>;
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  getFlag(id: string, scope: string, key: string): Result<unknown | null, EntityRepositoryError>;
  setFlag(id: string, scope: string, key: string, value: unknown): Promise<Result<void, EntityRepositoryError>>;
  unsetFlag(id: string, scope: string, key: string): Promise<Result<void, EntityRepositoryError>>;
}
```

**Beispiel - Journal erstellen:**

```typescript
const repository = api.resolve(api.tokens.journalRepositoryToken);

const createResult = await repository.create({
  name: "Neues Journal"
});

if (createResult.ok) {
  console.log(`Journal erstellt: ${createResult.value.id}`);
} else {
  console.error(`Fehler: ${createResult.error.message}`);
}
```

---

### I18nFacadeService

Internationalisierungs-Service mit Foundry + Local Fallback.

```typescript
interface I18nFacadeService {
  translate(key: string, data?: Record<string, unknown>): Result<string, string>;
  format(key: string, data?: Record<string, unknown>): Result<string, string>;
  has(key: string): Result<boolean, string>;
}
```

**Beispiel - Übersetzung abrufen:**

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const i18n = api.resolve(api.tokens.i18nFacadeToken);

// Einfache Übersetzung
const greetingResult = i18n.translate("myModule.greeting");
if (greetingResult.ok) {
  console.log(greetingResult.value); // "Hallo Welt"
}

// Mit Platzhaltern
const messageResult = i18n.format("myModule.welcome", { name: "Andreas" });
if (messageResult.ok) {
  console.log(messageResult.value); // "Willkommen, Andreas!"
}
```

---

## 🔄 Result-Pattern

Alle API-Methoden, die fehlschlagen können, geben ein `Result<T, E>` zurück:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Result-Handling

```typescript
// Beispiel 1: Einfache Prüfung
const result = gameService.getJournalEntries();
if (result.ok) {
  // Erfolg: result.value ist verfügbar
  console.log(result.value);
} else {
  // Fehler: result.error ist verfügbar
  console.error(result.error);
}
```

---

## 🎯 Anwendungsbeispiele

### Beispiel 1: Eigenes Makro mit Logging

```typescript
// Makro: "Log Actors"
const api = game.modules.get('fvtt_relationship_app_module').api;
const notifications = api.resolve(api.tokens.notificationCenterToken);

notifications.info('Makro gestartet', { user: game.user.name });

for (const actor of game.actors) {
  notifications.debug('Actor gefunden', {
    name: actor.name,
    type: actor.type
  });
}

notifications.info('Makro abgeschlossen', { count: game.actors.size });
```

### Beispiel 2: Journal-Einträge filtern

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const gameService = api.resolve(api.tokens.foundryGameToken);
const documentService = api.resolve(api.tokens.foundryDocumentToken);

const journalsResult = gameService.getJournalEntries();
if (!journalsResult.ok) {
  ui.notifications.error('Fehler beim Laden der Journal-Einträge');
  return;
}

const hiddenJournals = [];
for (const journal of journalsResult.value) {
  const flagResult = documentService.getFlag<boolean>(
    journal,
    'fvtt_relationship_app_module',
    'hidden'
  );

  if (flagResult.ok && flagResult.value === true) {
    hiddenJournals.push(journal);
  }
}

console.log(`Versteckte Journal-Einträge: ${hiddenJournals.length}`);
```

---

## ⚠️ Wichtige Hinweise

### Modul-Verfügbarkeit prüfen

Prüfen Sie immer, ob das Modul aktiviert ist:

```typescript
const api = game.modules.get('fvtt_relationship_app_module')?.api;
if (!api) {
  console.warn('Relationship App Module nicht verfügbar');
  return;
}
```

### Result-Pattern verwenden

Verwenden Sie immer das Result-Pattern für Fehlerbehandlung:

```typescript
// ❌ FALSCH: Annehmen, dass es funktioniert
const entries = gameService.getJournalEntries().value;

// ✅ RICHTIG: Result prüfen
const result = gameService.getJournalEntries();
if (result.ok) {
  const entries = result.value;
  // ... weiter arbeiten
} else {
  console.error(result.error.message);
}
```

---

## 🔒 API-Sicherheit & Deprecation

### ReadOnly-Wrapper

Sensible Services werden automatisch mit ReadOnly-Wrappern geschützt:

**NotificationCenter:**
- ✅ Erlaubt: `log()`, `debug()`, `info()`, `warn()`, `error()`, `withTraceId()`
- ❌ Blockiert: `setMinLevel()` und alle anderen Konfigurationsmethoden

### Deprecation-Mechanismus

Deprecated Tokens zeigen automatisch Warnungen bei der ersten Verwendung:

```typescript
// Beispiel-Warning:
// [fvtt_relationship_app_module] DEPRECATED: Token "oldLoggerToken" is deprecated.
// Reason: Use enhanced logger v2 with better performance
// Use "notificationCenterToken" instead.
// This token will be removed in version 2.0.0.
```

**Eigenschaften:**
- Einmalige Warnung pro Session (kein Spam)
- Klare Migrationshinweise
- Token bleibt funktional während Deprecation-Phase
- Mindestens 1 Major-Version Vorlaufzeit

---

## 📝 API Changelog

Dieses Changelog dokumentiert **nur Änderungen an der Public API** (`game.modules.get('fvtt_relationship_app_module').api`).

Für interne Modul-Änderungen siehe [CHANGELOG.md](../../CHANGELOG.md).

---

### [Unreleased]

#### Changed
- **NotificationCenter Token** - Exponiert nur noch Logging-Methoden; Channel-Mutationen (`addChannel`, `removeChannel`) führen zu Runtime-Hinweisen.
- **FoundrySettings Token** - Öffentliche API erlaubt ausschließlich `get()`, um Modul-Einstellungen read-only bereitzustellen.

---

### [API 1.0.0] - 2025-11-09

Initial Public API Release

#### Added

**Tokens (9 Services):**
- `notificationCenterToken` - Zentraler Notification-Router mit Channel-System
- `journalVisibilityServiceToken` - Journal visibility management (hide/show entries)
- `foundryGameToken` - Foundry Game API wrapper (version-agnostic)
- `foundryHooksToken` - Foundry Hooks API wrapper with lifecycle management
- `foundryDocumentToken` - Foundry Document API wrapper (flags, metadata)
- `foundryUIToken` - Foundry UI API wrapper (notifications, modals)
- `foundrySettingsToken` - Foundry Settings API wrapper (get/set/register)
- `i18nFacadeToken` - Internationalization service with Foundry + Local fallback
- `foundryJournalFacadeToken` - Journal operations facade

**API Functions:**
- `resolve<T>(token: ApiSafeToken<T>): T` - Resolve service from DI container
- `getAvailableTokens(): Map<symbol, TokenInfo>` - Discover available tokens
- `getMetrics(): MetricsSnapshot` - Performance metrics (when enabled)
- `getHealth(): HealthStatus` - Module health status

**API Properties:**
- `version: "1.0.0"` - API version (independent of module version)
- `tokens: ModuleApiTokens` - Well-known tokens collection

#### Features

- **Type-Safe:** Full TypeScript support with generics preserved
- **Result Pattern:** All services use `Result<T, E>` for error handling
- **Version-Agnostic:** Foundry services work across v13+ via Port-Adapter Pattern
- **Observability:** Built-in metrics and health checks
- **Token Discovery:** `getAvailableTokens()` for runtime exploration

#### Design Principles

- **Minimal API Surface:** Only 9 services exposed (not all 21+ internal services)
- **API-Safe Tokens:** Internal tokens cannot be used externally
- **No Breaking Changes:** API-safe tokens prevent accidental internal token leakage
- **Backward Compatible:** Safe to add new tokens without breaking existing code

#### Compatibility

- **Foundry VTT:** v13+ (tested with v13.291)
- **Module Version:** 0.10.0+
- **API Version:** 1.0.0

---

## Versioning Strategy

### API Version vs. Module Version

- **API Version** (`api.version`): Follows semantic versioning for API changes only
- **Module Version** (`module.json`): Follows semantic versioning for all changes

**Example:**
- Module v0.9.0 (internal refactoring) → API still 1.0.0
- Module v1.1.0 (new internal feature) → API still 1.0.0
- Module v1.2.0 (new exposed token) → API 1.1.0
- Module v2.0.0 (breaking API change) → API 2.0.0

### Breaking Changes Policy

**Pre-1.0.0 (Module):**
- Breaking API changes allowed without deprecation
- Aggressive refactoring encouraged

**Post-1.0.0 (Module):**
- Breaking API changes require deprecation period
- Minimum 1 major version notice (e.g., deprecated in 1.5.0, removed in 2.0.0)
- Migration guides provided for all breaking changes
- Deprecation warnings via `markAsDeprecated()`

### Deprecation Process

1. Mark token as deprecated using `markAsDeprecated()`
2. Console warning shown on first use (once per session)
3. Token remains functional for ≥1 major version
4. Migration guide provided in API Changelog
5. Token removed in next major version

---

## 🔗 Weitere Ressourcen

- [README.md](../../README.md) - Modul-Übersicht
- [Architektur-Übersicht](../architecture/overview.md) - Architektur-Details
- [GitHub Repository](https://github.com/Lewellyen/fvtt_relationship_app_module) - Source Code

---

## 💬 Support

Bei Fragen oder Problemen:
- Discord: `lewellyen`
- Email: forenadmin.tir@gmail.com

---

**Version**: 0.43.18
**API Version**: 1.0.0
**Letzte Aktualisierung**: 2025-01-XX
