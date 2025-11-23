# Phase 3: Settings-System Refactoring

**Datum:** 2025-01-27  
**Priorität:** 🟠 HOCH  
**Geschätzter Aufwand:** 8-12 Stunden  
**Komplexität:** Mittel  
**Risiko:** Niedrig  
**Dependencies:** Keine (parallel zu Phase 1+2 möglich)

---

## 🎯 Ziel dieser Phase

Das Settings-System von direkten Foundry-Abhängigkeiten befreien und platform-agnostisch machen:

1. ✅ Generischen `PlatformSettingsPort` erstellen
2. ✅ `FoundrySettingsAdapter` implementieren
3. ✅ `ModuleSettingsRegistrar` von FoundrySettings entkoppeln
4. ✅ Tests ohne Foundry-Globals

---

## 📊 IST-Zustand (Probleme)

```typescript
// ❌ PROBLEM 1: ModuleSettingsRegistrar nutzt direkt FoundrySettings
class ModuleSettingsRegistrar {
  constructor(
    private readonly foundrySettings: FoundrySettings,  // ❌ Infrastructure!
    private readonly notificationCenter: NotificationCenter,
  ) {}

  registerAllSettings(): Result<void, Error> {
    // Direkter Foundry-Zugriff
    this.foundrySettings.register(
      "my-module",
      "hiddenJournalsEnabled",
      {
        name: "Enable Hidden Journals",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );
  }
}

// ❌ PROBLEM 2: Settings-Schema ist Foundry-spezifisch
interface FoundrySettingConfig<T> {
  name: string;
  hint?: string;
  scope: "world" | "client";  // Foundry-spezifisch
  config: boolean;
  type: typeof String | typeof Number | typeof Boolean;  // Foundry-spezifisch
  default: T;
  onChange?: (value: T) => void;
}
```

**Konsequenzen:**
- 🔴 Settings-System nicht portierbar auf andere Plattformen
- 🔴 ModuleSettingsRegistrar kennt Foundry-Details
- 🔴 Tests benötigen Foundry-Settings-Mocks
- 🔴 Keine klare Architektur-Grenze

---

## ✅ SOLL-Zustand (Ziel)

```typescript
// ✅ ZIEL 1: ModuleSettingsRegistrar nutzt Domain-Port
class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsPort,  // ✅ Domain Port!
    private readonly notificationCenter: NotificationCenter,
  ) {}

  registerAllSettings(): Result<void, Error> {
    // Platform-agnostischer Zugriff
    this.settings.register(
      "my-module",
      "hiddenJournalsEnabled",
      {
        name: "Enable Hidden Journals",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );
  }
}

// ✅ ZIEL 2: Platform-agnostisches Settings-Schema
interface PlatformSettingConfig<T> {
  name: string;
  hint?: string;
  scope: "world" | "client" | "user";  // Abstrakt, maps zu Platform
  config: boolean;
  type: SettingType;  // Platform-agnostic
  choices?: Record<string | number, string>;
  default: T;
  onChange?: (value: T) => void;
}
```

**Vorteile:**
- ✅ Settings-System portierbar (Roll20, Fantasy Grounds, CSV)
- ✅ ModuleSettingsRegistrar kennt keine Foundry-Details
- ✅ Tests mit einfachen Mock-Ports
- ✅ Klare Architektur-Grenzen

---

## 📋 Detaillierte Schritte

### Step 1: Ordnerstruktur vorbereiten

```bash
mkdir -p src/domain/ports
mkdir -p src/infrastructure/adapters/foundry/settings-adapters
```

**Erwartetes Ergebnis:**
```
src/
├─ domain/
│   └─ ports/
│       ├─ events/                    (aus Phase 1)
│       ├─ collections/               (aus Phase 2)
│       └─ platform-settings-port.interface.ts  (NEU)
└─ infrastructure/
    └─ adapters/
        └─ foundry/
            ├─ event-adapters/        (aus Phase 1)
            ├─ collection-adapters/   (aus Phase 2)
            └─ settings-adapters/     (NEU)
```

---

### Step 2: Platform-Settings-Port erstellen

