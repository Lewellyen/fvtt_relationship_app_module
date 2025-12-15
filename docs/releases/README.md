# Release Notes - Übersicht

**Version:** 0.44.0
**Letzte Aktualisierung:** 2025-12-15

---

## 📖 Übersicht

Dieses Verzeichnis enthält Release Notes für alle veröffentlichten Versionen des Moduls.

Für das vollständige Changelog siehe [CHANGELOG.md](../../CHANGELOG.md) im Root-Verzeichnis.

---

## 🚀 Aktuelle Version

### [v0.44.0](./v0.44.0.md) - 2025-12-14

**Highlights:**
- DIP-Refactoring: Foundry V13 Ports mit Dependency Injection
- Neue Factory-Funktionen für Foundry Ports
- Verbesserte Testbarkeit

---

## 📊 Versions-Übersicht nach Meilensteinen

### v0.40.0 – v0.44.0 (Dezember 2025)
**Thema:** SOLID-Audit & DIP-Refactoring

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.44.0](./v0.44.0.md) | 2025-12-14 | DIP-Refactoring: Foundry Ports mit DI |
| [v0.43.x](./v0.43.18.md) | 2025-12-XX | SOLID-Audit abgeschlossen, 100% DIP-Konformität |
| [v0.42.x](./v0.42.1.md) | 2025-12-XX | ISP/LSP-Analyse |
| [v0.41.x](./v0.41.2.md) | 2025-12-XX | OCP-Analyse |
| [v0.40.x](./v0.40.32.md) | 2025-12-XX | SRP-Analyse & Refactoring-Pläne |

---

### v0.30.0 – v0.39.0 (November 2025)
**Thema:** Architektur-Stabilisierung & Observability

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.39.0](./v0.39.0.md) | 2025-11-XX | Cache-Service mit Eviction-Strategien |
| [v0.38.0](./v0.38.0.md) | 2025-11-29 | ARCHITECTURE.md erstellt |
| [v0.35.x](./v0.35.2.md) | 2025-11-XX | NotificationCenter mit Channels |
| [v0.30.0](./v0.30.0.md) | 2025-11-23 | LibWrapperService, Init-Orchestrator |

---

### v0.20.0 – v0.29.0 (November 2025)
**Thema:** Port-Adapter & Multi-Version-Support

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.29.x](./v0.29.5.md) | 2025-11-XX | Port-Selection-Events, Observability-Registry |
| [v0.27.0](./v0.27.0.md) | 2025-11-XX | Foundry V14 Port-Vorbereitung |
| [v0.25.x](./v0.25.16.md) | 2025-11-XX | Quality Gates (100% Coverage) |
| [v0.20.0](./v0.20.0.md) | 2025-11-XX | Lazy Port Loading |

---

### v0.10.0 – v0.19.0 (November 2025)
**Thema:** DI-Container & Public API

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.19.x](./v0.19.1.md) | 2025-11-XX | Settings-Migration |
| [v0.15.0](./v0.15.0.md) | 2025-11-XX | I18n-Services |
| [v0.10.0](./v0.10.0.md) | 2025-11-09 | ModuleApiInitializer, Public API v1.0.0 |

---

### v0.1.0 – v0.9.0 (Oktober/November 2025)
**Thema:** Grundlagen & DI-Bootstrap

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.9.0](./v0.9.0.md) | 2025-11-XX | Result Pattern |
| [v0.7.0](./v0.7.1.md) | 2025-11-XX | ServiceContainer mit Validation |
| [v0.5.x](./v0.5.4.md) | 2025-11-XX | JournalVisibilityService |
| [v0.1.0](./v0.1.0.md) | 2025-10-XX | Initiales Release, Vite-Build |

---

### v0.0.x (Oktober 2025)
**Thema:** Prototyp & Proof of Concept

| Version | Datum | Highlights |
|---------|-------|------------|
| [v0.0.15](./v0.0.15.md) | 2025-10-XX | Erste Tests |
| [v0.0.10](./v0.0.10.md) | 2025-10-XX | TypeScript-Setup |
| [v0.0.4](./v0.0.4.md) | 2025-10-XX | Erste Foundry-Integration |

---

## 📈 Statistiken

| Metrik | Wert |
|--------|------|
| **Gesamte Releases** | 143 |
| **Major Versions** | 0 (Pre-1.0.0) |
| **Minor Versions** | 44 |
| **Patch Versions** | ~99 |
| **Erster Release** | v0.0.4 |
| **Aktuellster Release** | v0.44.0 |

---

## 🔄 Versions-Schema

Das Projekt folgt [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking Changes (noch nicht erreicht)
- **MINOR**: Neue Features (rückwärtskompatibel)
- **PATCH**: Bugfixes und kleine Verbesserungen

**Pre-1.0.0 Policy:**
- Breaking Changes sind ohne Deprecation-Phase möglich
- API kann sich bis 1.0.0 ändern
- Ab 1.0.0: Mindestens 1 Major-Version Deprecation-Vorlaufzeit

---

## 🔗 Verwandte Dokumentation

- [CHANGELOG.md](../../CHANGELOG.md) - Vollständiges Changelog
- [API-Referenz](../reference/api-reference.md) - API-Changelog
- [ADRs](../decisions/) - Architektur-Entscheidungen

---

**Letzte Aktualisierung:** 2025-12-15
