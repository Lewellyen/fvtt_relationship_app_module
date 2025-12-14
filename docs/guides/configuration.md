# Configuration Guide

Beziehungsnetzwerke für Foundry VTT - Konfigurationsanleitung

---

## Environment Variables (Build-Time)

Diese Variablen werden zur Build-Zeit gesetzt und beeinflussen das kompilierte Modul.

| Variable | Typ | Standard | Beschreibung |
|----------|-----|----------|--------------|
| `MODE` | string | `development` | Build-Modus: `development` oder `production` |
| `VITE_ENABLE_PERF_TRACKING` | boolean | `false` | Aktiviert Performance-Metriken-Sammlung |
| `VITE_PERF_SAMPLING_RATE` | number | `0.01` (prod) / `1.0` (dev) | Samplingquote für Performance-Tracking |
| `VITE_ENABLE_METRICS_PERSISTENCE` | boolean | `false` | Sichert Metriken zwischen Sessions (PersistentMetricsCollector) |
| `VITE_METRICS_PERSISTENCE_KEY` | string | `fvtt_relationship_app_module.metrics` | LocalStorage-Key für persistente Metriken |
| `VITE_CACHE_ENABLED` | boolean | `true` | Aktiviert/Deaktiviert den globalen CacheService |
| `VITE_CACHE_TTL_MS` | number | `5000` | Standard-TTL (Millisekunden) für Cache-Einträge |
| `VITE_CACHE_MAX_ENTRIES` | number | — | Optionales LRU-Limit (leer = unbegrenzt) |
| `VITE_NOTIFICATION_QUEUE_MIN_SIZE` | number | `10` | Minimum Queue-Größe für UI-Notifications (Build-Time, fest verdrahtet) |
| `VITE_NOTIFICATION_QUEUE_MAX_SIZE` | number | `1000` | Maximum Queue-Größe für UI-Notifications (Build-Time, fest verdrahtet) |
| `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE` | number | `50` | Standard Queue-Größe für UI-Notifications (Build-Time, Runtime überschreibbar via Setting) |

### Nutzung

**Entwicklung mit Performance-Tracking:**

```bash
VITE_ENABLE_PERF_TRACKING=true npm run dev
```

**Production Build:**

```bash
npm run build
```

**Development Build:**

```bash
npm run build:dev
```

---

## Runtime Configuration

Diese Einstellungen können zur Laufzeit in Foundry VTT geändert werden.

### Log Levels

Zugriff über Foundry's Modul-Einstellungen:

```javascript
game.settings.set('fvtt_relationship_app_module', 'logLevel', 1);
```

**Verfügbare Log Levels:**

| Level | Wert | Beschreibung |
|-------|------|--------------|
| DEBUG | 0 | Alle Nachrichten inkl. Debug-Informationen |
| INFO | 1 | Informationsnachrichten und höher (Standard) |
| WARN | 2 | Warnungen und Fehler |
| ERROR | 3 | Nur Fehler |

**Beispiel:**

```javascript
// Setze Log-Level auf DEBUG für detailliertes Logging
game.settings.set('fvtt_relationship_app_module', 'logLevel', 0);

// Setze Log-Level auf ERROR für minimales Logging
game.settings.set('fvtt_relationship_app_module', 'logLevel', 3);
```

---

## Performance Metrics

Performance-Metriken sind verfügbar wenn `VITE_ENABLE_PERF_TRACKING=true` gesetzt ist.

### Persistente Metriken

- Aktivierung: `VITE_ENABLE_METRICS_PERSISTENCE=true` (optional)
- Storage-Key: `VITE_METRICS_PERSISTENCE_KEY` (Default siehe Tabelle)
- Persistenz nutzt `LocalStorage`; in Sandbox-/Testszenarien ohne Storage fällt der Collector automatisch auf In-Memory zurück.

