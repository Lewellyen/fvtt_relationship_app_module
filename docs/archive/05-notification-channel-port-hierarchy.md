# Refactoring: Notification Channel Port Hierarchy

**Datum:** 2025-01-27
**Status:** Geplant
**Priorität:** Hoch (Architektur-Konsistenz)
**Abhängigkeiten:** Keine

---

## 🎯 Ziel

Refactoring des Notification-Systems zu einer **Port-Hierarchie** analog zum Event-System, um:
- **OCP-Konformität**: Neue Channel-Typen ohne Änderung bestehender Ports
- **Platform-Agnostizität**: `NotificationCenter` nutzt nur Domain-Ports
- **Konsistenz**: Gleiches Pattern wie `PlatformEventPort` → `PlatformJournalEventPort`
- **Saubere Dependency Chain**: Application → Domain-Ports → Infrastructure

---

## 📋 Aktueller Zustand (Problem)

### Architektur

```
Application-Layer Services
  ↓ nutzen
NotificationCenter (Infrastructure)
  ↓ nutzt direkt
NotificationChannel[] (Infrastructure-Interface)
  ↓ implementiert von
ConsoleChannel, UIChannel (Infrastructure, Foundry-spezifisch)
```

### Probleme

1. **NotificationCenter nutzt Infrastructure-Interface direkt**
   - Sollte nur Domain-Ports nutzen (wie Application-Layer)
   - Verletzt Dependency Inversion Principle

2. **UIChannel ist Foundry-spezifisch**
   - Nutzt `FoundryUI` direkt statt `PlatformUINotificationPort`
   - Könnte platform-agnostisch sein

3. **Keine Port-Hierarchie**
   - Keine Generalisierung/Spezialisierung wie beim Event-System
   - Schwer erweiterbar (OCP-Verletzung)

---

## 🏗️ Ziel-Architektur

### Port-Hierarchie (Domain-Layer)

```
PlatformChannelPort (abstrakt, generisch)
  ├─ PlatformUINotificationChannelPort (spezialisiert für UI)
  ├─ PlatformConsoleChannelPort (spezialisiert für Console)
  └─ PlatformSentryChannelPort (spezialisiert für Sentry, Zukunft)
```

### Dependency Chain

```
Application-Layer:
  └─ NotificationCenter
      └─ nutzt PlatformChannelPort[] (Domain-Ports!)

Domain-Layer:
  └─ PlatformChannelPort (abstrakt)
      ├─ PlatformUINotificationChannelPort
      └─ PlatformConsoleChannelPort

Infrastructure-Layer:
  └─ UINotificationChannel (implementiert PlatformUINotificationChannelPort)
      └─ nutzt PlatformUINotificationPort (Domain-Port!)
  └─ ConsoleChannel (implementiert PlatformConsoleChannelPort)
      └─ nutzt PlatformLoggingPort (Domain-Port!)
```

---

## 📐 Detaillierte Architektur

### 1. Domain-Layer: Port-Hierarchie

#### `PlatformChannelPort` (Basis-Interface)

```typescript
// src/domain/ports/notifications/platform-channel-port.interface.ts

import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic error for channel operations.
 */
export interface PlatformChannelError {
  code: string;
  message: string;
  channelName?: string;
  details?: unknown;
}

/**
 * Platform-agnostic notification message.
 */
export interface PlatformNotification {
  level: "debug" | "info" | "warn" | "error";
  context: string;
  data?: unknown;
  error?: { code?: string; message: string; details?: unknown };
  timestamp: Date;
  traceId?: string;
}

/**
 * Generic port for notification channels.
 *
 * Platform-agnostic abstraction for all channel types.
 * Similar to PlatformEventPort<TEvent> in the event system.
 *
 * Implementations:
 * - Foundry: UIChannel, ConsoleChannel
 * - Roll20: Roll20UIChannel, Roll20ConsoleChannel
 * - Headless: NoOpChannel, ConsoleChannel
 */
export interface PlatformChannelPort {
  /**
   * Unique channel name for identification.
   * Used for logging and channel management.
   */
  readonly name: string;

  /**
   * Determines if this channel should handle the given notification.
   *
   * Channels can filter by:
   * - Notification level (e.g., only errors)
   * - Context patterns (e.g., only "bootstrap*" messages)
   * - Custom logic (e.g., sampling rate for metrics)
   */
  canHandle(notification: PlatformNotification): boolean;

  /**
   * Sends the notification to this channel's output.
   *
   * Should not throw - return error Result instead.
   */
  send(notification: PlatformNotification): Result<void, PlatformChannelError>;
}
```

