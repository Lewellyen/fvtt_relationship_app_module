# Umsetzungsplan: RuntimeConfig ↔ EventRegistrar Zyklus beheben

**Problem-ID:** Circular Dependencies #3
**Betroffene Dateien:**
- `src/application/services/RuntimeConfigService.ts`
- `src/application/services/ModuleEventRegistrar.ts`
- `src/infrastructure/di/types/utilities/runtime-safe-cast.ts`
- `src/infrastructure/shared/tokens/index.ts`

**Anzahl Zyklen:** ~20 (transitiv über runtime-safe-cast.ts)
**Schweregrad:** 🟠 HOCH
**Geschätzte Dauer:** 3-4 Stunden

---

## 📊 Problem-Analyse

### Aktueller Zustand

**Zyklus-Kette:**

```
RuntimeConfigService (application/services/)
    ↓ imports
widenRuntimeConfigListeners (infrastructure/di/types/utilities/runtime-safe-cast.ts)
    ↓ imports (Zeile 25)
ServiceType (infrastructure/shared/tokens/index.ts)
    ↓ imports für ServiceType Union (Zeile 79)
ModuleEventRegistrar (application/services/)
    ↓ imports (Zeilen 7-11)
Tokens (infrastructure/shared/tokens/index.ts)
    ↓ imports für ServiceType Union (Zeile 74)
RuntimeConfigService
    ↑ ZYKLUS!
```

### Detaillierte Trace

**1. RuntimeConfigService.ts (Zeile 3)**
```typescript
import { widenRuntimeConfigListeners } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
```

**2. runtime-safe-cast.ts (Zeilen 25, 32)**
```typescript
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";
```

**3. tokens/index.ts (Zeile 79)**
```typescript
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";

export type ServiceType =
  | ...
  | ModuleEventRegistrar  // ← Teil der Union
  | ...
```

**4. ModuleEventRegistrar.ts (Zeilen 7-11)**
```typescript
import {
  platformNotificationPortToken,
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
} from "@/infrastructure/shared/tokens";
```

**5. tokens/index.ts (Zeile 74)**
```typescript
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

export type ServiceType =
  | ...
  | RuntimeConfigService  // ← Teil der Union
  | ...
```

### Root Cause

**Mehrfache Architektur-Probleme:**

1. ❌ **ServiceType Union erzeugt globalen Dependency-Graph**
   - ALLE Services werden in ServiceType aufgenommen
   - ServiceType wird von runtime-safe-cast.ts benötigt
   - runtime-safe-cast.ts wird von VIELEN Services verwendet
   - → Transitive Dependencies auf ALLE Services

2. ❌ **runtime-safe-cast.ts ist zu zentral**
   - Wird von vielen Services direkt importiert
   - Enthält aber auch DI-Container-spezifische Casts
   - Import von `ServiceType` und `ModuleEventRegistrar` für Cast-Funktionen

3. ❌ **RuntimeConfigService nutzt Utility-Funktion die Type-Knowledge benötigt**
   - `widenRuntimeConfigListeners` ist ein reiner Type-Cast
   - Könnte inline sein oder in RuntimeConfigService selbst
   - Keine Notwendigkeit für shared utility

---

## 🎯 Ziel-Architektur

### Prinzipien

1. ✅ **Utility-Funktionen nur da wo nötig** (keine globalen Utils mit vielen Imports)
2. ✅ **ServiceType nur in DI-Container-Kontext** (Services kennen ServiceType nicht)
3. ✅ **runtime-safe-cast.ts aufteilen** nach Verwendungskontext
4. ✅ **Type-Only Casts inline** statt als shared functions

### Neue Struktur

