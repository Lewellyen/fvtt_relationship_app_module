import { createInjectionToken } from "@/application/utils/token-factory";
import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { IStateStore } from "@/domain/windows/ports/state-store-port.interface";
import type { IActionDispatcher } from "@/domain/windows/ports/action-dispatcher-port.interface";
import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { IBindingEngine } from "@/domain/windows/ports/binding-engine-port.interface";
import type { IViewModelBuilder } from "@/domain/windows/ports/view-model-builder-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { IFoundryWindowAdapter } from "@/domain/windows/ports/foundry-window-adapter.interface";
import type { IStatePortFactory } from "../ports/state-port-factory-port.interface";
import type { ISharedDocumentCache } from "../ports/shared-document-cache-port.interface";
import type { IWindowHooksBridge } from "../ports/window-hooks-bridge-port.interface";
import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";
import type { IWindowRendererCoordinator } from "../ports/window-renderer-coordinator-port.interface";
import type { IWindowPersistenceCoordinator } from "../ports/window-persistence-coordinator-port.interface";
import type { IWindowDefaultStateProviderRegistry } from "../services/window-default-state-provider-registry.interface";

/**
 * Window Framework DI Tokens
 */

export const windowFactoryToken = createInjectionToken<IWindowFactory>("WindowFactory");
export const windowRegistryToken = createInjectionToken<IWindowRegistry>("WindowRegistry");
export const windowControllerToken = createInjectionToken<IWindowController>("WindowController");
export const eventBusToken = createInjectionToken<IEventBus>("EventBus");
export const stateStoreToken = createInjectionToken<IStateStore>("StateStore");
export const actionDispatcherToken = createInjectionToken<IActionDispatcher>("ActionDispatcher");
export const rendererRegistryToken = createInjectionToken<IRendererRegistry>("RendererRegistry");
export const bindingEngineToken = createInjectionToken<IBindingEngine>("BindingEngine");
export const viewModelBuilderToken = createInjectionToken<IViewModelBuilder>("ViewModelBuilder");
export const remoteSyncGateToken = createInjectionToken<IRemoteSyncGate>("RemoteSyncGate");
export const persistAdapterToken = createInjectionToken<IPersistAdapter>("PersistAdapter");
export const foundryWindowAdapterToken =
  createInjectionToken<IFoundryWindowAdapter>("FoundryWindowAdapter");
export const statePortFactoryToken = createInjectionToken<IStatePortFactory>("StatePortFactory");
export const sharedDocumentCacheToken =
  createInjectionToken<ISharedDocumentCache>("SharedDocumentCache");
export const windowPositionManagerToken =
  createInjectionToken<
    import("@/domain/windows/ports/window-position-manager-port.interface").IWindowPositionManager
  >("WindowPositionManager");

export const windowHooksBridgeToken = createInjectionToken<IWindowHooksBridge>("WindowHooksBridge");

export const windowDefaultStateProviderRegistryToken =
  createInjectionToken<IWindowDefaultStateProviderRegistry>("WindowDefaultStateProviderRegistry");
export const windowStateInitializerToken =
  createInjectionToken<IWindowStateInitializer>("WindowStateInitializer");
export const windowRendererCoordinatorToken = createInjectionToken<IWindowRendererCoordinator>(
  "WindowRendererCoordinator"
);
export const windowPersistenceCoordinatorToken =
  createInjectionToken<IWindowPersistenceCoordinator>("WindowPersistenceCoordinator");

// WindowHooksService Token
// Type import vermeidet zirkuläre Abhängigkeit (window-hooks-service.ts importiert diese Tokens)
export const windowHooksServiceToken = createInjectionToken<{
  register(): void;
  unregister(): void;
}>("WindowHooksService");