#### `PlatformUINotificationChannelPort` (Spezialisierung)

```typescript
// src/domain/ports/notifications/platform-ui-notification-channel-port.interface.ts

import type { PlatformChannelPort, PlatformChannelError } from "./platform-channel-port.interface";
import type { Result } from "@/domain/types/result";

/**
 * Specialized port for UI notification channels.
 *
 * Extends PlatformChannelPort with UI-specific operations.
 * Similar to PlatformJournalEventPort extending PlatformEventPort.
 *
 * Implementations:
 * - Foundry: UIChannel (wraps PlatformUINotificationPort)
 * - Roll20: Roll20UIChannel
 * - Headless: NoOpUIChannel
 */
export interface PlatformUINotificationChannelPort extends PlatformChannelPort {
  /**
   * Send notification to user interface.
   *
   * Platform mappings:
   * - Foundry: ui.notifications.info/warn/error()
   * - Roll20: sendChat()
   * - Headless: No-op
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError>;
}
```

#### `PlatformConsoleChannelPort` (Spezialisierung)

```typescript
// src/domain/ports/notifications/platform-console-channel-port.interface.ts

import type { PlatformChannelPort, PlatformChannelError } from "./platform-channel-port.interface";
import type { Result } from "@/domain/types/result";

/**
 * Specialized port for console logging channels.
 *
 * Extends PlatformChannelPort with console-specific operations.
 *
 * Implementations:
 * - Foundry: ConsoleChannel (wraps PlatformLoggingPort)
 * - Roll20: Roll20ConsoleChannel
 * - Headless: ConsoleChannel
 */
export interface PlatformConsoleChannelPort extends PlatformChannelPort {
  /**
   * Log to console.
   *
   * Platform mappings:
   * - Foundry: console.log/error/warn/info/debug()
   * - Roll20: log()
   * - Headless: console.log/error/warn/info/debug()
   */
  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void;
}
```

### 2. Application-Layer: NotificationCenter

```typescript
// src/application/services/NotificationCenter.ts

import type { Result } from "@/domain/types/result";
import type { PlatformChannelPort, PlatformNotification } from "@/domain/ports/notifications/platform-channel-port.interface";

/**
 * NotificationCenter - Central Message Bus for all application notifications.
 *
 * **Architecture:**
 * - Uses only Domain-Ports (PlatformChannelPort)
 * - Application-Layer (Business-Logic: Routing-Entscheidungen)
 * - Platform-agnostic
 */
export class NotificationCenter {
  private readonly channels: PlatformChannelPort[]; // Domain-Ports!

  constructor(initialChannels: PlatformChannelPort[]) {
    this.channels = [...initialChannels];
  }

  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string> {
    return this.notify("debug", context, { data }, options);
  }

  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string> {
    return this.notify("info", context, { data }, options);
  }

  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string> {
    return this.notify("warn", context, { data }, options);
  }

  error(
    context: string,
    error?: PlatformNotification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string> {
    return this.notify("error", context, { error }, options);
  }

  addChannel(channel: PlatformChannelPort): void {
    const alreadyRegistered = this.channels.some((existing) => existing.name === channel.name);
    if (!alreadyRegistered) {
      this.channels.push(channel);
    }
  }

  removeChannel(name: string): boolean {
    const index = this.channels.findIndex((channel) => channel.name === name);
    if (index === -1) {
      return false;
    }
    this.channels.splice(index, 1);
    return true;
  }

  getChannelNames(): string[] {
    return this.channels.map((channel) => channel.name);
  }

  private notify(
    level: PlatformNotification["level"],
    context: string,
    payload: Partial<Pick<PlatformNotification, "data" | "error">>,
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const notification: PlatformNotification = {
      level,
      context,
      timestamp: new Date(),
      ...(payload.data !== undefined ? { data: payload.data } : {}),
      ...(payload.error !== undefined ? { error: payload.error } : {}),
      ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
    };

    const targetChannels = this.selectChannels(options?.channels);
    let attempted = false;
    let succeeded = false;
    const failures: string[] = [];

    for (const channel of targetChannels) {
      if (!channel.canHandle(notification)) {
        continue;
      }

      attempted = true;
      const result = channel.send(notification);
      if (result.ok) {
        succeeded = true;
      } else {
        failures.push(`${channel.name}: ${result.error.message}`);
      }
    }

    if (!attempted) {
      if (options?.channels && options.channels.length > 0) {
        return err(
          `No channels attempted to handle notification (requested: ${options.channels.join(", ")})`
        );
      }
      return ok(undefined);
    }

    if (succeeded) {
      return ok(undefined);
    }

    return err(`All channels failed: ${failures.join("; ")}`);
  }

  private selectChannels(channelNames?: string[]): PlatformChannelPort[] {
    if (!channelNames || channelNames.length === 0) {
      return this.channels;
    }
    return this.channels.filter((channel) => channelNames.includes(channel.name));
  }
}
```

