import type { IFoundryWindowAdapter } from "@/domain/windows/ports/foundry-window-adapter.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import { FoundryApplicationWrapper } from "./foundry-application-wrapper";
import { ok, err } from "@/domain/utils/result";

/**
 * FoundryWindowAdapter - IFoundryWindowAdapter Implementierung
 */
export class FoundryWindowAdapter implements IFoundryWindowAdapter {
  buildApplicationWrapper(
    definition: WindowDefinition,
    controller: IWindowController,
    instanceId: string
  ): import("@/domain/types/result").Result<
    import("@/domain/windows/types/application-v2.interface").ApplicationClass,
    WindowError
  > {
    try {
      const appClass = FoundryApplicationWrapper.build(definition, controller, instanceId);
      return ok(appClass);
    } catch (error) {
      return err({
        code: "BuildApplicationFailed",
        message: `Failed to build application wrapper: ${String(error)}`,
        cause: error,
      });
    }
  }

  async renderWindow(
    instance: WindowInstance,
    force?: boolean
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (!instance.foundryApp) {
      return err({
        code: "NoFoundryApp",
        message: "FoundryApp not set on instance",
      });
    }

    try {
      // Neue Foundry API: render({ force: true }) statt render(true)
      await instance.foundryApp.render({ force: force ?? false });
      return ok(undefined);
    } catch (error) {
      return err({
        code: "RenderFailed",
        message: `Failed to render window: ${String(error)}`,
        cause: error,
      });
    }
  }

  async closeWindow(
    instance: WindowInstance
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    if (!instance.foundryApp) {
      return err({
        code: "NoFoundryApp",
        message: "FoundryApp not set on instance",
      });
    }

    try {
      await instance.foundryApp.close();
      return ok(undefined);
    } catch (error) {
      return err({
        code: "CloseFailed",
        message: `Failed to close window: ${String(error)}`,
        cause: error,
      });
    }
  }
}
