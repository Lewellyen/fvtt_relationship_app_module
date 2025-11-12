# ADR-0011: Bootstrap `new` Instantiation Exceptions

**Status:** Accepted  
**Datum:** 2025-11-12  
**Kontext:** Dependency Injection, SOLID Principles, Bootstrap Architecture  
**Bezug:** [ADR-0009: Bootstrap DI Exceptions](0009-bootstrap-di-exceptions.md)

---

## Kontext

SOLID-Prinzipien (insbesondere Dependency Inversion Principle) empfehlen, dass Application-Code keine `new` Aufrufe enthalten sollte. Stattdessen sollten alle Dependencies per DI injiziert werden.

In unserem Projekt gibt es jedoch **gezielt einige `new` Aufrufe im Bootstrap-Code** (hauptsächlich in `src/config/dependencyconfig.ts`):

```typescript
// Post-Validation Initialization in configureDependencies()
const containerCheck = new ContainerHealthCheck(container);
const metricsCheck = new MetricsHealthCheck(metrics);
```

Diese verstoßen scheinbar gegen SOLID. Die Frage ist: Sind diese `new` Aufrufe gerechtfertigt?

---

## Entscheidung

**Die `new` Aufrufe im Bootstrap-Kontext sind architektonisch gerechtfertigt und bleiben bestehen.**

### Erlaubte `new` Aufrufe (4 Kategorien)

#### 1. **Container Self-Reference** (Chicken-and-Egg Problem)

```typescript
// ✅ Erlaubt: Container steht außerhalb des DI-Systems
const containerCheck = new ContainerHealthCheck(container);
```

**Grund:** Container **IST** das DI-System. Er kann sich nicht selbst als Dependency registrieren ohne Self-Reference.

#### 2. **Bootstrap Services** (vor DI-Initialization)

```typescript
// ✅ Erlaubt: Vor DI-Container-Existenz
const performanceTracker = new BootstrapPerformanceTracker(ENV, null);
const fallbackLogger = new ConsoleLoggerService(fallbackConfig);
```

**Grund:** Diese Services werden **vor** oder **während** der Container-Erstellung benötigt. DI ist noch nicht verfügbar.

#### 3. **Post-Validation Initialization** (konsistent mit Container-Check)

```typescript
// ✅ Erlaubt: Konsistent mit ContainerHealthCheck
const metricsCheck = new MetricsHealthCheck(metrics);
```

**Grund:** MetricsHealthCheck hat **kein** Self-Reference-Problem, aber wird konsistent mit ContainerHealthCheck behandelt für einheitlichen Code-Stil.

#### 4. **Test Code**

```typescript
// ✅ Erlaubt: Test-Mocks
const mockService = new MockService();
```

**Grund:** Tests brauchen direkten Zugriff auf Instanzen für Mocking/Stubbing.

---

## Alternative Ansätze geprüft

### Alternative 1: Container Self-Registration

```typescript
// ❌ REJECTED: Anti-Pattern
container.registerValue(containerToken, container);

class ContainerHealthCheck {
  static dependencies = [containerToken] as const;
  constructor(private container: ServiceContainer) {}
}
```

**Problem:**
- Container-Self-Reference = **Tight Coupling**
- Container wäre eigene Dependency → philosophisch falsch
- Schwierig zu testen (Mock von Container schwierig)

### Alternative 2: Lazy Resolution in HealthCheckRegistry

```typescript
// ❌ REJECTED: Schiebt Problem nur weiter
class HealthCheckRegistry {
  constructor(private container: ServiceContainer) {}
  
  runAll(): Map<string, boolean> {
    const containerCheck = this.container.resolve(containerHealthCheckToken);
    // ...
  }
}
```

**Problem:**
- HealthCheckRegistry braucht Container → **wieder Self-Reference!**
- Problem wird nur verschoben, nicht gelöst

### Alternative 3: Factory mit Container-Closure

```typescript
// ❌ REJECTED: Implizite Self-Reference
container.registerFactory(
  containerHealthCheckToken,
  () => new ContainerHealthCheck(container), // Closure!
  SINGLETON,
  []
);
```

**Problem:**
- Factory hat Closure über Container → **implizite Self-Reference**
- Gleicher Coupling wie Self-Registration, nur versteckt
- Keine Verbesserung gegenüber direktem `new`

### Alternative 4: Dependency-Injection von HealthChecks

