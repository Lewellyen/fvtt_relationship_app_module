# Layer-Violations Lösungsplan

**Datum:** 2025-12-07
**Status:** 📋 Konkreter Umsetzungsplan
**Model:** Claude Sonnet 4.5

## Grundprinzip

**Application Layer darf nur mit Domain Ports arbeiten. Die Implementierung der Domain Ports findet sich dann in Infrastructure.**

## Übersicht der Verletzungen

- **Application → Infrastructure:** 7 Dateien
- **Infrastructure → Framework:** 3 Dateien
- **Gesamt:** 10 Verletzungen

---

## Phase 1: Domain Layer Erweiterungen

### 1.1 Domain Port für RuntimeConfigService erstellen

**Ziel:** Application Layer verwendet Domain Port statt direkt RuntimeConfigService

**Schritte:**

1. **Domain Port Interface erstellen:**
   - **Datei:** `src/domain/ports/platform-runtime-config-port.interface.ts`
   - **Inhalt:**
   ```typescript
   import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";

   /**
    * Platform-agnostic port for runtime configuration management.
    * Provides access to merged configuration (build-time defaults + runtime settings).
    */
   export interface PlatformRuntimeConfigPort {
     /**
      * Returns the current value for the given configuration key.
      */
     get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K];

     /**
      * Updates the configuration value based on platform settings.
      */
     setFromPlatform<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void;

     /**
      * Registers a listener for the given key. Returns an unsubscribe function.
      */
     onChange<K extends RuntimeConfigKey>(
       key: K,
       listener: (value: RuntimeConfigValues[K]) => void
     ): () => void;
   }
   ```

2. **Domain Types für RuntimeConfig erstellen:**
   - **Datei:** `src/domain/types/runtime-config.ts`
   - **Inhalt:** Types von `RuntimeConfigService.ts` hierher verschieben
   ```typescript
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
   ```

3. **RuntimeConfigService anpassen:**
   - **Datei:** `src/application/services/RuntimeConfigService.ts`
   - **Änderung:** Implementiert `PlatformRuntimeConfigPort` statt direkter Klasse
   - **Import:** Types aus `@/domain/types/runtime-config` statt lokal

### 1.2 Domain Port für HealthCheckRegistry erstellen

**Ziel:** Application Layer verwendet Domain Port statt direkt HealthCheckRegistry

**Schritte:**

1. **Domain Port Interface erstellen:**
   - **Datei:** `src/domain/ports/platform-health-check-port.interface.ts`
   - **Inhalt:**
   ```typescript
   import type { HealthCheck } from "@/domain/types/health-check";

   /**
    * Platform-agnostic port for health check registry.
    * Provides centralized health monitoring for services.
    */
   export interface PlatformHealthCheckPort {
     /**
      * Registers a health check.
      */
     register(check: HealthCheck): void;

     /**
      * Unregisters a health check by name.
      */
     unregister(name: string): void;

     /**
      * Runs all registered health checks.
      * @returns Map of check name to health status (true = healthy, false = unhealthy)
      */
     runAll(): Map<string, boolean>;

     /**
      * Gets a specific health check by name.
      */
     getCheck(name: string): HealthCheck | undefined;

     /**
      * Gets all registered health checks.
      */
     getAllChecks(): HealthCheck[];
   }
   ```

2. **Domain Type für HealthCheck erstellen:**
   - **Datei:** `src/domain/types/health-check.ts`
   - **Inhalt:** Interface von `health-check.interface.ts` hierher verschieben
   ```typescript
   /**
    * Interface for health checks.
    * Services can implement this to provide health status.
    */
   export interface HealthCheck {
     /**
      * Unique identifier for this health check.
      */
     readonly name: string;

     /**
      * Performs the health check.
      * @returns true if healthy, false otherwise
      */
     check(): boolean;

     /**
      * Optional: Provides detailed error message if unhealthy.
      */
     getDetails?(): string | null;

     /**
      * Cleanup method for disposing resources.
      */
     dispose(): void;
   }
   ```

