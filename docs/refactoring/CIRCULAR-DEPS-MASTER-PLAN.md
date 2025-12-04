# Master-Plan: Zirkuläre Abhängigkeiten beheben

**Status:** 🟡 BEREIT ZUR UMSETZUNG
**Gesamt-Dauer:** 9-13 Stunden
**Aktueller Stand:** 74 circular dependencies
**Ziel:** <10 circular dependencies

---

## 📊 Überblick

### Aktuelle Situation

```powershell
PS> npm run analyze:circular

✖ Found 74 circular dependencies!
```

**Kategorisierung:**

| Kategorie | Anzahl Zyklen | Schweregrad | Prio |
|-----------|---------------|-------------|------|
| **Token Hub Problem** | 69 (93%) | 🔴 KRITISCH | #1 |
| **Domain Ports** | 3 (4%) | 🟡 MITTEL | #2 |
| **RuntimeConfig ↔ EventRegistrar** | ~20 (transitiv) | 🟠 HOCH | #3 |

### Strategie

**Parallelisierbar:**
- ✅ Plan 1 (Tokens) + Plan 2 (Domain Ports) können parallel umgesetzt werden
- ❌ Plan 3 (RuntimeConfig) sollte NACH Plan 1 kommen (nutzt ServiceType Registry)

**Empfohlene Reihenfolge:**
1. Plan 1 (Token Hub) → Größter Impact, unabhängig
2. Plan 2 (Domain Ports) → Parallel zu Plan 1 möglich
3. Plan 3 (RuntimeConfig) → Nutzt Ergebnisse von Plan 1

---

## 📋 Detaillierte Pläne

### Plan 1: Token Hub Problem beheben

**Dokument:** [CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md](./CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md)

**Problem:**
- `infrastructure/shared/tokens/index.ts` ist "God File" mit 180 Zeilen
- Importiert ALLE Service-Typen für ServiceType Union
- Jeder Token-Import lädt transitiv das gesamte Projekt

**Lösung:**
1. ServiceType Union in dedizierte Datei auslagern: `service-type-registry.ts`
2. Token-Imports von Barrel → spezifische Dateien migrieren
3. ESLint-Regel für Deprecation Warning

**Impact:**
- ✅ 69 von 74 Zyklen (93%) behoben
- ✅ Besseres Tree-Shaking
- ✅ Schnellere TypeScript Compilation

**Dauer:** 4-6 Stunden
**Risiko:** 🟢 NIEDRIG (Backward Compatible)

---

### Plan 2: Domain Ports Zyklen beheben

**Dokument:** [CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md](./CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md)

**Problem:**
- `PlatformUIPort` ↔ `JournalDirectoryUiPort` ↔ `NotificationPort`
- `PlatformEntityCollectionPort` ↔ `EntityQueryBuilder`
- Shared Error-Types in Composite Interface

**Lösung:**
1. Error-Types in separate `errors/` Datei auslagern
2. QueryResult Interface für Builder-Pattern
3. Unidirektionale Dependencies: Spezifisch → Basis → Composite

**Impact:**
- ✅ 3 Zyklen behoben
- ✅ Saubere Interface Segregation
- ✅ Wiederverwendbare Error-Types

**Dauer:** 2-3 Stunden
**Risiko:** 🟢 NIEDRIG (Clean Refactoring)

---

### Plan 3: RuntimeConfig ↔ EventRegistrar beheben

**Dokument:** [CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md](./CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md)

**Problem:**
- RuntimeConfigService → runtime-safe-cast.ts → ServiceType → ModuleEventRegistrar → Tokens → RuntimeConfigService
- `runtime-safe-cast.ts` zu zentral mit zu vielen Imports
- Transitive Dependencies über Utility-Datei

**Lösung:**
1. Generische Type-Casts in separate `type-casts.ts` auslagern
2. RuntimeConfigService: Inline Cast statt Utility-Function
3. `runtime-safe-cast.ts` nur noch DI-Container-spezifisch
4. ModuleEventRegistrar: Spezifische Token-Imports

