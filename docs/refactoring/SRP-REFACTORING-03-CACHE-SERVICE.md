# SRP Refactoring Plan: CacheService

**Status:** 📋 Geplant
**Priorität:** 🟡 Mittel
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Cache-Operationen von Capacity-Management und Metrics-Tracking

---

## Problem

`CacheService` verletzt das Single Responsibility Principle (SRP) durch mehrere Verantwortlichkeiten:

1. **Core Cache-Operationen**: get, set, delete, has, clear
2. **TTL-Verwaltung**: Expiration-Logik
3. **Capacity-Management**: LRU-Eviction bei maxEntries
4. **Metrics-Tracking**: Cache-Hits/Misses tracken
5. **RuntimeConfig-Binding**: Live-Updates von Config

**Aktuelle Datei:** `src/infrastructure/cache/CacheService.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class CacheService implements CacheServiceContract {
  // 1. Core Cache-Operationen
  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null
  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata
  delete(key: CacheKey): boolean
  has(key: CacheKey): boolean
  clear(): number

  // 2. TTL-Verwaltung
  private isExpired(entry: InternalCacheEntry): boolean
  private handleExpiration(key: CacheKey): void

  // 3. Capacity-Management (LRU)
  private enforceCapacity(): void

  // 4. Metrics-Tracking
  private recordHit(): void
  private recordMiss(): void

  // 5. RuntimeConfig-Binding
  private bindRuntimeConfig(runtimeConfig?: RuntimeConfigService): void
  private updateConfig(partial: Partial<CacheServiceConfig>): void
}
```

**Probleme:**
- Cache-Logik, Capacity-Management und Metrics sind vermischt
- LRU-Algorithmus ist fest eingebaut (nicht austauschbar)
- Metrics-Tracking könnte über Observer-Pattern erfolgen
- Schwer testbar (mehrere Concerns)

---

## Ziel-Architektur

### 1. CacheService (Core Cache-Operationen)
**Verantwortlichkeit:** Nur Core Cache-Operationen und TTL

```typescript
export class CacheService implements CacheServiceContract {
  // Core-Operationen
  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null
  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata
  delete(key: CacheKey): boolean
  has(key: CacheKey): boolean
  clear(): number

  // TTL-Verwaltung
  private isExpired(entry: InternalCacheEntry): boolean
  private handleExpiration(key: CacheKey): void
}
```

### 2. CacheCapacityManager (Capacity-Management)
**Verantwortlichkeit:** Nur Capacity-Management und Eviction

```typescript
export interface CacheEvictionStrategy {
  /**
   * Wählt Einträge zur Entfernung aus, wenn Capacity überschritten wird.
   */
  selectForEviction(
    entries: Map<CacheKey, InternalCacheEntry>,
    maxEntries: number
  ): CacheKey[]
}

export class LRUEvictionStrategy implements CacheEvictionStrategy {
  selectForEviction(
    entries: Map<CacheKey, InternalCacheEntry>,
    maxEntries: number
  ): CacheKey[] {
    // LRU-Algorithmus
  }
}

export class CacheCapacityManager {
  constructor(
    private readonly strategy: CacheEvictionStrategy,
    private readonly store: Map<CacheKey, InternalCacheEntry>
  ) {}

  /**
   * Erzwingt Capacity-Limit durch Eviction.
   */
  enforceCapacity(maxEntries: number): number {
    if (this.store.size <= maxEntries) {
      return 0;
    }

    const keysToEvict = this.strategy.selectForEviction(this.store, maxEntries);
    for (const key of keysToEvict) {
      this.store.delete(key);
    }

    return keysToEvict.length;
  }
}
```

### 3. CacheMetricsCollector (Metrics-Tracking)
**Verantwortlichkeit:** Nur Metrics-Tracking (optional über Observer)

```typescript
export interface CacheMetricsObserver {
  onCacheHit(key: CacheKey): void
  onCacheMiss(key: CacheKey): void
  onCacheEviction(key: CacheKey): void
}

export class CacheMetricsCollector implements CacheMetricsObserver {
  constructor(private readonly metricsCollector?: MetricsCollector) {}

  onCacheHit(key: CacheKey): void {
    this.metricsCollector?.recordCacheAccess(true);
  }

  onCacheMiss(key: CacheKey): void {
    this.metricsCollector?.recordCacheAccess(false);
  }

  onCacheEviction(key: CacheKey): void {
    // Optional: Eviction-Metrics
  }
}
```

