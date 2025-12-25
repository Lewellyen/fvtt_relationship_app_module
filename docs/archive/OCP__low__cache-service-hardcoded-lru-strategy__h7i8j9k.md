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

**Vorher (hardcodiert):**
```67:69:src/infrastructure/cache/CacheService.ts
    // Capacity manager needs store and strategy
    this.capacityManager =
      capacityManager ?? new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
```

**Nachher (OCP-konform mit Registry):**
```68:87:src/infrastructure/cache/CacheService.ts
    // Capacity manager needs store and strategy
    // Use registry-based strategy selection (OCP-compliant)
    if (capacityManager) {
      this.capacityManager = capacityManager;
    } else {
      const registry = EvictionStrategyRegistry.getInstance();
      // Ensure default LRU strategy is registered
      if (!registry.has("lru")) {
        registry.register("lru", new LRUEvictionStrategy());
      }
      // Get strategy from registry (defaults to "lru" if not specified)
      const strategyKey = config.evictionStrategyKey ?? "lru";
      const strategy = registry.getOrDefault(strategyKey, "lru");
      if (!strategy) {
        // Fallback to LRU if strategy not found (should not happen if "lru" is registered)
        this.capacityManager = new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
      } else {
        this.capacityManager = new CacheCapacityManager(strategy, this.store);
      }
    }
```

**Problem (vorher):**
1. Erstellt direkt `new LRUEvictionStrategy()` als Default
2. Obwohl `capacityManager` optional injizierbar ist, wird die Strategie hardcodiert erstellt
3. Das `CacheEvictionStrategy`-Interface existiert, aber die Konfiguration erlaubt keine Strategie-Auswahl

**Lösung (nachher):**
1. ✅ Verwendet `EvictionStrategyRegistry` zur Strategie-Auswahl
2. ✅ Strategien können zur Laufzeit registriert werden, ohne Code-Änderung
3. ✅ Optional konfigurierbar über `evictionStrategyKey` in der Config

## Impact

- **Geringe Auswirkung**: Die Strategie ist über `capacityManager` injizierbar (für Tests)
- **Konfigurierbarkeit**: Neue Eviction-Strategien können nicht über Konfiguration gewählt werden
- **Erweiterbarkeit**: Neue Strategien können zwar implementiert werden, aber die Standard-Strategie bleibt LRU
- **Akzeptabel**: Für die meisten Use-Cases ist LRU eine sinnvolle Default-Strategie

## Recommendation

**✅ Implementiert: Strategy Registry Pattern (OCP-konform)**

Die Lösung verwendet eine **Strategy Registry**, die zur Laufzeit erweiterbar ist, ohne den `CacheService` zu ändern. Dies ist wirklich OCP-konform, da:

- ✅ **Kein Switch-Statement**: Neue Strategien werden zur Registry hinzugefügt, nicht zu einem Switch
- ✅ **Erweiterbar ohne Modifikation**: Der `CacheService` muss nicht geändert werden, wenn neue Strategien hinzugefügt werden
- ✅ **Laufzeit-Registrierung**: Strategien können zur Laufzeit registriert werden
- ✅ **Konfigurierbar**: Optional kann über `evictionStrategyKey` in der Config eine Strategie gewählt werden

**Implementierung:**

1. **EvictionStrategyRegistry** (Singleton): Verwaltet Strategien in einer Map
2. **CacheServiceConfig**: Erweitert um optionales `evictionStrategyKey?: string`
3. **CacheService**: Verwendet die Registry zur Strategie-Auswahl

```typescript
// eviction-strategy-registry.ts
export class EvictionStrategyRegistry {
  private static instance: EvictionStrategyRegistry | null = null;
  private readonly strategies = new Map<string, CacheEvictionStrategy>();

  static getInstance(): EvictionStrategyRegistry { /* ... */ }
  register(key: string, strategy: CacheEvictionStrategy): boolean { /* ... */ }
  get(key: string): CacheEvictionStrategy | undefined { /* ... */ }
  getOrDefault(key: string | undefined, defaultKey: string): CacheEvictionStrategy | undefined { /* ... */ }
}

// cache.interface.ts
export interface CacheServiceConfig {
  enabled: boolean;
  defaultTtlMs: number;
  maxEntries?: number;
  namespace?: string;
  evictionStrategyKey?: string; // Optional: Key für Registry-basierte Strategie-Auswahl
}

// CacheService.ts
constructor(...) {
  // ...
  if (capacityManager) {
    this.capacityManager = capacityManager;
  } else {
    const registry = EvictionStrategyRegistry.getInstance();
    // Ensure default LRU strategy is registered
    if (!registry.has("lru")) {
      registry.register("lru", new LRUEvictionStrategy());
    }
    const strategyKey = config.evictionStrategyKey ?? "lru";
    const strategy = registry.getOrDefault(strategyKey, "lru");
    this.capacityManager = new CacheCapacityManager(strategy, this.store);
  }
}
```

**Verwendung:**

```typescript
// Neue Strategie registrieren (z.B. in einem Initialisierungsmodul)
const registry = EvictionStrategyRegistry.getInstance();
registry.register("fifo", new FIFOEvictionStrategy());
registry.register("lfu", new LFUEvictionStrategy());

// In Config verwenden
const config: CacheServiceConfig = {
  enabled: true,
  defaultTtlMs: 60000,
  evictionStrategyKey: "fifo" // Verwendet FIFO-Strategie
};
```

## Implementierte Lösung

Die OCP-konforme Lösung wurde implementiert:

**Dateien:**
- `src/infrastructure/cache/eviction-strategy-registry.ts` (neu)
- `src/infrastructure/cache/cache.interface.ts` (erweitert)
- `src/infrastructure/cache/CacheService.ts` (angepasst)

**Vorteile:**
- ✅ **OCP-konform**: Kein Switch-Statement, neue Strategien können ohne Code-Änderung hinzugefügt werden
- ✅ **Erweiterbar**: Neue Strategien werden zur Registry hinzugefügt, nicht zum CacheService
- ✅ **Konfigurierbar**: Optional über `evictionStrategyKey` in der Config
- ✅ **Rückwärtskompatibel**: Default bleibt LRU, bestehender Code funktioniert weiterhin
- ✅ **Testbar**: Registry kann in Tests geleert/überschrieben werden

**Migration:**
- Bestehender Code funktioniert ohne Änderungen (LRU bleibt Default)
- Neue Strategien können zur Registry hinzugefügt werden
- Optional kann `evictionStrategyKey` in der Config gesetzt werden

## Notes

- **Status**: ✅ **GELÖST** - OCP-konforme Registry-Lösung implementiert
- **Implementierung**: Strategy Registry Pattern ohne Switch-Statement
- **Erweiterbarkeit**: Neue Strategien können zur Registry hinzugefügt werden, ohne den CacheService zu ändern
- **Konfigurierbarkeit**: Optional über `evictionStrategyKey` in der Config
- **Rückwärtskompatibilität**: Vollständig gegeben, LRU bleibt Default
- **Testbarkeit**: Registry kann in Tests geleert/überschrieben werden

