# SOLID Scan (Prealpha)

Stand: automatisierte Sichtung der Layer (domain/application/infrastructure/framework) mit Fokus auf SOLID-Verstöße und Schichtung.

## Zusammenfassung der Findings

- **DIP-001**: Domain-Events und Ports leaken DOM-Typen (`HTMLElement`, `ContextMenuOption`) in die Domain-Schicht.
- **DIP-002**: Application-Layer manipuliert DOM/Context-Menu (Foundry-spezifisch) direkt.
- **ISP-001**: `PlatformJournalEventPort` bündelt Core-Events + UI-spezifische Events, zwingt Non-UI Adapter zu Stubs.
- **OCP-001**: `ModuleEventRegistrar` ist durch fest verdrahtete Konstruktorliste erweiterungsfeindlich.
- **SRP-001**: `RuntimeConfigSync` mischt Service-Logik und statische Binding-Definitionen.
- **LSP-001**: `FoundryJournalEventAdapter.registerListener()` liefert generische Events, die die `JournalEvent`-Invarianten nicht garantieren.

## Layer-Karte (Kurzform)

- **Domain**: Entitäten, Ports, Value-Types, Result/Validatoren.
- **Application**: Use-Cases/Services, Settings-Definitionen, RuntimeConfig-Sync.
- **Infrastructure**: Foundry-Adapter, Logging/Cache/Observability, Validation.
- **Framework**: Composition Root, Bootstrap, DI-Konfiguration.

## Hinweise

- Für jedes Finding existiert ein detailliertes Refactoring-Dokument in `docs/refactoring/<PRINZIP>/`.
- Breaking Changes sind ausdrücklich vorgesehen und in den Refactoring-Schritten benannt.
