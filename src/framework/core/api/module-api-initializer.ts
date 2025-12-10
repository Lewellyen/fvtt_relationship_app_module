import { MODULE_METADATA } from "@/application/constants/app-constants";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ModuleApiInitializer as IModuleApiInitializer } from "@/infrastructure/shared/types/module-api-initializer.interface";
import { ModuleApiBuilder } from "./builder/module-api-builder";
import { ServiceWrapperFactory } from "./wrappers/service-wrapper-factory";
import { DeprecationHandler } from "./deprecation/deprecation-handler";
import { ApiServiceResolver } from "./resolution/api-service-resolver";
import { ApiHealthMetricsProvider } from "./health/api-health-metrics-provider";

/**
 * ModuleApiInitializer
 *
 * Facade for exposing the module's public API to external consumers.
 * Coordinates all API-related components following Single Responsibility Principle.
 *
 * Responsibilities (delegated to specialized components):
 * - ModuleApiBuilder: Creates API objects and token collections
 * - ServiceWrapperFactory: Applies read-only wrappers for sensitive services
 * - DeprecationHandler: Handles deprecation warnings
 * - ApiServiceResolver: Creates resolve functions
 * - ApiHealthMetricsProvider: Provides health and metrics information
 *
 * This class acts as a pure Facade - it only coordinates the components
 * and exposes the API to game.modules.get(MODULE_ID).api
 *
 * Design: Uses dependency injection for all components, uses Result-Pattern for error handling.
 */
export class ModuleApiInitializer implements IModuleApiInitializer {
  static dependencies = [] as const;

  private readonly deprecationHandler: DeprecationHandler;
  private readonly serviceWrapperFactory: ServiceWrapperFactory;
  private readonly apiServiceResolver: ApiServiceResolver;
  private readonly healthMetricsProvider: ApiHealthMetricsProvider;
  private readonly apiBuilder: ModuleApiBuilder;

  constructor(
    deprecationHandler?: DeprecationHandler,
    serviceWrapperFactory?: ServiceWrapperFactory,
    apiServiceResolver?: ApiServiceResolver,
    healthMetricsProvider?: ApiHealthMetricsProvider,
    apiBuilder?: ModuleApiBuilder
  ) {
    // Initialize components with dependency injection or create defaults
    this.deprecationHandler = deprecationHandler ?? new DeprecationHandler();
    this.serviceWrapperFactory = serviceWrapperFactory ?? new ServiceWrapperFactory();
    this.apiServiceResolver =
      apiServiceResolver ??
      new ApiServiceResolver(this.deprecationHandler, this.serviceWrapperFactory);
    this.healthMetricsProvider = healthMetricsProvider ?? new ApiHealthMetricsProvider();
    this.apiBuilder =
      apiBuilder ?? new ModuleApiBuilder(this.apiServiceResolver, this.healthMetricsProvider);
  }

  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   *
   * This method coordinates all components to create and expose the API.
   * It acts as a Facade, delegating to specialized components.
   *
   * @param container - Initialized and validated PlatformContainerPort
   * @returns Result<void, string> - Ok if successful, Err with error message
   */
  expose(container: PlatformContainerPort): Result<void, string> {
    // Guard: Foundry game object available?
    if (typeof game === "undefined" || !game?.modules) {
      return err("Game modules not available - API cannot be exposed");
    }

    const mod = game.modules.get(MODULE_METADATA.ID);
    if (!mod) {
      return err(`Module '${MODULE_METADATA.ID}' not found in game.modules`);
    }

    // Create well-known tokens collection (delegated to builder)
    const wellKnownTokens = this.apiBuilder.createApiTokens();

    // Create complete API object (delegated to builder)
    const api = this.apiBuilder.createApi(container, wellKnownTokens);

    // Expose API to Foundry module
    mod.api = api;

    return ok(undefined);
  }
}

export class DIModuleApiInitializer extends ModuleApiInitializer {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
