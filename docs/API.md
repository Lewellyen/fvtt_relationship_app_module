# Public API Documentation

Die Public API des Beziehungsnetzwerke-Moduls erlaubt externen Scripts und Makros den Zugriff auf zentrale Services über Dependency Injection.

---

## 🔌 API-Zugriff

Das Modul exponiert seine API unter `game.modules.get(MODULE_ID).api`:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
```

---

## 📦 Verfügbare Methoden

### `resolve<T>(token: InjectionToken<T>): T`

Löst einen Service anhand seines Injection-Tokens auf.

**Parameter:**
- `token: InjectionToken<T>` - Der Injection-Token des gewünschten Services

**Rückgabe:**
- `T` - Die Service-Instanz

**Wirft:**
- `Error` - Wenn der Service nicht registriert ist oder nicht aufgelöst werden kann

---

### `getAvailableTokens(): Map<symbol, TokenInfo>`

Liefert alle verfügbaren Service-Tokens mit Metadaten.

**Rückgabe:**
- `Map<symbol, TokenInfo>` - Map von Token-Symbols zu ihren Informationen
  - `description: string` - Name des Tokens (z.B. "Logger")
  - `isRegistered: boolean` - Ob der Service registriert ist

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const tokens = api.getAvailableTokens();

console.log("Available services:");
for (const [token, info] of tokens.entries()) {
  console.log(`- ${info.description} (registered: ${info.isRegistered})`);
}
```

---

### `tokens: { ... }`

Direkt verfügbare Referenzen zu häufig genutzten Tokens.
**Kein Import nötig!**

**Verfügbare Tokens:**
- `loggerToken` - Logger-Service
- `journalVisibilityServiceToken` - Journal-Visibility-Service
- `foundryGameToken` - Foundry Game Abstraction
- `foundryHooksToken` - Foundry Hooks Abstraction
- `foundryDocumentToken` - Foundry Document Abstraction
- `foundryUIToken` - Foundry UI Abstraction

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// ✅ Einfach: Tokens direkt aus API nutzen (kein Import nötig!)
const logger = api.resolve(api.tokens.loggerToken);
const game = api.resolve(api.tokens.foundryGameToken);

logger.info('Hello from external script!');
```

---

## 🎯 Verfügbare Services

### Zwei Wege zum Zugriff auf Services

#### **Weg 1: Direkt über `api.tokens` (Empfohlen - kein Import nötig!)**

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// ✅ Tokens sind direkt in der API verfügbar
const logger = api.resolve(api.tokens.loggerToken);
const game = api.resolve(api.tokens.foundryGameToken);

logger.info('Hello from external script!');
```

#### **Weg 2: Tokens entdecken mit `getAvailableTokens()`**

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// Alle verfügbaren Services auflisten
const availableTokens = api.getAvailableTokens();
console.log("Available services:");
for (const [token, info] of availableTokens.entries()) {
  console.log(`- ${info.description} (registered: ${info.isRegistered})`);
  
  if (info.isRegistered) {
    const service = api.resolve(token);
    // Service nutzen...
  }
}
```

---

### Logger Service

**Zugriff (ohne Import):**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const logger = api.resolve(api.tokens.loggerToken);

logger.info('Hello from external script!');
logger.error('An error occurred', errorObject);
logger.debug('Debug information', { user: 'John', action: 'login' });
```

**Interface:**
```typescript
interface Logger {
  log(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  info(message: string, ...optionalParams: unknown[]): void;
  debug(message: string, ...optionalParams: unknown[]): void;
}
```

---

### Journal Visibility Service

**Import:**
```typescript
import { journalVisibilityServiceToken } from './modules/fvtt_relationship_app_module/dist/tokens/tokenindex.js';
```

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const journalService = api.resolve(journalVisibilityServiceToken);

// Hole alle versteckten Journal-Einträge
const hiddenJournals = journalService.getHiddenJournalEntries();
if (hiddenJournals.ok) {
  console.log(`Found ${hiddenJournals.value.length} hidden journals`);
}

