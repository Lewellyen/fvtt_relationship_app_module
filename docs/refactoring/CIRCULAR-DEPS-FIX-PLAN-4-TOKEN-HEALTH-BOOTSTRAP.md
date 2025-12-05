# Umsetzungsplan: Token Hub & Bootstrap Zyklen beheben

**Problem-ID:** Circular Dependencies #4
**Betroffene Bereiche:**
- Token-Dateien (core.tokens.ts, event.tokens.ts, application.tokens.ts)
- Health-Check-Services
- Bootstrap Orchestrators
- runtime-safe-cast.ts Service-Imports
- cache.interface.ts ↔ type-casts.ts

**Anzahl Zyklen:** 30 verbleibend
**Schweregrad:** 🔴 KRITISCH
**Geschätzte Dauer:** 4-6 Stunden

---

## 📊 Problem-Analyse

### Aktueller Zustand (30 Zyklen)

**Hauptprobleme:**

#### Problem 1: Token-Dateien importieren Service-Types (12 Zyklen)

```typescript
// core.tokens.ts
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import type { MetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";

export const containerHealthCheckToken = createInjectionToken<ContainerHealthCheck>("...");
//                                                              ↑
//                                                              Service importiert Token zurück!
```

**Zyklen:**
1. `ContainerHealthCheck` → `core.tokens` → `ContainerHealthCheck` ❌
2. `MetricsHealthCheck` → `core.tokens` → `MetricsHealthCheck` ❌
3. `ModuleHealthService` → `core.tokens` → `ModuleHealthService` ❌
4. `ModuleSettingsRegistrar` → `core.tokens` → `ModuleSettingsRegistrar` ❌
5. `ModuleEventRegistrar` → `event.tokens` → `ModuleEventRegistrar` ❌
6. `JournalVisibilityService` → `application.tokens` → `JournalVisibilityService` ❌

#### Problem 2: runtime-safe-cast.ts importiert spezifische Services (10 Zyklen)

```typescript
// runtime-safe-cast.ts
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
// ... 15+ weitere Service-Imports

// Diese Funktionen erzeugen Zyklen:
export function castModuleEventRegistrar(value: unknown): ModuleEventRegistrar {
  return value as ModuleEventRegistrar;
}
```

**Problem:** Bootstrapper importieren `runtime-safe-cast.ts` → importiert Services → Services importieren Tokens → Tokens importieren Bootstrapper → Zyklus!

#### Problem 3: cache.interface.ts ↔ type-casts.ts (1 Zyklus - NEU!)

```typescript
// cache.interface.ts
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";

// type-casts.ts
export function assertCacheKey(value: string): import("@/infrastructure/cache/cache.interface").CacheKey {
  return value as import("@/infrastructure/cache/cache.interface").CacheKey;
}
```

#### Problem 4: Bootstrap Orchestrators ↔ core.tokens (7 Zyklen)

```typescript
// bootstrap-init-hook.ts
import { /* tokens */ } from "@/infrastructure/shared/tokens/core.tokens";

// core.tokens.ts
import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
export const bootstrapInitHookToken = createInjectionToken<BootstrapInitHookService>("...");
```

---

## 🎯 Ziel-Architektur

### Prinzipien

1. ✅ **Token-Dateien haben KEINE Type-Imports von Services**
2. ✅ **Generic Tokens**: `createInjectionToken<T>(name)` ohne T zu importieren
3. ✅ **runtime-safe-cast.ts OHNE Service-Imports**
4. ✅ **Separate Cast-Dateien pro Kontext** (Bootstrapper, API, etc.)
5. ✅ **type-casts.ts KEINE externen Types importieren**

### Neue Struktur

