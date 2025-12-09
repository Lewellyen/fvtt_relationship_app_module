# Refactoring 04: Notification Queue für UI-Channel

**Status:** 📋 Geplant
**Priorität:** Mittel
**Breaking Changes:** ❌ Keine
**Datum:** 2025-01-XX

**⚠️ WICHTIG:** Dieses Refactoring sollte **nach** [Refactoring 05: Notification Channel Port Hierarchy](./05-notification-channel-port-hierarchy.md) umgesetzt werden, da `QueuedUIChannel` dann `PlatformUINotificationChannelPort` (Domain-Port) implementiert statt `NotificationChannel` (Infrastructure-Interface).

---

## Ziel

Implementierung eines Queue-Systems für UI-Notifications, die vor der Verfügbarkeit von Foundry UI gesendet werden. Die Queue sammelt Notifications und gibt sie automatisch aus, sobald der UIChannel verfügbar ist.

**Design-Prinzipien:**
- SOLID-konform (SRP, DIP, OCP, LSP, ISP)
- Konfigurierbar über Module-Settings (keine Magic Numbers)
- Keine Breaking Changes für bestehende Services

---

## Architektur-Übersicht

```
Service → NotificationCenter → QueuedUIChannel → [Queue] → UIChannel → ui.notifications
                                    ↓
                            UIAvailabilityPort
                                    ↓
                            NotificationQueue (RuntimeConfig)
```

**Komponenten:**
1. `NotificationQueue` - Queue-Management (SRP)
2. `PlatformUIAvailabilityPort` - Domain-Port für UI-Verfügbarkeits-Check (DIP)
3. `FoundryUIAvailabilityPort` - Foundry-spezifische Implementierung (Infrastructure)
4. `QueuedUIChannel` - Decorator, der Queue + Availability orchestriert (Infrastructure)
5. Setting-Definition für `notificationQueueMaxSize`

**Layer-Zuordnung (Diskussion):**

### NotificationCenter & NotificationChannel

**Aktuell:**
- `NotificationCenter` → **Infrastructure-Layer** (`src/infrastructure/notifications/`)
- `NotificationChannel` → **Infrastructure-Layer** (`src/infrastructure/notifications/notification-channel.interface.ts`)

**Argumente für Infrastructure:**
- Technischer Message Bus / Router (wie Event-Bus, HTTP-Router)
- Keine Domain-Business-Logic, nur technisches Routing
- Channels sind technische Implementierungen (console.log, ui.notifications)

**Argumente für Application:**
- Routing-Entscheidungen ("Welche Channels?") = Business-Logic
- Ähnlich wie andere Application-Services, die Entscheidungen treffen

### NotificationChannel Interface

**Aktuell:** Infrastructure-Layer

**Ist es Domain?** ❌ Nein, weil:
- **NICHT platform-agnostisch** - ist spezifisch für das Notification-System
- **Interne Abstraktion** - wird nur innerhalb der Infrastructure verwendet
- **Keine Domain-Abstraktion** - im Gegensatz zu `PlatformNotificationPort` (Domain)

**Vergleich:**
- `PlatformNotificationPort` (Domain) - "Ich will eine Notification senden" (platform-agnostisch)
- `NotificationChannel` (Infrastructure) - "Ich bin ein Output-Handler für das Notification-System" (interne Abstraktion)

**Fazit:** `NotificationChannel` ist **Infrastructure-Interface**, keine Domain-Abstraktion. Es ist eine interne Abstraktion innerhalb des Notification-Systems, ähnlich wie `NotificationCenter` selbst.

**QueuedUIChannel** folgt dieser Entscheidung (Infrastructure, wie andere Channels)

---

## ⚠️ WICHTIG: UIChannel könnte platform-agnostisch sein!

**Aktueller Zustand:**
- `UIChannel` nutzt direkt `FoundryUI` (Foundry-spezifisch)
- `UIChannel` ist Foundry-spezifisch, obwohl die Logik platform-agnostisch sein könnte

