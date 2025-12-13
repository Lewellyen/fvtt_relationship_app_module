---
principle: SRP
severity: medium
confidence: high
component_kind: module
component_name: "settings.ts"
file: "src/domain/types/settings.ts"
location:
  start_line: 1
  end_line: 119
tags: ["responsibility", "cohesion", "separation"]
---

# Problem

Die Datei `src/domain/types/settings.ts` kombiniert mehrere unterschiedliche Verantwortlichkeiten in einem Modul:
1. Domain-Model für Setting-Konfiguration (`DomainSettingConfig`)
2. Domain-Error-Typen (`DomainSettingsError`)
3. Validator-Type-Definition (`SettingValidator`)
4. Konkrete Validator-Implementierungen (`SettingValidators`)

## Evidence

```1:119:src/domain/types/settings.ts
/**
 * Domain model for setting configuration.
 *
 * Platform-agnostic representation of a module setting.
 * This type is used by the domain layer and does not depend on
 * any infrastructure-specific types (like Valibot schemas).
 */
export interface DomainSettingConfig<T> {
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
 *
 * Platform-agnostic error type that can be mapped from/to
 * platform-specific errors.
 */
export interface DomainSettingsError {
  code:
    | "SETTING_REGISTRATION_FAILED"
    | "SETTING_READ_FAILED"
    | "SETTING_WRITE_FAILED"
    | "INVALID_SETTING_VALUE"
    | "SETTING_NOT_FOUND"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}

/**
 * Type guard function for validating setting values.
 *
 * Domain-neutral alternative to Valibot schemas.
 * Implementations can use any validation library internally.
 */
export type SettingValidator<T> = (value: unknown) => value is T;

/**
 * Pre-defined validators for common setting types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- PascalCase intentional for namespace-like object
export const SettingValidators = {
  /**
   * Validates that value is a boolean.
   */
  boolean: (value: unknown): value is boolean => typeof value === "boolean",

  /**
   * Validates that value is a number.
   */
  number: (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value),

  /**
   * Validates that value is a non-negative number.
   */
  nonNegativeNumber: (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value) && value >= 0,

  /**
   * Validates that value is a non-negative integer.
   */
  nonNegativeInteger: (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0,

  /**
   * Validates that value is a positive integer (greater than 0).
   */
  positiveInteger: (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value > 0,

  /**
   * Validates that value is a string.
   */
  string: (value: unknown): value is string => typeof value === "string",

  /**
   * Validates that value is a non-empty string.
   */
  nonEmptyString: (value: unknown): value is string =>
    typeof value === "string" && value.length > 0,

  /**
   * Validates that value is a number between 0 and 1 (inclusive).
   */
  samplingRate: (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value) && value >= 0 && value <= 1,

  /**
   * Creates a validator for enum values.
   */
  oneOf:
    <T extends string | number>(validValues: readonly T[]) =>
    (value: unknown): value is T =>
      (typeof value === "string" || typeof value === "number") &&
      (validValues as readonly (string | number)[]).includes(value),
} as const;
```

Die Datei enthält:
- **Zeilen 8-32**: Domain-Model (`DomainSettingConfig`)
- **Zeilen 40-50**: Error-Typen (`DomainSettingsError`)
- **Zeile 58**: Validator-Type-Definition (`SettingValidator`)
- **Zeilen 64-118**: Konkrete Validator-Implementierungen (`SettingValidators`)

## Impact

- **Niedrige Kohäsion**: Verschiedene Konzepte sind in einer Datei vermischt
- **Schwerer zu finden**: Entwickler müssen wissen, dass Validatoren in der Settings-Type-Datei sind
- **Schwerer zu erweitern**: Neue Validatoren müssen in eine Datei, die eigentlich Types definiert
- **Testbarkeit**: Validatoren könnten separat getestet werden, sind aber mit Types vermischt

## Recommendation

Die Datei in mehrere Dateien aufteilen:

1. **`src/domain/types/settings.ts`**: Nur Domain-Models und Error-Types
   - `DomainSettingConfig`
   - `DomainSettingsError`

2. **`src/domain/types/setting-validator.ts`**: Validator-Type-Definition
   - `SettingValidator<T>`

3. **`src/domain/utils/setting-validators.ts`**: Validator-Implementierungen
   - `SettingValidators` (alle konkreten Validatoren)

## Example Fix

```typescript
// src/domain/types/settings.ts
export interface DomainSettingConfig<T> {
  name: string;
  hint?: string;
  scope: "world" | "client" | "user";
  config: boolean;
  type: typeof String | typeof Number | typeof Boolean;
  choices?: Record<string | number, string>;
  default: T;
  onChange?: (value: T) => void;
}

export interface DomainSettingsError {
  code:
    | "SETTING_REGISTRATION_FAILED"
    | "SETTING_READ_FAILED"
    | "SETTING_WRITE_FAILED"
    | "INVALID_SETTING_VALUE"
    | "SETTING_NOT_FOUND"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}
```

```typescript
// src/domain/types/setting-validator.ts
export type SettingValidator<T> = (value: unknown) => value is T;
```

```typescript
// src/domain/utils/setting-validators.ts
import type { SettingValidator } from "@/domain/types/setting-validator";

export const SettingValidators = {
  boolean: (value: unknown): value is boolean => typeof value === "boolean",
  number: (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value),
  // ... rest of validators
} as const;
```

## Notes

- Die Trennung verbessert die Kohäsion und macht die Struktur klarer
- Validatoren sind Utility-Funktionen und gehören eher in `utils/` als in `types/`
- Die Änderung ist rückwärtskompatibel, wenn alle Exports in einer Index-Datei re-exportiert werden

