---
principle: LSP
severity: medium
confidence: high
component_kind: class
component_name: MetricsBootstrapper
file: "src/framework/core/bootstrap/orchestrators/metrics-bootstrapper.ts"
location:
  start_line: 15
  end_line: 41
tags: ["lsp", "instanceof", "polymorphism", "type-check"]
---

# Problem

Die Klasse `MetricsBootstrapper` verwendet einen `instanceof`-Check, um zu prüfen, ob der `MetricsCollector` eine `PersistentMetricsCollector`-Instanz ist. Dies verletzt das Liskov Substitution Principle (LSP), da:

1. **Type-Checking statt Polymorphismus**: Der Code prüft die konkrete Klasse statt ein Interface zu verwenden
2. **Tight Coupling**: Direkte Abhängigkeit von der konkreten Klasse `PersistentMetricsCollector`
3. **Nicht erweiterbar**: Neue Subklassen von `MetricsCollector` mit Initialisierungslogik werden nicht erkannt

## Evidence

```31:32:src/framework/core/bootstrap/orchestrators/metrics-bootstrapper.ts
    // Check if it's a PersistentMetricsCollector
    if (collector instanceof PersistentMetricsCollector) {
```

**Kontext:**
- `MetricsBootstrapper.initializeMetrics()` wird während des Bootstrap-Prozesses aufgerufen
- Prüft, ob der `MetricsCollector` eine `PersistentMetricsCollector`-Instanz ist
- Ruft `initialize()` nur auf, wenn der `instanceof`-Check erfolgreich ist

**Betroffene Dateien:**
- `src/framework/core/bootstrap/orchestrators/metrics-bootstrapper.ts`
- `src/infrastructure/observability/metrics-persistence/persistent-metrics-collector.ts`

## SOLID-Analyse

**LSP-Verstoß:**
- LSP besagt, dass Subtypen durch ihre Basistypen ersetzbar sein müssen
- Der Code behandelt `PersistentMetricsCollector` als Sonderfall statt als Subtyp
- Neue Subklassen mit Initialisierungslogik werden nicht automatisch unterstützt

**Nebenwirkungen:**
- **OCP-Verstoß**: Neue initialisierbare Collector-Typen erfordern Code-Änderungen
- **DIP-Verstoß**: Abhängigkeit von konkreter Klasse statt Interface
- **SRP-Verstoß**: `MetricsBootstrapper` muss verschiedene Collector-Typen kennen

## Zielbild

**Interface-basierte Lösung:**
```typescript
interface InitializableMetricsCollector {
  initialize(): Result<void, string>;
}

class PersistentMetricsCollector extends MetricsCollector
  implements InitializableMetricsCollector {
  // ...
}

class MetricsBootstrapper {
  static initializeMetrics(container: PlatformContainerPort): Result<void, string> {
    const metricsResult = container.resolveWithError(metricsCollectorToken);
    if (!metricsResult.ok) {
      return ok(undefined);
    }

    const collector = metricsResult.value;
    // Duck-typing oder explizites Interface-Check
    if ('initialize' in collector && typeof collector.initialize === 'function') {
      const initResult = collector.initialize();
      if (!initResult.ok) {
        return ok(undefined);
      }
    }

    return ok(undefined);
  }
}
```

**Oder mit explizitem Interface:**
```typescript
// In domain oder application layer
interface Initializable {
  initialize(): Result<void, string>;
}

// Type Guard
function isInitializable(obj: unknown): obj is Initializable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'initialize' in obj &&
    typeof (obj as Initializable).initialize === 'function'
  );
}
```

## Lösungsvorschlag

### Approach A: Interface-basierte Lösung (empfohlen)

1. **Interface definieren**: `InitializableMetricsCollector` Interface erstellen
2. **Type Guard verwenden**: Statt `instanceof` einen Type Guard nutzen
3. **Duck Typing**: Prüfen, ob `initialize`-Methode existiert

**Vorteile:**
- LSP-konform: Jeder Collector mit `initialize()` wird unterstützt
- OCP-konform: Neue Typen ohne Code-Änderungen
- DIP-konform: Abhängigkeit von Interface statt konkreter Klasse

