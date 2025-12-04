<#
.SYNOPSIS
Phase 1: Migriert Framework/Config Token-Imports zu spezifischen Dateien

.DESCRIPTION
Migriert automatisch die Token-Imports in Framework/Config-Dateien:
- Erkennt importierte Tokens
- Mapped zu korrekten Source-Dateien
- Gruppiert Imports nach Ziel-Datei
- Erhält Code-Formatierung
#>

# Token-zu-Datei Mapping
$tokenMapping = @{
    # Core tokens
    'loggerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'environmentConfigToken' = '@/infrastructure/shared/tokens/core.tokens'
    'serviceContainerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

    # Observability tokens
    'metricsCollectorToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsRecorderToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsSamplerToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsStorageToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'traceContextToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'performanceTrackingServiceToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'observabilityRegistryToken' = '@/infrastructure/shared/tokens/observability.tokens'

    # I18n tokens
    'i18nFacadeServiceToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'i18nFacadeToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'localI18nServiceToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'foundryI18nPortToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'translationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'platformI18nPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

    # Notification tokens
    'notificationServiceToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationCenterToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationChannelToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'platformNotificationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'notificationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

    # Infrastructure tokens
    'cacheServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'cacheServiceConfigToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'platformCachePortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'retryServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'

    # Foundry tokens
    'foundryGameToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryHooksToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryDocumentToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryUIToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundrySettingsToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryI18nToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'portSelectorToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryJournalFacadeToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'libWrapperServiceToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'journalContextMenuLibWrapperServiceToken' = '@/infrastructure/shared/tokens/foundry.tokens'

    # Foundry Port Registry Tokens
    'foundryGamePortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryHooksPortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryDocumentPortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryUIPortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundrySettingsPortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryI18nPortRegistryToken' = '@/infrastructure/shared/tokens/foundry.tokens'

    # Foundry V13 Port Tokens
    'foundryV13GamePortToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryV13HooksPortToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryV13DocumentPortToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryV13UIPortToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryV13SettingsPortToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryV13I18nPortToken' = '@/infrastructure/shared/tokens/foundry.tokens'

    # Event tokens
    'platformJournalEventPortToken' = '@/infrastructure/shared/tokens/event.tokens'
    'moduleEventRegistrarToken' = '@/infrastructure/shared/tokens/event.tokens'
    'portSelectionEventEmitterToken' = '@/infrastructure/shared/tokens/foundry.tokens'

    # Port tokens (Domain ports)
    'platformUIPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'platformSettingsPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalDirectoryUiPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalCollectionPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalRepositoryToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'bootstrapHooksPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'settingsRegistrationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'contextMenuRegistrationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

    # Application tokens
    'journalVisibilityServiceToken' = '@/application/tokens/application.tokens'
    'journalVisibilityConfigToken' = '@/application/tokens/application.tokens'
    'moduleHealthServiceToken' = '@/application/tokens/application.tokens'
    'moduleSettingsRegistrarToken' = '@/application/tokens/application.tokens'
    'moduleApiInitializerToken' = '@/application/tokens/application.tokens'
    'containerHealthCheckToken' = '@/application/tokens/application.tokens'
    'metricsHealthCheckToken' = '@/application/tokens/application.tokens'
    'healthCheckRegistryToken' = '@/application/tokens/application.tokens'
    'runtimeConfigServiceToken' = '@/application/tokens/application.tokens'
    'runtimeConfigToken' = '@/application/tokens/application.tokens'
    'invalidateJournalCacheOnChangeUseCaseToken' = '@/application/tokens/application.tokens'
    'processJournalDirectoryOnRenderUseCaseToken' = '@/application/tokens/application.tokens'
    'triggerJournalDirectoryReRenderUseCaseToken' = '@/application/tokens/application.tokens'
    'registerContextMenuUseCaseToken' = '@/application/tokens/application.tokens'
    'hideJournalContextMenuHandlerToken' = '@/application/tokens/application.tokens'
    'journalContextMenuHandlerToken' = '@/application/tokens/application.tokens'

    # Framework tokens
    'bootstrapInitHookServiceToken' = '@/application/tokens/application.tokens'
    'bootstrapReadyHookServiceToken' = '@/application/tokens/application.tokens'
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Phase 1: Framework/Config Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Target-Verzeichnisse für Phase 1
$targetDirs = @(
    "src/framework/config",
    "src/framework/core"
)

$files = @()
foreach ($dir in $targetDirs) {
    if (Test-Path $dir) {
        $files += Get-ChildItem -Path $dir -Recurse -Filter "*.ts" -Exclude "*.d.ts"
    }
}

Write-Host "Gefundene Dateien: $($files.Count)" -ForegroundColor Gray
Write-Host ""

$migratedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false

    # Pattern für Token-Imports aus Barrel-Exports
    $patterns = @(
        'import\s*\{([^}]+)\}\s*from\s*[''"]@/infrastructure/shared/tokens[''"];?',
        'import\s*\{([^}]+)\}\s*from\s*[''"]@/application/tokens[''"];?'
    )

    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern)

        if ($matches.Count -eq 0) {
            continue
        }

        Write-Host "  Datei: $($file.Name)" -ForegroundColor Yellow

        foreach ($match in $matches) {
            $fullMatch = $match.Groups[0].Value
            $importedTokens = $match.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }

            # Gruppiere Tokens nach Ziel-Datei
            $tokensByFile = @{}
            $unmappedTokens = @()

            foreach ($token in $importedTokens) {
                if ($tokenMapping.ContainsKey($token)) {
                    $targetFile = $tokenMapping[$token]
                    if (-not $tokensByFile.ContainsKey($targetFile)) {
                        $tokensByFile[$targetFile] = @()
                    }
                    $tokensByFile[$targetFile] += $token
                } else {
                    $unmappedTokens += $token
                    Write-Host "    Warnung: Unbekannter Token: $token" -ForegroundColor Red
                    $errorCount++
                }
            }

            # Erstelle neue Import-Statements
            $newImports = @()
            foreach ($targetFile in $tokensByFile.Keys) {
                $tokens = $tokensByFile[$targetFile] -join ", "
                $newImports += "import { $tokens } from ""$targetFile"";"
            }

            # Füge unmapped tokens zum ersten neuen Import hinzu (Fallback)
            if ($unmappedTokens.Count -gt 0) {
                Write-Host "    Info: $($unmappedTokens.Count) unmapped tokens werden nicht migriert" -ForegroundColor Yellow
                # Behalte Original-Import für unmapped tokens
                if ($newImports.Count -eq 0) {
                    continue
                }
            }

            if ($newImports.Count -gt 0) {
                $replacement = $newImports -join "`r`n"
                $content = $content.Replace($fullMatch, $replacement)
                $changed = $true
                Write-Host "    Migriert: $($tokensByFile.Keys.Count) Ziel-Dateien" -ForegroundColor Green
            }
        }
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $migratedCount++
    } else {
        $skippedCount++
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Zusammenfassung Phase 1:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Migrierte Dateien: $migratedCount" -ForegroundColor Green
Write-Host "  Uebersprungene Dateien: $skippedCount" -ForegroundColor Gray
if ($errorCount -gt 0) {
    Write-Host "  Warnungen: $errorCount" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Fuehre Type-Check aus..." -ForegroundColor Cyan
npm run type-check

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Phase 1 erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Naechster Schritt: Commit und Phase 2" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Type-Check fehlgeschlagen!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Rollback: git checkout src/framework" -ForegroundColor Yellow
    exit 1
}

