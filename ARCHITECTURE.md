# Architektur-Übersicht

**Version:** 0.44.0
**Letzte Aktualisierung:** 2025-12-15

> **Hinweis:** Dies ist eine Kurzübersicht. Die vollständige Architektur-Dokumentation befindet sich in [`/docs/architecture/`](./docs/architecture/).

---

## Schichtenarchitektur

Das Modul folgt **Clean Architecture** mit unidirektionalen Abhängigkeiten:

```
┌─────────────────────────────────────────────────┐
│  Framework Layer (src/framework/)               │
│  • Bootstrap, Config, API Exposition            │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  Infrastructure Layer (src/infrastructure/)     │
│  • DI Container, Foundry Adapters, Cache        │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  Application Layer (src/application/)           │
│  • Services, Use-Cases, Settings                │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  Domain Layer (src/domain/)                     │
│  • Entities, Ports, Types (framework-agnostic)  │
└─────────────────────────────────────────────────┘
```

---

## Schlüsselkonzepte

### Port-Adapter-Pattern
Unterstützt mehrere Foundry-Versionen durch versionierte Port-Implementierungen mit Lazy Instantiation.

### Result Pattern
Explizite Fehlerbehandlung ohne Exceptions: `Result<T, E>`.

### Dependency Injection
Custom DI-Container mit Singleton/Transient/Scoped Lifecycles und automatischer Validation.

### Self-Registration Pattern
Services registrieren sich automatisch für Observability im Constructor.

---

## Projekt-Highlights

- ✅ **SOLID-Prinzipien vollständig umgesetzt**
- ✅ **100% DIP-Konformität**
- ✅ **100% Code Coverage & Type Coverage**
- ✅ **1856+ Tests bestanden**

---

## Detaillierte Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [Architektur-Übersicht](./docs/architecture/overview.md) | High-Level Architektur |
| [Schichten](./docs/architecture/layers.md) | Clean Architecture Schichten |
| [Patterns](./docs/architecture/patterns.md) | Port-Adapter, Result, DI |
| [Bootstrap](./docs/architecture/bootstrap.md) | Bootstrap-Prozess im Detail |
| [Quick Reference](./docs/reference/quick-reference.md) | Entwickler-Schnellreferenz |

### Architecture Decision Records (ADRs)

| ADR | Titel |
|-----|-------|
| [ADR-0001](./docs/decisions/0001-use-result-pattern-instead-of-exceptions.md) | Result Pattern statt Exceptions |
| [ADR-0002](./docs/decisions/0002-custom-di-container-instead-of-tsyringe.md) | Custom DI Container |
| [ADR-0003](./docs/decisions/0003-port-adapter-for-foundry-version-compatibility.md) | Port-Adapter für Foundry-Kompatibilität |
| [ADR-0007](./docs/decisions/0007-clean-architecture-layering.md) | Clean Architecture Layering |

**Alle ADRs:** [docs/decisions/](./docs/decisions/)

---

## Weiterführende Dokumentation

- **Entwicklung:** [docs/development/](./docs/development/)
- **API-Referenz:** [docs/reference/](./docs/reference/)
- **Konfiguration:** [docs/guides/configuration.md](./docs/guides/configuration.md)
- **Testing:** [docs/development/testing.md](./docs/development/testing.md)
