# Logger-Verfügbarkeit: Services & Utilities

Analyse und Empfehlung zur Logger-Verfügbarkeit in Services und Utilities.

## Inhaltsverzeichnis

1. [Aktuelle Situation](#aktuelle-situation)
2. [Analyse: Logger in Services](#analyse-logger-in-services)
3. [Analyse: Logger in Utilities](#analyse-logger-in-utilities)
4. [Pros & Cons](#pros--cons)
5. [Best Practices](#best-practices)
6. [Empfehlung](#empfehlung)
7. [Implementierungsstrategien](#implementierungsstrategien)

---

## Aktuelle Situation

### Services MIT Logger (4 von 11)

| Service | Logger-Nutzung | Grund |
|---------|---------------|-------|
| `JournalVisibilityService` | ✅ | Logging von Fehlern bei Flag-Operationen |
| `FoundryHooksService` | ✅ | Logging von Hook-Registrierung/Disposal |
| `PortSelector` | ✅ | Logging von Port-Selection Errors |
| `ServiceResolver` | ✅ | Logging von Resolution-Failures |

### Services OHNE Logger (7 von 11)

| Service | Logging benötigt? | Aktueller Ansatz |
|---------|-------------------|------------------|
| `ConsoleLoggerService` | N/A (ist der Logger) | Direkt console.* |
| `LocalI18nService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `I18nFacadeService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `FoundryGameService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `FoundryDocumentService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `FoundryUIService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `FoundrySettingsService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `FoundryI18nService` | ⚠️ Könnte nützlich sein | Kein Logging |
| `MetricsCollector` | ❌ Nein | Metrics nur, kein Logging |

### Utilities (0 von 7)

| Utility | Typ | Logging möglich? |
|---------|-----|------------------|
| `error-sanitizer.ts` | Pure Functions | ❌ Nein (stateless) |
| `performance-utils.ts` | Functions mit Params | ⚠️ Via Parameter |
| `promise-timeout.ts` | Pure Functions | ❌ Nein (stateless) |
| `result.ts` | Pure Functions | ❌ Nein (stateless) |
| `retry.ts` | Functions mit Params | ⚠️ Via Parameter |
| `throttle.ts` | Pure Functions | ❌ Nein (stateless) |
| `trace.ts` | Pure Functions | ❌ Nein (stateless) |

### console.* Direkt-Nutzung

**54 Matches in 23 Dateien** - darunter:
- `ConsoleLoggerService` (5) - legitim
- Tests - legitim
- `bootstrap-error-handler.ts` (3) - für Early-Boot Errors
- `module-api.ts` (6) - für API Errors vor Container-Init
- Verschiedene andere Stellen

---

## Analyse: Logger in Services

### Frage: Sollten ALLE Services Logger bekommen?

#### ✅ Vorteile

1. **Einheitliche Observability**
   ```typescript
   // Mit Logger
   class FoundryGameService {
     constructor(
       private readonly portSelector: PortSelector,
       private readonly portRegistry: PortRegistry<FoundryGame>,
       private readonly logger: Logger  // ✅
     ) {}

     getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
       const portResult = this.getPort();
       if (!portResult.ok) {
         this.logger.error("Port selection failed", portResult.error);
         return portResult;
       }
       
       this.logger.debug("Retrieved journal entries", { count: result.length });
       return portResult.value.getJournalEntries();
     }
   }
   ```

2. **Besseres Debugging**
   - Trace-IDs können genutzt werden
   - Zusammenhängende Logs über Service-Grenzen
   - Einfacher zu diagnostizieren bei Production-Issues

3. **Performance-Analyse**
   - Services können Performance-kritische Operationen loggen
   - Hilft bei Optimierung

4. **Fehlerdiagnose**
   - Services können Fehler mit Context loggen
   - Nicht nur Error zurückgeben, sondern auch loggen

5. **Konsistenz**
   - Alle Services haben gleiche Struktur
   - Einfacher zu verstehen für neue Entwickler

#### ❌ Nachteile

1. **Höhere Kopplung**
   ```typescript
   // Jeder Service abhängig von Logger
   static dependencies = [
     portSelectorToken,
     portRegistryToken,
     loggerToken  // ❌ Mehr Dependencies
   ] as const;
   ```

2. **Testing-Komplexität**
   ```typescript
   // Mehr Mocking nötig
   const mockLogger = {
     debug: vi.fn(),
     info: vi.fn(),
     warn: vi.fn(),
     error: vi.fn()
   };
   ```

3. **Performance-Overhead**
   - Jeder Service hat Logger-Reference
   - Mehr Memory (minimal)
   - Mehr DI-Resolution-Zeit (minimal)

4. **Over-Logging-Gefahr**
   - Entwickler loggen zu viel
   - Logs werden unübersichtlich
   - Performance-Impact in Produktion

5. **Nicht immer nötig**
   - Viele Services haben keine komplexe Logik
   - Wrapper-Services (Foundry*) delegieren nur
   - Fehler werden via Result-Pattern zurückgegeben

### Empfehlung für Services: ⚠️ SELEKTIV

**Logger injizieren wenn:**
- ✅ Service hat komplexe Geschäftslogik (JournalVisibilityService)
- ✅ Service verwaltet Resources (FoundryHooksService mit disposal)
- ✅ Service macht kritische Operationen (PortSelector)
- ✅ Service hat Error-Paths die geloggt werden sollten
- ✅ Service braucht Debug-Logs für Entwicklung

**KEIN Logger wenn:**
- ❌ Service ist reiner Wrapper (FoundryGameService)
- ❌ Service delegiert nur (I18nFacadeService)
- ❌ Service ist sehr einfach (LocalI18nService)
- ❌ Errors werden nur via Result zurückgegeben

---

## Analyse: Logger in Utilities

### Frage: Sollten Utilities Logger bekommen?

#### Problem: Utilities sind Stateless Functions

```typescript
// Aktuell: Pure Function
export function withRetry<T>(
  fn: () => Promise<Result<T>>,
  options: RetryOptions
): Promise<Result<T>> {
  // Kein Logger verfügbar
  // Kann nicht loggen wenn Retry fehlschlägt
}

// Mit Logger: Zwei Optionen
```

#### Option 1: Logger als Parameter übergeben

```typescript
export function withRetry<T>(
  fn: () => Promise<Result<T>>,
  options: RetryOptions,
  logger?: Logger  // ⚠️ Optional parameter
): Promise<Result<T>> {
  if (logger) {
    logger.debug(`Retry attempt ${attempt}/${options.maxAttempts}`);
  }
}
```

**Vorteile:**
- ✅ Flexibel - Logger optional
- ✅ Keine Breaking Changes (optional parameter)
- ✅ Utility bleibt testbar

**Nachteile:**
- ❌ Jeder Aufruf muss Logger übergeben
- ❌ Verbose API
- ❌ Logger wird oft vergessen

#### Option 2: Zu Service konvertieren

```typescript
// Aus Utility wird Service
export class RetryService {
  static dependencies = [loggerToken] as const;

  constructor(private readonly logger: Logger) {}

  async retry<T>(
    fn: () => Promise<Result<T>>,
    options: RetryOptions
  ): Promise<Result<T>> {
    this.logger.debug(`Starting retry with ${options.maxAttempts} attempts`);
    // ... retry logic ...
  }
}
```

**Vorteile:**
- ✅ Logger automatisch verfügbar
- ✅ Saubere API
- ✅ Einfach zu nutzen für Service-Consumer

**Nachteile:**
- ❌ Nicht mehr stateless
- ❌ Muss über DI aufgelöst werden
- ❌ Kann nicht mehr als pure function genutzt werden
- ❌ Breaking Change

#### Option 3: Hybridansatz

```typescript
// Utility behält pure function
export function withRetry<T>(...): Promise<Result<T>> { }

// Service-Wrapper für Convenience
export class RetryService {
  static dependencies = [loggerToken] as const;

  constructor(private readonly logger: Logger) {}

  async retry<T>(
    fn: () => Promise<Result<T>>,
    options: RetryOptions
  ): Promise<Result<T>> {
    return withRetry(fn, options, this.logger);  // Delegiert zu Utility
  }
}
```

**Vorteile:**
- ✅ Beide Ansätze verfügbar
- ✅ Pure function für einfache Fälle
- ✅ Service für komplexe Fälle mit Logging

**Nachteile:**
- ❌ Mehr Code zu maintainen
- ❌ Zwei APIs für gleiche Funktionalität

### Empfehlung für Utilities: ❌ KEIN Logger

**Gründe:**
1. **Utilities sollten stateless bleiben**
   - Pure functions sind einfacher zu testen
   - Keine Abhängigkeiten von Services
   - Universell nutzbar

2. **Logger kann als Parameter übergeben werden** (wenn nötig)
   ```typescript
   // Wenn logging wirklich wichtig ist
   export function criticalOperation(
     data: Data,
     logger?: Logger
   ): Result<Output> {
     logger?.debug("Starting operation");
     // ...
   }
   ```

3. **Alternative: Zu Service konvertieren** (wenn Logger essentiell)
   - Nur wenn Logging kritisch ist
   - Beispiel: `retry` könnte `RetryService` werden

---

## Pros & Cons

### Logging überall (All-In Ansatz)

#### ✅ Vorteile
- Vollständige Observability
- Alle Operationen nachvollziehbar
- Debugging sehr einfach
- Trace-IDs durchgängig nutzbar
- Einheitliche Code-Struktur

#### ❌ Nachteile
- Höhere Kopplung aller Services
- Mehr Dependencies zu verwalten
- Testing komplexer (mehr Mocks)
- Over-Logging-Gefahr
- Performance-Overhead (minimal)
- Logger-Fatigue bei Entwicklern

### Selektives Logging (Recommended)

#### ✅ Vorteile
- Logger nur wo nötig
- Geringere Kopplung
- Fokussiertes Logging
- Bessere Test-Performance
- Klare Separation of Concerns

#### ❌ Nachteile
- Inkonsistenz: Manche Services haben Logger, andere nicht
- Entscheidung nötig: "Braucht dieser Service Logger?"
- Möglicherweise fehlende Logs bei Debugging

---

## Best Practices

### 1. Logger-Levels richtig nutzen

```typescript
class MyService {
  constructor(private readonly logger: Logger) {}

  doSomething(): Result<Output> {
    // DEBUG: Entwicklung/Troubleshooting
    this.logger.debug("Starting operation", { input: data });

    // INFO: Wichtige Business-Events
    this.logger.info("Operation completed successfully");

    // WARN: Nicht-kritische Fehler
    this.logger.warn("Fallback used", { reason: error });

    // ERROR: Kritische Fehler
    this.logger.error("Operation failed", error);
  }
}
```

### 2. Structured Logging

```typescript
// ✅ GUTES Logging mit Context
this.logger.error("Port selection failed", {
  foundryVersion: version,
  availableVersions: versions,
  errorCode: error.code
});

// ❌ SCHLECHTES Logging ohne Context
this.logger.error("Port selection failed");
```

### 3. Trace-IDs nutzen

```typescript
class MyService {
  async processWithTrace(data: Data): Promise<Result<Output>> {
    const traceId = generateTraceId();
    const tracedLogger = this.logger.withTraceId(traceId);
    
    tracedLogger.info("Processing started");
    // Alle Logs haben jetzt [traceId]
    const result = await this.doWork(data, tracedLogger);
    tracedLogger.info("Processing completed");
    
    return result;
  }
}
```

### 4. Conditional Logging (Production)

```typescript
class MyService {
  expensiveDebugLog(data: ComplexData): void {
    if (ENV.logLevel <= LogLevel.DEBUG) {
      // Nur berechnen wenn DEBUG-Level aktiv
      const serialized = JSON.stringify(data);
      this.logger.debug("Complex data", { data: serialized });
    }
  }
}
```

### 5. Error-Logging mit Result-Pattern

```typescript
class MyService {
  doOperation(): Result<Output, MyError> {
    const result = this.riskyOperation();
    
    if (!result.ok) {
      // ✅ Fehler loggen UND zurückgeben
      this.logger.error("Operation failed", {
        errorCode: result.error.code,
        errorMessage: result.error.message
      });
      return result;  // Fehler propagiert
    }
    
    return result;
  }
}
```

---

## Empfehlung

### 🎯 Strategie: Selective Logging mit Guidelines

#### Phase 1: Services kategorisieren

**Kategorie A: Logger PFLICHT** ⚡
- Services mit komplexer Geschäftslogik
- Services mit Resource-Management
- Services mit kritischen Operationen
- Infrastructure-Services (DI-Container, etc.)

**Beispiele:**
- ✅ `JournalVisibilityService` (Geschäftslogik)
- ✅ `FoundryHooksService` (Resource-Management)
- ✅ `PortSelector` (Kritische Operation)
- ✅ `ServiceResolver` (Infrastructure)

**Kategorie B: Logger OPTIONAL** ⚠️
- Wrapper-Services ohne eigene Logik
- Einfache Facade-Services
- Services die nur delegieren

**Beispiele:**
- ⚠️ `FoundryGameService` (Wrapper)
- ⚠️ `FoundryDocumentService` (Wrapper)
- ⚠️ `I18nFacadeService` (Facade)

**Logger hinzufügen wenn:**
- Service erweitert wird mit Geschäftslogik
- Debugging-Bedarf entsteht
- Production-Issues auftreten

**Kategorie C: Logger NICHT nötig** ❌
- Sehr einfache Services ohne Logik
- Services die nur Daten halten
- Services die nur transformieren

**Beispiele:**
- ❌ `LocalI18nService` (Einfache Map-Verwaltung)
- ❌ `MetricsCollector` (Hat eigene Metriken)

#### Phase 2: Utilities - Stay Pure

**Empfehlung:** Utilities OHNE Logger, bleiben pure functions

**Ausnahmen** (Utility → Service):
1. `retry.ts` → Optional: `RetryService` (wenn Retry-Logging wichtig wird)
2. `performance-utils.ts` → Optional: `PerformanceTrackingService`

**Hybridansatz möglich:**
```typescript
// Utility: Pure function (für einfache Fälle)
export function withRetry<T>(...): Promise<Result<T>> { }

// Service: Mit Logger (für komplexe Fälle)
export class RetryService {
  constructor(private readonly logger: Logger) {}
  retry<T>(...): Promise<Result<T>> { 
    return withRetry(..., this.logger);
  }
}
```

#### Phase 3: Guidelines etablieren

**Regel 1: Logger-Injection**
```typescript
// ✅ Als letzter Parameter (Convention)
class MyService {
  static dependencies = [
    dependency1Token,
    dependency2Token,
    loggerToken  // Immer als letzter
  ] as const;

  constructor(
    private readonly dep1: Dep1,
    private readonly dep2: Dep2,
    private readonly logger: Logger  // Immer als letzter
  ) {}
}
```

**Regel 2: Logger-Nutzung**
```typescript
// ✅ Fehler loggen UND zurückgeben
if (!result.ok) {
  this.logger.error("Operation failed", result.error);
  return result;  // Nicht throw!
}

// ✅ Wichtige Events loggen
this.logger.info("Resource created", { id, type });

// ⚠️ Debug nur für Development
this.logger.debug("Detailed state", { state });
```

**Regel 3: Kein Direct Console Access**
```typescript
// ❌ NICHT: Direkter console-Aufruf
console.log("Something happened");

// ✅ SONDERN: Logger nutzen
this.logger.info("Something happened");

// ✅ AUSNAHME: Early-Boot Errors (bevor DI läuft)
// bootstrap-error-handler.ts
console.error("Container initialization failed");
```

---

## Implementierungsstrategien

### Strategie 1: Logger zu bestehendem Service hinzufügen

#### Beispiel: FoundryGameService

**Vorher:**
```typescript
export class FoundryGameService implements FoundryGame, Disposable {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken] as const;

  constructor(
    portSelector: PortSelector, 
    portRegistry: PortRegistry<FoundryGame>
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;  // ❌ Kein Logging
    return portResult.value.getJournalEntries();
  }
}
```

**Nachher:**
```typescript
export class FoundryGameService implements FoundryGame, Disposable {
  static dependencies = [
    portSelectorToken, 
    foundryGamePortRegistryToken,
    loggerToken  // ✅ Logger hinzugefügt
  ] as const;

  constructor(
    portSelector: PortSelector, 
    portRegistry: PortRegistry<FoundryGame>,
    private readonly logger: Logger  // ✅ Logger injiziert
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const portResult = this.getPort();
    
    if (!portResult.ok) {
      // ✅ Fehler wird geloggt
      this.logger.error("Failed to get port for journal entries", {
        errorCode: portResult.error.code,
        errorMessage: portResult.error.message
      });
      return portResult;
    }
    
    const result = portResult.value.getJournalEntries();
    
    // ✅ Erfolg wird geloggt (DEBUG level)
    if (result.ok) {
      this.logger.debug("Retrieved journal entries", { 
        count: result.value.length 
      });
    }
    
    return result;
  }
}
```

**Änderungen in `dependencyconfig.ts`:**
```typescript
// KEINE Änderung nötig! 
// Logger wird automatisch via static dependencies injiziert
```

**Testing-Update:**
```typescript
describe('FoundryGameService', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    };
  });

  it('should log error when port selection fails', () => {
    const service = new FoundryGameService(
      mockPortSelector,
      mockPortRegistry,
      mockLogger  // ✅ Mock-Logger übergeben
    );

    const result = service.getJournalEntries();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get port'),
      expect.any(Object)
    );
  });
});
```

### Strategie 2: Utility zu Service konvertieren (Optional)

#### Beispiel: retry → RetryService

**1. Utility behält pure function (Backward Compatibility)**
```typescript
// src/utils/retry.ts - BLEIBT UNVERÄNDERT
export function withRetry<T>(
  fn: () => Promise<Result<T>>,
  options: RetryOptions
): Promise<Result<T>> {
  // ... existing implementation ...
}
```

**2. Neuer Service als Wrapper**
```typescript
// src/services/RetryService.ts - NEU
import { withRetry, type RetryOptions } from '@/utils/retry';
import type { Result } from '@/types/result';
import type { Logger } from '@/interfaces/logger';
import { loggerToken } from '@/tokens/tokenindex';

/**
 * Service wrapper for retry utilities with integrated logging.
 * 
 * Provides retry functionality with automatic logging of attempts and failures.
 * Delegates to utility function for core logic.
 */
export class RetryService {
  static dependencies = [loggerToken] as const;

  constructor(private readonly logger: Logger) {}

  /**
   * Retries an operation with exponential backoff and logging.
   */
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: RetryOptions<ErrorType>,
    operationName?: string
  ): Promise<Result<SuccessType, ErrorType>> {
    const name = operationName || 'Operation';
    const maxAttempts = options.maxAttempts ?? 3;

    this.logger.debug(`${name}: Starting retry (max ${maxAttempts} attempts)`);

    let lastError: ErrorType | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await fn();

      if (result.ok) {
        if (attempt > 1) {
          this.logger.info(`${name}: Succeeded on attempt ${attempt}/${maxAttempts}`);
        }
        return result;
      }

      lastError = result.error;
      
      if (attempt < maxAttempts) {
        this.logger.warn(`${name}: Attempt ${attempt}/${maxAttempts} failed, retrying...`, {
          error: result.error
        });
        // Delay between retries
        const delay = (options.delayMs ?? 100) * Math.pow(attempt, options.backoffFactor ?? 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.logger.error(`${name}: All ${maxAttempts} attempts failed`, { 
      lastError 
    });

    return { ok: false, error: lastError as ErrorType };
  }
}
```

**3. Token registrieren**
```typescript
// src/tokens/tokenindex.ts
export const retryServiceToken = createInjectionToken<RetryService>("RetryService");
```

**4. In Container registrieren**
```typescript
// src/config/dependencyconfig.ts
import { RetryService } from "@/services/RetryService";
import { retryServiceToken } from "@/tokens/tokenindex";

function registerApplicationServices(container: ServiceContainer): Result<void, string> {
  // ... existing registrations ...

  const retryResult = container.registerClass(
    retryServiceToken,
    RetryService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(retryResult)) {
    return err(`Failed to register RetryService: ${retryResult.error.message}`);
  }

  return ok(undefined);
}
```

**5. Nutzung**
```typescript
// Option A: Utility (kein Logging)
import { withRetry } from '@/utils/retry';
const result = await withRetry(operation, { maxAttempts: 3 });

// Option B: Service (mit Logging)
import { retryServiceToken } from '@/tokens/tokenindex';
const retryService = container.resolve(retryServiceToken);
const result = await retryService.retry(
  operation, 
  { maxAttempts: 3 },
  'FetchUserData'  // Operation name für Logs
);
```

### Strategie 3: Optional Logger Parameter (Utilities)

#### Beispiel: performance-utils.ts

```typescript
// src/utils/performance-utils.ts - UPDATE

import type { MetricsCollector } from "@/observability/metrics-collector";
import type { Logger } from "@/interfaces/logger";  // ✅ Neu
import { ENV } from "@/config/environment";

/**
 * Wraps an operation with performance tracking and optional logging.
 */
export function withPerformanceTracking<T>(
  metricsCollector: MetricsCollector | null,
  operation: () => T,
  onComplete?: (duration: number, result: T) => void,
  logger?: Logger  // ✅ Optional logger parameter
): T {
  if (!ENV.enablePerformanceTracking || !metricsCollector?.shouldSample()) {
    return operation();
  }

  const startTime = performance.now();
  
  // ✅ Log start (wenn logger verfügbar)
  logger?.debug("Performance tracking started");
  
  const result = operation();
  const duration = performance.now() - startTime;

  // ✅ Log completion (wenn logger verfügbar)
  logger?.debug(`Performance tracking completed in ${duration.toFixed(2)}ms`);

  if (onComplete) {
    onComplete(duration, result);
  }

  return result;
}
```

**Nutzung:**
```typescript
// Mit Logger
const result = withPerformanceTracking(
  metricsCollector,
  () => expensiveOperation(),
  (duration, result) => { /* ... */ },
  logger  // ✅ Logger übergeben
);

// Ohne Logger (Backward Compatible)
const result = withPerformanceTracking(
  metricsCollector,
  () => expensiveOperation(),
  (duration, result) => { /* ... */ }
  // Kein Logger - funktioniert weiterhin
);
```

---

## Zusammenfassung & Aktionsplan

### Entscheidungsmatrix: Braucht X einen Logger?

| Komponente | Logger? | Grund | Priorität |
|-----------|---------|-------|-----------|
| **Services - Kategorie A** | ✅ JA | Komplexe Logik / Critical Ops | HOCH |
| JournalVisibilityService | ✅ | Bereits vorhanden | - |
| FoundryHooksService | ✅ | Bereits vorhanden | - |
| PortSelector | ✅ | Bereits vorhanden | - |
| ServiceResolver | ✅ | Bereits vorhanden | - |
| **Services - Kategorie B** | ⚠️ OPTIONAL | Wrapper-Services | MITTEL |
| FoundryGameService | ⚠️ | Könnte bei Port-Errors helfen | Mittel |
| FoundryDocumentService | ⚠️ | Könnte bei Flag-Errors helfen | Mittel |
| FoundryUIService | ⚠️ | Könnte bei DOM-Errors helfen | Mittel |
| FoundrySettingsService | ⚠️ | Könnte bei Settings-Errors helfen | Mittel |
| FoundryI18nService | ⚠️ | Könnte bei i18n-Errors helfen | Niedrig |
| I18nFacadeService | ⚠️ | Einfache Delegation | Niedrig |
| **Services - Kategorie C** | ❌ NEIN | Zu einfach / Nicht nötig | - |
| LocalI18nService | ❌ | Einfache Map-Verwaltung | - |
| MetricsCollector | ❌ | Hat eigene Metriken | - |
| **Utilities** | ❌ NEIN | Pure Functions | - |
| Alle Utils | ❌ | Bleiben stateless | - |
| **Ausnahmen** | ⚠️ SERVICE | Zu Service konvertieren | OPTIONAL |
| retry → RetryService | ⚠️ | Falls Retry-Logging wichtig | Optional |
| perf-utils → PerfService | ⚠️ | Falls Performance-Logging wichtig | Optional |

### Aktionsplan

#### Sofort (Priorität HOCH)

1. ✅ **Guideline dokumentieren** - Logger-Nutzungs-Richtlinien (DONE - dieses Dokument)

2. ⚠️ **Console.* Audit durchführen**
   - Alle 54 console.*-Aufrufe prüfen
   - Berechtigt? (Bootstrap, Tests) → OK
   - Unberechtigt? → Zu Logger migrieren

#### Kurzfristig (1-2 Wochen)

3. **Kategorie-B Services evaluieren**
   - Bei Production-Issues: Logger hinzufügen
   - Sonst: Abwarten

4. **Optional: RetryService implementieren**
   - Nur wenn Retry-Logging gebraucht wird
   - Hybridansatz: Utility + Service

#### Mittelfristig (1-2 Monate)

5. **Monitoring & Review**
   - Sind Logs hilfreich?
   - Zu viel Logging?
   - Fehlen wichtige Logs?

6. **Anpassungen**
   - Logger zu Services hinzufügen falls nötig
   - Log-Levels anpassen
   - Structured Logging verbessern

---

## Finale Empfehlung

### 🎯 Best-Practice-Ansatz

**Services:**
- ✅ Logger in Services mit Geschäftslogik / kritischen Operationen
- ⚠️ Später hinzufügen bei Wrapper-Services falls nötig
- ❌ Kein Logger in sehr einfachen Services

**Utilities:**
- ❌ Bleiben pure functions
- ⚠️ Optional: Logger als letzter Parameter (wenn nötig)
- ⚠️ Optional: Service-Wrapper für komplexe Utilities

**Guidelines:**
- Structured Logging nutzen (Context-Objects)
- Logger immer als letzter Dependency
- Fehler loggen UND zurückgeben (nicht throw)
- Trace-IDs nutzen für zusammenhängende Operationen
- Log-Levels richtig nutzen (DEBUG/INFO/WARN/ERROR)

### Nächster Schritt: Entscheidung

**Frage an dich:**
1. Soll ich Logger zu Kategorie-B Services hinzufügen? (FoundryGame, FoundryDocument, etc.)
2. Soll ich RetryService implementieren?
3. Soll ich console.*-Audit durchführen und Migrationsplan erstellen?

