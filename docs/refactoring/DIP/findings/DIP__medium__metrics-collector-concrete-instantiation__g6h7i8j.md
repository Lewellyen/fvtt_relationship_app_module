---
principle: DIP
severity: medium
confidence: high
component_kind: class
component_name: "MetricsCollector"
file: "src/infrastructure/observability/metrics-collector.ts"
location:
  start_line: 71
  end_line: 85
tags: ["dependency", "instantiation", "composition", "metrics"]
---

# Problem

Die `MetricsCollector`-Klasse erstellt konkrete Instanzen von `MetricsAggregator`, `MetricsPersistenceManager` und `MetricsStateManager` direkt im Konstruktor, anstatt diese über Dependency Injection zu erhalten. Dies verletzt das Dependency Inversion Principle, da die Klasse von konkreten Implementierungen abhängt statt von Abstraktionen.

## Evidence

```71:85:src/infrastructure/observability/metrics-collector.ts
  constructor(
    private readonly config: RuntimeConfigService,
    registry?: MetricDefinitionRegistry
  ) {
    // Use provided registry or create default one
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();

    // Initialize metric states from registry
    this.initializeMetricStates();

    // Create components internally (can be injected in future if needed)
    this.aggregator = new MetricsAggregator();
    this.persistenceManager = new MetricsPersistenceManager();
    this.stateManager = new MetricsStateManager();
  }
```

Die Klasse erstellt direkt:
- `new MetricsAggregator()` (Zeile 82)
- `new MetricsPersistenceManager()` (Zeile 83)
- `new MetricsStateManager()` (Zeile 84)

## Impact

- **Tight Coupling**: Die Klasse ist eng an konkrete Implementierungen gekoppelt
- **Schwierige Testbarkeit**: Mock-Objekte können nicht einfach injiziert werden
- **Reduzierte Flexibilität**: Alternative Implementierungen können nicht ohne Code-Änderung verwendet werden
- **Verletzung von DIP**: Die Klasse sollte von Interfaces/Abstraktionen abhängen, nicht von konkreten Klassen

## Recommendation

**Option 1: Dependency Injection (Empfohlen)**

Injiziere die Abhängigkeiten über den Konstruktor:

```typescript
// Interfaces definieren
export interface IMetricsAggregator {
  aggregate(rawMetrics: IRawMetrics): MetricsSnapshot;
}

export interface IMetricsPersistenceManager {
  serialize(rawMetrics: IRawMetrics): MetricsPersistenceState;
  deserialize(state: MetricsPersistenceState | null | undefined): IRawMetrics;
}

export interface IMetricsStateManager {
  notifyStateChanged(): void;
  reset(): void;
}

// MetricsCollector verwendet Interfaces
export class MetricsCollector implements MetricsRecorder {
  constructor(
    private readonly config: RuntimeConfigService,
    private readonly aggregator: IMetricsAggregator,
    private readonly persistenceManager: IMetricsPersistenceManager,
    private readonly stateManager: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();
    this.initializeMetricStates();
  }

  // ...
}

// Konkrete Implementierungen
export class MetricsAggregator implements IMetricsAggregator {
  aggregate(rawMetrics: IRawMetrics): MetricsSnapshot {
    // Implementation
  }
}

// DI-Wrapper erstellt Instanzen
export class DIMetricsCollector extends MetricsCollector {
  static override dependencies = [
    runtimeConfigToken,
    metricsAggregatorToken,
    metricsPersistenceManagerToken,
    metricsStateManagerToken,
  ] as const;

  constructor(
    config: RuntimeConfigService,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager
  ) {
    super(config, aggregator, persistenceManager, stateManager);
  }
}
```

**Option 2: Factory Pattern (Alternative)**

Verwende eine Factory für die Erstellung der Komponenten:

```typescript
export interface IMetricsCollectorFactory {
  createAggregator(): MetricsAggregator;
  createPersistenceManager(): MetricsPersistenceManager;
  createStateManager(): MetricsStateManager;
}

export class MetricsCollector implements MetricsRecorder {
  constructor(
    private readonly config: RuntimeConfigService,
    private readonly factory: IMetricsCollectorFactory,
    registry?: MetricDefinitionRegistry
  ) {
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();
    this.initializeMetricStates();

    this.aggregator = factory.createAggregator();
    this.persistenceManager = factory.createPersistenceManager();
    this.stateManager = factory.createStateManager();
  }
}
```

## Example Fix

**Schrittweise Migration:**

1. Interfaces für die Komponenten definieren
2. Konkrete Klassen implementieren die Interfaces
3. MetricsCollector-Konstruktor erweitern
4. DI-Wrapper anpassen
5. DI-Registrierung aktualisieren

```typescript
// 1. Interfaces definieren
export interface IMetricsAggregator {
  aggregate(rawMetrics: IRawMetrics): MetricsSnapshot;
}

// 2. Konkrete Klasse implementiert Interface
export class MetricsAggregator implements IMetricsAggregator {
  aggregate(rawMetrics: IRawMetrics): MetricsSnapshot {
    // Existing implementation
  }
}

// 3. MetricsCollector verwendet Interface
export class MetricsCollector implements MetricsRecorder {
  private readonly aggregator: IMetricsAggregator;
  private readonly persistenceManager: IMetricsPersistenceManager;
  private readonly stateManager: IMetricsStateManager;

  constructor(
    private readonly config: RuntimeConfigService,
    aggregator?: IMetricsAggregator,
    persistenceManager?: IMetricsPersistenceManager,
    stateManager?: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();
    this.initializeMetricStates();

    // Fallback zu Default-Instanzen für Backward Compatibility
    this.aggregator = aggregator ?? new MetricsAggregator();
    this.persistenceManager = persistenceManager ?? new MetricsPersistenceManager();
    this.stateManager = stateManager ?? new MetricsStateManager();
  }

  // ...
}

// 4. DI-Wrapper
export class DIMetricsCollector extends MetricsCollector {
  static override dependencies = [
    runtimeConfigToken,
    metricsAggregatorToken,
    metricsPersistenceManagerToken,
    metricsStateManagerToken,
  ] as const;

  constructor(
    config: RuntimeConfigService,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager
  ) {
    super(config, aggregator, persistenceManager, stateManager);
  }
}
```

## Notes

- **Bestehende Implementierung**: Die direkte Instanziierung funktioniert, schränkt aber Flexibilität ein
- **Kommentar im Code**: Zeile 81 enthält bereits den Hinweis "can be injected in future if needed"
- **Backward Compatibility**: Optional-Parameter ermöglichen schrittweise Migration ohne Breaking Changes
- **Testing**: Aktuelle Tests könnten durch Mock-Objekte vereinfacht werden
- **Bewertung**: Mittlere Priorität - funktional korrekt, aber könnte Flexibilität und Testbarkeit verbessern

