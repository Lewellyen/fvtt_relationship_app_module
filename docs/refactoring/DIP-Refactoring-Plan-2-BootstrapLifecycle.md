# DIP-Refactoring Plan 2: Bootstrap nutzt globale Foundry-Hooks

**Datum:** 2025-01-27  
**Betroffene Komponenten:** `init-solid.ts`, Bootstrap-Lifecycle  
**Ziel:** Entkopplung des Bootstrap-Flows vom globalen `Hooks`-Objekt durch Einführung von zwei separaten Services: `InitPhaseService` und `ReadyPhaseService`

---

## Problembeschreibung

### DIP-Verletzung

Der `init-solid.ts` nutzt direkt das globale Foundry-`Hooks`-Objekt:

```typescript
// src/core/init-solid.ts (aktuell)
function initializeFoundryModule(): void {
  // ... Container-Holung ...
  
  // ❌ Direkter Zugriff auf globales Hooks
  Hooks.on("init", () => {
    // ... init-Logik ...
  });

  Hooks.on("ready", () => {
    // ... ready-Logik ...
  });
}
```

**Probleme:**
- Direkte Kopplung an globales Foundry-`Hooks`
- Nicht testbar ohne Foundry-Globals
- Verstößt gegen Port-Adapter-Pattern
- `FoundryHooksService` existiert bereits, wird aber nicht genutzt
- Container ist bereits vorhanden, aber nicht genutzt für Hook-Registrierung

### Warum ist das ein Problem?

1. **Container existiert bereits:** Nach `CompositionRoot.bootstrap()` ist der Container mit allen Services (inkl. `FoundryHooksService`) verfügbar
2. **Inkonsistenz:** Rest des Codes nutzt `FoundryHooksService`, nur Bootstrap nutzt Globals
3. **Testbarkeit:** Bootstrap-Logik kann nicht isoliert getestet werden
4. **Henne-Ei-Problem gelöst:** Container wird erstellt, DANN können Services geholt werden

### Aktuelle Situation

```mermaid
init-solid.ts
  ├─ CompositionRoot.bootstrap() → Container erstellt ✅
  ├─ initializeFoundryModule()
  │   ├─ Container holen ✅
  │   ├─ Logger holen ✅
  │   └─ Hooks.on() direkt ❌
  │       ├─ "init" Hook → Logik inline (68-156 Zeilen)
  │       └─ "ready" Hook → Logik inline (158-161 Zeilen)
```

**Container verfügbar, aber nicht genutzt für Hook-Registrierung!**

---

## Ziel-Architektur

### Zwei separate Services

Statt einer großen `initializeFoundryModule()` Funktion mit beiden Hook-Callbacks:

```
┌─────────────────────────────────────┐
│   init-solid.ts                     │  (Bootstrap-Orchestrator)
│   - Container erstellen             │
│   - Services aus Container holen    │
│   - Lifecycle-Services initialisieren│
└──────────────┬──────────────────────┘
               │
               ├─→ InitPhaseService
               │   - Register "init" Hook via FoundryHooksService
               │   - Handle init-Phase Logic
               │
               └─→ ReadyPhaseService
                   - Register "ready" Hook via FoundryHooksService
                   - Handle ready-Phase Logic
```

### Service-Struktur

```typescript
// InitPhaseService: Verantwortlich für init-Phase
class InitPhaseService {
  constructor(
    private readonly hooks: FoundryHooks,      // ✅ Port statt Global
    private readonly logger: Logger,
    // ... weitere Dependencies direkt injiziert
  ) {}

  register(container: ServiceContainer): Result<void, FoundryError> {
    return this.hooks.on("init", () => this.handleInit(container));
  }

  private handleInit(container: ServiceContainer): void {
    // ... init-Logik mit Services aus Container ...
  }
}

// ReadyPhaseService: Verantwortlich für ready-Phase
class ReadyPhaseService {
  constructor(
    private readonly hooks: FoundryHooks,      // ✅ Port statt Global
    private readonly logger: Logger,
  ) {}

  register(): Result<void, FoundryError> {
    return this.hooks.on("ready", () => this.handleReady());
  }

  private handleReady(): void {
    // ... ready-Logik ...
  }
}
```

