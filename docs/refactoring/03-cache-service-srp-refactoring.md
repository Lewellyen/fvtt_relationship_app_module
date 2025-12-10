# Refactoring-Plan: CacheService SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Hoch
**Betroffene Datei:** `src/infrastructure/cache/CacheService.ts`

---

## Problem-Beschreibung

Die `CacheService`-Klasse verletzt das Single Responsibility Principle (SRP) mit 6 verschiedenen Verantwortlichkeiten:

1. **Cache-Operationen** (`get`, `set`, `delete`, `has`, `clear`)
2. **TTL-Management** (Expiration-Checking, Metadata-Erstellung)
3. **Capacity-Management** (`enforceCapacity`, Eviction)
4. **Statistics-Tracking** (`hits`, `misses`, `evictions`)
5. **Metrics-Integration** (`metricsObserver`)
6. **Config-Management** (`updateConfig`, Config-Synchronisation)

**Aktuelle Architektur:**
- CacheService kombiniert alle Concerns in einer Klasse
- `CacheCapacityManager` existiert bereits, aber CacheService ruft direkt auf
- Statistics werden direkt in CacheService getrackt
- TTL-Logik ist direkt in CacheService
- Config-Management ist direkt in CacheService

**Problem:** Storage, Expiration, Capacity, Statistics und Config sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
CacheService (Facade - nur Koordination)
├── CacheStore (nur Storage)
│   ├── get(key)
│   ├── set(key, entry)
│   ├── delete(key)
│   ├── has(key)
│   └── clear()
├── CacheExpirationManager (nur TTL/Expiration)
│   ├── isExpired(entry)
│   ├── createMetadata(key, options, now)
│   └── handleExpiration(key)
├── CacheCapacityManager (bereits vorhanden)
│   └── enforceCapacity()
├── CacheStatisticsCollector (nur Statistics)
│   ├── recordHit()
│   ├── recordMiss()
│   ├── recordEviction()
│   └── getStatistics() → CacheStatistics
└── CacheConfigManager (nur Config)
    ├── updateConfig(config)
    ├── getConfig() → CacheServiceConfig
    └── isEnabled() → boolean
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `CacheService` | Nur Koordination | Delegiert zu allen Managern |
| `CacheStore` | Nur Storage-Operationen | `get`, `set`, `delete`, `has`, `clear` |
| `CacheExpirationManager` | Nur TTL/Expiration | `isExpired`, `createMetadata`, `handleExpiration` |
| `CacheCapacityManager` | Nur Capacity-Management | `enforceCapacity` (bereits vorhanden) |
| `CacheStatisticsCollector` | Nur Statistics | `recordHit`, `recordMiss`, `recordEviction`, `getStatistics` |
| `CacheConfigManager` | Nur Config-Management | `updateConfig`, `getConfig`, `isEnabled` |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von CacheService testen
   - TTL-Funktionalität testen
   - Statistics testen
   - Config-Management testen

2. **Interfaces definieren**
   ```typescript
   interface ICacheStore {
     get<TValue>(key: CacheKey): InternalCacheEntry | undefined;
     set(key: CacheKey, entry: InternalCacheEntry): void;
     delete(key: CacheKey): boolean;
     has(key: CacheKey): boolean;
     clear(): number;
     get size(): number;
     entries(): IterableIterator<[CacheKey, InternalCacheEntry]>;
   }

   interface ICacheExpirationManager {
     isExpired(entry: InternalCacheEntry, now: number): boolean;
     createMetadata(key: CacheKey, options: CacheSetOptions | undefined, now: number): CacheEntryMetadata;
     handleExpiration(key: CacheKey, store: ICacheStore): void;
   }

   interface ICacheStatisticsCollector {
     recordHit(): void;
     recordMiss(): void;
     recordEviction(): void;
     getStatistics(size: number, enabled: boolean): CacheStatistics;
     reset(): void;
   }

   interface ICacheConfigManager {
     updateConfig(config: Partial<CacheServiceConfig>): void;
     getConfig(): CacheServiceConfig;
     isEnabled(): boolean;
   }
   ```

### Phase 2: Neue Klassen erstellen

3. **CacheStore erstellen**
   - Datei: `src/infrastructure/cache/store/CacheStore.ts`
   - Implementiert `ICacheStore`
   - Enthält nur Storage-Logik (Map-basiert)
   - Tests schreiben

4. **CacheExpirationManager erstellen**
   - Datei: `src/infrastructure/cache/expiration/CacheExpirationManager.ts`
   - Implementiert `ICacheExpirationManager`
   - Enthält TTL-Logik aus CacheService
   - Tests schreiben

