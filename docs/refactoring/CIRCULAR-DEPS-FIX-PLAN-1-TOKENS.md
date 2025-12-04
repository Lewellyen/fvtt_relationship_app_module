# Umsetzungsplan: Token Hub-Problem beheben

**Problem-ID:** Circular Dependencies #1
**Betroffene Datei:** `src/infrastructure/shared/tokens/index.ts`
**Anzahl Zyklen:** 69 von 74 (93%)
**Schweregrad:** 🔴 KRITISCH
**Geschätzte Dauer:** 4-6 Stunden

---

## 📊 Problem-Analyse

### Aktueller Zustand

Die Datei `src/infrastructure/shared/tokens/index.ts` ist ein **"God File"** mit folgenden Problemen:

1. **Re-exportiert alle Token-Kategorien** (Zeilen 8-33)
   ```typescript
   export * from "./core.tokens";
   export * from "./observability.tokens";
   export * from "./i18n.tokens";
   // ... 8 weitere
   export * from "@/application/tokens"; // ← Importiert sogar aus anderen Layern!
   ```

2. **Definiert massive ServiceType Union** (Zeilen 36-181)
   - 180 Zeilen Code
   - Importiert ALLE Service-Typen aus dem gesamten Projekt
   - 70+ verschiedene Service-Interfaces

3. **Folge:** Jeder Import eines einzelnen Tokens lädt das GESAMTE Projekt
   ```typescript
   // Consumer will nur EINEN Token:
   import { loggerToken } from "@/infrastructure/shared/tokens";

   // Bekommt aber ALLE 70+ Service-Typen und deren Dependencies!
   // → 365 TypeScript-Dateien werden transitiv importiert
   ```

### Root Cause

**Service Location Anti-Pattern im Type-System:**
- `ServiceType` Union benötigt Kenntnis ALLER Services
- Jeder Service der Tokens nutzt, importiert `ServiceType` transitiv
- Services werden selbst in `ServiceType` aufgenommen
- **Resultat:** Zirkulärer Import-Graph

---

## 🎯 Ziel-Architektur

### Prinzipien

1. ✅ **Token-Dateien enthalten NUR Token-Definitionen** (keine Type-Unions)
2. ✅ **ServiceType wird ausgelagert** in dedizierte Datei
3. ✅ **Layer-Trennung respektieren** (Infrastructure importiert nicht Application)
4. ✅ **Tree-Shaking ermöglichen** (keine Barrel-Exports)

### Neue Struktur

```
src/
├── infrastructure/
│   ├── shared/
│   │   └── tokens/
│   │       ├── index.ts                    # ⚠️ DEPRECATED - Nur Re-Exports für Backward Compat
│   │       ├── core.tokens.ts              # ✅ Bleibt unverändert
│   │       ├── observability.tokens.ts     # ✅ Bleibt unverändert
│   │       ├── i18n.tokens.ts              # ✅ Bleibt unverändert
│   │       ├── notifications.tokens.ts     # ✅ Bleibt unverändert
│   │       ├── infrastructure.tokens.ts    # ✅ Bleibt unverändert
│   │       ├── foundry.tokens.ts           # ✅ Bleibt unverändert
│   │       ├── event.tokens.ts             # ✅ Bleibt unverändert
│   │       └── ports.tokens.ts             # ✅ Bleibt unverändert
│   │
│   └── di/
│       └── types/
│           └── service-type-registry.ts    # 🆕 NEU: ServiceType Union hier
│
└── application/
    └── tokens/
        ├── index.ts                         # ⚠️ DEPRECATED - Nur Re-Exports
        ├── application.tokens.ts            # ✅ Bleibt unverändert
        └── domain-ports.tokens.ts           # ✅ Bleibt unverändert
```

---

## 🔧 Umsetzungsschritte

### Phase 1: ServiceType auslagern (Breaking Change)

**Dauer:** 1 Stunde

#### Schritt 1.1: Neue Datei erstellen

**Datei:** `src/infrastructure/di/types/service-type-registry.ts`

