# ADR-0006: Observability Strategy (Logging, Metrics, Error Tracking)

**Status**: Accepted  
**Datum**: 2025-11-06 (Updated: 2025-11-09)  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Production Debugging, Performance Monitoring, Error Diagnosis

---

## Kontext und Problemstellung

Foundry VTT Module laufen in User-Browsern (Client-Side):
- **Kein Server-Side Access**: Logs nur in Browser-Konsole
- **User-Fehlerberichte**: "Es funktioniert nicht" → keine Details
- **Performance-Probleme**: "Es ist langsam" → keine Metriken
- **Version-Vielfalt**: Verschiedene Foundry-Versionen, Browser, Setups

**Anforderungen an Observability**:
1. **Logging**: Strukturierte, filterbare Logs für Debugging
2. **Metrics**: Performance-Tracking (DI-Resolution, Port-Selection, etc.)
3. **Error Tracking**: Kontext-reiche Fehler für Diagnose
4. **Production-Safety**: Keine sensiblen Daten, minimale Performance-Impact
5. **User-Friendly**: Logs helfen bei Support-Anfragen

## Betrachtete Optionen

### Option 1: Nur `console.log()` / `console.error()`

```typescript
console.log("User created", userId);
console.error("Failed to create user", error);
```

**Nachteile**:
- ❌ Keine Struktur (schwer filterbar)
- ❌ Keine Severity-Levels
- ❌ Keine Kontext-Daten (z.B. Module-Version, Foundry-Version)

### Option 2: Custom Logger mit Structured Logging

```typescript
logger.info("User created", { userId, timestamp: Date.now() });
logger.error("Failed to create user", { userId, error, stack: error.stack });
```

**Vorteile**:
- ✅ Strukturierte Daten → Filterbar
- ✅ Severity-Levels (debug, info, warn, error)
- ✅ Kontext-Daten automatisch ergänzbar

### Option 3: External Service (Sentry, LogRocket, etc.)

**Nachteile**:
- ❌ **Privacy**: User-Daten werden an Dritte gesendet
- ❌ **Kosten**: Sentry/LogRocket nicht kostenlos
- ❌ **Overhead**: Network-Requests, Bundle Size

## Entscheidung

**Gewählt: Option 2 - Custom Logger + Metrics + Error Sanitization**

### Komponenten

**1. Structured Logger** (`src/services/logger.ts`)

```typescript
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleLoggerService implements Logger {
  private moduleId: string;
  
  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[${this.moduleId}] ${message}`, context || {});
  }
  
  error(message: string, context?: Record<string, unknown>): void {
    // WICHTIG: console.error für Stack Traces
    console.error(`[${this.moduleId}] ${message}`, context || {});
  }
}
```

**Best Practices**:
- ✅ **Prefix**: `[module-id]` für Filterbarkeit in Browser-Console
- ✅ **Severity**: `console.info`, `console.warn`, `console.error` (nicht nur `.log`)
- ✅ **Context**: Immer als letzter Parameter → Chrome DevTools formatiert schön

**2. MetricsCollector** (`src/observability/metrics-collector.ts`)

```typescript
export class MetricsCollector {
  private resolutionTimes = new Float64Array(100); // Circular buffer
  private portSelectionFailures = 0;
  
  recordResolution(tokenId: string, durationMs: number): void {
    if (!ENV.VITE_ENABLE_PERF_TRACKING) return; // Feature-Flag
    
    this.resolutionTimes[this.currentIndex] = durationMs;
    this.currentIndex = (this.currentIndex + 1) % this.resolutionTimes.length;
  }
  
  getSnapshot(): MetricsSnapshot {
    return {
      resolutions: this.resolutionTimes.length,
      avgResolutionTime: this.calculateAverage(this.resolutionTimes),
      portSelectionFailures: this.portSelectionFailures
    };
  }
}
```

**Best Practices**:
- ✅ **Feature-Flag**: `VITE_ENABLE_PERF_TRACKING` → Deaktivierbar in Production
- ✅ **Circular Buffer**: Fixe Größe (100) → kein Memory-Leak
- ✅ **Float64Array**: Native Array → schneller als `number[]`
- ✅ **Public API**: `getMetrics()` für Debugging

**3. Error Sanitization** (`src/observability/error-sanitizer.ts`)

```typescript
export function sanitizeError(error: unknown): SanitizedError {
  if (!ENV.isProduction) {
    // Development: Volle Details
    return {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      raw: error
    };
  }
  
  // Production: Sanitized
  return {
    message: error instanceof Error ? error.message : "An error occurred",
    // stack: NICHT in Production (könnte sensible Pfade enthalten)
    type: error instanceof Error ? error.constructor.name : typeof error
  };
}
```

**Best Practices**:
- ✅ **Production-Safety**: Keine Stack Traces (Pfade könnten sensibel sein)
- ✅ **Development**: Volle Details für Debugging
- ✅ **Type-Preservation**: `constructor.name` für Error-Type

**4. ErrorBoundary** (`src/svelte/ErrorBoundary.svelte`)

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  
  onMount(() => {
    window.addEventListener("error", (e) => {
      console.error("[fvtt-relationship-network] Uncaught error", {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
      });
      // WICHTIG: NICHT e.preventDefault() → Browser-Konsole soll Stack Trace zeigen
    });
    
    window.addEventListener("unhandledrejection", (e) => {
      console.error("[fvtt-relationship-network] Unhandled promise rejection", {
        reason: e.reason
      });
    });
  });
</script>
```