**Bessere Architektur (Refactoring-Option):**
```typescript
// UIChannel könnte PlatformUINotificationPort nutzen (Domain-Port)
export class UIChannel implements NotificationChannel {
  constructor(
    private readonly platformUI: PlatformUINotificationPort, // Domain-Port!
    private readonly config: RuntimeConfigService
  ) {}

  send(notification: Notification): Result<void, string> {
    // Platform-agnostische Logik (Filter, Sanitization, Mapping)
    const result = this.platformUI.notify(message, type); // Domain-Port
    // ...
  }
}
```

**Dann wäre:**
- `UIChannel` → platform-agnostisch (nutzt Domain-Port)
- `FoundryUIAdapter` → Foundry-Implementierung des Domain-Ports
- `Roll20UIAdapter` → Roll20-Implementierung des Domain-Ports

**Aber:** Das ist ein **separates Refactoring**. Für `QueuedUIChannel` bleibt die aktuelle Architektur bestehen (UIChannel nutzt FoundryUI direkt).

---

## Umsetzungsplan

### Phase 1: Foundation - RuntimeConfig & Settings

#### Schritt 1.1: Setting-Key hinzufügen
- [ ] `SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE` in `app-constants.ts` hinzufügen
- [ ] Key zu `SETTING_KEYS` Object hinzufügen

**Datei:** `src/application/constants/app-constants.ts`

#### Schritt 1.2: RuntimeConfig erweitern
- [ ] `notificationQueueMaxSize: number` zu `RuntimeConfigValues` hinzufügen
- [ ] Type-Check: `RuntimeConfigKey` wird automatisch aktualisiert

**Datei:** `src/domain/types/runtime-config.ts`

#### Schritt 1.2a: EnvironmentConfig erweitern
- [ ] `EnvironmentConfig` Interface erweitern:
  ```typescript
  notificationQueueMinSize: number;
  notificationQueueMaxSize: number;
  notificationQueueDefaultSize: number;
  ```
- [ ] `environment.ts` erweitern:
  ```typescript
  notificationQueueMinSize: getEnvVar("VITE_NOTIFICATION_QUEUE_MIN_SIZE", (val) =>
    parsePositiveInteger(val, 10) // Default: 10, wird in Code kompiliert
  ),
  notificationQueueMaxSize: getEnvVar("VITE_NOTIFICATION_QUEUE_MAX_SIZE", (val) =>
    parsePositiveInteger(val, 1000) // Default: 1000, wird in Code kompiliert
  ),
  notificationQueueDefaultSize: getEnvVar("VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE", (val) =>
    parsePositiveInteger(val, 50) // Default: 50, wird in Code kompiliert
  ),
  ```
- [ ] Helper-Funktion `parsePositiveInteger` hinzufügen (falls nicht vorhanden)

**Dateien:**
- `src/domain/types/environment-config.ts`
- `src/framework/config/environment.ts`

**Wichtig:** Diese Werte werden zur **Build-Zeit** in den kompilierten Code eingebacken. Nach dem Build sind sie **fest verdrahtet** und können zur Laufzeit nicht mehr geändert werden.

**Beispiel:**
```bash
# Production-Build mit festen Grenzwerten
VITE_NOTIFICATION_QUEUE_MIN_SIZE=10 \
VITE_NOTIFICATION_QUEUE_MAX_SIZE=1000 \
VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE=50 \
npm run build

# → Im kompilierten dist/fvtt_relationship_app_module.js stehen dann:
# ENV.notificationQueueMinSize = 10  (fest)
# ENV.notificationQueueMaxSize = 1000 (fest)
# ENV.notificationQueueDefaultSize = 50 (fest, aber überschreibbar via Setting)
```

#### Schritt 1.3: Setting-Definition erstellen
- [ ] Neue Datei: `src/application/settings/notification-queue-max-size-setting.ts`
- [ ] **Konstanten aus ENV lesen** (keine Magic Numbers, Build-Time konfigurierbar):
  ```typescript
  import type { EnvironmentConfig } from "@/domain/types/environment-config";

  /**
   * Gets notification queue size constants from environment config.
   * These values are configured at build-time via VITE_* environment variables.
   *
   * MIN/MAX are fixed after build (security boundaries).
   * DEFAULT can be overridden at runtime via Foundry settings.
   */
  export function getNotificationQueueConstants(env: EnvironmentConfig) {
    return {
      minSize: env.notificationQueueMinSize,
      maxSize: env.notificationQueueMaxSize,
      defaultSize: env.notificationQueueDefaultSize,
    };
  }
  ```
