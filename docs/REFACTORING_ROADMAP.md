# Refactoring Roadmap - Version 0.8.0 → 1.0.0

**Model:** Claude Sonnet 4.5  
**Datum:** 2025-11-09  
**Stand:** Version 0.8.0  
**Ziel:** Clean Architecture vor 1.0.0-Release  
**Gesamt-Aufwand:** ~12-20h (Top 4 Refactorings)

**⭐ Update v0.8.0:** Modular Config Structure bereits umgesetzt! (siehe unten)

---

## 🎯 Zielsetzung

**Vor Version 1.0.0 abschließen:**
- ✅ Alle Legacy-Codes eliminieren [[memory:10967923]]
- ✅ Code-Duplikationen beseitigen
- ✅ Architektur-Schwächen beheben
- ✅ Developer Experience verbessern

**Begründung:** Breaking Changes sind in 0.x.x erlaubt - beste Zeit für Refactorings!

---

## 📋 Refactoring-Übersicht

| # | Refactoring | Aufwand | Priorität | Status |
|---|-------------|--------:|-----------|--------|
| 1 | Base Class für Foundry Services | 2-4h | 🔴 HOCH | ⏳ Bereit |
| 2 | Health-Check-Registry | 4-6h | 🔴 HOCH | ⏳ Bereit |
| 3 | Trace-Context-Manager | 4-8h | 🟡 MITTEL | ⏳ Bereit |
| 4 | Retry-Service Legacy API | 1-2h | 🟡 MITTEL | ⏳ Bereit |
| 5 | I18n-Facade Chain-of-Responsibility | 2-4h | 🟢 NIEDRIG | Optional |
| 6 | Metrics Persistierung | 4-8h | 🟢 NIEDRIG | Optional |

**Sprint-Plan:**
- **Sprint 1** (6-10h): Refactorings #1 + #2
- **Sprint 2** (5-10h): Refactorings #3 + #4

---

## Refactoring #1: Base Class für Foundry Services

**Priorität:** 🔴 HOCH  
**Aufwand:** 2-4h  
**Breaking Changes:** Minimal (nur Implementation)

---

### Problem

Alle 6 Foundry Services haben **identischen `getPort()` Code** (~120 Zeilen Duplikation):

```typescript
// FoundryGameService, FoundryHooksService, FoundryDocumentService, etc.
private getPort(): Result<FoundryGame, FoundryError> {
  if (this.port === null) {
    const factories = this.portRegistry.getFactories();
    const portResult = this.portSelector.selectPortFromFactories(
      factories,
      undefined,
      "FoundryGame"
    );
    if (!portResult.ok) return portResult;
    this.port = portResult.value;
  }
  return { ok: true, value: this.port };
}
```

---

### Lösung: Abstract Base Class

```typescript
// src/foundry/services/FoundryServiceBase.ts
export abstract class FoundryServiceBase<T> implements Disposable {
  protected port: T | null = null;
  
  constructor(
    protected readonly portSelector: PortSelector,
    protected readonly portRegistry: PortRegistry<T>,
    protected readonly portName: string
  ) {}
  
  protected getPort(): Result<T, FoundryError> {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        undefined,
        this.portName
      );
      if (!portResult.ok) return portResult;
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  
  dispose(): void {
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      (this.port as unknown as Disposable).dispose();
    }
    this.port = null;
  }
}
```

---

### Migration: FoundryGameService

**Vorher:**
```typescript
export class FoundryGameService implements FoundryGame, Disposable {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken] as const;
  
  private port: FoundryGame | null = null;
  
  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryGame>) {
    // ...
  }
  
  private getPort(): Result<FoundryGame, FoundryError> {
    // 20 Zeilen duplizierter Code
  }
  
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }
  
  dispose(): void {
    // Dispose-Logik
  }
}
```

