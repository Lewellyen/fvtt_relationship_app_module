# Installiere Cursor CLI für Windows (PowerShell)

Write-Host "Cursor CLI Installation" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Prüfe zuerst ob bereits installiert
$cursorCmd = Get-Command cursor-agent -ErrorAction SilentlyContinue
if ($cursorCmd) {
    Write-Host "✅ Cursor CLI ist bereits installiert!" -ForegroundColor Green
    Write-Host "   Location: $($cursorCmd.Source)" -ForegroundColor Gray
    try {
        $version = cursor-agent --version 2>&1
        Write-Host "   Version: $version" -ForegroundColor Gray
    } catch {
        Write-Host "   (Version konnte nicht ermittelt werden)" -ForegroundColor Gray
    }
    exit 0
}

Write-Host "⚠️ Cursor CLI nicht gefunden" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "WICHTIG: Cursor CLI läuft unter Windows nur in WSL!" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Option 1: Installation in WSL (Empfohlen)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  1. Installiere WSL (falls nicht vorhanden):" -ForegroundColor Gray
Write-Host "     wsl --install" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Öffne WSL Terminal (Ubuntu)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Installiere Cursor CLI in WSL:" -ForegroundColor Gray
Write-Host "     curl https://cursor.com/install -fsS | bash" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. Test in WSL:" -ForegroundColor Gray
Write-Host "     cursor-agent --version" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  5. Für lokale Tests: Führe Skripte in WSL aus" -ForegroundColor Gray
Write-Host "     cd /mnt/g/Development/..." -ForegroundColor DarkGray
Write-Host "     ./scripts/test-ai-review-local.sh incremental" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Option 2: Über Cursor Editor (falls installiert)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  1. Öffne Cursor Editor" -ForegroundColor Gray
Write-Host "  2. Gehe zu: Settings → Features → CLI" -ForegroundColor Gray
Write-Host "  3. Folge den Installations-Anweisungen" -ForegroundColor Gray
Write-Host "  (Funktioniert möglicherweise nur in WSL-Integration)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Weitere Informationen:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Siehe: docs/AI_CODE_REVIEW_LOCAL_TESTING.md" -ForegroundColor Gray
Write-Host "  WSL: https://learn.microsoft.com/de-de/windows/wsl/install" -ForegroundColor Gray
Write-Host ""

exit 1

# Alte automatische Installation (funktioniert nicht mehr):
<#
try {
    # Versuche verschiedene Installationsmethoden
    $installUrls = @(
        "https://cursor.com/install.sh",
        "https://www.cursor.com/install.sh"
    )

    $success = $false
    foreach ($url in $installUrls) {
        try {
            Write-Host "Trying: $url" -ForegroundColor Cyan
            $scriptContent = Invoke-WebRequest -Uri $url -UseBasicParsing | Select-Object -ExpandProperty Content

            if ($scriptContent -and $scriptContent.Length -gt 100) {
                Write-Host "Running installation script..." -ForegroundColor Cyan
                Invoke-Expression $scriptContent
                $success = $true
                break
            }
        } catch {
            Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    if (-not $success) {
        throw "All installation URLs failed"
    }
#>

    # Prüfe Installation
    $env:PATH += ";$HOME\.cursor\bin"
    $cursorCmd = Get-Command cursor-agent -ErrorAction SilentlyContinue

    if ($cursorCmd) {
        Write-Host "✅ Cursor CLI erfolgreich installiert!" -ForegroundColor Green
        Write-Host "   Location: $($cursorCmd.Source)" -ForegroundColor Gray
        Write-Host "   Version: $(cursor-agent --version 2>&1)" -ForegroundColor Gray

        # Prüfe ob PATH dauerhaft gesetzt ist
        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*\.cursor\bin*") {
            Write-Host "`n⚠️ Cursor CLI ist nicht dauerhaft im PATH" -ForegroundColor Yellow
            Write-Host "Füge manuell hinzu mit:" -ForegroundColor Yellow
            Write-Host "  [System.Environment]::SetEnvironmentVariable('Path', `"$userPath;$HOME\.cursor\bin`", 'User')" -ForegroundColor Gray
            Write-Host "Dann Terminal neu starten." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Installation abgeschlossen, aber cursor-agent nicht im PATH gefunden" -ForegroundColor Yellow
        Write-Host "Versuche manuell:" -ForegroundColor Yellow
        Write-Host "  1. Terminal neu starten" -ForegroundColor Gray
        Write-Host "  2. Oder PATH manuell setzen: `$env:PATH += ';$HOME\.cursor\bin'" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Fehler bei der Installation: $_" -ForegroundColor Red
    Write-Host "`nManuelle Installation:" -ForegroundColor Yellow
    Write-Host "  1. Gehe zu https://cursor.com/docs/cli/installation" -ForegroundColor Gray
    Write-Host "  2. Folge den Windows-Installations-Anweisungen" -ForegroundColor Gray
    exit 1
}

