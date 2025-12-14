# Dokumentations-Changelog

**Zweck:** Chronologische Liste aller Dokumentations-Änderungen
**Zielgruppe:** Maintainer, Entwickler
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## [2025-01-XX] - Dokumentationsüberarbeitung

### Umstrukturierung

**Neue Struktur:**
- `docs/getting-started/` - Einstieg für neue Nutzer/Entwickler
- `docs/architecture/` - Architektur-Dokumentation
- `docs/development/` - Entwickler-Guides
- `docs/guides/` - Praktische Anleitungen
- `docs/reference/` - Referenz-Dokumentation
- `docs/decisions/` - Architecture Decision Records
- `docs/quality/` - Qualitätsmetriken
- `docs/templates/` - Dokumentations-Templates

### Datei-Migrationen

| Alte Datei | Neue Datei | Aktion | Grund |
|------------|-----------|--------|-------|
| `docs/INDEX.md` | `docs/README.md` | **Umbenennen** | GitHub-Standard (README.md wird automatisch angezeigt) |
| `docs/QUICK-REFERENCE.md` | `docs/reference/quick-reference.md` | **Verschieben** | Klare Kategorisierung |
| `docs/BOOTFLOW.md` | `docs/architecture/bootstrap.md` | **Verschieben** | Architektur-Kontext |
| `docs/CONFIGURATION.md` | `docs/guides/configuration.md` | **Verschieben** | Guide-Kontext |
| `docs/VERSIONING-STRATEGY.md` | `docs/development/versioning.md` | **Verschieben** | Development-Kontext |
| `docs/foundry-di-adapter-guidelines.md` | `docs/guides/foundry-integration.md` | **Verschieben** | Guide-Kontext |
| `docs/quality-gates/` | `docs/quality/` | **Umbenennen** | Kürzerer Name |
| `docs/adr/` | `docs/decisions/` | **Umbenennen** | Konsistente Struktur |
| `docs/API.md` + `docs/API-CHANGELOG.md` | `docs/reference/api-reference.md` | **Zusammenführen** | Einheitliche API-Dokumentation |
| `docs/TEST-STRATEGY.md` + `docs/TESTING.md` | `docs/development/testing.md` | **Zusammenführen** | Einheitliches Testing-Dokument |
| `ARCHITECTURE.md` | `docs/architecture/overview.md` + `layers.md` + `patterns.md` | **Splitten** | Bessere Strukturierung |

### Neue Dokumente

**Kern-Dokumente:**
- `docs/getting-started/installation.md` - Endnutzer-Installation
- `docs/getting-started/setup.md` - Entwicklungssetup
- `docs/getting-started/faq.md` - Häufige Fragen (TODO)
- `docs/architecture/overview.md` - High-Level Architektur
- `docs/architecture/layers.md` - Clean Architecture Schichten
- `docs/architecture/patterns.md` - Architektur-Patterns
- `docs/development/scripts.md` - NPM-Scripts & Build-Tools
- `docs/development/coding-standards.md` - Code-Standards
- `docs/reference/glossary.md` - Begriffslexikon
- `docs/reference/services.md` - Service-Übersicht
- `docs/reference/api-reference.md` - Vollständige API-Dokumentation

**Templates:**
- `docs/templates/adr-template.md` - ADR-Template
- `docs/templates/guide-template.md` - Guide-Template

### Überarbeitete Dokumente

- `README.md` - Gekürzt auf Essentials, Verlinkung zu docs/
- `docs/README.md` - Neuer Hauptindex mit Navigation

### Entfernte Dokumente

- `docs/INDEX.md` - Ersetzt durch `docs/README.md`
- Temporäre "old"-Dateien nach Konsolidierung

---

## Format

Jeder Eintrag sollte folgende Struktur haben:

```markdown
## [YYYY-MM-DD] - [Kurzbeschreibung]

### [Kategorie]

**Änderung:**
- [Beschreibung]

**Grund:**
- [Begründung]

**Betroffene Dateien:**
- [Datei 1] → [Neue Datei 1]
- [Datei 2] → [Neue Datei 2]
```

---

**Letzte Aktualisierung:** 2025-01-XX
