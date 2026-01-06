import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApiBootstrapper } from "../api-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { moduleApiInitializerToken } from "@/infrastructure/shared/tokens/infrastructure/module-api-initializer.token";
import { ok, err } from "@/domain/utils/result";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";

describe("ApiBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockApiInitializer: ModuleApiInitializer;

  beforeEach(() => {
    mockApiInitializer = {
      expose: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as ModuleApiInitializer;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue(ok(mockApiInitializer)),
    } as unknown as PlatformContainerPort;
  });

  it("should expose API successfully", () => {
    const result = ApiBootstrapper.exposeApi(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(moduleApiInitializerToken);
    expect(mockApiInitializer.expose).toHaveBeenCalledWith(mockContainer);
  });

  it("should return error when ModuleApiInitializer cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "ModuleApiInitializer not found",
        tokenDescription: String(moduleApiInitializerToken),
      })
    );

    const result = ApiBootstrapper.exposeApi(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to resolve ModuleApiInitializer");
      expect(result.error).toContain("ModuleApiInitializer not found");
    }
    expect(mockApiInitializer.expose).not.toHaveBeenCalled();
  });

  it("should return error when expose fails", () => {
    vi.mocked(mockApiInitializer.expose).mockReturnValue(err("Expose failed"));

    const result = ApiBootstrapper.exposeApi(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to expose API");
      expect(result.error).toContain("Expose failed");
    }
  });
});