**Nachher:**
```typescript
export class FoundryGameService extends FoundryServiceBase<FoundryGame> implements FoundryGame {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken] as const;
  
  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryGame>) {
    super(portSelector, portRegistry, "FoundryGame");
  }
  
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const portResult = this.getPort();  // ✅ Von Base Class
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }
  
  // ✅ dispose() von Base Class geerbt
}
```

---

### Task-Breakdown

#### Task 1.1: Base Class erstellen (1h)
- [ ] `src/foundry/services/FoundryServiceBase.ts` erstellen
- [ ] `getPort()` implementieren (Template Method Pattern)
- [ ] `dispose()` implementieren
- [ ] Generics `<T>` für Port-Type
- [ ] JSDoc-Dokumentation

#### Task 1.2: Services migrieren (1-2h)
- [ ] FoundryGameService → extends FoundryServiceBase
- [ ] FoundryHooksService → extends FoundryServiceBase
- [ ] FoundryDocumentService → extends FoundryServiceBase
- [ ] FoundryUIService → extends FoundryServiceBase
- [ ] FoundrySettingsService → extends FoundryServiceBase
- [ ] FoundryI18nService → extends FoundryServiceBase

#### Task 1.3: Tests aktualisieren (0.5-1h)
- [ ] Base Class Tests schreiben
- [ ] Service Tests prüfen (sollten weiterhin grün sein)
- [ ] Integration Tests validieren

**Acceptance Criteria:**
- [ ] Alle 6 Services nutzen Base Class
- [ ] Keine Code-Duplikation mehr
- [ ] Alle Tests grün
- [ ] Type-Check erfolgreich

---

## Refactoring #2: Health-Check-Registry

**Priorität:** 🔴 HOCH  
**Aufwand:** 4-6h  
**Breaking Changes:** ✅ Erlaubt (Pre-Release)

---

### Problem

`ModuleHealthService` hat **Container Self-Reference** (Tight Coupling):

```typescript
class ModuleHealthService {
  constructor(
    private container: ServiceContainer,  // ❌ Tight Coupling
    private metrics: MetricsCollector
  ) {}
  
  getHealth(): HealthStatus {
    // Nutzt Container direkt
    const validation = this.container.validate();
    // Könnte theoretisch auch andere Services resolven (Service Locator Anti-Pattern)
  }
}
```

---

### Lösung: Health-Check-Registry (Decoupling)

```typescript
// src/observability/health/HealthCheckRegistry.ts
export interface HealthCheck {
  name: string;
  check: () => boolean | Promise<boolean>;
  metadata?: Record<string, unknown>;
}

export class HealthCheckRegistry {
  static dependencies = [] as const;
  private checks = new Map<string, HealthCheck>();
  
  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }
  
  async runAll(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map();
    for (const [name, check] of this.checks) {
      try {
        const healthy = await Promise.resolve(check.check());
        results.set(name, { healthy, metadata: check.metadata });
      } catch (error) {
        results.set(name, { healthy: false, error: String(error) });
      }
    }
    return results;
  }
}
```

```typescript
// ModuleHealthService (refactored)
export class ModuleHealthService {
  static dependencies = [healthCheckRegistryToken, metricsCollectorToken] as const;
  
  constructor(
    private registry: HealthCheckRegistry,  // ✅ Loose Coupling
    private metrics: MetricsCollector
  ) {}
  
  async getHealth(): Promise<HealthStatus> {
    const results = await this.registry.runAll();
    const healthy = Array.from(results.values()).every(r => r.healthy);
    
    return {
      status: healthy ? "healthy" : "unhealthy",
      checks: Object.fromEntries(results),
      timestamp: new Date().toISOString()
    };
  }
}
```

---

### Task-Breakdown

#### Task 2.1: Health-Check-Registry implementieren (2h)
- [ ] `src/observability/health/HealthCheckRegistry.ts` erstellen
- [ ] `HealthCheck` Interface definieren
- [ ] `register()` Method implementieren
- [ ] `runAll()` Method implementieren (async, error-safe)
- [ ] Token definieren (`healthCheckRegistryToken`)
- [ ] Tests schreiben

