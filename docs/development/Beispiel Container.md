Super — hier ist eine **kompakte, gut lesbare Referenz-Implementierung** in TypeScript (ein File).
Sie deckt ab: Container, Scope, Registration, Lifecycles (singleton/scoped/transient), Interceptors, Verification (Toposort über deklarierte `deps`), Disposal, sowie eine kleine Injector-Bridge.
Ich verwende **aussagekräftige Namen** (z. B. `<ServiceType>`, `context` statt `<T>`, `ctx`).

> Kopiere das als `di-container.ts` in dein Projekt. Es läuft ohne externe Dependencies.

```ts
/* ============================================
   Minimal & Readable DI Container (TypeScript)
   ============================================ */

/** ----- Lifetimes & Tokens ----- */
export type ServiceLifetime = "singleton" | "scoped" | "transient";

export type InjectionToken<ServiceType> = symbol & { __type?: ServiceType };

export function createInjectionToken<ServiceType>(description: string): InjectionToken<ServiceType> {
  return Symbol.for(`di:${description}`) as InjectionToken<ServiceType>;
}

/** ----- Provider Types ----- */
export interface ClassProvider<ServiceType> {
  useClass: new (...args: any[]) => ServiceType;
  /** Optional: explicit dependency list for verification and pre-resolution */
  deps?: InjectionToken<any>[];
}

export interface FactoryProvider<ServiceType> {
  useFactory: (context: ResolveContext) => ServiceType | Promise<ServiceType>;
  deps?: InjectionToken<any>[]; // used by verify() / diagnostics
}

export interface ValueProvider<ServiceType> {
  useValue: ServiceType;
}

export type Provider<ServiceType> =
  | ClassProvider<ServiceType>
  | FactoryProvider<ServiceType>
  | ValueProvider<ServiceType>;

export interface ServiceRegistration<ServiceType = any> {
  token: InjectionToken<ServiceType>;
  provider: Provider<ServiceType>;
  lifetime?: ServiceLifetime; // default: transient
  tags?: string[];
  lazy?: boolean; // eager-create singletons if false during verify()
  onInit?: (instance: ServiceType, context: ResolveContext) => void | Promise<void>;
  onDispose?: (instance: ServiceRegistration<ServiceType>["token"], value: ServiceType) => void | Promise<void>;
}

/** ----- Disposal Contracts ----- */
export interface DisposableSync {
  dispose(): void;
}
export interface DisposableAsync {
  dispose(): Promise<void>;
}

/** ----- Resolution Context ----- */
export interface ResolveContext {
  container: Container;
  scope: Scope;
  resolving: InjectionToken<any>;
  path: InjectionToken<any>[];
  signal?: AbortSignal;
}

/** ----- Interceptor ----- */
export interface ResolveInterceptor {
  intercept<ServiceType>(
    token: InjectionToken<ServiceType>,
    next: () => Promise<ServiceType>,
    context: ResolveContext
  ): Promise<ServiceType>;
}

/** ----- Diagnostics / Graph ----- */
export interface DependencyGraphNode {
  token: InjectionToken<any>;
  dependsOn: InjectionToken<any>[];
  lifetime: ServiceLifetime;
}

/** ----- Scope & Container Interfaces ----- */
export interface Scope {
  id: string;
  parent?: Scope;
  resolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType;
  resolveAsync<ServiceType>(token: InjectionToken<ServiceType>): Promise<ServiceType>;
  tryResolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType | undefined;
  dispose(): Promise<void>;
}

export interface Container {
  register<ServiceType>(registration: ServiceRegistration<ServiceType>): this;
  registerMany(registrations: ServiceRegistration<any>[]): this;

  resolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType;
  resolveAsync<ServiceType>(token: InjectionToken<ServiceType>): Promise<ServiceType>;
  tryResolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType | undefined;
  resolveAllByTag(tag: string): any[];

  createScope(options?: { id?: string; parent?: Scope }): Scope;

  addInterceptor(interceptor: ResolveInterceptor): this;

  verify(options?: { allowUnboundOptional?: boolean }): Promise<void> | void;

  exportGraph(): DependencyGraphNode[];
  isRegistered(token: InjectionToken<any>): boolean;

  withOverrides(
    overrides: Map<InjectionToken<any>, Provider<any>>
  ): Container;

  install(moduleInstaller: { name?: string; install: (container: Container) => void | Promise<void> }): Promise<void>;

  dispose(): Promise<void>;
}

/* =========================
   Errors
   ========================= */
export class ResolutionError extends Error {
  constructor(
    public token: InjectionToken<any>,
    public path: InjectionToken<any>[],
    message?: string
  ) {
    super(message ?? `Failed to resolve token ${String(token)}`);
  }
}

export class CircularDependencyError extends ResolutionError {
  constructor(token: InjectionToken<any>, path: InjectionToken<any>[]) {
    super(
      token,
      path,
      `Circular dependency detected: ${path.map(String).join(" -> ")} -> ${String(token)}`
    );
  }
}

/* =========================
   Concrete Container Impl
   ========================= */

type InstanceRecord = Map<InjectionToken<any>, any>;

class DefaultScope implements Scope {
  public readonly id: string;
  public readonly parent?: Scope;

  private readonly container: DefaultContainer;
  private readonly cache: InstanceRecord = new Map();
  private readonly disposables: Array<{ token: InjectionToken<any>; value: any; onDispose?: ServiceRegistration["onDispose"] }> = [];

  constructor(container: DefaultContainer, id?: string, parent?: Scope) {
    this.container = container;
    this.id = id ?? `scope-${Math.random().toString(36).slice(2, 8)}`;
    this.parent = parent;
  }

  resolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType {
    const value = this.container._resolveInternal(token, this, []);
    return value;
  }

  async resolveAsync<ServiceType>(token: InjectionToken<ServiceType>): Promise<ServiceType> {
    return this.container._resolveInternalAsync(token, this, []);
  }

  tryResolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType | undefined {
    try {
      return this.resolve(token);
    } catch {
      return undefined;
    }
  }

  /** internal hooks for container */
  _getCached(token: InjectionToken<any>): any | undefined {
    return this.cache.get(token);
  }

  _setCached(token: InjectionToken<any>, value: any, onDispose?: ServiceRegistration["onDispose"]) {
    this.cache.set(token, value);
    // track for disposal if object looks disposable or onDispose provided
    const hasDispose =
      value && (typeof (value as DisposableSync).dispose === "function" || typeof (value as DisposableAsync).dispose === "function");
    if (hasDispose || onDispose) this.disposables.push({ token, value, onDispose });
  }

  async dispose(): Promise<void> {
    const jobs = this.disposables.splice(0).reverse(); // LIFO
    for (const job of jobs) {
      try {
        if (job.onDispose) await job.onDispose(job.token, job.value);
      } catch { /* swallow */ }
      try {
        if (job.value && typeof job.value.dispose === "function") {
          await job.value.dispose();
        }
      } catch { /* swallow */ }
    }
    this.cache.clear();
  }
}

export class DefaultContainer implements Container {
  /** root scope caches singletons; child scopes cache scoped/transient */
  private readonly rootScope: DefaultScope;
  /** registrations; may be shadowed by overrides */
  private readonly registrations: Map<InjectionToken<any>, ServiceRegistration<any>> = new Map();
  /** runtime overrides for tests */
  private readonly overrides: Map<InjectionToken<any>, Provider<any>> = new Map();
  /** resolve middlewares */
  private readonly interceptors: ResolveInterceptor[] = [];

  constructor() {
    this.rootScope = new DefaultScope(this, "root");
  }

  /* ----- public API ----- */

  register<ServiceType>(registration: ServiceRegistration<ServiceType>): this {
    const normalized: ServiceRegistration<ServiceType> = {
      lifetime: "transient",
      lazy: true,
      ...registration,
    };
    this.registrations.set(registration.token, normalized);
    return this;
  }

  registerMany(registrations: ServiceRegistration<any>[]): this {
    registrations.forEach((r) => this.register(r));
    return this;
  }

  resolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType {
    return this._resolveInternal(token, this.rootScope, []);
  }

  resolveAsync<ServiceType>(token: InjectionToken<ServiceType>): Promise<ServiceType> {
    return this._resolveInternalAsync(token, this.rootScope, []);
  }

  tryResolve<ServiceType>(token: InjectionToken<ServiceType>): ServiceType | undefined {
    try {
      return this.resolve(token);
    } catch {
      return undefined;
    }
  }

  resolveAllByTag(tag: string): any[] {
    const hits: any[] = [];
    for (const reg of this.registrations.values()) {
      if (reg.tags?.includes(tag)) {
        hits.push(this.resolve(reg.token));
      }
    }
    return hits;
  }

  createScope(options?: { id?: string; parent?: Scope }): Scope {
    return new DefaultScope(this, options?.id, options?.parent);
  }

  addInterceptor(interceptor: ResolveInterceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  verify(): void {
    // Build dependency edges from explicit deps
    const graph = this.exportGraph();
    // Toposort & cycle detection (Kahn’s algorithm)
    const inDegree = new Map<InjectionToken<any>, number>();
    const adj = new Map<InjectionToken<any>, InjectionToken<any>[]>();

    for (const node of graph) {
      inDegree.set(node.token, inDegree.get(node.token) ?? 0);
      for (const dep of node.dependsOn) {
        if (!this.isRegistered(dep)) {
          throw new Error(`Unbound dependency: ${String(dep)} required by ${String(node.token)}`);
        }
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
        const list = adj.get(node.token) ?? [];
        list.push(dep);
        adj.set(node.token, list);
      }
    }

    const queue: InjectionToken<any>[] = [];
    for (const [token, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(token);
    }

    let visited = 0;
    while (queue.length) {
      const token = queue.shift()!;
      visited++;
      for (const dep of adj.get(token) ?? []) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) - 1);
        if (inDegree.get(dep) === 0) queue.push(dep);
      }
    }
    if (visited !== inDegree.size) {
      throw new Error(`Cycle detected in dependency graph`);
    }

    // Eager-create non-lazy singletons
    for (const reg of this.registrations.values()) {
      if (reg.lifetime === "singleton" && reg.lazy === false) {
        void this.resolve(reg.token);
      }
    }
  }

  exportGraph(): DependencyGraphNode[] {
    const nodes: DependencyGraphNode[] = [];
    for (const reg of this.registrations.values()) {
      const deps =
        "deps" in reg.provider && Array.isArray(reg.provider.deps)
          ? (reg.provider.deps as InjectionToken<any>[])
          : [];
      nodes.push({
        token: reg.token,
        dependsOn: deps,
        lifetime: reg.lifetime ?? "transient",
      });
    }
    return nodes;
  }

  isRegistered(token: InjectionToken<any>): boolean {
    return this.registrations.has(token);
  }

  withOverrides(overrides: Map<InjectionToken<any>, Provider<any>>): Container {
    const clone = new DefaultContainer();
    // copy registrations
    for (const [k, v] of this.registrations.entries()) clone.registrations.set(k, v);
    // copy interceptors
    for (const m of this.interceptors) clone.interceptors.push(m);
    // set overrides
    for (const [k, v] of overrides.entries()) clone.overrides.set(k, v);
    return clone;
  }

  async install(moduleInstaller: { name?: string; install: (container: Container) => void | Promise<void> }): Promise<void> {
    await moduleInstaller.install(this);
  }

  async dispose(): Promise<void> {
    await this.rootScope.dispose();
  }

  /* ----- internal resolution engine ----- */

  _lookupRegistration<ServiceType>(token: InjectionToken<ServiceType>): ServiceRegistration<ServiceType> {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new ResolutionError(token, [], `No registration found for ${String(token)}`);
    }
    return registration;
  }

  /** Sync resolution for sync providers */
  _resolveInternal<ServiceType>(
    token: InjectionToken<ServiceType>,
    scope: DefaultScope,
    path: InjectionToken<any>[]
  ): ServiceType {
    // singleton cache (rootScope)
    const reg = this._lookupRegistration(token);

    const useProvider = this.overrides.get(token) ?? reg.provider;

    // lifetime caches
    const cacheScope = reg.lifetime === "singleton" ? this.rootScope : reg.lifetime === "scoped" ? scope : undefined;
    if (cacheScope) {
      const cached = cacheScope._getCached(token);
      if (cached !== undefined) return cached;
    }

    const context: ResolveContext = { container: this, scope, resolving: token, path: [...path, token] };

    // Interceptor chain
    const executeFactory = async (): Promise<ServiceType> => {
      // circular guard
      if (path.includes(token)) throw new CircularDependencyError(token, path);

      // build instance
      let instance: any;
      if ("useValue" in useProvider) {
        instance = useProvider.useValue;
      } else if ("useClass" in useProvider) {
        instance = new useProvider.useClass();
      } else if ("useFactory" in useProvider) {
        const maybe = useProvider.useFactory(context);
        instance = maybe instanceof Promise ? await maybe : maybe;
      } else {
        throw new ResolutionError(token, path, `Unknown provider type for ${String(token)}`);
      }

      // onInit
      if (reg.onInit) await reg.onInit(instance, context);

      // cache & disposal tracking
      if (cacheScope) cacheScope._setCached(token, instance, reg.onDispose);
      return instance;
    };

    const runWithInterceptors = this._composeInterceptors(token, executeFactory, context);
    const maybePromise = runWithInterceptors();

    if (maybePromise instanceof Promise) {
      // allow sync API to use async provider? -> throw explicit
      throw new ResolutionError(
        token,
        path,
        `Tried to resolve async provider via sync resolve(). Use resolveAsync() for ${String(token)}.`
      );
    }
    return maybePromise as ServiceType;
  }

  /** Async-safe resolution (works for all provider kinds) */
  async _resolveInternalAsync<ServiceType>(
    token: InjectionToken<ServiceType>,
    scope: DefaultScope,
    path: InjectionToken<any>[]
  ): Promise<ServiceType> {
    try {
      // fast path if provider is sync and cached
      return this._resolveInternal(token, scope, path);
    } catch (e: any) {
      // If error says "Use resolveAsync", we perform the async path
      const reg = this._lookupRegistration(token);
      const useProvider = this.overrides.get(token) ?? reg.provider;
      const cacheScope = reg.lifetime === "singleton" ? this.rootScope : reg.lifetime === "scoped" ? scope : undefined;

      if (!(e instanceof ResolutionError) || !String(e.message).includes("Use resolveAsync")) {
        // not the sync-vs-async error -> rethrow
        throw e;
      }

      // check cache again (race)
      if (cacheScope) {
        const cached = cacheScope._getCached(token);
        if (cached !== undefined) return cached;
      }

      const context: ResolveContext = { container: this, scope, resolving: token, path: [...path, token] };

      const executeFactory = async (): Promise<ServiceType> => {
        if (path.includes(token)) throw new CircularDependencyError(token, path);

        let instance: any;
        if ("useValue" in useProvider) {
          instance = useProvider.useValue;
        } else if ("useClass" in useProvider) {
          instance = new useProvider.useClass();
        } else if ("useFactory" in useProvider) {
          instance = await useProvider.useFactory(context);
        } else {
          throw new ResolutionError(token, path, `Unknown provider type for ${String(token)}`);
        }

        if (reg.onInit) await reg.onInit(instance, context);
        if (cacheScope) cacheScope._setCached(token, instance, reg.onDispose);
        return instance;
      };

      const chain = this._composeInterceptors(token, executeFactory, context);
      return chain();
    }
  }

  private _composeInterceptors<ServiceType>(
    token: InjectionToken<ServiceType>,
    executor: () => Promise<ServiceType>,
    context: ResolveContext
  ): (() => Promise<ServiceType>) | (() => ServiceType) {
    if (this.interceptors.length === 0) return executor;

    const chain = this.interceptors.reduceRight(
      (next, interceptor) => {
        return () => interceptor.intercept(token, next, context);
      },
      executor
    );
    return chain;
  }
}

/* =========================
   Injector Bridge
   ========================= */

export interface InjectorBridge {
  injectIntoInstance<HostType extends object>(
    instance: HostType,
    propertyToTokenMap: Partial<Record<keyof HostType, InjectionToken<any>>>,
    scope?: Scope
  ): Promise<HostType>;
}

export function createInjectorBridge(container: Container): InjectorBridge {
  return {
    async injectIntoInstance(instance, propertyToTokenMap, scope) {
      const activeScope = (scope as DefaultScope) ?? (container as DefaultContainer).createScope();
      for (const [propertyKey, token] of Object.entries(propertyToTokenMap)) {
        if (!token) continue;
        const value = await activeScope.resolveAsync(token as InjectionToken<any>);
        (instance as any)[propertyKey] = value;
      }
      return instance;
    },
  };
}

/* =========================
   Example Usage (optional)
   ========================= */

// Tokens
export const TOKENS = {
  Logger: createInjectionToken<{ info(msg: string): void }>("Logger"),
  Config: createInjectionToken<{ baseUrl: string }>("Config"),
};

// Build container
export const container = new DefaultContainer()
  .addInterceptor({
    async intercept(token, next, context) {
      const start = performance.now?.() ?? Date.now();
      const value = await next();
      const end = performance.now?.() ?? Date.now();
      // Simple timing; replace with your logger if needed
      // console.debug(`[DI] ${String(token)} resolved in ${(end - start).toFixed(2)}ms (scope=${context.scope.id})`);
      return value;
    },
  })
  .register({
    token: TOKENS.Logger,
    provider: { useValue: { info: (m: string) => console.log(`[LOG] ${m}`) } },
    lifetime: "singleton",
  })
  .register({
    token: TOKENS.Config,
    provider: { useFactory: () => ({ baseUrl: "/api" }) },
    lifetime: "singleton",
  });

// Verify the graph (and eagerly create non-lazy singletons if configured)
container.verify();

// Create bridge for foreign instances (e.g., Foundry sheets)
export const injectorBridge = createInjectorBridge(container);

/*
Usage:
class MySheet {
  public logger!: { info(msg: string): void };
  public config!: { baseUrl: string };
}
const sheet = new MySheet();
await injectorBridge.injectIntoInstance(sheet, { logger: TOKENS.Logger, config: TOKENS.Config });
sheet.logger.info(`Ready at ${sheet.config.baseUrl}`);
*/
```

---

### Was ist implementiert?

* **Container/Scope**: Caches nach Lifetime; `createScope()` für Request/Client-Kontexte.
* **Registrations**: `Class | Factory | Value`, `onInit`/`onDispose`, `tags`, `lazy`.
* **Interceptors**: beliebige Kette, z. B. Logging/Tracing/Caching.
* **Verify()**: baut einen **DAG** aus expliziten `deps` und prüft Zyklen/Unbound-Deps; kann non-lazy Singletons eager laden.
* **Disposal**: Scopes tracken Disposables und custom `onDispose`. Root-`dispose()` räumt Singletons.
* **Injector-Bridge**: versorgt *fremd* instanzierte Objekte (Foundry Sheets etc.) mit Services.

Wenn du möchtest, erstelle ich dir als nächsten Schritt noch:

* eine **Test-/Demo-Datei** mit ein paar Services (Repository, Service, Controller) inkl. `deps` und einem **Toposort-Export**,
* oder eine **kleine “verify report”**-Funktion, die dir die Reihenfolge und Kanten als Text/Graph ausgibt.
