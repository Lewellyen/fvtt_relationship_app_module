# Quick Reference - Service & Dependency Übersicht

**Model:** Claude Sonnet 4.5  
**Datum:** 2025-11-09  
**Projekt-Status:** Version 0.8.0 (Pre-Release)  
**Breaking Changes:** ✅ Erlaubt - Aggressives Refactoring erwünscht!  
**Legacy-Codes:** ❌ Sofort eliminieren (kein Deprecation nötig)  
**Ab 1.0.0:** Deprecation-Strategie mit Migrationspfad verpflichtend

---

## 🎯 Schnellzugriff

| Dokument | Zweck |
|----------|-------|
| [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) | Vollständige Projektanalyse mit Refactoring-Empfehlungen |
| [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) | Detaillierte Dependency-Visualisierung |
| Dieses Dokument | Schnelle Referenz für tägliche Entwicklung |

---

## 📦 Service-Kategorien

### Core Infrastructure (Layer 2)
- **MetricsCollector** - Metrics-Sammlung
- **ConsoleLoggerService** - Logging mit Trace-IDs (Self-Configuring via EnvironmentConfig)
- **ModuleHealthService** - Health Checks
- **ObservabilityRegistry** ⭐ NEW - Zentraler Hub für Self-Registration Pattern

### Foundry Adapters (Layer 3)
- **PortSelector** - Version-agnostische Port-Selektion (mit Self-Registration)
- **PortSelectionEventEmitter** ⭐ NEW - Event-Emitter (TRANSIENT)
- **FoundryGameService** - Foundry Game API Wrapper
- **FoundryHooksService** - Foundry Hooks API Wrapper
- **FoundryDocumentService** - Foundry Document API Wrapper
- **FoundryUIService** - Foundry UI API Wrapper
- **FoundrySettingsService** - Foundry Settings API Wrapper
- **FoundryI18nService** - Foundry i18n API Wrapper

### Registrars (Layer 2) ⭐ NEW
- **ModuleSettingsRegistrar** - Settings-Registrierung (DI-managed)
- **ModuleHookRegistrar** - Hook-Registrierung (DI-managed)
- **RenderJournalDirectoryHook** - Spezifischer Hook-Handler

### Business Logic (Layer 4)
- **JournalVisibilityService** - Journal-Verstecken-Logik
- **I18nFacadeService** - i18n Facade (Foundry + Local)
- **FoundryJournalFacade** - Journal-Operations-Facade

### Utilities
- **PerformanceTrackingService** - Performance Tracking
- **RetryService** - Retry-Logik mit Exponential Backoff
- **LocalI18nService** - Foundry-unabhängiges i18n

---

## 📦 Modular Config Structure ⭐ NEW v0.8.0

DI-Konfiguration ist in 7 thematische Module aufgeteilt:

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
│   └── registrars.config.ts           (ModuleSettingsRegistrar, ModuleHookRegistrar)
```

**Neue Services in das passende thematische Modul einfügen!**

---

## 🔧 Häufig genutzte Tokens

### Logging & Metrics
```typescript
import { 
  loggerToken, 
  metricsCollectorToken,
  observabilityRegistryToken,        // ⭐ NEW v0.8.0
  portSelectionEventEmitterToken     // ⭐ NEW v0.8.0
} from "@/tokens/tokenindex";

const logger = container.resolve(loggerToken);
const metrics = container.resolve(metricsCollectorToken);
const observability = container.resolve(observabilityRegistryToken);  // NEW
```

### Foundry Services & Registrars
```typescript
import { 
  foundryGameToken, 
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  moduleSettingsRegistrarToken,      // ⭐ NEW v0.8.0
  moduleHookRegistrarToken,           // ⭐ NEW v0.8.0
  renderJournalDirectoryHookToken     // ⭐ NEW v0.8.0
} from "@/tokens/tokenindex";

const game = container.resolve(foundryGameToken);
const hooks = container.resolve(foundryHooksToken);
```

### Business Services
```typescript
import { 
  journalVisibilityServiceToken,
  i18nFacadeToken 
} from "@/tokens/tokenindex";

const journalService = container.resolve(journalVisibilityServiceToken);
const i18n = container.resolve(i18nFacadeToken);
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

## ⚡ Service-Erstellung Cheat Sheet

