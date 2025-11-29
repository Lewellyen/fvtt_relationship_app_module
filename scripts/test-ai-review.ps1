# PowerShell-Wrapper für AI Code Review Tests
# Macht WSL-Zugriff einfacher direkt aus PowerShell

param(
    [Parameter(Position=0)]
    [ValidateSet("incremental", "full", "full-src")]
    [string]$Mode = "incremental"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 AI Code Review Test (PowerShell → WSL)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob .env existiert
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env Datei nicht gefunden!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erstelle .env.example zu .env und füge deinen CURSOR_API_KEY ein." -ForegroundColor Yellow
    exit 1
}

# Wähle vollständiges Skript
$wslScript = "scripts/test-ai-review-local.sh"

# Prüfe ob Skript existiert
if (-not (Test-Path $wslScript)) {
    Write-Host "❌ Skript nicht gefunden: $wslScript" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Modus: $Mode" -ForegroundColor Green
Write-Host "📁 Skript: $wslScript" -ForegroundColor Gray
Write-Host ""

# Konvertiere Windows-Pfad zu WSL-Pfad
# Beispiel: G:\Development\... → /mnt/g/Development/... (kleingeschrieben!)
$driveLetter = $PWD.Path.Substring(0, 1).ToLower()
$relativePath = $PWD.Path.Substring(3) -replace '\\', '/'
$wslPath = "/mnt/$driveLetter/$relativePath"

Write-Host "🔄 Starte WSL-Befehl..." -ForegroundColor Yellow
Write-Host "   WSL-Pfad: $wslPath" -ForegroundColor Gray
Write-Host ""

# Führe Skript in WSL aus
# Single Quotes schützen den Pfad vor Leerzeichen in bash
$bashCmd = @"
cd '$wslPath' && export PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:`$HOME/.local/bin:`$PATH' && chmod +x '$wslScript' && bash '$wslScript' '$Mode'
"@
wsl bash -c $bashCmd

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Test abgeschlossen!" -ForegroundColor Green
} else {
    Write-Host "❌ Test fehlgeschlagen (Exit Code: $exitCode)" -ForegroundColor Red
}

exit $exitCode

