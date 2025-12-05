# SRP Refactoring Plan: ServiceResolver

**Status:** 📋 Geplant
**Priorität:** 🟡 Niedrig
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Service-Resolution von Lifecycle-Management

---

## Problem

`ServiceResolver` verletzt das Single Responsibility Principle (SRP) durch mehrere Verantwortlichkeiten:

1. **Service-Resolution**: Services auflösen
2. **Lifecycle-Management**: Singleton, Transient, Scoped
3. **Alias-Resolution**: Token-Aliase auflösen
4. **Performance-Tracking**: Resolution-Zeit messen
5. **Metrics-Recording**: Metrics für Resolutions aufzeichnen

**Aktuelle Datei:** `src/infrastructure/di/resolution/ServiceResolver.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class ServiceResolver {
  // 1. Service-Resolution
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError>

  // 2. Lifecycle-spezifische Resolution
  private resolveSingleton<T>(token: InjectionToken<T>, registration: ServiceRegistration<T>): Result<T, ContainerError>
  private resolveTransient<T>(token: InjectionToken<T>, registration: ServiceRegistration<T>): Result<T, ContainerError>
  private resolveScoped<T>(token: InjectionToken<T>, registration: ServiceRegistration<T>): Result<T, ContainerError>

  // 3. Service-Instanziierung
  private instantiateService<T>(token: InjectionToken<T>, registration: ServiceRegistration<T>): Result<T, ContainerError>

  // 4. Performance-Tracking (via PerformanceTracker)
  // 5. Metrics-Recording (via MetricsCollector)
}
```

**Probleme:**
- Resolution-Logik und Lifecycle-Management sind vermischt
- Lifecycle-Strategien sind fest eingebaut (nicht austauschbar)
- Performance-Tracking und Metrics sind im Resolver eingebettet
- Schwer testbar (mehrere Concerns)

---

## Ziel-Architektur

### 1. ServiceResolver (Core Resolution)
**Verantwortlichkeit:** Nur Service-Resolution und Alias-Auflösung

```typescript
export class ServiceResolver {
  /**
   * Löst einen Service auf.
   * Delegiert Lifecycle-Management an LifecycleResolver.
   */
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError> {
    // 1. Alias-Resolution
    // 2. LifecycleResolver.resolve() aufrufen
  }
}
```

### 2. LifecycleResolver (Lifecycle-Management)
**Verantwortlichkeit:** Nur Lifecycle-spezifische Resolution

```typescript
export interface LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    resolver: ServiceResolver
  ): Result<T, ContainerError>
}

export class SingletonResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    resolver: ServiceResolver
  ): Result<T, ContainerError> {
    // Singleton-Logik
  }
}

export class TransientResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    resolver: ServiceResolver
  ): Result<T, ContainerError> {
    // Transient-Logik
  }
}

export class ScopedResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    resolver: ServiceResolver
  ): Result<T, ContainerError> {
    // Scoped-Logik
  }
}

export class LifecycleResolver {
  private readonly strategies = new Map<ServiceLifecycle, LifecycleResolutionStrategy>()

  constructor(
    private readonly cache: InstanceCache,
    private readonly parentResolver: ServiceResolver | null,
    private readonly scopeName: string
  ) {
    this.strategies.set(ServiceLifecycle.SINGLETON, new SingletonResolutionStrategy())
    this.strategies.set(ServiceLifecycle.TRANSIENT, new TransientResolutionStrategy())
    this.strategies.set(ServiceLifecycle.SCOPED, new ScopedResolutionStrategy())
  }

  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    resolver: ServiceResolver
  ): Result<T, ContainerError> {
    const strategy = this.strategies.get(registration.lifecycle)
    if (!strategy) {
      return err({ /* InvalidLifecycle */ })
    }
    return strategy.resolve(token, registration, resolver)
  }
}
```

### 3. ServiceInstantiator (Service-Instanziierung)
**Verantwortlichkeit:** Nur Service-Instanziierung

```typescript
export class ServiceInstantiator {
  constructor(private readonly resolver: ServiceResolver) {}

  instantiate<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>
  ): Result<T, ContainerError> {
    if (registration.serviceClass) {
      // Class: Resolve dependencies and instantiate
    } else if (registration.factory) {
      // Factory: Call factory
    } else if (registration.value !== undefined) {
      // Value: Return as-is
    }
  }
}
```

