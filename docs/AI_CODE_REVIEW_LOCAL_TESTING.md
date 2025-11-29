# Lokales Testen der AI Code Review

**Zweck:** AI Code Review Workflows lokal testen vor dem Push

---

## Voraussetzungen

1. **Node.js 20+** (bereits vorhanden für Projekt)
2. **Python 3.11+** (für Skripte)
3. **Cursor CLI** (wird installiert)
4. **Cursor API Key** (von Cursor Account)
5. **python-dotenv** (für .env Unterstützung, wird installiert)

---

## Schritt 0: Python-Abhängigkeiten installieren

### Windows

```powershell
.\scripts\install-dependencies.ps1
```

### Linux/Mac

```bash
chmod +x scripts/install-dependencies.sh
./scripts/install-dependencies.sh
```

Oder manuell:

```bash
python3 -m pip install --user python-dotenv
```

## Schritt 1: Cursor CLI installieren

**⚠️ HINWEIS:** Die automatische Installation via Download-Script funktioniert derzeit nicht (404-Fehler). Bitte verwende eine der manuellen Methoden unten.

**Schnellprüfung:** Das Skript `.\scripts\install-cursor-cli.ps1` zeigt dir, ob Cursor CLI bereits installiert ist und gibt Installations-Anweisungen.

### Windows

**⚠️ WICHTIG:** Cursor CLI läuft unter Windows nur in **WSL (Windows Subsystem for Linux)**!

**Option 1: Über WSL (Empfohlen für Windows)**

1. **Installiere WSL** (falls noch nicht vorhanden):
   ```powershell
   wsl --install
   ```
   Oder siehe: https://learn.microsoft.com/de-de/windows/wsl/install

2. **Öffne WSL Terminal** (Ubuntu/Debian)

3. **Installiere Cursor CLI in WSL**:
   ```bash
   curl https://cursor.com/install.sh | bash
   ```

4. **Test in WSL**:
   ```bash
   cursor-agent --version
   ```

5. **Für lokale Tests:** Führe die Test-Skripte in WSL aus:
   ```bash
   # In WSL
   cd /mnt/g/Development/Foundry\ VTT\ V11\ Data/Data/modules/fvtt_relationship_app_module
   ./scripts/test-ai-review-local.sh incremental
   ```

**Option 2: Über Cursor Editor (nur wenn Cursor Editor installiert)**

1. Öffne Cursor Editor
2. Gehe zu **Settings** → **Features** → **CLI**
3. Folge den Installations-Anweisungen
4. **Hinweis:** Funktioniert möglicherweise nur in WSL-Integration

**Option 3: Native Windows (nicht verfügbar)**

Cursor CLI ist ein Linux-Binary und läuft nicht nativ unter Windows. Verwende WSL.

**WSL-Pfad-Mapping:**
- Windows: `G:\Development\...` → WSL: `/mnt/g/Development/...`
- Windows: `C:\Users\...` → WSL: `/mnt/c/Users/...`

**Test in WSL:**
```bash
cursor-agent --version
# Sollte Versionsnummer ausgeben
```

**Falls nicht gefunden in WSL:**
```bash
# Füge manuell zum PATH hinzu (für aktuelle Session)
export PATH="$PATH:$HOME/.cursor/bin"

# Oder dauerhaft (in ~/.bashrc oder ~/.zshrc):
echo 'export PATH="$PATH:$HOME/.cursor/bin"' >> ~/.bashrc
source ~/.bashrc
```

### Linux/Mac

```bash
curl https://cursor.com/install.sh | bash
```

---

## Schritt 2: Cursor API Key besorgen

