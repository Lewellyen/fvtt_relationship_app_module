# Open/Closed Principle (OCP)

## Gefundene Verstöße

1. **Feste Handler-Liste im Context-Menu-Use-Case** – `RegisterContextMenuUseCase.register` erstellt eine statische Handler-Liste (`[this.hideJournalHandler]`). Neue Kontextmenüfunktionen erfordern Codeänderungen im Use-Case statt reiner Erweiterung via DI/Registrierung.
   - Folgen: geringer Erweiterungskomfort, höheres Risiko von Merge-Konflikten, fehlende Konfigurierbarkeit für modulare Features.
   - Fundstelle: `src/application/use-cases/register-context-menu.use-case.ts`.

## Verbesserungsvorschläge

- Injiziere eine `JournalContextMenuHandler[]`-Kollektion über DI/Port, sodass Erweiterungen neue Handler bereitstellen können, ohne den Use-Case anzupassen.
- Ergänze Validierung/Short-Circuit-Strategien (z. B. Result-Aggregation), damit zusätzliche Handler ihr eigenes Fehlerverhalten kapseln und die Orchestrierung offen für neue Typen bleibt.
