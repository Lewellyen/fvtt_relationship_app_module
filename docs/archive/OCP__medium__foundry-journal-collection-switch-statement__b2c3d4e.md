---
principle: OCP
severity: medium
confidence: high
component_kind: class
component_name: FoundryJournalCollectionAdapter
file: "src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts"
location:
  start_line: 210
  end_line: 249
tags: ["ocp", "switch", "strategy", "extensibility"]
---

# Problem

Die Methode `matchesFilter()` in `FoundryJournalCollectionAdapter` verwendet ein großes `switch`-Statement mit 12+ Cases für verschiedene Filter-Operatoren. Dies verletzt das Open/Closed Principle (OCP), da:

1. **Erweiterung erfordert Modifikation**: Neue Filter-Operatoren erfordern Code-Änderungen in der `matchesFilter()`-Methode
2. **Switch Statement Anti-Pattern**: Große Switch-Statements sind ein Code-Smell und erschweren Wartbarkeit
3. **Niedrige Kohäsion**: Alle Filter-Logik in einer Methode

## Evidence

```210:249:src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts
  private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
    switch (operator) {
      case "equals":
        return fieldValue === filterValue;
      case "notEquals":
        return fieldValue !== filterValue;
      case "contains":
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case "startsWith":
        return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case "endsWith":
        return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case "in": {
        if (!Array.isArray(filterValue)) {
          return false;
        }
        const filterArray: unknown[] = filterValue;
        return filterArray.includes(fieldValue);
      }
      case "notIn": {
        if (!Array.isArray(filterValue)) {
          return false;
        }
        const filterArray: unknown[] = filterValue;
        return !filterArray.includes(fieldValue);
      }
      case "greaterThan":
        return Number(fieldValue) > Number(filterValue);
      case "lessThan":
        return Number(fieldValue) < Number(filterValue);
      case "greaterThanOrEqual":
        return Number(fieldValue) >= Number(filterValue);
      case "lessThanOrEqual":
        return Number(fieldValue) <= Number(filterValue);
      default:
        return false;
    }
  }
```

**Kontext:**
- Diese Methode wird von `FoundryJournalQueryBuilder` verwendet
- Unterstützt aktuell 12 verschiedene Filter-Operatoren
- Jeder neue Operator erfordert eine neue `case`-Klausel

**Betroffene Dateien:**
- `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts`

## SOLID-Analyse

**OCP-Verstoß:**
- OCP besagt: "Open for extension, closed for modification"
- Aktuell: Neue Operatoren erfordern Modifikation der `matchesFilter()`-Methode
- Ziel: Neue Operatoren durch Registrierung hinzufügen, ohne bestehenden Code zu ändern

**Nebenwirkungen:**
- **SRP-Verstoß**: Eine Methode enthält Logik für 12+ verschiedene Operatoren
- **Wartbarkeit**: Große Switch-Statements sind schwer zu lesen und zu testen
- **Testbarkeit**: Jeder Operator muss einzeln getestet werden, aber alle in einer Methode

## Zielbild

**Strategy Pattern mit Registry:**
```typescript
// Filter Operator Interface
interface FilterOperator {
  name: string;
  matches(fieldValue: unknown, filterValue: unknown): boolean;
}

// Operator Registry
class FilterOperatorRegistry {
  private operators = new Map<string, FilterOperator>();

  register(operator: FilterOperator): void {
    this.operators.set(operator.name, operator);
  }

  get(name: string): FilterOperator | undefined {
    return this.operators.get(name);
  }
}

// Konkrete Operatoren
class EqualsOperator implements FilterOperator {
  name = "equals";
  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return fieldValue === filterValue;
  }
}

// Verwendung
private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
  const op = this.operatorRegistry.get(operator);
  if (!op) {
    return false; // oder throw error
  }
  return op.matches(fieldValue, filterValue);
}
```

## Lösungsvorschlag

### Approach A: Strategy Pattern mit Registry (empfohlen)

1. **FilterOperator Interface**: Abstraktion für Filter-Operatoren
2. **FilterOperatorRegistry**: Registry für dynamische Registrierung
3. **Konkrete Operatoren**: Separate Klassen für jeden Operator
4. **Default-Operatoren**: Standard-Operatoren werden beim Initialisieren registriert

**Vorteile:**
- OCP-konform: Neue Operatoren durch Registrierung
- SRP-konform: Jeder Operator in eigener Klasse
- Testbar: Operatoren isoliert testbar
- Erweiterbar: Externe Operatoren können registriert werden