1. Gehe zu [Cursor Settings](https://cursor.com/settings) oder [Cursor API](https://cursor.com/api)
2. Erstelle einen API Key
3. Kopiere den Key (wird nur einmal angezeigt!)

---

## Schritt 3: API Key lokal hinterlegen

### Option 1: .env Datei im Projekt (Empfohlen für Entwicklung)

**Am einfachsten:** Kopiere `.env.example` zu `.env` und setze deinen Key:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Dann bearbeite `.env` und setze deinen echten API Key:

```bash
# .env
CURSOR_API_KEY=dein-echter-api-key-hier
```

**Vorteile:**
- ✅ Einfach zu verwalten
- ✅ Projekt-spezifisch
- ✅ Bereits in `.gitignore` (wird nicht committed)
- ✅ Funktioniert mit allen Skripten

**Hinweis:** Die `.env` Datei wird automatisch von den Skripten geladen (Python nutzt `python-dotenv`, PowerShell lädt sie direkt).

### Option 2: Umgebungsvariable (System-weit)

**Windows PowerShell:**
```powershell
# Für aktuelle Session
$env:CURSOR_API_KEY = "dein-api-key-hier"

# Dauerhaft für Benutzer (in PowerShell-Profil)
[System.Environment]::SetEnvironmentVariable("CURSOR_API_KEY", "dein-api-key-hier", "User")
```

**Windows CMD:**
```cmd
setx CURSOR_API_KEY "dein-api-key-hier"
```

**Linux/Mac:**
```bash
# Für aktuelle Session
export CURSOR_API_KEY="dein-api-key-hier"

# Dauerhaft (in ~/.bashrc oder ~/.zshrc)
echo 'export CURSOR_API_KEY="dein-api-key-hier"' >> ~/.bashrc
source ~/.bashrc
```


---

## Schritt 4: Lokales Test-Skript

Erstelle `scripts/test-ai-review-local.sh` (oder `.bat` für Windows):

### Windows PowerShell Skript (`scripts/test-ai-review-local.ps1`)

```powershell
# Lokaler Test für AI Code Review
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("incremental", "full", "full-src", "full-templates", "full-styles")]
    [string]$Mode = "incremental"
)

$ErrorActionPreference = "Stop"

# Prüfe Cursor API Key
if (-not $env:CURSOR_API_KEY) {
    Write-Host "❌ CURSOR_API_KEY Umgebungsvariable nicht gesetzt!" -ForegroundColor Red
    Write-Host "Setze sie mit: `$env:CURSOR_API_KEY = 'dein-key'" -ForegroundColor Yellow
    exit 1
}

