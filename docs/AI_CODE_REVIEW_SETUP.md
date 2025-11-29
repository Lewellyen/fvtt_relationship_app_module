# 🚀 Cursor CLI AI Code Review - Setup & Verwendung

**Zweck:** Automatisierte Code-Analyse mit Cursor CLI Agent für vollständige Code-Reviews

---

## 📋 Voraussetzungen

1. **GitHub Repository** mit aktivierten GitHub Actions
2. **Cursor API Key** (von deinem Cursor Account)
3. **GitHub Repository Secrets** konfiguriert (siehe unten)

---

## 🔧 Schritt 1: Cursor API Key erstellen

1. Gehe zu deinem **Cursor Dashboard**: https://cursor.com/settings/api-keys
2. Klicke auf **"Create API Key"** oder **"Generate New Key"**
3. Kopiere den API Key (wird nur einmal angezeigt!)

**Wichtig:** Der API Key gibt Zugriff auf Cursor AI Services. Bewahre ihn sicher auf!

---

## 🔐 Schritt 2: GitHub Secrets konfigurieren

Du musst Secrets in deinem GitHub Repository konfigurieren:

### Option A: Über GitHub Web-Interface

1. Gehe zu deinem Repository → **Settings** → **Secrets and variables** → **Actions**
2. Klicke **"New repository secret"**
3. Füge folgende Secrets hinzu:

   **Secret 1: `CURSOR_API_KEY`**
   - **Name:** `CURSOR_API_KEY`
   - **Value:** Dein Cursor API Key (aus Schritt 1)
   - Klicke **"Add secret"**

   **Secret 2 (Optional): `CURSOR_AI_MODEL`**
   - **Name:** `CURSOR_AI_MODEL`
   - **Value:** Z.B. `sonnet-4.5`, `claude-4-sonnet`, `gpt-5` etc.
   - **Standard:** Falls nicht gesetzt, wird `sonnet-4.5` verwendet
   - Klicke **"Add secret"**

### Option B: Über GitHub CLI

```bash
# Repository-Secret setzen
gh secret set CURSOR_API_KEY --repo OWNER/REPO --body "DEIN_CURSOR_API_KEY"

# Optional: AI Model setzen
gh secret set CURSOR_AI_MODEL --repo OWNER/REPO --body "sonnet-4.5"
```

**Hinweis:** `GITHUB_TOKEN` wird automatisch von GitHub Actions bereitgestellt, kein manuelles Setup nötig!

---

## 🎯 Schritt 3: Workflow ausführen

Es gibt **zwei Workflows** für verschiedene Anwendungsfälle:

### Workflow 1: Incremental Analysis (`ai-code-review.yml`)

**Was wird analysiert:**
- Nur **geänderte Dateien** (seit letztem Commit)
- Ideal für Pull Requests oder nach Code-Änderungen

**Auslösen:**
1. Gehe zu deinem Repository → **Actions** Tab
2. Wähle **"AI Code Review & Quality Analysis"** aus der Liste
3. Klicke **"Run workflow"** → **"Run workflow"** (grüner Button)
4. Der Workflow startet und analysiert geänderte Dateien

**Workflow-Ablauf:**
```
1. Checkout Code
2. Install Dependencies
3. Install Cursor CLI
4. Identifiziere geänderte Dateien
5. Erstelle Analyse-Prompt (mit Code-Inhalt)
6. Rufe cursor-agent auf → AI-Analyse
7. Parse JSON-Ergebnisse
8. Erstelle GitHub Issues für gefundene Probleme
9. Erstelle Workflow Summary
```

---

### Workflow 2: Full Project Analysis (`ai-code-review-full.yml`)

**Was wird analysiert:**
- **Vollständiges Projekt** oder bestimmter Scope
- Bis zu **50 Dateien mit vollständigem Code** (300 Zeilen pro Datei)
- Ideal für regelmäßige, umfassende Code-Reviews

**Auslösen:**
1. Gehe zu deinem Repository → **Actions** Tab
2. Wähle **"AI Code Review - Full Project Analysis"** aus der Liste
3. Klicke **"Run workflow"**
4. **Wähle Scope** (optional):
   - `all` - Alle Dateien im Projekt
   - `src` - Nur src/ Verzeichnis
   - `templates` - Nur Templates
   - `styles` - Nur Styles
5. Klicke **"Run workflow"** (grüner Button)

**Workflow-Ablauf:**
```
1. Checkout Code
2. Install Dependencies
3. Install Cursor CLI
4. Bestimme zu analysierende Dateien (basierend auf Scope)
5. Erstelle Analyse-Prompt mit vollständigem Code
6. Rufe cursor-agent auf → AI-Analyse (30 Min Timeout)
7. Parse JSON-Ergebnisse
8. Erstelle GitHub Issues für gefundene Probleme
9. Erstelle detaillierte Workflow Summary
```

---

## 📊 Schritt 4: Ergebnisse ansehen

Nach Abschluss des Workflows findest du:

### 1. Workflow Summary (in Actions Tab)
- Anzahl gefundener Probleme
- Aufgeteilt nach Typ (SOLID, Architecture, Bugs, etc.)
- Aufgeteilt nach Severity (Critical, High, Medium, Low)
- Dateien die analysiert wurden

