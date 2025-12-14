# Quick Reference – Service & Dependency Übersicht

**Model:** Claude Sonnet 4.5
**Datum:** 2025-11-20
**Projekt-Status:** Version 0.26.3 → Unreleased (Pre-Release - Clean Architecture Restrukturierung)
**API-Version:** 1.0.0
**Breaking Changes:** ✅ Erlaubt bis Modul 1.0.0
**Legacy-Code:** ❌ Wird unmittelbar bereinigt

---

## ⭐ Update (Unreleased) - Clean Architecture

Die gesamte `/src` Struktur wurde nach Clean Architecture restrukturiert:

```
src/
├── domain/              ✨ Framework-unabhängige Geschäftslogik
├── application/         ✨ Anwendungslogik (Services, Use-Cases)
├── infrastructure/      ✨ Technische Infrastruktur (DI, Cache, etc.)
└── framework/           ✨ Framework-Integration (Bootstrap, Config)
```

**Wichtig:** Alle `@/`-Imports funktionieren unverändert! Keine Breaking Changes in der API.

---

## 🎯 Schnellzugriff

| Dokument | Zweck |
|----------|-------|
| [Architektur-Übersicht](../architecture/overview.md) | High-Level Architektur |
| [Service-Übersicht](./services.md) | Service-Dokumentation |
| [Token-Katalog](./tokens.md) | DI-Token-Übersicht (TODO) |
| Dieses Dokument | Schnelle Referenz für tägliche Entwicklung |

---

## 📦 Service-Kategorien

### Core Infrastructure (Layer 2)
- **ConsoleLoggerService / DIConsoleLoggerService** – Logging & TraceContext
- **MetricsCollector / DIMetricsCollector** – Container-/Port-Metriken
- **TraceContext / DITraceContext** – Automatische Trace-ID-Propagation (sync & async)
- **ModuleHealthService / DIModuleHealthService** – Aggregiert registrierte Checks
- **ModuleApiInitializer / DIModuleApiInitializer** – Public API Bootstrap & Token-Exposure
- **ObservabilityRegistry / DIObservabilityRegistry** – Self-Registration Hub
- **CacheService / DICacheService** – TTL-Cache mit Metrics & ENV-Konfiguration

### Foundry Adapter (Layer 3)
- **PortSelector / DIPortSelector** – Version-agnostische Port-Auswahl
- **PortSelectionEventEmitter** – TRANSIENT Event Emitter für Observability
- **FoundryXService / DIFoundryXService** – Adapter für Game, Hooks, Document, UI, Settings, I18n
- **FoundryServiceBase** – Gemeinsamer Lazy-Port-Mechanismus

### Registrars & Event System
- **ModuleSettingsRegistrar / DIModuleSettingsRegistrar** – Settings via DI registrieren
- **ModuleEventRegistrar / DIModuleEventRegistrar** – Platform-agnostische Event-Listener-Verwaltung
- **InvalidateJournalCacheOnChangeUseCase / DIInvalidateJournalCacheOnChangeUseCase** – Cache invalidieren bei Journal-Änderungen
- **ProcessJournalDirectoryOnRenderUseCase / DIProcessJournalDirectoryOnRenderUseCase** – Journal-Directory-Processing
- **FoundryJournalEventAdapter / DIFoundryJournalEventAdapter** – Foundry-spezifischer Event-Adapter

### Business Layer
- **JournalVisibilityService / DIJournalVisibilityService** – Journal-Visibility
- **I18nFacadeService / DII18nFacadeService** – Chain-of-Responsibility (Foundry → Local → Fallback)
- **FoundryJournalFacade / DIFoundryJournalFacade** – Kombiniert Game/Document/UI
- **NotificationCenter / DINotificationCenter** – Channel-basierte Notifications

### Utilities & Cross-Cutting
- **PerformanceTrackingService / DIPerformanceTrackingService** – Sampling & Duration Tracking
- **RetryService / DIRetryService** – Exponential Backoff + Observability
- **LocalI18nService / DILocalI18nService** – JSON-basierte Fallback-Lokalisation
- **FallbackTranslationHandler / DIFallbackTranslationHandler** – Chain-Terminator ohne Dependencies
- **HealthCheckRegistry / DIHealthCheckRegistry** – Extensible Health Check System

---

## 📦 Modular Config Structure ⭐ UPDATED (Unreleased)

DI-Konfiguration ist in 8 thematische Module aufgeteilt:

