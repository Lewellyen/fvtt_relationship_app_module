# SRP Refactoring Plan: ModuleSettingsRegistrar

**Status:** 📋 Geplant
**Priorität:** 🟡 Niedrig
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Settings-Registrierung von RuntimeConfig-Synchronisation

---

## Problem

`ModuleSettingsRegistrar` verletzt das Single Responsibility Principle (SRP) durch zwei Hauptverantwortlichkeiten:

1. **Settings-Registrierung**: Foundry Settings registrieren
2. **RuntimeConfig-Synchronisation**: Settings-Werte mit RuntimeConfig synchronisieren

**Aktuelle Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class ModuleSettingsRegistrar {
  // 1. Settings registrieren
  registerAll(): void {
    this.registerDefinition(logLevelSetting, ...);
    // ...
  }

  // 2. RuntimeConfig-Bridge an Settings anhängen
  private attachRuntimeConfigBridge<TSchema, K extends RuntimeConfigKey>(
    config: ModuleSettingConfig<TSchema>,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>
  ): ModuleSettingConfig<TSchema>

  // 3. Initiale Synchronisation von Settings zu RuntimeConfig
  private syncRuntimeConfigFromSettings<TSchema, K extends RuntimeConfigKey>(
    settings: SettingsRegistrationPort,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    notifications: PlatformNotificationPort,
    settingKey: string
  ): void
}
```

**Probleme:**
- Settings-Registrierung und RuntimeConfig-Sync sind vermischt
- Schwer testbar (zwei Concerns in einer Klasse)
- RuntimeConfig-Sync-Logik könnte wiederverwendbar sein

---

## Ziel-Architektur

### 1. ModuleSettingsRegistrar (Settings-Registrierung)
**Verantwortlichkeit:** Nur Settings bei Foundry registrieren

```typescript
export class ModuleSettingsRegistrar {
  /**
   * Registriert alle Modul-Settings bei Foundry.
   */
  registerAll(): void {
    this.registerDefinition(logLevelSetting, ...);
    // ...
  }

  /**
   * Registriert eine einzelne Setting-Definition.
   */
  private registerDefinition<TSchema>(
    definition: SettingDefinition<TSchema>,
    settings: SettingsRegistrationPort,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: LoggingPort
  ): void
}
```

### 2. RuntimeConfigSync (Synchronisation)
**Verantwortlichkeit:** Nur Synchronisation zwischen Settings und RuntimeConfig

```typescript
export class RuntimeConfigSync {
  /**
   * Bindet RuntimeConfig-Synchronisation an ein Setting.
   */
  attachBinding<TSchema, K extends RuntimeConfigKey>(
    config: ModuleSettingConfig<TSchema>,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>
  ): ModuleSettingConfig<TSchema>

