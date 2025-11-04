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
  SETTINGS: {
    LOG_LEVEL: "logLevel"
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
const foundrySettingsToken = createInjectionToken("FoundrySettings");
const foundrySettingsPortRegistryToken = createInjectionToken("FoundrySettingsPortRegistry");
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
function hasDependencies(cls) {
  return "dependencies" in cls;
}
__name(hasDependencies, "hasDependencies");
const _ServiceRegistry = class _ServiceRegistry {
  constructor() {
    this.registrations = /* @__PURE__ */ new Map();
    this.lifecycleIndex = /* @__PURE__ */ new Map();
  }
  /**
   * Updates the lifecycle index when a service is registered.
   *
   * @param token - The injection token
   * @param lifecycle - The service lifecycle
   */
  updateLifecycleIndex(token, lifecycle) {
    if (!this.lifecycleIndex.has(lifecycle)) {
      this.lifecycleIndex.set(lifecycle, /* @__PURE__ */ new Set());
    }
    this.lifecycleIndex.get(lifecycle).add(token);
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
    const dependencies = hasDependencies(serviceClass) ? serviceClass.dependencies ?? [] : [];
    const registrationResult = ServiceRegistration.createClass(
      lifecycle,
      dependencies,
      serviceClass
    );
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, lifecycle);
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
    this.updateLifecycleIndex(token, lifecycle);
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
    this.updateLifecycleIndex(token, ServiceLifecycle.SINGLETON);
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
   * Returns all registrations for a specific lifecycle.
   * More efficient than filtering getAllRegistrations() when only one lifecycle is needed.
   *
   * @param lifecycle - The lifecycle to query
   * @returns Array of registrations with the specified lifecycle
   */
  getRegistrationsByLifecycle(lifecycle) {
    const tokens = this.lifecycleIndex.get(lifecycle) ?? /* @__PURE__ */ new Set();
    return Array.from(tokens).map((token) => this.registrations.get(token)).filter((reg) => reg !== void 0);
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
    this.lifecycleIndex.clear();
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
    for (const [lifecycle, tokens] of this.lifecycleIndex.entries()) {
      clonedRegistry.lifecycleIndex.set(lifecycle, new Set(tokens));
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
    const childDisposalErrors = [];
    for (const child of this.children) {
      const childResult = child.dispose();
      if (isErr(childResult)) {
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error
        });
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
    if (childDisposalErrors.length > 0) {
      return err({
        code: "PartialDisposal",
        message: `Failed to dispose ${childDisposalErrors.length} child scope(s)`,
        details: childDisposalErrors
      });
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
    this.fallbackFactories = /* @__PURE__ */ new Map();
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
    const fallback = this.fallbackFactories.get(token);
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
   * Register a fallback factory for a specific token.
   * This will be used when resolve() fails for that token.
   *
   * @param token - The injection token
   * @param factory - Factory function that creates a fallback instance
   *
   * @example
   * ```typescript
   * container.registerFallback(UserServiceToken, () => new DefaultUserService());
   * ```
   */
  registerFallback(token, factory) {
    this.fallbackFactories.set(token, factory);
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
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
const ENV = {
  isDevelopment: false,
  isProduction: true,
  logLevel: false ? 0 : 1,
  enablePerformanceTracking: false,
  enableDebugMode: false
};
const _ConsoleLoggerService = class _ConsoleLoggerService {
  constructor() {
    this.minLevel = LogLevel.INFO;
  }
  /**
   * Sets the minimum log level. Messages below this level will be ignored.
   * @param level - Minimum log level
   */
  setMinLevel(level) {
    this.minLevel = level;
  }
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
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message, ...optionalParams) {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message, ...optionalParams) {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting complex objects)
   */
  debug(message, ...optionalParams) {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
_ConsoleLoggerService.dependencies = [];
let ConsoleLoggerService = _ConsoleLoggerService;
const _JournalVisibilityService = class _JournalVisibilityService {
  constructor(game2, document2, ui2, logger) {
    this.game = game2;
    this.document = document2;
    this.ui = ui2;
    this.logger = logger;
  }
  /**
   * Sanitizes a string for safe use in log messages.
   * Escapes HTML entities to prevent log injection or display issues.
   *
   * @param input - The string to sanitize
   * @returns HTML-safe string
   */
  sanitizeForLog(input) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
        const journalIdentifier = journal.name ?? journal.id;
        this.logger.warn(
          `Failed to read hidden flag for journal "${this.sanitizeForLog(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            errorMessage: flagResult.error.message
          }
        );
        if (flagResult.error.code === "ACCESS_DENIED") {
          const notifyResult = this.ui.notify(
            "Some journal entries could not be accessed due to permissions",
            "warning"
          );
          if (!notifyResult.ok) {
            this.logger.warn("Failed to show UI notification", notifyResult.error);
          }
        }
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
        this.logger.error("Error getting hidden journal entries", error);
      }, "onErr")
    });
  }
  hideEntries(entries, html) {
    for (const journal of entries) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.ui.removeJournalElement(journal.id, journalName, html);
      match(removeResult, {
        onOk: /* @__PURE__ */ __name(() => {
          this.logger.debug(`Removing journal entry: ${this.sanitizeForLog(journalName)}`);
        }, "onOk"),
        onErr: /* @__PURE__ */ __name((error) => {
          this.logger.warn("Error removing journal entry", error);
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
function getFoundryVersionResult() {
  if (typeof game === "undefined") {
    return err("Foundry game object is not available or version cannot be determined");
  }
  const versionString = game.version;
  if (!versionString) {
    return err("Foundry version is not available on the game object");
  }
  const match2 = versionString.match(/^(\d+)/);
  if (!match2) {
    return err(`Could not parse Foundry version from: ${versionString}`);
  }
  return ok(Number.parseInt(match2[1], 10));
}
__name(getFoundryVersionResult, "getFoundryVersionResult");
function getFoundryVersion() {
  const result = getFoundryVersionResult();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}
__name(getFoundryVersion, "getFoundryVersion");
function tryGetFoundryVersion() {
  const result = getFoundryVersionResult();
  return result.ok ? result.value : void 0;
}
__name(tryGetFoundryVersion, "tryGetFoundryVersion");
function createFoundryError(code, message, details, cause) {
  return { code, message, details, cause };
}
__name(createFoundryError, "createFoundryError");
function isFoundryError(error) {
  return typeof error === "object" && error !== null && "code" in error && "message" in error && typeof error.code === "string" && typeof error.message === "string";
}
__name(isFoundryError, "isFoundryError");
const PERFORMANCE_MARKS = {
  BOOTSTRAP_START: "bootstrap-start",
  BOOTSTRAP_END: "bootstrap-end",
  BOOTSTRAP_DURATION: "bootstrap-duration",
  PORT_SELECTION_START: "port-selection-start",
  PORT_SELECTION_END: "port-selection-end",
  PORT_SELECTION_DURATION: "port-selection-duration"
};
const _PortSelector = class _PortSelector {
  /**
   * Selects and instantiates the appropriate port from factories.
   *
   * CRITICAL: Works with factory map to avoid eager instantiation.
   * Only the selected factory is executed, preventing crashes from
   * incompatible constructors accessing unavailable APIs.
   *
   * @template T - The port type
   * @param factories - Map of version numbers to port factories
   * @param foundryVersion - Optional version override (uses getFoundryVersion() if not provided)
   * @returns Result with instantiated port or error
   *
   * @example
   * ```typescript
   * const factories = new Map([
   *   [13, () => new FoundryGamePortV13()],
   *   [14, () => new FoundryGamePortV14()]
   * ]);
   * const selector = new PortSelector();
   * const result = selector.selectPortFromFactories(factories);
   * // On Foundry v13: creates only v13 port (v14 factory never called)
   * // On Foundry v14: creates v14 port
   * ```
   */
  selectPortFromFactories(factories, foundryVersion) {
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.PORT_SELECTION_START);
    }
    let version;
    if (foundryVersion !== void 0) {
      version = foundryVersion;
    } else {
      const versionResult = getFoundryVersionResult();
      if (!versionResult.ok) {
        return err(
          createFoundryError(
            "PORT_SELECTION_FAILED",
            "Could not determine Foundry version",
            void 0,
            versionResult.error
          )
        );
      }
      version = versionResult.value;
    }
    let selectedFactory;
    let selectedVersion = -1;
    for (const [portVersion, factory] of factories.entries()) {
      if (portVersion > version) {
        continue;
      }
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedFactory = factory;
      }
    }
    if (selectedFactory === void 0) {
      const availableVersions = Array.from(factories.keys()).sort((a, b) => a - b).join(", ");
      return err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `No compatible port found for Foundry version ${version}`,
          { version, availableVersions: availableVersions || "none" }
        )
      );
    }
    let result;
    try {
      result = ok(selectedFactory());
    } catch (error) {
      result = err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `Failed to instantiate port v${selectedVersion}`,
          { selectedVersion },
          error
        )
      );
    }
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.PORT_SELECTION_END);
      performance.measure(
        PERFORMANCE_MARKS.PORT_SELECTION_DURATION,
        PERFORMANCE_MARKS.PORT_SELECTION_START,
        PERFORMANCE_MARKS.PORT_SELECTION_END
      );
      const measure = performance.getEntriesByName(PERFORMANCE_MARKS.PORT_SELECTION_DURATION)[0];
      if (measure && ENV.enableDebugMode) {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Port selection completed in ${measure.duration.toFixed(2)}ms (selected: v${selectedVersion})`
        );
      }
    }
    return result;
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
   * Gets the factory map without instantiating ports.
   * Use with PortSelector.selectPortFromFactories() for safe lazy instantiation.
   *
   * @returns Map of version numbers to factory functions (NOT instances)
   *
   * @example
   * ```typescript
   * const registry = new PortRegistry<FoundryGame>();
   * registry.register(13, () => new FoundryGamePortV13());
   * registry.register(14, () => new FoundryGamePortV14());
   *
   * const factories = registry.getFactories();
   * const selector = new PortSelector();
   * const result = selector.selectPortFromFactories(factories);
   * // Only compatible port is instantiated
   * ```
   */
  getFactories() {
    return new Map(this.factories);
  }
  /**
   * Gets available port instances by instantiating all factories.
   *
   * @deprecated Use getFactories() with PortSelector.selectPortFromFactories() instead.
   * This method instantiates all ports eagerly, which may cause crashes on incompatible Foundry versions.
   *
   * @returns Map of version numbers to port instances
   */
  getAvailablePorts() {
    const ports = /* @__PURE__ */ new Map();
    for (const [version, factory] of this.factories.entries()) {
      ports.set(version, factory());
    }
    return ports;
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
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
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
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
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
  once(hookName, callback) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.once(hookName, callback);
  }
  off(hookName, callbackOrId) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.off(hookName, callbackOrId);
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
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  getFlag(document2, scope, key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getFlag(document2, scope, key);
  }
  async setFlag(document2, scope, key, value) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return await portResult.value.setFlag(document2, scope, key, value);
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
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
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
  notify(message, type) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.notify(message, type);
  }
};
__name(_FoundryUIService, "FoundryUIService");
_FoundryUIService.dependencies = [portSelectorToken, foundryUIPortRegistryToken];
let FoundryUIService = _FoundryUIService;
const _FoundrySettingsService = class _FoundrySettingsService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  register(namespace, key, config) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.register(namespace, key, config);
  }
  get(namespace, key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.get(namespace, key);
  }
  async set(namespace, key, value) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.set(namespace, key, value);
  }
};
__name(_FoundrySettingsService, "FoundrySettingsService");
_FoundrySettingsService.dependencies = [portSelectorToken, foundrySettingsPortRegistryToken];
let FoundrySettingsService = _FoundrySettingsService;
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
const getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");
const ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
const quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
const _ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
__name(_ZodError, "ZodError");
let ZodError = _ZodError;
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
const errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
let overrideErrorMap = errorMap;
function setErrorMap(map2) {
  overrideErrorMap = map2;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");
const makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map2 of maps) {
    errorMessage = map2(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
const _ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
__name(_ParseStatus, "ParseStatus");
let ParseStatus = _ParseStatus;
const INVALID = Object.freeze({
  status: "aborted"
});
const DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
const OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
const isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
const isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
const isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
const isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
const _ParseInputLazyPath = class _ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
__name(_ParseInputLazyPath, "ParseInputLazyPath");
let ParseInputLazyPath = _ParseInputLazyPath;
const handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
const _ZodType = class _ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err2) {
        if (err2?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
__name(_ZodType, "ZodType");
let ZodType = _ZodType;
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
const _ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
__name(_ZodString, "ZodString");
let ZodString = _ZodString;
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
const _ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
__name(_ZodNumber, "ZodNumber");
let ZodNumber = _ZodNumber;
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
const _ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
__name(_ZodBigInt, "ZodBigInt");
let ZodBigInt = _ZodBigInt;
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
const _ZodBoolean = class _ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(_ZodBoolean, "ZodBoolean");
let ZodBoolean = _ZodBoolean;
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
const _ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
__name(_ZodDate, "ZodDate");
let ZodDate = _ZodDate;
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
const _ZodSymbol = class _ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(_ZodSymbol, "ZodSymbol");
let ZodSymbol = _ZodSymbol;
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
const _ZodUndefined = class _ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(_ZodUndefined, "ZodUndefined");
let ZodUndefined = _ZodUndefined;
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
const _ZodNull = class _ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(_ZodNull, "ZodNull");
let ZodNull = _ZodNull;
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
const _ZodAny = class _ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
__name(_ZodAny, "ZodAny");
let ZodAny = _ZodAny;
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
const _ZodUnknown = class _ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
__name(_ZodUnknown, "ZodUnknown");
let ZodUnknown = _ZodUnknown;
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
const _ZodNever = class _ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
__name(_ZodNever, "ZodNever");
let ZodNever = _ZodNever;
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
const _ZodVoid = class _ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(_ZodVoid, "ZodVoid");
let ZodVoid = _ZodVoid;
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
const _ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
__name(_ZodArray, "ZodArray");
let ZodArray = _ZodArray;
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
const _ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
__name(_ZodObject, "ZodObject");
let ZodObject = _ZodObject;
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
const _ZodUnion = class _ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
__name(_ZodUnion, "ZodUnion");
let ZodUnion = _ZodUnion;
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
const getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
const _ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
__name(_ZodDiscriminatedUnion, "ZodDiscriminatedUnion");
let ZodDiscriminatedUnion = _ZodDiscriminatedUnion;
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
const _ZodIntersection = class _ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
__name(_ZodIntersection, "ZodIntersection");
let ZodIntersection = _ZodIntersection;
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
const _ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
__name(_ZodTuple, "ZodTuple");
let ZodTuple = _ZodTuple;
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
const _ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
__name(_ZodRecord, "ZodRecord");
let ZodRecord = _ZodRecord;
const _ZodMap = class _ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
__name(_ZodMap, "ZodMap");
let ZodMap = _ZodMap;
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
const _ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
__name(_ZodSet, "ZodSet");
let ZodSet = _ZodSet;
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
const _ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
__name(_ZodFunction, "ZodFunction");
let ZodFunction = _ZodFunction;
const _ZodLazy = class _ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
__name(_ZodLazy, "ZodLazy");
let ZodLazy = _ZodLazy;
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
const _ZodLiteral = class _ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
__name(_ZodLiteral, "ZodLiteral");
let ZodLiteral = _ZodLiteral;
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
const _ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
__name(_ZodEnum, "ZodEnum");
let ZodEnum = _ZodEnum;
ZodEnum.create = createZodEnum;
const _ZodNativeEnum = class _ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
__name(_ZodNativeEnum, "ZodNativeEnum");
let ZodNativeEnum = _ZodNativeEnum;
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
const _ZodPromise = class _ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
__name(_ZodPromise, "ZodPromise");
let ZodPromise = _ZodPromise;
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
const _ZodEffects = class _ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
__name(_ZodEffects, "ZodEffects");
let ZodEffects = _ZodEffects;
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
const _ZodOptional = class _ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(_ZodOptional, "ZodOptional");
let ZodOptional = _ZodOptional;
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
const _ZodNullable = class _ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(_ZodNullable, "ZodNullable");
let ZodNullable = _ZodNullable;
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
const _ZodDefault = class _ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
__name(_ZodDefault, "ZodDefault");
let ZodDefault = _ZodDefault;
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
const _ZodCatch = class _ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
__name(_ZodCatch, "ZodCatch");
let ZodCatch = _ZodCatch;
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
const _ZodNaN = class _ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
__name(_ZodNaN, "ZodNaN");
let ZodNaN = _ZodNaN;
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
const BRAND = Symbol("zod_brand");
const _ZodBranded = class _ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
__name(_ZodBranded, "ZodBranded");
let ZodBranded = _ZodBranded;
const _ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
__name(_ZodPipeline, "ZodPipeline");
let ZodPipeline = _ZodPipeline;
const _ZodReadonly = class _ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(_ZodReadonly, "ZodReadonly");
let ZodReadonly = _ZodReadonly;
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
const late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const _Class = class _Class {
  constructor(..._) {
  }
};
__name(_Class, "Class");
let Class = _Class;
const instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
const onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
const oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
const coerce = {
  string: /* @__PURE__ */ __name((arg) => ZodString.create({ ...arg, coerce: true }), "string"),
  number: /* @__PURE__ */ __name((arg) => ZodNumber.create({ ...arg, coerce: true }), "number"),
  boolean: /* @__PURE__ */ __name((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }), "boolean"),
  bigint: /* @__PURE__ */ __name((arg) => ZodBigInt.create({ ...arg, coerce: true }), "bigint"),
  date: /* @__PURE__ */ __name((arg) => ZodDate.create({ ...arg, coerce: true }), "date")
};
const NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  BRAND,
  DIRTY,
  EMPTY_PATH,
  INVALID,
  NEVER,
  OK,
  ParseStatus,
  Schema: ZodType,
  ZodAny,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodBranded,
  ZodCatch,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEffects,
  ZodEnum,
  ZodError,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  ZodFunction,
  ZodIntersection,
  ZodIssueCode,
  ZodLazy,
  ZodLiteral,
  ZodMap,
  ZodNaN,
  ZodNativeEnum,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodParsedType,
  ZodPipeline,
  ZodPromise,
  ZodReadonly,
  ZodRecord,
  ZodSchema: ZodType,
  ZodSet,
  ZodString,
  ZodSymbol,
  ZodTransformer: ZodEffects,
  ZodTuple,
  ZodType,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
  addIssueToContext,
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  coerce,
  custom,
  date: dateType,
  datetimeRegex,
  defaultErrorMap: errorMap,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  enum: enumType,
  function: functionType,
  getErrorMap,
  getParsedType,
  instanceof: instanceOfType,
  intersection: intersectionType,
  isAborted,
  isAsync,
  isDirty,
  isValid,
  late,
  lazy: lazyType,
  literal: literalType,
  makeIssue,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  null: nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  get objectUtil() {
    return objectUtil;
  },
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  quotelessJson,
  record: recordType,
  set: setType,
  setErrorMap,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  undefined: undefinedType,
  union: unionType,
  unknown: unknownType,
  get util() {
    return util;
  },
  void: voidType
});
const JournalEntrySchema = objectType({
  id: stringType(),
  name: stringType().optional(),
  flags: recordType(unknownType()).optional(),
  getFlag: functionType().optional(),
  setFlag: functionType().optional()
});
function validateJournalEntries(entries) {
  try {
    const validated = arrayType(JournalEntrySchema).parse(entries);
    return ok(validated);
  } catch (error) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Journal entry validation failed", void 0, error)
    );
  }
}
__name(validateJournalEntries, "validateJournalEntries");
function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}
__name(sanitizeId, "sanitizeId");
function sanitizeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
__name(sanitizeHtml, "sanitizeHtml");
const _FoundryGamePortV13 = class _FoundryGamePortV13 {
  constructor() {
    this.cachedEntries = null;
    this.cacheVersion = -1;
  }
  getJournalEntries() {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    const currentVersion = game.journal._source?.version ?? Date.now();
    if (this.cachedEntries !== null && this.cacheVersion === currentVersion) {
      return { ok: true, value: this.cachedEntries };
    }
    const entries = tryCatch(
      () => Array.from(game.journal.contents),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to access journal entries", void 0, error)
    );
    if (!entries.ok) {
      return entries;
    }
    const validationResult = validateJournalEntries(entries.value);
    if (!validationResult.ok) {
      return validationResult;
    }
    this.cachedEntries = validationResult.value;
    this.cacheVersion = currentVersion;
    return { ok: true, value: this.cachedEntries };
  }
  getJournalEntryById(id) {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    return tryCatch(
      () => {
        const entry = game.journal.get(id);
        return entry ?? null;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get journal entry by ID ${id}`,
        { id },
        error
      )
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
        const hookId = Hooks.on(
          hookName,
          callback
        );
        return hookId;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
  once(hookName, callback) {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        const hookId = Hooks.once(
          hookName,
          callback
        );
        return hookId;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register one-time hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
  off(hookName, callbackOrId) {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        Hooks.off(
          hookName,
          callbackOrId
        );
        return void 0;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to unregister hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
};
__name(_FoundryHooksPortV13, "FoundryHooksPortV13");
let FoundryHooksPortV13 = _FoundryHooksPortV13;
const _FoundryDocumentPortV13 = class _FoundryDocumentPortV13 {
  getFlag(document2, scope, key) {
    return tryCatch(
      () => {
        if (!document2?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const value = document2.getFlag(scope, key);
        return value ?? null;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get flag ${scope}.${key}`,
        { scope, key },
        error
      )
    );
  }
  async setFlag(document2, scope, key, value) {
    return fromPromise(
      (async () => {
        if (!document2?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document2.setFlag(scope, key, value);
      })(),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set flag ${scope}.${key}`,
        { scope, key, value },
        error
      )
    );
  }
};
__name(_FoundryDocumentPortV13, "FoundryDocumentPortV13");
let FoundryDocumentPortV13 = _FoundryDocumentPortV13;
const _FoundryUIPortV13 = class _FoundryUIPortV13 {
  removeJournalElement(journalId, journalName, html) {
    const safeId = sanitizeId(journalId);
    const element = html.querySelector(
      `li.directory-item[data-entry-id="${safeId}"]`
    );
    if (!element) {
      return err(
        createFoundryError(
          "NOT_FOUND",
          `Could not find element for journal entry: ${journalName}`,
          { journalName, journalId: safeId }
        )
      );
    }
    element.remove();
    return ok(void 0);
  }
  findElement(container, selector) {
    const element = container.querySelector(selector);
    return ok(element);
  }
  notify(message, type) {
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }
    try {
      switch (type) {
        case "info":
          ui.notifications.info(message);
          break;
        case "warning":
          ui.notifications.warn(message);
          break;
        case "error":
          ui.notifications.error(message);
          break;
      }
      return ok(void 0);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to show notification",
          { message, type },
          error
        )
      );
    }
  }
};
__name(_FoundryUIPortV13, "FoundryUIPortV13");
let FoundryUIPortV13 = _FoundryUIPortV13;
const _FoundrySettingsPortV13 = class _FoundrySettingsPortV13 {
  register(namespace, key, config) {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return tryCatch(
      () => {
        game.settings.register(
          namespace,
          key,
          config
        );
        return void 0;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register setting ${namespace}.${key}`,
        { namespace, key },
        error
      )
    );
  }
  get(namespace, key) {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return tryCatch(
      () => game.settings.get(namespace, key),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get setting ${namespace}.${key}`,
        { namespace, key },
        error
      )
    );
  }
  async set(namespace, key, value) {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return fromPromise(
      game.settings.set(
        namespace,
        key,
        value
      ).then(() => void 0),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set setting ${namespace}.${key}`,
        { namespace, key, value },
        error
      )
    );
  }
};
__name(_FoundrySettingsPortV13, "FoundrySettingsPortV13");
let FoundrySettingsPortV13 = _FoundrySettingsPortV13;
function registerPortToRegistry(registry, version, factory, portName, errors) {
  const result = registry.register(version, factory);
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
}
__name(registerPortToRegistry, "registerPortToRegistry");
function configureDependencies(container) {
  container.registerFallback(loggerToken, () => new ConsoleLoggerService());
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
  registerPortToRegistry(
    gamePortRegistry,
    13,
    () => new FoundryGamePortV13(),
    "FoundryGame",
    portRegistrationErrors
  );
  const hooksPortRegistry = new PortRegistry();
  registerPortToRegistry(
    hooksPortRegistry,
    13,
    () => new FoundryHooksPortV13(),
    "FoundryHooks",
    portRegistrationErrors
  );
  const documentPortRegistry = new PortRegistry();
  registerPortToRegistry(
    documentPortRegistry,
    13,
    () => new FoundryDocumentPortV13(),
    "FoundryDocument",
    portRegistrationErrors
  );
  const uiPortRegistry = new PortRegistry();
  registerPortToRegistry(
    uiPortRegistry,
    13,
    () => new FoundryUIPortV13(),
    "FoundryUI",
    portRegistrationErrors
  );
  const settingsPortRegistry = new PortRegistry();
  registerPortToRegistry(
    settingsPortRegistry,
    13,
    () => new FoundrySettingsPortV13(),
    "FoundrySettings",
    portRegistrationErrors
  );
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
  const settingsRegistryResult = container.registerValue(
    foundrySettingsPortRegistryToken,
    settingsPortRegistry
  );
  if (isErr(settingsRegistryResult)) {
    return err(
      `Failed to register FoundrySettings PortRegistry: ${settingsRegistryResult.error.message}`
    );
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
  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    FoundrySettingsService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
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
  const loggerInstance = container.resolve(loggerToken);
  if (loggerInstance.setMinLevel) {
    loggerInstance.setMinLevel(ENV.logLevel);
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
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.BOOTSTRAP_START);
    }
    const container = ServiceContainer.createRoot();
    const configured = configureDependencies(container);
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.BOOTSTRAP_END);
      performance.measure(
        PERFORMANCE_MARKS.BOOTSTRAP_DURATION,
        PERFORMANCE_MARKS.BOOTSTRAP_START,
        PERFORMANCE_MARKS.BOOTSTRAP_END
      );
      const measure = performance.getEntriesByName(PERFORMANCE_MARKS.BOOTSTRAP_DURATION)[0];
      if (measure && ENV.enableDebugMode) {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Bootstrap completed in ${measure.duration.toFixed(2)}ms`
        );
      }
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
    const containerResult = this.getContainer();
    if (!containerResult.ok) {
      throw new Error(containerResult.error);
    }
    const container = containerResult.value;
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
      foundryUIToken,
      foundrySettingsToken
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
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken]
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
   * Liefert den initialisierten Container als Result.
   * @returns Result mit Container oder Fehlermeldung
   */
  getContainer() {
    if (!this.container) {
      return { ok: false, error: `${MODULE_CONSTANTS.LOG_PREFIX} Container not initialized` };
    }
    return { ok: true, value: this.container };
  }
};
__name(_CompositionRoot, "CompositionRoot");
let CompositionRoot = _CompositionRoot;
function isJQueryObject(value) {
  if (value === null || typeof value !== "object") return false;
  const obj = value;
  return "length" in obj && typeof obj.length === "number" && obj.length > 0 && "0" in obj;
}
__name(isJQueryObject, "isJQueryObject");
const _ModuleHookRegistrar = class _ModuleHookRegistrar {
  /**
   * Registriert alle benötigten Hooks.
   * @param container DI-Container mit final gebundenen Ports und Services
   */
  registerAll(container) {
    const foundryHooks = container.resolve(foundryHooksToken);
    const logger = container.resolve(loggerToken);
    const journalVisibility = container.resolve(journalVisibilityServiceToken);
    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      (app, html) => {
        logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);
        const htmlElement = this.extractHtmlElement(html);
        if (!htmlElement) {
          logger.error("Failed to get HTMLElement from hook - incompatible format");
          return;
        }
        journalVisibility.processJournalDirectory(htmlElement);
      }
    );
    if (!hookResult.ok) {
      logger.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook: ${hookResult.error.message}`,
        {
          code: hookResult.error.code,
          details: hookResult.error.details,
          cause: hookResult.error.cause
        }
      );
    }
  }
  /**
   * Extracts HTMLElement from hook argument (jQuery or native DOM).
   *
   * Foundry v10-12: hooks pass jQuery wrapper objects
   * Foundry v13+: hooks pass native HTMLElement
   *
   * @param html - Hook argument (HTMLElement, jQuery, or unknown)
   * @returns HTMLElement or null if extraction failed
   */
  extractHtmlElement(html) {
    if (html instanceof HTMLElement) {
      return html;
    }
    if (isJQueryObject(html) && html[0] instanceof HTMLElement) {
      return html[0];
    }
    if (html && typeof html === "object" && "get" in html) {
      const obj = html;
      if (typeof obj.get === "function") {
        try {
          const element = obj.get(0);
          if (element instanceof HTMLElement) {
            return element;
          }
        } catch {
        }
      }
    }
    return null;
  }
};
__name(_ModuleHookRegistrar, "ModuleHookRegistrar");
let ModuleHookRegistrar = _ModuleHookRegistrar;
const _ModuleSettingsRegistrar = class _ModuleSettingsRegistrar {
  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * @param container DI-Container with registered services
   */
  registerAll(container) {
    const settings = container.resolve(foundrySettingsToken);
    const logger = container.resolve(loggerToken);
    const result = settings.register(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      {
        name: "Log Level",
        hint: "Mindest-Log-Level für Modul-Ausgaben. DEBUG zeigt alle Logs, ERROR nur kritische Fehler.",
        scope: "world",
        config: true,
        type: Number,
        choices: {
          [LogLevel.DEBUG]: "DEBUG (Alle Logs - für Debugging)",
          [LogLevel.INFO]: "INFO (Standard)",
          [LogLevel.WARN]: "WARN (Nur Warnungen und Fehler)",
          [LogLevel.ERROR]: "ERROR (Nur kritische Fehler)"
        },
        default: LogLevel.INFO,
        onChange: /* @__PURE__ */ __name((value) => {
          if (logger.setMinLevel) {
            logger.setMinLevel(value);
            logger.info(`Log-Level geändert zu: ${LogLevel[value]}`);
          }
        }, "onChange")
      }
    );
    if (!result.ok) {
      logger.error("Failed to register log level setting", result.error);
    }
  }
};
__name(_ModuleSettingsRegistrar, "ModuleSettingsRegistrar");
let ModuleSettingsRegistrar = _ModuleSettingsRegistrar;
function initializeFoundryModule() {
  const containerResult = root.getContainer();
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  const logger = containerResult.value.resolve(loggerToken);
  if (typeof Hooks === "undefined") {
    logger.warn("Foundry Hooks API not available - module initialization skipped");
    return;
  }
  Hooks.on("init", () => {
    logger.info("init-phase");
    root.exposeToModuleApi();
    const initContainerResult = root.getContainer();
    if (!initContainerResult.ok) {
      logger.error(`Failed to get container in init hook: ${initContainerResult.error}`);
      return;
    }
    new ModuleSettingsRegistrar().registerAll(initContainerResult.value);
    const settings = initContainerResult.value.resolve(foundrySettingsToken);
    const logLevelResult = settings.get(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL
    );
    if (logLevelResult.ok && logger.setMinLevel) {
      logger.setMinLevel(logLevelResult.value);
      logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }
    new ModuleHookRegistrar().registerAll(initContainerResult.value);
    logger.info("init-phase completed");
  });
  Hooks.on("ready", () => {
    logger.info("ready-phase");
    logger.info("ready-phase completed");
  });
}
__name(initializeFoundryModule, "initializeFoundryModule");
function initializeModule() {
}
__name(initializeModule, "initializeModule");
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);
if (!bootstrapOk) {
  console.error(`${MODULE_CONSTANTS.LOG_PREFIX} bootstrap failed`);
  console.error(bootstrapResult.error);
  let isOldFoundryVersion = false;
  if (typeof bootstrapResult.error === "string" && bootstrapResult.error.includes("PORT_SELECTION_FAILED")) {
    const foundryVersion = tryGetFoundryVersion();
    if (foundryVersion !== void 0 && foundryVersion < 13) {
      isOldFoundryVersion = true;
      if (typeof ui !== "undefined" && ui?.notifications) {
        ui.notifications.error(
          `${MODULE_CONSTANTS.MODULE.NAME} benötigt mindestens Foundry VTT Version 13. Ihre Version: ${foundryVersion}. Bitte aktualisieren Sie Foundry VTT.`,
          { permanent: true }
        );
      }
    }
  }
  if (!isOldFoundryVersion && typeof ui !== "undefined" && ui?.notifications) {
    ui.notifications?.error(
      `${MODULE_CONSTANTS.MODULE.NAME} failed to initialize. Check console for details.`,
      { permanent: true }
    );
  }
} else {
  initializeFoundryModule();
}
//# sourceMappingURL=fvtt_relationship_app_module.js.map
