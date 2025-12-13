---
principle: SRP
severity: low
confidence: high
component_kind: class
component_name: "InitOrchestrator.execute"
file: "src/framework/core/bootstrap/init-orchestrator.ts"
location:
  start_line: 57
  end_line: 84
tags: ["orchestration", "error-handling", "bootstrap"]
---

# Problem

Die Methode `InitOrchestrator.execute` kombiniert zwei Verantwortlichkeiten:
1. Orchestrierung der Phasen-Ausführung
2. Fehlerbehandlung basierend auf Phase-Criticality

Während diese Verantwortlichkeiten eng verwandt sind, könnten sie getrennt werden, um bessere Testbarkeit und Wartbarkeit zu erreichen.

## Evidence

```57:84:src/framework/core/bootstrap/init-orchestrator.ts
  execute(container: PlatformContainerPort, logger: Logger): Result<void, InitError[]> {
    const errors: InitError[] = [];
    const phases = this.registry.getAll();
    const ctx: InitPhaseContext = { container, logger };

    for (const phase of phases) {
      const result = phase.execute(ctx);

      if (!result.ok) {
        if (phase.criticality === InitPhaseCriticality.HALT_ON_ERROR) {
          errors.push({
            phase: phase.id,
            message: result.error,
          });
          logger.error(`Failed to execute phase '${phase.id}': ${result.error}`);
        } else {
          logger.warn(`Phase '${phase.id}' failed: ${result.error}`);
        }
      }
    }

    // If any critical phases failed, return errors
    if (errors.length > 0) {
      return err(errors);
    }

    return ok(undefined);
  }
```

**Zwei Verantwortlichkeiten:**
1. **Orchestrierung**: Phasen aus Registry holen, in Reihenfolge ausführen, Context erstellen
2. **Fehlerbehandlung**: Fehler basierend auf `phase.criticality` behandeln, loggen, aggregieren

Die Fehlerbehandlung ist direkt in die Orchestrierungs-Logik eingewoben (if/else innerhalb der Loop).

## Impact

- **Testbarkeit**: Schwerer zu testen, da Orchestrierung und Fehlerbehandlung gekoppelt sind
- **Wartbarkeit**: Änderungen an der Fehlerbehandlung erfordern Code-Änderungen in der Orchestrierungs-Logik
- **Erweiterbarkeit**: Neue Fehlerbehandlungs-Strategien erfordern Code-Änderungen

## Recommendation

**Option 1: Separate Error Handler (Empfohlen)**
Erstelle einen separaten Error-Handler, der die Fehlerbehandlung übernimmt:

```typescript
class InitPhaseErrorHandler {
  handlePhaseError(
    phase: InitPhase,
    error: string,
    errors: InitError[],
    logger: Logger
  ): void {
    if (phase.criticality === InitPhaseCriticality.HALT_ON_ERROR) {
      errors.push({
        phase: phase.id,
        message: error,
      });
      logger.error(`Failed to execute phase '${phase.id}': ${error}`);
    } else {
      logger.warn(`Phase '${phase.id}' failed: ${error}`);
    }
  }
}

// In InitOrchestrator.execute:
execute(container: PlatformContainerPort, logger: Logger): Result<void, InitError[]> {
  const errors: InitError[] = [];
  const phases = this.registry.getAll();
  const ctx: InitPhaseContext = { container, logger };
  const errorHandler = new InitPhaseErrorHandler();

  for (const phase of phases) {
    const result = phase.execute(ctx);
    if (!result.ok) {
      errorHandler.handlePhaseError(phase, result.error, errors, logger);
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(undefined);
}
```

**Option 2: Keine Änderung (Akzeptabel)**
Die aktuelle Implementierung ist akzeptabel, da:
- Die Fehlerbehandlung ist relativ einfach (nur zwei Strategien)
- Orchestrierung und Fehlerbehandlung sind eng verwandt
- Die Methode ist gut lesbar und nicht zu komplex (28 Zeilen)

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Die Fehlerbehandlung ist relativ einfach (HALT_ON_ERROR vs. WARN_AND_CONTINUE)
- Dies ist eher eine Beobachtung als ein kritisches Problem
- Die Trennung würde die Testbarkeit verbessern, ist aber optional
- Die aktuelle Implementierung folgt dem Design-Dokument: "Error handling is determined by phase criticality"

