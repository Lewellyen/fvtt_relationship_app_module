# Single Responsibility Principle (SRP) Review

## Scope
Ziel der Analyse ist eine SRP-Bewertung des Moduls. Untersucht wurden exemplarisch Infrastruktur- und Application-Services, die zentrale Aufgaben ausführen oder Cross-Cutting-Concerns bündeln.

## Befunde

### 1) ModuleSettingsRegistrar bündelt Registrierung, RuntimeConfig-Brücke und Fehlerabbildung
- **Mehrfachverantwortung:** `registerAll` orchestriert die Definitionen, `registerDefinition` baut zusätzlich die RuntimeConfig-Synchronisation an und mappt Fehler für Notifications. Änderungen an Settings, RuntimeConfig-Bindings oder Fehlerformaten wirken alle auf diese Klasse. 【F:src/application/services/ModuleSettingsRegistrar.ts†L48-L185】
- **SRP-Risiko:** Registrierung (welche Settings es gibt) und RuntimeConfig-Bridge (wie Werte synchronisiert werden) sind voneinander unabhängige Gründe zur Änderung. Eine separate Komponente für die Bridge würde die Klasse schlanker halten.

### 2) ConsoleLoggerService koppelt Logging, RuntimeConfig-Listener und Trace-Kontext
- **Mehrfachverantwortung:** Die Klasse schreibt Console-Logs, verwaltet aber auch den Log-Level über eine RuntimeConfig-Subscription und kümmert sich um Trace-ID-Formatierung. 【F:src/infrastructure/logging/ConsoleLoggerService.ts†L13-L79】
- **SRP-Risiko:** Änderungen an Konfigurationsbeobachtung oder Tracing betreffen dieselbe Klasse wie reine Logging-Anpassungen. Ein getrenntes Responsibility-Splitting (z. B. Konfigurations-Decorator + Trace-Decorator um einen schlanken Logger-Kern) würde das ändern.

### 3) RetryService vereint Retry-Strategie und Observability-Concerns
- **Mehrfachverantwortung:** Neben dem Retry-Algorithmus übernimmt die Klasse Timing-Messung und Log-Ausgaben für Versuche und Metriken. 【F:src/infrastructure/retry/RetryService.ts†L103-L315】
- **SRP-Risiko:** Änderungen an Backoff/Retry-Strategien und an Observability (Logging/Timing) sind unterschiedliche Änderungsgründe. Ein separater Beobachtungs-/Metrik-Decorator um einen reinen Retry-Kern würde Verantwortlichkeiten trennen.

## Empfehlung
Schrittweises Aufteilen der betroffenen Klassen: je eine Kern-Implementierung mit klarem Verantwortungsbereich und optionale Decorators/Adapter für Konfiguration, Tracing oder Observability. Das reduziert Kopplung, erleichtert Tests und schafft klarere Änderungsgründe.

---

## Bewertung der Analyse

Die Analyse ist **fundiert und korrekt**. Alle drei Befunde identifizieren echte SRP-Verletzungen:

1. ✅ **ModuleSettingsRegistrar**: Die Verantwortlichkeiten sind klar getrennt identifiziert
2. ✅ **ConsoleLoggerService**: Die Kopplung von Logging, Config-Subscription und Trace-Formatierung ist valide
3. ✅ **RetryService**: Die Vermischung von Retry-Logik und Observability ist nachvollziehbar

**Hinweis**: `RuntimeConfigSync` existiert bereits als separate Klasse, aber `ModuleSettingsRegistrar` übernimmt trotzdem noch Fehler-Mapping, was eine weitere Verantwortlichkeit darstellt.

---

## Refactoring-Vorschläge

### Finding 1: ModuleSettingsRegistrar - Fehler-Mapping extrahieren

**Problem**: `registerDefinition` mappt DomainSettingsError zu Notification-Format (Zeilen 169-179). Dies ist eine separate Verantwortlichkeit.

