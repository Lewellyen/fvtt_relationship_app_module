# SRP Refactoring Plan: MetricsCollector

**Status:** 📋 Geplant
**Priorität:** 🟡 Niedrig
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Metrics-Sammlung von Sampling-Logik und Reporting

---

## Problem

`MetricsCollector` verletzt das Single Responsibility Principle (SRP) durch mehrere Verantwortlichkeiten:

1. **Metrics-Sammlung**: Metrics sammeln und speichern
2. **Sampling-Logik**: Entscheiden, ob ein Event gesampelt werden soll
3. **Reporting**: Metrics loggen (logSummary)
4. **Persistence**: Metrics persistieren (via Subclass)

**Aktuelle Datei:** `src/infrastructure/observability/metrics-collector.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class MetricsCollector implements MetricsRecorder, MetricsSampler {
  // 1. Metrics-Sammlung
  recordResolution(token: InjectionToken<unknown>, durationMs: number, success: boolean): void
  recordPortSelection(version: number): void
  recordPortSelectionFailure(version: number): void
  recordCacheAccess(hit: boolean): void

  // 2. Sampling-Logik
  shouldSample(): boolean

  // 3. Reporting
  logSummary(): void
  getSnapshot(): MetricsSnapshot

  // 4. Persistence (via Subclass)
  protected onStateChanged(): void
  protected getPersistenceState(): MetricsPersistenceState
  protected restoreFromPersistenceState(state: MetricsPersistenceState | null | undefined): void
}
```

**Probleme:**
- Metrics-Sammlung, Sampling und Reporting sind vermischt
- `logSummary()` ist Reporting (nicht Sammlung)
- Sampling-Logik könnte wiederverwendbar sein
- Persistence-Logik ist in Subclass (gut), aber könnte besser getrennt sein

---

## Ziel-Architektur

### 1. MetricsCollector (Core Metrics-Sammlung)
**Verantwortlichkeit:** Nur Metrics sammeln und speichern

```typescript
export class MetricsCollector implements MetricsRecorder {
  // Metrics-Sammlung
  recordResolution(token: InjectionToken<unknown>, durationMs: number, success: boolean): void
  recordPortSelection(version: number): void
  recordPortSelectionFailure(version: number): void
  recordCacheAccess(hit: boolean): void

  // Snapshot (für Reporting)
  getSnapshot(): MetricsSnapshot

  // Reset
  reset(): void
}
```

### 2. MetricsSampler (Sampling-Logik)
**Verantwortlichkeit:** Nur Sampling-Entscheidungen

```typescript
export class MetricsSampler implements MetricsSamplerInterface {
  constructor(private readonly config: RuntimeConfigService) {}

  /**
   * Entscheidet, ob ein Event gesampelt werden soll.
   */
  shouldSample(): boolean {
    // Always sample in development mode
    if (this.config.get("isDevelopment")) {
      return true;
    }

    // Probabilistic sampling in production
    return Math.random() < this.config.get("performanceSamplingRate");
  }
}
```

### 3. MetricsReporter (Reporting)
**Verantwortlichkeit:** Nur Metrics-Reporting und Logging