// Verarbeite Journal-Directory HTML
const htmlElement = document.querySelector('.journal-directory');
journalService.processJournalDirectory(htmlElement);
```

**Interface:**
```typescript
interface JournalVisibilityService {
  getHiddenJournalEntries(): Result<FoundryJournalEntry[], string>;
  processJournalDirectory(htmlElement: HTMLElement): void;
}
```

---

### Foundry Abstraction Services

Die folgenden Services bieten versionssichere Abstraktionen für Foundry VTT APIs.

**Alle nutzen `api.tokens` - kein Import nötig!**

#### FoundryGame Service

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const foundryGame = api.resolve(api.tokens.foundryGameToken);

// Alle Journal-Einträge holen
const journals = foundryGame.getJournalEntries();
if (journals.ok) {
  journals.value.forEach(j => console.log(j.name));
}

// Spezifischen Journal-Eintrag holen
const journal = foundryGame.getJournalEntryById('abc123');
if (journal.ok && journal.value) {
  console.log(journal.value.name);
}
```

#### FoundryHooks Service

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const foundryHooks = api.resolve(api.tokens.foundryHooksToken);

// Hook registrieren
const hookResult = foundryHooks.on('renderJournalDirectory', (app, html) => {
  console.log('Journal directory rendered!');
});

if (!hookResult.ok) {
  console.error('Failed to register hook:', hookResult.error);
}
```

#### FoundryDocument Service

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const foundryDocument = api.resolve(api.tokens.foundryDocumentToken);

// Flag lesen
const journal = game.journal.get('abc123');
const flagResult = foundryDocument.getFlag(journal, 'my-module', 'my-flag');
if (flagResult.ok) {
  console.log('Flag value:', flagResult.value);
}

// Flag setzen
const setResult = await foundryDocument.setFlag(journal, 'my-module', 'my-flag', true);
if (!setResult.ok) {
  console.error('Failed to set flag:', setResult.error);
}
```

#### FoundryUI Service

**Verwendung:**
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const foundryUI = api.resolve(api.tokens.foundryUIToken);

// Element aus UI entfernen
const container = document.querySelector('.journal-directory');
const removeResult = foundryUI.removeJournalElement('journal-id', 'Journal Name', container);
if (removeResult.ok) {
  console.log('Element removed successfully');
}

// Element finden
const elementResult = foundryUI.findElement(container, '.journal-entry[data-id="abc123"]');
if (elementResult.ok && elementResult.value) {
  console.log('Element found:', elementResult.value);
}
```

---

## 🔄 Result Pattern

Alle API-Methoden, die fehlschlagen können, geben einen `Result<T, E>` zurück:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Verwendung mit Type Guards

```typescript
const result = foundryGame.getJournalEntries();

if (result.ok) {
  // TypeScript weiß: result.value ist FoundryJournalEntry[]
  const journals = result.value;
  journals.forEach(j => console.log(j.name));
} else {
  // TypeScript weiß: result.error ist string
  console.error('Error:', result.error);
}
```

### Pattern Matching

```typescript
import { match } from './modules/fvtt_relationship_app_module/dist/utils/result.js';

const result = foundryGame.getJournalEntryById('abc123');

match(result, {
  onOk: (journal) => {
    if (journal) {
      console.log('Found:', journal.name);
    } else {
      console.log('Not found');
    }
  },
  onErr: (error) => {
    console.error('Error:', error);
  }
});
```

---

## 🛠️ Erweiterte Nutzung

### Token Discovery - Alle Services auflisten

```typescript
Hooks.on('ready', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;
  
  console.log("=== Available Services ===");
  const tokens = api.getAvailableTokens();
  
  for (const [token, info] of tokens.entries()) {
    console.log(`✓ ${info.description}`);
    console.log(`  - Registered: ${info.isRegistered}`);
    console.log(`  - Token: ${String(token)}`);
  }
});
```

### Custom Token erstellen

Falls Sie eigene Services registrieren möchten (fortgeschrittene Nutzung):

```typescript
import { createInjectionToken } from './modules/fvtt_relationship_app_module/dist/di_infrastructure/tokenutilities.js';