**Datei:** `src/domain/ports/platform-settings-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type * as v from "valibot";

/**
 * Platform-agnostic port for application settings.
 * 
 * Provides setting registration, get, and set operations.
 * Platform-agnostic - works with any VTT system or persistence layer.
 * 
 * Platform mappings:
 * - Foundry: game.settings.register/get/set
 * - Roll20: state object persistence
 * - Fantasy Grounds: DB.setValue/getValue
 * - CSV: JSON file storage (settings.json)
 * 
 * @example
 * ```typescript
 * // Register setting
 * settings.register("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   type: Boolean,
 *   default: true,
 * });
 * 
 * // Get setting
 * const result = settings.get("my-module", "enabled", v.boolean());
 * if (result.ok) {
 *   console.log(`Enabled: ${result.value}`);
 * }
 * 
 * // Set setting
 * await settings.set("my-module", "enabled", false);
 * ```
 */
export interface PlatformSettingsPort {
  /**
   * Register a new setting.
   * 
   * Must be called during initialization phase (before platform is ready).
   * Some platforms (e.g., Foundry) only allow registration during init hook.
   * 
   * @param namespace - Module/app identifier (e.g., "my-module")
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration
   * @returns Success or error
   * 
   * @example
   * ```typescript
   * settings.register("my-module", "debugMode", {
   *   name: "Debug Mode",
   *   hint: "Enable detailed logging",
   *   scope: "client",
   *   config: true,
   *   type: Boolean,
   *   default: false,
   *   onChange: (value) => console.log(`Debug mode: ${value}`),
   * });
   * ```
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError>;

  /**
   * Get current value of a setting with runtime validation.
   * 
   * Uses Valibot schema to validate the setting value at runtime.
   * This ensures type safety even when settings are persisted/loaded.
   * 
   * @param namespace - Module identifier
   * @param key - Setting key
   * @param schema - Valibot schema for runtime validation
   * @returns Setting value or validation error
   * 
   * @example
   * ```typescript
   * const result = settings.get("my-module", "maxItems", v.number());
   * if (result.ok) {
   *   console.log(`Max items: ${result.value}`);
   * } else {
   *   console.error(`Invalid setting: ${result.error.message}`);
   * }
   * ```
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError>;

  /**
   * Set value of a setting.
   * 
   * Persists value to platform storage and triggers onChange callbacks.
   * Asynchronous because some platforms (e.g., Foundry) persist asynchronously.
   * 
   * @param namespace - Module identifier
   * @param key - Setting key
   * @param value - New setting value
   * @returns Success or error (async)
   * 
   * @example
   * ```typescript
   * const result = await settings.set("my-module", "theme", "dark");
   * if (!result.ok) {
   *   console.error(`Failed to save setting: ${result.error.message}`);
   * }
   * ```
   */
  set<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>>;
}

/**
 * Platform-agnostic setting configuration.
 * 
 * Defines how a setting should be registered, displayed, and persisted.
 */
export interface PlatformSettingConfig<T> {
  /**
   * Display name for the setting (localized).
   */
  name: string;

  /**
   * Optional hint/description for the setting (localized).
   */
  hint?: string;

  /**
   * Scope of the setting.
   * 
   * - "world": Shared across all users in this world/game
   * - "client": Per-user, per-browser setting
   * - "user": Per-user setting (synchronized across browsers)
   * 
   * Platform mappings:
   * - Foundry: "world", "client"
   * - Roll20: "world" → campaign state, "client" → localStorage
   * - CSV: "world" → shared.json, "client" → local.json
   */
  scope: "world" | "client" | "user";

  /**
   * Whether to show this setting in the config UI.
   * 
   * If false, setting is hidden from UI but still accessible via API.
   */
  config: boolean;

  /**
   * Data type of the setting.
   * 
   * Platform mappings:
   * - Foundry: String/Number/Boolean constructors
   * - Roll20: string representation
   * - CSV: JSON type
   */
  type: SettingType;

  /**
   * Optional choices for enum-like settings.
   * 
   * If provided, UI should show dropdown/select instead of free input.
   * 
   * @example
   * ```typescript
   * choices: {
   *   "auto": "Automatic",
   *   "manual": "Manual",
   *   "disabled": "Disabled",
   * }
   * ```
   */
  choices?: Record<string | number, string>;

  /**
   * Default value if setting is not yet persisted.
   */
  default: T;

  /**
   * Optional callback triggered when setting changes.
   * 
   * Called after value is persisted successfully.
   */
  onChange?: (value: T) => void;
}

/**
 * Platform-agnostic setting type.
 * 
 * Supports both constructor types (typeof String) and string types ("String")
 * for maximum compatibility.
 */
export type SettingType = 
  | typeof String 
  | typeof Number 
  | typeof Boolean 
  | "String" 
  | "Number" 
  | "Boolean";

/**
 * Platform-agnostic error for settings operations.
 */
export interface SettingsError {
  code: 
    | "SETTING_NOT_REGISTERED"        // Trying to get/set unregistered setting
    | "SETTING_VALIDATION_FAILED"     // Setting value failed Valibot validation
    | "SETTING_REGISTRATION_FAILED"   // Platform rejected registration
    | "PLATFORM_NOT_AVAILABLE";       // Platform not initialized yet
  message: string;
  details?: unknown;
}
```