**Lösung**: `SettingRegistrationErrorMapper` als separate Komponente einführen.

**Refactoring-Schritte**:

1. **Neue Klasse erstellen**: `SettingRegistrationErrorMapper`
```typescript
// src/application/services/SettingRegistrationErrorMapper.ts
import type { DomainSettingsError } from "@/domain/types/settings";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";

/**
 * Maps DomainSettingsError to notification format.
 * Single Responsibility: Only handles error format conversion.
 */
export class SettingRegistrationErrorMapper {
  constructor(private readonly notifications: PlatformNotificationPort) {}

  mapAndNotify(
    error: DomainSettingsError,
    settingKey: string
  ): void {
    const notificationError: { code: string; message: string; [key: string]: unknown } = {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    };

    this.notifications.error(`Failed to register ${settingKey} setting`, notificationError, {
      channels: ["ConsoleChannel"],
    });
  }
}
```

2. **ModuleSettingsRegistrar vereinfachen**:
```typescript
// In ModuleSettingsRegistrar.ts
private registerDefinition<TSchema, K extends RuntimeConfigKey>(
  definition: SettingDefinition<TSchema>,
  binding: RuntimeConfigBinding<TSchema, K> | undefined,
  settings: PlatformSettingsRegistrationPort,
  runtimeConfigSync: RuntimeConfigSync,
  errorMapper: SettingRegistrationErrorMapper, // Neu
  i18n: PlatformI18nPort,
  logger: PlatformLoggingPort,
  validator: PlatformValidationPort
): void {
  const config = definition.createConfig(i18n, logger, validator);
  const configWithRuntimeBridge = binding
    ? runtimeConfigSync.attachBinding(config, binding)
    : config;

  const result = settings.registerSetting(
    MODULE_METADATA.ID,
    definition.key,
    configWithRuntimeBridge
  );

  if (!result.ok) {
    errorMapper.mapAndNotify(result.error, definition.key); // Vereinfacht
    return;
  }

  if (binding) {
    runtimeConfigSync.syncInitialValue(settings, binding, definition.key);
  }
}
```

**Vorteile**:
- Klare Trennung: Fehler-Mapping ist isoliert
- Testbarkeit: ErrorMapper kann isoliert getestet werden
- Wiederverwendbarkeit: Kann für andere Settings-Registrierungen genutzt werden

---

### Finding 2: ConsoleLoggerService - Decorator-Pattern für Config und Trace

**Problem**: Die Klasse vereint Console-Logging, RuntimeConfig-Subscription und Trace-Formatierung.

**Lösung**: Decorator-Pattern nutzen (analog zu `TracedLogger`). Kern-Logger ohne Config/Trace, Decorators für Cross-Cutting-Concerns.

**Refactoring-Schritte**:

1. **Kern-Logger extrahieren**: `BaseConsoleLogger` ohne Config/Trace
```typescript
// src/infrastructure/logging/BaseConsoleLogger.ts
import { LOG_PREFIX } from "@/application/constants/app-constants";
import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";

/**
 * Base console logger without configuration or trace concerns.
 * Single Responsibility: Only writes to console.
 */
export class BaseConsoleLogger implements Logger {
  constructor(private minLevel: LogLevel) {}

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    console.log(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return new TracedLogger(this, traceId);
  }
}
```

2. **Config-Decorator erstellen**: `RuntimeConfigLoggerDecorator`
```typescript
// src/infrastructure/logging/RuntimeConfigLoggerDecorator.ts
import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

/**
 * Decorator that syncs log level with RuntimeConfig.
 * Single Responsibility: Only handles RuntimeConfig subscription.
 */
export class RuntimeConfigLoggerDecorator implements Logger {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly baseLogger: Logger,
    private readonly runtimeConfig: RuntimeConfigService
  ) {
    this.syncLogLevel();
  }

  private syncLogLevel(): void {
    this.baseLogger.setMinLevel?.(this.runtimeConfig.get("logLevel"));
    this.unsubscribe?.();
    this.unsubscribe = this.runtimeConfig.onChange("logLevel", (level) => {
      this.baseLogger.setMinLevel?.(level);
    });
  }

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(message, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }

  dispose(): void {
    this.unsubscribe?.();
  }
}
```

