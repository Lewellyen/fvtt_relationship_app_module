var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __name = (target, value2) => __defProp(target, "name", { value: value2, configurable: true });
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value2) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
var __privateSet = (obj, member, value2, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value2) : member.set(obj, value2), value2);
var _a, _disposed, _disposed2, _disposed3, _disposed4, _disposed5, _disposed6;
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
    READY: "ready",
    CREATE_JOURNAL_ENTRY: "createJournalEntry",
    UPDATE_JOURNAL_ENTRY: "updateJournalEntry",
    DELETE_JOURNAL_ENTRY: "deleteJournalEntry"
  },
  SETTINGS: {
    LOG_LEVEL: "logLevel",
    CACHE_ENABLED: "cacheEnabled",
    CACHE_TTL_MS: "cacheTtlMs",
    CACHE_MAX_ENTRIES: "cacheMaxEntries",
    PERFORMANCE_TRACKING_ENABLED: "performanceTrackingEnabled",
    PERFORMANCE_SAMPLING_RATE: "performanceSamplingRate",
    METRICS_PERSISTENCE_ENABLED: "metricsPersistenceEnabled",
    METRICS_PERSISTENCE_KEY: "metricsPersistenceKey"
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
const metricsStorageToken = createInjectionToken("MetricsStorage");
const traceContextToken = createInjectionToken("TraceContext");
const journalVisibilityServiceToken = createInjectionToken(
  "JournalVisibilityService"
);
const foundryI18nToken = createInjectionToken("FoundryI18nService");
const localI18nToken = createInjectionToken("LocalI18nService");
const i18nFacadeToken = createInjectionToken("I18nFacadeService");
const foundryTranslationHandlerToken = createInjectionToken(
  "FoundryTranslationHandler"
);
const localTranslationHandlerToken = createInjectionToken("LocalTranslationHandler");
const fallbackTranslationHandlerToken = createInjectionToken(
  "FallbackTranslationHandler"
);
const translationHandlerChainToken = createInjectionToken("TranslationHandlerChain");
const notificationCenterToken = createInjectionToken("NotificationCenter");
const consoleChannelToken = createInjectionToken("ConsoleChannel");
const uiChannelToken = createInjectionToken("UIChannel");
const environmentConfigToken = createInjectionToken("EnvironmentConfig");
const runtimeConfigToken = createInjectionToken("RuntimeConfigService");
const moduleHealthServiceToken = createInjectionToken("ModuleHealthService");
const healthCheckRegistryToken = createInjectionToken("HealthCheckRegistry");
const containerHealthCheckToken = createInjectionToken("ContainerHealthCheck");
const metricsHealthCheckToken = createInjectionToken("MetricsHealthCheck");
const serviceContainerToken = createInjectionToken("ServiceContainer");
const cacheServiceConfigToken = createInjectionToken("CacheServiceConfig");
const cacheServiceToken = createInjectionToken("CacheService");
const performanceTrackingServiceToken = createInjectionToken(
  "PerformanceTrackingService"
);
const retryServiceToken = createInjectionToken("RetryService");
const portSelectionEventEmitterToken = createInjectionToken("PortSelectionEventEmitter");
const observabilityRegistryToken = createInjectionToken(
  "ObservabilityRegistry"
);
const moduleSettingsRegistrarToken = createInjectionToken(
  "ModuleSettingsRegistrar"
);
const moduleHookRegistrarToken = createInjectionToken(
  "ModuleHookRegistrar"
);
const renderJournalDirectoryHookToken = createInjectionToken("RenderJournalDirectoryHook");
const journalCacheInvalidationHookToken = createInjectionToken("JournalCacheInvalidationHook");
const moduleApiInitializerToken = createInjectionToken(
  "ModuleApiInitializer"
);
var tokenindex = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  cacheServiceConfigToken,
  cacheServiceToken,
  consoleChannelToken,
  containerHealthCheckToken,
  environmentConfigToken,
  fallbackTranslationHandlerToken,
  foundryI18nToken,
  foundryTranslationHandlerToken,
  healthCheckRegistryToken,
  i18nFacadeToken,
  journalCacheInvalidationHookToken,
  journalVisibilityServiceToken,
  localI18nToken,
  localTranslationHandlerToken,
  loggerToken,
  metricsCollectorToken,
  metricsHealthCheckToken,
  metricsRecorderToken,
  metricsSamplerToken,
  metricsStorageToken,
  moduleApiInitializerToken,
  moduleHealthServiceToken,
  moduleHookRegistrarToken,
  moduleSettingsRegistrarToken,
  notificationCenterToken,
  observabilityRegistryToken,
  performanceTrackingServiceToken,
  portSelectionEventEmitterToken,
  portSelectorToken,
  renderJournalDirectoryHookToken,
  retryServiceToken,
  runtimeConfigToken,
  serviceContainerToken,
  traceContextToken,
  translationHandlerChainToken,
  uiChannelToken
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
   * @template TServiceType - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param serviceClass - The class to instantiate
   * @returns Result with registration or validation error
   */
  static createClass(lifecycle, dependencies, serviceClass) {
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
   * @template TServiceType - The concrete service type
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
   * @template TServiceType - The concrete service type
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
      new _ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [],
        "value",
        void 0,
        void 0,
        value2,
        void 0
      )
    );
  }
  /**
   * Creates an alias registration (always SINGLETON).
   * @template TServiceType - The concrete service type
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
const _TypeSafeRegistrationMap = class _TypeSafeRegistrationMap {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  /**
   * Stores a service registration.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   */
  set(token, registration) {
    this.map.set(token, registration);
  }
  /**
   * Retrieves a service registration.
   *
   * Type-safe by design: The token's generic parameter guarantees that the
   * returned registration matches the expected service type.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @returns The service registration or undefined if not found
   */
  get(token) {
    return this.map.get(token);
  }
  /**
   * Checks if a service is registered.
   *
   * @param token - The injection token to check
   * @returns True if the service is registered
   */
  has(token) {
    return this.map.has(token);
  }
  /**
   * Removes a service registration.
   *
   * @param token - The injection token identifying the service
   * @returns True if the service was found and removed
   */
  delete(token) {
    return this.map.delete(token);
  }
  /**
   * Gets the number of registered services.
   *
   * @returns The count of registrations
   */
  get size() {
    return this.map.size;
  }
  /**
   * Removes all service registrations.
   */
  clear() {
    this.map.clear();
  }
  /**
   * Returns an iterator of all registration entries.
   *
   * @returns Iterator of [token, registration] pairs
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Iterator returns heterogeneous service types
  entries() {
    return this.map.entries();
  }
  /**
   * Creates a shallow clone of this map.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new TypeSafeRegistrationMap with cloned entries
   */
  clone() {
    const cloned = new _TypeSafeRegistrationMap();
    this.map.forEach((value2, key) => {
      cloned.map.set(key, value2);
    });
    return cloned;
  }
};
__name(_TypeSafeRegistrationMap, "TypeSafeRegistrationMap");
let TypeSafeRegistrationMap = _TypeSafeRegistrationMap;
function hasDependencies(cls) {
  return "dependencies" in cls;
}
__name(hasDependencies, "hasDependencies");
const _ServiceRegistry = class _ServiceRegistry {
  constructor() {
    this.MAX_REGISTRATIONS = 1e4;
    this.registrations = new TypeSafeRegistrationMap();
    this.lifecycleIndex = /* @__PURE__ */ new Map();
  }
  /**
   * Updates the lifecycle index when a service is registered.
   *
   * @param token - The injection token
   * @param lifecycle - The service lifecycle
   */
  updateLifecycleIndex(token, lifecycle) {
    let tokenSet = this.lifecycleIndex.get(lifecycle);
    if (!tokenSet) {
      tokenSet = /* @__PURE__ */ new Set();
      this.lifecycleIndex.set(lifecycle, tokenSet);
    }
    tokenSet.add(token);
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
    if (!serviceClass) {
      return err({
        code: "InvalidOperation",
        message: "serviceClass is required for class registration"
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
    const registrationResult = ServiceRegistration.createFactory(
      lifecycle,
      dependencies,
      factory
    );
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
    return new Map(this.registrations.entries());
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
      const typedToken = token;
      const typedRegistration = registration;
      clonedRegistry.registrations.set(typedToken, typedRegistration.clone());
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
          default:
            const _exhaustiveCheck = registration.lifecycle;
            result = err({
              code: "InvalidLifecycle",
              message: `Invalid service lifecycle: ${String(_exhaustiveCheck)}`,
              tokenDescription: String(token)
            });
        }
        return result;
      },
      (duration, result) => {
        this.metricsCollector?.recordResolution(token, duration, result.ok);
      }
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
function parseNonNegativeNumber(envValue, fallback2) {
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed)) {
    return fallback2;
  }
  return parsed < 0 ? fallback2 : parsed;
}
__name(parseNonNegativeNumber, "parseNonNegativeNumber");
function parseOptionalPositiveInteger(envValue) {
  if (!envValue) {
    return void 0;
  }
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return void 0;
  }
  return Math.floor(parsed);
}
__name(parseOptionalPositiveInteger, "parseOptionalPositiveInteger");
const parsedCacheMaxEntries = parseOptionalPositiveInteger(
  void 0
  // type-coverage:ignore-line -- Build-time env var
);
const ENV = {
  isDevelopment: true,
  isProduction: false,
  logLevel: true ? 0 : 1,
  enablePerformanceTracking: true,
  enableDebugMode: true,
  enableMetricsPersistence: false,
  // type-coverage:ignore-line -- Build-time env var
  metricsPersistenceKey: "fvtt_relationship_app_module.metrics",
  // type-coverage:ignore-line -- Build-time env var
  // 1% sampling in production, 100% in development
  performanceSamplingRate: false ? parseSamplingRate(void 0, 0.01) : 1,
  enableCacheService: true ? true : false,
  // type-coverage:ignore-line -- Build-time env var
  cacheDefaultTtlMs: parseNonNegativeNumber(
    void 0,
    // type-coverage:ignore-line -- Build-time env var
    MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS
  ),
  ...parsedCacheMaxEntries !== void 0 ? { cacheMaxEntries: parsedCacheMaxEntries } : {}
};
const _PerformanceTrackerImpl = class _PerformanceTrackerImpl {
  /**
   * Creates a performance tracker implementation.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(config2, sampler) {
    this.config = config2;
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
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
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
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
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
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_BootstrapPerformanceTracker, "BootstrapPerformanceTracker");
let BootstrapPerformanceTracker = _BootstrapPerformanceTracker;
const _RuntimeConfigService = class _RuntimeConfigService {
  constructor(env) {
    this.listeners = /* @__PURE__ */ new Map();
    this.values = {
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
      logLevel: env.logLevel,
      enablePerformanceTracking: env.enablePerformanceTracking,
      performanceSamplingRate: env.performanceSamplingRate,
      enableDebugMode: env.enableDebugMode,
      enableMetricsPersistence: env.enableMetricsPersistence,
      metricsPersistenceKey: env.metricsPersistenceKey,
      enableCacheService: env.enableCacheService,
      cacheDefaultTtlMs: env.cacheDefaultTtlMs,
      cacheMaxEntries: env.cacheMaxEntries
    };
  }
  /**
   * Returns the current value for the given configuration key.
   */
  get(key) {
    return this.values[key];
  }
  /**
   * Updates the configuration value based on Foundry settings and notifies listeners
   * only if the value actually changed.
   */
  setFromFoundry(key, value2) {
    this.updateValue(key, value2);
  }
  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange(key, listener) {
    const existing = this.listeners.get(key);
    const listeners = existing ?? /* @__PURE__ */ new Set();
    listeners.add(listener);
    this.listeners.set(key, listeners);
    return () => {
      const activeListeners = this.listeners.get(key);
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }
  updateValue(key, value2) {
    const current = this.values[key];
    if (Object.is(current, value2)) {
      return;
    }
    this.values[key] = value2;
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) {
      return;
    }
    for (const listener of listeners) {
      listener(value2);
    }
  }
};
__name(_RuntimeConfigService, "RuntimeConfigService");
let RuntimeConfigService = _RuntimeConfigService;
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
   * Uses BootstrapPerformanceTracker with RuntimeConfigService(ENV) und null MetricsCollector.
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
    const performanceTracker = new BootstrapPerformanceTracker(new RuntimeConfigService(ENV), null);
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
   * Returns a previously registered constant value without requiring validation.
   * Useful for bootstrap/static values that are needed while the container is still registering services.
   */
  getRegisteredValue(token) {
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      return null;
    }
    if (registration.providerType !== "value") {
      return null;
    }
    const value2 = registration.value;
    if (value2 === void 0) {
      return null;
    }
    return value2;
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
    const childPerformanceTracker = new BootstrapPerformanceTracker(
      new RuntimeConfigService(ENV),
      null
    );
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
const _ConsoleLoggerService = class _ConsoleLoggerService {
  constructor(config2, traceContext) {
    this.runtimeConfigUnsubscribe = null;
    this.traceContext = traceContext ?? null;
    this.minLevel = config2.get("logLevel");
    this.bindRuntimeConfig(config2);
  }
  setMinLevel(level) {
    this.minLevel = level;
  }
  log(message2, ...optionalParams) {
    const formattedMessage = this.formatWithContextTrace(message2);
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }
  error(message2, ...optionalParams) {
    if (LogLevel.ERROR < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message2);
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    if (LogLevel.WARN < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message2);
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }
  info(message2, ...optionalParams) {
    if (LogLevel.INFO < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message2);
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    if (LogLevel.DEBUG < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message2);
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }
  withTraceId(traceId) {
    return new TracedLogger(this, traceId);
  }
  bindRuntimeConfig(runtimeConfig) {
    this.minLevel = runtimeConfig.get("logLevel");
    this.runtimeConfigUnsubscribe?.();
    this.runtimeConfigUnsubscribe = runtimeConfig.onChange("logLevel", (level) => {
      this.setMinLevel(level);
    });
  }
  getContextTraceId() {
    return this.traceContext?.getCurrentTraceId() ?? null;
  }
  formatWithContextTrace(message2) {
    const contextTraceId = this.getContextTraceId();
    if (contextTraceId) {
      return `[${contextTraceId}] ${message2}`;
    }
    return message2;
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
let ConsoleLoggerService = _ConsoleLoggerService;
const _TracedLogger = class _TracedLogger {
  constructor(baseLogger, traceId) {
    this.baseLogger = baseLogger;
    this.traceId = traceId;
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
  formatMessage(message2) {
    return `[${this.traceId}] ${message2}`;
  }
};
__name(_TracedLogger, "TracedLogger");
let TracedLogger = _TracedLogger;
const _DIConsoleLoggerService = class _DIConsoleLoggerService extends ConsoleLoggerService {
  constructor(config2, traceContext) {
    super(config2, traceContext);
  }
};
__name(_DIConsoleLoggerService, "DIConsoleLoggerService");
_DIConsoleLoggerService.dependencies = [runtimeConfigToken, traceContextToken];
let DIConsoleLoggerService = _DIConsoleLoggerService;
const _ContainerHealthCheck = class _ContainerHealthCheck {
  constructor(container) {
    this.name = "container";
    this.container = container;
  }
  check() {
    return this.container.getValidationState() === "validated";
  }
  getDetails() {
    const state = this.container.getValidationState();
    if (state !== "validated") {
      return `Container state: ${state}`;
    }
    return null;
  }
  dispose() {
  }
};
__name(_ContainerHealthCheck, "ContainerHealthCheck");
let ContainerHealthCheck = _ContainerHealthCheck;
const _DIContainerHealthCheck = class _DIContainerHealthCheck extends ContainerHealthCheck {
  constructor(container, registry) {
    super(container);
    registry.register(this);
  }
};
__name(_DIContainerHealthCheck, "DIContainerHealthCheck");
_DIContainerHealthCheck.dependencies = [serviceContainerToken, healthCheckRegistryToken];
let DIContainerHealthCheck = _DIContainerHealthCheck;
const _MetricsHealthCheck = class _MetricsHealthCheck {
  constructor(metricsCollector) {
    this.name = "metrics";
    this.metricsCollector = metricsCollector;
  }
  check() {
    const snapshot = this.metricsCollector.getSnapshot();
    const hasPortFailures = Object.keys(snapshot.portSelectionFailures).length > 0;
    const hasResolutionErrors = snapshot.resolutionErrors > 0;
    return !hasPortFailures && !hasResolutionErrors;
  }
  getDetails() {
    const snapshot = this.metricsCollector.getSnapshot();
    const failures = Object.keys(snapshot.portSelectionFailures);
    if (failures.length > 0) {
      return `Port selection failures: ${failures.join(", ")}`;
    }
    if (snapshot.resolutionErrors > 0) {
      return `Resolution errors: ${snapshot.resolutionErrors}`;
    }
    return null;
  }
  dispose() {
  }
};
__name(_MetricsHealthCheck, "MetricsHealthCheck");
let MetricsHealthCheck = _MetricsHealthCheck;
const _DIMetricsHealthCheck = class _DIMetricsHealthCheck extends MetricsHealthCheck {
  constructor(metricsCollector, registry) {
    super(metricsCollector);
    registry.register(this);
  }
};
__name(_DIMetricsHealthCheck, "DIMetricsHealthCheck");
_DIMetricsHealthCheck.dependencies = [metricsCollectorToken, healthCheckRegistryToken];
let DIMetricsHealthCheck = _DIMetricsHealthCheck;
const _MetricsCollector = class _MetricsCollector {
  constructor(config2) {
    this.config = config2;
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
    this.onStateChanged();
  }
  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version) {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
    this.onStateChanged();
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
    this.onStateChanged();
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
    this.onStateChanged();
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
    if (this.config.get("isDevelopment")) {
      return true;
    }
    return Math.random() < this.config.get("performanceSamplingRate");
  }
  /**
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot() {
    const times = this.resolutionTimes.slice(0, this.resolutionTimesCount);
    const sum = times.reduce((acc, time) => acc + time, 0);
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
    this.onStateChanged();
  }
  /**
   * Hook invoked after state mutations. Subclasses can override to react
   * (e.g., persist metrics).
   */
  onStateChanged() {
  }
  /**
   * Captures the internal state for persistence.
   *
   * @returns Serializable metrics state
   */
  getPersistenceState() {
    return {
      metrics: {
        containerResolutions: this.metrics.containerResolutions,
        resolutionErrors: this.metrics.resolutionErrors,
        cacheHits: this.metrics.cacheHits,
        cacheMisses: this.metrics.cacheMisses,
        portSelections: Object.fromEntries(this.metrics.portSelections),
        portSelectionFailures: Object.fromEntries(this.metrics.portSelectionFailures)
      },
      resolutionTimes: Array.from(this.resolutionTimes),
      resolutionTimesIndex: this.resolutionTimesIndex,
      resolutionTimesCount: this.resolutionTimesCount
    };
  }
  /**
   * Restores internal state from a persisted snapshot.
   *
   * @param state - Persisted metrics state
   */
  restoreFromPersistenceState(state) {
    if (!state) {
      return;
    }
    const { metrics, resolutionTimes, resolutionTimesCount, resolutionTimesIndex } = state;
    this.metrics = {
      containerResolutions: Math.max(0, metrics?.containerResolutions ?? 0),
      resolutionErrors: Math.max(0, metrics?.resolutionErrors ?? 0),
      cacheHits: Math.max(0, metrics?.cacheHits ?? 0),
      cacheMisses: Math.max(0, metrics?.cacheMisses ?? 0),
      portSelections: new Map(
        Object.entries(metrics?.portSelections ?? {}).map(([key, value2]) => [
          Number(key),
          Number.isFinite(Number(value2)) ? Number(value2) : 0
        ])
      ),
      portSelectionFailures: new Map(
        Object.entries(metrics?.portSelectionFailures ?? {}).map(([key, value2]) => [
          Number(key),
          Number.isFinite(Number(value2)) ? Number(value2) : 0
        ])
      )
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    if (Array.isArray(resolutionTimes)) {
      const maxLength2 = Math.min(resolutionTimes.length, this.resolutionTimes.length);
      for (let index = 0; index < maxLength2; index++) {
        const value2 = Number(resolutionTimes[index]);
        this.resolutionTimes[index] = Number.isFinite(value2) ? value2 : 0;
      }
    }
    const safeIndex = Number.isFinite(resolutionTimesIndex) ? Number(resolutionTimesIndex) : 0;
    const safeCount = Number.isFinite(resolutionTimesCount) ? Number(resolutionTimesCount) : 0;
    this.resolutionTimesIndex = Math.min(Math.max(0, safeIndex), this.MAX_RESOLUTION_TIMES - 1);
    this.resolutionTimesCount = Math.min(Math.max(0, safeCount), this.MAX_RESOLUTION_TIMES);
  }
};
__name(_MetricsCollector, "MetricsCollector");
_MetricsCollector.dependencies = [runtimeConfigToken];
let MetricsCollector = _MetricsCollector;
const _DIMetricsCollector = class _DIMetricsCollector extends MetricsCollector {
  constructor(config2) {
    super(config2);
  }
};
__name(_DIMetricsCollector, "DIMetricsCollector");
_DIMetricsCollector.dependencies = [runtimeConfigToken];
let DIMetricsCollector = _DIMetricsCollector;
const _PersistentMetricsCollector = class _PersistentMetricsCollector extends MetricsCollector {
  constructor(config2, metricsStorage) {
    super(config2);
    this.metricsStorage = metricsStorage;
    this.suppressPersistence = false;
    this.restoreFromStorage();
  }
  clearPersistentState() {
    this.metricsStorage.clear?.();
    this.suppressPersistence = true;
    try {
      super.reset();
    } finally {
      this.suppressPersistence = false;
    }
  }
  onStateChanged() {
    if (this.suppressPersistence) {
      return;
    }
    this.persist();
  }
  restoreFromStorage() {
    let state = null;
    try {
      state = this.metricsStorage.load();
    } catch {
      state = null;
    }
    if (!state) {
      return;
    }
    this.suppressPersistence = true;
    try {
      this.restoreFromPersistenceState(state);
    } finally {
      this.suppressPersistence = false;
    }
  }
  persist() {
    try {
      this.metricsStorage.save(this.getPersistenceState());
    } catch {
    }
  }
};
__name(_PersistentMetricsCollector, "PersistentMetricsCollector");
_PersistentMetricsCollector.dependencies = [
  runtimeConfigToken,
  metricsStorageToken
];
let PersistentMetricsCollector = _PersistentMetricsCollector;
const _DIPersistentMetricsCollector = class _DIPersistentMetricsCollector extends PersistentMetricsCollector {
  constructor(config2, metricsStorage) {
    super(config2, metricsStorage);
  }
};
__name(_DIPersistentMetricsCollector, "DIPersistentMetricsCollector");
_DIPersistentMetricsCollector.dependencies = [
  runtimeConfigToken,
  metricsStorageToken
];
let DIPersistentMetricsCollector = _DIPersistentMetricsCollector;
const _LocalStorageMetricsStorage = class _LocalStorageMetricsStorage {
  constructor(storageKey, storage = getStorage()) {
    this.storageKey = storageKey;
    this.storage = storage;
  }
  load() {
    if (!this.storage) {
      return null;
    }
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  save(state) {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
    }
  }
  clear() {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
    }
  }
};
__name(_LocalStorageMetricsStorage, "LocalStorageMetricsStorage");
let LocalStorageMetricsStorage = _LocalStorageMetricsStorage;
function getStorage() {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
  }
  return null;
}
__name(getStorage, "getStorage");
function generateTraceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
__name(generateTraceId, "generateTraceId");
function getTraceTimestamp(traceId) {
  const parts = traceId.split("-");
  if (parts.length !== 2) {
    return null;
  }
  const [timestampStr, randomStr] = parts;
  if (!timestampStr || !randomStr) {
    return null;
  }
  const timestamp = parseInt(timestampStr, 10);
  return isNaN(timestamp) ? null : timestamp;
}
__name(getTraceTimestamp, "getTraceTimestamp");
const _TraceContext = class _TraceContext {
  constructor() {
    this.currentTraceId = null;
  }
  /**
   * Executes a synchronous function with trace context.
   *
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the function
   * @param fn - Function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns The result of the function execution
   *
   * @example
   * ```typescript
   * const result = traceContext.trace(() => {
   *   logger.info("Processing"); // Automatically traced
   *   return processData();
   * });
   * ```
   */
  trace(fn, options) {
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();
    const previousTraceId = this.currentTraceId;
    this.currentTraceId = traceId;
    try {
      return fn();
    } finally {
      this.currentTraceId = previousTraceId;
    }
  }
  /**
   * Executes an asynchronous function with trace context.
   *
   * Similar to trace() but for async operations.
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the async function
   * @param fn - Async function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns Promise resolving to the result of the function execution
   *
   * @example
   * ```typescript
   * const result = await traceContext.traceAsync(async () => {
   *   logger.info("Fetching data"); // Automatically traced
   *   return await fetchData();
   * });
   * ```
   */
  async traceAsync(fn, options) {
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();
    const previousTraceId = this.currentTraceId;
    this.currentTraceId = traceId;
    try {
      return await fn();
    } finally {
      this.currentTraceId = previousTraceId;
    }
  }
  /**
   * Gets the current trace ID from the context stack.
   *
   * Returns null if not currently in a traced context.
   * Useful for services that need to access the current trace ID
   * without having it passed as a parameter.
   *
   * @returns Current trace ID or null if not in traced context
   *
   * @example
   * ```typescript
   * const traceId = traceContext.getCurrentTraceId();
   * if (traceId) {
   *   console.log(`Current trace: ${traceId}`);
   * }
   * ```
   */
  getCurrentTraceId() {
    return this.currentTraceId;
  }
  /**
   * Cleans up resources.
   * For TraceContext, this resets the current trace ID.
   */
  dispose() {
    this.currentTraceId = null;
  }
};
__name(_TraceContext, "TraceContext");
_TraceContext.dependencies = [];
let TraceContext = _TraceContext;
const _DITraceContext = class _DITraceContext extends TraceContext {
  constructor() {
    super();
  }
};
__name(_DITraceContext, "DITraceContext");
_DITraceContext.dependencies = [];
let DITraceContext = _DITraceContext;
const _ModuleHealthService = class _ModuleHealthService {
  constructor(registry) {
    this.registry = registry;
    this.healthChecksInitialized = false;
  }
  /**
   * Gets the current health status of the module.
   *
   * Health is determined by running all registered health checks.
   * Overall status:
   * - "healthy": All checks pass
   * - "unhealthy": Container check fails
   * - "degraded": Other checks fail
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
    if (!this.healthChecksInitialized) {
      this.healthChecksInitialized = true;
    }
    const results = this.registry.runAll();
    const allHealthy = Array.from(results.values()).every((result) => result);
    const status = allHealthy ? "healthy" : results.get("container") === false ? "unhealthy" : "degraded";
    const checks = this.registry.getAllChecks();
    let lastError = null;
    for (const check2 of checks) {
      const result = results.get(check2.name);
      if (!result && check2.getDetails) {
        lastError = check2.getDetails();
      }
    }
    return {
      status,
      checks: {
        containerValidated: results.get("container") ?? true,
        portsSelected: results.get("metrics") ?? true,
        lastError
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
__name(_ModuleHealthService, "ModuleHealthService");
let ModuleHealthService = _ModuleHealthService;
const _DIModuleHealthService = class _DIModuleHealthService extends ModuleHealthService {
  constructor(registry) {
    super(registry);
  }
};
__name(_DIModuleHealthService, "DIModuleHealthService");
_DIModuleHealthService.dependencies = [healthCheckRegistryToken];
let DIModuleHealthService = _DIModuleHealthService;
const deprecationMetadata = /* @__PURE__ */ new Map();
function markAsDeprecated(token, reason, replacement, removedInVersion) {
  const apiSafeToken = markAsApiSafe(token);
  deprecationMetadata.set(apiSafeToken, {
    reason,
    replacement: replacement ? String(replacement) : null,
    removedInVersion,
    warningShown: false
  });
  return apiSafeToken;
}
__name(markAsDeprecated, "markAsDeprecated");
function getDeprecationInfo(token) {
  if (!token || typeof token !== "symbol") {
    return null;
  }
  return deprecationMetadata.get(token) || null;
}
__name(getDeprecationInfo, "getDeprecationInfo");
function isAllowedKey(prop, allowed) {
  if (typeof prop !== "string") {
    return false;
  }
  const allowedStrings = allowed;
  return allowedStrings.includes(prop);
}
__name(isAllowedKey, "isAllowedKey");
function createReadOnlyWrapper(service, allowedMethods) {
  return new Proxy(service, {
    get(target, prop, receiver) {
      if (isAllowedKey(prop, allowedMethods)) {
        const value2 = Reflect.get(target, prop, receiver);
        if (typeof value2 === "function") {
          return value2.bind(target);
        }
        return value2;
      }
      throw new Error(
        `Property "${String(prop)}" is not accessible via Public API. Only these methods are allowed: ${allowedMethods.map(String).join(", ")}`
      );
    },
    set() {
      throw new Error("Cannot modify services via Public API (read-only)");
    },
    deleteProperty() {
      throw new Error("Cannot delete properties via Public API (read-only)");
    }
  });
}
__name(createReadOnlyWrapper, "createReadOnlyWrapper");
function createPublicLogger(logger) {
  return createReadOnlyWrapper(logger, [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "withTraceId"
    // Decorator pattern for trace context
  ]);
}
__name(createPublicLogger, "createPublicLogger");
function createPublicI18n(i18n) {
  return createReadOnlyWrapper(i18n, ["translate", "format", "has"]);
}
__name(createPublicI18n, "createPublicI18n");
function createPublicNotificationCenter(notificationCenter) {
  return createReadOnlyWrapper(notificationCenter, [
    "debug",
    "info",
    "warn",
    "error",
    "getChannelNames"
  ]);
}
__name(createPublicNotificationCenter, "createPublicNotificationCenter");
function createPublicFoundrySettings(foundrySettings) {
  return createReadOnlyWrapper(foundrySettings, ["get"]);
}
__name(createPublicFoundrySettings, "createPublicFoundrySettings");
function createApiTokens() {
  return {
    notificationCenterToken: markAsApiSafe(notificationCenterToken),
    journalVisibilityServiceToken: markAsApiSafe(journalVisibilityServiceToken),
    foundryGameToken: markAsApiSafe(foundryGameToken),
    foundryHooksToken: markAsApiSafe(foundryHooksToken),
    foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
    foundryUIToken: markAsApiSafe(foundryUIToken),
    foundrySettingsToken: markAsApiSafe(foundrySettingsToken),
    i18nFacadeToken: markAsApiSafe(i18nFacadeToken),
    foundryJournalFacadeToken: markAsApiSafe(foundryJournalFacadeToken)
  };
}
__name(createApiTokens, "createApiTokens");
const _ModuleApiInitializer = class _ModuleApiInitializer {
  /**
   * Handles deprecation warnings for tokens.
   * Logs warning to console if token is deprecated and warning hasn't been shown yet.
   *
   * Uses console.warn instead of Logger because:
   * - Deprecation warnings are for external API consumers (not internal logs)
   * - Should be visible even if Logger is disabled/configured differently
   * - Follows npm/Node.js convention for deprecation warnings
   *
   * @param token - Token to check for deprecation
   * @private
   */
  handleDeprecationWarning(token) {
    const deprecationInfo = getDeprecationInfo(token);
    if (deprecationInfo && !deprecationInfo.warningShown) {
      const replacementInfo = deprecationInfo.replacement ? `Use "${deprecationInfo.replacement}" instead.
` : "";
      console.warn(
        `[${MODULE_CONSTANTS.MODULE.ID}] DEPRECATED: Token "${String(token)}" is deprecated.
Reason: ${deprecationInfo.reason}
` + replacementInfo + `This token will be removed in version ${deprecationInfo.removedInVersion}.`
      );
      deprecationInfo.warningShown = true;
    }
  }
  /**
   * Creates the resolve() function for the public API.
   * Resolves services and applies wrappers (throws on error).
   *
   * @param container - ServiceContainer for resolution
   * @returns Resolve function for ModuleApi
   * @private
   */
  createResolveFunction(container, wellKnownTokens) {
    return (token) => {
      this.handleDeprecationWarning(token);
      const service = container.resolve(token);
      return this.wrapSensitiveService(token, service, wellKnownTokens);
    };
  }
  /**
   * Creates the resolveWithError() function for the public API.
   * Resolves services with Result pattern (never throws).
   *
   * @param container - ServiceContainer for resolution
   * @returns ResolveWithError function for ModuleApi
   * @private
   */
  createResolveWithErrorFunction(container, wellKnownTokens) {
    return (token) => {
      this.handleDeprecationWarning(token);
      const result = container.resolveWithError(token);
      if (!result.ok) {
        return result;
      }
      const service = result.value;
      const wrappedService = this.wrapSensitiveService(token, service, wellKnownTokens);
      return ok(wrappedService);
    };
  }
  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
   *
   * @param token - API token used for resolution
   * @param service - Service resolved from the container
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service when applicable
   * @private
   */
  wrapSensitiveService(token, service, wellKnownTokens) {
    if (token === wellKnownTokens.i18nFacadeToken) {
      const i18n = service;
      return createPublicI18n(i18n);
    }
    if (token === wellKnownTokens.notificationCenterToken) {
      const notifications = service;
      return createPublicNotificationCenter(notifications);
    }
    if (token === wellKnownTokens.foundrySettingsToken) {
      const settings = service;
      return createPublicFoundrySettings(settings);
    }
    return service;
  }
  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - ServiceContainer for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   * @private
   */
  createApiObject(container, wellKnownTokens) {
    return {
      version: MODULE_CONSTANTS.API.VERSION,
      // Overloaded resolve method (throws on error)
      resolve: this.createResolveFunction(container, wellKnownTokens),
      // Result-Pattern method (safe, never throws)
      resolveWithError: this.createResolveWithErrorFunction(container, wellKnownTokens),
      getAvailableTokens: /* @__PURE__ */ __name(() => {
        const tokenMap = /* @__PURE__ */ new Map();
        const tokenEntries = [
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken],
          ["i18nFacadeToken", i18nFacadeToken],
          ["foundryJournalFacadeToken", foundryJournalFacadeToken],
          ["notificationCenterToken", notificationCenterToken]
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
  }
  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   *
   * @param container - Initialized and validated ServiceContainer
   * @returns Result<void, string> - Ok if successful, Err with error message
   */
  expose(container) {
    if (typeof game === "undefined" || !game?.modules) {
      return err("Game modules not available - API cannot be exposed");
    }
    const mod = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    if (!mod) {
      return err(`Module '${MODULE_CONSTANTS.MODULE.ID}' not found in game.modules`);
    }
    const wellKnownTokens = createApiTokens();
    const api = this.createApiObject(container, wellKnownTokens);
    mod.api = api;
    return ok(void 0);
  }
};
__name(_ModuleApiInitializer, "ModuleApiInitializer");
_ModuleApiInitializer.dependencies = [];
let ModuleApiInitializer = _ModuleApiInitializer;
const _DIModuleApiInitializer = class _DIModuleApiInitializer extends ModuleApiInitializer {
  constructor() {
    super();
  }
};
__name(_DIModuleApiInitializer, "DIModuleApiInitializer");
_DIModuleApiInitializer.dependencies = [];
let DIModuleApiInitializer = _DIModuleApiInitializer;
const _HealthCheckRegistry = class _HealthCheckRegistry {
  constructor() {
    this.checks = /* @__PURE__ */ new Map();
  }
  register(check2) {
    this.checks.set(check2.name, check2);
  }
  unregister(name) {
    this.checks.delete(name);
  }
  runAll() {
    const results = /* @__PURE__ */ new Map();
    for (const [name, check2] of this.checks) {
      results.set(name, check2.check());
    }
    return results;
  }
  getCheck(name) {
    return this.checks.get(name);
  }
  getAllChecks() {
    return Array.from(this.checks.values());
  }
  dispose() {
    for (const check2 of this.checks.values()) {
      check2.dispose();
    }
    this.checks.clear();
  }
};
__name(_HealthCheckRegistry, "HealthCheckRegistry");
_HealthCheckRegistry.dependencies = [];
let HealthCheckRegistry = _HealthCheckRegistry;
const _DIHealthCheckRegistry = class _DIHealthCheckRegistry extends HealthCheckRegistry {
  constructor() {
    super();
  }
};
__name(_DIHealthCheckRegistry, "DIHealthCheckRegistry");
_DIHealthCheckRegistry.dependencies = [];
let DIHealthCheckRegistry = _DIHealthCheckRegistry;
function registerCoreServices(container) {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }
  const enablePersistence = runtimeConfig.get("enableMetricsPersistence") === true;
  if (enablePersistence) {
    const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
    const storageInstance = new LocalStorageMetricsStorage(metricsKey);
    const storageResult = container.registerValue(metricsStorageToken, storageInstance);
    if (isErr(storageResult)) {
      return err(`Failed to register MetricsStorage: ${storageResult.error.message}`);
    }
    const persistentResult = container.registerClass(
      metricsCollectorToken,
      DIPersistentMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(persistentResult)) {
      return err(
        `Failed to register PersistentMetricsCollector: ${persistentResult.error.message}`
      );
    }
  } else {
    const metricsResult = container.registerClass(
      metricsCollectorToken,
      DIMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(metricsResult)) {
      return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
    }
  }
  container.registerAlias(metricsRecorderToken, metricsCollectorToken);
  container.registerAlias(metricsSamplerToken, metricsCollectorToken);
  const traceContextResult = container.registerClass(
    traceContextToken,
    DITraceContext,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(traceContextResult)) {
    return err(`Failed to register TraceContext: ${traceContextResult.error.message}`);
  }
  const loggerResult = container.registerClass(
    loggerToken,
    DIConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register Logger: ${loggerResult.error.message}`);
  }
  const registryResult = container.registerClass(
    healthCheckRegistryToken,
    DIHealthCheckRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register HealthCheckRegistry: ${registryResult.error.message}`);
  }
  const healthResult = container.registerClass(
    moduleHealthServiceToken,
    DIModuleHealthService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }
  const apiInitResult = container.registerClass(
    moduleApiInitializerToken,
    DIModuleApiInitializer,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(apiInitResult)) {
    return err(`Failed to register ModuleApiInitializer: ${apiInitResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerCoreServices, "registerCoreServices");
const _PortSelectionEventEmitter = class _PortSelectionEventEmitter {
  constructor() {
    this.subscribers = /* @__PURE__ */ new Set();
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.subscribers.delete(callback);
    };
  }
  emit(event) {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error("PortSelectionEventEmitter subscriber error", error);
      }
    }
  }
  clear() {
    this.subscribers.clear();
  }
  getSubscriberCount() {
    return this.subscribers.size;
  }
};
__name(_PortSelectionEventEmitter, "PortSelectionEventEmitter");
let PortSelectionEventEmitter = _PortSelectionEventEmitter;
const _DIPortSelectionEventEmitter = class _DIPortSelectionEventEmitter extends PortSelectionEventEmitter {
};
__name(_DIPortSelectionEventEmitter, "DIPortSelectionEventEmitter");
_DIPortSelectionEventEmitter.dependencies = [];
let DIPortSelectionEventEmitter = _DIPortSelectionEventEmitter;
const _ObservabilityRegistry = class _ObservabilityRegistry {
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
  }
  /**
   * Register a PortSelector for observability.
   * Wires event emission to logging and metrics.
   *
   * @param service - Observable service that emits PortSelectionEvents
   */
  registerPortSelector(service) {
    service.onEvent((event) => {
      if (event.type === "success") {
        const adapterSuffix = event.adapterName ? ` for ${event.adapterName}` : "";
        this.logger.debug(
          `Port v${event.selectedVersion} selected in ${event.durationMs.toFixed(2)}ms${adapterSuffix}`
        );
        this.metrics.recordPortSelection(event.selectedVersion);
      } else {
        this.logger.error("Port selection failed", {
          foundryVersion: event.foundryVersion,
          availableVersions: event.availableVersions,
          adapterName: event.adapterName
        });
        this.metrics.recordPortSelectionFailure(event.foundryVersion);
      }
    });
  }
  // Future: Add more registration methods for other observable services
  // registerSomeOtherService(service: ObservableService<OtherEvent>): void { ... }
};
__name(_ObservabilityRegistry, "ObservabilityRegistry");
let ObservabilityRegistry = _ObservabilityRegistry;
const _DIObservabilityRegistry = class _DIObservabilityRegistry extends ObservabilityRegistry {
  constructor(logger, metrics) {
    super(logger, metrics);
  }
};
__name(_DIObservabilityRegistry, "DIObservabilityRegistry");
_DIObservabilityRegistry.dependencies = [loggerToken, metricsRecorderToken];
let DIObservabilityRegistry = _DIObservabilityRegistry;
function registerObservability(container) {
  const emitterResult = container.registerClass(
    portSelectionEventEmitterToken,
    DIPortSelectionEventEmitter,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(emitterResult)) {
    return err(`Failed to register PortSelectionEventEmitter: ${emitterResult.error.message}`);
  }
  const registryResult = container.registerClass(
    observabilityRegistryToken,
    DIObservabilityRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register ObservabilityRegistry: ${registryResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerObservability, "registerObservability");
let cachedVersion = null;
function detectFoundryVersion() {
  if (typeof game === "undefined") {
    return err("Foundry game object is not available or version cannot be determined");
  }
  const versionString = game.version;
  if (!versionString) {
    return err("Foundry version is not available on the game object");
  }
  const versionStr = versionString.match(/^(\d+)/)?.[1];
  if (!versionStr) {
    return err(`Could not parse Foundry version from: ${versionString}`);
  }
  return ok(Number.parseInt(versionStr, 10));
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
const _PortSelector = class _PortSelector {
  constructor(eventEmitter, observability) {
    this.eventEmitter = eventEmitter;
    observability.registerPortSelector(this);
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
        ...adapterName !== void 0 ? { adapterName } : {},
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
        ...adapterName !== void 0 ? { adapterName } : {},
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
        ...adapterName !== void 0 ? { adapterName } : {},
        error: foundryError
      });
      return err(foundryError);
    }
  }
};
__name(_PortSelector, "PortSelector");
let PortSelector = _PortSelector;
const _DIPortSelector = class _DIPortSelector extends PortSelector {
  constructor(eventEmitter, observability) {
    super(eventEmitter, observability);
  }
};
__name(_DIPortSelector, "DIPortSelector");
_DIPortSelector.dependencies = [portSelectionEventEmitterToken, observabilityRegistryToken];
let DIPortSelector = _DIPortSelector;
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
    const factory = this.factories.get(selectedVersion);
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
    return versions.at(-1);
  }
};
__name(_PortRegistry, "PortRegistry");
let PortRegistry = _PortRegistry;
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
function isStringValue(value2, expectedType) {
  return expectedType === "string" && typeof value2 === "string";
}
__name(isStringValue, "isStringValue");
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
  if (choices && isStringValue(value2, expectedType)) {
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
const SettingConfigSchema = /* @__PURE__ */ object({
  name: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  hint: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  scope: /* @__PURE__ */ optional(/* @__PURE__ */ picklist(["world", "client", "user"])),
  config: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
  type: /* @__PURE__ */ optional(/* @__PURE__ */ any()),
  // typeof String, Number, Boolean - cannot validate constructors
  default: /* @__PURE__ */ optional(/* @__PURE__ */ any()),
  // Default value depends on type
  choices: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ string())),
  // Record keys must be string in TS
  onChange: /* @__PURE__ */ optional(/* @__PURE__ */ custom((val) => typeof val === "function"))
});
function validateSettingConfig(namespace, key, config2) {
  if (!namespace || typeof namespace !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Invalid setting namespace: must be non-empty string",
        { namespace, key }
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
  const result = /* @__PURE__ */ safeParse(SettingConfigSchema, config2);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting config validation failed for ${namespace}.${key}: ${result.issues.map((i) => i.message).join(", ")}`,
        { namespace, key, config: config2, issues: result.issues }
      )
    );
  }
  return ok(result.output);
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
function validateJournalId(id) {
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
    __privateAdd(this, _disposed);
    __privateSet(this, _disposed, false);
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
    this.cacheTtlMs = MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS;
  }
  getJournalEntries() {
    if (__privateGet(this, _disposed)) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entries on disposed port"));
    }
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
    if (__privateGet(this, _disposed)) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entry on disposed port"));
    }
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
  dispose() {
    if (__privateGet(this, _disposed)) return;
    __privateSet(this, _disposed, true);
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }
};
_disposed = new WeakMap();
__name(_FoundryGamePortV13, "FoundryGamePortV13");
let FoundryGamePortV13 = _FoundryGamePortV13;
const _FoundryHooksPortV13 = class _FoundryHooksPortV13 {
  constructor() {
    __privateAdd(this, _disposed2, false);
  }
  on(hookName, callback) {
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register hook on disposed port", {
          hookName
        })
      };
    }
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
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register one-time hook on disposed port", {
          hookName
        })
      };
    }
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
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot unregister hook on disposed port", {
          hookName
        })
      };
    }
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
  dispose() {
    if (__privateGet(this, _disposed2)) return;
    __privateSet(this, _disposed2, true);
  }
};
_disposed2 = new WeakMap();
__name(_FoundryHooksPortV13, "FoundryHooksPortV13");
let FoundryHooksPortV13 = _FoundryHooksPortV13;
const _FoundryDocumentPortV13 = class _FoundryDocumentPortV13 {
  constructor() {
    __privateAdd(this, _disposed3, false);
  }
  getFlag(document2, scope, key, schema) {
    if (__privateGet(this, _disposed3)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot get flag on disposed port", { scope, key })
      };
    }
    return tryCatch(
      () => {
        if (!document2?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const rawValue = document2.getFlag(scope, key);
        if (rawValue === null || rawValue === void 0) {
          return null;
        }
        const parseResult = /* @__PURE__ */ safeParse(schema, rawValue);
        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Flag ${scope}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { scope, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }
        return parseResult.output;
      },
      (error) => {
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return error;
        }
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get flag ${scope}.${key}`,
          { scope, key },
          error
        );
      }
    );
  }
  async setFlag(document2, scope, key, value2) {
    if (__privateGet(this, _disposed3)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot set flag on disposed port", { scope, key })
      };
    }
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
  dispose() {
    if (__privateGet(this, _disposed3)) return;
    __privateSet(this, _disposed3, true);
  }
};
_disposed3 = new WeakMap();
__name(_FoundryDocumentPortV13, "FoundryDocumentPortV13");
let FoundryDocumentPortV13 = _FoundryDocumentPortV13;
const _FoundryUIPortV13 = class _FoundryUIPortV13 {
  constructor() {
    __privateAdd(this, _disposed4, false);
  }
  removeJournalElement(journalId, journalName, html) {
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot remove journal element on disposed port"));
    }
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
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot find element on disposed port"));
    }
    const element = container.querySelector(selector);
    return ok(element);
  }
  notify(message2, type, options) {
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot show notification on disposed port"));
    }
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }
    try {
      switch (type) {
        case "info":
          ui.notifications.info(message2, options);
          break;
        case "warning":
          ui.notifications.warn(message2, options);
          break;
        case "error":
          ui.notifications.error(message2, options);
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
  dispose() {
    if (__privateGet(this, _disposed4)) return;
    __privateSet(this, _disposed4, true);
  }
};
_disposed4 = new WeakMap();
__name(_FoundryUIPortV13, "FoundryUIPortV13");
let FoundryUIPortV13 = _FoundryUIPortV13;
const _FoundrySettingsPortV13 = class _FoundrySettingsPortV13 {
  constructor() {
    __privateAdd(this, _disposed5, false);
  }
  register(namespace, key, config2) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot register setting on disposed port", {
          namespace,
          key
        })
      );
    }
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
  get(namespace, key, schema) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot get setting on disposed port", { namespace, key })
      );
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return tryCatch(
      () => {
        const rawValue = game.settings.get(
          namespace,
          key
        );
        const parseResult = /* @__PURE__ */ safeParse(schema, rawValue);
        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Setting ${namespace}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { namespace, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }
        return parseResult.output;
      },
      (error) => {
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return error;
        }
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get setting ${namespace}.${key}`,
          { namespace, key },
          error
        );
      }
    );
  }
  async set(namespace, key, value2) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot set setting on disposed port", { namespace, key })
      );
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    return fromPromise(
      /* type-coverage:ignore-next-line -- Type widening: fvtt-types restrictive definition, cast safe for dynamic module namespaces */
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
  dispose() {
    if (__privateGet(this, _disposed5)) return;
    __privateSet(this, _disposed5, true);
  }
};
_disposed5 = new WeakMap();
__name(_FoundrySettingsPortV13, "FoundrySettingsPortV13");
let FoundrySettingsPortV13 = _FoundrySettingsPortV13;
const _FoundryI18nPortV13 = class _FoundryI18nPortV13 {
  constructor() {
    __privateAdd(this, _disposed6, false);
  }
  /**
   * Localizes a translation key using Foundry's i18n system.
   *
   * @param key - Translation key
   * @returns Result with translated string (returns key itself if not found)
   */
  localize(key) {
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot localize on disposed port", { key })
      };
    }
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
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot format translation on disposed port", {
          key
        })
      };
    }
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
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot check translation key on disposed port", {
          key
        })
      };
    }
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
  dispose() {
    if (__privateGet(this, _disposed6)) return;
    __privateSet(this, _disposed6, true);
  }
};
_disposed6 = new WeakMap();
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
    DIPortSelector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerPortInfrastructure, "registerPortInfrastructure");
