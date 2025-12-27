---
id: ISP-002
principle: ISP
severity: medium
layer: Domain (ports)
status: Proposed
---

1. Problem

PlatformCachePort vereint Lese-/Schreiboperationen, Invalidation, Statistik
und Konfigurations-Operationen in einem Interface. Viele Use-Cases benoetigen
nur Read/Write, muessen aber das komplette Interface implementieren oder mocken.

2. Evidence (Belege)

- Pfad: src/domain/ports/platform-cache-port.interface.ts:22-41
- Konkrete Belege:

```ts
export interface PlatformCachePort {
  readonly isEnabled: boolean;
  readonly size: number;
  get<TValue>(key: DomainCacheKey): DomainCacheLookupResult<TValue> | null;
  set<TValue>(...): DomainCacheEntryMetadata;
  delete(key: DomainCacheKey): boolean;
  has(key: DomainCacheKey): boolean;
  clear(): number;
  invalidateWhere(predicate: DomainCacheInvalidationPredicate): number;
  getMetadata(key: DomainCacheKey): DomainCacheEntryMetadata | null;
  getStatistics(): DomainCacheStatistics;
  getOrSet<TValue>(...): Promise<Result<DomainCacheLookupResult<TValue>, string>>;
}
```

3. SOLID-Analyse

ISP-Verstoss: Ein "fat interface" zwingt Clients in Abhaengigkeiten, die sie
nicht benoetigen. Das erschwert alternative Implementierungen (Redis, Headless)
und Fuehrung von Tests.

4. Zielbild

- Aufteilung in kleinere Ports:
  - CacheReaderPort (get/has/getMetadata)
  - CacheWriterPort (set/delete/clear)
  - CacheInvalidationPort (invalidateWhere)
  - CacheStatsPort (getStatistics, size, isEnabled)
  - CacheComputePort (getOrSet)

5. Loesungsvorschlag

Approach A (empfohlen)
- Neue Ports definieren und per Komposition nutzen.
- Plattform-Adapter implementiert alle, aber Use-Cases dependieren nur auf
  Reader/Writer.

Approach B (Alternative)
- Behalte PlatformCachePort als Facade und markiere es als "Legacy".

Trade-offs
- Mehr Interfaces, dafuer granulare Abhaengigkeiten und leichtere Implementierungen.

6. Refactoring-Schritte

1) Ports definieren in domain/ports/cache/.
2) Tokens und DI-Bindings fuer Reader/Writer erstellen.
3) CachePortAdapter implementiert mehrere Ports.
4) Use-Cases/Services auf minimalen Port umstellen.

7. Beispiel-Code

After
```ts
interface CacheReaderPort {
  get<T>(key: DomainCacheKey): DomainCacheLookupResult<T> | null;
  has(key: DomainCacheKey): boolean;
}
```

8. Tests & Quality Gates

- Contract-Tests fuer Adapter (Reader/Writer).
- Mocks fuer Use-Cases nur noch minimal.

9. Akzeptanzkriterien

- Application-Services importieren keine fat cache interface mehr.
- Alternative Cache-Implementierungen koennen klein starten (Reader-only).