**Zurücksetzen:**
LocalStorage-Eintrag (`VITE_METRICS_PERSISTENCE_KEY`) löschen oder Flag wieder deaktivieren und Foundry neu laden.

### Zugriff auf Metriken

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const metrics = api.getMetrics();

// Anzeige in Tabellen-Format
console.table(metrics);
```

### Verfügbare Metriken

| Metrik | Typ | Beschreibung |
|--------|-----|--------------|
| `containerResolutions` | number | Anzahl der Container-Service-Auflösungen |
| `resolutionErrors` | number | Anzahl fehlgeschlagener Auflösungen |
| `avgResolutionTimeMs` | number | Durchschnittliche Auflösungszeit in ms |
| `portSelections` | object | Anzahl Port-Selektionen pro Foundry-Version |
| `cacheHitRate` | number | Cache-Trefferquote in Prozent (0-100) |

**Beispiel:**

```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const metrics = api.getMetrics();

console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
console.log(`Avg Resolution Time: ${metrics.avgResolutionTimeMs.toFixed(2)}ms`);
```

---

## Cache Configuration

### CacheService (Journal Visibility & künftige Clients)

- **Aktivierung:** `VITE_CACHE_ENABLED=true|false` (Default: `true`)
- **TTL:** `VITE_CACHE_TTL_MS` (Millisekunden, Default 5000). Werte <=0 deaktivieren TTL (Cache lebt bis Invalidation).
- **Max Entries:** `VITE_CACHE_MAX_ENTRIES` (optional). Bei Überschreitung wird das älteste Element per LRU entfernt.
- **Invalidierung:** Automatisch über den `JournalCacheInvalidationHook`, der auf Foundry `create/update/deleteJournalEntry` reagiert. Zusätzlich läuft TTL aus und Services können `invalidateWhere()` nutzen.
- **Monitoring:** Cache-Hit/Miss-Rate ist Teil der MetricsCollector-Snapshots (`getMetrics()` API).

## Runtime Config Layer (Overrides)

- **Build-Time Defaults:** `ENV` (`src/config/environment.ts`) liefert Standardwerte für Log-Level, Performance (Tracking + Sampling Rate), Observability-Flags (Metrics-Persistenz) sowie Cache (Enabled, TTL, Max Entries).
- **RuntimeConfigService:** (`src/core/runtime-config/runtime-config.service.ts`) speichert die Defaults und stellt `get/onChange` bereit.
- **Foundry Settings Bridge:** Der `ModuleSettingsRegistrar` mappt Settings wie `logLevel` über `runtimeConfigBindings` auf den Service und liest beim `init`-Hook sofort nach (`foundrySettings.get`) → Defaults werden überschrieben, sobald der Foundry-Wert existiert.
- **Live-Updates:** Änderungen im Foundry-UI triggern `config.onChange`, welches zuerst `RuntimeConfigService.setFromFoundry` aufruft und danach den ursprünglichen Callback.
- **Consumer:** Services (z. B. `ConsoleLoggerService`) hängen sich an `runtimeConfig.onChange()` und reagieren sofort.

**Samplingrate live anpassen:**

```javascript
// Reduziert Performance-Overhead auf 25 %
game.settings.set('fvtt_relationship_app_module', 'performanceSamplingRate', 0.25);
```

---

## Notification Queue Configuration

### Notification Queue Max Size

Die Notification Queue sammelt UI-Notifications, die vor der Verfügbarkeit von Foundry UI gesendet werden, und gibt sie automatisch aus, sobald der UIChannel verfügbar ist.

- **Setting-Key:** `notificationQueueMaxSize`
- **Default:** `50` (konfigurierbar via `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE`)
- **Min:** `10` (fest verdrahtet via `VITE_NOTIFICATION_QUEUE_MIN_SIZE`, Build-Time)
- **Max:** `1000` (fest verdrahtet via `VITE_NOTIFICATION_QUEUE_MAX_SIZE`, Build-Time)
- **Scope:** `world`

**Beispiel:**

```javascript
// Erhöhe Queue-Größe auf 100
game.settings.set('fvtt_relationship_app_module', 'notificationQueueMaxSize', 100);

