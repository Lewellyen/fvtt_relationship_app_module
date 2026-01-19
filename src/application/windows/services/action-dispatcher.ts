import type { IActionDispatcher } from "@/domain/windows/ports/action-dispatcher-port.interface";
import type {
  ActionContext,
  ActionDefinition,
  PermissionCheck,
} from "@/domain/windows/types/action-definition.interface";
import type { ActionError } from "@/domain/windows/types/errors/action-error.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import { ok, err } from "@/domain/utils/result";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import { windowRegistryToken } from "../tokens/window.tokens";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import { platformUIPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * ActionDispatcher - Führt Actions aus (Command-Pattern)
 *
 * Phase 2: Vollständig mit Permissions, Validation und Confirmation
 */
export class ActionDispatcher implements IActionDispatcher {
  static dependencies = [windowRegistryToken, platformUIPortToken] as const;

  constructor(
    private readonly registry: IWindowRegistry,
    private readonly ui: PlatformUIPort
  ) {}

  async dispatch(
    actionId: string,
    context: ActionContext
  ): Promise<import("@/domain/types/result").Result<void, WindowError>> {
    // Get definition to find action
    const instanceResult = this.registry.getInstance(context.windowInstanceId);
    if (!instanceResult.ok) {
      return err(instanceResult.error);
    }

    const definitionResult = this.registry.getDefinition(instanceResult.value.definitionId);
    if (!definitionResult.ok) {
      return err(definitionResult.error);
    }

    const definition = definitionResult.value;
    const action = definition.actions?.find((a) => a.id === actionId);

    if (!action) {
      return err({
        code: "ActionNotFound",
        message: `Action ${actionId} not found`,
      });
    }

    // Phase 2: Permission checks
    const permissionResult = this.checkPermissions(action, context);
    if (!permissionResult.ok) {
      return err({
        code: "PermissionDenied",
        message: permissionResult.error.message,
      });
    }

    // Phase 2: Validation
    const validationResult = this.validateAction(action, context);
    if (!validationResult.ok) {
      return err({
        code: "ValidationFailed",
        message: validationResult.error.message,
      });
    }

    // Phase 2: Confirmation (if required)
    if (action.confirm) {
      const confirmed = await this.requestConfirmation(action.confirm);
      if (!confirmed) {
        return err({
          code: "ActionCancelled",
          message: "Action was cancelled by user",
        });
      }
    }

    // Execute action handler
    const result = await action.handler(context);

    if (!result.ok) {
      return err(result.error);
    }

    return ok(undefined);
  }

  /**
   * Checks if the user has permission to execute the action
   */
  private checkPermissions(
    action: ActionDefinition,
    context: ActionContext
  ): import("@/domain/types/result").Result<void, ActionError> {
    if (!action.permissions || action.permissions.length === 0) {
      return ok(undefined);
    }

    for (const permission of action.permissions) {
      const checkResult = this.checkPermission(permission, context);
      if (!checkResult.ok) {
        return err(checkResult.error);
      }
    }

    return ok(undefined);
  }

  /**
   * Checks a single permission
   */
  private checkPermission(
    permission: PermissionCheck,
    context: ActionContext
  ): import("@/domain/types/result").Result<void, ActionError> {
    switch (permission.type) {
      case "user":
        // All authenticated users can execute
        if (typeof game === "undefined" || !game.user?.id) {
          return err({
            code: "NotAuthenticated",
            message: "User is not authenticated",
          });
        }
        return ok(undefined);

      case "gm":
        // Only Game Masters can execute
        if (typeof game === "undefined") {
          return err({
            code: "NotAuthenticated",
            message: "User is not authenticated",
          });
        }
        const user = game.user;
        if (!user) {
          return err({
            code: "NotAuthenticated",
            message: "User is not authenticated",
          });
        }

        // Check if user is GM (role >= 4 in Foundry VTT)
        const isGM = user.isGM === true || user.role >= 4;
        if (!isGM) {
          return err({
            code: "InsufficientPermissions",
            message: "This action requires Game Master permissions",
          });
        }
        return ok(undefined);

      case "custom":
        // Custom permission check function
        if (!permission.check) {
          return err({
            code: "InvalidPermission",
            message: "Custom permission check function is not defined",
          });
        }

        const hasPermission = permission.check(context);
        if (!hasPermission) {
          return err({
            code: "InsufficientPermissions",
            message: "Custom permission check failed",
          });
        }
        return ok(undefined);

      default:
        return err({
          code: "UnknownPermissionType",
          message: `Unknown permission type: ${(permission as PermissionCheck).type}`,
        });
    }
  }

  /**
   * Validates the action context against validation rules
   */
  private validateAction(
    action: ActionDefinition,
    context: ActionContext
  ): import("@/domain/types/result").Result<void, ActionError> {
    if (!action.validation || action.validation.length === 0) {
      return ok(undefined);
    }

    for (const rule of action.validation) {
      const isValid = rule.validate(context);
      if (!isValid) {
        return err({
          code: "ValidationFailed",
          message: rule.message || "Action validation failed",
        });
      }
    }

    return ok(undefined);
  }

  /**
   * Requests user confirmation before executing the action
   */
  private async requestConfirmation(confirm: {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel?: string;
    readonly cancelLabel?: string;
  }): Promise<boolean> {
    return await this.ui.confirm({
      title: confirm.title,
      message: confirm.message,
      confirmLabel: confirm.confirmLabel,
      cancelLabel: confirm.cancelLabel,
    });
  }
}