**Erfolgskriterien:**
- ✅ Interface ist platform-agnostisch
- ✅ Keine Foundry-Typen
- ✅ Dokumentation erklärt Mapping zu verschiedenen Plattformen
- ✅ Valibot-Integration für Runtime-Validation
- ✅ Result-Pattern für Error-Handling
- ✅ Async `set()` für Platform-Kompatibilität

---

### Step 3: Foundry-Adapter implementieren

**Datei:** `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type {
  PlatformSettingsPort,
  PlatformSettingConfig,
  SettingsError,
  SettingType,
} from "@/domain/ports/platform-settings-port.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type * as v from "valibot";

/**
 * Foundry-specific implementation of PlatformSettingsPort.
 * 
 * Maps Foundry's game.settings API to platform-agnostic settings port.
 * 
 * @example
 * ```typescript
 * const adapter = new FoundrySettingsAdapter(foundrySettings);
 * 
 * adapter.register("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   type: Boolean,
 *   default: true,
 * });
 * 
 * const result = adapter.get("my-module", "enabled", v.boolean());
 * ```
 */
export class FoundrySettingsAdapter implements PlatformSettingsPort {
  constructor(
    private readonly foundrySettings: FoundrySettings
  ) {}

  /**
   * Register a setting in Foundry.
   * 
   * Maps platform config → Foundry config.
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError> {
    // Map Platform config → Foundry config
    const foundryConfig = {
      name: config.name,
      hint: config.hint,
      scope: config.scope,
      config: config.config,
      type: this.mapSettingType(config.type),
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
          message: `Failed to register setting "${namespace}.${key}": ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Get setting value from Foundry with validation.
   * 
   * Uses Valibot schema to validate at runtime.
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError> {
    const result = this.foundrySettings.get(namespace, key, schema);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_VALIDATION_FAILED",
          message: `Failed to get setting "${namespace}.${key}": ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: result.value };
  }

  /**
   * Set setting value in Foundry.
   * 
   * Persists to Foundry's database and triggers onChange.
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: `Failed to set setting "${namespace}.${key}": ${result.error.message}`,
          details: result.error,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  // ===== Private Helpers =====

  /**
   * Map platform type to Foundry type.
   * 
   * Handles both constructor types and string types.
   */
  private mapSettingType(type: SettingType): typeof String | typeof Number | typeof Boolean {
    if (type === "String" || type === String) return String;
    if (type === "Number" || type === Number) return Number;
    if (type === "Boolean" || type === Boolean) return Boolean;
    throw new Error(`Unknown setting type: ${type}`);
  }
}
```

**DI-Wrapper:**

```typescript
import { foundrySettingsToken } from "@/infrastructure/di/tokens/foundry-tokens";

/**
 * DI-enabled wrapper for FoundrySettingsAdapter.
 */
export class DIFoundrySettingsAdapter extends FoundrySettingsAdapter {
  static dependencies = [foundrySettingsToken] as const;

  constructor(foundrySettings: FoundrySettings) {
    super(foundrySettings);
  }
}
```

**Erfolgskriterien:**
- ✅ Implementiert `PlatformSettingsPort`
- ✅ Nutzt `FoundrySettings` (nicht direkt `game.settings`)
- ✅ Mapping von Platform-Config zu Foundry-Config
- ✅ Error-Handling mit Result-Pattern
- ✅ Type-Mapping (String/Number/Boolean)
- ✅ DI-Wrapper für Container-Registration

---

### Step 4: DI-Token und Registration

**Datei:** `src/infrastructure/di/tokens/settings-tokens.ts`

```typescript
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";

export const platformSettingsPortToken = Symbol.for("PlatformSettingsPort");

export interface SettingsPortTokens {
  [platformSettingsPortToken]: PlatformSettingsPort;
}
```

**Datei:** `src/infrastructure/di/container.ts` (Registration)

```typescript
import { platformSettingsPortToken } from "./tokens/settings-tokens";
import { DIFoundrySettingsAdapter } from "@/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter";

// In registerPorts() oder registerAdapters():
container.registerSingleton(
  platformSettingsPortToken,
  DIFoundrySettingsAdapter
);
```

---

### Step 5: ModuleSettingsRegistrar refactoren

**Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

```typescript
// VORHER:
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

class ModuleSettingsRegistrar {
  constructor(
    private readonly foundrySettings: FoundrySettings,  // ❌ Infrastructure!
    private readonly notificationCenter: NotificationCenter,
  ) {}

  registerAllSettings(): Result<void, Error> {
    const result = this.foundrySettings.register(
      MODULE_ID,
      "hiddenJournalsEnabled",
      {
        name: "Enable Hidden Journals",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );

    if (!result.ok) {
      this.notificationCenter.error("Failed to register setting", result.error);
    }

    return { ok: true, value: undefined };
  }
}

// NACHHER:
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";

class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsPort,  // ✅ Domain Port!
    private readonly notificationCenter: NotificationCenter,
  ) {}

  registerAllSettings(): Result<void, Error> {
    const result = this.settings.register(
      MODULE_ID,
      "hiddenJournalsEnabled",
      {
        name: "Enable Hidden Journals",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );

    if (!result.ok) {
      this.notificationCenter.error("Failed to register setting", result.error);
    }

    return { ok: true, value: undefined };
  }
}
```

**DI-Wrapper aktualisieren:**

```typescript
import { platformSettingsPortToken } from "@/infrastructure/di/tokens/settings-tokens";
import { notificationCenterToken } from "@/infrastructure/di/tokens/notification-tokens";

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static dependencies = [
    platformSettingsPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    settings: PlatformSettingsPort,
    notificationCenter: NotificationCenter,
  ) {
    super(settings, notificationCenter);
  }
}
```

---

### Step 6: Weitere Services aktualisieren

**Wenn andere Services Settings nutzen:**

```typescript
// VORHER:
class SomeService {
  constructor(
    private readonly foundrySettings: FoundrySettings,
  ) {}

  doSomething(): void {
    const enabled = this.foundrySettings.get("my-module", "enabled", v.boolean());
    // ...
  }
}

// NACHHER:
class SomeService {
  constructor(
    private readonly settings: PlatformSettingsPort,
  ) {}

  doSomething(): void {
    const enabled = this.settings.get("my-module", "enabled", v.boolean());
    // ...
  }
}
```

---

### Step 7: Tests erstellen

**Datei:** `src/domain/ports/__tests__/platform-settings-port.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import type { PlatformSettingsPort } from "../platform-settings-port.interface";

describe("PlatformSettingsPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: PlatformSettingsPort = {
      register: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    };

    expect(mockPort.register).toBeDefined();
    expect(mockPort.get).toBeDefined();
    expect(mockPort.set).toBeDefined();
  });
});
```

**Datei:** `src/infrastructure/adapters/foundry/settings-adapters/__tests__/foundry-settings-adapter.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundrySettingsAdapter } from "../foundry-settings-adapter";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import * as v from "valibot";

describe("FoundrySettingsAdapter", () => {
  let mockFoundrySettings: FoundrySettings;
  let adapter: FoundrySettingsAdapter;

  beforeEach(() => {
    mockFoundrySettings = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      get: vi.fn(),
      set: vi.fn(),
    };

    adapter = new FoundrySettingsAdapter(mockFoundrySettings);
  });

  describe("register", () => {
    it("should register setting in Foundry", () => {
      const result = adapter.register("my-module", "enabled", {
        name: "Enabled",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      });

      expect(result.ok).toBe(true);
      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "enabled",
        expect.objectContaining({
          name: "Enabled",
          scope: "world",
          type: Boolean,
        })
      );
    });

    it("should map string type to constructor", () => {
      adapter.register("my-module", "name", {
        name: "Name",
        scope: "world",
        config: true,
        type: "String",
        default: "",
      });

      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "name",
        expect.objectContaining({
          type: String,
        })
      );
    });
  });

  describe("get", () => {
    it("should get setting value from Foundry", () => {
      vi.mocked(mockFoundrySettings.get).mockReturnValue({
        ok: true,
        value: true,
      });

      const result = adapter.get("my-module", "enabled", v.boolean());

      expect(result.ok).toBe(true);
      expect(result.value).toBe(true);
    });

    it("should return validation error", () => {
      vi.mocked(mockFoundrySettings.get).mockReturnValue({
        ok: false,
        error: new Error("Validation failed"),
      });

      const result = adapter.get("my-module", "enabled", v.boolean());

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
    });
  });

  describe("set", () => {
    it("should set setting value in Foundry", async () => {
      vi.mocked(mockFoundrySettings.set).mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(true);
      expect(mockFoundrySettings.set).toHaveBeenCalledWith(
        "my-module",
        "enabled",
        false
      );
    });
  });
});
```

**Datei:** `src/application/services/__tests__/ModuleSettingsRegistrar.test.ts` (aktualisieren)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModuleSettingsRegistrar } from "../ModuleSettingsRegistrar";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";

