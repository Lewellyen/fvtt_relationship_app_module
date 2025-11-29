# Interface Segregation Principle (ISP)

## Gefundene Verstöße

1. **Breiter Container-Zugriff im Init-Service** – `BootstrapInitHookService` konsumiert den kompletten `ServiceContainer` statt eines schmalen Ports für die benötigten Resolver-Aufrufe. Dadurch hängt die Klasse von mehr API-Oberfläche ab, als sie tatsächlich braucht (Resolve/Result-Handling), was Test-Doubles und Substitution erschwert.
   - Folgen: stärkere Kopplung an die DI-Implementierung, höherer Aufwand für Mocks und geringere Klarheit über die wirklich benötigten Abhängigkeiten.
   - Fundstelle: `src/framework/core/bootstrap-init-hook.ts` (Konstruktor und `handleInit`).

## Verbesserungsvorschläge

- Ersetze den `ServiceContainer`-Parameter durch ein dediziertes Interface/Port mit genau den benötigten Methoden (z. B. `resolveWithError`/`addChannel`-Fassaden) oder injiziere die fertigen Abhängigkeiten direkt über die DI-Konfiguration.
- Ergänze für Tests schlanke Fake-Ports; dadurch werden Konsumenten nicht mehr gezwungen, einen vollwertigen Container aufzubauen.
