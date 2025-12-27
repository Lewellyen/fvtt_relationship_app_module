---
id: SRP-001
principle: SRP
severity: medium
layer: Infrastructure (cache)
status: Proposed
---

1. Problem

CacheService buendelt Cache-Kernlogik, Konfigurationsverwaltung, Eviction-Policy-Auswahl,
Ablaufverwaltung, Statistik/Metrik-Erfassung und beobachtet Konfigurationsaenderungen.
Damit gibt es mehrere voneinander unabhhaengige Aenderungsgruende in einer Klasse.
Das erschwert Tests, Austausch von Teilkomponenten und klare Verantwortlichkeiten.

2. Evidence (Belege)

- Pfad: src/infrastructure/cache/CacheService.ts:40-88, 99-105
- Konkrete Belege:

```ts
export class CacheService implements CacheServiceContract, CacheConfigObserver {
  private readonly store: ICacheStore;
  private readonly expirationManager: ICacheExpirationManager;
  private readonly statisticsCollector: ICacheStatisticsCollector;
  private readonly configManager: ICacheConfigManager;
  private readonly capacityManager: CacheCapacityManager;
  ...
  this.configManager = configManager ?? new CacheConfigManager(config);
  const resolvedMetricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
  this.statisticsCollector =
    statisticsCollector ?? new CacheStatisticsCollector(resolvedMetricsObserver);
  this.expirationManager = expirationManager ?? new CacheExpirationManager(clock);
  ...
}

getConfigManager(): ICacheConfigManager {
  return this.configManager;
}
```

3. SOLID-Analyse

SRP-Verstoss: CacheService steuert mehrere, fachlich unterschiedliche Verantwortungen
(Policy, Storage, Expiration, Stats, Config-Sync, Metrics). Jede Aenderung an einer
dieser Achsen veraendert die Klasse. Das ist ein "God Service" in klein, trotz
Delegation. Folge: hohe Kopplung, erschwerte Isolation in Tests, unklare Grenzen.

4. Zielbild

- Cache-Kernlogik ist von Konfiguration, Telemetrie und Policy-Entscheidungen getrennt.
- Klar definierte Komponenten:
  - CacheRuntime (get/set/getOrSet)
  - CachePolicy (Eviction/Expiration)
  - CacheTelemetry (Stats/Metrics)
  - CacheConfigObserver separat (z.B. CacheConfigSync)

5. Loesungsvorschlag

Approach A (empfohlen)
- Introduce CacheRuntime + CachePolicy + CacheTelemetry als explizite Komponenten.
- CacheService wird eine duenne Fassade (oder entfällt zugunsten einer Composition Root).
- CacheConfigObserver wird aus CacheService entfernt und in CacheConfigSync gekapselt.

Approach B (Alternative)
- CacheService bleibt Fassade, aber extrahiert klar benannte Subservices
  (CacheStoreFacade, ExpirationPolicy, TelemetryReporter) und expose nur Interfaces.

Trade-offs
- Mehr Klassen/Interfaces, dafuer entkoppelte Tests und klare Austauschbarkeit.

6. Refactoring-Schritte

1) Neue Interfaces einfuehren: CacheRuntime, CachePolicy, CacheTelemetry.
2) CacheService in eine Fassade umbauen, die nur delegiert.
3) CacheConfigObserver aus CacheService entfernen; CacheConfigSync nutzt einen separaten
   ConfigObserver, der nur Config-Updates verarbeitet.
4) DI-Registrierung anpassen (framework/config/modules/cache-services.config.ts).
5) Tests auf neue Komponenten splitten (CacheRuntime/Policy/Telemetry).

7. Beispiel-Code

Before
```ts
class CacheService implements CacheServiceContract, CacheConfigObserver { ... }
```

After
```ts
interface CacheRuntime {
  get<T>(key: CacheKey): CacheLookupResult<T> | null;
  set<T>(key: CacheKey, value: T, options?: CacheSetOptions): CacheEntryMetadata;
  getOrSet<T>(...): Promise<Result<CacheLookupResult<T>, string>>;
}

class CacheFacade implements CacheServiceContract {
  constructor(
    private readonly runtime: CacheRuntime,
    private readonly policy: CachePolicy,
    private readonly telemetry: CacheTelemetry
  ) {}
}
```

8. Tests & Quality Gates

- Neue Unit-Tests fuer CacheRuntime/CachePolicy/CacheTelemetry.
- Contract-Tests fuer CacheServiceContract gegen CacheFacade.
- Typecheck + coverage fuer neue Interfaces.

9. Akzeptanzkriterien

- CacheService implementiert nicht mehr CacheConfigObserver.
- CacheConfigSync kommuniziert nur ueber dediziertes ConfigObserver-Interface.
- CacheRuntime/Policy/Telemetry sind austauschbar und separat testbar.
