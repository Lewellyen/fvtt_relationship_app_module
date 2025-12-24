---
principle: ISP
severity: medium
confidence: high
component_kind: interface
component_name: "Container"
file: "src/infrastructure/di/interfaces.ts"
location:
  start_line: 123
  end_line: 322
tags: ["interface", "segregation", "fat-interface", "container"]
---

# Problem

Das `Container`-Interface vereint mehrere verschiedene Verantwortlichkeiten in einer einzigen Schnittstelle: Service-Registrierung, Service-Auflösung, Validierung, Scope-Management, Disposal und API-Sicherheit. Dies verletzt das Interface Segregation Principle, da Clients gezwungen sind, von Methoden abzuhängen, die sie möglicherweise nicht benötigen.

## Evidence

```123:322:src/infrastructure/di/interfaces.ts
export interface Container {
  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass<T>(
    token: InjectionToken<T>,
    serviceClass: ServiceClass<T>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError>;

  /**
   * Register a factory function that creates service instances.
   */
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
    lifecycle: ServiceLifecycle,
    dependencies?: ServiceDependencies
  ): Result<void, ContainerError>;

  /**
   * Register a pre-created instance as a singleton service.
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): Result<void, ContainerError>;

  /**
   * Resolve a service instance by its injection token.
   */
  resolve<T>(token: InjectionToken<T>): T;

  /**
   * Resolve a service instance with explicit error handling.
   */
  resolveWithError<T>(token: InjectionToken<T>): Result<T, ContainerError>;

  /**
   * Validate the container's dependency graph.
   */
  validate(): Result<void, ContainerError[]>;

  /**
   * Get the current validation state of the container.
   */
  getValidationState(): ContainerValidationState;

  /**
   * Create a child container with its own scope.
   */
  createScope(scopeName?: string): Result<Container, ContainerError>;

  /**
   * Dispose of the container and all registered services.
   */
  dispose(): Result<void, ContainerError>;

  /**
   * Dispose of the container and all registered services asynchronously.
   */
  disposeAsync(): Promise<Result<void, ContainerError>>;

  /**
   * Check if a token is registered in this container.
   */
  isRegistered<T>(token: InjectionToken<T>): Result<boolean, never>;

  /**
   * Get API-safe token information for external API exposure.
   */
  getApiSafeToken<T>(token: ApiSafeToken<T>): { description: string; isRegistered: boolean } | null;
}
```

Das Interface enthält **12 Methoden** mit folgenden Verantwortlichkeitsbereichen:

1. **Service Registration** (3 Methoden): `registerClass()`, `registerFactory()`, `registerInstance()`
2. **Service Resolution** (2 Methoden): `resolve()`, `resolveWithError()`
3. **Validation** (2 Methoden): `validate()`, `getValidationState()`
4. **Scope Management** (1 Methode): `createScope()`
5. **Lifecycle Management** (2 Methoden): `dispose()`, `disposeAsync()`
6. **Query Operations** (2 Methoden): `isRegistered()`, `getApiSafeToken()`

## Impact

- **Tight Coupling**: Clients müssen das gesamte Interface implementieren, auch wenn sie nur einen Teil benötigen
- **Schwierige Mocking/Testing**: Test-Mocks müssen alle 12 Methoden implementieren
- **Verletzung des Interface Segregation Principle**: Clients sollten nicht gezwungen werden, von Interfaces abzuhängen, die sie nicht verwenden
- **Reduzierte Flexibilität**: Erschwert die Erstellung spezialisierter Container-Varianten (z.B. read-only Container)

## Recommendation

**Option 1: Interface Segregation (Empfohlen)**

Trenne das `Container`-Interface in mehrere spezialisierte Interfaces:

```typescript
// Service Registration
export interface ServiceRegistrar {
  registerClass<T>(token: InjectionToken<T>, serviceClass: ServiceClass<T>, lifecycle: ServiceLifecycle): Result<void, ContainerError>;
  registerFactory<T>(token: InjectionToken<T>, factory: FactoryFunction<T>, lifecycle: ServiceLifecycle, dependencies?: ServiceDependencies): Result<void, ContainerError>;
  registerInstance<T>(token: InjectionToken<T>, instance: T): Result<void, ContainerError>;
}

// Service Resolution
export interface ServiceResolver {
  resolve<T>(token: InjectionToken<T>): T;
  resolveWithError<T>(token: InjectionToken<T>): Result<T, ContainerError>;
}

// Validation
export interface ContainerValidator {
  validate(): Result<void, ContainerError[]>;
  getValidationState(): ContainerValidationState;
}

// Scope Management
export interface ScopeManager {
  createScope(scopeName?: string): Result<Container, ContainerError>;
}

// Lifecycle Management
export interface Disposable {
  dispose(): Result<void, ContainerError>;
  disposeAsync(): Promise<Result<void, ContainerError>>;
}

// Query Operations
export interface ContainerQuery {
  isRegistered<T>(token: InjectionToken<T>): Result<boolean, never>;
  getApiSafeToken<T>(token: ApiSafeToken<T>): { description: string; isRegistered: boolean } | null;
}

// Composite Interface
export interface Container extends ServiceRegistrar, ServiceResolver, ContainerValidator, ScopeManager, Disposable, ContainerQuery {}
```

**Option 2: Facade-Pattern beibehalten (Alternative)**

Falls die vollständige Segregation zu komplex ist, könnte das bestehende Facade-Pattern beibehalten werden, aber für spezialisierte Use-Cases könnten kleinere Interfaces angeboten werden:

```typescript
// Read-only Container für Consumer
export interface ReadOnlyContainer extends ServiceResolver, ContainerQuery {}

// Builder für Container-Konfiguration
export interface ContainerBuilder extends ServiceRegistrar, ContainerValidator {}
```

## Example Fix

**Schrittweise Migration:**

1. Neue Interfaces einführen (parallel zu bestehendem Container-Interface)
2. ServiceContainer implementiert alle neuen Interfaces
3. Internen Code schrittweise auf spezialisierte Interfaces umstellen
4. Externe API kann weiterhin Container-Interface verwenden

```typescript
// ServiceContainer implementiert alle Interfaces
export class ServiceContainer implements
  ServiceRegistrar,
  ServiceResolver,
  ContainerValidator,
  ScopeManager,
  Disposable,
  ContainerQuery {

  // Implementierung bleibt gleich, nur Interfaces werden getrennt
}

// Für interne Verwendung können spezialisierte Interfaces verwendet werden
function registerServices(registrar: ServiceRegistrar) {
  registrar.registerClass(LoggerToken, Logger, SINGLETON);
}

function resolveService<T>(resolver: ServiceResolver, token: InjectionToken<T>): T {
  return resolver.resolve(token);
}
```

## Notes

- **Aktuelle Implementierung**: `ServiceContainer` implementiert bereits `Container` und `PlatformContainerPort` - beide könnten von den neuen Interfaces erben
- **Backward Compatibility**: Das bestehende `Container`-Interface kann als Composite-Interface beibehalten werden
- **Facade-Pattern**: Der ServiceContainer ist bereits als Facade implementiert, die Segregation wäre eine logische Erweiterung
- **PlatformContainerPort**: Dieses Interface könnte ebenfalls von den neuen Interfaces erben, um Konsistenz zu gewährleisten