**Nachteile:**
- Mehr Code (aber besser strukturiert)
- Initial Overhead für Registry-Setup

### Approach B: Map-basierte Lösung (einfacher)

1. **Operator Map**: Map von Operator-Namen zu Funktionen
2. **Factory-Funktionen**: Funktionen für jeden Operator

**Vorteile:**
- Einfacher als Strategy Pattern
- Weniger Code

**Nachteile:**
- Weniger flexibel
- Schwerer zu testen (Funktionen statt Klassen)

## Refactoring-Schritte

1. **FilterOperator Interface erstellen**:
   ```typescript
   // src/infrastructure/adapters/foundry/collection-adapters/filter-operator.interface.ts
   export interface FilterOperator {
     name: string;
     matches(fieldValue: unknown, filterValue: unknown): boolean;
   }
   ```

2. **FilterOperatorRegistry erstellen**:
   ```typescript
   // src/infrastructure/adapters/foundry/collection-adapters/filter-operator-registry.ts
   export class FilterOperatorRegistry {
     private operators = new Map<string, FilterOperator>();

     register(operator: FilterOperator): void {
       this.operators.set(operator.name, operator);
     }

     get(name: string): FilterOperator | undefined {
       return this.operators.get(name);
     }
   }
   ```

3. **Konkrete Operatoren erstellen**:
   ```typescript
   // src/infrastructure/adapters/foundry/collection-adapters/operators/equals-operator.ts
   export class EqualsOperator implements FilterOperator {
     name = "equals";
     matches(fieldValue: unknown, filterValue: unknown): boolean {
       return fieldValue === filterValue;
     }
   }
   // ... weitere Operatoren
   ```

4. **Default-Operatoren registrieren**:
   ```typescript
   // src/infrastructure/adapters/foundry/collection-adapters/default-filter-operators.ts
   export function createDefaultFilterOperators(): FilterOperatorRegistry {
     const registry = new FilterOperatorRegistry();
     registry.register(new EqualsOperator());
     registry.register(new NotEqualsOperator());
     // ... weitere
     return registry;
   }
   ```

5. **FoundryJournalCollectionAdapter refactoren**:
   ```typescript
   export class FoundryJournalCollectionAdapter {
     private readonly operatorRegistry: FilterOperatorRegistry;

     constructor(/* ... */, operatorRegistry?: FilterOperatorRegistry) {
       this.operatorRegistry = operatorRegistry ?? createDefaultFilterOperators();
     }

     private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
       const op = this.operatorRegistry.get(operator);
       if (!op) {
         return false;
       }
       return op.matches(fieldValue, filterValue);
     }
   }
   ```

**Breaking Changes:**
- Keine: Default-Operatoren werden automatisch registriert
- API bleibt unverändert

## Beispiel-Code

**Before:**
```typescript
private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === filterValue;
    // ... 11 weitere cases
    default:
      return false;
  }
}
```

**After:**
```typescript
private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
  const op = this.operatorRegistry.get(operator);
  if (!op) {
    return false;
  }
  return op.matches(fieldValue, filterValue);
}
```

## Tests & Quality Gates

**Tests erforderlich:**
1. **Operator-Tests**: Jeder Operator isoliert testen
2. **Registry-Tests**: Registrierung und Abfrage testen
3. **Adapter-Tests**: Integration mit FoundryJournalCollectionAdapter
4. **Erweiterbarkeitstests**: Externe Operatoren registrieren

**Quality Gates:**
- `npm run type-check` muss bestehen
- `npm run test:coverage` muss bestehen
- Alle bestehenden Tests müssen weiterhin bestehen

## Akzeptanzkriterien

1. ✅ Switch-Statement entfernt
2. ✅ Strategy Pattern implementiert
3. ✅ Registry für Operatoren vorhanden
4. ✅ Alle bestehenden Operatoren funktionieren
5. ✅ Neue Operatoren können ohne Code-Änderungen hinzugefügt werden
6. ✅ Alle Tests bestehen

## Notes

- **Warum Strategy Pattern?**: Ermöglicht Erweiterung ohne Modifikation (OCP)
- **Performance**: Registry-Lookup ist minimal langsamer als Switch, aber vernachlässigbar
- **Alternative**: Wenn nur wenige Operatoren erwartet werden, könnte Switch akzeptabel sein
- **Zukünftige Erweiterungen**: Custom-Operatoren für spezielle Use Cases möglich

