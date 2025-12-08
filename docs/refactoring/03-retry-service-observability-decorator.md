# Refactoring: RetryService - Observability-Decorator

## Kontext

**Quelle**: SRP-Review vom 2024-12-02, Finding 3
**Datei**: `src/infrastructure/retry/RetryService.ts`
**Zeilen**: 103-315

## Problem

`RetryService` vereint drei Verantwortlichkeiten:
1. Retry-Algorithmus (Kern-Funktionalität)
2. Timing-Messung (`performance.now()`)
3. Logging von Retry-Versuchen und Metriken

**SRP-Risiko**: Änderungen an Backoff/Retry-Strategien und an Observability (Logging/Timing) sind unterschiedliche Änderungsgründe.

## Lösung

`RetryObservabilityDecorator` für Timing und Logging, Kern-Service nur für Retry-Algorithmus.

**Architektur**:
```
BaseRetryService (Kern: nur Retry-Algorithmus)
  ↓
RetryObservabilityDecorator (Timing + Logging)
  ↓
RetryService (Wrapper für Kompatibilität)
```

## Refactoring-Schritte

### 1. Kern-Retry-Service extrahieren: `BaseRetryService`

```typescript
// src/infrastructure/retry/BaseRetryService.ts
import type { Result } from "@/domain/types/result";
import { err } from "@/domain/utils/result";

export interface RetryOptions<ErrorType> {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  mapException: (error: unknown, attempt: number) => ErrorType;
}

/**
 * Base retry service without observability concerns.
 * Single Responsibility: Only handles retry algorithm.
 */
export class BaseRetryService {
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: RetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 1;
    const { mapException } = options;

    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    let lastError: ErrorType = mapException("Initial retry error", 0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();

        if (result.ok) {
          return result;
        }

        lastError = result.error;

        if (attempt === maxAttempts) {
          break;
        }

        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        lastError = mapException(error, attempt);

        if (attempt === maxAttempts) {
          break;
        }

        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return err(lastError);
  }

  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    const maxAttempts = options.maxAttempts ?? 3;
    const { mapException } = options;

    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    let lastError: ErrorType = mapException("Initial retry error", 0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = fn();

        if (result.ok) {
          return result;
        }

        lastError = result.error;

        if (attempt === maxAttempts) {
          break;
        }
      } catch (error) {
        lastError = mapException(error, attempt);

        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    return err(lastError);
  }
}
```

### 2. Observability-Decorator erstellen: `RetryObservabilityDecorator`

```typescript
// src/infrastructure/retry/RetryObservabilityDecorator.ts
import { BaseRetryService, type RetryOptions } from "./BaseRetryService";
import type { Result } from "@/domain/types/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";

export interface ObservableRetryOptions<ErrorType> extends RetryOptions<ErrorType> {
  operationName?: string;
}

/**
 * Decorator that adds observability (logging, timing) to retry operations.
 * Single Responsibility: Only handles observability concerns.
 */
export class RetryObservabilityDecorator extends BaseRetryService {
  constructor(private readonly logger: Logger) {
    super();
  }

  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: ObservableRetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    const { operationName, ...baseOptions } = options;
    const startTime = performance.now();

    // Wrap fn to track attempts
    let attemptCount = 0;
    const wrappedFn = async (): Promise<Result<SuccessType, ErrorType>> => {
      attemptCount++;
      const result = await fn();

      if (!result.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
            { error: result.error }
          );
        }
      }

      return result;
    };

    const result = await super.retry(wrappedFn, baseOptions);
    const duration = performance.now() - startTime;

    if (operationName) {
      if (result.ok && attemptCount > 1) {
        this.logger.debug(
          `Retry succeeded for "${operationName}" after ${attemptCount} attempts (${duration.toFixed(2)}ms)`
        );
      } else if (!result.ok) {
        this.logger.warn(
          `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts (${duration.toFixed(2)}ms)`
        );
      }
    }

    return result;
  }

  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<ObservableRetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    const { operationName, ...baseOptions } = options;
    let attemptCount = 0;

    const wrappedFn = (): Result<SuccessType, ErrorType> => {
      attemptCount++;
      const result = fn();

      if (!result.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
            { error: result.error }
          );
        }
      }

      return result;
    };

    const result = super.retrySync(wrappedFn, baseOptions);

    if (operationName && !result.ok) {
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts`
      );
    }

    return result;
  }
}
```

### 3. RetryService als Wrapper

```typescript
// src/infrastructure/retry/RetryService.ts
import { RetryObservabilityDecorator, type ObservableRetryOptions } from "./RetryObservabilityDecorator";
import type { Result } from "@/domain/types/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";

