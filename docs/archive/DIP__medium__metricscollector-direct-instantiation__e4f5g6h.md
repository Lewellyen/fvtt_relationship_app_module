---
principle: DIP
severity: medium
confidence: high
component_kind: class
component_name: "MetricsCollector"
file: "src/infrastructure/observability/metrics-collector.ts"
location:
  start_line: 78
  end_line: 95
tags: ["dependency", "instantiation", "infrastructure-layer", "fallback"]
---

# Problem

`MetricsCollector` verletzt das Dependency Inversion Principle (DIP), indem es `MetricsAggregator`, `MetricsPersistenceManager` und `MetricsStateManager` direkt im Constructor instanziiert, wenn sie nicht injiziert werden (Fallback-Verhalten).

## Evidence

```78:95:src/infrastructure/observability/metrics-collector.ts
  constructor(
    private readonly config: RuntimeConfigService,
    registry?: MetricDefinitionRegistry,
    aggregator?: IMetricsAggregator,
    persistenceManager?: IMetricsPersistenceManager,
    stateManager?: IMetricsStateManager
  ) {
    // Use provided registry or create default one
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();

    // Initialize metric states from registry
    this.initializeMetricStates();

    // DIP: Use injected dependencies or fallback to default implementations for backward compatibility
    this.aggregator = aggregator ?? new MetricsAggregator();
    this.persistenceManager = persistenceManager ?? new MetricsPersistenceManager();
    this.stateManager = stateManager ?? new MetricsStateManager();
  }
```

**Problem:**
- Fallback-Instanziierung mit `new` für `MetricsAggregator`, `MetricsPersistenceManager` und `MetricsStateManager`
- Obwohl Dependencies optional sind, werden sie direkt instanziiert statt über DI
- Verletzt DIP: Abhängigkeit von konkreten Implementierungen

**Hinweis:** Die Dependencies sind bereits als optional deklariert und können injiziert werden, aber der Fallback-Mechanismus verwendet direkte Instanziierung.

## Impact

**Testbarkeit:**
- Fallback-Verhalten erschwert das Mocking in Tests
- Tests müssen explizit alle Dependencies injizieren, um Mocking zu ermöglichen

**Flexibilität:**
- Fallback-Implementierungen sind hardcodiert
- Keine Möglichkeit, alternative Fallback-Strategien zu verwenden

**Konsistenz:**
- Inkonsistent mit dem Rest der Codebase, wo alle Dependencies über DI injiziert werden
- Fallback-Verhalten sollte über Factory oder DI-Container gehandhabt werden

## Recommendation

**Approach A (Empfohlen): Factory-Pattern für Fallbacks**

1. Factory-Funktion erstellen, die Default-Implementierungen erstellt:
   ```typescript
   function createDefaultMetricsDependencies(): {
     aggregator: IMetricsAggregator;
     persistenceManager: IMetricsPersistenceManager;
     stateManager: IMetricsStateManager;
   } {
     return {
       aggregator: new MetricsAggregator(),
       persistenceManager: new MetricsPersistenceManager(),
       stateManager: new MetricsStateManager(),
     };
   }
   ```

2. Factory im Constructor verwenden:
   ```typescript
   constructor(
     private readonly config: RuntimeConfigService,
     registry?: MetricDefinitionRegistry,
     aggregator?: IMetricsAggregator,
     persistenceManager?: IMetricsPersistenceManager,
     stateManager?: IMetricsStateManager,
     factory?: () => { aggregator: IMetricsAggregator; persistenceManager: IMetricsPersistenceManager; stateManager: IMetricsStateManager }
   ) {
     const defaults = factory?.() ?? createDefaultMetricsDependencies();
     this.aggregator = aggregator ?? defaults.aggregator;
     this.persistenceManager = persistenceManager ?? defaults.persistenceManager;
     this.stateManager = stateManager ?? defaults.stateManager;
   }
   ```

**Approach B (Alternative): DI-Container für Fallbacks**

Alle Dependencies über DI-Container registrieren und auflösen:
- `MetricsAggregator`, `MetricsPersistenceManager`, `MetricsStateManager` als Singleton registrieren
- `MetricsCollector` löst sie über Container auf
- Fallback-Verhalten wird durch Container-Registrierung gehandhabt

**Hinweis:** Approach B ist bereits teilweise implementiert - die Dependencies werden im DI-Container registriert (siehe `src/framework/config/modules/core-services.config.ts`). Der Fallback im Constructor ist daher möglicherweise nicht mehr notwendig.

