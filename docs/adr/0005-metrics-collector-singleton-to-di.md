# ADR-0005: MetricsCollector Singleton → DI-Managed Service

**Status**: Accepted  
**Datum**: 2025-11-06  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Observability, Dependency Injection, Performance Tracking

---

## Kontext und Problemstellung

`MetricsCollector` ist ein zentraler Service für Performance-Tracking:
- Trackt DI-Resolution-Zeiten
- Trackt Port-Selection-Erfolg/-Fehler
- Trackt Cache-Zugriffe
- Sammelt Performance-Marks/-Measures

**Ursprüngliche Implementierung: Singleton Pattern**

```typescript
export class MetricsCollector {
  private static instance: MetricsCollector | null = null;
  
  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector();
    }
    return this.instance;
  }
  
  private constructor() { /* ... */ }
}

// Verwendung überall
MetricsCollector.getInstance().recordResolution(...);
```

**Probleme mit Singleton**:

1. **Tight Coupling**: Jede Klasse importiert `MetricsCollector` direkt → schwer austauschbar
2. **Test-Komplexität**: Singleton-Reset zwischen Tests nötig, Zustand "bleibt hängen"
3. **Keine Lifecycle-Kontrolle**: Singleton lebt "ewig", Disposal schwierig
4. **Anti-Pattern mit DI**: DI-Container soll alle Services verwalten → Singleton umgeht das
5. **Circular Dependency Risk**: `ServiceResolver` → `MetricsCollector` → (potenziell) `ServiceResolver`

**Ziel**: `MetricsCollector` als normaler DI-verwalteter Service, Singleton-Pattern entfernen.

## Betrachtete Optionen

### Option 1: Singleton Pattern beibehalten

```typescript
// Status Quo
MetricsCollector.getInstance().recordResolution(...);
```

**Nachteile**:
- ❌ Tight Coupling
- ❌ Schwierig zu testen
- ❌ Inkonsistent mit Rest der Architektur

### Option 2: DI-Managed Service (SINGLETON Lifecycle)

```typescript
// 1. Token definieren
export const metricsCollectorToken = createToken<MetricsCollector>("MetricsCollector");

// 2. Klasse refactoren
export class MetricsCollector {
  static dependencies = [] as const; // Root service, keine DI-abhängigkeiten
  
  constructor() { /* ... */ } // Public constructor
  
  // getInstance() entfernen!
}

// 3. Container registrieren
container.register(metricsCollectorToken, MetricsCollector, ServiceLifecycle.SINGLETON);

// 4. Verwendung
const metricsCollector = container.resolve(metricsCollectorToken);
metricsCollector.recordResolution(...);
```

**Vorteile**:
- ✅ **Single Instance**: Container garantiert Singleton (SINGLETON Lifecycle)
- ✅ **Injizierbar**: Andere Services können `metricsCollector` per Constructor Injection erhalten
- ✅ **Testbar**: Container kann Mock-Implementierung registrieren
- ✅ **Lifecycle-Kontrolle**: Container kann `dispose()` aufrufen (z.B. bei Hot-Reload)
- ✅ **Konsistent**: Alle Services folgen gleichem Pattern

## Entscheidung

**Gewählt: Option 2 - DI-Managed Service**

### Implementierung

**Phase 1: MetricsCollector refactoren**

```typescript
// src/observability/metrics-collector.ts
export class MetricsCollector {
  static dependencies = [] as const; // Root service
  
  private resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
  private currentIndex = 0;
  // ...
  
  constructor() {
    // Public constructor, keine getInstance() mehr!
  }
  
  recordResolution(tokenId: string, durationMs: number): void {
    this.resolutionTimes[this.currentIndex] = durationMs;
    this.currentIndex = (this.currentIndex + 1) % this.resolutionTimes.length;
  }
  
  // getInstance() ENTFERNT
}
```

**Phase 2: Token & Container Registration**

