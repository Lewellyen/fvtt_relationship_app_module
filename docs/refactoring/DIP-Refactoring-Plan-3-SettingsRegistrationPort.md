# DIP-Refactoring Plan 3: Settings-Registrar mischt Domäne und Foundry-Details

**Datum:** 2025-01-27  
**Betroffene Komponenten:** `ModuleSettingsRegistrar`, `FoundrySettings`  
**Ziel:** Entkopplung der Settings-Registrierungslogik von Foundry-spezifischen Details durch Einführung eines `SettingsRegistrationPort`

---

## Problembeschreibung

### DIP-Verletzung

Der `ModuleSettingsRegistrar` orchestriert Geschäftslogik (RuntimeConfig-Sync), verwendet aber direkt Foundry-spezifische Schemas und Settings-API:

1. **FoundrySettings direkt**: Verwendet `FoundrySettings` Interface mit Foundry-spezifischen Typen
2. **Foundry-Schemas in Domäne**: Valibot-Schemas aus `@/foundry/validation/setting-schemas` werden in Geschäftslogik verwendet
3. **Gemischt**: Domänenlogik (RuntimeConfig-Sync) ist mit Infrastruktur (Foundry-Registrierung) vermischt

**Aktuelle Situation:**

```typescript
// src/core/module-settings-registrar.ts (aktuell)
export class ModuleSettingsRegistrar {
  constructor(
    private readonly foundrySettings: FoundrySettings, // ❌ Foundry-spezifisch
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly notifications: NotificationCenter,
    private readonly i18n: I18nFacadeService,
    private readonly logger: Logger
  ) {}

  registerAll(): void {
    // ❌ Nutzt direkt FoundrySettings
    this.registerDefinition(
      logLevelSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL],
      this.foundrySettings, // ❌ Foundry-API direkt
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
  }

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    foundrySettings: FoundrySettings, // ❌ Foundry-spezifisch
    runtimeConfig: RuntimeConfigService,
    notifications: NotificationCenter,
    i18n: I18nFacadeService,
    logger: Logger
  ): void {
    // ❌ Foundry-Schemas in Geschäftslogik
    const config = definition.createConfig(i18n, logger);
    // ...
    const result = foundrySettings.register( // ❌ Direkte Foundry-API
      MODULE_CONSTANTS.MODULE.ID,
      definition.key,
      configWithRuntimeBridge
    );
    // ...
    const currentValue = foundrySettings.get( // ❌ Direkte Foundry-API
      MODULE_CONSTANTS.MODULE.ID,
      settingKey,
      binding.schema // ❌ Foundry-Schema
    );
  }
}
```

**Probleme:**
- Domänenlogik ist an Foundry gebunden
- Nicht testbar ohne Foundry-Mocks
- Foundry-Schemas sind Teil der Geschäftslogik
- RuntimeConfig-Sync (Domäne) vermischt mit Foundry-Registrierung (Infrastruktur)

---

## Ziel-Architektur

### Port-Adapter-Pattern

```
┌─────────────────────────────────────┐
│   ModuleSettingsRegistrar           │  (Domäne)
│   - registerAll()                   │
│   - RuntimeConfig-Sync              │
│                                     │
│   Depends on:                       │
│   → SettingsRegistrationPort (Port) │  ← Abstraktion
└──────────────┬──────────────────────┘
               │
               │ implements
               ▼
┌─────────────────────────────────────┐
│   FoundrySettingsRegistrationAdapter│  (Infrastruktur)
│   - registerSetting()               │
│   - getSettingValue()               │
│                                     │
│   Uses:                             │
│   → FoundrySettings                 │
│   → Foundry-Schemas                 │
└─────────────────────────────────────┘
```

### Abstraktionsebene

**Port-Interface:**
- `registerSetting<T>(key: string, config: SettingConfig<T>): Result<void, SettingsError>`
- `getSettingValue<T>(key: string): Result<T | null, SettingsError>`
- Domänenneutrale Typen (`SettingConfig`, `SettingsError`)

**Adapter:**
- Implementiert Port mit Foundry-API
- Nutzt Foundry-Schemas intern
- Mappt Foundry-Typen → Domänentypen

---

## Schritt-für-Schritt Refactoring

### Phase 1: Port-Interface definieren

#### 1.1 Domänen-Typen definieren

**Datei:** `src/core/domain/settings.ts`