**Best Practices**:
- ✅ **Doppeltes Logging**: Eigener Log + Browser-Default → Stack Traces erhalten
- ✅ **Unhandled Rejections**: Auch Promise-Fehler tracken
- ✅ **Context**: File, Line, Column für schnellere Diagnose

**5. Production Error Logging (Critical Errors)** (`src/foundry/versioning/portselector.ts`)

```typescript
selectPortFromFactories<T>(factories: Map<number, () => T>): Result<T, FoundryError> {
  if (!bestFactory) {
    this.metricsCollector.recordPortSelectionFailure();
    
    // KRITISCH: Production Logging für schwere Fehler
    if (ENV.isProduction) {
      console.error(`[${MODULE_CONSTANTS.ID}] Port selection failed`, {
        availableVersions: Array.from(factories.keys()),
        foundryVersion: currentVersion,
        moduleVersion: MODULE_CONSTANTS.VERSION
      });
    }
    
    return err(createFoundryError("PORT_SELECTION_FAILED", ...));
  }
}
```

**Regel**: **Kritische Fehler** → Production Logging, **normale Fehler** → nur Development

**Kritische Fehler**:
- Port-Selection-Fehler (Modul unbenutzbar)
- Container-Validation-Fehler (DI kaputt)
- Foundry-Version-Incompatibility

**Normale Fehler**:
- Journal-Entry nicht gefunden (Result-Pattern)
- User-Input ungültig (Validation-Fehler)

## Konsequenzen

### Positiv

- ✅ **Debuggability**: Strukturierte Logs → Filter nach `[module-id]` in Console
- ✅ **Performance Insights**: Metrics zeigen langsame DI-Resolutions, Port-Selections
- ✅ **Production Safety**: Error Sanitization verhindert Leak sensibler Daten
- ✅ **User Support**: Logs helfen bei "Es funktioniert nicht"-Anfragen
- ✅ **No External Dependencies**: Keine Drittanbieter (Sentry, etc.) → Privacy-freundlich

### Negativ

- ⚠️ **Manual Collection**: User muss Logs manuell kopieren (F12 → Console → Copy)
- ⚠️ **Limited Retention**: Browser-Console cleared bei Reload → Fehler können verloren gehen
- ⚠️ **No Aggregation**: Keine zentrale Fehler-Statistik (wie bei Sentry)

### Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Logs zu verbose → Performance | Niedrig | Niedrig | Feature-Flag `VITE_ENABLE_PERF_TRACKING`, nur kritische Logs in Production |
| Sensible Daten in Logs | Niedrig | Hoch | Error Sanitization, Review aller Log-Statements |
| User vergisst Logs zu kopieren | Hoch | Niedrig | Dokumentation: "Bitte Console-Logs beifügen" |

## Best Practices

### Logging

1. **Severity Levels**:
   - `debug`: Detaillierte Entwickler-Infos (nur in Development)
   - `info`: Wichtige Events (z.B. "Module initialized")
   - `warn`: Potenzielle Probleme (z.B. "Deprecated API verwendet")
   - `error`: Fehler (z.B. "Port selection failed")

2. **Context**:
   ```typescript
   // SCHLECHT
   logger.error("Failed to create user");
   
   // GUT
   logger.error("Failed to create user", {
     userId,
     error: sanitizeError(error),
     moduleVersion: MODULE_CONSTANTS.VERSION,
     foundryVersion: game.version
   });
   ```

3. **Prefix**:
   ```typescript
   console.info(`[${MODULE_CONSTANTS.ID}] User created`, { userId });
   // → Filterbar in Console: "[fvtt-relationship-network]"
   ```

### Metrics

1. **Feature-Flag**: Performance-Tracking optional

   ```typescript
   if (ENV.VITE_ENABLE_PERF_TRACKING) {
     metricsCollector.recordResolution(tokenId, duration);
   }
   ```

2. **Circular Buffer**: Fixe Größe → kein Memory-Leak

   ```typescript
   private resolutionTimes = new Float64Array(100); // Nicht Array.push()!
   ```

