# Platform-Ports Refactoring: Vollständige DIP-Konformität

**Datum:** 2025-11-28  
**Status:** Geplant  
**Priorität:** Hoch  
**Geschätzter Aufwand:** 12-16 Stunden

## Ziel

Einführung von 3 fehlenden Platform-Ports (`PlatformNotificationPort`, `PlatformCachePort`, `PlatformI18nPort`), damit der Application-Layer ausschließlich Domain-Ports verwendet und nie direkt Infrastructure-Services importiert.

## Architektur-Verständnis

### Schichtenarchitektur

```
Application Layer (Business-Logik)
    ↓ verwendet nur
Domain Layer (Platform-Port-Interfaces)
    ↓ implementiert von
Platform Layer
    ├── Foundry Platform
    │   ├── Platform-Hubs (NotificationCenter)
    │   ├── Platform-Services (FoundryUI, FoundrySettings)
    │   └── Version-Layer (FoundryV13UIPort, etc.)
    └── Infrastructure/Browser Platform
        └── Platform-Services (ConsoleLogger, MapCache, LocalI18n)
```

### Wichtige Erkenntnisse

1. **Alle externen Abhängigkeiten sind "Platforms"** aus Domain-Sicht:
   - Foundry = Platform
   - Roll20 = Platform
   - Infrastructure/Node.js = Platform
   - Browser APIs = Platform

2. **Platform-Ports abstrahieren alle externen Abhängigkeiten**:
   - `PlatformNotificationPort` → abstrahiert Foundry UI + Console
   - `PlatformCachePort` → abstrahiert Maps, Redis, LocalStorage, etc.
   - `PlatformI18nPort` → abstrahiert Foundry i18n + Local JSON

3. **Platform-Hubs orchestrieren mehrere Platform-Services**:
   - `NotificationCenter` orchestriert `UIChannel` (Foundry) + `ConsoleChannel` (Browser)

4. **Application-Service → Application-Service**: Direkt OK (kein Port nötig)
5. **Application-Service → Infrastructure-Service**: Über Platform-Port (DIP-Konformität)

## Betroffene Services

### 1. PlatformNotificationPort (Priorität: Hoch)

**Problem:** Foundry-spezifische Typen (`FoundryNotificationOptions`) im Interface

**Betroffene Dateien:** 7
- `src/application/services/ModuleEventRegistrar.ts`
- `src/application/services/ModuleSettingsRegistrar.ts`
- `src/application/services/JournalVisibilityService.ts`
- `src/application/use-cases/trigger-journal-directory-rerender.use-case.ts`
- `src/application/use-cases/process-journal-directory-on-render.use-case.ts`
- `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`
- `src/application/handlers/hide-journal-context-menu-handler.ts`

**Aktueller Import:**
```typescript
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
```

**Problem:** `NotificationCenterOptions` enthält `uiOptions?: FoundryNotificationOptions`

### 2. PlatformCachePort (Priorität: Mittel)

**Betroffene Dateien:** 2
- `src/application/services/JournalVisibilityService.ts`
- `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`

**Aktueller Import:**
```typescript
import type { CacheService } from "@/infrastructure/cache/cache.interface";
```

### 3. PlatformI18nPort (Priorität: Mittel)

**Betroffene Dateien:** 2
- `src/application/services/ModuleSettingsRegistrar.ts`
- `src/application/settings/setting-definition.interface.ts`

**Aktueller Import:**
```typescript
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
```

## Umsetzungsschritte

### Phase 1: PlatformNotificationPort (Priorität 1)

#### 1.1 Domain-Port erstellen

**Datei:** `src/domain/ports/platform-notification-port.interface.ts`