```typescript
// src/tokens/tokenindex.ts
export const metricsCollectorToken = createToken<MetricsCollector>("MetricsCollector");

// src/config/dependencyconfig.ts
container.register(
  metricsCollectorToken,
  MetricsCollector,
  ServiceLifecycle.SINGLETON // ← Wichtig: Singleton-Garantie
);
```

**Phase 3: ServiceResolver Integration**

**Problem**: `ServiceResolver` braucht `MetricsCollector`, aber `MetricsCollector` ist selbst im Container → **Chicken-Egg-Problem**!

**Lösung**: Lazy Injection nach Container-Validierung

```typescript
// src/di_infrastructure/resolution/ServiceResolver.ts
export class ServiceResolver {
  private metricsCollector: MetricsCollector | null = null;
  
  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
  }
  
  resolve<T extends ServiceType>(token: Token<T>): T | null {
    const start = performance.now();
    
    // ... Resolution-Logik ...
    
    const duration = performance.now() - start;
    this.metricsCollector?.recordResolution(token.id, duration); // Optional Chaining!
    
    return instance;
  }
}

// src/di_infrastructure/container.ts
async injectMetricsCollector(): Promise<void> {
  const { metricsCollectorToken } = await import("../tokens/tokenindex.js");
  const collectorResult = this.resolveWithError(metricsCollectorToken);
  
  if (collectorResult.ok) {
    this.resolver.setMetricsCollector(collectorResult.value);
  }
}

async validateAsync(): Promise<Result<void, ContainerError>> {
  // ... Validierung ...
  await this.injectMetricsCollector(); // NACH Validierung!
  return ok(undefined);
}
```

**Warum `await import()`?**
- Vermeidet Circular Dependency: `container.ts` → `tokenindex.ts` → `container.ts`
- Nur nach Validierung nötig → kein Performance-Problem

**Phase 4: PortSelector Refactoring**

```typescript
// src/foundry/versioning/portselector.ts
export class PortSelector {
  static dependencies = [metricsCollectorToken] as const;
  
  constructor(private metricsCollector: MetricsCollector) {}
  
  selectPortFromFactories<T>(factories: Map<number, () => T>): Result<T, FoundryError> {
    const start = performance.now();
    
    // ... Selection-Logik ...
    
    if (!bestFactory) {
      this.metricsCollector.recordPortSelectionFailure();
      // Production Logging (KRITISCH!)
      if (ENV.isProduction) {
        console.error(`[${MODULE_CONSTANTS.ID}] Port selection failed`, {
          availableVersions: Array.from(factories.keys()),
          foundryVersion: current
        });
      }
      return err(createFoundryError("PORT_SELECTION_FAILED", ...));
    }
    
    const port = bestFactory();
    this.metricsCollector.recordPortSelection(selectedVersion, performance.now() - start);
    return ok(port);
  }
}
```

**Phase 5: CompositionRoot Update**

```typescript
// src/core/composition-root.ts
export function createPublicApi(container: ServiceContainer): ModuleApi {
  return {
    getMetrics: () => {
      // VORHER: MetricsCollector.getInstance()
      // NACHHER: DI-Resolution
      const collectorResult = container.resolveWithError(metricsCollectorToken);
      if (!collectorResult.ok) {
        return { error: "Metrics not available" };
      }
      return collectorResult.value.getSnapshot();
    }
  };
}
```

**Phase 6: Tests Update**

```typescript
// src/test/utils/test-helpers.ts
export function createMockMetricsCollector(): MetricsCollector {
  return {
    recordResolution: vi.fn(),
    recordPortSelection: vi.fn(),
    recordPortSelectionFailure: vi.fn(),
    getSnapshot: vi.fn(() => ({ resolutions: 0, portSelections: 0 }))
  } as unknown as MetricsCollector;
}

// src/foundry/versioning/__tests__/PortSelector.test.ts
describe("PortSelector", () => {
  let mockMetrics: MetricsCollector;
  
  beforeEach(() => {
    mockMetrics = createMockMetricsCollector();
  });
  
  test("selects port", () => {
    const selector = new PortSelector(mockMetrics); // Constructor Injection
    // ...
  });
});
```

