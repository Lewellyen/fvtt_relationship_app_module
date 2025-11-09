# Dokumentations-Index

**Model:** Claude Sonnet 4.5  
**Datum:** 2025-11-09  
**Projekt:** FVTT Relationship App Module v0.8.0

---

## 📚 Dokumentations-Übersicht

### 🎯 Für Entwickler (Start hier!)

| Dokument | Zweck | Wann lesen? |
|----------|-------|-------------|
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Schnellreferenz für tägliche Entwicklung | ⭐ **START** |
| **[VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md)** | Breaking Changes & Deprecation-Strategie | ⭐ **VOR REFACTORING** |
| **[PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)** | Vollständige Projektanalyse | Architektur verstehen |
| **[DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md)** | Detaillierte Service-Dependencies | Refactoring planen |

---

### 📖 Architektur & Design

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Clean Architecture Patterns ⭐ v0.8.0 | Architekten, Senior Devs |
| [BOOTFLOW.md](./BOOTFLOW.md) | Bootstrap-Prozess & Lifecycle ⭐ v0.8.0 | DI-Container-Entwicklung |
| [DOKUMENTATIONS_UPDATES_2025-11-09.md](./DOKUMENTATIONS_UPDATES_2025-11-09.md) | Update-Log für v0.8.0 ⭐ NEU | Alle Entwickler |
| [CONFIGURATION.md](./CONFIGURATION.md) | Environment & Settings | Alle Entwickler |
| [API.md](./API.md) | Öffentliche Modul-API | Externe Consumer (ab 1.0.0) |
| [API-CHANGELOG.md](./API-CHANGELOG.md) | API-Änderungshistorie ⭐ NEU | Externe Consumer (ab 1.0.0) |

---

### 🧪 Testing & Quality

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [TESTING.md](./TESTING.md) | Test-Strategie & Best Practices | Alle Entwickler |
| [Test-Suite-Plan.md](./guides/Test-Suite-Plan.md) | Vollständiger Test-Plan | QA, Test-Entwicklung |
| [Test-Coverage-Report.md](./guides/Test-Coverage-Report.md) | Coverage-Analyse | QA |

---

### 📐 Architecture Decision Records (ADRs)

| ADR | Titel | Status |
|-----|-------|--------|
| [ADR-0001](./adr/0001-use-result-pattern-instead-of-exceptions.md) | Result Pattern statt Exceptions | ✅ Aktiv |
| [ADR-0002](./adr/0002-custom-di-container-instead-of-tsyringe.md) | Custom DI Container | ✅ Aktiv |
| [ADR-0003](./adr/0003-port-adapter-for-foundry-version-compatibility.md) | Port-Adapter-Pattern | ✅ Aktiv |
| [ADR-0004](./adr/0004-valibot-for-input-validation.md) | Valibot für Validation | ✅ Aktiv |
| [ADR-0005](./adr/0005-metrics-collector-singleton-to-di.md) | MetricsCollector via DI | ✅ Aktiv |
| [ADR-0006](./adr/0006-observability-strategy.md) | Observability Strategy ⭐ Updated 2025-11-09 | ✅ Aktiv |
| [ADR-0007](./adr/0007-clean-architecture-layering.md) | Clean Architecture Layers | ✅ Aktiv |
| [ADR-0008](./adr/0008-console-vs-logger-interface.md) | Console vs Logger Interface | ✅ Aktiv |

**Neue ADRs erstellen:** Siehe [ADR README](./adr/README.md)

---

### 🔧 Development Guides

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [foundry-di-adapter-guidelines.md](./guides/foundry-di-adapter-guidelines.md) | DI-Adapter-Entwicklung | Foundry-Integration |
| [Logger-Availability-Strategy.md](./guides/Logger-Availability-Strategy.md) | Logger-Nutzung während Bootstrap | Infrastructure-Entwicklung |
| [jsdoc-styleguide.md](./jsdoc-styleguide.md) | JSDoc-Konventionen | Alle Entwickler |
| [Dependency-Analysis-Tools-Comparison.md](./guides/Dependency-Analysis-Tools-Comparison.md) | Tool-Vergleich | DevOps |

---

