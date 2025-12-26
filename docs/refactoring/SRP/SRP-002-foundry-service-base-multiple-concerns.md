---
id: SRP-002
principle: SRP
severity: low
layer: Infrastructure (Foundry adapters)
status: Proposed
---

1. Problem

FoundryServiceBase buendelt Port-Auswahl (Versioning), Retry-Policy und Disposal.
Das ist eine Basisklasse mit mehreren Verantwortlichkeiten und ein Altbestand,
obwohl die Codebasis bereits auf Komposition umstellt. Dadurch bleibt eine
vererbungsbasierte, schwerer testbare Abhaengigkeit im Code.

2. Evidence (Belege)

- Pfad: src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts:1-169
- Konkrete Belege:

```ts
// Provides:
// - Common lazy-loading logic for port selection
// - Retry capability for transient Foundry API failures
// - Consistent cleanup via Disposable

protected getPort(adapterName: string): Result<TPort, FoundryError> { ... }
protected withRetry<T>(...): Result<T, FoundryError> { ... }
protected async withRetryAsync<T>(...): Promise<Result<T, FoundryError>> { ... }
dispose(): void { ... }
```

3. SOLID-Analyse

SRP-Verstoss: Port-Auswahl, Retry-Logik und Disposal sind getrennte
Verantwortungen. Aenderungen an Retry-Policy oder Port-Selection benoetigen
Updates an der Basisklasse und betreffen alle Ableitungen.

4. Zielbild

- Keine geerbte Basisklasse fuer Foundry-Services.
- Komposition via explizite Komponenten (PortLoader, RetryableOperation, DisposableGuard).
- Services deklarieren nur die Abhaengigkeiten, die sie wirklich brauchen.

5. Loesungsvorschlag

Approach A (empfohlen)
- FoundryServiceBase entfernen und durch Komposition ersetzen.
- Wiederverwendbare Helfer als eigenstaendige Services/Utilities anbieten.

Approach B (Alternative)
- FoundryServiceBase intern behalten, aber als final/private Legacy-Hilfe
  ohne neue Verwendungen. Langfristig entfernen.

Trade-offs
- Kurzfristig Breaking Changes bei Services, die noch davon erben (falls vorhanden).

6. Refactoring-Schritte

1) Bestehende Services auf Komposition umstellen (PortLoader + RetryableOperation).
2) FoundryServiceBase als deprecated und nicht mehr exportiert markieren.
3) Nach Migration: Datei entfernen und Tests anpassen.

7. Beispiel-Code

Before
```ts
class FoundryX extends FoundryServiceBase<FoundryXPort> { ... }
```

After
```ts
class FoundryX {
  constructor(
    private readonly portLoader: PortLoader<FoundryXPort>,
    private readonly retry: RetryableOperation
  ) {}
}
```

8. Tests & Quality Gates

- Adapter-Tests auf Komposition aktualisieren.
- Regression-Test: Port-Selection und Retry-Verhalten bleiben identisch.

9. Akzeptanzkriterien

- Keine Produktionsklasse erbt von FoundryServiceBase.
- Port-Auswahl/Retry/Disposal sind separat testbar.