```
src/
├── application/
│   └── services/
│       ├── RuntimeConfigService.ts           # ✅ Keine Dependency auf runtime-safe-cast
│       └── ModuleEventRegistrar.ts           # ✅ Importiert spezifische Tokens
│
└── infrastructure/
    └── di/
        └── types/
            └── utilities/
                ├── runtime-safe-cast.ts              # ✅ Nur DI-Container Casts (mit ServiceType)
                ├── type-casts.ts                     # 🆕 Generische Type-Casts (OHNE ServiceType)
                └── service-type-registry.ts          # ✅ ServiceType Union (Plan 1)
```

---

## 🔧 Umsetzungsschritte

### Phase 1: Generische Type-Casts auslagern

**Dauer:** 1 Stunde

#### Schritt 1.1: Neue Datei für generische Casts

**Datei:** `src/infrastructure/di/types/utilities/type-casts.ts`

```typescript
/**
 * Generic type cast utilities.
 *
 * Diese Datei enthält KEINE Abhängigkeiten zu ServiceType oder spezifischen Services.
 * Nur rein generische Type-Level-Operationen.
 *
 * Unterschied zu runtime-safe-cast.ts:
 * - runtime-safe-cast.ts: DI-Container-spezifisch, nutzt ServiceType
 * - type-casts.ts: Generisch, keine Domain-Knowledge
 */

import type { Result } from "@/domain/types/result";

/**
 * Generic type-widening for listener sets.
 *
 * Widens a Set<Listener<SpecificKey>> to Set<Listener<GenericKey>>.
 * This is runtime-safe because all listeners have the same shape at runtime,
 * only TypeScript needs this cast for covariance.
 *
 * @template TKey - The specific key type
 * @template TValue - The value type for that key
 * @template TGenericKey - The generic key type (supertype of TKey)
 * @param listeners - The set of listeners with specific key type
 * @returns The same set, typed with generic key type
 */
export function widenListenerSet<
  TKey extends string,
  TValue,
  TGenericKey extends string = string
>(
  listeners: Set<(value: TValue) => void>
): Set<(value: TValue) => void> {
  // Runtime-safe: Set is the same, only type changes
  return listeners as Set<(value: TValue) => void>;
}

/**
 * Converts a key array to string array for runtime comparisons.
 *
 * TypeScript types keys as 'keyof T', but runtime needs string[] for includes().
 */
export function toStringKeyArray<T extends Record<string, unknown>>(
  allowed: readonly (keyof T)[]
): readonly string[] {
  return allowed as readonly string[];
}

/**
 * Type-safe cache value cast.
 *
 * The type safety is guaranteed by the caller using structured CacheKey.
 */
export function castCacheValue<TValue>(value: unknown): TValue {
  return value as TValue;
}

/**
 * Safe first array element access after length check.
 *
 * Caller must verify array.length > 0 before calling.
 */
export function getFirstArrayElement<T>(array: T[]): T {
  return array[0] as T;
}

/**
 * Type guard-based array element access.
 */
export function getFirstElementIfArray<T>(
  value: unknown,
  typeGuard: (element: unknown) => element is T
): T | null {
  if (Array.isArray(value) && value.length > 0) {
    const firstElement: unknown = value[0] as unknown;
    if (typeGuard(firstElement)) {
      return firstElement;
    }
  }
  return null;
}

/**
 * Cast object to Record<string, unknown>.
 */
export function castToRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/**
 * Normalize object to new Record instance.
 */
export function normalizeToRecord(value: unknown): Record<string, unknown> {
  return Object.assign({}, value as Record<string, unknown>);
}

/**
 * Type-safe assertion for branded types.
 */
export function assertBrandedType<TBrand extends string>(
  value: string,
  _brand?: TBrand
): string & { __brand: TBrand } {
  return value as string & { __brand: TBrand };
}
```

**Commit:** `refactor(di): extract generic type-casts to separate file`

#### Schritt 1.2: RuntimeConfigService aktualisieren

**Datei:** `src/application/services/RuntimeConfigService.ts`

**Option A: Inline Cast (Empfohlen)**