### 1. Service-Klasse erstellen
```typescript
// src/services/MyService.ts
export class MyService {
  static dependencies = [loggerToken, metricsCollectorToken] as const;
  
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsCollector
  ) {}
  
  doSomething(): Result<string, Error> {
    this.logger.info("Doing something");
    return ok("Success");
  }
}
```

### 2. Token definieren
```typescript
// src/tokens/tokenindex.ts
export const myServiceToken = createInjectionToken<MyService>("MyService");
```

### 3. Registrieren
```typescript
// src/config/dependencyconfig.ts
container.registerClass(myServiceToken, MyService, ServiceLifecycle.SINGLETON);
```

### 4. Nutzen
```typescript
const myService = container.resolve(myServiceToken);
const result = myService.doSomething();
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

// Logger holen
const logger = api.resolve(api.tokens.loggerToken);
logger.info("Test message");

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
```typescript
import { generateTraceId } from "@/utils/observability/trace";

const traceId = generateTraceId();
const tracedLogger = logger.withTraceId(traceId);

tracedLogger.info("Starting operation");
// [1699876543210-abc123def456] Starting operation

await doSomethingAsync(tracedLogger);  // Pass traced logger down

tracedLogger.info("Operation completed");
// [1699876543210-abc123def456] Operation completed
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
import { ok } from "@/utils/functional/result";

function success(): Result<string, never> {
  return ok("Success!");
}
```

### Error Result
```typescript
import { err } from "@/utils/functional/result";

function failure(): Result<never, string> {
  return err("Something went wrong");
}
```

### Pattern Matching
```typescript
import { match } from "@/utils/functional/result";

const result = doSomething();
match(result, {
  onOk: (value) => console.log("Success:", value),
  onErr: (error) => console.error("Error:", error)
});
```

### Chaining
```typescript
import { andThen, map } from "@/utils/functional/result";

const result = parseNumber("42")
  |> andThen((num) => divide(100, num))
  |> map((result) => result.toFixed(2));
```

### Async Results
```typescript
import { asyncAndThen, fromPromise } from "@/utils/functional/result";

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
| **Logger** | ENV | 2 (Infrastructure) |
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

#### 1. 🔴 Base Class für Foundry Services (HOCH)
- **Warum:** Code-Duplikation eliminieren (~120 Zeilen)
- **Aufwand:** 2-4h
- **Dateien:** `src/foundry/services/*.ts`
- **Breaking Changes:** Minimal (nur Implementation)
- **Status:** ✅ Sofort starten

#### 2. 🔴 Health-Check-Registry (HOCH)
- **Warum:** Container Self-Reference eliminieren, bessere Architektur
- **Aufwand:** 4-6h
- **Dateien:** `src/observability/health/*.ts`, `src/core/module-health-service.ts`
- **Breaking Changes:** ✅ Erlaubt
- **Status:** ✅ Sofort starten (vor 1.0.0!)

#### 3. 🟡 Trace-Context-Manager (MITTEL)
- **Warum:** Developer Experience verbessern
- **Aufwand:** 4-8h
- **Dateien:** `src/observability/trace-context.ts`
- **Breaking Changes:** Minimal (additive API)
- **Status:** ✅ Nächste Iteration

#### 4. 🟡 Retry-Service Legacy API entfernen (MITTEL)
- **Warum:** Type Safety verbessern, API vereinfachen
- **Aufwand:** 1-2h
- **Dateien:** `src/services/RetryService.ts`
- **Breaking Changes:** ✅ Erlaubt
- **Status:** ✅ Nächste Iteration

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
- Base Class für Foundry Services
- Health-Check-Registry

**Sprint 2 (5-10h):**
- Trace-Context-Manager
- Retry-Service Legacy API entfernen

**Sprint 3 (optional, 4-8h):**
- Metrics Persistierung

**Gesamt:** ~15-28h für alle Architektur-Verbesserungen

---

## 📚 Weitere Ressourcen

- **Architektur:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Versioning:** [VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md) ⭐ **NEU**
- **ADRs:** [docs/adr/](./adr/)
- **Testing:** [TESTING.md](./TESTING.md)
- **Configuration:** [CONFIGURATION.md](./CONFIGURATION.md)
- **API:** [API.md](./API.md)

---

**Ende Quick Reference**