3. **HealthCheckRegistry anpassen:**
   - **Datei:** `src/application/health/HealthCheckRegistry.ts`
   - **Änderung:** Implementiert `PlatformHealthCheckPort` statt direkter Klasse
   - **Import:** `HealthCheck` aus `@/domain/types/health-check`

### 1.3 InjectionToken Type in Domain verschieben

**Ziel:** Application Layer importiert Type aus Domain, nicht Infrastructure

**Schritte:**

1. **Domain Type erstellen:**
   - **Datei:** `src/domain/types/injection-token.ts`
   - **Inhalt:**
   ```typescript
   /**
    * A branded type for dependency injection tokens.
    * Uses a phantom property (`__unknown`) to associate the token with a service type at compile time.
    * This ensures type safety: a `InjectionToken<Logger>` cannot be used where a `InjectionToken<Database>` is expected.
    *
    * @template T - The type of service this token represents
    */
   export type InjectionToken<T> = symbol & {
     __serviceType?: T;
   };
   ```

2. **Infrastructure Type anpassen:**
   - **Datei:** `src/infrastructure/di/types/core/injectiontoken.ts`
   - **Änderung:** Re-export aus Domain statt lokaler Definition
   ```typescript
   export type { InjectionToken } from "@/domain/types/injection-token";
   ```

---

## Phase 2: Application Layer Token-Migration

### 2.1 Application-Tokens nach Application verschieben

**Ziel:** Alle Application-spezifischen Tokens in Application Layer definieren

**Schritte:**

1. **RuntimeConfig Token nach Application verschieben:**
   - **Alte Datei:** `src/infrastructure/shared/tokens/core/runtime-config.token.ts` → **LÖSCHEN**
   - **Neue Datei:** `src/application/tokens/runtime-config.token.ts`
   - **Inhalt:**
   ```typescript
   import { createInjectionToken } from "@/application/utils/token-factory";
   import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";

   /**
    * DI Token for PlatformRuntimeConfigPort.
    *
    * Provides access to the merged configuration layer that combines build-time
    * environment defaults with runtime platform settings.
    */
   export const runtimeConfigToken = createInjectionToken<PlatformRuntimeConfigPort>(
     "PlatformRuntimeConfigPort"
   );
   ```

2. **HealthCheckRegistry Token nach Application verschieben:**
   - **Alte Datei:** `src/infrastructure/shared/tokens/core/health-check-registry.token.ts` → **LÖSCHEN**
   - **Neue Datei:** `src/application/tokens/health-check-registry.token.ts`
   - **Inhalt:**
   ```typescript
   import { createInjectionToken } from "@/application/utils/token-factory";
   import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";

   /**
    * DI Token for PlatformHealthCheckPort.
    *
    * Central registry for health checks that can be dynamically registered.
    */
   export const healthCheckRegistryToken = createInjectionToken<PlatformHealthCheckPort>(
     "PlatformHealthCheckPort"
   );
   ```

3. **PlatformSettingsRegistrationPort Token nach Application verschieben:**
   - **Alte Datei:** `src/infrastructure/shared/tokens/ports/platform-settings-registration-port.token.ts` → **LÖSCHEN**
   - **Neue Datei:** `src/application/tokens/domain-ports.tokens.ts` → **ERWEITERN**
   - **Hinzufügen:**
   ```typescript
   import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";

   export const platformSettingsRegistrationPortToken = createInjectionToken<PlatformSettingsRegistrationPort>(
     "PlatformSettingsRegistrationPort"
   );
   ```

4. **PlatformModuleReadyPort Token nach Application verschieben:**
   - **Alte Datei:** `src/infrastructure/shared/tokens/ports/platform-module-ready-port.token.ts` → **LÖSCHEN**
   - **Neue Datei:** `src/application/tokens/domain-ports.tokens.ts` → **ERWEITERN**
   - **Hinzufügen:**
   ```typescript
   import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";

   export const platformModuleReadyPortToken = createInjectionToken<PlatformModuleReadyPort>(
     "PlatformModuleReadyPort"
   );
   ```

