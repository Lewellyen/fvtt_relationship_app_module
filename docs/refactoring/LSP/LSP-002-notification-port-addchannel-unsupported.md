---
id: LSP-002
prinzip: LSP
schweregrad: mittel
layer: infrastructure
status: Proposed
reviewed: 2026-01-19
relevance: still-relevant
notes: `src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts` still implements addChannel() as OPERATION_NOT_SUPPORTED.
---

# 1. Problem
`NotificationPortAdapter` implementiert `NotificationChannelRegistryPort`, verweigert aber `addChannel()` mit "operation not supported". Damit kann der Adapter nicht als vollwertiger Ersatz fuer den Port genutzt werden.

# 2. Evidence (Belege)
`src/domain/ports/notifications/notification-channel-registry-port.interface.ts`:
```
addChannel(channelName: string): Result<void, PlatformNotificationError>;
```

`src/infrastructure/adapters/notifications/platform-notification-port-adapter.ts`:
```
addChannel(_channelName: string): Result<void, PlatformNotificationError> {
  return err({
    code: "OPERATION_NOT_SUPPORTED",
    message:
      "Dynamic channel addition via name not supported. Use NotificationCenter.addChannel() directly.",
    operation: "addChannel",
  });
}
```

# 3. SOLID-Analyse
Verstoss gegen LSP: Ein Objekt, das `NotificationChannelRegistryPort` implementiert, muss den Vertrag erfuellen. Wenn ein Call immer fehlschlaegt, koennen Clients die Implementierung nicht substituieren, ohne Zusatzlogik.

# 4. Zielbild
Alle Implementierungen des Ports unterstuetzen `addChannel()` semantisch. Falls nicht moeglich, darf die Implementierung den Port nicht implementieren, sondern nur den Publisher-Port.

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- `NotificationPortAdapter` implementiert nur `NotificationPublisherPort`.
- Channel-Registry als eigener Adapter, der echte `addChannel()` Semantik bietet.

**Approach B (Alternative):**
- `NotificationCenter` bekommt eine Implementierung fuer `addChannel(channelName)`, die einen Registry-Lookup macht und Channel instanziiert.
- Adapter delegiert korrekt.

Trade-offs: Approach A reduziert Coupling, Approach B behaelt API-Kompatibilitaet.

# 6. Refactoring-Schritte
1. Port-Implementierung von `NotificationPortAdapter` auf Publisher-Port reduzieren.
2. Neue Registry-Implementierung einfuehren oder `NotificationCenter` erweitern.
3. Aufrufer anpassen (entweder Registry-Port injizieren oder keine `addChannel()` Calls).

# 7. Beispiel-Code
**After (Adapter ohne Registry-Port):**
```
export class NotificationPortAdapter implements NotificationPublisherPort { ... }
```

# 8. Tests & Quality Gates
- Contract-Tests: `addChannel` funktioniert oder Interface wird nicht implementiert.
- Integrationstest: Channel-Registrierung ueber Registry-Port.

# 9. Akzeptanzkriterien
- Kein Port-Implementierer gibt fuer `addChannel()` permanent "not supported" zurueck.
- Alle Implementierungen erfuellen den Portvertrag.