```
src/
├── infrastructure/
│   ├── di/
│   │   └── types/
│   │       └── utilities/
│   │           ├── type-casts.ts                    # ✅ Generisch, keine Imports
│   │           ├── runtime-safe-cast.ts             # ✅ Nur Container-intern
│   │           ├── bootstrap-casts.ts               # 🆕 Bootstrap-spezifisch
│   │           └── api-casts.ts                     # 🆕 API-spezifisch
│   │
│   └── shared/
│       └── tokens/
│           ├── core.tokens.ts                       # ✅ Keine Service-Type-Imports
│           ├── event.tokens.ts                      # ✅ Keine Service-Type-Imports
│           └── ...
│
├── application/
│   ├── health/
│   │   ├── ContainerHealthCheck.ts                 # ✅ Importiert Token, kein Zyklus
│   │   └── MetricsHealthCheck.ts                   # ✅ Importiert Token, kein Zyklus
│   │
│   └── tokens/
│       └── application.tokens.ts                   # ✅ Keine Service-Type-Imports
│
└── infrastructure/
    └── cache/
        ├── cache.interface.ts                      # ✅ Definiert CacheKey inline
        └── cache-key.ts                            # 🆕 CacheKey Type isoliert
```

---

## 🔧 Umsetzungsschritte

### Phase 1: Token-Dateien auf Generic Tokens umstellen

**Dauer:** 2 Stunden

#### Schritt 1.1: core.tokens.ts refactoren

**Problem:** Token-Dateien importieren Service-Types nur für `createInjectionToken<T>()`

**Lösung:** TypeScript Generics funktionieren auch OHNE Import des Types!

**Vorher:**
```typescript
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
export const containerHealthCheckToken = createInjectionToken<ContainerHealthCheck>("ContainerHealthCheck");
```

**Nachher:**
```typescript
// KEIN Import!
export const containerHealthCheckToken = createInjectionToken<any>("ContainerHealthCheck");
```

**ODER besser (wenn createInjectionToken richtig getypt ist):**
```typescript
// Verwende string literal type
export const containerHealthCheckToken = createInjectionToken("ContainerHealthCheck");
```

**Datei:** `src/infrastructure/shared/tokens/core.tokens.ts`

```typescript
/**
 * Core application tokens for logging, domain services, configuration, and health.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types mehr!
 * Token-Generics werden erst beim resolve() aufgelöst.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";

// ❌ ENTFERNT: Alle Service-Type-Imports
// import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
// import type { MetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
// import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
// import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
// import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
// import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";

// ✅ Nur noch primitive Types und Domain Types
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
// RuntimeConfigService ist OK, da es keine Token-Abhängigkeit hat
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { Container } from "@/infrastructure/di/interfaces";
import type { ContainerPort } from "@/domain/ports/container-port.interface";

/**
 * Token für Logger - Type aus Interface-Datei
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

/**
 * Token für EnvironmentConfig - Type aus Domain
 */
export const environmentConfigToken = createInjectionToken<EnvironmentConfig>("EnvironmentConfig");

/**
 * Token für RuntimeConfigService - Type aus Service (hat keine Token-Deps)
 */
export const runtimeConfigServiceToken = createInjectionToken<RuntimeConfigService>("RuntimeConfigService");

/**
 * Token für ContainerHealthCheck
 * Generic Type wird beim resolve() aufgelöst
 */
export const containerHealthCheckToken = createInjectionToken<any>("ContainerHealthCheck");

/**
 * Token für MetricsHealthCheck
 */
export const metricsHealthCheckToken = createInjectionToken<any>("MetricsHealthCheck");

/**
 * Token für HealthCheckRegistry
 */
export const healthCheckRegistryToken = createInjectionToken<any>("HealthCheckRegistry");

/**
 * Token für ModuleHealthService
 */
export const moduleHealthServiceToken = createInjectionToken<any>("ModuleHealthService");

/**
 * Token für ModuleSettingsRegistrar
 */
export const moduleSettingsRegistrarToken = createInjectionToken<any>("ModuleSettingsRegistrar");

/**
 * Token für BootstrapInitHookService
 */
export const bootstrapInitHookToken = createInjectionToken<any>("BootstrapInitHook");

/**
 * Token für BootstrapReadyHookService
 */
export const bootstrapReadyHookToken = createInjectionToken<any>("BootstrapReadyHook");

/**
 * Token für Container
 */
export const containerToken = createInjectionToken<Container>("Container");

/**
 * Token für ContainerPort
 */
export const containerPortToken = createInjectionToken<ContainerPort>("ContainerPort");
```

**Commit:** `refactor(tokens): remove service-type imports from core.tokens`

#### Schritt 1.2: event.tokens.ts refactoren

**Datei:** `src/infrastructure/shared/tokens/event.tokens.ts`

