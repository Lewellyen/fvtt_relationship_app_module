# Projektstruktur-Migration: Option B mit Foundry-Vorgaben

## Übersicht

Migration der `/src` Struktur nach Clean Architecture (Option B) unter Beibehaltung der Foundry-spezifischen Root-Ordner (`templates/`, `styles/`, `assets/`, `lang/`).

## Phase 1: Vorbereitung

### 1.1 Backup & Validierung

- Git Commit mit aktuellem Stand erstellen
- Alle Tests laufen lassen (`npm test`)
- Type-Check durchführen (`npm run type-check`)
- Build testen (`npm run build`)

### 1.2 Dependency-Analyse

- Alle Import-Pfade mit `@/` scannen
- Mapping-Tabelle erstellen: Alter Pfad → Neuer Pfad
- Zirkuläre Abhängigkeiten prüfen

## Phase 2: Domain Layer erstellen

### 2.1 Domain Entities

```
src/core/domain/journal-entry.ts
  → src/domain/entities/journal-entry.ts
```

### 2.2 Domain Ports

```
src/core/ports/journal-visibility-port.interface.ts
  → src/domain/ports/journal-visibility-port.interface.ts
```

### 2.3 Domain Types

```
src/types/result.ts
  → src/domain/types/result.ts
```

**Import-Anpassungen:**

- Alle Imports von `@/types/result` → `@/domain/types/result`
- Alle Imports von `@/core/domain/journal-entry` → `@/domain/entities/journal-entry`
- Alle Imports von `@/core/ports/journal-visibility-port.interface` → `@/domain/ports/journal-visibility-port.interface`

## Phase 3: Application Layer erstellen

### 3.1 Application Services

```
src/services/JournalVisibilityService.ts
  → src/application/services/JournalVisibilityService.ts

src/core/module-hook-registrar.ts
  → src/application/services/ModuleHookRegistrar.ts

src/core/module-settings-registrar.ts
  → src/application/services/ModuleSettingsRegistrar.ts

src/core/module-health-service.ts
  → src/application/services/ModuleHealthService.ts

src/core/runtime-config/runtime-config.service.ts
  → src/application/services/RuntimeConfigService.ts

src/core/runtime-config/runtime-config-factory.ts
  → src/application/services/runtime-config-factory.ts
```

### 3.2 Use Cases

```
src/core/hooks/render-journal-directory-hook.ts
  → src/application/use-cases/render-journal-directory-hook.ts

src/core/hooks/journal-cache-invalidation-hook.ts
  → src/application/use-cases/journal-cache-invalidation-hook.ts

src/core/hooks/hook-registrar.interface.ts
  → src/application/use-cases/hook-registrar.interface.ts

src/core/hooks/hook-registration-manager.ts
  → src/application/use-cases/hook-registration-manager.ts
```

### 3.3 Settings

```
src/core/settings/*.ts (10 Dateien)
  → src/application/settings/*.ts
```

### 3.4 Health

```
src/core/health/health-check.interface.ts
  → src/application/health/health-check.interface.ts

src/core/health/container-health-check.ts
  → src/application/health/ContainerHealthCheck.ts

src/core/health/metrics-health-check.ts
  → src/application/health/MetricsHealthCheck.ts

src/core/health/health-check-registry.ts
  → src/application/health/HealthCheckRegistry.ts
```

**Import-Anpassungen:**

- Alle Imports von `@/services/JournalVisibilityService` → `@/application/services/JournalVisibilityService`
- Alle Imports von `@/core/module-*` → `@/application/services/Module*`
- Alle Imports von `@/core/hooks/*` → `@/application/use-cases/*`
- Alle Imports von `@/core/settings/*` → `@/application/settings/*`
- Alle Imports von `@/core/health/*` → `@/application/health/*`

## Phase 4: Infrastructure Layer - Foundry Adapters

### 4.1 Domain Adapters

```
src/foundry/adapters/foundry-journal-visibility-adapter.ts
  → src/infrastructure/adapters/foundry/domain-adapters/journal-visibility-adapter.ts
```

