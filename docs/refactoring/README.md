# Refactoring Documentation

Dieses Verzeichnis enthält alle Refactoring-Pläne, Analysen und Migrationsstrategien für das Projekt.

---

## 🔄 Aktive Refactorings

### Zirkuläre Abhängigkeiten beheben (Stand: 2025-12-04)

**Status:** 🟡 GEPLANT
**Priorität:** 🔴 HOCH
**Anzahl Zyklen:** 74

**Dokumente:**

| Dokument | Beschreibung | Zyklen | Dauer | Prio |
|----------|--------------|--------|-------|------|
| [Master-Plan](./CIRCULAR-DEPS-MASTER-PLAN.md) | Übergeordnete Roadmap und Koordination | Alle | 9-13h | - |
| [Plan 1: Token Hub](./CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md) | ServiceType Union & Token-Imports | 69 (93%) | 4-6h | #1 |
| [Plan 2: Domain Ports](./CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md) | Interface Segregation | 3 (4%) | 2-3h | #2 |
| [Plan 3: RuntimeConfig](./CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md) | Utility-Functions & Type-Casts | ~20 | 3-4h | #3 |

**Quick Commands:**

```powershell
# Analyse durchführen
npm run analyze:circular
npm run analyze:all

# Während der Umsetzung
npm run type-check:watch
npm run test:watch

# Nach jeder Phase
npm run check:all
```

---

## 📊 Analyse-Ergebnisse

### Dependency-Graphen (Stand: 2025-12-04)

Generiert mit: `npm run analyze:all`

**Dateien:**
- `architecture.svg` - Gesamtübersicht (365 Dateien)
- `domain.svg` - Domain Layer (35 Dateien)
- `application.svg` - Application Layer (245 Dateien)
- `infrastructure.svg` - Infrastructure Layer (290 Dateien)
- `framework.svg` - Framework Layer (237 Dateien)
- `dependencies.json` - Alle Dependencies als JSON
- `circular-dependencies.json` - Nur zirkuläre Dependencies als JSON

**Hinweis:** Diese Dateien sind in `.gitignore` und werden lokal generiert.

### Zirkuläre Abhängigkeiten

**Kategorisierung:**

```
Token Hub Problem (69 Zyklen - 93%)
├── infrastructure/shared/tokens/index.ts
│   ├── Exportiert alle Token-Kategorien
│   ├── Definiert ServiceType Union (180 Zeilen)
│   └── Importiert ALLE Service-Typen
│
├── Folge: Jeder Token-Import lädt gesamtes Projekt
└── Lösung: ServiceType auslagern, spezifische Token-Imports

Domain Ports (3 Zyklen - 4%)
├── PlatformUIPort ↔ JournalDirectoryUiPort ↔ NotificationPort
├── PlatformEntityCollectionPort ↔ EntityQueryBuilder
│
├── Folge: Shared Error-Type in Composite Interface
└── Lösung: Error-Types auslagern, QueryResult Interface

RuntimeConfig ↔ EventRegistrar (~20 Zyklen transitiv)
├── RuntimeConfigService → runtime-safe-cast.ts
│   → ServiceType → ModuleEventRegistrar
│   → tokens → RuntimeConfigService
│
├── Folge: Transitive Dependencies über Utility-Datei
└── Lösung: Inline Casts, runtime-safe-cast aufteilen
```

**Keine funktionalen Auswirkungen**, aber:
- ❌ Längere Build-Zeiten
- ❌ Schlechteres Tree-Shaking
- ❌ Schwierigere Code-Navigation
- ❌ Höhere Coupling zwischen Modulen

---

## 🎯 Umsetzungs-Timeline

### Sprint 1: Token Hub (2 Tage)
**Geplant:** TBD
**Assignee:** TBD

- [x] Analyse abgeschlossen
- [x] Plan erstellt
- [ ] Phase 1: ServiceType auslagern
- [ ] Phase 2: Token-Imports migrieren
- [ ] Phase 3: Deprecation Warnings

**Erwartetes Ergebnis:** 74 → 5 circular deps (-69)

---

### Sprint 2: Domain Ports (1 Tag)
**Geplant:** TBD (parallel zu Sprint 1 möglich)
**Assignee:** TBD

- [x] Analyse abgeschlossen
- [x] Plan erstellt
- [ ] Phase 1: Error-Types auslagern
- [ ] Phase 2: QueryBuilder refactoren
- [ ] Phase 3: Implementations aktualisieren

**Erwartetes Ergebnis:** 5 → 2 circular deps (-3)

---

### Sprint 3: RuntimeConfig (2 Tage)
**Geplant:** TBD (NACH Sprint 1)
**Assignee:** TBD

- [x] Analyse abgeschlossen
- [x] Plan erstellt
- [ ] Phase 1: Generische Casts auslagern
- [ ] Phase 2: runtime-safe-cast bereinigen
- [ ] Phase 3: Token-Imports optimieren
- [ ] Phase 4: Verifizierung

**Erwartetes Ergebnis:** 2 → 0 circular deps (-2) 🎉

---

## 📚 Weitere Refactoring-Dokumentation