```typescript
/**
 * Service Type Registry
 *
 * Zentrale Definition aller registrierten Service-Typen.
 * Diese Datei wird NUR vom DI-Container und internen DI-Utilities importiert.
 *
 * ⚠️ WICHTIG: Services sollten diese Datei NICHT direkt importieren!
 * Services importieren nur die spezifischen Token, die sie benötigen.
 *
 * Die ServiceType Union wird verwendet für:
 * - Container interne Type-Safety
 * - InstanceCache<ServiceType>
 * - ServiceRegistry<ServiceType>
 * - Runtime-Casts in runtime-safe-cast.ts
 */

// Import aller Service-Typen
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
// ... alle anderen Service-Typen ...

/**
 * Union type representing all registered service types in the application.
 *
 * @internal - Nur für DI-Container interne Nutzung
 */
export type ServiceType =
  | Logger
  | FoundryGame
  | FoundryHooks
  | FoundryDocument
  // ... alle anderen Typen ...
  | TranslationHandler[]
  | JournalContextMenuHandler[];
```

**Commit:** `refactor(di): extract ServiceType union to dedicated file`

#### Schritt 1.2: DI-Interna auf neue Datei umstellen

**Betroffene Dateien:**
- `src/infrastructure/di/types/utilities/runtime-safe-cast.ts`
- `src/infrastructure/di/cache/InstanceCache.ts`
- `src/infrastructure/di/registry/ServiceRegistry.ts`
- `src/infrastructure/di/registry/TypeSafeRegistrationMap.ts`
- `src/infrastructure/di/container.ts`

**Änderung:**
```typescript
// ALT:
import type { ServiceType } from "@/infrastructure/shared/tokens";

// NEU:
import type { ServiceType } from "../types/service-type-registry";
// bzw. relativer Pfad je nach Datei
```

**Script zum automatischen Ersetzen:**
```powershell
# In PowerShell ausführen
$files = @(
  "src/infrastructure/di/types/utilities/runtime-safe-cast.ts",
  "src/infrastructure/di/cache/InstanceCache.ts",
  "src/infrastructure/di/registry/ServiceRegistry.ts",
  "src/infrastructure/di/registry/TypeSafeRegistrationMap.ts",
  "src/infrastructure/di/container.ts"
)

foreach ($file in $files) {
  $content = Get-Content $file -Raw
  $content = $content -replace 'from "@/infrastructure/shared/tokens"', 'from "@/infrastructure/di/types/service-type-registry"'
  Set-Content -Path $file -Value $content -NoNewline
}
```

**Commit:** `refactor(di): use dedicated service-type-registry instead of tokens`

#### Schritt 1.3: tokens/index.ts bereinigen

**Datei:** `src/infrastructure/shared/tokens/index.ts`

```typescript
/**
 * Central token registry.
 *
 * ⚠️ DEPRECATED: Direct imports from specific token files are preferred for tree-shaking.
 * This file is kept for backward compatibility only.
 *
 * @deprecated Import tokens from specific files instead:
 * @example
 * ```typescript
 * // ❌ OLD (imports everything):
 * import { loggerToken } from "@/infrastructure/shared/tokens";
 *
 * // ✅ NEW (tree-shakeable):
 * import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
 * ```
 */

// Core tokens
export * from "./core.tokens";

// Observability tokens
export * from "./observability.tokens";

// I18n tokens
export * from "./i18n.tokens";

// Notification tokens
export * from "./notifications.tokens";

// Infrastructure tokens
export * from "./infrastructure.tokens";

// Foundry tokens
export * from "./foundry.tokens";

// Event tokens
export * from "./event.tokens";

// Port tokens
export * from "./ports.tokens";

// Re-export Application tokens for backward compatibility
// Application layer tokens should be imported from "@/application/tokens" going forward
export * from "@/application/tokens";

// ⚠️ ServiceType wurde nach @/infrastructure/di/types/service-type-registry ausgelagert
// Services sollten ServiceType nicht direkt importieren - nur DI-Container nutzt es.
```

**Commit:** `refactor(tokens): remove ServiceType union from tokens/index.ts`

**Testen:**
```powershell
npm run type-check
npm run analyze:circular
```

---

### Phase 2: Imports schrittweise migrieren (Non-Breaking)

**Dauer:** 2-3 Stunden

#### Schritt 2.1: Migration-Script erstellen

**Datei:** `scripts/migrate-token-imports.ps1`