```typescript
/**
 * Event-related tokens.
 *
 * WICHTIG: Keine Service-Type-Imports!
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";

// ❌ ENTFERNT: Service-Type-Imports

/**
 * Token für ModuleEventRegistrar
 */
export const moduleEventRegistrarToken = createInjectionToken<any>("ModuleEventRegistrar");

/**
 * Token für Event-Registrar Use Cases
 */
export const invalidateJournalCacheOnChangeUseCaseToken = createInjectionToken<any>("InvalidateJournalCacheOnChangeUseCase");
export const processJournalDirectoryOnRenderUseCaseToken = createInjectionToken<any>("ProcessJournalDirectoryOnRenderUseCase");
export const triggerJournalDirectoryReRenderUseCaseToken = createInjectionToken<any>("TriggerJournalDirectoryReRenderUseCase");
export const registerContextMenuUseCaseToken = createInjectionToken<any>("RegisterContextMenuUseCase");
```

**Commit:** `refactor(tokens): remove service-type imports from event.tokens`

#### Schritt 1.3: application.tokens.ts refactoren

**Datei:** `src/application/tokens/application.tokens.ts`

```typescript
/**
 * Application-layer tokens.
 *
 * WICHTIG: Keine Service-Type-Imports!
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";

// ❌ ENTFERNT: Alle Service-Type-Imports

/**
 * Token für JournalVisibilityService
 */
export const journalVisibilityServiceToken = createInjectionToken<any>("JournalVisibilityService");

// ... alle anderen Tokens mit any
```

**Commit:** `refactor(tokens): remove service-type imports from application.tokens`

---

### Phase 2: CacheKey Zyklus beheben

**Dauer:** 30 Minuten

#### Schritt 2.1: CacheKey isolieren

**Problem:** `cache.interface.ts` ↔ `type-casts.ts` Zyklus

**Lösung:** CacheKey Brand inline definieren

**Datei:** `src/infrastructure/di/types/utilities/type-casts.ts`

```typescript
/**
 * Generic type cast utilities.
 *
 * KEINE externen Type-Imports!
 */

/**
 * CacheKey Brand-Type (inline definiert, um Zyklus zu vermeiden)
 */
export type CacheKey = string & { readonly __brand: "CacheKey" };

/**
 * Type-safe assertion für CacheKey brand.
 */
export function assertCacheKey(value: string): CacheKey {
  return value as CacheKey;
}

// ... rest bleibt gleich
```

**Datei:** `src/infrastructure/cache/cache.interface.ts`

```typescript
/**
 * Cache-Key Type - re-exportiert von type-casts für Konsistenz
 */
export type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";
// ❌ ENTFERNT: import { assertCacheKey } - Clients importieren direkt von type-casts

// ... rest bleibt gleich
```

**Commit:** `refactor(cache): fix cache.interface ↔ type-casts cycle`

---

### Phase 3: runtime-safe-cast.ts Service-Imports eliminieren

**Dauer:** 1.5 Stunden

#### Schritt 3.1: Bootstrap-Casts auslagern

**Neue Datei:** `src/infrastructure/di/types/utilities/bootstrap-casts.ts`

```typescript
/**
 * Cast utilities für Bootstrap Orchestrators.
 *
 * Separate Datei, um Zyklen zu vermeiden.
 * Nur von Bootstrap-Code verwendet.
 *
 * @ts-expect-error - Type coverage exclusion
 */

/**
 * Generic cast für aufgelöste Services.
 * Keine spezifischen Service-Imports!
 */
export function castResolvedService<T>(value: unknown): T {
  return value as T;
}

/**
 * Cast für ModuleEventRegistrar
 */
export function castModuleEventRegistrar(value: unknown): any {
  return value;
}

/**
 * Cast für ModuleApiInitializer
 */
export function castModuleApiInitializer(value: unknown): any {
  return value;
}

/**
 * Cast für ModuleSettingsRegistrar
 */
export function castModuleSettingsRegistrar(value: unknown): any {
  return value;
}

/**
 * Cast für MetricsCollector
 */
export function castMetricsCollector(value: unknown): any {
  return value;
}

/**
 * Cast für ModuleHealthService
 */
export function castModuleHealthService(value: unknown): any {
  return value;
}

/**
 * Cast für BootstrapInitHookService
 */
export function castBootstrapInitHookService(value: unknown): any {
  return value;
}

/**
 * Cast für BootstrapReadyHookService
 */
export function castBootstrapReadyHookService(value: unknown): any {
  return value;
}

/**
 * Cast für Logger
 */
export function castLogger(value: unknown): any {
  return value;
}

/**
 * Cast für FoundrySettings
 */
export function castFoundrySettings(value: unknown): any {
  return value;
}

/**
 * Cast für NotificationService
 */
export function castNotificationService(value: unknown): any {
  return value;
}
```