---

## Schritt-für-Schritt Migration

### Phase 1: LifecycleResolver extrahieren

1. **LifecycleResolutionStrategy Interface erstellen:**
   ```typescript
   // src/infrastructure/di/resolution/lifecycle-resolution-strategy.interface.ts
   export interface LifecycleResolutionStrategy {
     resolve<T>(
       token: InjectionToken<T>,
       registration: ServiceRegistration<T>,
       resolver: ServiceResolver,
       cache: InstanceCache,
       parentResolver: ServiceResolver | null,
       scopeName: string
     ): Result<T, ContainerError>
   }
   ```

2. **Strategien implementieren:**
   ```typescript
   // src/infrastructure/di/resolution/strategies/singleton-resolution-strategy.ts
   export class SingletonResolutionStrategy implements LifecycleResolutionStrategy {
     resolve<T>(
       token: InjectionToken<T>,
       registration: ServiceRegistration<T>,
       resolver: ServiceResolver,
       cache: InstanceCache,
       parentResolver: ServiceResolver | null,
       scopeName: string
     ): Result<T, ContainerError> {
       // Singleton-Logik aus ServiceResolver.resolveSingleton()
     }
   }

   // Analog für TransientResolutionStrategy und ScopedResolutionStrategy
   ```

3. **LifecycleResolver erstellen:**
   ```typescript
   // src/infrastructure/di/resolution/lifecycle-resolver.ts
   export class LifecycleResolver {
     private readonly strategies = new Map<ServiceLifecycle, LifecycleResolutionStrategy>()

     constructor(
       private readonly cache: InstanceCache,
       private readonly parentResolver: ServiceResolver | null,
       private readonly scopeName: string
     ) {
       this.strategies.set(ServiceLifecycle.SINGLETON, new SingletonResolutionStrategy())
       this.strategies.set(ServiceLifecycle.TRANSIENT, new TransientResolutionStrategy())
       this.strategies.set(ServiceLifecycle.SCOPED, new ScopedResolutionStrategy())
     }

     resolve<T>(
       token: InjectionToken<T>,
       registration: ServiceRegistration<T>,
       resolver: ServiceResolver
     ): Result<T, ContainerError> {
       const strategy = this.strategies.get(registration.lifecycle)
       if (!strategy) {
         return err({
           code: "InvalidLifecycle",
           message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
           tokenDescription: String(token),
         })
       }
       return strategy.resolve(token, registration, resolver, this.cache, this.parentResolver, this.scopeName)
     }
   }
   ```

### Phase 2: ServiceInstantiator extrahieren

1. **ServiceInstantiator erstellen:**
   ```typescript
   // src/infrastructure/di/resolution/service-instantiator.ts
   export class ServiceInstantiator {
     constructor(private readonly resolver: ServiceResolver) {}

     instantiate<T>(
       token: InjectionToken<T>,
       registration: ServiceRegistration<T>
     ): Result<T, ContainerError> {
       if (registration.serviceClass) {
         // Class: Resolve dependencies
         const resolvedDeps: unknown[] = []
         for (const dep of registration.dependencies) {
           const depResult = this.resolver.resolve(dep)
           if (!depResult.ok) {
             return err({
               code: "DependencyResolveFailed",
               message: `Cannot resolve dependency ${String(dep)} for ${String(token)}`,
               tokenDescription: String(dep),
               cause: depResult.error,
             })
           }
           resolvedDeps.push(depResult.value)
         }

         // Instantiate
         try {
           return ok(new registration.serviceClass(...resolvedDeps))
         } catch (constructorError) {
           return err({
             code: "FactoryFailed",
             message: `Constructor failed for ${String(token)}: ${String(constructorError)}`,
             tokenDescription: String(token),
             cause: constructorError,
           })
         }
       } else if (registration.factory) {
         // Factory: Call factory
         try {
           return ok(registration.factory())
         } catch (factoryError) {
           return err({
             code: "FactoryFailed",
             message: `Factory failed for ${String(token)}: ${String(factoryError)}`,
             tokenDescription: String(token),
             cause: factoryError,
           })
         }
       } else if (registration.value !== undefined) {
         // Value: Return as-is
         return ok(registration.value)
       } else {
         return err({
           code: "InvalidOperation",
           message: `Invalid registration for ${String(token)} - no class, factory, or value`,
           tokenDescription: String(token),
         })
       }
     }
   }
   ```

