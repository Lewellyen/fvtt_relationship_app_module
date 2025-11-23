# Dokumentations-Index

**Model:** GPT-5.1 Codex  
**Datum:** 2025-11-15  
**Projekt-Version:** 0.24.0 (Pre-Release)  
**API-Version:** 1.0.0

---

## 📚 Dokumentations-Übersicht

### 🎯 Pflichtlektüre für Entwickler

| Dokument | Zweck | Lesereihenfolge |
|----------|-------|-----------------|
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | Schnellreferenz & Cheat Sheets | ⭐ Startpunkt |
| **[PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md)** | Vollständiger Code-Überblick (ohne Tests) | Nach der Quick-Reference |
| **[DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md)** | Token-/Dependency-Katalog & Layer-Analyse | Nach Bedarf beim Arbeiten |
| **[VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md)** | Regeln für Breaking Changes & Deprecations | Vor Refactorings |

---

### 📖 Architektur & Design

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Clean-Architecture-Prinzipien & Layering | Architektur & Leads |
| [BOOTFLOW.md](./BOOTFLOW.md) | Bootstrap-/Lifecycle-Sequenzen | DI-/Bootstrap-Themen |
| [CONFIGURATION.md](./CONFIGURATION.md) | ENV-Flags, Foundry Settings & Debug Modi | Alle Entwickler |
| [API.md](./API.md) | Öffentliche API (`game.modules.get(...).api`) | Externe & Integrationen |
| [API-CHANGELOG.md](./API-CHANGELOG.md) | API-spezifische Änderungen & Deprecations | API-Konsumenten |

---

### 🧪 Testing & Quality

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [TESTING.md](./TESTING.md) | Test-Strategie, Tools & Command-Guide | Alle Entwickler |
| [TEST-STRATEGY.md](./TEST-STRATEGY.md) | Umfassende Test-Strategie, Tools, Priorisierung & Best Practices | Test-Autoren, QA |
| [quality-gates/README.md](./quality-gates/README.md) | Qualitätsmetriken & Pflicht-Gates | Maintainer, QA |
| → [Code Coverage Exclusions](./quality-gates/code-coverage-exclusions.md) | Dokumentierte `v8 ignore`-Stellen | Test-Autoren |
| → [Type Coverage Exclusions](./quality-gates/type-coverage-exclusions.md) | Dokumentierte `type-coverage`-Ausnahmen | TypeScript |
| → [Linter Exclusions](./quality-gates/linter-exclusions.md) | Dokumentierte `eslint-disable`-Stellen | Code Qualität |

---

### 📐 Architecture Decision Records (ADRs)

| ADR | Thema | Status |
|-----|-------|--------|
| [ADR-0001](./adr/0001-use-result-pattern-instead-of-exceptions.md) | Result Pattern | ✅ Aktiv |
| [ADR-0002](./adr/0002-custom-di-container-instead-of-tsyringe.md) | Custom DI Container | ✅ Aktiv |
| [ADR-0003](./adr/0003-port-adapter-for-foundry-version-compatibility.md) | Port-Adapter-Pattern | ✅ Aktiv |
| [ADR-0004](./adr/0004-valibot-for-input-validation.md) | Valibot | ✅ Aktiv |
| [ADR-0005](./adr/0005-metrics-collector-singleton-to-di.md) | Metrics Collector via DI | ✅ Aktiv |
| [ADR-0006](./adr/0006-observability-strategy.md) | Observability & Self-Registration | ✅ Aktiv |
| [ADR-0007](./adr/0007-clean-architecture-layering.md) | Layering | ✅ Aktiv |
| [ADR-0008](./adr/0008-console-vs-logger-interface.md) | Logger Strategy | ✅ Aktiv |
| [ADR-0009-0012](./adr/README.md) | Bootstrap & Error-Service Evolution | ✅ Aktiv |

**Neue ADRs?** → Richtlinien siehe [ADR/README.md](./adr/README.md)

---

### 🔧 Development Guides

| Dokument | Zweck |
|----------|-------|
| [foundry-di-adapter-guidelines.md](./foundry-di-adapter-guidelines.md) | Leitfaden für neue Foundry-Ports & Adapter |
| [jsdoc-styleguide.md](./jsdoc-styleguide.md) | Dokumentationskonventionen für Services & Token |

---

### 🗺️ Planung & Roadmaps

| Dokument | Zweck |
|----------|-------|
| [roadmaps/ROADMAP-2025-11.md](./roadmaps/ROADMAP-2025-11.md) | Aktuelle Vorhaben (UI-Styles & RuntimeConfig DX) |