5. **CacheStatisticsCollector erstellen**
   - Datei: `src/infrastructure/cache/statistics/CacheStatisticsCollector.ts`
   - Implementiert `ICacheStatisticsCollector`
   - Enthält Statistics-Tracking aus CacheService
   - Tests schreiben

6. **CacheConfigManager erstellen**
   - Datei: `src/infrastructure/cache/config/CacheConfigManager.ts`
   - Implementiert `ICacheConfigManager`
   - Enthält Config-Management aus CacheService
   - Tests schreiben

### Phase 3: CacheService refactoren

7. **CacheService umbauen**
   - Alle Manager als Dependencies injizieren
   - CacheService wird zur reinen Facade
   - Alle Methoden delegieren zu entsprechenden Managern
   - `get()`: Store → Expiration → Statistics
   - `set()`: Expiration → Store → Capacity → Statistics
   - `delete()`: Store → Statistics
   - `clear()`: Store → Statistics
   - `getStatistics()`: Statistics → Config

8. **Constructor anpassen**
   - Manager als Parameter übergeben
   - Factory-Methoden anpassen

9. **Private Methoden entfernen/verschieben**
   - `accessEntry()` → delegiert zu Store + Expiration
   - `createMetadata()` → delegiert zu ExpirationManager
   - `isExpired()` → delegiert zu ExpirationManager
   - `handleExpiration()` → delegiert zu ExpirationManager
   - `enforceCapacity()` → delegiert zu CapacityManager
   - `updateConfig()` → delegiert zu ConfigManager

### Phase 4: Integration & Tests

10. **Integration Tests**
    - CacheService mit allen Managern zusammen testen
    - Vollständiger Flow: Set → Get → Expiration → Eviction
    - Statistics werden korrekt getrackt
    - Config-Updates funktionieren

11. **Performance Tests**
    - Sicherstellen, dass keine Performance-Regression auftritt
    - Delegation sollte nicht langsamer sein

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: Alle Public-Methoden von `CacheService` bleiben erhalten
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/cache-service-srp`
2. **Manager-Klassen implementieren**: Parallel zu bestehendem Code
3. **CacheService schrittweise umbauen**: Store → Expiration → Statistics → Config
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **CacheStore**
  - `get()`, `set()`, `delete()`, `has()`, `clear()`
  - Size-Tracking
  - Iteration über Entries

- **CacheExpirationManager**
  - `isExpired()` mit verschiedenen TTLs
  - `createMetadata()` mit verschiedenen Options
  - `handleExpiration()` entfernt Entry korrekt

- **CacheStatisticsCollector**
  - `recordHit()`, `recordMiss()`, `recordEviction()`
  - `getStatistics()` gibt korrekte Werte zurück
  - `reset()` setzt Statistics zurück

- **CacheConfigManager**
  - `updateConfig()` aktualisiert Config korrekt
  - `getConfig()` gibt aktuelle Config zurück
  - `isEnabled()` gibt korrekten Status zurück

- **CacheService (refactored)**
  - Alle Public-Methoden delegieren korrekt
  - Koordination zwischen Managern funktioniert

### Integration Tests

- **CacheService als Facade**
  - Vollständiger Flow: Set → Get → Expiration → Eviction
  - Statistics werden korrekt getrackt
  - Config-Updates funktionieren
  - Metrics-Integration funktioniert

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API von `CacheService` bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Koordinations-Fehler**
   - **Risiko**: Manager koordinieren nicht korrekt
   - **Mitigation**: Umfassende Integration Tests

3. **State-Synchronisation**
   - **Risiko**: Statistics und Store sind nicht synchron
   - **Mitigation**: Atomic Operations, Tests

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ CacheService ist reine Facade (nur Koordination)
- ✅ CacheStore verwaltet nur Storage
- ✅ CacheExpirationManager verwaltet nur TTL/Expiration
- ✅ CacheStatisticsCollector verwaltet nur Statistics
- ✅ CacheConfigManager verwaltet nur Config
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll CacheStore als Singleton oder pro CacheService-Instanz sein?
2. Wie wird Expiration-Handling mit Statistics synchronisiert?
3. Soll CacheConfigManager auch für Runtime-Config-Sync zuständig sein?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [CacheService Source Code](../../src/infrastructure/cache/CacheService.ts)
- [CacheCapacityManager](../../src/infrastructure/cache/cache-capacity-manager.ts)
- [Cache Interface](../../src/infrastructure/cache/cache.interface.ts)

---

**Letzte Aktualisierung:** 2025-12-10

