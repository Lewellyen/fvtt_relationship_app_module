---
id: ISP-001
principle: ISP
severity: medium
layer: Infrastructure (cache)
status: Proposed
---

1. Problem

Das CacheService-Interface enthaelt Methoden fuer interne Komponenten
(getConfigManager/getStore/getPolicy). Konsumenten, die nur Cache-Operationen
brauchen, muessen an diese Maintenance-APIs gekoppelt werden. Das ist eine
Interface-Segregation-Verletzung.

2. Evidence (Belege)

- Pfad: src/infrastructure/cache/cache.interface.ts

```ts
export interface CacheService {
  ...
  getConfigManager(): ICacheConfigManager;
  getStore(): ICacheStore;
  getPolicy(): CachePolicy;
}
```

- Pfad: src/infrastructure/cache/CacheConfigSync.ts

```ts
this.observer = new CacheConfigSyncObserver(
  cache.getStore(),
  cache.getPolicy(),
  cache.getConfigManager()
);
```

3. SOLID-Analyse

ISP-Verstoss: Ein Interface fuer externe Cache-Consumers und interne
Konfigurationssynchronisation vermischt. Dadurch muessen normale Clients
Methoden kennen, die sie nie verwenden.

4. Zielbild

- Separate Interfaces:
  - CacheReadWritePort (get/set/has/invalidate/...)
  - CacheMaintenancePort (config/policy/store nur fuer Sync/Observability)
- CacheConfigSync arbeitet gegen CacheMaintenancePort.

5. Loesungsvorschlag

Approach A (empfohlen)
- Split des CacheService-Interfaces in zwei Ports.
- DI bindet CacheService an beide Interfaces.

Approach B (Alternative)
- Fuehre eine dedizierte CacheConfigSyncPort ein, die nur die benoetigten
  Methoden exponiert.

Trade-offs
- Mehr Typen, dafuer sauberere Abhaengigkeiten und kleinere Mocks.

6. Refactoring-Schritte

1) Neues Interface `CacheMaintenancePort` definieren.
2) CacheService implementiert beide Interfaces.
3) CacheConfigSync nur noch auf CacheMaintenancePort dependieren.
4) Tokens fuer beide Ports einfuehren oder erweitern.
5) Consumers aktualisieren.

7. Beispiel-Code

After
```ts
interface CacheMaintenancePort {
  getConfigManager(): ICacheConfigManager;
  getStore(): ICacheStore;
  getPolicy(): CachePolicy;
}

interface CacheReadWritePort {
  get<T>(key: CacheKey): CacheLookupResult<T> | null;
  set<T>(key: CacheKey, value: T, options?: CacheSetOptions): CacheEntryMetadata;
}
```

8. Tests & Quality Gates

- Contract-Tests fuer beide Interfaces.
- CacheConfigSync-Tests mit minimalem Maintenance-Port mock.

9. Akzeptanzkriterien

- CacheReadWrite-Clients sehen keine Maintenance-Methoden.
- CacheConfigSync verwendet ausschliesslich CacheMaintenancePort.
- CacheService kann an beide Ports gebunden werden.
