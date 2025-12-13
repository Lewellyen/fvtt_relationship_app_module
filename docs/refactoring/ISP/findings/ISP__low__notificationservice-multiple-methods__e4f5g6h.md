---
principle: ISP
severity: low
confidence: high
component_kind: interface
component_name: NotificationService
file: "src/application/services/notification-center.interface.ts"
location:
  start_line: 29
  end_line: 41
tags: ["interface", "segregation", "notification"]
---
# Problem

Das `NotificationService` Interface definiert 7 Methoden (4 Log-Level-Methoden + 3 Channel-Management-Methoden). Klassen, die dieses Interface implementieren, müssen alle Methoden implementieren, auch wenn sie möglicherweise nicht alle benötigen.

## Evidence

```29:41:src/application/services/notification-center.interface.ts
export interface NotificationService {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(
    context: string,
    error?: PlatformNotification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string>;
  addChannel(channel: PlatformChannelPort): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}
```

Das Interface kombiniert:
1. **Notification-Methoden** (debug, info, warn, error) - für Clients, die Notifications senden
2. **Channel-Management-Methoden** (addChannel, removeChannel, getChannelNames) - für Clients, die Channels verwalten

## Impact

**Niedrig**: In der Praxis implementiert nur `NotificationCenter` dieses Interface, und diese Klasse benötigt tatsächlich alle Methoden. Es gibt keine Klassen, die gezwungen sind, nicht benötigte Methoden zu implementieren.

- Die aktuelle Implementierung ist korrekt
- Es gibt keine echten ISP-Verletzungen (keine Klassen müssen ungenutzte Methoden implementieren)
- Die Methoden sind alle notwendig für die zentrale Notification-Hub-Funktionalität

## Recommendation

**Keine Änderung erforderlich**: Das Interface ist für die aktuelle Verwendung angemessen. Falls in Zukunft spezialisierte Implementierungen benötigt werden (z.B. Read-Only-NotificationService ohne Channel-Management), sollte das Interface aufgeteilt werden:

```typescript
// Nur Notification-Senden
export interface NotificationSender {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(context: string, error?: PlatformNotification["error"], options?: NotificationCenterOptions): Result<void, string>;
}

// Nur Channel-Management
export interface ChannelManager {
  addChannel(channel: PlatformChannelPort): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}

// Kombiniert
export interface NotificationService extends NotificationSender, ChannelManager {}
```

## Example Fix

Falls eine Segregation gewünscht wird:

```typescript
// Basis-Interface für Notification-Senden
export interface NotificationSender {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(context: string, error?: PlatformNotification["error"], options?: NotificationCenterOptions): Result<void, string>;
}

// Interface für Channel-Management
export interface ChannelManager {
  addChannel(channel: PlatformChannelPort): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}

// Vollständiges Interface
export interface NotificationService extends NotificationSender, ChannelManager {}
```

## Notes

Dies ist ein "Low"-Severity-Finding, da es aktuell keine echten ISP-Verletzungen gibt. Das Interface ist für die aktuelle Verwendung angemessen, aber könnte in Zukunft aufgeteilt werden, falls spezialisierte Implementierungen benötigt werden.

