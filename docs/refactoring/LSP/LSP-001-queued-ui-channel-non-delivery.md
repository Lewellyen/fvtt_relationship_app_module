---
ID: LSP-001
Prinzip: LSP
Schweregrad: Mittel
Module/Layer: infrastructure/notifications
Status: Proposed
---

# 1. Problem

`QueuedUIChannel` implementiert `PlatformUINotificationChannelPort`, liefert aber bei nicht verfügbarer UI ein `ok` zurück, obwohl die Nachricht nicht zugestellt wurde (sie wird lediglich gequeued). Außerdem kann `notify()` Fehler zurückgeben, wenn UI nicht verfügbar ist. Diese Semantik ist nicht kompatibel mit der Erwartung „sendet die Benachrichtigung an den Kanal“ und kann Substituierbarkeit brechen.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/infrastructure/notifications/channels/QueuedUIChannel.ts`
- `src/domain/ports/notifications/platform-channel-port.interface.ts`

**Minimierte Codeauszüge**
```ts
// src/infrastructure/notifications/channels/QueuedUIChannel.ts
if (!this.uiAvailability.isAvailable()) {
  this.queue.enqueue(notification);
  return ok(undefined); // kein tatsächlicher Versand
}
```
```ts
// src/infrastructure/notifications/channels/QueuedUIChannel.ts
if (!this.uiAvailability.isAvailable()) {
  return err({ code: "UI_NOT_AVAILABLE", ... });
}
```
```ts
// src/domain/ports/notifications/platform-channel-port.interface.ts
send(notification: PlatformNotification): Result<void, PlatformChannelError>;
```

# 3. SOLID-Analyse

**LSP-Verstoß:** Ein Consumer, der sich auf `PlatformChannelPort.send()` verlässt, erwartet effektive Zustellung oder zumindest eine klar definierte Zustellgarantie. `QueuedUIChannel` liefert aber „Erfolg“ ohne Zustellung. Das ist ein Verhalten, das nicht kompatibel zur Basiserwartung ist.

# 4. Zielbild

- Explizite Semantik: Entweder `send()` ist **synchron zustellend** oder `enqueue()`/`defer()` ist ein separates Verhalten.
- Substituierbarkeit: Jede Implementierung erfüllt die gleiche Zustell-Guarantee.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Interface erweitern: `deliver()` (sofort) + `enqueue()` (optional, kann deferred sein).
- `QueuedUIChannel` implementiert beide und signalisiert klaren Zustand.

**Approach B (Alternative)**
- `QueuedUIChannel` implementiert separates Interface `DeferredChannelPort`.
- `NotificationCenter` erkennt deferred Channels explizit.

**Trade-offs:**
- A: API-Erweiterung, aber klarere Semantik.
- B: Weniger API-Änderung für bestehende Channels, aber mehr Logik im Center.

# 6. Refactoring-Schritte

1. Neues Interface `DeferredChannelPort` oder zusätzliche Methode definieren.
2. `NotificationCenter` auf neue Semantik anpassen (z. B. getrennte Dispatch-Pfade).
3. `QueuedUIChannel` implementiert das neue Interface.
4. Tests aktualisieren (Send vs. Enqueue).

**Breaking Changes:**
- API der Notification Channels ändert sich.

# 7. Beispiel-Code

**Before**
```ts
send(notification): Result<void, PlatformChannelError>
```

**After**
```ts
send(notification): Result<void, PlatformChannelError> // garantiert Zustellung
enqueue(notification): Result<void, PlatformChannelError> // deferred
```

# 8. Tests & Quality Gates

- Contract-Tests für Channels: `send` liefert nur ok, wenn zugestellt.
- Tests für Queue-Flush-Semantik.

# 9. Akzeptanzkriterien

- `QueuedUIChannel.send()` signalisiert Zustellstatus korrekt.
- `NotificationCenter` behandelt deferred Channels explizit.