```typescript
/**
 * Domain model for setting configuration.
 * Platform-agnostic representation of a module setting.
 */
export interface SettingConfig<T> {
  /** Display name shown in settings UI */
  name: string;
  
  /** Help text shown below the setting */
  hint?: string;
  
  /** Scope determines where the setting is stored */
  scope: "world" | "client" | "user";
  
  /** Whether to show in module configuration UI */
  config: boolean;
  
  /** Type constructor (String, Number, Boolean) */
  type: typeof String | typeof Number | typeof Boolean;
  
  /** Available choices for select dropdown */
  choices?: Record<string | number, string>;
  
  /** Default value */
  default: T;
  
  /** Callback when setting changes (called immediately with new value) */
  onChange?: (value: T) => void;
}

/**
 * Domain error for settings operations.
 */
export type SettingsError =
  | { code: "SETTING_REGISTRATION_FAILED"; key: string; message: string }
  | { code: "SETTING_READ_FAILED"; key: string; message: string }
  | { code: "SETTING_WRITE_FAILED"; key: string; message: string }
  | { code: "INVALID_SETTING_VALUE"; key: string; message: string }
  | { code: "SETTING_NOT_FOUND"; key: string; message: string };
```

#### 1.2 SettingsRegistrationPort Interface definieren

**Datei:** `src/core/ports/settings-registration-port.interface.ts`

```typescript
import type { Result } from "@/types/result";
import type { SettingConfig, SettingsError } from "@/core/domain/settings";

/**
 * Port for settings registration and access.
 * 
 * Abstraction that allows the domain to work with settings
 * without knowing about the underlying platform (Foundry).
 * 
 * Implementations should be placed in platform-specific adapters
 * (e.g., foundry/adapters/FoundrySettingsRegistrationAdapter).
 */
export interface SettingsRegistrationPort {
  /**
   * Registers a new module setting.
   * Must be called during 'init' hook or earlier.
   * 
   * @param namespace - Module ID
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration
   * @returns Result indicating success or error
   */
  registerSetting<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, SettingsError>;

  /**
   * Gets the current value of a setting.
   * 
   * @param namespace - Module ID
   * @param key - Setting key
   * @param validator - Validation function to ensure type safety
   * @returns Result with setting value (null if not set) or error
   */
  getSettingValue<T>(
    namespace: string,
    key: string,
    validator: (value: unknown) => value is T
  ): Result<T | null, SettingsError>;

  /**
   * Sets the value of a setting.
   * Updates are persisted and trigger onChange callbacks.
   * 
   * @param namespace - Module ID
   * @param key - Setting key
   * @param value - New value
   * @returns Async Result indicating success or error
   */
  setSettingValue<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>>;
}
```

#### 1.3 Port Token erstellen

**Datei:** `src/tokens/tokenindex.ts` (ergänzen)

```typescript
export const settingsRegistrationPortToken = createToken<SettingsRegistrationPort>(
  "settingsRegistrationPort"
);
```

---

### Phase 2: Foundry-Adapter implementieren

#### 2.1 FoundrySettingsRegistrationAdapter erstellen

**Datei:** `src/foundry/adapters/foundry-settings-registration-adapter.ts`

```typescript
import type { SettingsRegistrationPort } from "@/core/ports/settings-registration-port.interface";
import type { SettingConfig, SettingsError } from "@/core/domain/settings";
import type { Result } from "@/types/result";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type * as v from "valibot";
import { foundrySettingsToken } from "@/foundry/foundrytokens";

/**
 * Foundry-specific adapter for SettingsRegistrationPort.
 * 
 * Translates between domain types (SettingConfig) and Foundry types (SettingConfig).
 * Handles Foundry-specific validation schemas internally.
 */
export class FoundrySettingsRegistrationAdapter implements SettingsRegistrationPort {
  constructor(private readonly foundrySettings: FoundrySettings) {}

  registerSetting<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, SettingsError> {
    // Map domain SettingConfig to Foundry SettingConfig
    // (types are compatible, but we ensure type safety)
    const foundryConfig: FoundrySettings["register"] extends (
      ...args: infer P
    ) => any
      ? P[2]
      : never = {
      name: config.name,
      hint: config.hint,
      scope: config.scope,
      config: config.config,
      type: config.type,
      choices: config.choices,
      default: config.default,
      onChange: config.onChange,
    };

    const result = this.foundrySettings.register(namespace, key, foundryConfig);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_REGISTRATION_FAILED",
          key,
          message: result.error.message,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  getSettingValue<T>(
    namespace: string,
    key: string,
    validator: (value: unknown) => value is T
  ): Result<T | null, SettingsError> {
    // Foundry uses schemas for validation, but we accept a validator function
    // This is a limitation - we could extend the port to accept schemas
    // For now, we'll use a permissive schema and validate with the validator
    
    // Create a permissive schema that accepts any value
    // The validator function will ensure type safety
    const permissiveSchema = v.any();
    
    const result = this.foundrySettings.get(namespace, key, permissiveSchema);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_READ_FAILED",
          key,
          message: result.error.message,
        },
      };
    }

    // Validate with provided validator
    if (!validator(result.value)) {
      return {
        ok: false,
        error: {
          code: "INVALID_SETTING_VALUE",
          key,
          message: `Setting value does not match expected type`,
        },
      };
    }

    return { ok: true, value: result.value };
  }

  async setSettingValue<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_WRITE_FAILED",
          key,
          message: result.error.message,
        },
      };
    }

    return { ok: true, value: undefined };
  }
}

// DI-Wrapper
export class DIFoundrySettingsRegistrationAdapter extends FoundrySettingsRegistrationAdapter {
  static dependencies = [foundrySettingsToken] as const;

  constructor(foundrySettings: FoundrySettings) {
    super(foundrySettings);
  }
}
```

