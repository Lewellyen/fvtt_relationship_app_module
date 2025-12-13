---
principle: OCP
severity: low
confidence: high
component_kind: class
component_name: "CacheService"
file: "src/infrastructure/cache/CacheService.ts"
location:
  start_line: 67
  end_line: 69
tags: ["open-closed", "strategy", "cache", "eviction"]
---

# Problem

Die `CacheService`-Klasse erstellt eine `LRUEvictionStrategy`-Instanz direkt im Konstruktor, obwohl das `CacheEvictionStrategy`-Interface existiert und andere Strategien implementiert werden könnten. Während neue Strategien theoretisch hinzugefügt werden können, ist die Standard-Strategie hardcodiert, was gegen das Open/Closed Principle verstoßen könnte.

## Evidence

```67:69:src/infrastructure/cache/CacheService.ts
    // Capacity manager needs store and strategy
    this.capacityManager =
      capacityManager ?? new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
```

Die Klasse:
1. Erstellt direkt `new LRUEvictionStrategy()` als Default
2. Obwohl `capacityManager` optional injizierbar ist, wird die Strategie hardcodiert erstellt
3. Das `CacheEvictionStrategy`-Interface existiert, aber die Konfiguration erlaubt keine Strategie-Auswahl

## Impact

- **Geringe Auswirkung**: Die Strategie ist über `capacityManager` injizierbar (für Tests)
- **Konfigurierbarkeit**: Neue Eviction-Strategien können nicht über Konfiguration gewählt werden
- **Erweiterbarkeit**: Neue Strategien können zwar implementiert werden, aber die Standard-Strategie bleibt LRU
- **Akzeptabel**: Für die meisten Use-Cases ist LRU eine sinnvolle Default-Strategie

## Recommendation

**Option 1: Strategy Selection über Config (Empfohlen)**

Erweitere `CacheServiceConfig` um eine Strategie-Auswahl:

```typescript
export type EvictionStrategyType = "lru" | "fifo" | "lfu" | "custom";

export interface CacheServiceConfig {
  enabled: boolean;
  defaultTtlMs: number;
  maxEntries?: number;
  namespace?: string;
  evictionStrategy?: EvictionStrategyType;
}

export class CacheService implements CacheServiceContract {
  private createEvictionStrategy(strategyType?: EvictionStrategyType): CacheEvictionStrategy {
    switch (strategyType ?? "lru") {
      case "lru":
        return new LRUEvictionStrategy();
      case "fifo":
        return new FIFOEvictionStrategy();
      case "lfu":
        return new LFUEvictionStrategy();
      default:
        return new LRUEvictionStrategy();
    }
  }

  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    // ...
  ) {
    // ...
    const strategy = this.createEvictionStrategy(config.evictionStrategy);
    this.capacityManager =
      capacityManager ?? new CacheCapacityManager(strategy, this.store);
  }
}
```

**Option 2: Strategy Factory Pattern (Alternative)**

Verwende eine Factory für Strategie-Erstellung:

```typescript
export interface CacheEvictionStrategyFactory {
  createStrategy(type: string): CacheEvictionStrategy;
}

export class DefaultEvictionStrategyFactory implements CacheEvictionStrategyFactory {
  createStrategy(type: string): CacheEvictionStrategy {
    switch (type) {
      case "lru":
        return new LRUEvictionStrategy();
      case "fifo":
        return new FIFOEvictionStrategy();
      default:
        return new LRUEvictionStrategy();
    }
  }
}

export class CacheService implements CacheServiceContract {
  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    private readonly strategyFactory?: CacheEvictionStrategyFactory,
    // ...
  ) {
    // ...
    const factory = strategyFactory ?? new DefaultEvictionStrategyFactory();
    const strategy = factory.createStrategy(config.evictionStrategy ?? "lru");
    this.capacityManager =
      capacityManager ?? new CacheCapacityManager(strategy, this.store);
  }
}
```

**Option 3: Keine Änderung (Akzeptabel)**

Da:
- Die Strategie bereits über `capacityManager` injizierbar ist
- LRU ist eine sinnvolle Default-Strategie
- Die meisten Use-Cases benötigen keine andere Strategie
- Die Komplexität einer Konfiguration könnte über-engineering sein

## Example Fix

Falls Option 1 gewählt wird:

```typescript
// cache.interface.ts
export type EvictionStrategyType = "lru" | "fifo" | "lfu";

export interface CacheServiceConfig {
  enabled: boolean;
  defaultTtlMs: number;
  maxEntries?: number;
  namespace?: string;
  evictionStrategy?: EvictionStrategyType; // Neue Option
}

// CacheService.ts
export class CacheService implements CacheServiceContract {
  private createDefaultStrategy(strategyType?: EvictionStrategyType): CacheEvictionStrategy {
    const type = strategyType ?? "lru";
    switch (type) {
      case "lru":
        return new LRUEvictionStrategy();
      case "fifo":
        return new FIFOEvictionStrategy();
      case "lfu":
        return new LFUEvictionStrategy();
      default:
        return new LRUEvictionStrategy();
    }
  }

  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    // ...
    capacityManager?: CacheCapacityManager,
    // ...
  ) {
    // ...
    // Nur wenn capacityManager nicht injiziert wurde, erstelle Default
    if (!capacityManager) {
      const strategy = this.createDefaultStrategy(config.evictionStrategy);
      this.capacityManager = new CacheCapacityManager(strategy, this.store);
    } else {
      this.capacityManager = capacityManager;
    }
  }
}
```

## Notes

- **Aktuelle Implementierung**: Funktional korrekt, aber nicht konfigurierbar
- **Testbarkeit**: Tests können bereits eigene Strategien injizieren
- **Erweiterbarkeit**: Neue Strategien können implementiert werden, aber nicht über Config gewählt
- **Bewertung**: Geringe Priorität - die aktuelle Implementierung ist für die meisten Fälle ausreichend
- **YAGNI-Prinzip**: Falls keine Anforderungen für andere Strategien bestehen, könnte Option 3 (keine Änderung) angemessen sein