```typescript
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { LogLevel } from "@/domain/types/log-level";

export type RuntimeConfigValues = {
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: LogLevel;
  enablePerformanceTracking: boolean;
  performanceSamplingRate: number;
  enableMetricsPersistence: boolean;
  metricsPersistenceKey: string;
  enableCacheService: boolean;
  cacheDefaultTtlMs: number;
  cacheMaxEntries: number | undefined;
};

export type RuntimeConfigKey = keyof RuntimeConfigValues;

type RuntimeConfigListener<K extends RuntimeConfigKey> = (value: RuntimeConfigValues[K]) => void;

/**
 * RuntimeConfigService
 *
 * Acts as a bridge between build-time environment defaults (VITE_*) and
 * runtime Foundry settings. Provides a central registry that services can
 * query for current values and subscribe to for live updates.
 */
export class RuntimeConfigService {
  private readonly values: RuntimeConfigValues;
  private readonly listeners = new Map<
    RuntimeConfigKey,
    Set<RuntimeConfigListener<RuntimeConfigKey>>
  >();

  constructor(env: EnvironmentConfig) {
    this.values = {
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
      logLevel: env.logLevel,
      enablePerformanceTracking: env.enablePerformanceTracking,
      performanceSamplingRate: env.performanceSamplingRate,
      enableMetricsPersistence: env.enableMetricsPersistence,
      metricsPersistenceKey: env.metricsPersistenceKey,
      enableCacheService: env.enableCacheService,
      cacheDefaultTtlMs: env.cacheDefaultTtlMs,
      cacheMaxEntries: env.cacheMaxEntries,
    };
  }

  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.values[key];
  }

  setFromFoundry<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    this.updateValue(key, value);
  }

  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
    const existing = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
    const listeners: Set<RuntimeConfigListener<K>> =
      existing ?? new Set<RuntimeConfigListener<K>>();
    listeners.add(listener);

    // Inline cast - runtime-safe weil Set die gleiche Struktur hat
    this.listeners.set(key, listeners as Set<RuntimeConfigListener<RuntimeConfigKey>>);

    return () => {
      const activeListeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  private updateValue<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    const current = this.values[key];
    if (Object.is(current, value)) {
      return;
    }

    this.values[key] = value;
    const listeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }
}
```

**Option B: Utility-Funktion aus type-casts.ts**

```typescript
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { LogLevel } from "@/domain/types/log-level";
import { widenListenerSet } from "@/infrastructure/di/types/utilities/type-casts";

// ... rest wie Option A, aber in onChange():

onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
  const existing = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
  const listeners: Set<RuntimeConfigListener<K>> =
    existing ?? new Set<RuntimeConfigListener<K>>();
  listeners.add(listener);

  this.listeners.set(key, widenListenerSet(listeners));

  // ... rest wie vorher
}
```

**Empfehlung:** Option A (Inline) - einfacher und keine neue Dependency

**Commit:** `refactor(application): remove dependency on runtime-safe-cast from RuntimeConfigService`

---

### Phase 2: runtime-safe-cast.ts bereinigen

**Dauer:** 1 Stunde

#### Schritt 2.1: Nicht-DI Funktionen entfernen

**Datei:** `src/infrastructure/di/types/utilities/runtime-safe-cast.ts`