**Hinweis:** Die Validator-Funktion ist eine Kompromisslösung. Alternativ könnte der Port Schemas akzeptieren, aber dann wäre er wieder an Valibot gekoppelt. Die Validator-Funktion ist domänenneutraler.

**Alternative:** Port akzeptiert auch Schemas, aber der Adapter ist dafür verantwortlich, diese zu nutzen:

```typescript
export interface SettingsRegistrationPort {
  // ...
  getSettingValue<T>(
    namespace: string,
    key: string,
    validator: ((value: unknown) => value is T) | v.BaseSchema<unknown, T, any>
  ): Result<T | null, SettingsError>;
}
```

---

### Phase 3: ModuleSettingsRegistrar refactoren

#### 3.1 SettingsRegistrar anpassen

**Datei:** `src/core/module-settings-registrar.ts`

**Änderungen:**
1. Constructor-Parameter: `foundrySettings: FoundrySettings` → `settingsPort: SettingsRegistrationPort`
2. Methodenaufrufe: `foundrySettings.register()` → `settingsPort.registerSetting()`, etc.
3. Schemas: Foundry-Schemas werden nur noch für Validierung in Bindings verwendet, nicht direkt im Service
4. DI-Dependencies: `foundrySettingsToken` → `settingsRegistrationPortToken`

**Kernänderung:**

```typescript
export class ModuleSettingsRegistrar {
  constructor(
    private readonly settingsPort: SettingsRegistrationPort, // ✅ Port statt FoundrySettings
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly notifications: NotificationCenter,
    private readonly i18n: I18nFacadeService,
    private readonly logger: Logger
  ) {}

  registerAll(): void {
    this.registerDefinition(
      logLevelSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL],
      this.settingsPort, // ✅ Port statt FoundrySettings
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    // ... weitere Settings ...
  }

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    settingsPort: SettingsRegistrationPort, // ✅ Port statt FoundrySettings
    runtimeConfig: RuntimeConfigService,
    notifications: NotificationCenter,
    i18n: I18nFacadeService,
    logger: Logger
  ): void {
    const config = definition.createConfig(i18n, logger);
    const configWithRuntimeBridge = binding
      ? this.attachRuntimeConfigBridge(config, runtimeConfig, binding)
      : config;

    // ✅ Nutzt Port statt FoundrySettings
    const result = settingsPort.registerSetting(
      MODULE_CONSTANTS.MODULE.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      notifications.error(`Failed to register ${definition.key} setting`, result.error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    if (binding) {
      this.syncRuntimeConfigFromSettings(
        settingsPort, // ✅ Port statt FoundrySettings
        runtimeConfig,
        binding,
        notifications,
        definition.key
      );
    }
  }

  private syncRuntimeConfigFromSettings<TSchema, K extends RuntimeConfigKey>(
    settingsPort: SettingsRegistrationPort, // ✅ Port statt FoundrySettings
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    notifications: NotificationCenter,
    settingKey: string
  ): void {
    // ✅ Nutzt Port mit Validator statt Foundry-Schema
    const currentValue = settingsPort.getSettingValue(
      MODULE_CONSTANTS.MODULE.ID,
      settingKey,
      (value): value is TSchema => {
        // Validierung mit Binding-Schema
        try {
          binding.schema._parse({ value, issues: [] });
          return true;
        } catch {
          return false;
        }
      }
    );

    if (!currentValue.ok) {
      notifications.warn(`Failed to read initial value for ${settingKey}`, currentValue.error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    if (currentValue.value !== null) {
      runtimeConfig.setFromFoundry(binding.runtimeKey, binding.normalize(currentValue.value));
    }
  }
}
```