#### Task 2.2: ModuleHealthService refactoren (1h)
- [ ] Constructor: Container → HealthCheckRegistry
- [ ] `getHealth()` nutzt `registry.runAll()`
- [ ] Async Support hinzufügen
- [ ] Dependencies aktualisieren
- [ ] Tests aktualisieren

#### Task 2.3: Health-Checks registrieren (1-2h)
- [ ] Container Validation Check
- [ ] Port Selection Check
- [ ] Foundry Availability Check
- [ ] Metrics Collector Check
- [ ] In `dependencyconfig.ts` registrieren

#### Task 2.4: Integration & Tests (1h)
- [ ] Integration Tests für alle Checks
- [ ] API-Tests aktualisieren (`api.getHealth()`)
- [ ] Manual Testing in Foundry Console

**Acceptance Criteria:**
- [ ] Keine Container-Reference in ModuleHealthService
- [ ] 4+ Health-Checks registriert
- [ ] Alle Tests grün
- [ ] API backward compatible (rückgabewert gleich)

---

## Refactoring #3: Trace-Context-Manager

**Priorität:** 🟡 MITTEL  
**Aufwand:** 4-8h  
**Breaking Changes:** Minimal (additive API)

---

### Problem

Trace-IDs müssen **manuell** generiert und propagiert werden:

```typescript
import { generateTraceId } from "@/utils/observability/trace";

// ❌ Manuell in jedem Service
const traceId = generateTraceId();
const tracedLogger = logger.withTraceId(traceId);

tracedLogger.info("Starting operation");
await doSomething(tracedLogger);  // Trace-ID manuell weitergeben
tracedLogger.info("Operation completed");
```

---

### Lösung: Trace-Context-Manager (Auto-Propagation)

```typescript
// src/observability/trace/TraceContext.ts
export class TraceContext {
  static dependencies = [loggerToken] as const;
  private currentTraceId: string | null = null;
  
  constructor(private logger: Logger) {}
  
  /**
   * Executes function with auto-generated trace ID.
   * Trace ID is automatically available to all nested calls.
   */
  trace<T>(fn: () => T, traceIdOrOptions?: string | TraceOptions): T {
    const traceId = typeof traceIdOrOptions === "string" 
      ? traceIdOrOptions 
      : generateTraceId();
    
    const previousTraceId = this.currentTraceId;
    this.currentTraceId = traceId;
    
    const tracedLogger = this.logger.withTraceId(traceId);
    
    try {
      return fn();
    } finally {
      this.currentTraceId = previousTraceId;
    }
  }
  
  /**
   * Gets current trace ID (if in traced context).
   */
  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }
}
```

**Usage:**
```typescript
// ✅ Auto-Trace-ID
traceContext.trace(() => {
  logger.info("Starting");  // Automatisch traced!
  doSomething();  // Nested calls sehen Trace-ID
  logger.info("Completed");  // Gleiche Trace-ID
});
```

---

### Task-Breakdown

#### Task 3.1: TraceContext implementieren (2-3h)
- [ ] `src/observability/trace/TraceContext.ts` erstellen
- [ ] `trace()` Method (sync)
- [ ] `traceAsync()` Method (async)
- [ ] `getCurrentTraceId()` Method
- [ ] Token definieren
- [ ] Tests schreiben

#### Task 3.2: Logger-Integration (1-2h)
- [ ] Logger kann TraceContext nutzen
- [ ] Optional: `logger.trace(() => ...)` Method
- [ ] Backward compatible (withTraceId bleibt)

#### Task 3.3: Services migrieren (1-2h)
- [ ] Kritische Services zu TraceContext migrieren
- [ ] RetryService, PerformanceTrackingService
- [ ] Beispiele in Dokumentation

