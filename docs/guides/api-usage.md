# API-Verwendung

**Zweck:** Anleitung zur Verwendung der öffentlichen Modul-API für externe Module
**Zielgruppe:** Entwickler, die das Modul integrieren möchten
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Übersicht

Das Modul exponiert eine type-safe Public API unter `game.modules.get('fvtt_relationship_app_module').api`.

---

## Schnellstart

### API abrufen

```javascript
// Foundry Console oder eigenes Modul
const api = game.modules.get('fvtt_relationship_app_module')?.api;

if (!api) {
  console.error("Relationship App Module nicht aktiviert!");
  return;
}

console.log("API Version:", api.version);
```

### Service resolven

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;

// Logger verwenden
const logger = api.resolve(api.tokens.loggerToken);
logger.info("Hello from external module!");

// Journal Visibility Service
const journalService = api.resolve(api.tokens.journalVisibilityServiceToken);
const hiddenEntries = journalService.getHiddenJournalEntries();

if (hiddenEntries.ok) {
  console.log("Versteckte Journals:", hiddenEntries.value);
}
```

---

## API-Struktur

```typescript
interface ModuleApi {
  // API-Version
  version: string;

  // Service Resolution (type-safe)
  resolve: <T>(token: ApiSafeToken<T>) => T;

  // Verfügbare Tokens
  tokens: {
    loggerToken: InjectionToken<Logger>;
    journalVisibilityServiceToken: InjectionToken<JournalVisibilityService>;
    foundryGameToken: InjectionToken<FoundryGame>;
    notificationCenterToken: InjectionToken<NotificationCenter>;
    // ... weitere Tokens
  };

  // Token-Info abrufen
  getAvailableTokens: () => Map<symbol, TokenInfo>;

  // Metriken abrufen
  getMetrics: () => MetricsSnapshot;

  // Health-Status abrufen
  getHealth: () => HealthStatus;
}
```

---

## Verfügbare Tokens

### Core Services

| Token | Typ | Beschreibung |
|-------|-----|--------------|
| `loggerToken` | `Logger` | Logging mit Trace-Context |
| `notificationCenterToken` | `NotificationCenter` | UI/Console Notifications |
| `metricsCollectorToken` | `MetricsCollector` | Performance-Metriken |

### Business Services

| Token | Typ | Beschreibung |
|-------|-----|--------------|
| `journalVisibilityServiceToken` | `JournalVisibilityService` | Journal-Visibility-Logik |
| `foundryJournalFacadeToken` | `FoundryJournalFacade` | Journal-Operationen |
| `i18nFacadeToken` | `I18nFacadeService` | Übersetzungen |

### Foundry Services

| Token | Typ | Beschreibung |
|-------|-----|--------------|
| `foundryGameToken` | `FoundryGame` | Game-API Wrapper |
| `foundryHooksToken` | `FoundryHooks` | Hooks-API Wrapper |
| `foundrySettingsToken` | `FoundrySettings` | Settings-API Wrapper |

---

## Beispiele

### Journal-Einträge abrufen

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const gameService = api.resolve(api.tokens.foundryGameToken);

const journalsResult = gameService.getJournalEntries();

if (journalsResult.ok) {
  const journals = journalsResult.value;
  console.log(`Gefunden: ${journals.length} Journal-Einträge`);

  journals.forEach(journal => {
    console.log(`- ${journal.name} (${journal.id})`);
  });
} else {
  console.error("Fehler:", journalsResult.error);
}
```

### Versteckte Journals anzeigen

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const journalService = api.resolve(api.tokens.journalVisibilityServiceToken);

const hiddenResult = journalService.getHiddenJournalEntries();

if (hiddenResult.ok) {
  console.log("Versteckte Journals:", hiddenResult.value.map(j => j.name));
} else {
  console.error("Fehler:", hiddenResult.error);
}
```

### Notifications senden

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const notifications = api.resolve(api.tokens.notificationCenterToken);

// Info-Nachricht (nur Console)
notifications.info("Eine Information", {}, { channels: ["ConsoleChannel"] });

// Warning mit UI-Anzeige
notifications.warn("Eine Warnung", {}, { channels: ["ConsoleChannel", "UIChannel"] });
```

