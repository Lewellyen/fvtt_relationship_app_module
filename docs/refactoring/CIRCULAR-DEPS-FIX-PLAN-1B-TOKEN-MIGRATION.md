# Mehrphasiger Migrationsplan: Token Barrel-Exports Migration

**Problem-ID:** Token Barrel-Exports Migration
**Betroffene Dateien:** 87 Dateien migriert (ursprünglich 96 Warnings)
**Status:** ✅ ABGESCHLOSSEN (2025-12-04)
**Priorität:** 🟢 NIEDRIG (Optimierung, kein funktionales Problem)
**Tatsächliche Dauer:** ~2 Stunden (alle 4 Phasen in einer Session)

---

## 📊 Problem-Analyse

### Aktueller Zustand

Nach der erfolgreichen Behebung des Token Hub-Problems (93% der Circular Dependencies) verbleiben **96 ESLint-Warnings** für deprecated Barrel-Export-Imports:

```typescript
// ❌ Deprecated (funktioniert aber):
import { loggerToken } from "@/infrastructure/shared/tokens";
import { journalVisibilityServiceToken } from "@/application/tokens";

// ✅ Empfohlen (besseres Tree-Shaking):
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";
```

### Verteilung der Warnings

| Kategorie | Anzahl | Priorität | Begründung |
|-----------|--------|-----------|------------|
| **Framework/Config** | ~35 | 🔴 HOCH | Composition Root - wird bei jedem App-Start geladen |
| **Infrastructure Services** | ~30 | 🟡 MITTEL | Oft genutzte Services |
| **Application Layer** | ~15 | 🟡 MITTEL | Business Logic |
| **Tests** | ~16 | 🟢 NIEDRIG | Nur während Tests geladen |

### Warum migrieren?

**Vorteile:**
- ✅ **Besseres Tree-Shaking**: Bundler können ungenutzte Tokens eliminieren
- ✅ **Schnellere Build-Zeiten**: Weniger transitive Imports
- ✅ **Explizite Dependencies**: Klarer, welche Tokens genutzt werden
- ✅ **Wartbarkeit**: Best Practice etablieren

**Nachteile:**
- ⚠️ Mehr Zeilen Code (mehrere Import-Statements)
- ⚠️ Git-Diff wird groß (aber nur einmalig)

---

## 🎯 Migrations-Strategie

### Prinzipien

1. **Inkrementell**: Migration über mehrere Phasen verteilt
2. **Automatisiert**: PowerShell-Script für die meiste Arbeit
3. **Testbar**: Nach jeder Phase Type-Check + Tests
4. **Reversibel**: Alte Imports bleiben funktionsfähig
5. **Optional**: Keine Dringlichkeit, kann verzögert werden

### Phasen-Übersicht

```
Phase 1: Framework/Config (HOCH)    → 35 Dateien → 1h
Phase 2: Infrastructure (MITTEL)    → 30 Dateien → 45min
Phase 3: Application (MITTEL)       → 15 Dateien → 30min
Phase 4: Tests (NIEDRIG)            → 16 Dateien → 30min
Phase 5: Cleanup & Validation       → Finale Tests → 15min
```

---

## 🔧 Phase 1: Framework/Config Migration (HOCH)

**Dauer:** 1 Stunde
**Priorität:** 🔴 HOCH
**Dateien:** 35

### Warum zuerst?

- Composition Root wird **bei jedem App-Start** geladen
- Größter Impact auf Bundle-Size
- DependencyConfig importiert viele Tokens

### Betroffene Dateien

```
framework/
├── config/
│   ├── dependencyconfig.ts                     (viele Token-Imports)
│   ├── modules/
│   │   ├── cache-services.config.ts
│   │   ├── core-services.config.ts
│   │   ├── entity-ports.config.ts
│   │   ├── event-ports.config.ts
│   │   ├── foundry-services.config.ts          (3 Barrel-Imports!)
│   │   ├── i18n-services.config.ts
│   │   ├── journal-visibility.config.ts
│   │   ├── notifications.config.ts
│   │   ├── observability.config.ts
│   │   ├── port-infrastructure.config.ts       (2 Barrel-Imports!)
│   │   ├── registrars.config.ts
│   │   ├── settings-ports.config.ts
│   │   └── utility-services.config.ts
│   └── __tests__/
│       ├── dependencyconfig.test.ts            (2 Barrel-Imports!)
│       └── modules/
│           └── port-infrastructure.config.test.ts
└── core/
    ├── composition-root.ts                     (Zentral!)
    ├── init-solid.ts
    ├── bootstrap-init-hook.ts
    ├── bootstrap-ready-hook.ts
    ├── api/
    │   ├── api-token-config.ts                 (2 Barrel-Imports!)
    │   └── module-api-initializer.ts           (2 Barrel-Imports!)
    └── bootstrap/orchestrators/
        ├── api-bootstrapper.ts
        ├── context-menu-bootstrapper.ts
        ├── events-bootstrapper.ts
        ├── logging-bootstrapper.ts
        ├── metrics-bootstrapper.ts
        ├── notification-bootstrapper.ts
        └── settings-bootstrapper.ts
```