#### Task 3.4: Tests & Dokumentation (1h)
- [ ] Integration Tests
- [ ] Dokumentation aktualisieren
- [ ] QUICK_REFERENCE.md: TraceContext-Beispiele

**Acceptance Criteria:**
- [ ] TraceContext Service funktioniert
- [ ] Auto-Trace-ID-Propagation
- [ ] Backward compatible (alte `withTraceId()` API bleibt)
- [ ] Dokumentation aktualisiert

---

## Refactoring #4: Retry-Service Legacy API entfernen

**Priorität:** 🟡 MITTEL  
**Aufwand:** 1-2h  
**Breaking Changes:** ✅ Erlaubt (Pre-Release)

---

### Problem

RetryService hat **zwei Signaturen** (Legacy + Modern):

```typescript
// Legacy (deprecated)
await retry(fn, 3, 100);

// Modern
await retry(fn, { maxAttempts: 3, delayMs: 100 });
```

**Impact:**
- Union Types `| number` reduzieren Type Safety
- Komplexere Implementation
- Verwirrende API

---

### Lösung: Legacy API entfernen

**Nur noch Options-Object:**

```typescript
export class RetryService {
  async retry<T, E>(
    fn: () => Promise<Result<T, E>>,
    options: RetryOptions<E>  // ✅ Nur noch Options-Object
  ): Promise<Result<T, E>> {
    // Simplified implementation (keine Legacy-Handling)
    const opts = {
      maxAttempts: options.maxAttempts ?? 3,
      delayMs: options.delayMs ?? 100,
      backoffFactor: options.backoffFactor ?? 1,
      mapException: options.mapException ?? ((e: unknown) => e as E),
      operationName: options.operationName
    };
    
    // ... retry logic
  }
  
  // retrySync() analog
}
```

---

### Task-Breakdown

#### Task 4.1: Legacy-Signatur entfernen (30min)
- [ ] Entferne Union-Type `| number` aus Signatur
- [ ] Entferne Legacy-Handling-Code
- [ ] Simplify Implementation

#### Task 4.2: Call-Sites migrieren (30min)
- [ ] Suche alle `retry()` Calls
- [ ] Migriere zu Options-Object
- [ ] Prüfe mit TypeScript-Compiler

```bash
# Finde alle Nutzungen
npm run type-check  # Zeigt Fehler bei Legacy-Calls
```

#### Task 4.3: Tests aktualisieren (30min)
- [ ] Entferne Legacy-API-Tests
- [ ] Aktualisiere Test-Calls zu Options-Object
- [ ] Validiere alle Tests grün

**Acceptance Criteria:**
- [ ] Nur noch Options-Object-Signatur
- [ ] Keine Union-Types mehr
- [ ] Alle Call-Sites migriert
- [ ] Alle Tests grün
- [ ] Type-Check erfolgreich

---

## Refactoring #5: I18n-Facade Chain-of-Responsibility

**Priorität:** 🟢 NIEDRIG (Optional)  
**Aufwand:** 2-4h  
**Breaking Changes:** Keine

---

### Problem

`I18nFacadeService` hat **duplizierte Fallback-Logik**:

```typescript
// In translate()
const foundryResult = this.foundryI18n.localize(key);
if (foundryResult.ok && foundryResult.value !== key) return foundryResult.value;
const localResult = this.localI18n.translate(key);
if (localResult.ok && localResult.value !== key) return localResult.value;
return fallback ?? key;

// In format() - gleiche Logik!
const foundryResult = this.foundryI18n.format(key, data);
if (foundryResult.ok && foundryResult.value !== key) return foundryResult.value;
const localResult = this.localI18n.format(key, data);
if (localResult.ok && localResult.value !== key) return localResult.value;
return fallback ?? key;
```

---

### Lösung: Chain-of-Responsibility-Pattern