**Inhalt:**
```typescript
import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic error for notification operations.
 */
export interface PlatformNotificationError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Platform-agnostic options for notifications.
 * 
 * NOTE: Platform-specific options (e.g., FoundryNotificationOptions) are handled
 * internally by adapters via type guards. This keeps the domain layer clean.
 */
export interface PlatformNotificationOptions {
  channels?: string[];
  traceId?: string;
  // Platform-specific options are handled by adapters, not exposed here
}

/**
 * Platform-agnostic port for notifications.
 *
 * Abstraction that allows domain/application layers to send notifications
 * without knowing about the underlying platform (Foundry UI, Console, etc.).
 *
 * Implementations:
 * - Foundry: NotificationPortAdapter (wraps NotificationCenter with Foundry UI + Console)
 * - Roll20: Roll20NotificationAdapter
 * - Headless: ConsoleOnlyNotificationAdapter
 */
export interface PlatformNotificationPort {
  /**
   * Send a debug notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  debug(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send an info notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  info(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send a warning notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  warn(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send an error notification.
   * @param context - The notification context/message
   * @param error - Optional error object
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  error(
    context: string,
    error?: { code?: string; message: string; details?: unknown },
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Add a notification channel dynamically.
   * @param channelName - Name of the channel to add
   * @returns Result indicating success or error
   */
  addChannel(channelName: string): Result<void, PlatformNotificationError>;

  /**
   * Remove a notification channel.
   * @param channelName - Name of the channel to remove
   * @returns Result with boolean (true if removed, false if not found) or error
   */
  removeChannel(channelName: string): Result<boolean, PlatformNotificationError>;

  /**
   * Get list of registered channel names.
   * @returns Result with array of channel names or error
   */
  getChannelNames(): Result<string[], PlatformNotificationError>;
}
```

#### 1.2 Token erstellen

**Datei:** `src/infrastructure/shared/tokens/ports.tokens.ts`

**Hinzufügen:**
```typescript
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";

/**
 * DI Token for PlatformNotificationPort.
 *
 * Platform-agnostic notification port.
 * Default implementation: NotificationPortAdapter (wraps NotificationCenter)
 */
export const platformNotificationPortToken = createInjectionToken<PlatformNotificationPort>(
  "PlatformNotificationPort"
);
```

#### 1.3 Adapter erstellen

**Datei:** `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts`

**Implementierung:**
```typescript
import type { Result } from "@/domain/types/result";
import type {
  PlatformNotificationPort,
  PlatformNotificationError,
  PlatformNotificationOptions,
} from "@/domain/ports/platform-notification-port.interface";
import type { NotificationService, NotificationCenterOptions } from "@/infrastructure/notifications/notification-center.interface";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import { ok, err } from "@/infrastructure/shared/utils/result";

/**
 * Adapter that implements PlatformNotificationPort by wrapping NotificationCenter.
 *
 * Translates platform-agnostic options to NotificationCenter options.
 * Handles Foundry-specific options via type guards internally.
 */
export class NotificationPortAdapter implements PlatformNotificationPort {
  constructor(private readonly notificationCenter: NotificationService) {}

  debug(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.debug(context, data, centerOptions);
    return this.mapResult(result);
  }

  info(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.info(context, data, centerOptions);
    return this.mapResult(result);
  }

  warn(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.warn(context, data, centerOptions);
    return this.mapResult(result);
  }

  error(
    context: string,
    error?: { code?: string; message: string; details?: unknown },
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.error(context, error, centerOptions);
    return this.mapResult(result);
  }

  addChannel(channelName: string): Result<void, PlatformNotificationError> {
    // NotificationCenter uses channel objects, not names
    // This would need to be implemented via a channel registry or similar
    return err({
      code: "OPERATION_NOT_SUPPORTED",
      message: "Dynamic channel addition via name not supported. Use NotificationCenter.addChannel() directly.",
      operation: "addChannel",
    });
  }

  removeChannel(channelName: string): Result<boolean, PlatformNotificationError> {
    const removed = this.notificationCenter.removeChannel(channelName);
    return ok(removed);
  }

  getChannelNames(): Result<string[], PlatformNotificationError> {
    const names = this.notificationCenter.getChannelNames();
    return ok(names);
  }

  // ===== Private Helpers =====

  /**
   * Maps platform-agnostic options to NotificationCenter options.
   * Handles Foundry-specific options via type guard if present.
   */
  private mapToCenterOptions(
    options?: PlatformNotificationOptions
  ): NotificationCenterOptions | undefined {
    if (!options) return undefined;

    const centerOptions: NotificationCenterOptions = {
      channels: options.channels,
      traceId: options.traceId,
    };

    // Type guard: Check if options contain Foundry-specific properties
    // This allows adapters to pass Foundry options without exposing them in the domain
    if (this.isFoundryNotificationOptions(options)) {
      centerOptions.uiOptions = options as unknown as FoundryNotificationOptions;
    }

    return centerOptions;
  }

  /**
   * Type guard to detect Foundry-specific notification options.
   * This allows adapters to pass Foundry options without exposing them in the domain interface.
   */
  private isFoundryNotificationOptions(
    options: unknown
  ): options is FoundryNotificationOptions {
    return (
      typeof options === "object" &&
      options !== null &&
      ("permanent" in options ||
        "console" in options ||
        "localize" in options ||
        "progress" in options)
    );
  }

  /**
   * Maps NotificationCenter Result to PlatformNotificationPort Result.
   */
  private mapResult(result: Result<void, string>): Result<void, PlatformNotificationError> {
    if (result.ok) {
      return ok(undefined);
    }
    return err({
      code: "NOTIFICATION_FAILED",
      message: result.error,
      operation: "notify",
    });
  }
}

/**
 * DI-enabled wrapper for NotificationPortAdapter.
 */
export class DINotificationPortAdapter extends NotificationPortAdapter {
  static dependencies = [notificationCenterToken] as const;

  constructor(notificationCenter: NotificationService) {
    super(notificationCenter);
  }
}
```