```
src/framework/config/
├── dependencyconfig.ts                (Orchestrator)
├── modules/
│   ├── core-services.config.ts        (Logger, Metrics, Environment)
│   ├── observability.config.ts        (EventEmitter, ObservabilityRegistry)
│   ├── port-infrastructure.config.ts  (PortSelector, PortRegistries)
│   ├── foundry-services.config.ts     (FoundryGame, Hooks, Document, UI)
│   ├── utility-services.config.ts     (Performance, Retry)
│   ├── i18n-services.config.ts        (I18n Services)
│   ├── event-ports.config.ts          (Event Ports & Use-Cases) ⭐ NEU
│   ├── notifications.config.ts        (NotificationCenter & Channels)
│   ├── cache-services.config.ts       (CacheService)
│   └── registrars.config.ts           (ModuleSettingsRegistrar, ModuleHookRegistrar)
```

**Neue Services in das passende thematische Modul einfügen!**

### Value Registration Pipeline (NEU v0.18.0)
- **Static Values**: `registerStaticValues()` injiziert ENV, den `ServiceContainer` und andere Bootstrap-Konstanten.
- **Subcontainer Values**: `registerSubcontainerValues()` stellt Foundry Port Registries & vergleichbare Mini-Container bereit.
- **Loop-Prevention Services**: `registerLoopPreventionServices()` registriert Health-Checks als Klassen; Instanziierung erfolgt erst nach erfolgreicher Container-Validation (`initializeLoopPreventionValues()`).

---

## 🔧 Häufig genutzte Tokens

### Logging, Metrics & Notifications
```typescript
import {
  metricsCollectorToken,
  traceContextToken,
  notificationCenterToken,
  observabilityRegistryToken,
  portSelectionEventEmitterToken,
  loggerToken,
} from "@/infrastructure/shared/tokens";

const metrics = container.resolve(metricsCollectorToken);
const traceContext = container.resolve(traceContextToken);
const notifications = container.resolve(notificationCenterToken);
const observability = container.resolve(observabilityRegistryToken);
const logger = container.resolve(loggerToken); // Nur für Log-Level-Konfiguration verwenden
```

- **Logging-Konvention:** Für alle Meldungen `notificationCenter.debug/info/warn/error(..., { channels: ["ConsoleChannel"] })` nutzen. Der `logger` wird ausschließlich für interne Konfiguration (z. B. `setMinLevel`) oder Bootstrap-Fallbacks eingesetzt.
- **UI-Channel:** Wird automatisch im `init`-Hook registriert – bis dahin laufen Notifications nur über den ConsoleChannel.

### Foundry Services & Registrars
```typescript
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryI18nToken,
  moduleSettingsRegistrarToken,
  moduleHookRegistrarToken,
  renderJournalDirectoryHookToken,
} from "@/infrastructure/shared/tokens";

const game = container.resolve(foundryGameToken);
const settings = container.resolve(foundrySettingsToken);
const hooksRegistrar = container.resolve(moduleHookRegistrarToken);
```

### Business Services
```typescript
import {
  journalVisibilityServiceToken,
  i18nFacadeToken,
  foundryJournalFacadeToken,
} from "@/infrastructure/shared/tokens";

const journalService = container.resolve(journalVisibilityServiceToken);
const i18n = container.resolve(i18nFacadeToken);
const journalFacade = container.resolve(foundryJournalFacadeToken);
```

---

## 📊 Dependency-Ketten (Kurzform)

### Logger verwenden
```
Dein Service → Logger → console.log/error/warn/info/debug
```

### Foundry API nutzen
```
Dein Service
  → FoundryGameService
    → PortSelector
      → FoundryGamePortV13
        → game.journal
```

### i18n mit Fallback
```
Dein Service
  → I18nFacadeService
    → FoundryI18nService (Foundry API)
      [FALLBACK]
    → LocalI18nService (JSON-basiert)
      [FALLBACK]
    → Key oder Custom Fallback
```

---

## ⚙️ Service & DI-Wrapper Cheat Sheet

### 1. Fachliche Service-Klasse
```typescript
// src/services/MyService.ts
export class MyService {
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsCollector,
  ) {}

  doSomething(): Result<string, never> {
    this.logger.info("Doing something");
    return ok("success");
  }
}
```

### 2. DI-Wrapper
```typescript
export class DIMyService extends MyService {
  static dependencies = [loggerToken, metricsCollectorToken] as const;

  constructor(logger: Logger, metrics: MetricsCollector) {
    super(logger, metrics);
  }
}
```