### 3. Infrastructure-Layer: Channel-Implementierungen

#### `UIChannel` (Platform-Agnostisch)

```typescript
// src/infrastructure/notifications/channels/UIChannel.ts

import type { Result } from "@/domain/types/result";
import type { PlatformUINotificationChannelPort, PlatformNotification, PlatformChannelError } from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { PlatformUINotificationPort } from "@/domain/ports/platform-ui-notification-port.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { ok, err } from "@/domain/utils/result";

/**
 * UI Channel - Routes notifications to platform UI.
 *
 * **Platform-Agnostic:**
 * - Uses PlatformUINotificationPort (Domain-Port)
 * - Works with Foundry, Roll20, Headless
 *
 * **Responsibilities:**
 * - Filter out debug messages (not relevant for end-users)
 * - Sanitize messages in production mode
 * - Map notification levels to UI notification types
 */
export class UIChannel implements PlatformUINotificationChannelPort {
  readonly name = "UIChannel";

  constructor(
    private readonly platformUI: PlatformUINotificationPort, // Domain-Port!
    private readonly config: RuntimeConfigService
  ) {}

  canHandle(notification: PlatformNotification): boolean {
    // Debug messages are too technical for UI
    return notification.level !== "debug";
  }

  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiTypeResult = this.mapLevelToUIType(notification.level);
    if (!uiTypeResult.ok) {
      return err({
        code: "MAPPING_FAILED",
        message: uiTypeResult.error,
        channelName: this.name,
      });
    }

    const result = this.platformUI.notify(sanitizedMessage, uiTypeResult.value);
    if (!result.ok) {
      return err({
        code: "UI_NOTIFICATION_FAILED",
        message: result.error.message,
        channelName: this.name,
        details: result.error,
      });
    }

    return ok(undefined);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError> {
    return this.platformUI.notify(message, type);
  }

  private sanitizeForUI(notification: PlatformNotification): string {
    // Platform-agnostische Sanitization-Logik
    // ...
  }

  private mapLevelToUIType(
    level: PlatformNotification["level"]
  ): Result<"info" | "warning" | "error", string> {
    // Platform-agnostische Mapping-Logik
    // ...
  }
}
```

#### `ConsoleChannel` (Platform-Agnostisch)

```typescript
// src/infrastructure/notifications/channels/ConsoleChannel.ts

import type { PlatformConsoleChannelPort, PlatformNotification, PlatformChannelError } from "@/domain/ports/notifications/platform-console-channel-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";

/**
 * Console Channel - Routes notifications to console.
 *
 * **Platform-Agnostic:**
 * - Uses PlatformLoggingPort (Domain-Port)
 * - Works with Foundry, Roll20, Headless
 */
export class ConsoleChannel implements PlatformConsoleChannelPort {
  readonly name = "ConsoleChannel";

  constructor(private readonly logger: PlatformLoggingPort) {} // Domain-Port!

  canHandle(): boolean {
    // Console accepts all notification levels
    return true;
  }

  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    const { level, context, data, error } = notification;
    this.log(level, context, data ?? error);
    return ok(undefined);
  }

  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void {
    // Platform-agnostische Logging-Logik
    switch (level) {
      case "debug":
        this.logger.debug(message, data);
        break;
      case "info":
        this.logger.info(message, data);
        break;
      case "warn":
        this.logger.warn(message, data);
        break;
      case "error":
        this.logger.error(message, data);
        break;
    }
  }
}
```