#### 1.4 DI-Registrierung anpassen

**Datei:** `src/framework/config/modules/notifications.config.ts`

**Hinzufügen:**
```typescript
import { platformNotificationPortToken } from "@/infrastructure/shared/tokens";
import { DINotificationPortAdapter } from "@/infrastructure/adapters/notifications/platform-notification-port-adapter";

// Nach NotificationCenter-Registrierung:
const notificationPortResult = container.registerClass(
  platformNotificationPortToken,
  DINotificationPortAdapter,
  ServiceLifecycle.SINGLETON
);
if (isErr(notificationPortResult)) {
  return err(`Failed to register PlatformNotificationPort: ${notificationPortResult.error.message}`);
}
```

#### 1.5 Application-Layer migrieren

**Alle 7 betroffenen Dateien:**
- Import ändern: `NotificationService` → `PlatformNotificationPort`
- Token ändern: `notificationCenterToken` → `platformNotificationPortToken`
- Typ-Anpassungen: `NotificationCenterOptions` → `PlatformNotificationOptions` oder entfernen

**Beispiel:**
```typescript
// Vorher:
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import { notificationCenterToken } from "@/infrastructure/shared/tokens";

constructor(private readonly notificationCenter: NotificationService) {}

// Nachher:
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import { platformNotificationPortToken } from "@/infrastructure/shared/tokens";

constructor(private readonly notifications: PlatformNotificationPort) {}
```

### Phase 2: PlatformCachePort (Priorität 2)

#### 2.1 Domain-Port erstellen

**Datei:** `src/domain/ports/platform-cache-port.interface.ts`

**Inhalt:** Interface identisch zu `CacheService`, aber als Domain-Port
- Alle Methoden: `get()`, `set()`, `delete()`, `has()`, `clear()`, `invalidateWhere()`, `getMetadata()`, `getStatistics()`, `getOrSet()`
- Types: `CacheKey`, `CacheKeyParts`, `CacheSetOptions`, `CacheEntryMetadata`, `CacheLookupResult`, `CacheStatistics` bleiben in Domain

**Hinweis:** Die Cache-Types können in `src/domain/types/cache/` verschoben werden, oder bleiben in `src/infrastructure/cache/` und werden nur importiert.

#### 2.2 Token erstellen

**Datei:** `src/infrastructure/shared/tokens/ports.tokens.ts`

**Hinzufügen:**
```typescript
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";

export const platformCachePortToken = createInjectionToken<PlatformCachePort>("PlatformCachePort");
```

#### 2.3 Adapter erstellen

**Datei:** `src/infrastructure/adapters/cache/platform-cache-port-adapter.ts`

**Implementierung:** `CacheService` implementiert `PlatformCachePort` (Wrapper-Klasse oder direkte Implementierung)

#### 2.4 DI-Registrierung anpassen

**Datei:** `src/framework/config/modules/cache-services.config.ts`

**Hinzufügen:** `PlatformCachePort` registrieren

#### 2.5 Application-Layer migrieren

**2 Dateien:**
- `src/application/services/JournalVisibilityService.ts`
- `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`

### Phase 3: PlatformI18nPort (Priorität 3)

#### 3.1 Domain-Port erstellen

**Datei:** `src/domain/ports/platform-i18n-port.interface.ts`

**Inhalt:** Interface identisch zu `I18nFacadeService`, aber als Domain-Port
- Methoden: `translate()`, `format()`, `has()`, `loadLocalTranslations()`

#### 3.2 Token erstellen

**Datei:** `src/infrastructure/shared/tokens/ports.tokens.ts`

**Hinzufügen:**
```typescript
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";

export const platformI18nPortToken = createInjectionToken<PlatformI18nPort>("PlatformI18nPort");
```

#### 3.3 Adapter erstellen

**Datei:** `src/infrastructure/adapters/i18n/platform-i18n-port-adapter.ts`

