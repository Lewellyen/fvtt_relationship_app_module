# AI Code Review Workflow

**Status:** Aktiv  
**Erstellt:** 2025-01-27  
**Zweck:** Automatisierte Code-Analyse mit Cursor AI nach erfolgreichem CI

---

## Übersicht

Der AI Code Review Workflow analysiert automatisch Code-Änderungen auf:
- **SOLID-Prinzipien** (SRP, OCP, LSP, ISP, DIP)
- **Result/Either-Pattern** Konformität
- **Clean Architecture** Schichttrennung
- **Code Smells** & Anti-Patterns
- **Bugs** & Fehlerquellen

Nach erfolgreicher Analyse werden automatisch GitHub Issues erstellt.

## Verfügbare Workflows

Es gibt zwei AI Code Review Workflows:

### 1. Incremental Review (`ai-code-review.yml`)
- **Trigger:** Nur manuell (`workflow_dispatch`)
- **Scope:** Nur geänderte Dateien (git diff HEAD~1 HEAD)
- **Verwendung:** Schnelle Analyse nach Commits, vor Pull Requests
- **Performance:** Schnell, fokussiert auf neue Änderungen

### 2. Full Project Review (`ai-code-review-full.yml`)
- **Trigger:** Nur manuell (`workflow_dispatch`)
- **Scope:** Komplettes Projekt (`src/`, `templates/`, `styles/`)
- **Verwendung:** Periodische Audits, Architektur-Reviews, Pre-Release-Checks
- **Performance:** Dauert länger (bis zu 30 Minuten), analysiert alles

## Aktivierung

### 1. Cursor API Key konfigurieren

1. Erstelle einen Cursor API Key (falls noch nicht vorhanden)
2. Gehe zu Repository Settings → Secrets and variables → Actions
3. Füge ein neues Secret hinzu:
   - **Name:** `CURSOR_API_KEY`
   - **Value:** Dein Cursor API Key

### 2. Workflows auslösen

**Incremental Review:**
- ✅ Manuell: Actions → AI Code Review & Quality Analysis → Run workflow

**Full Project Review:**
- ✅ Manuell: Actions → AI Code Review - Full Project Analysis → Run workflow
- ✅ **Scope wählen:** `all`, `src`, `templates`, oder `styles`

**Wichtig (Incremental):** Der Workflow analysiert nur:
- TypeScript/JavaScript-Dateien die sich seit dem letzten Commit geändert haben
- Keine Test-Dateien (`.test.ts`, `.spec.ts`)

## Workflow-Ablauf

### Incremental Review

```
1. Checkout Code (vollständige History für Kontext)
2. Setup Node.js + Python
3. Installiere Cursor CLI
4. Identifiziere geänderte Dateien (git diff HEAD~1 HEAD)
5. Erstelle Analyse-Prompt mit Projektkontext
6. Führe Cursor AI Analyse aus
7. Parse JSON-Ergebnisse
8. Erstelle GitHub Issues (mit Duplikats-Prüfung)
9. Generiere Zusammenfassung
```

### Full Project Review

```
1. Checkout Code (vollständige History für Kontext)
2. Setup Node.js + Python
3. Installiere Cursor CLI
4. Finde alle Dateien basierend auf Scope (src/templates/styles)
5. Erstelle Analyse-Prompt (erste 50 Dateien mit Code, Rest als Liste)
6. Führe Cursor AI Analyse aus (Timeout: 30 Minuten)
7. Parse JSON-Ergebnisse
8. Erstelle GitHub Issues (mit Label "ai-review-full")
9. Generiere Zusammenfassung
```

**Hinweis:** Full Project Review analysiert maximal 50 Dateien vollständig (Code-Inhalt), weitere Dateien werden nur strukturell berücksichtigt. Dies verhindert Token-Limits bei großen Projekten.

## Analyse-Bereiche

### SOLID-Prinzipien

- **SRP:** Hat jede Klasse nur eine Verantwortlichkeit?
- **OCP:** Ist Code erweiterbar ohne Modifikation?
- **LSP:** Können Implementierungen ihre Interfaces ersetzen?
- **ISP:** Sind Interfaces klein und fokussiert?
- **DIP:** Abhängigkeiten nur zu Abstraktionen?

### Result-Pattern

- Funktionen die fehlschlagen können → `Result<T, E>`
- Keine Exceptions außer für unerwartete Fehler
- Korrekte Behandlung mit `ok()`, `err()`, `map()`, `andThen()`

### Clean Architecture

- **Layer-Trennung:** Domain → Application → Infrastructure → Framework
- **Dependency-Regel:** Äußere → innere Schichten (nicht umgekehrt)
- **Import-Prüfung:** Domain importiert NICHT aus Infrastructure/Framework

### Code Smells & Anti-Patterns

- Long Methods, Large Classes
- God Objects, Swiss Army Knife Interfaces
- Circular Dependencies, Tight Coupling
- Service Locator Pattern (außer in Config)

### Bugs

- Unbehandelte Fehler
- Race Conditions
- Memory Leaks
- Fehlende Null-Checks

## Issue-Format

Jedes automatisch erstellte Issue enthält:

```markdown
## [TYPE] filename.ts:42 - Titel

**Prinzip:** SRP/OCP/LSP/ISP/DIP (bei SOLID)
**Severity:** high/medium/low
**File:** src/path/to/file.ts
**Location:** Line 42, Column 10

### Problem
Detaillierte Beschreibung

### Aktueller Code
Code-Snippet

### Empfehlung
Konkreter Lösungsvorschlag

### Referenzen
- ADR-0001
- docs/architecture/...
```

**Labels:**
- `ai-review` - Automatisch erstellt
- `solid-*` - SOLID-Prinzip
- `severity-*` - Priorität
- Issue-Type (solid, result_pattern, architecture, etc.)

## Duplikats-Prüfung

Der Workflow prüft automatisch auf Duplikate:
- Vergleicht Issue-Titel mit bestehenden Issues
- Überspringt ähnliche Issues (basierend auf ersten 50 Zeichen)
- Verhindert Spam bei mehrfachen Runs

## Troubleshooting

### Workflow läuft nicht

**Problem:** Workflow wird nicht ausgelöst nach CI

**Lösung:**
- Prüfe ob CI erfolgreich war
- Prüfe ob TypeScript-Dateien geändert wurden
- Prüfe Repository-Branch (nur `main`/`develop`)

### Keine Issues erstellt

**Problem:** Analyse läuft, aber keine Issues

**Mögliche Ursachen:**
- Keine Probleme gefunden (✅ gut!)
- JSON-Parsing fehlgeschlagen (prüfe Workflow-Logs)
- Cursor API Key fehlt oder ungültig
- GitHub Token hat keine `issues:write` Berechtigung

### Fehlerhafte Analyse-Ergebnisse

**Problem:** Issues enthalten falsche Informationen

**Lösung:**
- Prüfe Prompt in `/tmp/analysis-prompt.md` (Workflow-Logs)
- Prüfe Cursor AI Output (kann manuell überprüft werden)
- Verbessere Prompt bei Bedarf (siehe Workflow-Datei)

## Kosten & Limits

**Cursor API:**
- Jeder Push führt zu API-Calls
- Kosten abhängig von Modell (claude-4-sonnet empfohlen)
- Rate Limits beachten

**Empfehlung:**
- Workflow nur bei relevanten Änderungen
- Optional: Scheduled statt bei jedem Push (täglich/wöchentlich)

## Anpassungen

### Prompt ändern

Die Analyse-Prompt ist in `.github/workflows/ai-code-review.yml` definiert (Step "Create analysis prompt").

**Wichtige Stellen:**
- Projektkontext (Zeilen ~70-90)
- Analyseschwerpunkte (Zeilen ~90-200)
- Output-Format (Zeilen ~200-250)

### Modell ändern

Standard: `claude-4-sonnet`

Ändere in `.github/workflows/ai-code-review.yml`:
```yaml
cursor-agent -p "$PROMPT" --model "gpt-5" ...
```

Verfügbare Modelle:
- `claude-4-sonnet` (empfohlen)
- `gemini-2.5-pro`
- `gpt-4.1`
- `gpt-5`

### Severity-Kriterien anpassen

Siehe Prompt-Abschnitt "Severity-Kriterien" für Definitionen von high/medium/low.

## Skripte

Der Workflow nutzt Python-Skripte in `scripts/`:

- `ai-review-extract-json.py` - Extrahiert JSON aus Cursor AI Output
- `ai-review-create-issues.py` - Erstellt GitHub Issues
- `ai-review-summary.py` - Generiert Workflow-Zusammenfassung

Diese können lokal getestet werden:
```bash
python scripts/ai-review-extract-json.py
python scripts/ai-review-create-issues.py
python scripts/ai-review-summary.py
```

## Full Project Review - Details

### Wann verwenden?

- **Vor Releases:** Vollständiger Architektur-Check
- **Periodische Audits:** Monatliche/Quartalsweise Code-Qualitäts-Prüfung
- **Nach größeren Refactorings:** Validierung der Architektur-Konformität
- **Onboarding:** Neue Entwickler erhalten Übersicht über Code-Qualität

### Scope-Optionen

- **`all`** (Standard): Analysiert `src/`, `templates/`, `styles/`
- **`src`**: Nur TypeScript/JavaScript-Dateien in `src/`
- **`templates`**: Nur Template-Dateien (`.hbs`, `.html`)
- **`styles`**: Nur CSS/SCSS-Dateien

### Performance

- **Dauer:** 10-30 Minuten (abhängig von Projektgröße)
- **Dateien:** Bis zu 50 Dateien werden vollständig analysiert (Code-Inhalt)
- **Rest:** Strukturelle Analyse ohne vollständigen Code-Inhalt
- **Token-Limit:** Automatische Optimierung verhindert Überschreitungen

### Issues

Issues von Full Project Review erhalten zusätzliches Label:
- `ai-review-full` - Identifiziert Issues aus vollständiger Analyse

## Siehe auch

- [Quality Gates Documentation](./quality-gates/README.md)
- [Clean Architecture ADR](./adr/0007-clean-architecture-layering.md)
- [Result Pattern ADR](./adr/0001-use-result-pattern-instead-of-exceptions.md)
- [CI Workflow](../.github/workflows/ci.yml)