describe("ModuleSettingsRegistrar", () => {
  let mockSettings: PlatformSettingsPort;
  let mockNotificationCenter: any;
  let registrar: ModuleSettingsRegistrar;

  beforeEach(() => {
    mockSettings = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      get: vi.fn(),
      set: vi.fn(),
    };

    mockNotificationCenter = {
      error: vi.fn(),
    };

    registrar = new ModuleSettingsRegistrar(
      mockSettings,
      mockNotificationCenter
    );
  });

  it("should register all settings", () => {
    registrar.registerAllSettings();

    expect(mockSettings.register).toHaveBeenCalled();
  });

  it("should handle registration errors", () => {
    vi.mocked(mockSettings.register).mockReturnValue({
      ok: false,
      error: {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Failed",
      },
    });

    registrar.registerAllSettings();

    expect(mockNotificationCenter.error).toHaveBeenCalled();
  });
});
```

---

## ✅ Checkliste

### Preparation
- [ ] Backup erstellen (`git commit -m "Before Phase 3: Settings System Refactoring"`)
- [ ] Ordnerstruktur vorbereiten
- [ ] Dependencies überprüfen (`Valibot`, `Result`, etc.)

### Domain Layer
- [ ] `PlatformSettingsPort` erstellt
- [ ] `PlatformSettingConfig<T>` definiert
- [ ] `SettingsError` definiert
- [ ] Dokumentation vollständig (Platform-Mappings)

### Infrastructure Layer
- [ ] `FoundrySettingsAdapter` erstellt
- [ ] Foundry-Settings-Mapping implementiert
- [ ] Type-Mapping (String/Number/Boolean)
- [ ] Error-Handling mit Result-Pattern
- [ ] DI-Wrapper erstellt

### Application Layer
- [ ] `ModuleSettingsRegistrar` refactored (nutzt Port)
- [ ] Andere Services refactored (falls vorhanden)

### DI Container
- [ ] Token erstellt (`platformSettingsPortToken`)
- [ ] Adapter registriert
- [ ] Services aktualisiert (Dependencies)

### Tests
- [ ] Port-Contract-Tests geschrieben
- [ ] Adapter-Tests geschrieben
- [ ] Service-Tests aktualisiert (nutzen Port-Mocks)
- [ ] Alle Tests grün: `npm run test`

### Validation
- [ ] `npm run check:types` ✅
- [ ] `npm run check:lint` ✅
- [ ] `npm run check:format` ✅
- [ ] `npm run test` ✅
- [ ] `npm run check:all` ✅

### Documentation
- [ ] CHANGELOG.md aktualisiert (Unreleased → Changed)
- [ ] Code-Kommentare vollständig
- [ ] Commit: `refactor(settings): implement platform-agnostic settings system`

---

## 🎯 Erfolgskriterien

Nach Abschluss dieser Phase:

- ✅ **Keine direkten FoundrySettings-Abhängigkeiten** in Application-Layer
- ✅ **PlatformSettingsPort** definiert und implementiert
- ✅ **ModuleSettingsRegistrar entkoppelt** von Foundry
- ✅ **Tests ohne Foundry-Globals** lauffähig
- ✅ **Platform-agnostisch:** Roll20-Adapter theoretisch in < 1 Tag implementierbar
- ✅ **Alle Checks grün:** `npm run check:all`

---

## 🚨 Häufige Probleme

### Problem 1: Type-Mapping

```typescript
// ❌ FEHLER: String statt typeof String
config: {
  type: "String",  // ❌ Foundry erwartet Constructor
}
```

**Lösung:**
```typescript
// ✅ RICHTIG: Mapping in Adapter
private mapSettingType(type: SettingType) {
  if (type === "String" || type === String) return String;
  // ...
}
```

### Problem 2: onChange-Callback

```typescript
// ❌ FEHLER: Callback hat falschen this-Kontext
onChange: this.handleChange  // ❌ this ist undefined!
```

**Lösung:**
```typescript
// ✅ RICHTIG: Arrow-Function oder bind
onChange: (value) => this.handleChange(value)
```

---

## 📚 Nächste Schritte

Nach Abschluss dieser Phase:

1. ✅ **Phase 4 starten:** UI-Operations Refactoring
2. ✅ **Settings-Schema erweitern:** Range, FilePicker, etc. (optional)

**Geschätzte Zeit bis Phase 4:** 0 Tage (parallel möglich)

---

**Status:** ⏳ Bereit zur Umsetzung  
**Review erforderlich:** Nach Step 7  
**Zeitaufwand:** 8-12 Stunden

