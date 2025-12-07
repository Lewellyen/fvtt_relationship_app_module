import { describe, it, expect } from "vitest";
import { platformValidationPortToken } from "../platform-validation-port.token";
import { createTestContainer } from "@/test/utils/test-helpers";
import { markAsApiSafe } from "@/infrastructure/di/types";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { ok } from "@/domain/utils/result";
import { LogLevel } from "@/domain/types/log-level";

describe("platformValidationPortToken", () => {
  it("should export a valid injection token", () => {
    // Verify token exists and is defined
    expect(platformValidationPortToken).toBeDefined();
    expect(typeof platformValidationPortToken).toBe("symbol");
  });

  it("should be usable for container registration and resolution", () => {
    const container = createTestContainer();

    // Create a mock implementation
    const mockValidationPort: PlatformValidationPort = {
      validateLogLevel: () => ok(LogLevel.INFO),
    };

    // Register the token
    container.registerValue(platformValidationPortToken, mockValidationPort);
    container.validate();

    // Resolve using API-safe token
    const apiToken = markAsApiSafe(platformValidationPortToken);
    const resolved = container.resolve(apiToken);

    expect(resolved).toBe(mockValidationPort);
    expect(resolved.validateLogLevel).toBeDefined();
    expect(typeof resolved.validateLogLevel).toBe("function");
  });
});
