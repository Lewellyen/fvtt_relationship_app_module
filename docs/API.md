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

// Services über Tokens auflösen
const logger = api.resolve(api.tokens.loggerToken);
logger.info('Hello from external module!');
```

### TypeScript-Unterstützung

Für TypeScript-Projekte steht vollständige Typisierung zur Verfügung:

```typescript
import type { ModuleApi } from '@/core/module-api';

declare global {
  interface Game {
    modules: Map<string, Module & { api?: ModuleApi }>;
  }
}

// Jetzt mit voller Type-Safety
const api = game.modules.get('fvtt_relationship_app_module')?.api;
const logger = api?.resolve(api.tokens.loggerToken);
```

---

## 🔑 Verfügbare Tokens

Die API stellt folgende Injection-Tokens bereit:

| Token | Service-Typ | Beschreibung |
|-------|-------------|--------------|
| `loggerToken` | `Logger` | Logging-Service für strukturierte Logs |
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
const logger = api.resolve(api.tokens.loggerToken);

logger.info('Modul-Initialisierung gestartet');
logger.debug('Debug-Informationen', { userId: '123', context: 'test' });
logger.error('Fehler aufgetreten', new Error('Something went wrong'));
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
const logger = api.resolve(api.tokens.loggerToken);

logger.info('Makro gestartet', { user: game.user.name });

for (const actor of game.actors) {
  logger.debug('Actor gefunden', { 
    name: actor.name, 
    type: actor.type 
  });
}

logger.info('Makro abgeschlossen', { count: game.actors.size });
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
  const logger = api.resolve(api.tokens.loggerToken);

  const hookResult = hooksService.on('createJournalEntry', (journal, options, userId) => {
    logger.info('Neuer Journal-Eintrag erstellt', {
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

## 🔗 Weitere Ressourcen

- [README.md](../README.md) - Modul-Übersicht
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architektur-Details
- [GitHub Repository](#) - Source Code

---

## 💬 Support

Bei Fragen oder Problemen:
- Discord: `lewellyen`
- Email: forenadmin.tir@gmail.com

---

**Version**: 0.0.14  
**Letzte Aktualisierung**: 2025-01-03