# Prüfe Cursor CLI
$cursorCmd = Get-Command cursor-agent -ErrorAction SilentlyContinue
if (-not $cursorCmd) {
    Write-Host "❌ Cursor CLI nicht gefunden!" -ForegroundColor Red
    Write-Host "Installiere mit: curl https://cursor.com/install.sh | bash" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cursor CLI gefunden: $($cursorCmd.Source)" -ForegroundColor Green
Write-Host "✅ API Key gesetzt (Länge: $($env:CURSOR_API_KEY.Length) Zeichen)" -ForegroundColor Green

# Erstelle temporäres Verzeichnis
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
$analysisPrompt = Join-Path $tempDir "analysis-prompt.md"
$analysisOutput = Join-Path $tempDir "analysis-output.json"

try {
    # Bestimme zu analysierende Dateien
    $filesToAnalyze = @()
    
    switch ($Mode) {
        "incremental" {
            Write-Host "`n🔍 Modus: Incremental (geänderte Dateien)" -ForegroundColor Cyan
            # Simuliere git diff (letzte 2 Commits)
            $changedFiles = git diff --name-only HEAD~1 HEAD 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️ Git diff fehlgeschlagen, verwende letzte Commit-Änderungen" -ForegroundColor Yellow
                $changedFiles = git diff --name-only HEAD~1 HEAD
            }
            $filesToAnalyze = $changedFiles | Where-Object { $_ -match '\.(ts|js|svelte)$' -and $_ -notmatch '\.test\.' -and $_ -notmatch '\.spec\.' }
        }
        "full" {
            Write-Host "`n🔍 Modus: Full Project (all)" -ForegroundColor Cyan
            $filesToAnalyze = Get-ChildItem -Path "src", "templates", "styles" -Recurse -Include *.ts,*.js,*.svelte,*.css,*.hbs,*.html -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' -and $_.Name -notmatch '\.test\.' -and $_.Name -notmatch '\.spec\.' } | Select-Object -ExpandProperty FullName
        }
        "full-src" {
            Write-Host "`n🔍 Modus: Full Project (src)" -ForegroundColor Cyan
            $filesToAnalyze = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.js,*.svelte -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' -and $_.Name -notmatch '\.test\.' -and $_.Name -notmatch '\.spec\.' } | Select-Object -ExpandProperty FullName
        }
        default {
            Write-Host "❌ Unbekannter Modus: $Mode" -ForegroundColor Red
            exit 1
        }
    }
    
    if ($filesToAnalyze.Count -eq 0) {
        Write-Host "⚠️ Keine Dateien zum Analysieren gefunden" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "📄 Gefundene Dateien: $($filesToAnalyze.Count)" -ForegroundColor Cyan
    if ($filesToAnalyze.Count -le 10) {
        $filesToAnalyze | ForEach-Object { Write-Host "  - $_" }
    } else {
        $filesToAnalyze | Select-Object -First 5 | ForEach-Object { Write-Host "  - $_" }
        Write-Host "  ... und $($filesToAnalyze.Count - 5) weitere"
    }
    
    # Lade Prompt-Template (vereinfachte Version)
    Write-Host "`n📝 Erstelle Analyse-Prompt..." -ForegroundColor Cyan
    
    # Hier würde der vollständige Prompt stehen (vereinfacht für lokales Testen)
    $prompt = @"
Du bist ein Code-Reviewer für ein TypeScript-Projekt mit Clean Architecture.

Analysiere die folgenden Dateien auf:
- SOLID-Prinzipien
- Result-Pattern Konformität  
- Clean Architecture Schichttrennung
- Code Smells & Anti-Patterns
- Bugs

Gib das Ergebnis als JSON aus (KEIN Markdown, NUR JSON):

{
  "summary": {
    "total_issues": 0,
    "by_type": {},
    "by_severity": {}
  },
  "issues": []
}

Dateien zum Analysieren:
$(($filesToAnalyze | Select-Object -First 3 | ForEach-Object { "## $_`n```typescript`n$(Get-Content $_ -TotalCount 50 -ErrorAction SilentlyContinue -Raw)`n```" }) -join "`n`n")
"@
    
    $prompt | Out-File -FilePath $analysisPrompt -Encoding UTF8
    
    Write-Host "✅ Prompt erstellt: $analysisPrompt" -ForegroundColor Green
    
    # Führe Cursor AI Analyse aus
    Write-Host "`n🤖 Starte Cursor AI Analyse..." -ForegroundColor Cyan
    Write-Host "   (Dies kann einige Minuten dauern...)" -ForegroundColor Yellow
    
    $env:CURSOR_API_KEY | cursor-agent -p "$(Get-Content $analysisPrompt -Raw)" --model "claude-4-sonnet" 2>&1 | Tee-Object -FilePath $analysisOutput
    
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "⚠️ Cursor AI Analyse beendet mit Exit Code: $LASTEXITCODE" -ForegroundColor Yellow
    }
    
    # Prüfe Output
    if (Test-Path $analysisOutput) {
        $outputContent = Get-Content $analysisOutput -Raw
        if ($outputContent) {
            Write-Host "`n✅ Analyse abgeschlossen!" -ForegroundColor Green
            Write-Host "📊 Output gespeichert: $analysisOutput" -ForegroundColor Cyan
            
            # Versuche JSON zu extrahieren
            Write-Host "`n🔍 Parse JSON-Ergebnisse..." -ForegroundColor Cyan
            python scripts/ai-review-extract-json.py 2>&1
            
            if (Test-Path $analysisOutput) {
                # Zeige Zusammenfassung
                Write-Host "`n📋 Zusammenfassung:" -ForegroundColor Cyan
                python scripts/ai-review-summary.py
            }
            
            # Zeige ersten Teil des Outputs
            Write-Host "`n📄 Output Preview (erste 500 Zeichen):" -ForegroundColor Cyan
            Write-Host ($outputContent.Substring(0, [Math]::Min(500, $outputContent.Length)))
        } else {
            Write-Host "⚠️ Output-Datei ist leer" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Keine Output-Datei erstellt" -ForegroundColor Red
    }
    
} finally {
    Write-Host "`n💡 Tipp: Output-Datei: $analysisOutput" -ForegroundColor Yellow
    Write-Host "   Du kannst sie manuell öffnen und prüfen." -ForegroundColor Yellow
}
```

### Linux/Mac Bash Skript (`scripts/test-ai-review-local.sh`)

```bash
#!/bin/bash
set -e

MODE="${1:-incremental}"

# Prüfe Cursor API Key
if [ -z "$CURSOR_API_KEY" ]; then
    echo "❌ CURSOR_API_KEY Umgebungsvariable nicht gesetzt!"
    echo "Setze sie mit: export CURSOR_API_KEY='dein-key'"
    exit 1
fi

# Prüfe Cursor CLI
if ! command -v cursor-agent &> /dev/null; then
    echo "❌ Cursor CLI nicht gefunden!"
    echo "Installiere mit: curl https://cursor.com/install.sh | bash"
    exit 1
fi

echo "✅ Cursor CLI gefunden"
echo "✅ API Key gesetzt (Länge: ${#CURSOR_API_KEY} Zeichen)"

# Erstelle temporäres Verzeichnis
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

ANALYSIS_PROMPT="$TEMP_DIR/analysis-prompt.md"
ANALYSIS_OUTPUT="$TEMP_DIR/analysis-output.json"

# Bestimme zu analysierende Dateien
case "$MODE" in
    incremental)
        echo "🔍 Modus: Incremental (geänderte Dateien)"
        FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E '\.(ts|js|svelte)$' | grep -v '\.test\.' | grep -v '\.spec\.' || true)
        ;;
    full)
        echo "🔍 Modus: Full Project (all)"
        find src templates styles -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.css" -o -name "*.hbs" -o -name "*.html" \) ! -path "*/node_modules/*" ! -name "*.test.*" ! -name "*.spec.*" > "$TEMP_DIR/files.txt"
        FILES=$(cat "$TEMP_DIR/files.txt")
        ;;
    full-src)
        echo "🔍 Modus: Full Project (src)"
        find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" \) ! -path "*/node_modules/*" ! -name "*.test.*" ! -name "*.spec.*" > "$TEMP_DIR/files.txt"
        FILES=$(cat "$TEMP_DIR/files.txt")
        ;;
    *)
        echo "❌ Unbekannter Modus: $MODE"
        echo "Verfügbare Modi: incremental, full, full-src"
        exit 1
        ;;
esac

if [ -z "$FILES" ]; then
    echo "⚠️ Keine Dateien zum Analysieren gefunden"
    exit 0
fi

FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo "📄 Gefundene Dateien: $FILE_COUNT"

# Erstelle vereinfachten Prompt (für lokales Testen)
cat > "$ANALYSIS_PROMPT" << 'EOF'
Du bist ein Code-Reviewer für ein TypeScript-Projekt mit Clean Architecture.

Analysiere die folgenden Dateien auf SOLID-Prinzipien, Result-Pattern, Clean Architecture.

Gib das Ergebnis als JSON aus (KEIN Markdown, NUR JSON):
{
  "summary": {"total_issues": 0, "by_type": {}, "by_severity": {}},
  "issues": []
}
EOF

# Kopiere Output nach /tmp/ für Skripte (die erwarten /tmp/analysis-output.json)
cp "$ANALYSIS_OUTPUT" /tmp/analysis-output.json 2>/dev/null || touch /tmp/analysis-output.json

# Führe Analyse aus
echo "🤖 Starte Cursor AI Analyse..."
cursor-agent -p "$(cat "$ANALYSIS_PROMPT")" --model "claude-4-sonnet" > /tmp/analysis-output.json 2>&1 || true

# Parse JSON
if [ -s /tmp/analysis-output.json ]; then
    echo "✅ Analyse abgeschlossen!"
    echo "🔍 Parse JSON-Ergebnisse..."
    python3 scripts/ai-review-extract-json.py || true
    
    echo "📋 Zusammenfassung:"
    python3 scripts/ai-review-summary.py || true
else
    echo "⚠️ Keine Ausgabe generiert"
fi
```

---

## Schritt 5: Test ausführen

### Windows (WSL)

**⚠️ WICHTIG:** Da Cursor CLI nur in WSL läuft, musst du die Tests in WSL ausführen!

```bash
# In WSL Terminal

# 1. Navigiere zum Projekt (Windows-Pfad → WSL-Pfad)
# Windows: G:\Development\... → WSL: /mnt/g/Development/...
cd /mnt/g/Development/Foundry\ VTT\ V11\ Data/Data/modules/fvtt_relationship_app_module

# 2. Setze API Key (aus .env wird automatisch geladen)
# Oder manuell:
export CURSOR_API_KEY="dein-api-key-hier"

# 3. Führe Test aus
./scripts/test-ai-review-local.sh incremental
./scripts/test-ai-review-local.sh full
./scripts/test-ai-review-local.sh full-src
```

**Hinweis:** Die PowerShell-Skripte (`test-ai-review-local.ps1`) funktionieren nicht, da Cursor CLI nicht nativ unter Windows läuft. Verwende die Bash-Version in WSL.

### Linux/Mac

```bash
# Setze API Key (einmalig pro Session)
export CURSOR_API_KEY="dein-api-key-hier"

# Führe Test aus
./scripts/test-ai-review-local.sh incremental
./scripts/test-ai-review-local.sh full
./scripts/test-ai-review-local.sh full-src
```

### Linux/Mac

```bash
# Setze API Key (einmalig pro Session)
export CURSOR_API_KEY="dein-api-key-hier"

# Mache Skript ausführbar
chmod +x scripts/test-ai-review-local.sh

# Führe Test aus
./scripts/test-ai-review-local.sh incremental
./scripts/test-ai-review-local.sh full
./scripts/test-ai-review-local.sh full-src
```

---

## Schritt 6: Skripte anpassen (für lokale Ausführung)

Die Python-Skripte erwarten Dateien in `/tmp/`. Für Windows musst du die Pfade anpassen:

### Option A: Verwende temporäres Verzeichnis

Erstelle `scripts/ai-review-extract-json-local.py`:

```python
#!/usr/bin/env python3
import sys
import os

# Verwende Windows-kompatiblen Pfad
if sys.platform == "win32":
    OUTPUT_FILE = os.path.join(os.environ.get("TEMP", "C:\\temp"), "analysis-output.json")
else:
    OUTPUT_FILE = "/tmp/analysis-output.json"

# Rest des Skripts mit OUTPUT_FILE statt /tmp/analysis-output.json
```

### Option B: Verwende WSL2 (Windows)

Falls du WSL2 hast, kannst du die Linux-Version der Skripte direkt verwenden.

---

## Troubleshooting

### "cursor-agent: command not found"

- **Lösung:** Cursor CLI nicht in PATH oder Installation fehlgeschlagen
- Terminal neu starten oder PATH manuell setzen

### "CURSOR_API_KEY not set"

- **Lösung:** Umgebungsvariable nicht gesetzt
- Prüfe mit: `echo $env:CURSOR_API_KEY` (PowerShell) oder `echo $CURSOR_API_KEY` (Bash)

### "JSON extraction failed"

- **Normal:** Cursor AI gibt manchmal Markdown statt JSON zurück
- Prüfe `/tmp/analysis-output.json` (oder Windows Temp) manuell
- Verbessere Prompt falls nötig

### "No files found"

- **Lösung:** Keine passenden Dateien gefunden
- Prüfe Modus (incremental vs. full)
- Prüfe ob Git-Repository vorhanden ist (für incremental)

---

## Nächste Schritte

Nach erfolgreichem lokalen Test:

1. ✅ Cursor API Key zu GitHub Secrets hinzufügen (`CURSOR_API_KEY`)
2. ✅ Workflows in GitHub Actions testen
3. ✅ Bei Problemen: Lokale Logs mit GitHub Actions vergleichen

---

## Siehe auch

- [Cursor CLI Documentation](https://cursor.com/docs/cli)
- [AI Code Review Documentation](./AI_CODE_REVIEW.md)
- [Workflow Files](../.github/workflows/)