**Nachteile:**
- Type Safety etwas reduziert (aber durch Type Guard abgefedert)

### Approach B: Registry Pattern

1. **Initialization Registry**: Registry für Initialisierungslogik
2. **Decorator Pattern**: Collector registriert sich selbst

**Vorteile:**
- Sehr flexibel
- Vollständig OCP-konform

**Nachteile:**
- Mehr Komplexität
- Overhead für einfachen Use Case

## Refactoring-Schritte

1. **Interface definieren** (Domain/Application Layer):
   ```typescript
   // src/domain/ports/initializable.interface.ts
   export interface Initializable {
     initialize(): Result<void, string>;
   }
   ```

2. **Type Guard erstellen**:
   ```typescript
   // src/infrastructure/shared/utils/type-guards.ts
   export function isInitializable(obj: unknown): obj is Initializable {
     return (
       typeof obj === 'object' &&
       obj !== null &&
       'initialize' in obj &&
       typeof (obj as Initializable).initialize === 'function'
     );
   }
   ```

3. **PersistentMetricsCollector anpassen**:
   ```typescript
   export class PersistentMetricsCollector extends MetricsCollector
     implements Initializable {
     // initialize() bereits vorhanden
   }
   ```

4. **MetricsBootstrapper refactoren**:
   ```typescript
   import { isInitializable } from "@/infrastructure/shared/utils/type-guards";

   static initializeMetrics(container: PlatformContainerPort): Result<void, string> {
     const metricsResult = container.resolveWithError(metricsCollectorToken);
     if (!metricsResult.ok) {
       return ok(undefined);
     }

     const collector = metricsResult.value;
     if (isInitializable(collector)) {
       const initResult = collector.initialize();
       if (!initResult.ok) {
         return ok(undefined);
       }
     }

     return ok(undefined);
   }
   ```

5. **Tests aktualisieren**:
   - Tests für Type Guard
   - Tests für verschiedene Initializable-Implementierungen

**Breaking Changes:**
- Keine: `PersistentMetricsCollector` bleibt kompatibel
- Neue Initializable-Collectors funktionieren automatisch

## Beispiel-Code

**Before:**
```typescript
if (collector instanceof PersistentMetricsCollector) {
  const initResult = collector.initialize();
  // ...
}
```

**After:**
```typescript
if (isInitializable(collector)) {
  const initResult = collector.initialize();
  // ...
}
```

## Tests & Quality Gates

**Tests erforderlich:**
1. **Type Guard Tests**:
   - `isInitializable()` mit verschiedenen Objekten
   - Positive und negative Fälle

2. **MetricsBootstrapper Tests**:
   - Initialisierung mit `PersistentMetricsCollector`
   - Initialisierung mit anderen Initializable-Collectors
   - Initialisierung mit nicht-initialisierbaren Collectors

3. **Integration Tests**:
   - Bootstrap-Prozess mit verschiedenen Collector-Typen

**Quality Gates:**
- `npm run type-check` muss bestehen
- `npm run test:coverage` muss bestehen
- Keine neuen Linter-Warnungen

## Akzeptanzkriterien

1. ✅ `instanceof`-Check entfernt
2. ✅ Interface-basierte Lösung implementiert
3. ✅ Type Guard für Initializable vorhanden
4. ✅ Alle Tests bestehen
5. ✅ Neue Initializable-Collectors funktionieren ohne Code-Änderungen
6. ✅ Type Safety erhalten (Type Guard validiert)

## Notes

- **Warum nicht `instanceof`?**: `instanceof` prüft die konkrete Klasse, nicht das Verhalten. LSP fordert, dass Subtypen durch Basistypen ersetzbar sind.
- **Duck Typing vs. Interface**: Duck Typing ist hier akzeptabel, da TypeScript Type Guards unterstützt.
- **Performance**: Type Guard ist minimal langsamer als `instanceof`, aber der Unterschied ist vernachlässigbar.
- **Alternative**: Wenn nur `PersistentMetricsCollector` initialisierbar sein soll, könnte ein explizites Interface besser sein.

