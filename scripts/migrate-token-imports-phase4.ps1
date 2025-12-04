<#
.SYNOPSIS
Phase 4: Migriert Tests Token-Imports zu spezifischen Dateien

.DESCRIPTION
Migriert automatisch die Token-Imports in Test-Dateien:
- Erkennt importierte Tokens
- Mapped zu korrekten Source-Dateien
- Gruppiert Imports nach Ziel-Datei
- Erhält Code-Formatierung
#>

# Token-zu-Datei Mapping (gleich wie Phase 1, 2 & 3)
$tokenMapping = @{
    # Core tokens
    'loggerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'environmentConfigToken' = '@/infrastructure/shared/tokens/core.tokens'
    'serviceContainerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerPortToken' = '@/infrastructure/shared/tokens/core.tokens'
    'moduleHealthServiceToken' = '@/infrastructure/shared/tokens/core.tokens'
    'moduleSettingsRegistrarToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerHealthCheckToken' = '@/infrastructure/shared/tokens/core.tokens'
    'metricsHealthCheckToken' = '@/infrastructure/shared/tokens/core.tokens'
    'healthCheckRegistryToken' = '@/infrastructure/shared/tokens/core.tokens'
    'runtimeConfigServiceToken' = '@/infrastructure/shared/tokens/core.tokens'
    'runtimeConfigToken' = '@/infrastructure/shared/tokens/core.tokens'
    'bootstrapInitHookServiceToken' = '@/infrastructure/shared/tokens/core.tokens'
    'bootstrapReadyHookServiceToken' = '@/infrastructure/shared/tokens/core.tokens'

    # Observability tokens
    'metricsCollectorToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsRecorderToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsSamplerToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'metricsStorageToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'traceContextToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'observabilityRegistryToken' = '@/infrastructure/shared/tokens/observability.tokens'
    'portSelectionEventEmitterToken' = '@/infrastructure/shared/tokens/observability.tokens'

    # I18n tokens
    'i18nFacadeServiceToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'i18nFacadeToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'localI18nServiceToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'localI18nToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'foundryI18nPortToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'foundryI18nToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'translationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'foundryTranslationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'localTranslationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'fallbackTranslationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'translationHandlersToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'translationHandlerChainToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'platformI18nPortToken' = '@/application/tokens/domain-ports.tokens'

    # Notification tokens
    'notificationServiceToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationCenterToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationChannelToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'uiChannelToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'consoleChannelToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'platformNotificationPortToken' = '@/application/tokens/domain-ports.tokens'
    'notificationPortToken' = '@/application/tokens/domain-ports.tokens'

    # Infrastructure tokens
    'cacheServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'cacheServiceConfigToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'platformCachePortToken' = '@/application/tokens/domain-ports.tokens'
    'retryServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'performanceTrackingServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'moduleApiInitializerToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'

    # Foundry tokens
    'foundryGameToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryHooksToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryDocumentToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundryUIToken' = '@/infrastructure/shared/tokens/foundry.tokens'
    'foundrySettingsToken' = '@/infrastructure/shared/tokens/foundry.tokens'
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
    'platformJournalEventPortToken' = '@/application/tokens/domain-ports.tokens'
    'moduleEventRegistrarToken' = '@/infrastructure/shared/tokens/event.tokens'
    'invalidateJournalCacheOnChangeUseCaseToken' = '@/infrastructure/shared/tokens/event.tokens'
    'processJournalDirectoryOnRenderUseCaseToken' = '@/infrastructure/shared/tokens/event.tokens'
    'triggerJournalDirectoryReRenderUseCaseToken' = '@/infrastructure/shared/tokens/event.tokens'
    'registerContextMenuUseCaseToken' = '@/infrastructure/shared/tokens/event.tokens'

    # Port tokens (Domain ports)
    'platformUIPortToken' = '@/application/tokens/domain-ports.tokens'
    'platformSettingsPortToken' = '@/application/tokens/domain-ports.tokens'
    'journalDirectoryUiPortToken' = '@/application/tokens/domain-ports.tokens'
    'journalCollectionPortToken' = '@/application/tokens/domain-ports.tokens'
    'journalRepositoryToken' = '@/application/tokens/domain-ports.tokens'
    'contextMenuRegistrationPortToken' = '@/application/tokens/domain-ports.tokens'
    'bootstrapHooksPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'settingsRegistrationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

    # Application tokens
    'journalVisibilityServiceToken' = '@/application/tokens/application.tokens'
    'journalVisibilityConfigToken' = '@/application/tokens/application.tokens'
    'hideJournalContextMenuHandlerToken' = '@/application/tokens/application.tokens'
    'journalContextMenuHandlersToken' = '@/application/tokens/application.tokens'
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Phase 4: Tests Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Target-Verzeichnisse für Phase 4
$targetDirs = @(
    "src/__tests__",
    "src/test"
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
        'import\s*\{([^}]+)\}\s*from\s*[''"]@/application/tokens[''"];?',
        'import\s*\{([^}]+)\}\s*from\s*[''"]@/domain/tokens[''"];?'
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
Write-Host "Zusammenfassung Phase 4:" -ForegroundColor Cyan
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
    Write-Host "Phase 4 erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Naechster Schritt: Finale Validation (Phase 5)" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Type-Check fehlgeschlagen!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Rollback: git checkout src/__tests__ src/test" -ForegroundColor Yellow
    exit 1
}