### 4.2 Facades

```
src/foundry/facades/foundry-journal-facade.interface.ts
  → src/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface.ts

src/foundry/facades/foundry-journal-facade.ts
  → src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts
```

### 4.3 Foundry Services

```
src/foundry/services/*.ts (17 Dateien)
  → src/infrastructure/adapters/foundry/services/*.ts
```

### 4.4 Foundry Ports

```
src/foundry/ports/v13/*.ts (6 Dateien)
  → src/infrastructure/adapters/foundry/ports/v13/*.ts
```

### 4.5 Foundry Interfaces

```
src/foundry/interfaces/*.ts (6 Dateien)
  → src/infrastructure/adapters/foundry/interfaces/*.ts
```

### 4.6 Foundry Versioning

```
src/foundry/versioning/*.ts (5 Dateien)
  → src/infrastructure/adapters/foundry/versioning/*.ts
```

### 4.7 Foundry Errors & Validation

```
src/foundry/errors/FoundryErrors.ts
  → src/infrastructure/adapters/foundry/errors/FoundryErrors.ts

src/foundry/validation/*.ts (3 Dateien)
  → src/infrastructure/adapters/foundry/validation/*.ts
```

### 4.8 Foundry Types & Utilities

```
src/foundry/types.ts
  → src/infrastructure/adapters/foundry/types.ts

src/foundry/runtime-casts.ts
  → src/infrastructure/adapters/foundry/runtime-casts.ts

src/foundry/foundrytokens.ts
  → src/infrastructure/adapters/foundry/foundrytokens.ts
```

**Import-Anpassungen:**

- Alle Imports von `@/foundry/*` → `@/infrastructure/adapters/foundry/*`

## Phase 5: Infrastructure Layer - DI

### 5.1 DI Container & Komponenten

```
src/di_infrastructure/container.ts
  → src/infrastructure/di/container.ts

src/di_infrastructure/container/*.ts
  → src/infrastructure/di/container/*.ts

src/di_infrastructure/registry/*.ts
  → src/infrastructure/di/registry/*.ts

src/di_infrastructure/resolution/*.ts
  → src/infrastructure/di/resolution/*.ts

src/di_infrastructure/scope/*.ts
  → src/infrastructure/di/scope/*.ts

src/di_infrastructure/cache/InstanceCache.ts
  → src/infrastructure/di/cache/InstanceCache.ts

src/di_infrastructure/validation/*.ts
  → src/infrastructure/di/validation/*.ts

src/di_infrastructure/errors/ContainerErrors.ts
  → src/infrastructure/di/errors/ContainerErrors.ts

src/di_infrastructure/tokenutilities.ts
  → src/infrastructure/di/tokenutilities.ts
```

### 5.2 DI Interfaces zusammenführen

```
src/di_infrastructure/interfaces/container.ts
src/di_infrastructure/interfaces/containererror.ts
src/di_infrastructure/interfaces/disposable.ts
  → src/infrastructure/di/interfaces.ts (alle 3 zusammen)
```

**Inhalt von `interfaces.ts`:**

```typescript
// Container Interface
export interface Container { ... }

// ContainerError Interface  
export interface ContainerError { ... }

// Disposable Interfaces
export interface Disposable { ... }
export interface AsyncDisposable { ... }
```

### 5.3 DI Types gruppieren

```
src/di_infrastructure/types/injectiontoken.ts
src/di_infrastructure/types/servicelifecycle.ts
src/di_infrastructure/types/serviceregistration.ts
  → src/infrastructure/di/types/core/*.ts

src/di_infrastructure/types/containererrorcode.ts
src/di_infrastructure/types/containervalidationstate.ts
  → src/infrastructure/di/types/errors/*.ts

src/di_infrastructure/types/servicefactory.ts
src/di_infrastructure/types/serviceclass.ts
src/di_infrastructure/types/servicedependencies.ts
  → src/infrastructure/di/types/resolution/*.ts

src/di_infrastructure/types/api-safe-token.ts
src/di_infrastructure/types/deprecated-token.ts
src/di_infrastructure/types/runtime-safe-cast.ts
  → src/infrastructure/di/types/utilities/*.ts
```