5. **Token-Factory Type-Import anpassen:**
   - **Datei:** `src/application/utils/token-factory.ts`
   - **Änderung:** `InjectionToken` aus Domain importieren
   ```typescript
   import type { InjectionToken } from "@/domain/types/injection-token";
   ```

---

## Phase 3: Application Layer Service-Anpassungen

### 3.1 RuntimeConfigSync anpassen

**Datei:** `src/application/services/RuntimeConfigSync.ts`

**Änderungen:**
- Zeile 13: `runtimeConfigToken` aus `@/application/tokens/runtime-config.token` importieren
- Zeile 44: `RuntimeConfigService` → `PlatformRuntimeConfigPort` (Type-Änderung)
- Zeile 66: `setFromFoundry` → `setFromPlatform` (Methodenname anpassen)
- Zeile 103: `setFromFoundry` → `setFromPlatform` (Methodenname anpassen)

**Code:**
```typescript
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
// ... andere Imports

export class RuntimeConfigSync {
  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly notifications: PlatformNotificationPort
  ) {}

  // ... Methoden anpassen: setFromFoundry → setFromPlatform
}
```

### 3.2 ModuleSettingsRegistrar anpassen

**Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

**Änderungen:**
- Zeile 18: `platformSettingsRegistrationPortToken` aus `@/application/tokens/domain-ports.tokens` importieren
- Alle anderen Imports bleiben gleich

### 3.3 ModuleHealthService anpassen

**Datei:** `src/application/services/ModuleHealthService.ts`

**Änderungen:**
- Zeile 2: `HealthCheckRegistry` → `PlatformHealthCheckPort` (Type-Änderung)
- Zeile 3: `healthCheckRegistryToken` aus `@/application/tokens/health-check-registry.token` importieren
- Zeile 20: Constructor-Parameter Type anpassen

**Code:**
```typescript
import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";
import { healthCheckRegistryToken } from "@/application/tokens/health-check-registry.token";

export class ModuleHealthService {
  constructor(private readonly registry: PlatformHealthCheckPort) {}
  // ... Rest bleibt gleich
}
```

### 3.4 ModuleReadyService anpassen

**Datei:** `src/application/services/module-ready-service.ts`

**Änderungen:**
- Zeile 10: `platformModuleReadyPortToken` aus `@/application/tokens/domain-ports.tokens` importieren
- Zeile 13: `InjectionToken` aus `@/domain/types/injection-token` importieren

### 3.5 ContainerHealthCheck anpassen

**Datei:** `src/application/health/ContainerHealthCheck.ts`

**Änderungen:**
- Zeile 4: `healthCheckRegistryToken` aus `@/application/tokens/health-check-registry.token` importieren
- Zeile 2: `HealthCheck` aus `@/domain/types/health-check` importieren
- Zeile 3: `HealthCheckRegistry` → `PlatformHealthCheckPort` (Type-Änderung)

**Code:**
```typescript
import type { HealthCheck } from "@/domain/types/health-check";
import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";
import { healthCheckRegistryToken } from "@/application/tokens/health-check-registry.token";

export class DIContainerHealthCheck extends ContainerHealthCheck {
  static dependencies = [platformContainerPortToken, healthCheckRegistryToken] as const;

  constructor(container: PlatformContainerPort, registry: PlatformHealthCheckPort) {
    super(container);
    registry.register(this);
  }
}
```

### 3.6 MetricsHealthCheck anpassen

**Datei:** `src/application/health/MetricsHealthCheck.ts`

**Änderungen:**
- Zeile 3: `healthCheckRegistryToken` aus `@/application/tokens/health-check-registry.token` importieren
- Zeile 4: `HealthCheck` aus `@/domain/types/health-check` importieren
- Zeile 5: `HealthCheckRegistry` → `PlatformHealthCheckPort` (Type-Änderung)