**Impact:**
- ✅ ~20 Zyklen behoben
- ✅ Klare Separation: DI-intern vs. generisch
- ✅ Weniger transitive Imports

**Dauer:** 3-4 Stunden
**Risiko:** 🟡 MITTEL (Viele Dateien betroffen)
**Dependency:** ✅ Plan 1 sollte vorher umgesetzt sein

---

## 🚀 Umsetzungs-Roadmap

### Sprint 1: Token Hub (2 Arbeitstage)

**Tag 1 Vormittag: Setup & Phase 1**
- [ ] Plan 1 lesen und verstehen (30 min)
- [ ] Branch erstellen: `refactor/fix-circular-deps-tokens`
- [ ] Phase 1: ServiceType auslagern (1h)
  - [ ] Neue Datei `service-type-registry.ts` erstellen
  - [ ] DI-Interna umstellen
  - [ ] `tokens/index.ts` bereinigen
  - [ ] Tests: `npm run type-check && npm run analyze:circular`

**Tag 1 Nachmittag: Phase 2 Start**
- [ ] Phase 2: Migration-Script erstellen (1h)
- [ ] Migration-Script testen auf 5 Beispiel-Dateien (30 min)
- [ ] Token-Mapping vervollständigen (30 min)

**Tag 2 Vormittag: Phase 2 Durchführung**
- [ ] Backup erstellen: `git add -A && git commit -m "checkpoint"`
- [ ] Migration-Script ausführen (automatisch, 10 min)
- [ ] Manuelle Prüfung: 10 zufällige Dateien reviewen (30 min)
- [ ] Tests: `npm run type-check && npm run test` (20 min)

**Tag 2 Nachmittag: Phase 3 & Abschluss**
- [ ] Phase 3: ESLint-Regel hinzufügen (15 min)
- [ ] CHANGELOG aktualisieren (15 min)
- [ ] Finale Tests:
  - [ ] `npm run analyze:circular` → Ziel: <10 Zyklen
  - [ ] `npm run check:all`
  - [ ] `npm run build`
- [ ] Pull Request erstellen

**Ergebnis:**
```
Vorher: 74 circular dependencies
Nachher: ~5 circular dependencies (-69)
```

---

### Sprint 2: Domain Ports (1 Arbeitstag - parallel möglich)

**Vormittag: Phasen 1 & 2**
- [ ] Plan 2 lesen (15 min)
- [ ] Branch: `refactor/fix-circular-deps-domain-ports`
- [ ] Phase 1: Error-Types auslagern (45 min)
  - [ ] `errors/platform-ui-error.interface.ts` erstellen
  - [ ] Import-Pfade aktualisieren (Script)
  - [ ] Test: `npm run type-check && npm run analyze:circular`
- [ ] Phase 2: Collection/QueryBuilder (1h)
  - [ ] `query-result.interface.ts` erstellen
  - [ ] QueryBuilder refactoren
  - [ ] Collection aktualisieren

**Nachmittag: Phase 3 & Abschluss**
- [ ] Phase 3: Implementations aktualisieren (1h)
  - [ ] Adapter finden
  - [ ] Migration-Script ausführen
  - [ ] Manuelle Prüfung
- [ ] Tests & Finalisierung:
  - [ ] `npm run analyze:circular` → Ziel: -3 Zyklen
  - [ ] `npm run check:all`
- [ ] Pull Request erstellen

**Ergebnis:**
```
Vorher: ~5 circular dependencies (nach Sprint 1)
Nachher: ~2 circular dependencies (-3)
```

---

### Sprint 3: RuntimeConfig (2 Arbeitstage)

**Tag 1 Vormittag: Vorbereitung & Phase 1**
- [ ] Plan 3 lesen (20 min)
- [ ] Sicherstellen: Plan 1 ist merged!
- [ ] Branch: `refactor/fix-circular-deps-runtime-config`
- [ ] Phase 1: Generische Casts auslagern (1h)
  - [ ] `type-casts.ts` erstellen
  - [ ] RuntimeConfigService: Inline Cast
  - [ ] Test: `npm run type-check`

