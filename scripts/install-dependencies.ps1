# Installiere Python-Abhängigkeiten für AI Review Skripte (PowerShell)
# Optional: Installiert auch Cursor CLI wenn nicht vorhanden

Write-Host "Installing Python dependencies for AI Review scripts..." -ForegroundColor Cyan

# Prüfe ob Python verfügbar ist
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
}

if (-not $pythonCmd) {
    Write-Host "❌ Python nicht gefunden!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python gefunden: $($pythonCmd.Source)" -ForegroundColor Green

# Prüfe ob wir in einer virtuellen Umgebung sind
$inVenv = $env:VIRTUAL_ENV -ne $null -or $env:CONDA_DEFAULT_ENV -ne $null

# Installiere python-dotenv
Write-Host "Installing python-dotenv..." -ForegroundColor Cyan

if ($inVenv) {
    Write-Host "Virtuelle Umgebung erkannt - installiere ohne --user" -ForegroundColor Cyan
    & $pythonCmd.Source -m pip install python-dotenv
} else {
    Write-Host "System-Python erkannt - installiere mit --user" -ForegroundColor Cyan
    & $pythonCmd.Source -m pip install --user python-dotenv
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python-Abhängigkeiten installiert" -ForegroundColor Green
} else {
    Write-Host "⚠️ Installation fehlgeschlagen" -ForegroundColor Yellow
    if ($inVenv) {
        Write-Host "Bitte manuell installieren: python -m pip install python-dotenv" -ForegroundColor Yellow
    } else {
        Write-Host "Bitte manuell installieren: python -m pip install --user python-dotenv" -ForegroundColor Yellow
    }
}