3. **Public API**: Metrics über `getMetrics()` abrufbar

   ```typescript
   mod.api.getMetrics(); // → { resolutions: 42, avgTime: 0.5ms }
   ```

### Error Handling

1. **Result-Pattern**: Normale Fehler → `err(...)` (kein Logging im Service)

   ```typescript
   // Service
   getJournalEntry(id: string): Result<JournalEntry, FoundryError> {
     if (!entry) {
       return err(createFoundryError("NOT_FOUND", "Entry not found"));
     }
     return ok(entry);
   }
   
   // Caller
   const result = service.getJournalEntry(id);
   if (!result.ok) {
     logger.warn("Journal entry not found", { id, error: result.error });
   }
   ```

2. **Kritische Fehler**: Production Logging

   ```typescript
   if (ENV.isProduction) {
     console.error(`[${MODULE_CONSTANTS.ID}] Critical error`, { ... });
   }
   ```

3. **ErrorBoundary**: Uncaught Errors + Promise Rejections

   ```svelte
   window.addEventListener("error", (e) => {
     console.error("[module] Uncaught error", { ... });
     // NICHT e.preventDefault() → Browser Stack Trace erhalten!
   });
   ```

## Public API

User können Metrics abrufen:

```javascript
const mod = game.modules.get("fvtt-relationship-network");
const metrics = mod.api.getMetrics();

console.log(metrics);
// → {
//     resolutions: 42,
//     avgResolutionTime: 0.5,
//     portSelectionFailures: 0
//   }
```

## Validierung

**Tests**:
- Unit Tests: 18 Tests für MetricsCollector
- Unit Tests: 12 Tests für ConsoleLoggerService
- Integration Tests: ErrorBoundary mit `dispatchEvent(new ErrorEvent(...))`

**Production**:
- Logs erscheinen korrekt in Browser-Console mit `[module-id]` prefix
- Metrics zeigen realistische Werte (avg DI-Resolution ~0.5ms)
- ErrorBoundary fängt Uncaught Errors ab

## Performance

```
MetricsCollector overhead:
  recordResolution(): ~0.001ms (Float64Array write)
  getSnapshot(): ~0.05ms (calculate average)
  
→ Vernachlässigbar
```

## Alternativen für die Zukunft

Falls manuelle Log-Collection zu aufwändig wird:
1. **Sentry Integration**: Opt-in für User (Privacy-Banner)
2. **Local Storage Logging**: Logs in `localStorage` speichern (Retention)
3. **Export-Feature**: "Export Logs" Button in UI

**Aktuell**: Manuelle Collection ausreichend, kein Handlungsbedarf.

## Beispiele

**Development**:

```
[fvtt-relationship-network] Module initialized { version: "0.3.0", foundryVersion: "13.2.0" }
[fvtt-relationship-network] Container validated { services: 12, duration: 15ms }
[fvtt-relationship-network] Port selected { version: 13, port: "FoundryGamePortV13", duration: 0.3ms }
```

**Production** (nur kritische Errors):

```
[fvtt-relationship-network] Port selection failed { availableVersions: [13], foundryVersion: "12.5.0", moduleVersion: "0.3.0" }
```

## Referenzen

- Logger: `src/services/logger.ts`
- MetricsCollector: `src/observability/metrics-collector.ts`
- Error Sanitizer: `src/observability/error-sanitizer.ts`
- ErrorBoundary: `src/svelte/ErrorBoundary.svelte`

## Update 2025-11-09: Self-Registration Pattern & ObservabilityRegistry

### Problem

Die bisherige Observer-Pattern-Implementierung hatte Nachteile:
- **Manuelle Verdrahtung**: Jeder neue Observable Service musste manuell in `configureDependencies()` verdrahtet werden
- **Zentraler Bottleneck**: Eine `PortSelectionObserver`-Klasse für alle Events
- **Schwer erweiterbar**: Neue Observable Services erforderten Code-Änderungen an mehreren Stellen

### Lösung: ObservabilityRegistry mit Self-Registration

**Konzept:**
```typescript
// 1. Service registriert sich selbst im Constructor
class PortSelector {
  static dependencies = [
    portSelectionEventEmitterToken,
    observabilityRegistryToken
  ] as const;

  constructor(
    private eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry
  ) {
    // Self-Registration: Keine manuelle Verdrahtung nötig!
    observability.registerPortSelector(this);
  }

  selectPort() {
    // Events werden automatisch geroutet
    this.eventEmitter.emit({ type: "success", ... });
  }
}

// 2. ObservabilityRegistry routet Events zu Logger/Metrics
class ObservabilityRegistry {
  static dependencies = [loggerToken, metricsRecorderToken] as const;

  registerPortSelector(service: ObservableService<PortSelectionEvent>) {
    service.onEvent((event) => {
      if (event.type === "success") {
        this.logger.debug(`Port v${event.selectedVersion} selected`);
        this.metrics.recordPortSelection(event.selectedVersion);
      }
    });
  }
}
```