**Tag 1 Nachmittag: Phase 2**
- [ ] Phase 2: runtime-safe-cast.ts bereinigen (1h)
  - [ ] Funktionen entfernen/verschieben
  - [ ] PowerShell Migration-Script ausführen
  - [ ] Import-Updates validieren
- [ ] Tests: `npm run type-check && npm run test`

**Tag 2 Vormittag: Phase 3 & 4**
- [ ] Phase 3: ModuleEventRegistrar optimieren (30 min)
- [ ] Phase 4: Verifizierung (1h)
  - [ ] Dependency-Graph prüfen
  - [ ] Unit-Tests
  - [ ] Type-Coverage
  - [ ] `npm run analyze:circular` → Ziel: 0 Zyklen!

**Tag 2 Nachmittag: Finalisierung**
- [ ] CHANGELOG aktualisieren
- [ ] Dokumentation prüfen
- [ ] Finale Tests: `npm run check:all && npm run build`
- [ ] Pull Request erstellen

**Ergebnis:**
```
Vorher: ~2 circular dependencies (nach Sprint 2)
Nachher: 0 circular dependencies! 🎉
```

---

## ✅ Definition of Done

### Pro Sprint

- [ ] Alle Code-Änderungen committed
- [ ] Alle Tests grün (`npm run test`)
- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Type-Coverage bei 100% (`npm run type-coverage`)
- [ ] Keine neuen Linter-Fehler (`npm run lint`)
- [ ] Zirkuläre Dependencies reduziert (verifiziert mit `npm run analyze:circular`)
- [ ] CHANGELOG aktualisiert
- [ ] Pull Request erstellt & reviewed

### Gesamt-Projekt

- [ ] **0 circular dependencies!** (`npm run analyze:circular`)
- [ ] Alle 3 Pläne umgesetzt
- [ ] Bundle-Size gleich oder kleiner
- [ ] TypeScript Compilation-Zeit reduziert
- [ ] E2E-Tests erfolgreich (`npm run test:e2e`)
- [ ] Build erfolgreich (`npm run build`)
- [ ] Dokumentation aktualisiert:
  - [ ] CHANGELOG.md
  - [ ] ARCHITECTURE.md (wenn relevant)
  - [ ] QUICK-REFERENCE.md (wenn relevant)

---

## 📊 Progress Tracking

**Verwendung:**

```markdown
- [ ] **Sprint 1**: Token Hub Problem
  - [ ] Tag 1: Phase 1 & 2 Start
  - [ ] Tag 2: Phase 2 & 3 Abschluss
  - Status: 🟡 TODO / 🔵 IN PROGRESS / 🟢 DONE
  - Circular Deps: 74 → ___

- [ ] **Sprint 2**: Domain Ports
  - [ ] Vormittag: Phasen 1 & 2
  - [ ] Nachmittag: Phase 3 & Abschluss
  - Status: 🟡 TODO / 🔵 IN PROGRESS / 🟢 DONE
  - Circular Deps: ___ → ___

- [ ] **Sprint 3**: RuntimeConfig
  - [ ] Tag 1: Phasen 1 & 2
  - [ ] Tag 2: Phasen 3 & 4
  - Status: 🟡 TODO / 🔵 IN PROGRESS / 🟢 DONE
  - Circular Deps: ___ → 0 🎉
```

**Update bei jeder Phase:**

```powershell
# Snapshot nach jeder Phase
npm run analyze:circular > "docs/refactoring/progress/circular-deps-sprint-X-phase-Y.txt"
git add -A
git commit -m "refactor: sprint X phase Y completed - XX circular deps remaining"
```

---

## 🔧 Hilfreiche Commands

### Während der Umsetzung

```powershell
# Zirkuläre Abhängigkeiten checken
npm run analyze:circular

# Diagramme neu generieren
npm run analyze:all

# Dependencies einer Datei anzeigen
npx madge --ts-config tsconfig.json --extensions ts --depends src/path/to/file.ts

# Circular Dependencies Bild erstellen
npx madge --ts-config tsconfig.json --extensions ts --circular --image circular-deps.svg src/

# Type-Check während Entwicklung
npm run type-check:watch

# Tests im Watch-Mode
npm run test:watch

# Kompletter Check
npm run check:all
```

