---
id: ISP-001
principle: ISP
severity: medium
layer: Domain (ports)
status: Proposed
---

1. Problem

PlatformNotificationPort kombiniert Message-Senden mit Channel-Management.
Clients, die nur debug/info/warn/error senden muessen, werden gezwungen,
auch add/remove/getChannelNames zu kennen. Das erschwert Mocking und
vermischt Verantwortlichkeiten.

2. Evidence (Belege)

- Pfad: src/domain/ports/platform-notification-port.interface.ts:36-107
- Konkrete Belege:

```ts
export interface PlatformNotificationPort {
  debug(...): Result<void, PlatformNotificationError>;
  info(...): Result<void, PlatformNotificationError>;
  warn(...): Result<void, PlatformNotificationError>;
  error(...): Result<void, PlatformNotificationError>;
  addChannel(channelName: string): Result<void, PlatformNotificationError>;
  removeChannel(channelName: string): Result<boolean, PlatformNotificationError>;
  getChannelNames(): Result<string[], PlatformNotificationError>;
}
```

3. SOLID-Analyse

ISP-Verstoss: Ein Interface fuer zwei Rollen (Publisher vs. ChannelRegistry).
Clients haengen an Methoden, die sie nie nutzen. Das verursacht groessere
Mocks und engere Kopplung.

4. Zielbild

- Getrennte Ports:
  - NotificationPublisherPort (send)
  - NotificationChannelRegistryPort (add/remove/list)
- NotificationAdapter implementiert beide, aber Clients waehlen minimalen Port.

5. Loesungsvorschlag

Approach A (empfohlen)
- Neue Interfaces definieren und PlatformNotificationPort als Composition
  oder Facade belassen.

Approach B (Alternative)
- Behalte PlatformNotificationPort, aber migriere alle Abhaengigkeiten auf
  die neuen schlanken Interfaces und depreziere die alten Methoden.

Trade-offs
- Zusätzliche Typen, dafuer klare Abhaengigkeiten in Use-Cases.

6. Refactoring-Schritte

1) NotificationPublisherPort und NotificationChannelRegistryPort in domain/ports einfuehren.
2) NotificationPortAdapter implementiert beide.
3) Tokens und DI-Bindings erweitern.
4) Application-Services auf Publisher-Port umstellen.

7. Beispiel-Code

After
```ts
interface NotificationPublisherPort {
  debug(...): Result<void, PlatformNotificationError>;
  info(...): Result<void, PlatformNotificationError>;
  warn(...): Result<void, PlatformNotificationError>;
  error(...): Result<void, PlatformNotificationError>;
}
```

8. Tests & Quality Gates

- Contract-Tests fuer Adapter-Implementation beider Ports.
- Application-Tests nur noch mit Publisher-Port.

9. Akzeptanzkriterien

- Kein Application-Service haengt mehr an PlatformNotificationPort.
- Channel-Management ist nur dort sichtbar, wo benoetigt.