**Erstellen:**

- `src/infrastructure/di/types/index.ts` - Re-exportiert alle Types

**Import-Anpassungen:**

- Alle Imports von `@/di_infrastructure/*` → `@/infrastructure/di/*`
- Alle Imports von `@/di_infrastructure/types/*` → `@/infrastructure/di/types/*` (oder via index.ts)

## Phase 6: Infrastructure Layer - Services

### 6.1 Cache

```
src/services/CacheService.ts
  → src/infrastructure/cache/CacheService.ts

src/services/cache/*.ts
  → src/infrastructure/cache/*.ts

src/interfaces/cache.ts
  → src/infrastructure/cache/cache.interface.ts
```

### 6.2 Notifications

```
src/notifications/*.ts (7 Dateien)
  → src/infrastructure/notifications/*.ts
```

### 6.3 Observability

```
src/observability/*.ts (17 Dateien)
  → src/infrastructure/observability/*.ts

src/interfaces/performance-tracker.ts
  → src/infrastructure/observability/performance-tracker.interface.ts
```

### 6.4 I18n

```
src/services/I18nFacadeService.ts
  → src/infrastructure/i18n/I18nFacadeService.ts

src/services/LocalI18nService.ts
  → src/infrastructure/i18n/LocalI18nService.ts

src/services/i18n/*.ts (11 Dateien)
  → src/infrastructure/i18n/*.ts
```

### 6.5 Logging

```
src/services/consolelogger.ts
  → src/infrastructure/logging/ConsoleLoggerService.ts

src/services/bootstrap-logger.ts
  → src/infrastructure/logging/BootstrapLogger.ts

src/interfaces/logger.ts
  → src/infrastructure/logging/logger.interface.ts
```

### 6.6 Retry

```
src/services/RetryService.ts
  → src/infrastructure/retry/RetryService.ts

src/services/retry/*.ts
  → src/infrastructure/retry/*.ts
```

### 6.7 Performance

```
src/services/PerformanceTrackingService.ts
  → src/infrastructure/performance/PerformanceTrackingService.ts
```

**Import-Anpassungen:**

- Alle Imports von `@/services/*` → `@/infrastructure/*` (je nach Service)
- Alle Imports von `@/interfaces/*` → `@/infrastructure/*/...interface.ts`
- Alle Imports von `@/notifications/*` → `@/infrastructure/notifications/*`
- Alle Imports von `@/observability/*` → `@/infrastructure/observability/*`

## Phase 7: Infrastructure Layer - Shared

### 7.1 Tokens aufteilen

```
src/tokens/tokenindex.ts
  → src/infrastructure/shared/tokens/core.tokens.ts (12 Tokens)
  → src/infrastructure/shared/tokens/observability.tokens.ts (7 Tokens)
  → src/infrastructure/shared/tokens/i18n.tokens.ts (7 Tokens)
  → src/infrastructure/shared/tokens/notifications.tokens.ts (3 Tokens)
  → src/infrastructure/shared/tokens/infrastructure.tokens.ts (6 Tokens)

src/infrastructure/adapters/foundry/foundrytokens.ts
  → src/infrastructure/shared/tokens/foundry.tokens.ts
```

**Token-Kategorien:**