### 3. Token & Registrierung
```typescript
// src/infrastructure/shared/tokens/infrastructure.tokens.ts
export const myServiceToken = createInjectionToken<MyService>("MyService");

// src/framework/config/modules/utility-services.config.ts
container.registerClass(myServiceToken, DIMyService, ServiceLifecycle.SINGLETON);
```

### 4. Nutzung
```typescript
const service = container.resolve(myServiceToken);
const result = service.doSomething();
```

---

## 🧪 Testing Cheat Sheet

### Service mit Mocks testen
```typescript
import { describe, it, expect, vi } from "vitest";
import { MyService } from "./MyService";

describe("MyService", () => {
  it("should do something", () => {
    // Mock Dependencies
    const loggerMock = {
      info: vi.fn(),
      debug: vi.fn(),
      // ... other logger methods
    };
    const metricsMock = {
      recordOperation: vi.fn(),
      // ... other metrics methods
    };

    // Create Service with Mocks
    const service = new MyService(loggerMock, metricsMock);

    // Test
    const result = service.doSomething();
    expect(result.ok).toBe(true);
    expect(loggerMock.info).toHaveBeenCalledWith("Doing something");
  });
});
```

---

## 🔍 Debugging Tipps

### Container-Status prüfen (Foundry Console)
```javascript
// Module API abrufen
const api = game.modules.get("fvtt_relationship_app_module").api;

// Verfügbare Tokens anzeigen
const tokens = api.getAvailableTokens();
console.table(Array.from(tokens.entries()));

// Metrics anzeigen
console.table(api.getMetrics());

// Health Status
console.log(api.getHealth());
```

### Service manuell resolven (Foundry Console)
```javascript
const api = game.modules.get("fvtt_relationship_app_module").api;

// NotificationCenter holen
const notifications = api.resolve(api.tokens.notificationCenterToken);
notifications.info("Test message");

// Foundry Game Service
const game = api.resolve(api.tokens.foundryGameToken);
const journals = game.getJournalEntries();
console.log(journals);
```

---

## 📈 Performance Best Practices

### 1. Sampling-basiertes Performance Tracking nutzen
```typescript
const perfService = container.resolve(performanceTrackingServiceToken);

const result = await perfService.trackAsync(
  async () => expensiveOperation(),
  (duration, result) => {
    logger.debug(`Operation took ${duration}ms`);
    metrics.recordOperation("expensiveOperation", duration, result.ok);
  }
);
```

### 2. Retry für transiente Fehler
```typescript
const retryService = container.resolve(retryServiceToken);

const result = await retryService.retry(
  () => foundryApi.fetchData(),
  {
    maxAttempts: 3,
    delayMs: 100,
    backoffFactor: 2,  // 100ms, 200ms, 400ms
    operationName: "fetchData",
    mapException: (error, attempt) => ({
      code: 'FETCH_FAILED' as const,
      message: `Attempt ${attempt} failed: ${String(error)}`
    })
  }
);
```

### 3. Trace-IDs für Request-Correlation

#### Automatische TraceContext-Propagation (empfohlen)
```typescript
import { traceContextToken } from "@/infrastructure/shared/tokens";

const traceContext = container.resolve(traceContextToken);

// Automatische Trace-ID-Propagation (empfohlen)
traceContext.trace(() => {
  logger.info("Starting operation");      // [auto-generated] Starting operation
  doSomething();                          // Nested calls sehen gleiche Trace-ID
  logger.info("Operation completed");     // [auto-generated] Operation completed
}, { operationName: "myOperation" });

// Async operations
await traceContext.traceAsync(async () => {
  logger.info("Async start");
  const result = await fetchData();
  logger.info("Async complete");
}, "custom-trace-id");

// Nested traces (verschiedene IDs)
traceContext.trace(() => {
  logger.info("Outer");
  traceContext.trace(() => {
    logger.info("Inner");  // Andere Trace-ID
  });
  logger.info("Back to outer");
});
```

#### Alternative: explizites `withTraceId()`
```typescript
import { generateTraceId } from "@/utils/observability/trace";

// Explizite Trace-ID-Weitergabe via withTraceId()
const traceId = generateTraceId();
const tracedLogger = logger.withTraceId(traceId);

tracedLogger.info("Starting operation");
await doSomethingAsync(tracedLogger);  // Logger weitergeben
tracedLogger.info("Operation completed");

// Nützlich wenn:
// - Trace-ID von extern kommt (z.B. HTTP-Header)
// - Volle Kontrolle über Trace-ID-Lifecycle gewünscht
// - Logger explizit weitergegeben werden soll
```