// Reduziere Queue-Größe auf 25
game.settings.set('fvtt_relationship_app_module', 'notificationQueueMaxSize', 25);
```

**Hinweis:** Wenn die Queue voll ist, werden die ältesten Notifications automatisch entfernt, um Platz für neue zu schaffen.

Weitere Details, einschließlich der zusätzlichen ENV-Felder (`isDevelopment`, `isProduction`, `logLevel`, `enablePerformanceTracking`, `performanceSamplingRate`, `enableMetricsPersistence`, `metricsPersistenceKey`, `enableCacheService`, `cacheDefaultTtlMs`, `cacheMaxEntries`), sind in `docs/runtime-config-layer.md` beschrieben.

### Foundry-Einstellungen, die ENV-Werte übersteuern

- **Log Level** (`MODULE.SETTINGS.logLevel.*`): Steuert den Logger zur Laufzeit (bereits etabliert).
- **Cache aktivieren** (`cacheEnabled`): Schaltet den globalen CacheService ein/aus (Default: `true`).
- **Cache TTL (ms)** (`cacheTtlMs`): Standard-TTL für Cache-Einträge. `0` = TTL deaktiviert.
- **Cache Max Entries** (`cacheMaxEntries`): Optionales LRU-Limit. `0` = unbegrenzt.
- **Performance Tracking** (`performanceTrackingEnabled`): Aktiviert/Deaktiviert die interne Instrumentierung.
- **Performance Sampling Rate** (`performanceSamplingRate`): Wert zwischen 0 und 1 für die Samplingquote.
- **Persist Metrics** (`metricsPersistenceEnabled`): Schreibt Metriken dauerhaft nach LocalStorage.
- **Metrics Storage Key** (`metricsPersistenceKey`): LocalStorage-Key für persistente Metriken.

Alle Einstellungen synchronisieren automatisch den `RuntimeConfigService` und wirken unmittelbar auf abhängige Services (CacheService, MetricsCollector, Logger, …).

---

## Debug-Modus

Im Development-Modus (`MODE=development`) sind aktiviert:

- ✅ Ausführliches Console-Logging
- ✅ Performance-Marks in Browser DevTools
- ✅ Zusätzliche Validierungen
- ✅ Source Maps für Debugging

Im Production-Modus (`MODE=production`):

- ✅ Optimierter, minifizierter Code
- ✅ Reduziertes Logging (nur INFO und höher)
- ❌ Keine Source Maps
- ✅ Kleinerer Bundle

---

## Troubleshooting

### Modul lädt nicht

1. Öffne Browser Console (F12)
2. Suche nach Fehler-Nachrichten mit Prefix "Foundry VTT Relationship App Module |"
3. Prüfe Foundry-Version: Mindestens v13 erforderlich

### Performance-Probleme

1. Aktiviere Performance-Tracking:
   ```bash
   VITE_ENABLE_PERF_TRACKING=true npm run build
   ```

2. Prüfe Metriken in Foundry:
   ```javascript
   const metrics = game.modules.get('fvtt_relationship_app_module').api.getMetrics();
   console.table(metrics);
   ```

3. Wenn `avgResolutionTimeMs > 10ms`: Kontaktiere Entwickler

### Logging aktivieren

```javascript
// Temporär Debug-Logging aktivieren
game.settings.set('fvtt_relationship_app_module', 'logLevel', 0);

// Nach Debugging: Zurück zu INFO
game.settings.set('fvtt_relationship_app_module', 'logLevel', 1);
```

---

## Weitere Informationen

- **Architektur:** Siehe [Architektur-Übersicht](../architecture/overview.md)
- **API-Dokumentation:** Siehe [API-Referenz](../reference/api-reference.md)
- **Testing:** Siehe [Testing](../development/testing.md)