- **core.tokens.ts**: loggerToken, journalVisibilityServiceToken, journalVisibilityPortToken, moduleHealthServiceToken, healthCheckRegistryToken, containerHealthCheckToken, metricsHealthCheckToken, moduleSettingsRegistrarToken, moduleHookRegistrarToken, moduleApiInitializerToken, renderJournalDirectoryHookToken, journalCacheInvalidationHookToken
- **observability.tokens.ts**: metricsCollectorToken, metricsRecorderToken, metricsSamplerToken, metricsStorageToken, traceContextToken, observabilityRegistryToken, performanceTrackingServiceToken
- **i18n.tokens.ts**: foundryI18nToken, localI18nToken, i18nFacadeToken, foundryTranslationHandlerToken, localTranslationHandlerToken, fallbackTranslationHandlerToken, translationHandlerChainToken
- **notifications.tokens.ts**: notificationCenterToken, consoleChannelToken, uiChannelToken
- **infrastructure.tokens.ts**: cacheServiceToken, cacheServiceConfigToken, retryServiceToken, environmentConfigToken, runtimeConfigToken, serviceContainerToken, portSelectionEventEmitterToken
- **foundry.tokens.ts**: Alle Foundry-Tokens (aus foundrytokens.ts)

### 7.2 Tokens Index erstellen

**Erstellen:** `src/infrastructure/shared/tokens/index.ts`

```typescript
// Re-export alle Token-Kategorien
export * from './core.tokens';
export * from './observability.tokens';
export * from './i18n.tokens';
export * from './notifications.tokens';
export * from './infrastructure.tokens';
export * from './foundry.tokens';

// ServiceType Union (aus servicetypeindex.ts integrieren)
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
// ... alle Service Types importieren

export type ServiceType =
  | Logger
  | FoundryGame
  | FoundryHooks
  // ... alle Service Types
  | ServiceContainer;
```

### 7.3 ServiceTypeIndex integrieren

```
src/types/servicetypeindex.ts
  → Inhalt nach src/infrastructure/shared/tokens/index.ts integrieren
  → Datei löschen
```

### 7.4 Shared Utilities & Constants

```
src/utils/*.ts (16 Dateien)
  → src/infrastructure/shared/utils/*.ts

src/constants.ts
  → src/infrastructure/shared/constants.ts

src/polyfills/cytoscape-assign-fix.ts
  → src/infrastructure/shared/polyfills/cytoscape-assign-fix.ts
```

**Import-Anpassungen:**

- Alle Imports von `@/tokens/tokenindex` → `@/infrastructure/shared/tokens`
- Alle Imports von `@/types/servicetypeindex` → `@/infrastructure/shared/tokens` (ServiceType)
- Alle Imports von `@/utils/*` → `@/infrastructure/shared/utils/*`
- Alle Imports von `@/constants` → `@/infrastructure/shared/constants`
- Alle Imports von `@/polyfills/*` → `@/infrastructure/shared/polyfills/*`

## Phase 8: Framework Layer

### 8.1 Framework Entry & Bootstrap

```
src/index.ts
  → src/framework/index.ts

src/core/init-solid.ts
  → src/framework/init-solid.ts

src/core/composition-root.ts
  → src/framework/composition-root.ts

src/core/bootstrap-error-handler.ts
  → src/framework/bootstrap-error-handler.ts
```

### 8.2 Framework API

```
src/core/api/*.ts (5 Dateien)
  → src/framework/api/*.ts
```

### 8.3 Framework Config

```
src/config/dependencyconfig.ts
  → src/framework/config/dependencyconfig.ts

src/config/environment.ts
  → src/framework/config/environment.ts

src/config/modules/*.config.ts (9 Dateien)
  → src/framework/config/modules/*.config.ts
```

### 8.4 Framework Types

```
src/custom.d.ts
  → src/framework/types/custom.d.ts

src/global.d.ts
  → src/framework/types/global.d.ts

src/vite-env.d.ts
  → src/framework/types/vite-env.d.ts
```

### 8.5 Framework UI (Svelte)

```
src/svelte/*.svelte (2 Dateien)
  → src/framework/ui/svelte/*.svelte
```

**Import-Anpassungen:**

- Alle Imports von `@/core/init-solid` → `@/framework/init-solid`
- Alle Imports von `@/core/composition-root` → `@/framework/composition-root`
- Alle Imports von `@/core/api/*` → `@/framework/api/*`
- Alle Imports von `@/config/*` → `@/framework/config/*`
- Alle Imports von `@/svelte/*` → `@/framework/ui/svelte/*`