  /**
   * Synchronisiert initialen Setting-Wert zu RuntimeConfig.
   */
  syncInitialValue<TSchema, K extends RuntimeConfigKey>(
    settings: SettingsRegistrationPort,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    settingKey: string,
    notifications: PlatformNotificationPort
  ): void
}
```

---

## Schritt-für-Schritt Migration

### Phase 1: RuntimeConfigSync extrahieren

1. **Neue Klasse erstellen:**
   ```typescript
   // src/application/services/RuntimeConfigSync.ts
   export class RuntimeConfigSync {
     /**
      * Bindet RuntimeConfig-Synchronisation an ein Setting.
      */
     attachBinding<TSchema, K extends RuntimeConfigKey>(
       config: ModuleSettingConfig<TSchema>,
       runtimeConfig: RuntimeConfigService,
       binding: RuntimeConfigBinding<TSchema, K>
     ): ModuleSettingConfig<TSchema> {
       const originalOnChange = config.onChange;
       return {
         ...config,
         onChange: (value: TSchema) => {
           const normalized = binding.normalize(value);
           runtimeConfig.setFromFoundry(binding.runtimeKey, normalized);
           originalOnChange?.(value);
         },
       };
     }

     /**
      * Synchronisiert initialen Setting-Wert zu RuntimeConfig.
      */
     syncInitialValue<TSchema, K extends RuntimeConfigKey>(
       settings: SettingsRegistrationPort,
       runtimeConfig: RuntimeConfigService,
       binding: RuntimeConfigBinding<TSchema, K>,
       settingKey: string,
       notifications: PlatformNotificationPort
     ): void {
       const currentValue = settings.getSettingValue(
         MODULE_METADATA.ID,
         settingKey,
         binding.validator
       );

       if (!currentValue.ok) {
         notifications.warn(`Failed to read initial value for ${settingKey}`, currentValue.error, {
           channels: ["ConsoleChannel"],
         });
         return;
       }

       runtimeConfig.setFromFoundry(binding.runtimeKey, binding.normalize(currentValue.value));
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIRuntimeConfigSync extends RuntimeConfigSync {
     static dependencies = [
       runtimeConfigToken,
       platformNotificationPortToken,
     ] as const;

     constructor(
       runtimeConfig: RuntimeConfigService,
       notifications: PlatformNotificationPort
     ) {
       super(runtimeConfig, notifications);
     }
   }
   ```

3. **Token erstellen:**
   ```typescript
   // src/application/tokens/application.tokens.ts
   export const runtimeConfigSyncToken: InjectionToken<RuntimeConfigSync> =
     createToken<RuntimeConfigSync>("runtimeConfigSync");
   ```

4. **In DI-Config registrieren:**
   ```typescript
   // src/framework/config/modules/application-services.config.ts
   container.registerClass(
     runtimeConfigSyncToken,
     DIRuntimeConfigSync,
     ServiceLifecycle.SINGLETON
   );
   ```

### Phase 2: ModuleSettingsRegistrar refactoren

1. **RuntimeConfigSync injizieren:**
   ```typescript
   export class ModuleSettingsRegistrar {
     constructor(
       private readonly settings: SettingsRegistrationPort,
       private readonly runtimeConfigSync: RuntimeConfigSync, // NEU
       private readonly notifications: PlatformNotificationPort,
       private readonly i18n: PlatformI18nPort,
       private readonly logger: LoggingPort
     ) {}
   }
   ```

2. **Methoden entfernen:**
   - `attachRuntimeConfigBridge()` → `runtimeConfigSync.attachBinding()`
   - `syncRuntimeConfigFromSettings()` → `runtimeConfigSync.syncInitialValue()`

3. **registerDefinition() aktualisieren:**
   ```typescript
   private registerDefinition<TSchema, K extends RuntimeConfigKey>(
     definition: SettingDefinition<TSchema>,
     binding: RuntimeConfigBinding<TSchema, K> | undefined,
     settings: SettingsRegistrationPort,
     notifications: PlatformNotificationPort,
     i18n: PlatformI18nPort,
     logger: LoggingPort
   ): void {
     const config = definition.createConfig(i18n, logger);

     // RuntimeConfig-Binding anhängen (wenn vorhanden)
     const configWithRuntimeBridge = binding
       ? this.runtimeConfigSync.attachBinding(config, binding)
       : config;

     // Setting registrieren
     const result = settings.registerSetting(
       MODULE_METADATA.ID,
       definition.key,
       configWithRuntimeBridge
     );

     if (!result.ok) {
       notifications.error(`Failed to register ${definition.key} setting`, result.error, {
         channels: ["ConsoleChannel"],
       });
       return;
     }

     // Initiale Synchronisation (wenn Binding vorhanden)
     if (binding) {
       this.runtimeConfigSync.syncInitialValue(
         settings,
         binding,
         definition.key,
         notifications
       );
     }
   }
   ```

### Phase 3: Tests aktualisieren

1. **Unit-Tests für RuntimeConfigSync:**
   - `attachBinding()` testen
   - `syncInitialValue()` testen
   - Mock `RuntimeConfigService` und `SettingsRegistrationPort`

2. **Unit-Tests für ModuleSettingsRegistrar:**
   - Nur Settings-Registrierung testen
   - Mock `RuntimeConfigSync`

3. **Integration-Tests:**
   - Vollständige Settings-Registrierung mit RuntimeConfig-Sync

---

## Breaking Changes

### API-Änderungen

1. **ModuleSettingsRegistrar:**
   - ✅ Keine öffentlichen API-Änderungen
   - ✅ Nur interne Refaktorierung

2. **Neue Abhängigkeiten:**
   - `ModuleSettingsRegistrar` benötigt `RuntimeConfigSync`

### Migration für externe Nutzer

**Keine Breaking Changes** - API bleibt stabil.

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Bessere Testbarkeit**: Settings-Registrierung und RuntimeConfig-Sync isoliert testbar
3. ✅ **Wiederverwendbarkeit**: `RuntimeConfigSync` für andere Settings-Kontexte nutzbar
4. ✅ **Klarere Abhängigkeiten**: Explizite Dependencies
5. ✅ **Einfachere Wartung**: Änderungen an Sync-Logik betreffen nur RuntimeConfigSync

---

## Risiken

1. **Sehr Niedrig**: Nur interne Refaktorierung
2. **Sehr Niedrig**: Keine öffentlichen API-Änderungen
3. **Sehr Niedrig**: Tests müssen angepasst werden

---

## Checkliste

- [ ] `RuntimeConfigSync` Klasse erstellen
- [ ] DI-Wrapper und Token erstellen
- [ ] In DI-Config registrieren
- [ ] `ModuleSettingsRegistrar` refactoren
- [ ] `attachRuntimeConfigBridge()` entfernen
- [ ] `syncRuntimeConfigFromSettings()` entfernen
- [ ] Unit-Tests für `RuntimeConfigSync` schreiben
- [ ] Unit-Tests für `ModuleSettingsRegistrar` aktualisieren
- [ ] Integration-Tests aktualisieren
- [ ] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/application/services/ModuleSettingsRegistrar.ts`
- **RuntimeConfigService:** `src/application/services/RuntimeConfigService.ts`
- **Settings Port:** `src/domain/ports/settings-registration-port.interface.ts`