```powershell
<#
.SYNOPSIS
Migriert Token-Imports von Barrel-Export zu spezifischen Token-Dateien

.DESCRIPTION
Analysiert alle TypeScript-Dateien und ersetzt:
- "@/infrastructure/shared/tokens" → spezifische Token-Datei
- "@/application/tokens" → spezifische Token-Datei

Dabei wird automatisch erkannt, welche Tokens importiert werden und
die entsprechende Source-Datei ermittelt.
#>

# Token-zu-Datei Mapping
$tokenMapping = @{
    # Core tokens
    'loggerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'environmentConfigToken' = '@/infrastructure/shared/tokens/core.tokens'
    'serviceContainerToken' = '@/infrastructure/shared/tokens/core.tokens'
    'containerToken' = '@/infrastructure/shared/tokens/core.tokens'

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
    'localI18nServiceToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'foundryI18nPortToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'translationHandlerToken' = '@/infrastructure/shared/tokens/i18n.tokens'
    'platformI18nPortToken' = '@/infrastructure/shared/tokens/i18n.tokens'

    # Notification tokens
    'notificationServiceToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationChannelToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'platformNotificationPortToken' = '@/infrastructure/shared/tokens/notifications.tokens'
    'notificationPortToken' = '@/infrastructure/shared/tokens/notifications.tokens'

    # Infrastructure tokens
    'cacheServiceToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'cacheServiceConfigToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
    'platformCachePortToken' = '@/infrastructure/shared/tokens/infrastructure.tokens'
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

    # Event tokens
    'platformJournalEventPortToken' = '@/infrastructure/shared/tokens/event.tokens'
    'moduleEventRegistrarToken' = '@/infrastructure/shared/tokens/event.tokens'

    # Port tokens (Domain ports)
    'platformUIPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'platformSettingsPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalDirectoryUiPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalCollectionPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'journalRepositoryToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'bootstrapHooksPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'settingsRegistrationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'contextMenuRegistrationPortToken' = '@/infrastructure/shared/tokens/ports.tokens'
    'containerPortToken' = '@/infrastructure/shared/tokens/ports.tokens'

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

Write-Host "🔍 Analysiere TypeScript-Dateien..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -Exclude "*.spec.ts"
$migratedCount = 0
$errorCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false

    # Finde alle Imports von tokens
    $importPattern = 'import\s+\{([^}]+)\}\s+from\s+[''"]@/(infrastructure/shared/tokens|application/tokens)[''"];?'
    $matches = [regex]::Matches($content, $importPattern)

    if ($matches.Count -eq 0) {
        continue
    }

    Write-Host "📝 $($file.Name)" -ForegroundColor Yellow

    foreach ($match in $matches) {
        $fullMatch = $match.Groups[0].Value
        $importedTokens = $match.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }

        # Gruppiere Tokens nach Ziel-Datei
        $tokensByFile = @{}

        foreach ($token in $importedTokens) {
            if ($tokenMapping.ContainsKey($token)) {
                $targetFile = $tokenMapping[$token]
                if (-not $tokensByFile.ContainsKey($targetFile)) {
                    $tokensByFile[$targetFile] = @()
                }
                $tokensByFile[$targetFile] += $token
            } else {
                Write-Host "   ⚠️  Unbekannter Token: $token" -ForegroundColor Red
                $errorCount++
            }
        }

        # Erstelle neue Import-Statements
        $newImports = @()
        foreach ($targetFile in $tokensByFile.Keys) {
            $tokens = $tokensByFile[$targetFile] -join ", "
            $newImports += "import { $tokens } from `"$targetFile`";"
        }

        if ($newImports.Count -gt 0) {
            $replacement = $newImports -join "`n"
            $content = $content.Replace($fullMatch, $replacement)
            $changed = $true
            Write-Host "   ✅ Migriert: $($tokensByFile.Keys.Count) Ziel-Dateien" -ForegroundColor Green
        }
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $migratedCount++
    }
}

Write-Host "`n📊 Zusammenfassung:" -ForegroundColor Cyan
Write-Host "   Migrierte Dateien: $migratedCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "   Fehler/Warnungen: $errorCount" -ForegroundColor Red
}

Write-Host "`n🔍 Führe Type-Check aus..." -ForegroundColor Cyan
npm run type-check

Write-Host "`n✅ Migration abgeschlossen!" -ForegroundColor Green
Write-Host "   Bitte prüfe die Änderungen mit: git diff" -ForegroundColor Gray
```

**Commit:** `chore: add token import migration script`

#### Schritt 2.2: Migration ausführen

```powershell
# Backup erstellen
git add -A
git commit -m "chore: checkpoint before token migration"

# Migration ausführen
powershell -ExecutionPolicy Bypass -File scripts/migrate-token-imports.ps1

