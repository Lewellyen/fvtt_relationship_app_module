# DIP (Dependency Inversion Principle) - Infrastructure Layer (Batch 3)

## Übersicht

Analyse des Infrastructure-Layers auf Verstöße gegen das Dependency Inversion Principle.

## Zusammenfassung

**Gefundene Findings:** 7 (Batch 1: 2, Batch 3: 2, Neu: 3)
- **High Severity:** 2 (beide Batch 1, bereits behoben)
- **Medium Severity:** 4 (Batch 3: 2, Neu: 2)
- **Low Severity:** 1 (Neu)

Der Infrastructure-Layer enthält erwartungsgemäß konkrete Implementierungen, aber einige Abhängigkeiten könnten besser abstrahiert werden. Neue Findings betreffen Application- und Infrastructure-Layer.

## Findings

### High Severity (Batch 1)

1. **[Valibot Dependency in Domain](./findings/DIP__high__valibot-dependency-in-domain__a1b2c3d.md)**
   - **Datei:** `src/domain/types/log-level.ts`
   - **Problem:** Domain-Layer importiert direkt die Infrastructure-Bibliothek `valibot`
   - **Empfehlung:** Schema nach Infrastructure verschieben oder Abstraktion einführen

2. **[Valibot Type Dependency in Settings Port](./findings/DIP__high__valibot-type-dependency-in-settings-port__e4f5g6h.md)**
   - **Datei:** `src/domain/ports/platform-settings-port.interface.ts`
   - **Problem:** Port-Interface verwendet `v.BaseSchema` (Valibot-Typ) in Methodensignatur
   - **Empfehlung:** Abstraktion `ValidationSchema<T>` Interface einführen

### Medium Severity (Batch 3)

3. **[Foundry Adapters Concrete Foundry APIs](./findings/DIP__medium__foundry-adapters-concrete-foundry-apis__f5g6h7i.md)** (Batch 3)
   - **Datei:** `src/infrastructure/adapters/foundry/ports/v13/`
   - **Problem:** Foundry V13 Ports haben direkte Abhängigkeiten zu konkreten Foundry VTT Framework-APIs
   - **Empfehlung:** Akzeptabel für Adapter, aber Option 2 (DI für Foundry-APIs) könnte Testbarkeit verbessern

4. **[MetricsCollector Concrete Instantiation](./findings/DIP__medium__metrics-collector-concrete-instantiation__g6h7i8j.md)** (Batch 3)
   - **Datei:** `src/infrastructure/observability/metrics-collector.ts`
   - **Problem:** Erstellt konkrete Instanzen von `MetricsAggregator`, `MetricsPersistenceManager` und `MetricsStateManager` direkt im Konstruktor
   - **Empfehlung:** Abhängigkeiten über Dependency Injection injizieren

### Medium Severity (Neu)

5. **[RuntimeConfigService Direct Instantiation](./findings/DIP__medium__runtimeconfigservice-direct-instantiation__a1b2c3d.md)** (Neu)
   - **Datei:** `src/application/services/RuntimeConfigService.ts`
   - **Problem:** Instanziiert `RuntimeConfigStore` und `RuntimeConfigEventEmitter` direkt im Constructor
   - **Empfehlung:** Über Dependency Injection injizieren

6. **[MetricsCollector Direct Instantiation (Fallback)](./findings/DIP__medium__metricscollector-direct-instantiation__e4f5g6h.md)** (Neu)
   - **Datei:** `src/infrastructure/observability/metrics-collector.ts`
   - **Problem:** Fallback-Instanziierung von `MetricsAggregator`, `MetricsPersistenceManager` und `MetricsStateManager` mit `new`
   - **Empfehlung:** Factory-Pattern für Fallbacks oder DI-Container verwenden

### Low Severity (Neu)

7. **[ServiceResolver Direct Instantiation](./findings/DIP__low__serviceresolver-direct-instantiation__i7j8k9l.md)** (Neu)
   - **Datei:** `src/infrastructure/di/resolution/ServiceResolver.ts`
   - **Problem:** Instanziiert `LifecycleResolver` und `ServiceInstantiatorImpl` direkt
   - **Empfehlung:** Möglicherweise gerechtfertigt wegen Circular Dependency (ähnlich Bootstrap-Code)

## Statistik

- **Gesamt Findings:** 7 (Batch 1: 2, Batch 3: 2, Neu: 3)
- **Kritisch:** 0
- **Hoch:** 2 (beide Batch 1, bereits behoben)
- **Mittel:** 4 (Batch 3: 2, Neu: 2)
- **Niedrig:** 1 (Neu)

## Empfehlungen

1. **Valibot-Abhängigkeiten entfernen (Batch 1, Hoch):** ✅ Bereits behoben - Domain-Layer sollte keine Infrastructure-Abhängigkeiten haben
2. **RuntimeConfigService Dependencies injizieren (Neu, Mittel):** Priorität 1 - Verbessert Testbarkeit und Flexibilität
3. **MetricsCollector Fallback-Verhalten verbessern (Neu, Mittel):** Priorität 2 - Factory-Pattern oder DI-Container für Fallbacks
4. **MetricsCollector Dependencies injizieren (Batch 3, Mittel):** Priorität 3 - Verbessert Testbarkeit und Flexibilität
5. **ServiceResolver Direct Instantiation prüfen (Neu, Niedrig):** Priorität 4 - Möglicherweise gerechtfertigt wegen Circular Dependency
6. **Foundry-Adapter APIs abstrahieren (Batch 3, Mittel):** Priorität 5 - Optional, aber könnte Testbarkeit verbessern

## Hinweise

- **Adapter-Pattern**: Direkte Framework-Abhängigkeiten in Foundry-Adaptern sind erwartbar und akzeptabel, da Adapter die Aufgabe haben, externe Systeme zu abstrahieren
- **Layer-Compliance**: Infrastructure-Layer ist für konkrete Implementierungen zuständig, aber Abhängigkeiten sollten dennoch über Interfaces/Abstraktionen erfolgen wo möglich
- **Testing**: Viele DIP-Verstöße erschweren das Mocking und die Testbarkeit