- [ ] Setting-Definition mit:
  - Default: `env.notificationQueueDefaultSize` (aus ENV)
  - Min: `env.notificationQueueMinSize`, Max: `env.notificationQueueMaxSize`
  - Validation & Sanitization (nutzt ENV-Werte):
    ```typescript
    const constants = getNotificationQueueConstants(env);
    const clamped = Math.max(
      constants.minSize,
      Math.min(constants.maxSize, Math.floor(numericValue))
    );
    ```
  - i18n-Strings (erwähnen Min/Max in Hint, dynamisch aus ENV)
  - onChange-Logging

**Datei:** `src/application/settings/notification-queue-max-size-setting.ts`

**Wichtige Entscheidung - Konfigurierbarkeit:**

ENV-Werte werden zur **Build-Zeit** in den Code kompiliert und sind dann **fest verdrahtet**:

- ✅ **`notificationQueueDefaultSize`**:
  - Build-Time: Konfigurierbar via `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE` → **wird in Code kompiliert**
  - Runtime: Überschreibbar über Setting `notificationQueueMaxSize`
- ✅ **`notificationQueueMinSize`**:
  - Build-Time: Konfigurierbar via `VITE_NOTIFICATION_QUEUE_MIN_SIZE` → **wird in Code kompiliert, dann FEST**
  - Runtime: **FEST** (aus Build-Zeit ENV, nicht überschreibbar)
- ✅ **`notificationQueueMaxSize`**:
  - Build-Time: Konfigurierbar via `VITE_NOTIFICATION_QUEUE_MAX_SIZE` → **wird in Code kompiliert, dann FEST**
  - Runtime: **FEST** (aus Build-Zeit ENV, nicht überschreibbar)

**Vorteile:**
- **Production-Builds** können mit festen Grenzwerten aus ENV gebaut werden
- Zur Laufzeit sind MIN/MAX **garantiert fest** (Sicherheit)
- Entwickler können für Development-Builds andere Werte setzen
- Default bleibt flexibel zur Laufzeit (via Setting)
- Keine Magic Numbers, alles konfigurierbar zur Build-Zeit

**Beispiel:**
```bash
# Production-Build mit festen Grenzwerten
VITE_NOTIFICATION_QUEUE_MIN_SIZE=10 \
VITE_NOTIFICATION_QUEUE_MAX_SIZE=1000 \
VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE=50 \
npm run build

# → Kompiliertes Modul hat MIN=10, MAX=1000 fest verdrahtet
# → Zur Laufzeit können diese Werte NICHT mehr geändert werden
# → Nur DEFAULT (50) kann via Setting überschrieben werden
```

#### Schritt 1.4: RuntimeConfigBinding hinzufügen
- [ ] Binding in `runtimeConfigBindings` hinzufügen
- [ ] **ENV-Konstanten nutzen** (via Factory-Funktion):
  ```typescript
  // RuntimeConfigSync erhält ENV via Constructor
  // normalize-Funktion nutzt ENV-Werte:
  normalize: (value: number) => {
    const constants = getNotificationQueueConstants(this.env);
    return Math.max(
      constants.minSize,
      Math.min(constants.maxSize, Math.floor(value))
    );
  }
  ```
- [ ] Validator: `SettingValidators.positiveInteger`
- [ ] **Problem:** `RuntimeConfigSync` hat keinen Zugriff auf ENV
- [ ] **Lösung:** ENV-Werte via Dependency Injection oder Factory-Funktion übergeben

**Datei:** `src/application/services/RuntimeConfigSync.ts`

**Hinweis:** `RuntimeConfigSync` muss ENV-Werte erhalten. Optionen:
- Option A: ENV via Constructor injizieren
- Option B: Factory-Funktion für normalize (erhält ENV als Parameter)
- Option C: Konstanten aus Setting-Definition exportieren (die ENV erhält)

#### Schritt 1.5: Setting registrieren
- [ ] Import `notificationQueueMaxSizeSetting` in `ModuleSettingsRegistrar`
- [ ] `registerDefinition()` Aufruf hinzufügen

**Datei:** `src/application/services/ModuleSettingsRegistrar.ts`