---

## 🚨 Häufige Fehler & Lösungen

### Fehler: "Token not registered"
**Ursache:** Service wurde nicht in `dependencyconfig.ts` registriert
**Lösung:** Service registrieren in `configureDependencies()`

### Fehler: "Circular dependency detected"
**Ursache:** Service A → Service B → Service A
**Lösung:**
- Refactor zu Event-basierter Kommunikation (Observer Pattern)
- Oder: Facade-Pattern einführen
- Oder: Factory-basierte Registration

### Fehler: "PORT_SELECTION_FAILED"
**Ursache:** Kein kompatibler Port für aktuelle Foundry-Version
**Lösung:**
- Prüfe Foundry-Version: `game.version`
- Prüfe verfügbare Ports in Port-Registry
- Ggf. v14+ Ports implementieren

### Fehler: "Validation failed: Missing dependency"
**Ursache:** Registrierungs-Reihenfolge falsch
**Lösung:** Dependencies MÜSSEN vor dem Service registriert werden

---

## 📝 Result Pattern Cheat Sheet

### Ok Result
```typescript
import { ok } from "@/infrastructure/shared/utils/result";

function success(): Result<string, never> {
  return ok("Success!");
}
```

### Error Result
```typescript
import { err } from "@/infrastructure/shared/utils/result";

function failure(): Result<never, string> {
  return err("Something went wrong");
}
```

### Pattern Matching
```typescript
import { match } from "@/infrastructure/shared/utils/result";

const result = doSomething();
match(result, {
  onOk: (value) => console.log("Success:", value),
  onErr: (error) => console.error("Error:", error)
});
```

### Chaining
```typescript
import { andThen, map } from "@/infrastructure/shared/utils/result";

const result = parseNumber("42")
  |> andThen((num) => divide(100, num))
  |> map((result) => result.toFixed(2));
```

### Async Results
```typescript
import { asyncAndThen, fromPromise } from "@/infrastructure/shared/utils/result";

const result = await fromPromise(
  fetch("/api/data"),
  (error) => `Fetch failed: ${error}`
);

if (result.ok) {
  console.log(result.value);
}
```

---

## 🔗 Service-Dependency-Kurzübersicht

| Service | Dependencies | Layer |
|---------|--------------|-------|
| **ENV** | - | 0 (Config) |
| **TraceContext** ⭐ NEW | - | 2 (Infrastructure) |
| **Logger** | ENV, TraceContext (optional) | 2 (Infrastructure) |
| **Metrics** | ENV | 2 (Infrastructure) |
| **PortSelector** | - | 3 (Foundry Adapter) |
| **FoundryGameService** | PortSelector, PortRegistry | 3 (Foundry Adapter) |
| **FoundryHooksService** | PortSelector, PortRegistry, Logger | 3 (Foundry Adapter) |
| **FoundryJournalFacade** | Game, Document, UI | 4 (Facade) |
| **JournalVisibilityService** | JournalFacade, Logger | 4 (Business) |
| **RetryService** | Logger, Metrics | 2 (Infrastructure) |
| **PerformanceTrackingService** | ENV, Metrics | 2 (Infrastructure) |
| **I18nFacadeService** | FoundryI18n, LocalI18n | 4 (Facade) |
| **LocalI18nService** | - | 4 (Business) |

---

## 🎨 Design Patterns im Projekt

| Pattern | Verwendung | Beispiel |
|---------|------------|----------|
| **Dependency Injection** | Überall | ServiceContainer |
| **Result Pattern** | Error Handling | `Result<T, E>` |
| **Factory Pattern** | Container Creation | `ServiceContainer.createRoot()` |
| **Facade Pattern** | API-Simplification | FoundryJournalFacade, I18nFacadeService |
| **Decorator Pattern** | Logging | TracedLogger (`logger.withTraceId()`) |
| **Observer Pattern** | Observability | PortSelector Events |
| **Strategy Pattern** | i18n Fallback | I18nFacadeService (Foundry → Local → Key) |
| **Port-Adapter** | Version-Kompatibilität | FoundryGamePortV13 |
| **Singleton** | DI Container | ServiceLifecycle.SINGLETON |
| **Template Method** | Performance Tracking | PerformanceTrackerImpl |

---

