---
principle: DIP
severity: high
confidence: high
component_kind: interface
component_name: "PlatformSettingsPort"
file: "src/domain/ports/platform-settings-port.interface.ts"
location:
  start_line: 1
  end_line: 92
tags: ["dependency", "layering", "infrastructure-leak", "interface"]
---

# Problem

Das Domain-Layer-Interface `PlatformSettingsPort` verwendet `valibot` Types in seiner Methodensignatur. Die `get()`-Methode erfordert einen `v.BaseSchema` Parameter, was eine direkte Abhängigkeit zur Infrastructure-Bibliothek `valibot` darstellt.

## Evidence

```1:92:src/domain/ports/platform-settings-port.interface.ts
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
```

Die `get()`-Methode (Zeile 88-92) verwendet `v.BaseSchema` als Parameter-Typ, was eine direkte Abhängigkeit zu valibot darstellt.

## Impact

- **Layer-Verletzung**: Domain-Interfaces sollten keine konkreten Infrastructure-Types verwenden
- **Tight Coupling**: Alle Implementierungen von `PlatformSettingsPort` müssen valibot verwenden
- **Portabilität**: Wechsel zu einer anderen Validierungsbibliothek erfordert Änderungen am Domain-Interface
- **Testbarkeit**: Mock-Implementierungen müssen valibot-Schemas erstellen

## Recommendation

1. **Abstraktion für Validierungsschema**: Ein generisches Interface für Validierungsschemas einführen:

```typescript
// src/domain/types/validation-schema.interface.ts
export interface ValidationSchema<T> {
  validate(value: unknown): value is T;
  // Optional: weitere Methoden für bessere Integration
}
```

2. **Interface anpassen**: `PlatformSettingsPort.get()` sollte das abstrakte Interface verwenden:

```typescript
get<T>(
  namespace: string,
  key: string,
  schema: ValidationSchema<T>
): Result<T, SettingsError>;
```

3. **Adapter in Infrastructure**: Infrastructure-Layer erstellt Adapter, die valibot-Schemas in `ValidationSchema` wrappen.

## Example Fix

```typescript
// src/domain/types/validation-schema.interface.ts
export interface ValidationSchema<T> {
  validate(value: unknown): value is T;
}

// src/domain/ports/platform-settings-port.interface.ts
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";

export interface PlatformSettingsPort {
  // ... register() bleibt gleich ...

  get<T>(
    namespace: string,
    key: string,
    schema: ValidationSchema<T>
  ): Result<T, SettingsError>;

  // ... set() bleibt gleich ...
}
```

```typescript
// src/infrastructure/validation/valibot-schema-adapter.ts
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";
import * as v from "valibot";

export function toValidationSchema<T>(
  valibotSchema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
): ValidationSchema<T> {
  return {
    validate: (value: unknown): value is T => {
      const result = v.safeParse(valibotSchema, value);
      return result.success;
    }
  };
}
```

## Notes

- Die Dokumentation in Zeile 70 erwähnt explizit "Uses Valibot schema", was zeigt, dass die Abhängigkeit bewusst ist
- Dies ist ein Interface, daher betrifft es alle Implementierungen
- Die Lösung sollte rückwärtskompatibel sein, falls bereits Implementierungen existieren
- Alternative: `get()` könnte optional sein und eine alternative Methode `getWithValidator()` einführen, die das abstrakte Interface verwendet

