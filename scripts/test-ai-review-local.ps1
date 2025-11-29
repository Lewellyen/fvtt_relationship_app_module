# Lokaler Test für AI Code Review (PowerShell)
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("incremental", "full", "full-src", "full-templates", "full-styles")]
    [string]$Mode = "incremental"
)

$ErrorActionPreference = "Stop"

# Lade .env Datei falls vorhanden
if (Test-Path ".env") {
    Write-Host "📄 Lade .env Datei..." -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Entferne Anführungszeichen falls vorhanden
            if ($value -match '^["''](.+)["'']$') {
                $value = $matches[1]
            }
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ .env Datei geladen" -ForegroundColor Green
}

# Prüfe Cursor API Key
if (-not $env:CURSOR_API_KEY) {
    Write-Host "❌ CURSOR_API_KEY nicht gefunden!" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Lösungsmöglichkeiten:" -ForegroundColor Yellow
    Write-Host "1. Erstelle eine .env Datei im Projekt-Root:" -ForegroundColor Yellow
    Write-Host "   CURSOR_API_KEY=dein-api-key-hier" -ForegroundColor Gray
    Write-Host "" -ForegroundColor Yellow
    Write-Host "2. Oder setze Umgebungsvariable:" -ForegroundColor Yellow
    Write-Host "   `$env:CURSOR_API_KEY = 'dein-key'" -ForegroundColor Gray
    Write-Host "" -ForegroundColor Yellow
    Write-Host "3. Kopiere .env.example zu .env als Vorlage" -ForegroundColor Yellow
    exit 1
}

# Prüfe Cursor CLI
$cursorCmd = Get-Command cursor-agent -ErrorAction SilentlyContinue
if (-not $cursorCmd) {
    Write-Host "❌ Cursor CLI nicht gefunden!" -ForegroundColor Red
    Write-Host "Installiere mit: curl https://cursor.com/install -fsS | bash" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cursor CLI gefunden: $($cursorCmd.Source)" -ForegroundColor Green
Write-Host "✅ API Key gesetzt (Länge: $($env:CURSOR_API_KEY.Length) Zeichen)" -ForegroundColor Green

# Erstelle temporäres Verzeichnis
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$analysisPrompt = Join-Path $tempDir "analysis-prompt.md"
$analysisOutput = Join-Path $tempDir "analysis-output.json"

try {
    # Bestimme zu analysierende Dateien
    $filesToAnalyze = @()

    switch ($Mode) {
        "incremental" {
            Write-Host "`n🔍 Modus: Incremental (geänderte Dateien)" -ForegroundColor Cyan
            $changedFiles = git diff --name-only HEAD~1 HEAD 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️ Git diff fehlgeschlagen, verwende HEAD als Fallback" -ForegroundColor Yellow
                $changedFiles = git ls-files --modified
            }
            $filesToAnalyze = $changedFiles | Where-Object { $_ -match '\.(ts|js|svelte)$' -and $_ -notmatch '\.test\.' -and $_ -notmatch '\.spec\.' } | ForEach-Object { Resolve-Path $_ -ErrorAction SilentlyContinue }
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

    # Lade vereinfachten Prompt (für lokales Testen)
    Write-Host "`n📝 Erstelle Analyse-Prompt..." -ForegroundColor Cyan

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

Dateien zum Analysieren (erste 3 als Beispiel):
$(
    ($filesToAnalyze | Select-Object -First 3 | ForEach-Object {
        $filePath = $_
        $relativePath = $filePath.Replace((Get-Location).Path + "\", "").Replace("\", "/")
        $content = Get-Content $filePath -TotalCount 50 -ErrorAction SilentlyContinue -Raw
        "## $relativePath`n```typescript`n$content`n```"
    }) -join "`n`n"
)
"@

    $prompt | Out-File -FilePath $analysisPrompt -Encoding UTF8

    Write-Host "✅ Prompt erstellt: $analysisPrompt" -ForegroundColor Green

    # Kopiere Output nach Standard-Pfad für Skripte
    $standardOutput = if ($IsWindows -or $env:OS -like "*Windows*") {
        Join-Path $env:TEMP "analysis-output.json"
    } else {
        "/tmp/analysis-output.json"
    }

    # Setze Standard-Modell falls nicht gesetzt
    if (-not $env:CURSOR_AI_MODEL) {
        $env:CURSOR_AI_MODEL = "sonnet-4.5"
    }

    # Führe Cursor AI Analyse aus
    Write-Host "`n🤖 Starte Cursor AI Analyse..." -ForegroundColor Cyan
    Write-Host "   (Dies kann einige Minuten dauern...)" -ForegroundColor Yellow
    Write-Host "   Modell: $env:CURSOR_AI_MODEL" -ForegroundColor Gray

    $env:CURSOR_API_KEY = $env:CURSOR_API_KEY  # Sicherstellen dass es gesetzt ist
    cursor-agent -p "$(Get-Content $analysisPrompt -Raw)" --model "$env:CURSOR_AI_MODEL" 2>&1 | Tee-Object -FilePath $standardOutput

    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "⚠️ Cursor AI Analyse beendet mit Exit Code: $LASTEXITCODE" -ForegroundColor Yellow
    }

    # Prüfe Output
    if (Test-Path $standardOutput) {
        $outputContent = Get-Content $standardOutput -Raw
        if ($outputContent) {
            Write-Host "`n✅ Analyse abgeschlossen!" -ForegroundColor Green
            Write-Host "📊 Output gespeichert: $standardOutput" -ForegroundColor Cyan

            # Versuche JSON zu extrahieren
            Write-Host "`n🔍 Parse JSON-Ergebnisse..." -ForegroundColor Cyan
            python scripts/ai-review-extract-json.py 2>&1

            if (Test-Path $standardOutput) {
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
    Write-Host "`n💡 Tipp: Output-Datei: $standardOutput" -ForegroundColor Yellow
    Write-Host "   Du kannst sie manuell öffnen und prüfen." -ForegroundColor Yellow

    # Cleanup
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

