# API-Dokumentation

Beziehungsnetzwerke für Foundry VTT - Öffentliche API

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

### Logger

Strukturiertes Logging mit verschiedenen Log-Levels.

```typescript
interface Logger {
  log(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  info(message: string, ...optionalParams: unknown[]): void;
  debug(message: string, ...optionalParams: unknown[]): void;
}
```

**Beispiel**:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const notifications = api.resolve(api.tokens.notificationCenterToken);

notifications.info('Modul-Initialisierung gestartet');
notifications.debug('Debug-Informationen', { userId: '123', context: 'test' });
notifications.error('Fehler aufgetreten', new Error('Something went wrong'));
```

---

### FoundryGame

Zugriff auf Foundry Game-API (versionssicher über Port-Adapter).

```typescript
interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError>;
}
```

**Beispiel**:

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

**Beispiel - Hook registrieren und mit ID deregistrieren**:

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

**Beispiel - One-time Hook**:

```typescript
const hooksService = api.resolve(api.tokens.foundryHooksToken);

// Register one-time hook (automatically unregisters after first execution)
hooksService.once('ready', () => {
  console.log('Fired only once!');
});
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

**Beispiel**:

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

**Beispiel - Log-Level ändern**:

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

**UI-Integration**:

Das Modul bietet eine Log-Level-Einstellung in den Foundry-Moduleinstellungen:

1. Einstellungen → Module-Konfiguration
2. "Relationship App" → "Log Level"
3. Wähle: DEBUG / INFO / WARN / ERROR
4. Änderungen werden **sofort wirksam** (kein Reload nötig)

**Verfügbare Scopes** (v13+):
- `world`: Für alle Nutzer in der Welt gültig
- `client`: Browser-/gerätespezifisch
- `user`: Nutzerspezifisch innerhalb einer Welt

---

### JournalVisibilityService

Verwaltung von versteckten Journal-Einträgen.

```typescript
interface JournalVisibilityService {
  getHiddenJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
  processJournalDirectory(htmlElement: HTMLElement): void;
}
```

**Beispiel**:

```typescript
const visibilityService = api.resolve(api.tokens.journalVisibilityServiceToken);

const hiddenResult = visibilityService.getHiddenJournalEntries();
if (hiddenResult.ok) {
  console.log(`${hiddenResult.value.length} versteckte Journal-Einträge gefunden`);
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

**Beispiel - Übersetzung abrufen**:

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

// Prüfen ob Key existiert
const hasResult = i18n.has("myModule.greeting");
if (hasResult.ok && hasResult.value) {
  console.log("Übersetzung vorhanden");
}
```

**Fallback-Strategie**:
1. Foundry i18n System (primär)
2. Lokales i18n System (fallback)
3. Key selbst (last resort)

---

### FoundryJournalFacade

Facade für generische Journal-Operations.

```typescript
interface FoundryJournalFacade {
  getHiddenJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
  // Weitere Methoden verfügbar via FoundryGame, FoundryDocument, FoundryUI
}
```

**Beispiel - Versteckte Journals abrufen**:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const journalFacade = api.resolve(api.tokens.foundryJournalFacadeToken);

const hiddenResult = journalFacade.getHiddenJournalEntries();
if (hiddenResult.ok) {
  console.log(`Gefunden: ${hiddenResult.value.length} versteckte Journals`);
  
  hiddenResult.value.forEach(journal => {
    console.log(`- ${journal.name} (ID: ${journal.id})`);
  });
} else {
  console.error(`Fehler: ${hiddenResult.error.message}`);
}
```

**Use Case**:
- Externes Modul möchte auf versteckte Journals zugreifen
- Zentrale Facade statt direkter Foundry-API-Zugriff
- Result-Pattern für sichere Fehlerbehandlung

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

// Beispiel 2: Mit match-Utility
import { match } from '@/utils/result';

match(result, {
  onOk: (entries) => console.log(`Gefunden: ${entries.length}`),
  onErr: (error) => console.error(`Fehler: ${error.message}`)
});

// Beispiel 3: Mit unwrapOr
import { unwrapOr } from '@/utils/result';

const entries = unwrapOr(result, []); // Fallback auf leeres Array
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

### Beispiel 3: Hook-Registration in anderem Modul

```typescript
Hooks.once('ready', () => {
  const api = game.modules.get('fvtt_relationship_app_module')?.api;
  if (!api) return;

  const hooksService = api.resolve(api.tokens.foundryHooksToken);
  const notifications = api.resolve(api.tokens.notificationCenterToken);

  const hookResult = hooksService.on('createJournalEntry', (journal, options, userId) => {
    notifications.info('Neuer Journal-Eintrag erstellt', {
      name: journal.name,
      id: journal.id,
      userId
    });
  });

  if (!hookResult.ok) {
    console.error('Hook-Registration fehlgeschlagen');
  }
});
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