### Phase 3: ServiceResolver refactoren

1. **Dependencies injizieren:**
   ```typescript
   export class ServiceResolver {
     private readonly lifecycleResolver: LifecycleResolver
     private readonly instantiator: ServiceInstantiator

     constructor(
       private readonly registry: ServiceRegistry,
       private readonly cache: InstanceCache,
       private readonly parentResolver: ServiceResolver | null,
       private readonly scopeName: string,
       private readonly performanceTracker: PerformanceTracker
     ) {
       this.lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName)
       this.instantiator = new ServiceInstantiator(this)
     }
   }
   ```

2. **resolve() vereinfachen:**
   ```typescript
   resolve<T>(token: InjectionToken<T>): Result<T, ContainerError> {
     return this.performanceTracker.track(
       () => {
         // Check if service is registered
         const registration = this.registry.getRegistration(token)
         if (!registration) {
           return err({ /* TokenNotRegistered */ })
         }

         // Handle alias resolution
         if (registration.providerType === "alias" && registration.aliasTarget) {
           return this.resolve(registration.aliasTarget)
         }

         // Delegate to LifecycleResolver
         return this.lifecycleResolver.resolve(token, registration, this)
       },
       (duration, result) => {
         this.metricsCollector?.recordResolution(token, duration, result.ok)
       }
     )
   }
   ```

3. **Alte Methoden entfernen:**
   - `resolveSingleton()` → `SingletonResolutionStrategy`
   - `resolveTransient()` → `TransientResolutionStrategy`
   - `resolveScoped()` → `ScopedResolutionStrategy`
   - `instantiateService()` → `ServiceInstantiator`

---

## Breaking Changes

### API-Änderungen

1. **ServiceResolver:**
   - ✅ Keine öffentlichen API-Änderungen
   - ✅ Nur interne Refaktorierung

2. **Neue Abhängigkeiten:**
   - `ServiceResolver` erstellt `LifecycleResolver` und `ServiceInstantiator` intern

### Migration für externe Nutzer

**Keine Breaking Changes** - API bleibt stabil.

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Austauschbarkeit**: Lifecycle-Strategien können ausgetauscht werden
3. ✅ **Bessere Testbarkeit**: Lifecycle-Management und Instanziierung isoliert testbar
4. ✅ **Klarere Struktur**: Separation of Concerns
5. ✅ **Einfachere Wartung**: Änderungen an Lifecycle-Logik betreffen nur Strategy

---

## Risiken

1. **Niedrig**: Nur interne Refaktorierung
2. **Niedrig**: Keine öffentlichen API-Änderungen
3. **Niedrig**: Tests müssen angepasst werden
4. **Mittel**: Zirkuläre Dependency zwischen ServiceResolver und LifecycleResolver (lösbar durch Interface)

---

## Erweiterte Möglichkeiten

### Custom Lifecycle-Strategien

```typescript
// Beispiel: Request-Scoped Lifecycle
export class RequestScopedResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(...): Result<T, ContainerError> {
    // Request-spezifische Logik
  }
}
```

---

## Checkliste

- [ ] `LifecycleResolutionStrategy` Interface erstellen
- [ ] `SingletonResolutionStrategy` implementieren
- [ ] `TransientResolutionStrategy` implementieren
- [ ] `ScopedResolutionStrategy` implementieren
- [ ] `LifecycleResolver` erstellen
- [ ] `ServiceInstantiator` erstellen
- [ ] `ServiceResolver` refactoren
- [ ] Alte Lifecycle-Methoden entfernen
- [ ] `instantiateService()` entfernen
- [ ] Unit-Tests für `LifecycleResolver` schreiben
- [ ] Unit-Tests für `ServiceInstantiator` schreiben
- [ ] Unit-Tests für `ServiceResolver` aktualisieren
- [ ] Integration-Tests aktualisieren
- [ ] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/infrastructure/di/resolution/ServiceResolver.ts`
- **ServiceRegistry:** `src/infrastructure/di/registry/ServiceRegistry.ts`
- **InstanceCache:** `src/infrastructure/di/cache/InstanceCache.ts`
- **ServiceLifecycle:** `src/infrastructure/di/types/core/servicelifecycle.ts`

