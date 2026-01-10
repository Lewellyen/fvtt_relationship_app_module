---
ID: ISP-001
Prinzip: ISP
Schweregrad: Mittel
Module/Layer: application/services, framework/core/api, infrastructure/adapters/notifications
Status: Proposed
---

# 1. Problem

`NotificationService` bündelt das Senden von Notifications **und** die Verwaltung von Channels. Viele Konsumenten brauchen nur das Senden, werden aber an Channel-Management gekoppelt (statische Typabhängigkeit, unnötige Mock-API in Tests).

# 2. Evidence (Belege)

**Pfade / Klassen**
- `src/application/services/notification-center.interface.ts`
- `src/application/tokens/notifications/notification-center.token.ts`
- `src/framework/core/api/module-api.ts`

**Konkrete Belege**
```ts
export interface NotificationService extends NotificationSender, ChannelManager {}
```
```ts
createInjectionToken<NotificationService>("NotificationCenter");
```

# 3. SOLID-Analyse

ISP-Verstoß: Konsumenten werden gezwungen, Abhängigkeiten auf Channel-Management einzuführen, obwohl sie nur `NotificationSender` benötigen. Das erschwert Test-Stubs und erhöht Kopplung in Framework/Infrastructure.

# 4. Zielbild

- Getrennte Ports:
  - `NotificationSender` (send-only)
  - `NotificationChannelRegistry` (add/remove/list)
- DI-Tokens für beide Rollen.
- `NotificationCenter` implementiert beide, aber wird je nach Bedarf injiziert.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Neue Tokens `notificationSenderToken` und `notificationChannelRegistryToken`.
- Framework/API nutzt nur `NotificationSender`.
- Channel-Management bleibt nur in Bootstrap/Infrastructure.

**Approach B (Alternative)**
- Bestehendes Interface beibehalten, aber in Abhängigkeiten den Typ auf `NotificationSender` ändern.

**Trade-offs**
- A erfordert Refactor in DI/Tokens, verbessert langfristige Entkopplung.
- B ist schneller, aber lässt Token-Kontrakt weiterhin zu breit.

# 6. Refactoring-Schritte

1. Neues Interface `NotificationChannelRegistry` (alias von `ChannelManager`) einführen.
2. Neue Tokens für Sender/Registry anlegen.
3. `NotificationCenter` implementiert beide Interfaces.
4. Abhängigkeiten in Framework/Infrastructure auf `NotificationSender` umstellen.
5. Tests/Mocks vereinfachen.

# 7. Beispiel-Code

**Before**
```ts
constructor(private readonly notifications: NotificationService) {}
```

**After**
```ts
constructor(private readonly notifications: NotificationSender) {}
```

# 8. Tests & Quality Gates

- Unit: Consumers testen mit minimalem `NotificationSender` Mock.
- Arch-Lint: Channel-Management darf nur in Infrastructure/Bootstrap vorkommen.

# 9. Akzeptanzkriterien

- Service-Konsumenten in Application/Framework importieren `NotificationSender` statt `NotificationService`.
- Nur Channel-Management-Komponenten hängen von `NotificationChannelRegistry` ab.