### Abgeschlossene Refactorings

*(Ältere Refactorings werden hier verlinkt)*

### Best Practices

**Zirkuläre Abhängigkeiten vermeiden:**

1. ✅ **Shared Types in separate Dateien**
   - Error-Types, Result-Types, Query-Types
   - Keine Business-Logik in Type-Definitionen

2. ✅ **Unidirektionale Dependencies**
   - Spezifisch → Basis → Composite
   - Domain ← Application ← Infrastructure ← Framework

3. ✅ **Spezifische Imports statt Barrel-Exports**
   ```typescript
   // ❌ Falsch
   import { token1, token2 } from "@/infrastructure/shared/tokens";

   // ✅ Richtig
   import { token1 } from "@/infrastructure/shared/tokens/core.tokens";
   ```

4. ✅ **Utility-Functions nur bei echtem Shared-Use**
   - Mind. 3 Nutzungsstellen
   - Minimale Imports
   - Echte Generik (nicht Domain-spezifisch)

5. ✅ **Inline Casts bevorzugen**
   - Für einfache Type-Casts (1-2 Zeilen)
   - Service-spezifische Logik
   - Vermeidet transitive Dependencies

---

## 🔧 Tools & Commands

### Dependency-Analyse

```powershell
# Zirkuläre Dependencies finden
npm run analyze:circular

# Visualisierung erstellen
npm run analyze:all

# Dependencies einer Datei anzeigen
npx madge --ts-config tsconfig.json --extensions ts --depends src/path/to/file.ts

# Diagramm mit Highlighting
npx madge --ts-config tsconfig.json --extensions ts --image deps.svg --highlight src/my-file.ts src/
```

### Während der Entwicklung

```powershell
# Type-Check im Watch-Mode
npm run type-check:watch

# Tests im Watch-Mode
npm run test:watch

# Kompletter Check
npm run check:all

# Build
npm run build
```

### Git-Workflow

```powershell
# Checkpoint erstellen
git add -A
git commit -m "checkpoint: before risky operation"

# Progress Snapshot
npm run analyze:circular > "docs/refactoring/progress/circular-deps-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt"

# Branch erstellen
git checkout -b refactor/fix-circular-deps-tokens

# Pull Request
# → GitHub Web UI
```

---

## 📊 Metriken & KPIs

### Ziele

| Metrik | Aktuell | Ziel | Status |
|--------|---------|------|--------|
| Circular Dependencies | 74 | 0 | 🟡 Planned |
| Bundle Size | TBD | ≤ Current | 🟡 Planned |
| TS Compilation Time | TBD | < Current | 🟡 Planned |
| Type Coverage | 100% | 100% | ✅ Maintained |

### Progress Tracking

**Nach jeder Phase aktualisieren:**

```markdown
Sprint 1 - Token Hub:
- Phase 1 ✅: 74 → 74 deps (Setup)
- Phase 2 🔵: 74 → 10 deps (Migration)
- Phase 3 ⏸️: 10 → 5 deps (Finalisierung)

Sprint 2 - Domain Ports:
- Phase 1 ⏸️: 5 → 4 deps
- Phase 2 ⏸️: 4 → 2 deps
- Phase 3 ⏸️: 2 → 2 deps

Sprint 3 - RuntimeConfig:
- Phase 1 ⏸️: 2 → 2 deps
- Phase 2 ⏸️: 2 → 1 deps
- Phase 3 ⏸️: 1 → 0 deps 🎉
```

---

## 🤝 Contributing

### Refactoring durchführen

1. **Plan lesen** - Vollständig den relevanten Plan durchlesen
2. **Branch erstellen** - `refactor/fix-circular-deps-<thema>`
3. **Checkpoints** - Nach jeder Phase committen
4. **Tests** - Immer `npm run check:all` vor Push
5. **PR erstellen** - Mit Link zum Plan und Metrics

### Neuen Refactoring-Plan erstellen

**Template:** [REFACTORING-PLAN-TEMPLATE.md](./REFACTORING-PLAN-TEMPLATE.md) *(TODO)*

**Struktur:**
- Problem-Analyse (mit Beispielen)
- Ziel-Architektur (mit Diagrammen)
- Schritt-für-Schritt Umsetzung (mit Code)
- Erfolgskriterien (messbar)
- Rollback-Plan (für jede Phase)

### Review-Checklist

- [ ] Plan ist vollständig und verständlich
- [ ] Code-Beispiele sind korrekt
- [ ] Tests sind definiert
- [ ] Rollback-Plan vorhanden
- [ ] Impact auf andere Systeme analysiert
- [ ] Breaking Changes dokumentiert
- [ ] Migration-Scripts getestet

---

## 📖 Weitere Dokumentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Gesamt-Architektur
- [DEPENDENCY-MAP.md](../DEPENDENCY-MAP.md) - Dependency-Übersicht
- [QUICK-REFERENCE.md](../QUICK-REFERENCE.md) - Quick-Reference
- [ADRs](../adr/) - Architecture Decision Records

---

**Letzte Aktualisierung:** 2025-12-04
**Maintainer:** Development Team