### Bei Problemen

```powershell
# Branch Status
git status
git diff

# Letzten Commit rückgängig (aber Änderungen behalten)
git reset --soft HEAD~1

# Kompletter Rollback (VORSICHT!)
git reset --hard HEAD~1

# Merge-Konflikte: Theirs übernehmen
git checkout --theirs package.json
git add package.json
git commit

# Neue Baseline erstellen
git add -A
git commit -m "checkpoint: before risky operation"
```

---

## 📚 Ressourcen

### Dokumentation

- [Plan 1: Token Hub Problem](./CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md)
- [Plan 2: Domain Ports](./CIRCULAR-DEPS-FIX-PLAN-2-DOMAIN-PORTS.md)
- [Plan 3: RuntimeConfig](./CIRCULAR-DEPS-FIX-PLAN-3-RUNTIME-CONFIG.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [DEPENDENCY-MAP.md](../DEPENDENCY-MAP.md)

### Tools

- **Madge:** Dependency-Analyse und Visualisierung
- **TypeScript:** Type-Checking
- **ESLint:** Linting und Deprecation Warnings
- **Vitest:** Unit-Tests
- **Playwright:** E2E-Tests

### Externe Links

- [Circular Dependencies in TypeScript (Blog)](https://medium.com/@michael_lyons/circular-dependencies-in-typescript-d9f4d46cd91a)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Interface Segregation Principle](https://en.wikipedia.org/wiki/Interface_segregation_principle)

---

## 💡 Best Practices aus den Plänen

### 1. Shared Types gehören in separate Dateien

❌ **Falsch:**
```typescript
// composite-interface.ts
export interface CompositeError { ... }
export interface Composite extends SpecificA, SpecificB {}
```

✅ **Richtig:**
```typescript
// errors/composite-error.ts
export interface CompositeError { ... }

// composite-interface.ts
import type { CompositeError } from "./errors/composite-error";
export interface Composite extends SpecificA, SpecificB {}
```

### 2. Utility-Funktionen nur bei echtem Shared-Use

❌ **Falsch:**
```typescript
// utils.ts (mit vielen Imports)
import { ServiceType } from "...";
export function myUtil<T extends ServiceType>(...) { ... }
```

✅ **Richtig:**
```typescript
// Inline im Service
class MyService {
  private myUtil(...) {
    return value as ExpectedType;
  }
}
```

### 3. Spezifische Imports statt Barrel-Exports

❌ **Falsch:**
```typescript
import { token1, token2, token3 } from "@/infrastructure/shared/tokens";
// → Lädt ALLE Tokens und ServiceType Union
```

✅ **Richtig:**
```typescript
import { token1 } from "@/infrastructure/shared/tokens/core.tokens";
import { token2 } from "@/infrastructure/shared/tokens/ports.tokens";
```

---

## 🎯 Erfolgsmessung

### Metriken

| Metrik | Vorher | Ziel | Nachher |
|--------|--------|------|---------|
| Circular Dependencies | 74 | 0 | ___ |
| Bundle Size | X KB | ≤X KB | ___ KB |
| TS Compilation Time | X sec | <X sec | ___ sec |
| Type Coverage | 100% | 100% | ___% |

### Qualitative Erfolge

- [ ] Code ist wartbarer (weniger transitive Dependencies)
- [ ] Build-Zeit ist schneller
- [ ] Architektur ist sauberer (Layer-Separation)
- [ ] Entwickler-Experience verbessert (schnelleres Type-Checking)
- [ ] Tree-Shaking funktioniert besser

---

**Status:** 🟡 BEREIT ZUR UMSETZUNG
**Nächster Schritt:** Sprint 1 starten
**Verantwortlich:** Development Team
**Review durch:** Tech Lead / Senior Developer

---

**Changelog:**
- 2025-12-04: Initial creation
- ___ : Sprint 1 completed
- ___ : Sprint 2 completed
- ___ : Sprint 3 completed ✅