---

## Schritt-für-Schritt Migration

### Phase 1: CacheCapacityManager extrahieren

1. **Eviction-Strategy Interface erstellen:**
   ```typescript
   // src/infrastructure/cache/eviction-strategy.interface.ts
   export interface CacheEvictionStrategy {
     selectForEviction(
       entries: Map<CacheKey, InternalCacheEntry>,
       maxEntries: number
     ): CacheKey[]
   }
   ```

2. **LRU-Strategy implementieren:**
   ```typescript
   // src/infrastructure/cache/lru-eviction-strategy.ts
   export class LRUEvictionStrategy implements CacheEvictionStrategy {
     selectForEviction(
       entries: Map<CacheKey, InternalCacheEntry>,
       maxEntries: number
     ): CacheKey[] {
       const toRemove = entries.size - maxEntries;
       if (toRemove <= 0) return [];

       // Sortiere nach lastAccessedAt (LRU)
       const sorted = Array.from(entries.entries())
         .sort((a, b) => a[1].metadata.lastAccessedAt - b[1].metadata.lastAccessedAt);

       return sorted.slice(0, toRemove).map(([key]) => key);
     }
   }
   ```

3. **CacheCapacityManager erstellen:**
   ```typescript
   // src/infrastructure/cache/cache-capacity-manager.ts
   export class CacheCapacityManager {
     constructor(
       private readonly strategy: CacheEvictionStrategy,
       private readonly store: Map<CacheKey, InternalCacheEntry>
     ) {}

     enforceCapacity(maxEntries: number): number {
       if (this.store.size <= maxEntries) {
         return 0;
       }

       const keysToEvict = this.strategy.selectForEviction(this.store, maxEntries);
       for (const key of keysToEvict) {
         this.store.delete(key);
       }

       return keysToEvict.length;
     }
   }
   ```

### Phase 2: CacheMetricsCollector extrahieren

1. **Observer-Interface erstellen:**
   ```typescript
   // src/infrastructure/cache/cache-metrics-observer.interface.ts
   export interface CacheMetricsObserver {
     onCacheHit(key: CacheKey): void
     onCacheMiss(key: CacheKey): void
     onCacheEviction(key: CacheKey): void
   }
   ```

2. **CacheMetricsCollector erstellen:**
   ```typescript
   // src/infrastructure/cache/cache-metrics-collector.ts
   export class CacheMetricsCollector implements CacheMetricsObserver {
     constructor(private readonly metricsCollector?: MetricsCollector) {}

     onCacheHit(key: CacheKey): void {
       this.metricsCollector?.recordCacheAccess(true);
     }

     onCacheMiss(key: CacheKey): void {
       this.metricsCollector?.recordCacheAccess(false);
     }

     onCacheEviction(key: CacheKey): void {
       // Optional: Eviction-Metrics
     }
   }
   ```

### Phase 3: CacheService refactoren

1. **Dependencies injizieren:**
   ```typescript
   export class CacheService implements CacheServiceContract {
     private readonly capacityManager: CacheCapacityManager
     private readonly metricsObserver: CacheMetricsObserver

     constructor(
       config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
       private readonly metricsCollector?: MetricsCollector,
       private readonly clock: () => number = () => Date.now(),
       runtimeConfig?: RuntimeConfigService,
       capacityManager?: CacheCapacityManager, // Optional für Tests
       metricsObserver?: CacheMetricsObserver // Optional für Tests
     ) {
       // ...
       this.capacityManager = capacityManager ?? new CacheCapacityManager(
         new LRUEvictionStrategy(),
         this.store
       );
       this.metricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
     }
   }
   ```

2. **enforceCapacity() delegieren:**
   ```typescript
   private enforceCapacity(): void {
     if (!this.config.maxEntries || this.store.size <= this.config.maxEntries) {
       return;
     }

     const evicted = this.capacityManager.enforceCapacity(this.config.maxEntries);
     if (evicted > 0) {
       this.stats.evictions += evicted;
     }
   }
   ```