**Design-Entscheidung:** Container wird bei `register()` übergeben, da:
- `apiInitializer.expose()` benötigt den Container
- Einfacher als ContainerGetter-Interface
- Funktionaler Ansatz (Parameter statt Dependency)

---

## Schritt-für-Schritt Refactoring

### Phase 1: InitPhaseService erstellen

#### 1.1 InitPhaseService implementieren

**Datei:** `src/core/bootstrap/init-phase-service.ts`

```typescript
import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Logger } from "@/interfaces/logger";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { ModuleApiInitializer } from "@/core/api/module-api-initializer";
import type { ModuleSettingsRegistrar } from "@/core/module-settings-registrar";
import type { ModuleHookRegistrar } from "@/core/module-hook-registrar";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";
import { LOG_LEVEL_SCHEMA } from "@/foundry/validation/setting-schemas";
import {
  loggerToken,
  notificationCenterToken,
  uiChannelToken,
  moduleApiInitializerToken,
  moduleSettingsRegistrarToken,
  moduleHookRegistrarToken,
} from "@/tokens/tokenindex";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import { foundryHooksToken } from "@/foundry/foundrytokens";

/**
 * Service for handling the Foundry 'init' phase lifecycle.
 * 
 * DIP-Compliant: Uses FoundryHooks port instead of global Hooks.
 * Orchestrates all initialization tasks:
 * - UI channel registration
 * - Module API exposition
 * - Settings registration
 * - Logger configuration
 * - Hook registration
 */
export class InitPhaseService {
  constructor(
    private readonly hooks: FoundryHooks,
    private readonly logger: Logger
  ) {}

  /**
   * Registers the init hook with Foundry.
   * Must be called after container is created but before Foundry init phase.
   * 
   * @param container - The service container (needed for API exposition)
   * @returns Result indicating success or error
   */
  register(container: ServiceContainer): Result<void, FoundryError> {
    // Register init hook via FoundryHooksService (DIP-compliant)
    const result = this.hooks.on("init", () => this.handleInit(container));
    
    if (!result.ok) {
      this.logger.error("Failed to register init hook", result.error);
      return result;
    }

    this.logger.debug("Init hook registered successfully");
    return { ok: true, value: undefined };
  }

  private handleInit(container: ServiceContainer): void {
    this.logger.info("init-phase");

    // 1. Add UI notifications channel
    this.attachUIChannel(container);

    // 2. Expose Module API
    this.exposeModuleAPI(container);

    // 3. Register module settings (must be done before settings are read)
    this.registerModuleSettings(container);

    // 4. Configure logger with settings
    this.configureLogger(container);

    // 5. Register module hooks
    this.registerModuleHooks(container);

    this.logger.info("init-phase completed");
  }

  private attachUIChannel(container: ServiceContainer): void {
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!notificationCenterResult.ok) {
      this.logger.warn(
        "NotificationCenter could not be resolved during init; UI channel not attached",
        notificationCenterResult.error
      );
      return;
    }

    const uiChannelResult = container.resolveWithError(uiChannelToken);
    if (!uiChannelResult.ok) {
      this.logger.warn(
        "UI channel could not be resolved; NotificationCenter will remain console-only",
        uiChannelResult.error
      );
      return;
    }

    notificationCenterResult.value.addChannel(uiChannelResult.value);
    this.logger.debug("UI channel attached to notification center");
  }

  private exposeModuleAPI(container: ServiceContainer): void {
    const apiInitializerResult = container.resolveWithError(moduleApiInitializerToken);
    if (!apiInitializerResult.ok) {
      this.logger.error(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
      return;
    }

    const exposeResult = apiInitializerResult.value.expose(container);
    if (!exposeResult.ok) {
      this.logger.error(`Failed to expose API: ${exposeResult.error}`);
      return;
    }

    this.logger.debug("Module API exposed successfully");
  }

  private registerModuleSettings(container: ServiceContainer): void {
    const settingsRegistrarResult = container.resolveWithError(moduleSettingsRegistrarToken);
    if (!settingsRegistrarResult.ok) {
      this.logger.error(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
      return;
    }

    settingsRegistrarResult.value.registerAll();
    this.logger.debug("Module settings registered successfully");
  }

  private configureLogger(container: ServiceContainer): void {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    if (!settingsResult.ok) {
      this.logger.debug("Settings not available yet, skipping logger configuration");
      return;
    }

    const logLevelResult = settingsResult.value.get(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      LOG_LEVEL_SCHEMA
    );

    if (logLevelResult.ok && this.logger.setMinLevel) {
      this.logger.setMinLevel(logLevelResult.value);
      this.logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }
  }

  private registerModuleHooks(container: ServiceContainer): void {
    const hookRegistrarResult = container.resolveWithError(moduleHookRegistrarToken);
    if (!hookRegistrarResult.ok) {
      this.logger.error(`Failed to resolve ModuleHookRegistrar: ${hookRegistrarResult.error.message}`);
      return;
    }

    const hookRegistrationResult = hookRegistrarResult.value.registerAll();
    if (!hookRegistrationResult.ok) {
      this.logger.error("Failed to register one or more module hooks", {
        errors: hookRegistrationResult.error.map((e) => e.message),
      });
      return;
    }

    this.logger.debug("Module hooks registered successfully");
  }
}

// DI-Wrapper
export class DIInitPhaseService extends InitPhaseService {
  static dependencies = [foundryHooksToken, loggerToken] as const;

  constructor(hooks: FoundryHooks, logger: Logger) {
    super(hooks, logger);
  }
}
```