**Commit:** `refactor(di): extract bootstrap-casts from runtime-safe-cast`

#### Schritt 3.2: API-Casts auslagern

**Neue Datei:** `src/infrastructure/di/types/utilities/api-casts.ts`

```typescript
/**
 * Cast utilities für API und Module-Initialization.
 *
 * @ts-expect-error - Type coverage exclusion
 */

/**
 * Generic Wrapper für Services im API-Kontext
 */
export function wrapServiceForAPI<T>(service: T, wrapper: (svc: any) => any): T {
  return wrapper(service as any) as T;
}

/**
 * Wrapper für I18nFacadeService
 */
export function wrapI18nService<T>(service: T, create: (i18n: any) => any): T {
  return create(service as any) as T;
}

/**
 * Wrapper für NotificationCenter
 */
export function wrapNotificationCenterService<T>(service: T, create: (center: any) => any): T {
  return create(service as any) as T;
}

/**
 * Wrapper für FoundrySettings
 */
export function wrapFoundrySettingsPort<T>(service: T, create: (settings: any) => any): T {
  return create(settings as any) as T;
}
```

**Commit:** `refactor(di): extract api-casts from runtime-safe-cast`

#### Schritt 3.3: runtime-safe-cast.ts minimieren

**Datei:** `src/infrastructure/di/types/utilities/runtime-safe-cast.ts`

```typescript
/**
 * Runtime-safe cast utilities für DI container internals.
 *
 * NUR Container-interne Operationen!
 * Für Bootstrap: siehe bootstrap-casts.ts
 * Für API: siehe api-casts.ts
 * Für Generics: siehe type-casts.ts
 *
 * @ts-expect-error - Type coverage exclusion
 */

import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceRegistration } from "../core/serviceregistration";
import type { Result } from "@/domain/types/result";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";
import type { ContainerError, Container } from "../../interfaces";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { ok, err } from "@/domain/utils/result";

// ❌ ENTFERNT: Alle spezifischen Service-Imports!
// Diese sind jetzt in bootstrap-casts.ts und api-casts.ts

/**
 * Cast für gecachte Service-Instanzen.
 */
export function castCachedServiceInstance<T>(instance: unknown | undefined): T | undefined {
  return instance as T | undefined;
}

/**
 * Cast für gecachte Service-Instanzen mit Result.
 */
export function castCachedServiceInstanceForResult<T>(
  instance: unknown | undefined
): Result<T, ContainerError> {
  if (instance === undefined) {
    return err({
      code: "TokenNotRegistered",
      message: "castCachedServiceInstanceForResult: instance must not be undefined.",
      details: {},
    });
  }
  return ok(instance as T);
}

/**
 * Cast für ServiceRegistration Map-Einträge.
 */
export function castServiceRegistrationEntry(
  token: symbol,
  registration: ServiceRegistration<unknown>
): [InjectionToken<unknown>, ServiceRegistration<unknown>] {
  return [token as InjectionToken<unknown>, registration as ServiceRegistration<unknown>];
}

/**
 * Iterator für ServiceRegistration Map-Einträge.
 */
export function* iterateServiceRegistrationEntries(
  entries: Iterable<[symbol, ServiceRegistration<unknown>]>
): IterableIterator<[InjectionToken<unknown>, ServiceRegistration<unknown>]> {
  for (const [token, registration] of entries) {
    yield castServiceRegistrationEntry(token, registration);
  }
}

/**
 * Extracts registration status from Result.
 */
export function getRegistrationStatus(result: Result<boolean, ContainerError>): boolean {
  return result.ok ? result.value : false;
}

/**
 * Casts Foundry hook callback.
 */
export function castToFoundryHookCallback(callback: unknown): FoundryHookCallback {
  return callback as FoundryHookCallback;
}

/**
 * Container Error Code Cast
 */
export function castContainerErrorCode(code: string): ContainerError["code"] {
  return code as ContainerError["code"];
}

/**
 * Container Token zu ContainerPort Token
 */
export function castContainerTokenToContainerPortToken(
  token: InjectionToken<Container>
): InjectionToken<ContainerPort> {
  return token as unknown as InjectionToken<ContainerPort>;
}

/**
 * Generic Service Resolution Cast
 * Nur für interne Container-Operationen!
 */
export function castResolvedService<T>(value: unknown): T {
  return value as T;
}
```

