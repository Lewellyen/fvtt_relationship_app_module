---
principle: ISP
severity: low
confidence: high
component_kind: interface
component_name: "PlatformSettingsPort"
file: "src/domain/ports/platform-settings-port.interface.ts"
location:
  start_line: 36
  end_line: 114
tags: ["interface-segregation", "settings", "registration"]
---

# Problem

Das Interface `PlatformSettingsPort` kombiniert drei unterschiedliche Verantwortlichkeiten:
1. **Registration**: `register()` - Registrierung von Settings
2. **Read**: `get()` - Lesen von Settings
3. **Write**: `set()` - Schreiben von Settings

Clients, die nur Settings lesen möchten, müssen trotzdem `register()` und `set()` implementieren.

## Evidence

```36:114:src/domain/ports/platform-settings-port.interface.ts
export interface PlatformSettingsPort {
  /**
   * Register a new setting.
   *
   * Must be called during initialization phase (before platform is ready).
   * Some platforms (e.g., Foundry) only allow registration during init hook.
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError>;

  /**
   * Get current value of a setting with runtime validation.
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError>;

  /**
   * Set value of a setting.
   */
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>>;
}
```

Das Interface definiert drei Methoden für unterschiedliche Phasen:
- **Initialisierung**: `register()` - nur während Init-Phase
- **Runtime Read**: `get()` - zur Laufzeit
- **Runtime Write**: `set()` - zur Laufzeit

## Impact

- **Verschiedene Phasen**: Registration und Runtime-Operationen sind in einem Interface
- **Potentielle Überlastung**: Clients, die nur Settings lesen möchten, müssen auch `register()` und `set()` implementieren
- **Schwerer zu mocken**: Alle drei Methoden müssen gemockt werden

## Recommendation

**Option 1: Separate Interfaces (Optional)**
Interfaces nach Verantwortlichkeit trennen:

```typescript
// Registration (nur während Init)
export interface PlatformSettingsRegistrationPort {
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError>;
}

// Read-Only Settings
export interface PlatformSettingsReadPort {
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError>;
}

// Write-Only Settings
export interface PlatformSettingsWritePort {
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>>;
}

// Full Settings Port (kombiniert alle)
export interface PlatformSettingsPort
  extends PlatformSettingsRegistrationPort,
          PlatformSettingsReadPort,
          PlatformSettingsWritePort {
}
```

**Option 2: Keine Änderung (Empfohlen)**
Settings-Operationen gehören semantisch zusammen. Die Trennung würde die Komplexität erhöhen, ohne großen Nutzen zu bringen. Es gibt bereits ein separates `PlatformSettingsRegistrationPort` Interface.

## Example Fix

Falls Trennung gewünscht wird:

```typescript
// src/domain/ports/platform-settings-read-port.interface.ts
export interface PlatformSettingsReadPort {
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError>;
}
```

```typescript
// src/domain/ports/platform-settings-write-port.interface.ts
export interface PlatformSettingsWritePort {
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>>;
}
```

```typescript
// src/domain/ports/platform-settings-port.interface.ts
import type { PlatformSettingsRegistrationPort } from "./platform-settings-registration-port.interface";
import type { PlatformSettingsReadPort } from "./platform-settings-read-port.interface";
import type { PlatformSettingsWritePort } from "./platform-settings-write-port.interface";

export interface PlatformSettingsPort
  extends PlatformSettingsRegistrationPort,
          PlatformSettingsReadPort,
          PlatformSettingsWritePort {
}
```

## Notes

- **Status**: Low Severity, da Settings-Operationen semantisch zusammengehören
- Es gibt bereits ein separates `PlatformSettingsRegistrationPort` Interface
- **Empfehlung**: Option 2 (keine Änderung) - die Methoden gehören zusammen
- Die aktuelle Struktur ist für ein Settings-Interface angemessen
- Eine Trennung würde die Komplexität erhöhen, ohne großen Nutzen zu bringen