function registerPortRegistries(container) {
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
__name(registerPortRegistries, "registerPortRegistries");
const _FoundryServiceBase = class _FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.retryService = retryService;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @param adapterName - Name for logging purposes (e.g., "FoundryGame")
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort(adapterName) {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        void 0,
        adapterName
      );
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  /**
   * Executes a Foundry API operation with automatic retry on transient failures.
   *
   * Use this for any port method call to handle:
   * - Race conditions (Foundry not fully initialized)
   * - Timing issues (DOM/Settings not ready)
   * - Transient port selection failures
   *
   * @template T - The success type
   * @param fn - Function to execute (should call port methods)
   * @param operationName - Operation name for logging (e.g., "FoundryGame.getJournalEntries")
   * @param maxAttempts - Max retry attempts (default: 2 = 1 retry)
   * @returns Result from operation or mapped error
   *
   * @example
   * ```typescript
   * getJournalEntries(): Result<Entry[], FoundryError> {
   *   return this.withRetry(
   *     () => {
   *       const portResult = this.getPort("FoundryGame");
   *       if (!portResult.ok) return portResult;
   *       return portResult.value.getJournalEntries();
   *     },
   *     "FoundryGame.getJournalEntries"
   *   );
   * }
   * ```
   */
  withRetry(fn, operationName, maxAttempts = 2) {
    return this.retryService.retrySync(fn, {
      maxAttempts,
      operationName,
      mapException: /* @__PURE__ */ __name((error) => ({
        code: "OPERATION_FAILED",
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : void 0
      }), "mapException")
    });
  }
  /**
   * Async variant of withRetry for async operations.
   *
   * @template T - The success type
   * @param fn - Async function to execute
   * @param operationName - Operation name for logging
   * @param maxAttempts - Max retry attempts (default: 2)
   * @returns Promise resolving to Result
   *
   * @example
   * ```typescript
   * async setFlag<T>(doc, scope, key, value): Promise<Result<void, FoundryError>> {
   *   return this.withRetryAsync(
   *     async () => {
   *       const portResult = this.getPort("FoundryDocument");
   *       if (!portResult.ok) return portResult;
   *       return await portResult.value.setFlag(doc, scope, key, value);
   *     },
   *     "FoundryDocument.setFlag"
   *   );
   * }
   * ```
   */
  async withRetryAsync(fn, operationName, maxAttempts = 2) {
    return this.retryService.retry(fn, {
      maxAttempts,
      delayMs: 100,
      // 100ms delay between retries
      operationName,
      mapException: /* @__PURE__ */ __name((error) => ({
        code: "OPERATION_FAILED",
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : void 0
      }), "mapException")
    });
  }
  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then resets the reference.
   * All ports now implement dispose() with #disposed state guards.
   */
  dispose() {
    if (this.port && typeof this.port === "object" && "dispose" in this.port && typeof this.port.dispose === "function") {
      this.port.dispose();
    }
    this.port = null;
  }
};
__name(_FoundryServiceBase, "FoundryServiceBase");
let FoundryServiceBase = _FoundryServiceBase;
const _FoundryGameService = class _FoundryGameService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  getJournalEntries() {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntries();
    }, "FoundryGame.getJournalEntries");
  }
  getJournalEntryById(id) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntryById(id);
    }, "FoundryGame.getJournalEntryById");
  }
};
__name(_FoundryGameService, "FoundryGameService");
let FoundryGameService = _FoundryGameService;
const _DIFoundryGameService = class _DIFoundryGameService extends FoundryGameService {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryGameService, "DIFoundryGameService");
_DIFoundryGameService.dependencies = [
  portSelectorToken,
  foundryGamePortRegistryToken,
  retryServiceToken
];
let DIFoundryGameService = _DIFoundryGameService;
const _FoundryHooksService = class _FoundryHooksService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService, logger) {
    super(portSelector, portRegistry, retryService);
    this.registeredHooks = /* @__PURE__ */ new Map();
    this.callbackToIdMap = /* @__PURE__ */ new Map();
    this.logger = logger;
  }
  on(hookName, callback) {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.on(hookName, callback);
    }, "FoundryHooks.on");
    if (result.ok) {
      let hookMap = this.registeredHooks.get(hookName);
      if (!hookMap) {
        hookMap = /* @__PURE__ */ new Map();
        this.registeredHooks.set(hookName, hookMap);
      }
      hookMap.set(result.value, callback);
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);
    }
    return result;
  }
  once(hookName, callback) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.once(hookName, callback);
    }, "FoundryHooks.once");
  }
  off(hookName, callbackOrId) {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.off(hookName, callbackOrId);
    }, "FoundryHooks.off");
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
let FoundryHooksService = _FoundryHooksService;
const _DIFoundryHooksService = class _DIFoundryHooksService extends FoundryHooksService {
  constructor(portSelector, portRegistry, retryService, logger) {
    super(portSelector, portRegistry, retryService, logger);
  }
};
__name(_DIFoundryHooksService, "DIFoundryHooksService");
_DIFoundryHooksService.dependencies = [
  portSelectorToken,
  foundryHooksPortRegistryToken,
  retryServiceToken,
  loggerToken
];
let DIFoundryHooksService = _DIFoundryHooksService;
const _FoundryDocumentService = class _FoundryDocumentService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  getFlag(document2, scope, key, schema) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return portResult.value.getFlag(document2, scope, key, schema);
    }, "FoundryDocument.getFlag");
  }
  async setFlag(document2, scope, key, value2) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.setFlag(document2, scope, key, value2);
    }, "FoundryDocument.setFlag");
  }
};
__name(_FoundryDocumentService, "FoundryDocumentService");
let FoundryDocumentService = _FoundryDocumentService;
const _DIFoundryDocumentService = class _DIFoundryDocumentService extends FoundryDocumentService {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryDocumentService, "DIFoundryDocumentService");
_DIFoundryDocumentService.dependencies = [
  portSelectorToken,
  foundryDocumentPortRegistryToken,
  retryServiceToken
];
let DIFoundryDocumentService = _DIFoundryDocumentService;
const _FoundryUIService = class _FoundryUIService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  removeJournalElement(journalId, journalName, html) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.removeJournalElement(journalId, journalName, html);
    }, "FoundryUI.removeJournalElement");
  }
  findElement(container, selector) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.findElement(container, selector);
    }, "FoundryUI.findElement");
  }
  notify(message2, type, options) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.notify(message2, type, options);
    }, "FoundryUI.notify");
  }
};
__name(_FoundryUIService, "FoundryUIService");
let FoundryUIService = _FoundryUIService;
const _DIFoundryUIService = class _DIFoundryUIService extends FoundryUIService {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryUIService, "DIFoundryUIService");
_DIFoundryUIService.dependencies = [portSelectorToken, foundryUIPortRegistryToken, retryServiceToken];
let DIFoundryUIService = _DIFoundryUIService;
const _FoundrySettingsService = class _FoundrySettingsService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  register(namespace, key, config2) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.register(namespace, key, config2);
    }, "FoundrySettings.register");
  }
  get(namespace, key, schema) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.get(namespace, key, schema);
    }, "FoundrySettings.get");
  }
  async set(namespace, key, value2) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.set(namespace, key, value2);
    }, "FoundrySettings.set");
  }
};
__name(_FoundrySettingsService, "FoundrySettingsService");
let FoundrySettingsService = _FoundrySettingsService;
const _DIFoundrySettingsService = class _DIFoundrySettingsService extends FoundrySettingsService {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundrySettingsService, "DIFoundrySettingsService");
_DIFoundrySettingsService.dependencies = [
  portSelectorToken,
  foundrySettingsPortRegistryToken,
  retryServiceToken
];
let DIFoundrySettingsService = _DIFoundrySettingsService;
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
   * Get a module flag from a journal entry with runtime validation.
   *
   * Delegates to FoundryDocument.getFlag() with module scope and schema.
   *
   * @template T - The flag value type
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param schema - Valibot schema for validation
   */
  getEntryFlag(entry, key, schema) {
    return this.document.getFlag(
      /* type-coverage:ignore-next-line -- Type widening: fvtt-types restrictive scope type, cast necessary for module flags */
      entry,
      MODULE_CONSTANTS.MODULE.ID,
      key,
      schema
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
let FoundryJournalFacade = _FoundryJournalFacade;
const _DIFoundryJournalFacade = class _DIFoundryJournalFacade extends FoundryJournalFacade {
  constructor(game2, document2, ui2) {
    super(game2, document2, ui2);
  }
};
__name(_DIFoundryJournalFacade, "DIFoundryJournalFacade");
_DIFoundryJournalFacade.dependencies = [foundryGameToken, foundryDocumentToken, foundryUIToken];
let DIFoundryJournalFacade = _DIFoundryJournalFacade;
const KEY_SEPARATOR = ":";
function normalizeSegment(segment) {
  return segment.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
}
__name(normalizeSegment, "normalizeSegment");
function createCacheKey(parts) {
  const { namespace, resource, identifier } = parts;
  const payload = [MODULE_CONSTANTS.MODULE.ID, namespace, resource];
  if (identifier !== null && identifier !== void 0) {
    payload.push(String(identifier));
  }
  return payload.map(normalizeSegment).join(KEY_SEPARATOR);
}
__name(createCacheKey, "createCacheKey");
function createCacheNamespace(namespace) {
  const normalizedNamespace = normalizeSegment(namespace);
  return (resource, identifier) => identifier === void 0 ? createCacheKey({ namespace: normalizedNamespace, resource }) : createCacheKey({ namespace: normalizedNamespace, resource, identifier });
}
__name(createCacheNamespace, "createCacheNamespace");
const LOG_LEVEL_SCHEMA = /* @__PURE__ */ picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR
]);
const BOOLEAN_FLAG_SCHEMA = /* @__PURE__ */ boolean();
const NON_NEGATIVE_NUMBER_SCHEMA = /* @__PURE__ */ pipe(/* @__PURE__ */ number(), /* @__PURE__ */ minValue(0));
const NON_NEGATIVE_INTEGER_SCHEMA = /* @__PURE__ */ pipe(/* @__PURE__ */ number(), /* @__PURE__ */ integer(), /* @__PURE__ */ minValue(0));
const SAMPLING_RATE_SCHEMA = /* @__PURE__ */ pipe(/* @__PURE__ */ number(), /* @__PURE__ */ minValue(0), /* @__PURE__ */ maxValue(1));
const NON_EMPTY_STRING_SCHEMA = /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(1));
const buildJournalCacheKey = createCacheNamespace("journal-visibility");
const HIDDEN_JOURNAL_CACHE_KEY = buildJournalCacheKey("hidden-directory");
const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";
const _JournalVisibilityService = class _JournalVisibilityService {
  constructor(facade, notificationCenter, cacheService) {
    this.facade = facade;
    this.notificationCenter = notificationCenter;
    this.cacheService = cacheService;
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
    const cached = this.cacheService.get(HIDDEN_JOURNAL_CACHE_KEY);
    if (cached?.hit && cached.value) {
      this.notificationCenter.debug(
        `Serving ${cached.value.length} hidden journal entries from cache (ttl=${cached.metadata.expiresAt ?? "∞"})`,
        { context: { cached } },
        { channels: ["ConsoleChannel"] }
      );
      return { ok: true, value: cached.value };
    }
    const allEntriesResult = this.facade.getJournalEntries();
    if (!allEntriesResult.ok) return allEntriesResult;
    const hidden = [];
    for (const journal of allEntriesResult.value) {
      const flagResult = this.facade.getEntryFlag(
        journal,
        MODULE_CONSTANTS.FLAGS.HIDDEN,
        BOOLEAN_FLAG_SCHEMA
      );
      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
      } else {
        const journalIdentifier = journal.name ?? journal.id;
        this.notificationCenter.warn(
          `Failed to read hidden flag for journal "${this.sanitizeForLog(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            /* c8 ignore stop */
            errorMessage: flagResult.error.message
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    }
    this.cacheService.set(HIDDEN_JOURNAL_CACHE_KEY, hidden.slice(), {
      tags: [HIDDEN_JOURNAL_CACHE_TAG]
    });
    return { ok: true, value: hidden };
  }
  /**
   * Processes journal directory HTML to hide flagged entries.
   */
  processJournalDirectory(htmlElement) {
    this.notificationCenter.debug(
      "Processing journal directory for hidden entries",
      { context: { htmlElement } },
      {
        channels: ["ConsoleChannel"]
      }
    );
    const hiddenResult = this.getHiddenJournalEntries();
    match(hiddenResult, {
      onOk: /* @__PURE__ */ __name((hidden) => {
        this.notificationCenter.debug(
          `Found ${hidden.length} hidden journal entries`,
          { context: { hidden } },
          {
            channels: ["ConsoleChannel"]
          }
        );
        this.hideEntries(hidden, htmlElement);
      }, "onOk"),
      onErr: /* @__PURE__ */ __name((error) => {
        this.notificationCenter.error("Error getting hidden journal entries", error, {
          channels: ["ConsoleChannel"]
        });
      }, "onErr")
    });
  }
  hideEntries(entries2, html) {
    for (const journal of entries2) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.facade.removeJournalElement(journal.id, journalName, html);
      match(removeResult, {
        onOk: /* @__PURE__ */ __name(() => {
          this.notificationCenter.debug(
            `Removing journal entry: ${this.sanitizeForLog(journalName)}`,
            { context: { journal } },
            { channels: ["ConsoleChannel"] }
          );
        }, "onOk"),
        onErr: /* @__PURE__ */ __name((error) => {
          this.notificationCenter.warn("Error removing journal entry", error, {
            channels: ["ConsoleChannel"]
          });
        }, "onErr")
      });
    }
  }
};
__name(_JournalVisibilityService, "JournalVisibilityService");
let JournalVisibilityService = _JournalVisibilityService;
const _DIJournalVisibilityService = class _DIJournalVisibilityService extends JournalVisibilityService {
  constructor(facade, notificationCenter, cacheService) {
    super(facade, notificationCenter, cacheService);
  }
};
__name(_DIJournalVisibilityService, "DIJournalVisibilityService");
_DIJournalVisibilityService.dependencies = [
  foundryJournalFacadeToken,
  notificationCenterToken,
  cacheServiceToken
];
let DIJournalVisibilityService = _DIJournalVisibilityService;
function registerFoundryServices(container) {
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    DIFoundryGameService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }
  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    DIFoundryHooksService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }
  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    DIFoundryDocumentService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }
  const uiServiceResult = container.registerClass(
    foundryUIToken,
    DIFoundryUIService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }
  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    DIFoundrySettingsService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
  }
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    DIFoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
  }
  const journalVisibilityResult = container.registerClass(
    journalVisibilityServiceToken,
    DIJournalVisibilityService,
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
const _PerformanceTrackingService = class _PerformanceTrackingService extends PerformanceTrackerImpl {
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_PerformanceTrackingService, "PerformanceTrackingService");
let PerformanceTrackingService = _PerformanceTrackingService;
const _DIPerformanceTrackingService = class _DIPerformanceTrackingService extends PerformanceTrackingService {
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_DIPerformanceTrackingService, "DIPerformanceTrackingService");
_DIPerformanceTrackingService.dependencies = [runtimeConfigToken, metricsSamplerToken];
let DIPerformanceTrackingService = _DIPerformanceTrackingService;
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
   * @param options - Retry configuration options
   * @returns Promise resolving to the Result (success or last error)
   *
   * @example
   * ```typescript
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
   * ```
   */
  async retry(fn, options) {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 1;
    const { mapException, operationName } = options;
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }
    let lastError;
    const startTime = performance.now();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (result.ok) {
          if (attempt > 1 && operationName) {
            const duration = performance.now() - startTime;
            this.logger.debug(
              `Retry succeeded for "${operationName}" after ${attempt} attempts (${duration.toFixed(2)}ms)`
            );
          }
          return result;
        }
        lastError = result.error;
        if (attempt === maxAttempts) {
          break;
        }
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${maxAttempts} failed for "${operationName}"`,
            { error: lastError }
          );
        }
        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        lastError = mapException(error, attempt);
        if (attempt === maxAttempts) {
          break;
        }
        if (operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${maxAttempts} threw exception for "${operationName}"`,
            { error }
          );
        }
        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    if (operationName) {
      const duration = performance.now() - startTime;
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${maxAttempts} attempts (${duration.toFixed(2)}ms)`
      );
    }
    const finalError = lastError;
    return err(finalError);
  }
  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options
   * @returns The Result (success or last error)
   *
   * @example
   * ```typescript
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
   * ```
   */
  retrySync(fn, options) {
    const maxAttempts = options.maxAttempts ?? 3;
    const { mapException, operationName } = options;
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = fn();
        if (result.ok) {
          if (attempt > 1 && operationName) {
            this.logger.debug(`Retry succeeded for "${operationName}" after ${attempt} attempts`);
          }
          return result;
        }
        lastError = result.error;
        if (attempt === maxAttempts) {
          break;
        }
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${maxAttempts} failed for "${operationName}"`,
            { error: lastError }
          );
        }
      } catch (error) {
        lastError = mapException(error, attempt);
        if (attempt === maxAttempts) {
          break;
        }
        if (operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${maxAttempts} threw exception for "${operationName}"`,
            { error }
          );
        }
      }
    }
    if (operationName) {
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${maxAttempts} attempts`
      );
    }
    const finalError = lastError;
    return err(finalError);
  }
};
__name(_RetryService, "RetryService");
let RetryService = _RetryService;
const _DIRetryService = class _DIRetryService extends RetryService {
  constructor(logger, metricsCollector) {
    super(logger, metricsCollector);
  }
};
__name(_DIRetryService, "DIRetryService");
_DIRetryService.dependencies = [loggerToken, metricsCollectorToken];
let DIRetryService = _DIRetryService;
function registerUtilityServices(container) {
  const perfTrackingResult = container.registerClass(
    performanceTrackingServiceToken,
    DIPerformanceTrackingService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(perfTrackingResult)) {
    return err(
      `Failed to register PerformanceTrackingService: ${perfTrackingResult.error.message}`
    );
  }
  const retryServiceResult = container.registerClass(
    retryServiceToken,
    DIRetryService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(retryServiceResult)) {
    return err(`Failed to register RetryService: ${retryServiceResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerUtilityServices, "registerUtilityServices");
const DEFAULT_CACHE_SERVICE_CONFIG = {
  enabled: true,
  defaultTtlMs: MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS,
  namespace: "global"
};
function clampTtl(ttl, fallback2) {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback2;
  }
  return ttl < 0 ? 0 : ttl;
}
__name(clampTtl, "clampTtl");
const _CacheService = class _CacheService {
  constructor(config2 = DEFAULT_CACHE_SERVICE_CONFIG, metricsCollector, clock = () => Date.now()) {
    this.metricsCollector = metricsCollector;
    this.clock = clock;
    this.store = /* @__PURE__ */ new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    const resolvedMaxEntries = typeof config2?.maxEntries === "number" && config2.maxEntries > 0 ? config2.maxEntries : void 0;
    this.config = {
      ...DEFAULT_CACHE_SERVICE_CONFIG,
      ...config2,
      defaultTtlMs: clampTtl(config2?.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs),
      ...resolvedMaxEntries !== void 0 ? { maxEntries: resolvedMaxEntries } : {}
    };
  }
  get isEnabled() {
    return this.config.enabled;
  }
  get size() {
    return this.store.size;
  }
  get(key) {
    return this.accessEntry(key, true);
  }
  async getOrSet(key, factory, options) {
    const existing = this.get(key);
    if (existing) {
      return existing;
    }
    const value2 = await factory();
    const metadata2 = this.set(key, value2, options);
    return {
      hit: false,
      value: value2,
      metadata: metadata2
    };
  }
  set(key, value2, options) {
    const now = this.clock();
    const metadata2 = this.createMetadata(key, options, now);
    if (!this.isEnabled) {
      return metadata2;
    }
    const entry = {
      value: value2,
      expiresAt: metadata2.expiresAt,
      metadata: metadata2
    };
    this.store.set(key, entry);
    this.enforceCapacity();
    return { ...metadata2, tags: [...metadata2.tags] };
  }
  delete(key) {
    if (!this.isEnabled) return false;
    const removed = this.store.delete(key);
    if (removed) {
      this.stats.evictions++;
    }
    return removed;
  }
  has(key) {
    return Boolean(this.accessEntry(key, false));
  }
  clear() {
    if (!this.isEnabled) return 0;
    const removed = this.store.size;
    this.store.clear();
    if (removed > 0) {
      this.stats.evictions += removed;
    }
    return removed;
  }
  invalidateWhere(predicate) {
    if (!this.isEnabled) return 0;
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (predicate(entry.metadata)) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.stats.evictions += removed;
    }
    return removed;
  }
  getMetadata(key) {
    if (!this.isEnabled) return null;
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.handleExpiration(key);
      return null;
    }
    return this.cloneMetadata(entry.metadata);
  }
  getStatistics() {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.store.size,
      enabled: this.isEnabled
    };
  }
  accessEntry(key, mutateUsage) {
    if (!this.isEnabled) {
      this.recordMiss();
      return null;
    }
    const entry = this.store.get(key);
    if (!entry) {
      this.recordMiss();
      return null;
    }
    if (this.isExpired(entry)) {
      this.handleExpiration(key);
      this.recordMiss();
      return null;
    }
    if (mutateUsage) {
      entry.metadata.hits += 1;
      entry.metadata.lastAccessedAt = this.clock();
    }
    this.recordHit();
    return {
      hit: true,
      value: entry.value,
      // type-coverage:ignore-line -- Map stores ServiceType union; casting back to generic is safe
      metadata: this.cloneMetadata(entry.metadata)
    };
  }
  recordHit() {
    this.metricsCollector?.recordCacheAccess(true);
    this.stats.hits++;
  }
  recordMiss() {
    this.metricsCollector?.recordCacheAccess(false);
    this.stats.misses++;
  }
  handleExpiration(key) {
    if (this.store.delete(key)) {
      this.stats.evictions++;
    }
  }
  isExpired(entry) {
    return typeof entry.expiresAt === "number" && entry.expiresAt > 0 && entry.expiresAt <= this.clock();
  }
  enforceCapacity() {
    if (!this.config.maxEntries || this.store.size <= this.config.maxEntries) {
      return;
    }
    while (this.store.size > this.config.maxEntries) {
      let lruKey = null;
      let oldestTimestamp = Number.POSITIVE_INFINITY;
      for (const [key, entry] of this.store.entries()) {
        if (entry.metadata.lastAccessedAt < oldestTimestamp) {
          oldestTimestamp = entry.metadata.lastAccessedAt;
          lruKey = key;
        }
      }
      if (!lruKey) {
        break;
      }
      this.store.delete(lruKey);
      this.stats.evictions++;
    }
  }
  createMetadata(key, options, now) {
    const ttlMs = clampTtl(options?.ttlMs, this.config.defaultTtlMs);
    const expiresAt = ttlMs > 0 ? now + ttlMs : null;
    const tags = options?.tags ? Array.from(new Set(options.tags.map((tag) => String(tag)))) : [];
    return {
      key,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      hits: 0,
      tags
    };
  }
  cloneMetadata(metadata2) {
    return {
      ...metadata2,
      tags: [...metadata2.tags]
    };
  }
};
__name(_CacheService, "CacheService");
let CacheService = _CacheService;
const _DICacheService = class _DICacheService extends CacheService {
  constructor(config2, metrics) {
    super(config2, metrics);
  }
};
__name(_DICacheService, "DICacheService");
_DICacheService.dependencies = [cacheServiceConfigToken, metricsCollectorToken];
let DICacheService = _DICacheService;
function registerCacheServices(container) {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }
  const maxEntries2 = runtimeConfig.get("cacheMaxEntries");
  const config2 = {
    enabled: runtimeConfig.get("enableCacheService"),
    defaultTtlMs: runtimeConfig.get("cacheDefaultTtlMs"),
    namespace: MODULE_CONSTANTS.MODULE.ID,
    ...typeof maxEntries2 === "number" && maxEntries2 > 0 ? { maxEntries: maxEntries2 } : {}
  };
  const configResult = container.registerValue(cacheServiceConfigToken, config2);
  if (isErr(configResult)) {
    return err(`Failed to register CacheServiceConfig: ${configResult.error.message}`);
  }
  const serviceResult = container.registerClass(
    cacheServiceToken,
    DICacheService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(serviceResult)) {
    return err(`Failed to register CacheService: ${serviceResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerCacheServices, "registerCacheServices");
const _FoundryI18nService = class _FoundryI18nService extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  localize(key) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.localize(key);
    }, "FoundryI18n.localize");
  }
  format(key, data) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.format(key, data);
    }, "FoundryI18n.format");
  }
  has(key) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.has(key);
    }, "FoundryI18n.has");
  }
};
__name(_FoundryI18nService, "FoundryI18nService");
let FoundryI18nService = _FoundryI18nService;
const _DIFoundryI18nService = class _DIFoundryI18nService extends FoundryI18nService {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryI18nService, "DIFoundryI18nService");
_DIFoundryI18nService.dependencies = [
  portSelectorToken,
  foundryI18nPortRegistryToken,
  retryServiceToken
];
let DIFoundryI18nService = _DIFoundryI18nService;
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
const _DILocalI18nService = class _DILocalI18nService extends LocalI18nService {
  constructor() {
    super();
  }
};
__name(_DILocalI18nService, "DILocalI18nService");
_DILocalI18nService.dependencies = [];
let DILocalI18nService = _DILocalI18nService;
const _I18nFacadeService = class _I18nFacadeService {
  constructor(handlerChain, localI18n) {
    this.handlerChain = handlerChain;
    this.localI18n = localI18n;
  }
  /**
   * Translates a key using the handler chain: Foundry → Local → Fallback.
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
    return this.handlerChain.handle(key, void 0, fallback2) ?? key;
  }
  /**
   * Formats a string with placeholders using the handler chain.
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
    return this.handlerChain.handle(key, data, fallback2) ?? key;
  }
  /**
   * Checks if a translation key exists in the handler chain.
   * Checks Foundry → Local (Fallback always returns false for has()).
   *
   * @param key - Translation key to check
   * @returns True if key exists in Foundry or local i18n
   */
  has(key) {
    return this.handlerChain.has(key);
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
let I18nFacadeService = _I18nFacadeService;
const _DII18nFacadeService = class _DII18nFacadeService extends I18nFacadeService {
  constructor(handlerChain, localI18n) {
    super(handlerChain, localI18n);
  }
};
__name(_DII18nFacadeService, "DII18nFacadeService");
_DII18nFacadeService.dependencies = [translationHandlerChainToken, localI18nToken];
let DII18nFacadeService = _DII18nFacadeService;
const _AbstractTranslationHandler = class _AbstractTranslationHandler {
  constructor() {
    this.nextHandler = null;
  }
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  handle(key, data, fallback2) {
    const result = this.doHandle(key, data, fallback2);
    if (result !== null) {
      return result;
    }
    if (this.nextHandler) {
      return this.nextHandler.handle(key, data, fallback2);
    }
    return null;
  }
  has(key) {
    if (this.doHas(key)) {
      return true;
    }
    if (this.nextHandler) {
      return this.nextHandler.has(key);
    }
    return false;
  }
};
__name(_AbstractTranslationHandler, "AbstractTranslationHandler");
let AbstractTranslationHandler = _AbstractTranslationHandler;
const _FoundryTranslationHandler = class _FoundryTranslationHandler extends AbstractTranslationHandler {
  constructor(foundryI18n) {
    super();
    this.foundryI18n = foundryI18n;
  }
  doHandle(key, data, _fallback) {
    const result = data ? this.foundryI18n.format(key, data) : this.foundryI18n.localize(key);
    if (result.ok && result.value !== key) {
      return result.value;
    }
    return null;
  }
  doHas(key) {
    const result = this.foundryI18n.has(key);
    return result.ok && result.value;
  }
};
__name(_FoundryTranslationHandler, "FoundryTranslationHandler");
let FoundryTranslationHandler = _FoundryTranslationHandler;
const _DIFoundryTranslationHandler = class _DIFoundryTranslationHandler extends FoundryTranslationHandler {
  constructor(foundryI18n) {
    super(foundryI18n);
  }
};
__name(_DIFoundryTranslationHandler, "DIFoundryTranslationHandler");
_DIFoundryTranslationHandler.dependencies = [foundryI18nToken];
let DIFoundryTranslationHandler = _DIFoundryTranslationHandler;
const _LocalTranslationHandler = class _LocalTranslationHandler extends AbstractTranslationHandler {
  constructor(localI18n) {
    super();
    this.localI18n = localI18n;
  }
  doHandle(key, data, _fallback) {
    const result = data ? this.localI18n.format(key, data) : this.localI18n.translate(key);
    if (result.ok && result.value !== key) {
      return result.value;
    }
    return null;
  }
  doHas(key) {
    const result = this.localI18n.has(key);
    return result.ok && result.value;
  }
};
__name(_LocalTranslationHandler, "LocalTranslationHandler");
let LocalTranslationHandler = _LocalTranslationHandler;
const _DILocalTranslationHandler = class _DILocalTranslationHandler extends LocalTranslationHandler {
  constructor(localI18n) {
    super(localI18n);
  }
};
__name(_DILocalTranslationHandler, "DILocalTranslationHandler");
_DILocalTranslationHandler.dependencies = [localI18nToken];
let DILocalTranslationHandler = _DILocalTranslationHandler;
const _FallbackTranslationHandler = class _FallbackTranslationHandler extends AbstractTranslationHandler {
  doHandle(key, _data, fallback2) {
    return fallback2 ?? key;
  }
  doHas(_key) {
    return false;
  }
};
__name(_FallbackTranslationHandler, "FallbackTranslationHandler");
_FallbackTranslationHandler.dependencies = [];
let FallbackTranslationHandler = _FallbackTranslationHandler;
const _DIFallbackTranslationHandler = class _DIFallbackTranslationHandler extends FallbackTranslationHandler {
  constructor() {
    super();
  }
};
__name(_DIFallbackTranslationHandler, "DIFallbackTranslationHandler");
_DIFallbackTranslationHandler.dependencies = [];
let DIFallbackTranslationHandler = _DIFallbackTranslationHandler;
const _TranslationHandlerChain = class _TranslationHandlerChain {
  constructor(foundryHandler, localHandler, fallbackHandler) {
    this.head = foundryHandler;
    this.head.setNext(localHandler).setNext(fallbackHandler);
  }
  setNext(handler) {
    return this.head.setNext(handler);
  }
  handle(key, data, fallback2) {
    return this.head.handle(key, data, fallback2);
  }
  has(key) {
    return this.head.has(key);
  }
};
__name(_TranslationHandlerChain, "TranslationHandlerChain");
let TranslationHandlerChain = _TranslationHandlerChain;
const _DITranslationHandlerChain = class _DITranslationHandlerChain extends TranslationHandlerChain {
  constructor(foundryHandler, localHandler, fallbackHandler) {
    super(foundryHandler, localHandler, fallbackHandler);
  }
};
__name(_DITranslationHandlerChain, "DITranslationHandlerChain");
_DITranslationHandlerChain.dependencies = [
  foundryTranslationHandlerToken,
  localTranslationHandlerToken,
  fallbackTranslationHandlerToken
];
let DITranslationHandlerChain = _DITranslationHandlerChain;
function registerI18nServices(container) {
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    DIFoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }
  const localI18nResult = container.registerClass(
    localI18nToken,
    DILocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }
  const foundryHandlerResult = container.registerClass(
    foundryTranslationHandlerToken,
    DIFoundryTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryHandlerResult)) {
    return err(
      `Failed to register FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
    );
  }
  const localHandlerResult = container.registerClass(
    localTranslationHandlerToken,
    DILocalTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localHandlerResult)) {
    return err(`Failed to register LocalTranslationHandler: ${localHandlerResult.error.message}`);
  }
  const fallbackHandlerResult = container.registerClass(
    fallbackTranslationHandlerToken,
    DIFallbackTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(fallbackHandlerResult)) {
    return err(
      `Failed to register FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
    );
  }
  const chainResult = container.registerClass(
    translationHandlerChainToken,
    DITranslationHandlerChain,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(chainResult)) {
    return err(`Failed to register TranslationHandlerChain: ${chainResult.error.message}`);
  }
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    DII18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerI18nServices, "registerI18nServices");
const _NotificationCenter = class _NotificationCenter {
  constructor(initialChannels) {
    this.channels = [...initialChannels];
  }
  debug(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("debug", context, payload, options);
  }
  info(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("info", context, payload, options);
  }
  warn(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("warn", context, payload, options);
  }
  error(context, error, options) {
    const payload = error === void 0 ? {} : { error };
    return this.notify("error", context, payload, options);
  }
  addChannel(channel) {
    const alreadyRegistered = this.channels.some((existing) => existing.name === channel.name);
    if (!alreadyRegistered) {
      this.channels.push(channel);
    }
  }
  removeChannel(name) {
    const index = this.channels.findIndex((channel) => channel.name === name);
    if (index === -1) {
      return false;
    }
    this.channels.splice(index, 1);
    return true;
  }
  getChannelNames() {
    return this.channels.map((channel) => channel.name);
  }
  notify(level, context, payload, options) {
    const notification = {
      level,
      context,
      timestamp: /* @__PURE__ */ new Date(),
      ...payload.data !== void 0 ? { data: payload.data } : {},
      ...payload.error !== void 0 ? { error: payload.error } : {},
      ...options?.traceId !== void 0 ? { traceId: options.traceId } : {},
      ...options?.uiOptions !== void 0 ? { uiOptions: options.uiOptions } : {}
    };
    const targetChannels = this.selectChannels(options?.channels);
    let attempted = false;
    let succeeded = false;
    const failures = [];
    for (const channel of targetChannels) {
      if (!channel.canHandle(notification)) {
        continue;
      }
      attempted = true;
      const result = channel.send(notification);
      if (result.ok) {
        succeeded = true;
      } else {
        failures.push(`${channel.name}: ${result.error}`);
      }
    }
    if (!attempted || succeeded) {
      return ok(void 0);
    }
    return err(`All channels failed: ${failures.join("; ")}`);
  }
  selectChannels(channelNames) {
    if (!channelNames || channelNames.length === 0) {
      return this.channels;
    }
    return this.channels.filter((channel) => channelNames.includes(channel.name));
  }
};
__name(_NotificationCenter, "NotificationCenter");
let NotificationCenter = _NotificationCenter;
const _DINotificationCenter = class _DINotificationCenter extends NotificationCenter {
  constructor(consoleChannel) {
    super([consoleChannel]);
  }
};
__name(_DINotificationCenter, "DINotificationCenter");
_DINotificationCenter.dependencies = [consoleChannelToken];
let DINotificationCenter = _DINotificationCenter;
const _ConsoleChannel = class _ConsoleChannel {
  constructor(logger) {
    this.logger = logger;
    this.name = "ConsoleChannel";
  }
  canHandle() {
    return true;
  }
  send(notification) {
    const { level, context, data, error } = notification;
    switch (level) {
      case "debug":
        this.logger.debug(context, data);
        break;
      case "info":
        this.logger.info(context, data);
        break;
      case "warn":
        this.logger.warn(context, data ?? error);
        break;
      case "error":
        this.logger.error(context, error ?? data);
        break;
    }
    return ok(void 0);
  }
};
__name(_ConsoleChannel, "ConsoleChannel");
let ConsoleChannel = _ConsoleChannel;
const _DIConsoleChannel = class _DIConsoleChannel extends ConsoleChannel {
  constructor(logger) {
    super(logger);
  }
};
__name(_DIConsoleChannel, "DIConsoleChannel");
_DIConsoleChannel.dependencies = [loggerToken];
let DIConsoleChannel = _DIConsoleChannel;
const _UIChannel = class _UIChannel {
  constructor(foundryUI, config2) {
    this.foundryUI = foundryUI;
    this.config = config2;
    this.name = "UIChannel";
  }
  canHandle(notification) {
    return notification.level !== "debug";
  }
  send(notification) {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiType = this.mapLevelToUIType(notification.level);
    const uiOptions = notification.uiOptions;
    const notifyResult = this.foundryUI.notify(sanitizedMessage, uiType, uiOptions);
    if (!notifyResult.ok) {
      return err(`UI notification failed: ${notifyResult.error.message}`);
    }
    return ok(void 0);
  }
  /**
   * Sanitizes notification message for UI display.
   *
   * Development: Shows detailed messages
   * Production: Shows generic messages to prevent information leakage
   */
  sanitizeForUI(notification) {
    const { level, context, data, error } = notification;
    if (this.config.get("isDevelopment")) {
      if (level === "error" && error) {
        return `${context}: ${error.message}`;
      }
      if (data && typeof data === "object" && "message" in data) {
        return `${context}: ${String(data.message)}`;
      }
      return context;
    }
    if (level === "error" && error) {
      return `${context}. Please try again or contact support. (Error: ${error.code})`;
    }
    return context;
  }
  /**
   * Maps notification level to Foundry UI notification type.
   */
  mapLevelToUIType(level) {
    switch (level) {
      case "info":
        return "info";
      case "warn":
        return "warning";
      case "error":
        return "error";
      case "debug":
        return "info";
    }
  }
};
__name(_UIChannel, "UIChannel");
let UIChannel = _UIChannel;
const _DIUIChannel = class _DIUIChannel extends UIChannel {
  constructor(foundryUI, config2) {
    super(foundryUI, config2);
  }
};
__name(_DIUIChannel, "DIUIChannel");
_DIUIChannel.dependencies = [foundryUIToken, runtimeConfigToken];
let DIUIChannel = _DIUIChannel;
function registerNotifications(container) {
  const consoleChannelResult = container.registerClass(
    consoleChannelToken,
    DIConsoleChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(consoleChannelResult)) {
    return err(`Failed to register ConsoleChannel: ${consoleChannelResult.error.message}`);
  }
  const uiChannelResult = container.registerClass(
    uiChannelToken,
    DIUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiChannelResult)) {
    return err(`Failed to register UIChannel: ${uiChannelResult.error.message}`);
  }
  const notificationCenterResult = container.registerClass(
    notificationCenterToken,
    DINotificationCenter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationCenterResult)) {
    return err(`Failed to register NotificationCenter: ${notificationCenterResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerNotifications, "registerNotifications");
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
        const validationResult = /* @__PURE__ */ safeParse(LOG_LEVEL_SCHEMA, value2);
        if (!validationResult.success) {
          logger.warn(`Invalid log level value received: ${value2}, using default INFO`);
          if (logger.setMinLevel) {
            logger.setMinLevel(LogLevel.INFO);
          }
          return;
        }
        if (logger.setMinLevel) {
          logger.setMinLevel(validationResult.output);
          logger.info(`Log level changed to: ${LogLevel[validationResult.output]}`);
        }
      }, "onChange")
    };
  }
};
const cacheEnabledSetting = {
  key: MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.cacheEnabled.name", "Enable Cache Service"),
      hint: i18n.translate(
        "MODULE.SETTINGS.cacheEnabled.hint",
        "Toggle the global CacheService. When disabled, all cache interactions bypass the cache layer."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`CacheService ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const cacheDefaultTtlSetting = {
  key: MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.cacheDefaultTtlMs.name", "Cache TTL (ms)"),
      hint: i18n.translate(
        "MODULE.SETTINGS.cacheDefaultTtlMs.hint",
        "Default lifetime for cache entries in milliseconds. Use 0 to disable TTL (entries live until invalidated)."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS,
      onChange: /* @__PURE__ */ __name((value2) => {
        const numericValue = Number(value2);
        const sanitized = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
        logger.info(`Cache TTL updated via settings: ${sanitized}ms`);
      }, "onChange")
    };
  }
};
const cacheMaxEntriesSetting = {
  key: MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.cacheMaxEntries.name", "Cache Max Entries"),
      hint: i18n.translate(
        "MODULE.SETTINGS.cacheMaxEntries.hint",
        "Optional LRU limit. Use 0 to allow unlimited cache entries."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 0,
      onChange: /* @__PURE__ */ __name((value2) => {
        const numericValue = Number(value2);
        const sanitized = Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0;
        if (sanitized === 0) {
          logger.info("Cache max entries reset to unlimited via settings.");
        } else {
          logger.info(`Cache max entries updated via settings: ${sanitized}`);
        }
      }, "onChange")
    };
  }
};
const performanceTrackingSetting = {
  key: MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.performanceTracking.name", "Performance Tracking"),
      hint: i18n.translate(
        "MODULE.SETTINGS.performanceTracking.hint",
        "Enables internal performance instrumentation (requires sampling)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`Performance tracking ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const performanceSamplingSetting = {
  key: MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate(
        "MODULE.SETTINGS.performanceSamplingRate.name",
        "Performance Sampling Rate"
      ),
      hint: i18n.translate(
        "MODULE.SETTINGS.performanceSamplingRate.hint",
        "Fraction of operations to instrument (0 = 0%, 1 = 100%)."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      onChange: /* @__PURE__ */ __name((value2) => {
        const clamped = Math.max(0, Math.min(1, Number(value2) || 0));
        logger.info(
          `Performance sampling rate updated via settings: ${(clamped * 100).toFixed(1)}%`
        );
      }, "onChange")
    };
  }
};
const metricsPersistenceEnabledSetting = {
  key: MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.metricsPersistenceEnabled.name", "Persist Metrics"),
      hint: i18n.translate(
        "MODULE.SETTINGS.metricsPersistenceEnabled.hint",
        "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`Metrics persistence ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const metricsPersistenceKeySetting = {
  key: MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY,
  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.metricsPersistenceKey.name", "Metrics Storage Key"),
      hint: i18n.translate(
        "MODULE.SETTINGS.metricsPersistenceKey.hint",
        "LocalStorage key used when metrics persistence is enabled."
      ),
      scope: "world",
      config: true,
      type: String,
      default: `${MODULE_CONSTANTS.MODULE.ID}.metrics`,
      onChange: /* @__PURE__ */ __name((value2) => {
        logger.info(`Metrics persistence key set to: ${value2 || "(empty)"}`);
      }, "onChange")
    };
  }
};
const runtimeConfigBindings = {
  [MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]: {
    runtimeKey: "logLevel",
    schema: LOG_LEVEL_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED]: {
    runtimeKey: "enableCacheService",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS]: {
    runtimeKey: "cacheDefaultTtlMs",
    schema: NON_NEGATIVE_NUMBER_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES]: {
    runtimeKey: "cacheMaxEntries",
    schema: NON_NEGATIVE_INTEGER_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2 > 0 ? value2 : void 0, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED]: {
    runtimeKey: "enablePerformanceTracking",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE]: {
    runtimeKey: "performanceSamplingRate",
    schema: SAMPLING_RATE_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED]: {
    runtimeKey: "enableMetricsPersistence",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY]: {
    runtimeKey: "metricsPersistenceKey",
    schema: NON_EMPTY_STRING_SCHEMA,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  }
};
const _ModuleSettingsRegistrar = class _ModuleSettingsRegistrar {
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
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);
    if (!notificationCenterResult.ok) {
      console.error("Failed to resolve NotificationCenter for ModuleSettingsRegistrar", {
        error: notificationCenterResult.error
      });
      return;
    }
    const notifications = notificationCenterResult.value;
    if (!settingsResult.ok || !loggerResult.ok || !i18nResult.ok || !runtimeConfigResult.ok) {
      notifications.error(
        "DI resolution failed in ModuleSettingsRegistrar",
        {
          code: "DI_RESOLUTION_FAILED",
          message: "Required services for ModuleSettingsRegistrar are missing",
          details: {
            settingsResolved: settingsResult.ok,
            i18nResolved: i18nResult.ok,
            loggerResolved: loggerResult.ok
          },
          runtimeConfigResolved: runtimeConfigResult.ok
        },
        { channels: ["ConsoleChannel"] }
      );
      return;
    }
    const foundrySettings = settingsResult.value;
    const logger = loggerResult.value;
    const i18n = i18nResult.value;
    const runtimeConfig = runtimeConfigResult.value;
    this.registerDefinition(
      logLevelSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheDefaultTtlSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheMaxEntriesSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      performanceTrackingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      performanceSamplingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      metricsPersistenceEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      metricsPersistenceKeySetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
  }
  attachRuntimeConfigBridge(config2, runtimeConfig, binding) {
    const originalOnChange = config2.onChange;
    return {
      ...config2,
      onChange: /* @__PURE__ */ __name((value2) => {
        const normalized = binding.normalize(value2);
        runtimeConfig.setFromFoundry(binding.runtimeKey, normalized);
        originalOnChange?.(value2);
      }, "onChange")
    };
  }
  syncRuntimeConfigFromSettings(foundrySettings, runtimeConfig, binding, notifications, settingKey) {
    const currentValue = foundrySettings.get(
      MODULE_CONSTANTS.MODULE.ID,
      settingKey,
      binding.schema
    );
    if (!currentValue.ok) {
      notifications.warn(`Failed to read initial value for ${settingKey}`, currentValue.error, {
        channels: ["ConsoleChannel"]
      });
      return;
    }
    runtimeConfig.setFromFoundry(binding.runtimeKey, binding.normalize(currentValue.value));
  }
  registerDefinition(definition, binding, foundrySettings, runtimeConfig, notifications, i18n, logger) {
    const config2 = definition.createConfig(i18n, logger);
    const configWithRuntimeBridge = this.attachRuntimeConfigBridge(config2, runtimeConfig, binding);
    const result = foundrySettings.register(
      MODULE_CONSTANTS.MODULE.ID,
      definition.key,
      configWithRuntimeBridge
    );
    if (!result.ok) {
      notifications.error(`Failed to register ${definition.key} setting`, result.error, {
        channels: ["ConsoleChannel"]
      });
      return;
    }
    if (binding) {
      this.syncRuntimeConfigFromSettings(
        foundrySettings,
        runtimeConfig,
        binding,
        notifications,
        definition.key
      );
    }
  }
};
__name(_ModuleSettingsRegistrar, "ModuleSettingsRegistrar");
_ModuleSettingsRegistrar.dependencies = [];
let ModuleSettingsRegistrar = _ModuleSettingsRegistrar;
const _DIModuleSettingsRegistrar = class _DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  constructor() {
    super();
  }
};
__name(_DIModuleSettingsRegistrar, "DIModuleSettingsRegistrar");
_DIModuleSettingsRegistrar.dependencies = [];
let DIModuleSettingsRegistrar = _DIModuleSettingsRegistrar;
const _ModuleHookRegistrar = class _ModuleHookRegistrar {
  constructor(renderJournalHook, journalCacheInvalidationHook, notificationCenter) {
    this.notificationCenter = notificationCenter;
    this.hooks = [renderJournalHook, journalCacheInvalidationHook];
  }
  /**
   * Registers all hooks with Foundry VTT.
   * @param container - DI container with registered services
   */
  registerAll(container) {
    for (const hook of this.hooks) {
      const result = hook.register(container);
      if (!result.ok) {
        const error = {
          code: "HOOK_REGISTRATION_FAILED",
          message: result.error.message
        };
        this.notificationCenter.error("Failed to register hook", error, {
          channels: ["ConsoleChannel"]
        });
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
const _DIModuleHookRegistrar = class _DIModuleHookRegistrar extends ModuleHookRegistrar {
  constructor(renderJournalHook, journalCacheInvalidationHook, notificationCenter) {
    super(renderJournalHook, journalCacheInvalidationHook, notificationCenter);
  }
};
__name(_DIModuleHookRegistrar, "DIModuleHookRegistrar");
_DIModuleHookRegistrar.dependencies = [
  renderJournalDirectoryHookToken,
  journalCacheInvalidationHookToken,
  notificationCenterToken
];
let DIModuleHookRegistrar = _DIModuleHookRegistrar;
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
function extractHtmlElement(html) {
  return html instanceof HTMLElement ? html : null;
}
__name(extractHtmlElement, "extractHtmlElement");
const _RenderJournalDirectoryHook = class _RenderJournalDirectoryHook {
  constructor() {
    this.unsubscribe = null;
  }
  register(container) {
    const foundryHooksResult = container.resolveWithError(foundryHooksToken);
    const journalVisibilityResult = container.resolveWithError(journalVisibilityServiceToken);
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!foundryHooksResult.ok || !journalVisibilityResult.ok || !notificationCenterResult.ok) {
      if (notificationCenterResult.ok) {
        notificationCenterResult.value.error(
          "DI resolution failed in RenderJournalDirectoryHook",
          {
            code: "DI_RESOLUTION_FAILED",
            message: "Required services for RenderJournalDirectoryHook are missing",
            details: {
              foundryHooksResolved: foundryHooksResult.ok,
              journalVisibilityResolved: journalVisibilityResult.ok
            }
          },
          { channels: ["ConsoleChannel"] }
        );
      } else {
        console.error("NotificationCenter not available for RenderJournalDirectoryHook");
      }
      return err(new Error("Failed to resolve required services for RenderJournalDirectoryHook"));
    }
    const foundryHooks = foundryHooksResult.value;
    const journalVisibility = journalVisibilityResult.value;
    const notificationCenter = notificationCenterResult.value;
    const throttledCallback = throttle((app, html) => {
      notificationCenter.debug(
        `${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`,
        { context: { app, html } },
        { channels: ["ConsoleChannel"] }
      );
      const appValidation = validateHookApp(app);
      if (!appValidation.ok) {
        notificationCenter.error(
          `Invalid app parameter in ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
          appValidation.error,
          { channels: ["ConsoleChannel"] }
        );
        return;
      }
      const htmlElement = extractHtmlElement(html);
      if (!htmlElement) {
        notificationCenter.error(
          "Failed to get HTMLElement from hook - incompatible format",
          {
            code: "INVALID_HTML_ELEMENT",
            message: "HTMLElement could not be extracted from hook arguments."
          },
          { channels: ["ConsoleChannel"] }
        );
        return;
      }
      journalVisibility.processJournalDirectory(htmlElement);
    }, HOOK_THROTTLE_WINDOW_MS);
    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      throttledCallback
    );
    if (!hookResult.ok) {
      notificationCenter.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
        hookResult.error,
        {
          channels: ["ConsoleChannel"]
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
const _DIRenderJournalDirectoryHook = class _DIRenderJournalDirectoryHook extends RenderJournalDirectoryHook {
  constructor() {
    super();
  }
};
__name(_DIRenderJournalDirectoryHook, "DIRenderJournalDirectoryHook");
_DIRenderJournalDirectoryHook.dependencies = [];
let DIRenderJournalDirectoryHook = _DIRenderJournalDirectoryHook;
const JOURNAL_INVALIDATION_HOOKS = [
  MODULE_CONSTANTS.HOOKS.CREATE_JOURNAL_ENTRY,
  MODULE_CONSTANTS.HOOKS.UPDATE_JOURNAL_ENTRY,
  MODULE_CONSTANTS.HOOKS.DELETE_JOURNAL_ENTRY
];
const _JournalCacheInvalidationHook = class _JournalCacheInvalidationHook {
  constructor() {
    this.foundryHooks = null;
    this.registrations = [];
  }
  register(container) {
    const hooksResult = container.resolveWithError(foundryHooksToken);
    const cacheResult = container.resolveWithError(cacheServiceToken);
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!hooksResult.ok || !cacheResult.ok || !notificationCenterResult.ok) {
      if (notificationCenterResult.ok) {
        notificationCenterResult.value.error(
          "DI resolution failed in JournalCacheInvalidationHook",
          {
            code: "DI_RESOLUTION_FAILED",
            message: "Required services for JournalCacheInvalidationHook are missing",
            details: {
              hooksResolved: hooksResult.ok,
              cacheResolved: cacheResult.ok
            }
          },
          { channels: ["ConsoleChannel"] }
        );
      } else {
        console.error("Failed to resolve NotificationCenter for JournalCacheInvalidationHook");
      }
      return err(new Error("Failed to resolve required services for JournalCacheInvalidationHook"));
    }
    const hooks = hooksResult.value;
    const cache = cacheResult.value;
    const notificationCenter = notificationCenterResult.value;
    this.foundryHooks = hooks;
    for (const hookName of JOURNAL_INVALIDATION_HOOKS) {
      const registrationResult = hooks.on(hookName, () => {
        const removed = cache.invalidateWhere(
          (meta) => meta.tags.includes(HIDDEN_JOURNAL_CACHE_TAG)
        );
        if (removed > 0) {
          notificationCenter.debug(
            `Invalidated ${removed} hidden journal cache entries via ${hookName}`,
            { context: { removed, hookName } },
            { channels: ["ConsoleChannel"] }
          );
        }
      });
      if (!registrationResult.ok) {
        notificationCenter.error(`Failed to register ${hookName} hook`, registrationResult.error, {
          channels: ["ConsoleChannel"]
        });
        return err(new Error(`Hook registration failed: ${registrationResult.error.message}`));
      }
      this.registrations.push({ name: hookName, id: registrationResult.value });
    }
    return ok(void 0);
  }
  dispose() {
    if (!this.foundryHooks) {
      this.registrations = [];
      return;
    }
    for (const registration of this.registrations) {
      this.foundryHooks.off(registration.name, registration.id);
    }
    this.registrations = [];
    this.foundryHooks = null;
  }
};
__name(_JournalCacheInvalidationHook, "JournalCacheInvalidationHook");
let JournalCacheInvalidationHook = _JournalCacheInvalidationHook;
const _DIJournalCacheInvalidationHook = class _DIJournalCacheInvalidationHook extends JournalCacheInvalidationHook {
  constructor() {
    super();
  }
};
__name(_DIJournalCacheInvalidationHook, "DIJournalCacheInvalidationHook");
_DIJournalCacheInvalidationHook.dependencies = [];
let DIJournalCacheInvalidationHook = _DIJournalCacheInvalidationHook;
function registerRegistrars(container) {
  const renderJournalHookResult = container.registerClass(
    renderJournalDirectoryHookToken,
    DIRenderJournalDirectoryHook,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(renderJournalHookResult)) {
    return err(
      `Failed to register RenderJournalDirectoryHook: ${renderJournalHookResult.error.message}`
    );
  }
  const cacheInvalidationHookResult = container.registerClass(
    journalCacheInvalidationHookToken,
    DIJournalCacheInvalidationHook,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cacheInvalidationHookResult)) {
    return err(
      `Failed to register JournalCacheInvalidationHook: ${cacheInvalidationHookResult.error.message}`
    );
  }
  const hookRegistrarResult = container.registerClass(
    moduleHookRegistrarToken,
    DIModuleHookRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hookRegistrarResult)) {
    return err(`Failed to register ModuleHookRegistrar: ${hookRegistrarResult.error.message}`);
  }
  const settingsRegistrarResult = container.registerClass(
    moduleSettingsRegistrarToken,
    DIModuleSettingsRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrarResult)) {
    return err(
      `Failed to register ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerRegistrars, "registerRegistrars");
function registerFallbacks(container) {
  container.registerFallback(loggerToken, () => {
    const fallbackConfig = {
      logLevel: LogLevel.DEBUG,
      isDevelopment: false,
      isProduction: false,
      enablePerformanceTracking: false,
      enableDebugMode: true,
      enableMetricsPersistence: false,
      metricsPersistenceKey: "fallback.metrics",
      performanceSamplingRate: 1,
      enableCacheService: true,
      cacheDefaultTtlMs: MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS
    };
    return new ConsoleLoggerService(new RuntimeConfigService(fallbackConfig));
  });
}
__name(registerFallbacks, "registerFallbacks");
function registerStaticValues(container) {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  const runtimeConfigResult = container.registerValue(
    runtimeConfigToken,
    new RuntimeConfigService(ENV)
  );
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigService: ${runtimeConfigResult.error.message}`);
  }
  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerStaticValues, "registerStaticValues");
function registerSubcontainerValues(container) {
  return registerPortRegistries(container);
}
__name(registerSubcontainerValues, "registerSubcontainerValues");
function registerLoopPreventionServices(container) {
  const containerCheckResult = container.registerClass(
    containerHealthCheckToken,
    DIContainerHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(containerCheckResult)) {
    return err(`Failed to register ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }
  const metricsCheckResult = container.registerClass(
    metricsHealthCheckToken,
    DIMetricsHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsCheckResult)) {
    return err(`Failed to register MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerLoopPreventionServices, "registerLoopPreventionServices");
function initializeLoopPreventionValues(container) {
  const registryRes = container.resolveWithError(healthCheckRegistryToken);
  const metricsRes = container.resolveWithError(metricsCollectorToken);
  if (!registryRes.ok) {
    return err(`Failed to resolve HealthCheckRegistry: ${registryRes.error.message}`);
  }
  if (!metricsRes.ok) {
    return err(`Failed to resolve MetricsCollector: ${metricsRes.error.message}`);
  }
  const containerCheckResult = container.resolveWithError(containerHealthCheckToken);
  if (!containerCheckResult.ok) {
    return err(`Failed to resolve ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }
  const metricsCheckResult = container.resolveWithError(metricsHealthCheckToken);
  if (!metricsCheckResult.ok) {
    return err(`Failed to resolve MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }
  return ok(void 0);
}
__name(initializeLoopPreventionValues, "initializeLoopPreventionValues");
function validateContainer(container) {
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(void 0);
}
__name(validateContainer, "validateContainer");
function configureDependencies(container) {
  registerFallbacks(container);
  const staticValuesResult = registerStaticValues(container);
  if (isErr(staticValuesResult)) return staticValuesResult;
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;
  const observabilityResult = registerObservability(container);
  if (isErr(observabilityResult)) return observabilityResult;
  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;
  const cacheServiceResult = registerCacheServices(container);
  if (isErr(cacheServiceResult)) return cacheServiceResult;
  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;
  const subcontainerValuesResult = registerSubcontainerValues(container);
  if (isErr(subcontainerValuesResult)) return subcontainerValuesResult;
  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;
  const i18nServicesResult = registerI18nServices(container);
  if (isErr(i18nServicesResult)) return i18nServicesResult;
  const notificationsResult = registerNotifications(container);
  if (isErr(notificationsResult)) return notificationsResult;
  const registrarsResult = registerRegistrars(container);
  if (isErr(registrarsResult)) return registrarsResult;
  const loopServiceResult = registerLoopPreventionServices(container);
  if (isErr(loopServiceResult)) return loopServiceResult;
  const validationResult = validateContainer(container);
  if (isErr(validationResult)) return validationResult;
  const loopPreventionInitResult = initializeLoopPreventionValues(container);
  if (isErr(loopPreventionInitResult)) return loopPreventionInitResult;
  return ok(void 0);
}
__name(configureDependencies, "configureDependencies");
const _BootstrapLoggerService = class _BootstrapLoggerService extends ConsoleLoggerService {
  constructor() {
    super(new RuntimeConfigService(ENV));
  }
};
__name(_BootstrapLoggerService, "BootstrapLoggerService");
let BootstrapLoggerService = _BootstrapLoggerService;
const BOOTSTRAP_LOGGER = new BootstrapLoggerService();
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
    const runtimeConfig = new RuntimeConfigService(ENV);
    const performanceTracker = new BootstrapPerformanceTracker(runtimeConfig, null);
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
    BOOTSTRAP_LOGGER.error("Failed to configure dependencies during bootstrap", configured.error);
    return { ok: false, error: configured.error };
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
    const initContainerResult = root.getContainer();
    if (!initContainerResult.ok) {
      logger.error(`Failed to get container in init hook: ${initContainerResult.error}`);
      return;
    }
    const notificationCenterResult = initContainerResult.value.resolveWithError(notificationCenterToken);
    if (notificationCenterResult.ok) {
      const uiChannelResult = initContainerResult.value.resolveWithError(uiChannelToken);
      if (uiChannelResult.ok) {
        notificationCenterResult.value.addChannel(uiChannelResult.value);
      } else {
        logger.warn(
          "UI channel could not be resolved; NotificationCenter will remain console-only",
          uiChannelResult.error
        );
      }
    } else {
      logger.warn(
        "NotificationCenter could not be resolved during init; UI channel not attached",
        notificationCenterResult.error
      );
    }
    const apiInitializerResult = initContainerResult.value.resolveWithError(moduleApiInitializerToken);
    if (!apiInitializerResult.ok) {
      logger.error(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
      return;
    }
    const exposeResult = apiInitializerResult.value.expose(initContainerResult.value);
    if (!exposeResult.ok) {
      logger.error(`Failed to expose API: ${exposeResult.error}`);
      return;
    }
    const settingsRegistrarResult = initContainerResult.value.resolveWithError(
      moduleSettingsRegistrarToken
    );
    if (!settingsRegistrarResult.ok) {
      logger.error(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
      return;
    }
    settingsRegistrarResult.value.registerAll(initContainerResult.value);
    const settingsResult = initContainerResult.value.resolveWithError(foundrySettingsToken);
    if (settingsResult.ok) {
      const settings = settingsResult.value;
      const logLevelResult = settings.get(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
        LOG_LEVEL_SCHEMA
      );
      if (logLevelResult.ok && logger.setMinLevel) {
        logger.setMinLevel(logLevelResult.value);
        logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
      }
    }
    const hookRegistrarResult = initContainerResult.value.resolveWithError(moduleHookRegistrarToken);
    if (!hookRegistrarResult.ok) {
      logger.error(`Failed to resolve ModuleHookRegistrar: ${hookRegistrarResult.error.message}`);
      return;
    }
    hookRegistrarResult.value.registerAll(initContainerResult.value);
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
