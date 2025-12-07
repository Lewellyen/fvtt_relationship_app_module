#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Migriert alle Token-Imports von gruppierten Dateien zu feingranularen Token-Dateien.

.DESCRIPTION
    Ersetzt alle Imports von:
    - @/infrastructure/shared/tokens/core.tokens
    - @/infrastructure/shared/tokens/observability.tokens
    - @/infrastructure/shared/tokens/foundry.tokens
    - etc.

    Zu feingranularen Imports:
    - @/infrastructure/shared/tokens/core/logger.token
    - @/infrastructure/shared/tokens/observability/metrics-collector.token
    - etc.

    ODER zu gruppierten Index-Imports:
    - @/infrastructure/shared/tokens/core
    - @/infrastructure/shared/tokens/observability
    - etc.
#>

$ErrorActionPreference = "Stop"

$tokenMappings = @{
    # Core tokens
    "loggerToken" = "core/logger.token"
    "environmentConfigToken" = "core/environment-config.token"
    "runtimeConfigToken" = "core/runtime-config.token"
    "moduleHealthServiceToken" = "core/module-health-service.token"
    "healthCheckRegistryToken" = "core/health-check-registry.token"
    "containerHealthCheckToken" = "core/container-health-check.token"
    "metricsHealthCheckToken" = "core/metrics-health-check.token"
    "serviceContainerToken" = "core/service-container.token"
    "moduleSettingsRegistrarToken" = "core/module-settings-registrar.token"
    "bootstrapInitHookServiceToken" = "core/bootstrap-init-hook-service.token"
    "bootstrapReadyHookServiceToken" = "core/bootstrap-ready-hook-service.token"

    # Observability tokens
    "metricsCollectorToken" = "observability/metrics-collector.token"
    "metricsRecorderToken" = "observability/metrics-recorder.token"
    "metricsSamplerToken" = "observability/metrics-sampler.token"
    "metricsReporterToken" = "observability/metrics-reporter.token"
    "metricsStorageToken" = "observability/metrics-storage.token"
    "traceContextToken" = "observability/trace-context.token"
    "portSelectionEventEmitterToken" = "observability/port-selection-event-emitter.token"
    "observabilityRegistryToken" = "observability/observability-registry.token"

    # Foundry tokens
    "foundryGameToken" = "foundry/foundry-game.token"
    "foundryHooksToken" = "foundry/foundry-hooks.token"
    "foundryDocumentToken" = "foundry/foundry-document.token"
    "foundryUIToken" = "foundry/foundry-ui.token"
    "foundrySettingsToken" = "foundry/foundry-settings.token"
    "portSelectorToken" = "foundry/port-selector.token"
    "foundryGamePortRegistryToken" = "foundry/foundry-game-port-registry.token"
    "foundryHooksPortRegistryToken" = "foundry/foundry-hooks-port-registry.token"
    "foundryDocumentPortRegistryToken" = "foundry/foundry-document-port-registry.token"
    "foundryUIPortRegistryToken" = "foundry/foundry-ui-port-registry.token"
    "foundrySettingsPortRegistryToken" = "foundry/foundry-settings-port-registry.token"
    "foundryI18nPortRegistryToken" = "foundry/foundry-i18n-port-registry.token"
    "foundryModulePortRegistryToken" = "foundry/foundry-module-port-registry.token"
    "foundryV13GamePortToken" = "foundry/foundry-v13-game-port.token"
    "foundryV13HooksPortToken" = "foundry/foundry-v13-hooks-port.token"
    "foundryV13DocumentPortToken" = "foundry/foundry-v13-document-port.token"
    "foundryV13UIPortToken" = "foundry/foundry-v13-ui-port.token"
    "foundryV13SettingsPortToken" = "foundry/foundry-v13-settings-port.token"
    "foundryV13I18nPortToken" = "foundry/foundry-v13-i18n-port.token"
    "foundryV13ModulePortToken" = "foundry/foundry-v13-module-port.token"
    "foundryJournalFacadeToken" = "foundry/foundry-journal-facade.token"
    "libWrapperServiceToken" = "foundry/lib-wrapper-service.token"
    "journalContextMenuLibWrapperServiceToken" = "foundry/journal-context-menu-lib-wrapper-service.token"

    # I18n tokens
    "foundryI18nToken" = "i18n/foundry-i18n.token"
    "localI18nToken" = "i18n/local-i18n.token"
    "i18nFacadeToken" = "i18n/i18n-facade.token"
    "foundryTranslationHandlerToken" = "i18n/foundry-translation-handler.token"
    "localTranslationHandlerToken" = "i18n/local-translation-handler.token"
    "fallbackTranslationHandlerToken" = "i18n/fallback-translation-handler.token"
    "translationHandlerChainToken" = "i18n/translation-handler-chain.token"
    "translationHandlersToken" = "i18n/translation-handlers.token"

    # Infrastructure tokens
    "cacheServiceConfigToken" = "infrastructure/cache-service-config.token"
    "cacheServiceToken" = "infrastructure/cache-service.token"
    "performanceTrackingServiceToken" = "infrastructure/performance-tracking-service.token"
    "retryServiceToken" = "infrastructure/retry-service.token"
    "moduleApiInitializerToken" = "infrastructure/module-api-initializer.token"
    "moduleIdToken" = "infrastructure/module-id.token"

    # Notification tokens
    "notificationCenterToken" = "notifications/notification-center.token"
    "consoleChannelToken" = "notifications/console-channel.token"
    "uiChannelToken" = "notifications/ui-channel.token"

    # Port tokens
    "platformBootstrapEventPortToken" = "ports/platform-bootstrap-event-port.token"
    "platformModuleReadyPortToken" = "ports/platform-module-ready-port.token"
    "platformSettingsRegistrationPortToken" = "ports/platform-settings-registration-port.token"

    # Validation tokens
    "platformValidationPortToken" = "validation/platform-validation-port.token"
}