**Code:**
```typescript
import type { HealthCheck } from "@/domain/types/health-check";
import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";
import { healthCheckRegistryToken } from "@/application/tokens/health-check-registry.token";

export class DIMetricsHealthCheck extends MetricsHealthCheck {
  static dependencies = [platformMetricsSnapshotPortToken, healthCheckRegistryToken] as const;

  constructor(metricsSnapshotPort: PlatformMetricsSnapshotPort, registry: PlatformHealthCheckPort) {
    super(metricsSnapshotPort);
    registry.register(this);
  }
}
```

---

## Phase 4: Infrastructure Layer Anpassungen

### 4.1 RuntimeConfigService Adapter erstellen

**Ziel:** Infrastructure implementiert Domain Port

**Schritte:**

1. **Adapter erstellen:**
   - **Datei:** `src/infrastructure/config/runtime-config-adapter.ts`
   - **Inhalt:**
   ```typescript
   import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
   import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
   import type { EnvironmentConfig } from "@/domain/types/environment-config";

   /**
    * Infrastructure adapter that wraps RuntimeConfigService as PlatformRuntimeConfigPort.
    */
   export class RuntimeConfigAdapter implements PlatformRuntimeConfigPort {
     private readonly service: RuntimeConfigService;

     constructor(env: EnvironmentConfig) {
       this.service = new RuntimeConfigService(env);
     }

     get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
       return this.service.get(key);
     }

     setFromPlatform<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
       this.service.setFromFoundry(key, value);
     }

     onChange<K extends RuntimeConfigKey>(
       key: K,
       listener: (value: RuntimeConfigValues[K]) => void
     ): () => void {
       return this.service.onChange(key, listener);
     }
   }
   ```

2. **Container-Registrierung anpassen:**
   - **Datei:** `src/framework/config/modules/core-services.config.ts` (oder entsprechende Config-Datei)
   - **Änderung:** `RuntimeConfigService` → `RuntimeConfigAdapter` registrieren
   - **Token:** `runtimeConfigToken` (aus Application)

### 4.2 HealthCheckRegistry Adapter erstellen

**Ziel:** Infrastructure implementiert Domain Port

**Schritte:**

1. **Adapter erstellen:**
   - **Datei:** `src/infrastructure/health/health-check-registry-adapter.ts`
   - **Inhalt:**
   ```typescript
   import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";
   import type { HealthCheck } from "@/domain/types/health-check";
   import { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";

   /**
    * Infrastructure adapter that wraps HealthCheckRegistry as PlatformHealthCheckPort.
    */
   export class HealthCheckRegistryAdapter implements PlatformHealthCheckPort {
     private readonly registry: HealthCheckRegistry;

     constructor() {
       this.registry = new HealthCheckRegistry();
     }

     register(check: HealthCheck): void {
       this.registry.register(check);
     }

     unregister(name: string): void {
       this.registry.unregister(name);
     }

     runAll(): Map<string, boolean> {
       return this.registry.runAll();
     }

     getCheck(name: string): HealthCheck | undefined {
       return this.registry.getCheck(name);
     }

     getAllChecks(): HealthCheck[] {
       return this.registry.getAllChecks();
     }
   }
   ```

2. **Container-Registrierung anpassen:**
   - **Datei:** `src/framework/config/modules/core-services.config.ts` (oder entsprechende Config-Datei)
   - **Änderung:** `HealthCheckRegistry` → `HealthCheckRegistryAdapter` registrieren
   - **Token:** `healthCheckRegistryToken` (aus Application)

### 4.3 Framework-Type-Definitionen in Infrastructure verschieben

**Ziel:** Infrastructure definiert Types selbst, importiert nicht von Framework

**Schritte:**

1. **ModuleApiInitializer Interface in Infrastructure definieren:**
   - **Datei:** `src/infrastructure/shared/types/module-api-initializer.interface.ts`
   - **Inhalt:** Interface-Extraktion aus `ModuleApiInitializer` Klasse
   ```typescript
   import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
   import type { Result } from "@/domain/types/result";

   /**
    * Interface for module API initialization.
    * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
    */
   export interface ModuleApiInitializer {
     /**
      * Exposes the module's public API to game.modules.get(MODULE_ID).api
      */
     expose(container: PlatformContainerPort): Result<void, string>;
   }
   ```

