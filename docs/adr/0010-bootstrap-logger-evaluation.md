# ADR-0010: Bootstrap-Logger Evaluation

**Status**: Proposed (Not Implemented)  
**Datum**: 2025-11-10  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Bootstrap-Phase, Logging, SOLID-Prinzipien

---

## Kontext und Problemstellung

**Aktueller Stand (v0.11.x)**:
- Pre-Logger Errors nutzen `console.error` (dokumentiert in ADR-0009)
- BootstrapErrorHandler nutzt `console.group/error` für strukturierte Fehler
- Nach Container-Init: Echter Logger verfügbar

**Problem**: Inkonsistente Logging-Mechanismen (console vs Logger-Interface).

**Frage**: Sollten wir einen Bootstrap-Logger einführen?

---

## Betrachtete Optionen

### Option A: Bootstrap-Logger mit Buffer + Replay

**Konzept**: Logger der Logs buffert und später an echten Logger weiterleitet.

**Implementation**:
```typescript
export class BootstrapLogger implements Logger {
  private buffer: LogEntry[] = [];
  private realLogger: Logger | null = null;

  debug(msg: string, ctx?: unknown): void {
    this.logOrBuffer('debug', msg, ctx);
  }

  private logOrBuffer(level: string, msg: string, ctx?: unknown): void {
    if (this.realLogger) {
      this.realLogger[level](msg, ctx);
    } else {
      this.buffer.push({ level, message: msg, context: ctx, timestamp: Date.now() });
    }
  }

  attachRealLogger(logger: Logger): void {
    this.realLogger = logger;
    this.buffer.forEach(entry => this.realLogger![entry.level](entry.message, entry.context));
    this.buffer = [];
  }
}
```

**Vorteile**:
- ✅ Konsistentes Logger-Interface überall
- ✅ Kein Log-Verlust (Buffer wird replayed)
- ✅ Testbar
- ✅ Kein console.* mehr nötig

**Nachteile**:
- ❌ Zusätzliche Komplexität
- ❌ Memory-Overhead (Buffer)
- ❌ Timestamps sind ungenau (Buffered Logs)
- ❌ Wer erstellt BootstrapLogger? (wieder außerhalb DI)

---

### Option B: Aktueller Ansatz (console.* in Bootstrap)

**Status**: Bereits implementiert und dokumentiert (ADR-0009).

**Vorteile**:
- ✅ Einfach und explizit
- ✅ Folgt Standard-Conventions (npm, Node.js)
- ✅ Performant
- ✅ Gut dokumentiert

**Nachteile**:
- ⚠️ Inkonsistenz (console vs Logger)
- ⚠️ Pre-Logger Logs nicht im Haupt-Log-Stream

---

## Entscheidung

**Gewählt: Option B - Aktueller Ansatz beibehalten**

**Für v0.x.x (Pre-Release)**:
- Bootstrap-Logger bringt mehr Komplexität als Nutzen
- Aktuelle Lösung ist pragmatisch und gut dokumentiert
- YAGNI: Keine konkreten Use-Cases die Bootstrap-Logger rechtfertigen

**Review für v1.0.0**:
- Wenn Advanced Logging/Monitoring (Sentry, LogRocket) eingeführt wird
- Wenn User-Feedback Bootstrap-Logs in Diagnostics wünscht
- Wenn strukturierte Log-Analyse nötig wird

---

## Konsequenzen

### Positiv
- ✅ **Einfachheit**: Keine zusätzliche Abstraktionsschicht
- ✅ **Wartbarkeit**: Weniger Code zu testen
- ✅ **Dokumentiert**: ADR-0009 erklärt Exceptions klar

### Negativ
- ⚠️ **Inkonsistenz bleibt**: console vs Logger

---

## Alternativen für die Zukunft

Falls Bootstrap-Logger doch nötig wird:

**Zwei-Phasen-Ansatz**:
1. Phase 1 (Minimal Bootstrap):
   ```typescript
   const bootstrapLogger = createMinimalLogger(); // Nur console-Wrapper
   ```

2. Phase 2 (Full Logger nach Container):
   ```typescript
   const logger = container.resolve(loggerToken);
   // Optional: Migriere wichtige Bootstrap-Logs
   ```

**Lazy Logger Pattern**:
```typescript
export class LazyLogger implements Logger {
  private logger: Logger | null = null;
  
  debug(msg: string, ctx?: unknown): void {
    if (!this.logger) {
      console.debug(`[Bootstrap] ${msg}`, ctx);
    } else {
      this.logger.debug(msg, ctx);
    }
  }
  
  setLogger(logger: Logger): void {
    this.logger = logger;
  }
}
```

---

## Best Practices (Aktueller Ansatz)

### Bootstrap-Phase (VOR Logger)
```typescript
// Einfache Logs: console.*
console.debug("Starting bootstrap...");

// Strukturierte Errors: BootstrapErrorHandler
BootstrapErrorHandler.logError(error, { 
  phase: "bootstrap",
  component: "CompositionRoot"
});
```

### Post-Bootstrap (NACH Logger)
```typescript
// Immer Logger-Interface nutzen
const logger = container.resolve(loggerToken);
logger.info("Bootstrap successful");
logger.error("Error during runtime", { context });
```

---

## Referenzen

- **ADR-0009**: Bootstrap DI Exceptions (dokumentiert console.* in Bootstrap)
- **BootstrapErrorHandler**: `src/core/bootstrap-error-handler.ts`
- **CompositionRoot**: `src/core/composition-root.ts`

---

## Verwandte ADRs

- [ADR-0009](0009-bootstrap-di-exceptions.md) - Bootstrap DI Exceptions
- [ADR-0006](0006-observability-strategy.md) - Observability Strategy
- [ADR-0008](0008-console-vs-logger-interface.md) - Console vs Logger Interface