**Tests:**
- [ ] Setting wird korrekt registriert
- [ ] Default-Wert ist ENV `notificationQueueDefaultSize` (Standard: 50)
- [ ] Validation funktioniert (Min/Max aus ENV)
- [ ] Clamp funktioniert (Werte unter Min werden auf Min gesetzt, über Max auf Max)
- [ ] ENV-Werte werden korrekt gelesen (VITE_* Variablen)
- [ ] Fallback-Werte funktionieren (wenn ENV nicht gesetzt)
- [ ] RuntimeConfig wird synchronisiert

---

### Phase 2: Core Components - Queue & Availability

#### Schritt 2.1: NotificationQueue implementieren
- [ ] Neue Datei: `src/infrastructure/notifications/NotificationQueue.ts`
- [ ] **ENV-Konstanten via Dependency** (EnvironmentConfig oder Factory):
  ```typescript
  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly env: EnvironmentConfig // ODER: getNotificationQueueConstants-Funktion
  ) {}

  private getMaxSize(): number {
    const value = this.runtimeConfig.get("notificationQueueMaxSize");
    // Fallback: ENV default
    return value ?? this.env.notificationQueueDefaultSize;
  }
  ```
- [ ] Klasse `NotificationQueue`:
  - `enqueue(notification: Notification): void`
  - `flush(handler: (n: Notification) => void): void`
  - `clear(): void`
  - `get size(): number`
  - `getMaxSize(): number` (aus RuntimeConfig, Fallback: ENV default)
- [ ] DI-Wrapper `DINotificationQueue`
- [ ] Dependencies: `PlatformRuntimeConfigPort`, `EnvironmentConfig` (oder Factory)

**Datei:** `src/infrastructure/notifications/NotificationQueue.ts`

**Hinweis:** NotificationQueue braucht ENV für Fallback. Optionen:
- Option A: `EnvironmentConfig` via DI injizieren
- Option B: Factory-Funktion für getNotificationQueueConstants
- Option C: Konstanten aus Setting-Definition (die ENV erhält)

**Tests:**
- [ ] Queue speichert Notifications
- [ ] MaxSize-Limit funktioniert (älteste werden entfernt)
- [ ] MaxSize nutzt RuntimeConfig-Wert
- [ ] MaxSize nutzt ENV-Fallback wenn RuntimeConfig nicht verfügbar
- [ ] ENV-Werte werden korrekt verwendet
- [ ] Flush gibt alle Notifications aus
- [ ] Clear leert Queue
- [ ] RuntimeConfig-Änderungen werden berücksichtigt

#### Schritt 2.2: PlatformUIAvailabilityPort Interface (Domain-Layer)
- [ ] Neue Datei: `src/domain/ports/platform-ui-availability-port.interface.ts`
- [ ] **Domain-Port Interface** (platform-agnostisch):
  ```typescript
  /**
   * Platform-agnostic port for checking UI availability.
   *
   * Different platforms may have different UI initialization timing:
   * - Foundry: UI becomes available in 'init' hook
   * - Roll20: UI might be available immediately
   * - CSV/Headless: UI never available
   */
  export interface PlatformUIAvailabilityPort {
    /**
     * Checks if the platform UI is currently available.
     *
     * @returns true if UI is available, false otherwise
     */
    isAvailable(): boolean;

    /**
     * Registers a callback to be called when UI becomes available.
     *
     * Optional: Some platforms might not support this (returns immediately).
     *
     * @param callback - Function to call when UI becomes available
     */
    onAvailable?(callback: () => void): void;
  }
  ```

**Datei:** `src/domain/ports/platform-ui-availability-port.interface.ts`

**Hinweis:** Domain-Port, da die Frage "Ist UI verfügbar?" platform-agnostisch ist, auch wenn die Implementierung platform-spezifisch ist.

#### Schritt 2.3: FoundryUIAvailabilityPort implementieren (Infrastructure-Layer)
- [ ] Neue Datei: `src/infrastructure/adapters/foundry/services/FoundryUIAvailabilityPort.ts`
- [ ] Implementiert `PlatformUIAvailabilityPort` (Domain-Interface)
- [ ] `isAvailable()`: Prüft `typeof ui !== "undefined" && ui?.notifications !== undefined`
- [ ] `onAvailable()`: Optional, für jetzt nicht implementiert (kann später Event-basiert werden)
- [ ] DI-Wrapper `DIFoundryUIAvailabilityPort`