---

### Phase 2: ReadyPhaseService erstellen

#### 2.1 ReadyPhaseService implementieren

**Datei:** `src/core/bootstrap/ready-phase-service.ts`

```typescript
import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Logger } from "@/interfaces/logger";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { loggerToken } from "@/tokens/tokenindex";

/**
 * Service for handling the Foundry 'ready' phase lifecycle.
 * 
 * DIP-Compliant: Uses FoundryHooks port instead of global Hooks.
 */
export class ReadyPhaseService {
  constructor(
    private readonly hooks: FoundryHooks,
    private readonly logger: Logger
  ) {}

  /**
   * Registers the ready hook with Foundry.
   * Must be called after container is created but before Foundry ready phase.
   * 
   * @returns Result indicating success or error
   */
  register(): Result<void, FoundryError> {
    // Register ready hook via FoundryHooksService (DIP-compliant)
    const result = this.hooks.on("ready", () => this.handleReady());
    
    if (!result.ok) {
      this.logger.error("Failed to register ready hook", result.error);
      return result;
    }

    this.logger.debug("Ready hook registered successfully");
    return { ok: true, value: undefined };
  }

  private handleReady(): void {
    this.logger.info("ready-phase");
    // ... ready-Logik (aktuell nur Logging) ...
    this.logger.info("ready-phase completed");
  }
}

// DI-Wrapper
export class DIReadyPhaseService extends ReadyPhaseService {
  static dependencies = [foundryHooksToken, loggerToken] as const;

  constructor(hooks: FoundryHooks, logger: Logger) {
    super(hooks, logger);
  }
}
```

---

### Phase 3: init-solid.ts refactoren

#### 3.1 Neue init-solid.ts

**Datei:** `src/core/init-solid.ts` (refactored)