**Commit:** `refactor(di): minimize runtime-safe-cast to container-only operations`

---

### Phase 4: Bootstrap Orchestrators aktualisieren

**Dauer:** 1 Stunde

#### Schritt 4.1: Alle Orchestrator-Imports aktualisieren

**PowerShell Script:**

```powershell
$files = Get-ChildItem -Path "src/framework/core/bootstrap/orchestrators" -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Ersetze runtime-safe-cast Imports durch bootstrap-casts
    $content = $content -replace `
        'from "@/infrastructure/di/types/utilities/runtime-safe-cast"', `
        'from "@/infrastructure/di/types/utilities/bootstrap-casts"'

    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
}
```

**Manuelle Updates:**

**Datei:** `src/framework/core/bootstrap/orchestrators/events-bootstrapper.ts`

```typescript
import { castModuleEventRegistrar } from "@/infrastructure/di/types/utilities/bootstrap-casts";
```

**Datei:** `src/framework/core/bootstrap/orchestrators/api-bootstrapper.ts`

```typescript
import { castModuleApiInitializer } from "@/infrastructure/di/types/utilities/bootstrap-casts";
```

**Datei:** `src/framework/core/bootstrap/orchestrators/settings-bootstrapper.ts`

```typescript
import { castModuleSettingsRegistrar } from "@/infrastructure/di/types/utilities/bootstrap-casts";
```

**Commit:** `refactor(bootstrap): use bootstrap-casts instead of runtime-safe-cast`

#### Schritt 4.2: API-Initializer aktualisieren

**Datei:** `src/framework/core/api/module-api-initializer.ts`

```typescript
import {
  wrapI18nService,
  wrapNotificationCenterService,
  wrapFoundrySettingsPort,
} from "@/infrastructure/di/types/utilities/api-casts";
```

**Commit:** `refactor(api): use api-casts instead of runtime-safe-cast`

---

### Phase 5: Exports aktualisieren

**Dauer:** 15 Minuten

**Datei:** `src/infrastructure/di/types/index.ts`

```typescript
export * from "./utilities/api-safe-token";
export * from "./utilities/deprecated-token";
export * from "./utilities/runtime-safe-cast";
export * from "./utilities/type-casts";
export * from "./utilities/bootstrap-casts";  // 🆕
export * from "./utilities/api-casts";        // 🆕
```

**Commit:** `refactor(di): export new cast utilities`

---

### Phase 6: Verifizierung und Tests

**Dauer:** 1 Stunde

#### Schritt 6.1: Type-Check und Tests

```powershell
npm run type-check
npm test
```

#### Schritt 6.2: Zirkuläre Dependencies prüfen

```powershell
npm run analyze:circular
```

**Erwartetes Ergebnis:**
```
✔ Found 0-5 circular dependencies!  # Von 30 → 0-5 (fast alle eliminiert!)
```

Die verbleibenden 0-5 Zyklen sollten nur noch:
- Observability Registry (schwer zu beheben ohne Breaking Changes)
- Möglicherweise Bootstrap-Init-Hook ↔ Orchestrators (akzeptabel)

---

## ✅ Erfolgskriterien

### Funktional
- [ ] Alle Tests laufen durch (`npm run test`)
- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Keine Linter-Fehler (`npm run lint`)

### Architektur
- [ ] 25+ Zyklen eliminiert (30 → 0-5)
- [ ] Token-Dateien haben KEINE Service-Type-Imports
- [ ] `runtime-safe-cast.ts` hat KEINE spezifischen Service-Imports
- [ ] `cache.interface.ts` ↔ `type-casts.ts` Zyklus behoben
- [ ] Separate Cast-Dateien pro Kontext erstellt