## 🎯 Top Refactoring-Prioritäten (Pre-Release 0.x.x)

### Sofort umsetzbar (Breaking Changes erlaubt!)

#### 1. ✅ Base Class für Foundry Services (ABGESCHLOSSEN)
- **Warum:** Code-Duplikation eliminieren (~120 Zeilen)
- **Aufwand:** Bereits umgesetzt
- **Dateien:** `src/foundry/services/FoundryServiceBase.ts`
- **Breaking Changes:** Nur Implementation
- **Status:** ✅ **Implementiert** - Alle Services nutzen FoundryServiceBase

#### 2. ✅ Health-Check-Registry (ABGESCHLOSSEN)
- **Warum:** Container Self-Reference eliminieren, bessere Architektur
- **Aufwand:** Bereits umgesetzt
- **Dateien:** `src/core/health/health-check-registry.ts`, `src/core/module-health-service.ts`
- **Breaking Changes:** Umgesetzt
- **Status:** ✅ **Implementiert** - HealthCheckRegistry-Pattern vollständig implementiert

#### 3. ✅ Trace-Context-Manager (ABGESCHLOSSEN v0.15.0)
- **Warum:** Developer Experience verbessern - keine manuelle Trace-ID-Weitergabe mehr nötig
- **Aufwand:** ~6h (abgeschlossen)
- **Dateien:** `src/observability/trace/TraceContext.ts`, Logger-Factory-Integration
- **Breaking Changes:** Keine (additive API, Logger als Factory statt Class)
- **Status:** ✅ **Implementiert**
  - TraceContext Service mit `trace()`, `traceAsync()`, `getCurrentTraceId()`
  - Logger auto-injiziert Trace-IDs aus aktuellem Context
  - +50 Tests (1026 → 1076) mit dispose() & edge case coverage
  - `withTraceId()` bleibt vollwertig als explizite Alternative

#### 4. ✅ Retry-Service API (BEREITS CLEAN)
- **Warum:** Type Safety verbessern, API vereinfachen
- **Aufwand:** Bereits umgesetzt in v0.9.0
- **Dateien:** `src/services/RetryService.ts`
- **Breaking Changes:** Bereits umgesetzt (v0.9.0)
- **Status:** ✅ **Clean** - Nur noch moderne Options-Object-API vorhanden

### Später

#### 5. 🟢 Metrics Persistierung (NIEDRIG)
- **Warum:** Langzeit-Metriken
- **Aufwand:** 4-8h
- **Breaking Changes:** Keine (additive)
- **Status:** Bei Bedarf

#### 6. ⏳ v14 Ports (WARTEND)
- **Warum:** Support für neue Foundry-Version
- **Aufwand:** 8-16h (nach API-Release)
- **Dateien:** `src/foundry/ports/v14/*.ts`, `module.json`
- **Status:** ⏳ Wartend auf API-Veröffentlichung
- **Trigger:** `module.json` → `compatibility.maximum` auf 14 erhöhen
- **Aktuell:** `maximum: 13` → nur v13 Ports benötigt ✅
- **Vorbereitung:** ✅ Infrastruktur vorhanden

---

### 📅 Empfohlener Zeitplan (vor 1.0.0)

**Sprint 1 (6-10h):**
- ✅ Base Class für Foundry Services (bereits umgesetzt - FoundryServiceBase existiert)
- ✅ Health-Check-Registry (bereits umgesetzt - HealthCheckRegistry existiert)

**Sprint 2:**
- ✅ Trace-Context-Manager (abgeschlossen v0.15.0)
- ✅ Retry-Service API (bereits clean seit v0.9.0)

**Sprint 3 (optional, 4-8h):**
- Metrics Persistierung (bei Bedarf)

**Status:** ✅ **Alle kritischen Refactorings abgeschlossen!**
- Base Class: ✅ Implementiert
- Health-Check-Registry: ✅ Implementiert
- Trace-Context-Manager: ✅ Implementiert v0.15.0
- Retry-Service API: ✅ Clean

---

## 📚 Weitere Ressourcen

- **Architektur:** [Architektur-Übersicht](../architecture/overview.md)
- **Versioning:** [Versionierung](../development/versioning.md)
- **ADRs:** [Architecture Decision Records](../decisions/README.md)
- **Testing:** [Testing](../development/testing.md)
- **Configuration:** [Konfiguration](../guides/configuration.md)
- **API:** [API-Referenz](./api-reference.md)

---

**Ende Quick Reference**