**Problem:** Die Validator-Funktion nutzt intern noch das Foundry-Schema (`binding.schema`). Das ist ein Kompromiss - die Schema-Definition bleibt im Registrar, aber die Foundry-API-Nutzung ist abstrahiert.

**Alternative:** Validator-Funktion direkt aus Schema erstellen (Helper-Funktion):

```typescript
// src/core/domain/settings-validators.ts
import type * as v from "valibot";

export function createValidatorFromSchema<TSchema>(
  schema: v.BaseSchema<unknown, TSchema, any>
): (value: unknown) => value is TSchema {
  return (value: unknown): value is TSchema => {
    try {
      const result = schema._parse({ value, issues: [] });
      return result.typed === true;
    } catch {
      return false;
    }
  };
}
```

Dann im Registrar:

```typescript
import { createValidatorFromSchema } from "@/core/domain/settings-validators";

const currentValue = settingsPort.getSettingValue(
  MODULE_CONSTANTS.MODULE.ID,
  settingKey,
  createValidatorFromSchema(binding.schema)
);
```

---

### Phase 4: DI-Konfiguration anpassen

#### 4.1 Adapter registrieren

**Datei:** `src/config/modules/foundry-services.config.ts` (ergänzen)

```typescript
import { DIFoundrySettingsRegistrationAdapter } from "@/foundry/adapters/foundry-settings-registration-adapter";
import { settingsRegistrationPortToken } from "@/tokens/tokenindex";

export function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // ... bestehende Registrierungen ...

  // Register FoundrySettingsRegistrationAdapter
  const adapterResult = container.registerClass(
    settingsRegistrationPortToken,
    DIFoundrySettingsRegistrationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(adapterResult)) {
    return err(`Failed to register SettingsRegistrationAdapter: ${adapterResult.error.message}`);
  }

  // ... rest ...
}
```

#### 4.2 ModuleSettingsRegistrar Token anpassen

**Datei:** `src/config/modules/registrars.config.ts` (anpassen)

```typescript
// ✅ DIModuleSettingsRegistrar verwendet jetzt settingsRegistrationPortToken statt foundrySettingsToken
const settingsRegistrarResult = container.registerClass(
  moduleSettingsRegistrarToken,
  DIModuleSettingsRegistrar, // Nutzt jetzt settingsRegistrationPortToken
  ServiceLifecycle.SINGLETON
);
```

---

## Migration-Pfad

### Schritt 1: Neue Dateien erstellen (keine Breaking Changes)
- ✅ `src/core/domain/settings.ts` erstellen
- ✅ `src/core/ports/settings-registration-port.interface.ts` erstellen
- ✅ `src/foundry/adapters/foundry-settings-registration-adapter.ts` erstellen
- ✅ Token registrieren

### Schritt 2: Parallele Implementierung
- ✅ Adapter registrieren (neben bestehender FoundrySettings)
- ✅ Tests für Adapter schreiben
- ✅ Integration-Tests mit neuem Port

### Schritt 3: Registrar migrieren
- ✅ `ModuleSettingsRegistrar` auf Port umstellen
- ✅ DI-Dependencies anpassen
- ✅ Alle Tests aktualisieren

### Schritt 4: Alte Dependencies entfernen
- ⚠️ `FoundrySettings` aus `ModuleSettingsRegistrar` entfernen
- ⚠️ Foundry-Schemas aus Geschäftslogik entfernen (soweit möglich)
- ✅ Alte Tests aufräumen

### Schritt 5: Cleanup
- ✅ FoundrySettings nur noch von Adapter nutzen
- ✅ Foundry-Schemas nur noch in Adapter/Bindings

---

## Test-Strategie

### Unit-Tests

#### SettingsRegistrationPort Interface Mock

```typescript
// src/core/ports/__tests__/settings-registration-port.mock.ts
export const createMockSettingsRegistrationPort = (): SettingsRegistrationPort => ({
  registerSetting: vi.fn(),
  getSettingValue: vi.fn(),
  setSettingValue: vi.fn(),
});
```

#### Registrar-Test (ohne Foundry-Mocks)

```typescript
// src/core/__tests__/ModuleSettingsRegistrar.test.ts
describe("ModuleSettingsRegistrar", () => {
  it("should register settings using port", () => {
    const mockPort = createMockSettingsRegistrationPort();
    const registrar = new ModuleSettingsRegistrar(
      mockPort, // ✅ Port-Mock statt FoundrySettings
      mockRuntimeConfig,
      mockNotifications,
      mockI18n,
      mockLogger
    );

    vi.mocked(mockPort.registerSetting).mockReturnValue({ ok: true, value: undefined });

    registrar.registerAll();

    expect(mockPort.registerSetting).toHaveBeenCalled();
  });
});
```