```typescript
import { MODULE_CONSTANTS } from "../constants";
import { isOk } from "@/utils/functional/result";
import {
  loggerToken,
  initPhaseServiceToken,
  readyPhaseServiceToken,
} from "@/tokens/tokenindex";
import { CompositionRoot } from "@/core/composition-root";
import { tryGetFoundryVersion } from "@/foundry/versioning/versiondetector";
import { BootstrapErrorHandler } from "@/core/bootstrap-error-handler";
import type { Result } from "@/types/result";
import type { ServiceContainer } from "@/di_infrastructure/container";

/**
 * Boot-Orchestrierung für das Modul.
 *
 * Ablauf:
 * - Vor init: DI-Container erstellen (CompositionRoot.bootstrap) und bei Fehler abbrechen
 * - Nach Container-Erstellung: Lifecycle-Services aus Container holen und Hooks registrieren
 * - In init/ready: Services orchestrieren die jeweilige Phase
 *
 * DIP-Compliant: Nutzt FoundryHooksService über InitPhaseService/ReadyPhaseService
 * statt direktes globales Hooks-Objekt.
 */
function initializeFoundryModule(): void {
  const containerResult = root.getContainer();
  /* v8 ignore start -- @preserve */
  // Edge case: getContainer() fails after successful bootstrap.
  // This is extremely unlikely in practice, but the error path exists for defensive programming.
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  /* v8 ignore stop -- @preserve */

  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  if (!loggerResult.ok) {
    console.error(
      `${MODULE_CONSTANTS.LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`
    );
    return;
  }
  const logger = loggerResult.value;

  // ✅ InitPhaseService aus Container holen (DIP-compliant)
  const initPhaseServiceResult = containerResult.value.resolveWithError(initPhaseServiceToken);
  if (!initPhaseServiceResult.ok) {
    logger.error(`Failed to resolve InitPhaseService: ${initPhaseServiceResult.error.message}`);
    return;
  }

  // ✅ Register init hook via service (statt globales Hooks.on)
  const initRegistrationResult = initPhaseServiceResult.value.register(containerResult.value);
  if (!initRegistrationResult.ok) {
    logger.error(`Failed to register init hook: ${initRegistrationResult.error.message}`);
    return;
  }

  // ✅ ReadyPhaseService aus Container holen
  const readyPhaseServiceResult = containerResult.value.resolveWithError(readyPhaseServiceToken);
  if (!readyPhaseServiceResult.ok) {
    logger.error(`Failed to resolve ReadyPhaseService: ${readyPhaseServiceResult.error.message}`);
    return;
  }

  // ✅ Register ready hook via service (statt globales Hooks.on)
  const readyRegistrationResult = readyPhaseServiceResult.value.register();
  if (!readyRegistrationResult.ok) {
    logger.error(`Failed to register ready hook: ${readyRegistrationResult.error.message}`);
    return;
  }

  logger.debug("Bootstrap lifecycle hooks registered successfully");
}

// Eager bootstrap DI before Foundry init
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);

/**
 * Internal export for testing purposes only.
 * Returns the container from init-solid.ts.
 * This allows integration tests to use the same container instance as the module.
 *
 * @internal - For testing only
 */
export function getRootContainer(): Result<ServiceContainer, string> {
  return root.getContainer();
}

/* v8 ignore start -- @preserve */
/* Bootstrap-Fehlerpfade sind stark Foundry-versionsabhängig und schwer
 * deterministisch in Unit-Tests abzudecken. Die Logik wird über Integrationspfade geprüft;
 * für das Coverage-Gateway markieren wir diese Zweige vorerst als ignoriert. */
if (!bootstrapOk) {
  // Detect version once and reuse for both error logging and version-specific checks
  const foundryVersion = tryGetFoundryVersion();

  BootstrapErrorHandler.logError(bootstrapResult.error, {
    phase: "bootstrap",
    component: "CompositionRoot",
    metadata: {
      foundryVersion,
    },
  });

  // Check if error is due to old Foundry version
  let isOldFoundryVersion = false;
  if (
    typeof bootstrapResult.error === "string" &&
    bootstrapResult.error.includes("PORT_SELECTION_FAILED")
  ) {
    if (foundryVersion !== undefined && foundryVersion < 13) {
      isOldFoundryVersion = true;
      /* v8 ignore next -- @preserve */
      if (typeof ui !== "undefined" && ui?.notifications) {
        ui.notifications.error(
          `${MODULE_CONSTANTS.MODULE.NAME} benötigt mindestens Foundry VTT Version 13. ` +
            `Ihre Version: ${foundryVersion}. Bitte aktualisieren Sie Foundry VTT.`,
          { permanent: true }
        );
      }
    }
  }

  // Show generic error notification (only if not old Foundry version)
  if (!isOldFoundryVersion && typeof ui !== "undefined" && ui?.notifications) {
    ui.notifications?.error(
      `${MODULE_CONSTANTS.MODULE.NAME} failed to initialize. Check console for details.`,
      { permanent: true }
    );
  }

  // Soft abort: Don't proceed with initialization
  // (no throw, no return - just don't call initializeFoundryModule)
} else {
  // Only initialize if bootstrap succeeded
  initializeFoundryModule();
}
/* v8 ignore stop -- @preserve */
```

**Wichtigste Änderungen:**
- ❌ `Hooks.on("init", ...)` entfernt
- ❌ `Hooks.on("ready", ...)` entfernt
- ❌ `if (typeof Hooks === "undefined")` Guard entfernt (nicht mehr nötig)
- ✅ Services aus Container geholt
- ✅ `FoundryHooksService` wird indirekt über Services genutzt

---

### Phase 4: DI-Konfiguration anpassen

#### 4.1 Token erstellen

**Datei:** `src/tokens/tokenindex.ts` (ergänzen)

```typescript
export const initPhaseServiceToken = createToken<InitPhaseService>("initPhaseService");
export const readyPhaseServiceToken = createToken<ReadyPhaseService>("readyPhaseService");
```

#### 4.2 Services registrieren

**Datei:** `src/config/modules/bootstrap-services.config.ts` (neu)

```typescript
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { ok, err, isErr } from "@/utils/functional/result";
import { DIInitPhaseService } from "@/core/bootstrap/init-phase-service";
import { DIReadyPhaseService } from "@/core/bootstrap/ready-phase-service";
import { initPhaseServiceToken, readyPhaseServiceToken } from "@/tokens/tokenindex";

/**
 * Registers bootstrap lifecycle services.
 */
export function registerBootstrapServices(container: ServiceContainer): Result<void, string> {
  // Register InitPhaseService
  const initServiceResult = container.registerClass(
    initPhaseServiceToken,
    DIInitPhaseService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(initServiceResult)) {
    return err(`Failed to register InitPhaseService: ${initServiceResult.error.message}`);
  }

  // Register ReadyPhaseService
  const readyServiceResult = container.registerClass(
    readyPhaseServiceToken,
    DIReadyPhaseService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(readyServiceResult)) {
    return err(`Failed to register ReadyPhaseService: ${readyServiceResult.error.message}`);
  }

  return ok(undefined);
}
```

**Datei:** `src/config/dependencyconfig.ts` (ergänzen)

```typescript
import { registerBootstrapServices } from "./modules/bootstrap-services.config";

export function configureDependencies(container: ServiceContainer): Result<void, string> {
  // ... bestehende Registrierungen ...

  const bootstrapServicesResult = registerBootstrapServices(container);
  if (isErr(bootstrapServicesResult)) return bootstrapServicesResult;

  // ... rest ...
}
```

---

## Migration-Pfad

### Schritt 1: Neue Services erstellen (keine Breaking Changes)
- ✅ `InitPhaseService` erstellen
- ✅ `ReadyPhaseService` erstellen
- ✅ Tests schreiben
- ✅ Services registrieren (parallel zu bestehender Lösung)

### Schritt 2: init-solid.ts anpassen
- ✅ Services aus Container holen
- ✅ `Hooks.on()` durch Service-Aufrufe ersetzen
- ✅ Alte Hook-Callbacks entfernen
- ✅ Globale `Hooks`-Prüfung entfernen

### Schritt 3: Cleanup
- ✅ Tests aktualisieren
- ✅ v8 ignore Kommentare anpassen
- ✅ Code-Duplikation entfernen

---

## Test-Strategie

### Unit-Tests

#### InitPhaseService Test

```typescript
// src/core/bootstrap/__tests__/init-phase-service.test.ts
describe("InitPhaseService", () => {
  it("should register init hook via FoundryHooksService", () => {
    const mockHooks = createMockFoundryHooks();
    const mockLogger = createMockLogger();
    const mockContainer = createMockServiceContainer();
    
    const service = new InitPhaseService(mockHooks, mockLogger);

    const result = service.register(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockHooks.on).toHaveBeenCalledWith("init", expect.any(Function));
  });

  it("should handle init phase correctly", () => {
    // ... Test der handleInit-Logik ...
  });
});
```

#### ReadyPhaseService Test

```typescript
// src/core/bootstrap/__tests__/ready-phase-service.test.ts
describe("ReadyPhaseService", () => {
  it("should register ready hook via FoundryHooksService", () => {
    const mockHooks = createMockFoundryHooks();
    const mockLogger = createMockLogger();
    const service = new ReadyPhaseService(mockHooks, mockLogger);

    const result = service.register();

    expect(result.ok).toBe(true);
    expect(mockHooks.on).toHaveBeenCalledWith("ready", expect.any(Function));
  });
});
```

#### init-solid.ts Integration Test

```typescript
// src/core/__tests__/init-solid.test.ts
describe("init-solid", () => {
  it("should register hooks via services instead of global Hooks", () => {
    // Mock Container mit Services
    const mockInitService = createMockInitPhaseService();
    const mockReadyService = createMockReadyPhaseService();
    
    // Test dass Services aufgerufen werden, nicht globales Hooks
    // ...
  });
});
```

---

## Breaking Changes

### ⚠️ Keine Breaking Changes

- ✅ Externe APIs bleiben unverändert
- ✅ Bootstrap-Flow funktioniert identisch
- ✅ Nur interne Struktur ändert sich

### ⚠️ Interne Änderungen

- ⚠️ `init-solid.ts` Struktur ändert sich erheblich
- ⚠️ Neue Services werden benötigt
- ⚠️ DI-Config muss erweitert werden
- ⚠️ Globale `Hooks`-Prüfung wird entfernt

---

## Vorteile nach Refactoring

### ✅ DIP-Konformität
- Keine direkte Nutzung von globalem `Hooks`
- Konsistent mit Rest des Codes (`FoundryHooksService` wird überall genutzt)
- Port-Adapter-Pattern konsequent angewendet

### ✅ Testbarkeit
- Services isoliert testbar (keine Foundry-Globals nötig)
- init-solid.ts testbar mit Service-Mocks
- Klare Trennung der Concerns

### ✅ Wartbarkeit
- Init- und Ready-Logik getrennt (zwei separate Services)
- Einfach erweiterbar (neue Services für neue Phasen)
- Klare Verantwortlichkeiten

### ✅ Konsistenz
- Alle Hook-Registrierungen nutzen `FoundryHooksService`
- Einheitliches Pattern im gesamten Codebase

---

## Offene Fragen / Follow-ups

1. **Container-Passing:** Container bei `register()` übergeben oder via ContainerGetter-Interface?
   - **✅ Entscheidung:** Bei `register()` übergeben (funktionaler Ansatz, einfacher)

2. **Error-Handling:** Sollen Fehler bei Service-Auflösung zum Abort führen oder graceful degradation?
   - **✅ Entscheidung:** Abort (fail-fast Prinzip)

3. **Dependencies:** Sollen alle benötigten Services direkt injiziert werden oder Container-Lookups?
   - **✅ Entscheidung:** Container-Lookups in `handleInit()` (weniger Constructor-Parameter, Container ist sowieso verfügbar)

---

## Schätzung

- **Aufwand:** ~3-4 Stunden
- **Komplexität:** Mittel
- **Risiko:** Niedrig (parallele Implementierung möglich)
- **Breaking Changes:** Keine (nur interne Struktur)
