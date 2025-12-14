# Dokumentation - Beziehungsnetzwerke für Foundry VTT

**Zweck:** Hauptindex der Dokumentation mit Navigation für alle Zielgruppen
**Zielgruppe:** Alle (Endnutzer, Contributor, Maintainer)
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## 🎯 Schnellzugriff nach Zielgruppe

### 👤 Endnutzer
- [Installation](./getting-started/installation.md) - Modul installieren und aktivieren
- [Konfiguration](./guides/configuration.md) - Einstellungen und Optionen
- [FAQ](./getting-started/faq.md) - Häufige Fragen und Troubleshooting

### 👨‍💻 Contributor (Entwickler)
- [Entwicklungssetup](./getting-started/setup.md) - Erste Schritte für Entwickler
- [Entwickler-Guide](./development/README.md) - Entwicklungsumgebung, Scripts, Testing
- [Code-Standards](./development/coding-standards.md) - Coding-Konventionen
- [API-Verwendung](./guides/api-usage.md) - Externe API nutzen

### 🏗️ Maintainer (Architekten)
- [Architektur-Übersicht](./architecture/README.md) - Clean Architecture, Schichten, Patterns
- [Entscheidungen](./decisions/README.md) - Architecture Decision Records (ADRs)
- [Versionierung](./development/versioning.md) - Breaking Changes & Deprecation

---

## 📚 Dokumentations-Struktur

```
docs/
├── README.md                    # ⭐ Dieser Index (GitHub zeigt automatisch an)
├── getting-started/             # Einstieg für neue Nutzer/Entwickler
│   ├── README.md
│   ├── installation.md          # Endnutzer-Installation
│   ├── setup.md                 # Entwicklungssetup
│   └── faq.md                   # Häufige Fragen
├── architecture/                # Architektur-Dokumentation
│   ├── README.md
│   ├── overview.md              # High-Level Architektur
│   ├── layers.md                # Clean Architecture Schichten
│   ├── patterns.md              # Architektur-Patterns
│   ├── module-boundaries.md     # Modul-Grenzen & Dependencies
│   ├── bootstrap.md             # Bootstrap-Prozess
│   └── data-flow.md             # Datenfluss-Diagramme
├── development/                  # Entwickler-Guides
│   ├── README.md
│   ├── setup.md                 # Entwicklungsumgebung
│   ├── scripts.md               # NPM-Scripts & Build-Tools
│   ├── testing.md               # Test-Strategie & Anleitung
│   ├── linting-formatting.md    # Code-Qualität
│   ├── coding-standards.md      # Code-Konventionen
│   ├── versioning.md            # Versionierung & Breaking Changes
│   └── debugging.md             # Debugging-Guide
├── guides/                      # Praktische Anleitungen
│   ├── README.md
│   ├── api-usage.md             # API-Verwendung (extern)
│   ├── configuration.md         # Konfiguration (ENV, Settings)
│   ├── foundry-integration.md   # Foundry-Port-Erstellung
│   └── contributing.md          # Beitragsprozess
├── reference/                   # Referenz-Dokumentation
│   ├── README.md
│   ├── glossary.md             # Begriffslexikon
│   ├── api-reference.md        # Vollständige API-Dokumentation
│   ├── tokens.md               # DI-Token-Katalog
│   ├── services.md             # Service-Übersicht
│   └── quick-reference.md      # Cheat Sheets
├── decisions/                  # Architecture Decision Records
│   ├── README.md
│   └── [ADRs verlinkt zu adr/]
├── quality/                    # Qualitätsmetriken
│   ├── README.md
│   ├── coverage.md             # Code Coverage Strategie
│   ├── type-safety.md          # Type Coverage
│   └── linting.md              # Linter-Regeln
├── releases/                   # Release Notes
│   └── [historische Releases]
├── templates/                  # Dokumentations-Templates
│   ├── README.md
│   ├── adr-template.md
│   ├── guide-template.md
│   ├── deprecation-template.md
│   └── migration-guide-template.md
├── archive/                    # Archivierte Dokumente
│   └── [veraltete/obsolete Docs]
└── CHANGELOG.md                # Dokumentations-Änderungen
```

---

## 🚀 Quick-Navigation nach Use-Case

### "Ich möchte das Modul installieren"
→ [Installation](./getting-started/installation.md)

### "Ich möchte entwickeln"
1. [Entwicklungssetup](./getting-started/setup.md)
2. [Entwickler-Guide](./development/README.md)
3. [Code-Standards](./development/coding-standards.md)

### "Ich möchte einen neuen Service registrieren"
1. [Quick Reference](./reference/quick-reference.md) → Service & DI-Wrapper Cheat Sheets
2. [Token-Katalog](./reference/tokens.md) → Token & Layer prüfen
3. [Architektur-Übersicht](./architecture/overview.md) → Architektur-Kontext & Patterns

### "Ich plane ein Refactoring"
1. [Versionierung](./development/versioning.md) → Regeln & Deprecation
2. [Modul-Grenzen](./architecture/module-boundaries.md) → Aktueller Code-Status
3. [Token-Katalog](./reference/tokens.md) → Betroffene Tokens & Layer

### "Ich möchte die Architektur verstehen"
1. [Architektur-Übersicht](./architecture/overview.md) → High-Level Architektur
2. [Schichten](./architecture/layers.md) → Clean Architecture Schichten
3. [Patterns](./architecture/patterns.md) → Port-Adapter, Result, DI
4. [Bootstrap](./architecture/bootstrap.md) → Bootstrap & Lifecycle