---

### 🔬 Foundry & Release Notes

| Dokument | Zweck |
|----------|-------|
| [releases/](./releases/) | Historische Release Notes (v0.0.4 – v0.19.1) |

---

### 📊 Archive & Historie

| Dokument | Zweck |
|----------|-------|
| [audits/audit-2025-11-15.md](./audits/audit-2025-11-15.md) | Aktueller Clean-Code-/Dokumentations-Audit (15.11.2025) |
| [archive/](./archive/) | Historische Audit-Reports (Stand 2025-11-09) |

---

## 🚀 Quick-Navigation nach Use-Case

### "Ich möchte einen neuen Service registrieren"
1. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Service & DI-Wrapper Cheat Sheets  
2. [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) → Token & Layer prüfen  
3. [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → Architektur-Kontext & Patterns

---

### "Ich plane ein Refactoring"
1. [VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md) → Regeln & Deprecation  
2. [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → Aktueller Code-Status  
3. [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) → Betroffene Tokens & Layer

---

### "Ich möchte die Architektur verstehen"
1. [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → Übersicht & Pattern  
2. [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) → Layer & Token-Registry  
3. [ARCHITECTURE.md](../ARCHITECTURE.md) → Clean Architecture Hintergründe  
4. [BOOTFLOW.md](./BOOTFLOW.md) → Bootstrap & Lifecycle

---

### "Ich brauche einen neuen Foundry-Port"
1. [foundry-di-adapter-guidelines.md](./foundry-di-adapter-guidelines.md)  
2. [ADR-0003](./adr/0003-port-adapter-for-foundry-version-compatibility.md)  
3. [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → Zukunftssicherheit & Ports

**Checkliste:**  
1. API-Diffs analysieren → 2. Port implementieren (`src/foundry/ports/vX/`)  
3. Registry-Update (`port-infrastructure.config.ts`) → 4. Tests ergänzen  
5. `module.json` (compatibility.maximum) aktualisieren

---

### "Ich schreibe Tests"
1. [TEST-STRATEGY.md](./TEST-STRATEGY.md) → Umfassende Test-Strategie, Tools & Priorisierung  
2. [TESTING.md](./TESTING.md) → Praktische Test-Anleitung & Commands  
3. [quality-gates/README.md](./quality-gates/README.md) → verpflichtende Checks  
4. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Testing Cheat Sheet

---

### "Ich plane Breaking Changes"
1. [VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md)  
2. [templates/DEPRECATION_TEMPLATE.md](./templates/DEPRECATION_TEMPLATE.md)  
3. [templates/MIGRATION_GUIDE_TEMPLATE.md](./templates/MIGRATION_GUIDE_TEMPLATE.md)

---

## 📝 Template-Verzeichnis

| Template | Zweck | Einsatz |
|----------|-------|--------|
| [MIGRATION_GUIDE_TEMPLATE.md](./templates/MIGRATION_GUIDE_TEMPLATE.md) | Migration Guides | Ab Modul 1.0.0+ |
| [DEPRECATION_TEMPLATE.md](./templates/DEPRECATION_TEMPLATE.md) | Deprecation Notices | Vor API Breaking Changes |

---

## 🔄 Dokumentations-Update-Workflow

### Bei Code-Änderungen
- [ ] [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → neue Services / DI-Änderungen
- [ ] [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) → Token & Layer aktualisieren
- [ ] [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Cheat Sheets & Tokens

### Bei Architektur-/Release-Änderungen
- [ ] [ARCHITECTURE.md](../ARCHITECTURE.md)
- [ ] [BOOTFLOW.md](./BOOTFLOW.md)
- [ ] [API.md](./API.md) & [API-CHANGELOG.md](./API-CHANGELOG.md)
- [ ] [CHANGELOG.md](../CHANGELOG.md)
- [ ] [VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md)
- [ ] [quality-gates/README.md](./quality-gates/README.md)

---

### Breaking Changes (ab Modul 1.0.0)
1. **Deprecation Phase:** JSDoc `@deprecated`, Runtime-Warnung, API-CHANGELOG, ggf. Migration Guide  
2. **Removal Phase:** Code entfernen, Breaking Change dokumentieren, Release Notes aktualisieren

---

## 🎯 Dokumentations-Qualität

### Checkliste für neue Dokumentation

- [ ] **Klarer Zweck**: Warum existiert dieses Dokument?
- [ ] **Zielgruppe**: Für wen ist es gedacht?
- [ ] **Aktualität**: Datum & Version angegeben?
- [ ] **Beispiele**: Code-Beispiele vorhanden?
- [ ] **Verlinkung**: Von anderen Docs verlinkt?
- [ ] **Wartbarkeit**: Einfach aktualisierbar?

---

### Dokumentations-Standards

1. **Markdown**: Alle Docs in Markdown (außer ADRs können auch andere Formate nutzen)
2. **Code-Blöcke**: Mit Syntax-Highlighting (`\`\`\`typescript`)
3. **Verlinkung**: Relative Links zwischen Docs
4. **Header**: Model, Datum, Version angeben
5. **Emojis**: Sparsam einsetzen (nur zur Strukturierung)

---

## 🔍 Dokumentations-Suche

### Nach Keyword suchen
```bash
# PowerShell
Get-ChildItem -Path docs -Recurse -Filter *.md | Select-String "keyword"

# Linux/Mac
grep -r "keyword" docs/
```

---

### Veraltete Docs finden
```bash
# Docs älter als 6 Monate
Get-ChildItem -Path docs -Recurse -Filter *.md | 
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddMonths(-6) }
```

---

## 📅 Wartungs-Plan

### Monatlicher Check
- PROJECT-ANALYSIS.md & DEPENDENCY-MAP.md aktuell halten
- quality-gates/README.md (neue Metriken / Ausnahmen)

### Vierteljährlicher Check
- ADRs reviewen (Status, Relevanz)
- ARCHITECTURE.md & BOOTFLOW.md prüfen
- Doc-Qualität (Dead Links, Daten) verifizieren

### Vor Releases
- CHANGELOG.md & [releases/](./releases/)
- API.md & API-CHANGELOG.md
- Migration Guides (ab Modul 1.0.0)

---

## 🆕 Neue Dokumentation hinzufügen

### Schritt 1: Speicherort wählen

```
docs/
├── *.md              # Top-Level Docs (Analyse, Guides, API)
├── adr/              # Architecture Decision Records
├── templates/        # Vorlagen für Migration & Deprecation
├── quality-gates/    # Qualitätsmetriken & Ausnahmen
├── releases/         # Release Notes
└── archive/          # Historische Dokumente
```

---

### Schritt 2: Template verwenden (falls vorhanden)

- Migration Guides: [MIGRATION_GUIDE_TEMPLATE.md](./templates/MIGRATION_GUIDE_TEMPLATE.md)
- Deprecations: [DEPRECATION_TEMPLATE.md](./templates/DEPRECATION_TEMPLATE.md)

---

### Schritt 3: In INDEX.md eintragen

Füge das neue Dokument in diesem Index hinzu (passende Kategorie).

---

### Schritt 4: Von anderen Docs verlinken

- README.md: Falls relevant für Übersicht
- QUICK-REFERENCE.md: Falls Schnellreferenz
- PROJECT-ANALYSIS.md: Falls Architektur-relevant

---

## 🎓 Learning Path für neue Entwickler

### Tag 1: Übersicht
1. [README.md](../README.md) → Features & Setup
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Service-Übersicht
3. [VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md) → Breaking-Change-Regeln

### Tag 2-3: Architektur
1. [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md) → Services & Utilities
2. [DEPENDENCY-MAP.md](./DEPENDENCY-MAP.md) → Dependency-Tree
3. [ARCHITECTURE.md](../ARCHITECTURE.md) → Clean Architecture

### Tag 4-5: Deep Dive
1. [BOOTFLOW.md](./BOOTFLOW.md) → Bootstrap-Prozess
2. ADRs lesen → Design-Entscheidungen verstehen
3. [TEST-STRATEGY.md](./TEST-STRATEGY.md) → Test-Strategie & Tools
4. [TESTING.md](./TESTING.md) → Praktische Test-Anleitung

### Woche 2: Praktische Entwicklung
1. [CONFIGURATION.md](./CONFIGURATION.md) → Environment-Setup
2. [jsdoc-styleguide.md](./jsdoc-styleguide.md) → Code-Dokumentation
3. [foundry-di-adapter-guidelines.md](./foundry-di-adapter-guidelines.md) → Foundry-Integration

---

## 🔗 Externe Ressourcen

| Thema | Link |
|-------|------|
| Foundry API | https://foundryvtt.com/api/ |
| Foundry Wiki | https://foundryvtt.wiki/ |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ |
| Clean Architecture | https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html |

---

**Ende Dokumentations-Index**