### 4. QueuedUIChannel (Decorator)

```typescript
// src/infrastructure/notifications/channels/QueuedUIChannel.ts

import type { PlatformUINotificationChannelPort, PlatformNotification, PlatformChannelError } from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { PlatformUIAvailabilityPort } from "@/domain/ports/platform-ui-availability-port.interface";
import type { NotificationQueue } from "@/infrastructure/notifications/NotificationQueue";
import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";

/**
 * QueuedUIChannel - Decorator that queues UI notifications until UI is available.
 *
 * **Architecture:**
 * - Decorator Pattern: Wraps PlatformUINotificationChannelPort
 * - Uses PlatformUIAvailabilityPort (Domain-Port)
 * - Uses NotificationQueue for deferred notifications
 */
export class QueuedUIChannel implements PlatformUINotificationChannelPort {
  readonly name = "UIChannel"; // Same name as wrapped channel

  private realChannel: PlatformUINotificationChannelPort | null = null;

  constructor(
    private readonly queue: NotificationQueue,
    private readonly availabilityPort: PlatformUIAvailabilityPort, // Domain-Port!
    private readonly realChannelFactory: () => PlatformUINotificationChannelPort
  ) {}

  canHandle(notification: PlatformNotification): boolean {
    // Delegate to real channel if available, otherwise use queue logic
    if (this.realChannel) {
      return this.realChannel.canHandle(notification);
    }
    // Queue accepts all non-debug notifications (same as UIChannel)
    return notification.level !== "debug";
  }

  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    if (this.availabilityPort.isAvailable()) {
      // UI is available - create real channel and flush queue
      if (!this.realChannel) {
        this.realChannel = this.realChannelFactory();
        this.flushQueue();
      }
      return this.realChannel.send(notification);
    }

    // UI not available - queue notification
    this.queue.enqueue(notification);
    return ok(undefined);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError> {
    if (this.realChannel) {
      return this.realChannel.notify(message, type);
    }
    // Queue as notification object
    const notification: PlatformNotification = {
      level: type === "warning" ? "warn" : type,
      context: message,
      timestamp: new Date(),
    };
    return this.send(notification);
  }

  private flushQueue(): void {
    const queued = this.queue.dequeueAll();
    for (const notification of queued) {
      if (this.realChannel?.canHandle(notification)) {
        this.realChannel.send(notification); // Ignore errors during flush
      }
    }
  }
}
```

---

## 🔄 Migration-Plan

### Phase 1: Domain-Ports erstellen

1. **`PlatformChannelPort` Interface erstellen**
   - `src/domain/ports/notifications/platform-channel-port.interface.ts`
   - Basis-Interface mit `name`, `canHandle()`, `send()`

2. **`PlatformUINotificationChannelPort` Interface erstellen**
   - `src/domain/ports/notifications/platform-ui-notification-channel-port.interface.ts`
   - Erweitert `PlatformChannelPort` mit `notify()`

3. **`PlatformConsoleChannelPort` Interface erstellen**
   - `src/domain/ports/notifications/platform-console-channel-port.interface.ts`
   - Erweitert `PlatformChannelPort` mit `log()`

4. **Tokens erstellen**
   - `platformChannelPortToken` (für NotificationCenter)
   - `platformUINotificationChannelPortToken`
   - `platformConsoleChannelPortToken`

### Phase 2: NotificationCenter refactoren

1. **NotificationCenter nach Application-Layer verschieben**
   - `src/infrastructure/notifications/NotificationCenter.ts` → `src/application/services/NotificationCenter.ts`
   - `NotificationChannel` durch `PlatformChannelPort` ersetzen
   - `Notification` durch `PlatformNotification` ersetzen

2. **NotificationCenterOptions anpassen**
   - Platform-agnostische Optionen
   - Foundry-spezifische Optionen über Type Guards

