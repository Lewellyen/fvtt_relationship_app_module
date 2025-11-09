var __defProp = Object.defineProperty;
var __name = (target, value2) => __defProp(target, "name", { value: value2, configurable: true });
var _a;
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
const HOOK_THROTTLE_WINDOW_MS = 100;
const VALIDATION_CONSTRAINTS = {
  /** Maximum length for IDs and keys */
  MAX_ID_LENGTH: 100,
  /** Maximum length for names */
  MAX_NAME_LENGTH: 100,
  /** Maximum length for flag keys */
  MAX_FLAG_KEY_LENGTH: 100
};
const METRICS_CONFIG = {
  /** Size of circular buffer for resolution times */
  RESOLUTION_TIMES_BUFFER_SIZE: 100
};
const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen"
  },
  LOG_PREFIX: "Relationship App |",
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
  API: {
    /**
     * Public API version for external module consumption.
     * Follows semantic versioning: MAJOR.MINOR.PATCH
     *
     * MAJOR: Breaking changes to public API
     * MINOR: New features, backwards-compatible
     * PATCH: Bug fixes, backwards-compatible
     */
    VERSION: "1.0.0"
  },
  DEFAULTS: {
    UNKNOWN_NAME: "Unknown",
    NO_VERSION_SELECTED: -1,
    CACHE_NOT_INITIALIZED: -1,
    CACHE_TTL_MS: 5e3
  }
};
Object.freeze(MODULE_CONSTANTS);
Object.freeze(MODULE_CONSTANTS.MODULE);
Object.freeze(MODULE_CONSTANTS.API);
Object.freeze(MODULE_CONSTANTS.FLAGS);
Object.freeze(MODULE_CONSTANTS.HOOKS);
Object.freeze(MODULE_CONSTANTS.SETTINGS);
Object.freeze(MODULE_CONSTANTS.DEFAULTS);
Object.freeze(VALIDATION_CONSTRAINTS);
Object.freeze(METRICS_CONFIG);
function ok(value2) {
  return { ok: true, value: value2 };
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
function map$1(result, transform2) {
  return result.ok ? ok(transform2(result.value)) : result;
}
__name(map$1, "map$1");
function mapError(result, transform2) {
  return result.ok ? result : err(transform2(result.error));
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
function unwrapOrElse(result, getFallback2) {
  return result.ok ? result.value : getFallback2(result.error);
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
async function asyncMap(asyncResult, transform2) {
  const result = await asyncResult;
  return result.ok ? ok(await transform2(result.value)) : result;
}
__name(asyncMap, "asyncMap");
async function asyncAndThen(asyncResult, next) {
  const result = await asyncResult;
  return result.ok ? next(result.value) : result;
}
__name(asyncAndThen, "asyncAndThen");
async function fromPromise(promise2, mapUnknownError) {
  try {
    return ok(await promise2);
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
function createInjectionToken(description2) {
  return Symbol(description2);
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
const foundryI18nPortRegistryToken = createInjectionToken("FoundryI18nPortRegistry");
const foundryJournalFacadeToken = createInjectionToken("FoundryJournalFacade");
const loggerToken = createInjectionToken("Logger");
const metricsCollectorToken = createInjectionToken("MetricsCollector");
const metricsRecorderToken = createInjectionToken("MetricsRecorder");
const metricsSamplerToken = createInjectionToken("MetricsSampler");
const journalVisibilityServiceToken = createInjectionToken(
  "JournalVisibilityService"
);
const foundryI18nToken = createInjectionToken("FoundryI18nService");
const localI18nToken = createInjectionToken("LocalI18nService");
const i18nFacadeToken = createInjectionToken("I18nFacadeService");
const environmentConfigToken = createInjectionToken("EnvironmentConfig");
const moduleHealthServiceToken = createInjectionToken("ModuleHealthService");
const performanceTrackingServiceToken = createInjectionToken(
  "PerformanceTrackingService"
);
const retryServiceToken = createInjectionToken("RetryService");
var tokenindex = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  environmentConfigToken,
  foundryI18nToken,
  i18nFacadeToken,
  journalVisibilityServiceToken,
  localI18nToken,
  loggerToken,
  metricsCollectorToken,
  metricsRecorderToken,
  metricsSamplerToken,
  moduleHealthServiceToken,
  performanceTrackingServiceToken,
  portSelectorToken,
  retryServiceToken
});
const scriptRel = "modulepreload";
const assetsURL = /* @__PURE__ */ __name(function(dep) {
  return "/" + dep;
}, "assetsURL");
const seen = {};
const __vitePreload = /* @__PURE__ */ __name(function preload(baseModule, deps, importerUrl) {
  let promise2 = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled2 = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    var allSettled = allSettled2;
    __name(allSettled2, "allSettled");
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise2 = allSettled2(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  __name(handlePreloadError, "handlePreloadError");
  return promise2.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
}, "preload");
const apiSafeTokens = /* @__PURE__ */ new Set();
function markAsApiSafe(token) {
  apiSafeTokens.add(token);
  return token;
}
__name(markAsApiSafe, "markAsApiSafe");
function isApiSafeTokenRuntime(token) {
  return apiSafeTokens.has(token);
}
__name(isApiSafeTokenRuntime, "isApiSafeTokenRuntime");
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
  constructor(lifecycle, dependencies, providerType, serviceClass, factory, value2, aliasTarget) {
    this.lifecycle = lifecycle;
    this.dependencies = dependencies;
    this.providerType = providerType;
    this.serviceClass = serviceClass;
    this.factory = factory;
    this.value = value2;
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
  static createValue(value2) {
    if (value2 === void 0) {
      return err({
        code: "InvalidOperation",
        message: "value cannot be undefined for value registration"
      });
    }
    if (typeof value2 === "function") {
      return err({
        code: "InvalidOperation",
        message: "registerValue() only accepts plain values, not functions or classes. Use registerClass() or registerFactory() instead."
      });
    }
    return ok(
      new _ServiceRegistration(ServiceLifecycle.SINGLETON, [], "value", void 0, void 0, value2, void 0)
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
    this.MAX_REGISTRATIONS = 1e4;
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
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
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
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
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
  registerValue(token, value2) {
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const registrationResult = ServiceRegistration.createValue(value2);
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
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(aliasToken)
      });
    }
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
   * **Algorithm: Depth-First Search (DFS) with Three-Color Marking**
   *
   * Three states for each node (token):
   * - WHITE (unvisited): Not in `visiting` or `visited` sets
   * - GRAY (visiting): In `visiting` set (currently in DFS recursion stack)
   * - BLACK (visited): In `visited` set (fully processed, all descendants checked)
   *
   * Cycle Detection:
   * - If we encounter a GRAY node during traversal, we've found a back edge → cycle
   * - GRAY nodes represent the current path from root to current node
   * - Encountering a GRAY node means we're trying to visit an ancestor → circular dependency
   *
   * Performance Optimization:
   * - `validatedSubgraphs` cache prevents redundant traversals of already-validated subtrees
   * - Crucial for large dependency graphs (>500 services)
   * - BLACK nodes can be safely skipped (all their descendants are cycle-free)
   *
   * Time Complexity: O(V + E) where V = number of services, E = number of dependencies
   * Space Complexity: O(V) for visiting/visited sets + O(D) for recursion depth D
   *
   * @param registry - The service registry
   * @param token - Current token being checked (current node in DFS)
   * @param visiting - GRAY nodes: tokens currently in the DFS recursion stack
   * @param visited - BLACK nodes: tokens fully processed in this validation run
   * @param path - Current dependency path for error reporting (stack trace)
   * @returns ContainerError if cycle detected, null otherwise
   *
   * @example
   * Cycle A → B → C → A will be detected when:
   * 1. Start at A (mark GRAY)
   * 2. Visit B (mark GRAY)
   * 3. Visit C (mark GRAY)
   * 4. Try to visit A → A is GRAY → Back edge detected → Cycle!
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
    this.metricsCollector = null;
  }
  /**
   * Injects the MetricsCollector for cache hit/miss tracking.
   * Called after container validation to enable observability.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector) {
    this.metricsCollector = collector;
  }
  /**
   * Retrieves a cached service instance.
   *
   * @template TServiceType - The type of service to retrieve
   * @param token - The injection token identifying the service
   * @returns The cached instance or undefined if not found
   */
  get(token) {
    const hasInstance = this.instances.has(token);
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return this.instances.get(token);
  }
  /**
   * Stores a service instance in the cache.
   *
   * @template TServiceType - The type of service to store
   * @param token - The injection token identifying the service
   * @param instance - The service instance to cache
   */
  set(token, instance2) {
    this.instances.set(token, instance2);
  }
  /**
   * Checks if a service instance is cached.
   *
   * @template TServiceType - The type of service to check
   * @param token - The injection token identifying the service
   * @returns True if the instance is cached, false otherwise
   */
  has(token) {
    const hasInstance = this.instances.has(token);
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return hasInstance;
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
  constructor(registry, cache, parentResolver, scopeName, performanceTracker) {
    this.registry = registry;
    this.cache = cache;
    this.parentResolver = parentResolver;
    this.scopeName = scopeName;
    this.performanceTracker = performanceTracker;
    this.metricsCollector = null;
  }
  /**
   * Sets the MetricsCollector for metrics recording.
   * Called by ServiceContainer after validation.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector) {
    this.metricsCollector = collector;
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
   * Performance tracking is handled by the injected PerformanceTracker.
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve(token) {
    return this.performanceTracker.track(
      () => {
        const registration = this.registry.getRegistration(token);
        if (!registration) {
          const stack = new Error().stack;
          const error = {
            code: "TokenNotRegistered",
            message: `Service ${String(token)} not registered`,
            tokenDescription: String(token),
            ...stack !== void 0 && { stack },
            // Only include stack if defined
            timestamp: Date.now(),
            containerScope: this.scopeName
          };
          return err(error);
        }
        if (registration.providerType === "alias" && registration.aliasTarget) {
          return this.resolve(registration.aliasTarget);
        }
        let result;
        switch (registration.lifecycle) {
          case ServiceLifecycle.SINGLETON:
            result = this.resolveSingleton(token, registration);
            break;
          case ServiceLifecycle.TRANSIENT:
            result = this.resolveTransient(token, registration);
            break;
          case ServiceLifecycle.SCOPED:
            result = this.resolveScoped(token, registration);
            break;
          /* c8 ignore start -- Defensive: ServiceLifecycle enum ensures only valid values; this default is unreachable */
          default:
            result = err({
              code: "InvalidLifecycle",
              message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
              tokenDescription: String(token)
            });
        }
        return result;
      },
      /* c8 ignore start -- Optional chaining is defensive: metricsCollector is always injected via constructor */
      (duration, result) => {
        this.metricsCollector?.recordResolution(token, duration, result.ok);
      }
      /* c8 ignore stop */
    );
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
   * ⚠️ IMPORTANT: Scoped services can ONLY be resolved in child containers.
   * Attempting to resolve a scoped service in the root container will return
   * a ScopeRequired error.
   *
   * Strategy:
   * - Must be in child scope (not root)
   * - One instance per scope (cached)
   * - Each child scope gets its own isolated instance
   *
   * Use createScope() to create a child container before resolving scoped services.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with scoped instance or ScopeRequired error
   *
   * @example
   * ```typescript
   * // ❌ WRONG: Trying to resolve scoped service in root
   * const root = ServiceContainer.createRoot();
   * root.registerClass(RequestToken, RequestContext, SCOPED);
   * root.validate();
   * const result = root.resolve(RequestToken); // Error: ScopeRequired
   *
   * // ✅ CORRECT: Create child scope first
   * const child = root.createScope("request").value!;
   * child.validate(); // Child must validate separately
   * const ctx = child.resolve(RequestToken); // OK
   * ```
   */
  resolveScoped(token, registration) {
    if (this.parentResolver === null) {
      return err({
        code: "ScopeRequired",
        message: `Scoped service ${String(token)} requires a scope container. Use createScope() to create a child container first.`,
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
  // Unique correlation ID for tracing
  constructor(scopeName, parent, cache, depth = 0) {
    this.scopeName = scopeName;
    this.parent = parent;
    this.cache = cache;
    this.MAX_SCOPE_DEPTH = 10;
    this.children = /* @__PURE__ */ new Set();
    this.disposed = false;
    this.depth = depth;
    this.scopeId = `${scopeName}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  /**
   * Creates a child scope manager.
   *
   * Note: Returns data (scopeName, cache, childManager) instead of full container
   * to avoid circular dependency with ServiceResolver.
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child scope data or error if disposed or max depth exceeded
   */
  createChild(name) {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Cannot create child scope from disposed scope: ${this.scopeName}`
      });
    }
    if (this.depth >= this.MAX_SCOPE_DEPTH) {
      return err({
        code: "MaxScopeDepthExceeded",
        message: `Maximum scope depth of ${this.MAX_SCOPE_DEPTH} exceeded. Current depth: ${this.depth}`
      });
    }
    const uniqueId = name ?? `scope-${generateScopeId()}`;
    const childScopeName = `${this.scopeName}.${uniqueId}`;
    const childCache = new InstanceCache();
    const childManager = new _ScopeManager(childScopeName, this, childCache, this.depth + 1);
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
   * Asynchronously disposes this scope and all child scopes.
   *
   * Preferred method for cleanup as it properly handles async dispose operations.
   * Falls back to sync dispose() for services that only implement Disposable.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children (async)
   * 2. Dispose instances in this scope (async or sync)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Promise with Result indicating success or disposal error
   */
  async disposeAsync() {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`
      });
    }
    this.disposed = true;
    const childDisposalErrors = [];
    for (const child of this.children) {
      const childResult = await child.disposeAsync();
      if (isErr(childResult)) {
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error
        });
      }
    }
    const disposeResult = await this.disposeInstancesAsync();
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
   * Disposes all instances in the cache that implement Disposable (sync).
   *
   * @returns Result indicating success or disposal error
   */
  disposeInstances() {
    const instances = this.cache.getAllInstances();
    for (const [token, instance2] of instances.entries()) {
      if (this.isDisposable(instance2)) {
        const result = tryCatch(
          () => instance2.dispose(),
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
   * Disposes all instances in the cache that implement Disposable or AsyncDisposable (async).
   * Prefers async disposal when available, falls back to sync.
   *
   * @returns Promise with Result indicating success or disposal error
   */
  async disposeInstancesAsync() {
    const instances = this.cache.getAllInstances();
    for (const [token, instance2] of instances.entries()) {
      if (this.isAsyncDisposable(instance2)) {
        try {
          await instance2.disposeAsync();
        } catch (error) {
          return err({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error
          });
        }
      } else if (this.isDisposable(instance2)) {
        const result = tryCatch(
          () => instance2.dispose(),
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
   * @param instance - The service instance to check
   * @returns True if instance has dispose() method
   */
  isDisposable(instance2) {
    return "dispose" in instance2 && // Narrowing via Partial so we can check dispose presence without full interface
    /* type-coverage:ignore-next-line */
    typeof instance2.dispose === "function";
  }
  /**
   * Type guard to check if an instance implements the AsyncDisposable pattern.
   *
   * @param instance - The service instance to check
   * @returns True if instance has disposeAsync() method
   */
  isAsyncDisposable(instance2) {
    return "disposeAsync" in instance2 && // Narrowing via Partial so we can check disposeAsync presence without full interface
    typeof instance2.disposeAsync === "function";
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
  /**
   * Gets the unique correlation ID for this scope.
   *
   * Useful for tracing and logging in distributed/concurrent scenarios.
   * Each scope gets a unique ID combining name, timestamp, and random string.
   *
   * @returns The unique scope ID (e.g., "root-1730761234567-abc123")
   *
   * @example
   * ```typescript
   * const scope = container.createScope("request").value!;
   * logger.info(`[${scope.getScopeId()}] Processing request`);
   * ```
   */
  getScopeId() {
    return this.scopeId;
  }
};
__name(_ScopeManager, "ScopeManager");
let ScopeManager = _ScopeManager;
const _TimeoutError = class _TimeoutError extends Error {
  constructor(timeoutMs) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
};
__name(_TimeoutError, "TimeoutError");
let TimeoutError = _TimeoutError;
function withTimeout(promise2, timeoutMs) {
  let timeoutHandle = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });
  return Promise.race([
    promise2.finally(() => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    }),
    timeoutPromise
  ]);
}
__name(withTimeout, "withTimeout");
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
function parseSamplingRate(envValue, fallback2) {
  const raw = parseFloat(envValue ?? String(fallback2));
  return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : fallback2;
}
__name(parseSamplingRate, "parseSamplingRate");
const ENV = {
  isDevelopment: true,
  isProduction: false,
  logLevel: true ? 0 : 1,
  enablePerformanceTracking: true,
  enableDebugMode: true,
  // 1% sampling in production, 100% in development
  performanceSamplingRate: false ? parseSamplingRate(void 0, 0.01) : 1
};
const _PerformanceTrackerImpl = class _PerformanceTrackerImpl {
  /**
   * Creates a performance tracker implementation.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(env, sampler) {
    this.env = env;
    this.sampler = sampler;
  }
  /**
   * Tracks synchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the operation
   * @param operation - Function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Result of the operation
   */
  track(operation, onComplete) {
    if (!this.env.enablePerformanceTracking || !this.sampler?.shouldSample()) {
      return operation();
    }
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;
    if (onComplete) {
      onComplete(duration, result);
    }
    return result;
  }
  /**
   * Tracks asynchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the async operation
   * @param operation - Async function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Promise resolving to the operation result
   */
  async trackAsync(operation, onComplete) {
    if (!this.env.enablePerformanceTracking || !this.sampler?.shouldSample()) {
      return operation();
    }
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;
    if (onComplete) {
      onComplete(duration, result);
    }
    return result;
  }
};
__name(_PerformanceTrackerImpl, "PerformanceTrackerImpl");
let PerformanceTrackerImpl = _PerformanceTrackerImpl;
const _BootstrapPerformanceTracker = class _BootstrapPerformanceTracker extends PerformanceTrackerImpl {
  /**
   * Creates a bootstrap performance tracker.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(env, sampler) {
    super(env, sampler);
  }
};
__name(_BootstrapPerformanceTracker, "BootstrapPerformanceTracker");
let BootstrapPerformanceTracker = _BootstrapPerformanceTracker;
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
    this.validationPromise = null;
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
   * **Bootstrap Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV and null MetricsCollector.
   * MetricsCollector is injected later via setMetricsCollector() after validation.
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
    const performanceTracker = new BootstrapPerformanceTracker(ENV, null);
    const resolver = new ServiceResolver(registry, cache, null, "root", performanceTracker);
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
    if (!factory || typeof factory !== "function") {
      return err({
        code: "InvalidFactory",
        message: "Factory must be a function",
        tokenDescription: String(token)
      });
    }
    return this.registry.registerFactory(token, factory, lifecycle, dependencies);
  }
  /**
   * Register a constant value.
   */
  registerValue(token, value2) {
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
    return this.registry.registerValue(token, value2);
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
      void this.injectMetricsCollector();
    } else {
      this.validationState = "registering";
    }
    return result;
  }
  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   */
  async injectMetricsCollector() {
    const { metricsCollectorToken: metricsCollectorToken2 } = await __vitePreload(async () => {
      const { metricsCollectorToken: metricsCollectorToken3 } = await Promise.resolve().then(function() {
        return tokenindex;
      });
      return { metricsCollectorToken: metricsCollectorToken3 };
    }, true ? void 0 : void 0);
    const metricsResult = this.resolveWithError(metricsCollectorToken2);
    if (metricsResult.ok) {
      this.resolver.setMetricsCollector(metricsResult.value);
      this.cache.setMetricsCollector(metricsResult.value);
    }
  }
  /**
   * Get validation state.
   */
  getValidationState() {
    return this.validationState;
  }
  /**
   * Async-safe validation for concurrent environments with timeout.
   *
   * Prevents race conditions when multiple callers validate simultaneously
   * by ensuring only one validation runs at a time.
   *
   * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot();
   * // ... register services
   * await container.validateAsync(); // Safe for concurrent calls
   * await container.validateAsync(5000); // With 5 second timeout
   * ```
   */
  async validateAsync(timeoutMs = 3e4) {
    if (this.validationState === "validated") {
      return ok(void 0);
    }
    if (this.validationPromise !== null) {
      return this.validationPromise;
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
    let timedOut = false;
    const validationTask = Promise.resolve().then(() => {
      const result = this.validator.validate(this.registry);
      if (!timedOut) {
        if (result.ok) {
          this.validationState = "validated";
        } else {
          this.validationState = "registering";
        }
      }
      return result;
    });
    try {
      this.validationPromise = withTimeout(validationTask, timeoutMs);
      const result = await this.validationPromise;
      if (result.ok) {
        await this.injectMetricsCollector();
      }
      return result;
    } catch (error) {
      if (error instanceof TimeoutError) {
        timedOut = true;
        this.validationState = "registering";
        return err([
          {
            code: "InvalidOperation",
            message: `Validation timed out after ${timeoutMs}ms`
          }
        ]);
      }
      throw error;
    } finally {
      this.validationPromise = null;
    }
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
    const childPerformanceTracker = new BootstrapPerformanceTracker(ENV, null);
    const childResolver = new ServiceResolver(
      childRegistry,
      childCache,
      this.resolver,
      // Parent resolver for singleton delegation
      scopeResult.value.scopeName,
      childPerformanceTracker
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
  // Implementation (unified for both overloads)
  resolve(token) {
    if (!isApiSafeTokenRuntime(token)) {
      throw new Error(
        `API Boundary Violation: resolve() called with non-API-safe token: ${String(token)}.
This token was not marked via markAsApiSafe().

Internal code MUST use resolveWithError() instead:
  const result = container.resolveWithError(${String(token)});
  if (result.ok) { /* use result.value */ }

Only the public ModuleApi should expose resolve() for external modules.`
      );
    }
    const result = this.resolveWithError(token);
    if (isOk(result)) {
      return result.value;
    }
    const fallback2 = this.fallbackFactories.get(token);
    if (fallback2) {
      return fallback2();
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
   * Synchronously dispose container and all children.
   *
   * Use this for scenarios where async disposal is not possible (e.g., browser unload).
   * For normal cleanup, prefer disposeAsync() which handles async disposal properly.
   *
   * @returns Result indicating success or disposal error
   */
  dispose() {
    const result = this.scopeManager.dispose();
    if (result.ok) {
      this.validationState = "registering";
    }
    return result;
  }
  /**
   * Asynchronously dispose container and all children.
   *
   * This is the preferred disposal method as it properly handles services that
   * implement AsyncDisposable, allowing for proper cleanup of resources like
   * database connections, file handles, or network sockets.
   *
   * Falls back to synchronous disposal for services implementing only Disposable.
   *
   * @returns Promise with Result indicating success or disposal error
   *
   * @example
   * ```typescript
   * // Preferred: async disposal
   * const result = await container.disposeAsync();
   * if (result.ok) {
   *   console.log("Container disposed successfully");
   * }
   *
   * // Browser unload (sync required)
   * window.addEventListener('beforeunload', () => {
   *   container.dispose();  // Sync fallback
   * });
   * ```
   */
  async disposeAsync() {
    const result = await this.scopeManager.disposeAsync();
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
const _TracedLogger = class _TracedLogger {
  constructor(baseLogger, traceId) {
    this.baseLogger = baseLogger;
    this.traceId = traceId;
  }
  formatMessage(message2) {
    return `[${this.traceId}] ${message2}`;
  }
  setMinLevel(level) {
    this.baseLogger.setMinLevel?.(level);
  }
  log(message2, ...optionalParams) {
    this.baseLogger.log(this.formatMessage(message2), ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.baseLogger.error(this.formatMessage(message2), ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.baseLogger.warn(this.formatMessage(message2), ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.baseLogger.info(this.formatMessage(message2), ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.baseLogger.debug(this.formatMessage(message2), ...optionalParams);
  }
  withTraceId(newTraceId) {
    return new _TracedLogger(this.baseLogger, `${this.traceId}/${newTraceId}`);
  }
};
__name(_TracedLogger, "TracedLogger");
let TracedLogger = _TracedLogger;
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
  log(message2, ...optionalParams) {
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  /**
   * Log an error message
   * @param message - Error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, stack traces)
   */
  error(message2, ...optionalParams) {
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message2, ...optionalParams) {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message2, ...optionalParams) {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting complex objects)
   */
  debug(message2, ...optionalParams) {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  /**
   * Creates a scoped logger that includes a trace ID in all log messages.
   * The trace ID helps correlate log entries across related operations.
   *
   * @param traceId - Unique trace ID to include in log messages
   * @returns A new Logger instance that includes the trace ID in all messages
   *
   * @example
   * ```typescript
   * import { generateTraceId } from '@/utils/trace';
   *
   * const traceId = generateTraceId();
   * const tracedLogger = logger.withTraceId(traceId);
   * tracedLogger.info('Operation started'); // [1234567890-abc123] Operation started
   * ```
   */
  withTraceId(traceId) {
    return new TracedLogger(this, traceId);
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
_ConsoleLoggerService.dependencies = [];
let ConsoleLoggerService = _ConsoleLoggerService;
var store;
function setGlobalConfig(config2) {
  store = { ...store, ...config2 };
}
__name(setGlobalConfig, "setGlobalConfig");
// @__NO_SIDE_EFFECTS__
function getGlobalConfig(config2) {
  return {
    lang: config2?.lang ?? store?.lang,
    message: config2?.message,
    abortEarly: config2?.abortEarly ?? store?.abortEarly,
    abortPipeEarly: config2?.abortPipeEarly ?? store?.abortPipeEarly
  };
}
__name(getGlobalConfig, "getGlobalConfig");
function deleteGlobalConfig() {
  store = void 0;
}
__name(deleteGlobalConfig, "deleteGlobalConfig");
var store2;
function setGlobalMessage(message2, lang) {
  if (!store2) store2 = /* @__PURE__ */ new Map();
  store2.set(lang, message2);
}
__name(setGlobalMessage, "setGlobalMessage");
// @__NO_SIDE_EFFECTS__
function getGlobalMessage(lang) {
  return store2?.get(lang);
}
__name(getGlobalMessage, "getGlobalMessage");
function deleteGlobalMessage(lang) {
  store2?.delete(lang);
}
__name(deleteGlobalMessage, "deleteGlobalMessage");
var store3;
function setSchemaMessage(message2, lang) {
  if (!store3) store3 = /* @__PURE__ */ new Map();
  store3.set(lang, message2);
}
__name(setSchemaMessage, "setSchemaMessage");
// @__NO_SIDE_EFFECTS__
function getSchemaMessage(lang) {
  return store3?.get(lang);
}
__name(getSchemaMessage, "getSchemaMessage");
function deleteSchemaMessage(lang) {
  store3?.delete(lang);
}
__name(deleteSchemaMessage, "deleteSchemaMessage");
var store4;
function setSpecificMessage(reference, message2, lang) {
  if (!store4) store4 = /* @__PURE__ */ new Map();
  if (!store4.get(reference)) store4.set(reference, /* @__PURE__ */ new Map());
  store4.get(reference).set(lang, message2);
}
__name(setSpecificMessage, "setSpecificMessage");
// @__NO_SIDE_EFFECTS__
function getSpecificMessage(reference, lang) {
  return store4?.get(reference)?.get(lang);
}
__name(getSpecificMessage, "getSpecificMessage");
function deleteSpecificMessage(reference, lang) {
  store4?.get(reference)?.delete(lang);
}
__name(deleteSpecificMessage, "deleteSpecificMessage");
// @__NO_SIDE_EFFECTS__
function _stringify(input) {
  const type = typeof input;
  if (type === "string") {
    return `"${input}"`;
  }
  if (type === "number" || type === "bigint" || type === "boolean") {
    return `${input}`;
  }
  if (type === "object" || type === "function") {
    return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  }
  return type;
}
__name(_stringify, "_stringify");
function _addIssue(context, label, dataset, config2, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config2.lang,
    abortEarly: config2.abortEarly,
    abortPipeEarly: config2.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message2 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config2.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message2 !== void 0) {
    issue.message = typeof message2 === "function" ? (
      // @ts-expect-error
      message2(issue)
    ) : message2;
  }
  if (isSchema) {
    dataset.typed = false;
  }
  if (dataset.issues) {
    dataset.issues.push(issue);
  } else {
    dataset.issues = [issue];
  }
}
__name(_addIssue, "_addIssue");
var textEncoder;
// @__NO_SIDE_EFFECTS__
function _getByteCount(input) {
  if (!textEncoder) {
    textEncoder = new TextEncoder();
  }
  return textEncoder.encode(input).length;
}
__name(_getByteCount, "_getByteCount");
var segmenter;
// @__NO_SIDE_EFFECTS__
function _getGraphemeCount(input) {
  if (!segmenter) {
    segmenter = new Intl.Segmenter();
  }
  const segments = segmenter.segment(input);
  let count = 0;
  for (const _ of segments) {
    count++;
  }
  return count;
}
__name(_getGraphemeCount, "_getGraphemeCount");
// @__NO_SIDE_EFFECTS__
function _getLastMetadata(schema, type) {
  if ("pipe" in schema) {
    const nestedSchemas = [];
    for (let index = schema.pipe.length - 1; index >= 0; index--) {
      const item = schema.pipe[index];
      if (item.kind === "schema" && "pipe" in item) {
        nestedSchemas.push(item);
      } else if (item.kind === "metadata" && item.type === type) {
        return item[type];
      }
    }
    for (const nestedSchema of nestedSchemas) {
      const result = /* @__PURE__ */ _getLastMetadata(nestedSchema, type);
      if (result !== void 0) {
        return result;
      }
    }
  }
}
__name(_getLastMetadata, "_getLastMetadata");
// @__NO_SIDE_EFFECTS__
function _getStandardProps(context) {
  return {
    version: 1,
    vendor: "valibot",
    validate(value2) {
      return context["~run"]({ value: value2 }, /* @__PURE__ */ getGlobalConfig());
    }
  };
}
__name(_getStandardProps, "_getStandardProps");
var store5;
// @__NO_SIDE_EFFECTS__
function _getWordCount(locales, input) {
  if (!store5) {
    store5 = /* @__PURE__ */ new Map();
  }
  if (!store5.get(locales)) {
    store5.set(locales, new Intl.Segmenter(locales, { granularity: "word" }));
  }
  const segments = store5.get(locales).segment(input);
  let count = 0;
  for (const segment of segments) {
    if (segment.isWordLike) {
      count++;
    }
  }
  return count;
}
__name(_getWordCount, "_getWordCount");
var NON_DIGIT_REGEX = /\D/gu;
// @__NO_SIDE_EFFECTS__
function _isLuhnAlgo(input) {
  const number2 = input.replace(NON_DIGIT_REGEX, "");
  let length2 = number2.length;
  let bit = 1;
  let sum = 0;
  while (length2) {
    const value2 = +number2[--length2];
    bit ^= 1;
    sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value2] : value2;
  }
  return sum % 10 === 0;
}
__name(_isLuhnAlgo, "_isLuhnAlgo");
// @__NO_SIDE_EFFECTS__
function _isValidObjectKey(object2, key) {
  return Object.hasOwn(object2, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
__name(_isValidObjectKey, "_isValidObjectKey");
// @__NO_SIDE_EFFECTS__
function _joinExpects(values2, separator) {
  const list = [...new Set(values2)];
  if (list.length > 1) {
    return `(${list.join(` ${separator} `)})`;
  }
  return list[0] ?? "never";
}
__name(_joinExpects, "_joinExpects");
// @__NO_SIDE_EFFECTS__
function entriesFromList(list, schema) {
  const entries2 = {};
  for (const key of list) {
    entries2[key] = schema;
  }
  return entries2;
}
__name(entriesFromList, "entriesFromList");
// @__NO_SIDE_EFFECTS__
function entriesFromObjects(schemas) {
  const entries2 = {};
  for (const schema of schemas) {
    Object.assign(entries2, schema.entries);
  }
  return entries2;
}
__name(entriesFromObjects, "entriesFromObjects");
// @__NO_SIDE_EFFECTS__
function getDotPath(issue) {
  if (issue.path) {
    let key = "";
    for (const item of issue.path) {
      if (typeof item.key === "string" || typeof item.key === "number") {
        if (key) {
          key += `.${item.key}`;
        } else {
          key += item.key;
        }
      } else {
        return null;
      }
    }
    return key;
  }
  return null;
}
__name(getDotPath, "getDotPath");
// @__NO_SIDE_EFFECTS__
function isOfKind(kind, object2) {
  return object2.kind === kind;
}
__name(isOfKind, "isOfKind");
// @__NO_SIDE_EFFECTS__
function isOfType(type, object2) {
  return object2.type === type;
}
__name(isOfType, "isOfType");
// @__NO_SIDE_EFFECTS__
function isValiError(error) {
  return error instanceof ValiError;
}
__name(isValiError, "isValiError");
var ValiError = (_a = class extends Error {
  /**
   * Creates a Valibot error with useful information.
   *
   * @param issues The error issues.
   */
  constructor(issues) {
    super(issues[0].message);
    this.name = "ValiError";
    this.issues = issues;
  }
}, __name(_a, "ValiError"), _a);
// @__NO_SIDE_EFFECTS__
function args(schema) {
  return {
    kind: "transformation",
    type: "args",
    reference: args,
    async: false,
    schema,
    "~run"(dataset, config2) {
      const func = dataset.value;
      dataset.value = (...args_) => {
        const argsDataset = this.schema["~run"]({ value: args_ }, config2);
        if (argsDataset.issues) {
          throw new ValiError(argsDataset.issues);
        }
        return func(...argsDataset.value);
      };
      return dataset;
    }
  };
}
__name(args, "args");
// @__NO_SIDE_EFFECTS__
function argsAsync(schema) {
  return {
    kind: "transformation",
    type: "args",
    reference: argsAsync,
    async: false,
    schema,
    "~run"(dataset, config2) {
      const func = dataset.value;
      dataset.value = async (...args2) => {
        const argsDataset = await schema["~run"]({ value: args2 }, config2);
        if (argsDataset.issues) {
          throw new ValiError(argsDataset.issues);
        }
        return func(...argsDataset.value);
      };
      return dataset;
    }
  };
}
__name(argsAsync, "argsAsync");
// @__NO_SIDE_EFFECTS__
function awaitAsync() {
  return {
    kind: "transformation",
    type: "await",
    reference: awaitAsync,
    async: true,
    async "~run"(dataset) {
      dataset.value = await dataset.value;
      return dataset;
    }
  };
}
__name(awaitAsync, "awaitAsync");
var BASE64_REGEX = /^(?:[\da-z+/]{4})*(?:[\da-z+/]{2}==|[\da-z+/]{3}=)?$/iu;
var BIC_REGEX = /^[A-Z]{6}(?!00)[\dA-Z]{2}(?:[\dA-Z]{3})?$/u;
var CUID2_REGEX = /^[a-z][\da-z]*$/u;
var DECIMAL_REGEX = /^[+-]?(?:\d*\.)?\d+$/u;
var DIGITS_REGEX = /^\d+$/u;
var EMAIL_REGEX = /^[\w+-]+(?:\.[\w+-]+)*@[\da-z]+(?:[.-][\da-z]+)*\.[a-z]{2,}$/iu;
var EMOJI_REGEX = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex, regexp/no-dupe-disjunctions -- false positives
  /^(?:[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}))*)+$/u
);
var HEXADECIMAL_REGEX = /^(?:0[hx])?[\da-fA-F]+$/u;
var HEX_COLOR_REGEX = /^#(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/u;
var IMEI_REGEX = /^\d{15}$|^\d{2}-\d{6}-\d{6}-\d$/u;
var IPV4_REGEX = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive
  /^(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])(?:\.(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])){3}$/u
);
var IPV6_REGEX = /^(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?::[\da-f]{1,4}){1,6}|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:f{4}(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/iu;
var IP_REGEX = /^(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])(?:\.(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])){3}$|^(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?::[\da-f]{1,4}){1,6}|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:f{4}(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/iu;
var ISO_DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])$/u;
var ISO_DATE_TIME_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])[T ](?:0\d|1\d|2[0-3]):[0-5]\d$/u;
var ISO_TIME_REGEX = /^(?:0\d|1\d|2[0-3]):[0-5]\d$/u;
var ISO_TIME_SECOND_REGEX = /^(?:0\d|1\d|2[0-3])(?::[0-5]\d){2}$/u;
var ISO_TIMESTAMP_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])[T ](?:0\d|1\d|2[0-3])(?::[0-5]\d){2}(?:\.\d{1,9})?(?:Z|[+-](?:0\d|1\d|2[0-3])(?::?[0-5]\d)?)$/u;
var ISO_WEEK_REGEX = /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/u;
var MAC48_REGEX = /^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$|^(?:[\da-f]{4}\.){2}[\da-f]{4}$/iu;
var MAC64_REGEX = /^(?:[\da-f]{2}:){7}[\da-f]{2}$|^(?:[\da-f]{2}-){7}[\da-f]{2}$|^(?:[\da-f]{4}\.){3}[\da-f]{4}$|^(?:[\da-f]{4}:){3}[\da-f]{4}$/iu;
var MAC_REGEX = /^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$|^(?:[\da-f]{4}\.){2}[\da-f]{4}$|^(?:[\da-f]{2}:){7}[\da-f]{2}$|^(?:[\da-f]{2}-){7}[\da-f]{2}$|^(?:[\da-f]{4}\.){3}[\da-f]{4}$|^(?:[\da-f]{4}:){3}[\da-f]{4}$/iu;
var NANO_ID_REGEX = /^[\w-]+$/u;
var OCTAL_REGEX = /^(?:0o)?[0-7]+$/u;
var RFC_EMAIL_REGEX = (
  // eslint-disable-next-line regexp/prefer-w, no-useless-escape, regexp/no-useless-escape, regexp/require-unicode-regexp
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
);
var SLUG_REGEX = /^[\da-z]+(?:[-_][\da-z]+)*$/u;
var ULID_REGEX = /^[\da-hjkmnp-tv-zA-HJKMNP-TV-Z]{26}$/u;
var UUID_REGEX = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
// @__NO_SIDE_EFFECTS__
function base64(message2) {
  return {
    kind: "validation",
    type: "base64",
    reference: base64,
    async: false,
    expects: null,
    requirement: BASE64_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "Base64", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(base64, "base64");
// @__NO_SIDE_EFFECTS__
function bic(message2) {
  return {
    kind: "validation",
    type: "bic",
    reference: bic,
    async: false,
    expects: null,
    requirement: BIC_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "BIC", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(bic, "bic");
// @__NO_SIDE_EFFECTS__
function brand(name) {
  return {
    kind: "transformation",
    type: "brand",
    reference: brand,
    async: false,
    name,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(brand, "brand");
// @__NO_SIDE_EFFECTS__
function bytes(requirement, message2) {
  return {
    kind: "validation",
    type: "bytes",
    reference: bytes,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const length2 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length2 !== this.requirement) {
          _addIssue(this, "bytes", dataset, config2, {
            received: `${length2}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(bytes, "bytes");
// @__NO_SIDE_EFFECTS__
function check(requirement, message2) {
  return {
    kind: "validation",
    type: "check",
    reference: check,
    async: false,
    expects: null,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "input", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(check, "check");
// @__NO_SIDE_EFFECTS__
function checkAsync(requirement, message2) {
  return {
    kind: "validation",
    type: "check",
    reference: checkAsync,
    async: true,
    expects: null,
    requirement,
    message: message2,
    async "~run"(dataset, config2) {
      if (dataset.typed && !await this.requirement(dataset.value)) {
        _addIssue(this, "input", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(checkAsync, "checkAsync");
// @__NO_SIDE_EFFECTS__
function checkItems(requirement, message2) {
  return {
    kind: "validation",
    type: "check_items",
    reference: checkItems,
    async: false,
    expects: null,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        for (let index = 0; index < dataset.value.length; index++) {
          const item = dataset.value[index];
          if (!this.requirement(item, index, dataset.value)) {
            _addIssue(this, "item", dataset, config2, {
              input: item,
              path: [
                {
                  type: "array",
                  origin: "value",
                  input: dataset.value,
                  key: index,
                  value: item
                }
              ]
            });
          }
        }
      }
      return dataset;
    }
  };
}
__name(checkItems, "checkItems");
// @__NO_SIDE_EFFECTS__
function checkItemsAsync(requirement, message2) {
  return {
    kind: "validation",
    type: "check_items",
    reference: checkItemsAsync,
    async: true,
    expects: null,
    requirement,
    message: message2,
    async "~run"(dataset, config2) {
      if (dataset.typed) {
        const requirementResults = await Promise.all(
          dataset.value.map(this.requirement)
        );
        for (let index = 0; index < dataset.value.length; index++) {
          if (!requirementResults[index]) {
            const item = dataset.value[index];
            _addIssue(this, "item", dataset, config2, {
              input: item,
              path: [
                {
                  type: "array",
                  origin: "value",
                  input: dataset.value,
                  key: index,
                  value: item
                }
              ]
            });
          }
        }
      }
      return dataset;
    }
  };
}
__name(checkItemsAsync, "checkItemsAsync");
var CREDIT_CARD_REGEX = /^(?:\d{14,19}|\d{4}(?: \d{3,6}){2,4}|\d{4}(?:-\d{3,6}){2,4})$/u;
var SANITIZE_REGEX = /[- ]/gu;
var PROVIDER_REGEX_LIST = [
  // American Express
  /^3[47]\d{13}$/u,
  // Diners Club
  /^3(?:0[0-5]|[68]\d)\d{11,13}$/u,
  // Discover
  /^6(?:011|5\d{2})\d{12,15}$/u,
  // JCB
  /^(?:2131|1800|35\d{3})\d{11}$/u,
  // Mastercard
  // eslint-disable-next-line redos-detector/no-unsafe-regex
  /^5[1-5]\d{2}|(?:222\d|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12}$/u,
  // UnionPay
  /^(?:6[27]\d{14,17}|81\d{14,17})$/u,
  // Visa
  /^4\d{12}(?:\d{3,6})?$/u
];
// @__NO_SIDE_EFFECTS__
function creditCard(message2) {
  return {
    kind: "validation",
    type: "credit_card",
    reference: creditCard,
    async: false,
    expects: null,
    requirement(input) {
      let sanitized;
      return CREDIT_CARD_REGEX.test(input) && // Remove any hyphens and blanks
      (sanitized = input.replace(SANITIZE_REGEX, "")) && // Check if it matches a provider
      PROVIDER_REGEX_LIST.some((regex2) => regex2.test(sanitized)) && // Check if passes luhn algorithm
      /* @__PURE__ */ _isLuhnAlgo(sanitized);
    },
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "credit card", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(creditCard, "creditCard");
// @__NO_SIDE_EFFECTS__
function cuid2(message2) {
  return {
    kind: "validation",
    type: "cuid2",
    reference: cuid2,
    async: false,
    expects: null,
    requirement: CUID2_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "Cuid2", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(cuid2, "cuid2");
// @__NO_SIDE_EFFECTS__
function decimal(message2) {
  return {
    kind: "validation",
    type: "decimal",
    reference: decimal,
    async: false,
    expects: null,
    requirement: DECIMAL_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "decimal", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(decimal, "decimal");
// @__NO_SIDE_EFFECTS__
function description(description_) {
  return {
    kind: "metadata",
    type: "description",
    reference: description,
    description: description_
  };
}
__name(description, "description");
// @__NO_SIDE_EFFECTS__
function digits(message2) {
  return {
    kind: "validation",
    type: "digits",
    reference: digits,
    async: false,
    expects: null,
    requirement: DIGITS_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "digits", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(digits, "digits");
// @__NO_SIDE_EFFECTS__
function email(message2) {
  return {
    kind: "validation",
    type: "email",
    reference: email,
    expects: null,
    async: false,
    requirement: EMAIL_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "email", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(email, "email");
// @__NO_SIDE_EFFECTS__
function emoji(message2) {
  return {
    kind: "validation",
    type: "emoji",
    reference: emoji,
    async: false,
    expects: null,
    requirement: EMOJI_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "emoji", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(emoji, "emoji");
// @__NO_SIDE_EFFECTS__
function empty(message2) {
  return {
    kind: "validation",
    type: "empty",
    reference: empty,
    async: false,
    expects: "0",
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length > 0) {
        _addIssue(this, "length", dataset, config2, {
          received: `${dataset.value.length}`
        });
      }
      return dataset;
    }
  };
}
__name(empty, "empty");
// @__NO_SIDE_EFFECTS__
function endsWith(requirement, message2) {
  return {
    kind: "validation",
    type: "ends_with",
    reference: endsWith,
    async: false,
    expects: `"${requirement}"`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !dataset.value.endsWith(this.requirement)) {
        _addIssue(this, "end", dataset, config2, {
          received: `"${dataset.value.slice(-this.requirement.length)}"`
        });
      }
      return dataset;
    }
  };
}
__name(endsWith, "endsWith");
// @__NO_SIDE_EFFECTS__
function entries(requirement, message2) {
  return {
    kind: "validation",
    type: "entries",
    reference: entries,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count !== this.requirement) {
        _addIssue(this, "entries", dataset, config2, {
          received: `${count}`
        });
      }
      return dataset;
    }
  };
}
__name(entries, "entries");
// @__NO_SIDE_EFFECTS__
function everyItem(requirement, message2) {
  return {
    kind: "validation",
    type: "every_item",
    reference: everyItem,
    async: false,
    expects: null,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !dataset.value.every(this.requirement)) {
        _addIssue(this, "item", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(everyItem, "everyItem");
// @__NO_SIDE_EFFECTS__
function excludes(requirement, message2) {
  const received = /* @__PURE__ */ _stringify(requirement);
  return {
    kind: "validation",
    type: "excludes",
    reference: excludes,
    async: false,
    expects: `!${received}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.includes(this.requirement)) {
        _addIssue(this, "content", dataset, config2, { received });
      }
      return dataset;
    }
  };
}
__name(excludes, "excludes");
// @__NO_SIDE_EFFECTS__
function filterItems(operation) {
  return {
    kind: "transformation",
    type: "filter_items",
    reference: filterItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.filter(this.operation);
      return dataset;
    }
  };
}
__name(filterItems, "filterItems");
// @__NO_SIDE_EFFECTS__
function findItem(operation) {
  return {
    kind: "transformation",
    type: "find_item",
    reference: findItem,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.find(this.operation);
      return dataset;
    }
  };
}
__name(findItem, "findItem");
// @__NO_SIDE_EFFECTS__
function finite(message2) {
  return {
    kind: "validation",
    type: "finite",
    reference: finite,
    async: false,
    expects: null,
    requirement: Number.isFinite,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "finite", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(finite, "finite");
// @__NO_SIDE_EFFECTS__
function flavor(name) {
  return {
    kind: "transformation",
    type: "flavor",
    reference: flavor,
    async: false,
    name,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(flavor, "flavor");
// @__NO_SIDE_EFFECTS__
function graphemes(requirement, message2) {
  return {
    kind: "validation",
    type: "graphemes",
    reference: graphemes,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count !== this.requirement) {
          _addIssue(this, "graphemes", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(graphemes, "graphemes");
// @__NO_SIDE_EFFECTS__
function gtValue(requirement, message2) {
  return {
    kind: "validation",
    type: "gt_value",
    reference: gtValue,
    async: false,
    expects: `>${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !(dataset.value > this.requirement)) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(gtValue, "gtValue");
var HASH_LENGTHS = {
  md4: 32,
  md5: 32,
  sha1: 40,
  sha256: 64,
  sha384: 96,
  sha512: 128,
  ripemd128: 32,
  ripemd160: 40,
  tiger128: 32,
  tiger160: 40,
  tiger192: 48,
  crc32: 8,
  crc32b: 8,
  adler32: 8
};
// @__NO_SIDE_EFFECTS__
function hash(types, message2) {
  return {
    kind: "validation",
    type: "hash",
    reference: hash,
    expects: null,
    async: false,
    requirement: RegExp(
      types.map((type) => `^[a-f0-9]{${HASH_LENGTHS[type]}}$`).join("|"),
      "iu"
    ),
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "hash", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(hash, "hash");
// @__NO_SIDE_EFFECTS__
function hexadecimal(message2) {
  return {
    kind: "validation",
    type: "hexadecimal",
    reference: hexadecimal,
    async: false,
    expects: null,
    requirement: HEXADECIMAL_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "hexadecimal", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(hexadecimal, "hexadecimal");
// @__NO_SIDE_EFFECTS__
function hexColor(message2) {
  return {
    kind: "validation",
    type: "hex_color",
    reference: hexColor,
    async: false,
    expects: null,
    requirement: HEX_COLOR_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "hex color", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(hexColor, "hexColor");
// @__NO_SIDE_EFFECTS__
function imei(message2) {
  return {
    kind: "validation",
    type: "imei",
    reference: imei,
    async: false,
    expects: null,
    requirement(input) {
      return IMEI_REGEX.test(input) && /* @__PURE__ */ _isLuhnAlgo(input);
    },
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "IMEI", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(imei, "imei");
// @__NO_SIDE_EFFECTS__
function includes(requirement, message2) {
  const expects = /* @__PURE__ */ _stringify(requirement);
  return {
    kind: "validation",
    type: "includes",
    reference: includes,
    async: false,
    expects,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !dataset.value.includes(this.requirement)) {
        _addIssue(this, "content", dataset, config2, {
          received: `!${expects}`
        });
      }
      return dataset;
    }
  };
}
__name(includes, "includes");
// @__NO_SIDE_EFFECTS__
function integer(message2) {
  return {
    kind: "validation",
    type: "integer",
    reference: integer,
    async: false,
    expects: null,
    requirement: Number.isInteger,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "integer", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(integer, "integer");
// @__NO_SIDE_EFFECTS__
function ip(message2) {
  return {
    kind: "validation",
    type: "ip",
    reference: ip,
    async: false,
    expects: null,
    requirement: IP_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "IP", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(ip, "ip");
// @__NO_SIDE_EFFECTS__
function ipv4(message2) {
  return {
    kind: "validation",
    type: "ipv4",
    reference: ipv4,
    async: false,
    expects: null,
    requirement: IPV4_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "IPv4", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(ipv4, "ipv4");
// @__NO_SIDE_EFFECTS__
function ipv6(message2) {
  return {
    kind: "validation",
    type: "ipv6",
    reference: ipv6,
    async: false,
    expects: null,
    requirement: IPV6_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "IPv6", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(ipv6, "ipv6");
// @__NO_SIDE_EFFECTS__
function isoDate(message2) {
  return {
    kind: "validation",
    type: "iso_date",
    reference: isoDate,
    async: false,
    expects: null,
    requirement: ISO_DATE_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "date", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoDate, "isoDate");
// @__NO_SIDE_EFFECTS__
function isoDateTime(message2) {
  return {
    kind: "validation",
    type: "iso_date_time",
    reference: isoDateTime,
    async: false,
    expects: null,
    requirement: ISO_DATE_TIME_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "date-time", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoDateTime, "isoDateTime");
// @__NO_SIDE_EFFECTS__
function isoTime(message2) {
  return {
    kind: "validation",
    type: "iso_time",
    reference: isoTime,
    async: false,
    expects: null,
    requirement: ISO_TIME_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "time", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoTime, "isoTime");
// @__NO_SIDE_EFFECTS__
function isoTimeSecond(message2) {
  return {
    kind: "validation",
    type: "iso_time_second",
    reference: isoTimeSecond,
    async: false,
    expects: null,
    requirement: ISO_TIME_SECOND_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "time-second", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoTimeSecond, "isoTimeSecond");
// @__NO_SIDE_EFFECTS__
function isoTimestamp(message2) {
  return {
    kind: "validation",
    type: "iso_timestamp",
    reference: isoTimestamp,
    async: false,
    expects: null,
    requirement: ISO_TIMESTAMP_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "timestamp", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoTimestamp, "isoTimestamp");
// @__NO_SIDE_EFFECTS__
function isoWeek(message2) {
  return {
    kind: "validation",
    type: "iso_week",
    reference: isoWeek,
    async: false,
    expects: null,
    requirement: ISO_WEEK_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "week", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(isoWeek, "isoWeek");
// @__NO_SIDE_EFFECTS__
function length(requirement, message2) {
  return {
    kind: "validation",
    type: "length",
    reference: length,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length !== this.requirement) {
        _addIssue(this, "length", dataset, config2, {
          received: `${dataset.value.length}`
        });
      }
      return dataset;
    }
  };
}
__name(length, "length");
// @__NO_SIDE_EFFECTS__
function ltValue(requirement, message2) {
  return {
    kind: "validation",
    type: "lt_value",
    reference: ltValue,
    async: false,
    expects: `<${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !(dataset.value < this.requirement)) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(ltValue, "ltValue");
// @__NO_SIDE_EFFECTS__
function mac(message2) {
  return {
    kind: "validation",
    type: "mac",
    reference: mac,
    async: false,
    expects: null,
    requirement: MAC_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "MAC", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(mac, "mac");
// @__NO_SIDE_EFFECTS__
function mac48(message2) {
  return {
    kind: "validation",
    type: "mac48",
    reference: mac48,
    async: false,
    expects: null,
    requirement: MAC48_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "48-bit MAC", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(mac48, "mac48");
// @__NO_SIDE_EFFECTS__
function mac64(message2) {
  return {
    kind: "validation",
    type: "mac64",
    reference: mac64,
    async: false,
    expects: null,
    requirement: MAC64_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "64-bit MAC", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(mac64, "mac64");
// @__NO_SIDE_EFFECTS__
function mapItems(operation) {
  return {
    kind: "transformation",
    type: "map_items",
    reference: mapItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.map(this.operation);
      return dataset;
    }
  };
}
__name(mapItems, "mapItems");
// @__NO_SIDE_EFFECTS__
function maxBytes(requirement, message2) {
  return {
    kind: "validation",
    type: "max_bytes",
    reference: maxBytes,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const length2 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length2 > this.requirement) {
          _addIssue(this, "bytes", dataset, config2, {
            received: `${length2}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(maxBytes, "maxBytes");
// @__NO_SIDE_EFFECTS__
function maxEntries(requirement, message2) {
  return {
    kind: "validation",
    type: "max_entries",
    reference: maxEntries,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count > this.requirement) {
        _addIssue(this, "entries", dataset, config2, {
          received: `${count}`
        });
      }
      return dataset;
    }
  };
}
__name(maxEntries, "maxEntries");
// @__NO_SIDE_EFFECTS__
function maxGraphemes(requirement, message2) {
  return {
    kind: "validation",
    type: "max_graphemes",
    reference: maxGraphemes,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count > this.requirement) {
          _addIssue(this, "graphemes", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(maxGraphemes, "maxGraphemes");
// @__NO_SIDE_EFFECTS__
function maxLength(requirement, message2) {
  return {
    kind: "validation",
    type: "max_length",
    reference: maxLength,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length > this.requirement) {
        _addIssue(this, "length", dataset, config2, {
          received: `${dataset.value.length}`
        });
      }
      return dataset;
    }
  };
}
__name(maxLength, "maxLength");
// @__NO_SIDE_EFFECTS__
function maxSize(requirement, message2) {
  return {
    kind: "validation",
    type: "max_size",
    reference: maxSize,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.size > this.requirement) {
        _addIssue(this, "size", dataset, config2, {
          received: `${dataset.value.size}`
        });
      }
      return dataset;
    }
  };
}
__name(maxSize, "maxSize");
// @__NO_SIDE_EFFECTS__
function maxValue(requirement, message2) {
  return {
    kind: "validation",
    type: "max_value",
    reference: maxValue,
    async: false,
    expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !(dataset.value <= this.requirement)) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(maxValue, "maxValue");
// @__NO_SIDE_EFFECTS__
function maxWords(locales, requirement, message2) {
  return {
    kind: "validation",
    type: "max_words",
    reference: maxWords,
    async: false,
    expects: `<=${requirement}`,
    locales,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count > this.requirement) {
          _addIssue(this, "words", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(maxWords, "maxWords");
// @__NO_SIDE_EFFECTS__
function metadata(metadata_) {
  return {
    kind: "metadata",
    type: "metadata",
    reference: metadata,
    metadata: metadata_
  };
}
__name(metadata, "metadata");
// @__NO_SIDE_EFFECTS__
function mimeType(requirement, message2) {
  return {
    kind: "validation",
    type: "mime_type",
    reference: mimeType,
    async: false,
    expects: /* @__PURE__ */ _joinExpects(
      requirement.map((option) => `"${option}"`),
      "|"
    ),
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.includes(dataset.value.type)) {
        _addIssue(this, "MIME type", dataset, config2, {
          received: `"${dataset.value.type}"`
        });
      }
      return dataset;
    }
  };
}
__name(mimeType, "mimeType");
// @__NO_SIDE_EFFECTS__
function minBytes(requirement, message2) {
  return {
    kind: "validation",
    type: "min_bytes",
    reference: minBytes,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const length2 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length2 < this.requirement) {
          _addIssue(this, "bytes", dataset, config2, {
            received: `${length2}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(minBytes, "minBytes");
// @__NO_SIDE_EFFECTS__
function minEntries(requirement, message2) {
  return {
    kind: "validation",
    type: "min_entries",
    reference: minEntries,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count < this.requirement) {
        _addIssue(this, "entries", dataset, config2, {
          received: `${count}`
        });
      }
      return dataset;
    }
  };
}
__name(minEntries, "minEntries");
// @__NO_SIDE_EFFECTS__
function minGraphemes(requirement, message2) {
  return {
    kind: "validation",
    type: "min_graphemes",
    reference: minGraphemes,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count < this.requirement) {
          _addIssue(this, "graphemes", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(minGraphemes, "minGraphemes");
// @__NO_SIDE_EFFECTS__
function minLength(requirement, message2) {
  return {
    kind: "validation",
    type: "min_length",
    reference: minLength,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length < this.requirement) {
        _addIssue(this, "length", dataset, config2, {
          received: `${dataset.value.length}`
        });
      }
      return dataset;
    }
  };
}
__name(minLength, "minLength");
// @__NO_SIDE_EFFECTS__
function minSize(requirement, message2) {
  return {
    kind: "validation",
    type: "min_size",
    reference: minSize,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.size < this.requirement) {
        _addIssue(this, "size", dataset, config2, {
          received: `${dataset.value.size}`
        });
      }
      return dataset;
    }
  };
}
__name(minSize, "minSize");
// @__NO_SIDE_EFFECTS__
function minValue(requirement, message2) {
  return {
    kind: "validation",
    type: "min_value",
    reference: minValue,
    async: false,
    expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !(dataset.value >= this.requirement)) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(minValue, "minValue");
// @__NO_SIDE_EFFECTS__
function minWords(locales, requirement, message2) {
  return {
    kind: "validation",
    type: "min_words",
    reference: minWords,
    async: false,
    expects: `>=${requirement}`,
    locales,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count < this.requirement) {
          _addIssue(this, "words", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(minWords, "minWords");
// @__NO_SIDE_EFFECTS__
function multipleOf(requirement, message2) {
  return {
    kind: "validation",
    type: "multiple_of",
    reference: multipleOf,
    async: false,
    expects: `%${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value % this.requirement != 0) {
        _addIssue(this, "multiple", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(multipleOf, "multipleOf");
// @__NO_SIDE_EFFECTS__
function nanoid(message2) {
  return {
    kind: "validation",
    type: "nanoid",
    reference: nanoid,
    async: false,
    expects: null,
    requirement: NANO_ID_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "Nano ID", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nanoid, "nanoid");
// @__NO_SIDE_EFFECTS__
function nonEmpty(message2) {
  return {
    kind: "validation",
    type: "non_empty",
    reference: nonEmpty,
    async: false,
    expects: "!0",
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length === 0) {
        _addIssue(this, "length", dataset, config2, {
          received: "0"
        });
      }
      return dataset;
    }
  };
}
__name(nonEmpty, "nonEmpty");
// @__NO_SIDE_EFFECTS__
function normalize(form) {
  return {
    kind: "transformation",
    type: "normalize",
    reference: normalize,
    async: false,
    form,
    "~run"(dataset) {
      dataset.value = dataset.value.normalize(this.form);
      return dataset;
    }
  };
}
__name(normalize, "normalize");
// @__NO_SIDE_EFFECTS__
function notBytes(requirement, message2) {
  return {
    kind: "validation",
    type: "not_bytes",
    reference: notBytes,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const length2 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length2 === this.requirement) {
          _addIssue(this, "bytes", dataset, config2, {
            received: `${length2}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(notBytes, "notBytes");
// @__NO_SIDE_EFFECTS__
function notEntries(requirement, message2) {
  return {
    kind: "validation",
    type: "not_entries",
    reference: notEntries,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count === this.requirement) {
        _addIssue(this, "entries", dataset, config2, {
          received: `${count}`
        });
      }
      return dataset;
    }
  };
}
__name(notEntries, "notEntries");
// @__NO_SIDE_EFFECTS__
function notGraphemes(requirement, message2) {
  return {
    kind: "validation",
    type: "not_graphemes",
    reference: notGraphemes,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count === this.requirement) {
          _addIssue(this, "graphemes", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(notGraphemes, "notGraphemes");
// @__NO_SIDE_EFFECTS__
function notLength(requirement, message2) {
  return {
    kind: "validation",
    type: "not_length",
    reference: notLength,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.length === this.requirement) {
        _addIssue(this, "length", dataset, config2, {
          received: `${dataset.value.length}`
        });
      }
      return dataset;
    }
  };
}
__name(notLength, "notLength");
// @__NO_SIDE_EFFECTS__
function notSize(requirement, message2) {
  return {
    kind: "validation",
    type: "not_size",
    reference: notSize,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.size === this.requirement) {
        _addIssue(this, "size", dataset, config2, {
          received: `${dataset.value.size}`
        });
      }
      return dataset;
    }
  };
}
__name(notSize, "notSize");
// @__NO_SIDE_EFFECTS__
function notValue(requirement, message2) {
  return {
    kind: "validation",
    type: "not_value",
    reference: notValue,
    async: false,
    expects: requirement instanceof Date ? `!${requirement.toJSON()}` : `!${/* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && this.requirement <= dataset.value && this.requirement >= dataset.value) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(notValue, "notValue");
// @__NO_SIDE_EFFECTS__
function notValues(requirement, message2) {
  return {
    kind: "validation",
    type: "not_values",
    reference: notValues,
    async: false,
    expects: `!${/* @__PURE__ */ _joinExpects(
      requirement.map(
        (value2) => value2 instanceof Date ? value2.toJSON() : /* @__PURE__ */ _stringify(value2)
      ),
      "|"
    )}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && this.requirement.some(
        (value2) => value2 <= dataset.value && value2 >= dataset.value
      )) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(notValues, "notValues");
// @__NO_SIDE_EFFECTS__
function notWords(locales, requirement, message2) {
  return {
    kind: "validation",
    type: "not_words",
    reference: notWords,
    async: false,
    expects: `!${requirement}`,
    locales,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count === this.requirement) {
          _addIssue(this, "words", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(notWords, "notWords");
// @__NO_SIDE_EFFECTS__
function octal(message2) {
  return {
    kind: "validation",
    type: "octal",
    reference: octal,
    async: false,
    expects: null,
    requirement: OCTAL_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "octal", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(octal, "octal");
// @__NO_SIDE_EFFECTS__
function parseJson(config2, message2) {
  return {
    kind: "transformation",
    type: "parse_json",
    reference: parseJson,
    config: config2,
    message: message2,
    async: false,
    "~run"(dataset, config3) {
      try {
        dataset.value = JSON.parse(dataset.value, this.config?.reviver);
      } catch (error) {
        if (error instanceof Error) {
          _addIssue(this, "JSON", dataset, config3, {
            received: `"${error.message}"`
          });
          dataset.typed = false;
        } else {
          throw error;
        }
      }
      return dataset;
    }
  };
}
__name(parseJson, "parseJson");
// @__NO_SIDE_EFFECTS__
function _isPartiallyTyped(dataset, paths) {
  if (dataset.issues) {
    for (const path of paths) {
      for (const issue of dataset.issues) {
        let typed = false;
        const bound = Math.min(path.length, issue.path?.length ?? 0);
        for (let index = 0; index < bound; index++) {
          if (
            // @ts-expect-error
            path[index] !== issue.path[index].key && // @ts-expect-error
            (path[index] !== "$" || issue.path[index].type !== "array")
          ) {
            typed = true;
            break;
          }
        }
        if (!typed) {
          return false;
        }
      }
    }
  }
  return true;
}
__name(_isPartiallyTyped, "_isPartiallyTyped");
// @__NO_SIDE_EFFECTS__
function partialCheck(paths, requirement, message2) {
  return {
    kind: "validation",
    type: "partial_check",
    reference: partialCheck,
    async: false,
    expects: null,
    paths,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if ((dataset.typed || /* @__PURE__ */ _isPartiallyTyped(dataset, paths)) && // @ts-expect-error
      !this.requirement(dataset.value)) {
        _addIssue(this, "input", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(partialCheck, "partialCheck");
// @__NO_SIDE_EFFECTS__
function partialCheckAsync(paths, requirement, message2) {
  return {
    kind: "validation",
    type: "partial_check",
    reference: partialCheckAsync,
    async: true,
    expects: null,
    paths,
    requirement,
    message: message2,
    async "~run"(dataset, config2) {
      if ((dataset.typed || /* @__PURE__ */ _isPartiallyTyped(dataset, paths)) && // @ts-expect-error
      !await this.requirement(dataset.value)) {
        _addIssue(this, "input", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(partialCheckAsync, "partialCheckAsync");
// @__NO_SIDE_EFFECTS__
function rawCheck(action) {
  return {
    kind: "validation",
    type: "raw_check",
    reference: rawCheck,
    async: false,
    expects: null,
    "~run"(dataset, config2) {
      action({
        dataset,
        config: config2,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config2, info), "addIssue")
      });
      return dataset;
    }
  };
}
__name(rawCheck, "rawCheck");
// @__NO_SIDE_EFFECTS__
function rawCheckAsync(action) {
  return {
    kind: "validation",
    type: "raw_check",
    reference: rawCheckAsync,
    async: true,
    expects: null,
    async "~run"(dataset, config2) {
      await action({
        dataset,
        config: config2,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config2, info), "addIssue")
      });
      return dataset;
    }
  };
}
__name(rawCheckAsync, "rawCheckAsync");
// @__NO_SIDE_EFFECTS__
function rawTransform(action) {
  return {
    kind: "transformation",
    type: "raw_transform",
    reference: rawTransform,
    async: false,
    "~run"(dataset, config2) {
      const output = action({
        dataset,
        config: config2,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config2, info), "addIssue"),
        NEVER: null
      });
      if (dataset.issues) {
        dataset.typed = false;
      } else {
        dataset.value = output;
      }
      return dataset;
    }
  };
}
__name(rawTransform, "rawTransform");
// @__NO_SIDE_EFFECTS__
function rawTransformAsync(action) {
  return {
    kind: "transformation",
    type: "raw_transform",
    reference: rawTransformAsync,
    async: true,
    async "~run"(dataset, config2) {
      const output = await action({
        dataset,
        config: config2,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config2, info), "addIssue"),
        NEVER: null
      });
      if (dataset.issues) {
        dataset.typed = false;
      } else {
        dataset.value = output;
      }
      return dataset;
    }
  };
}
__name(rawTransformAsync, "rawTransformAsync");
// @__NO_SIDE_EFFECTS__
function readonly() {
  return {
    kind: "transformation",
    type: "readonly",
    reference: readonly,
    async: false,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(readonly, "readonly");
// @__NO_SIDE_EFFECTS__
function reduceItems(operation, initial) {
  return {
    kind: "transformation",
    type: "reduce_items",
    reference: reduceItems,
    async: false,
    operation,
    initial,
    "~run"(dataset) {
      dataset.value = dataset.value.reduce(this.operation, this.initial);
      return dataset;
    }
  };
}
__name(reduceItems, "reduceItems");
// @__NO_SIDE_EFFECTS__
function regex(requirement, message2) {
  return {
    kind: "validation",
    type: "regex",
    reference: regex,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "format", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(regex, "regex");
// @__NO_SIDE_EFFECTS__
function returns(schema) {
  return {
    kind: "transformation",
    type: "returns",
    reference: returns,
    async: false,
    schema,
    "~run"(dataset, config2) {
      const func = dataset.value;
      dataset.value = (...args_) => {
        const returnsDataset = this.schema["~run"](
          { value: func(...args_) },
          config2
        );
        if (returnsDataset.issues) {
          throw new ValiError(returnsDataset.issues);
        }
        return returnsDataset.value;
      };
      return dataset;
    }
  };
}
__name(returns, "returns");
// @__NO_SIDE_EFFECTS__
function returnsAsync(schema) {
  return {
    kind: "transformation",
    type: "returns",
    reference: returnsAsync,
    async: false,
    schema,
    "~run"(dataset, config2) {
      const func = dataset.value;
      dataset.value = async (...args_) => {
        const returnsDataset = await this.schema["~run"](
          { value: await func(...args_) },
          config2
        );
        if (returnsDataset.issues) {
          throw new ValiError(returnsDataset.issues);
        }
        return returnsDataset.value;
      };
      return dataset;
    }
  };
}
__name(returnsAsync, "returnsAsync");
// @__NO_SIDE_EFFECTS__
function rfcEmail(message2) {
  return {
    kind: "validation",
    type: "rfc_email",
    reference: rfcEmail,
    expects: null,
    async: false,
    requirement: RFC_EMAIL_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "email", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(rfcEmail, "rfcEmail");
// @__NO_SIDE_EFFECTS__
function safeInteger(message2) {
  return {
    kind: "validation",
    type: "safe_integer",
    reference: safeInteger,
    async: false,
    expects: null,
    requirement: Number.isSafeInteger,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "safe integer", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(safeInteger, "safeInteger");
// @__NO_SIDE_EFFECTS__
function size(requirement, message2) {
  return {
    kind: "validation",
    type: "size",
    reference: size,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && dataset.value.size !== this.requirement) {
        _addIssue(this, "size", dataset, config2, {
          received: `${dataset.value.size}`
        });
      }
      return dataset;
    }
  };
}
__name(size, "size");
// @__NO_SIDE_EFFECTS__
function slug(message2) {
  return {
    kind: "validation",
    type: "slug",
    reference: slug,
    async: false,
    expects: null,
    requirement: SLUG_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "slug", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(slug, "slug");
// @__NO_SIDE_EFFECTS__
function someItem(requirement, message2) {
  return {
    kind: "validation",
    type: "some_item",
    reference: someItem,
    async: false,
    expects: null,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !dataset.value.some(this.requirement)) {
        _addIssue(this, "item", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(someItem, "someItem");
// @__NO_SIDE_EFFECTS__
function sortItems(operation) {
  return {
    kind: "transformation",
    type: "sort_items",
    reference: sortItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.sort(this.operation);
      return dataset;
    }
  };
}
__name(sortItems, "sortItems");
// @__NO_SIDE_EFFECTS__
function startsWith(requirement, message2) {
  return {
    kind: "validation",
    type: "starts_with",
    reference: startsWith,
    async: false,
    expects: `"${requirement}"`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !dataset.value.startsWith(this.requirement)) {
        _addIssue(this, "start", dataset, config2, {
          received: `"${dataset.value.slice(0, this.requirement.length)}"`
        });
      }
      return dataset;
    }
  };
}
__name(startsWith, "startsWith");
// @__NO_SIDE_EFFECTS__
function stringifyJson(config2, message2) {
  return {
    kind: "transformation",
    type: "stringify_json",
    reference: stringifyJson,
    message: message2,
    config: config2,
    async: false,
    "~run"(dataset, config3) {
      try {
        const output = JSON.stringify(
          dataset.value,
          // @ts-expect-error
          this.config?.replacer,
          this.config?.space
        );
        if (output === void 0) {
          _addIssue(this, "JSON", dataset, config3);
          dataset.typed = false;
        }
        dataset.value = output;
      } catch (error) {
        if (error instanceof Error) {
          _addIssue(this, "JSON", dataset, config3, {
            received: `"${error.message}"`
          });
          dataset.typed = false;
        } else {
          throw error;
        }
      }
      return dataset;
    }
  };
}
__name(stringifyJson, "stringifyJson");
// @__NO_SIDE_EFFECTS__
function title(title_) {
  return {
    kind: "metadata",
    type: "title",
    reference: title,
    title: title_
  };
}
__name(title, "title");
// @__NO_SIDE_EFFECTS__
function toLowerCase() {
  return {
    kind: "transformation",
    type: "to_lower_case",
    reference: toLowerCase,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.toLowerCase();
      return dataset;
    }
  };
}
__name(toLowerCase, "toLowerCase");
// @__NO_SIDE_EFFECTS__
function toMaxValue(requirement) {
  return {
    kind: "transformation",
    type: "to_max_value",
    reference: toMaxValue,
    async: false,
    requirement,
    "~run"(dataset) {
      dataset.value = dataset.value > this.requirement ? this.requirement : dataset.value;
      return dataset;
    }
  };
}
__name(toMaxValue, "toMaxValue");
// @__NO_SIDE_EFFECTS__
function toMinValue(requirement) {
  return {
    kind: "transformation",
    type: "to_min_value",
    reference: toMinValue,
    async: false,
    requirement,
    "~run"(dataset) {
      dataset.value = dataset.value < this.requirement ? this.requirement : dataset.value;
      return dataset;
    }
  };
}
__name(toMinValue, "toMinValue");
// @__NO_SIDE_EFFECTS__
function toUpperCase() {
  return {
    kind: "transformation",
    type: "to_upper_case",
    reference: toUpperCase,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.toUpperCase();
      return dataset;
    }
  };
}
__name(toUpperCase, "toUpperCase");
// @__NO_SIDE_EFFECTS__
function transform(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transform,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = this.operation(dataset.value);
      return dataset;
    }
  };
}
__name(transform, "transform");
// @__NO_SIDE_EFFECTS__
function transformAsync(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transformAsync,
    async: true,
    operation,
    async "~run"(dataset) {
      dataset.value = await this.operation(dataset.value);
      return dataset;
    }
  };
}
__name(transformAsync, "transformAsync");
// @__NO_SIDE_EFFECTS__
function trim() {
  return {
    kind: "transformation",
    type: "trim",
    reference: trim,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trim();
      return dataset;
    }
  };
}
__name(trim, "trim");
// @__NO_SIDE_EFFECTS__
function trimEnd() {
  return {
    kind: "transformation",
    type: "trim_end",
    reference: trimEnd,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trimEnd();
      return dataset;
    }
  };
}
__name(trimEnd, "trimEnd");
// @__NO_SIDE_EFFECTS__
function trimStart() {
  return {
    kind: "transformation",
    type: "trim_start",
    reference: trimStart,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trimStart();
      return dataset;
    }
  };
}
__name(trimStart, "trimStart");
// @__NO_SIDE_EFFECTS__
function ulid(message2) {
  return {
    kind: "validation",
    type: "ulid",
    reference: ulid,
    async: false,
    expects: null,
    requirement: ULID_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "ULID", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(ulid, "ulid");
// @__NO_SIDE_EFFECTS__
function url(message2) {
  return {
    kind: "validation",
    type: "url",
    reference: url,
    async: false,
    expects: null,
    requirement(input) {
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    },
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        _addIssue(this, "URL", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(url, "url");
// @__NO_SIDE_EFFECTS__
function uuid(message2) {
  return {
    kind: "validation",
    type: "uuid",
    reference: uuid,
    async: false,
    expects: null,
    requirement: UUID_REGEX,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.test(dataset.value)) {
        _addIssue(this, "UUID", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(uuid, "uuid");
// @__NO_SIDE_EFFECTS__
function value(requirement, message2) {
  return {
    kind: "validation",
    type: "value",
    reference: value,
    async: false,
    expects: requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement),
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !(this.requirement <= dataset.value && this.requirement >= dataset.value)) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(value, "value");
// @__NO_SIDE_EFFECTS__
function values(requirement, message2) {
  return {
    kind: "validation",
    type: "values",
    reference: values,
    async: false,
    expects: `${/* @__PURE__ */ _joinExpects(
      requirement.map(
        (value2) => value2 instanceof Date ? value2.toJSON() : /* @__PURE__ */ _stringify(value2)
      ),
      "|"
    )}`,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed && !this.requirement.some(
        (value2) => value2 <= dataset.value && value2 >= dataset.value
      )) {
        _addIssue(this, "value", dataset, config2, {
          received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value)
        });
      }
      return dataset;
    }
  };
}
__name(values, "values");
// @__NO_SIDE_EFFECTS__
function words(locales, requirement, message2) {
  return {
    kind: "validation",
    type: "words",
    reference: words,
    async: false,
    expects: `${requirement}`,
    locales,
    requirement,
    message: message2,
    "~run"(dataset, config2) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count !== this.requirement) {
          _addIssue(this, "words", dataset, config2, {
            received: `${count}`
          });
        }
      }
      return dataset;
    }
  };
}
__name(words, "words");
function assert(schema, input) {
  const issues = schema["~run"]({ value: input }, { abortEarly: true }).issues;
  if (issues) {
    throw new ValiError(issues);
  }
}
__name(assert, "assert");
// @__NO_SIDE_EFFECTS__
function config(schema, config2) {
  return {
    ...schema,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config_) {
      return schema["~run"](dataset, { ...config_, ...config2 });
    }
  };
}
__name(config, "config");
// @__NO_SIDE_EFFECTS__
function getFallback(schema, dataset, config2) {
  return typeof schema.fallback === "function" ? (
    // @ts-expect-error
    schema.fallback(dataset, config2)
  ) : (
    // @ts-expect-error
    schema.fallback
  );
}
__name(getFallback, "getFallback");
// @__NO_SIDE_EFFECTS__
function fallback(schema, fallback2) {
  return {
    ...schema,
    fallback: fallback2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const outputDataset = schema["~run"](dataset, config2);
      return outputDataset.issues ? { typed: true, value: /* @__PURE__ */ getFallback(this, outputDataset, config2) } : outputDataset;
    }
  };
}
__name(fallback, "fallback");
// @__NO_SIDE_EFFECTS__
function fallbackAsync(schema, fallback2) {
  return {
    ...schema,
    fallback: fallback2,
    async: true,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const outputDataset = await schema["~run"](dataset, config2);
      return outputDataset.issues ? {
        typed: true,
        value: await /* @__PURE__ */ getFallback(this, outputDataset, config2)
      } : outputDataset;
    }
  };
}
__name(fallbackAsync, "fallbackAsync");
// @__NO_SIDE_EFFECTS__
function flatten(issues) {
  const flatErrors = {};
  for (const issue of issues) {
    if (issue.path) {
      const dotPath = /* @__PURE__ */ getDotPath(issue);
      if (dotPath) {
        if (!flatErrors.nested) {
          flatErrors.nested = {};
        }
        if (flatErrors.nested[dotPath]) {
          flatErrors.nested[dotPath].push(issue.message);
        } else {
          flatErrors.nested[dotPath] = [issue.message];
        }
      } else {
        if (flatErrors.other) {
          flatErrors.other.push(issue.message);
        } else {
          flatErrors.other = [issue.message];
        }
      }
    } else {
      if (flatErrors.root) {
        flatErrors.root.push(issue.message);
      } else {
        flatErrors.root = [issue.message];
      }
    }
  }
  return flatErrors;
}
__name(flatten, "flatten");
// @__NO_SIDE_EFFECTS__
function forward(action, path) {
  return {
    ...action,
    "~run"(dataset, config2) {
      const prevIssues = dataset.issues && [...dataset.issues];
      dataset = action["~run"](dataset, config2);
      if (dataset.issues) {
        for (const issue of dataset.issues) {
          if (!prevIssues?.includes(issue)) {
            let pathInput = dataset.value;
            for (const key of path) {
              const pathValue = pathInput[key];
              const pathItem = {
                type: "unknown",
                origin: "value",
                input: pathInput,
                key,
                value: pathValue
              };
              if (issue.path) {
                issue.path.push(pathItem);
              } else {
                issue.path = [pathItem];
              }
              if (!pathValue) {
                break;
              }
              pathInput = pathValue;
            }
          }
        }
      }
      return dataset;
    }
  };
}
__name(forward, "forward");
// @__NO_SIDE_EFFECTS__
function forwardAsync(action, path) {
  return {
    ...action,
    async: true,
    async "~run"(dataset, config2) {
      const prevIssues = dataset.issues && [...dataset.issues];
      dataset = await action["~run"](dataset, config2);
      if (dataset.issues) {
        for (const issue of dataset.issues) {
          if (!prevIssues?.includes(issue)) {
            let pathInput = dataset.value;
            for (const key of path) {
              const pathValue = pathInput[key];
              const pathItem = {
                type: "unknown",
                origin: "value",
                input: pathInput,
                key,
                value: pathValue
              };
              if (issue.path) {
                issue.path.push(pathItem);
              } else {
                issue.path = [pathItem];
              }
              if (!pathValue) {
                break;
              }
              pathInput = pathValue;
            }
          }
        }
      }
      return dataset;
    }
  };
}
__name(forwardAsync, "forwardAsync");
// @__NO_SIDE_EFFECTS__
function getDefault(schema, dataset, config2) {
  return typeof schema.default === "function" ? (
    // @ts-expect-error
    schema.default(dataset, config2)
  ) : (
    // @ts-expect-error
    schema.default
  );
}
__name(getDefault, "getDefault");
// @__NO_SIDE_EFFECTS__
function getDefaults(schema) {
  if ("entries" in schema) {
    const object2 = {};
    for (const key in schema.entries) {
      object2[key] = /* @__PURE__ */ getDefaults(schema.entries[key]);
    }
    return object2;
  }
  if ("items" in schema) {
    return schema.items.map(getDefaults);
  }
  return /* @__PURE__ */ getDefault(schema);
}
__name(getDefaults, "getDefaults");
// @__NO_SIDE_EFFECTS__
async function getDefaultsAsync(schema) {
  if ("entries" in schema) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(schema.entries).map(async ([key, value2]) => [
          key,
          await /* @__PURE__ */ getDefaultsAsync(value2)
        ])
      )
    );
  }
  if ("items" in schema) {
    return Promise.all(schema.items.map(getDefaultsAsync));
  }
  return /* @__PURE__ */ getDefault(schema);
}
__name(getDefaultsAsync, "getDefaultsAsync");
// @__NO_SIDE_EFFECTS__
function getDescription(schema) {
  return /* @__PURE__ */ _getLastMetadata(schema, "description");
}
__name(getDescription, "getDescription");
// @__NO_SIDE_EFFECTS__
function getFallbacks(schema) {
  if ("entries" in schema) {
    const object2 = {};
    for (const key in schema.entries) {
      object2[key] = /* @__PURE__ */ getFallbacks(schema.entries[key]);
    }
    return object2;
  }
  if ("items" in schema) {
    return schema.items.map(getFallbacks);
  }
  return /* @__PURE__ */ getFallback(schema);
}
__name(getFallbacks, "getFallbacks");
// @__NO_SIDE_EFFECTS__
async function getFallbacksAsync(schema) {
  if ("entries" in schema) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(schema.entries).map(async ([key, value2]) => [
          key,
          await /* @__PURE__ */ getFallbacksAsync(value2)
        ])
      )
    );
  }
  if ("items" in schema) {
    return Promise.all(schema.items.map(getFallbacksAsync));
  }
  return /* @__PURE__ */ getFallback(schema);
}
__name(getFallbacksAsync, "getFallbacksAsync");
// @__NO_SIDE_EFFECTS__
function getMetadata(schema) {
  const result = {};
  function depthFirstMerge(schema2) {
    if ("pipe" in schema2) {
      for (const item of schema2.pipe) {
        if (item.kind === "schema" && "pipe" in item) {
          depthFirstMerge(item);
        } else if (item.kind === "metadata" && item.type === "metadata") {
          Object.assign(result, item.metadata);
        }
      }
    }
  }
  __name(depthFirstMerge, "depthFirstMerge");
  depthFirstMerge(schema);
  return result;
}
__name(getMetadata, "getMetadata");
// @__NO_SIDE_EFFECTS__
function getTitle(schema) {
  return /* @__PURE__ */ _getLastMetadata(schema, "title");
}
__name(getTitle, "getTitle");
// @__NO_SIDE_EFFECTS__
function is(schema, input) {
  return !schema["~run"]({ value: input }, { abortEarly: true }).issues;
}
__name(is, "is");
// @__NO_SIDE_EFFECTS__
function any() {
  return {
    kind: "schema",
    type: "any",
    reference: any,
    expects: "any",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
__name(any, "any");
// @__NO_SIDE_EFFECTS__
function array(item, message2) {
  return {
    kind: "schema",
    type: "array",
    reference: array,
    expects: "Array",
    async: false,
    item,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < input.length; key++) {
          const value2 = input[key];
          const itemDataset = this.item["~run"]({ value: value2 }, config2);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(array, "array");
// @__NO_SIDE_EFFECTS__
function arrayAsync(item, message2) {
  return {
    kind: "schema",
    type: "array",
    reference: arrayAsync,
    expects: "Array",
    async: true,
    item,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(
          input.map((value2) => this.item["~run"]({ value: value2 }, config2))
        );
        for (let key = 0; key < itemDatasets.length; key++) {
          const itemDataset = itemDatasets[key];
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: input[key]
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(arrayAsync, "arrayAsync");
// @__NO_SIDE_EFFECTS__
function bigint(message2) {
  return {
    kind: "schema",
    type: "bigint",
    reference: bigint,
    expects: "bigint",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "bigint") {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(bigint, "bigint");
// @__NO_SIDE_EFFECTS__
function blob(message2) {
  return {
    kind: "schema",
    type: "blob",
    reference: blob,
    expects: "Blob",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value instanceof Blob) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(blob, "blob");
// @__NO_SIDE_EFFECTS__
function boolean(message2) {
  return {
    kind: "schema",
    type: "boolean",
    reference: boolean,
    expects: "boolean",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "boolean") {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(boolean, "boolean");
// @__NO_SIDE_EFFECTS__
function custom(check2, message2) {
  return {
    kind: "schema",
    type: "custom",
    reference: custom,
    expects: "unknown",
    async: false,
    check: check2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (this.check(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(custom, "custom");
// @__NO_SIDE_EFFECTS__
function customAsync(check2, message2) {
  return {
    kind: "schema",
    type: "custom",
    reference: customAsync,
    expects: "unknown",
    async: true,
    check: check2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (await this.check(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(customAsync, "customAsync");
// @__NO_SIDE_EFFECTS__
function date(message2) {
  return {
    kind: "schema",
    type: "date",
    reference: date,
    expects: "Date",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value instanceof Date) {
        if (!isNaN(dataset.value)) {
          dataset.typed = true;
        } else {
          _addIssue(this, "type", dataset, config2, {
            received: '"Invalid Date"'
          });
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(date, "date");
// @__NO_SIDE_EFFECTS__
function enum_(enum__, message2) {
  const options = [];
  for (const key in enum__) {
    if (`${+key}` !== key || typeof enum__[key] !== "string" || !Object.is(enum__[enum__[key]], +key)) {
      options.push(enum__[key]);
    }
  }
  return {
    kind: "schema",
    type: "enum",
    reference: enum_,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    enum: enum__,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (this.options.includes(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(enum_, "enum_");
// @__NO_SIDE_EFFECTS__
function exactOptional(wrapped, default_) {
  return {
    kind: "schema",
    type: "exact_optional",
    reference: exactOptional,
    expects: wrapped.expects,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(exactOptional, "exactOptional");
// @__NO_SIDE_EFFECTS__
function exactOptionalAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "exact_optional",
    reference: exactOptionalAsync,
    expects: wrapped.expects,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(exactOptionalAsync, "exactOptionalAsync");
// @__NO_SIDE_EFFECTS__
function file(message2) {
  return {
    kind: "schema",
    type: "file",
    reference: file,
    expects: "File",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value instanceof File) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(file, "file");
// @__NO_SIDE_EFFECTS__
function function_(message2) {
  return {
    kind: "schema",
    type: "function",
    reference: function_,
    expects: "Function",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "function") {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(function_, "function_");
// @__NO_SIDE_EFFECTS__
function instance(class_, message2) {
  return {
    kind: "schema",
    type: "instance",
    reference: instance,
    expects: class_.name,
    async: false,
    class: class_,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value instanceof this.class) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(instance, "instance");
// @__NO_SIDE_EFFECTS__
function _merge(value1, value2) {
  if (typeof value1 === typeof value2) {
    if (value1 === value2 || value1 instanceof Date && value2 instanceof Date && +value1 === +value2) {
      return { value: value1 };
    }
    if (value1 && value2 && value1.constructor === Object && value2.constructor === Object) {
      for (const key in value2) {
        if (key in value1) {
          const dataset = /* @__PURE__ */ _merge(value1[key], value2[key]);
          if (dataset.issue) {
            return dataset;
          }
          value1[key] = dataset.value;
        } else {
          value1[key] = value2[key];
        }
      }
      return { value: value1 };
    }
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length === value2.length) {
        for (let index = 0; index < value1.length; index++) {
          const dataset = /* @__PURE__ */ _merge(value1[index], value2[index]);
          if (dataset.issue) {
            return dataset;
          }
          value1[index] = dataset.value;
        }
        return { value: value1 };
      }
    }
  }
  return { issue: true };
}
__name(_merge, "_merge");
// @__NO_SIDE_EFFECTS__
function intersect(options, message2) {
  return {
    kind: "schema",
    type: "intersect",
    reference: intersect,
    expects: /* @__PURE__ */ _joinExpects(
      options.map((option) => option.expects),
      "&"
    ),
    async: false,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (this.options.length) {
        const input = dataset.value;
        let outputs;
        dataset.typed = true;
        for (const schema of this.options) {
          const optionDataset = schema["~run"]({ value: input }, config2);
          if (optionDataset.issues) {
            if (dataset.issues) {
              dataset.issues.push(...optionDataset.issues);
            } else {
              dataset.issues = optionDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!optionDataset.typed) {
            dataset.typed = false;
          }
          if (dataset.typed) {
            if (outputs) {
              outputs.push(optionDataset.value);
            } else {
              outputs = [optionDataset.value];
            }
          }
        }
        if (dataset.typed) {
          dataset.value = outputs[0];
          for (let index = 1; index < outputs.length; index++) {
            const mergeDataset = /* @__PURE__ */ _merge(dataset.value, outputs[index]);
            if (mergeDataset.issue) {
              _addIssue(this, "type", dataset, config2, {
                received: "unknown"
              });
              break;
            }
            dataset.value = mergeDataset.value;
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(intersect, "intersect");
// @__NO_SIDE_EFFECTS__
function intersectAsync(options, message2) {
  return {
    kind: "schema",
    type: "intersect",
    reference: intersectAsync,
    expects: /* @__PURE__ */ _joinExpects(
      options.map((option) => option.expects),
      "&"
    ),
    async: true,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (this.options.length) {
        const input = dataset.value;
        let outputs;
        dataset.typed = true;
        const optionDatasets = await Promise.all(
          this.options.map((schema) => schema["~run"]({ value: input }, config2))
        );
        for (const optionDataset of optionDatasets) {
          if (optionDataset.issues) {
            if (dataset.issues) {
              dataset.issues.push(...optionDataset.issues);
            } else {
              dataset.issues = optionDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!optionDataset.typed) {
            dataset.typed = false;
          }
          if (dataset.typed) {
            if (outputs) {
              outputs.push(optionDataset.value);
            } else {
              outputs = [optionDataset.value];
            }
          }
        }
        if (dataset.typed) {
          dataset.value = outputs[0];
          for (let index = 1; index < outputs.length; index++) {
            const mergeDataset = /* @__PURE__ */ _merge(dataset.value, outputs[index]);
            if (mergeDataset.issue) {
              _addIssue(this, "type", dataset, config2, {
                received: "unknown"
              });
              break;
            }
            dataset.value = mergeDataset.value;
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(intersectAsync, "intersectAsync");
// @__NO_SIDE_EFFECTS__
function lazy(getter) {
  return {
    kind: "schema",
    type: "lazy",
    reference: lazy,
    expects: "unknown",
    async: false,
    getter,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      return this.getter(dataset.value)["~run"](dataset, config2);
    }
  };
}
__name(lazy, "lazy");
// @__NO_SIDE_EFFECTS__
function lazyAsync(getter) {
  return {
    kind: "schema",
    type: "lazy",
    reference: lazyAsync,
    expects: "unknown",
    async: true,
    getter,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      return (await this.getter(dataset.value))["~run"](dataset, config2);
    }
  };
}
__name(lazyAsync, "lazyAsync");
// @__NO_SIDE_EFFECTS__
function literal(literal_, message2) {
  return {
    kind: "schema",
    type: "literal",
    reference: literal,
    expects: /* @__PURE__ */ _stringify(literal_),
    async: false,
    literal: literal_,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === this.literal) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(literal, "literal");
// @__NO_SIDE_EFFECTS__
function looseObject(entries2, message2) {
  return {
    kind: "schema",
    type: "loose_object",
    reference: looseObject,
    expects: "Object",
    async: false,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
          valueSchema.default !== void 0) {
            const value2 = key in input ? (
              // @ts-expect-error
              input[key]
            ) : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value2 }, config2);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  // @ts-expect-error
                  value: input[key]
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const key in input) {
            if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) {
              dataset.value[key] = input[key];
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(looseObject, "looseObject");
// @__NO_SIDE_EFFECTS__
function looseObjectAsync(entries2, message2) {
  return {
    kind: "schema",
    type: "loose_object",
    reference: looseObjectAsync,
    expects: "Object",
    async: true,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(
          Object.entries(this.entries).map(async ([key, valueSchema]) => {
            if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
            valueSchema.default !== void 0) {
              const value2 = key in input ? (
                // @ts-expect-error
                input[key]
              ) : await /* @__PURE__ */ getDefault(valueSchema);
              return [
                key,
                value2,
                valueSchema,
                await valueSchema["~run"]({ value: value2 }, config2)
              ];
            }
            return [
              key,
              // @ts-expect-error
              input[key],
              valueSchema,
              null
            ];
          })
        );
        for (const [key, value2, valueSchema, valueDataset] of valueDatasets) {
          if (valueDataset) {
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: value2
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const key in input) {
            if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) {
              dataset.value[key] = input[key];
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(looseObjectAsync, "looseObjectAsync");
// @__NO_SIDE_EFFECTS__
function looseTuple(items, message2) {
  return {
    kind: "schema",
    type: "loose_tuple",
    reference: looseTuple,
    expects: "Array",
    async: false,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value2 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value2 }, config2);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (let key = this.items.length; key < input.length; key++) {
            dataset.value.push(input[key]);
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(looseTuple, "looseTuple");
// @__NO_SIDE_EFFECTS__
function looseTupleAsync(items, message2) {
  return {
    kind: "schema",
    type: "loose_tuple",
    reference: looseTupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(
          this.items.map(async (item, key) => {
            const value2 = input[key];
            return [key, value2, await item["~run"]({ value: value2 }, config2)];
          })
        );
        for (const [key, value2, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (let key = this.items.length; key < input.length; key++) {
            dataset.value.push(input[key]);
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(looseTupleAsync, "looseTupleAsync");
// @__NO_SIDE_EFFECTS__
function map(key, value2, message2) {
  return {
    kind: "schema",
    type: "map",
    reference: map,
    expects: "Map",
    async: false,
    key,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input instanceof Map) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Map();
        for (const [inputKey, inputValue] of input) {
          const keyDataset = this.key["~run"]({ value: inputKey }, config2);
          if (keyDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "key",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of keyDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = keyDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          const valueDataset = this.value["~run"](
            { value: inputValue },
            config2
          );
          if (valueDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "value",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = valueDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.set(keyDataset.value, valueDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(map, "map");
// @__NO_SIDE_EFFECTS__
function mapAsync(key, value2, message2) {
  return {
    kind: "schema",
    type: "map",
    reference: mapAsync,
    expects: "Map",
    async: true,
    key,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input instanceof Map) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Map();
        const datasets = await Promise.all(
          [...input].map(
            ([inputKey, inputValue]) => Promise.all([
              inputKey,
              inputValue,
              this.key["~run"]({ value: inputKey }, config2),
              this.value["~run"]({ value: inputValue }, config2)
            ])
          )
        );
        for (const [
          inputKey,
          inputValue,
          keyDataset,
          valueDataset
        ] of datasets) {
          if (keyDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "key",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of keyDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = keyDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (valueDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "value",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = valueDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.set(keyDataset.value, valueDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(mapAsync, "mapAsync");
// @__NO_SIDE_EFFECTS__
function nan(message2) {
  return {
    kind: "schema",
    type: "nan",
    reference: nan,
    expects: "NaN",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (Number.isNaN(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nan, "nan");
// @__NO_SIDE_EFFECTS__
function never(message2) {
  return {
    kind: "schema",
    type: "never",
    reference: never,
    expects: "never",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      _addIssue(this, "type", dataset, config2);
      return dataset;
    }
  };
}
__name(never, "never");
// @__NO_SIDE_EFFECTS__
function nonNullable(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_nullable",
    reference: nonNullable,
    expects: "!null",
    async: false,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value !== null) {
        dataset = this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === null) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonNullable, "nonNullable");
// @__NO_SIDE_EFFECTS__
function nonNullableAsync(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_nullable",
    reference: nonNullableAsync,
    expects: "!null",
    async: true,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value !== null) {
        dataset = await this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === null) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonNullableAsync, "nonNullableAsync");
// @__NO_SIDE_EFFECTS__
function nonNullish(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_nullish",
    reference: nonNullish,
    expects: "(!null & !undefined)",
    async: false,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (!(dataset.value === null || dataset.value === void 0)) {
        dataset = this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === null || dataset.value === void 0) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonNullish, "nonNullish");
// @__NO_SIDE_EFFECTS__
function nonNullishAsync(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_nullish",
    reference: nonNullishAsync,
    expects: "(!null & !undefined)",
    async: true,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (!(dataset.value === null || dataset.value === void 0)) {
        dataset = await this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === null || dataset.value === void 0) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonNullishAsync, "nonNullishAsync");
// @__NO_SIDE_EFFECTS__
function nonOptional(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_optional",
    reference: nonOptional,
    expects: "!undefined",
    async: false,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value !== void 0) {
        dataset = this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === void 0) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonOptional, "nonOptional");
// @__NO_SIDE_EFFECTS__
function nonOptionalAsync(wrapped, message2) {
  return {
    kind: "schema",
    type: "non_optional",
    reference: nonOptionalAsync,
    expects: "!undefined",
    async: true,
    wrapped,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value !== void 0) {
        dataset = await this.wrapped["~run"](dataset, config2);
      }
      if (dataset.value === void 0) {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(nonOptionalAsync, "nonOptionalAsync");
// @__NO_SIDE_EFFECTS__
function null_(message2) {
  return {
    kind: "schema",
    type: "null",
    reference: null_,
    expects: "null",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === null) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(null_, "null_");
// @__NO_SIDE_EFFECTS__
function nullable(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullable",
    reference: nullable,
    expects: `(${wrapped.expects} | null)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === null) {
        if (this.default !== void 0) {
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(nullable, "nullable");
// @__NO_SIDE_EFFECTS__
function nullableAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullable",
    reference: nullableAsync,
    expects: `(${wrapped.expects} | null)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value === null) {
        if (this.default !== void 0) {
          dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(nullableAsync, "nullableAsync");
// @__NO_SIDE_EFFECTS__
function nullish(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullish,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === null || dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === null || dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(nullish, "nullish");
// @__NO_SIDE_EFFECTS__
function nullishAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullishAsync,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value === null || dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === null || dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(nullishAsync, "nullishAsync");
// @__NO_SIDE_EFFECTS__
function number(message2) {
  return {
    kind: "schema",
    type: "number",
    reference: number,
    expects: "number",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "number" && !isNaN(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(number, "number");
// @__NO_SIDE_EFFECTS__
function object(entries2, message2) {
  return {
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
          valueSchema.default !== void 0) {
            const value2 = key in input ? (
              // @ts-expect-error
              input[key]
            ) : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value2 }, config2);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  // @ts-expect-error
                  value: input[key]
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(object, "object");
// @__NO_SIDE_EFFECTS__
function objectAsync(entries2, message2) {
  return {
    kind: "schema",
    type: "object",
    reference: objectAsync,
    expects: "Object",
    async: true,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(
          Object.entries(this.entries).map(async ([key, valueSchema]) => {
            if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
            valueSchema.default !== void 0) {
              const value2 = key in input ? (
                // @ts-expect-error
                input[key]
              ) : await /* @__PURE__ */ getDefault(valueSchema);
              return [
                key,
                value2,
                valueSchema,
                await valueSchema["~run"]({ value: value2 }, config2)
              ];
            }
            return [
              key,
              // @ts-expect-error
              input[key],
              valueSchema,
              null
            ];
          })
        );
        for (const [key, value2, valueSchema, valueDataset] of valueDatasets) {
          if (valueDataset) {
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: value2
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(objectAsync, "objectAsync");
// @__NO_SIDE_EFFECTS__
function objectWithRest(entries2, rest, message2) {
  return {
    kind: "schema",
    type: "object_with_rest",
    reference: objectWithRest,
    expects: "Object",
    async: false,
    entries: entries2,
    rest,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
          valueSchema.default !== void 0) {
            const value2 = key in input ? (
              // @ts-expect-error
              input[key]
            ) : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value2 }, config2);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  // @ts-expect-error
                  value: input[key]
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const key in input) {
            if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) {
              const valueDataset = this.rest["~run"](
                // @ts-expect-error
                { value: input[key] },
                config2
              );
              if (valueDataset.issues) {
                const pathItem = {
                  type: "object",
                  origin: "value",
                  input,
                  key,
                  // @ts-expect-error
                  value: input[key]
                };
                for (const issue of valueDataset.issues) {
                  if (issue.path) {
                    issue.path.unshift(pathItem);
                  } else {
                    issue.path = [pathItem];
                  }
                  dataset.issues?.push(issue);
                }
                if (!dataset.issues) {
                  dataset.issues = valueDataset.issues;
                }
                if (config2.abortEarly) {
                  dataset.typed = false;
                  break;
                }
              }
              if (!valueDataset.typed) {
                dataset.typed = false;
              }
              dataset.value[key] = valueDataset.value;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(objectWithRest, "objectWithRest");
// @__NO_SIDE_EFFECTS__
function objectWithRestAsync(entries2, rest, message2) {
  return {
    kind: "schema",
    type: "object_with_rest",
    reference: objectWithRestAsync,
    expects: "Object",
    async: true,
    entries: entries2,
    rest,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const [normalDatasets, restDatasets] = await Promise.all([
          // If key is present or its an optional schema with a default value,
          // parse input of key or default value asynchronously
          Promise.all(
            Object.entries(this.entries).map(async ([key, valueSchema]) => {
              if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
              valueSchema.default !== void 0) {
                const value2 = key in input ? (
                  // @ts-expect-error
                  input[key]
                ) : await /* @__PURE__ */ getDefault(valueSchema);
                return [
                  key,
                  value2,
                  valueSchema,
                  await valueSchema["~run"]({ value: value2 }, config2)
                ];
              }
              return [
                key,
                // @ts-expect-error
                input[key],
                valueSchema,
                null
              ];
            })
          ),
          // Parse other entries with rest schema asynchronously
          // Hint: We exclude specific keys for security reasons
          Promise.all(
            Object.entries(input).filter(
              ([key]) => /* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)
            ).map(
              async ([key, value2]) => [
                key,
                value2,
                await this.rest["~run"]({ value: value2 }, config2)
              ]
            )
          )
        ]);
        for (const [key, value2, valueSchema, valueDataset] of normalDatasets) {
          if (valueDataset) {
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: value2
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const [key, value2, valueDataset] of restDatasets) {
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(objectWithRestAsync, "objectWithRestAsync");
// @__NO_SIDE_EFFECTS__
function optional(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(optional, "optional");
// @__NO_SIDE_EFFECTS__
function optionalAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optionalAsync,
    expects: `(${wrapped.expects} | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(optionalAsync, "optionalAsync");
// @__NO_SIDE_EFFECTS__
function picklist(options, message2) {
  return {
    kind: "schema",
    type: "picklist",
    reference: picklist,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (this.options.includes(dataset.value)) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(picklist, "picklist");
// @__NO_SIDE_EFFECTS__
function promise(message2) {
  return {
    kind: "schema",
    type: "promise",
    reference: promise,
    expects: "Promise",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value instanceof Promise) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(promise, "promise");
// @__NO_SIDE_EFFECTS__
function record(key, value2, message2) {
  return {
    kind: "schema",
    type: "record",
    reference: record,
    expects: "Object",
    async: false,
    key,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const entryKey in input) {
          if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
            const entryValue = input[entryKey];
            const keyDataset = this.key["~run"]({ value: entryKey }, config2);
            if (keyDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "key",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of keyDataset.issues) {
                issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = keyDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            const valueDataset = this.value["~run"](
              { value: entryValue },
              config2
            );
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!keyDataset.typed || !valueDataset.typed) {
              dataset.typed = false;
            }
            if (keyDataset.typed) {
              dataset.value[keyDataset.value] = valueDataset.value;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(record, "record");
// @__NO_SIDE_EFFECTS__
function recordAsync(key, value2, message2) {
  return {
    kind: "schema",
    type: "record",
    reference: recordAsync,
    expects: "Object",
    async: true,
    key,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const datasets = await Promise.all(
          Object.entries(input).filter(([key2]) => /* @__PURE__ */ _isValidObjectKey(input, key2)).map(
            ([entryKey, entryValue]) => Promise.all([
              entryKey,
              entryValue,
              this.key["~run"]({ value: entryKey }, config2),
              this.value["~run"]({ value: entryValue }, config2)
            ])
          )
        );
        for (const [
          entryKey,
          entryValue,
          keyDataset,
          valueDataset
        ] of datasets) {
          if (keyDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "key",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of keyDataset.issues) {
              issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = keyDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = valueDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) {
            dataset.typed = false;
          }
          if (keyDataset.typed) {
            dataset.value[keyDataset.value] = valueDataset.value;
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(recordAsync, "recordAsync");
// @__NO_SIDE_EFFECTS__
function set(value2, message2) {
  return {
    kind: "schema",
    type: "set",
    reference: set,
    expects: "Set",
    async: false,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input instanceof Set) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Set();
        for (const inputValue of input) {
          const valueDataset = this.value["~run"](
            { value: inputValue },
            config2
          );
          if (valueDataset.issues) {
            const pathItem = {
              type: "set",
              origin: "value",
              input,
              key: null,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = valueDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.add(valueDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(set, "set");
// @__NO_SIDE_EFFECTS__
function setAsync(value2, message2) {
  return {
    kind: "schema",
    type: "set",
    reference: setAsync,
    expects: "Set",
    async: true,
    value: value2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input instanceof Set) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Set();
        const valueDatasets = await Promise.all(
          [...input].map(
            async (inputValue) => [
              inputValue,
              await this.value["~run"]({ value: inputValue }, config2)
            ]
          )
        );
        for (const [inputValue, valueDataset] of valueDatasets) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "set",
              origin: "value",
              input,
              key: null,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = valueDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.add(valueDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(setAsync, "setAsync");
// @__NO_SIDE_EFFECTS__
function strictObject(entries2, message2) {
  return {
    kind: "schema",
    type: "strict_object",
    reference: strictObject,
    expects: "Object",
    async: false,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
          valueSchema.default !== void 0) {
            const value2 = key in input ? (
              // @ts-expect-error
              input[key]
            ) : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value2 }, config2);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  // @ts-expect-error
                  value: input[key]
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const key in input) {
            if (!(key in this.entries)) {
              _addIssue(this, "key", dataset, config2, {
                input: key,
                expected: "never",
                path: [
                  {
                    type: "object",
                    origin: "key",
                    input,
                    key,
                    // @ts-expect-error
                    value: input[key]
                  }
                ]
              });
              break;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(strictObject, "strictObject");
// @__NO_SIDE_EFFECTS__
function strictObjectAsync(entries2, message2) {
  return {
    kind: "schema",
    type: "strict_object",
    reference: strictObjectAsync,
    expects: "Object",
    async: true,
    entries: entries2,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(
          Object.entries(this.entries).map(async ([key, valueSchema]) => {
            if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && // @ts-expect-error
            valueSchema.default !== void 0) {
              const value2 = key in input ? (
                // @ts-expect-error
                input[key]
              ) : await /* @__PURE__ */ getDefault(valueSchema);
              return [
                key,
                value2,
                valueSchema,
                await valueSchema["~run"]({ value: value2 }, config2)
              ];
            }
            return [
              key,
              // @ts-expect-error
              input[key],
              valueSchema,
              null
            ];
          })
        );
        for (const [key, value2, valueSchema, valueDataset] of valueDatasets) {
          if (valueDataset) {
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = valueDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) {
              dataset.typed = false;
            }
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) {
            dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
          } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config2, {
              input: void 0,
              expected: `"${key}"`,
              path: [
                {
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: value2
                }
              ]
            });
            if (config2.abortEarly) {
              break;
            }
          }
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const key in input) {
            if (!(key in this.entries)) {
              _addIssue(this, "key", dataset, config2, {
                input: key,
                expected: "never",
                path: [
                  {
                    type: "object",
                    origin: "key",
                    input,
                    key,
                    // @ts-expect-error
                    value: input[key]
                  }
                ]
              });
              break;
            }
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(strictObjectAsync, "strictObjectAsync");
// @__NO_SIDE_EFFECTS__
function strictTuple(items, message2) {
  return {
    kind: "schema",
    type: "strict_tuple",
    reference: strictTuple,
    expects: "Array",
    async: false,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value2 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value2 }, config2);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!(dataset.issues && config2.abortEarly) && this.items.length < input.length) {
          _addIssue(this, "type", dataset, config2, {
            input: input[this.items.length],
            expected: "never",
            path: [
              {
                type: "array",
                origin: "value",
                input,
                key: this.items.length,
                value: input[this.items.length]
              }
            ]
          });
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(strictTuple, "strictTuple");
// @__NO_SIDE_EFFECTS__
function strictTupleAsync(items, message2) {
  return {
    kind: "schema",
    type: "strict_tuple",
    reference: strictTupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(
          this.items.map(async (item, key) => {
            const value2 = input[key];
            return [key, value2, await item["~run"]({ value: value2 }, config2)];
          })
        );
        for (const [key, value2, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!(dataset.issues && config2.abortEarly) && this.items.length < input.length) {
          _addIssue(this, "type", dataset, config2, {
            input: input[this.items.length],
            expected: "never",
            path: [
              {
                type: "array",
                origin: "value",
                input,
                key: this.items.length,
                value: input[this.items.length]
              }
            ]
          });
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(strictTupleAsync, "strictTupleAsync");
// @__NO_SIDE_EFFECTS__
function string(message2) {
  return {
    kind: "schema",
    type: "string",
    reference: string,
    expects: "string",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "string") {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(string, "string");
// @__NO_SIDE_EFFECTS__
function symbol(message2) {
  return {
    kind: "schema",
    type: "symbol",
    reference: symbol,
    expects: "symbol",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (typeof dataset.value === "symbol") {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(symbol, "symbol");
// @__NO_SIDE_EFFECTS__
function tuple(items, message2) {
  return {
    kind: "schema",
    type: "tuple",
    reference: tuple,
    expects: "Array",
    async: false,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value2 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value2 }, config2);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(tuple, "tuple");
// @__NO_SIDE_EFFECTS__
function tupleAsync(items, message2) {
  return {
    kind: "schema",
    type: "tuple",
    reference: tupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(
          this.items.map(async (item, key) => {
            const value2 = input[key];
            return [key, value2, await item["~run"]({ value: value2 }, config2)];
          })
        );
        for (const [key, value2, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(tupleAsync, "tupleAsync");
// @__NO_SIDE_EFFECTS__
function tupleWithRest(items, rest, message2) {
  return {
    kind: "schema",
    type: "tuple_with_rest",
    reference: tupleWithRest,
    expects: "Array",
    async: false,
    items,
    rest,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value2 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value2 }, config2);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (let key = this.items.length; key < input.length; key++) {
            const value2 = input[key];
            const itemDataset = this.rest["~run"]({ value: value2 }, config2);
            if (itemDataset.issues) {
              const pathItem = {
                type: "array",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of itemDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = itemDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!itemDataset.typed) {
              dataset.typed = false;
            }
            dataset.value.push(itemDataset.value);
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(tupleWithRest, "tupleWithRest");
// @__NO_SIDE_EFFECTS__
function tupleWithRestAsync(items, rest, message2) {
  return {
    kind: "schema",
    type: "tuple_with_rest",
    reference: tupleWithRestAsync,
    expects: "Array",
    async: true,
    items,
    rest,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const [normalDatasets, restDatasets] = await Promise.all([
          // Parse schema of each normal item
          Promise.all(
            this.items.map(async (item, key) => {
              const value2 = input[key];
              return [
                key,
                value2,
                await item["~run"]({ value: value2 }, config2)
              ];
            })
          ),
          // Parse other items with rest schema
          Promise.all(
            input.slice(this.items.length).map(async (value2, key) => {
              return [
                key + this.items.length,
                value2,
                await this.rest["~run"]({ value: value2 }, config2)
              ];
            })
          )
        ]);
        for (const [key, value2, itemDataset] of normalDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value2
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) {
              dataset.issues = itemDataset.issues;
            }
            if (config2.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) {
            dataset.typed = false;
          }
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config2.abortEarly) {
          for (const [key, value2, itemDataset] of restDatasets) {
            if (itemDataset.issues) {
              const pathItem = {
                type: "array",
                origin: "value",
                input,
                key,
                value: value2
              };
              for (const issue of itemDataset.issues) {
                if (issue.path) {
                  issue.path.unshift(pathItem);
                } else {
                  issue.path = [pathItem];
                }
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) {
                dataset.issues = itemDataset.issues;
              }
              if (config2.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!itemDataset.typed) {
              dataset.typed = false;
            }
            dataset.value.push(itemDataset.value);
          }
        }
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(tupleWithRestAsync, "tupleWithRestAsync");
// @__NO_SIDE_EFFECTS__
function undefined_(message2) {
  return {
    kind: "schema",
    type: "undefined",
    reference: undefined_,
    expects: "undefined",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(undefined_, "undefined_");
// @__NO_SIDE_EFFECTS__
function undefinedable(wrapped, default_) {
  return {
    kind: "schema",
    type: "undefinedable",
    reference: undefinedable,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(undefinedable, "undefinedable");
// @__NO_SIDE_EFFECTS__
function undefinedableAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "undefinedable",
    reference: undefinedableAsync,
    expects: `(${wrapped.expects} | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) {
          dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config2);
        }
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config2);
    }
  };
}
__name(undefinedableAsync, "undefinedableAsync");
// @__NO_SIDE_EFFECTS__
function _subIssues(datasets) {
  let issues;
  if (datasets) {
    for (const dataset of datasets) {
      if (issues) {
        issues.push(...dataset.issues);
      } else {
        issues = dataset.issues;
      }
    }
  }
  return issues;
}
__name(_subIssues, "_subIssues");
// @__NO_SIDE_EFFECTS__
function union(options, message2) {
  return {
    kind: "schema",
    type: "union",
    reference: union,
    expects: /* @__PURE__ */ _joinExpects(
      options.map((option) => option.expects),
      "|"
    ),
    async: false,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = schema["~run"]({ value: dataset.value }, config2);
        if (optionDataset.typed) {
          if (optionDataset.issues) {
            if (typedDatasets) {
              typedDatasets.push(optionDataset);
            } else {
              typedDatasets = [optionDataset];
            }
          } else {
            validDataset = optionDataset;
            break;
          }
        } else {
          if (untypedDatasets) {
            untypedDatasets.push(optionDataset);
          } else {
            untypedDatasets = [optionDataset];
          }
        }
      }
      if (validDataset) {
        return validDataset;
      }
      if (typedDatasets) {
        if (typedDatasets.length === 1) {
          return typedDatasets[0];
        }
        _addIssue(this, "type", dataset, config2, {
          issues: /* @__PURE__ */ _subIssues(typedDatasets)
        });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) {
        return untypedDatasets[0];
      } else {
        _addIssue(this, "type", dataset, config2, {
          issues: /* @__PURE__ */ _subIssues(untypedDatasets)
        });
      }
      return dataset;
    }
  };
}
__name(union, "union");
// @__NO_SIDE_EFFECTS__
function unionAsync(options, message2) {
  return {
    kind: "schema",
    type: "union",
    reference: unionAsync,
    expects: /* @__PURE__ */ _joinExpects(
      options.map((option) => option.expects),
      "|"
    ),
    async: true,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = await schema["~run"](
          { value: dataset.value },
          config2
        );
        if (optionDataset.typed) {
          if (optionDataset.issues) {
            if (typedDatasets) {
              typedDatasets.push(optionDataset);
            } else {
              typedDatasets = [optionDataset];
            }
          } else {
            validDataset = optionDataset;
            break;
          }
        } else {
          if (untypedDatasets) {
            untypedDatasets.push(optionDataset);
          } else {
            untypedDatasets = [optionDataset];
          }
        }
      }
      if (validDataset) {
        return validDataset;
      }
      if (typedDatasets) {
        if (typedDatasets.length === 1) {
          return typedDatasets[0];
        }
        _addIssue(this, "type", dataset, config2, {
          issues: /* @__PURE__ */ _subIssues(typedDatasets)
        });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) {
        return untypedDatasets[0];
      } else {
        _addIssue(this, "type", dataset, config2, {
          issues: /* @__PURE__ */ _subIssues(untypedDatasets)
        });
      }
      return dataset;
    }
  };
}
__name(unionAsync, "unionAsync");
// @__NO_SIDE_EFFECTS__
function unknown() {
  return {
    kind: "schema",
    type: "unknown",
    reference: unknown,
    expects: "unknown",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
__name(unknown, "unknown");
// @__NO_SIDE_EFFECTS__
function variant(key, options, message2) {
  return {
    kind: "schema",
    type: "variant",
    reference: variant,
    expects: "Object",
    async: false,
    key,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = /* @__PURE__ */ __name((variant2, allKeys) => {
          for (const schema of variant2.options) {
            if (schema.type === "variant") {
              parseOptions(schema, new Set(allKeys).add(schema.key));
            } else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? discriminatorSchema["~run"](
                  // @ts-expect-error
                  { typed: false, value: input[currentKey] },
                  { abortEarly: true }
                ).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) {
                    expectedDiscriminators.push(
                      schema.entries[currentKey].expects
                    );
                  }
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = schema["~run"]({ value: input }, config2);
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) {
                  outputDataset = optionDataset;
                }
              }
            }
            if (outputDataset && !outputDataset.issues) {
              break;
            }
          }
        }, "parseOptions");
        parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) {
          return outputDataset;
        }
        _addIssue(this, "type", dataset, config2, {
          // @ts-expect-error
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [
            {
              type: "object",
              origin: "value",
              input,
              key: invalidDiscriminatorKey,
              // @ts-expect-error
              value: input[invalidDiscriminatorKey]
            }
          ]
        });
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(variant, "variant");
// @__NO_SIDE_EFFECTS__
function variantAsync(key, options, message2) {
  return {
    kind: "schema",
    type: "variant",
    reference: variantAsync,
    expects: "Object",
    async: true,
    key,
    options,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = /* @__PURE__ */ __name(async (variant2, allKeys) => {
          for (const schema of variant2.options) {
            if (schema.type === "variant") {
              await parseOptions(schema, new Set(allKeys).add(schema.key));
            } else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? (await discriminatorSchema["~run"](
                  // @ts-expect-error
                  { typed: false, value: input[currentKey] },
                  { abortEarly: true }
                )).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) {
                    expectedDiscriminators.push(
                      schema.entries[currentKey].expects
                    );
                  }
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = await schema["~run"](
                  { value: input },
                  config2
                );
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) {
                  outputDataset = optionDataset;
                }
              }
            }
            if (outputDataset && !outputDataset.issues) {
              break;
            }
          }
        }, "parseOptions");
        await parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) {
          return outputDataset;
        }
        _addIssue(this, "type", dataset, config2, {
          // @ts-expect-error
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [
            {
              type: "object",
              origin: "value",
              input,
              key: invalidDiscriminatorKey,
              // @ts-expect-error
              value: input[invalidDiscriminatorKey]
            }
          ]
        });
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(variantAsync, "variantAsync");
// @__NO_SIDE_EFFECTS__
function void_(message2) {
  return {
    kind: "schema",
    type: "void",
    reference: void_,
    expects: "void",
    async: false,
    message: message2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      if (dataset.value === void 0) {
        dataset.typed = true;
      } else {
        _addIssue(this, "type", dataset, config2);
      }
      return dataset;
    }
  };
}
__name(void_, "void_");
// @__NO_SIDE_EFFECTS__
function keyof(schema, message2) {
  return /* @__PURE__ */ picklist(Object.keys(schema.entries), message2);
}
__name(keyof, "keyof");
// @__NO_SIDE_EFFECTS__
function message(schema, message_) {
  return {
    ...schema,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      return schema["~run"](dataset, { ...config2, message: message_ });
    }
  };
}
__name(message, "message");
// @__NO_SIDE_EFFECTS__
function omit(schema, keys) {
  const entries2 = {
    ...schema.entries
  };
  for (const key of keys) {
    delete entries2[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(omit, "omit");
function parse(schema, input, config2) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config2));
  if (dataset.issues) {
    throw new ValiError(dataset.issues);
  }
  return dataset.value;
}
__name(parse, "parse");
async function parseAsync(schema, input, config2) {
  const dataset = await schema["~run"](
    { value: input },
    /* @__PURE__ */ getGlobalConfig(config2)
  );
  if (dataset.issues) {
    throw new ValiError(dataset.issues);
  }
  return dataset.value;
}
__name(parseAsync, "parseAsync");
// @__NO_SIDE_EFFECTS__
function parser(schema, config2) {
  const func = /* @__PURE__ */ __name((input) => parse(schema, input, config2), "func");
  func.schema = schema;
  func.config = config2;
  return func;
}
__name(parser, "parser");
// @__NO_SIDE_EFFECTS__
function parserAsync(schema, config2) {
  const func = /* @__PURE__ */ __name((input) => parseAsync(schema, input, config2), "func");
  func.schema = schema;
  func.config = config2;
  return func;
}
__name(parserAsync, "parserAsync");
// @__NO_SIDE_EFFECTS__
function partial(schema, keys) {
  const entries2 = {};
  for (const key in schema.entries) {
    entries2[key] = !keys || keys.includes(key) ? /* @__PURE__ */ optional(schema.entries[key]) : schema.entries[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(partial, "partial");
// @__NO_SIDE_EFFECTS__
function partialAsync(schema, keys) {
  const entries2 = {};
  for (const key in schema.entries) {
    entries2[key] = !keys || keys.includes(key) ? /* @__PURE__ */ optionalAsync(schema.entries[key]) : schema.entries[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(partialAsync, "partialAsync");
// @__NO_SIDE_EFFECTS__
function pick(schema, keys) {
  const entries2 = {};
  for (const key of keys) {
    entries2[key] = schema.entries[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(pick, "pick");
// @__NO_SIDE_EFFECTS__
function pipe(...pipe2) {
  return {
    ...pipe2[0],
    pipe: pipe2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config2) {
      for (const item of pipe2) {
        if (item.kind !== "metadata") {
          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
            dataset.typed = false;
            break;
          }
          if (!dataset.issues || !config2.abortEarly && !config2.abortPipeEarly) {
            dataset = item["~run"](dataset, config2);
          }
        }
      }
      return dataset;
    }
  };
}
__name(pipe, "pipe");
// @__NO_SIDE_EFFECTS__
function pipeAsync(...pipe2) {
  return {
    ...pipe2[0],
    pipe: pipe2,
    async: true,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config2) {
      for (const item of pipe2) {
        if (item.kind !== "metadata") {
          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
            dataset.typed = false;
            break;
          }
          if (!dataset.issues || !config2.abortEarly && !config2.abortPipeEarly) {
            dataset = await item["~run"](dataset, config2);
          }
        }
      }
      return dataset;
    }
  };
}
__name(pipeAsync, "pipeAsync");
// @__NO_SIDE_EFFECTS__
function required(schema, arg2, arg3) {
  const keys = Array.isArray(arg2) ? arg2 : void 0;
  const message2 = Array.isArray(arg2) ? arg3 : arg2;
  const entries2 = {};
  for (const key in schema.entries) {
    entries2[key] = !keys || keys.includes(key) ? /* @__PURE__ */ nonOptional(schema.entries[key], message2) : schema.entries[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(required, "required");
// @__NO_SIDE_EFFECTS__
function requiredAsync(schema, arg2, arg3) {
  const keys = Array.isArray(arg2) ? arg2 : void 0;
  const message2 = Array.isArray(arg2) ? arg3 : arg2;
  const entries2 = {};
  for (const key in schema.entries) {
    entries2[key] = !keys || keys.includes(key) ? /* @__PURE__ */ nonOptionalAsync(schema.entries[key], message2) : schema.entries[key];
  }
  return {
    ...schema,
    entries: entries2,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(requiredAsync, "requiredAsync");
// @__NO_SIDE_EFFECTS__
function safeParse(schema, input, config2) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config2));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
__name(safeParse, "safeParse");
// @__NO_SIDE_EFFECTS__
async function safeParseAsync(schema, input, config2) {
  const dataset = await schema["~run"](
    { value: input },
    /* @__PURE__ */ getGlobalConfig(config2)
  );
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
__name(safeParseAsync, "safeParseAsync");
// @__NO_SIDE_EFFECTS__
function safeParser(schema, config2) {
  const func = /* @__PURE__ */ __name((input) => /* @__PURE__ */ safeParse(schema, input, config2), "func");
  func.schema = schema;
  func.config = config2;
  return func;
}
__name(safeParser, "safeParser");
// @__NO_SIDE_EFFECTS__
function safeParserAsync(schema, config2) {
  const func = /* @__PURE__ */ __name((input) => /* @__PURE__ */ safeParseAsync(schema, input, config2), "func");
  func.schema = schema;
  func.config = config2;
  return func;
}
__name(safeParserAsync, "safeParserAsync");
// @__NO_SIDE_EFFECTS__
function summarize(issues) {
  let summary = "";
  for (const issue of issues) {
    if (summary) {
      summary += "\n";
    }
    summary += `× ${issue.message}`;
    const dotPath = /* @__PURE__ */ getDotPath(issue);
    if (dotPath) {
      summary += `
  → at ${dotPath}`;
    }
  }
  return summary;
}
__name(summarize, "summarize");
// @__NO_SIDE_EFFECTS__
function unwrap(schema) {
  return schema.wrapped;
}
__name(unwrap, "unwrap");
function createFoundryError(code, message2, details, cause) {
  return { code, message: message2, details, cause };
}
__name(createFoundryError, "createFoundryError");
function isErrorLike(obj) {
  return typeof obj === "object" && obj !== null;
}
__name(isErrorLike, "isErrorLike");
function isFoundryError(error) {
  if (!isErrorLike(error)) return false;
  return "code" in error && "message" in error && typeof error.code === "string" && typeof error.message === "string";
}
__name(isFoundryError, "isFoundryError");
const JournalEntrySchema = /* @__PURE__ */ object({
  id: /* @__PURE__ */ string(),
  name: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  flags: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown())),
  getFlag: /* @__PURE__ */ optional(
    /* @__PURE__ */ custom((val) => typeof val === "function")
  ),
  setFlag: /* @__PURE__ */ optional(
    /* @__PURE__ */ custom(
      (val) => typeof val === "function"
    )
  )
});
function validateJournalEntries(entries2) {
  const result = /* @__PURE__ */ safeParse(/* @__PURE__ */ array(JournalEntrySchema), entries2);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Journal entry validation failed",
        void 0,
        result.issues
      )
    );
  }
  return ok(result.output);
}
__name(validateJournalEntries, "validateJournalEntries");
function validateSettingValue(key, value2, expectedType, choices) {
  if (expectedType === "string" && typeof value2 !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected string, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (expectedType === "number" && typeof value2 !== "number") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected number, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (expectedType === "boolean" && typeof value2 !== "boolean") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected boolean, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (choices && expectedType === "string") {
    if (!choices.includes(value2)) {
      return err(
        createFoundryError(
          "VALIDATION_FAILED",
          `Setting ${key}: Invalid value "${value2}". Allowed: ${choices.join(", ")}`,
          { key, value: value2, choices }
        )
      );
    }
  }
  return ok(value2);
}
__name(validateSettingValue, "validateSettingValue");
function validateSettingConfig(namespace, key, config2) {
  if (!namespace || typeof namespace !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Invalid setting namespace: must be non-empty string",
        {
          namespace,
          key
        }
      )
    );
  }
  if (!key || typeof key !== "string") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting key: must be non-empty string", {
        namespace,
        key
      })
    );
  }
  if (!config2 || typeof config2 !== "object") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting config: must be object", {
        namespace,
        key
      })
    );
  }
  const configObj = config2;
  if (configObj.scope && !["world", "client", "user"].includes(configObj.scope)) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Invalid setting scope: "${configObj.scope}". Allowed: world, client, user`,
        { namespace, key, scope: configObj.scope }
      )
    );
  }
  return ok(config2);
}
__name(validateSettingConfig, "validateSettingConfig");
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
const FoundryApplicationSchema = /* @__PURE__ */ object({
  // Application should have a string ID
  id: /* @__PURE__ */ string(),
  // Application should have object property (typed as record instead of any)
  object: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown())),
  // Application should have options property
  options: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown()))
});
function validateHookApp(app) {
  if (app === null || app === void 0) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter is null or undefined",
        void 0,
        void 0
      )
    );
  }
  const result = /* @__PURE__ */ safeParse(FoundryApplicationSchema, app);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter validation failed",
        void 0,
        result.issues
      )
    );
  }
  return ok(result.output);
}
__name(validateHookApp, "validateHookApp");
const _JournalVisibilityService = class _JournalVisibilityService {
  constructor(facade, logger) {
    this.facade = facade;
    this.logger = logger;
  }
  /**
   * Sanitizes a string for safe use in log messages.
   * Escapes HTML entities to prevent log injection or display issues.
   *
   * Delegates to sanitizeHtml for robust DOM-based sanitization.
   *
   * @param input - The string to sanitize
   * @returns HTML-safe string
   */
  sanitizeForLog(input) {
    return sanitizeHtml(input);
  }
  /**
   * Gets journal entries marked as hidden via module flag.
   * Logs warnings for entries where flag reading fails to aid diagnosis.
   */
  getHiddenJournalEntries() {
    const allEntriesResult = this.facade.getJournalEntries();
    if (!allEntriesResult.ok) return allEntriesResult;
    const hidden = [];
    for (const journal of allEntriesResult.value) {
      const flagResult = this.facade.getEntryFlag(journal, MODULE_CONSTANTS.FLAGS.HIDDEN);
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
            /* c8 ignore stop */
            errorMessage: flagResult.error.message
          }
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
        this.logger.error("Error getting hidden journal entries", error);
      }, "onErr")
    });
  }
  hideEntries(entries2, html) {
    for (const journal of entries2) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.facade.removeJournalElement(journal.id, journalName, html);
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
_JournalVisibilityService.dependencies = [foundryJournalFacadeToken, loggerToken];
let JournalVisibilityService = _JournalVisibilityService;
const _MetricsCollector = class _MetricsCollector {
  constructor(env) {
    this.env = env;
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: /* @__PURE__ */ new Map(),
      portSelectionFailures: /* @__PURE__ */ new Map()
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
    this.MAX_RESOLUTION_TIMES = METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE;
  }
  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token, durationMs, success) {
    this.metrics.containerResolutions++;
    if (!success) {
      this.metrics.resolutionErrors++;
    }
    this.resolutionTimes[this.resolutionTimesIndex] = durationMs;
    this.resolutionTimesIndex = (this.resolutionTimesIndex + 1) % this.MAX_RESOLUTION_TIMES;
    this.resolutionTimesCount = Math.min(this.resolutionTimesCount + 1, this.MAX_RESOLUTION_TIMES);
  }
  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version) {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
  }
  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version) {
    const count = this.metrics.portSelectionFailures.get(version) ?? 0;
    this.metrics.portSelectionFailures.set(version, count + 1);
  }
  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }
  /**
   * Determines if a performance operation should be sampled based on sampling rate.
   *
   * In production mode, uses probabilistic sampling to reduce overhead.
   * In development mode, always samples (returns true).
   *
   * @returns True if the operation should be measured/recorded
   *
   * @example
   * ```typescript
   * const metrics = container.resolve(metricsCollectorToken);
   * if (metrics.shouldSample()) {
   *   performance.mark('operation-start');
   *   // ... operation ...
   *   performance.mark('operation-end');
   *   performance.measure('operation', 'operation-start', 'operation-end');
   * }
   * ```
   */
  shouldSample() {
    if (this.env.isDevelopment) {
      return true;
    }
    return Math.random() < this.env.performanceSamplingRate;
  }
  /**
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot() {
    let sum = 0;
    for (let i = 0; i < this.resolutionTimesCount; i++) {
      sum += this.resolutionTimes[i];
    }
    const avgTime = this.resolutionTimesCount > 0 ? sum / this.resolutionTimesCount : 0;
    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 ? this.metrics.cacheHits / totalCacheAccess * 100 : 0;
    return {
      containerResolutions: this.metrics.containerResolutions,
      resolutionErrors: this.metrics.resolutionErrors,
      avgResolutionTimeMs: avgTime,
      portSelections: Object.fromEntries(this.metrics.portSelections),
      portSelectionFailures: Object.fromEntries(this.metrics.portSelectionFailures),
      cacheHitRate
    };
  }
  /**
   * Logs a formatted metrics summary to the console.
   * Uses console.table() for easy-to-read tabular output.
   */
  logSummary() {
    const snapshot = this.getSnapshot();
    console.table({
      "Total Resolutions": snapshot.containerResolutions,
      Errors: snapshot.resolutionErrors,
      "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
      "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`
    });
  }
  /**
   * Resets all collected metrics.
   * Useful for testing or starting fresh measurements.
   */
  reset() {
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: /* @__PURE__ */ new Map(),
      portSelectionFailures: /* @__PURE__ */ new Map()
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
  }
};
__name(_MetricsCollector, "MetricsCollector");
_MetricsCollector.dependencies = [environmentConfigToken];
let MetricsCollector = _MetricsCollector;
const _ModuleHealthService = class _ModuleHealthService {
  constructor(container, metricsCollector) {
    this.container = container;
    this.metricsCollector = metricsCollector;
  }
  /**
   * Gets the current health status of the module.
   *
   * Health is determined by:
   * - Container validation state (must be "validated")
   * - Port selection success (at least one port selected)
   * - Resolution errors (none expected)
   *
   * @returns HealthStatus with overall status, individual checks, and timestamp
   *
   * @example
   * ```typescript
   * const healthService = container.resolve(moduleHealthServiceToken);
   * const health = healthService.getHealth();
   *
   * if (health.status !== 'healthy') {
   *   console.warn('Module is not healthy:', health.checks);
   * }
   * ```
   */
  getHealth() {
    const containerValidated = this.container.getValidationState() === "validated";
    const metrics = this.metricsCollector.getSnapshot();
    const hasPortSelections = Object.keys(metrics.portSelections).length > 0 || containerValidated;
    const hasPortFailures = Object.keys(metrics.portSelectionFailures).length > 0;
    let status;
    if (!containerValidated) {
      status = "unhealthy";
    } else if (hasPortFailures || metrics.resolutionErrors > 0) {
      status = "degraded";
    } else {
      status = "healthy";
    }
    return {
      status,
      checks: {
        containerValidated,
        portsSelected: hasPortSelections,
        lastError: hasPortFailures ? `Port selection failures detected for versions: ${Object.keys(metrics.portSelectionFailures).join(", ")}` : null
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
__name(_ModuleHealthService, "ModuleHealthService");
_ModuleHealthService.dependencies = [metricsCollectorToken];
let ModuleHealthService = _ModuleHealthService;
const _PerformanceTrackingService = class _PerformanceTrackingService extends PerformanceTrackerImpl {
  constructor(env, sampler) {
    super(env, sampler);
  }
};
__name(_PerformanceTrackingService, "PerformanceTrackingService");
_PerformanceTrackingService.dependencies = [environmentConfigToken, metricsSamplerToken];
let PerformanceTrackingService = _PerformanceTrackingService;
const _RetryService = class _RetryService {
  constructor(logger, metricsCollector) {
    this.logger = logger;
    this.metricsCollector = metricsCollector;
  }
  /**
   * Retries an async operation with exponential backoff.
   *
   * Useful for handling transient failures in external APIs (e.g., Foundry API calls).
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options (or legacy: maxAttempts number)
   * @param legacyDelayMs - Legacy parameter for backward compatibility
   * @returns Promise resolving to the Result (success or last error)
   *
   * @example
   * ```typescript
   * // New API with mapException (recommended for structured error types)
   * const result = await retryService.retry(
   *   () => foundryApi.fetchData(),
   *   {
   *     maxAttempts: 3,
   *     delayMs: 100,
   *     operationName: "fetchData",
   *     mapException: (error, attempt) => ({
   *       code: 'OPERATION_FAILED' as const,
   *       message: `Attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   *
   * // Legacy API (backward compatible)
   * const result = await retryService.retry(
   *   () => foundryApi.fetchData(),
   *   3, // maxAttempts
   *   100 // delayMs
   * );
   * ```
   */
  async retry(fn, options = 3, legacyDelayMs) {
    const opts = typeof options === "number" ? {
      maxAttempts: options,
      /* c8 ignore next -- Legacy API: delayMs default tested via other retry tests */
      delayMs: legacyDelayMs ?? 100,
      backoffFactor: 1,
      /* c8 ignore next 2 -- Legacy unsafe cast function tested via legacy API tests */
      /* type-coverage:ignore-next-line */
      mapException: /* @__PURE__ */ __name((error) => error, "mapException"),
      // Legacy unsafe cast
      operationName: void 0
    } : {
      /* c8 ignore next -- Modern API: maxAttempts default tested in "should use default maxAttempts of 3" */
      maxAttempts: options.maxAttempts ?? 3,
      delayMs: options.delayMs ?? 100,
      backoffFactor: options.backoffFactor ?? 1,
      /* c8 ignore next 2 -- Default mapException tested when options.mapException is undefined */
      /* type-coverage:ignore-next-line */
      mapException: options.mapException ?? ((error) => error),
      operationName: options.operationName ?? void 0
    };
    if (opts.maxAttempts < 1) {
      return err(opts.mapException("maxAttempts must be >= 1", 0));
    }
    let lastError;
    const startTime = performance.now();
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (result.ok) {
          if (attempt > 1 && opts.operationName) {
            const duration = performance.now() - startTime;
            this.logger.debug(
              `Retry succeeded for "${opts.operationName}" after ${attempt} attempts (${duration.toFixed(2)}ms)`
            );
          }
          return result;
        }
        lastError = result.error;
        if (opts.operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${opts.maxAttempts} failed for "${opts.operationName}"`,
            { error: lastError }
          );
        }
        if (attempt < opts.maxAttempts) {
          const delay = opts.delayMs * Math.pow(attempt, opts.backoffFactor);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = opts.mapException(error, attempt);
        if (opts.operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${opts.maxAttempts} threw exception for "${opts.operationName}"`,
            { error }
          );
        }
        if (attempt < opts.maxAttempts) {
          const delay = opts.delayMs * Math.pow(attempt, opts.backoffFactor);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    if (opts.operationName) {
      const duration = performance.now() - startTime;
      this.logger.warn(
        `All retry attempts exhausted for "${opts.operationName}" after ${opts.maxAttempts} attempts (${duration.toFixed(2)}ms)`
      );
    }
    return err(lastError);
  }
  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options (or legacy: maxAttempts number)
   * @returns The Result (success or last error)
   *
   * @example
   * ```typescript
   * // New API with mapException (recommended for structured error types)
   * const result = retryService.retrySync(
   *   () => parseData(input),
   *   {
   *     maxAttempts: 3,
   *     operationName: "parseData",
   *     mapException: (error, attempt) => ({
   *       code: 'PARSE_FAILED' as const,
   *       message: `Parse attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   *
   * // Legacy API (backward compatible)
   * const result = retryService.retrySync(
   *   () => parseData(input),
   *   3 // maxAttempts
   * );
   * ```
   */
  retrySync(fn, options = 3) {
    const opts = typeof options === "number" ? {
      maxAttempts: options,
      /* c8 ignore next 2 -- Legacy unsafe cast function tested via legacy API tests */
      /* type-coverage:ignore-next-line */
      mapException: /* @__PURE__ */ __name((error) => error, "mapException"),
      // Legacy unsafe cast
      operationName: void 0
    } : {
      /* c8 ignore next -- Default maxAttempts tested in retry.test.ts */
      maxAttempts: options.maxAttempts ?? 3,
      /* c8 ignore next 2 -- Default mapException tested implicitly when options.mapException is undefined */
      /* type-coverage:ignore-next-line */
      mapException: options.mapException ?? ((error) => error),
      operationName: options.operationName ?? void 0
    };
    if (opts.maxAttempts < 1) {
      return err(opts.mapException("maxAttempts must be >= 1", 0));
    }
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = fn();
        if (result.ok) {
          if (attempt > 1 && opts.operationName) {
            this.logger.debug(
              `Retry succeeded for "${opts.operationName}" after ${attempt} attempts`
            );
          }
          return result;
        }
        lastError = result.error;
        if (opts.operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${opts.maxAttempts} failed for "${opts.operationName}"`,
            { error: lastError }
          );
        }
      } catch (error) {
        lastError = opts.mapException(error, attempt);
        if (opts.operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${opts.maxAttempts} threw exception for "${opts.operationName}"`,
            { error }
          );
        }
      }
    }
    if (opts.operationName) {
      this.logger.warn(
        `All retry attempts exhausted for "${opts.operationName}" after ${opts.maxAttempts} attempts`
      );
    }
    return err(lastError);
  }
};
__name(_RetryService, "RetryService");
_RetryService.dependencies = [loggerToken, metricsCollectorToken];
let RetryService = _RetryService;
let cachedVersion = null;
function detectFoundryVersion() {
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
__name(detectFoundryVersion, "detectFoundryVersion");
function getFoundryVersionResult() {
  if (cachedVersion === null) {
    cachedVersion = detectFoundryVersion();
  }
  return cachedVersion;
}
__name(getFoundryVersionResult, "getFoundryVersionResult");
function resetVersionCache() {
  cachedVersion = null;
}
__name(resetVersionCache, "resetVersionCache");
function tryGetFoundryVersion() {
  const result = getFoundryVersionResult();
  return result.ok ? result.value : void 0;
}
__name(tryGetFoundryVersion, "tryGetFoundryVersion");
const _PortSelectionEventEmitter = class _PortSelectionEventEmitter {
  constructor() {
    this.subscribers = [];
  }
  /**
   * Subscribe to port selection events.
   *
   * @param callback - Function to call when events are emitted
   * @returns Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  /**
   * Emit a port selection event to all subscribers.
   *
   * Events are dispatched synchronously.
   *
   * @param event - The event to emit
   */
  emit(event) {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        console.error("PortSelectionEventEmitter: Subscriber error", error);
      }
    }
  }
  /**
   * Remove all subscribers.
   * Useful for cleanup in tests.
   */
  clear() {
    this.subscribers = [];
  }
  /**
   * Get current subscriber count.
   * Useful for testing and diagnostics.
   */
  getSubscriberCount() {
    return this.subscribers.length;
  }
};
__name(_PortSelectionEventEmitter, "PortSelectionEventEmitter");
let PortSelectionEventEmitter = _PortSelectionEventEmitter;
const _PortSelector = class _PortSelector {
  constructor() {
    this.eventEmitter = new PortSelectionEventEmitter();
  }
  /**
   * Subscribe to port selection events.
   *
   * Allows observers to be notified of port selection success/failure for
   * logging, metrics, and other observability concerns.
   *
   * @param callback - Function to call when port selection events occur
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const selector = new PortSelector();
   * const unsubscribe = selector.onEvent((event) => {
   *   if (event.type === 'success') {
   *     console.log(`Port v${event.selectedVersion} selected`);
   *   }
   * });
   * ```
   */
  onEvent(callback) {
    return this.eventEmitter.subscribe(callback);
  }
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
  selectPortFromFactories(factories, foundryVersion, adapterName) {
    const startTime = performance.now();
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
    let selectedVersion = MODULE_CONSTANTS.DEFAULTS.NO_VERSION_SELECTED;
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
      const error = createFoundryError(
        "PORT_SELECTION_FAILED",
        `No compatible port found for Foundry version ${version}`,
        { version, availableVersions: availableVersions || "none" }
      );
      this.eventEmitter.emit({
        type: "failure",
        foundryVersion: version,
        availableVersions,
        adapterName,
        error
      });
      return err(error);
    }
    try {
      const port = selectedFactory();
      const durationMs = performance.now() - startTime;
      this.eventEmitter.emit({
        type: "success",
        selectedVersion,
        foundryVersion: version,
        adapterName,
        durationMs
      });
      return ok(port);
    } catch (error) {
      const foundryError = createFoundryError(
        "PORT_SELECTION_FAILED",
        `Failed to instantiate port v${selectedVersion}`,
        { selectedVersion },
        error
      );
      this.eventEmitter.emit({
        type: "failure",
        foundryVersion: version,
        availableVersions: Array.from(factories.keys()).sort((a, b) => a - b).join(", "),
        adapterName,
        error: foundryError
      });
      return err(foundryError);
    }
  }
};
__name(_PortSelector, "PortSelector");
_PortSelector.dependencies = [];
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
      return err(
        createFoundryError(
          "PORT_REGISTRY_ERROR",
          `Port for version ${version} already registered`,
          { version }
        )
      );
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
   * Creates only the port for the specified version or the highest compatible version.
   * More efficient than createAll() when only one port is needed.
   * @param version - The target Foundry version
   * @returns Result containing the port instance or error
   */
  createForVersion(version) {
    const compatibleVersions = Array.from(this.factories.keys()).filter((v) => v <= version).sort((a, b) => b - a);
    if (compatibleVersions.length === 0) {
      const availableVersions = this.getAvailableVersions().join(", ") || "none";
      return err(
        createFoundryError(
          "PORT_NOT_FOUND",
          `No compatible port for Foundry v${version}. Available ports: ${availableVersions}`,
          { version, availableVersions }
        )
      );
    }
    const selectedVersion = compatibleVersions[0];
    if (selectedVersion === void 0) {
      return err(createFoundryError("PORT_NOT_FOUND", "No compatible version found", { version }));
    }
    const factory = this.factories.get(selectedVersion);
    if (!factory) {
      return err(
        createFoundryError("PORT_NOT_FOUND", `Factory not found for version ${selectedVersion}`, {
          selectedVersion
        })
      );
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
const _PortSelectionObserver = class _PortSelectionObserver {
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
  }
  /**
   * Handle a port selection event.
   *
   * Performs appropriate logging and metrics recording based on event type.
   *
   * @param event - The port selection event to handle
   */
  handleEvent(event) {
    if (event.type === "success") {
      this.handleSuccess(event);
    } else {
      this.handleFailure(event);
    }
  }
  /**
   * Handle successful port selection.
   *
   * Logs debug message and records metrics.
   */
  handleSuccess(event) {
    this.logger.debug(
      `Port selection completed in ${event.durationMs.toFixed(2)}ms (selected: v${event.selectedVersion}${event.adapterName ? ` for ${event.adapterName}` : ""})`
    );
    this.metrics.recordPortSelection(event.selectedVersion);
  }
  /**
   * Handle failed port selection.
   *
   * Logs error and records failure metrics.
   */
  handleFailure(event) {
    this.logger.error("No compatible port found", {
      foundryVersion: event.foundryVersion,
      availableVersions: event.availableVersions,
      adapterName: event.adapterName
    });
    this.metrics.recordPortSelectionFailure(event.foundryVersion);
  }
};
__name(_PortSelectionObserver, "PortSelectionObserver");
let PortSelectionObserver = _PortSelectionObserver;
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
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundryGame"
      );
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
  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then resets the reference.
   */
  dispose() {
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      this.port.dispose();
    }
    this.port = null;
  }
};
__name(_FoundryGameService, "FoundryGameService");
_FoundryGameService.dependencies = [portSelectorToken, foundryGamePortRegistryToken];
let FoundryGameService = _FoundryGameService;
const _FoundryHooksService = class _FoundryHooksService {
  constructor(portSelector, portRegistry, logger) {
    this.port = null;
    this.registeredHooks = /* @__PURE__ */ new Map();
    this.callbackToIdMap = /* @__PURE__ */ new Map();
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.logger = logger;
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
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundryHooks"
      );
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
    const result = portResult.value.on(hookName, callback);
    if (result.ok) {
      if (!this.registeredHooks.has(hookName)) {
        this.registeredHooks.set(hookName, /* @__PURE__ */ new Map());
      }
      this.registeredHooks.get(hookName).set(result.value, callback);
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);
    }
    return result;
  }
  once(hookName, callback) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.once(hookName, callback);
  }
  off(hookName, callbackOrId) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    const result = portResult.value.off(hookName, callbackOrId);
    if (result.ok) {
      if (typeof callbackOrId === "number") {
        const hooks = this.registeredHooks.get(hookName);
        if (hooks) {
          const callback = hooks.get(callbackOrId);
          hooks.delete(callbackOrId);
          if (callback) {
            const hookInfos = this.callbackToIdMap.get(callback);
            if (hookInfos) {
              const filtered = hookInfos.filter(
                (info) => !(info.hookName === hookName && info.id === callbackOrId)
              );
              if (filtered.length === 0) {
                this.callbackToIdMap.delete(callback);
              } else {
                this.callbackToIdMap.set(callback, filtered);
              }
            }
          }
        }
      } else {
        const hookInfos = this.callbackToIdMap.get(callbackOrId);
        if (hookInfos) {
          const matchingInfos = hookInfos.filter((info) => info.hookName === hookName);
          const hooks = this.registeredHooks.get(hookName);
          if (hooks) {
            for (const info of matchingInfos) {
              hooks.delete(info.id);
            }
          }
          const filtered = hookInfos.filter((info) => info.hookName !== hookName);
          if (filtered.length === 0) {
            this.callbackToIdMap.delete(callbackOrId);
          } else {
            this.callbackToIdMap.set(callbackOrId, filtered);
          }
        }
      }
    }
    return result;
  }
  /**
   * Cleans up all registered hooks.
   * Called automatically when the container is disposed.
   */
  dispose() {
    for (const [callback, hookInfos] of this.callbackToIdMap) {
      for (const info of hookInfos) {
        try {
          if (typeof Hooks !== "undefined") {
            Hooks.off(info.hookName, callback);
          }
        } catch (error) {
          this.logger.warn("Failed to unregister hook", {
            hookName: info.hookName,
            hookId: info.id,
            error
          });
        }
      }
    }
    this.registeredHooks.clear();
    this.callbackToIdMap.clear();
    this.port = null;
  }
};
__name(_FoundryHooksService, "FoundryHooksService");
_FoundryHooksService.dependencies = [portSelectorToken, foundryHooksPortRegistryToken, loggerToken];
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
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundryDocument"
      );
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
  async setFlag(document2, scope, key, value2) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return await portResult.value.setFlag(document2, scope, key, value2);
  }
  /**
   * Cleans up resources.
   * Resets the port reference to allow garbage collection.
   */
  dispose() {
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      this.port.dispose();
    }
    this.port = null;
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
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundryUI"
      );
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
  notify(message2, type) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.notify(message2, type);
  }
  /**
   * Cleans up resources.
   * Resets the port reference to allow garbage collection.
   */
  dispose() {
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      this.port.dispose();
    }
    this.port = null;
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
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundrySettings"
      );
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  register(namespace, key, config2) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.register(namespace, key, config2);
  }
  get(namespace, key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.get(namespace, key);
  }
  async set(namespace, key, value2) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.set(namespace, key, value2);
  }
  /**
   * Cleans up resources.
   * Resets the port reference to allow garbage collection.
   */
  dispose() {
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      this.port.dispose();
    }
    this.port = null;
  }
};
__name(_FoundrySettingsService, "FoundrySettingsService");
_FoundrySettingsService.dependencies = [portSelectorToken, foundrySettingsPortRegistryToken];
let FoundrySettingsService = _FoundrySettingsService;
const _FoundryI18nService = class _FoundryI18nService {
  constructor(portSelector, portRegistry) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   *
   * @returns Result containing the port or error if no compatible port can be selected
   */
  getPort() {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        "FoundryI18n"
      );
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  localize(key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.localize(key);
  }
  format(key, data) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.format(key, data);
  }
  has(key) {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.has(key);
  }
};
__name(_FoundryI18nService, "FoundryI18nService");
_FoundryI18nService.dependencies = [portSelectorToken, foundryI18nPortRegistryToken];
let FoundryI18nService = _FoundryI18nService;
const _FoundryJournalFacade = class _FoundryJournalFacade {
  constructor(game2, document2, ui2) {
    this.game = game2;
    this.document = document2;
    this.ui = ui2;
  }
  /**
   * Get all journal entries from Foundry.
   *
   * Delegates to FoundryGame.getJournalEntries().
   */
  getJournalEntries() {
    return this.game.getJournalEntries();
  }
  /**
   * Get a module flag from a journal entry.
   *
   * Delegates to FoundryDocument.getFlag() with module scope.
   *
   * @template T - The flag value type
   * @param entry - The journal entry object
   * @param key - The flag key
   */
  getEntryFlag(entry, key) {
    return this.document.getFlag(
      // Journal entries from Foundry provide getFlag; cast retains narrow interface
      /* type-coverage:ignore-next-line */
      entry,
      MODULE_CONSTANTS.MODULE.ID,
      key
    );
  }
  /**
   * Remove a journal element from the UI.
   *
   * Delegates to FoundryUI.removeJournalElement().
   *
   * @param id - Journal entry ID
   * @param name - Journal entry name (for logging)
   * @param html - HTML container element
   */
  removeJournalElement(id, name, html) {
    return this.ui.removeJournalElement(id, name, html);
  }
};
__name(_FoundryJournalFacade, "FoundryJournalFacade");
_FoundryJournalFacade.dependencies = [foundryGameToken, foundryDocumentToken, foundryUIToken];
let FoundryJournalFacade = _FoundryJournalFacade;
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegex, "escapeRegex");
const _LocalI18nService = class _LocalI18nService {
  constructor() {
    this.translations = /* @__PURE__ */ new Map();
    this.currentLocale = "en";
    this.detectLocale();
  }
  /**
   * Detects browser locale and sets current language.
   * Falls back to 'en' if detection fails.
   */
  detectLocale() {
    if (typeof navigator !== "undefined" && navigator.language) {
      const lang = navigator.language.split("-")[0];
      this.currentLocale = lang ?? "en";
    }
  }
  /**
   * Loads translations from a JSON object.
   * Useful for testing or pre-loaded translation data.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * const i18n = new LocalI18nService();
   * i18n.loadTranslations({
   *   "MODULE.SETTINGS.enableFeature": "Enable Feature",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadTranslations(translations) {
    for (const [key, value2] of Object.entries(translations)) {
      this.translations.set(key, value2);
    }
  }
  /**
   * Translates a key using local translations.
   *
   * @param key - Translation key
   * @returns Result with translated string (or key itself if not found)
   *
   * @example
   * ```typescript
   * const result = i18n.translate("MODULE.SETTINGS.enableFeature");
   * if (result.ok) {
   *   console.log(result.value); // "Enable Feature" or key if not found
   * }
   * ```
   */
  translate(key) {
    const value2 = this.translations.get(key);
    return ok(value2 ?? key);
  }
  /**
   * Formats a string with placeholders.
   * Simple implementation: replaces `{key}` with values from data object.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
   *
   * @example
   * ```typescript
   * // Translation: "Welcome, {name}!"
   * const result = i18n.format("MODULE.WELCOME", { name: "Alice" });
   * if (result.ok) {
   *   console.log(result.value); // "Welcome, Alice!"
   * }
   * ```
   */
  format(key, data) {
    const template = this.translations.get(key) ?? key;
    let formatted = template;
    for (const [placeholder, value2] of Object.entries(data)) {
      const escapedPlaceholder = escapeRegex(placeholder);
      const regex2 = new RegExp(`\\{${escapedPlaceholder}\\}`, "g");
      formatted = formatted.replace(regex2, String(value2));
    }
    return ok(formatted);
  }
  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean
   */
  has(key) {
    return ok(this.translations.has(key));
  }
  /**
   * Gets the current locale.
   *
   * @returns Current locale string (e.g., "en", "de")
   */
  getCurrentLocale() {
    return this.currentLocale;
  }
  /**
   * Sets the current locale.
   * Note: Changing locale requires reloading translations for the new language.
   *
   * @param locale - Locale code (e.g., "en", "de", "fr")
   */
  setLocale(locale) {
    this.currentLocale = locale;
  }
};
__name(_LocalI18nService, "LocalI18nService");
_LocalI18nService.dependencies = [];
let LocalI18nService = _LocalI18nService;
const _I18nFacadeService = class _I18nFacadeService {
  constructor(foundryI18n, localI18n) {
    this.foundryI18n = foundryI18n;
    this.localI18n = localI18n;
  }
  /**
   * Translates a key using Foundry i18n → Local i18n → Fallback.
   *
   * @param key - Translation key
   * @param fallback - Optional fallback string (defaults to key itself)
   * @returns Translated string or fallback
   *
   * @example
   * ```typescript
   * // With fallback
   * const text = i18n.translate("MODULE.UNKNOWN_KEY", "Default Text");
   * console.log(text); // "Default Text"
   *
   * // Without fallback (returns key)
   * const text2 = i18n.translate("MODULE.UNKNOWN_KEY");
   * console.log(text2); // "MODULE.UNKNOWN_KEY"
   * ```
   */
  translate(key, fallback2) {
    const foundryResult = this.foundryI18n.localize(key);
    if (foundryResult.ok && foundryResult.value !== key) {
      return foundryResult.value;
    }
    const localResult = this.localI18n.translate(key);
    if (localResult.ok && localResult.value !== key) {
      return localResult.value;
    }
    return fallback2 ?? key;
  }
  /**
   * Formats a string with placeholders.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @param fallback - Optional fallback string
   * @returns Formatted string or fallback
   *
   * @example
   * ```typescript
   * const text = i18n.format("MODULE.WELCOME", { name: "Alice" }, "Welcome!");
   * console.log(text); // "Welcome, Alice!" or "Welcome!"
   * ```
   */
  format(key, data, fallback2) {
    const foundryResult = this.foundryI18n.format(key, data);
    if (foundryResult.ok && foundryResult.value !== key) {
      return foundryResult.value;
    }
    const localResult = this.localI18n.format(key, data);
    if (localResult.ok && localResult.value !== key) {
      return localResult.value;
    }
    return fallback2 ?? key;
  }
  /**
   * Checks if a translation key exists in either i18n system.
   *
   * @param key - Translation key to check
   * @returns True if key exists in Foundry or local i18n
   */
  has(key) {
    const foundryResult = this.foundryI18n.has(key);
    if (foundryResult.ok && foundryResult.value) {
      return true;
    }
    const localResult = this.localI18n.has(key);
    return localResult.ok && localResult.value;
  }
  /**
   * Loads local translations from a JSON object.
   * Useful for initializing translations on module startup.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * i18n.loadLocalTranslations({
   *   "MODULE.SETTINGS.enableFeature": "Enable Feature",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadLocalTranslations(translations) {
    this.localI18n.loadTranslations(translations);
  }
};
__name(_I18nFacadeService, "I18nFacadeService");
_I18nFacadeService.dependencies = [foundryI18nToken, localI18nToken];
let I18nFacadeService = _I18nFacadeService;
function validateJournalId(id) {
  if (typeof id !== "string") {
    return err(createFoundryError("VALIDATION_FAILED", "ID must be a string"));
  }
  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID cannot be empty"));
  }
  if (id.length > VALIDATION_CONSTRAINTS.MAX_ID_LENGTH) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `ID too long (max ${VALIDATION_CONSTRAINTS.MAX_ID_LENGTH} characters)`
      )
    );
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "ID contains invalid characters (allowed: a-z, A-Z, 0-9, -, _)",
        { id }
      )
    );
  }
  return ok(id);
}
__name(validateJournalId, "validateJournalId");
function validateJournalName(name) {
  if (typeof name !== "string" || name.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "Name cannot be empty"));
  }
  if (name.length > 255) {
    return err(createFoundryError("VALIDATION_FAILED", "Name too long (max 255 characters)"));
  }
  return ok(name);
}
__name(validateJournalName, "validateJournalName");
function validateFlagKey(key) {
  if (typeof key !== "string" || key.length === 0 || key.length > VALIDATION_CONSTRAINTS.MAX_FLAG_KEY_LENGTH) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key length"));
  }
  if (!/^[a-zA-Z0-9_]+$/.test(key)) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key format"));
  }
  return ok(key);
}
__name(validateFlagKey, "validateFlagKey");
const _FoundryGamePortV13 = class _FoundryGamePortV13 {
  constructor() {
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
    this.cacheTtlMs = MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS;
  }
  getJournalEntries() {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    const now = Date.now();
    const cacheAge = now - this.lastCheckTimestamp;
    if (this.cachedEntries !== null && cacheAge < this.cacheTtlMs) {
      return { ok: true, value: this.cachedEntries };
    }
    const entries2 = tryCatch(
      () => Array.from(game.journal.contents),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to access journal entries", void 0, error)
    );
    if (!entries2.ok) {
      return entries2;
    }
    const validationResult = validateJournalEntries(entries2.value);
    if (!validationResult.ok) {
      return validationResult;
    }
    this.cachedEntries = entries2.value;
    this.lastCheckTimestamp = now;
    return { ok: true, value: this.cachedEntries };
  }
  /**
   * Invalidates the journal entries cache.
   * Forces the next getJournalEntries() call to fetch and validate fresh data.
   */
  invalidateCache() {
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }
  getJournalEntryById(id) {
    const validationResult = validateJournalId(id);
    if (!validationResult.ok) {
      return validationResult;
    }
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    return tryCatch(
      () => {
        const entry = game.journal.get(validationResult.value);
        return entry ?? null;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get journal entry by ID ${validationResult.value}`,
        { id: validationResult.value },
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
        const hookId = Hooks.on(hookName, callback);
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
        const hookId = Hooks.once(hookName, callback);
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
        Hooks.off(hookName, callbackOrId);
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
        const value2 = document2.getFlag(scope, key);
        return value2 ?? null;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get flag ${scope}.${key}`,
        { scope, key },
        error
      )
    );
  }
  async setFlag(document2, scope, key, value2) {
    return fromPromise(
      (async () => {
        if (!document2?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document2.setFlag(scope, key, value2);
      })(),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set flag ${scope}.${key}`,
        { scope, key, value: value2 },
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
      `li.directory-item[data-document-id="${safeId}"], li.directory-item[data-entry-id="${safeId}"]`
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
    try {
      element.remove();
      return ok(void 0);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to remove element from DOM",
          { journalName, journalId: safeId },
          error
        )
      );
    }
  }
  findElement(container, selector) {
    const element = container.querySelector(selector);
    return ok(element);
  }
  notify(message2, type) {
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }
    try {
      switch (type) {
        case "info":
          ui.notifications.info(message2);
          break;
        case "warning":
          ui.notifications.warn(message2);
          break;
        case "error":
          ui.notifications.error(message2);
          break;
      }
      return ok(void 0);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to show notification",
          { message: message2, type },
          error
        )
      );
    }
  }
};
__name(_FoundryUIPortV13, "FoundryUIPortV13");
let FoundryUIPortV13 = _FoundryUIPortV13;
const _FoundrySettingsPortV13 = class _FoundrySettingsPortV13 {
  register(namespace, key, config2) {
    const configValidation = validateSettingConfig(namespace, key, config2);
    if (!configValidation.ok) {
      return err(configValidation.error);
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return tryCatch(
      () => {
        game.settings.register(namespace, key, config2);
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
      () => (
        /* type-coverage:ignore-next-line */
        game.settings.get(namespace, key)
      ),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get setting ${namespace}.${key}`,
        { namespace, key },
        error
      )
    );
  }
  async set(namespace, key, value2) {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return fromPromise(
      /* type-coverage:ignore-next-line */
      game.settings.set(
        namespace,
        key,
        value2
      ).then(() => void 0),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set setting ${namespace}.${key}`,
        { namespace, key, value: value2 },
        error
      )
    );
  }
};
__name(_FoundrySettingsPortV13, "FoundrySettingsPortV13");
let FoundrySettingsPortV13 = _FoundrySettingsPortV13;
const _FoundryI18nPortV13 = class _FoundryI18nPortV13 {
  /**
   * Localizes a translation key using Foundry's i18n system.
   *
   * @param key - Translation key
   * @returns Result with translated string (returns key itself if not found)
   */
  localize(key) {
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key);
      }
      const translated = game.i18n.localize(key);
      return ok(translated);
    } catch {
      return ok(key);
    }
  }
  /**
   * Formats a translation key with placeholder values.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
   */
  format(key, data) {
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key);
      }
      const stringData = {};
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = String(v);
      }
      const formatted = game.i18n.format(key, stringData);
      return ok(formatted);
    } catch {
      return ok(key);
    }
  }
  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean indicating existence
   */
  has(key) {
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(false);
      }
      const exists = game.i18n.has(key);
      return ok(exists);
    } catch {
      return ok(false);
    }
  }
};
__name(_FoundryI18nPortV13, "FoundryI18nPortV13");
_FoundryI18nPortV13.dependencies = [];
let FoundryI18nPortV13 = _FoundryI18nPortV13;
function registerPortToRegistry(registry, version, factory, portName, errors) {
  const result = registry.register(version, factory);
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
}
__name(registerPortToRegistry, "registerPortToRegistry");
function registerFallbacks(container) {
  container.registerFallback(loggerToken, () => new ConsoleLoggerService());
}
__name(registerFallbacks, "registerFallbacks");
function registerCoreServices(container) {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  const metricsResult = container.registerClass(
    metricsCollectorToken,
    MetricsCollector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsResult)) {
    return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
  }
  const recorderAliasResult = container.registerAlias(metricsRecorderToken, metricsCollectorToken);
  if (isErr(recorderAliasResult)) {
    return err(`Failed to register MetricsRecorder alias: ${recorderAliasResult.error.message}`);
  }
  const samplerAliasResult = container.registerAlias(metricsSamplerToken, metricsCollectorToken);
  if (isErr(samplerAliasResult)) {
    return err(`Failed to register MetricsSampler alias: ${samplerAliasResult.error.message}`);
  }
  const loggerResult = container.registerClass(
    loggerToken,
    ConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register logger: ${loggerResult.error.message}`);
  }
  const healthResult = container.registerFactory(
    moduleHealthServiceToken,
    () => {
      const metricsResult2 = container.resolveWithError(metricsCollectorToken);
      if (!metricsResult2.ok) {
        throw new Error("MetricsCollector not available for ModuleHealthService");
      }
      return new ModuleHealthService(container, metricsResult2.value);
    },
    ServiceLifecycle.SINGLETON,
    [metricsCollectorToken]
  );
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerCoreServices, "registerCoreServices");
function createPortRegistries() {
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
  const i18nPortRegistry = new PortRegistry();
  registerPortToRegistry(
    i18nPortRegistry,
    13,
    () => new FoundryI18nPortV13(),
    "FoundryI18n",
    portRegistrationErrors
  );
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }
  return ok({
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry
  });
}
__name(createPortRegistries, "createPortRegistries");
function registerPortInfrastructure(container) {
  const portSelectorResult = container.registerClass(
    portSelectorToken,
    PortSelector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }
  const portSelectorResolve = container.resolveWithError(portSelectorToken);
  const loggerResult = container.resolveWithError(loggerToken);
  const recorderResult = container.resolveWithError(metricsRecorderToken);
  if (portSelectorResolve.ok && loggerResult.ok && recorderResult.ok) {
    const observer = new PortSelectionObserver(loggerResult.value, recorderResult.value);
    portSelectorResolve.value.onEvent((event) => observer.handleEvent(event));
  }
  const portsResult = createPortRegistries();
  if (isErr(portsResult)) return portsResult;
  const {
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry
  } = portsResult.value;
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
  const i18nRegistryResult = container.registerValue(
    foundryI18nPortRegistryToken,
    i18nPortRegistry
  );
  if (isErr(i18nRegistryResult)) {
    return err(`Failed to register FoundryI18n PortRegistry: ${i18nRegistryResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerPortInfrastructure, "registerPortInfrastructure");
function registerFoundryServices(container) {
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
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    FoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
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
  return ok(void 0);
}
__name(registerFoundryServices, "registerFoundryServices");
function registerUtilityServices(container) {
  const perfTrackingResult = container.registerClass(
    performanceTrackingServiceToken,
    PerformanceTrackingService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(perfTrackingResult)) {
    return err(
      `Failed to register PerformanceTrackingService: ${perfTrackingResult.error.message}`
    );
  }
  const retryServiceResult = container.registerClass(
    retryServiceToken,
    RetryService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(retryServiceResult)) {
    return err(`Failed to register RetryService: ${retryServiceResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerUtilityServices, "registerUtilityServices");
function registerI18nServices(container) {
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    FoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }
  const localI18nResult = container.registerClass(
    localI18nToken,
    LocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    I18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerI18nServices, "registerI18nServices");
function validateContainer(container) {
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(void 0);
}
__name(validateContainer, "validateContainer");
function configureLogger(container) {
  const resolvedLoggerResult = container.resolveWithError(loggerToken);
  if (resolvedLoggerResult.ok) {
    const loggerInstance = resolvedLoggerResult.value;
    if (loggerInstance.setMinLevel) {
      loggerInstance.setMinLevel(ENV.logLevel);
    }
  }
}
__name(configureLogger, "configureLogger");
function configureDependencies(container) {
  registerFallbacks(container);
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;
  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;
  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;
  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;
  const i18nServicesResult = registerI18nServices(container);
  if (isErr(i18nServicesResult)) return i18nServicesResult;
  const validationResult = validateContainer(container);
  if (isErr(validationResult)) return validationResult;
  configureLogger(container);
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
   *
   * **Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV (direct import) and null MetricsCollector.
   * MetricsCollector is not yet available during bootstrap phase.
   *
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap() {
    const container = ServiceContainer.createRoot();
    const performanceTracker = new BootstrapPerformanceTracker(ENV, null);
    const configured = performanceTracker.track(
      () => configureDependencies(container),
      /* c8 ignore start -- onComplete callback is only called when performance tracking is enabled and sampling passes */
      (duration) => {
        const loggerResult = container.resolveWithError(loggerToken);
        if (loggerResult.ok) {
          loggerResult.value.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
        }
      }
      /* c8 ignore stop */
    );
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
  /* c8 ignore next -- Requires Foundry game module globals */
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
      loggerToken: markAsApiSafe(loggerToken),
      journalVisibilityServiceToken: markAsApiSafe(journalVisibilityServiceToken),
      foundryGameToken: markAsApiSafe(foundryGameToken),
      foundryHooksToken: markAsApiSafe(foundryHooksToken),
      foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
      foundryUIToken: markAsApiSafe(foundryUIToken),
      foundrySettingsToken: markAsApiSafe(foundrySettingsToken)
    };
    const api = {
      version: MODULE_CONSTANTS.API.VERSION,
      // Bind container.resolve() directly (already typed as ApiSafeToken in ModuleApi interface)
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- API boundary: External modules use resolve()
      resolve: container.resolve.bind(container),
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
            /* c8 ignore next -- isRegistered never fails; ok check is defensive */
            isRegistered: isRegisteredResult.ok ? isRegisteredResult.value : false
          });
        }
        return tokenMap;
      }, "getAvailableTokens"),
      tokens: wellKnownTokens,
      getMetrics: /* @__PURE__ */ __name(() => {
        const metricsResult = container.resolveWithError(metricsCollectorToken);
        if (!metricsResult.ok) {
          return {
            containerResolutions: 0,
            resolutionErrors: 0,
            avgResolutionTimeMs: 0,
            portSelections: {},
            portSelectionFailures: {},
            cacheHitRate: 0
          };
        }
        return metricsResult.value.getSnapshot();
      }, "getMetrics"),
      getHealth: /* @__PURE__ */ __name(() => {
        const healthServiceResult = container.resolveWithError(moduleHealthServiceToken);
        if (!healthServiceResult.ok) {
          return {
            status: "unhealthy",
            checks: {
              containerValidated: false,
              portsSelected: false,
              lastError: "ModuleHealthService not available"
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        return healthServiceResult.value.getHealth();
      }, "getHealth")
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
function throttle(fn, windowMs) {
  let isThrottled = false;
  return /* @__PURE__ */ __name(function throttled(...args2) {
    if (!isThrottled) {
      fn(...args2);
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, windowMs);
    }
  }, "throttled");
}
__name(throttle, "throttle");
function debounce(fn, delayMs) {
  let timeoutId = null;
  const debounced = /* @__PURE__ */ __name(function(...args2) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args2);
      timeoutId = null;
    }, delayMs);
  }, "debounced");
  debounced.cancel = function() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  return debounced;
}
__name(debounce, "debounce");
function isJQueryObject(value2) {
  if (value2 === null || typeof value2 !== "object") return false;
  const obj = value2;
  return "length" in obj && typeof obj.length === "number" && obj.length > 0 && "0" in obj;
}
__name(isJQueryObject, "isJQueryObject");
function extractHtmlElement(html) {
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
__name(extractHtmlElement, "extractHtmlElement");
const _RenderJournalDirectoryHook = class _RenderJournalDirectoryHook {
  constructor() {
    this.unsubscribe = null;
  }
  register(container) {
    const foundryHooksResult = container.resolveWithError(foundryHooksToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const journalVisibilityResult = container.resolveWithError(journalVisibilityServiceToken);
    if (!foundryHooksResult.ok || !loggerResult.ok || !journalVisibilityResult.ok) {
      if (loggerResult.ok) {
        loggerResult.value.error("DI resolution failed in RenderJournalDirectoryHook", {
          foundryHooksResolved: foundryHooksResult.ok,
          journalVisibilityResolved: journalVisibilityResult.ok
        });
      }
      return err(new Error("Failed to resolve required services for RenderJournalDirectoryHook"));
    }
    const foundryHooks = foundryHooksResult.value;
    const logger = loggerResult.value;
    const journalVisibility = journalVisibilityResult.value;
    const throttledCallback = throttle((app, html) => {
      logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);
      const appValidation = validateHookApp(app);
      if (!appValidation.ok) {
        logger.error(
          `Invalid app parameter in ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
          {
            code: appValidation.error.code,
            message: appValidation.error.message,
            details: appValidation.error.details
          }
        );
        return;
      }
      const htmlElement = extractHtmlElement(html);
      if (!htmlElement) {
        logger.error("Failed to get HTMLElement from hook - incompatible format");
        return;
      }
      journalVisibility.processJournalDirectory(htmlElement);
    }, HOOK_THROTTLE_WINDOW_MS);
    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      throttledCallback
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
      return err(new Error(`Hook registration failed: ${hookResult.error.message}`));
    }
    return ok(void 0);
  }
  /* c8 ignore start -- Lifecycle method: Called when module is disabled; cleanup logic not testable in unit tests */
  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  /* c8 ignore stop */
};
__name(_RenderJournalDirectoryHook, "RenderJournalDirectoryHook");
let RenderJournalDirectoryHook = _RenderJournalDirectoryHook;
const _ModuleHookRegistrar = class _ModuleHookRegistrar {
  constructor() {
    this.hooks = [
      new RenderJournalDirectoryHook()
      // Add new hooks here
    ];
  }
  /**
   * Registers all hooks with Foundry VTT.
   * @param container - DI container with registered services
   */
  registerAll(container) {
    for (const hook of this.hooks) {
      const result = hook.register(container);
      if (!result.ok) {
        console.error(`Failed to register hook: ${result.error.message}`);
      }
    }
  }
  /**
   * Dispose all hooks.
   * Called when the module is disabled or reloaded.
   */
  /* c8 ignore start -- Lifecycle method: Called when module is disabled; not testable in unit tests */
  disposeAll() {
    for (const hook of this.hooks) {
      hook.dispose();
    }
  }
  /* c8 ignore stop */
};
__name(_ModuleHookRegistrar, "ModuleHookRegistrar");
let ModuleHookRegistrar = _ModuleHookRegistrar;
const logLevelSetting = {
  key: MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level"),
      hint: i18n.translate(
        "MODULE.SETTINGS.logLevel.hint",
        "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
      ),
      scope: "world",
      config: true,
      type: Number,
      choices: {
        [LogLevel.DEBUG]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.debug",
          "DEBUG (All logs - for debugging)"
        ),
        [LogLevel.INFO]: i18n.translate("MODULE.SETTINGS.logLevel.choices.info", "INFO (Standard)"),
        [LogLevel.WARN]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.warn",
          "WARN (Warnings and errors only)"
        ),
        [LogLevel.ERROR]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.error",
          "ERROR (Critical errors only)"
        )
      },
      default: LogLevel.INFO,
      onChange: /* @__PURE__ */ __name((value2) => {
        if (logger.setMinLevel) {
          logger.setMinLevel(value2);
          logger.info(`Log level changed to: ${LogLevel[value2]}`);
        }
      }, "onChange")
    };
  }
};
const _ModuleSettingsRegistrar = class _ModuleSettingsRegistrar {
  constructor() {
    this.settings = // Add new setting types here
    [
      logLevelSetting
      // Add new settings here
    ];
  }
  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * @param container - DI container with registered services
   */
  registerAll(container) {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const i18nResult = container.resolveWithError(i18nFacadeToken);
    if (!settingsResult.ok || !loggerResult.ok || !i18nResult.ok) {
      if (loggerResult.ok) {
        loggerResult.value.error("DI resolution failed in ModuleSettingsRegistrar", {
          settingsResolved: settingsResult.ok,
          i18nResolved: i18nResult.ok
        });
      } else {
        console.error("Failed to resolve required services for settings registration");
      }
      return;
    }
    const foundrySettings = settingsResult.value;
    const logger = loggerResult.value;
    const i18n = i18nResult.value;
    for (const setting of this.settings) {
      const config2 = setting.createConfig(i18n, logger);
      const result = foundrySettings.register(MODULE_CONSTANTS.MODULE.ID, setting.key, config2);
      if (!result.ok) {
        logger.error(`Failed to register ${setting.key} setting`, result.error);
      }
    }
  }
};
__name(_ModuleSettingsRegistrar, "ModuleSettingsRegistrar");
let ModuleSettingsRegistrar = _ModuleSettingsRegistrar;
const _BootstrapErrorHandler = class _BootstrapErrorHandler {
  /**
   * Logs an error with structured context in the browser console.
   *
   * Creates a collapsible group with timestamp, phase, component,
   * error details, and metadata for easy debugging and screenshotting.
   *
   * @param error - The error that occurred (Error object, string, or unknown)
   * @param context - Context information about the error
   */
  static logError(error, context) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.group(`[${timestamp}] ${MODULE_CONSTANTS.LOG_PREFIX} Error in ${context.phase}`);
    if (context.component) {
      console.error("Component:", context.component);
    }
    console.error("Error:", error);
    if (context.metadata && Object.keys(context.metadata).length > 0) {
      console.error("Metadata:", context.metadata);
    }
    console.groupEnd();
  }
};
__name(_BootstrapErrorHandler, "BootstrapErrorHandler");
let BootstrapErrorHandler = _BootstrapErrorHandler;
function initializeFoundryModule() {
  const containerResult = root.getContainer();
  if (!containerResult.ok) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  if (!loggerResult.ok) {
    console.error(
      `${MODULE_CONSTANTS.LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`
    );
    return;
  }
  const logger = loggerResult.value;
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
    const settingsResult = initContainerResult.value.resolveWithError(foundrySettingsToken);
    if (settingsResult.ok) {
      const settings = settingsResult.value;
      const logLevelResult = settings.get(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL
      );
      if (logLevelResult.ok && logger.setMinLevel) {
        logger.setMinLevel(logLevelResult.value);
        logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
      }
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
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);
if (!bootstrapOk) {
  BootstrapErrorHandler.logError(bootstrapResult.error, {
    phase: "bootstrap",
    component: "CompositionRoot",
    metadata: {
      foundryVersion: tryGetFoundryVersion()
    }
  });
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