# Prüfen
npm run type-check
npm run lint
npm run analyze:circular

# Testen
npm run test
```

**Commit:** `refactor: migrate token imports to specific token files`

---

### Phase 3: Deprecation Warnings & Documentation

**Dauer:** 30 Minuten

#### Schritt 3.1: ESLint-Regel hinzufügen

**Datei:** `eslint.config.mjs`

```javascript
export default [
  // ... existing config
  {
    rules: {
      // Warnung bei Import von deprecated barrel exports
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/infrastructure/shared/tokens',
              message:
                'Please import tokens from specific files (e.g., @/infrastructure/shared/tokens/core.tokens) for better tree-shaking.',
            },
            {
              name: '@/infrastructure/shared/tokens/index',
              message:
                'Please import tokens from specific files (e.g., @/infrastructure/shared/tokens/core.tokens) for better tree-shaking.',
            },
            {
              name: '@/application/tokens',
              message:
                'Please import tokens from specific files (e.g., @/application/tokens/application.tokens) for better tree-shaking.',
            },
            {
              name: '@/application/tokens/index',
              message:
                'Please import tokens from specific files (e.g., @/application/tokens/application.tokens) for better tree-shaking.',
            },
          ],
        },
      ],
    },
  },
];
```

**Commit:** `chore(eslint): add deprecation warning for barrel token imports`

#### Schritt 3.2: CHANGELOG aktualisieren

**Datei:** `CHANGELOG.md`

```markdown
## [Unreleased]

### Geändert

- **Dependency Management**: Token-Imports umstrukturiert für besseres Tree-Shaking
  - `ServiceType` Union in dedizierte Datei ausgelagert: `@/infrastructure/di/types/service-type-registry`
  - Barrel-Exports in `@/infrastructure/shared/tokens/index.ts` als deprecated markiert
  - Empfohlen: Direkte Imports aus spezifischen Token-Dateien
  - **Migration**: Alte Imports funktionieren weiter (Backward Compatible), aber ESLint zeigt Warnings
  - ([Details](docs/refactoring/CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md))

### Upgrade-Hinweise

- **Für Entwickler**:
  - Alte Token-Imports (z.B. `from "@/infrastructure/shared/tokens"`) funktionieren weiter
  - ESLint zeigt Warnings → Migration empfohlen aber nicht verpflichtend
  - Migration-Script verfügbar: `scripts/migrate-token-imports.ps1`
  - Vorteile nach Migration: Besseres Tree-Shaking, schnellere Build-Zeiten, keine zirkulären Deps
```

---

## ✅ Erfolgskriterien

### Funktional

- [ ] Alle Tests laufen durch (`npm run test`)
- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Keine neuen Linter-Fehler (`npm run lint`)
- [ ] Build erfolgreich (`npm run build`)

### Architektur

- [ ] Zirkuläre Abhängigkeiten reduziert von 74 → <10 (`npm run analyze:circular`)
- [ ] `tokens/index.ts` enthält keine `ServiceType` Union mehr
- [ ] `ServiceType` nur noch in `service-type-registry.ts`
- [ ] DI-interne Dateien importieren von `service-type-registry.ts`
- [ ] Services importieren Token von spezifischen Dateien

### Performance

- [ ] Bundle-Größe kleiner oder gleich (Tree-Shaking Effekt)
- [ ] TypeScript Compilation-Zeit reduziert (weniger transitive Imports)

---

## 🔙 Rollback-Plan

### Wenn Phase 1 fehlschlägt:

```powershell
git revert HEAD
git revert HEAD~1
git revert HEAD~2
```

### Wenn Phase 2 fehlschlägt:

```powershell
# Migration-Script rückgängig
git checkout src/**/*.ts
```

### Wenn Produktion betroffen:

1. ❌ **NICHT nötig** - Keine Breaking Changes, alle Imports bleiben kompatibel
2. ✅ Deprecation Warnings deaktivieren: ESLint-Regel entfernen

---

## 📚 Weiterführende Links

- [ADR: Token Organization](../adr/ADR-XXX-token-organization.md)
- [ServiceType Union Pattern](../architecture/service-type-pattern.md)
- [Tree-Shaking Best Practices](../architecture/tree-shaking.md)

---

**Status:** 🟡 BEREIT ZUR UMSETZUNG
**Priorität:** 🔴 HOCH (93% aller Circular Dependencies)
**Risiko:** 🟢 NIEDRIG (Backward Compatible)

