---
principle: SRP
severity: low
confidence: medium
component_kind: service
component_name: RuntimeConfigService
file: "src/application/services/RuntimeConfigService.ts"
location:
  start_line: 13
  end_line: 108
tags: ["responsibility", "cohesion", "config-management"]
---
# Problem

`RuntimeConfigService` kombiniert zwei Verantwortlichkeiten:
1. **Config-Wert-Management**: Speicherung und Abfrage von Runtime-Config-Werten
2. **Listener-Management**: Verwaltung von Event-Listeners für Config-Änderungen

## Evidence

```13:108:src/application/services/RuntimeConfigService.ts
export class RuntimeConfigService {
  private readonly values: RuntimeConfigValues;
  private readonly listeners = new Map<
    RuntimeConfigKey,
    Set<RuntimeConfigListener<RuntimeConfigKey>>
  >();

  constructor(env: EnvironmentConfig) {
    this.values = {
      // ... Initialisierung der Werte
    };
  }

  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.values[key];
  }

  setFromFoundry<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    this.updateValue(key, value);
  }

  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
    // Listener-Management-Logik
  }

  private updateValue<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    // Wert-Update und Listener-Benachrichtigung
  }
}
```

Die Klasse verwaltet sowohl die Config-Werte (`values`) als auch die Listener (`listeners`). Die `updateValue`-Methode kombiniert Wert-Update und Listener-Benachrichtigung.

## Impact

**Niedrig**: Die beiden Verantwortlichkeiten sind eng zusammengehörig und werden typischerweise zusammen verwendet. Eine Trennung würde die Komplexität erhöhen, ohne klaren Nutzen zu bringen.

- Die Klasse ist weiterhin gut testbar
- Die Verantwortlichkeiten sind kohärent (beide betreffen Runtime-Config)
- Eine Trennung würde zusätzliche Abhängigkeiten und Koordination erfordern

## Recommendation

**Keine Änderung erforderlich**: Die Kombination von Config-Management und Listener-Management ist in diesem Fall akzeptabel, da:
- Beide Verantwortlichkeiten eng zusammengehörig sind
- Die Klasse weiterhin fokussiert und testbar ist
- Eine Trennung keinen klaren Nutzen bringen würde

Falls in Zukunft erweiterte Listener-Features benötigt werden (z.B. Prioritäten, Filter, Debouncing), sollte eine Trennung in Betracht gezogen werden.

## Example Fix

Falls eine Trennung gewünscht wird:

```typescript
// Config-Wert-Management
export class RuntimeConfigStore {
  private readonly values: RuntimeConfigValues;
  // ... get/set methods
}

// Listener-Management
export class RuntimeConfigEventEmitter {
  private readonly listeners = new Map<...>();
  // ... onChange/notify methods
}

// Orchestrierung
export class RuntimeConfigService {
  constructor(
    private readonly store: RuntimeConfigStore,
    private readonly emitter: RuntimeConfigEventEmitter
  ) {}
}
```

## Notes

Dies ist ein "Low"-Severity-Finding, da die Verantwortlichkeiten zwar getrennt werden könnten, aber die aktuelle Implementierung akzeptabel ist. Die Klasse bleibt fokussiert und die Verantwortlichkeiten sind kohärent.