```typescript
export class MetricsReporter {
  constructor(
    private readonly collector: MetricsCollector,
    private readonly logger?: Logger
  ) {}

  /**
   * Loggt eine formatierte Metrics-Zusammenfassung.
   */
  logSummary(): void {
    const snapshot = this.collector.getSnapshot();

    const tableData: MetricsTableData = {
      "Total Resolutions": snapshot.containerResolutions,
      Errors: snapshot.resolutionErrors,
      "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
      "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`,
    };
    console.table(tableData);
  }

  /**
   * Gibt Metrics als JSON zurück.
   */
  toJSON(): string {
    return JSON.stringify(this.collector.getSnapshot(), null, 2);
  }
}
```

---

## Schritt-für-Schritt Migration

### Phase 1: MetricsSampler extrahieren

1. **MetricsSampler erstellen:**
   ```typescript
   // src/infrastructure/observability/metrics-sampler.ts
   export class MetricsSampler implements MetricsSamplerInterface {
     constructor(private readonly config: RuntimeConfigService) {}

     shouldSample(): boolean {
       // Always sample in development mode
       if (this.config.get("isDevelopment")) {
         return true;
       }

       // Probabilistic sampling in production
       return Math.random() < this.config.get("performanceSamplingRate");
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIMetricsSampler extends MetricsSampler {
     static dependencies = [runtimeConfigToken] as const;

     constructor(config: RuntimeConfigService) {
       super(config);
     }
   }
   ```

3. **Token erstellen:**
   ```typescript
   // src/infrastructure/shared/tokens/observability.tokens.ts
   export const metricsSamplerToken: InjectionToken<MetricsSampler> =
     createToken<MetricsSampler>("metricsSampler");
   ```

4. **In DI-Config registrieren:**
   ```typescript
   // src/framework/config/modules/observability.config.ts
   container.registerClass(
     metricsSamplerToken,
     DIMetricsSampler,
     ServiceLifecycle.SINGLETON
   );
   ```

### Phase 2: MetricsReporter extrahieren

1. **MetricsReporter erstellen:**
   ```typescript
   // src/infrastructure/observability/metrics-reporter.ts
   export class MetricsReporter {
     constructor(
       private readonly collector: MetricsCollector,
       private readonly logger?: Logger
     ) {}

     logSummary(): void {
       const snapshot = this.collector.getSnapshot();

       const tableData: MetricsTableData = {
         "Total Resolutions": snapshot.containerResolutions,
         Errors: snapshot.resolutionErrors,
         "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
         "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`,
       };
       console.table(tableData);
     }

     toJSON(): string {
       return JSON.stringify(this.collector.getSnapshot(), null, 2);
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIMetricsReporter extends MetricsReporter {
     static dependencies = [metricsCollectorToken, loggerToken] as const;

     constructor(
       collector: MetricsCollector,
       logger: Logger
     ) {
       super(collector, logger);
     }
   }
   ```

3. **Token erstellen:**
   ```typescript
   // src/infrastructure/shared/tokens/observability.tokens.ts
   export const metricsReporterToken: InjectionToken<MetricsReporter> =
     createToken<MetricsReporter>("metricsReporter");
   ```

### Phase 3: MetricsCollector refactoren

1. **shouldSample() entfernen:**
   - Methode aus `MetricsCollector` entfernen
   - `MetricsSampler` verwenden, wo nötig

2. **logSummary() entfernen:**
   - Methode aus `MetricsCollector` entfernen
   - `MetricsReporter` verwenden

3. **Interfaces aktualisieren:**
   ```typescript
   // MetricsCollector implementiert nur noch MetricsRecorder
   export class MetricsCollector implements MetricsRecorder {
     // Kein MetricsSampler mehr
     // Kein logSummary() mehr
   }
   ```

### Phase 4: Verwendungsstellen aktualisieren

1. **PerformanceTracker aktualisieren:**
   ```typescript
   // src/infrastructure/observability/performance-tracker.interface.ts
   export class PerformanceTrackingService {
     constructor(
       private readonly sampler: MetricsSampler, // NEU
       private readonly collector: MetricsCollector
     ) {}

     track<T>(fn: () => T, onComplete?: (duration: number, result: T) => void): T {
       if (!this.sampler.shouldSample()) {
         return fn();
       }
       // ...
     }
   }
   ```

2. **API-Exposition aktualisieren:**
   ```typescript
   // src/framework/core/api/module-api-initializer.ts
   // metricsReporterToken als API-safe markieren
   ```

---

## Breaking Changes

### API-Änderungen

1. **MetricsCollector:**
   - ❌ `shouldSample()` entfernt → `MetricsSampler` verwenden
   - ❌ `logSummary()` entfernt → `MetricsReporter` verwenden
   - ✅ `getSnapshot()` bleibt (für Reporting)

2. **Neue Abhängigkeiten:**
   - `PerformanceTrackingService` benötigt `MetricsSampler`
   - Externe Nutzer benötigen `MetricsReporter` für Logging

### Migration für externe Nutzer

**Vorher:**
```typescript
const collector = container.resolve(metricsCollectorToken);
if (collector.shouldSample()) {
  // ...
}
collector.logSummary();
```

**Nachher:**
```typescript
const sampler = container.resolve(metricsSamplerToken);
const reporter = container.resolve(metricsReporterToken);

if (sampler.shouldSample()) {
  // ...
}
reporter.logSummary();
```

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Wiederverwendbarkeit**: `MetricsSampler` für andere Observability-Kontexte nutzbar
3. ✅ **Bessere Testbarkeit**: Sampling, Collection und Reporting isoliert testbar
4. ✅ **Klarere Abhängigkeiten**: Explizite Dependencies
5. ✅ **Einfachere Wartung**: Änderungen an Reporting betreffen nur Reporter

---

## Risiken

1. **Niedrig**: API-Änderungen sind minimal
2. **Niedrig**: Externe Nutzer müssen migriert werden (wenn vorhanden)
3. **Niedrig**: Tests müssen angepasst werden

---

## Erweiterte Möglichkeiten

### Custom Sampling-Strategien

```typescript
// Beispiel: Adaptive Sampling
export class AdaptiveSamplingStrategy implements MetricsSamplerInterface {
  shouldSample(): boolean {
    // Sampling-Rate basierend auf aktueller Load
  }
}
```

---

## Checkliste

- [ ] `MetricsSampler` Klasse erstellen
- [ ] DI-Wrapper und Token erstellen
- [ ] In DI-Config registrieren
- [ ] `MetricsReporter` Klasse erstellen
- [ ] DI-Wrapper und Token erstellen
- [ ] In DI-Config registrieren
- [ ] `MetricsCollector.shouldSample()` entfernen
- [ ] `MetricsCollector.logSummary()` entfernen
- [ ] `PerformanceTrackingService` aktualisieren
- [ ] Unit-Tests für `MetricsSampler` schreiben
- [ ] Unit-Tests für `MetricsReporter` schreiben
- [ ] Unit-Tests für `MetricsCollector` aktualisieren
- [ ] Integration-Tests aktualisieren
- [ ] API-Dokumentation aktualisieren
- [ ] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/infrastructure/observability/metrics-collector.ts`
- **MetricsRecorder Interface:** `src/infrastructure/observability/interfaces/metrics-recorder.ts`
- **MetricsSampler Interface:** `src/infrastructure/observability/interfaces/metrics-sampler.ts`
- **PerformanceTracker:** `src/infrastructure/observability/performance-tracker.interface.ts`

