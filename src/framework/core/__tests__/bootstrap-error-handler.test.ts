import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapErrorHandler, type ErrorContext } from "@/framework/core/bootstrap-error-handler";

describe("BootstrapErrorHandler", () => {
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logError", () => {
    it("should log error with minimal context", () => {
      const error = "Test error message";
      const context: ErrorContext = {
        phase: "bootstrap",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleGroupSpy).toHaveBeenCalledTimes(1);
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
      expect(consoleGroupSpy).toHaveBeenCalledWith(expect.stringContaining("Error in bootstrap"));
    });

    it("should log error with component", () => {
      const error = new Error("Test error");
      const context: ErrorContext = {
        phase: "initialization",
        component: "CompositionRoot",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleGroupSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Component:", "CompositionRoot");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });

    it("should log error with metadata", () => {
      const error = "Test error";
      const context: ErrorContext = {
        phase: "runtime",
        metadata: {
          foundryVersion: 13,
          moduleId: "test-module",
        },
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
        foundryVersion: 13,
        moduleId: "test-module",
      });
    });

    it("should log error with all context fields", () => {
      const error = new Error("Complete error");
      const context: ErrorContext = {
        phase: "bootstrap",
        component: "ServiceContainer",
        metadata: {
          foundryVersion: 13.291,
          errorCode: "PORT_SELECTION_FAILED",
        },
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleGroupSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Component:", "ServiceContainer");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", context.metadata);
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle error as string", () => {
      const error = "String error message";
      const context: ErrorContext = {
        phase: "bootstrap",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });

    it("should handle error as Error object", () => {
      const error = new Error("Error object");
      const context: ErrorContext = {
        phase: "bootstrap",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });

    it("should handle error as unknown type", () => {
      const error = { custom: "error object" };
      const context: ErrorContext = {
        phase: "bootstrap",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });

    it("should not log metadata when metadata is empty object", () => {
      const error = "Test error";
      const context: ErrorContext = {
        phase: "bootstrap",
        metadata: {},
      };

      BootstrapErrorHandler.logError(error, context);

      // Should not call console.error with "Metadata:"
      const metadataCall = consoleErrorSpy.mock.calls.find(
        (call: unknown[]) => call[0] === "Metadata:"
      );
      expect(metadataCall).toBeUndefined();
    });

    it("should include timestamp in group message", () => {
      const error = "Test error";
      const context: ErrorContext = {
        phase: "bootstrap",
      };

      BootstrapErrorHandler.logError(error, context);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it("should handle all phase types", () => {
      const phases: Array<ErrorContext["phase"]> = ["bootstrap", "initialization", "runtime"];

      phases.forEach((phase) => {
        BootstrapErrorHandler.logError("Test", { phase });
        expect(consoleGroupSpy).toHaveBeenCalledWith(expect.stringContaining(`Error in ${phase}`));
      });
    });
  });
});