### "Ich brauche einen neuen Foundry-Port"
1. [Foundry-Integration](./guides/foundry-integration.md)
2. [Port-Adapter Pattern](./decisions/README.md#adr-0003)
3. [Architektur-Übersicht](./architecture/overview.md) → Zukunftssicherheit & Ports

**Checkliste:**
1. API-Diffs analysieren
2. Port implementieren (`src/infrastructure/adapters/foundry/ports/vX/`)
3. Registry-Update (`port-infrastructure.config.ts`)
4. Tests ergänzen
5. `module.json` (compatibility.maximum) aktualisieren

### "Ich schreibe Tests"
1. [Testing](./development/testing.md) → Test-Strategie, Tools & Priorisierung
2. [Quality Gates](./quality/README.md) → Verpflichtende Checks
3. [Quick Reference](./reference/quick-reference.md) → Testing Cheat Sheet

### "Ich plane Breaking Changes"
1. [Versionierung](./development/versioning.md)
2. [Deprecation Template](./templates/deprecation-template.md)
3. [Migration Guide Template](./templates/migration-guide-template.md)

---

## 📖 Wichtige Dokumente

### Pflichtlektüre für Entwickler

| Dokument | Zweck | Lesereihenfolge |
|----------|-------|-----------------|
| [Quick Reference](./reference/quick-reference.md) | Schnellreferenz & Cheat Sheets | ⭐ Startpunkt |
| [Architektur-Übersicht](./architecture/overview.md) | High-Level Architektur | Nach Quick Reference |
| [Token-Katalog](./reference/tokens.md) | DI-Token & Dependencies | Nach Bedarf beim Arbeiten |
| [Versionierung](./development/versioning.md) | Breaking Changes & Deprecations | Vor Refactorings |

### Architektur & Design

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [Architektur-Übersicht](./architecture/overview.md) | Clean Architecture Prinzipien | Architektur & Leads |
| [Schichten](./architecture/layers.md) | Clean Architecture Schichten | Architektur |
| [Patterns](./architecture/patterns.md) | Port-Adapter, Result, DI | Architektur |
| [Bootstrap](./architecture/bootstrap.md) | Bootstrap-/Lifecycle-Sequenzen | DI-/Bootstrap-Themen |
| [Modul-Grenzen](./architecture/module-boundaries.md) | Dependencies & Layer-Analyse | Architektur |

### Testing & Quality

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [Testing](./development/testing.md) | Test-Strategie, Tools & Commands | Alle Entwickler |
| [Quality Gates](./quality/README.md) | Qualitätsmetriken & Pflicht-Gates | Maintainer, QA |
| [Code Coverage](./quality/coverage.md) | Coverage-Strategie & Exclusions | Test-Autoren |
| [Type Safety](./quality/type-safety.md) | Type Coverage | TypeScript |

### Architecture Decision Records (ADRs)

Siehe [Entscheidungen](./decisions/README.md) für vollständige ADR-Liste.

---

## 🎓 Learning Path für neue Entwickler

### Tag 1: Übersicht
1. [Root README](../README.md) → Features & Setup
2. [Quick Reference](./reference/quick-reference.md) → Service-Übersicht
3. [Versionierung](./development/versioning.md) → Breaking-Change-Regeln

### Tag 2-3: Architektur
1. [Architektur-Übersicht](./architecture/overview.md) → High-Level Architektur
2. [Schichten](./architecture/layers.md) → Clean Architecture Schichten
3. [Modul-Grenzen](./architecture/module-boundaries.md) → Dependency-Tree
4. [Patterns](./architecture/patterns.md) → Port-Adapter, Result, DI

### Tag 4-5: Deep Dive
1. [Bootstrap](./architecture/bootstrap.md) → Bootstrap-Prozess
2. [ADRs](./decisions/README.md) → Design-Entscheidungen verstehen
3. [Testing](./development/testing.md) → Test-Strategie & Tools

### Woche 2: Praktische Entwicklung
1. [Konfiguration](./guides/configuration.md) → Environment-Setup
2. [Code-Standards](./development/coding-standards.md) → Code-Dokumentation
3. [Foundry-Integration](./guides/foundry-integration.md) → Foundry-Integration

---

## 🔄 Dokumentations-Update-Workflow

### Bei Code-Änderungen
- [ ] [Token-Katalog](./reference/tokens.md) → neue Tokens dokumentieren
- [ ] [Service-Übersicht](./reference/services.md) → neue Services dokumentieren
- [ ] [Quick Reference](./reference/quick-reference.md) → Cheat Sheets aktualisieren

### Bei Architektur-/Release-Änderungen
- [ ] [Architektur-Übersicht](./architecture/overview.md)
- [ ] [Bootstrap](./architecture/bootstrap.md)
- [ ] [API-Referenz](./reference/api-reference.md)
- [ ] [CHANGELOG](../CHANGELOG.md)
- [ ] [Versionierung](./development/versioning.md)

---

## 🔍 Dokumentations-Suche

### Nach Keyword suchen
```powershell
# PowerShell
Get-ChildItem -Path docs -Recurse -Filter *.md | Select-String "keyword"
```

```bash
# Linux/Mac
grep -r "keyword" docs/
```

---

## 🔗 Externe Ressourcen

| Thema | Link |
|-------|------|
| Foundry API | https://foundryvtt.com/api/ |
| Foundry Wiki | https://foundryvtt.wiki/ |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ |
| Clean Architecture | https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html |

---

**Hinweis:** Diese Dokumentation wird kontinuierlich aktualisiert. Bei Fragen oder Unklarheiten bitte ein [Issue](https://github.com/Lewellyen/fvtt_relationship_app_module/issues) erstellen.
