import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * WindowRegistry - Verwaltet WindowDefinitions (statisch) + WindowInstances (dynamisch)
 */
export class WindowRegistry implements IWindowRegistry {
  private readonly definitions = new Map<string, WindowDefinition>();
  private readonly instances = new Map<string, WindowInstance>();

  registerDefinition(
    definition: WindowDefinition
  ): import("@/domain/types/result").Result<void, WindowError> {
    if (this.definitions.has(definition.definitionId)) {
      return err({
        code: "DefinitionAlreadyExists",
        message: `Definition ${definition.definitionId} already exists`,
      });
    }

    this.definitions.set(definition.definitionId, definition);
    return ok(undefined);
  }

  getDefinition(
    definitionId: string
  ): import("@/domain/types/result").Result<WindowDefinition, WindowError> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      return err({
        code: "DefinitionNotFound",
        message: `Definition ${definitionId} not found`,
      });
    }

    return ok(definition);
  }

  registerInstance(
    instance: WindowInstance
  ): import("@/domain/types/result").Result<void, WindowError> {
    if (this.instances.has(instance.instanceId)) {
      return err({
        code: "InstanceAlreadyExists",
        message: `Instance ${instance.instanceId} already exists`,
      });
    }

    this.instances.set(instance.instanceId, instance);
    return ok(undefined);
  }

  getInstance(
    instanceId: string
  ): import("@/domain/types/result").Result<WindowInstance, WindowError> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return err({
        code: "InstanceNotFound",
        message: `Instance ${instanceId} not found`,
      });
    }

    return ok(instance);
  }

  unregisterInstance(
    instanceId: string
  ): import("@/domain/types/result").Result<void, WindowError> {
    if (!this.instances.has(instanceId)) {
      return err({
        code: "InstanceNotFound",
        message: `Instance ${instanceId} not found`,
      });
    }

    this.instances.delete(instanceId);
    return ok(undefined);
  }

  listInstances(): ReadonlyArray<WindowInstance> {
    return Array.from(this.instances.values());
  }

  listInstancesByDefinition(definitionId: string): ReadonlyArray<WindowInstance> {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.definitionId === definitionId
    );
  }
}