**Datei:** `src/infrastructure/adapters/foundry/services/FoundryUIAvailabilityPort.ts`

**Hinweis:** Infrastructure-Layer Implementierung des Domain-Ports, Foundry-spezifisch.

**Tests:**
- [ ] `isAvailable()` gibt `true` zurück wenn `ui.notifications` verfügbar
- [ ] `isAvailable()` gibt `false` zurück wenn `ui` nicht verfügbar
- [ ] `isAvailable()` gibt `false` zurück wenn `ui.notifications` fehlt

#### Schritt 2.4: Tokens erstellen
- [ ] `notificationQueueToken` in `src/infrastructure/shared/tokens/notifications/notification-queue.token.ts`
- [ ] `platformUIAvailabilityPortToken` in `src/application/tokens/domain-ports.tokens.ts` (Domain-Port Token)

**Dateien:**
- `src/infrastructure/shared/tokens/notifications/notification-queue.token.ts`
- `src/application/tokens/domain-ports.tokens.ts` (Domain-Port Token, wie andere Platform*Port Tokens)

**Hinweis:** Domain-Port Token gehört zu `domain-ports.tokens.ts`, nicht zu Foundry-spezifischen Tokens.

---

### Phase 3: QueuedUIChannel - Decorator Implementation

#### Schritt 3.1: QueuedUIChannel implementieren (Infrastructure-Layer)
- [ ] Neue Datei: `src/infrastructure/notifications/channels/QueuedUIChannel.ts`
- [ ] Klasse `QueuedUIChannel`:
  - Implementiert `NotificationChannel` (Infrastructure-Interface)
  - `readonly name = "UIChannel"`
  - Dependencies: `NotificationQueue`, `PlatformUIAvailabilityPort` (Domain-Port!), `realChannelFactory`
  - `canHandle()`: Delegiert an real channel oder eigene Logik
  - `send()`:
    - Prüft Availability via `PlatformUIAvailabilityPort.isAvailable()`
    - Wenn verfügbar: Erstellt real channel, flushed queue, delegiert
    - Wenn nicht verfügbar: Queue
- [ ] DI-Wrapper `DIQueuedUIChannel`

**Datei:** `src/infrastructure/notifications/channels/QueuedUIChannel.ts`

**Hinweis:**
- **Infrastructure-Layer** (wie `UIChannel` und `ConsoleChannel`)
- Nutzt `PlatformUIAvailabilityPort` (Domain-Port), nicht Foundry-spezifische Implementierung
- Das macht QueuedUIChannel platform-agnostisch, obwohl es im Infrastructure-Layer ist
- Folgt dem gleichen Pattern wie andere Notification-Channels

**Tests:**
- [ ] Queue wird verwendet wenn UI nicht verfügbar
- [ ] Queue wird geflusht wenn UI verfügbar wird
- [ ] Notifications werden sofort gesendet wenn UI verfügbar
- [ ] Debug-Nachrichten werden nicht gequeued
- [ ] Real channel wird korrekt delegiert

#### Schritt 3.2: Integration in NotificationBootstrapper
- [ ] `NotificationBootstrapper.attachNotificationChannels()` anpassen
- [ ] Statt direktem `UIChannel` → `QueuedUIChannel` verwenden
- [ ] Dependencies auflösen: `NotificationQueue`, `UIAvailabilityPort`, `UIChannel` (für Factory)

**Datei:** `src/framework/core/bootstrap/orchestrators/notification-bootstrapper.ts`

**Tests:**
- [ ] QueuedUIChannel wird korrekt angehängt
- [ ] Queue funktioniert während Bootstrap
- [ ] Notifications werden nach init-Hook geflusht

---

### Phase 4: DI-Registrierung

#### Schritt 4.1: NotificationQueue registrieren
- [ ] `registerNotifications()` in `notifications.config.ts` erweitern
- [ ] `NotificationQueue` als Singleton registrieren

**Datei:** `src/framework/config/modules/notifications.config.ts`