## Phase 9: Test-Dateien anpassen

### 9.1 Test-Imports aktualisieren

- Alle `__tests__/` Verzeichnisse bleiben bei ihren Quell-Dateien
- Alle Test-Imports entsprechend anpassen
- `src/test/*.ts` (Mocks, Setup) → `src/framework/test/*.ts`

## Phase 10: Konfigurationsdateien anpassen

### 10.1 tsconfig.json

- `paths` bleibt: `"@/*": ["src/*"]` (keine Änderung nötig)
- `include` bleibt unverändert

### 10.2 vite.config.ts

- `resolve.alias["@"]` bleibt: `resolve(__dirname, "src")` (keine Änderung nötig)

### 10.3 src/index.ts (framework/index.ts)

- Import-Pfad für CSS anpassen: `"../styles/tailwind.css"` bleibt (relativer Pfad)
- Polyfill-Import: `@/polyfills/cytoscape-assign-fix` → `@/infrastructure/shared/polyfills/cytoscape-assign-fix`

## Phase 11: Validierung & Tests

### 11.1 Type-Check

```bash
npm run type-check
```

- Alle TypeScript-Fehler beheben

### 11.2 Linter

```bash
npm run lint
```

- Alle Linter-Fehler beheben

### 11.3 Tests

```bash
npm test
```

- Alle Tests müssen weiterhin laufen

### 11.4 Build

```bash
npm run build
```

- Build muss erfolgreich sein
- `dist/fvtt_relationship_app_module.js` muss generiert werden

### 11.5 Import-Validierung

- Alle `@/` Imports scannen und prüfen
- Keine verwaisten Imports
- Keine zirkulären Abhängigkeiten

## Phase 12: Aufräumen

### 12.1 Leere Verzeichnisse löschen

- Alle leeren Verzeichnisse nach Migration entfernen

### 12.2 Git Commit

```bash
git add .
git commit -m "refactor: Umstrukturierung nach Clean Architecture (Option B)"
```

## Wichtige Hinweise

1. **Foundry-Root-Ordner bleiben unverändert:**

   - `templates/` - HBS/HTML Templates
   - `styles/` - CSS-Dateien
   - `assets/` - Bilder, Videos, Fonts
   - `lang/` - i18n-Dateien

2. **Import-Pfade:**

   - Alle `@/` Imports funktionieren weiterhin (tsconfig.json paths bleibt gleich)
   - Nur die Pfade innerhalb von `src/` ändern sich

3. **Reihenfolge:**

   - Phasen nacheinander durchführen
   - Nach jeder Phase: Type-Check & Tests
   - Bei Fehlern: Stoppen und beheben

4. **Backup:**

   - Vor Migration: Git Commit erstellen
   - Bei Problemen: `git reset --hard` möglich

## Erwartete Ergebnisse

- Klare Schichtentrennung: Domain → Application → Infrastructure → Framework
- Übersichtliche Token-Struktur (6 Dateien statt 1)
- Konsolidierte DI-Interfaces (1 Datei statt 3)
- Gruppierte DI-Types (4 Kategorien)
- Alle Tests laufen weiterhin
- Build funktioniert
- Foundry-Vorgaben eingehalten

