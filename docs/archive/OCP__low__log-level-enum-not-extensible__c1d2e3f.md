---
principle: OCP
severity: low
confidence: high
component_kind: enum
component_name: "LogLevel"
file: "src/domain/types/log-level.ts"
location:
  start_line: 10
  end_line: 15
tags: ["extensibility", "open-closed", "enum"]
---

# Problem

Das `LogLevel`-Enum ist nicht erweiterbar. Neue Log-Level können nicht hinzugefügt werden, ohne die ursprüngliche Datei zu modifizieren. Dies ist jedoch typisch für Enums und könnte für Domain-Types akzeptabel sein.

## Evidence

```10:15:src/domain/types/log-level.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

Das Enum ist statisch definiert. TypeScript-Enums können zur Laufzeit nicht erweitert werden.

## Impact

- **Nicht erweiterbar**: Neue Log-Level erfordern Modifikation der ursprünglichen Datei
- **Breaking Changes**: Änderungen am Enum betreffen alle Konsumenten
- **Typisch für Enums**: Dies ist das erwartete Verhalten von TypeScript-Enums

## Recommendation

**Option 1: Keine Änderung (Empfohlen)**
Log-Level sind typischerweise eine feste Menge von Werten (DEBUG, INFO, WARN, ERROR). Die Standard-Log-Level sind ausreichend und sollten nicht erweitert werden müssen.

**Option 2: Union Type statt Enum (Falls Erweiterbarkeit nötig)**
Falls Module eigene Log-Level hinzufügen müssen, könnte ein Union Type verwendet werden:

```typescript
export type LogLevel = 0 | 1 | 2 | 3 | 4 | 5; // Erweiterbar

export const StandardLogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export const ExtendedLogLevel = {
  ...StandardLogLevel,
  TRACE: 4,
  FATAL: 5,
} as const;
```

**Option 3: String-Literal Union (Falls Erweiterbarkeit nötig)**
String-basierte Log-Level wären erweiterbarer:

```typescript
export type LogLevel = "debug" | "info" | "warn" | "error";

// Module können erweitern:
export type ExtendedLogLevel = LogLevel | "trace" | "fatal";
```

## Example Fix

Falls Erweiterbarkeit gewünscht wird (nicht empfohlen):

```typescript
// src/domain/types/log-level.ts
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// Module können erweitern:
export const ExtendedLogLevel = {
  ...LogLevel,
  TRACE: 4,
} as const;
```

## Notes

- **Status**: Low Severity, da Log-Level typischerweise eine feste Menge sind
- Die aktuelle Enum-Implementierung ist für Domain-Types angemessen
- Standard-Log-Level (DEBUG, INFO, WARN, ERROR) sind ausreichend
- **Empfehlung**: Keine Änderung erforderlich - Log-Level sollten stabil sein
- Falls in Zukunft mehr Log-Level benötigt werden, kann das Enum erweitert werden, aber dies sollte eine bewusste Domain-Entscheidung sein