interface MyCustomService {
  doSomething(): void;
}

const myServiceToken = createInjectionToken<MyCustomService>('MyCustomService');

// HINWEIS: Direkte Container-Manipulation ist nicht über die Public API möglich.
// Die API ist bewusst auf resolve() und getAvailableTokens() beschränkt, 
// um Stabilität zu gewährleisten.
```

---

## ⚠️ Wichtige Hinweise

### 1. API-Verfügbarkeit

Die API ist erst nach dem `init`-Hook von Foundry verfügbar:

```typescript
Hooks.on('init', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;
  // API ist jetzt verfügbar
});
```

### 2. Singleton Services

Die meisten Services sind Singletons. Mehrfache `resolve()`-Aufrufe geben **dieselbe Instanz** zurück:

```typescript
const logger1 = api.resolve(loggerToken);
const logger2 = api.resolve(loggerToken);
// logger1 === logger2 (true)
```

### 3. Versionssicherheit

Die Foundry-Abstraktions-Services (`FoundryGame`, `FoundryHooks`, etc.) passen sich automatisch an die laufende Foundry-Version an. Sie müssen sich nicht um Versionsunterschiede kümmern.

---

## 📚 Weitere Ressourcen

- **Architektur:** Siehe [BOOTFLOW.md](./BOOTFLOW.md)
- **Entwickler-Dokumentation:** Siehe [README.md](../README.md)
- **JSDoc-Konventionen:** Siehe [jsdoc-styleguide.md](./jsdoc-styleguide.md)

---

## 🔧 Beispiel: Komplettes Makro

### Beispiel 1: Service Discovery

```typescript
// Makro: Alle verfügbaren Services auflisten
Hooks.on('ready', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;
  const logger = api.resolve(api.tokens.loggerToken);
  
  logger.info('=== Module Services ===');
  
  const tokens = api.getAvailableTokens();
  for (const [token, info] of tokens.entries()) {
    logger.info(`✓ ${info.description} (${info.isRegistered ? 'ready' : 'not registered'})`);
  }
});
```

### Beispiel 2: Versteckte Journals analysieren

```typescript
// Makro: Versteckte Journals finden und Details loggen
Hooks.on('ready', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;
  
  // ✅ Kein Import nötig - Tokens direkt aus API
  const logger = api.resolve(api.tokens.loggerToken);
  const journalService = api.resolve(api.tokens.journalVisibilityServiceToken);
  
  logger.info('Starting hidden journal analysis');
  
  const hiddenResult = journalService.getHiddenJournalEntries();
  
  if (hiddenResult.ok) {
    const count = hiddenResult.value.length;
    logger.info(`Found ${count} hidden journal(s)`);
    
    hiddenResult.value.forEach(journal => {
      logger.debug(`Hidden journal: ${journal.name} (ID: ${journal.id})`);
    });
  } else {
    logger.error('Failed to get hidden journals:', hiddenResult.error);
  }
});
```

### Beispiel 3: Foundry Hooks mit Abstraktion

```typescript
// Makro: Hook mit versionssicherer Abstraktion registrieren
Hooks.on('init', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;
  const foundryHooks = api.resolve(api.tokens.foundryHooksToken);
  const logger = api.resolve(api.tokens.loggerToken);
  
  const hookResult = foundryHooks.on('updateActor', (actor, changes, options, userId) => {
    logger.info(`Actor updated: ${actor.name}`, { changes, userId });
  });
  
  if (!hookResult.ok) {
    logger.error('Failed to register hook:', hookResult.error);
  }
});
```

---

## 🆘 Support

Bei Fragen oder Problemen:
- **Email:** forenadmin.tir@gmail.com
- **Discord:** lewellyen

---

**Letzte Aktualisierung:** November 2025  
**Version:** 0.0.12