strukturplan:
src/
├── domain/
│   ├── entities/
│   │   └── journal-entry.ts
│   ├── ports/
│   │   └── journal-visibility-port.interface.ts
│   └── types/
│       └── result.ts
│
├── application/
│   ├── services/
│   │   ├── JournalVisibilityService.ts
│   │   ├── ModuleHookRegistrar.ts
│   │   ├── ModuleSettingsRegistrar.ts
│   │   ├── ModuleHealthService.ts
│   │   └── RuntimeConfigService.ts
│   ├── use-cases/
│   │   ├── render-journal-directory-hook.ts
│   │   ├── journal-cache-invalidation-hook.ts
│   │   ├── hook-registrar.interface.ts
│   │   └── hook-registration-manager.ts
│   ├── settings/
│   │   ├── setting-definition.interface.ts
│   │   ├── cache-default-ttl-setting.ts
│   │   ├── cache-enabled-setting.ts
│   │   ├── cache-max-entries-setting.ts
│   │   ├── log-level-setting.ts
│   │   ├── metrics-persistence-enabled-setting.ts
│   │   ├── metrics-persistence-key-setting.ts
│   │   ├── performance-sampling-setting.ts
│   │   └── performance-tracking-setting.ts
│   └── health/
│       ├── health-check.interface.ts
│       ├── ContainerHealthCheck.ts
│       ├── MetricsHealthCheck.ts
│       └── HealthCheckRegistry.ts
│
├── infrastructure/
│   ├── adapters/
│   │   └── foundry/
│   │       ├── domain-adapters/
│   │       ├── facades/
│   │       ├── services/
│   │       ├── ports/
│   │       │   └── v13/
│   │       ├── interfaces/
│   │       ├── versioning/
│   │       ├── errors/
│   │       ├── validation/
│   │       ├── types.ts
│   │       ├── runtime-casts.ts
│   │       └── foundrytokens.ts
│   │
│   ├── di/
│   │   ├── container.ts
│   │   ├── container/
│   │   ├── registry/
│   │   ├── resolution/
│   │   ├── scope/
│   │   ├── cache/
│   │   ├── validation/
│   │   ├── errors/
│   │   ├── interfaces.ts                    ⭐ Alle DI Interfaces
│   │   ├── tokenutilities.ts
│   │   └── types/
│   │       ├── index.ts
│   │       ├── core/
│   │       ├── errors/
│   │       ├── resolution/
│   │       └── utilities/
│   │
│   ├── cache/
│   │   ├── CacheService.ts
│   │   ├── cache.interface.ts
│   │   └── (Cache-Implementierungen)
│   │
│   ├── notifications/
│   │   ├── NotificationCenter.ts
│   │   ├── notification-channel.interface.ts
│   │   └── channels/
│   │
│   ├── observability/
│   │   ├── MetricsCollector.ts
│   │   ├── ObservabilityRegistry.ts
│   │   ├── PerformanceTrackerImpl.ts
│   │   ├── BootstrapPerformanceTracker.ts
│   │   ├── performance-tracker.interface.ts
│   │   ├── interfaces/
│   │   ├── metrics-persistence/
│   │   └── trace/
│   │
│   ├── i18n/
│   │   ├── I18nFacadeService.ts
│   │   ├── LocalI18nService.ts
│   │   └── (I18n Handler & Chain)
│   │
│   ├── logging/
│   │   ├── ConsoleLoggerService.ts
│   │   ├── BootstrapLogger.ts
│   │   └── logger.interface.ts
│   │
│   ├── retry/
│   │   ├── RetryService.ts
│   │   └── (Retry-Implementierungen)
│   │
│   ├── performance/
│   │   └── PerformanceTrackingService.ts
│   │
│   └── shared/
│       ├── tokens/
│       │   ├── index.ts                    ⭐ Re-export + ServiceType
│       │   ├── core.tokens.ts
│       │   ├── observability.tokens.ts
│       │   ├── i18n.tokens.ts
│       │   ├── notifications.tokens.ts
│       │   ├── infrastructure.tokens.ts
│       │   └── foundry.tokens.ts
│       ├── types/
│       │   └── ServiceTypeIndex.ts         ⭐ (optional, wenn nicht in tokens/index.ts)
│       ├── utils/
│       │   ├── async/
│       │   ├── events/
│       │   ├── functional/
│       │   ├── hooks/
│       │   ├── observability/
│       │   ├── security/
│       │   ├── settings/
│       │   └── string/
│       ├── constants.ts
│       └── polyfills/
│           └── cytoscape-assign-fix.ts
│
└── framework/
    ├── index.ts                            ✅ Foundry Entry Point
    ├── init-solid.ts
    ├── composition-root.ts
    ├── bootstrap-error-handler.ts
    ├── api/
    │   ├── module-api-initializer.ts
    │   ├── module-api.ts
    │   ├── api-token-config.ts
    │   ├── public-api-wrappers.ts
    │   └── readonly-wrapper.ts
    ├── config/
    │   ├── dependencyconfig.ts
    │   ├── environment.ts
    │   └── modules/
    │       ├── cache-services.config.ts
    │       ├── core-services.config.ts
    │       ├── foundry-services.config.ts
    │       ├── i18n-services.config.ts
    │       ├── notifications.config.ts
    │       ├── observability.config.ts
    │       ├── port-infrastructure.config.ts
    │       ├── registrars.config.ts
    │       └── utility-services.config.ts
    └── types/
        ├── custom.d.ts
        ├── global.d.ts
        └── vite-env.d.ts