### Versionssicherheit

Die API ist versionssicher durch das Port-Adapter-Pattern. Services funktionieren auf allen unterstützten Foundry-Versionen (v13+).

---

## 🛡️ Error-Handling Best Practices

### 1. Immer Result-Pattern verwenden

```typescript
// ❌ FALSCH: Exceptions werfen/fangen
try {
  const notifications = api.resolve(api.tokens.notificationCenterToken);
} catch (error) {
  // resolve() wirft nur bei API-Boundary-Violations
}

// ✅ RICHTIG: resolveWithError() für Result-Pattern
const notificationResult = api.resolveWithError(api.tokens.notificationCenterToken);
if (notificationResult.ok) {
  const notifications = notificationResult.value;
  notifications.info('Success');
} else {
  console.error('Failed to resolve notification center:', notificationResult.error);
}
```

### 2. Fehler-Details loggen

```typescript
const result = gameService.getJournalEntries();
if (!result.ok) {
  // Logge vollständige Error-Details für Debugging
  console.error('Error details:', {
    code: result.error.code,
    message: result.error.message,
    details: result.error.details,
    stack: result.error.stack, // Falls vorhanden
    timestamp: result.error.timestamp, // Falls vorhanden
  });
}
```

### 3. Graceful Degradation

```typescript
const api = game.modules.get('fvtt_relationship_app_module')?.api;
if (!api) {
  console.warn('Relationship App nicht verfügbar - verwende Fallback');
  // Fallback-Logik
  return;
}

const notificationResult = api.resolveWithError(api.tokens.notificationCenterToken);
const notifications = notificationResult.ok ? notificationResult.value : {
  info: console.log,
  error: console.error,
  // ... minimal logger fallback
};
```

### 4. Async Error-Handling

```typescript
const settingsService = api.resolve(api.tokens.foundrySettingsToken);

// Set-Operation ist async - await und Result prüfen
const setResult = await settingsService.set('my-module', 'myKey', 'myValue');
if (!setResult.ok) {
  console.error('Setting konnte nicht gespeichert werden:', setResult.error.message);
  ui.notifications.error('Einstellungen konnten nicht gespeichert werden');
}
```

### 5. Container Error Codes

Die wichtigsten Error Codes:

| Code | Bedeutung | Handling |
|------|-----------|----------|
| `TokenNotRegistered` | Service nicht registriert | Modul-Abhängigkeiten prüfen |
| `FactoryFailed` | Service-Erstellung fehlgeschlagen | Logs prüfen, Foundry-Version checken |
| `InvalidOperation` | Ungültige Operation | API-Dokumentation prüfen |
| `Disposed` | Container wurde disposed | Modul neu laden |

### 6. Foundry Error Codes

| Code | Bedeutung | Handling |
|------|-----------|----------|
| `API_NOT_AVAILABLE` | Foundry API nicht verfügbar | Zu früh aufgerufen (vor init Hook) |
| `VALIDATION_FAILED` | Eingabe-Validierung fehlgeschlagen | Daten prüfen |
| `OPERATION_FAILED` | Foundry-Operation fehlgeschlagen | Foundry-Logs prüfen |
| `PORT_SELECTION_FAILED` | Keine kompatible Version | Foundry-Version prüfen |

---

## 🔒 API-Sicherheit & Deprecation

### ReadOnly-Wrapper

Sensible Services werden automatisch mit ReadOnly-Wrappern geschützt:

**Logger:**
- ✅ Erlaubt: `log()`, `debug()`, `info()`, `warn()`, `error()`, `withTraceId()`
- ❌ Blockiert: `setMinLevel()` und alle anderen Konfigurationsmethoden

**I18n:**
- ✅ Erlaubt: `translate()`, `format()`, `has()`
- ❌ Blockiert: Alle internen Properties und nicht-öffentliche Methoden

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const notifications = api.resolve(api.tokens.notificationCenterToken);

notifications.info("OK");           // ✅ Funktioniert
notifications.setMinLevel(0);       // ❌ Error: "Property setMinLevel is not accessible"
```

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

**API-Changelog:**
- Alle API-Änderungen dokumentiert in [API-CHANGELOG.md](./API-CHANGELOG.md)
- Separates Changelog für Public API (unabhängig von internen Änderungen)
- Kategorien: Added, Changed, Deprecated, Removed, Breaking Changes

---

## 🔗 Weitere Ressourcen

- [README.md](../README.md) - Modul-Übersicht
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architektur-Details
- [API-CHANGELOG.md](./API-CHANGELOG.md) - API-Änderungshistorie
- [GitHub Repository](#) - Source Code

---

## 💬 Support

Bei Fragen oder Problemen:
- Discord: `lewellyen`
- Email: forenadmin.tir@gmail.com

---

**Version**: 0.10.0  
**Letzte Aktualisierung**: 2025-11-09