### Code Quality
- [ ] Klare Separation: Container / Bootstrap / API / Generic
- [ ] Token-Generics werden erst beim `resolve()` aufgelöst
- [ ] Keine unnötigen Type-Imports in Infrastructure-Code

---

## 🔙 Rollback-Plan

### Phase 1 Rollback:
```powershell
git checkout src/infrastructure/shared/tokens/*.ts
git checkout src/application/tokens/*.ts
```

### Phase 3 Rollback:
```powershell
Remove-Item src/infrastructure/di/types/utilities/bootstrap-casts.ts
Remove-Item src/infrastructure/di/types/utilities/api-casts.ts
git checkout src/infrastructure/di/types/utilities/runtime-safe-cast.ts
```

### Kompletter Rollback:
```powershell
git reset --hard HEAD~10
```

---

## 📊 Impact-Analyse

### Betroffene Dateien

**Token-Dateien (3):**
- `core.tokens.ts`
- `event.tokens.ts`
- `application.tokens.ts`

**Cast-Dateien (4):**
- `runtime-safe-cast.ts` (minimiert)
- `type-casts.ts` (CacheKey hinzugefügt)
- `bootstrap-casts.ts` (neu)
- `api-casts.ts` (neu)

**Orchestrators (7):**
- Alle Bootstrap-Orchestrator-Dateien

**API (1):**
- `module-api-initializer.ts`

**Cache (1):**
- `cache.interface.ts`

### Breaking Changes

**KEINE!** Alle Änderungen sind intern:
- Token-APIs bleiben gleich
- Cast-Funktionen haben gleiche Signaturen
- Nur Imports werden verschoben

---

## 🎯 Lessons Learned

### Anti-Pattern: "Token-Datei importiert Service-Type"

❌ **Problem:**
```typescript
// Token-Datei
import type { MyService } from "@/services/MyService";
export const myServiceToken = createInjectionToken<MyService>("MyService");

// MyService
import { myServiceToken } from "@/tokens";
// → ZYKLUS!
```

✅ **Lösung:**
```typescript
// Token-Datei
export const myServiceToken = createInjectionToken<any>("MyService");
// Oder mit besserer Typisierung:
export const myServiceToken = createInjectionToken("MyService");

// MyService
import { myServiceToken } from "@/tokens";
// → Kein Zyklus!
```

### Best Practice: Separate Cast-Dateien

**Kriterien für separate Cast-Datei:**
1. ✅ Wird von spezifischem Kontext genutzt (Bootstrap, API, etc.)
2. ✅ Benötigt spezifische Service-Knowledge
3. ✅ Vermeidet transitive Dependencies

**Struktur:**
```
type-casts.ts        → Generisch, keine Imports
runtime-safe-cast.ts → Container-intern
bootstrap-casts.ts   → Bootstrap-spezifisch
api-casts.ts         → API-spezifisch
```

---

## 📈 Erwartete Verbesserung

### Vorher (nach Plan 3)
- Zirkuläre Dependencies: **30**
- Token ↔ Service Zyklen: **12**
- runtime-safe-cast Zyklen: **10**
- Cache Zyklen: **1**
- Bootstrap Zyklen: **7**

### Nachher
- Zirkuläre Dependencies: **0-5** (96-100% behoben!)
- Token ↔ Service Zyklen: **0** ✅
- runtime-safe-cast Zyklen: **0** ✅
- Cache Zyklen: **0** ✅
- Bootstrap Zyklen: **0-5** (akzeptabel)

### Gesamt-Bilanz
- **Start:** 74 Zyklen
- **Nach Plan 2:** 45 Zyklen (-39%)
- **Nach Plan 3:** 30 Zyklen (-60%)
- **Nach Plan 4:** 0-5 Zyklen (-93 bis -100%) 🎉

---

**Status:** 🟢 BEREIT ZUR UMSETZUNG
**Priorität:** 🔴 KRITISCH (Letzte große Zyklus-Gruppe)
**Risiko:** 🟡 MITTEL (Viele Dateien, aber keine Breaking Changes)
**Dependencies:** ✅ Baut auf Plan 2 & 3 auf

