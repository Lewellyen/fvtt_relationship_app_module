# Refactoring: ModuleSettingsRegistrar - Fehler-Mapping extrahieren

## Kontext

**Quelle**: SRP-Review vom 2024-12-02, Finding 1
**Datei**: `src/application/services/ModuleSettingsRegistrar.ts`
**Zeilen**: 169-179

## Problem

`ModuleSettingsRegistrar.registerDefinition` mappt `DomainSettingsError` zu Notification-Format. Dies ist eine separate Verantwortlichkeit, die gegen das Single Responsibility Principle (SRP) verstößt.

**Aktuelle Verantwortlichkeiten**:
1. Settings-Registrierung orchestrieren
2. RuntimeConfig-Synchronisation (bereits via `RuntimeConfigSync` getrennt)
3. **Fehler-Mapping zu Notification-Format** ← Diese Verantwortlichkeit soll extrahiert werden

**SRP-Risiko**: Änderungen an Fehlerformaten oder Notification-Channels betreffen dieselbe Klasse wie Settings-Registrierung.

## Lösung

`SettingRegistrationErrorMapper` als separate Komponente einführen, die ausschließlich für Fehler-Mapping und Notification zuständig ist.

## Refactoring-Schritte

### 1. Neue Klasse erstellen: `SettingRegistrationErrorMapper`

```typescript
// src/application/services/SettingRegistrationErrorMapper.ts
import type { DomainSettingsError } from "@/domain/types/settings";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";

/**
 * Maps DomainSettingsError to notification format.
 * Single Responsibility: Only handles error format conversion and notification.
 */
export class SettingRegistrationErrorMapper {
  constructor(private readonly notifications: PlatformNotificationPort) {}

  mapAndNotify(
    error: DomainSettingsError,
    settingKey: string
  ): void {
    const notificationError: { code: string; message: string; [key: string]: unknown } = {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    };

    this.notifications.error(`Failed to register ${settingKey} setting`, notificationError, {
      channels: ["ConsoleChannel"],
    });
  }
}
```

### 2. DI-Wrapper erstellen

```typescript
// In SettingRegistrationErrorMapper.ts
import { platformNotificationPortToken } from "@/application/tokens/domain-ports.tokens";

export class DISettingRegistrationErrorMapper extends SettingRegistrationErrorMapper {
  static dependencies = [platformNotificationPortToken] as const;

  constructor(notifications: PlatformNotificationPort) {
    super(notifications);
  }
}
```

### 3. ModuleSettingsRegistrar vereinfachen

```typescript
// In ModuleSettingsRegistrar.ts
import { SettingRegistrationErrorMapper } from "./SettingRegistrationErrorMapper";

export class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsRegistrationPort,
    private readonly runtimeConfigSync: RuntimeConfigSync,
    private readonly errorMapper: SettingRegistrationErrorMapper, // Neu
    private readonly notifications: PlatformNotificationPort,
    private readonly i18n: PlatformI18nPort,
    private readonly logger: PlatformLoggingPort,
    private readonly validator: PlatformValidationPort
  ) {}

  // ... registerAll() bleibt unverändert ...

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    settings: PlatformSettingsRegistrationPort,
    runtimeConfigSync: RuntimeConfigSync,
    errorMapper: SettingRegistrationErrorMapper, // Neu
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ): void {
    const config = definition.createConfig(i18n, logger, validator);
    const configWithRuntimeBridge = binding
      ? runtimeConfigSync.attachBinding(config, binding)
      : config;

    const result = settings.registerSetting(
      MODULE_METADATA.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      errorMapper.mapAndNotify(result.error, definition.key); // Vereinfacht
      return;
    }

    if (binding) {
      runtimeConfigSync.syncInitialValue(settings, binding, definition.key);
    }
  }
}
```

### 4. DI-Konfiguration anpassen

```typescript
// In src/config/modules/registrars.config.ts oder entsprechender Config-Datei
import { settingRegistrationErrorMapperToken } from "@/application/tokens/application.tokens";
import { DISettingRegistrationErrorMapper } from "@/application/services/SettingRegistrationErrorMapper";

// Token registrieren
container.register(settingRegistrationErrorMapperToken, {
  factory: (c) => new DISettingRegistrationErrorMapper(
    c.resolve(platformNotificationPortToken)
  ),
  lifecycle: ServiceLifecycle.SINGLETON,
});

// ModuleSettingsRegistrar anpassen
container.register(moduleSettingsRegistrarToken, {
  factory: (c) => new DIModuleSettingsRegistrar(
    c.resolve(platformSettingsRegistrationPortToken),
    c.resolve(runtimeConfigSyncToken),
    c.resolve(settingRegistrationErrorMapperToken), // Neu
    c.resolve(platformNotificationPortToken),
    c.resolve(platformI18nPortToken),
    c.resolve(platformLoggingPortToken),
    c.resolve(platformValidationPortToken)
  ),
  lifecycle: ServiceLifecycle.SINGLETON,
});
```

### 5. Token definieren

```typescript
// In src/application/tokens/application.tokens.ts
export const settingRegistrationErrorMapperToken = createToken<SettingRegistrationErrorMapper>(
  "SettingRegistrationErrorMapper"
);
```

## Vorteile

- ✅ **Klare Trennung**: Fehler-Mapping ist isoliert von Settings-Registrierung
- ✅ **Testbarkeit**: `SettingRegistrationErrorMapper` kann isoliert getestet werden
- ✅ **Wiederverwendbarkeit**: Kann für andere Settings-Registrierungen genutzt werden
- ✅ **SRP-konform**: Jede Klasse hat eine einzige Verantwortlichkeit

## Test-Strategie

### Unit-Tests für `SettingRegistrationErrorMapper`

```typescript
describe("SettingRegistrationErrorMapper", () => {
  it("should map DomainSettingsError to notification format", () => {
    const mockNotifications = createMockNotificationPort();
    const mapper = new SettingRegistrationErrorMapper(mockNotifications);
    const error: DomainSettingsError = {
      code: "SETTING_REGISTRATION_FAILED",
      message: "Test error",
      details: { key: "test" },
    };

    mapper.mapAndNotify(error, "test.setting");

    expect(mockNotifications.error).toHaveBeenCalledWith(
      "Failed to register test.setting setting",
      {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Test error",
        details: { key: "test" },
      },
      { channels: ["ConsoleChannel"] }
    );
  });
});
```

## Migration

**Breaking Changes**: Keine - nur interne Strukturen werden geändert. Externe APIs bleiben kompatibel.

**Schritte**:
1. Neue Klasse `SettingRegistrationErrorMapper` erstellen
2. Token und DI-Konfiguration hinzufügen
3. `ModuleSettingsRegistrar` anpassen
4. Tests schreiben
5. Bestehende Tests anpassen (falls nötig)

## Verwandte Dateien

- `src/application/services/ModuleSettingsRegistrar.ts`
- `src/application/services/RuntimeConfigSync.ts`
- `src/domain/types/settings.ts` (DomainSettingsError)
- `src/config/modules/registrars.config.ts` (DI-Konfiguration)