```typescript
/**
 * Runtime-safe cast utilities for DI container internals.
 *
 * Diese Datei enthält Casts die SPEZIFISCH für den DI-Container sind
 * und ServiceType kennen müssen.
 *
 * Für generische Type-Casts siehe: ./type-casts.ts
 *
 * @ts-expect-error - Type coverage exclusion: This file intentionally uses type assertions
 * for runtime-safe casts that are necessary for the DI infrastructure.
 */

import type { ServiceType } from "../service-type-registry";  // ← NEU: Von Plan 1
import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceRegistration } from "../core/serviceregistration";
import type { Result } from "@/domain/types/result";
import type { ContainerError, Container } from "../../interfaces";
import { ok, err } from "@/domain/utils/result";

// ❌ ENTFERNT: widenRuntimeConfigListeners → nach type-casts.ts oder inline
// ❌ ENTFERNT: toStringKeyArray → nach type-casts.ts
// ❌ ENTFERNT: castCacheValue → nach type-casts.ts
// ❌ ENTFERNT: getFirstArrayElement → nach type-casts.ts
// ❌ ENTFERNT: getFirstElementIfArray → nach type-casts.ts
// ❌ ENTFERNT: castToRecord → nach type-casts.ts
// ❌ ENTFERNT: normalizeToRecord → nach type-casts.ts

// ✅ BEHALTEN: Alle DI-Container-spezifischen Casts

/**
 * Wrapper für I18nFacadeService im Module-API-Kontext.
 */
export function wrapI18nService<TServiceType>(
  service: TServiceType,
  create: (i18n: I18nFacadeService) => I18nFacadeService
): TServiceType {
  const concrete = service as unknown as I18nFacadeService;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Wrapper für NotificationCenter.
 */
export function wrapNotificationCenterService<TServiceType>(
  service: TServiceType,
  create: (center: NotificationService) => NotificationService
): TServiceType {
  const concrete = service as unknown as NotificationService;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Wrapper für FoundrySettings.
 */
export function wrapFoundrySettingsPort<TServiceType>(
  service: TServiceType,
  create: (settings: FoundrySettings) => FoundrySettings
): TServiceType {
  const concrete = service as unknown as FoundrySettings;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Cast für gecachte Service-Instanzen.
 */
export function castCachedServiceInstance<TServiceType extends ServiceType>(
  instance: ServiceType | undefined
): TServiceType | undefined {
  return instance as TServiceType | undefined;
}

/**
 * Cast für gecachte Service-Instanzen mit Result.
 */
export function castCachedServiceInstanceForResult<TServiceType extends ServiceType>(
  instance: ServiceType | undefined
): Result<TServiceType, ContainerError> {
  if (instance === undefined) {
    return err({
      code: "TokenNotRegistered",
      message:
        "castCachedServiceInstanceForResult: instance must not be undefined.",
      details: {},
    });
  }
  return ok(instance as TServiceType);
}

/**
 * Cast für ServiceRegistration Map-Einträge.
 */
export function castServiceRegistrationEntry(
  token: symbol,
  registration: ServiceRegistration<ServiceType>
): [InjectionToken<ServiceType>, ServiceRegistration<ServiceType>] {
  return [token as InjectionToken<ServiceType>, registration as ServiceRegistration<ServiceType>];
}

/**
 * Iterator für ServiceRegistration Map-Einträge.
 */
export function* iterateServiceRegistrationEntries(
  entries: Iterable<[symbol, ServiceRegistration<ServiceType>]>
): IterableIterator<[InjectionToken<ServiceType>, ServiceRegistration<ServiceType>]> {
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

// ✅ BEHALTEN: Alle Service-spezifischen Cast-Funktionen
// (castModuleEventRegistrar, castModuleApiInitializer, etc.)
// Diese sind OK, weil sie nur von DI-Container-internen Dateien genutzt werden

// ... alle bestehenden Service-Cast-Funktionen ...
```

**Commit:** `refactor(di): move generic casts out of runtime-safe-cast.ts`

#### Schritt 2.2: Imports in anderen Dateien aktualisieren

**Betroffene Dateien:**
- Alle Dateien die `widenRuntimeConfigListeners` etc. aus `runtime-safe-cast.ts` importieren

**PowerShell Migration-Script:**