/**
 * Retry service with observability support.
 * Composed from base retry and observability decorator.
 */
export class RetryService extends RetryObservabilityDecorator {
  constructor(logger: Logger) {
    super(logger);
  }

  // ObservableRetryOptions already includes operationName, so API stays compatible
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: ObservableRetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    return super.retry(fn, options);
  }

  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<ObservableRetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    return super.retrySync(fn, options);
  }
}

// DI-Wrapper bleibt unverändert
export class DIRetryService extends RetryService {
  static dependencies = [loggerToken] as const;

  constructor(logger: Logger) {
    super(logger);
  }
}
```

**Hinweis**: Die bestehende `RetryOptions`-Schnittstelle wird zu `ObservableRetryOptions` erweitert. Da `operationName` optional ist, bleibt die API kompatibel.

## Vorteile

- ✅ **Klare Trennung**: Retry-Algorithmus ist isoliert von Observability
- ✅ **Testbarkeit**: `BaseRetryService` kann ohne Logger getestet werden
- ✅ **Flexibilität**: Observability kann optional sein (z.B. für Performance-kritische Pfade)
- ✅ **Wiederverwendbarkeit**: `BaseRetryService` kann ohne Observability genutzt werden

## Test-Strategie

### Unit-Tests für BaseRetryService

```typescript
describe("BaseRetryService", () => {
  it("should retry on failure", async () => {
    const service = new BaseRetryService();
    let attempts = 0;
    const fn = async () => {
      attempts++;
      return attempts === 2 ? ok("success") : err({ code: "FAILED", message: "Error" });
    };

    const result = await service.retry(fn, {
      maxAttempts: 3,
      mapException: (e) => ({ code: "FAILED", message: String(e) }),
    });

    expect(result.ok).toBe(true);
    expect(attempts).toBe(2);
  });
});
```

### Unit-Tests für RetryObservabilityDecorator

```typescript
describe("RetryObservabilityDecorator", () => {
  it("should log retry attempts", async () => {
    const mockLogger = createMockLogger();
    const decorator = new RetryObservabilityDecorator(mockLogger);
    const fn = async () => err({ code: "FAILED", message: "Error" });

    await decorator.retry(fn, {
      maxAttempts: 2,
      operationName: "testOperation",
      mapException: (e) => ({ code: "FAILED", message: String(e) }),
    });

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Retry attempt 1/2 failed"),
      expect.any(Object)
    );
  });

  it("should measure and log duration", async () => {
    const mockLogger = createMockLogger();
    const decorator = new RetryObservabilityDecorator(mockLogger);
    const fn = async () => ok("success");

    await decorator.retry(fn, {
      maxAttempts: 3,
      operationName: "testOperation",
      mapException: (e) => ({ code: "FAILED", message: String(e) }),
    });

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Retry succeeded"),
      expect.any(String)
    );
  });
});
```

## Migration

**Breaking Changes**: Keine - `ObservableRetryOptions` erweitert `RetryOptions` und `operationName` ist optional. Bestehender Code funktioniert weiterhin.

**Schritte**:
1. `BaseRetryService` erstellen
2. `RetryObservabilityDecorator` erstellen
3. `RetryService` refactoren (Wrapper)
4. Tests schreiben/anpassen
5. Bestehende Tests sollten weiterhin funktionieren

**Hinweis**: Falls Code direkt `BaseRetryService` ohne Observability nutzen möchte, kann dies optional gemacht werden (z.B. via DI-Token).

## Verwandte Dateien

- `src/infrastructure/retry/RetryService.ts`
- `src/infrastructure/logging/logger.interface.ts`
- `src/config/modules/utility-services.config.ts` (DI-Konfiguration)

