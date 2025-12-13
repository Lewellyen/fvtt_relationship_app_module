# ISP (Interface Segregation Principle)

## Übersicht

Analyse auf Verstöße gegen das Interface Segregation Principle.

## Zusammenfassung

**Gefundene Findings:** 5 (Batch 1 + Batch 3)
- **Medium Severity:** 2
- **Low Severity:** 3

Einige Interfaces sind groß und definieren viele Methoden. Dies könnte für Clients problematisch sein, die nur einen Teil der Funktionalität benötigen.

## Findings

### Medium Severity

1. **[Container Interface Multiple Responsibilities](./findings/ISP__medium__container-interface-multiple-responsibilities__x7y8z9a.md)** (Batch 3)
   - **Datei:** `src/infrastructure/di/interfaces.ts`
   - **Problem:** Container-Interface vereint 12 Methoden mit verschiedenen Verantwortlichkeiten (Registrierung, Auflösung, Validierung, Scope, Disposal, Query)
   - **Empfehlung:** Interface Segregation in spezialisierte Interfaces (ServiceRegistrar, ServiceResolver, ContainerValidator, ScopeManager, Disposable, ContainerQuery)

2. **[Entity Repository Fat Interface](./findings/ISP__medium__entity-repository-fat-interface__g4h5i6j.md)** (Batch 1)
   - **Datei:** `src/domain/ports/repositories/platform-entity-repository.interface.ts`
   - **Problem:** Interface definiert ~19 Methoden (CRUD + Collection + Flags)
   - **Empfehlung:** Optional: Separate Interfaces für Read und Write, damit Clients nur benötigte Methoden implementieren müssen

### Low Severity

2. **[Entity Collection Many Methods](./findings/ISP__low__entity-collection-many-methods__k7l8m9n.md)**
   - **Datei:** `src/domain/ports/collections/platform-entity-collection-port.interface.ts`
   - **Problem:** Interface definiert ~7 Methoden für verschiedene Query-Operationen
   - **Empfehlung:** Keine Änderung erforderlich - alle Methoden gehören semantisch zusammen

3. **[Settings Port Combines Operations](./findings/ISP__low__settings-port-combines-operations__o0p1q2r.md)**
   - **Datei:** `src/domain/ports/platform-settings-port.interface.ts`
   - **Problem:** Interface kombiniert Registration, Read und Write-Operationen
   - **Empfehlung:** Keine Änderung erforderlich - Settings-Operationen gehören semantisch zusammen

4. **[ModuleApi Interface Many Methods (Framework Layer)](./findings/ISP__low__ModuleApi-interface-many-methods__c7d8e9.md)**
   - **Datei:** `src/framework/core/api/module-api.ts`
   - **Problem:** Interface definiert 7 verschiedene Methoden/Eigenschaften für externe API-Consumer
   - **Empfehlung:** Optional: Separate Interfaces für verschiedene API-Bereiche (ServiceResolutionApi, DiscoveryApi, DiagnosticsApi)

## Statistik

- **Gesamt Findings:** 5 (Batch 1: 4, Batch 3: 1)
- **Kritisch:** 0
- **Hoch:** 0
- **Mittel:** 2
- **Niedrig:** 3

## Empfehlungen

1. **Repository-Interface:** Optional könnte das Repository-Interface in Read und Write aufgeteilt werden, damit Clients nur benötigte Methoden implementieren müssen
2. **Collection-Interface:** Keine Änderung erforderlich - alle Methoden gehören semantisch zusammen
3. **Settings-Interface:** Keine Änderung erforderlich - Settings-Operationen gehören semantisch zusammen

## Hinweise

Für Domain-Layer-Interfaces ist es akzeptabel, dass sie mehrere verwandte Operationen definieren. Die Trennung sollte nur erfolgen, wenn Clients tatsächlich gezwungen werden, Methoden zu implementieren, die sie nicht benötigen.