## Konsequenzen

### Positiv

- ✅ **Testbarkeit**: Mock-Implementierung einfach injizierbar
- ✅ **Lifecycle-Kontrolle**: Container verwaltet Instance, kann dispose() aufrufen
- ✅ **Konsistenz**: Alle Services folgen gleichem DI-Pattern
- ✅ **Loose Coupling**: Services abhängig von Token, nicht von Klasse
- ✅ **Type-Safety**: Constructor Injection → Compiler checkt dependencies

### Negativ

- ⚠️ **Chicken-Egg-Problem**: `ServiceResolver` braucht `MetricsCollector` → Lazy Injection nötig
- ⚠️ **Async Import**: `await import()` in `injectMetricsCollector()` → muss nach Validierung
- ⚠️ **Optional Chaining**: `this.metricsCollector?.recordResolution()` → Metrics gehen verloren, falls Injection fehlschlägt

### Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| MetricsCollector Injection fehlschlägt | Sehr niedrig | Niedrig | Optional Chaining, Tests für Injection-Fehler |
| Circular Dependency | Niedrig | Hoch | `await import()`, klare Dependency-Hierarchie |
| Tests brechen | Mittel | Niedrig | Mock-Helper bereitgestellt, umfangreiche Test-Updates |

## Migration-Checkliste

- [x] `MetricsCollector` → Public Constructor, `getInstance()` entfernen
- [x] Token `metricsCollectorToken` erstellen
- [x] Container-Registration (SINGLETON Lifecycle)
- [x] `ServiceResolver.setMetricsCollector()` implementieren
- [x] `ServiceContainer.injectMetricsCollector()` implementieren
- [x] `PortSelector` → Constructor Injection
- [x] `CompositionRoot.getMetrics()` → DI-Resolution
- [x] Tests updaten (alle `MetricsCollector.getInstance()` → Mock/DI)
- [x] `MetricsCollector` zu `ServiceType` Union hinzufügen

## Validierung

**Tests**:
- Unit Tests: 18 Tests für MetricsCollector (singleton-spezifische Tests entfernt)
- Integration Tests: 6 Tests für PortSelector mit injected MetricsCollector
- E2E Tests: CompositionRoot getMetrics() mit DI-Resolution

**Production**:
- Metrics funktionieren wie vorher (Singleton-Garantie durch SINGLETON Lifecycle)
- Performance: Keine Verschlechterung (DI-Resolution cached)
- 0 Regressions in existing functionality

## Performance

```
Before (Singleton):
  MetricsCollector.getInstance(): ~0.001ms (cached)

After (DI):
  container.resolve(metricsCollectorToken): ~0.003ms (cached, first time ~0.1ms)
  
→ Vernachlässigbare Performance-Differenz
```

## Alternativen für die Zukunft

Falls DI-Overhead problematisch wird:
1. **Zurück zu Singleton**: Unwahrscheinlich, da Performance akzeptabel
2. **Globale Variable**: Anti-Pattern, vermeiden
3. **Service Locator**: Alternative zu DI, aber auch Anti-Pattern

**Aktuell**: DI-Lösung funktioniert hervorragend, kein Handlungsbedarf.

## Referenzen

- Implementation: `src/observability/metrics-collector.ts`
- Token: `src/tokens/tokenindex.ts`
- Container: `src/di_infrastructure/container.ts`
- Tests: `src/observability/__tests__/metrics-collector.test.ts`

## Verwandte ADRs

- [ADR-0002](0002-custom-di-container-instead-of-tsyringe.md) - DI-Container verwaltet alle Services
- [ADR-0003](0003-port-adapter-for-foundry-version-compatibility.md) - PortSelector nutzt MetricsCollector

