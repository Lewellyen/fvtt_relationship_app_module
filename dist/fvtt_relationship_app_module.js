var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _serviceRegistrations, _validationState, _serviceInstances, _parentContainer, _disposed, _scopeName, _children;
Object.assign = function(target, ...sources) {
  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          try {
            target[key] = source[key];
          } catch {
          }
        }
      }
    }
  }
  return target;
};
const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen"
  },
  LOG_PREFIX: "Foundry VTT Relationship App Module |"
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
var ServiceLifecycle = /* @__PURE__ */ ((ServiceLifecycle2) => {
  ServiceLifecycle2["SINGLETON"] = "singleton";
  ServiceLifecycle2["TRANSIENT"] = "transient";
  ServiceLifecycle2["SCOPED"] = "scoped";
  return ServiceLifecycle2;
})(ServiceLifecycle || {});
const fallbackFactories = /* @__PURE__ */ new Map();
function registerFallback(token, factory) {
  fallbackFactories.set(token, factory);
}
__name(registerFallback, "registerFallback");
const _ServiceContainer = class _ServiceContainer {
  /**
   * Creates a new service container.
   * If a parent container is provided, creates a scoped child container.
   *
   * **Important:** Child containers are automatically registered with the parent
   * and will be disposed when the parent is disposed (cascading disposal).
   *
   * @param parentContainer - Optional parent container for hierarchical DI
   * @param scopeName - Optional name for the scope (auto-generated if not provided)
   *
   * @example
   * ```typescript
   * // Root container
   * const root = new ServiceContainer();
   *
   * // Scoped container (child) with auto-generated name
   * const scope = new ServiceContainer(root);
   *
   * // Scoped container (child) with custom name
   * const namedScope = new ServiceContainer(root, "myScope");
   *
   * // All children are tracked by root for cascading disposal
   * root.dispose(); // Automatically disposes scope and namedScope
   * ```
   */
  constructor(parentContainer = null, scopeName = null) {
    /** Service registrations mapping tokens to factories and lifecycles */
    __privateAdd(this, _serviceRegistrations, /* @__PURE__ */ new Map());
    /** Current validation state of the container */
    __privateAdd(this, _validationState, "registering");
    /** Cached service instances for Singleton and Scoped lifecycles */
    __privateAdd(this, _serviceInstances, /* @__PURE__ */ new Map());
    /** Reference to parent container in the scope hierarchy */
    __privateAdd(this, _parentContainer, null);
    /** Flag indicating if this container has been disposed */
    __privateAdd(this, _disposed, false);
    /** Hierarchical name for debugging and error messages (e.g., "root.child1") */
    __privateAdd(this, _scopeName, null);
    /** Set of all child containers for cascading disposal */
    __privateAdd(this, _children, /* @__PURE__ */ new Set());
    if (parentContainer !== null) {
      __privateSet(this, _serviceRegistrations, new Map(__privateGet(parentContainer, _serviceRegistrations)));
      __privateSet(this, _serviceInstances, /* @__PURE__ */ new Map());
      __privateSet(this, _parentContainer, parentContainer);
      __privateSet(this, _scopeName, __privateGet(parentContainer, _scopeName) + "." + (scopeName ?? "scope" + crypto.randomUUID() + Date.now()));
      __privateSet(this, _disposed, false);
      __privateGet(parentContainer, _children).add(this);
    } else {
      __privateSet(this, _scopeName, "root");
      __privateSet(this, _disposed, false);
    }
  }
  /**
   * Create a child container with its own scope.
   * Inherits service registrations from parent but maintains separate scoped instances.
   *
   * @param name - Optional name for the scope (auto-generated if not provided)
   * @returns Result containing a new scoped container or an error if this container is disposed
   *
   * @example
   * ```typescript
   * const rootContainer = new ServiceContainer();
   * const scopedContainer = rootContainer.createScope();
   * if (isErr(scopedContainer)) {
   *   console.error(scopedContainer.error.message);
   * }
   * ```
   */
  createScope(name) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container: ${__privateGet(this, _scopeName)}`
      });
    }
    if (__privateGet(this, _validationState) !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first."
      });
    }
    const child = new _ServiceContainer(this, name ?? null);
    __privateSet(child, _validationState, "validated");
    return ok(child);
  }
  /**
   * Check if a service is registered.
   * Recursively checks the entire parent container hierarchy from root to this container.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token to check
   * @returns Result indicating if registered in this container or any parent container
   *
   * @example
   * ```typescript
   * const root = new ServiceContainer();
   * const scope1 = root.createScope();
   * const scope2 = scope1.createScope();
   *
   * root.register(LoggerToken, () => new Logger(), SINGLETON);
   * const result = scope2.isRegistered(LoggerToken);
   * if (isOk(result) && result.value) {
   *   // Service is registered
   * }
   * ```
   */
  isRegistered(token) {
    if (__privateGet(this, _parentContainer) !== null) {
      return __privateGet(this, _parentContainer).isRegistered(token);
    }
    return ok(__privateGet(this, _serviceRegistrations).has(token));
  }
  /**
   * Dispose this container and clean up all scoped instances.
   * Services implementing Disposable will have their dispose() method called automatically.
   *
   * **Cascading Disposal:** All child containers are automatically disposed recursively.
   * Child disposal errors are logged but do not stop parent disposal.
   *
   * Root container clearing requires manual clear() call.
   *
   * @returns Result indicating success or any disposal errors
   *
   * @example
   * ```typescript
   * const root = new ServiceContainer();
   * const child = root.createScope();
   * const db = child.resolve(DatabaseToken); // Implements Disposable
   *
   * // Disposing root automatically disposes child (and db.dispose() is called)
   * const result = root.dispose();
   * if (isErr(result)) {
   *   console.error("Disposal failed:", result.error);
   * }
   * ```
   */
  dispose() {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Container already disposed: ${__privateGet(this, _scopeName)}`
      });
    }
    __privateSet(this, _disposed, true);
    for (const child of __privateGet(this, _children)) {
      const childResult = tryCatch(
        () => child.dispose(),
        (error) => ({
          code: "DisposalFailed",
          message: `Error disposing child container ${__privateGet(child, _scopeName)}: ${String(error)}`,
          cause: error
        })
      );
      if (isErr(childResult)) {
        console.warn(`Failed to dispose child container ${__privateGet(child, _scopeName)}:`, childResult.error);
      }
    }
    for (const [token, instance] of __privateGet(this, _serviceInstances).entries()) {
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
    __privateGet(this, _serviceInstances).clear();
    if (__privateGet(this, _parentContainer) !== null) {
      __privateGet(__privateGet(this, _parentContainer), _children).delete(this);
    }
    __privateSet(this, _validationState, "registering");
    return ok(void 0);
  }
  /**
   * Check if an instance implements the Disposable interface.
   *
   * @param instance - The service instance to check
   * @returns True if the instance has a dispose() method
   */
  isDisposable(instance) {
    return "dispose" in instance && typeof instance.dispose === "function";
  }
  /**
   * Clear all service registrations and instances.
   * Use with caution - this will remove all configured services.
   * Note: dispose() should be used for scoped containers instead.
   *
   * @returns Result indicating success
   */
  clear() {
    __privateGet(this, _serviceRegistrations).clear();
    __privateGet(this, _serviceInstances).clear();
    return ok(void 0);
  }
  /**
   * Register a service class with automatic dependency injection.
   *
   * @template TServiceType - The type of service to register
   * @param token - The injection token that identifies this service
   * @param serviceClass - The service class to instantiate
   * @param lifecycle - Service lifecycle strategy
   * @returns Result indicating success or registration error
   */
  registerClass(token, serviceClass, lifecycle) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token)
      });
    }
    if (__privateGet(this, _validationState) === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    if (__privateGet(this, _serviceRegistrations).has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const dependencies = serviceClass.dependencies ?? [];
    const factory = /* @__PURE__ */ __name(() => {
      const resolvedDeps = dependencies.map((dep) => {
        const result = this.resolveWithError(dep);
        if (isErr(result)) {
          throw new Error(`Dependency ${String(dep)} could not be resolved`);
        }
        return result.value;
      });
      return new serviceClass(...resolvedDeps);
    }, "factory");
    __privateGet(this, _serviceRegistrations).set(token, {
      factory,
      lifecycle,
      dependencies,
      providerType: "class"
    });
    return ok(void 0);
  }
  /**
   * Register a factory function that creates service instances.
   *
   * @template T - The type this factory creates
   * @param token - The injection token that identifies this service
   * @param factory - Factory function that creates the service instance
   * @param lifecycle - Service lifecycle strategy
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or registration error
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token)
      });
    }
    if (__privateGet(this, _validationState) === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    if (__privateGet(this, _serviceRegistrations).has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    __privateGet(this, _serviceRegistrations).set(token, {
      factory,
      lifecycle,
      dependencies,
      providerType: "factory"
    });
    return ok(void 0);
  }
  /**
   * Register a constant value (always singleton).
   *
   * @template T - The type of value
   * @param token - The injection token that identifies this value
   * @param value - The value to register
   * @returns Result indicating success or registration error
   */
  registerValue(token, value) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token)
      });
    }
    if (__privateGet(this, _validationState) === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    if (__privateGet(this, _serviceRegistrations).has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    if (typeof value === "function") {
      return err({
        code: "InvalidOperation",
        message: "registerValue() only accepts plain values, not classes or functions. Use registerClass() or registerFactory() instead.",
        tokenDescription: String(token)
      });
    }
    __privateGet(this, _serviceRegistrations).set(token, {
      factory: /* @__PURE__ */ __name(() => value, "factory"),
      lifecycle: ServiceLifecycle.SINGLETON,
      dependencies: [],
      providerType: "value"
    });
    return ok(void 0);
  }
  /**
   * Register an alias that points to another token.
   *
   * @template TServiceType - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or registration error
   */
  registerAlias(aliasToken, targetToken) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(aliasToken)}`,
        tokenDescription: String(aliasToken)
      });
    }
    if (__privateGet(this, _validationState) === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    if (__privateGet(this, _serviceRegistrations).has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken)
      });
    }
    const factory = /* @__PURE__ */ __name(() => {
      const result = this.resolveWithError(targetToken);
      if (isErr(result)) {
        throw new Error(`Alias target ${String(targetToken)} not found`);
      }
      return result.value;
    }, "factory");
    __privateGet(this, _serviceRegistrations).set(aliasToken, {
      factory,
      lifecycle: ServiceLifecycle.SINGLETON,
      dependencies: [targetToken],
      providerType: "alias",
      aliasTarget: targetToken
    });
    return ok(void 0);
  }
  /**
   * Validate all registered services and their dependencies.
   */
  validate() {
    if (__privateGet(this, _validationState) === "validated") {
      return ok(void 0);
    }
    if (__privateGet(this, _validationState) === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress"
        }
      ]);
    }
    __privateSet(this, _validationState, "validating");
    const errors = this.validateAllDependencies();
    if (errors.length > 0) {
      __privateSet(this, _validationState, "registering");
      return err(errors);
    }
    __privateSet(this, _validationState, "validated");
    return ok(void 0);
  }
  /**
   * Get the current validation state of the container.
   */
  getValidationState() {
    return __privateGet(this, _validationState);
  }
  /**
   * Resolve a service instance from the container with explicit error handling.
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result containing the service instance or an error
   *
   * @example
   * ```typescript
   * const result = container.resolveWithError(LoggerToken);
   * if (isOk(result)) {
   *   const logger = result.value;
   *   logger.info("Service resolved successfully");
   * }
   * ```
   */
  resolveWithError(token) {
    if (__privateGet(this, _disposed)) {
      return err({
        code: "Disposed",
        message: `Cannot resolve service from disposed container: ${String(token)}`,
        tokenDescription: String(token)
      });
    }
    if (__privateGet(this, _validationState) !== "validated") {
      return err({
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token)
      });
    }
    const checkResult = this.isRegistered(token);
    if (isErr(checkResult) || !checkResult.value) {
      return err({
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token)
      });
    }
    const service = __privateGet(this, _serviceRegistrations).get(token);
    if (!service) {
      return err({
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token)
      });
    }
    return tryCatch(
      () => {
        switch (service.lifecycle) {
          case ServiceLifecycle.SINGLETON:
            if (__privateGet(this, _parentContainer) !== null) {
              const parentResult = __privateGet(this, _parentContainer).resolveWithError(token);
              if (isErr(parentResult)) {
                throw new Error("CIRCULAR_DEPENDENCY");
              }
              return parentResult.value;
            }
            if (!__privateGet(this, _serviceInstances).has(token)) {
              __privateGet(this, _serviceInstances).set(token, service.factory());
            }
            return __privateGet(this, _serviceInstances).get(token);
          case ServiceLifecycle.TRANSIENT:
            return service.factory();
          case ServiceLifecycle.SCOPED:
            if (__privateGet(this, _parentContainer) === null) {
              throw new Error("SCOPED_REQUIRES_CONTAINER");
            }
            if (!__privateGet(this, _serviceInstances).has(token)) {
              __privateGet(this, _serviceInstances).set(token, service.factory());
            }
            return __privateGet(this, _serviceInstances).get(token);
          default:
            throw new Error("INVALID_LIFECYCLE");
        }
      },
      (error) => {
        const errorMessage = String(error);
        let code;
        let message;
        if (errorMessage.includes("CIRCULAR_DEPENDENCY")) {
          code = "CircularDependency";
          message = `Circular dependency detected for service ${String(token)}`;
        } else if (errorMessage.includes("SCOPED_REQUIRES_CONTAINER")) {
          code = "ScopeRequired";
          message = `Scoped service ${String(token)} requires a scope container`;
        } else if (errorMessage.includes("INVALID_LIFECYCLE")) {
          code = "InvalidLifecycle";
          message = `Invalid service lifecycle: ${String(service.lifecycle)}`;
        } else {
          code = "FactoryFailed";
          message = `Error creating service ${String(token)}: ${errorMessage}`;
        }
        return {
          code,
          message,
          tokenDescription: String(token),
          cause: error
        };
      }
    );
  }
  /**
   * Resolve a service instance directly from the container.
   * Uses fallback factory if container resolution fails and a fallback is registered.
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns The resolved service instance
   * @throws Error if container resolution fails and no fallback is registered
   *
   * @example
   * ```typescript
   * // Direct resolution with automatic fallback
   * const logger = container.resolve(loggerToken);
   * logger.info("This will work even if container resolution fails!");
   * ```
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
   * Validate all dependencies and check for circular dependencies.
   */
  validateAllDependencies() {
    const errors = [];
    for (const [token, registration] of __privateGet(this, _serviceRegistrations).entries()) {
      for (const dep of registration.dependencies) {
        if (!__privateGet(this, _serviceRegistrations).has(dep)) {
          errors.push({
            code: "TokenNotRegistered",
            message: `${String(token)} depends on ${String(dep)} which is not registered`,
            tokenDescription: String(dep)
          });
        }
      }
    }
    for (const [token, registration] of __privateGet(this, _serviceRegistrations).entries()) {
      if (registration.providerType === "alias" && registration.aliasTarget) {
        if (!__privateGet(this, _serviceRegistrations).has(registration.aliasTarget)) {
          errors.push({
            code: "AliasTargetNotFound",
            message: `Alias ${String(token)} points to ${String(registration.aliasTarget)} which is not registered`,
            tokenDescription: String(registration.aliasTarget)
          });
        }
      }
    }
    const circularErrors = this.detectCircularDependencies();
    errors.push(...circularErrors);
    return errors;
  }
  /**
   * Detect circular dependencies using DFS.
   */
  detectCircularDependencies() {
    const errors = [];
    const visited = /* @__PURE__ */ new Set();
    for (const token of __privateGet(this, _serviceRegistrations).keys()) {
      const visiting = /* @__PURE__ */ new Set();
      const path = [];
      const error = this.checkCycleForToken(token, visiting, visited, path);
      if (error) {
        errors.push(error);
      }
    }
    return errors;
  }
  /**
   * Check for cycles starting from a specific token.
   */
  checkCycleForToken(token, visiting, visited, path) {
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token)
      };
    }
    if (visited.has(token)) {
      return null;
    }
    visiting.add(token);
    path.push(token);
    const registration = __privateGet(this, _serviceRegistrations).get(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(dep, visiting, visited, path);
        if (error) return error;
      }
    }
    visiting.delete(token);
    path.pop();
    visited.add(token);
    return null;
  }
};
_serviceRegistrations = new WeakMap();
_validationState = new WeakMap();
_serviceInstances = new WeakMap();
_parentContainer = new WeakMap();
_disposed = new WeakMap();
_scopeName = new WeakMap();
_children = new WeakMap();
__name(_ServiceContainer, "ServiceContainer");
let ServiceContainer = _ServiceContainer;
function createInjectionToken(description) {
  return Symbol(description);
}
__name(createInjectionToken, "createInjectionToken");
const loggerToken = createInjectionToken("Logger");
const _ConsoleLoggerService = class _ConsoleLoggerService {
  /**
   * Log a message to console
   * @param message - Message to log
   */
  log(message) {
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
  /**
   * Log an error message
   * @param message - Error message to log
   */
  error(message) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
  /**
   * Log a warning message
   * @param message - Warning message to log
   */
  warn(message) {
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
  /**
   * Log an info message
   * @param message - Info message to log
   */
  info(message) {
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
  /**
   * Log a debug message
   * @param message - Debug message to log
   */
  debug(message) {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
_ConsoleLoggerService.dependencies = [];
let ConsoleLoggerService = _ConsoleLoggerService;
const foundryGameToken = createInjectionToken("FoundryGame");
const foundryHooksToken = createInjectionToken("FoundryHooks");
const foundryDocumentToken = createInjectionToken("FoundryDocument");
const foundryUIToken = createInjectionToken("FoundryUI");
const portSelectorToken = createInjectionToken("PortSelector");
const foundryGamePortRegistryToken = createInjectionToken("FoundryGamePortRegistry");
const foundryHooksPortRegistryToken = createInjectionToken("FoundryHooksPortRegistry");
const foundryDocumentPortRegistryToken = createInjectionToken("FoundryDocumentPortRegistry");
const foundryUIPortRegistryToken = createInjectionToken("FoundryUIPortRegistry");
function getFoundryVersion() {
  if (typeof game === "undefined") {
    throw new Error("Foundry game object is not available or version cannot be determined");
  }
  const versionString = String(game.version ?? game.data?.version);
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
   */
  register(version, factory) {
    this.factories.set(version, factory);
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
   * @throws Error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryGame port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }
  getJournalEntries() {
    try {
      return this.getPort().getJournalEntries();
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to get journal entries: ${String(error)}`
      );
    }
  }
  getJournalEntryById(id) {
    try {
      return this.getPort().getJournalEntryById(id);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to get journal entry by ID ${id}: ${String(error)}`
      );
    }
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
   * @throws Error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryHooks port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }
  on(hookName, callback) {
    try {
      this.getPort().on(hookName, callback);
    } catch (error) {
      console.error(
        `Failed to register hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  off(hookName, callback) {
    try {
      this.getPort().off(hookName, callback);
    } catch (error) {
      console.warn(
        `Failed to unregister hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
   * @throws Error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryDocument port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }
  getFlag(document, scope, key) {
    try {
      return this.getPort().getFlag(document, scope, key);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to get flag ${scope}.${key}: ${String(error)}`
      );
    }
  }
  async setFlag(document, scope, key, value) {
    try {
      return await this.getPort().setFlag(document, scope, key, value);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to set flag ${scope}.${key}: ${String(error)}`
      );
    }
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
   * @throws Error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryUI port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }
  removeJournalElement(journalId, journalName, html) {
    try {
      return this.getPort().removeJournalElement(journalId, journalName, html);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to remove journal element ${journalId}: ${String(error)}`
      );
    }
  }
  findElement(container, selector) {
    try {
      return this.getPort().findElement(container, selector);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to find element with selector ${selector}: ${String(error)}`
      );
    }
  }
};
__name(_FoundryUIService, "FoundryUIService");
_FoundryUIService.dependencies = [portSelectorToken, foundryUIPortRegistryToken];
let FoundryUIService = _FoundryUIService;
const _FoundryGamePortV13 = class _FoundryGamePortV13 {
  getJournalEntries() {
    return tryCatch(
      () => {
        debugger;
        if (!game?.journal) {
          throw new Error("game.journal is not available");
        }
        const collection = game.journal;
        const entries = Array.isArray(collection) ? collection.slice() : Array.from(collection.contents ?? []);
        return entries;
      },
      (error) => `Failed to get journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  getJournalEntryById(id) {
    return tryCatch(
      () => {
        if (!game?.journal) {
          throw new Error("game.journal is not available");
        }
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
    if (typeof Hooks === "undefined") {
      console.error("Foundry Hooks API is not available");
      return;
    }
    Hooks.on(hookName, callback);
  }
  off(hookName, callback) {
    if (typeof Hooks === "undefined") {
      console.warn("Foundry Hooks API is not available");
      return;
    }
    Hooks.off(hookName, callback);
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
  const gamePortRegistry = new PortRegistry();
  gamePortRegistry.register(13, () => new FoundryGamePortV13());
  const hooksPortRegistry = new PortRegistry();
  hooksPortRegistry.register(13, () => new FoundryHooksPortV13());
  const documentPortRegistry = new PortRegistry();
  documentPortRegistry.register(13, () => new FoundryDocumentPortV13());
  const uiPortRegistry = new PortRegistry();
  uiPortRegistry.register(13, () => new FoundryUIPortV13());
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
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(void 0);
}
__name(configureDependencies, "configureDependencies");
function getHiddenJournalEntries(foundryGame, foundryDocument) {
  const allEntriesResult = foundryGame.getJournalEntries();
  if (!allEntriesResult.ok) {
    return allEntriesResult;
  }
  const hidden = [];
  for (const journal of allEntriesResult.value) {
    const flagResult = foundryDocument.getFlag(
      journal,
      MODULE_CONSTANTS.MODULE.ID,
      "hidden"
    );
    if (flagResult.ok && flagResult.value === true) {
      hidden.push(journal);
    }
  }
  return { ok: true, value: hidden };
}
__name(getHiddenJournalEntries, "getHiddenJournalEntries");
function initializeModule(container) {
  const foundryHooks = container.resolve(foundryHooksToken);
  const foundryGame = container.resolve(foundryGameToken);
  const foundryDocument = container.resolve(foundryDocumentToken);
  const foundryUI = container.resolve(foundryUIToken);
  foundryHooks.on("renderJournalDirectory", (app, html) => {
    const logger = container.resolve(loggerToken);
    logger.debug(`${MODULE_CONSTANTS.LOG_PREFIX} renderJournalDirectory fired`);
    const hiddenResult = getHiddenJournalEntries(foundryGame, foundryDocument);
    match(hiddenResult, {
      onOk: /* @__PURE__ */ __name((hidden) => {
        logger.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Found ${hidden.length} hidden journal entries`
        );
        for (const journal of hidden) {
          const removeResult = foundryUI.removeJournalElement(
            journal.id,
            journal.name ?? "Unknown",
            html
          );
          match(removeResult, {
            onOk: /* @__PURE__ */ __name(() => {
              logger.debug(
                `${MODULE_CONSTANTS.LOG_PREFIX} Removing journal entry: ${journal.name ?? "Unknown"}`
              );
            }, "onOk"),
            onErr: /* @__PURE__ */ __name((error) => {
              logger.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
            }, "onErr")
          });
        }
      }, "onOk"),
      onErr: /* @__PURE__ */ __name((error) => {
        const logger2 = container.resolve(loggerToken);
        logger2.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
      }, "onErr")
    });
  });
}
__name(initializeModule, "initializeModule");
const foundryHooksForInit = {
  on(hookName, callback) {
    if (typeof Hooks !== "undefined") {
      Hooks.on(hookName, callback);
    }
  }
};
foundryHooksForInit.on("init", () => {
  const loggerForInit = {
    log: /* @__PURE__ */ __name((message) => console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`), "log"),
    error: /* @__PURE__ */ __name((message) => console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`), "error"),
    warn: /* @__PURE__ */ __name((message) => console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`), "warn"),
    info: /* @__PURE__ */ __name((message) => console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`), "info"),
    debug: /* @__PURE__ */ __name((message) => console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`), "debug")
  };
  loggerForInit.log("init");
  const container = new ServiceContainer();
  const configureResult = configureDependencies(container);
  match(configureResult, {
    onOk: /* @__PURE__ */ __name(() => {
      loggerForInit.log("dependencies configured");
      globalThis.container = container;
      initializeModule(container);
      const logger = container.resolve(loggerToken);
      logger.info("Logger resolved");
      logger.info("init completed");
    }, "onOk"),
    onErr: /* @__PURE__ */ __name((error) => {
      loggerForInit.error(error);
      globalThis.container = null;
    }, "onErr")
  });
});
const foundryHooksForReady = {
  on(hookName, callback) {
    if (typeof Hooks !== "undefined") {
      Hooks.on(hookName, callback);
    }
  }
};
foundryHooksForReady.on("ready", () => {
  const container = globalThis.container;
  if (!container) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} Container not available in ready hook`);
    return;
  }
  const logger = container.resolve(loggerToken);
  logger.info("Module ready");
});
//# sourceMappingURL=fvtt_relationship_app_module.js.map
