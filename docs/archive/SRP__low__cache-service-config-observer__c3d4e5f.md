---
principle: SRP
severity: low
confidence: high
component_kind: class
component_name: "CacheService"
file: "src/infrastructure/cache/CacheService.ts"
location:
  start_line: 56
  end_line: 150
tags: ["responsibility", "cache", "infrastructure-layer"]
---

# Problem

`CacheService` implementiert sowohl `CacheServiceContract` als auch `CacheConfigObserver`, was gegen das Single Responsibility Principle (SRP) verstößt.

## Evidence

```56:150:src/infrastructure/cache/CacheService.ts
export class CacheService implements CacheServiceContract {
  private readonly runtime: ICacheRuntime;
  private readonly policy: ICachePolicy;
  private readonly telemetry: ICacheTelemetry;
  private readonly store: ICacheStore;
  private readonly configManager: ICacheConfigManager;
  private readonly expirationManager: ICacheExpirationManager;
  private readonly clock: () => number;

  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    private readonly metricsCollector?: MetricsCollector,
    clock: () => number = () => Date.now(),
    capacityManager?: CacheCapacityManager,
    metricsObserver?: CacheMetricsObserver,
    store?: ICacheStore,
    expirationManager?: ICacheExpirationManager,
    statisticsCollector?: ICacheStatisticsCollector,
    configManager?: ICacheConfigManager,
    runtime?: ICacheRuntime,
    policy?: ICachePolicy,
    telemetry?: ICacheTelemetry
  ) {
    // ... initialization code ...
  }

  getConfigManager(): ICacheConfigManager {
    return this.configManager;
  }
```

**Problem:**
- `CacheService` implementiert `CacheServiceContract` (Cache-Operationen)
- `CacheService` implementiert auch `CacheConfigObserver` (Config-Updates beobachten)
- Zwei verschiedene Verantwortlichkeiten in einer Klasse

**Hinweis:** Die Implementierung delegiert bereits an spezialisierte Komponenten (`CacheRuntime`, `CachePolicy`, `CacheTelemetry`), was SRP teilweise befolgt. Die Kombination von Service-Contract und Config-Observer ist jedoch ein SRP-Verstoß.

## Impact

**Kohäsion:**
- Zwei verschiedene Verantwortlichkeiten in einer Klasse
- Config-Observer-Logik ist eng mit Cache-Service verbunden, aber semantisch unterschiedlich

**Testbarkeit:**
- Tests müssen sowohl Cache-Operationen als auch Config-Observer-Verhalten testen
- Erschwert isolierte Unit-Tests

**Wartbarkeit:**
- Änderungen an Config-Observer-Logik betreffen auch Cache-Service
- Erschwert zukünftige Erweiterungen

## Recommendation

**Approach A (Empfohlen): Separate Config Observer Klasse**

1. Separate `CacheConfigObserver` Klasse erstellen:
   ```typescript
   export class CacheConfigObserverImpl implements CacheConfigObserver {
     constructor(private readonly configManager: ICacheConfigManager) {}

     onConfigChanged(config: CacheServiceConfig): void {
       this.configManager.updateConfig(config);
     }
   }
   ```

2. `CacheService` nur für Cache-Operationen verwenden:
   ```typescript
   export class CacheService implements CacheServiceContract {
     // Nur Cache-Operationen, kein Config-Observer
   }
   ```

**Approach B (Alternative): Beibehalten**

- Config-Observer-Logik ist einfach und eng mit Cache-Service verbunden
- Delegation an `configManager` hält Verantwortlichkeiten getrennt
- SRP-Verstoß ist minimal und akzeptabel

## Example Fix

**Before:**
```typescript
export class CacheService implements CacheServiceContract, CacheConfigObserver {
  // Cache-Operationen und Config-Observer in einer Klasse
  getConfigManager(): ICacheConfigManager {
    return this.configManager;
  }

  onConfigChanged(config: CacheServiceConfig): void {
    this.configManager.updateConfig(config);
  }
}
```

**After (Approach A):**
```typescript
export class CacheService implements CacheServiceContract {
  // Nur Cache-Operationen
  getConfigManager(): ICacheConfigManager {
    return this.configManager;
  }
}

export class CacheConfigObserverImpl implements CacheConfigObserver {
  constructor(private readonly configManager: ICacheConfigManager) {}

  onConfigChanged(config: CacheServiceConfig): void {
    this.configManager.updateConfig(config);
  }
}
```

## Tests & Quality Gates

**Vor Refactoring:**
- Bestehende Tests müssen weiterhin bestehen
- Sicherstellen, dass Config-Observer-Verhalten weiterhin funktioniert

**Nach Refactoring:**
- Separate Tests für `CacheService` und `CacheConfigObserver`
- Integration-Tests für Zusammenarbeit beider Komponenten
- Type-Check muss bestehen
- Alle bestehenden Tests müssen weiterhin bestehen

## Akzeptanzkriterien

- ✅ `CacheService` implementiert nur `CacheServiceContract`
- ✅ `CacheConfigObserver` ist separate Klasse
- ✅ Alle bestehenden Tests bestehen weiterhin
- ✅ Separate Unit-Tests für beide Komponenten
- ✅ Type-Check besteht ohne Fehler

## Notes

- **Breaking Changes:** Minimal - `CacheService` behält `getConfigManager()` für externe Nutzung
- **Aufwand:** Niedrig (1 Stunde)
- **Priorität:** Niedrig - SRP-Verstoß ist minimal und akzeptabel, da Logik einfach ist
- **Verwandte Dateien:**
  - `src/infrastructure/cache/cache.interface.ts`
  - `src/infrastructure/cache/config/CacheConfigManager.ts`
  - `src/infrastructure/cache/runtime/CacheRuntime.ts`

**Wichtig:** Dieser SRP-Verstoß ist minimal und akzeptabel, da die Config-Observer-Logik einfach ist und eng mit Cache-Service verbunden ist. Eine Trennung ist optional und sollte nur erfolgen, wenn die Config-Observer-Logik komplexer wird.

