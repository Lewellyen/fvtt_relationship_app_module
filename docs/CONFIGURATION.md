# Configuration Guide

Beziehungsnetzwerke für Foundry VTT - Konfigurationsanleitung

---

## Environment Variables (Build-Time)

Diese Variablen werden zur Build-Zeit gesetzt und beeinflussen das kompilierte Modul.

| Variable | Typ | Standard | Beschreibung |
|----------|-----|----------|--------------|
| `MODE` | string | `development` | Build-Modus: `development` oder `production` |
| `VITE_ENABLE_PERF_TRACKING` | boolean | `false` | Aktiviert Performance-Metriken-Sammlung |
| `VITE_ENABLE_METRICS_PERSISTENCE` | boolean | `false` | Sichert Metriken zwischen Sessions (PersistentMetricsCollector) |
| `VITE_METRICS_PERSISTENCE_KEY` | string | `fvtt_relationship_app_module.metrics` | LocalStorage-Key für persistente Metriken |

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

### Journal Entry Cache

Das Modul cached Journal-Einträge um teure Validierungen zu vermeiden.

**TTL (Time-To-Live):** 5 Sekunden (konfiguriert in `src/constants.ts`)

**Cache-Invalidierung:**

Der Cache wird automatisch invalidiert durch:
- TTL-Ablauf (nach 5 Sekunden)
- Manuelle Invalidierung via `invalidateCache()` (intern)

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

- **Architektur:** Siehe [ARCHITECTURE.md](../ARCHITECTURE.md)
- **API-Dokumentation:** Siehe [API.md](./API.md)
- **Testing:** Siehe [TESTING.md](./TESTING.md)