### Phase 3: Channels refactoren

1. **UIChannel refactoren**
   - Implementiert `PlatformUINotificationChannelPort`
   - Nutzt `PlatformUINotificationPort` statt `FoundryUI`
   - Platform-agnostische Logik

2. **ConsoleChannel refactoren**
   - Implementiert `PlatformConsoleChannelPort`
   - Nutzt `PlatformLoggingPort` statt `Logger`
   - Platform-agnostische Logik

3. **QueuedUIChannel refactoren**
   - Implementiert `PlatformUINotificationChannelPort`
   - Nutzt `PlatformUIAvailabilityPort` (Domain-Port)
   - Wrappt `PlatformUINotificationChannelPort` statt `NotificationChannel`

### Phase 4: DI-Registrierung anpassen

1. **NotificationCenter registrieren**
   - `platformChannelPortToken[]` injizieren
   - Application-Layer Token

2. **Channels registrieren**
   - `UIChannel` → `platformUINotificationChannelPortToken`
   - `ConsoleChannel` → `platformConsoleChannelPortToken`
   - `QueuedUIChannel` → `platformUINotificationChannelPortToken` (ersetzt UIChannel)

3. **Port-Adapter registrieren**
   - `FoundryUIAdapter` → `platformUINotificationPortToken`
   - `ConsoleLoggerService` → `platformLoggingPortToken`

### Phase 5: Tests & Validierung

1. **Unit-Tests anpassen**
   - NotificationCenter Tests (Domain-Ports mocken)
   - Channel Tests (Domain-Ports mocken)

2. **Integration-Tests**
   - End-to-End: Service → NotificationCenter → Channel → Port

3. **E2E-Tests**
   - Foundry-Integration validieren

### Phase 6: Dokumentation

1. **ADR erstellen**
   - Entscheidung für Port-Hierarchie dokumentieren
   - Vergleich mit Event-System

2. **ARCHITECTURE.md aktualisieren**
   - Notification-System Abschnitt
   - Port-Hierarchie Diagramm

3. **CHANGELOG aktualisieren**
   - Breaking Changes dokumentieren

---

## 📊 Vergleich: Vorher vs. Nachher

### Vorher

```
Application → NotificationCenter (Infrastructure)
                ↓ nutzt
            NotificationChannel[] (Infrastructure-Interface)
                ↓ implementiert von
            UIChannel (Foundry-spezifisch, nutzt FoundryUI)
```

### Nachher

```
Application → NotificationCenter (Application-Layer)
                ↓ nutzt
            PlatformChannelPort[] (Domain-Ports!)
                ↓ implementiert von
            UIChannel (Platform-agnostisch, nutzt PlatformUINotificationPort)
```

---

## ✅ Vorteile

1. **OCP-Konformität**: Neue Channel-Typen ohne Änderung bestehender Ports
2. **Platform-Agnostizität**: NotificationCenter nutzt nur Domain-Ports
3. **Konsistenz**: Gleiches Pattern wie Event-System
4. **Saubere Dependency Chain**: Application → Domain → Infrastructure
5. **Testbarkeit**: Domain-Ports einfach mockbar

---

## ⚠️ Breaking Changes

1. **NotificationCenter** → Application-Layer verschoben
2. **NotificationChannel** → `PlatformChannelPort` (Domain)
3. **UIChannel** → Nutzt `PlatformUINotificationPort` statt `FoundryUI`
4. **ConsoleChannel** → Nutzt `PlatformLoggingPort` statt `Logger`

---

## 🔗 Verwandte Dokumentation

- [Event-System Hierarchie](../architecture/event-system-hierarchy.md) - Referenz-Architektur
- [Notification Queue UI Channel](./04-notification-queue-ui-channel.md) - QueuedUIChannel Details
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Gesamtarchitektur

---

## 📝 Notizen

- **QueuedUIChannel** wird in diesem Refactoring berücksichtigt
- **PlatformUIAvailabilityPort** wird in Phase 3 benötigt (siehe 04-notification-queue-ui-channel.md)
- **Migration kann schrittweise erfolgen** (Backward-Compatibility über Adapter möglich)