```typescript
private tryTranslate(
  key: string,
  foundryFn: (key: string) => Result<string, unknown>,
  localFn: (key: string) => Result<string, unknown>,
  fallback?: string
): string {
  // 1. Try Foundry
  const foundryResult = foundryFn(key);
  if (foundryResult.ok && foundryResult.value !== key) return foundryResult.value;
  
  // 2. Try Local
  const localResult = localFn(key);
  if (localResult.ok && localResult.value !== key) return localResult.value;
  
  // 3. Fallback
  return fallback ?? key;
}

translate(key: string, fallback?: string): string {
  return this.tryTranslate(
    key,
    (k) => this.foundryI18n.localize(k),
    (k) => this.localI18n.translate(k),
    fallback
  );
}

format(key: string, data: Record<string, unknown>, fallback?: string): string {
  return this.tryTranslate(
    key,
    (k) => this.foundryI18n.format(k, data),
    (k) => this.localI18n.format(k, data),
    fallback
  );
}
```

---

### Task-Breakdown

#### Task 5.1: Helper-Method erstellen (1h)
- [ ] `tryTranslate()` Private Helper
- [ ] Generische Fallback-Chain
- [ ] Tests

#### Task 5.2: Methoden refactoren (1h)
- [ ] `translate()` nutzt tryTranslate
- [ ] `format()` nutzt tryTranslate
- [ ] `has()` nutzt tryTranslate (optional)

#### Task 5.3: Tests & Validation (1h)
- [ ] Existing Tests sollten grün bleiben
- [ ] Coverage prüfen
- [ ] Edge-Cases testen

**Acceptance Criteria:**
- [ ] Keine Code-Duplikation
- [ ] Alle Tests grün
- [ ] API backward compatible

---

## Refactoring #6: Metrics Persistierung

**Priorität:** 🟢 NIEDRIG (Optional)  
**Aufwand:** 4-8h  
**Breaking Changes:** Keine (additive)

---

### Problem

Metrics gehen bei **Browser-Reload verloren** (nur In-Memory):

```typescript
// Metrics sind in RAM
private metrics = {
  containerResolutions: 0,
  resolutionErrors: 0,
  // ...
};
```

---

### Lösung: LocalStorage/IndexedDB Persistierung

```typescript
export class PersistentMetricsCollector extends MetricsCollector {
  constructor(env: EnvironmentConfig, private storage: MetricsStorage) {
    super(env);
    this.loadFromStorage();
  }
  
  recordResolution(token: InjectionToken, duration: number, success: boolean): void {
    super.recordResolution(token, duration, success);
    this.saveToStorage();  // Auto-persist
  }
  
  private saveToStorage(): void {
    const snapshot = this.getSnapshot();
    this.storage.save(snapshot);
  }
  
  private loadFromStorage(): void {
    const snapshot = this.storage.load();
    if (snapshot) {
      this.restoreFromSnapshot(snapshot);
    }
  }
}
```

---

### Task-Breakdown

#### Task 6.1: MetricsStorage Interface (1-2h)
- [ ] Interface definieren
- [ ] LocalStorage-Implementation
- [ ] IndexedDB-Implementation (optional)
- [ ] Tests

#### Task 6.2: PersistentMetricsCollector (2-3h)
- [ ] Extends MetricsCollector
- [ ] Auto-Persist bei recordXXX()
- [ ] Load on Construction
- [ ] Export/Import Methods

#### Task 6.3: Integration (1-2h)
- [ ] Option in ENV: `enableMetricsPersistence`
- [ ] Factory in dependencyconfig.ts
- [ ] Tests

#### Task 6.4: UI (optional, 1h)
- [ ] Metrics Export Button
- [ ] Metrics Clear Button
- [ ] Metrics Dashboard (Foundry UI)

**Acceptance Criteria:**
- [ ] Metrics überleben Browser-Reload
- [ ] Export/Import funktioniert
- [ ] Performance-Impact minimal
- [ ] Backward compatible

---

## 📅 Zeitplan & Dependencies

### Sprint 1: Woche 1 (6-10h)