```powershell
$replacements = @(
    @{
        Old = 'import\s+\{\s*widenRuntimeConfigListeners\s*\}\s+from\s+[''"]@/infrastructure/di/types/utilities/runtime-safe-cast[''"]'
        New = '// widenRuntimeConfigListeners removed - use inline cast or widenListenerSet from type-casts.ts'
    },
    @{
        Old = 'import\s+\{\s*toStringKeyArray\s*\}\s+from\s+[''"]@/infrastructure/di/types/utilities/runtime-safe-cast[''"]'
        New = 'import { toStringKeyArray } from "@/infrastructure/di/types/utilities/type-casts"'
    },
    @{
        Old = 'import\s+\{\s*castCacheValue\s*\}\s+from\s+[''"]@/infrastructure/di/types/utilities/runtime-safe-cast[''"]'
        New = 'import { castCacheValue } from "@/infrastructure/di/types/utilities/type-casts"'
    }
)

$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -Exclude "*.spec.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false

    foreach ($replacement in $replacements) {
        if ($content -match $replacement.Old) {
            $content = $content -replace $replacement.Old, $replacement.New
            $changed = $true
        }
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
    }
}
```

**Commit:** `refactor: update imports after split of runtime-safe-cast.ts`

---

### Phase 3: ModuleEventRegistrar Token-Imports optimieren

**Dauer:** 30 Minuten

#### Schritt 3.1: Spezifische Token-Imports verwenden

**Datei:** `src/application/services/ModuleEventRegistrar.ts`

**Vorher (importiert aus Barrel):**
```typescript
import {
  platformNotificationPortToken,
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
} from "@/infrastructure/shared/tokens";
```

**Nachher (spezifische Imports):**
```typescript
import { platformNotificationPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
import {
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
} from "@/application/tokens/application.tokens";
```

**Hinweis:** Dies ist Teil der Migration aus Plan 1, wird hier aber kritisch für Zyklus-Breaking

**Commit:** `refactor(application): use specific token imports in ModuleEventRegistrar`

---

### Phase 4: Verifizierung und Tests

**Dauer:** 1 Stunde

#### Schritt 4.1: Zirkuläre Dependencies prüfen

```powershell
npm run analyze:circular
```

**Erwartetes Ergebnis:**
```
✔ Found 54 circular dependencies!  # Von 74 → 54 (-20)

# RuntimeConfig ↔ ModuleEventRegistrar Zyklen sollten weg sein
```

#### Schritt 4.2: Dependency-Graph visualisieren

```powershell
# Erstelle neue Diagramme
npm run analyze:all

# Prüfe speziell RuntimeConfigService Dependencies
npx madge --ts-config tsconfig.json --extensions ts --depends src/application/services/RuntimeConfigService.ts
```

**Erwartete Ausgabe:**
```
RuntimeConfigService
  ├── @/domain/types/environment-config
  ├── @/domain/types/log-level
  └── (KEINE Dependency auf runtime-safe-cast.ts mehr!)
```

#### Schritt 4.3: Unit-Tests ausführen

```powershell
# Alle Tests
npm run test

# Nur RuntimeConfigService Tests
npm run test -- RuntimeConfigService

# Nur ModuleEventRegistrar Tests
npm run test -- ModuleEventRegistrar
```

#### Schritt 4.4: Type-Coverage prüfen

```powershell
npm run type-coverage
```

**Erwartung:** 100% maintained (keine Verschlechterung durch Casts)

---

## ✅ Erfolgskriterien

### Funktional

- [ ] Alle Tests laufen durch (`npm run test`)
- [ ] Type-Check erfolgreich (`npm run type-check`)
- [ ] Type-Coverage bei 100% (`npm run type-coverage`)
- [ ] Keine neuen Linter-Fehler (`npm run lint`)

### Architektur

- [ ] RuntimeConfig ↔ EventRegistrar Zyklen behoben (~20 Zyklen weniger)
- [ ] `RuntimeConfigService` hat KEINE Dependency auf `runtime-safe-cast.ts`
- [ ] `runtime-safe-cast.ts` nur noch DI-Container-spezifische Casts
- [ ] Neue `type-casts.ts` mit generischen Utilities
- [ ] `ModuleEventRegistrar` nutzt spezifische Token-Imports