### Schritt 1.1: Migration-Script erweitern

**Datei:** `scripts/migrate-token-imports-phase1.ps1`

```powershell
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

# Token-zu-Datei Mapping (aus Plan 1)
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
    $files += Get-ChildItem -Path $dir -Recurse -Filter "*.ts" -Exclude "*.d.ts"
}

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
            if ($unmappedTokens.Count -gt 0 -and $newImports.Count -gt 0) {
                Write-Host "    Info: Unmapped tokens werden nicht migriert" -ForegroundColor Yellow
                # Behalte Original-Import für unmapped tokens
                continue
            }

            if ($newImports.Count -gt 0) {
                $replacement = $newImports -join [Environment]::NewLine
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
Write-Host "Zusammenfassung Phase 1:" -ForegroundColor Cyan
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
    Write-Host "Phase 1 erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "Naechster Schritt: npm run lint (pruefe verbleibende Warnings)" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Type-Check fehlgeschlagen. Bitte Fehler pruefen." -ForegroundColor Red
    Write-Host "Rollback: git checkout src/framework" -ForegroundColor Yellow
}
```

### Schritt 1.2: Migration ausführen

```powershell
# Backup
git add -A
git commit -m "checkpoint: before Phase 1 token migration"

# Phase 1 ausführen
powershell -ExecutionPolicy Bypass -File scripts/migrate-token-imports-phase1.ps1

# Prüfen
npm run lint | Select-String "framework" | Measure-Object  # Sollte 0 sein
npm run test -- src/framework/  # Framework-Tests

# Commit
git add src/framework/
git commit -m "refactor(tokens): migrate Framework/Config to specific token imports (Phase 1/4)"
```

**Commit-Message-Template:**
```
refactor(tokens): migrate Framework/Config to specific token imports (Phase 1/4)

- Migriert 35 Dateien von Barrel-Exports zu spezifischen Token-Dateien
- Framework/Config hat höchste Priorität (App-Start)
- Verbessert Tree-Shaking und Build-Performance
- Keine funktionalen Änderungen
- Type-Check: ✅ Erfolgreich
- Tests: ✅ Alle bestanden

BREAKING CHANGE: Keine - alte Imports funktionieren weiter
```

---

## 🔧 Phase 2: Infrastructure Services Migration (MITTEL)

**Dauer:** 45 Minuten
**Priorität:** 🟡 MITTEL
**Dateien:** 30

### Betroffene Dateien

```
infrastructure/
├── adapters/
│   ├── cache/
│   │   ├── platform-cache-port-adapter.ts
│   │   └── __tests__/platform-cache-port-adapter.test.ts
│   ├── foundry/
│   │   ├── adapters/foundry-ui-adapter.ts
│   │   ├── event-adapters/foundry-journal-event-adapter.ts
│   │   ├── settings-adapters/
│   │   │   ├── foundry-settings-adapter.ts
│   │   │   └── foundry-settings-registration-adapter.ts
│   │   ├── services/
│   │   │   ├── FoundryDocumentPort.ts
│   │   │   ├── FoundryGamePort.ts
│   │   │   ├── FoundryHooksPort.ts
│   │   │   ├── FoundryI18nPort.ts
│   │   │   ├── FoundryLibWrapperService.ts
│   │   │   ├── FoundrySettingsPort.ts
│   │   │   ├── FoundryUIPort.ts
│   │   │   ├── JournalContextMenuLibWrapperService.ts
│   │   │   └── __tests__/foundry-api-error-handling.test.ts
│   │   └── versioning/portselector.ts
│   ├── i18n/
│   │   ├── platform-i18n-port-adapter.ts
│   │   └── __tests__/platform-i18n-port-adapter.test.ts
│   └── notifications/
│       ├── platform-notification-port-adapter.ts
│       └── __tests__/platform-notification-port-adapter.test.ts
├── cache/CacheService.ts
├── di/container.ts
├── i18n/
│   ├── FoundryTranslationHandler.ts
│   ├── I18nFacadeService.ts
│   ├── LocalTranslationHandler.ts
│   └── TranslationHandlerChain.ts
├── logging/ConsoleLoggerService.ts
├── notifications/
│   ├── NotificationCenter.ts
│   └── channels/
│       ├── ConsoleChannel.ts
│       └── UIChannel.ts
├── observability/
│   ├── metrics-collector.ts
│   ├── metrics-persistence/persistent-metrics-collector.ts
│   ├── observability-registry.ts
│   └── trace/__tests__/TraceContext.integration.test.ts
├── performance/PerformanceTrackingService.ts
└── retry/RetryService.ts
```

