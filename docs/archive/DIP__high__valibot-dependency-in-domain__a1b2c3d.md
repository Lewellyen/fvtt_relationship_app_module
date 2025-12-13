---
principle: DIP
severity: high
confidence: high
component_kind: type
component_name: "LOG_LEVEL_SCHEMA"
file: "src/domain/types/log-level.ts"
location:
  start_line: 1
  end_line: 29
tags: ["dependency", "layering", "infrastructure-leak"]
---

# Problem

Die Domain-Layer-Datei `src/domain/types/log-level.ts` importiert direkt die Infrastructure-Bibliothek `valibot`. Dies verletzt das Dependency Inversion Principle, da der Domain-Layer nicht von konkreten Infrastructure-Implementierungen abhängen sollte.

## Evidence

```1:29:src/domain/types/log-level.ts
import * as v from "valibot";

/**
 * Log level enumeration for controlling logging verbosity.
 * Lower numeric values = more verbose.
 *
 * This is a domain type representing the business concept of log levels.
 * It is used across all layers of the application.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Schema for LogLevel setting values.
 * Validates that value is one of the defined LogLevel enum values.
 *
 * This schema is used for runtime validation of log level values.
 * It is defined in the domain layer but uses valibot for validation.
 */
export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);
```

Die Datei importiert `valibot` direkt (Zeile 1) und verwendet es zur Erstellung eines Schemas (Zeile 24).

## Impact

- **Layer-Verletzung**: Der Domain-Layer hängt von einer Infrastructure-Bibliothek ab
- **Tight Coupling**: Änderungen an der Validierungsbibliothek betreffen den Domain-Layer
- **Testbarkeit**: Domain-Types sind schwerer zu testen ohne valibot-Abhängigkeit
- **Portabilität**: Der Domain-Layer kann nicht einfach auf andere Validierungsbibliotheken umgestellt werden

## Recommendation

1. **Schema in Infrastructure verschieben**: Das `LOG_LEVEL_SCHEMA` sollte in den Infrastructure-Layer verschoben werden (z.B. `src/infrastructure/validation/log-level-schema.ts`)

2. **Alternative: Abstraktion**: Falls das Schema im Domain-Layer bleiben soll, sollte eine Abstraktion für Validierungsschemas eingeführt werden:
   - Domain definiert nur den `LogLevel` enum
   - Infrastructure erstellt das valibot-Schema basierend auf dem enum
   - Application-Layer verwendet das Schema aus Infrastructure

3. **Type-only Import prüfen**: Falls nur Types benötigt werden, könnte `import type` verwendet werden, aber das löst das Problem nicht vollständig, da `v.picklist()` eine Runtime-Funktion ist.

## Example Fix

**Option 1: Schema nach Infrastructure verschieben**

```typescript
// src/domain/types/log-level.ts (nur enum, kein valibot)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

```typescript
// src/infrastructure/validation/log-level-schema.ts
import * as v from "valibot";
import { LogLevel } from "@/domain/types/log-level";

export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);
```

**Option 2: Abstraktion für Validierung**

```typescript
// src/domain/types/validation-schema.interface.ts
export interface ValidationSchema<T> {
  validate(value: unknown): value is T;
}

// src/infrastructure/validation/log-level-schema.ts
import { ValidationSchema } from "@/domain/types/validation-schema.interface";
import { LogLevel } from "@/domain/types/log-level";
import * as v from "valibot";

export const LOG_LEVEL_SCHEMA: ValidationSchema<LogLevel> = {
  validate: (value: unknown): value is LogLevel => {
    const schema = v.picklist([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]);
    const result = v.safeParse(schema, value);
    return result.success;
  }
};
```

## Notes

- Laut ADR-0004 wurde valibot für Input-Validation gewählt, aber das Schema sollte nicht im Domain-Layer definiert werden
- Die Dokumentation in Zeile 22-23 erkennt das Problem bereits an ("It is defined in the domain layer but uses valibot for validation")
- Dies ist ein klarer Verstoß gegen die Clean Architecture-Regel, dass der Domain-Layer keine Abhängigkeiten zu äußeren Layern haben sollte