### 🔬 Foundry VTT Spezifisch & Releases

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [releases/*.md](./releases/) | Release-Notes (v0.0.4 - v0.7.1, 26 Docs) ⭐ | Alle |
| [Begriffserläuterungen.txt](./guides/Begriffserläuterungen.txt) | Foundry-Begriffe | Neue Entwickler |

---

### 📊 Reports & Type Coverage

| Dokument | Zweck | Zielgruppe |
|----------|-------|-----------|
| [type-coverage-exclusions.md](./guides/type-coverage-exclusions.md) | Type-Coverage-Ausnahmen | TypeScript-Entwicklung |
| [archive/](./archive/) | Historische Audits (Archiv) | Historisch |

---

## 🚀 Quick-Navigation nach Use-Case

### "Ich will einen neuen Service erstellen"
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → "Service-Erstellung Cheat Sheet"
2. [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) → "Dependency Injection Token Registry"
3. [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → "Best Practices für neue Services"

---

### "Ich will Refactoring durchführen"
1. ⭐ **[VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md)** → Pre-Release vs Production Rules
2. [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → "Refactoring-Empfehlungen"
3. [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) → "Refactoring-Impact-Analyse"

---

### "Ich will die Architektur verstehen"
1. [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → "Services" & "Infrastruktur"
2. [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) → "Dependency Tree"
3. [ARCHITECTURE.md](../ARCHITECTURE.md) → Clean Architecture Details
4. [BOOTFLOW.md](./BOOTFLOW.md) → Bootstrap-Prozess

---

### "Ich will einen Port für neue Foundry-Version erstellen"
1. [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → "Zukunftssicherheit & Erweiterbarkeit"
2. [foundry-di-adapter-guidelines.md](./guides/foundry-di-adapter-guidelines.md)
3. [ADR-0003](./adr/0003-port-adapter-for-foundry-version-compatibility.md) → Port-Adapter-Pattern

**Prozess:**
1. Foundry API-Änderungen analysieren
2. Port-Implementierung (z.B. `src/foundry/ports/v14/*.ts`)
3. Port in Registry registrieren (`dependencyconfig.ts`)
4. `module.json` aktualisieren: `"maximum": [VERSION]`
5. Tests erweitern

---

### "Ich will Tests schreiben"
1. [TESTING.md](./TESTING.md) → Testing-Strategie
2. [Test-Suite-Plan.md](./development/Test-Suite-Plan.md) → Vollständiger Plan
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → "Testing Cheat Sheet"

---

### "Ich suche Breaking Change Guidelines"
1. ⭐ **[VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md)** → Vollständige Strategie
2. [templates/DEPRECATION_TEMPLATE.md](./templates/DEPRECATION_TEMPLATE.md) → Code-Templates
3. [templates/MIGRATION_GUIDE_TEMPLATE.md](./templates/MIGRATION_GUIDE_TEMPLATE.md) → Migration Guide Template

---

## 📝 Template-Verzeichnis

| Template | Zweck | Wann verwenden? |
|----------|-------|----------------|
| [MIGRATION_GUIDE_TEMPLATE.md](./templates/MIGRATION_GUIDE_TEMPLATE.md) | Migration Guide | Ab Version 1.0.0 (Breaking Changes) |
| [DEPRECATION_TEMPLATE.md](./templates/DEPRECATION_TEMPLATE.md) | Deprecation-Annotations | Ab Version 1.0.0 (vor Breaking Changes) |

**Aktuell (0.x.x):** Templates nicht benötigt (Legacy-Code sofort entfernen)

---

## 🔄 Dokumentations-Update-Workflow

### Bei Code-Änderungen

**IMMER aktualisieren:**
- [ ] [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) - Bei neuen Services/Dependencies
- [ ] [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) - Bei Dependency-Änderungen
- [ ] [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Bei API-Änderungen

**Manchmal aktualisieren:**
- [ ] [ARCHITECTURE.md](../ARCHITECTURE.md) - Bei Architektur-Änderungen
- [ ] [API.md](./API.md) - Bei Public API-Änderungen
- [ ] [CHANGELOG.md](../CHANGELOG.md) - Bei jedem Release

**Nur bei speziellen Änderungen:**
- [ ] [BOOTFLOW.md](./BOOTFLOW.md) - Bei Bootstrap-Änderungen
- [ ] [CONFIGURATION.md](./CONFIGURATION.md) - Bei ENV/Settings-Änderungen
- [ ] [TESTING.md](./TESTING.md) - Bei Test-Strategie-Änderungen

---

### Bei Breaking Changes (ab 1.0.0)

1. **Deprecation Phase:**
   - [ ] JSDoc `@deprecated` Annotations hinzufügen
   - [ ] Runtime-Warnings implementieren
   - [ ] CHANGELOG.md: "Deprecated" Section
   - [ ] Migration Guide erstellen (Template nutzen)

2. **Removal Phase:**
   - [ ] Legacy-Code entfernen
   - [ ] CHANGELOG.md: "⚠️ BREAKING CHANGES" Section
   - [ ] Migration Guide aktualisieren
   - [ ] Release Notes prominent kommunizieren

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

### Monatlich
- [ ] Aktualisiere PROJECT_ANALYSIS.md (neue Services/Refactorings)
- [ ] Prüfe DEPENDENCY_MAP.md (neue Dependencies)
- [ ] Aktualisiere Test-Coverage-Report.md

### Vierteljährlich
- [ ] Review aller ADRs (Status aktualisieren)
- [ ] Architektur-Audit (ARCHITECTURE.md)
- [ ] Dokumentations-Qualitäts-Check

### Vor jedem Release
- [ ] CHANGELOG.md aktualisieren
- [ ] API.md prüfen (Breaking Changes?)
- [ ] Migration Guides erstellen (ab 1.0.0)

---

## 🆕 Neue Dokumentation hinzufügen

### Schritt 1: Platzierung bestimmen

```
docs/
├── *.md                    # Top-Level Docs (Analysis, API, etc.)
├── adr/                    # Architecture Decision Records
├── templates/              # Templates für Migration Guides, etc.
├── guides/                 # Development Guides ⭐ UMBENANNT
├── releases/               # Release-Notes ⭐ VERSCHOBEN
└── archive/                # Historische Dokumente ⭐ NEU
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
- QUICK_REFERENCE.md: Falls Schnellreferenz
- PROJECT_ANALYSIS.md: Falls Architektur-relevant

---

## 🎓 Learning Path für neue Entwickler

### Tag 1: Übersicht
1. [README.md](../README.md) → Features & Setup
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Service-Übersicht
3. [VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md) → Breaking-Change-Regeln

### Tag 2-3: Architektur
1. [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → Services & Utilities
2. [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) → Dependency-Tree
3. [ARCHITECTURE.md](../ARCHITECTURE.md) → Clean Architecture

### Tag 4-5: Deep Dive
1. [BOOTFLOW.md](./BOOTFLOW.md) → Bootstrap-Prozess
2. ADRs lesen → Design-Entscheidungen verstehen
3. [TESTING.md](./TESTING.md) → Test-Strategie

### Woche 2: Praktische Entwicklung
1. [CONFIGURATION.md](./CONFIGURATION.md) → Environment-Setup
2. [jsdoc-styleguide.md](./jsdoc-styleguide.md) → Code-Dokumentation
3. [foundry-di-adapter-guidelines.md](./guides/foundry-di-adapter-guidelines.md) → Foundry-Integration

---

## 📊 Dokumentations-Statistiken

| Kategorie | Anzahl |
|-----------|-------:|
| **Top-Level Docs** | 8 |
| **ADRs** | 8 |
| **Development Guides** | 30+ |
| **Templates** | 2 |
| **Audits** | 13 |
| **Gesamt** | ~60+ Dokumente |

---

## 🔗 Externe Ressourcen

### Foundry VTT
- [Foundry VTT API Documentation](https://foundryvtt.com/api/)
- [Foundry VTT Wiki](https://foundryvtt.wiki/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Architecture Patterns
- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Result Pattern in TypeScript](https://imhoff.blog/posts/using-results-in-typescript)
- [Dependency Injection Patterns](https://martinfowler.com/articles/injection.html)

---

**Ende Dokumentations-Index**