2. **BootstrapReadyHookService Interface in Infrastructure definieren:**
   - **Datei:** `src/infrastructure/shared/types/bootstrap-ready-hook-service.interface.ts`
   - **Inhalt:**
   ```typescript
   /**
    * Interface for bootstrap ready hook service.
    * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
    */
   export interface BootstrapReadyHookService {
     /**
      * Registers the ready event.
      */
     register(): void;
   }
   ```

3. **BootstrapInitHookService Interface in Infrastructure definieren:**
   - **Datei:** `src/infrastructure/shared/types/bootstrap-init-hook-service.interface.ts`
   - **Inhalt:**
   ```typescript
   /**
    * Interface for bootstrap init hook service.
    * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
    */
   export interface BootstrapInitHookService {
     /**
      * Registers the init event.
      */
     register(): void;
   }
   ```

4. **Token-Dateien anpassen:**
   - **Datei:** `src/infrastructure/shared/tokens/infrastructure/module-api-initializer.token.ts`
   - **Änderung:** Import aus Infrastructure statt Framework
   ```typescript
   import type { ModuleApiInitializer } from "@/infrastructure/shared/types/module-api-initializer.interface";
   ```

   - **Datei:** `src/infrastructure/shared/tokens/core/bootstrap-ready-hook-service.token.ts`
   - **Änderung:** Import aus Infrastructure statt Framework
   ```typescript
   import type { BootstrapReadyHookService } from "@/infrastructure/shared/types/bootstrap-ready-hook-service.interface";
   ```

   - **Datei:** `src/infrastructure/shared/tokens/core/bootstrap-init-hook-service.token.ts`
   - **Änderung:** Import aus Infrastructure statt Framework
   ```typescript
   import type { BootstrapInitHookService } from "@/infrastructure/shared/types/bootstrap-init-hook-service.interface";
   ```

5. **Framework-Klassen anpassen:**
   - **Datei:** `src/framework/core/api/module-api-initializer.ts`
   - **Änderung:** Klasse implementiert `ModuleApiInitializer` Interface
   ```typescript
   import type { ModuleApiInitializer } from "@/infrastructure/shared/types/module-api-initializer.interface";

   export class ModuleApiInitializer implements ModuleApiInitializer {
     // ... bestehender Code
   }
   ```

   - **Datei:** `src/framework/core/bootstrap-ready-hook.ts`
   - **Änderung:** Klasse implementiert `BootstrapReadyHookService` Interface
   ```typescript
   import type { BootstrapReadyHookService } from "@/infrastructure/shared/types/bootstrap-ready-hook-service.interface";

   export class BootstrapReadyHookService implements BootstrapReadyHookService {
     // ... bestehender Code
   }
   ```

   - **Datei:** `src/framework/core/bootstrap-init-hook.ts`
   - **Änderung:** Klasse implementiert `BootstrapInitHookService` Interface
   ```typescript
   import type { BootstrapInitHookService } from "@/infrastructure/shared/types/bootstrap-init-hook-service.interface";

   export class BootstrapInitHookService implements BootstrapInitHookService {
     // ... bestehender Code
   }
   ```

---

## Phase 5: Abhängigkeiten und Reihenfolge

### 5.1 Implementierungsreihenfolge

**Kritische Abhängigkeiten:**

1. **Zuerst:** Domain Layer Erweiterungen (Phase 1)
   - Domain Ports müssen existieren, bevor Application sie verwenden kann
   - Domain Types müssen existieren, bevor sie importiert werden können

2. **Dann:** Application Layer Token-Migration (Phase 2)
   - Tokens müssen in Application existieren, bevor Services sie importieren können

3. **Dann:** Application Layer Service-Anpassungen (Phase 3)
   - Services können erst angepasst werden, wenn Tokens und Ports existieren

