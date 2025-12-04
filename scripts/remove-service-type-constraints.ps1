<#
.SYNOPSIS
Entfernt alle "extends ServiceType" Constraints aus dem DI-System

.DESCRIPTION
Ersetzt alle Generic-Constraints "extends ServiceType" durch freie Generics.
ServiceType ist jetzt "unknown", daher sind die Constraints wirkungslos.
#>

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Remove ServiceType Constraints" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$files = Get-ChildItem -Path "src/infrastructure/di" -Recurse -Filter "*.ts"
$changedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Pattern 1: <TServiceType extends ServiceType> → <T>
    $content = $content -replace '<TServiceType extends ServiceType>', '<T>'

    # Pattern 2: <T extends ServiceType> → <T>
    $content = $content -replace '<T extends ServiceType>', '<T>'

    # Pattern 3: TServiceType → T (nur in Parametern/Returns, nicht in Kommentaren)
    # Nur ersetzen wenn es nach < oder als Parameter kommt
    $content = $content -replace '([<(,]\s*)TServiceType([>,)\s:])', '$1T$2'

    # Pattern 4: : TServiceType → : T (Return-Types)
    $content = $content -replace ':\s*TServiceType([>\s;,)])', ': T$1'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $changedCount++
        Write-Host "  Geändert: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Zusammenfassung:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Geänderte Dateien: $changedCount" -ForegroundColor Green

Write-Host ""
Write-Host "Fuehre Type-Check aus..." -ForegroundColor Cyan
npm run type-check

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Type-Check fehlgeschlagen!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    exit 1
}

