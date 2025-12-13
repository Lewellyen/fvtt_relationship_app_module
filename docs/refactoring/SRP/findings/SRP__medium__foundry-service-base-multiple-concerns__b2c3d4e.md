---
principle: SRP
severity: medium
confidence: high
component_kind: class
component_name: "FoundryServiceBase"
file: "src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts"
location:
  start_line: 29
  end_line: 166
tags: ["responsibility", "base-class", "multiple-concerns", "foundry"]
---

# Problem

Die `FoundryServiceBase`-Klasse kombiniert drei verschiedene Verantwortlichkeiten in einer Base-Klasse: Lazy Loading von Ports, Retry-Logik für transiente Fehler und Resource Disposal. Während diese Funktionalität für alle Foundry-Services benötigt wird, verletzt die Kombination das Single Responsibility Principle.

## Evidence

```29:166:src/infrastructure/adapters/foundry/services/FoundryServiceBase.ts
export abstract class FoundryServiceBase<TPort> implements Disposable {
  protected port: TPort | null = null;
  protected readonly portSelector: PortSelector;
  protected readonly portRegistry: PortRegistry<TPort>;
  protected readonly retryService: RetryService;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<TPort>,
    retryService: RetryService
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.retryService = retryService;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   */
  protected getPort(adapterName: string): Result<TPort, FoundryError> {
    // Lazy loading logic
  }

  /**
   * Executes a Foundry API operation with automatic retry on transient failures.
   */
  protected withRetry<T>(
    fn: () => Result<T, FoundryError>,
    operationName: string,
    maxAttempts: number = 2
  ): Result<T, FoundryError> {
    // Retry logic
  }

  /**
   * Async variant of withRetry for async operations.
   */
  protected async withRetryAsync<T>(
    fn: () => Promise<Result<T, FoundryError>>,
    operationName: string,
    maxAttempts: number = 2
  ): Promise<Result<T, FoundryError>> {
    // Async retry logic
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    // Disposal logic
  }
}
```

Die Klasse vereint drei verschiedene Verantwortlichkeiten:

1. **Lazy Port Loading** (`getPort()`): Verzögerte Initialisierung und Versionierung von Foundry-Ports
2. **Retry-Logik** (`withRetry()`, `withRetryAsync()`): Behandlung transienter Fehler bei Foundry-API-Aufrufen
3. **Resource Management** (`dispose()`): Cleanup von Port-Ressourcen

## Impact

- **Geringe Kohäsion**: Die Klasse hat mehrere Gründe zur Änderung (neue Retry-Strategie, neues Disposal-Protokoll, neue Port-Loading-Logik)
- **Schwierige Testbarkeit**: Jede Verantwortlichkeit muss einzeln getestet werden, aber sie sind in einer Klasse gekoppelt
- **Reduzierte Wiederverwendbarkeit**: Die Retry-Logik könnte auch für andere Services nützlich sein, ist aber an Foundry-Services gekoppelt
- **Template Method Anti-Pattern**: Obwohl es als Template Method Base Class gedacht ist, mischt es mehrere Concerns

## Recommendation

**Option 1: Composition statt Vererbung (Empfohlen)**

Zerlege die Funktionalität in separate Komponenten, die über Composition verwendet werden:

```typescript
// Port Loading Concern
export class PortLoader<TPort> {
  constructor(
    private readonly portSelector: PortSelector,
    private readonly portRegistry: PortRegistry<TPort>
  ) {}

  loadPort(adapterName: string): Result<TPort, FoundryError> {
    // Lazy loading logic
  }
}

// Retry Decorator/Wrapper
export class RetryableOperation {
  constructor(private readonly retryService: RetryService) {}

  execute<T>(
    fn: () => Result<T, FoundryError>,
    operationName: string,
    maxAttempts: number = 2
  ): Result<T, FoundryError> {
    return this.retryService.retrySync(fn, { maxAttempts, operationName, ... });
  }

  async executeAsync<T>(
    fn: () => Promise<Result<T, FoundryError>>,
    operationName: string,
    maxAttempts: number = 2
  ): Promise<Result<T, FoundryError>> {
    return this.retryService.retry(fn, { maxAttempts, delayMs: 100, operationName, ... });
  }
}

// Verwendung in FoundryGamePort
export class FoundryGamePort implements FoundryGame, Disposable {
  private port: FoundryGame | null = null;
  private readonly portLoader: PortLoader<FoundryGame>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryGame>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntries();
    }, "FoundryGame.getJournalEntries");
  }

  dispose(): void {
    const disposable = castDisposablePort(this.port);
    if (disposable) {
      disposable.dispose();
    }
    this.port = null;
  }
}
```

**Option 2: Mixins (Alternative)**

Verwende TypeScript Mixins für modulare Funktionalität:

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

// Mixin für Port Loading
export function PortLoadingMixin<TPort, TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    protected port: TPort | null = null;
    protected portLoader: PortLoader<TPort>;

    protected getPort(adapterName: string): Result<TPort, FoundryError> {
      // Implementation
    }
  };
}

// Mixin für Retry
export function RetryMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    protected retryable: RetryableOperation;

    protected withRetry<T>(...): Result<T, FoundryError> {
      // Implementation
    }
  };
}

// Verwendung
export class FoundryGamePort extends RetryMixin(
  PortLoadingMixin(DisposableBase)
) implements FoundryGame {
  // Implementation
}
```

**Option 3: Bestehendes Pattern beibehalten mit besserer Dokumentation**

Falls das aktuelle Template Method Pattern beibehalten werden soll, sollte die Dokumentation klären, dass es sich um eine bewusste Designentscheidung handelt:

```typescript
/**
 * Abstract base class providing common functionality for Foundry service wrappers.
 *
 * DESIGN NOTE: This class intentionally combines three concerns:
 * 1. Port Loading: Lazy initialization and version selection
 * 2. Retry Logic: Transient error handling
 * 3. Disposal: Resource cleanup
 *
 * These concerns are combined because:
 * - All Foundry services require all three capabilities
 * - The template method pattern reduces code duplication
 * - Composition would add complexity without significant benefit
 *
 * This is an acceptable SRP violation as per "cohesive responsibilities"
 * - all three concerns work together for a single high-level purpose:
 *   "Providing robust, version-aware Foundry API access"
 */
export abstract class FoundryServiceBase<TPort> implements Disposable {
  // ...
}
```

## Example Fix

**Migrationspfad (Option 1 - Composition):**

1. Neue Komponenten (`PortLoader`, `RetryableOperation`) einführen
2. Eine Foundry-Service-Klasse als Proof-of-Concept umstellen
3. Nach Validierung alle Services schrittweise migrieren
4. `FoundryServiceBase` als deprecated markieren und entfernen

## Notes

- **Aktuelle Verwendung**: Mehrere Services erben von `FoundryServiceBase` (FoundryGamePort, FoundryHooksPort, FoundryDocumentPort, etc.)
- **Abwägung**: Template Method Pattern vs. Composition - beide haben Vor- und Nachteile
- **Komplexität**: Composition könnte für einfache Services als Overhead empfunden werden
- **Konsistenz**: Aktuell gibt es bereits DI-Wrapper-Klassen (DIFoundryGamePort) - die Komposition könnte hier integriert werden

