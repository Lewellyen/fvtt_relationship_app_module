# Architecture Documentation

## Beziehungsnetzwerke für Foundry VTT - Architektur

Dieses Dokument beschreibt die Architektur des Foundry VTT Relationship App Moduls.

**Datum:** 2025-11-14  
**Stand:** Version 0.20.0  
**Detaillierte Analyse:** Siehe [PROJECT-ANALYSIS.md](./docs/PROJECT-ANALYSIS.md)

### Aktuelle Highlights (v0.20.0)
- **NotificationCenter-first Fehler- und User-Kommunikation:** `ErrorService` ist vollständig ersetzt; alle Business-Services routen Nachrichten über Channels (Console/UI) mit Foundry-Option-Passthrough ([Details](docs/PROJECT-ANALYSIS.md#notifications)).
- **DI-Wrapper-Konsolidierung:** Jede öffentlich instanziierbare Klasse besitzt ein `DI…`-Wrapper-Pendant, wodurch `configureDependencies` ausschließlich Wrapper registriert und Constructor-Signaturen stabil bleiben ([Details](docs/PROJECT-ANALYSIS.md#core-services)).
- **Persistente Observability:** Der neue `PersistentMetricsCollector` kann Metriken in LocalStorage sichern, gesteuert über ENV-Flags `VITE_ENABLE_METRICS_PERSISTENCE` und `VITE_METRICS_PERSISTENCE_KEY` ([Details](docs/CONFIGURATION.md)).

---

## Schichtenarchitektur

Das Modul folgt einer klaren Schichtentrennung mit unidirektionalen Abhängigkeiten:

```
┌─────────────────────────────────────────────────┐
│  Core Layer (Bootstrap & Orchestration)         │
│  • init-solid.ts (Orchestrator)                 │
│  • composition-root.ts (DI Bootstrap)           │
│  • module-api-initializer.ts (API Exposition)   │
│  • module-hook-registrar.ts (Hook Registration) │
│  • module-settings-registrar.ts (Settings)      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Configuration Layer                            │
│  • dependencyconfig.ts                          │
│  • Zentrale DI-Konfiguration                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  DI Infrastructure Layer                        │
│  • ServiceContainer                             │
│  • Tokens & Interfaces                          │
│  • Error Classes                                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Foundry Adapter Layer                          │
│  ┌─────────────┐    ┌──────────┐               │
│  │  Services   │───▶│  Ports   │───▶ Foundry   │
│  └─────────────┘    └──────────┘      API      │
│  (Version-agnostic) (Version-specific)          │
└─────────────────────────────────────────────────┘
```

---

## Port-Adapter-Pattern

Das Modul verwendet das **Hexagonal Architecture**-Muster (Ports & Adapters), um verschiedene Foundry VTT-Versionen zu unterstützen.

### Konzept

```typescript
// 1. Interface (Port) definiert Vertrag
interface FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string>;
}

// 2. Versionsspezifische Implementierung (Adapter)
class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V13-spezifische Logik
  }
}

// 3. Service nutzt Interface, nicht konkrete Implementierung
class FoundryGameService implements FoundryGame {
  private port: FoundryGame;  // Wird zur Laufzeit aufgelöst
}
```

### Lazy Instantiation (Anti-Crash-Mechanismus)

**Problem:** Wenn alle Ports sofort instantiiert werden, crashen neuere Ports auf älteren Foundry-Versionen:

```typescript
// ❌ Alt (vor Fix):
registry.register(14, () => new FoundryGamePortV14()); // Registration OK
const ports = registry.getAvailablePorts(); // 💥 Instantiiert v14-Port auf v13 → Crash

// ✅ Neu (nach Fix):
const factories = registry.getFactories(); // Gibt nur Factories zurück
const port = selector.selectPortFromFactories(factories); // Nur kompatiblen Port instantiieren
```

**Implementierung:**

1. `PortRegistry.getFactories()` gibt `Map<number, PortFactory<T>>` zurück (nicht Instanzen)
2. `PortSelector.selectPortFromFactories()` wählt Factory basierend auf Version
3. Nur die ausgewählte Factory wird ausgeführt → Safe!

**Garantie:** v14-Ports mit `game.v14NewApi` crashen nicht auf v13, da sie nie instantiiert werden.

### Hook-Orchestrierung & Lifecycle (ModuleHookRegistrar)

**Ziele:**
- Zentrale Verwaltung aller Foundry-Hooks des Moduls
- Sauberes Aufräumen bei Modul-Disable/Reload
- Kein duplizierter `Hooks.on`/`Hooks.off`-Code in einzelnen Hooks

**Bausteine:**
- `ModuleHookRegistrar` (`src/core/module-hook-registrar.ts`)
  - DI-verwalteter Orchestrator, der fachliche Hook-Strategien registriert
  - Verwendet `HookRegistrar`-Interface mit `register(container): Result<void, Error>` und `dispose(): void`
- `HookRegistrationManager` (`src/core/hooks/hook-registration-manager.ts`)
  - Kleiner Utility-Typ, der einzelne `off`-Callbacks sammelt und in `dispose()` ausführt
  - Stellt Rollback bei Teilfehlern sicher (z. B. 2 Hooks registriert, 3. schlägt fehl)

```typescript
// src/core/hooks/hook-registration-manager.ts
export class HookRegistrationManager {
  private readonly cleanupCallbacks: Array<() => void> = [];

  register(unregister: () => void): void {
    this.cleanupCallbacks.push(unregister);
  }

  dispose(): void {
    while (this.cleanupCallbacks.length > 0) {
      const unregister = this.cleanupCallbacks.pop();
      try {
        unregister?.();
      } catch {
        // Fehler beim Abmelden des Hooks sollen Shutdown nicht verhindern
      }
    }
  }
}
```

**Beispiel: RenderJournalDirectoryHook**

```typescript
// src/core/hooks/render-journal-directory-hook.ts
export class RenderJournalDirectoryHook implements HookRegistrar {
  private readonly registrationManager = new HookRegistrationManager();

  register(container: ServiceContainer): Result<void, Error> {
    const foundryHooksResult = container.resolveWithError(foundryHooksToken);
    const journalVisibilityResult = container.resolveWithError(journalVisibilityServiceToken);
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    // … DI-Guards mit NotificationCenter-Logging …

    const foundryHooks = foundryHooksResult.value;

    const throttledCallback = throttle((app: unknown, html: unknown) => {
      // Logging + Validation + Delegation an JournalVisibilityService
      journalVisibility.processJournalDirectory(htmlElement);
    }, HOOK_THROTTLE_WINDOW_MS);

    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      throttledCallback
    );

    if (!hookResult.ok) {
      notificationCenter.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
        hookResult.error,
        { channels: ["ConsoleChannel"] }
      );
      return err(new Error(`Hook registration failed: ${hookResult.error.message}`));
    }

    const registrationId = hookResult.value;
    this.registrationManager.register(() => {
      foundryHooks.off(MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY, registrationId);
    });

    return ok(undefined);
  }

  dispose(): void {
    this.registrationManager.dispose();
  }
}
```

**Beispiel: JournalCacheInvalidationHook (Tag-basierte Cache-Invalidierung)**

```typescript
// src/core/hooks/journal-cache-invalidation-hook.ts
export class JournalCacheInvalidationHook implements HookRegistrar {
  private readonly registrationManager = new HookRegistrationManager();

  register(container: ServiceContainer): Result<void, Error> {
    const hooksResult = container.resolveWithError<FoundryHooks>(foundryHooksToken);
    const cacheResult = container.resolveWithError<CacheService>(cacheServiceToken);
    const notificationCenterResult =
      container.resolveWithError<NotificationCenter>(notificationCenterToken);

    // … DI-Guards mit Error-Logging …

    const hooks = hooksResult.value;
    const cache = cacheResult.value;
    const notificationCenter = notificationCenterResult.value;

    for (const hookName of JOURNAL_INVALIDATION_HOOKS) {
      const registrationResult = hooks.on(hookName, () => {
        const removed = cache.invalidateWhere((meta) =>
          meta.tags.includes(HIDDEN_JOURNAL_CACHE_TAG)
        );
        if (removed > 0) {
          notificationCenter.debug(
            `Invalidated ${removed} hidden journal cache entries via ${hookName}`,
            { context: { removed, hookName } },
            { channels: ["ConsoleChannel"] }
          );
        }
      });

      if (!registrationResult.ok) {
        notificationCenter.error(
          `Failed to register ${hookName} hook`,
          registrationResult.error,
          { channels: ["ConsoleChannel"] }
        );

        // Rollback aller zuvor registrierten Hooks
        this.registrationManager.dispose();
        return err(new Error(`Hook registration failed: ${registrationResult.error.message}`));
      }

      const registrationId = registrationResult.value;
      this.registrationManager.register(() => {
        hooks.off(hookName, registrationId);
      });
    }

    return ok(undefined);
  }

  dispose(): void {
    this.registrationManager.dispose();
  }
}
```

**Guidelines für neue Hooks:**
- Neue Hook-Strategien implementieren `HookRegistrar` und verwenden immer `HookRegistrationManager` für alle `Hooks.on`-Registrierungen.
- Im Fehlerfall (z. B. einzelne Registrierung schlägt fehl) **sofort** `registrationManager.dispose()` aufrufen, um einen konsistenten Zustand herzustellen.
- `ModuleHookRegistrar` aggregiert alle `HookRegistrar`-Instanzen und ruft `registerAll()` bzw. `disposeAll()` auf, sodass der gesamte Hook-Lifecycle DI-gesteuert ist.

### Child-Scope Registrierungen (NEU)

**Wichtig**: Children erben Parent-Registrierungen, können aber eigene hinzufügen:

```typescript
const parent = ServiceContainer.createRoot();
parent.registerClass(LoggerToken, Logger, SINGLETON);
parent.validate();

// Child kann eigene Services registrieren
const child = parent.createScope("request").value!;
child.registerClass(RequestToken, RequestContext, SCOPED); // ✅ Child-spezifisch
child.validate(); // ✅ Child muss selbst validieren!

const logger = child.resolve(LoggerToken);    // ✅ Von Parent (geteilt)
const ctx = child.resolve(RequestToken);       // ✅ Von Child (isoliert)
```

### Singleton-Scoping-Semantik

- **Parent-Singletons**: Über alle Scopes geteilt (gleiche Instanz)
- **Child-Singletons**: Nur in diesem Child + dessen Children sichtbar

```typescript
const parent = ServiceContainer.createRoot();
parent.registerClass(SharedToken, SharedService, SINGLETON);
parent.validate();

const child1 = parent.createScope().value!;
const child2 = parent.createScope().value!;

child1.registerClass(Child1Token, Child1Service, SINGLETON);
child1.validate();

// Shared singleton: gleiche Instanz
const shared1 = child1.resolve(SharedToken);
const shared2 = child2.resolve(SharedToken);
console.log(shared1 === shared2); // true

// Child singleton: isoliert
const c1 = child1.resolve(Child1Token);
const c2Result = child2.resolveWithError(Child1Token);
console.log(c2Result.ok); // false (nicht in child2)
```

### Komponenten

#### 1. **Interfaces** (`src/foundry/interfaces/`)
Definieren den Vertrag für Foundry-Interaktionen:
- `FoundryGame` - Journal-Zugriff
- `FoundryHooks` - Hook-System
- `FoundryDocument` - Dokument-Flags
- `FoundryUI` - UI-Manipulationen

#### 2. **Ports** (`src/foundry/ports/v13/`)
Versionsspezifische Implementierungen der Interfaces:
- `FoundryGamePortV13`
- `FoundryHooksPortV13`
- `FoundryDocumentPortV13`
- `FoundryUIPortV13`

#### 3. **Services** (`src/foundry/services/`)
Version-agnostische Wrapper die von `FoundryServiceBase` erben:
```typescript
class FoundryGameService extends FoundryServiceBase<FoundryGame> implements FoundryGame {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken, retryServiceToken] as const;
  
  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryGame>, retryService: RetryService) {
    super(portSelector, portRegistry, retryService);
  }
  
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    return this.withRetry(
      () => {
        const portResult = this.getPort("FoundryGame");
        if (!portResult.ok) return portResult;
        return portResult.value.getJournalEntries();
      },
      "FoundryGame.getJournalEntries"
    );
  }
}
```

**FoundryServiceBase** (`src/foundry/services/FoundryServiceBase.ts`):
- Abstract Base Class für alle Foundry Services
- Eliminiert ~120 Zeilen Code-Duplikation (getPort-Logik)
- Integrierte Retry-Logik via `withRetry()` und `withRetryAsync()`
- Automatischer Schutz gegen transiente Foundry API-Fehler
- Konsistentes Disposal-Pattern via `Disposable`

#### 4. **PortSelector** (`src/foundry/versioning/portselector.ts`)
Wählt den höchsten kompatiblen Port ≤ Foundry-Version:
- Foundry v13 → v13 Port
- Foundry v14 → v14 Port (falls vorhanden), sonst v13

#### 5. **PortRegistry** (`src/foundry/versioning/portregistry.ts`)
Registry für verfügbare Port-Implementierungen:
```typescript
const registry = new PortRegistry<FoundryGame>();
registry.register(13, () => new FoundryGamePortV13());
registry.register(14, () => new FoundryGamePortV14()); // Zukünftig
```

---

## Result Pattern

Das Modul nutzt **konsequent** das Result-Pattern für Fehlerbehandlung:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Vorteile
- **Explizite Fehlerbehandlung**: Compiler zwingt zur Fehlerbehandlung
- **Keine Exceptions**: Vorhersehbarer Kontrollfluss
- **Komponierbar**: Results können mit `match()` verarbeitet werden

### Verwendung

```typescript
// Services geben Result zurück
getJournalEntries(): Result<JournalEntry[], string> {
  const portResult = this.getPort();
  if (!portResult.ok) return portResult;  // Fehler propagieren
  return portResult.value.getJournalEntries();
}

// Caller behandelt Result
const result = gameService.getJournalEntries();
match(result, {
  onOk: (entries) => console.log(entries),
  onErr: (error) => console.error(error)
});
```

---

## Dependency Injection

### ServiceContainer

Zentraler DI-Container mit:
- **Lifecycles**: Singleton, Transient, Scoped
- **Hierarchische Scopes**: Parent-Child-Container mit automatischer Disposal
- **Validation**: Erkennt Zirkelbezüge und fehlende Dependencies
- **Dedicated Error Classes**: `CircularDependencyError`, `FactoryFailedError`, etc.

### Container-Erstellung

**Wichtig**: Verwenden Sie `ServiceContainer.createRoot()` statt `new ServiceContainer()`:

```typescript
// ✅ Korrekt
const container = ServiceContainer.createRoot();

// ❌ Veraltet (Constructor ist private)
const container = new ServiceContainer();
```

### Registrierung

```typescript
// 1. Token definieren
const loggerToken = createToken<Logger>("logger");

// 2. In configureDependencies registrieren
container.registerClass(loggerToken, ConsoleLoggerService, SINGLETON);

// 3. Überall im Code auflösen
const logger = container.resolve(loggerToken);
```

### DI-Wrapper-Pattern (seit v0.20.0)
- **Motivation:** Constructor-Signaturen bleiben stabil, Tests können weiterhin die Basisklasse direkt nutzen.
- **Umsetzung:** Jede produktive Klasse besitzt ein `DI…`-Wrapper, der `static dependencies` kapselt und im selben File nach der Basisklasse lebt (z. B. `ConsoleLoggerService` + `DIConsoleLoggerService` in `src/services/consolelogger.ts`).
- **Registrierung:** Config-Module registrieren ausschließlich Wrapper, wodurch Constructor-Änderungen lokal bleiben und `configureDependencies` keine Token-Arrays mehr manuell pflegen muss.
- **API-Exposition:** `core/module-api.ts` markiert nur ausgewählte Tokens als API-safe; Wrapper respektieren weiterhin `markAsApiSafe` bzw. `markAsDeprecated`.

### Dependency Declaration

Services deklarieren Dependencies als statische Property:
```typescript
class FoundryGameService {
  static dependencies = [portSelectorToken, registryToken] as const;
  
  constructor(
    portSelector: PortSelector, 
    registry: PortRegistry<FoundryGame>
  ) { }
}
```

---

## Erweiterung für neue Foundry-Versionen

### Schritt 1: Port-Implementierung erstellen

```typescript
// src/foundry/ports/v14/FoundryGamePort.ts
export class FoundryGamePortV14 implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V14-spezifische Implementierung
  }
}
```

### Schritt 2: Port registrieren

```typescript
// src/config/dependencyconfig.ts
const gamePortRegistry = new PortRegistry<FoundryGame>();
gamePortRegistry.register(13, () => new FoundryGamePortV13());
gamePortRegistry.register(14, () => new FoundryGamePortV14()); // NEU
```

### Schritt 3: module.json aktualisieren

```json
{
  "compatibility": {
    "minimum": 13,
    "verified": 14,  // ← aktualisieren
    "maximum": 14
  }
}
```

**Das war's!** Keine Änderungen an Services oder Core-Logik nötig.

---

## Bootstrap-Prozess

### Phase 1: Eager Bootstrap (vor Foundry init)

```typescript
// src/core/init-solid.ts
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
// → Erstellt ServiceContainer
// → Registriert alle Dependencies (modular)

// In Foundry 'init' Hook:
const apiInitializer = container.resolve(moduleApiInitializerToken);
apiInitializer.expose(container);
// → Exponiert game.modules.get(MODULE_ID).api
// → Validiert Container
```

**Modular Config Structure:**

Die DI-Konfiguration ist in thematische Module aufgeteilt:

```typescript
// src/config/dependencyconfig.ts (Orchestrator)
export function configureDependencies(container: ServiceContainer) {
  registerFallbacks(container);
  registerStaticValues(container);              // ENV + andere Bootstrap-Werte

  // Orchestriere thematische Config-Module
  registerCoreServices(container);              // Logger, Metrics, ModuleHealth
  registerObservability(container);             // EventEmitter, ObservabilityRegistry
  registerUtilityServices(container);           // Performance, Retry
  registerPortInfrastructure(container);        // PortSelector
  registerSubcontainerValues(container);        // Port-Registries (Mini-Container)
  registerFoundryServices(container);           // FoundryGame, Hooks, Document, UI
  registerI18nServices(container);              // I18n Services
  registerNotifications(container);             // NotificationCenter + Channels
  registerRegistrars(container);                // DI-managed Registrars
  
  const loopServiceResult = registerLoopPreventionServices(container);
  if (isErr(loopServiceResult)) return loopServiceResult;

  validateContainer(container);
  initializeLoopPreventionValues(container);    // HealthChecks nach Validation
  return ok(undefined);
}
```

### Bootstrap Value Kategorien (NEU)

Die Konfiguration unterscheidet drei Value-Typen, um klare Verantwortlichkeiten zu schaffen:

1. **Static Values** – `registerStaticValues()` injiziert vorhandene Bootstrap-Werte wie `EnvironmentConfig` und den `ServiceContainer` selbst. Diese Werte existieren bereits außerhalb des Containers und werden unverändert geteilt.
2. **Subcontainer Values** – `registerSubcontainerValues()` registriert vorvalidierte Registries (z. B. Foundry Port Registries). Sie kapseln versionierte Factories und agieren als Mini-Container für Adapter-Lookups.
3. **Loop-Prevention Services** – `registerLoopPreventionServices()` registriert Health-Checks (Container & Metrics) als Klassen. Die Instanziierung erfolgt erst nach erfolgreicher Validation, wodurch wir Selbst-Referenzen während des Aufbaus vermeiden.

Die Reihenfolge stellt sicher, dass nur vollständig validierte Services mit sensiblen Value-Registrierungen gekoppelt werden.

**Self-Configuring Services:**

Services konfigurieren sich selbst via Constructor-Dependencies:

```typescript
// Beispiel: DI-Wrapper für Logger (EnvironmentConfig + TraceContext)
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    super(env, traceContext);  // Self-configuring!
  }
}
```

> **Wrapper-Anordnung:** Die Basisklasse steht im selben File ganz oben, direkt gefolgt vom `DI…`-Wrapper. So bleiben `static dependencies` sichtbar, während Tests und Bootstrap-Fallbacks weiterhin die Basisklasse per `new` instanziieren können.

### Phase 2: Foundry init Hook

```typescript
Hooks.on("init", () => {
  root.exposeToModuleApi();  // API unter game.modules.get().api
  
  // Registrars werden via DI aufgelöst
  const settingsRegistrar = container.resolveWithError(moduleSettingsRegistrarToken);
  settingsRegistrar.value.registerAll(container);
  
  const hookRegistrar = container.resolveWithError(moduleHookRegistrarToken);
  hookRegistrar.value.registerAll(container);
});
```

### Phase 3: Foundry ready Hook

```typescript
Hooks.on("ready", () => {
  // Modul voll einsatzbereit
  // Services über api.resolve() nutzbar
});
```

---

### Notifications-Subsystem

- `NotificationCenter` empfängt Modul-Events (Debug, Info, Warn, Error) und verteilt sie an registrierte Channels.
- Während der Bootstrap-Phase steht ausschließlich der `ConsoleChannel` zur Verfügung; er wird direkt zusammen mit dem NotificationCenter registriert, sodass bereits nach `configureDependencies` über `notificationCenter.debug|error(..., { channels: ["ConsoleChannel"] })` geloggt werden kann.
- Im `Hooks.on("init")`-Callback fügt `init-solid.ts` den `UIChannel` per `notificationCenter.addChannel(uiChannel)` hinzu, sobald die Foundry-Ports bereitstehen.
- `UIChannel` kapselt Foundrys `ui.notifications` und sorgt für Sanitizing sowie Environment-selektives Messaging.
- Seit v13-Port-Erweiterung unterstützt die Pipeline Foundry-native Optionen (`permanent`, `localize`, `format`, `console`, `clean`, `escape`, `progress`) über `NotificationCenterOptions.uiOptions`.
- `FoundryUIPortV13` reicht die Optionen unverändert an `ui.notifications` durch, wodurch alle v13-Features (z. B. dauerhafte Hinweise oder lokalisierte Meldungen) im Modul verfügbar sind.
- Die neue Option-Weitergabe bleibt vollständig DI-kompatibel: Services nutzen `NotificationCenter`, andere Ports bleiben entkoppelt.

---

## Fehlerbehandlung

### Ebenen

1. **Port-Ebene**: Foundry-API-Fehler → Result
2. **Service-Ebene**: Port-Selektion-Fehler → Result
3. **Orchestrator-Ebene** (z.B. ModuleHookRegistrar): Result-Handling + Logging

### Container-Fehler

Dedizierte Error-Klassen mit Cause-Chains:
- `CircularDependencyError` - Zirkelbezug erkannt
- `ScopeRequiredError` - Scoped Service ohne Scope
- `InvalidLifecycleError` - Ungültiger Lifecycle
- `FactoryFailedError` - Factory-Fehler mit ursprünglicher Ursache

---

## Code-Konventionen

### UTF-8 Encoding
**Alle Dateien MÜSSEN UTF-8 ohne BOM sein.**  
Deutsche Umlaute (ä, ö, ü, ß) müssen korrekt dargestellt werden.

### Naming
- **Interfaces**: PascalCase ohne "I"-Präfix (`FoundryGame`)
- **Services**: `<Name>Service` (`FoundryGameService`)
- **Ports**: `<Name>Port<Version>` (`FoundryGamePortV13`)
- **Tokens**: camelCase mit "Token"-Suffix (`loggerToken`)

### Result Pattern
- **Alle externen Interaktionen** (Foundry API, Dateisystem) geben Result zurück
- **throw** nur für Programmierfehler, nie für erwartbare Fehler

### Logging
- **Bootstrap-Phase:** Ein dedizierter `BootstrapLoggerService` (ConsoleLogger + ENV) wird direkt via `new` verwendet, solange der Container noch nicht validiert ist (z. B. in `CompositionRoot`).
- **Nach Validation:** Alle nicht-Bootstrap-Komponenten (Hooks, Registrare, Business-Services) loggen ausschließlich über das NotificationCenter und geben bei technischen Meldungen `channels: ["ConsoleChannel"]` an.
- Dadurch bleiben Services funktional, und User-facing Meldungen laufen automatisch über UI/Console Channels.

---

## Abhängigkeitsdiagramm

```
CompositionRoot (bootstrap)
    │
    ├─▶ ServiceContainer
    │       │
    │
ModuleApiInitializer (expose)
    │
    ├─▶ game.modules.get(MODULE_ID).api
    │
    │       ├─▶ Logger (Singleton, mit Fallback)
    │       │
    │       ├─▶ PortSelector (Singleton)
    │       │
    │       ├─▶ PortRegistries (Values)
    │       │   ├─▶ FoundryGamePortRegistry
    │       │   ├─▶ FoundryHooksPortRegistry
    │       │   ├─▶ FoundryDocumentPortRegistry
    │       │   └─▶ FoundryUIPortRegistry
    │       │
    │       └─▶ Services (Singletons)
    │           ├─▶ FoundryGameService
    │           │   └─▶ (lazy) FoundryGamePortV13
    │           │
    │           ├─▶ FoundryHooksService
    │           │   └─▶ (lazy) FoundryHooksPortV13
    │           │
    │           ├─▶ FoundryDocumentService
    │           │   └─▶ (lazy) FoundryDocumentPortV13
    │           │
    │           └─▶ FoundryUIService
    │               └─▶ (lazy) FoundryUIPortV13
    │
    └─▶ ModuleHookRegistrar
        └─▶ Nutzt Services via Container
```

---

## Testing-Strategie

### Unit Tests
- **Ports**: Mocken Foundry-API
- **Services**: Mocken PortSelector/PortRegistry
- **Container**: Testen Lifecycle und Validation

### Integration Tests
- Reale Port-Selektion
- Service-Port-Interaktion

### Headless Tests
Soft-Abort in `init-solid.ts` erlaubt Tests ohne Foundry:
```typescript
if (typeof Hooks === "undefined") {
  logger.warn("Foundry Hooks API not available - skipped");
  // Keine Hooks registriert, aber Modul geladen
}
```

---

## Observability & Self-Registration Pattern

### Self-Registration

Services registrieren sich **automatisch** für Observability im Constructor:

```typescript
class PortSelector {
  static dependencies = [
    portSelectionEventEmitterToken,
    observabilityRegistryToken
  ] as const;
  
  constructor(
    private eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry
  ) {
    // Self-registration: Service meldet sich selbst an
    observability.registerPortSelector(this);
  }
  
  selectPort() {
    // Events werden automatisch zu Logger/Metrics geroutet
    this.eventEmitter.emit({ type: "success", ... });
  }
}
```

**Vorteile:**
- ✅ Kein manuelles Wiring nötig
- ✅ Service-Erstellung = automatische Observability
- ✅ Erweiterbar ohne Code-Änderungen
- ✅ Type-Safe via `ObservableService<TEvent>`

### ObservabilityRegistry

Zentraler Hub für Observable Services:

```typescript
class ObservabilityRegistry {
  static dependencies = [loggerToken, metricsRecorderToken] as const;
  
  registerPortSelector(service: ObservableService<PortSelectionEvent>) {
    service.onEvent((event) => {
      if (event.type === "success") {
        this.logger.debug(`Port v${event.selectedVersion} selected`);
        this.metrics.recordPortSelection(event.selectedVersion);
      }
    });
  }
  
  // Future: Add more registration methods for other observable services
  // registerSomeOtherService(service: ObservableService<OtherEvent>): void { ... }
}
```

### Persistent Metrics Collector
- **Klasse:** `src/observability/metrics-persistence/persistent-metrics-collector.ts`
- **Storage-Auswahl:** Nutzt konfigurierbares `MetricsStorage` (standardmäßig `localStorage`), schaltet sich über `ENV.enableMetricsPersistence` zu/ab.
- **Sampling & Replay:** Puffert Events offline und synchronisiert sie bei erneutem Bootstrap, wodurch Performance-Daten in langen Foundry-Sitzungen erhalten bleiben.
- **Konfiguration:** Flags `VITE_ENABLE_METRICS_PERSISTENCE` und `VITE_METRICS_PERSISTENCE_KEY` (siehe `docs/CONFIGURATION.md`) steuern Aktivierung und Storage-Namespace.
- **DI-Integration:** Wrapper `DIPersistentMetricsCollector` wird im Observability-Config registriert und respektiert das Self-Registration-Pattern (Metrics landen weiterhin im ObservabilityRegistry-Pipeline).

---

## Modular Configuration Structure

### Config-Module nach Themen

```
src/config/
├── dependencyconfig.ts                (Orchestrator)
├── modules/
│   ├── core-services.config.ts        (Logger, Metrics, Environment)
│   ├── observability.config.ts        (EventEmitter, ObservabilityRegistry)
│   ├── port-infrastructure.config.ts  (PortSelector, PortRegistries)
│   ├── foundry-services.config.ts     (FoundryGame, Hooks, Document, UI)
│   ├── utility-services.config.ts     (Performance, Retry)
│   ├── i18n-services.config.ts        (I18n Services)
│   ├── notifications.config.ts        (NotificationCenter, Channels)
│   └── registrars.config.ts           (ModuleSettingsRegistrar, ModuleHookRegistrar)
```

**Vorteile:**
- ✅ Jedes Modul < 200 Zeilen
- ✅ Klare thematische Trennung
- ✅ Einfach erweiterbar
- ✅ Übersichtlicher Orchestrator

---

## Health-Check-Registry Pattern

### Konzept

Services können sich selbst für Health-Monitoring registrieren:

```typescript
// 1. Health-Check implementieren
class ContainerHealthCheck implements HealthCheck {
  readonly name = "container";
  
  constructor(private readonly container: ServiceContainer) {}
  
  check(): boolean {
    return this.container.getValidationState() === "validated";
  }
  
  getDetails(): string | null {
    const state = this.container.getValidationState();
    return state !== "validated" ? `Container state: ${state}` : null;
  }
}

// 2. Auto-Registrierung via DI-Wrapper
class InjectableContainerHealthCheck extends ContainerHealthCheck {
  static dependencies = [serviceContainerToken, healthCheckRegistryToken] as const;

  constructor(container: ServiceContainer, registry: HealthCheckRegistry) {
    super(container);
    registry.register(this);
  }
}

container.registerClass(
  containerHealthCheckToken,
  InjectableContainerHealthCheck,
  SINGLETON
);

// 3. ModuleHealthService nutzt Registry
class ModuleHealthService {
  constructor(private readonly registry: HealthCheckRegistry) {}
  
  getHealth(): HealthStatus {
    const results = this.registry.runAll();
    // Aggregiere alle Check-Ergebnisse
  }
}
```

### Vorteile

- **Extensible**: Neue Health-Checks ohne ModuleHealthService-Änderungen
- **No Circular Dependencies**: ModuleHealthService kennt Container nicht mehr
- **Testable**: Health-Checks sind isoliert testbar
- **Modular**: Jeder Check hat eine klare Verantwortung (SRP)

### Implementierte Health-Checks

1. **ContainerHealthCheck**: Validiert DI-Container-Status
2. **MetricsHealthCheck**: Prüft Port-Selection und Resolution-Errors

Neue Checks können einfach hinzugefügt werden:

```typescript
class CustomHealthCheck implements HealthCheck {
  readonly name = "custom";
  check(): boolean { /* ... */ }
  getDetails(): string | null { /* ... */ }
}
```

---

## Weiterführende Dokumentation

- **TypeScript Configuration**: `tsconfig.json` - Strict Mode aktiviert
- **DI Infrastructure**: `src/di_infrastructure/` - Container-Implementierung
- **Foundry Adapter**: `src/foundry/` - Port-Pattern-Implementierung
- **Core**: `src/core/` - Bootstrap und Orchestrierung
- **Observability**: `src/observability/` - Self-Registration Pattern

---

---

## 📚 Weiterführende Dokumente

### High-Level (dieses Dokument)
- Architektur-Überblick
- Port-Adapter-Pattern
- Result Pattern
- DI-Container-Grundlagen

### Deep-Dive (detaillierte Analysen)
- **[PROJECT-ANALYSIS.md](./docs/PROJECT-ANALYSIS.md)** - Vollständige Service-Analyse (19 Services)
- **[DEPENDENCY-MAP.md](./docs/DEPENDENCY-MAP.md)** - Detaillierte Dependency-Hierarchie
- **[BOOTFLOW.md](./docs/BOOTFLOW.md)** - Bootstrap-Prozess im Detail
- **[QUICK-REFERENCE.md](./docs/QUICK-REFERENCE.md)** - Entwickler-Schnellreferenz

### Entwicklung
- **[VERSIONING-STRATEGY.md](./docs/VERSIONING-STRATEGY.md)** - Breaking Changes & Deprecation
- **[TESTING.md](./docs/TESTING.md)** - Test-Strategie
- **[API.md](./docs/API.md)** - Öffentliche API

### ADRs (Architecture Decision Records)
- [ADR-0001: Result Pattern](./docs/adr/0001-use-result-pattern-instead-of-exceptions.md)
- [ADR-0002: Custom DI Container](./docs/adr/0002-custom-di-container-instead-of-tsyringe.md)
- [ADR-0003: Port-Adapter-Pattern](./docs/adr/0003-port-adapter-for-foundry-version-compatibility.md)
- [Alle ADRs](./docs/adr/)

---

**Letzte Aktualisierung:** 2025-11-09

