# Dokumentation - Beziehungsnetzwerke für Foundry VTT

**Version:** 0.44.0
**Letzte Aktualisierung:** 2025-12-15

---

## 🎯 Schnellzugriff

### Nach Zielgruppe

| Zielgruppe | Startpunkt |
|------------|------------|
| **👤 Endnutzer** | [Installation](./getting-started/installation.md) |
| **👨‍💻 Entwickler** | [Entwicklungssetup](./getting-started/setup.md) |
| **🏗️ Architekten** | [Architektur-Übersicht](./architecture/overview.md) |

### Nach Aufgabe

| Aufgabe | Dokument |
|---------|----------|
| Modul installieren | [Installation](./getting-started/installation.md) |
| Entwicklung starten | [Setup](./getting-started/setup.md) → [Scripts](./development/scripts.md) |
| Architektur verstehen | [Übersicht](./architecture/overview.md) → [Patterns](./architecture/patterns.md) |
| Service registrieren | [Quick Reference](./reference/quick-reference.md) → [Tokens](./reference/tokens.md) |
| Tests schreiben | [Testing](./development/testing.md) |
| API nutzen | [API-Verwendung](./guides/api-usage.md) |
| Beitragen | [Contributing](./guides/contributing.md) |

---

## 📚 Dokumentations-Struktur

```
docs/
├── getting-started/     # 🚀 Einstieg für neue Nutzer/Entwickler
│   ├── installation.md  #    Endnutzer-Installation
│   ├── setup.md         #    Entwicklungssetup
│   └── faq.md           #    Häufige Fragen
│
├── architecture/        # 🏛️ Architektur-Dokumentation
│   ├── overview.md      #    High-Level Architektur
│   ├── layers.md        #    Clean Architecture Schichten
│   ├── patterns.md      #    Architektur-Patterns
│   ├── bootstrap.md     #    Bootstrap-Prozess
│   └── module-boundaries.md  # Modul-Grenzen & Dependencies
│
├── development/         # 🛠️ Entwickler-Guides
│   ├── coding-standards.md  # Code-Konventionen
│   ├── scripts.md       #    NPM-Scripts
│   ├── testing.md       #    Test-Strategie
│   └── versioning.md    #    Versionierung
│
├── guides/              # 📖 Praktische Anleitungen
│   ├── configuration.md #    Konfiguration
│   ├── foundry-integration.md  # Foundry-Port-Erstellung
│   ├── api-usage.md     #    Externe API nutzen
│   └── contributing.md  #    Beitragsprozess
│
├── reference/           # 📋 Referenz-Dokumentation
│   ├── api-reference.md #    Vollständige API-Dokumentation
│   ├── tokens.md        #    DI-Token-Katalog
│   ├── services.md      #    Service-Übersicht
│   ├── glossary.md      #    Begriffslexikon
│   └── quick-reference.md  # Cheat Sheets
│
├── decisions/           # 📜 Architecture Decision Records
│   └── 0001-0012-*.md   #    ADRs
│
├── quality/             # ✅ Qualitätsmetriken
│   ├── code-coverage-exclusions.md
│   ├── type-coverage-exclusions.md
│   └── linter-exclusions.md
│
├── templates/           # 📝 Dokumentations-Templates
│   ├── adr-template.md
│   ├── guide-template.md
│   └── deprecation-template.md
│
├── releases/            # 📦 Release Notes (historisch)
│
└── archive/             # 🗄️ Archivierte Dokumente
```

---

## 🎓 Learning Path für neue Entwickler

### Tag 1: Übersicht & Setup
1. [Root README](../README.md) - Features & Quick-Start
2. [Installation](./getting-started/installation.md) - Modul installieren
3. [Entwicklungssetup](./getting-started/setup.md) - Dev-Umgebung

### Tag 2-3: Architektur
1. [Architektur-Übersicht](./architecture/overview.md) - High-Level
2. [Schichten](./architecture/layers.md) - Clean Architecture
3. [Patterns](./architecture/patterns.md) - Port-Adapter, Result, DI
4. [Modul-Grenzen](./architecture/module-boundaries.md) - Layer-Regeln

### Tag 4-5: Entwicklung
1. [Quick Reference](./reference/quick-reference.md) - Schnellreferenz
2. [Code-Standards](./development/coding-standards.md) - Konventionen
3. [Testing](./development/testing.md) - Test-Strategie
4. [ADRs](./decisions/README.md) - Design-Entscheidungen

---

## 📖 Wichtige Dokumente

### Pflichtlektüre für Entwickler

| Dokument | Zweck |
|----------|-------|
| [Quick Reference](./reference/quick-reference.md) | Schnellreferenz & Cheat Sheets |
| [Architektur-Übersicht](./architecture/overview.md) | High-Level Architektur |
| [Token-Katalog](./reference/tokens.md) | DI-Tokens & Dependencies |
| [Versionierung](./development/versioning.md) | Breaking Changes |

### Für Architekten

| Dokument | Zweck |
|----------|-------|
| [Patterns](./architecture/patterns.md) | Port-Adapter, Result, DI |
| [Bootstrap](./architecture/bootstrap.md) | Lifecycle & Init-Flow |
| [Modul-Grenzen](./architecture/module-boundaries.md) | Layer-Regeln |
| [ADRs](./decisions/README.md) | Architektur-Entscheidungen |

---

## 🔗 Externe Ressourcen

| Thema | Link |
|-------|------|
| Foundry API | https://foundryvtt.com/api/ |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ |
| Clean Architecture | https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html |
| Vitest | https://vitest.dev/ |

---

## 🔄 Dokumentations-Updates

Bei Code-Änderungen aktualisieren:
- [ ] [Token-Katalog](./reference/tokens.md) - neue Tokens
- [ ] [Quick Reference](./reference/quick-reference.md) - neue Services
- [ ] [CHANGELOG](../CHANGELOG.md) - Features/Fixes

Bei Architektur-Änderungen:
- [ ] [Architektur-Übersicht](./architecture/overview.md)
- [ ] [Modul-Grenzen](./architecture/module-boundaries.md)
- [ ] Neues ADR in [decisions/](./decisions/)

---

**Fragen?** [GitHub Issues](https://github.com/Lewellyen/fvtt_relationship_app_module/issues) | Discord: `lewellyen`