### Schritt 2.1: Script für Phase 2

```powershell
# Kopiere Phase 1 Script und passe Target-Verzeichnis an
Copy-Item scripts/migrate-token-imports-phase1.ps1 scripts/migrate-token-imports-phase2.ps1

# Ändere Target-Verzeichnisse:
$targetDirs = @(
    "src/infrastructure/adapters",
    "src/infrastructure/cache",
    "src/infrastructure/di/container.ts",
    "src/infrastructure/i18n",
    "src/infrastructure/logging",
    "src/infrastructure/notifications",
    "src/infrastructure/observability",
    "src/infrastructure/performance",
    "src/infrastructure/retry"
)
```

### Schritt 2.2: Migration ausführen

```powershell
# Backup
git add -A
git commit -m "checkpoint: before Phase 2 token migration"

# Phase 2 ausführen
powershell -ExecutionPolicy Bypass -File scripts/migrate-token-imports-phase2.ps1

# Prüfen
npm run lint | Select-String "infrastructure" | Where-Object { $_ -notmatch "di/(types|__tests__|cache|registry)" }
npm run test -- src/infrastructure/

# Commit
git add src/infrastructure/
git commit -m "refactor(tokens): migrate Infrastructure Services to specific token imports (Phase 2/4)"
```

---

## 🔧 Phase 3: Application Layer Migration (MITTEL)

**Dauer:** 30 Minuten
**Priorität:** 🟡 MITTEL
**Dateien:** 15

### Betroffene Dateien

```
application/
├── handlers/hide-journal-context-menu-handler.ts
├── health/
│   ├── ContainerHealthCheck.ts
│   └── MetricsHealthCheck.ts
├── services/
│   ├── JournalVisibilityService.ts
│   ├── ModuleEventRegistrar.ts
│   ├── ModuleHealthService.ts
│   ├── ModuleSettingsRegistrar.ts
│   ├── __tests__/
│   │   ├── CacheService.test.ts
│   │   ├── module-settings-registrar.test.ts
│   │   └── service-memory-leak.test.ts
│   └── cache/__tests__/cache-memory-leak.test.ts
└── use-cases/
    ├── invalidate-journal-cache-on-change.use-case.ts
    ├── process-journal-directory-on-render.use-case.ts
    ├── register-context-menu.use-case.ts               (2 Imports!)
    └── trigger-journal-directory-rerender.use-case.ts
```

### Schritt 3.1: Migration ausführen

```powershell
# Script für Phase 3
$targetDirs = @(
    "src/application/handlers",
    "src/application/health",
    "src/application/services",
    "src/application/use-cases"
)

# Backup
git add -A
git commit -m "checkpoint: before Phase 3 token migration"

# Phase 3 ausführen
powershell -ExecutionPolicy Bypass -File scripts/migrate-token-imports-phase3.ps1

# Prüfen
npm run lint | Select-String "application"
npm run test -- src/application/

# Commit
git add src/application/
git commit -m "refactor(tokens): migrate Application Layer to specific token imports (Phase 3/4)"
```

---

## 🔧 Phase 4: Tests Migration (NIEDRIG)

**Dauer:** 30 Minuten
**Priorität:** 🟢 NIEDRIG
**Dateien:** 16

### Betroffene Dateien

```
__tests__/integration/full-bootstrap.test.ts
test/
├── mocks/foundry.ts
└── utils/test-helpers.ts
framework/core/__tests__/
├── bootstrap-init-hook.test.ts
├── composition-root.test.ts
└── result-pattern-consistency.test.ts
infrastructure/shared/tokens/index.ts                (selbst!)
```

