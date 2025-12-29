---
principle: DIP
severity: low
confidence: medium
component_kind: class
component_name: "ServiceResolver"
file: "src/infrastructure/di/resolution/ServiceResolver.ts"
location:
  start_line: 39
  end_line: 50
tags: ["dependency", "instantiation", "infrastructure-layer", "circular-dependency"]
---

# Problem

`ServiceResolver` verletzt das Dependency Inversion Principle (DIP), indem es `LifecycleResolver` und `ServiceInstantiatorImpl` direkt im Constructor instanziiert.

## Evidence

```39:50:src/infrastructure/di/resolution/ServiceResolver.ts
  constructor(
    private readonly registry: ServiceRegistry,
    private readonly cache: InstanceCache,
    private readonly parentResolver: ServiceResolver | null,
    private readonly scopeName: string,
    private readonly performanceTracker: PerformanceTracker
  ) {
    // Pass parentResolver as DependencyResolver to break circular dependency
    this.lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName);
    // Pass this as DependencyResolver to break circular dependency
    this.instantiator = new ServiceInstantiatorImpl(this);
  }
```

**Problem:**
- Direkte Instanziierung von `LifecycleResolver` und `ServiceInstantiatorImpl` mit `new`
- Verletzt DIP: Abhängigkeit von konkreten Implementierungen

**Besonderheit:**
- `ServiceInstantiatorImpl` erhält `this` als DependencyResolver, um Circular Dependencies zu vermeiden
- `ServiceResolver` implementiert selbst `DependencyResolver` und `ServiceInstantiator` Interfaces
- Dies ist ein bewusster Design-Entscheid zur Vermeidung von Circular Dependencies

## Impact

**Testbarkeit:**
- Schwierig, `LifecycleResolver` und `ServiceInstantiatorImpl` in Tests zu mocken
- Unit-Tests müssen die gesamte Dependency-Kette testen

**Flexibilität:**
- Keine Möglichkeit, alternative Implementierungen zu verwenden
- Erschwert zukünftige Erweiterungen

**Konsistenz:**
- Inkonsistent mit dem Rest der Codebase, wo Dependency Injection verwendet wird

**Circular Dependency Problem:**
- `ServiceResolver` benötigt `ServiceInstantiator`, der wiederum `DependencyResolver` benötigt
- `ServiceResolver` implementiert beide Interfaces, um Circular Dependencies zu vermeiden
- Direkte Instanziierung ist hier möglicherweise gerechtfertigt

## Recommendation

**Approach A (Empfohlen): Factory-Pattern für LifecycleResolver**

1. `LifecycleResolver` über Factory-Funktion oder DI injizieren:
   ```typescript
   constructor(
     private readonly registry: ServiceRegistry,
     private readonly cache: InstanceCache,
     private readonly parentResolver: ServiceResolver | null,
     private readonly scopeName: string,
     private readonly performanceTracker: PerformanceTracker,
     lifecycleResolverFactory?: (cache: InstanceCache, parentResolver: DependencyResolver | null, scopeName: string) => LifecycleResolver
   ) {
     this.lifecycleResolver = lifecycleResolverFactory?.(
       cache,
       parentResolver,
       scopeName
     ) ?? new LifecycleResolver(cache, parentResolver, scopeName);
     this.instantiator = new ServiceInstantiatorImpl(this);
   }
   ```

**Approach B (Alternative): ServiceInstantiator über Factory**

1. `ServiceInstantiator` über Factory injizieren:
   ```typescript
   constructor(
     private readonly registry: ServiceRegistry,
     private readonly cache: InstanceCache,
     private readonly parentResolver: ServiceResolver | null,
     private readonly scopeName: string,
     private readonly performanceTracker: PerformanceTracker,
     instantiatorFactory?: (dependencyResolver: DependencyResolver) => ServiceInstantiator
   ) {
     this.lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName);
     this.instantiator = instantiatorFactory?.(this) ?? new ServiceInstantiatorImpl(this);
   }
   ```

**Approach C (Akzeptabel): Beibehalten**

- Direkte Instanziierung ist hier möglicherweise gerechtfertigt wegen Circular Dependency Problem
- `ServiceResolver` ist Teil des DI-Containers selbst und kann sich nicht selbst injizieren
- Ähnlich wie Bootstrap-Code, wo `new` erlaubt ist (siehe ADR-0011)

## Example Fix

**Before:**
```typescript
constructor(
  private readonly registry: ServiceRegistry,
  private readonly cache: InstanceCache,
  private readonly parentResolver: ServiceResolver | null,
  private readonly scopeName: string,
  private readonly performanceTracker: PerformanceTracker
) {
  this.lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName);
  this.instantiator = new ServiceInstantiatorImpl(this);
}
```

**After (Approach A):**
```typescript
type LifecycleResolverFactory = (
  cache: InstanceCache,
  parentResolver: DependencyResolver | null,
  scopeName: string
) => LifecycleResolver;

constructor(
  private readonly registry: ServiceRegistry,
  private readonly cache: InstanceCache,
  private readonly parentResolver: ServiceResolver | null,
  private readonly scopeName: string,
  private readonly performanceTracker: PerformanceTracker,
  lifecycleResolverFactory?: LifecycleResolverFactory
) {
  this.lifecycleResolver = lifecycleResolverFactory?.(
    cache,
    parentResolver,
    scopeName
  ) ?? new LifecycleResolver(cache, parentResolver, scopeName);
  this.instantiator = new ServiceInstantiatorImpl(this);
}
```

## Tests & Quality Gates

**Vor Refactoring:**
- Bestehende Tests müssen weiterhin bestehen
- Sicherstellen, dass Circular Dependency Problem gelöst bleibt

**Nach Refactoring:**
- Unit-Tests können `LifecycleResolver` mocken
- Integration-Tests mit echten Implementierungen
- Type-Check muss bestehen
- Alle bestehenden Tests müssen weiterhin bestehen

## Akzeptanzkriterien

- ✅ `LifecycleResolver` kann über Factory injiziert werden (optional)
- ✅ Circular Dependency Problem bleibt gelöst
- ✅ Alle bestehenden Tests bestehen weiterhin
- ✅ Neue Unit-Tests können `LifecycleResolver` mocken
- ✅ Type-Check besteht ohne Fehler

## Notes

- **Breaking Changes:** Minimal - Factory ist optional, Default-Verhalten bleibt gleich
- **Aufwand:** Niedrig (1 Stunde)
- **Priorität:** Niedrig - Direkte Instanziierung ist hier möglicherweise gerechtfertigt wegen Circular Dependency Problem
- **Verwandte Dateien:**
  - `src/infrastructure/di/resolution/lifecycle-resolver.ts`
  - `src/infrastructure/di/resolution/service-instantiator.ts`
  - `docs/decisions/0011-bootstrap-new-instantiation-exceptions.md` (ADR-0011)

**Wichtig:** Prüfen, ob direkte Instanziierung hier gerechtfertigt ist (ähnlich wie Bootstrap-Code in ADR-0011). `ServiceResolver` ist Teil des DI-Containers selbst und kann sich möglicherweise nicht selbst injizieren.

