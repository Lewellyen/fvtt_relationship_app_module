# Migration Script: Token-Imports und ServiceType-Fixes
# Migriert Token-Imports von Barrel-Export zu spezifischen Token-Dateien

Write-Host "Analysiere TypeScript-Dateien..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts"
$migratedCount = 0
$serviceTypeFixCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false

    # Fix: ServiceType imports außerhalb des DI-Systems entfernen
    if ($file.FullName -notmatch "\\infrastructure\\di\\") {
        $pattern = 'import type \{ ServiceType \} from "@/infrastructure/shared/tokens";'
        if ($content -match [regex]::Escape($pattern)) {
            $content = $content -replace [regex]::Escape($pattern), ''
            # Entferne auch leere Zeilen
            $content = $content -replace '(\r?\n){3,}', "`r`n`r`n"
            $changed = $true
            $serviceTypeFixCount++
            Write-Host "  ServiceType Import entfernt: $($file.Name)" -ForegroundColor Yellow
        }
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $migratedCount++
    }
}

Write-Host ""
Write-Host "Zusammenfassung:" -ForegroundColor Cyan
Write-Host "  Migrierte Dateien: $migratedCount" -ForegroundColor Green
Write-Host "  ServiceType Imports entfernt: $serviceTypeFixCount" -ForegroundColor Green

Write-Host ""
Write-Host "Fuehre Type-Check aus..." -ForegroundColor Cyan
npm run type-check

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration erfolgreich abgeschlossen!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Type-Check fehlgeschlagen. Bitte Fehler manuell beheben." -ForegroundColor Red
}
