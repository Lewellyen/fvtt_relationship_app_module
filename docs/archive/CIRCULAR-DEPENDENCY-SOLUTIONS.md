# Lösungsansätze für Zirkuläre Abhängigkeiten im ServiceResolver

**Erstellt:** 2025-01-XX
**Zweck:** Dokumentation verschiedener Ansätze zur Auflösung zirkulärer Abhängigkeiten

---

## Problem

Aktuell existieren folgende zirkuläre Abhängigkeiten:

1. **ServiceResolver → ServiceInstantiator → ServiceResolver**
   - `ServiceInstantiator` braucht `ServiceResolver.resolve()` für Dependency-Resolution
   - `ServiceResolver` erstellt `ServiceInstantiator` im Constructor

2. **ServiceResolver → LifecycleResolver → ServiceResolver**
   - `LifecycleResolver` übergibt `ServiceResolver` an Strategien
   - Strategien brauchen `ServiceResolver.instantiateService()` (private Methode)

---

## Lösungsansätze

### Ansatz 1: Dependency Resolution Interface ⭐ (Empfohlen)

**Prinzip:** Dependency Inversion - Abhängigkeit von Abstraktion statt Konkretion

**Implementierung:**

```typescript
// src/infrastructure/di/resolution/dependency-resolver.interface.ts
export interface DependencyResolver {
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError>;
}

// ServiceInstantiator nutzt Interface statt ServiceResolver
export class ServiceInstantiator {
  constructor(private readonly dependencyResolver: DependencyResolver) {}

  instantiate<T>(...): Result<T, ContainerError> {
    // Nutzt dependencyResolver.resolve() statt resolver.resolve()
    const depResult = this.dependencyResolver.resolve(dep);
  }
}

// ServiceResolver implementiert Interface
export class ServiceResolver implements DependencyResolver {
  constructor(...) {
    // Übergibt sich selbst als DependencyResolver
    this.instantiator = new ServiceInstantiator(this);
  }
}
```

**Vorteile:**
- ✅ Keine zirkuläre Dependency (Interface bricht Zyklus)
- ✅ Klare Abstraktion
- ✅ Einfach zu testen (Mock-Interface)
- ✅ Folgt Dependency Inversion Principle

**Nachteile:**
- ⚠️ Zusätzliches Interface nötig
- ⚠️ ServiceResolver muss Interface implementieren

---

### Ansatz 2: Service Instantiation Interface

**Prinzip:** Interface für Service-Instanziierung, das Strategien nutzen

**Implementierung:**

```typescript
// src/infrastructure/di/resolution/service-instantiation.interface.ts
export interface ServiceInstantiator {
  instantiate<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>
  ): Result<T, ContainerError>;
}

// ServiceResolver implementiert Interface
export class ServiceResolver implements ServiceInstantiator {
  private instantiateService<T>(...): Result<T, ContainerError> {
    return this.instantiator.instantiate(token, registration);
  }
}

// Strategien nutzen Interface statt ServiceResolver
export class SingletonResolutionStrategy {
  resolve<T>(
    ...,
    instantiator: ServiceInstantiator,  // Interface statt ServiceResolver
    ...
  ): Result<T, ContainerError> {
    const instanceResult = instantiator.instantiate(token, registration);
  }
}
```

**Vorteile:**
- ✅ Keine zirkuläre Dependency
- ✅ Klare Trennung von Concerns
- ✅ Strategien sind unabhängig von ServiceResolver

**Nachteile:**
- ⚠️ ServiceInstantiator-Klasse muss umbenannt werden (Name-Konflikt)
- ⚠️ Zwei Interfaces nötig (DependencyResolver + ServiceInstantiator)

---

### Ansatz 3: Callback/Function Injection

**Prinzip:** Statt ganzer Objekte nur benötigte Funktionen injizieren

**Implementierung:**

```typescript
// ServiceInstantiator bekommt resolve-Funktion
export class ServiceInstantiator {
  constructor(
    private readonly resolveDependency: <T>(token: InjectionToken<T>) => Result<T, ContainerError>
  ) {}

  instantiate<T>(...): Result<T, ContainerError> {
    const depResult = this.resolveDependency(dep);
  }
}

// ServiceResolver übergibt Funktion
export class ServiceResolver {
  constructor(...) {
    this.instantiator = new ServiceInstantiator(
      <T>(token: InjectionToken<T>) => this.resolve(token)
    );
  }
}

// Strategien bekommen instantiate-Funktion
export class SingletonResolutionStrategy {
  resolve<T>(
    ...,
    instantiate: <T>(token: InjectionToken<T>, reg: ServiceRegistration<T>) => Result<T, ContainerError>,
    ...
  ): Result<T, ContainerError> {
    const instanceResult = instantiate(token, registration);
  }
}
```

**Vorteile:**
- ✅ Keine zirkuläre Dependency
- ✅ Minimale Kopplung (nur Funktionen)
- ✅ Sehr flexibel

**Nachteile:**
- ⚠️ Weniger typsicher (Function-Types statt Interfaces)
- ⚠️ Schwerer zu mocken in Tests
- ⚠️ Weniger explizit (keine klare Abstraktion)

---

### Ansatz 4: Lazy Initialization

**Prinzip:** ServiceInstantiator und LifecycleResolver erst nach ServiceResolver-Erstellung initialisieren