**Tag 1-2: Refactoring #1 - Base Class (2-4h)**
- Keine Dependencies
- Sofort startbar

**Tag 3-4: Refactoring #2 - Health-Check-Registry (4-6h)**
- Keine Dependencies
- Sofort startbar nach #1

**Milestone:** Clean Architecture für Foundry Services + Health-Checks

---

### Sprint 2: Woche 2 (5-10h)

**Tag 1-2: Refactoring #3 - Trace-Context-Manager (4-8h)**
- Keine Dependencies
- Kann parallel zu anderen laufen

**Tag 3: Refactoring #4 - Retry Legacy API (1-2h)**
- Keine Dependencies
- Quick Win

**Milestone:** Developer Experience verbessert

---

### Optional: Sprint 3 (6-12h)

**Refactoring #5 - I18n-Facade (2-4h)**
- Keine Dependencies

**Refactoring #6 - Metrics Persistierung (4-8h)**
- Keine Dependencies

**Milestone:** Nice-to-Have Features

---

## 🧪 Test-Strategie

### Pro Refactoring

**1. Unit Tests:**
- [ ] Neue Komponenten (Base Class, Registry, etc.)
- [ ] Refactored Components
- [ ] Edge Cases

**2. Integration Tests:**
- [ ] Service-Interaktionen
- [ ] DI-Container-Integration
- [ ] Foundry-Integration (falls relevant)

**3. Regression Tests:**
- [ ] Bestehende Tests müssen grün bleiben
- [ ] Keine unerwarteten Breaking Changes

**4. Manual Testing:**
- [ ] Foundry Console Testing
- [ ] API-Calls testen
- [ ] Health-Check-Calls testen

---

## 📊 Risiko-Analyse

| Refactoring | Risiko | Mitigation |
|-------------|--------|------------|
| #1 Base Class | 🟢 NIEDRIG | Nur Implementation, Tests validieren Verhalten |
| #2 Health-Check-Registry | 🟡 MITTEL | Breaking Change, aber Pre-Release OK |
| #3 Trace-Context | 🟢 NIEDRIG | Additive API, backward compatible |
| #4 Retry Legacy API | 🟡 MITTEL | Breaking Change, TypeScript findet alle Call-Sites |
| #5 I18n-Facade | 🟢 NIEDRIG | Nur Implementation |
| #6 Metrics Persistierung | 🟢 NIEDRIG | Additive Feature |

---

## ✅ Completion Criteria (vor 1.0.0)

### Must-Have (Top 4)
- [ ] Refactoring #1: Base Class ✅
- [ ] Refactoring #2: Health-Check-Registry ✅
- [ ] Refactoring #3: Trace-Context-Manager ✅
- [ ] Refactoring #4: Retry Legacy API ✅

### Nice-to-Have
- [ ] Refactoring #5: I18n-Facade (optional)
- [ ] Refactoring #6: Metrics Persistierung (optional)

### Quality Gates
- [ ] Alle Tests grün (100% der bisherigen Tests)
- [ ] Type-Check erfolgreich (0 Errors)
- [ ] Lint erfolgreich (0 Errors)
- [ ] Coverage ≥ bisheriges Level
- [ ] Manual Testing in Foundry erfolgreich

### Dokumentation
- [ ] CHANGELOG.md aktualisiert
- [ ] PROJECT_ANALYSIS.md aktualisiert
- [ ] QUICK_REFERENCE.md aktualisiert
- [ ] Neue ADRs für signifikante Änderungen

---

## 🔗 Siehe auch

- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) → Detaillierte Analyse
- [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) → Dependencies & Impact
- [VERSIONING_STRATEGY.md](./VERSIONING_STRATEGY.md) → Breaking Change Rules
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Developer Reference

---

**Status:** 📋 Roadmap fertig - Bereit für Implementierung  
**Nächster Schritt:** Nach GitHub-Sync → Sprint 1 starten

---

**Ende Refactoring Roadmap**

