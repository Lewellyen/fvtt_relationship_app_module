import { describe, it, expect } from "vitest";
import {
  CircularDependencyError,
  ScopeRequiredError,
  InvalidLifecycleError,
  FactoryFailedError,
} from "../ContainerErrors";

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
});