### 2. GitHub Issues
- Für jedes gefundene Problem wird ein GitHub Issue erstellt
- Label: `ai-review`
- Format: `[TYPE] file.ts:line - Problem-Beschreibung`
- Issue enthält:
  - Datei und Zeile
  - Problem-Beschreibung
  - Aktueller Code
  - Empfehlung zur Behebung
  - Referenzen (ADRs, Dokumentation)

### 3. Workflow Logs
- Detaillierte Logs jeder Workflow-Phase
- Prompt-Größe
- Analyse-Zeit
- Eventuelle Fehler

---

## 🔍 Wie funktioniert die Analyse?

### 1. Prompt-Erstellung

Der Workflow erstellt einen detaillierten Prompt mit:

**Analyse-Instruktionen:**
- SOLID-Prinzipien Prüfung
- Result-Pattern Konformität
- Clean Architecture Schichttrennung
- Port-Adapter-Pattern
- Code Smells & Anti-Patterns
- Bugs & Fehlerquellen

**Code-Content:**
- **Incremental:** Nur geänderte Dateien (vollständig)
- **Full Project:** Bis zu 50 Dateien × 300 Zeilen + Rest als Liste

**Output-Format:**
- Strukturiertes JSON mit Issues
- Jedes Issue mit Datei, Zeile, Typ, Severity, Beschreibung, Empfehlung

### 2. Cursor Agent Aufruf

```bash
cursor-agent -p "$PROMPT" --model "$CURSOR_AI_MODEL"
```

- Der komplette Prompt wird als Argument übergeben
- Cursor Agent analysiert den Code basierend auf den Instruktionen
- Output wird als JSON zurückgegeben

### 3. Ergebnis-Verarbeitung

- JSON wird geparst
- Issues werden extrahiert
- GitHub Issues werden erstellt
- Summary wird generiert

---

## ⚙️ Konfiguration

### AI Model wählen

Setze das Secret `CURSOR_AI_MODEL` auf eines der verfügbaren Modelle:

- `sonnet-4.5` (Standard, empfohlen)
- `claude-4-sonnet`
- `gpt-5`
- Oder andere verfügbare Modelle

**Wichtig:** Nicht alle Modelle unterstützen gleich große Prompts. `sonnet-4.5` ist getestet mit 50 Dateien.

### Prompt-Größe anpassen

Falls du "Argument list too long" Fehler bekommst:

**In `.github/workflows/ai-code-review-full.yml`:**

```yaml
# Reduziere Anzahl der Dateien
MAX_FILES_WITH_CODE=30  # Statt 50

# Oder reduziere Zeilen pro Datei
head -200 "$file"  # Statt 300
```

---

## 🐛 Troubleshooting

### Problem: "Cursor API Key not found"

**Lösung:**
- Prüfe ob `CURSOR_API_KEY` Secret korrekt gesetzt ist
- Stelle sicher, dass der Secret-Name exakt `CURSOR_API_KEY` ist (groß/kleinschreibung beachten)

### Problem: "cursor-agent not found"

**Lösung:**
- Das sollte automatisch behoben werden durch die Installation im Workflow
- Falls nicht, prüfe die Workflow-Logs für Installations-Fehler

### Problem: "Argument list too long"

**Lösung:**
- Reduziere `MAX_FILES_WITH_CODE` in `ai-code-review-full.yml`
- Reduziere Zeilen pro Datei (z.B. `head -200` statt `head -300`)

### Problem: "Analysis timed out"

**Lösung:**
- 30 Minuten Timeout ist Standard
- Für sehr große Projekte: Erhöhe Timeout in Workflow (Zeile mit `timeout 1800`)

### Problem: "No valid JSON in output"

**Lösung:**
- Prüfe Workflow-Logs für cursor-agent Output
- Möglicherweise hat AI nicht JSON zurückgegeben
- Prompt könnte zu komplex sein - reduziere Scope

---

## 📝 Workflow-Details

### Verwendete Technologien

- **Cursor CLI:** https://cursor.com/docs/cli/github-actions
- **GitHub Actions:** Workflow-Automatisierung
- **Python:** Für Issue-Erstellung und JSON-Parsing
- **Bash:** Für Datei-Verarbeitung und Prompt-Erstellung

### Dateien

- `.github/workflows/ai-code-review.yml` - Incremental Analysis
- `.github/workflows/ai-code-review-full.yml` - Full Project Analysis
- `scripts/ai-review-create-issues.py` - Issue-Erstellung
- `scripts/ai-review-extract-json.py` - JSON-Extraktion
- `scripts/ai-review-summary.py` - Summary-Generierung

---

## 💡 Tipps

1. **Regelmäßige Analysen:** Führe Full Project Analysis wöchentlich/monatlich aus
2. **Incremental für PRs:** Nutze Incremental Analysis für Pull Request Reviews
3. **Issues priorisieren:** Beginne mit Critical/High Severity Issues
4. **Scope wählen:** Nutze Scope-Filterung für fokussierte Analysen
5. **Model anpassen:** Experimentiere mit verschiedenen AI-Modellen

---

## 🔗 Weiterführende Links

- [Cursor CLI Dokumentation](https://cursor.com/docs/cli/github-actions)
- [Lokales Testen](AI_CODE_REVIEW_LOCAL_TESTING.md)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Fragen oder Probleme?** Erstelle ein Issue im Repository!