**Vorteile:**
- ✅ **Kein manuelles Wiring**: Service-Erstellung = automatische Observability
- ✅ **DI-managed**: EventEmitter als TRANSIENT Service für Testability
- ✅ **Erweiterbar**: Neue Observable Services fügen nur `registerXxx()` Methode hinzu
- ✅ **Type-Safe**: `ObservableService<TEvent>` Interface
- ✅ **Zentrale Kontrolle**: Ein Registry-Service für alle Observability-Concerns

**Implementierung:**

Datei: `src/observability/observability-registry.ts`

```typescript
export interface ObservableService<TEvent = unknown> {
  onEvent(callback: (event: TEvent) => void): () => void;
}

export class ObservabilityRegistry {
  static dependencies = [loggerToken, metricsRecorderToken] as const;

  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsRecorder
  ) {}

  registerPortSelector(service: ObservableService<PortSelectionEvent>): void {
    service.onEvent((event) => {
      if (event.type === "success") {
        const adapterSuffix = event.adapterName ? ` for ${event.adapterName}` : "";
        this.logger.debug(
          `Port v${event.selectedVersion} selected in ${event.durationMs.toFixed(2)}ms${adapterSuffix}`
        );
        this.metrics.recordPortSelection(event.selectedVersion);
      } else {
        this.logger.error("Port selection failed", {
          foundryVersion: event.foundryVersion,
          availableVersions: event.availableVersions,
          adapterName: event.adapterName,
        });
        this.metrics.recordPortSelectionFailure(event.foundryVersion);
      }
    });
  }

  // Zukünftige Observable Services:
  // registerSomeOtherService(service: ObservableService<OtherEvent>): void { ... }
}
```

### DI-Konfiguration

**Modular Config Structure:**

Die DI-Konfiguration wurde in thematische Module aufgeteilt:

```
src/config/
├── dependencyconfig.ts                (Orchestrator)
├── modules/
│   ├── core-services.config.ts        (Logger, Metrics, Environment)
│   ├── observability.config.ts        (NEW: EventEmitter, ObservabilityRegistry)
│   ├── utility-services.config.ts     (Performance, Retry)
│   ├── port-infrastructure.config.ts  (PortSelector, PortRegistries)
│   ├── foundry-services.config.ts     (FoundryGame, Hooks, Document, UI)
│   ├── i18n-services.config.ts        (I18n Services)
│   └── registrars.config.ts           (NEW: ModuleSettingsRegistrar, ModuleHookRegistrar)
```

**Observability Config (`src/config/modules/observability.config.ts`):**

```typescript
export function registerObservability(container: ServiceContainer): Result<void, string> {
  // EventEmitter als TRANSIENT für Testability
  const emitterResult = container.registerFactory(
    portSelectionEventEmitterToken,
    () => new PortSelectionEventEmitter(),
    ServiceLifecycle.TRANSIENT,
    []
  );

  // ObservabilityRegistry als SINGLETON
  const registryResult = container.registerClass(
    observabilityRegistryToken,
    ObservabilityRegistry,
    ServiceLifecycle.SINGLETON,
    [loggerToken, metricsRecorderToken]
  );

  return ok(undefined);
}
```

### Self-Configuring Services

Services konfigurieren sich jetzt selbst via Constructor-Dependencies:

```typescript
// Logger erhält EnvironmentConfig als Dependency
class ConsoleLoggerService {
  static dependencies = [environmentConfigToken] as const;

  constructor(env: EnvironmentConfig) {
    this.minLevel = env.logLevel;  // Self-configuring!
  }
}
```

**Keine manuelle `configureLogger()` Funktion mehr nötig!**

### Dateien

- **NEW**: `src/observability/observability-registry.ts`
- **NEW**: `src/config/modules/observability.config.ts`
- **NEW**: `src/config/modules/registrars.config.ts`
- **REFACTORED**: `src/config/dependencyconfig.ts` → Orchestrator
- **UPDATED**: `src/foundry/versioning/portselector.ts` → Self-Registration
- **UPDATED**: `src/services/consolelogger.ts` → Self-Configuring

### Vorteile der Modularisierung

- ✅ Jedes Config-Modul < 200 Zeilen
- ✅ Klare thematische Trennung
- ✅ Einfach erweiterbar
- ✅ Übersichtlicher Orchestrator

## Verwandte ADRs

- [ADR-0001](0001-use-result-pattern-instead-of-exceptions.md) - Result-Pattern → Fehler werden geloggt im Caller
- [ADR-0005](0005-metrics-collector-singleton-to-di.md) - MetricsCollector via DI

