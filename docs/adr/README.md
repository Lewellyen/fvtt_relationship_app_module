# Architecture Decision Records (ADR)

Dieses Verzeichnis enthält Architecture Decision Records (ADRs) für das Beziehungsnetzwerke-Modul.

## Was sind ADRs?

Architecture Decision Records dokumentieren wichtige architektonische Entscheidungen im Projekt. Sie erfassen:
- **Kontext**: Warum war eine Entscheidung nötig?
- **Entscheidung**: Was wurde entschieden?
- **Konsequenzen**: Welche Auswirkungen hat die Entscheidung?

## Format

Wir verwenden das [MADR-Format](https://adr.github.io/madr/) (Markdown Architectural Decision Records).

## Index

| ADR | Status | Titel | Datum |
|-----|--------|-------|-------|
| [0001](0001-use-result-pattern-instead-of-exceptions.md) | Accepted | Result Pattern instead of Exceptions | 2025-11-06 |
| [0002](0002-custom-di-container-instead-of-tsyringe.md) | Accepted | Custom DI Container instead of TSyringe | 2025-11-06 |
| [0003](0003-port-adapter-for-foundry-version-compatibility.md) | Accepted | Port-Adapter for Foundry Version Compatibility | 2025-11-06 |
| [0004](0004-valibot-for-input-validation.md) | Accepted | Valibot for Input Validation | 2025-11-06 |
| [0005](0005-metrics-collector-singleton-to-di.md) | Accepted | MetricsCollector Singleton → DI-Managed Service | 2025-11-06 |
| [0006](0006-observability-strategy.md) | Accepted | Observability Strategy (Logging, Metrics, Error Tracking) | 2025-11-06 |
| [0007](0007-clean-architecture-layering.md) | Accepted | Clean Architecture Layering | 2025-11-06 |

## Status-Werte

- **Proposed**: Vorgeschlagen, noch nicht umgesetzt
- **Accepted**: Akzeptiert und umgesetzt
- **Deprecated**: Veraltet, nicht mehr empfohlen
- **Superseded**: Ersetzt durch neuere ADR

## Neue ADRs erstellen

1. Kopiere Template aus bestehendem ADR
2. Nummeriere fortlaufend (0005, 0006, ...)
3. Dokumentiere Kontext, Entscheidung, Konsequenzen
4. Aktualisiere diesen Index

## Weitere Ressourcen

- [ADR GitHub Organization](https://adr.github.io/)
- [Architectural Decision Records (Martin Fowler)](https://martinfowler.com/articles/scaling-architecture-conversationally.html)