#### Schritt 4.2: PlatformUIAvailabilityPort registrieren
- [ ] `FoundryUIAvailabilityPort` als Implementierung von `PlatformUIAvailabilityPort` registrieren
- [ ] Token: `platformUIAvailabilityPortToken` (Domain-Port Token)
- [ ] Implementierung: `DIFoundryUIAvailabilityPort` (Infrastructure-Layer)
- [ ] Registrierung in `foundry-services.config.ts` oder `foundry-ports.config.ts`

**Datei:** `src/framework/config/modules/foundry-services.config.ts` oder `foundry-ports.config.ts`

**Hinweis:** Domain-Port Token wird mit Infrastructure-Implementierung registriert (wie andere Platform*Ports auch).

#### Schritt 4.3: QueuedUIChannel registrieren
- [ ] `UIChannel` Token bleibt (für Factory)
- [ ] `QueuedUIChannel` wird in `NotificationBootstrapper` verwendet
- [ ] Oder: `UIChannel` Token zeigt auf `QueuedUIChannel` (wenn wir UIChannel ersetzen wollen)

**Entscheidung:** Sollen wir `UIChannel` komplett ersetzen oder parallel existieren?

---

### Phase 5: Tests & Validation

#### Schritt 5.1: Unit Tests
- [ ] `NotificationQueue.test.ts` - Alle Queue-Operationen
- [ ] `FoundryUIAvailabilityPort.test.ts` - Availability-Checks
- [ ] `QueuedUIChannel.test.ts` - Queue-Logik, Flush, Delegation

#### Schritt 5.2: Integration Tests
- [ ] Bootstrap-Test: Queue während init-Hook
- [ ] Flush-Test: Notifications werden nach init-Hook gesendet
- [ ] Settings-Test: MaxSize-Änderung wird berücksichtigt

#### Schritt 5.3: E2E Tests
- [ ] Notifications vor init-Hook werden gequeued
- [ ] Notifications nach init-Hook werden sofort gesendet
- [ ] Queue-Limit funktioniert (älteste werden entfernt)

---

### Phase 6: Dokumentation

#### Schritt 6.1: Code-Dokumentation
- [ ] JSDoc-Kommentare für alle neuen Klassen
- [ ] Architecture-Kommentare in QueuedUIChannel
- [ ] Design-Decisions dokumentieren

#### Schritt 6.2: ADR erstellen
- [ ] Neue Datei: `docs/adr/0013-notification-queue-ui-channel.md`
- [ ] Dokumentiert:
  - Problem (UI nicht verfügbar vor init-Hook)
  - Lösung (Queue-System)
  - Design-Entscheidungen (SOLID, Decorator-Pattern)
  - Alternativen (warum nicht direkt in NotificationCenter)

#### Schritt 6.3: CHANGELOG aktualisieren
- [ ] Unreleased-Sektion erweitern:
  - **Hinzugefügt**: NotificationQueue für UI-Channel
  - **Hinzugefügt**: Setting `notificationQueueMaxSize` (Runtime-konfigurierbar)
  - **Hinzugefügt**: ENV-Variablen `VITE_NOTIFICATION_QUEUE_MIN_SIZE`, `VITE_NOTIFICATION_QUEUE_MAX_SIZE`, `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE` (Build-Time konfigurierbar)
  - **Geändert**: UIChannel wird jetzt über QueuedUIChannel geroutet

**Datei:** `CHANGELOG.md`

#### Schritt 6.3a: CONFIGURATION.md aktualisieren
- [ ] ENV-Variablen dokumentieren:
  ```markdown
  | `VITE_NOTIFICATION_QUEUE_MIN_SIZE` | number | `10` | Minimum Queue-Größe (Build-Time) |
  | `VITE_NOTIFICATION_QUEUE_MAX_SIZE` | number | `1000` | Maximum Queue-Größe (Build-Time) |
  | `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE` | number | `50` | Standard Queue-Größe (Build-Time, Runtime überschreibbar) |
  ```

**Datei:** `docs/CONFIGURATION.md`

#### Schritt 6.4: ARCHITECTURE.md aktualisieren
- [ ] Notification-Subsystem-Sektion erweitern
- [ ] Queue-Flow dokumentieren
- [ ] Komponenten-Diagramm aktualisieren

**Datei:** `ARCHITECTURE.md`

---

## Abhängigkeiten zwischen Phasen