Wichtige Hinweise zu Foundry-Vorgaben
1. Templates (templates/)
HBS/HTML-Templates gehören in templates/ im Root
Nicht in /src
Beispiel: templates/journal-entry.hbs
2. Styles (styles/)
CSS-Dateien gehören in styles/ im Root
Nicht in /src
Beispiel: styles/tailwind.css
In module.json referenzieren, falls nötig
3. Assets (assets/)
Bilder, Videos, Schriften in assets/ im Root
Nicht in /src
Beispiel: assets/images/logo.png, assets/fonts/custom.woff2
4. i18n (lang/)
Übersetzungsdateien in lang/ im Root
Format: lang/{lang}.json (z.B. lang/de.json)
In module.json unter languages referenzieren
Code in /src liest diese Dateien (z.B. LocalI18nService)
5. Code (src/)
TypeScript/JavaScript-Code in /src
Build-Output in /dist
Entry Point: src/framework/index.ts
Anpassungen für Svelte-Komponenten
Aktuell: src/svelte/*.svelte
Optionen:
In src/framework/ui/svelte/ belassen (Code bleibt in /src)
Oder: Svelte-Komponenten, die Templates generieren, könnten in templates/ kompiliert werden
Empfehlung: Svelte-Komponenten bleiben in /src/framework/ui/svelte/, da sie Code sind. Nur statische HBS/HTML-Templates gehören in templates/.
Finale Root-Struktur (Übersicht)
fvtt_relationship_app_module/│├── 📁 assets/                  ✅ Foundry: Statische Assets│   ├── images/│   ├── fonts/│   └── videos/│├── 📁 lang/                    ✅ Foundry: i18n-Dateien│   ├── de.json│   └── en.json│├── 📁 styles/                  ✅ Foundry: CSS│   └── tailwind.css│├── 📁 templates/               ✅ Foundry: HBS/HTML Templates│   └── (HBS/HTML Dateien)│├── 📁 src/                     ✅ Code (Option B Struktur)│   ├── domain/│   ├── application/│   ├── infrastructure/│   └── framework/│├── 📁 dist/                    ✅ Build-Output│   └── fvtt_relationship_app_module.js│├── 📁 tests/                   ✅ Tests│   └── e2e/│├── 📁 docs/                     ✅ Dokumentation│├── 📁 scripts/                 ✅ Build-Scripts│├── 📄 module.json              ✅ Foundry Manifest├── 📄 package.json├── 📄 tsconfig.json├── 📄 vite.config.ts└── 📄 README.md
Zusammenfassung der Änderungen
Beibehalten (Foundry-Vorgaben):
templates/ im Root (für HBS/HTML)
styles/ im Root (für CSS)
assets/ im Root (für Bilder/Videos/Fonts)
lang/ im Root (für i18n-Dateien)
src/ für Code (umstrukturiert nach Option B)
Option B Änderungen (nur in /src):
Tokens aufteilen
DI Interfaces zusammenführen
Root Interfaces verschieben
DI Types gruppieren
ServiceTypeIndex integrieren
Die Foundry-spezifischen Root-Ordner bleiben unverändert; nur /src wird nach Option B umstrukturiert.
