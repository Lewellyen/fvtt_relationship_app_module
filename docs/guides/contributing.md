# Beitragen zum Projekt

**Zweck:** Anleitung für Contributors
**Zielgruppe:** Entwickler, die zum Projekt beitragen möchten
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Übersicht

Vielen Dank für dein Interesse, zum Beziehungsnetzwerke-Modul beizutragen! Dieses Dokument erklärt den Beitragsprozess.

---

## Schnellstart

1. **Fork** das Repository auf GitHub
2. **Clone** deinen Fork lokal
3. **Branch** erstellen (`feature/mein-feature` oder `fix/mein-bugfix`)
4. **Änderungen** implementieren
5. **Tests** schreiben und ausführen
6. **Quality-Checks** bestehen
7. **Pull Request** erstellen

---

## Entwicklungsumgebung einrichten

### Voraussetzungen

- **Node.js 20.12.0+** (siehe `package.json` engines)
- **npm 10.0.0+** oder pnpm
- **Foundry VTT 13+** (für manuelle Tests)
- **Git**

### Setup

```bash
# Repository forken und clonen
git clone https://github.com/DEIN-USERNAME/fvtt_relationship_app_module.git
cd fvtt_relationship_app_module

# Dependencies installieren
npm install

# Development-Build starten
npm run dev
```

**Detaillierte Anleitung:** [Entwicklungssetup](../getting-started/setup.md)

---

## Branching-Strategie

### Branch-Namenskonvention

| Prefix | Verwendung | Beispiel |
|--------|------------|----------|
| `feature/` | Neue Features | `feature/relationship-graph` |
| `fix/` | Bugfixes | `fix/journal-visibility-crash` |
| `refactor/` | Code-Refactoring | `refactor/cache-service` |
| `docs/` | Dokumentation | `docs/api-reference` |
| `chore/` | Wartung | `chore/update-dependencies` |

### Workflow

```bash
# Neuen Branch erstellen
git checkout -b feature/mein-feature

# Änderungen committen
git add .
git commit -m "feat: mein neues Feature"

# Push zu deinem Fork
git push origin feature/mein-feature
```

---

## Commit-Konventionen

Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Beschreibung |
|------|--------------|
| `feat` | Neues Feature |
| `fix` | Bugfix |
| `docs` | Dokumentation |
| `refactor` | Code-Refactoring |
| `test` | Tests hinzufügen/ändern |
| `chore` | Wartung, Build, etc. |
| `perf` | Performance-Verbesserung |

### Beispiele

```bash
# Feature
git commit -m "feat(journal): add hidden entry counter"

# Bugfix
git commit -m "fix(cache): prevent race condition on invalidation"

# Dokumentation
git commit -m "docs(api): update token documentation"

# Refactoring
git commit -m "refactor(di): extract port registration logic"
```

---

## Code-Standards

### Pflicht-Checks vor PR

```bash
# Alle Checks ausführen
npm run check-all
```

Dies prüft:
- ✅ TypeScript-Kompilierung
- ✅ ESLint (keine Errors/Warnings)
- ✅ Prettier-Formatierung
- ✅ Stylelint (CSS)
- ✅ UTF-8 Encoding
- ✅ Svelte-Check
- ✅ Type-Coverage (100%)
- ✅ Test-Coverage (100%)

### Coverage-Anforderungen

| Metrik | Anforderung |
|--------|-------------|
| Lines | 100% |
| Functions | 100% |
| Branches | 100% |
| Statements | 100% |
| Type Coverage | 100% |

**Detaillierte Standards:** [Code-Standards](../development/coding-standards.md)

---

## Tests schreiben

### Test-Struktur

Tests sind co-located mit dem Source-Code:

```
src/
├── services/
│   ├── my-service.ts
│   └── __tests__/
│       └── my-service.test.ts
```

### Test-Beispiel

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyService } from "../my-service";

describe("MyService", () => {
  it("should do something", () => {
    // Arrange
    const mockLogger = { info: vi.fn() };
    const service = new MyService(mockLogger);

    // Act
    const result = service.doSomething();

    // Assert
    expect(result.ok).toBe(true);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
```

### Tests ausführen

```bash
# Alle Tests
npm test

# Watch-Modus
npm run test:watch

# Mit Coverage
npm run test:coverage
```

**Detaillierte Test-Dokumentation:** [Testing](../development/testing.md)

---

## Pull Request erstellen

### PR-Template

```markdown
## Beschreibung

[Kurze Beschreibung der Änderungen]

## Änderungstyp

- [ ] Feature
- [ ] Bugfix
- [ ] Refactoring
- [ ] Dokumentation
- [ ] Andere: ________

## Checkliste

- [ ] `npm run check-all` erfolgreich
- [ ] Tests hinzugefügt/aktualisiert
- [ ] Dokumentation aktualisiert
- [ ] CHANGELOG.md aktualisiert (bei Features/Fixes)

## Related Issues

Fixes #[Issue-Nummer]
```

### PR-Prozess

1. **PR erstellen** auf GitHub
2. **Beschreibung** ausfüllen
3. **Checks** abwarten (CI/CD)
4. **Review** von Maintainer
5. **Änderungen** einarbeiten (falls nötig)
6. **Merge** durch Maintainer

---

## Dokumentation beitragen

### Dokumentations-Struktur

```
docs/
├── getting-started/     # Einstieg
├── architecture/        # Architektur
├── development/         # Entwicklung
├── guides/              # Anleitungen
├── reference/           # Referenz
├── decisions/           # ADRs
├── quality/             # Qualität
└── templates/           # Templates
```

### Dokumentations-Standards

- **Sprache:** Deutsch (außer Code-Beispiele)
- **Format:** Markdown
- **Metadaten-Header:** In jeder Datei
- **Verlinkung:** Relative Pfade
- **Code-Beispiele:** Mit Sprach-Tag

### Metadaten-Header

```markdown
# Titel

**Zweck:** [Kurzbeschreibung]
**Zielgruppe:** [Entwickler, Maintainer, etc.]
**Letzte Aktualisierung:** YYYY-MM-DD
**Projekt-Version:** X.Y.Z

---
```

---

## Issues erstellen

### Bug-Report

**Template:** `.github/ISSUE_TEMPLATE/bug_report.md`

Bitte angeben:
- Foundry VTT Version
- Modul-Version
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Console-Logs (falls vorhanden)

### Feature-Request

**Template:** `.github/ISSUE_TEMPLATE/feature_request.md`

Bitte angeben:
- Beschreibung des Features
- Anwendungsfall
- Mögliche Implementierung (optional)

---

## Code of Conduct

Wir erwarten von allen Contributors:

- **Respektvoller Umgang** miteinander
- **Konstruktives Feedback** geben und annehmen
- **Hilfsbereitschaft** gegenüber Neulingen
- **Fokus** auf das Projektziel

**Vollständiger Code of Conduct:** [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)

---

## Kontakt

- **GitHub Issues:** [Issues](https://github.com/Lewellyen/fvtt_relationship_app_module/issues)
- **Discord:** `lewellyen`
- **Email:** forenadmin.tir@gmail.com

---

## Weiterführende Dokumentation

- [Entwicklungssetup](../getting-started/setup.md)
- [Code-Standards](../development/coding-standards.md)
- [Testing](../development/testing.md)
- [Scripts](../development/scripts.md)
- [Versionierung](../development/versioning.md)

---

**Vielen Dank für deinen Beitrag!** 🙏

---

**Letzte Aktualisierung:** 2025-12-15