3. **Trace-Decorator erstellen**: `TraceContextLoggerDecorator`
```typescript
// src/infrastructure/logging/TraceContextLoggerDecorator.ts
import type { Logger } from "./logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { LogLevel } from "@/domain/types/log-level";

/**
 * Decorator that adds trace context to log messages.
 * Single Responsibility: Only handles trace ID formatting.
 */
export class TraceContextLoggerDecorator implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly traceContext: TraceContext | null
  ) {}

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  private formatWithTrace(message: string): string {
    const traceId = this.traceContext?.getCurrentTraceId();
    return traceId ? `[${traceId}] ${message}` : message;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(this.formatWithTrace(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(this.formatWithTrace(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(this.formatWithTrace(message), ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(this.formatWithTrace(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(this.formatWithTrace(message), ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }
}
```

4. **ConsoleLoggerService als Komposition**:
```typescript
// src/infrastructure/logging/ConsoleLoggerService.ts
import { BaseConsoleLogger } from "./BaseConsoleLogger";
import { RuntimeConfigLoggerDecorator } from "./RuntimeConfigLoggerDecorator";
import { TraceContextLoggerDecorator } from "./TraceContextLoggerDecorator";
import type { Logger } from "./logger.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";

/**
 * Console logger with RuntimeConfig and TraceContext support.
 * Composed from base logger and decorators.
 */
export class ConsoleLoggerService {
  private readonly logger: Logger;

  constructor(config: RuntimeConfigService, traceContext?: TraceContext) {
    const baseLogger = new BaseConsoleLogger(config.get("logLevel"));
    const withConfig = new RuntimeConfigLoggerDecorator(baseLogger, config);
    this.logger = traceContext
      ? new TraceContextLoggerDecorator(withConfig, traceContext)
      : withConfig;
  }

  // Delegate all methods to composed logger
  setMinLevel(level: LogLevel): void {
    this.logger.setMinLevel?.(level);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.logger.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.logger.warn(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.logger.debug(message, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.logger.withTraceId?.(traceId) ?? this.logger;
  }
}
```

**Vorteile**:
- Klare Trennung: Jeder Decorator hat eine Verantwortlichkeit
- Flexibilität: Decorators können einzeln getestet/ausgetauscht werden
- Konsistenz: Nutzt bereits etabliertes Decorator-Pattern (TracedLogger)

---

### Finding 3: RetryService - Observability-Decorator

**Problem**: Retry-Logik, Timing-Messung und Logging sind vermischt.

**Lösung**: `RetryObservabilityDecorator` für Timing und Logging, Kern-Service nur für Retry-Algorithmus.

**Refactoring-Schritte**:

1. **Kern-Retry-Service extrahieren**: `BaseRetryService` ohne Observability
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

2. **Observability-Decorator erstellen**: `RetryObservabilityDecorator`
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

3. **RetryService als Wrapper**:
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
```

**Vorteile**:
- Klare Trennung: Retry-Algorithmus ist isoliert von Observability
- Testbarkeit: BaseRetryService kann ohne Logger getestet werden
- Flexibilität: Observability kann optional sein (z.B. für Performance-kritische Pfade)

---

## Umsetzungsreihenfolge

1. **Finding 1** (ModuleSettingsRegistrar) - Niedrigste Komplexität, klare Extraktion
2. **Finding 3** (RetryService) - Mittlere Komplexität, aber gute Testbarkeit
3. **Finding 2** (ConsoleLoggerService) - Höchste Komplexität, erfordert DI-Anpassungen

**Hinweis**: Alle Refactorings sind **Breaking-Change-frei** für externe APIs, da nur interne Strukturen geändert werden. DI-Token bleiben kompatibel.
