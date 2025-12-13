---
principle: OCP
severity: medium
confidence: high
component_kind: const
component_name: "SettingValidators"
file: "src/domain/types/settings.ts"
location:
  start_line: 64
  end_line: 118
tags: ["extensibility", "open-closed", "static"]
---

# Problem

Das `SettingValidators`-Objekt ist statisch definiert und nicht erweiterbar. Neue Validatoren können nicht hinzugefügt werden, ohne die ursprüngliche Datei zu modifizieren. Dies verletzt das Open/Closed Principle: Die Komponente sollte für Erweiterungen offen, aber für Modifikationen geschlossen sein.

## Evidence

```64:118:src/domain/types/settings.ts
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

Das Objekt ist mit `as const` definiert und kann nicht erweitert werden. Um einen neuen Validator hinzuzufügen, muss die Datei modifiziert werden.

## Impact

- **Nicht erweiterbar**: Neue Validatoren können nicht ohne Modifikation der ursprünglichen Datei hinzugefügt werden
- **Breaking Changes**: Änderungen an `SettingValidators` betreffen alle Konsumenten
- **Wiederverwendbarkeit**: Module können keine eigenen Validatoren hinzufügen, ohne die Domain-Datei zu ändern
- **Testbarkeit**: Schwerer zu mocken oder zu erweitern in Tests

## Recommendation

**Option 1: Registry-Pattern (Empfohlen)**
Ein Registry-System einführen, das es ermöglicht, Validatoren zur Laufzeit zu registrieren:

```typescript
// src/domain/types/setting-validator-registry.interface.ts
export interface SettingValidatorRegistry {
  register(name: string, validator: SettingValidator<unknown>): void;
  get(name: string): SettingValidator<unknown> | undefined;
  has(name: string): boolean;
}

// src/domain/types/settings.ts
export const SettingValidators = createValidatorRegistry();
```

**Option 2: Factory-Funktion mit Erweiterbarkeit**
Eine Factory-Funktion, die ein erweiterbares Objekt zurückgibt:

```typescript
export function createSettingValidators() {
  const validators = {
    boolean: (value: unknown): value is boolean => typeof value === "boolean",
    // ... andere Validatoren
  };

  return {
    ...validators,
    extend(customValidators: Record<string, SettingValidator<unknown>>) {
      return { ...this, ...customValidators };
    }
  };
}

export const SettingValidators = createSettingValidators();
```

**Option 3: Keine Änderung (Akzeptabel für Domain-Layer)**
Für den Domain-Layer könnte es akzeptabel sein, dass die Standard-Validatoren statisch sind. Custom-Validatoren können direkt als `SettingValidator<T>`-Funktionen erstellt werden, ohne sie in `SettingValidators` zu registrieren.

## Example Fix

**Option 1: Registry-Pattern**

```typescript
// src/domain/types/setting-validator-registry.ts
import type { SettingValidator } from "./setting-validator";

class SettingValidatorRegistryImpl {
  private validators = new Map<string, SettingValidator<unknown>>();

  register<T>(name: string, validator: SettingValidator<T>): void {
    this.validators.set(name, validator as SettingValidator<unknown>);
  }

  get<T>(name: string): SettingValidator<T> | undefined {
    return this.validators.get(name) as SettingValidator<T> | undefined;
  }

  has(name: string): boolean {
    return this.validators.has(name);
  }
}

export function createSettingValidators(): SettingValidatorRegistryImpl {
  const registry = new SettingValidatorRegistryImpl();

  // Register default validators
  registry.register("boolean", (v): v is boolean => typeof v === "boolean");
  registry.register("number", (v): v is number => typeof v === "number" && !Number.isNaN(v));
  // ... weitere Standard-Validatoren

  return registry;
}

export const SettingValidators = createSettingValidators();
```

## Notes

- **Status**: Medium Severity, da die Funktionalität aktuell funktioniert, aber nicht erweiterbar ist
- Custom-Validatoren können bereits direkt als `SettingValidator<T>` erstellt werden
- Die Erweiterbarkeit wäre nützlich, wenn mehrere Module eigene Validatoren hinzufügen möchten
- **Empfehlung**: Option 3 (keine Änderung) ist für den Domain-Layer akzeptabel, da Custom-Validatoren bereits direkt erstellt werden können