**Implementierung:** `I18nFacadeService` implementiert `PlatformI18nPort` (Wrapper-Klasse oder direkte Implementierung)

#### 3.4 DI-Registrierung anpassen

**Datei:** `src/framework/config/modules/i18n-services.config.ts`

**Hinzufügen:** `PlatformI18nPort` registrieren

#### 3.5 Application-Layer migrieren

**2 Dateien:**
- `src/application/services/ModuleSettingsRegistrar.ts`
- `src/application/settings/setting-definition.interface.ts`

## Technische Details

### Port-Interface-Pattern

```typescript
// Domain-Port (platform-agnostisch)
export interface PlatformNotificationPort {
  debug(context: string, data?: unknown, options?: PlatformNotificationOptions): Result<void, PlatformNotificationError>;
  // ... weitere Methoden
}

// Infrastructure-Adapter (implementiert Port)
export class NotificationPortAdapter implements PlatformNotificationPort {
  constructor(private readonly notificationCenter: NotificationService) {}
  // Delegiert an NotificationCenter, übersetzt Foundry-Optionen per Typ-Guard
}
```

### Typ-Guard für Foundry-Optionen

```typescript
// In NotificationPortAdapter
private isFoundryNotificationOptions(options: unknown): options is FoundryNotificationOptions {
  return (
    typeof options === "object" &&
    options !== null &&
    ("permanent" in options || "console" in options || "localize" in options || "progress" in options)
  );
}
```

### Token-Update in ServiceType

**Datei:** `src/infrastructure/shared/tokens/index.ts`

**ServiceType Union:** Neue Ports hinzufügen (`PlatformNotificationPort`, `PlatformCachePort`, `PlatformI18nPort`)

### Rückwärtskompatibilität

- Alte Tokens (`notificationCenterToken`, `cacheServiceToken`, `i18nFacadeToken`) bleiben erhalten
- Alte Interfaces bleiben in Infrastructure (für interne Verwendung)
- Application-Layer verwendet nur noch Platform-Ports

## Test-Strategie

### Unit-Tests
- Port-Interfaces: Interface-Konformität testen
- Adapter: Delegation an ursprüngliche Services testen
- Typ-Guards: Foundry-Optionen-Erkennung testen

### Integration-Tests
- DI-Registrierung: Alle Ports korrekt registriert
- Token-Auflösung: Ports werden korrekt injiziert
- Application-Layer: Funktionalität unverändert

## Dokumentation

### CHANGELOG.md
- Unreleased-Sektion: Alle 3 Ports dokumentieren
- Breaking Changes: Keine (alte Tokens bleiben)
- Upgrade-Hinweise: Migration zu Platform-Ports empfohlen

### ARCHITECTURE.md
- Port-Liste aktualisieren
- DIP-Konformität dokumentieren
- Schichtenarchitektur-Diagramm aktualisieren

## Reihenfolge der Umsetzung

1. **PlatformNotificationPort** (höchste Priorität - Foundry-spezifische Typen)
2. **PlatformCachePort** (einfach - direkte 1:1-Mapping)
3. **PlatformI18nPort** (einfach - direkte 1:1-Mapping)

Jede Phase kann unabhängig umgesetzt werden, aber empfohlene Reihenfolge für minimale Abhängigkeiten.

## Geschätzter Aufwand

- **Phase 1 (PlatformNotificationPort)**: 6-8 Stunden
  - Port-Interface: 1h
  - Adapter mit Typ-Guard: 2-3h
  - DI-Registrierung: 0.5h
  - Migration 7 Dateien: 2-3h
  - Tests: 1h

- **Phase 2 (PlatformCachePort)**: 3-4 Stunden
  - Port-Interface: 0.5h
  - Adapter: 1h
  - DI-Registrierung: 0.5h
  - Migration 2 Dateien: 1h
  - Tests: 0.5h

- **Phase 3 (PlatformI18nPort)**: 3-4 Stunden
  - Port-Interface: 0.5h
  - Adapter: 1h
  - DI-Registrierung: 0.5h
  - Migration 2 Dateien: 1h
  - Tests: 0.5h

**Gesamt:** 12-16 Stunden

## Erfolgskriterien

- ✅ Keine Infrastructure-Imports mehr im Application-Layer (außer Utility-Funktionen)
- ✅ Alle Services verwenden Platform-Ports
- ✅ Alle Tests bestehen
- ✅ TypeScript- und Lint-Checks bestehen
- ✅ DIP-Konformität: 100%