**Implementierung:**

```typescript
export class ServiceResolver {
  private lifecycleResolver?: LifecycleResolver;
  private instantiator?: ServiceInstantiator;

  constructor(...) {
    // Nicht im Constructor initialisieren
  }

  private getLifecycleResolver(): LifecycleResolver {
    if (!this.lifecycleResolver) {
      this.lifecycleResolver = new LifecycleResolver(
        this.cache,
        this.parentResolver,
        this.scopeName
      );
    }
    return this.lifecycleResolver;
  }

  private getInstantiator(): ServiceInstantiator {
    if (!this.instantiator) {
      this.instantiator = new ServiceInstantiator(this);
    }
    return this.instantiator;
  }

  resolve<T>(...): Result<T, ContainerError> {
    return this.getLifecycleResolver().resolve(token, registration, this);
  }

  private instantiateService<T>(...): Result<T, ContainerError> {
    return this.getInstantiator().instantiate(token, registration);
  }
}
```

**Vorteile:**
- ✅ Keine zirkuläre Dependency zur Compile-Zeit
- ✅ Einfache Implementierung

**Nachteile:**
- ⚠️ Löst Problem nicht wirklich (nur verzögert)
- ⚠️ Zirkuläre Dependency bleibt zur Laufzeit
- ⚠️ Weniger klar (Lazy Initialization versteckt Dependencies)

---

### Ansatz 5: Dependency Injection Container Pattern

**Prinzip:** ServiceInstantiator und LifecycleResolver werden von außen injiziert

**Implementierung:**

```typescript
export class ServiceResolver {
  constructor(
    ...,
    lifecycleResolver: LifecycleResolver,
    instantiator: ServiceInstantiator
  ) {
    this.lifecycleResolver = lifecycleResolver;
    this.instantiator = instantiator;
  }
}

// Factory-Funktion erstellt alle Komponenten
export function createServiceResolver(
  registry: ServiceRegistry,
  cache: InstanceCache,
  parentResolver: ServiceResolver | null,
  scopeName: string,
  performanceTracker: PerformanceTracker
): ServiceResolver {
  // Zuerst ServiceResolver erstellen (ohne Dependencies)
  const resolver = new ServiceResolver(
    registry,
    cache,
    parentResolver,
    scopeName,
    performanceTracker,
    null as any, // Placeholder
    null as any  // Placeholder
  );

  // Dann Dependencies erstellen und setzen
  const instantiator = new ServiceInstantiator(resolver);
  const lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName);

  // Dependencies setzen (via private Setter oder Reflection)
  resolver["instantiator"] = instantiator;
  resolver["lifecycleResolver"] = lifecycleResolver;

  return resolver;
}
```

**Vorteile:**
- ✅ Klare Dependency-Graph
- ✅ Keine zirkuläre Dependency zur Compile-Zeit

**Nachteile:**
- ⚠️ Komplexe Factory-Logik
- ⚠️ Verwendet TypeScript-Tricks (as any, bracket notation)
- ⚠️ Weniger typsicher

---

## Empfehlung

**Ansatz 1: Dependency Resolution Interface** ist die beste Lösung:

1. ✅ Folgt SOLID-Prinzipien (Dependency Inversion)
2. ✅ Keine zirkulären Dependencies
3. ✅ Klare Abstraktion
4. ✅ Einfach zu testen
5. ✅ Minimal invasive Änderungen

**Kombination mit Ansatz 2** für vollständige Auflösung:

- `DependencyResolver` Interface für `ServiceInstantiator`
- `ServiceInstantiator` Interface für Strategien
- Beide Interfaces von `ServiceResolver` implementiert

---

## Migration

### Schritt 1: DependencyResolver Interface erstellen

```typescript
// src/infrastructure/di/resolution/dependency-resolver.interface.ts
export interface DependencyResolver {
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError>;
}
```

### Schritt 2: ServiceInstantiator anpassen

```typescript
export class ServiceInstantiator {
  constructor(private readonly dependencyResolver: DependencyResolver) {}
  // ... rest bleibt gleich
}
```

### Schritt 3: ServiceResolver anpassen

```typescript
export class ServiceResolver implements DependencyResolver {
  constructor(...) {
    this.instantiator = new ServiceInstantiator(this); // this als DependencyResolver
  }
}
```

### Schritt 4: ServiceInstantiator Interface für Strategien

```typescript
export interface ServiceInstantiator {
  instantiate<T>(...): Result<T, ContainerError>;
}

export class ServiceInstantiatorImpl implements ServiceInstantiator {
  // ... Implementierung
}

// Strategien nutzen Interface
export class SingletonResolutionStrategy {
  resolve<T>(
    ...,
    instantiator: ServiceInstantiator,  // Interface
    ...
  ): Result<T, ContainerError> {
    const instanceResult = instantiator.instantiate(token, registration);
  }
}
```

---

## Risiken

- **Niedrig**: Nur interne Refaktorierung
- **Niedrig**: Keine öffentlichen API-Änderungen
- **Niedrig**: Tests müssen angepasst werden (Interface-Mocks)

---

## Referenzen

- **Aktuelle Implementierung:** `src/infrastructure/di/resolution/`
- **Dependency Inversion Principle:** [SOLID Principles](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- **Circular Dependency Detection:** `src/infrastructure/di/validation/ContainerValidator.ts`