### Code Quality

- [ ] Klare Separation: DI-spezifisch vs. generisch
- [ ] Inline Casts wo möglich (weniger indirection)
- [ ] Keine transitiven Dependencies über Utility-Dateien

---

## 🔙 Rollback-Plan

### Phase 1 Rollback:

```powershell
# Lösche type-casts.ts
Remove-Item "src/infrastructure/di/types/utilities/type-casts.ts"

# Revert RuntimeConfigService
git checkout src/application/services/RuntimeConfigService.ts

git revert HEAD
```

### Phase 2 Rollback:

```powershell
# Revert runtime-safe-cast.ts
git checkout src/infrastructure/di/types/utilities/runtime-safe-cast.ts

git revert HEAD
git revert HEAD~1
```

### Kompletter Rollback:

```powershell
git reset --hard HEAD~7
```

---

## 📊 Impact-Analyse

### Betroffene Services (direkt)

1. ✅ **RuntimeConfigService** - Refactored (Inline Cast)
2. ✅ **ModuleEventRegistrar** - Token-Imports optimiert
3. ✅ **runtime-safe-cast.ts** - Aufgeteilt

### Betroffene Services (transitiv)

- Alle Services die `runtime-safe-cast.ts` importieren
- Automatisch migriert durch PowerShell-Script
- Geschätzt: 15-20 Dateien

### Performance Impact

**Positiv:**
- ✅ Weniger transitive Imports → schnellere TypeScript Compilation
- ✅ Besseres Tree-Shaking durch spezifische Token-Imports
- ✅ Kleinere Bundle-Size

**Neutral:**
- ⚪ Runtime Performance unverändert (nur Type-Level Änderungen)

---

## 🎯 Lessons Learned

### Anti-Pattern: "God Utility File"

❌ **Problem:**
```typescript
// Eine Utility-Datei mit ALLEN Cast-Funktionen
// → Importiert ServiceType, ModuleEventRegistrar, etc.
// → Wird von VIELEN Services importiert
// → Erzeugt transitiven Dependency-Graph
```

✅ **Lösung:**
```typescript
// Separate Utility-Dateien nach Kontext
// - type-casts.ts: Generisch, keine Domain-Knowledge
// - runtime-safe-cast.ts: DI-spezifisch, kennt ServiceType
// - Inline Casts wo möglich
```

### Best Practice: Utility Functions

**Kriterien für shared utility function:**
1. ✅ Wird von mind. 3 verschiedenen Stellen genutzt
2. ✅ Hat KEINE oder MINIMALE Imports
3. ✅ Ist wirklich generisch (nicht Domain-spezifisch)

**Wann INLINE statt shared:**
1. ✅ Nur 1-2 Nutzungsstellen
2. ✅ Einfacher Cast (1-2 Zeilen)
3. ✅ Service-spezifische Logik

### Dependency Direction

```
✅ RICHTIG:
Services → Tokens (spezifisch)
DI-Container → ServiceType
DI-Container → runtime-safe-cast.ts

❌ FALSCH:
Services → runtime-safe-cast.ts → ServiceType → Services (Zyklus!)
```

---

## 📚 Weiterführende Links

- [ADR: DI Type Safety](../adr/ADR-XXX-di-type-safety.md)
- [Circular Dependencies Best Practices](../architecture/circular-deps-prevention.md)
- [Plan 1: Token Hub Problem](./CIRCULAR-DEPS-FIX-PLAN-1-TOKENS.md) (Dependency für Phase 3)

---

**Status:** 🟡 BEREIT ZUR UMSETZUNG
**Priorität:** 🟠 HOCH (20+ Zyklen)
**Risiko:** 🟡 MITTEL (Viele Dateien betroffen)
**Dependencies:** ✅ Sollte NACH Plan 1 umgesetzt werden (ServiceType Registry)

