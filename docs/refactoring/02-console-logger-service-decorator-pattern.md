# Refactoring: ConsoleLoggerService - Decorator-Pattern für Config und Trace

## Kontext

**Quelle**: SRP-Review vom 2024-12-02, Finding 2
**Datei**: `src/infrastructure/logging/ConsoleLoggerService.ts`
**Zeilen**: 13-79

## Problem

`ConsoleLoggerService` vereint drei Verantwortlichkeiten:
1. Console-Logging (Kern-Funktionalität)
2. RuntimeConfig-Subscription für Log-Level
3. Trace-ID-Formatierung

**SRP-Risiko**: Änderungen an Konfigurationsbeobachtung oder Tracing betreffen dieselbe Klasse wie reine Logging-Anpassungen.

## Lösung

Decorator-Pattern nutzen (analog zu `TracedLogger`). Kern-Logger ohne Config/Trace, Decorators für Cross-Cutting-Concerns.

**Architektur**:
```
BaseConsoleLogger (Kern: nur Console-Logging)
  ↓
RuntimeConfigLoggerDecorator (Config-Subscription)
  ↓
TraceContextLoggerDecorator (Trace-Formatierung)
  ↓
ConsoleLoggerService (Komposition)
```

## Refactoring-Schritte

### 1. Kern-Logger extrahieren: `BaseConsoleLogger`

```typescript
// src/infrastructure/logging/BaseConsoleLogger.ts
import { LOG_PREFIX } from "@/application/constants/app-constants";
import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";
import { TracedLogger } from "./TracedLogger"; // Falls vorhanden, sonst inline

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

### 2. Config-Decorator erstellen: `RuntimeConfigLoggerDecorator`

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

### 3. Trace-Decorator erstellen: `TraceContextLoggerDecorator`

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

### 4. ConsoleLoggerService als Komposition

```typescript
// src/infrastructure/logging/ConsoleLoggerService.ts
import { BaseConsoleLogger } from "./BaseConsoleLogger";
import { RuntimeConfigLoggerDecorator } from "./RuntimeConfigLoggerDecorator";
import { TraceContextLoggerDecorator } from "./TraceContextLoggerDecorator";
import type { Logger } from "./logger.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { LogLevel } from "@/domain/types/log-level";

/**
 * Console logger with RuntimeConfig and TraceContext support.
 * Composed from base logger and decorators.
 */
export class ConsoleLoggerService implements Logger {
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

// DI-Wrapper bleibt unverändert
export class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [runtimeConfigToken, traceContextToken] as const;

  constructor(config: RuntimeConfigService, traceContext?: TraceContext) {
    super(config, traceContext);
  }
}
```

## Vorteile

- ✅ **Klare Trennung**: Jeder Decorator hat eine Verantwortlichkeit
- ✅ **Flexibilität**: Decorators können einzeln getestet/ausgetauscht werden
- ✅ **Konsistenz**: Nutzt bereits etabliertes Decorator-Pattern (TracedLogger)
- ✅ **Testbarkeit**: BaseConsoleLogger kann ohne Config/Trace getestet werden
- ✅ **Wiederverwendbarkeit**: Decorators können für andere Logger-Implementierungen genutzt werden

## Test-Strategie

### Unit-Tests für BaseConsoleLogger

```typescript
describe("BaseConsoleLogger", () => {
  it("should write to console with prefix", () => {
    const logger = new BaseConsoleLogger(LogLevel.DEBUG);
    const spy = vi.spyOn(console, "info");

    logger.info("Test message");

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Test message"));
  });
});
```

### Unit-Tests für RuntimeConfigLoggerDecorator

```typescript
describe("RuntimeConfigLoggerDecorator", () => {
  it("should sync log level from RuntimeConfig", () => {
    const mockLogger = createMockLogger();
    const mockConfig = createMockRuntimeConfig({ logLevel: LogLevel.WARN });
    const decorator = new RuntimeConfigLoggerDecorator(mockLogger, mockConfig);

    expect(mockLogger.setMinLevel).toHaveBeenCalledWith(LogLevel.WARN);
  });
});
```

### Unit-Tests für TraceContextLoggerDecorator

```typescript
describe("TraceContextLoggerDecorator", () => {
  it("should add trace ID to messages", () => {
    const mockLogger = createMockLogger();
    const mockTraceContext = createMockTraceContext("trace-123");
    const decorator = new TraceContextLoggerDecorator(mockLogger, mockTraceContext);

    decorator.info("Test");

    expect(mockLogger.info).toHaveBeenCalledWith("[trace-123] Test");
  });
});
```

## Migration

**Breaking Changes**: Keine - externe API bleibt kompatibel. DI-Token bleiben unverändert.

**Schritte**:
1. `BaseConsoleLogger` erstellen
2. `RuntimeConfigLoggerDecorator` erstellen
3. `TraceContextLoggerDecorator` erstellen
4. `ConsoleLoggerService` refactoren (Komposition)
5. Tests schreiben/anpassen
6. Bestehende Tests sollten weiterhin funktionieren

**Hinweis**: `TracedLogger`-Klasse muss möglicherweise angepasst werden, falls sie direkt `ConsoleLoggerService` verwendet.

## Verwandte Dateien

- `src/infrastructure/logging/ConsoleLoggerService.ts`
- `src/infrastructure/logging/logger.interface.ts`
- `src/infrastructure/logging/BootstrapLogger.ts` (möglicherweise anpassen)
- `src/application/services/RuntimeConfigService.ts`
- `src/infrastructure/observability/trace/TraceContext.ts`