$oldTokenFiles = @(
    "core.tokens",
    "observability.tokens",
    "foundry.tokens",
    "i18n.tokens",
    "infrastructure.tokens",
    "notifications.tokens",
    "ports.tokens",
    "validation.tokens"
)

Write-Host "Migrating token imports to singular token files..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx", "*.svelte" | Where-Object {
    $_.FullName -notmatch "node_modules|dist|\.test\.|\.spec\." -and
    $_.FullName -notmatch "tokens/(core|observability|foundry|i18n|infrastructure|notifications|ports|validation)/"
}

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0

    # Ersetze Imports von alten Token-Dateien
    foreach ($oldFile in $oldTokenFiles) {
        $pattern = "from\s+['\`"]@/infrastructure/shared/tokens/$oldFile['\`"]"
        if ($content -match $pattern) {
            # Finde alle Tokens, die aus dieser Datei importiert werden
            $importMatch = [regex]::Match($content, "import\s+\{([^}]+)\}\s+from\s+['\`"]@/infrastructure/shared/tokens/$oldFile['\`"]")
            if ($importMatch.Success) {
                $importedTokens = $importMatch.Groups[1].Value -split "," | ForEach-Object { $_.Trim() }

                # Erstelle neue Imports für jeden Token
                $newImports = @()
                foreach ($token in $importedTokens) {
                    if ($tokenMappings.ContainsKey($token)) {
                        $newPath = $tokenMappings[$token]
                        $newImports += "import { $token } from `"@/infrastructure/shared/tokens/$newPath`";"
                        $fileReplacements++
                    }
                }

                # Ersetze alten Import mit neuen Imports
                if ($newImports.Count -gt 0) {
                    $newImportsText = $newImports -join "`n"
                    $content = $content -replace $pattern, ""
                    # Füge neue Imports nach dem letzten Import ein
                    $lastImportMatch = [regex]::Match($content, "(import\s+[^;]+;[\r\n]*)", [System.Text.RegularExpressions.RegexOptions]::Multiline)
                    if ($lastImportMatch.Success) {
                        $insertPos = $lastImportMatch.Index + $lastImportMatch.Length
                        $content = $content.Insert($insertPos, "`n$newImportsText`n")
                    } else {
                        # Kein Import gefunden, füge am Anfang ein
                        $content = "$newImportsText`n`n$content"
                    }
                }
            }
        }
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFiles++
        $totalReplacements += $fileReplacements
        Write-Host "  Updated: $($file.FullName) ($fileReplacements replacements)" -ForegroundColor Green
    }
}

Write-Host "`nMigration complete!" -ForegroundColor Cyan
Write-Host "  Files updated: $totalFiles" -ForegroundColor Green
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Green