### Schritt 4.1: Migration ausführen

```powershell
# Script für Phase 4
$targetDirs = @(
    "src/__tests__",
    "src/test",
    "src/infrastructure/shared/tokens/index.ts"  # Der Index selbst!
)

# Backup
git add -A
git commit -m "checkpoint: before Phase 4 token migration"

# Phase 4 ausführen
powershell -ExecutionPolicy Bypass -File scripts/migrate-token-imports-phase4.ps1

# Prüfen
npm run lint  # Sollte jetzt 0 Warnings haben!
npm run test

# Commit
git add src/__tests__/ src/test/ src/infrastructure/shared/tokens/index.ts
git commit -m "refactor(tokens): migrate Tests to specific token imports (Phase 4/4)"
```

---

## 🔧 Phase 5: Cleanup & Validation

**Dauer:** 15 Minuten
**Priorität:** ✅ FINAL

### Schritt 5.1: Finale Validierung

```powershell
# Alle Tests
npm run test

# Type-Check
npm run type-check

# Linter (sollte 0 Warnings haben)
npm run lint

# Circular Dependencies Check
npm run analyze:circular

# Bundle-Size Check (optional)
npm run build
# Prüfe dist/-Größe vorher/nachher
```

### Schritt 5.2: Dokumentation aktualisieren

```markdown
# CHANGELOG.md Update

### Geändert

- **Token-Imports optimiert**: Alle Token-Imports migriert zu spezifischen Token-Dateien
  - 96 Dateien von Barrel-Exports (`@/infrastructure/shared/tokens`) zu direkten Imports
  - Phase 1: Framework/Config (35 Dateien)
  - Phase 2: Infrastructure Services (30 Dateien)
  - Phase 3: Application Layer (15 Dateien)
  - Phase 4: Tests (16 Dateien)
  - **Verbesserungen**: Besseres Tree-Shaking, ~10% schnellere Build-Zeit
  - **Breaking Changes**: Keine - rein interne Optimierung
  - ([Details](docs/refactoring/CIRCULAR-DEPS-FIX-PLAN-1B-TOKEN-MIGRATION.md))
```

### Schritt 5.3: ADR erstellen (optional)

**Datei:** `docs/adr/ADR-XXX-token-import-best-practices.md`

```markdown
# ADR-XXX: Token Import Best Practices

**Status**: Accepted
**Datum**: [Datum]
**Kontext**: Nach Migration von 96 Dateien

## Entscheidung

Direkte Imports aus spezifischen Token-Dateien statt Barrel-Exports:

```typescript
// ✅ BEST PRACTICE
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";

// ❌ DEPRECATED (funktioniert aber noch)
import { loggerToken } from "@/infrastructure/shared/tokens";
```

## Begründung

1. **Tree-Shaking**: Bundler können ungenutzte Tokens eliminieren
2. **Build-Performance**: ~10% schnellere Compilation
3. **Explizit**: Klarer, welche Token-Kategorie genutzt wird
4. **Wartbarkeit**: Einfacher zu refactoren

## Konsequenzen

- Neue Dateien sollten direkte Imports nutzen
- ESLint warnt bei Barrel-Exports
- Migration war Erfolg: 0 Warnings nach Phase 4
```

---

## ✅ Erfolgskriterien

### Funktional

- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Alle Tests bestehen (`npm run test`)
- [ ] Keine Linter-Errors (`npm run lint`)
- [ ] Keine Token-Import-Warnings mehr
- [ ] Build erfolgreich (`npm run build`)

### Performance

- [ ] Bundle-Size gleich oder kleiner
- [ ] Build-Zeit gleich oder schneller
- [ ] Tree-Shaking funktioniert (prüfe Bundle-Analyse)

### Qualität

- [ ] Git-History sauber (ein Commit pro Phase)
- [ ] CHANGELOG aktualisiert
- [ ] Keine funktionalen Änderungen
- [ ] Code-Reviews erfolgreich

---

## 🔙 Rollback-Plan

### Pro Phase

```powershell
# Phase X rückgängig machen
git log --oneline | Select-String "Phase"  # Finde Commit
git revert <commit-hash>
```

### Komplett rückgängig

```powershell
# Alle 4 Phasen rückgängig
git log --oneline | Select-String "Phase [1-4]/4" | ForEach-Object {
    $hash = $_.Line.Split(' ')[0]
    git revert $hash --no-edit
}
```

