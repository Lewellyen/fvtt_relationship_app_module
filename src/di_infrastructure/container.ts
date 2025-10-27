import type { InjectionToken } from "./types/injectiontoken";
import type { ServiceFactory } from "./types/servicefactory";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import type { ServiceType } from "@/types/servicetypeindex";

/**
 * Dependency injection container that manages service lifecycles.
 * Supports Singleton, Transient, and Scoped service patterns with hierarchical container support.
 * 
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * container.register(LoggerToken, () => new Logger(), ServiceLifecycle.SINGLETON);
 * const logger = container.resolve(LoggerToken);
 * ```
 */
export class ServiceContainer {

  #serviceRegistrations: Map<InjectionToken<ServiceType>, { factory: ServiceFactory<ServiceType>, lifecycle: ServiceLifecycle }> = new Map();
  #serviceInstances: Map<InjectionToken<ServiceType>, ServiceType> = new Map();
  readonly #parentContainer: ServiceContainer | null = null;

  /**
   * Creates a new service container.
   * If a parent container is provided, creates a scoped child container.
   * 
   * @param parentContainer - Optional parent container for hierarchical DI
   * 
   * @example
   * ```typescript
   * // Root container
   * const root = new ServiceContainer();
   * 
   * // Scoped container (child)
   * const scope = new ServiceContainer(root);
   * ```
   */
  constructor(parentContainer: ServiceContainer | null = null) {
    if (parentContainer !== null) {
      this.#serviceRegistrations = new Map(parentContainer.#serviceRegistrations);
      this.#serviceInstances = new Map(); // Child-Container hat leere Instanzen
      this.#parentContainer = parentContainer;
    }
  }

  /**
   * Create a child container with its own scope.
   * Inherits service registrations from parent but maintains separate scoped instances.
   * 
   * @returns A new scoped container
   * 
   * @example
   * ```typescript
   * const rootContainer = new ServiceContainer();
   * const scopedContainer = rootContainer.createScope();
   * ```
   */
  createScope(): ServiceContainer {
    return new ServiceContainer(this);
  }

  /**
   * Check if a service is registered.
   * Recursively checks the entire parent container hierarchy from root to this container.
   * 
   * @template TServiceType - The type of service
   * @param token - The injection token to check
   * @returns true if registered in this container or any parent container
   * 
   * @example
   * ```typescript
   * const root = new ServiceContainer();
   * const scope1 = root.createScope();
   * const scope2 = scope1.createScope();
   * 
   * root.register(LoggerToken, () => new Logger(), SINGLETON);
   * scope2.isRegistered(LoggerToken); // ✅ true (found in root)
   * ```
   */
  isRegistered<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): boolean {
    if (this.#parentContainer !== null) {
      return this.#parentContainer.isRegistered(token);
    }
    return this.#serviceRegistrations.has(token);
  }

  /**
   * Dispose this container and clean up all scoped instances.
   * Services implementing Disposable will have their dispose() method called automatically.
   * Root container clearing requires manual clear() call.
   * 
   * @example
   * ```typescript
   * const scope = container.createScope();
   * const db = scope.resolve(DatabaseToken); // Implements Disposable
   * 
   * // ... Arbeit ...
   * 
   * scope.dispose(); // db.dispose() wird automatisch aufgerufen
   * ```
   */
  dispose(): void {
    // Dispose all scoped instances that implement Disposable
    for (const [token , instance] of this.#serviceInstances.entries()) {
      if (this.isDisposable(instance)) {
        try {
          instance.dispose();
        } catch (error) {
          console.error(`Error disposing service ${String(token)}:`, error);
        }
      }
    }
    
    // Clear all instances
    this.#serviceInstances.clear();
  }

  /**
   * Check if an instance implements IDisposable
   */
  private isDisposable(instance: ServiceType): instance is ServiceType & { dispose: () => void } {
    return 'dispose' in instance && typeof (instance as { dispose: unknown }).dispose === 'function';
  }

  /**
   * Clear all service registrations and instances.
   * Use with caution - this will remove all configured services.
   * Note: dispose() should be used for scoped containers instead.
   */
  clear(): void {
    this.#serviceRegistrations.clear();
    this.#serviceInstances.clear();
  }

  /**
   * Register a service factory with the container.
   * 
   * @template TServiceType - The type of service to register
   * @param token - The injection token that identifies this service
   * @param factory - Factory function that creates the service instance
   * @param lifecycle - Service lifecycle strategy (SINGLETON, TRANSIENT, or SCOPED)
   * @throws Error if service is already registered
   * 
   * @example
   * ```typescript
   * container.register(LoggerToken, () => new Logger(), ServiceLifecycle.SINGLETON);
   * container.register(DatabaseToken, () => new Database(), ServiceLifecycle.SCOPED);
   * ```
   */
  register<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>, factory: ServiceFactory<TServiceType>, lifecycle: ServiceLifecycle): void {
    if (this.#serviceRegistrations.has(token)) {
      throw new Error(`Service ${String(token)} already registered`);
    }
    this.#serviceRegistrations.set(token, { factory, lifecycle });
  }

  /**
   * Resolve a service instance from the container.
   * 
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns The service instance
   * @throws Error if service is not registered
   * @throws Error if scoped service is resolved without a scope container
   * 
   * @example
   * ```typescript
   * const logger = container.resolve(LoggerToken);
   * ```
   */
  resolve<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): TServiceType {
    if (!this.isRegistered(token)) {
      throw new Error(`Service ${String(token)} not registered`);
    }
    const service = this.#serviceRegistrations.get(token);
    if (!service) {
      throw new Error(`Service ${String(token)} not registered`);
    }
    switch (service.lifecycle) {
      case ServiceLifecycle.SINGLETON:
        // Singleton: Check Parent first (für Child-Container)
        if (this.#parentContainer !== null) {
          return this.#parentContainer.resolve(token);
        }
        // Singleton: Check current container
        if (!this.#serviceInstances.has(token)) {
          this.#serviceInstances.set(token, service.factory() as TServiceType);
        }
        return this.#serviceInstances.get(token) as TServiceType;
        
      case ServiceLifecycle.TRANSIENT:
        // Transient: Immer neu erstellen
        return service.factory() as TServiceType;
        
      case ServiceLifecycle.SCOPED:
        // Scoped: Nur in Child-Container erlaubt
        if (this.#parentContainer === null) {
          throw new Error(`Scoped service ${String(token)} requires a scope container`);
        }
        // Scoped: Einmal pro Scope (dieser Container ist der Scope)
        if (!this.#serviceInstances.has(token)) {
          this.#serviceInstances.set(token, service.factory() as TServiceType);
        }
        return this.#serviceInstances.get(token) as TServiceType;
        
      default:
        throw new Error(`Invalid service lifecycle ${String(service.lifecycle)}`);
    }
  }
}