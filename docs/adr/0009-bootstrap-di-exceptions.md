# ADR-0009: Bootstrap DI Exceptions

**Status**: Accepted  
**Datum**: 2025-11-10  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Dependency Injection, Bootstrap-Phase, SOLID-Prinzipien

---

## Kontext und Problemstellung

**Problem**: SOLID-Prinzipien empfehlen Dependency Injection für alle Dependencies. Jedoch gibt es im Bootstrap-Code legitime Ausnahmen wo DI nicht möglich oder praktikabel ist.

**Konkrete Fälle**:

1. **ENV-Import in CompositionRoot**:
   ```typescript
   // src/core/composition-root.ts:43
   const performanceTracker = new BootstrapPerformanceTracker(ENV, null);
   ```
   
   Problem: ENV wird VOR DI-Container-Erstellung benötigt (Chicken-Egg).

2. **console.error in init-solid.ts**:
   ```typescript
   // src/core/init-solid.ts:33
   if (!containerResult.ok) {
     console.error(...); // Logger existiert noch nicht!
   }
   
   // src/core/init-solid.ts:41
   if (!loggerResult.ok) {
     console.error(...); // Logger-Resolution ist fehlgeschlagen!
   }
   ```
   
   Problem: Logger ist nicht verfügbar (Container fehlgeschlagen oder Logger defekt).

3. **BootstrapErrorHandler als statische Klasse**:
   ```typescript
   // src/core/bootstrap-error-handler.ts
   export class BootstrapErrorHandler {
     static logError(error: unknown, context: ErrorContext): void {
       console.group(...);
       console.error(...);
       console.groupEnd();
     }
   }
   ```
   
   Problem: Wird WÄHREND Bootstrap bei Fehlern aufgerufen, Logger noch nicht verfügbar.

**Frage**: Sind diese Ausnahmen vom DIP (Dependency Inversion Principle) legitim?

---

## Betrachtete Optionen

### Option 1: Strikte DI-Regel (keine Ausnahmen)

**Ansatz**: Alle Dependencies müssen injiziert werden.

**Für ENV**:
```typescript
// CompositionRoot müsste ENV als Parameter nehmen
export class CompositionRoot {
  constructor(private env: EnvironmentConfig) {}
  
  bootstrap(): Result<ServiceContainer, string> {
    // Aber wer erstellt CompositionRoot? -> Verschiebt Problem nur
  }
}
```

**Für console.error**:
```typescript
// Fallback-Logger VOR Container-Erstellung?
const fallbackLogger = new ConsoleLoggerService(defaultConfig);
if (!containerResult.ok) {
  fallbackLogger.error(...); // Funktioniert, aber komplexer
}
```

**Nachteile**:
- ❌ Verschiebt Problem (wer erstellt CompositionRoot mit ENV?)
- ❌ Mehr Boilerplate (Fallback-Logger überall)
- ❌ Komplexität ohne klaren Nutzen
- ❌ Bootstrap-Code wird schwerer verständlich

---

### Option 2: Pragmatische Ausnahmen für Bootstrap-Phase

**Ansatz**: DI-Regel gilt NUR nach Container-Validierung, NICHT während Bootstrap.

**Bootstrap-Phase** (vor container.validate()):
- ✅ Direkter ENV-Import erlaubt
- ✅ console.error/console.warn erlaubt
- ✅ Statische Utility-Klassen erlaubt

**Post-Bootstrap-Phase** (nach container.validate()):
- ✅ Strikte DI-Regel
- ❌ Keine direkten Imports
- ❌ Kein console.* (nur via Logger-Service)

**Beispiel**:
```typescript
// BOOTSTRAP: ENV-Import erlaubt
import { ENV } from "@/config/environment";
const tracker = new BootstrapPerformanceTracker(ENV, null); // ✅ OK

// POST-BOOTSTRAP: DI required
class MyService {
  static dependencies = [environmentConfigToken] as const; // ✅ OK
  constructor(private env: EnvironmentConfig) {}
}
```

**Vorteile**:
- ✅ Pragmatisch: Bootstrap hat andere Anforderungen
- ✅ Klar: Phase bestimmt Regel
- ✅ Wartbar: Bootstrap-Code bleibt einfach
- ✅ Testbar: Bootstrap-Code kann ENV mocken via Module-Mocks

---

### Option 3: Fallback-Mechanismus

**Ansatz**: Immer DI nutzen, aber Fallbacks für Bootstrap-Fehler.

```typescript
// ENV via DI, mit Fallback
const envResult = container.resolveWithError(environmentConfigToken);
const env = envResult.ok ? envResult.value : DEFAULT_ENV;

// Logger via DI, mit Fallback
const loggerResult = container.resolveWithError(loggerToken);
const logger = loggerResult.ok ? loggerResult.value : createFallbackLogger();
```

**Problem**:
- ❌ Container existiert noch nicht während Bootstrap
- ❌ Circular: Logger braucht ENV, ENV ist im Container, Container braucht Logger-Fallback

---

## Entscheidung

**Gewählt: Option 2 - Pragmatische Ausnahmen für Bootstrap-Phase**

**Regel**: Dependency Injection ist verpflichtend NACH Container-Validierung.

**Ausnahmen** (nur Bootstrap-Phase):
1. ✅ ENV direkt importieren (Chicken-Egg-Problem)
2. ✅ console.error/warn für Pre-Logger-Fehler (Logger nicht verfügbar)
3. ✅ BootstrapErrorHandler als statische Klasse (wird VOR Logger genutzt)

**Nicht erlaubt** (auch in Bootstrap):
- ❌ Direkte Foundry API-Calls (`game`, `ui`, `Hooks`) → Nur via Ports
- ❌ `new XxxService()` in Business-Logik → Nur via DI
- ❌ Hardcodierte Service-Dependencies → Nur via Injection Tokens

