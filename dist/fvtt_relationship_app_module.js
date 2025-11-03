var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const originalAssignRef = Object.assign;
if (!(originalAssignRef && originalAssignRef.__cy_careful_patch)) {
  const patched = /* @__PURE__ */ __name(function(target, ...sources) {
    const filteredSources = sources.map((source) => {
      if (source == null) return source;
      const out = {};
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          out[key] = source[key];
        }
      }
      return out;
    });
    try {
      return originalAssignRef(target, ...filteredSources);
    } catch {
      for (const src of filteredSources) {
        if (src != null) {
          for (const k in src) {
            try {
              target[k] = src[k];
            } catch {
            }
          }
        }
      }
      return target;
    }
  }, "patched");
  patched.__cy_careful_patch = true;
  Object.assign = patched;
}
const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen"
  },
  LOG_PREFIX: "Foundry VTT Relationship App Module |",
  FLAGS: {
    HIDDEN: "hidden"
  },
  HOOKS: {
    RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",
    INIT: "init",
    READY: "ready"
  },
  DEFAULTS: {
    UNKNOWN_NAME: "Unknown"
  }
};
function ok(value) {
  return { ok: true, value };
}
__name(ok, "ok");
function err(error) {
  return { ok: false, error };
}
__name(err, "err");
function isOk(result) {
  return result.ok;
}
__name(isOk, "isOk");
function isErr(result) {
  return !result.ok;
}
__name(isErr, "isErr");
function map(result, transform) {
  return result.ok ? ok(transform(result.value)) : result;
}
__name(map, "map");
function mapError(result, transform) {
  return result.ok ? result : err(transform(result.error));
}
__name(mapError, "mapError");
function andThen(result, next) {
  return result.ok ? next(result.value) : result;
}
__name(andThen, "andThen");
function unwrapOr(result, fallbackValue) {
  return result.ok ? result.value : fallbackValue;
}
__name(unwrapOr, "unwrapOr");
function unwrapOrElse(result, getFallback) {
  return result.ok ? result.value : getFallback(result.error);
}
__name(unwrapOrElse, "unwrapOrElse");
function getOrThrow(result, toError) {
  if (result.ok) return result.value;
  const e = toError ? toError(result.error) : new Error(String(result.error));
  throw e;
}
__name(getOrThrow, "getOrThrow");
function tryCatch(fn, mapUnknownError) {
  try {
    return ok(fn());
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}
__name(tryCatch, "tryCatch");
function all(results) {
  const out = [];
  for (const r of results) {
    if (!r.ok) return r;
    out.push(r.value);
  }
  return ok(out);
}
__name(all, "all");
function match(result, handlers) {
  return result.ok ? handlers.onOk(result.value) : handlers.onErr(result.error);
}
__name(match, "match");
function lift(fn, mapUnknownError) {
  return (param) => tryCatch(() => fn(param), mapUnknownError);
}
__name(lift, "lift");
async function asyncMap(asyncResult, transform) {
  const result = await asyncResult;
  return result.ok ? ok(await transform(result.value)) : result;
}
__name(asyncMap, "asyncMap");
async function asyncAndThen(asyncResult, next) {
  const result = await asyncResult;
  return result.ok ? next(result.value) : result;
}
__name(asyncAndThen, "asyncAndThen");
async function fromPromise(promise, mapUnknownError) {
  try {
    return ok(await promise);
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}
__name(fromPromise, "fromPromise");
async function asyncAll(asyncResults) {
  const results = await Promise.all(asyncResults);
  return all(results);
}
__name(asyncAll, "asyncAll");
function createInjectionToken(description) {
  return Symbol(description);
}
__name(createInjectionToken, "createInjectionToken");
const foundryGameToken = createInjectionToken("FoundryGame");
const foundryHooksToken = createInjectionToken("FoundryHooks");
const foundryDocumentToken = createInjectionToken("FoundryDocument");
const foundryUIToken = createInjectionToken("FoundryUI");
const portSelectorToken = createInjectionToken("PortSelector");
const foundryGamePortRegistryToken = createInjectionToken("FoundryGamePortRegistry");
const foundryHooksPortRegistryToken = createInjectionToken("FoundryHooksPortRegistry");
const foundryDocumentPortRegistryToken = createInjectionToken("FoundryDocumentPortRegistry");
const foundryUIPortRegistryToken = createInjectionToken("FoundryUIPortRegistry");
const loggerToken = createInjectionToken("Logger");
const journalVisibilityServiceToken = createInjectionToken(
  "JournalVisibilityService"
);
var ServiceLifecycle = /* @__PURE__ */ ((ServiceLifecycle2) => {
  ServiceLifecycle2["SINGLETON"] = "singleton";
  ServiceLifecycle2["TRANSIENT"] = "transient";
  ServiceLifecycle2["SCOPED"] = "scoped";
  return ServiceLifecycle2;
})(ServiceLifecycle || {});
const _ServiceRegistration = class _ServiceRegistration {
  /**
   * Private constructor - use static factory methods instead.
   * This prevents direct construction with invalid parameters
   * and ensures Result-based error handling.
   */
  constructor(lifecycle, dependencies, providerType, serviceClass, factory, value, aliasTarget) {
    this.lifecycle = lifecycle;
    this.dependencies = dependencies;
    this.providerType = providerType;
    this.serviceClass = serviceClass;
    this.factory = factory;
    this.value = value;
    this.aliasTarget = aliasTarget;
  }
  /**
   * Creates a class-based registration.
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param serviceClass - The class to instantiate
   * @returns Result with registration or validation error
   */
  static createClass(lifecycle, dependencies, serviceClass) {
    if (!serviceClass) {
      return err({
        code: "InvalidOperation",
        message: "serviceClass is required for class registration"
      });
    }
    return ok(
      new _ServiceRegistration(
        lifecycle,
        dependencies,
        "class",
        serviceClass,
        void 0,
        void 0,
        void 0
      )
    );
  }
  /**
   * Creates a factory-based registration.
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param factory - Factory function that creates instances
   * @returns Result with registration or validation error
   */
  static createFactory(lifecycle, dependencies, factory) {
    if (!factory) {
      return err({
        code: "InvalidOperation",
        message: "factory is required for factory registration"
      });
    }
    return ok(
      new _ServiceRegistration(
        lifecycle,
        dependencies,
        "factory",
        void 0,
        factory,
        void 0,
        void 0
      )
    );
  }
  /**
   * Creates a value-based registration (always SINGLETON).
   * @param value - The value to register
   * @returns Result with registration or validation error
   */
  static createValue(value) {
    if (value === void 0) {
      return err({
        code: "InvalidOperation",
        message: "value cannot be undefined for value registration"
      });
    }
    if (typeof value === "function") {
      return err({
        code: "InvalidOperation",
        message: "registerValue() only accepts plain values, not functions or classes. Use registerClass() or registerFactory() instead."
      });
    }
    return ok(
      new _ServiceRegistration(ServiceLifecycle.SINGLETON, [], "value", void 0, void 0, value, void 0)
    );
  }
  /**
   * Creates an alias registration (always SINGLETON).
   * @param targetToken - The token to resolve instead
   * @returns Result with registration or validation error
   */
  static createAlias(targetToken) {
    if (!targetToken) {
      return err({
        code: "InvalidOperation",
        message: "targetToken is required for alias registration"
      });
    }
    return ok(
      new _ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [targetToken],
        "alias",
        void 0,
        void 0,
        void 0,
        targetToken
      )
    );
  }
  /**
   * Creates a clone of this registration.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new ServiceRegistration instance with cloned dependencies array
   */
  clone() {
    return new _ServiceRegistration(
      this.lifecycle,
      [...this.dependencies],
      // Clone array to prevent shared mutations
      this.providerType,
      this.serviceClass,
      this.factory,
      this.value,
      this.aliasTarget
    );
  }
};
__name(_ServiceRegistration, "ServiceRegistration");
let ServiceRegistration = _ServiceRegistration;
const _ServiceRegistry = class _ServiceRegistry {
  constructor() {
    this.registrations = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a service class with automatic dependency injection.
   *
   * @template TServiceType - The type of service to register
   * @param token - The injection token identifying this service
   * @param serviceClass - The class to instantiate
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @returns Result indicating success or error
   */
  registerClass(token, serviceClass, lifecycle) {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const dependencies = serviceClass.dependencies ?? [];
    const registrationResult = ServiceRegistration.createClass(
      lifecycle,
      dependencies,
      serviceClass
    );
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    return ok(void 0);
  }
  /**
   * Registers a factory function for creating service instances.
   *
   * @template TServiceType - The type of service this factory creates
   * @param token - The injection token identifying this service
   * @param factory - Factory function that creates instances
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or error
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const registrationResult = ServiceRegistration.createFactory(lifecycle, dependencies, factory);
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    return ok(void 0);
  }
  /**
   * Registers a constant value (always SINGLETON lifecycle).
   *
   * @template TServiceType - The type of value to register
   * @param token - The injection token identifying this value
   * @param value - The value to register
   * @returns Result indicating success or error
   */
  registerValue(token, value) {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const registrationResult = ServiceRegistration.createValue(value);
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    return ok(void 0);
  }
  /**
   * Registers an alias that points to another token.
   *
   * @template TServiceType - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or error
   */
  registerAlias(aliasToken, targetToken) {
    if (this.registrations.has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken)
      });
    }
    const registrationResult = ServiceRegistration.createAlias(targetToken);
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(aliasToken, registrationResult.value);
    return ok(void 0);
  }
  /**
   * Retrieves a service registration.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token identifying the service
   * @returns The registration or undefined if not found
   */
  getRegistration(token) {
    return this.registrations.get(token);
  }
  /**
   * Returns all registrations.
   * Used by ContainerValidator for dependency validation.
   *
   * @returns Map of all registrations
   */
  getAllRegistrations() {
    return new Map(this.registrations);
  }
  /**
   * Checks if a service is registered.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token to check
   * @returns True if registered, false otherwise
   */
  has(token) {
    return this.registrations.has(token);
  }
  /**
   * Clears all registrations.
   * Warning: This removes all configured services.
   */
  clear() {
    this.registrations.clear();
  }
  /**
   * Creates a deep clone of this registry for child containers.
   *
   * Important: Creates a new Map instance with cloned ServiceRegistration objects
   * to prevent child containers from mutating parent registrations.
   *
   * @returns A new ServiceRegistry with cloned registrations
   */
  clone() {
    const clonedRegistry = new _ServiceRegistry();
    for (const [token, registration] of this.registrations.entries()) {
      clonedRegistry.registrations.set(token, registration.clone());
    }
    return clonedRegistry;
  }
};
__name(_ServiceRegistry, "ServiceRegistry");
let ServiceRegistry = _ServiceRegistry;
const _ContainerValidator = class _ContainerValidator {
  constructor() {
    this.validatedSubgraphs = /* @__PURE__ */ new Set();
  }
  /**
   * Validates all registrations in the registry.
   *
   * Performs three checks:
   * 1. All dependencies are registered
   * 2. All alias targets exist
   * 3. No circular dependencies
   *
   * @param registry - The service registry to validate
   * @returns Result with void on success, or array of errors
   */
  validate(registry) {
    this.validatedSubgraphs = /* @__PURE__ */ new Set();
    const errors = [
      ...this.validateDependencies(registry),
      ...this.validateAliasTargets(registry),
      ...this.detectCircularDependencies(registry)
    ];
    return errors.length > 0 ? err(errors) : ok(void 0);
  }
  /**
   * Checks that all declared dependencies are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing dependencies
   */
  validateDependencies(registry) {
    const errors = [];
    const registrations = registry.getAllRegistrations();
    for (const [token, registration] of registrations.entries()) {
      for (const dep of registration.dependencies) {
        if (!registry.has(dep)) {
          errors.push({
            code: "TokenNotRegistered",
            message: `${String(token)} depends on ${String(dep)} which is not registered`,
            tokenDescription: String(dep)
          });
        }
      }
    }
    return errors;
  }
  /**
   * Checks that all alias targets are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing alias targets
   */
  validateAliasTargets(registry) {
    const errors = [];
    const registrations = registry.getAllRegistrations();
    for (const [token, registration] of registrations.entries()) {
      if (registration.providerType === "alias" && registration.aliasTarget) {
        if (!registry.has(registration.aliasTarget)) {
          errors.push({
            code: "AliasTargetNotFound",
            message: `Alias ${String(token)} points to ${String(registration.aliasTarget)} which is not registered`,
            tokenDescription: String(registration.aliasTarget)
          });
        }
      }
    }
    return errors;
  }
  /**
   * Detects circular dependencies using depth-first search.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for detected cycles
   */
  detectCircularDependencies(registry) {
    const errors = [];
    const visited = /* @__PURE__ */ new Set();
    const registrations = registry.getAllRegistrations();
    for (const token of registrations.keys()) {
      const visiting = /* @__PURE__ */ new Set();
      const path = [];
      const error = this.checkCycleForToken(registry, token, visiting, visited, path);
      if (error) {
        errors.push(error);
      }
    }
    return errors;
  }
  /**
   * Recursively checks for cycles starting from a specific token.
   *
   * Uses DFS with visiting/visited sets to detect back edges (cycles).
   * Performance optimization: Uses Set cache to skip already-validated sub-graphs.
   *
   * @param registry - The service registry
   * @param token - Current token being checked
   * @param visiting - Set of tokens in current DFS path
   * @param visited - Set of tokens already fully processed
   * @param path - Current path for error reporting
   * @returns ContainerError if cycle detected, null otherwise
   */
  checkCycleForToken(registry, token, visiting, visited, path) {
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token)
      };
    }
    if (this.validatedSubgraphs.has(token)) {
      return null;
    }
    if (visited.has(token)) {
      return null;
    }
    visiting.add(token);
    path.push(token);
    const registration = registry.getRegistration(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(registry, dep, visiting, visited, path);
        if (error) return error;
      }
    }
    visiting.delete(token);
    path.pop();
    visited.add(token);
    this.validatedSubgraphs.add(token);
    return null;
  }
};
__name(_ContainerValidator, "ContainerValidator");
let ContainerValidator = _ContainerValidator;
const _InstanceCache = class _InstanceCache {
  constructor() {
    this.instances = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves a cached service instance.
   *
   * @template TServiceType - The type of service to retrieve
   * @param token - The injection token identifying the service
   * @returns The cached instance or undefined if not found
   */
  get(token) {
    return this.instances.get(token);
  }
  /**
   * Stores a service instance in the cache.
   *
   * @template TServiceType - The type of service to store
   * @param token - The injection token identifying the service
   * @param instance - The service instance to cache
   */
  set(token, instance) {
    this.instances.set(token, instance);
  }
  /**
   * Checks if a service instance is cached.
   *
   * @template TServiceType - The type of service to check
   * @param token - The injection token identifying the service
   * @returns True if the instance is cached, false otherwise
   */
  has(token) {
    return this.instances.has(token);
  }
  /**
   * Clears all cached instances.
   * Note: Does not dispose instances - call getAllInstances() first if disposal is needed.
   */
  clear() {
    this.instances.clear();
  }
  /**
   * Returns all cached instances for disposal purposes.
   * Used by ScopeManager to dispose Disposable services.
   *
   * @returns A map of all cached instances
   */
  getAllInstances() {
    return new Map(this.instances);
  }
};
__name(_InstanceCache, "InstanceCache");
let InstanceCache = _InstanceCache;
const _ServiceResolver = class _ServiceResolver {
  constructor(registry, cache, parentResolver, scopeName) {
    this.registry = registry;
    this.cache = cache;
    this.parentResolver = parentResolver;
    this.scopeName = scopeName;
  }
  /**
   * Resolves a service by token.
   *
   * Handles:
   * - Alias resolution (recursive)
   * - Lifecycle-specific resolution (Singleton/Transient/Scoped)
   * - Parent delegation for Singletons
   * - Factory error wrapping
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve(token) {
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      return err({
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token)
      });
    }
    if (registration.providerType === "alias" && registration.aliasTarget) {
      return this.resolve(registration.aliasTarget);
    }
    switch (registration.lifecycle) {
      case ServiceLifecycle.SINGLETON:
        return this.resolveSingleton(token, registration);
      case ServiceLifecycle.TRANSIENT:
        return this.resolveTransient(token, registration);
      case ServiceLifecycle.SCOPED:
        return this.resolveScoped(token, registration);
      default:
        return err({
          code: "InvalidLifecycle",
          message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
          tokenDescription: String(token)
        });
    }
  }
  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Handles dependency resolution for classes, direct factory calls, and value returns.
   *
   * @template TServiceType - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiateService(token, registration) {
    if (registration.serviceClass) {
      const resolvedDeps = [];
      for (const dep of registration.dependencies) {
        const depResult = this.resolve(dep);
        if (!depResult.ok) {
          return err({
            code: "DependencyResolveFailed",
            message: `Cannot resolve dependency ${String(dep)} for ${String(token)}`,
            tokenDescription: String(dep),
            cause: depResult.error
          });
        }
        resolvedDeps.push(depResult.value);
      }
      try {
        return ok(new registration.serviceClass(...resolvedDeps));
      } catch (constructorError) {
        return err({
          code: "FactoryFailed",
          message: `Constructor failed for ${String(token)}: ${String(constructorError)}`,
          tokenDescription: String(token),
          cause: constructorError
        });
      }
    } else if (registration.factory) {
      try {
        return ok(registration.factory());
      } catch (factoryError) {
        return err({
          code: "FactoryFailed",
          message: `Factory failed for ${String(token)}: ${String(factoryError)}`,
          tokenDescription: String(token),
          cause: factoryError
        });
      }
    } else if (registration.value !== void 0) {
      return ok(registration.value);
    } else {
      return err({
        code: "InvalidOperation",
        message: `Invalid registration for ${String(token)} - no class, factory, or value`,
        tokenDescription: String(token)
      });
    }
  }
  /**
   * Resolves a Singleton service.
   *
   * Strategy:
   * 1. Try parent resolver first (for shared parent singletons)
   * 2. If parent returns error:
   *    - CircularDependency → propagate error
   *    - TokenNotRegistered → fallback to own cache (child-specific singleton)
   * 3. Use own cache for root container or child-specific singletons
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with instance or error
   */
  resolveSingleton(token, registration) {
    if (this.parentResolver !== null) {
      const parentResult = this.parentResolver.resolve(token);
      if (parentResult.ok) {
        return parentResult;
      }
      if (parentResult.error.code === "CircularDependency") {
        return parentResult;
      }
    }
    if (!this.cache.has(token)) {
      const instanceResult = this.instantiateService(token, registration);
      if (!instanceResult.ok) {
        return instanceResult;
      }
      this.cache.set(token, instanceResult.value);
    }
    return ok(this.cache.get(token));
  }
  /**
   * Resolves a Transient service.
   *
   * Strategy:
   * - Always create new instance (no caching)
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with new instance
   */
  resolveTransient(token, registration) {
    return this.instantiateService(token, registration);
  }
  /**
   * Resolves a Scoped service.
   *
   * Strategy:
   * - Must be in child scope (not root)
   * - One instance per scope (cached)
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with scoped instance
   */
  resolveScoped(token, registration) {
    if (this.parentResolver === null) {
      return err({
        code: "ScopeRequired",
        message: `Scoped service ${String(token)} requires a scope container`,
        tokenDescription: String(token)
      });
    }
    if (!this.cache.has(token)) {
      const instanceResult = this.instantiateService(token, registration);
      if (!instanceResult.ok) {
        return instanceResult;
      }
      this.cache.set(token, instanceResult.value);
    }
    return ok(this.cache.get(token));
  }
};
__name(_ServiceResolver, "ServiceResolver");
let ServiceResolver = _ServiceResolver;
function generateScopeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now() + "-" + Math.random();
  }
}
__name(generateScopeId, "generateScopeId");
const _ScopeManager = class _ScopeManager {
  constructor(scopeName, parent, cache) {
    this.scopeName = scopeName;
    this.parent = parent;
    this.cache = cache;
    this.children = /* @__PURE__ */ new Set();
    this.disposed = false;
  }
  /**
   * Creates a child scope manager.
   *
   * Note: Returns data (scopeName, cache, childManager) instead of full container
   * to avoid circular dependency with ServiceResolver.
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child scope data or error if disposed
   */
  createChild(name) {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Cannot create child scope from disposed scope: ${this.scopeName}`
      });
    }
    const uniqueId = name ?? `scope-${generateScopeId()}`;
    const childScopeName = `${this.scopeName}.${uniqueId}`;
    const childCache = new InstanceCache();
    const childManager = new _ScopeManager(childScopeName, this, childCache);
    this.children.add(childManager);
    return ok({
      scopeName: childScopeName,
      cache: childCache,
      manager: childManager
    });
  }
  /**
   * Disposes this scope and all child scopes.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children
   * 2. Dispose instances in this scope (if Disposable)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Result indicating success or disposal error
   */
  dispose() {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`
      });
    }
    this.disposed = true;
    for (const child of this.children) {
      const childResult = child.dispose();
      if (isErr(childResult)) {
        console.warn(`Failed to dispose child scope ${child.scopeName}:`, childResult.error);
      }
    }
    const disposeResult = this.disposeInstances();
    if (!disposeResult.ok) {
      return disposeResult;
    }
    this.cache.clear();
    if (this.parent !== null) {
      this.parent.children.delete(this);
    }
    return ok(void 0);
  }
  /**
   * Disposes all instances in the cache that implement Disposable.
   *
   * @returns Result indicating success or disposal error
   */
  disposeInstances() {
    const instances = this.cache.getAllInstances();
    for (const [token, instance] of instances.entries()) {
      if (this.isDisposable(instance)) {
        const result = tryCatch(
          () => instance.dispose(),
          (error) => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error
          })
        );
        if (isErr(result)) {
          return result;
        }
      }
    }
    return ok(void 0);
  }
  /**
   * Type guard to check if an instance implements the Disposable pattern.
   *
   * Checks for:
   * - dispose() method (function)
   * - Future: Symbol.dispose support
   *
   * @param instance - The service instance to check
   * @returns True if instance has dispose() method
   */
  isDisposable(instance) {
    return "dispose" in instance && typeof instance.dispose === "function";
  }
  /**
   * Checks if this scope is disposed.
   *
   * @returns True if disposed, false otherwise
   */
  isDisposed() {
    return this.disposed;
  }
  /**
   * Gets the hierarchical scope name.
   *
   * @returns The scope name (e.g., "root.child1.grandchild")
   */
  getScopeName() {
    return this.scopeName;
  }
};
__name(_ScopeManager, "ScopeManager");
let ScopeManager = _ScopeManager;
const fallbackFactories = /* @__PURE__ */ new Map();
function registerFallback(token, factory) {
  fallbackFactories.set(token, factory);
}
__name(registerFallback, "registerFallback");
const _ServiceContainer = class _ServiceContainer {
  /**
   * Private constructor - use ServiceContainer.createRoot() instead.
   *
   * This constructor is private to:
   * - Enforce factory pattern usage
   * - Prevent constructor throws (Result-Contract-breaking)
   * - Make child creation explicit through createScope()
   *
   * @param registry - Service registry
   * @param validator - Container validator (shared for parent/child)
   * @param cache - Instance cache
   * @param resolver - Service resolver
   * @param scopeManager - Scope manager
   * @param validationState - Initial validation state
   */
  constructor(registry, validator, cache, resolver, scopeManager, validationState) {
    this.registry = registry;
    this.validator = validator;
    this.cache = cache;
    this.resolver = resolver;
    this.scopeManager = scopeManager;
    this.validationState = validationState;
  }
  /**
   * Creates a new root container.
   *
   * This is the preferred way to create containers.
   * All components are created fresh for the root container.
   *
   * @returns A new root ServiceContainer
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot();
   * container.registerClass(LoggerToken, Logger, SINGLETON);
   * container.validate();
   * ```
   */
  static createRoot() {
    const registry = new ServiceRegistry();
    const validator = new ContainerValidator();
    const cache = new InstanceCache();
    const scopeManager = new ScopeManager("root", null, cache);
    const resolver = new ServiceResolver(registry, cache, null, "root");
    return new _ServiceContainer(registry, validator, cache, resolver, scopeManager, "registering");
  }
  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass(token, serviceClass, lifecycle) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerClass(token, serviceClass, lifecycle);
  }
  /**
   * Register a factory function.
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerFactory(token, factory, lifecycle, dependencies);
  }
  /**
   * Register a constant value.
   */
  registerValue(token, value) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerValue(token, value);
  }
  /**
   * Register an alias.
   */
  registerAlias(aliasToken, targetToken) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(aliasToken)
      });
    }
    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerAlias(aliasToken, targetToken);
  }
  /**
   * Validate all registrations.
   */
  validate() {
    if (this.validationState === "validated") {
      return ok(void 0);
    }
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress"
        }
      ]);
    }
    this.validationState = "validating";
    const result = this.validator.validate(this.registry);
    if (result.ok) {
      this.validationState = "validated";
    } else {
      this.validationState = "registering";
    }
    return result;
  }
  /**
   * Get validation state.
   */
  getValidationState() {
    return this.validationState;
  }
  /**
   * Creates a child scope container.
   *
   * Child containers:
   * - Inherit parent registrations (cloned)
   * - Can add their own registrations
   * - Must call validate() before resolving
   * - Share parent's singleton instances
   * - Have isolated scoped instances
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child container or error
   *
   * @example
   * ```typescript
   * const parent = ServiceContainer.createRoot();
   * parent.registerClass(LoggerToken, Logger, SINGLETON);
   * parent.validate();
   *
   * const child = parent.createScope("request").value!;
   * child.registerClass(RequestToken, RequestContext, SCOPED);
   * child.validate();
   *
   * const logger = child.resolve(LoggerToken);   // From parent (shared)
   * const ctx = child.resolve(RequestToken);      // From child (isolated)
   * ```
   */
  createScope(name) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container`
      });
    }
    if (this.validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first."
      });
    }
    const scopeResult = this.scopeManager.createChild(name);
    if (!scopeResult.ok) {
      return err(scopeResult.error);
    }
    const childRegistry = this.registry.clone();
    const childCache = scopeResult.value.cache;
    const childManager = scopeResult.value.manager;
    const childResolver = new ServiceResolver(
      childRegistry,
      childCache,
      this.resolver,
      // Parent resolver for singleton delegation
      scopeResult.value.scopeName
    );
    const child = new _ServiceContainer(
      childRegistry,
      this.validator,
      // Shared (stateless)
      childCache,
      childResolver,
      childManager,
      "registering"
      // FIX: Child starts in registering state, not validated!
    );
    return ok(child);
  }
  /**
   * Resolve service with Result return.
   */
  resolveWithError(token) {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot resolve from disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token)
      });
    }
    return this.resolver.resolve(token);
  }
  /**
   * Resolve service (throwing version with fallback support).
   */
  resolve(token) {
    const result = this.resolveWithError(token);
    if (isOk(result)) {
      return result.value;
    }
    const fallback = fallbackFactories.get(token);
    if (fallback) {
      return fallback();
    }
    throw new Error(
      `Cannot resolve ${String(token)}: ${result.error.message}. No fallback factory registered for this token.`
    );
  }
  /**
   * Check if service is registered.
   */
  isRegistered(token) {
    return ok(this.registry.has(token));
  }
  /**
   * Dispose container and all children.
   */
  dispose() {
    const result = this.scopeManager.dispose();
    if (result.ok) {
      this.validationState = "registering";
    }
    return result;
  }
  /**
   * Clear all registrations and instances.
   *
   * IMPORTANT: Resets validation state (per review feedback).
   */
  clear() {
    this.registry.clear();
    this.cache.clear();
    this.validationState = "registering";
    return ok(void 0);
  }
};
__name(_ServiceContainer, "ServiceContainer");
let ServiceContainer = _ServiceContainer;
const _ConsoleLoggerService = class _ConsoleLoggerService {
  /**
   * Log a message to console
   * @param message - Message to log
   * @param optionalParams - Additional data to log (objects will be interactive in browser console)
   */
  log(message, ...optionalParams) {
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log an error message
   * @param message - Error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, stack traces)
   */
  error(message, ...optionalParams) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message, ...optionalParams) {
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message, ...optionalParams) {
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting complex objects)
   */
  debug(message, ...optionalParams) {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
_ConsoleLoggerService.dependencies = [];
let ConsoleLoggerService = _ConsoleLoggerService;
const _JournalVisibilityService = class _JournalVisibilityService {
  constructor(game2, document, ui, logger2) {
    this.game = game2;
    this.document = document;
    this.ui = ui;
    this.logger = logger2;
  }
  /**
   * Gets journal entries marked as hidden via module flag.
   * Logs warnings for entries where flag reading fails to aid diagnosis.
   */
  getHiddenJournalEntries() {
    const allEntriesResult = this.game.getJournalEntries();
    if (!allEntriesResult.ok) return allEntriesResult;
    const hidden = [];
    for (const journal of allEntriesResult.value) {
      const flagResult = this.document.getFlag(
        journal,
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.FLAGS.HIDDEN
      );
      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
      } else {
        this.logger.warn(
          `Failed to read hidden flag for journal "${journal.name ?? journal.id}": ${flagResult.error}`
        );
      }
    }
    return { ok: true, value: hidden };
  }
  /**
   * Processes journal directory HTML to hide flagged entries.
   */
  processJournalDirectory(htmlElement) {
    this.logger.debug("Processing journal directory for hidden entries");
    const hiddenResult = this.getHiddenJournalEntries();
    match(hiddenResult, {
      onOk: /* @__PURE__ */ __name((hidden) => {
        this.logger.debug(`Found ${hidden.length} hidden journal entries`);
        this.hideEntries(hidden, htmlElement);
      }, "onOk"),
      onErr: /* @__PURE__ */ __name((error) => {
        this.logger.error(`Error getting hidden journal entries: ${error}`);
      }, "onErr")
    });
  }
  hideEntries(entries, html) {
    for (const journal of entries) {
      const removeResult = this.ui.removeJournalElement(
        journal.id,
        journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
        html
      );
      match(removeResult, {
        onOk: /* @__PURE__ */ __name(() => {
          this.logger.debug(
            `Removing journal entry: ${journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME}`
          );
        }, "onOk"),
        onErr: /* @__PURE__ */ __name((error) => {
          this.logger.warn(`Error removing journal entry: ${error}`);
        }, "onErr")
      });
    }
  }
};
__name(_JournalVisibilityService, "JournalVisibilityService");
_JournalVisibilityService.dependencies = [
  foundryGameToken,
  foundryDocumentToken,
  foundryUIToken,
  loggerToken
];
let JournalVisibilityService = _JournalVisibilityService;
function getFoundryVersion() {
  if (typeof game === "undefined") {
    throw new Error("Foundry game object is not available or version cannot be determined");
  }
  const versionString = game.version;
  if (!versionString) {
    throw new Error("Foundry version is not available on the game object");
  }
  const match2 = versionString.match(/^(\d+)/);
  if (!match2) {
    throw new Error(`Could not parse Foundry version from: ${versionString}`);
  }
  return Number.parseInt(match2[1], 10);
}
__name(getFoundryVersion, "getFoundryVersion");
function tryGetFoundryVersion() {
  try {
    return getFoundryVersion();
  } catch {
    return void 0;
  }
}
__name(tryGetFoundryVersion, "tryGetFoundryVersion");
const _PortSelector = class _PortSelector {
  /**
   * Selects the appropriate port from available ports based on Foundry version.
   * Returns the highest available port version that is <= the Foundry version.
   *
   * @template T - The port type
   * @param availablePorts - Map of version numbers to port implementations
   * @param foundryVersion - Optional Foundry version (will be detected if not provided)
   * @returns Result containing the selected port or an error message
   *
   * @example
   * ```typescript
   * const ports = new Map([
   *   [13, new FoundryGamePortV13()],
   *   [14, new FoundryGamePortV14()]
   * ]);
   * const selector = new PortSelector();
   * const result = selector.selectPort(ports);
   * // On Foundry v14: selects v14 port
   * // On Foundry v13: selects v13 port
   * ```
   */
  selectPort(availablePorts, foundryVersion) {
    let version;
    try {
      version = foundryVersion ?? getFoundryVersion();
    } catch (error) {
      return err(
        `Could not determine Foundry version: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    let selectedPort;
    let selectedVersion = -1;
    for (const [portVersion, port] of availablePorts.entries()) {
      if (portVersion > version) {
        continue;
      }
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedPort = port;
      }
    }
    if (selectedPort === void 0) {
      const availableVersions = Array.from(availablePorts.keys()).sort((a, b) => a - b).join(", ");
      return err(
        `No compatible port found for Foundry version ${version}. Available ports: ${availableVersions || "none"}`
      );
    }
    return ok(selectedPort);
  }
};
__name(_PortSelector, "PortSelector");
let PortSelector = _PortSelector;
const _PortRegistry = class _PortRegistry {
  constructor() {
    this.factories = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a port factory for a specific Foundry version.
   * @param version - The Foundry version this port supports
   * @param factory - Factory function that creates the port instance
   * @returns Result indicating success or duplicate registration error
   */
  register(version, factory) {
    if (this.factories.has(version)) {
      return err(`PortRegistry: version ${version} already registered`);
    }
    this.factories.set(version, factory);
    return ok(void 0);
  }
  /**
   * Gets all registered port versions.
   * @returns Array of registered version numbers, sorted ascending
   */
  getAvailableVersions() {
    return Array.from(this.factories.keys()).sort((a, b) => a - b);
  }
  /**
   * Creates all registered ports. Used for port selection.
   * @returns Map of version numbers to port instances
   */
  createAll() {
    const ports = /* @__PURE__ */ new Map();
    for (const [version, factory] of this.factories.entries()) {
      ports.set(version, factory());
    }
    return ports;
  }
  /**
   * Gets available port instances for version selection.
   * Alias for createAll() with clearer semantics for PortSelector usage.
   * @returns Map of version numbers to port instances
   */
  getAvailablePorts() {
    return this.createAll();
  }
  /**
   * Creates only the port for the specified version or the highest compatible version.
   * More efficient than createAll() when only one port is needed.
   * @param version - The target Foundry version
   * @returns Result containing the port instance or error
   */
  createForVersion(version) {
    const compatibleVersions = Array.from(this.factories.keys()).filter((v) => v <= version).sort((a, b) => b - a);
    if (compatibleVersions.length === 0) {
      const availableVersions = this.getAvailableVersions().join(", ");
      return err(
        `No compatible port for Foundry v${version}. Available ports: ${availableVersions || "none"}`
      );
    }
    const selectedVersion = compatibleVersions[0];
    if (selectedVersion === void 0) {
      return err("No compatible version found");
    }
    const factory = this.factories.get(selectedVersion);
    if (!factory) {
      return err(`Factory not found for version ${selectedVersion}`);
    }
    return ok(factory());
  }
  /**
   * Checks if a port is registered for a specific version.
   * @param version - The version to check
   * @returns True if a port is registered for this version
   */
  hasVersion(version) {
    return this.factories.has(version);
  }
  /**
   * Gets the highest registered port version.
   * @returns The highest version number or undefined if no ports are registered
   */
  getHighestVersion() {
    const versions = this.getAvailableVersions();
    return versions.length > 0 ? versions[versions.length - 1] : void 0;
  }
};
__name(_PortRegistry, "PortRegistry");
let PortRegistry = _PortRegistry;
const _FoundryGameService = class _FoundryGameService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector for centralized version selection logic.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const availablePorts = this.portRegistry.getAvailablePorts();
      const portResult = this.portSelector.selectPort(availablePorts);
      if (!portResult.ok) {
        return err(`Failed to select FoundryGame port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  getJournalEntries() {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }
  getJournalEntryById(id) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntryById(id);
  }
};
__name(_FoundryGameService, "FoundryGameService");
_FoundryGameService.dependencies = [portSelectorToken, foundryGamePortRegistryToken];
let FoundryGameService = _FoundryGameService;
const _FoundryHooksService = class _FoundryHooksService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector for centralized version selection logic.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const availablePorts = this.portRegistry.getAvailablePorts();
      const portResult = this.portSelector.selectPort(availablePorts);
      if (!portResult.ok) {
        return err(`Failed to select FoundryHooks port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  on(hookName, callback) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.on(hookName, callback);
  }
  off(hookName, callback) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.off(hookName, callback);
  }
};
__name(_FoundryHooksService, "FoundryHooksService");
_FoundryHooksService.dependencies = [portSelectorToken, foundryHooksPortRegistryToken];
let FoundryHooksService = _FoundryHooksService;
const _FoundryDocumentService = class _FoundryDocumentService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector for centralized version selection logic.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const availablePorts = this.portRegistry.getAvailablePorts();
      const portResult = this.portSelector.selectPort(availablePorts);
      if (!portResult.ok) {
        return err(`Failed to select FoundryDocument port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  getFlag(document, scope, key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getFlag(document, scope, key);
  }
  async setFlag(document, scope, key, value) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return await portResult.value.setFlag(document, scope, key, value);
  }
};
__name(_FoundryDocumentService, "FoundryDocumentService");
_FoundryDocumentService.dependencies = [portSelectorToken, foundryDocumentPortRegistryToken];
let FoundryDocumentService = _FoundryDocumentService;
const _FoundryUIService = class _FoundryUIService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector for centralized version selection logic.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const availablePorts = this.portRegistry.getAvailablePorts();
      const portResult = this.portSelector.selectPort(availablePorts);
      if (!portResult.ok) {
        return err(`Failed to select FoundryUI port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  removeJournalElement(journalId, journalName, html) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.removeJournalElement(journalId, journalName, html);
  }
  findElement(container, selector) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.findElement(container, selector);
  }
};
__name(_FoundryUIService, "FoundryUIService");
_FoundryUIService.dependencies = [portSelectorToken, foundryUIPortRegistryToken];
let FoundryUIService = _FoundryUIService;
const _FoundryGamePortV13 = class _FoundryGamePortV13 {
  getJournalEntries() {
    if (typeof game === "undefined" || !game?.journal) {
      return err("Foundry game API not available");
    }
    return tryCatch(
      () => {
        const entries = Array.from(game.journal.contents);
        return entries;
      },
      (error) => `Failed to get journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  getJournalEntryById(id) {
    if (typeof game === "undefined" || !game?.journal) {
      return err("Foundry game API not available");
    }
    return tryCatch(
      () => {
        const entry = game.journal.get(id);
        return entry ?? null;
      },
      (error) => `Failed to get journal entry by ID ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
__name(_FoundryGamePortV13, "FoundryGamePortV13");
let FoundryGamePortV13 = _FoundryGamePortV13;
const _FoundryHooksPortV13 = class _FoundryHooksPortV13 {
  on(hookName, callback) {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        Hooks.on(hookName, callback);
      },
      (error) => `Failed to register hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  off(hookName, callback) {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        Hooks.off(
          hookName,
          callback
        );
      },
      (error) => `Failed to unregister hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
__name(_FoundryHooksPortV13, "FoundryHooksPortV13");
let FoundryHooksPortV13 = _FoundryHooksPortV13;
const _FoundryDocumentPortV13 = class _FoundryDocumentPortV13 {
  getFlag(document, scope, key) {
    return tryCatch(
      () => {
        if (!document?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const value = document.getFlag(scope, key);
        return value ?? null;
      },
      (error) => `Failed to get flag ${scope}.${key}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  async setFlag(document, scope, key, value) {
    return fromPromise(
      (async () => {
        if (!document?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document.setFlag(scope, key, value);
      })(),
      (error) => `Failed to set flag ${scope}.${key}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
__name(_FoundryDocumentPortV13, "FoundryDocumentPortV13");
let FoundryDocumentPortV13 = _FoundryDocumentPortV13;
const _FoundryUIPortV13 = class _FoundryUIPortV13 {
  removeJournalElement(journalId, journalName, html) {
    const element = html.querySelector(
      `li.directory-item[data-entry-id="${journalId}"]`
    );
    if (!element) {
      return err(`Could not find element for journal entry: ${journalName} (${journalId})`);
    }
    element.remove();
    return ok(void 0);
  }
  findElement(container, selector) {
    const element = container.querySelector(selector);
    return ok(element);
  }
};
__name(_FoundryUIPortV13, "FoundryUIPortV13");
let FoundryUIPortV13 = _FoundryUIPortV13;
function configureDependencies(container) {
  registerFallback(loggerToken, () => new ConsoleLoggerService());
  const loggerResult = container.registerClass(
    loggerToken,
    ConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register logger: ${loggerResult.error.message}`);
  }
  const portSelectorResult = container.registerFactory(
    portSelectorToken,
    () => new PortSelector(),
    ServiceLifecycle.SINGLETON,
    []
  );
  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }
  const portRegistrationErrors = [];
  const gamePortRegistry = new PortRegistry();
  const gamePortRegResult = gamePortRegistry.register(13, () => new FoundryGamePortV13());
  if (isErr(gamePortRegResult)) {
    portRegistrationErrors.push(`FoundryGame v13: ${gamePortRegResult.error}`);
  }
  const hooksPortRegistry = new PortRegistry();
  const hooksPortRegResult = hooksPortRegistry.register(13, () => new FoundryHooksPortV13());
  if (isErr(hooksPortRegResult)) {
    portRegistrationErrors.push(`FoundryHooks v13: ${hooksPortRegResult.error}`);
  }
  const documentPortRegistry = new PortRegistry();
  const documentPortRegResult = documentPortRegistry.register(
    13,
    () => new FoundryDocumentPortV13()
  );
  if (isErr(documentPortRegResult)) {
    portRegistrationErrors.push(`FoundryDocument v13: ${documentPortRegResult.error}`);
  }
  const uiPortRegistry = new PortRegistry();
  const uiPortRegResult = uiPortRegistry.register(13, () => new FoundryUIPortV13());
  if (isErr(uiPortRegResult)) {
    portRegistrationErrors.push(`FoundryUI v13: ${uiPortRegResult.error}`);
  }
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }
  const gameRegistryResult = container.registerValue(
    foundryGamePortRegistryToken,
    gamePortRegistry
  );
  if (isErr(gameRegistryResult)) {
    return err(`Failed to register FoundryGame PortRegistry: ${gameRegistryResult.error.message}`);
  }
  const hooksRegistryResult = container.registerValue(
    foundryHooksPortRegistryToken,
    hooksPortRegistry
  );
  if (isErr(hooksRegistryResult)) {
    return err(
      `Failed to register FoundryHooks PortRegistry: ${hooksRegistryResult.error.message}`
    );
  }
  const documentRegistryResult = container.registerValue(
    foundryDocumentPortRegistryToken,
    documentPortRegistry
  );
  if (isErr(documentRegistryResult)) {
    return err(
      `Failed to register FoundryDocument PortRegistry: ${documentRegistryResult.error.message}`
    );
  }
  const uiRegistryResult = container.registerValue(foundryUIPortRegistryToken, uiPortRegistry);
  if (isErr(uiRegistryResult)) {
    return err(`Failed to register FoundryUI PortRegistry: ${uiRegistryResult.error.message}`);
  }
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    FoundryGameService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }
  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    FoundryHooksService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }
  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    FoundryDocumentService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }
  const uiServiceResult = container.registerClass(
    foundryUIToken,
    FoundryUIService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }
  const journalVisibilityResult = container.registerClass(
    journalVisibilityServiceToken,
    JournalVisibilityService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalVisibilityResult)) {
    return err(
      `Failed to register JournalVisibility service: ${journalVisibilityResult.error.message}`
    );
  }
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(void 0);
}
__name(configureDependencies, "configureDependencies");
const _CompositionRoot = class _CompositionRoot {
  constructor() {
    this.container = null;
  }
  /**
   * Erstellt den ServiceContainer und führt Basis-Registrierungen aus.
   * Misst Performance für Diagnose-Zwecke.
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap() {
    performance.mark("bootstrap-start");
    const container = ServiceContainer.createRoot();
    const configured = configureDependencies(container);
    performance.mark("bootstrap-end");
    performance.measure("bootstrap-duration", "bootstrap-start", "bootstrap-end");
    const measure = performance.getEntriesByName("bootstrap-duration")[0];
    if (measure) {
      console.debug(
        `${MODULE_CONSTANTS.LOG_PREFIX} Bootstrap completed in ${measure.duration.toFixed(2)}ms`
      );
    }
    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }
    return { ok: false, error: configured.error };
  }
  /**
   * Exponiert die öffentliche Modul-API unter game.modules.get(MODULE_ID).api.
   * Stellt resolve(), getAvailableTokens() und tokens bereit.
   * Darf erst nach erfolgreichem Bootstrap aufgerufen werden.
   * @throws Fehler, wenn das Foundry-Modul-Objekt nicht verfügbar ist
   */
  exposeToModuleApi() {
    const container = this.getContainerOrThrow();
    if (typeof game === "undefined" || !game?.modules) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Game modules not available`);
    }
    const mod = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    if (!mod) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Module not available to expose API`);
    }
    const wellKnownTokens = {
      loggerToken,
      journalVisibilityServiceToken,
      foundryGameToken,
      foundryHooksToken,
      foundryDocumentToken,
      foundryUIToken
    };
    const api = {
      resolve: /* @__PURE__ */ __name((token) => container.resolve(token), "resolve"),
      getAvailableTokens: /* @__PURE__ */ __name(() => {
        const tokenMap = /* @__PURE__ */ new Map();
        const tokenEntries = [
          ["loggerToken", loggerToken],
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken]
        ];
        for (const [, token] of tokenEntries) {
          const isRegisteredResult = container.isRegistered(token);
          tokenMap.set(token, {
            description: String(token).replace("Symbol(", "").replace(")", ""),
            isRegistered: isRegisteredResult.ok ? isRegisteredResult.value : false
          });
        }
        return tokenMap;
      }, "getAvailableTokens"),
      tokens: wellKnownTokens
    };
    mod.api = api;
  }
  /**
   * Liefert den initialisierten Container oder wirft einen Fehler, wenn noch nicht verfügbar.
   * @throws Fehler, wenn bootstrap noch nicht erfolgreich war
   */
  getContainerOrThrow() {
    if (!this.container) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Container not initialized`);
    }
    return this.container;
  }
};
__name(_CompositionRoot, "CompositionRoot");
let CompositionRoot = _CompositionRoot;
const _ModuleHookRegistrar = class _ModuleHookRegistrar {
  /**
   * Registriert alle benötigten Hooks.
   * @param container DI-Container mit final gebundenen Ports und Services
   */
  registerAll(container) {
    const foundryHooks = container.resolve(foundryHooksToken);
    const logger2 = container.resolve(loggerToken);
    const journalVisibility = container.resolve(journalVisibilityServiceToken);
    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      (app, html) => {
        logger2.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);
        const htmlElement = html;
        if (!htmlElement) {
          logger2.error("Failed to get HTMLElement from hook");
          return;
        }
        journalVisibility.processJournalDirectory(htmlElement);
      }
    );
    if (!hookResult.ok) {
      logger2.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook: ${hookResult.error}`
      );
    }
  }
};
__name(_ModuleHookRegistrar, "ModuleHookRegistrar");
let ModuleHookRegistrar = _ModuleHookRegistrar;
function initializeModule() {
}
__name(initializeModule, "initializeModule");
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);
if (!bootstrapOk) {
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} bootstrap failed`);
  console.error(bootstrapResult.error);
  throw new Error(bootstrapResult.error);
}
const logger = root.getContainerOrThrow().resolve(loggerToken);
if (typeof Hooks === "undefined") {
  logger.warn("Foundry Hooks API not available - module initialization skipped");
} else {
  Hooks.on("init", () => {
    logger.info("init-phase");
    root.exposeToModuleApi();
    new ModuleHookRegistrar().registerAll(root.getContainerOrThrow());
    logger.info("init-phase completed");
  });
  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
}
//# sourceMappingURL=fvtt_relationship_app_module.js.map
