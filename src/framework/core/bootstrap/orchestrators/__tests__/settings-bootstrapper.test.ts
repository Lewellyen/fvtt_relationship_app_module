import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsBootstrapper } from "../settings-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { moduleSettingsRegistrarToken } from "@/application/tokens/application.tokens";
import { ok, err } from "@/domain/utils/result";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";

describe("SettingsBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockSettingsRegistrar: ModuleSettingsRegistrar;

  beforeEach(() => {
    mockSettingsRegistrar = {
      registerAll: vi.fn(),
    } as unknown as ModuleSettingsRegistrar;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue(ok(mockSettingsRegistrar)),
    } as unknown as PlatformContainerPort;
  });

  it("should register settings successfully", () => {
    const result = SettingsBootstrapper.registerSettings(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(moduleSettingsRegistrarToken);
    expect(mockSettingsRegistrar.registerAll).toHaveBeenCalled();
  });

  it("should return error when ModuleSettingsRegistrar cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "ModuleSettingsRegistrar not found",
      })
    );

    const result = SettingsBootstrapper.registerSettings(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to resolve ModuleSettingsRegistrar");
      expect(result.error).toContain("ModuleSettingsRegistrar not found");
    }
    expect(mockSettingsRegistrar.registerAll).not.toHaveBeenCalled();
  });
});
