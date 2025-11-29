# Einfaches Script zum Abrufen der Analyse-Output-Datei
# Kopiert die Datei nach Windows und zeigt Info

$ErrorActionPreference = "Stop"

$outputFile = Join-Path $PWD "analysis-output.json"

Write-Host "📥 Lade Analyse-Output-Datei..." -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Datei existiert
$checkCmd = 'if [ -f /tmp/analysis-output.json ]; then echo yes; else echo no; fi'
$existsOutput = wsl bash -c $checkCmd 2>&1
$exists = ($existsOutput | Where-Object { $_ -match '^(yes|no)$' } | Select-Object -Last 1)
if (-not $exists) { $exists = "no" }

if ($exists -eq "no") {
    Write-Host "❌ Datei nicht gefunden!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Führe zuerst den Test aus:" -ForegroundColor Yellow
    Write-Host "  .\scripts\test-ai-review.ps1 full" -ForegroundColor White
    exit 1
}

# Kopiere nach Projekt
Write-Host "📋 Kopiere nach: $outputFile" -ForegroundColor Gray
wsl cat /tmp/analysis-output.json | Out-File -FilePath $outputFile -Encoding UTF8

if (Test-Path $outputFile) {
    $size = (Get-Item $outputFile).Length
    $sizeKB = [math]::Round($size / 1KB, 2)

    Write-Host "✅ Erfolgreich kopiert!" -ForegroundColor Green
    Write-Host "   Größe: $sizeKB KB" -ForegroundColor Gray
    Write-Host "   Pfad: $outputFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Öffne mit:" -ForegroundColor Yellow
    Write-Host "   code analysis-output.json" -ForegroundColor White
    Write-Host "   oder" -ForegroundColor Gray
    Write-Host "   notepad analysis-output.json" -ForegroundColor White
} else {
    Write-Host "❌ Fehler beim Kopieren" -ForegroundColor Red
    exit 1
}

