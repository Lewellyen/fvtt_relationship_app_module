# ADR-0008: Console vs. Logger Interface

## Status

Accepted

## Context

Das Projekt verwendet eine Mischung aus direkten `console.*`-Aufrufen und dem strukturierten Logger-Interface. Diese Inkonsistenz führt zu:

- Fehlender zentraler Log-Level-Kontrolle
- Erschwerte Fehleranalyse durch unstrukturierte Logs
- Keine Möglichkeit, Logs zu filtern oder weiterzuleiten
- Uneinheitliche Observability

### Findings aus Audit 3 (2.3)

Folgende Stellen verwendeten direkte console-Aufrufe:
- `PortSelector`: `console.error/debug` für Port-Selection-Fehler und Performance
- `ModuleSettingsRegistrar`: `console.error` bei DI-Fehlern
- `ModuleHookRegistrar`: `console.error` bei DI-Fehlern
- `CompositionRoot`: `console.debug` für Bootstrap-Performance
- `FoundryHooksService`: `console.warn` bei Hook-Cleanup-Fehlern
- `MetricsCollector`: `console.table` für Metriken-Ausgabe (DX)

## Decision

**Regel: Logger-Interface PFLICHT für alle Services und Infrastruktur-Code**

### Erlaubt: console.* nur in Ausnahmefällen

Console-Aufrufe sind **nur** erlaubt in folgenden Szenarien:

1. **Pre-Bootstrap-Phase** (`init-solid.ts`)
   - Vor Container-Initialisierung
   - Logger noch nicht verfügbar
   - Beispiel: Bootstrap-Fehler vor Container-Validierung

2. **Logger-Implementierung selbst** (`consolelogger.ts`)
   - Logger muss console.* verwenden für Ausgabe
   - Keine Alternative verfügbar

3. **Frontend Error Boundary** (`ErrorBoundary.svelte`)
   - Uncaught Errors und unhandled Promise Rejections
   - Muss console verwenden, da außerhalb des DI-Systems

4. **Developer Experience Features** (optional)
   - `MetricsCollector.logSummary()`: `console.table` für visuelle Metriken
   - Begründung: Bessere Lesbarkeit für Entwickler
   - Kann optional mit Logger kombiniert werden

### Pflicht: Logger-Interface in allen anderen Fällen

Alle Services, Infrastruktur und Application-Code MÜSSEN das Logger-Interface verwenden:

```typescript
// ✅ KORREKT: Logger via DI
export class PortSelector {
  static dependencies = [metricsCollectorToken, loggerToken] as const;

  constructor(
    private readonly metricsCollector: MetricsCollector,
    private readonly logger: Logger
  ) {}

  selectPort(...) {
    this.logger.error("No compatible port found", {
      foundryVersion: version,
      availableVersions
    });
  }
}
```

```typescript
// ❌ FALSCH: Direkter console-Aufruf
if (error) {
  console.error("Port selection failed");
}
```

## Consequences

### Positive

1. **Zentrale Log-Level-Kontrolle**
   - Runtime-Konfiguration via Foundry Settings
   - Logs können pro Environment gefiltert werden
   - DEBUG/INFO/WARN/ERROR Levels steuerbar

2. **Strukturierte Logs**
   - Kontextinformationen als Objekte
   - Einfacher zu parsen und analysieren
   - Bessere Fehlerdiagnose

3. **Erweiterbarkeit**
   - Logger kann erweitert werden (z.B. Remote-Logging)
   - Logs können aggregiert werden
   - Keine Änderung am Service-Code nötig

4. **Konsistenz**
   - Einheitliche Logging-Strategie
   - Klare Regeln, wann console erlaubt ist
   - Bessere Code-Qualität

### Negative

1. **Logger-Abhängigkeit**
   - Services müssen Logger injizieren
   - Etwas mehr Boilerplate-Code
   - Tests müssen Logger mocken

2. **Initialisierungsreihenfolge kritisch**
   - Logger MUSS vor PortSelector registriert werden
   - Keine Circular Dependencies möglich
   - Dokumentation in `dependencyconfig.ts` notwendig

### Mitigation

**Initialisierungsreihenfolge gesichert durch:**
```typescript
// In dependencyconfig.ts:
// 1. MetricsCollector (keine deps)
// 2. Logger (keine deps)
// 3. PortSelector (deps: [metricsCollectorToken, loggerToken])
```

**Fallback-Mechanismus:**
```typescript
// In Registrars: Logger verfügbar nutzen, sonst console
if (loggerResult.ok) {
  loggerResult.value.error("Error", context);
} else {
  console.error("Fallback error message");
}
```

## Implementation

### Betroffene Dateien

**Geändert:**
- `src/foundry/versioning/portselector.ts` - Logger injiziert
- `src/core/module-settings-registrar.ts` - Logger-Fallback
- `src/core/module-hook-registrar.ts` - Logger-Fallback
- `src/core/composition-root.ts` - Logger aus Container auflösen
- `src/foundry/services/FoundryHooksService.ts` - Logger injiziert

**Dokumentiert:**
- `src/config/dependencyconfig.ts` - Initialisierungsreihenfolge
- `src/observability/metrics-collector.ts` - console.table DX-Begründung

### Tests

Alle Tests angepasst für:
- Logger-Mock in `test-helpers.ts`
- PortSelector-Tests mit Logger-Dependency
- FoundryHooksService-Tests mit Logger-Dependency

## Related

- [ADR-0006: Observability Strategy](0006-observability-strategy.md)
- [ADR-0002: Custom DI Container](0002-custom-di-container-instead-of-tsyringe.md)
- [Audit 3 Finding 2.3](../development/Audit/Audit_3.md#23-inkonsequente-nutzung-des-logger-interfaces)

## Date

2025-11-07

