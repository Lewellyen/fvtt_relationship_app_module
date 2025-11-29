# PowerShell-Script zum Öffnen der Analyse-Output-Datei
# Öffnet die Datei entweder in Notepad oder kopiert sie nach Windows

param(
    [switch]$CopyToProject = $false,
    [string]$OutputPath = "$env:TEMP\analysis-output.json"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Suche Analyse-Output-Datei..." -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Datei in WSL existiert
$wslCheck = wsl bash -c "if [ -f /tmp/analysis-output.json ]; then echo 'EXISTS'; else echo 'NOT_FOUND'; fi" 2>&1

if ($wslCheck -notmatch "EXISTS") {
    Write-Host "❌ Analyse-Output-Datei nicht gefunden!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Die Datei sollte unter /tmp/analysis-output.json in WSL liegen." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Mögliche Gründe:" -ForegroundColor Yellow
    Write-Host "  - Der Test wurde noch nicht ausgeführt" -ForegroundColor Gray
    Write-Host "  - Der Test ist fehlgeschlagen" -ForegroundColor Gray
    Write-Host "  - Die Datei wurde gelöscht" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Führe zuerst den Test aus:" -ForegroundColor Cyan
    Write-Host "  .\scripts\test-ai-review.ps1 full" -ForegroundColor White
    exit 1
}

Write-Host "✅ Analyse-Output-Datei gefunden in WSL: /tmp/analysis-output.json" -ForegroundColor Green

# Prüfe Größe
$fileInfo = wsl bash -c "stat -c '%s' /tmp/analysis-output.json 2>/dev/null || echo '0'"
$sizeKB = [math]::Round([int]$fileInfo / 1KB, 2)
Write-Host "📊 Dateigröße: $sizeKB KB" -ForegroundColor Gray
Write-Host ""

if ($CopyToProject) {
    # Kopiere nach Projekt-Root
    $projectPath = Join-Path $PWD "analysis-output.json"
    Write-Host "📋 Kopiere nach Projekt-Root..." -ForegroundColor Cyan
    wsl bash -c "cp /tmp/analysis-output.json '/mnt/g/Development/Foundry VTT V11 Data/Data/modules/fvtt_relationship_app_module/analysis-output.json'"

    if (Test-Path $projectPath) {
        Write-Host "✅ Datei kopiert nach: $projectPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Du kannst die Datei jetzt öffnen:" -ForegroundColor Yellow
        Write-Host "   notepad analysis-output.json" -ForegroundColor White
        Write-Host "   oder" -ForegroundColor Gray
        Write-Host "   code analysis-output.json" -ForegroundColor White
    } else {
        Write-Host "⚠️ Kopieren fehlgeschlagen" -ForegroundColor Yellow
    }
} else {
    # Kopiere nach TEMP und öffne
    Write-Host "📋 Kopiere nach Windows TEMP..." -ForegroundColor Cyan
    wsl cat /tmp/analysis-output.json | Out-File -FilePath $OutputPath -Encoding UTF8

    if (Test-Path $OutputPath) {
        Write-Host "✅ Datei kopiert nach: $OutputPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Öffne Datei..." -ForegroundColor Cyan
        Start-Process notepad.exe -ArgumentList $OutputPath
        Write-Host ""
        Write-Host "💡 Alternative: Öffne mit Cursor:" -ForegroundColor Yellow
        Write-Host "   code `"$OutputPath`"" -ForegroundColor White
    } else {
        Write-Host "⚠️ Kopieren fehlgeschlagen" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 Tipp: Verwende -CopyToProject um die Datei ins Projekt zu kopieren" -ForegroundColor Gray
Write-Host "   .\scripts\open-analysis-output.ps1 -CopyToProject" -ForegroundColor White