### Metriken abrufen

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const metrics = api.getMetrics();

console.table({
  "Container Resolutions": metrics.containerResolutions,
  "Resolution Errors": metrics.resolutionErrors,
  "Avg Resolution Time": `${metrics.avgResolutionTimeMs.toFixed(2)}ms`,
  "Cache Hit Rate": `${metrics.cacheHitRate.toFixed(1)}%`
});
```

### Health-Status prüfen

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const health = api.getHealth();

console.log("Status:", health.status);  // "healthy" | "degraded" | "unhealthy"

if (health.status !== "healthy") {
  console.log("Probleme:", health.checks);
}
```

---

## Result-Pattern

Alle Service-Methoden geben ein `Result<T, E>` zurück:

```typescript
type Result<T, E> =
  | { ok: true; value: T }   // Erfolg
  | { ok: false; error: E }; // Fehler
```

### Handling

```javascript
const result = service.doSomething();

// Variante 1: If-Check
if (result.ok) {
  console.log("Erfolg:", result.value);
} else {
  console.error("Fehler:", result.error);
}

// Variante 2: Early Return
if (!result.ok) {
  console.error("Fehler:", result.error);
  return;
}
// Ab hier: result.value ist verfügbar
console.log("Erfolg:", result.value);
```

---

## Best Practices

### 1. API-Verfügbarkeit prüfen

```javascript
function getApi() {
  const api = game.modules.get('fvtt_relationship_app_module')?.api;
  if (!api) {
    throw new Error("Relationship App Module nicht verfügbar");
  }
  return api;
}

// Verwendung
try {
  const api = getApi();
  // ...
} catch (e) {
  console.error(e.message);
}
```

### 2. Services cachen

```javascript
// Am Modul-Anfang
let journalService = null;

Hooks.on("ready", () => {
  const api = game.modules.get('fvtt_relationship_app_module')?.api;
  if (api) {
    journalService = api.resolve(api.tokens.journalVisibilityServiceToken);
  }
});

// Später verwenden
function getHiddenJournals() {
  if (!journalService) return [];
  const result = journalService.getHiddenJournalEntries();
  return result.ok ? result.value : [];
}
```

### 3. Fehler behandeln

```javascript
const result = service.doSomething();

if (!result.ok) {
  // Loggen für Debugging
  console.error("[MyModule] Service-Fehler:", result.error);

  // User-Feedback (optional)
  ui.notifications?.warn("Aktion fehlgeschlagen");

  return; // Oder Fallback-Wert
}

// Weiter mit result.value
```

---

## Typings für TypeScript

Wenn du TypeScript verwendest, kannst du die Typen importieren:

```typescript
// Hinweis: Nur wenn Types exportiert werden
// Ansonsten: type inference über api.resolve()

const api = game.modules.get('fvtt_relationship_app_module')?.api;
if (!api) return;

// TypeScript inferiert den Typ automatisch
const logger = api.resolve(api.tokens.loggerToken);
// logger ist vom Typ Logger

const journalService = api.resolve(api.tokens.journalVisibilityServiceToken);
// journalService ist vom Typ JournalVisibilityService
```

---

## Deprecation-Hinweise

Tokens und APIs können als deprecated markiert werden. Prüfe regelmäßig:

```javascript
const tokens = api.getAvailableTokens();

for (const [symbol, info] of tokens) {
  if (info.deprecated) {
    console.warn(`Token ${info.description} ist deprecated!`);
  }
}
```

---

## Weiterführende Dokumentation

- [API-Referenz](../reference/api-reference.md) - Vollständige API-Dokumentation
- [Token-Katalog](../reference/tokens.md) - Alle verfügbaren Tokens
- [Services](../reference/services.md) - Service-Dokumentation
- [Architektur](../architecture/overview.md) - Architektur-Übersicht

---

**Letzte Aktualisierung:** 2025-12-15
