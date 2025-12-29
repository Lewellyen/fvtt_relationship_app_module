---
principle: DIP
severity: medium
confidence: high
component_kind: class
component_name: "RuntimeConfigService"
file: "src/application/services/RuntimeConfigService.ts"
location:
  start_line: 18
  end_line: 25
tags: ["dependency", "instantiation", "application-layer"]
---

# Problem

`RuntimeConfigService` verletzt das Dependency Inversion Principle (DIP), indem es `RuntimeConfigStore` und `RuntimeConfigEventEmitter` direkt im Constructor instanziiert, anstatt sie über Dependency Injection zu injizieren.

## Evidence

```22:25:src/application/services/RuntimeConfigService.ts
  constructor(env: EnvironmentConfig) {
    this.store = new RuntimeConfigStore(env);
    this.emitter = new RuntimeConfigEventEmitter();
  }
```

**Problem:**
- Direkte Instanziierung von `RuntimeConfigStore` und `RuntimeConfigEventEmitter` mit `new`
- Keine Möglichkeit, diese Dependencies zu mocken oder zu ersetzen
- Verletzt DIP: Abhängigkeit von konkreten Implementierungen statt Abstraktionen

## Impact

**Testbarkeit:**
- Schwierig, `RuntimeConfigStore` und `RuntimeConfigEventEmitter` in Tests zu mocken
- Unit-Tests müssen die gesamte Dependency-Kette testen

**Flexibilität:**
- Keine Möglichkeit, alternative Implementierungen zu verwenden
- Erschwert zukünftige Erweiterungen (z.B. persistente Event-Emitter)

**Konsistenz:**
- Inkonsistent mit dem Rest der Codebase, wo Dependency Injection verwendet wird
- Verstößt gegen die etablierten Architektur-Prinzipien

## Recommendation

**Approach A (Empfohlen): Dependency Injection**

1. Interfaces für `RuntimeConfigStore` und `RuntimeConfigEventEmitter` erstellen:
   - `IRuntimeConfigStore`
   - `IRuntimeConfigEventEmitter`

2. Dependencies über Constructor injizieren:
   ```typescript
   constructor(
     private readonly store: IRuntimeConfigStore,
     private readonly emitter: IRuntimeConfigEventEmitter
   ) {}
   ```

3. Factory-Funktion anpassen oder Factory-Pattern verwenden:
   ```typescript
   export function createRuntimeConfig(
     env: EnvironmentConfig,
     store?: IRuntimeConfigStore,
     emitter?: IRuntimeConfigEventEmitter
   ): RuntimeConfigService {
     return new RuntimeConfigService(
       store ?? new RuntimeConfigStore(env),
       emitter ?? new RuntimeConfigEventEmitter()
     );
   }
   ```

**Approach B (Alternative): Factory-Pattern**

Factory-Funktion erweitern, die alle Dependencies erstellt:
```typescript
export function createRuntimeConfigService(env: EnvironmentConfig): RuntimeConfigService {
  const store = new RuntimeConfigStore(env);
  const emitter = new RuntimeConfigEventEmitter();
  return new RuntimeConfigService(store, emitter);
}
```

## Example Fix

**Before:**
```typescript
export class RuntimeConfigService {
  private readonly store: RuntimeConfigStore;
  private readonly emitter: RuntimeConfigEventEmitter;

  constructor(env: EnvironmentConfig) {
    this.store = new RuntimeConfigStore(env);
    this.emitter = new RuntimeConfigEventEmitter();
  }
}
```

**After:**
```typescript
export interface IRuntimeConfigStore {
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K];
  set<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): boolean;
}

export interface IRuntimeConfigEventEmitter {
  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void;
  notify<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void;
}

export class RuntimeConfigService {
  constructor(
    private readonly store: IRuntimeConfigStore,
    private readonly emitter: IRuntimeConfigEventEmitter
  ) {}
}
```

## Tests & Quality Gates

**Vor Refactoring:**
- Bestehende Tests müssen weiterhin bestehen
- Sicherstellen, dass keine Breaking Changes für externe Consumer

**Nach Refactoring:**
- Unit-Tests mit gemockten Dependencies
- Integration-Tests mit echten Implementierungen
- Type-Check muss bestehen
- Alle bestehenden Tests müssen weiterhin bestehen

## Akzeptanzkriterien

- ✅ `RuntimeConfigService` akzeptiert `IRuntimeConfigStore` und `IRuntimeConfigEventEmitter` über Constructor
- ✅ Factory-Funktion erstellt Default-Implementierungen für Backward Compatibility
- ✅ Alle bestehenden Tests bestehen weiterhin
- ✅ Neue Unit-Tests können Dependencies mocken
- ✅ Type-Check besteht ohne Fehler

## Notes

- **Breaking Changes:** Minimal - Factory-Funktion kann für Backward Compatibility verwendet werden
- **Aufwand:** Niedrig-Mittel (1-2 Stunden)
- **Priorität:** Mittel - Verbessert Testbarkeit und Flexibilität, aber nicht kritisch
- **Verwandte Dateien:**
  - `src/application/services/RuntimeConfigStore.ts`
  - `src/application/services/RuntimeConfigEventEmitter.ts`
  - `src/application/services/runtime-config-factory.ts`