4. **Zuletzt:** Infrastructure Layer Anpassungen (Phase 4)
   - Adapter können erst erstellt werden, wenn Domain Ports existieren
   - Container-Registrierungen müssen am Ende angepasst werden

### 5.2 Test-Reihenfolge

Nach jeder Phase:
1. TypeScript-Kompilierung prüfen (`npm run build`)
2. Linter prüfen (`npm run lint`)
3. Unit-Tests ausführen (`npm run test`)
4. Integration-Tests prüfen (falls vorhanden)

---

## Phase 6: Validierung

### 6.1 Dependency-Check

Nach allen Änderungen prüfen:

```bash
# Prüfe, ob Application noch Infrastructure importiert
grep -r "@/infrastructure" src/application/

# Prüfe, ob Infrastructure noch Framework importiert (außer Types)
grep -r "@/framework" src/infrastructure/ | grep -v "type "

# Prüfe, ob Domain keine anderen Layer importiert
grep -r "@/application\|@/infrastructure\|@/framework" src/domain/
```

### 6.2 Layer-Violations erneut prüfen

- Alle 10 Verletzungen sollten behoben sein
- Keine neuen Verletzungen eingeführt worden sein

---

## Zusammenfassung der Datei-Änderungen

### Neue Dateien (Domain):
- `src/domain/ports/platform-runtime-config-port.interface.ts`
- `src/domain/ports/platform-health-check-port.interface.ts`
- `src/domain/types/runtime-config.ts`
- `src/domain/types/health-check.ts`
- `src/domain/types/injection-token.ts`

### Neue Dateien (Application):
- `src/application/tokens/runtime-config.token.ts`
- `src/application/tokens/health-check-registry.token.ts`

### Neue Dateien (Infrastructure):
- `src/infrastructure/config/runtime-config-adapter.ts`
- `src/infrastructure/health/health-check-registry-adapter.ts`
- `src/infrastructure/shared/types/module-api-initializer.interface.ts`
- `src/infrastructure/shared/types/bootstrap-ready-hook-service.interface.ts`
- `src/infrastructure/shared/types/bootstrap-init-hook-service.interface.ts`

### Zu löschende Dateien:
- `src/infrastructure/shared/tokens/core/runtime-config.token.ts`
- `src/infrastructure/shared/tokens/core/health-check-registry.token.ts`
- `src/infrastructure/shared/tokens/ports/platform-settings-registration-port.token.ts`
- `src/infrastructure/shared/tokens/ports/platform-module-ready-port.token.ts`

### Zu ändernde Dateien:
- `src/application/services/RuntimeConfigSync.ts`
- `src/application/services/ModuleSettingsRegistrar.ts`
- `src/application/services/ModuleHealthService.ts`
- `src/application/services/module-ready-service.ts`
- `src/application/health/ContainerHealthCheck.ts`
- `src/application/health/MetricsHealthCheck.ts`
- `src/application/utils/token-factory.ts`
- `src/application/tokens/domain-ports.tokens.ts`
- `src/infrastructure/shared/tokens/infrastructure/module-api-initializer.token.ts`
- `src/infrastructure/shared/tokens/core/bootstrap-ready-hook-service.token.ts`
- `src/infrastructure/shared/tokens/core/bootstrap-init-hook-service.token.ts`
- `src/framework/core/api/module-api-initializer.ts`
- `src/framework/core/bootstrap-ready-hook.ts`
- `src/framework/core/bootstrap-init-hook.ts`
- `src/infrastructure/di/types/core/injectiontoken.ts`
- Container-Registrierungs-Dateien (Config-Module)

---

## Nächste Schritte

1. ✅ Lösungsplan erstellt
2. ⏳ Phase 1: Domain Layer Erweiterungen
3. ⏳ Phase 2: Application Layer Token-Migration
4. ⏳ Phase 3: Application Layer Service-Anpassungen
5. ⏳ Phase 4: Infrastructure Layer Anpassungen
6. ⏳ Phase 5: Tests und Validierung
7. ⏳ Phase 6: Dokumentation aktualisieren

