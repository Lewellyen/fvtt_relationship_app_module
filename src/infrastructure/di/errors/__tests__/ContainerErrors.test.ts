import { describe, it, expect } from "vitest";
import {
  CircularDependencyError,
  ScopeRequiredError,
  InvalidLifecycleError,
  FactoryFailedError,
} from "@/infrastructure/di/errors/ContainerErrors";
import { ContainerErrorImpl } from "@/infrastructure/di/errors/ContainerErrorImpl";
import type { ContainerError } from "@/infrastructure/di/interfaces";

describe("ContainerErrors", () => {
  const testToken = Symbol("TestToken");

  describe("CircularDependencyError", () => {
    it("should create error with message and token", () => {
      const error = new CircularDependencyError("Circular: A -> B -> A", testToken);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("CircularDependencyError");
      expect(error.message).toBe("Circular: A -> B -> A");
      expect(error.token).toBe(testToken);
    });

    it("should propagate error cause", () => {
      const cause = new Error("Root cause");
      const error = new CircularDependencyError("Circular dependency", testToken, cause);

      expect(error.message).toBe("Circular dependency");
      expect(error.errorCause).toBe(cause);
    });
  });

  describe("ScopeRequiredError", () => {
    it("should create error with message", () => {
      const error = new ScopeRequiredError("Scoped service requires a scope", testToken);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ScopeRequiredError");
      expect(error.message).toBe("Scoped service requires a scope");
      expect(error.token).toBe(testToken);
    });

    it("should propagate error cause", () => {
      const cause = new Error("Scope error");
      const error = new ScopeRequiredError("Scope required", testToken, cause);

      expect(error.errorCause).toBe(cause);
    });
  });

  describe("InvalidLifecycleError", () => {
    it("should create error with message", () => {
      const lifecycle = "unknown";
      const error = new InvalidLifecycleError("Invalid lifecycle: unknown", lifecycle);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("InvalidLifecycleError");
      expect(error.message).toBe("Invalid lifecycle: unknown");
      expect(error.lifecycle).toBe(lifecycle);
    });

    it("should propagate error cause", () => {
      const cause = new Error("Lifecycle error");
      const lifecycle = "unknown";
      const error = new InvalidLifecycleError("Invalid lifecycle", lifecycle, cause);

      expect(error.errorCause).toBe(cause);
    });
  });

  describe("FactoryFailedError", () => {
    it("should create error with message", () => {
      const error = new FactoryFailedError("Factory threw exception", testToken);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("FactoryFailedError");
      expect(error.message).toBe("Factory threw exception");
      expect(error.token).toBe(testToken);
    });

    it("should propagate error cause", () => {
      const cause = new Error("Factory error");
      const error = new FactoryFailedError("Factory failed", testToken, cause);

      expect(error.errorCause).toBe(cause);
    });

    it("should handle non-Error causes", () => {
      const cause = "String error";
      const error = new FactoryFailedError("Factory failed", testToken, cause);

      expect(error.errorCause).toBe(cause);
    });
  });

  describe("Error inheritance", () => {
    it("should be instances of Error", () => {
      const testSym = Symbol("test");
      expect(new CircularDependencyError("test", testSym)).toBeInstanceOf(Error);
      expect(new ScopeRequiredError("test", testSym)).toBeInstanceOf(Error);
      expect(new InvalidLifecycleError("test", "lifecycle")).toBeInstanceOf(Error);
      expect(new FactoryFailedError("test", testSym)).toBeInstanceOf(Error);
    });

    it("should have correct constructor names", () => {
      const testSym = Symbol("test");
      expect(new CircularDependencyError("test", testSym).constructor.name).toBe(
        "CircularDependencyError"
      );
      expect(new ScopeRequiredError("test", testSym).constructor.name).toBe("ScopeRequiredError");
      expect(new InvalidLifecycleError("test", "lifecycle").constructor.name).toBe(
        "InvalidLifecycleError"
      );
      expect(new FactoryFailedError("test", testSym).constructor.name).toBe("FactoryFailedError");
    });
  });

  describe("ContainerErrorImpl", () => {
    it("should create error with ContainerError interface", () => {
      const containerError: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found",
        tokenDescription: "LoggerToken",
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ContainerError");
      expect(error.message).toBe("Service not found");
      expect(error.code).toBe("TokenNotRegistered");
      expect(error.tokenDescription).toBe("LoggerToken");
    });

    it("should implement ContainerError interface", () => {
      const containerError: ContainerError = {
        code: "NotValidated",
        message: "Container must be validated",
        tokenDescription: "TestToken",
        cause: new Error("Root cause"),
        timestamp: 1234567890,
        containerScope: "root",
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error.code).toBe("NotValidated");
      expect(error.message).toBe("Container must be validated");
      expect(error.tokenDescription).toBe("TestToken");
      expect(error.cause).toBe(containerError.cause);
      expect(error.timestamp).toBe(1234567890);
      expect(error.containerScope).toBe("root");
    });

    it("should preserve stack trace if provided", () => {
      const stack = "Error: test\n    at test.ts:1:1";
      const containerError: ContainerError = {
        code: "InvalidOperation",
        message: "Test error",
        stack,
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error.stack).toBe(stack);
    });

    it("should use default Error.stack if not provided", () => {
      const containerError: ContainerError = {
        code: "InvalidOperation",
        message: "Test error",
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });

    it("should be instance of Error", () => {
      const containerError: ContainerError = {
        code: "Disposed",
        message: "Container disposed",
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error).toBe(true);
    });

    it("should handle optional fields", () => {
      const containerError: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found",
        // No optional fields
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error.code).toBe("TokenNotRegistered");
      expect(error.message).toBe("Service not found");
      expect(error.tokenDescription).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.timestamp).toBeUndefined();
      expect(error.containerScope).toBeUndefined();
    });

    it("should handle details field when provided", () => {
      const details = { failedChildren: ["child1", "child2"] };
      const containerError: ContainerError = {
        code: "PartialDisposal",
        message: "Some children failed to dispose",
        details,
      };

      const error = new ContainerErrorImpl(containerError);

      expect(error.code).toBe("PartialDisposal");
      expect(error.details).toBe(details);
      expect(error.details).toEqual({ failedChildren: ["child1", "child2"] });
    });
  });
});