## Example Fix

**Before:**
```typescript
constructor(
  private readonly config: RuntimeConfigService,
  registry?: MetricDefinitionRegistry,
  aggregator?: IMetricsAggregator,
  persistenceManager?: IMetricsPersistenceManager,
  stateManager?: IMetricsStateManager
) {
  this.registry = registry ?? createDefaultMetricDefinitionRegistry();
  this.initializeMetricStates();
  this.aggregator = aggregator ?? new MetricsAggregator();
  this.persistenceManager = persistenceManager ?? new MetricsPersistenceManager();
  this.stateManager = stateManager ?? new MetricsStateManager();
}
```

**After (Approach A):**
```typescript
function createDefaultMetricsDependencies(): {
  aggregator: IMetricsAggregator;
  persistenceManager: IMetricsPersistenceManager;
  stateManager: IMetricsStateManager;
} {
  return {
    aggregator: new MetricsAggregator(),
    persistenceManager: new MetricsPersistenceManager(),
    stateManager: new MetricsStateManager(),
  };
}

constructor(
  private readonly config: RuntimeConfigService,
  registry?: MetricDefinitionRegistry,
  aggregator?: IMetricsAggregator,
  persistenceManager?: IMetricsPersistenceManager,
  stateManager?: IMetricsStateManager,
  factory?: () => { aggregator: IMetricsAggregator; persistenceManager: IMetricsPersistenceManager; stateManager: IMetricsStateManager }
) {
  this.registry = registry ?? createDefaultMetricDefinitionRegistry();
  this.initializeMetricStates();
  const defaults = factory?.() ?? createDefaultMetricsDependencies();
  this.aggregator = aggregator ?? defaults.aggregator;
  this.persistenceManager = persistenceManager ?? defaults.persistenceManager;
  this.stateManager = stateManager ?? defaults.stateManager;
}
```

**After (Approach B - Empfohlen, wenn DI-Container verwendet wird):**
```typescript
constructor(
  private readonly config: RuntimeConfigService,
  registry?: MetricDefinitionRegistry,
  aggregator?: IMetricsAggregator,
  persistenceManager?: IMetricsPersistenceManager,
  stateManager?: IMetricsStateManager
) {
  this.registry = registry ?? createDefaultMetricDefinitionRegistry();
  this.initializeMetricStates();
  // Alle Dependencies müssen injiziert werden - kein Fallback mehr
  // Fallback wird durch DI-Container-Registrierung gehandhabt
  if (!aggregator || !persistenceManager || !stateManager) {
    throw new Error("All metrics dependencies must be injected");
  }
  this.aggregator = aggregator;
  this.persistenceManager = persistenceManager;
  this.stateManager = stateManager;
}
```

## Tests & Quality Gates

**Vor Refactoring:**
- Bestehende Tests müssen weiterhin bestehen
- Sicherstellen, dass DI-Container-Registrierung korrekt funktioniert

**Nach Refactoring:**
- Unit-Tests können Dependencies mocken
- Integration-Tests mit echten Implementierungen
- Type-Check muss bestehen
- Alle bestehenden Tests müssen weiterhin bestehen

## Akzeptanzkriterien

- ✅ Keine direkte `new`-Instanziierung im Constructor (außer in Factory-Funktion)
- ✅ Fallback-Verhalten wird über Factory oder DI-Container gehandhabt
- ✅ Alle bestehenden Tests bestehen weiterhin
- ✅ Neue Unit-Tests können Dependencies mocken
- ✅ Type-Check besteht ohne Fehler

## Notes

- **Breaking Changes:** Minimal - Dependencies sind bereits optional, aber Fallback-Verhalten ändert sich
- **Aufwand:** Niedrig-Mittel (1-2 Stunden)
- **Priorität:** Mittel - Verbessert Testbarkeit, aber Fallback ist für Backward Compatibility nützlich
- **Verwandte Dateien:**
  - `src/infrastructure/observability/metrics-aggregator.ts`
  - `src/infrastructure/observability/metrics-persistence/metrics-persistence-manager.ts`
  - `src/infrastructure/observability/metrics-state/metrics-state-manager.ts`
  - `src/framework/config/modules/core-services.config.ts` (DI-Registrierung)

**Wichtig:** Prüfen, ob der Fallback-Mechanismus noch benötigt wird, da die Dependencies bereits im DI-Container registriert sind.