#### Adapter-Test (Foundry-Mocks)

```typescript
// src/foundry/adapters/__tests__/foundry-settings-registration-adapter.test.ts
describe("FoundrySettingsRegistrationAdapter", () => {
  it("should map domain SettingConfig to Foundry", () => {
    const mockFoundrySettings = createMockFoundrySettings();
    const adapter = new FoundrySettingsRegistrationAdapter(mockFoundrySettings);

    const domainConfig: SettingConfig<number> = {
      name: "Test Setting",
      scope: "world",
      config: true,
      type: Number,
      default: 42,
    };

    vi.mocked(mockFoundrySettings.register).mockReturnValue({ ok: true, value: undefined });

    const result = adapter.registerSetting("test-module", "testKey", domainConfig);

    expect(result.ok).toBe(true);
    expect(mockFoundrySettings.register).toHaveBeenCalledWith(
      "test-module",
      "testKey",
      expect.objectContaining(domainConfig)
    );
  });
});
```

---

## Breaking Changes

### ⚠️ Keine Breaking Changes für externe APIs

- ✅ `ModuleSettingsRegistrar` behält öffentliche Methoden
- ✅ Rückgabetypen ändern sich nur intern (Result-Types)
- ✅ Externe Consumer sehen keine Änderungen

### ⚠️ Interne Breaking Changes

- ⚠️ `DIModuleSettingsRegistrar` ändert Dependencies:
  - **Vorher:** `foundrySettingsToken`
  - **Nachher:** `settingsRegistrationPortToken`
- ⚠️ DI-Config muss angepasst werden
- ⚠️ RuntimeConfigBindings nutzen weiterhin Foundry-Schemas (Kompromiss)

### Migration für Tests

Tests, die `FoundrySettings` mocken, müssen auf `SettingsRegistrationPort` umgestellt werden:

```typescript
// Vorher
const mockFoundrySettings = createMockFoundrySettings();
const registrar = new ModuleSettingsRegistrar(mockFoundrySettings, ...);

// Nachher
const mockPort = createMockSettingsRegistrationPort();
const registrar = new ModuleSettingsRegistrar(mockPort, ...);
```

---

## Vorteile nach Refactoring

### ✅ DIP-Konformität
- Domäne hängt nicht mehr direkt an Foundry
- Port abstrahiert Platform-Details
- Testbar ohne Foundry-Mocks (Service-Ebene)

### ✅ Testbarkeit
- Registrar testbar ohne Foundry-Mocks
- Adapter testbar mit Foundry-Mocks
- Klare Trennung der Concerns

### ✅ Wartbarkeit
- Geschäftslogik (RuntimeConfig-Sync) getrennt von Infrastruktur (Foundry-Registrierung)
- Änderungen an Foundry-API nur im Adapter
- Domänentypen klar definiert

### ✅ Erweiterbarkeit
- Neue Platform-Adapters einfach hinzufügbar
- Port kann erweitert werden ohne Domäne zu ändern

---

## Offene Fragen / Follow-ups

1. **Schema-Validierung:** Sollen Schemas weiterhin in Bindings verwendet werden oder vollständig in den Adapter verschoben?
   - **Kompromiss:** Schemas bleiben in Bindings (RuntimeConfig-Sync braucht sie), aber Nutzung ist abstrahiert

2. **Validator vs. Schema:** Soll der Port Validator-Funktionen oder Schemas akzeptieren?
   - **Entscheidung:** Validator-Funktionen (domänenneutraler), aber Helper für Schema→Validator

3. **SettingDefinition:** Bleibt `SettingDefinition` mit Foundry-Schemas oder wird es domänenneutral?
   - **Kompromiss:** `SettingDefinition` bleibt wie ist (nutzt Schemas für Validierung), aber Registrar nutzt Port

---

## Schätzung

- **Aufwand:** ~5-7 Stunden
- **Komplexität:** Mittel-Hoch
- **Risiko:** Mittel (Schema-Validierung ist komplex)
- **Breaking Changes:** Minimal (nur interne DI-Struktur)

---

## Bekannte Limitationen

1. **Schema-Kopplung:** RuntimeConfigBindings nutzen weiterhin Foundry-Schemas - vollständige Entkopplung würde erfordern, dass auch Bindings domänenneutral werden
2. **Validator-Funktionen:** Type-Guards sind weniger mächtig als Schemas - aber domänenneutraler

