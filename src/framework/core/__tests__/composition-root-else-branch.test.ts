// Test file: Tests the else branch in composition-root.ts tryLogBootstrapCompletion method
// This test file tests the extracted method directly for better control

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "@/framework/core/composition-root";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";

describe("CompositionRoot - else branch coverage (logger not available)", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        ["fvtt_relationship_app_module", { id: "fvtt_relationship_app_module", api: undefined }],
      ]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should handle logger resolution failure in tryLogBootstrapCompletion (else branch)", () => {
    // This test directly tests the tryLogBootstrapCompletion method
    // by creating a mock container that returns { ok: false } for platformLoggingPortToken

    const root = new CompositionRoot();

    // Create a mock container that returns { ok: false } for platformLoggingPortToken
    const mockContainer = {
      resolveWithError: vi.fn((token: symbol) => {
        if (token === platformLoggingPortToken) {
          return {
            ok: false as const,
            error: {
              code: "TokenNotRegistered" as const,
              message: "Logger not available",
            },
          };
        }
        return { ok: true as const, value: {} };
      }),
    } as unknown as ServiceContainer;

    // Call the method directly - it's now public for testability
    // This tests the else branch when logger resolution fails
    root.tryLogBootstrapCompletion(mockContainer, 123.45);

    // Verify that resolveWithError was called with platformLoggingPortToken
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(platformLoggingPortToken);

    // The else branch was executed - no logger.debug() was called
    // (we can't easily verify this, but the coverage tool will show it)
  });
});