---

## Konsequenzen

### Positiv

- ✅ **Bootstrap bleibt einfach**: Kein komplexer Fallback-Mechanismus
- ✅ **Klar getrennt**: Bootstrap-Phase ≠ Runtime-Phase
- ✅ **Testbar**: Bootstrap-Code kann ENV mocken
- ✅ **Pragmatisch**: Regel wo sinnvoll, Ausnahmen wo nötig
- ✅ **Dokumentiert**: Ausnahmen sind explizit dokumentiert (nicht "vergessen")

### Negativ

- ⚠️ **Inkonsistenz**: Bootstrap nutzt andere Regeln als Runtime
- ⚠️ **Potentielle Verwirrung**: Entwickler müssen Phasen unterscheiden

### Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Ausnahmen werden missbraucht | Niedrig | Mittel | Code-Review, ADR-Verweis in Kommentaren |
| Neue Entwickler verwirrt | Mittel | Niedrig | CONTRIBUTING.md erklärt Bootstrap vs. Runtime |
| ENV-Änderungen brechen Code | Sehr niedrig | Niedrig | ENV ist immutable (Object.freeze) |

---

## Validierung

**Bootstrap-Phase-Code** (Ausnahmen erlaubt):
- `src/core/composition-root.ts` - ENV-Import
- `src/core/init-solid.ts` - console.error für Pre-Logger-Fehler
- `src/core/bootstrap-error-handler.ts` - Statische Klasse mit console-Nutzung

**Runtime-Code** (strikte DI-Regel):
- Alle Services in `src/services/`
- Alle Foundry-Adapter in `src/foundry/`
- Alle Business-Logik in `src/core/hooks/`

**Prüfung**: Code-Review stellt sicher dass Ausnahmen nur in Bootstrap-Dateien vorkommen.

---

## Best Practices

### Bootstrap-Code schreiben

```typescript
// ✅ ERLAUBT: ENV direkt importieren
import { ENV } from "@/config/environment";
const tracker = new BootstrapPerformanceTracker(ENV, null);

// ✅ ERLAUBT: console.error für Pre-Logger-Fehler
if (!containerResult.ok) {
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
  return;
}

// ✅ ERLAUBT: BootstrapErrorHandler (statisch)
BootstrapErrorHandler.logError(error, { phase: "bootstrap" });
```

### Runtime-Code schreiben

```typescript
// ✅ KORREKT: DI für alle Dependencies
class MyService {
  static dependencies = [environmentConfigToken, loggerToken] as const;
  
  constructor(
    private env: EnvironmentConfig,
    private logger: Logger
  ) {}
}

// ❌ VERBOTEN: Direkter ENV-Import in Runtime-Code
import { ENV } from "@/config/environment"; // NICHT in Services!
```

### Wann ist Bootstrap-Phase vorbei?

**Bootstrap-Phase**: Von Modul-Load bis `container.validate()` abgeschlossen
**Runtime-Phase**: Nach `container.validate()` und während Foundry-Hooks

```typescript
// BOOTSTRAP
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap(); // ← ENV-Import hier OK
// ... container.validate() wird in bootstrap() aufgerufen

// RUNTIME (in Foundry init/ready hooks)
Hooks.on("init", () => {
  const logger = container.resolve(loggerToken); // ← DI verwenden
});
```

---

## Beispiele

### ENV-Import (Bootstrap)

```typescript
// src/core/composition-root.ts
import { ENV } from "@/config/environment"; // ✅ OK - Bootstrap-Phase

export class CompositionRoot {
  bootstrap(): Result<ServiceContainer, string> {
    const performanceTracker = new BootstrapPerformanceTracker(ENV, null);
    // ENV wird hier EINMALIG beim Container-Setup genutzt
    // Danach wird ENV via DI bereitgestellt (environmentConfigToken)
  }
}
```

### Pre-Logger console.error (Bootstrap)

```typescript
// src/core/init-solid.ts
const containerResult = root.getContainer();
if (!containerResult.ok) {
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`); // ✅ OK
  BootstrapErrorHandler.logError(containerResult.error, { phase: "bootstrap" }); // ✅ Auch OK
  return;
}

// Logger verfügbar ab hier
const loggerResult = containerResult.value.resolveWithError(loggerToken);
if (loggerResult.ok) {
  const logger = loggerResult.value;
  logger.info("Bootstrap successful"); // ✅ Ab jetzt Logger nutzen
}
```

---

## Alternativen für die Zukunft

Falls Bootstrap-Exceptions problematisch werden:

1. **Two-Phase-Bootstrap**:
   - Phase 1: Minimal-Container (nur ENV, Logger)
   - Phase 2: Full-Container (alle Services)
   
2. **Bootstrap-Logger**:
   - Spezieller Logger der ohne DI funktioniert
   - Wird durch "echten" Logger ersetzt nach Bootstrap

**Aktuell**: Nicht nötig - Ausnahmen sind klar dokumentiert und begrenzt.

---

## Referenzen

- **Bootstrap-Code**: `src/core/composition-root.ts`, `src/core/init-solid.ts`
- **BootstrapErrorHandler**: `src/core/bootstrap-error-handler.ts`
- **CONTRIBUTING.md**: Sollte Bootstrap vs. Runtime Regeln erklären

---

## Verwandte ADRs

- [ADR-0007](0007-clean-architecture-layering.md) - Schichten-Regeln (ENV ist Configuration Layer)
- [ADR-0002](0002-custom-di-container-instead-of-tsyringe.md) - DI-Container Implementation
- [ADR-0008](0008-console-vs-logger-interface.md) - Wann console vs. Logger nutzen