```
Phase 1 (Settings)
  ↓
Phase 2 (Queue & Availability)
  ↓
Phase 3 (QueuedUIChannel)
  ↓
Phase 4 (DI-Registrierung)
  ↓
Phase 5 (Tests)
  ↓
Phase 6 (Dokumentation)
```

**Kritischer Pfad:**
- Phase 1 → Phase 2 → Phase 3 → Phase 4 müssen sequenziell sein
- Phase 5 kann parallel zu Phase 6 laufen
- Phase 6 kann während Phase 3-4 begonnen werden

---

## Offene Fragen / Entscheidungen

1. **UIChannel Token-Strategie:**
   - Option A: `UIChannel` Token zeigt auf `QueuedUIChannel` (ersetzt komplett)
   - Option B: `UIChannel` bleibt, `QueuedUIChannel` wird separat registriert
   - **Empfehlung:** Option A (einfacher, keine Breaking Changes)

2. **UIAvailabilityPort.onAvailable():**
   - Soll Event-basiert implementiert werden (Polling vs. Event)?
   - **Empfehlung:** Für jetzt Polling (bei jedem `send()`), später erweiterbar

3. **Queue-Deduplizierung:**
   - Sollen identische Notifications innerhalb kurzer Zeit dedupliziert werden?
   - **Empfehlung:** Nein (erstmal einfach halten, später erweiterbar)

4. **Error-Handling bei Flush:**
   - Was passiert wenn Flush-Fehler auftreten?
   - **Empfehlung:** Fehler ignorieren (Queue-Flush ist "best effort")

5. **MIN/MAX Grenzen konfigurierbar?**
   - ✅ **Entscheidung getroffen:** MIN/MAX sind **Build-Time konfigurierbar** via ENV, dann **fest verdrahtet**
   - Build-Time: `VITE_NOTIFICATION_QUEUE_MIN_SIZE`, `VITE_NOTIFICATION_QUEUE_MAX_SIZE` (Standard: 10, 1000)
   - **Wichtig:** ENV-Werte werden in den kompilierten Code eingebacken → sind dann **fest**
   - Runtime: MIN/MAX sind **garantiert fest** (aus Build-Zeit ENV, nicht überschreibbar)
   - Default: Build-Time via `VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE` + Runtime via Setting überschreibbar
   - **Vorteil:** Production-Builds können mit festen Grenzwerten gebaut werden, zur Laufzeit nicht änderbar

---

## Schätzungen

- **Phase 1:** ~2 Stunden (Settings sind Standard-Pattern)
- **Phase 2:** ~3 Stunden (Queue + Availability sind neu)
- **Phase 3:** ~2 Stunden (Decorator-Pattern ist klar)
- **Phase 4:** ~1 Stunde (DI-Registrierung ist Standard)
- **Phase 5:** ~4 Stunden (Tests für alle Komponenten)
- **Phase 6:** ~2 Stunden (Dokumentation)

**Gesamt:** ~14 Stunden

---

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Queue-Size zu groß (Memory) | Niedrig | Mittel | MaxSize-Limit (NOTIFICATION_QUEUE_MAX_SIZE), Monitoring |
| UI nie verfügbar (Queue wächst) | Sehr niedrig | Niedrig | Timeout? Oder einfach limitieren |
| Race Condition (UI wird verfügbar während send()) | Mittel | Niedrig | Synchronisation in QueuedUIChannel |
| Performance bei vielen Notifications | Niedrig | Niedrig | Queue-Limit verhindert Probleme |

---

## Erfolgs-Kriterien

✅ Alle UI-Notifications vor init-Hook werden gesendet (nach init-Hook)
✅ Console-Notifications gehen sofort (wie bisher)
✅ MaxSize ist über Settings konfigurierbar (Default überschreibbar, Min/Max Build-Time via ENV konfigurierbar, keine Magic Numbers)
✅ Keine Breaking Changes für bestehende Services
✅ 100% Test-Coverage für neue Komponenten
✅ SOLID-Prinzipien eingehalten
✅ Dokumentation vollständig

---

## Nächste Schritte

1. ✅ Umsetzungsplan erstellt
2. ⏳ Review & Approval
3. ⏳ Phase 1 starten (Settings)
4. ⏳ Schrittweise Implementierung
5. ⏳ Tests & Dokumentation