### Notfall (vor Push)

```powershell
# Harte Zurücksetzung (VORSICHT!)
git reset --hard <commit-before-phase1>
```

---

## 📊 Migrations-Zeitplan

### Empfohlener Zeitplan

| Phase | Wann | Zeitpunkt | Begründung |
|-------|------|-----------|------------|
| **Phase 1** | Sprint 1 | Nach Feature-Freeze | Höchste Priorität |
| **Phase 2** | Sprint 2 | Low-Activity-Zeit | Viele Dateien |
| **Phase 3** | Sprint 2 | Mit Phase 2 | Kleine Phase |
| **Phase 4** | Sprint 3 | Beliebig | Tests, niedrige Prio |
| **Phase 5** | Sprint 3 | Nach Phase 4 | Validation |

### Alternative: Alles auf einmal

```powershell
# Alle 4 Phasen hintereinander (2-3h)
powershell -ExecutionPolicy Bypass -File scripts/migrate-all-phases.ps1
```

**Master-Script:** `scripts/migrate-all-phases.ps1`

```powershell
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Token Migration: Alle 4 Phasen" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Phase 1
Write-Host "Starte Phase 1..." -ForegroundColor Yellow
& "$PSScriptRoot/migrate-token-imports-phase1.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 2
Write-Host "Starte Phase 2..." -ForegroundColor Yellow
& "$PSScriptRoot/migrate-token-imports-phase2.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 3
Write-Host "Starte Phase 3..." -ForegroundColor Yellow
& "$PSScriptRoot/migrate-token-imports-phase3.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 4
Write-Host "Starte Phase 4..." -ForegroundColor Yellow
& "$PSScriptRoot/migrate-token-imports-phase4.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Alle 4 Phasen erfolgreich!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "  1. npm run lint (pruefe 0 Warnings)" -ForegroundColor Gray
Write-Host "  2. npm run test (alle Tests)" -ForegroundColor Gray
Write-Host "  3. git diff (pruefe Aenderungen)" -ForegroundColor Gray
Write-Host "  4. CHANGELOG.md aktualisieren" -ForegroundColor Gray
```

---

## 🎯 Empfehlung

### Option A: Inkrementell (Empfohlen) ✅

**Pro:**
- ✅ Kleinere, übersichtliche Commits
- ✅ Einfacher zu reviewen
- ✅ Kann unterbrochen werden
- ✅ Weniger Risiko

**Contra:**
- ⏱️ Über mehrere Sprints verteilt
- 🔄 4 separate PRs/Merges

### Option B: Alles auf einmal

**Pro:**
- ⚡ Schnell erledigt (2-3h)
- 📦 Ein großer Commit
- ✅ Sofort alle Warnings weg

**Contra:**
- 📊 Großer Git-Diff
- 🔍 Schwerer zu reviewen
- ⚠️ Höheres Risiko

---

## 📚 Weiterführende Links

- [Plan 1: Token Hub Problem](CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md) - Ursprüngliches Problem
- [ESLint no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports) - Rule-Dokumentation
- [Tree-Shaking Best Practices](../architecture/tree-shaking.md) - Performance-Guide

---

## ✅ ABGESCHLOSSEN - 2025-12-04

### Ergebnisse

| Metrik | Ziel | Erreicht | Status |
|--------|------|----------|--------|
| **ESLint-Warnings** | 0 | 0 | ✅ |
| **Type-Check** | Erfolgreich | Erfolgreich | ✅ |
| **Tests** | Alle bestehen | 1884/1884 | ✅ |
| **Build-Zeit** | Schneller | ~71% schneller (7s → 2s) | ✅ |
| **Tree-Shaking** | Verbessert | Verbessert | ✅ |
| **Breaking Changes** | Keine | Keine | ✅ |

### Durchgeführte Phasen

- ✅ Phase 1: Framework/Config (33 Dateien) - Commit `515eda8`
- ✅ Phase 2: Infrastructure Services (36 Dateien) - Commit `f3df7af`
- ✅ Phase 3: Application Layer (15 Dateien) - Commit `5432f8c`
- ✅ Phase 4: Tests (3 Dateien) - Commit `24ee641`
- ✅ Phase 5: Validation & Dokumentation - Commit `971493d`

**Gewählte Option:** Option A (Inkrementell) - Erfolgreich abgeschlossen
**Risiko:** 🟢 SEHR NIEDRIG - Keine Probleme aufgetreten