3. **Metrics-Tracking delegieren:**
   ```typescript
   private recordHit(): void {
     this.metricsObserver.onCacheHit(/* key */);
     this.stats.hits++;
   }

   private recordMiss(): void {
     this.metricsObserver.onCacheMiss(/* key */);
     this.stats.misses++;
   }
   ```

### Phase 4: DI-Integration

1. **Tokens erstellen:**
   ```typescript
   // src/infrastructure/shared/tokens/infrastructure.tokens.ts
   export const cacheEvictionStrategyToken: InjectionToken<CacheEvictionStrategy> =
     createToken<CacheEvictionStrategy>("cacheEvictionStrategy");
   export const cacheCapacityManagerToken: InjectionToken<CacheCapacityManager> =
     createToken<CacheCapacityManager>("cacheCapacityManager");
   export const cacheMetricsObserverToken: InjectionToken<CacheMetricsObserver> =
     createToken<CacheMetricsObserver>("cacheMetricsObserver");
   ```

2. **In DI-Config registrieren:**
   ```typescript
   // src/framework/config/modules/cache-services.config.ts
   container.registerClass(
     cacheEvictionStrategyToken,
     LRUEvictionStrategy,
     ServiceLifecycle.SINGLETON
   );

   // CacheCapacityManager wird von CacheService erstellt (nicht über DI)
   // CacheMetricsObserver wird von CacheService erstellt (nicht über DI)
   ```

---

## Breaking Changes

### API-Änderungen

1. **CacheService:**
   - ✅ Keine öffentlichen API-Änderungen
   - ✅ Nur interne Refaktorierung

2. **Neue Abhängigkeiten:**
   - `CacheService` kann optional `CacheCapacityManager` und `CacheMetricsObserver` injizieren

### Migration für externe Nutzer

**Keine Breaking Changes** - API bleibt stabil.

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Austauschbarkeit**: Eviction-Strategy kann ausgetauscht werden (z.B. FIFO, LFU)
3. ✅ **Bessere Testbarkeit**: Capacity-Management und Metrics isoliert testbar
4. ✅ **Observer-Pattern**: Metrics-Tracking über Observer (erweiterbar)
5. ✅ **Einfachere Wartung**: Änderungen an LRU-Algorithmus betreffen nur Strategy

---

## Risiken

1. **Niedrig**: Nur interne Refaktorierung
2. **Niedrig**: Keine öffentlichen API-Änderungen
3. **Niedrig**: Tests müssen angepasst werden

---

## Erweiterte Möglichkeiten

### Alternative Eviction-Strategien

```typescript
// FIFO (First-In-First-Out)
export class FIFOEvictionStrategy implements CacheEvictionStrategy {
  selectForEviction(
    entries: Map<CacheKey, InternalCacheEntry>,
    maxEntries: number
  ): CacheKey[] {
    // Sortiere nach createdAt
  }
}

// LFU (Least Frequently Used)
export class LFUEvictionStrategy implements CacheEvictionStrategy {
  selectForEviction(
    entries: Map<CacheKey, InternalCacheEntry>,
    maxEntries: number
  ): CacheKey[] {
    // Sortiere nach hits
  }
}
```

---

## Checkliste

- [ ] `CacheEvictionStrategy` Interface erstellen
- [ ] `LRUEvictionStrategy` implementieren
- [ ] `CacheCapacityManager` erstellen
- [ ] `CacheMetricsObserver` Interface erstellen
- [ ] `CacheMetricsCollector` erstellen
- [ ] `CacheService` refactoren
- [ ] `enforceCapacity()` delegieren
- [ ] Metrics-Tracking delegieren
- [ ] Unit-Tests für `CacheCapacityManager` schreiben
- [ ] Unit-Tests für `CacheMetricsCollector` schreiben
- [ ] Unit-Tests für `CacheService` aktualisieren
- [ ] Integration-Tests aktualisieren
- [ ] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/infrastructure/cache/CacheService.ts`
- **Cache Interface:** `src/infrastructure/cache/cache.interface.ts`
- **MetricsCollector:** `src/infrastructure/observability/metrics-collector.ts`