```typescript
// ❌ REJECTED: Circular Dependency
class HealthCheckRegistry {
  constructor(
    containerCheck: ContainerHealthCheck,
    metricsCheck: MetricsHealthCheck
  ) {
    this.register(containerCheck);
    this.register(metricsCheck);
  }
}

// Dependency Graph:
Container → HealthCheckRegistry → ContainerHealthCheck → Container
//          ↑_______________________________________________|
//          CIRCULAR DEPENDENCY!
```

**Problem:**
- **Zirkuläre Abhängigkeit** wird vom Validator erkannt und blockiert
- Container kann nicht bootstrapped werden

---

## Begründung

### Warum ist Container außerhalb von DI?

**Philosophische Betrachtung:**

Der Container ist das **Meta-System** für Dependency Injection. Er steht **eine Abstraktionsebene höher** als die Services, die er verwaltet.

```
┌─────────────────────────────────────────┐
│  Bootstrap Layer (Orchestration)        │  ← Container wird hier erstellt
│  • composition-root.ts                  │
│  • dependencyconfig.ts                  │
│  • ServiceContainer.createRoot()        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  DI Container (Meta-System)             │  ← Container selbst
│  • ServiceContainer                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Application Layer (DI-managed)         │  ← Services werden hier injiziert
│  • All Services via DI                  │
│  • Logger, FoundryGame, etc.            │
└─────────────────────────────────────────┘
```

**Container steht außerhalb** weil er **das System selbst ist**, nicht Teil davon.

### Chicken-and-Egg Problem

```
Q: Wer erstellt den Container?
A: Bootstrap-Code (createRoot)

Q: Wer managed den Container?
A: Niemand - er ist der Top-Level

Q: Wie checkt man den Container's Health?
A: Manuell instanziierter HealthCheck (new)

Q: Warum nicht per DI?
A: Container kann nicht Dependency von sich selbst sein
```

### Isolierung der Exceptions

**Wichtig:** Alle `new` Aufrufe sind **isoliert im Bootstrap-Code**:

```typescript
// src/config/dependencyconfig.ts - Bootstrap-Context
function configureDependencies() {
  // ✅ Erlaubt hier (Bootstrap)
  const check = new ContainerHealthCheck(container);
}

// src/services/SomeService.ts - Application-Context
class SomeService {
  // ❌ NICHT erlaubt hier!
  private helper = new HelperService(); // SOLID-Violation!
}
```

**Regel:**
- ✅ Bootstrap-Code: `new` erlaubt (Orchestration Layer)
- ❌ Application-Code: `new` verboten (alles per DI)

---

## Konsequenzen

### Positiv

✅ **Container bleibt loosely coupled** - keine Self-Reference  
✅ **Keine Circular Dependencies** - Container-Validation funktioniert  
✅ **Klare Abstraktionsebenen** - Bootstrap vs. Application Layer  
✅ **Pragmatisch** - löst Chicken-and-Egg Problem sauber  
✅ **Gut isoliert** - `new` nur in ~4 definierten Stellen

### Negativ

⚠️ **Wenige `new` Aufrufe im Bootstrap-Code** - aber bewusst und dokumentiert  
⚠️ **Type Casts in Post-Registration** - durch Result-Pattern nötig

### Trade-offs akzeptiert

Die verbleibenden `new` Aufrufe sind **bewusste Design-Entscheidungen**, nicht technische Schulden:
- Vermeiden Circular Dependencies
- Halten Bootstrap-Layer klar getrennt
- Alternative Ansätze würden Architektur verschlechtern

---

## Referenzen

- [ADR-0009: Bootstrap DI Exceptions](0009-bootstrap-di-exceptions.md) - Generelle Bootstrap-Exceptions
- [ADR-0002: Custom DI Container](0002-custom-di-container-instead-of-tsyringe.md) - Container-Architektur
- [ADR-0007: Clean Architecture Layering](0007-clean-architecture-layering.md) - Layer-Separation

---

## Entscheidungsträger

- Claude Sonnet 4.5 (AI Pair Programming)
- User Decision nach Diskussion über Dependency Loops

---

## Review-Notes

**Regelmäßig prüfen:**
- Bleiben `new` Aufrufe auf Bootstrap beschränkt?
- Sind alle Alternativen noch schlechter als die aktuelle Lösung?
- Gibt es neue DI-Patterns die das Problem anders lösen?

**Nächster Review:** Bei v1.0.0-Release oder wenn Container-Architektur geändert wird

